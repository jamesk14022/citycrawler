import requests
import json
import codecs
import time
import os

import numpy as np

CITY_COORDS = {
    "New York": (40.66, -73.94),
    "Los Angeles": (34.02, -118.41),
    "Chicago": (41.84, -87.68),
    "Houston": (29.79, -95.39),
    "Phoenix": (33.57, -112.09),
    "Philadelphia": (40.01, -75.13),
    "San Antonio": (29.46, -98.52),
    "San Diego": (32.81, -117.14),
    "Dallas": (32.79, -96.77),
    "Jacksonville": (30.34, -81.66),
    "Austin": (30.30, -97.75),
    "Fort Worth": (32.78, -97.35),
    "San Jose": (37.30, -121.81),
    "Columbus": (39.99, -82.99),
    "Charlotte": (35.21, -80.83),
    "Indianapolis": (39.78, -86.15),
    "San Francisco": (37.73, -123.03),
    "Seattle": (47.62, -122.35),
    "Denver": (39.76, -104.88),
}

BASE_PATH = "../static"
SEARCH_RADIUS = 2250

GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
GOOGLE_MAPS_NEXT_PAGE_DELAY = 2.5

MAPBOX_BASE_URL = "https://api.mapbox.com/directions/v5/mapbox/walking/"
MAPBOX_DELAY = 0.2


def walking_distance(start_latitude, start_longitude, end_latitude, end_longitude):
    time.sleep(MAPBOX_DELAY)
    url = f"{MAPBOX_BASE_URL}{start_longitude},{start_latitude};{end_longitude},{end_latitude}"
    params = {"access_token": os.environ["MAPBOX_TOKEN"], "geometries": "geojson"}
    response = requests.get(url, params=params)
    data = response.json()

    # Extract distance and duration
    route = data["routes"][0]
    walking_distance = route["distance"]  # in meters

    return walking_distance / 1000, data["routes"][0]


def load_location_search():
    with open(
        "new_info.json", "rb"
    ) as f:  # "rb" because we want to read in binary mode
        state = json.loads(f.read())
    return state


def location_search(coords, radius, next_page_token=None):
    KEY = os.environ["GOOGLE_MAPS_API_KEY"]
    headers = {"accept": "application/json"}
    results = []
    lat, long = coords

    if next_page_token:
        time.sleep(GOOGLE_MAPS_NEXT_PAGE_DELAY)
        url = f"{GOOGLE_MAPS_BASE_URL}?location={lat}%2C{long}&radius={radius}&type=pub&keyword=pub&pagetoken={next_page_token}&key={KEY}"
    else:
        url = f"{GOOGLE_MAPS_BASE_URL}?location={lat}%2C{long}&radius={radius}&type=pub&keyword=pub&key={KEY}"

    raw_response = requests.get(url, headers=headers)
    response = json.loads(raw_response.text)
    results += response["results"]
    if "next_page_token" in response:
        results += location_search(coords, radius, response["next_page_token"])

    return results


def build_matrices(state):
    size = len(state)

    # array of walking distance
    D = np.zeros((size, size))

    # array of route informaitn
    R = np.empty((size, size), dtype=object)

    print("distance matrix")
    # populate distance matrix
    for i in range(size):
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


def create_directory_if_not_exists(directory_path):
    # Check if the directory already exists
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        print("Directory created:", directory_path)
    else:
        print("Directory already exists:", directory_path)


for name, coords in CITY_COORDS.items():
    name = name.lower()

    state = location_search(coords, SEARCH_RADIUS)
    create_directory_if_not_exists("static/" + name)

    with open(
        f"{BASE_PATH}/{name}/info.json", "w"
    ) as f:  # "rb" because we want to read in binary mode
        f.write(json.dumps(state))

    D, R = build_matrices(state)
    save_matrices(D, R, name)
