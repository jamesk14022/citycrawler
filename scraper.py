import requests 
import json
import pickle
import codecs
import time 
import os

# curl -L -X GET 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=52.3542&2c4.8991&radius=1500&type=pub&keyword=pub&key=AIzaSyCE8g8gMrtfdurzaHZeAzUxukhkYx_36p4'



 # print(state)

    # enriched_data = []
    # # response in json
    # for place in state:
    #     try:
    #         url = f'https://api.content.tripadvisor.com/api/v1/location/{place["location_id"]}/details?key=C44F8A9FE8F6460C9B28570F373CBBC5&language=en&currency=EUR'
    #         headers = {"accept": "application/json"}
    #         response = requests.get(url, headers=headers)
    #         print(response.text)
    #         place["latitude"] = float(json.loads(response.text)["latitude"])
    #         place["longitude"] = float(json.loads(response.text)["longitude"])
    #         enriched_data.append(place)
    #     except Exception as e:
    #         print("Exception: ", e)


    # b = D.tolist() # nested lists with same data, indices
    # file_path = "D.json" ## your path variable
    # json.dump(b, codecs.open(file_path, 'w', encoding='utf-8'), 
    #       separators=(',', ':'), 
    #       sort_keys=True, 
    #       indent=4) ### this save

    # b = R.tolist() # nested lists with same data, indices
    # file_path = "R.json" ## your path variable
    # json.dump(b, codecs.open(file_path, 'w', encoding='utf-8'), 
    #         separators=(',', ':'), 
    #         sort_keys=True, 
    #         indent=4) ### this save


# url = "https://api.content.tripadvisor.com/api/v1/location/search?key=C44F8A9FE8F6460C9B28570F373CBBC5&searchQuery=pub&latLong=52.377956%2C4.897070&radius=15&radiusUnit=km&language=en&limit=200"
# headers = {"accept": "application/json"}
# response = requests.get(url, headers=headers)
# pub = json.loads(response.text)["data"]


# url = "https://api.content.tripadvisor.com/api/v1/location/search?key=C44F8A9FE8F6460C9B28570F373CBBC5&searchQuery=bar&latLong=52.377956%2C4.897070&radius=10&radiusUnit=km&language=en&limit=200"
# headers = {"accept": "application/json"}
# response = requests.get(url, headers=headers)
# enriched_data = []
# bar = json.loads(response.text)["data"]

# url = "https://api.content.tripadvisor.com/api/v1/location/search?key=C44F8A9FE8F6460C9B28570F373CBBC5&searchQuery=local%20bar&latLong=52.377956%2C4.897070&radius=10&radiusUnit=km&language=en&limit=200"
# headers = {"accept": "application/json"}
# response = requests.get(url, headers=headers)
# enriched_data = []
# local_beers = json.loads(response.text)["data"]

# with open("info.pkl", "wb") as f: # "wb" because we want to write in binary mode
#     pickle.dump(pub + bar + local_beers, f)



# enriched_data = []
# # response in json
# for place in state:
#     try:
#         url = f'https://api.content.tripadvisor.com/api/v1/location/{place["location_id"]}/details?key=C44F8A9FE8F6460C9B28570F373CBBC5&language=en&currency=EUR'
#         headers = {"accept": "application/json"}
#         response = requests.get(url, headers=headers)
#         print(response.text)
#         place["latitude"] = float(json.loads(response.text)["latitude"])
#         place["longitude"] = float(json.loads(response.text)["longitude"])
#         enriched_data.append(place)
#     except Exception as e:
#         print("Exception: ", e)

# print(enriched_data)

# with open("new_info_enriched.json", "w") as f: # "rb" because we want to read in binary mode
#     f.write(json.dumps(enriched_data))

import numpy as np
import requests


