package dbprovider

import (
	"time"

	"github.com/jamesk14022/barcrawler/types"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"context"
	"log"
	"os"
)

type Manager interface {
	AddPlace(place *types.Place) error
	AddRoute(route *types.Route) error
	// Add other methods
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

func (mgr *manager) AddPlace(place *types.Place) (err error) {

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	mgr.db.Create(article)
	if errs := mgr.db.GetErrors(); len(errs) > 0 {
		err = errs[0]
	}
	return
}

func (mgr *manager) AddRoute(route *types.Route) (err error) {

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	mgr.db.Create(article)
	if errs := mgr.db.GetErrors(); len(errs) > 0 {
		err = errs[0]
	}
	return
}
