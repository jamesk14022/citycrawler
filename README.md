## 🎡 Citycrawler 🍺

Web app that uses graph theory to generate custom “city crawl” routes in EU and US cities. This was built mostly as as a Golang and graph theory learning exercise. These walking routes encourage you to explore the finest drinking establishments in a city. Some features:

- A scraped "pub directory" containing 50,000+ relevant pubs from major cities
- Customizable Routes: Users can generate routes with adjustable lengths and select the number of bars included. They can also choose to include cultural areas of interest in their route.

## Dependencies

- **Docker:** [Install](https://docs.docker.com/get-docker/)
- **Golang (v1.22.3):** [Install](https://go.dev/dl/)
- **Golang Libraries:** Install with `go mod tidy`.

## Environment Variables 

- WEB_DIR=/usr/local/web/static
- LOCATION_DATA_DIR=/usr/local/data/location_data/
- CACHE_DATA_PATH=/usr/local/data/location_data/cache.json

## Run

```
# build executable
make build

# run webserver to serve static files and API
make run
```

![alt text](https://github.com/jamesk14022/barcrawler/blob/main/web/static/assets/screenshot.png)
