import glob
from faster_whisper import WhisperModel
m = WhisperModel("base.en", device="cpu", compute_type="int8")
for f in sorted(glob.glob("lab/*.mp3")):
    seg, info = m.transcribe(f, word_timestamps=False)
    print(f, round(info.duration, 1), "|", " ".join(s.text.strip() for s in seg), flush=True)
