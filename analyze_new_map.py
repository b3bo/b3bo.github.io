import re
import base64
import struct

def decode_place_id(place_id):
    try:
        padding = len(place_id) % 4
        if padding:
            place_id += '=' * (4 - padding)
        decoded = base64.urlsafe_b64decode(place_id)
        
        if len(decoded) > 20: # Just a heuristic to filter out noise
             # Try to find the two 64-bit integers
            # 0x0a 0x12 0x09 [8 bytes] 0x11 [8 bytes]
            if decoded[0] == 0x0a and decoded[1] == 0x12 and decoded[2] == 0x09:
                num1 = struct.unpack('<Q', decoded[3:11])[0]
                if decoded[11] == 0x11:
                    num2 = struct.unpack('<Q', decoded[12:20])[0]
                    return num1, num2
        return None
    except:
        return None

def analyze_file(filename):
    print(f"Analyzing {filename}...")
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filename, 'r', encoding='utf-16') as f:
            content = f.read()
            
    # 1. Search for ChIJ strings
    print("\n--- Searching for ChIJ strings ---")
    # Regex for standard Place ID format (base64url)
    # Starts with ChIJ, followed by alphanumeric, -, _
    matches = set(re.findall(r'ChIJ[a-zA-Z0-9_\-]{20,}', content))
    
    for pid in matches:
        decoded = decode_place_id(pid)
        if decoded:
            print(f"Found Valid ID: {pid}")
            print(f"  -> Components: {decoded}")
            # Check context
            idx = content.find(pid)
            start = max(0, idx - 50)
            end = min(len(content), idx + 50 + len(pid))
            print(f"  -> Context: ...{content[start:end].replace(pid, '[[ID]]')}...")

    # 2. Search for the raw integer pair pattern we saw before
    # Pattern: ["9841475559449259973","1015165329884813041"]
    print("\n--- Searching for Integer Pairs ---")
    # Look for arrays of two large number strings
    pair_matches = re.finditer(r'\["(\d{18,20})","(\d{18,20})"', content)
    
    for match in pair_matches:
        n1, n2 = match.groups()
        n1 = int(n1)
        n2 = int(n2)
        print(f"Found Pair: {n1}, {n2}")
        
        # Reconstruct ID
        try:
            data = b'\x0a\x12\x09' + struct.pack('<Q', n1) + b'\x11' + struct.pack('<Q', n2)
            encoded = base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')
            print(f"  -> Reconstructed ID: {encoded}")
            
            # Check context
            start = max(0, match.start() - 100)
            end = min(len(content), match.end() + 100)
            print(f"  -> Context: ...{content[start:end]}...")
        except Exception as e:
            print(f"  -> Error reconstructing: {e}")

analyze_file(r'c:\Users\johnb\Documents\GitHub\b3bo.github.io\Inlet Beach - Google Maps.html')
