import {
  CITY_POINTS,
  TIME_SPENT_BAR,
  MAPBOX_TOKEN,
  BASE_URL,
} from "/web/static/constants.js"; // Make sure this path points directly to the albumsData.js file
import { containsObject } from "/web/static/utils.js";

// token scoped and safe for FE use
mapboxgl.accessToken = MAPBOX_TOKEN;

// appplication state
var currentLocation = "Belfast";
var currentMarkers = [];
var selectedDistance = 2;
var selectedMarkers = 2;

const container = document.getElementById("container")
const refreshButton = document.getElementById("refresh-button");
const shareButton = document.getElementById("shareButton");
const searchBox = document.getElementById("search-box");
const modalExitButton = document.getElementById("exit");
const noPubsConent = document.getElementById("no_pubs");
const cityNotFound = document.getElementById("city_not_found");
const rightBar = document.getElementById("rightBar");
const nav = document.getElementById("listing-group");
const dataList = document.getElementById("locations");

const markerMinus = document.querySelectorAll(".marker-quantity-btn-minus");
const markerPlus = document.querySelectorAll(".marker-quantity-btn-plus");
const distanceMinus = document.querySelectorAll(".distance-quantity-btn-minus");
const distancePlus = document.querySelectorAll(".distance-quantity-btn-plus");
const distanceCounter = document.querySelectorAll(".num-distance");
const markerCounter = document.querySelectorAll(".num-markers");

const sidebar = document.getElementById('collap-sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const closeBtn = sidebar.querySelector('.close-btn');

shareButton.addEventListener("click", copyLink);

markerMinus.forEach((btn) => {
btn.addEventListener('click', () => {
  if (selectedMarkers === 2) {
    return;
  }
  selectedMarkers -= parseInt(1);
  setMarkersDisplay(selectedMarkers);
});
});

markerPlus.forEach((btn) => {
btn.addEventListener('click', () => {
  if (selectedMarkers === 8) {
    return;
  }
  selectedMarkers += parseInt(1);
  setMarkersDisplay(selectedMarkers);
});
});

distanceMinus.forEach((btn) => {
btn.addEventListener('click', () => {
  if (selectedDistance === 0.5) {
    return;
  } 
  selectedDistance -= parseFloat(0.5);
  setDistanceDisplay(selectedDistance);
});
});

distancePlus.forEach((btn) => {
btn.addEventListener('click', () => {
  if (selectedDistance === 7) {
    return;
  } 
  selectedDistance += parseFloat(0.5);
  distanceCounter.textContent = parseFloat(selectedDistance);
  setDistanceDisplay(selectedDistance);
});
});

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
  console.log(e.route);
  updateRouteMetrics(e.route);
});

map.addControl(directions, "top-left");

function openSidebar() {
  sidebar.style.width = '400px';
}

function closeSidebar() {
  sidebar.style.width = '0';
}

sidebarToggle.addEventListener('click', openSidebar);
closeBtn.addEventListener('click', closeSidebar);

// Close sidebar when clicking outside of it
document.addEventListener('click', function(event) {
  if (!sidebar.contains(event.target) && event.target !== sidebarToggle) {
    closeSidebar();
  }
});

const setDistanceDisplay = (distance) => {
  distanceCounter.forEach((element) => {
    element.textContent = parseFloat(distance);
  });
}

const setMarkersDisplay = (markers) => {
  markerCounter.forEach((element) => {
    element.textContent = parseInt(markers);
  });
}

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

function copy(text) {
  return new Promise((resolve, reject) => {
      if (typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined" && navigator.permissions !== "undefined") {
          const type = "text/plain";
          const blob = new Blob([text], { type });
          const data = [new ClipboardItem({ [type]: blob })];
          navigator.permissions.query({name: "clipboard-write"}).then((permission) => {
              if (permission.state === "granted" || permission.state === "prompt") {
                  navigator.clipboard.write(data).then(resolve, reject).catch(reject);
              }
              else {
                  reject(new Error("Permission not granted!"));
              }
          });
      }
      else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
          var textarea = document.createElement("textarea");
          textarea.textContent = text;
          textarea.style.position = "fixed";
          textarea.style.width = '2em';
          textarea.style.height = '2em';
          textarea.style.padding = 0;
          textarea.style.border = 'none';
          textarea.style.outline = 'none';
          textarea.style.boxShadow = 'none';
          textarea.style.background = 'transparent';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          try {
              document.execCommand("copy");
              document.body.removeChild(textarea);
              resolve();
          }
          catch (e) {
              document.body.removeChild(textarea);
              reject(e);
          }
      }
      else {
          reject(new Error("None of copying methods are supported by this browser!"));
      }
  });
  
}

function copyLink() {
  // Get the current URL
  var url = window.location.href;

  // Copy the URL to the clipboard
  copy(url).then(
    function () {
      // Change the button text to "Copied ✔️"
      shareButton.textContent = "Copied ✔️";
      shareButton.classList.add("copied");

      // Revert the button text after 2 seconds
      setTimeout(function () {
        shareButton.textContent = "Share Link";
        shareButton.classList.remove("copied");
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
      e[0].duration / 60 + selectedMarkers * TIME_SPENT_BAR,
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
  label.classList.add("marker-label");
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

  console.log(directions)
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

  setDistanceDisplay(selectedDistance);
  setMarkersDisplay(selectedMarkers);

  // Check if the URL contains a query string
  const urlParams = new URLSearchParams(window.location.search);
  if (
    urlParams.has("location") &&
    urlParams.has("target_dist") &&
    urlParams.has("target_n") &&
    urlParams.has("marker1")
  ) {

    setDistanceDisplay(parseFloat(urlParams.get("target_dist")));
    setMarkersDisplay(parseInt(urlParams.get("target_n")));

    // Get the query string values
    const location = urlParams.get("location");
    const targetDistance = urlParams.get("target_dist");
    const targetN = urlParams.get("target_n");
    const markers = [];
    for (let i = 1; i <= targetN; i++) {
      markers.push(urlParams.get(`marker${i}`));
    }

    currentLocation = location;

    fetch(`${BASE_URL}/crawl/?location=${currentLocation}`, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ place_ids: markers }),
    })
      .then((response) => response.json())
      .then((waypoints) => {
        selectedDistance = parseFloat(targetDistance);
        selectedMarkers = parseInt(targetN);
        updateRouteMetrics();
        map.on("load", function () {
          renderRoute(waypoints)
        });
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
      selectedDistance,
      selectedMarkers,
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
    `${BASE_URL}/pubs/?target_n=${selectedMarkers}&target_dist=${selectedDistance}&location=${currentLocation}`,
  )
    .then((response) => response.json())
    .then((waypoints) => {
      renderRoute(waypoints);
    });
  updateRouteMetrics();
};

window.onload = pageStart;

refreshButton.addEventListener("click", buildMap);
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
