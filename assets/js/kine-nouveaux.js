/* ═══════════ KinéForce — nouveaux exercices (cou, épaule, coude-poignet-main, genou, pied, hanche, dos) ═══════════
   Chaque exercice : les poses de Yass, la fiche de la bibliothèque, et, pour les mouvements qu'on voit mal
   sur l'avatar (menton, voûte du pied, poignet, contractions sans mouvement…), un petit schéma animé
   synchronisé avec les étapes du mouvement. */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT, lifted = lib.lifted;
  var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };

  /* ════════ 1. COU ════════ */
  var THIGHS = { LA: { hand: { at: [0.2, 0.6, -0.02], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.2, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } };
  var SIT = merge(SEAT, { spine: [0, 0, 0], head: 0 }, THIGHS);
  reg("Rentrer le menton", {
    noIso: true, camera: { yaw: 1.45, dist: 2.6, ty: 1.05, pitch: 0.1 }, props: ["chair"], start: "rest", thumb: "tuck",
    poses: { rest: merge(SIT, { head: -1 }), tuck: merge(SIT, { head: 10 }) },
    steps: [step("tuck", 1.5, "On rentre le menton", "On rentre le menton, regard droit", "up"), step("tuck", 3, "On tient", "On tient", "hold"), step("rest", 1.5, "On relâche", "On relâche", "down")]
  });
  reg("Contraction du cou contre la main", {
    noIso: true, camera: { yaw: 0.9, dist: 2.8, ty: 1.0, pitch: 0.1 }, props: ["chair"], start: "rest", thumb: "front",
    poses: {
      rest: SIT,
      front: merge(SIT, { RA: { hand: { at: [-0.02, 1.33, -0.2], pole: [-1, -0.6, 0.2] } } }),
      right: merge(SIT, { RA: { hand: { at: [-0.12, 1.35, -0.36], pole: [-1, -0.8, 0.3] } } }),
      left: merge(SIT, { LA: { hand: { at: [0.12, 1.35, -0.36], pole: [1, -0.8, 0.3] } } })
    },
    steps: [step("front", 1, "Main sur le front", null, "up"), step("front", 5, "Le front pousse, la tête ne bouge pas", "On pousse le front contre la main, la tête ne bouge pas", "hold"), step("rest", 2, "On relâche", "On relâche", "down"),
            step("right", 1, "Main sur la tempe droite", null, "up"), step("right", 5, "On pousse sur le côté", "On pousse sur le côté", "hold"), step("rest", 2, "On relâche", "On relâche", "down"),
            step("left", 1, "Main sur la tempe gauche", null, "up"), step("left", 5, "On pousse de l'autre côté", "De l'autre côté", "hold"), step("rest", 2, "On relâche", "On relâche", "down")]
  });

  /* ════════ 2. ÉPAULE ════════ */
  var SC_OUT = merge(STAND(0.12, 0), { LA: { ang: [25, 8, 0, 90] }, RA: { ang: [25, 8, 0, 90] } });
  var SC_IN = merge(STAND(0.12, 0), { LA: { ang: [-22, 14, 0, 90] }, RA: { ang: [-22, 14, 0, 90] } });
  reg("Serrage des omoplates", {
    camera: { yaw: 2.7, pitch: 0.12, ty: 1.15, dist: 3.4 }, start: "out", thumb: "in",
    poses: { out: SC_OUT, in: SC_IN },
    steps: [step("in", 1.5, "On serre les omoplates", "Coudes en arrière, on serre les omoplates", "up"), step("in", 2, "On tient", "On tient", "hold"), step("out", 1.5, "On relâche", "On relâche", "down")]
  });
  // Pendulaire : penché en avant, une main sur le dossier de la chaise, l'autre bras pend et dessine de petits cercles
  var CODMAN = { pelvis: { p: [-0.3, "auto", -0.05], r: [50, 0, 0] }, spine: [8, 0, 0], head: -10,
    L: { foot: { at: [-0.17, 0, 0.18], yaw: 6 } }, R: { foot: { at: [-0.43, 0, 0.18], yaw: -6 } },
    LA: { hand: { at: [-0.04, 0.9, 0.62], pole: [1, -0.3, -0.5] } } };
  var cod = function (fx, ab) { return merge(CODMAN, { RA: { ang: [58 + fx, ab, 0, 4] } }); };
  reg("Pendulaire de Codman", {
    sides: "blocks", sideWord: "bras", noIso: true, timed: { seconds: 30 }, camFlip: true, camera: { yaw: -1.2, dist: 3.8, ty: 0.75, pitch: 0.15 }, props: ["chair"], chair: { z: 0.1, turn: true },
    start: "c0", thumb: "c1",
    poses: { c0: cod(-18, 6), c1: cod(0, 24), c2: cod(18, 6), c3: cod(0, -10) },
    steps: [step("c1", 0.8, "Le bras pend, petits cercles", null, "up"), step("c2", 0.8, "Le bras pend, petits cercles", null, "up"), step("c3", 0.8, "Le bras pend, petits cercles", null, "down"), step("c0", 0.8, "Le bras pend, petits cercles", null, "down")]
  });
  var WALL_ISO = merge(STAND(0.12, 0), { pelvis: { p: [0, "auto", 0.245], r: [0, 0, 0] }, RA: { ang: [4, 7, 0, 10] } });
  reg("Contraction de l'épaule contre le mur", {
    sides: "blocks", sideWord: "bras", noIso: true, camFlip: true, camera: { yaw: 1.2, dist: 3.4, ty: 1.0 }, props: ["wall"], start: "rest", thumb: "push",
    poses: {
      rest: merge(WALL_ISO, { LA: { hand: { at: [0.21, 1.12, 0.5], pole: [0.2, -1, -0.6] } } }),
      push: merge(WALL_ISO, { LA: { hand: { at: [0.21, 1.12, 0.555], pole: [0.2, -1, -0.6] } } })
    },
    steps: [step("push", 1, "Poing contre le mur", null, "up"), step("push", 5, "On pousse, le bras ne bouge pas", "On pousse contre le mur, le bras ne bouge pas", "hold"), step("rest", 2, "On relâche", "On relâche", "down")]
  });
  var WP_FEET = function (lift) { return { L: { foot: { at: [0.12, 0, -0.32], yaw: 4, lift: lift } }, R: { foot: { at: [-0.12, 0, -0.32], yaw: -4, lift: lift } } }; };
  var WP_HANDS = { LA: { hand: { at: [0.27, 1.28, 0.555], pole: [0.7, -0.3, -0.7] } }, RA: { hand: { at: [-0.27, 1.28, 0.555], pole: [-0.7, -0.3, -0.7] } } };
  reg("Pompe au mur avec poussée des omoplates", {
    camera: { yaw: 1.3, dist: 4.2, ty: 0.95, tz: 0.1 }, props: ["wall"], start: "up", thumb: "plus",
    poses: {
      up: merge(STAND(0.12, 4), { pelvis: { p: [0, 0.88, -0.15], r: [14, 0, 0] }, spine: [0, 0, 0], head: 0 }, WP_FEET(10), WP_HANDS),
      plus: merge(STAND(0.12, 4), { pelvis: { p: [0, 0.875, -0.2], r: [14, 0, 0] }, spine: [6, 0, 0], head: 0 }, WP_FEET(8), WP_HANDS),
      down: merge(STAND(0.12, 4), { pelvis: { p: [0, 0.84, -0.03], r: [24, 0, 0] }, spine: [0, 0, 0], head: 0 }, WP_FEET(30), WP_HANDS)
    },
    steps: [step("down", 2, "On descend", "On descend vers le mur", "down"), step("up", 1.2, "On pousse", "On pousse", "up"),
            step("plus", 1, "Encore un peu : le dos s'arrondit", "Encore un peu, les omoplates s'écartent", "up"), step("plus", 1, "On tient", null, "hold"), step("up", 1, "On relâche", null, "down")]
  });
  reg("Élévation des bras en diagonale", {
    load: "both", camera: { yaw: 0.7, dist: 4.1 }, start: "down", thumb: "up",
    poses: { down: merge(STAND(0.11, 6), { LA: { ang: [6, 22, 0, 6] }, RA: { ang: [6, 22, 0, 6] } }),
             up: merge(STAND(0.11, 6), { LA: { ang: [86, 32, 0, 6] }, RA: { ang: [86, 32, 0, 6] } }) },
    steps: [step("up", 2, "On monte, pouces vers le haut", "On monte en diagonale, pouces vers le haut", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 3, "Descente lente", "On redescend lentement", "down")]
  });
  // Livre ouvert : couché sur le côté, genoux pliés ; le bras du dessus s'ouvre vers l'arrière, le regard suit la main
  var BOOK = { pelvis: { p: [0, 0.2, 0], r: [0, 0, -90] }, spine: [0, 0, 0], head: 0,
    L: { ang: [70, 0, 0, 90, 0] }, R: { ang: [70, 0, 0, 90, 0] },
    LA: { hand: { at: [0.5, 0.04, 0.5], pole: [0, -1, 0] } } };
  reg("Livre ouvert couché sur le côté", {
    sides: "blocks", noIso: true, camera: { yaw: 0.25, pitch: 0.7, dist: 3.2, ty: 0.15, tx: 0.2 }, start: "closed", thumb: "open",
    poses: {
      closed: merge(BOOK, { RA: { hand: { at: [0.5, 0.1, 0.52], pole: [0, 1, 0] } } }),
      open: merge(BOOK, { spine: [0, 0, -55], head: 0, RA: { hand: { at: [0.5, 0.12, -0.5], pole: [0, 1, 0] } } })
    },
    steps: [step("open", 2.5, "On ouvre le livre", "Le bras s'ouvre, le regard suit la main", "up"), step("open", 2, "On respire", "On respire", "hold"), step("closed", 2, "On referme", "On referme", "down")]
  });
  /* ════════ 3. COUDE, POIGNET, MAIN ════════ */
  // Assis, avant-bras posé sur la cuisse, la main dépasse du genou
  var FORE = merge(SEAT, { spine: [24, 0, 0], head: -8, LA: { hand: { at: [0.15, 0.6, 0.15], pole: [0.6, -1, -0.3] } }, RA: { hand: { at: [-0.2, 0.6, -0.04], pole: [-1, -0.2, -0.4] } } });
  var foreUp = function (dy) { return merge(FORE, { LA: { hand: { at: [0.15, 0.6 + dy, 0.15], pole: [0.6, -1, -0.3] } } }); };
  var HAND_CAM = { yaw: 1.1, dist: 2.7, ty: 0.75, pitch: 0.3, tz: 0 };
  reg("Excentrique du poignet avec une bouteille", {
    noIso: true, sides: "blocks", sideWord: "poignet", labelSwap: true, camFlip: true, load: "L", camera: HAND_CAM, props: ["chair"], start: "down", thumb: "up",
    poses: { down: foreUp(-0.03), up: merge(foreUp(0.03), { RA: { hand: { at: [0.13, 0.66, 0.2], pole: [-1, -0.4, -0.2] } } }), top: foreUp(0.03) },
    steps: [step("up", 1.2, "L'autre main aide à remonter", "L'autre main aide à remonter", "up"), step("top", 0.6, "On lâche l'aide", null, "hold"), step("down", 4, "Descente lente en 4 secondes", "On descend lentement, quatre secondes", "down")]
  });
  reg("Serrer une balle", {
    noIso: true, sides: "blocks", sideWord: "main", labelSwap: true, camFlip: true, camera: HAND_CAM, props: ["chair"], start: "open", thumb: "grip",
    poses: { open: foreUp(0), grip: foreUp(0.005) },
    steps: [step("grip", 1, "On serre", "On serre la balle", "up"), step("grip", 3, "On tient", "On tient", "hold"), step("open", 2, "On relâche", "On relâche", "down")]
  });
  reg("Rotation de l'avant-bras avec un marteau", {
    noIso: true, sides: "blocks", sideWord: "bras", labelSwap: true, camFlip: true, load: "L", camera: HAND_CAM, props: ["chair"], start: "mid", thumb: "mid",
    poses: { mid: foreUp(0), pro: foreUp(0.002), sup: foreUp(-0.002) },
    steps: [step("pro", 2, "Paume vers le sol, lentement", "Paume vers le sol", "down"), step("mid", 1.5, "On revient", null, "up"), step("sup", 2, "Paume vers le plafond", "Paume vers le plafond", "up"), step("mid", 1.5, "On revient", null, "down")]
  });

  /* ════════ 4. GENOU ════════ */
  var ARMS_FWD = { LA: { ang: [85, 8, 0, 0] }, RA: { ang: [85, 8, 0, 0] } };
  var SP_FEET = { L: { foot: { at: [0.14, 0, 0.16], yaw: 6 } }, R: { foot: { at: [-0.14, 0, 0.16], yaw: -6 } } };
  reg("Spanish squat à l'élastique", {
    camera: { yaw: 1.25, dist: 4.0, ty: 0.75 }, start: "up", thumb: "down", bands: [["LK", [0.12, 0.5, 1.0]], ["RK", [-0.12, 0.5, 1.0]]],
    poses: {
      up: merge(STAND(0.14, 6), { pelvis: { p: [0, "auto", -0.03], r: [0, 0, 0] }, spine: [-4, 0, 0] }, SP_FEET, ARMS_FWD),
      down: merge({ pelvis: { p: [0, 0.58, -0.3], r: [8, 0, 0] }, spine: [-6, 0, 0], head: 0 }, SP_FEET, ARMS_FWD)
    },
    steps: [step("down", 2.5, "On s'assoit en arrière", "On s'assoit en arrière, tibias verticaux", "down"), step("down", 1, "On tient", "On tient", "hold"), step("up", 2, "On remonte", "On remonte", "up")]
  });
  var HEEL_FEET = function (lift) { return { L: { foot: { at: [0.13, 0.03, 0.14], yaw: 8, lift: lift } }, R: { foot: { at: [-0.13, 0.03, 0.14], yaw: -8, lift: lift } } }; };
  reg("Squat talons surélevés", {
    camera: { yaw: 1.3, dist: 4.0, ty: 0.8 }, start: "up", thumb: "down",
    poses: {
      up: merge(STAND(0.13, 8), { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] } }, HEEL_FEET(18), ARMS_FWD),
      down: merge({ pelvis: { p: [0, 0.55, -0.08], r: [6, 0, 0] }, spine: [4, 0, 0], head: 0 }, HEEL_FEET(18), ARMS_FWD)
    },
    steps: [step("down", 3, "Descente en 3 secondes", "On descend lentement, genoux vers l'avant", "down"), step("up", 1.5, "On remonte", "On remonte", "up")]
  });
  reg("Extension de genou tenue", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camFlip: true, timed: { byWeek: [30, 30, 45, 45] }, camera: { yaw: 1.3, dist: 3.6, ty: 0.65 }, props: ["chair"], start: "rest", thumb: "hold",
    poses: {
      rest: merge(SEAT, { LA: { hand: { at: [0.27, 0.47, -0.2], pole: [1, 0, -0.3] } }, RA: { hand: { at: [-0.27, 0.47, -0.2], pole: [-1, 0, -0.3] } } }),
      hold: merge(SEAT, { LA: { hand: { at: [0.27, 0.47, -0.2], pole: [1, 0, -0.3] } }, RA: { hand: { at: [-0.27, 0.47, -0.2], pole: [-1, 0, -0.3] } }, L: { ang: [90, 4, 0, 40, -10] } })
    }
  });

  /* ════════ 5. PIED ════════ */
  var FOOT_CAM = { yaw: 1.2, dist: 3.5, ty: 0.55, pitch: 0.28, tz: -0.08 };
  var SEAT_FEET = merge(SEAT, THIGHS, { spine: [10, 0, 0], head: -14 });
  reg("Pied court", {
    noIso: true, sides: "blocks", sideWord: "pied", labelSwap: true, camFlip: true, camera: FOOT_CAM, props: ["chair"], start: "flat", thumb: "arch",
    poses: { flat: SEAT_FEET, arch: merge(SEAT_FEET, { L: { foot: { at: [0.14, 0.004, 0.13], yaw: 6 } } }) },
    steps: [step("arch", 2, "La voûte monte", "On raccourcit le pied, la voûte monte", "up"), step("arch", 5, "On tient", "On tient, orteils à plat", "hold"), step("flat", 2, "On relâche", "On relâche", "down")]
  });
  reg("Serviette ramassée avec les orteils", {
    sides: "blocks", sideWord: "pied", labelSwap: true, camFlip: true, timed: { seconds: 30 }, noIso: true, camera: FOOT_CAM, props: ["chair"], start: "open", thumb: "curl",
    poses: { open: SEAT_FEET, curl: merge(SEAT_FEET, { L: { foot: { at: [0.14, 0, 0.12], yaw: 6 } } }) },
    steps: [step("curl", 0.7, "Les orteils attrapent", null, "up"), step("curl", 0.4, "Les orteils attrapent", null, "hold"), step("open", 0.7, "On relâche, on recommence", null, "down")]
  });
  var TOE_BASE = merge(STAND(0.1, 4), { LA: { ang: [10, 12, 0, 30] }, RA: { ang: [10, 12, 0, 30] } });
  reg("Marche sur la pointe des pieds", {
    timed: { seconds: 30 }, noIso: true, camera: { yaw: 1.2 }, start: "a", thumb: "b",
    poses: {
      a: lifted(TOE_BASE, 42),
      b: merge(lifted(TOE_BASE, 42), { L: { foot: { at: [0.11, 0.05, 0.3], yaw: 4, lift: 42 } } }),
      c: merge(lifted(TOE_BASE, 42), { R: { foot: { at: [-0.11, 0.05, 0.3], yaw: -4, lift: 42 } } })
    },
    steps: [step("b", 0.6, "Sur la pointe des pieds", null, "up"), step("a", 0.5, "Sur la pointe des pieds", null, "down"), step("c", 0.6, "Sur la pointe des pieds", null, "up"), step("a", 0.5, "Sur la pointe des pieds", null, "down")]
  });
  var SEAT0 = { pelvis: { p: [0, 0.53, -0.36], r: [0, 0, 0] }, spine: [4, 0, 0], head: 0, L: { foot: { at: [0.14, 0, 0.14], yaw: 6 } },
                LA: { hand: { at: [0.17, 0.6, -0.02], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.17, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } };
  var footAt = function (yaw) { var r = yaw * Math.PI / 180; return { at: [-0.14 + 0.12 * Math.sin(r), 0, 0.02 + 0.12 * Math.cos(r)], yaw: yaw, pole: [-0.05, 0.05, 1] }; };
  reg("Inversion à l'élastique", {
    sides: "blocks", sideWord: "pied", labelSwap: true, camera: { yaw: 0.5, pitch: 0.45, dist: 3.2, ty: 0.35 }, props: ["chair"], start: "out", thumb: "in",
    bands: [["RA", [-0.6, 0.05, 0.16]]],
    poses: { out: merge(SEAT0, { R: { foot: footAt(-6) } }), in: merge(SEAT0, { R: { foot: footAt(26) } }) },
    steps: [step("in", 1.5, "Le pied tourne en dedans", "Le pied tourne vers l'intérieur", "up"), step("in", 1, "On tient", "On tient", "hold"), step("out", 2, "Retour lent", "On revient lentement", "down")]
  });

  /* ════════ 6. HANCHE ════════ */
  // Planche Copenhague, version genou : appui avant-bras, intérieur du genou du dessus sur la chaise, jambe du dessous libre
  reg("Planche Copenhague genou sur chaise", {
    sides: "blocks", snapSideChange: true, timed: { byWeek: [15, 20, 20, 25] }, camera: { yaw: 0.05, pitch: 0.25, dist: 3.6, ty: 0.35, tx: -0.2 },
    props: ["bench"], bench: { x: -0.62, z: 0 }, start: "rest", thumb: "hold",
    poses: {
      rest: { pelvis: { p: [0, 0.221, 0], r: [0, 0, -82] }, spine: [0, 0, 0], head: 0,
              L: { ang: [0, 0, 0, 90, 0] }, R: { foot: { at: [-0.62, 0.47, -0.32], yaw: 0, pole: [0, 1, 0.3] } },
              LA: { hand: { at: [0.514, 0.047, 0.26], pole: [0.2, -1, -0.3] } }, RA: { ang: [0, 8, 0, 30] } },
      hold: { pelvis: { p: [0, 0.4, 0], r: [0, 0, -72] }, spine: [0, 0, 0], head: 0,
              L: { ang: [0, 0, 0, 60, 0] }, R: { foot: { at: [-0.62, 0.47, -0.32], yaw: 0, pole: [0, 1, 0.3] } },
              LA: { hand: { at: [0.56, 0.047, 0.26], pole: [0.2, -1, -0.3] } }, RA: { ang: [0, 8, 0, 30] } }
    }
  });

  /* ════════ 7. DOS ════════ */
  var PRONE = { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [0, 0, 0], head: -12, L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] } };
  reg("Extension en appui sur les mains", {
    camera: { yaw: 0.95, pitch: 0.4, dist: 3.5, ty: 0.25, tz: 0.25 }, start: "down", thumb: "up",
    poses: {
      down: merge(PRONE, { LA: { hand: { at: [0.27, 0.05, 0.4], pole: [1, 0.2, -0.5] } }, RA: { hand: { at: [-0.27, 0.05, 0.4], pole: [-1, 0.2, -0.5] } } }),
      up: merge(PRONE, { spine: [-55, 0, 0], head: 8, LA: { hand: { at: [0.27, 0.05, 0.4], pole: [1, 0.2, -0.5] } }, RA: { hand: { at: [-0.27, 0.05, 0.4], pole: [-1, 0.2, -0.5] } } })
    },
    steps: [step("up", 2, "Les bras poussent, le bassin reste au sol", "Les bras poussent, le bassin reste au sol", "up"), step("up", 1.5, "On tient, on souffle", "On souffle", "hold"), step("down", 2, "On redescend", "On redescend", "down")]
  });
  var CARRY = function (k) { return merge(STAND(0.11, 4), k ? (k === "L" ? { L: { ang: [40, 3, 0, 50, 0] } } : { R: { ang: [40, 3, 0, 50, 0] } }) : {}, { LA: { ang: [2, 12, 0, 4] }, RA: { ang: [8, 8, 0, 20] } }); };
  reg("Marche avec une charge d'un seul côté", {
    sides: "blocks", sideWord: "main", load: "L", loadKind: "kettlebell", timed: { seconds: 30 }, noIso: true, camera: { yaw: 0.35, dist: 4.1 }, start: "up", thumb: "kL",
    poses: { up: CARRY(), kL: CARRY("L"), kR: CARRY("R") },
    steps: [step("kL", 0.6, "Buste droit, il ne penche pas", null, "up"), step("up", 0.4, "Buste droit, il ne penche pas", null, "down"), step("kR", 0.6, "Buste droit, il ne penche pas", null, "up"), step("up", 0.4, "Buste droit, il ne penche pas", null, "down")]
  });
  // Charnière de hanche : les fesses partent en arrière jusqu'à toucher le mur, dos droit
  reg("Charnière de hanche, fesses au mur", {
    camera: { yaw: 1.35, dist: 4.1 }, props: ["wall"], start: "up", thumb: "down",
    poses: {
      up: merge(STAND(0.12, 6), lib.CROSS, { pelvis: { p: [0, "auto", 0.32], r: [0, 180, 0] }, L: { foot: { at: [0.12, 0, 0.14], yaw: 186 } }, R: { foot: { at: [-0.12, 0, 0.14], yaw: 174 } } }),
      down: merge(STAND(0.12, 6), lib.CROSS, { pelvis: { p: [0, "auto", 0.5], r: [55, 180, 0] }, head: -15, L: { foot: { at: [0.12, 0, 0.14], yaw: 186 } }, R: { foot: { at: [-0.12, 0, 0.14], yaw: 174 } } })
    },
    steps: [step("down", 2.5, "Les fesses vont toucher le mur", "Dos droit, les fesses vont toucher le mur", "down"), step("up", 1.5, "On se redresse", "On serre les fessiers, on se redresse", "up")]
  });

  /* ════════ FICHES DE LA BIBLIOTHÈQUE ════════ */
  var F = [
    { name: "Rentrer le menton", group: "cou", color: 1, kit: ["une chaise"], repsLabel: "10 répétitions",
      desc: "Assis bien droit, regard à l'horizontale. Recule le menton tout droit vers l'arrière, comme pour faire un double menton, sans baisser la tête. Tiens 3 secondes, puis relâche.",
      cue: "Le menton recule, le regard reste à l'horizontale.", err: "Ne baisse pas la tête vers la poitrine : on glisse vers l'arrière, on ne hoche pas.",
      tip: "Plus facile : allongé sur le dos, l'arrière de la tête glisse sur l'oreiller. Plus dur : tiens 10 secondes.", stop: "Arrêt si douleur qui descend dans le bras, fourmillements ou vertiges." },
    { name: "Contraction du cou contre la main", group: "cou", color: 1, kit: ["une chaise"], repsLabel: "5 répétitions",
      desc: "Assis bien droit. Pose une main sur le front et pousse doucement la tête contre la main, qui résiste : la tête ne bouge pas. Tiens 5 secondes, relâche. Fais de même main sur la tempe droite, puis sur la tempe gauche. Une répétition = les trois directions.",
      cue: "On pousse à environ un tiers de sa force, la tête reste immobile.", err: "Ne bloque pas ta respiration et ne hausse pas les épaules.",
      tip: "Plus dur : pousse un peu plus fort, ou tiens 8 secondes. Ajoute l'arrière de la tête (main derrière) si ton kiné te le conseille.", stop: "Arrêt si douleur vive dans le cou, ou douleur qui descend dans le bras." },
    { name: "Serrage des omoplates", group: "tirage", color: 1, kit: [], repsLabel: "12 répétitions",
      desc: "Debout ou assis, coudes pliés à 90° le long du corps. Tire les coudes en arrière en rapprochant les omoplates de la colonne, épaules basses. Tiens 2 secondes, puis relâche.",
      cue: "Les omoplates se rapprochent, les épaules restent basses.", err: "Ne hausse pas les épaules vers les oreilles, ne cambre pas le dos.",
      tip: "Idéal au bureau, toutes les heures. Plus dur : avec un élastique tenu devant toi.", stop: "Arrêt si douleur entre les omoplates ou dans le cou." },
    { name: "Pendulaire de Codman", group: "epaule", color: 1, kit: ["une chaise ou une table"], repsLabel: "30 secondes par bras",
      desc: "Debout, penché en avant, une main en appui sur le dossier d'une chaise ou sur une table. L'autre bras pend, complètement relâché. Avec un petit balancement du corps, laisse le bras dessiner de petits cercles, puis des allers-retours.",
      cue: "C'est le corps qui balance, le bras reste lourd et détendu.", err: "Le bras ne travaille pas : s'il force, les cercles sont trop grands.",
      tip: "Utile pour détendre une épaule raide ou douloureuse, avant les autres exercices.", stop: "Arrêt si la douleur augmente pendant l'exercice." },
    { name: "Contraction de l'épaule contre le mur", group: "epaule", color: 1, kit: ["un mur libre"], repsLabel: "5 répétitions par bras",
      desc: "Face au mur, coude plié à 90° le long du corps, poing contre le mur. Pousse le poing contre le mur, sans que le bras bouge. Tiens 5 secondes, puis relâche.",
      cue: "On pousse sans bouger, à une force qui ne fait pas mal.", err: "Ne hausse pas l'épaule et ne penche pas le buste vers le mur.",
      tip: "Change ensuite de position pour pousser dans d'autres directions : côté du poing contre le mur (bras qui s'écarte), dos de la main (rotation). Plus dur : pousse plus fort, ou tiens 10 secondes.", stop: "Arrêt si la douleur dépasse 3 sur 10 pendant la poussée." },
    { name: "Pompe au mur avec poussée des omoplates", group: "epaule", color: 1, kit: ["un mur libre"], repsLabel: "10 répétitions",
      desc: "Mains contre le mur à hauteur d'épaules, corps droit. Fais une pompe contre le mur, puis, bras tendus, pousse encore un peu : le haut du dos s'arrondit légèrement et les omoplates s'écartent. Relâche et recommence.",
      cue: "En haut, on pousse le mur encore un peu plus loin.", err: "Ne creuse pas le bas du dos et ne hausse pas les épaules.",
      tip: "Plus dur : sur un plan de travail, puis au sol sur les genoux.", stop: "Arrêt si douleur à l'avant de l'épaule." },
    { name: "Élévation des bras en diagonale", group: "epaule", color: 1, kit: ["deux bouteilles d'eau"], repsLabel: "12 répétitions",
      desc: "Debout, une bouteille dans chaque main, pouces vers le haut. Monte les bras tendus en diagonale, un peu vers l'avant (en V), jusqu'à hauteur d'épaules. Tiens 1 seconde, puis redescends lentement.",
      cue: "Pouces vers le plafond, les bras montent en V jusqu'aux épaules.", err: "Ne monte pas plus haut que les épaules et ne hausse pas les épaules.",
      tip: "Plus facile : sans bouteilles. Plus dur : descente en 4 secondes.", stop: "Arrêt si douleur ou accrochage dans l'épaule pendant la montée." },
    { name: "Livre ouvert couché sur le côté", group: "mobilite", color: 1, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "Couché sur le côté, hanches et genoux pliés à 90°, bras tendus devant toi, mains l'une sur l'autre. Ouvre le bras du dessus vers l'arrière comme on ouvre un livre, en tournant le haut du dos, le regard suit la main. Respire, puis referme.",
      cue: "Les genoux restent collés au sol, c'est le haut du dos qui tourne.", err: "Les genoux ne se soulèvent pas, on ne force pas en bout de mouvement.",
      tip: "Un coussin sous la tête rend la position plus confortable.", stop: "Arrêt si douleur dans l'épaule ou fourmillements dans le bras." },
    { name: "Excentrique du poignet avec une bouteille", group: "main", color: 1, kit: ["une bouteille d'eau", "une chaise"], repsLabel: "15 répétitions par poignet",
      desc: "Assis, avant-bras posé sur la cuisse, paume vers le sol, la main dépasse du genou avec une bouteille. Remonte le poignet en t'aidant de l'autre main, puis lâche l'aide et laisse redescendre lentement, en 4 secondes, avec le poignet seul.",
      cue: "On monte avec l'aide, on descend seul et lentement.", err: "L'avant-bras reste posé, seul le poignet bouge.",
      tip: "Classique du « tennis elbow » : une petite gêne est acceptable si elle redescend avant le lendemain. Plus dur : bouteille plus lourde.", stop: "Arrêt si la douleur au coude dépasse 4 sur 10 ou reste plus forte le lendemain." },
    { name: "Serrer une balle", group: "main", color: 1, kit: ["une balle souple ou une chaussette roulée"], repsLabel: "10 répétitions par main",
      desc: "Assis, avant-bras posé sur la cuisse, une balle souple dans la main. Serre la balle le plus fort possible sans douleur, tiens 3 secondes, puis relâche complètement.",
      cue: "Tous les doigts serrent, puis on ouvre bien la main.", err: "Le poignet reste droit, il ne se plie pas.",
      tip: "Plus dur : une balle plus ferme, ou tiens 5 secondes.", stop: "Arrêt si douleur dans le poignet, les doigts ou le coude." },
    { name: "Rotation de l'avant-bras avec un marteau", group: "main", color: 1, kit: ["un marteau ou une bouteille"], repsLabel: "10 répétitions par bras",
      desc: "Assis, avant-bras posé sur la cuisse, pouce vers le haut, tenant un marteau par le manche. Tourne lentement l'avant-bras pour poser la paume vers le sol, reviens, puis tourne la paume vers le plafond. Le coude ne bouge pas.",
      cue: "Lentement, le coude reste collé à la cuisse.", err: "On ne compense pas avec l'épaule.",
      tip: "Plus facile : tiens le manche près de la tête du marteau. Plus dur : tiens-le plus loin.", stop: "Arrêt si douleur vive au coude ou au poignet." },
    { name: "Spanish squat à l'élastique", group: "genou", color: 2, kit: ["un élastique solide", "un point fixe (poteau, pied de table lourd)"], repsLabel: "8 répétitions",
      desc: "Élastique fixé devant toi, passé derrière les deux genoux, assez tendu. Recule pour le tendre, pieds largeur d'épaules. Descends en t'asseyant en arrière, tibias verticaux, buste droit, jusqu'à 60 à 90° de flexion de genou. Tiens 1 seconde, puis remonte.",
      cue: "L'élastique tient les genoux : les tibias restent verticaux, on s'assoit en arrière.", err: "Les genoux ne partent pas vers l'avant, le dos ne se penche pas.",
      tip: "Souvent bien toléré pour les douleurs du tendon rotulien. Une version tenue (30 à 45 secondes en bas) peut calmer la douleur.", stop: "Arrêt si la douleur sous la rotule dépasse 4 sur 10." },
    { name: "Squat talons surélevés", group: "genou", color: 2, kit: ["un livre épais ou une planche"], repsLabel: "10 répétitions",
      desc: "Debout, talons posés sur un livre épais (3 à 5 cm), pieds largeur de hanches. Descends lentement en 3 secondes, buste droit, genoux qui avancent au-dessus des orteils, puis remonte.",
      cue: "Buste droit, les genoux avancent : la cuisse travaille plus.", err: "Les talons restent posés sur le livre, les genoux restent dans l'axe des pieds.",
      tip: "Version maison du squat sur plan incliné, utilisée pour le tendon rotulien. Plus facile : descends moins bas. Plus dur : sur une jambe.", stop: "Arrêt si la douleur sous la rotule dépasse 4 sur 10." },
    { name: "Extension de genou tenue", group: "genou", color: 1, kit: ["une chaise"], repsLabel: "30 secondes par jambe",
      desc: "Assis au fond de la chaise. Tends la jambe à moitié, genou légèrement plié, et tiens-la en l'air en serrant fort la cuisse. Respire normalement pendant tout le maintien.",
      cue: "La cuisse est contractée, la rotule remonte.", err: "Ne te penche pas en arrière et ne bloque pas ta respiration.",
      tip: "Plus dur : un sac léger ou une bouteille posée sur la cheville, ou 45 secondes.", stop: "Arrêt si douleur vive dans le genou." },
    { name: "Pied court", group: "mollet", color: 1, kit: ["une chaise"], repsLabel: "8 répétitions par pied",
      desc: "Assis, pied à plat au sol. Sans plier les orteils, rapproche la base du gros orteil du talon : le pied raccourcit et la voûte plantaire monte. Tiens 5 secondes, puis relâche.",
      cue: "La voûte monte, les orteils restent à plat et détendus.", err: "Les orteils ne griffent pas le sol.",
      tip: "Discret mais efficace pour la voûte du pied. Plus dur : debout, puis sur un pied.", stop: "Arrêt si crampe ou douleur sous le pied." },
    { name: "Serviette ramassée avec les orteils", group: "mollet", color: 1, kit: ["une serviette", "une chaise"], repsLabel: "30 secondes par pied",
      desc: "Assis, pied posé sur une serviette étalée au sol. Avec les orteils, attrape la serviette et ramène-la vers toi petit à petit, le talon reste posé.",
      cue: "Les orteils agrippent puis relâchent, le talon ne bouge pas.", err: "On ne tire pas avec la jambe : seuls les orteils travaillent.",
      tip: "Plus dur : pose un petit poids (un livre) au bout de la serviette.", stop: "Arrêt si crampe ou douleur sous le pied." },
    { name: "Marche sur la pointe des pieds", group: "mollet", color: 2, kit: [], repsLabel: "30 secondes",
      desc: "Monte sur la pointe des pieds et marche à petits pas, talons hauts, buste droit, en gardant la hauteur tout du long.",
      cue: "Les talons restent hauts, les chevilles bien droites.", err: "Les chevilles ne partent pas vers l'extérieur.",
      tip: "Plus facile : près d'un mur pour se rattraper. Plus dur : 45 secondes.", stop: "Arrêt si douleur au tendon d'Achille ou sous le pied." },
    { name: "Inversion à l'élastique", group: "mollet", color: 1, kit: ["un élastique", "une chaise"], repsLabel: "15 répétitions par pied",
      desc: "Assis, pied à plat, un élastique autour de l'avant du pied, accroché du côté extérieur. Le talon reste au sol : tourne l'avant du pied vers l'intérieur contre l'élastique, puis reviens lentement.",
      cue: "Le talon reste posé, c'est l'avant du pied qui tourne vers l'intérieur.", err: "La jambe ne tourne pas : seul le pied bouge.",
      tip: "Plus dur : élastique plus tendu, ou retour en 3 secondes.", stop: "Arrêt si douleur vive à l'intérieur de la cheville." },
    { name: "Planche Copenhague genou sur chaise", group: "hanche", color: 3, kit: ["une chaise ou un banc"], repsLabel: "15 secondes par côté",
      desc: "Couché sur le côté, appui sur l'avant-bras, coude sous l'épaule. Pose l'intérieur du genou du dessus sur la chaise. Monte le bassin jusqu'à aligner épaule, hanche et genou, la jambe du dessous reste libre. Tiens, puis repose-toi.",
      cue: "Le corps reste aligné, c'est l'intérieur de la cuisse du dessus qui porte.", err: "Le bassin ne tombe pas et ne part pas en arrière.",
      tip: "Très efficace pour les adducteurs (sports de ballon). Plus dur : le pied sur la chaise au lieu du genou.", stop: "Arrêt si douleur à l'aine ou à l'intérieur du genou." },
    { name: "Extension en appui sur les mains", group: "dos", color: 1, kit: ["un tapis"], repsLabel: "10 répétitions",
      desc: "Allongé sur le ventre, mains à plat sous les épaules. Pousse sur les bras pour soulever le buste, en laissant le bassin et le bas du dos détendus au sol. Souffle en haut, puis redescends.",
      cue: "Les bras poussent, les fesses et le bas du dos restent relâchés.", err: "Le bassin ne décolle pas du sol.",
      tip: "Plus facile : sur les avant-bras (position du sphinx).", stop: "Arrêt si la douleur descend dans la jambe ou augmente au fil des répétitions." },
    { name: "Marche avec une charge d'un seul côté", group: "gainage", color: 2, kit: ["un sac ou un bidon lesté"], repsLabel: "30 secondes par main",
      desc: "Debout, une charge dans une seule main, bras le long du corps. Marche sur place ou dans la pièce, buste bien droit : il ne doit pas pencher du côté de la charge. Change de main.",
      cue: "Le buste reste vertical, les épaules à la même hauteur.", err: "Ne penche pas vers la charge et ne la décolle pas avec l'épaule.",
      tip: "Plus dur : charge plus lourde ou 45 secondes.", stop: "Arrêt si douleur au bas du dos." },
    { name: "Charnière de hanche, fesses au mur", group: "dos", color: 1, kit: ["un mur libre"], repsLabel: "10 répétitions",
      desc: "Debout dos au mur, à une vingtaine de centimètres, genoux légèrement fléchis, bras croisés. Pousse les fesses en arrière jusqu'à toucher le mur, en penchant le buste dos droit, puis redresse-toi en serrant les fessiers.",
      cue: "Les fesses partent en arrière, le dos reste droit.", err: "On ne plie pas les genoux pour descendre, on ne fait pas le dos rond.",
      tip: "Le geste de base pour ramasser un objet sans s'abîmer le dos. Plus dur : recule d'un petit pas.", stop: "Arrêt si douleur au bas du dos ou derrière les cuisses." }
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  var USE = {
    "Rentrer le menton": { s: "Les muscles profonds de l'avant du cou tiennent la tête au-dessus des épaules. Quand ils fatiguent, la tête part en avant et la nuque se tend.", e: ["Moins de tension dans la nuque devant un écran", "Conduire longtemps sans raideur", "Mieux se tenir assis"] },
    "Contraction du cou contre la main": { s: "Le cou travaille sans bouger : on renforce ses muscles en douceur, sans frotter sur les articulations, ce qui convient bien aux cous sensibles.", e: ["Tenir la tête sans fatigue en fin de journée", "Moins de raideur au réveil", "Porter un sac à dos sans tirer sur la nuque"] },
    "Serrage des omoplates": { s: "Les muscles entre les omoplates tirent les épaules en arrière. Ils équilibrent les heures passées penché en avant.", e: ["Se tenir droit au bureau", "Moins de tension entre les omoplates", "Porter un sac sans voûter le dos"] },
    "Pendulaire de Codman": { s: "Le poids du bras ouvre doucement l'articulation de l'épaule, sans effort des muscles. Ça relâche une épaule raide ou douloureuse.", e: ["Soulager une épaule bloquée le matin", "Préparer l'épaule avant de bouger", "Se détendre après un effort du bras"] },
    "Contraction de l'épaule contre le mur": { s: "Les muscles de l'épaule se contractent sans bouger l'articulation. On les réveille et on calme souvent la douleur, même quand bouger fait mal.", e: ["Retrouver de la force après une douleur d'épaule", "Porter un sac sans appréhension", "Préparer le retour aux mouvements du bras"] },
    "Pompe au mur avec poussée des omoplates": { s: "Le grand dentelé plaque l'omoplate contre les côtes. Bien réveillé, il aide l'épaule à monter sans se coincer.", e: ["Lever le bras au-dessus de la tête plus facilement", "Pousser une porte ou un chariot", "Se relever en poussant sur les bras"] },
    "Élévation des bras en diagonale": { s: "Les muscles qui lèvent le bras travaillent dans l'axe naturel de l'omoplate, la position la plus confortable pour l'épaule.", e: ["Attraper un objet devant soi en hauteur", "Étendre le linge", "Porter un plateau"] },
    "Livre ouvert couché sur le côté": { s: "Le haut du dos retrouve sa rotation. Quand il tourne bien, le cou, les épaules et le bas du dos n'ont plus à compenser.", e: ["Regarder derrière soi en voiture", "Attraper un objet sur le siège arrière", "Moins de raideur dans le haut du dos"] },
    "Excentrique du poignet avec une bouteille": { s: "Les muscles qui relèvent le poignet s'attachent au coude. Les faire travailler en freinant, lentement, aide le tendon à se renforcer (épicondylite, « tennis elbow »).", e: ["Porter une bouilloire ou une casserole", "Serrer une main ou tourner une poignée", "Taper au clavier sans douleur au coude"] },
    "Serrer une balle": { s: "La force de la main entretient tous les muscles de l'avant-bras. C'est aussi un bon reflet de la forme générale.", e: ["Ouvrir un bocal", "Porter des sacs de courses", "Tenir fermement un outil"] },
    "Rotation de l'avant-bras avec un marteau": { s: "Les muscles qui tournent l'avant-bras sont sollicités dans presque tous les gestes de la main. Le marteau fait levier et augmente l'effort en douceur.", e: ["Tourner une clé ou une poignée de porte", "Visser, dévisser", "Verser une carafe"] },
    "Spanish squat à l'élastique": { s: "L'élastique retient les genoux : la cuisse travaille fort pendant que le tendon sous la rotule est moins comprimé. Souvent bien toléré quand le genou est douloureux.", e: ["Descendre les escaliers sans douleur", "S'accroupir pour ramasser un objet", "Reprendre la course ou le sport"] },
    "Squat talons surélevés": { s: "Talons surélevés, le genou avance et le quadriceps travaille davantage. C'est une méthode classique pour renforcer le tendon rotulien.", e: ["Descendre une pente ou des escaliers", "Se relever d'une position accroupie", "Sauter et atterrir en sécurité"] },
    "Extension de genou tenue": { s: "Le quadriceps se contracte sans bouger : cet effort tenu calme souvent la douleur du genou et entretient la force.", e: ["Se lever d'une chaise sans les mains", "Monter les escaliers", "Rester debout longtemps"] },
    "Pied court": { s: "Les petits muscles sous le pied soutiennent la voûte plantaire, comme des haubans. Renforcés, ils stabilisent la cheville et soulagent le dessous du pied.", e: ["Marcher plus longtemps sans douleur sous le pied", "Mieux tenir sur un pied", "Courir avec un pied plus stable"] },
    "Serviette ramassée avec les orteils": { s: "Les muscles des orteils agrippent le sol à chaque pas. Les entretenir améliore l'appui et l'équilibre.", e: ["Garder l'équilibre sur un sol irrégulier", "Marcher pieds nus plus confortablement", "Mieux pousser à chaque pas"] },
    "Marche sur la pointe des pieds": { s: "Les mollets tiennent le poids du corps en continu, en endurance, pendant que la cheville apprend à rester droite.", e: ["Marcher longtemps sans fatigue des mollets", "Attraper un objet en hauteur", "Courir avec plus de ressort"] },
    "Inversion à l'élastique": { s: "Les muscles qui tournent le pied vers l'intérieur soutiennent la voûte plantaire et la cheville.", e: ["Marcher sur un chemin irrégulier", "Reprendre le sport après une entorse", "Moins de fatigue sous la voûte du pied"] },
    "Planche Copenhague genou sur chaise": { s: "Les adducteurs, à l'intérieur de la cuisse, sont souvent blessés dans les sports de ballon. Cette planche les renforce et réduit le risque de douleur à l'aine.", e: ["Faire un grand pas de côté", "Jouer au foot ou au tennis", "Monter à cheval ou à vélo"] },
    "Extension en appui sur les mains": { s: "On cambre doucement le bas du dos, à l'opposé des positions penchées de la journée. Chez beaucoup de personnes, ça soulage une douleur lombaire.", e: ["Se redresser après une longue position assise", "Soulager le dos après le jardinage", "Retrouver de l'aisance pour se pencher en arrière"] },
    "Marche avec une charge d'un seul côté": { s: "Les muscles du côté opposé à la charge empêchent le corps de pencher. C'est un gainage très proche de la vie réelle.", e: ["Porter un sac lourd d'une main", "Porter une valise ou un seau", "Porter un enfant sur une hanche"] },
    "Charnière de hanche, fesses au mur": { s: "On apprend à se pencher en pliant la hanche, dos droit : ce sont les fessiers et l'arrière des cuisses qui travaillent, pas le bas du dos.", e: ["Ramasser un objet au sol", "Sortir un plat du four", "Se pencher au-dessus d'un lavabo"] }
  };
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });

  /* ════════ SCHÉMAS ANIMÉS ════════
     Un petit dessin dans le coin de Yass, pour les mouvements trop fins pour l'avatar.
     map : pose de Yass -> phase du dessin ; pendant une étape « On tient », data-hold="1" (les flèches battent). */
  var SVG = {
    chin: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><path d='M50 118 L50 86 Q50 80 58 80 L70 80 Q76 80 76 86 L76 118' fill='var(--text2)' opacity='.55'/>" +
          "<line x1='84' y1='14' x2='84' y2='112' stroke='var(--border2)' stroke-width='2' stroke-dasharray='4 5'/>" +
          "<g class='ka-m ka-head'><circle cx='64' cy='50' r='28' fill='#B07A52'/><path d='M90 46 L98 54 L90 56' fill='#B07A52'/><circle cx='78' cy='42' r='3' fill='#1a1a1a'/><path d='M40 30 Q60 12 86 30 L84 36 Q62 24 42 40 Z' fill='#3a2a20'/></g>" +
          "<path class='ka-arrow' d='M112 64 L96 64 M102 58 L96 64 L102 70' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>",
    push: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><circle cx='52' cy='60' r='30' fill='#B07A52'/><path d='M30 42 Q50 22 76 40 L74 46 Q52 32 34 50 Z' fill='#3a2a20'/>" +
          "<rect x='84' y='34' width='18' height='52' rx='9' fill='#c88f66' stroke='var(--text2)' stroke-width='2'/>" +
          "<g class='ka-pulse'><path d='M74 60 L58 60 M64 54 L58 60 L64 66' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
          "<path d='M88 96 L104 96' stroke='var(--amber)' stroke-width='0' /></g><text x='60' y='112' text-anchor='middle' font-size='11' font-weight='700' fill='var(--text2)' class='ka-still'>immobile</text></svg>",
    wall: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><rect x='100' y='6' width='12' height='108' rx='3' fill='var(--border2)'/>" +
          "<circle cx='30' cy='28' r='11' fill='#B07A52'/><path d='M30 30 L30 74 L84 74' stroke='#B07A52' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/><circle cx='92' cy='74' r='9' fill='#c88f66'/>" +
          "<g class='ka-pulse'><path d='M60 54 L84 54 M78 48 L84 54 L78 60' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></g>" +
          "<text x='58' y='104' text-anchor='middle' font-size='11' font-weight='700' fill='var(--text2)' class='ka-still'>immobile</text></svg>",
    wristx: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><rect x='6' y='62' width='60' height='16' rx='8' fill='#B07A52'/><rect x='6' y='78' width='58' height='8' rx='3' fill='var(--border2)'/>" +
            "<g class='ka-m ka-r ka-wr'><rect x='62' y='58' width='34' height='22' rx='10' fill='#c88f66'/><rect x='92' y='50' width='12' height='38' rx='5' fill='#7fb6e6' stroke='var(--blue)' stroke-width='2'/></g>" +
            "<path d='M94 22 A40 40 0 0 1 94 112' stroke='var(--amber)' stroke-width='3' fill='none' stroke-dasharray='5 5'/></svg>",
    ball: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><path d='M30 98 L30 60 Q30 40 48 38 L80 38 Q96 40 96 58 L96 98 Z' fill='#c88f66' opacity='.55'/>" +
          "<g class='ka-m ka-ball'><circle cx='63' cy='68' r='24' fill='rgba(240,170,60,.45)' stroke='var(--amber)' stroke-width='3'/></g>" +
          "<path d='M30 60 Q24 72 34 84 M96 58 Q102 72 92 84' stroke='#B07A52' stroke-width='8' fill='none' stroke-linecap='round'/></svg>",
    prono: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><circle cx='60' cy='64' r='22' fill='#B07A52'/>" +
           "<g class='ka-m ka-r ka-pr'><rect x='56' y='14' width='8' height='54' rx='3' fill='#8a6a4a'/><rect x='44' y='10' width='32' height='14' rx='4' fill='var(--text2)'/></g>" +
           "<path d='M22 88 A44 44 0 0 0 98 88' stroke='var(--amber)' stroke-width='3' fill='none' stroke-dasharray='5 5'/>" +
           "<text x='60' y='114' text-anchor='middle' font-size='11' font-weight='700' fill='var(--text2)'>vue de face</text></svg>",
    quad: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><path d='M14 44 Q50 30 88 46 L86 66 Q50 72 14 64 Z' fill='rgba(255,255,255,.08)' stroke='var(--text2)' stroke-width='2'/>" +
          "<path class='ka-pulse' d='M20 46 Q50 34 82 48 L80 60 Q50 66 20 60 Z' fill='rgba(240,120,60,.55)'/>" +
          "<circle cx='96' cy='58' r='9' fill='var(--border2)' stroke='var(--text2)' stroke-width='2'/><path d='M100 66 L110 104' stroke='var(--text2)' stroke-width='10' stroke-linecap='round'/>" +
          "<text x='50' y='96' text-anchor='middle' font-size='11' font-weight='700' fill='var(--text2)' class='ka-still'>on serre</text></svg>",
    arch: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><rect x='22' y='16' width='16' height='52' rx='8' fill='var(--text2)'/>" +
          "<path class='ka-lo' d='M14 92 Q14 70 34 70 Q60 84 104 86 Q112 88 112 94 L14 94 Z' fill='#d9a77f'/>" +
          "<path class='ka-hi' d='M14 92 Q14 70 34 70 Q62 70 104 86 Q112 88 112 94 L100 94 Q62 74 30 94 L14 94 Z' fill='#d9a77f'/>" +
          "<line x1='8' y1='95' x2='116' y2='95' stroke='var(--border2)' stroke-width='3'/>" +
          "<path class='ka-arrow' d='M62 112 L62 96 M56 102 L62 96 L68 102' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>",
    toes: "<svg viewBox='0 0 120 120' width='84' height='84' aria-hidden='true'><path d='M6 62 Q6 40 30 40 L76 48 Q82 50 82 58 L82 70 L6 70 Z' fill='#d9a77f'/>" +
          "<g class='ka-m ka-r ka-toe'><rect x='76' y='52' width='32' height='18' rx='8' fill='#d9a77f'/></g>" +
          "<path class='ka-lo' d='M4 74 L116 74' stroke='#7fb6e6' stroke-width='6' stroke-linecap='round'/>" +
          "<path class='ka-hi' d='M4 74 L60 74 Q70 74 74 84 Q80 96 88 84 Q94 74 104 74 L116 74' stroke='#7fb6e6' stroke-width='6' fill='none' stroke-linecap='round'/></svg>",
    scapula: "<svg viewBox='0 0 140 120' width='96' height='82' aria-hidden='true'><rect x='67' y='8' width='6' height='104' rx='3' fill='var(--text2)'/>" +
             "<g class='kr-scap-l'><path d='M28 22 L58 26 L50 88 Z' fill='rgba(61,142,240,.35)' stroke='var(--blue)' stroke-width='3' stroke-linejoin='round'/></g>" +
             "<g class='kr-scap-r'><path d='M112 22 L82 26 L90 88 Z' fill='rgba(61,142,240,.35)' stroke='var(--blue)' stroke-width='3' stroke-linejoin='round'/></g>" +
             "<path class='kr-arrow' d='M16 58 L36 58 M30 52 L36 58 L30 64 M124 58 L104 58 M110 52 L104 58 L110 64' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round'/>" +
             "<path class='ka-outw' d='M36 58 L14 58 M20 52 L14 58 L20 64 M104 58 L126 58 M120 52 L126 58 L120 64' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"
  };
  var AIDS = {
    "Rentrer le menton": { k: "chin", t: "Le menton recule, le regard reste droit", map: { tuck: "in", rest: "out" } },
    "Contraction du cou contre la main": { k: "push", t: "La tête pousse, rien ne bouge", map: { front: "push", right: "push", left: "push", rest: "rest" } },
    "Contraction de l'épaule contre le mur": { k: "wall", t: "On pousse, le bras ne bouge pas", map: { push: "push", rest: "rest" } },
    "Excentrique du poignet avec une bouteille": { k: "wristx", t: "Montée aidée, descente lente", map: { up: "up", top: "up", down: "down" } },
    "Serrer une balle": { k: "ball", t: "On serre fort 3 secondes", map: { grip: "grip", open: "open" } },
    "Rotation de l'avant-bras avec un marteau": { k: "prono", t: "Le coude ne bouge pas, l'avant-bras tourne", map: { pro: "pro", sup: "sup", mid: "mid" } },
    "Extension de genou tenue": { k: "quad", t: "La cuisse reste contractée", map: { hold: "push", rest: "rest" } },
    "Pied court": { k: "arch", t: "La voûte monte, les orteils restent à plat", map: { arch: "up", flat: "flat" } },
    "Serviette ramassée avec les orteils": { k: "toes", t: "Les orteils agrippent la serviette", map: { curl: "curl", open: "open" } },
    "Serrage des omoplates": { k: "scapula", t: "Omoplates vers la colonne", map: { in: "in", out: "out" } },
    "Pompe au mur avec poussée des omoplates": { k: "scapula", t: "En haut, les omoplates s'écartent", map: { plus: "out", up: "mid", down: "in" } }
  };
  KineAvatar.aids = AIDS; KineAvatar.aidSvg = SVG;
  var curAid = null;
  function mountAid(c, name) {
    var old = c && c.querySelector(".kf-aid"); if (old) old.remove();
    var a = AIDS[name]; curAid = null;
    if (!a || !c) return;
    if (getComputedStyle(c).position === "static") c.style.position = "relative";
    var el = document.createElement("div");
    el.className = "kr-aid kf-aid kf-aid-" + (a.pos || "bl"); el.setAttribute("data-aid", a.k);
    el.innerHTML = SVG[a.k] + "<div class='kr-aid-t'>" + a.t + "</div>";
    var st = KineAvatar.startOf(name); el.setAttribute("data-phase", (a.map && a.map[st]) || st || "");
    c.appendChild(el); curAid = { el: el, a: a };
  }
  var _show = KineAvatar.show, _step = KineAvatar.step, _hide = KineAvatar.hide;
  KineAvatar.show = function (c, name) {
    var ok = _show.apply(KineAvatar, arguments);
    try { if (ok) mountAid(c, name); else if (c) { var o = c.querySelector(".kf-aid"); if (o) o.remove(); curAid = null; } } catch (e) {}
    return ok;
  };
  KineAvatar.step = function (s) {
    _step.apply(KineAvatar, arguments);
    if (curAid && s && s.pose && curAid.el.isConnected) {
      curAid.el.setAttribute("data-phase", (curAid.a.map && curAid.a.map[s.pose]) || s.pose);
      curAid.el.setAttribute("data-hold", s.kind === "hold" ? "1" : "0");
      curAid.el.style.setProperty("--ad", Math.max(0.3, s.dur || 1) + "s");
    }
  };
  KineAvatar.hide = function () { if (curAid && curAid.el) curAid.el.remove(); curAid = null; return _hide.apply(KineAvatar, arguments); };
})();
