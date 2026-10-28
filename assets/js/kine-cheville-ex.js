/* ═══════════ KinéForce — exercices de la cheville et du pied, du plus simple au plus dur (et quelques loufoques) ═══════════
   Niveau 1 : remettre en mouvement (après une entorse, une fracture, une botte) ; niveau 2 : renforcer le mollet,
   les muscles qui stabilisent la cheville et l'équilibre ; niveau 3 : sauter et réagir ; puis des variantes ludiques.
   Même principe que kine-genou-ex.js : poses de Yass, fiche de la bibliothèque, et phrase « à quoi ça sert ». */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT, lifted = lib.lifted, WALL_HANDS = lib.WALL_HANDS;
  var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var SEAT_HANDS = { LA: { hand: { at: [0.25, 0.5, -0.34], pole: [1, 0.2, 0] } }, RA: { hand: { at: [-0.25, 0.5, -0.34], pole: [-1, 0.2, 0] } } };
  var THIGHS = { LA: { hand: { at: [0.2, 0.6, -0.02], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.2, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } };
  var ARMS_OUT = { LA: { ang: [10, 35, 0, 15] }, RA: { ang: [10, 35, 0, 15] } };
  var A_RUN = { LA: { ang: [10, 10, 0, 70] }, RA: { ang: [10, 10, 0, 70] } };
  var SEAT_CAM = { yaw: 1.2, dist: 3.4, ty: 0.45, pitch: 0.25 };
  // Sur un pied : le pied droit porte, la jambe gauche est levée (côté « gauche » = jambe levée, labelSwap)
  var ONE_UP = function (pel, free) { return merge({ pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0, R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } }, L: free || { ang: [35, 3, 0, 70, 0] } }, pel || {}); };

  /* ════════ NIVEAU 1 : remettre en mouvement ════════ */
  var ALPHA = function (rot, ank) { return merge(SEAT, SEAT_HANDS, { L: { ang: [57, 4, rot, 0, ank] } }); };
  reg("Alphabet avec le pied", {
    sides: "blocks", sideWord: "pied", labelSwap: false, noIso: true, timed: { seconds: 60 }, props: ["chair"], camera: SEAT_CAM, start: "a", thumb: "b",
    poses: { a: ALPHA(-14, -30), b: ALPHA(14, 5), c: ALPHA(0, 22), d: ALPHA(-6, -38) },
    steps: [step("b", 0.9, "Le gros orteil écrit les lettres", "Le gros orteil écrit l'alphabet dans l'air", "up"), step("c", 0.9, "Le gros orteil écrit les lettres", null, "up"), step("d", 0.9, "Le gros orteil écrit les lettres", null, "down"), step("a", 0.9, "Le gros orteil écrit les lettres", null, "down")]
  });
  var PUSH = function (lift) { return merge(SEAT, THIGHS, { L: { foot: { at: [0.245, 0, 0.16], yaw: 0, lift: lift } } }); };
  reg("Pousser le bord du pied contre le mur", {
    sides: "blocks", sideWord: "pied", noIso: true, props: ["chair", "wallSide"], wallSideX: 0.33, camera: { yaw: -0.6, dist: 3.4, ty: 0.45, pitch: 0.25 }, start: "rest", thumb: "push",
    poses: { rest: PUSH(0), push: PUSH(2) },
    steps: [step("push", 1, "Le bord du pied pousse le mur", "Le bord extérieur du pied pousse contre le mur, sans bouger", "up"), step("push", 5, "On tient 5 secondes", "On pousse", "hold"), step("rest", 1.5, "On relâche", "On relâche", "down")]
  });
  reg("Talons levés assis", {
    props: ["chair"], camera: SEAT_CAM, start: "down", thumb: "up",
    poses: { down: merge(SEAT, THIGHS), up: merge(lifted(SEAT, 42), THIGHS) },
    steps: [step("up", 1.5, "Les talons montent", "On monte les talons, pointes au sol", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 2, "Descente lente", "On redescend lentement", "down")]
  });
  var SHIFT = function (sg) { return merge(STAND(0.15, 6), { pelvis: { p: [0.12 * sg, "auto", 0], r: [0, 0, -5 * sg] }, spine: [2, 0, 5 * sg], LA: { ang: [6, 12, 0, 12] }, RA: { ang: [6, 12, 0, 12] } }); };
  reg("Bascule d'un pied à l'autre", {
    noIso: true, timed: { seconds: 45 }, camera: { yaw: 0.2, dist: 4.0 }, start: "mid", thumb: "l",
    poses: { mid: SHIFT(0), l: SHIFT(1), r: SHIFT(-1) },
    steps: [step("l", 1.2, "Le poids passe sur un pied", "Le poids passe doucement sur un pied", "up"), step("l", 1, "On tient", null, "hold"), step("r", 1.6, "Puis sur l'autre", null, "down"), step("r", 1, "On tient", null, "hold")]
  });
  var BALL = function (z) { return merge(SEAT, THIGHS, { L: { foot: { at: [0.14, 0.064, z], yaw: 0 } } }); };
  reg("Rouler une balle sous le pied", {
    sides: "blocks", sideWord: "pied", labelSwap: false, noIso: true, timed: { seconds: 60 }, props: ["chair", "tball"], tball: { x: 0.14, z: 0.15 }, camera: SEAT_CAM, start: "heel", thumb: "mid",
    poses: { heel: BALL(0.3), mid: BALL(0.21), toes: BALL(0.11) },
    steps: [step("mid", 1.2, "La balle roule sous la voûte", "La balle roule sous la voûte du pied, en appuyant un peu", "up"), step("toes", 1.2, "Jusque sous les orteils", null, "up"), step("mid", 1.2, "La balle roule sous la voûte", null, "down"), step("heel", 1.2, "Jusqu'au talon", null, "down")]
  });
  // Assis, la cheville posée sur l'autre genou, la main tire les orteils vers soi
  var CROSS = function (pull) {
    return merge(SEAT, { spine: [14, 0, 0], head: -18,
      L: { foot: { at: [-0.08, 0.6, 0.04], yaw: -78, lift: pull ? -30 : 0, pole: [1, 0.4, 0.4] } },
      LA: { hand: { at: [-0.27, 0.66, 0.06 + (pull ? 0.03 : 0)], pole: [0.6, -1, 0.2] } }, RA: { hand: { at: [-0.02, 0.62, 0.0], pole: [-0.6, -1, 0] } } });
  };
  reg("Étirement de la voûte plantaire", {
    sides: "blocks", sideWord: "pied", labelSwap: false, noIso: true, timed: { seconds: 30 }, props: ["chair"], camera: { yaw: 0.55, dist: 3.4, ty: 0.55, pitch: 0.2 }, start: "rest", thumb: "pull",
    poses: { rest: CROSS(false), pull: CROSS(true) },
    steps: [step("pull", 2, "La main tire les orteils vers toi", "La main tire les orteils vers toi : ça tire sous le pied", "up"), step("pull", 10, "On tient 10 secondes", "On tient", "hold"), step("rest", 2, "On relâche", "On relâche", "down")]
  });
  // Étirements du mollet face au mur : jambe arrière tendue (gastrocnémien) ou genou arrière plié (soléaire)
  var CALF = function (pelZ, pelY, back, lean) {
    return merge(WALL_HANDS, { pelvis: { p: [0, pelY, pelZ], r: [lean, 0, 0] }, spine: [4, 0, 0], head: 0,
      L: { foot: { at: [0.1, 0, 0.3], yaw: 0 } }, R: { foot: { at: [-0.1, 0, back], yaw: 0 } } });
  };
  reg("Étirement du mollet contre le mur", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, timed: { seconds: 30 }, props: ["wall"], camera: { yaw: 1.35, dist: 4.2 }, start: "rest", thumb: "hold",
    poses: { rest: CALF(-0.02, 0.9, -0.36, 4), hold: CALF(0.06, 0.88, -0.36, 10) }
  });
  reg("Étirement du soléaire, genou plié", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, timed: { seconds: 30 }, props: ["wall"], camera: { yaw: 1.35, dist: 4.2 }, start: "rest", thumb: "hold",
    poses: { rest: CALF(-0.0, 0.84, -0.2, 4), hold: CALF(0.02, 0.76, -0.2, 6) }
  });
  var talons = KineAvatar._def("Élévation des talons");
  if (talons) {
    reg("Pointes de pieds tenues", { noIso: true, timed: { byWeek: [30, 45, 45, 45] }, props: ["wall"], camera: { yaw: 1.3 }, start: "up", thumb: "up",
      holdSay: { L: "On reste sur la pointe des pieds, sans bouger", R: "On reste sur la pointe des pieds" }, poses: { up: copy(talons.poses.up) } });
  }

  /* ════════ NIVEAU 2 : renforcer ════════ */
  var STEP_FEET = function (lift) { return { L: { foot: { at: [0.1, 0.18, 0.34], yaw: 0, lift: lift } }, R: { foot: { at: [-0.1, 0.18, 0.34], yaw: 0, lift: lift } } }; };
  var STEP_HANDS = { LA: { hand: { at: [0.2, 1.42, 0.55], pole: [0.5, -1, -0.3] } }, RA: { hand: { at: [-0.2, 1.42, 0.55], pole: [-0.5, -1, -0.3] } } };
  var ON_STEP = merge(STAND(0.1, 0), { pelvis: { p: [0, "auto", 0.24], r: [0, 0, 0] } }, STEP_HANDS);
  reg("Élévation des talons sur une marche", {
    camera: { yaw: 1.5, dist: 4.5, ty: 0.98 }, props: ["step", "wall"], start: "low", thumb: "top",
    poses: { low: merge(ON_STEP, STEP_FEET(-22)), top: merge(ON_STEP, STEP_FEET(35)) },
    steps: [step("top", 2, "On monte le plus haut possible", "On monte le plus haut possible", "up"), step("top", 1, "On tient", "On tient", "hold"), step("low", 3, "Les talons descendent sous la marche", "On descend lentement, talons sous la marche", "down")]
  });
  var SOLB = merge(STAND(0.09, 0), { pelvis: { p: [0, 0.8, -0.06], r: [6, 0, 0] }, spine: [4, 0, 0] }, WALL_HANDS, { L: { ang: [10, 3, 0, 75, 0] } });
  reg("Élévation du talon sur une jambe, genou plié", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 1.3 }, props: ["wall"], start: "down", thumb: "up",
    poses: { down: SOLB, up: merge(lifted(SOLB, 38), { pelvis: { p: [0, 0.87, -0.04], r: [6, 0, 0] } }) },
    steps: [step("up", 2, "On monte, genou plié", "On monte sur la pointe, le genou reste plié", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 3, "Descente lente", "On descend lentement", "down")]
  });
  var ONE_STEP = function (lift) { return merge(ON_STEP, { R: { foot: { at: [-0.1, 0.18, 0.34], yaw: 0, lift: lift } }, L: { ang: [10, 3, 0, 70, 0] } }); };
  reg("Montée sur pointe, serviette sous les orteils", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 1.45, dist: 4.4, ty: 0.95 }, props: ["step", "wall", "towelRoll"], towelRoll: { x: -0.1, y: 0.204, z: 0.47 },
    start: "low", thumb: "top",
    poses: { low: ONE_STEP(-18), top: ONE_STEP(36) },
    steps: [step("top", 3, "On monte en 3 secondes", "On monte en trois secondes, orteils relevés sur la serviette", "up"), step("top", 2, "On tient 2 secondes", "On tient", "hold"), step("low", 3, "On descend en 3 secondes", "On descend en trois secondes", "down")]
  });
  reg("Équilibre sur un pied, bras qui bougent", {
    sides: "blocks", sideWord: "pied", noIso: true, timed: { seconds: 30 }, camera: { yaw: 1.0 }, start: "a", thumb: "a",
    poses: { a: ONE_UP({ LA: { ang: [150, 10, 0, 10] }, RA: { ang: [10, 60, 0, 10] } }), b: ONE_UP({ LA: { ang: [10, 60, 0, 10] }, RA: { ang: [150, 10, 0, 10] } }),
             c: ONE_UP({ LA: { ang: [90, 0, 0, 0] }, RA: { ang: [90, 0, 0, 0] } }) },
    steps: [step("a", 1, "Les bras bougent, le pied ne bouge pas", "Les bras bougent, le pied reste immobile", "up"), step("b", 1, "Les bras bougent", null, "down"), step("c", 1, "Les bras bougent", null, "up"), step("a", 1, "Les bras bougent", null, "down")]
  });
  var ta = KineAvatar._def("Élévation des talons unipodale");
  if (ta) {
    var pt = copy(ta); pt.noIso = true; pt.timed = { byWeek: [20, 30, 40, 45] }; pt.start = "up"; pt.thumb = "up"; pt.poses = { up: copy(ta.poses.up) }; delete pt.steps;
    pt.holdSay = { L: "On reste sur la pointe d'un pied, bien haut", R: "On reste sur la pointe d'un pied" };
    reg("Pointe d'un pied tenue", pt);
  }

  /* ════════ NIVEAU 3 : sauter et réagir ════════ */
  var HOPZ = function (z, y) { return merge(STAND(0.08, 0), { pelvis: { p: [0, "auto", z - 0.12], r: [6, 0, 0] }, spine: [4, 0, 0], L: { foot: { at: [0.08, y, z], yaw: 0, lift: y ? 30 : 12 } }, R: { foot: { at: [-0.08, y, z], yaw: 0, lift: y ? 30 : 12 } }, LA: { ang: [25, 12, 0, 70] }, RA: { ang: [25, 12, 0, 70] } }); };
  reg("Sauts avant-arrière par-dessus une ligne", {
    noIso: true, timed: { seconds: 20 }, camera: { yaw: 1.25, dist: 4.2 }, props: ["floorTowel"], floorTowel: { x: 0, z: 0.16, w: 0.8, l: 0.03 }, start: "b", thumb: "air",
    poses: { b: HOPZ(0.02, 0), air: HOPZ(0.16, 0.07), f: HOPZ(0.32, 0) },
    steps: [step("air", 0.22, "Saut par-dessus la ligne", null, "up"), step("f", 0.3, "Réception sur l'avant des pieds", null, "down"), step("air", 0.22, "Saut en arrière", null, "up"), step("b", 0.3, "Réception sur l'avant des pieds", null, "down")]
  });
  // Sur la jambe gauche, de case en case autour de la croix (centre en z = 0.16)
  var SQ = function (x, z, y) { return merge(A_RUN, { pelvis: { p: [x - 0.08, "auto", z - 0.12], r: [8, 0, 0] }, spine: [8, 0, 0], head: 0, L: { foot: { at: [x, y, z], yaw: 0, lift: y ? 30 : 14 } }, R: { ang: [30, 3, 0, 90, 0] } }); };
  reg("Sauts en croix sur une jambe", {
    sides: "blocks", sideWord: "jambe", noIso: true, timed: { seconds: 20 }, camera: { yaw: 0.75, dist: 4.4, pitch: 0.35, ty: 0.7 }, props: ["floorCross"], floorCross: { x: 0.05, z: 0.16 },
    start: "q1", thumb: "a12",
    poses: { q1: SQ(0.18, 0.3, 0), a12: SQ(0.05, 0.3, 0.07), q2: SQ(-0.08, 0.3, 0), a23: SQ(-0.08, 0.16, 0.07), q3: SQ(-0.08, 0.02, 0), a34: SQ(0.05, 0.02, 0.07), q4: SQ(0.18, 0.02, 0), a41: SQ(0.18, 0.16, 0.07) },
    steps: [step("a12", 0.2, "Saut sur le côté", null, "up"), step("q2", 0.3, "Case suivante", null, "down"), step("a23", 0.2, "Saut en arrière", null, "up"), step("q3", 0.3, "Case suivante", null, "down"),
            step("a34", 0.2, "Saut sur le côté", null, "up"), step("q4", 0.3, "Case suivante", null, "down"), step("a41", 0.2, "Saut en avant", null, "up"), step("q1", 0.3, "Case suivante", null, "down")]
  });
  reg("Réception sur une jambe depuis la marche", {
    sides: "blocks", sideWord: "jambe", noIso: true, camera: { yaw: 1.25, dist: 4.4, ty: 0.7, tz: 0.15 }, props: ["step"], stepAt: { x: 0, z: -0.25 }, start: "top", thumb: "land",
    poses: { top: merge(STAND(0.11, 6), { pelvis: { p: [0, "auto", -0.25], r: [0, 0, 0] }, L: { foot: { at: [0.11, 0.18, -0.15], yaw: 6 } }, R: { foot: { at: [-0.11, 0.18, -0.15], yaw: -6 } } }),
             air: merge(STAND(0.11, 6), { pelvis: { p: [0, "auto", 0.1], r: [0, 0, 0] }, L: { foot: { at: [0.11, 0.14, 0.24], yaw: 6, lift: 30 } }, R: { foot: { at: [-0.11, 0.18, 0.2], yaw: -6, lift: 30 } }, LA: { ang: [40, 12, 0, 30] }, RA: { ang: [40, 12, 0, 30] } }),
             land: merge(A_RUN, { pelvis: { p: [0.04, 0.8, 0.34], r: [16, 0, 0] }, spine: [14, 0, 0], head: -8, L: { foot: { at: [0.1, 0, 0.46], yaw: 4 } }, R: { ang: [30, 3, 0, 85, 0] }, LA: { ang: [50, 25, 0, 20] }, RA: { ang: [50, 25, 0, 20] } }) },
    steps: [step("air", 0.35, "On saute de la marche", "On saute", "up"), step("land", 0.35, "Réception sur une jambe", "Réception sur une jambe, genou souple", "down"), step("land", 3, "On tient 3 secondes", "On tient, sans bouger", "hold"), step("top", 1.5, "On remonte sur la marche", null, "up")]
  });
  var ROPE = function (y, a) { return merge(STAND(0.08, 0), { pelvis: { p: [0, "auto", 0], r: [2, 0, 0] }, spine: [2, 0, 0], L: { foot: { at: [0.08, y, 0.12], yaw: 0, lift: 34 } }, R: { foot: { at: [-0.08, y, 0.12], yaw: 0, lift: 34 } }, LA: { ang: [a, 30, 0, 50] }, RA: { ang: [a, 30, 0, 50] } }); };
  reg("Corde à sauter imaginaire", {
    noIso: true, timed: { byWeek: [30, 45, 60, 60] }, camera: { yaw: 0.9, dist: 4.0 }, start: "g", thumb: "air",
    poses: { g: ROPE(0, 20), air: ROPE(0.06, 38) },
    steps: [step("air", 0.22, "Petits sauts, les poignets tournent", null, "up"), step("g", 0.22, "Petits sauts, les poignets tournent", null, "down")]
  });

  /* ════════ LES LOUFOQUES (mais utiles) ════════ */
  var WINGS = { LA: { ang: [8, 82, 0, 8] }, RA: { ang: [8, 82, 0, 8] } };
  var FLAMINGO = { L: { foot: { at: [-0.04, 0.5, 0.1], yaw: 75, lift: 35, pole: [1, 0.2, 0.6] } } };
  reg("Le flamant rose", {
    sides: "blocks", sideWord: "pied", noIso: true, timed: { seconds: 40 }, camera: { yaw: 0.7 }, start: "flat", thumb: "flat",
    poses: { flat: ONE_UP(WINGS, FLAMINGO.L), toes: merge(ONE_UP(WINGS, FLAMINGO.L), { R: { foot: { at: [-0.1, 0, 0.12], yaw: 0, lift: 30 } }, pelvis: { p: [0, "auto", 0], r: [0, 0, 0], dy: 0.06 } }) },
    steps: [step("flat", 2, "Sur un pied, les ailes ouvertes", "Sur un pied, le pied contre le genou, les ailes ouvertes", "hold"), step("toes", 1.5, "On monte sur la pointe", "Et on monte sur la pointe", "up"), step("toes", 2, "On tient", null, "hold"), step("flat", 1.5, "On redescend", null, "down")]
  });
  var PENG = function (sg) {
    return merge({ pelvis: { p: [0, "auto", 0], r: [-2, 0, 0] }, spine: [0, 0, 3 * sg], head: 0, LA: { ang: [0, 24, 0, 0] }, RA: { ang: [0, 24, 0, 0] } },
      { L: { foot: { at: [0.1, 0, 0.12 + 0.08 * sg], yaw: 8, lift: -28 } }, R: { foot: { at: [-0.1, 0, 0.12 - 0.08 * sg], yaw: -8, lift: -28 } } });
  };
  reg("Le pingouin", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 0.55, dist: 4.0 }, start: "a", thumb: "a",
    poses: { a: PENG(1), b: PENG(-1) },
    steps: [step("a", 0.5, "On marche sur les talons, bras en ailerons", "On marche sur les talons, pointes en l'air", "up"), step("b", 0.5, "On marche sur les talons", null, "down")]
  });
  var LIBERTY = function (toes) {
    var o = ONE_UP({ LA: { ang: [172, 6, 0, 4] }, RA: { hand: { at: [0.02, 1.22, 0.24], pole: [-1, -1, 0] } } }, { ang: [12, 3, 0, 60, 0] });
    if (toes) { o.R = { foot: { at: [-0.1, 0, 0.12], yaw: 0, lift: 30 } }; o.pelvis = { p: [0, "auto", 0], r: [0, 0, 0], dy: 0.06 }; }
    return o;
  };
  reg("La statue de la liberté", {
    sides: "blocks", sideWord: "pied", noIso: true, load: "L", timed: { seconds: 40 }, camera: { yaw: 0.6, dist: 4.3, ty: 1.0 }, start: "flat", thumb: "flat",
    poses: { flat: LIBERTY(false), toes: LIBERTY(true) },
    steps: [step("flat", 3, "La torche bien haute, on ne bouge plus", "Sur un pied, la bouteille levée comme une torche", "hold"), step("toes", 1.5, "On monte sur la pointe", "Et on monte sur la pointe", "up"), step("toes", 2, "On tient", null, "hold"), step("flat", 1.5, "On redescend", null, "down")]
  });
  var NINJA = function (sg) {
    return merge({ pelvis: { p: [0, 0.8, 0], r: [12, 0, 0] }, spine: [12, 0, 0], head: -6, LA: { ang: [70, 10, 0, 100] }, RA: { ang: [40, 10, 0, 110] } },
      { L: { foot: { at: [0.11, sg > 0 ? 0 : 0.04, 0.12 + 0.2 * sg], yaw: 6, lift: 38 } }, R: { foot: { at: [-0.11, sg > 0 ? 0.04 : 0, 0.12 - 0.2 * sg], yaw: -6, lift: 38 } } });
  };
  reg("Le ninja", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 1.1, dist: 4.2, ty: 0.7 }, start: "a", thumb: "a",
    poses: { a: NINJA(1), b: NINJA(-1) },
    steps: [step("a", 1.1, "Pas lents sur la pointe, genoux pliés", "Pas lents et silencieux, sur la pointe des pieds", "up"), step("b", 1.1, "Sans un bruit", null, "down")]
  });
  var APPLE = function (sg) {
    return merge(lifted(STAND(0.09, 0), 38), { pelvis: { p: [0.03 * sg, "auto", 0], r: [0, 0, -4 * sg], dy: 0.06 }, spine: [0, 0, 10 * sg], head: 10,
      LA: sg > 0 ? { ang: [168, 22, 0, 4] } : { ang: [8, 12, 0, 14] }, RA: sg > 0 ? { ang: [8, 12, 0, 14] } : { ang: [168, 22, 0, 4] } });
  };
  reg("Le cueilleur de pommes", {
    noIso: true, timed: { seconds: 40 }, camera: { yaw: 0.35, dist: 4.4, ty: 1.0 }, start: "l", thumb: "l",
    poses: { l: APPLE(1), r: APPLE(-1) },
    steps: [step("l", 1.2, "Sur la pointe, on cueille en haut", "Sur la pointe des pieds, on cueille la pomme tout en haut", "up"), step("l", 0.6, "On attrape la pomme", null, "hold"), step("r", 1.2, "Et de l'autre côté", null, "up"), step("r", 0.6, "On attrape la pomme", null, "hold")]
  });

  /* ════════ FICHES (bibliothèque) ════════ */
  var E = function (name, group, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: group, color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop }; };
  var F = [
    E("Alphabet avec le pied", "mobilite", 1, ["une chaise"], "1 alphabet par pied",
      "Assis au bord d'une chaise, la jambe tendue devant toi, le talon posé au sol. Écris l'alphabet en majuscules dans l'air avec le gros orteil, en faisant de grandes lettres.",
      "Seule la cheville bouge, le genou reste immobile.", "On ne fait pas des lettres minuscules : la cheville doit aller loin dans tous les sens.",
      "Le premier exercice après une entorse ou une botte. Plus dur : en minuscules attachées, puis les yeux fermés.", "Arrêt si douleur vive."),
    E("Pousser le bord du pied contre le mur", "mollet", 1, ["une chaise", "un mur ou un meuble lourd"], "10 répétitions par pied",
      "Assis de côté contre un mur, le bord extérieur du pied collé au mur. Pousse le mur avec le bord du pied, sans que le pied bouge, pendant 5 secondes, puis relâche.",
      "On pousse progressivement, sans à-coup.", "Le genou ne part pas sur le côté : c'est la cheville qui pousse.",
      "Réveille les muscles qui empêchent la cheville de tourner, sans bouger l'articulation. Plus dur : debout, puis avec un élastique.", "Arrêt si douleur vive sur le côté de la cheville."),
    E("Talons levés assis", "mollet", 1, ["une chaise"], "15 répétitions",
      "Assis, les pieds à plat au sol. Monte les talons le plus haut possible en gardant les pointes au sol, tiens 1 seconde, puis redescends lentement.",
      "On monte haut et on redescend lentement.", "On ne pousse pas avec les mains sur les cuisses.",
      "Le mollet retravaille sans le poids du corps. Plus dur : un sac ou des livres posés sur les genoux.", "Arrêt si douleur au tendon d'Achille."),
    E("Bascule d'un pied à l'autre", "equilibre", 1, ["une chaise ou un mur à portée de main"], "45 secondes",
      "Debout, pieds écartés. Fais passer doucement le poids du corps sur un pied, tiens 1 seconde, puis sur l'autre. Les pieds restent au sol.",
      "Le bassin se déplace sur le côté, le buste reste droit.", "On ne se penche pas : c'est tout le corps qui glisse.",
      "Pour réapprendre à faire confiance à la cheville quand on remet le pied par terre. Plus dur : lever un peu l'autre pied.", "Arrêt si douleur vive en appui."),
    E("Rouler une balle sous le pied", "mobilite", 1, ["une balle de tennis ou une bouteille d'eau congelée", "une chaise"], "1 minute par pied",
      "Assis, une balle de tennis sous le pied. Fais-la rouler du talon jusqu'aux orteils en appuyant un peu, comme un massage. Une bouteille d'eau congelée marche aussi.",
      "Une pression agréable, sans faire mal.", "On n'écrase pas la balle de tout son poids.",
      "Détend la voûte plantaire, idéal le matin avant les premiers pas. Plus fort : debout, une main au mur.", "Arrêt si douleur vive ou fourmillements."),
    E("Étirement de la voûte plantaire", "mobilite", 1, ["une chaise"], "3 fois 10 secondes par pied",
      "Assis, la cheville posée sur l'autre genou. Avec la main, tire les orteils vers toi jusqu'à sentir un étirement sous le pied. Tiens 10 secondes.",
      "Ça tire sous le pied, sous le talon et la voûte.", "On ne tire pas d'un coup : on étire doucement.",
      "Le meilleur moment : le matin, avant de poser le pied par terre. Recommandé pour la douleur sous le talon.", "Arrêt si douleur vive."),
    E("Étirement du mollet contre le mur", "mobilite", 1, ["un mur"], "30 secondes par jambe, 3 fois",
      "Face au mur, les mains posées dessus, une jambe en avant pliée, l'autre loin derrière, genou tendu, talon au sol. Avance le bassin vers le mur jusqu'à sentir un étirement dans le mollet de la jambe arrière.",
      "Le talon arrière reste collé au sol, le pied arrière pointe droit vers le mur.", "On ne laisse pas le pied arrière partir vers l'extérieur.",
      "Plus fort : reculer un peu le pied arrière. Pour la douleur sous le talon et le tendon d'Achille raide.", "Après une rupture du tendon d'Achille : pas d'étirement sans l'accord du kiné."),
    E("Étirement du soléaire, genou plié", "mobilite", 1, ["un mur"], "30 secondes par jambe, 3 fois",
      "Même position face au mur, mais le pied arrière plus près et le genou arrière plié. Descends doucement le genou arrière en gardant le talon au sol : l'étirement se sent plus bas, près du talon.",
      "Le talon arrière reste au sol, le genou arrière plie.", "On ne décolle pas le talon.",
      "Complète l'étirement jambe tendue : il cible le muscle profond du mollet.", "Après une rupture du tendon d'Achille : pas d'étirement sans l'accord du kiné."),
    E("Pointes de pieds tenues", "mollet", 1, ["un mur"], "30 à 45 secondes, 5 fois",
      "Debout face à un mur, les mains posées dessus. Monte sur la pointe des pieds à mi-hauteur et reste immobile 30 à 45 secondes, puis repose doucement les talons.",
      "On reste à la même hauteur, sans trembler.", "On ne se penche pas vers le mur.",
      "Les exercices statiques soulagent souvent un tendon d'Achille douloureux. Plus dur : sur un seul pied.", "Douleur du tendon au-dessus de 5/10 : on baisse la durée."),
    E("Élévation des talons sur une marche", "mollet", 2, ["une marche", "un mur ou une rampe"], "12 répétitions",
      "Debout sur le bord d'une marche, l'avant des pieds posé, les talons dans le vide, une main au mur. Monte le plus haut possible, puis laisse descendre les talons sous le niveau de la marche, lentement.",
      "Amplitude complète : tout en haut, puis sous la marche.", "On ne rebondit pas en bas.",
      "Travaille le mollet sur toute son amplitude. Plus dur : sur un seul pied, ou avec un sac à dos chargé.", "Douleur à l'insertion du tendon sur le talon : on reste au niveau de la marche, sans descendre dans le vide."),
    E("Élévation du talon sur une jambe, genou plié", "mollet", 2, ["un mur"], "12 répétitions par jambe",
      "Debout sur une jambe face au mur, le genou d'appui un peu plié. Monte sur la pointe du pied en gardant le genou plié, puis redescends lentement.",
      "Le genou reste plié à la même hauteur pendant toute la montée.", "On ne tend pas le genou pour monter.",
      "Cible le soléaire, le muscle profond du mollet, très sollicité en course. Plus dur : un sac à dos chargé.", "Arrêt si douleur au tendon d'Achille au-dessus de 5/10."),
    E("Montée sur pointe, serviette sous les orteils", "mollet", 2, ["une marche", "une serviette roulée", "un mur"], "12 répétitions par jambe, un jour sur deux",
      "Sur une jambe, sur une marche, les orteils posés sur une serviette roulée pour les relever. Monte en 3 secondes, tiens 2 secondes, redescends en 3 secondes.",
      "Lent : 3 secondes en montée, 2 en haut, 3 en descente.", "On ne va pas vite.",
      "Le renforcement de référence pour la douleur sous le talon : les orteils relevés étirent le fascia pendant l'effort. Plus dur : un sac à dos chargé de livres.", "La douleur peut monter un peu pendant l'exercice : elle doit redescendre le lendemain."),
    E("Équilibre sur un pied, bras qui bougent", "equilibre", 2, [], "30 secondes par pied",
      "Debout sur un pied, l'autre genou levé. Bouge les bras dans tous les sens, en haut, sur le côté, devant, sans que le pied d'appui bouge.",
      "Le pied d'appui reste collé au sol.", "On ne bloque pas la respiration.",
      "Les mouvements des bras déséquilibrent : la cheville apprend à corriger, comme sur un terrain de sport. Plus dur : les yeux fermés, ou sur un coussin.", "Près d'un mur pour se rattraper."),
    E("Pointe d'un pied tenue", "mollet", 2, ["un mur"], "30 secondes par pied",
      "Debout sur un pied, une main au mur. Monte sur la pointe et reste tout en haut, sans redescendre, 30 secondes.",
      "On reste bien haut, cheville droite.", "La cheville ne part pas vers l'extérieur.",
      "Endurance du mollet et stabilité de la cheville en même temps. Plus dur : sans les mains.", "Arrêt si douleur au tendon d'Achille au-dessus de 5/10."),
    E("Sauts avant-arrière par-dessus une ligne", "mollet", 3, ["une ligne au sol (scotch, corde)"], "20 secondes",
      "Debout pieds joints derrière une ligne. Saute par-dessus vers l'avant, puis en arrière, sans t'arrêter, sur l'avant des pieds.",
      "Petits sauts rapides, réception silencieuse sur l'avant des pieds.", "On ne retombe pas sur les talons.",
      "Prépare la cheville au ressort de la course. Plus dur : sur un pied.", "Arrêt si douleur à la cheville ou au tendon d'Achille."),
    E("Sauts en croix sur une jambe", "mollet", 3, ["du scotch pour dessiner une croix au sol"], "20 secondes par jambe",
      "Dessine une croix au sol avec du scotch. Sur une jambe, saute de case en case autour de la croix : sur le côté, en arrière, sur le côté, en avant, et ainsi de suite.",
      "Réception souple sur l'avant du pied, genou dans l'axe.", "On ne marche pas sur le scotch.",
      "Appuis dans toutes les directions, comme en sport. Plus dur : changer de sens, ou plus vite.", "Arrêt si douleur ou si la cheville tourne."),
    E("Réception sur une jambe depuis la marche", "mollet", 3, ["une marche"], "6 répétitions par jambe",
      "Debout sur une marche. Saute en avant et réceptionne-toi sur une seule jambe, genou souple. Tiens 3 secondes sans bouger, puis remonte.",
      "On tient la réception sans sautiller.", "La cheville ne tourne pas, le genou ne rentre pas.",
      "Apprend à la cheville à encaisser un atterrissage sur un pied. Plus dur : réception sur un coussin.", "Arrêt si douleur ou instabilité."),
    E("Corde à sauter imaginaire", "mollet", 3, [], "30 à 60 secondes",
      "Saute sur place comme avec une corde à sauter, en faisant tourner les poignets. Petits sauts, sur l'avant des pieds, talons qui ne touchent pas le sol.",
      "Petits sauts réguliers, comme un ressort.", "On ne saute pas haut : quelques centimètres suffisent.",
      "Le mollet et le tendon d'Achille travaillent comme des ressorts. Plus dur : avec une vraie corde, puis sur un pied.", "Arrêt si douleur au tendon d'Achille ou sous le talon."),
    E("Le flamant rose", "equilibre", 2, [], "40 secondes par pied",
      "Sur un pied, l'autre pied posé contre le genou, les bras ouverts comme des ailes. Tiens, puis monte sur la pointe du pied d'appui et tiens encore.",
      "Le bassin reste droit, le regard fixe un point devant toi.", "La cheville ne part pas vers l'extérieur.",
      "Équilibre et force de la cheville, avec un peu d'élégance. Plus dur : les yeux fermés.", "Près d'un mur pour se rattraper."),
    E("Le pingouin", "mollet", 2, ["un couloir dégagé"], "30 secondes",
      "Marche sur les talons, les pointes de pieds bien relevées, les bras le long du corps, les mains écartées comme des ailerons de pingouin.",
      "Les pointes de pieds ne touchent jamais le sol.", "On ne se penche pas en arrière.",
      "Renforce l'avant de la jambe, qui relève le pied et évite de trébucher. Plus dur : en reculant.", "Arrêt si douleur à l'avant de la jambe."),
    E("La statue de la liberté", "equilibre", 2, ["une bouteille d'eau"], "40 secondes par pied",
      "Sur un pied, une bouteille tenue bien haut au-dessus de la tête comme une torche, l'autre main sur la poitrine. Tiens sans bouger, puis monte sur la pointe du pied.",
      "Le bras reste tendu, le corps immobile.", "On ne cambre pas le dos.",
      "Le poids en hauteur rend l'équilibre plus difficile : la cheville doit travailler davantage. Plus dur : les yeux fermés.", "Près d'un mur pour se rattraper."),
    E("Le ninja", "mollet", 2, ["un couloir dégagé"], "30 secondes",
      "Avance à pas lents et silencieux sur la pointe des pieds, genoux pliés, bras en garde, comme un ninja qui ne veut pas être entendu.",
      "Aucun bruit : on pose le pied tout doucement.", "Les talons ne touchent pas le sol.",
      "Mollets, cuisses et contrôle de la cheville, en s'amusant. Plus dur : genoux plus pliés, ou en reculant.", "Arrêt si douleur au tendon d'Achille."),
    E("Le cueilleur de pommes", "equilibre", 2, [], "40 secondes",
      "Sur la pointe des pieds, tends un bras le plus haut possible en diagonale, comme pour cueillir une pomme tout en haut de l'arbre, puis de l'autre côté. Les talons ne redescendent pas.",
      "On reste sur la pointe pendant tout l'exercice.", "On ne se cambre pas.",
      "Endurance du mollet et équilibre en mouvement. Plus dur : sur un seul pied.", "Arrêt si douleur au tendon d'Achille ou sous le talon.")
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  var U = function (s2, e) { return { s: s2, e: e }; };
  var USE = {
    "Alphabet avec le pied": U("La cheville bouge dans toutes les directions, sans porter de poids : elle dégonfle et retrouve sa souplesse.", ["Marcher sans boiter", "Monter et descendre les escaliers", "Conduire"]),
    "Pousser le bord du pied contre le mur": U("Les muscles fibulaires, sur le côté de la jambe, empêchent la cheville de tourner : ils se réveillent sans bouger l'articulation.", ["Marcher sur un terrain irrégulier", "Éviter une nouvelle entorse", "Reprendre le sport"]),
    "Talons levés assis": U("Le mollet recommence à pousser, sans le poids du corps.", ["Marcher en déroulant le pied", "Monter les escaliers", "Se mettre sur la pointe des pieds"]),
    "Bascule d'un pied à l'autre": U("La cheville réapprend à porter le poids du corps, progressivement et en sécurité.", ["Marcher sans appréhension", "Se tenir debout longtemps", "Porter des courses"]),
    "Rouler une balle sous le pied": U("La voûte plantaire se détend et devient moins sensible.", ["Faire ses premiers pas du matin", "Rester debout au travail", "Marcher longtemps"]),
    "Étirement de la voûte plantaire": U("Le fascia sous le pied s'assouplit : les premiers pas du matin deviennent moins douloureux.", ["Se lever le matin sans douleur", "Marcher pieds nus", "Reprendre la course"]),
    "Étirement du mollet contre le mur": U("Le mollet assoupli laisse la cheville plier davantage et tire moins sur le talon et le fascia.", ["Faire ses premiers pas du matin", "Monter une côte", "S'accroupir"]),
    "Étirement du soléaire, genou plié": U("Le muscle profond du mollet s'assouplit : la cheville plie mieux genou fléchi, comme dans les escaliers.", ["Descendre les escaliers", "S'accroupir", "Courir"]),
    "Pointes de pieds tenues": U("Le tendon d'Achille travaille sans bouger : souvent bien supporté, et il soulage la douleur.", ["Marcher plus longtemps", "Monter les escaliers", "Reprendre la course"]),
    "Élévation des talons sur une marche": U("Le mollet travaille sur toute son amplitude : force et souplesse en même temps.", ["Monter les escaliers", "Courir", "Sauter"]),
    "Élévation du talon sur une jambe, genou plié": U("Le soléaire, muscle profond du mollet, porte jusqu'à plusieurs fois le poids du corps à chaque foulée.", ["Courir longtemps", "Monter une côte", "Faire du vélo"]),
    "Montée sur pointe, serviette sous les orteils": U("Les orteils relevés tendent le fascia plantaire pendant l'effort : il se renforce au lieu d'être irrité.", ["Rester debout toute la journée", "Marcher longtemps", "Reprendre la course"]),
    "Équilibre sur un pied, bras qui bougent": U("La cheville corrige en permanence les déséquilibres créés par les bras, comme pendant le sport.", ["Ne pas se tordre la cheville", "Marcher dans la foule", "Jouer au ballon"]),
    "Pointe d'un pied tenue": U("Le mollet et les muscles autour de la cheville tiennent ensemble, sur un pied.", ["Courir", "Danser", "Se mettre sur la pointe pour attraper un objet"]),
    "Sauts avant-arrière par-dessus une ligne": U("La cheville apprend à rebondir vite, comme un ressort, la base de la course.", ["Courir", "Sauter", "Jouer au foot ou au basket"]),
    "Sauts en croix sur une jambe": U("Des appuis dans toutes les directions, sur un pied : ce que demandent les sports avec des changements de direction.", ["Changer de direction", "Jouer au tennis", "Reprendre le sport sans appréhension"]),
    "Réception sur une jambe depuis la marche": U("La cheville apprend à amortir un atterrissage sur un pied sans tourner.", ["Retomber d'un saut", "Descendre d'un trottoir sans regarder", "Reprendre le sport"]),
    "Corde à sauter imaginaire": U("Le mollet et le tendon d'Achille stockent et rendent l'énergie à chaque saut.", ["Courir avec du ressort", "Sauter", "Jouer avec des enfants"]),
    "Le flamant rose": U("Équilibre sur un pied et force de la cheville, d'abord pied à plat puis sur la pointe.", ["Enfiler un pantalon debout", "Marcher sur un terrain irrégulier", "Ne pas se tordre la cheville"]),
    "Le pingouin": U("Les muscles de l'avant de la jambe relèvent le pied : ils évitent de trébucher et protègent la cheville.", ["Ne pas trébucher", "Marcher en montée", "Courir"]),
    "La statue de la liberté": U("Le bras levé déplace le centre de gravité : la cheville doit travailler plus pour rester stable.", ["Ranger quelque chose en hauteur", "Garder l'équilibre", "Ne pas se tordre la cheville"]),
    "Le ninja": U("Marcher lentement sur la pointe, genoux pliés : le mollet travaille longtemps et la cheville contrôle chaque appui.", ["Marcher sur un terrain irrégulier", "Courir", "Monter les escaliers sans bruit"]),
    "Le cueilleur de pommes": U("Rester sur la pointe en bougeant les bras : endurance du mollet et équilibre en mouvement.", ["Attraper un objet en hauteur", "Danser", "Garder l'équilibre"])
  };
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });
  window.KineChevilleEx = { names: F.map(function (f) { return f.name; }) };
})();
