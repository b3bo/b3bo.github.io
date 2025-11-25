import re
import base64
import struct

def find_complex_ids(encoding):
    try:
        with open(r'c:\Users\johnb\Documents\GitHub\b3bo.github.io\inlet_beach.html', 'r', encoding=encoding) as f:
            content = f.read()
        
        # Find strings starting with ChIJ and allowing more base64 characters
        matches = re.finditer(r'ChIJ[a-zA-Z0-9_\-/+]+', content)
        
        found = False
        for match in matches:
            found = True
            print(f"Match: {match.group()}")
            start = max(0, match.start() - 200)
            end = min(len(content), match.end() + 200)
            print(f"Context: {content[start:end]}")
            print("-" * 50)
            
        if not found:
            print("No matches found.")
            
        return True
    except Exception as e:
        print(f"Failed with encoding {encoding}: {e}")
        return False

def decode_place_id(place_id):
    try:
        # Add padding if needed
        padding = len(place_id) % 4
        if padding:
            place_id += '=' * (4 - padding)
        
        # Decode base64
        decoded = base64.urlsafe_b64decode(place_id)
        print(f"Decoded bytes (hex): {decoded.hex()}")
        
        # Try to interpret as protobuf (simple manual parsing)
        # 0x0a = Field 1 (Length Delimited)
        # 0x12 = Field 2 (Length Delimited)
        
        idx = 0
        while idx < len(decoded):
            tag = decoded[idx]
            field_num = tag >> 3
            wire_type = tag & 7
            idx += 1
            
            print(f"Field {field_num}, Wire Type {wire_type}")
            
            if wire_type == 0: # Varint
                # Skip varint
                start = idx
                while decoded[idx] & 0x80:
                    idx += 1
                idx += 1
                print(f"  Varint value: {decoded[start:idx].hex()}")
            elif wire_type == 1: # 64-bit
                val = decoded[idx:idx+8]
                print(f"  64-bit value: {val.hex()} ({struct.unpack('<Q', val)[0]})")
                idx += 8
            elif wire_type == 2: # Length Delimited
                length = decoded[idx] # Assuming length fits in 1 byte for now
                idx += 1
                val = decoded[idx:idx+length]
                print(f"  Length: {length}")
                print(f"  Value: {val.hex()}")
                
                # If it's field 1 or 2, it might be a nested message or string
                # Let's try to decode the nested value if it looks like a message
                # For Place IDs, usually it's:
                # Field 1: Location (lat/lng or cell id?)
                # Field 2: Feature ID?
                
                idx += length
            elif wire_type == 5: # 32-bit
                idx += 4
            else:
                print("  Unknown wire type")
                break
                
    except Exception as e:
        print(f"Error: {e}")

for enc in ['utf-16']:
    if find_complex_ids(enc):
        break

print("Decoding OLD ID: ChIJxW-pAuHxk4gR8ZYTLH2XFg4")
decode_place_id("ChIJxW-pAuHxk4gR8ZYTLH2XFg4")
