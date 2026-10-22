/* ═══════════ KinéForce — exercices en salle de sport ═══════════
   Machines et charges : presse à cuisses, leg extension, leg curl, barre, haltères, poulie, tirage vertical.
   Mêmes principes que la bibliothèque : poses de Yass (avec le matériel en 3D) et fiche. Groupe « salle » dans la bibliothèque. */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT, BR = lib.BRIDGE_DOWN;
  var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var from = function (n) { var d = KineAvatar._def(n); return d ? copy(d) : null; };
  var ARMS_FWD = { LA: { ang: [85, 8, 0, 0] }, RA: { ang: [85, 8, 0, 0] } };

  /* ════════ BAS DU CORPS ════════ */
  // Presse à cuisses inclinée : dos sur le dossier, pieds sur le plateau
  var PRESS = function (k) {   // k : 0 jambes presque tendues, 1 genoux à 90°
    return { pelvis: { p: [0, 0.47, -0.32], r: [-62, 0, 0] }, spine: [0, 0, 0], head: 20,
      L: { foot: { at: [0.13, 0.98 - 0.26 * k, 0.48 - 0.26 * k], yaw: 4, lift: -70, pole: [0.2, 1, 0.3] } },
      R: { foot: { at: [-0.13, 0.98 - 0.26 * k, 0.48 - 0.26 * k], yaw: -4, lift: -70, pole: [-0.2, 1, 0.3] } },
      LA: { hand: { at: [0.32, 0.45, -0.25], pole: [1, 0, 0] } }, RA: { hand: { at: [-0.32, 0.45, -0.25], pole: [-1, 0, 0] } } };
  };
  reg("Presse à cuisses", {
    camera: { yaw: 1.35, dist: 4.2, ty: 0.65, pitch: 0.2 }, props: ["legPress"], tool: "legPlate", start: "up", thumb: "down",
    poses: { up: PRESS(0), down: PRESS(1) },
    steps: [step("down", 2.5, "Descente contrôlée", "On descend en contrôle, genoux vers les épaules", "down"), step("up", 1.5, "On pousse", "On pousse, sans verrouiller les genoux", "up")]
  });
  var LEGX = function (knee) {
    return merge(SEAT, { spine: [0, 0, 0], LA: { hand: { at: [0.27, 0.47, -0.25], pole: [1, 0, -0.3] } }, RA: { hand: { at: [-0.27, 0.47, -0.25], pole: [-1, 0, -0.3] } },
      L: { ang: [90, 5, 0, knee, -5] }, R: { ang: [90, 5, 0, knee, -5] } });
  };
  reg("Leg extension", {
    camera: { yaw: 1.3, dist: 3.8, ty: 0.65 }, props: ["legMachine"], lever: true, tool: "padFront", start: "down", thumb: "up",
    poses: { down: LEGX(90), up: LEGX(8) },
    steps: [step("up", 1.5, "On tend les jambes", "On tend", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 3, "Descente lente", "On redescend lentement", "down")]
  });
  reg("Leg extension amplitude limitée", {
    camera: { yaw: 1.3, dist: 3.8, ty: 0.65 }, props: ["legMachine"], lever: true, tool: "padFront", start: "down", thumb: "up",
    poses: { down: LEGX(90), up: LEGX(45) },
    steps: [step("up", 1.5, "De 90° à 45° seulement", "On monte jusqu'à 45 degrés", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 3, "Descente lente", "On redescend lentement", "down")]
  });
  reg("Leg curl assis", {
    camera: { yaw: 1.3, dist: 3.8, ty: 0.65 }, props: ["legMachine"], lever: true, tool: "padBack", start: "out", thumb: "in",
    poses: { out: LEGX(10), in: LEGX(95) },
    steps: [step("in", 1.5, "On plie les genoux", "On ramène les talons sous le siège", "up"), step("in", 1, "On tient", "On tient", "hold"), step("out", 3, "Retour lent", "On revient lentement", "down")]
  });
  (function () {
    var d = from("Squat bilatéral"); if (!d) return;
    var hands = { LA: { hand: { at: [0.42, 1.37, -0.12], pole: [1, -1, 0.2] } }, RA: { hand: { at: [-0.42, 1.37, -0.12], pole: [-1, -1, 0.2] } } };
    d.tool = "barBack"; d.poses.up = merge(d.poses.up, hands);
    var dn = d.poses.down, dh = function (s) { return { hand: { at: [s * 0.42, dn.pelvis.p[1] + 0.42, dn.pelvis.p[2] - 0.08], pole: [s, -1, 0.2] } }; };
    d.poses.down = merge(dn, { LA: dh(1), RA: dh(-1) });
    reg("Squat à la barre", d);
  })();
  (function () {
    var d = from("Soulevé de terre roumain avec charge"); if (!d) return;
    d.load = null; d.tool = "barbell";
    reg("Soulevé de terre roumain à la barre", d);
  })();
  (function () {
    var d = from("Hip thrust épaules sur canapé"); if (!d) return;
    d.tool = "barHips"; d.props = ["bench"]; d.bench = { x: 0, z: -0.62, along: "x" }; delete d.chair;
    reg("Hip thrust à la barre", d);
  })();
  (function () {
    var d = from("Fente avec charge"); if (!d) return;
    d.loadKind = "dumbbell";
    reg("Fentes avec haltères", d);
  })();
  // Abduction à la poulie basse : sangle à la cheville, debout de côté
  var ABDP = function (abd) { return merge(STAND(0.1, 0), { pelvis: { p: [0, 0.925, 0], r: [0, 0, 0] }, L: { ang: [0, abd, 0, 2, 0] }, LA: { hand: { at: [0.58, 1.05, 0.0], pole: [0, -1, 0] } }, spine: [0, -abd * 0.15, 0] }); };
  reg("Abduction de hanche à la poulie", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camFlip: true, camera: { yaw: 0.2, dist: 4.0, ty: 0.75 }, props: ["pulley"], pulley: { x: 0.66, z: 0.0, h: 0.12 },
    cable: true, bands: [["RA", [0.6, 0.12, 0.0]]], start: "in", thumb: "out",
    poses: { in: merge(ABDP(0), { R: { ang: [0, 2, 0, 2, 0] } }), out: merge(ABDP(0), { R: { ang: [0, 32, 0, 2, 0] }, spine: [0, 4, 0] }) },
    steps: [step("out", 1.5, "La jambe s'écarte", "La jambe s'écarte, bassin droit", "up"), step("out", 1, "On tient", "On tient", "hold"), step("in", 2.5, "Retour lent", "On revient lentement", "down")]
  });

  /* ════════ HAUT DU CORPS ════════ */
  // Développé couché aux haltères : allongé sur le banc (banc dans l'axe du corps), pieds au sol
  var BENCHP = function (up) {
    var y = up ? 1.12 : 0.74;
    return { pelvis: { p: [0, 0.5, 0.0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
      L: { foot: { at: [0.28, 0, 0.62], yaw: 10, pole: [0.3, 1, 0] } }, R: { foot: { at: [-0.28, 0, 0.62], yaw: -10, pole: [-0.3, 1, 0] } },
      LA: { hand: { at: [up ? 0.2 : 0.3, y, -0.48], pole: [1, -0.3, 0.3] } }, RA: { hand: { at: [up ? -0.2 : -0.3, y, -0.48], pole: [-1, -0.3, 0.3] } } };
  };
  reg("Développé couché aux haltères", {
    load: "both", loadKind: "dumbbell", camera: { yaw: 1.2, pitch: 0.35, dist: 3.8, ty: 0.6, tz: -0.2 }, props: ["bench"], bench: { x: 0, z: -0.3 }, start: "up", thumb: "down",
    poses: { up: BENCHP(true), down: BENCHP(false) },
    steps: [step("down", 2.5, "Descente contrôlée", "On descend, coudes à 45 degrés du corps", "down"), step("up", 1.5, "On pousse", "On pousse", "up")]
  });
  // Tirage vertical : assis, barre large tenue au-dessus de la tête, câbles vers la poulie haute
  var LAT = function (dn) {
    return merge(SEAT, { spine: [-6, 0, 0], head: dn ? -4 : 6,
      LA: { hand: { at: [dn ? 0.36 : 0.42, dn ? 1.25 : 1.78, dn ? -0.22 : -0.28], pole: [1, -1, -0.4] } },
      RA: { hand: { at: [dn ? -0.36 : -0.42, dn ? 1.25 : 1.78, dn ? -0.22 : -0.28], pole: [-1, -1, -0.4] } } });
  };
  reg("Tirage vertical", {
    camera: { yaw: 0.85, dist: 4.2, ty: 1.15 }, props: ["latTower"], tool: "latbar", cable: true, bands: [["LH", [0.05, 2.4, -0.3]], ["RH", [-0.05, 2.4, -0.3]]], start: "up", thumb: "down",
    poses: { up: LAT(false), down: LAT(true) },
    steps: [step("down", 1.5, "On tire la barre vers la poitrine", "On tire vers la poitrine, omoplates serrées", "down"), step("down", 0.8, "On serre", null, "hold"), step("up", 2.5, "Remontée lente", "On remonte lentement", "up")]
  });
  // Tirage horizontal à la poulie : assis face à la poulie, buste droit
  var ROW = function (pull) {
    return merge(SEAT, { spine: [0, 0, 0], head: 0, L: { foot: { at: [0.14, 0, 0.34], yaw: 6 } }, R: { foot: { at: [-0.14, 0, 0.34], yaw: -6 } },
      LA: { hand: { at: [0.12, 0.86, pull ? -0.12 : 0.28], pole: [1, -0.6, -1] } }, RA: { hand: { at: [-0.12, 0.86, pull ? -0.12 : 0.28], pole: [-1, -0.6, -1] } } });
  };
  reg("Tirage horizontal à la poulie", {
    camera: { yaw: 1.35, dist: 4.2, ty: 0.85, tz: 0.3 }, props: ["bench", "pulley"], bench: { x: 0, z: -0.55 }, pulley: { x: 0, z: 1.05, h: 0.86 }, cable: true, bands: [["LH", [0.0, 0.86, 0.98]], ["RH", [0.0, 0.86, 0.98]]],
    start: "out", thumb: "in",
    poses: { out: ROW(false), in: ROW(true) },
    steps: [step("in", 1.5, "On tire, coudes le long du corps", "On tire, coudes le long du corps", "up"), step("in", 0.8, "On serre les omoplates", null, "hold"), step("out", 2.5, "Retour lent", "On revient lentement", "down")]
  });
  (function () {
    var d = from("Développé épaules assis"); if (!d) return;
    d.loadKind = "dumbbell"; d.props = ["bench"]; d.bench = { x: 0, z: -0.36, along: "x" };
    reg("Développé épaules aux haltères", d);
  })();
  (function () {
    var d = from("Rowing un bras appui chaise"); if (!d) return;
    d.loadKind = "dumbbell"; d.props = ["bench"]; d.bench = { x: 0, z: 0.45, along: "x" }; delete d.chair;
    reg("Rowing un bras à l'haltère", d);
  })();
  var pulleyOf = function (n, nn, h) {
    var d = from(n); if (!d) return;
    var b = d.bands || []; d.cable = true;
    var pts = b.map(function (x) { return Array.isArray(x[1]) ? x[1] : null; }).filter(Boolean);
    if (pts.length) { var p = pts[0]; d.props = (d.props || []).concat(["pulley"]); d.pulley = { x: p[0] + (p[0] > 0 ? 0.1 : p[0] < 0 ? -0.1 : 0), z: p[2] + (p[2] > 0 ? 0.1 : 0), h: h || p[1] }; }
    reg(nn, d);
  };
  pulleyOf("Rotation externe à l'élastique", "Rotation externe à la poulie");
  pulleyOf("Rotation interne à l'élastique", "Rotation interne à la poulie");
  pulleyOf("Face pull à l'élastique", "Face pull à la poulie");
  pulleyOf("Pallof press", "Pallof press à la poulie");
  (function () {
    var d = from("Marche du fermier sur place"); if (!d) return;
    d.loadKind = "kettlebell";
    reg("Marche du fermier lourde", d);
  })();

  /* ════════ FICHES ════════ */
  var E = function (name, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: "salle", color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop, gym: true }; };
  var F = [
    E("Presse à cuisses", 2, ["presse à cuisses"], "3 séries de 10",
      "Dos et bassin bien plaqués au dossier, pieds à largeur de hanches au milieu du plateau. Déverrouille, descends en contrôle jusqu'à environ 90° aux genoux, puis pousse sans verrouiller les genoux en haut.",
      "Le bas du dos reste collé au dossier, les genoux suivent l'axe des pieds.", "On ne décolle pas les fesses en bas et on ne verrouille pas les genoux en haut.",
      "Pieds plus hauts : plus de fessiers. Pieds plus bas : plus de quadriceps. Charge de départ : celle que tu peux pousser 12 fois avec encore 2 répétitions en réserve.", "Arrêt si douleur dans le genou ou le bas du dos."),
    E("Leg extension", 1, ["machine leg extension"], "3 séries de 12",
      "Assis au fond du siège, genou aligné avec l'axe de la machine, boudin sur le bas du tibia. Tends les jambes, tiens 1 seconde, puis redescends lentement.",
      "La cuisse se contracte fort en haut, la descente est lente.", "On ne donne pas d'élan et les fesses ne décollent pas du siège.",
      "Après une ligamentoplastie, ton kiné peut limiter l'amplitude : voir « Leg extension amplitude limitée ».", "Arrêt si douleur sous la rotule ou dans le genou."),
    E("Leg extension amplitude limitée", 1, ["machine leg extension"], "3 séries de 12",
      "Comme le leg extension, mais on travaille seulement entre 90° et 45° de flexion du genou : on ne tend pas complètement la jambe. Règle la butée de la machine si elle en a une.",
      "On s'arrête à 45°, sans tendre le genou.", "On ne dépasse pas l'amplitude fixée par ton kiné.",
      "Souvent utilisé après une ligamentoplastie du genou, selon le délai et l'avis de ton kiné ou de ton chirurgien.", "Arrêt si douleur dans le genou."),
    E("Leg curl assis", 1, ["machine leg curl"], "3 séries de 12",
      "Assis, genoux alignés avec l'axe de la machine, boudin derrière le bas des mollets, cuisses maintenues. Plie les genoux en ramenant les talons sous le siège, tiens 1 seconde, puis reviens lentement.",
      "Les talons viennent sous le siège, retour lent.", "Le bassin ne décolle pas du siège.",
      "Retour en 3 secondes pour travailler l'ischio en freinant.", "Arrêt si crampe ou douleur derrière la cuisse."),
    E("Squat à la barre", 3, ["barre et disques", "cage à squat"], "3 séries de 8",
      "Barre posée sur le haut du dos, pas sur la nuque, pieds largeur d'épaules. Descends en t'asseyant entre les talons, dos neutre, genoux dans l'axe des pieds, puis remonte en poussant dans tout le pied.",
      "Dos neutre, genoux dans l'axe des pieds, talons au sol.", "Le dos ne s'arrondit pas en bas, les genoux ne rentrent pas.",
      "Commence avec la barre seule pour le geste. Utilise toujours les sécurités de la cage.", "Arrêt si douleur dans le dos ou le genou."),
    E("Soulevé de terre roumain à la barre", 2, ["barre et disques"], "3 séries de 8",
      "Debout, barre tenue bras tendus, genoux légèrement fléchis. Pousse les fesses en arrière, la barre glisse le long des cuisses jusqu'au milieu des tibias, dos neutre, puis remonte en serrant les fessiers.",
      "La barre reste collée aux jambes, le dos reste droit.", "On ne fait pas le dos rond et on ne plie pas les genoux pour descendre plus.",
      "On descend jusqu'à sentir l'étirement derrière les cuisses, pas plus bas.", "Arrêt si douleur dans le bas du dos."),
    E("Hip thrust à la barre", 2, ["barre et disques", "un banc", "une mousse pour la barre"], "3 séries de 10",
      "Haut du dos sur le banc, barre sur les hanches (avec une mousse), pieds à plat. Monte le bassin jusqu'à aligner épaules, hanches et genoux, serre les fessiers 1 seconde, puis redescends.",
      "En haut, le menton reste rentré, les côtes basses.", "On ne cambre pas le bas du dos pour monter plus haut.",
      "Un des meilleurs exercices pour les fessiers.", "Arrêt si douleur au bas du dos."),
    E("Fentes avec haltères", 2, ["deux haltères"], "3 séries de 8 par jambe",
      "Un haltère dans chaque main. Fais un grand pas, descends jusqu'à ce que le genou arrière effleure le sol, puis repousse. Buste droit.",
      "Le genou avant reste au-dessus de la cheville.", "Le genou avant ne rentre pas vers l'intérieur.",
      "En marchant dans la salle si la place le permet.", "Arrêt si douleur dans le genou."),
    E("Abduction de hanche à la poulie", 1, ["poulie basse", "sangle de cheville"], "3 séries de 12 par jambe",
      "Debout de côté par rapport à la poulie, sangle à la cheville du côté opposé à la poulie, une main sur le montant. Écarte la jambe sur le côté, jambe tendue, puis reviens lentement.",
      "Le bassin reste horizontal, le buste droit.", "On ne penche pas le buste pour monter la jambe plus haut.",
      "Charge légère : c'est le contrôle qui compte.", "Arrêt si douleur sur le côté de la hanche."),
    E("Développé couché aux haltères", 2, ["deux haltères", "un banc"], "3 séries de 10",
      "Allongé sur le banc, pieds au sol, un haltère dans chaque main au-dessus de la poitrine. Descends en contrôle, coudes à environ 45° du corps, puis pousse vers le plafond.",
      "Les omoplates restent serrées sur le banc.", "Les coudes ne s'écartent pas à 90° et les fesses restent sur le banc.",
      "Les haltères sont plus doux pour les épaules qu'une barre.", "Arrêt si douleur à l'avant de l'épaule."),
    E("Tirage vertical", 1, ["machine de tirage vertical"], "3 séries de 10",
      "Assis, cuisses bloquées, barre tenue mains un peu plus larges que les épaules. Tire la barre vers le haut de la poitrine en serrant les omoplates, puis remonte lentement, bras presque tendus.",
      "La barre descend devant, vers la poitrine, omoplates serrées.", "On ne tire pas derrière la nuque et on ne se balance pas.",
      "Prise plus serrée, paumes vers toi : plus de biceps.", "Arrêt si douleur dans l'épaule ou le cou."),
    E("Tirage horizontal à la poulie", 1, ["poulie basse", "poignée triangle"], "3 séries de 12",
      "Assis face à la poulie, buste droit, genoux légèrement fléchis. Tire la poignée vers le nombril en gardant les coudes le long du corps, serre les omoplates, puis reviens lentement.",
      "Le buste reste droit, ce sont les omoplates qui se rapprochent.", "On ne se penche pas en arrière pour tirer.",
      "Un classique pour la posture et les épaules.", "Arrêt si douleur dans le bas du dos ou l'épaule."),
    E("Développé épaules aux haltères", 2, ["deux haltères", "un banc"], "3 séries de 10",
      "Assis, dos droit, haltères à hauteur d'épaules. Pousse vers le plafond sans cambrer, puis redescends en contrôle.",
      "Les côtes restent basses, le dos ne se cambre pas.", "On ne verrouille pas les coudes brutalement en haut.",
      "Si lever le bras fait mal, préfère l'élévation en diagonale en attendant.", "Arrêt si douleur ou accrochage dans l'épaule."),
    E("Rowing un bras à l'haltère", 1, ["un haltère", "un banc"], "3 séries de 10 par bras",
      "Une main et un genou sur le banc, dos plat. Tire l'haltère vers la hanche en gardant le coude près du corps, puis redescends lentement.",
      "Le dos reste plat, le coude part vers la hanche.", "On ne tourne pas le buste pour tirer plus.",
      "Plus dur : pause d'une seconde en haut.", "Arrêt si douleur dans le dos ou l'épaule."),
    E("Rotation externe à la poulie", 1, ["poulie", "poignée"], "3 séries de 12 par bras",
      "De côté par rapport à la poulie réglée à hauteur de coude, coude collé au corps plié à 90°. Tourne l'avant-bras vers l'extérieur, puis reviens lentement.",
      "Le coude reste collé au corps.", "Le buste ne tourne pas.",
      "Charge légère : on travaille la coiffe des rotateurs, pas la force maximale.", "Arrêt si douleur dans l'épaule."),
    E("Rotation interne à la poulie", 1, ["poulie", "poignée"], "3 séries de 12 par bras",
      "De côté par rapport à la poulie réglée à hauteur de coude, coude collé au corps plié à 90°. Ramène l'avant-bras vers le ventre, puis reviens lentement.",
      "Le coude reste collé au corps.", "Le buste ne tourne pas.",
      "À associer à la rotation externe.", "Arrêt si douleur dans l'épaule."),
    E("Face pull à la poulie", 1, ["poulie haute", "corde"], "3 séries de 12",
      "Face à la poulie réglée à hauteur de visage, corde tenue à deux mains. Tire la corde vers le visage en écartant les mains et en montant les coudes, puis reviens lentement.",
      "Les coudes montent, les mains finissent de chaque côté du visage.", "On ne se penche pas en arrière.",
      "Excellent pour l'arrière des épaules et la posture.", "Arrêt si douleur dans l'épaule."),
    E("Pallof press à la poulie", 2, ["poulie", "poignée"], "3 séries de 10 par côté",
      "De côté par rapport à la poulie à hauteur de poitrine, poignée contre le sternum. Pousse la poignée droit devant toi sans laisser le buste tourner, tiens 2 secondes, puis ramène.",
      "Le buste ne tourne pas, les bras partent droit devant.", "On ne se penche pas vers la poulie.",
      "Gainage anti-rotation : excellent pour le dos.", "Arrêt si douleur au bas du dos."),
    E("Marche du fermier lourde", 2, ["deux haltères ou kettlebells lourds"], "3 fois 30 mètres",
      "Un poids lourd dans chaque main, bras le long du corps. Marche droit, épaules basses, buste gainé, à pas normaux.",
      "Épaules basses, buste droit.", "On ne se penche pas d'un côté.",
      "Renforce la prise, les épaules et tout le tronc.", "Arrêt si douleur dans le dos.")
  ];
  if (window.KineBiblio && KineBiblio.extend) {
    var G = KineBiblio.groups; if (G && !G.some(function (g) { return g[0] === "salle"; })) G.push(["salle", "Salle de sport"]);
    KineBiblio.extend(F);
  }
  window.KineSalleEx = { list: F.map(function (e) { return e.name; }) };
})();
