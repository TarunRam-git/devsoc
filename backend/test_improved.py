"""Test improved PII detection"""
from layer2_text import detect_pii

# Test cases from the scam call transcript
test_cases = [
    "Hello, I'm speaking to Maryam.",
    "This is Stephen. Hello, my name is Stephen.",
    "You were speaking with Michael before and your manager is Mr. Omar.",
    "Please open AnyDesk and give me the AnyDesk code.",
    "Which phone are you using? Pixel. It's a Google Pixel.",
    "The AnyDesk code is 1-1-0-9-1-8-5-8-5-9.",
    "You work with Adam too?",
    "Are you in Canada right now?",
]

print("=" * 60)
print("IMPROVED PII DETECTION TEST")
print("=" * 60)

for test in test_cases:
    print(f"\nInput: {test}")
    results = detect_pii(test)
    if results:
        for r in results:
            print(f"  -> {r['type']}: '{r['value']}' (conf: {r['confidence']})")
    else:
        print("  -> (no PII detected)")
