# Contact sheet of free Burst laptop photos (thumbnails + slugs), or full-size
# downloads of chosen slugs (PICK=slug1,slug2).
import os, re, urllib.request, json, subprocess
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read()
os.makedirs("video/ref/burst", exist_ok=True)
pick = [s for s in os.environ.get("PICK", "").split(",") if s]
if pick:
    for s in pick:
        html = get(f"https://burst.shopify.com/photos/{s}").decode("utf8", "ignore")
        u = re.findall(r'https://burst\.shopifycdn\.com/photos/[^"?\s]+\.jpg', html)[0]
        open(f"video/ref/burst/{s}.jpg", "wb").write(get(u + "?width=4460&format=pjpg&exif=0&iptc=0"))
        print("full", s, u)
    raise SystemExit
seen, items = set(), []
for q in ["laptop", "laptop?page=2", "laptop?page=3", "laptop?page=4", "home-office", "home-office?page=2", "computer", "computer?page=2"]:
    try: html = get("https://burst.shopify.com/" + q).decode("utf8", "ignore")
    except Exception as e: print("skip", q, e); continue
    for slug, img in re.findall(r'href="/photos/([a-z0-9-]+)"[\s\S]{0,1500}?(?:data-)?src="(https://burst\.shopifycdn\.com/photos/[^"]+)"', html):
        if slug in seen: continue
        seen.add(slug); items.append((slug, img.split("?")[0] + "?width=360"))
print(len(items), "photos")
os.makedirs("/tmp/th", exist_ok=True); names = []
for i, (slug, u) in enumerate(items[:96]):
    try: open(f"/tmp/th/{i:03d}.jpg", "wb").write(get(u)); names.append((i, slug))
    except Exception as e: print("thumb fail", slug, e)
json.dump(names, open("video/ref/burst/index.json", "w"), indent=0)
for k in range(0, len(names), 24):
    part = names[k:k + 24]
    subprocess.run(["montage"] + sum([["-label", str(i), f"/tmp/th/{i:03d}.jpg"] for i, _ in part], []) +
                   ["-tile", "6x4", "-geometry", "300x200+4+4", "-pointsize", "22", f"video/ref/burst/sheet{k//24}.jpg"], check=True)
