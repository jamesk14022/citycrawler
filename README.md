## Citycrawler 🍺

Web app that uses graph theory to generate custom “city crawl” routes in EU and US cities. This was built mostly as as a Golang and graph theory learning exercise. These walking routes encourage you to explore the finest drinking establishments in a city. Some features:

- A scraped "pub directory" containing 50,000+ relevant pubs from major cities
- Customizable Routes: Users can generate routes with adjustable lengths and select the number of bars included. They can also choose to include cultural areas of interest in their route.

### Dependencies

The project requires the following tools and libraries to be installed for development and deployment:

#### 1. **Docker**
We use Docker to containerize the application. Please ensure you have Docker installed on your machine.

- **Installation:** Follow the instructions to install Docker from the [official Docker website](https://docs.docker.com/get-docker/).
- **Usage:** Docker is used to build and run the application. You'll find the Docker commands in the deployment section below.

#### 2. **Golang**
The project backend is written in Golang, so you need to have Go installed.

- **Version:** `Go 1.22.3`
- **Installation:** Download and install Go from the [official website](https://go.dev/dl/).

### Run

```
# build executable
make build

# run webserver to serve static files and API
make run
```

![alt text](https://github.com/jamesk14022/barcrawler/blob/main/web/static/screenshot.jpg?raw=true)
