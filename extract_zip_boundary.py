import json
import urllib.request
import os

# URL for Florida Zip Codes GeoJSON
url = "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/fl_florida_zip_codes_geo.min.json"
target_zip = "32461"
output_file = os.path.join("assets", "data", "32461.geojson")

print(f"Downloading Florida Zip Code data from {url}...")
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        
    print("Download complete. Searching for zip code...")
    
    found_feature = None
    for feature in data['features']:
        # The property key might vary, usually ZCTA5CE10 for Census data
        props = feature['properties']
        if props.get('ZCTA5CE10') == target_zip:
            found_feature = feature
            break
            
    if found_feature:
        print(f"Found boundary for {target_zip}!")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(found_feature, f, indent=2)
            
        print(f"Saved to {output_file}")
    else:
        print(f"Zip code {target_zip} not found in the dataset.")
        # Print available keys to help debug if needed
        if len(data['features']) > 0:
            print(f"Available properties in first feature: {data['features'][0]['properties'].keys()}")

except Exception as e:
    print(f"An error occurred: {e}")
