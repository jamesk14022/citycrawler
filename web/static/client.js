import { TIME_SPENT_BAR } from "./constants.js";
import { containsObject, copy, updateURL } from "./utils.js";
import { getCityPoints, postCrawl, getCities, getPubs } from "./api.js";
import {
  clearBarInformationBox,
  clearCityList,
  populateCityList,
  setRouteLength,
  setShareButtonCopied,
  setupShareButtonEvents,
  setupRefreshButtonEvents,
  // setupModalExitButtonEvents,
  setupSearchBoxEvents,
  setRouteDuration,
  setMarkersDisplay,
  setAttractionDisplay,
  showRightBar,
  hideLoading,
  showLoading,
  toggleNoPubsResults,
  toggleNoCitiesResults,
  setupPubPlusMinusEvents,
  setupAttractionPlusMinusEvents,
  renderBarInformationBox,
  setupPillClosedEvents,
  hidePill,
  showPill,
} from "./ui.js";
import {
  flyToLocation,
  renderMapRoute,
  renderAlternativeAttractionMarkers,
  removeAlternativeAttractionMarkers,
  renderRouteMarker,
  setupRenderAlternativeAttractionMarkersPopup,
  removeExistingRoute,
  map,
} from "./map.js";

// appplication state
let currentLocation = "dublin";
let currentMarkers = [];
let selectedFirstLocation = "";
let selectedPubs = 3;
let selectedAttractions = 1;
let currentCityPoints = [];
let cityPoints = {};

setupShareButtonEvents(() => {
  copyShareLink();
});

setupPubPlusMinusEvents(
  () => {
    if (selectedPubs === 2) {
      return;
    }
    selectedPubs -= 1;
    setMarkersDisplay(selectedPubs);
  },
  () => {
    if (selectedPubs === 8) {
      return;
    }
    selectedPubs += parseInt(1);
    setMarkersDisplay(selectedPubs);
  },
);

setupAttractionPlusMinusEvents(
  () => {
    if (selectedAttractions === 1.0) {
      return;
    }
    selectedAttractions -= 1;
    setAttractionDisplay(selectedAttractions);
  },
  () => {
    if (selectedAttractions === 4) {
      return;
    }
    selectedAttractions += 1;
    setAttractionDisplay(selectedAttractions);
  },
);

export function selectStartEvent(place_id, place_name) {
  selectedFirstLocation = place_id;
  showPill(place_name);
}

const clearExistingRoute = () => {
  removeExistingRoute();
  clearBarInformationBox();
  removeAlternativeAttractionMarkers();
  if (currentMarkers !== null) {
    for (let i = currentMarkers.length - 1; i >= 0; i--) {
      currentMarkers[i].remove();
    }
    currentMarkers = [];
  }
};

function copyShareLink() {
  // Get the current URL
  let url = window.location.href;
  // Copy the URL to the clipboard
  copy(url);
  setShareButtonCopied();
}

function updateRouteMetrics(e) {
  if (e !== undefined) {
    setRouteLength((e[0].distance / 1000).toFixed(2));
    setRouteDuration(
      parseInt(e[0].duration / 60 + selectedPubs * TIME_SPENT_BAR),
    );
  }
}

async function addAlternativeBarMarkers(route_points) {
  let cityPoints = await getCityPoints(currentLocation);
  cityPoints = await cityPoints.filter(
    (cityPoint) =>
      !containsObject(
        cityPoint.place_id,
        route_points.map((x) => x.place_id),
      ),
  );
  currentCityPoints = cityPoints;
  renderAlternativeAttractionMarkers(cityPoints);
  await setupRenderAlternativeAttractionMarkersPopup();
}

async function pageStart() {
  showLoading();
  addCityLocations();

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

    currentLocation = location.toLowerCase();

    map.on("load", async function () {
      let waypoints = await postCrawl(currentLocation, markers);
      selectedPubs = targetPubs;
      updateRouteMetrics();
      await renderRoute(waypoints);
      hideLoading();
    });
  } else {
    map.on("load", async function () {
      clearExistingRoute();
      showLoading();
      let waypoints = await getPubs(
        selectedPubs,
        selectedAttractions,
        currentLocation,
        selectedFirstLocation,
      );
      await renderRoute(waypoints);
      updateRouteMetrics();
      hideLoading();
    });
  }
}

async function renderRoute(waypoints) {
  clearExistingRoute();

  waypoints.forEach((waypoint, index) => {
    let m = renderRouteMarker(waypoint, index);
    currentMarkers.push(m);
    renderBarInformationBox(waypoint, index);
  });

  await addAlternativeBarMarkers(waypoints);
  showRightBar();
  if (waypoints.length !== 0) {
    renderMapRoute(waypoints);

    updateURL(
      currentLocation,
      selectedPubs,
      selectedAttractions,
      ...waypoints.map((waypoint) => waypoint.place_id),
    );
  } else {
    toggleNoPubsResults();
  }
}

function addCityLocations() {
  clearCityList();
  getCities().then((cities) => {
    cityPoints = cities;
    populateCityList(cityPoints);
  });
  updateRouteMetrics();
}

setupPillClosedEvents(async () => {
  selectStartEvent("");
  hidePill();
});

setupRefreshButtonEvents(async () => {
  clearExistingRoute();
  showLoading();
  let waypoints = await getPubs(
    selectedPubs,
    selectedAttractions,
    currentLocation,
    selectedFirstLocation,
  );
  await renderRoute(waypoints);
  updateRouteMetrics();
  hideLoading();
});

// setupModalExitButtonEvents(() => {
//   toggleNoPubsResults();
// });

setupSearchBoxEvents(async (e) => {
  let inputVal = e.target.value;
  if (inputVal in cityPoints) {
    flyToLocation(cityPoints[inputVal]);
    currentLocation = inputVal;
    clearExistingRoute();
    showLoading();
    let waypoints = await getPubs(
      selectedPubs,
      selectedAttractions,
      currentLocation,
      selectedFirstLocation,
    );
    await renderRoute(waypoints);
    updateRouteMetrics();

    // reset choice for first location and repopulate select
    selectedFirstLocation = "";
    addCityLocations();
    hideLoading();
  } else {
    if (e.code === "Enter") {
      toggleNoCitiesResults();
    }
  }
});

window.onload = pageStart;
