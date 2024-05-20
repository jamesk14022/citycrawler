package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

const cacheDir = "static/"

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
	ID       string  `json:"place_id"`
	Name     string  `json:"name"`
	Price    float32 `json:"price_level"`
	Rating   float32 `json:"rating"`
	Geometry struct {
		Location struct {
			Latitude  float64 `json:"lat"`
			Longitude float64 `json:"lng"`
		}
	}
}

type DistanceMatrix [][]float64
type RoutesMatrix [][]Route

func contains(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true // Return true if the value is found
		}
	}
	return false // Return false if the value is not found after checking all items
}

// check which directories exist in given directory
func checkCachedLocations() []string {
	files, err := ioutil.ReadDir(cacheDir)
	if err != nil {
		log.Fatal(err)
	}

	names := make([]string, len(files))
	for i := range files {
		names[i] = files[i].Name()
	}
	return names
}

func loadLocationInformation(location string) ([]Location, DistanceMatrix, RoutesMatrix, error) {
	var cachedLocations = checkCachedLocations()
	if !contains(cachedLocations, location) {
		fmt.Println("Location not found")
		return nil, nil, nil, errors.New("Location not found")
	} else {

		var enrichedData []Location
		var D DistanceMatrix
		var R RoutesMatrix

		file, _ := ioutil.ReadFile(cacheDir + location + "/info.json")
		json.Unmarshal(file, &enrichedData)

		file, _ = ioutil.ReadFile(cacheDir + location + "/D.json")
		json.Unmarshal(file, &D)

		file, _ = ioutil.ReadFile(cacheDir + location + "/R.json")
		json.Unmarshal(file, &R)

		return enrichedData, D, R, nil
	}
}

func checkOverlap(path []int, R RoutesMatrix) bool {
	localPoints := make(map[[2]float64]bool)
	for i := 0; i < len(path)-1; i++ {
		for _, point := range R[path[i]][path[i+1]].Geometry.Coordinates[1:] {
			key := [2]float64{point[0], point[1]}
			if localPoints[key] {
				return true
			}
			localPoints[key] = true
		}
	}
	return false
}

func adjacentLengthMeetConstraint(path []int, D DistanceMatrix) bool {
	for i := 0; i < len(path)-1; i++ {
		points := make([]int, len(path))
		copy(points, path)
		points = remove(points, path[i+1])
		points = remove(points, path[i])
		distToNext := D[path[i]][path[i+1]]
		for _, p := range points {
			if distToNext > D[path[i]][p] {
				return false
			}
		}
	}
	return true
}

func equalLengthMeetConstraint(path []int, D DistanceMatrix, targetDist float64) bool {
	margin := (targetDist / float64(len(path)-1)) * 1.5
	for i := 0; i < len(path)-1; i++ {
		if D[path[i]][path[i+1]] > margin {
			return false
		}
	}
	return true
}

func remove(slice []int, s int) []int {
	for i, v := range slice {
		if v == s {
			return append(slice[:i], slice[i+1:]...)
		}
	}
	return slice
}

func getEligiblePaths(size int, targetN int, targetDist float64, D DistanceMatrix) [][]int {
	var eligiblePaths [][]int

	var dfs func(node int, path []int, currentDist float64, visited []bool)
	dfs = func(node int, path []int, currentDist float64, visited []bool) {
		if len(path) > targetN {
			return
		}

		if len(path) == targetN && currentDist > targetDist-0.5 && currentDist < targetDist+0.5 {
			eligiblePaths = append(eligiblePaths, path)
			return
		}
		for i := 0; i < size; i++ {
			// fmt.Println(targetDist / float64(targetN-1) * 2.5)
			// fmt.Println(D[node])
			if i != node && !visited[i] {
				if D[node][i] > (targetDist/float64(targetN-1))*2.6 {
					return
				}
				visited[i] = true
				dfs(i, append(path, i), currentDist+D[node][i], visited)
				visited[i] = false
			}
		}
	}

	for i := 0; i < size; i++ {
		visited := make([]bool, size)
		visited[i] = true
		dfs(i, []int{i}, 0, visited)
	}

	return eligiblePaths
}

