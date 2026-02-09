"""Check PII in new improved report"""
import json

with open('../data/outputs/report_20260209_161449.json', 'r', encoding='utf-8') as f:
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
print('All PII findings:')
for p in d['pii_detected']:
    print(f"  [{p['type']:20}] {p['value'][:30]:32} (conf: {p.get('confidence', 'N/A')})")
