#!/usr/bin/env python3
"""Validates templates/*.json and section groups against section schemas.
Usage: python3 scripts/validate-templates.py [theme_root]"""
import json, re, glob, os, sys
root = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def schema(t):
    p = f'{root}/sections/{t}.liquid'
    if not os.path.exists(p): return None
    m = re.search(r'{% schema %}(.*){% endschema %}', open(p).read(), re.S)
    return json.loads(m.group(1)) if m else {}
def check_settings(where, defs, vals, errs):
    by = {d['id']: d for d in defs if 'id' in d}
    for k, v in vals.items():
        d = by.get(k)
        if not d: errs.append(f'{where}: unknown setting {k}'); continue
        if d['type'] == 'select' and v not in [o['value'] for o in d['options']]:
            errs.append(f'{where}: {k}={v!r} not an option')
        if d['type'] == 'range':
            if not (d['min'] <= v <= d['max']) or (v - d['min']) % d['step']:
                errs.append(f'{where}: {k}={v} out of range/step')
        if d['type'] == 'checkbox' and not isinstance(v, bool):
            errs.append(f'{where}: {k} not bool')
    # defaults sanity
    for d in defs:
        if d.get('type') == 'range' and 'default' in d:
            v = d['default']
            if not (d['min'] <= v <= d['max']) or (v - d['min']) % d['step']:
                errs.append(f'{where}: default {d["id"]}={v} invalid')
        if d.get('type') == 'select' and 'default' in d and d['default'] not in [o['value'] for o in d['options']]:
            errs.append(f'{where}: default {d["id"]} invalid')
errs = []
files = glob.glob(f'{root}/templates/*.json') + glob.glob(f'{root}/sections/*.json')
for f in files:
    d = json.load(open(f))
    for sid, s in d['sections'].items():
        sc = schema(s['type'])
        w = f'{os.path.basename(f)}#{sid}'
        if sc is None: errs.append(f'{w}: missing section {s["type"]}'); continue
        check_settings(w, sc.get('settings', []), s.get('settings', {}), errs)
        bdefs = {b['type']: b for b in sc.get('blocks', [])}
        for bid, b in s.get('blocks', {}).items():
            bd = bdefs.get(b['type'])
            if not bd:
                if '@app' in bdefs and b['type'].startswith('shopify://'): continue
                errs.append(f'{w}/{bid}: unknown block type {b["type"]}'); continue
            check_settings(f'{w}/{bid}', bd.get('settings', []), b.get('settings', {}), errs)
        for bid in s.get('block_order', []):
            if bid not in s.get('blocks', {}): errs.append(f'{w}: block_order {bid} missing')
    for sid in d.get('order', []):
        if sid not in d['sections']: errs.append(f'{f}: order {sid} missing')
# also check every section schema defaults
for p in glob.glob(f'{root}/sections/*.liquid'):
    sc = schema(os.path.basename(p)[:-7]) or {}
    check_settings(os.path.basename(p), sc.get('settings', []), {}, errs)
    for b in sc.get('blocks', []):
        check_settings(os.path.basename(p) + '/' + b['type'], b.get('settings', []), {}, errs)
s = json.load(open(f'{root}/config/settings_schema.json'))
for g in s:
    check_settings('settings_schema/' + g['name'], g.get('settings', []), {}, errs)
# Shopify rejects schema/setting-category names longer than 25 characters on upload
def long_names(o, where):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == 'name' and isinstance(v, str) and not v.startswith('t:') and len(v) > 25:
                errs.append(f'{where}: name too long ({len(v)} > 25): {v}')
            long_names(v, where)
    elif isinstance(o, list):
        for x in o: long_names(x, where)
for p in glob.glob(f'{root}/sections/*.liquid'):
    long_names(schema(os.path.basename(p)[:-7]) or {}, os.path.basename(p))
long_names(s, 'settings_schema.json')
print('\n'.join(errs) or 'OK: templates valid')
