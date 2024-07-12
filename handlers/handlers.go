package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"

	. "github.com/jamesk14022/barcrawler/types"
	"github.com/jamesk14022/barcrawler/utils"
)

var cacheDir = os.Getenv("CACHE_DIR")

// for 3 + 4
const distanceThreshold = 0.9
const Mu = 1.1
const Alpha = 1.1

// for 5 + 6
// const distanceThreshold = 1.6
// const Mu = 1.3
// const Alpha = 1.3

// check which directories exist in given directory
func checkCachedLocations() []string {
	files, err := os.ReadDir(cacheDir)
	if err != nil {
		log.Fatal(err)
	}

	names := make([]string, len(files))
	for i := range files {
		names[i] = files[i].Name()
	}
	return names
}

func LoadLocationInformation(location string) ([]Location, DistanceMatrix, RoutesMatrix, error) {
	var cachedLocations = checkCachedLocations()
	if !utils.Contains(cachedLocations, location) {
		fmt.Println("Location not found")
		return nil, nil, nil, errors.New("location not found")
	} else {

		var enrichedData []Location
		var D DistanceMatrix
		var R RoutesMatrix

		file, err := os.ReadFile(cacheDir + location + "/info.json")
		if err != nil {
			fmt.Println("Error reading file", err)
		}
		json.Unmarshal(file, &enrichedData)

		file, err = os.ReadFile(cacheDir + location + "/D.json")
		if err != nil {
			fmt.Println("Error reading file", err)
		}
		json.Unmarshal(file, &D)

		file, err = os.ReadFile(cacheDir + location + "/R.json")
		if err != nil {
			fmt.Println("Error reading file", err)
		}
		json.Unmarshal(file, &R)

		return enrichedData, D, R, nil
	}
}

