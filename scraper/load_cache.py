import requests

markers = [5,6]
# city_names = [
#     "Dublin",
#     "Cork",
#     "Limerick",
#     "Galway",
#     "Tallaght",
#     "Waterford",
#     "Drogheda",
#     "Dundalk",
#     "Swords",
#     "Navan",
#     "Bray",
#     "Ennis",
#     "Carlow",
#     "Kilkenny",
#     "Naas",
#     "Tralee",
#     "Newbridge",
#     "Balbriggan",
#     "Portlaoise",
#     "Athlone",
#     "Mullingar",
#     "Greystones-Delgany",
#     "Wexford",
#     "Sligo",
#     "Celbridge",
#     "Malahide",
#     "Clonmel",
#     "Carrigaline",
#     "Maynooth",
#     "Leixlip",
#     "Ashbourne",
#     "Laytown–Bettystown–Mornington–Donacarney",
#     "Tullamore",
#     "Killarney",
#     "Cobh",
#     "Midleton",
#     "Mallow",
#     "Arklow",
#     "Castlebar",
#     "Wicklow"
# ]

city_names = [
    "London",
    "Birmingham",
    "Portsmouth",
    "Southampton",
    "Nottingham",
    "Bristol",
    "Manchester",
    "Liverpool",
    "Leicester",
    "Worthing",
    "Coventry",
    "Belfast",
    "Bradford",
    "Derby",
    "Plymouth",
    "Westminster",
    "Wolverhampton",
    "Northampton",
    "Norwich",
    "Luton",
    "Solihull",
    "Islington",
    "Aberdeen",
    "Croydon",
    "Bournemouth",
    "Basildon",
    "Maidstone",
    "Ilford",
    "Warrington",
    "Oxford",
    "Harrow",
    "West Bromwich",
    "Gloucester",
    "York",
    "Blackpool",
    "Stockport",
    "Sale",
    "Tottenham",
    "Cambridge",
    "Romford",
    "Colchester",
    "High Wycombe",
    "Gateshead",
    "Slough",
    "Blackburn",
    "Chelmsford"
]

BASE_URL = "http://localhost:8080"

for city in city_names:
    for j in markers:
        for i in range(1, 6):
            url = f"{BASE_URL}/pubs?target_n={j}&target_dist=1&location={city}"
            response = requests.get(url)
            if response.status_code == 200:
                print("Request was successful")
                print("Response JSON:", response.json())
            else:
                print(f"Request failed with status code {response.status_code}")
                print("Response Text:", response.text)
