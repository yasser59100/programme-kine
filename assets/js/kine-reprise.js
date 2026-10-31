/* ═══════════ KinéForce — Reprise de la course, réglée par le kiné ═══════════
   Le kiné choisit un modèle (marche et course alternées, 10 paliers), le palier de départ, la douleur tolérée,
   le nombre de séances par semaine, la surface et une consigne. Le patient lance chaque séance avec Yass
   (minuteur et voix : « Cours », « Marche »), note sa douleur pendant, puis le lendemain matin.
   Règle de progression (modèle de suivi de la douleur) : douleur pendant ET le lendemain matin au plus au seuil
   → palier suivant ; au-dessus du seuil → on redescend d'un palier ; sinon on refait le même.
   Les sorties sont enregistrées dans le journal de course de l'appli (kf-runs). */
var KineReprise = (function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function iso(d) { d = d ? new Date(d) : new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function addD(s, n) { var p = String(s).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2], 12); d.setDate(d.getDate() + n); return iso(d); }
  var MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function dfr(s) { var p = String(s).split("-"); return +p[2] + " " + MO[+p[1] - 1]; }

  // Les 10 paliers : [marche (min), course (min), répétitions]. La marche vient avant chaque bloc de course.
  var PALIERS = [[4, 1, 5], [3, 2, 5], [2, 3, 5], [1, 4, 5], [1, 5, 4], [1, 8, 3], [1, 10, 2], [0, 20, 1], [0, 25, 1], [0, 30, 1]];
  var MODELES = {
    standard: { n: "Reprise standard", d: 1, max: 3, f: 3, s: "Plat et régulier (route, piste, chemin)", c: "Allure où tu peux parler. Échauffe-toi 5 minutes en marchant vite." },
    lca: { n: "Après une ligamentoplastie (LCA)", d: 1, max: 3, f: 3, s: "Plat et régulier (route, piste, tapis)", c: "Seulement en ligne droite, sans virage serré ni descente. Genou sans gonflement le lendemain." },
    tendon: { n: "Tendinopathie (Achille, rotulienne)", d: 3, max: 5, f: 3, s: "Plat et souple", c: "Une douleur jusqu'à 5 sur 10 est acceptée si elle est revenue à ton niveau habituel le lendemain matin. Pas de côtes ni de sprints." },
    entorse: { n: "Après une entorse de cheville", d: 3, max: 3, f: 3, s: "Plat et régulier", c: "Évite les terrains irréguliers au début. Chevillère si ton kiné te l'a conseillée." },
    os: { n: "Après une fracture ou une fracture de fatigue", d: 1, max: 2, f: 3, s: "Plat et souple (piste, herbe, tapis)", c: "Toute douleur précise sur l'os : arrête et préviens ton kiné." }
  };
  var SURF = ["Plat et régulier (route, piste, chemin)", "Plat et souple (piste, herbe, tapis)", "Plat et régulier (route, piste, tapis)", "Tapis de course", "Terrain varié (en fin de reprise)"];
  function total(i) { var p = PALIERS[i]; return (p[0] + p[1]) * p[2]; }
  function palTxt(i) { var p = PALIERS[i]; return p[0] ? p[2] + " × (" + p[0] + " min de marche + " + p[1] + " min de course)" : p[1] + " min de course continue"; }

  /* ── Où en est le patient : à partir de ses sorties de reprise (kf-runs, champ rp) ── */
  function runs() { try { return (JSON.parse(localStorage.getItem("kf-runs") || "[]") || []).filter(function (r) { return r.rp; }); } catch (e) { return []; } }
  function etat(cfg, list) {
    var R = (list || runs()).filter(function (r) { return r.cid === cfg.id; }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : (a.t || 0) - (b.t || 0); });
    var cur = Math.max(1, Math.min(PALIERS.length, cfg.d || 1)), last = R[R.length - 1] || null, wait = null, msg = "";
    R.forEach(function (r) {
      if (r.next == null) return;
      var worst = Math.max(+r.pain || 0, +r.next || 0);
      if (worst <= cfg.max) { if (r.rp >= cur) cur = Math.min(PALIERS.length + 1, r.rp + 1); msg = "Palier " + r.rp + " validé"; }
      else if (worst > cfg.max) { cur = Math.max(1, r.rp - 1); msg = "Douleur au-dessus du seuil : on redescend d'un palier"; }
    });
    if (last && last.next == null && last.d < iso()) wait = last;   // la douleur du lendemain matin manque
    var gap = cfg.f >= 4 ? 1 : 2, nextD = last ? addD(last.d, gap) : iso();
    return { palier: cur, fini: cur > PALIERS.length, last: last, wait: wait, nextD: nextD > iso() ? nextD : null, msg: msg, n: R.length };
  }

  /* ════════ Côté kiné : régler et envoyer ════════ */
  var CFG = null;
  function kineCard(C) {
    var c = C.course;
    if (!c) return "<div class='su-card krp-k'><div class='su-card-h'><b>Reprise de la course</b><span>marche et course</span></div><div class='kf-sub'>Un programme en 10 paliers que le patient lance avec Yass. Il passe au palier suivant si sa douleur reste sous ton seuil, pendant et le lendemain matin.</div><button class='seq-btn-secondary' onclick='KineReprise.edit()'>Préparer une reprise de course</button></div>";
    var R = (C.journal || []).reduce(function (a, d) { return a.concat((d.c || []).filter(function (r) { return r.cid === c.id; })); }, []), e = etat(c, R);
    return "<div class='su-card krp-k'><div class='su-card-h'><b>Reprise de la course</b><span>" + esc(MODELES[c.m] ? MODELES[c.m].n : "") + "</span></div>" +
      "<div class='krp-pals'>" + PALIERS.map(function (p, i) { return "<i class='" + (i + 1 < e.palier ? "ok" : i + 1 === e.palier ? "now" : "") + "'></i>"; }).join("") + "</div>" +
      "<div class='kf-sub'>" + (e.fini ? "Reprise terminée : 30 minutes de course continue. Le patient continue avec son journal de course (charge par semaine et douleur)." : "Palier " + e.palier + " sur 10 : " + esc(palTxt(e.palier - 1)) + ".") + " Seuil de douleur : " + c.max + " sur 10, " + c.f + " séances par semaine.</div>" +
      (R.length ? R.slice(-4).reverse().map(function (r) { return "<div class='kcb-srow'><b>" + esc(dfr(r.d)) + "</b><span>Palier " + r.rp + " · douleur pendant " + (r.pain || 0) + "/10" + (r.next != null ? ", le lendemain " + r.next + "/10" : ", lendemain pas encore noté") + "</span></div>"; }).join("")
        : "<p class='kcb-hint'>" + (C.membres ? "Les séances apparaîtront ici si le patient sauvegarde son journal." : "Le patient la verra dès que son téléphone sera relié.") + "</p>") +
      "<div class='kcb-two'><button class='seq-btn-secondary' onclick='KineReprise.edit()'>Modifier</button><button class='seq-btn-secondary kcb-danger' onclick='KineReprise.stop()'>Arrêter</button></div></div>";
  }
  function edit() {
    var C = KineCabinet._C(), c = C.course || {};
    CFG = { id: c.id || Date.now().toString(36), m: c.m || "standard", d: c.d || 1, max: c.max != null ? c.max : 3, f: c.f || 3, s: c.s || MODELES.standard.s, c: c.c != null ? c.c : MODELES.standard.c };
    view();
  }
  function setM(m) { var M = MODELES[m]; CFG.m = m; CFG.d = M.d; CFG.max = M.max; CFG.f = M.f; CFG.s = M.s; CFG.c = M.c; view(); }
  function setK(k, v) { CFG[k] = v; view(); }
  function view() {
    var el = KineCabinet._ov("krp-ed"); el.setAttribute("aria-label", "Reprise de la course");
    var chips = function (k, list, fmt) { return "<div class='kf-chips'>" + list.map(function (v) { return "<button type='button' class='" + (CFG[k] === v ? "sel" : "") + "' onclick='KineReprise.k(" + JSON.stringify(k) + "," + JSON.stringify(v).replace(/'/g, "&#39;") + ")'>" + esc(fmt ? fmt(v) : v) + "</button>"; }).join("") + "</div>"; };
    el.innerHTML = "<div class='kcb-incl-card kcb-qcard'><div class='kcb-mh'><span>Reprise de la course</span><button class='kf-back' onclick='document.getElementById(\"krp-ed\").classList.remove(\"open\")' aria-label='Fermer'>×</button></div>" +
      "<span class='kcb-lab'>Modèle</span><div class='krp-mods'>" + Object.keys(MODELES).map(function (m) { return "<button class='" + (CFG.m === m ? "on" : "") + "' onclick='KineReprise.m(\"" + m + "\")'>" + esc(MODELES[m].n) + "</button>"; }).join("") + "</div>" +
      "<span class='kcb-lab'>Palier de départ</span>" + chips("d", [1, 2, 3, 4, 5, 6, 7, 8]) + "<p class='kcb-hint'>" + esc(palTxt(CFG.d - 1)) + ", soit " + total(CFG.d - 1) + " minutes.</p>" +
      "<span class='kcb-lab'>Douleur acceptée, pendant et le lendemain matin</span>" + chips("max", [2, 3, 4, 5], function (v) { return v + " sur 10"; }) +
      "<span class='kcb-lab'>Séances par semaine</span>" + chips("f", [2, 3, 4], function (v) { return v + " par semaine"; }) +
      "<span class='kcb-lab'>Surface</span>" + chips("s", SURF) +
      "<label class='kcb-field'><span class='kcb-lab'>Consigne pour le patient</span><textarea class='kcb-in kcb-ta' id='krp-c' maxlength='300' rows='3'>" + esc(CFG.c) + "</textarea></label>" +
      "<details class='kcb-how'><summary>Les 10 paliers</summary><ol class='krp-ol'>" + PALIERS.map(function (p, i) { return "<li>" + esc(palTxt(i)) + " · " + total(i) + " min</li>"; }).join("") + "</ol>On passe au palier suivant si la douleur pendant la séance et le lendemain matin reste au plus au seuil ; au-dessus, on redescend d'un palier. Un jour de repos au moins entre deux séances.</details>" +
      "<button class='seq-btn-main' onclick='KineReprise.send()'>Envoyer au patient</button></div>";
    el.classList.add("open");
  }
  function send() {
    var t = $("krp-c"); CFG.c = t ? t.value.trim().slice(0, 300) : CFG.c; CFG.env = iso();
    var C = KineCabinet._C(), data = { course: CFG };
    fbCab.save(C.id, data).then(function () { C.course = CFG; KineCabinet._ping("course"); $("krp-ed").classList.remove("open"); KineCabinet._re(); KineCabinet._say("Reprise de course envoyée au patient"); }, function () { KineCabinet._say("Connexion impossible : réessaie."); });
  }
  function stop() {
    if (!confirm("Arrêter la reprise de course ? Le patient ne la verra plus.")) return;
    var C = KineCabinet._C(); fbCab.save(C.id, { course: null }).then(function () { C.course = null; KineCabinet._re(); });
  }

  /* ════════ Côté patient : la carte dans Mon kiné et la séance avec Yass ════════ */
  function patientCard(d) {
    var c = d && d.course; if (!c) return "";
    var e = etat(c);
    var jr = "<button class='krp-jr' onclick='KineReprise.journal()'>Mon journal de course<span aria-hidden='true'>›</span></button>";
    if (e.fini) return "<div class='kms-card krp-p done'><div class='kms-ck'><span>Reprise de la course</span><span>terminée</span></div><div class='kms-ct'>Bravo : 30 minutes de course continue</div>" +
      "<div class='kms-cm'><span>La suite se fait dans ton journal de course : tu notes tes sorties, l'appli surveille ta charge semaine après semaine et ta douleur.</span></div>" +
      "<button class='seq-btn-main' onclick='KineReprise.journal()'>Continuer avec mon journal de course</button></div>";
    var head = "<div class='kms-ck'><span>Reprise de la course</span><span>Palier " + e.palier + " sur 10</span></div><div class='krp-pals'>" + PALIERS.map(function (p, i) { return "<i class='" + (i + 1 < e.palier ? "ok" : i + 1 === e.palier ? "now" : "") + "'></i>"; }).join("") + "</div>";
    if (e.wait) return "<div class='kms-card krp-p'>" + head + "<div class='kms-ct'>Ta douleur ce matin ?</div><div class='kms-cm'><span>Après ta séance du " + esc(dfr(e.wait.d)) + ", de 0 à 10</span></div><div class='krp-scale'>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return "<button onclick='KineReprise.lendemain(" + JSON.stringify(e.wait.id) + "," + v + ")'>" + v + "</button>"; }).join("") + "</div></div>";
    return "<div class='kms-card krp-p'>" + head + "<div class='kms-ct'>" + esc(palTxt(e.palier - 1)) + "</div><div class='kms-cm'><span>" + total(e.palier - 1) + " min, plus l'échauffement et le retour au calme · " + esc(c.s) + (e.msg ? " · " + esc(e.msg) : "") + "</span></div>" +
      (e.nextD ? "<p class='krp-wait'>Prochaine séance à partir du " + esc(dfr(e.nextD)) + " : le corps s'adapte pendant le repos.</p>" : "<button class='seq-btn-main' onclick='KineReprise.go()'>Lancer la séance avec Yass</button>") + jr + "</div>";
  }
  // Le journal de course : les séances de reprise y figurent, et il prend le relais une fois la reprise terminée
  function journal() { if (window.KineMonSuivi && KineMonSuivi.close) try { KineMonSuivi.close(); } catch (e) {} if (window.KineCourse) KineCourse.open(); }
  // Pour le journal : la reprise en cours (réglage du kiné et palier), ou null
  function active() { var c = cfgNow(); if (!c) return null; var e = etat(c); return { c: c, e: e, txt: e.fini ? "" : palTxt(e.palier - 1), min: e.fini ? 0 : total(e.palier - 1) }; }
  function cfgNow() { var s = window.KineMonSuivi && KineMonSuivi.state(); return s && s.d && s.d.course; }
  function lendemain(id, v) {
    try { var a = JSON.parse(localStorage.getItem("kf-runs") || "[]"); a.forEach(function (r) { if (r.id === id) r.next = v; }); localStorage.setItem("kf-runs", JSON.stringify(a)); } catch (e) {}
    var c = cfgNow(); if (c && v > c.max && window.showToast) showToast("Douleur au-dessus du seuil : la prochaine séance reprend le palier d'avant");
    refresh();
  }
  function refresh() { if (window.KineMonSuivi) { KineMonSuivi.page(); var sh = $("kms-sheet"); if (sh && sh.classList.contains("open")) KineMonSuivi.view(); } }

  // La séance : une suite d'intervalles marche / course, avec la voix et des bips
  var RUN = null, wake = null;
  function say(t) { if (typeof speak === "function") { try { speak(t, { prio: 1, now: true, ttl: 3000 }); } catch (e) {} } }
  function beep(f, d) { if (typeof playBeep === "function") playBeep(f, d || 0.15, 0.3, "triangle"); }
  function go() {
    var c = cfgNow(); if (!c) return; var e = etat(c); if (e.fini) return;
    var p = PALIERS[e.palier - 1], steps = [["echauf", 5]];
    for (var i = 0; i < p[2]; i++) { if (p[0]) steps.push(["marche", p[0]]); steps.push(["course", p[1]]); }
    steps.push(["retour", 3]);
    RUN = { c: c, rp: e.palier, steps: steps, i: 0, left: 0, paused: false, t0: Date.now() };
    if (typeof getAudioCtx === "function") { var ctx = getAudioCtx(); if (ctx && ctx.state === "suspended") ctx.resume(); }
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e2) {}
    document.body.style.overflow = "hidden";
    step();
  }
  var LAB = { echauf: ["Échauffement", "Marche vite", "#0E141F", "Marche vite pour t'échauffer."], marche: ["Marche", "Marche", "#0B6E59", "Marche."], course: ["Course", "Cours", "#3341E0", "Cours, tranquille."], retour: ["Retour au calme", "Marche lente", "#0E141F", "Retour au calme, marche lentement."] };
  function screen() { var el = $("krp-run"); if (!el) { el = document.createElement("div"); el.id = "krp-run"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Séance de reprise de course"); document.body.appendChild(el); } return el; }
  function step() {
    if (!RUN) return;
    if (RUN.i >= RUN.steps.length) { endRun(); return; }
    var s = RUN.steps[RUN.i]; RUN.left = s[1] * 60; RUN.end = Date.now() + RUN.left * 1000;
    say(LAB[s[0]][3]); beep(s[0] === "course" ? 990 : 660, 0.2); if (navigator.vibrate) { try { navigator.vibrate(s[0] === "course" ? [120, 80, 120] : 200); } catch (e) {} }
    paint(); clearInterval(RUN.tm); RUN.tm = setInterval(tick, 250);
  }
  function tick() {
    if (!RUN || RUN.paused) return;
    var left = Math.max(0, Math.round((RUN.end - Date.now()) / 1000));
    if (left !== RUN.left) { RUN.left = left; if (left === 10 && RUN.steps[RUN.i][1] >= 1) say("Encore 10 secondes."); if (left <= 3 && left > 0) beep(520, 0.08); upd(); }
    if (left <= 0) { clearInterval(RUN.tm); RUN.i++; step(); }
  }
  function mmss(s) { return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
  function paint() {
    var s = RUN.steps[RUN.i], L = LAB[s[0]], el = screen(), rest = RUN.steps.slice(RUN.i + 1).reduce(function (t, x) { return t + x[1]; }, 0);
    var nCourse = RUN.steps.filter(function (x) { return x[0] === "course"; }).length, kC = RUN.steps.slice(0, RUN.i + 1).filter(function (x) { return x[0] === "course"; }).length;
    el.style.background = L[2];
    el.innerHTML = "<div class='kr-top'><span>Palier " + RUN.rp + " sur 10</span><span>" + (s[0] === "course" ? "Course " + kC + " sur " + nCourse : esc(L[0])) + "</span></div>" +
      "<div class='krp-big'><b>" + esc(L[1]) + "</b><em id='krp-t'>" + mmss(RUN.left) + "</em></div>" +
      "<div class='kr-small2' id='krp-r'>Encore " + rest + " min après cette étape" + (s[0] === "course" ? " · tu dois pouvoir parler" : "") + "</div>" +
      "<div class='kr-btns'><button type='button' onclick='KineReprise.pause()'>" + (RUN.paused ? "Reprendre" : "Pause") + "</button><button type='button' onclick='KineReprise.quit()'>Arrêter</button></div>";
    el.classList.add("open");
  }
  function upd() { var t = $("krp-t"); if (t) t.textContent = mmss(RUN.left); }
  function pause() {
    if (!RUN) return; RUN.paused = !RUN.paused;
    if (RUN.paused) { RUN.pl = RUN.left; say("Pause."); } else { RUN.end = Date.now() + RUN.pl * 1000; say("On reprend."); }
    paint();
  }
  function quit() { if (!RUN) return; if (Date.now() - RUN.t0 > 120000 && confirm("Arrêter la séance ? Tu pourras noter ta douleur pour que ton kiné le sache.")) { RUN.partial = true; endRun(); return; } close(); }
  function endRun() {
    clearInterval(RUN.tm); say(RUN.partial ? "Séance arrêtée." : "Séance terminée, bravo !");
    var el = screen(); el.style.background = "#0E141F";
    el.innerHTML = "<div class='kr-top'><span>Palier " + RUN.rp + " sur 10</span><span>" + (RUN.partial ? "arrêtée" : "terminée") + "</span></div><div class='krp-end'><b>" + (RUN.partial ? "Séance arrêtée" : "Bravo !") + "</b>" +
      "<span>Douleur pendant la séance, de 0 à 10</span><div class='krp-scale'>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return "<button onclick='KineReprise.done(" + v + ")'>" + v + "</button>"; }).join("") + "</div>" +
      "<p>Demain matin, l'appli te demandera ta douleur au réveil : c'est elle qui décide du palier suivant. La séance s'ajoute aussi à ton journal de course.</p></div>";
  }
  function done(pain) {
    var r = RUN, min = Math.max(1, Math.round((Date.now() - r.t0) / 60000));
    var run = { id: Date.now().toString(36), t: Date.now(), d: iso(), min: min, eff: 2, pain: pain, rp: r.rp, cid: r.c.id };
    if (r.partial || pain > r.c.max) run.stop = 1;
    try { var a = JSON.parse(localStorage.getItem("kf-runs") || "[]"); a.push(run); localStorage.setItem("kf-runs", JSON.stringify(a)); } catch (e) {}
    if (window.KineStats) try { KineStats.ev("p", "reprise"); } catch (e) {}
    close(); refresh();
  }
  function close() { if (RUN) clearInterval(RUN.tm); RUN = null; var el = $("krp-run"); if (el) el.classList.remove("open"); document.body.style.overflow = ""; try { if (wake) wake.release(); } catch (e) {} wake = null; if (typeof stopSpeech === "function") stopSpeech(); }

  return { journal: journal, active: active, PALIERS: PALIERS, MODELES: MODELES, etat: etat, kineCard: kineCard, edit: edit, m: setM, k: setK, send: send, stop: stop,
    patientCard: patientCard, lendemain: lendemain, go: go, pause: pause, quit: quit, done: done, close: close, _run: function () { return RUN; }, _skip: function () { if (RUN) { RUN.end = Date.now(); tick(); } } };
})();
