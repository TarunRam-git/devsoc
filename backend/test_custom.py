"""Quick test of new custom recognizers"""
from layer2_text import detect_pii

test = "The AnyDesk code is 1-1-0-9-1-8-5-8-5-9 and the other number is 1037498400"
print("Testing:", test)
print()

results = detect_pii(test)
print(f"Found {len(results)} entities:")
for r in results:
    print(f"  {r['type']}: '{r['value']}' (confidence: {r.get('confidence', 'N/A')})")