func getEvaluation(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	targetN, _ := strconv.Atoi(r.URL.Query().Get("target_n"))
	targetDist, _ := strconv.ParseFloat(r.URL.Query().Get("target_dist"), 64)
	location := strings.ToLower((r.URL.Query().Get("location")))

	// fmt.Println("Target N:", targetN)
	// fmt.Println("Target Dist:", targetDist)

	var emptyResponse = make([]Location, 0)

	enrichedData, D, R, err := loadLocationInformation(location)
	if err != nil {
		json.NewEncoder(w).Encode(emptyResponse)
	}

	fmt.Println("Distance matrix:", D)
	fmt.Println("Routes matrix:", R)

	size := len(enrichedData)
	eligiblePaths := getEligiblePaths(size, targetN, targetDist, D)

	eligiblePaths = filterPaths(eligiblePaths, func(e []int) bool {
		return !checkOverlap(e, R)
	})

	eligiblePaths = filterPaths(eligiblePaths, func(e []int) bool {
		return adjacentLengthMeetConstraint(e, D)
	})

	// eligiblePaths = filterPaths(eligiblePaths, func(e []int) bool {
	// 	return equalLengthMeetConstraint(e, D, targetDist)
	// })

	w.Header().Set("Content-Type", "application/json")
	if len(eligiblePaths) == 0 {
		json.NewEncoder(w).Encode(emptyResponse)
	} else {

		// Select a random path from eligible paths
		rand.Seed(time.Now().UnixNano())
		path := eligiblePaths[rand.Intn(len(eligiblePaths))]
		var selectedLocations = make([]Location, len(path))

		for i, p := range path {
			selectedLocations[i] = enrichedData[p]
		}

		fmt.Println("Selected locations:", selectedLocations)
		json.NewEncoder(w).Encode(selectedLocations)
	}

}

func postCrawl(w http.ResponseWriter, r *http.Request) {

	location := strings.ToLower((r.URL.Query().Get("location")))
	var ids PlaceIDs
	err := json.NewDecoder(r.Body).Decode(&ids)
	if err != nil {
		fmt.Println("Error parsing markers")
	}

	enrichedData, _, _, err := loadLocationInformation(location)
	var emptyResponse = make([]Location, 0)
	if err != nil {
		fmt.Println("Error loading location information")
		json.NewEncoder(w).Encode(emptyResponse)
	}

	var selectedLocations = make([]Location, len(ids.PlaceIDs))
	for i, id := range ids.PlaceIDs {
		for _, loc := range enrichedData {
			if loc.ID == id {
				selectedLocations[i] = loc
				break
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Println("Selected locations:", selectedLocations)
	json.NewEncoder(w).Encode(selectedLocations)
}

func getAllPoints(w http.ResponseWriter, r *http.Request) {
	location := strings.ToLower((r.URL.Query().Get("location")))
	enrichedData, _, _, err := loadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information")
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(enrichedData)
}

func filterPaths(paths [][]int, condition func([]int) bool) [][]int {
	var result [][]int
	for _, path := range paths {
		if condition(path) {
			result = append(result, path)
		}
	}
	return result
}

func main() {
	router := mux.NewRouter()

	// Directory where static files are stored
	staticDir := "/static/"

	// Setup static file server
	router.
		PathPrefix(staticDir).
		Handler(http.StripPrefix(staticDir, http.FileServer(http.Dir("."+staticDir))))

	router.HandleFunc("/pubs/", getEvaluation).Methods("GET")
	router.HandleFunc("/citypoints/", getAllPoints).Methods("GET")
	router.HandleFunc("/crawls/", postCrawl).Methods("POST")

	// Set up the server
	server := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	log.Println("Starting server on :8080")
	log.Fatal(server.ListenAndServe())
}

// # prune paths by applying constraints early in dfs
// # check out pg geo stuff
