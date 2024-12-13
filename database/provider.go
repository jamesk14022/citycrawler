package dbprovider

import (
	"time"

	"github.com/jamesk14022/barcrawler/types"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"context"
	"log"
	"os"
)

type Manager interface {
	AddPlace(place *types.Place) interface{}
	AddRoute(route *types.Route) interface{}
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
