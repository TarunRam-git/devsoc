"""
DEMO: Presidio vs Regex PII Detection Comparison
"""

from layer2_text import detect_pii, detect_pii_regex

test_text = """Hello, my name is John Smith and my social security number is 987-65-4320.
You can reach me at john.smith@example.com or call (555) 123-4567.
My colleague Sarah Johnson has reference number 111-22-3333.
Payment of $5,000 was made using card 4532-1234-5678-9012.
The meeting is on 12/25/2024 at IP address 192.168.1.100."""

print("=" * 60)
print("PRESIDIO vs REGEX: PII Detection Comparison")
print("=" * 60)
print("\nINPUT TEXT:")
print(test_text)
print()

print("-" * 60)
print("PRESIDIO RESULTS (ML-based)")
print("-" * 60)
presidio_results = detect_pii(test_text)
for r in sorted(presidio_results, key=lambda x: x['start']):
    print(f"  Type: {r['type']}")
    print(f"  Value: {r['value']}")
    print(f"  Confidence: {r.get('confidence', 'N/A')}, Risk: {r['risk']}")
    print()

print("-" * 60)
print("REGEX RESULTS (Pattern matching)")
print("-" * 60)
regex_results = detect_pii_regex(test_text)
for r in sorted(regex_results, key=lambda x: x['start']):
    print(f"  Type: {r['type']}")
    print(f"  Value: {r['value']}")
    print()

print("=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"Presidio found: {len(presidio_results)} entities")
print(f"Regex found: {len(regex_results)} entities")
print()
print("KEY DIFFERENCE: Presidio detected PERSON names")
print("(John Smith, Sarah Johnson) - Regex cannot do this!")
