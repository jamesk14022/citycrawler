import { BASE_URL, GOOGLE_MAP_BASE_URL } from "./constants.js";

export function buildGoogleMapsUrl(waypoint) {
  return `${GOOGLE_MAP_BASE_URL}/?api=1&query=${waypoint.geometry.location.lat},${waypoint.geometry.location.lng}&query_place_id=${waypoint.place_id}`;
}

export async function getPubs(
  selectedPubs,
  selectedAttractions,
  currentLocation,
  selectedFirstLocation,
) {
  let url = `${BASE_URL}/pubs?target_pubs=${selectedPubs}&target_attractions=${selectedAttractions}&location=${currentLocation}`;
  if (selectedFirstLocation) {
    url += `&target_first_location=${selectedFirstLocation}`;
  }
  try {
    return await fetchData(url);
  } catch (error) {
    console.error("Error fetching GET data:", error);
  }
}

export async function getCities() {
  try {
    return await fetchData(`${BASE_URL}/cities`);
  } catch (error) {
    console.error("Error fetching GET data:", error);
  }
}

export async function postCrawl(currentLocation, markers) {
  try {
    return await fetchData(
      `${BASE_URL}/crawl?location=${currentLocation}`,
      "POST",
      { place_ids: markers.filter((n) => n) },
    );
  } catch (error) {
    console.error("Error fetching POST data:", error);
  }
}

export async function getCityPoints(currentLocation) {
  try {
    return await fetchData(
      `${BASE_URL}/citypoints?location=${currentLocation}`,
    );
  } catch (error) {
    console.error("Error fetching GET data:", error);
  }
}

export async function getGoogleMapsPhoto(photoReference) {
  try {
    return await fetchData(
      `${BASE_URL}/photo?photo_reference=${photoReference}`,
    );
  } catch (error) {
    console.error("Error fetching GET data:", error);
  }
}

async function fetchData(url, method = "GET", body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers, // Add any custom headers
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error during fetch:", error);
    throw error; // Pass the error back for handling
  }
}
