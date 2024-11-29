package types

type DistanceMatrix [][]float64
type RoutesMatrix [][]Route

type Geometry struct {
	Coordinates [][]float64 `json:"coordinates"`
}

type Route struct {
	Geometry Geometry `json:"geometry"`
}

type PlaceIDs struct {
	PlaceIDs []string `json:"place_ids"`
}

type Location struct {
	ID     string   `json:"place_id"`
	Name   string   `json:"name"`
	Price  float32  `json:"price_level"`
	Rating float32  `json:"rating"`
	Types  []string `json:"types"`
	Photos []struct {
		PhotoReference string `json:"photo_reference"`
	} `json:"photos"`
	Geometry struct {
		Location struct {
			Latitude  float64 `json:"lat"`
			Longitude float64 `json:"lng"`
		}
	}
}

type CacheItem struct {
	Values [][]Location
}
