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
  // Mode kiné : l'appli patient disparaît derrière l'espace kiné, jusqu'à la déconnexion
  function mode() { document.body.classList.toggle("kf-kine", role() === "kine"); }
  // L'espace kiné n'est chargé qu'à l'ouverture
  function cab() { return (window.kfNeed ? kfNeed("suivi") : Promise.resolve()).then(function () { var ks = $("kcb-sheet"); if (window.KineCabinet && role() === "kine" && !(ks && ks.classList.contains("open"))) KineCabinet.open(); }); }
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
    set(KEY, null); mode();
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
    set(KEY, "patient"); mode();
    var c0 = cabState(); if (c0 && c0.pid) { home(); return; }   // déjà relié à son kiné : directement dans l'appli
    show(back("KineRole.choose()") +
      "<div class='krl-hero table'><i></i><em></em><img src='assets/lumiere/yass-salut.webp' alt=''><span>Ta rééducation commence ici</span></div>" +
      "<h1 class='kf-h1 kcb-h1'>Ton kiné utilise KinéForce ?</h1>" +
      "<button class='krl-row dark' onclick='KineRole.code()'><span class='krl-ic'>ABC</span><span class='krl-t'><b>J'ai un code de mon kiné</b><span>6 caractères, donnés au cabinet</span></span>" + NEXT + "</button>" +
      "<button class='krl-row' onclick='KineRole.demande()'><span class='krl-ic soft'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 4h16v12H8l-4 4z'/><path d='M8 9h8M8 12h5'/></svg></span><span class='krl-t'><b>Demander un accès</b><span>Pas de code ? Ton kiné reçoit ta demande</span></span>" + NEXT + "</button>" +
      "<button class='krl-row dash' onclick='KineRole.seul()'><span class='krl-ic grey'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 12h3l3-7 4 14 3-7h5'/></svg></span><span class='krl-t'><b>Je m'entraîne seul</b><span>Programme général : prévention et entretien</span></span>" + NEXT + "</button>" +
      "<p class='kcb-hint kcb-center'>Tu pourras relier ton kiné plus tard, avec le bouton en haut à droite.</p>");
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
      meButton();
    }, function () { demande("Connexion impossible pour l'instant. Vérifie Internet, puis réessaie.", d); });
  }

  /* ════════ 3. Côté kiné ════════ */
  var waitAuth = null;
  function kine() {
    set(KEY, "kine"); mode();
    if (window.fbUser && fbUser.isAdmin) { close(); cab(); return; }
    var other = window.fbUser && !window.fbUser.isAdmin;
    show(back("KineRole.choose()") +
      "<div class='krl-hero kine'><i></i><u></u><img src='assets/lumiere/yass-salut.webp' alt=''></div>" +
      "<div><h1 class='kf-h1 kcb-h1'>Espace kiné</h1><p class='kf-sub krl-sub'>" + (other ? "Ce compte Google n'est pas un compte kiné. Déconnecte-toi, puis connecte-toi avec ton compte kiné." : "Connecte-toi avec ton compte Google de kiné pour retrouver tes patients.") + "</p></div>",
      (other ? "<button class='seq-btn-main' onclick='fbSignOut()'>Me déconnecter</button>" : "<button class='seq-btn-main' onclick='signInWithGoogle()'>Se connecter avec Google</button>") +
      "<button class='seq-btn-secondary' onclick='KineRole.patient()'>Je suis patient, en fait</button>");
  }
  window.addEventListener("kf-auth", function () {
    var el = $("kf-role");
    if (role() === "kine" && window.fbUser && fbUser.isAdmin) { if (el && el.classList.contains("open")) close(); if (waitAuth) { clearTimeout(waitAuth); waitAuth = null; } cab(); return; }
    if (el && el.classList.contains("open") && role() === "kine") kine();
    // déconnecté alors qu'on était dans l'espace kiné : retour à la connexion, pas à l'appli patient
    else if (role() === "kine" && !(window.fbUser && fbUser.isAdmin) && !waitAuth) { if (window.KineCabinet) KineCabinet.close(true); kine(); }
  });
  // Passer d'un rôle à l'autre (réglages)
  function asPatient() { set(KEY, "patient"); mode(); if (window.KineCabinet) KineCabinet.close(true); close(); if (typeof showPage === "function") showPage("home"); }
  // Se déconnecter : on revient au portail « Kiné ou patient ». Le suivi du patient reste relié à ce téléphone.
  function logout() {
    var k = role() === "kine";
    if (!confirm(k ? "Se déconnecter de l'espace kiné ? Tu reviendras à l'écran « Kiné ou patient »." : "Changer de profil ? Tu reviendras à l'écran « Kiné ou patient ». Ton suivi reste sur ce téléphone.")) return;
    hubClose();
    if (k) { if (window.KineCabinet) KineCabinet.close(true); if (window.fbSignOut && window.fbUser) try { fbSignOut(); } catch (e) {} }
    choose();
  }

  /* ════════ Mon espace : le bouton toujours visible en haut à droite ════════
     Mode patient ou kiné, lien avec son kiné (code, demande, suivi), compte de la Communauté, réglages. */
  var ME = "<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><circle cx='12' cy='8' r='4'/><path d='M4 21a8 8 0 0 1 16 0'/></svg>";
  function cabState() { try { return JSON.parse(get("kf-cab") || "null"); } catch (e) { return null; } }
  function meButton() {
    var b = $("kf-me");
    if (!b) { b = document.createElement("button"); b.id = "kf-me"; b.className = "kf-me"; b.setAttribute("aria-label", "Mon espace"); b.onclick = function () { hub(); }; document.body.appendChild(b); }
    var c = cabState();
    b.innerHTML = ME + (c && c.pending ? "<i class='wait'></i>" : c && c.pid ? "<i class='ok'></i>" : "");
  }
  function hubSheet() {
    var el = $("kf-hub");
    if (!el) { el = document.createElement("div"); el.id = "kf-hub"; el.className = "kf-sheet kcb krl"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Mon espace"); document.body.appendChild(el); }
    return el;
  }
  function hubClose() { var el = $("kf-hub"); if (el) el.classList.remove("open"); meButton(); }
  function hub() {
    var r = role() || "patient", c = cabState(), u = window.fbUser, admin = !!(u && u.isAdmin);
    var kine = "";
    if (r !== "kine") {
      if (c && c.pid) {
        var d = c.d || {}, P = window.KineParcours && KineParcours.get(d.parcours), E = d.etape || 0;
        kine = "<button class='krl-row dark' onclick='KineRole.hubClose();KineMonSuivi.open()'><span class='krl-ic'>" + (E + 1) + "</span><span class='krl-t'><b>Mon suivi au cabinet</b><span>" + esc(P ? "Étape " + (E + 1) + " sur " + P.etapes.length + " : " + P.etapes[Math.min(E, P.etapes.length - 1)].nom : "Relié à ton kiné") + "</span></span>" + NEXT + "</button>";
      } else if (c && c.pending) {
        kine = "<div class='kms-wait'><div class='kms-wh'><i><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/></svg></i><div><b>Demande envoyée</b><span>En attente de ton kiné</span></div></div><button class='kcb-link' onclick='KineRole.hubClose();KineMonSuivi.cancelRequest()'>Annuler la demande</button></div>";
      } else {
        kine = "<button class='krl-row dark' onclick='KineRole.hubClose();KineMonSuivi.join()'><span class='krl-ic'>ABC</span><span class='krl-t'><b>J'ai un code de mon kiné</b><span>6 caractères, donnés au cabinet</span></span>" + NEXT + "</button>" +
          "<button class='krl-row' onclick='KineRole.hubClose();KineRole.demande()'><span class='krl-ic soft'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 4h16v12H8l-4 4z'/><path d='M8 9h8M8 12h5'/></svg></span><span class='krl-t'><b>Demander un accès</b><span>Pas de code ? Ton kiné reçoit ta demande</span></span>" + NEXT + "</button>";
      }
      // Sauvegarde du suivi : identifiant et mot de passe, ou Google ; et sauvegarde des séances faites à la maison
      var g = window.fbPat && fbPat.google ? fbPat.google() : null, lg = window.fbPat && fbPat.login ? fbPat.login() : null;
      if (c && c.pid) {
        kine += (lg || g) ? "<div class='kcb-ok'>Suivi sauvegardé" + (lg ? " : identifiant " + esc(lg) : " avec " + esc(g)) + "</div>"
          : "<button class='krl-row' onclick='KineRole.loginForm(\"create\")'><span class='krl-ic soft'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><rect x='5' y='11' width='14' height='10' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/></svg></span><span class='krl-t'><b>Sauvegarder mon suivi</b><span>Un identifiant et un mot de passe, pour le retrouver si tu changes de téléphone</span></span>" + NEXT + "</button>";
        var on = window.KineMonSuivi && KineMonSuivi.syncOn();
        kine += "<div class='su-card khb-acc'><div><b>Sauvegarder mes séances</b><span>" + (on ? "Tes séances, douleurs et ressenti sont enregistrés dans ton suivi : ton kiné voit le détail." : "Tes séances restent seulement sur ce téléphone. Ton kiné ne voit qu'un résumé de la semaine.") + "</span></div>" +
          "<button class='kcb-mode' onclick='KineMonSuivi.setConsent(" + (on ? 0 : 1) + ");KineRole.hub()'>" + (on ? "Désactiver" : "Activer") + "</button></div>";
      } else if (!(c && c.pending)) kine += "<button class='krl-row dash' onclick='KineRole.loginForm(\"restore\")'><span class='krl-ic grey'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 12a9 9 0 1 0 3-6.7L3 8'/><path d='M3 3v5h5'/></svg></span><span class='krl-t'><b>J'avais déjà un suivi</b><span>Le retrouver avec mon identifiant</span></span>" + NEXT + "</button>";
      kine = "<div class='khb-h'>Mon kiné</div>" + kine + "<p class='kcb-hint' id='khb-msg'></p>";
    } else {
      kine = "<div class='khb-h'>Espace kiné</div><button class='krl-row dark' onclick='KineRole.hubClose();KineRole.kine()'><span class='krl-ic'>" + ME + "</span><span class='krl-t'><b>Mes patients</b><span>" + (admin ? "Connecté avec le compte kiné" : "Connexion avec ton compte Google de kiné") + "</span></span>" + NEXT + "</button>";
    }
    var acc = r === "kine" ? "<div class='khb-h'>Compte</div><div class='su-card khb-acc'><div><b>" + esc(u && u.name || "Pas connecté") + "</b><span>" + (admin ? "Compte kiné" : "Connecte-toi avec ton compte Google de kiné") + "</span></div></div>" : "";
    var more = "<div class='v2-other'>" +
      (r === "kine" && window.KineCabinet ? "<button class='v2-row' onclick='KineRole.hubClose();KineCabinet.tee()'><b>Mon nom sur le t-shirt de Yass</b><span>›</span></button>" : "") +
      (window.KineLumiere ? "<button class='v2-row' onclick='KineRole.hubClose();KineLumiere.settings()'><b>Réglages de l'appli</b><span>›</span></button>" : "") +
      "<button class='v2-row khb-out' onclick='KineRole.logout()'><b>" + (r === "kine" ? "Se déconnecter" : "Changer de profil (kiné ou patient)") + "</b><span>›</span></button></div>";
    var el = hubSheet();
    el.innerHTML = "<div class='kf-sheet-body'><div class='kcb-top'><button class='kf-back' onclick='KineRole.hubClose()' aria-label='Fermer'>" + BACK + "</button><span></span><i></i></div>" +
      "<div><h1 class='kf-h1 kcb-h1'>" + (r === "kine" ? "Réglages" : "Mon espace") + "</h1></div>" + (r === "kine" ? "" : kine) + acc + more + "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function hubSay(t) { var m = $("khb-msg"); if (m) m.textContent = t; }
  /* Identifiant et mot de passe : créer (patient relié) ou retrouver son suivi (nouveau téléphone) */
  function loginForm(mode, err, keep) {
    var create = mode === "create", el = hubSheet(); keep = keep || {};
    el.innerHTML = "<div class='kf-sheet-body'><div class='kcb-top'><button class='kf-back' onclick='KineRole.hub()' aria-label='Retour'>" + BACK + "</button><span></span><i></i></div>" +
      "<div><h1 class='kf-h1 kcb-h1'>" + (create ? "Sauvegarder mon suivi" : "Retrouver mon suivi") + "</h1><p class='kf-sub krl-sub'>" + (create ? "Choisis un identifiant et un mot de passe. Note-les : ils te permettront de tout retrouver sur un autre téléphone." : "Tape l'identifiant et le mot de passe que tu avais choisis.") + "</p></div>" +
      "<div class='su-card'><label class='kcb-field'><span class='kcb-lab'>Identifiant</span><input class='kcb-in' id='kl-id' autocapitalize='none' autocomplete='username' spellcheck='false' maxlength='30' placeholder='par exemple : samir.b' value='" + esc(keep.id || "") + "'></label>" +
      "<label class='kcb-field'><span class='kcb-lab'>Mot de passe" + (create ? " (6 caractères au moins)" : "") + "</span><input class='kcb-in' id='kl-pw' type='password' autocomplete='" + (create ? "new-password" : "current-password") + "' maxlength='60'></label></div>" +
      (err ? "<div class='kcb-alert'><b>" + esc(err) + "</b></div>" : "") +
      (create ? "<p class='kcb-hint'>Mot de passe oublié ? Ton kiné peut toujours te redonner un code.</p>" : "") +
      "<button class='seq-btn-main' id='kl-go' onclick='KineRole.loginGo(\"" + mode + "\")'>" + (create ? "Enregistrer" : "Retrouver mon suivi") + "</button>" +
      "<button class='v2-row' onclick='KineRole." + (create ? "saveGoogle" : "restoreGoogle") + "()'><b>" + (create ? "Plutôt avec mon compte Google" : "Avec mon compte Google") + "</b><span>›</span></button><p class='kcb-hint' id='khb-msg'></p></div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function loginGo(mode) {
    var id = String($("kl-id").value || "").trim().toLowerCase(), pw = $("kl-pw").value || "", keep = { id: id };
    if (!/^[a-z0-9._-]{3,30}$/.test(id)) { loginForm(mode, "L'identifiant fait 3 à 30 caractères : lettres sans accent, chiffres, point, tiret.", keep); return; }
    if (pw.length < 6) { loginForm(mode, "Le mot de passe fait au moins 6 caractères.", keep); return; }
    if (!window.fbPat) { loginForm(mode, "Connexion impossible pour l'instant. Vérifie Internet, puis réessaie.", keep); return; }
    var b = $("kl-go"); if (b) { b.disabled = true; b.textContent = "Un instant…"; }
    if (mode === "create") {
      var c = cabState(); if (!c || !c.pid) { hub(); return; }
      fbPat.linkLogin(c.pid, id, pw).then(function () { hub(); if (window.showToast) showToast("Suivi sauvegardé"); }, function (e) {
        var code = e && e.code || "";
        loginForm(mode, /already-in-use|email-already/.test(code) ? "Cet identifiant est déjà pris. Choisis-en un autre." : /weak-password/.test(code) ? "Mot de passe trop simple : 6 caractères au moins." : /provider-already-linked/.test(code) ? "Ton suivi est déjà sauvegardé avec un identifiant." : "La sauvegarde n'a pas marché. Vérifie Internet et réessaie.", keep);
      });
    } else {
      fbPat.restoreLogin(id, pw).then(function (pid) {
        if (!pid) { loginForm(mode, "Aucun suivi n'est rattaché à cet identifiant. Demande un code à ton kiné.", keep); return; }
        found(pid);
      }, function (e) { loginForm(mode, /too-many-requests/.test(e && e.code || "") ? "Trop d'essais. Patiente quelques minutes." : "Identifiant ou mot de passe incorrect.", keep); });
    }
  }
  // Suivi retrouvé : on relie ce téléphone, on récupère le journal des séances s'il était sauvegardé
  function found(pid) {
    set(KEY, "patient"); set("kf-cab", JSON.stringify({ pid: pid }));
    try { localStorage.removeItem("kf-cab-push"); localStorage.removeItem("kf-cab-jh"); } catch (e) {}
    var M = window.KineMonSuivi; if (!M) { hubClose(); return; }
    M.refresh(true).then(function () { return M.journalMerge(pid); }).then(function () {
      hubClose(); if (window.showToast) showToast("Suivi retrouvé");
      M.open();
    });
  }
  function saveGoogle() {
    var c = cabState(); if (!c || !c.pid || !window.fbPat) return;
    hubSay("Connexion à Google…");
    fbPat.linkGoogle(c.pid).then(function (pid) {
      if (pid && pid !== c.pid) { set("kf-cab", JSON.stringify({ pid: pid })); if (window.KineMonSuivi) KineMonSuivi.refresh(true); }
      hub(); if (window.showToast) showToast("Suivi sauvegardé avec ton compte Google");
    }, function (e) { hubSay(e && /popup/.test(e.code || "") ? "La fenêtre Google a été fermée. Réessaie." : "La sauvegarde n'a pas marché. Vérifie Internet et réessaie."); });
  }
  function restoreGoogle() {
    if (!window.fbPat) return;
    hubSay("Connexion à Google…");
    fbPat.restoreGoogle().then(function (pid) {
      if (!pid) { hubSay("Aucun suivi n'est rattaché à ce compte Google. Demande un code à ton kiné."); return; }
      found(pid);
    }, function (e) { hubSay(e && /popup/.test(e.code || "") ? "La fenêtre Google a été fermée. Réessaie." : "Connexion impossible. Vérifie Internet et réessaie."); });
  }
  function hubMode(m) {
    if (m === "kine") { hubClose(); kine(); return; }
    asPatient(); hub();
  }

  function init() {
    meButton(); mode();
    var r = role();
    if (!r) { if (isNew()) choose(); else set(KEY, "patient"); return; }
    var c = cabState(); if (r !== "kine" && c && (c.pid || c.pending) && window.kfNeed) setTimeout(function () { kfNeed("suivi").then(function () { if (window.KineMonSuivi) KineMonSuivi.slot(); }); }, 1200);
    if (r === "kine") {
      if (window.fbUser && fbUser.isAdmin) { cab(); return; }
      if (window.kfNeed) kfNeed("suivi");   // pendant que la connexion se rétablit
      // la connexion Google se rétablit en général en une seconde ou deux
      waitAuth = setTimeout(function () { waitAuth = null; if (!(window.fbUser && fbUser.isAdmin)) kine(); }, 2500);
    }
  }
  document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 400); });

  return { logout: logout, loginForm: loginForm, loginGo: loginGo, saveGoogle: saveGoogle, restoreGoogle: restoreGoogle, hub: hub, hubClose: hubClose, hubMode: hubMode, meButton: meButton, choose: choose, pick: pick, patient: patient, seul: seul, code: code, demande: demande, send: send, kine: kine, close: close, asPatient: asPatient, role: role, isNew: isNew };
})();
