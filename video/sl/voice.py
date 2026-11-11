# Hindi narration with Microsoft's neural Hindi voice, plus the time of every
# word, mapped one-to-one onto the Roman Hindi caption words.
import asyncio, json, os, re, subprocess
import edge_tts

VOICE = os.environ.get("VOICE", "hi-IN-SwaraNeural")
OUT = "video/sl/out/voice"
LEAD = 0.2
os.makedirs(OUT, exist_ok=True)
lines = json.load(open("video/sl/lines.json"))
clean = lambda w: re.sub(r"[^\wऀ-ॿ]", "", w)

async def speak(text, mp3):
    try:
        com = edge_tts.Communicate(text, VOICE, rate="+2%", boundary="WordBoundary")
    except TypeError:
        com = edge_tts.Communicate(text, VOICE, rate="+2%")
    marks = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": marks.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return marks

def align(words, marks):
    """Give each script word a [start, end], joining or splitting marks as needed."""
    target = [clean(w) for w in words]
    out, j = [], 0
    for i, w in enumerate(target):
        if j >= len(marks): break
        s, e, acc = marks[j][0], marks[j][1], clean(marks[j][2]); j += 1
        while len(acc) < len(w) and j < len(marks) and w.startswith(acc):
            e, acc = marks[j][1], acc + clean(marks[j][2]); j += 1
        out.append([s, e])
    if len(out) != len(words): return None
    return out

clips = []
for ln in lines:
    hi, ro = ln["hi"].split(), ln["ro"].split()
    assert len(hi) == len(ro), (ln["id"], len(hi), len(ro))
    mp3 = f"{OUT}/{ln['id']}.mp3"
    marks = asyncio.run(speak(ln["hi"], mp3))
    wav = f"{OUT}/{ln['id']}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", f"adelay={int(LEAD*1000)}:all=1,aresample=48000", "-ac", "2", wav], check=True)
    os.remove(mp3)
    secs = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout)
    t = align(hi, marks)
    how = "marks"
    if not t:   # spread by length if the marks don't line up
        how = "spread"
        total = sum(len(clean(w)) + 2 for w in hi); s0 = (marks[0][0] if marks else 0); s1 = (marks[-1][1] if marks else secs - LEAD); x = s0; t = []
        for w in hi:
            d = (s1 - s0) * (len(clean(w)) + 2) / total; t.append([x, x + d]); x += d
    words = [[round(a + LEAD, 3), round(b + LEAD, 3)] for a, b in t]
    clips.append({"id": ln["id"], "text": ln["ro"], "hi": ln["hi"], "file": f"{ln['id']}.wav", "seconds": round(secs, 3), "words": words, "timing": how,
                  "marks": [[round(a, 3), round(b, 3), m] for a, b, m in marks]})
    print(ln["id"], secs, how, len(marks), "marks for", len(hi), "words")
json.dump({"voice": VOICE, "clips": clips}, open(f"{OUT}/manifest.json", "w"), ensure_ascii=False, indent=1)
