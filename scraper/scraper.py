import requests
import json
import codecs
import time
import os

import numpy as np

cities = ["berlin"]


BASE_PATH = "../scrape_test/"
SEARCH_RADIUS = 1500

GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api/"
GOOGLE_MAPS_NEXT_PAGE_DELAY = 2.5

MAPBOX_BASE_URL = "https://api.mapbox.com/directions/v5/mapbox/walking/"
MAPBOX_DELAY = 0.2

GOOGLE_MAPS_KEY = os.environ["GOOGLE_MAPS_API_KEY"]
MAPBOX_KEY = os.environ["MAPBOX_TOKEN"]


def walking_distance(start_latitude, start_longitude, end_latitude, end_longitude):
    time.sleep(MAPBOX_DELAY)
    url = f"{MAPBOX_BASE_URL}{start_longitude},{start_latitude};{end_longitude},{end_latitude}"
    params = {"access_token": MAPBOX_KEY, "geometries": "geojson"}
    response = requests.get(url, params=params)
    data = response.json()

    if not data["routes"]:
        route = None
    else:
        route = data["routes"][0]
    
    return route["distance"] / 1000, route


def load_location_search():
    with open(
        "new_info.json", "rb"
    ) as f:  # "rb" because we want to read in binary mode
        state = json.loads(f.read())
    return state

def make_nearby_search_request(coords, radius, next_page_token, location_type="pub"):

    headers = {"accept": "application/json"}
    results = []
    lat, long = coords

    PLACES_API_SUB_URL = "place/nearbysearch/json"

    if next_page_token:
        time.sleep(GOOGLE_MAPS_NEXT_PAGE_DELAY)
        if location_type == "pub":
            url = f"{GOOGLE_MAPS_BASE_URL}{PLACES_API_SUB_URL}?location={lat}%2C{long}&radius={radius}&type=bar&keyword=pub&pagetoken={next_page_token}&key={GOOGLE_MAPS_KEY}"
        elif location_type == "tourist_attraction":
            url = f"{GOOGLE_MAPS_BASE_URL}{PLACES_API_SUB_URL}?location={lat}%2C{long}&radius={radius}&type=tourist_attraction&pagetoken={next_page_token}&key={GOOGLE_MAPS_KEY}"
    else:
        if location_type == "pub":
            url = f"{GOOGLE_MAPS_BASE_URL}{PLACES_API_SUB_URL}?location={lat}%2C{long}&radius={radius}&type=bar&keyword=pub&key={GOOGLE_MAPS_KEY}"
        elif location_type == "tourist_attraction":
            url = f"{GOOGLE_MAPS_BASE_URL}{PLACES_API_SUB_URL}?location={lat}%2C{long}&radius={radius}&type=tourist_attraction&key={GOOGLE_MAPS_KEY}"

    raw_response = requests.get(url, headers=headers)
    response = json.loads(raw_response.text)
    results += response["results"]

    if "next_page_token" in response:
        results += make_nearby_search_request(coords, radius, response["next_page_token"], location_type)

    return results

def location_search(coords, radius):

    results = []
    for location_type in ["pub", "tourist_attraction"]:
        results += make_nearby_search_request(coords, radius, None, location_type)
        results += make_nearby_search_request(coords, radius, None, location_type)

    return results

def build_matrices(state):
    size = len(state)

    # array of walking distance
    D = np.zeros((size, size))

    # array of route informaitn
    R = np.empty((size, size), dtype=object)

    print("distance matrix")
    for i in range(size):
        print(f"Row {i}")
        for j in range(size):
            if D[i][j] == 0:
                wd = walking_distance(
                    state[i]["geometry"]["location"]["lat"],
                    state[i]["geometry"]["location"]["lng"],
                    state[j]["geometry"]["location"]["lat"],
                    state[j]["geometry"]["location"]["lng"],
                )
                D[i, j] = wd[0]
                D[j, i] = wd[0]
                R[i, j] = wd[1]
                R[j, i] = wd[1]

    return D, R


def save_matrices(D, R, location_name):
    b = R.tolist()  # nested lists with same data, indices
    file_path = f"{BASE_PATH}/{location_name}/R.json"  ## your path variable
    json.dump(
        b,
        codecs.open(file_path, "w", encoding="utf-8"),
        separators=(",", ":"),
        sort_keys=True,
        indent=4,
    )

    b = D.tolist()  # nested lists with same data, indices
    file_path = f"{BASE_PATH}/{location_name}/D.json"  ## your path variable
    json.dump(
        b,
        codecs.open(file_path, "w", encoding="utf-8"),
        separators=(",", ":"),
        sort_keys=True,
        indent=4,
    ) 

def get_city_coords(city):

    headers = {"accept": "application/json"}
    url = f"{GOOGLE_MAPS_BASE_URL}geocode/json?address={city}&key={GOOGLE_MAPS_KEY}"

    raw_response = requests.get(url, headers=headers)
    response = json.loads(raw_response.text)
    return list(response["results"][0]["geometry"]["location"].values())

def create_directory_if_not_exists(directory_path):
    # Check if the directory already exists
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        print("Directory created:", directory_path)
    else:
        print("Directory already exists:", directory_path)


for name in cities:
    name = name.lower()
    coords = get_city_coords(name)
    state = location_search(coords, SEARCH_RADIUS)

    print(f"Found {len(state)} locations in {name}")
    create_directory_if_not_exists(BASE_PATH + name)

    with open(
        f"{BASE_PATH}/{name}/info.json", "w"
    ) as f:  # "rb" because we want to read in binary mode
        f.write(json.dumps(state))

    D, R = build_matrices(state)
    save_matrices(D, R, name)
