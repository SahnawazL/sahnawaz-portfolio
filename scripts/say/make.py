"""Makes the site's pre-made audio clips (Orpheus voices with the tour's music).

Each sentence is performed on its own, written down by a speech recogniser and
compared with the script; a repeat or a wrong word is performed again. A clip
that can't pass is left out, so its button simply doesn't appear.

output : audio/say/<id>-<hash>.mp3  the clip (stereo, 96 kbps)
         audio/say/<id>-<hash>.json { words: [[start, end]...], text, speakers, env, fps }
         audio/say/index.json       { id: { f: <id>-<hash>, s: seconds } }   small, read first
The bash loop in the workflow commits as it goes, so a long run can't lose work."""
import difflib, hashlib, importlib.util, json, os, re, subprocess, sys, time, wave
import numpy as np
from faster_whisper import WhisperModel
from orpheus_cpp import OrpheusCpp

VERSION = "s2"
OUT = "audio/say"
BEAT = 60 / 124
LEAD = BEAT * 2          # the music opens for half a bar, and the voice enters on the beat
GAP = {"same": 0.28, "turn": 0.38}
LIMIT = int(os.environ.get("SAY_LIMIT", "0"))
ONLY = [x for x in os.environ.get("SAY_ONLY", "").split(",") if x]
SAY_AS = [("YojanaSahay", "Yojana Sahay"), ("StudyLens", "Study Lens"), ("Sahnawaz", "Shahnawaz"), ("Ienergizer", "I energizer"),
          ("AHSEC", "A H Sec"), ("CBSE", "C B S E"), ("ICSE", "I C S E"), ("SEBA", "Seba"), ("SHG", "S H G"), ("QA", "Q A"), ("HR", "H R"), ("NGOs", "N G Os"), ("SEO", "S E O")]
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
    s = re.sub(r"₹([\d,]+)", lambda m: rupees(int(m.group(1).replace(",", ""))), s).replace("’", "'")
    for a, b in SAY_AS: s = s.replace(a, b)
    return s
def plain(s):
    # the recogniser writes amounts as digits: read them back as words before comparing
    s = re.sub(r"[₹$]?\b\d[\d,]*\b", lambda m: rupees(int(re.sub(r"\D", "", m.group(0)))).replace(" rupees", ""), s)
    return re.sub(r"[^a-z ]", "", re.sub(r"<\w+>", "", s).lower().replace("-", " ")).split()

def clip_hash(cid, energy, turns):
    return hashlib.sha1(json.dumps([VERSION, energy, turns], ensure_ascii=False).encode()).hexdigest()[:8]

def load_index():
    try: return json.load(open(f"{OUT}/index.json"))
    except Exception: return {}

index = load_index()
todo = []
for cid, (energy, turns) in lines.CLIPS.items():
    if ONLY and cid not in ONLY: continue
    turns = [(v, [fill(s) for s in ss]) for v, ss in turns]
    h = clip_hash(cid, energy, turns)
    if index.get(cid, {}).get("f") == f"{cid}-{h}" and os.path.exists(f"{OUT}/{cid}-{h}.mp3"): continue
    todo.append((cid, energy, turns, h))
if LIMIT: todo = todo[:LIMIT]
print(len(todo), "clips to make", flush=True)
if not todo: sys.exit(0)

os.makedirs(OUT, exist_ok=True)
voice = OrpheusCpp(lang="en", n_gpu_layers=0, verbose=False)
ear = WhisperModel("base.en", device="cpu", compute_type="int8")

def trim(a, sr):
    """cut silence from both ends"""
    fr = int(sr * .02); n = len(a) // fr
    if not n: return a
    loud = [np.abs(a[k * fr:(k + 1) * fr]).max() > 500 for k in range(n)]
    if not any(loud): return a[:0]
    first = loud.index(True); last = n - 1 - loud[::-1].index(True)
    return a[max(0, first - 1) * fr:min(n, last + 3) * fr]

def heard(a, sr):
    x = a.astype(np.float32) / 32768
    if sr != 16000: x = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype(np.float32)
    seg, _ = ear.transcribe(x, beam_size=3, condition_on_previous_text=False, vad_filter=False, word_timestamps=True)
    out = []
    for s in seg:
        for w in (s.words or []): out.append((w.word, float(w.start), float(w.end)))
    return out

def perform(v, sentence):
    """one sentence, checked; returns (audio, sample rate, score) or None"""
    want = plain(spoken(sentence)); best = None
    for attempt, (temp, top_p) in enumerate([(.6, .9), (.7, .95), (.5, .9), (.8, .95), (.55, .85)]):
        sr, a = voice.tts(spoken(sentence), options={"voice_id": v, "max_tokens": 2048, "temperature": temp, "top_p": top_p})
        a = trim(np.squeeze(np.asarray(a)).astype(np.int16), sr)
        said = heard(a, sr)
        got = plain(" ".join(w[0] for w in said))
        score = difflib.SequenceMatcher(None, want, got).ratio()
        long = len(got) > len(want) * 1.2 + 2                     # a repeat
        secs = len(a) / sr; pace = secs / max(1, len(want))
        slack = len(re.findall(r"<\w+>", sentence))
        odd = pace > .85 + slack * .6                              # far too slow: a stall or a loop
        if best is None or score > best[2]: best = (a, sr, score, said)
        print(f"   try {attempt + 1}: {score:.2f} {secs:.1f}s {' '.join(got)[:90]}", flush=True)
        if score >= .86 and not long and not odd: return (a, sr, score, said)
    return best if best[2] >= .92 else None

