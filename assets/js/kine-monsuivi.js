/* ═══════════ KinéForce — Mon suivi au cabinet, côté patient ═══════════
   Le patient tape le code donné par son kiné : son téléphone se relie à sa fiche (lecture seule).
   Il voit son étape, ses objectifs, ses bilans en courbes, le mot de son kiné, et la séance que son kiné lui a préparée.
   En retour, le téléphone envoie un résumé de la semaine (nombre de séances, douleur moyenne), rien d'autre. */
var KineMonSuivi = (function () {
  "use strict";
  var KP = window.KineParcours, KEY = "kf-cab", PUSHKEY = "kf-cab-push";
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
      if (r.pid) { jset(KEY, { pid: r.pid }); try { localStorage.removeItem(PUSHKEY); } catch (e) {} return refresh(true).then(function () { if (window.showToast) showToast("Ton kiné a accepté ta demande"); return state(); }); }
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
    if (!force && s.at && Date.now() - s.at < 5 * 60000) return Promise.resolve(s);
    busy = true;
    return fbPat.get(s.pid).then(function (d) {
      busy = false;
      if (!d) { jset(KEY, { pid: s.pid, lost: 1 }); slot(); return state(); }
      d.bilans = (d.bilans || []).map(function (b) { return { d: b.d, m: b.m }; });
      d.seances = (d.seances || []).map(function (x) { return { d: x.d, ex: x.ex, kg: x.kg, reps: x.reps, series: x.series, dou: x.dou }; });
      ["maj", "cree", "codeExp"].forEach(function (k) { delete d[k]; });
      var ns = { pid: s.pid, d: d, at: Date.now() };
      jset(KEY, ns); syncSeance(d); pushHome(s.pid); slot();
      if ($("kms-sheet") && $("kms-sheet").classList.contains("open")) view();
      return ns;
    }, function (e) { busy = false; console.log("Suivi cabinet indisponible", e); return s; });
  }
  // La séance préparée par le kiné devient une séance de « Ma séance », toujours à jour
  function syncSeance(d) {
    var list = jget("kf-custom", []), ex = (d.exos || []).filter(function (n) { return window.KineBiblio && KineBiblio.find(n); });
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
  function ctx(d) { return { bilans: d.bilans || [], seances: d.seances || [], date0: d.date0 }; }
  function metric(d) {
    var P = KP.get(d.parcours); if (!P) return null;
    var k = P.key, B = d.bilans || [], b = KP.lastWith(B, k.m); if (!b) return null;
    var v = k.lsi ? KP.lsi(b, k.m) : KP.val(b, k.m, "a"); if (v == null) return null;
    var hist = B.slice().reverse().map(function (x) { var y = k.lsi ? KP.lsi(x, k.m) : KP.val(x, k.m, "a"); return y == null ? null : { d: x.d, v: y }; }).filter(Boolean);
    var u = k.lsi ? " %" : (KP.M[k.m].u === "°" ? "°" : " " + KP.M[k.m].u);
    var lab = k.lsi ? ({ quad: "Force de ta cuisse, comparée à l'autre" })[k.m] || KP.M[k.m].l : ({ flex: "Pliage de ton genou", sts30: "Levers de chaise en 30 secondes", visap: "Ton score VISA-P", akps: "Ton score de Kujala" })[k.m] || KP.M[k.m].l;
    var next = null;
    P.etapes.slice(d.etape || 0).some(function (e) { return e.obj.some(function (o) { if (o.a && o.a.m === k.m && (o.a.lsi || o.a.min) && !(d.done && d.done[o.id]) && !(KP.evalObj(o.a, ctx(d)) || {}).ok) { next = o.a.lsi || o.a.min; return true; } }); });
    return { v: v, u: u, lab: lab, hist: hist, next: next, prev: hist.length > 1 ? hist[hist.length - 2].v : null, lsi: !!k.lsi };
  }
  function slot() {
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
    var P = KP.get(d.parcours), E = d.etape || 0, m = metric(d);
    el.innerHTML = "<button class='kms-card' onclick='KineMonSuivi.open()'><div class='kms-ck'><span>Suivi au cabinet</span><span>Étape " + (E + 1) + (P ? " sur " + P.etapes.length : "") + "</span></div>" +
      "<div class='kms-ct'>" + esc(P ? P.etapes[Math.min(E, P.etapes.length - 1)].nom : "Ton parcours") + "</div>" +
      (m ? "<div class='kms-cm'><b>" + KP.fmt(m.v) + m.u + "</b><span>" + esc(m.lab) + "</span></div>" : "<div class='kms-cm'><span>Ton premier bilan arrive au cabinet.</span></div>") +
      (d.msg && d.msg.t ? "<div class='kms-cmsg'>« " + esc(d.msg.t) + " »</div>" : "") + "</button>";
    refresh(false);
  }
  function rowHtml() { return "<button class='v2-row' id='kms-join-row' onclick='KineMonSuivi.join()'" + (linked() ? " style='display:none'" : "") + "><b>J'ai un code de mon kiné</b><span>›</span></button>"; }

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
      (window.KineRole ? "<button class='v2-row' onclick='KineMonSuivi.close();KineRole.demande()'><b>Pas de code ? Demander un accès</b><span>›</span></button>" : ""),
      "<button class='seq-btn-main' id='kms-go' onclick='KineMonSuivi.doJoin()'>Valider</button>");
    setTimeout(function () { var i = $("kms-code"); if (i) i.focus(); }, 100);
  }
  function doJoin() {
    var c = ($("kms-code").value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 6) { join("Le code fait 6 caractères."); return; }
    if (!window.fbPat) { join("Connexion impossible pour l'instant. Vérifie Internet, puis réessaie."); return; }
    var b = $("kms-go"); if (b) { b.disabled = true; b.textContent = "Vérification…"; }
    fbPat.join(c).then(function (pid) {
      jset(KEY, { pid: pid }); try { localStorage.removeItem(PUSHKEY); } catch (e) {}
      return refresh(true).then(function () { open(); });
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
    var d = s.d, P = KP.get(d.parcours); if (!P) { show(back() + "<div class='kf-note'>Ton kiné prépare ton parcours.</div>"); return; }
    var E = Math.min(d.etape || 0, P.etapes.length - 1), m = metric(d), cx = ctx(d), B = d.bilans || [];
    var html = back() + (PREV ? "<div class='kms-prev'>Aperçu : ce que voit ton patient</div>" : "") + "<div><div class='kf-sub'>" + (B[0] ? "Bilan du " + dfr(B[0].d) : "Avec ton kiné") + "</div><div class='kf-h1 kcb-h1'>Ta progression</div></div>";
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
    [["flex", "Pliage du genou"], ["peri", "Gonflement"]].forEach(function (t) {
      var b = KP.lastWith(B, t[0]), f = KP.firstWith(B, t[0]); if (!b || t[0] === (P.key && P.key.m)) return;
      var a = KP.val(b, t[0], "a"), sn = KP.val(b, t[0], "s");
      if (t[0] === "peri") { if (sn == null) return; var dd = Math.abs(a - sn), d0 = f && f !== b && KP.val(f, "peri", "s") != null ? Math.abs(KP.val(f, "peri", "a") - KP.val(f, "peri", "s")) : null; tiles.push([t[1], KP.fmt(dd) + " cm", d0 != null && d0 > dd ? "−" + KP.fmt(d0 - dd) + " cm depuis le début" : "écart avec l'autre genou"]); }
      else { var a0 = f && f !== b ? KP.val(f, t[0], "a") : null; tiles.push([t[1], KP.fmt(a) + "°", a0 != null && a > a0 ? "+" + KP.fmt(a - a0) + "° depuis le début" : ""]); }
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
    var ex = (d.exos || []).filter(function (n) { return window.KineBiblio && KineBiblio.find(n); });
    if (ex.length) html += "<div class='su-card'><div class='su-card-h'><b>La séance de ton kiné</b><span>" + ex.length + " exercices</span></div>" + ex.map(function (n) { return "<div class='kms-ex'>" + esc(n) + "</div>"; }).join("") +
      (PREV ? "" : "<button class='seq-btn-main' onclick='KineMonSuivi.go()'>Faire cette séance</button>") + "</div>";
    // charge au cabinet
    var ref = d.ref || P.ref, S = (d.seances || []).filter(function (x) { return x.ex === ref && x.kg != null; }).slice().reverse();
    if (S.length > 1 && window.KineCabinet) html += "<div class='su-card'><div class='su-card-h'><b>" + esc(ref) + "</b><span>au cabinet</span></div>" + KineCabinet._bars(S) + "</div>";
    html += "<div class='kms-why'><b>Pourquoi passer au cabinet ?</b><span>Tes exercices ici sont tes devoirs entre deux séances. Au cabinet, ton kiné mesure ta force, corrige ton geste et décide quand tu passes à l'étape suivante.</span></div>" +
      (PREV ? "" : "<button class='kcb-link' onclick='KineMonSuivi.unlink()'>Délier ce téléphone</button>");
    var y = sheet().scrollTop; show(html); sheet().scrollTop = y;
  }
  function go() {
    syncSeance((state() || {}).d || {});
    close();
    if (window.KineCompose) KineCompose.start("kine");
  }
  function unlink() {
    if (!confirm("Délier ce téléphone de ta fiche au cabinet ? Ton kiné devra te donner un nouveau code pour la relier.")) return;
    jset(KEY, null); try { localStorage.removeItem(KEY); localStorage.removeItem(PUSHKEY); } catch (e) {}
    jset("kf-custom", jget("kf-custom", []).filter(function (x) { return x.id !== "kine"; }));
    close(); slot();
  }
  function close() { var el = $("kms-sheet"); if (el) el.classList.remove("open"); PREV = null; }
  function forget() { try { localStorage.removeItem(KEY); } catch (e) {} slot(); }

  return { preview: preview, cancelRequest: cancelRequest, forget: forget, slot: slot, rowHtml: rowHtml, join: join, doJoin: doJoin, open: open, close: close, go: go, unlink: unlink, refresh: refresh, linked: linked, _week: week };
})();
