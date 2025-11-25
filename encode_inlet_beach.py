import struct
import base64

def create_place_id(num1, num2):
    # Construct the protobuf message
    # 0x0a (Field 1, Length Delimited)
    # 0x12 (Length 18)
    # 0x09 (Field 1, Fixed64)
    # Num1 (8 bytes, Little Endian)
    # 0x11 (Field 2, Fixed64)
    # Num2 (8 bytes, Little Endian)
    
    data = b'\x0a\x12\x09' + struct.pack('<Q', num1) + b'\x11' + struct.pack('<Q', num2)
    
    # Base64 encode
    encoded = base64.urlsafe_b64encode(data).decode('utf-8')
    
    # Remove padding
    encoded = encoded.rstrip('=')
    
    return encoded

# Data extracted from Inlet Beach - Google Maps.html URL
# !1s0x8893f27adf435501:0x58f4f92a2f0bd3a
# 0x8893f27adf435501 -> 9841365003132691713
# 0x58f4f92a2f0bd3a -> 400626121436490758

num1 = 9841365003132691713
num2 = 400626121436490758

pid = create_place_id(num1, num2)
print(f"Inlet Beach Place ID: {pid}")
print(f"Num1: {num1}")
print(f"Num2: {num2}")