func CheckOverlap(path []int, R RoutesMatrix) bool {
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

func AdjacentLengthMeetConstraint(path []int, D DistanceMatrix, mu float64) bool {
	for i := 0; i < len(path)-1; i++ {
		points := make([]int, len(path))
		copy(points, path)
		points = utils.Remove(points, path[i+1])
		points = utils.Remove(points, path[i])
		distToNext := D[path[i]][path[i+1]]
		for _, p := range points {
			if distToNext > (D[path[i]][p])*mu {
				return false
			}
		}
	}
	return true
}

func EqualLengthMeetConstraint(path []int, pathDistance float64, D DistanceMatrix, alpha float64) bool {
	margin := (pathDistance / float64(len(path)-1)) * alpha
	for i := 0; i < len(path)-1; i++ {
		if D[path[i]][path[i+1]] > margin {
			return false
		}
		if D[path[i]][path[i+1]] < 0.15 {
			return false
		}
	}
	return true
}

// func GetEligiblePaths(size int, targetN int, D DistanceMatrix) ([][]int, []float64) {
// 	var eligiblePaths [][]int
// 	var distances []float64

// 	var dfs func(node int, path []int, currentDist float64, visited []bool)
// 	dfs = func(node int, path []int, currentDist float64, visited []bool) {
// 		if (len(path) == targetN) && (currentDist < distanceThreshold) {
// 			fmt.Println("Path:", path, "Dist:", currentDist)
// 			eligiblePaths = append(eligiblePaths, path)
// 			distances = append(distances, currentDist)
// 			return
// 		}
// 		if len(path) >= targetN {
// 			return
// 		}
// 		for i := 0; i < size; i++ {
// 			if i != node && !visited[i] {
// 				visited[i] = true
// 				newDist := currentDist + D[node][i]
// 				dfs(i, append(path, i), newDist, visited)
// 				visited[i] = false
// 			}
// 		}
// 	}

// 	for i := 0; i < size; i++ {
// 		visited := make([]bool, size)
// 		visited[i] = true
// 		dfs(i, []int{i}, 0, visited)
// 	}

// 	return eligiblePaths, distances
// }

func GetEligiblePaths(size int, targetN int, D DistanceMatrix) ([][]int, []float64) {
	var eligiblePaths [][]int
	var distances []float64

	var dfs func(node int, path []int, currentDist float64, visited []bool)
	dfs = func(node int, path []int, currentDist float64, visited []bool) {
		if len(path) == targetN {
			if currentDist < distanceThreshold {
				// Create a copy of the path slice
				pathCopy := make([]int, len(path))
				copy(pathCopy, path)
				eligiblePaths = append(eligiblePaths, pathCopy)
				distances = append(distances, currentDist)
			}
			return
		}
		for i := 0; i < size; i++ {
			if i != node && !visited[i] {
				visited[i] = true
				newDist := currentDist + D[node][i]
				dfs(i, append(path, i), newDist, visited)
				visited[i] = false
			}
		}
	}

	for i := 0; i < size; i++ {
		visited := make([]bool, size)
		visited[i] = true
		dfs(i, []int{i}, 0, visited)
	}

	return eligiblePaths, distances
}

func GetRandomCrawl(w http.ResponseWriter, r *http.Request) {
	var emptyResponse = make([]Location, 0)

	targetN, err := strconv.Atoi(r.URL.Query().Get("target_n"))
	if err != nil {
		fmt.Println("Error getting targetN", err)
		json.NewEncoder(w).Encode(emptyResponse)
	}
	// targetDist, err := strconv.ParseFloat(r.URL.Query().Get("target_dist"), 64)
	// if err != nil {
	// 	fmt.Println("Error getting targetDist", err)
	// 	json.NewEncoder(w).Encode(emptyResponse)
	// }
	location := strings.ToLower((r.URL.Query().Get("location")))

	enrichedData, D, R, err := LoadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information", err)
		json.NewEncoder(w).Encode(emptyResponse)
	}

	size := len(enrichedData)
	fmt.Println("Size:", size)
	eligiblePaths, distances := GetEligiblePaths(size, targetN, D)
	// fmt.Println("Eligible paths:", eligiblePaths)
	fmt.Println("Eligible paths:", len(eligiblePaths))
	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return !CheckOverlap(e, R)
	})
	fmt.Println("Eligible paths:", len(eligiblePaths))
	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return AdjacentLengthMeetConstraint(e, D, Mu)
	})
	fmt.Println("Eligible paths:", len(eligiblePaths))
	eligiblePaths = FilterPathsDistances(eligiblePaths, distances, func(e []int, f float64) bool {
		return EqualLengthMeetConstraint(e, f, D, Alpha)
	})
	fmt.Println("Eligible paths:", len(eligiblePaths))
	//eligiblePaths = utils.RemoveDuplicateRows(eligiblePaths)

	w.Header().Set("Content-Type", "application/json")
	if len(eligiblePaths) == 0 {
		json.NewEncoder(w).Encode(emptyResponse)
	} else {

		fmt.Println(len(eligiblePaths))
		fmt.Println(rand.Intn(len(eligiblePaths)))

		path := eligiblePaths[rand.Intn(len(eligiblePaths))]
		fmt.Println("Selected path:", path)
		fmt.Println(utils.ContainsInt(path, 59))
		var selectedLocations = make([]Location, len(path))

		for i, p := range path {
			selectedLocations[i] = enrichedData[p]
		}
		for i := 0; i < len(selectedLocations)-1; i++ {
			fmt.Println("Path:", i, "Dist:", D[path[i]][path[i+1]])
		}
		json.NewEncoder(w).Encode(selectedLocations)
	}
}

func PostCrawl(w http.ResponseWriter, r *http.Request) {

	location := strings.ToLower((r.URL.Query().Get("location")))
	var ids PlaceIDs
	err := json.NewDecoder(r.Body).Decode(&ids)
	if err != nil {
		fmt.Println("Error parsing markers")
	}

	enrichedData, _, _, err := LoadLocationInformation(location)
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
	json.NewEncoder(w).Encode(selectedLocations)
}

func GetAllCityPoints(w http.ResponseWriter, r *http.Request) {
	location := strings.ToLower((r.URL.Query().Get("location")))
	enrichedData, _, _, err := LoadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information", err)
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(enrichedData)
}

func FilterPaths(paths [][]int, condition func([]int) bool) [][]int {
	var result [][]int
	for _, path := range paths {
		if condition(path) {
			result = append(result, path)
		}
	}
	return result
}

func FilterPathsDistances(paths [][]int, distances []float64, condition func([]int, float64) bool) [][]int {
	var result [][]int
	for i, path := range paths {
		if condition(path, distances[i]) {
			result = append(result, path)
		}
	}
	return result
}
