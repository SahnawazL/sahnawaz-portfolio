"""Builds the 60-second tour's narration: one small MP3 per stop, plus the
exact time of every word so the caption can light up as it is spoken.

voice  : Kokoro-82M (open model, Apache-2.0) — natural, human-like narration;
         voice "af_heart" (warm, professional female). Runs on the CPU here.
bed    : a soft, original "tech" ambience generated with ffmpeg (warm pad,
         gentle data pings) — no third-party music, nothing to license
output : audio/tour/step-<n>-<hash>.mp3   (mono, 24 kHz, 40 kbps)
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
VERSION = "k1"
OUT = "audio/tour"
SR = 24000
LEAD, TAIL = 0.35, 0.8
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

# warm A-minor-9 pad that breathes slowly + soft high "data" pings every 1.6 s
PAD = ("0.16*sin(2*PI*110*t)*(0.65+0.35*sin(2*PI*0.21*t))"
       "+0.11*sin(2*PI*164.81*t)*(0.6+0.4*sin(2*PI*0.17*t+1.3))"
       "+0.09*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.27*t+2.1))"
       "+0.05*sin(2*PI*329.63*t)*(0.5+0.5*sin(2*PI*0.13*t+0.7))"
       "+0.04*sin(2*PI*493.88*t)*(0.5+0.5*sin(2*PI*0.11*t+2.9))"
       "+0.030*sin(2*PI*1318.5*t)*exp(-9*mod(t,1.6))"
       "+0.018*sin(2*PI*1975.5*t)*exp(-14*mod(t+0.8,1.6))")

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
        manifest.append(old[name]); continue
    audio, toks, d = synth(text)
    raw = f"/tmp/voice-{i}.wav"
    sf.write(raw, audio, SR)
    total = LEAD + d + TAIL
    subprocess.check_call([
        "ffmpeg", "-y", "-v", "error", "-i", raw,
        "-f", "lavfi", "-i", f"aevalsrc='{PAD}':s={SR}:d={total:.2f}",
        "-filter_complex",
        f"[0:a]aresample={SR},highpass=f=70,acompressor=threshold=-21dB:ratio=2.2:attack=10:release=140,adelay={int(LEAD*1000)},apad=pad_dur={TAIL}[v];"
        f"[1:a]lowpass=f=2600,aecho=0.8:0.6:120:0.25,volume=-19dB,afade=t=in:d=0.5,afade=t=out:st={total-0.9:.2f}:d=0.9[b];"
        f"[v][b]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-17:TP=-1.5:LRA=9,aresample={SR}",
        "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame", "-b:a", "40k", final])
    words = word_times(text, toks, d)
    manifest.append({"i": i, "text": text, "file": name, "seconds": round(dur(final), 2), "bytes": os.path.getsize(final), "words": words})
    print(f"made {name}  {d:.1f}s  {len(words)} words")

for f in os.listdir(OUT):
    if f.endswith(".mp3") and f not in keep: os.remove(os.path.join(OUT, f))
with open(os.path.join(OUT, "manifest.json"), "w") as fh:
    json.dump({"voice": f"kokoro/{VOICE}", "clips": manifest}, fh, ensure_ascii=False, separators=(",", ":"))
print("total", sum(c["bytes"] for c in manifest) // 1024, "KB,", round(sum(c["seconds"] for c in manifest), 1), "s")
