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
          var body = el.querySelector(".kf-sheet-body");
          if (body) requestAnimationFrame(function () { cascade(body, { delay: 140, step: 55, dist: 14, dur: 520 }); });
          clearTimeout(el.__kfE); el.__kfE = setTimeout(function () { el.classList.remove("kf-entering"); }, 420);
        }
        if (was && !now && !el.classList.contains("kf-closing") && !el.__kfSwiped) {
          el.classList.add("kf-closing");
          setTimeout(function () { el.classList.remove("kf-closing"); }, 280);
        } else if (now && el.classList.contains("kf-closing")) el.classList.remove("kf-closing");
      });
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  }
  /* ── Cascade : les blocs visibles arrivent l'un après l'autre, lentement et sans à-coups ──
     Animée par le navigateur (Web Animations, sur la carte graphique) et lancée une fois la page affichée,
     pour ne pas être interrompue par une mise à jour de l'écran. */
  var EASE = "cubic-bezier(.22, 1, .36, 1)";
  function blocks(root) {
    var list = Array.prototype.filter.call(root.children, function (el) { return el.offsetHeight > 0 && getComputedStyle(el).position !== "fixed"; });
    var guard = 0;
    while (list.length === 1 && list[0].children.length && guard++ < 4) {
      list = Array.prototype.filter.call(list[0].children, function (el) { return el.offsetHeight > 0 && getComputedStyle(el).position !== "fixed"; });
    }
    var vh = innerHeight;
    return list.filter(function (el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; }).slice(0, 12);
  }
  function cascade(root, opt) {
    if (calm || !root || !root.animate) return;
    opt = opt || {};
    var items = blocks(root), d0 = opt.delay || 0, step = opt.step || 70, dist = opt.dist || 18;
    items.forEach(function (el, i) {
      try {
        if (el.__kfAnim) el.__kfAnim.cancel();
        el.__kfAnim = el.animate([{ opacity: 0, transform: "translateY(" + dist + "px)" }, { opacity: 1, transform: "none" }],
          { duration: opt.dur || 560, delay: d0 + i * step, easing: EASE, fill: "backwards" });
      } catch (e) {}
    });
  }
  function wrapShowPage() {
    if (typeof window.showPage !== "function" || window.showPage.__kfs) return;
    var base = window.showPage;
    window.showPage = function (id) {
      var r = base.apply(this, arguments);
      var pg = document.getElementById("page-" + id);
      if (pg && !calm) requestAnimationFrame(function () { requestAnimationFrame(function () { cascade(pg); }); });
      return r;
    };
    window.showPage.__kfs = true;
  }
  setTimeout(wrapShowPage, 0); window.addEventListener("load", function () { setTimeout(wrapShowPage, 50); });
  // Premier affichage de l'appli
  window.addEventListener("load", function () { setTimeout(function () { var pg = document.querySelector(".page.active"); if (pg) cascade(pg, { delay: 80 }); }, 120); });
  window.KineSouple = { cascade: cascade };

  // Vibration légère (Android) sur les gestes qui comptent
  var STRONG = ".lx-cta, .seq-btn-main, .bnav-btn, .ki-vf-b button, .kr-pick button, .kf-chips button, .kf-scale button, .ki-n, .ki-more, .cele-go";
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(STRONG);
    if (b && navigator.vibrate) { try { navigator.vibrate(b.matches(".seq-btn-main, .lx-cta, .cele-go") ? 12 : 6); } catch (err) {} }
  }, true);
})();
