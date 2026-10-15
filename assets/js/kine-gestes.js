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
  // La fenêtre suit le doigt ; relâchée assez loin, elle part vers la droite, sinon elle revient
  document.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { t0 = null; return; }
    var p = e.touches[0];
    t0 = { x: p.clientX, y: p.clientY, t: Date.now(), skip: inHScroll(e.target) || running(), el: null, drag: false };
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    var s = t0; if (!s || s.skip) return;
    var p = e.touches[0], dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (!s.drag) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { s.skip = true; return; }   // geste vertical : on laisse défiler
      if (dx > 14 && dx > Math.abs(dy) * 1.4) { s.el = topSheet(); s.drag = !!s.el; if (!s.drag) { s.skip = true; return; } s.el.style.transition = "none"; }
      else return;
    }
    var x = Math.max(0, dx);
    s.el.style.transform = "translateX(" + x + "px)";
    s.el.style.boxShadow = "-12px 0 40px rgba(0,0,0," + (0.35 * (1 - Math.min(1, x / innerWidth))).toFixed(2) + ")";
  }, { passive: true });
  function settle(el, close) {
    el.style.transition = "transform .24s cubic-bezier(.32,.72,0,1)";
    el.style.transform = close ? "translateX(100%)" : "translateX(0)";
    setTimeout(function () {
      if (close) { el.__kfSwiped = true; closeSheet(el); }
      el.style.transition = ""; el.style.transform = ""; el.style.boxShadow = "";
      setTimeout(function () { el.__kfSwiped = false; }, 50);
    }, 240);
  }
  document.addEventListener("touchend", function (e) {
    var s = t0; t0 = null;
    setTimeout(function () { unlock(); syncLock(); }, 400);
    if (!s || !s.drag) return;
    var p = e.changedTouches[0], dx = p.clientX - s.x, v = dx / Math.max(1, Date.now() - s.t);
    settle(s.el, dx > innerWidth * 0.33 || (dx > 60 && v > 0.5));
  }, { passive: true });
  document.addEventListener("touchcancel", function () { var s = t0; t0 = null; if (s && s.drag) settle(s.el, false); }, { passive: true });

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
