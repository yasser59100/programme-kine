"""Échantillons ElevenLabs : cherche des voix françaises dynamiques et génère les 5 phrases test.
La clé vient du secret GitHub ELEVENLABS_API_KEY et n'est jamais affichée."""
import json, os, subprocess, time, urllib.request, urllib.error, urllib.parse
KEY = os.environ["ELEVENLABS_API_KEY"].strip()
API = "https://api.elevenlabs.io"
log = {"steps": []}
def call(method, path, body=None, raw=False):
    req = urllib.request.Request(API + path, method=method, headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" if raw else "application/json"},
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            d = r.read(); return r.status, (d if raw else json.loads(d or b"{}"))
    except urllib.error.HTTPError as e:
        txt = e.read().decode("utf-8", "replace")[:400]; return e.code, txt
def note(*a): print(*a); log["steps"].append(" ".join(str(x) for x in a))

st, u = call("GET", "/v1/user/subscription")
if st == 200: note("abonnement", u.get("tier"), "caracteres", u.get("character_count"), "/", u.get("character_limit"))
else: note("abonnement ERREUR", st, u)

phrases = [l.strip() for l in open("tools/phrases_echantillon.txt", encoding="utf-8") if l.strip()]
cands = []; seen = set()
GENDERS = os.environ.get("GENRES", "male,female").split(",")
SEARCH = os.environ.get("RECHERCHE", "").split(",") if os.environ.get("RECHERCHE") else [""]
for gender in GENDERS:
    pool = []
    for term in SEARCH:
        params = {"page_size": 40, "language": "fr", "gender": gender, "sort": "usage_character_count_1y"}
        if term: params["search"] = term
        st, res = call("GET", "/v1/shared-voices?" + urllib.parse.urlencode(params))
        if st != 200: note("bibliotheque ERREUR", gender, term, st, res); continue
        note("voix fr", gender, term or "-", len(res.get("voices", [])))
        pool += res.get("voices", [])
    lively = [v for v in pool if any(w in (" ".join(str(v.get(k) or "") for k in ("descriptive", "description", "use_case", "name"))).lower()
                                  for w in ("energ", "dynam", "upbeat", "enthous", "excit", "motiv", "coach", "sport", "confident", "cheer", "pêch", "vivant", "fitness"))]
    n = 0
    for v in lively + pool:
        if v["voice_id"] in seen or v["voice_id"] in os.environ.get("EXCLURE", ""): continue
        seen.add(v["voice_id"]); cands.append(v); n += 1
        note("candidat", gender, v.get("name"), "|", v.get("accent"), "|", v.get("descriptive"), "|", v.get("use_case"))
        if n >= int(os.environ.get("PAR_GENRE", "3")): break

os.makedirs("out", exist_ok=True)
made = []
def tts(voice_id, text, model, out):
    body = {"text": text, "model_id": model, "language_code": "fr",
            "voice_settings": {"stability": 0.38, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True}}
    if model == "eleven_v3": body["voice_settings"] = {"stability": 0.5}
    st, d = call("POST", f"/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128", body, raw=True)
    if st == 200: open(out, "wb").write(d); return True, None
    return False, (st, d)
for v in cands:
    vid, name = v["voice_id"], v.get("name", "voix").split()[0].lower()
    import unicodedata
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    tag = ("h" if v.get("gender") == "male" else "f") + "_" + "".join(c for c in name if c.isalnum()) + "_" + vid[:4]
    ok, err = tts(vid, phrases[0], "eleven_multilingual_v2", f"out/{tag}_1.mp3")
    if not ok:
        note("voix pas directement utilisable", tag, err)
        st, r = call("POST", f"/v1/voices/add/{v['public_owner_id']}/{vid}", {"new_name": v.get("name", "voix")})
        note("ajout a la bibliotheque", tag, st, r if st != 200 else "ok")
        if st != 200: continue
        vid = r.get("voice_id", vid)
        ok, err = tts(vid, phrases[0], "eleven_multilingual_v2", f"out/{tag}_1.mp3")
        if not ok: note("echec", tag, err); continue
    for i, p in enumerate(phrases[1:], 2):
        ok, err = tts(vid, p, "eleven_multilingual_v2", f"out/{tag}_{i}.mp3")
        if not ok: note("echec phrase", tag, i, err)
        time.sleep(0.4)
    parts = [f"out/{tag}_{i}.mp3" for i in range(1, 6) if os.path.exists(f"out/{tag}_{i}.mp3")]
    lst = "out/list.txt"
    for pth in parts: subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", pth, "-af", "apad=pad_dur=0.8", "-ar", "44100", "-ac", "1", pth.replace(".mp3", "_p.wav")], check=True)
    open(lst, "w").write("".join(f"file '{os.path.basename(pth).replace('.mp3', '_p.wav')}'\n" for pth in parts))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-b:a", "128k", f"out/eleven_{tag}.mp3"], check=True)
    made.append({"fichier": f"eleven_{tag}.mp3", "nom": v.get("name"), "voice_id": vid, "genre": v.get("gender"), "accent": v.get("accent"), "style": v.get("descriptive"), "usage": v.get("use_case")})
    note("ok", tag)
log["voix"] = made
st, u = call("GET", "/v1/user/subscription")
if st == 200: note("apres: caracteres", u.get("character_count"), "/", u.get("character_limit"))
json.dump(log, open("out/eleven_log_" + time.strftime("%H%M%S") + ".json", "w"), ensure_ascii=False, indent=1)
