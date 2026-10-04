#!/usr/bin/env python3
"""Importe les enregistrements de voix (zip de enregistrer.html) dans assets/voix/.
Pour chaque phrase : silence coupé au début et à la fin, volume harmonisé, MP3 mono.
Usage : python3 tools/voix_import.py voix-kineforce.zip [autre.zip ...]
"""
import json, os, re, subprocess, sys, tempfile, unicodedata, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "voix")

def norm(t):  # identique à kfNorm() dans index.html
    t = unicodedata.normalize("NFC", t).lower().replace("’", "'")
    t = re.sub(r"[^a-zà-ÿœæç0-9' ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    return round(float(r.stdout.strip()), 3)

def convert(src, dst):
    """Blancs coupés par rapport au niveau de la voix (pas un seuil fixe), volume harmonisé, MP3 mono."""
    import numpy as np, soundfile as sf, io
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-af", "highpass=f=70", "-ac", "1", "-ar", "44100", "-f", "wav", "-"],
                         capture_output=True, check=True).stdout
    a, sr = sf.read(io.BytesIO(raw))
    w = int(sr * 0.01)
    if len(a) < w * 3: raise ValueError("vide")
    db = 20 * np.log10(np.array([np.sqrt(np.mean(a[i:i + w] ** 2)) + 1e-9 for i in range(0, len(a) - w, w)]))
    pk = db.max()
    if pk < -60: raise ValueError("silence")
    sp = np.where(db > max(pk - 32, -62))[0]
    i0 = max(0, (sp[0] - 5) * w)           # 50 ms avant le premier son
    i1 = min(len(a), (sp[-1] + 12) * w)    # 120 ms après le dernier
    seg = a[i0:i1]
    buf = io.BytesIO(); sf.write(buf, seg, sr, format="WAV")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "wav", "-i", "-",
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=7,afade=t=in:d=0.015,areverse,afade=t=in:d=0.04,areverse",
                    "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "56k", dst], input=buf.getvalue(), check=True)

def main(zips):
    os.makedirs(OUT, exist_ok=True)
    man_path = os.path.join(OUT, "manifest.json")
    man = json.load(open(man_path)) if os.path.exists(man_path) else {"clips": {}}
    clips = man.setdefault("clips", {})
    used = {c["f"] for c in clips.values()}
    n = 0
    for z in zips:
        with tempfile.TemporaryDirectory() as tmp:
            zipfile.ZipFile(z).extractall(tmp)
            index = json.load(open(os.path.join(tmp, "index.json")))
            for it in index:
                k = norm(it["text"])
                if not k: continue
                name = clips[k]["f"] if k in clips else None
                if not name:
                    i = 1
                    while f"v{i:03d}.mp3" in used: i += 1
                    name = f"v{i:03d}.mp3"; used.add(name)
                dst = os.path.join(OUT, name)
                try:
                    convert(os.path.join(tmp, it["file"]), dst)
                except Exception as e:
                    print("ignorée (" + str(e) + ") :", it["text"]); continue
                clips[k] = {"f": name, "d": dur(dst), "t": it["text"]}
                n += 1
    json.dump(man, open(man_path, "w"), ensure_ascii=False, indent=0)
    print(f"{n} phrases importées, {len(clips)} au total")

if __name__ == "__main__":
    main(sys.argv[1:])
