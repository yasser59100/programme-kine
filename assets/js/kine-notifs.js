/* ═══════════ KinéForce — notifications du jour ═══════════
   Le patient choisit de recevoir, une fois par jour à l'heure de son choix, le « Le saviez-vous ? »
   et/ou le « Vrai ou faux » du jour. L'envoi est fait par un petit robot GitHub (tools/push/envoi.mjs).
   Stocké dans Firebase : l'adresse technique de notification du téléphone, l'heure, le fuseau, le type. Rien d'autre.
   L'option n'apparaît que lorsque l'envoyeur est en place (clé publique publiée dans Firebase). */
(function () {
  "use strict";
  var KEY = "kf-push", PKEY = "kf-push-key";
  var HOURS = [8, 10, 12, 14, 18, 20];
  var KINDS = [["both", "Les deux, un jour sur deux"], ["savoir", "Le savais-tu ?"], ["vf", "Vrai ou faux"]];
  function $(id) { return document.getElementById(id); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function st() { return jget(KEY, { on: false, hour: 18, kind: "both" }); }
  function supported() { return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }
  function ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; }
  function key() { try { return localStorage.getItem(PKEY); } catch (e) { return null; } }
  function available() { return !!key(); }
  function label() { var s = st(); return s.on ? s.hour + " h" : "désactivées"; }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function u8(b64) {
    var pad = "=".repeat((4 - b64.length % 4) % 4), raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    var out = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out;
  }
  async function hash(t) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return Array.from(new Uint8Array(buf)).map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("").slice(0, 40);
  }
  function rerender() { if (window.KineLayout && KineLayout.render) { try { KineLayout.render(); } catch (e) {} } }

  // La clé publique est publiée par l'envoyeur ; tant qu'elle n'existe pas, l'option reste cachée
  async function loadKey() {
    if (!window.fbPushKey) return;
    try {
      var k = await fbPushKey(), had = key();
      if (k && k !== had) { localStorage.setItem(PKEY, k); rerender(); if (had && st().on) enable(st().hour, st().kind, true); }
    } catch (e) {}
  }

  async function enable(hour, kind, silent) {
    var msg = $("kn-msg");
    function say(t) { if (msg) msg.textContent = t; }
    if (!supported()) { say("Ton téléphone ne permet pas les notifications depuis cette appli."); return false; }
    if (ios() && !standalone()) { say("Sur iPhone, ajoute d'abord KinéForce à l'écran d'accueil (bouton Partager, puis « Sur l'écran d'accueil »), puis ouvre l'appli depuis cette icône."); return false; }
    var perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") { say("Les notifications sont bloquées. Tu peux les autoriser dans les réglages du téléphone, puis réessayer."); return false; }
    say("Activation…");
    try {
      var reg = await navigator.serviceWorker.ready, k = key();
      var sub = await reg.pushManager.getSubscription();
      if (sub && silent) { await sub.unsubscribe(); sub = null; }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(k) });
      var j = sub.toJSON(), id = await hash(j.endpoint), now = new Date();
      var old = st().id; if (old && old !== id && window.fbPushDelete) { try { await fbPushDelete(old); } catch (e) {} }
      var data = { sub: { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } }, hour: hour, kind: kind,
                   tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris").slice(0, 50), created: iso(now) };
      if (now.getHours() >= hour) data.last = iso(now);      // première notification demain, pas tout de suite
      await fbPushSave(id, data);
      jset(KEY, { on: true, hour: hour, kind: kind, id: id });
      say(""); return true;
    } catch (e) {
      say("L'activation n'a pas marché. Vérifie ta connexion et réessaie.");
      return false;
    }
  }
  async function disable() {
    var s = st();
    try { var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); } catch (e) {}
    if (s.id && window.fbPushDelete) { try { await fbPushDelete(s.id); } catch (e) {} }
    jset(KEY, { on: false, hour: s.hour, kind: s.kind });
  }

  /* ── Écran de réglage ── */
  var pick = null;
  function open() {
    var s = st(); pick = { hour: s.hour, kind: s.kind };
    var el = $("kn-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kn-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Notifications du jour"); document.body.appendChild(el); }
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineNotifs.close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Notifications du jour</div>" +
      "<div class='kf-sub'>Une seule notification par jour, à l'heure de ton choix, pour découvrir le « Le savais-tu ? » ou répondre au « Vrai ou faux » du jour.</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Je veux recevoir</div><div class='kf-chips kn-kinds'>" +
        KINDS.map(function (k) { return "<button type='button' data-k='" + k[0] + "' class='" + (k[0] === pick.kind ? "sel" : "") + "'>" + k[1] + "</button>"; }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>À quelle heure ?</div><div class='kf-chips kn-hours'>" +
        HOURS.map(function (h) { return "<button type='button' data-h='" + h + "' class='" + (h === pick.hour ? "sel" : "") + "'>" + h + " h</button>"; }).join("") + "</div>" +
      "<p class='kn-msg' id='kn-msg' role='status'></p>" +
      "<p class='lx-muted kn-note'>Aucune donnée de santé n'est envoyée : seulement l'adresse technique de notification de ce téléphone, l'heure et le fuseau horaire. Tu peux arrêter à tout moment.</p>" +
      "</div><div class='kf-sheet-foot'>" +
        "<button class='seq-btn-main' id='kn-go'>" + (s.on ? "Enregistrer" : "Activer les notifications") + "</button>" +
        (s.on ? "<button class='seq-btn-secondary' id='kn-off'>Désactiver</button>" : "") +
      "</div>";
    el.querySelectorAll(".kn-kinds button").forEach(function (b) { b.onclick = function () { pick.kind = b.getAttribute("data-k"); el.querySelectorAll(".kn-kinds button").forEach(function (x) { x.classList.toggle("sel", x === b); }); }; });
    el.querySelectorAll(".kn-hours button").forEach(function (b) { b.onclick = function () { pick.hour = +b.getAttribute("data-h"); el.querySelectorAll(".kn-hours button").forEach(function (x) { x.classList.toggle("sel", x === b); }); }; });
    $("kn-go").onclick = async function () {
      this.disabled = true;
      var ok = await enable(pick.hour, pick.kind, false);
      this.disabled = false;
      if (ok) { close(); rerender(); }
    };
    if ($("kn-off")) $("kn-off").onclick = async function () { await disable(); close(); rerender(); };
    el.classList.add("open"); el.scrollTop = 0;
  }
  function close() { var el = $("kn-sheet"); if (el) el.classList.remove("open"); }

  /* ── Ouverture depuis une notification ── */
  function show(what) {
    if (!what) return;
    // Nouvelle demande d'accès (notification du kiné) : on ouvre l'onglet Demandes dès que le compte kiné est prêt
    if (what === "demandes") { var n = 0, t = setInterval(function () { if (window.KineCabinet && window.fbUser && fbUser.isAdmin && window.fbCab) { clearInterval(t); KineCabinet.demandes(); } else if (++n > 40) clearInterval(t); }, 250); return; }
    if (what === "monkine") { if (typeof showPage === "function") { try { showPage("monkine"); } catch (e) {} } return; }
    if (typeof showPage === "function") { try { showPage("home"); } catch (e) {} }
    setTimeout(function () {
      if (what === "savoir" && window.KineSavoir) KineSavoir.open(KineSavoir.today ? KineSavoir.today() : 0);
      else if (what === "vf") { var c = $("ki-vf"); if (c) { c.scrollIntoView({ behavior: "smooth", block: "center" }); c.classList.add("kf-flash"); setTimeout(function () { c.classList.remove("kf-flash"); }, 1600); } }
    }, 600);
  }
  function fromUrl() {
    try {
      var u = new URL(location.href), w = u.searchParams.get("ouvrir");
      if (w) { u.searchParams.delete("ouvrir"); history.replaceState(null, "", u.pathname + u.search + u.hash); show(w); }
    } catch (e) {}
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", function (e) { if (e.data && e.data.kfOuvrir) show(e.data.kfOuvrir); });

  /* Prévenir le patient quand son kiné lui envoie quelque chose : abonnement rangé dans sa fiche (adresse technique seulement) */
  var KK = "kf-cab-notif";
  async function kineOn(pid) {
    if (!supported()) return "Ton téléphone ne permet pas les notifications depuis cette appli.";
    if (ios() && !standalone()) return "Sur iPhone, ajoute d'abord KinéForce à l'écran d'accueil (Partager, puis « Sur l'écran d'accueil »), puis ouvre l'appli depuis cette icône.";
    if (!key()) await loadKey();
    if (!key()) return "Connexion impossible pour l'instant. Réessaie dans un moment.";
    var perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") return "Les notifications sont bloquées. Autorise-les dans les réglages du téléphone, puis réessaie.";
    try {
      var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(key()) });
      var j = sub.toJSON(), id = await hash(j.endpoint);
      await fbPat.notifSave(pid, id, { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } });
      jset(KK, { pid: pid, id: id }); return "";
    } catch (e) { return "L'activation n'a pas marché. Vérifie ta connexion et réessaie."; }
  }
  async function kineOff() { var s = jget(KK, null); jset(KK, null); if (s && window.fbPat && fbPat.notifDel) { try { await fbPat.notifDel(s.pid, s.id); } catch (e) {} } }
  function kineState(pid) { var s = jget(KK, null); return !!(s && s.pid === pid); }
  window.KineNotifs = { open: open, close: close, available: available, label: label, enable: enable, disable: disable, supported: supported, kineOn: kineOn, kineOff: kineOff, kineState: kineState };
  window.addEventListener("kf-fb-ready", loadKey);
  function init() { fromUrl(); loadKey(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
