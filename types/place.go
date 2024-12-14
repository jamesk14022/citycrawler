package types

type DistanceMatrix [][]float64

type PlaceIDs struct {
	PlaceIDs []string `json:"place_ids" bson:"place_ids"`
}

type Place struct {
	PlaceID             string       `json:"place_id" bson:"placeid"`
	BusinessStatus      string       `json:"business_status" bson:"businessstatus"`
	City                string       `json:"city" bson:"city"`
	Geometry            Geometry     `json:"geometry" bson:"geometry"`
	Icon                string       `json:"icon" bson:"icon"`
	IconBackgroundColor string       `json:"icon_background_color" bson:"icon_background_color"`
	IconMaskBaseURI     string       `json:"icon_mask_base_uri" bson:"icon_mask_base_uri"`
	Name                string       `json:"name" bson:"name"`
	OpeningHours        OpeningHours `json:"opening_hours" bson:"opening_hours"`
	Photos              []Photo      `json:"photos" bson:"photos"`
	PlusCode            PlusCode     `json:"plus_code" bson:"plus_code"`
	PriceLevel          int          `json:"price_level" bson:"price_level"`
	Rating              float64      `json:"rating" bson:"rating"`
	Reference           string       `json:"reference" bson:"reference"`
	Scope               string       `json:"scope" bson:"scope"`
	Types               []string     `json:"types" bson:"types"`
	UserRatingsTotal    int          `json:"user_ratings_total" bson:"user_ratings_total"`
	Vicinity            string       `json:"vicinity" bson:"vicinity"`
}

type Geometry struct {
	Location Location `json:"location" bson:"location"`
	Viewport Viewport `json:"viewport" bson:"viewport"`
}

type Location struct {
	Lat float64 `json:"lat" bson:"lat"`
	Lng float64 `json:"lng" bson:"lng"`
}

type Viewport struct {
	Northeast Location `json:"northeast" bson:"northeast"`
	Southwest Location `json:"southwest" bson:"southwest"`
}

type OpeningHours struct {
	OpenNow bool `json:"open_now" bson:"open_now"`
}

type Photo struct {
	Height           int      `json:"height" bson:"height"`
	HTMLAttributions []string `json:"html_attributions" bson:"html_attributions"`
	PhotoReference   string   `json:"photo_reference" bson:"photo_reference"`
	Width            int      `json:"width" bson:"width"`
}

type PlusCode struct {
	CompoundCode string `json:"compound_code" bson:"compound_code"`
	GlobalCode   string `json:"global_code" bson:"global_code"`
}

type CacheItem struct {
	Values [][]Location `json:"values" bson:"values"`
}
