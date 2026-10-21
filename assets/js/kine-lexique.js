/* ═══════════ KinéForce — les mots du kiné expliqués ═══════════
   Dans les consignes, fiches et explications, les mots techniques sont soulignés en pointillés :
   un appui affiche une définition simple. La liste complète est dans Suivi, « Lexique ». */
(function () {
  "use strict";
  // [mot affiché, définition, motif de recherche (sans accents gênants), catégorie]
  var L = [
    ["Abdominaux", "Les muscles du ventre. Ils protègent le dos et aident à se redresser.", "abdominaux", "Muscles"],
    ["Abduction", "Écarter un membre du corps, par exemple lever la jambe sur le côté. Le contraire s'appelle l'adduction.", "abductions?|abducteurs?", "Mouvements"],
    ["Adducteurs", "Les muscles de l'intérieur de la cuisse. Ils rapprochent les jambes l'une de l'autre.", "adducteurs?|adduction", "Muscles"],
    ["Amplitude", "Jusqu'où va le mouvement. « Réduire l'amplitude », c'est faire un mouvement plus petit, souvent plus confortable.", "amplitudes?", "Mouvements"],
    ["Antépulsion", "Amener vers l'avant, par exemple les épaules ou le bras.", "antépulsion", "Mouvements"],
    ["Arthrose", "Usure progressive du cartilage d'une articulation. Bouger et se renforcer restent les traitements recommandés.", "arthrosiques?|arthrose", "Santé"],
    ["Bilatéral", "Des deux côtés en même temps, par exemple sur les deux jambes.", "bilatérale?s?", "Mouvements"],
    ["Biceps", "Le muscle de l'avant du bras. Il plie le coude, par exemple pour porter un sac.", "biceps", "Muscles"],
    ["Borg (échelle de)", "Une échelle pour noter l'effort ressenti : de très facile à très difficile. Elle aide à doser les séances.", "borg", "Séance"],
    ["Cartilage", "Le revêtement lisse au bout des os, qui permet aux articulations de glisser sans frotter.", "cartilages?", "Santé"],
    ["Cervical", "Qui concerne le cou.", "cervicale?s?|cervicaux", "Corps"],
    ["Chaîne fermée", "Un exercice où les pieds (ou les mains) restent en appui au sol, comme le squat. Il ressemble aux gestes du quotidien.", "chaîne fermée", "Séance"],
    ["Cohérence cardiaque", "Respirer lentement, environ 5 secondes pour inspirer et 5 secondes pour expirer, pendant quelques minutes. Cela calme le corps et le stress.", "cohérence cardiaque", "Séance"],
    ["Coiffe des rotateurs", "Quatre petits muscles autour de l'épaule. Ils gardent l'articulation bien centrée quand on lève le bras.", "coiffe des rotateurs|coiffe", "Muscles"],
    ["Concentrique", "Le muscle travaille en se raccourcissant : c'est la phase où l'on pousse ou où l'on remonte.", "concentriques?", "Séance"],
    ["Cyphose", "L'arrondi naturel du haut du dos. Elle devient gênante seulement quand elle est très marquée.", "cyphoses?", "Corps"],
    ["Décubitus", "Position allongée : sur le dos (dorsal), sur le ventre (ventral) ou sur le côté (latéral).", "décubitus", "Positions"],
    ["Deltoïde", "Le muscle rond qui forme l'épaule. Il lève le bras devant, sur le côté et derrière.", "deltoïdes?", "Muscles"],
    ["Diaphragme", "Le grand muscle de la respiration, sous les poumons. Quand il descend, le ventre se gonfle.", "diaphragmes?|diaphragmatiques?", "Muscles"],
    ["Excentrique", "Le muscle travaille en freinant, tout en s'allongeant : par exemple quand on redescend lentement. Très utile pour renforcer les tendons.", "excentriques?", "Séance"],
    ["Extension", "Tendre une articulation (genou, hanche, coude…). C'est le contraire de la flexion.", "extensions?", "Mouvements"],
    ["Fessiers", "Les muscles des fesses. Le grand fessier pousse le corps vers l'avant et vers le haut ; le moyen fessier, sur le côté, garde le bassin droit quand on marche.", "fessiers?|fessières?", "Muscles"],
    ["Flexion", "Plier une articulation (genou, hanche, coude…). C'est le contraire de l'extension.", "flexions?", "Mouvements"],
    ["Fléchisseurs de hanche", "Les muscles qui lèvent la cuisse vers le ventre, dont le psoas. Ils travaillent à chaque pas et dans les escaliers.", "fléchisseurs?", "Muscles"],
    ["Gainage", "Contracter ensemble les muscles du ventre, du dos et des fesses pour garder le tronc solide, comme une planche.", "gainages?|gainé", "Séance"],
    ["Grand dorsal", "Le grand muscle du dos. Il tire le bras vers le bas et vers l'arrière, par exemple pour tirer une porte.", "grand dorsal", "Muscles"],
    ["Hernie discale", "Une partie du disque, le petit coussin entre deux vertèbres, qui déborde. Elle peut se résorber d'elle-même avec le temps.", "hernies? discales?|hernies?", "Santé"],
    ["Iliopsoas (psoas)", "Le muscle profond qui relie le bas du dos à la cuisse. Il lève la jambe et se raccourcit quand on reste longtemps assis.", "iliopsoas|psoas", "Muscles"],
    ["Ischio-jambiers", "Les muscles de l'arrière de la cuisse. Ils plient le genou et tirent la hanche vers l'arrière.", "ischio-jambiers?|ischios?", "Muscles"],
    ["Isométrique", "Le muscle travaille sans bouger : on tient une position, comme la chaise contre le mur ou la planche.", "isométriques?|isométrie", "Séance"],
    ["Lombaire", "Qui concerne le bas du dos.", "lombaires?|lombo", "Corps"],
    ["Lombalgie", "Une douleur du bas du dos. Le plus souvent, elle n'est pas grave et s'améliore en restant actif.", "lombalgies?", "Santé"],
    ["Lordose", "Le creux naturel du bas du dos (et du cou). Il est normal et utile.", "lordoses?", "Corps"],
    ["Ménisque", "Un petit coussin en forme de croissant dans le genou, qui amortit les chocs.", "ménisques?|méniscales?", "Santé"],
    ["Mobilisation", "Bouger une articulation en douceur, sans forcer, pour l'assouplir et la réchauffer.", "mobilisations?", "Séance"],
    ["Mollets", "Les muscles de l'arrière de la jambe. Ils poussent le corps à chaque pas.", "mollets?", "Muscles"],
    ["Obliques", "Les muscles sur les côtés du ventre. Ils tournent et inclinent le tronc, et le protègent quand on porte d'un seul côté.", "obliques", "Muscles"],
    ["Omoplate", "L'os plat du haut du dos, sur lequel s'attache le bras. On dit aussi scapula.", "omoplates?|scapula|scapulaires?", "Corps"],
    ["Ostéoporose", "Des os moins denses et plus fragiles, surtout après la ménopause. Le renforcement et la marche aident à les protéger.", "ostéoporose", "Santé"],
    ["Pectoraux", "Les muscles de la poitrine. Ils poussent les bras vers l'avant, comme dans les pompes.", "pectoraux|pectoral", "Muscles"],
    ["Proprioception", "Le sens qui permet de savoir où sont nos articulations sans les regarder. Il est essentiel à l'équilibre.", "proprioceptions?|proprioceptifs?|proprioceptives?", "Séance"],
    ["Quadriceps", "Le gros muscle de l'avant de la cuisse. Il tend le genou, pour se lever ou monter les escaliers.", "quadriceps", "Muscles"],
    ["Rachis", "La colonne vertébrale. « Rachis neutre » ou « dos neutre » : le dos dans sa position naturelle, ni trop creusé ni trop arrondi.", "rachis|rachidiens?|rachidiennes?", "Corps"],
    ["Rétroversion du bassin", "Basculer le bassin pour effacer le creux du bas du dos, comme pour plaquer les reins au sol.", "rétroversion", "Mouvements"],
    ["Rétropulsion", "Amener vers l'arrière, par exemple ramener les épaules en arrière.", "rétropulsion", "Mouvements"],
    ["Rotation externe", "Tourner le bras ou la jambe vers l'extérieur.", "rotations? externes?", "Mouvements"],
    ["Rotation interne", "Tourner le bras ou la jambe vers l'intérieur.", "rotations? internes?", "Mouvements"],
    ["Rotulien", "Qui concerne la rotule, le petit os à l'avant du genou.", "rotuliens?|rotuliennes?|rotules?", "Corps"],
    ["Sciatique", "Une douleur qui descend dans la jambe, due à un nerf irrité dans le bas du dos. Elle s'améliore le plus souvent sans opération.", "sciatiques?", "Santé"],
    ["Soléaire", "Le muscle profond du mollet, surtout sollicité genoux pliés. Il soutient la cheville quand on marche longtemps.", "soléaire", "Muscles"],
    ["Tempo", "La vitesse du mouvement, en secondes : par exemple 2 secondes pour descendre et 1 seconde pour remonter.", "tempo", "Séance"],
    ["Thoracique", "Qui concerne le haut et le milieu du dos, au niveau des côtes.", "thoraciques?", "Corps"],
    ["Transverse", "Le muscle le plus profond du ventre. Il serre la taille comme une ceinture et protège le dos.", "transverse", "Muscles"],
    ["Trapèze", "Le muscle du haut du dos et de la nuque. Il bouge et stabilise les omoplates.", "trapèzes?", "Muscles"],
    ["Triceps", "Le muscle de l'arrière du bras. Il tend le coude, par exemple pour se relever en poussant sur les mains.", "triceps", "Muscles"],
    ["Unilatéral", "D'un seul côté à la fois, par exemple sur une seule jambe.", "unilatérale?s?|unilatéraux", "Mouvements"],
    ["Unipodal", "Sur un seul pied. On travaille l'équilibre et la stabilité de la cheville et de la hanche.", "unipodale?s?|unipodaux", "Positions"],
    ["Valgus", "Quand le genou rentre vers l'intérieur pendant un mouvement. On cherche à le garder dans l'axe du pied.", "valgus", "Mouvements"]
  ];
  var CATS = ["Séance", "Muscles", "Corps", "Mouvements", "Positions", "Santé"];
  var LETTRE = "A-Za-zÀ-ÖØ-öø-ÿœŒ";
  var RE = L.map(function (e) { return new RegExp("(^|[^" + LETTRE + "-])(" + e[2] + ")(?![" + LETTRE + "])", "i"); });

  // Zones de texte où l'on souligne les mots (consignes, fiches, explications)
  var ZONES = [".ex-desc", ".ex-variant", ".pbox", ".pg-desc", ".pg-cue", ".kf-note", ".kf-tuto-pts span", ".ks-p", ".ks-do span",
               ".ki-vf-r p", ".ki-why-b p", ".seq-ex-desc", ".seq-tip", ".kf-ex-meta"].join(",");
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function decorateZone(z) {
    if (z.__kx) return; z.__kx = 1;
    var used = {};
    var walker = document.createTreeWalker(z, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      if (!node.nodeValue || node.nodeValue.length < 4 || (node.parentNode && node.parentNode.closest && node.parentNode.closest(".kx-term,button,a,summary"))) return;
      var text = node.nodeValue, frag = null, pos = 0, guard = 0;
      while (guard++ < 8) {
        var best = null;
        for (var i = 0; i < RE.length; i++) {
          if (used[i]) continue;
          var m = RE[i].exec(text.slice(pos));
          if (m && (!best || m.index + m[1].length < best.at)) best = { i: i, at: m.index + m[1].length, len: m[2].length };
        }
        if (!best) break;
        frag = frag || document.createDocumentFragment();
        var s = pos + best.at;
        frag.appendChild(document.createTextNode(text.slice(pos, s)));
        var sp = document.createElement("span");
        sp.className = "kx-term"; sp.setAttribute("role", "button"); sp.setAttribute("tabindex", "0");
        sp.setAttribute("data-kx", best.i); sp.setAttribute("aria-label", "Définition : " + L[best.i][0]);
        sp.textContent = text.substr(s, best.len);
        frag.appendChild(sp);
        used[best.i] = 1; pos = s + best.len;
      }
      if (frag) { frag.appendChild(document.createTextNode(text.slice(pos))); node.parentNode.replaceChild(frag, node); }
    });
  }
  function decorate(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches(ZONES)) decorateZone(root);
    if (root.querySelectorAll) root.querySelectorAll(ZONES).forEach(decorateZone);
  }

  /* ── La bulle de définition ── */
  function pop(i) {
    var e = L[i]; if (!e) return;
    var el = $("kx-pop");
    if (!el) {
      el = document.createElement("div"); el.id = "kx-pop"; el.setAttribute("role", "dialog");
      el.addEventListener("click", function (ev) { if (ev.target === el) closePop(); });
      document.body.appendChild(el);
    }
    el.setAttribute("aria-label", e[0]);
    el.innerHTML = "<div class='kx-card'><div class='kx-tag'>Le mot du kiné</div><div class='kx-h'>" + esc(e[0]) + "</div><p>" + esc(e[1]) + "</p>" +
      "<div class='kx-btns'><button type='button' class='kx-all' onclick='KineLexique.open()'>Tous les mots</button>" +
      "<button type='button' class='seq-btn-main kx-ok' onclick='KineLexique.closePop()'>Compris</button></div></div>";
    el.classList.add("open");
  }
  function closePop() { var el = $("kx-pop"); if (el) el.classList.remove("open"); }
  function onTap(ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest(".kx-term") : null;
    if (!t) return;
    ev.preventDefault(); ev.stopPropagation();
    pop(+t.getAttribute("data-kx"));
  }
  document.addEventListener("click", onTap, true);
  document.addEventListener("keydown", function (ev) { if ((ev.key === "Enter" || ev.key === " ") && ev.target.classList && ev.target.classList.contains("kx-term")) onTap(ev); }, true);

  /* ── Le lexique complet ── */
  var q = "";
  function open() {
    closePop();
    var el = $("kx-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kx-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Lexique"); document.body.appendChild(el); }
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineLexique.close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Les mots du kiné</div><div class='kf-sub'>" + L.length + " mots expliqués simplement. Dans l'appli, les mots soulignés en pointillés s'expliquent d'un simple appui.</div>" +
      "<input class='kf-text su-input kx-search' id='kx-q' type='search' placeholder='Chercher un mot' value='" + esc(q) + "' oninput='KineLexique.filter(this.value)'>" +
      "<div id='kx-list'></div></div>";
    el.classList.add("open"); el.scrollTop = 0;
    list();
  }
  function norm(t) { return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function list() {
    var box = $("kx-list"); if (!box) return;
    var nq = norm(q.trim());
    var html = CATS.map(function (c) {
      var items = L.filter(function (e) { return e[3] === c && (!nq || norm(e[0] + " " + e[1]).indexOf(nq) >= 0); })
        .sort(function (a, b) { return a[0].localeCompare(b[0], "fr"); });
      if (!items.length) return "";
      return "<div class='kf-phase' style='color:var(--text2)'>" + c + "</div>" +
        items.map(function (e) { return "<div class='kx-row'><b>" + esc(e[0]) + "</b><span>" + esc(e[1]) + "</span></div>"; }).join("");
    }).join("");
    box.innerHTML = html || "<p class='lx-muted'>Aucun mot ne correspond. Tu peux poser la question à ton kiné.</p>";
  }
  function filter(v) { q = v; list(); }
  function close() { var el = $("kx-sheet"); if (el) el.classList.remove("open"); }

  window.KineLexique = { open: open, close: close, filter: filter, pop: pop, closePop: closePop, decorate: decorate, mots: L };

  function init() {
    decorate(document.body);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var a = muts[i].addedNodes;
        for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1 && !(a[j].classList && a[j].classList.contains("kx-term"))) decorate(a[j]);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
