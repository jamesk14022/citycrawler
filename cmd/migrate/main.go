package main

import (
	"fmt"

	dbprovider "github.com/jamesk14022/barcrawler/database"
	handlers "github.com/jamesk14022/barcrawler/handlers"
)

func main() {
	locations := handlers.CheckAvailableLocations()
	for location, _ := range locations {

		enrichedData, _, R, _ := handlers.LoadLocationInformation(location)

		for _, place := range enrichedData {

			place.City = location

			fmt.Printf("Adding place %s\n", place.Name)
			dbprovider.Mgr.AddPlace(&place)
		}

		for i, row := range R {
			for j, _ := range row {

				R[i][j].City = location
				R[i][j].Point1 = enrichedData[i].PlaceID
				R[i][j].Point2 = enrichedData[j].PlaceID
				dbprovider.Mgr.AddRoute(&R[i][j])
			}
		}
	}
}
