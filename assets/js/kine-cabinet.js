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
  // Message bref en bas de l'écran (au lieu d'une alerte qui bloque)
  function say(t) {
    if (window.showToast) { showToast(t); return; }
    var el = document.createElement("div"); el.className = "ko-toast"; el.setAttribute("role", "status"); el.textContent = t;
    document.body.appendChild(el); setTimeout(function () { el.classList.add("on"); }, 30);
    setTimeout(function () { el.classList.remove("on"); setTimeout(function () { el.remove(); }, 400); }, 3500);
  }
  var ICON = {
    back: "<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M15 18l-6-6 6-6'/></svg>",
    plus: "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' aria-hidden='true'><path d='M12 5v14M5 12h14'/></svg>",
    ok: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M5 12l5 5 9-10'/></svg>",
    phone: "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><rect x='7' y='2' width='10' height='20' rx='2.5'/><path d='M11 18h2'/></svg>",
    play: "<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M8 5v14l11-7z'/></svg>",
    next: "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' aria-hidden='true'><path d='M9 6l6 6-6 6'/></svg>"
  };

  var formPid = null, L = null, C = null, view = "list", bilanEdit = null, sel = null, draft = null, gAns = null, gFor = null, gZone = "genou";

  function sheet() {
    var el = $("kcb-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kcb-sheet"; el.className = "kf-sheet kcb"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Suivi au cabinet"); document.body.appendChild(el); }
    return el;
  }
  // tab : onglet de l'espace kiné à afficher en bas (écrans principaux seulement)
  function show(html, foot, tab) {
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'>" + html + "</div>" + (foot ? "<div class='kf-sheet-foot'>" + foot + "</div>" : "") + (tab ? tabs(tab) : "");
    el.classList.toggle("kcb-shell", !!tab);
    el.classList.add("open"); el.scrollTop = 0;
  }
  var TABS = [["list", "Patients", "<circle cx='9' cy='8' r='3.5'/><path d='M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6'/>", "KineCabinet.open()"],
    ["demandes", "Demandes", "<path d='M4 4h16v12H8l-4 4z'/><path d='M8 9h8M8 12h5'/>", "KineCabinet.demandes()"],
    ["bilan", "Bilan", "<path d='M4 19V9M10 19V5M16 19v-7M22 19H2'/>", "KineCabinet.bilanPick()"],
    ["exos", "Exercices", "<path d='M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12'/>", "KineBiblio.open()"],
    ["guide", "Guide", "<circle cx='12' cy='12' r='9'/><path d='M15.5 8.5l-2 5-5 2 2-5z'/>", "KineCabinet.guide(null)"]];
  var nDem = 0;
  function tabs(cur) {
    return "<nav class='kcb-tabs' aria-label='Espace kiné'>" + TABS.map(function (t) {
      return "<button class='" + (t[0] === cur ? "on" : "") + "' onclick='" + t[3] + "'" + (t[0] === cur ? " aria-current='page'" : "") + "><svg width='23' height='23' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + t[2] + "</svg><span>" + t[1] + "</span>" +
        (t[0] === "demandes" && nDem ? "<em>" + nDem + "</em>" : "") + "</button>"; }).join("") + "</nav>";
  }
  function top(back, label, right) {
    return "<div class='kcb-top'><button class='kf-back' onclick='" + back + "' aria-label='Retour'>" + ICON.back + "</button><span>" + esc(label || "") + "</span>" + (right || "<i></i>") + "</div>";
  }
  // En-tête des écrans principaux : « Mode patient » à droite ; fermeture à gauche si l'appli n'est pas en mode kiné
  function head(title, sub) {
    var kineRole = window.KineRole && KineRole.role() === "kine";
    var d = new Date(), J = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"], MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    return "<div class='kcb-head'><div><div class='kf-sub'>" + (sub || J[d.getDay()] + " " + d.getDate() + " " + MO[d.getMonth()]) + "</div><div class='kf-h1 kcb-h1'>" + esc(title) + "</div></div>" +
      (window.KineRole ? "<button class='kf-me kcb-me' onclick='KineRole.hub()' aria-label='Mon espace : changer de mode'><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><circle cx='12' cy='8' r='4'/><path d='M4 21a8 8 0 0 1 16 0'/></svg></button>" : "<button class='kf-back' onclick='KineCabinet.close()' aria-label='Fermer'>×</button>") + "</div>";
  }
  function loading(t) { show(top("KineCabinet.close()", "") + "<div class='kf-note'>" + esc(t || "Chargement…") + "</div>"); }
  function fail(e) { console.error(e); show(top("KineCabinet.close()", "") + "<div class='kf-note'>Connexion impossible pour l'instant. Vérifie Internet, puis réessaie.</div>", "<button class='seq-btn-main' onclick='KineCabinet.open()'>Réessayer</button>"); }

  /* ════════ Liste des patients ════════ */
  var filt = "tous";
  function open() {
    if (!isKine()) { if (window.KineCompose) KineCompose.kine(); return; }
    if (!window.fbCab) { loading("Connexion en cours…"); setTimeout(open, 800); return; }
    view = "list"; loading();
    Promise.all([fbCab.list(), fbCab.demandes ? fbCab.demandes().catch(function () { return []; }) : Promise.resolve([])]).then(function (r) {
      L = r[0]; D = r[1]; nDem = D.length;
      // nouveau téléphone du kiné : on reprend le nom du t-shirt déjà envoyé aux patients
      if (window.KineAvatar && KineAvatar.shirt && !KineAvatar.shirt()) { var w = (L || []).filter(function (p) { return p.tee && p.tee.length; })[0]; if (w) KineAvatar.setShirt(w.tee); }
      list(); }, fail);
  }
  var D = [];
  function initials(a) { return String(a || "?").replace(/[^A-Za-zÀ-ÿ ]/g, " ").trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("") || "?"; }
  function flags(p) {
    var w = (p.maison || [])[0], w2 = (p.maison || [])[1], today = iso();
    var pain = !!(w && w.dou != null && (w.dou >= 5 || (w2 && w2.dou != null && w.dou - w2.dou >= 2)));
    var due = !!(p.next && p.next <= today);
    return { pain: pain, due: due, today: p.next === today, w: w };
  }
  function list() {
    var rows = (L || []).slice().sort(function (a, b) { return (b.maj && b.maj.seconds || 0) - (a.maj && a.maj.seconds || 0); });
    var F = rows.map(function (p) { return flags(p); });
    var nPain = F.filter(function (f) { return f.pain; }).length, nDue = F.filter(function (f) { return f.due; }).length;
    var html = head("Mes patients");
    if (window.KineRole && KineRole.role() !== "kine") html += "<div class='kcb-ok kcb-setk'><span>Ouvrir directement l'espace kiné à chaque lancement sur ce téléphone ?</span><button class='kcb-mode' onclick='KineCabinet.setKine()'>Oui</button></div>";
    if (D.length) html += "<button class='kcb-dem' onclick='KineCabinet.demandes()'><i>" + D.length + "</i><span><b>" + (D.length > 1 ? "Nouvelles demandes d'accès" : "Nouvelle demande d'accès") + "</b><span>" + esc(D.slice(0, 3).map(function (d) { return d.prenom + " " + String(d.nom || "").charAt(0) + "."; }).join(", ")) + "</span></span>" + ICON.next + "</button>";
    html += "<div class='kcb-stats'><div><b>" + rows.length + "</b><span>patient" + (rows.length > 1 ? "s" : "") + " suivi" + (rows.length > 1 ? "s" : "") + "</span></div><div><b>" + nDue + "</b><span>bilan" + (nDue > 1 ? "s" : "") + " à faire</span></div><div class='" + (nPain ? "warn" : "") + "'><b>" + nPain + "</b><span>douleur en hausse</span></div></div>";
    html += "<div class='kcb-filt'>" + [["tous", "Tous"], ["auj", "Bilan aujourd'hui"], ["surv", "À surveiller"]].map(function (f) { return "<button class='" + (filt === f[0] ? "on" : "") + "' onclick='KineCabinet.filter(\"" + f[0] + "\")'>" + f[1] + "</button>"; }).join("") + "</div>";
    var shown = rows.filter(function (p, i) { return filt === "tous" || (filt === "auj" && F[i].due) || (filt === "surv" && (F[i].pain || F[i].due)); });
    if (!rows.length) html += "<div class='kf-note'>Aucun patient pour l'instant. Crée une fiche avec le bouton +, ou accepte une demande d'accès : le téléphone du patient se relie à sa fiche.</div>";
    else if (!shown.length) html += "<div class='kf-note'>Personne dans ce filtre.</div>";
    html += shown.map(function (p) {
      var P = KP.get(p.parcours), n = P ? P.etapes.length : 0, e = (p.etape || 0) + 1, f = flags(p);
      var sub = (P ? P.nom : "Parcours à choisir") + (p.cote && p.cote !== "2" ? ", " + (p.cote === "D" ? "droit" : "gauche") : "");
      var info = f.pain ? "douleur " + KP.fmt(f.w.dou) + "/10 à la maison" : f.due ? "bilan prévu" + (f.today ? " aujourd'hui" : "") : f.w ? f.w.n + " séance" + (f.w.n > 1 ? "s" : "") + " cette semaine" : "";
      return "<button class='kcb-pat" + (f.pain ? " warn" : "") + "' onclick='KineCabinet.fiche(" + q(p.id) + ")'><i>" + esc(initials(p.alias)) + "</i><div><b>" + esc(p.alias || "Patient") + "</b><span>" + esc(sub + (info ? " · " + info : "")) + "</span></div>" +
        (P ? "<em>Étape " + e + "/" + n + "</em>" : "") + "</button>";
    }).join("");
    var tee = window.KineAvatar && KineAvatar.shirt ? KineAvatar.shirt() : null;
    html += "<button class='v2-row kcb-tee' onclick='KineCabinet.tee()'><b>T-shirt de Yass</b><span>" + esc(tee ? (tee[0] + " " + tee[1]).trim() : "Neutre : « Coach Yass »") + " ›</span></button>";
    show(html + "<button class='kcb-fab' onclick='KineCabinet.nouveau()' aria-label='Nouveau patient'>" + ICON.plus + "</button>", null, "list");
  }
  function filter(f) { filt = f; list(); }
  // Le nom imprimé sur le t-shirt de Yass : sur ce téléphone, et sur celui de chaque patient (recopié sur sa fiche)
  function tee() {
    var t = (window.KineAvatar && KineAvatar.shirt && KineAvatar.shirt()) || ["", ""];
    var html = top("KineCabinet.open()", "T-shirt de Yass") +
      "<div><div class='kf-h1 kcb-h1'>Ton nom sur son t-shirt</div><div class='kf-sub'>Tes patients reliés verront Yass avec ton nom, dès la prochaine mise à jour de leur fiche. Laisse vide pour le t-shirt neutre « Coach Yass ».</div></div>" +
      "<label class='kcb-field'><span class='kcb-lab'>Prénom</span><input class='kcb-in' id='kcb-tee1' maxlength='14' value='" + esc(t[0] || "") + "' placeholder='Par exemple : Yasser'></label>" +
      "<label class='kcb-field'><span class='kcb-lab'>Nom</span><input class='kcb-in' id='kcb-tee2' maxlength='14' value='" + esc(t[1] || "") + "' placeholder='Par exemple : Ladraa'></label>";
    show(html, "<button class='seq-btn-main' onclick='KineCabinet.teeSave()'>Enregistrer</button><button class='seq-btn-secondary' onclick='KineCabinet.teeSave(1)'>T-shirt neutre</button>");
  }
  function teeSave(neutral) {
    var a = neutral ? "" : ($("kcb-tee1").value || "").trim(), b = neutral ? "" : ($("kcb-tee2").value || "").trim();
    var t = a || b ? [a.slice(0, 14), b.slice(0, 14)] : null;
    if (window.KineAvatar && KineAvatar.setShirt) KineAvatar.setShirt(t);
    loading("Envoi à tes patients…");
    (fbCab.teeAll ? fbCab.teeAll(t) : Promise.resolve()).then(function () {
      say(t ? "C'est enregistré : Yass porte ton nom, chez tous tes patients." : "Yass porte le t-shirt neutre, chez tous tes patients."); open();
    }, fail);
  }
  function setKine() { try { localStorage.setItem("kf-role", "kine"); } catch (e) {} list(); }

  /* ════════ Demandes d'accès ════════ */
  function demandes() {
    if (!isKine()) { open(); return; }
    loading();
    fbCab.demandes().then(function (rows) {
      D = rows; nDem = rows.length;
      var html = head("Demandes", "Patients sans code") + pushCard();
      if (!rows.length) html += "<div class='kgd-empty'><b>Aucune demande</b><span>Un patient qui n'a pas de code peut demander un accès depuis l'appli, avec son prénom et son nom. La demande arrive ici.</span></div>";
      html += rows.map(function (d) {
        var t = d.t && d.t.toDate ? d.t.toDate() : null;
        return "<button class='kcb-pat' onclick='KineCabinet.accept(" + q(d.id) + ")'><i>" + esc(initials(d.prenom + " " + d.nom)) + "</i><div><b>" + esc(d.prenom + " " + d.nom) + "</b><span>" + esc([t ? "Le " + t.getDate() + " " + MOIS[t.getMonth()] : "", d.msg ? "« " + d.msg + " »" : ""].filter(Boolean).join(" · ")) + "</span></div><em>Voir</em></button>";
      }).join("");
      html += "<p class='kcb-hint'>Les noms complets ne sont visibles que par toi. Une demande est effacée dès que tu l'acceptes ou la refuses, et au bout de 30 jours sinon.</p>";
      show(html, null, "demandes");
    }, fail);
  }
  /* Notification sur ce téléphone à chaque nouvelle demande (envoyée par le robot GitHub, sans nom) */
  function pst() { try { return JSON.parse(localStorage.getItem("kf-kpush") || "null") || {}; } catch (e) { return {}; } }
  function pushCard() {
    var on = !!pst().on;
    return "<div class='su-card khb-acc'><div><b>" + (on ? "Notifications activées" : "Être prévenu des demandes") + "</b><span>" + (on ? "Ce téléphone reçoit une notification à chaque nouvelle demande, sans le nom du patient." : "Une notification sur ce téléphone à chaque nouvelle demande d'accès.") + "</span><span id='kcb-pmsg' class='kcb-pmsg'></span></div>" +
      "<button class='kcb-mode' onclick='KineCabinet.push(" + (on ? 0 : 1) + ")'>" + (on ? "Désactiver" : "Activer") + "</button></div>";
  }
  function b64u8(b64) { var pad = "=".repeat((4 - b64.length % 4) % 4), raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/")), o = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) o[i] = raw.charCodeAt(i); return o; }
  async function push(on) {
    var m = $("kcb-pmsg"), say = function (t) { if (m) m.textContent = t; };
    try {
      if (!on) { var s0 = pst(); if (s0.id) await fbCab.pushDel(s0.id); localStorage.setItem("kf-kpush", JSON.stringify({ on: false })); demandes(); return; }
      if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) { say("Ce téléphone ne permet pas les notifications depuis l'appli."); return; }
      if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !((window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone)) { say("Sur iPhone, ouvre l'appli depuis son icône sur l'écran d'accueil pour activer les notifications."); return; }
      var perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (perm !== "granted") { say("Les notifications sont bloquées dans les réglages du téléphone."); return; }
      say("Activation…");
      var k = localStorage.getItem("kf-push-key") || (window.fbPushKey ? await fbPushKey() : null);
      if (!k) { say("L'envoi des notifications n'est pas encore prêt. Réessaie plus tard."); return; }
      var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u8(k) });
      var j = sub.toJSON(), buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(j.endpoint));
      var id = Array.from(new Uint8Array(buf)).map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("").slice(0, 40);
      await fbCab.pushSave(id, { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } });
      localStorage.setItem("kf-kpush", JSON.stringify({ on: true, id: id }));
      demandes();
    } catch (e) { console.error(e); say("L'activation n'a pas marché. Vérifie ta connexion et réessaie."); }
  }
  function accept(uid) {
    var d = D.filter(function (x) { return x.id === uid; })[0]; if (!d) { demandes(); return; }
    draft = { alias: (d.prenom + " " + String(d.nom || "").charAt(0).toUpperCase() + ".").slice(0, 24), parcours: "", cote: "D", date0: iso(), opts: {}, uid: uid, full: d.prenom + " " + d.nom, msg: d.msg };
    form(null);
  }
  function refuse(uid) {
    if (!confirm("Refuser cette demande ? Le patient verra qu'elle n'a pas été acceptée.")) return;
    loading(); fbCab.refuse(uid).then(demandes, fail);
  }

  /* ════════ Bilan rapide : choisir le patient ════════ */
  function bilanPick() {
    if (!isKine()) { open(); return; }
    var go = function () {
      var rows = (L || []).slice().sort(function (a, b) { var fa = flags(a).due ? 0 : 1, fb = flags(b).due ? 0 : 1; return fa - fb || String(a.alias).localeCompare(String(b.alias)); });
      var html = head("Bilan", "Choisis le patient");
      html += rows.length ? rows.map(function (p) { var P = KP.get(p.parcours), f = flags(p); return "<button class='kcb-pat' onclick='KineCabinet.bilanFor(" + q(p.id) + ")'><i>" + esc(initials(p.alias)) + "</i><div><b>" + esc(p.alias) + "</b><span>" + esc((P ? P.nom : "") + (f.due ? " · bilan prévu" : "")) + "</span></div><em>Bilan</em></button>"; }).join("")
        : "<div class='kf-note'>Aucun patient pour l'instant.</div>";
      show(html, null, "bilan");
    };
    if (L) go(); else { loading(); fbCab.list().then(function (r) { L = r; go(); }, fail); }
  }
  function bilanFor(pid) { loading(); fbCab.get(pid).then(function (p) { C = p; sel = null; bilan(); }, fail); }

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
    var chips = KP.ZONES.map(function (z) {
      return "<span class='kcb-zone'>" + esc(z[1]) + "</span><div class='kf-chips'>" + KP.ORDER.filter(function (id) { return KP.P[id].zone === z[0]; }).map(function (id) { return "<button type='button' class='" + (d.parcours === id ? "sel" : "") + "' onclick='KineCabinet.set(\"parcours\"," + q(id) + ")'>" + esc(KP.P[id].nom) + "</button>"; }).join("") + "</div>";
    }).join("");
    var opts = P && P.opts ? P.opts.map(function (o) {
      return "<div class='kcb-field'><span class='kcb-lab'>" + esc(o.l) + "</span><div class='kf-chips'>" + o.ch.map(function (c) {
        return "<button type='button' class='" + (d.opts[o.id] === c[0] ? "sel" : "") + "' onclick='KineCabinet.opt(" + q(o.id) + "," + q(c[0]) + ")'>" + esc(c[1]) + "</button>"; }).join("") + "</div></div>";
    }).join("") : "";
    var dem = !pid && d.uid;
    var html = top(pid ? "KineCabinet.fiche(" + q(pid) + ")" : dem ? "KineCabinet.demandes()" : "KineCabinet.open()", pid ? "Réglages" : dem ? "Demande d'accès" : "Nouveau patient") +
      (dem ? "<div><div class='kf-h1 kcb-h1'>" + esc(d.full) + "</div>" + (d.msg ? "<div class='kf-sub'>« " + esc(d.msg) + " »</div>" : "") + "</div>" : "<div class='kf-h1 kcb-h1'>" + (pid ? "Modifier la fiche" : "Nouveau patient") + "</div>") +
      "<label class='kcb-field'><span class='kcb-lab'>Pseudonyme ou initiales</span><input class='kcb-in' id='kcb-alias' maxlength='24' value='" + esc(d.alias) + "' placeholder='Par exemple : Samir B.' oninput='KineCabinet.set(\"alias\",this.value,1)'></label>" +
      "<p class='kcb-hint'>" + (dem ? "Le nom complet est effacé dès que tu acceptes : la fiche reste pseudonyme." : "Pas de nom complet : la fiche reste pseudonyme.") + "</p>" +
      "<div class='kcb-field'><span class='kcb-lab'>Parcours</span>" + chips +
      "<button type='button' class='kcb-link' onclick='KineCabinet.guide(\"new\")'>Pas de diagnostic ? Ouvrir le guide d'orientation</button></div>" +
      "<div class='kcb-field'><span class='kcb-lab'>Côté atteint</span><div class='kf-chips'>" +
        [["D", "Droit"], ["G", "Gauche"], ["2", "Les deux"]].map(function (c) { return "<button type='button' class='" + (d.cote === c[0] ? "sel" : "") + "' onclick='KineCabinet.set(\"cote\"," + q(c[0]) + ")'>" + c[1] + "</button>"; }).join("") + "</div></div>" +
      "<label class='kcb-field'><span class='kcb-lab'>" + (P && P.d0 ? P.d0 : P && P.op ? "Date de l'opération" : "Date de début") + "</span><input class='kcb-in' type='date' value='" + esc(d.date0) + "' onchange='KineCabinet.set(\"date0\",this.value,1)'></label>" +
      opts +
      (pid ? "<label class='kcb-field'><span class='kcb-lab'>Exercice de référence au cabinet</span><input class='kcb-in' list='kcb-allex' value='" + esc(d.ref || (P ? P.ref : "")) + "' onchange='KineCabinet.set(\"ref\",this.value,1)'></label>" + datalist() : "");
    if (dem) html += "<div class='kcb-ok'>" + ICON.ok + "Son téléphone se reliera tout seul : pas de code à donner.</div>";
    var foot = "<button class='seq-btn-main' onclick='KineCabinet.saveForm(" + q(pid) + ")'>" + (pid ? "Enregistrer" : dem ? "Accepter et créer la fiche" : "Créer la fiche et le code") + "</button>" +
      (pid ? "<button class='seq-btn-secondary kcb-danger' onclick='KineCabinet.remove(" + q(pid) + ")'>Supprimer ce patient</button>" : "") +
      (dem ? "<button class='seq-btn-secondary kcb-danger' onclick='KineCabinet.refuse(" + q(d.uid) + ")'>Refuser la demande</button>" : "");
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
      if (d.uid) { loading("Création de la fiche…"); fbCab.accept(d.uid, data).then(function (id) { draft = null; D = D.filter(function (x) { return x.id !== d.uid; }); nDem = D.length; fiche(id); }, fail); return; }
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
  function allB() { return window.KineQuest ? KineQuest.merge(C.bilans, C.quest) : (C.bilans || []); }   // bilans du cabinet + questionnaires remplis par le patient
  function ctx() { return { bilans: allB(), seances: C.seances || [], date0: C.date0 }; }
  function objState(o) {
    var a = o.a ? KP.evalObj(o.a, ctx()) : null, man = !!(C.done && C.done[o.id]);
    return { auto: a, done: man || !!(a && a.ok === true), man: man };
  }
  function keyMetric(P) {
    var k = P.key, B = allB();
    var b = KP.lastWith(B, k.m); if (!b) return null;
    var v = k.lsi ? KP.lsi(b, k.m) : KP.val(b, k.m, "a");
    if (v == null) return null;
    var u = k.lsi ? " %" : (KP.M[k.m].u === "°" ? "°" : " " + KP.M[k.m].u);
    var hist = B.slice().reverse().map(function (x) { var y = k.lsi ? KP.lsi(x, k.m) : KP.val(x, k.m, "a"); return y == null ? null : { d: x.d, v: y }; }).filter(Boolean);
    // prochain seuil : premier objectif de cette mesure, non atteint, à partir de l'étape en cours
    var next = null;
    P.etapes.slice(C.etape || 0).some(function (e) { return e.obj.some(function (o) { if (o.a && o.a.m === k.m && (o.a.lsi || o.a.min || o.a.max != null) && !objState(o).done) { next = { v: o.a.lsi || o.a.min || o.a.max, e: P.etapes.indexOf(e) }; return true; } }); });
    return { v: v, u: u, hist: hist, next: next };
  }
  function fiche(pid) {
    view = "fiche"; loading();
    fbCab.get(pid).then(function (p) { if (!p) { open(); return; } C = p; sel = null; exEdit = false; dueExos(); ficheView(); }, fail);
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
      "<button class='kcb-slab kcb-slab-b' onclick='KineCabinet.etapes()'><div class='kcb-slab-k'><span>Étape " + (E + 1) + " sur " + P.etapes.length + "</span><span>" + nDone + "/" + et.obj.length + " objectifs ›</span></div>" +
        "<div class='kcb-slab-t'>" + esc(et.nom) + "</div><div class='kcb-bars'>" + bars + "</div>" +
        (km ? "<div class='kcb-slab-m'><div><b>" + KP.fmt(km.v) + km.u + "</b><span>" + esc(P.key.l) + "</span></div>" + (km.next ? "<em>Objectif " + km.next.v + (P.key.lsi ? " %" : km.u) + "<br>étape " + (km.next.e + 1) + "</em>" : "") + "</div>"
            : "<div class='kcb-slab-m'><span>Premier bilan à faire</span></div>") + "</button>";
    // le prochain objectif à atteindre, en une ligne
    var todo = et.obj.filter(function (o, i) { return !states[i].done; });
    if (todo.length && E < P.etapes.length - 1) html += "<button class='kcb-nexto' onclick='KineCabinet.etapes()'><span>Prochain objectif</span><b>" + esc(todo[0].t) + "</b>" + (todo.length > 1 ? "<em>et " + (todo.length - 1) + " autre" + (todo.length > 2 ? "s" : "") + "</em>" : "") + "</button>";
    else if (E < P.etapes.length - 1) html += "<button class='kcb-nexto ok' onclick='KineCabinet.etapes()'><span>Objectifs atteints</span><b>Débloquer l'étape " + (E + 2) + " : " + esc(P.etapes[E + 1].nom) + "</b></button>";
    // les 4 raccourcis
    var B = C.bilans || [], Q = (C.quest || []), qPend = Q.filter(function (x) { return !x.fini; }).length, qCons = window.KineQuest ? KineQuest.conseils(C, P).filter(function (x) { return x.conseil; }).length : 0;
    var lastS = (C.seances || [])[0], sent = C.exos || [];
    var tile = function (fn, ic, t, sub, cls) { return "<button class='kcb-tile" + (cls ? " " + cls : "") + "' onclick='KineCabinet." + fn + "'><i aria-hidden='true'>" + ic + "</i><b>" + t + "</b><span>" + sub + "</span></button>"; };
    html += "<div class='kcb-tiles'>" +
      tile("bilans()", "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 19V9M10 19V5M16 19v-7M22 19H2'/></svg>", "Bilan",
        B.length ? "Dernier le " + dfr(B[0].d) : "Premier bilan à faire", BNEEDF(P, E) ? "hot" : "") +
      tile("seance()", "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'><path d='M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12'/></svg>", "Séance au cabinet",
        lastS ? "Dernière le " + dfr(lastS.d) : "Noter la charge et la douleur") +
      tile("maison()", "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 11l9-7 9 7v9H3z'/><path d='M9 20v-6h6v6'/></svg>", "Exercices à la maison",
        sent.length ? sent.length + " exercices envoyés" + (C.exosAt && C.vu >= C.exosAt ? ", reçus" : "") : "Aucune séance envoyée", sent.length ? "" : "hot") +
      tile("questView()", "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 4h6l1 2h3v14H5V6h3z'/><path d='M9 12l2 2 4-4'/></svg>", "Questionnaires et tests",
        qPend ? qPend + " en attente de réponse" : qCons ? qCons + " conseillé" + (qCons > 1 ? "s" : "") : "Envoyer au patient", qCons && !qPend ? "hot" : "") + "</div>";
    // pour le patient
    html += "<div class='su-card'><div class='su-card-h'><b>Pour le patient</b><span>" + (C.membres ? "téléphone relié" : "pas encore relié") + "</span></div><label class='kcb-field'><span class='kcb-lab'>Un mot (il le voit dans l'appli)</span><input class='kcb-in' id='kcb-msg' maxlength='160' value='" + esc(C.msg && C.msg.t || "") + "' placeholder='Belle séance, on vise 80 % dans 2 semaines.'></label>" +
      "<label class='kcb-field'><span class='kcb-lab'>Prochain bilan</span><input class='kcb-in' id='kcb-next' type='date' value='" + esc(C.next || "") + "'></label>" +
      "<label class='kcb-field'><span class='kcb-lab'>Conseils personnalisés (en tête de sa fiche « Comprendre ma rééducation »)</span><textarea class='kcb-in kcb-ta' id='kcb-conseil' maxlength='800' rows='3' placeholder='Par exemple : glace 15 min après les séances, pas de course avant le prochain bilan.'>" + esc(C.conseil || "") + "</textarea></label>" +
      "<button class='seq-btn-secondary' onclick='KineCabinet.saveMsg()'>Enregistrer</button>" +
      "<div class='kcb-links'><button class='kcb-link' onclick='KineCabinet.code(" + q(C.id) + ")'>" + (C.membres ? "Code du patient" : "Afficher le code à donner au patient") + "</button>" +
      (window.KineMonSuivi ? "<button class='kcb-link' onclick='KineCabinet.asPatient()'>Voir comme mon patient</button>" : "") +
      (window.KineFiches ? "<button class='kcb-link' onclick='KineCabinet.ficheP()'>Voir sa fiche « Comprendre »</button>" : "") + "</div></div>";
    // repères cliniques
    html += "<details class='kf-acc kcb-acc'><summary>Repères cliniques du parcours</summary><ul>" + (P.notes || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" +
      "<b>Signes d'alerte</b><ul>" + KP.alertes(C.parcours).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" +
      "<b>Sources</b><ul class='kcb-src'>" + P.src.map(function (s) { return "<li>" + esc(KP.SRC[s]) + "</li>"; }).join("") + "</ul><p class='kcb-hint'>Les seuils sont des repères issus de ces travaux : à adapter à chaque patient.</p></details>";
    sub = null; show(html);
  }
  // Une mesure d'objectif de l'étape reste à faire (pour signaler la tuile Bilan)
  function BNEEDF(P, E) { return P.etapes[E].obj.some(function (o) { return o.a && o.a.m && !objState(o).done && !KP.lastWith(allB(), o.a.m); }); }
  var sub = null;   // sous-écran de la fiche ouvert
  function reView() { var y = sheet().scrollTop; if (sub === "etapes") etapes(); else if (sub === "maison") maison(); else if (sub === "quest") questView(); else if (sub === "bilans") bilans(); else ficheView(); sheet().scrollTop = y; }
  function back2() { return top("KineCabinet.fiche(" + q(C.id) + ")", C.alias); }

  /* ── Les étapes, expliquées pour un kiné qui découvre le parcours ── */
  function why(o) {
    var a = o.a, M = a && a.m && KP.M[a.m];
    if (!a) return "Critère clinique : c'est toi qui le valides au cabinet, en touchant la case.";
    if (a.j) return "Délai minimal de cicatrisation depuis le début (J" + a.j + ", environ " + Math.round(a.j / 7) + " semaines) : même avec de bons chiffres, on attend ce délai.";
    if (a.hops) return "Tests de saut sur une jambe (simple, triple, 6 m chronométré) comparés au côté sain. Repère de Noyes : un écart de plus de 10 à 15 % signale un déficit fonctionnel.";
    if (a.dou != null) return "Douleur notée pendant les 3 dernières séances au cabinet (tuile « Séance au cabinet »). Tant qu'elle reste faible, la charge peut augmenter.";
    if (!M) return "";
    if (a.lsi) return "Symétrie = côté atteint ÷ côté sain × 100, mesurée au bilan (" + M.l + "). Un écart persistant est associé à plus de récidives : on attend " + a.lsi + " % avant de passer à la suite.";
    if (a.def != null) return "Écart d'extension avec le côté sain (" + M.l + "), au goniomètre, au téléphone ou sur photo. Un flessum gêne la marche et surcharge l'articulation.";
    if (a.diff != null) return "Écart entre les deux côtés (" + M.l + ") : " + a.diff + " " + (M.u || "") + " au plus.";
    if (a.min != null) return "Valeur à atteindre au bilan, côté atteint (" + M.l + ") : " + a.min + (M.u ? " " + M.u : "") + " au moins.";
    if (a.max != null) return "Valeur à ne pas dépasser au bilan (" + M.l + ").";
    return "Mesuré au bilan : " + M.l + ".";
  }
  function etapes() {
    var P = KP.get(C.parcours), E = Math.min(C.etape || 0, P.etapes.length - 1);
    var html = back2() + "<div class='kf-h1 kcb-h1'>Les étapes</div><div class='kf-sub'>" + esc(P.long) + "</div>" +
      "<div class='kcb-explain'><b>Comment ça marche</b><span>Les étapes avancent sur critères, pas sur le calendrier : on passe à la suivante quand les objectifs sont atteints. Ils se cochent tout seuls à partir des bilans, ou c'est toi qui les coches. Les délais indiqués sont des minimums. Touche un objectif pour le valider à la main.</span></div>";
    P.etapes.forEach(function (et, i) {
      var st = et.obj.map(objState), nd = st.filter(function (s) { return s.done; }).length, j = et.obj.filter(function (o) { return o.a && o.a.j; }).map(function (o) { return o.a.j; })[0];
      var ex = KP.exos(C.parcours, i, C.opts);
      var body = "<p class='kcb-et-but'>" + esc(et.but) + "</p>" + (j ? "<p class='kcb-et-j'>Pas avant J" + j + " (environ " + Math.round(j / 7) + " semaines)</p>" : "") +
        "<div class='kcb-et-h'>" + (i < P.etapes.length - 1 ? "Pour passer à l'étape " + (i + 2) : "Objectifs de fin de parcours") + "</div>" +
        et.obj.map(function (o, k) {
          var s = st[k], a = s.auto, now = i === E;
          return "<div class='kcb-objw'><button class='kcb-obj" + (s.done ? " done" : "") + "'" + (now ? " onclick='KineCabinet.tick(" + q(o.id) + ")' aria-pressed='" + s.done + "'" : " disabled") + "><i>" + (s.done ? ICON.ok : "") + "</i><span>" + esc(o.t) + "</span>" +
            (a ? "<em class='" + (a.ok ? "ok" : a.ok === false ? "no" : "") + "'>" + esc(a.v) + "</em>" : s.man ? "<em class='ok'>validé</em>" : "") + "</button><p class='kcb-why'>" + esc(why(o)) + "</p></div>";
        }).join("") +
        "<div class='kcb-et-h'>Exercices de l'étape</div><p class='kcb-et-ex'>" + esc(ex.slice(0, 8).join(" · ")) + (ex.length > 8 ? " · et " + (ex.length - 8) + " autres" : "") + "</p>";
      if (i === E) body += (i < P.etapes.length - 1 ? "<button class='" + (nd === et.obj.length ? "seq-btn-main" : "seq-btn-secondary") + "' onclick='KineCabinet.etape(1)'>" + (nd === et.obj.length ? "Débloquer l'étape " + (i + 2) : "Débloquer l'étape " + (i + 2) + " quand même") + "</button>" : "<div class='kcb-ok'>" + ICON.ok + "Dernière étape du parcours.</div>") +
        (i > 0 ? "<button class='kcb-link' onclick='KineCabinet.etape(-1)'>Revenir à l'étape " + i + "</button>" : "");
      html += "<details class='kcb-et" + (i < E ? " done" : i === E ? " now" : "") + "'" + (i === E ? " open" : "") + "><summary><i>" + (i < E ? ICON.ok : i + 1) + "</i><span><b>" + esc(et.nom) + "</b><em>" + (i < E ? "validée" : i === E ? "en cours · " + nd + "/" + et.obj.length + " objectifs" : "à venir") + "</em></span></summary>" + body + "</details>";
    });
    html += "<details class='kf-acc kcb-acc'><summary>Sources du parcours</summary><ul class='kcb-src'>" + P.src.map(function (s) { return "<li>" + esc(KP.SRC[s]) + "</li>"; }).join("") + "</ul></details>";
    sub = "etapes"; var y = sheet().scrollTop, again = sheet().querySelector(".kcb-et"); show(html); if (again) sheet().scrollTop = y;
  }

  /* ── Exercices à la maison : la séance envoyée, puis ce que le patient fait chez lui ── */
  function maison() {
    var P = KP.get(C.parcours), E = Math.min(C.etape || 0, P.etapes.length - 1);
    var html = back2() + "<div class='kf-h1 kcb-h1'>Exercices à la maison</div>";
    var ex = KP.exos(C.parcours, E, C.opts), sent = C.exos || [];
    if (C.exosNext && C.exosFrom && !exEdit) html += "<div class='su-card kcb-plan'><div class='su-card-h'><b>Séance programmée</b><span>le " + dfr(C.exosFrom) + "</span></div><div class='kcb-sentl'>" + C.exosNext.map(function (n) { return "<span><i class='kb-dot c" + (window.KineBiblio ? KineBiblio.color(n) : 0) + "' aria-hidden='true'></i>" + esc(n) + "</span>"; }).join("") + "</div>" +
      "<div class='kf-sub'>Le patient la recevra à cette date ; d'ici là, il garde la séance actuelle.</div><button class='kcb-link' onclick='KineCabinet.exUnplan()'>Annuler la séance programmée</button></div>";
    if (sent.length && !exEdit) {
      // séance déjà envoyée : un résumé, et l'accusé de réception du téléphone du patient
      html += "<div class='su-card kcb-sent'><div class='su-card-h'><b>Séance envoyée</b><span>" + (C.exosD ? "le " + dfr(C.exosD) : "") + "</span></div>" +
        "<div class='kcb-sentl'>" + sent.map(function (n) { return "<span><i class='kb-dot c" + (window.KineBiblio ? KineBiblio.color(n) : 0) + "' aria-hidden='true'></i>" + esc(n) + "</span>"; }).join("") + "</div>" + recu(C.exosAt) +
        "<div class='kcb-two'><button class='seq-btn-secondary' onclick='KineCabinet.exEdit(1)'>Modifier</button><button class='seq-btn-main' onclick='KineCabinet.exEdit(0)'>Nouvelle séance</button></div></div>";
    } else {
      if (!sel) sel = sent.length ? sent.slice() : [];
      html += "<div class='su-card'><div class='su-card-h'><b>Exercices de l'étape " + (E + 1) + "</b><span>" + sel.length + " choisi" + (sel.length > 1 ? "s" : "") + "</span></div><div class='kf-sub'>Coche ceux que tu veux donner au patient (10 au plus) : ils deviennent « La séance de mon kiné » sur son téléphone.</div>" +
        ex.map(function (n) {
          var on = sel.indexOf(n) >= 0, c = window.KineBiblio ? KineBiblio.color(n) : 0;
          return "<div class='kcb-ex'><button class='kcb-exck" + (on ? " on" : "") + "' onclick='KineCabinet.pick(" + q(n) + ")' aria-pressed='" + on + "'><i>" + (on ? ICON.ok : "") + "</i><span>" + "<i class='kb-dot c" + c + "' aria-hidden='true'></i>" + esc(n) + "</span></button>" +
            "<button class='kcb-demo' onclick='KineBiblio.demo(" + q(n) + ")' aria-label='Voir l&#39;exercice'>" + ICON.play + "</button></div>";
        }).join("") +
        (sel.filter(function (n) { return ex.indexOf(n) < 0; }).length ? "<div class='kf-sub'>Aussi envoyés : " + esc(sel.filter(function (n) { return ex.indexOf(n) < 0; }).join(", ")) + "</div>" : "") +
        (sent.length ? "<button class='kcb-link' onclick='KineCabinet.exCancel()'>Annuler, garder la séance envoyée</button>" : "") + "</div>";
    }
    // à la maison
    var w = (C.maison || [])[0];
    html += "<div class='su-card'><div class='su-card-h'><b>Ce qu'il fait chez lui</b><span>" + (C.membres ? "téléphone relié" : "pas encore relié") + "</span></div>" +
      (w ? "<div class='kcb-3'><div><b>" + w.n + "</b><span>séance" + (w.n > 1 ? "s" : "") + " sem. " + esc(String(w.w).split("-W")[1] || "") + "</span></div><div><b>" + (w.dou != null ? KP.fmt(w.dou) + "/10" : "–") + "</b><span>douleur moyenne</span></div><div><b>" + (w.der ? dfr(w.der) : "–") + "</b><span>dernière séance</span></div></div>"
         : "<div class='kf-sub'>" + (C.membres ? "Aucune séance faite à la maison cette semaine." : "Donne le code au patient pour voir ses séances à la maison.") + "</div>") +
      journalHtml(4) + "</div>";
    sub = "maison";
    var y = sheet().scrollTop, stay = sheet().querySelector(".kcb-ex, .kcb-sent");
    if (!(sent.length && !exEdit)) html += whenPick("maison");
    show(html, !(sent.length && !exEdit) ? "<button class='seq-btn-main' onclick='KineCabinet.sendExos()'" + (sel.length ? "" : " disabled") + ">" + (WHEN ? "Programmer pour le " + dfr(WHEN) : "Envoyer au patient") + " (" + sel.length + ")</button>" : "");
    if (stay) sheet().scrollTop = y;
  }
  /* ── Questionnaires et tests ── */
  function questView() {
    var P = KP.get(C.parcours);
    sub = "quest"; show(back2() + "<div class='kf-h1 kcb-h1'>Questionnaires et tests</div>" + whenPick("quest") + (window.KineQuest ? KineQuest.card(C, P, "fiche") : ""));
  }
  /* ── Les bilans : courbe, historique, photos, nouveau bilan ── */
  function bilans() {
    var P = KP.get(C.parcours), km = keyMetric(P), B = C.bilans || [];
    var html = back2() + "<div class='kf-h1 kcb-h1'>Bilans</div>" +
      (km && km.hist.length > 1 ? "<div class='su-card'><div class='su-card-h'><b>" + esc(P.key.l) + "</b><span>" + KP.fmt(km.v) + km.u + "</span></div>" + curve(km.hist, P.key.lsi ? [km.next ? km.next.v : null, 90] : []) + "</div>" : "") +
      "<div class='su-card'><div class='su-card-h'><b>Historique</b><span>" + B.length + "</span></div>" +
      (B.length ? B.slice(0, 20).map(function (b) { return "<button class='kcb-brow' onclick='KineCabinet.bilan(" + q(b.id) + ")'><b>" + dfr(b.d) + "</b><span>" + esc(summary(b, P)) + (b.ph ? " · " + b.ph + " photo" + (b.ph > 1 ? "s" : "") : "") + "</span><em>›</em></button>"; }).join("") : "<div class='kf-sub'>Aucun bilan pour l'instant.</div>") + "</div>" +
      "<div id='kcb-phg'></div>";
    sub = "bilans"; show(html, "<button class='seq-btn-main' onclick='KineCabinet.bilan()'>" + ICON.plus + " Nouveau bilan</button>");
    photosGallery($("kcb-phg"), null);
  }
  /* Journal des séances faites à la maison (si le patient a accepté de le sauvegarder) */
  function jdata() {
    var S = [], P = [], R = {};
    (C.journal || []).forEach(function (d) { (d.s || []).forEach(function (x) { S.push(x); }); (d.p || []).forEach(function (x) { P.push(x); }); Object.keys(d.r || {}).forEach(function (k) { R[k] = d.r[k]; }); });
    S.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.ts || 0) - (a.ts || 0); });
    P.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return { S: S, P: P, R: R };
  }
  function sesRow(x) {
    var bits = [x.duree ? x.duree + " min" : "", x.borg ? "effort " + x.borg + "/5" : "", x.douleur != null && x.douleur !== "" ? "douleur " + x.douleur + "/10" : ""].filter(Boolean).join(" · ");
    return "<div class='kcb-srow'><b>" + dfr(x.date) + "</b><span>" + esc(x.seance || "Séance") + (bits ? "<br><i>" + esc(bits) + "</i>" : "") + "</span></div>";
  }
  function journalHtml(n) {
    if (!(C.journal || []).length) return C.membres ? "<p class='kcb-hint'>Le détail des séances apparaît ici si le patient accepte de les sauvegarder (dans « Mon espace » sur son téléphone).</p>" : "";
    var J = jdata();
    return "<div class='kcb-jh'>Dernières séances à la maison</div>" + (J.S.slice(0, n).map(sesRow).join("") || "<div class='kf-sub'>Aucune séance enregistrée.</div>") +
      "<button class='kcb-link' onclick='KineCabinet.journal()'>Tout le journal (" + J.S.length + " séance" + (J.S.length > 1 ? "s" : "") + ", " + J.P.length + " douleur" + (J.P.length > 1 ? "s" : "") + " signalée" + (J.P.length > 1 ? "s" : "") + ")</button>";
  }
  function journal() {
    var J = jdata(), days = Object.keys(J.R).sort().reverse().slice(0, 30);
    var html = top("KineCabinet.fiche(" + q(C.id) + ")", C.alias) + "<div class='kf-h1 kcb-h1'>Journal à la maison</div>" +
      "<div class='su-card'><b>Séances</b>" + (J.S.map(sesRow).join("") || "<div class='kf-sub'>Aucune séance.</div>") + "</div>" +
      "<div class='su-card'><b>Douleurs signalées pendant les exercices</b>" + (J.P.slice(0, 60).map(function (p) { return "<div class='kcb-srow'><b>" + dfr(String(p.date).slice(0, 10)) + "</b><span>" + esc((p.zone || "") + ", " + p.intensite + "/10" + (p.vive ? ", vive" : "")) + "<br><i>" + esc((p.exercice || "") + (p.action ? " · " + p.action : "")) + "</i></span></div>"; }).join("") || "<div class='kf-sub'>Aucune.</div>") + "</div>" +
      "<div class='su-card'><b>Ressenti du jour</b>" + (days.map(function (d) { var c = J.R[d] || {}, b = [c.pain != null ? "douleur " + c.pain + "/10" : "", c.mood != null ? "moral " + c.mood + "/5" : "", c.sleep != null ? "nuit " + ["bonne", "moyenne", "mauvaise"][c.sleep] : ""].filter(Boolean).join(" · "); return "<div class='kcb-srow'><b>" + dfr(d) + "</b><span>" + esc(b || "noté") + "</span></div>"; }).join("") || "<div class='kf-sub'>Aucun.</div>") + "</div>";
    show(html);
  }
  function same(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }
  function summary(b, P) {
    var out = [];
    [P.key.m].concat(P.mes).filter(function (m, i, a) { return a.indexOf(m) === i && KP.M[m] && KP.M[m].c; }).forEach(function (m) {
      if (out.length >= 3) return;
      var v = KP.val(b, m, "a"); if (v == null) return;
      var l = KP.M[m].s && KP.M[m].u !== "°" && !/^(fig8|dfl)$/.test(m) ? KP.lsi(b, m) : null;
      out.push(KP.M[m].c + " " + (l != null ? l + " %" : KP.fmt(v) + (KP.M[m].u === "°" ? "°" : " " + KP.M[m].u)));
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
    C.done = done; reView(); fbCab.save(C.id, { done: done }).catch(fail);
  }
  function etape(dir) {
    var P = KP.get(C.parcours), n = Math.max(0, Math.min(P.etapes.length - 1, (C.etape || 0) + dir));
    if (dir > 0 && !confirm("Débloquer l'étape " + (n + 1) + " : " + P.etapes[n].nom + " ? Le patient le verra sur son téléphone.")) return;
    var hist = (C.hist || []).concat([{ e: n, d: iso() }]);
    C.etape = n; C.hist = hist; sel = null;
    fbCab.save(C.id, { etape: n, hist: hist }).then(reView, fail);
  }
  function pick(n) { if (!sel) sel = (C.exos || []).slice(); var i = sel.indexOf(n); if (i >= 0) sel.splice(i, 1); else if (sel.length < 10) sel.push(n); else { say("10 exercices au maximum."); return; } var y = sheet().scrollTop; reView(); sheet().scrollTop = y; }
  var exEdit = false;
  /* ── Envoi programmé : « à partir du » ── */
  var WHEN = null;   // date d'envoi choisie (null : aujourd'hui)
  function plusJ(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function whenPick(fn) {
    var t = WHEN || iso(), o = [[iso(), "Aujourd'hui"], [plusJ(7), "Dans 1 semaine"], [plusJ(14), "Dans 2 semaines"]];
    return "<div class='kcb-when'><span class='kcb-lab'>Le patient la reçoit</span><div class='kf-chips'>" + o.map(function (x) { return "<button type='button' class='" + (t === x[0] ? "sel" : "") + "' onclick='KineCabinet.when(" + q(x[0]) + "," + q(fn) + ")'>" + x[1] + "</button>"; }).join("") +
      "<label class='kcb-whend'><input type='date' min='" + iso() + "' value='" + esc(o.some(function (x) { return x[0] === t; }) ? "" : t) + "' onchange='KineCabinet.when(this.value," + q(fn) + ")' aria-label='Autre date'></label></div></div>";
  }
  function whenSet(d, fn) { WHEN = d && d > iso() ? d : null; var y = sheet().scrollTop; if (fn === "quest") { if (qOpen()) qOv(); else reView(); } else reView(); sheet().scrollTop = y; }
  // Séance programmée dont la date est arrivée : elle devient la séance en cours
  function dueExos() {
    if (!C || !C.exosNext || !C.exosFrom || C.exosFrom > iso()) return;
    var d = { exos: C.exosNext, exosD: C.exosFrom, exosAt: C.exosAtN || Date.now(), exosNext: null, exosFrom: null };
    Object.keys(d).forEach(function (k) { C[k] = d[k]; }); fbCab.save(C.id, d).catch(function () {});
  }
  function sendExos() {
    var y = sheet().scrollTop, later = WHEN && WHEN > iso();
    var data = later ? { exosNext: sel.slice(), exosFrom: WHEN, exosAtN: Date.parse(WHEN + "T00:00:00") } : { exos: sel.slice(), exosD: iso(), exosAt: Date.now(), exosNext: null, exosFrom: null };
    fbCab.save(C.id, data).then(function () { Object.keys(data).forEach(function (k) { C[k] = data[k]; }); exEdit = false; sel = null; WHEN = null; reView(); sheet().scrollTop = y;
      say(later ? "Séance programmée : le patient la recevra le " + dfr(data.exosFrom) : "Séance envoyée au patient."); }, fail);
  }
  function exUnplan() { fbCab.save(C.id, { exosNext: null, exosFrom: null }).then(function () { C.exosNext = null; C.exosFrom = null; reView(); }, fail); }
  // Modifier la séance envoyée (cases déjà cochées) ou en préparer une nouvelle (cases vides)
  function exEditGo(keep) { exEdit = true; sel = keep ? (C.exos || []).slice() : []; var y = sheet().scrollTop; reView(); sheet().scrollTop = y; }
  function exCancel() { exEdit = false; sel = null; var y = sheet().scrollTop; reView(); sheet().scrollTop = y; }
  // Accusé de réception : le téléphone du patient a-t-il reçu sa fiche depuis l'envoi ?
  function recu(at) {
    if (!C.membres) return "<div class='kcb-recu no'>Téléphone pas encore relié : il la verra dès qu'il sera relié.</div>";
    if (at && C.vu && C.vu >= at) { var d = new Date(C.vu); return "<div class='kcb-recu ok'>" + ICON.ok + "Reçue sur son téléphone le " + dfr(iso(d)) + " à " + d.getHours() + "h" + ("0" + d.getMinutes()).slice(-2) + "</div>"; }
    return "<div class='kcb-recu'>Pas encore reçue : elle arrivera à sa prochaine ouverture de l'appli.</div>";
  }
  // La fiche « Comprendre ma rééducation » telle que la voit le patient
  function ficheP() {
    var el = ov("kcb-fip"); el.setAttribute("aria-label", "Fiche du patient"); el.onclick = function (e) { if (e.target === el) el.classList.remove("open"); };
    var cs = $("kcb-conseil") ? $("kcb-conseil").value.trim() : C.conseil;
    el.innerHTML = "<div class='kcb-incl-card kcb-qcard'><div class='kcb-mh'><span>" + esc((KineFiches.get(C.parcours) || {}).t || "Comprendre ma rééducation") + "</span><button class='kf-back' onclick='document.getElementById(\"kcb-fip\").classList.remove(\"open\")' aria-label='Fermer'>×</button></div>" + KineFiches.html(C.parcours, cs) + "</div>";
    el.classList.add("open");
  }
  function saveMsg() {
    var t = ($("kcb-msg").value || "").trim().slice(0, 160), nx = $("kcb-next").value || "";
    var cs = $("kcb-conseil") ? ($("kcb-conseil").value || "").trim().slice(0, 800) : (C.conseil || "");
    var data = { next: nx, msg: t ? { t: t, d: iso() } : null, conseil: cs || null };
    C.next = nx; C.msg = data.msg; C.conseil = data.conseil; fbCab.save(C.id, data).then(function () { say("Enregistré : le patient le verra."); }, fail);
  }

  /* ════════ Bilan ════════ */
  function nrm(t) { return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  var FAM = ["Douleur", "Amplitude", "Périmètre", "Force", "Fonction", "Questionnaire"];
  function bilan(id) {
    var P = KP.get(C.parcours);
    bilanEdit = id ? (C.bilans || []).filter(function (b) { return b.id === id; })[0] : null;
    PHOTOS = [];
    var prev = (C.bilans || []).filter(function (b) { return !bilanEdit || b.id !== bilanEdit.id; })[0] || null;
    var cur = bilanEdit || { d: iso(), m: {} }, fromQ = [];
    if (!bilanEdit && window.KineQuest) KineQuest.asBilans(C.quest).sort(function (a, b) { return a.d < b.d ? -1 : 1; }).forEach(function (x) {
      if (prev && x.d < prev.d) return;
      Object.keys(x.m).forEach(function (k) { if (KP.M[k]) { cur.m[k] = x.m[k]; if (fromQ.indexOf(k) < 0) fromQ.push(k); } });
    });
    // Mesures utiles maintenant : celles des objectifs de l'étape en cours et de la suivante, et la mesure clé du parcours
    var E = C.etape || 0, need = [P.key.m];
    P.etapes.slice(E, E + 2).forEach(function (e) { e.obj.forEach(function (o) { if (o.a && o.a.m) need.push(o.a.m); if (o.a && o.a.hops) need.push("hop1", "hop3", "hop6"); }); });
    need = need.filter(function (m, i, a) { return KP.M[m] && a.indexOf(m) === i && P.mes.indexOf(m) >= 0; });
    var needNow = need.filter(function (m) { return P.etapes[Math.min(E, P.etapes.length - 1)].obj.some(function (o) { return o.a && o.a.m === m && !objState(o).done; }); });
    var others = Object.keys(KP.M).filter(function (m) { return P.mes.indexOf(m) < 0; });
    var side = C.cote === "G" ? "gauche" : C.cote === "D" ? "droit" : "";
    BNEED = needNow; BFROMQ = fromQ;
    var fams = FAM.filter(function (f) { return P.mes.some(function (m) { return KP.M[m].g === f; }); }).concat(Object.keys(P.mes.reduce(function (o, m) { if (FAM.indexOf(KP.M[m].g) < 0) o[KP.M[m].g] = 1; return o; }, {})));
    var first = bilanEdit ? "tout" : need.length ? "need" : "tout";
    var chip = function (k, t, n) { return "<button type='button' data-k='" + esc(k) + "' class='" + (k === first ? "on" : "") + "' onclick='KineCabinet.bF(this)'>" + esc(t) + (n ? " <i>" + n + "</i>" : "") + "</button>"; };
    var qL = window.KineQuest && !bilanEdit ? KineQuest.conseils(C, P) : [], qc = qL.filter(function (x) { return x.conseil; }).length, qp = qL.filter(function (x) { return x.pend; }).length;
    var html = top("KineCabinet.fiche(" + q(C.id) + ")", C.alias) +
      "<div><div class='kf-h1 kcb-h1'>" + (bilanEdit ? "Bilan du " + dfr(cur.d) : "Nouveau bilan") + "</div><div class='kf-sub'>" + (side ? "Côté atteint : <b>" + side + "</b>. " : "") + (prev ? "En gris : le bilan du " + dfr(prev.d) + "." : "Premier bilan.") + "</div></div>" +
      "<label class='kcb-field kcb-bdate'><span class='kcb-lab'>Date</span><input class='kcb-in' type='date' id='kcb-bd' value='" + esc(cur.d) + "'></label>" +
      (fromQ.length ? "<div class='kcb-ok'>" + ICON.ok + "Déjà rempli par le patient : " + esc(fromQ.map(function (k) { return KP.M[k].c || KP.M[k].l; }).join(", ")) + ".</div>" : "") +
      (qL.length ? "<button class='kcb-qline' onclick='KineCabinet.qOv()'><span><b>Questionnaires et tests à envoyer</b><em>" + (qp ? qp + " en attente" + (qc ? ", " : "") : "") + (qc ? qc + " conseillé" + (qc > 1 ? "s" : "") : qp ? "" : "le patient répond sur son téléphone") + "</em></span>" + (qc ? "<u class='kf-hop'>Conseillé</u>" : "<i>›</i>") + "</button>" : "") +
      "<div class='kcb-fam' role='tablist' aria-label='Familles de mesures'>" + (need.length ? chip("need", "À mesurer", need.length) : "") + chip("tout", "Tout") + fams.map(function (f) { return chip(f, f); }).join("") + chip("autres", "Autres") + "</div>" +
      "<input class='kcb-in kcb-msearch' id='kcb-ms' type='search' placeholder='Chercher une mesure (ex. : force, Lachman, saut)' oninput='KineCabinet.bS(this.value)' aria-label='Chercher une mesure'>" +
      "<div id='kcb-mlist'>";
    P.mes.concat(others).forEach(function (m) {
      var d = KP.M[m], inP = P.mes.indexOf(m) >= 0;
      html += "<div class='kcb-mw' data-f='" + esc(inP ? d.g : "autres") + "' data-need='" + (need.indexOf(m) >= 0 ? 1 : 0) + "' data-p='" + (inP ? 1 : 0) + "' data-has='" + (cur.m[m] ? 1 : 0) + "' data-t='" + esc(nrm(d.l + " " + (d.c || "") + " " + d.g + " " + (d.how || ""))) + "'>" +
        "<span class='kcb-mfam'>" + esc(d.g) + "</span>" + mrow(m, cur, prev) + "</div>";
    });
    html += "</div><div class='su-card kcb-phcard'><div class='su-card-h'><b>Photos du bilan</b><span>gardées dans la fiche</span></div><div id='kcb-phb'></div><div id='kcb-php'></div>" +
      "<button class='seq-btn-secondary' onclick='KineCabinet.phAdd()'>Ajouter une photo (cicatrice, œdème, posture…)</button><p class='kcb-hint'>Les angles mesurés sur photo y sont ajoutés tout seuls, avec les repères dessinés. Le patient ne les voit pas.</p></div>";
    show(html, "<button class='seq-btn-main' onclick='KineCabinet.bCheck()'>Vérifier et enregistrer</button>" + (bilanEdit ? "<button class='seq-btn-secondary kcb-danger' onclick='KineCabinet.delBilan()'>Supprimer ce bilan</button>" : ""));
    bFilter(first, "");
    live();
    if (bilanEdit) photosGallery($("kcb-phb"), bilanEdit.id);
  }
  // Raccourcis par famille et recherche : on cache les mesures sans les retirer (les valeurs saisies restent)
  var BF = "tout";
  function bFilter(k, t) {
    BF = k; t = nrm(t || "").trim();
    var n = 0;
    [].forEach.call(sheet().querySelectorAll(".kcb-mw"), function (el) {
      var ok = t ? el.getAttribute("data-t").indexOf(t) >= 0
        : k === "need" ? el.getAttribute("data-need") === "1" : k === "tout" ? el.getAttribute("data-p") === "1" || el.getAttribute("data-has") === "1" : k === "autres" ? el.getAttribute("data-f") === "autres" : el.getAttribute("data-f") === k && el.getAttribute("data-p") === "1";
      el.style.display = ok ? "" : "none"; if (ok) n++;
      var fam = el.querySelector(".kcb-mfam"); if (fam) fam.style.display = k === "need" || k === "tout" || t ? "" : "none";
    });
    [].forEach.call(sheet().querySelectorAll(".kcb-fam button"), function (b) { b.classList.toggle("on", !t && b.getAttribute("data-k") === k); });
    var L0 = $("kcb-mlist"); if (L0) L0.setAttribute("data-empty", n ? "" : "Aucune mesure ici.");
  }
  function bF(b) { var s = $("kcb-ms"); if (s) s.value = ""; bFilter(b.getAttribute("data-k"), ""); var l = $("kcb-mlist"); if (l) sheet().scrollTo({ top: Math.max(0, l.offsetTop - 120), behavior: "smooth" }); }
  function bS(t) { bFilter(BF, t); }
  // Avant d'enregistrer : ce qui a été saisi, les symétries, et les objectifs atteints grâce à ce bilan
  function bCheck() {
    var m = collect(), P = KP.get(C.parcours), keys = Object.keys(m);
    if (!keys.length && !PHOTOS.length) { say("Aucune mesure saisie."); return; }
    var nb = { d: $("kcb-bd").value || iso(), m: m }, before = ctx(), after = { bilans: [nb].concat(allB()), seances: C.seances || [], date0: C.date0 };
    var E = Math.min(C.etape || 0, P.etapes.length - 1), gained = P.etapes[E].obj.filter(function (o) {
      if (!o.a || (C.done && C.done[o.id])) return false; var a0 = KP.evalObj(o.a, before), a1 = KP.evalObj(o.a, after); return a1 && a1.ok === true && !(a0 && a0.ok === true); });
    var rows = keys.map(function (k) {
      var d = KP.M[k], b = { m: {} }; b.m[k] = m[k];
      var a = d.ch ? d.ch[m[k].a] : KP.fmt(KP.val(b, k, "a")) + (d.u ? " " + d.u : ""), s = d.s && m[k].s != null ? KP.fmt(KP.val(b, k, "s")) + (d.u ? " " + d.u : "") : null, l = d.s ? KP.lsi(b, k) : null;
      return "<div class='kcb-sumr'><span>" + esc(d.c || d.l) + "</span><b>" + esc(a) + (s ? " <i>/ " + esc(s) + "</i>" : "") + "</b>" + (l != null && k !== "ext" ? "<em>" + l + " %</em>" : "") + "</div>";
    }).join("");
    var el = ov("kcb-bsum"); el.setAttribute("aria-label", "Vérifier le bilan");
    el.innerHTML = "<div class='kcb-incl-card'><div class='kcb-mh'><span>Bilan du " + esc(dfr(nb.d)) + "</span><button class='kf-back' onclick='document.getElementById(\"kcb-bsum\").classList.remove(\"open\")' aria-label='Fermer'>×</button></div>" +
      "<div class='kcb-sum'>" + (rows || "<p class='kf-sub'>Photos seulement.</p>") + "</div>" + (PHOTOS.length ? "<p class='kf-sub'>" + PHOTOS.length + " photo" + (PHOTOS.length > 1 ? "s" : "") + " avec ce bilan.</p>" : "") +
      (gained.length ? "<div class='kcb-ok'>" + ICON.ok + "<span>Objectif" + (gained.length > 1 ? "s" : "") + " atteint" + (gained.length > 1 ? "s" : "") + " avec ce bilan : " + esc(gained.map(function (o) { return o.t; }).join(" ; ")) + "</span></div>" : "") +
      "<button class='seq-btn-main' onclick='document.getElementById(\"kcb-bsum\").classList.remove(\"open\");KineCabinet.saveBilan()'>Enregistrer le bilan</button><button class='seq-btn-secondary' onclick='document.getElementById(\"kcb-bsum\").classList.remove(\"open\")'>Corriger</button></div>";
    el.classList.add("open");
  }
  // Questionnaires depuis le bilan : dans une fenêtre, pour ne pas perdre les mesures en cours de saisie
  function qOv() {
    var P = KP.get(C.parcours), el = ov("kcb-qov"); el.setAttribute("aria-label", "Questionnaires et tests");
    el.onclick = function (e) { if (e.target === el) el.classList.remove("open"); };
    el.innerHTML = "<div class='kcb-incl-card kcb-qcard'><div class='kcb-mh'><span>Questionnaires et tests</span><button class='kf-back' onclick='document.getElementById(\"kcb-qov\").classList.remove(\"open\")' aria-label='Fermer'>×</button></div>" + whenPick("quest") + KineQuest.card(C, P, "bilan") + "</div>";
    el.classList.add("open");
  }
  function mrow(m, cur, prev) {
    var d = KP.M[m], r = cur.m[m] || {}, pr = prev && prev.m[m] || {};
    var inp = function (sd, i) {
      var v = Array.isArray(r[sd]) ? r[sd][i] : (i === 0 ? r[sd] : null), pv = Array.isArray(pr[sd]) ? KP.best(m, pr[sd]) : pr[sd];
      return "<input class='kcb-num' inputmode='decimal' data-m='" + m + "' data-s='" + sd + "' data-i='" + i + "' value='" + esc(v == null ? "" : String(v).replace(".", ",")) + "' placeholder='" + esc(i === 0 && pv != null ? KP.fmt(pv) : "") + "' oninput='KineCabinet.live()' aria-label='" + esc(d.l + (sd === "a" ? ", côté atteint" : ", côté sain") + (d.n ? ", essai " + (i + 1) : "")) + "'>";
    };
    var tag = BFROMQ.indexOf(m) >= 0 ? "<u class='kcb-tagq'>rempli par le patient</u>" : BNEED.indexOf(m) >= 0 && !(cur.m && cur.m[m]) ? "<u class='kcb-tag kf-hop'>objectif de l'étape</u>" : "";
    var head = "<div class='kcb-mh'><span>" + esc(d.l) + (d.u ? " <i>" + esc(d.u) + "</i>" : "") + tag + "</span><em id='kcb-l-" + m + "'></em></div>";
    var how = "<details class='kcb-how'><summary>Protocole</summary>" + esc(d.how) + "</details>";
    if (d.ch) {
      return "<div class='kcb-m'>" + head + "<div class='kf-chips kcb-ch'>" + d.ch.map(function (c, i) { return "<button type='button' data-m='" + m + "' data-s='a' data-ch='" + i + "' class='" + (r.a === i ? "sel" : "") + "' onclick='KineCabinet.ch(this)'>" + esc(c) + "</button>"; }).join("") + "</div>" + how + "</div>";
    }
    var n = d.n || 1, cols = function (sd) { var o = ""; for (var i = 0; i < n; i++) o += inp(sd, i); return o; };
    var ph = d.incl || (d.saut && window.KineSaut);
    var incl = function (sd) { return ph ? "<button type='button' class='kcb-incl' onclick='KineCabinet." + (d.saut ? "saut" : "incl") + "(" + q(m) + "," + q(sd) + ")' aria-label='" + (d.saut ? "Mesurer le saut avec le téléphone" : "Mesurer avec le téléphone") + "'>" + ICON.phone + "</button>" : ""; };
    if (!d.s) return "<div class='kcb-m'>" + head + "<div class='kcb-grid' style='grid-template-columns:repeat(" + n + ",minmax(0,1fr))" + (ph ? " 44px" : "") + "'>" + cols("a") + incl("a") + "</div>" + how + "</div>";
    return "<div class='kcb-m'>" + head +
      "<div class='kcb-sides'><span>Atteint</span><div class='kcb-grid' style='grid-template-columns:repeat(" + n + ",minmax(0,1fr))" + (ph ? " 44px" : "") + "'>" + cols("a") + incl("a") + "</div>" +
      "<span>Sain</span><div class='kcb-grid' style='grid-template-columns:repeat(" + n + ",minmax(0,1fr))" + (ph ? " 44px" : "") + "'>" + cols("s") + incl("s") + "</div></div>" + how + "</div>";
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
    if (!Object.keys(m).length && !PHOTOS.length) { say("Aucune mesure saisie."); return; }
    var d = $("kcb-bd").value || iso();
    loading("Enregistrement du bilan…");
    var ph = PHOTOS.slice(), data = { d: d, m: m };
    if (ph.length || (bilanEdit && bilanEdit.ph)) data.ph = (bilanEdit && bilanEdit.ph || 0) + ph.length;
    fbCab.bilan(C.id, bilanEdit ? bilanEdit.id : null, data).then(function (bid) {
      return Promise.all(ph.map(function (x) { return fbCab.photo(C.id, { b: bid, d: d, m: x.m || null, sd: x.sd || null, v: x.v != null ? x.v : null, cap: x.cap || null, img: x.img }); }));
    }).then(function () { PHOTOS = []; PHC = { pid: null, list: null }; return fbCab.get(C.id); }).then(function (p) { C = p; sel = null; bilans(); }, fail);
  }
  var BNEED = [], BFROMQ = [];
  /* ════════ Questionnaires ════════ */
  function qSend(id) {
    var P = KP.get(C.parcours), inBilan = !!sheet().querySelector("#kcb-bd");
    var des = WHEN && WHEN > iso() ? WHEN : null; WHEN = null;
    fbCab.questSend(C.id, { q: id, env: iso(), des: des, cote: C.cote || "D", zone: P.zone === "rachis" && /cervic|nevralgie/.test(C.parcours) ? "cou" : P.zone }).then(function () {
      say(des ? "Programmé : le patient le recevra le " + dfr(des) : C.membres ? "Envoyé : il le verra dans son suivi." : "Envoyé : il le verra dès que son téléphone sera relié.");
      return fbCab.get(C.id).then(function (p) { C = p; if (qOpen()) qOv(); else if (inBilan) bilan(); else reView(); });
    }, fail);
  }
  function qCancel(docId) {
    if (!confirm("Annuler ce questionnaire ? Le patient ne le verra plus.")) return;
    var inBilan = !!sheet().querySelector("#kcb-bd");
    fbCab.questDel(C.id, docId).then(function () { return fbCab.get(C.id).then(function (p) { C = p; if (qOpen()) qOv(); else if (inBilan) bilan(); else reView(); }); }, fail);
  }
  function qOpen() { var e = $("kcb-qov"); return !!(e && e.classList.contains("open"));
  }
  function qView(docId) {
    var x = (C.quest || []).filter(function (y) { return y.id === docId; })[0]; if (!x) return;
    var P = KP.get(C.parcours);
    show(top("KineCabinet.fiche(" + q(C.id) + ")", C.alias) + "<div><div class='kf-h1 kcb-h1'>" + esc(KineQuest.Q[x.q] ? KineQuest.Q[x.q].nom : x.q) + "</div><div class='kf-sub'>Réponses du patient, telles qu'il les a données.</div></div>" + KineQuest.detail(x, P.zone),
      "<button class='seq-btn-main' onclick='KineCabinet.qSend(" + q(x.q) + ")'>Le renvoyer</button>");
  }
  function delBilan() { if (!confirm("Supprimer ce bilan ?")) return; fbCab.bilanDel(C.id, bilanEdit.id).then(function () { fiche(C.id); }, fail); }

  /* ════════ Séance au cabinet ════════ */
  var S = null;
  /* ════════ Séance au cabinet : plusieurs exercices, chacun noté en un appui, et la séance évaluée dans son ensemble ════════
     La séance suivante reprend la précédente, avec la progression proposée (trop facile : on charge ; trop dur : on allège). */
  var RATE = [["facile", "Trop facile"], ["ok", "Bien"], ["dur", "Trop dur"], ["dou", "Douloureux"]];
  function sList(x) { return x && x.list && x.list.length ? x.list : x && x.ex ? [{ ex: x.ex, kg: x.kg, reps: x.reps, series: x.series }] : []; }
  function kgStep(kg) { return kg >= 20 ? 2.5 : kg >= 10 ? 1 : 0.5; }
  function seance() {
    var last = (C.seances || [])[0];
    S = { list: sList(last).map(function (e) {
      var o = { ex: e.ex, kg: e.kg || 0, reps: e.reps || 10, series: e.series || 3, r: null, prev: e };
      if (e.r === "facile") { if (o.kg > 0) { o.kg = Math.round((o.kg + kgStep(o.kg)) * 10) / 10; o.sug = "+" + KP.fmt(kgStep(e.kg)) + " kg : trop facile la dernière fois"; } else { o.reps += 2; o.sug = "+2 répétitions : trop facile la dernière fois"; } }
      else if (e.r === "dur" || e.r === "dou") o.sug = (e.r === "dou" ? "Douloureux" : "Trop dur") + " la dernière fois : garder ou alléger";
      return o; }), dou: null, rpe: null, home: false, all: false };
    seanceView();
  }
  // Vignette de Yass : calculée une fois ; si la 3D n'est pas encore prête, elle est ajoutée dès qu'elle l'est
  var SNAP = {};
  function snap(n) { if (SNAP[n]) return SNAP[n]; try { var e = window.KineBiblio && KineBiblio.find(n), u = e && e.thumb || (window.KineAvatar && KineAvatar.supports(n) ? KineAvatar.snapshot(n, 160) : null); if (u) SNAP[n] = u; return u; } catch (er) { return null; } }
  function imgOf(n) { var u = snap(n); return "<img data-n='" + esc(n) + "' alt=''" + (u ? " src='" + u + "'" : "") + ">"; }
  function snapLater(tries) {
    var miss = [].filter.call(sheet().querySelectorAll(".kss-im img[data-n]"), function (im) { return !im.getAttribute("src"); }); if (!miss.length || tries > 20) return;
    setTimeout(function () { miss.forEach(function (im) { var u = snap(im.getAttribute("data-n")); if (u) im.src = u; }); snapLater(tries + 1); }, 500);
  }
  function seanceView() {
    var P = KP.get(C.parcours), E = Math.min(C.etape || 0, P.etapes.length - 1), inL = S.list.map(function (e) { return e.ex; });
    var reco = [C.ref || P.ref].concat(KP.exos(C.parcours, E, C.opts)).filter(function (n, i, a) { return a.indexOf(n) === i && inL.indexOf(n) < 0; });
    var stp = function (i, k, lab) { var v = S.list[i][k]; return "<div class='kss-st'><span>" + lab + "</span><div><button onclick='KineCabinet.sl(" + i + "," + q(k) + ",-1)' aria-label='Moins'>−</button><b>" + KP.fmt(v) + "</b><button onclick='KineCabinet.sl(" + i + "," + q(k) + ",1)' aria-label='Plus'>+</button></div></div>"; };
    var html = top("KineCabinet.fiche(" + q(C.id) + ")", C.alias) + "<div><div class='kf-h1 kcb-h1'>Séance du jour</div><div class='kf-sub'>Étape " + (E + 1) + " : " + esc(P.etapes[E].nom) + "</div></div>";
    // les exercices de la séance
    html += "<div class='kcb-v2h'>Exercices de la séance" + (S.list.length ? " · " + S.list.length : "") + "</div>";
    if (!S.list.length) html += "<div class='kf-note'>Ajoute les exercices de la séance ci-dessous : touche l'image pour voir Yass le faire, « + » pour l'ajouter.</div>";
    html += S.list.map(function (e, i) {
      var pv = e.prev;
      return "<div class='kss-ex'><div class='kss-h'><button class='kss-im' onclick='KineBiblio.demo(" + q(e.ex) + ")' aria-label='Voir Yass faire l&#39;exercice'>" + imgOf(e.ex) + "<i>" + ICON.play + "</i></button>" +
        "<div class='kss-t'><b>" + esc(e.ex) + "</b>" + (pv ? "<span>Dernière fois : " + (pv.series || "") + " × " + (pv.reps || "") + (pv.kg ? " à " + KP.fmt(pv.kg) + " kg" : "") + (pv.r ? ", " + esc((RATE.filter(function (r) { return r[0] === pv.r; })[0] || ["", ""])[1].toLowerCase()) : "") + "</span>" : "") +
        (e.sug ? "<em>" + esc(e.sug) + "</em>" : "") + "</div><button class='kss-x' onclick='KineCabinet.srm(" + i + ")' aria-label='Retirer'>×</button></div>" +
        "<div class='kss-sts'>" + stp(i, "series", "Séries") + stp(i, "reps", "Répét.") + stp(i, "kg", "Charge kg") + "</div>" +
        "<div class='kss-r' role='group' aria-label='Comment ça s&#39;est passé'>" + RATE.map(function (r) { return "<button class='" + r[0] + (e.r === r[0] ? " on" : "") + "' aria-pressed='" + (e.r === r[0]) + "' onclick='KineCabinet.sr(" + i + "," + q(r[0]) + ")'>" + r[1] + "</button>"; }).join("") + "</div></div>";
    }).join("");
    // ajouter : les exercices recommandés pour l'étape, avec Yass
    var shown = S.all ? reco : reco.slice(0, 6);
    html += "<div class='su-card'><div class='su-card-h'><b>Recommandés pour l'étape " + (E + 1) + "</b><span>touche l'image : Yass le fait</span></div><div class='kss-reco'>" +
      shown.map(function (n) { return "<div class='kss-rc'><button class='kss-im' onclick='KineBiblio.demo(" + q(n) + ")' aria-label='Voir Yass faire " + esc(n) + "'>" + imgOf(n) + "<i>" + ICON.play + "</i></button><span>" + esc(n) + "</span><button class='kss-add' onclick='KineCabinet.sadd(" + q(n) + ")' aria-label='Ajouter " + esc(n) + "'>+</button></div>"; }).join("") + "</div>" +
      (reco.length > 6 ? "<button class='kcb-link' onclick='KineCabinet.sall()'>" + (S.all ? "Moins d'exercices" : "Voir les " + reco.length + " exercices de l'étape") + "</button>" : "") +
      "<input class='kcb-in' list='kcb-allex' placeholder='Chercher un autre exercice…' onchange='KineCabinet.sadd(this.value);this.value=\"\"'>" + datalist() + "</div>";
    // la séance dans son ensemble
    var pain = function (k, v0) { return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return "<button class='" + (S[k] === v ? "sel" : "") + "' onclick='KineCabinet.sd(" + q(k) + "," + v + ")'>" + v + "</button>"; }).join(""); };
    html += "<div class='su-card'><b>La séance dans son ensemble</b><span class='kcb-lab'>Douleur pendant la séance (0 à 10)</span><div class='kcb-pain'>" + pain("dou") + "</div>" +
      "<span class='kcb-lab'>Effort ressenti (0 : repos, 10 : maximal)</span><div class='kcb-pain kss-rpe'>" + pain("rpe") + "</div>" +
      "<label class='kcb-field'><span class='kcb-lab'>Note pour toi (le patient ne la voit pas)</span><input class='kcb-in' id='kcb-snote' maxlength='200' value='" + esc(S.note || "") + "' oninput='KineCabinet.snote(this.value)'></label>" +
      (S.list.length ? "<label class='krl-ok'><input type='checkbox'" + (S.home ? " checked" : "") + " onchange='KineCabinet.shome(this.checked)'><span>Donner aussi ces exercices au patient, pour la maison</span></label>" : "") + "</div>";
    // séances précédentes
    var ref = C.ref || P.ref, SS = (C.seances || []).map(function (x) { var e = sList(x).filter(function (y) { return y.ex === ref && y.kg != null; })[0]; return e ? { d: x.d, kg: e.kg } : null; }).filter(Boolean).reverse();
    if ((C.seances || []).length) html += "<div class='su-card'><div class='su-card-h'><b>Séances précédentes</b><span>" + C.seances.length + "</span></div>" + (SS.length > 1 ? "<div class='kf-sub'>Charge sur " + esc(ref) + "</div>" + bars2(SS) : "") +
      C.seances.slice(0, 8).map(function (x) { var n = (C.notes || []).filter(function (k) { return k.id === x.id; })[0];
        return "<div class='kcb-srow'><b>" + dfr(x.d) + "</b><span>" + sList(x).map(function (e) { return esc(e.ex) + " " + (e.series || "") + "×" + (e.reps || "") + (e.kg ? " " + KP.fmt(e.kg) + " kg" : "") + (e.r && e.r !== "ok" ? " (" + esc((RATE.filter(function (r) { return r[0] === e.r; })[0] || ["", ""])[1].toLowerCase()) + ")" : ""); }).join("<br>") +
          "<br><i>Douleur " + (x.dou != null ? x.dou + "/10" : "–") + (x.rpe != null ? ", effort " + x.rpe + "/10" : "") + (n ? " · " + esc(n.t) : "") + "</i></span></div>"; }).join("") + "</div>";
    var y = sheet().classList.contains("open") && sheet().querySelector(".kss-reco") ? sheet().scrollTop : 0;
    show(html, "<button class='seq-btn-main' onclick='KineCabinet.saveSeance()'" + (S.list.length ? "" : " disabled") + ">Valider la séance" + (S.list.length ? " (" + S.list.length + " exercice" + (S.list.length > 1 ? "s" : "") + ")" : "") + "</button>");
    sheet().scrollTop = y; snapLater(0);
  }
  function sl(i, k, d) { var e = S.list[i], st0 = k === "kg" ? kgStep(e.kg + (d < 0 ? -0.01 : 0)) : 1; e[k] = Math.max(k === "kg" ? 0 : 1, Math.round((e[k] + d * st0) * 10) / 10); e.sug = null; seanceView(); }
  function sr(i, r) { S.list[i].r = S.list[i].r === r ? null : r; seanceView(); }
  function srm(i) { S.list.splice(i, 1); seanceView(); }
  function sadd(n) {
    n = String(n || "").trim(); if (!n || S.list.some(function (e) { return e.ex === n; })) return;
    var last = null; (C.seances || []).some(function (x) { last = sList(x).filter(function (e) { return e.ex === n; })[0] || null; return !!last; });
    S.list.push({ ex: n, kg: last && last.kg || 0, reps: last && last.reps || 10, series: last && last.series || 3, r: null, prev: last });
    seanceView();
  }
  function sd(k, v) { S[k] = S[k] === v ? null : v; seanceView(); }
  function saveSeance() {
    if (!S.list.length) { say("Ajoute au moins un exercice."); return; }
    if (S.dou == null) { say("Indique la douleur pendant la séance."); return; }
    var P = KP.get(C.parcours), ref = C.ref || P.ref, list = S.list.map(function (e) { var o = { ex: e.ex, kg: e.kg, reps: e.reps, series: e.series }; if (e.r) o.r = e.r; return o; });
    var main = list.filter(function (e) { return e.ex === ref; })[0] || list[0];
    // ex, kg, reps, series : l'exercice de référence (ou le premier), pour la courbe de charge et les anciennes versions
    var data = { d: iso(), ex: main.ex, kg: main.kg, reps: main.reps, series: main.series, dou: S.dou, list: list }, note = (S.note || "").trim().slice(0, 200);
    if (S.rpe != null) data.rpe = S.rpe;
    loading("Enregistrement…");
    fbCab.seance(C.id, data).then(function (id) { return note ? fbCab.note(C.id, id, { d: data.d, t: note }) : null; })
      .then(function () { if (!S.home) return; var ex = list.map(function (e) { return e.ex; }).slice(0, 10), d2 = { exos: ex, exosD: iso(), exosAt: Date.now() }; return fbCab.save(C.id, d2).then(function () { C.exos = ex; C.exosD = d2.exosD; C.exosAt = d2.exosAt; }); })
      .then(function () { say(S.home ? "Séance enregistrée, et envoyée au patient pour la maison." : "Séance enregistrée."); fiche(C.id); }, fail);
  }

  /* ════════ Inclinomètre : le téléphone mesure l'angle du genou ════════
     Téléphone à plat sur la cuisse puis sur le tibia, le haut du téléphone toujours vers le pied :
     flexion = inclinaison de la cuisse − inclinaison du tibia. */
  var I = null;
  function ov(id) { var el = $(id); if (!el) { el = document.createElement("div"); el.id = id; el.className = "kcb-incl-ov"; el.setAttribute("role", "dialog"); document.body.appendChild(el); } return el; }
  // Deux façons de mesurer : téléphone posé sur la jambe, ou photo de profil avec 3 points
  function incl(m, sd) {
    if (KP.M[m].incl >= 2) { inclPhone(m, sd); return; }
    var el = ov("kcb-incl"); el.setAttribute("aria-label", "Mesurer l'angle");
    el.innerHTML = "<div class='kcb-incl-card'><div class='kcb-mh'><span>" + esc(KP.M[m].l) + ", côté " + (sd === "a" ? "atteint" : "sain") + "</span><button class='kf-back' onclick='KineCabinet.inclClose()' aria-label='Fermer'>×</button></div>" +
      "<button class='krl-row' onclick='KineCabinet.photo(" + q(m) + "," + q(sd) + ")'><span class='krl-ic soft'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 8h3l2-3h6l2 3h3v11H4z'/><circle cx='12' cy='13' r='3.5'/></svg></span><span class='krl-t'><b>Sur une photo</b><span>De profil, 3 points à ajuster du doigt</span></span></button>" +
      "<button class='krl-row' onclick='KineCabinet.inclPhone(" + q(m) + "," + q(sd) + ")'><span class='krl-ic soft'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><rect x='7' y='2' width='10' height='20' rx='2.5'/><path d='M11 18h2'/></svg></span><span class='krl-t'><b>Téléphone posé sur la jambe</b><span>Sur la cuisse, puis sur le tibia</span></span></button></div>";
    el.classList.add("open");
  }
  function inclPhone(m, sd) {
    I = { m: m, sd: sd, step: 0, buf: [], thigh: null, res: null, got: false };
    var el = $("kcb-incl"); if (!el) { el = document.createElement("div"); el.id = "kcb-incl"; el.className = "kcb-incl-ov"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Mesure avec le téléphone"); document.body.appendChild(el); }
    var mot = KP.M[m].incl === 3, EV = mot ? window.DeviceMotionEvent : window.DeviceOrientationEvent;
    var start = function () { window.addEventListener(mot ? "devicemotion" : "deviceorientation", mot ? onMot : onOri); setTimeout(function () { if (I && !I.got) { I.err = 1; inclView(); } }, 1800); inclView(); };
    if (EV && typeof EV.requestPermission === "function") {
      EV.requestPermission().then(function (r) { if (r === "granted") start(); else { I.err = 2; inclView(); } }, function () { I.err = 2; inclView(); });
    } else start();
    el.classList.add("open");
  }
  function onOri(e) { if (!I || e.beta == null) return; I.got = true; I.buf.push(e.beta); if (I.buf.length > 15) I.buf.shift(); var c = $("kcb-ang"); if (c) c.textContent = Math.round(med()) + "°"; var s = $("kcb-stab"); if (s) s.className = spread() < 1.5 ? "ok" : ""; }
  // Téléphone dans la longueur du bras : angle entre son grand axe et la verticale (pesanteur), quel que soit le côté de l'écran
  function onMot(e) {
    var a = e && e.accelerationIncludingGravity; if (!I || !a || a.y == null) return;
    var g = Math.sqrt((a.x || 0) * (a.x || 0) + a.y * a.y + (a.z || 0) * (a.z || 0)); if (g < 5) return;
    var c = Math.max(-1, Math.min(1, (KP.M[I.m].iref === "up" ? a.y : -a.y) / g));
    I.got = true; I.buf.push(Math.acos(c) * 180 / Math.PI - (KP.M[I.m].iref === "h" ? 90 : 0));   // « h » : angle avec l'horizontale (hanche, jambe tendue) if (I.buf.length > 15) I.buf.shift();
    var el = $("kcb-ang"); if (el) el.textContent = Math.round(med()) + "°"; var st = $("kcb-stab"); if (st) st.className = spread() < 2 ? "ok" : "";
  }
  function med() { var a = I.buf.slice().sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor(a.length / 2)] : 0; }
  function spread() { if (I.buf.length < 8) return 99; return Math.max.apply(null, I.buf) - Math.min.apply(null, I.buf); }
  function inclView() {
    var el = $("kcb-incl"); if (!el || !I) return;
    var isExt = I.m === "ext";
    var body;
    if (I.err) body = "<p>" + (I.err === 2 ? "L'accès aux capteurs a été refusé. Tu peux l'autoriser dans les réglages du navigateur, ou saisir la valeur mesurée au goniomètre." : "Le capteur d'inclinaison ne répond pas sur cet appareil. Saisis la valeur mesurée au goniomètre.") + "</p><button class='seq-btn-main' onclick='KineCabinet.inclClose()'>Fermer</button>";
    else if (I.res != null) body = "<div class='kcb-ang big'>" + KP.fmt(I.res) + "°</div><p>" + (isExt ? (I.res < 0 ? "Déficit d'extension de " + KP.fmt(-I.res) + "°." : I.res > 0 ? "Hyperextension de " + KP.fmt(I.res) + "°." : "Extension complète.") : KP.M[I.m].incl === 2 ? "Inclinaison du tibia : flexion dorsale en charge." : KP.M[I.m].incl === 3 ? esc(KP.M[I.m].l) + "." : "Flexion du genou.") + "</p>" +
      "<button class='seq-btn-main' onclick='KineCabinet.inclUse()'>Utiliser cette valeur</button><button class='seq-btn-secondary' onclick='KineCabinet.inclPhone(" + q(I.m) + "," + q(I.sd) + ")'>Recommencer</button>";
    else if (KP.M[I.m].incl === 3) body = "<div class='kcb-ang' id='kcb-ang'>–</div><div id='kcb-stab'>Garde le téléphone immobile en fin de mouvement</div>" +
      "<ol class='kcb-isteps'><li class='now'>" + KP.M[I.m].ph + "</li></ol>" +
      "<button class='seq-btn-main' onclick='KineCabinet.inclTake()'>Enregistrer l'angle</button>";
    else if (KP.M[I.m].incl === 2) body = "<div class='kcb-ang' id='kcb-ang'>–</div><div id='kcb-stab'>Garde le téléphone immobile</div>" +
      "<ol class='kcb-isteps'><li class='now'>Le patient en fente contre le mur, à sa distance maximale. Pose le téléphone à plat sur l'avant du <b>tibia</b>, <b>le haut du téléphone vers le genou</b>.</li></ol>" +
      "<button class='seq-btn-main' onclick='KineCabinet.inclTake()'>Enregistrer l'angle du tibia</button>";
    else body = "<div class='kcb-ang' id='kcb-ang'>–</div><div id='kcb-stab'>Garde le téléphone immobile</div>" +
      "<ol class='kcb-isteps'><li class='" + (I.step === 0 ? "now" : "done") + "'>Pose le téléphone à plat sur la face avant de la <b>cuisse</b>, écran vers le haut, <b>le haut du téléphone vers le pied</b>.</li>" +
      "<li class='" + (I.step === 1 ? "now" : "") + "'>Pose-le de la même façon sur le <b>tibia</b>, juste sous le genou.</li></ol>" +
      "<button class='seq-btn-main' onclick='KineCabinet.inclTake()'>" + (I.step === 0 ? "Enregistrer la cuisse" : "Enregistrer le tibia") + "</button>";
    el.innerHTML = "<div class='kcb-incl-card'><div class='kcb-mh'><span>" + esc(KP.M[I.m].l) + ", côté " + (I.sd === "a" ? "atteint" : "sain") + "</span><button class='kf-back' onclick='KineCabinet.inclClose()' aria-label='Fermer'>×</button></div>" + body + "</div>";
  }
  function inclTake() {
    if (!I.buf.length) return;
    var v = med();
    if (KP.M[I.m].incl === 2) { I.res = Math.round(90 - Math.abs(v)); inclView(); return; }
    if (KP.M[I.m].incl === 3) { I.res = Math.round(v); inclView(); return; }   // inclinaison du tibia par rapport à la verticale
    if (I.step === 0) { I.thigh = v; I.step = 1; I.buf = []; inclView(); return; }
    var flex = Math.round(I.thigh - v);
    I.res = I.m === "ext" ? -flex : flex; inclView();
  }
  function inclUse() {
    var el = sheet().querySelector("input[data-m='" + I.m + "'][data-s='" + I.sd + "'][data-i='0']");
    if (el) { el.value = String(I.res); live(); }
    inclClose();
  }
  // Test de saut au téléphone : les essais remplissent les cases (hauteur), ou le RSI et le temps de contact
  function saut(m, sd) {
    var d = KP.M[m]; if (!window.KineSaut) return;
    var put = function (k, i, v) { var el = sheet().querySelector("input[data-m='" + k + "'][data-s='" + sd + "'][data-i='" + i + "']"); if (el) el.value = String(v).replace(".", ","); };
    KineSaut.test({ mode: d.saut, title: d.saut === "rsi" ? "Sauts répétés" : d.l, side: d.s ? "côté " + (sd === "a" ? "atteint" : "sain") : "", n: d.n || 1,
      onUse: function (v) { if (d.saut === "rsi") { put("rsi", 0, v.rsi); put("tcs", 0, v.tc); } else v.slice(0, d.n || 1).forEach(function (x, i) { put(m, i, x); }); live(); } });
  }
  function inclClose() { window.removeEventListener("deviceorientation", onOri); window.removeEventListener("devicemotion", onMot); var el = $("kcb-incl"); if (el) el.classList.remove("open"); I = null; }

  /* ════════ Angle sur photo : hanche, genou, cheville ════════
     Points proposés par la détection de posture (si elle répond), ajustables du doigt.
     Flexion = 180° − angle formé en dessous du genou par la cuisse et la jambe. La photo n'est pas enregistrée. */
  var PH = null;
  function photo(m, sd) {
    inclClose();
    PH = { m: m, sd: sd, pts: null, hyper: false };
    var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.setAttribute("capture", "environment");
    inp.onchange = function () { var f = inp.files && inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { PH.src = r.result; photoLoad(); }; r.readAsDataURL(f); };
    inp.click();
  }
  function photoLoad() {
    var img = new Image();
    img.onload = function () {
      PH.w = img.naturalWidth; PH.h = img.naturalHeight; PH.img = img;
      PH.pts = [{ x: .22, y: .62 }, { x: .5, y: .38 }, { x: .78, y: .66 }];
      photoView("Recherche des repères…");
      autoPoints(img).then(function (p) { if (p && PH) PH.pts = p; if (PH) photoView(p ? "" : "Repères non trouvés : place les 3 points à la main."); });
    };
    img.src = PH.src;
  }
  function autoPoints(img) {
    if (!window.KineCamera || !KineCamera.pose) return Promise.resolve(null);
    var done = false;
    return Promise.race([
      KineCamera.pose("full").then(function (det) {
        var c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0);
        var r = det.detectForVideo(c, performance.now() + 1000), lm = r && r.landmarks && r.landmarks[0]; if (!lm) return null;
        var v = function (i) { return lm[i].visibility == null ? 1 : lm[i].visibility; };
        var L = v(23) + v(25) + v(27), R = v(24) + v(26) + v(28), ids = L >= R ? [23, 25, 27] : [24, 26, 28];
        return ids.map(function (i) { return { x: Math.max(0, Math.min(1, lm[i].x)), y: Math.max(0, Math.min(1, lm[i].y)) }; });
      }).catch(function () { return null; }),
      new Promise(function (r) { setTimeout(function () { if (!done) r(null); }, 8000); })
    ]).then(function (x) { done = true; return x; });
  }
  function angleOf(p, W, H) {
    var a = { x: p[0].x * W - p[1].x * W, y: p[0].y * H - p[1].y * H }, b = { x: p[2].x * W - p[1].x * W, y: p[2].y * H - p[1].y * H };
    var cos = (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y) || 1);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  }
  function photoValue() { var flex = Math.round(180 - angleOf(PH.pts, PH.w, PH.h)); return PH.m === "ext" ? (PH.hyper ? flex : -flex) : flex; }
  function photoView(note) {
    var el = ov("kcb-photo"); el.classList.add("kcb-photo-ov"); el.setAttribute("aria-label", "Angle sur photo");
    var W = PH.w, H = PH.h, p = PH.pts, X = function (i) { return (p[i].x * W).toFixed(1); }, Y = function (i) { return (p[i].y * H).toFixed(1); };
    var r = Math.max(W, H) / 40, sw = Math.max(W, H) / 220, v = photoValue(), isExt = PH.m === "ext";
    var names = ["Grand trochanter", "Interligne externe", "Malléole externe"];
    el.innerHTML = "<div class='kph'><div class='kcb-mh'><span>" + esc(KP.M[PH.m].l) + ", côté " + (PH.sd === "a" ? "atteint" : "sain") + "</span><button class='kf-back' onclick='KineCabinet.photoClose()' aria-label='Fermer'>×</button></div>" +
      "<div class='kph-stage'><img src='" + PH.src + "' alt='Photo de la jambe'><svg id='kph-svg' viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='xMidYMid meet' role='img' aria-label='Points de mesure, angle " + v + " degrés'>" +
        "<line x1='" + X(0) + "' y1='" + Y(0) + "' x2='" + X(1) + "' y2='" + Y(1) + "' stroke='#7CF0D6' stroke-width='" + sw + "'/><line x1='" + X(1) + "' y1='" + Y(1) + "' x2='" + X(2) + "' y2='" + Y(2) + "' stroke='#7CF0D6' stroke-width='" + sw + "'/>" +
        p.map(function (_, i) { return "<circle data-i='" + i + "' cx='" + X(i) + "' cy='" + Y(i) + "' r='" + r + "' fill='rgba(124,240,214,.28)' stroke='" + (i === 1 ? "#fff" : "#7CF0D6") + "' stroke-width='" + sw + "'><title>" + names[i] + "</title></circle>"; }).join("") +
      "</svg><div class='kph-val'><b>" + v + "°</b><span>" + (isExt ? (v < 0 ? "déficit d'extension" : v > 0 ? "hyperextension" : "extension complète") : "flexion") + "</span></div></div>" +
      "<p class='kph-help'>" + esc(note || "Fais glisser les points sur le grand trochanter, l'interligne externe du genou et la malléole externe.") + "</p>" +
      (isExt ? "<label class='krl-ok kph-hyp'><input type='checkbox' onchange='KineCabinet.photoHyper(this.checked)'" + (PH.hyper ? " checked" : "") + "><span>Le genou part en hyperextension</span></label>" : "") +
      "<div class='kcb-two'><button class='seq-btn-secondary' onclick='KineCabinet.photo(" + q(PH.m) + "," + q(PH.sd) + ")'>Reprendre</button><button class='seq-btn-main' onclick='KineCabinet.photoUse()'>Utiliser " + v + "°</button></div></div>";
    el.classList.add("open");
    dragWire();
  }
  function dragWire() {
    var svg = $("kph-svg"); if (!svg) return;
    var cur = -1;
    var pos = function (e) { var b = svg.getBoundingClientRect(), sc = Math.min(b.width / PH.w, b.height / PH.h), ox = (b.width - PH.w * sc) / 2, oy = (b.height - PH.h * sc) / 2;
      return { x: Math.max(0, Math.min(1, (e.clientX - b.left - ox) / sc / PH.w)), y: Math.max(0, Math.min(1, (e.clientY - b.top - oy) / sc / PH.h)) }; };
    svg.addEventListener("pointerdown", function (e) {
      var p = pos(e), best = -1, bd = 1e9;
      PH.pts.forEach(function (q0, i) { var d = Math.hypot((q0.x - p.x) * PH.w, (q0.y - p.y) * PH.h); if (d < bd) { bd = d; best = i; } });
      if (bd < Math.max(PH.w, PH.h) / 6) { cur = best; svg.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    svg.addEventListener("pointermove", function (e) { if (cur < 0) return; PH.pts[cur] = pos(e); move(); });
    svg.addEventListener("pointerup", function () { if (cur >= 0) { cur = -1; photoView(); } });
    function move() {
      var c = svg.querySelectorAll("circle"), l = svg.querySelectorAll("line"), P = PH.pts, W = PH.w, H = PH.h;
      c[cur].setAttribute("cx", P[cur].x * W); c[cur].setAttribute("cy", P[cur].y * H);
      l[0].setAttribute("x1", P[0].x * W); l[0].setAttribute("y1", P[0].y * H); l[0].setAttribute("x2", P[1].x * W); l[0].setAttribute("y2", P[1].y * H);
      l[1].setAttribute("x1", P[1].x * W); l[1].setAttribute("y1", P[1].y * H); l[1].setAttribute("x2", P[2].x * W); l[1].setAttribute("y2", P[2].y * H);
      var b = document.querySelector(".kph-val b"); if (b) b.textContent = photoValue() + "°";
    }
  }
  function photoHyper(v) { PH.hyper = !!v; photoView(); }
  function photoUse() {
    var el = sheet().querySelector("input[data-m='" + PH.m + "'][data-s='" + PH.sd + "'][data-i='0']");
    if (el) { el.value = String(photoValue()); live(); }
    // la photo est gardée avec le bilan, annotée (points, traits et angle), réduite et compressée
    var v = photoValue(), img = annotated(PH, v);
    PHOTOS = PHOTOS.filter(function (x) { return !(x.m === PH.m && x.sd === PH.sd); });
    if (img) PHOTOS.push({ m: PH.m, sd: PH.sd, v: v, img: img });
    photoClose(); phPending();
  }
  // Image réduite (900 px au plus) avec les repères et l'angle dessinés, en JPEG
  function annotated(ph, v) {
    try {
      var k = Math.min(1, 900 / Math.max(ph.w, ph.h)), W = Math.round(ph.w * k), H = Math.round(ph.h * k), c = document.createElement("canvas"); c.width = W; c.height = H;
      var g = c.getContext("2d"); g.drawImage(ph.img, 0, 0, W, H);
      if (ph.pts) {
        var P = ph.pts.map(function (p) { return [p.x * W, p.y * H]; }), lw = Math.max(3, W / 160);
        g.strokeStyle = "#7CF0D6"; g.lineWidth = lw; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(P[1][0], P[1][1]); g.lineTo(P[2][0], P[2][1]); g.stroke();
        P.forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], lw * 2.2, 0, 7); g.stroke(); });
      }
      if (v != null) { var fs = Math.round(W / 9); g.font = "800 " + fs + "px sans-serif"; g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, H - fs * 1.5, W, fs * 1.5); g.fillStyle = "#fff"; g.fillText(v + "°", fs * 0.4, H - fs * 0.4); }
      return c.toDataURL("image/jpeg", 0.62);
    } catch (e) { return null; }
  }
  /* ════════ Photos du bilan : angles mesurés, ou photo libre (cicatrice, œdème, posture) ════════ */
  var PHOTOS = [];   // photos du bilan en cours, enregistrées avec lui
  function phPending() {
    var el = $("kcb-php"); if (!el) return;
    el.innerHTML = PHOTOS.length ? "<div class='kcb-phgrid'>" + PHOTOS.map(function (x, i) { return "<figure><img src='" + x.img + "' alt=''><figcaption>" + esc(phCap(x)) + "</figcaption><button class='kcb-phx' onclick='KineCabinet.phDrop(" + i + ")' aria-label='Retirer la photo'>×</button></figure>"; }).join("") + "</div>" : "";
  }
  function phCap(x) { return x.m && KP.M[x.m] ? (KP.M[x.m].c || KP.M[x.m].l) + (x.sd ? ", " + (x.sd === "a" ? "atteint" : "sain") : "") + (x.v != null ? ", " + x.v + "°" : "") : (x.cap || "Photo"); }
  function phAdd() {
    var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.setAttribute("capture", "environment");
    inp.onchange = function () { var f = inp.files && inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () {
      var img = annotated({ img: im, w: im.naturalWidth, h: im.naturalHeight, pts: null }, null), cap = (prompt("Légende de la photo (facultatif)", "") || "").slice(0, 60);
      if (img) { PHOTOS.push({ m: null, img: img, cap: cap || "Photo" }); phPending(); } }; im.src = r.result; }; r.readAsDataURL(f); };
    inp.click();
  }
  function phDrop(i) { PHOTOS.splice(i, 1); phPending(); }
  var PHC = { pid: null, list: null };
  function photosLoad() {
    if (PHC.pid === C.id && PHC.list) return Promise.resolve(PHC.list);
    if (!fbCab.photos) return Promise.resolve([]);
    return fbCab.photos(C.id).then(function (l) { PHC = { pid: C.id, list: l }; return l; }, function () { return []; });
  }
  // Galerie : toutes les photos du patient (ou celles d'un bilan), de la plus récente à la plus ancienne
  function photosGallery(el, bid) {
    if (!el) return;
    photosLoad().then(function (l) {
      var L0 = l.filter(function (x) { return !bid || x.b === bid; }); if (!el.isConnected) return;
      el.innerHTML = L0.length ? "<div class='su-card'><div class='su-card-h'><b>Photos</b><span>" + L0.length + "</span></div><div class='kcb-phgrid'>" + L0.map(function (x) {
        return "<figure onclick='KineCabinet.phView(" + q(x.id) + ")'><img src='" + x.img + "' alt='' loading='lazy'><figcaption>" + esc(dfr(x.d) + " · " + phCap(x)) + "</figcaption></figure>"; }).join("") + "</div></div>" : "";
    });
  }
  function phView(id) {
    var x = (PHC.list || []).filter(function (p) { return p.id === id; })[0]; if (!x) return;
    var el = ov("kcb-phv"); el.setAttribute("aria-label", "Photo du bilan"); el.onclick = function (e) { if (e.target === el) el.classList.remove("open"); };
    el.innerHTML = "<div class='kcb-incl-card'><div class='kcb-mh'><span>" + esc(dfr(x.d) + " · " + phCap(x)) + "</span><button class='kf-back' onclick='document.getElementById(\"kcb-phv\").classList.remove(\"open\")' aria-label='Fermer'>×</button></div><img class='kcb-phbig' src='" + x.img + "' alt=''>" +
      "<button class='seq-btn-secondary kcb-danger' onclick='KineCabinet.phDel(" + q(x.id) + ")'>Supprimer cette photo</button></div>";
    el.classList.add("open");
  }
  function phDel(id) {
    if (!confirm("Supprimer cette photo ?")) return;
    fbCab.photoDel(C.id, id).then(function () { PHC.list = (PHC.list || []).filter(function (p) { return p.id !== id; }); var el = $("kcb-phv"); if (el) el.classList.remove("open"); reView(); }, fail);
  }
  function photoClose() { var el = $("kcb-photo"); if (el) { el.classList.remove("open"); el.innerHTML = ""; } PH = null; }

  /* ════════ Guide d'orientation du genou ════════ */
  function guide(forWho) {
    if (forWho !== gFor) gStep = 0;
    if (forWho !== gFor || !gAns) {   // zone de départ : celle du parcours en cours
      var cur = forWho === "new" ? draft && KP.P[draft.parcours] : forWho && C ? KP.P[C.parcours] : null;
      if (cur && cur.zone && cur.zone !== gZone) { gZone = cur.zone; gAns = null; }
    }
    gFor = forWho; gAns = gAns || { alertes: [] };
    if (gMode === "rapide") { guideQuick(); return; }
    var GZ = KP.GUIDES[gZone], G = GZ.g, r = KP.guide(gAns, gZone), Q = {}; G.q.forEach(function (x) { Q[x.id] = x; });
    var nAl = gAns.alertes.length, sugT = (r.suggest || []).map(function (x) { return x.t; });
    var html = top(forWho === "new" ? "KineCabinet.nouveau()" : forWho ? "KineCabinet.fiche(" + q(forWho) + ")" : "KineCabinet.open()", "Guide d'orientation") +
      "<div class='kc-seg kgd-zone' role='group' aria-label='Zone'>" + KP.ZONES.map(function (z) { return "<button type='button' class='" + (gZone === z[0] ? "on" : "") + "' aria-pressed='" + (gZone === z[0]) + "' onclick='KineCabinet.gZ(" + q(z[0]) + ")'>" + esc(z[1]) + "</button>"; }).join("") + "</div>" +
      "<div><div class='kf-h1 kcb-h1'>" + esc(GZ.titre) + "</div><div class='kf-sub'>Coche ce que tu observes : le guide classe les pistes et explique pourquoi. Une aide au raisonnement, pas un diagnostic.</div></div>" +
      "<button class='kgq-modeb' onclick='KineCabinet.gMode(\"rapide\")'>Mode rapide : une question par écran ›</button>";
    // 1. alertes
    html += "<section class='kgd-sec" + (nAl ? " alert" : "") + "'><div class='kgd-h'><i>1</i><b>Signes d'alerte</b><span>" + (nAl ? nAl + " coché" + (nAl > 1 ? "s" : "") : "à écarter d'abord") + "</span></div>" +
      G.alertes.map(function (a) { var on = gAns.alertes.indexOf(a.id) >= 0; return "<button class='kgd-al" + (on ? " on" : "") + "' onclick='KineCabinet.gA(" + q(a.id) + ")' aria-pressed='" + on + "'><i>" + (on ? "!" : "") + "</i><span>" + esc(a.t) + "</span></button>"; }).join("") + "</section>";
    // 2 et 3. interrogatoire et examen
    var G_SEC = [["Interrogatoire", G.q.filter(function (x) { return x.id !== "tests"; }).map(function (x) { return x.id; })], ["Examen clinique", ["tests"]]];   // les questions de la zone, dans leur ordre
    G_SEC.forEach(function (sec, si) {
      html += "<section class='kgd-sec'><div class='kgd-h'><i>" + (si + 2) + "</i><b>" + esc(sec[0]) + "</b>" + (sec[1][0] === "tests" ? "<span>appui long : description</span>" : "") + "</div>" +
        sec[1].map(function (id) {
          var x = Q[id];
          return "<div class='kgd-q'><span class='kcb-lab'>" + esc(x.t) + (x.multi ? " <em>plusieurs choix</em>" : "") + "</span><div class='kf-chips kgd-chips'>" + x.ch.map(function (c) {
            var v = gAns[x.id], on = x.multi ? (v || []).indexOf(c[0]) >= 0 : v === c[0], info = id === "tests" && KP.TESTS[c[0]];
            var neg = id === "tests" && (gAns.neg || []).indexOf(c[0]) >= 0, sg = id === "tests" && sugT.indexOf(c[0]) >= 0;
            return "<button type='button' class='" + (on ? "sel" : "") + (neg ? " neg" : "") + (sg ? " sug kf-hop" : "") + (info ? " kgd-t" : "") + "'" + (info ? " data-t='" + c[0] + "'" : "") + " onclick='KineCabinet.gQ(" + q(x.id) + "," + q(c[0]) + "," + (x.multi ? 1 : 0) + ",this)'>" + esc(c[1]) + (neg ? " · négatif" : "") + (info ? "<i aria-hidden='true'>?</i>" : "") + "</button>"; }).join("") + "</div></div>";
        }).join("") + "</section>";
    });
    // à tester ensuite : les tests qui départagent le mieux les pistes en cours
    if (r.suggest && r.suggest.length) html += "<section class='kgd-sec kgd-sug'><div class='kgd-h'><i>4</i><b>À tester ensuite</b><span>pour départager les pistes</span></div>" +
      r.suggest.map(function (x, i) { return "<div class='kgd-st" + (i === 0 ? " kf-hop" : "") + "'><button class='kgd-stn kgd-t' data-t='" + x.t + "' onclick='KineCabinet.testInfo(" + q(x.t) + ")'><b>" + esc(x.nom) + "</b><span>pour : " + esc(x.pour) + " · appui pour la description</span></button>" +
        "<div class='kgd-pn'><button onclick='KineCabinet.gQ(\"tests\"," + q(x.t) + ",1)'>Positif</button><button class='n' onclick='KineCabinet.gN(" + q(x.t) + ")'>Négatif</button></div></div>"; }).join("") + "</section>";
    // pistes
    html += "<div class='kcb-v2h' id='kgd-res'>Pistes</div>";
    if (r.alertes.length) html += r.alertes.map(function (a) { return "<div class='kcb-alert'><b>" + esc(a.d) + "</b><span>" + esc(a.t) + "</span></div>"; }).join("");
    if (!r.pistes.length) html += "<div class='kgd-empty'><b>Pas encore de piste</b><span>Renseigne l'interrogatoire et les tests. Sans piste claire, le parcours « " + esc(KP.P[GZ.def].nom) + " » permet de commencer.</span></div>";
    var mx = r.pistes.length ? r.pistes[0].score : 1;
    html += r.pistes.map(function (p, i) {
      return "<div class='kgd-p" + (i === 0 ? " first" : "") + "'><div class='kgd-ph'><i>" + (i + 1) + "</i><div><b>" + esc(p.nom) + "</b><span>" + (i === 0 ? "Piste principale" : "Autre piste") + "</span></div></div>" +
        "<div class='kgd-bar'><u style='width:" + Math.round(p.score / mx * 100) + "%'></u></div>" +
        "<div class='kgd-why'>" + p.why.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("") + "</div>" +
        "<div class='kgd-note'>" + esc(p.note) + "</div>" +
        (KP.P[p.parcours] ? "<div class='kgd-mes'><b>Au premier bilan :</b> " + esc([KP.P[p.parcours].key.m].concat(KP.P[p.parcours].mes).filter(function (m, i, a) { return a.indexOf(m) === i && KP.M[m] && KP.M[m].g !== "Questionnaire"; }).slice(0, 4).map(function (m) { return KP.M[m].c || KP.M[m].l; }).join(", ")) + "</div>" : "") +
        (gFor ? "<button class='" + (i === 0 ? "seq-btn-main" : "seq-btn-secondary") + "' onclick='KineCabinet.gUse(" + q(p.parcours) + ")'>Parcours « " + esc(KP.P[p.parcours].nom) + " »</button>" : "") + "</div>";
    }).join("");
    if (gFor) html += "<button class='v2-row' onclick='KineCabinet.gUse(" + q(GZ.def) + ")'><b>" + esc(GZ.defNom) + "</b><span>›</span></button>";
    html += "<details class='kf-acc kcb-acc'><summary>Sources</summary><ul class='kcb-src'>" + GZ.src.map(function (s) { return "<li>" + esc(KP.SRC[s]) + "</li>"; }).join("") + "</ul></details>";
    var p0 = r.pistes[0], foot = "<div class='kgd-foot'><div><span>" + (r.alertes.length ? "Signe d'alerte" : p0 ? "Piste principale" : "Pistes") + "</span><b>" + esc(r.alertes.length ? "Avis médical d'abord" : p0 ? p0.nom : "à compléter") + "</b></div>" +
      "<button class='kcb-cta' onclick='KineCabinet.gGo()'>Voir</button><button class='kcb-link' onclick='KineCabinet.gReset()'>Effacer</button></div>";
    var y = sheet().classList.contains("open") ? sheet().scrollTop : 0;
    show(html, foot, gFor ? null : "guide");
    sheet().scrollTop = y;
    holdWire();
  }
  /* ════════ Guide, mode rapide : une question par écran, de grosses tuiles, « Passer » partout ════════
     Le guide propose le test suivant au fur et à mesure ; les pistes se mettent à jour en bas. */
  var gMode = (function () { try { return localStorage.getItem("kf-guide-mode") || "rapide"; } catch (e) { return "rapide"; } })(), gStep = 0;
  function gModeSet(m) { gMode = m; try { localStorage.setItem("kf-guide-mode", m); } catch (e) {} gStep = 0; guide(gFor); sheet().scrollTop = 0; }
  function gSteps() {
    var G = KP.GUIDES[gZone].g;
    return [{ k: "zone" }, { k: "alertes" }].concat(G.q.filter(function (x) { return x.id !== "tests"; }).map(function (x) { return { k: "q", id: x.id }; })).concat([{ k: "tests" }, { k: "res" }]);
  }
  function nextTest(r) {
    var done = (gAns.tests || []).concat(gAns.neg || [], gAns.skipT || []);
    return (r.suggest || []).filter(function (x) { return done.indexOf(x.t) < 0; })[0] || null;
  }
  function guideQuick() {
    var GZ = KP.GUIDES[gZone], G = GZ.g, r = KP.guide(gAns, gZone), S = gSteps();
    if (gStep >= S.length) gStep = S.length - 1;
    var st = S[gStep], body = "", foot = "", nQ = S.length - 1;
    var hd = "<div class='kgq-top'><button class='kf-back' onclick='KineCabinet.gqBack()' aria-label='Retour'>" + ICON.back + "</button><div class='kgq-prog' aria-hidden='true'><u style='width:" + Math.round(gStep / nQ * 100) + "%'></u></div>" +
      "<button class='kgq-mode' onclick='KineCabinet.gMode(\"complet\")'>Vue complète</button></div>";
    var tiles = function (ch, isOn, fn) { return "<div class='kgq-tiles'>" + ch.map(function (c) { var on = isOn(c[0]); return "<button class='kgq-tile" + (on ? " on" : "") + "' aria-pressed='" + on + "' onclick='" + fn(c[0]) + "'>" + esc(c[1]) + "</button>"; }).join("") + "</div>"; };
    var skip = "<button class='kgq-skip' onclick='KineCabinet.gqNext()'>Passer</button>";
    if (st.k === "zone") {
      body = "<div class='kgq-k'>Zone</div><div class='kgq-q'>Où est le problème ?</div>" + tiles(KP.ZONES, function (z) { return z === gZone; }, function (z) { return "KineCabinet.gqZone(" + q(z) + ")"; });
      foot = "<button class='seq-btn-main' onclick='KineCabinet.gqNext()'>Continuer avec « " + esc((KP.ZONES.filter(function (z) { return z[0] === gZone; })[0] || ["", ""])[1]) + " »</button>";
    } else if (st.k === "alertes") {
      var nA = gAns.alertes.length;
      body = "<div class='kgq-k'>Signes d'alerte</div><div class='kgq-q'>Un de ces signes ?</div><div class='kf-sub'>À écarter d'abord. Touche ceux qui sont présents.</div>" +
        "<div class='kgq-list'>" + G.alertes.map(function (a) { var on = gAns.alertes.indexOf(a.id) >= 0; return "<button class='kgq-al" + (on ? " on" : "") + "' aria-pressed='" + on + "' onclick='KineCabinet.gqA(" + q(a.id) + ")'><i>" + (on ? "!" : "") + "</i><span>" + esc(a.t) + "</span></button>"; }).join("") + "</div>";
      foot = "<button class='seq-btn-main' onclick='KineCabinet.gqNext()'>" + (nA ? "Continuer (" + nA + " signe" + (nA > 1 ? "s" : "") + " d'alerte)" : "Aucun, on continue") + "</button>";
    } else if (st.k === "q") {
      var x = G.q.filter(function (y) { return y.id === st.id; })[0], v = gAns[x.id];
      body = "<div class='kgq-k'>Interrogatoire</div><div class='kgq-q'>" + esc(x.t) + "</div>" + (x.multi ? "<div class='kf-sub'>Plusieurs réponses possibles.</div>" : "") +
        tiles(x.ch, function (c) { return x.multi ? (v || []).indexOf(c) >= 0 : v === c; }, function (c) { return "KineCabinet.gqC(" + q(x.id) + "," + q(c) + "," + (x.multi ? 1 : 0) + ")"; });
      foot = (x.multi && v && v.length ? "<button class='seq-btn-main' onclick='KineCabinet.gqNext()'>Suivant</button>" : "") + skip;
    } else if (st.k === "tests") {
      var t = nextTest(r), T = t && KP.TESTS[t.t], asked = (gAns.tests || []).length + (gAns.neg || []).length;
      if (t) {
        body = "<div class='kgq-k'>Examen clinique · test " + (asked + 1) + "</div><div class='kgq-q'>" + esc(t.nom) + "</div><div class='kf-sub'>Pour départager : " + esc(t.pour) + "</div>" +
          (T ? "<div class='kgq-how'><b>Comment</b><p>" + esc(T.how) + "</p><button class='kcb-link' onclick='KineCabinet.testInfo(" + q(t.t) + ")'>Positif, négatif, ce qu'il vaut</button></div>" : "") +
          "<div class='kgq-pn'><button class='pos' onclick='KineCabinet.gqT(" + q(t.t) + ",1)'>Positif</button><button class='neg' onclick='KineCabinet.gqT(" + q(t.t) + ",0)'>Négatif</button></div>";
        foot = "<button class='kgq-skip' onclick='KineCabinet.gqT(" + q(t.t) + ",-1)'>Pas fait, test suivant</button><button class='kgq-skip' onclick='KineCabinet.gqNext()'>Voir les pistes</button>";
      } else {
        var TQ = G.q.filter(function (y) { return y.id === "tests"; })[0];
        body = "<div class='kgq-k'>Examen clinique</div><div class='kgq-q'>" + (asked ? "Plus de test à proposer" : "Des tests positifs ?") + "</div><div class='kf-sub'>Ajoute d'autres tests positifs si besoin.</div>" +
          tiles(TQ.ch, function (c) { return (gAns.tests || []).indexOf(c) >= 0; }, function (c) { return "KineCabinet.gqC(\"tests\"," + q(c) + ",1)"; });
        foot = "<button class='seq-btn-main' onclick='KineCabinet.gqNext()'>Voir les pistes</button>";
      }
    } else {
      body = "<div class='kgq-k'>Résultat</div><div class='kgq-q'>Les pistes</div>" + pistesHtml(r, GZ) +
        "<button class='kcb-link' onclick='KineCabinet.gqGo(0)'>Revoir les réponses</button>";
      foot = "<button class='seq-btn-secondary' onclick='KineCabinet.gReset()'>Nouveau patient, tout effacer</button>";
    }
    // les pistes en direct, en bas de chaque écran
    var p0 = r.pistes[0], live = st.k === "res" ? "" : "<button class='kgq-live' onclick='KineCabinet.gqGo(" + (S.length - 1) + ")'><span>" + (r.alertes.length ? "Signe d'alerte" : p0 ? "Piste principale" : "Pistes") + "</span><b>" + esc(r.alertes.length ? "Avis médical d'abord" : p0 ? p0.nom : "à compléter") + "</b><i>›</i></button>";
    show(hd + "<div class='kgq-body'>" + body + "</div>", foot + live, gFor ? null : "guide");
    sheet().scrollTop = 0;
  }
  // Pistes classées (vue complète et résultat du mode rapide)
  function pistesHtml(r, GZ) {
    var html = "";
    if (r.alertes.length) html += r.alertes.map(function (a) { return "<div class='kcb-alert'><b>" + esc(a.d) + "</b><span>" + esc(a.t) + "</span></div>"; }).join("");
    if (!r.pistes.length) html += "<div class='kgd-empty'><b>Pas encore de piste</b><span>Renseigne l'interrogatoire et les tests. Sans piste claire, le parcours « " + esc(KP.P[GZ.def].nom) + " » permet de commencer.</span></div>";
    var mx = r.pistes.length ? r.pistes[0].score : 1;
    html += r.pistes.map(function (p, i) {
      return "<div class='kgd-p" + (i === 0 ? " first" : "") + "'><div class='kgd-ph'><i>" + (i + 1) + "</i><div><b>" + esc(p.nom) + "</b><span>" + (i === 0 ? "Piste principale" : "Autre piste") + "</span></div></div>" +
        "<div class='kgd-bar'><u style='width:" + Math.round(p.score / mx * 100) + "%'></u></div>" +
        "<div class='kgd-why'>" + p.why.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("") + "</div>" +
        "<div class='kgd-note'>" + esc(p.note) + "</div>" +
        (KP.P[p.parcours] ? "<div class='kgd-mes'><b>Au premier bilan :</b> " + esc([KP.P[p.parcours].key.m].concat(KP.P[p.parcours].mes).filter(function (m, i, a) { return a.indexOf(m) === i && KP.M[m] && KP.M[m].g !== "Questionnaire"; }).slice(0, 4).map(function (m) { return KP.M[m].c || KP.M[m].l; }).join(", ")) + "</div>" : "") +
        (gFor ? "<button class='" + (i === 0 ? "seq-btn-main" : "seq-btn-secondary") + "' onclick='KineCabinet.gUse(" + q(p.parcours) + ")'>Parcours « " + esc(KP.P[p.parcours].nom) + " »</button>" : "") + "</div>";
    }).join("");
    if (gFor) html += "<button class='v2-row' onclick='KineCabinet.gUse(" + q(GZ.def) + ")'><b>" + esc(GZ.defNom) + "</b><span>›</span></button>";
    html += "<details class='kf-acc kcb-acc'><summary>Sources</summary><ul class='kcb-src'>" + GZ.src.map(function (s) { return "<li>" + esc(KP.SRC[s]) + "</li>"; }).join("") + "</ul></details>";
    return html;
  }
  function gqNext() { gStep++; guideQuick(); }
  function gqBack() { if (gStep > 0) { gStep--; guideQuick(); return; } if (gFor === "new") nouveau(); else if (gFor) fiche(gFor); else open(); }
  function gqGo(i) { gStep = i; guideQuick(); }
  function gqZone(z) { if (z !== gZone) { gZone = z; gAns = { alertes: [] }; } gStep = 1; guideQuick(); }
  function gqA(id) { var a = gAns.alertes, i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); guideQuick(); }
  function gqC(k, v, multi) {
    if (multi) { var a = gAns[k] = gAns[k] || [], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); guideQuick(); return; }
    gAns[k] = gAns[k] === v ? null : v; guideQuick();
    if (gAns[k]) setTimeout(function () { if (gMode === "rapide") gqNext(); }, 220);   // un seul choix : on passe tout seul à la suite
  }
  function gqT(t, res) {
    if (res === 1) { gAns.tests = gAns.tests || []; if (gAns.tests.indexOf(t) < 0) gAns.tests.push(t); }
    else if (res === 0) { gAns.neg = gAns.neg || []; if (gAns.neg.indexOf(t) < 0) gAns.neg.push(t); }
    else { gAns.skipT = gAns.skipT || []; gAns.skipT.push(t); }
    guideQuick();
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
  function gQ(k, v, multi, btn) {
    if (held && btn && btn.classList.contains("kgd-t")) { held = false; return; }
    if (k === "tests" && gAns.neg && gAns.neg.indexOf(v) >= 0) { gAns.neg.splice(gAns.neg.indexOf(v), 1); guide(gFor); return; }   // un test noté négatif : un appui l'efface
    if (multi) { var a = gAns[k] = gAns[k] || [], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); } else gAns[k] = gAns[k] === v ? null : v; guide(gFor);
  }
  function gN(t) { var a = gAns.neg = gAns.neg || [], i = a.indexOf(t); if (i >= 0) a.splice(i, 1); else { a.push(t); var p = (gAns.tests || []).indexOf(t); if (p >= 0) gAns.tests.splice(p, 1); } guide(gFor); }
  function gReset() { gAns = { alertes: [] }; gStep = 0; guide(gFor); }
  function gZ(z) { if (z === gZone) return; gZone = z; gAns = { alertes: [] }; gStep = 0; guide(gFor); sheet().scrollTop = 0; }
  function gUse(pid) {
    if (gFor === "new") { nouveau(pid); return; }
    if (gFor) { loading(); fbCab.save(gFor, { parcours: pid, etape: 0, done: {}, exos: [] }).then(function () { fiche(gFor); }, fail); }
  }

  // En mode kiné, l'espace kiné ne se ferme pas (seulement à la déconnexion : close(true))
  function close(force) { if (!force && window.KineRole && KineRole.role() === "kine" && isKine()) { open(); return; } var el = $("kcb-sheet"); if (el) el.classList.remove("open"); ["kcb-qov", "kcb-bsum", "kcb-phv", "kcb-tinfo", "kcb-fip"].forEach(function (k) { var e = $(k); if (e) e.classList.remove("open"); }); }
  // Aperçu de ce que voit le patient (sans les notes du kiné)
  function asPatient() {
    var d = JSON.parse(JSON.stringify({ alias: C.alias, parcours: C.parcours, etape: C.etape, done: C.done, date0: C.date0, opts: C.opts, exos: C.exos, msg: C.msg, conseil: C.conseil, next: C.next, ref: C.ref, hist: C.hist,
      bilans: (C.bilans || []).map(function (b) { return { d: b.d, m: b.m }; }), seances: (C.seances || []).map(function (x) { return { d: x.d, ex: x.ex, kg: x.kg, reps: x.reps, series: x.series, dou: x.dou }; }) }));
    KineMonSuivi.preview(d);
  }

  return {
    open: open, close: close, filter: filter, setKine: setKine, push: push, journal: journal, demandes: demandes, accept: accept, refuse: refuse, bilanPick: bilanPick, bilanFor: bilanFor, asPatient: asPatient, nouveau: nouveau, reglages: reglages, set: set, opt: opt, saveForm: saveForm, remove: remove,
    when: whenSet, exUnplan: exUnplan, ficheP: ficheP, fiche: fiche, code: codeView, newCode: newCode, tick: tick, etape: etape, pick: pick, sendExos: sendExos, exEdit: exEditGo, exCancel: exCancel, recu: function (at) { return recu(at); }, saveMsg: saveMsg,
    bilan: bilan, ch: ch, live: live, saveBilan: saveBilan, delBilan: delBilan, bF: bF, bS: bS, bCheck: bCheck, qOv: qOv,
    etapes: etapes, maison: maison, questView: questView, bilans: bilans, phAdd: phAdd, phDrop: phDrop, phView: phView, phDel: phDel,
    seance: seance, sl: sl, sr: sr, srm: srm, sadd: sadd, sd: sd, saveSeance: saveSeance, sall: function () { S.all = !S.all; seanceView(); }, shome: function (v) { S.home = !!v; }, snote: function (v) { S.note = v; },
    incl: incl, saut: saut, inclPhone: inclPhone, photo: photo, photoHyper: photoHyper, photoUse: photoUse, photoClose: photoClose, _photoTest: function (src, m, sd) { PH = { m: m || "flex", sd: sd || "a", hyper: false, src: src }; photoLoad(); }, inclTake: inclTake, inclUse: inclUse, inclClose: inclClose,
    guide: guide, gMode: gModeSet, gqNext: gqNext, gqBack: gqBack, gqGo: gqGo, gqZone: gqZone, gqA: gqA, gqC: gqC, gqT: gqT, gA: gA, gQ: gQ, gReset: gReset, gZ: gZ, gN: gN, tee: tee, teeSave: teeSave, qSend: qSend, qCancel: qCancel, qView: qView, gUse: gUse, gGo: gGo, testInfo: testInfo,
    _curve: curve, _bars: bars2
  };
})();
