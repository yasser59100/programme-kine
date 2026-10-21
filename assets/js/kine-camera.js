/* ═══════════ KinéForce — Mon mouvement à la caméra (essai) ═══════════
   La caméra du téléphone repère les grandes articulations (épaules, hanches, genoux, chevilles…),
   dessine la silhouette par-dessus l'image, compte les répétitions (ou chronomètre une tenue) et vérifie le mouvement.
   Yass guide à voix haute ; la série peut être revue en replay. Tout se passe sur le téléphone : rien n'est envoyé.
   Exercices : squat, fente avant, pont de hanche, assis-debout de chaise, pompes sur genoux, équilibre sur une jambe, planche, chaise contre le mur.
   Détection : MediaPipe Pose Landmarker (Google, licence Apache 2.0), fichiers hébergés avec l'appli (assets/pose). */
(function () {
  "use strict";
  var BASE = "assets/pose/";
  var I = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28, lHe: 29, rHe: 30, lToe: 31, rToe: 32 };
  var BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]];
  var JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // Yass parle même si la voix des séances est coupée (bouton haut-parleur propre à la caméra)
  function muted() { return !!jget("kf-cam-mute", 0); }
  // iPhone : allumer la caméra « interrompt » le son de la page. On le relance (et le son muet qui contourne le bouton silencieux).
  function audioUp() {
    var c = null; try { c = typeof getAudioCtx === "function" ? getAudioCtx() : null; } catch (e) {}
    if (c && c.state !== "running") { try { var r = c.resume(); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
    try { if (window.kfSilentEl && kfSilentEl.paused) { var p = kfSilentEl.play(); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
    return !c || c.state === "running";
  }
  function sndTip(show) {
    var st = $("kcam-stage"), tip = $("kcam-sndtip"); if (!st) return;
    if (!show) { if (tip) tip.remove(); return; }
    if (tip || muted()) return;
    tip = document.createElement("button"); tip.id = "kcam-sndtip"; tip.type = "button"; tip.className = "kcam-sndtip";
    tip.innerHTML = sndIc(false) + "<span><b>Tu n'entends pas Yass ?</b>Touche ici pour activer sa voix. Vérifie aussi le volume.</span>";
    tip.onclick = function () { audioUp(); setTimeout(function () { if (audioUp()) { sndTip(false); say("Bien !"); } }, 250); };
    st.appendChild(tip);
  }
  function audioWatch() {
    [300, 900, 2000].forEach(function (ms) { setTimeout(function () { if (!S) return; var ok = audioUp(); if (ms === 2000 && !ok) sndTip(true); else if (ok) sndTip(false); }, ms); });
    try { var c = getAudioCtx(); if (c && !c.__kcamWatch) { c.__kcamWatch = 1; c.addEventListener("statechange", function () { if (!S) return; if (c.state === "running") sndTip(false); else { audioUp(); setTimeout(function () { if (S && !audioUp()) sndTip(true); }, 800); } }); } } catch (e) {}
  }
  function say(t, prio) {
    if (typeof speak !== "function" || muted() || !t) return;
    audioUp();
    var a = window.seqSoundOn, b = window.seqVoiceOn;
    try { window.seqSoundOn = true; window.seqVoiceOn = true; speak(t, { prio: prio || 1, now: true, ttl: 3500 }); } catch (e) {}
    window.seqSoundOn = a; window.seqVoiceOn = b;
  }

  /* ── Chargement du détecteur (une seule fois) ── */
  var detP = null;
  function detector() {
    if (detP) return detP;
    detP = import(new URL(BASE + "vision_bundle.mjs", location.href).href).then(function (Vb) {
      return Vb.FilesetResolver.forVisionTasks(new URL(BASE + "wasm", location.href).href).then(function (files) {
        var opts = function (dlg) { return { baseOptions: { modelAssetPath: new URL(BASE + "pose_landmarker_lite.task", location.href).href, delegate: dlg },
                                              runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }; };
        return Vb.PoseLandmarker.createFromOptions(files, opts("GPU")).catch(function () { return Vb.PoseLandmarker.createFromOptions(files, opts("CPU")); });
      });
    });
    detP.catch(function () { detP = null; });
    return detP;
  }

  /* ── Géométrie ── */
  var asp = 1;   // largeur / hauteur de l'image : les points sont convertis dans un repère non déformé
  function P(lm, i) { var p = lm[i]; return { x: p.x * asp, y: p.y, v: p.visibility == null ? 1 : p.visibility }; }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) }; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function angle(a, b, c) {   // angle en b, en degrés
    var v1x = a.x - b.x, v1y = a.y - b.y, v2x = c.x - b.x, v2y = c.y - b.y;
    var d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y); if (!d) return 180;
    return Math.acos(Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / d))) * 180 / Math.PI;
  }
  function tilt(top, bottom) { return Math.abs(Math.atan2(top.x - bottom.x, bottom.y - top.y) * 180 / Math.PI); }   // écart à la verticale
  function slope(a, b) { return Math.abs(Math.atan2(a.y - b.y, Math.abs(a.x - b.x) || 1e-6) * 180 / Math.PI); }    // écart à l'horizontale
  // Hauteur d'un point au-dessus de la droite a → b, rapportée à la longueur a → b (> 0 : au-dessus)
  function above(p, a, b) {
    var dx = b.x - a.x; if (Math.abs(dx) < 1e-4) return 0;
    var yl = a.y + (b.y - a.y) * (p.x - a.x) / dx;
    return (yl - p.y) / Math.max(0.02, dist(a, b));
  }
  // Le genou part-il vers l'intérieur (vers le milieu du bassin) par rapport à la droite hanche → cheville ?
  function inward(h, k, a, pelvisMid, hipW) {
    var t = (k.y - h.y) / Math.max(0.01, a.y - h.y), lineX = h.x + (a.x - h.x) * t;
    return (k.x - lineX) * (pelvisMid.x > h.x ? 1 : -1) / Math.max(0.02, hipW);
  }

  /* ── Les phrases de Yass (voix enregistrées) et les textes à l'écran ── */
  var V = {
    stand: "Reste debout, immobile, quelques secondes.", far: "Recule un peu, je dois voir tout ton corps.",
    side: "Place-toi de profil, s'il te plaît.", front: "Place-toi face à la caméra, s'il te plaît.",
    good: ["Bien !", "Très bien !", "Parfait !", "Propre !"], shallow: "Un peu plus bas, si ça ne fait pas mal.",
    end: "Série terminée, bravo ! Regarde ton replay.", target: "Objectif atteint, bravo !",
    fast: "Descends plus lentement.", abrupt: "Remonte en contrôlant.", fastUp: "Monte en contrôlant.", hold: "Tiens une seconde en haut.",
    valgus: "Genoux vers l'extérieur !", shift: "Le poids bien au milieu !", lean: "Poitrine haute !", heel: "Talons au sol !",
    lean2: "Buste droit !", knee: "Genou dans l'axe du pied !", pelvis: "Bassin bien horizontal !", sway: "Reste bien droit !",
    low: "Monte les hanches plus haut !", arch: "Ne cambre pas, serre les fessiers !",
    high: "Fesses trop hautes !", sag: "Le bassin s'affaisse, rentre le ventre !",
    hands: "Sans les mains, croise les bras !", partial: "Redresse-toi complètement en haut.", plop: "Assieds-toi en douceur.",
    chest: "Descends la poitrine plus bas.", wallUp: "Descends un peu, cuisses à l'horizontale.", wallLow: "Remonte un peu, genoux à angle droit.",
    att: { valgus: "Attention aux genoux.", shift: "Attention à l'équilibre.", lean: "Attention au buste.", heel: "Attention aux talons.",
           lean2: "Attention au buste.", knee: "Attention au genou.", pelvis: "Attention au bassin.", low: "Attention à la hauteur.", arch: "Attention au dos.",
           fast: "Descends plus lentement.", abrupt: "Remonte en contrôlant.", fastUp: "Monte en contrôlant.", hold: "Tiens une seconde en haut.",
           hands: "Sans les mains.", partial: "Redresse-toi complètement.", plop: "Assieds-toi en douceur.", sag: "Attention au bassin.", high: "Attention au bassin." }
  };
  var MSG = {
    stand: "Tiens-toi debout, immobile.", far: "Recule un peu : il faut voir tout le corps, de la tête aux pieds.",
    side: "Place-toi de profil par rapport au téléphone.", front: "Place-toi face au téléphone.",
    good: ["Bien !", "Très bien !", "Parfait, continue.", "Propre !"], shallow: "Bien. Si c'est sans douleur, tu peux descendre un peu plus.",
    valgus: "Les genoux rentrent vers l'intérieur. Pousse-les vers l'extérieur, dans l'axe des pieds.",
    shift: "Tu te décales sur un côté. Répartis le poids sur les deux jambes.",
    lean: "Le buste part trop en avant. Garde la poitrine plus haute.", heel: "Les talons se décollent. Garde-les bien au sol.",
    lean2: "Le buste penche. Garde-le bien droit, au-dessus du bassin.", knee: "Le genou rentre vers l'intérieur. Garde-le dans l'axe du pied.",
    pelvis: "Le bassin penche d'un côté. Garde-le bien horizontal.", sway: "Le buste penche sur le côté. Reste bien droit.",
    low: "Les hanches ne montent pas assez. Monte jusqu'à aligner épaules, hanches et genoux.",
    arch: "Le dos se cambre en haut. Serre les fessiers plutôt que de creuser le dos.",
    high: "Les fesses sont trop hautes. Descends-les jusqu'à faire une ligne droite.",
    sag: "Le bassin s'affaisse. Rentre le ventre et serre les fessiers.",
    fast: "La descente est trop rapide. Descends en 2 secondes environ.", abrupt: "La remontée est brusque. Remonte en contrôlant.",
    fastUp: "La montée est trop rapide. Monte en contrôlant.", hold: "Marque une petite pause en haut avant de redescendre.",
    hands: "Tu pousses sur les mains. Croise les bras sur la poitrine et lève-toi avec les jambes.",
    partial: "Tu ne te redresses pas complètement. Tends les hanches et les genoux en haut.",
    plop: "Tu te laisses tomber sur la chaise. Assieds-toi en douceur, en 2 secondes.",
    chest: "La poitrine ne descend pas assez. Plie les coudes un peu plus, si c'est sans douleur.",
    wallUp: "Tu es trop haut. Descends jusqu'à avoir les cuisses à l'horizontale.",
    wallLow: "Tu es trop bas. Remonte un peu, genoux à angle droit."
  };
  var FIX = { valgus: "genoux qui rentrent", shift: "décalage sur un côté", lean: "buste trop penché", heel: "talons qui se décollent",
              lean2: "buste penché", knee: "genou qui rentre", pelvis: "bassin qui penche", sway: "buste qui penche", low: "hanches pas assez hautes",
              arch: "dos cambré", high: "fesses trop hautes", sag: "bassin qui s'affaisse", fast: "descente trop rapide", abrupt: "remontée brusque",
              fastUp: "montée trop rapide", hold: "pas de pause en haut", hands: "appui sur les mains", partial: "pas complètement redressé",
              plop: "assis trop vite", chest: "poitrine pas assez basse", wallUp: "pas assez descendu", wallLow: "trop descendu" };
  // Défauts qui colorent la silhouette en rouge
  var MARK = { hands: ["hands"], valgus: ["lKn", "rKn"], lean: ["trunk"], lean2: ["trunk"], sway: ["trunk"], pelvis: ["hips"], low: ["hips"], arch: ["hips"], high: ["hips"], sag: ["hips"] };

  /* ── Les exercices suivis ── */
  var PROF = {
    squat: { title: "Squat", mode: "reps", views: "both", calib: "stand", go: "C'est bon, je te vois. Fais tes squats, à ton rythme.", tempo: true,
      steps: ["<strong>De face</strong> : Yass surveille les genoux et l'équilibre.", "<strong>De profil</strong> : le buste, les talons, la profondeur et le rythme."],
      tip: { face: "de profil pour vérifier le buste, les talons et le rythme.", profil: "de face pour vérifier les genoux." } },
    fente: { title: "Fente avant", mode: "reps", views: "both", calib: "stand", go: "C'est bon, je te vois. Fais tes fentes, à ton rythme.", tempo: true,
      steps: ["<strong>De profil</strong> : Yass surveille le buste, la profondeur et le rythme.", "<strong>De face</strong> : le genou de devant et le bassin."],
      tip: { face: "de profil pour vérifier le buste et le rythme.", profil: "de face pour vérifier le genou et le bassin." } },
    pont: { title: "Pont de hanche", mode: "reps", views: "profil", calib: "lie", calibSay: "Allonge-toi sur le dos, genoux pliés, de profil.",
      go: "C'est bon, je te vois. Monte les hanches, à ton rythme.", tempo: true,
      steps: ["Allonge-toi sur le dos, genoux pliés, <strong>de profil</strong> par rapport au téléphone, posé au sol à 2 mètres.", "Yass vérifie la hauteur des hanches, le dos et la pause en haut."],
      tip: {} },
    unipodal: { title: "Équilibre sur une jambe", mode: "hold", views: "face", calib: "stand", calibSay: "Reste debout, face à la caméra.",
      go: "Lève un pied, je lance le chrono.", sides: true, target: 30,
      steps: ["Debout <strong>face</strong> au téléphone. Le chrono tourne seulement quand un pied est levé.", "Yass surveille le bassin, le genou d'appui et le buste."],
      tip: {} },
    planche: { title: "Planche", mode: "hold", views: "profil", calib: "none", calibSay: "Mets-toi en planche, de profil.",
      go: "C'est parti, tiens la position.", target: 30,
      steps: ["En planche <strong>de profil</strong> par rapport au téléphone, posé au sol à 2 mètres.", "Le chrono ne tourne que si le corps est bien aligné."],
      tip: {} },
    assis: { title: "Assis-debout de chaise", mode: "reps", views: "profil", calib: "sit", calibSay: "Assieds-toi sur la chaise, de profil, et reste immobile.",
      go: "C'est bon, je te vois. Lève-toi, puis rassieds-toi, à ton rythme.",
      steps: ["Chaise <strong>de profil</strong> par rapport au téléphone, bras croisés sur la poitrine.", "Yass compte les relevers, vérifie que tu ne pousses pas sur les mains, que tu te redresses en entier et que tu te rassieds en douceur."],
      tip: {} },
    pompes: { title: "Pompes sur genoux", mode: "reps", views: "profil", calib: "none", calibSay: "Mets-toi en position, sur les genoux, de profil.",
      go: "C'est parti, fais tes pompes à ton rythme.",
      steps: ["Sur les genoux, mains sous les épaules, <strong>de profil</strong> par rapport au téléphone, posé au sol à 2 mètres.", "Yass compte les pompes, vérifie que la poitrine descend assez et que le corps reste bien droit."],
      tip: {} },
    chaise: { title: "Chaise contre le mur", mode: "hold", views: "profil", calib: "none", calibSay: "Dos au mur, descends en position, de profil.",
      go: "C'est parti, tiens la position.", target: 30,
      steps: ["Dos au mur, <strong>de profil</strong> par rapport au téléphone.", "Le chrono ne tourne que si les genoux sont à peu près à angle droit, cuisses à l'horizontale."],
      tip: {} }
  };
  PROF.bilan = { title: "Bilan de mobilité", mode: "bilan", views: "both", calib: "none", steps: [], tip: {} };
  var ORDER = ["squat", "fente", "assis", "pont", "pompes", "unipodal", "planche", "chaise"];
  // Exercices de la séance et de la bibliothèque qui peuvent être vérifiés à la caméra
  var EX_MAP = {
    "Squat bilatéral": "squat", "Squat sumo": "squat", "Goblet squat": "squat", "Squat ballon dans le dos contre le mur": null,
    "Fentes avant unilatérales": "fente", "Fente arrière": "fente", "Fente avec charge": "fente",
    "Pont de hanche": "pont", "Pont fessier unilatéral": "pont", "Pont avec ballon entre les genoux": "pont",
    "Équilibre unipodal": "unipodal", "Unipodal yeux fermés": "unipodal",
    "Plank — gainage avant-bras": "planche", "Gainage frontal sur genoux": "planche",
    "Assis-debout de chaise": "assis", "Pompes sur genoux": "pompes", "Chaise contre le mur": "chaise",
    "Pont ischio-jambiers talons sur chaise": "pont"
  };

  /* ── État de l'analyse ── */
  var A = null, PR = null, OPT = {};
  function resetAnalysis() {
    A = { phase: "calib", still: 0, stillT: 0, base: null, view: PR && PR.views === "profil" ? "profil" : "face", viewVotes: 0,
          down: false, maxD: 0, minKnee: 180, flags: {}, cued: {}, nf: 0, reps: 0, good: 0, log: [], smooth: null, live: {},
          hold: { t: 0, side: { l: 0, r: 0 }, inPose: false, outT: 0, touch: 0, goodT: 0, said10: { l: 0, r: 0, x: 0 }, lastT: 0, lastCue: {}, done: false, cnt: {} } };
  }
  function smooth(lm) {
    if (!A.smooth) { A.smooth = lm.map(function (p) { return { x: p.x, y: p.y, z: p.z, visibility: p.visibility }; }); return A.smooth; }
    for (var i = 0; i < lm.length; i++) { var s = A.smooth[i], p = lm[i], k = 0.55; s.x += (p.x - s.x) * k; s.y += (p.y - s.y) * k; s.visibility = p.visibility; }
    return A.smooth;
  }
  // Tout le corps d'au moins un côté doit être visible (de profil, l'autre côté est caché)
  function visible(lm) {
    var ok = function (ids) { for (var i = 0; i < ids.length; i++) if ((lm[ids[i]].visibility || 0) < 0.5) return false; return true; };
    return ok([11, 23, 25, 27]) || ok([12, 24, 26, 28]);
  }

  // Tout ce dont les analyses ont besoin, calculé une fois par image
  function context(lm) {
    var L = {};
    ["nose", "lSh", "rSh", "lEl", "rEl", "lWr", "rWr", "lHip", "rHip", "lKn", "rKn", "lAn", "rAn", "lHe", "rHe", "lToe", "rToe"].forEach(function (k) { L[k] = P(lm, I[k]); });
    var c = { L: L, hip: mid(L.lHip, L.rHip), sh: mid(L.lSh, L.rSh), an: mid(L.lAn, L.rAn) };
    c.hipW = Math.max(0.02, Math.abs(L.lHip.x - L.rHip.x));
    // Côté proche du téléphone : choisi sur plusieurs articulations et gardé tant que l'autre n'est pas nettement plus visible
    // (de profil, le côté du fond est caché : ses points sont devinés et ne doivent jamais servir aux corrections)
    var vis = function (sd) { return ["Hip", "Kn", "An", "He", "Toe"].reduce(function (a, k) { return a + (lm[I[sd + k]].visibility || 0); }, 0) / 5; };
    var vl = vis("l"), vr = vis("r");
    if (!A.nearSide || (A.nearSide === "l" ? vr - vl : vl - vr) > 0.25) A.nearSide = vl >= vr ? "l" : "r";
    c.near = A.nearSide; c.nearVis = function (k) { return lm[I[c.near + k]].visibility || 0; };
    var n = c.near; c.N = { sh: L[n + "Sh"], el: L[n + "El"], wr: L[n + "Wr"], hip: L[n + "Hip"], kn: L[n + "Kn"], an: L[n + "An"], he: L[n + "He"], toe: L[n + "Toe"] };
    c.elbow = angle(c.N.sh, c.N.el, c.N.wr);
    c.kL = angle(L.lHip, L.lKn, L.lAn); c.kR = angle(L.rHip, L.rKn, L.rAn);
    c.kNear = n === "l" ? c.kL : c.kR;
    var shW = Math.abs(L.lSh.x - L.rSh.x), torso = dist(c.sh, c.hip);
    // De face ou de profil : épaules étroites par rapport au tronc → de profil (allongé : le tronc est horizontal, même règle)
    var prof = shW / Math.max(0.01, torso) < 0.42;
    A.viewVotes = Math.max(-15, Math.min(15, A.viewVotes + (prof ? 1 : -1)));
    A.view = A.viewVotes > 4 ? "profil" : A.viewVotes < -4 ? "face" : A.view;
    c.leg = A.view === "profil" ? dist(c.N.hip, c.N.an) : (dist(L.lHip, L.lAn) + dist(L.rHip, L.rAn)) / 2;
    c.knee = A.view === "profil" ? c.kNear : Math.min(c.kL, c.kR);
    c.facing = c.L.nose.x > c.sh.x ? 1 : -1;   // de profil : sens dans lequel regarde le patient
    return c;
  }
  function flag(k) { A.flags[k] = (A.flags[k] || 0) + 1; (MARK[k] || []).forEach(function (m) { A.live[m] = 1; }); }

  /* Contrôles image par image, propres à chaque exercice */
  var CHECK = {
    squat: function (c) {
      var L = c.L;
      if (A.view === "face") {
        var kas = Math.abs(L.lKn.x - L.rKn.x) / Math.max(0.02, Math.abs(L.lAn.x - L.rAn.x));
        if (kas < 0.75) flag("valgus");
        if (Math.abs(c.hip.x - c.an.x) / c.hipW > 0.45) flag("shift");
      } else {
        var trunk = tilt(c.N.sh, c.N.hip), tibia = tilt(c.N.kn, c.N.an);
        if (trunk > tibia + 28 && trunk > 45) flag("lean");
        // Talon décollé : seulement si talon et pointe du pied proche sont bien vus, que la pointe reste au sol
        // et que ça dure plusieurs images (jamais sur le pied du fond, qui est caché)
        var seen = c.nearVis("He") > 0.75 && c.nearVis("Toe") > 0.75 && A.base.side === c.near;
        var lift = seen ? (A.base.heelY - c.N.he.y) / A.base.leg : 0, toeStill = seen && Math.abs(c.N.toe.y - A.base.toeY) / A.base.leg < 0.03;
        A.heelN = seen && toeStill && lift > 0.06 ? (A.heelN || 0) + 1 : 0;
        if (A.heelN >= 6) { flag("heel"); A.live[c.near + "He"] = 1; }
      }
    },
    fente: function (c) {
      var L = c.L;
      if (A.view === "face") {
        var f = L.lAn.y > L.rAn.y ? "l" : "r";   // le pied de devant est plus bas dans l'image (plus près du téléphone)
        if (inward(L[f + "Hip"], L[f + "Kn"], L[f + "An"], c.hip, c.hipW) > 0.3) { flag("knee"); A.live[f + "Kn"] = 1; }
        if (slope(L.lHip, L.rHip) > 9) flag("pelvis");
      } else if (tilt(c.sh, c.hip) > 22) flag("lean2");
    },
    pont: function (c) { if (above(c.N.hip, c.N.sh, c.N.kn) > 0.12) flag("arch"); },
    // Assis-debout : les mains ne doivent pas pousser sur les cuisses ou les genoux pendant le relever
    assis: function (c) {
      if ((A.base.y - c.hip.y) / Math.max(0.05, A.base.leg) > 0.3) return;   // seulement pendant le décollage de la chaise
      var L = c.L, near = function (w) { return Math.min(dist(w, c.N.kn), dist(w, mid(c.N.hip, c.N.kn))) < 0.18 * c.leg; };
      if ((L.lWr.v > 0.7 && near(L.lWr)) || (L.rWr.v > 0.7 && near(L.rWr))) flag("hands");   // poignet bien vu, pas deviné derrière le corps
    },
    // Pompes : le corps reste droit des épaules aux genoux
    pompes: function (c) { var dev = above(c.N.hip, c.N.sh, c.N.kn); if (dev < -0.1) flag("sag"); else if (dev > 0.14) flag("high"); }
  };
  // Profondeur du mouvement (0 au repos)
  function depth(c) {
    // Pont : hauteur des hanches (en longueurs de cuisse) ou rapprochement de la ligne épaule-genou, le plus net des deux
    if (PR === PROF.assis) return (A.base.y - c.hip.y) / Math.max(0.05, A.base.leg);     // le bassin monte en se levant
    if (PR === PROF.pompes) return (180 - c.elbow) / 90;                                    // 0 bras tendus, 1 coudes à 90°
    if (PR === PROF.pont) return Math.max((A.base.y - c.hip.y) / Math.max(0.05, A.base.thigh), (above(c.N.hip, c.N.sh, c.N.kn) - A.base.dev) * 2);
    return (c.hip.y - A.base.y) / Math.max(0.05, A.base.leg);
  }

  function analyse(lm, now) {
    var c = context(lm); A.live = {};
    if (PR.mode === "bilan") return bilanStep(c, lm, now);
    // Vue imposée par l'exercice
    if (PR.views !== "both" && A.view !== PR.views && A.viewVotes !== 0 && Math.abs(A.viewVotes) > 6) {
      if (now - (A.viewSaid || 0) > 8000) { A.viewSaid = now; return { msg: MSG[PR.views === "profil" ? "side" : "front"], voice: V[PR.views === "profil" ? "side" : "front"], cls: "warn" }; }
      return null;
    }
    if (A.phase === "calib") return calibrate(c, now);
    return PR.mode === "hold" ? holdStep(c, now) : repStep(c, now);
  }

  function calibrate(c, now) {
    var ok = false;
    if (PR.calib === "stand") ok = c.knee > 158 && (PR !== PROF.unipodal || Math.abs(c.L.lAn.y - c.L.rAn.y) < 0.05 * c.leg);
    else if (PR.calib === "sit") ok = c.kNear < 125 && c.kNear > 60 && slope(c.N.hip, c.N.kn) < 35;   // assis, cuisses à peu près horizontales
    else if (PR.calib === "lie") ok = slope(c.N.sh, c.N.hip) < 30 && c.kNear < 140;   // allongé, genoux pliés
    else ok = true;
    if (ok) {
      A.still++; if (!A.stillT) A.stillT = now;
      if (A.base && A.base.side !== c.near) A.base = null;   // changement de côté : on repart d'une base propre à ce côté
      var b = A.base || (A.base = { side: c.near, y: c.hip.y, leg: c.leg, heelY: c.N.he.y, toeY: c.N.toe.y, thigh: dist(c.N.hip, c.N.kn), dev: above(c.N.hip, c.N.sh, c.N.kn) });
      b.y = b.y * 0.8 + c.hip.y * 0.2; b.leg = b.leg * 0.8 + c.leg * 0.2; b.heelY = b.heelY * 0.8 + c.N.he.y * 0.2; b.toeY = b.toeY * 0.8 + c.N.toe.y * 0.2; b.thigh = b.thigh * 0.8 + dist(c.N.hip, c.N.kn) * 0.2; b.dev = b.dev * 0.8 + above(c.N.hip, c.N.sh, c.N.kn) * 0.2;
    } else { A.still = 0; A.stillT = 0; }
    if (PR.calib === "none" || (A.still >= 3 && now - A.stillT > 1000)) { A.phase = "run"; A.hold.lastT = now; return PR.calib === "none" ? null : { msg: PR.go, voice: PR.go }; }
    if (!A.calibSaid) { A.calibSaid = 1; return { msg: PR.calib === "lie" ? "Allonge-toi sur le dos, genoux pliés, de profil." : PR.calib === "sit" ? "Assieds-toi sur la chaise, de profil, bras croisés." : MSG.stand, voice: PR.calibSay || V.stand }; }
    return null;
  }

  /* Répétitions : squat, fente, pont */
  function repStep(c, now) {
    var d = depth(c), START = PR === PROF.pont ? 0.14 : PR === PROF.pompes ? 0.42 : PR === PROF.assis ? 0.18 : 0.16, END = PR === PROF.pompes ? 0.22 : 0.07;
    if (!A.down && A.base && d < END * 0.7 && c.knee > 160 && PR !== PROF.pont && PR !== PROF.assis && PR !== PROF.pompes) { A.base.y = A.base.y * 0.95 + c.hip.y * 0.05; A.base.leg = A.base.leg * 0.95 + c.leg * 0.05; }
    if (d > START * 0.85 && CHECK[PRID]) CHECK[PRID](c);
    if (!A.down && d > START) { A.down = true; A.maxD = d; A.tStart = now; A.tPeak = now; A.minKnee = c.knee; A.maxKnee = c.knee; A.minElbow = c.elbow; A.flags = {}; A.cued = {}; A.nf = 0; A.peakT = 0; A.lastNow = now; }
    if (A.down) {
      A.nf++;
      if (d > A.maxD) { A.maxD = d; A.tPeak = now; if (PR === PROF.pont) A.topDev = above(c.N.hip, c.N.sh, c.N.kn); }
      if (d >= A.maxD - (PR === PROF.pont ? 0.08 : 0.03)) A.peakT += now - A.lastNow;   // temps passé tout en bas (ou tout en haut pour le pont)
      A.lastNow = now;
      A.minKnee = Math.min(A.minKnee, PR === PROF.fente && A.view === "profil" ? frontKnee(c) : c.knee);
      A.maxKnee = Math.max(A.maxKnee || 0, c.knee); A.minElbow = Math.min(A.minElbow == null ? 180 : A.minElbow, c.elbow);
      for (var fk in A.flags) if (A.flags[fk] >= 2 && !A.cued[fk]) { A.cued[fk] = 1; return { msg: V[fk], voice: V[fk], live: true, cls: "bad" }; }
    }
    if (A.down && d < END) {
      A.down = false; A.reps++;
      var need = Math.max(2, Math.round(A.nf * 0.25)), fl = A.flags;   // défaut retenu s'il est vu sur au moins un quart de la répétition
      var faults = Object.keys(fl).filter(function (k) { return fl[k] >= need; });
      var down = A.tPeak - A.tStart, up = now - A.tPeak, deep = true;
      if (PR === PROF.assis) {
        if ((A.maxKnee || 0) < 152) faults.push("partial");
        if (A.nf >= 5 && up < 400) faults.push("plop");          // retour sur la chaise trop rapide
      } else if (PR === PROF.pompes) {
        deep = A.minElbow < 105;
        if (!deep) faults.push("chest");
      } else if (PR === PROF.pont) {
        if ((A.topDev || 0) < -0.06) faults.push("low");
        if (A.nf >= 5 && down < 350) faults.push("fastUp");   // le rythme n'est jugé qu'avec assez d'images
        if (A.nf >= 5 && A.peakT < 450) faults.push("hold");
      } else {
        deep = PR === PROF.fente ? (A.view === "profil" ? A.minKnee < 115 || A.maxD > 0.32 : A.maxD > 0.22) : (A.view === "profil" ? A.minKnee < 105 : A.maxD > 0.2);
        if (PR.tempo && A.nf >= 5 && down < 550) faults.push("fast");
        else if (PR.tempo && A.nf >= 5 && up < 300) faults.push("abrupt");
      }
      faults = faults.filter(function (k, i) { return faults.indexOf(k) === i; });
      if (!faults.length) A.good++;
      A.log.push({ faults: faults, deep: deep });
      var m = faults.length ? MSG[faults[0]] : deep ? MSG.good[A.reps % MSG.good.length] : MSG.shallow;
      var vo = A.reps + ". " + (faults.length ? V.att[faults[0]] : deep ? V.good[A.reps % V.good.length] : V.shallow);
      var out = { msg: m, voice: vo, rep: true, ok: !faults.length, faults: faults };
      if (OPT.target && A.reps >= OPT.target && !A.targetSaid) { A.targetSaid = 1; out.voice = A.reps + ". " + V.target; out.msg = "Objectif atteint, bravo !"; out.cls = "ok"; out.finish = true; }
      return out;
    }
    return null;
  }
  function frontKnee(c) {
    var L = c.L, f = (L.lAn.x - c.hip.x) * c.facing > (L.rAn.x - c.hip.x) * c.facing ? "l" : "r";
    return f === "l" ? c.kL : c.kR;
  }

  /* Tenues : équilibre sur une jambe, planche */
  function holdStep(c, now) {
    var H = A.hold, dt = Math.min(1000, now - (H.lastT || now)); H.lastT = now;
    var inPose = false, aligned = true, side = "x", L = c.L;
    if (PR === PROF.unipodal) {
      var lift = (L.lAn.y - L.rAn.y) / Math.max(0.05, A.base ? A.base.leg : c.leg);
      inPose = Math.abs(lift) > (H.inPose ? 0.035 : 0.06);   // un peu d'hystérésis : le chrono ne s'arrête pas pour un tremblement
      if (inPose) {
        side = lift > 0 ? "l" : "r";   // pied d'appui = le plus bas dans l'image
        var free = side === "l" ? "r" : "l";
        if (L[free + "Hip"].y - L[side + "Hip"].y > Math.tan(6 * Math.PI / 180) * c.hipW) flag("pelvis");
        if (inward(L[side + "Hip"], L[side + "Kn"], L[side + "An"], c.hip, c.hipW) > 0.3) { flag("knee"); A.live[side + "Kn"] = 1; }
        if (tilt(c.sh, c.hip) > 12) flag("sway");
      }
    } else if (PR === PROF.chaise) {
      // Chaise contre le mur : cuisses vers l'horizontale, genoux pliés ; le chrono tourne entre 70° et 115°
      inPose = c.kNear < (H.inPose ? 140 : 130) && slope(c.N.hip, c.N.kn) < 45;
      if (inPose) {
        if (c.kNear > 115) { flag("wallUp"); aligned = false; } else if (c.kNear < 70) { flag("wallLow"); aligned = false; }
      }
    } else {
      var kneeDown = c.kNear < 145, end = kneeDown ? c.N.kn : c.N.an;
      inPose = slope(c.N.sh, end) < 35 && dist(c.N.sh, end) > 0.25;
      if (inPose) {
        var dev = above(c.N.hip, c.N.sh, end);
        if (dev > 0.08) { flag("high"); aligned = false; } else if (dev < -0.06) { flag("sag"); aligned = false; }
      }
    }
    var out = null;
    if (inPose) {
      if (!H.inPose) { H.inPose = true; H.started = true; H.outT = 0; if (!H.saidGo) { H.saidGo = 1; out = { msg: PR === PROF.unipodal ? "Chrono lancé !" : "C'est parti, tiens la position.", voice: PR === PROF.unipodal ? null : PR.go }; } }
      if (aligned) {
        H.t += dt; H.goodT += dt;
        if (side !== "x") H.side[side] += dt;
        var cur = side === "x" ? H.t : H.side[side], k = side === "x" ? "x" : side, tenth = Math.floor(cur / 10000);
        if (tenth > H.said10[k]) { H.said10[k] = tenth; out = { msg: tenth * 10 + " secondes", voice: tenth * 10 + " secondes", cls: "ok" }; }
      }
      // Consigne si un défaut dure (au plus toutes les 4 secondes par défaut)
      for (var fk in A.flags) {
        if (A.flags[fk] >= 3 && now - (H.lastCue[fk] || 0) > 4000) { H.lastCue[fk] = now; H.cnt[fk] = (H.cnt[fk] || 0) + 1; A.flags = {}; return { msg: V[fk], voice: V[fk], live: true, cls: "bad" }; }
      }
    } else if (H.inPose) {
      H.outT += dt;
      if (H.outT > 800) {
        H.inPose = false; A.flags = {};
        if (PR === PROF.unipodal) { H.touch++; out = { msg: "Pied posé. On reprend quand tu veux.", voice: "Pied posé. On reprend quand tu veux.", cls: "warn" }; }
        else out = { msg: "Chrono en pause, replace-toi.", voice: "Chrono en pause, replace-toi.", cls: "warn" };
      }
    }
    // Objectif de temps
    var tgt = (OPT.target || PR.target) * 1000;
    if (!H.done) {
      if (PR.sides) {
        if (side !== "x" && H.side[side] >= tgt && !H["ok" + side]) {
          H["ok" + side] = 1; var other = side === "l" ? "r" : "l";
          if (H["ok" + other]) { H.done = true; return { msg: "Objectif atteint, bravo !", voice: V.target, cls: "ok", finish: true }; }
          return { msg: "Objectif atteint ! Change de jambe.", voice: "Objectif atteint, bravo ! Change de jambe.", cls: "ok" };
        }
      } else if (H.t >= tgt) { H.done = true; return { msg: "Objectif atteint, bravo !", voice: V.target, cls: "ok", finish: true }; }
    }
    return out;
  }

  /* ── Dessin de la silhouette ── */
  function draw(ctx, lm, W, H, box, badSet) {
    ctx.clearRect(0, 0, W, H);
    if (!lm) return;
    var pt = function (i) { return [box.x + (1 - lm[i].x) * box.w, box.y + lm[i].y * box.h]; };   // image en miroir
    var bad = badSet || (A ? A.live : {});
    var badBone = function (a, b) { return (bad.trunk && ((a === 11 && b === 23) || (a === 12 && b === 24))) || (bad.hips && a === 23 && b === 24); };
    ctx.lineCap = "round";
    BONES.forEach(function (b) {
      if ((lm[b[0]].visibility || 0) < 0.4 || (lm[b[1]].visibility || 0) < 0.4) return;
      var p = pt(b[0]), q = pt(b[1]);
      ctx.strokeStyle = badBone(b[0], b[1]) ? "rgba(255,77,94,.95)" : "rgba(255,255,255,.85)"; ctx.lineWidth = Math.max(4, W / 90);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    });
    var key = { 15: "hands", 16: "hands", 25: "lKn", 26: "rKn", 29: "lHe", 30: "rHe", 23: "hips", 24: "hips" };
    JOINTS.forEach(function (i) {
      if ((lm[i].visibility || 0) < 0.4) return;
      var p = pt(i), r = i === 0 ? Math.max(7, W / 45) : Math.max(6, W / 55), red = key[i] && bad[key[i]];
      ctx.fillStyle = red ? "#FF4D5E" : (i >= 23 ? "#22D3EE" : "#4FACFE");
      ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p[0], p[1], red ? r * 1.35 : r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  }

  /* ═══════════ Bilan de mobilité : Yass demande des mouvements, la caméra mesure (valeurs approchées, à titre indicatif) ═══════════ */
  var EAR = { l: 7, r: 8 };
  function deg(r) { return r * 180 / Math.PI; }
  function stilt(top, bottom) { return deg(Math.atan2(top.x - bottom.x, bottom.y - top.y)); }     // écart à la verticale, signé (> 0 : le haut part vers les x croissants)
  function med(a) { a = a.filter(function (v) { return v != null && isFinite(v); }); if (!a.length) return null; a.sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }
  function maxOf(S, k) { var m = -1e9; S.forEach(function (s) { if (s[k] != null && s[k] > m) m = s[k]; }); return m === -1e9 ? null : m; }
  function minOf(S, k) { var m = 1e9; S.forEach(function (s) { if (s[k] != null && s[k] < m) m = s[k]; }); return m === 1e9 ? null : m; }
  function leftDir(c) { return c.L.lHip.x > c.L.rHip.x ? 1 : -1; }     // + 1 : la gauche du patient est vers les x croissants
  // Axe du genou de face : > 0 genou vers l'intérieur (valgus), < 0 vers l'extérieur (varus), en degrés
  function kneeDev(h, k, a, mx) {
    var d = 180 - angle(h, k, a), t = (k.y - h.y) / Math.max(0.01, a.y - h.y), lx = h.x + (a.x - h.x) * t;
    return (k.x - lx) * (mx > h.x ? 1 : -1) >= 0 ? d : -d;
  }
  function floorY(c) { var L = c.L; return Math.max(L.lHe.y, L.rHe.y, L.lToe.y, L.rToe.y, L.lAn.y, L.rAn.y); }
  function reps(S, k, lo, hi) { var n = 0, down = false; S.forEach(function (s) { if (s[k] == null) return; if (!down && s[k] < lo) down = true; else if (down && s[k] > hi) { down = false; n++; } }); return n; }
  function longestRun(S) {   // plus longue tenue sur une jambe (pied levé sans interruption de plus de 0,3 s)
    var best = null, cur = null;
    S.forEach(function (s) {
      if (s.up) { if (!cur) cur = { a: s.t, b: s.t, xs: [], dr: [] }; cur.b = s.t; cur.xs.push(s.x); cur.dr.push(s.drop); }
      else if (cur && s.t - cur.b > 300) { if (!best || cur.b - cur.a > best.b - best.a) best = cur; cur = null; }
    });
    if (cur && (!best || cur.b - cur.a > best.b - best.a)) best = cur;
    return best;
  }
  var UNI_MAX = 20000;
  function uniStep(stand) {
    var raised = stand === "l" ? "droit" : "gauche", leg = stand === "l" ? "gauche" : "droite";
    return { id: "uni" + stand.toUpperCase(), view: "face", kind: "track", dur: UNI_MAX + 9000, title: "Équilibre sur la jambe " + leg,
      say: "Équilibre. Lève le pied " + raised + " et tiens sur la jambe " + leg + ", vingt secondes si tu peux. Reste près d'un appui.",
      sample: function (c, lm, now) {
        var L = c.L, o = stand === "l" ? "r" : "l", up = (L[stand + "An"].y - L[o + "An"].y) / Math.max(0.05, c.leg) > 0.06;
        // Trendelenburg : la hanche du côté levé descend (> 0) par rapport à celle d'appui
        var drop = deg(Math.atan2(L[o + "Hip"].y - L[stand + "Hip"].y, Math.abs(L.lHip.x - L.rHip.x)));
        return { up: up, x: c.hip.x / c.hipW, drop: up ? drop : null };
      },
      live: function (S) { var r = longestRun(S); return r ? (Math.min(UNI_MAX, r.b - r.a) / 1000).toFixed(0) + " s" : "lève le pied"; },
      done: function (S, now) { var r = longestRun(S); if (!r) return false; return r.b - r.a >= UNI_MAX || (now - r.b > 600 && r.b - r.a > 1500); },
      reduce: function (S) {
        var r = longestRun(S); if (!r) return null;
        var m = r.xs.reduce(function (a, b) { return a + b; }, 0) / r.xs.length, sd = Math.sqrt(r.xs.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / r.xs.length);
        return { s: Math.min(UNI_MAX, r.b - r.a) / 1000, sway: sd * 100, drop: med(r.dr) };
      } };
  }
  var BSTEPS = [
    { id: "face", view: "face", kind: "still", title: "Posture de face",
      say: "Premier repère. Debout, face au téléphone, bras le long du corps, pieds légèrement écartés. Ne bouge plus quelques secondes.",
      ready: function (c) { return c.kL > 158 && c.kR > 158; },
      sample: function (c, lm) {
        var L = c.L, eL = P(lm, 7), eR = P(lm, 8), e = mid(eL, eR);
        return { sh: deg(Math.atan2(L.lSh.y - L.rSh.y, Math.abs(L.lSh.x - L.rSh.x))),          // > 0 : épaule gauche plus basse
                 hip: deg(Math.atan2(L.lHip.y - L.rHip.y, Math.abs(L.lHip.x - L.rHip.x))),
                 head: eL.v > 0.5 && eR.v > 0.5 ? deg(Math.atan2(eL.y - eR.y, Math.abs(eL.x - eR.x))) : null,
                 kL: kneeDev(L.lHip, L.lKn, L.lAn, c.hip.x), kR: kneeDev(L.rHip, L.rKn, L.rAn, c.hip.x),
                 shift: (c.sh.x - c.an.x) * leftDir(c) / c.hipW * 100,                              // > 0 : buste décalé vers la gauche
                 hpx: (floorY(c) - e.y) / 0.936 };                                                 // taille du corps dans l'image (oreille ≈ 93,6 % de la taille)
      },
      live: function (s) { return "épaules " + Math.abs(s.sh).toFixed(1) + "°"; } },
    { id: "abd", view: "face", kind: "track", dur: 10000, title: "Abduction des épaules",
      say: "Lève les deux bras tendus sur les côtés, le plus haut possible au-dessus de la tête, puis redescends.",
      sample: function (c) { var L = c.L; return { l: angle(L.lHip, L.lSh, L.lEl), r: angle(L.rHip, L.rSh, L.rEl), lean: Math.abs(stilt(c.sh, c.hip)) }; },
      live: function (S) { var s = S[S.length - 1]; return "G " + s.l.toFixed(0) + "° · D " + s.r.toFixed(0) + "°"; },
      done: function (S) { var z = S[S.length - 1]; return maxOf(S, "l") > 140 && maxOf(S, "r") > 140 && z.l < 50 && z.r < 50; },
      reduce: function (S) { return { l: maxOf(S, "l"), r: maxOf(S, "r"), lean: maxOf(S, "lean") }; }, snap: "l" },
    uniStep("l"), uniStep("r"),
    { id: "profil", view: "profil", kind: "still", title: "Posture de profil",
      say: "Tourne-toi de profil par rapport au téléphone, bras le long du corps. Ne bouge plus.",
      ready: function (c) { return c.kNear > 158; },
      sample: function (c, lm) {
        var N = c.N, e = P(lm, EAR[c.near]), f = c.facing;
        var t = (N.kn.y - N.hip.y) / Math.max(0.01, N.an.y - N.hip.y), lx = N.hip.x + (N.an.x - N.hip.x) * t;
        return { head: e.v > 0.4 ? stilt(e, N.sh) * f : null,                                     // > 0 : tête en avant des épaules
                 trunk: stilt(N.sh, N.hip) * f,
                 knee: (180 - angle(N.hip, N.kn, N.an)) * ((N.kn.x - lx) * f >= 0 ? 1 : -1),       // > 0 genou fléchi, < 0 en hyperextension
                 plumb: e.v > 0.4 ? (e.x - N.an.x) * f / Math.max(0.05, dist(e, N.an)) * 100 : null,
                 hpx: e.v > 0.4 ? (floorY(c) - e.y) / 0.936 : null };
      },
      live: function (s) { return s.head == null ? "" : "tête " + s.head.toFixed(0) + "°"; } },
    { id: "squat", view: "profil", kind: "track", dur: 18000, title: "Squat",
      say: "Toujours de profil, pieds écartés à la largeur du bassin. Faites trois squats, aussi bas que possible sans douleur.",
      sample: function (c) { return { k: c.kNear, heel: c.nearVis("He") > 0.7 ? c.N.he.y : null }; },
      live: function (S) { return reps(S, "k", 125, 155) + " / 3"; },
      done: function (S) { return reps(S, "k", 125, 155) >= 3; },
      reduce: function (S) { var lo = minOf(S, "k"); return lo == null || lo > 150 ? null : { flex: 180 - lo, n: reps(S, "k", 125, 155) }; }, snap: "-k" },
    { id: "dds", view: "profil", kind: "track", dur: 12000, title: "Distance doigts-sol",
      say: "Jambes tendues, penche-toi doucement en avant, bras pendants, comme pour toucher le sol. Va jusqu'où c'est confortable, puis remonte.",
      ready: function (c) { return c.kNear > 155 && tilt(c.N.sh, c.N.hip) < 20; },
      sample: function (c) { var N = c.N; return { trunk: tilt(N.sh, N.hip), gap: floorY(c) - N.wr.y, knee: c.kNear }; },
      live: function (S) { var s = S[S.length - 1]; return "tronc " + s.trunk.toFixed(0) + "°"; },
      done: function (S) { return maxOf(S, "trunk") > 45 && S[S.length - 1].trunk < 20; },
      reduce: function (S) { var g = minOf(S, "gap"), at = S.filter(function (s) { return s.gap === g; })[0]; return { trunk: maxOf(S, "trunk"), gap: g, knee: at ? at.knee : null }; }, snap: "trunk" },
    { id: "flexep", view: "profil", kind: "track", dur: 10000, title: "Flexion des épaules",
      say: "Toujours de profil. Lève les deux bras tendus devant toi, le plus haut possible au-dessus de la tête, puis redescends.",
      sample: function (c) { var N = c.N; return { a: angle(N.hip, N.sh, N.el), arch: stilt(N.sh, N.hip) * c.facing }; },
      live: function (S) { return S[S.length - 1].a.toFixed(0) + "°"; },
      done: function (S) { return maxOf(S, "a") > 140 && S[S.length - 1].a < 50; },
      reduce: function (S) { var a = maxOf(S, "a"), at = S.filter(function (s) { return s.a === a; })[0]; return { a: a, arch: at ? -at.arch : null }; }, snap: "a" },
    { id: "sts", view: "profil", kind: "track", dur: 45000, title: "Assis-debout 30 secondes",
      say: "Dernier test. Assieds-toi sur une chaise, de profil, bras croisés sur la poitrine. Au top, lève-toi et rassieds-toi le plus vite possible pendant trente secondes.",
      ready: function (c) { return c.kNear < 125 && c.kNear > 60; },
      start: "Top !",
      sample: function (c, lm, now) { return { k: c.kNear }; },
      live: function (S, now) { var t0 = S[0].t, n = reps(S.filter(function (s) { return s.t - t0 <= 30000; }), "k", 115, 150); return n + " levers · " + Math.max(0, 30 - Math.floor((now - t0) / 1000)) + " s"; },
      done: function (S, now) { return now - S[0].t > 30000; },
      reduce: function (S) {
        var t0 = S[0].t, n = 0, up = false, t5 = null;
        S.forEach(function (s) { if (s.t - t0 > 30000) return; if (!up && s.k > 150) { up = true; n++; if (n === 5) t5 = (s.t - t0) / 1000; } else if (up && s.k < 115) up = false; });
        return { n: n, t5: t5 };
      } }
  ];
  function bilanStep(c, lm, now) {
    if (A.b && A.b.pre) A.b = null;
    var B = A.b || (A.b = { i: 0, ph: "intro", t: now, S: [], res: {}, snap: {}, asp: asp });
    var st = BSTEPS[B.i]; if (!st) return null;
    var el = now - B.t;
    if (B.ph === "intro") {
      if (el < 900) return null;
      if (!B.said) { B.said = now; B.live = ""; return { msg: st.say, voice: st.say, cls: "idle" }; }
      var need = typeof kfSpeechDur === "function" && !muted() ? kfSpeechDur(st.say) * 1000 : 2500;
      if (now - B.said > need + 300) { B.ph = "wait"; B.t = now; B.ok = 0; }
      return null;
    }
    if (B.ph === "wait") {
      var vOk = A.view === st.view;
      if (vOk && (!st.ready || st.ready(c))) {
        if (!B.ok) B.ok = now;
        if (now - B.ok > 700) { B.ph = "go"; B.t = now; B.S = []; B.best = null; return st.kind === "still" ? { msg: "Ne bouge plus…", cls: "idle" } : { msg: st.start || "C'est parti.", voice: st.start || "C'est parti.", cls: "ok" }; }
      } else B.ok = 0;
      if (!vOk && now - (B.vs || 0) > 7000) { B.vs = now; var t = st.view === "profil" ? MSG.side : MSG.front; return { msg: t, voice: V[st.view === "profil" ? "side" : "front"], cls: "warn" }; }
      if (el > 30000) return nextB(now, null);
      return null;
    }
    var s = st.sample(c, lm, now); s.t = now; B.S.push(s);
    // image du moment le plus parlant, pour le compte rendu (seulement les points, jamais la vidéo)
    var sk = st.snap ? st.snap.replace("-", "") : null, better = sk && s[sk] != null && (B.best == null || (st.snap.charAt(0) === "-" ? s[sk] < B.best : s[sk] > B.best));
    if (st.kind === "still" || better) { if (sk) B.best = s[sk]; B.snap[st.id] = lm.map(function (q) { return [+q.x.toFixed(4), +q.y.toFixed(4), +(q.visibility || 0).toFixed(2)]; }); }
    B.live = st.live ? (st.kind === "still" ? st.live(s) : st.live(B.S, now)) : "";
    if (st.kind === "still") {
      if (el > 2600) { var r = {}; Object.keys(s).forEach(function (k) { if (k !== "t") r[k] = med(B.S.map(function (x) { return x[k]; })); }); return nextB(now, r); }
      return null;
    }
    if ((B.S.length > 15 && st.done(B.S, now)) || el > st.dur) return nextB(now, B.S.length > 10 ? st.reduce(B.S) : null);
    return null;
  }
  function nextB(now, r, skipped) {
    var B = A.b, st = BSTEPS[B.i];
    if (r) B.res[st.id] = r; else if (skipped) B.res[st.id] = { skipped: true };
    B.i++; B.ph = "intro"; B.said = 0; B.t = now; B.live = "";
    if (B.i >= BSTEPS.length) return { msg: "Bilan terminé !", voice: "Bilan terminé. Voici ce que j'ai observé.", cls: "ok", finish: true };
    return { msg: r ? "C'est noté." : "On passe à la suite.", voice: r ? "C'est noté." : "On passe à la suite.", cls: r ? "ok" : "idle" };
  }

  /* ── Yass montre chaque test dans un médaillon (pendant la consigne ; il s'efface pendant la mesure) ── */
  var DEMO = null;
  var DSEQ = { face: ["F", [["stand", 1.2]]], abd: ["F", [["stand", 0.6], ["abd", 1.4], ["abd", 0.5], ["stand", 1.2]]],
    uniL: ["F", [["stand", 0.6], ["uni", 0.8, "R"], ["uni", 1.8, "R"], ["stand", 0.8]]], uniR: ["F", [["stand", 0.6], ["uni", 0.8], ["uni", 1.8], ["stand", 0.8]]],
    profil: ["P", [["stand", 1.2]]], squat: ["P", [["stand", 0.5], ["down", 1.4], ["down", 0.3], ["stand", 1.2]]],
    dds: ["P", [["stand", 0.6], ["fold", 1.8], ["fold", 0.6], ["stand", 1.5]]], flexep: ["P", [["stand", 0.6], ["flex", 1.4], ["flex", 0.5], ["stand", 1.2]]],
    sts: ["C", [["sit", 0.8], ["lean", 0.5], ["up", 0.7], ["lean", 0.7], ["sit", 0.6]]] };
  function demoDefs(A) {
    if (A.__kbd || !window.KineAvatar || !KineAvatar._def) return !!A.__kbd;
    var sq = KineAvatar._def("Squat bilatéral"), un = KineAvatar._def("Équilibre unipodal"), ch = KineAvatar._def("Assis-debout de chaise"); if (!sq || !un || !ch) return false;
    var cp = function (o) { return JSON.parse(JSON.stringify(o)); }, up = sq.poses.up, mk = function (o) { var q = cp(up); for (var k in o) q[k] = o[k]; return q; };
    var P = { stand: up, down: sq.poses.down, abd: mk({ LA: { ang: [0, 168, 0, 5] }, RA: { ang: [0, 168, 0, 5] } }), uni: un.poses.hold,
      fold: mk({ pelvis: { p: [0, "auto", 0], r: [62, 0, 0] }, spine: [45, 0, 0], LA: { ang: [118, 6, 0, 0] }, RA: { ang: [118, 6, 0, 0] } }),   // bras pendants vers le sol
      flex: mk({ LA: { ang: [172, 6, 0, 5] }, RA: { ang: [172, 6, 0, 5] } }) };
    A.register("__kbF", { camera: { yaw: 0.05, pitch: 0.05, dist: 3.5, ty: 0.95 }, start: "stand", poses: P });
    A.register("__kbP", { camera: { yaw: 1.45, pitch: 0.05, dist: 3.5, ty: 0.92 }, start: "stand", poses: P });
    // assis-debout : bras croisés sur la poitrine, comme le test officiel (les mains ne poussent pas sur les cuisses)
    var CP = cp(ch.poses); for (var k in CP) { CP[k].LA = { ang: [58, -35, -80, 130] }; CP[k].RA = { ang: [58, -35, -80, 130] }; }
    A.register("__kbC", { camera: { yaw: 1.3, pitch: 0.05, dist: 3.5, ty: 0.75 }, props: ch.props, chair: ch.chair, start: "sit", poses: CP });
    A.__kbd = true; return true;
  }
  function demoSync() {
    var box = $("kb-demo"), B = A && A.b, st = B && BSTEPS[B.i]; if (!box) return;
    var want = st && (B.ph !== "go" || st.kind === "track") ? st.id : null;   // pour les mouvements, il continue de montrer pendant la mesure
    box.classList.toggle("on", !!want);
    if (!want || !window.KineLumiere || !KineLumiere.avatar) return;
    if (DEMO && DEMO.id === want) return;
    var d = DEMO = { id: want, n: 0 };
    KineLumiere.avatar(7, function (Av) {
      if (DEMO !== d || !Av || !demoDefs(Av)) return;
      var q = DSEQ[want], name = "__kb" + q[0];
      if (!Av.show(box.querySelector(".kb-demo-av"), name)) return;
      if (Av.pause) Av.pause(false); d.A = Av;
      var i = 0;
      (function nx() {
        if (DEMO !== d || !box.isConnected) return;
        var s0 = q[1][i++ % q[1].length]; Av.step({ pose: s0[0], dur: s0[1], side: s0[2] || "L" });
        d.t = setTimeout(nx, s0[1] * 1000 + 30);
      })();
    });
  }
  function demoStop() { if (!DEMO) return; var d = DEMO; DEMO = null; clearTimeout(d.t); try { if (d.A) d.A.hide(); } catch (e) {} }
  function bilanSkip() { if (!A || !A.b || !S) return; var out = nextB(performance.now(), null, true); var m = $("kcam-msg"); if (m) { m.textContent = out.msg; m.className = "kcam-msg idle"; } say(out.voice); if (out.finish) setTimeout(function () { if (S) finish(); }, 1500); }
  // Repères dessinés en direct sur la silhouette
  function bilanDraw(ctx, lm, box, W) {
    var B = A && A.b, st = B && BSTEPS[B.i]; if (!st || !lm) return;
    var pt = function (i) { return [box.x + (1 - lm[i].x) * box.w, box.y + lm[i].y * box.h]; };
    var line = function (a, b, col, w, dash) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); };
    var ext = function (a, b, k) { var dx = b[0] - a[0], dy = b[1] - a[1]; return [[a[0] - dx * k, a[1] - dy * k], [b[0] + dx * k, b[1] + dy * k]]; };
    var lw = Math.max(2.5, W / 140);
    if (st.view === "face") {
      var fa = [(pt(27)[0] + pt(28)[0]) / 2, Math.max(pt(31)[1], pt(32)[1])];
      line([fa[0], box.y + 8], [fa[0], fa[1]], "rgba(25,195,160,.9)", lw, [10, 8]);
      var s1 = ext(pt(11), pt(12), 0.35), h1 = ext(pt(23), pt(24), 0.5);
      line(s1[0], s1[1], "rgba(255,179,138,.95)", lw); line(h1[0], h1[1], "rgba(255,179,138,.95)", lw);
    } else {
      var n = A.nearSide || "l", ids = n === "l" ? [7, 11, 23, 25, 27] : [8, 12, 24, 26, 28], an = pt(ids[4]);
      line([an[0], box.y + 8], an, "rgba(25,195,160,.9)", lw, [10, 8]);
      ctx.strokeStyle = "rgba(255,179,138,.95)"; ctx.lineWidth = lw; ctx.beginPath();
      ids.forEach(function (i, k) { var p = pt(i); if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
    }
  }
  /* ── Écran d'accueil du bilan ── */
  var BTEST = [["Posture de face", "épaules, bassin, tête, axe des genoux"], ["Abduction des épaules", "amplitude à gauche et à droite"],
               ["Équilibre unipodal", "temps sur chaque jambe, bassin (Trendelenburg)"], ["Posture de profil", "tête, buste, genoux, fil à plomb"], ["Squat", "flexion des genoux"],
               ["Distance doigts-sol", "en centimètres"], ["Flexion des épaules", "amplitude au-dessus de la tête"], ["Assis-debout 30 s", "nombre de levers, temps des 5 premiers"]];
  var BIC = {   // petits pictogrammes des tests
    face: "<circle cx='12' cy='4' r='2'/><path d='M12 6v8M7 9h10M9 21l3-7 3 7M4 9h16' stroke-dasharray='0'/>",
    abd: "<circle cx='12' cy='4' r='2'/><path d='M12 6v8M9 21l3-7 3 7M12 8 5 3M12 8l7-5'/>",
    uni: "<circle cx='12' cy='4' r='2'/><path d='M12 6v8l-2 7M12 14l4 2 1 4M7 10h10'/>",
    profil: "<circle cx='13' cy='4' r='2'/><path d='M12 6.5 11 14l1 7M11 9l2 4M4 2v20' stroke-dasharray='2 2'/>",
    squat: "<circle cx='11' cy='5' r='2'/><path d='M11 7l1 6-5 2 2 6M12 13l5 2v6M9 9h8'/>",
    dds: "<circle cx='6' cy='12' r='2'/><path d='M8 11l7-3 1 13M15 8v13M8 12l1 6M3 22h18'/>",
    flexep: "<circle cx='12' cy='7' r='2'/><path d='M12 9v6l-1 6M12 15l1 6M12 10l1-8M12 10l2-8'/>",
    sts: "<path d='M5 21v-8h7M5 13V4M14 21l-2-8 4-1M14 6a2 2 0 1 0 0-.1M12 9l2 3'/>" };
  function bic(k) { return "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + (BIC[k] || "") + "</svg>"; }
  var BTEST = [["face", "Posture de face", "épaules, bassin, tête, genoux"], ["abd", "Abduction des épaules", "gauche et droite"], ["uni", "Équilibre unipodal", "et signe de Trendelenburg"],
               ["profil", "Posture de profil", "tête, buste, fil à plomb"], ["squat", "Squat", "flexion des genoux"], ["dds", "Distance doigts-sol", "en centimètres"],
               ["flexep", "Flexion des épaules", "au-dessus de la tête"], ["sts", "Assis-debout 30 s", "et 5 levers chronométrés"]];
  function bilanIntro() {
    PRID = "bilan"; PR = PROF.bilan; OPT = {};
    var el = shell(), me = jget("kf-bilan-me", {}), hist = jget("kf-bilan-hist", []), seen = jget("kf-cam-seen", 0);
    el.innerHTML = "<div class='kcam-intro kc2 kb2'><button class='kf-back' onclick='KineCamera.open()' aria-label='Retour'>←</button>" +
      "<section class='kb2-hero'><span class='kc2-tag'>Bilan · indicatif</span><h1>Bilan de mobilité</h1>" +
        "<p>Yass te guide à la voix. La caméra mesure, tu suis ton évolution d'un bilan à l'autre.</p>" +
        "<div class='kb2-kpis'><div><b>8</b><small>tests</small></div><div><b>4</b><small>minutes</small></div><div><b>0</b><small>image envoyée</small></div></div></section>" +
      "<div class='kb2-tests'>" + BTEST.map(function (t, i) { return "<div class='kb2-t'><span class='kb2-ic'>" + bic(t[0]) + "<i>" + (i + 1) + "</i></span><b>" + t[1] + "</b><small>" + t[2] + "</small></div>"; }).join("") + "</div>" +
      "<h2 class='kc2-h'>Pour des mesures justes</h2>" +
      "<div class='kb2-me'><label><small>Ta taille</small><span><input id='kb-h' type='number' inputmode='numeric' min='120' max='220' placeholder='170' value='" + (me.h || "") + "'><em>cm</em></span></label>" +
        "<label><small>Ton âge</small><span><input id='kb-a' type='number' inputmode='numeric' min='10' max='110' placeholder='45' value='" + (me.a || "") + "'><em>ans</em></span></label></div>" +
      "<p class='kb-small'>La taille convertit la distance doigts-sol en centimètres ; l'âge sert à comparer l'assis-debout aux normes.</p>" +
      "<div class='kc2-steps kb-prep'><div><b>1</b><span>Téléphone debout, à hauteur de la taille</span></div><div><b>2</b><span>Recule : tout le corps visible</span></div><div><b>3</b><span>Une chaise pour le dernier test</span></div></div>" +
      (seen ? "" : "<p class='kc2-priv'>Au premier lancement, l'outil d'analyse se télécharge (environ 15 Mo, une seule fois).</p>") +
      "<p class='kcam-err' id='kcam-err' role='alert'></p>" +
      "<button class='kc2-go kb-go' id='kcam-go'>Commencer le bilan <span aria-hidden='true'>→</span></button>" +
      (hist.length ? "<button class='kb-last' onclick='KineCamera.bilanShow(0)'><span>Revoir mon dernier bilan · " + fmtD(hist[0].d) + "</span><span aria-hidden='true'>›</span></button>" : "") + "</div>";
    el.scrollTop = 0;
    $("kcam-go").onclick = function () {
      var h = +$("kb-h").value, a = +$("kb-a").value;
      jset("kf-bilan-me", { h: h >= 120 && h <= 220 ? h : null, a: a >= 10 && a <= 110 ? a : null });
      start();
    };
  }
  function fmtD(d) { try { var x = new Date(d + "T12:00:00"); return x.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }); } catch (e) { return d; } }

  /* ── Compte rendu ── */
  function n1(v) { return (Math.round(v * 10) / 10).toString().replace(".", ","); }
  function side(v, g, d) { return v > 0 ? g : d; }
  function items(R, me) {
    var out = [], push = function (sec, k, label, val, ok, txt, why, num) { out.push({ sec: sec, k: k, label: label, val: val, ok: ok, txt: txt, why: why, num: num }); };
    var f = R.face;
    if (f) {
      push("face", "sh", "Épaules", n1(Math.abs(f.sh)) + "°", Math.abs(f.sh) < 2, Math.abs(f.sh) < 2 ? "À niveau" : "Épaule " + side(f.sh, "gauche", "droite") + " plus basse",
        "Écart de hauteur entre les deux épaules, vu de face. Sous 2°, on considère qu'elles sont à niveau.", Math.abs(f.sh));
      push("face", "hip", "Bassin", n1(Math.abs(f.hip)) + "°", Math.abs(f.hip) < 2, Math.abs(f.hip) < 2 ? "À niveau" : "Côté " + side(f.hip, "gauche", "droit") + " plus bas",
        "Ligne entre les deux hanches. Un léger écart est fréquent ; il peut venir d'une différence de longueur de jambe ou d'un appui préférentiel.", Math.abs(f.hip));
      if (f.head != null) push("face", "head", "Tête", n1(Math.abs(f.head)) + "°", Math.abs(f.head) < 3, Math.abs(f.head) < 3 ? "Droite" : "Penchée vers la " + side(f.head, "gauche", "droite"),
        "Inclinaison de la tête, mesurée entre les deux oreilles.", Math.abs(f.head));
      ["L", "R"].forEach(function (s) {
        var v = f["k" + s]; if (v == null) return;
        push("face", "k" + s, "Axe du genou " + (s === "L" ? "gauche" : "droit"), n1(Math.abs(v)) + "°", Math.abs(v) < 6, Math.abs(v) < 6 ? "Dans l'axe" : v > 0 ? "Vers l'intérieur (valgum)" : "Vers l'extérieur (varum)",
          "Écart du genou par rapport à la ligne hanche-cheville, debout. Les vêtements amples peuvent fausser la mesure.", Math.abs(v));
      });
      if (f.shift != null && Math.abs(f.shift) > 12) push("face", "shift", "Appui", Math.round(Math.abs(f.shift)) + " %", false, "Buste décalé vers la " + side(f.shift, "gauche", "droite"), "Décalage du buste par rapport au milieu des pieds, en pourcentage de la largeur du bassin.", Math.abs(f.shift));
    }
    var ab = R.abd;
    if (ab) ["l", "r"].forEach(function (s) {
      push("abd", "abd" + s, "Abduction " + (s === "l" ? "gauche" : "droite"), Math.round(ab[s]) + "°", ab[s] >= 150, ab[s] >= 150 ? "Amplitude complète" : "Amplitude limitée",
        "Angle entre le bras et le tronc, bras levé sur le côté. Référence : environ 180°.", ab[s]);
    });
    if (ab && Math.abs(ab.l - ab.r) > 15) push("abd", "abdA", "Asymétrie", Math.round(Math.abs(ab.l - ab.r)) + "°", false, "Côté " + (ab.l < ab.r ? "gauche" : "droit") + " moins mobile", "Différence d'amplitude entre les deux épaules.", Math.abs(ab.l - ab.r));
    if (ab && ab.lean > 10) push("abd", "abdC", "Compensation", Math.round(ab.lean) + "°", false, "Le buste penche pour monter le bras", "Inclinaison du tronc pendant le mouvement : elle peut masquer un manque de mobilité de l'épaule.", ab.lean);
    var q = R.squat;
    if (q) {
      push("squat", "sqF", "Flexion des genoux", Math.round(q.flex) + "°", q.flex >= 90, q.flex >= 115 ? "Squat profond" : q.flex >= 90 ? "Bonne profondeur" : "Squat peu profond",
        "Flexion du genou au point le plus bas. 90° : cuisses à peu près horizontales. En flexion passive, le genou atteint environ 140°.", q.flex);
      ["L", "R"].forEach(function (s) { var v = q["v" + s]; if (v == null) return;
        push("squat", "sqV" + s, "Genou " + (s === "L" ? "gauche" : "droit") + " en bas", n1(Math.abs(v)) + "°", v < 8, v < 8 ? "Reste dans l'axe" : "Rentre vers l'intérieur", "Valgus dynamique : le genou qui rentre en descendant sollicite davantage le genou et la hanche.", v); });
    }
    ["L", "R"].forEach(function (s) {
      var u = R["uni" + s]; if (!u || u.skipped) return;
      var leg = s === "L" ? "gauche" : "droite";
      push("uni", "uS" + s, "Unipodal jambe " + leg, n1(u.s) + " s", u.s >= 15, u.s >= UNI_MAX / 1000 ? "20 s tenues" : u.s >= 15 ? "Bon équilibre" : u.s >= 10 ? "Équilibre moyen" : "Équilibre à travailler",
        "Temps tenu sur une jambe, yeux ouverts (arrêt à 20 s). Moins de 10 s est associé à un risque de chute plus élevé chez les personnes âgées.", u.s);
      if (u.drop != null) push("uni", "uT" + s, "Bassin, appui " + leg, n1(Math.abs(u.drop)) + "°", u.drop < 4, u.drop < 4 ? "Reste horizontal" : "Descend du côté levé",
        "Signe de Trendelenburg : si le bassin tombe du côté de la jambe levée, les muscles fessiers latéraux (moyen fessier) du côté d'appui peuvent manquer de force.", u.drop);
    });
    var p = R.profil;
    if (p) {
      if (p.head != null) push("profil", "pH", "Tête", Math.round(p.head) + "°", p.head < 20, p.head < 20 ? "Bien placée" : p.head < 30 ? "Légèrement en avant" : "Projetée en avant",
        "Angle entre la verticale et la ligne épaule-oreille. Une tête projetée en avant augmente la charge sur la nuque.", p.head);
      push("profil", "pT", "Buste", Math.round(Math.abs(p.trunk)) + "°", Math.abs(p.trunk) < 6, Math.abs(p.trunk) < 6 ? "Vertical" : p.trunk > 0 ? "Penché en avant" : "Penché en arrière", "Inclinaison épaule-hanche par rapport à la verticale.", Math.abs(p.trunk));
      push("profil", "pK", "Genoux", Math.round(Math.abs(p.knee)) + "°", Math.abs(p.knee) < 6, Math.abs(p.knee) < 6 ? "Tendus normalement" : p.knee > 0 ? "Légèrement fléchis (flessum)" : "En hyperextension (recurvatum)",
        "Angle du genou debout, de profil. Un recurvatum important charge l'arrière du genou.", Math.abs(p.knee));
    }
    var d = R.dds;
    if (d) {
      var hpx = (p && p.hpx) || (f && f.hpx), cm = me.h && hpx ? Math.max(0, d.gap * me.h / hpx - 0.108 * me.h) : null;
      if (cm != null) push("dds", "dds", "Distance doigts-sol", Math.round(cm) + " cm", cm <= 10, cm < 1 ? "Les doigts touchent le sol" : cm <= 10 ? "Bonne souplesse" : cm <= 25 ? "Souplesse moyenne" : "Souplesse limitée",
        "Distance entre le bout des doigts et le sol, penché en avant jambes tendues. Elle dépend des ischio-jambiers, du bassin et du dos. Estimée à partir de ta taille." + (d.knee != null && d.knee < 165 ? " Tes genoux se sont pliés : la valeur réelle est sans doute un peu plus grande." : ""), cm);
      push("dds", "ddsT", "Flexion du tronc", Math.round(d.trunk) + "°", d.trunk >= 70, d.trunk >= 70 ? "Bonne amplitude" : "Amplitude limitée", "Angle maximal entre le buste et la verticale (hanches et dos ensemble).", d.trunk);
    }
    var fe = R.flexep;
    if (fe) {
      push("flexep", "fe", "Flexion des épaules", Math.round(fe.a) + "°", fe.a >= 150, fe.a >= 150 ? "Amplitude complète" : "Amplitude limitée", "Angle entre le bras et le tronc, bras levés devant. Référence : environ 180°.", fe.a);
      if (fe.arch != null && fe.arch > 10) push("flexep", "feC", "Compensation", Math.round(fe.arch) + "°", false, "Le dos se cambre en fin de mouvement", "Quand l'épaule manque de mobilité, le bas du dos se cambre pour monter les bras plus haut.", fe.arch);
    }
    var t = R.sts;
    if (t) {
      var a = me.a, ref5 = a >= 80 ? 14.8 : a >= 70 ? 12.6 : a >= 60 ? 11.4 : null, ref30 = a >= 60 ? 12 : 15;
      push("sts", "sts30", "Levers en 30 s", t.n + "", t.n >= ref30, t.n >= ref30 ? "Bonne force des jambes" : "Force des jambes à travailler",
        "Nombre de levers complets en 30 secondes, bras croisés. Repère : au moins " + ref30 + " levers" + (a >= 60 ? " après 60 ans" : "") + ".", t.n);
      if (t.t5 != null) push("sts", "sts5", "5 levers", n1(t.t5) + " s", ref5 ? t.t5 <= ref5 : t.t5 <= 10, ref5 ? (t.t5 <= ref5 ? "Dans la norme pour ton âge" : "Plus lent que la norme pour ton âge") : (t.t5 <= 10 ? "Rapide" : "À travailler"),
        "Temps pour se lever 5 fois. Normes (Bohannon) : 11,4 s entre 60 et 69 ans, 12,6 s entre 70 et 79 ans, 14,8 s entre 80 et 89 ans." + (a ? "" : " Indique ton âge pour comparer."), t.t5);
    }
    return out;
  }
  var SECS = [["face", "Posture de face"], ["abd", "Épaules, de face"], ["uni", "Équilibre unipodal"], ["profil", "Posture de profil"], ["squat", "Squat"], ["dds", "Souplesse"], ["flexep", "Épaules, de profil"], ["sts", "Force des jambes"]];
  var SNAPS = { face: "face", abd: "abd", squat: "squat", uni: null, profil: "profil", dds: "dds", flexep: "flexep", sts: null };
  // Silhouette dessinée à partir des seuls points (aucune image n'est gardée)
  function fig(sn, ar, kind, side) {
    if (!sn) return "";
    var X = function (i) { return (1 - sn[i][0]) * ar * 100; }, Y = function (i) { return sn[i][1] * 100; }, ok = function (i) { return sn[i][2] > 0.35; };
    var xs = [], ys = []; [0, 7, 8, 11, 12, 15, 16, 23, 24, 27, 28, 31, 32].forEach(function (i) { if (ok(i)) { xs.push(X(i)); ys.push(Y(i)); } });
    if (!xs.length) return "";
    var x0 = Math.min.apply(null, xs) - 12, x1 = Math.max.apply(null, xs) + 12, y0 = Math.min.apply(null, ys) - 10, y1 = Math.max.apply(null, ys) + 4;
    var w = Math.max(x1 - x0, (y1 - y0) * 0.62), cx = (x0 + x1) / 2; x0 = cx - w / 2;
    var L = function (a, b, cls) { return ok(a) && ok(b) ? "<line class='" + (cls || "b") + "' x1='" + X(a).toFixed(1) + "' y1='" + Y(a).toFixed(1) + "' x2='" + X(b).toFixed(1) + "' y2='" + Y(b).toFixed(1) + "'/>" : ""; };
    var h = BONES.map(function (b) { return L(b[0], b[1]); }).join("");
    var ext = function (a, b, k, cls) { if (!ok(a) || !ok(b)) return ""; var dx = X(b) - X(a), dy = Y(b) - Y(a); return "<line class='" + cls + "' x1='" + (X(a) - dx * k).toFixed(1) + "' y1='" + (Y(a) - dy * k).toFixed(1) + "' x2='" + (X(b) + dx * k).toFixed(1) + "' y2='" + (Y(b) + dy * k).toFixed(1) + "'/>"; };
    var ov = "";
    if (kind === "face") {
      var fx = (X(27) + X(28)) / 2;
      ov = "<line class='pl' x1='" + fx.toFixed(1) + "' y1='" + y0.toFixed(1) + "' x2='" + fx.toFixed(1) + "' y2='" + y1.toFixed(1) + "'/>" + ext(11, 12, 0.3, "ln k-sh") + ext(23, 24, 0.45, "ln k-hip") + ext(7, 8, 0.6, "ln k-head");
    } else if (kind === "profil") {
      var ids = side === "r" ? [8, 12, 24, 26, 28] : [7, 11, 23, 25, 27];
      ov = "<line class='pl' x1='" + X(ids[4]).toFixed(1) + "' y1='" + y0.toFixed(1) + "' x2='" + X(ids[4]).toFixed(1) + "' y2='" + y1.toFixed(1) + "'/>" +
        "<polyline class='ln k-pH' points='" + ids.filter(ok).map(function (i) { return X(i).toFixed(1) + "," + Y(i).toFixed(1); }).join(" ") + "'/>";
    }
    var dots = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].filter(ok).map(function (i) { return "<circle cx='" + X(i).toFixed(1) + "' cy='" + Y(i).toFixed(1) + "' r='1.6'/>"; }).join("");
    return "<svg class='kb-fig' viewBox='" + x0.toFixed(1) + " " + y0.toFixed(1) + " " + w.toFixed(1) + " " + (y1 - y0).toFixed(1) + "' aria-hidden='true'>" + ov + h + dots + "</svg>";
  }
  // mesures en paire (gauche / droite) : une seule tuile avec deux jauges
  var PAIR = { abdl: ["abd", "G", "Abduction", 180, "°"], abdr: ["abd", "D", "Abduction", 180, "°"], uSL: ["uS", "G", "Tenue sur une jambe", 20, " s"], uSR: ["uS", "D", "Tenue sur une jambe", 20, " s"],
               uTL: ["uT", "G", "Bassin (Trendelenburg)", 10, "°"], uTR: ["uT", "D", "Bassin (Trendelenburg)", 10, "°"], kL: ["kn", "G", "Axe des genoux", 15, "°"], kR: ["kn", "D", "Axe des genoux", 15, "°"] };
  function tiles(rows, prevIt) {
    var out = [], done = {};
    rows.forEach(function (x) {
      var pr = PAIR[x.k];
      if (pr) {
        if (done[pr[0]]) return; done[pr[0]] = 1;
        var both = rows.filter(function (y) { return PAIR[y.k] && PAIR[y.k][0] === pr[0]; }), ok = both.every(function (y) { return y.ok; });
        out.push("<button type='button' class='kb2-tile wide " + (ok ? "ok" : "w") + "' onclick='KineCamera.bilanTap(this)' data-k='" + both.map(function (y) { return y.k; }).join(" ") + "'><small>" + esc(pr[2]) + "</small>" +
          both.map(function (y) {
            var q = PAIR[y.k], pct = Math.max(4, Math.min(100, (y.num || 0) / q[3] * 100)), pv = prevIt[y.k];
            return "<span class='kb2-bar " + (y.ok ? "ok" : "w") + "'><em>" + (q[1] === "G" ? "Gauche" : "Droite") + "</em><span class='kb2-track'><i style='width:" + pct.toFixed(0) + "%'></i></span><b>" + esc(y.val) + "</b>" + (pv ? "<u>avant " + esc(pv.val) + "</u>" : "") + "</span>";
          }).join("") +
          "<span class='kb2-st'>" + esc(both.filter(function (y) { return !y.ok; }).map(function (y) { return (PAIR[y.k][1] === "G" ? "gauche : " : "droite : ") + y.txt.toLowerCase(); }).join(" · ") || both[0].txt) + "</span>" +
          "<span class='kb-why'>" + esc(both[0].why) + "</span></button>");
        return;
      }
      var pv = prevIt[x.k];
      out.push("<button type='button' class='kb2-tile " + (x.ok ? "ok" : "w") + "' onclick='KineCamera.bilanTap(this)' data-k='" + x.k + "'><small>" + esc(x.label) + "</small><b>" + esc(x.val) + "</b>" +
        "<span class='kb2-st'>" + esc(x.txt) + "</span>" + (pv ? "<u>avant " + esc(pv.val) + "</u>" : "") + "<span class='kb-why'>" + esc(x.why) + "</span></button>");
    });
    return out.join("");
  }
  function ring(ok, tot) {
    var r = 42, c = 2 * Math.PI * r, f = tot ? ok / tot : 0;
    return "<svg class='kb2-ring' viewBox='0 0 100 100' aria-hidden='true'><circle cx='50' cy='50' r='" + r + "' class='bg'/><circle cx='50' cy='50' r='" + r + "' class='fg' stroke-dasharray='" + (c * f).toFixed(1) + " " + c.toFixed(1) + "'/></svg>";
  }
  function bilanResult(B, saved, at) {
    var me = (saved && saved.me) || jget("kf-bilan-me", {}), R = B.res, hist = jget("kf-bilan-hist", []);
    if (!saved) {
      if (!Object.keys(R).filter(function (k) { return !R[k].skipped; }).length) { bilanIntro(); return; }
      hist.unshift({ d: new Date().toISOString().slice(0, 10), res: R, snap: B.snap, asp: B.asp, near: A.nearSide, me: me });
      jset("kf-bilan-hist", hist.slice(0, 12)); saved = hist[0];
    }
    var idx = at || 0;
    var prev = hist[idx + 1], prevIt = {}; if (prev) items(prev.res, prev.me || me).forEach(function (x) { prevIt[x.k] = x; });
    var it = items(R, me), watch = it.filter(function (x) { return !x.ok; });
    var el = shell(), body = SECS.map(function (s) {
      var rows = it.filter(function (x) { return x.sec === s[0]; }); if (!rows.length) return "";
      var nw = rows.filter(function (x) { return !x.ok; }).length, sk = SNAPS[s[0]];
      var f = sk ? fig(saved.snap && saved.snap[sk], saved.asp || 0.75, s[0] === "face" || s[0] === "profil" ? s[0] : "", saved.near) : "";
      return "<section class='kb2-sec'><header><span class='kb2-sic'>" + (f || bic(s[0])) + "</span><span><b>" + s[1] + "</b><em class='" + (nw ? "w" : "ok") + "'>" + (nw ? nw + " à surveiller" : "Dans les repères") + "</em></span></header>" +
        "<div class='kb2-grid'>" + tiles(rows, prevIt) + "</div></section>";
    }).join("");
    el.innerHTML = "<div class='kcam-intro kc2 kb2 kb2-res'><button class='kf-back' onclick='KineCamera.close()' aria-label='Fermer'>←</button>" +
      "<section class='kb2-hero'><span class='kc2-tag'>Indicatif · " + fmtD(saved.d) + "</span><h1>Ton bilan de mobilité</h1>" +
        "<div class='kb2-score'><div class='kb2-rw'>" + ring(it.length - watch.length, it.length) + "<span><b>" + (it.length - watch.length) + "</b><small>sur " + it.length + "</small></span></div>" +
          "<div class='kb2-sc-t'><b>" + (watch.length ? watch.length + " point" + (watch.length > 1 ? "s" : "") + " à surveiller" : "Tout est dans les repères") + "</b><small>" + it.length + " mesures sur " + SECS.filter(function (s) { return it.some(function (x) { return x.sec === s[0]; }); }).length + " tests" + (prev ? " · comparé au " + fmtD(prev.d) : "") + "</small></div></div>" +
        (hist.length > 1 ? "<div class='kb-hist'>" + hist.map(function (h, i) { return "<button type='button' class='" + (i === idx ? "on" : "") + "' onclick='KineCamera.bilanShow(" + i + ")'>" + fmtD(h.d) + "</button>"; }).join("") + "</div>" : "") + "</section>" +
      synthHtml(R, me) + "<h2 class='kc2-h kb-det'>Le détail, test par test</h2><p class='kb-small kb2-hint'>Touche une mesure pour savoir ce qu'elle veut dire.</p>" + body +
      "<p class='kb-small kb-disc'>Valeurs approchées, calculées à partir de la vidéo : elles servent à suivre ton évolution et ne remplacent pas l'examen de ton kinésithérapeute. En cas de douleur, parles-en à ton kiné.</p>" +
      "<button class='kc2-go kb-go' onclick='KineCamera.bilan()'>Refaire un bilan <span aria-hidden='true'>→</span></button><button class='seq-btn-secondary' onclick='KineCamera.close()'>Fermer</button></div>";
    el.scrollTop = 0;
  }

  /* ── Synthèse prudente : quelques constats croisés, chacun avec des exercices de la bibliothèque ── */
  function synth(R, me) {
    var C = [], ok = function (n) { return window.KineBiblio && KineBiblio.find(n) ? n : null; };
    var add = function (pr, t, txt, ex) { C.push({ pr: pr, t: t, txt: txt, ex: ex.map(ok).filter(Boolean).slice(0, 3) }); };
    var uL = R.uniL && !R.uniL.skipped ? R.uniL : null, uR = R.uniR && !R.uniR.skipped ? R.uniR : null;
    var weakS = [], trS = [];
    if (uL && uL.s < 15) weakS.push("gauche"); if (uR && uR.s < 15) weakS.push("droite");
    if (uL && uL.drop >= 4) trS.push("gauche"); if (uR && uR.drop >= 4) trS.push("droite");
    if (weakS.length || trS.length)
      add(1, "Stabilité du bassin sur une jambe", (weakS.length ? "L'équilibre sur la jambe " + weakS.join(" et la jambe ") + " est plus court que la moyenne. " : "") +
        (trS.length ? "Le bassin descend du côté levé quand tu es en appui sur la jambe " + trS.join(" et la jambe ") + " : les muscles du côté de la hanche (moyen fessier) gagneraient à être renforcés. " : "") +
        "C'est l'un des points les plus utiles à travailler pour la marche et la prévention des chutes.",
        trS.length ? ["Clamshell", "Abduction hanche debout", "Marche latérale élastique", "Équilibre unipodal"] : ["Équilibre unipodal", "Tandem talon-pointe", "Abduction hanche debout"]);
    var t = R.sts, a = me.a, ref30 = a >= 60 ? 12 : 15, ref5 = a >= 80 ? 14.8 : a >= 70 ? 12.6 : a >= 60 ? 11.4 : 10, q = R.squat;
    var legs = (t && (t.n < ref30 || (t.t5 != null && t.t5 > ref5))) , deep = q && q.flex < 90;
    if (legs || deep)
      add(2, "Force et amplitude des jambes", (legs ? "Le test d'assis-debout est en dessous des repères" + (a ? " pour ton âge" : "") + ". " : "") + (deep ? "Le squat reste peu profond. " : "") +
        "Renforcer les cuisses et les fessiers aide à se lever, monter les escaliers et porter des charges.", ["Assis-debout de chaise", "Chaise contre le mur", "Squat bilatéral", "Pont de hanche"]);
    var ab = R.abd, fe = R.flexep, sh = [];
    if (ab) { if (ab.l < 150) sh.push("gauche"); if (ab.r < 150) sh.push("droite"); }
    var asym = ab && Math.abs(ab.l - ab.r) > 15, flexLow = fe && fe.a < 150, comp = (ab && ab.lean > 10) || (fe && fe.arch > 10);
    if (sh.length || asym || flexLow)
      add(3, "Mobilité des épaules", "Les bras ne montent pas tout à fait jusqu'au bout" + (sh.length === 1 ? ", surtout à " + sh[0] : "") + (asym ? ", avec une différence entre les deux côtés" : "") + ". " +
        (comp ? "Le dos compense un peu en fin de mouvement. " : "") + "Une mobilité d'épaule et du haut du dos entretenue soulage souvent la nuque et les épaules.",
        ["Wall slides", "Élévation du bâton bras tendus", "Rotation thoracique à quatre pattes"]);
    if (R.profil && R.profil.head != null && R.profil.head >= 20)
      add(4, "Position de la tête", "La tête est un peu en avant des épaules. C'est très courant (écrans, téléphone) ; renforcer le haut du dos aide à la ramener au-dessus des épaules.",
        ["Face pull à l'élastique", "Superman en Y et en W", "Écartement de serviette bras tendus", "Pull-apart à l'élastique"]);
    var d = R.dds, hpx = (R.profil && R.profil.hpx) || (R.face && R.face.hpx), cm = d && me.h && hpx ? Math.max(0, d.gap * me.h / hpx - 0.108 * me.h) : null;
    if (d && ((cm != null && cm > 10) || d.trunk < 70))
      add(5, "Souplesse de l'arrière des jambes et du dos", "En te penchant jambes tendues, les mains restent " + (cm != null ? "à environ " + Math.round(cm) + " cm du sol" : "assez loin du sol") + ". La souplesse des ischio-jambiers et du bas du dos se travaille bien, en douceur et régulièrement.",
        ["Good morning au bâton", "Chat-vache", "Inchworm et pompes"]);
    var f = R.face, kn = [];
    if (f) { if (Math.abs(f.kL) >= 6) kn.push("gauche"); if (Math.abs(f.kR) >= 6) kn.push("droit"); }
    if (kn.length && (f.kL >= 6 || f.kR >= 6))
      add(6, "Axe des genoux", "Debout, le genou " + kn.join(" et le genou ") + " part un peu vers l'intérieur. À confirmer en vrai : les vêtements amples faussent souvent cette mesure. Renforcer les fessiers aide le genou à rester dans l'axe.",
        ["Squat élastique aux genoux", "Clamshell", "Pont de hanche"]);
    if (R.profil && R.profil.knee <= -6)
      add(7, "Genoux en hyperextension", "Debout, les genoux partent un peu en arrière (recurvatum). Apprendre à les garder légèrement déverrouillés et renforcer l'arrière des cuisses aide à les protéger.",
        ["Pont ischio-jambiers talons sur chaise", "Leg curl serviette au sol"]);
    C.sort(function (x, y) { return x.pr - y.pr; });
    return C.slice(0, 4);
  }
  function synthHtml(R, me) {
    var C = synth(R, me);
    if (!C.length) return "<section class='kb-syn kb-syn-ok'><h2>Ce que montre ton bilan</h2><p>Rien de marquant : les mesures sont dans les repères habituels. Continue ton programme, et refais le bilan dans quelques semaines pour suivre ton évolution.</p></section>";
    return "<section class='kb-syn'><h2>Ce que montre ton bilan</h2><p class='kb-syn-in'>Quelques pistes, à confirmer avec ton kiné :</p>" + C.map(function (c, i) {
      return "<div class='kb-syn-c'><b><i>" + (i + 1) + "</i>" + esc(c.t) + "</b><p>" + esc(c.txt) + "</p>" +
        (c.ex.length ? "<div class='kb-syn-ex'>" + c.ex.map(function (n) { return "<button type='button' onclick='KineCamera.bilanEx(" + JSON.stringify(n).replace(/'/g, "&#39;") + ")'><svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M8 5v14l11-7z'/></svg>" + esc(n) + "</button>"; }).join("") + "</div>" : "") + "</div>";
    }).join("") + "</section>";
  }
  function bilanEx(n) { close(); setTimeout(function () { if (window.KineBiblio) KineBiblio.demo(n); }, 250); }
  function bilanTap(b) {
    var on = !b.classList.contains("open"), sec = b.closest(".kb2-sec");
    sec.querySelectorAll(".kb2-tile.open").forEach(function (x) { x.classList.remove("open"); });
    sec.querySelectorAll(".kb-fig .ln").forEach(function (l) { l.classList.remove("hl"); });
    if (on) { b.classList.add("open"); (b.getAttribute("data-k") || "").split(" ").forEach(function (k) { var m = { sh: "k-sh", hip: "k-hip", head: "k-head", pH: "k-pH" }[k]; if (m) { var l = sec.querySelector("." + m); if (l) l.classList.add("hl"); } }); }
  }
  function bilanShow(i) { var h = jget("kf-bilan-hist", [])[i]; if (!h) return bilanIntro(); PRID = "bilan"; PR = PROF.bilan; bilanResult({ res: h.res, snap: h.snap }, h, i); }

  /* ── Écrans ── */
  var S = null, PRID = "squat";   // séance caméra en cours
  function shell() {
    var el = $("kcam-run");
    if (!el) { el = document.createElement("div"); el.id = "kcam-run"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Analyse du mouvement à la caméra"); document.body.appendChild(el); }
    if (!el.classList.contains("open") && window.KineAvatar && KineAvatar.pause) KineAvatar.pause(true);
    el.classList.add("open"); document.body.classList.add("kf-lock");
    return el;
  }
  // Sans exercice précisé : le choix de l'exercice
  var AV = { squat: "Squat bilatéral", fente: "Fentes avant unilatérales", assis: "Assis-debout de chaise", pont: "Pont de hanche",
    pompes: "Pompes sur genoux", unipodal: "Équilibre unipodal", planche: "Plank — gainage avant-bras", chaise: "Chaise contre le mur" };
  var PITCH = { squat: "Je vérifie que tes genoux restent bien alignés", fente: "Je surveille ton genou avant et ton buste",
    assis: "Je vérifie que tu te lèves sans t'aider des mains", pont: "Je regarde si ton bassin monte assez haut",
    pompes: "Je surveille ton dos et ta descente", unipodal: "Je chronomètre et je te dis si tu vacilles",
    planche: "Je te dis si tes fesses montent ou si ton dos creuse", chaise: "Je vérifie l'angle de tes genoux" };
  var THUMB = {}, HERO = null;
  function thumb(k) {
    if (THUMB[k] !== undefined) return THUMB[k];
    try { THUMB[k] = window.KineAvatar && KineAvatar.supports(AV[k]) ? KineAvatar.snapshot(AV[k], 220) : null; } catch (e) { THUMB[k] = null; }
    return THUMB[k];
  }
  var EYE = "<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' aria-hidden='true'>";
  function viewTxt(p) { return p.views === "both" ? "De face ou de profil" : p.views === "profil" ? "De profil" : "De face"; }
  function picker() {
    var el = shell(); heroStop();
    var first = ORDER[0];
    el.innerHTML = "<div class='kcam-intro kc2'><button class='kf-back' onclick='KineCamera.close()' aria-label='Retour'>←</button>" +
      "<div class='kc2-hero'>" +
        "<div class='kc2-phone'><div class='kc2-av' id='kc2-av'></div>" +
          "<i class='kc2-c tl'></i><i class='kc2-c tr'></i><i class='kc2-c bl'></i><i class='kc2-c br'></i>" +
          "<span class='kc2-rec'><i></i>En direct</span>" +
          "<span class='kc2-cnt' id='kc2-cnt'>0</span><span class='kc2-ok' id='kc2-ok'>Bien !</span>" +
          "<span class='kc2-name' id='kc2-name'>" + esc(PROF[first].title) + "</span></div>" +
        "<div class='kc2-ht'><span class='kc2-tag'>Nouveau · essai</span>" +
          "<h1>Yass te regarde bouger</h1>" +
          "<p>Pose ton téléphone, recule, bouge. Yass compte pour toi et te corrige à voix haute.</p></div>" +
        "<button class='kc2-go' id='kc2-go' onclick='KineCamera.open(\"" + first + "\")'>Essayer le " + esc(PROF[first].title.toLowerCase()) + " <span aria-hidden='true'>→</span></button>" +
      "</div>" +
      "<div class='kc2-steps'>" +
        "<div><b>1</b><span>Pose le téléphone contre un mur</span></div>" +
        "<div><b>2</b><span>Recule de 2 à 3 pas</span></div>" +
        "<div><b>3</b><span>Bouge : Yass compte et te corrige</span></div></div>" +
      "<div class='kc2-feat'><span><i><svg viewBox=\'0 0 24 24\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><circle cx=\'12\' cy=\'5\' r=\'2\'/><path d=\'M12 7v6M8 21l4-8 4 8M7 10h10\'/></svg></i>Silhouette suivie en direct</span><span><i><svg viewBox=\'0 0 24 24\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><path d=\'M11 5 6 9H3v6h3l5 4z\'/><path d=\'M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13\'/></svg></i>Conseils à voix haute</span><span><i><svg viewBox=\'0 0 24 24\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><path d=\'M3 12a9 9 0 1 0 3-6.7L3 8\'/><path d=\'M3 3v5h5M12 8v4l3 2\'/></svg></i>Replay de ta série</span><span><i><svg viewBox=\'0 0 24 24\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><rect x=\'5\' y=\'11\' width=\'14\' height=\'10\' rx=\'2\'/><path d=\'M8 11V7a4 4 0 0 1 8 0v4\'/></svg></i>Rien ne quitte ton téléphone</span></div>" +
      "<button type='button' class='kb-card' onclick='KineCamera.bilan()'><span class='kb-card-ic' aria-hidden='true'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='4.5' r='2'/><path d='M12 7v7M7 9.5h10M9 21l3-7 3 7'/><path d='M3 3v4M3 3h4M21 3v4M21 3h-4M3 21v-4M3 21h4M21 21v-4M21 21h-4'/></svg></span>" +
        "<span class='kb-card-t'><small>Nouveau</small><b>Bilan de mobilité</b><span>8 tests guidés : posture, épaules, genoux, équilibre, souplesse, force. Environ 4 min.</span></span><span class='kb-card-go' aria-hidden='true'>›</span></button>" +
      "<h2 class='kc2-h'>Choisis ton exercice</h2>" +
      "<div class='kc2-grid'>" + ORDER.map(function (k) {
        var p = PROF[k], hold = p.mode === "hold", im = thumb(k);
        return "<button type='button' class='kc2-card " + (hold ? "hold" : "reps") + "' onclick='KineCamera.open(\"" + k + "\")'>" +
          "<span class='kc2-im'>" + (im ? "<img src='" + im + "' alt=''>" : "") + "<em>" + (hold ? "<svg viewBox='0 0 24 24' width='11' height='11' fill='none' stroke='currentColor' stroke-width='2.6' stroke-linecap='round' aria-hidden='true'><circle cx='12' cy='13' r='8'/><path d='M12 9v4l2 2M9 2h6'/></svg>Chrono" : "<svg viewBox='0 0 24 24' width='11' height='11' fill='none' stroke='currentColor' stroke-width='2.6' stroke-linecap='round' aria-hidden='true'><path d='M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5'/></svg>Répétitions") + "</em></span>" +
          "<b>" + esc(p.title) + "</b><small>" + esc(PITCH[k] || "") + "</small>" +
          "<span class='kc2-v'>" + EYE + "<path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/></svg>" + viewTxt(p) + "</span></button>";
      }).join("") + "</div>" + modeHtml() +
      "<p class='kc2-priv'>L'analyse se fait uniquement sur ton téléphone : aucune image ne quitte l'appareil.</p></div>";
    heroStart();
  }
  // Le héros : Yass fait les exercices l'un après l'autre, dans un « écran de caméra », avec le compteur qui tourne
  function heroStop() {
    if (!HERO) return; var h = HERO; HERO = null; clearTimeout(h.t); clearInterval(h.ti);
    try { if (h.A && h.A.hide) h.A.hide(); } catch (e) {}
  }
  function heroStart() {
    if (!window.KineLumiere || !KineLumiere.avatar || !KineLumiere.loop) return;
    var h = HERO = { k: 0, A: null };
    var box = $("kc2-av"); if (!box) return;
    var alive = function () { return HERO === h && box.isConnected && !!box.querySelector("canvas") && !document.hidden; };
    KineLumiere.avatar(7, function (A) {
      if (!A || HERO !== h) return; h.A = A;
      var seq = ["squat", "fente", "assis", "pompes", "planche", "chaise"];
      (function next() {
        if (HERO !== h || !box.isConnected) return;
        var k = seq[h.k++ % seq.length], n = AV[k], p = PROF[k];
        if (!A.supports(n) && KineAvatar._def && KineAvatar._def(n)) A.register(n, KineAvatar._def(n));
        if (!A.supports(n) || !A.show(box, n)) { h.t = setTimeout(next, 50); return; }
        if (A.pause) A.pause(false);
        KineLumiere.loop(A, n, alive);
        var nm = $("kc2-name"), cnt = $("kc2-cnt"), ok = $("kc2-ok"), go = $("kc2-go");
        if (nm) nm.textContent = p.title;
        if (go) { go.setAttribute("onclick", "KineCamera.open(\"" + k + "\")"); go.innerHTML = "Essayer " + (/^[aeéiouh]/i.test(p.title) ? "l'" : (p.title === "Planche" || p.title.indexOf("Chaise") === 0 || p.title.indexOf("Fente") === 0 ? "la " : p.title.indexOf("Pompes") === 0 ? "les " : "le ")) + esc(p.title.toLowerCase()) + " <span aria-hidden='true'>→</span>"; }
        var c = 0, hold = p.mode === "hold"; if (cnt) { cnt.textContent = hold ? "0 s" : "0"; cnt.className = "kc2-cnt" + (hold ? " hold" : ""); }
        clearInterval(h.ti);
        h.ti = setInterval(function () {
          if (HERO !== h) return; c++;
          if (cnt) { cnt.textContent = hold ? c + " s" : String(Math.floor(c / 2)); cnt.classList.remove("pop"); void cnt.offsetWidth; cnt.classList.add("pop"); }
          if (ok && c % 4 === 2) { ok.classList.remove("on"); void ok.offsetWidth; ok.classList.add("on"); }
        }, hold ? 1000 : 1150);
        h.t = setTimeout(next, 6800);
      })();
    });
  }
  /* Pendant les séances : jamais, bouton proposé (par défaut) ou caméra lancée d'office */
  var MODES = [["off", "Jamais"], ["ask", "Bouton proposé"], ["auto", "Automatique"]];
  function mode() { var m = jget("kf-cam-sess", "ask"); return m === "off" || m === "auto" ? m : "ask"; }
  function modeHtml() {
    var m = mode();
    return "<div class='kcam-mode'><b>Pendant mes séances</b><div class='kf-chips'>" + MODES.map(function (x) {
      return "<button type='button' class='" + (x[0] === m ? "sel" : "") + "' onclick='KineCamera.setMode(\"" + x[0] + "\")'>" + x[1] + "</button>"; }).join("") + "</div>" +
      "<small id='kcam-mode-h'>" + modeHint(m) + "</small></div>";
  }
  function modeHint(m) {
    return m === "off" ? "La caméra n'apparaît pas pendant les séances. Tu peux toujours l'ouvrir d'ici."
      : m === "auto" ? "Pour les exercices compatibles, la caméra s'ouvre d'elle-même au début de chaque série."
      : "Pour les exercices compatibles, un bouton propose de faire la série devant la caméra.";
  }
  function setMode(m) {
    jset("kf-cam-sess", m);
    document.querySelectorAll(".kcam-mode").forEach(function (box) {
      box.querySelectorAll("button").forEach(function (b) { b.classList.toggle("sel", b.getAttribute("onclick").indexOf('"' + m + '"') >= 0); });
      var h = box.querySelector("small"); if (h) h.textContent = modeHint(m);
    });
    if (m !== "off") sessionButton(); else { var b = $("kcam-sess"); if (b) b.remove(); }
  }
  function modeSheet() {
    var el = $("kcam-modesheet");
    if (!el) { el = document.createElement("div"); el.id = "kcam-modesheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='document.getElementById(\"kcam-modesheet\").classList.remove(\"open\")' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>La caméra pendant les séances</div>" + modeHtml() + "</div>";
    el.classList.add("open");
  }
  function open(pid, opt) {
    if (!pid || !PROF[pid]) { picker(); return; }
    heroStop();
    if (pid === "bilan") { bilanIntro(); return; }
    PRID = pid; PR = PROF[pid]; OPT = opt || {};
    var el = shell(), seen = jget("kf-cam-seen", 0);
    if (typeof kfvPreloadAll === "function") { try { kfvPreloadAll("camera"); } catch (e) {} }
    var tgt = OPT.target ? (PR.mode === "hold" ? OPT.target + " secondes" + (PR.sides ? " par jambe" : "") : OPT.target + " répétitions") : "";
    el.innerHTML = "<div class='kcam-intro'><button class='kf-back' onclick='KineCamera." + (OPT.session ? "close" : "open") + "()' aria-label='Retour'>←</button>" +
      "<div class='kcam-badge'>Essai</div><div class='kf-h1'>" + esc(PR.title) + " à la caméra</div>" +
      "<div class='kf-sub'>Yass repère tes articulations, dessine ta silhouette et te guide à voix haute. " + (PR.mode === "hold" ? "Il chronomètre la tenue." : "Il compte tes répétitions.") +
        (tgt ? " Objectif : <strong>" + esc(tgt) + "</strong>." : "") + "</div>" +
      "<div class='kcam-steps'>" +
        "<div><b>1</b><span>Pose le téléphone contre un objet stable" + (PR.calib === "stand" || PR.calib === "sit" || PRID === "chaise" ? ", à hauteur de la taille." : ", au sol ou bas.") + "</span></div>" +
        "<div><b>2</b><span>Recule à 2 ou 3 mètres : on doit voir <strong>tout le corps</strong>.</span></div>" +
        PR.steps.map(function (t, i) { return "<div><b>" + (i + 3) + "</b><span>" + t + "</span></div>"; }).join("") +
      "</div>" +
      "<p class='lx-muted kcam-note'>L'image reste sur ton téléphone : rien n'est envoyé. " + (seen ? "" : "Au premier lancement, l'appli télécharge l'outil d'analyse (environ 15 Mo, une seule fois, le Wi-Fi est conseillé).") + "</p>" +
      "<p class='lx-muted kcam-note'>C'est une aide, pas un bilan : en cas de douleur, arrête et parles-en à ton kiné.</p>" +
      (OPT.session ? modeHtml() : "") +
      "<p class='kcam-err' id='kcam-err' role='alert'></p>" +
      "<button class='seq-btn-main' id='kcam-go'>Activer la caméra</button></div>";
    $("kcam-go").onclick = start;
  }

  function start() {
    var err = $("kcam-err"), go = $("kcam-go");
    function fail(t) { if (err) err.textContent = t; if (go) { go.disabled = false; go.textContent = "Réessayer"; } }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { fail("Ce téléphone ne permet pas d'utiliser la caméra depuis l'appli."); return; }
    go.disabled = true; go.textContent = "Préparation…";
    if (typeof getAudioCtx === "function") { try { var c = getAudioCtx(); if (c && c.state === "suspended") c.resume(); } catch (e) {} }
    var facing = jget("kf-cam-facing", "user");
    navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } } }).then(function (stream) {
      run(stream, facing); audioWatch();
      return detector().then(function (det) { jset("kf-cam-seen", 1); if (S) { S.det = det; S.status(PR.calib === "stand" ? "stand" : ""); } })
        .catch(function () { if (S) S.status("err", "L'outil d'analyse n'a pas pu se charger. Vérifie ta connexion, puis réessaie."); });
    }).catch(function (e) {
      fail(e && e.name === "NotAllowedError" ? "L'accès à la caméra est refusé. Autorise-le dans les réglages du téléphone (Réglages, puis Safari ou ton navigateur, puis Caméra), puis réessaie."
           : "La caméra n'a pas pu s'ouvrir. Ferme les autres applis qui l'utilisent, puis réessaie.");
    });
  }

  function fmtT(ms) { var s = Math.floor(ms / 1000); return s + " s"; }
  function counters() {
    if (!A) return;
    if (PR.mode === "bilan") { var b = A.b || { i: 0 }, D = [1, 2, 3, 3, 4, 5, 6, 7, 8]; $("kcam-reps").textContent = D[Math.min(b.i, D.length - 1)] + "/8"; $("kcam-good").textContent = b.live || "–"; return; }
    if (PR.mode === "hold") {
      var H = A.hold;
      $("kcam-reps").textContent = PR.sides ? fmtT(H.side.l) : fmtT(H.t);
      $("kcam-good").textContent = PR.sides ? fmtT(H.side.r) : (H.t ? Math.round(H.goodT / Math.max(1, H.t) * 100) : 0) + " %";
    } else { $("kcam-reps").textContent = A.reps; $("kcam-good").textContent = A.good; }
  }
  function run(stream, facing) {
    var el = shell(), hold = PR.mode === "hold";
    var lab1 = hold ? (PR.sides ? "jambe gauche" : "tenue") : "répétitions", lab2 = hold ? (PR.sides ? "jambe droite" : "aligné") : "correctes";
    var bil = PR.mode === "bilan"; if (bil) { lab1 = "test"; lab2 = "mesure"; }
    el.innerHTML = "<div class='kcam-stage' id='kcam-stage'><video id='kcam-video' playsinline muted autoplay></video><canvas id='kcam-canvas'></canvas>" +
      "<div class='kcam-top'><button class='kcam-x' onclick='KineCamera.finish()' aria-label='Terminer'>✕</button>" +
        "<div class='kcam-count'><b id='kcam-reps'>0</b><small>" + lab1 + "</small></div><div class='kcam-count kcam-ok" + (bil ? " kb-meas" : "") + "'><b id='kcam-good'>0</b><small>" + lab2 + "</small></div>" +
        "<button class='kcam-flip kcam-snd' id='kcam-snd' onclick='KineCamera.mute()' aria-label='Couper ou remettre la voix'>" + sndIc(muted()) + "</button>" +
        "<button class='kcam-flip' onclick='KineCamera.flip()' aria-label='Changer de caméra'>⟲</button></div>" +
      "<div class='kcam-view' id='kcam-view'></div>" + (bil ? "<div class='kb-demo' id='kb-demo' aria-hidden='true'><div class='kb-demo-av'></div><span>Yass te montre</span></div>" : "") +
      "<div class='kcam-msg' id='kcam-msg' role='status'>Chargement de l'analyse…</div>" +
      (bil ? "<div class='kcam-end kb-end'><button class='seq-btn-secondary' onclick='KineCamera.bilanSkip()'>Passer ce test</button><button class='seq-btn-main' onclick='KineCamera.finish()'>Terminer</button></div>"
           : "<button class='seq-btn-main kcam-end' onclick='KineCamera.finish()'>Terminer</button>") + "</div>";
    counters();
    var stg = $("kcam-stage"); if (stg) stg.addEventListener("touchend", function () { if (audioUp()) sndTip(false); }, { passive: true });
    var v = $("kcam-video"), cv = $("kcam-canvas"), ctx = cv.getContext("2d");
    v.srcObject = stream; if (facing !== "user") { v.style.transform = "none"; }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    resetAnalysis();
    var wake = null; try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    S = { stream: stream, facing: facing, det: null, raf: 0, lastT: -1, lost: 0, wake: function () { return wake; },
          status: function (k, t) { var m = $("kcam-msg"); if (!m) return; m.className = "kcam-msg" + (k === "err" ? " bad" : ""); m.textContent = t || MSG[k] || "Je te cherche…"; } };
    var msgUntil = 0;
    function show(t, cls, ms) { var m = $("kcam-msg"); if (!m || !t) return; m.textContent = t; m.className = "kcam-msg " + (cls || ""); msgUntil = performance.now() + (ms || 2500); }
    function idle() {
      var m = $("kcam-msg"); if (!m) return;
      if (bil) { var bb = A.b, bs = bb && BSTEPS[bb.i]; var tb = !bs ? "Bilan terminé." : bb.ph === "go" ? (bs.kind === "still" ? "Ne bouge plus…" : "Mesure en cours…") : bs.say; if (m.textContent !== tb) { m.textContent = tb; m.className = "kcam-msg idle"; } return; }
      var t = A.phase === "calib" ? (PR.calib === "lie" ? "Allonge-toi sur le dos, genoux pliés, de profil." : PR.calib === "stand" ? MSG.stand : PR.calibSay)
            : hold ? (A.hold.inPose ? "Tiens, respire normalement." : PR === PROF.unipodal ? "Lève un pied pour lancer le chrono." : PR === PROF.chaise ? "Descends en position, dos au mur, pour lancer le chrono." : "Mets-toi en planche pour lancer le chrono.")
            : (A.reps ? "Continue à ton rythme." : PR.go);
      if (m.textContent !== t) { m.textContent = t; m.className = "kcam-msg idle"; }
    }
    function loop() {
      if (!S || !$("kcam-video")) return;
      S.raf = requestAnimationFrame(loop);
      var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      if (bil && !A.b) { A.b = { i: 0, ph: "intro", t: performance.now() + 1e9, S: [], res: {}, snap: {}, asp: asp, pre: true }; }
      if (bil) demoSync();
      if (!S.det || v.readyState < 2 || !v.videoWidth) return;
      if (v.currentTime === S.lastT) return; S.lastT = v.currentTime;
      asp = v.videoWidth / v.videoHeight;
      var res; try { res = S.det.detectForVideo(v, performance.now()); } catch (e) { return; }
      var box = (function () { var s = Math.min(W / v.videoWidth, H / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s; return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h }; })();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var lm = res && res.landmarks && res.landmarks[0];
      if (lm && S.facing !== "user") lm = lm.map(function (q) { return { x: 1 - q.x, y: q.y, z: q.z, visibility: q.visibility }; });
      var now = performance.now();
      if (!lm || !visible(lm)) {
        S.lost++; draw(ctx, lm ? smooth(lm) : null, W, H, box);
        if (S.lost > 12 && now > msgUntil) { show(MSG.far, "warn", 1200); if (now - (S.farSaid || 0) > 7000) { S.farSaid = now; say(V.far); } }
        if (A.hold) A.hold.lastT = now;
        if (S.rec) S.rec.frames.push({ t: now - S.rec.t0, lm: null });
        return;
      }
      S.lost = 0;
      var sm = smooth(lm), out = analyse(sm, now);
      draw(ctx, sm, W, H, box);
      if (bil) { bilanDraw(ctx, sm, box, W); counters(); demoSync(); }
      $("kcam-view").textContent = A.phase === "run" ? (A.view === "profil" ? "Vue de profil" : "Vue de face") : "";
      if (A.phase === "run" && !S.rec) recStart(v);
      if (S.rec) {
        S.rec.frames.push({ t: now - S.rec.t0, lm: sm.map(function (q) { return [+q.x.toFixed(4), +q.y.toFixed(4), +(q.visibility || 0).toFixed(2)]; }), bad: Object.keys(A.live) });
        if (out && (out.rep || (out.live && hold))) S.rec.reps.push({ t: now - S.rec.t0, ok: !!out.ok, faults: out.faults || (out.live ? [liveKey(out)] : []) });
      }
      if (hold) counters();
      if (out) {
        if (out.rep) { counters(); if (navigator.vibrate) try { navigator.vibrate(out.ok ? 25 : [40, 60, 40]); } catch (e) {} }
        show(out.msg, out.cls || (out.rep ? (out.ok ? "ok" : "bad") : ""), out.rep ? 2600 : bil ? 1600 : 2000);
        if (out.voice) say(out.voice, out.live ? 2 : 1);
        if (out.finish) setTimeout(function () { if (S) finish(); }, 2600);
      } else if (now > msgUntil) idle();
    }
    S.raf = requestAnimationFrame(loop);
  }
  function liveKey(out) { for (var k in V) if (V[k] === out.voice) return k; return ""; }

  /* ── Enregistrement pour le replay : reste dans le téléphone, effacé à la fermeture ── */
  var REPLAY = null;
  function recStart(v) {
    var rec = S.rec = { t0: performance.now(), frames: [], reps: [], mr: null, chunks: [], type: "", vw: v.videoWidth, vh: v.videoHeight, facing: S.facing, hold: PR.mode === "hold" };
    try {
      if (!window.MediaRecorder) return;
      var types = ["video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"], t = "";
      for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) { t = types[i]; break; }
      var mr = new MediaRecorder(S.stream, t ? { mimeType: t, videoBitsPerSecond: 900000 } : undefined);
      rec.type = mr.mimeType || t || "video/webm";
      mr.ondataavailable = function (e) { if (e.data && e.data.size) rec.chunks.push(e.data); };
      mr.start(1000); rec.mr = mr; rec.t0 = performance.now();
    } catch (e) { rec.mr = null; }
  }
  function stop() {
    if (!S) return;
    cancelAnimationFrame(S.raf);
    if (S.rec && S.rec.mr && S.rec.mr.state !== "inactive") { try { S.rec.mr.stop(); } catch (e) {} }
    try { S.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { var w = S.wake(); if (w) w.release(); } catch (e) {}
    S = null;
  }
  function close() {
    heroStop(); demoStop(); stop(); if (REPLAY && REPLAY.url) URL.revokeObjectURL(REPLAY.url); REPLAY = null;
    var el = $("kcam-run"); if (el) { el.classList.remove("open"); el.innerHTML = ""; }
    document.body.classList.remove("kf-lock");
    if (window.KineAvatar && KineAvatar.pause) KineAvatar.pause(false);
  }
  function flip() {
    if (!S) return;
    var f = S.facing === "user" ? "environment" : "user"; jset("kf-cam-facing", f);
    var det = S.det; stop();
    navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: f, width: { ideal: 640 }, height: { ideal: 480 } } }).then(function (st) { run(st, f); S.det = det; S.status(""); })
      .catch(function () { open(PRID, OPT); });
  }
  // Retour à la séance : la série faite devant la caméra compte comme une série de la séance
  function validate() {
    close();
    if (typeof finishSerie === "function" && window.rgState && rgState.active) { try { finishSerie(); } catch (e) {} }
  }
  function finish() {
    if (PR && PR.mode === "bilan") { var ab = A; demoStop(); stop(); if (ab && ab.b) bilanResult(ab.b); else bilanIntro(); return; }
    var a = A, rec = S && S.rec;
    if (rec && rec.mr) {
      rec.blobP = new Promise(function (res) {
        var done = function () { res(rec.chunks.length ? new Blob(rec.chunks, { type: rec.type }) : null); };
        if (rec.mr.state === "inactive") done(); else { rec.mr.onstop = done; setTimeout(done, 2500); }
      });
    }
    stop();
    var hold = PR.mode === "hold", H = a && a.hold;
    if (!a || (hold ? H.t < 2000 : !a.reps)) { if (OPT.session) close(); else open(PRID, OPT); return; }
    if (REPLAY && REPLAY.url) URL.revokeObjectURL(REPLAY.url);
    REPLAY = rec && rec.frames.length > 10 ? rec : null;
    if (REPLAY) say(V.end);
    var el = shell(), counts = {}, main, nTot;
    if (hold) { counts = H.cnt; nTot = 0; }
    else a.log.forEach(function (r) { r.faults.forEach(function (f) { counts[f] = (counts[f] || 0) + 1; }); });
    main = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })[0];
    var hist = jget("kf-cam-hist", []);
    hist.unshift({ d: new Date().toISOString().slice(0, 10), ex: PRID, reps: a.reps, good: a.good, t: hold ? Math.round(H.t / 1000) : 0, main: main || null, view: a.view, s: !!OPT.session });
    jset("kf-cam-hist", hist.slice(0, 40));
    var big = hold
      ? (PR.sides ? "<div><b>" + fmtT(H.side.l) + "</b><small>jambe gauche</small></div><div><b>" + fmtT(H.side.r) + "</b><small>jambe droite</small></div>"
                  : "<div><b>" + fmtT(H.t) + "</b><small>bien aligné</small></div><div class='ok'><b>" + (H.t ? Math.round(H.goodT / Math.max(1, H.t) * 100) : 0) + " %</b><small>du temps</small></div>")
      : "<div><b>" + a.reps + "</b><small>répétitions</small></div><div class='ok'><b>" + a.good + "</b><small>correctes</small></div>";
    var tip = main ? "<p class='kcam-tip'><strong>À travailler :</strong> " + esc(FIX[main]) + (hold ? " (" + counts[main] + " rappel" + (counts[main] > 1 ? "s" : "") + ")" : " (" + counts[main] + " fois sur " + a.reps + ")") + ". " + esc(MSG[main]) + "</p>"
                   : "<p class='kcam-tip ok'><strong>Bravo :</strong> aucun défaut repéré sur cette série.</p>";
    var more = PR === PROF.unipodal ? "<p class='lx-muted kcam-note'>Pied posé " + H.touch + " fois.</p>" : (PR.tip[a.view] ? "<p class='lx-muted kcam-note'>Analyse " + (a.view === "profil" ? "de profil" : "de face") + ". Essaie aussi " + PR.tip[a.view] + "</p>" : "");
    el.innerHTML = "<div class='kcam-intro kcam-end-sheet'><div class='kf-h1'>Bilan : " + esc(PR.title.toLowerCase()) + "</div>" +
      "<div class='kcam-big'>" + big + "</div>" + tip + more +
      (REPLAY ? "<button class='seq-btn-main kcam-replay-btn' onclick='KineCamera.replay()'>▶ Revoir ma série</button>" +
                "<p class='lx-muted kcam-note'>Le replay reste dans ton téléphone et s'efface quand tu fermes.</p>" : "") +
      (OPT.session ? "<button class='seq-btn-main' onclick='KineCamera.validate()'>Valider la série et continuer</button>" : "") +
      "<button class='seq-btn-secondary' onclick='KineCamera.again()'>Recommencer</button><button class='seq-btn-secondary' onclick='KineCamera.close()'>" + (OPT.session ? "Retour à la séance sans valider" : "Fermer") + "</button></div>";
    el.__sum = el.innerHTML;
  }

  /* ── Replay de la série : la vidéo (si le téléphone sait l'enregistrer) avec la silhouette et les défauts ── */
  function replay() {
    var R = REPLAY; if (!R) return;
    var el = shell(), sum = el.__sum;
    var chips = R.reps.map(function (r, i) {
      return "<button type='button' class='kcam-chip " + (r.ok ? "ok" : "bad") + "' data-t='" + Math.max(0, r.t - 2600) + "'>" + (R.hold ? "" : (i + 1)) + (r.ok ? " ✓" : (R.hold ? "" : " · ") + esc(FIX[r.faults[0]] || "")) + "</button>";
    }).join("");
    el.innerHTML = "<div class='kcam-stage'><video id='kcam-rv' playsinline muted></video><canvas id='kcam-rc'></canvas>" +
      "<div class='kcam-top'><button class='kcam-x' id='kcam-rback' aria-label='Retour au bilan'>←</button><div class='kcam-rtitle'>Replay</div>" +
        "<button class='kcam-flip kcam-speed' id='kcam-speed'>1×</button></div>" +
      "<div class='kcam-chips'>" + chips + "</div>" +
      "<div class='kcam-rbar'><button class='kcam-play' id='kcam-play' aria-label='Lecture ou pause'>❚❚</button><div class='kcam-prog'><i id='kcam-pfill'></i></div></div></div>";
    var v = $("kcam-rv"), cv = $("kcam-rc"), ctx = cv.getContext("2d"), speed = 1, raf = 0, useVid = false;
    var total = R.frames.length ? R.frames[R.frames.length - 1].t : 0, clock = { t: 0, last: performance.now(), playing: true };
    if (R.facing !== "user") v.style.transform = "none";
    function nowT() { return useVid ? v.currentTime * 1000 : clock.t; }
    function frameAt(t) { var a = 0, b = R.frames.length - 1; while (a < b) { var m = (a + b + 1) >> 1; if (R.frames[m].t <= t) a = m; else b = m - 1; } return R.frames[a]; }
    function tick() {
      raf = requestAnimationFrame(tick);
      if (!cv.isConnected) { cancelAnimationFrame(raf); return; }
      var now = performance.now();
      if (!useVid && clock.playing) { clock.t += (now - clock.last) * speed; if (clock.t > total) clock.t = 0; }
      clock.last = now;
      var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var s = Math.min(W / R.vw, H / R.vh), box = { w: R.vw * s, h: R.vh * s }; box.x = (W - box.w) / 2; box.y = (H - box.h) / 2;
      var f = frameAt(nowT()), bad = {};
      if (f && f.bad) f.bad.forEach(function (k) { bad[k] = 1; });
      draw(ctx, f && f.lm ? f.lm.map(function (q) { return { x: q[0], y: q[1], visibility: q[2] }; }) : null, W, H, box, bad);
      var pf = $("kcam-pfill"); if (pf && total) pf.style.width = Math.min(100, nowT() / total * 100) + "%";
    }
    function setPlay(on) { clock.playing = on; if (useVid) { if (on) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); } $("kcam-play").textContent = on ? "❚❚" : "▶"; }
    function seek(t) { if (useVid) { try { v.currentTime = t / 1000; } catch (e) {} } else clock.t = t; setPlay(true); }
    $("kcam-play").onclick = function () { setPlay(!(useVid ? !v.paused : clock.playing)); };
    $("kcam-speed").onclick = function () { speed = speed === 1 ? 0.5 : 1; v.playbackRate = speed; this.textContent = speed === 1 ? "1×" : "0,5×"; };
    $("kcam-rback").onclick = function () { cancelAnimationFrame(raf); try { v.pause(); } catch (e) {} el.innerHTML = sum; el.__sum = sum; };
    el.querySelectorAll(".kcam-chip").forEach(function (b) { b.onclick = function () { seek(+b.getAttribute("data-t")); }; });
    v.onended = function () { setPlay(false); };
    (R.blobP || Promise.resolve(null)).then(function (blob) {
      if (blob && cv.isConnected) {
        if (!R.url) R.url = URL.createObjectURL(blob);
        v.src = R.url; useVid = true;
        v.onloadedmetadata = function () {   // vidéos webm sans durée connue : on la fait calculer pour pouvoir avancer dans le replay
          if (v.duration === Infinity) { v.currentTime = 1e7; v.ontimeupdate = function () { v.ontimeupdate = null; v.currentTime = 0; setPlay(true); }; }
          else setPlay(true);
        };
      } else { v.remove(); }
      raf = requestAnimationFrame(tick);
    });
  }

  /* ── Depuis la séance : bouton « Vérifier avec la caméra » sur l'écran de l'exercice ── */
  function targetOf(ex) {
    var lbl = String(window.KineProgress && KineProgress.repsLabel ? KineProgress.repsLabel(ex) : ex.repsLabel || ""), n = parseInt(lbl, 10) || 0;
    if (/seconde/i.test(lbl)) return n;
    return /par (jambe|côté)/i.test(lbl) && EX_MAP[ex.name] === "fente" ? n * 2 : n;
  }
  function sessionButton() {
    var old = $("kcam-sess"); if (old) old.remove();
    var ov = $("seq-overlay"); if (!ov || !ov.classList.contains("open") || typeof SEQ_DAYS === "undefined") return;
    var ex = SEQ_DAYS[seqCurrentDay] && SEQ_DAYS[seqCurrentDay].exercises[seqExIdx];
    var pid = ex && EX_MAP[ex.name]; if (!pid) return;
    var m = mode(); if (m === "off") return;
    var stage = document.querySelector("#rep-guide .v2-stage"); if (!stage) return;
    var opts = { session: true, target: targetOf(ex), ex: ex.name };
    // Une pastille discrète en haut de la scène, comme « Angles »
    var b = document.createElement("button"); b.type = "button"; b.id = "kcam-sess"; b.className = "kcam-pill";
    b.setAttribute("aria-label", "Faire cette série devant la caméra");
    b.innerHTML = "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><circle cx='12' cy='13' r='3.5'/></svg>Caméra";
    b.onclick = function () { open(pid, opts); };
    stage.appendChild(b);
    if (window.KineExplique) setTimeout(function () { KineExplique.once("camera", $("kv-level") || $("rg2-cue")); }, 300);
    // Mode automatique : la caméra s'ouvre seule (une fois par série, quand l'écran de l'exercice est prêt)
    if (m === "auto" && !(S || ($("kcam-run") && $("kcam-run").classList.contains("open")))) {
      var key = seqCurrentDay + ":" + seqExIdx + ":" + (window.rgState ? rgState.currentSerie : "");
      if (window.__kcamAuto !== key) { window.__kcamAuto = key; setTimeout(function () { open(pid, opts); if ($("kcam-go")) start(); }, 400); }
    }
  }
  function hookSession() {
    if (typeof window.launchRepGuide !== "function" || window.launchRepGuide.__kcam) return;
    var base = window.launchRepGuide;
    window.launchRepGuide = launchRepGuide = function () { var r = base.apply(this, arguments); try { sessionButton(); } catch (e) {} return r; };
    window.launchRepGuide.__kcam = true;
  }

  /* ── Carte dans la bibliothèque ── */
  function libCard() {
    var box = $("kb-sheet"); if (!box) return;
    var body = box.querySelector(".kf-sheet-body"); if (!body || body.querySelector(".kcam-libcard")) return;
    var after = body.querySelector(".kr-libcard") || body.querySelector(".kb-chips"); if (!after) return;
    var c = document.createElement("button");
    c.type = "button"; c.className = "kr-libcard kcam-libcard";
    c.innerHTML = "<span class='kcam-ico' aria-hidden='true'><svg viewBox='0 0 24 24' width='26' height='26' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'><circle cx='12' cy='4.5' r='2'/><path d='M12 7v6M7 10l5 1 5-1M12 13l-3 6M12 13l3 6'/></svg></span>" +
      "<span class='kr-lt'><b>Mon mouvement à la caméra <em class='kcam-tag'>essai</em></b><small>Squat, fente, pont, équilibre, planche : Yass suit tes articulations et te guide</small></span><span aria-hidden='true'>›</span>";
    c.onclick = function () { open(); };
    after.parentNode.insertBefore(c, after.nextSibling);
  }
  function watch() { var box = $("kb-sheet"); if (!box || box.__kcam) return; box.__kcam = 1; new MutationObserver(libCard).observe(box, { childList: true }); libCard(); }

  function sndIc(m) { return "<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M11 5 6 9H3v6h3l5 4z'/>" + (m ? "<path d='m16 9 5 6M21 9l-5 6'/>" : "<path d='M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13'/>") + "</svg>"; }
  function mute() { var m = !muted(); jset("kf-cam-mute", m ? 1 : 0); var b = $("kcam-snd"); if (b) b.innerHTML = sndIc(m); if (!m) say("Bien !"); }
  window.KineCamera = { setMode: setMode, mode: mode, modeSheet: modeSheet, open: open, close: close, finish: finish, flip: flip, replay: replay, mute: mute, validate: validate,
    again: function () { open(PRID, OPT); }, bilan: function () { open("bilan"); }, bilanSkip: bilanSkip, bilanTap: bilanTap, bilanShow: bilanShow, bilanEx: bilanEx, forExercise: function (n) { return EX_MAP[n] || null; },
    _state: function () { return A; },
    // banc d'essai : alimente le bilan avec des points détectés hors caméra
    _t: { det: detector, setup: function (ar) { PRID = "bilan"; PR = PROF.bilan; OPT = {}; asp = ar || 1; resetAnalysis(); },
          feed: function (lm, t) { var sm = smooth(lm); if (!visible(sm)) return { lost: 1 }; var o = analyse(sm, t); var b = A.b || {}; return { out: o, i: b.i, ph: b.ph, live: b.live, view: A.view }; },
          result: function () { bilanResult(A.b); }, demo: function (Av) { return demoDefs(Av); } } };
  function init() { watch(); new MutationObserver(watch).observe(document.body, { childList: true }); hookSession(); setTimeout(hookSession, 1600); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
