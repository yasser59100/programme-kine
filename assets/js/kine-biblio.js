/* ═══════════ KinéForce — bibliothèque d'exercices ═══════════
   Chaque exercice a un groupe musculaire et une couleur de base :
   1 vert (facile), 2 orange (intermédiaire), 3 rouge (difficile).
   La façon de faire monte d'un cran (tempo lent, isométrique, sur une jambe, charge),
   au plus jusqu'au rouge. Les exercices des 5 séances y sont rangés aussi. */
var KineBiblio = (function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var GROUPS = [
    ["genou", "Genou et quadriceps"], ["hanche", "Hanche et fessiers"], ["ischio", "Ischio-jambiers"], ["mollet", "Mollets et cheville"],
    ["dos", "Dos bas"], ["gainage", "Gainage"], ["epaule", "Épaules"], ["poussee", "Poussée"], ["tirage", "Tirage et dos haut"],
    ["bras", "Bras"], ["equilibre", "Équilibre"], ["mobilite", "Mobilité"], ["cardio", "Cardio doux"]
  ];
  var COLORS = { 1: ["vert", "Facile"], 2: ["orange", "Intermédiaire"], 3: ["rouge", "Difficile"] };

  // Exercices des 5 séances : groupe et couleur de base
  var TAGS = {
    "Squat bilatéral": ["genou", 2], "Fentes avant unilatérales": ["genou", 2], "Chaise contre le mur": ["genou", 2],
    "Step-up sur marche": ["genou", 1], "Pont ischio-jambiers talons sur chaise": ["ischio", 2], "Élévation des talons": ["mollet", 1],
    "Rotation externe d'épaule": ["epaule", 1], "Pompes sur genoux": ["poussee", 2], "Dips sur chaise": ["poussee", 2],
    "Pike push-up": ["epaule", 3], "Superman en Y et en W": ["tirage", 2], "Crunch abdominal contrôlé": ["gainage", 1],
    "Portefeuille (V-up)": ["gainage", 3], "Dead bug": ["gainage", 2], "Superman quadrupédique en gainage": ["dos", 1],
    "Ciseaux et vélo": ["gainage", 2], "Plank — gainage avant-bras": ["gainage", 2], "Side plank sur genoux": ["gainage", 1],
    "Squat sumo": ["hanche", 1], "Donkey kick": ["hanche", 1], "Pont de hanche": ["hanche", 1], "Clamshell": ["hanche", 1],
    "Abduction hanche debout": ["hanche", 1], "Pont fessier unilatéral": ["hanche", 2], "Squat + élévation bras": ["cardio", 1],
    "Inchworm et pompes": ["poussee", 3], "Fente latérale avec toucher sol": ["cardio", 2], "Burpee modifié sans saut": ["cardio", 2],
    "Équilibre unipodal": ["equilibre", 1]
  };

  // Nouveaux exercices (fiche complète). cue : le point clé ; err : l'erreur fréquente rappelée par la mascotte
  var NEW = [
    { name: "Assis-debout de chaise", group: "genou", color: 1, kit: ["une chaise"], repsLabel: "10 répétitions",
      desc: "Assis au bord d'une chaise, pieds à plat largeur de hanches, bras tendus devant. Penchez le buste en avant, levez-vous en poussant dans les talons jusqu'à être bien droit, puis rasseyez-vous lentement, sans vous laisser tomber.",
      cue: "Le nez passe au-dessus des orteils, puis on pousse dans les talons.",
      err: "Ne vous laissez pas tomber sur la chaise : la descente se contrôle.",
      tip: "Plus facile : une chaise plus haute ou un coussin. Plus dur : descente en 3 secondes, sans toucher la chaise.",
      stop: "Arrêt si douleur vive au genou ou vertige en vous levant." },
    { name: "Extension de genou assis", group: "genou", color: 1, kit: ["une chaise"], repsLabel: "12 répétitions par jambe",
      desc: "Assis au fond de la chaise, dos droit, mains sur les bords de l'assise. Tendez une jambe jusqu'à l'horizontale, pointe de pied vers vous, tenez 1 seconde puis redescendez lentement. Toutes les répétitions d'un côté, puis l'autre.",
      cue: "Jambe bien tendue, pointe de pied vers vous.",
      err: "Le dos reste contre le dossier : on ne bascule pas en arrière pour lever la jambe.",
      tip: "Plus dur : une bouteille d'eau ou un sac léger accroché à la cheville.",
      stop: "Arrêt si douleur sous la rotule qui augmente." },
    { name: "Fente arrière", group: "genou", color: 2, kit: [], repsLabel: "8 répétitions par jambe",
      desc: "Debout, pieds largeur de hanches. Faites un grand pas en arrière et descendez jusqu'à ce que les deux genoux soient à 90°, genou arrière près du sol, buste droit. Poussez sur la jambe avant pour revenir. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "Le poids reste sur la jambe avant.",
      err: "Le genou avant reste au-dessus du pied, il ne part pas vers l'intérieur.",
      tip: "Souvent mieux tolérée que la fente avant pour les genoux. Tenez une chaise si l'équilibre est précaire.",
      stop: "Arrêt si douleur vive au genou ou à la hanche." },
    { name: "Squat bulgare", group: "genou", color: 3, kit: ["une chaise"], repsLabel: "8 répétitions par jambe",
      desc: "Dos à une chaise calée contre un mur, posez le dessus d'un pied sur l'assise derrière vous, le pied avant un grand pas devant. Descendez en fléchissant le genou avant jusqu'à ce que la cuisse soit presque horizontale, buste légèrement penché, puis remontez en poussant dans le talon avant.",
      cue: "Le genou avant reste dans l'axe du pied, on pousse dans le talon.",
      err: "Ne poussez pas avec la jambe arrière : elle sert seulement d'appui.",
      tip: "Plus facile : amplitude réduite, ou une main sur un appui stable.",
      stop: "Arrêt si douleur vive au genou ou à la hanche, ou perte d'équilibre." },
    { name: "Fire hydrant", group: "hanche", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions par côté",
      desc: "À quatre pattes, mains sous les épaules, genoux sous les hanches, dos plat. Levez un genou sur le côté jusqu'à hauteur de hanche, genou fléchi à 90°, tenez 1 seconde puis redescendez lentement.",
      cue: "Le bassin reste horizontal, seul le genou s'ouvre.",
      err: "Ne penchez pas le corps du côté opposé pour monter plus haut.",
      tip: "Mains ou genoux sensibles : un coussin dessous.",
      stop: "Arrêt si douleur dans l'aine ou au bas du dos." },
    { name: "Abduction couché sur le côté", group: "hanche", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions par côté",
      desc: "Allongé sur le côté, tête posée sur le bras, jambe du dessous un peu fléchie. Levez la jambe du dessus, tendue, jusqu'à environ 35°, pointe de pied vers l'avant, puis redescendez lentement.",
      cue: "Le talon mène le mouvement, les orteils ne regardent pas le plafond.",
      err: "Le bassin ne bascule pas en arrière : restez bien sur le côté.",
      tip: "Plus dur : tenue de 3 secondes en haut, ou un poids léger à la cheville.",
      stop: "Arrêt si douleur sur le côté de la hanche qui augmente." },
    { name: "Hip thrust épaules sur canapé", group: "hanche", color: 2, kit: ["un canapé"], repsLabel: "12 répétitions",
      desc: "Le haut du dos appuyé sur le bord d'un canapé, pieds à plat largeur de hanches, genoux fléchis. Montez le bassin jusqu'à aligner épaules, hanches et genoux, serrez les fessiers 2 secondes, puis redescendez lentement sans poser les fesses.",
      cue: "Menton rentré, côtes basses : on ne cambre pas.",
      err: "En haut, les genoux sont à 90° : si ce sont les ischios qui chauffent, rapprochez les pieds.",
      tip: "Plus dur : une jambe à la fois, ou un sac lesté posé sur le bassin.",
      stop: "Arrêt si douleur au bas du dos ou à la nuque." }
  ];

  var ALL = null;
  function all() {
    if (ALL) return ALL;
    ALL = []; var seen = {};
    if (typeof SEQ_DAYS !== "undefined") Object.keys(SEQ_DAYS).forEach(function (id) {
      SEQ_DAYS[id].exercises.forEach(function (ex, i) {
        var t = TAGS[ex.name]; if (!t || seen[ex.name]) return; seen[ex.name] = 1;
        ALL.push({ name: ex.name, group: t[0], color: t[1], repsLabel: ex.repsLabel, desc: ex.desc, tip: ex.tip, stop: ex.stop, day: id, idx: i,
                   kit: window.KF && KF.kitFor ? KF.kitFor({ exercises: [ex] }) : [] });
      });
    });
    NEW.forEach(function (e) { e.isNew = true; ALL.push(e); });
    return ALL;
  }
  function find(name) { var a = all(); for (var i = 0; i < a.length; i++) if (a[i].name === name) return a[i]; return null; }

  // Couleur du moment : la base, +1 si l'exercice est passé en tempo lent (charges progressives)
  function color(name) {
    var e = find(name); if (!e) return 0;
    var c = e.color + (window.KineLevel && KineLevel.tempo(name) ? 1 : 0);
    return Math.min(3, c);
  }
  function dot(c) { return "<i class='kb-dot c" + c + "' aria-label='" + (COLORS[c] ? COLORS[c][1] : "") + "'></i>"; }

  // Les points clés et erreurs des nouveaux exercices rejoignent ceux de l'appli
  function wire() {
    NEW.forEach(function (e) {
      if (window.KF_CUES && e.cue && !KF_CUES[e.name]) KF_CUES[e.name] = e.cue;
      if (window.KineMascotte && KineMascotte.errors && e.err && !KineMascotte.errors[e.name]) KineMascotte.errors[e.name] = e.err;
    });
  }

  /* ════════ Écran : la bibliothèque ════════ */
  var filter = "";
  function sheet() {
    var el = $("kb-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kb-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function open(g) {
    wire();
    if (g != null) filter = g;
    var list = all().filter(function (e) { return !filter || e.group === filter; });
    var chips = "<button class='kb-chip" + (!filter ? " on" : "") + "' onclick='KineBiblio.open(\"\")'>Tous</button>" +
      GROUPS.map(function (gr) {
        var n = all().filter(function (e) { return e.group === gr[0]; }).length; if (!n) return "";
        return "<button class='kb-chip" + (filter === gr[0] ? " on" : "") + "' onclick='KineBiblio.open(\"" + gr[0] + "\")'>" + esc(gr[1]) + " <small>" + n + "</small></button>";
      }).join("");
    var rows = GROUPS.map(function (gr) {
      var items = list.filter(function (e) { return e.group === gr[0]; }).sort(function (a, b) { return a.color - b.color; });
      if (!items.length) return "";
      return "<div class='kf-phase' style='color:var(--text2)'>" + esc(gr[1]) + "</div>" + items.map(function (e) {
        var thumb = window.KineAvatar && KineAvatar.supports(e.name) ? KineAvatar.snapshot(e.name, 104) : null, c = color(e.name);
        return "<button class='pg-ex kb-ex' onclick='KineBiblio.demo(" + JSON.stringify(e.name).replace(/'/g, "&#39;") + ")'>" +
          (thumb ? "<img src='" + thumb + "' alt=''>" : "<span class='pg-fig' aria-hidden='true'></span>") +
          "<span class='pg-day-t'><b>" + dot(c) + esc(e.name) + "</b><span>" + (e.isNew ? "<em class='kb-new'>Nouveau</em> " : "") + esc(COLORS[c][1]) + ", " + esc(e.repsLabel) + (e.kit && e.kit.length ? ", " + esc(e.kit.join(", ")) : "") + "</span></span><span class='pg-chev' aria-hidden='true'>›</span></button>";
      }).join("");
    }).join("");
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineBiblio.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Bibliothèque d'exercices</div><div class='kf-sub'>" + all().length + " exercices, classés par groupe musculaire</div></div>" +
      "<div class='kb-legend'>" + dot(1) + "Facile " + dot(2) + "Intermédiaire " + dot(3) + "Difficile</div>" +
      "<div class='kb-note'>La façon de faire compte : un tempo lent, un maintien, une jambe à la fois ou une charge rendent l'exercice plus difficile.</div>" +
      "<div class='kb-chips'>" + chips + "</div>" + rows + "</div>";
    el.classList.add("open");
  }
  function close() { var el = $("kb-sheet"); if (el) el.classList.remove("open"); }
  function demo(name) {
    var e = find(name); if (!e) return;
    wire();
    if (e.day && typeof openDemo === "function") { openDemo(e.day, e.idx); return; }
    if (typeof openDemoEx === "function") openDemoEx(e);
  }

  return { groups: GROUPS, colors: COLORS, all: all, find: find, color: color, open: open, close: close, demo: demo, wire: wire, NEW: NEW };
})();
window.KineBiblio = KineBiblio;
document.addEventListener("DOMContentLoaded", function () { setTimeout(KineBiblio.wire, 0); });
