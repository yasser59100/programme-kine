/* ═══════════ KinéForce — exercices du genou, du plus simple au plus dur (et quelques loufoques) ═══════════
   Niveau 1 : récupérer (après une opération, genou douloureux) ; niveau 2 : renforcer ;
   niveau 3 : charger et sauter ; puis des variantes ludiques. Même principe que kine-nouveaux2.js :
   poses de Yass, fiche de la bibliothèque, et phrase « à quoi ça sert ». */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT;
  var SUPINE_FEET = lib.SUPINE_FEET, SUPINE_HANDS = lib.SUPINE_HANDS;
  var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var LIE = { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0 };
  var LEGS_STRAIGHT = { L: { ang: [0, 4, 0, 0, -10] }, R: { ang: [0, 4, 0, 0, -10] } };
  var R_BENT = { R: { foot: { at: [-0.13, 0, 0.74], yaw: 0, pole: [-0.15, 1, 0] } } };
  var SUP_CAM = { yaw: 1.3, pitch: 0.35, dist: 3.5, ty: 0.25, tz: 0.15 };
  var ARMS_FWD = { LA: { ang: [80, 6, 0, 0] }, RA: { ang: [80, 6, 0, 0] } };
  var A_RUN = { LA: { ang: [10, 10, 0, 70] }, RA: { ang: [10, 10, 0, 70] } };
  var HANDS_HIPS = { LA: { hand: { at: [0.2, 0.98, -0.02], pole: [1, -0.3, -0.6] } }, RA: { hand: { at: [-0.2, 0.98, -0.02], pole: [-1, -0.3, -0.6] } } };

  /* ════════ NIVEAU 1 : récupérer ════════ */
  reg("Pompe de cheville couché", {
    noIso: true, timed: { seconds: 45 }, camera: SUP_CAM, start: "up", thumb: "down",
    poses: { up: merge(LIE, SUPINE_HANDS, { L: { ang: [0, 4, 0, 0, 15] }, R: { ang: [0, 4, 0, 0, 15] } }),
             down: merge(LIE, SUPINE_HANDS, { L: { ang: [0, 4, 0, 0, -45] }, R: { ang: [0, 4, 0, 0, -45] } }) },
    steps: [step("up", 0.8, "Pointes vers toi", "Pointes de pieds vers toi", "up"), step("down", 0.8, "Pointes vers l'avant", null, "down")]
  });
  reg("Contraction du quadriceps couché", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: SUP_CAM, start: "rest", thumb: "hold",
    poses: { rest: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [3, 4, 0, 8, -10] } }),
             hold: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [2, 4, 0, 0, 12] } }) },
    steps: [step("hold", 1, "On écrase le genou vers le sol", "On écrase l'arrière du genou vers le sol", "up"), step("hold", 5, "On tient 5 secondes", "On serre la cuisse", "hold"), step("rest", 1.5, "On relâche", "On relâche", "down")]
  });
  reg("Glissement du talon couché", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: SUP_CAM, start: "flat", thumb: "bent",
    poses: { flat: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [0, 4, 0, 0, -10] } }),
             bent: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [48, 4, 0, 105, -10] } }) },
    steps: [step("bent", 3, "Le talon glisse vers la fesse", "Le talon glisse vers toi, sans forcer", "up"), step("bent", 2, "On tient", "On tient", "hold"), step("flat", 2.5, "Le talon repart", "On allonge la jambe", "down")]
  });
  reg("Extension passive talon sur un rouleau", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, timed: { byWeek: [60, 90, 120, 120] }, camera: SUP_CAM, props: ["roller"], roller: { p: [0.13, 0.075, 0.76], yaw: 0 },
    start: "hold", thumb: "hold",
    poses: { hold: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [7, 4, 0, 0, 0] } }) }
  });
  reg("Contraction des ischios talon au sol", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: SUP_CAM, start: "rest", thumb: "hold",
    poses: { rest: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [22, 4, 0, 40, -10] } }),
             hold: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [22, 4, 0, 41, -6] } }) },
    steps: [step("hold", 1, "Le talon tire vers les fesses", "Le talon tire vers les fesses, sans bouger", "up"), step("hold", 5, "On tient 5 secondes", "On tient", "hold"), step("rest", 1.5, "On relâche", "On relâche", "down")]
  });
  var THIGHS = { LA: { hand: { at: [0.2, 0.6, -0.02], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.2, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } };
  reg("Flexion assise, le pied recule", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camFlip: true, camera: { yaw: 1.35, dist: 3.6, ty: 0.55 }, props: ["chair"], start: "fwd", thumb: "back",
    poses: { fwd: merge(SEAT, THIGHS, { L: { foot: { at: [0.14, 0, 0.2], yaw: 6 } } }),
             back: merge(SEAT, THIGHS, { L: { foot: { at: [0.14, 0.02, -0.12], yaw: 6, lift: 45 } } }) },
    steps: [step("back", 3, "Le pied recule sous la chaise", "Le pied glisse en arrière, sous la chaise", "up"), step("back", 3, "On tient", "On tient", "hold"), step("fwd", 2, "On revient", "On revient", "down")]
  });
  var TABLE_SIT = { pelvis: { p: [0, 0.84, -0.14], r: [0, 0, 0] }, spine: [4, 0, 0], head: 0,
    LA: { hand: { at: [0.28, 0.77, -0.16], pole: [1, 0.2, 0] } }, RA: { hand: { at: [-0.28, 0.77, -0.16], pole: [-1, 0.2, 0] } } };
  reg("Genou qui se balance, assis sur une table", {
    noIso: true, timed: { seconds: 60 }, camera: { yaw: 1.4, dist: 3.8, ty: 0.65 }, props: ["table"], start: "back", thumb: "fwd",
    poses: { back: merge(TABLE_SIT, { L: { foot: { at: [0.13, 0.44, 0.1], yaw: 0, pole: [0.1, 0.2, 1] } }, R: { foot: { at: [-0.13, 0.56, 0.6], yaw: 0, pole: [-0.1, 0.2, 1] } } }),
             fwd: merge(TABLE_SIT, { L: { foot: { at: [0.13, 0.56, 0.6], yaw: 0, pole: [0.1, 0.2, 1] } }, R: { foot: { at: [-0.13, 0.44, 0.1], yaw: 0, pole: [-0.1, 0.2, 1] } } }) },
    steps: [step("fwd", 1, "Les jambes se balancent", null, "up"), step("back", 1, "Les jambes se balancent", null, "down")]
  });
  // Vélo : pédales sur un cercle de 17 cm autour de l'axe du pédalier (z 0.12, y 0.34)
  var PED = function (a) { var r = a * Math.PI / 180; return [0.34 + 0.17 * Math.cos(r), 0.12 + 0.17 * Math.sin(r)]; };
  var BIKE = function (aL) {
    var l = PED(aL), r = PED(aL + 180);
    return { pelvis: { p: [0, 0.97, -0.3], r: [24, 0, 0] }, spine: [14, 0, 0], head: -14,
      L: { foot: { at: [0.13, l[0], l[1] + 0.08], yaw: 0, lift: 6, pole: [0.1, 0.4, 1] } }, R: { foot: { at: [-0.13, r[0], r[1] + 0.08], yaw: 0, lift: 6, pole: [-0.1, 0.4, 1] } },
      LA: { hand: { at: [0.2, 1.04, 0.52], pole: [0.6, -0.6, -0.3] } }, RA: { hand: { at: [-0.2, 1.04, 0.52], pole: [-0.6, -0.6, -0.3] } } };
  };
  reg("Vélo d'appartement", {
    noIso: true, timed: { byWeek: [300, 480, 600, 900] }, camera: { yaw: 1.3, dist: 4.0, ty: 0.75 }, props: ["bike"], start: "p0", thumb: "p90",
    poses: { p0: BIKE(0), p90: BIKE(90), p180: BIKE(180), p270: BIKE(270) },
    steps: [step("p90", 0.3, "On pédale, sans forcer", null, "up"), step("p180", 0.3, "On pédale, sans forcer", null, "up"), step("p270", 0.3, "On pédale, sans forcer", null, "down"), step("p0", 0.3, "On pédale, sans forcer", null, "down")]
  });

  /* ════════ NIVEAU 2 : renforcer ════════ */
  reg("Arc court du quadriceps sur un rouleau", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: SUP_CAM, props: ["roller"], roller: { p: [0.13, 0.075, 0.44], yaw: 0 }, start: "bent", thumb: "straight",
    poses: { bent: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [12, 4, 0, 38, -10] } }),
             straight: merge(LIE, SUPINE_HANDS, R_BENT, { L: { ang: [12, 4, 0, 0, 10] } }) },
    steps: [step("straight", 1.5, "On tend le genou", "On tend le genou, la cuisse reste sur le rouleau", "up"), step("straight", 2, "On tient", "On tient", "hold"), step("bent", 2.5, "Descente lente", "On redescend lentement", "down")]
  });
  reg("Mini-squat", {
    camera: { yaw: 0.65 }, start: "up", thumb: "down",
    poses: { up: merge(STAND(0.12, 10), ARMS_FWD),
             down: merge(STAND(0.12, 10), ARMS_FWD, { pelvis: { p: [0, 0.83, -0.1], r: [10, 0, 0] }, spine: [8, 0, 0] }) },
    steps: [step("down", 2, "On descend un peu", "On plie un peu les genoux", "down"), step("up", 1.5, "On remonte", "On remonte", "up")]
  });
  reg("Marche arrière", {
    noIso: true, timed: { seconds: 45 }, camera: { yaw: 1.3, dist: 4.2 }, start: "a", thumb: "a",
    poses: { a: merge(A_RUN, { pelvis: { p: [0, "auto", 0], r: [4, 0, 0] }, spine: [4, 0, 0], head: 0, L: { foot: { at: [0.1, 0.02, -0.28], yaw: 0, lift: 30 } }, R: { foot: { at: [-0.1, 0, 0.2], yaw: 0 } } }),
             b: merge(A_RUN, { pelvis: { p: [0, "auto", 0], r: [4, 0, 0] }, spine: [4, 0, 0], head: 0, R: { foot: { at: [-0.1, 0.02, -0.28], yaw: 0, lift: 30 } }, L: { foot: { at: [0.1, 0, 0.2], yaw: 0 } } }) },
    steps: [step("a", 0.6, "On recule, pointe puis talon", null, "up"), step("b", 0.6, "On recule, pointe puis talon", null, "down")]
  });
  reg("Descente de marche sur le côté", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: { yaw: 0.15, dist: 3.9, ty: 0.75 }, props: ["step"], stepAt: { x: -0.3, z: 0.02 }, start: "up", thumb: "down",
    poses: {
      up: merge(ARMS_FWD, { pelvis: { p: [-0.06, "auto", 0], r: [0, 0, 0] }, spine: [4, 0, 0], head: 0, R: { foot: { at: [-0.1, 0.18, 0.1], yaw: 0 } }, L: { ang: [14, 10, 0, 60, -10] } }),
      down: merge(ARMS_FWD, { pelvis: { p: [-0.02, "auto", -0.03], r: [10, 0, 0] }, spine: [10, 0, 0], head: 0, R: { foot: { at: [-0.1, 0.18, 0.1], yaw: 0 } }, L: { foot: { at: [0.18, 0, 0.1], yaw: 0, lift: -10 } } })
    },
    steps: [step("down", 2.5, "Le talon descend sur le côté", "On descend lentement, genou au-dessus du pied", "down"), step("down", 0.5, "Le talon effleure le sol", null, "hold"), step("up", 1.5, "On remonte", "On remonte", "up")]
  });
  var FAR = { L: { foot: { at: [0.13, 0, 0.98], yaw: 0, lift: -20, pole: [0.15, 1, 0] } }, R: { foot: { at: [-0.13, 0, 0.98], yaw: 0, lift: -20, pole: [-0.15, 1, 0] } } };
  reg("Pont des ischios, talons loin", {
    camera: SUP_CAM, start: "down", thumb: "up",
    poses: { down: merge(LIE, SUPINE_HANDS, FAR),
             up: merge(SUPINE_HANDS, FAR, { pelvis: { p: [0, 0.33, -0.02], r: [-108, 0, 0] }, spine: [0, 0, 0], head: 18 }) },
    steps: [step("up", 1.5, "On pousse dans les talons", "On pousse dans les talons, les fesses montent", "up"), step("up", 2, "On tient", "On tient", "hold"), step("down", 3, "Descente lente", "On redescend lentement", "down")]
  });
  reg("Fente statique", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 1.2, dist: 4.4, tz: 0.1 }, start: "up", thumb: "down",
    poses: { up: merge(HANDS_HIPS, { pelvis: { p: [0, 0.92, 0.04], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0, L: { foot: { at: [0.1, 0, 0.5], yaw: 0 } }, R: { foot: { at: [-0.1, 0, -0.42], yaw: 0, lift: 40 } } }),
             down: merge(HANDS_HIPS, { pelvis: { p: [0, 0.56, 0.02], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0, L: { foot: { at: [0.1, 0, 0.5], yaw: 0 } }, R: { foot: { at: [-0.1, 0, -0.42], yaw: 0, lift: 45 } } }) },
    steps: [step("down", 2, "On descend droit", "On descend droit, le genou arrière vers le sol", "down"), step("up", 1.5, "On remonte", "On remonte", "up")]
  });
  reg("Mini-squat sur une jambe, tenu", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, timed: { byWeek: [20, 30, 30, 45] }, camera: { yaw: 0.7 }, start: "hold", thumb: "hold",
    poses: { hold: merge(ARMS_FWD, { pelvis: { p: [0.03, "auto", -0.06], r: [12, 0, 0], dy: -0.08 }, spine: [10, 0, 0], head: 0, L: { foot: { at: [0.08, 0, 0.12], yaw: 4 } }, R: { ang: [20, 4, 0, 70, 0] } }) }
  });

  /* ════════ NIVEAU 3 : charger et sauter ════════ */
  reg("Squat sur une jambe vers la chaise", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 1.25, dist: 4.2, ty: 0.7 }, props: ["chair"], chair: { z: 0.04 }, start: "up", thumb: "down",
    poses: { up: merge(ARMS_FWD, { pelvis: { p: [0.03, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0, L: { foot: { at: [0.1, 0, 0.12], yaw: 0 } }, R: { ang: [45, 4, 0, 10, 0] } }),
             down: merge(ARMS_FWD, { pelvis: { p: [0.03, 0.56, -0.24], r: [24, 0, 0] }, spine: [22, 0, 0], head: -14, L: { foot: { at: [0.1, 0, 0.12], yaw: 0 } }, R: { ang: [70, 4, 0, 5, 0] } }) },
    steps: [step("down", 3, "On s'assoit sur une jambe", "On descend sur une jambe vers la chaise", "down"), step("down", 0.5, "On effleure la chaise", null, "hold"), step("up", 2, "On se relève sur une jambe", "On pousse, on se relève", "up")]
  });
  var CROUCH = merge(A_RUN, { pelvis: { p: [0, 0.74, -0.12], r: [16, 0, 0] }, spine: [14, 0, 0], head: -10 });
  reg("Réception de saut stabilisée", {
    noIso: true, camera: { yaw: 1.25, dist: 4.4, ty: 0.7, tz: 0.15 }, props: ["step"], stepAt: { x: 0, z: -0.25 }, start: "top", thumb: "land",
    poses: { top: merge(STAND(0.11, 6), { pelvis: { p: [0, "auto", -0.25], r: [0, 0, 0] }, L: { foot: { at: [0.11, 0.18, -0.15], yaw: 6 } }, R: { foot: { at: [-0.11, 0.18, -0.15], yaw: -6 } } }),
             air: merge(STAND(0.11, 6), { pelvis: { p: [0, "auto", 0.1], r: [0, 0, 0] }, L: { foot: { at: [0.11, 0.14, 0.24], yaw: 6, lift: 30 } }, R: { foot: { at: [-0.11, 0.14, 0.24], yaw: -6, lift: 30 } }, LA: { ang: [40, 12, 0, 30] }, RA: { ang: [40, 12, 0, 30] } }),
             land: merge(CROUCH, { pelvis: { p: [0, 0.72, 0.28], r: [18, 0, 0] }, L: { foot: { at: [0.13, 0, 0.5], yaw: 8 } }, R: { foot: { at: [-0.13, 0, 0.5], yaw: -8 } }, LA: { ang: [60, 10, 0, 20] }, RA: { ang: [60, 10, 0, 20] } }) },
    steps: [step("air", 0.35, "On saute de la marche", "On saute", "up"), step("land", 0.35, "Réception, genoux souples", "Réception, genoux dans l'axe", "down"), step("land", 2, "On tient 2 secondes", "On tient, sans bruit", "hold"), step("top", 1.5, "On remonte sur la marche", null, "up")]
  });
  reg("Saut sur la marche", {
    noIso: true, camera: { yaw: 1.2, dist: 4.4, ty: 0.7, tz: 0.15 }, props: ["step"], start: "floor", thumb: "air",
    poses: { floor: merge(STAND(0.11, 6), { pelvis: { p: [0, "auto", -0.05], r: [0, 0, 0] } }),
             crouch: merge(CROUCH, { pelvis: { p: [0, 0.72, -0.2], r: [18, 0, 0] }, L: { foot: { at: [0.13, 0, 0.1], yaw: 8 } }, R: { foot: { at: [-0.13, 0, 0.1], yaw: -8 } }, LA: { ang: [-30, 10, 0, 20] }, RA: { ang: [-30, 10, 0, 20] } }),
             air: merge(STAND(0.11, 6), { pelvis: { p: [0, 1.16, 0.15], r: [0, 0, 0] }, L: { foot: { at: [0.11, 0.3, 0.32], yaw: 6, lift: 10 } }, R: { foot: { at: [-0.11, 0.3, 0.32], yaw: -6, lift: 10 } }, LA: { ang: [70, 12, 0, 20] }, RA: { ang: [70, 12, 0, 20] } }),
             land: merge(CROUCH, { pelvis: { p: [0, 0.88, 0.18], r: [16, 0, 0] }, L: { foot: { at: [0.13, 0.18, 0.46], yaw: 8 } }, R: { foot: { at: [-0.13, 0.18, 0.46], yaw: -8 } } }) },
    steps: [step("crouch", 0.8, "On prend de l'élan", "Bras en arrière", "down"), step("air", 0.35, "On saute sur la marche", "On saute", "up"), step("land", 1, "Réception douce", "Réception douce, genoux dans l'axe", "hold"), step("floor", 1.5, "On redescend en marchant", null, "down")]
  });
  var HOP = function (z, y, air) {
    return merge(A_RUN, { pelvis: { p: [0, air ? 1.0 : 0.82, z - (air ? 0 : 0.1)], r: [air ? 6 : 16, 0, 0] }, spine: [air ? 6 : 14, 0, 0], head: 0,
      L: air ? { ang: [20, 3, 0, 30, -20] } : { foot: { at: [0.08, 0, z + 0.12], yaw: 0 } }, R: { ang: [30, 3, 0, 90, 0] } });
  };
  reg("Saut sur une jambe, réception tenue", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: { yaw: 1.2, dist: 4.4, ty: 0.7, tz: 0.25 }, start: "start", thumb: "air",
    poses: { start: HOP(0, 0, false), air: HOP(0.25, 0.1, true), land: HOP(0.5, 0, false) },
    steps: [step("air", 0.35, "On saute vers l'avant", "On saute", "up"), step("land", 0.35, "Réception sur la même jambe", null, "down"), step("land", 2, "On tient 2 secondes", "On tient, genou dans l'axe", "hold"), step("start", 1.2, "On revient", null, "up")]
  });
  var SKATE = function (x) {
    var sg = x > 0 ? 1 : -1;
    return merge({ pelvis: { p: [x * 0.9, 0.78, -0.08], r: [22, 0, 0] }, spine: [16, 0, -6 * sg], head: 0,
      LA: { ang: sg > 0 ? [20, 30, 0, 40] : [70, 10, 0, 40] }, RA: { ang: sg > 0 ? [70, 10, 0, 40] : [20, 30, 0, 40] } },
      sg > 0 ? { L: { foot: { at: [x, 0, 0.1], yaw: 6 } }, R: { foot: { at: [x - 0.18, 0.04, -0.28], yaw: -10, lift: 40 } } }
             : { R: { foot: { at: [x, 0, 0.1], yaw: -6 } }, L: { foot: { at: [x + 0.18, 0.04, -0.28], yaw: 10, lift: 40 } } });
  };
  reg("Bonds du patineur", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 0.1, dist: 4.6, ty: 0.7 }, start: "l", thumb: "l",
    poses: { l: SKATE(0.42), mid: merge(A_RUN, { pelvis: { p: [0, 1.0, -0.04], r: [10, 0, 0] }, spine: [10, 0, 0], head: 0, L: { ang: [20, 6, 0, 40, -20] }, R: { ang: [20, 6, 0, 40, -20] } }), r: SKATE(-0.42) },
    steps: [step("mid", 0.3, "Bond sur le côté", null, "up"), step("r", 0.6, "Réception sur une jambe", null, "down"), step("mid", 0.3, "Bond sur le côté", null, "up"), step("l", 0.6, "Réception sur une jambe", null, "down")]
  });
  var LUNGE = function (front) {
    var f = front === "L" ? "L" : "R", b = f === "L" ? "R" : "L", fx = f === "L" ? 0.1 : -0.1;
    var o = merge(A_RUN, { pelvis: { p: [0, 0.6, 0.04], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0 });
    o[f] = { foot: { at: [fx, 0, 0.52], yaw: 0 } }; o[b] = { foot: { at: [-fx, 0, -0.42], yaw: 0, lift: 45 } };
    return o;
  };
  reg("Fentes sautées", {
    noIso: true, timed: { seconds: 30 }, camera: { yaw: 1.2, dist: 4.4, ty: 0.65 }, start: "lL", thumb: "air",
    poses: { lL: LUNGE("L"), air: merge(A_RUN, { pelvis: { p: [0, 1.02, 0.04], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0, L: { ang: [10, 3, 0, 30, -20] }, R: { ang: [10, 3, 0, 30, -20] } }), lR: LUNGE("R") },
    steps: [step("air", 0.3, "On saute et on change de jambe", null, "up"), step("lR", 0.6, "Réception en fente", null, "down"), step("air", 0.3, "On saute et on change de jambe", null, "up"), step("lL", 0.6, "Réception en fente", null, "down")]
  });

  /* ════════ LES LOUFOQUES (mais utiles) ════════ */
  var COSSACK = function (sg) {
    var o = merge(ARMS_FWD, { pelvis: { p: [0.34 * sg, 0.52, -0.12], r: [22, 0, 0] }, spine: [20, 0, 0], head: -10 });
    if (sg > 0) { o.L = { foot: { at: [0.42, 0, 0.14], yaw: 20 } }; o.R = { foot: { at: [-0.5, 0.06, 0.06], yaw: -10, lift: -60 } }; }
    else { o.R = { foot: { at: [-0.42, 0, 0.14], yaw: -20 } }; o.L = { foot: { at: [0.5, 0.06, 0.06], yaw: 10, lift: -60 } }; }
    return o;
  };
  reg("Le squat du cosaque", {
    noIso: true, camera: { yaw: 0.15, dist: 4.6, ty: 0.6 }, start: "mid", thumb: "l",
    poses: { mid: merge(ARMS_FWD, { pelvis: { p: [0, 0.82, -0.06], r: [10, 0, 0] }, spine: [8, 0, 0], head: 0, L: { foot: { at: [0.42, 0, 0.14], yaw: 20 } }, R: { foot: { at: [-0.42, 0, 0.14], yaw: -20 } } }),
             l: COSSACK(1), r: COSSACK(-1) },
    steps: [step("l", 2.5, "On s'assoit sur une jambe, l'autre tendue", "On descend sur le côté, l'autre jambe tendue, pointe en l'air", "down"), step("mid", 1.5, "On remonte au milieu", null, "up"), step("r", 2.5, "De l'autre côté", null, "down"), step("mid", 1.5, "On remonte au milieu", null, "up")]
  });
  var DUCK = function (sg) {
    var o = merge({ pelvis: { p: [0, 0.42, 0], r: [26, 0, 0] }, spine: [26, 0, 0], head: -18, LA: { ang: [60, 14, 0, 40] }, RA: { ang: [60, 14, 0, 40] } });
    o.L = { foot: { at: [0.16, 0, 0.18 + 0.1 * sg], yaw: 14, lift: sg > 0 ? 0 : 30 } };
    o.R = { foot: { at: [-0.16, 0, 0.18 - 0.1 * sg], yaw: -14, lift: sg > 0 ? 30 : 0 } };
    return o;
  };
  reg("La marche du canard", {
    noIso: true, timed: { seconds: 20 }, camera: { yaw: 0.9, dist: 4.0, ty: 0.5 }, start: "a", thumb: "a",
    poses: { a: DUCK(1), b: DUCK(-1) },
    steps: [step("a", 0.7, "On avance accroupi", "Coin coin", "up"), step("b", 0.7, "On avance accroupi", null, "down")]
  });
  reg("Le kangourou", {
    noIso: true, camera: { yaw: 1.2, dist: 4.4, ty: 0.65, tz: 0.2 }, start: "ground", thumb: "air",
    poses: { ground: merge(CROUCH, { pelvis: { p: [0, 0.74, -0.1], r: [18, 0, 0] }, L: { foot: { at: [0.13, 0, 0.12], yaw: 8 } }, R: { foot: { at: [-0.13, 0, 0.12], yaw: -8 } }, LA: { ang: [-25, 10, 0, 20] }, RA: { ang: [-25, 10, 0, 20] } }),
             air: merge(STAND(0.11, 6), { pelvis: { p: [0, 1.08, 0.2], r: [-2, 0, 0] }, L: { foot: { at: [0.11, 0.2, 0.32], yaw: 6, lift: 30 } }, R: { foot: { at: [-0.11, 0.2, 0.32], yaw: -6, lift: 30 } }, LA: { ang: [100, 14, 0, 20] }, RA: { ang: [100, 14, 0, 20] } }),
             land: merge(CROUCH, { pelvis: { p: [0, 0.74, 0.32], r: [18, 0, 0] }, L: { foot: { at: [0.13, 0, 0.54], yaw: 8 } }, R: { foot: { at: [-0.13, 0, 0.54], yaw: -8 } } }) },
    steps: [step("air", 0.4, "Hop ! Bond en avant, pieds joints", "Hop", "up"), step("land", 0.4, "Réception amortie", null, "down"), step("land", 1, "On se stabilise", null, "hold"), step("ground", 1, "On se replace", null, "up")]
  });
  var wall = KineAvatar._def("Chaise contre le mur");
  if (wall) {
    var abc = copy(wall); abc.timed = { byWeek: [30, 40, 50, 60] }; abc.noIso = true;
    abc.holdSay = { L: "On récite l'alphabet, A, B, C… sans bouger", R: "On récite l'alphabet, sans bouger" };
    reg("La chaise qui récite l'alphabet", abc);
  }
  var WAITER = function (front) {
    var o = LUNGE(front);
    o.LA = { hand: { at: [0.24, 0.98, 0.34], pole: [1, -1, -0.2] } }; o.RA = { ang: [10, 12, 0, 30] };
    return o;
  };
  reg("Le serveur pressé", {
    noIso: true, timed: { seconds: 40 }, camera: { yaw: 1.15, dist: 4.4, ty: 0.75 }, start: "up", thumb: "lL",
    poses: { up: merge(STAND(0.1, 0), { LA: { hand: { at: [0.24, 1.28, 0.3], pole: [1, -1, -0.2] } }, RA: { ang: [10, 12, 0, 30] } }), lL: WAITER("L"), lR: WAITER("R") },
    steps: [step("lL", 1.5, "Fente en avançant, le plateau reste droit", "Fente en avançant, le livre ne tombe pas", "down"), step("up", 1, "On se redresse", null, "up"), step("lR", 1.5, "Fente de l'autre jambe", null, "down"), step("up", 1, "On se redresse", null, "up")]
  });

  /* ════════ FICHES (bibliothèque) ════════ */
  var E = function (name, group, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: group, color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop }; };
  var F = [
    E("Pompe de cheville couché", "mollet", 1, ["un lit ou un tapis"], "45 secondes",
      "Allongé sur le dos, jambes tendues. Ramène les pointes de pieds vers toi, puis pousse-les vers l'avant, comme pour appuyer sur une pédale. Enchaîne sans t'arrêter.",
      "Les deux pieds bougent ensemble, le plus loin possible dans chaque sens.", "On ne bouge pas les genoux, seulement les chevilles.",
      "À faire plusieurs fois par jour après une opération : le mollet pompe le sang vers le cœur.", "Mollet douloureux, gonflé ou chaud : avis médical rapide (risque de phlébite)."),
    E("Contraction du quadriceps couché", "genou", 1, ["un tapis", "une serviette roulée"], "10 répétitions par jambe",
      "Allongé sur le dos, jambe tendue, une serviette roulée sous le genou si tu veux. Écrase l'arrière du genou vers le sol en serrant le haut de la cuisse et en ramenant la pointe du pied vers toi. Tiens 5 secondes, puis relâche.",
      "La rotule remonte, la cuisse devient dure sous la main.", "On ne retient pas sa respiration et on ne décolle pas le talon.",
      "Le tout premier exercice après une opération du genou : il réveille le quadriceps et aide à retrouver l'extension.", "Arrêt si douleur vive dans le genou."),
    E("Glissement du talon couché", "mobilite", 1, ["un tapis", "une chaussette sur un sol lisse"], "10 répétitions par jambe",
      "Allongé sur le dos, jambe tendue. Fais glisser le talon vers la fesse en pliant le genou, jusqu'à une gêne supportable. Tiens 2 secondes, puis allonge la jambe en faisant glisser le talon.",
      "Le talon reste au contact du sol tout le long.", "On ne force pas d'un coup : on gagne quelques degrés à chaque fois.",
      "Pour récupérer la flexion du genou. Plus facile : une serviette autour du pied pour aider avec les mains.", "Arrêt si douleur vive ou si le genou gonfle après."),
    E("Extension passive talon sur un rouleau", "mobilite", 1, ["un tapis", "un rouleau ou une serviette roulée"], "1 à 2 minutes par jambe",
      "Allongé sur le dos, le talon posé sur un rouleau ou une serviette roulée épaisse, rien sous le genou. Relâche complètement la cuisse et laisse le genou descendre vers le sol par son propre poids.",
      "Le genou pend dans le vide, la cuisse est molle.", "On ne met jamais de coussin sous le genou pour se reposer.",
      "Récupérer l'extension complète est la priorité après une opération du genou. Plus dur : un petit sac posé sur la cuisse.", "Arrêt si douleur vive derrière le genou ou fourmillements."),
    E("Contraction des ischios talon au sol", "ischio", 1, ["un tapis"], "10 répétitions par jambe",
      "Allongé sur le dos, genou un peu plié. Appuie le talon dans le sol et tire-le vers les fesses sans le faire bouger. Tiens 5 secondes, puis relâche.",
      "L'arrière de la cuisse se contracte, mais rien ne bouge.", "On ne décolle pas les fesses.",
      "Réveille les ischio-jambiers en douceur. Après une greffe prise sur les ischios, demande l'accord de ton kiné.", "Arrêt si douleur ou crampe à l'arrière de la cuisse."),
    E("Flexion assise, le pied recule", "mobilite", 1, ["une chaise"], "10 répétitions par jambe",
      "Assis au bord d'une chaise. Fais glisser le pied vers l'arrière, sous la chaise, pour plier le genou le plus loin possible, sans décoller la fesse. Tiens 3 secondes, puis reviens.",
      "Le pied glisse, la fesse reste sur la chaise.", "On ne force pas : on reste sur une gêne supportable.",
      "Pour gagner de la flexion du genou en position assise. Plus facile : une chaussette sur un sol lisse.", "Arrêt si douleur vive dans le genou."),
    E("Genou qui se balance, assis sur une table", "mobilite", 1, ["une table solide ou un plan de travail"], "1 minute",
      "Assis sur le bord d'une table, les jambes dans le vide. Laisse les jambes se balancer d'avant en arrière, tranquillement, sans forcer, comme un enfant sur un banc.",
      "Les jambes se balancent seules, détendues.", "On ne lance pas les jambes fort.",
      "Détend le genou et entretient sa souplesse, idéal le matin quand il est raide.", "Arrêt si douleur."),
    E("Vélo d'appartement", "cardio", 1, ["un vélo d'appartement"], "5 à 15 minutes",
      "Règle la selle pour que le genou reste un peu plié quand la pédale est en bas. Pédale tranquillement, sans résistance au début, en gardant les genoux dans l'axe.",
      "Pédalage souple et régulier.", "Selle trop basse : le genou plie trop et force sur la rotule.",
      "Plus facile : selle haute et allers-retours de pédale si tu ne fais pas encore le tour complet. Plus dur : un peu de résistance.", "Arrêt si douleur dans le genou ou gonflement après."),
    E("Arc court du quadriceps sur un rouleau", "genou", 1, ["un tapis", "un rouleau ou une serviette roulée"], "12 répétitions par jambe",
      "Allongé sur le dos, un rouleau sous le genou. Tends complètement le genou en décollant le talon, la cuisse reste posée sur le rouleau. Tiens 2 secondes, puis redescends lentement.",
      "Le genou se tend complètement, la pointe du pied vers toi.", "On ne décolle pas la cuisse du rouleau.",
      "Renforce la fin de l'extension, souvent perdue après une blessure. Plus dur : un petit poids à la cheville.", "Arrêt si douleur sous la rotule."),
    E("Mini-squat", "genou", 1, [], "12 répétitions",
      "Debout, pieds à largeur de hanches, bras devant toi. Plie un peu les genoux, comme pour t'asseoir à peine, puis remonte. Les talons restent au sol.",
      "Genoux au-dessus des pieds, fesses un peu en arrière.", "On ne descend pas trop bas au début.",
      "Le premier squat après une blessure. Plus dur : descendre plus bas, ou sur une jambe.", "Arrêt si douleur dans le genou."),
    E("Marche arrière", "genou", 1, ["un couloir dégagé"], "45 secondes",
      "Marche à reculons, lentement, dans un couloir dégagé. Pose d'abord la pointe du pied, puis le talon, et tends bien le genou à chaque pas.",
      "Pointe puis talon, genou qui se tend.", "On ne marche pas vite : on regarde derrière soi de temps en temps.",
      "Fait travailler le quadriceps sans appuyer sur la rotule : souvent bien toléré quand l'avant du genou fait mal.", "Arrêt si perte d'équilibre. Près d'un mur au début."),
    E("Descente de marche sur le côté", "genou", 2, ["une marche"], "10 répétitions par jambe",
      "Debout de profil sur une marche, sur une jambe. Plie lentement le genou d'appui pour que le talon de l'autre jambe descende effleurer le sol sur le côté, puis remonte.",
      "Le genou d'appui reste au-dessus du pied, le bassin horizontal.", "Le genou ne rentre pas vers l'intérieur.",
      "Excellent pour le contrôle du genou et la douleur de rotule. Plus facile : une marche plus basse.", "Arrêt si douleur à l'avant du genou."),
    E("Pont des ischios, talons loin", "ischio", 2, ["un tapis"], "10 répétitions",
      "Allongé sur le dos, les talons posés loin des fesses, genoux à peine pliés, pointes de pied levées. Pousse dans les talons pour décoller les fesses, tiens, puis redescends lentement.",
      "On pousse dans les talons, l'arrière des cuisses travaille.", "On ne cambre pas le dos.",
      "Version du pont qui cible les ischio-jambiers. Plus dur : sur une jambe.", "Arrêt si crampe ou douleur à l'arrière de la cuisse."),
    E("Fente statique", "genou", 2, [], "10 répétitions par jambe",
      "Debout, un grand pas d'écart, pied arrière sur la pointe, mains sur les hanches. Descends tout droit, le genou arrière vers le sol, puis remonte. Les pieds ne bougent pas.",
      "On descend comme un ascenseur, buste droit.", "Le genou avant ne part pas loin devant le pied.",
      "Plus facile que la fente en marchant. Plus dur : bouteilles dans les mains.", "Arrêt si douleur dans le genou."),
    E("Mini-squat sur une jambe, tenu", "genou", 2, [], "30 secondes par jambe",
      "Debout sur une jambe, l'autre pied décollé. Plie le genou d'appui d'environ 30° et tiens la position, bras devant toi, bassin horizontal.",
      "Le genou reste au-dessus du deuxième orteil.", "Le genou ne rentre pas, le bassin ne tombe pas.",
      "Contrôle du genou en appui sur une jambe, comme dans la course. Plus dur : yeux fermés.", "Arrêt si douleur ou perte d'équilibre répétée."),
    E("Squat sur une jambe vers la chaise", "genou", 3, ["une chaise"], "6 répétitions par jambe",
      "Debout devant une chaise, sur une jambe, l'autre tendue devant toi. Descends lentement jusqu'à effleurer la chaise avec les fesses, sans t'asseoir, puis remonte sur la même jambe.",
      "Descente lente, genou dans l'axe du pied.", "On ne se laisse pas tomber sur la chaise.",
      "Un vrai test de force du genou. Plus facile : chaise plus haute ou coussin dessus.", "Arrêt si douleur dans le genou."),
    E("Réception de saut stabilisée", "reactif", 3, ["une marche"], "6 répétitions",
      "Debout sur une marche. Saute en avant et réceptionne-toi sur les deux pieds, genoux souples et dans l'axe des pieds. Tiens la position 2 secondes, sans bruit, puis remonte.",
      "Réception silencieuse, genoux au-dessus des pieds.", "Les genoux ne rentrent pas vers l'intérieur à la réception.",
      "Apprend au genou à amortir : la base de la prévention des entorses. Plus dur : réception sur une jambe.", "Arrêt si douleur ou si le genou rentre à chaque réception."),
    E("Saut sur la marche", "reactif", 3, ["une marche solide"], "6 répétitions",
      "Face à une marche solide. Plie les genoux, bras en arrière, puis saute pour te poser sur la marche, réception douce. Redescends en marchant, jamais en sautant.",
      "Réception douce sur la marche, genoux dans l'axe.", "On redescend en marchant.",
      "Travaille la puissance sans le choc de la réception au sol. Plus dur : une marche plus haute.", "Arrêt si douleur ou peur de rater la marche."),
    E("Saut sur une jambe, réception tenue", "reactif", 3, [], "5 répétitions par jambe",
      "Sur une jambe, saute vers l'avant d'une petite distance et réceptionne-toi sur la même jambe, genou souple. Tiens 2 secondes sans bouger avant de revenir.",
      "On tient la réception sans sautiller.", "Le genou ne rentre pas vers l'intérieur.",
      "Un des tests utilisés avant le retour au sport. Plus dur : plus loin, ou sur le côté.", "Arrêt si douleur ou instabilité du genou."),
    E("Bonds du patineur", "reactif", 3, ["environ 2 mètres d'espace"], "30 secondes",
      "Bondis sur le côté d'une jambe à l'autre, comme un patineur de vitesse. Réceptionne-toi sur une jambe, l'autre passe derrière, tiens une seconde, puis repars de l'autre côté.",
      "Réception souple, genou dans l'axe.", "On ne bondit pas plus loin que ce qu'on peut tenir.",
      "Travaille les appuis latéraux du sport. Plus facile : « Skater latéral sans saut ».", "Arrêt si douleur au genou ou à la cheville."),
    E("Fentes sautées", "reactif", 3, [], "30 secondes",
      "En position de fente, saute et change de jambe en l'air pour retomber en fente de l'autre côté. Réception souple, buste droit.",
      "Réception douce, genou avant au-dessus du pied.", "On ne tombe pas lourdement.",
      "Exigeant : réservé à la fin de la rééducation. Plus facile : fentes alternées sans saut.", "Arrêt si douleur au genou."),
    E("Le squat du cosaque", "genou", 3, [], "6 répétitions par côté",
      "Debout, pieds très écartés. Descends sur une jambe en t'asseyant sur le côté, l'autre jambe reste tendue, pointe du pied vers le plafond. Remonte au milieu, puis de l'autre côté.",
      "Talon de la jambe pliée au sol, dos droit.", "On ne force pas l'écart : on descend seulement jusqu'où c'est confortable.",
      "Force et souplesse à la fois, avec un air de danse cosaque. Plus facile : en se tenant à une chaise.", "Arrêt si douleur à l'intérieur du genou ou à l'aine."),
    E("La marche du canard", "genou", 3, ["un sol dégagé"], "20 secondes",
      "Accroupi, fesses basses, avance à petits pas en restant accroupi, comme un canard. Garde le dos droit et les genoux dans l'axe des pieds.",
      "On reste bas, les petits pas sont réguliers.", "À éviter si le genou n'aime pas les flexions profondes.",
      "Ludique, et redoutable pour les cuisses. Plus facile : quelques pas seulement.", "Arrêt si douleur dans le genou, surtout à l'avant ou dans le pli."),
    E("Le kangourou", "reactif", 3, ["un couloir dégagé"], "6 bonds",
      "Pieds joints, plie les genoux, bras en arrière, puis bondis vers l'avant le plus loin possible. Réceptionne-toi pieds joints, genoux souples, et stabilise-toi avant le bond suivant.",
      "Réception silencieuse et stable avant de repartir.", "On n'enchaîne pas les bonds sans se stabiliser.",
      "Puissance et réception, pour la fin de la rééducation. Plus facile : petits bonds.", "Arrêt si douleur au genou ou à la cheville."),
    E("La chaise qui récite l'alphabet", "genou", 2, ["un mur libre"], "30 à 60 secondes",
      "Dos au mur, descends comme pour t'asseoir sur une chaise invisible, genoux au-dessus des pieds. Tiens la position en récitant l'alphabet à voix haute. Arrivé à Z, tu as fini !",
      "On récite à voix haute, sans retenir sa respiration.", "On ne descend pas plus bas que ce que le genou accepte.",
      "Parler empêche de bloquer sa respiration, et le temps passe plus vite. Plus dur : l'alphabet à l'envers.", "Arrêt si douleur sous la rotule."),
    E("Le serveur pressé", "genou", 2, ["un livre léger", "un couloir dégagé"], "40 secondes",
      "Un livre posé à plat sur la main, bras plié comme un serveur qui porte un plateau. Avance en fentes, une jambe après l'autre, sans faire tomber le livre.",
      "Le buste reste droit, le livre ne bouge pas.", "On ne regarde pas le livre : on regarde devant.",
      "Fentes en marchant avec un défi d'équilibre en plus. Plus dur : un verre d'eau en plastique à la place du livre.", "Arrêt si douleur au genou ou perte d'équilibre.")
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  var U = function (s2, e) { return { s: s2, e: e }; };
  var USE = {
    "Pompe de cheville couché": U("Le mollet est une pompe : en bougeant la cheville, il fait remonter le sang des jambes et limite le gonflement.", ["Moins de gonflement après une opération", "Prévenir la phlébite au lit", "Se lever avec des jambes moins lourdes"]),
    "Contraction du quadriceps couché": U("Le quadriceps se « réveille » sans que le genou bouge, et tire la jambe en extension complète.", ["Tendre complètement le genou pour marcher", "Retrouver une cuisse qui répond", "Se lever d'une chaise"]),
    "Glissement du talon couché": U("Le genou se plie de plus en plus loin, en douceur, sans porter le poids du corps.", ["S'asseoir sur une chaise", "Monter les escaliers", "Enfiler ses chaussettes"]),
    "Extension passive talon sur un rouleau": U("Le poids de la jambe étire doucement l'arrière du genou : on récupère l'extension complète, indispensable pour bien marcher.", ["Marcher sans boiter", "Se tenir debout sans fatigue", "Éviter un genou qui reste plié"]),
    "Contraction des ischios talon au sol": U("L'arrière de la cuisse travaille sans bouger, donc sans tirer sur une cicatrice ou une greffe.", ["Plier le genou en marchant", "Protéger le genou", "Courir plus tard"]),
    "Flexion assise, le pied recule": U("La flexion du genou progresse en position assise, avec le poids du corps pour aider un peu.", ["Se relever d'une chaise", "S'asseoir aux toilettes", "Monter en voiture"]),
    "Genou qui se balance, assis sur une table": U("Le mouvement doux et répété nourrit le cartilage et détend les muscles autour du genou.", ["Dérouiller le genou le matin", "Moins de raideur", "Préparer une séance"]),
    "Vélo d'appartement": U("Le genou plie et se tend des centaines de fois, sans choc : il retrouve de la souplesse et de l'endurance.", ["Faire du vélo dehors", "Marcher plus longtemps", "Monter les escaliers sans essoufflement"]),
    "Arc court du quadriceps sur un rouleau": U("Le quadriceps termine l'extension du genou, les derniers degrés qui manquent souvent après une blessure.", ["Tendre la jambe pour marcher", "Verrouiller le genou debout", "Monter une marche"]),
    "Mini-squat": U("Le premier pas vers le squat : le genou plie un peu, en charge, en toute sécurité.", ["S'asseoir et se relever", "Ramasser un objet", "Descendre une pente"]),
    "Marche arrière": U("En reculant, le quadriceps tend le genou sans écraser la rotule : moins de douleur, autant de travail.", ["Reculer sans perdre l'équilibre", "Descendre les escaliers", "Faire du sport sans douleur à la rotule"]),
    "Descente de marche sur le côté": U("Le genou freine la descente en restant dans l'axe : c'est ce contrôle qui protège la rotule et les ligaments.", ["Descendre les escaliers", "Descendre d'un trottoir", "Courir en descente"]),
    "Pont des ischios, talons loin": U("Talons loin, ce sont les ischio-jambiers qui soulèvent le bassin, plus que les fessiers.", ["Courir et sprinter", "Monter une côte", "Se pencher en avant"]),
    "Fente statique": U("Chaque jambe travaille séparément, en équilibre : le côté faible ne peut pas se cacher.", ["Se relever d'un genou au sol", "Monter les escaliers", "Faire un grand pas"]),
    "Mini-squat sur une jambe, tenu": U("Le genou apprend à rester stable sur une jambe, la position de chaque foulée en course.", ["Courir sans que le genou rentre", "Descendre les escaliers", "Tenir sur une jambe"]),
    "Squat sur une jambe vers la chaise": U("Le genou porte tout le poids du corps en pliant : la force qu'il faut pour le sport et les escaliers.", ["Se relever sur une jambe", "Monter des marches hautes", "Reprendre le sport"]),
    "Réception de saut stabilisée": U("Le genou apprend à amortir sans rentrer vers l'intérieur : la base pour éviter une nouvelle blessure.", ["Retomber d'un saut au sport", "Descendre d'un muret", "Courir et s'arrêter net"]),
    "Saut sur la marche": U("On travaille l'explosivité des jambes, en limitant le choc de la réception.", ["Sauter au sport", "Monter vite des marches", "Démarrer un sprint"]),
    "Saut sur une jambe, réception tenue": U("Sauter et retomber sur une jambe, c'est ce que demande le sport, et c'est un des tests avant d'y retourner.", ["Reprendre le foot, le basket, le hand", "Sauter un obstacle", "Courir vite"]),
    "Bonds du patineur": U("Les appuis sur le côté et les changements de direction, là où le genou se blesse le plus souvent en sport.", ["Changer de direction", "Jouer au tennis ou au foot", "Skier"]),
    "Fentes sautées": U("Force, coordination et réception, enchaînées vite : on prépare le genou à l'intensité du sport.", ["Reprendre le sport", "Courir vite", "Sauter"]),
    "Le squat du cosaque": U("Force et souplesse sur le côté en même temps : hanche, genou et adducteurs travaillent ensemble.", ["S'accroupir sur le côté", "Jouer au foot", "Jardiner"]),
    "La marche du canard": U("Le genou travaille en flexion profonde, en charge, comme quand on s'accroupit pour longtemps.", ["S'accroupir pour jardiner", "Jouer avec des enfants au sol", "Bricoler accroupi"]),
    "Le kangourou": U("Bondir et retomber pieds joints : puissance des jambes et réception contrôlée.", ["Sauter par-dessus une flaque", "Reprendre le sport", "Courir et sauter"]),
    "La chaise qui récite l'alphabet": U("Le quadriceps tient sans bouger, souvent bien supporté par le genou, et parler oblige à respirer.", ["Rester debout longtemps", "Faire du ski", "Monter les escaliers"]),
    "Le serveur pressé": U("Des fentes en marchant, avec un défi d'équilibre : le genou travaille pendant que l'attention est ailleurs.", ["Marcher en portant quelque chose", "Monter les escaliers les bras chargés", "Garder l'équilibre en mouvement"])
  };
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });
  window.KineGenouEx = { names: F.map(function (f) { return f.name; }) };
})();
