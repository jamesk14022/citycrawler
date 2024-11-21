export const map = new mapboxgl.Map({
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
  updateRouteMetrics(e.route);
});

map.addControl(directions, "top-left");

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

export function setupRenderAlternativeAttractionMarkesPopup() {
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
}

export function flyToLocation(location) {
  map.flyTo({
    center: location,
    zoom: 12,
  });
}

export function renderMapRoute(waypoints) {
  directions.removeRoutes();

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
