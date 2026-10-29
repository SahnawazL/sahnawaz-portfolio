"""Builds the 60-second tour's narration: one small MP3 per stop.

voice  : Microsoft neural voice (edge-tts), professional female, Indian English
bed    : a soft, original "tech" ambience generated here with ffmpeg (warm pad,
         gentle data pings) — no third-party music, nothing to license
output : audio/tour/step-<n>-<hash>.mp3 (mono, 24 kHz, 32 kbps — ~4 KB/s)
         audio/tour/manifest.json  [{ i, text, file, seconds, bytes }]
The tour only plays a clip whose text matches the caption exactly.
"""
import asyncio, hashlib, json, os, subprocess, sys
import edge_tts

VOICE = os.environ.get("TOUR_VOICE", "en-IN-NeerjaNeural")
RATE, PITCH = "+6%", "+0Hz"
OUT = "audio/tour"
# spoken form only (the caption on screen stays exactly as written)
SAY_AS = {"YojanaSahay": "Yojana Sahay", "StudyLens AI": "Study Lens A.I.", " AI ": " A.I. "}

steps = json.loads(subprocess.check_output(["node", "scripts/tour-voice/extract.mjs"]))
os.makedirs(OUT, exist_ok=True)

def spoken(t):
    t = " " + t + " "
    for a, b in SAY_AS.items(): t = t.replace(a, b)
    return t.strip()

def dur(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())

# warm A-minor-9 pad that breathes slowly + soft high "data" pings every 1.6 s
PAD = ("0.16*sin(2*PI*110*t)*(0.65+0.35*sin(2*PI*0.21*t))"
       "+0.11*sin(2*PI*164.81*t)*(0.6+0.4*sin(2*PI*0.17*t+1.3))"
       "+0.09*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.27*t+2.1))"
       "+0.05*sin(2*PI*329.63*t)*(0.5+0.5*sin(2*PI*0.13*t+0.7))"
       "+0.04*sin(2*PI*493.88*t)*(0.5+0.5*sin(2*PI*0.11*t+2.9))"
       "+0.030*sin(2*PI*1318.5*t)*exp(-9*mod(t,1.6))"
       "+0.018*sin(2*PI*1975.5*t)*exp(-14*mod(t+0.8,1.6))")

async def main():
    manifest = []
    keep = set()
    for s in steps:
        i, text = s["i"], s["say"]
        h = hashlib.sha1((VOICE + "|v3|" + text).encode()).hexdigest()[:8]
        name = f"step-{i + 1}-{h}.mp3"
        keep.add(name)
        final = os.path.join(OUT, name)
        if not os.path.exists(final):
            raw = f"/tmp/voice-{i}.mp3"
            await edge_tts.Communicate(spoken(text), VOICE, rate=RATE, pitch=PITCH).save(raw)
            d = dur(raw)
            lead, tail = 0.3, 0.75
            total = lead + d + tail
            subprocess.check_call([
                "ffmpeg", "-y", "-v", "error",
                "-i", raw,
                "-f", "lavfi", "-i", f"aevalsrc='{PAD}':s=24000:d={total:.2f}",
                "-filter_complex",
                # voice: gentle clean-up and presence; bed: soft, spacious, ducked well under the voice
                f"[0:a]aresample=24000,highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,adelay={int(lead*1000)},apad=pad_dur={tail}[v];"
                f"[1:a]lowpass=f=2600,aecho=0.8:0.6:120:0.25,volume=-19dB,afade=t=in:d=0.5,afade=t=out:st={total-0.9:.2f}:d=0.9[b];"
                "[v][b]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-17:TP=-1.5:LRA=9,aresample=24000",
                "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "32k", final])
            print(f"made {name}  {d:.1f}s voice")
        manifest.append({"i": i, "text": text, "file": name, "seconds": round(dur(final), 2), "bytes": os.path.getsize(final)})
    for f in os.listdir(OUT):   # clips for captions that no longer exist
        if f.endswith(".mp3") and f not in keep: os.remove(os.path.join(OUT, f))
    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        json.dump({"voice": VOICE, "clips": manifest}, fh, ensure_ascii=False, indent=1)
    print("total", sum(c["bytes"] for c in manifest) // 1024, "KB")

asyncio.run(main())
