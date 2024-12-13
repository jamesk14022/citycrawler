package types

type RoutesMatrix [][]Route

type Route struct {
	Point1     string        `json:"point1"`
	Point2     string        `json:"point2"`
	City       string        `json:"city"`
	Distance   float64       `json:"distance"`
	Duration   float64       `json:"duration"`
	Geometry   RouteGeometry `json:"geometry"`
	Legs       []Leg         `json:"legs"`
	Weight     float64       `json:"weight"`
	WeightName string        `json:"weight_name"`
}

type RouteGeometry struct {
	Coordinates [][]float64 `json:"coordinates"`
	Type        string      `json:"type"`
}

type Leg struct {
	Admins       []Admin  `json:"admins"`
	Distance     float64  `json:"distance"`
	Duration     float64  `json:"duration"`
	Steps        []Step   `json:"steps"`
	Summary      string   `json:"summary"`
	ViaWaypoints []string `json:"via_waypoints"`
	Weight       float64  `json:"weight"`
}

type Admin struct {
	ISO31661       string `json:"iso_3166_1"`
	ISO31661Alpha3 string `json:"iso_3166_1_alpha3"`
}

type Step struct {
	// Define fields here if steps contain more details
}
