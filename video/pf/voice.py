"""Narration for the YojanaSahay film: one WAV per line + the time of every
caption word (same voice and method as the portfolio tour, scripts/tour-voice)."""
import json, os, re, subprocess
import numpy as np, soundfile as sf
from kokoro import KPipeline
VOICE, SR, LEAD, TAIL = os.environ.get("VOICE", "af_heart"), 24000, 0.2, 0.3
OUT = os.environ.get("OUT", "video/ys/out/voice"); os.makedirs(OUT, exist_ok=True)
SAY_AS = [("YojanaSahay", "Yojana Sahay"), ("StudyLens", "Study Lens"), ("’", "'")]
pipe = KPipeline(lang_code="a")
letters = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
def synth(text):
    chunks, toks, off = [], [], 0.0
    for r in pipe(text, voice=VOICE, speed=0.96, split_pattern=r"\n+"):
        a = r.audio.detach().cpu().numpy() if hasattr(r.audio, "detach") else np.asarray(r.audio)
        for t in (r.tokens or []):
            st, en = getattr(t, "start_ts", None), getattr(t, "end_ts", None)
            toks.append((t.text, None if st is None else off + st, None if en is None else off + en))
        chunks.append(a); off += len(a) / SR
    return np.concatenate(chunks).astype(np.float32), toks, off
def word_times(caption, toks, total):
    stream, last = [], 0.0
    for text, st, en in toks:
        st = last if st is None else st; en = st if en is None else en; last = en
        for ch in letters(text): stream.append((ch, st, en))
    words, out, pos, ok = caption.split(" "), [], 0, True
    for w in words:
        need = letters(w)
        if not need: out.append(None); continue
        seg = stream[pos:pos + len(need)]
        if "".join(c for c, _, _ in seg) != need: ok = False; break
        out.append([seg[0][1], seg[-1][2]]); pos += len(need)
    if not ok: return None
    for k, v in enumerate(out):
        if v is None: out[k] = list(out[k - 1]) if k else [0.0, 0.0]
    return [[round(s + LEAD, 3), round(e + LEAD, 3)] for s, e in out]
manifest = []
for ln in json.load(open(os.environ.get("LINES", "video/ys/lines.json"))):
    said = ln.get("say") or ln["text"]
    for a, b in SAY_AS: said = said.replace(a, b)
    audio, toks, d = synth(said)
    raw = f"/tmp/{ln['id']}.wav"; sf.write(raw, audio, SR)
    final = os.path.join(OUT, ln["id"] + ".wav")
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af",
        f"highpass=f=80,deesser=i=0.35,equalizer=f=3200:t=q:w=1.2:g=1.6,acompressor=threshold=-21dB:ratio=2.2:attack=8:release=130,"
        f"adelay={int(LEAD*1000)},apad=pad_dur={TAIL},aresample=48000", "-ac", "1", "-ar", "48000", final])
    # time the caption's own words; if it is written differently from what is
    # said (the web address), time the spoken words and give the caption's last
    # word everything that was said from there on
    words = word_times(ln["text"], toks, d)
    if words is None:
        sw = word_times(said, toks, d)
        n = len(ln["text"].split(" "))
        words = sw[:n - 1] + [[sw[n - 1][0], sw[-1][1]]]
        print("  web address timed from the spoken words")
    secs = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final]))
    manifest.append({"id": ln["id"], "text": ln["text"], "file": ln["id"] + ".wav", "seconds": round(secs, 3), "words": words})
    print("made", ln["id"], round(secs, 2), "s")
json.dump({"voice": "kokoro/" + VOICE, "clips": manifest}, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
