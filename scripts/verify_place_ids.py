import requests
import json

api_key = "AIzaSyDjwVlnRslcTnR8d0Ocj3zYdj4CqFkIv9E"
zip_codes = ["32541", "32459", "32550", "32461", "32413"]

print(f"Checking Place IDs for zip codes: {zip_codes}")

for zip_code in zip_codes:
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={zip_code}&key={api_key}"
    try:
        response = requests.get(url)
        data = response.json()
        
        if data['status'] == 'OK':
            result = data['results'][0]
            place_id = result['place_id']
            formatted_address = result['formatted_address']
            print(f"Zip: {zip_code} -> Place ID: {place_id} ({formatted_address})")
        else:
            print(f"Zip: {zip_code} -> Error: {data['status']}")
            if 'error_message' in data:
                print(f"Message: {data['error_message']}")
    except Exception as e:
        print(f"Zip: {zip_code} -> Exception: {e}")
