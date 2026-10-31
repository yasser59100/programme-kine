/* ═══════════ KinéForce — Mon suivi au cabinet, côté patient ═══════════
   Le patient tape le code donné par son kiné : son téléphone se relie à sa fiche (lecture seule).
   Il voit son étape, ses objectifs, ses bilans en courbes, le mot de son kiné, et la séance que son kiné lui a préparée.
   En retour, le téléphone envoie un résumé de la semaine (nombre de séances, douleur moyenne), rien d'autre. */
var KineMonSuivi = (function () {
  "use strict";
  var KEY = "kf-cab", PUSHKEY = "kf-cab-push";
  // Le parcours, les questionnaires et l'espace kiné ne sont chargés que pour un patient relié (ou le kiné)
  var KP = { get: function () { return window.KineParcours ? KineParcours.get.apply(null, arguments) : null; } };
  function kpReady() { if (window.KineParcours) KP = window.KineParcours; return !!window.KineParcours; }
  function need() { return kpReady() ? Promise.resolve() : (window.kfNeed ? kfNeed("suivi").then(kpReady) : Promise.resolve()); }
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function dfr(s) { if (!s) return ""; var p = String(s).slice(0, 10).split("-"); return (+p[2]) + " " + MOIS[+p[1] - 1]; }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function week(d) { d = new Date(d || Date.now()); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); var w1 = new Date(d.getFullYear(), 0, 4); var n = 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7); return d.getFullYear() + "-W" + ("0" + n).slice(-2); }
  function monday() { var d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
  var ICON_OK = "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M5 12l5 5 9-10'/></svg>";
  var ICON_LOCK = "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><rect x='5' y='11' width='14' height='10' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/></svg>";

  function state() { return jget(KEY, null); }
  function linked() { var s = state(); return !!(s && s.pid); }

  /* ════════ Synchronisation ════════ */
  var busy = false;
  // Demande d'accès en attente : on regarde de temps en temps si le kiné a répondu
  var asked = 0;
  function checkRequest(force) {
    var s = state(); if (!s || !s.pending || !window.fbPat || !fbPat.requestState) return Promise.resolve(s);
    if (!force && Date.now() - asked < 90000) return Promise.resolve(s);
    asked = Date.now();
    return fbPat.requestState().then(function (r) {
      if (r.pid) { jset(KEY, { pid: r.pid }); try { localStorage.removeItem(PUSHKEY); localStorage.removeItem(JH); } catch (e) {} return refresh(true).then(function () { if (window.showToast) showToast("Ton kiné a accepté ta demande"); askConsent(function () { close(); }); return state(); }); }
      if (r.refused) jset(KEY, { refused: true, prenom: s.prenom });
      else if (r.none) jset(KEY, null);
      slot(); return state();
    }, function () { return s; });
  }
  function cancelRequest() {
    if (!confirm("Annuler ta demande d'accès ?")) return;
    var done = function () { try { localStorage.removeItem(KEY); } catch (e) {} slot(); };
    if (window.fbPat && fbPat.cancel) fbPat.cancel().then(done, done); else done();
  }
  function refresh(force) {
    var s = state(); if (s && s.pending) return checkRequest(force);
    if (!s || !s.pid || !window.fbPat || busy) return Promise.resolve(s);
    if (!force && s.at && Date.now() - s.at < 60000) return Promise.resolve(s);
    busy = true;
    return fbPat.get(s.pid).then(function (d) {
      busy = false;
      if (!d) { jset(KEY, { pid: s.pid, lost: 1 }); slot(); return state(); }
      d.bilans = (d.bilans || []).map(function (b) { return { d: b.d, m: b.m }; });
      d.seances = (d.seances || []).map(function (x) { return { d: x.d, ex: x.ex, kg: x.kg, reps: x.reps, series: x.series, dou: x.dou }; });
      d.quest = (d.quest || []).map(function (x) { return { id: x.id, q: x.q, env: x.env, des: x.des || null, zone: x.zone, cote: x.cote, fini: x.fini || null, score: x.score, m: x.m, rep: x.rep }; });
      ["maj", "cree", "codeExp"].forEach(function (k) { delete d[k]; });
      if (window.KineAvatar && KineAvatar.setShirt && !(window.KineRole && KineRole.role() === "kine")) KineAvatar.setShirt(d.tee || null);   // le t-shirt de Yass au nom de son kiné
      var ns = { pid: s.pid, d: d, at: Date.now() };
      jset(KEY, ns); syncSeance(d); pushHome(s.pid); slot(); journalSync(s.pid);
      if (fbPat.seen) fbPat.seen(s.pid).catch(function () {});   // accusé de réception pour le kiné
      if ($("kms-sheet") && $("kms-sheet").classList.contains("open")) view();
      page();
      return ns;
    }, function (e) { busy = false; console.log("Suivi cabinet indisponible", e); return s; });
  }
  /* ════════ Journal : les séances faites à la maison, sauvegardées dans le suivi (avec l'accord du patient) ════════
     Un document par mois (séances, douleurs signalées, ressenti du jour) et un pour le carnet de salle.
     Seuls les documents qui ont changé sont envoyés. Au premier lien (ou en retrouvant son suivi), on fusionne. */
  var JH = "kf-cab-jh", SYNC = "kf-cab-sync";
  function consent() { try { return localStorage.getItem(SYNC); } catch (e) { return null; } }
  function arr(k) { try { return JSON.parse(localStorage.getItem(k) || "[]") || []; } catch (e) { return []; } }
  function obj(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function hashOf(o) { var t = JSON.stringify(o), h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h + ":" + t.length; }
  function buckets() {
    var B = {}, m = function (d) { return String(d || "").slice(0, 7); };
    var add = function (k, f, x) { var id = m(k); if (!/^\d{4}-\d{2}$/.test(id)) return; B[id] = B[id] || { s: [], p: [], r: {} }; if (f === "r") B[id].r[k] = x; else B[id][f].push(x); };
    arr("kf-sessions").forEach(function (x) { add(x.date, "s", x); });
    arr("kf-pain").forEach(function (x) { add(String(x.date || "").slice(0, 10), "p", x); });
    var R = obj("kf-checkin"); Object.keys(R).forEach(function (d) { add(d, "r", R[d]); });
    Object.keys(B).forEach(function (k) { B[k].s = B[k].s.slice(0, 300); B[k].p = B[k].p.slice(0, 300); });
    // sorties de la reprise de course réglée par le kiné
    arr("kf-runs").forEach(function (x) { var id = m(x.d); if (!x.rp || !/^\d{4}-\d{2}$/.test(id)) return; B[id] = B[id] || { s: [], p: [], r: {} }; (B[id].c = B[id].c || []).push(x); });
    var G = obj("kf-salle-log"); if (Object.keys(G).length) B.salle = { g: G };
    return B;
  }
  var jBusy = false, merged = false;
  function journalSync(pid) {
    if (consent() !== "1" || !window.fbPat || !fbPat.journalPut || jBusy) return Promise.resolve();
    jBusy = true;
    var first = !merged && !localStorage.getItem(JH) ? journalMerge(pid) : Promise.resolve();
    return first.then(function () {
      merged = true;
      var B = buckets(), H = jget(JH, {}), todo = Object.keys(B).filter(function (k) { return H[k] !== hashOf(B[k]); });
      return todo.reduce(function (p, k) { return p.then(function () { return fbPat.journalPut(pid, k, JSON.parse(JSON.stringify(B[k]))).then(function () { H[k] = hashOf(B[k]); jset(JH, H); }); }); }, Promise.resolve());
    }).then(function () { jBusy = false; }, function (e) { jBusy = false; console.log("Journal non envoyé", e); });
  }
  // Récupère le journal enregistré et le fusionne avec ce qu'il y a sur ce téléphone (rien n'est effacé)
  function journalMerge(pid) {
    if (!window.fbPat || !fbPat.journalGet) return Promise.resolve();
    return fbPat.journalGet(pid).then(function (docs) {
      if (!docs.length) return;
      var S = arr("kf-sessions"), P = arr("kf-pain"), R = obj("kf-checkin"), G = obj("kf-salle-log");
      var sk = {}; S.forEach(function (x) { sk[x.id || x.ts || (x.date + x.seance)] = 1; });
      var pk = {}; P.forEach(function (x) { pk[x.ts || (x.date + x.zone + x.exercice)] = 1; });
      docs.forEach(function (d) {
        (d.s || []).forEach(function (x) { var k = x.id || x.ts || (x.date + x.seance); if (!sk[k]) { S.push(x); sk[k] = 1; } });
        (d.p || []).forEach(function (x) { var k = x.ts || (x.date + x.zone + x.exercice); if (!pk[k]) { P.push(x); pk[k] = 1; } });
        Object.keys(d.r || {}).forEach(function (k) { if (!R[k]) R[k] = d.r[k]; });
        Object.keys(d.g || {}).forEach(function (n) { var mine = G[n] || [], seen = {}; mine.forEach(function (e) { seen[e.d] = 1; }); (d.g[n] || []).forEach(function (e) { if (!seen[e.d]) mine.push(e); }); mine.sort(function (a, b) { return a.d < b.d ? -1 : 1; }); G[n] = mine; });
      });
      S.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0) || (a.date < b.date ? 1 : -1); });
      P.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      try { localStorage.setItem("kf-sessions", JSON.stringify(S)); localStorage.setItem("kf-pain", JSON.stringify(P.slice(0, 200))); localStorage.setItem("kf-checkin", JSON.stringify(R)); localStorage.setItem("kf-salle-log", JSON.stringify(G)); } catch (e) {}
      try { if (typeof sessions !== "undefined") sessions = S; if (typeof renderAll === "function") renderAll(); if (window.KineLayout && KineLayout.render) KineLayout.render(); } catch (e) {}
    }, function () {});
  }
  function setConsent(v) {
    try { localStorage.setItem(SYNC, v ? "1" : "0"); } catch (e) {}
    var s = state(); if (v && s && s.pid) journalSync(s.pid);
  }
  // Demandé une fois, juste après le lien avec le kiné
  function askConsent(then) {
    if (consent() != null) { if (then) then(); return; }
    show(back() + "<div><div class='kf-h1 kcb-h1'>Sauvegarder tes séances ?</div><div class='kf-sub'>Tes séances faites à la maison, tes douleurs signalées et ton ressenti du jour peuvent être enregistrés dans ton suivi.</div></div>" +
      "<div class='su-card'><b>Ce que ça change</b><div class='kf-sub'>Ton kiné voit le détail de ce que tu fais chez toi. Et tu retrouves tout si tu changes de téléphone.</div></div>" +
      "<p class='kcb-hint'>Sinon, tout reste uniquement sur ton téléphone et ton kiné ne voit qu'un résumé de la semaine. Tu pourras changer d'avis dans « Mon espace ».</p>",
      "<button class='seq-btn-main' onclick='KineMonSuivi.consent(1)'>Oui, sauvegarder</button><button class='seq-btn-secondary' onclick='KineMonSuivi.consent(0)'>Non, garder sur mon téléphone</button>");
    askThen = then;
  }
  var askThen = null;
  function consentPick(v) { setConsent(!!v); var t = askThen; askThen = null; if (t) t(); else open(); }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") { var s = state(); if (s && s.pid) journalSync(s.pid); } });

  // La séance préparée par le kiné devient une séance de « Ma séance », toujours à jour
  // Séance programmée par le kiné : elle remplace la séance en cours à partir de sa date
  function effEx(d) { return d.exosNext && d.exosFrom && d.exosFrom <= iso() ? d.exosNext : (d.exos || []); }
  function syncSeance(d) {
    var list = jget("kf-custom", []), ex = effEx(d).filter(function (n) { return window.KineBiblio && KineBiblio.find(n); });
    var cur = list.filter(function (x) { return x.id === "kine"; })[0];
    if (!ex.length) { if (cur) jset("kf-custom", list.filter(function (x) { return x.id !== "kine"; })); return; }
    if (cur && cur.ex.join("|") === ex.join("|")) return;
    list = list.filter(function (x) { return x.id !== "kine"; });
    list.unshift({ id: "kine", name: "La séance de mon kiné", ex: ex, at: Date.now(), kine: 1 });
    jset("kf-custom", list.slice(0, 12));
    try { if (window.KineProgram) KineProgram.render(); if (window.KineCompose) KineCompose.page(); } catch (e) {}
  }
  // Résumé de la semaine pour le kiné : nombre de séances, douleur et effort moyens, date de la dernière
  function pushHome(pid) {
    var ss = (typeof sessions !== "undefined" && sessions ? sessions : []).filter(function (x) { return x.date >= monday(); });
    var pains = ss.map(function (x) { return x.douleur; }).filter(function (v) { return v != null && v !== "" && isFinite(+v); }).map(Number);
    var effs = ss.map(function (x) { return x.borg; }).filter(function (v) { return v; }).map(function (v) { return +v * 2; });
    var avg = function (a) { return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length * 10) / 10 : null; };
    var data = { n: Math.min(50, ss.length), dou: avg(pains), eff: avg(effs), der: ss.length ? ss.map(function (x) { return x.date; }).sort().pop() : "" };
    var w = week(), h = w + JSON.stringify(data);
    if (jget(PUSHKEY, "") === h) return;
    fbPat.home(pid, w, data).then(function () { jset(PUSHKEY, h); }, function (e) { console.log("Résumé non envoyé", e); });
  }

  /* ════════ Carte dans l'onglet Suivi ════════ */
  function allB(d) { return window.KineQuest ? KineQuest.merge(d.bilans, d.quest) : (d.bilans || []); }
  function ctx(d) { return { bilans: allB(d), seances: d.seances || [], date0: d.date0 }; }
  function metric(d) {
    var P = KP.get(d.parcours); if (!P) return null;
    var k = P.key, B = allB(d), b = KP.lastWith(B, k.m); if (!b) return null;
    var v = k.lsi ? KP.lsi(b, k.m) : KP.val(b, k.m, "a"); if (v == null) return null;
    var hist = B.slice().reverse().map(function (x) { var y = k.lsi ? KP.lsi(x, k.m) : KP.val(x, k.m, "a"); return y == null ? null : { d: x.d, v: y }; }).filter(Boolean);
    var u = k.lsi ? " %" : (KP.M[k.m].u === "°" ? "°" : " " + KP.M[k.m].u);
    var lab = k.lsi ? ({ quad: "Force de ta cuisse, comparée à l'autre", heel: "Endurance de ton mollet, comparée à l'autre", heelh: "Hauteur de ton talon, comparée à l'autre", dfl: "Souplesse de ta cheville, comparée à l'autre" })[k.m] || KP.M[k.m].l : ({ flex: "Pliage de ton genou", sts30: "Levers de chaise en 30 secondes", visap: "Ton score VISA-P", akps: "Ton score de Kujala", cait: "Stabilité de ta cheville (CAIT, sur 30)", dmat: "Douleur aux premiers pas du matin" })[k.m] || KP.M[k.m].l;
    var next = null;
    P.etapes.slice(d.etape || 0).some(function (e) { return e.obj.some(function (o) { if (o.a && o.a.m === k.m && (o.a.lsi || o.a.min || o.a.max != null) && !(d.done && d.done[o.id]) && !(KP.evalObj(o.a, ctx(d)) || {}).ok) { next = o.a.lsi || o.a.min || o.a.max; return true; } }); });
    return { v: v, u: u, lab: lab, hist: hist, next: next, prev: hist.length > 1 ? hist[hist.length - 2].v : null, lsi: !!k.lsi };
  }
  function slot() {
    if (window.KineRole && KineRole.meButton) KineRole.meButton();
    page();
    var box = $("suivi-v2"); if (!box) return;
    var el = $("kms-slot"); if (!el) return;
    var s = state();
    if (s && s.pending) {
      var r0 = $("kms-join-row"); if (r0) r0.style.display = "none";
      el.innerHTML = "<div class='kms-wait'><div class='kms-wh'><i><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/></svg></i><div><b>Demande envoyée</b><span>En attente de ton kiné</span></div></div>" +
        "<p>Dès qu'il l'accepte, ton parcours apparaît ici : tes étapes, tes bilans et la séance qu'il t'a préparée.</p><button class='kcb-link' onclick='KineMonSuivi.cancelRequest()'>Annuler la demande</button></div>";
      checkRequest(false); return;
    }
    if (s && s.refused) {
      var r1 = $("kms-join-row"); if (r1) r1.style.display = "none";
      el.innerHTML = "<div class='kms-wait'><div class='kms-wh'><div><b>Demande non acceptée</b><span>Parles-en à ton kiné au prochain rendez-vous</span></div></div>" +
        "<button class='kcb-link' onclick='KineMonSuivi.join()'>J'ai un code</button><button class='kcb-link' onclick='KineMonSuivi.forget()'>Fermer</button></div>";
      return;
    }
    if (!s || !s.pid) { el.innerHTML = ""; var r = $("kms-join-row"); if (r) r.style.display = ""; return; }
    var r2 = $("kms-join-row"); if (r2) r2.style.display = "none";
    if (s.lost) { el.innerHTML = "<button class='kms-card' onclick='KineMonSuivi.join()'><b>Suivi au cabinet</b><span>Ta fiche n'est plus disponible. Demande un nouveau code à ton kiné.</span></button>"; return; }
    var d = s.d; if (!d) { el.innerHTML = "<div class='kms-card'><b>Suivi au cabinet</b><span>Chargement…</span></div>"; refresh(true); return; }
    if (!kpReady()) { el.innerHTML = "<div class='kms-card'><b>Suivi au cabinet</b><span>Chargement…</span></div>"; need().then(slot); return; }
    var P = KP.get(d.parcours), E = d.etape || 0, m = metric(d);
    el.innerHTML = (window.KineQuest ? KineQuest.patientCard(d, s.pid) : "") + "<button class='kms-card' onclick='KineMonSuivi.open()'><div class='kms-ck'><span>Suivi au cabinet</span><span>Étape " + (E + 1) + (P ? " sur " + P.etapes.length : "") + "</span></div>" +
      "<div class='kms-ct'>" + esc(P ? P.etapes[Math.min(E, P.etapes.length - 1)].nom : "Ton parcours") + "</div>" +
      (m ? "<div class='kms-cm'><b>" + KP.fmt(m.v) + m.u + "</b><span>" + esc(m.lab) + "</span></div>" : "<div class='kms-cm'><span>Ton premier bilan arrive au cabinet.</span></div>") +
      (d.msg && d.msg.t ? "<div class='kms-cmsg'>« " + esc(d.msg.t) + " »</div>" : "") + "</button>";
    refresh(false);
  }
  function rowHtml() { return "<div class='kms-joincard' id='kms-join-row'" + (linked() ? " style='display:none'" : "") + "><b>Ton kiné utilise KinéForce ?</b><span>Relie ton appli pour voir tes étapes, tes bilans et la séance qu'il te prépare.</span>" +
    "<div><button class='kms-jc-main' onclick='KineMonSuivi.join()'>J'ai un code</button>" + (window.KineRole ? "<button onclick='KineRole.demande()'>Demander un accès</button>" : "") + "</div></div>"; }

  /* ════════ Écrans ════════ */
  function sheet() {
    var el = $("kms-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kms-sheet"; el.className = "kf-sheet kcb"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Mon suivi au cabinet"); document.body.appendChild(el); }
    return el;
  }
  function show(html, foot) { var el = sheet(); el.innerHTML = "<div class='kf-sheet-body'>" + html + "</div>" + (foot ? "<div class='kf-sheet-foot'>" + foot + "</div>" : ""); el.classList.add("open"); }
  function back() { return "<div class='kcb-top'><button class='kf-back' onclick='KineMonSuivi.close()' aria-label='Retour'><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M15 18l-6-6 6-6'/></svg></button><span></span><i></i></div>"; }
  function join(err) {
    show(back() + "<div><div class='kf-h1 kcb-h1'>Relier mon téléphone à mon kiné</div><div class='kf-sub'>Tape le code à 6 caractères que ton kiné t'a donné. Tu verras tes étapes, tes bilans et ta progression.</div></div>" +
      "<input class='kcb-in kms-code' id='kms-code' maxlength='7' autocomplete='off' autocapitalize='characters' spellcheck='false' placeholder='ABC123' aria-label='Code de ton kiné'>" +
      (err ? "<div class='kcb-alert'><b>" + esc(err) + "</b></div>" : "") +
      "<p class='kcb-hint'>Ton kiné voit ta fiche et un résumé de tes séances à la maison (nombre de séances, douleur moyenne). Rien d'autre ne quitte ton téléphone.</p>" +
      (window.KineRole ? "<button class='v2-row' onclick='KineMonSuivi.close();KineRole.demande()'><b>Pas de code ? Demander un accès</b><span>›</span></button>" +
        "<button class='v2-row' onclick='KineMonSuivi.close();KineRole.loginForm(\"restore\")'><b>J'avais déjà un suivi</b><span>›</span></button>" : ""),
      "<button class='seq-btn-main' id='kms-go' onclick='KineMonSuivi.doJoin()'>Valider</button>");
    setTimeout(function () { var i = $("kms-code"); if (i) i.focus(); }, 100);
  }
  function doJoin() {
    var c = ($("kms-code").value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 6) { join("Le code fait 6 caractères."); return; }
    if (!window.fbPat) { join("Connexion impossible pour l'instant. Vérifie Internet, puis réessaie."); return; }
    var b = $("kms-go"); if (b) { b.disabled = true; b.textContent = "Vérification…"; }
    fbPat.join(c).then(function (pid) {
      jset(KEY, { pid: pid }); try { localStorage.removeItem(PUSHKEY); localStorage.removeItem(JH); } catch (e) {}
      return refresh(true).then(function () { askConsent(open); });
    }, function (e) {
      var m = String(e && e.message || "");
      join(m === "expire" ? "Ce code a expiré. Demande un nouveau code à ton kiné." : m === "code" || /permission/i.test(m) ? "Code inconnu ou déjà utilisé. Vérifie-le ou demande un nouveau code à ton kiné." : "Connexion impossible pour l'instant. Vérifie Internet, puis réessaie.");
    });
  }
  function open() { view(); sheet().scrollTop = 0; refresh(true); }
  var PREV = null;
  // Aperçu côté kiné : exactement ce que voit le patient, sans rien enregistrer
  function preview(d) { PREV = d; view(); sheet().scrollTop = 0; }
  function view() {
    var s = PREV ? { d: PREV } : state(); if (!s || !s.d) { join(); return; }
    if (!kpReady()) { need().then(view); return; }
    var y = sheet().scrollTop; show(back() + (PREV ? "<div class='kms-prev'>Aperçu : ce que voit ton patient</div>" : "") + body(s, !!PREV, false)); sheet().scrollTop = y;
  }
  /* ════════ Onglet « Mon kiné » : le suivi au cabinet, sans ouvrir de fenêtre ════════ */
  function page(force) {
    var el = $("monkine-body"), pg = $("page-monkine"); if (!el || !pg || !pg.classList.contains("active")) return;
    var s = state(), h = "<div class='kmk-head'><h1 class='lx-title'>Mon kiné</h1></div>";
    if (s && s.pid && !kpReady()) { el.innerHTML = h + "<div class='kms-card'><b>Suivi au cabinet</b><span>Chargement…</span></div>"; need().then(function () { page(force); }); return; }
    if (s && s.pid && s.d) h += body(s, false, true);
    else if (s && s.pid) h += "<div class='kms-card'><b>Suivi au cabinet</b><span>Chargement…</span></div>";
    else {
      if (s && s.pending) { el.innerHTML = h + "<div class='kms-wait'><div class='kms-wh'><div><b>Demande envoyée</b><span>Ton kiné doit l'accepter</span></div></div><p>Dès qu'il l'accepte, ton suivi apparaît ici : ton étape, tes bilans et la séance qu'il t'a préparée.</p><button class='kcb-link' onclick='KineMonSuivi.cancelRequest()'>Annuler la demande</button></div>"; if (force) checkRequest(true); return; }
      h += (s && s.refused ? "<div class='kms-wait'><div class='kms-wh'><div><b>Demande non acceptée</b><span>Parles-en à ton kiné au prochain rendez-vous</span></div></div></div>" : "") +
        "<p class='lx-lede'>Relie ton appli à ton kiné : tu verras ton étape, tes bilans, la séance qu'il te prépare et ses questionnaires.</p>" +
        "<div class='kmk-join'><button class='krl-row dark' onclick='KineMonSuivi.join()'><span class='krl-ic'>ABC</span><span class='krl-t'><b>J'ai un code de mon kiné</b><span>6 caractères, donnés au cabinet</span></span></button>" +
        (window.KineRole ? "<button class='krl-row' onclick='KineRole.demande()'><span class='krl-ic soft'>?</span><span class='krl-t'><b>Demander un accès</b><span>Ton kiné reçoit ta demande et l'accepte</span></span></button>" +
          "<button class='krl-row dash' onclick='KineRole.loginForm(\"restore\")'><span class='krl-ic grey'>↺</span><span class='krl-t'><b>J'avais déjà un suivi</b><span>Avec mon identifiant ou Google</span></span></button>" : "") + "</div>";
    }
    el.innerHTML = h;
    if (force) refresh(true);
  }
  function body(s, prev, inline) {
    var d = s.d, P = KP.get(d.parcours); if (!P) return "<div class='kf-note'>Ton kiné prépare ton parcours.</div>";
    var PREV = prev;
    var E = Math.min(d.etape || 0, P.etapes.length - 1), m = metric(d), cx = ctx(d), B = d.bilans || [];
    var html = (inline ? "" : "<div><div class='kf-sub'>" + (B[0] ? "Bilan du " + dfr(B[0].d) : "Avec ton kiné") + "</div><div class='kf-h1 kcb-h1'>Ta progression</div></div>") + (!PREV && window.KineQuest ? KineQuest.patientCard(d, s.pid) : "");
    if (inline) html += "<div class='kms-card kmk-step'><div class='kms-ck'><span>" + esc(P.nom) + "</span><span>Étape " + (E + 1) + " sur " + P.etapes.length + "</span></div><div class='kms-ct'>" + esc(P.etapes[E].nom) + "</div>" +
      (P.etapes[E].but ? "<div class='kms-cm'><span>" + esc(P.etapes[E].but) + "</span></div>" : "") + "</div>";
    // Comprendre sa rééducation : la fiche du parcours et les conseils personnalisés du kiné
    if (window.KineReprise && d.course && !PREV) html += KineReprise.patientCard(d);
    if (!PREV && inline && window.KineNotifs && KineNotifs.supported && KineNotifs.supported() && !KineNotifs.kineState(s.pid) && !jget("kf-cab-notif-non", false))
      html += "<div class='kmk-notif'><div><b>Être prévenu par ton kiné</b><span>Une notification quand il t'envoie une séance, un questionnaire ou débloque une étape.</span><em id='kmk-nmsg'></em></div><div class='kcb-two'><button class='seq-btn-secondary' onclick='KineMonSuivi.notifNo()'>Non merci</button><button class='seq-btn-main' onclick='KineMonSuivi.notifOn()'>Activer</button></div></div>";
    if (window.KineFiches && (KineFiches.get(d.parcours) || d.conseil)) html += "<button class='kmk-fiche' onclick='KineMonSuivi.fiche()'><i aria-hidden='true'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z'/><path d='M8 7h6M8 11h6'/></svg></i><span><b>Comprendre ma rééducation</b><em>" + (d.conseil ? "Avec les conseils de ton kiné" : "Ce qui est normal, ce qui aide, quand appeler") + "</em></span><u>›</u></button>";
    if (m) {
      var pct = m.lsi ? Math.min(100, m.v) : null;
      html += "<div class='kcb-slab'><div class='kcb-slab-k'><span>" + esc(m.lab) + "</span></div><div class='kms-big'><b>" + KP.fmt(m.v) + m.u + "</b>" +
        (m.prev != null && m.v !== m.prev ? "<em>" + (m.v > m.prev ? "+" : "") + KP.fmt(m.v - m.prev) + (m.lsi ? " points" : "") + " depuis le dernier bilan</em>" : "") + "</div>" +
        (pct != null ? "<div class='kms-track'><i style='width:" + pct + "%'></i>" + (m.next ? "<u style='left:" + m.next + "%'></u>" : "") + "<s style='left:90%'></s></div>" +
          "<div class='kms-tl'><span>" + (m.next ? "Prochain palier : " + m.next + " %" : "") + "</span><span>90 % : retour au sport</span></div>" : (m.next ? "<div class='kms-tl'><span>Prochain palier : " + m.next + m.u + "</span></div>" : "")) + "</div>";
      if (m.hist.length > 1 && window.KineCabinet) html += "<div class='su-card'><div class='su-card-h'><b>Tes bilans</b><span>mesurés au cabinet</span></div>" + KineCabinet._curve(m.hist, m.lsi ? [m.next, 90] : []) + "</div>";
    } else html += "<div class='kf-note'>Ton premier bilan se fait au cabinet : tes mesures et ta courbe apparaîtront ici.</div>";
    // tuiles : amplitude et périmètre
    var tiles = [];
    // tuiles : [mesure, titre, unité, écart avec l'autre côté (gonflement) ou progrès depuis le début]
    var cote = P.zone === "cheville" ? "l'autre cheville" : "l'autre genou";
    [["flex", "Pliage du genou", "°"], ["peri", "Gonflement", " cm", 1], ["dfl", "Souplesse de la cheville", " cm"], ["fig8", "Gonflement", " cm", 1]].forEach(function (t) {
      if (P.mes.indexOf(t[0]) < 0) return;
      var b = KP.lastWith(B, t[0]), f = KP.firstWith(B, t[0]); if (!b || t[0] === (P.key && P.key.m)) return;
      var a = KP.val(b, t[0], "a"), sn = KP.val(b, t[0], "s");
      if (t[3]) { if (sn == null) return; var dd = Math.abs(a - sn), d0 = f && f !== b && KP.val(f, t[0], "s") != null ? Math.abs(KP.val(f, t[0], "a") - KP.val(f, t[0], "s")) : null; tiles.push([t[1], KP.fmt(dd) + t[2], d0 != null && d0 > dd ? "−" + KP.fmt(d0 - dd) + t[2] + " depuis le début" : "écart avec " + cote]); }
      else { var a0 = f && f !== b ? KP.val(f, t[0], "a") : null; tiles.push([t[1], KP.fmt(a) + t[2], a0 != null && a > a0 ? "+" + KP.fmt(a - a0) + t[2] + " depuis le début" : ""]); }
    });
    if (tiles.length) html += "<div class='kcb-two'>" + tiles.map(function (t) { return "<div class='su-card kms-tile'><span>" + esc(t[0]) + "</span><b>" + esc(t[1]) + "</b><em>" + esc(t[2]) + "</em></div>"; }).join("") + "</div>";
    // mot du kiné
    if (d.msg && d.msg.t) html += "<div class='kms-msg'><span>Ton kiné · " + dfr(d.msg.d) + "</span><b>" + esc(d.msg.t) + "</b></div>";
    if (d.next) html += "<p class='kf-sub kcb-center'>Prochain bilan au cabinet : <b>" + dfr(d.next) + "</b></p>";
    // étapes
    html += "<div class='kcb-v2h'>Tes étapes</div>";
    var hist = d.hist || [];
    P.etapes.forEach(function (e, i) {
      if (i < E) { var h = hist.filter(function (x) { return x.e === i + 1; }).pop(); html += "<div class='kms-et done'><i>" + ICON_OK + "</i><div><b>" + (i + 1) + " · " + esc(e.nom) + "</b><span>" + (h ? "Validée au cabinet le " + dfr(h.d) : "Validée") + "</span></div></div>"; return; }
      if (i > E) { html += "<div class='kms-et lock'><i>" + ICON_LOCK + "</i><div><b>" + (i + 1) + " · " + esc(e.nom) + "</b><span>Se débloque avec ton kiné, au cabinet</span></div></div>"; return; }
      html += "<div class='kms-et now'><div class='kms-eh'><i>" + (i + 1) + "</i><div><b>" + esc(e.nom) + "</b><span>En cours</span></div></div>" + (i < P.etapes.length - 1 ? "<div class='kms-k'>Pour passer à l'étape suivante</div>" : "") +
        e.obj.map(function (o) { var a = o.a ? KP.evalObj(o.a, cx) : null, ok = !!(d.done && d.done[o.id]) || !!(a && a.ok); return "<div class='kms-o" + (ok ? " ok" : "") + "'><i>" + (ok ? ICON_OK : "") + "</i><span>" + esc(o.p || o.t) + "</span>" + (a && !ok && a.ok === false ? "<b>" + esc(a.v) + "</b>" : "") + "</div>"; }).join("") + "</div>";
    });
    // séance du kiné
    var ex = effEx(d).filter(function (n) { return window.KineBiblio && KineBiblio.find(n); });
    if (ex.length) html += "<div class='su-card'><div class='su-card-h'><b>La séance de ton kiné</b><span>" + ex.length + " exercices</span></div>" + ex.map(function (n) { return "<div class='kms-ex'>" + esc(n) + "</div>"; }).join("") +
      (PREV ? "" : "<button class='seq-btn-main' onclick='KineMonSuivi.go()'>Faire cette séance</button>") + "</div>";
    // charge au cabinet
    var ref = d.ref || P.ref, S = (d.seances || []).filter(function (x) { return x.ex === ref && x.kg != null; }).slice().reverse();
    if (S.length > 1 && window.KineCabinet) html += "<div class='su-card'><div class='su-card-h'><b>" + esc(ref) + "</b><span>au cabinet</span></div>" + KineCabinet._bars(S) + "</div>";
    html += "<div class='kms-why'><b>Pourquoi passer au cabinet ?</b><span>Tes exercices ici sont tes devoirs entre deux séances. Au cabinet, ton kiné mesure ta force, corrige ton geste et décide quand tu passes à l'étape suivante.</span></div>" +
      (PREV ? "" : "<button class='kcb-link' onclick='KineMonSuivi.unlink()'>Délier ce téléphone</button>");
    return html;
  }
  function go() {
    syncSeance((state() || {}).d || {});
    close();
    if (window.KineCompose) KineCompose.start("kine");
  }
  function unlink() {
    if (!confirm("Délier ce téléphone de ta fiche au cabinet ? Ton kiné devra te donner un nouveau code pour la relier.")) return;
    if (window.KineNotifs && KineNotifs.kineOff) KineNotifs.kineOff();
    jset(KEY, null); try { localStorage.removeItem(KEY); localStorage.removeItem(PUSHKEY); localStorage.removeItem(JH); } catch (e) {}
    jset("kf-custom", jget("kf-custom", []).filter(function (x) { return x.id !== "kine"; }));
    close(); slot();
  }
  function notifOn() {
    var s0 = state(); if (!s0 || !s0.pid) return;
    KineNotifs.kineOn(s0.pid).then(function (err) { if (err) { var m = $("kmk-nmsg"); if (m) m.textContent = err; } else { if (window.showToast) showToast("C'est activé : ton kiné pourra te prévenir"); page(); } });
  }
  function notifNo() { jset("kf-cab-notif-non", true); page(); }
  function fiche() {
    var s0 = PREV ? { d: PREV } : state(), d = s0 && s0.d; if (!d || !window.KineFiches) return;
    var f = KineFiches.get(d.parcours);
    var was = sheet().classList.contains("open");
    show(back().replace("KineMonSuivi.close()", was ? (PREV ? "KineMonSuivi.view()" : "KineMonSuivi.open()") : "KineMonSuivi.close()") + "<div><div class='kf-sub'>Ta rééducation</div><div class='kf-h1 kcb-h1'>" + esc(f ? f.t : "Les conseils de ton kiné") + "</div></div>" + KineFiches.html(d.parcours, d.conseil));
    sheet().scrollTop = 0;
  }
  function close() { var el = $("kms-sheet"); if (el) el.classList.remove("open"); PREV = null; page(); }
  function forget() { try { localStorage.removeItem(KEY); } catch (e) {} slot(); }

  return { notifOn: notifOn, notifNo: notifNo, fiche: fiche, view: view, page: page, state: state, consent: consentPick, setConsent: setConsent, syncOn: function () { return consent() === "1"; }, journalSync: journalSync, journalMerge: journalMerge, preview: preview, cancelRequest: cancelRequest, forget: forget, slot: slot, rowHtml: rowHtml, join: join, doJoin: doJoin, open: open, close: close, go: go, unlink: unlink, refresh: refresh, linked: linked, _week: week };
})();
