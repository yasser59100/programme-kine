/* ═══════════ KinéForce — Mon squat à la caméra (essai) ═══════════
   La caméra du téléphone repère les grandes articulations (épaules, hanches, genoux, chevilles…),
   dessine la silhouette par-dessus l'image, compte les répétitions et vérifie le mouvement.
   Tout se passe sur le téléphone : l'image n'est ni enregistrée ni envoyée.
   Détection : MediaPipe Pose Landmarker (Google, licence Apache 2.0), fichiers hébergés avec l'appli (assets/pose). */
(function () {
  "use strict";
  var BASE = "assets/pose/";
  var I = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28, lHe: 29, rHe: 30, lToe: 31, rToe: 32 };
  var BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]];
  var JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32];
  var LEGS = [11, 12, 23, 24, 25, 26, 27, 28];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // Yass parle même si la voix des séances est coupée (bouton haut-parleur propre à la caméra)
  function muted() { return !!jget("kf-cam-mute", 0); }
  function say(t, prio) {
    if (typeof speak !== "function" || muted() || !t) return;
    var a = window.seqSoundOn, b = window.seqVoiceOn;
    try { window.seqSoundOn = true; window.seqVoiceOn = true; speak(t, { prio: prio || 1, now: true, ttl: 3500 }); } catch (e) {}
    window.seqSoundOn = a; window.seqVoiceOn = b;
  }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ── Chargement du détecteur (une seule fois) ── */
  var detP = null;
  function detector() {
    if (detP) return detP;
    detP = import(new URL(BASE + "vision_bundle.mjs", location.href).href).then(function (V) {
      return V.FilesetResolver.forVisionTasks(new URL(BASE + "wasm", location.href).href).then(function (files) {
        var opts = function (dlg) { return { baseOptions: { modelAssetPath: new URL(BASE + "pose_landmarker_lite.task", location.href).href, delegate: dlg },
                                              runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }; };
        return V.PoseLandmarker.createFromOptions(files, opts("GPU")).catch(function () { return V.PoseLandmarker.createFromOptions(files, opts("CPU")); });
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
  function tilt(top, bottom) { return Math.abs(Math.atan2(top.x - bottom.x, bottom.y - top.y) * 180 / Math.PI); }   // inclinaison par rapport à la verticale

  /* ── Analyse du squat ── */
  var A = null;
  function resetAnalysis() {
    A = { phase: "calib", still: 0, standY: 0, legLen: 0, heelY: 0, view: "face", viewVotes: 0, down: false, maxDrop: 0, minKnee: 180,
          flags: {}, reps: 0, good: 0, log: [], lastMsg: 0, smooth: null, live: {} };
  }
  function smooth(lm) {
    if (!A.smooth) { A.smooth = lm.map(function (p) { return { x: p.x, y: p.y, z: p.z, visibility: p.visibility }; }); return A.smooth; }
    for (var i = 0; i < lm.length; i++) {
      var s = A.smooth[i], p = lm[i], k = 0.55;
      s.x += (p.x - s.x) * k; s.y += (p.y - s.y) * k; s.visibility = p.visibility;
    }
    return A.smooth;
  }
  // Tout le corps d'au moins un côté doit être visible (de profil, l'autre côté est caché)
  function visible(lm) {
    var ok = function (ids) { for (var i = 0; i < ids.length; i++) if ((lm[ids[i]].visibility || 0) < 0.5) return false; return true; };
    return ok([11, 23, 25, 27]) || ok([12, 24, 26, 28]);
  }

  var MSG = {
    calib: "Tenez-vous debout, immobile, face à la caméra ou de profil.",
    far: "Reculez un peu : il faut voir tout le corps, de la tête aux pieds.",
    go: "C'est bon ! Faites vos squats, à votre rythme.",
    good: ["Bien !", "Très bien !", "Parfait, continuez.", "Propre !"],
    valgus: "Les genoux rentrent vers l'intérieur. Poussez-les vers l'extérieur, dans l'axe des pieds.",
    shift: "Vous vous décalez sur un côté. Répartissez le poids sur les deux jambes.",
    lean: "Le buste part trop en avant. Gardez la poitrine plus haute.",
    heel: "Les talons se décollent. Gardez-les bien au sol.",
    shallow: "Bien. Si c'est sans douleur, vous pouvez descendre un peu plus."
  };
  // Ce que Yass dit à voix haute : court, pour être compris de loin
  var V = {
    calib: "Restez debout, immobile, quelques secondes.", far: "Reculez un peu, je dois voir tout votre corps.",
    go: "C'est bon, je vous vois. Faites vos squats, à votre rythme.",
    valgus: "Genoux vers l'extérieur !", shift: "Le poids bien au milieu !", lean: "Poitrine haute !", heel: "Talons au sol !",
    good: ["Bien !", "Très bien !", "Parfait !", "Propre !"], shallow: "Un peu plus bas, si ça ne fait pas mal.",
    att: { valgus: "Attention aux genoux.", shift: "Attention à l'équilibre.", lean: "Attention au buste.", heel: "Attention aux talons." },
    end: "Série terminée, bravo ! Regardez votre replay."
  };
  var SHORT = { valgus: "Genoux vers l'extérieur !", shift: "Le poids bien au milieu !", lean: "Poitrine haute !", heel: "Talons au sol !" };
  var FIX = { valgus: "genoux qui rentrent", shift: "décalage sur un côté", lean: "buste trop penché", heel: "talons qui se décollent" };

  function analyse(lm, now) {
    var L = {};
    ["lSh", "rSh", "lHip", "rHip", "lKn", "rKn", "lAn", "rAn", "lHe", "rHe", "lToe", "rToe"].forEach(function (k) { L[k] = P(lm, I[k]); });
    var hip = mid(L.lHip, L.rHip), sh = mid(L.lSh, L.rSh), an = mid(L.lAn, L.rAn);
    var leg = (dist(L.lHip, L.lAn) + dist(L.rHip, L.rAn)) / 2;
    if (A.view === "profil") leg = (lm[I.lKn].visibility || 0) >= (lm[I.rKn].visibility || 0) ? dist(L.lHip, L.lAn) : dist(L.rHip, L.rAn);
    var shW = Math.abs(L.lSh.x - L.rSh.x), torso = dist(sh, hip);
    // De face ou de profil : épaules étroites par rapport au tronc → de profil
    var prof = shW / Math.max(0.01, torso) < 0.42;
    A.viewVotes = Math.max(-15, Math.min(15, A.viewVotes + (prof ? 1 : -1)));
    A.view = A.viewVotes > 4 ? "profil" : A.viewVotes < -4 ? "face" : A.view;
    // Côté le plus visible (de profil)
    var near = (lm[I.lKn].visibility || 0) >= (lm[I.rKn].visibility || 0) ? "l" : "r";
    var kneeAng = near === "l" ? angle(L.lHip, L.lKn, L.lAn) : angle(L.rHip, L.rKn, L.rAn);
    var kneeBoth = A.view === "profil" ? kneeAng : Math.min(angle(L.lHip, L.lKn, L.lAn), angle(L.rHip, L.rKn, L.rAn));
    var live = A.live = {};

    if (A.phase === "calib") {
      var straight = kneeBoth > 158;
      if (straight) { A.still++; if (!A.stillT) A.stillT = now; A.standY = A.standY ? A.standY * 0.8 + hip.y * 0.2 : hip.y; A.legLen = A.legLen ? A.legLen * 0.8 + leg * 0.2 : leg;
                      A.heelY = A.heelY ? A.heelY * 0.8 + Math.max(L.lHe.y, L.rHe.y) * 0.2 : Math.max(L.lHe.y, L.rHe.y); }
      else { A.still = 0; A.stillT = 0; }
      if (A.still >= 5 && now - A.stillT > 1300) { A.phase = "run"; return { msg: MSG.go, voice: V.go }; }
      if (!A.calibSaid) { A.calibSaid = 1; return { msg: MSG.calib, voice: V.calib }; }
      return { msg: MSG.calib };
    }

    var drop = (hip.y - A.standY) / Math.max(0.05, A.legLen);
    if (!A.down && drop < 0.05 && kneeBoth > 160) { A.standY = A.standY * 0.95 + hip.y * 0.05; A.legLen = A.legLen * 0.95 + leg * 0.05; }
    // Contrôles pendant la descente
    if (drop > 0.14) {
      if (A.view === "face") {
        var hipW = Math.max(0.02, Math.abs(L.lHip.x - L.rHip.x));
        // Genoux qui rentrent : l'écart entre les genoux devient nettement plus petit que l'écart entre les chevilles
        var kas = Math.abs(L.lKn.x - L.rKn.x) / Math.max(0.02, Math.abs(L.lAn.x - L.rAn.x));
        if (kas < 0.75) { live.lKn = live.rKn = 1; A.flags.valgus = (A.flags.valgus || 0) + 1; }
        if (Math.abs(hip.x - an.x) / hipW > 0.45) { live.shift = 1; A.flags.shift = (A.flags.shift || 0) + 1; }
      } else {
        var Ls = near === "l" ? [L.lSh, L.lHip, L.lKn, L.lAn, L.lHe] : [L.rSh, L.rHip, L.rKn, L.rAn, L.rHe];
        var trunk = tilt(Ls[0], Ls[1]), tibia = tilt(Ls[2], Ls[3]);
        if (trunk > tibia + 28 && trunk > 45) { live.trunk = 1; A.flags.lean = (A.flags.lean || 0) + 1; }
        if ((A.heelY - Ls[4].y) / A.legLen > 0.06) { live[near + "He"] = 1; A.flags.heel = (A.flags.heel || 0) + 1; }
      }
    }
    if (!A.down && drop > 0.16) { A.down = true; A.maxDrop = drop; A.minKnee = kneeAng; A.flags = {}; A.nf = 0; A.cued = {}; }
    if (A.down) A.nf++;
    // Consigne en direct, dès qu'un défaut se répète pendant la descente (une fois par répétition)
    if (A.down) for (var fk in A.flags) if (A.flags[fk] >= 2 && !A.cued[fk]) { A.cued[fk] = 1; return { msg: SHORT[fk], voice: V[fk], live: true, cls: "bad" }; }
    if (A.down) { A.maxDrop = Math.max(A.maxDrop, drop); A.minKnee = Math.min(A.minKnee, A.view === "profil" ? kneeAng : kneeBoth); }
    if (A.down && drop < 0.07) {
      A.down = false; A.reps++;
      var need = Math.max(2, Math.round(A.nf * 0.25)), fl = A.flags;   // défaut retenu s'il est vu sur au moins un quart de la répétition
      var faults = Object.keys(fl).filter(function (k) { return fl[k] >= need; });
      var deep = A.view === "profil" ? A.minKnee < 105 : A.maxDrop > 0.2;
      if (!faults.length) A.good++;
      A.log.push({ faults: faults, deep: deep });
      var m = faults.length ? MSG[faults[0]] : deep ? MSG.good[A.reps % MSG.good.length] : MSG.shallow;
      var vo = A.reps + ". " + (faults.length ? V.att[faults[0]] : deep ? V.good[A.reps % V.good.length] : V.shallow);
      return { msg: m, voice: vo, rep: true, ok: !faults.length, faults: faults };
    }
    return null;
  }

  /* ── Dessin de la silhouette ── */
  function draw(ctx, lm, W, H, box, badSet) {
    ctx.clearRect(0, 0, W, H);
    if (!lm) return;
    var pt = function (i) { return [box.x + (1 - lm[i].x) * box.w, box.y + lm[i].y * box.h]; };   // image en miroir
    var bad = badSet || (A ? A.live : {});
    var badBone = function (a, b) { return (bad.trunk && ((a === 11 && b === 23) || (a === 12 && b === 24))); };
    ctx.lineCap = "round";
    BONES.forEach(function (b) {
      if ((lm[b[0]].visibility || 0) < 0.4 || (lm[b[1]].visibility || 0) < 0.4) return;
      var p = pt(b[0]), q = pt(b[1]);
      ctx.strokeStyle = badBone(b[0], b[1]) ? "rgba(255,77,94,.95)" : "rgba(255,255,255,.85)"; ctx.lineWidth = Math.max(4, W / 90);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    });
    var key = { 25: "lKn", 26: "rKn", 29: "lHe", 30: "rHe" };
    JOINTS.forEach(function (i) {
      if ((lm[i].visibility || 0) < 0.4) return;
      var p = pt(i), r = i === 0 ? Math.max(7, W / 45) : Math.max(6, W / 55), red = key[i] && bad[key[i]];
      ctx.fillStyle = red ? "#FF4D5E" : (i >= 23 ? "#22D3EE" : "#4FACFE");
      ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p[0], p[1], red ? r * 1.35 : r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  }

  /* ── Écrans ── */
  var S = null;   // séance caméra en cours
  function shell() {
    var el = $("kcam-run");
    if (!el) { el = document.createElement("div"); el.id = "kcam-run"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Analyse du squat à la caméra"); document.body.appendChild(el); }
    el.classList.add("open"); document.body.classList.add("kf-lock");
    return el;
  }
  function open() {
    var el = shell(), seen = jget("kf-cam-seen", 0);
    if (typeof kfvPreloadAll === "function") { try { kfvPreloadAll("camera"); } catch (e) {} }
    el.innerHTML = "<div class='kcam-intro'><button class='kf-back' onclick='KineCamera.close()' aria-label='Retour'>←</button>" +
      "<div class='kcam-badge'>Essai</div><div class='kf-h1'>Mon squat à la caméra</div>" +
      "<div class='kf-sub'>Yass repère vos articulations avec la caméra, dessine votre silhouette et vous dit si le mouvement est correct. Il compte aussi vos répétitions.</div>" +
      "<div class='kcam-steps'>" +
        "<div><b>1</b><span>Posez le téléphone debout, à hauteur de la taille, contre un objet stable.</span></div>" +
        "<div><b>2</b><span>Reculez à 2 ou 3 mètres : on doit voir <strong>tout le corps</strong>, de la tête aux pieds.</span></div>" +
        "<div><b>3</b><span><strong>De face</strong> : Yass surveille les genoux et l'équilibre. <strong>De profil</strong> : le buste, les talons et la profondeur.</span></div>" +
        "<div><b>4</b><span>Restez debout immobile 2 secondes, puis faites vos squats à votre rythme.</span></div>" +
      "</div>" +
      "<p class='lx-muted kcam-note'>L'image reste sur votre téléphone : rien n'est enregistré ni envoyé. " + (seen ? "" : "Au premier lancement, l'appli télécharge l'outil d'analyse (environ 15 Mo, une seule fois, le Wi-Fi est conseillé).") + "</p>" +
      "<p class='lx-muted kcam-note'>C'est une aide, pas un bilan : en cas de douleur, arrêtez et parlez-en à votre kiné.</p>" +
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
    var camP = navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } } });
    camP.then(function (stream) {
      run(stream, facing);
      return detector().then(function (det) { jset("kf-cam-seen", 1); if (S) { S.det = det; S.status("calib"); } })
        .catch(function () { if (S) S.status("err", "L'outil d'analyse n'a pas pu se charger. Vérifiez votre connexion, puis réessayez."); });
    }).catch(function (e) {
      fail(e && e.name === "NotAllowedError" ? "L'accès à la caméra est refusé. Autorisez-le dans les réglages du téléphone (Réglages, puis Safari ou votre navigateur, puis Caméra), puis réessayez."
           : "La caméra n'a pas pu s'ouvrir. Fermez les autres applis qui l'utilisent, puis réessayez.");
    });
  }

  function run(stream, facing) {
    var el = shell();
    el.innerHTML = "<div class='kcam-stage' id='kcam-stage'><video id='kcam-video' playsinline muted autoplay></video><canvas id='kcam-canvas'></canvas>" +
      "<div class='kcam-top'><button class='kcam-x' onclick='KineCamera.finish()' aria-label='Terminer'>✕</button>" +
        "<div class='kcam-count'><b id='kcam-reps'>0</b><small>répétitions</small></div><div class='kcam-count kcam-ok'><b id='kcam-good'>0</b><small>correctes</small></div>" +
        "<button class='kcam-flip kcam-snd' id='kcam-snd' onclick='KineCamera.mute()' aria-label='Couper ou remettre la voix'>" + (muted() ? "🔇" : "🔊") + "</button>" +
        "<button class='kcam-flip' onclick='KineCamera.flip()' aria-label='Changer de caméra'>⟲</button></div>" +
      "<div class='kcam-view' id='kcam-view'></div>" +
      "<div class='kcam-msg' id='kcam-msg' role='status'>Chargement de l'analyse…</div>" +
      "<button class='seq-btn-main kcam-end' onclick='KineCamera.finish()'>Terminer</button></div>";
    var v = $("kcam-video"), cv = $("kcam-canvas"), ctx = cv.getContext("2d");
    v.srcObject = stream; if (facing !== "user") { v.style.transform = "none"; }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    resetAnalysis();
    var wake = null; try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    S = { stream: stream, facing: facing, det: null, raf: 0, lastT: -1, lost: 0, wake: function () { return wake; },
          status: function (k, t) { var m = $("kcam-msg"); if (!m) return; m.className = "kcam-msg" + (k === "err" ? " bad" : ""); m.textContent = t || MSG[k] || ""; } };
    var msgUntil = 0;
    function show(t, cls, ms) { var m = $("kcam-msg"); if (!m) return; m.textContent = t; m.className = "kcam-msg " + (cls || ""); msgUntil = performance.now() + (ms || 2500); }
    function loop() {
      if (!S || !$("kcam-video")) return;
      S.raf = requestAnimationFrame(loop);
      var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      if (!S.det || v.readyState < 2 || !v.videoWidth) return;
      if (v.currentTime === S.lastT) return; S.lastT = v.currentTime;
      asp = v.videoWidth / v.videoHeight;
      var res; try { res = S.det.detectForVideo(v, performance.now()); } catch (e) { return; }
      var box = (function () { var s = Math.max(W / v.videoWidth, H / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s; return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h }; })();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var lm = res && res.landmarks && res.landmarks[0];
      if (lm && S.facing !== "user") lm = lm.map(function (q) { return { x: 1 - q.x, y: q.y, z: q.z, visibility: q.visibility }; });
      var now = performance.now();
      if (!lm || !visible(lm)) {
        S.lost++; draw(ctx, lm ? smooth(lm) : null, W, H, box);
        if (S.lost > 12 && now > msgUntil) { show(MSG.far, "warn", 1200); if (now - (S.farSaid || 0) > 7000) { S.farSaid = now; say(V.far); } }
        if (S.rec) S.rec.frames.push({ t: now - S.rec.t0, lm: null });
        return;
      }
      S.lost = 0;
      var sm = smooth(lm), out = analyse(sm, now);
      draw(ctx, sm, W, H, box);
      if (A.phase === "run" && !S.rec) recStart(v);
      if (S.rec) {
        S.rec.frames.push({ t: now - S.rec.t0, lm: sm.map(function (q) { return [+q.x.toFixed(4), +q.y.toFixed(4), +(q.visibility || 0).toFixed(2)]; }), bad: Object.keys(A.live) });
        if (out && out.rep) S.rec.reps.push({ t: now - S.rec.t0, ok: out.ok, faults: out.faults || [] });
      }
      $("kcam-view").textContent = A.phase === "run" ? (A.view === "profil" ? "Vue de profil" : "Vue de face") : "";
      if (out) {
        if (out.rep) { $("kcam-reps").textContent = A.reps; $("kcam-good").textContent = A.good; if (navigator.vibrate) try { navigator.vibrate(out.ok ? 25 : [40, 60, 40]); } catch (e) {} }
        show(out.msg, out.cls || (out.rep ? (out.ok ? "ok" : "bad") : ""), out.rep ? 2600 : 2000);
        if (out.voice) { A.lastMsg = now; say(out.voice, out.live ? 2 : 1); }
      } else if (now > msgUntil) {
        var m = $("kcam-msg"); if (m && A.phase === "calib") { m.textContent = MSG.calib; m.className = "kcam-msg"; }
        else if (m && A.phase === "run" && !m.classList.contains("idle")) { m.textContent = A.reps ? "Continuez à votre rythme." : MSG.go; m.className = "kcam-msg idle"; }
      }
    }
    S.raf = requestAnimationFrame(loop);
  }

  /* ── Enregistrement pour le replay : reste dans le téléphone, effacé à la fermeture ── */
  var REPLAY = null;
  function recStart(v) {
    var rec = S.rec = { t0: performance.now(), frames: [], reps: [], mr: null, chunks: [], type: "", vw: v.videoWidth, vh: v.videoHeight, facing: S.facing };
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
  function close() { stop(); if (REPLAY && REPLAY.url) URL.revokeObjectURL(REPLAY.url); REPLAY = null; var el = $("kcam-run"); if (el) { el.classList.remove("open"); el.innerHTML = ""; } document.body.classList.remove("kf-lock"); }
  function flip() {
    if (!S) return;
    var f = S.facing === "user" ? "environment" : "user"; jset("kf-cam-facing", f);
    var det = S.det; stop();
    navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: f, width: { ideal: 640 }, height: { ideal: 480 } } }).then(function (st) { run(st, f); S.det = det; S.status("calib"); })
      .catch(function () { open(); });
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
    if (!a || !a.reps) { close(); return; }
    if (REPLAY && REPLAY.url) URL.revokeObjectURL(REPLAY.url);
    REPLAY = rec && rec.frames.length > 10 ? rec : null;
    say(V.end);
    var el = shell(), counts = {};
    a.log.forEach(function (r) { r.faults.forEach(function (f) { counts[f] = (counts[f] || 0) + 1; }); });
    var main = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })[0];
    var hist = jget("kf-cam-hist", []); hist.unshift({ d: new Date().toISOString().slice(0, 10), reps: a.reps, good: a.good, main: main || null, view: a.view }); jset("kf-cam-hist", hist.slice(0, 30));
    el.innerHTML = "<div class='kcam-intro kcam-end-sheet'><div class='kf-h1'>Bilan du squat</div>" +
      "<div class='kcam-big'><div><b>" + a.reps + "</b><small>répétitions</small></div><div class='ok'><b>" + a.good + "</b><small>correctes</small></div></div>" +
      (main ? "<p class='kcam-tip'><strong>À travailler :</strong> " + esc(FIX[main]) + " (" + counts[main] + " fois sur " + a.reps + "). " + esc(MSG[main]) + "</p>"
            : "<p class='kcam-tip ok'><strong>Bravo :</strong> aucun défaut repéré sur cette série.</p>") +
      "<p class='lx-muted kcam-note'>Analyse " + (a.view === "profil" ? "de profil" : "de face") + ". Essayez aussi " + (a.view === "profil" ? "de face pour vérifier les genoux." : "de profil pour vérifier le buste et les talons.") + "</p>" +
      (REPLAY ? "<button class='seq-btn-main kcam-replay-btn' onclick='KineCamera.replay()'>▶ Revoir ma série</button>" +
                "<p class='lx-muted kcam-note'>Le replay reste dans votre téléphone et s'efface quand vous fermez.</p>" : "") +
      "<button class='" + (REPLAY ? "seq-btn-secondary" : "seq-btn-main") + "' onclick='KineCamera.open()'>Recommencer</button><button class='seq-btn-secondary' onclick='KineCamera.close()'>Fermer</button></div>";
    el.__sum = el.innerHTML;
  }

  /* ── Replay de la série : la vidéo (si le téléphone sait l'enregistrer) avec la silhouette et les défauts ── */
  function replay() {
    var R = REPLAY; if (!R) return;
    var el = shell(), sum = el.__sum;
    var chips = R.reps.map(function (r, i) {
      return "<button type='button' class='kcam-chip " + (r.ok ? "ok" : "bad") + "' data-t='" + Math.max(0, r.t - 2600) + "'>" + (i + 1) + (r.ok ? " ✓" : " · " + esc(FIX[r.faults[0]] || "")) + "</button>";
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
      var s = Math.max(W / R.vw, H / R.vh), box = { w: R.vw * s, h: R.vh * s }; box.x = (W - box.w) / 2; box.y = (H - box.h) / 2;
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

  /* ── Carte dans la bibliothèque ── */
  function libCard() {
    var box = $("kb-sheet"); if (!box) return;
    var body = box.querySelector(".kf-sheet-body"); if (!body || body.querySelector(".kcam-libcard")) return;
    var after = body.querySelector(".kr-libcard") || body.querySelector(".kb-chips"); if (!after) return;
    var c = document.createElement("button");
    c.type = "button"; c.className = "kr-libcard kcam-libcard";
    c.innerHTML = "<span class='kcam-ico' aria-hidden='true'><svg viewBox='0 0 24 24' width='26' height='26' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'><circle cx='12' cy='4.5' r='2'/><path d='M12 7v6M7 10l5 1 5-1M12 13l-3 6M12 13l3 6'/></svg></span>" +
      "<span class='kr-lt'><b>Mon squat à la caméra <em class='kcam-tag'>essai</em></b><small>Yass suit vos articulations et vous dit si le mouvement est correct</small></span><span aria-hidden='true'>›</span>";
    c.onclick = function () { open(); };
    after.parentNode.insertBefore(c, after.nextSibling);
  }
  function watch() { var box = $("kb-sheet"); if (!box || box.__kcam) return; box.__kcam = 1; new MutationObserver(libCard).observe(box, { childList: true }); libCard(); }

  function mute() { var m = !muted(); jset("kf-cam-mute", m ? 1 : 0); var b = $("kcam-snd"); if (b) b.textContent = m ? "🔇" : "🔊"; if (!m) say("Bien !"); }
  window.KineCamera = { open: open, close: close, finish: finish, flip: flip, replay: replay, mute: mute, _analyse: function (lm) { if (!A) resetAnalysis(); return analyse(lm, performance.now()); }, _state: function () { return A; } };
  function init() { watch(); new MutationObserver(watch).observe(document.body, { childList: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
