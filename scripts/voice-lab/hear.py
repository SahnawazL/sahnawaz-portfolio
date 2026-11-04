import glob, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("base.en", device="cpu", compute_type="int8")
for f in sorted(glob.glob("lab/*.mp3")):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", f, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"])
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    seg, info = m.transcribe(a, word_timestamps=False)
    print(f, round(len(a) / 16000, 1), "|", " ".join(s.text.strip() for s in seg), flush=True)
