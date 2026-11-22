/* ═══════════ KinéForce — glossaire ═══════════
   Les mots techniques restent tels quels dans les textes. Ils sont soulignés en pointillé :
   un appui prolongé (ou un clic droit) affiche leur définition en mots simples.
   Le texte de la page n'est pas modifié (les spans ne changent ni innerText ni la voix). */
(function () {
  "use strict";
  var G = [
    { re: /décubitus (?:dorsal|ventral|latéral)|décubitus/i, d: function (m) { m = m.toLowerCase(); return m.indexOf("dorsal") > 0 ? "Allongé sur le dos." : m.indexOf("ventral") > 0 ? "Allongé sur le ventre." : m.indexOf("latéral") > 0 ? "Allongé sur le côté." : "Allongé."; } },
    { re: /valgus/i, d: "Le genou (ou le pied) part vers l'intérieur, comme s'il s'effondrait vers l'autre jambe." },
    { re: /varus/i, d: "Le genou part vers l'extérieur, les jambes forment des parenthèses." },
    { re: /excentriques?/i, d: "Le muscle freine un mouvement pendant qu'il s'allonge, par exemple la descente lente d'une marche." },
    { re: /concentriques?/i, d: "Le muscle se raccourcit pour produire le mouvement, par exemple la montée." },
    { re: /isométriques?/i, d: "Le muscle travaille sans bouger : on tient la position." },
    { re: /plyométriques?/i, d: "Mouvement explosif, comme un saut ou une pompe qui décolle les mains." },
    { re: /proprioception|proprioceptif/i, d: "Le sens de la position de ton corps : il permet de garder l'équilibre sans regarder." },
    { re: /unipodal(?:e|es|s)?/i, d: "Sur un seul pied." },
    { re: /gainage/i, d: "Tenir le tronc droit et contracté, sans bouger." },
    { re: /tempo/i, d: "La vitesse imposée à chaque phase du mouvement, par exemple 3 secondes à la descente." },
    { re: /transverse/i, d: "Le muscle profond du ventre, comme une ceinture naturelle." },
    { re: /diaphragmatique/i, d: "Respiration par le ventre : il se gonfle quand tu inspires." },
    { re: /ischio-?jambiers?|ischios?/i, d: "Les muscles de l'arrière de la cuisse." },
    { re: /psoas/i, d: "Muscle profond qui relie le bas du dos à la cuisse et fait monter le genou." },
    { re: /lordose/i, d: "La courbe creuse du bas du dos." },
    { re: /cyphose/i, d: "L'arrondi du haut du dos." },
    { re: /scapulaire/i, d: "Qui concerne l'omoplate." },
    { re: /abduction/i, d: "Écarter un membre du corps, par exemple lever le bras ou la jambe sur le côté." },
    { re: /adduction/i, d: "Rapprocher un membre du corps." },
    { re: /œdème|oedème/i, d: "Gonflement dû à du liquide qui s'accumule." },
    { re: /tendinopathie/i, d: "Tendon irrité ou douloureux." },
    { re: /sciatique/i, d: "Douleur sur le trajet du nerf sciatique, de la fesse vers la jambe." },
    { re: /cervicalgie/i, d: "Douleur du cou." },
    { re: /Sorensen/, d: "Test d'endurance du dos : tenir le buste à l'horizontale, allongé sur le ventre." }
  ];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, BUTTON: 1, SELECT: 1, SUMMARY: 1, A: 1, CODE: 1, NOSCRIPT: 1, SVG: 1, OPTION: 1 };
  var QUICK = /décubitus|valgus|varus|excentrique|concentrique|isométrique|plyométrique|proprio|unipodal|gainage|tempo|transverse|diaphragmatique|ischio|psoas|lordose|cyphose|scapulaire|abduction|adduction|œdème|oedème|tendinopathie|sciatique|cervicalgie|Sorensen/i;
  var seen = new WeakMap(), pending = [], timer = 0, pop = null, popT = 0, pressT = 0, px = 0, py = 0;

  function skipNode(n) {
    for (var e = n.parentNode; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.nodeName.toUpperCase()] || e.isContentEditable || (e.classList && (e.classList.contains("kf-def") || e.classList.contains("kf-defpop") || e.classList.contains("no-gloss")))) return true;
      if (e === document.body) return false;
    }
    return false;
  }
  function block(n) { var e = n.parentNode; while (e && e.nodeType === 1 && e !== document.body) { var d = getComputedStyle(e).display; if (d !== "inline" && d !== "contents") return e; e = e.parentNode; } return document.body; }

  function wrapText(tn) {
    var t = tn.nodeValue;
    if (!t || t.length < 5 || !QUICK.test(t) || skipNode(tn)) return;
    var b = block(tn), got = seen.get(b); if (!got) { got = {}; seen.set(b, got); }
    var best = null, i, m;
    for (i = 0; i < G.length; i++) {
      if (got[i]) continue;
      m = G[i].re.exec(t);
      if (m && (!best || m.index < best.m.index)) best = { m: m, i: i };
    }
    if (!best) return;
    var s = best.m.index, e = s + best.m[0].length;
    if (s > 0 && /[\wàâçéèêëîïôûùüÿœ]/i.test(t.charAt(s - 1))) { return; }
    got[best.i] = 1;
    var after = tn.splitText(e), mid = tn.splitText(s);
    var sp = document.createElement("span");
    sp.className = "kf-def"; sp.setAttribute("data-gi", best.i); sp.textContent = mid.nodeValue;
    mid.parentNode.replaceChild(sp, mid);
    wrapText(after);
  }
  function scan(root) {
    try {
      if (!root || root.nodeType !== 1 || SKIP[root.nodeName.toUpperCase()]) return;
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [], n;
      while ((n = w.nextNode()) && list.length < 400) if (n.nodeValue && n.nodeValue.length > 4 && QUICK.test(n.nodeValue)) list.push(n);
      list.forEach(function (x) { if (x.parentNode) wrapText(x); });
    } catch (e) {}
  }
  function flush() {
    timer = 0; var r = pending; pending = [];
    r.forEach(function (n) { if (n.isConnected) scan(n); });
  }
  function queue(n) {
    if (n.nodeType !== 1 || n.classList.contains("kf-defpop")) return;
    pending.push(n); if (!timer) timer = setTimeout(flush, 350);
  }

  function def(el) {
    var g = G[+el.getAttribute("data-gi")]; if (!g) return "";
    var tx = el.textContent;
    return typeof g.d === "function" ? g.d(tx) : g.d;
  }
  function hide() { if (pop) { pop.remove(); pop = null; } clearTimeout(popT); }
  function show(el) {
    hide();
    var d = def(el); if (!d) return;
    pop = document.createElement("div"); pop.className = "kf-defpop"; pop.setAttribute("role", "status");
    var b = document.createElement("b"); b.textContent = el.textContent; var p = document.createElement("span"); p.textContent = d;
    pop.appendChild(b); pop.appendChild(p); document.body.appendChild(pop);
    var r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight, vw = window.innerWidth;
    var left = Math.max(10, Math.min(vw - pw - 10, r.left + r.width / 2 - pw / 2));
    var top = r.top - ph - 10; if (top < 10) top = r.bottom + 10;
    pop.style.left = left + "px"; pop.style.top = top + "px";
    requestAnimationFrame(function () { if (pop) pop.classList.add("on"); });
    popT = setTimeout(hide, 6000);
  }
  function target(e) { var t = e.target; return t && t.closest ? t.closest(".kf-def") : null; }

  function init() {
    document.addEventListener("pointerdown", function (e) {
      clearTimeout(pressT);
      var el = target(e);
      if (!el) { if (pop && !(e.target.closest && e.target.closest(".kf-defpop"))) hide(); return; }
      px = e.clientX; py = e.clientY;
      pressT = setTimeout(function () { show(el); }, 450);
    }, true);
    document.addEventListener("pointermove", function (e) { if (pressT && (Math.abs(e.clientX - px) > 10 || Math.abs(e.clientY - py) > 10)) { clearTimeout(pressT); pressT = 0; } }, true);
    ["pointerup", "pointercancel", "scroll"].forEach(function (ev) { document.addEventListener(ev, function () { clearTimeout(pressT); pressT = 0; }, true); });
    document.addEventListener("contextmenu", function (e) { var el = target(e); if (el) { e.preventDefault(); show(el); } }, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
        var n = ms[i].addedNodes[j];
        if (n.nodeType === 3 && n.parentNode) queue(n.parentNode); else queue(n);
      }
    }).observe(document.body, { childList: true, subtree: true });
    queue(document.body);
  }
  window.KineGlossaire = { scan: function () { scan(document.body); }, def: def, count: function () { return document.querySelectorAll(".kf-def").length; } };
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
})();
