
const cityPoints = {
  Amsterdam: [4.9041, 52.3676],
  Belfast: [-5.9301, 54.5973],
  "New York": [-74.006, 40.7128],
  Berlin: [13.407705, 52.517424],
  Madrid: [-3.7038, 40.4168],
  Rome: [12.4964, 41.9028],
  Paris: [2.3522, 48.8566],
  Bucharest: [26.1025, 44.4268],
  Vienna: [16.3738, 48.2082],
  Hamburg: [9.9937, 53.5511],
  Warsaw: [21.0122, 52.2297],
  Budapest: [19.0402, 47.4979],
  Barcelona: [2.1734, 41.3851],
  Munich: [11.582, 48.1351],
  Milan: [9.19, 45.4642],
  Prague: [14.4378, 50.0755],
  Sofia: [23.3219, 42.6977],
  Brussels: [4.3517, 50.8503],
  Birmingham: [-1.8904, 52.4862],
  Cologne: [6.9603, 50.9375],
  Naples: [14.2681, 40.8518],
  Stockholm: [18.0686, 59.3293],
  Turin: [7.6869, 45.0703],
  "Cologne": [6.9603, 50.9375],
  "Naples": [14.2681, 40.8518],
  "Marseille": [5.3698, 43.2965],
  "Valencia": [-0.3763, 39.4699],
  "Kraków": [19.9450, 50.0647],
  "Frankfurt": [8.6821, 50.1109],
  "Zagreb": [15.9819, 45.8150],
  "Seville": [-5.9845, 37.3891],
  "Zaragoza": [-0.8891, 41.6488],
  "Helsinki": [24.9355, 60.1695],
  "Wrocław": [17.0385, 51.1079],
  "Rotterdam": [4.4791, 51.9225],
  "Copenhagen": [12.5683, 55.6761],
  "Łódź": [19.4560, 51.7592],
  "Athens": [23.7275, 37.9838],
  "Stuttgart": [9.1829, 48.7758],
  "Düsseldorf": [6.7735, 51.2277],
  "Palermo": [13.3615, 38.1157],
  "Leipzig": [12.3731, 51.3397],
  "Riga": [24.1052, 56.9496],
  "Gothenburg": [11.9746, 57.7089],
  "Vilnius": [25.2797, 54.6872],
  "Dortmund": [7.4653, 51.5136],
  "Dublin": [-6.2603, 53.3498],
  "Málaga": [-4.4214, 36.7213],
  "Essen": [7.0116, 51.4556],
  "Bremen": [8.8017, 53.0793],
  "The Hague": [4.3007, 52.0705],
  "Dresden": [13.7373, 51.0504],
  "Genoa": [8.9463, 44.4056],
  "Antwerp": [4.4025, 51.2194],
  "Lisbon": [-9.1393, 38.7223],
  "Hanover": [9.7320, 52.3759],
  "Poznań": [16.9252, 52.4064],
  "Nuremberg": [11.0767, 49.4521],
  "Lyon": [4.8357, 45.7640],
  "Toulouse": [1.4442, 43.6047],
  "Duisburg": [6.7623, 51.4344],
  "Gdańsk": [18.6466, 54.3520],
  "Bratislava": [17.1077, 48.1486],
  "Murcia": [-1.1307, 37.9922],
  "Tallinn": [24.7535, 59.4370],
  "Palma de Mallorca": [2.6502, 39.5696],
  "Brno": [16.6068, 49.1951],
  "Bologna": [11.3426, 44.4949],
  "Szczecin": [14.5528, 53.4285],
  "Sintra": [-9.3817, 38.8029],
  "Las Palmas": [-15.4363, 28.1235],
  "Utrecht": [5.1214, 52.0907],
  "Aarhus": [10.2039, 56.1629],
  "Bochum": [7.2162, 51.4818],
  "Florence": [11.2558, 43.7696],
  "Malmö": [13.0038, 55.6049],
  "Wuppertal": [7.1508, 51.2562],
  "Alicante": [-0.4810, 38.3452],
  "Nice": [7.2620, 43.7102],
  "Bilbao": [-2.9350, 43.2630],
  "Bielefeld": [8.5325, 52.0302],
  "Bonn": [7.0982, 50.7374],
  "Lublin": [22.5684, 51.2465],
  "Bydgoszcz": [18.0084, 53.1235],
  "Plovdiv": [24.7453, 42.1354],
  "Córdoba": [-4.7794, 37.8882],
  "Varna": [27.9147, 43.2141],
  "Nantes": [-1.5536, 47.2184],
  "Münster": [7.6261, 51.9607],
  "Thessaloniki": [22.9444, 40.6401],
  "Bari": [16.8719, 41.1171],
  "Mannheim": [8.4660, 49.4875],
  "Espoo": [24.6559, 60.2055],
  "Karlsruhe": [8.4037, 49.0069],
  "Vila Nova de Gaia": [-8.6129, 41.1242],
  "Kaunas": [23.9036, 54.8985],
  "Graz": [15.4395, 47.0707],
  "Montpellier": [3.8770, 43.6119],
  "Augsburg": [10.8978, 48.3705]
};

