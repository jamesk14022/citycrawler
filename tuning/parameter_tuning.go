package main

import (
	"fmt"

	. "github.com/jamesk14022/barcrawler/handlers"
	. "github.com/jamesk14022/barcrawler/types"
	. "github.com/jamesk14022/barcrawler/utils"
)

const targetN = 4
const targetDist = 1.5
const location = "dublin"

func getNumberPaths(enrichedData []Location, D DistanceMatrix, R RoutesMatrix, alpha float64, beta float64) uint8 {

	size := len(enrichedData)
	eligiblePaths := GetEligiblePaths(size, targetN, targetDist, D, 0.7)

	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return !CheckOverlap(e, R)
	})

	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return AdjacentLengthMeetConstraint(e, D)
	})

	eligiblePaths = FilterPaths(eligiblePaths, func(e []int) bool {
		return EqualLengthMeetConstraint(e, D, targetDist, 0.8)
	})

	return uint8(len(eligiblePaths))
}

func tuneCrawlParameters() {

	enrichedData, D, R, err := LoadLocationInformation(location)
	if err != nil {
		fmt.Println("Error loading location information", err)
	}

	alphaRange := Arange(0.5, 1.5, 0.1)
	betaRange := Arange(0.5, 1.5, 0.1)

	res := make([][]uint8, len(alphaRange))
	for i := range res {
		res[i] = make([]uint8, len(betaRange))
	}

	for i, alpha := range alphaRange {
		for j, beta := range betaRange {
			fmt.Println("Running for alpha:", alpha, "beta:", beta)
			res[i][j] = getNumberPaths(enrichedData, D, R, alpha, beta)
			fmt.Println("Number of paths:", res[i][j])
		}
	}

	fmt.Println(res)
}

func main() {
	tuneCrawlParameters()
}
