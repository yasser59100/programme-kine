/* ═══════════ KinéForce — Suivi au cabinet, côté kiné ═══════════
   Sur l'appareil du kiné (connecté avec son compte) : ses patients, identifiés par un pseudonyme,
   le parcours choisi, les bilans (force, amplitude, périmètre, tests), les séances au cabinet,
   les objectifs de chaque étape (cochés ou calculés depuis le bilan), les exercices proposés,
   le guide d'orientation du genou et le code qui relie le téléphone du patient. */
var KineCabinet = (function () {
  "use strict";
  var KP = window.KineParcours;
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function q(s) { return esc(JSON.stringify(s)); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  function dfr(s) { if (!s) return ""; var p = String(s).slice(0, 10).split("-"); return (+p[2]) + " " + MOIS[+p[1] - 1]; }
  function isKine() { return !!(window.fbUser && window.fbUser.isAdmin); }
  function say(t) { if (window.showToast) showToast(t); else alert(t); }
  var ICON = {
    back: "<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M15 18l-6-6 6-6'/></svg>",
    plus: "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' aria-hidden='true'><path d='M12 5v14M5 12h14'/></svg>",
    ok: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M5 12l5 5 9-10'/></svg>",
    phone: "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><rect x='7' y='2' width='10' height='20' rx='2.5'/><path d='M11 18h2'/></svg>",
    play: "<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M8 5v14l11-7z'/></svg>"
  };

  var formPid = null, L = null, C = null, view = "list", bilanEdit = null, sel = null, draft = null, gAns = null, gFor = null;

  function sheet() {
    var el = $("kcb-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kcb-sheet"; el.className = "kf-sheet kcb"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Suivi au cabinet"); document.body.appendChild(el); }
    return el;
  }
  function show(html, foot) {
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'>" + html + "</div>" + (foot ? "<div class='kf-sheet-foot'>" + foot + "</div>" : "");
    el.classList.add("open"); el.scrollTop = 0;
  }
  function top(back, label, right) {
    return "<div class='kcb-top'><button class='kf-back' onclick='" + back + "' aria-label='Retour'>" + ICON.back + "</button><span>" + esc(label || "") + "</span>" + (right || "<i></i>") + "</div>";
  }
  function loading(t) { show(top("KineCabinet.close()", "") + "<div class='kf-note'>" + esc(t || "Chargement…") + "</div>"); }
  function fail(e) { console.error(e); show(top("KineCabinet.open()", "") + "<div class='kf-note'>Connexion impossible pour l'instant. Vérifie Internet, puis réessaie.</div>", "<button class='seq-btn-main' onclick='KineCabinet.open()'>Réessayer</button>"); }

  /* ════════ Liste des patients ════════ */
  function open() {
    if (!isKine()) { if (window.KineCompose) KineCompose.kine(); return; }
    if (!window.fbCab) { loading("Connexion en cours…"); setTimeout(open, 800); return; }
    view = "list"; loading();
    fbCab.list().then(function (rows) { L = rows; list(); }, fail);
  }
  function list() {
    var rows = (L || []).slice().sort(function (a, b) { return (b.maj && b.maj.seconds || 0) - (a.maj && a.maj.seconds || 0); });
    var html = top("KineCabinet.close()", "Espace kiné") +
      "<div><div class='kf-h1 kcb-h1'>Mes patients</div><div class='kf-sub'>Suivi au cabinet : bilans, étapes et progression.</div></div>" +
      "<button class='kcb-cta' onclick='KineCabinet.nouveau()'>" + ICON.plus + "Nouveau patient</button>";
    if (!rows.length) html += "<div class='kf-note'>Aucun patient pour l'instant. Crée une fiche, puis donne le code au patient : son téléphone se relie à sa fiche.</div>";
    html += rows.map(function (p) {
      var P = KP.get(p.parcours), n = P ? P.etapes.length : 0, e = (p.etape || 0) + 1;
      return "<button class='kcb-pat' onclick='KineCabinet.fiche(" + q(p.id) + ")'><div><b>" + esc(p.alias || "Patient") + "</b><span>" + esc(P ? P.nom : "Parcours à choisir") + (p.cote && p.cote !== "2" ? ", " + (p.cote === "D" ? "droit" : "gauche") : "") + "</span></div>" +
        (P ? "<em>Étape " + e + "/" + n + "</em>" : "") + "</button>";
    }).join("");
    html += "<button class='v2-row' onclick='KineCabinet.guide(null)'><b>Guide d'orientation du genou</b><span>›</span></button>";
    show(html);
  }

  /* ════════ Nouveau patient / réglages ════════ */
  function nouveau(fromGuide) {
    draft = draft && fromGuide ? draft : { alias: "", parcours: fromGuide || "", cote: "D", date0: iso(), opts: {} };
    if (fromGuide) draft.parcours = fromGuide;
    form(null);
  }
  function reglages() { draft = { alias: C.alias, parcours: C.parcours, cote: C.cote || "D", date0: C.date0 || iso(), opts: Object.assign({}, C.opts || {}), ref: C.ref || "" }; form(C.id); }
  function form(pid) {
    formPid = pid;
    var d = draft, P = KP.get(d.parcours);
    var chips = KP.ORDER.map(function (id) { return "<button type='button' class='" + (d.parcours === id ? "sel" : "") + "' onclick='KineCabinet.set(\"parcours\"," + q(id) + ")'>" + esc(KP.P[id].nom) + "</button>"; }).join("");
    var opts = P && P.opts ? P.opts.map(function (o) {
      return "<div class='kcb-field'><span class='kcb-lab'>" + esc(o.l) + "</span><div class='kf-chips'>" + o.ch.map(function (c) {
        return "<button type='button' class='" + (d.opts[o.id] === c[0] ? "sel" : "") + "' onclick='KineCabinet.opt(" + q(o.id) + "," + q(c[0]) + ")'>" + esc(c[1]) + "</button>"; }).join("") + "</div></div>";
    }).join("") : "";
    var html = top(pid ? "KineCabinet.fiche(" + q(pid) + ")" : "KineCabinet.open()", pid ? "Réglages" : "Nouveau patient") +
      "<div class='kf-h1 kcb-h1'>" + (pid ? "Modifier la fiche" : "Nouveau patient") + "</div>" +
      "<label class='kcb-field'><span class='kcb-lab'>Pseudonyme ou initiales</span><input class='kcb-in' id='kcb-alias' maxlength='24' value='" + esc(d.alias) + "' placeholder='Par exemple : Samir B.' oninput='KineCabinet.set(\"alias\",this.value,1)'></label>" +
      "<p class='kcb-hint'>Pas de nom complet : la fiche reste pseudonyme.</p>" +
      "<div class='kcb-field'><span class='kcb-lab'>Parcours</span><div class='kf-chips'>" + chips + "</div>" +
      "<button type='button' class='kcb-link' onclick='KineCabinet.guide(\"new\")'>Pas de diagnostic ? Ouvrir le guide d'orientation</button></div>" +
      "<div class='kcb-field'><span class='kcb-lab'>Côté atteint</span><div class='kf-chips'>" +
        [["D", "Droit"], ["G", "Gauche"], ["2", "Les deux"]].map(function (c) { return "<button type='button' class='" + (d.cote === c[0] ? "sel" : "") + "' onclick='KineCabinet.set(\"cote\"," + q(c[0]) + ")'>" + c[1] + "</button>"; }).join("") + "</div></div>" +
      "<label class='kcb-field'><span class='kcb-lab'>" + (P && P.op ? "Date de l'opération" : "Date de début") + "</span><input class='kcb-in' type='date' value='" + esc(d.date0) + "' onchange='KineCabinet.set(\"date0\",this.value,1)'></label>" +
      opts +
      (pid ? "<label class='kcb-field'><span class='kcb-lab'>Exercice de référence au cabinet</span><input class='kcb-in' list='kcb-allex' value='" + esc(d.ref || (P ? P.ref : "")) + "' onchange='KineCabinet.set(\"ref\",this.value,1)'></label>" + datalist() : "");
    var foot = "<button class='seq-btn-main' onclick='KineCabinet.saveForm(" + q(pid) + ")'>" + (pid ? "Enregistrer" : "Créer la fiche et le code") + "</button>" +
      (pid ? "<button class='seq-btn-secondary kcb-danger' onclick='KineCabinet.remove(" + q(pid) + ")'>Supprimer ce patient</button>" : "");
    show(html, foot);
  }
  function datalist() {
    var all = window.KineBiblio ? KineBiblio.all(true).map(function (e) { return e.name; }) : [];
    return "<datalist id='kcb-allex'>" + all.map(function (n) { return "<option value='" + esc(n) + "'></option>"; }).join("") + "</datalist>";
  }
  function set(k, v, quiet) { draft[k] = v; if (k === "parcours") draft.opts = {}; if (!quiet) form(formPid); }
  function opt(k, v) { draft.opts[k] = v; form(formPid); }
  function saveForm(pid) {
    var d = draft;
    if (!String(d.alias || "").trim()) { say("Indique un pseudonyme ou des initiales."); return; }
    if (!d.parcours) { say("Choisis un parcours (ou « Genou, sans diagnostic précis »)."); return; }
    var data = { alias: String(d.alias).trim().slice(0, 24), parcours: d.parcours, cote: d.cote, date0: d.date0 || iso(), opts: d.opts || {} };
    if (pid) {
      if (d.ref) data.ref = d.ref;
      if (C && C.parcours !== d.parcours) { data.etape = 0; data.done = {}; data.exos = []; }
      fbCab.save(pid, data).then(function () { fiche(pid); }, fail);
    } else {
      data.etape = 0; data.done = {}; data.debut = iso();
      loading("Création de la fiche…");
      fbCab.create(data).then(function (id) { return fbCab.code(id).then(function () { draft = null; codeView(id, true); }); }, fail);
    }
  }
  function remove(pid) {
    if (!confirm("Supprimer définitivement ce patient, ses bilans et ses séances ?")) return;
    loading("Suppression…");
    fbCab.remove(pid).then(open, fail);
  }

  /* ════════ Code du patient ════════ */
  function codeView(pid, fresh) {
    var go = function () {
      var c = C.code, exp = C.codeExp && C.codeExp.toDate ? C.codeExp.toDate() : (C.codeExp ? new Date(C.codeExp) : null);
      var valid = c && exp && exp > new Date();
      show(top("KineCabinet.fiche(" + q(pid) + ")", C.alias) +
        "<div class='kf-h1 kcb-h1'>" + (fresh ? "Fiche créée" : "Code du patient") + "</div>" +
        (C.membres ? "<div class='kcb-ok'>" + ICON.ok + "Le téléphone du patient est relié à cette fiche.</div>" : "") +
        (valid ? "<div class='kcb-code' aria-label='Code'>" + c.split("").map(function (x) { return "<b>" + esc(x) + "</b>"; }).join("") + "</div>" +
          "<p class='kf-sub kcb-center'>Valable jusqu'au " + exp.getDate() + " " + MOIS[exp.getMonth()] + ", une seule fois.</p>" : "<div class='kf-note'>Aucun code valable. Crée-en un nouveau pour relier (ou relier à nouveau) le téléphone du patient.</div>") +
        "<div class='su-card'><b>Pour le patient</b><div class='kf-sub'>Dans KinéForce, onglet Suivi : « J'ai un code de mon kiné », puis il tape ce code. Il voit alors ses étapes, ses bilans et ses courbes. Il ne peut rien modifier.</div></div>",
        "<button class='seq-btn-main' onclick='KineCabinet.fiche(" + q(pid) + ")'>Ouvrir la fiche</button><button class='seq-btn-secondary' onclick='KineCabinet.newCode(" + q(pid) + ")'>Nouveau code</button>");
    };
    loading(); fbCab.get(pid).then(function (p) { C = p; go(); }, fail);
  }
  function newCode(pid) { loading("Nouveau code…"); fbCab.code(pid).then(function () { codeView(pid); }, fail); }

  /* ════════ Fiche patient ════════ */
  function ctx() { return { bilans: C.bilans || [], seances: C.seances || [], date0: C.date0 }; }
  function objState(o) {
    var a = o.a ? KP.evalObj(o.a, ctx()) : null, man = !!(C.done && C.done[o.id]);
    return { auto: a, done: man || !!(a && a.ok === true), man: man };
  }
  function keyMetric(P) {
    var k = P.key, B = C.bilans || [];
    var b = KP.lastWith(B, k.m); if (!b) return null;
    var v = k.lsi ? KP.lsi(b, k.m) : KP.val(b, k.m, "a");
    if (v == null) return null;
    var u = k.lsi ? " %" : (KP.M[k.m].u === "°" ? "°" : " " + KP.M[k.m].u);
    var hist = B.slice().reverse().map(function (x) { var y = k.lsi ? KP.lsi(x, k.m) : KP.val(x, k.m, "a"); return y == null ? null : { d: x.d, v: y }; }).filter(Boolean);
    // prochain seuil : premier objectif de cette mesure, non atteint, à partir de l'étape en cours
    var next = null;
    P.etapes.slice(C.etape || 0).some(function (e) { return e.obj.some(function (o) { if (o.a && o.a.m === k.m && (o.a.lsi || o.a.min) && !objState(o).done) { next = { v: o.a.lsi || o.a.min, e: P.etapes.indexOf(e) }; return true; } }); });
    return { v: v, u: u, hist: hist, next: next };
  }
  function fiche(pid) {
    view = "fiche"; loading();
    fbCab.get(pid).then(function (p) { if (!p) { open(); return; } C = p; sel = null; ficheView(); }, fail);
  }
  function ficheView() {
    var P = KP.get(C.parcours); if (!P) { reglages(); return; }
    var E = Math.min(C.etape || 0, P.etapes.length - 1), et = P.etapes[E];
    var dd = KP.days(C.date0), when = dd == null ? "" : P.op ? "J+" + dd : "Semaine " + (Math.floor(dd / 7) + 1);
    var km = keyMetric(P);
    var bars = P.etapes.map(function (e, i) { return "<i class='" + (i < E ? "done" : i === E ? "now" : "") + "'></i>"; }).join("");
    var states = et.obj.map(objState), nDone = states.filter(function (s) { return s.done; }).length;
    var html = top("KineCabinet.open()", "Mes patients", "<button class='kf-back' onclick='KineCabinet.reglages()' aria-label='Réglages'><svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><circle cx='5' cy='12' r='1.9'/><circle cx='12' cy='12' r='1.9'/><circle cx='19' cy='12' r='1.9'/></svg></button>") +
      "<div><div class='kf-h1 kcb-h1'>" + esc(C.alias) + "</div><div class='kf-sub'>" + esc(P.long) + (C.cote && C.cote !== "2" ? ", " + (C.cote === "D" ? "droit" : "gauche") : "") + (when ? " · " + when : "") + "</div></div>" +
      "<div class='kcb-slab'><div class='kcb-slab-k'><span>Étape " + (E + 1) + " sur " + P.etapes.length + "</span><span>" + nDone + "/" + et.obj.length + " objectifs</span></div>" +
        "<div class='kcb-slab-t'>" + esc(et.nom) + "</div><div class='kcb-bars'>" + bars + "</div>" +
        (km ? "<div class='kcb-slab-m'><div><b>" + KP.fmt(km.v) + km.u + "</b><span>" + esc(P.key.l) + "</span></div>" + (km.next ? "<em>Objectif " + km.next.v + (P.key.lsi ? " %" : "") + "<br>étape " + (km.next.e + 1) + "</em>" : "") + "</div>"
            : "<div class='kcb-slab-m'><span>Premier bilan à faire</span></div>") + "</div>" +
      "<div class='kcb-two'><button class='kcb-cta' onclick='KineCabinet.bilan()'>" + ICON.plus + "Nouveau bilan</button><button class='kcb-cta alt' onclick='KineCabinet.seance()'>Noter la séance</button></div>";
    // objectifs
    html += "<div class='su-card'><div class='su-card-h'><b>Pour passer à l'étape " + (E + 2 <= P.etapes.length ? E + 2 : E + 1) + "</b><span>" + nDone + " sur " + et.obj.length + "</span></div><div class='kf-sub'>" + esc(et.but) + "</div>" +
      et.obj.map(function (o, i) {
        var s = states[i], a = s.auto;
        return "<button class='kcb-obj" + (s.done ? " done" : "") + "' onclick='KineCabinet.tick(" + q(o.id) + ")' aria-pressed='" + s.done + "'><i>" + (s.done ? ICON.ok : "") + "</i><span>" + esc(o.t) + "</span>" +
          (a ? "<em class='" + (a.ok ? "ok" : a.ok === false ? "no" : "") + "'>" + esc(a.v) + "</em>" : s.man ? "<em class='ok'>validé</em>" : "") + "</button>";
      }).join("") +
      (E < P.etapes.length - 1 ? "<button class='" + (nDone === et.obj.length ? "seq-btn-main" : "seq-btn-secondary") + "' onclick='KineCabinet.etape(1)'>" + (nDone === et.obj.length ? "Débloquer l'étape " + (E + 2) + " : " + esc(P.etapes[E + 1].nom) : "Débloquer l'étape " + (E + 2) + " quand même") + "</button>" : "<div class='kcb-ok'>" + ICON.ok + "Dernière étape du parcours.</div>") +
      (E > 0 ? "<button class='kcb-link' onclick='KineCabinet.etape(-1)'>Revenir à l'étape " + E + "</button>" : "") + "</div>";
    // exercices proposés
    var ex = KP.exos(C.parcours, E, C.opts), sent = C.exos || [];
    if (!sel) sel = sent.length ? sent.slice() : [];
    html += "<div class='su-card'><div class='su-card-h'><b>Exercices proposés</b><span>étape " + (E + 1) + "</span></div><div class='kf-sub'>Coche ceux que tu veux donner au patient : ils deviennent « La séance de mon kiné » sur son téléphone.</div>" +
      ex.map(function (n) {
        var on = sel.indexOf(n) >= 0, c = window.KineBiblio ? KineBiblio.color(n) : 0;
        return "<div class='kcb-ex'><button class='kcb-exck" + (on ? " on" : "") + "' onclick='KineCabinet.pick(" + q(n) + ")' aria-pressed='" + on + "'><i>" + (on ? ICON.ok : "") + "</i><span>" + "<i class='kb-dot c" + c + "' aria-hidden='true'></i>" + esc(n) + "</span></button>" +
          "<button class='kcb-demo' onclick='KineBiblio.demo(" + q(n) + ")' aria-label='Voir l&#39;exercice'>" + ICON.play + "</button></div>";
      }).join("") +
      (sel.filter(function (n) { return ex.indexOf(n) < 0; }).length ? "<div class='kf-sub'>Aussi envoyés : " + esc(sel.filter(function (n) { return ex.indexOf(n) < 0; }).join(", ")) + "</div>" : "") +
      "<button class='seq-btn-secondary' onclick='KineCabinet.sendExos()'>" + (same(sel, sent) && sent.length ? "Séance envoyée (" + sent.length + " exercices)" : "Envoyer au patient (" + sel.length + ")") + "</button></div>";
    // à la maison
    var w = (C.maison || [])[0];
    html += "<div class='su-card'><div class='su-card-h'><b>À la maison</b><span>" + (C.membres ? "téléphone relié" : "pas encore relié") + "</span></div>" +
      (w ? "<div class='kcb-3'><div><b>" + w.n + "</b><span>séance" + (w.n > 1 ? "s" : "") + " sem. " + esc(String(w.w).split("-W")[1] || "") + "</span></div><div><b>" + (w.dou != null ? KP.fmt(w.dou) + "/10" : "–") + "</b><span>douleur moyenne</span></div><div><b>" + (w.der ? dfr(w.der) : "–") + "</b><span>dernière séance</span></div></div>"
         : "<div class='kf-sub'>" + (C.membres ? "Aucune séance faite à la maison cette semaine." : "Donne le code au patient pour voir ses séances à la maison.") + "</div>") +
      "<button class='kcb-link' onclick='KineCabinet.code(" + q(C.id) + ")'>" + (C.membres ? "Code du patient" : "Afficher le code à donner au patient") + "</button></div>";
    // bilans
    var B = C.bilans || [];
    html += "<div class='su-card'><div class='su-card-h'><b>Bilans</b><span>" + B.length + "</span></div>" + (km && km.hist.length > 1 ? curve(km.hist, P.key.lsi ? [km.next ? km.next.v : null, 90] : []) : "") +
      (B.length ? B.slice(0, 8).map(function (b) { return "<button class='kcb-brow' onclick='KineCabinet.bilan(" + q(b.id) + ")'><b>" + dfr(b.d) + "</b><span>" + esc(summary(b, P)) + "</span><em>›</em></button>"; }).join("") : "<div class='kf-sub'>Aucun bilan pour l'instant.</div>") + "</div>";
    // séances au cabinet
    var ref = C.ref || P.ref, S = (C.seances || []).filter(function (s) { return s.ex === ref && s.kg != null; }).slice().reverse();
    html += "<div class='su-card'><div class='su-card-h'><b>Séances au cabinet</b><span>" + (C.seances || []).length + "</span></div><div class='kf-sub'>Exercice de référence : " + esc(ref) + "</div>" +
      (S.length ? bars2(S) : "<div class='kf-sub'>La progression de la charge s'affichera ici.</div>") +
      (C.seances || []).slice(0, 5).map(function (x) { var n = (C.notes || []).filter(function (k) { return k.id === x.id; })[0]; return "<div class='kcb-srow'><b>" + dfr(x.d) + "</b><span>" + esc(x.ex) + " : " + (x.series || "") + " × " + (x.reps || "") + (x.kg ? " à " + KP.fmt(x.kg) + " kg" : "") + ", douleur " + x.dou + "/10" + (n ? "<br><i>" + esc(n.t) + "</i>" : "") + "</span></div>"; }).join("") + "</div>";
    // mot + prochain bilan
    html += "<div class='su-card'><b>Pour le patient</b><label class='kcb-field'><span class='kcb-lab'>Un mot (il le voit dans l'appli)</span><input class='kcb-in' id='kcb-msg' maxlength='160' value='" + esc(C.msg && C.msg.t || "") + "' placeholder='Belle séance, on vise 80 % dans 2 semaines.'></label>" +
      "<label class='kcb-field'><span class='kcb-lab'>Prochain bilan</span><input class='kcb-in' id='kcb-next' type='date' value='" + esc(C.next || "") + "'></label><button class='seq-btn-secondary' onclick='KineCabinet.saveMsg()'>Enregistrer</button></div>";
    // repères cliniques
    html += "<details class='kf-acc kcb-acc'><summary>Repères cliniques du parcours</summary><ul>" + (P.notes || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" +
      "<b>Signes d'alerte</b><ul>" + KP.ALERTES.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" +
      "<b>Sources</b><ul class='kcb-src'>" + P.src.map(function (s) { return "<li>" + esc(KP.SRC[s]) + "</li>"; }).join("") + "</ul><p class='kcb-hint'>Les seuils sont des repères issus de ces travaux : à adapter à chaque patient.</p></details>";
    show(html);
  }
  function same(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }
  function summary(b, P) {
    var out = [];
    ["quad", "flex", "ext", "visap", "akps", "sts30", "dou", "hop1"].forEach(function (m) {
      if (out.length >= 3 || P.mes.indexOf(m) < 0) return;
      var v = KP.val(b, m, "a"); if (v == null) return;
      var l = KP.M[m].s && m !== "flex" && m !== "ext" ? KP.lsi(b, m) : null;
      out.push(({ quad: "Quadri", flex: "Flexion", ext: "Extension", visap: "VISA-P", akps: "Kujala", sts30: "Lever de chaise", dou: "Douleur", hop1: "Saut" })[m] + " " + (l != null ? l + " %" : KP.fmt(v) + (KP.M[m].u === "°" ? "°" : " " + KP.M[m].u)));
    });
    return out.join(" · ") || "Bilan";
  }
  function curve(h, lines) {
    var W = 320, H = 150, xs = function (i) { return 24 + (W - 44) * (h.length === 1 ? 0 : i / (h.length - 1)); };
    var vals = h.map(function (p) { return p.v; }).concat(lines.filter(function (x) { return x != null; }));
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); lo = Math.floor((lo - 5) / 10) * 10; hi = Math.ceil((hi + 3) / 10) * 10; if (hi === lo) hi = lo + 10;
    var y = function (v) { return 12 + (H - 40) * (1 - (v - lo) / (hi - lo)); };
    var g = lines.filter(function (x) { return x != null; }).map(function (v, i) { return "<line x1='16' x2='" + (W - 8) + "' y1='" + y(v) + "' y2='" + y(v) + "' stroke='" + (i ? "#F5A524" : "#19C3A0") + "' stroke-width='1.5' stroke-dasharray='5 5'/><text x='18' y='" + (y(v) - 5) + "' text-anchor='start' font-size='11' font-weight='700' fill='" + (i ? "#9A5B00" : "#0B6E59") + "'>" + v + " %</text>"; }).join("");
    var pts = h.map(function (p, i) { return xs(i).toFixed(1) + "," + y(p.v).toFixed(1); }).join(" ");
    var dots = h.map(function (p, i) { return "<circle cx='" + xs(i) + "' cy='" + y(p.v) + "' r='" + (i === h.length - 1 ? 6 : 4) + "' fill='" + (i === h.length - 1 ? "#4B5BFF" : "#fff") + "' stroke='#4B5BFF' stroke-width='2.5'/><text x='" + xs(i) + "' y='" + (y(p.v) - 10) + "' text-anchor='middle' font-size='11' font-weight='700' fill='#46566C'>" + KP.fmt(p.v) + "</text><text x='" + xs(i) + "' y='" + (H - 6) + "' text-anchor='middle' font-size='10' fill='#66768C'>" + dfr(p.d) + "</text>"; }).join("");
    return "<svg viewBox='0 0 " + W + " " + H + "' width='100%' role='img' aria-label='Évolution sur les bilans'>" + g + "<polyline points='" + pts + "' fill='none' stroke='#4B5BFF' stroke-width='3' stroke-linejoin='round' stroke-linecap='round'/>" + dots + "</svg>";
  }
  function bars2(S) {
    S = S.slice(-8); var mx = Math.max.apply(null, S.map(function (s) { return +s.kg || 0; })) || 1;
    return "<div class='kcb-bars2'>" + S.map(function (s, i) { return "<div><em>" + KP.fmt(s.kg) + "</em><i style='height:" + Math.max(8, Math.round((+s.kg || 0) / mx * 100)) + "%'" + (i === S.length - 1 ? " class='last'" : "") + "></i><span>" + dfr(s.d) + "</span></div>"; }).join("") + "</div>";
  }
  function tick(id) {
    var P = KP.get(C.parcours), o = null; P.etapes.forEach(function (e) { e.obj.forEach(function (x) { if (x.id === id) o = x; }); });
    var s = o ? objState(o) : null; if (!s) return;
    if (s.auto && s.auto.ok === true && !s.man) { say("Atteint d'après le dernier bilan."); return; }
    var done = Object.assign({}, C.done || {}); if (done[id]) delete done[id]; else done[id] = iso();
    C.done = done; ficheView(); fbCab.save(C.id, { done: done }).catch(fail);
  }
  function etape(dir) {
    var P = KP.get(C.parcours), n = Math.max(0, Math.min(P.etapes.length - 1, (C.etape || 0) + dir));
    if (dir > 0 && !confirm("Débloquer l'étape " + (n + 1) + " : " + P.etapes[n].nom + " ? Le patient le verra sur son téléphone.")) return;
    var hist = (C.hist || []).concat([{ e: n, d: iso() }]);
    C.etape = n; C.hist = hist; sel = null;
    fbCab.save(C.id, { etape: n, hist: hist }).then(ficheView, fail);
  }
  function pick(n) { var i = sel.indexOf(n); if (i >= 0) sel.splice(i, 1); else if (sel.length < 10) sel.push(n); else { say("10 exercices au maximum."); return; } var y = sheet().scrollTop; ficheView(); sheet().scrollTop = y; }
  function sendExos() { var y = sheet().scrollTop; C.exos = sel.slice(); fbCab.save(C.id, { exos: C.exos }).then(function () { ficheView(); sheet().scrollTop = y; say(C.exos.length ? "Séance envoyée au patient." : "Séance retirée."); }, fail); }
  function saveMsg() {
    var t = ($("kcb-msg").value || "").trim().slice(0, 160), nx = $("kcb-next").value || "";
    var data = { next: nx, msg: t ? { t: t, d: iso() } : null };
    C.next = nx; C.msg = data.msg; fbCab.save(C.id, data).then(function () { say("Enregistré : le patient le verra."); }, fail);
  }

  /* ════════ Bilan ════════ */
  function bilan(id) {
    var P = KP.get(C.parcours);
    bilanEdit = id ? (C.bilans || []).filter(function (b) { return b.id === id; })[0] : null;
    var prev = (C.bilans || []).filter(function (b) { return !bilanEdit || b.id !== bilanEdit.id; })[0] || null;
    var cur = bilanEdit || { d: iso(), m: {} };
    // Mesures utiles maintenant : celles des objectifs de l'étape en cours et de la suivante, et la mesure clé du parcours
    var E = C.etape || 0, need = [P.key.m];
    P.etapes.slice(E, E + 2).forEach(function (e) { e.obj.forEach(function (o) { if (o.a && o.a.m) need.push(o.a.m); if (o.a && o.a.hops) need.push("hop1", "hop3", "hop6"); }); });
    var mes = P.mes.filter(function (m) { return need.indexOf(m) >= 0 || (cur.m && cur.m[m]); });
    if (mes.length < 3) mes = P.mes.slice(0, 4);
    var others = P.mes.filter(function (m) { return mes.indexOf(m) < 0; }).concat(Object.keys(KP.M).filter(function (m) { return P.mes.indexOf(m) < 0; }));
    var side = C.cote === "G" ? "gauche" : C.cote === "D" ? "droit" : "";
    var html = top("KineCabinet.fiche(" + q(C.id) + ")", C.alias) +
      "<div><div class='kf-h1 kcb-h1'>Bilan</div><div class='kf-sub'>" + (side ? "Côté atteint : <b>" + side + "</b>. " : "") + (prev ? "En gris : le bilan du " + dfr(prev.d) + "." : "Premier bilan.") + "</div></div>" +
      "<label class='kcb-field'><span class='kcb-lab'>Date</span><input class='kcb-in' type='date' id='kcb-bd' value='" + esc(cur.d) + "'></label>";
    var groups = {};
    mes.forEach(function (m) { var g = KP.M[m].g; (groups[g] = groups[g] || []).push(m); });
    Object.keys(groups).forEach(function (g) { html += "<div class='su-card kcb-mcard'><b class='kcb-g'>" + esc(g) + "</b>" + groups[g].map(function (m) { return mrow(m, cur, prev); }).join("") + "</div>"; });
    html += "<details class='kf-acc kcb-acc'><summary>Autres mesures</summary><div class='kcb-mcard'>" + others.map(function (m) { return mrow(m, cur, prev); }).join("") + "</div></details>";
    show(html, "<button class='seq-btn-main' onclick='KineCabinet.saveBilan()'>Enregistrer le bilan</button>" + (bilanEdit ? "<button class='seq-btn-secondary kcb-danger' onclick='KineCabinet.delBilan()'>Supprimer ce bilan</button>" : ""));
    live();
  }
  function mrow(m, cur, prev) {
    var d = KP.M[m], r = cur.m[m] || {}, pr = prev && prev.m[m] || {};
    var inp = function (sd, i) {
      var v = Array.isArray(r[sd]) ? r[sd][i] : (i === 0 ? r[sd] : null), pv = Array.isArray(pr[sd]) ? KP.best(m, pr[sd]) : pr[sd];
      return "<input class='kcb-num' inputmode='decimal' data-m='" + m + "' data-s='" + sd + "' data-i='" + i + "' value='" + esc(v == null ? "" : String(v).replace(".", ",")) + "' placeholder='" + esc(i === 0 && pv != null ? KP.fmt(pv) : "") + "' oninput='KineCabinet.live()' aria-label='" + esc(d.l + (sd === "a" ? ", côté atteint" : ", côté sain") + (d.n ? ", essai " + (i + 1) : "")) + "'>";
    };
    var head = "<div class='kcb-mh'><span>" + esc(d.l) + (d.u ? " <i>" + esc(d.u) + "</i>" : "") + "</span><em id='kcb-l-" + m + "'></em></div>";
    var how = "<details class='kcb-how'><summary>Protocole</summary>" + esc(d.how) + "</details>";
    if (d.ch) {
      return "<div class='kcb-m'>" + head + "<div class='kf-chips kcb-ch'>" + d.ch.map(function (c, i) { return "<button type='button' data-m='" + m + "' data-s='a' data-ch='" + i + "' class='" + (r.a === i ? "sel" : "") + "' onclick='KineCabinet.ch(this)'>" + esc(c) + "</button>"; }).join("") + "</div>" + how + "</div>";
    }
    var n = d.n || 1, cols = function (sd) { var o = ""; for (var i = 0; i < n; i++) o += inp(sd, i); return o; };
    var incl = function (sd) { return d.incl ? "<button type='button' class='kcb-incl' onclick='KineCabinet.incl(" + q(m) + "," + q(sd) + ")' aria-label='Mesurer avec le téléphone'>" + ICON.phone + "</button>" : ""; };
    if (!d.s) return "<div class='kcb-m'>" + head + "<div class='kcb-grid' style='grid-template-columns:repeat(" + n + ",minmax(0,1fr))'>" + cols("a") + "</div>" + how + "</div>";
    return "<div class='kcb-m'>" + head +
      "<div class='kcb-sides'><span>Atteint</span><div class='kcb-grid' style='grid-template-columns:repeat(" + n + ",minmax(0,1fr))" + (d.incl ? " 44px" : "") + "'>" + cols("a") + incl("a") + "</div>" +
      "<span>Sain</span><div class='kcb-grid' style='grid-template-columns:repeat(" + n + ",minmax(0,1fr))" + (d.incl ? " 44px" : "") + "'>" + cols("s") + incl("s") + "</div></div>" + how + "</div>";
  }
  function ch(b) { var on = b.classList.contains("sel"); [].forEach.call(b.parentNode.children, function (x) { x.classList.remove("sel"); }); if (!on) b.classList.add("sel"); }
  function collect() {
    var m = {};
    [].forEach.call(sheet().querySelectorAll("input[data-m]"), function (el) {
      var v = el.value.trim().replace(",", "."); if (v === "" || !isFinite(+v)) return;
      var k = el.getAttribute("data-m"), sd = el.getAttribute("data-s"), i = +el.getAttribute("data-i");
      m[k] = m[k] || {};
      if (KP.M[k].n) { m[k][sd] = m[k][sd] || []; m[k][sd][i] = +v; } else m[k][sd] = +v;
    });
    [].forEach.call(sheet().querySelectorAll("button[data-ch].sel"), function (el) { var k = el.getAttribute("data-m"); m[k] = { a: +el.getAttribute("data-ch") }; });
    Object.keys(m).forEach(function (k) { ["a", "s"].forEach(function (sd) { if (Array.isArray(m[k][sd])) { m[k][sd] = m[k][sd].filter(function (x) { return x != null; }); if (!m[k][sd].length) delete m[k][sd]; } }); if (m[k].a == null) delete m[k]; });
    return m;
  }
  function live() {
    var m = collect(), b = { m: m };
    Object.keys(KP.M).forEach(function (k) {
      var el = $("kcb-l-" + k); if (!el) return;
      var l = KP.M[k].s ? KP.lsi(b, k) : null, t = "";
      if (l != null && k !== "ext") t = l + " %";
      if (k === "ext" && m.ext && m.ext.a != null) { var df = Math.max(0, (m.ext.s != null ? m.ext.s : 0) - m.ext.a); t = df ? "déficit " + KP.fmt(df) + "°" : "complète"; }
      if (KP.M[k].n && m[k] && Array.isArray(m[k].a) && m[k].a.length > 1 && l == null) t = "meilleur " + KP.fmt(KP.best(k, m[k].a));
      el.textContent = t;
    });
  }
  function saveBilan() {
    var m = collect();
    if (!Object.keys(m).length) { say("Aucune mesure saisie."); return; }
    var d = $("kcb-bd").value || iso();
    loading("Enregistrement du bilan…");
    fbCab.bilan(C.id, bilanEdit ? bilanEdit.id : null, { d: d, m: m }).then(function () { fiche(C.id); }, fail);
  }
  function delBilan() { if (!confirm("Supprimer ce bilan ?")) return; fbCab.bilanDel(C.id, bilanEdit.id).then(function () { fiche(C.id); }, fail); }

  /* ════════ Séance au cabinet ════════ */
  var S = null;
  function seance() {
    var P = KP.get(C.parcours), ref = C.ref || P.ref;
    var last = (C.seances || []).filter(function (s) { return s.ex === ref; })[0];
    S = { ex: ref, kg: last && last.kg != null ? last.kg : 0, reps: last && last.reps || 10, series: last && last.series || 3, dou: null };
    seanceView(last);
  }
  function seanceView(last) {
    if (last === undefined) last = (C.seances || []).filter(function (s) { return s.ex === S.ex; })[0];
    var P = KP.get(C.parcours), sugg = [C.ref || P.ref].concat(KP.exos(C.parcours, C.etape || 0, C.opts)).filter(function (n, i, a) { return a.indexOf(n) === i; }).slice(0, 8);
    var step = function (k, d, lab, u) { return "<div class='kcb-step'><span class='kcb-lab'>" + lab + "</span><div><button onclick='KineCabinet.st(" + q(k) + "," + (-d) + ")' aria-label='Moins'>−</button><b>" + KP.fmt(S[k]) + "</b><button onclick='KineCabinet.st(" + q(k) + "," + d + ")' aria-label='Plus'>+</button></div><span>" + u + "</span></div>"; };
    var html = top("KineCabinet.fiche(" + q(C.id) + ")", C.alias) + "<div class='kf-h1 kcb-h1'>Séance du jour</div>" +
      "<div class='su-card'><span class='kcb-lab'>Exercice de référence</span><div class='kf-chips'>" + sugg.map(function (n) { return "<button type='button' class='" + (S.ex === n ? "sel" : "") + "' onclick='KineCabinet.sx(" + q(n) + ")'>" + esc(n) + "</button>"; }).join("") + "</div>" +
      "<input class='kcb-in' list='kcb-allex' placeholder='Autre exercice…' onchange='KineCabinet.sx(this.value)'>" + datalist() +
      (last ? "<div class='kf-sub'>Dernière fois (" + dfr(last.d) + ") : " + (last.series || "") + " × " + (last.reps || "") + (last.kg ? " à " + KP.fmt(last.kg) + " kg" : "") + "</div>" : "") +
      "<div class='kcb-two'>" + step("kg", 0.5, "Charge", "kg") + step("reps", 1, "Répétitions", "par série") + "</div>" + step("series", 1, "Séries", "") + "</div>" +
      "<div class='su-card'><span class='kcb-lab'>Douleur pendant la séance</span><div class='kcb-pain'>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return "<button class='" + (S.dou === v ? "sel" : "") + "' onclick='KineCabinet.sd(" + v + ")'>" + v + "</button>"; }).join("") + "</div></div>" +
      "<label class='su-card kcb-field'><span class='kcb-lab'>Note pour toi (le patient ne la voit pas)</span><input class='kcb-in' id='kcb-snote' maxlength='200'></label>";
    show(html, "<button class='seq-btn-main' onclick='KineCabinet.saveSeance()'>Valider la séance</button>");
  }
  function st(k, d) { var step = k === "kg" ? (S.kg >= 20 ? 2.5 : S.kg >= 10 ? 1 : 0.5) : 1; S[k] = Math.max(0, Math.round((S[k] + (d > 0 ? step : -step)) * 10) / 10); if (k !== "kg" && S[k] < 1) S[k] = 1; var y = sheet().scrollTop; seanceView(); sheet().scrollTop = y; }
  function sx(n) { if (!n) return; S.ex = n; var last = (C.seances || []).filter(function (s) { return s.ex === n; })[0]; if (last) { S.kg = last.kg || 0; S.reps = last.reps || 10; S.series = last.series || 3; } seanceView(last || null); }
  function sd(v) { S.dou = v; var y = sheet().scrollTop; seanceView(); sheet().scrollTop = y; }
  function saveSeance() {
    if (S.dou == null) { say("Indique la douleur pendant la séance."); return; }
    var data = { d: iso(), ex: S.ex, kg: S.kg, reps: S.reps, series: S.series, dou: S.dou }, note = ($("kcb-snote").value || "").trim().slice(0, 200);
    loading("Enregistrement…");
    fbCab.seance(C.id, data).then(function (id) { return note ? fbCab.note(C.id, id, { d: data.d, t: note }) : null; }).then(function () { fiche(C.id); }, fail);
  }

  /* ════════ Inclinomètre : le téléphone mesure l'angle du genou ════════
     Téléphone à plat sur la cuisse puis sur le tibia, le haut du téléphone toujours vers le pied :
     flexion = inclinaison de la cuisse − inclinaison du tibia. */
  var I = null;
  function incl(m, sd) {
    I = { m: m, sd: sd, step: 0, buf: [], thigh: null, res: null, got: false };
    var el = $("kcb-incl"); if (!el) { el = document.createElement("div"); el.id = "kcb-incl"; el.className = "kcb-incl-ov"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Mesure avec le téléphone"); document.body.appendChild(el); }
    var start = function () { window.addEventListener("deviceorientation", onOri); setTimeout(function () { if (I && !I.got) { I.err = 1; inclView(); } }, 1800); inclView(); };
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(function (r) { if (r === "granted") start(); else { I.err = 2; inclView(); } }, function () { I.err = 2; inclView(); });
    } else start();
    el.classList.add("open");
  }
  function onOri(e) { if (!I || e.beta == null) return; I.got = true; I.buf.push(e.beta); if (I.buf.length > 15) I.buf.shift(); var c = $("kcb-ang"); if (c) c.textContent = Math.round(med()) + "°"; var s = $("kcb-stab"); if (s) s.className = spread() < 1.5 ? "ok" : ""; }
  function med() { var a = I.buf.slice().sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor(a.length / 2)] : 0; }
  function spread() { if (I.buf.length < 8) return 99; return Math.max.apply(null, I.buf) - Math.min.apply(null, I.buf); }
  function inclView() {
    var el = $("kcb-incl"); if (!el || !I) return;
    var isExt = I.m === "ext";
    var body;
    if (I.err) body = "<p>" + (I.err === 2 ? "L'accès aux capteurs a été refusé. Tu peux l'autoriser dans les réglages du navigateur, ou saisir la valeur mesurée au goniomètre." : "Le capteur d'inclinaison ne répond pas sur cet appareil. Saisis la valeur mesurée au goniomètre.") + "</p><button class='seq-btn-main' onclick='KineCabinet.inclClose()'>Fermer</button>";
    else if (I.res != null) body = "<div class='kcb-ang big'>" + KP.fmt(I.res) + "°</div><p>" + (isExt ? (I.res < 0 ? "Déficit d'extension de " + KP.fmt(-I.res) + "°." : I.res > 0 ? "Hyperextension de " + KP.fmt(I.res) + "°." : "Extension complète.") : "Flexion du genou.") + "</p>" +
      "<button class='seq-btn-main' onclick='KineCabinet.inclUse()'>Utiliser cette valeur</button><button class='seq-btn-secondary' onclick='KineCabinet.incl(" + q(I.m) + "," + q(I.sd) + ")'>Recommencer</button>";
    else body = "<div class='kcb-ang' id='kcb-ang'>–</div><div id='kcb-stab'>Garde le téléphone immobile</div>" +
      "<ol class='kcb-isteps'><li class='" + (I.step === 0 ? "now" : "done") + "'>Pose le téléphone à plat sur la face avant de la <b>cuisse</b>, écran vers le haut, <b>le haut du téléphone vers le pied</b>.</li>" +
      "<li class='" + (I.step === 1 ? "now" : "") + "'>Pose-le de la même façon sur le <b>tibia</b>, juste sous le genou.</li></ol>" +
      "<button class='seq-btn-main' onclick='KineCabinet.inclTake()'>" + (I.step === 0 ? "Enregistrer la cuisse" : "Enregistrer le tibia") + "</button>";
    el.innerHTML = "<div class='kcb-incl-card'><div class='kcb-mh'><span>" + esc(KP.M[I.m].l) + ", côté " + (I.sd === "a" ? "atteint" : "sain") + "</span><button class='kf-back' onclick='KineCabinet.inclClose()' aria-label='Fermer'>×</button></div>" + body + "</div>";
  }
  function inclTake() {
    if (!I.buf.length) return;
    var v = med();
    if (I.step === 0) { I.thigh = v; I.step = 1; I.buf = []; inclView(); return; }
    var flex = Math.round(I.thigh - v);
    I.res = I.m === "ext" ? -flex : flex; inclView();
  }
  function inclUse() {
    var el = sheet().querySelector("input[data-m='" + I.m + "'][data-s='" + I.sd + "'][data-i='0']");
    if (el) { el.value = String(I.res); live(); }
    inclClose();
  }
  function inclClose() { window.removeEventListener("deviceorientation", onOri); var el = $("kcb-incl"); if (el) el.classList.remove("open"); I = null; }

  /* ════════ Guide d'orientation du genou ════════ */
  var G_SEC = [["Interrogatoire", ["trauma", "age", "zone", "signes"]], ["Examen clinique", ["tests"]]];
  function guide(forWho) {
    gFor = forWho; gAns = gAns || { alertes: [] };
    var G = KP.GUIDE, r = KP.guide(gAns), Q = {}; G.q.forEach(function (x) { Q[x.id] = x; });
    var nAl = gAns.alertes.length;
    var html = top(forWho === "new" ? "KineCabinet.nouveau()" : forWho ? "KineCabinet.fiche(" + q(forWho) + ")" : "KineCabinet.open()", "Guide d'orientation") +
      "<div><div class='kf-h1 kcb-h1'>Genou sans diagnostic</div><div class='kf-sub'>Coche ce que tu observes : le guide classe les pistes et explique pourquoi. Une aide au raisonnement, pas un diagnostic.</div></div>";
    // 1. alertes
    html += "<section class='kgd-sec" + (nAl ? " alert" : "") + "'><div class='kgd-h'><i>1</i><b>Signes d'alerte</b><span>" + (nAl ? nAl + " coché" + (nAl > 1 ? "s" : "") : "à écarter d'abord") + "</span></div>" +
      G.alertes.map(function (a) { var on = gAns.alertes.indexOf(a.id) >= 0; return "<button class='kgd-al" + (on ? " on" : "") + "' onclick='KineCabinet.gA(" + q(a.id) + ")' aria-pressed='" + on + "'><i>" + (on ? "!" : "") + "</i><span>" + esc(a.t) + "</span></button>"; }).join("") + "</section>";
    // 2 et 3. interrogatoire et examen
    G_SEC.forEach(function (sec, si) {
      html += "<section class='kgd-sec'><div class='kgd-h'><i>" + (si + 2) + "</i><b>" + esc(sec[0]) + "</b>" + (sec[1][0] === "tests" ? "<span>appui long : description</span>" : "") + "</div>" +
        sec[1].map(function (id) {
          var x = Q[id];
          return "<div class='kgd-q'><span class='kcb-lab'>" + esc(x.t) + (x.multi ? " <em>plusieurs choix</em>" : "") + "</span><div class='kf-chips kgd-chips'>" + x.ch.map(function (c) {
            var v = gAns[x.id], on = x.multi ? (v || []).indexOf(c[0]) >= 0 : v === c[0], info = id === "tests" && KP.TESTS[c[0]];
            return "<button type='button' class='" + (on ? "sel" : "") + (info ? " kgd-t" : "") + "'" + (info ? " data-t='" + c[0] + "'" : "") + " onclick='KineCabinet.gQ(" + q(x.id) + "," + q(c[0]) + "," + (x.multi ? 1 : 0) + ",this)'>" + esc(c[1]) + (info ? "<i aria-hidden='true'>?</i>" : "") + "</button>"; }).join("") + "</div></div>";
        }).join("") + "</section>";
    });
    // pistes
    html += "<div class='kcb-v2h' id='kgd-res'>Pistes</div>";
    if (r.alertes.length) html += r.alertes.map(function (a) { return "<div class='kcb-alert'><b>" + esc(a.d) + "</b><span>" + esc(a.t) + "</span></div>"; }).join("");
    if (!r.pistes.length) html += "<div class='kgd-empty'><b>Pas encore de piste</b><span>Renseigne l'interrogatoire et les tests. Sans piste claire, le parcours « Genou, sans diagnostic précis » permet de commencer.</span></div>";
    var mx = r.pistes.length ? r.pistes[0].score : 1;
    html += r.pistes.map(function (p, i) {
      return "<div class='kgd-p" + (i === 0 ? " first" : "") + "'><div class='kgd-ph'><i>" + (i + 1) + "</i><div><b>" + esc(p.nom) + "</b><span>" + (i === 0 ? "Piste principale" : "Autre piste") + "</span></div></div>" +
        "<div class='kgd-bar'><u style='width:" + Math.round(p.score / mx * 100) + "%'></u></div>" +
        "<div class='kgd-why'>" + p.why.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("") + "</div>" +
        "<div class='kgd-note'>" + esc(p.note) + "</div>" +
        (gFor ? "<button class='" + (i === 0 ? "seq-btn-main" : "seq-btn-secondary") + "' onclick='KineCabinet.gUse(" + q(p.parcours) + ")'>Parcours « " + esc(KP.P[p.parcours].nom) + " »</button>" : "") + "</div>";
    }).join("");
    if (gFor) html += "<button class='v2-row' onclick='KineCabinet.gUse(\"genou\")'><b>Parcours genou sans diagnostic précis</b><span>›</span></button>";
    html += "<details class='kf-acc kcb-acc'><summary>Sources</summary><ul class='kcb-src'>" + ["stiell", "benj", "decary", "nice", "malliaras", "logLig"].map(function (s) { return "<li>" + esc(KP.SRC[s]) + "</li>"; }).join("") + "</ul></details>";
    var p0 = r.pistes[0], foot = "<div class='kgd-foot'><div><span>" + (r.alertes.length ? "Signe d'alerte" : p0 ? "Piste principale" : "Pistes") + "</span><b>" + esc(r.alertes.length ? "Avis médical d'abord" : p0 ? p0.nom : "à compléter") + "</b></div>" +
      "<button class='kcb-cta' onclick='KineCabinet.gGo()'>Voir</button><button class='kcb-link' onclick='KineCabinet.gReset()'>Effacer</button></div>";
    var y = sheet().classList.contains("open") ? sheet().scrollTop : 0;
    show(html, foot);
    sheet().scrollTop = y;
    holdWire();
  }
  function gGo() { var el = $("kgd-res"); if (el) sheet().scrollTo({ top: el.offsetTop - 12, behavior: "smooth" }); }
  // Appui long sur un test : sa description, ce qui le rend positif ou négatif, sa valeur diagnostique
  var holdT = null, held = false;
  function holdWire() {
    [].forEach.call(sheet().querySelectorAll(".kgd-t"), function (b) {
      var start = function () { held = false; clearTimeout(holdT); holdT = setTimeout(function () { held = true; if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {} testInfo(b.getAttribute("data-t")); }, 480); };
      var stop = function () { clearTimeout(holdT); };
      b.addEventListener("pointerdown", start); b.addEventListener("pointerup", stop); b.addEventListener("pointerleave", stop); b.addEventListener("pointercancel", stop);
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    });
  }
  function testInfo(id) {
    var t0 = KP.TESTS[id]; if (!t0) return;
    var t = {}; Object.keys(t0).forEach(function (k) { t[k] = String(t0[k]).replace(/ ([%:;?!])/g, "\u00a0$1"); });
    var el = $("kcb-tinfo"); if (!el) { el = document.createElement("div"); el.id = "kcb-tinfo"; el.className = "kcb-incl-ov"; el.setAttribute("role", "dialog"); el.onclick = function (e) { if (e.target === el) el.classList.remove("open"); }; document.body.appendChild(el); }
    el.setAttribute("aria-label", t.n);
    el.innerHTML = "<div class='kcb-incl-card kgd-info'><div class='kcb-mh'><span class='kgd-in'>" + esc(t.n) + "</span><button class='kf-back' onclick='document.getElementById(\"kcb-tinfo\").classList.remove(\"open\")' aria-label='Fermer'>×</button></div>" +
      "<div class='kgd-ib'><b>Comment</b><p>" + esc(t.how) + "</p></div>" +
      "<div class='kgd-ib pos'><b>Positif si</b><p>" + esc(t.pos) + "</p></div>" +
      "<div class='kgd-ib neg'><b>Négatif si</b><p>" + esc(t.neg) + "</p></div>" +
      "<div class='kgd-ib'><b>Ce qu'il vaut</b><p>" + esc(t.val) + "</p></div>" +
      (t.src && KP.SRC[t.src] ? "<p class='kcb-hint'>" + esc(KP.SRC[t.src]) + "</p>" : "") + "</div>";
    el.classList.add("open");
  }
  function gA(id) { var a = gAns.alertes, i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); guide(gFor); }
  function gQ(k, v, multi, btn) { if (held && btn && btn.classList.contains("kgd-t")) { held = false; return; } if (multi) { var a = gAns[k] = gAns[k] || [], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); } else gAns[k] = gAns[k] === v ? null : v; guide(gFor); }
  function gReset() { gAns = { alertes: [] }; guide(gFor); }
  function gUse(pid) {
    if (gFor === "new") { nouveau(pid); return; }
    if (gFor) { loading(); fbCab.save(gFor, { parcours: pid, etape: 0, done: {}, exos: [] }).then(function () { fiche(gFor); }, fail); }
  }

  function close() { var el = $("kcb-sheet"); if (el) el.classList.remove("open"); }

  return {
    open: open, close: close, nouveau: nouveau, reglages: reglages, set: set, opt: opt, saveForm: saveForm, remove: remove,
    fiche: fiche, code: codeView, newCode: newCode, tick: tick, etape: etape, pick: pick, sendExos: sendExos, saveMsg: saveMsg,
    bilan: bilan, ch: ch, live: live, saveBilan: saveBilan, delBilan: delBilan,
    seance: seance, st: st, sx: sx, sd: sd, saveSeance: saveSeance,
    incl: incl, inclTake: inclTake, inclUse: inclUse, inclClose: inclClose,
    guide: guide, gA: gA, gQ: gQ, gReset: gReset, gUse: gUse, gGo: gGo, testInfo: testInfo,
    _curve: curve, _bars: bars2
  };
})();
