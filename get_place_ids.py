import subprocess
import re
import time

zip_codes = ["32541", "32459", "32550", "32461", "32413"]
base_url = "https://www.google.com/maps/place/FL+{}"
user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

results = {}

for zip_code in zip_codes:
    url = base_url.format(zip_code)
    print(f"Fetching {url}...")
    try:
        # Use curl to fetch the page
        cmd = ["curl", "-L", "-A", user_agent, url]
        # On Windows, curl might be an alias in PowerShell, but we are running python.
        # We should use the full command or ensure we are calling the executable.
        # In the previous step, 'cmd /c curl' worked.
        process = subprocess.run(["cmd", "/c", "curl", "-L", "-A", user_agent, url], capture_output=True, text=True, encoding='utf-8', errors='ignore')
        content = process.stdout
        
        # Look for the pattern
        # window.APP_INITIALIZATION_STATE=[[[55061.38401408568,-86.4564974,30.39819045],[0,0,0],[1024,768],13.1],[[["m",[13,2122,3364],13,[760517778,760517694,760517694,760517778,760517778,760517778,760517778,760517694,760517694,760517694,760517694,760517694,760517694,760518402,7605...
        # Actually, the pattern I saw was:
        # window.APP_INITIALIZATION_STATE=[[[...],[[["m",...,[...]],[[["9840720851127825591","1703640332947180594"]
        
        # Let's try a regex that captures the two numbers in quotes inside a triple nested array
        match = re.search(r'\[\[\["(\d+)","(\d+)"\]', content)
        if match:
            num1 = match.group(1)
            num2 = match.group(2)
            results[zip_code] = (num1, num2)
            print(f"Found for {zip_code}: {num1}, {num2}")
        else:
            print(f"No match for {zip_code}")
            # Save to file for debugging if needed
            # with open(f"debug_{zip_code}.html", "w", encoding="utf-8") as f:
            #     f.write(content)
            
    except Exception as e:
        print(f"Error fetching {zip_code}: {e}")
    
    time.sleep(2) # Be nice

print("\nResults:")
for z, (n1, n2) in results.items():
    print(f"{z}: {n1}, {n2}")
