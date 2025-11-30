import re

def test_unrec_rule(name):
    print(f"Original: '{name}'")
    clean = name.upper().strip()
    
    # Rule 4: Remove "S/D" or "SUBDIVISION"
    new_clean = re.sub(r'\b(S/D|SUBDIVISION)\b', '', clean)
    if new_clean != clean:
        print(f"Rule 4 applied: '{new_clean}'")
        clean = new_clean

    # Rule 4.1: Remove "UNREC", "UNRECD", "UNRECORDED"
    new_clean = re.sub(r'\bUNREC(ORDED|D)?\b', '', clean)
    if new_clean != clean:
        print(f"Rule 4.1 applied: '{new_clean}'")
        clean = new_clean
        
    # Clean up extra spaces
    clean = re.sub(r'\s+', ' ', clean).strip()
    print(f"Final: '{clean}'")

test_cases = [
    "DALTON UNREC",
    "BEACH VIEW HGTS S/D UNREC",
    "ARC UNRECD",
    "UNRECORDED SUBDIVISION",
    "GULF HILLS ESTATES UNREC"
]

for case in test_cases:
    test_unrec_rule(case)
    print("-" * 20)