var currentLocation = "Belfast";
const TIME_SPENT_BAR = 30;

mapboxgl.accessToken =
  "pk.eyJ1IjoiamFtZXNrMTQwMjIiLCJhIjoiY2x2cnZqZnV5MHdnYTJxcXpkOHUybzdrZCJ9.UVs8BFzWjaZVrz7Gc0_Wpg";

const refreshButton = document.getElementById("refresh-button");
const shareButton = document.getElementById("shareButton");
const searchBox = document.getElementById("search-box");
const modalExitButton = document.getElementById("exit");
const noPubsConent = document.getElementById("no_pubs");
const cityNotFound = document.getElementById("city_not_found");
const rightBar = document.getElementById("rightBar");

// Populate the dropdown
const numMarkersSelect = document.getElementById("num-markers");
for (let i = 2; i <= 8; i++) {
  let option = document.createElement("option");
  option.value = i;
  option.textContent = i;
  numMarkersSelect.appendChild(option);
}
numMarkersSelect.value = 3;
const distanceSelect = document.getElementById("distance-slider");
for (let i = 0.5; i <= 3; i+=0.5) {
  let option = document.createElement("option");
  option.value = i;
  option.textContent = i;
  distanceSelect.appendChild(option);
}
distanceSelect.value = 3;

// Update the distance value display
const distanceSlider = document.getElementById("distance-slider");

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
var currentMarkers = [];

const clearExistingRoute = () => {
  directions.removeRoutes();
  const nav = (document.getElementById("listing-group").innerHTML = "");
  if (currentMarkers !== null) {
    for (var i = currentMarkers.length - 1; i >= 0; i--) {
      currentMarkers[i].remove();
    }
  }
};

// JavaScript functions to toggle the loading spinner and blur effect
function showLoading() {
  document.querySelector(".loading-spinner").style.display = "block";
  document.querySelector(".loading-overlay").style.display = "block";
  document.getElementById("container").classList.add("blurred");
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
  document.getElementById("container").classList.remove("blurred");
}

function showNoResults() {
  document.querySelector(".loading-overlay").style.display = "none";
  document.querySelector(".loading-spinner").style.display = "none";
  document.getElementById("container").classList.remove("blurred");
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
    routeDurationElement.textContent = parseInt((e[0].duration / 60) + numMarkersSelect.value * TIME_SPENT_BAR);
  }
}

