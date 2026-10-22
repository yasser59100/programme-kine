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


  /* ════════ LOT 2 : mouvements propres à la salle ════════ */
  // Mollets à la presse : jambes tendues, seul l'avant du pied pousse le plateau
  var CALF = function (lift) {
    var b = PRESS(0.05); b.L.foot.lift = lift; b.R.foot.lift = lift; b.L.foot.pole = [0.1, 1, 0.3]; b.R.foot.pole = [-0.1, 1, 0.3]; return b;
  };
  reg("Mollets à la presse", {
    camera: { yaw: 1.35, dist: 4.2, ty: 0.65, pitch: 0.2 }, props: ["legPress"], tool: "legPlate", start: "dn", thumb: "up",
    poses: { dn: CALF(-50), up: CALF(-100) },
    steps: [step("up", 1.2, "On pousse sur l'avant des pieds", "On pousse avec l'avant des pieds", "up"), step("up", 1, "On tient en haut", "On tient", "hold"), step("dn", 2.5, "Descente lente, talons vers soi", "On redescend lentement", "down")]
  });
  // Presse à une jambe : pied droit au centre du plateau, l'autre posé sur le cadre
  var PRESS1 = function (k) {
    var b = PRESS(k); b.R.foot.at[0] = -0.04; b.L = { foot: { at: [0.3, 0.32, 0.12], yaw: 10, lift: 0 } }; return b;
  };
  reg("Presse à une jambe", {
    camera: { yaw: 1.2, dist: 4.2, ty: 0.65, pitch: 0.25 }, props: ["legPress"], tool: "legPlate", plateFoot: "R", start: "up", thumb: "down",
    poses: { up: PRESS1(0), down: PRESS1(0.9) },
    steps: [step("down", 2.5, "Descente contrôlée, genou dans l'axe", "On descend, genou dans l'axe du pied", "down"), step("up", 1.5, "On pousse", "On pousse", "up")]
  });
  // Adduction à la poulie basse : la jambe côté poulie revient vers l'intérieur
  var ADDP = function (abd) {
    return merge(STAND(0.1, 0), { pelvis: { p: [0, 0.925, 0], r: [0, 0, 0] }, L: { ang: [0, 4, 0, 4, 0] }, R: { ang: [abd < 0 ? 6 : 0, abd, 0, 2, 0] },
      RA: { hand: { at: [-0.6, 1.05, 0.0], pole: [0, -1, 0] } }, spine: [0, 0, 0] });
  };
  reg("Adduction de hanche à la poulie", {
    camera: { yaw: 0.2, dist: 4.0, ty: 0.75 }, props: ["pulley"], pulley: { x: -0.7, z: 0.0, h: 0.12 }, cable: true, bands: [["RA", [-0.64, 0.12, 0.0]]],
    start: "out", thumb: "in",
    poses: { out: ADDP(26), in: ADDP(-10) },
    steps: [step("in", 1.5, "La jambe passe devant l'autre", "La jambe revient vers l'intérieur", "up"), step("in", 0.8, "On tient", null, "hold"), step("out", 2.5, "Retour lent", "On revient lentement", "down")]
  });
  // Kickback fessier à la poulie : face à la poulie, la jambe part en arrière
  var KICK = function (ext) {
    return { pelvis: { p: [0, 0.93, 0], r: [14, 0, 0] }, spine: [8, 0, 0], head: -6,
      L: { foot: { at: [0.1, 0, 0.1], yaw: 4 } }, R: { ang: [ext, 3, 0, ext < 0 ? 8 : 30, 0] },
      LA: { hand: { at: [0.1, 1.08, 0.5], pole: [1, -0.4, -0.5] } }, RA: { hand: { at: [-0.1, 1.08, 0.5], pole: [-1, -0.4, -0.5] } } };
  };
  reg("Kickback fessier à la poulie", {
    camera: { yaw: 1.4, dist: 4.0, ty: 0.75 }, props: ["pulley"], pulley: { x: 0, z: 0.62, h: 0.12 }, cable: true, bands: [["RA", [0, 0.12, 0.56]]],
    start: "fwd", thumb: "back",
    poses: { fwd: KICK(12), back: KICK(-28) },
    steps: [step("back", 1.5, "La jambe part en arrière, fessier serré", "La jambe part en arrière, on serre le fessier", "up"), step("back", 0.8, "On tient", null, "hold"), step("fwd", 2.2, "Retour lent", "On revient lentement", "down")]
  });
  // Extension lombaire au banc à 45° : le buste descend en pliant les hanches, puis remonte dans l'alignement des jambes
  var HYP = function (down) {
    return merge({ pelvis: { p: [0, 0.76, 0.1], r: [down ? 100 : 45, 0, 0] }, spine: [down ? 18 : 0, 0, 0], head: down ? 10 : 0,
      L: { foot: { at: [0.12, 0.13, -0.5], yaw: 4, lift: 45 } }, R: { foot: { at: [-0.12, 0.13, -0.5], yaw: -4, lift: 45 } } }, lib.CROSS);
  };
  reg("Extension lombaire au banc à 45°", {
    camera: { yaw: 1.4, dist: 4.0, ty: 0.7 }, props: ["hyperBench"], start: "up", thumb: "down",
    poses: { up: HYP(false), down: HYP(true) },
    steps: [step("down", 2.2, "Le buste descend, dos neutre", "Le buste descend, le dos reste droit", "down"), step("up", 1.5, "On remonte avec les fessiers", "On remonte jusqu'à l'alignement", "up"), step("up", 0.8, "Aligné, sans cambrer", null, "hold")]
  });
  // Développé landmine à un bras : barre ancrée au sol devant, poussée vers l'avant et le haut
  var LMP = function (up) {
    return { pelvis: { p: [0, 0.9, 0], r: [4, 0, 0] }, spine: [8, 0, 0], head: 0,
      L: { foot: { at: [0.13, 0, 0.28], yaw: 4 } }, R: { foot: { at: [-0.13, 0, -0.22], yaw: -6, lift: 20 } },
      LA: { ang: [10, 12, 0, 20] }, RA: { hand: { at: up ? [-0.06, 1.66, 0.62] : [-0.14, 1.36, 0.16], pole: up ? [-1, -0.3, -0.3] : [-0.6, -1, 0.3] } } };
  };
  reg("Développé landmine à un bras", {
    camera: { yaw: 0.95, dist: 4.4, ty: 0.9, tz: 0.5 }, tool: "landmine", landmine: [0, 0.03, 1.8], start: "down", thumb: "up",
    poses: { down: LMP(false), up: LMP(true) },
    steps: [step("up", 1.5, "On pousse vers l'avant et le haut", "On pousse vers l'avant", "up"), step("down", 2.2, "Retour à l'épaule", "On revient à l'épaule", "down")]
  });
  // Poussée de traîneau : buste penché, mains sur les montants, petits pas puissants
  var SLED = function (L) {
    var f = L ? 1 : -1;
    return { pelvis: { p: [0, 0.8, 0], r: [38, 0, 0] }, spine: [12, 0, 0], head: -14,
      L: { foot: { at: [0.12, 0, L ? 0.2 : -0.48], yaw: 2, lift: L ? 0 : 40 } }, R: { foot: { at: [-0.12, 0, L ? -0.48 : 0.2], yaw: -2, lift: L ? 40 : 0 } },
      LA: { hand: { at: [0.25, 0.98, 0.46], pole: [1, -1, -0.3] } }, RA: { hand: { at: [-0.25, 0.98, 0.46], pole: [-1, -1, -0.3] } } };
  };
  reg("Poussée de traîneau", {
    noIso: true, timed: { seconds: 20 }, camera: { yaw: 1.2, dist: 4.4, ty: 0.7 }, props: ["sled"], sled: { z: 0.72 }, start: "a", thumb: "a",
    poses: { a: SLED(true), b: SLED(false) },
    steps: [step("b", 0.55, "On pousse, petits pas puissants", null, "up"), step("a", 0.55, "Buste gainé, dos droit", null, "up")]
  });
  // Triceps à la poulie haute : coudes collés au corps, on tend les avant-bras
  var PUSHD = function (ext) {
    return merge(STAND(0.12, 4), { pelvis: { p: [0, "auto", 0], r: [6, 0, 0] }, spine: [6, 0, 0],
      LA: { hand: { at: ext ? [0.12, 0.84, 0.22] : [0.1, 1.16, 0.3], pole: [0.4, -0.2, -1] } }, RA: { hand: { at: ext ? [-0.12, 0.84, 0.22] : [-0.1, 1.16, 0.3], pole: [-0.4, -0.2, -1] } } });
  };
  reg("Triceps à la poulie haute", {
    camera: { yaw: 1.0, dist: 4.0, ty: 1.0 }, props: ["pulley"], pulley: { x: 0, z: 0.55, h: 2.05 }, cable: true, bands: [["LH", [0, 2.05, 0.47]], ["RH", [0, 2.05, 0.47]]],
    start: "bent", thumb: "ext",
    poses: { bent: PUSHD(false), ext: PUSHD(true) },
    steps: [step("ext", 1.2, "On tend les bras, coudes fixes", "On tend, les coudes ne bougent pas", "up"), step("ext", 0.6, "On serre", null, "hold"), step("bent", 2, "Retour lent", "On remonte lentement", "down")]
  });
  // Tirage bras tendus à la poulie haute : le grand dorsal ramène les bras tendus vers les cuisses
  var SAP = function (dn) {
    return merge(STAND(0.14, 4), { pelvis: { p: [0, "auto", -0.05], r: [22, 0, 0] }, spine: [6, 0, 0], head: -6,
      LA: { hand: { at: dn ? [0.2, 0.86, 0.32] : [0.2, 1.62, 0.66], pole: [1, 0, -0.4] } }, RA: { hand: { at: dn ? [-0.2, 0.86, 0.32] : [-0.2, 1.62, 0.66], pole: [-1, 0, -0.4] } } });
  };
  reg("Tirage bras tendus à la poulie", {
    camera: { yaw: 1.3, dist: 4.3, ty: 1.0 }, props: ["pulley"], pulley: { x: 0, z: 0.95, h: 2.1 }, cable: true, tool: "latbar", bands: [["LH", [0.04, 2.1, 0.87]], ["RH", [-0.04, 2.1, 0.87]]],
    start: "up", thumb: "dn",
    poses: { up: SAP(false), dn: SAP(true) },
    steps: [step("dn", 1.5, "Bras tendus jusqu'aux cuisses", "On ramène les bras tendus vers les cuisses", "up"), step("dn", 0.6, "On serre", null, "hold"), step("up", 2.2, "Remontée lente", "On remonte lentement", "down")]
  });

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
    E("Mollets à la presse", 1, ["presse à cuisses"], "3 séries de 15",
      "Assis dans la presse, jambes presque tendues, seulement l'avant des pieds sur le bas du plateau, talons dans le vide. Pousse avec l'avant des pieds le plus loin possible, tiens 1 seconde, puis laisse revenir lentement les talons vers toi.",
      "Les genoux restent légèrement déverrouillés, seule la cheville bouge.", "On ne plie pas les genoux pour pousser.",
      "Descente en 3 secondes : excellent pour le tendon d'Achille, selon l'avis de ton kiné.", "Arrêt si douleur au tendon d'Achille ou sous le pied."),
    E("Presse à une jambe", 2, ["presse à cuisses"], "3 séries de 10 par jambe",
      "Comme la presse à cuisses, mais un seul pied au centre du plateau, l'autre posé à côté. Descends en contrôle, genou dans l'axe du pied, puis pousse. Change de jambe.",
      "Le genou reste dans l'axe du pied, le bassin reste plaqué.", "Le genou ne rentre pas vers l'intérieur et les fesses ne décollent pas.",
      "Commence par la jambe la plus faible et fais autant de répétitions avec l'autre : c'est un bon repère de l'écart entre les deux.", "Arrêt si douleur dans le genou ou la hanche."),
    E("Adduction de hanche à la poulie", 1, ["poulie basse", "sangle de cheville"], "3 séries de 12 par jambe",
      "De côté, la poulie du côté de la jambe qui travaille, sangle à la cheville, une main sur le montant. Ramène la jambe vers l'intérieur jusqu'à passer devant l'autre, puis laisse-la revenir lentement.",
      "Le bassin reste face à l'avant, le buste droit.", "On ne tourne pas le bassin pour aller plus loin.",
      "Les adducteurs protègent l'aine : utile au football, au tennis et dans tous les sports de pivot.", "Arrêt si douleur dans l'aine."),
    E("Kickback fessier à la poulie", 1, ["poulie basse", "sangle de cheville"], "3 séries de 12 par jambe",
      "Face à la poulie, sangle à la cheville, mains sur le montant, buste légèrement penché. Pousse la jambe en arrière en serrant le fessier, sans cambrer, puis reviens lentement.",
      "C'est la fesse qui pousse, le bas du dos reste immobile.", "On ne cambre pas pour monter la jambe plus haut.",
      "Petite amplitude bien contrôlée plutôt qu'un grand balancement.", "Arrêt si douleur au bas du dos ou à la hanche."),
    E("Extension lombaire au banc à 45°", 2, ["banc à lombaires à 45°"], "3 séries de 12",
      "Hanches sur l'appui, pieds calés, bras croisés sur la poitrine. Descends le buste en pliant les hanches, dos neutre, puis remonte jusqu'à être aligné avec les jambes, pas plus haut.",
      "On remonte jusqu'à l'alignement, en serrant les fessiers.", "On ne cambre pas en haut.",
      "Plus dur : un disque contre la poitrine. Excellent pour un dos qui porte.", "Arrêt si douleur dans le bas du dos ou dans une jambe."),
    E("Développé landmine à un bras", 2, ["barre ancrée au sol (landmine)", "un disque"], "3 séries de 10 par bras",
      "Debout, un pied devant, le bout de la barre dans une main à hauteur d'épaule. Pousse la barre vers l'avant et le haut jusqu'à tendre le bras, puis reviens à l'épaule en contrôle.",
      "Le buste reste gainé, l'omoplate accompagne le bras.", "On ne se penche pas en arrière pour pousser.",
      "Souvent mieux toléré que le développé au-dessus de la tête : une bonne étape de retour au sport pour l'épaule.", "Arrêt si douleur dans l'épaule."),
    E("Poussée de traîneau", 2, ["traîneau", "disques"], "4 fois 15 mètres",
      "Mains sur les montants, buste penché et gainé, bras presque tendus. Pousse le traîneau à petits pas puissants, en appui sur l'avant des pieds, sans arrondir le dos.",
      "Petits pas rapides, on pousse avec les jambes.", "Le dos ne s'arrondit pas et les bras ne plient pas.",
      "Pas de phase de freinage : très bien toléré par les genoux, idéal pour le retour au sport.", "Arrêt si douleur au genou ou au dos."),
    E("Triceps à la poulie haute", 1, ["poulie haute", "corde ou barre"], "3 séries de 12",
      "Face à la poulie, coudes collés au corps et pliés. Tends les avant-bras vers le bas jusqu'aux cuisses, tiens une seconde, puis remonte lentement jusqu'à 90°.",
      "Les coudes ne bougent pas, seuls les avant-bras descendent.", "On ne s'aide pas du buste.",
      "Avec la corde, écarte les mains en bas.", "Arrêt si douleur au coude."),
    E("Tirage bras tendus à la poulie", 1, ["poulie haute", "barre droite"], "3 séries de 12",
      "Face à la poulie haute, buste un peu penché, bras tendus devant toi. Ramène la barre vers les cuisses en gardant les bras tendus, serre, puis remonte lentement.",
      "Les bras restent tendus, les épaules basses.", "On ne plie pas les coudes pour tirer.",
      "Travaille le grand dorsal sans charger l'épaule au-dessus de la tête : utile en rééducation de l'épaule.", "Arrêt si douleur dans l'épaule."),
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