def words_of(sentence, said, start, length):
    """the moment each caption word is really spoken: the recogniser's own word
    times, matched to the script; the rare word it missed sits between its neighbours"""
    ws = caption(sentence).split(" ")
    want, owner = [], []
    for k, w in enumerate(ws):
        for t in plain(spoken(w)): want.append(t); owner.append(k)
    heard_t, times = [], []
    for w, a, b in said:
        for t in plain(w): heard_t.append(t); times.append((a, b))
    first, last = [None] * len(ws), [None] * len(ws)
    for m in difflib.SequenceMatcher(None, want, heard_t, autojunk=False).get_matching_blocks():
        for n in range(m.size):
            k = owner[m.a + n]; a, b = times[m.b + n]
            if first[k] is None: first[k] = a
            last[k] = b
    hits = [k for k in range(len(ws)) if first[k] is not None]
    miss = len(ws) - len(hits)
    if miss: print(f"   {miss} of {len(ws)} words placed by neighbours", flush=True)
    for k in range(len(ws)):
        if first[k] is None:
            before = max([h for h in hits if h < k], default=None); after = min([h for h in hits if h > k], default=None)
            lo = last[before] if before is not None else 0.0
            hi = first[after] if after is not None else length
            lo_k = before if before is not None else -1; hi_k = after if after is not None else len(ws)
            f = (k - lo_k) / (hi_k - lo_k)
            first[k] = lo + (hi - lo) * f - (hi - lo) / (hi_k - lo_k) * 0
            last[k] = first[k] + (hi - lo) / (hi_k - lo_k)
    return ws, [[round(start + first[k], 3), round(start + max(first[k], last[k]), 3)] for k in range(len(ws))]

def envelope(path, fps=25):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "8000", "-"])
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768; n = 8000 // fps; out = []
    for k in range(len(a) // n):
        seg = a[k * n:(k + 1) * n]; db = 20 * np.log10(np.sqrt(np.mean(seg * seg)) + 1e-6)
        out.append(str(int(round(min(1, max(0, (db + 40) / 26)) * 9))))
    return "".join(out)

def make(cid, energy, turns, h):
    t0 = time.time(); parts = []; words = []; text = []; speakers = []; at = LEAD; sr0 = None; last_v = None
    for v, sentences in turns:
        for s in sentences:
            print(f"  {cid} [{v}] {caption(s)[:70]}", flush=True)
            got = perform(v, s)
            if not got: print(f"LEFT OUT {cid}: couldn't get a clean read", flush=True); return False
            a, sr, score, said = got; sr0 = sr
            if parts:
                gap = GAP["turn" if v != last_v else "same"]
                parts.append(np.zeros(int(gap * sr), np.int16)); at += gap
            end = at + len(a) / sr
            ws, ts = words_of(s, said, at, len(a) / sr)
            if last_v is not None and v != last_v: speakers.append(len(words))
            words += ts; text += ws; parts.append(a); at = end; last_v = v
    raw = f"/tmp/{cid}.wav"
    with wave.open(raw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr0); w.writeframes(np.concatenate(parts).tobytes())
    bar = BEAT * 4
    total = (int((at + .6) / bar) + 2) * bar                   # the music rounds off on a bar line
    final = f"{OUT}/{cid}-{h}.mp3"
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", raw, "-stream_loop", "-1", "-i", f"scripts/say/bed-{energy}.flac", "-filter_complex",
      # the voice: clean, present, warm; the music: ducks under it and rises in the pauses
      f"[0:a]aresample=44100,highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=1.5,acompressor=threshold=-20dB:ratio=2.4:attack=8:release=130,"
      f"aecho=0.9:0.9:28|53:0.06|0.035,loudnorm=I=-16:TP=-1.5:LRA=9,aformat=channel_layouts=stereo,adelay={int(LEAD * 1000)}|{int(LEAD * 1000)},apad,asplit=2[vo][key];"
      f"[1:a]atrim=0:{total:.3f},asetpts=PTS-STARTPTS,volume=-3dB[m];"
      f"[m][key]sidechaincompress=threshold=0.035:ratio=6:attack=25:release=380:level_sc=2[duck];"
      f"[duck][vo]amix=inputs=2:duration=first:normalize=0,afade=t=out:st={total - bar:.3f}:d={bar:.3f},alimiter=limit=0.95",
      "-ar", "44100", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k", final])
    secs = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final]).strip())
    json.dump({"text": text, "words": words, "turns": speakers, "env": envelope(final), "fps": 25}, open(f"{OUT}/{cid}-{h}.json", "w"), ensure_ascii=False, separators=(",", ":"))
    index[cid] = {"f": f"{cid}-{h}", "s": round(secs, 1), "n": len(turns)}
    print(f"made {cid} {secs:.1f}s in {time.time() - t0:.0f}s", flush=True)
    return True

done = left = 0
for k, (cid, energy, turns, h) in enumerate(todo):
    if make(cid, energy, turns, h): done += 1
    else: left += 1
    live = {f"{c}-" for c in index}
    json.dump(index, open(f"{OUT}/index.json", "w"), separators=(",", ":"))
    keep = {v["f"] for v in index.values()}
    for f in os.listdir(OUT):
        if f != "index.json" and os.path.splitext(f)[0] not in keep: os.remove(f"{OUT}/{f}")
    subprocess.call(["bash", "scripts/say/save.sh"])
print("finished", done, "made,", left, "left out", flush=True)
