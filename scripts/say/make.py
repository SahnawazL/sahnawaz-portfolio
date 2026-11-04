"""Makes the site's pre-made audio clips: the tour's voice (Kokoro-82M, "af_heart")
over the tour's music.

The voice is performed sentence by sentence with natural gaps, its exact word
times come from the voice model, and the music ducks under it and rises in the
pauses, so captions follow the speech.

output : audio/say/<id>-<hash>.mp3  the clip (stereo, 96 kbps)
         audio/say/<id>-<hash>.json { text, words: [[start, end]...], turns, env, fps }
         audio/say/index.json       { id: { f: <id>-<hash>, s: seconds, n: turns } }   small, read first"""
import hashlib, importlib.util, json, os, re, subprocess, sys, time
import numpy as np, soundfile as sf
from kokoro import KPipeline

VERSION = "k1"
OUT = "audio/say"
SR = 24000
BEAT = 60 / 124
LEAD = BEAT * 2          # the music opens for half a bar, and the voice enters on the beat
GAP_SAME, GAP_TURN, GAP_TAG = .2, .34, .32
SPEED = {"af_heart": 1.0, "af_bella": 1.02}
LIMIT = int(os.environ.get("SAY_LIMIT", "0"))
ONLY = [x for x in os.environ.get("SAY_ONLY", "").split(",") if x]
SAY_AS = [("YojanaSahay", "Yojana Sahay"), ("StudyLens", "Study Lens"), ("Sahnawaz", "Shahnawaz"), ("Ienergizer", "I energizer"),
          ("AHSEC", "A H Sec"), ("CBSE", "C B S E"), ("ICSE", "I C S E"), ("SEBA", "Seba"), ("SHG", "S H G"), ("QA", "Q A"), ("HR", "H R"), ("NGOs", "N G Os"), ("SEO", "S E O"), ("’", "'")]
UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

