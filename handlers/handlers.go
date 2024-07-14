package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/jamesk14022/barcrawler/types"
	. "github.com/jamesk14022/barcrawler/types"
	"github.com/jamesk14022/barcrawler/utils"
)

const CacheSize = 5

var cacheDir = os.Getenv("CACHE_DIR")
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
var cache sync.Map

func ReadCacheJSONFile(filename string) ([]byte, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	return ioutil.ReadAll(file)
}

func UnmarshalCacheJSONToMap(data []byte) (map[string]types.CacheItem, error) {
	var result map[string]types.CacheItem
	err := json.Unmarshal(data, &result)
	return result, err
}

func PopulateCacheSyncMap(source map[string]types.CacheItem) {
	for key, value := range source {
		cache.Store(key, value)
	}
}

func InitCache() {
	// Step 1: Read the JSON file
	jsonData, err := ReadCacheJSONFile("/usr/local/cache_data.json")
	if err != nil {
		fmt.Println("Error reading JSON file:", err)
		return
	}

	// Step 2: Unmarshal the JSON data to a standard map
	standardMap, err := UnmarshalCacheJSONToMap(jsonData)
	if err != nil {
		fmt.Println("Error unmarshaling JSON:", err)
		return
	}

	// Step 3: Populate the sync.Map with the data from the standard map
	PopulateCacheSyncMap(standardMap)
}

func generateKey(location string, markers int) string {
	return location + "_" + strconv.Itoa(markers)
}

func saveCache() {

	// Step 2: Convert sync.Map to a Standard Map
	standardMap := make(map[string]interface{})
	cache.Range(func(key, value interface{}) bool {
		standardMap[key.(string)] = value
		return true
	})

	// Step 3: Marshal the Standard Map
	jsonData, err := json.MarshalIndent(standardMap, "", "  ")
	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	}

	// Step 4: Write JSON to a File
	file, err := os.Create("/usr/local/cache_data.json")
	if err != nil {
		fmt.Println("Error creating file:", err)
		return
	}
	defer file.Close()

	_, err = file.Write(jsonData)
	if err != nil {
		fmt.Println("Error writing JSON to file:", err)
		return
	}

	fmt.Println("JSON data successfully written to data.json")
}

func addToCache(key string, value []Location) {
	item, ok := cache.Load(key)
	if !ok {
		cache.Store(key, CacheItem{Values: [][]Location{value}})
		return
	}
	cacheItem := item.(CacheItem)
	cacheItem.Values = append(cacheItem.Values, value)
	cache.Store(key, cacheItem)
}

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

// func GetEligiblePaths(size int, targetN int, D DistanceMatrix) ([][]int, []float64) {
// 	var eligiblePaths [][]int
// 	var distances []float64

// 	var dfs func(node int, path []int, currentDist float64, visited []bool)
// 	dfs = func(node int, path []int, currentDist float64, visited []bool) {
// 		if len(path) > targetN {
// 			return
// 		}
// 		if currentDist > markerSettings[targetN]["distanceThreshold"] {
// 			return
// 		}
// 		if len(path) == targetN {
// 			if currentDist < markerSettings[targetN]["distanceThreshold"] {
// 				// Create a copy of the path slice
// 				pathCopy := make([]int, len(path))
// 				copy(pathCopy, path)
// 				eligiblePaths = append(eligiblePaths, pathCopy)
// 				distances = append(distances, currentDist)
// 			}
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

// func GetEligiblePaths(size int, targetN int, D DistanceMatrix) ([][]int, []float64) {
// 	var eligiblePaths [][]int
// 	var distances []float64
// 	var mu sync.Mutex
// 	var wg sync.WaitGroup

// 	threshold := markerSettings[targetN]["distanceThreshold"]

// 	var dfs func(node int, path []int, currentDist float64, visited []bool)
// 	dfs = func(node int, path []int, currentDist float64, visited []bool) {
// 		if len(path) > targetN {
// 			return
// 		}
// 		if currentDist > threshold {
// 			return
// 		}
// 		if len(path) == targetN {
// 			if currentDist < threshold {
// 				// Create a copy of the path slice
// 				pathCopy := make([]int, len(path))
// 				copy(pathCopy, path)

