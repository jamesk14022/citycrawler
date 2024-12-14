package handlers

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"

	// . "github.com/jamesk14022/barcrawler/cache"
	dbprovider "github.com/jamesk14022/barcrawler/database"
	"github.com/jamesk14022/barcrawler/types"
	. "github.com/jamesk14022/barcrawler/types"
	"github.com/jamesk14022/barcrawler/utils"
)

const MaxReturnPaths = 20000000

var locationDataDir = os.Getenv("LOCATION_DATA_DIR")

var markerSettings = map[int]map[string]float64{
	3: {
		"distanceThreshold": 0.9,
		"mu":                1.1,
		"alpha":             1.1,
	},
	4: {
		"distanceThreshold": 0.9,
		"mu":                1.1,
		"alpha":             1.1,
	},
	5: {
		"distanceThreshold": 1.6,
		"mu":                1.3,
		"alpha":             1.3,
	},
	6: {
		"distanceThreshold": 1.6,
		"mu":                1.3,
		"alpha":             1.3,
	},
}

var emptyResponse = make([]Place, 0)

func CheckAvailableLocations() map[string][2]float64 {

	jsonFile, err := os.ReadFile(locationDataDir + "cities.json")
	if err != nil {
		log.Fatal(err)
	}

	var cityCoordinates map[string][2]float64
	if err := json.Unmarshal(jsonFile, &cityCoordinates); err != nil {
		log.Fatal(err)
	}
	files, err := os.ReadDir(locationDataDir)
	if err != nil {
		log.Fatal(err)
	}

	names := make([]string, len(files))
	for i := range files {
		if files[i].IsDir() {
			names[i] = files[i].Name()
		}
	}
	for key := range cityCoordinates {
		if !utils.Contains(names, strings.ToLower(key)) {
			delete(cityCoordinates, key)
		}
	}

	return cityCoordinates
}

func LoadLocationInformation(location string) ([]Place, []Route, error) {

	var availableLocations = utils.GetKeys(CheckAvailableLocations())
	if !utils.Contains(availableLocations, location) {
		fmt.Println("Location not found")
		return nil, nil, errors.New("location not found")
	} else {

		var enrichedData []Place
		var R []Route

		fmt.Println("Loading location information")
		enrichedData = dbprovider.Mgr.FindPlacesByCity(location)
		fmt.Println("find routes by city")
		R = dbprovider.Mgr.FindRoutesByCity(location)
		return enrichedData, R, nil
	}
}

func CheckOverlap(path []string) bool {
	localPoints := make(map[[2]float64]bool)
	for i := 0; i < len(path)-1; i++ {
		route := dbprovider.Mgr.FindCachedRouteBetweenPlaces(path[i], path[i+1])
		for _, point := range route.Geometry.Coordinates[1:] {
			key := [2]float64{point[0], point[1]}
			if localPoints[key] {
				return true
			}
			localPoints[key] = true
		}
	}
	return false
}

func CheckFirstLocation(path []string, enrichedData []Place, targetFirstLocation string) bool {
	return path[0] == targetFirstLocation
}

func AdjacentLengthMeetConstraint(path []string, location string, mu float64) bool {
	for i := 0; i < len(path)-1; i++ {
		points := make([]string, len(path))
		copy(points, path)
		points = utils.Remove(points, path[i+1])
		points = utils.Remove(points, path[i])
		distToNext := dbprovider.Mgr.FindCachedRouteBetweenPlaces(path[i], path[i+1]).Distance / 1000
		for _, p := range points {
			distToAdjacent := dbprovider.Mgr.FindCachedRouteBetweenPlaces(path[i], p).Distance / 1000
			if distToNext > distToAdjacent*mu {
				return false
			}
		}
	}
	return true
}

func EqualLengthMeetConstraint(path []string, pathDistance float64, alpha float64) bool {
	margin := (pathDistance / float64(len(path)-1)) * alpha
	for i := 0; i < len(path)-1; i++ {
		distanceBetween := dbprovider.Mgr.FindCachedRouteBetweenPlaces(path[i], path[i+1]).Distance / 1000
		if distanceBetween > margin {
			return false
		}
		if distanceBetween < 0.15 {
			return false
		}
	}
	return true
}

