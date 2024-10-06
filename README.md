## 🎡 Citycrawler 🍺

Web app that uses graph theory to generate custom “city crawl” routes in EU and US cities. This was built mostly as as a Golang and graph theory learning exercise. These walking routes encourage you to explore the finest drinking establishments in a city. Some features:

- A scraped "pub directory" containing 50,000+ relevant pubs from major cities
- Customizable Routes: Users can generate routes with adjustable lengths and select the number of bars included. They can also choose to include cultural areas of interest in their route.

## Dependencies

#### 1. Docker
Ensure Docker is installed for containerization.  
- **Install:** [Docker Installation Guide](https://docs.docker.com/get-docker/)

#### 2. Golang (Go 1.22.3)
Install Go from the [official site](https://go.dev/dl/).  
- **Version:** `Go 1.22.3`

#### 3. Prettier (JavaScript Formatting)
Prettier is used for consistent JS code formatting.  
- **Install:** Run `npm install` (Prettier is installed as a dev dependency).  
- **Usage:** Run `npm run format` to format JS files.

#### 4. Golang Libraries
Managed via Go modules. Install all dependencies by running: `go mod tidy`

### Run

```
# build executable
make build

# run webserver to serve static files and API
make run
```

![alt text](https://github.com/jamesk14022/barcrawler/blob/main/web/static/screenshot.jpg?raw=true)
