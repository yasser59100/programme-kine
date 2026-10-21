/* ═══════════ KinéForce — nouveaux exercices, lot 2 ═══════════
   Genou, hanche, ischios, pied, dos, épaule, main, cou, équilibre et relevé du sol.
   Même principe que kine-nouveaux.js : poses de Yass, fiche, et schéma animé pour les mouvements fins
   (les schémas s'ajoutent à KineAvatar.aids / KineAvatar.aidSvg). */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT, lifted = lib.lifted;
  var QUAD = lib.QUAD, BR = lib.BRIDGE_DOWN, SIDE = lib.SIDE, CROSS = lib.CROSS;
  var reg = function (n, d) { if (!KineAvatar.supports(n)) KineAvatar.register(n, d); };
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var from = function (n) { var d = KineAvatar._def(n); return d ? copy(d) : null; };
  var ARMS_FWD = { LA: { ang: [85, 8, 0, 0] }, RA: { ang: [85, 8, 0, 0] } };
  var THIGHS = { LA: { hand: { at: [0.2, 0.6, -0.02], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.2, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } };
  var SIT = merge(SEAT, { spine: [0, 0, 0], head: 0 }, THIGHS);
  var FOOT_CAM = { yaw: 1.2, dist: 3.8, ty: 0.72, pitch: 0.24, tz: -0.08 };
  var SEAT_FEET = merge(SEAT, THIGHS, { spine: [10, 0, 0], head: -14 });
  var FORE = merge(SEAT, { spine: [24, 0, 0], head: -8, LA: { hand: { at: [0.15, 0.6, 0.15], pole: [0.6, -1, -0.3] } }, RA: { hand: { at: [-0.2, 0.6, -0.04], pole: [-1, -0.2, -0.4] } } });
  var HAND_CAM = { yaw: 1.1, dist: 2.7, ty: 0.75, pitch: 0.3, tz: 0 };
  var BR_UP = merge(BR, { pelvis: { p: [0, 0.288, -0.029], r: [-110, 0, 0] }, head: 20 });
  var SUP_CAM = { yaw: 1.3, pitch: 0.35, dist: 3.6, ty: 0.25, tz: 0.15 };

  /* ════════ GENOU ════════ */
  // À genoux, cuisses verticales ; on bascule le buste en arrière d'un bloc (genou-hanche-épaule alignés)
  var KNEEL = function (back) {
    var t = back * Math.PI / 180;
    return merge({ pelvis: { p: [0, 0.08 + 0.47 * Math.cos(t), 0.05 - 0.47 * Math.sin(t)], r: [-back, 0, 0] }, spine: [0, 0, 0], head: 0,
      L: { ang: [0, 4, 0, 90 + back, -40] }, R: { ang: [0, 4, 0, 90 + back, -40] } }, CROSS);
  };
  reg("Reverse Nordic", {
    camera: { yaw: 1.4, dist: 3.8, ty: 0.6 }, start: "up", thumb: "back",
    poses: { up: KNEEL(0), back: KNEEL(32) },
    steps: [step("back", 3, "On bascule en arrière, d'un bloc", "On bascule en arrière, d'un bloc", "down"), step("back", 0.5, "On tient", null, "hold"), step("up", 2, "On revient", "On revient", "up")]
  });
  var SISSY = function (k) {
    return merge({ pelvis: { p: [0, 0.94 - 0.36 * k, 0.03 - 0.06 * k], r: [-28 * k, 0, 0] }, spine: [0, 0, 0], head: 6 * k,
      L: { foot: { at: [0.11, 0, 0.12], yaw: 4, lift: 55 * k } }, R: { foot: { at: [-0.11, 0, 0.12], yaw: -4, lift: 55 * k } },
      RA: { hand: { at: [-0.5, 1.0 - 0.25 * k, 0.15], pole: [0, -1, 0] } }, LA: { ang: [10, 10, 0, 20] } });
  };
  reg("Sissy squat assisté", {
    noIso: true, camera: { yaw: 1.35, dist: 4.1 }, props: ["wallSide"], start: "up", thumb: "down",
    poses: { up: SISSY(0), down: SISSY(1) },
    steps: [step("down", 3, "Les genoux avancent, le buste part en arrière", "Les genoux avancent, talons levés", "down"), step("up", 2, "On remonte", "On remonte", "up")]
  });
  var LAT = merge(STAND(0.1, 6), ARMS_FWD);
  var latDown = merge(LAT, { pelvis: { p: [0.3, 0.64, -0.12], r: [28, 0, 0] }, spine: [6, 0, 0], L: { foot: { at: [0.55, 0, 0.14], yaw: 22 } }, R: { foot: { at: [-0.12, 0, 0.14], yaw: -6 } } });
  reg("Fente latérale", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 0.25, dist: 4.3 }, start: "up", thumb: "down",
    poses: { up: LAT, down: latDown },
    steps: [step("down", 2.5, "Grand pas de côté, on s'assoit sur la jambe", "Pas de côté, on s'assoit sur la jambe", "down"), step("up", 1.5, "On repousse pour revenir", "On revient", "up")]
  });
  // Variante glissée : le pied glisse sur la serviette, jambe tendue ; on s'assoit sur la jambe d'appui
  reg("Fente latérale glissée", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 0.25, dist: 4.3 }, props: ["floorTowel"], floorTowel: { x: -0.45, z: 0.14, w: 0.5, l: 0.3 },
    start: "up", thumb: "down",
    poses: { up: merge(LAT, { R: { foot: { at: [-0.16, 0, 0.12], yaw: -6 } } }),
             down: merge(LAT, { pelvis: { p: [0.1, 0.64, -0.12], r: [28, 0, 0] }, spine: [6, 0, 0], L: { foot: { at: [0.16, 0, 0.14], yaw: 10 } }, R: { foot: { at: [-0.68, 0, 0.14], yaw: -20 } } }) },
    steps: [step("down", 2.5, "Le pied glisse sur le côté", "Le pied glisse sur la serviette", "down"), step("up", 2, "On ramène en tirant", "On ramène", "up")]
  });
  // Petersen : debout sur la marche, talon levé, le genou avance au-dessus des orteils ; on remonte en tendant le genou
  reg("Petersen step-up", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camera: { yaw: 1.2, dist: 4.2, ty: 1.0 }, props: ["step"], stepAt: { x: 0.1, z: 0.12, along: "z" }, start: "up", thumb: "down",
    poses: {
      up: { pelvis: { p: [0, 1.11, 0.0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0, L: { foot: { at: [0.1, 0.18, 0.12], yaw: 0 } }, R: { ang: [14, 4, 0, 8, 0] }, LA: { ang: [30, 10, 0, 20] }, RA: { ang: [30, 10, 0, 20] } },
      down: { pelvis: { p: [0, 1.0, 0.04], r: [8, 0, 0] }, spine: [4, 0, 0], head: 0, L: { foot: { at: [0.1, 0.18, 0.12], yaw: 0, lift: 30 } }, R: { ang: [26, 4, 0, 8, 0] }, LA: { ang: [40, 10, 0, 20] }, RA: { ang: [40, 10, 0, 20] } }
    },
    steps: [step("down", 2, "Talon levé, le genou avance", "Talon levé, le genou avance", "down"), step("up", 1.5, "On tend le genou, le talon redescend", "On tend le genou", "up")]
  });
  (function () {
    var d = from("Chaise contre le mur"); if (!d) return;
    d.sides = "blocks"; d.sideWord = "jambe"; d.labelSwap = true; d.timed = { byWeek: [15, 20, 25, 30] };
    d.poses.hold.R = { ang: [90, 4, 0, 6, 0] };
    reg("Chaise contre le mur sur une jambe", d);
  })();
  (function () {
    var d = from("Step-up sur marche"); if (!d) return;
    d.load = "both"; d.loadKind = "bottle";
    reg("Montée de marche avec charge", d);
  })();

  /* ════════ HANCHE ════════ */
  var CLAM = function (open, feet) {
    return merge(SIDE, { L: { ang: [45, 0, feet ? -18 : 0, 90, 0] }, R: { ang: [45, open, (feet ? -18 : 0) + open * 1.3, 90, 0] } });
  };
  reg("Coquillage à l'élastique", {
    sides: "blocks", snapSideChange: true, camera: { yaw: 0.05, pitch: 0.4, dist: 3.4, ty: 0.3 }, bands: [["LK", "RK"]], start: "closed", thumb: "open",
    poses: { closed: CLAM(0, false), open: CLAM(38, false) },
    steps: [step("open", 1.2, "Le genou s'ouvre, pieds collés", "Le genou s'ouvre, les pieds restent collés", "up"), step("open", 1, "On tient", "On tient", "hold"), step("closed", 2, "On referme lentement", "On referme lentement", "down")]
  });
  reg("Coquillage pieds décollés", {
    sides: "blocks", snapSideChange: true, camera: { yaw: 0.05, pitch: 0.4, dist: 3.4, ty: 0.3 }, bands: [["LK", "RK"]], start: "closed", thumb: "open",
    poses: { closed: merge(CLAM(0, true), { L: { ang: [45, 12, -18, 90, 0] }, R: { ang: [45, -12, -18, 90, 0] } }), open: merge(CLAM(0, true), { L: { ang: [45, 12, -18, 90, 0] }, R: { ang: [45, 30, -18, 90, 0] } }) },
    steps: [step("open", 1.2, "Pieds levés, le genou s'ouvre", "Les pieds restent levés, le genou s'ouvre", "up"), step("open", 1, "On tient", "On tient", "hold"), step("closed", 2, "On referme lentement", "On referme", "down")]
  });
  // Élévation du bassin : debout sur une jambe sur la marche, le bassin du côté libre descend puis remonte
  var HIKE = function (tilt, ry) {
    return { pelvis: { p: [0.12, 1.1, 0], r: [0, 0, tilt] }, spine: [0, 0, -tilt * 0.6], head: 0,
      L: { foot: { at: [0.17, 0.18, 0.12], yaw: 0 } }, R: { foot: { at: [-0.06, ry, 0.12], yaw: 0 } }, LA: { ang: [6, 10, 0, 10] }, RA: { ang: [6, 10, 0, 10] } };
  };
  reg("Élévation du bassin sur une marche", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, camFlip: true, camera: { yaw: 0.25, dist: 4.6, ty: 0.95 }, props: ["step"], stepAt: { x: 0.2, z: 0.12, along: "z" }, start: "mid", thumb: "up",
    poses: { mid: HIKE(0, 0.12), down: HIKE(-10, 0.02), up: HIKE(9, 0.22) },
    steps: [step("down", 1.5, "Le bassin descend du côté libre", "Le bassin descend du côté libre", "down"), step("up", 1.5, "On le remonte avec la hanche d'appui", "On remonte le bassin", "up"), step("up", 1, "On tient", null, "hold"), step("mid", 1, "On revient", null, "down")]
  });
  var PLANE = function (rot) {
    return { pelvis: { p: [0, "auto", -0.08], r: [50, rot * 0.3, 0] }, spine: [0, 0, rot * 0.8], head: -10,
      R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } }, L: { ang: [-14, 3, 0, 10, 10] }, LA: { ang: [10, 80, 0, 5] }, RA: { ang: [10, 80, 0, 5] } };
  };
  reg("Avion sur une jambe", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, noIso: true, camera: { yaw: 0.5, dist: 4.2 }, start: "closed", thumb: "open",
    poses: { closed: PLANE(-12), open: PLANE(30) },
    steps: [step("open", 2, "Le bassin s'ouvre vers le plafond", "Le bassin s'ouvre", "up"), step("closed", 2, "Il se referme vers le sol", "On referme", "down")]
  });
  (function () {
    var d = from("Marche latérale élastique"); if (!d) return;
    var b = d.poses.base;
    d.poses.fl = merge(b, { pelvis: { p: [0.05, 0.8, 0.0], r: [14, 0, 0] }, L: { foot: { at: [0.3, 0, 0.36], yaw: 20 } } });
    d.poses.fr = merge(b, { pelvis: { p: [-0.05, 0.8, 0.0], r: [14, 0, 0] }, R: { foot: { at: [-0.3, 0, 0.36], yaw: -20 } } });
    d.camera = { yaw: 0.45, dist: 4.3 }; d.thumb = "fl";
    d.steps = [step("fl", 0.9, "Pas en diagonale, genoux écartés", "Pas en diagonale", "up"), step("base", 0.7, "On ramène", null, "down"), step("fr", 0.9, "Pas en diagonale, genoux écartés", null, "up"), step("base", 0.7, "On ramène", null, "down")];
    reg("Monster walk", d);
  })();
  (function () {
    var d = from("Fente arrière"); if (!d) return;
    d.props = (d.props || []).concat(["floorTowel"]); d.floorTowel = { x: 0.1, z: -0.3, w: 0.3, l: 0.5 };
    reg("Fente arrière glissée", d);
  })();

  /* ════════ ISCHIOS ════════ */
  reg("Pont isométrique talons qui tirent", {
    timed: { byWeek: [20, 30, 30, 40] }, camera: SUP_CAM, start: "rest", thumb: "hold",
    poses: { rest: BR, hold: BR_UP }
  });
  (function () {
    var d = from("Leg curl serviette au sol"); if (!d) return;
    d.sides = "blocks"; d.sideWord = "jambe"; d.labelSwap = true;
    for (var k in d.poses) d.poses[k].R = { ang: [75, 4, 0, 0, -20] };
    reg("Leg curl serviette sur une jambe", d);
  })();

  /* ════════ MOLLET, CHEVILLE, PIED ════════ */
  var WALLB = function (lift) { return lifted(merge(STAND(0.11, 6), { pelvis: { p: [0, "auto", -0.36], r: [-5, 0, 0] }, spine: [-2, 0, 0], L: { foot: { at: [0.11, 0, -0.08], yaw: 6 } }, R: { foot: { at: [-0.11, 0, -0.08], yaw: -6 } } }), lift); };
  reg("Relevé des orteils dos au mur", {
    camera: { yaw: 1.3, dist: 3.6, ty: 0.7 }, props: ["wallBack"], start: "down", thumb: "up",
    poses: { down: WALLB(0), up: WALLB(-28) },
    steps: [step("up", 1, "Les orteils montent vers les tibias", "Les orteils montent", "up"), step("up", 1, "On tient", null, "hold"), step("down", 2, "On repose lentement", "On repose lentement", "down")]
  });
  var SEATC = function (lift) { return merge(SEAT, { spine: [8, 0, 0], head: -6, L: { foot: { at: [0.14, 0, 0.14], yaw: 6, lift: lift } }, R: { foot: { at: [-0.14, 0, 0.14], yaw: -6, lift: lift } },
    LA: { hand: { at: [0.14, 0.58, 0.04], pole: [1, -0.2, -0.4] } }, RA: { hand: { at: [-0.14, 0.58, 0.04], pole: [-1, -0.2, -0.4] } } }); };
  reg("Mollet assis avec charge", {
    camera: FOOT_CAM, props: ["chair"], start: "down", thumb: "up",
    poses: { down: SEATC(0), up: SEATC(40) },
    steps: [step("up", 1.5, "Les talons montent", "Les talons montent", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 2.5, "Descente lente", "On redescend lentement", "down")]
  });
  reg("Yoga des orteils", {
    noIso: true, camera: FOOT_CAM, props: ["chair"], start: "flat", thumb: "big",
    poses: { flat: SEAT_FEET, big: merge(SEAT_FEET, {}), small: merge(SEAT_FEET, {}) },
    steps: [step("big", 2, "Le gros orteil se lève seul", "Le gros orteil se lève, les autres restent au sol", "up"), step("flat", 1, "On repose", null, "down"),
            step("small", 2, "Les quatre autres se lèvent", "Maintenant les quatre autres orteils", "up"), step("flat", 1, "On repose", null, "down")]
  });
  var ALPHA = function (ank, rot) { return merge(SIT, { L: { ang: [70, 6, rot, 10, ank] } }); };
  reg("Alphabet avec la cheville", {
    sides: "blocks", sideWord: "pied", labelSwap: true, camFlip: true, timed: { seconds: 40 }, noIso: true, camera: { yaw: 0.9, dist: 3.4, ty: 0.6 }, props: ["chair"], start: "c0", thumb: "c1",
    poses: { c0: ALPHA(-22, 0), c1: ALPHA(0, 14), c2: ALPHA(22, 0), c3: ALPHA(0, -14) },
    steps: [step("c1", 0.7, "Le pied écrit les lettres", null, "up"), step("c2", 0.7, "Le pied écrit les lettres", null, "up"), step("c3", 0.7, "Le pied écrit les lettres", null, "down"), step("c0", 0.7, "Le pied écrit les lettres", null, "down")]
  });
  var HOP = function (x, y) { return merge(STAND(0.08, 0), { pelvis: { p: [x, "auto", 0], r: [6, 0, 0] }, spine: [4, 0, 0], L: { foot: { at: [x + 0.08, y, 0.12], yaw: 0, lift: y ? 30 : 10 } }, R: { foot: { at: [x - 0.08, y, 0.12], yaw: 0, lift: y ? 30 : 10 } }, LA: { ang: [25, 12, 0, 70] }, RA: { ang: [25, 12, 0, 70] } }); };
  reg("Sauts latéraux par-dessus une ligne", {
    noIso: true, camera: { yaw: 0.25, dist: 4.2 }, props: ["floorTowel"], floorTowel: { x: 0, z: 0.12, w: 0.03, l: 0.8 }, start: "gL", thumb: "air",
    poses: { gL: HOP(0.16, 0), air: HOP(0, 0.07), gR: HOP(-0.16, 0) },
    steps: [step("air", 0.22, "Saut par-dessus la ligne", null, "up"), step("gR", 0.3, "Réception douce", null, "down"), step("air", 0.22, "Saut par-dessus la ligne", null, "up"), step("gL", 0.3, "Réception douce", null, "down")]
  });

  /* ════════ DOS ET TRONC ════════ */
  var HANDS_LOW = { LA: { hand: { at: [0.06, 0.03, 0.02], pole: [1, 0.4, 0] } }, RA: { hand: { at: [-0.06, 0.03, 0.02], pole: [-1, 0.4, 0] } } };
  var MCG = merge(BR, { R: { ang: [0, 4, 0, 0, -10] } }, HANDS_LOW);
  reg("Curl-up de McGill", {
    camera: SUP_CAM, start: "down", thumb: "up",
    poses: { down: MCG, up: merge(MCG, { spine: [9, 0, 0], head: 6 }) },
    steps: [step("up", 1.2, "Tête et épaules se décollent à peine", "Tête et épaules se décollent à peine", "up"), step("up", 8, "On tient en respirant", "On tient, on respire", "hold"), step("down", 1.5, "On repose", "On repose", "down")]
  });
  reg("Bascule du bassin couché", {
    camera: SUP_CAM, start: "neutral", thumb: "flat",
    poses: { neutral: BR, flat: merge(BR, { pelvis: { p: [0, 0.12, 0], r: [-97, 0, 0] } }) },
    steps: [step("flat", 2, "Le bas du dos s'écrase au sol", "Le bas du dos s'écrase doucement au sol", "up"), step("flat", 2, "On tient", "On tient", "hold"), step("neutral", 2, "On relâche", "On relâche", "down")]
  });
  var BANANA = function (bent) {
    return merge(BR, { spine: [10, 0, 0], head: 12, LA: { ang: [165, 8, 0, 6] }, RA: { ang: [165, 8, 0, 6] },
      L: { ang: bent ? [90, 4, 0, 90, 0] : [30, 4, 0, 0, -10] }, R: { ang: bent ? [90, 4, 0, 90, 0] : [30, 4, 0, 0, -10] } });
  };
  reg("Position banane genoux pliés", { timed: { byWeek: [20, 25, 30, 30] }, camera: SUP_CAM, start: "rest", thumb: "hold", poses: { rest: BR, hold: BANANA(true) } });
  reg("Position banane", { timed: { byWeek: [15, 20, 20, 25] }, camera: SUP_CAM, start: "rest", thumb: "hold", poses: { rest: BR, hold: BANANA(false) } });
  (function () {
    var d = from("Bear plank"); if (!d) return;
    var h = d.poses.hold;
    var mv = function (s) {
      var p = copy(h), hand = s === "L" ? "LA" : "RA", foot = s === "L" ? "R" : "L";
      if (p[hand] && p[hand].hand) p[hand].hand.at[2] += 0.12;
      if (p[foot] && p[foot].foot) p[foot].foot.at[2] += 0.12;
      return p;
    };
    d.poses.a = mv("L"); d.poses.b = mv("R"); d.start = "hold"; d.thumb = "a"; d.timed = { seconds: 30 };
    d.steps = [step("a", 0.7, "Main et pied opposés avancent", null, "up"), step("hold", 0.5, "Genoux à 2 cm du sol", null, "down"), step("b", 0.7, "Main et pied opposés avancent", null, "up"), step("hold", 0.5, "Genoux à 2 cm du sol", null, "down")];
    reg("Marche de l'ours", d);
  })();
  reg("Enfiler l'aiguille", {
    sides: "blocks", noIso: true, camera: { yaw: 0.15, pitch: 0.25, dist: 3.9, ty: 0.6, tz: 0.2 }, start: "open", thumb: "under",
    poses: {
      open: merge(QUAD, { spine: [0, 0, 40], head: 0, LA: { hand: { at: [0.62, 0.95, 0.4], pole: [0, -0.2, -1] } } }),
      under: merge(QUAD, { spine: [6, 0, -38], head: 10, LA: { hand: { at: [-0.42, 0.06, 0.42], pole: [0, 1, -0.3] } } })
    },
    steps: [step("under", 2.5, "Le bras passe sous le corps", "Le bras passe sous le corps, l'épaule descend", "down"), step("under", 1.5, "On souffle", "On souffle", "hold"), step("open", 2.5, "On ouvre vers le plafond", "On ouvre vers le plafond", "up")]
  });

  /* ════════ ÉPAULE ════════ */
  var RE90 = function (up) { return merge(STAND(0.12, 4), { LA: { hand: { at: up ? [0.48, 1.7, 0.03] : [0.48, 1.43, 0.29], pole: [0.4, -1, -0.6] } } }); };
  reg("Rotation externe à 90° à l'élastique", {
    sides: "blocks", sideWord: "bras", labelSwap: false, camFlip: true, camera: { yaw: 0.9, dist: 3.8, ty: 1.2 }, bands: [["LH", [0.48, 1.4, 0.95]]], start: "fwd", thumb: "up",
    poses: { fwd: RE90(false), up: RE90(true) },
    steps: [step("up", 1.5, "L'avant-bras se lève, coude fixe", "L'avant-bras se lève, le coude reste à hauteur d'épaule", "up"), step("up", 1, "On tient", "On tient", "hold"), step("fwd", 2.5, "Retour lent", "On revient lentement", "down")]
  });
  (function () {
    var d = from("Pompes sur genoux"); if (!d) return;
    var u = d.poses.up;
    d.poses = { up: u, sag: merge(copy(u), { pelvis: { p: [u.pelvis.p[0], u.pelvis.p[1] - 0.025, u.pelvis.p[2]], r: u.pelvis.r } }), plus: merge(copy(u), { pelvis: { p: [u.pelvis.p[0], u.pelvis.p[1] + 0.025, u.pelvis.p[2]], r: u.pelvis.r }, spine: [6, 0, 0] }) };
    d.start = "up"; d.thumb = "plus"; d.isoAfter = undefined;
    d.steps = [step("sag", 1.5, "Bras tendus, la poitrine descend entre les épaules", "Bras tendus, la poitrine descend", "down"), step("plus", 1.5, "On pousse le sol : le dos s'arrondit", "On pousse le sol, les omoplates s'écartent", "up"), step("plus", 1, "On tient", null, "hold"), step("up", 1, "On revient", null, "down")];
    reg("Pompe des omoplates sur les genoux", d);
  })();
  var OVER = function (k) { return merge(STAND(0.11, 4), k ? (k === "L" ? { L: { ang: [40, 3, 0, 50, 0] } } : { R: { ang: [40, 3, 0, 50, 0] } }) : {}, { LA: { ang: [172, 6, 0, 4] }, RA: { ang: [8, 8, 0, 20] } }); };
  reg("Porté d'une bouteille bras tendu en l'air", {
    sides: "blocks", sideWord: "bras", load: "L", timed: { seconds: 30 }, noIso: true, camera: { yaw: 0.35, dist: 4.3, ty: 1.05 }, start: "up", thumb: "kL",
    poses: { up: OVER(), kL: OVER("L"), kR: OVER("R") },
    steps: [step("kL", 0.6, "Bras tendu, épaule basse", null, "up"), step("up", 0.4, "Bras tendu, épaule basse", null, "down"), step("kR", 0.6, "Bras tendu, épaule basse", null, "up"), step("up", 0.4, "Bras tendu, épaule basse", null, "down")]
  });
  // Étirement de la capsule postérieure couché sur le côté : avant-bras vertical, l'autre main le pousse vers le sol
  var SLEEP = function (rot, hx, hy) {
    return merge(SIDE, { L: { ang: [40, 0, 0, 60, 0] }, R: { ang: [40, 0, 0, 60, 0] }, LA: { ang: [90, 0, rot, 90] },
      RA: { hand: { at: [hx, hy, 0.31], pole: [0, 1, 0.5] } } });
  };
  reg("Étirement de l'épaule couché sur le côté", {
    sides: "blocks", snapSideChange: true, timed: { seconds: 30 }, noIso: true, camera: { yaw: 0.75, pitch: 0.35, dist: 3.0, ty: 0.3, tx: 0.3 }, start: "up", thumb: "down",
    poses: { up: SLEEP(-90, 0.49, 0.27), down: SLEEP(-140, 0.3, 0.18) }
  });
  reg("Étirement du bras croisé devant la poitrine", {
    sides: "blocks", sideWord: "bras", timed: { seconds: 30 }, noIso: true, camera: { yaw: 0.35, dist: 3.6, ty: 1.2 }, start: "rest", thumb: "hold",
    poses: { rest: STAND(0.12, 4), hold: merge(STAND(0.12, 4), { LA: { hand: { at: [-0.38, 1.38, 0.18], pole: [0, -1, 0.3] } }, RA: { hand: { at: [-0.02, 1.3, 0.2], pole: [-1, -1, 0] } } }) }
  });

  /* ════════ COUDE, POIGNET, MAIN ════════ */
  var TWIST = merge(STAND(0.12, 4), { LA: { ang: [72, 4, 0, 8] }, RA: { ang: [72, 4, 0, 8] } });
  reg("Torsion de serviette", {
    tool: "towel", noIso: true, camera: { yaw: 0.6, dist: 3.4, ty: 1.15 }, start: "flat", thumb: "twist",
    poses: { flat: TWIST, twist: merge(TWIST, { LA: { ang: [74, 4, 0, 10] }, RA: { ang: [70, 4, 0, 6] } }) },
    steps: [step("twist", 1.5, "On tord la serviette", "On tord la serviette, poignet en flexion", "up"), step("twist", 0.5, "Bras tendus", null, "hold"), step("flat", 4, "On détord lentement", "On détord lentement, quatre secondes", "down")]
  });
  var foreUp = function (dy) { return merge(FORE, { LA: { hand: { at: [0.15, 0.6 + dy, 0.15], pole: [0.6, -1, -0.3] } } }); };
  reg("Ouverture des doigts contre un élastique", {
    sides: "blocks", sideWord: "main", labelSwap: true, camFlip: true, noIso: true, camera: HAND_CAM, props: ["chair"], start: "closed", thumb: "open",
    poses: { closed: foreUp(0), open: foreUp(0.004) },
    steps: [step("open", 1, "Les doigts s'écartent", "Les doigts s'écartent contre l'élastique", "up"), step("open", 1, "On tient", null, "hold"), step("closed", 2, "On referme lentement", "On referme lentement", "down")]
  });
  (function () {
    var d = from("Excentrique du poignet avec une bouteille"); if (!d) return;
    reg("Excentrique du poignet paume vers le haut", d);
  })();
  var GLIDE = merge(SEAT, { spine: [4, 0, 0], head: 0, LA: { hand: { at: [0.16, 1.1, 0.12], pole: [1, -1, -0.2] } }, RA: { hand: { at: [-0.2, 0.6, -0.02], pole: [-1, -0.2, -0.4] } } });
  reg("Glissements des tendons des doigts", {
    sides: "blocks", sideWord: "main", camFlip: true, noIso: true, camera: { yaw: 1.0, dist: 2.8, ty: 1.0, pitch: 0.1 }, props: ["chair"], start: "p1", thumb: "p3",
    poses: { p1: GLIDE, p2: GLIDE, p3: GLIDE, p4: GLIDE, p5: GLIDE },
    steps: [step("p1", 1.5, "Main ouverte, doigts tendus", "Main ouverte", "up"), step("p2", 1.5, "Crochet", "Crochet", "up"), step("p3", 1.5, "Poing fermé", "Poing", "up"), step("p4", 1.5, "Table", "Table", "up"), step("p5", 1.5, "Poing droit", "Poing droit", "up")]
  });

  /* ════════ COU ════════ */
  reg("Endurance des fléchisseurs du cou", {
    camera: { yaw: 1.35, pitch: 0.3, dist: 2.8, ty: 0.25, tz: -0.4 }, start: "rest", thumb: "lift",
    poses: { rest: BR, lift: merge(BR, { head: 14 }) },
    steps: [step("lift", 1.5, "Menton rentré, la tête se décolle d'un centimètre", "Menton rentré, la tête se décolle à peine", "up"), step("lift", 10, "On tient", "On tient, on respire", "hold"), step("rest", 2, "On repose", "On repose", "down")]
  });
  reg("Extension du cou à quatre pattes", {
    camera: { yaw: 1.25, pitch: 0.25, dist: 3.4, ty: 0.55, tz: 0.3 }, start: "down", thumb: "up",
    poses: { down: merge(QUAD, { head: 32 }), up: merge(QUAD, { head: -18 }) },
    steps: [step("up", 2, "On regarde devant, menton rentré", "On relève la tête, menton rentré", "up"), step("up", 1, "On tient", null, "hold"), step("down", 2, "On regarde le sol", "On regarde le sol", "down")]
  });

  /* ════════ ÉQUILIBRE ════════ */
  var CARD = merge(STAND(0.12, 4), { LA: { ang: [78, 6, 0, 5] } });
  reg("Regard fixe en tournant la tête", {
    timed: { seconds: 30 }, noIso: true, camera: { yaw: 0.5, dist: 3.6, ty: 1.2 }, start: "c", thumb: "c",
    poses: { c: CARD, l: merge(CARD, { spine: [2, 0, 4] }), r: merge(CARD, { spine: [2, 0, -4] }) },
    steps: [step("l", 0.6, "Les yeux restent sur la cible", null, "up"), step("r", 0.6, "Les yeux restent sur la cible", null, "down")]
  });
  var ONE = merge(STAND(0.1, 0), { L: { ang: [12, 3, 0, 75, 0] }, LA: { ang: [6, 22, 0, 10] }, RA: { ang: [6, 22, 0, 10] } });
  reg("Équilibre en double tâche", {
    sides: "blocks", sideWord: "jambe", labelSwap: true, timed: { seconds: 30 }, noIso: true, camera: { yaw: 0.5 }, start: "n1", thumb: "n1",
    poses: { n1: ONE, n2: ONE, n3: ONE, n4: ONE },
    steps: [step("n1", 2, "À rebours de 3 en 3", null, "hold"), step("n2", 2, "À rebours de 3 en 3", null, "hold"), step("n3", 2, "À rebours de 3 en 3", null, "hold"), step("n4", 2, "À rebours de 3 en 3", null, "hold")]
  });
  var WALKH = function (k, s) { return merge(STAND(0.11, 4), k === "L" ? { L: { ang: [40, 3, 0, 50, 0] } } : k === "R" ? { R: { ang: [40, 3, 0, 50, 0] } } : {}, { spine: [2, 0, s] }); };
  reg("Marche en tournant la tête", {
    timed: { seconds: 30 }, noIso: true, camera: { yaw: 0.5, dist: 4.1 }, start: "up", thumb: "kL",
    poses: { up: WALKH(null, 0), kL: WALKH("L", 3), kR: WALKH("R", -3) },
    steps: [step("kL", 0.6, "On marche en regardant à gauche", null, "up"), step("up", 0.4, "On marche en tournant la tête", null, "down"), step("kR", 0.6, "On marche en regardant à droite", null, "up"), step("up", 0.4, "On marche en tournant la tête", null, "down")]
  });

  /* ════════ SE RELEVER DU SOL ════════ */
  var HALFK = merge({ pelvis: { p: [0, 0.56, 0.0], r: [0, 0, 0] }, spine: [8, 0, 0], head: 0, L: { ang: [0, 4, 0, 90, -40] }, R: { foot: { at: [-0.13, 0, 0.5], yaw: 0 } } },
    { LA: { hand: { at: [0.1, 0.62, 0.42], pole: [1, -0.3, -0.2] } }, RA: { hand: { at: [-0.12, 0.62, 0.46], pole: [-1, -0.3, -0.2] } } });
  reg("Se relever du sol", {
    noIso: true, camera: { yaw: 1.1, dist: 4.4, ty: 0.6 }, start: "lie", thumb: "half",
    poses: { lie: BR, quad: QUAD, half: HALFK, stand: STAND(0.12, 6) },
    steps: [step("quad", 2.5, "On roule sur le côté, puis à quatre pattes", "On roule sur le côté, puis à quatre pattes", "up"), step("half", 2, "Un pied devant, mains sur le genou", "Un pied devant, les mains sur le genou", "up"),
            step("stand", 2, "On pousse pour se lever", "On pousse pour se lever", "up"), step("stand", 1, "Debout, on souffle", null, "hold"), step("half", 2, "On redescend : un genou au sol", "On redescend, un genou au sol", "down"), step("quad", 2, "Mains au sol", null, "down"), step("lie", 2.5, "On s'allonge", "On s'allonge", "down")]
  });
  /* ════════ FICHES ════════ */
  var E = function (name, group, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: group, color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop }; };
  var F = [
    E("Reverse Nordic", "genou", 3, ["un coussin sous les genoux"], "6 répétitions",
      "À genoux, cuisses verticales, bras croisés sur la poitrine. Bascule le buste en arrière d'un seul bloc, genoux, hanches et épaules alignés, aussi loin que tu contrôles, puis reviens en contractant les cuisses.",
      "Genoux, hanches et épaules restent alignés, on bascule d'un bloc.", "On ne plie pas les hanches et on ne cambre pas le dos.",
      "Plus facile : petite amplitude, ou en tenant un élastique fixé devant toi. Plus dur : descente en 4 secondes.", "Arrêt si douleur sous la rotule ou à l'avant de la cuisse."),
    E("Sissy squat assisté", "genou", 3, ["une poignée de porte ou un appui"], "8 répétitions",
      "Debout, une main sur un appui. Monte sur l'avant des pieds et laisse les genoux avancer pendant que le buste part en arrière, cuisses et buste alignés. Descends un peu, puis remonte en poussant sur l'avant des pieds.",
      "Les genoux avancent, le corps reste droit des genoux aux épaules.", "On ne plie pas les hanches : les fesses ne partent pas en arrière.",
      "Plus facile : petite amplitude. Plus dur : genoux plus bas, ou appui d'une seule main.", "Arrêt si la douleur sous la rotule dépasse 3 sur 10."),
    E("Fente latérale", "genou", 2, [], "8 répétitions par jambe",
      "Debout, pieds serrés. Fais un grand pas de côté, plie le genou de ce côté en t'asseyant en arrière, l'autre jambe tendue, les deux pieds à plat. Repousse pour revenir.",
      "On s'assoit en arrière sur la jambe pliée, le genou dans l'axe du pied.", "Le genou ne part pas vers l'intérieur, le talon reste au sol.",
      "Plus facile : un pas plus petit. Plus dur : avec une charge tenue contre la poitrine.", "Arrêt si douleur à l'intérieur du genou ou à l'aine."),
    E("Fente latérale glissée", "genou", 2, ["une serviette", "un sol lisse"], "8 répétitions par jambe",
      "Debout, un pied posé sur une serviette. Plie la jambe d'appui en t'asseyant en arrière pendant que l'autre pied glisse sur le côté, jambe tendue. Ramène le pied en tirant avec l'intérieur de la cuisse.",
      "La jambe d'appui travaille, l'autre glisse sans appuyer.", "Le genou d'appui reste dans l'axe du pied.",
      "Le retour fait aussi travailler les adducteurs. Plus facile : glisse moins loin.", "Arrêt si douleur à l'aine ou dans le genou."),
    E("Petersen step-up", "genou", 2, ["une marche"], "10 répétitions par jambe",
      "Debout sur une marche, sur une jambe, talon levé, genou plié vers l'avant au-dessus des orteils ; l'autre pied dans le vide devant. Tends le genou en laissant redescendre le talon, puis reviens lentement.",
      "Le talon descend quand le genou se tend.", "Le genou reste dans l'axe du pied, le bassin horizontal.",
      "Cible le vaste médial, à l'intérieur de la cuisse. Plus facile : tiens la rampe.", "Arrêt si la douleur sous la rotule dépasse 3 sur 10."),
    E("Chaise contre le mur sur une jambe", "genou", 3, ["un mur libre"], "15 secondes par jambe",
      "Dos plaqué au mur, descends en chaise, genoux à 90° au-dessus des chevilles. Tends une jambe devant toi et tiens sur l'autre, respiration libre.",
      "Le dos reste collé au mur, le genou d'appui au-dessus de la cheville.", "Le bassin ne bascule pas du côté de la jambe levée.",
      "Plus facile : descends moins bas. Plus dur : 30 secondes.", "Arrêt si douleur dans le genou."),
    E("Montée de marche avec charge", "genou", 2, ["une marche", "deux bouteilles ou deux sacs"], "8 répétitions par jambe",
      "Une charge dans chaque main, bras le long du corps. Pose un pied sur la marche, pousse dessus pour monter, puis redescends lentement en contrôlant.",
      "On pousse avec la jambe du haut, pas avec celle du bas.", "Le genou du haut reste dans l'axe du pied, le buste droit.",
      "Plus dur : marche plus haute ou charge plus lourde.", "Arrêt si douleur dans le genou ou perte d'équilibre."),
    E("Coquillage à l'élastique", "hanche", 1, ["un élastique"], "15 répétitions par côté",
      "Couché sur le côté, hanches et genoux pliés, élastique autour des genoux. Pieds collés, ouvre le genou du dessus sans bouger le bassin, tiens 1 seconde, puis referme lentement.",
      "Les pieds restent collés, le bassin ne roule pas en arrière.", "On ne bascule pas le buste pour ouvrir plus.",
      "Plus facile : sans élastique. Plus dur : « Coquillage pieds décollés ».", "Arrêt si douleur sur le côté de la hanche."),
    E("Coquillage pieds décollés", "hanche", 2, ["un élastique"], "12 répétitions par côté",
      "Même position que le coquillage, élastique autour des genoux. Décolle les deux pieds du sol et garde-les levés pendant que le genou du dessus s'ouvre puis se referme.",
      "Les pieds restent levés tout le long.", "Le bassin ne roule pas en arrière.",
      "Un cran au-dessus du coquillage pour le moyen fessier.", "Arrêt si douleur sur le côté de la hanche."),
    E("Élévation du bassin sur une marche", "hanche", 2, ["une marche"], "12 répétitions par côté",
      "Debout sur une marche, sur une jambe, l'autre pied dans le vide sur le côté, jambes tendues. Laisse descendre le bassin du côté libre, puis remonte-le plus haut que l'horizontale avec la hanche d'appui.",
      "C'est la hanche d'appui qui remonte le bassin, les genoux restent tendus.", "On ne penche pas le buste, on ne plie pas le genou d'appui.",
      "Discret mais très efficace pour le moyen fessier. Tiens un mur au début.", "Arrêt si douleur sur le côté de la hanche ou au bas du dos."),
    E("Avion sur une jambe", "hanche", 3, [], "6 répétitions par jambe",
      "Sur une jambe, penché en avant dos droit, l'autre jambe tendue en arrière, bras écartés. Ouvre le bassin et le buste vers le côté, puis referme vers le sol, sans perdre l'équilibre.",
      "Le genou d'appui reste souple et dans l'axe du pied.", "On ne fait pas le dos rond.",
      "Plus facile : un doigt sur un mur. Plus dur : mouvement plus ample, plus lent.", "Arrêt si douleur dans la hanche ou perte d'équilibre."),
    E("Monster walk", "hanche", 2, ["un élastique"], "20 pas",
      "Élastique autour des chevilles, genoux fléchis, buste un peu penché en avant. Avance en faisant des pas en diagonale, en gardant l'élastique tendu.",
      "L'élastique reste tendu, les genoux poussent vers l'extérieur.", "Les pieds ne se rapprochent pas, le buste ne se balance pas.",
      "Plus dur : élastique au-dessus des genoux, ou plus résistant.", "Arrêt si douleur dans la hanche ou le genou."),
    E("Fente arrière glissée", "genou", 2, ["une serviette", "un sol lisse"], "8 répétitions par jambe",
      "Debout, le pied arrière posé sur une serviette. Fais glisser le pied vers l'arrière en pliant le genou avant, jusqu'à ce que le genou arrière effleure le sol, puis ramène le pied en poussant sur la jambe avant.",
      "Le poids reste sur la jambe avant.", "Le genou avant reste au-dessus de la cheville.",
      "Plus facile qu'une fente classique pour l'équilibre, plus dur pour la jambe avant.", "Arrêt si douleur dans le genou."),
    E("Pont isométrique talons qui tirent", "ischio", 1, [], "30 secondes",
      "Allongé sur le dos, genoux pliés, talons au sol. Monte le bassin, puis tire les talons vers les fesses sans qu'ils bougent : l'arrière des cuisses se contracte. Tiens en respirant.",
      "Les talons tirent vers les fesses, rien ne bouge.", "On ne cambre pas le bas du dos.",
      "Plus dur : sur un talon, l'autre jambe tendue.", "Arrêt si crampe ou douleur derrière la cuisse."),
    E("Leg curl serviette sur une jambe", "ischio", 3, ["une serviette", "un sol lisse"], "6 répétitions par jambe",
      "Allongé sur le dos, un talon sur une serviette, l'autre jambe tendue vers le plafond. Monte le bassin, ramène le talon vers les fesses, puis repousse lentement, bassin haut.",
      "Le bassin reste haut tout le long.", "On ne laisse pas tomber le bassin quand on repousse.",
      "Plus facile : « Leg curl serviette au sol », sur les deux jambes.", "Arrêt si crampe ou douleur derrière la cuisse."),
    E("Relevé des orteils dos au mur", "mollet", 1, ["un mur libre"], "15 répétitions",
      "Dos et fesses contre le mur, talons à environ 30 cm du mur. Relève l'avant des pieds vers les tibias, talons au sol, puis repose-les lentement.",
      "Les talons restent au sol, les orteils montent vers les tibias.", "On ne décolle pas les fesses du mur.",
      "Renforce le muscle à l'avant du tibia, souvent oublié chez les coureurs. Plus dur : recule les talons.", "Arrêt si douleur ou crampe à l'avant du tibia."),
    E("Mollet assis avec charge", "mollet", 1, ["une chaise", "un sac lourd sur les genoux"], "15 répétitions",
      "Assis, pieds à plat, un sac lourd posé sur les genoux. Monte les talons le plus haut possible, tiens 1 seconde, puis redescends lentement.",
      "Les talons montent haut, la descente est lente.", "On ne pousse pas avec les mains sur les genoux.",
      "Genou plié, on cible le soléaire, le muscle profond du mollet. Plus dur : sac plus lourd, ou un pied à la fois.", "Arrêt si douleur au tendon d'Achille."),
    E("Yoga des orteils", "mollet", 1, ["une chaise"], "8 répétitions",
      "Assis, pieds à plat. Lève le gros orteil seul en gardant les quatre autres au sol, repose-le, puis lève les quatre autres en gardant le gros orteil au sol.",
      "Un orteil, puis les quatre autres, le reste du pied ne bouge pas.", "On ne lève pas tout le pied.",
      "Difficile au début : aide-toi avec les doigts pour retenir les orteils qui ne doivent pas bouger.", "Arrêt si crampe sous le pied."),
    E("Alphabet avec la cheville", "mobilite", 1, ["une chaise"], "40 secondes par pied",
      "Assis, une jambe tendue devant toi, talon posé ou pied en l'air. Écris les lettres de l'alphabet avec le gros orteil, en bougeant seulement la cheville.",
      "C'est la cheville qui dessine, la jambe ne bouge pas.", "On ne force pas en bout de mouvement.",
      "Très utile pour retrouver la mobilité après une entorse.", "Arrêt si douleur vive dans la cheville."),
    E("Sauts latéraux par-dessus une ligne", "mollet", 2, ["une ligne au sol (scotch, corde)"], "20 sauts",
      "Debout pieds joints à côté d'une ligne. Saute par-dessus la ligne d'un côté à l'autre, petits sauts rapides sur l'avant des pieds, réceptions souples.",
      "Petits sauts rapides, réception silencieuse.", "Les genoux ne partent pas vers l'intérieur.",
      "Plus dur : sur une seule jambe.", "Arrêt si douleur à la cheville, au genou ou au tendon d'Achille."),
    E("Curl-up de McGill", "gainage", 1, ["un tapis"], "6 répétitions",
      "Allongé sur le dos, une jambe pliée, l'autre tendue, mains sous le bas du dos pour garder son creux. Décolle à peine la tête et les épaules, regard au plafond, et tiens 8 secondes en respirant.",
      "Le creux du bas du dos reste en place, on décolle à peine.", "On ne tire pas sur la nuque et on ne fait pas un vrai crunch.",
      "Un classique en cas de lombalgie : il renforce le ventre sans plier le bas du dos. Change de jambe pliée à mi-série.", "Arrêt si douleur au bas du dos ou dans la nuque."),
    E("Bascule du bassin couché", "dos", 1, ["un tapis"], "10 répétitions",
      "Allongé sur le dos, genoux pliés, pieds au sol. Rentre doucement le ventre et bascule le bassin pour écraser le bas du dos contre le sol. Tiens 2 secondes, puis relâche.",
      "Le bas du dos s'écrase doucement au sol, sans soulever les fesses.", "On ne pousse pas avec les pieds.",
      "Le premier geste pour apprendre à contrôler son bassin. Plus dur : debout, dos au mur.", "Arrêt si la douleur au bas du dos augmente."),
    E("Position banane genoux pliés", "gainage", 2, ["un tapis"], "20 secondes",
      "Allongé sur le dos, bras tendus derrière la tête, hanches et genoux pliés à 90°. Décolle la tête et les épaules et plaque le bas du dos au sol. Tiens en respirant.",
      "Le bas du dos reste collé au sol.", "On ne cambre pas : si le dos se creuse, on rapproche les bras.",
      "Plus dur : « Position banane », jambes tendues.", "Arrêt si douleur au bas du dos ou dans la nuque."),
    E("Position banane", "gainage", 3, ["un tapis"], "15 secondes",
      "Allongé sur le dos, bras tendus derrière la tête, jambes tendues décollées du sol. Décolle les épaules et plaque le bas du dos au sol, le corps forme une banane. Tiens en respirant.",
      "Le bas du dos reste collé au sol.", "On ne cambre pas : si le dos se creuse, on monte les jambes.",
      "Plus facile : « Position banane genoux pliés ».", "Arrêt si douleur au bas du dos ou dans la nuque."),
    E("Marche de l'ours", "gainage", 2, [], "30 secondes",
      "À quatre pattes, genoux décollés de 2 cm, dos plat. Avance une main et le pied opposé en même temps, de quelques centimètres, puis l'autre côté. Avance puis recule.",
      "Les genoux restent à 2 cm du sol, le dos reste plat.", "Les fesses ne montent pas.",
      "Plus facile : sur place. Plus dur : en marche latérale.", "Arrêt si douleur aux poignets ou au bas du dos."),
    E("Enfiler l'aiguille", "mobilite", 1, ["un tapis"], "8 répétitions par côté",
      "À quatre pattes. Ouvre un bras vers le plafond en tournant le buste, puis fais-le passer sous le corps vers l'autre côté, l'épaule descend vers le sol. Souffle, puis rouvre.",
      "C'est le haut du dos qui tourne, le bassin reste au-dessus des genoux.", "On ne s'assoit pas sur les talons.",
      "Idéal pour la raideur entre les omoplates.", "Arrêt si douleur dans l'épaule."),
    E("Rotation externe à 90° à l'élastique", "epaule", 2, ["un élastique", "un point d'accroche devant toi"], "12 répétitions par bras",
      "Debout, élastique accroché devant toi. Coude à hauteur d'épaule, plié à 90°, avant-bras vers l'avant. Lève l'avant-bras vers le plafond en gardant le coude fixe, puis reviens lentement.",
      "Le coude reste à hauteur d'épaule, seul l'avant-bras tourne.", "On ne cambre pas et le coude ne descend pas.",
      "Pour les sports où le bras travaille en l'air (tennis, volley, natation, lancer).", "Arrêt si douleur ou accrochage dans l'épaule."),
    E("Pompe des omoplates sur les genoux", "epaule", 2, ["un tapis"], "10 répétitions",
      "En appui sur les mains et les genoux, bras tendus, corps aligné. Sans plier les coudes, laisse la poitrine descendre entre les épaules, puis pousse le sol pour arrondir légèrement le haut du dos.",
      "Les bras restent tendus, seules les omoplates bougent.", "Les coudes ne plient pas, le bassin ne s'affaisse pas.",
      "Plus dur : sur les pieds, en planche.", "Arrêt si douleur à l'avant de l'épaule ou au poignet."),
    E("Porté d'une bouteille bras tendu en l'air", "epaule", 2, ["une bouteille d'eau"], "30 secondes par bras",
      "Debout, une bouteille tenue bras tendu au-dessus de la tête, coude verrouillé. Marche sur place ou dans la pièce, épaule basse, buste droit.",
      "Le bras reste vertical, l'épaule basse.", "On ne cambre pas et on ne penche pas le buste.",
      "Plus dur : bouteille plus lourde ou marche plus longue.", "Arrêt si douleur ou fatigue anormale de l'épaule."),
    E("Étirement de l'épaule couché sur le côté", "mobilite", 1, ["un tapis", "un coussin"], "30 secondes par côté",
      "Couché sur le côté à étirer, bras devant toi à hauteur d'épaule, coude plié à 90°, avant-bras vers le plafond. Avec l'autre main, pousse doucement l'avant-bras vers le sol jusqu'à sentir un étirement à l'arrière de l'épaule.",
      "On pousse doucement, l'épaule reste au sol.", "On ne force pas : étirement, jamais douleur.",
      "Utile quand l'arrière de l'épaule est raide (sports de lancer).", "Arrêt si douleur à l'avant de l'épaule ou fourmillements."),
    E("Étirement du bras croisé devant la poitrine", "mobilite", 1, [], "30 secondes par bras",
      "Debout. Amène un bras tendu devant la poitrine vers l'autre épaule, et avec l'autre main, tire doucement le coude vers toi. Épaules basses.",
      "L'épaule étirée reste basse.", "On ne tourne pas le buste.",
      "À faire après les exercices d'épaule.", "Arrêt si douleur ou pincement à l'avant de l'épaule."),
    E("Torsion de serviette", "main", 2, ["une serviette roulée"], "15 répétitions",
      "Debout, bras tendus devant toi, une serviette roulée tenue à deux mains. Tords la serviette en pliant le poignet du côté douloureux vers le bas, puis détords lentement, en 4 secondes, avec ce poignet.",
      "On tord avec l'autre main, on détord lentement avec le côté douloureux.", "Les coudes restent tendus.",
      "Version maison du « Tyler twist », classique de l'épicondylite (tennis elbow).", "Arrêt si la douleur au coude dépasse 4 sur 10 ou reste plus forte le lendemain."),
    E("Ouverture des doigts contre un élastique", "main", 1, ["un élastique à cheveux"], "15 répétitions par main",
      "Assis, avant-bras posé sur la cuisse. Place un élastique autour des doigts tendus, puis écarte les doigts le plus possible, tiens 1 seconde, et referme lentement.",
      "Tous les doigts s'écartent ensemble.", "Le poignet reste droit.",
      "Équilibre les muscles qui ferment la main. Plus dur : deux élastiques.", "Arrêt si douleur dans les doigts ou le poignet."),
    E("Excentrique du poignet paume vers le haut", "main", 1, ["une bouteille d'eau", "une chaise"], "15 répétitions par poignet",
      "Assis, avant-bras posé sur la cuisse, paume vers le haut, bouteille en main. Remonte le poignet en t'aidant de l'autre main, puis lâche l'aide et laisse redescendre lentement, en 4 secondes.",
      "On monte avec l'aide, on descend seul et lentement.", "L'avant-bras reste posé, seul le poignet bouge.",
      "Pour la douleur à l'intérieur du coude (épicondylite médiale, « golfer's elbow »).", "Arrêt si la douleur au coude dépasse 4 sur 10."),
    E("Glissements des tendons des doigts", "main", 1, [], "5 répétitions par main",
      "Main levée devant toi, poignet droit. Enchaîne lentement cinq positions : main ouverte, crochet, poing, table (doigts tendus, pliés à la base), poing droit. Tiens chaque position 2 secondes.",
      "Chaque position est nette, le poignet reste droit.", "On ne force pas sur les doigts raides.",
      "Utile après un traumatisme de la main ou pour une main raide le matin.", "Arrêt si douleur vive ou fourmillements."),
    E("Endurance des fléchisseurs du cou", "cou", 2, ["un tapis"], "5 répétitions",
      "Allongé sur le dos, genoux pliés. Rentre le menton, puis décolle la tête d'un centimètre, en gardant le menton rentré. Tiens 10 secondes, puis repose.",
      "Le menton reste rentré, la tête se décolle à peine.", "Le menton ne part pas vers le plafond.",
      "Renforce les muscles profonds qui tiennent la tête. Plus dur : 20 secondes.", "Arrêt si douleur dans le cou, vertiges ou fourmillements."),
    E("Extension du cou à quatre pattes", "cou", 1, ["un tapis"], "10 répétitions",
      "À quatre pattes, dos plat. Menton rentré, laisse la tête descendre en regardant vers tes genoux, puis relève-la jusqu'à regarder un peu devant toi, nuque longue.",
      "Le mouvement vient du cou, le dos ne bouge pas.", "On ne lance pas la tête en arrière.",
      "Renforce l'arrière du cou en douceur.", "Arrêt si douleur dans le cou ou vertiges."),
    E("Regard fixe en tournant la tête", "equilibre", 1, ["une carte ou un post-it"], "30 secondes",
      "Debout, une carte tenue bras tendu devant toi (ou collée au mur). Fixe un mot et tourne la tête à droite et à gauche, de plus en plus vite, en gardant le mot net.",
      "Les yeux restent sur le mot, seule la tête tourne.", "Si le mot devient flou, on ralentit.",
      "Exercice de rééducation vestibulaire (vertiges). Plus dur : debout pieds joints, ou de haut en bas.", "Arrêt si vertige fort, nausée ou chute. Fais-le près d'un appui."),
    E("Équilibre en double tâche", "equilibre", 2, [], "30 secondes par jambe",
      "Debout sur une jambe, près d'un appui. Compte à voix haute à rebours de 3 en 3 à partir de 100 (100, 97, 94…) en gardant l'équilibre.",
      "On garde l'équilibre en réfléchissant.", "On ne fixe pas ses pieds.",
      "Le cerveau gère deux choses à la fois, comme dans la vie. Plus dur : yeux fermés, ou de 7 en 7.", "Arrêt si perte d'équilibre répétée."),
    E("Marche en tournant la tête", "equilibre", 2, [], "30 secondes",
      "Marche droit devant toi, dans un couloir, en tournant la tête à droite puis à gauche tous les deux pas, sans dévier de ta ligne.",
      "On garde sa ligne pendant que la tête tourne.", "On ne s'arrête pas pour tourner la tête.",
      "Rééducation des vertiges et prévention des chutes. Commence lentement, près d'un mur.", "Arrêt si vertige fort ou nausée."),
    E("Se relever du sol", "equilibre", 2, ["un tapis", "une chaise à côté"], "3 répétitions",
      "Allongé sur le dos. Roule sur le côté, mets-toi à quatre pattes, avance un pied à plat, mains sur le genou, puis pousse pour te lever. Redescends dans l'ordre inverse.",
      "Une étape à la fois, sans se presser.", "On ne se relève pas d'un coup en tirant sur le dos.",
      "Savoir se relever seul après une chute rassure énormément. Plus facile : une chaise à côté pour s'appuyer.", "Arrêt si vertige ou douleur. Fais-le avec quelqu'un à côté la première fois.")
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  var U = function (s2, e) { return { s: s2, e: e }; };
  var USE = {
    "Reverse Nordic": U("Le quadriceps travaille en freinant, étiré. C'est un des meilleurs exercices pour le protéger des déchirures et soulager le tendon rotulien.", ["Descendre une pente", "Freiner en courant", "Se mettre à genoux et se relever"]),
    "Sissy squat assisté": U("Le genou avance loin, le quadriceps travaille seul ou presque : on cible la cuisse sans charger la hanche ni le dos.", ["Descendre les escaliers", "S'accroupir", "Sauter et atterrir"]),
    "Fente latérale": U("La jambe travaille sur le côté, un mouvement oublié dans la vie moderne mais présent dans tous les sports.", ["Faire un pas de côté pour éviter quelqu'un", "Changer de direction", "Ramasser un objet sur le côté"]),
    "Fente latérale glissée": U("La jambe d'appui travaille fort pendant que l'autre glisse : le retour fait aussi travailler l'intérieur de la cuisse.", ["Changer de direction", "Garder l'équilibre sur un sol glissant", "Jouer au foot ou au tennis"]),
    "Petersen step-up": U("Le vaste médial, à l'intérieur de la cuisse, termine l'extension du genou. Le renforcer stabilise la rotule.", ["Monter les escaliers", "Se relever d'une position accroupie", "Courir avec un genou stable"]),
    "Chaise contre le mur sur une jambe": U("La cuisse tient seule le poids du corps sans bouger : un effort tenu souvent bien toléré par le genou.", ["Rester debout longtemps", "Ski", "Monter les escaliers"]),
    "Montée de marche avec charge": U("Comme dans les escaliers avec des courses : la jambe pousse tout le poids du corps, et un peu plus.", ["Monter les courses", "Monter dans un bus", "Randonner avec un sac"]),
    "Coquillage à l'élastique": U("Le moyen fessier et les rotateurs de la hanche tiennent le genou dans l'axe à chaque pas.", ["Marcher sans que le genou rentre", "Monter les escaliers", "Courir sans douleur à la hanche"]),
    "Coquillage pieds décollés": U("Même travail du moyen fessier, avec plus de contrôle pour garder les pieds levés.", ["Stabiliser la hanche en course", "Tenir sur une jambe", "Monter les escaliers"]),
    "Élévation du bassin sur une marche": U("Le moyen fessier de la jambe d'appui tient le bassin horizontal : c'est exactement son rôle quand on marche.", ["Marcher sans boiter", "Monter les escaliers", "Courir avec un bassin stable"]),
    "Avion sur une jambe": U("La hanche contrôle la rotation du bassin au-dessus de la jambe : équilibre, force et contrôle en même temps.", ["Changer de direction en courant", "Tourner sur un pied", "Ramasser un objet sur une jambe"]),
    "Monster walk": U("Les fessiers travaillent en continu pour garder les genoux écartés, comme dans les appuis sportifs.", ["Garder les genoux dans l'axe", "Courir et sauter", "Reprendre le sport"]),
    "Fente arrière glissée": U("La jambe avant porte tout le travail pendant que l'autre glisse : une fente plus contrôlée, plus douce pour l'équilibre.", ["Se mettre à genoux et se relever", "Monter les escaliers", "Ramasser un objet au sol"]),
    "Pont isométrique talons qui tirent": U("Les ischio-jambiers se contractent sans bouger, un effort tenu qui les renforce sans les irriter.", ["Marcher d'un bon pas", "Reprendre la course après une douleur derrière la cuisse", "Se pencher en avant"]),
    "Leg curl serviette sur une jambe": U("Les ischio-jambiers plient le genou et tiennent la hanche en même temps : un travail complet de l'arrière de la cuisse.", ["Sprinter", "Freiner une course", "Protéger le genou"]),
    "Relevé des orteils dos au mur": U("Le muscle à l'avant du tibia relève le pied à chaque pas et freine la pose du pied.", ["Ne pas accrocher les pieds en marchant", "Courir sans douleur au tibia", "Descendre les pentes"]),
    "Mollet assis avec charge": U("Genou plié, c'est le soléaire qui travaille : il porte jusqu'à plusieurs fois le poids du corps en course.", ["Courir plus longtemps", "Marcher en montée", "Protéger le tendon d'Achille"]),
    "Yoga des orteils": U("Les petits muscles du pied contrôlent chaque orteil : ils améliorent l'appui et l'équilibre.", ["Garder l'équilibre", "Marcher pieds nus", "Mieux pousser à chaque pas"]),
    "Alphabet avec la cheville": U("La cheville bouge dans toutes les directions et retrouve sa souplesse, sans charge.", ["Récupérer après une entorse", "Marcher sur un terrain irrégulier", "Dérouiller les chevilles le matin"]),
    "Sauts latéraux par-dessus une ligne": U("La cheville apprend à encaisser et rebondir sur le côté, comme dans les sports et sur les terrains irréguliers.", ["Reprendre le sport après une entorse", "Changer de direction", "Éviter de se tordre la cheville"]),
    "Curl-up de McGill": U("Le ventre se renforce sans plier le bas du dos, ce qui protège les disques lombaires.", ["Porter sans se faire mal au dos", "Se lever du lit", "Tousser ou éternuer sans douleur"]),
    "Bascule du bassin couché": U("On apprend à sentir et contrôler la position du bassin, la base de tous les exercices pour le dos.", ["Se tenir droit", "Soulager le bas du dos en position allongée", "Mieux faire tous les autres exercices"]),
    "Position banane genoux pliés": U("Tous les muscles de l'avant du tronc travaillent pour garder le bas du dos collé au sol.", ["Porter sans cambrer", "Se relever du sol", "Gainage pour le sport"]),
    "Position banane": U("Le ventre tient tout le corps tendu : un gainage avancé de l'avant du tronc.", ["Sports de saut et de lancer", "Porter lourd", "Gym et natation"]),
    "Marche de l'ours": U("Les épaules, le ventre et les hanches travaillent ensemble en mouvement, avec un tronc stable.", ["Se déplacer à quatre pattes (jouer avec les enfants)", "Se relever du sol", "Gainage en mouvement"]),
    "Enfiler l'aiguille": U("Le haut du dos retrouve sa rotation, ce qui soulage le cou et les épaules.", ["Regarder derrière soi", "Attraper un objet sur le côté", "Moins de raideur entre les omoplates"]),
    "Rotation externe à 90° à l'élastique": U("La coiffe des rotateurs tient l'épaule quand le bras est en l'air, la position la plus exposée.", ["Lancer", "Servir au tennis", "Ranger un objet en hauteur"]),
    "Pompe des omoplates sur les genoux": U("Le grand dentelé plaque l'omoplate contre les côtes et aide l'épaule à monter sans se coincer.", ["Lever le bras au-dessus de la tête", "Se relever en poussant sur les bras", "Pousser une charge"]),
    "Porté d'une bouteille bras tendu en l'air": U("Tous les stabilisateurs de l'épaule travaillent pour garder le bras vertical pendant qu'on bouge.", ["Ranger un objet en hauteur", "Porter un sac au-dessus de la tête", "Sports de bras levés"]),
    "Étirement de l'épaule couché sur le côté": U("L'arrière de l'épaule retrouve sa souplesse, ce qui libère la rotation du bras.", ["Attraper sa ceinture dans le dos", "Lancer", "Dormir sur le côté plus confortablement"]),
    "Étirement du bras croisé devant la poitrine": U("Étire l'arrière de l'épaule, souvent raide après les efforts du bras.", ["Récupérer après le sport", "Attraper un objet de l'autre côté", "Mettre une veste"]),
    "Torsion de serviette": U("Les muscles du poignet travaillent en freinant : c'est ce qui aide le plus le tendon du coude à se renforcer.", ["Porter une casserole", "Serrer une main", "Tenir une raquette"]),
    "Ouverture des doigts contre un élastique": U("Les muscles qui ouvrent la main équilibrent ceux qui serrent, souvent bien plus forts.", ["Moins de douleur au coude après avoir beaucoup serré", "Jouer d'un instrument", "Taper au clavier"]),
    "Excentrique du poignet paume vers le haut": U("Les muscles qui plient le poignet s'attachent à l'intérieur du coude : le travail lent renforce ce tendon.", ["Porter des sacs", "Jouer au golf", "Serrer un outil"]),
    "Glissements des tendons des doigts": U("Les tendons glissent dans leurs gaines sur toute leur longueur, ce qui garde la main souple.", ["Fermer complètement le poing", "Écrire et attraper de petits objets", "Récupérer après une blessure de la main"]),
    "Endurance des fléchisseurs du cou": U("Les muscles profonds de l'avant du cou tiennent la tête. Leur endurance diminue souvent quand le cou fait mal.", ["Tenir la tête sans fatigue", "Travailler sur écran", "Moins de maux de tête de tension"]),
    "Extension du cou à quatre pattes": U("Les muscles de l'arrière du cou travaillent en douceur, sans le poids de la tête à porter debout.", ["Regarder en haut", "Tenir la tête droite", "Moins de raideur dans la nuque"]),
    "Regard fixe en tournant la tête": U("L'oreille interne et les yeux réapprennent à travailler ensemble : la vue reste nette quand la tête bouge.", ["Marcher en regardant autour de soi", "Moins de vertiges", "Conduire et tourner la tête"]),
    "Équilibre en double tâche": U("Garder l'équilibre en pensant à autre chose, comme quand on marche en parlant : c'est là que surviennent beaucoup de chutes.", ["Marcher en discutant", "Porter un objet en regardant ailleurs", "Prévenir les chutes"]),
    "Marche en tournant la tête": U("On garde sa trajectoire pendant que la tête bouge, comme en traversant une rue.", ["Traverser la rue", "Marcher dans la foule", "Moins de vertiges en marchant"]),
    "Se relever du sol": U("Savoir se relever seul après une chute évite de rester longtemps au sol, et redonne confiance.", ["Se relever après une chute", "Jouer au sol avec les petits-enfants", "Jardiner"])
  };
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k2 in USE) if (!KineIdees.USAGE[k2]) KineIdees.USAGE[k2] = USE[k2]; });

  /* ════════ SCHÉMAS ANIMÉS DU LOT 2 ════════ */
  var SK = "#d9a77f", SV = KineAvatar.aidSvg || {}, AD = KineAvatar.aids || {};
  var svg = function (body, w) { return "<svg viewBox='0 0 120 120' width='" + (w || 84) + "' height='" + (w || 84) + "' aria-hidden='true'>" + body + "</svg>"; };
  var ARW = function (d, cls) { return "<path class='" + (cls || "ka-arrow") + "' d='" + d + "' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>"; };
  SV.hike = svg("<line x1='8' y1='104' x2='112' y2='104' stroke='var(--border2)' stroke-width='3'/><rect x='62' y='80' width='44' height='24' fill='var(--border2)'/>" +
    "<g class='ka-m ka-hk'><rect x='22' y='34' width='76' height='16' rx='8' fill='var(--blue)' opacity='.85'/><circle cx='34' cy='42' r='5' fill='#fff'/><circle cx='86' cy='42' r='5' fill='#fff'/></g>" +
    "<path d='M86 50 L84 80' stroke='" + SK + "' stroke-width='10' stroke-linecap='round'/><g class='ka-m ka-hkl'><path d='M34 50 L34 92' stroke='" + SK + "' stroke-width='10' stroke-linecap='round'/></g>");
  SV.tib = svg("<line x1='4' y1='100' x2='116' y2='100' stroke='var(--border2)' stroke-width='3'/><rect x='20' y='10' width='16' height='72' rx='8' fill='var(--text2)'/>" +
    "<g class='ka-m ka-tb'><path d='M18 98 Q16 80 34 80 L96 88 Q106 90 106 98 Z' fill='" + SK + "'/></g>" + ARW("M100 70 L100 52 M94 58 L100 52 L106 58"));
  SV.toeyoga = svg("<path d='M10 96 Q8 74 30 72 L80 76 L80 98 Z' fill='" + SK + "'/><line x1='4' y1='100' x2='116' y2='100' stroke='var(--border2)' stroke-width='3'/>" +
    "<g class='ka-m ka-big'><rect x='78' y='70' width='30' height='14' rx='7' fill='" + SK + "' stroke='#b9845d' stroke-width='1.5'/></g>" +
    "<g class='ka-m ka-sml'><rect x='78' y='86' width='24' height='11' rx='5' fill='" + SK + "' stroke='#b9845d' stroke-width='1.5'/></g>");
  SV.heelpull = svg("<line x1='4' y1='96' x2='116' y2='96' stroke='var(--border2)' stroke-width='3'/><path d='M14 90 L54 60 L84 56 L100 92' stroke='" + SK + "' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
    "<circle cx='14' cy='88' r='9' fill='#c88f66'/><g class='ka-pulse'>" + ARW("M104 82 L84 82 M90 76 L84 82 L90 88", "ka-a2") + "</g><text x='60' y='114' text-anchor='middle' font-size='11' font-weight='700' fill='var(--text2)' class='ka-still'>immobile</text>");
  SV.tilt = svg("<line x1='4' y1='92' x2='116' y2='92' stroke='var(--border2)' stroke-width='3'/>" +
    "<path class='ka-lo' d='M10 86 Q40 86 56 72 Q74 58 110 84' stroke='var(--amber)' stroke-width='6' fill='none' stroke-linecap='round'/>" +
    "<path class='ka-hi' d='M10 86 Q60 88 110 84' stroke='var(--amber)' stroke-width='6' fill='none' stroke-linecap='round'/>" +
    "<text x='60' y='112' text-anchor='middle' font-size='11' font-weight='700' fill='var(--text2)'>bas du dos</text>");
  SV.twist = svg("<rect x='6' y='50' width='16' height='22' rx='6' fill='" + SK + "'/><rect x='98' y='50' width='16' height='22' rx='6' fill='" + SK + "'/>" +
    "<rect x='22' y='54' width='76' height='14' rx='3' fill='#e9eef5' stroke='var(--text2)' stroke-width='1.5'/>" +
    "<g class='ka-hi'><path d='M30 54 L42 68 M44 54 L56 68 M58 54 L70 68 M72 54 L84 68' stroke='var(--text2)' stroke-width='2.5'/></g>" +
    "<g class='ka-m ka-tw'><path d='M106 40 A14 14 0 0 1 106 82' stroke='var(--amber)' stroke-width='3' fill='none' stroke-dasharray='4 4'/></g>");
  var finger = function (x, y, a, cls) { return "<g class='" + cls + "' style='transform-origin:" + x + "px " + y + "px'><rect x='" + (x - 5) + "' y='" + (y - 34) + "' width='10' height='34' rx='5' fill='" + SK + "' transform='rotate(" + a + " " + x + " " + y + ")'/></g>"; };
  SV.spread = svg("<path d='M36 112 L36 74 Q36 60 60 60 Q84 60 84 74 L84 112 Z' fill='" + SK + "'/>" +
    finger(42, 64, -6, "ka-m ka-f1") + finger(54, 60, -2, "ka-m ka-f2") + finger(66, 60, 2, "ka-m ka-f3") + finger(78, 64, 6, "ka-m ka-f4") +
    "<ellipse class='ka-band' cx='60' cy='44' rx='26' ry='6' fill='none' stroke='#f2994a' stroke-width='3'/>");
  var hand = function (cls, d) { return "<g class='ka-g " + cls + "'><path d='" + d + "' stroke='" + SK + "' stroke-width='14' fill='none' stroke-linecap='round' stroke-linejoin='round'/></g>"; };
  SV.glide = svg("<rect x='14' y='70' width='40' height='16' rx='8' fill='" + SK + "'/>" +
    hand("ka-g1", "M50 78 L108 78") + hand("ka-g2", "M50 78 L80 78 L80 92 L70 96") + hand("ka-g3", "M50 78 L74 78 Q86 80 80 92 L66 92") +
    hand("ka-g4", "M50 78 L78 78 L104 98") + hand("ka-g5", "M50 78 L82 78 L82 96 L62 96"));
  SV.vor = svg("<circle cx='60' cy='14' r='7' fill='var(--amber)'/><g class='ka-m ka-hd'><ellipse cx='35' cy='80' rx='5' ry='9' fill='#b07a52'/><ellipse cx='85' cy='80' rx='5' ry='9' fill='#b07a52'/><circle cx='60' cy='80' r='24' fill='#c88f66'/><path d='M60 46 L52 60 L68 60 Z' fill='#b07a52'/><path d='M40 70 Q60 52 80 70' stroke='#3a2a20' stroke-width='5' fill='none'/></g>" +
    "<line x1='60' y1='22' x2='60' y2='64' stroke='var(--amber)' stroke-width='2' stroke-dasharray='3 4'/>" +
    "<text x='60' y='116' text-anchor='middle' font-size='10' font-weight='700' fill='var(--text2)'>vue du dessus</text>");
  SV.count = svg("<text class='ka-n ka-n1' x='60' y='66' text-anchor='middle' font-size='34' font-weight='800' fill='var(--text2)'>100</text>" +
    "<text class='ka-n ka-n2' x='60' y='66' text-anchor='middle' font-size='34' font-weight='800' fill='var(--text2)'>97</text>" +
    "<text class='ka-n ka-n3' x='60' y='66' text-anchor='middle' font-size='34' font-weight='800' fill='var(--text2)'>94</text>" +
    "<text class='ka-n ka-n4' x='60' y='66' text-anchor='middle' font-size='34' font-weight='800' fill='var(--text2)'>91</text>" +
    "<text x='60' y='96' text-anchor='middle' font-size='12' font-weight='700' fill='var(--amber)'>− 3</text>");
  var A = {
    "Élévation du bassin sur une marche": { k: "hike", t: "Le bassin descend puis remonte côté libre", map: { down: "down", up: "up", mid: "mid" } },
    "Relevé des orteils dos au mur": { k: "tib", t: "L'avant du pied monte, talons au sol", map: { up: "up", down: "down" } },
    "Yoga des orteils": { k: "toeyoga", t: "Un orteil, puis les quatre autres", map: { big: "big", small: "small", flat: "flat" } },
    "Pont isométrique talons qui tirent": { k: "heelpull", t: "Les talons tirent vers les fesses, sans bouger", map: { hold: "push", rest: "rest" } },
    "Bascule du bassin couché": { k: "tilt", t: "Le creux du dos s'efface", map: { flat: "up", neutral: "flat" } },
    "Torsion de serviette": { k: "twist", t: "On tord, puis on détord lentement", map: { twist: "twist", flat: "flat" } },
    "Ouverture des doigts contre un élastique": { k: "spread", t: "Les doigts s'écartent contre l'élastique", map: { open: "open", closed: "closed" } },
    "Excentrique du poignet paume vers le haut": { k: "wristx", t: "Paume vers le haut : montée aidée, descente lente", map: { up: "up", top: "up", down: "down" } },
    "Glissements des tendons des doigts": { k: "glide", t: "Cinq positions de la main", map: { p1: "p1", p2: "p2", p3: "p3", p4: "p4", p5: "p5" } },
    "Endurance des fléchisseurs du cou": { k: "chin", t: "Menton rentré, la tête se décolle à peine", map: { lift: "in", rest: "out" } },
    "Regard fixe en tournant la tête": { k: "vor", t: "La tête tourne, les yeux restent sur la cible", map: { l: "l", r: "r", c: "c" } },
    "Marche en tournant la tête": { k: "vor", t: "On marche en tournant la tête", map: { kL: "l", kR: "r", up: "c" } },
    "Équilibre en double tâche": { k: "count", t: "À rebours de 3 en 3, sur une jambe", map: { n1: "n1", n2: "n2", n3: "n3", n4: "n4" } },
    "Pompe des omoplates sur les genoux": { k: "scapula", t: "Les omoplates se rapprochent, puis s'écartent", map: { sag: "in", plus: "out", up: "mid" } }
  };
  for (var k in A) AD[k] = A[k];
})();
