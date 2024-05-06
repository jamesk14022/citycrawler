import numpy as np
import codecs, json 
import copy
from numba import jit
import numpy as np
import requests
import json
import pickle
import random
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def check_overlap(path, R):
    local_points = set()
    for i in range(len(path) - 1):
        for point in R[path[i], path[i+1]]["geometry"]["coordinates"][1:]:
            if tuple(point) in local_points:
                return True 
            local_points.add(tuple(point))
    return False

def adjacent_length_meet_constraint(path, D):    
    for i in range(len(path) - 1):
        points = copy.copy(path)
        points.remove(path[i+1])
        points.remove(path[i])
        dist_to_next = D[path[i], path[i+1]]
        for p in points:
            if dist_to_next > D[path[i], p]:
                # print("Distance constraint not met")
                return False
    return True

def equal_length_meet_constraint(path, D, target_dist):    
    margin = (target_dist / len(path)) * 2.2
    for i in range(len(path) - 1):
        if D[path[i], path[i+1]] > margin:
                return False
    return True

def walking_distance(start_latitude, start_longitude, end_latitude, end_longitude):

    url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{start_longitude},{start_latitude};{end_longitude},{end_latitude}"
    params = {
        "access_token": "pk.eyJ1IjoiamFtZXNrMTQwMjIiLCJhIjoiY2x2cnZqZnV5MHdnYTJxcXpkOHUybzdrZCJ9.UVs8BFzWjaZVrz7Gc0_Wpg",
        "geometries": "geojson"
    }
    response = requests.get(url, params=params)
    data = response.json()

    # Extract distance and duration
    route = data['routes'][0]
    walking_distance = route['distance']  # in meters

    return walking_distance/1000, data['routes'][0]

def get_eigible_paths(size, target_n, target_dist, D):
    eligible_paths: list[int] = []
    # dfs over this matrix to find paths with N nodes and distance equal to D
    def dfs(node, path, current_dist, visited):
        # print(f"{path} -> {current_dist}")
        if len(path) > target_n:
            return
        if len(path) == target_n and current_dist > target_dist - 0.5 and current_dist < target_dist + 0.5:
            eligible_paths.append(path)
            # print(f"{path} -> {current_dist}")
            return
        for i in range(size):
            if i != node and not visited[i]:
                visited[i] = True
                dfs(i, path + [i], current_dist + D[node, i], visited)
                visited[i] = False
    
    for i in range(size):
        visited = [False] * size
        visited[i] = True
        dfs(i, [i], 0, visited)

    return eligible_paths

@app.get("/pubs/")
def get_evaulation(target_n: int = 3, target_dist: float = 5):    

    # url = "https://api.content.tripadvisor.com/api/v1/location/search?key=C44F8A9FE8F6460C9B28570F373CBBC5&searchQuery=bar&latLong=52.377956%2C4.897070&radius=10&radiusUnit=km&language=en&limit=200"
    # headers = {"accept": "application/json"}
    # response = requests.get(url, headers=headers)

    with open("info.json", "rb") as f: # "rb" because we want to read in binary mode
        enriched_data = json.load(f)


   
    print(enriched_data)

    # size
    size = len(enriched_data)

    with open("static/D.json", "rb") as f: # "rb" because we want to read in binary mode
        D = np.array(json.loads(f.read()))

    with open("static/R.json", "rb") as f: # "rb" because we want to read in binary mode
        R = np.array(json.loads(f.read()))

    print(R)

    eligible_paths = get_eigible_paths(size, target_n, target_dist, D) 
    
    print(eligible_paths)
    eligible_paths = [e for e in eligible_paths if not check_overlap(e, R)]
    eligible_paths = [e for e in eligible_paths if adjacent_length_meet_constraint(e, D)]
    eligible_paths = [e for e in eligible_paths if equal_length_meet_constraint(e, D, target_dist)]
    print(eligible_paths)

    # print random path from eligible paths
    path = random.choice(eligible_paths)
    enriched_data = [enriched_data[i] for i in path]
    return enriched_data




