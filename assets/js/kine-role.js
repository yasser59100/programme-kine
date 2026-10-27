/* ═══════════ KinéForce — Kiné ou patient ═══════════
   Au premier lancement : « Tu es kiné ou patient ? ». Le choix est gardé sur le téléphone (kf-role).
   · Kiné : connexion avec son compte Google, puis l'espace kiné s'ouvre à chaque lancement.
   · Patient : trois chemins — un code du kiné, une demande d'accès (prénom et nom, transmis au kiné seul),
     ou l'entraînement seul (le programme général).
   Ceux qui avaient déjà l'appli restent patients, sans écran de choix. */
var KineRole = (function () {
  "use strict";
  var KEY = "kf-role";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function role() { return get(KEY); }
  var BACK = "<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M15 18l-6-6 6-6'/></svg>";
  var NEXT = "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' aria-hidden='true'><path d='M9 6l6 6-6 6'/></svg>";

  // Nouvel utilisateur : ni visite guidée faite, ni séance, ni date de départ
  function isNew() {
    if (get("kf-tour-v2") || get("kf-start") || get("kf-cab")) return false;
    try { var s = JSON.parse(get("kf-sessions") || "[]"); if (s && s.length) return false; } catch (e) {}
    return true;
  }

  function sheet() {
    var el = $("kf-role");
    if (!el) { el = document.createElement("div"); el.id = "kf-role"; el.className = "kf-sheet kcb krl"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Bienvenue"); document.body.appendChild(el); }
    return el;
  }
  function show(html, foot) { var el = sheet(); el.innerHTML = "<div class='kf-sheet-body'>" + html + "</div>" + (foot ? "<div class='kf-sheet-foot'>" + foot + "</div>" : ""); el.classList.add("open"); el.scrollTop = 0; }
  function close() { var el = $("kf-role"); if (el) el.classList.remove("open"); }
  function back(fn) { return "<div class='kcb-top'><button class='kf-back' onclick='" + fn + "' aria-label='Retour'>" + BACK + "</button><span></span><i></i></div>"; }

  /* ════════ 1. Le choix ════════ */
  function choose() {
    show("<div class='krl-brand'>Kiné<span>Force</span></div>" +
      "<div class='krl-hero' id='krl-hero'><i></i><u></u><img src='assets/lumiere/yass-salut.webp' alt='Yass, le coach de l&#39;appli, te salue'></div>" +
      "<div><h1 class='kf-h1 kcb-h1'>Bienvenue.<br>Tu es…</h1><p class='kf-sub krl-sub'>L'appli s'adapte à ton rôle. Tu pourras changer plus tard.</p></div>" +
      "<div class='krl-two'>" +
        "<button class='krl-card' onclick='KineRole.pick(\"kine\")'><span class='krl-ic dark'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M6 3v6a6 6 0 0 0 12 0V3'/><path d='M12 15v2a4 4 0 0 0 8 0v-3'/><circle cx='20' cy='12' r='2'/></svg></span><b>Kiné</b><span>Je suis mes patients</span></button>" +
        "<button class='krl-card main' onclick='KineRole.pick(\"patient\")'><span class='krl-ic'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='6' r='3'/><path d='M6 21v-4a6 6 0 0 1 12 0v4'/></svg></span><b>Patient</b><span>Je fais ma rééducation</span></button>" +
      "</div>");
  }
  // Petite animation de Yass avant l'écran suivant
  function pick(r) {
    var h = $("krl-hero");
    if (h) { h.classList.add(r === "kine" ? "go-kine" : "go-patient"); }
    setTimeout(function () { if (r === "kine") kine(); else patient(); }, 650);
  }

  /* ════════ 2. Côté patient ════════ */
  function patient() {
    set(KEY, "patient");
    show(back("KineRole.choose()") +
      "<div class='krl-hero table'><i></i><em></em><img src='assets/lumiere/yass-salut.webp' alt=''><span>Ta rééducation commence ici</span></div>" +
      "<h1 class='kf-h1 kcb-h1'>Ton kiné utilise KinéForce ?</h1>" +
      "<button class='krl-row dark' onclick='KineRole.code()'><span class='krl-ic'>ABC</span><span class='krl-t'><b>J'ai un code de mon kiné</b><span>6 caractères, donnés au cabinet</span></span>" + NEXT + "</button>" +
      "<button class='krl-row' onclick='KineRole.demande()'><span class='krl-ic soft'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 4h16v12H8l-4 4z'/><path d='M8 9h8M8 12h5'/></svg></span><span class='krl-t'><b>Demander un accès</b><span>Pas de code ? Ton kiné reçoit ta demande</span></span>" + NEXT + "</button>" +
      "<button class='krl-row dash' onclick='KineRole.seul()'><span class='krl-ic grey'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 12h3l3-7 4 14 3-7h5'/></svg></span><span class='krl-t'><b>Je m'entraîne seul</b><span>Programme général : prévention et entretien</span></span>" + NEXT + "</button>" +
      "<p class='kcb-hint kcb-center'>Tu pourras relier ton kiné plus tard, depuis l'onglet Progrès.</p>");
  }
  function home() { close(); if (typeof showPage === "function") showPage("home"); window.scrollTo(0, 0); setTimeout(function () { if (window.KineMascotte && !get("kf-tour-v2")) try { KineMascotte.replay(null, "kf-tour-v2"); } catch (e) {} }, 700); }
  function seul() { set(KEY, "patient"); home(); }
  function code() { set(KEY, "patient"); close(); if (window.KineMonSuivi) KineMonSuivi.join(); }

  /* Demande d'accès : prénom, nom, un mot ; le nom n'est transmis qu'au kiné */
  function demande(err, keep) {
    keep = keep || {};
    var fromRole = sheet().classList.contains("open");
    show(back(fromRole ? "KineRole.patient()" : "KineRole.close()") +
      "<div><h1 class='kf-h1 kcb-h1'>Demander un accès à ton kiné</h1><p class='kf-sub krl-sub'>Ton kiné reçoit ta demande. Dès qu'il l'accepte, ton appli se relie toute seule à ton suivi.</p></div>" +
      "<div class='su-card'>" +
        "<label class='kcb-field'><span class='kcb-lab'>Prénom</span><input class='kcb-in' id='krl-prenom' maxlength='40' autocomplete='given-name' value='" + esc(keep.prenom || "") + "'></label>" +
        "<label class='kcb-field'><span class='kcb-lab'>Nom</span><input class='kcb-in' id='krl-nom' maxlength='40' autocomplete='family-name' value='" + esc(keep.nom || "") + "'></label>" +
        "<label class='kcb-field'><span class='kcb-lab'>Un mot pour ton kiné (facultatif)</span><input class='kcb-in' id='krl-msg' maxlength='160' placeholder='Par exemple : rendez-vous le jeudi' value='" + esc(keep.msg || "") + "'></label>" +
      "</div>" +
      "<label class='krl-ok'><input type='checkbox' id='krl-ok'" + (keep.ok ? " checked" : "") + "><span>J'accepte que mon nom soit transmis à mon kiné, et à lui seul. La demande est effacée dès qu'il l'accepte, et au bout de 30 jours sinon.</span></label>" +
      (err ? "<div class='kcb-alert'><b>" + esc(err) + "</b></div>" : ""),
      "<button class='seq-btn-main' id='krl-send' onclick='KineRole.send()'>Envoyer ma demande</button>");
  }
  function send() {
    var d = { prenom: ($("krl-prenom").value || "").trim(), nom: ($("krl-nom").value || "").trim(), msg: ($("krl-msg").value || "").trim(), ok: $("krl-ok").checked };
    if (!d.prenom || !d.nom) { demande("Indique ton prénom et ton nom.", d); return; }
    if (!d.ok) { demande("Coche la case pour que ton kiné puisse recevoir ta demande.", d); return; }
    if (!window.fbPat) { demande("Connexion impossible pour l'instant. Vérifie Internet, puis réessaie.", d); return; }
    var b = $("krl-send"); if (b) { b.disabled = true; b.textContent = "Envoi…"; }
    fbPat.request({ prenom: d.prenom.slice(0, 40), nom: d.nom.slice(0, 40), msg: d.msg.slice(0, 160) }).then(function () {
      set(KEY, "patient");
      try { localStorage.setItem("kf-cab", JSON.stringify({ pending: true, prenom: d.prenom.slice(0, 40), at: Date.now() })); } catch (e) {}
      close(); if (typeof showPage === "function") showPage("suivi");
      if (window.KineSuivi && KineSuivi.render) KineSuivi.render(); else if (window.KineMonSuivi) KineMonSuivi.slot();
      if (window.showToast) showToast("Demande envoyée à ton kiné");
    }, function () { demande("Connexion impossible pour l'instant. Vérifie Internet, puis réessaie.", d); });
  }

  /* ════════ 3. Côté kiné ════════ */
  var waitAuth = null;
  function kine() {
    set(KEY, "kine");
    if (window.fbUser && fbUser.isAdmin) { close(); if (window.KineCabinet) KineCabinet.open(); return; }
    var other = window.fbUser && !window.fbUser.isAdmin;
    show(back("KineRole.choose()") +
      "<div class='krl-hero kine'><i></i><u></u><img src='assets/lumiere/yass-salut.webp' alt=''></div>" +
      "<div><h1 class='kf-h1 kcb-h1'>Espace kiné</h1><p class='kf-sub krl-sub'>" + (other ? "Ce compte Google n'est pas un compte kiné. Déconnecte-toi, puis connecte-toi avec ton compte kiné." : "Connecte-toi avec ton compte Google de kiné pour retrouver tes patients.") + "</p></div>",
      (other ? "<button class='seq-btn-main' onclick='fbSignOut()'>Me déconnecter</button>" : "<button class='seq-btn-main' onclick='signInWithGoogle()'>Se connecter avec Google</button>") +
      "<button class='seq-btn-secondary' onclick='KineRole.patient()'>Je suis patient, en fait</button>");
  }
  window.addEventListener("kf-auth", function () {
    var el = $("kf-role");
    if (role() === "kine" && window.fbUser && fbUser.isAdmin) { if (el && el.classList.contains("open")) close(); if (waitAuth) { clearTimeout(waitAuth); waitAuth = null; } var ks = $("kcb-sheet"); if (window.KineCabinet && !(ks && ks.classList.contains("open"))) KineCabinet.open(); return; }
    if (el && el.classList.contains("open") && role() === "kine") kine();
  });
  // Passer d'un rôle à l'autre (réglages)
  function asPatient() { set(KEY, "patient"); if (window.KineCabinet) KineCabinet.close(); close(); if (typeof showPage === "function") showPage("home"); }

  function init() {
    var r = role();
    if (!r) { if (isNew()) choose(); else set(KEY, "patient"); return; }
    if (r === "kine") {
      if (window.fbUser && fbUser.isAdmin) { if (window.KineCabinet) KineCabinet.open(); return; }
      // la connexion Google se rétablit en général en une seconde ou deux
      waitAuth = setTimeout(function () { waitAuth = null; if (!(window.fbUser && fbUser.isAdmin)) kine(); }, 2500);
    }
  }
  document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 400); });

  return { choose: choose, pick: pick, patient: patient, seul: seul, code: code, demande: demande, send: send, kine: kine, close: close, asPatient: asPatient, role: role, isNew: isNew };
})();
