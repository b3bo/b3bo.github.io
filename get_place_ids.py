import json
import requests
import google.auth
from google.auth.transport.requests import Request

def get_access_token():
    credentials, project = google.auth.load_credentials_from_file(
        'RealEstateApps/config/service_account.json',
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    credentials.refresh(Request())
    return credentials.token

def get_place_id(zip_code, city, state, token):
    # Try old Places API (Text Search)
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    query = f"{zip_code} {city}, {state}"
    params = {
        "query": query
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        result = response.json()
        if "results" in result and len(result["results"]) > 0:
            return result["results"][0]["place_id"]
        elif "error_message" in result:
             print(f"API Error for {zip_code}: {result['error_message']}")
    else:
        print(f"Error for {zip_code}: {response.status_code} {response.text}")
    return None

def main():
    token = get_access_token()
    
    locations = [
        {"zip": "32541", "city": "Destin", "state": "FL"},
        {"zip": "32459", "city": "Santa Rosa Beach", "state": "FL"},
        {"zip": "32550", "city": "Miramar Beach", "state": "FL"},
        {"zip": "32461", "city": "Inlet Beach", "state": "FL"},
        {"zip": "32413", "city": "Panama City Beach", "state": "FL"}
    ]
    
    results = {}
    
    for loc in locations:
        place_id = get_place_id(loc["zip"], loc["city"], loc["state"], token)
        if place_id:
            results[loc["zip"]] = place_id
            print(f"Found {loc['zip']}: {place_id}")
        else:
            print(f"Could not find {loc['zip']}")
            
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
