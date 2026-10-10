/* ═══════════ KinéForce — écran toujours allumé pendant les exercices ═══════════
   Tant qu'une séance, un exercice guidé, un échauffement, des étirements ou « Bouger 2 minutes »
   sont à l'écran, l'appli demande au téléphone de ne pas se mettre en veille (Screen Wake Lock).
   Le verrou est rendu dès qu'on quitte l'exercice, et repris si on revient dans l'appli. */
(function () {
  "use strict";
  if (!("wakeLock" in navigator)) return;   // anciens téléphones : rien à faire, l'appli marche comme avant
  var lock = null, asking = false;
  function active() {
    return !!document.querySelector("#seq-overlay.open, #rep-guide.open, #kf-routine.open, .kf-masc.big.open, #kf-tuto");
  }
  function take() {
    if (lock || asking || document.visibilityState !== "visible") return;
    asking = true;
    navigator.wakeLock.request("screen").then(function (l) {
      lock = l; asking = false;
      l.addEventListener("release", function () { lock = null; });
      if (!active()) drop();
    }).catch(function () { asking = false; });
  }
  function drop() { if (lock) { try { lock.release(); } catch (e) {} lock = null; } }
  function check() { if (active()) take(); else drop(); }
  // Un exercice qui s'ouvre ou se ferme change une classe : on suit ces changements
  var t = null;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(check, 150); })
    .observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
  // Le téléphone rend le verrou quand l'appli passe en arrière-plan : on le reprend au retour
  document.addEventListener("visibilitychange", check);
  // Certains navigateurs ne l'accordent qu'après un appui : on retente à chaque appui
  document.addEventListener("click", check, true);
  window.KineEveil = { check: check, isOn: function () { return !!lock; } };
})();
