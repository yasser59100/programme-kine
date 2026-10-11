/* ═══════════ KinéForce — icônes dessinées à la place des caractères ═══════════
   Les boutons écrits avec des caractères (✓ Enregistrer, Passer →, ←, ✕, ＋ Créer, ⏸ Pause)
   reçoivent la même famille d'icônes au trait, quel que soit le module qui les a créés. */
(function () {
  "use strict";
  var P = {
    check: "<path d='M5 12.5l4.5 4.5L19 7.5'/>",
    x: "<path d='M6 6l12 12M18 6L6 18'/>",
    left: "<path d='M15 5l-7 7 7 7'/>",
    right: "<path d='M9 5l7 7-7 7'/>",
    arrow: "<path d='M5 12h14M13 6l6 6-6 6'/>",
    plus: "<path d='M12 5v14M5 12h14'/>",
    pause: "<path d='M8 5v14M16 5v14'/>"
  };
  function ico(n, cls) {
    return "<svg class='" + (cls || "h-ico") + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + P[n] + "</svg>";
  }
  function esc(t) { return t.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  var RULES = [
    [/^[✕×]$/, function () { return ico("x"); }, "Fermer"],
    [/^[✕×]\s*(Fermer)$/, function (m) { return ico("x") + esc(m[1]); }],
    [/^[←‹]$/, function () { return ico("left"); }, "Retour"],
    [/^[←‹]\s+(.+)$/, function (m) { return ico("left") + esc(m[1]); }],
    [/^›$/, function () { return ico("right", "h-chev"); }],
    [/^✓$/, function () { return ico("check"); }],
    [/^✓\s*(.+)$/, function (m) { return ico("check") + esc(m[1]); }],
    [/^(.+?)\s*→$/, function (m) { return esc(m[1]) + ico("arrow"); }],
    [/^[+＋]\s*(.+)$/, function (m) { return ico("plus") + esc(m[1]); }],
    [/^⏸\s*(.+)$/, function (m) { return ico("pause") + esc(m[1]); }]
  ];
  function fix(el) {
    if (el.children.length) return;                       // seulement du texte brut : on ne touche pas au balisage existant
    var t = (el.textContent || "").trim(); if (!t || t.length > 60) return;
    for (var i = 0; i < RULES.length; i++) {
      var m = t.match(RULES[i][0]); if (!m) continue;
      el.innerHTML = RULES[i][1](m);
      if (RULES[i][2] && !el.getAttribute("aria-label")) el.setAttribute("aria-label", RULES[i][2]);
      return;
    }
  }
  var SEL = "button, .kr-links span[aria-hidden='true'], .cue-more";
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches(SEL)) fix(root);
    var list = root.querySelectorAll ? root.querySelectorAll(SEL) : [];
    for (var i = 0; i < list.length; i++) fix(list[i]);
  }
  var pending = [], t = null;
  function flush() {
    t = null; var q = pending; pending = [];
    for (var i = 0; i < q.length; i++) scan(q[i]);
  }
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === "characterData") { if (m.target.parentNode) pending.push(m.target.parentNode); }
      else for (var j = 0; j < m.addedNodes.length; j++) {
        var n = m.addedNodes[j];
        pending.push(n.nodeType === 1 ? n : n.parentNode);
      }
    }
    if (!t && pending.length) t = setTimeout(flush, 0);
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  function all() { scan(document.body); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", all); else all();
  window.KineHarmonie = { ico: ico, scan: scan };
})();
