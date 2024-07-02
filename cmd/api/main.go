package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jamesk14022/barcrawler/handlers"

	"io/ioutil"
)

const staticDir = "/usr/local/web/static/"
const port = ":8080"

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	router := mux.NewRouter()

	router.
		PathPrefix(staticDir).
		Handler(http.StripPrefix(staticDir, http.FileServer(http.Dir("."+staticDir))))

	router.HandleFunc("/pubs/", handlers.GetRandomCrawl).Methods("GET")
	router.HandleFunc("/citypoints/", handlers.GetAllCityPoints).Methods("GET")
	router.HandleFunc("/crawl/", handlers.PostCrawl).Methods("POST")

	corsRouter := enableCORS(router)

	// Set up the server
	server := &http.Server{
		Addr:    port,
		Handler: corsRouter,
	}

	log.Println("Starting server on ", port)
	files, err := ioutil.ReadDir("." + staticDir)
	if err != nil {
		log.Fatal(err)
	}

	for _, file := range files {
		fmt.Println(file.Name(), file.IsDir())
	}
	log.Fatal(server.ListenAndServe())
}
