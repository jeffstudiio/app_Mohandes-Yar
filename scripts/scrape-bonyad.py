# MAHENDESYAR V2 — shop seed data from bonyadsite.com (placeholder modeling per user request)
# Fetches each رشته×نیاز category page and extracts product title / link / image.
# Output: db/shop.json  (later this section gets its own real backend — "تکمیل بعدی")
import re, json, html, urllib.parse, urllib.request, os, time

BASE = "https://bonyadsite.com/product-category/"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

CATS = [
    ("CIVIL", "عمران", [
        ("SUPERVISION", "نظارت", "نظام-مهندسی/عمران/نظارت-عمران/"),
        ("EXECUTION", "اجرا", "نظام-مهندسی/عمران/اجرا/"),
        ("DESIGN-CALC", "محاسبات", "نظام-مهندسی/عمران/محاسبات/"),
    ]),
    ("ARCH", "معماری", [
        ("DESIGN", "طراحی", "نظام-مهندسی/معماری/طراحی/"),
        ("EXECUTION", "اجرا", "نظام-مهندسی/معماری/اجرا-معماری/"),
        ("SUPERVISION", "نظارت", "نظام-مهندسی/معماری/نظارت/"),
    ]),
    ("ELEC", "برق", [
        ("DESIGN", "طراحی", "نظام-مهندسی/electricity/طراحی-برقی/"),
        ("EXECUTION", "اجرا", "نظام-مهندسی/electricity/اجرا-برقی/"),
        ("SUPERVISION", "نظارت", "نظام-مهندسی/electricity/نظارت-برقی/"),
    ]),
    ("MECH", "مکانیک", [
        ("DESIGN", "طراحی", "نظام-مهندسی/mechanic/طراحی-مکانیک/"),
        ("EXECUTION", "اجرا", "نظام-مهندسی/mechanic/اجرا-مکانیکی/"),
        ("SUPERVISION", "نظارت", "نظام-مهندسی/mechanic/نظارت-مکانیکی/"),
    ]),
    ("URBAN", "شهرسازی", [
        ("PACKAGE", "پکیج‌ها", "نظام-مهندسی/شهرسازی/پکیج-شهرسازی/"),
    ]),
    ("TRAFFIC", "ترافیک", [
        ("PACKAGE", "پکیج‌ها", "نظام-مهندسی/ترافیک/پکیج-ترافیک/"),
    ]),
    ("SURV", "نقشه‌برداری", [
        ("PACKAGE", "پکیج‌ها", "نظام-مهندسی/mapping/پکیج-نقشه-برداری/"),
    ]),
]

def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "ignore")
        except Exception as e:
            print(f"  retry {i+1} ({e})", flush=True)
            time.sleep(2)
    return ""

def products_from(s, limit=10):
    out, seen = [], set()
    for b in re.split(r'(?=<li class="[^"]*product)', s)[1:]:
        link = re.search(r'<a href="(https://bonyadsite\.com/product/[^"]+)"', b)
        if not link:
            continue
        url = urllib.parse.unquote(link.group(1))
        slug = url.rstrip("/").split("/product/")[-1]
        if slug in seen:
            continue
        seen.add(slug)
        title = re.search(r'title="([^"]+)"', b) or re.search(r'alt="([^"]+)"', b)
        img = re.search(r'(?:data-src|data-lazy-src|src)="(https://bonyadsite\.com/wp-content/uploads/[^"]+\.(?:jpg|jpeg|png|webp))"', b)
        t = html.unescape(title.group(1)).strip() if title else slug.replace("-", " ")
        t = re.sub(r"\s+", " ", t)
        out.append({"title": t, "url": url, "img": img.group(1) if img else None})
        if len(out) >= limit:
            break
    return out

groups = []
for code, gtitle, needs in CATS:
    g = {"code": code, "title": gtitle, "needs": []}
    for ncode, ntitle, path in needs:
        url = BASE + urllib.parse.quote(path, safe="/%")
        print(f"fetch {gtitle}/{ntitle} …", flush=True)
        s = fetch(url)
        prods = products_from(s)
        print(f"  → {len(prods)} products", flush=True)
        g["needs"].append({"code": ncode, "title": ntitle, "products": prods})
    groups.append(g)

os.makedirs("db", exist_ok=True)
with open("db/shop.json", "w", encoding="utf-8") as f:
    json.dump({"source": "bonyadsite.com (placeholder modeling)", "fetchedAt": time.strftime("%Y-%m-%d"), "groups": groups}, f, ensure_ascii=False, indent=1)
total = sum(len(n["products"]) for g in groups for n in g["needs"])
print(f"DONE — {total} products → db/shop.json")