function addCityMarkers() {
  // post request with fe ch
  fetch(`http://127.0.0.1:8080/citypoints/?location=${currentLocation}`, {
    method: "GET", // or 'PUT'
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((waypoints) => {
      // add markers to map
      for (const waypoint of waypoints) {
        // create a HTML element for each feature
        const el = document.createElement('div');
        el.className = 'marker';

        // make a marker for each feature and add to the map
        new mapboxgl.Marker(el).setLngLat([waypoint.Geometry.Location.lng, waypoint.Geometry.Location.lat]).addTo(map);
      }
  })
    .catch((error) => {
      console.error("Error:", error);
    });


}

function pageStart() {
  clearExistingRoute();
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

    currentLocation = location

    fetch(`http://127.0.0.1:8080/crawls/?location=${currentLocation}`, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ place_ids: markers }),
    })
      .then((response) => response.json())
      .then((waypoints) => {
        document.getElementById("distance-slider").value = targetDistance;
        document.getElementById("num-markers").value = targetN;
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
  addCityMarkers();
  waypoints.forEach((waypoint, index) => {
    // Create a custom marker element
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.textContent = String.fromCharCode(65 + index); // Labels A, B, C, etc.

    // Create the marker
    m = new mapboxgl.Marker(el);
    m.setLngLat([
      waypoint.Geometry.Location.lng,
      waypoint.Geometry.Location.lat,
    ])
      .addTo(map)
      .getElement()
      .addEventListener("click", () => {
        displayInfo(index);
      });

    currentMarkers.push(m);

    const input = document.createElement("input");
    input.type = "button";
    input.id = `marker-${index}`;
    input.onclick = () => {
      window.open("https://www.google.com/maps/place/?q=place_id:" + waypoint.place_id, '_blank').focus();
    }
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

    const nav = document.getElementById("listing-group");
    nav.appendChild(input);
    nav.appendChild(label);

    showRightBar();
    hideLoading();
  });

  if (waypoints.length !== 0) {
    function displayInfo(index) {
      // Scroll to the relevant info div
      document
        .getElementById(`info-${index}`)
        .scrollIntoView({ behavior: "smooth" });
    }

    // Set the origin and destination
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
    updateURL(
      currentLocation,
      distanceSlider.value,
      numMarkersSelect.value,
      ...waypoints.map((waypoint) => waypoint.place_id),
    );
  } else {
    toggleNoPubsResults();
    hideLoading();
  }
}

function toggleNoPubsResults() {
  const modal = document.querySelector('.modal');
  modal.classList.toggle('hidden');

  noPubsConent.style.display = "block";
  cityNotFound.style.display = "none";

  hideRightBar();
}

function toggleNoCitiesResults() {
  const modal = document.querySelector('.modal');
  modal.classList.toggle('hidden');

  noPubsConent.style.display = "none";
  cityNotFound.style.display = "block";
}

function updateURL(location, targetDistance, targetN, ...markers) {
  state = {
    location: location,
    targetDistance: targetDistance,
    targetN: targetN,
  };
  for (let i = 0; i < markers.length; i++) {
    state[`marker${i + 1}`] = markers[i];
  }

  pathState = `?location=${location}&target_dist=${targetDistance}&target_n=${targetN}`;
  for (let i = 0; i < markers.length; i++) {
    pathState += `&marker${i + 1}=${markers[i]}`;
  }

  history.pushState(state, "Route", pathState);
}

function addLocations() {
  const dataList = document.getElementById("locations");
  dataList.innerHTML = "";
  for (const city in cityPoints) {
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
    `http://127.0.0.1:8080/pubs/?target_n=${numMarkersSelect.value}&target_dist=${distanceSlider.value}&location=${currentLocation}`,
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
  if (inputVal in cityPoints) {
    map.flyTo({
      center: cityPoints[inputVal],
      zoom: 12,
    });
    currentLocation = inputVal;
    buildMap();
  }else{
    if (e.code === "Enter") {
      toggleNoCitiesResults();
    }
  }
});
searchBox.addEventListener("input", function (e) {
  var inputVal = e.target.value;
  if (inputVal in cityPoints) {
    map.flyTo({
      center: cityPoints[inputVal],
      zoom: 12,
    });
    currentLocation = inputVal;
    buildMap();
  }
});