/* ═══════════ KinéForce — exercices de la hanche, du dos et du cou ═══════════
   Ceux qui manquaient à la bibliothèque pour les parcours hanche et rachis, du plus simple au plus loufoque.
   Même principe que kine-genou-ex.js : poses de Yass, fiche de la bibliothèque, et phrase « à quoi ça sert ». */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT, SUPINE_FEET = lib.SUPINE_FEET, SUPINE_HANDS = lib.SUPINE_HANDS, lifted = lib.lifted;
  var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };
  var LIE = { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0 };
  var STRAIGHT = { L: { ang: [0, 4, 0, 0, -10] }, R: { ang: [0, 4, 0, 0, -10] } };
  var SUP_CAM = { yaw: 1.25, pitch: 0.4, dist: 3.4, ty: 0.25, tz: 0.1 };
  var TOP_CAM = { yaw: 0.35, pitch: 0.9, dist: 3.4, ty: 0.2, tz: 0.15 };
  var PRONE = { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [0, 0, 0], head: -12, L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] } };
  var HIPS = { LA: { hand: { at: [0.2, 0.98, -0.02], pole: [1, -0.3, -0.6] } }, RA: { hand: { at: [-0.2, 0.98, -0.02], pole: [-1, -0.3, -0.6] } } };
  var SEAT_HANDS = { LA: { hand: { at: [0.25, 0.5, -0.34], pole: [1, 0.2, 0] } }, RA: { hand: { at: [-0.25, 0.5, -0.34], pole: [-1, 0.2, 0] } } };
  var THIGHS = { LA: { hand: { at: [0.2, 0.6, -0.02], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.2, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } };
  var SEAT_CAM = { yaw: 1.2, dist: 3.6, ty: 0.65, pitch: 0.2 };
  // Sur un pied : le pied droit porte, la jambe gauche travaille
  var ONE = function (free, extra) { return merge({ pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0, R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } }, L: free }, HIPS, extra || {}); };

  /* ════════════════ HANCHE ════════════════ */
  reg("Contraction des fessiers couché", {
    noIso: true, camera: SUP_CAM, start: "rest", thumb: "hold",
    poses: { rest: merge(LIE, SUPINE_HANDS, STRAIGHT), hold: merge(LIE, SUPINE_HANDS, STRAIGHT, { pelvis: { p: [0, 0.128, 0], r: [-91, 0, 0] } }) },
    steps: [step("hold", 1, "On serre les fesses", "On serre fort les fesses", "up"), step("hold", 5, "On tient 5 secondes", "On tient", "hold"), step("rest", 1.5, "On relâche", "On relâche", "down")]
  });
  reg("Glissement de la jambe sur le côté, couché", {
    sides: "blocks", sideWord: "jambe", noIso: true, camera: TOP_CAM, start: "in", thumb: "out",
    poses: { "in": merge(LIE, SUPINE_HANDS, STRAIGHT), out: merge(LIE, SUPINE_HANDS, STRAIGHT, { L: { ang: [0, 34, 0, 0, -10] } }) },
    steps: [step("out", 2, "La jambe glisse sur le côté", "La jambe glisse sur le côté, pointe du pied vers le plafond", "up"), step("out", 1, "On tient", null, "hold"), step("in", 2, "Elle revient", null, "down")]
  });
  reg("Rotation de hanche couché, genou plié", {
    sides: "blocks", sideWord: "jambe", noIso: true, camera: { yaw: 0.1, pitch: 0.55, dist: 3.2, ty: 0.25, tz: 0.3 }, start: "up", thumb: "out",
    poses: { up: merge(LIE, SUPINE_HANDS, SUPINE_FEET), out: merge(LIE, SUPINE_HANDS, SUPINE_FEET, { L: { ang: [42, 58, 0, 105, -10] } }) },
    steps: [step("out", 2, "Le genou tombe doucement sur le côté", "Le genou s'ouvre doucement sur le côté, le bassin reste au sol", "up"), step("out", 2, "On tient", null, "hold"), step("up", 2, "Il revient", null, "down")]
  });
  reg("Montée de genou assis", {
    sides: "alternate", noIso: true, props: ["chair"], camera: SEAT_CAM, start: "down", thumb: "up",
    poses: { down: merge(SEAT, SEAT_HANDS), up: merge(SEAT, SEAT_HANDS, { spine: [2, 0, 0], L: { ang: [118, 4, 0, 95, 0] } }) },
    steps: [step("up", 1.5, "Le genou monte vers la poitrine", "Le genou monte, le dos reste droit", "up"), step("up", 1, "On tient", null, "hold"), step("down", 1.5, "On repose le pied", null, "down")]
  });
  reg("Abduction contre le mur, debout", {
    sides: "blocks", sideWord: "jambe", labelSwap: false, noIso: true, props: ["wallSide"], wallSideX: 0.36, camera: { yaw: -0.5, dist: 3.8, ty: 0.75 }, start: "rest", thumb: "push",
    poses: { rest: ONE({ ang: [4, 6, 0, 18, 0] }, { pelvis: { p: [0.04, "auto", 0], r: [0, 0, 0] } }), push: ONE({ ang: [4, 10, 0, 18, 0] }, { pelvis: { p: [0.04, "auto", 0], r: [0, 0, 0] } }) },
    steps: [step("push", 1, "Le genou pousse le mur sur le côté", "La jambe pousse le mur sur le côté, le bassin reste droit", "up"), step("push", 30, "On tient 30 secondes", "On pousse, sans bouger", "hold"), step("rest", 2, "On relâche", "On relâche", "down")]
  });
  reg("Montée de marche sur le côté", {
    sides: "blocks", sideWord: "jambe", labelSwap: false, camera: { yaw: 0.15, dist: 4.0, ty: 0.75 }, props: ["step"], stepAt: { x: 0.3, z: 0.02 }, start: "down", thumb: "up",
    poses: {
      down: merge(HIPS, { pelvis: { p: [0.1, "auto", 0], r: [0, 0, 4] }, spine: [2, 0, -4], head: 0, L: { foot: { at: [0.3, 0.18, 0.12], yaw: 0 } }, R: { foot: { at: [-0.06, 0, 0.12], yaw: 0 } } }),
      up: merge(HIPS, { pelvis: { p: [0.28, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0, L: { foot: { at: [0.3, 0.18, 0.12], yaw: 0 } }, R: { ang: [10, 3, 0, 40, 0] } })
    },
    steps: [step("up", 1.5, "On monte sur le côté", "On monte sur la marche, le bassin reste droit", "up"), step("up", 1, "On tient", null, "hold"), step("down", 2, "On redescend lentement", null, "down")]
  });
  var HULA = function (x, z) { return merge(STAND(0.13, 6), HIPS, { pelvis: { p: [x, "auto", z], r: [z * 60, 0, -x * 60] }, spine: [-z * 60, 0, x * 60] }); };
  reg("Le hula hoop", {
    noIso: true, timed: { seconds: 40 }, camera: { yaw: 0.6, dist: 3.8, ty: 0.85 }, start: "a", thumb: "b",
    poses: { a: HULA(0.06, 0), b: HULA(0, 0.06), c: HULA(-0.06, 0), d: HULA(0, -0.06) },
    steps: [step("b", 0.6, "Le bassin fait de grands cercles", "On fait tourner un cerceau imaginaire avec le bassin", "up"), step("c", 0.6, "Le bassin tourne", null, "up"), step("d", 0.6, "Le bassin tourne", null, "down"), step("a", 0.6, "Le bassin tourne", null, "down")]
  });
  var CAT = function (sg) { return merge(HIPS, { pelvis: { p: [0.02 * sg, "auto", 0], r: [0, 0, -3 * sg] }, spine: [2, 0, 3 * sg], head: -4, L: { foot: { at: [-0.02, sg > 0 ? 0 : 0.03, 0.12 + (sg > 0 ? 0 : 0.26)], yaw: 0, lift: sg > 0 ? 0 : 20 } }, R: { foot: { at: [0.02, sg > 0 ? 0.03 : 0, 0.12 + (sg > 0 ? 0.26 : 0)], yaw: 0, lift: sg > 0 ? 20 : 0 } } }); };
  reg("La marche du mannequin", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 0.4, dist: 4.2, ty: 0.85 }, start: "a", thumb: "a",
    poses: { a: CAT(1), b: CAT(-1) },
    steps: [step("a", 0.7, "Un pied devant l'autre, sur la ligne", "On défile, un pied croise devant l'autre", "up"), step("b", 0.7, "On défile", null, "down")]
  });
  var CRAB = function (w) { return merge({ pelvis: { p: [0, 0.76, -0.12], r: [20, 0, 0] }, spine: [14, 0, 0], head: -8, LA: { ang: [70, 10, 0, 60] }, RA: { ang: [70, 10, 0, 60] } }, { L: { foot: { at: [w, 0, 0.12], yaw: 12 } }, R: { foot: { at: [-w, 0, 0.12], yaw: -12 } } }); };
  reg("Le pas du crabe", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 0.15, dist: 4.3, ty: 0.65 }, start: "n", thumb: "w",
    poses: { n: CRAB(0.12), w: CRAB(0.3) },
    steps: [step("w", 0.6, "Pas chassé sur le côté, accroupi", "On avance sur le côté comme un crabe, toujours accroupi", "up"), step("n", 0.6, "On rapproche les pieds", null, "down")]
  });
  reg("La porte du saloon", {
    sides: "blocks", sideWord: "jambe", noIso: true, camera: { yaw: 0.3, dist: 3.9, ty: 0.85 }, start: "mid", thumb: "open",
    poses: { mid: ONE({ ang: [82, 6, 0, 90, 0] }), open: ONE({ ang: [76, 48, 0, 90, 0] }), shut: ONE({ ang: [82, -14, 0, 90, 0] }) },
    steps: [step("open", 1.2, "Le genou s'ouvre comme une porte de saloon", "Genou levé, il s'ouvre sur le côté", "up"), step("mid", 0.8, "Il revient", null, "down"), step("shut", 1, "Il se ferme devant", null, "up"), step("mid", 0.8, "Il revient", null, "down")]
  });

  /* ════════════════ DOS ════════════════ */
  var BELLY = { LA: { hand: { at: [0.06, 0.23, -0.12], pole: [1, -0.6, 0] } }, RA: { hand: { at: [-0.05, 0.25, -0.34], pole: [-1, -0.6, 0] } } };
  reg("Respiration abdominale couché", {
    noIso: true, timed: { seconds: 60 }, camera: SUP_CAM, start: "out", thumb: "in",
    poses: { out: merge(LIE, SUPINE_FEET, BELLY), "in": merge(LIE, SUPINE_FEET, BELLY, { LA: { hand: { at: [0.06, 0.26, -0.12], pole: [1, -0.6, 0] } } }) },
    steps: [step("in", 4, "On inspire, le ventre se gonfle", "On inspire par le nez, le ventre monte sous la main", "up"), step("out", 5, "On souffle lentement", "On souffle lentement par la bouche", "down")]
  });
  reg("Genoux vers la poitrine couché", {
    noIso: true, camera: SUP_CAM, start: "down", thumb: "up",
    poses: { down: merge(LIE, SUPINE_FEET, SUPINE_HANDS), up: merge(LIE, { L: { ang: [118, 6, 0, 120, -10] }, R: { ang: [118, 6, 0, 120, -10] }, LA: { ang: [70, 12, 0, 70] }, RA: { ang: [70, 12, 0, 70] } }) },
    steps: [step("up", 2, "Les genoux viennent vers la poitrine", "On ramène doucement les genoux vers la poitrine", "up"), step("up", 10, "On tient en respirant", "On tient, en respirant", "hold"), step("down", 2, "On repose les pieds", null, "down")]
  });
  var SPHINX = function (ext) { return merge(PRONE, { spine: [-ext, 0, 0], head: -ext * 0.4, LA: { hand: { at: [0.17, 0.03, 0.72], pole: [0.4, -1, -0.3] } }, RA: { hand: { at: [-0.17, 0.03, 0.72], pole: [-0.4, -1, -0.3] } } }); };
  reg("Extension couché sur les coudes", {
    noIso: true, timed: { seconds: 60 }, camera: { yaw: 1.35, pitch: 0.25, dist: 3.6, ty: 0.3, tz: 0.3 }, start: "down", thumb: "up",
    poses: { down: SPHINX(8), up: SPHINX(30) },
    steps: [step("up", 2, "On se redresse sur les coudes", "On se met sur les coudes, le ventre reste au sol", "up"), step("up", 20, "On tient, le dos détendu", "On tient, en respirant", "hold"), step("down", 2, "On redescend", null, "down")]
  });
  var NECK = function (hy, hz) { return merge(SEAT, THIGHS, { head: 0, headY: hy, headZ: hz }); };
  reg("Rotation du cou", {
    noIso: true, props: ["chair"], camera: { yaw: 0.25, dist: 3.0, ty: 1.05 }, start: "mid", thumb: "l",
    poses: { mid: NECK(0, 0), l: NECK(55, 0), r: NECK(-55, 0) },
    steps: [step("l", 1.5, "La tête tourne d'un côté", "On tourne la tête doucement, le menton reste horizontal", "up"), step("l", 1, "On tient", null, "hold"), step("mid", 1, "Retour au centre", null, "down"), step("r", 1.5, "Puis de l'autre côté", null, "up"), step("r", 1, "On tient", null, "hold"), step("mid", 1, "Retour au centre", null, "down")]
  });
  reg("Inclinaison du cou", {
    noIso: true, props: ["chair"], camera: { yaw: 0.05, dist: 3.0, ty: 1.05 }, start: "mid", thumb: "l",
    poses: { mid: NECK(0, 0), l: NECK(0, 30), r: NECK(0, -30) },
    steps: [step("l", 1.5, "L'oreille descend vers l'épaule", "L'oreille descend vers l'épaule, l'épaule reste basse", "up"), step("l", 1, "On tient", null, "hold"), step("mid", 1, "Retour au centre", null, "down"), step("r", 1.5, "De l'autre côté", null, "up"), step("r", 1, "On tient", null, "hold"), step("mid", 1, "Retour au centre", null, "down")]
  });
  var SCIA = function (ext) { return merge(SEAT, SEAT_HANDS, { spine: [16, 0, 0], head: ext ? -22 : 24, L: { ang: [88, 4, 0, ext ? 12 : 90, ext ? 15 : 0] } }); };
  reg("Glissement du nerf sciatique assis", {
    sides: "blocks", sideWord: "jambe", noIso: true, props: ["chair"], camera: SEAT_CAM, start: "bent", thumb: "ext",
    poses: { bent: SCIA(false), ext: SCIA(true) },
    steps: [step("ext", 1.5, "La jambe se tend, la tête se relève", "On tend la jambe en relevant la tête, sans forcer", "up"), step("bent", 1.5, "La jambe se plie, la tête descend", "On plie la jambe et on baisse la tête", "down")]
  });
  var MED = function (ext) { return merge(STAND(0.11, 6), { headZ: ext ? 20 : -20, LA: { ang: [6, 88, 0, ext ? 6 : 85] }, RA: { ang: [4, 7, 0, 10] } }); };
  reg("Glissement du nerf du bras", {
    sides: "blocks", sideWord: "bras", noIso: true, camera: { yaw: 0.05, dist: 3.6, ty: 1.15 }, start: "bent", thumb: "ext",
    poses: { bent: MED(false), ext: MED(true) },
    steps: [step("ext", 1.5, "Le coude se tend, la tête penche vers le bras", "Bras sur le côté : le coude se tend et la tête penche vers lui", "up"), step("bent", 1.5, "Le coude plie, la tête part de l'autre côté", null, "down")]
  });
  var HINGE = merge({ pelvis: { p: [0, 0.8, -0.16], r: [55, 0, 0] }, spine: [8, 0, 0], head: -20, L: { foot: { at: [0.12, 0, 0.12], yaw: 6 } }, R: { foot: { at: [-0.12, 0, 0.12], yaw: -6 } } });
  reg("Ramasser un objet en charnière de hanche", {
    load: "L", noIso: true, camera: { yaw: 1.2, dist: 4.0, ty: 0.7 }, start: "up", thumb: "down",
    poses: { up: merge(STAND(0.12, 6), { LA: { ang: [6, 8, 0, 14] } }), down: merge(HINGE, { LA: { hand: { at: [0.14, 0.14, 0.32], pole: [0.6, 0, -1] } }, RA: { hand: { at: [-0.18, 0.62, 0.08], pole: [-1, -0.3, -0.4] } } }) },
    steps: [step("down", 2, "Les fesses reculent, le dos reste droit", "On recule les fesses, le dos droit, pour attraper l'objet", "down"), step("up", 2, "On se relève en poussant les hanches", "On se relève en poussant les hanches vers l'avant", "up")]
  });
  reg("Soulevé de terre avec deux sacs", {
    load: "both", loadKind: "kettlebell", camera: { yaw: 1.2, dist: 4.0, ty: 0.7 }, start: "up", thumb: "down",
    poses: { up: merge(STAND(0.13, 6), { LA: { ang: [4, 10, 0, 0] }, RA: { ang: [4, 10, 0, 0] } }), down: merge(HINGE, { pelvis: { p: [0, 0.76, -0.18], r: [50, 0, 0] }, LA: { hand: { at: [0.2, 0.42, 0.16], pole: [0.6, 0, -1] } }, RA: { hand: { at: [-0.2, 0.42, 0.16], pole: [-0.6, 0, -1] } } }) },
    steps: [step("down", 2.5, "Descente : fesses en arrière, dos droit", "On descend les sacs le long des jambes, dos droit", "down"), step("up", 2, "On se relève, hanches en avant", "On se relève en poussant les hanches", "up")]
  });
  /* ── les loufoques ── */
  var HELI = function (r) { return merge(STAND(0.14, 6), { spine: [2, 0, r], head: 0, LA: { ang: [6, 86, 0, 4] }, RA: { ang: [6, 86, 0, 4] } }); };
  reg("L'hélicoptère", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 0.5, dist: 4.0, ty: 1.0, pitch: 0.4 }, start: "l", thumb: "l",
    poses: { l: HELI(38), r: HELI(-38) },
    steps: [step("l", 1, "Les bras tournent comme des pales", "Bras tendus, le buste tourne comme les pales d'un hélicoptère", "up"), step("r", 1.4, "De l'autre côté", null, "down")]
  });
  var METRO = function (b) { return merge(STAND(0.14, 6), { spine: [2, b, 0], LA: { ang: [168, 12, 0, 10] }, RA: { ang: [168, 12, 0, 10] } }); };
  reg("Le métronome", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 0.05, dist: 4.0, ty: 1.1 }, start: "mid", thumb: "l",
    poses: { mid: METRO(0), l: METRO(20), r: METRO(-20) },
    steps: [step("l", 1.2, "Tic : on penche d'un côté", "Bras en l'air, on penche d'un côté, comme un métronome", "up"), step("mid", 0.8, "Retour", null, "down"), step("r", 1.2, "Tac : de l'autre côté", null, "up"), step("mid", 0.8, "Retour", null, "down")]
  });
  reg("La tortue", {
    noIso: true, props: ["chair"], camera: { yaw: 1.4, dist: 2.9, ty: 1.05 }, start: "out", thumb: "in",
    poses: { out: merge(SEAT, THIGHS, { spine: [10, 0, 0], head: -16 }), "in": merge(SEAT, THIGHS, { spine: [0, 0, 0], head: 8 }) },
    steps: [step("in", 1.5, "La tortue rentre la tête dans sa carapace", "On rentre le menton, comme une tortue qui rentre la tête", "up"), step("in", 3, "On tient", "On tient", "hold"), step("out", 1.5, "Elle ressort doucement", null, "down")]
  });

  /* ════════════════ FICHES ════════════════ */
  var E = function (name, group, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: group, color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop }; };
  var F = [
    E("Contraction des fessiers couché", "hanche", 1, ["un lit ou un tapis"], "10 répétitions",
      "Allongé sur le dos, jambes tendues. Serre fort les fesses, comme pour pincer une pièce de monnaie, pendant 5 secondes, puis relâche.",
      "On serre les fesses sans décoller le dos.", "On ne bloque pas la respiration.",
      "Le premier exercice après une opération de la hanche ou quand elle est très douloureuse.", "Arrêt si douleur vive."),
    E("Glissement de la jambe sur le côté, couché", "hanche", 1, ["un lit ou un tapis"], "10 répétitions par jambe",
      "Allongé sur le dos, jambes tendues. Fais glisser une jambe sur le côté, pointe du pied vers le plafond, puis ramène-la au milieu, sans la croiser.",
      "La pointe du pied reste vers le plafond.", "On ne croise pas la jambe au-delà du milieu.",
      "Réveille les abducteurs après une prothèse de hanche, sans porter le poids de la jambe. Plus facile : une serviette sous le talon pour glisser.", "Arrêt si douleur vive."),
    E("Rotation de hanche couché, genou plié", "mobilite", 1, ["un tapis"], "10 répétitions par jambe",
      "Allongé sur le dos, genoux pliés, pieds à plat. Laisse un genou s'ouvrir doucement sur le côté, le bassin reste au sol, puis ramène-le.",
      "Le bassin ne bouge pas, seul le genou s'ouvre.", "On ne force pas : on s'arrête à la gêne.",
      "Entretient la mobilité de la hanche en douceur. Plus d'amplitude : les deux genoux ensemble.", "Arrêt si douleur dans l'aine."),
    E("Montée de genou assis", "hanche", 1, ["une chaise"], "10 répétitions par jambe",
      "Assis au bord d'une chaise, dos droit. Lève un genou vers la poitrine, tiens une seconde, puis repose le pied. Alterne.",
      "Le dos reste droit, on ne se penche pas en arrière.", "On ne tire pas avec les mains.",
      "Renforce le muscle qui lève la jambe, utile pour monter une marche ou entrer dans une voiture. Plus dur : un sac posé sur le genou.", "Arrêt si douleur dans l'aine."),
    E("Abduction contre le mur, debout", "hanche", 1, ["un mur"], "5 fois 30 secondes par jambe",
      "Debout de profil contre un mur, sur la jambe éloignée du mur. La jambe proche du mur, un peu décollée du sol, pousse le mur sur le côté. Tiens 30 secondes, le bassin bien droit.",
      "Le bassin reste horizontal, on pousse de façon constante.", "On ne se penche pas vers le mur.",
      "L'exercice de départ recommandé pour la douleur latérale de hanche : il renforce sans comprimer le tendon.", "Douleur au-dessus de 4/10 : on pousse moins fort."),
    E("Montée de marche sur le côté", "hanche", 2, ["une marche"], "10 répétitions par jambe",
      "De profil à côté d'une marche. Pose le pied sur la marche et monte sur cette jambe, l'autre jambe reste dans le vide, puis redescends lentement.",
      "Le bassin reste horizontal, le genou au-dessus du pied.", "On ne pousse pas avec la jambe d'en bas.",
      "Renforce les fessiers en charge, comme pour monter un escalier. Plus dur : une marche plus haute ou un sac à dos.", "Arrêt si douleur dans la hanche ou le genou."),
    E("Le hula hoop", "mobilite", 1, [], "40 secondes",
      "Debout, pieds écartés, mains sur les hanches. Fais de grands cercles avec le bassin, comme pour faire tourner un cerceau, dans un sens puis dans l'autre.",
      "Le haut du corps reste calme, c'est le bassin qui tourne.", "On ne force pas sur les genoux.",
      "Détend les hanches et le bas du dos. Plus amusant : avec de la musique.", "Arrêt si douleur."),
    E("La marche du mannequin", "hanche", 2, ["un couloir dégagé"], "30 secondes",
      "Marche comme un mannequin sur un podium : chaque pied se pose devant l'autre, sur une ligne imaginaire, mains sur les hanches, le bassin tenu.",
      "Le bassin ne tombe pas à chaque pas.", "On ne se dandine pas exagérément.",
      "Les fessiers travaillent pour tenir le bassin à chaque pas. Plus dur : plus lentement, en marquant une pause sur chaque pied.", "Près d'un mur au début."),
    E("Le pas du crabe", "hanche", 2, ["un couloir dégagé"], "30 secondes",
      "Accroupi à mi-hauteur, avance sur le côté à petits pas chassés, sans te relever, comme un crabe. Puis repars dans l'autre sens.",
      "On reste à la même hauteur, le dos droit.", "Les pieds ne se croisent pas.",
      "Renforce les fessiers et les cuisses, sans matériel. Plus dur : un élastique autour des genoux.", "Arrêt si douleur dans la hanche ou le genou."),
    E("La porte du saloon", "hanche", 2, [], "10 répétitions par jambe",
      "Debout sur une jambe, l'autre genou levé devant toi. Ouvre le genou sur le côté puis ramène-le devant, comme une porte de saloon qui bat.",
      "La jambe d'appui et le bassin restent immobiles.", "On ne se penche pas.",
      "Mobilité et contrôle de la hanche en rotation, utile au sport. Plus facile : une main au mur.", "Arrêt si douleur dans l'aine."),
    E("Respiration abdominale couché", "dos", 1, ["un tapis"], "1 à 2 minutes",
      "Allongé sur le dos, genoux pliés, une main sur le ventre, l'autre sur la poitrine. Inspire par le nez en gonflant le ventre, puis souffle lentement par la bouche.",
      "La main du ventre monte, celle de la poitrine bouge peu.", "On ne force pas l'inspiration.",
      "Détend les muscles du dos et calme la douleur. À faire aussi le soir pour mieux dormir.", "Arrêt si vertiges : respire plus doucement."),
    E("Genoux vers la poitrine couché", "dos", 1, ["un tapis"], "5 fois 10 secondes",
      "Allongé sur le dos, ramène doucement les deux genoux vers la poitrine, mains sous les genoux, et tiens en respirant.",
      "Le bas du dos s'arrondit doucement contre le sol.", "On ne tire pas fort sur les genoux.",
      "Soulage beaucoup de dos raides le matin. Plus facile : un genou à la fois.", "Arrêt si la douleur descend dans la jambe."),
    E("Extension couché sur les coudes", "dos", 1, ["un tapis"], "1 minute",
      "Allongé sur le ventre, relève le buste en t'appuyant sur les avant-bras, coudes sous les épaules. Le ventre reste au sol, le dos se détend.",
      "Le bas du dos se laisse aller, les fesses restent détendues.", "On ne pousse pas sur les bras au début.",
      "Soulage souvent les douleurs qui descendent dans la jambe. Plus loin : bras tendus, si c'est bien supporté.", "Arrêt si la douleur descend plus loin dans la jambe."),
    E("Rotation du cou", "cou", 1, ["une chaise"], "5 fois de chaque côté",
      "Assis, dos droit. Tourne doucement la tête d'un côté, comme pour regarder par-dessus l'épaule, tiens 2 secondes, reviens au centre, puis de l'autre côté.",
      "Le menton reste horizontal, les épaules ne bougent pas.", "On ne force pas en fin de mouvement.",
      "Entretient la mobilité du cou, par exemple pour regarder derrière en voiture.", "Arrêt si vertiges ou fourmillements."),
    E("Inclinaison du cou", "cou", 1, ["une chaise"], "5 fois de chaque côté",
      "Assis, dos droit. Penche doucement la tête pour approcher l'oreille de l'épaule, tiens 2 secondes, reviens, puis de l'autre côté.",
      "L'épaule reste basse, on ne la remonte pas vers l'oreille.", "On ne tourne pas la tête en même temps.",
      "Détend les côtés du cou et le haut des épaules.", "Arrêt si vertiges ou fourmillements dans le bras."),
    E("Glissement du nerf sciatique assis", "mobilite", 1, ["une chaise"], "10 répétitions par jambe",
      "Assis, le dos un peu arrondi. Tends la jambe en relevant la tête, puis plie la jambe en baissant la tête. Un mouvement fluide, sans forcer.",
      "Le mouvement va et vient, sans tenir en fin d'amplitude.", "Ce n'est pas un étirement : pas de position tenue.",
      "Aide le nerf sciatique à glisser et calme souvent une sciatique. Plus doux : moins loin dans les deux sens.", "Arrêt si fourmillements qui persistent après l'exercice."),
    E("Glissement du nerf du bras", "mobilite", 1, [], "10 répétitions par bras",
      "Debout, le bras sur le côté à hauteur d'épaule. Tends le coude en penchant la tête vers ce bras, puis plie le coude en penchant la tête de l'autre côté.",
      "Un mouvement fluide, comme un va-et-vient.", "On ne tire pas : aucune position tenue.",
      "Aide le nerf du bras à glisser, utile dans la névralgie cervico-brachiale.", "Arrêt si fourmillements qui persistent après l'exercice."),
    E("Ramasser un objet en charnière de hanche", "dos", 2, ["une bouteille ou un objet léger"], "10 répétitions",
      "Debout, un objet léger au sol devant toi. Recule les fesses en gardant le dos droit, genoux un peu pliés, pour attraper l'objet, puis relève-toi en poussant les hanches vers l'avant.",
      "Le dos reste droit, ce sont les hanches qui plient.", "On ne s'enroule pas pour attraper l'objet.",
      "Réapprend à ramasser sans crainte, un geste répété cent fois par jour. Plus dur : un objet plus lourd.", "Arrêt si douleur qui descend dans la jambe."),
    E("Soulevé de terre avec deux sacs", "dos", 3, ["deux sacs de courses ou deux haltères"], "8 répétitions",
      "Debout, un sac dans chaque main. Descends les sacs le long des jambes en reculant les fesses, dos droit, puis relève-toi en poussant les hanches.",
      "Les sacs frôlent les jambes, le dos reste droit.", "On ne descend pas plus bas que ce que le dos tient droit.",
      "Renforce tout l'arrière du corps pour porter sans douleur. Plus dur : sacs plus lourds.", "Arrêt si douleur vive ou qui descend dans la jambe."),
    E("L'hélicoptère", "mobilite", 1, [], "30 secondes",
      "Debout, bras tendus sur les côtés. Tourne le buste d'un côté puis de l'autre, comme les pales d'un hélicoptère, le bassin reste face à l'avant.",
      "Le bassin ne tourne pas, c'est le haut du dos qui travaille.", "On ne lance pas les bras violemment.",
      "Assouplit le haut du dos, souvent raide quand on a mal au dos ou au cou.", "Arrêt si douleur vive."),
    E("Le métronome", "mobilite", 1, [], "30 secondes",
      "Debout, bras tendus au-dessus de la tête. Penche-toi d'un côté puis de l'autre, en rythme, comme l'aiguille d'un métronome.",
      "On penche sur le côté, sans se pencher en avant.", "On ne bloque pas la respiration.",
      "Assouplit les côtés du tronc et ouvre la cage thoracique.", "Arrêt si douleur vive."),
    E("La tortue", "cou", 1, ["une chaise"], "10 répétitions",
      "Assis, dos droit. Rentre le menton en reculant la tête, comme une tortue qui rentre dans sa carapace, tiens 3 secondes, puis relâche.",
      "Le regard reste horizontal : la tête recule sans se pencher.", "On ne baisse pas la tête vers la poitrine.",
      "Renforce les muscles profonds du cou et corrige la tête trop en avant devant les écrans.", "Arrêt si vertiges.")
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  var U = function (s2, e) { return { s: s2, e: e }; };
  var USE = {
    "Contraction des fessiers couché": U("Les fessiers se réveillent sans bouger la hanche : la base pour remarcher.", ["Se lever du lit", "Remarcher après une opération", "Tenir debout"]),
    "Glissement de la jambe sur le côté, couché": U("Les abducteurs retravaillent sans porter le poids de la jambe.", ["Marcher sans boiter", "Sortir du lit", "Monter en voiture"]),
    "Rotation de hanche couché, genou plié": U("La hanche retrouve sa rotation en douceur.", ["Enfiler ses chaussettes", "S'asseoir en tailleur", "Sortir de la voiture"]),
    "Montée de genou assis": U("Le muscle qui lève la cuisse se renforce.", ["Monter une marche", "Entrer dans une voiture", "Enjamber un obstacle"]),
    "Abduction contre le mur, debout": U("Les fessiers se renforcent sans comprimer le tendon sur l'os : idéal pour la douleur latérale de hanche.", ["Marcher sans douleur sur le côté de la hanche", "Monter les escaliers", "Rester debout longtemps"]),
    "Montée de marche sur le côté": U("Les fessiers tiennent le bassin pendant que la jambe porte le poids du corps.", ["Monter les escaliers", "Monter sur un trottoir", "Marcher en montée"]),
    "Le hula hoop": U("Les hanches et le bas du dos bougent dans toutes les directions.", ["Moins de raideur", "Danser", "Se détendre après être resté assis"]),
    "La marche du mannequin": U("À chaque pas, les fessiers tiennent le bassin bien droit.", ["Marcher sans se dandiner", "Garder l'équilibre", "Marcher longtemps"]),
    "Le pas du crabe": U("Fessiers et cuisses travaillent ensemble, en mouvement.", ["Se déplacer sur le côté au sport", "S'accroupir", "Jouer avec des enfants"]),
    "La porte du saloon": U("La hanche travaille en rotation, sur une jambe : mobilité et contrôle.", ["Enjamber un obstacle", "Jouer au foot", "Changer de direction"]),
    "Respiration abdominale couché": U("Le diaphragme travaille, les muscles du dos se détendent et la douleur baisse.", ["Se détendre", "Mieux dormir", "Calmer une crise de mal de dos"]),
    "Genoux vers la poitrine couché": U("Le bas du dos s'étire doucement et se détend.", ["Soulager un dos raide le matin", "Se lever plus facilement", "Se détendre"]),
    "Extension couché sur les coudes": U("Le dos se cambre doucement : beaucoup de douleurs qui descendent dans la jambe remontent et diminuent.", ["Soulager une sciatique", "Rester assis plus longtemps", "Se redresser"]),
    "Rotation du cou": U("Le cou retrouve sa rotation, pour regarder autour de soi sans douleur.", ["Regarder derrière en voiture", "Tourner la tête au travail", "Dormir plus confortablement"]),
    "Inclinaison du cou": U("Les côtés du cou se détendent.", ["Moins de tensions dans le cou", "Travailler sur écran", "Se détendre"]),
    "Glissement du nerf sciatique assis": U("Le nerf sciatique glisse mieux dans ses gaines : il devient moins sensible.", ["Soulager une sciatique", "S'asseoir plus longtemps", "Se pencher en avant"]),
    "Glissement du nerf du bras": U("Le nerf du bras glisse mieux et devient moins sensible.", ["Soulager une douleur qui descend dans le bras", "Lever le bras", "Dormir sans fourmillements"]),
    "Ramasser un objet en charnière de hanche": U("Le dos apprend à se plier par les hanches : on ramasse sans crainte.", ["Ramasser un objet", "Porter un enfant", "Vider le lave-vaisselle"]),
    "Soulevé de terre avec deux sacs": U("Tout l'arrière du corps se renforce pour porter des charges.", ["Porter les courses", "Déménager un carton", "Jardiner"]),
    "L'hélicoptère": U("Le haut du dos retrouve sa rotation.", ["Regarder derrière soi", "Jouer au golf ou au tennis", "Se tenir droit"]),
    "Le métronome": U("Les côtés du tronc s'assouplissent, la respiration s'ouvre.", ["Attraper un objet sur le côté", "Se tenir droit", "Respirer plus amplement"]),
    "La tortue": U("Les muscles profonds du cou se renforcent et ramènent la tête au-dessus des épaules.", ["Travailler sur écran sans douleur", "Moins de maux de tête", "Se tenir droit"])
  };
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });
  window.KineHancheDosEx = { names: F.map(function (f) { return f.name; }) };
})();
