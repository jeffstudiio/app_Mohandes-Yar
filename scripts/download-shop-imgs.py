# Download bonyadsite product images locally → public/shop-imgs/ (robust, no hotlinking)
import json, urllib.request, urllib.parse, os, time, re

d = json.load(open('db/shop.json', encoding='utf-8'))
OUT = "public/shop-imgs"
os.makedirs(OUT, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36", "Accept": "image/*,*/*;q=0.8"}

def fetch(url, tries=4):
    u = urllib.parse.quote(url, safe=":/?&=%.~-_")
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25)
            return r.read()
        except Exception as e:
            time.sleep(1.5 * (i + 1))
    return None

n, ok, fail = 0, 0, 0
for g in d['groups']:
    for nd in g['needs']:
        for p in nd['products']:
            if not p['img']:
                continue
            n += 1
            ext = os.path.splitext(urllib.parse.urlparse(p['img']).path)[1] or ".jpg"
            ext = re.sub(r'[^a-z]', '', ext.lower()) or "jpg"
            fname = f"shop-{n:03d}.{ext}"
            fpath = os.path.join(OUT, fname)
            if os.path.exists(fpath) and os.path.getsize(fpath) > 2000:
                p['img'] = f"/shop-imgs/{fname}"
                ok += 1
                continue
            data = fetch(p['img'])
            if data and len(data) > 2000:
                open(fpath, "wb").write(data)
                p['img'] = f"/shop-imgs/{fname}"
                ok += 1
                print(f"✓ {fname} {len(data)//1024}KB", flush=True)
            else:
                p['img'] = None
                fail += 1
                print(f"✗ {n}", flush=True)
            time.sleep(0.6)

json.dump(d, open('db/shop.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"DONE — ok {ok}, fail {fail}, total {n}")
