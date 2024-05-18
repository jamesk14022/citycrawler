

const cityPoints = {
  "Amsterdam": [4.9041, 52.3676],
  "Belfast": [-5.9301, 54.5973],
  "New York": [-74.0060, 40.7128],
  "Berlin": [13.407705, 52.517424],
  "Madrid": [-3.7038, 40.4168],
  "Rome": [12.4964, 41.9028],
  "Paris": [2.3522, 48.8566],
  "Bucharest": [26.1025, 44.4268],
  "Vienna": [16.3738, 48.2082],
  "Hamburg": [9.9937, 53.5511],
  "Warsaw": [21.0122, 52.2297],
  "Budapest": [19.0402, 47.4979],
  "Barcelona": [2.1734, 41.3851],
  "Munich": [11.5820, 48.1351],
  "Milan": [9.1900, 45.4642],
  "Prague": [14.4378, 50.0755],
  "Sofia": [23.3219, 42.6977],
  "Brussels": [4.3517, 50.8503],
  "Birmingham": [-1.8904, 52.4862],
  "Cologne": [6.9603, 50.9375],
  "Naples": [14.2681, 40.8518],
  "Stockholm": [18.0686, 59.3293],
  "Turin": [7.6869, 45.0703]
};

var currentLocation = "Belfast";

mapboxgl.accessToken =
        "pk.eyJ1IjoiamFtZXNrMTQwMjIiLCJhIjoiY2x2cnZqZnV5MHdnYTJxcXpkOHUybzdrZCJ9.UVs8BFzWjaZVrz7Gc0_Wpg";

      const refreshButton = document.getElementById("refresh-button");
      const shareButton = document.getElementById("shareButton");
      // Populate the dropdown
      const numMarkersSelect = document.getElementById("num-markers");
      for (let i = 2; i <= 6; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        numMarkersSelect.appendChild(option);
      }
      numMarkersSelect.value = 3;

      // Update the distance value display
      const distanceSlider = document.getElementById("distance-slider");
      const distanceValue = document.getElementById("distance-value");
      distanceSlider.addEventListener("input", () => {
        distanceValue.textContent = distanceSlider.value + "km";
      });

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

      map.addControl(directions, "top-left");
      var currentMarkers = [];

      const clearInfo = () => {
        directions.removeRoutes();
        const nav = document.getElementById("listing-group").innerHTML = "";
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

    function hideLoading() {
        document.querySelector(".loading-spinner").style.display = "none";
        document.querySelector(".loading-overlay").style.display = "none";
        document.getElementById("container").classList.remove("blurred");
    }

    function showNoResults() {
      document.getElementById("no-results").style.display = "flex";
      document.querySelector(".loading-overlay").style.display = "none";
      document.querySelector(".loading-spinner").style.display = "none";
      document.getElementById("container").classList.remove("blurred");
    }

    function copyLink() {
      // Get the current URL
      var url = window.location.href;

      // Copy the URL to the clipboard
      navigator.clipboard.writeText(url).then(function() {
          // Change the button text to "Copied ✔️"
          var button = document.getElementById("shareButton");
          button.textContent = "Copied ✔️";
          button.classList.add("copied");

          // Revert the button text after 2 seconds
          setTimeout(function() {
              button.textContent = "Share Link";
              button.classList.remove("copied");
          }, 2000);
      }, function(err) {
          console.error('Could not copy text: ', err);
      });
    }
    
    function pageStart() {

      clearInfo();
      showLoading();
      hideNoResults();
      addLocations();

      // Check if the URL contains a query string
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("location") && urlParams.has("target_dist") && urlParams.has("target_n") && urlParams.has("marker1")) {

        // Get the query string values  
        const location = urlParams.get("location");
        const targetDistance = urlParams.get("target_dist");
        const targetN = urlParams.get("target_n");
        const markers = [];
        for (let i = 1; i <= targetN; i++) {
          markers.push(urlParams.get(`marker${i}`));
        }

        // post request with fetch
        fetch(  
          `http://127.0.0.1:8080/crawls/?location=${currentLocation}`,{
            method: "POST", // or 'PUT'
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({place_ids: markers}),
          })
          .then((response) => response.json())
          .then((waypoints) => {
            document.getElementById("distance-slider").value = targetDistance;
            document.getElementById("distance-value").textContent = targetDistance + "km";
            document.getElementById("num-markers").value = targetN;
            renderRoute(waypoints);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }else{
        buildMap();
      }
    }

    function renderRoute(waypoints){
      waypoints.forEach((waypoint, index) => {
        // Create a custom marker element
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.textContent = String.fromCharCode(65 + index); // Labels A, B, C, etc.

        // Create the marker
        m = new mapboxgl.Marker(el);
        m.setLngLat([waypoint.Geometry.Location.lng, waypoint.Geometry.Location.lat])
          .addTo(map)
          .getElement()
          .addEventListener("click", () => {
            displayInfo(index);
          });

        currentMarkers.push(m);

        const input = document.createElement("input");
        input.type = "button";
        input.id = `marker-${index}`;
        const label = document.createElement("label");
        label.htmlFor = `marker-${index}`;
        label.innerHTML = `<strong>Point ${String.fromCharCode(65 + index,)}</strong><br>${waypoint.name}`;
        const nav = document.getElementById("listing-group");
        nav.appendChild(input);
        nav.appendChild(label);

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
        updateURL(currentLocation, distanceSlider.value, numMarkersSelect.value, ...waypoints.map(waypoint => waypoint.place_id));
      }else{
        showNoResults();
      }
    }

    function hideNoResults() {
      document.getElementById("no-results").style.display = "none";
    }

    function updateURL(location, targetDistance, targetN, ...markers) {

      state = {location: location, targetDistance: targetDistance, targetN: targetN};
      for (let i = 0; i < markers.length; i++) {
        state[`marker${i+1}`] = markers[i];
      }

      pathState = `?location=${location}&target_dist=${targetDistance}&target_n=${targetN}`;
      for (let i = 0; i < markers.length; i++) {
        pathState += `&marker${i+1}=${markers[i]}`;
      }

      history.pushState(
        state,
        "Route",
        pathState
      );
    }

    function addLocations() {
      const dataList = document.getElementById("locations");
      for (const city in cityPoints) {
        const option = document.createElement("option");
        option.value = city;
        dataList.appendChild(option);
      }
    }

    const buildMap = () => {

      clearInfo();
      showLoading();
      hideNoResults();
      addLocations();

        document.getElementById('search-box').addEventListener('input', function(e) {
          var inputVal = e.target.value;
          console.log("User selected: ", inputVal);
          if (inputVal in cityPoints) {
            map.flyTo({
              center: cityPoints[inputVal],
              zoom: 12
            });
            currentLocation = inputVal;
          }
        });

        fetch(
          `http://127.0.0.1:8080/pubs/?target_n=${numMarkersSelect.value}&target_dist=${distanceSlider.value}&location=${currentLocation}`,
        )
          .then((response) => response.json())
          .then((waypoints) => {
            renderRoute(waypoints);
          });
      };

      window.onload = pageStart;
      refreshButton.addEventListener("click", buildMap);
      shareButton.addEventListener("click", copyLink);