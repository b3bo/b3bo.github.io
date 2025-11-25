import struct
import base64

data = {
    "32541": (9840717936782106065, 18393944322021488945),
    "32459": (9841460756897665713, 501416078481081991),
    "32550": (9840747854911588729, 12014960197654174958),
    "32461": (9841475559449259973, 1015165329884813041),
    "32413": (9841365003132692311, 9725763361284926)
}

def create_place_id(cell_id, feature_id):
    # Structure:
    # 0x0a (Field 1, String/Message)
    # Length
    #   0x09 (Field 1, Fixed64)
    #   Cell ID (Little Endian)
    #   0x11 (Field 2, Fixed64)
    #   Feature ID (Little Endian)
    
    # Note: The order might be Feature ID then Cell ID or vice versa.
    # In the decoded example:
    # 09 dfcd0fef7f439188 -> Cell ID 8891437fef0fcddf
    # 11 10e3c6e1cd209668 -> Feature ID 689620cde1c6e310
    # So Field 1 is Cell ID, Field 2 is Feature ID.
    
    # However, sometimes it's different.
    # Let's try this order first.
    
    inner = b''
    inner += b'\x09' + struct.pack('<Q', cell_id)
    inner += b'\x11' + struct.pack('<Q', feature_id)
    
    outer = b'\x0a' + bytes([len(inner)]) + inner
    
    return base64.urlsafe_b64encode(outer).decode('utf-8').replace('=', '')

print("{")
for zip_code, (c, f) in data.items():
    pid = create_place_id(c, f)
    print(f'  "{zip_code}": "{pid}",')
print("}")
