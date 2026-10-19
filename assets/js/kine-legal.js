/* Santé, confidentialité et mentions légales : une page claire, accessible depuis les réglages et l'accueil. */
(function () {
  "use strict";
  var MAIL = "yasser59100@gmail.com", MAJ = "19 octobre 2026";
  function $(id) { return document.getElementById(id); }
  function sec(id, t, html) { return "<section class='klg-sec' id='klg-" + id + "'><h3>" + t + "</h3>" + html + "</section>"; }
  function p(t) { return "<p>" + t + "</p>"; }
  function ul(a) { return "<ul>" + a.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; }

  var SANTE =
    p("KinéForce est un programme d'exercices et d'informations. <b>Il ne remplace pas une consultation</b>, un diagnostic ni un traitement par un médecin ou un kinésithérapeute.") +
    p("Le programme est général : il n'est pas adapté à ta situation personnelle. Demande l'avis d'un professionnel de santé avant de commencer si tu as une maladie du cœur ou des poumons, une opération récente, une fracture, une grossesse, un traitement en cours, ou si tu as un doute.") +
    p("<b>Arrête l'exercice</b> en cas de douleur vive ou qui augmente, de malaise, de vertige, d'essoufflement inhabituel, de douleur dans la poitrine ou de palpitations. En cas d'urgence, appelle le <b>112</b> (ou le 15 en France).") +
    p("Le bilan à la caméra et les mesures affichées (angles, distances, temps) sont <b>approximatifs et donnés à titre indicatif</b>. Ce ne sont pas des examens médicaux et ils ne permettent pas de poser un diagnostic.") +
    p("Yass est un coach virtuel : ses conseils sont automatiques et ne viennent pas d'un professionnel qui t'a examiné.");

  var VIE =
    p("<b>En bref :</b> pas de publicité, aucune donnée vendue, et la caméra n'envoie jamais d'image. Sans compte, tout ce que tu fais reste sur ton téléphone.") +
    "<h4>Qui est responsable de tes données ?</h4>" +
    p("LADRAA KINE SRL (voir les mentions légales). Pour toute question ou demande : <a href='mailto:" + MAIL + "'>" + MAIL + "</a>.") +
    "<h4>Ce qui reste sur ton téléphone</h4>" +
    p("Tes séances, ta progression, la douleur que tu notes, ton prénom si tu le donnes et tes réglages sont enregistrés uniquement dans ton téléphone. Ils ne sont envoyés nulle part. Tu peux tout effacer en bas de cette page.") +
    "<h4>La caméra</h4>" +
    p("L'analyse du mouvement se fait directement dans ton téléphone. Aucune image ni vidéo n'est enregistrée ni envoyée, ni à nous, ni à personne d'autre. Les résultats du bilan restent dans ton téléphone.") +
    "<h4>Ce qui est envoyé, et pourquoi</h4>" +
    ul([
      "<b>Statistiques anonymes d'utilisation</b>, pour améliorer l'appli : écrans ouverts, séance commencée ou terminée, exercice passé, bouton « J'ai mal » touché (avec le nom de l'exercice), type de téléphone et version de l'appli. Tu es représenté par un numéro tiré au hasard et renouvelé chaque mois, sans nom ni compte. Conservées 13 mois au plus. <b>Tu peux les couper</b> dans les réglages.",
      "<b>Rapports d'erreurs</b>, pour corriger les bugs : message d'erreur technique, modèle de navigateur, taille d'écran, version de l'appli, écran concerné. Si tu utilises « Signaler un souci », le texte que tu écris est aussi envoyé (évite d'y mettre des informations sur ta santé). Conservés 12 mois au plus.",
      "<b>Compteur de séances terminées</b> : un simple total, sans aucune information sur toi.",
      "<b>Notifications</b>, si tu les actives : l'adresse technique d'envoi fournie par ton navigateur et l'heure choisie. Supprimées quand tu les désactives.",
      "<b>Communauté</b>, seulement si tu te connectes avec Google : ton nom, ta photo de profil et un identifiant technique. Les messages que tu publies sont visibles par les autres utilisateurs. Tu peux supprimer tes messages à tout moment ; pour supprimer ton compte, écris-nous."
    ]) +
    "<h4>Bases légales</h4>" +
    p("Les statistiques, les rapports d'erreurs et le compteur reposent sur notre intérêt légitime à faire fonctionner et améliorer l'appli ; la Communauté et les notifications, sur ton choix de les utiliser.") +
    "<h4>Prestataires</h4>" +
    p("L'appli est hébergée par GitHub (GitHub, Inc., États-Unis). Les données envoyées sont stockées chez Google Firebase (Google Ireland Ltd). La bibliothèque d'affichage 3D est fournie par Cloudflare (cdnjs). Ces prestataires peuvent traiter des données techniques (comme l'adresse IP) hors de l'Union européenne, dans le cadre des garanties prévues par le RGPD (clauses contractuelles types, cadre de protection des données UE–États-Unis).") +
    "<h4>Tes droits</h4>" +
    p("Tu peux demander l'accès à tes données, leur correction, leur suppression, leur portabilité, ou t'opposer à leur utilisation, en écrivant à <a href='mailto:" + MAIL + "'>" + MAIL + "</a>. Comme les statistiques et les rapports sont anonymes, nous ne pouvons généralement pas retrouver ceux qui te concernent. Tu peux aussi saisir l'Autorité de protection des données (Belgique, autoriteprotectiondonnees.be) ou la CNIL (France, cnil.fr).") +
    "<h4>Stockage sur ton téléphone</h4>" +
    p("L'appli utilise le stockage de ton navigateur uniquement pour fonctionner (tes séances, tes réglages, l'appli hors connexion). Aucun cookie publicitaire ni traceur d'un autre site.");

  var MENTIONS =
    ul([
      "<b>Éditeur :</b> LADRAA KINE SRL, société à responsabilité limitée de droit belge, siège social à Watermael-Boitsfort (Belgique), n° d'entreprise BCE 1035357907.",
      "<b>Responsable de la publication :</b> Yasser Ladraa, gérant.",
      "<b>Contact :</b> <a href='mailto:" + MAIL + "'>" + MAIL + "</a>",
      "<b>Contenu :</b> programme établi par Yasser Ladraa, kinésithérapeute.",
      "<b>Hébergement :</b> GitHub Pages, GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.",
      "<b>Données :</b> Google Firebase, Google Ireland Ltd, Gordon House, Barrow Street, Dublin 4, Irlande."
    ]) +
    p("Les textes, programmes, illustrations, voix et le personnage de Yass sont la propriété de l'éditeur. Toute reproduction sans autorisation est interdite.");

  function sheet() {
    var el = $("kf-legal"); if (el) return el;
    el = document.createElement("div"); el.id = "kf-legal"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Santé, confidentialité et mentions légales");
    document.body.appendChild(el); return el;
  }
  function open(where) {
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body klg'><button class='kf-back' onclick='KineLegal.close()' aria-label='Retour'>←</button>" +
      "<h2 class='kfb-h'>Santé et confidentialité</h2><p class='kfb-p'>Mis à jour le " + MAJ + ".</p>" +
      "<nav class='klg-nav'><button onclick=\"KineLegal.go('sante')\">Santé</button><button onclick=\"KineLegal.go('vie')\">Confidentialité</button><button onclick=\"KineLegal.go('mentions')\">Mentions légales</button></nav>" +
      sec("sante", "Avant de commencer : ta santé", SANTE) +
      sec("vie", "Confidentialité", VIE) +
      sec("mentions", "Mentions légales", MENTIONS) +
      "<section class='klg-sec'><h3>Effacer mes données</h3>" + p("Efface tes séances, ta progression, tes réglages et le bilan enregistrés sur ce téléphone. Tes messages de la Communauté ne sont pas touchés.") +
      "<button class='klg-del' id='klg-del'>Effacer les données de ce téléphone</button></section></div>";
    el.classList.add("open");
    $("klg-del").onclick = wipe;
    if (where) setTimeout(function () { go(where); }, 60);
  }
  function go(id) { var s = $("klg-" + id), b = document.querySelector("#kf-legal .kf-sheet-body"); if (s && b) b.scrollTo({ top: s.offsetTop - 12, behavior: "smooth" }); }
  function close() { var el = $("kf-legal"); if (el) el.classList.remove("open"); }
  function wipe() {
    var b = $("klg-del");
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Touche encore pour confirmer : c'est définitif"; b.classList.add("sure"); return; }
    // tout sauf la connexion Google
    try { Object.keys(localStorage).forEach(function (k) { if (!/^firebase/i.test(k)) localStorage.removeItem(k); }); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try { if (window.indexedDB && indexedDB.databases) indexedDB.databases().then(function (L) { L.forEach(function (d) { if (d.name && !/firebase/i.test(d.name)) indexedDB.deleteDatabase(d.name); }); }); } catch (e) {}
    b.textContent = "C'est effacé. L'appli redémarre…"; b.disabled = true;
    setTimeout(function () { location.reload(); }, 1200);
  }

  window.KineLegal = { open: open, close: close, go: go };
})();
