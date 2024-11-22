import {
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
  pubMinus,
  pubPlus,
  attractionMinus,
  attractionPlus,
  attractionCounter,
  markerCounter,
  sidebar,
  sidebarToggle,
  closeBtn,
  selectStart,
} from "./constants.js";

import { buildGoogleMapsUrl } from "./api.js";

document.addEventListener("click", function (event) {
  if (!sidebar.contains(event.target) && event.target !== sidebarToggle) {
    closeSidebar();
  }
});

export const setAttractionDisplay = (attractions) => {
  attractionCounter.forEach((element) => {
    element.textContent = parseFloat(attractions);
  });
};

export const setMarkersDisplay = (markers) => {
  markerCounter.forEach((element) => {
    element.textContent = markers;
  });
};

export function showLoading() {
  document.querySelector(".loading-spinner").style.display = "block";
  document.querySelector(".loading-overlay").style.display = "block";
  container.classList.add("blurred");
}

const hideRightBar = () => (rightBar.style.display = "none");
export const showRightBar = () => (rightBar.style.display = "block");

export function hideLoading() {
  document.querySelector(".loading-spinner").style.display = "none";
  document.querySelector(".loading-overlay").style.display = "none";
  container.classList.remove("blurred");
}

export function toggleNoPubsResults() {
  const modal = document.querySelector(".modal");
  modal.classList.toggle("hidden");

  noPubsConent.style.display = "block";
  cityNotFound.style.display = "none";

  hideRightBar();
}

export function toggleNoCitiesResults() {
  const modal = document.querySelector(".modal");
  modal.classList.toggle("hidden");

  noPubsConent.style.display = "none";
  cityNotFound.style.display = "block";
}

export function setupPubPlusMinusEvents(onPubMinus, onPubPlus) {
  pubMinus.forEach((btn) => {
    btn.addEventListener("click", () => {
      onPubMinus();
    });
  });

  pubPlus.forEach((btn) => {
    btn.addEventListener("click", () => {
      onPubPlus();
    });
  });
}

export function setupAttractionPlusMinusEvents(
  onAttractionMinus,
  onAttractionPlus,
) {
  attractionMinus.forEach((btn) => {
    btn.addEventListener("click", () => {
      onAttractionMinus();
    });
  });

  attractionPlus.forEach((btn) => {
    btn.addEventListener("click", () => {
      onAttractionPlus();
    });
  });
}

export function setupSelectStartEvent(onSelectStart) {
  selectStart.addEventListener("change", (event) => {
    // selectStart.selectedIndex = selectStart.options[selectStart.selectedIndex].value + 1;
    onSelectStart(event);
  });
}

export function setupRefreshButtonEvents(onRefreshButtonClicked) {
  refreshButton.addEventListener("click", onRefreshButtonClicked);
}

export function setupModalExitButtonEvents(onModalExitButtonClicked) {
  modalExitButton.addEventListener("click", onModalExitButtonClicked);
}

export function setupSearchBoxEvents(onKeyPress) {
  searchBox.addEventListener("keypress", onKeyPress);
  searchBox.addEventListener("input", onKeyPress);
}

const openSidebar = () => (sidebar.style.width = "400px");
const closeSidebar = () => (sidebar.style.width = "0");
sidebarToggle.addEventListener("click", openSidebar);
closeBtn.addEventListener("click", closeSidebar);

export function populateBarStart(currentCityPoints) {
  selectStart.innerHTML =
    "<option value='' disabled selected>-- Please select an option --</option>";
  currentCityPoints.map((waypoint, i) => {
    let optStart = document.createElement("option");
    optStart.value = i;
    optStart.innerHTML = waypoint.name;
    selectStart.append(optStart);
  });
}

export function clearCityList() {
  dataList.innerHTML = "";
}

export function populateCityList(cities) {
  for (const city in cities) {
    const option = document.createElement("option");
    option.value = city;
    dataList.appendChild(option);
  }
}

export function clearBarInformationBox() {
  nav.innerHTML = "";
}

export function renderBarInformationBox(waypoint, index) {
  console.log(waypoint);

  const input = document.createElement("input");
  input.type = "button";
  input.id = `marker-${index}`;
  input.onclick = () => {
    let url = buildGoogleMapsUrl(waypoint);
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

export function setupShareButtonEvents(onShareButtonClicked) {
  shareButton.addEventListener("click", onShareButtonClicked);
}

export function setShareButtonCopied() {
  // Change the button text to "Copied ✔️"
  shareButton.textContent = "Copied ✔️";
  shareButton.classList.add("copied");

  // Revert the button text after 2 seconds
  setTimeout(function () {
    shareButton.textContent = "Share Link";
    shareButton.classList.remove("copied");
  }, 2000);
}

export function setRouteLength(routeLength) {
  document.getElementById("route-length").textContent = routeLength;
}

export function setRouteDuration(routeDuration) {
  document.getElementById("route-duration").textContent = routeDuration;
}