def walking_distance(start_latitude, start_longitude, end_latitude, end_longitude):

    time.sleep(0.2)

    url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{start_longitude},{start_latitude};{end_longitude},{end_latitude}"
    params = {
        "access_token": "pk.eyJ1IjoiamFtZXNrMTQwMjIiLCJhIjoiY2x2cnZqZnV5MHdnYTJxcXpkOHUybzdrZCJ9.UVs8BFzWjaZVrz7Gc0_Wpg",
        "geometries": "geojson"
    }
    response = requests.get(url, params=params)
    data = response.json()

    print(data)

    # Extract distance and duration
    route = data['routes'][0]
    walking_distance = route['distance']  # in meters

    return walking_distance/1000, data['routes'][0]


def load_location_search():
    with open("new_info.json", "rb") as f: # "rb" because we want to read in binary mode
        state = json.loads(f.read())
    return state

def location_search(coords, radius):
    results = []
    for (lat, long) in coords: 
        url = f'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat}%2C{long}&radius={radius}&type=pub&keyword=pub&key=AIzaSyCE8g8gMrtfdurzaHZeAzUxukhkYx_36p4'
        print(url)
        headers = {"accept": "application/json"}
        response = requests.get(url, headers=headers)
        print(response.text)
        results += json.loads(response.text)["results"]
        print(results)
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
                wd = walking_distance(state[i]["geometry"]["location"]["lat"], state[i]["geometry"]["location"]["lng"], state[j]["geometry"]["location"]["lat"], state[j]["geometry"]["location"]["lng"])
                D[i, j] = wd[0]
                D[j, i] = wd[0]
                R[i, j] = wd[1]
                R[j, i] = wd[1]

    return D, R

def save_matrices(D, R, location_name):
    b = R.tolist() # nested lists with same data, indices
    file_path = f"static/{location_name}/R.json" ## your path variable
    json.dump(b, codecs.open(file_path, 'w', encoding='utf-8'), 
            separators=(',', ':'), 
            sort_keys=True, 
            indent=4) ### this save

    b = D.tolist() # nested lists with same data, indices
    file_path = f"static/{location_name}/D.json" ## your path variable
    json.dump(b, codecs.open(file_path, 'w', encoding='utf-8'), 
            separators=(',', ':'), 
            sort_keys=True, 
            indent=4) ### this save

def create_directory_if_not_exists(directory_path):
    # Check if the directory already exists
    if not os.path.exists(directory_path):
        # Create the directory
        os.makedirs(directory_path)
        print("Directory created:", directory_path)
    else:
        print("Directory already exists:", directory_path)

biggest_cities_eu_coords = {
    "Madrid": (40.4168, -3.7038),
    "Rome": (41.9028, 12.4964),
    "Paris": (48.8566, 2.3522),
    "Bucharest": (44.4268, 26.1025),
    "Vienna": (48.2082, 16.3738),
    "Hamburg": (53.5511, 9.9937),
    "Warsaw": (52.2297, 21.0122),
    "Budapest": (47.4979, 19.0402),
    "Barcelona": (41.3851, 2.1734),
    "Munich": (48.1351, 11.5820),
    "Milan": (45.4642, 9.1900),
    "Prague": (50.0755, 14.4378),
    "Sofia": (42.6977, 23.3219),
    "Brussels": (50.8503, 4.3517),
    "Birmingham": (52.4862, -1.8904),  # UK, historically part of the EU list
    "Cologne": (50.9375, 6.9603),
    "Naples": (40.8518, 14.2681),
    "Stockholm": (59.3293, 18.0686),
    "Turin": (45.0703, 7.6869)
}

for name, coords in biggest_cities_eu_coords.items():

    lat, long = coords
    name = name.lower()

    state = location_search([(lat, long)], 2250)
    create_directory_if_not_exists("static/" + name)

    with open(f"static/{name}/info.json", "w") as f: # "rb" because we want to read in binary mode
        f.write(json.dumps(state))

    D, R = build_matrices(state)
    save_matrices(D, R, name)




