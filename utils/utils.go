package utils

import (
	"fmt"
	"math"
	"strings"
)

func Remove(slice []string, s string) []string {
	for i, v := range slice {
		if v == s {
			return append(slice[:i], slice[i+1:]...)
		}
	}
	return slice
}

func Contains(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

func ContainsInt(slice []int, val int) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

func Arange(start, stop, step float64) []float64 {
	N := int(math.Ceil((stop - start) / step))
	rnge := make([]float64, N, N)
	i := 0
	for x := start; x < stop; x += step {
		rnge[i] = x
		i += 1
	}
	return rnge
}

func hashRow(row []int) string {
	return strings.Trim(strings.Replace(fmt.Sprint(row), " ", ",", -1), "[]")
}

func RemoveDuplicateRows(arr [][]int) [][]int {
	uniqueRows := make(map[string]bool)
	var result [][]int

	for _, row := range arr {
		hash := hashRow(row)
		if !uniqueRows[hash] {
			uniqueRows[hash] = true
			result = append(result, row)
		}
	}

	return result
}

func GetKeys[K comparable, V any](m map[K]V) []K {
	keys := make([]K, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
