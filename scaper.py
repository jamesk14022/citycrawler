import requests 
import json
import pickle


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


with open("info.pkl", "rb") as f: # "rb" because we want to read in binary mode
    state = pickle.load(f)
    print(json.dumps(state))

enriched_data = []
# response in json
for place in state:
    try:
        url = f'https://api.content.tripadvisor.com/api/v1/location/{place["location_id"]}/details?key=C44F8A9FE8F6460C9B28570F373CBBC5&language=en&currency=EUR'
        headers = {"accept": "application/json"}
        response = requests.get(url, headers=headers)
        print(response.text)
        place["latitude"] = float(json.loads(response.text)["latitude"])
        place["longitude"] = float(json.loads(response.text)["longitude"])
        enriched_data.append(place)
    except Exception as e:
        print("Exception: ", e)

print(enriched_data)

with open("info.json", "w") as f: # "rb" because we want to read in binary mode
    f.write(json.dumps(enriched_data))


   # # array of walking distance
    # D = np.zeros((size, size))    

    # # array of route informaitn
    # R = np.empty((size, size), dtype=object)

    # print("distance matrix")
    # # populate distance matrix 
    # for i in range(size):
    #     for j in range(size):
    #         if D[i][j] == 0:
    #             wd = walking_distance(enriched_data[i]["latitude"], enriched_data[i]["longitude"], enriched_data[j]["latitude"], enriched_data[j]["longitude"])
    #             D[i, j] = wd[0]
    #             D[j, i] = wd[0]
    #             R[i, j] = wd[1]
    #             R[j, i] = wd[1]

    # print(D)
    # print(R)

    # with open("D.pkl", "wb") as f:
    #     pickle.dump(D, f)

    # with open("R.pkl", "wb") as f:  
    #     pickle.dump(R, f)