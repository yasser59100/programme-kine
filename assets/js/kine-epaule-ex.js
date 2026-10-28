/* ═══════════ KinéForce — exercices de l'épaule, du plus simple au plus dur (et quelques loufoques) ═══════════
   Niveau 1 : bouger sans forcer (épaule douloureuse, raide, ou après une opération) ; niveau 2 : renforcer la coiffe
   et les muscles de l'omoplate ; niveau 3 : vitesse, appuis sur les mains, lancers ; puis des variantes ludiques.
   Même principe que kine-genou-ex.js : poses de Yass, fiche de la bibliothèque, et phrase « à quoi ça sert ». */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT, SUPINE_FEET = lib.SUPINE_FEET;
  var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var LIE = { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0 };
  var SUP_CAM = { yaw: 1.2, pitch: 0.45, dist: 3.4, ty: 0.25, tz: -0.25 };
  var PRONE = { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [0, 0, 0], head: -12, L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] } };
  var RELAX = { ang: [4, 7, 0, 10] };
  // Le bras gauche travaille (le droit pour l'autre côté) ; le bras droit reste détendu
  var ST = function (la, ra, extra) { return merge(STAND(0.11, 6), { LA: la, RA: ra || RELAX }, extra || {}); };

  /* ════════ NIVEAU 1 : bouger sans forcer ════════ */
  var AIDE = function (f) { return merge(LIE, SUPINE_FEET, { LA: { ang: [f, 8, 0, 18] }, RA: { ang: [f - 4, 8, 0, 24] } }); };
  reg("Élévation du bras aidée, couché", {
    sides: "blocks", sideWord: "bras", noIso: true, camera: SUP_CAM, start: "down", thumb: "up",
    poses: { down: AIDE(22), mid: AIDE(90), up: AIDE(158) },
    steps: [step("mid", 1.5, "La bonne main aide l'autre à monter", "La bonne main tient le poignet et aide le bras à monter", "up"), step("up", 1.5, "Jusqu'au-dessus de la tête, sans forcer", null, "up"), step("up", 2, "On tient", null, "hold"), step("down", 2.5, "On redescend lentement", "On redescend lentement", "down")]
  });
  var CLIMB = function (y) { return ST({ hand: { at: [0.2, y, 0.52], pole: [0.6, -1, -0.2] } }, null, { pelvis: { p: [0, "auto", 0.06], r: [0, 0, 0] } }); };
  reg("Marche des doigts sur le mur", {
    sides: "blocks", sideWord: "bras", noIso: true, props: ["wall"], camera: { yaw: 1.4, dist: 3.8, ty: 1.2 }, start: "a", thumb: "c",
    poses: { a: CLIMB(1.25), b: CLIMB(1.5), c: CLIMB(1.78), d: CLIMB(1.95) },
    steps: [step("b", 1, "Les doigts montent le long du mur", "Les doigts marchent vers le haut, comme une araignée", "up"), step("c", 1, "Encore un peu", null, "up"), step("d", 1, "Le plus haut possible, sans forcer", null, "up"), step("d", 2, "On tient", null, "hold"), step("a", 2, "Les doigts redescendent", null, "down")]
  });
  var SLIDE = function (z, lean) { return merge(SEAT, { spine: [6 + lean, 0, 0], head: -lean * 0.3, LA: { hand: { at: [0.2, 0.79, z], pole: [0.6, -1, -0.2] } }, RA: { hand: { at: [-0.24, 0.79, 0.12], pole: [-0.6, -1, -0.2] } } }); };
  reg("Glissement de la main sur la table", {
    sides: "blocks", sideWord: "bras", noIso: true, props: ["chair", "table"], tablePos: { z: -0.12, turn: true }, camera: { yaw: 1.2, dist: 3.8, ty: 0.75, pitch: 0.3 }, start: "near", thumb: "far",
    poses: { near: SLIDE(0.1, 4), far: SLIDE(0.5, 26) },
    steps: [step("far", 2.5, "La main glisse en avant sur la table", "La main glisse en avant, on se penche avec", "up"), step("far", 2, "On tient", null, "hold"), step("near", 2, "La main revient", null, "down")]
  });
  reg("Haussement et enroulement des épaules", {
    noIso: true, camera: { yaw: 1.1, dist: 3.6, ty: 1.2 }, start: "mid", thumb: "back",
    poses: { mid: ST({ ang: [4, 7, 0, 10] }, { ang: [4, 7, 0, 10] }), fwd: ST({ ang: [14, 12, -8, 12] }, { ang: [14, 12, -8, 12] }, { spine: [6, 0, 0] }), back: ST({ ang: [-14, 12, 8, 8] }, { ang: [-14, 12, 8, 8] }, { spine: [-3, 0, 0], head: 4 }) },
    steps: [step("fwd", 1, "Les épaules roulent vers l'avant", "Les épaules font de grands cercles", "up"), step("back", 1.4, "Puis vers l'arrière", null, "down"), step("mid", 0.8, "On relâche", null, "down")]
  });
  // La main gauche part vers l'extérieur, coude collé au corps ; la main droite pousse le bâton
  var STICK = function (out) { var a = out * Math.PI / 180; return ST({ hand: { at: [0.17 + 0.27 * Math.sin(a), 0.98, 0.0 + 0.27 * Math.cos(a)], pole: [0.2, -1, -0.5] } }, { hand: { at: [-0.12 + 0.2 * Math.sin(a), 1.0, 0.3 + 0.04 * Math.sin(a)], pole: [-0.6, -1, -0.3] } }); };
  reg("Rotation externe au bâton, coude au corps", {
    sides: "blocks", sideWord: "bras", noIso: true, tool: "stick", camera: { yaw: 0.25, dist: 3.6, ty: 1.05, pitch: 0.35 }, start: "in", thumb: "out",
    poses: { "in": STICK(0), out: STICK(62) },
    steps: [step("out", 2, "Le bâton pousse la main vers l'extérieur", "La bonne main pousse le bâton : l'autre main part vers l'extérieur, coude collé", "up"), step("out", 3, "On tient", null, "hold"), step("in", 2, "On revient", null, "down")]
  });

  /* ════════ NIVEAU 2 : renforcer ════════ */
  reg("Élévation dans le plan de l'omoplate", {
    load: "both", camera: { yaw: 0.6, dist: 4.0 }, start: "down", thumb: "up",
    poses: { down: ST({ ang: [6, 12, 0, 8] }, { ang: [6, 12, 0, 8] }), up: ST({ ang: [52, 72, 10, 6] }, { ang: [52, 72, 10, 6] }) },
    steps: [step("up", 1.8, "Les bras montent un peu en avant, pouces vers le haut", "On monte, bras un peu en avant, pouces vers le haut", "up"), step("up", 1, "On tient", null, "hold"), step("down", 2.5, "Descente lente", "On redescend lentement", "down")]
  });
  reg("Coup de poing vers le plafond", {
    sides: "blocks", sideWord: "bras", load: "L", camera: SUP_CAM, start: "down", thumb: "up",
    poses: { down: merge(LIE, SUPINE_FEET, { LA: { ang: [86, 6, 0, 22] }, RA: { ang: [4, 10, 0, 10] } }), up: merge(LIE, SUPINE_FEET, { LA: { ang: [92, 4, 0, 0] }, RA: { ang: [4, 10, 0, 10] } }) },
    steps: [step("up", 1, "Le poing pousse vers le plafond", "Le poing pousse vers le plafond, l'épaule décolle un peu", "up"), step("up", 1, "On tient", null, "hold"), step("down", 1.5, "L'épaule revient au sol", null, "down")]
  });
  reg("Bras en arrière à plat ventre", {
    load: "both", camera: { yaw: 1.2, pitch: 0.4, dist: 3.4, ty: 0.2, tz: -0.2 }, start: "down", thumb: "up",
    poses: { down: merge(PRONE, { LA: { ang: [-6, 10, 0, 0] }, RA: { ang: [-6, 10, 0, 0] } }), up: merge(PRONE, { LA: { ang: [-34, 12, 0, 0] }, RA: { ang: [-34, 12, 0, 0] } }) },
    steps: [step("up", 1.5, "Les bras montent vers le plafond", "Bras tendus, ils montent vers l'arrière", "up"), step("up", 1.5, "On tient, omoplates serrées", null, "hold"), step("down", 2, "Descente lente", null, "down")]
  });

  /* ════════ NIVEAU 3 : vitesse et appuis ════════ */
  reg("Lancer de balle contre le mur", {
    sides: "blocks", sideWord: "bras", noIso: true, load: "L", loadKind: "ball", timed: { seconds: 30 }, camera: { yaw: 1.0, dist: 4.2, ty: 1.15 }, start: "arm", thumb: "arm",
    poses: { arm: ST({ ang: [20, 85, 75, 95] }, { ang: [40, 20, 0, 20] }, { spine: [-4, 0, -12] }), rel: ST({ ang: [105, 40, -10, 15] }, { ang: [10, 20, 0, 20] }, { spine: [10, 0, 14] }) },
    steps: [step("rel", 0.35, "On lance la balle contre le mur", null, "up"), step("arm", 0.6, "On rattrape et on arme le bras", null, "down")]
  });
  var wp = KineAvatar._def("Pompes contre le mur");
  if (wp) {
    var cd = copy(wp); cd.noIso = true;
    cd.poses.off = merge(cd.poses.up, { pelvis: { p: [0, 0.9, -0.26], r: [6, 0, 0] }, LA: { ang: [84, 10, 0, 12] }, RA: { ang: [84, 10, 0, 12] } });
    cd.start = "off"; cd.thumb = "down";
    cd.steps = [step("down", 0.5, "On tombe vers le mur, on se rattrape", "On se laisse tomber vers le mur, on se rattrape sur les mains", "down"), step("off", 0.5, "On repousse le mur vivement", "On repousse vivement", "up"), step("off", 0.6, "Mains en l'air, prêt", null, "hold")];
    reg("Chute contrôlée sur les mains contre le mur", cd);
  }
  var pc = KineAvatar._def("Pompes complètes");
  if (pc) {
    var pt = copy(pc); pt.noIso = true; pt.sides = "alternate";
    pt.poses.t = merge(pt.poses.up, { spine: [0, 0, -18], RA: { ang: [40, 95, 0, 0] } });
    pt.start = "up"; pt.thumb = "t";
    pt.steps = [step("down", 1.5, "Une pompe", "Une pompe", "down"), step("up", 1, "On remonte", null, "up"), step("t", 1.5, "On ouvre, un bras vers le côté", "On tourne le buste, un bras s'ouvre sur le côté", "up"), step("up", 1.2, "On revient en planche", null, "down")];
    reg("Pompe avec rotation en T", pt);
  }

  /* ════════ LES LOUFOQUES (mais utiles) ════════ */
  var MIME = function (a, b) { return merge(STAND(0.11, 6), { pelvis: { p: [0, "auto", 0.08], r: [0, 0, 0] }, LA: { hand: { at: [0.24 + a[0], 1.38 + a[1], 0.52], pole: [0.6, -1, -0.3] } }, RA: { hand: { at: [-0.24 + b[0], 1.38 + b[1], 0.52], pole: [-0.6, -1, -0.3] } } }); };
  reg("Le mime contre la vitre", {
    noIso: true, timed: { seconds: 40 }, props: ["wall"], camera: { yaw: 1.35, dist: 3.8, ty: 1.2 }, start: "a", thumb: "b",
    poses: { a: MIME([0, 0.12], [0, -0.12]), b: MIME([0.12, 0], [-0.12, 0]), c: MIME([0, -0.12], [0, 0.12]), d: MIME([-0.1, 0], [0.1, 0]) },
    steps: [step("b", 0.7, "Les mains dessinent des cercles sur la vitre", "Les mains glissent en cercles sur une vitre imaginaire", "up"), step("c", 0.7, "On frotte la vitre", null, "up"), step("d", 0.7, "On frotte la vitre", null, "down"), step("a", 0.7, "On frotte la vitre", null, "down")]
  });
  reg("Le chef d'orchestre", {
    noIso: true, timed: { seconds: 40 }, camera: { yaw: 0.35, dist: 4.1, ty: 1.2 }, start: "a", thumb: "a",
    poses: { a: ST({ ang: [150, 25, 0, 35] }, { ang: [60, 55, 0, 45] }), b: ST({ ang: [60, 55, 0, 45] }, { ang: [150, 25, 0, 35] }), c: ST({ ang: [30, 95, 20, 20] }, { ang: [30, 95, 20, 20] }) },
    steps: [step("a", 1, "On dirige l'orchestre, grands gestes", "Grands gestes, comme un chef d'orchestre", "up"), step("c", 0.9, "Les bras s'ouvrent", null, "down"), step("b", 1, "On dirige l'orchestre", null, "up"), step("c", 0.9, "Les bras s'ouvrent", null, "down")]
  });
  var LASSO = function (rot, abd) { return ST({ ang: [140, abd, rot, 40] }, { hand: { at: [-0.18, 1.0, 0.05], pole: [-1, -0.2, -0.6] } }); };
  reg("Le cow-boy au lasso", {
    sides: "blocks", sideWord: "bras", noIso: true, timed: { seconds: 30 }, camera: { yaw: 0.5, dist: 4.2, ty: 1.3 }, start: "a", thumb: "b",
    poses: { a: LASSO(-30, 30), b: LASSO(0, 45), c: LASSO(30, 30), d: LASSO(0, 15) },
    steps: [step("b", 0.45, "Le lasso tourne au-dessus de la tête", null, "up"), step("c", 0.45, "Yee-haw", null, "up"), step("d", 0.45, "Le lasso tourne", null, "down"), step("a", 0.45, "Le lasso tourne", null, "down")]
  });
  var BUTTERFLY = function (open) { var px = open ? 1 : 0.35, pz = open ? -0.8 : 1.2; return ST({ hand: { at: [0.07, 1.6, -0.1], pole: [px, 0.2, pz] } }, { hand: { at: [-0.07, 1.6, -0.1], pole: [-px, 0.2, pz] } }); };
  reg("Le papillon", {
    noIso: true, camera: { yaw: 0.25, dist: 3.8, ty: 1.3 }, start: "closed", thumb: "open",
    poses: { closed: BUTTERFLY(false), open: BUTTERFLY(true) },
    steps: [step("open", 1.5, "Les coudes s'ouvrent comme des ailes", "Mains derrière la tête, les coudes s'ouvrent comme des ailes", "up"), step("open", 1.5, "On tient", null, "hold"), step("closed", 1.5, "Les ailes se referment", null, "down")]
  });

  /* ════════ FICHES (bibliothèque) ════════ */
  var E = function (name, group, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: group, color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop }; };
  var F = [
    E("Élévation du bras aidée, couché", "epaule", 1, ["un lit ou un tapis"], "10 répétitions",
      "Allongé sur le dos, genoux pliés. Avec la bonne main, tiens le poignet du bras douloureux et aide-le à monter au-dessus de la tête, jusqu'à une gêne supportable. Redescends lentement.",
      "C'est la bonne main qui fait le travail : le bras douloureux se laisse porter.", "On ne force pas d'un coup en fin de mouvement.",
      "Le premier exercice après une opération ou quand l'épaule est très raide : couché, l'épaule n'a pas à porter le poids du bras.", "Arrêt si douleur vive ou si le bras s'engourdit."),
    E("Marche des doigts sur le mur", "epaule", 1, ["un mur"], "5 montées",
      "Face au mur, à une longueur d'avant-bras. Fais marcher les doigts vers le haut, comme une araignée, le plus haut possible sans forcer, tiens quelques secondes, puis redescends.",
      "Les épaules restent basses, loin des oreilles.", "On ne se hisse pas sur la pointe des pieds pour tricher.",
      "Note la hauteur atteinte avec un post-it : un repère simple pour voir les progrès. Plus dur : de profil, pour l'élévation sur le côté.", "Arrêt si douleur vive."),
    E("Glissement de la main sur la table", "epaule", 1, ["une table", "une chaise", "un chiffon ou une serviette"], "10 répétitions",
      "Assis face à une table, la main posée sur un chiffon. Fais glisser la main en avant en te penchant avec le buste, tiens, puis reviens.",
      "C'est le buste qui avance : le bras se laisse emmener.", "On ne soulève pas la main de la table.",
      "Très doux, idéal après une opération ou quand l'épaule est douloureuse. Plus dur : glisser aussi en cercles.", "Arrêt si douleur vive."),
    E("Haussement et enroulement des épaules", "epaule", 1, [], "10 cercles dans chaque sens",
      "Debout ou assis, bras détendus. Fais de grands cercles avec les épaules : en avant, en haut, en arrière, en bas. Puis dans l'autre sens.",
      "Des cercles amples et lents, les bras pendent.", "On ne bouge pas la tête.",
      "Détend le haut du dos et la nuque, à faire souvent dans la journée.", "Arrêt si douleur vive."),
    E("Rotation externe au bâton, coude au corps", "epaule", 1, ["un bâton ou un manche à balai"], "10 répétitions",
      "Debout, coudes collés au corps et pliés à 90°, un bâton tenu dans les deux mains. La bonne main pousse le bâton pour faire tourner l'autre main vers l'extérieur. Tiens 3 secondes, puis reviens.",
      "Le coude reste collé au corps pendant tout le mouvement.", "Le coude ne s'écarte pas du corps.",
      "Retrouver la rotation vers l'extérieur, souvent la plus limitée quand l'épaule est raide. Plus facile : couché sur le dos.", "Arrêt si douleur vive."),
    E("Élévation dans le plan de l'omoplate", "epaule", 2, ["deux bouteilles d'eau ou deux haltères légers"], "12 répétitions",
      "Debout, une bouteille dans chaque main. Lève les bras un peu en avant de l'axe des épaules, pouces vers le haut, jusqu'à hauteur des épaules, puis redescends lentement.",
      "Pouces vers le haut, épaules basses.", "On ne monte pas plus haut que les épaules au début.",
      "C'est la direction la plus naturelle pour l'épaule, souvent la mieux tolérée. Plus dur : bouteilles plus lourdes.", "Douleur au-dessus de 5/10 : on baisse la hauteur ou le poids."),
    E("Coup de poing vers le plafond", "epaule", 2, ["une bouteille d'eau", "un tapis"], "12 répétitions par bras",
      "Allongé sur le dos, le bras tendu vers le plafond avec une bouteille. Pousse le poing vers le plafond en décollant un peu l'épaule du sol, puis laisse-la revenir.",
      "Le bras reste tendu : c'est l'épaule qui monte et descend.", "Le coude ne plie pas.",
      "Réveille le muscle qui plaque l'omoplate contre les côtes (le dentelé). Plus dur : debout contre un élastique.", "Arrêt si douleur vive."),
    E("Bras en arrière à plat ventre", "epaule", 2, ["un tapis", "deux bouteilles d'eau"], "12 répétitions",
      "Allongé à plat ventre, bras le long du corps, une petite bouteille dans chaque main. Lève les bras tendus vers le plafond en serrant les omoplates, tiens, puis redescends.",
      "On serre les omoplates, le front reste près du sol.", "On ne relève pas la tête.",
      "Renforce l'arrière de l'épaule et le haut du dos. Plus dur : bouteilles plus lourdes.", "Arrêt si douleur dans l'épaule ou le bas du dos."),
    E("Lancer de balle contre le mur", "epaule", 3, ["une balle de tennis", "un mur"], "30 secondes",
      "Face à un mur, à 2 ou 3 mètres. Lance la balle contre le mur avec le bras qui travaille, rattrape-la, et recommence en armant le bras à chaque fois.",
      "Le geste part des jambes et du buste, pas seulement du bras.", "On ne lance pas fort au début.",
      "Prépare l'épaule aux lancers et aux gestes rapides du sport. Plus dur : plus loin, ou à genoux.", "Arrêt si douleur ou si l'épaule paraît instable."),
    E("Chute contrôlée sur les mains contre le mur", "epaule", 3, ["un mur"], "10 répétitions",
      "Debout face au mur, à un grand pas, bras tendus devant. Laisse-toi tomber vers le mur, rattrape-toi sur les mains en pliant les coudes, puis repousse le mur vivement pour revenir debout.",
      "Réception souple, coudes qui amortissent.", "On ne se cogne pas : la distance doit rester confortable.",
      "Apprend à l'épaule à encaisser un appui rapide sur les mains, comme lors d'une chute. Plus dur : reculer un peu.", "Arrêt si douleur ou appréhension."),
    E("Pompe avec rotation en T", "epaule", 3, [], "6 répétitions par côté",
      "En position de pompe. Fais une pompe, puis tourne le buste en ouvrant un bras sur le côté et vers le haut, comme un T, en appui sur l'autre main. Reviens, et recommence de l'autre côté.",
      "Le corps reste bien droit pendant la rotation.", "Le bassin ne s'affaisse pas.",
      "Force et stabilité de l'épaule en appui sur une main. Plus facile : sur les genoux.", "Arrêt si douleur ou instabilité de l'épaule."),
    E("Le mime contre la vitre", "epaule", 2, ["un mur"], "40 secondes",
      "Face au mur, les deux mains posées dessus, à hauteur des épaules. Fais glisser les mains en grands cercles, comme un mime qui nettoie une vitre, dans un sens puis dans l'autre.",
      "Les mains appuient un peu sur le mur.", "On ne hausse pas les épaules.",
      "Les muscles autour de l'omoplate travaillent pour garder l'épaule stable, sans danger. Plus dur : une seule main, ou plus haut.", "Arrêt si douleur vive."),
    E("Le chef d'orchestre", "epaule", 1, [], "40 secondes",
      "Debout, dirige un orchestre imaginaire avec de grands gestes des deux bras : en haut, sur les côtés, en croisant, sans forcer.",
      "De grands gestes fluides, dans l'amplitude confortable.", "On ne force pas au-dessus de la tête si ça fait mal.",
      "Entretient toute l'amplitude de l'épaule en musique. Plus dur : une petite bouteille dans chaque main.", "Arrêt si douleur vive."),
    E("Le cow-boy au lasso", "epaule", 3, [], "30 secondes par bras",
      "Debout, le bras levé au-dessus de la tête, fais tourner un lasso imaginaire avec des cercles réguliers du poignet et du bras.",
      "Le bras reste en haut, le coude un peu plié.", "On ne hausse pas l'épaule vers l'oreille.",
      "Endurance de l'épaule bras levé, comme pour les gestes au-dessus de la tête. Plus dur : une petite bouteille en main.", "Arrêt si douleur ou fourmillements."),
    E("Le papillon", "epaule", 1, [], "10 répétitions",
      "Debout ou assis, les mains derrière la tête. Ouvre les coudes vers l'arrière comme des ailes de papillon, tiens 2 secondes, puis referme-les devant le visage.",
      "Les mains restent posées derrière la tête, sans tirer sur la nuque.", "On ne pousse pas la tête vers l'avant.",
      "Assouplit l'épaule en rotation vers l'extérieur et ouvre la poitrine. Plus dur : allongé sur le dos, coudes vers le sol.", "Arrêt si douleur ou fourmillements dans la main.")
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  var U = function (s2, e) { return { s: s2, e: e }; };
  var USE = {
    "Élévation du bras aidée, couché": U("L'épaule retrouve son amplitude sans porter le poids du bras.", ["Se coiffer", "Attraper un objet en hauteur", "Enfiler un pull"]),
    "Marche des doigts sur le mur": U("L'épaule monte petit à petit, avec un repère visible des progrès.", ["Atteindre une étagère", "Étendre le linge", "Se laver les cheveux"]),
    "Glissement de la main sur la table": U("Le bras monte en glissant, sans effort des muscles de l'épaule.", ["Bouger l'épaule sans douleur", "Préparer l'épaule aux exercices", "Dormir mieux"]),
    "Haussement et enroulement des épaules": U("Le haut du dos et la nuque se détendent, l'épaule bouge plus librement.", ["Moins de tensions dans la nuque", "Travailler longtemps assis", "Se détendre"]),
    "Rotation externe au bâton, coude au corps": U("La rotation vers l'extérieur revient, celle qui manque le plus quand l'épaule est raide.", ["Se coiffer", "Mettre la ceinture de sécurité", "Lancer une balle"]),
    "Élévation dans le plan de l'omoplate": U("La coiffe et le deltoïde lèvent le bras dans sa direction la plus naturelle.", ["Porter un sac", "Ranger des courses en hauteur", "Lever le bras sans douleur"]),
    "Coup de poing vers le plafond": U("Le muscle qui tient l'omoplate contre les côtes se renforce : l'épaule a une base plus solide.", ["Pousser une porte", "Faire des pompes", "Porter un plateau"]),
    "Bras en arrière à plat ventre": U("L'arrière de l'épaule et le haut du dos se renforcent : meilleure posture et épaule plus stable.", ["Se tenir droit", "Tirer une porte", "Ramer, nager"]),
    "Lancer de balle contre le mur": U("L'épaule apprend à accélérer et à freiner vite, comme dans les sports de lancer.", ["Lancer une balle", "Jouer au tennis ou au hand", "Reprendre le sport"]),
    "Chute contrôlée sur les mains contre le mur": U("L'épaule apprend à encaisser un appui rapide, comme quand on se rattrape en tombant.", ["Se rattraper en tombant", "Reprendre les sports de contact", "Pousser vivement"]),
    "Pompe avec rotation en T": U("L'épaule porte le corps sur une main en tournant : force et contrôle en même temps.", ["Se relever du sol", "Sports de contact", "Grimper"]),
    "Le mime contre la vitre": U("Les petits muscles autour de l'omoplate gardent l'épaule bien centrée, mains en appui.", ["Nettoyer une vitre", "S'appuyer sur les mains", "Peindre un mur"]),
    "Le chef d'orchestre": U("L'épaule bouge dans toutes les directions, sans forcer : l'amplitude s'entretient.", ["Bouger les bras sans raideur", "Danser", "S'habiller"]),
    "Le cow-boy au lasso": U("L'épaule tient le bras en haut longtemps : endurance pour les gestes au-dessus de la tête.", ["Peindre un plafond", "Changer une ampoule", "Smasher au volley"]),
    "Le papillon": U("L'épaule s'assouplit en rotation vers l'extérieur et la poitrine s'ouvre.", ["Se coiffer", "Attacher un collier", "Se tenir droit"])
  };
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });
  window.KineEpauleEx = { names: F.map(function (f) { return f.name; }) };
})();
