import requests
import re

url = 'https://www.youtube.com/channel/UChu1m0MNNmHZRhBUDxAJKaA/about'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
html = r.text

# Search for Location
loc_match = re.search(r'Location</td>\s*<td[^>]*>([^<]+)</td>', html, re.IGNORECASE)
print('Match:', loc_match)
if loc_match:
    print('Location:', repr(loc_match.group(1)))

# Also check if "Location" is in html
print('Location in html:', 'Location' in html)