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
        desc: "Debout, pieds à largeur de hanches. Fais de petits sauts rapides sur l'avant des pieds, genoux presque tendus, comme un ressort. Les talons ne touchent pas le sol. Réception souple et silencieuse.",
        cue: "Petits rebonds sur l'avant des pieds, comme un ressort.", err: "Ne saute pas haut : ce sont les chevilles qui travaillent, pas les cuisses.",
        tip: "Plus facile : 10 sauts, une pause, puis 10 sauts. Plus dur : en avançant et en reculant.", stop: "Arrêt si douleur aux tibias, au tendon d'Achille ou sous le pied." },
      { name: "Sauts sur une jambe", group: "mollet", color: 3, kit: [], repsLabel: "8 répétitions par jambe",
        desc: "Sur une jambe, genou légèrement fléchi. Fais un petit saut sur place, réceptionne-toi sur l'avant du pied, genou souple et dans l'axe du pied, puis stabilise-toi une seconde avant le suivant.",
        cue: "Réception douce, genou dans l'axe du pied.", err: "Le genou ne doit pas partir vers l'intérieur à la réception.",
        tip: "Commence près d'un mur pour te rattraper. Plus dur : petits sauts vers l'avant et l'arrière.", stop: "Arrêt si douleur à la cheville, au genou ou au tendon d'Achille, ou si tu perds l'équilibre à chaque saut." },
      { name: "Fente de cheville au mur", group: "mobilite", color: 1, kit: ["un mur libre"], repsLabel: "10 répétitions par jambe",
        desc: "Face à un mur, mains posées dessus, un pied devant à environ 10 cm du mur, l'autre derrière. Sans décoller le talon avant, avance le genou vers le mur jusqu'à le toucher, puis reviens. Si c'est facile, recule un peu le pied avant.",
        cue: "Le talon avant reste collé au sol, le genou va vers le mur.", err: "Le talon avant ne doit pas se soulever.",
        tip: "Note la distance entre le pied et le mur où le genou touche encore : c'est un bon repère de progrès, à comparer avec l'autre côté.", stop: "Arrêt si douleur vive à l'avant de la cheville." },
      { name: "Éversion à l'élastique", group: "mollet", color: 1, kit: ["un élastique", "une chaise"], repsLabel: "15 répétitions par jambe",
        desc: "Assis, pied à plat, un élastique autour de l'avant du pied, tenu ou accroché du côté intérieur. Le talon reste au sol : tourne l'avant du pied vers l'extérieur contre l'élastique, puis reviens lentement.",
        cue: "Le talon reste posé, c'est l'avant du pied qui tourne vers l'extérieur.", err: "La jambe ne tourne pas : seul le pied bouge.",
        tip: "Plus dur : élastique plus tendu, ou retour en 3 secondes.", stop: "Arrêt si douleur vive sur le côté externe de la cheville." },
      { name: "Descente de marche", group: "genou", color: 2, kit: ["une marche"], repsLabel: "8 répétitions par jambe",
        desc: "Debout sur une marche, sur une jambe, l'autre pied dans le vide sur le côté. Plie lentement le genou d'appui jusqu'à effleurer le sol avec le talon libre, puis remonte. Le genou reste dans l'axe du pied, le bassin horizontal.",
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
        { t: "Trop, trop vite", b: "La plupart des blessures de course viennent d'une hausse trop rapide : plus de kilomètres, plus vite, plus de dénivelé, de nouvelles chaussures. Change <b>un seul paramètre à la fois</b>, et prévois une semaine plus légère toutes les 3 ou 4 semaines. Ton journal de course te prévient si ça monte trop vite." },
        { t: "La douleur, ton repère", b: "Une petite gêne n'est pas un danger. Ce qui compte : son intensité et le lendemain matin." + PAIN_RULE },
        { t: "Pourquoi ces deux séances", b: "Chez des coureurs débutants, deux séances de renforcement des hanches et du tronc par semaine ont réduit d'environ un tiers les blessures de surmenage (essai publié en 2024). Fais-les un jour sans course, ou après une sortie facile, jamais juste avant une sortie intense." },
        { t: "La cadence", b: "Faire des pas un peu plus courts et un peu plus nombreux (5 à 10 % de pas en plus par minute) diminue les contraintes sur le genou et la hanche. À essayer sur des sorties faciles, progressivement." },
        { t: "Les chaussures", b: "Choisis avant tout celles qui sont <b>confortables</b> pour toi. Changer de modèle, surtout pour plus léger ou plus plat, se fait progressivement, sur plusieurs semaines." },
        { t: "Quand consulter", b: "Douleur qui te fait boiter, douleur précise sur un os qui fait mal quand on appuie dessus, gonflement, douleur la nuit, ou douleur qui dure plus de deux semaines malgré une baisse de l'entraînement." }
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
          ex: [["Chaise contre le mur", "30 secondes", "Descends seulement jusqu'où la douleur reste à 3 sur 10 au maximum."], ["Extension terminale du genou"], ["Relevé de jambe tendue couché"],
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
        { t: "La douleur, ton repère", b: "Pendant les exercices, une douleur faible est acceptée." + PAIN_RULE },
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
        { t: "Avoir mal ne veut pas dire s'abîmer", b: "En reprenant le mouvement, la douleur peut augmenter un peu sans que ce soit dangereux. Reste dans une douleur supportable." + PAIN_RULE },
        { t: "Au quotidien", b: "Marche tous les jours, change souvent de position, reprends tes activités progressivement. Il n'y a pas de position interdite : c'est rester figé longtemps qui pose problème." },
        { t: "Consulte sans attendre si", b: "<b>En urgence</b> : perte de contrôle des urines ou des selles, perte de sensibilité entre les cuisses, faiblesse qui s'installe dans une jambe. <b>Rapidement</b> : fièvre, perte de poids inexpliquée, douleur intense la nuit qui ne change pas avec la position, douleur après une chute, antécédent de cancer." }
      ]
    },
    cheville: {
      label: "Cheville après entorse", title: "Programme cheville", code: "E", color: "var(--amber)",
      short: "Entorse de cheville : retrouver équilibre, force et ressort",
      who: "Après une entorse de cheville, quand tu marches sans boiter. Aussi pour les chevilles qui « tournent » souvent.",
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
          ex: [["Unipodal yeux fermés"], ["Petits sauts sur place", "20 répétitions"], ["Sauts sur une jambe", "8 répétitions par jambe", "Seulement si tu tiens 30 secondes sur un pied et faites 15 élévations de talon sur une jambe sans douleur."],
               ["Skater latéral sans saut"], ["Excentrique mollet sur marche"], ["Fente latérale avec toucher sol"]] }
      ],
      cards: [
        { t: "Pourquoi rééduquer", b: "Après une entorse, l'équilibre et les muscles qui stabilisent la cheville restent affaiblis, même quand la douleur a disparu. C'est ce qui explique les entorses à répétition. Un travail d'équilibre régulier réduit nettement le risque de récidive." },
        { t: "Dans quel ordre", b: "D'abord marcher sans boiter, puis l'équilibre, puis la force, et seulement ensuite les sauts. Avant de sauter : tenir 30 secondes sur un pied et faire 15 élévations de talon sur une jambe, sans douleur." },
        { t: "La douleur, ton repère", b: PAIN_RULE },
        { t: "Quand consulter", b: "Impossible de faire quatre pas en appui après l'entorse, douleur quand on appuie sur l'os de la cheville ou sur le bord externe du pied, gonflement important qui ne diminue pas, ou cheville qui continue à se dérober." }
      ]
    }
  };

  /* ════════ Salle de sport : renforcement général et retour au sport (genou, épaule, dos) ════════
     Trois séances Push, Pull, Legs enchaînées dans l'ordre, 2, 3 ou 4 fois par semaine au choix du patient.
     Exercices avec charge : [nom, répétitions, note, { r: [min, max], rest: secondes, inc: kg, s: séries }].
     Le carnet de charges (kine-salle.js) propose la charge du jour et la fait progresser. */
  var BIG = { r: [6, 10], rest: 150, inc: 2.5 }, MID = { r: [8, 12], rest: 120, inc: 2.5 }, SMALL = { r: [10, 15], rest: 90, inc: 1 }, DB = { r: [8, 12], rest: 120, inc: 1 };
  var GYM_CARDS = function (extra) {
    return [
      { t: "La charge de départ", b: "Elle se fixe <b>avec ton kiné</b>, au cabinet ou lors de ta première séance en salle. À défaut, choisis une charge que tu peux soulever 12 fois en gardant encore 2 répétitions en réserve. Tu la notes une fois : l'application s'occupe ensuite de la faire progresser." },
      { t: "Comment ça progresse", b: "On vise une fourchette de répétitions, par exemple 8 à 12. Quand tu atteins le haut de la fourchette à <b>toutes</b> les séries, avec une douleur de 3 sur 10 au maximum, la charge augmente un peu à la séance suivante. Sinon, on garde la charge et on cherche une répétition de plus." },
      { t: "Les répétitions en réserve", b: "Après chaque série, note combien de répétitions tu aurais encore pu faire proprement. <b>2 ou 3 en réserve</b>, c'est l'idéal : assez dur pour progresser, sans aller à l'échec. 0, c'est que la charge est trop lourde pour l'instant." },
      { t: "La douleur, ton repère", b: "Note-la après chaque série." + PAIN_RULE }
    ].concat(extra || []);
  };
  // Exercices de salle les plus utilisés, avec leur fourchette de répétitions et la marche de progression
  var X = {
    sq: ["Squat à la barre", "6 à 10 répétitions", null, BIG],
    rdl: ["Soulevé de terre roumain à la barre", "8 à 10 répétitions", null, { r: [8, 10], rest: 150, inc: 2.5 }],
    press: ["Presse à cuisses", "8 à 12 répétitions", null, MID],
    press1: ["Presse à une jambe", "8 à 12 répétitions par jambe", null, { r: [8, 12], rest: 90, inc: 2.5 }],
    lext: ["Leg extension", "10 à 15 répétitions", null, { r: [10, 15], rest: 90, inc: 2.5 }],
    lextL: ["Leg extension amplitude limitée", "10 à 15 répétitions", "Amplitude complète seulement quand ton kiné l'autorise.", { r: [10, 15], rest: 90, inc: 2.5 }],
    lcurl: ["Leg curl assis", "10 à 15 répétitions", null, { r: [10, 15], rest: 90, inc: 2.5 }],
    hip: ["Hip thrust à la barre", "8 à 12 répétitions", null, MID],
    lunge: ["Fentes avec haltères", "8 à 12 répétitions par jambe", null, DB],
    calf: ["Mollets à la presse", "12 à 20 répétitions", null, { r: [12, 20], rest: 90, inc: 5 }],
    abd: ["Abduction de hanche à la poulie", "12 à 15 répétitions par jambe", null, SMALL],
    add: ["Adduction de hanche à la poulie", "12 à 15 répétitions par jambe", null, SMALL],
    sled: ["Poussée de traîneau", "15 mètres", null, { r: null, rest: 120, inc: 10 }],
    bench: ["Développé couché aux haltères", "8 à 12 répétitions", null, DB],
    ohp: ["Développé épaules aux haltères", "8 à 12 répétitions", null, DB],
    lm: ["Développé landmine à un bras", "8 à 12 répétitions par bras", null, { r: [8, 12], rest: 90, inc: 2.5 }],
    tri: ["Triceps à la poulie haute", "12 à 15 répétitions", null, SMALL],
    lat: ["Élévation latérale", "12 à 15 répétitions", null, SMALL],
    pull: ["Tirage vertical", "8 à 12 répétitions", null, MID],
    row: ["Tirage horizontal à la poulie", "8 à 12 répétitions", null, MID],
    row1: ["Rowing un bras à l'haltère", "8 à 12 répétitions par bras", null, DB],
    face: ["Face pull à la poulie", "12 à 15 répétitions", null, SMALL],
    sap: ["Tirage bras tendus à la poulie", "12 à 15 répétitions", null, SMALL],
    curl: ["Curl biceps", "10 à 15 répétitions", null, SMALL],
    re: ["Rotation externe à la poulie", "12 à 15 répétitions par bras", null, SMALL],
    ri: ["Rotation interne à la poulie", "12 à 15 répétitions par bras", null, SMALL],
    pallof: ["Pallof press à la poulie", "10 répétitions par côté", null, { r: [10, 12], rest: 60, inc: 1 }],
    farm: ["Marche du fermier lourde", "30 mètres", null, { r: null, rest: 90, inc: 2 }],
    hyp: ["Extension lombaire au banc à 45°", "10 à 15 répétitions", null, { r: [10, 15], rest: 90, inc: 2.5 }],
    side: ["Planche latérale complète", "30 secondes par côté"],
    cop: ["Planche Copenhague genou", "20 secondes par côté"],
    hop: ["Petits sauts sur place", "20 répétitions", "Seulement si ton kiné a validé la reprise des sauts."],
    hop1: ["Sauts sur une jambe", "8 répétitions par jambe", "Quand les petits sauts passent sans douleur ni appréhension."],
    deadbug: ["Dead bug"]
  };
  var x = function (k, note) { var e = X[k].slice(); if (note) e[2] = note; return e; };
  // Push, Pull, Legs : on enchaîne les trois séances dans l'ordre, au rythme choisi (2, 3 ou 4 fois par semaine)
  var PPL = function (push, pull, legs, f) {
    return [
      { t: "Push", sub: "pousser", f: f[0] || "Pectoraux, épaules et triceps : tous les mouvements où l'on pousse.", warm: "Mobilisation membres supérieurs", cool: "Étirements membres supérieurs", ex: push },
      { t: "Pull", sub: "tirer", f: f[1] || "Dos, arrière des épaules et biceps : tous les mouvements où l'on tire.", warm: "Mobilisation membres supérieurs", cool: "Étirements rachidiens et cohérence cardiaque", ex: pull },
      { t: "Legs", sub: "jambes", f: f[2] || "Cuisses, fessiers et mollets.", warm: "Mobilisation articulaire progressive", cool: "Étirements membres inférieurs", ex: legs }
    ];
  };
  var GYM = {
    salle: {
      label: "Renforcement général", pill: "Général", title: "Salle : renforcement général", code: "S", color: "var(--blue)", gym: true,
      short: "Push, Pull, Legs : tout le corps avec machines et charges",
      who: "Pour se renforcer en salle, en fin de rééducation ou pour entretenir sa forme : les grands mouvements de base, répartis en trois séances (Push, Pull, Legs), avec une charge qui progresse séance après séance.",
      sessions: PPL([x("bench"), x("ohp"), x("lm"), x("lat"), x("tri"), x("pallof")],
                    [x("pull"), x("row"), x("row1"), x("face"), x("sap"), x("curl")],
                    [x("sq"), x("rdl"), x("press"), x("lcurl"), x("calf"), x("side")], []),
      cards: GYM_CARDS([{ t: "Sécurité en salle", b: "Échauffe-toi toujours, commence chaque exercice par une série légère, utilise les sécurités (butées de la cage, du banc) et demande au coach de la salle de te montrer le réglage des machines la première fois." }])
    },
    sgenou: {
      label: "Retour au sport genou", pill: "Genou", title: "Salle : retour au sport genou", code: "R", color: "var(--teal)", gym: true,
      short: "Push, Pull, Legs, avec du travail du genou à chaque séance",
      who: "En fin de rééducation du genou (ligament croisé, ménisque, rotule), quand ton kiné ou ton chirurgien t'autorise le travail en salle. Chaque séance garde deux ou trois exercices pour le genou, et la séance Legs le travaille en entier.",
      sessions: PPL([x("bench"), x("ohp"), x("pull"), x("lextL"), x("calf"), x("cop")],
                    [x("row"), x("row1"), x("face"), x("lcurl"), x("rdl"), x("add")],
                    [x("press"), x("press1"), x("sq", "Seulement si la presse à une jambe passe sans douleur."), x("lunge"), x("abd"), x("sled"), x("hop1")],
                    ["Le haut du corps, plus le quadriceps et le mollet.", "Le dos et les ischio-jambiers, qui protègent le ligament croisé.", "Force, une jambe à la fois, puis impulsions."]),
      cards: GYM_CARDS([{ t: "Avant de reprendre ton sport", b: "La reprise se décide avec ton kiné et ton chirurgien, à partir de tests : force de la cuisse proche de l'autre côté (souvent plus de 90 %), sauts sur une jambe équivalents, genou sec et sans appréhension. Le calendrier seul ne suffit pas." }])
    },
    sepaule: {
      label: "Retour au sport épaule", pill: "Épaule", title: "Salle : retour au sport épaule", code: "P", color: "var(--amber)", gym: true,
      short: "Push, Pull, Legs, avec la coiffe et les omoplates à chaque séance",
      who: "En fin de rééducation de l'épaule (tendinopathie, luxation, chirurgie de la coiffe ou de stabilisation), quand ton kiné t'autorise le travail en salle.",
      sessions: PPL([x("lm"), x("bench", "Descends seulement jusqu'où l'épaule reste confortable."), x("re"), x("tri"), x("ohp", "Seulement si lever le bras ne fait plus mal."), x("pallof")],
                    [x("row"), x("face"), x("ri"), x("sap"), x("row1"), x("pull")],
                    [x("press"), x("rdl"), x("lcurl"), x("lunge"), x("farm"), x("re")],
                    ["Pousser en restant dans une amplitude confortable, la coiffe d'abord.", "Le dos et l'arrière de l'épaule, qui la stabilisent.", "Les jambes, et la marche chargée qui fait travailler les épaules en stabilité."]),
      cards: GYM_CARDS([{ t: "Avant de reprendre ton sport", b: "Surtout pour les sports de lancer, de raquette ou de contact : la reprise se décide avec ton kiné, quand l'épaule est mobile, sans douleur, et que la force en rotation est proche de l'autre côté." }])
    },
    sdos: {
      label: "Retour au sport dos", pill: "Dos", title: "Salle : retour au sport dos", code: "L", color: "var(--purple)", gym: true,
      short: "Push, Pull, Legs, avec un tronc qui résiste à chaque séance",
      who: "Après une lombalgie, quand tu bouges à nouveau sans crainte : reprendre les charges en salle pour un dos solide et des hanches puissantes.",
      sessions: PPL([x("bench"), x("ohp"), x("tri"), x("pallof"), x("side"), x("deadbug")],
                    [x("row"), x("row1"), x("pull"), x("face"), x("hyp"), x("farm")],
                    [x("rdl", "Commence avec la barre seule pour le geste."), x("hip"), x("press", "Le bas du dos reste collé au dossier."), x("lcurl"), x("sled"), x("calf")],
                    ["Pousser avec un tronc gainé.", "Tirer et porter : le dos haut et le tronc qui résiste.", "La charnière de hanche, le geste qui protège le dos."]),
      cards: GYM_CARDS([{ t: "Le dos est fait pour porter", b: "Soulever des charges n'abîme pas un dos qui s'y prépare progressivement : c'est même l'un des meilleurs moyens d'éviter les rechutes. La technique compte, mais la progression compte encore plus." }])
    }
  };
  var GYM_IDS = ["salle", "sgenou", "sepaule", "sdos"];
  function isGym(id) { return GYM_IDS.indexOf(id) >= 0; }
  // Rythme choisi par le patient : 2, 3 ou 4 séances par semaine. Les jours d'entraînement de la semaine (1 = lundi)
  var GYM_DAYS = { 2: [2, 5], 3: [1, 3, 5], 4: [1, 2, 4, 5] };
  function gymFreq() { var f = +get("kf-salle-freq"); return f === 2 || f === 4 ? f : 3; }
  // Fourchette, repos et marche de progression d'un exercice de salle (pour les séances perso et le journal)
  function gymOpts(name) { for (var k in X) if (X[k][0] === name && X[k][3]) return X[k][3]; return null; }
  function gymSetup() { var f = gymFreq(); GYM_IDS.forEach(function (id) { var T = GYM[id]; T.perWeek = f; T.days = {}; THEMES[id] = T; }); }
  gymSetup();
  var ORDER = ["coureur", "genou", "dos", "cheville", "salle", "sgenou", "sepaule", "sdos"];
  // Identité de chaque mode : pictogramme (traits), couleurs, phrase d'accueil
  // Pictogramme de chaque mode : genou, cheville, colonne, chaussure de course, silhouette (pleins, couleur du texte)
  var MICONS = {
  // genou de profil : fémur, rotule, tibia, interligne articulaire
  genou: "<path d='M17 3h11l-1.6 15.5c-.2 2.2-2 3.8-4.2 3.8h-1.4c-2.6 0-4.4-2.4-3.8-4.9z'/>" +
         "<ellipse cx='29.5' cy='24.2' rx='3.6' ry='4.6'/>" +
         "<path d='M17.4 26.4h9.8c1.9 0 3.3 1.7 3 3.6L27.6 45h-9.4l-2.6-15.2c-.3-1.8 1.1-3.4 2.8-3.4z'/>" +
         "<rect x='15' y='23.3' width='13' height='1.6' rx='.8' opacity='.45'/>",
  // cheville et pied de profil, malléole marquée
  cheville: "<path d='M14 3h9v20.5c0 1.6 1 3 2.4 3.6l11.8 4.8c3 1.2 5 4.1 5 7.3V40c0 1.7-1.3 3-3 3H11.2c-2.1 0-3.6-2-3-4l3.3-11.4c.3-1.2.5-2.4.5-3.6z'/>" +
            "<circle cx='17.6' cy='27' r='3.4' fill='none' stroke='rgba(0,0,0,.22)' stroke-width='2'/>",
  // colonne : vertèbres et disques, légère courbure
  dos: "<rect x='17' y='3' width='14' height='6.5' rx='3'/><rect x='16' y='11.5' width='15' height='6.5' rx='3'/><rect x='16.5' y='20' width='15' height='6.8' rx='3'/>" +
       "<rect x='17.5' y='28.8' width='15' height='6.8' rx='3'/><rect x='18.5' y='37.6' width='13' height='7' rx='3.2'/>" +
       "<path d='M12 7h3M11 15h3.5M11.5 23.5h3.6M12.5 32h3.6M13.5 41h3.6' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' opacity='.5'/>",
  // chaussure de course et traits de vitesse
  coureur: "<path d='M15 18c2.2 0 3.6 1.2 4.6 3l1.2 2.4 4.8-1.6 1.4 2.8-4.6 1.8 1.1 2.1 4.7-1.7 1.4 2.8-4.6 1.7c2.4 2.2 6 3.1 10.6 3.3 3.6.2 5.4 2 5.4 4.6v.8c0 1.3-1 2.4-2.4 2.4H11.4C9 36.8 7 34.8 7 32.4V22.2c0-2.3 1.9-4.2 4.2-4.2z'/>" +
           "<rect x='7' y='38.6' width='35.6' height='3.4' rx='1.7'/>" +
           "<path d='M2 21h3M1 27h4' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' opacity='.55'/>",
  // haltère
  salle: "<rect x='3' y='16' width='6' height='16' rx='2'/><rect x='10' y='11' width='7' height='26' rx='2.4'/><rect x='31' y='11' width='7' height='26' rx='2.4'/><rect x='39' y='16' width='6' height='16' rx='2'/>" +
         "<rect x='17' y='21.6' width='14' height='4.8' rx='1.6'/>",
  // épaule : tête de l'humérus, omoplate, bras
  sepaule: "<path d='M8 6c6-1.5 13-1 18 1.6l-3.4 18.2C17 23 11.4 17 8 6z' opacity='.55'/><circle cx='27.5' cy='13.5' r='7.5'/>" +
           "<path d='M24 19.5c2.2 1.4 5.2 1.6 7.6.4L38 41.6c.5 1.8-.8 3.4-2.6 3.4h-2.8c-1.3 0-2.4-.9-2.6-2.2z'/>",
  // tout le corps
  general: "<circle cx='24' cy='7.5' r='4.8'/><path d='M12.5 14.5h23c1.6 0 2.6 1.8 1.7 3.1l-.4.6c-.4.6-1 .9-1.7.9H29.5l-.8 9.4 3.2 13.6c.4 1.7-.9 3.3-2.6 3.3-1.3 0-2.4-.9-2.6-2.2L24.3 31h-.6l-2.4 12.2c-.3 1.3-1.4 2.2-2.6 2.2-1.7 0-3-1.6-2.6-3.3l3.2-13.6-.8-9.4h-5.6c-.7 0-1.3-.3-1.7-.9l-.4-.6c-.9-1.3.1-3.1 1.7-3.1z'/>"
};
  var ICON = {};
  MICONS.sgenou = MICONS.genou; MICONS.sdos = MICONS.dos;
  Object.keys(MICONS).forEach(function (k) { ICON[k] = "<svg viewBox='0 0 48 48' fill='currentColor' aria-hidden='true'>" + MICONS[k] + "</svg>"; });
  var MODE = {
    coureur: { a: "#FF5A36", b: "#E2304F", hi: "Mode coureur activé", sub: "2 séances par semaine et ton journal de course" },
    genou: { a: "#14B8A6", b: "#0B7F8C", hi: "Programme genou activé", sub: "Calmer, renforcer, puis reprendre tes activités" },
    dos: { a: "#7C5CFF", b: "#4B2FD6", hi: "Programme dos activé", sub: "Bouger à nouveau, en confiance" },
    cheville: { a: "#F08A1C", b: "#C2410C", hi: "Programme cheville activé", sub: "Équilibre, force, puis retour aux sauts" },
    general: { a: "#5867FF", b: "#3341E0", hi: "Programme général", sub: "Tout le corps, 5 séances par semaine" },
    salle: { a: "#3B82F6", b: "#1E3A8A", hi: "Mode salle de sport", sub: "Machines et charges, ton carnet fait progresser la charge" },
    sgenou: { a: "#10B9A0", b: "#0F5F6E", hi: "Retour au sport : genou", sub: "Force, contrôle sur une jambe, puis impulsions" },
    sepaule: { a: "#F5A524", b: "#B45309", hi: "Retour au sport : épaule", sub: "Coiffe, omoplates, puis charges au-dessus de la tête" },
    sdos: { a: "#8B5CF6", b: "#4C1D95", hi: "Retour au sport : dos", sub: "Charnière de hanche, tirage et port de charges" }
  };

  /* ════════ Visibilité et choix ════════ */
  function isAdmin() { return !!(window.fbUser && fbUser.isAdmin); }
  function published() { return (window.KineOfficiel && KineOfficiel.themes) ? KineOfficiel.themes() : {}; }
  function visible(id) { return !!published()[id]; }
  function canSee(id) { return !!THEMES[id] && (visible(id) || isAdmin()); }
  // Programmes proposés : ceux que le kiné a publiés (+ celui qu'il teste sur son téléphone, s'il est masqué)
  function available() { var cur = get(KEY); return ORDER.filter(function (id) { return visible(id) || (isAdmin() && id === cur); }); }
  function active() { var id = get(KEY); return id && canSee(id) ? id : null; }
  function ids(id) { var c = THEMES[id].code.toLowerCase(); return THEMES[id].sessions.map(function (_, i) { return c + i; }); }   // « c0 », « g1 », « e2 »…
  function schedule() {
    var id = active(); if (!id) return null;
    var T = THEMES[id], o = {}, k = ids(id);
    if (typeof SEQ_DAYS === "undefined" || !SEQ_DAYS[k[0]]) return null;   // séances pas encore en place
    if (T.gym) {   // salle : Push, Pull, Legs à la suite, la semaine suivante reprend où on s'est arrêté
      // la prochaine séance est celle qui suit la dernière faite (Push, puis Pull, puis Legs), quel que soit le jour
      var f = gymFreq(), slots = GYM_DAYS[f], ss = [], code = T.code, mon = new Date(), now = new Date(), dow = (now.getDay() + 6) % 7;
      try { ss = typeof sessions !== "undefined" && sessions ? sessions : JSON.parse(get("kf-sessions") || "[]"); } catch (e) {}
      mon.setDate(now.getDate() - dow); var monIso = mon.getFullYear() + "-" + ("0" + (mon.getMonth() + 1)).slice(-2) + "-" + ("0" + mon.getDate()).slice(-2);
      var mine = ss.filter(function (x) { return new RegExp("^" + code + "\\d ").test(String(x.seance || "")); });
      var last = mine[0] ? +String(mine[0].seance).charAt(1) - 1 : -1, before = mine.filter(function (x) { return x.date < monIso; }).length;
      var lastBefore = (function () { var m = mine.filter(function (x) { return x.date < monIso; })[0]; return m ? +String(m.seance).charAt(1) - 1 : -1; })();
      slots.forEach(function (d, i) { o[d] = k[(lastBefore + 1 + i) % k.length]; });
      return o;
    }
    Object.keys(T.days).forEach(function (d) { o[d] = k[T.days[d]]; });
    return o;
  }

  // Les séances du programme actif remplacent celles du programme général dans SEQ_DAYS
  var GENERAL = null;
  function exercise(name, label, note, o) {
    var e = window.KineOfficiel && KineOfficiel.asExercise ? KineOfficiel.asExercise(name) : null;
    if (!e) return null;
    e = window.KineOfficiel.patch ? KineOfficiel.patch(e) : e;
    if (e.phase === "work" || !e.phase) { e.phase = "work"; e.series = 3; e.restAfter = 60; if (label) e.repsLabel = label; }
    if (note) e.tip = note + (e.tip ? " " + e.tip : "");
    if (o && e.phase === "work") { e.gym = true; e.restAfter = o.rest || 90; e.gymRange = o.r || null; e.gymInc = o.inc || 2.5; }
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
      var list = [exercise(s.warm)].concat(s.ex.map(function (x) { return exercise(x[0], x[1], x[2], x[3]); }), [exercise(s.cool)]).filter(Boolean);
      days[k[i]] = { label: T.code + (i + 1) + " — " + s.t + (s.sub ? " (" + s.sub + ")" : ""), color: T.color, exercises: list, theme: id, focus: s.f };
      if (T.gym) { days[k[i]].gym = true; days[k[i]].tours = 3; }
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
  // Chaque mode a sa petite scène : Yass traverse l'écran (en courant, avec une canne, en boitant, à cloche-pied, en marchant)
  // et un effet le suit (feu, éclairs de douleur au dos, au genou ou à la cheville, étincelles)
  var SCENE = {
    coureur: { img: "course", n: 12, cyc: 0.42, dur: 1500, fx: "fire" },
    dos: { img: "mode-dos", n: 12, cyc: 1.15, dur: 2300, fx: "bolt", at: [0.42, 0.46] },
    genou: { img: "mode-velo", n: 12, cyc: 0.62, dur: 2400, fx: "none", deco: "bike" },
    cheville: { img: "mode-surf", n: 12, cyc: 1.5, dur: 2500, fx: "spray", deco: "wave" },
    general: { img: "mode-general", n: 12, cyc: 0.8, dur: 1700, fx: "spark" }
  };
  function sceneFx(el, id) {
    var C = SCENE[id]; if (!C) return null;
    var cv = document.createElement("canvas"), y = document.createElement("div");
    cv.className = "th-fire"; y.className = "th-runner"; el.insertBefore(cv, el.firstChild); el.appendChild(y);
    y.style.backgroundImage = "url(assets/lumiere/yass-anim/" + C.img + ".webp)"; y.style.backgroundSize = (C.n * 100) + "% 100%";
    y.style.animation = "none";
    var W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1), c = cv.getContext("2d");
    cv.width = W * dpr; cv.height = H * dpr; c.scale(dpr, dpr);
    var S = Math.min(260, W * 0.66), y0 = H * 0.5 - S * 0.62, t0 = performance.now(), P = [], B = [], raf = 0, alive = true, lastBolt = 0;
    y.style.width = y.style.height = S + "px"; y.style.top = y0 + "px";
    // genou : Yass monte un escalier (le geste qui réveille la douleur) ; cheville : il saute de pierre en pierre
    var RISE = C.deco === "stairs" ? H * 0.26 : 0, yBase = C.deco === "stairs" ? y0 + RISE / 2 : y0, FOOT = 0.93;
    function topAt(k) { return yBase - RISE * k; }
    function kAtFoot(xf) { return Math.max(0, Math.min(1, (xf - S * 0.5 + S) / (W + 2 * S))); }
    var stones = [];
    if (C.deco === "stones") for (var q = 0; q < 12; q++) { var tl = (q + 0.75) * C.cyc * 1000 / C.dur; if (tl > 1) break; stones.push({ x: -S + (W + 2 * S) * tl + S * 0.5, t: tl, hit: false }); }
    function decor(k, now, x, fr, ph) {
      c.globalCompositeOperation = "source-over"; var fade = k > 0.82 ? Math.max(0, (1 - k) / 0.18) : 1;
      if (C.deco === "stairs") {
        var w = 48, M = MODE[id];
        for (var sx = -w; sx < W + w; sx += w) {
          var sy = topAt(kAtFoot(sx + w / 2)) + S * FOOT;
          var g1 = c.createLinearGradient(0, sy, 0, H); g1.addColorStop(0, M.a); g1.addColorStop(1, M.b);
          c.globalAlpha = 0.9 * fade; c.fillStyle = g1; c.fillRect(sx, sy, w + 1, H - sy);
          c.globalAlpha = fade; c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(sx, sy, w + 1, 3);
        }
        c.globalAlpha = 1;
      }
      // genou : un vélo, roues et pédalier synchronisés avec le pédalage de Yass
      if (C.deco === "bike") {
        var M2 = MODE[id], pxm = S / 2.35, U = function (z) { return x + S / 2 + z * pxm; }, V = function (yy) { return y0 + S / 2 - (yy - 0.98) * pxm; };
        var Rw = 0.34 * pxm, rot = (x + S) / Rw, hubs = [[-0.5, 0.34], [0.6, 0.34]], crank = [0.1, 0.36], seat = [-0.07, 0.88], head = [0.46, 0.96];
        c.globalAlpha = fade; c.lineCap = "round"; c.lineJoin = "round";
        hubs.forEach(function (h) {
          var hx = U(h[0]), hy = V(h[1]);
          c.strokeStyle = "#1E2430"; c.lineWidth = 6; c.beginPath(); c.arc(hx, hy, Rw, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = M2.a; c.lineWidth = 2; c.beginPath(); c.arc(hx, hy, Rw - 5, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 1.2;
          for (var sp = 0; sp < 8; sp++) { var an = rot + sp * Math.PI / 4; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(an) * (Rw - 5), hy + Math.sin(an) * (Rw - 5)); c.stroke(); }
        });
        var L2 = function (a, b) { c.beginPath(); c.moveTo(U(a[0]), V(a[1])); c.lineTo(U(b[0]), V(b[1])); c.stroke(); };
        c.strokeStyle = M2.b; c.lineWidth = 6;
        L2(hubs[0], crank); L2(crank, seat); L2(seat, hubs[0]); L2(seat, head); L2(crank, [0.44, 0.86]); L2(head, hubs[1]);
        c.strokeStyle = "#1E2430"; c.lineWidth = 5; L2(head, [0.52, 1.08]); L2([-0.16, 0.9], [0.02, 0.9]);
        var th = 2 * Math.PI * fr / C.n, r2 = 0.17;
        [th, th + Math.PI].forEach(function (a) { c.lineWidth = 4; L2(crank, [crank[0] + r2 * Math.sin(a), crank[1] - r2 * Math.cos(a)]); });
        c.fillStyle = "#1E2430"; c.beginPath(); c.arc(U(crank[0]), V(crank[1]), 6, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
      }
      // cheville : Yass surfe, la planche suit son équilibre, la vague déferle derrière lui
      if (C.deco === "wave") {
        var by = y0 + S * 0.93, bx = x + S / 2, tilt = Math.sin(ph * 2 * Math.PI) * 0.12, M3 = MODE[id];
        c.globalAlpha = fade;
        var crestX = bx - S * 0.55, base = by + 10;
        var gw2 = c.createLinearGradient(0, base - 90, 0, base + 160); gw2.addColorStop(0, "rgba(70,170,255,.95)"); gw2.addColorStop(1, "rgba(20,70,170,.9)");
        c.fillStyle = gw2; c.beginPath(); c.moveTo(-10, base + 170); c.lineTo(-10, base - 20);
        for (var wx2 = -10; wx2 <= W + 10; wx2 += 8) {
          var dd = (wx2 - crestX) / 70, hump = Math.exp(-dd * dd) * 85 * (wx2 < crestX + 40 ? 1 : 0.6);
          c.lineTo(wx2, base - hump + Math.sin(wx2 / 26 + now / 220) * 3);
        }
        c.lineTo(W + 10, base + 170); c.closePath(); c.fill();
        c.fillStyle = "rgba(255,255,255,.85)";   // écume sur la crête
        for (var fz = -3; fz <= 3; fz++) { var fx2 = crestX + fz * 14, fd = (fx2 - crestX) / 70; c.beginPath(); c.arc(fx2, base - Math.exp(-fd * fd) * 85, 7 + Math.random() * 3, 0, Math.PI * 2); c.fill(); }
        c.save(); c.translate(bx, by + 4); c.rotate(tilt);
        c.fillStyle = "#FFFFFF"; c.beginPath(); c.ellipse(0, 0, S * 0.5, 8, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = M3.a; c.fillRect(-S * 0.42, -2, S * 0.84, 4); c.restore();
        if (Math.random() < 0.9) for (var sq = 0; sq < 3; sq++) P.push({ x: bx - S * 0.45, y: by + 4, vx: -(1 + Math.random() * 2.5), vy: -(1 + Math.random() * 2.5), w: 0, r: 2 + Math.random() * 3, l: 1, d: 0.03, k: "w" });
        c.globalAlpha = 1;
      }
      if (C.deco === "stones") {
        c.globalAlpha = fade;
        var wy = y0 + S * FOOT + 4, ph = now / 300;
        var gw = c.createLinearGradient(0, wy - 10, 0, wy + 40); gw.addColorStop(0, "rgba(90,170,255,.55)"); gw.addColorStop(1, "rgba(40,110,220,.15)");
        c.fillStyle = gw; c.beginPath(); c.moveTo(0, wy + 30);
        for (var wx = 0; wx <= W; wx += 12) c.lineTo(wx, wy + Math.sin(wx / 30 + ph) * 3);
        c.lineTo(W, wy + 40); c.lineTo(0, wy + 40); c.fill();
        stones.forEach(function (st) {
          var sink = st.hit ? 2 : 0;
          if (!st.hit && k >= st.t) { st.hit = true; for (var d = 0; d < 10; d++) P.push({ x: st.x + (Math.random() - 0.5) * 40, y: wy, vx: (Math.random() - 0.5) * 3, vy: -(1 + Math.random() * 2.5), w: 0, r: 2 + Math.random() * 2.5, l: 1, d: 0.03, k: "w" }); }
          var gs = c.createRadialGradient(st.x - 8, wy - 6 + sink, 2, st.x, wy + sink, 30); gs.addColorStop(0, "#C9C2B6"); gs.addColorStop(1, "#7D7468");
          c.fillStyle = gs; c.beginPath(); c.ellipse(st.x, wy + sink, 30, 10, 0, 0, Math.PI * 2); c.fill();
        });
        c.globalAlpha = 1;
      }
    }
    function bolt(x, yy) {   // un éclair en zigzag qui part du point douloureux
      var a = Math.random() * Math.PI * 2, L = 26 + Math.random() * 34, pts = [[x, yy]], n = 5;
      for (var i = 1; i <= n; i++) { var d = L * i / n, j = (i < n ? (Math.random() - 0.5) * 16 : 0); pts.push([x + Math.cos(a) * d - Math.sin(a) * j, yy + Math.sin(a) * d + Math.cos(a) * j]); }
      B.push({ p: pts, l: 1 });
    }
    function frame(now) {
      if (!alive) return;
      var t = (now - t0) / C.dur, k = Math.min(1, t), x = -S + (W + 2 * S) * k;
      if (C.fx === "fire") x = -S + (W + 2 * S) * (k < 0.5 ? 2 * k * k * 0.6 + k * 0.4 : k);
      var el0 = Math.max(0, now - t0), fr = Math.floor(el0 / 1000 / C.cyc * C.n) % C.n, ph = (el0 / 1000 / C.cyc) % 1;
      y.style.backgroundPosition = (fr / (C.n - 1) * 100) + "% 0";
      var ty = C.deco === "stairs" ? topAt(k) - y0 : 0;
      y.style.transform = "translate(" + x + "px," + ty + "px)"; if (k >= 1) y.style.display = "none";
      c.clearRect(0, 0, W, H); if (k < 1) decor(k, now, x, fr, ph);
      if (C.fx === "fire" && t < 1.02) for (var n = 0; n < 8; n++) P.push({ x: x + S * (0.2 + Math.random() * 0.3), y: y0 + S * (0.8 + Math.random() * 0.14), vx: -(0.4 + Math.random() * 1.6), vy: -(1.2 + Math.random() * 3.2), w: Math.random() * 6.28, r: 5 + Math.random() * 11, l: 1, d: 0.014 + Math.random() * 0.02, k: "f" });
      if (C.fx === "spark" && t < 1.02) for (var m = 0; m < 3; m++) P.push({ x: x + S * (0.3 + Math.random() * 0.2), y: y0 + S * (0.3 + Math.random() * 0.6), vx: -(0.5 + Math.random()), vy: (Math.random() - 0.5) * 0.8, w: 0, r: 2 + Math.random() * 3.5, l: 1, d: 0.018 + Math.random() * 0.02, k: "s" });
      if (C.fx === "bolt" && t < 1) {
        var ax = x + S * C.at[0], ay = y0 + ty + S * C.at[1];
        if (now - lastBolt > 85) { lastBolt = now; bolt(ax, ay); if (Math.random() < 0.6) bolt(ax, ay); }
        var pr = (now / 380) % 1;   // onde de douleur qui pulse
        c.globalCompositeOperation = "source-over";
        c.strokeStyle = "rgba(255,60,70," + (0.55 * (1 - pr)) + ")"; c.lineWidth = 3; c.beginPath(); c.arc(ax, ay, 8 + 26 * pr, 0, Math.PI * 2); c.stroke();
        var g0 = c.createRadialGradient(ax, ay, 0, ax, ay, 22); g0.addColorStop(0, "rgba(255,70,70,.75)"); g0.addColorStop(1, "rgba(255,70,70,0)");
        c.fillStyle = g0; c.beginPath(); c.arc(ax, ay, 22, 0, Math.PI * 2); c.fill();
      }
      c.globalCompositeOperation = "lighter";
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i]; p.w += 0.25; p.x += p.vx + (p.k === "f" ? Math.sin(p.w) * 0.8 : 0); p.y += p.vy; if (p.k === "f") p.vy -= 0.04; if (p.k === "w") p.vy += 0.15; p.l -= p.d; p.r *= p.k === "f" ? 0.975 : 0.99;
        if (p.l <= 0) { P.splice(i, 1); continue; }
        var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2), a = p.l;
        if (p.k === "f") { g.addColorStop(0, p.l > 0.6 ? "rgba(255,240,170," + a + ")" : "rgba(255,170,60," + a + ")"); g.addColorStop(0.45, "rgba(255,110,30," + a * 0.75 + ")"); g.addColorStop(1, "rgba(220,30,40,0)"); }
        else if (p.k === "w") { g.addColorStop(0, "rgba(230,245,255," + a + ")"); g.addColorStop(1, "rgba(90,170,255,0)"); }
        else { g.addColorStop(0, "rgba(255,255,255," + a + ")"); g.addColorStop(0.4, "rgba(120,140,255," + a * 0.8 + ")"); g.addColorStop(1, "rgba(80,100,255,0)"); }
        c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2); c.fill();
      }
      for (var j = B.length - 1; j >= 0; j--) {
        var b = B[j]; b.l -= 0.12; if (b.l <= 0) { B.splice(j, 1); continue; }
        c.lineJoin = "round"; c.lineCap = "round";
        [[7, "rgba(255,90,60," + 0.45 * b.l + ")"], [3.2, "rgba(255,225,80," + b.l + ")"], [1.2, "rgba(255,255,255," + b.l + ")"]].forEach(function (st) {
          c.lineWidth = st[0]; c.strokeStyle = st[1]; c.beginPath(); b.p.forEach(function (q, qi) { if (qi) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke();
        });
      }
      if (t < 1.02 || P.length || B.length) raf = requestAnimationFrame(frame); else cv.remove();
    }
    raf = requestAnimationFrame(frame);
    return { stop: function () { alive = false; cancelAnimationFrame(raf); }, lead: C.dur };
  }
  // Animation au centre de l'écran quand on change de programme
  function fx(id) {
    var M = MODE[id] || MODE.general, seen = jget("kf-mode-seen", {}), first = id !== "general" && !seen[id];
    var old = $("th-fx"); if (old) old.remove();
    var el = document.createElement("div"); el.id = "th-fx"; el.className = "th-fx" + (first ? " first" : ""); el.setAttribute("role", "status");
    el.style.setProperty("--ma", M.a); el.style.setProperty("--mb", M.b);
    el.innerHTML = "<div class='th-fx-lines'><i></i><i></i><i></i><i></i><i></i></div><div class='th-fx-in'><div class='th-fx-ic'>" + (ICON[id] || ICON.general) + "</div>" +
      "<b>" + esc(M.hi) + "</b><span>" + esc(M.sub) + "</span>" +
      (first ? "<small>Des exercices généraux, à suivre sur les conseils de ton kiné : ils ne remplacent pas une consultation.</small>" : "") + "</div>";
    document.body.appendChild(el);
    try { if (navigator.vibrate) navigator.vibrate([12, 40, 18]); } catch (e) {}
    var stop = null, closed = false, done = function () {
      if (closed) return; closed = true; if (stop) stop(); el.classList.add("out"); setTimeout(function () { el.remove(); }, 450);
      if (first && THEMES[id] && THEMES[id].runLog && window.KineCourse && KineCourse.intro) setTimeout(KineCourse.intro, 350);   // le journal de course, présenté une fois
    };
    el.onclick = done;
    var lead = 0;
    if (!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      var sc = window.KineModeFx && KineModeFx.STORIES[id] ? KineModeFx.play(el, id, MODE[id]) : sceneFx(el, id);
      if (sc) { el.classList.add("run"); el.style.setProperty("--lead", (sc.lead - 150) / 1000 + "s"); stop = sc.stop; lead = sc.lead; }
    }
    setTimeout(done, lead + (first ? 3200 : 1700));
    if (first) { seen[id] = 1; try { localStorage.setItem("kf-mode-seen", JSON.stringify(seen)); } catch (e) {} }
  }

  /* ════════ Écrans ════════ */
  function sheet() {
    var el = $("th-sheet");
    if (!el) { el = document.createElement("div"); el.id = "th-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function closeSheet() { var el = $("th-sheet"); if (el) el.classList.remove("open"); }
  var WARN = "<div class='th-warn'><b>À suivre sur les conseils de ton kiné.</b> Ces programmes sont généraux : ils ne remplacent pas un bilan ni une consultation. En cas de doute, ou si la douleur augmente, demande-lui.</div>";
  function picker() {
    var cur = active(), list = isAdmin() ? ORDER.slice() : available();
    var row = function (id, T) {
      var on = (cur || "") === (id || "");
      return "<button class='th-opt" + (on ? " on" : "") + "' onclick=\"KineTheme.choose(" + (id ? "'" + id + "'" : "null") + ")\">" +
        "<span class='th-dot' style='background:" + (T ? T.color : "var(--blue)") + "'></span><span class='th-opt-t'><b>" + esc(T ? T.label : "Programme général") + (on ? " · en cours" : "") + "</b>" +
        "<small>" + esc(T ? T.short + ". " + T.perWeek + " séances par semaine." : "Tout le corps, 5 séances par semaine.") + "</small>" +
        (T && isAdmin() && !visible(id) ? "<em>Masqué pour les patients</em>" : "") + "</span><span aria-hidden='true'>›</span></button>";
    };
    var gyms = list.filter(isGym); list = list.filter(function (id) { return !isGym(id); });
    var gymRow = gyms.length ? "<button class='th-opt" + (isGym(cur) ? " on" : "") + "' onclick='KineTheme.gymPicker()'><span class='th-dot' style='background:#3B82F6'></span><span class='th-opt-t'><b>Salle de sport" + (isGym(cur) ? " · " + esc(THEMES[cur].pill) : "") + "</b>" +
      "<small>Push, Pull, Legs avec machines et charges. Tu choisis ensuite ton objectif : général, genou, épaule ou dos.</small></span><span aria-hidden='true'>›</span></button>" : "";
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineTheme.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Choisir mon programme</div><div class='kf-sub'>Le programme choisi remplace tes séances de la semaine. Tu peux revenir au programme général à tout moment.</div></div>" +
      WARN + row(null, null) + list.map(function (id) { return row(id, THEMES[id]); }).join("") + gymRow +
      "<p class='kf-sub'>Changer de programme repart en semaine 1. Tes séances déjà faites restent dans ton suivi.</p></div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function info(id) {
    id = id || active(); var T = THEMES[id]; if (!T) return;
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineTheme.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + esc(T.title) + "</div><div class='kf-sub'>" + esc(T.who) + "</div></div>" + WARN +
      (T.gym ? freqHtml("KineTheme.info()") : "") +
      "<div class='th-plan'><b>" + (T.gym ? "Push, Pull, Legs à la suite, " + T.perWeek + " séances par semaine" : T.perWeek + " séances par semaine, 4 semaines") + "</b>" + T.sessions.map(function (s, i) {
        return "<div><span>" + (T.gym ? s.t.charAt(0) + (s.t === "Pull" ? "u" : "") : T.code + (i + 1)) + "</span><p><strong>" + esc(s.t + (s.sub ? " (" + s.sub + ")" : "")) + "</strong>" + esc(s.f) + "</p></div>"; }).join("") + "</div>" +
      T.cards.map(function (c) { return "<details class='th-card'><summary>" + esc(c.t) + "</summary><div>" + c.b + "</div></details>"; }).join("") +
      (T.runLog && window.KineCourse ? "<button class='lx-cta' onclick='KineTheme.close();KineCourse.open()'>Mon journal de course</button>" : "") +
      (T.gym && window.KineSalle ? "<button class='lx-cta' onclick='KineTheme.close();KineSalle.open()'>Mon carnet de charges</button>" : "") + "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  // Bandeau en haut de l'onglet Programme : programme en cours, et accès au choix
  function pillsHtml() {
    var cur = active(), list = available();
    var pill = function (id) {
      var on = (cur || "general") === id, M = MODE[id], lab = id === "general" ? "Général" : THEMES[id].pill || THEMES[id].label.replace(" après entorse", "").replace(" douloureux", "");
      return "<button class='th-pill" + (on ? " on" : "") + "' style='--ma:" + M.a + ";--mb:" + M.b + "' onclick=\"KineTheme.choose(" + (id === "general" ? "null" : "'" + id + "'") + ")\" aria-pressed='" + on + "'>" +
        "<span class='th-pi'>" + ICON[id] + "</span>" + esc(lab) + (id !== "general" && isAdmin() && !visible(id) ? "<em>masqué</em>" : "") + "</button>";
    };
    var gyms = list.filter(isGym), rest = list.filter(function (id) { return !isGym(id); });
    var gp = "";
    if (gyms.length) {
      var on = isGym(cur), M = on ? MODE[cur] : MODE.salle;
      gp = "<button class='th-pill" + (on ? " on" : "") + "' style='--ma:" + M.a + ";--mb:" + M.b + "' onclick='KineTheme.gymPicker()' aria-pressed='" + on + "'>" +
        "<span class='th-pi'>" + ICON.salle + "</span>Salle" + (on ? "<em>" + esc(THEMES[cur].pill) + "</em>" : "") + "</button>";
    }
    return "<div class='th-pills'>" + ["general"].concat(rest).map(pill).join("") + gp + "</div>";
  }
  function bannerHtml() {
    var cur = active(), list = available();
    if (!cur && !list.length) return "";
    var T = cur && THEMES[cur];
    return "<div class='th-switch'><div class='th-sw-h'><span>Mon programme</span><button onclick='KineTheme.picker()'>Détails</button></div>" +
      pillsHtml() + "</div>" +
      (T ? "<div class='th-links'><button onclick='KineTheme.info()'>Comprendre ce programme</button>" + (T.runLog && window.KineCourse ? "<button onclick='KineCourse.open()'>Mon journal de course</button>" : "") + "</div>" : "");
  }
  // Accueil : on change de programme d'un toucher, sans passer par l'onglet Exercices
  function homeSwitchHtml() {
    if (!active() && !available().length) return "";
    return "<div class='th-switch th-home'><div class='th-sw-h'><span>Mon programme</span></div>" + pillsHtml() + "</div>";
  }
  // Petite étiquette du mode en cours, en haut de l'accueil
  function chipHtml() {
    var cur = active(); if (!cur) return "";
    var M = MODE[cur];
    return "<button class='th-chip' style='--ma:" + M.a + ";--mb:" + M.b + "' onclick=\"showPage('guide')\"><span class='th-pi'>" + ICON[cur] + "</span>" + esc(isGym(cur) ? "Salle · " + THEMES[cur].pill : THEMES[cur].label) + "</button>";
  }
  // Accueil, programme coureur : la sortie du jour se note en un geste, et la question du lendemain matin
  function homeHtml() {
    var id = active(); if (!id || !THEMES[id].runLog || !window.KineCourse) return "";
    var q = KineCourse.pending(), L = KineCourse.load();
    return "<button class='th-run" + (q ? " ask" : "") + "' onclick='KineCourse.open()'><span><b>" + (q ? "Et ce matin, la douleur ?" : "Journal de course") + "</b><small>" +
      (q ? "Note-la pour ta dernière sortie : c'est le meilleur repère." : Math.round(L.cur.min) + " min de course cette semaine. Touche pour noter une sortie.") + "</small></span><span aria-hidden='true'>›</span></button>";
  }
  function perWeek() { var id = active(); return id ? THEMES[id].perWeek : 5; }
  function setFreq(n) {
    set("kf-salle-freq", String(n === 2 || n === 4 ? n : 3)); gymSetup();
    if (window.KineOfficiel && KineOfficiel.reapply) KineOfficiel.reapply(); else apply();
    mark(); rerender();
  }

  function freqHtml(after) {
    var f = gymFreq();
    return "<div class='ks-freq'><span>Séances par semaine</span><div>" + [2, 3, 4].map(function (n) {
      return "<button class='" + (f === n ? "on" : "") + "' onclick='KineTheme.setFreq(" + n + ");" + after + "'>" + n + "</button>"; }).join("") + "</div></div>";
  }
  // Salle de sport : un seul mode, puis l'objectif (général, genou, épaule, dos), le rythme, et les outils de la salle
  function gymPicker() {
    var cur = active(), list = GYM_IDS.filter(function (id) { return visible(id) || isAdmin(); });
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineTheme.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Salle de sport</div><div class='kf-sub'>Trois séances qui s'enchaînent : Push (pousser), Pull (tirer), Legs (jambes). Choisis ton objectif, il adapte les exercices de chaque séance.</div></div>" +
      "<div class='th-gym'>" + list.map(function (id) {
        var T = THEMES[id], M = MODE[id], on = cur === id;
        return "<button class='th-gopt" + (on ? " on" : "") + "' style='--ma:" + M.a + ";--mb:" + M.b + "' onclick=\"KineTheme.choose('" + id + "')\"><span class='th-pi'>" + ICON[id] + "</span>" +
          "<span class='th-opt-t'><b>" + esc(T.pill === "Général" ? "Renforcement général" : T.pill) + (on ? " · en cours" : "") + "</b><small>" + esc(T.short) + "</small>" + (isAdmin() && !visible(id) ? "<em>Masqué pour les patients</em>" : "") + "</span></button>";
      }).join("") + "</div>" + freqHtml("KineTheme.gymPicker()") +
      (window.KineSalle ? "<div class='th-gtools'><button onclick='KineTheme.close();KineSalle.log()'><b>Noter une séance</b><small>Sans lancer Yass, directement à la salle</small></button>" +
        "<button onclick='KineTheme.close();KineSalle.mine()'><b>Mes séances salle</b><small>Crée tes propres séances</small></button>" +
        "<button onclick='KineTheme.close();KineSalle.open()'><b>Carnet de charges</b><small>Courbes, records, historique</small></button></div>" : "") +
      (cur && !isGym(cur) || !cur ? "" : "<button class='th-gback' onclick=\"KineTheme.choose(null)\">Revenir au programme général</button>") +
      WARN + "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }

  // Interrupteurs dans l'Espace kiné (programme officiel)
  function adminHtml(themesDraft) {
    return ORDER.map(function (id) {
      var T = THEMES[id], on = !!themesDraft[id];
      return "<label class='th-tg'><span><b>" + esc(T.label) + "</b><small>" + esc(T.short) + "</small></span>" +
        "<input type='checkbox'" + (on ? " checked" : "") + " onchange='KineOfficiel.theme(\"" + id + "\",this.checked,this)'><i aria-hidden='true'></i></label>";
    }).join("") + "<button class='v2-row' onclick='KineTheme.picker()'><b>Tester un programme masqué sur ce téléphone</b><span>›</span></button>";
  }

  function init() {
    apply(); mark(); rerender();
    window.addEventListener("kf-auth", function () { if (window.KineOfficiel && KineOfficiel.reapply) KineOfficiel.reapply(); else apply(); mark(); rerender(); });
  }
  if (document.readyState === "complete") setTimeout(init, 0); else window.addEventListener("load", function () { setTimeout(init, 0); });

  return { THEMES: THEMES, ORDER: ORDER, apply: apply, active: active, schedule: schedule, available: available, choose: choose, picker: picker, info: info,
           close: closeSheet, bannerHtml: bannerHtml, chipHtml: chipHtml, homeSwitchHtml: homeSwitchHtml, homeHtml: homeHtml, fx: fx, perWeek: perWeek, adminHtml: adminHtml, visible: visible, setFreq: setFreq, gymFreq: gymFreq, gymPicker: gymPicker, isGym: isGym, gymOpts: gymOpts, GYM_IDS: GYM_IDS };
})();
window.KineTheme = KineTheme;
