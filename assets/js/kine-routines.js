/* ═══════════════════════════════════════════════════════════════
   KinéForce — Échauffements et étirements guidés
   Chaque routine est découpée en étapes chronométrées (tirées des fiches),
   annoncées à voix haute, avec l'avatar et, si besoin, une aide visuelle
   (respiration, omoplates, nombril, grandissement, poignets).
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var L = KineAvatar.lib, merge = L.merge, STAND = L.STAND, step = L.step;
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function loop() { var a = []; for (var i = 0; i < arguments.length; i += 2) a.push(step(arguments[i], arguments[i + 1])); return a; }

  /* ════════ 1. MOUVEMENTS DE L'AVATAR ════════
     Même format que kine-avatar.js ; `loop` = cycle joué en boucle pendant l'étape */
  var ARMS_DOWN = { LA: { ang: [4, 7, 0, 10] }, RA: { ang: [4, 7, 0, 10] } };
  var SEATED = { pelvis: { p: [0, 0.5, -0.05], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
                 L: { ang: [90, 6, 0, 90, 0] }, R: { ang: [90, 6, 0, 90, 0] } };
  var SUPINE_BENT = merge({ pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0 }, L.SUPINE_FEET);
  var HANDS_BELLY = { LA: { hand: { at: [0.09, 0.27, -0.14], pole: [1, 0.3, 0] } }, RA: { hand: { at: [-0.09, 0.27, -0.14], pole: [-1, 0.3, 0] } } };
  var HAND_WALL_R = { RA: { hand: { at: [-0.52, 1.1, 0.05], pole: [-0.3, -1, -0.4] } } };
  var HANDS_WALL_FRONT = { LA: { hand: { at: [0.22, 1.3, 0.54], pole: [0.5, -1, -0.3] } }, RA: { hand: { at: [-0.22, 1.3, 0.54], pole: [-0.5, -1, -0.3] } } };
  var ONE_LEG = { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0, R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } } };
  function fk(pelvisY, legL, legR, armL, armR, extra) {
    return merge({ pelvis: { p: [0, pelvisY, 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0,
                   L: { ang: legL }, R: { ang: legR }, LA: { ang: armL }, RA: { ang: armR } }, extra || {});
  }
  function circle(base, dx, dz) { // bassin qui décrit un cercle (4 poses)
    return [[dx, -dz * 0], [0, -dz], [-dx, 0], [0, dz]].map(function (o, i) {
      var p = JSON.parse(JSON.stringify(base)); p.pelvis.p[0] += [dx, 0, -dx, 0][i]; p.pelvis.p[2] += [0, -dz, 0, dz][i];
      ["LA", "RA"].forEach(function (k) { if (p[k] && p[k].hand) { p[k].hand.at[0] += [dx, 0, -dx, 0][i]; p[k].hand.at[2] += [0, -dz, 0, dz][i]; } });
      return p;
    });
  }
  var HIP_BASE = merge(STAND(0.13, 8), { LA: { hand: { at: [0.19, 0.99, 0.0], pole: [1, 0, -0.6] } }, RA: { hand: { at: [-0.19, 0.99, 0.0], pole: [-1, 0, -0.6] } } });
  var hipC = circle(HIP_BASE, 0.06, 0.06);
  var KNEE_BASE = merge(STAND(0.07, 0), { pelvis: { p: [0, 0.84, -0.06], r: [15, 0, 0] }, spine: [20, 0, 0], head: -15,
                  LA: { hand: { at: [0.09, 0.56, 0.2], pole: [1, 0, -0.5] } }, RA: { hand: { at: [-0.09, 0.56, 0.2], pole: [-1, 0, -0.5] } } });
  var kneeC = circle(KNEE_BASE, 0.035, 0.035);
  var CHILD = { pelvis: { p: [0, 0.286, -0.381], r: [110, 0, 0] }, spine: [8, 0, 0], head: 10,
                L: { ang: [170, 4, 0, 150, -60] }, R: { ang: [170, 4, 0, 150, -60] },
                LA: { hand: { at: [0.25, 0.047, 0.66], pole: [0.3, 1, 0] } }, RA: { hand: { at: [-0.25, 0.047, 0.66], pole: [-0.3, 1, 0] } } };
  var SAVASANA = { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
                   L: { ang: [0, 8, 15, 0, -20] }, R: { ang: [0, 8, 15, 0, -20] }, LA: { ang: [0, 22, 0, 5] }, RA: { ang: [0, 22, 0, 5] } };
  var CAM_LYING = { yaw: 1.2, pitch: 0.4, dist: 3.5, ty: 0.25, tz: 0 };
  var CAM_FLOOR_SIDE = { yaw: 1.25, pitch: 0.3, dist: 3.6, ty: 0.3, tz: 0.2 };

  var MOVES = {
    "march": { camera: { yaw: 0.9 }, start: "a", poses: {
      a: fk(0.93, [55, 3, 0, 75, 0], [0, 3, 0, 4, 0], [-20, 7, 0, 25], [25, 7, 0, 25]),
      b: fk(0.93, [0, 3, 0, 4, 0], [55, 3, 0, 75, 0], [25, 7, 0, 25], [-20, 7, 0, 25]) }, loop: loop("a", 0.55, "b", 0.55) },
    "highKnees": { camera: { yaw: 0.9 }, start: "a", poses: {
      a: fk(0.93, [88, 3, 0, 100, 0], [0, 3, 0, 4, 0], [-30, 7, 0, 60], [40, 7, 0, 60]),
      b: fk(0.93, [0, 3, 0, 4, 0], [88, 3, 0, 100, 0], [40, 7, 0, 60], [-30, 7, 0, 60]) }, loop: loop("a", 0.6, "b", 0.6) },
    "ankleSeated": { camera: { yaw: 1.2, ty: 0.55 }, props: ["chair"], chair: { z: 0.3 }, start: "up", aid: "ankle", poses: {
      up: merge(SEATED, { L: { ang: [90, 6, 0, 90, 22] }, R: { ang: [90, 6, 0, 90, 22] },
                          LA: { hand: { at: [0.15, 0.58, 0.2], pole: [1, 0, -0.5] } }, RA: { hand: { at: [-0.15, 0.58, 0.2], pole: [-1, 0, -0.5] } } }),
      down: merge(SEATED, { L: { ang: [90, 6, 0, 90, -30] }, R: { ang: [90, 6, 0, 90, -30] },
                            LA: { hand: { at: [0.15, 0.58, 0.2], pole: [1, 0, -0.5] } }, RA: { hand: { at: [-0.15, 0.58, 0.2], pole: [-1, 0, -0.5] } } }) },
      loop: loop("up", 0.8, "down", 0.8) },
    "legSwingFB": { sides: true, camera: { yaw: 1.1 }, props: ["wallSide"], start: "a", poses: {
      a: merge(ONE_LEG, HAND_WALL_R, { L: { ang: [38, 3, 0, 6, 0] }, LA: { ang: [-15, 12, 0, 20] } }),
      b: merge(ONE_LEG, HAND_WALL_R, { L: { ang: [-22, 3, 0, 4, 0] }, LA: { ang: [25, 12, 0, 20] } }) }, loop: loop("a", 0.8, "b", 0.8) },
    "kneeCircles": { camera: { yaw: 0.7 }, start: "c0", poses: { c0: kneeC[0], c1: kneeC[1], c2: kneeC[2], c3: kneeC[3] },
      loop: loop("c0", 0.7, "c1", 0.7, "c2", 0.7, "c3", 0.7) },
    "miniSquat": { camera: { yaw: 0.8 }, start: "up", poses: {
      up: merge(STAND(0.13, 10), { LA: { ang: [50, 8, 0, 20] }, RA: { ang: [50, 8, 0, 20] } }),
      down: merge(STAND(0.13, 10), { pelvis: { p: [0, 0.8, -0.1], r: [10, 0, 0] }, spine: [8, 0, 0], LA: { ang: [65, 8, 0, 20] }, RA: { ang: [65, 8, 0, 20] } }) },
      loop: loop("down", 0.9, "up", 0.9) },
    "hipCircles": { camera: { yaw: 0.6 }, start: "c0", poses: { c0: hipC[0], c1: hipC[1], c2: hipC[2], c3: hipC[3] },
      loop: loop("c0", 0.8, "c1", 0.8, "c2", 0.8, "c3", 0.8) },
    "quadStretch": { sides: true, camera: { yaw: 1.25 }, props: ["wallSide"], start: "hold", poses: {
      hold: merge(ONE_LEG, HAND_WALL_R, { L: { ang: [-8, 3, 0, 140, -20] }, LA: { hand: { at: [0.13, 0.66, -0.22], pole: [0.4, 0, -1] } } }) },
      loop: loop("hold", 3) },
    "hamSeated": { sides: true, camera: { yaw: 1.3, pitch: 0.3, dist: 3.4, ty: 0.3, tz: 0.2 }, start: "hold", poses: {
      hold: { pelvis: { p: [0, 0.14, 0], r: [30, 0, 0] }, spine: [22, 0, 0], head: 10,
              L: { ang: [120, 4, 0, 0, 10] }, R: { ang: [100, 40, 40, 125, 0] },
              LA: { hand: { at: [0.12, 0.2, 0.7], pole: [0.3, 1, 0] } }, RA: { hand: { at: [-0.02, 0.2, 0.66], pole: [-0.3, 1, 0] } } } },
      loop: loop("hold", 3) },
    "calfWall": { sides: true, camera: { yaw: 1.3 }, props: ["wall"], start: "hold", poses: {
      hold: merge({ pelvis: { p: [0, "auto", 0.02], r: [12, 0, 0] }, spine: [6, 0, 0], head: 0,
                    L: { foot: { at: [0.1, 0, 0.42], yaw: 0 } }, R: { foot: { at: [-0.1, 0, -0.38], yaw: 0 } } }, HANDS_WALL_FRONT) },
      loop: loop("hold", 3) },
    "figure4": { sides: true, camera: { yaw: 0.7, pitch: 0.55, dist: 3.2, ty: 0.25, tz: 0.1 }, start: "hold", poses: {
      hold: { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
              L: { ang: [95, 0, 0, 90, 0] }, R: { ang: [75, 35, 60, 100, 0] },
              LA: { hand: { at: [0.13, 0.46, 0.16], pole: [1, 0.2, 0] } }, RA: { hand: { at: [-0.05, 0.47, 0.16], pole: [-1, 0.2, 0] } } } },
      loop: loop("hold", 3) },
    "breathSupine": { camera: CAM_LYING, start: "hold", aid: "breath", poses: { hold: merge(SUPINE_BENT, HANDS_BELLY) }, loop: loop("hold", 3) },
    "breathTransverse": { camera: CAM_LYING, start: "hold", aid: "navel", poses: { hold: merge(SUPINE_BENT, HANDS_BELLY) }, loop: loop("hold", 3) },
    "pendulum": { camera: { yaw: 1.1 }, start: "c0", poses: (function () {
      var base = merge(STAND(0.14, 8), { pelvis: { p: [0, "auto", -0.1], r: [25, 0, 0] }, spine: [20, 0, 0], head: -10 });
      var o = {}; [[60, 0], [45, 16], [30, 0], [45, -12]].forEach(function (a, i) {
        o["c" + i] = merge(base, { LA: { ang: [a[0], 8 + a[1], 0, 5] }, RA: { ang: [a[0], 8 + a[1], 0, 5] } }); });
      return o; })(), loop: loop("c0", 0.7, "c1", 0.7, "c2", 0.7, "c3", 0.7) },
    "scapula": { camera: { yaw: 3.0, pitch: 0.12, ty: 1.15, dist: 3.2 }, start: "out", aid: "scapula", poses: {
      out: merge(STAND(0.12, 0), { LA: { ang: [25, 8, 0, 90] }, RA: { ang: [25, 8, 0, 90] } }),
      in:  merge(STAND(0.12, 0), { LA: { ang: [-22, 14, 0, 90] }, RA: { ang: [-22, 14, 0, 90] } }) },
      loop: loop("in", 1.5, "out", 1.5) },
    "shoulderCircles": { camera: { yaw: 1.0 }, start: "c0", poses: {
      c0: merge(STAND(0.12, 0), { LA: { ang: [5, 8, 0, 0] }, RA: { ang: [5, 8, 0, 0] } }),
      c1: merge(STAND(0.12, 0), { LA: { ang: [90, 8, 0, 0] }, RA: { ang: [90, 8, 0, 0] } }),
      c2: merge(STAND(0.12, 0), { LA: { ang: [172, 8, 0, 0] }, RA: { ang: [172, 8, 0, 0] } }),
      c3: merge(STAND(0.12, 0), { LA: { ang: [20, 85, 0, 0] }, RA: { ang: [20, 85, 0, 0] } }) },
      loop: loop("c0", 0.6, "c1", 0.6, "c2", 0.6, "c3", 0.6) },
    "wristElbow": { camera: { yaw: 0.9 }, start: "a", aid: "wrist", poses: {
      a: merge(STAND(0.12, 0), { LA: { ang: [90, 6, 0, 0] }, RA: { ang: [90, 6, 0, 0] } }),
      b: merge(STAND(0.12, 0), { LA: { ang: [75, 6, 0, 120] }, RA: { ang: [75, 6, 0, 120] } }) },
      loop: loop("b", 1, "a", 1) },
    "wallPushup": { camera: { yaw: 1.3 }, props: ["wall"], start: "up", poses: {
      up: merge({ pelvis: { p: [0, "auto", -0.12], r: [16, 0, 0] }, spine: [0, 0, 0], head: 0,
                  L: { foot: { at: [0.12, 0, -0.3], yaw: 0, lift: 12 } }, R: { foot: { at: [-0.12, 0, -0.3], yaw: 0, lift: 12 } } },
                { LA: { hand: { at: [0.26, 1.28, 0.54], pole: [0.8, -0.3, -0.6] } }, RA: { hand: { at: [-0.26, 1.28, 0.54], pole: [-0.8, -0.3, -0.6] } } }),
      down: merge({ pelvis: { p: [0, "auto", 0.05], r: [26, 0, 0] }, spine: [0, 0, 0], head: 0,
                    L: { foot: { at: [0.12, 0, -0.3], yaw: 0, lift: 30 } }, R: { foot: { at: [-0.12, 0, -0.3], yaw: 0, lift: 30 } } },
                  { LA: { hand: { at: [0.26, 1.28, 0.54], pole: [0.8, -0.3, -0.6] } }, RA: { hand: { at: [-0.26, 1.28, 0.54], pole: [-0.8, -0.3, -0.6] } } }) },
      loop: loop("down", 2, "up", 1.5) },
    "pecWall": { sides: true, labelSwap: true, camera: { yaw: 0.6 }, props: ["wallSide"], start: "hold", poses: {
      hold: merge(STAND(0.12, 0), { spine: [0, 0, -18], RA: { hand: { at: [-0.6, 1.62, 0.02], pole: [0, -1, 0.2] } } }) },
      loop: loop("hold", 3) },
    "triceps": { sides: true, camera: { yaw: 2.4, ty: 1.2, dist: 3.3 }, start: "hold", poses: {
      hold: merge(STAND(0.12, 0), { LA: { ang: [172, 8, 0, 150] }, RA: { hand: { at: [0.08, 1.72, -0.02], pole: [-1, 0, 0.3] } } }) },
      loop: loop("hold", 3) },
    "neckElongation": { camera: { yaw: 1.2, ty: 0.9 }, props: ["chair"], chair: { z: 0.3 }, start: "hold", aid: "grow", poses: {
      hold: merge(SEATED, { spine: [-2, 0, 0], head: 6, LA: { hand: { at: [0.15, 0.58, 0.2], pole: [1, 0, -0.5] } }, RA: { hand: { at: [-0.15, 0.58, 0.2], pole: [-1, 0, -0.5] } } }) },
      loop: loop("hold", 3) },
    "childPose": { camera: CAM_FLOOR_SIDE, start: "hold", poses: { hold: CHILD }, loop: loop("hold", 3) },
    // Vache (inspiration) : bascule antérieure du bassin + lordose lombaire, regard devant
    // Chat (expiration) : rétroversion du bassin + cyphose lombaire, tête rentrée
    "catCow": { camera: { yaw: 1.45, pitch: 0.18, dist: 3.6, ty: 0.45, tz: 0.2 }, start: "cow", aid: "spine", poses: {
      cat: merge(L.QUAD, { pelvis: { p: [0, 0.506, 0], r: [93, 0, 0] }, spine: [-11, 0, 0], head: 28, curve: 1, L: { ang: [93, 3, 0, 90, -60] }, R: { ang: [93, 3, 0, 90, -60] } }),
      cow: merge(L.QUAD, { pelvis: { p: [0, 0.506, 0], r: [67, 0, 0] }, spine: [13, 0, 0], head: -30, curve: -1, L: { ang: [67, 3, 0, 90, -60] }, R: { ang: [67, 3, 0, 90, -60] } }) },
      loop: loop("cow", 4, "cat", 4) },
    "trunkRotSeated": { camera: { yaw: 0.5, ty: 0.85 }, props: ["chair"], chair: { z: 0.3 }, start: "l", poses: {
      l: merge(SEATED, { spine: [0, 0, 38], headY: 15, LA: { ang: [60, -35, 0, 125] }, RA: { ang: [60, -35, 0, 125] } }),
      r: merge(SEATED, { spine: [0, 0, -38], headY: -15, LA: { ang: [60, -35, 0, 125] }, RA: { ang: [60, -35, 0, 125] } }) },
      loop: loop("l", 2, "r", 2) },
    "cobra": { camera: CAM_FLOOR_SIDE, start: "hold", poses: {
      hold: { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [-35, 0, 0], head: -15,
              L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] },
              LA: { hand: { at: [0.25, 0.047, 0.42], pole: [0.6, 0.3, -1] } }, RA: { hand: { at: [-0.25, 0.047, 0.42], pole: [-0.6, 0.3, -1] } } } },
      loop: loop("hold", 3) },
    "lumbarTwist": { sides: true, camera: { yaw: 0.2, pitch: 0.6, dist: 3.3, ty: 0.2, tz: -0.1 }, start: "hold", poses: {
      // Genoux serrés qui basculent d'un côté, épaules à plat
      hold: { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0, headY: -20,
              L: { ang: [80, 55, 0, 100, 0] }, R: { ang: [80, -45, 0, 100, 0] }, LA: { ang: [0, 85, 0, 0] }, RA: { ang: [0, 85, 0, 0] } } },
      loop: loop("hold", 3) },
    "abdWall": { sides: true, camera: { yaw: 0.12, pitch: 0.12, dist: 4.1, ty: 0.85 }, props: ["wallSide"], start: "down", poses: {
      down: merge(ONE_LEG, HAND_WALL_R, { L: { ang: [0, 3, 0, 0, 0] }, LA: { ang: [4, 7, 0, 10] } }),
      up: merge(ONE_LEG, HAND_WALL_R, { L: { ang: [0, 32, 0, 0, 0] }, LA: { ang: [4, 7, 0, 10] } }) },
      loop: loop("up", 1, "down", 1) },
    "legSwingLat": { sides: true, camera: { yaw: 0.2 }, props: ["wallSide"], start: "a", poses: {
      a: merge(ONE_LEG, HAND_WALL_R, { L: { ang: [5, 28, 0, 4, 0] }, LA: { ang: [4, 12, 0, 10] } }),
      b: merge(ONE_LEG, HAND_WALL_R, { L: { ang: [14, -16, 0, 4, 0] }, LA: { ang: [4, 12, 0, 10] } }) }, loop: loop("a", 0.8, "b", 0.8) },
    "hipRotSupine": { camera: { yaw: 0.25, pitch: 0.6, dist: 3.3, ty: 0.2, tz: 0.2 }, start: "l", poses: {
      l: merge(SUPINE_BENT, L.SUPINE_HANDS, { L: { foot: { at: [0.13, 0, 0.74], yaw: 0, pole: [0.9, 0.5, 0] } }, R: { foot: { at: [-0.13, 0, 0.74], yaw: 0, pole: [0.9, 0.5, 0] } } }),
      r: merge(SUPINE_BENT, L.SUPINE_HANDS, { L: { foot: { at: [0.13, 0, 0.74], yaw: 0, pole: [-0.9, 0.5, 0] } }, R: { foot: { at: [-0.13, 0, 0.74], yaw: 0, pole: [-0.9, 0.5, 0] } } }) },
      loop: loop("l", 1.5, "r", 1.5) },
    "lowLunge": { sides: true, camera: { yaw: 1.3, pitch: 0.2, dist: 3.8, ty: 0.45, tz: 0.3 }, start: "hold", poses: {
      hold: { pelvis: { p: [0, 0.42, 0.28], r: [0, 0, 0] }, spine: [-4, 0, 0], head: 0,
              L: { foot: { at: [0.1, 0, 0.8], yaw: 0 } }, R: { ang: [-38, 3, 0, 52, -80] },
              LA: { hand: { at: [0.14, 0.56, 0.6], pole: [0.8, -0.2, -0.5] } }, RA: { hand: { at: [0.02, 0.56, 0.6], pole: [-0.8, -0.2, -0.5] } } } },
      loop: loop("hold", 3) },
    "adductorSeated": { camera: { yaw: 0.35, pitch: 0.45, dist: 3.4, ty: 0.25, tz: 0.2 }, start: "hold", poses: {
      hold: { pelvis: { p: [0, 0.14, 0], r: [12, 0, 0] }, spine: [12, 0, 0], head: 0,
              L: { ang: [100, 36, 0, 0, 10] }, R: { ang: [100, 36, 0, 0, 10] },
              LA: { hand: { at: [0.16, 0.047, 0.38], pole: [0.6, 0.4, -0.6] } }, RA: { hand: { at: [-0.16, 0.047, 0.38], pole: [-0.6, 0.4, -0.6] } } } },
      loop: loop("hold", 3) },
    "jacks": { camera: { yaw: 0.25 }, start: "a", poses: {
      a: fk(0.945, [0, 2, 0, 3, 0], [0, 2, 0, 3, 0], [4, 7, 0, 5], [4, 7, 0, 5]),
      b: fk(0.915, [0, 15, 0, 3, 0], [0, 15, 0, 3, 0], [10, 165, 0, 5], [10, 165, 0, 5]) }, loop: loop("b", 0.9, "a", 0.9) },
    "ankleCircles": { sides: true, camera: { yaw: 0.9 }, start: "c0", poses: (function () {
      var o = {}; [[20, 0], [0, 15], [-25, 0], [0, -15]].forEach(function (a, i) {
        o["c" + i] = merge(ONE_LEG, { L: { ang: [25, 3 + a[1], 0, 35, a[0]] }, LA: { ang: [4, 20, 0, 10] }, RA: { ang: [4, 20, 0, 10] } }); });
      return o; })(), loop: loop("c0", 0.5, "c1", 0.5, "c2", 0.5, "c3", 0.5) },
    "trunkRot": { camera: { yaw: 0.5 }, start: "l", poses: {
      l: merge(STAND(0.16, 8), { spine: [2, 0, 40], headY: 15, LA: { ang: [80, 30, 0, 110] }, RA: { ang: [80, 30, 0, 110] } }),
      r: merge(STAND(0.16, 8), { spine: [2, 0, -40], headY: -15, LA: { ang: [80, 30, 0, 110] }, RA: { ang: [80, 30, 0, 110] } }) },
      loop: loop("l", 1.2, "r", 1.2) },
    "neckRot": { camera: { yaw: 0.35, ty: 1.3, dist: 2.6 }, start: "c", poses: {
      l: merge(STAND(0.12, 0), { headY: 50 }), c: merge(STAND(0.12, 0), { head: 18 }),
      r: merge(STAND(0.12, 0), { headY: -50 }), u: merge(STAND(0.12, 0), { head: -12 }) },
      loop: loop("l", 1.2, "c", 1.2, "r", 1.2, "u", 1.2) },
    "bigBreaths": { camera: { yaw: 0.3 }, start: "down", aid: "breath", poses: {
      down: merge(STAND(0.12, 0), ARMS_DOWN),
      up: merge(STAND(0.12, 0), { head: -8, LA: { ang: [10, 165, 0, 5] }, RA: { ang: [10, 165, 0, 5] } }) },
      loop: loop("up", 4, "down", 4) },
    "savasana": { camera: { yaw: 0.9, pitch: 0.55, dist: 3.6, ty: 0.15, tz: -0.1 }, start: "hold", poses: { hold: SAVASANA }, loop: loop("hold", 3) }
  };
  Object.keys(MOVES).forEach(function (k) { KineAvatar.register("move:" + k, MOVES[k]); });

  /* ════════ 2. ROUTINES (d'après les fiches) ════════
     { name, dur (s), move, sides (moitié de chaque côté), cue, aid, breath: [inspiration, expiration] } */
  var R = {
    "Mobilisation articulaire progressive": [
      { name: "Marche sur place, rythme croissant", dur: 50, move: "march", cue: "Commencez doucement, puis accélérez progressivement." },
      { name: "Flexions-extensions des chevilles, assis", dur: 25, move: "ankleSeated", cue: "Pointes de pied vers vous, puis vers le sol." },
      { name: "Leg swings avant / arrière, appui au mur", dur: 30, move: "legSwingFB", sides: true, cue: "Balancez la jambe d'avant en arrière, buste droit." },
      { name: "Rotations des genoux, debout", dur: 25, move: "kneeCircles", cue: "Pieds joints, mains sur les genoux, petits cercles." },
      { name: "Squats dynamiques à faible amplitude", dur: 25, move: "miniSquat", cue: "Petite flexion, talons au sol, rythme régulier." },
      { name: "Rotations de hanches", dur: 25, move: "hipCircles", cue: "Mains sur les hanches, grands cercles avec le bassin." }],
    "Étirements membres inférieurs": [
      { name: "Étirement des quadriceps, debout", dur: 80, move: "quadStretch", sides: true, cue: "Talon vers la fesse, genoux serrés, main sur le mur." },
      { name: "Ischio-jambiers, assis jambe tendue", dur: 80, move: "hamSeated", sides: true, cue: "Dos droit, penchez-vous vers le pied sans forcer." },
      { name: "Mollets en fente basse contre le mur", dur: 60, move: "calfWall", sides: true, cue: "Jambe arrière tendue, talon au sol." },
      { name: "Rotation de hanche en figure 4", dur: 60, move: "figure4", sides: true, cue: "Cheville sur le genou opposé, tirez la cuisse vers vous." },
      { name: "Respiration diaphragmatique de clôture", dur: 120, move: "breathSupine", breath: [4, 6], cue: "Le ventre se gonfle à l'inspiration, se vide à l'expiration." }],
    "Mobilisation membres supérieurs": [
      { name: "Pendules des bras en cercles progressifs", dur: 45, move: "pendulum", cue: "Buste penché, bras relâchés : petits cercles qui s'agrandissent." },
      { name: "Rétropulsion et antépulsion des omoplates", dur: 25, move: "scapula", cue: "Serrez les omoplates vers la colonne, puis écartez-les." },
      { name: "Rotations dynamiques des épaules", dur: 25, move: "shoulderCircles", cue: "Grands cercles de bras, sans forcer en haut." },
      { name: "Flexions-extensions des poignets et des coudes", dur: 25, move: "wristElbow", cue: "Pliez et tendez les coudes, puis les poignets." },
      { name: "10 pompes contre le mur, rythme lent", dur: 60, move: "wallPushup", cue: "Corps aligné, descente lente vers le mur." }],
    "Étirements membres supérieurs": [
      { name: "Pectoraux contre le mur, coude à 90°", dur: 80, move: "pecWall", sides: true, cue: "Avant-bras sur le mur, tournez le buste à l'opposé." },
      { name: "Triceps, coude derrière la tête", dur: 60, move: "triceps", sides: true, cue: "L'autre main pousse doucement le coude." },
      { name: "Auto-agrandissement cervical, assis", dur: 60, move: "neckElongation", cue: "Grandissez-vous comme si un fil tirait le sommet du crâne." },
      { name: "Position de l'enfant, bras tendus", dur: 60, move: "childPose", cue: "Assis sur les talons, front vers le sol, bras loin devant." },
      { name: "Respiration abdominale", dur: 60, move: "breathSupine", breath: [4, 6], cue: "Main sur le ventre : il se gonfle puis se vide." }],
    "Activation transverse et mobilisation": [
      { name: "Respiration diaphragmatique et activation du transverse", dur: 70, move: "breathTransverse", breath: [4, 6], cue: "Inspirez en gonflant le ventre. À l'expiration, rentrez légèrement le nombril." },
      { name: "Chat-vache à quatre pattes", dur: 56, move: "catCow", breath: [4, 4], cue: "Inspirez en creusant le bas du dos (bassin basculé vers l'avant, regard devant). Expirez en arrondissant le bas du dos (bassin rentré, tête vers le sol)." },
      { name: "Rotations du tronc, assis", dur: 54, move: "trunkRotSeated", cue: "Bras croisés, tournez le buste à droite puis à gauche, bassin immobile." }],
    "Étirements rachidiens et cohérence cardiaque": [
      { name: "Cobra allongé", dur: 30, move: "cobra", cue: "Bassin au sol, poussez sur les mains, épaules basses." },
      { name: "Torsion lombaire, allongé sur le dos", dur: 80, move: "lumbarTwist", sides: true, cue: "Genoux vers le sol d'un côté, épaules à plat." },
      { name: "Position de l'enfant, bras tendus", dur: 60, move: "childPose", cue: "Assis sur les talons, front vers le sol, bras loin devant." },
      { name: "Cohérence cardiaque", dur: 180, move: "breathSupine", breath: [5, 5], cue: "Inspirez 5 secondes, expirez 5 secondes, en suivant le cercle." }],
    "Activation ceinture pelvienne": [
      { name: "Cercles de hanches, amplitude progressive", dur: 50, move: "hipCircles", cue: "Mains sur les hanches, cercles de plus en plus grands." },
      { name: "Abduction de hanche alternée, contre le mur", dur: 30, move: "abdWall", sides: true, cue: "Jambe tendue sur le côté, buste droit." },
      { name: "Leg swings latéraux", dur: 30, move: "legSwingLat", sides: true, cue: "Mains au mur, balancez la jambe de côté." },
      { name: "Rotations de hanche, allongé sur le dos", dur: 35, move: "hipRotSupine", cue: "Genoux fléchis, laissez-les basculer d'un côté puis de l'autre." },
      { name: "Marche genoux hauts, élévation exagérée", dur: 35, move: "highKnees", cue: "Montez les genoux haut, bras coordonnés." }],
    "Étirements fessiers et iliopsoas": [
      { name: "Figure 4 en décubitus", dur: 90, move: "figure4", sides: true, cue: "Cheville sur le genou opposé, tirez la cuisse vers vous." },
      { name: "Fente basse au sol pour l'iliopsoas", dur: 80, move: "lowLunge", sides: true, cue: "Genou arrière au sol, avancez le bassin, buste droit." },
      { name: "Demi-grand écart assis, adducteurs", dur: 40, move: "adductorSeated", cue: "Jambes écartées, dos droit, penchez-vous légèrement." },
      { name: "Respiration abdominale de clôture", dur: 60, move: "breathSupine", breath: [4, 6], cue: "Le ventre se gonfle à l'inspiration, se vide à l'expiration." }],
    "Échauffement global progressif": [
      { name: "Marche sur place genoux hauts, rythme croissant", dur: 45, move: "highKnees", cue: "Commencez doucement, puis accélérez." },
      { name: "Jumping jacks à rythme modéré", dur: 35, move: "jacks", cue: "Écartez pieds et bras ensemble, sans sauter si besoin." },
      { name: "Rotations des chevilles", dur: 10, move: "ankleCircles", sides: true, cue: "Petits cercles avec le pied." },
      { name: "Rotations des genoux", dur: 10, move: "kneeCircles", cue: "Mains sur les genoux, petits cercles." },
      { name: "Rotations des hanches", dur: 10, move: "hipCircles", cue: "Mains sur les hanches, grands cercles." },
      { name: "Rotations du tronc", dur: 10, move: "trunkRot", cue: "Tournez le buste d'un côté puis de l'autre." },
      { name: "Rotations des épaules", dur: 10, move: "shoulderCircles", cue: "Grands cercles de bras." },
      { name: "Rotations de la nuque", dur: 10, move: "neckRot", cue: "Lentement, sans forcer en arrière." },
      { name: "5 grandes respirations de préparation", dur: 40, move: "bigBreaths", breath: [4, 4], cue: "Levez les bras en inspirant, descendez-les en expirant." }],
    "Étirements globaux et Savasana": [
      { name: "Étirement des quadriceps", dur: 30, move: "quadStretch", sides: true, cue: "Talon vers la fesse, main sur le mur." },
      { name: "Étirement des ischio-jambiers", dur: 30, move: "hamSeated", sides: true, cue: "Jambe tendue, dos droit." },
      { name: "Étirement des mollets", dur: 30, move: "calfWall", sides: true, cue: "Jambe arrière tendue, talon au sol." },
      { name: "Étirement des fessiers (figure 4)", dur: 30, move: "figure4", sides: true, cue: "Cheville sur le genou opposé." },
      { name: "Étirement des pectoraux", dur: 30, move: "pecWall", sides: true, cue: "Avant-bras sur le mur, buste tourné à l'opposé." },
      { name: "Étirement du dos (position de l'enfant)", dur: 30, move: "childPose", cue: "Assis sur les talons, bras loin devant." },
      { name: "Savasana", dur: 300, move: "savasana", cue: "Allongé, respiration libre. Relâchez chaque partie du corps.",
        cues: ["Relâchez les pieds", "Relâchez les mollets", "Relâchez les cuisses", "Relâchez le ventre", "Relâchez le dos", "Relâchez les bras", "Relâchez les épaules", "Relâchez le visage", "Prenez conscience des sensations positives de la séance"] }]
  };

  /* ════════ 3. AIDES VISUELLES ════════ */
  var AIDS = {
    breath: "<svg viewBox='0 0 120 120' width='120' height='120' aria-hidden='true'><circle cx='60' cy='60' r='52' fill='none' stroke='var(--border2)' stroke-width='3'/><circle class='kr-pace' cx='60' cy='60' r='26' fill='rgba(52,211,153,.25)' stroke='var(--green)' stroke-width='3'/></svg>",
    navel: "<svg viewBox='0 0 120 120' width='120' height='120' aria-hidden='true'><circle cx='60' cy='60' r='52' fill='none' stroke='var(--border2)' stroke-width='3'/><circle class='kr-pace' cx='60' cy='60' r='26' fill='rgba(52,211,153,.25)' stroke='var(--green)' stroke-width='3'/><circle cx='60' cy='60' r='5' fill='var(--amber)'/><path class='kr-navel' d='M60 90 L60 72 M52 80 L60 72 L68 80' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round'/></svg>",
    scapula: "<svg viewBox='0 0 140 120' width='140' height='120' aria-hidden='true'><rect x='67' y='8' width='6' height='104' rx='3' fill='var(--text2)'/>" +
             "<g class='kr-scap-l'><path d='M28 22 L58 26 L50 88 Z' fill='rgba(61,142,240,.35)' stroke='var(--blue)' stroke-width='3' stroke-linejoin='round'/></g>" +
             "<g class='kr-scap-r'><path d='M112 22 L82 26 L90 88 Z' fill='rgba(61,142,240,.35)' stroke='var(--blue)' stroke-width='3' stroke-linejoin='round'/></g>" +
             "<path class='kr-arrow' d='M16 58 L36 58 M30 52 L36 58 L30 64 M124 58 L104 58 M110 52 L104 58 L110 64' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round'/></svg>",
    grow: "<svg viewBox='0 0 120 120' width='120' height='120' aria-hidden='true'><circle cx='60' cy='78' r='22' fill='none' stroke='var(--text2)' stroke-width='3'/><path class='kr-grow' d='M60 48 L60 8 M50 18 L60 8 L70 18' stroke='var(--amber)' stroke-width='4' fill='none' stroke-linecap='round'/></svg>",
    wrist: "<svg viewBox='0 0 120 120' width='120' height='120' aria-hidden='true'><rect x='10' y='54' width='60' height='14' rx='7' fill='var(--text2)'/><g class='kr-wrist'><rect x='66' y='50' width='40' height='22' rx='9' fill='#B07A52'/></g><path d='M92 24 A30 30 0 0 1 92 98' stroke='var(--amber)' stroke-width='3' fill='none' stroke-dasharray='5 5'/></svg>",
    spine: "<svg viewBox='0 0 150 110' width='150' height='110' aria-hidden='true'>" +
           "<rect x='8' y='52' width='26' height='34' rx='10' fill='rgba(52,211,153,.25)' stroke='var(--green)' stroke-width='2'/>" +
           "<rect x='98' y='40' width='44' height='30' rx='12' fill='rgba(61,142,240,.2)' stroke='var(--blue)' stroke-width='2'/>" +
           "<path class='kr-lordose' d='M22 58 C 50 82, 80 80, 110 52' stroke='var(--amber)' stroke-width='6' fill='none' stroke-linecap='round'/>" +
           "<path class='kr-cyphose' d='M22 58 C 50 18, 80 16, 110 52' stroke='var(--amber)' stroke-width='6' fill='none' stroke-linecap='round'/>" +
           "<text class='kr-lordose' x='75' y='104' text-anchor='middle' font-size='12' font-weight='700' fill='var(--text2)'>dos creux, inspirez</text>" +
           "<text class='kr-cyphose' x='75' y='104' text-anchor='middle' font-size='12' font-weight='700' fill='var(--text2)'>dos rond, expirez</text></svg>",
    ankle: "<svg viewBox='0 0 120 120' width='120' height='120' aria-hidden='true'><rect x='44' y='8' width='16' height='66' rx='8' fill='var(--text2)'/><g class='kr-ankle'><path d='M40 74 L96 74 Q104 74 104 84 L104 88 L40 88 Z' fill='#e8e8e4'/></g><path d='M104 50 A40 40 0 0 1 104 110' stroke='var(--amber)' stroke-width='3' fill='none' stroke-dasharray='5 5'/></svg>"
  };
  var AID_LABEL = { spine: "Bas du dos (vue de profil)", breath: "Respiration", navel: "Nombril rentré à l'expiration", scapula: "Omoplates vers la colonne", grow: "Grandir", wrist: "Poignets", ankle: "Chevilles" };

  /* ════════ 4. LECTEUR ════════ */
  var P = null; // état du lecteur
  function fmt(t) { t = Math.max(0, Math.ceil(t)); var m = Math.floor(t / 60), s = t % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  function say(t) { if (typeof speak === "function") speak(t); }
  function beep() { if (typeof playBeep === "function") playBeep(520, 0.06, 0.15); }

  function ensureSheet() {
    var el = $("kf-routine");
    if (el) return el;
    el = document.createElement("div"); el.id = "kf-routine"; el.className = "kf-sheet"; el.setAttribute("role", "dialog");
    el.innerHTML =
      "<div class='kf-sheet-body' style='gap:12px'>" +
        "<div class='v2-top'><button class='v2-icon' onclick='KineRoutine.close(false)' aria-label='Quitter'>✕</button>" +
        "<div class='v2-prog'><div class='v2-prog-txt' id='kr-prog'></div><div class='v2-prog-bar'><i id='kr-prog-fill'></i></div></div></div>" +
        "<div class='v2-title' id='kr-title'></div>" +
        "<div class='v2-stage' style='min-height:320px'><div class='rg-phase-label hold' id='kr-label'></div>" +
          "<div id='kr-stage' style='display:flex;justify-content:center;padding-top:30px'></div>" +
          "<div class='kr-aid' id='kr-aid'></div></div>" +
        "<div class='v2-count'><span class='rg-rep-num' id='kr-time'>0:00</span><span class='rg-rep-total' id='kr-total'></span></div>" +
        "<div class='v2-cue' id='kr-cue'></div>" +
        "<div class='kf-sub' id='kr-next'></div>" +
      "</div>" +
      "<div class='kf-sheet-foot'><div class='v2-duo'><button class='v2-btn' id='kr-pause' onclick='KineRoutine.pause()'>Pause</button>" +
        "<button class='v2-btn v2-pain' onclick='KineRoutine.pain()'>J'ai mal</button></div>" +
        "<button class='v2-link' onclick='KineRoutine.next()'>Étape suivante</button></div>";
    document.body.appendChild(el);
    return el;
  }

  function stepAt(i) { return P.steps[i]; }
  function startStep(i) {
    if (i >= P.steps.length) { finish(); return; }
    P.i = i; P.t0 = Date.now(); P.pausedFor = 0; P.side = "L"; P.cueIdx = -1; P.breathPhase = null;
    var st = stepAt(i), mv = MOVES[st.move] || {};
    $("kr-title").textContent = st.name;
    $("kr-cue").textContent = st.cue || "";
    $("kr-prog").textContent = P.kind + ", étape " + (i + 1) + " sur " + P.steps.length;
    $("kr-prog-fill").style.width = Math.round(i / P.steps.length * 100) + "%";
    var nx = stepAt(i + 1);
    $("kr-next").textContent = nx ? "Ensuite : " + nx.name + ", " + fmt(nx.dur) : "Dernière étape";
    var still = mv.loop && mv.loop.length === 1;
    $("kr-label").textContent = st.sides ? "Côté gauche" : (st.breath ? "Inspirez" : (still ? "Tenez la position" : "En mouvement"));
    var aidKey = mv.aid || (st.breath ? "breath" : null);
    var aid = $("kr-aid");
    aid.innerHTML = aidKey ? AIDS[aidKey] + "<div class='kr-aid-t' id='kr-aid-t'>" + AID_LABEL[aidKey] + "</div>" : "";
    aid.style.display = aidKey ? "flex" : "none";
    aid.setAttribute("data-aid", aidKey || "");
    var stage = $("kr-stage");
    if (window.KineAvatar && KineAvatar.show(stage, "move:" + st.move)) { P.loopId = (P.loopId || 0) + 1; runLoop(P.loopId, st); }
    say(st.name + ". " + (st.sides ? "Côté gauche. " : "") + (st.cue || ""));
    beep();
  }
  // Boucle du mouvement (et synchronisation des aides : omoplates, poignets, chevilles)
  function runLoop(id, st) {
    var mv = MOVES[st.move], k = 0;
    (function nextPose() {
      if (!P || P.loopId !== id) return;
      if (P.paused) { setTimeout(nextPose, 200); return; }
      var s0 = mv.loop[k % mv.loop.length]; k++;
      KineAvatar.step({ pose: s0.pose, dur: s0.dur, side: P.side });
      var aid = $("kr-aid"); if (aid) aid.setAttribute("data-phase", s0.pose);
      setTimeout(nextPose, s0.dur * 1000);
    })();
  }
  function tick() {
    if (!P) return;
    if (P.paused) return;
    var st = stepAt(P.i), el = (Date.now() - P.t0 - P.pausedFor) / 1000, left = st.dur - el;
    $("kr-time").textContent = fmt(left);
    var tot = 0; for (var j = P.i; j < P.steps.length; j++) tot += j === P.i ? Math.max(0, left) : P.steps[j].dur;
    $("kr-total").textContent = "· reste " + fmt(tot);
    if (st.sides && P.side === "L" && el >= st.dur / 2) {
      P.side = "R"; $("kr-label").textContent = "Côté droit"; say("Changez de côté"); beep();
      KineAvatar.step({ pose: MOVES[st.move].start, dur: 0.8, side: "R" });
    }
    if (st.breath) { // cycle respiratoire : cercle qui grossit puis se vide
      var cyc = st.breath[0] + st.breath[1], ph = el % cyc, inh = ph < st.breath[0];
      var r = inh ? 26 + 24 * (ph / st.breath[0]) : 50 - 24 * ((ph - st.breath[0]) / st.breath[1]);
      var c = document.querySelector("#kr-aid .kr-pace"); if (c) c.setAttribute("r", r.toFixed(1));
      var ph2 = inh ? "Inspirez" : "Expirez";
      if (P.breathPhase !== ph2) {
        P.breathPhase = ph2; $("kr-label").textContent = ph2;
        $("kr-aid").setAttribute("data-phase", inh ? "in" : "out");
        if (el < 60 || Math.floor(el / cyc) % 3 === 0) say(ph2);
      }
    }
    if (st.cues) {
      var ci = Math.min(st.cues.length - 1, Math.floor(el / (st.dur / st.cues.length)));
      if (ci !== P.cueIdx) { P.cueIdx = ci; $("kr-cue").textContent = st.cues[ci]; say(st.cues[ci]); }
    }
    if (left <= 0) startStep(P.i + 1);
  }
  function finish() {
    var done = P && P.onDone;
    close(true);
    say(P0kind === "Échauffement" ? "Échauffement terminé." : "Étirements terminés.");
    if (done) done();
  }
  var P0kind = "";
  function close(completed) {
    if (!P) return;
    clearInterval(P.timer);
    var el = $("kf-routine"); if (el) el.classList.remove("open");
    if (window.KineAvatar) KineAvatar.hide();
    if (typeof stopSpeech === "function" && !completed) stopSpeech();
    P = null;
  }

  window.KineRoutine = {
    has: function (name) { return !!R[name]; },
    steps: function (name) { return R[name] || null; },
    open: function (ex, onDone) {
      var steps = R[ex.name]; if (!steps) return false;
      ensureSheet().classList.add("open");
      P0kind = ex.phase === "cool" ? "Étirements" : "Échauffement";
      P = { steps: steps, onDone: onDone, kind: P0kind, i: 0, paused: false, pausedFor: 0 };
      $("kr-pause").textContent = "Pause";
      startStep(0);
      P.timer = setInterval(tick, 200);
      return true;
    },
    close: function (completed) { close(completed); },
    next: function () { if (P) startStep(P.i + 1); },
    pause: function (force) {
      if (!P) return;
      if (!P.paused || force === true) { if (P.paused) return; P.paused = true; P.pauseAt = Date.now(); $("kr-pause").textContent = "Reprendre"; if (typeof stopSpeech === "function") stopSpeech(); if (KineAvatar.pause) KineAvatar.pause(true); }
      else { P.paused = false; P.pausedFor += Date.now() - P.pauseAt; $("kr-pause").textContent = "Pause"; if (KineAvatar.pause) KineAvatar.pause(false); }
    },
    pain: function () {
      if (!P) return;
      KineRoutine.pause(true);
      rgOpenPain();
      rgPain.onResume = function () { KineRoutine.pause(); };
    },
    moves: MOVES
  };

  /* ════════ 5. BRANCHEMENT DANS L'APPLI ════════ */
  // Mode séance : l'échauffement et les étirements se lancent en mode guidé
  if (typeof renderSeqExercise === "function") {
    var baseRender = renderSeqExercise;
    renderSeqExercise = function () {
      baseRender.apply(this, arguments);
      var ex = SEQ_DAYS[seqCurrentDay].exercises[seqExIdx];
      if (!ex || (ex.phase !== "warm" && ex.phase !== "cool") || !R[ex.name]) return;
      var btn = document.querySelector("#seq-actions .seq-btn-main");
      if (!btn) return;
      btn.textContent = "Commencer, guidé pas à pas";
      btn.onclick = function () { KineRoutine.open(ex, function () { seqExDone(); }); };
      var body = document.getElementById("seq-body");
      if (body && !body.querySelector(".kr-list")) {
        var list = document.createElement("div"); list.className = "kr-list";
        list.innerHTML = "<div class='kf-phase' style='color:var(--text2)'>Déroulé</div>" + R[ex.name].map(function (s) {
          return "<div class='kr-row'><span>" + esc(s.name) + (s.sides ? " (chaque côté)" : "") + "</span><b>" + fmt(s.dur) + "</b></div>"; }).join("");
        body.appendChild(list);
      }
    };
  }
  // Une douleur qui fait passer l'étape ou arrêter la séance ferme aussi la routine
  if (typeof rgPainAction === "function") {
    var basePain = rgPainAction;
    rgPainAction = function (action) {
      if (P && action !== "reprise amplitude réduite") close(false);
      return basePain.apply(this, arguments);
    };
  }
  // Fiches : « Voir l'enchaînement guidé » sans lancer la séance
  function addFicheButtons() {
    if (typeof SEQ_DAYS === "undefined") return;
    Object.keys(SEQ_DAYS).forEach(function (dayId) {
      SEQ_DAYS[dayId].exercises.forEach(function (ex, i) {
        if (!R[ex.name]) return;
        var card = $("ex-" + dayId + "-" + i); if (!card || card.querySelector(".kr-fiche-btn")) return;
        var b = document.createElement("button"); b.type = "button"; b.className = "kf-demo-btn kr-fiche-btn";
        b.innerHTML = "<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M7 4.5v15l13-7.5z'/></svg> Voir l'enchaînement guidé";
        b.onclick = function () { KineRoutine.open(ex, null); };
        var main = card.querySelector(".ex-main") || card; main.appendChild(b);
      });
    });
  }
  if (document.readyState === "complete") addFicheButtons(); else document.addEventListener("DOMContentLoaded", addFicheButtons);
})();
