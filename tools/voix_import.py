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
    trim = ("silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.05,"
            "areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.08,areverse,"
            "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=7,"
            "afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-af", trim, "-ar", "44100", "-ac", "1",
                    "-c:a", "libmp3lame", "-b:a", "56k", dst], check=True)

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
                convert(os.path.join(tmp, it["file"]), dst)
                clips[k] = {"f": name, "d": dur(dst), "t": it["text"]}
                n += 1
    json.dump(man, open(man_path, "w"), ensure_ascii=False, indent=0)
    print(f"{n} phrases importées, {len(clips)} au total")

if __name__ == "__main__":
    main(sys.argv[1:])
