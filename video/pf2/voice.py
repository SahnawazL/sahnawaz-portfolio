# Soft English narration (Microsoft neural voices) + the time of every word.
# Full narration in VOICE; a short sample of each voice in SAMPLES for choosing.
import asyncio, json, os, re, subprocess
import edge_tts
VOICE = os.environ.get("VOICE", "en-US-AvaMultilingualNeural")
SAMPLES = [v for v in os.environ.get("SAMPLES", "").split(",") if v]
RATE, PITCH, LEAD = os.environ.get("RATE", "-6%"), os.environ.get("PITCH", "-2Hz"), 0.2
ROOT = "video/pf2/out"
lines = json.load(open("video/pf2/lines.json"))
clean = lambda w: re.sub(r"[^\w]", "", w).lower()
# how names are said (captions keep the real spelling)
SAY_AS = {"Xiaomi": "Shawmi", "Sahnawaz": "Sah-nawaz", "Ahmed": "Aah-med", "Laskar": "Lashkar"}
def spoken(w):
    for a, b in SAY_AS.items(): w = w.replace(a, b)
    return w
SOFT = "highpass=f=70,deesser=i=0.3,acompressor=threshold=-22dB:ratio=2:attack=10:release=150,aresample=48000"

async def speak(text, voice, mp3):
    for k in range(6):
        try: return await speak1(text, voice, mp3)
        except Exception as e: print("  retry", k, e); await asyncio.sleep(3 + 4 * k)
    raise RuntimeError("no audio for " + text)

async def speak1(text, voice, mp3):
    try: com = edge_tts.Communicate(text, voice, rate=RATE, pitch=PITCH, boundary="WordBoundary")
    except TypeError: com = edge_tts.Communicate(text, voice, rate=RATE, pitch=PITCH)
    marks = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": marks.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return marks

def align(words, marks):
    target = [clean(w) for w in words]; out, j = [], 0
    for w in target:
        if j >= len(marks): return None
        s, e, acc = marks[j][0], marks[j][1], clean(marks[j][2]); j += 1
        while len(acc) < len(w) and j < len(marks) and w.startswith(acc):
            e, acc = marks[j][1], acc + clean(marks[j][2]); j += 1
        out.append([s, e])
    return out if len(out) == len(words) else None

def render(voice, todo, out):
    os.makedirs(out, exist_ok=True); clips = []
    for ln in todo:
        words = ln["say"].split(); said = [spoken(w) for w in words]
        mp3 = f"{out}/{ln['id']}.mp3"; wav = f"{out}/{ln['id']}.wav"
        marks = asyncio.run(speak(" ".join(said).replace("+", " "), voice, mp3))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", f"adelay={int(LEAD*1000)}:all=1,{SOFT}", "-ac", "2", wav], check=True)
        os.remove(mp3)
        secs = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout)
        t = align(said, marks); how = "marks"
        if not t:
            how = "spread"; s0 = marks[0][0] if marks else 0; s1 = marks[-1][1] if marks else secs - LEAD
            tot = sum(len(clean(w)) + 2 for w in words); x = s0; t = []
            for w in words: d = (s1 - s0) * (len(clean(w)) + 2) / tot; t.append([x, x + d]); x += d
        clips.append({"id": ln["id"], "text": ln["say"].replace("+", ""), "q": ln.get("q", 0), "file": ln["id"] + ".wav", "seconds": round(secs, 3),
                      "words": [[round(a + LEAD, 3), round(b + LEAD, 3)] for a, b in t], "timing": how})
        print(voice, ln["id"], round(secs, 2), how)
    json.dump({"voice": voice, "rate": RATE, "pitch": PITCH, "clips": clips}, open(f"{out}/manifest.json", "w"), indent=1)

if not os.environ.get("SAMPLES_ONLY"): render(VOICE, lines, f"{ROOT}/voice")
pick = [l for l in lines if l["id"] in ("hookQ", "brand", "dev", "buildQ")]
for v in SAMPLES:
    d = f"{ROOT}/samples/{v}"; render(v, pick, d)
    subprocess.run(["bash", "-c", f"cd {d} && for f in hookQ brand dev buildQ; do echo \"file '$f.wav'\"; done > l.txt && ffmpeg -y -loglevel error -f concat -i l.txt -af apad=pad_dur=0.6 ../{v}.mp3 && cd .. && rm -rf {v}"], check=True)
