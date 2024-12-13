package dbprovider

import (
	"fmt"
	"time"

	"github.com/jamesk14022/barcrawler/types"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"context"
	"errors"
	"log"
	"os"
)

type Manager interface {
	AddPlace(place *types.Place) interface{}
	AddRoute(route *types.Route) interface{}
	FindRouteBetweenPlaces(start_placeID string, end_placeID string) types.Route
	FindRoutesByCity(city string) []types.Route
	FindPlacesByCity(city string) []types.Place
	FindPlaceByID(placeID string) types.Place
}

type manager struct {
	client *mongo.Client
}

var Mgr Manager

func init() {
	client, err := mongo.Connect(options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		log.Fatal("Failed to init db:", err)
	}
	Mgr = &manager{client: client}
}

func (mgr *manager) AddPlace(place *types.Place) (InsertedID interface{}) {

	collection := mgr.client.Database("dev").Collection("places")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
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
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
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
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
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
		// Do something when no record was found
		return types.Route{}
	} else if err != nil {
		log.Fatal(err)
	}

	return result
}

func (mgr *manager) FindRoutesByCity(city string) []types.Route {

	collection := mgr.client.Database("dev").Collection("routes")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var results []types.Route
	filter := bson.D{{"city", city}}
	cur, err := collection.Find(ctx, filter)
	if errors.Is(err, mongo.ErrNoDocuments) {
		// Do something when no record was found
		return []types.Route{}
	} else if err != nil {
		log.Fatal(err)
	}
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var bson_result bson.D
		var route_result types.Route
		if err := cur.Decode(&bson_result); err != nil {
			log.Fatal(err)
		}

		fmt.Println(bson_result)
		bson_data, err := bson.Marshal(bson_result) // Convert bson.D to BSON bytes
		if err != nil {
			log.Fatal("Error marshaling bson.D:", err)
		}

		err = bson.Unmarshal(bson_data, &route_result) // Convert BSON bytes to the struct
		if err != nil {
			log.Fatal("Error unmarshaling BSON to struct:", err)
		}

		results = append(results, route_result)
		// do something with result....
	}

	return results
}

func (mgr *manager) FindPlaceByID(placeID string) types.Place {

	collection := mgr.client.Database("dev").Collection("places")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var result types.Place

	filter := bson.D{{"placeid", placeID}}
	err := collection.FindOne(ctx, filter).Decode(&result)
	if errors.Is(err, mongo.ErrNoDocuments) {
		// Do something when no record was found
		return types.Place{}
	} else if err != nil {
		log.Fatal(err)
	}

	return result
}

func (mgr *manager) FindPlacesByCity(city string) []types.Place {

	collection := mgr.client.Database("dev").Collection("places")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var results []types.Place
	filter := bson.D{{"city", city}}
	cur, err := collection.Find(ctx, filter)
	if errors.Is(err, mongo.ErrNoDocuments) {
		// Do something when no record was found
		return []types.Place{}
	} else if err != nil {
		log.Fatal(err)
	}
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var bson_result bson.D
		var place_result types.Place
		if err := cur.Decode(&bson_result); err != nil {
			log.Fatal(err)
		}

		fmt.Println(bson_result)
		bson_data, err := bson.Marshal(bson_result) // Convert bson.D to BSON bytes
		if err != nil {
			log.Fatal("Error marshaling bson.D:", err)
		}

		err = bson.Unmarshal(bson_data, &place_result) // Convert BSON bytes to the struct
		if err != nil {
			log.Fatal("Error unmarshaling BSON to struct:", err)
		}

		results = append(results, place_result)
		// do something with result....
	}

	return results
}
