"""Génère la voix de Léo (ElevenLabs) pour toutes les phrases de tools/voix_textes.json.
Ne régénère pas ce qui existe déjà. La clé vient du secret GitHub ELEVENLABS_API_KEY (jamais affichée)."""
import hashlib, json, os, re, subprocess, sys, time, traceback, unicodedata, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
LOG = open("tools/voix_log.txt", "w", encoding="utf-8")
def say(*a):
    print(*a, flush=True); print(*a, file=LOG, flush=True)
KEY = os.environ["ELEVENLABS_API_KEY"].strip()
VOICE = os.environ.get("VOIX_ID", "AfbuxQ9DVtS4azaxN1W7")      # Léo
API = "https://api.elevenlabs.io"
DIR = "assets/voix/"
VERSION = 2   # v2 : nombres en lettres, point final, dit comme au milieu d'une phrase (moins de « euh » final)
from num2words import num2words   # obligatoire : sinon les chiffres seraient lus en anglais
def pour_tts(t):
    t = re.sub(r"\bJ(\d)\b", lambda m: "jour " + m.group(1), t)
    t = re.sub(r"\d+", lambda m: num2words(int(m.group(0)), lang="fr"), t)
    t = t.strip()
    if t and t[-1] not in ".!?…": t += "."
    return t
def a_refaire(t, c):
    return c.get("v") != VERSION and (len(t) <= 45 or re.search(r"\d", t))
def norm(t):  # identique à kfNorm() dans index.html
    t = unicodedata.normalize("NFC", str(t)).lower().replace("’", "'")
    t = re.sub(r"[^a-zà-ÿœæç0-9' ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()
def call(method, path, body=None, raw=False):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" if raw else "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            d = r.read(); return r.status, (d if raw else json.loads(d or b"{}"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:300]
    except Exception as e:
        return 0, str(e)
def main():
    global clips
    texts = json.load(open("tools/voix_textes.json", encoding="utf-8"))
    try: man = json.load(open(DIR + "manifest.json", encoding="utf-8"))
    except Exception: man = {}
    if man.get("voix") != VOICE: man = {"voix": VOICE, "clips": {}}
    clips = man["clips"]
    todo, seen = [], set()
    for it in texts:
        k = norm(it["t"])
        if not k or k in seen: continue
        seen.add(k)
        if k in clips and os.path.exists(DIR + clips[k]["f"]) and not a_refaire(it["t"], clips[k]) and not clips[k].get("a"): continue   # « a » : provisoire (ancienne phrase au vouvoiement)
        todo.append((k, it["t"], it.get("g", "seance")))
    st, sub = call("GET", "/v1/user/subscription")
    say("abonnement", st, sub if st != 200 else {k: sub.get(k) for k in ("tier", "character_count", "character_limit")})
    left = (sub.get("character_limit", 0) - sub.get("character_count", 0)) if st == 200 else 0
    need = sum(len(t) for _, t, _ in todo)
    say(f"à générer : {len(todo)} phrases, {need} caractères ; reste sur l'abonnement : {left}")
    MAX = int(os.environ.get("MAX_CARACTERES", "0") or 0) or left - 300
    budget = {"n": 0}
    fails = []
    def one(job):
        try: return one_(job)
        except Exception as e:
            fails.append((job[1], "erreur", repr(e)[:300])); return None
    def one_(job):
        k, t, g = job
        if budget["n"] + len(t) > MAX: fails.append((t, "budget")); return None
        budget["n"] += len(t)
        body = {"text": pour_tts(t), "model_id": "eleven_multilingual_v2",
                "previous_text": "Très bien, on continue comme ça.", "next_text": "Et on recommence.",
                "voice_settings": {"stability": 0.38, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True}}
        for attempt in range(4):
            st, d = call("POST", f"/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", body, raw=True)
            if st == 200: break
            if st in (429, 500, 502, 503, 0): time.sleep(3 * (attempt + 1)); continue
            fails.append((t, st, d)); return None
        else:
            fails.append((t, "réessais épuisés")); return None
        f = "l%d_" % VERSION + hashlib.sha1(k.encode()).hexdigest()[:10] + ".mp3"   # nouveau nom : jamais confondu avec l'ancien en cache
        tmp = f"/tmp/{f}"
        open(tmp, "wb").write(d)
        # silences coupés au début et à la fin, volume harmonisé, fichier léger (mono 24 kHz, 48 kb/s)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp, "-af",
            "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ac", "1", "-ar", "24000", "-b:a", "48k", DIR + f], check=True)
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", DIR + f]).decode().strip() or 1)
        return k, {"f": f, "d": round(dur, 3), "t": t, "g": g, "v": VERSION}
    with ThreadPoolExecutor(3) as ex:
        for i, r in enumerate(ex.map(one, todo)):
            if r:
                old = clips.get(r[0])
                if old and old["f"] != r[1]["f"] and os.path.exists(DIR + old["f"]): os.remove(DIR + old["f"])
                clips[r[0]] = r[1]
            if i % 50 == 0: say(i, "/", len(todo))
    json.dump(man, open(DIR + "manifest.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(fails, open("tools/voix_echecs.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    st, sub = call("GET", "/v1/user/subscription")
    say("fini :", len(clips), "phrases dans l'appli ;", len(fails), "échecs ; caractères utilisés", sub.get("character_count") if st == 200 else sub, "/", sub.get("character_limit") if st == 200 else "?")


try:
    main()
except Exception:
    say(traceback.format_exc())
    raise
