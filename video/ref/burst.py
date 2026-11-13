# Free Burst (Shopify) laptop photos: a labelled contact sheet of candidates,
# or full-size downloads of the ones in pick.txt.
import os, re, urllib.request, json, subprocess
HDR = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=HDR), timeout=40).read()
OUT = "video/ref/burst"; os.makedirs(OUT, exist_ok=True)
def img_of(slug):
    html = get(f"https://www.shopify.com/stock-photos/photos/{slug}").decode("utf8", "ignore")
    return re.findall(r'https://burst\.shopifycdn\.com/photos/[^"?\s&]+\.jpg', html)[0]
pick = [s for s in os.environ.get("PICK", "").split(",") if s]
if pick:
    for s in pick:
        u = img_of(s); open(f"{OUT}/{s}.jpg", "wb").write(get(u + "?width=4000&format=pjpg&exif=0&iptc=0")); print("full", s, u)
    raise SystemExit
SLUGS = """macbook-air-on-desk portrait-of-illuminated-laptop working-at-night laptop-coffee laptop-computer-on-wooden-table laptop-in-an-empty-room
tidy-desk-in-window-light organized-workspace startup-desk coding-on-laptop open-laptop-on-a-wooden-desk-under-window laptop-on-a-table
startup-desktop laptop-on-a-the-white-desk-of-a-home-office in-office-working-on-laptop designers-desk-with-coffee-and-wireframes""".split()
os.makedirs("/tmp/th", exist_ok=True); ok = []
for i, s in enumerate(SLUGS):
    try:
        u = img_of(s); open(f"/tmp/th/{i:02d}.jpg", "wb").write(get(u + "?width=640")); ok.append((i, s, u)); print(i, s)
    except Exception as e: print("fail", s, e)
json.dump(ok, open(f"{OUT}/index.json", "w"), indent=0)
subprocess.run(["montage"] + sum([["-label", f"{i} {s[:28]}", f"/tmp/th/{i:02d}.jpg"] for i, s, _ in ok], []) +
               ["-tile", "4x", "-geometry", "420x300+4+4", "-pointsize", "16", f"{OUT}/sheet.jpg"], check=True)
