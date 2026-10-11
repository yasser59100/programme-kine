"""Test A/B : mots courts sans « euh » final et chiffres en français."""
import json, os, subprocess, time, urllib.request, urllib.error
KEY = os.environ["ELEVENLABS_API_KEY"].strip(); VOICE = "AfbuxQ9DVtS4azaxN1W7"; API = "https://api.elevenlabs.io"
def tts(text, model, settings, extra=None):
    body = {"text": text, "model_id": model, "voice_settings": settings}
    if model != "eleven_multilingual_v2": body["language_code"] = "fr"
    if extra: body.update(extra)
    req = urllib.request.Request(f"{API}/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", method="POST", data=json.dumps(body).encode(),
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return r.read()
    except urllib.error.HTTPError as e: print("ERR", e.code, e.read()[:200]); return None
PH = ["On monte", "On descend", "On tient", "Changez de côté", "Dernière !", "sept", "Tour un sur deux. Seize répétitions."]
BASE = {"stability": 0.38, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True}
CALM = {"stability": 0.6, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True}
V = {
 "A_actuel": ("eleven_multilingual_v2", BASE, None, lambda t: t),
 "B_point_final_plus_stable": ("eleven_multilingual_v2", CALM, None, lambda t: t if t[-1] in ".!?" else t + "."),
 "C_contexte_phrase": ("eleven_multilingual_v2", BASE, "ctx", lambda t: t if t[-1] in ".!?" else t + "."),
 "D_turbo_francais_force": ("eleven_turbo_v2_5", CALM, None, lambda t: t if t[-1] in ".!?" else t + "."),
}
os.makedirs("out", exist_ok=True)
for name, (model, st, ctx, fx) in V.items():
    lst = open(f"out/{name}.txt", "w")
    for i, t in enumerate(PH):
        extra = {"previous_text": "Très bien, on continue comme ça.", "next_text": "Et on recommence."} if ctx else None
        d = tts(fx(t), model, st, extra)
        if not d: continue
        f = f"out/{name}_{i}.mp3"; open(f, "wb").write(d)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f, "-af", "apad=pad_dur=0.9", "-ar", "44100", "-ac", "1", f"out/{name}_{i}.wav"], check=True)
        lst.write(f"file '{name}_{i}.wav'\n"); time.sleep(0.3)
    lst.close()
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"out/{name}.txt", "-b:a", "128k", f"out/ab_{name}.mp3"], check=True)
    print("ok", name)
