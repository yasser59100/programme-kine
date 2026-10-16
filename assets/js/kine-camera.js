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
  function say(t, prio) {
    if (typeof speak !== "function" || muted() || !t) return;
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
    stand: "Restez debout, immobile, quelques secondes.", far: "Reculez un peu, je dois voir tout votre corps.",
    side: "Placez-vous de profil, s'il vous plaît.", front: "Placez-vous face à la caméra, s'il vous plaît.",
    good: ["Bien !", "Très bien !", "Parfait !", "Propre !"], shallow: "Un peu plus bas, si ça ne fait pas mal.",
    end: "Série terminée, bravo ! Regardez votre replay.", target: "Objectif atteint, bravo !",
    fast: "Descendez plus lentement.", abrupt: "Remontez en contrôlant.", fastUp: "Montez en contrôlant.", hold: "Tenez une seconde en haut.",
    valgus: "Genoux vers l'extérieur !", shift: "Le poids bien au milieu !", lean: "Poitrine haute !", heel: "Talons au sol !",
    lean2: "Buste droit !", knee: "Genou dans l'axe du pied !", pelvis: "Bassin bien horizontal !", sway: "Restez bien droit !",
    low: "Montez les hanches plus haut !", arch: "Ne cambrez pas, serrez les fessiers !",
    high: "Fesses trop hautes !", sag: "Le bassin s'affaisse, rentrez le ventre !",
    hands: "Sans les mains, croisez les bras !", partial: "Redressez-vous complètement en haut.", plop: "Asseyez-vous en douceur.",
    chest: "Descendez la poitrine plus bas.", wallUp: "Descendez un peu, cuisses à l'horizontale.", wallLow: "Remontez un peu, genoux à angle droit.",
    att: { valgus: "Attention aux genoux.", shift: "Attention à l'équilibre.", lean: "Attention au buste.", heel: "Attention aux talons.",
           lean2: "Attention au buste.", knee: "Attention au genou.", pelvis: "Attention au bassin.", low: "Attention à la hauteur.", arch: "Attention au dos.",
           fast: "Descendez plus lentement.", abrupt: "Remontez en contrôlant.", fastUp: "Montez en contrôlant.", hold: "Tenez une seconde en haut.",
           hands: "Sans les mains.", partial: "Redressez-vous complètement.", plop: "Asseyez-vous en douceur.", sag: "Attention au bassin.", high: "Attention au bassin." }
  };
  var MSG = {
    stand: "Tenez-vous debout, immobile.", far: "Reculez un peu : il faut voir tout le corps, de la tête aux pieds.",
    side: "Placez-vous de profil par rapport au téléphone.", front: "Placez-vous face au téléphone.",
    good: ["Bien !", "Très bien !", "Parfait, continuez.", "Propre !"], shallow: "Bien. Si c'est sans douleur, vous pouvez descendre un peu plus.",
    valgus: "Les genoux rentrent vers l'intérieur. Poussez-les vers l'extérieur, dans l'axe des pieds.",
    shift: "Vous vous décalez sur un côté. Répartissez le poids sur les deux jambes.",
    lean: "Le buste part trop en avant. Gardez la poitrine plus haute.", heel: "Les talons se décollent. Gardez-les bien au sol.",
    lean2: "Le buste penche. Gardez-le bien droit, au-dessus du bassin.", knee: "Le genou rentre vers l'intérieur. Gardez-le dans l'axe du pied.",
    pelvis: "Le bassin penche d'un côté. Gardez-le bien horizontal.", sway: "Le buste penche sur le côté. Restez bien droit.",
    low: "Les hanches ne montent pas assez. Montez jusqu'à aligner épaules, hanches et genoux.",
    arch: "Le dos se cambre en haut. Serrez les fessiers plutôt que de creuser le dos.",
    high: "Les fesses sont trop hautes. Descendez-les jusqu'à faire une ligne droite.",
    sag: "Le bassin s'affaisse. Rentrez le ventre et serrez les fessiers.",
    fast: "La descente est trop rapide. Descendez en 2 secondes environ.", abrupt: "La remontée est brusque. Remontez en contrôlant.",
    fastUp: "La montée est trop rapide. Montez en contrôlant.", hold: "Marquez une petite pause en haut avant de redescendre.",
    hands: "Vous poussez sur les mains. Croisez les bras sur la poitrine et levez-vous avec les jambes.",
    partial: "Vous ne vous redressez pas complètement. Tendez les hanches et les genoux en haut.",
    plop: "Vous vous laissez tomber sur la chaise. Asseyez-vous en douceur, en 2 secondes.",
    chest: "La poitrine ne descend pas assez. Pliez les coudes un peu plus, si c'est sans douleur.",
    wallUp: "Vous êtes trop haut. Descendez jusqu'à avoir les cuisses à l'horizontale.",
    wallLow: "Vous êtes trop bas. Remontez un peu, genoux à angle droit."
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
    squat: { title: "Squat", mode: "reps", views: "both", calib: "stand", go: "C'est bon, je vous vois. Faites vos squats, à votre rythme.", tempo: true,
      steps: ["<strong>De face</strong> : Yass surveille les genoux et l'équilibre.", "<strong>De profil</strong> : le buste, les talons, la profondeur et le rythme."],
      tip: { face: "de profil pour vérifier le buste, les talons et le rythme.", profil: "de face pour vérifier les genoux." } },
    fente: { title: "Fente avant", mode: "reps", views: "both", calib: "stand", go: "C'est bon, je vous vois. Faites vos fentes, à votre rythme.", tempo: true,
      steps: ["<strong>De profil</strong> : Yass surveille le buste, la profondeur et le rythme.", "<strong>De face</strong> : le genou de devant et le bassin."],
      tip: { face: "de profil pour vérifier le buste et le rythme.", profil: "de face pour vérifier le genou et le bassin." } },
    pont: { title: "Pont de hanche", mode: "reps", views: "profil", calib: "lie", calibSay: "Allongez-vous sur le dos, genoux pliés, de profil.",
      go: "C'est bon, je vous vois. Montez les hanches, à votre rythme.", tempo: true,
      steps: ["Allongez-vous sur le dos, genoux pliés, <strong>de profil</strong> par rapport au téléphone, posé au sol à 2 mètres.", "Yass vérifie la hauteur des hanches, le dos et la pause en haut."],
      tip: {} },
    unipodal: { title: "Équilibre sur une jambe", mode: "hold", views: "face", calib: "stand", calibSay: "Restez debout, face à la caméra.",
      go: "Levez un pied, je lance le chrono.", sides: true, target: 30,
      steps: ["Debout <strong>face</strong> au téléphone. Le chrono tourne seulement quand un pied est levé.", "Yass surveille le bassin, le genou d'appui et le buste."],
      tip: {} },
    planche: { title: "Planche", mode: "hold", views: "profil", calib: "none", calibSay: "Mettez-vous en planche, de profil.",
      go: "C'est parti, tenez la position.", target: 30,
      steps: ["En planche <strong>de profil</strong> par rapport au téléphone, posé au sol à 2 mètres.", "Le chrono ne tourne que si le corps est bien aligné."],
      tip: {} },
    assis: { title: "Assis-debout de chaise", mode: "reps", views: "profil", calib: "sit", calibSay: "Asseyez-vous sur la chaise, de profil, et restez immobile.",
      go: "C'est bon, je vous vois. Levez-vous, puis rasseyez-vous, à votre rythme.",
      steps: ["Chaise <strong>de profil</strong> par rapport au téléphone, bras croisés sur la poitrine.", "Yass compte les relevers, vérifie que vous ne poussez pas sur les mains, que vous vous redressez en entier et que vous vous rasseyez en douceur."],
      tip: {} },
    pompes: { title: "Pompes sur genoux", mode: "reps", views: "profil", calib: "none", calibSay: "Mettez-vous en position, sur les genoux, de profil.",
      go: "C'est parti, faites vos pompes à votre rythme.",
      steps: ["Sur les genoux, mains sous les épaules, <strong>de profil</strong> par rapport au téléphone, posé au sol à 2 mètres.", "Yass compte les pompes, vérifie que la poitrine descend assez et que le corps reste bien droit."],
      tip: {} },
    chaise: { title: "Chaise contre le mur", mode: "hold", views: "profil", calib: "none", calibSay: "Dos au mur, descendez en position, de profil.",
      go: "C'est parti, tenez la position.", target: 30,
      steps: ["Dos au mur, <strong>de profil</strong> par rapport au téléphone.", "Le chrono ne tourne que si les genoux sont à peu près à angle droit, cuisses à l'horizontale."],
      tip: {} }
  };
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
    c.near = (lm[I.lKn].visibility || 0) >= (lm[I.rKn].visibility || 0) ? "l" : "r";
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
        if ((A.base.heelY - c.N.he.y) / A.base.leg > 0.06) { flag("heel"); A.live[c.near + "He"] = 1; }
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
      if ((L.lWr.v > 0.5 && near(L.lWr)) || (L.rWr.v > 0.5 && near(L.rWr))) flag("hands");
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
      var b = A.base || (A.base = { y: c.hip.y, leg: c.leg, heelY: c.N.he.y, thigh: dist(c.N.hip, c.N.kn), dev: above(c.N.hip, c.N.sh, c.N.kn) });
      b.y = b.y * 0.8 + c.hip.y * 0.2; b.leg = b.leg * 0.8 + c.leg * 0.2; b.heelY = b.heelY * 0.8 + c.N.he.y * 0.2; b.thigh = b.thigh * 0.8 + dist(c.N.hip, c.N.kn) * 0.2; b.dev = b.dev * 0.8 + above(c.N.hip, c.N.sh, c.N.kn) * 0.2;
    } else { A.still = 0; A.stillT = 0; }
    if (PR.calib === "none" || (A.still >= 3 && now - A.stillT > 1000)) { A.phase = "run"; A.hold.lastT = now; return PR.calib === "none" ? null : { msg: PR.go, voice: PR.go }; }
    if (!A.calibSaid) { A.calibSaid = 1; return { msg: PR.calib === "lie" ? "Allongez-vous sur le dos, genoux pliés, de profil." : PR.calib === "sit" ? "Asseyez-vous sur la chaise, de profil, bras croisés." : MSG.stand, voice: PR.calibSay || V.stand }; }
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
      if (!H.inPose) { H.inPose = true; H.started = true; H.outT = 0; if (!H.saidGo) { H.saidGo = 1; out = { msg: PR === PROF.unipodal ? "Chrono lancé !" : "C'est parti, tenez la position.", voice: PR === PROF.unipodal ? null : PR.go }; } }
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
        if (PR === PROF.unipodal) { H.touch++; out = { msg: "Pied posé. On reprend quand vous voulez.", voice: "Pied posé. On reprend quand vous voulez.", cls: "warn" }; }
        else out = { msg: "Chrono en pause, replacez-vous.", voice: "Chrono en pause, replacez-vous.", cls: "warn" };
      }
    }
    // Objectif de temps
    var tgt = (OPT.target || PR.target) * 1000;
    if (!H.done) {
      if (PR.sides) {
        if (side !== "x" && H.side[side] >= tgt && !H["ok" + side]) {
          H["ok" + side] = 1; var other = side === "l" ? "r" : "l";
          if (H["ok" + other]) { H.done = true; return { msg: "Objectif atteint, bravo !", voice: V.target, cls: "ok", finish: true }; }
          return { msg: "Objectif atteint ! Changez de jambe.", voice: "Objectif atteint, bravo ! Changez de jambe.", cls: "ok" };
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
  function picker() {
    var el = shell();
    el.innerHTML = "<div class='kcam-intro'><button class='kf-back' onclick='KineCamera.close()' aria-label='Retour'>←</button>" +
      "<div class='kcam-badge'>Essai</div><div class='kf-h1'>Mon mouvement à la caméra</div>" +
      "<div class='kf-sub'>Yass repère vos articulations, dessine votre silhouette, vous guide à voix haute et vous montre le replay de votre série.</div>" +
      "<div class='kcam-pick'>" + ORDER.map(function (k) {
        var p = PROF[k];
        return "<button type='button' onclick='KineCamera.open(\"" + k + "\")'><b>" + esc(p.title) + "</b><small>" + (p.mode === "hold" ? "Tenue chronométrée" : "Répétitions comptées") + ", " +
          (p.views === "both" ? "de face ou de profil" : p.views === "profil" ? "de profil" : "de face") + "</small><span aria-hidden='true'>›</span></button>";
      }).join("") + "</div>" + modeHtml() + "</div>";
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
    return m === "off" ? "La caméra n'apparaît pas pendant les séances. Vous pouvez toujours l'ouvrir d'ici."
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
    PRID = pid; PR = PROF[pid]; OPT = opt || {};
    var el = shell(), seen = jget("kf-cam-seen", 0);
    if (typeof kfvPreloadAll === "function") { try { kfvPreloadAll("camera"); } catch (e) {} }
    var tgt = OPT.target ? (PR.mode === "hold" ? OPT.target + " secondes" + (PR.sides ? " par jambe" : "") : OPT.target + " répétitions") : "";
    el.innerHTML = "<div class='kcam-intro'><button class='kf-back' onclick='KineCamera." + (OPT.session ? "close" : "open") + "()' aria-label='Retour'>←</button>" +
      "<div class='kcam-badge'>Essai</div><div class='kf-h1'>" + esc(PR.title) + " à la caméra</div>" +
      "<div class='kf-sub'>Yass repère vos articulations, dessine votre silhouette et vous guide à voix haute. " + (PR.mode === "hold" ? "Il chronomètre la tenue." : "Il compte vos répétitions.") +
        (tgt ? " Objectif : <strong>" + esc(tgt) + "</strong>." : "") + "</div>" +
      "<div class='kcam-steps'>" +
        "<div><b>1</b><span>Posez le téléphone contre un objet stable" + (PR.calib === "stand" || PR.calib === "sit" || PRID === "chaise" ? ", à hauteur de la taille." : ", au sol ou bas.") + "</span></div>" +
        "<div><b>2</b><span>Reculez à 2 ou 3 mètres : on doit voir <strong>tout le corps</strong>.</span></div>" +
        PR.steps.map(function (t, i) { return "<div><b>" + (i + 3) + "</b><span>" + t + "</span></div>"; }).join("") +
      "</div>" +
      "<p class='lx-muted kcam-note'>L'image reste sur votre téléphone : rien n'est envoyé. " + (seen ? "" : "Au premier lancement, l'appli télécharge l'outil d'analyse (environ 15 Mo, une seule fois, le Wi-Fi est conseillé).") + "</p>" +
      "<p class='lx-muted kcam-note'>C'est une aide, pas un bilan : en cas de douleur, arrêtez et parlez-en à votre kiné.</p>" +
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
      run(stream, facing);
      return detector().then(function (det) { jset("kf-cam-seen", 1); if (S) { S.det = det; S.status(PR.calib === "stand" ? "stand" : ""); } })
        .catch(function () { if (S) S.status("err", "L'outil d'analyse n'a pas pu se charger. Vérifiez votre connexion, puis réessayez."); });
    }).catch(function (e) {
      fail(e && e.name === "NotAllowedError" ? "L'accès à la caméra est refusé. Autorisez-le dans les réglages du téléphone (Réglages, puis Safari ou votre navigateur, puis Caméra), puis réessayez."
           : "La caméra n'a pas pu s'ouvrir. Fermez les autres applis qui l'utilisent, puis réessayez.");
    });
  }

  function fmtT(ms) { var s = Math.floor(ms / 1000); return s + " s"; }
  function counters() {
    if (!A) return;
    if (PR.mode === "hold") {
      var H = A.hold;
      $("kcam-reps").textContent = PR.sides ? fmtT(H.side.l) : fmtT(H.t);
      $("kcam-good").textContent = PR.sides ? fmtT(H.side.r) : (H.t ? Math.round(H.goodT / Math.max(1, H.t) * 100) : 0) + " %";
    } else { $("kcam-reps").textContent = A.reps; $("kcam-good").textContent = A.good; }
  }
  function run(stream, facing) {
    var el = shell(), hold = PR.mode === "hold";
    var lab1 = hold ? (PR.sides ? "jambe gauche" : "tenue") : "répétitions", lab2 = hold ? (PR.sides ? "jambe droite" : "aligné") : "correctes";
    el.innerHTML = "<div class='kcam-stage' id='kcam-stage'><video id='kcam-video' playsinline muted autoplay></video><canvas id='kcam-canvas'></canvas>" +
      "<div class='kcam-top'><button class='kcam-x' onclick='KineCamera.finish()' aria-label='Terminer'>✕</button>" +
        "<div class='kcam-count'><b id='kcam-reps'>0</b><small>" + lab1 + "</small></div><div class='kcam-count kcam-ok'><b id='kcam-good'>0</b><small>" + lab2 + "</small></div>" +
        "<button class='kcam-flip kcam-snd' id='kcam-snd' onclick='KineCamera.mute()' aria-label='Couper ou remettre la voix'>" + (muted() ? "🔇" : "🔊") + "</button>" +
        "<button class='kcam-flip' onclick='KineCamera.flip()' aria-label='Changer de caméra'>⟲</button></div>" +
      "<div class='kcam-view' id='kcam-view'></div>" +
      "<div class='kcam-msg' id='kcam-msg' role='status'>Chargement de l'analyse…</div>" +
      "<button class='seq-btn-main kcam-end' onclick='KineCamera.finish()'>Terminer</button></div>";
    counters();
    var v = $("kcam-video"), cv = $("kcam-canvas"), ctx = cv.getContext("2d");
    v.srcObject = stream; if (facing !== "user") { v.style.transform = "none"; }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    resetAnalysis();
    var wake = null; try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    S = { stream: stream, facing: facing, det: null, raf: 0, lastT: -1, lost: 0, wake: function () { return wake; },
          status: function (k, t) { var m = $("kcam-msg"); if (!m) return; m.className = "kcam-msg" + (k === "err" ? " bad" : ""); m.textContent = t || MSG[k] || "Je vous cherche…"; } };
    var msgUntil = 0;
    function show(t, cls, ms) { var m = $("kcam-msg"); if (!m || !t) return; m.textContent = t; m.className = "kcam-msg " + (cls || ""); msgUntil = performance.now() + (ms || 2500); }
    function idle() {
      var m = $("kcam-msg"); if (!m) return;
      var t = A.phase === "calib" ? (PR.calib === "lie" ? "Allongez-vous sur le dos, genoux pliés, de profil." : PR.calib === "stand" ? MSG.stand : PR.calibSay)
            : hold ? (A.hold.inPose ? "Tenez, respirez normalement." : PR === PROF.unipodal ? "Levez un pied pour lancer le chrono." : PR === PROF.chaise ? "Descendez en position, dos au mur, pour lancer le chrono." : "Mettez-vous en planche pour lancer le chrono.")
            : (A.reps ? "Continuez à votre rythme." : PR.go);
      if (m.textContent !== t) { m.textContent = t; m.className = "kcam-msg idle"; }
    }
    function loop() {
      if (!S || !$("kcam-video")) return;
      S.raf = requestAnimationFrame(loop);
      var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
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
      $("kcam-view").textContent = A.phase === "run" ? (A.view === "profil" ? "Vue de profil" : "Vue de face") : "";
      if (A.phase === "run" && !S.rec) recStart(v);
      if (S.rec) {
        S.rec.frames.push({ t: now - S.rec.t0, lm: sm.map(function (q) { return [+q.x.toFixed(4), +q.y.toFixed(4), +(q.visibility || 0).toFixed(2)]; }), bad: Object.keys(A.live) });
        if (out && (out.rep || (out.live && hold))) S.rec.reps.push({ t: now - S.rec.t0, ok: !!out.ok, faults: out.faults || (out.live ? [liveKey(out)] : []) });
      }
      if (hold) counters();
      if (out) {
        if (out.rep) { counters(); if (navigator.vibrate) try { navigator.vibrate(out.ok ? 25 : [40, 60, 40]); } catch (e) {} }
        show(out.msg, out.cls || (out.rep ? (out.ok ? "ok" : "bad") : ""), out.rep ? 2600 : 2000);
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
    stop(); if (REPLAY && REPLAY.url) URL.revokeObjectURL(REPLAY.url); REPLAY = null;
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
    var more = PR === PROF.unipodal ? "<p class='lx-muted kcam-note'>Pied posé " + H.touch + " fois.</p>" : (PR.tip[a.view] ? "<p class='lx-muted kcam-note'>Analyse " + (a.view === "profil" ? "de profil" : "de face") + ". Essayez aussi " + PR.tip[a.view] + "</p>" : "");
    el.innerHTML = "<div class='kcam-intro kcam-end-sheet'><div class='kf-h1'>Bilan : " + esc(PR.title.toLowerCase()) + "</div>" +
      "<div class='kcam-big'>" + big + "</div>" + tip + more +
      (REPLAY ? "<button class='seq-btn-main kcam-replay-btn' onclick='KineCamera.replay()'>▶ Revoir ma série</button>" +
                "<p class='lx-muted kcam-note'>Le replay reste dans votre téléphone et s'efface quand vous fermez.</p>" : "") +
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
      "<span class='kr-lt'><b>Mon mouvement à la caméra <em class='kcam-tag'>essai</em></b><small>Squat, fente, pont, équilibre, planche : Yass suit vos articulations et vous guide</small></span><span aria-hidden='true'>›</span>";
    c.onclick = function () { open(); };
    after.parentNode.insertBefore(c, after.nextSibling);
  }
  function watch() { var box = $("kb-sheet"); if (!box || box.__kcam) return; box.__kcam = 1; new MutationObserver(libCard).observe(box, { childList: true }); libCard(); }

  function mute() { var m = !muted(); jset("kf-cam-mute", m ? 1 : 0); var b = $("kcam-snd"); if (b) b.textContent = m ? "🔇" : "🔊"; if (!m) say("Bien !"); }
  window.KineCamera = { setMode: setMode, mode: mode, modeSheet: modeSheet, open: open, close: close, finish: finish, flip: flip, replay: replay, mute: mute, validate: validate,
    again: function () { open(PRID, OPT); }, forExercise: function (n) { return EX_MAP[n] || null; },
    _state: function () { return A; } };
  function init() { watch(); new MutationObserver(watch).observe(document.body, { childList: true }); hookSession(); setTimeout(hookSession, 1600); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
