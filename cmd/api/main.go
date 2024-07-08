package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/jamesk14022/barcrawler/handlers"

	gorillaHandlers "github.com/gorilla/handlers"
)

const staticDir = "/web/static/"
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

	router.HandleFunc("/pubs", handlers.GetRandomCrawl).Methods("GET")
	router.HandleFunc("/citypoints", handlers.GetAllCityPoints).Methods("GET")
	router.HandleFunc("/crawl", handlers.PostCrawl).Methods("POST")

	corsRouter := enableCORS(router)
	loggedRouter := gorillaHandlers.LoggingHandler(os.Stdout, corsRouter)

	// Set up the server
	server := &http.Server{
		Addr:    port,
		Handler: loggedRouter,
	}

	log.Println("Starting server on ", port)
	log.Fatal(server.ListenAndServe())
}
