import {
  CITY_POINTS,
  TIME_SPENT_BAR,
  MAPBOX_TOKEN,
  BASE_URL,
} from "/static/constants.js"; // Make sure this path points directly to the albumsData.js file
import { containsObject } from "/static/utils.js";

// token scoped and safe for FE use
mapboxgl.accessToken = MAPBOX_TOKEN;

// appplication state
var currentLocation = "Belfast";
var currentMarkers = [];

const container = document.getElementById("container")
const refreshButton = document.getElementById("refresh-button");
const shareButton = document.getElementById("shareButton");
const searchBox = document.getElementById("search-box");
const modalExitButton = document.getElementById("exit");
const noPubsConent = document.getElementById("no_pubs");
const cityNotFound = document.getElementById("city_not_found");
const rightBar = document.getElementById("rightBar");
const distanceSelect = document.getElementById("distance-slider");
const numMarkersSelect = document.getElementById("num-markers");
const nav = document.getElementById("listing-group");
const dataList = document.getElementById("locations");


function populateMarkerOptions() {
  // Populate the dropdown
  for (let i = 2; i <= 8; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    numMarkersSelect.appendChild(option);
  }
  numMarkersSelect.value = 3;
}

function populateDistanceOptions() {
  // add distance options
  let option = document.createElement("option");
  option.value = 0.25;
  option.textContent = 0.25;
  distanceSelect.appendChild(option);
  for (let i = 0.5; i <= 3; i += 0.5) {
    let option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    distanceSelect.appendChild(option);
  }
  distanceSelect.value = 3;
}

// Update the distance value display
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [4.89714, 52.3663],
  zoom: 12,
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/walking",
});

directions.on("route", (e) => {
  updateRouteMetrics(e.route);
});

map.addControl(directions, "top-left");

const clearExistingRoute = () => {
  directions.removeRoutes();
  nav.innerHTML = "";
  if (currentMarkers !== null) {
    for (var i = currentMarkers.length - 1; i >= 0; i--) {
      currentMarkers[i].remove();
    }
    currentMarkers = [];
  }

  if (map.getSource("places")) {
    map.removeLayer("places");
    map.removeSource("places");
  }
};

function showLoading() {
  document.querySelector(".loading-spinner").style.display = "block";
  document.querySelector(".loading-overlay").style.display = "block";
  container.classList.add("blurred");
}

function hideRightBar() {
  rightBar.style.display = "none";
}

function showRightBar() {
  rightBar.style.display = "block";
}

function hideLoading() {
  document.querySelector(".loading-spinner").style.display = "none";
  document.querySelector(".loading-overlay").style.display = "none";
  container.classList.remove("blurred");
}

function copyLink() {
  // Get the current URL
  var url = window.location.href;

  // Copy the URL to the clipboard
  navigator.clipboard.writeText(url).then(
    function () {
      // Change the button text to "Copied ✔️"
      var button = document.getElementById("shareButton");
      button.textContent = "Copied ✔️";
      button.classList.add("copied");

      // Revert the button text after 2 seconds
      setTimeout(function () {
        button.textContent = "Share Link";
        button.classList.remove("copied");
      }, 2000);
    },
    function (err) {
      console.error("Could not copy text: ", err);
    },
  );
}

function updateRouteMetrics(e) {
  if (e !== undefined) {
    const routeLengthElement = document.getElementById("route-length");
    routeLengthElement.textContent = (e[0].distance / 1000).toFixed(2);

    const routeDurationElement = document.getElementById("route-duration");
    routeDurationElement.textContent = parseInt(
      e[0].duration / 60 + numMarkersSelect.value * TIME_SPENT_BAR,
    );
  }
}

