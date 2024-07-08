package main

import (
	"fmt"

	. "github.com/jamesk14022/barcrawler/handlers"
	. "github.com/jamesk14022/barcrawler/types"
)

const targetN = 4
const targetDist = 2.5
const location = "dublin"

func getNumberPaths(enrichedData []Location, D DistanceMatrix, R RoutesMatrix, alpha float64, beta float64, mu float64) uint8 {

	size := len(enrichedData)
	eligiblePaths := GetEligiblePaths(size, targetN, targetDist, D, beta)

	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return !CheckOverlap(e, R)
	})
	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return AdjacentLengthMeetConstraint(e, D, mu)
	})
	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return EqualLengthMeetConstraint(e, D, targetDist, alpha)
	})
	return uint8(len(eligiblePaths))
}

func tuneCrawlParameters() {

	enrichedData, D, R, err := LoadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information", err)
	}

	// alphaRange := Arange(1.0, 2.0, 0.1)

	// res := make([]uint8, len(alphaRange))

	// for i, alpha := range alphaRange {
	// 	fmt.Println("Running for alpha:", alpha)
	// 	res[i] = getNumberPaths(enrichedData, D, R, alpha, 0.5)
	// 	fmt.Println("Number of paths:", res[i])
	// }

	res := getNumberPaths(enrichedData, D, R, 1.3, 0.5, 1.1)
	fmt.Println(res)
}

func main() {
	tuneCrawlParameters()
}

// alpha 1.3 (if dist max == 3.0) looks like a decent setting for most irish citis
