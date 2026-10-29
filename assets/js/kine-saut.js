/* ═══════════ KinéForce — test de saut au téléphone ═══════════
   Le patient tient le téléphone contre la poitrine. Pendant le vol, le téléphone est en chute libre :
   l'accéléromètre lit presque 0 au lieu de 9,81. La durée de ce « trou » est le temps de vol.
   Hauteur du saut = g × t² / 8 (méthode du temps de vol, comme les tapis de contact).
   Sauts répétés : temps de contact entre deux sauts, et indice de réactivité RSI = hauteur (m) / contact (s),
   moyenne des 5 meilleurs sur 10 sauts (test 10/5). */
(function () {
  "use strict";
  var G = 9.81, LO = 0.4 * G;
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function f1(n, d) { var p = Math.pow(10, d == null ? 1 : d); return String(Math.round(n * p) / p).replace(".", ","); }
  function say(t) { if (typeof speak === "function") { try { speak(t, { prio: 1, now: true, ttl: 2500 }); } catch (e) {} } }
  function beep(f, d, v) { if (typeof playBeep === "function") playBeep(f, d, v, "triangle"); }

  /* ── Détection : flux d'échantillons (t en secondes, |a| en m/s²) → sauts ── */
  function detector(onJump) {
    var st = "ground", prev = null, up = 0, win = [], med = [];
    return {
      feed: function (t, a) {
        med.push(a); if (med.length > 3) med.shift();
        var m = med.slice().sort(function (x, y) { return x - y; })[Math.floor(med.length / 2)];   // médiane sur 3 : enlève les pics isolés
        win.push([t, m]); while (win.length && t - win[0][0] > 0.6) win.shift();
        if (prev) {
          var cross = function () { return prev[0] + (t - prev[0]) * (LO - prev[1]) / ((m - prev[1]) || 1e-9); };
          if (st === "ground" && prev[1] >= LO && m < LO) { up = cross(); st = "air"; }
          else if (st === "air" && prev[1] < LO && m >= LO) {
            var down = cross(), tf = down - up; st = "ground";
            if (tf >= 0.1 && tf <= 1.0) onJump({ up: up, down: down, tf: tf, h: G * tf * tf / 8 });
          } else if (st === "air" && t - up > 1.2) st = "ground";   // téléphone lâché ou posé : on ignore
        }
        prev = [t, m];
      },
      // Immobile : sur la dernière demi-seconde, l'accélération reste proche de la pesanteur
      still: function () {
        if (win.length < 6 || win[win.length - 1][0] - win[0][0] < 0.45) return false;
        var lo = 99, hi = 0; win.forEach(function (w) { lo = Math.min(lo, w[1]); hi = Math.max(hi, w[1]); });
        return hi - lo < 1.6 && lo > G - 1.6 && hi < G + 1.6;
      },
      air: function () { return st === "air"; }
    };
  }
  // Sauts répétés : contact = envol du saut suivant − atterrissage du précédent
  function reactive(jumps) {
    var r = [];
    for (var i = 1; i < jumps.length; i++) {
      var tc = jumps[i].up - jumps[i - 1].down;
      if (tc > 0.05 && tc < 0.7) r.push({ tc: tc, h: jumps[i].h, rsi: jumps[i].h / tc });
    }
    if (!r.length) return null;
    var top = r.slice().sort(function (x, y) { return y.rsi - x.rsi; }).slice(0, 5), avg = function (k) { return top.reduce(function (s, x) { return s + x[k]; }, 0) / top.length; };
    return { rsi: avg("rsi"), tc: avg("tc"), h: avg("h"), n: jumps.length, used: top.length };
  }

  /* ── Écran du test ── */
  var MODES = {
    cmj: { t: "Saut vertical", place: "Debout sur les deux pieds, le patient tient le téléphone à deux mains contre la poitrine, bras serrés.",
           go: "Au bip, il fléchit et saute le plus haut possible, puis atterrit sur la pointe des pieds, jambes presque tendues, avant d'amortir.", say: "Saute !" },
    hopv: { t: "Saut vertical sur une jambe", place: "Debout sur la jambe testée, le patient tient le téléphone à deux mains contre la poitrine, bras serrés.",
           go: "Au bip, il saute le plus haut possible sur la même jambe, atterrit sur la pointe du pied, jambe presque tendue, puis amortit et tient la réception.", say: "Saute !" },
    rsi: { t: "Sauts répétés", place: "Debout sur la jambe testée (ou sur les deux pieds), le patient tient le téléphone à deux mains contre la poitrine, bras serrés.",
           go: "Au bip, il enchaîne 10 sauts sur la pointe du pied, le plus haut possible en touchant le sol le moins longtemps possible, genou presque tendu, comme un ressort.", say: "Enchaîne les sauts !" }
  };
  // Le patient fait le test seul : mêmes consignes, en le tutoyant
  var MODES_P = {
    cmj: { t: "Saut vertical", place: "Debout sur tes deux pieds, tiens le téléphone à deux mains contre ta poitrine, bras serrés.",
           go: "Au bip, fléchis et saute le plus haut possible, puis atterris sur la pointe des pieds, jambes presque tendues, avant d'amortir.", say: "Saute !" },
    hopv: { t: "Saut vertical", place: "Debout sur la jambe testée, tiens le téléphone à deux mains contre ta poitrine, bras serrés.",
           go: "Au bip, saute le plus haut possible sur la même jambe, atterris sur la pointe du pied, jambe presque tendue, puis amortis et tiens la réception.", say: "Saute !" },
    rsi: { t: "Sauts répétés", place: "Debout sur la jambe testée, tiens le téléphone à deux mains contre ta poitrine, bras serrés.",
           go: "Au bip, enchaîne 10 sauts sur la pointe du pied, le plus haut possible en touchant le sol le moins longtemps possible, genou presque tendu, comme un ressort.", say: "Enchaîne les sauts !" }
  };
  var T = null;
  function ov() {
    var el = $("ks-test");
    if (!el) { el = document.createElement("div"); el.id = "ks-test"; el.className = "kcb-incl-ov"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Test de saut au téléphone"); document.body.appendChild(el); }
    return el;
  }
  function test(o) {
    stop();
    var MM = o.patient ? MODES_P : MODES;
    T = { o: o, md: MM[o.mode] || MM.cmj, trials: [], ph: "intro", jumps: [], det: null };
    view(); ov().classList.add("open");
  }
  function begin() {
    if (!T) return;
    var EV = window.DeviceMotionEvent;
    if (typeof getAudioCtx === "function") { var ctx = getAudioCtx(); if (ctx && ctx.state === "suspended") ctx.resume(); }
    var go = function () {
      T.ph = "wait"; T.jumps = []; T.got = false; T.t0 = Date.now();
      T.det = detector(function (j) { if (T && T.ph === "go") onJump(j); });
      window.addEventListener("devicemotion", onMot);
      clearTimeout(T.tm); T.tm = setTimeout(function () { if (T && !T.got) { T.ph = "err"; T.err = 1; view(); } }, 1800);
      view();
    };
    if (EV && typeof EV.requestPermission === "function") EV.requestPermission().then(function (r) { if (r === "granted") go(); else { T.ph = "err"; T.err = 2; view(); } }, function () { T.ph = "err"; T.err = 2; view(); });
    else go();
  }
  function onMot(e) {
    var a = e && e.accelerationIncludingGravity; if (!T || !a || a.x == null) return;
    sample((e.timeStamp || performance.now()) / 1000, Math.sqrt(a.x * a.x + a.y * a.y + (a.z || 0) * (a.z || 0)));
  }
  function sample(t, mag) {
    if (!T || !T.det) return;
    T.got = true; T.det.feed(t, mag);
    if (T.ph === "wait") {
      var ok = T.det.still(), b = $("ks-stab");
      if (b) { b.className = ok ? "ok" : ""; b.textContent = ok ? "Immobile, attention au bip…" : T.o.patient ? "Reste immobile, téléphone contre la poitrine" : "Le patient reste immobile, téléphone contre la poitrine"; }
      if (ok) { T.stillSince = T.stillSince || t; if (t - T.stillSince > 0.8) cueGo(t); } else T.stillSince = 0;
    } else if (T.ph === "go") {
      var last = T.jumps.length ? T.jumps[T.jumps.length - 1].down : T.goT;
      if (T.o.mode === "rsi" && T.jumps.length >= 4 && !T.det.air() && t - last > 1.2) endRsi();
      else if (!T.jumps.length && t - T.goT > 7) { T.ph = "none"; view(); }
    }
  }
  function cueGo(t) {
    T.ph = "go"; T.goT = t; T.jumps = [];
    beep(990, 0.18, 0.3); say(T.md.say);
    if (navigator.vibrate) { try { navigator.vibrate(80); } catch (e) {} }
    view();
  }
  function onJump(j) {
    T.jumps.push(j);
    if (T.o.mode === "rsi") {
      var c = $("ks-count"); if (c) c.textContent = T.jumps.length + " / 10";
      if (T.jumps.length >= 10) setTimeout(endRsi, 400);
      return;
    }
    T.ph = "res"; T.trials.push({ h: j.h * 100, tf: j.tf });
    beep(660, 0.1, 0.2); setTimeout(view, 500);
    if (T.o.patient) setTimeout(function () { say(Math.round(j.h * 100) + " centimètres"); }, 900);
  }
  function endRsi() {
    if (!T || T.ph !== "go") return;
    var r = reactive(T.jumps);
    T.ph = r ? "res" : "none"; if (r) T.trials = [r];
    beep(660, 0.1, 0.2); view();
    if (r && T.o.patient) say("Terminé, bravo !");
  }
  function view() {
    var el = ov(); if (!T) return;
    var o = T.o, md = T.md, body = "", head = esc(o.title || md.t) + (o.side ? ", " + esc(o.side) : "");
    var list = o.mode !== "rsi" && T.trials.length ? "<div class='ks-trials'>" + T.trials.map(function (x, i) {
      return "<span><i>Essai " + (i + 1) + "</i><b>" + f1(x.h) + " cm</b><small>vol " + Math.round(x.tf * 1000) + " ms</small></span>"; }).join("") + "</div>" : "";
    if (T.ph === "intro") body = "<div class='ks-fig' aria-hidden='true'>" + fig(o.mode) + "</div>" +
      "<p><strong>Mise en place.</strong> " + esc(md.place) + "</p><p><strong>Le saut.</strong> " + esc(md.go) + "</p>" +
      "<p class='ks-note'>Le téléphone mesure le temps passé en l'air. " + (o.patient ? "Garde les mains contre ta poitrine pendant tout le saut, sinon la mesure est faussée." : "Les mains restent contre la poitrine pendant tout le saut, sinon la mesure est faussée.") + "</p>" +
      "<button class='seq-btn-main' onclick='KineSaut.begin()'>Commencer</button>";
    else if (T.ph === "err") body = "<p>" + (T.err === 2 ? "L'accès aux capteurs a été refusé. Tu peux l'autoriser dans les réglages du navigateur, ou mesurer le saut autrement et saisir la valeur." : "L'accéléromètre ne répond pas sur cet appareil. Fais le test avec un téléphone, ou saisis la valeur mesurée autrement.") + "</p><button class='seq-btn-main' onclick='KineSaut.close()'>Fermer</button>";
    else if (T.ph === "wait") body = list + "<div class='kcb-ang'>Prêt</div><div id='ks-stab'>" + (o.patient ? "Reste immobile, téléphone contre la poitrine" : "Le patient reste immobile, téléphone contre la poitrine") + "</div>" +
      "<p class='ks-note'>" + (o.patient ? "Dès que tu es immobile, le téléphone bipe : c'est le signal pour sauter." : "Dès qu'il est immobile, le téléphone bipe : c'est le signal pour sauter.") + "</p>";
    else if (T.ph === "go") body = list + "<div class='kcb-ang big'>" + "Saute !" + "</div>" + (o.mode === "rsi" ? "<div id='ks-count' class='ks-count'>0 / 10</div>" : "<div id='ks-stab' class='ok'>En attente du saut…</div>");
    else if (T.ph === "none") body = list + "<p>Aucun saut détecté. Vérifie que le téléphone est bien tenu contre la poitrine, puis recommence.</p><button class='seq-btn-main' onclick='KineSaut.begin()'>Recommencer</button>";
    else if (o.mode === "rsi") {
      var r = T.trials[0];
      body = "<div class='kcb-ang big'>" + f1(r.rsi, 2) + "</div><p class='ks-c'>Indice de réactivité (RSI), moyenne des " + r.used + " meilleurs sauts</p>" +
        "<div class='ks-trials'><span><i>Contact au sol</i><b>" + Math.round(r.tc * 1000) + " ms</b></span><span><i>Hauteur</i><b>" + f1(r.h * 100) + " cm</b></span><span><i>Sauts</i><b>" + r.n + "</b></span></div>" +
        "<button class='seq-btn-main' onclick='KineSaut.use()'>" + (o.patient ? "Valider" : "Utiliser ces valeurs") + "</button><button class='seq-btn-secondary' onclick='KineSaut.begin()'>Recommencer</button>";
    } else {
      var x = T.trials[T.trials.length - 1], n = o.n || 1;
      body = "<div class='kcb-ang big'>" + f1(x.h) + " cm</div><p class='ks-c'>Essai " + T.trials.length + (n > 1 ? " sur " + n : "") + ", temps de vol " + Math.round(x.tf * 1000) + " ms</p>" + list +
        (T.trials.length < n ? "<button class='seq-btn-main' onclick='KineSaut.begin()'>Essai suivant</button><button class='seq-btn-secondary' onclick='KineSaut.use()'>" + (o.patient ? "Arrêter là et valider" : "Utiliser " + (T.trials.length > 1 ? "ces " + T.trials.length + " essais" : "cet essai")) + "</button>"
          : "<button class='seq-btn-main' onclick='KineSaut.use()'>" + (o.patient ? "Valider" : "Utiliser ces valeurs") + "</button><button class='seq-btn-secondary' onclick='KineSaut.redo()'>Tout recommencer</button>");
    }
    el.innerHTML = "<div class='kcb-incl-card ks-card'><div class='kcb-mh'><span>" + head + "</span><button class='kf-back' onclick='KineSaut.close()' aria-label='Fermer'>×</button></div>" + body + "</div>";
  }
  // Petit schéma : silhouette, téléphone contre la poitrine, flèche du saut
  function fig(mode) {
    var one = mode !== "cmj";
    return "<svg viewBox='0 0 220 120' width='220' height='120'><g fill='none' stroke='currentColor' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'>" +
      "<circle cx='70' cy='20' r='10'/><path d='M70 31v38'/><path d='M70 40l-12 10 12 4M70 40l12 10-12 4'/>" +
      (one ? "<path d='M70 69l-6 22-2 22'/><path d='M70 69l10 16-10 8'/>" : "<path d='M70 69l-8 22-2 22M70 69l8 22 2 22'/>") + "</g>" +
      "<rect x='64' y='44' width='12' height='18' rx='3' fill='var(--lu-ind2,#3341E0)'/>" +
      "<g stroke='var(--lu-ind2,#3341E0)' stroke-width='5' stroke-linecap='round' fill='none'><path d='M150 100V30'/><path d='M136 44l14-14 14 14'/>" + (mode === "rsi" ? "<path d='M178 100V58'/><path d='M168 68l10-10 10 10'/><path d='M196 100V70'/><path d='M188 78l8-8 8 8'/>" : "") + "</g></svg>";
  }
  function use() {
    if (!T || !T.trials.length) return;
    var cb = T.o.onUse, v = T.o.mode === "rsi" ? { rsi: Math.round(T.trials[0].rsi * 100) / 100, tc: Math.round(T.trials[0].tc * 1000) } : T.trials.map(function (x) { return Math.round(x.h * 10) / 10; });
    close(); if (cb) cb(v);
  }
  function stop() { window.removeEventListener("devicemotion", onMot); if (T) clearTimeout(T.tm); }
  function close() { stop(); T = null; var el = $("ks-test"); if (el) el.classList.remove("open"); }

  window.KineSaut = { test: test, begin: begin, use: use, close: close, redo: function () { if (T) { T.trials = []; begin(); } },
    detector: detector, reactive: reactive,
    // Pour les tests : rejoue un enregistrement [[t, |a|], …] comme s'il venait du capteur
    _feed: function (rows) { if (!T) return; if (T.tm) clearTimeout(T.tm); rows.forEach(function (r) { sample(r[0], r[1]); }); } };
})();
