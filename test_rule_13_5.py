import re

def test_rules(name):
    print(f"Original: '{name}'")
    clean = name.upper().strip()
    
    # Rule 12: Remove "CONDO"
    new_clean = re.sub(r'\bCONDO(MINIUM)?S?\b', '', clean)
    if new_clean != clean:
        print(f"Rule 12 applied: '{new_clean}'")
        clean = new_clean
    
    # Rule 13.5: Remove trailing single letter (Current)
    # Matches: "ESCADA A" -> "ESCADA"
    match = re.search(r'\s+\b[A-Z]\b$', clean)
    if match:
        print(f"Rule 13.5 (Current) WOULD match: '{match.group()}'")
    else:
        print(f"Rule 13.5 (Current) would NOT match")

    # Rule 13.5: Remove trailing single letter (Proposed Fix)
    new_clean = re.sub(r'\s+\b[A-Z]\b\s*$', '', clean)
    if new_clean != clean:
        print(f"Rule 13.5 (Proposed) applied: '{new_clean}'")
        clean = new_clean
    
    print(f"Final: '{clean}'")

test_rules("PALMS NORTH A CONDO")
