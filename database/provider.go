package dbprovider

import (
	"fmt"
	"time"

	"github.com/jamesk14022/barcrawler/types"
	"github.com/patrickmn/go-cache"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"context"
	"errors"
	"log"
	"os"
)

type Manager interface {
	AddPlace(place *types.Place) interface{}
	AddRoute(route *types.Route) interface{}
	FindRouteBetweenPlaces(start_placeID string, end_placeID string) types.Route
	FindCachedRouteBetweenPlaces(start_placeID string, end_placeID string) types.Route
	FindRoutesByCity(city string) []types.Route
	FindPlacesByCity(city string) []types.Place
	FindPlaceByID(placeID string) types.Place
	FindUniqueCities() []string
	buildDistanceCache()
}

type manager struct {
	client        *mongo.Client
	cache         *cache.Cache
	DistanceCache map[string]map[string]types.Route
}

var Mgr Manager

func init() {
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		panic(err)
	}
	// defer func() {
	// 	if err := client.Disconnect(context.TODO()); err != nil {
	// 		panic(err)
	// 	}
	// }()

	Mgr = &manager{client: client, cache: cache.New(10*time.Minute, 15*time.Minute)}
	Mgr.buildDistanceCache()
}

func (mgr *manager) AddPlace(place *types.Place) (InsertedID interface{}) {

	collection := mgr.client.Database("dev").Collection("places")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	doc, err := bson.Marshal(place)
	if err != nil {
		log.Fatal(err)
	}

	res, err := collection.InsertOne(ctx, doc)
	if err != nil {
		log.Fatal(err)
	}

	return res.InsertedID
}

func (mgr *manager) AddRoute(route *types.Route) (InsertedID interface{}) {

	collection := mgr.client.Database("dev").Collection("routes")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	doc, err := bson.Marshal(route)
	if err != nil {
		log.Fatal(err)
	}

	res, err := collection.InsertOne(ctx, doc)
	if err != nil {
		log.Fatal(err)
	}

	return res.InsertedID
}

func (mgr *manager) FindRouteBetweenPlaces(start_placeID string, end_placeID string) types.Route {

	collection := mgr.client.Database("dev").Collection("routes")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var result types.Route

	var filter bson.D
	if start_placeID <= end_placeID {
		filter = bson.D{{"point1", start_placeID}, {"point2", end_placeID}}
	} else {
		filter = bson.D{{"point1", start_placeID}, {"point2", end_placeID}}
	}

	err := collection.FindOne(ctx, filter).Decode(&result)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return types.Route{}
	} else if err != nil {
		log.Fatal(err)
	}

	return result
}

func (mgr *manager) FindRoutesByCity(city string) []types.Route {

	if cachedRoutes, found := mgr.cache.Get(city); found {
		return cachedRoutes.([]types.Route)
	}

	collection := mgr.client.Database("dev").Collection("routes")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var results []types.Route
	filter := bson.D{{"city", city}}
	cur, err := collection.Find(ctx, filter)
	if errors.Is(err, mongo.ErrNoDocuments) {
		log.Fatal(err)
		return []types.Route{}
	} else if err != nil {
		log.Fatal(err)
	}
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var route_result types.Route
		if err := cur.Decode(&route_result); err != nil {
			log.Fatal(err)
		}
		results = append(results, route_result)
	}

	mgr.cache.Set(city, results, cache.DefaultExpiration)

	return results
}

func (mgr *manager) buildDistanceCache() {
	distanceMap := make(map[string]map[string]types.Route)
	uniqueCities := Mgr.FindUniqueCities()

	for _, city := range uniqueCities {

		routes := Mgr.FindRoutesByCity(city)

		for _, r := range routes {

			if _, ok := distanceMap[r.Point1]; !ok {
				distanceMap[r.Point1] = make(map[string]types.Route)
			}
			distanceMap[r.Point1][r.Point2] = r
		}

	}
	mgr.DistanceCache = distanceMap
	fmt.Println("Distance cache built")
}

func (mgr *manager) FindCachedRouteBetweenPlaces(start_placeID string, end_placeID string) types.Route {
	return mgr.DistanceCache[start_placeID][end_placeID]
}

func (mgr *manager) FindPlaceByID(placeID string) types.Place {

	collection := mgr.client.Database("dev").Collection("places")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var result types.Place

	filter := bson.D{{"placeid", placeID}}
	err := collection.FindOne(ctx, filter).Decode(&result)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return types.Place{}
	} else if err != nil {
		log.Fatal(err)
	}

	return result
}

func (mgr *manager) FindPlacesByCity(city string) []types.Place {

	collection := mgr.client.Database("dev").Collection("places")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var results []types.Place
	filter := bson.D{{"city", city}}
	cur, err := collection.Find(ctx, filter)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return []types.Place{}
	} else if err != nil {
		log.Fatal(err)
	}
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var place_result types.Place
		if err := cur.Decode(&place_result); err != nil {
			log.Fatal(err)
		}
		results = append(results, place_result)
	}

	return results
}

func (mgr *manager) FindUniqueCities() []string {

	collection := mgr.client.Database("dev").Collection("places")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cities, err := collection.Distinct(ctx, "city", bson.D{})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Cities found: ", cities)

	listedCities := make([]string, len(cities))
	for i, v := range cities {
		listedCities[i] = v.(string)
	}
	return listedCities
}
