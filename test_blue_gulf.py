import re

def test_blue_gulf_rule(name):
    print(f"Original: '{name}'")
    clean = name.upper().strip()
    
    # Proposed Rule: Blue Gulf Resort Normalization
    # Matches: "BLUE GULF RESORT BRICK YARD", "BLUE GULF RESORT UNIT 1", "BLUE GULF RESORT"
    if 'BLUE GULF RESORT' in clean:
        clean = 'BLUE GULF RESORT'
        print(f"Rule applied: '{clean}'")
    
    print(f"Final: '{clean}'")

test_cases = [
    "BLUE GULF RESORT",
    "BLUE GULF RESORT   Brick Yard",
    "BLUE GULF RESORT Unit 1",
    "BLUE GULF RESORT, Unit 1",
    "BLUE GULF RESORT UNIT I"
]

for case in test_cases:
    test_blue_gulf_rule(case)
    print("-" * 20)