func checkAttractionContraints(path []int, enrichedData []Place, targetAttractions int) bool {
	attractions := 0
	for _, p := range path {
		if utils.Contains(enrichedData[p].Types, "tourist_attraction") {
			attractions++
		}
	}
	return attractions == targetAttractions
}

func getEligiblePaths(size int, targetPubs int, targetAttractions int, enrichedData []Place) ([][]string, []float64) {

	var eligiblePaths [][]int
	var distances []float64
	var totalTargetLength = targetPubs + targetAttractions

	path := make([]int, totalTargetLength)
	visited := make([]bool, size)

	var dfs func(node int, depth int, currentDist float64)
	dfs = func(node int, depth int, currentDist float64) {
		if len(eligiblePaths) >= MaxReturnPaths {
			return
		}
		if depth == totalTargetLength {
			if currentDist < markerSettings[totalTargetLength]["distanceThreshold"] && checkAttractionContraints(path, enrichedData, targetAttractions) {
				pathCopy := make([]int, totalTargetLength)
				copy(pathCopy, path[:depth])
				eligiblePaths = append(eligiblePaths, pathCopy)
				distances = append(distances, currentDist)
			}
			return
		}

		if currentDist > markerSettings[totalTargetLength]["distanceThreshold"] {
			return
		}

		for i := 0; i < size; i++ {
			if i != node && !visited[i] {
				visited[i] = true
				path[depth] = i
				newDist := currentDist + dbprovider.Mgr.FindCachedRouteBetweenPlaces(enrichedData[node].PlaceID, enrichedData[i].PlaceID).Distance/1000
				dfs(i, depth+1, newDist)
				visited[i] = false
			}
		}
	}

	for i := 0; i < size; i++ {
		visited[i] = true
		path[0] = i
		dfs(i, 1, 0)
		visited[i] = false
	}

	// convert from indices to placeIDs
	var eligiblePathsID [][]string
	for _, path := range eligiblePaths {
		var pathID []string
		for _, p := range path {
			pathID = append(pathID, enrichedData[p].PlaceID)
		}
		eligiblePathsID = append(eligiblePathsID, pathID)
	}

	return eligiblePathsID, distances
}

func extractURLParams(r *http.Request) (int, int, string, string, error) {
	targetAttractions, err := strconv.Atoi(r.URL.Query().Get("target_attractions"))
	if err != nil {
		return 0, 0, "", "", err
	}

	targetPubs, err := strconv.Atoi(r.URL.Query().Get("target_pubs"))
	if err != nil {
		return 0, 0, "", "", err
	}

	targetFirstLocation := r.URL.Query().Get("target_first_location")
	location := strings.ToLower((r.URL.Query().Get("location")))
	if location == "" {
		return 0, 0, "", "", err
	}

	return targetAttractions, targetPubs, targetFirstLocation, location, nil
}

func GetCityCoordinates(w http.ResponseWriter, r *http.Request) {
	cityCoordinates := CheckAvailableLocations()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cityCoordinates)
}

func GetPhoto(w http.ResponseWriter, r *http.Request) {
	photoReference := r.URL.Query().Get("photo_reference")
	if photoReference == "" {
		http.Error(w, "photo_reference is required", http.StatusBadRequest)
		return
	}

	url := "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=" + photoReference + "&key=" + os.Getenv("GOOGLE_MAPS_API_KEY")
	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, "Failed to fetch photo: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	fmt.Println("Photo response status: ", resp)

	// Read the response body into a byte slice
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Create a response object
	responseObject := map[string]interface{}{
		"status":  resp.StatusCode,
		"headers": resp.Header,
		"body":    base64.StdEncoding.EncodeToString(bodyBytes), // Include the body as a string
	}

	// Set the Content-Type as JSON
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	err = json.NewEncoder(w).Encode(responseObject)
	if err != nil {
		http.Error(w, "Failed to encode JSON response: "+err.Error(), http.StatusInternalServerError)
	}
}

func findPlaceByID(places []types.Place, placeID string) *types.Place {
	for _, place := range places {
		if place.PlaceID == placeID {
			return &place // Return the first match
		}
	}
	return nil // Return nil if no match is found
}

