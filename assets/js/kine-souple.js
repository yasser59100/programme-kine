/* ═══════════ KinéForce — souplesse ═══════════
   Animation de sortie des fenêtres (elles repartent vers la droite au lieu de disparaître d'un coup)
   et petite vibration sur les actions principales (sur les téléphones qui le permettent). */
(function () {
  "use strict";
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!calm) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var el = m.target;
        if (!el.classList || !el.classList.contains("kf-sheet")) return;
        var was = (m.oldValue || "").split(/\s+/).indexOf("open") >= 0, now = el.classList.contains("open");
        if (!was && now) {
          el.classList.add("kf-entering");
          clearTimeout(el.__kfE); el.__kfE = setTimeout(function () { el.classList.remove("kf-entering"); }, 420);
        }
        if (was && !now && !el.classList.contains("kf-closing") && !el.__kfSwiped) {
          el.classList.add("kf-closing");
          setTimeout(function () { el.classList.remove("kf-closing"); }, 280);
        } else if (now && el.classList.contains("kf-closing")) el.classList.remove("kf-closing");
      });
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  }
  // Changement de page : les blocs n'arrivent en cascade qu'à l'ouverture de la page, pas à chaque mise à jour
  function wrapShowPage() {
    if (typeof window.showPage !== "function" || window.showPage.__kfs) return;
    var base = window.showPage;
    window.showPage = function (id) {
      var r = base.apply(this, arguments);
      var pg = document.getElementById("page-" + id);
      if (pg && !calm) { pg.classList.remove("kf-enter"); void pg.offsetWidth; pg.classList.add("kf-enter"); clearTimeout(pg.__kfE); pg.__kfE = setTimeout(function () { pg.classList.remove("kf-enter"); }, 260); }
      return r;
    };
    window.showPage.__kfs = true;
  }
  setTimeout(wrapShowPage, 0); window.addEventListener("load", function () { setTimeout(wrapShowPage, 50); });
  // Vibration légère (Android) sur les gestes qui comptent
  var STRONG = ".lx-cta, .seq-btn-main, .bnav-btn, .ki-vf-b button, .kr-pick button, .kf-chips button, .kf-scale button, .ki-n, .ki-more, .cele-go";
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(STRONG);
    if (b && navigator.vibrate) { try { navigator.vibrate(b.matches(".seq-btn-main, .lx-cta, .cele-go") ? 12 : 6); } catch (err) {} }
  }, true);
})();
