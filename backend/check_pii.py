"""Check PII in new report"""
import json

with open('../data/outputs/report_20260209_160045.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('PII Count:', d['pii_count'])
print()

# Count by type
types = {}
for p in d['pii_detected']:
    types[p['type']] = types.get(p['type'], 0) + 1

print('PII by Type:')
for t, c in sorted(types.items(), key=lambda x: -x[1]):
    print(f'  {t}: {c}')

print()
print('Sample PII findings:')
for p in d['pii_detected'][:15]:
    print(f"  [{p['type']}] {p['value'][:50]} (conf: {p.get('confidence', 'N/A')})")
