import urllib.request
import zipfile
import shapefile
import json
import os
import io

# URL for 2020 Census ZCTA 500k Shapefile (National)
# Using 2020 because 2023/2024 ZCTAs are often just 2020 definitions with minor updates, 
# and 2020 is the major decennial census release.
# The 2020 file is large (~60MB zip), but manageable.
url = "https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_zcta520_500k.zip"

# List of zip codes to extract
target_zips = ['32541', '32459', '32550', '32413']

print(f"Downloading 2020 US ZCTA data from {url}...")
print("This may take a moment as the file is ~60MB...")

try:
    # Download the zip file into memory
    with urllib.request.urlopen(url) as response:
        zip_data = response.read()
        
    print("Download complete. Extracting shapefile from memory...")
    
    # Open zip file from memory
    with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
        # Find the .shp, .shx, .dbf files
        shp_name = [n for n in z.namelist() if n.endswith('.shp')][0]
        base_name = os.path.splitext(shp_name)[0]
        
        # We need to extract all related files (.shp, .shx, .dbf) to a temp dir
        # because pyshp needs them on disk or passed as file-like objects.
        # Passing file-like objects to pyshp is cleaner.
        
        print(f"Reading shapefile: {shp_name}")
        
        # Read the components
        shp = io.BytesIO(z.read(base_name + '.shp'))
        shx = io.BytesIO(z.read(base_name + '.shx'))
        dbf = io.BytesIO(z.read(base_name + '.dbf'))
        
        # Initialize shapefile reader
        sf = shapefile.Reader(shp=shp, shx=shx, dbf=dbf)
        
        print(f"Searching for zip codes: {target_zips}...")
        
        found_count = 0
        
        # Iterate through records
        for i, record in enumerate(sf.records()):
            # record[0] is usually the ZCTA5CE20
            current_zip = record[0]
            
            if current_zip in target_zips:
                print(f"Found record for {current_zip} at index {i}")
                
                shape = sf.shape(i)
                geometry = shape.__geo_interface__
                
                # Create Feature
                # Inspect record length to avoid index errors
                print(f"Record has {len(record)} fields: {record}")
                
                feature = {
                    "type": "Feature",
                    "properties": {
                        "ZCTA5CE20": record[0],
                        "GEOID20": record[1],
                        "CLASSFP20": record[2],
                        "MTFCC20": record[3],
                        "FUNCSTAT20": record[4]
                    },
                    "geometry": geometry
                }
                
                # Add optional fields if they exist
                if len(record) > 5: feature["properties"]["ALAND20"] = record[5]
                if len(record) > 6: feature["properties"]["AWATER20"] = record[6]
                if len(record) > 7: feature["properties"]["INTPTLAT20"] = record[7]
                if len(record) > 8: feature["properties"]["INTPTLON20"] = record[8]
                
                output_file = os.path.join("assets", "data", f"{current_zip}.geojson")
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(output_file), exist_ok=True)
                
                with open(output_file, 'w') as f:
                    json.dump(feature, f, indent=2)
                    
                print(f"Saved {current_zip} boundary to {output_file}")
                found_count += 1
                
                if found_count == len(target_zips):
                    break
        
        print(f"Finished. Found {found_count} out of {len(target_zips)} zip codes.")

except Exception as e:
    print(f"An error occurred: {e}")
    import traceback
    traceback.print_exc()
