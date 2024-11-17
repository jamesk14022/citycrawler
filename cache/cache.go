package cache

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"sync"

	"github.com/jamesk14022/barcrawler/types"
)

const CacheSize = 5

var cacheDataPath = os.Getenv("CACHE_DATA_PATH")
var RouteCache sync.Map

func PopulateCacheSyncMap(source map[string]types.CacheItem) {
	for key, value := range source {
		RouteCache.Store(key, value)
	}
}

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

func InitCache() {

	jsonData, err := ReadCacheJSONFile(cacheDataPath)
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

func GenerateKey(location string, markers int, attractions int) string {
	return location + "_" + strconv.Itoa(markers) + "_" + strconv.Itoa(attractions)
}

func SaveCache() {

	// Step 2: Convert sync.Map to a Standard Map
	standardMap := make(map[string]interface{})
	RouteCache.Range(func(key, value interface{}) bool {
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
	file, err := os.Create(cacheDataPath)
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

	fmt.Println("JSON data successfully written to ", cacheDataPath)
}

func AddToCache(key string, value []types.Location) {
	item, ok := RouteCache.Load(key)
	if !ok {
		RouteCache.Store(key, types.CacheItem{Values: [][]types.Location{value}})
		return
	}
	cacheItem := item.(types.CacheItem)
	cacheItem.Values = append(cacheItem.Values, value)
	RouteCache.Store(key, cacheItem)
}