// 				// Protect shared data with a mutex
// 				mu.Lock()
// 				eligiblePaths = append(eligiblePaths, pathCopy)
// 				distances = append(distances, currentDist)
// 				mu.Unlock()
// 			}
// 			return
// 		}
// 		for i := 0; i < size; i++ {
// 			if i != node && !visited[i] {
// 				newVisited := make([]bool, len(visited))
// 				copy(newVisited, visited)
// 				newVisited[i] = true
// 				newDist := currentDist + D[node][i]
// 				dfs(i, append(path, i), newDist, newVisited)
// 			}
// 		}
// 	}

// 	for i := 0; i < size; i++ {
// 		wg.Add(1)
// 		go func(start int) {
// 			defer wg.Done()
// 			visited := make([]bool, size)
// 			visited[start] = true
// 			dfs(start, []int{start}, 0, visited)
// 		}(i)
// 	}

// 	wg.Wait()
// 	return eligiblePaths, distances
// }

func GetEligiblePaths(size int, targetN int, D DistanceMatrix) ([][]int, []float64) {
	var eligiblePaths [][]int
	var distances []float64
	path := make([]int, targetN)
	visited := make([]bool, size)

	var dfs func(node, depth int, currentDist float64)
	dfs = func(node, depth int, currentDist float64) {
		if len(eligiblePaths) >= 17099886 {
			return
		}
		if depth == targetN {
			if currentDist < markerSettings[targetN]["distanceThreshold"] {
				pathCopy := make([]int, targetN)
				copy(pathCopy, path[:depth])
				eligiblePaths = append(eligiblePaths, pathCopy)
				distances = append(distances, currentDist)
			}
			return
		}

		if currentDist > markerSettings[targetN]["distanceThreshold"] {
			return
		}

		for i := 0; i < size; i++ {
			if i != node && !visited[i] {
				visited[i] = true
				path[depth] = i
				dfs(i, depth+1, currentDist+D[node][i])
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

	return eligiblePaths, distances
}

func GetRandomCrawl(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
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

	key := generateKey(location, targetN)

	item, ok := cache.Load(key)
	if ok {
		cacheItem := item.(CacheItem)
		if len(cacheItem.Values) >= CacheSize {
			randomIndex := rand.Intn(len(cacheItem.Values))
			fmt.Println("Cache hit: ", key, cacheItem.Values[randomIndex])
			json.NewEncoder(w).Encode(cacheItem.Values[randomIndex])
			return
		}
	}

	enrichedData, D, R, err := LoadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information", err)
		json.NewEncoder(w).Encode(emptyResponse)
	}

	size := len(enrichedData)
	fmt.Println("Size:", size)
	eligiblePaths, distances := GetEligiblePaths(size, targetN, D)
	fmt.Println("Eligible paths:", len(eligiblePaths))
	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return !CheckOverlap(e, R)
	})
	fmt.Println("Eligible paths:", len(eligiblePaths))
	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return AdjacentLengthMeetConstraint(e, D, markerSettings[targetN]["mu"])
	})
	fmt.Println("Eligible paths:", len(eligiblePaths))
	eligiblePaths = FilterPathsDistances(eligiblePaths, distances, func(e []int, f float64) bool {
		return EqualLengthMeetConstraint(e, f, D, markerSettings[targetN]["alpha"])
	})
	fmt.Println("Eligible paths:", len(eligiblePaths))
	// eligiblePaths = utils.RemoveDuplicateRows(eligiblePaths)

	if len(eligiblePaths) == 0 {
		json.NewEncoder(w).Encode(emptyResponse)
	} else {

		fmt.Println(len(eligiblePaths))
		fmt.Println(rand.Intn(len(eligiblePaths)))

		path := eligiblePaths[rand.Intn(len(eligiblePaths))]
		fmt.Println("Selected path:", path)
		var selectedLocations = make([]Location, len(path))

		for i, p := range path {
			selectedLocations[i] = enrichedData[p]
		}
		for i := 0; i < len(selectedLocations)-1; i++ {
			fmt.Println("Path:", i, "Dist:", D[path[i]][path[i+1]])
		}
		fmt.Println("Cache miss: ", key, selectedLocations)
		addToCache(key, selectedLocations)
		saveCache()
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