function renderRouteMarker(waypoint, index) {
  // Create a custom marker element
  const el = document.createElement("div");
  el.className = "custom-marker";
  el.textContent = String.fromCharCode(65 + index); // Labels A, B, C, etc.

  // Create the marker
  var m = new mapboxgl.Marker(el);
  m.setLngLat([waypoint.Geometry.Location.lng, waypoint.Geometry.Location.lat])
    .addTo(map)
    .getElement()
    .addEventListener("click", () => {
      displayInfo(index);
    });

  currentMarkers.push(m);
}

function convertToGeoJSON(dataArray) {
  return {
      'type': 'geojson',
      'data': {
          'type': 'FeatureCollection',
          'features': dataArray.map(item => ({
              'type': 'Feature',
              'properties': {
                  'name': item.name,
                  'place_id': item.place_id,
                  'price_level': item.price_level,
                  'rating': item.rating
              },
              'geometry': {
                  'type': 'Point',
                  'coordinates': [item.Geometry.Location.lng, item.Geometry.Location.lat]
              }
          }))
      }
  };
}



function addAlternativeBarMarkers(route_points) {
  fetch(`${BASE_URL}/citypoints/?location=${currentLocation}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((waypoints) => {
      waypoints = waypoints.filter(waypoint => !containsObject(waypoint.place_id, route_points.map(x => x.place_id)));
      let convertedGEOJSON = convertToGeoJSON(waypoints);
      map.addSource('places', convertedGEOJSON);
      map.addLayer({
        'id': 'places',
        'type': 'circle',
        'source': 'places',
        'paint': {
            'circle-color': '#4264fb',
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        }
      });

      const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
      });

      map.on('mouseenter', 'places', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
    
        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        // description to name for now
        const description = e.features[0].properties.name;
    
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
    
        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setHTML(description).addTo(map);
        
      });
    
      map.on('mouseleave', 'places', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function renderBarInformationBox(waypoint, index) {
  const input = document.createElement("input");
  input.type = "button";
  input.id = `marker-${index}`;
  input.onclick = () => {
    window
      .open(
        "https://www.google.com/maps/place/?q=place_id:" + waypoint.place_id,
        "_blank",
      )
      .focus();
  };
  const label = document.createElement("label");
  label.htmlFor = `marker-${index}`;
  label.innerHTML = `<strong>Point ${String.fromCharCode(
    65 + index,
  )}</strong><br>${waypoint.name}`;

  const ratingDiv = document.createElement("div");
  for (let i = 0; i < parseFloat(waypoint.rating); i++) {
    const starSpan = document.createElement("span");
    starSpan.innerHTML = "&#9733;";
    ratingDiv.appendChild(starSpan);
  }

  if (waypoint.rating != 0 && waypoint.price_level != 0) {
    const splitSpan = document.createElement("span");
    splitSpan.innerHTML = " | ";
    ratingDiv.appendChild(splitSpan);
  }

  for (let i = 0; i < parseInt(waypoint.price_level); i++) {
    const dollarSpan = document.createElement("span");
    dollarSpan.innerHTML = "$";
    ratingDiv.appendChild(dollarSpan);
  }

  label.innerHTML += "<br>";
  label.innerHTML += ratingDiv.innerHTML;

  nav.appendChild(input);
  nav.appendChild(label);
}

function registerRoute(waypoints) {

  directions.setOrigin([
    waypoints[0].Geometry.Location.lng,
    waypoints[0].Geometry.Location.lat,
  ]);

  directions.setDestination([
    waypoints[waypoints.length - 1].Geometry.Location.lng,
    waypoints[waypoints.length - 1].Geometry.Location.lat,
  ]);

  // Add the middle waypoints
  waypoints.slice(1, -1).forEach((waypoint_mid, index) => {
    directions.addWaypoint(index, [
      waypoint_mid.Geometry.Location.lng,
      waypoint_mid.Geometry.Location.lat,
    ]);
  });
}

function pageStart() {
  populateMarkerOptions();
  populateDistanceOptions();

  showLoading();
  addLocations();

  // Check if the URL contains a query string
  const urlParams = new URLSearchParams(window.location.search);
  if (
    urlParams.has("location") &&
    urlParams.has("target_dist") &&
    urlParams.has("target_n") &&
    urlParams.has("marker1")
  ) {
    // Get the query string values
    const location = urlParams.get("location");
    const targetDistance = urlParams.get("target_dist");
    const targetN = urlParams.get("target_n");
    const markers = [];
    for (let i = 1; i <= targetN; i++) {
      markers.push(urlParams.get(`marker${i}`));
    }

    currentLocation = location;

    fetch(`${BASE_URL}/crawls/?location=${currentLocation}`, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ place_ids: markers }),
    })
      .then((response) => response.json())
      .then((waypoints) => {
        console.log(waypoints); 
        distanceSelect.value = targetDistance;
        numMarkersSelect.value = targetN;
        renderRoute(waypoints);
        updateRouteMetrics();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    buildMap();
  }
}

function renderRoute(waypoints) {
  clearExistingRoute();

  waypoints.forEach((waypoint, index) => {
    renderRouteMarker(waypoint, index);
    renderBarInformationBox(waypoint, index);
  });

  addAlternativeBarMarkers(waypoints);
  showRightBar();
  hideLoading();

  if (waypoints.length !== 0) {
    registerRoute(waypoints);

    updateURL(
      currentLocation,
      distanceSelect.value,
      numMarkersSelect.value,
      ...waypoints.map((waypoint) => waypoint.place_id),
    );
  } else {
    toggleNoPubsResults();
    hideLoading();
  }
}

function toggleNoPubsResults() {
  const modal = document.querySelector(".modal");
  modal.classList.toggle("hidden");

  noPubsConent.style.display = "block";
  cityNotFound.style.display = "none";

  hideRightBar();
}

function toggleNoCitiesResults() {
  const modal = document.querySelector(".modal");
  modal.classList.toggle("hidden");

  noPubsConent.style.display = "none";
  cityNotFound.style.display = "block";
}

function updateURL(location, targetDistance, targetN, ...markers) {
  var state = {
    location: location,
    targetDistance: targetDistance,
    targetN: targetN,
  };
  for (let i = 0; i < markers.length; i++) {
    state[`marker${i + 1}`] = markers[i];
  }

  var pathState = `?location=${location}&target_dist=${targetDistance}&target_n=${targetN}`;
  for (let i = 0; i < markers.length; i++) {
    pathState += `&marker${i + 1}=${markers[i]}`;
  }

  history.pushState(state, "Route", pathState);
}

function addLocations() {
  dataList.innerHTML = "";
  for (const city in CITY_POINTS) {
    const option = document.createElement("option");
    option.value = city;
    dataList.appendChild(option);
  }
}

const buildMap = () => {
  clearExistingRoute();
  showLoading();
  addLocations();

  fetch(
    `${BASE_URL}/pubs/?target_n=${numMarkersSelect.value}&target_dist=${distanceSelect.value}&location=${currentLocation}`,
  )
    .then((response) => response.json())
    .then((waypoints) => {
      renderRoute(waypoints);
    });
  updateRouteMetrics();
};

window.onload = pageStart;

refreshButton.addEventListener("click", buildMap);
shareButton.addEventListener("click", copyLink);
modalExitButton.addEventListener("click", toggleNoPubsResults);
searchBox.addEventListener("keypress", function (e) {
  var inputVal = e.target.value;
  if (inputVal in CITY_POINTS) {
    map.flyTo({
      center: CITY_POINTS[inputVal],
      zoom: 12,
    });
    currentLocation = inputVal;
    buildMap();
  } else {
    if (e.code === "Enter") {
      toggleNoCitiesResults();
    }
  }
});
searchBox.addEventListener("input", function (e) {
  var inputVal = e.target.value;
  if (inputVal in CITY_POINTS) {
    map.flyTo({
      center: CITY_POINTS[inputVal],
      zoom: 12,
    });
    currentLocation = inputVal;
    buildMap();
  }
});
