# Tour narration in the Kokoro "heart" voice (the one used for the earlier
# portfolio and YojanaSahay reels), with the time of every caption word.
import json, os, re, subprocess
import numpy as np, soundfile as sf
from kokoro import KPipeline
VOICE, SR, LEAD, TAIL = os.environ.get("KVOICE", "af_heart"), 24000, 0.2, 0.3
ROOT = "video/pf3/out/voice"; os.makedirs(ROOT, exist_ok=True)
SAY_AS = {"Xiaomi": "Shawmi", "Sahnawaz": "Sah-nawaz", "Ahmed": "Aah-med", "Laskar": "Lashkar"}
def spoken(w):
    for a, b in SAY_AS.items(): w = w.replace(a, b)
    return w
letters = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
pipe = KPipeline(lang_code="a")
def synth(text):
    chunks, toks, off = [], [], 0.0
    for r in pipe(text, voice=VOICE, speed=0.96, split_pattern=r"\n+"):
        a = r.audio.detach().cpu().numpy() if hasattr(r.audio, "detach") else np.asarray(r.audio)
        for t in (r.tokens or []):
            st, en = getattr(t, "start_ts", None), getattr(t, "end_ts", None)
            toks.append((t.text, None if st is None else off + st, None if en is None else off + en))
        chunks.append(a); off += len(a) / SR
    return np.concatenate(chunks).astype(np.float32), toks, off
def times(words, toks, total):
    stream, last = [], 0.0
    for text, st, en in toks:
        st = last if st is None else st; en = st if en is None else en; last = en
        for ch in letters(text): stream.append((ch, st, en))
    out, pos = [], 0
    for w in words:
        need = letters(w)
        if not need: out.append(None); continue
        seg = stream[pos:pos + len(need)]
        if "".join(c for c, _, _ in seg) != need: return None
        out.append([seg[0][1], seg[-1][2]]); pos += len(need)
    for k, v in enumerate(out):
        if v is None: out[k] = list(out[k - 1]) if k else [0.0, 0.0]
    return out
clips = []
for ln in json.load(open("video/pf3/lines.json")):
    words = ln["say"].split(); said = [spoken(w).replace("+", " ") for w in words]
    audio, toks, d = synth(" ".join(said))
    raw = f"/tmp/{ln['id']}.wav"; sf.write(raw, audio, SR)
    wav = f"{ROOT}/{ln['id']}.wav"
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af",
        f"highpass=f=80,deesser=i=0.35,equalizer=f=3200:t=q:w=1.2:g=1.6,acompressor=threshold=-21dB:ratio=2.2:attack=8:release=130,"
        f"adelay={int(LEAD*1000)}:all=1,apad=pad_dur={TAIL},aresample=48000", "-ac", "2", "-ar", "48000", wav])
    t = times(said, toks, d); how = "marks"
    if t is None:
        how = "spread"; tot = sum(len(letters(w)) + 2 for w in said); x = 0.05; t = []
        for w in said: dd = (d - .1) * (len(letters(w)) + 2) / tot; t.append([x, x + dd]); x += dd
    secs = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]))
    clips.append({"id": ln["id"], "text": ln["say"].replace("+", ""), "q": ln.get("q", 0), "file": ln["id"] + ".wav", "seconds": round(secs, 3),
                  "words": [[round(a + LEAD, 3), round(b + LEAD, 3)] for a, b in t], "timing": how})
    print(ln["id"], round(secs, 2), how)
json.dump({"voice": "kokoro/" + VOICE, "clips": clips}, open(f"{ROOT}/manifest.json", "w"), indent=1)