def under_100(n): return UNITS[n] if n < 20 else (TENS[n // 10] + (" " + UNITS[n % 10] if n % 10 else ""))
def rupees(n):
    parts = []
    if n >= 1000: parts.append(under_100(n // 1000) + " thousand")
    n %= 1000
    if n >= 100: parts.append(UNITS[n // 100] + " hundred")
    n %= 100
    if n: parts.append(("and " if parts else "") + under_100(n))
    return " ".join(parts) + " rupees"

html = open("index.html", encoding="utf8", errors="ignore").read()
prices = re.findall(r'class="wio-price">₹([\d,]+)<', html)
notes = re.findall(r'class="wio-price-note">\+ ₹([\d,]+) domain', html)
FILL = {f"p{i}": "₹" + p for i, p in enumerate(prices)}
FILL["hosting"] = "₹" + notes[0]

spec = importlib.util.spec_from_file_location("lines", "scripts/say/lines.py")
lines = importlib.util.module_from_spec(spec); spec.loader.exec_module(lines)

def fill(s): return re.sub(r"\{(\w+)\}", lambda m: FILL[m.group(1)], s)
def caption(s): return re.sub(r"\s+", " ", re.sub(r"<\w+>", "", s)).strip()
def spoken(s):
    s = re.sub(r"₹([\d,]+)", lambda m: rupees(int(m.group(1).replace(",", ""))), s)
    for a, b in SAY_AS: s = s.replace(a, b)
    return s
def letters(s): return re.sub(r"[^a-z0-9]", "", s.lower())

index = {}
try: index = json.load(open(f"{OUT}/index.json"))
except Exception: pass
todo = []
for cid, (energy, turns) in lines.CLIPS.items():
    if ONLY and cid not in ONLY: continue
    turns = [(v, [fill(s) for s in ss]) for v, ss in turns]
    h = hashlib.sha1(json.dumps([VERSION, energy, turns], ensure_ascii=False).encode()).hexdigest()[:8]
    if index.get(cid, {}).get("f") == f"{cid}-{h}" and os.path.exists(f"{OUT}/{cid}-{h}.mp3"): continue
    todo.append((cid, energy, turns, h))
if LIMIT: todo = todo[:LIMIT]
print(len(todo), "clips to make", flush=True)

os.makedirs(OUT, exist_ok=True)
pipe = KPipeline(lang_code="a") if todo else None

def synth(text, voice):
    """audio plus [(token, start, end)] on one timeline"""
    chunks, toks, offset = [], [], 0.0
    for r in pipe(text, voice=voice, speed=SPEED.get(voice, 1.0), split_pattern=r"\n+"):
        a = r.audio.detach().cpu().numpy() if hasattr(r.audio, "detach") else np.asarray(r.audio)
        for t in (r.tokens or []):
            st, en = getattr(t, "start_ts", None), getattr(t, "end_ts", None)
            toks.append((t.text, None if st is None else offset + st, None if en is None else offset + en))
        chunks.append(a); offset += len(a) / SR
    return np.concatenate(chunks).astype(np.float32), toks, offset

def word_times(sentence, toks, total):
    """each caption word's real time, by walking the letters of the spoken tokens"""
    stream, last = [], 0.0
    for text, st, en in toks:
        st = last if st is None else st; en = st if en is None else en; last = en
        for ch in letters(text): stream.append((ch, st, en))
    ws = caption(sentence).split(" "); out = []; pos = 0; ok = True
    for w in ws:
        need = letters(spoken(w))
        if not need: out.append(None); continue
        seg = stream[pos:pos + len(need)]
        if "".join(c for c, _, _ in seg) != need: ok = False; break
        out.append([seg[0][1], seg[-1][2]]); pos += len(need)
    if not ok:                                        # numbers read differently: shared out by letters instead
        n = [max(1, len(letters(spoken(w)))) for w in ws]; tot = sum(n); acc = 0; out = []
        for k in n: out.append([total * acc / tot, total * (acc + k) / tot]); acc += k
        print("  (timing by length:", caption(sentence)[:60], ")", flush=True)
    for k, v in enumerate(out):
        if v is None: out[k] = list(out[k - 1]) if k else [0.0, 0.0]
    return ws, out

def envelope(path, fps=25):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "8000", "-"])
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768; n = 8000 // fps; out = []
    for k in range(len(a) // n):
        seg = a[k * n:(k + 1) * n]; db = 20 * np.log10(np.sqrt(np.mean(seg * seg)) + 1e-6)
        out.append(str(int(round(min(1, max(0, (db + 40) / 26)) * 9))))
    return "".join(out)

def make(cid, energy, turns, h):
    t0 = time.time(); parts = []; words = []; text = []; marks = []; at = LEAD; prev = None
    for v, sentences in turns:
        for s in sentences:
            a, toks, d = synth(spoken(caption(s)), v)
            if parts:
                gap = GAP_TURN if v != prev else GAP_SAME
                if re.match(r".*<\w+>\s*$", prev_s): gap += GAP_TAG
                parts.append(np.zeros(int(gap * SR), np.float32)); at += gap
            ws, ts = word_times(s, toks, d)
            if prev is not None and v != prev: marks.append(len(words))
            words += [[round(x + at, 3), round(y + at, 3)] for x, y in ts]; text += ws
            parts.append(a); at += d; prev = v; prev_s = s
    raw = f"/tmp/{cid}.wav"
    sf.write(raw, np.concatenate(parts), SR)
    bar = BEAT * 4
    total = (int((at + .5) / bar) + 2) * bar                  # the music rounds off on a bar line
    final = f"{OUT}/{cid}-{h}.mp3"
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", raw, "-stream_loop", "-1", "-i", f"scripts/say/bed-{energy}.flac", "-filter_complex",
      f"[0:a]aresample=44100,highpass=f=80,deesser=i=0.3,equalizer=f=3200:t=q:w=1.2:g=1.5,equalizer=f=180:t=q:w=1:g=1.5,acompressor=threshold=-20dB:ratio=2.4:attack=8:release=130,"
      f"aecho=0.9:0.9:28|53:0.06|0.035,loudnorm=I=-16:TP=-1.5:LRA=9,aformat=channel_layouts=stereo,adelay={int(LEAD * 1000)}|{int(LEAD * 1000)},apad,asplit=2[vo][key];"
      f"[1:a]atrim=0:{total:.3f},asetpts=PTS-STARTPTS,volume=-3dB[m];"
      f"[m][key]sidechaincompress=threshold=0.035:ratio=6:attack=25:release=380:level_sc=2[duck];"
      f"[duck][vo]amix=inputs=2:duration=first:normalize=0,afade=t=out:st={total - bar:.3f}:d={bar:.3f},alimiter=limit=0.95",
      "-ar", "44100", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k", final])
    secs = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final]).strip())
    json.dump({"text": text, "words": words, "turns": marks, "env": envelope(final), "fps": 25}, open(f"{OUT}/{cid}-{h}.json", "w"), ensure_ascii=False, separators=(",", ":"))
    index[cid] = {"f": f"{cid}-{h}", "s": round(secs, 1), "n": len(turns)}
    print(f"made {cid} {secs:.1f}s in {time.time() - t0:.0f}s", flush=True)

for cid, energy, turns, h in todo: make(cid, energy, turns, h)
index = {k: v for k, v in index.items() if k in lines.CLIPS}
json.dump(index, open(f"{OUT}/index.json", "w"), separators=(",", ":"))
keep = {v["f"] for v in index.values()}
for f in os.listdir(OUT):
    if f != "index.json" and os.path.splitext(f)[0] not in keep: os.remove(f"{OUT}/{f}")
print("finished", len(todo), "clips,", round(sum(v["s"] for v in index.values())), "s", flush=True)
