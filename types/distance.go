package types

type Distance struct {
	ID       string  `json:"id,omitempty"`
	Point1   string  `json:"point1"`
	Point2   string  `json:"point2"`
	Distance float64 `json:"distance"`
	Duration int     `json:"duration"`
}
