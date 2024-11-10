import {
  TIME_SPENT_BAR,
  MAPBOX_TOKEN,
  BASE_URL,
  GOOGLE_MAP_BASE_URL,
  INITIAL_LOCATION,
  container,
  refreshButton,
  shareButton,
  searchBox,
  modalExitButton,
  noPubsConent,
  cityNotFound,
  rightBar,
  nav,
  dataList,
  markerMinus,
  markerPlus,
  attractionMinus,
  attractionPlus,
  attractionCounter,
  markerCounter,
  sidebar,
  sidebarToggle,
  closeBtn,
} from "./constants.js";
import { containsObject, copy, updateURL, convertToGeoJSON } from "./utils.js";

// token scoped and safe for FE use
mapboxgl.accessToken = MAPBOX_TOKEN;

// appplication state
let currentLocation = "Dublin";
let currentMarkers = [];
let selectedPubs = 3;
let selectedAttractions = 1;
let cityPoints = {};

shareButton.addEventListener("click", copyLink);

markerMinus.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (selectedPubs === 2) {
      return;
    }
    selectedPubs -= 1;
    setMarkersDisplay(selectedPubs);
  });
});

markerPlus.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (selectedPubs === 8) {
      return;
    }
    selectedPubs += parseInt(1);
    setMarkersDisplay(selectedPubs);
  });
});

attractionMinus.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (selectedAttractions === 1.0) {
      return;
    }
    selectedAttractions -= 1;
    setAttractionDisplay(selectedAttractions);
  });
});

attractionPlus.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (selectedAttractions === 4) {
      return;
    }
    selectedAttractions += 1;
    setAttractionDisplay(selectedAttractions);
  });
});

// Update the distance value display
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: INITIAL_LOCATION,
  zoom: 12,
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/walking",
});

directions.on("route", (e) => {
  console.log(e.route);
  updateRouteMetrics(e.route);
});

map.addControl(directions, "top-left");

const openSidebar = () => (sidebar.style.width = "400px");
const closeSidebar = () => (sidebar.style.width = "0");
sidebarToggle.addEventListener("click", openSidebar);
closeBtn.addEventListener("click", closeSidebar);

// Close sidebar when clicking outside of it
document.addEventListener("click", function (event) {
  if (!sidebar.contains(event.target) && event.target !== sidebarToggle) {
    closeSidebar();
  }
});

const setAttractionDisplay = (attractions) => {
  attractionCounter.forEach((element) => {
    element.textContent = parseFloat(attractions);
  });
};

const setMarkersDisplay = (markers) => {
  markerCounter.forEach((element) => {
    element.textContent = markers;
  });
};

