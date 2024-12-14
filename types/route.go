package types

type RoutesMatrix [][]Route

type Route struct {
	Point1     string        `json:"point1" bson:"point1"`
	Point2     string        `json:"point2" bson:"point2"`
	City       string        `json:"city" bson:"city"`
	Distance   float64       `json:"distance" bson:"distance"`
	Duration   float64       `json:"duration" bson:"duration"`
	Geometry   RouteGeometry `json:"geometry" bson:"geometry"`
	Legs       []Leg         `json:"legs" bson:"legs"`
	Weight     float64       `json:"weight" bson:"weight"`
	WeightName string        `json:"weight_name" bson:"weight_name"`
}

type RouteGeometry struct {
	Coordinates [][]float64 `json:"coordinates" bson:"coordinates"`
	Type        string      `json:"type" bson:"type"`
}

type Leg struct {
	Admins       []Admin  `json:"admins" bson:"admins"`
	Distance     float64  `json:"distance" bson:"distance"`
	Duration     float64  `json:"duration" bson:"duration"`
	Steps        []Step   `json:"steps" bson:"steps"`
	Summary      string   `json:"summary" bson:"summary"`
	ViaWaypoints []string `json:"via_waypoints" bson:"via_waypoints"`
	Weight       float64  `json:"weight" bson:"weight"`
}

type Admin struct {
	ISO31661       string `json:"iso_3166_1" bson:"iso_3166_1"`
	ISO31661Alpha3 string `json:"iso_3166_1_alpha3" bson:"iso_3166_1_alpha3"`
}

type Step struct {
	// Define fields here if steps contain more details
}
