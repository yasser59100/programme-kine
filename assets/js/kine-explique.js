/* ═══════════ KinéForce — Yass explique les nouveautés, au bon moment ═══════════
   La première fois qu'une fonction apparaît à l'écran (réglage du niveau, caméra, accès anticipé, exercices réactifs),
   Yass l'explique dans une bulle, à voix haute. Une seule bulle à la fois ; « Compris » la ferme pour de bon. */
var KineExplique = (function () {
  "use strict";
  var KEY = "kf-explique";
  var T = {
    niveau: "Trop facile ou trop dur ? Touche plus ou moins. Plus ajoute du temps ou des répétitions, puis te montre une variante plus difficile : tu choisis de la prendre ou non. Je garde ton choix pour les prochaines séances.",
    camera: "Tu vois le bouton caméra ? Touche-le pour faire la série devant moi : je regarde ton mouvement, je te corrige à voix haute et je compte pour toi.",
    rouge: "Tu as fini ta rééducation ? Réponds à six questions. Si tout est bon, j'ouvre les exercices difficiles.",
    reactif: "Nouveau : les exercices réactifs avec les couleurs peuvent entrer dans ta séance. Tu les trouves dans le groupe Réactivité.",
    reactifSeance: "Avant chaque série, choisis tes couleurs, le nombre, le rythme et les pièges, puis touche C'est parti."
  };
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function seen(k) { return !!jget(KEY, {})[k]; }
  function mark(k) { var o = jget(KEY, {}); o[k] = 1; jset(KEY, o); }
  var pending = [];

  function voice(t) {
    if (typeof speak !== "function") return;
    if (typeof seqSoundOn !== "undefined" && !seqSoundOn) return;
    try { speak(t, { prio: 1, now: true, ttl: 6000 }); } catch (e) {}
  }
  // Une bulle visible à l'écran (celles restées dans un écran fermé ne comptent pas)
  function current() { return [].filter.call(document.querySelectorAll(".kx-tip"), function (t) { return t.offsetParent !== null; })[0] || null; }
  // anchor : l'élément après lequel la bulle se place ; inside : la bulle se met dans l'élément, au début
  function once(k, anchor, inside) {
    if (!T[k] || seen(k) || !anchor || !anchor.isConnected) return;
    if (window.KineMascotte && KineMascotte.isOff && KineMascotte.isOff()) return;
    if (current()) { if (!pending.some(function (p) { return p.k === k; })) pending.push({ k: k, a: anchor, i: inside }); return; }
    mark(k);
    var tip = document.createElement("div");
    tip.className = "kx-tip"; tip.setAttribute("role", "note");
    tip.innerHTML = (window.KineMascotte && KineMascotte.coachHtml ? KineMascotte.coachHtml(T[k]) : "<p>" + T[k] + "</p>") +
      "<button type='button' class='kx-ok'>Compris</button>";
    tip.querySelector(".kx-ok").onclick = function () { tip.remove(); next(); };
    if (inside) anchor.insertBefore(tip, anchor.firstChild); else anchor.parentNode.insertBefore(tip, anchor.nextSibling);
    voice(T[k]);
  }
  function next() {
    while (pending.length) { var p = pending.shift(); if (p.a && p.a.isConnected && !seen(p.k)) { once(p.k, p.a, p.i); return; } }
  }
  // Bulle disparue avec son écran : on passe à la suivante
  setInterval(function () { if (!current() && pending.length) next(); }, 1500);

  return { once: once, texts: T, reset: function () { jset(KEY, {}); } };
})();
window.KineExplique = KineExplique;
