import { BASE_URL } from './constants';

export async function getPubs(selectedPubs, selectedAttractions, currentLocation, selectedFirstLocation) {
    let url = `${BASE_URL}/pubs?target_pubs=${selectedPubs}&target_attractions=${selectedAttractions}&location=${currentLocation}`
    if (selectedFirstLocation) {
        url += `&target_first_location=${selectedFirstLocation}`
    }
    try {
        const data = await fetchData(url);
        console.log('GET Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching GET data:', error);
    }
}

export async function getCities() { 
    try {
        const data = await fetchData(`${BASE_URL}/cities`);
        console.log('GET Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching GET data:', error);
    }
}

export async function postCrawl(currentLocation, markers) {
    try {
        const data = await fetchData(`${BASE_URL}/crawl?location=${currentLocation}`, 'POST', { place_ids: markers.filter((n) => n) });
        console.log('POST Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching POST data:', error);
    }
}

export async function getCityPoints(currentLocation) {
    try {
        const data = await fetchData(`${BASE_URL}/citypoints?location=${currentLocation}`);
        console.log('GET Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching GET data:', error);
    }
}

async function fetchData(url, method = 'GET', body = null, headers = {}) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
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

        const data = await response.json();
        return data; // Return the parsed JSON
    } catch (error) {
        console.error('Error during fetch:', error);
        throw error; // Pass the error back for handling
    }
}