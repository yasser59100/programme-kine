/* ═══════════ KinéForce — programmes ciblés (coureur, genou, dos, cheville) ═══════════
   Un programme ciblé remplace les 5 séances du programme général quand le patient le choisit.
   Chaque programme est masqué par défaut : le kiné le rend visible pour tous depuis son espace
   (publié avec le programme officiel). Le kiné les voit toujours, pour les tester.
   Les séances reprennent les exercices de la bibliothèque (fiches, Yass, voix) et la même
   progression sur 4 semaines. */
var KineTheme = (function () {
  "use strict";
  var KEY = "kf-theme";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  // Règle de la douleur, commune aux programmes (repère classique de la rééducation par l'exercice)
  var PAIN_RULE = "<div class='th-pain'><div class='g'><b>0 à 3 sur 10</b>On continue normalement.</div>" +
    "<div class='o'><b>4 à 5 sur 10</b>Possible, si la douleur est revenue à son niveau habituel le lendemain matin et n'augmente pas d'une séance à l'autre.</div>" +
    "<div class='r'><b>6 ou plus, ou pire le lendemain</b>On réduit (amplitude, répétitions, sorties) et on en parle à son kiné.</div></div>";

  /* ════════ Mouvements ajoutés pour ces programmes (Yass + fiches de la bibliothèque) ════════ */
  (function moves() {
    if (!window.KineAvatar || !KineAvatar.lib) return;
    var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step;
    var A_RUN = { LA: { ang: [10, 10, 0, 70] }, RA: { ang: [10, 10, 0, 70] } };
    var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };
    reg("Petits sauts sur place", {
      noIso: true, camera: { yaw: 1.2 }, start: "ground", thumb: "air",
      poses: {
        ground: merge(STAND(0.1, 0), { pelvis: { p: [0, "auto", 0], r: [0, 0, 0], dy: -0.04 }, L: { foot: { at: [0.1, 0, 0.12], yaw: 0, lift: 12 } }, R: { foot: { at: [-0.1, 0, 0.12], yaw: 0, lift: 12 } } }, A_RUN),
        air: merge(STAND(0.1, 0), { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, L: { foot: { at: [0.1, 0.07, 0.1], yaw: 0, lift: 40 } }, R: { foot: { at: [-0.1, 0.07, 0.1], yaw: 0, lift: 40 } } }, A_RUN)
      },
      steps: [step("air", 0.22, "Petit saut", null, "up"), step("ground", 0.3, "Petit saut", null, "down")]
    });
    reg("Sauts sur une jambe", {
      sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: { yaw: 1.1 }, start: "ground", thumb: "air",
      poses: {
        ground: { pelvis: { p: [0, "auto", 0], r: [0, 0, 0], dy: -0.06 }, spine: [6, 0, 0], head: 0, R: { foot: { at: [-0.1, 0, 0.12], yaw: 0, lift: 12 } }, L: { ang: [30, 3, 0, 85, 0] }, LA: { ang: [25, 12, 0, 80] }, RA: { ang: [-15, 12, 0, 80] } },
        air: { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [4, 0, 0], head: 0, R: { foot: { at: [-0.1, 0.08, 0.1], yaw: 0, lift: 40 } }, L: { ang: [30, 3, 0, 85, 0] }, LA: { ang: [-15, 12, 0, 80] }, RA: { ang: [25, 12, 0, 80] } }
      },
      steps: [step("air", 0.28, "Saut", null, "up"), step("ground", 0.45, "Réception douce", null, "down")]
    });
    var WALL_H = { LA: { hand: { at: [0.22, 1.28, 0.55], pole: [0.6, -1, -0.3] } }, RA: { hand: { at: [-0.22, 1.28, 0.55], pole: [-0.6, -1, -0.3] } } };
    reg("Fente de cheville au mur", {
      sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 1.45, dist: 3.8, ty: 0.7 }, props: ["wall"], start: "back", thumb: "fwd",
      poses: {
        back: merge({ pelvis: { p: [0, "auto", 0.06], r: [0, 0, 0] }, spine: [6, 0, 0], head: 0,
          R: { foot: { at: [-0.1, 0, 0.44], yaw: 0 } }, L: { foot: { at: [0.1, 0.012, -0.3], yaw: 0, lift: 40 } } }, WALL_H),
        fwd: merge({ pelvis: { p: [0, "auto", 0.2], r: [0, 0, 0], dy: -0.1 }, spine: [8, 0, 0], head: 0,
          R: { foot: { at: [-0.1, 0, 0.44], yaw: 0 } }, L: { foot: { at: [0.1, 0.03, -0.3], yaw: 0, lift: 55 } } }, WALL_H)
      },
      steps: [step("fwd", 2, "Genou vers le mur", "Le genou va vers le mur, talon au sol", "up"), step("fwd", 1, "On tient", "On tient", "hold"), step("back", 2, "On revient", "On revient", "down")]
    });
    var SEAT0 = { pelvis: { p: [0, 0.53, -0.36], r: [0, 0, 0] }, spine: [4, 0, 0], head: 0, L: { foot: { at: [0.14, 0, 0.14], yaw: 6 } },
                  LA: { hand: { at: [0.17, 0.6, -0.02], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.17, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } };
    var footAt = function (yaw) { var r = yaw * Math.PI / 180; return { at: [-0.14 + 0.12 * Math.sin(r), 0, 0.02 + 0.12 * Math.cos(r)], yaw: yaw, pole: [-0.05, 0.05, 1] }; };   // le genou reste face à l avant : seul le pied tourne
    reg("Éversion à l'élastique", {
      sides: "blocks", sideWord: "pied", labelSwap: true, camera: { yaw: 0.5, pitch: 0.45, dist: 3.2, ty: 0.35 }, props: ["chair"], start: "in", thumb: "out",
      bands: [["RA", [0.02, 0.05, 0.16]]],
      poses: { in: merge(SEAT0, { R: { foot: footAt(-2) } }), out: merge(SEAT0, { R: { foot: footAt(-32) } }) },
      steps: [step("out", 1.5, "Le pied tourne en dehors", "Le pied tourne vers l'extérieur", "up"), step("out", 1, "On tient", "On tient", "hold"), step("in", 2, "Retour lent", "On revient lentement", "down")]
    });
    reg("Descente de marche", {
      sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: { yaw: 0.35, dist: 3.9, ty: 0.75 }, props: ["step"], stepAt: { x: -0.25, z: 0.02 }, start: "up", thumb: "down",
      poses: {
        up: { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [4, 0, 0], head: 0, R: { foot: { at: [-0.1, 0.18, 0.1], yaw: 0 } }, L: { ang: [8, 8, 0, 18, 0] }, LA: { ang: [25, 25, 0, 25] }, RA: { ang: [25, 25, 0, 25] } },
        down: { pelvis: { p: [0, "auto", 0.03], r: [8, 0, 0] }, spine: [8, 0, 0], head: 0, R: { foot: { at: [-0.1, 0.18, 0.1], yaw: 0 } }, L: { foot: { at: [0.2, 0, 0.1], yaw: 0, lift: -12 } }, LA: { ang: [45, 18, 0, 25] }, RA: { ang: [45, 18, 0, 25] } }
      },
      steps: [step("down", 2.5, "Descente lente", "On descend lentement, genou au-dessus du pied", "down"), step("down", 0.5, "Le talon effleure", null, "hold"), step("up", 1.5, "On remonte", "On remonte", "up")]
    });
    if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend([
      { name: "Petits sauts sur place", group: "mollet", color: 2, kit: [], repsLabel: "20 répétitions",
        desc: "Debout, pieds à largeur de hanches. Faites de petits sauts rapides sur l'avant des pieds, genoux presque tendus, comme un ressort. Les talons ne touchent pas le sol. Réception souple et silencieuse.",
        cue: "Petits rebonds sur l'avant des pieds, comme un ressort.", err: "Ne sautez pas haut : ce sont les chevilles qui travaillent, pas les cuisses.",
        tip: "Plus facile : 10 sauts, une pause, puis 10 sauts. Plus dur : en avançant et en reculant.", stop: "Arrêt si douleur aux tibias, au tendon d'Achille ou sous le pied." },
      { name: "Sauts sur une jambe", group: "mollet", color: 3, kit: [], repsLabel: "8 répétitions par jambe",
        desc: "Sur une jambe, genou légèrement fléchi. Faites un petit saut sur place, réceptionnez-vous sur l'avant du pied, genou souple et dans l'axe du pied, puis stabilisez-vous une seconde avant le suivant.",
        cue: "Réception douce, genou dans l'axe du pied.", err: "Le genou ne doit pas partir vers l'intérieur à la réception.",
        tip: "Commencez près d'un mur pour vous rattraper. Plus dur : petits sauts vers l'avant et l'arrière.", stop: "Arrêt si douleur à la cheville, au genou ou au tendon d'Achille, ou si vous perdez l'équilibre à chaque saut." },
      { name: "Fente de cheville au mur", group: "mobilite", color: 1, kit: ["un mur libre"], repsLabel: "10 répétitions par jambe",
        desc: "Face à un mur, mains posées dessus, un pied devant à environ 10 cm du mur, l'autre derrière. Sans décoller le talon avant, avancez le genou vers le mur jusqu'à le toucher, puis revenez. Si c'est facile, reculez un peu le pied avant.",
        cue: "Le talon avant reste collé au sol, le genou va vers le mur.", err: "Le talon avant ne doit pas se soulever.",
        tip: "Notez la distance entre le pied et le mur où le genou touche encore : c'est un bon repère de progrès, à comparer avec l'autre côté.", stop: "Arrêt si douleur vive à l'avant de la cheville." },
      { name: "Éversion à l'élastique", group: "mollet", color: 1, kit: ["un élastique", "une chaise"], repsLabel: "15 répétitions par jambe",
        desc: "Assis, pied à plat, un élastique autour de l'avant du pied, tenu ou accroché du côté intérieur. Le talon reste au sol : tournez l'avant du pied vers l'extérieur contre l'élastique, puis revenez lentement.",
        cue: "Le talon reste posé, c'est l'avant du pied qui tourne vers l'extérieur.", err: "La jambe ne tourne pas : seul le pied bouge.",
        tip: "Plus dur : élastique plus tendu, ou retour en 3 secondes.", stop: "Arrêt si douleur vive sur le côté externe de la cheville." },
      { name: "Descente de marche", group: "genou", color: 2, kit: ["une marche"], repsLabel: "8 répétitions par jambe",
        desc: "Debout sur une marche, sur une jambe, l'autre pied dans le vide sur le côté. Pliez lentement le genou d'appui jusqu'à effleurer le sol avec le talon libre, puis remontez. Le genou reste dans l'axe du pied, le bassin horizontal.",
        cue: "Le genou reste au-dessus du pied, le bassin horizontal.", err: "Le genou ne doit pas rentrer vers l'intérieur, ni le bassin tomber du côté libre.",
        tip: "Plus facile : une marche plus basse, ou en tenant la rampe. Plus dur : descente en 4 secondes.", stop: "Arrêt si la douleur à l'avant du genou dépasse 3 sur 10." }
    ]);
  })();

  /* ════════ Les programmes ════════
     séance : { t: titre, f: objectif, warm / cool : routine guidée de la bibliothèque, ex: [[nom, répétitions, note]] } */
  var THEMES = {
    coureur: {
      label: "Coureur", title: "Programme coureur", code: "C", color: "var(--blue)",
      short: "Prévenir les blessures et courir plus solide",
      who: "Pour les coureurs, du débutant au confirmé, qui veulent limiter les blessures de surmenage (genou, tendon d'Achille, tibias, hanche).",
      perWeek: 2, days: { 2: 0, 5: 1 },
      sessions: [
        { t: "Hanches et tronc", f: "Le renforcement qui a le mieux protégé les coureurs dans les études : fessiers, cuisses et gainage.",
          warm: "Activation ceinture pelvienne", cool: "Étirements fessiers et iliopsoas",
          ex: [["Squat bilatéral", "12 répétitions"], ["Fente arrière", "8 répétitions par jambe"], ["Soulevé de terre roumain unipodal", "8 répétitions par jambe"],
               ["Pont fessier unilatéral", "10 répétitions par jambe"], ["Marche latérale élastique"], ["Plank — gainage avant-bras", "30 secondes"], ["Side plank sur genoux", "20 secondes par côté"]] },
        { t: "Mollets, pieds et ressort", f: "Des mollets capables d'encaisser chaque foulée, puis des petits sauts pour retrouver le ressort.",
          warm: "Mobilisation articulaire progressive", cool: "Étirements membres inférieurs",
          ex: [["Élévation des talons unipodale", "12 répétitions par jambe"], ["Élévation des talons genoux fléchis", "15 répétitions", "Genoux fléchis : on cible le soléaire, très sollicité en course."],
               ["Step-up sur marche", "10 répétitions par jambe"], ["Équilibre unipodal", "30 secondes par jambe"],
               ["Petits sauts sur place", "20 répétitions", "Seulement sans douleur aux tibias ni au tendon d'Achille."], ["Sauts sur une jambe", "8 répétitions par jambe", "À partir de la semaine 3, si les petits sauts passent sans douleur."]] }
      ],
      cards: [
        { t: "Trop, trop vite", b: "La plupart des blessures de course viennent d'une hausse trop rapide : plus de kilomètres, plus vite, plus de dénivelé, de nouvelles chaussures. Changez <b>un seul paramètre à la fois</b>, et prévoyez une semaine plus légère toutes les 3 ou 4 semaines. Votre journal de course vous prévient si ça monte trop vite." },
        { t: "La douleur, votre repère", b: "Une petite gêne n'est pas un danger. Ce qui compte : son intensité et le lendemain matin." + PAIN_RULE },
        { t: "Pourquoi ces deux séances", b: "Chez des coureurs débutants, deux séances de renforcement des hanches et du tronc par semaine ont réduit d'environ un tiers les blessures de surmenage (essai publié en 2024). Faites-les un jour sans course, ou après une sortie facile, jamais juste avant une sortie intense." },
        { t: "La cadence", b: "Faire des pas un peu plus courts et un peu plus nombreux (5 à 10 % de pas en plus par minute) diminue les contraintes sur le genou et la hanche. À essayer sur des sorties faciles, progressivement." },
        { t: "Les chaussures", b: "Choisissez avant tout celles qui sont <b>confortables</b> pour vous. Changer de modèle, surtout pour plus léger ou plus plat, se fait progressivement, sur plusieurs semaines." },
        { t: "Quand consulter", b: "Douleur qui vous fait boiter, douleur précise sur un os qui fait mal quand on appuie dessus, gonflement, douleur la nuit, ou douleur qui dure plus de deux semaines malgré une baisse de l'entraînement." }
      ],
      runLog: true
    },
    genou: {
      label: "Genou douloureux", title: "Programme genou", code: "G", color: "var(--teal)",
      short: "Douleur à l'avant du genou : calmer, puis renforcer",
      who: "Pour une douleur à l'avant du genou (autour ou sous la rotule), qui gêne dans les escaliers, accroupi, assis longtemps ou en courant.",
      perWeek: 3, days: { 1: 0, 3: 1, 5: 2 },
      sessions: [
        { t: "Calmer et activer", f: "Des contractions tenues qui soulagent souvent la douleur, et le réveil des muscles de la hanche.",
          warm: "Mobilisation articulaire progressive", cool: "Étirements membres inférieurs",
          ex: [["Chaise contre le mur", "30 secondes", "Descendez seulement jusqu'où la douleur reste à 3 sur 10 au maximum."], ["Extension terminale du genou"], ["Relevé de jambe tendue couché"],
               ["Clamshell", "15 répétitions par côté"], ["Abduction couché sur le côté"], ["Pont de hanche", "12 répétitions"]] },
        { t: "Renforcer", f: "Quadriceps et fessiers ensemble : c'est l'association qui marche le mieux pour ce genou.",
          warm: "Activation ceinture pelvienne", cool: "Étirements fessiers et iliopsoas",
          ex: [["Squat bilatéral", "10 répétitions", "Amplitude sans douleur : on descend un peu plus chaque semaine."], ["Step-up sur marche", "10 répétitions par jambe"], ["Fente arrière", "8 répétitions par jambe"],
               ["Marche latérale élastique"], ["Extension de genou assis"], ["Pont fessier unilatéral", "10 répétitions par jambe"]] },
        { t: "Contrôle et retour aux activités", f: "Le genou bien aligné sur une jambe, comme dans les escaliers et la course.",
          warm: "Échauffement global progressif", cool: "Étirements membres inférieurs",
          ex: [["Descente de marche", "8 répétitions par jambe"], ["Squat bulgare", "8 répétitions par jambe"], ["Soulevé de terre roumain unipodal", "8 répétitions par jambe"],
               ["Toucher en étoile unipodal"], ["Squat élastique aux genoux"], ["Élévation des talons", "15 répétitions"]] }
      ],
      cards: [
        { t: "Un genou qui se soigne bien", b: "La douleur à l'avant du genou est très fréquente. Elle s'améliore le plus souvent avec des exercices réguliers des cuisses et des hanches, et en adaptant les activités qui chargent beaucoup le genou pendant quelques semaines. Il faut en général 6 à 12 semaines." },
        { t: "La douleur, votre repère", b: "Pendant les exercices, une douleur faible est acceptée." + PAIN_RULE },
        { t: "Ce qui charge le genou", b: "Descendre les escaliers, s'accroupir profondément, rester longtemps assis genoux pliés, courir en descente, sauter. On ne les supprime pas : on les <b>réduit</b> un temps, puis on les reprend progressivement." },
        { t: "Quand consulter", b: "Genou qui se bloque ou se dérobe, gonflement, douleur après un choc ou une torsion, genou chaud et rouge, ou fièvre." }
      ]
    },
    dos: {
      label: "Lombalgie", title: "Programme dos", code: "D", color: "var(--purple)",
      short: "Mal au bas du dos : bouger à nouveau en confiance",
      who: "Pour une douleur du bas du dos sans signe de gravité, récente ou qui revient régulièrement.",
      perWeek: 3, days: { 1: 0, 3: 1, 5: 2 },
      sessions: [
        { t: "Bouger sans crainte", f: "Remettre le dos en mouvement dans toutes les directions, en douceur.",
          warm: "Activation transverse et mobilisation", cool: "Étirements rachidiens et cohérence cardiaque",
          ex: [["Chat-vache", "10 répétitions"], ["Rotation thoracique à quatre pattes"], ["Essuie-glace genoux pliés"],
               ["Extension lombaire couché sur le ventre"], ["Pont de hanche", "12 répétitions"], ["Dead bug"]] },
        { t: "Gainage et contrôle", f: "Un tronc solide et des hanches mobiles, pour protéger le dos sans le bloquer.",
          warm: "Activation transverse et mobilisation", cool: "Étirements fessiers et iliopsoas",
          ex: [["Superman bras-jambe opposés"], ["Side plank sur genoux", "20 secondes par côté"], ["Gainage frontal sur genoux", "30 secondes"],
               ["Pallof press"], ["Pont en marche"], ["Bear plank"]] },
        { t: "Le dos au quotidien", f: "Se pencher, se lever, porter : les gestes de tous les jours, avec la bonne technique.",
          warm: "Échauffement global progressif", cool: "Étirements globaux et Savasana",
          ex: [["Good morning au bâton", "10 répétitions", "La charnière de hanche : le geste pour ramasser un objet sans plier le dos."], ["Assis-debout de chaise", "10 répétitions"], ["Goblet squat"],
               ["Marche du fermier sur place"], ["Rowing un bras appui chaise"], ["Fente psoas dynamique"]] }
      ],
      cards: [
        { t: "Le dos est solide", b: "La très grande majorité des douleurs du bas du dos ne viennent pas d'une lésion grave. Elles s'améliorent en quelques semaines, et <b>bouger aide à guérir</b> : rester allongé longtemps ralentit la récupération." },
        { t: "Avoir mal ne veut pas dire s'abîmer", b: "En reprenant le mouvement, la douleur peut augmenter un peu sans que ce soit dangereux. Restez dans une douleur supportable." + PAIN_RULE },
        { t: "Au quotidien", b: "Marchez tous les jours, changez souvent de position, reprenez vos activités progressivement. Il n'y a pas de position interdite : c'est rester figé longtemps qui pose problème." },
        { t: "Consultez sans attendre si", b: "<b>En urgence</b> : perte de contrôle des urines ou des selles, perte de sensibilité entre les cuisses, faiblesse qui s'installe dans une jambe. <b>Rapidement</b> : fièvre, perte de poids inexpliquée, douleur intense la nuit qui ne change pas avec la position, douleur après une chute, antécédent de cancer." }
      ]
    },
    cheville: {
      label: "Cheville après entorse", title: "Programme cheville", code: "E", color: "var(--amber)",
      short: "Entorse de cheville : retrouver équilibre, force et ressort",
      who: "Après une entorse de cheville, quand vous marchez sans boiter. Aussi pour les chevilles qui « tournent » souvent.",
      perWeek: 3, days: { 1: 0, 3: 1, 5: 2 },
      sessions: [
        { t: "Mobilité et équilibre", f: "Retrouver l'amplitude de la cheville et la stabilité sur un pied.",
          warm: "Mobilisation articulaire progressive", cool: "Étirements membres inférieurs",
          ex: [["Fente de cheville au mur", "10 répétitions par jambe"], ["Élévation des talons", "15 répétitions"], ["Marche sur les talons"],
               ["Équilibre unipodal", "30 secondes par jambe"], ["Tandem talon-pointe"]] },
        { t: "Force", f: "Les muscles qui empêchent la cheville de tourner, et des mollets solides.",
          warm: "Mobilisation articulaire progressive", cool: "Étirements membres inférieurs",
          ex: [["Éversion à l'élastique", "15 répétitions par jambe"], ["Élévation des talons unipodale", "10 répétitions par jambe"], ["Élévation des talons genoux fléchis", "15 répétitions"],
               ["Unipodal sur coussin"], ["Toucher en étoile unipodal"], ["Step-up sur marche", "10 répétitions par jambe"]] },
        { t: "Retour aux sauts", f: "Réapprendre à la cheville à amortir et à réagir, avant de reprendre le sport.",
          warm: "Échauffement global progressif", cool: "Étirements membres inférieurs",
          ex: [["Unipodal yeux fermés"], ["Petits sauts sur place", "20 répétitions"], ["Sauts sur une jambe", "8 répétitions par jambe", "Seulement si vous tenez 30 secondes sur un pied et faites 15 élévations de talon sur une jambe sans douleur."],
               ["Skater latéral sans saut"], ["Excentrique mollet sur marche"], ["Fente latérale avec toucher sol"]] }
      ],
      cards: [
        { t: "Pourquoi rééduquer", b: "Après une entorse, l'équilibre et les muscles qui stabilisent la cheville restent affaiblis, même quand la douleur a disparu. C'est ce qui explique les entorses à répétition. Un travail d'équilibre régulier réduit nettement le risque de récidive." },
        { t: "Dans quel ordre", b: "D'abord marcher sans boiter, puis l'équilibre, puis la force, et seulement ensuite les sauts. Avant de sauter : tenir 30 secondes sur un pied et faire 15 élévations de talon sur une jambe, sans douleur." },
        { t: "La douleur, votre repère", b: PAIN_RULE },
        { t: "Quand consulter", b: "Impossible de faire quatre pas en appui après l'entorse, douleur quand on appuie sur l'os de la cheville ou sur le bord externe du pied, gonflement important qui ne diminue pas, ou cheville qui continue à se dérober." }
      ]
    }
  };
  var ORDER = ["coureur", "genou", "dos", "cheville"];
  // Identité de chaque mode : pictogramme (traits), couleurs, phrase d'accueil
  var SV = function (p) { return "<svg viewBox='0 0 48 48' fill='none' stroke='currentColor' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + p + "</svg>"; };
  var ICON = {
    general: SV("<circle cx='24' cy='9' r='4.5'/><path d='M24 15v15M14 21l10 3 10-3M18 44l6-14 6 14'/>"),
    coureur: SV("<circle cx='30' cy='8' r='4.5'/><path d='M27 15l-7 9 8 5-3 12M20 24l-8-2M27 15l7 7 8-1M28 29l9 8'/><path d='M4 30h7M2 37h8' opacity='.55'/>"),
    genou: SV("<path d='M18 4l4 18M30 44l-6-20'/><circle cx='24' cy='23' r='5.5'/><path d='M14 23h-6M40 23h-6' opacity='.55'/>"),
    dos: SV("<rect x='19' y='4' width='10' height='7' rx='3'/><rect x='18' y='14' width='12' height='7' rx='3'/><rect x='18' y='24' width='12' height='7' rx='3'/><rect x='19' y='34' width='10' height='8' rx='3'/>"),
    cheville: SV("<path d='M20 4v20c0 6-2 10-8 13l-4 3c-2 2-1 5 2 5h24c3 0 4-3 3-6l-3-6c-1-3-2-6-2-9V4'/><circle cx='27' cy='29' r='2.5'/>")
  };
  var MODE = {
    coureur: { a: "#FF5A36", b: "#E2304F", hi: "Mode coureur activé", sub: "2 séances par semaine et votre journal de course" },
    genou: { a: "#14B8A6", b: "#0B7F8C", hi: "Programme genou activé", sub: "Calmer, renforcer, puis reprendre vos activités" },
    dos: { a: "#7C5CFF", b: "#4B2FD6", hi: "Programme dos activé", sub: "Bouger à nouveau, en confiance" },
    cheville: { a: "#F08A1C", b: "#C2410C", hi: "Programme cheville activé", sub: "Équilibre, force, puis retour aux sauts" },
    general: { a: "#5867FF", b: "#3341E0", hi: "Programme général", sub: "Tout le corps, 5 séances par semaine" }
  };

  /* ════════ Visibilité et choix ════════ */
  function isAdmin() { return !!(window.fbUser && fbUser.isAdmin); }
  function published() { return (window.KineOfficiel && KineOfficiel.themes) ? KineOfficiel.themes() : {}; }
  function visible(id) { return !!published()[id]; }
  function canSee(id) { return !!THEMES[id] && (visible(id) || isAdmin()); }
  function available() { return ORDER.filter(canSee); }
  function active() { var id = get(KEY); return id && canSee(id) ? id : null; }
  function ids(id) { var c = THEMES[id].code.toLowerCase(); return THEMES[id].sessions.map(function (_, i) { return c + i; }); }   // « c0 », « g1 », « e2 »…
  function schedule() {
    var id = active(); if (!id) return null;
    var T = THEMES[id], o = {}, k = ids(id);
    if (typeof SEQ_DAYS === "undefined" || !SEQ_DAYS[k[0]]) return null;   // séances pas encore en place
    Object.keys(T.days).forEach(function (d) { o[d] = k[T.days[d]]; });
    return o;
  }

  // Les séances du programme actif remplacent celles du programme général dans SEQ_DAYS
  var GENERAL = null;
  function exercise(name, label, note) {
    var e = window.KineOfficiel && KineOfficiel.asExercise ? KineOfficiel.asExercise(name) : null;
    if (!e) return null;
    e = window.KineOfficiel.patch ? KineOfficiel.patch(e) : e;
    if (e.phase === "work" || !e.phase) { e.phase = "work"; e.series = 3; e.restAfter = 60; if (label) e.repsLabel = label; }
    if (note) e.tip = note + (e.tip ? " " + e.tip : "");
    return e;
  }
  function apply() {
    if (typeof SEQ_DAYS === "undefined") return;
    if (!GENERAL) GENERAL = Object.keys(SEQ_DAYS);
    // on retire les séances d'un programme ciblé précédent
    Object.keys(SEQ_DAYS).forEach(function (k) { if (GENERAL.indexOf(k) < 0) delete SEQ_DAYS[k]; });
    var id = active();
    try { document.documentElement.setAttribute("data-mode", id || "general"); } catch (e) {}
    if (!id) return;
    var T = THEMES[id], k = ids(id), days = {};
    T.sessions.forEach(function (s, i) {
      var list = [exercise(s.warm)].concat(s.ex.map(function (x) { return exercise(x[0], x[1], x[2]); }), [exercise(s.cool)]).filter(Boolean);
      days[k[i]] = { label: T.code + (i + 1) + " — " + s.t, color: T.color, exercises: list, theme: id, focus: s.f };
    });
    GENERAL.forEach(function (g) { delete SEQ_DAYS[g]; });   // le programme officiel les remet si le patient revient au général
    Object.keys(days).forEach(function (d) { SEQ_DAYS[d] = days[d]; });
  }
  function rerender() {
    try { if (typeof renderAll === "function") renderAll(); } catch (e) {}
    try { if (window.KineLayout) KineLayout.render(); } catch (e) {}
  }
  // Chaque programme garde sa propre progression : on peut passer de l'un à l'autre et revenir sans repartir à zéro
  function jget(k, d) { try { var v = JSON.parse(get(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function choose(id, quiet) {
    var prev = get(KEY) || "general", next = id || "general";
    closeSheet();
    if (prev === next) return;
    var st = jget("kf-mode-start", {});
    st[prev] = { s: get("kf-start") || "", r: get("kf-reset") || "" };
    var nx = st[next] || { s: "", r: "" };
    set("kf-start", nx.s); set("kf-reset", nx.r);
    try { localStorage.setItem("kf-mode-start", JSON.stringify(st)); } catch (e) {}
    set(KEY, id || null);
    if (window.KineOfficiel && KineOfficiel.reapply) KineOfficiel.reapply(); else apply();
    mark(); rerender();
    if (!quiet) fx(next);
    if (window.KineStats) KineStats.ev("p", "programme:" + next);
  }
  // L'interface prend la couleur du programme
  function mark() { var id = active(); document.documentElement.setAttribute("data-mode", id || "general"); }
  // Animation au centre de l'écran quand on change de programme
  function fx(id) {
    var M = MODE[id] || MODE.general, seen = jget("kf-mode-seen", {}), first = id !== "general" && !seen[id];
    var old = $("th-fx"); if (old) old.remove();
    var el = document.createElement("div"); el.id = "th-fx"; el.className = "th-fx" + (first ? " first" : ""); el.setAttribute("role", "status");
    el.style.setProperty("--ma", M.a); el.style.setProperty("--mb", M.b);
    el.innerHTML = "<div class='th-fx-lines'><i></i><i></i><i></i><i></i><i></i></div><div class='th-fx-in'><div class='th-fx-ic'>" + (ICON[id] || ICON.general) + "</div>" +
      "<b>" + esc(M.hi) + "</b><span>" + esc(M.sub) + "</span>" +
      (first ? "<small>Des exercices généraux, à suivre sur les conseils de votre kiné : ils ne remplacent pas une consultation.</small>" : "") + "</div>";
    document.body.appendChild(el);
    try { if (navigator.vibrate) navigator.vibrate([12, 40, 18]); } catch (e) {}
    var done = function () { el.classList.add("out"); setTimeout(function () { el.remove(); }, 450); };
    el.onclick = done;
    setTimeout(done, first ? 3200 : 1700);
    if (first) { seen[id] = 1; try { localStorage.setItem("kf-mode-seen", JSON.stringify(seen)); } catch (e) {} }
  }

  /* ════════ Écrans ════════ */
  function sheet() {
    var el = $("th-sheet");
    if (!el) { el = document.createElement("div"); el.id = "th-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function closeSheet() { var el = $("th-sheet"); if (el) el.classList.remove("open"); }
  var WARN = "<div class='th-warn'><b>À suivre sur les conseils de votre kiné.</b> Ces programmes sont généraux : ils ne remplacent pas un bilan ni une consultation. En cas de doute, ou si la douleur augmente, demandez-lui.</div>";
  function picker() {
    var cur = active(), list = available();
    var row = function (id, T) {
      var on = (cur || "") === (id || "");
      return "<button class='th-opt" + (on ? " on" : "") + "' onclick=\"KineTheme.choose(" + (id ? "'" + id + "'" : "null") + ")\">" +
        "<span class='th-dot' style='background:" + (T ? T.color : "var(--blue)") + "'></span><span class='th-opt-t'><b>" + esc(T ? T.label : "Programme général") + (on ? " · en cours" : "") + "</b>" +
        "<small>" + esc(T ? T.short + ". " + T.perWeek + " séances par semaine." : "Tout le corps, 5 séances par semaine.") + "</small>" +
        (T && isAdmin() && !visible(id) ? "<em>Masqué pour les patients</em>" : "") + "</span><span aria-hidden='true'>›</span></button>";
    };
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineTheme.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Choisir mon programme</div><div class='kf-sub'>Le programme choisi remplace vos séances de la semaine. Vous pouvez revenir au programme général à tout moment.</div></div>" +
      WARN + row(null, null) + list.map(function (id) { return row(id, THEMES[id]); }).join("") +
      "<p class='kf-sub'>Changer de programme repart en semaine 1. Vos séances déjà faites restent dans votre suivi.</p></div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function info(id) {
    id = id || active(); var T = THEMES[id]; if (!T) return;
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineTheme.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + esc(T.title) + "</div><div class='kf-sub'>" + esc(T.who) + "</div></div>" + WARN +
      "<div class='th-plan'><b>" + T.perWeek + " séances par semaine, 4 semaines</b>" + T.sessions.map(function (s, i) {
        return "<div><span>" + T.code + (i + 1) + "</span><p><strong>" + esc(s.t) + "</strong>" + esc(s.f) + "</p></div>"; }).join("") + "</div>" +
      T.cards.map(function (c) { return "<details class='th-card'><summary>" + esc(c.t) + "</summary><div>" + c.b + "</div></details>"; }).join("") +
      (T.runLog && window.KineCourse ? "<button class='lx-cta' onclick='KineTheme.close();KineCourse.open()'>Mon journal de course</button>" : "") + "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  // Bandeau en haut de l'onglet Programme : programme en cours, et accès au choix
  function bannerHtml() {
    var cur = active(), list = available();
    if (!cur && !list.length) return "";
    var T = cur && THEMES[cur];
    var pill = function (id) {
      var on = (cur || "general") === id, M = MODE[id], lab = id === "general" ? "Général" : THEMES[id].label.replace(" après entorse", "").replace(" douloureux", "");
      return "<button class='th-pill" + (on ? " on" : "") + "' style='--ma:" + M.a + ";--mb:" + M.b + "' onclick=\"KineTheme.choose(" + (id === "general" ? "null" : "'" + id + "'") + ")\" aria-pressed='" + on + "'>" +
        "<span class='th-pi'>" + ICON[id] + "</span>" + esc(lab) + (id !== "general" && isAdmin() && !visible(id) ? "<em>masqué</em>" : "") + "</button>";
    };
    return "<div class='th-switch'><div class='th-sw-h'><span>Mon programme</span><button onclick='KineTheme.picker()'>Détails</button></div>" +
      "<div class='th-pills'>" + ["general"].concat(list).map(pill).join("") + "</div></div>" +
      (T ? "<div class='th-links'><button onclick='KineTheme.info()'>Comprendre ce programme</button>" + (T.runLog && window.KineCourse ? "<button onclick='KineCourse.open()'>Mon journal de course</button>" : "") + "</div>" : "");
  }
  // Petite étiquette du mode en cours, en haut de l'accueil
  function chipHtml() {
    var cur = active(); if (!cur) return "";
    var M = MODE[cur];
    return "<button class='th-chip' style='--ma:" + M.a + ";--mb:" + M.b + "' onclick=\"showPage('guide')\"><span class='th-pi'>" + ICON[cur] + "</span>" + esc(THEMES[cur].label) + "</button>";
  }
  // Accueil, programme coureur : la sortie du jour se note en un geste, et la question du lendemain matin
  function homeHtml() {
    var id = active(); if (!id || !THEMES[id].runLog || !window.KineCourse) return "";
    var q = KineCourse.pending(), L = KineCourse.load();
    return "<button class='th-run" + (q ? " ask" : "") + "' onclick='KineCourse.open()'><span><b>" + (q ? "Et ce matin, la douleur ?" : "Journal de course") + "</b><small>" +
      (q ? "Notez-la pour votre dernière sortie : c'est le meilleur repère." : Math.round(L.cur.min) + " min de course cette semaine. Touchez pour noter une sortie.") + "</small></span><span aria-hidden='true'>›</span></button>";
  }
  function perWeek() { var id = active(); return id ? THEMES[id].perWeek : 5; }

  // Interrupteurs dans l'Espace kiné (programme officiel)
  function adminHtml(themesDraft) {
    return ORDER.map(function (id) {
      var T = THEMES[id], on = !!themesDraft[id];
      return "<label class='th-tg'><span><b>" + esc(T.label) + "</b><small>" + esc(T.short) + "</small></span>" +
        "<input type='checkbox'" + (on ? " checked" : "") + " onchange='KineOfficiel.theme(\"" + id + "\",this.checked)'><i aria-hidden='true'></i></label>";
    }).join("") + "<button class='v2-row' onclick='KineTheme.picker()'><b>Tester un programme sur ce téléphone</b><span>›</span></button>";
  }

  function init() {
    apply(); mark(); rerender();
    window.addEventListener("kf-auth", function () { if (window.KineOfficiel && KineOfficiel.reapply) KineOfficiel.reapply(); else apply(); mark(); rerender(); });
  }
  if (document.readyState === "complete") setTimeout(init, 0); else window.addEventListener("load", function () { setTimeout(init, 0); });

  return { THEMES: THEMES, ORDER: ORDER, apply: apply, active: active, schedule: schedule, available: available, choose: choose, picker: picker, info: info,
           close: closeSheet, bannerHtml: bannerHtml, chipHtml: chipHtml, homeHtml: homeHtml, fx: fx, perWeek: perWeek, adminHtml: adminHtml, visible: visible };
})();
window.KineTheme = KineTheme;
