package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

type Geometry struct {
	Coordinates [][]float64 `json:"coordinates"`
}

type Route struct {
	Geometry Geometry `json:"geometry"`
}

type Location struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type DistanceMatrix [][]float64
type RoutesMatrix [][]Route

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
	margin := (targetDist / float64(len(path))) * 2.2
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
			newPath := make([]int, len(path))
			copy(newPath, path)
			eligiblePaths = append(eligiblePaths, newPath)
			return
		}
		for i := 0; i < size; i++ {
			if i != node && !visited[i] {
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

	fmt.Println("Target N:", targetN)
	fmt.Println("Target Dist:", targetDist)

	// Load enriched data
	var enrichedData []Location
	file, _ := ioutil.ReadFile("info.json")
	json.Unmarshal(file, &enrichedData)

	fmt.Println("Enriched data:", enrichedData)

	// Load D and R matrices
	var D DistanceMatrix
	file, _ = ioutil.ReadFile(filepath.Join("static", "D.json"))
	json.Unmarshal(file, &D)

	var R RoutesMatrix
	file, _ = ioutil.ReadFile(filepath.Join("static", "R.json"))
	json.Unmarshal(file, &R)

	size := len(enrichedData)
	eligiblePaths := getEligiblePaths(size, targetN, targetDist, D)

	fmt.Println("All paths:", eligiblePaths)

	eligiblePaths = filterPaths(eligiblePaths, func(e []int) bool {
		return !checkOverlap(e, R)
	})

	eligiblePaths = filterPaths(eligiblePaths, func(e []int) bool {
		return adjacentLengthMeetConstraint(e, D)
	})

	eligiblePaths = filterPaths(eligiblePaths, func(e []int) bool {
		return equalLengthMeetConstraint(e, D, targetDist)
	})

	fmt.Println("Eligible paths:", eligiblePaths)

	// Select a random path from eligible paths
	rand.Seed(time.Now().UnixNano())
	path := eligiblePaths[rand.Intn(len(eligiblePaths))]
	selectedLocations := make([]Location, len(path))
	for i, p := range path {
		selectedLocations[i] = enrichedData[p]
	}

	fmt.Println("Selected locations:", selectedLocations)

	// Respond with the selected locations
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(selectedLocations)
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

	// Set up the server
	server := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	log.Println("Starting server on :8080")
	log.Fatal(server.ListenAndServe())
}
