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
  function say(t) { if (typeof speak === "function") { try { speak(t, { prio: 1, now: true, ttl: 3000 }); } catch (e) {} } }
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
      if (A.still >= 5 && now - A.stillT > 1300) { A.phase = "run"; return { msg: MSG.go, voice: MSG.go }; }
      return { msg: MSG.calib };
    }

    var drop = (hip.y - A.standY) / Math.max(0.05, A.legLen);
    A.dropNow = drop; A.dropMax = Math.max(A.dropMax || 0, drop); A.kneeNow = kneeBoth;
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
    if (!A.down && drop > 0.16) { A.down = true; A.maxDrop = drop; A.minKnee = kneeAng; A.flags = {}; A.nf = 0; }
    if (A.down) A.nf++;
    if (A.down) { A.maxDrop = Math.max(A.maxDrop, drop); A.minKnee = Math.min(A.minKnee, A.view === "profil" ? kneeAng : kneeBoth); }
    if (A.down && drop < 0.07) {
      A.down = false; A.reps++;
      var need = Math.max(2, Math.round(A.nf * 0.25)), fl = A.flags;   // défaut retenu s'il est vu sur au moins un quart de la répétition
      var faults = Object.keys(fl).filter(function (k) { return fl[k] >= need; });
      var deep = A.view === "profil" ? A.minKnee < 105 : A.maxDrop > 0.2;
      if (!faults.length) A.good++;
      A.log.push({ faults: faults, deep: deep });
      var m = faults.length ? MSG[faults[0]] : deep ? MSG.good[A.reps % MSG.good.length] : MSG.shallow;
      return { msg: m, voice: m, rep: true, ok: !faults.length };
    }
    return null;
  }

  /* ── Dessin de la silhouette ── */
  function draw(ctx, lm, W, H, box) {
    ctx.clearRect(0, 0, W, H);
    if (!lm) return;
    var pt = function (i) { return [box.x + (1 - lm[i].x) * box.w, box.y + lm[i].y * box.h]; };   // image en miroir
    var bad = A ? A.live : {};
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
        if (S.lost > 12 && now > msgUntil) show(MSG.far, "warn", 1200);
        return;
      }
      S.lost = 0;
      var sm = smooth(lm), out = analyse(sm, now);
      draw(ctx, sm, W, H, box);
      $("kcam-view").textContent = A.phase === "run" ? (A.view === "profil" ? "Vue de profil" : "Vue de face") : "";
      if (out) {
        if (out.rep) { $("kcam-reps").textContent = A.reps; $("kcam-good").textContent = A.good; if (navigator.vibrate) try { navigator.vibrate(out.ok ? 25 : [40, 60, 40]); } catch (e) {} }
        show(out.msg, out.rep ? (out.ok ? "ok" : "bad") : "", out.rep ? 2600 : 2000);
        if (out.voice && now - A.lastMsg > 2200) { A.lastMsg = now; say(out.voice); }
      } else if (now > msgUntil) {
        var m = $("kcam-msg"); if (m && A.phase === "calib") { m.textContent = MSG.calib; m.className = "kcam-msg"; }
        else if (m && A.phase === "run" && !m.classList.contains("idle")) { m.textContent = A.reps ? "Continuez à votre rythme." : MSG.go; m.className = "kcam-msg idle"; }
      }
    }
    S.raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (!S) return;
    cancelAnimationFrame(S.raf);
    try { S.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { var w = S.wake(); if (w) w.release(); } catch (e) {}
    S = null;
  }
  function close() { stop(); var el = $("kcam-run"); if (el) { el.classList.remove("open"); el.innerHTML = ""; } document.body.classList.remove("kf-lock"); }
  function flip() {
    if (!S) return;
    var f = S.facing === "user" ? "environment" : "user"; jset("kf-cam-facing", f);
    var det = S.det; stop();
    navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: f, width: { ideal: 640 }, height: { ideal: 480 } } }).then(function (st) { run(st, f); S.det = det; S.status("calib"); })
      .catch(function () { open(); });
  }
  function finish() {
    var a = A; stop();
    if (!a || !a.reps) { close(); return; }
    var el = shell(), counts = {};
    a.log.forEach(function (r) { r.faults.forEach(function (f) { counts[f] = (counts[f] || 0) + 1; }); });
    var main = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })[0];
    var hist = jget("kf-cam-hist", []); hist.unshift({ d: new Date().toISOString().slice(0, 10), reps: a.reps, good: a.good, main: main || null, view: a.view }); jset("kf-cam-hist", hist.slice(0, 30));
    el.innerHTML = "<div class='kcam-intro kcam-end-sheet'><div class='kf-h1'>Bilan du squat</div>" +
      "<div class='kcam-big'><div><b>" + a.reps + "</b><small>répétitions</small></div><div class='ok'><b>" + a.good + "</b><small>correctes</small></div></div>" +
      (main ? "<p class='kcam-tip'><strong>À travailler :</strong> " + esc(FIX[main]) + " (" + counts[main] + " fois sur " + a.reps + "). " + esc(MSG[main]) + "</p>"
            : "<p class='kcam-tip ok'><strong>Bravo :</strong> aucun défaut repéré sur cette série.</p>") +
      "<p class='lx-muted kcam-note'>Analyse " + (a.view === "profil" ? "de profil" : "de face") + ". Essayez aussi " + (a.view === "profil" ? "de face pour vérifier les genoux." : "de profil pour vérifier le buste et les talons.") + "</p>" +
      "<button class='seq-btn-main' onclick='KineCamera.open()'>Recommencer</button><button class='seq-btn-secondary' onclick='KineCamera.close()'>Fermer</button></div>";
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

  window.KineCamera = { open: open, close: close, finish: finish, flip: flip, _analyse: function (lm) { if (!A) resetAnalysis(); return analyse(lm, performance.now()); }, _state: function () { return A; } };
  function init() { watch(); new MutationObserver(watch).observe(document.body, { childList: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
