import re
import sys

def extract_integers(filename):
    print(f"Scanning {filename}...")
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        with open(filename, 'r', encoding='utf-16') as f:
            content = f.read()
            
    # Find all sequences of 18-20 digits
    matches = re.findall(r'\b\d{18,20}\b', content)
    
    unique_matches = sorted(list(set(matches)))
    
    print(f"Found {len(unique_matches)} unique large integers.")
    for m in unique_matches:
        print(m)

if len(sys.argv) > 1:
    extract_integers(sys.argv[1])
else:
    extract_integers(r'c:\Users\johnb\Documents\GitHub\b3bo.github.io\Inlet Beach - Google Maps.html')
