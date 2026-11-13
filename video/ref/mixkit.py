# Free Mixkit laptop clips: a labelled thumbnail sheet, or downloads of PICK ids.
import os, re, urllib.request, json
HDR = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=HDR), timeout=60).read()
OUT = "video/ref/mixkit"; os.makedirs(OUT, exist_ok=True)
pick = [s for s in os.environ.get("PICK", "").split(",") if s]
if pick:
    for i in pick:
        for q in ("2160", "1080", "720"):
            try: open(f"{OUT}/{i}.mp4", "wb").write(get(f"https://assets.mixkit.co/videos/{i}/{i}-{q}.mp4")); print("got", i, q); break
            except Exception as e: print("no", i, q, e)
    raise SystemExit
items = {}
for q in ["laptop-green-screen", "laptop-green-screen/?page=2", "laptop-green-screen/?page=3", "laptop-screen", "laptop-screen/?page=2"]:
    try: html = get("https://mixkit.co/free-stock-video/" + q).decode("utf8", "ignore")
    except Exception as e: print("skip", q, e); continue
    for slug, i in re.findall(r'/free-stock-video/([a-z0-9-]+)-(\d{3,6})/', html): items.setdefault(i, slug)
print(len(items), "clips")
from PIL import Image, ImageDraw
cells = []
for i, slug in list(items.items())[:72]:
    for th in (f"https://assets.mixkit.co/videos/{i}/{i}-thumb-360-0.jpg", f"https://assets.mixkit.co/videos/{i}/{i}-thumb-720-0.jpg"):
        try:
            open("/tmp/t.jpg", "wb").write(get(th)); im = Image.open("/tmp/t.jpg").convert("RGB"); break
        except Exception: im = None
    if im is None: continue
    im.thumbnail((320, 320)); c = Image.new("RGB", (324, 214), (20, 20, 20)); c.paste(im, (2, 2))
    ImageDraw.Draw(c).text((4, 200), f"{i} {slug[:40]}", fill=(255, 255, 0)); cells.append(c)
json.dump(items, open(f"{OUT}/index.json", "w"), indent=0)
for k in range(0, len(cells), 24):
    part = cells[k:k + 24]; sheet = Image.new("RGB", (324 * 6, 214 * ((len(part) + 5) // 6)))
    for j, c in enumerate(part): sheet.paste(c, ((j % 6) * 324, (j // 6) * 214))
    sheet.save(f"{OUT}/sheet{k // 24}.jpg", quality=85)
