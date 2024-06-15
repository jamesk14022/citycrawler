package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jamesk14022/barcrawler/handlers"
)

const staticDir = "/static/"
const port = ":8080"

func main() {
	router := mux.NewRouter()

	router.
		PathPrefix(staticDir).
		Handler(http.StripPrefix(staticDir, http.FileServer(http.Dir("."+staticDir))))

	router.HandleFunc("/pubs/", handlers.GetRandomCrawl).Methods("GET")
	router.HandleFunc("/citypoints/", handlers.GetAllCityPoints).Methods("GET")
	router.HandleFunc("/crawl/", handlers.PostCrawl).Methods("POST")

	// Set up the server
	server := &http.Server{
		Addr:    port,
		Handler: router,
	}

	log.Println("Starting server on ", port)
	log.Fatal(server.ListenAndServe())
}
