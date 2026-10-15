/* ═══════════ KinéForce — gestes et robustesse ═══════════
   1. Glisser vers la droite ferme la fenêtre ouverte (fiche, aperçu, bibliothèque…), comme le bouton retour.
   2. Si une fenêtre fermée a laissé la page bloquée (défilement figé), on la débloque.
   3. Après un long moment en veille, l'appli se recharge toute seule (hors séance en cours). */
(function () {
  "use strict";
  var SHEETS = ".kf-sheet.open, #kg-sheet.open, #kx-pop.open";
  var RUNNING = "#seq-overlay.open, #kr-run.open, #rep-guide.open, #kf-cele.open, #kf-routine.open";
  var SLEEP_MS = 20 * 60 * 1000;

  function topSheet() {
    var list = document.querySelectorAll(SHEETS), best = null, bz = -1;
    for (var i = 0; i < list.length; i++) {
      var el = list[i], z = parseInt(getComputedStyle(el).zIndex, 10) || 0;
      if (z >= bz) { bz = z; best = el; }           // à égalité, le dernier dans la page est au-dessus
    }
    return best;
  }
  function running() { return !!document.querySelector(RUNNING); }

  function closeSheet(el) {
    if (!el) return false;
    var back = el.querySelector(".kf-back");
    if (back) back.click();
    else if (el.id === "kx-pop" && window.KineLexique) KineLexique.closePop();
    else el.classList.remove("open");
    setTimeout(unlock, 350);
    return true;
  }
  // Débloque la page si plus rien n'est ouvert
  function unlock() {
    if (!document.querySelector(SHEETS) && !running()) {
      if (document.body.style.overflow === "hidden") document.body.style.overflow = "";
      document.documentElement.classList.remove("kf-lock");
    }
  }
  // Pendant qu'une fenêtre est ouverte, la page derrière ne défile plus (évite l'effet « la page glisse sur elle-même »)
  function syncLock() { document.documentElement.classList.toggle("kf-lock", !!document.querySelector(SHEETS) || running()); }

  /* ── Glisser vers la droite ── */
  var t0 = null;
  function inHScroll(node) {
    for (var n = node; n && n !== document.body; n = n.parentNode) {
      if (n.nodeType !== 1) continue;
      var cs = getComputedStyle(n);
      if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 4) return true;
      if (n.tagName === "INPUT" || n.tagName === "TEXTAREA" || n.tagName === "CANVAS") return true;
    }
    return false;
  }
  document.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { t0 = null; return; }
    var p = e.touches[0];
    t0 = { x: p.clientX, y: p.clientY, t: Date.now(), skip: inHScroll(e.target) };
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    var s = t0; t0 = null;
    setTimeout(function () { unlock(); syncLock(); }, 400);
    if (!s || s.skip) return;
    var p = e.changedTouches[0], dx = p.clientX - s.x, dy = Math.abs(p.clientY - s.y);
    if (dx > 90 && dy < 50 && Date.now() - s.t < 700 && !running()) closeSheet(topSheet());
  }, { passive: true });

  new MutationObserver(function () { syncLock(); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

  /* ── Rechargement après une longue veille ── */
  var hiddenAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > SLEEP_MS && !running()) { try { location.reload(); } catch (e) {} }
    hiddenAt = 0;
    unlock(); syncLock();
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) { unlock(); syncLock(); } });

  window.KineGestes = { close: function () { return closeSheet(topSheet()); }, unlock: unlock };
})();