func GetRandomCrawl(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")

	targetAttractions, targetPubs, targetFirstLocation, location, err := extractURLParams(r)
	if err != nil {
		fmt.Println("Error extracting URL params", err)
		json.NewEncoder(w).Encode(emptyResponse)
	}

	// key := GenerateKey(location, targetPubs, targetAttractions) + "3"

	// item, ok := RouteCache.Load(key)
	// if ok {
	// 	cacheItem := item.(CacheItem)
	// 	if len(cacheItem.Values) >= CacheSize {
	// 		randomIndex := rand.Intn(len(cacheItem.Values))
	// 		fmt.Println("Cache hit: ", key, cacheItem.Values[randomIndex])
	// 		json.NewEncoder(w).Encode(cacheItem.Values[randomIndex])
	// 		return
	// 	}
	// }

	enrichedData, _, err := LoadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information", err)
		json.NewEncoder(w).Encode(emptyResponse)
	}

	eligiblePaths := generateRoute(enrichedData, targetPubs, targetAttractions, targetFirstLocation)

	if len(eligiblePaths) == 0 {
		json.NewEncoder(w).Encode(emptyResponse)
	} else {
		path := eligiblePaths[rand.Intn(len(eligiblePaths))]
		var selectedLocations = make([]Place, len(path))

		for i, p := range path {
			selectedLocations[i] = *findPlaceByID(enrichedData, p)
		}
		// AddToCache(key, selectedLocations)
		// SaveCache()
		json.NewEncoder(w).Encode(selectedLocations)
	}
}

func generateRoute(enrichedData []Place, targetPubs int, targetAttractions int, targetFirstLocation string) [][]string {

	size := len(enrichedData)
	eligiblePaths, distances := getEligiblePaths(size, targetPubs, targetAttractions, enrichedData)
	if targetFirstLocation != "" {
		eligiblePaths = filterPathsLocations(eligiblePaths, enrichedData, func(e []string, f []Place) bool {
			return CheckFirstLocation(e, enrichedData, targetFirstLocation)
		})
	}

	eligiblePaths = filterPaths(eligiblePaths, func(e []string) bool {
		return !CheckOverlap(e)
	})

	eligiblePaths = filterPaths(eligiblePaths, func(e []string) bool {
		return AdjacentLengthMeetConstraint(e, enrichedData[0].City, markerSettings[targetPubs+targetAttractions]["mu"])
	})

	eligiblePaths = filterPathsDistances(eligiblePaths, distances, func(e []string, f float64) bool {
		return EqualLengthMeetConstraint(e, f, markerSettings[targetPubs+targetAttractions]["alpha"])
	})

	return eligiblePaths
}

func PostCrawl(w http.ResponseWriter, r *http.Request) {
	var ids PlaceIDs
	location := strings.ToLower((r.URL.Query().Get("location")))
	err := json.NewDecoder(r.Body).Decode(&ids)
	if err != nil {
		fmt.Println("Error parsing markers")
	}

	enrichedData, _, err := LoadLocationInformation(location)
	var emptyResponse = make([]Place, 0)
	if err != nil {
		fmt.Println("Error loading location information")
		json.NewEncoder(w).Encode(emptyResponse)
	}

	var selectedLocations = make([]Place, len(ids.PlaceIDs))
	for i, id := range ids.PlaceIDs {
		for _, loc := range enrichedData {
			if loc.PlaceID == id {
				selectedLocations[i] = loc
				break
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(selectedLocations)
}

func GetAllCityPoints(w http.ResponseWriter, r *http.Request) {
	location := strings.ToLower((r.URL.Query().Get("location")))
	enrichedData, _, err := LoadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(enrichedData)
}

func filterPaths(paths [][]string, condition func([]string) bool) [][]string {
	var result [][]string
	for _, path := range paths {
		if condition(path) {
			result = append(result, path)
		}
	}
	return result
}

func filterPathsLocations(paths [][]string, enrichedData []Place, condition func([]string, []Place) bool) [][]string {
	var result [][]string
	for _, path := range paths {
		if condition(path, enrichedData) {
			result = append(result, path)
		}
	}
	return result
}

func filterPathsDistances(paths [][]string, distances []float64, condition func([]string, float64) bool) [][]string {
	var result [][]string
	for i, path := range paths {
		if condition(path, distances[i]) {
			result = append(result, path)
		}
	}
	return result
}
