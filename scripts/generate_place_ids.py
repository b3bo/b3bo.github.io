import struct
import base64

data = {
    "32541": (9840717936782106065, 18393944322021488945),
    "32459": (9841460756897665713, 501416078481081991),
    "32550": (9840747854911588729, 12014960197654174958),
    "32461": (9841475559449259973, 1015165329884813041),
    "32413": (9841365003132692311, 9725763361284926)
}

def create_place_id(num1, num2):
    # Construct the protobuf message
    # 0x0a (Field 1, Length Delimited)
    # 0x12 (Length 18)
    # 0x09 (Field 1, Fixed64)
    # Num1 (8 bytes, Little Endian)
    # 0x11 (Field 2, Fixed64)
    # Num2 (8 bytes, Little Endian)
    
    # Note: The length 18 (0x12) assumes the content is exactly 18 bytes.
    # Content = 1 byte (tag) + 8 bytes (num1) + 1 byte (tag) + 8 bytes (num2) = 18 bytes.
    # So 0x12 is correct.
    
    data = b'\x0a\x12\x09' + struct.pack('<Q', num1) + b'\x11' + struct.pack('<Q', num2)
    
    # Base64 encode
    encoded = base64.urlsafe_b64encode(data).decode('utf-8')
    
    # Remove padding
    encoded = encoded.rstrip('=')
    
    return encoded

print("{")
for zip_code, (c, f) in data.items():
    pid = create_place_id(c, f)
    print(f'  "{zip_code}": "{pid}",')
print("}")
