"""Builds the 3-minute tour's narration: one small MP3 per stop, plus the
exact time of every word so the caption can light up as it is spoken.

voice  : Kokoro-82M (open model, Apache-2.0) — natural, human-like narration;
         voice "af_heart" (warm, professional female). Runs on the CPU here.
mix    : voice only, gently mastered. The ambience under it is made live in the
         browser (js/tour.js), so it runs unbroken from stop to stop.
output : audio/tour/step-<n>-<hash>.mp3   (mono, 24 kHz, 64 kbps)
         audio/tour/manifest.json   { voice, clips: [{ i, text, file, seconds, bytes, words }] }
         words[k] = [start, end] in seconds for the k-th word of the caption
         (the caption split on spaces), already shifted for the clip's lead-in.
The tour only plays a clip whose text matches the caption exactly.
"""
import hashlib, json, os, re, subprocess
import numpy as np, soundfile as sf
from kokoro import KPipeline

VOICE = os.environ.get("TOUR_VOICE", "af_heart")
SPEED = float(os.environ.get("TOUR_SPEED", "1.0"))
VERSION = "k2"
OUT = "audio/tour"
SR = 24000
LEAD, TAIL = 0.25, 0.4
# spoken form only — the caption on screen stays exactly as written
SAY_AS = [("YojanaSahay", "Yojana Sahay"), ("StudyLens", "Study Lens"), ("’", "'"), ("‘", "'")]

steps = json.loads(subprocess.check_output(["node", "scripts/tour-voice/extract.mjs"]))
os.makedirs(OUT, exist_ok=True)
pipe = KPipeline(lang_code="a")

def spoken(t):
    for a, b in SAY_AS: t = t.replace(a, b)
    return t

def letters(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().replace("’", "'"))

def envelope(path, fps=25):
    """voice loudness, 25 times a second, as digits 0-9 (drives the orb and waveform)"""
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "8000", "-"])
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    n = 8000 // fps
    out = []
    for k in range(len(a) // n):
        seg = a[k * n:(k + 1) * n]
        db = 20 * np.log10(np.sqrt(np.mean(seg * seg)) + 1e-6)
        v = min(1.0, max(0.0, (db + 40.0) / 26.0))       # about -40 dB (background) .. -14 dB (voice)
        out.append(str(int(round(v * 9))))
    return "".join(out)

def dur(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())

def synth(text):
    """audio (float32) + [(token_text, start, end)] on one timeline"""
    chunks, toks, offset = [], [], 0.0
    for r in pipe(spoken(text), voice=VOICE, speed=SPEED, split_pattern=r"\n+"):
        a = r.audio.detach().cpu().numpy() if hasattr(r.audio, "detach") else np.asarray(r.audio)
        for t in (r.tokens or []):
            st, en = getattr(t, "start_ts", None), getattr(t, "end_ts", None)
            toks.append((t.text, None if st is None else offset + st, None if en is None else offset + en))
        chunks.append(a)
        offset += len(a) / SR
    return np.concatenate(chunks).astype(np.float32), toks, offset

def word_times(caption, toks, total):
    """time each caption word by walking the letters of the spoken tokens"""
    stream = []                                     # (letter, start, end)
    last = 0.0
    for text, st, en in toks:
        st = last if st is None else st
        en = st if en is None else en
        last = en
        for ch in letters(text): stream.append((ch, st, en))
    words = caption.split(" ")
    out, pos, ok = [], 0, True
    for w in words:
        need = letters(w)
        if not need:
            out.append(None); continue
        seg = stream[pos:pos + len(need)]
        if "".join(c for c, _, _ in seg) != need: ok = False; break
        out.append([seg[0][1], seg[-1][2]])
        pos += len(need)
    if not ok:                                      # fallback: spread by length (still in step, just less exact)
        lens = [max(1, len(letters(w))) for w in words]
        tot, acc, out = sum(lens), 0, []
        for n in lens:
            out.append([total * acc / tot, total * (acc + n) / tot]); acc += n
        print("  (timing by length for this clip)")
    for k, v in enumerate(out):                     # punctuation-only words ("—") take their neighbour's time
        if v is None: out[k] = list(out[k - 1]) if k else [0.0, 0.0]
    return [[round(s + LEAD, 3), round(e + LEAD, 3)] for s, e in out]

old = {}
try:
    for c in json.load(open(os.path.join(OUT, "manifest.json"))).get("clips", []): old[c["file"]] = c
except Exception: pass

manifest, keep = [], set()
for s in steps:
    i, text = s["i"], s["say"]
    h = hashlib.sha1(f"{VOICE}|{SPEED}|{VERSION}|{text}".encode()).hexdigest()[:8]
    name = f"step-{i + 1}-{h}.mp3"
    keep.add(name)
    final = os.path.join(OUT, name)
    if os.path.exists(final) and name in old and old[name].get("words"):
        c = old[name]
        if not c.get("env"): c["env"], c["fps"] = envelope(final), 25
        manifest.append(c); continue
    audio, toks, d = synth(text)
    raw = f"/tmp/voice-{i}.wav"
    sf.write(raw, audio, SR)
    subprocess.check_call([
        "ffmpeg", "-y", "-v", "error", "-i", raw, "-af",
        # clean the lows, tame "s" sounds, a touch of presence, even out the level, a very small room
        f"highpass=f=80,deesser=i=0.35,equalizer=f=3200:t=q:w=1.2:g=1.8,equalizer=f=220:t=q:w=1:g=-1,"
        f"acompressor=threshold=-21dB:ratio=2.4:attack=8:release=130,aecho=0.9:0.9:28|53:0.07|0.04,"
        f"adelay={int(LEAD*1000)},apad=pad_dur={TAIL},loudnorm=I=-16:TP=-1.5:LRA=8,aresample={SR}",
        "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame", "-b:a", "64k", final])
    words = word_times(text, toks, d)
    manifest.append({"i": i, "text": text, "file": name, "seconds": round(dur(final), 2), "bytes": os.path.getsize(final), "words": words, "env": envelope(final), "fps": 25})
    print(f"made {name}  {d:.1f}s  {len(words)} words")

for f in os.listdir(OUT):
    if f.endswith(".mp3") and f not in keep: os.remove(os.path.join(OUT, f))
with open(os.path.join(OUT, "manifest.json"), "w") as fh:
    json.dump({"voice": f"kokoro/{VOICE}", "clips": manifest}, fh, ensure_ascii=False, separators=(",", ":"))
print("total", sum(c["bytes"] for c in manifest) // 1024, "KB,", round(sum(c["seconds"] for c in manifest), 1), "s")