const clearExistingRoute = () => {
  directions.removeRoutes();
  nav.innerHTML = "";
  if (currentMarkers !== null) {
    for (let i = currentMarkers.length - 1; i >= 0; i--) {
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

const hideRightBar = () => (rightBar.style.display = "none");
const showRightBar = () => (rightBar.style.display = "block");

function hideLoading() {
  document.querySelector(".loading-spinner").style.display = "none";
  document.querySelector(".loading-overlay").style.display = "none";
  container.classList.remove("blurred");
}

function copyLink() {
  // Get the current URL
  let url = window.location.href;

  // Copy the URL to the clipboard
  copy(url);
  // Change the button text to "Copied ✔️"
  shareButton.textContent = "Copied ✔️";
  shareButton.classList.add("copied");

  // Revert the button text after 2 seconds
  setTimeout(function () {
    shareButton.textContent = "Share Link";
    shareButton.classList.remove("copied");
  }, 2000);
}

function updateRouteMetrics(e) {
  if (e !== undefined) {
    const routeLengthElement = document.getElementById("route-length");
    routeLengthElement.textContent = (e[0].distance / 1000).toFixed(2);

    const routeDurationElement = document.getElementById("route-duration");
    routeDurationElement.textContent = parseInt(
      e[0].duration / 60 + selectedPubs * TIME_SPENT_BAR,
    );
  }
}

function renderRouteMarker(waypoint, index) {
  // Create a custom marker element
  const el = document.createElement("div");
  el.className = "custom-marker";
  el.textContent = String.fromCharCode(65 + index); // Labels A, B, C, etc.

  // Create the marker
  let m = new mapboxgl.Marker(el);
  m.setLngLat([waypoint.Geometry.Location.lng, waypoint.Geometry.Location.lat])
    .addTo(map)
    .getElement()
    .addEventListener("click", () => {
      displayInfo(index);
    });

  currentMarkers.push(m);
}

function addAlternativeBarMarkers(route_points) {
  fetch(`${BASE_URL}/citypoints?location=${currentLocation}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((waypoints) => {
      waypoints = waypoints.filter(
        (waypoint) =>
          !containsObject(
            waypoint.place_id,
            route_points.map((x) => x.place_id),
          ),
      );
      let convertedGEOJSON = convertToGeoJSON(waypoints);
      map.addSource("places", convertedGEOJSON);
      map.addLayer({
        id: "places",
        type: "circle",
        source: "places",
        paint: {
          "circle-color": "#4264fb",
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.on("mouseenter", "places", (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = "pointer";

        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        // description to name for now
        const description = e.features[0].properties.name;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setHTML(description).addTo(map);
      });

      map.on("mouseleave", "places", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function renderBarInformationBox(waypoint, index) {
  console.log(waypoint);

  const input = document.createElement("input");
  input.type = "button";
  input.id = `marker-${index}`;
  input.onclick = () => {
    let url = `${GOOGLE_MAP_BASE_URL}/?api=1&query=${waypoint.Geometry.Location.lat},${waypoint.Geometry.Location.lng}&query_place_id=${waypoint.place_id}`;
    window.open(url, "_blank").focus();
  };
  const label = document.createElement("label");
  label.htmlFor = `marker-${index}`;
  label.classList.add("marker-label");
  label.innerHTML = `<strong>Point ${String.fromCharCode(
    65 + index,
  )}</strong><br>${waypoint.name}`;

  if (waypoint.types.includes("tourist_attraction")) {
    label.innerHTML = "🎡 " + label.innerHTML;
  } else {
    label.innerHTML = "🍺 " + label.innerHTML;
  }

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
  console.log(directions);
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
  showLoading();
  addLocations();

  setAttractionDisplay(selectedAttractions);
  setMarkersDisplay(selectedPubs);

  // Check if the URL contains a query string
  const urlParams = new URLSearchParams(window.location.search);
  if (
    urlParams.has("location") &&
    urlParams.has("target_pubs") &&
    urlParams.has("target_attractions") &&
    urlParams.has("marker1")
  ) {
    setAttractionDisplay(parseFloat(urlParams.get("target_attractions")));
    setMarkersDisplay(parseInt(urlParams.get("target_pubs")));

    // Get the query string values
    const location = urlParams.get("location");
    const targetPubs = parseInt(urlParams.get("target_pubs"));
    const targetAttractions = parseInt(urlParams.get("target_attractions"));
    const markers = [];
    for (let i = 1; i <= targetPubs + targetAttractions; i++) {
      markers.push(urlParams.get(`marker${i}`));
    }

    currentLocation = location;

    map.on("load", function () {
      fetch(`${BASE_URL}/crawl?location=${currentLocation}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ place_ids: markers.filter((n) => n) }),
      })
        .then((response) => response.json())
        .then((waypoints) => {
          selectedPubs = targetPubs;
          updateRouteMetrics();
          console.log("Rendering specific route");
          renderRoute(waypoints);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
  } else {
    map.on("load", function () {
      buildMap();
    });
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
      selectedPubs,
      selectedAttractions,
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

function addLocations() {
  dataList.innerHTML = "";
  fetch(
    `${BASE_URL}/cities`,
  )
    .then((response) => response.json())
    .then((cities) => {

      cityPoints = cities;

      for (const city in cities) {
        const option = document.createElement("option");
        option.value = city;
        dataList.appendChild(option);
      }
    });
  updateRouteMetrics();
}

function buildMap() {
  clearExistingRoute();
  showLoading();
  addLocations();

  fetch(
    `${BASE_URL}/pubs?target_pubs=${selectedPubs}&target_attractions=${selectedAttractions}&location=${currentLocation}`,
  )
    .then((response) => response.json())
    .then((waypoints) => {
      console.log(waypoints);
      renderRoute(waypoints);
    });
  updateRouteMetrics();
}

refreshButton.addEventListener("click", buildMap);
modalExitButton.addEventListener("click", toggleNoPubsResults);
searchBox.addEventListener("keypress", (e) => {
  let inputVal = e.target.value;
  if (inputVal in cityPoints) {
    map.flyTo({
      center: cityPoints[inputVal],
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
searchBox.addEventListener("input", (e) => {
  let inputVal = e.target.value;
  if (inputVal in cityPoints) {
    map.flyTo({
      center: cityPoints[inputVal],
      zoom: 12,
    });
    currentLocation = inputVal;
    buildMap();
  }
});

window.onload = pageStart;
