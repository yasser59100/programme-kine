"""Voix off de la vidéo de présentation (voix de Yass, ElevenLabs).
La clé vient du secret GitHub ELEVENLABS_API_KEY : jamais affichée ni enregistrée."""
import base64, json, os, urllib.request, urllib.error
KEY = os.environ["ELEVENLABS_API_KEY"].strip()
VOICE = "AfbuxQ9DVtS4azaxN1W7"
API = "https://api.elevenlabs.io"
def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
        headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r: return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e: return e.code, e.read().decode("utf-8", "replace")[:300]
lines = [l.strip() for l in open("video/texte.txt", encoding="utf-8") if l.strip()]
st, sub = call("GET", "/v1/user/subscription")
print("abonnement", st, {k: sub.get(k) for k in ("character_count", "character_limit")} if st == 200 else sub)
log = {}
for take, settings in (("a", {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}),
                       ("b", {"stability": 0.32, "similarity_boost": 0.8, "style": 0.5, "use_speaker_boost": True})):
    out = []
    for i, t in enumerate(lines):
        body = {"text": t, "model_id": "eleven_multilingual_v2", "voice_settings": settings,
                "previous_text": " ".join(lines[max(0, i - 2):i]) or None, "next_text": " ".join(lines[i + 1:i + 3]) or None}
        st, d = call("POST", f"/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192", body)
        if st != 200:
            print("échec", take, i, st, d); continue
        f = f"video/voix_{take}_{i:02d}.mp3"
        open(f, "wb").write(base64.b64decode(d["audio_base64"]))
        out.append({"i": i, "t": t, "f": f, "al": d.get("alignment")})
        print("ok", take, i)
    log[take] = out
json.dump(log, open("video/voix.json", "w", encoding="utf-8"), ensure_ascii=False)
st, sub = call("GET", "/v1/user/subscription")
print("fin", {k: sub.get(k) for k in ("character_count", "character_limit")} if st == 200 else st)
