import { INITIAL_LOCATION, MAPBOX_TOKEN, TIME_SPENT_BAR } from "./constants.js";
import { setRouteLength, setRouteDuration } from "./ui.js";
import { convertToGeoJSON } from "./utils.js";
import { selectStartEvent } from "./client.js";
import { getGoogleMapsPhoto } from "./api.js";

// token scoped and safe for FE use
mapboxgl.accessToken = MAPBOX_TOKEN;

export const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: INITIAL_LOCATION,
  zoom: 12,
});

console.log(map);

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/walking",
  interactive: false,
});

directions.on("route", (e) => {
  setRouteLength((e["route"][0].distance / 1000).toFixed(2));
  setRouteDuration(
    parseInt(
      e["route"][0].duration / 60 +
        (e["route"][0]["legs"].length + 1) * TIME_SPENT_BAR,
    ),
  );
});

map.addControl(directions, "top-left");

export function removeExistingRoute() {
  directions.removeRoutes();
}

export function removeAlternativeAttractionMarkers() {
  if (map.getSource("places")) {
    map.removeLayer("places");
    map.removeSource("places");
  }
}

export function renderAlternativeAttractionMarkers(waypoints) {
  map.addSource("places", convertToGeoJSON(waypoints));
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
}

async function buildAlternativeAttractionMarkerPopupDescription(waypoint) {
  const photoResult = await getGoogleMapsPhoto(
    JSON.parse(waypoint.photos)[0].photo_reference,
  );
  const imageSrc = `data:image/jpeg;base64,${photoResult.body}`;

  let description = `<strong>${waypoint.name}</strong>`;
  if (waypoint.rating !== 0) {
    description += `<br>Rating: `;
    for (let i = 0; i < parseFloat(waypoint.rating); i++) {
      description += "&#9733;";
    }
  }
  if (waypoint.price_level !== 0) {
    description += `<br>Price Level: ${"$".repeat(waypoint.price_level)}`;
  }
  if (waypoint.types.includes("tourist_attraction")) {
    description = `🎡 ${description}`;
  } else {
    description = `🍺 ${description}`;
  }

  description += `<br><img class="mt-1" src="${imageSrc}" alt="Photo of ${waypoint.name}" style="width: 100%; height: auto;">`;
  description += `<br><button class="select-start-button m-2 p-2 mt-1 mx-auto rounded-md" data-id="${waypoint.place_id}" data-name="${waypoint.name}">Select as starting point</button>`;
  description = `<div class="shadow-md rounded-md p-1">${description}</div>`;

  return description;
}

export async function setupRenderAlternativeAttractionMarkersPopup() {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  });

  let isMouseOverMarker = false;
  let isHoveringPopup = false;
  let removalTimeout;

  // Detect mouse enter/leave on the popup itself
  popup.on("open", async () => {
    const popupElement = popup._content;

    popupElement.addEventListener("mouseenter", () => {
      isHoveringPopup = true;
    });

    popupElement.addEventListener("mouseleave", () => {
      isHoveringPopup = false;
      schedulePopupRemoval();
    });
  });

  function schedulePopupRemoval() {
    clearTimeout(removalTimeout);
    removalTimeout = setTimeout(() => {
      if (!isMouseOverMarker && !isHoveringPopup) {
        popup.remove();
        map.getCanvas().style.cursor = "";
      }
    }, 100); // Adjust timeout (ms) as needed
  }

  map.on("mouseenter", "places", async (e) => {
    isMouseOverMarker = true;
    clearTimeout(removalTimeout);

    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = "pointer";

    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    // description to name for now
    const description = await buildAlternativeAttractionMarkerPopupDescription(
      e.features[0].properties,
    );

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates).setHTML(description).addTo(map);

    popup.on("open", () => {
      const buttons = document.querySelectorAll(".select-start-button"); // Select all buttons with the class
      buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
          selectStartEvent(event.target.dataset.id, event.target.dataset.name);
        });
      });
    });
  });

  map.on("mouseleave", "places", () => {
    isMouseOverMarker = false;
    schedulePopupRemoval();
  });
}

export function flyToLocation(location) {
  map.flyTo({
    center: location,
    zoom: 12,
  });
}

export function renderMapRoute(waypoints) {
  removeExistingRoute();

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

export function renderRouteMarker(waypoint, index) {
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
  return m;
}
