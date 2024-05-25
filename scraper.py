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

def location_search(coords, radius, next_page_token=None):

    KEY = "AIzaSyCE8g8gMrtfdurzaHZeAzUxukhkYx_36p4"
    headers = {"accept": "application/json"}
    results = []
    lat, long = coords 


    if next_page_token:
        time.sleep(2.5)
        url = f'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat}%2C{long}&radius={radius}&type=pub&keyword=pub&pagetoken={next_page_token}&key={KEY}'
    else:
        url = f'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat}%2C{long}&radius={radius}&type=pub&keyword=pub&key={KEY}'
    
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

existing_biggest_cities_eu_coords = {
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

more_cities_coords = {
    # "Berlin": (52.5200, 13.4050),
    # "Madrid": (40.4168, -3.7038),
    # "Rome": (41.9028, 12.4964),
    # "Paris": (48.8566, 2.3522),
    # "Vienna": (48.2082, 16.3738),
    # "Hamburg": (53.5511, 9.9937),
    # "Warsaw": (52.2297, 21.0122),
    # "Bucharest": (44.4268, 26.1025),
    # "Budapest": (47.4979, 19.0402),
    # "Barcelona": (41.3851, 2.1734),
    # "Munich": (48.1351, 11.5820),
    # "Prague": (50.0755, 14.4378),
    # "Milan": (45.4642, 9.1900),
    # "Sofia": (42.6977, 23.3219),
    # "Cologne": (50.9375, 6.9603),
    # "Stockholm": (59.3293, 18.0686),
    "Amsterdam": (52.3676, 4.9041),
    # "Naples": (40.8518, 14.2681),
    # "Marseille": (43.2965, 5.3698),
    # "Turin": (45.0703, 7.6869),
    # "Valencia": (39.4699, -0.3763),
    # "Kraków": (50.0647, 19.9450),
    # "Frankfurt": (50.1109, 8.6821),
    # "Zagreb": (45.8150, 15.9819),
    # "Seville": (37.3891, -5.9845),
    # "Zaragoza": (41.6488, -0.8891),
    # "Helsinki": (60.1695, 24.9355),
    # "Wrocław": (51.1079, 17.0385),
    # "Rotterdam": (51.9225, 4.4791),
    # "Copenhagen": (55.6761, 12.5683),
    # "Łódź": (51.7592, 19.4560),
    # "Athens": (37.9838, 23.7275),
    # "Stuttgart": (48.7758, 9.1829),
    # "Düsseldorf": (51.2277, 6.7735),
    # "Palermo": (38.1157, 13.3615),
    # "Leipzig": (51.3397, 12.3731),
    # "Riga": (56.9496, 24.1052),
    # "Gothenburg": (57.7089, 11.9746),
    # "Vilnius": (54.6872, 25.2797),
    # "Dortmund": (51.5136, 7.4653),
    # "Dublin": (53.3498, -6.2603),
    # "Málaga": (36.7213, -4.4214),
    # "Essen": (51.4556, 7.0116),
    # "Bremen": (53.0793, 8.8017),
    # "The Hague": (52.0705, 4.3007),
    # "Dresden": (51.0504, 13.7373),
    # "Genoa": (44.4056, 8.9463),
    # "Antwerp": (51.2194, 4.4025),
    # "Lisbon": (38.7223, -9.1393),
    # "Hanover": (52.3759, 9.7320),
    # "Poznań": (52.4064, 16.9252),
    # "Nuremberg": (49.4521, 11.0767),
    # "Lyon": (45.7640, 4.8357),
    # "Toulouse": (43.6047, 1.4442),
    # "Duisburg": (51.4344, 6.7623),
    # "Gdańsk": (54.3520, 18.6466),
    # "Bratislava": (48.1486, 17.1077),
    # "Murcia": (37.9922, -1.1307),
    # "Tallinn": (59.4370, 24.7535),
    # "Palma de Mallorca": (39.5696, 2.6502),
    # "Brno": (49.1951, 16.6068),
    # "Bologna": (44.4949, 11.3426),
    # "Szczecin": (53.4285, 14.5528),
    # "Sintra": (38.8029, -9.3817),
    # "Las Palmas": (28.1235, -15.4363),
    # "Utrecht": (52.0907, 5.1214),
    # "Aarhus": (56.1629, 10.2039),
    # "Bochum": (51.4818, 7.2162),
    # "Florence": (43.7696, 11.2558),
    # "Malmö": (55.6049, 13.0038),
    # "Wuppertal": (51.2562, 7.1508),
    # "Alicante": (38.3452, -0.4810),
    # "Nice": (43.7102, 7.2620),
    # "Bilbao": (43.2630, -2.9350),
    # "Bielefeld": (52.0302, 8.5325),
    # "Bonn": (50.7374, 7.0982),
    # "Lublin": (51.2465, 22.5684),
    # "Bydgoszcz": (53.1235, 18.0084),
    # "Plovdiv": (42.1354, 24.7453),
    # "Córdoba": (37.8882, -4.7794),
    # "Varna": (43.2141, 27.9147),
    # "Nantes": (47.2184, -1.5536),
    # "Münster": (51.9607, 7.6261),
    # "Thessaloniki": (40.6401, 22.9444),
    # "Bari": (41.1171, 16.8719),
    # "Mannheim": (49.4875, 8.4660),
    # "Espoo": (60.2055, 24.6559),
    # "Karlsruhe": (49.0069, 8.4037),
    # "Vila Nova de Gaia": (41.1242, -8.6129),
    # "Kaunas": (54.8985, 23.9036),
    # "Graz": (47.0707, 15.4395),
    # "Montpellier": (43.6119, 3.8770),
    # "Augsburg": (48.3705, 10.8978)
}

for name, coords in more_cities_coords.items():

    name = name.lower()

    state = location_search(coords, 2250)
    create_directory_if_not_exists("static/" + name)

    with open(f"static/{name}/info.json", "w") as f: # "rb" because we want to read in binary mode
        f.write(json.dumps(state))

    D, R = build_matrices(state)
    save_matrices(D, R, name)




