import time, sys, wave, numpy as np, os
from orpheus_cpp import OrpheusCpp
t0 = time.time()
o = OrpheusCpp(lang="en", n_gpu_layers=0, verbose=False)
print("load", round(time.time() - t0, 1), flush=True)
TEXT = "Honestly? I didn't expect that to work. <chuckle> But it did, and people actually loved it! <laugh> So, yeah, hmm, that's how it started."
os.makedirs("lab", exist_ok=True)
for v in ["leo", "dan", "zac", "tara"]:
    t = time.time()
    sr, a = o.tts(TEXT, options={"voice_id": v, "max_tokens": 2048})
    a = np.squeeze(np.asarray(a))
    dt = time.time() - t
    with wave.open(f"lab/{v}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.astype(np.int16).tobytes())
    print(v, "audio", round(len(a) / sr, 1), "s took", round(dt, 1), "s", "peak", int(np.abs(a).max()), flush=True)
