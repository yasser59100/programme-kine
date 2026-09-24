/* ═══════════════════════════════════════════════════════════════
   KinéForce — Avatar 3D des exercices (v2)

   Ce fichier contient :
   1. la bibliothèque des exercices : tempo exact de chaque répétition
      (tiré des consignes), côtés, durées, et poses de l'avatar ;
   2. le squelette 3D (pieds et mains posés au sol ou sur un support
      grâce à la cinématique inverse) ;
   3. l'API utilisée par le guide de répétitions :

     KineAvatar.info(nom, repsLabel, semaine) → { mode, reps, seconds, sides, perSide }
     KineAvatar.plan(nom, rep, info, semaine) → { steps: [...], announce, side }
     KineAvatar.supports(nom)                 → l'avatar sait faire l'exercice
     KineAvatar.show(conteneur, nom)          → affiche l'avatar (true / false)
     KineAvatar.step(étape)                   → joue une étape du tempo
     KineAvatar.hide()
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  /* ════════════════ 1. BIBLIOTHÈQUE DES EXERCICES ════════════════
     Étape : { pose, dur (s), label (écran), say (voix), kind: up | down | hold }
     sides : "alternate" (G, D, G, D…) ou "blocks" (tout à gauche puis tout à droite)
     Poses (degrés et mètres ; le personnage regarde vers +z, sa gauche est +x) :
       pelvis : { p: [x, y | "auto", z], r: [bascule avant, rotation, inclinaison] }
       spine  : [flexion avant, inclinaison, rotation]        head : flexion
       L / R  : jambes — { foot: { at: [x,y,z] (avant-pied), yaw, lift, pole } }
                ou { ang: [flexion hanche, abduction, rotation, flexion genou, cheville] }
       LA / RA: bras — { hand: { at: [x,y,z], pole } }
                ou { ang: [flexion épaule, abduction, rotation, flexion coude] }        */

  function step(pose, dur, label, say, kind) { return { pose: pose, dur: dur, label: label, say: say, kind: kind }; }
  function merge() { var o = {}; for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) o[k] = arguments[i][k]; return o; }
  var ARMS_RELAXED = { LA: { ang: [4, 7, 0, 10] }, RA: { ang: [4, 7, 0, 10] } };
  function feet(x, z, yaw, y) { // pieds symétriques ; x, z = position de la cheville
    var r = yaw * Math.PI / 180, bx = 0.12 * Math.sin(r), bz = 0.12 * Math.cos(r);
    return { L: { foot: { at: [x + bx, y || 0, z + bz], yaw: yaw } }, R: { foot: { at: [-x - bx, y || 0, z + bz], yaw: -yaw } } };
  }
  function STAND(fx, yaw) { return merge({ pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0 }, feet(fx, 0, yaw), ARMS_RELAXED); }

  // Décubitus dorsal : tête vers -z, pieds vers +z
  var SUPINE_FEET = { L: { foot: { at: [0.13, 0, 0.74], yaw: 0, pole: [0.15, 1, 0] } }, R: { foot: { at: [-0.13, 0, 0.74], yaw: 0, pole: [-0.15, 1, 0] } } };
  var SUPINE_HANDS = { LA: { hand: { at: [0.29, 0.05, 0.02], pole: [1, 0.4, 0] } }, RA: { hand: { at: [-0.29, 0.05, 0.02], pole: [-1, 0.4, 0] } } };
  var BRIDGE_DOWN = merge({ pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0 }, SUPINE_FEET, SUPINE_HANDS);
  // Épaules, hanches et genoux alignés (pas de cambrure)
  // À quatre pattes : genoux sous les hanches, mains sous les épaules, dos plat
  var QUAD = { pelvis: { p: [0, 0.506, 0], r: [80, 0, 0] }, spine: [0, 0, 0], head: 0,
               L: { ang: [80, 3, 0, 90, -60] }, R: { ang: [80, 3, 0, 90, -60] },
               LA: { hand: { at: [0.2, 0.047, 0.5], pole: [0.3, 0, -1] } }, RA: { hand: { at: [-0.2, 0.047, 0.5], pole: [-0.3, 0, -1] } } };
  // Appui sur les avant-bras (coudes sous les épaules)
  var FOREARMS = { LA: { hand: { at: [0.13, 0.047, 0.76], pole: [0.2, -1, -0.2] } }, RA: { hand: { at: [-0.13, 0.047, 0.76], pole: [-0.2, -1, -0.2] } } };
  // Pieds en appui sur les orteils (planche haute)
  var PLANK_FEET = { L: { foot: { at: [0.12, 0, 0.12], yaw: 0, lift: 70 } }, R: { foot: { at: [-0.12, 0, 0.12], yaw: 0, lift: 70 } } };
  var BRIDGE_UP = merge(BRIDGE_DOWN, { pelvis: { p: [0, 0.288, -0.029], r: [-110, 0, 0] }, head: 20 });

  var EX = {
    "Squat bilatéral": {
      camera: { yaw: 0.65 }, start: "up", thumb: "down",
      poses: {
        up: STAND(0.13, 12),
        // Flexion de genou ≈ 90°, talons au sol, rachis neutre, genoux dans l'axe des pieds
        // 90° de flexion de hanche (cuisse / tronc) et 90° de flexion de genou, talons au sol, genoux dans l'axe des pieds
        down: merge(STAND(0.13, 12), { pelvis: { p: [0, 0.657, -0.222], r: [13, 0, 0] }, spine: [12, 0, 0], head: -14,
                                        LA: { ang: [80, 6, 0, 0] }, RA: { ang: [80, 6, 0, 0] } })
      },
      steps: [step("down", 2, "On descend", "On descend", "down"),
              step("up", 1, "On monte", "On monte, on expire", "up")],
      stepsS4: [step("down", 2, "On descend", "On descend", "down"),   // variante S4 : pause 2 s en bas
                step("down", 2, "Pause en bas", "Pause", "hold"),
                step("up", 1, "On monte", "On monte, on expire", "up")]
    },

    "Fentes avant unilatérales": {
      sides: "blocks", firstSide: "R", sideWord: "jambe", camera: { yaw: 1.15, dist: 4.4, tz: 0.45 }, start: "up", thumb: "down",
      poses: {
        up: STAND(0.1, 0),
        // Grand pas avant : 90° de flexion aux deux genoux, genou avant au-dessus du pied, genou arrière proche du sol, buste droit
        down: merge(STAND(0.1, 0), { pelvis: { p: [0, 0.55, 0.54], r: [0, 0, 0] }, spine: [0, 0, 0],
          L: { foot: { at: [0.1, 0, 1.06], yaw: 0 } },
          R: { foot: { at: [-0.1, 0, 0.12], yaw: 0, lift: 40 } } })
      },
      steps: [step("down", 2, "On descend", "On descend", "down"),
              step("up", 1, "On revient", "On pousse, on revient", "up")]
    },

    "Pont de hanche": {
      camera: { yaw: 1.2, pitch: 0.38, dist: 3.4, ty: 0.25, tz: 0 }, start: "down", thumb: "up",
      poses: { down: BRIDGE_DOWN, up: BRIDGE_UP },
      steps: [step("up", 1.5, "On monte", "On monte", "up"),
              step("up", 2, "On tient", "On tient", "hold"),
              step("down", 3, "Descente lente", "On descend lentement", "down")]
    },

    "Pont ischio-jambiers talons sur chaise": {
      // Talons sur l'assise d'une chaise, genoux légèrement fléchis ; on décolle le bassin jusqu'à l'alignement
      camera: { yaw: 1.25, pitch: 0.35, dist: 3.7, ty: 0.35, tz: 0.3 }, props: ["chair"], chair: { z: 0.78, turn: true },
      start: "down", thumb: "up",
      poses: {
        down: merge({ pelvis: { p: [0, 0.12, 0.2], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
                      L: { foot: { at: [0.12, 0.643, 1.048], yaw: 0, lift: -70, pole: [0.1, 1, 0] } },
                      R: { foot: { at: [-0.12, 0.643, 1.048], yaw: 0, lift: -70, pole: [-0.1, 1, 0] } } }, SUPINE_HANDS),
        up:   merge({ pelvis: { p: [0, 0.376, 0.128], r: [-121.5, 0, 0] }, spine: [0, 0, 0], head: 31,
                      L: { foot: { at: [0.12, 0.643, 1.048], yaw: 0, lift: -70, pole: [0.1, 1, 0] } },
                      R: { foot: { at: [-0.12, 0.643, 1.048], yaw: 0, lift: -70, pole: [-0.1, 1, 0] } } }, SUPINE_HANDS)
      },
      steps: [step("up", 1.5, "On monte", "On pousse dans les talons", "up"),
              step("up", 2, "On tient", "On tient", "hold"),
              step("down", 3, "Descente lente", "On descend lentement", "down")]
    },

    "Élévation des talons": {
      camera: { yaw: 1.3 }, props: ["wall"], start: "down", thumb: "up",
      poses: {
        down: merge(STAND(0.09, 0), { LA: { hand: { at: [0.2, 1.32, 0.5], pole: [0.5, -1, -0.3] } },
                                      RA: { hand: { at: [-0.2, 1.32, 0.5], pole: [-0.5, -1, -0.3] } } })
      },
      steps: [step("up", 2, "On monte", "On monte", "up"),
              step("up", 1, "On tient", "On tient", "hold"),
              step("down", 3, "Descente lente", "On descend lentement", "down")]
    },

    "Step-up sur marche": {
      sides: "alternate", camera: { yaw: 1.0 }, props: ["step"], start: "floor", thumb: "place",
      poses: {
        floor: merge(STAND(0.1, 0), { pelvis: { p: [0, "auto", -0.02], r: [0, 0, 0] } }),
        place: merge(STAND(0.1, 0), { pelvis: { p: [0, "auto", 0.02], r: [4, 0, 0] }, spine: [6, 0, 0],
          L: { foot: { at: [0.1, 0.18, 0.4], yaw: 0 } } }),
        top: merge(STAND(0.1, 0), { pelvis: { p: [0, "auto", 0.3], r: [0, 0, 0] },
          L: { foot: { at: [0.1, 0.18, 0.4], yaw: 0 } }, R: { foot: { at: [-0.1, 0.18, 0.4], yaw: 0 } } })
      },
      steps: [step("place", 1, "Pied sur la marche", "Pied sur la marche", "up"),
              step("top", 2, "On monte", "On pousse sur la jambe", "up"),
              step("place", 3, "Descente contrôlée", "On redescend doucement", "down"),
              step("floor", 1, "Pied au sol", null, "down")]
    },

    "Chaise contre le mur": {
      camera: { yaw: 1.35 }, props: ["wallBack"], start: "up", thumb: "hold",
      timed: { byWeek: [30, 45, 60, 60] },
      poses: {
        up: merge(STAND(0.1, 0), { pelvis: { p: [0, "auto", -0.44], r: [0, 0, 0] }, spine: [0, 0, 0] }),
        // 90° de flexion de hanches et de genoux, dos plaqué au mur, genoux au-dessus des chevilles
        hold: merge(STAND(0.1, 0), { pelvis: { p: [0, 0.51, -0.44], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
          LA: { hand: { at: [0.13, 0.6, -0.18], pole: [1, -0.3, -0.5] } }, RA: { hand: { at: [-0.13, 0.6, -0.18], pole: [-1, -0.3, -0.5] } } })
      }
    },

    "Squat sumo": {
      camera: { yaw: 0.45 }, start: "up", thumb: "down",
      poses: {
        up: merge(STAND(0.26, 42), { LA: { ang: [30, 12, 0, 100] }, RA: { ang: [30, 12, 0, 100] } }),
        // Genoux dans l'axe des orteils, bassin en légère rétroversion
        down: merge(STAND(0.26, 42), { pelvis: { p: [0, 0.62, -0.06], r: [2, 0, 0] }, spine: [12, 0, 0], head: -8,
                                        LA: { ang: [40, 12, 0, 100] }, RA: { ang: [40, 12, 0, 100] } })
      },
      steps: [step("down", 2, "On descend", "On descend", "down"),
              step("up", 1, "On monte", "On monte, fessiers serrés", "up")]
    },

    /* ── J2 — Membres supérieurs ── */
    "Rotation externe d'épaule": {
      // Allongé sur le côté gauche, bras du dessus (droit) : coude fléchi à 90° collé au flanc, charge dans la main
      // Les deux épaules : 15 épaule droite (allongé sur le côté gauche), puis 15 épaule gauche
      sides: "blocks", snapSideChange: true, load: "R", sideWord: "épaule", labelSwap: true, camera: { yaw: 0.05, pitch: 0.3, dist: 3.1, ty: 0.28 }, start: "down", thumb: "up",
      poses: {
        down: { pelvis: { p: [0, 0.2, 0], r: [0, 0, -90] }, spine: [0, 0, 0], head: 0,
                L: { ang: [30, 0, 0, 60, 0] }, R: { ang: [30, 0, 0, 60, 0] },
                LA: { ang: [168, 0, 0, 20] }, RA: { ang: [0, 4, -50, 90] } },
        up:   { pelvis: { p: [0, 0.2, 0], r: [0, 0, -90] }, spine: [0, 0, 0], head: 0,
                L: { ang: [30, 0, 0, 60, 0] }, R: { ang: [30, 0, 0, 60, 0] },
                LA: { ang: [168, 0, 0, 20] }, RA: { ang: [0, 4, 75, 90] } }
      },
      steps: [step("up", 1.5, "On ouvre", "On ouvre", "up"), step("down", 3, "Descente lente", "On redescend lentement", "down")]
    },

    "Pompes sur genoux": {
      // Corps aligné tête-hanches-genoux, mains un peu plus larges que les épaules, coudes à 45° du tronc
      camera: { yaw: 1.25, pitch: 0.25, dist: 3.5, ty: 0.3, tz: 0.45 }, start: "up", thumb: "down",
      poses: {
        up:   { pelvis: { p: [0, 0.309, 0.367], r: [56.4, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { ang: [0, 5, 0, 100, -30] }, R: { ang: [0, 5, 0, 100, -30] },
                LA: { hand: { at: [0.27, 0.047, 0.84], pole: [0.7, 0.3, -0.7] } }, RA: { hand: { at: [-0.27, 0.047, 0.84], pole: [-0.7, 0.3, -0.7] } } },
        down: { pelvis: { p: [0, 0.167, 0.428], r: [76.7, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { ang: [0, 5, 0, 100, -30] }, R: { ang: [0, 5, 0, 100, -30] },
                LA: { hand: { at: [0.27, 0.047, 0.84], pole: [0.7, 0.3, -0.7] } }, RA: { hand: { at: [-0.27, 0.047, 0.84], pole: [-0.7, 0.3, -0.7] } } }
      },
      steps: [step("down", 3, "Descente lente", "On descend", "down"), step("up", 1, "On pousse", "On pousse", "up")]
    },

    "Dips sur chaise": {
      // Mains sur le bord de la chaise, dos proche du siège, coudes fléchis jusqu'à 90° maximum
      camera: { yaw: 1.3, pitch: 0.18, dist: 3.9, ty: 0.55, tz: 0.1 }, props: ["chair"], start: "up", thumb: "down",
      poses: {
        up:   { pelvis: { p: [0, 0.51, 0.0], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { foot: { at: [0.12, 0, 0.62], yaw: 0 } }, R: { foot: { at: [-0.12, 0, 0.62], yaw: 0 } },
                LA: { hand: { at: [0.2, 0.49, -0.17], pole: [0.25, 0, -1] } }, RA: { hand: { at: [-0.2, 0.49, -0.17], pole: [-0.25, 0, -1] } } },
        down: { pelvis: { p: [0, 0.27, 0.1], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { foot: { at: [0.12, 0, 0.62], yaw: 0 } }, R: { foot: { at: [-0.12, 0, 0.62], yaw: 0 } },
                LA: { hand: { at: [0.2, 0.49, -0.17], pole: [0.25, 0, -1] } }, RA: { hand: { at: [-0.2, 0.49, -0.17], pole: [-0.25, 0, -1] } } }
      },
      steps: [step("down", 2, "On descend", "On descend", "down"), step("up", 1, "On pousse", "On pousse", "up")]
    },

    "Pike push-up": {
      // V inversé, fessiers en l'air ; les coudes fléchissent pour amener le crâne entre les mains
      // S1–S2 : sur les genoux (hanches au-dessus des genoux) ; à partir de S3 : sur les pieds
      easyUntil: 2, camera: { yaw: 1.4, pitch: 0.2, dist: 3.7, ty: 0.45, tz: 0.1 }, start: "up", thumb: "down",
      poses: {
        upK:   { pelvis: { p: [0, 0.506, -0.1], r: [105, 0, 0] }, spine: [0, 0, 0], head: 0,
                 L: { ang: [105, 3, 0, 90, -60] }, R: { ang: [105, 3, 0, 90, -60] },
                 LA: { hand: { at: [0.24, 0.047, 0.8], pole: [0.6, 0.4, -0.7] } }, RA: { hand: { at: [-0.24, 0.047, 0.8], pole: [-0.6, 0.4, -0.7] } } },
        downK: { pelvis: { p: [0, 0.447, 0.12], r: [120, 0, 0] }, spine: [0, 0, 0], head: 0,
                 L: { ang: [90, 3, 0, 60, -60] }, R: { ang: [90, 3, 0, 60, -60] },
                 LA: { hand: { at: [0.24, 0.047, 0.8], pole: [0.6, 0.4, -0.7] } }, RA: { hand: { at: [-0.24, 0.047, 0.8], pole: [-0.6, 0.4, -0.7] } } },
        up:   { pelvis: { p: [0, 0.86, -0.03], r: [140, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { foot: { at: [0.12, 0, -0.46], yaw: 0, lift: 35 } }, R: { foot: { at: [-0.12, 0, -0.46], yaw: 0, lift: 35 } },
                LA: { hand: { at: [0.24, 0.047, 0.6], pole: [0.6, 0.4, -0.7] } }, RA: { hand: { at: [-0.24, 0.047, 0.6], pole: [-0.6, 0.4, -0.7] } } },
        down: { pelvis: { p: [0, 0.78, 0.06], r: [152, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { foot: { at: [0.12, 0, -0.46], yaw: 0, lift: 35 } }, R: { foot: { at: [-0.12, 0, -0.46], yaw: 0, lift: 35 } },
                LA: { hand: { at: [0.24, 0.047, 0.6], pole: [0.6, 0.4, -0.7] } }, RA: { hand: { at: [-0.24, 0.047, 0.6], pole: [-0.6, 0.4, -0.7] } } }
      },
      steps: [step("down", 2, "On descend", "On descend", "down"), step("up", 1, "On pousse", "On pousse", "up")]
    },

    "Superman en Y et en W": {
      // Décubitus ventral. Série A : bras en Y, on élève bras et jambes. Série B : bras en W, omoplates rapprochées
      variants: ["Y", "W"], variantBy: "serie", camera: { yaw: 0.95, pitch: 0.5, dist: 3.4, ty: 0.15, tz: 0.25 }, start: "down", thumb: "up",
      poses: {
        down:  { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [0, 0, 0], head: -12,
                 L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] },
                 LA: { hand: { at: [0.47, 0.06, 0.98], pole: [1, -0.2, 0] } }, RA: { hand: { at: [-0.47, 0.06, 0.98], pole: [-1, -0.2, 0] } } },
        up:    { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [-8, 0, 0], head: -18,
                 L: { ang: [-14, 4, 0, 0, -60] }, R: { ang: [-14, 4, 0, 0, -60] },
                 LA: { hand: { at: [0.47, 0.36, 1.0], pole: [1, 0.2, 0] } }, RA: { hand: { at: [-0.47, 0.36, 1.0], pole: [-1, 0.2, 0] } } },
        downW: { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [0, 0, 0], head: -12,
                 L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] },
                 LA: { hand: { at: [0.42, 0.06, 0.78], pole: [1, -0.3, -0.3] } }, RA: { hand: { at: [-0.42, 0.06, 0.78], pole: [-1, -0.3, -0.3] } } },
        upW:   { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [-6, 0, 0], head: -16,
                 L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] },
                 LA: { hand: { at: [0.42, 0.24, 0.74], pole: [0.8, 0.6, -0.4] } }, RA: { hand: { at: [-0.42, 0.24, 0.74], pole: [-0.8, 0.6, -0.4] } } }
      },
      steps: [step("up", 1, "On lève", "On lève", "up"), step("up", 2, "On tient", "On tient", "hold"), step("down", 1.5, "On repose", "On repose", "down")]
    },

    /* ── J3 — Gainage rachidien ── */
    "Plank — gainage avant-bras": {
      // Appui avant-bras et orteils, corps aligné, pas de cambrure ni de fessiers relevés
      timed: { byWeek: [20, 25, 30, 40] }, camera: { yaw: 1.3, pitch: 0.22, dist: 3.9, ty: 0.25, tz: -0.1 }, start: "rest", thumb: "hold",
      poses: {
        rest: merge({ pelvis: { p: [0, 0.12, 0.055], r: [65.4, 0, 0] }, spine: [0, 0, 0], head: 0,
                      L: { ang: [-24.6, 4, 0, 0, -60] }, R: { ang: [-24.6, 4, 0, 0, -60] } }, FOREARMS),
        hold: merge({ pelvis: { p: [0, 0.25, 0.015], r: [81.3, 0, 0] }, spine: [0, 0, 0], head: 0,
                      L: { ang: [0, 4, 0, 0, -10] }, R: { ang: [0, 4, 0, 0, -10] } }, FOREARMS)
      }
    },

    "Dead bug": {
      // Dos au sol, bras tendus au plafond, hanches et genoux à 90° ; on abaisse bras droit et jambe gauche
      sides: "alternate", sideWord: "jambe", camera: { yaw: 1.15, pitch: 0.4, dist: 3.4, ty: 0.3, tz: 0 }, start: "up", thumb: "down",
      poses: {
        up:   { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { ang: [90, 3, 0, 90, 0] }, R: { ang: [90, 3, 0, 90, 0] }, LA: { ang: [90, 6, 0, 0] }, RA: { ang: [90, 6, 0, 0] } },
        down: { pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
                L: { ang: [12, 3, 0, 4, 0] }, R: { ang: [90, 3, 0, 90, 0] }, LA: { ang: [90, 6, 0, 0] }, RA: { ang: [168, 6, 0, 0] } }
      },
      steps: [step("down", 2, "On allonge", "On allonge", "down"), step("up", 2, "On revient", "On revient", "up")]
    },

    "Side plank sur genoux": {
      // Sur le côté, appui avant-bras et genou du dessous ; hanches levées jusqu'à l'alignement épaule-hanche-genou
      sides: "blocks", snapSideChange: true, timed: { byWeek: [20, 20, 30, 30] },
      camera: { yaw: 0.05, pitch: 0.25, dist: 3.4, ty: 0.3 }, start: "rest", thumb: "hold",
      poses: {
        rest: { pelvis: { p: [0, 0.221, 0], r: [0, 0, -82] }, spine: [0, 0, 0], head: 0,
                L: { ang: [0, 0, 0, 90, 0] }, R: { ang: [0, 0, 0, 90, 0] },
                LA: { hand: { at: [0.514, 0.047, 0.26], pole: [0.2, -1, -0.3] } }, RA: { ang: [0, 8, 0, 30] } },
        hold: { pelvis: { p: [0, 0.324, 0], r: [0, 0, -67.2] }, spine: [0, 0, 0], head: 0,
                L: { ang: [0, 0, 0, 90, 0] }, R: { ang: [0, 0, 0, 90, 0] },
                LA: { hand: { at: [0.528, 0.047, 0.26], pole: [0.2, -1, -0.3] } }, RA: { ang: [0, 8, 0, 30] } }
      }
    },

    "Crunch abdominal contrôlé": {
      // Dos au sol, genoux fléchis, mains croisées sur la poitrine ; épaules décollées à 30° maximum
      camera: { yaw: 1.3, pitch: 0.3, dist: 3.3, ty: 0.3, tz: -0.1 }, start: "down", thumb: "up",
      poses: {
        down: merge({ pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
                      LA: { ang: [22, -42, 0, 138] }, RA: { ang: [22, -42, 0, 138] } }, SUPINE_FEET),
        up:   merge({ pelvis: { p: [0, 0.12, 0], r: [-90, 0, 0] }, spine: [30, 0, 0], head: 10,
                      LA: { ang: [22, -42, 0, 138] }, RA: { ang: [22, -42, 0, 138] } }, SUPINE_FEET)
      },
      steps: [step("up", 1, "On monte", "On monte, on expire", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 3, "Descente lente", "On descend", "down")]
    },

    "Bird-dog": {
      // À quatre pattes, dos plat ; on étend le bras gauche et la jambe droite, bassin horizontal
      sides: "alternate", camera: { yaw: 0.85, pitch: 0.3, dist: 3.8, ty: 0.45, tz: 0.15 }, start: "down", thumb: "up",
      poses: {
        down: QUAD,
        up: merge(QUAD, { LA: { hand: { at: [0.205, 0.64, 1.03], pole: [0, 1, 0] } }, R: { ang: [-10, 0, 0, 0, -20] } })
      },
      steps: [step("up", 2, "On allonge", "On allonge", "up"), step("up", 3, "On tient", "On tient", "hold"), step("down", 2, "On revient", "On revient", "down")]
    },

    /* ── J4 — Fessiers et bassin ── */
    "Donkey kick": {
      // À quatre pattes ; la cuisse monte vers le plafond, genou à 90°, sans rotation du bassin
      sides: "blocks", camera: { yaw: 1.3, pitch: 0.25, dist: 3.8, ty: 0.45, tz: 0.1 }, start: "down", thumb: "up",
      poses: { down: QUAD, up: merge(QUAD, { L: { ang: [-18, 3, 0, 90, 0] } }) },
      steps: [step("up", 1, "On monte", "On monte", "up"), step("up", 1, "On serre", "On serre", "hold"), step("down", 2, "Descente lente", "On redescend", "down")]
    },

    "Clamshell": {
      // Sur le côté, hanches à 45° et genoux à 90° ; le genou du dessus s'ouvre, pieds joints, bassin immobile
      sides: "blocks", snapSideChange: true, camera: { yaw: 0.05, pitch: 0.35, dist: 3.1, ty: 0.28 }, start: "down", thumb: "up",
      poses: {
        down: { pelvis: { p: [0, 0.2, 0], r: [0, 0, -90] }, spine: [0, 0, 0], head: 0,
                L: { ang: [45, 0, 0, 90, 0] }, R: { ang: [45, 0, 0, 90, 0] }, LA: { ang: [168, 0, 0, 20] }, RA: { ang: [60, 0, 0, 60] } },
        up:   { pelvis: { p: [0, 0.2, 0], r: [0, 0, -90] }, spine: [0, 0, 0], head: 0,
                L: { ang: [45, 0, 0, 90, 0] }, R: { ang: [45, 30, 33, 90, 0] }, LA: { ang: [168, 0, 0, 20] }, RA: { ang: [60, 0, 0, 60] } }
      },
      steps: [step("up", 1, "On ouvre", "On ouvre", "up"), step("up", 1, "On tient", "On tient", "hold"), step("down", 2, "On referme", "On referme", "down")]
    },

    "Abduction hanche debout": {
      // Debout, main sur le mur ; la jambe tendue s'écarte à 30-40° sans incliner le tronc
      sides: "blocks", camera: { yaw: 0.12, pitch: 0.12, dist: 4.1, ty: 0.85 }, props: ["wallSide"], start: "down", thumb: "up",
      poses: {
        down: { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
                R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } }, L: { ang: [0, 3, 0, 0, 0] },
                RA: { hand: { at: [-0.52, 1.1, 0.05], pole: [-0.3, -1, -0.4] } }, LA: { ang: [4, 7, 0, 10] } },
        up:   { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
                R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } }, L: { ang: [0, 35, 0, 0, 0] },
                RA: { hand: { at: [-0.52, 1.1, 0.05], pole: [-0.3, -1, -0.4] } }, LA: { ang: [4, 7, 0, 10] } }
      },
      steps: [step("up", 1.5, "On monte", "On monte", "up"), step("down", 3, "Descente lente", "On redescend", "down")]
    },

    "Pont fessier unilatéral": {
      // Pont de hanche sur une jambe, l'autre tendue à l'horizontale, bassin horizontal
      sides: "blocks", camera: { yaw: 1.2, pitch: 0.38, dist: 3.4, ty: 0.25, tz: 0 }, start: "down", thumb: "up",
      poses: {
        down: merge(BRIDGE_DOWN, { L: { ang: [45, 0, 0, 0, 0] } }),
        up:   merge(BRIDGE_UP, { L: { ang: [-20, 0, 0, 0, 0] } })
      },
      steps: [step("up", 1.5, "On monte", "On monte", "up"), step("up", 2, "On tient", "On tient", "hold"), step("down", 3, "Descente lente", "On descend", "down")]
    },

    /* ── J5 — Global fonctionnel ── */
    "Squat + élévation bras": {
      // Descente en squat, remontée avec les deux bras jusqu'à la verticale
      timed: { seconds: 40 }, camera: { yaw: 0.65 }, start: "rest", thumb: "up",
      poses: {
        rest: STAND(0.13, 12),
        down: merge(STAND(0.13, 12), { pelvis: { p: [0, 0.657, -0.222], r: [13, 0, 0] }, spine: [12, 0, 0], head: -14,
                                        LA: { ang: [30, 8, 0, 20] }, RA: { ang: [30, 8, 0, 20] } }),
        up: merge(STAND(0.13, 12), { LA: { ang: [176, 8, 0, 0] }, RA: { ang: [176, 8, 0, 0] } })
      },
      steps: [step("down", 2, "On descend", "On descend", "down"), step("up", 2, "On monte, bras en haut", "On monte", "up")]
    },

    "Inchworm et pompes": {
      // Mains au sol, on avance jusqu'en planche, 2 pompes, on revient en marchant, redressement lent
      timed: { seconds: 40 }, camera: { yaw: 1.4, pitch: 0.2, dist: 4.8, ty: 0.55, tz: 0.7 }, start: "stand", thumb: "plank",
      poses: {
        stand: merge(STAND(0.12, 0), { LA: { hand: { at: [0.23, 0.9, 0.03], pole: [0.3, 0, -1] } }, RA: { hand: { at: [-0.23, 0.9, 0.03], pole: [-0.3, 0, -1] } } }),
        fold:  merge(STAND(0.12, 0), { pelvis: { p: [0, 0.9, -0.12], r: [150, 0, 0] }, spine: [0, 0, 0], head: 20,
                 LA: { hand: { at: [0.22, 0.047, 0.38], pole: [0.3, 0.5, -1] } }, RA: { hand: { at: [-0.22, 0.047, 0.38], pole: [-0.3, 0.5, -1] } } }),
        plank: merge(PLANK_FEET, { pelvis: { p: [0, 0.426, 0.976], r: [70.8, 0, 0] }, spine: [0, 0, 0], head: 0,
                 LA: { hand: { at: [0.24, 0.047, 1.44], pole: [0.6, 0.3, -0.7] } }, RA: { hand: { at: [-0.24, 0.047, 1.44], pole: [-0.6, 0.3, -0.7] } } }),
        push:  merge(PLANK_FEET, { pelvis: { p: [0, 0.243, 1.018], r: [83.3, 0, 0] }, spine: [0, 0, 0], head: 0,
                 LA: { hand: { at: [0.24, 0.047, 1.44], pole: [0.6, 0.3, -0.7] } }, RA: { hand: { at: [-0.24, 0.047, 1.44], pole: [-0.6, 0.3, -0.7] } } })
      },
      steps: [step("fold", 2, "Mains au sol", "Mains au sol", "down"), step("plank", 3, "On avance les mains", "On avance les mains", "down"),
              step("push", 2, "Pompe", "Une", "down"), step("plank", 1, "On pousse", null, "up"),
              step("push", 2, "Pompe", "Deux", "down"), step("plank", 1, "On pousse", null, "up"),
              step("fold", 3, "On revient", "On revient", "up"), step("stand", 2, "On se redresse", "On se redresse lentement", "up")]
    },

    "Fente latérale avec toucher sol": {
      // Grand pas latéral, genou porteur fléchi, la main opposée vient toucher le sol
      timed: { seconds: 40 }, sides: "alternate", sideWord: "jambe", camera: { yaw: 0.2, pitch: 0.15, dist: 4.4, ty: 0.7 }, start: "up", thumb: "down",
      poses: {
        up:   merge(STAND(0.1, 0), { RA: { hand: { at: [-0.23, 0.9, 0.03], pole: [-0.3, 0, -1] } }, LA: { ang: [4, 7, 0, 10] } }),
        down: merge(STAND(0.1, 0), { pelvis: { p: [0.42, 0.6, -0.05], r: [30, 0, 0] }, spine: [35, 0, 12], head: -10,
                L: { foot: { at: [0.85, 0, 0.14], yaw: 15 } }, R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } },
                RA: { hand: { at: [0.55, 0.06, 0.42], pole: [-0.3, 0.4, -1] } }, LA: { ang: [30, 25, 0, 20] } })
      },
      steps: [step("down", 2, "On descend", "On descend", "down"), step("up", 1.5, "On revient", "On revient", "up")]
    },

    "Burpee modifié sans saut": {
      // Mains au sol, on recule en planche, 2 s de gainage, on ramène les pieds, remontée lente
      timed: { seconds: 40 }, camera: { yaw: 1.35, pitch: 0.2, dist: 4.6, ty: 0.55, tz: -0.15 }, start: "stand", thumb: "plank",
      poses: {
        stand: merge(STAND(0.13, 8), { LA: { hand: { at: [0.23, 0.9, 0.03], pole: [0.3, 0, -1] } }, RA: { hand: { at: [-0.23, 0.9, 0.03], pole: [-0.3, 0, -1] } } }),
        squat: merge(STAND(0.13, 8), { pelvis: { p: [0, 0.45, -0.15], r: [35, 0, 0] }, spine: [30, 0, 0], head: -20,
                 LA: { hand: { at: [0.22, 0.047, 0.42], pole: [0.3, 0.3, -1] } }, RA: { hand: { at: [-0.22, 0.047, 0.42], pole: [-0.3, 0.3, -1] } } }),
        plank: { pelvis: { p: [0, 0.426, -0.043], r: [70.8, 0, 0] }, spine: [0, 0, 0], head: 0,
                 L: { foot: { at: [0.12, 0, -0.9], yaw: 0, lift: 70 } }, R: { foot: { at: [-0.12, 0, -0.9], yaw: 0, lift: 70 } },
                 LA: { hand: { at: [0.22, 0.047, 0.42], pole: [0.6, 0.3, -0.7] } }, RA: { hand: { at: [-0.22, 0.047, 0.42], pole: [-0.6, 0.3, -0.7] } } }
      },
      steps: [step("squat", 2, "Mains au sol", "Mains au sol", "down"), step("plank", 1.5, "Pieds en arrière", "Pieds en arrière", "down"),
              step("plank", 2, "Gainage", "On tient", "hold"), step("squat", 1.5, "Pieds vers les mains", "Pieds vers les mains", "up"),
              step("stand", 2, "On se relève", "On se relève lentement", "up")]
    },

    "Équilibre unipodal": {
      // Sur un pied, yeux ouverts 20 s puis yeux fermés 20 s, bras légèrement écartés
      timed: { seconds: 40 }, sides: "blocks", sideWord: "pied", camera: { yaw: 1.0 }, start: "up", thumb: "hold",
      cues: [{ at: 0, label: "Yeux ouverts", say: "Yeux ouverts" }, { at: 20, label: "Yeux fermés", say: "Fermez les yeux" }],
      poses: {
        up:   { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0,
                R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } }, L: { ang: [0, 3, 0, 0, 0] }, LA: { ang: [4, 7, 0, 10] }, RA: { ang: [4, 7, 0, 10] } },
        hold: { pelvis: { p: [0, "auto", 0], r: [0, 0, 0] }, spine: [2, 0, 0], head: 0,
                R: { foot: { at: [-0.1, 0, 0.12], yaw: 0 } }, L: { ang: [35, 3, 0, 70, 0] }, LA: { ang: [10, 35, 0, 15] }, RA: { ang: [10, 35, 0, 15] } }
      }
    }
  };
  EX["Rotation externe épaule"] = EX["Rotation externe d'épaule"];
  EX["Fentes avant alternées"] = EX["Fentes avant unilatérales"];
  (function () { // talons levés : avant-pied fixe, talons décollés
    var t = EX["Élévation des talons"].poses;
    t.up = JSON.parse(JSON.stringify(t.down));
    t.up.L.foot.lift = 38; t.up.R.foot.lift = 38;
  })();

  /* ════════════════ 2. RYTHME : répétitions, côtés, durées ════════════════ */
  function info(name, repsLabel, week) {
    var def = EX[name] || {}, label = repsLabel || "";
    var n = parseInt((label.match(/\d+/) || ["12"])[0], 10);
    var perSide = /par (jambe|côté)/i.test(label);
    if (def.timed || /seconde/i.test(label)) {
      var s = def.timed && def.timed.byWeek ? def.timed.byWeek[Math.min(3, Math.max(0, (week || 1) - 1))]
            : def.timed && def.timed.seconds ? def.timed.seconds : n;
      return { mode: "timed", seconds: s, cues: def.cues || null,
               sides: perSide || def.sides === "blocks" ? "blocks" : def.sides === "alternate" ? "alternate" : null };
    }
    var sides = perSide ? (def.sides || "alternate") : null;
    return { mode: "reps", reps: perSide ? n * 2 : n, perSide: perSide ? n : 0, sides: sides };
  }

  function plan(name, rep, inf, week) {
    var def = EX[name];
    var base = def && def.steps ? (week >= 4 && def.stepsS4 ? def.stepsS4 : def.steps)
      : [step(0, 2, "On descend", "On descend", "down"), step(0, 1, "On monte", "On monte", "up")];
    var side = "L", announce = null;
    if (inf && inf.sides === "alternate") side = rep % 2 === 1 ? "L" : "R";
    var first = def && def.firstSide === "R" ? "R" : "L", other = first === "R" ? "L" : "R";
    var word = def && def.sideWord ? def.sideWord + " " : "";
    if (inf && inf.sides === "blocks" && inf.perSide) {
      side = rep <= inf.perSide ? first : other;
      if (rep === inf.perSide + 1) announce = "Changez de côté. " + (word ? word.charAt(0).toUpperCase() + word.slice(1) : "Côté ") + (side === "L" ? "gauche" : "droite");
    }
    var shown = def && def.labelSwap ? (side === "L" ? "R" : "L") : side; // côté qui travaille
    if (announce && def && def.labelSwap) announce = "Changez de côté. " + (word ? word.charAt(0).toUpperCase() + word.slice(1) : "Côté ") + (shown === "L" ? "gauche" : "droite");
    var sideTxt = inf && inf.sides ? " · " + word + (shown === "L" ? "gauche" : "droite") : "";
    var sideSay = inf && inf.sides === "blocks" && rep === 1 ? (word ? word.charAt(0).toUpperCase() + word.slice(1) : "Côté ") + (shown === "L" ? "gauche" : "droite") + ". " : "";
    var vIdx = def && def.variantBy === "serie" ? ((inf && inf.serie) || 1) - 1 : rep - 1;
    var variant = def && def.variants ? def.variants[vIdx % def.variants.length] : null;
    return {
      announce: announce, side: side,
      steps: base.map(function (s, i) {
        var pose = variant && def.poses && def.poses[s.pose + variant] ? s.pose + variant : s.pose;
        if (def && def.easyUntil && (week || 1) <= def.easyUntil && def.poses[pose + "K"]) pose = pose + "K";
        return { pose: pose, dur: s.dur, kind: s.kind, say: i === 0 && sideSay ? sideSay + (s.say || "") : s.say, side: side,
                 label: s.label + (variant ? " · " + variant : "") + sideTxt };
      })
    };
  }

  /* ════════════════ 3. RENDU 3D ════════════════ */
  var AVATAR = {
    name: ["YASSER", "LADRAA"], title: "Kinésithérapeute",
    skin: "#B07A52", hair: "#2E1F16", fade: "#6E4F3C", shirt: "#F6F6F3", print: "#2A6FC4",
    pants: "#1E1F22", shoes: "#FAFAFA", sole: "#B8BEC2", lips: "#8A4B3A", eyes: "#1B1410"
  };
  var LEN = { thigh: 0.44, shank: 0.42, upper: 0.28, fore: 0.26, hipX: 0.095, shX: 0.205, shY: 0.49 };

  var loading = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = THREE_URL; s.crossOrigin = "anonymous"; s.async = true;
      s.onload = resolve; s.onerror = function () { loading = null; reject(); };
      document.head.appendChild(s);
    });
    return loading;
  }
  window.addEventListener("load", function () {
    var go = function () { loadThree().catch(function () {}); };
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500);
  });

  var R = null;
  function build() {
    var T = window.THREE;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", "Démonstration animée de l'exercice");
    canvas.style.cssText = "display:block;width:min(320px,82vw);aspect-ratio:1/1;touch-action:pan-y;cursor:grab;";
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(32, 1, 0.1, 50);
    scene.add(new T.HemisphereLight(0xffffff, 0x9fb3b0, 0.8));
    var sun = new T.DirectionalLight(0xffffff, 0.8);
    sun.position.set(1.5, 3.2, 2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -1.4; sun.shadow.camera.right = 1.4; sun.shadow.camera.top = 1.4; sun.shadow.camera.bottom = -1.4;
    scene.add(sun);
    var fill = new T.DirectionalLight(0xffffff, 0.35); fill.position.set(-2, 1.5, -1); scene.add(fill);
    var ground = new T.Mesh(new T.CircleGeometry(1.4, 48), new T.ShadowMaterial({ opacity: 0.28 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    var ring = new T.Mesh(new T.RingGeometry(0.62, 0.64, 64), new T.MeshBasicMaterial({ color: 0x3d8ef0, transparent: true, opacity: 0.25 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.001; scene.add(ring);

    var lin = function (c) { return new T.Color(c).convertSRGBToLinear(); };
    var mat = function (c, r) { return new T.MeshStandardMaterial({ color: lin(c), roughness: r || 0.85, side: T.DoubleSide }); };
    var M = { skin: mat(AVATAR.skin), hair: mat(AVATAR.hair), fade: mat(AVATAR.fade), pants: mat(AVATAR.pants),
              shirt: mat(AVATAR.shirt), shoes: mat(AVATAR.shoes), sole: mat(AVATAR.sole), lips: mat(AVATAR.lips),
              eyes: mat(AVATAR.eyes), prop: mat("#8FA3B8", 0.7), wall: mat("#C9D4DF", 0.95),
              load: new T.MeshStandardMaterial({ color: lin("#7cc4ff"), roughness: 0.2, transparent: true, opacity: 0.75 }),
              cap: mat("#2b6bd1"), wood: mat("#9a6b43", 0.75) };
    function mesh(geo, m, parent) { var o = new T.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
    function ball(r, m, parent) { return mesh(new T.SphereGeometry(r, 24, 16), m, parent); }
    function bone(r, len, m, parent) { var o = mesh(new T.CylinderGeometry(r, r, len, 20), m, parent); o.position.y = -len / 2; return o; }
    function group(parent, x, y, z) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); parent.add(g); return g; }

    // T-shirt imprimé
    var sc = document.createElement("canvas"); sc.width = 1024; sc.height = 512;
    var shirtTex = new T.CanvasTexture(sc); shirtTex.encoding = T.sRGBEncoding; shirtTex.anisotropy = 4;
    function paintShirt() {
      var g = sc.getContext("2d"), font = "Outfit, system-ui, sans-serif";
      g.fillStyle = AVATAR.shirt; g.fillRect(0, 0, 1024, 512);
      g.fillStyle = AVATAR.print; g.textAlign = "center";
      g.font = "700 38px " + font; g.fillText(AVATAR.name[0], 768, 140); g.fillText(AVATAR.name[1], 768, 180);
      g.font = "400 20px " + font; g.fillText(AVATAR.title, 768, 212);
      g.font = "700 36px " + font; g.fillText(AVATAR.name[0], 256, 120);
      g.font = "700 62px " + font; g.fillText(AVATAR.name[1], 256, 190);
      shirtTex.needsUpdate = true;
    }
    paintShirt(); if (document.fonts) document.fonts.ready.then(paintShirt);

    /* Squelette : bassin → colonne → tête / épaules → coudes ; bassin → hanches → genoux → chevilles */
    var pelvis = group(scene); pelvis.rotation.order = "YXZ";
    var pm = mesh(new T.CylinderGeometry(0.155, 0.15, 0.16, 28), M.pants, pelvis); pm.scale.z = 0.72; pm.position.y = 0.03;
    var spine = group(pelvis); spine.rotation.order = "YXZ";
    var shirt = mesh(new T.CylinderGeometry(0.185, 0.16, 0.46, 40, 16, false, Math.PI / 2), new T.MeshStandardMaterial({ map: shirtTex, roughness: 0.9 }), spine);
    shirt.userData.base = shirt.geometry.attributes.position.array.slice();
    shirt.scale.z = 0.66; shirt.position.y = 0.29;
    var chestTop = mesh(new T.SphereGeometry(0.185, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.shirt, spine);
    chestTop.scale.set(1, 0.28, 0.66); chestTop.position.y = 0.52;
    mesh(new T.CylinderGeometry(0.048, 0.052, 0.11, 20), M.skin, spine).position.y = 0.58;

    var head = group(spine, 0, 0.72, 0);
    ball(0.12, M.skin, head).scale.set(0.92, 1.08, 1);
    [-1, 1].forEach(function (side) {
      var ear = ball(0.03, M.skin, head); ear.position.set(side * 0.112, 0, -0.005); ear.scale.set(0.45, 1, 0.8);
      ball(0.013, M.eyes, head).position.set(side * 0.04, 0.018, 0.108);
      var brow = mesh(new T.BoxGeometry(0.042, 0.009, 0.012), M.hair, head);
      brow.position.set(side * 0.041, 0.047, 0.11); brow.rotation.z = side * -0.12;
      mesh(new T.BoxGeometry(0.01, 0.06, 0.03), M.hair, head).position.set(side * 0.104, -0.002, 0.03);
    });
    var nose = ball(0.019, M.skin, head); nose.position.set(0, -0.008, 0.12); nose.scale.set(0.8, 1, 1.1);
    var hairTop = mesh(new T.SphereGeometry(0.1245, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.4), M.hair, head);
    hairTop.scale.set(0.95, 1.1, 1.03); hairTop.rotation.x = -0.32; hairTop.position.y = 0.006;
    var fadeCap = mesh(new T.SphereGeometry(0.1215, 40, 16, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.52), M.fade, head);
    fadeCap.scale.set(0.95, 1.095, 1.02); fadeCap.rotation.x = -0.45;
    var q1 = ball(0.07, M.hair, head); q1.scale.set(1.45, 0.42, 1.15); q1.position.set(0.018, 0.118, 0.035); q1.rotation.set(0.15, 0, -0.28);
    var q2 = ball(0.045, M.hair, head); q2.scale.set(1.3, 0.45, 1); q2.position.set(-0.045, 0.108, 0.07); q2.rotation.z = -0.35;
    mesh(new T.SphereGeometry(0.1235, 40, 16, Math.PI / 2 - 1.45, 2.9, Math.PI * 0.56, Math.PI * 0.36), M.hair, head).scale.set(0.93, 1.09, 1.02);
    mesh(new T.BoxGeometry(0.05, 0.012, 0.012), M.hair, head).position.set(0, -0.036, 0.121);
    mesh(new T.BoxGeometry(0.032, 0.007, 0.01), M.lips, head).position.set(0, -0.054, 0.124);

    function makeArm(side) {
      var sh = group(spine, side * LEN.shX, LEN.shY, 0); sh.rotation.order = "XZY";
      ball(0.068, M.shirt, sh); bone(0.06, 0.12, M.shirt, sh); bone(0.045, LEN.upper, M.skin, sh);
      var el = group(sh, 0, -LEN.upper, 0);
      ball(0.044, M.skin, el); bone(0.04, LEN.fore, M.skin, el);
      ball(0.047, M.skin, el).position.y = -LEN.fore;
      var load = new T.Group(); load.position.y = -LEN.fore; el.add(load); load.visible = false;
      var bottle = mesh(new T.CylinderGeometry(0.036, 0.036, 0.19, 20), M.load, load); bottle.rotation.z = Math.PI / 2;
      var cap = mesh(new T.CylinderGeometry(0.016, 0.016, 0.03, 12), M.cap, load); cap.rotation.z = Math.PI / 2; cap.position.x = 0.11;
      return { side: side, sh: sh, el: el, load: load };
    }
    function makeLeg(side) {
      var hip = group(pelvis, side * LEN.hipX, 0, 0); hip.rotation.order = "XZY";
      ball(0.078, M.pants, hip); bone(0.075, LEN.thigh, M.pants, hip);
      var knee = group(hip, 0, -LEN.thigh, 0);
      ball(0.066, M.pants, knee); bone(0.058, LEN.shank, M.pants, knee);
      var ankle = group(knee, 0, -LEN.shank, 0);
      ball(0.05, M.pants, ankle);
      mesh(new T.BoxGeometry(0.105, 0.028, 0.27), M.sole, ankle).position.set(0, -0.076, 0.055);
      mesh(new T.BoxGeometry(0.098, 0.07, 0.24), M.shoes, ankle).position.set(0, -0.03, 0.045);
      var toe = ball(0.049, M.shoes, ankle); toe.scale.set(1, 0.72, 1); toe.position.set(0, -0.043, 0.155);
      return { side: side, hip: hip, knee: knee, ankle: ankle };
    }
    var legs = { L: makeLeg(1), R: makeLeg(-1) };
    var arms = { L: makeArm(1), R: makeArm(-1) };

    var props = {
      step: mesh(new T.BoxGeometry(0.7, 0.18, 0.34), M.prop, scene),
      wall: mesh(new T.BoxGeometry(1.2, 2.1, 0.05), M.wall, scene),
      wallBack: mesh(new T.BoxGeometry(1.2, 2.1, 0.05), M.wall, scene),
      chair: new T.Group(),
      wallSide: mesh(new T.BoxGeometry(0.05, 2.1, 1.2), M.wall, scene)
    };
    props.wallSide.position.set(-0.62, 1.05, 0.05);
    scene.add(props.chair);
    mesh(new T.BoxGeometry(0.5, 0.05, 0.42), M.wood, props.chair).position.set(0, 0.425, -0.36);
    [[-0.22, -0.17], [0.22, -0.17], [-0.22, -0.55], [0.22, -0.55]].forEach(function (c) {
      mesh(new T.BoxGeometry(0.035, 0.42, 0.035), M.wood, props.chair).position.set(c[0], 0.2, c[1]);
    });
    mesh(new T.BoxGeometry(0.5, 0.45, 0.035), M.wood, props.chair).position.set(0, 0.67, -0.56);
    props.wallBack.position.set(0, 1.05, -0.585);
    props.step.position.set(0, 0.09, 0.42);
    props.wall.position.set(0, 1.05, 0.585);
    for (var k in props) props[k].visible = false;

    var view = { yaw: 0.6, yawGoal: 0.6 }, drag = null;
    canvas.addEventListener("pointerdown", function (e) { drag = e.clientX; });
    window.addEventListener("pointermove", function (e) { if (drag === null) return; view.yawGoal -= (e.clientX - drag) * 0.012; drag = e.clientX; });
    window.addEventListener("pointerup", function () { drag = null; });
    window.addEventListener("pointercancel", function () { drag = null; });

    return { T: T, canvas: canvas, renderer: renderer, scene: scene, camera: camera, pelvis: pelvis, spine: spine, shirt: shirt, curveNow: 0,
             head: head, legs: legs, arms: arms, props: props, view: view };
  }

  /* ── Cinématique ── */
  var D2R = Math.PI / 180;
  function V(a) { return new R.T.Vector3(a[0], a[1], a[2]); }
  function localize(g, worldQ) {
    var pq = new R.T.Quaternion(); g.parent.getWorldQuaternion(pq);
    g.quaternion.copy(pq.invert().multiply(worldQ));
  }
  // Chaîne à deux segments : amène l'extrémité sur la cible, genou / coude orienté vers `pole`
  function ik2(upper, lower, target, a, b, pole, isArm) {
    var T = R.T, P = new T.Vector3(); upper.getWorldPosition(P);
    var d = target.clone().sub(P), D = Math.min(Math.max(d.length(), 0.001), (a + b) * 0.999); d.normalize();
    var alpha = Math.acos(Math.max(-1, Math.min(1, (a * a + D * D - b * b) / (2 * a * D))));
    var pp = pole.clone().sub(d.clone().multiplyScalar(pole.dot(d)));
    if (pp.lengthSq() < 1e-6) pp = new T.Vector3(0, 0, 1).sub(d.clone().multiplyScalar(d.z));
    pp.normalize();
    var dirA = d.clone().multiplyScalar(Math.cos(alpha)).add(pp.clone().multiplyScalar(Math.sin(alpha)));
    var inner = Math.acos(Math.max(-1, Math.min(1, (a * a + b * b - D * D) / (2 * a * b))));
    var y = dirA.clone().negate(), z = isArm ? pp.clone().negate() : pp.clone();
    z.sub(y.clone().multiplyScalar(z.dot(y))).normalize();
    var x = new T.Vector3().crossVectors(y, z);
    localize(upper, new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)));
    lower.rotation.set(isArm ? -(Math.PI - inner) : Math.PI - inner, 0, 0);
    upper.updateMatrixWorld(true);
  }
  function footQuat(yaw, lift) {
    return new R.T.Quaternion().setFromEuler(new R.T.Euler((lift || 0) * D2R, (yaw || 0) * D2R, 0, "YXZ"));
  }
  function ankleFromBall(f) {
    return V(f.at).sub(new R.T.Vector3(0, -0.09, 0.12).applyQuaternion(footQuat(f.yaw, f.lift)));
  }

  // Hauteur du bassin quand elle vaut "auto" : la jambe la plus contrainte est presque tendue
  function autoY(p) {
    var py = 9;
    ["L", "R"].forEach(function (s) {
      var f = p[s] && p[s].foot; if (!f) return;
      var a = ankleFromBall(f), hx = (s === "L" ? 1 : -1) * LEN.hipX;
      var dx = a.x - hx, dz = a.z - p.pelvis.p[2], reach = (LEN.thigh + LEN.shank) * 0.9985;
      py = Math.min(py, a.y + Math.sqrt(Math.max(0.01, reach * reach - dx * dx - dz * dz)));
    });
    return py;
  }
  function withY(p) {
    if (p.pelvis.p[1] !== "auto") return p;
    var q = JSON.parse(JSON.stringify(p)); q.pelvis.p[1] = autoY(p); return q;
  }

  function applyPose(p) {
    var T = R.T, py = p.pelvis.p[1];
    if (py === "auto") py = autoY(p);
    R.pelvis.position.set(p.pelvis.p[0], py, p.pelvis.p[2]);
    R.pelvis.rotation.set(p.pelvis.r[0] * D2R, p.pelvis.r[1] * D2R, p.pelvis.r[2] * D2R);
    var sp = p.spine || [0, 0, 0];
    R.spine.rotation.set(sp[0] * D2R, sp[2] * D2R, sp[1] * D2R);
    R.head.rotation.set((p.head || 0) * D2R, (p.headY || 0) * D2R, (p.headZ || 0) * D2R);
    // Courbure du dos : + = cyphose (dos rond), − = lordose (dos creux)
    var cv = p.curve || 0;
    if (Math.abs(cv - R.curveNow) > 0.002) {
      var pos = R.shirt.geometry.attributes.position, b = R.shirt.userData.base;
      for (var i = 0; i < pos.count; i++) {
        var y = b[i * 3 + 1], u = y / 0.23;
        pos.setZ(i, b[i * 3 + 2] - cv * 0.095 * (1 - u * u));
      }
      pos.needsUpdate = true; R.shirt.geometry.computeVertexNormals(); R.curveNow = cv;
    }
    R.pelvis.updateMatrixWorld(true);

    ["L", "R"].forEach(function (s) {
      var g = R.legs[s], L = p[s] || {}, sg = g.side;
      if (L.foot) {
        var f = L.foot, yaw = (f.yaw || 0) * D2R;
        var pole = f.pole ? V(f.pole) : new T.Vector3(Math.sin(yaw), 0.05, Math.cos(yaw));
        ik2(g.hip, g.knee, ankleFromBall(f), LEN.thigh, LEN.shank, pole, false);
        g.knee.updateMatrixWorld(true);
        localize(g.ankle, footQuat(f.yaw, f.lift));
      } else {
        var a = L.ang || [0, 0, 0, 0, 0];
        g.hip.rotation.set(-a[0] * D2R, sg * a[2] * D2R, sg * a[1] * D2R);
        g.knee.rotation.set(a[3] * D2R, 0, 0);
        g.ankle.rotation.set(-a[4] * D2R, 0, 0);
      }
    });
    ["L", "R"].forEach(function (s) {
      var g = R.arms[s], A = p[s + "A"] || {}, sg = g.side;
      if (A.hand) {
        ik2(g.sh, g.el, V(A.hand.at), LEN.upper, LEN.fore, V(A.hand.pole || [sg, -1, -0.5]), true);
      } else {
        var a = A.ang || [0, 0, 0, 0];
        g.sh.rotation.set(-a[0] * D2R, sg * a[2] * D2R, sg * a[1] * D2R);
        g.el.rotation.set(-a[3] * D2R, 0, 0);
      }
    });
  }

  /* ── Poses : miroir (côté droit) et interpolation ── */
  function mirror(p) {
    var m = JSON.parse(JSON.stringify(p));
    var sw = function (a, b) { var t = m[a]; m[a] = m[b]; m[b] = t; };
    sw("L", "R"); sw("LA", "RA");
    m.pelvis.p[0] = -m.pelvis.p[0]; m.pelvis.r[1] = -m.pelvis.r[1]; m.pelvis.r[2] = -m.pelvis.r[2];
    if (m.spine) { m.spine[1] = -m.spine[1]; m.spine[2] = -m.spine[2]; }
    if (m.headY) m.headY = -m.headY; if (m.headZ) m.headZ = -m.headZ;
    ["L", "R", "LA", "RA"].forEach(function (k) {
      var e = m[k]; if (!e) return;
      var t = e.foot || e.hand;
      if (t) { t.at[0] = -t.at[0]; if (t.pole) t.pole[0] = -t.pole[0]; if (e.foot) t.yaw = -(t.yaw || 0); }
    });
    return m;
  }
  function lerp(a, b, k) {
    if (typeof a === "number" && typeof b === "number") return a + (b - a) * k;
    if (Array.isArray(a) && Array.isArray(b)) return a.map(function (v, i) { return lerp(v, b[i], k); });
    if (a && b && typeof a === "object") { var o = {}; for (var key in b) o[key] = key in a ? lerp(a[key], b[key], k) : b[key]; return o; }
    return k < 0.5 ? a : b;
  }
  function blend(a, b, k) {
    var bothAuto = a.pelvis.p[1] === "auto" && b.pelvis.p[1] === "auto";
    // Hauteur du bassin convertie en nombre pour que la descente soit progressive
    // (avant : la hauteur restait « auto » pendant tout le mouvement, donc jambes tendues jusqu'au dernier instant)
    var p = lerp(withY(a), withY(b), k);
    ["L", "R"].forEach(function (s) { // un pied qui se déplace se lève (passe au-dessus de la marche)
      var fa = a[s] && a[s].foot, fb = b[s] && b[s].foot;
      if (fa && fb && Math.hypot(fa.at[0] - fb.at[0], fa.at[1] - fb.at[1], fa.at[2] - fb.at[2]) > 0.05)
        p[s].foot.at[1] += 4 * k * (1 - k) * 0.13;
    });
    if (bothAuto) p.pelvis.p[1] = "auto";
    return p;
  }

  /* ── Lecture ── */
  var def = null, current = null, tween = null, raf = 0, host = null, paused = false, lastNow = 0, curSide = "L";
  function curWeek() { try { return window.KineProgress ? KineProgress.week() : 1; } catch (e) { return 1; } }
  function startPose(d) { return d.easyUntil && curWeek() <= d.easyUntil && d.poses[d.start + "K"] ? d.start + "K" : d.start; }
  function placeProps(d) {
    if (!R) return;
    var c = (d && d.chair) || { z: 0, turn: false };
    R.props.chair.rotation.y = c.turn ? Math.PI : 0; R.props.chair.position.z = c.z || 0;
  }
  function showLoad(d, side) {
    if (!R) return;
    placeProps(d);
    R.props.wallSide.position.x = side === "R" ? 0.62 : -0.62;
    var arm = d && d.load ? (side === "R" ? (d.load === "R" ? "L" : "R") : d.load) : null;
    R.arms.L.load.visible = arm === "L"; R.arms.R.load.visible = arm === "R";
  }
  var easeInOut = function (x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (paused && tween) tween.start += now - lastNow; // figé pendant la pause
    lastNow = now;
    if (tween) {
      var k = Math.min(1, (now - tween.start) / tween.dur);
      current = blend(tween.from, tween.to, easeInOut(k));
      if (k >= 1) { current = tween.to; tween = null; }
    }
    applyPose(current);
    var v = R.view;
    v.yaw += (v.yawGoal - v.yaw) * 0.12;
    placeCamera(def, v.yaw);
    R.renderer.render(R.scene, R.camera);
  }
  function placeCamera(d0, yaw) {
    var c = d0.camera || {};
    var d = c.dist || 4.1, pitch = c.pitch || 0.15, ty = c.ty != null ? c.ty : 0.88, tz = c.tz || 0;
    R.camera.position.set(d * Math.sin(yaw) * Math.cos(pitch), ty + d * Math.sin(pitch), tz + d * Math.cos(yaw) * Math.cos(pitch));
    R.camera.lookAt(0, ty, tz);
  }
  function resize() {
    var w = R.canvas.clientWidth, h = R.canvas.clientHeight;
    if (!w || !h) return;
    R.renderer.setSize(w, h, false); R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  }

  window.KineAvatar = {
    info: info,
    plan: plan,
    supports: function (name) { return !!(EX[name] && EX[name].poses); },
    hasSteps: function (name) { return !!(EX[name] && EX[name].steps); },
    // Mouvements supplémentaires (échauffements, étirements) déclarés par kine-routines.js
    register: function (name, d) { EX[name] = d; },
    lib: { merge: merge, STAND: STAND, feet: feet, step: step, QUAD: QUAD, FOREARMS: FOREARMS,
           SUPINE_FEET: SUPINE_FEET, SUPINE_HANDS: SUPINE_HANDS, BRIDGE_DOWN: BRIDGE_DOWN },
    startOf: function (name) { var d = EX[name]; return d && d.poses ? startPose(d) : null; },

    show: function (container, name) {
      var d = EX[name];
      if (!d || !d.poses || !window.THREE) { loadThree().catch(function () {}); return false; }
      if (!R) { R = build(); if (!R) return false; }
      if (host === container && def === d && raf) return true;
      def = d; current = d.poses[startPose(d)]; tween = null; curSide = "L"; showLoad(d, "L");
      for (var k in R.props) R.props[k].visible = (d.props || []).indexOf(k) >= 0;
      R.view.yaw = R.view.yawGoal = d.camera && d.camera.yaw != null ? d.camera.yaw : 0.6;
      container.innerHTML = ""; container.appendChild(R.canvas); host = container;
      resize();
      if (!raf) raf = requestAnimationFrame(frame);
      return true;
    },

    // L'avatar atteint la pose de l'étape en exactement `dur` secondes
    step: function (s) {
      if (!def || !raf || !s || !s.pose || !def.poses[s.pose]) return;
      var to = def.poses[s.pose], side = s.side === "R" ? "R" : "L";
      var dur = def.snapSideChange && side !== curSide ? 0.05 : s.dur;
      curSide = side; showLoad(def, side);
      tween = { from: current, to: side === "R" ? mirror(to) : to, start: performance.now(), dur: Math.max(0.05, dur) * 1000 };
    },

    pause: function (on) { paused = !!on; },

    // Vue de profil pour contrôler les amplitudes : image + position des articulations à l'écran
    debugView: function (name, poseName, side, px, fromPose, k, natural) {
      var d = EX[name]; if (!d || !d.poses || !window.THREE) return null;
      if (!R) { R = build(); if (!R) return null; }
      var size = px || 700, T = R.T;
      for (var k0 in R.props) R.props[k0].visible = (d.props || []).indexOf(k0) >= 0;
      var p = d.poses[poseName]; if (side === "R") p = mirror(p);
      if (fromPose) { var f0 = d.poses[fromPose]; if (side === "R") f0 = mirror(f0); p = blend(f0, p, k); }
      applyPose(p); R.pelvis.updateMatrixWorld(true);
      R.renderer.setSize(size, size, false); R.camera.aspect = 1; R.camera.updateProjectionMatrix();
      var c = d.camera || {}, ty = c.ty != null ? c.ty : 0.8, tz = c.tz || 0, dist = (c.dist || 4.1) * 0.9;
      if (natural) placeCamera(d, c.yaw != null ? c.yaw : 0.6); else { R.camera.position.set(dist, ty + 0.05, tz); R.camera.lookAt(0, ty, tz); }
      R.camera.updateMatrixWorld(true);
      R.renderer.render(R.scene, R.camera);
      var pt = function (g) { var v = new T.Vector3(); g.getWorldPosition(v); v.project(R.camera); return [(v.x + 1) / 2 * size, (1 - v.y) / 2 * size]; };
      var sh = new T.Vector3(); R.arms.L.sh.getWorldPosition(sh); sh.x = 0; var shp = sh.clone().project(R.camera);
      var legs = {};
      ["L", "R"].forEach(function (s2) { legs[s2] = { hip: pt(R.legs[s2].hip), knee: pt(R.legs[s2].knee), ankle: pt(R.legs[s2].ankle) }; });
      var armsPts = {};
      ["L", "R"].forEach(function (s2) {
        var a = R.arms[s2], hq = new T.Quaternion(); a.el.getWorldQuaternion(hq);
        var E = new T.Vector3(); a.el.getWorldPosition(E);
        var Hn = new T.Vector3(0, -LEN.fore, 0).applyQuaternion(hq).add(E), S = new T.Vector3(); a.sh.getWorldPosition(S);
        var q3 = function (v) { var c = v.clone().project(R.camera); return [(c.x + 1) / 2 * size, (1 - c.y) / 2 * size]; };
        armsPts[s2] = { sh: q3(S), el: q3(E), hand: q3(Hn) };
      });
      showLoad(d, side === "R" ? "R" : "L");
      R.renderer.render(R.scene, R.camera);
      var url = R.canvas.toDataURL("image/png");
      if (def) { for (var k2 in R.props) R.props[k2].visible = (def.props || []).indexOf(k2) >= 0; showLoad(def, curSide); applyPose(current); }
      if (host) resize();
      return { img: url, legs: legs, arms: armsPts, shoulder: [(shp.x + 1) / 2 * size, (1 - shp.y) / 2 * size] };
    },

    // Mesure des angles articulaires d'une pose (contrôle des amplitudes)
    measure: function (name, poseName, side) {
      var d = EX[name]; if (!d || !d.poses || !window.THREE) return null;
      if (!R) { R = build(); if (!R) return null; }
      var p = d.poses[poseName]; if (side === "R") p = mirror(p);
      applyPose(p); R.pelvis.updateMatrixWorld(true);
      var T = R.T, w = function (g) { var v = new T.Vector3(); g.getWorldPosition(v); return v; };
      var q = new T.Quaternion(); R.spine.getWorldQuaternion(q);
      var up = new T.Vector3(0, 1, 0).applyQuaternion(q), fwd = new T.Vector3(0, 0, 1).applyQuaternion(q);
      var deg = function (a, b) { return Math.round(a.angleTo(b) * 180 / Math.PI); };
      var out = { tronc: Math.round(Math.acos(Math.max(-1, Math.min(1, up.y))) * 180 / Math.PI) };
      ["L", "R"].forEach(function (s2) {
        var g = R.legs[s2], H = w(g.hip), K = w(g.knee), A = w(g.ankle);
        var thigh = K.clone().sub(H), shank = A.clone().sub(K);
        var hip = deg(thigh, up.clone().negate()) * (thigh.dot(fwd) >= 0 ? 1 : -1);
        var aq = new T.Quaternion(); g.ankle.getWorldQuaternion(aq);
        var foot = new T.Vector3(0, 0, 1).applyQuaternion(aq);
        out[s2] = { hanche: hip, genou: deg(thigh, shank), cheville: 90 - deg(shank.clone().negate(), foot),
                    genouSol: Math.round((K.y - 0.066) * 100) + " cm" };
      });
      ["L", "R"].forEach(function (s2) {
        var a = R.arms[s2], S = w(a.sh), E = w(a.el);
        var hq = new T.Quaternion(); a.el.getWorldQuaternion(hq);
        var Hn = new T.Vector3(0, -LEN.fore, 0).applyQuaternion(hq).add(E);
        var upper = E.clone().sub(S), fore = Hn.clone().sub(E);
        out[s2].coude = deg(upper, fore);
        out[s2].avantBrasVertical = deg(fore, new T.Vector3(0, 1, 0));
        out[s2].brasTronc = deg(upper, up.clone().negate());
      });
      if (def) applyPose(current);
      return out;
    },

    // Image fixe de l'exercice (vignette de l'aperçu), sans perturber l'animation en cours
    snapshot: function (name, size) {
      var d = EX[name];
      if (!d || !d.poses || !window.THREE) { loadThree().catch(function () {}); return null; }
      if (!R) { R = build(); if (!R) return null; }
      var px = size || 160;
      for (var k in R.props) R.props[k].visible = (d.props || []).indexOf(k) >= 0;
      var th = d.thumb || d.start; if (d.easyUntil && curWeek() <= d.easyUntil && d.poses[th + "K"]) th = th + "K";
      applyPose(d.poses[th]);
      R.renderer.setSize(px, px, false); R.camera.aspect = 1; R.camera.updateProjectionMatrix();
      placeCamera(d, d.camera && d.camera.yaw != null ? d.camera.yaw : 0.6);
      R.renderer.render(R.scene, R.camera);
      var url = R.canvas.toDataURL("image/png");
      if (def) { for (var k2 in R.props) R.props[k2].visible = (def.props || []).indexOf(k2) >= 0; }
      if (host) resize();
      return url;
    },

    hide: function () {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; host = null; tween = null; paused = false;
      if (R && R.canvas.parentNode) R.canvas.parentNode.removeChild(R.canvas);
    }
  };
})();
