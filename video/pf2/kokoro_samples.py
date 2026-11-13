# Same sample lines in two Kokoro voices, for comparison.
import json, os, subprocess, numpy as np, soundfile as sf
from kokoro import KPipeline
pipe = KPipeline(lang_code="a"); os.makedirs("video/pf2/out/samples", exist_ok=True)
L = {l["id"]: l["say"].replace("+", "") for l in json.load(open("video/pf2/lines.json"))}
for v in ("af_heart", "af_bella"):
    parts = []
    for k in ("hookQ", "brand", "dev", "buildQ"):
        for r in pipe(L[k].replace("ByteWithSahnawaz", "Byte With Sah-nawaz").replace("Xiaomi", "Sawmi").replace("Sahnawaz", "Sah-nawaz").replace("Ahmed", "Aah-med").replace("Laskar", "Lashkar"), voice=v, speed=1.0):
            parts.append(r.audio.detach().cpu().numpy() if hasattr(r.audio, "detach") else np.asarray(r.audio))
        parts.append(np.zeros(int(24000 * .5), np.float32))
    sf.write("/tmp/k.wav", np.concatenate(parts), 24000)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "/tmp/k.wav", "-b:a", "128k", f"video/pf2/out/samples/kokoro-{v}.mp3"], check=True)
