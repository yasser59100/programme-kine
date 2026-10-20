/* ═══════════════════════════════════════════════════════════════
   KinéForce — Récupération : étirements et auto-massage au rouleau
   Un 3e onglet dans « Exercices » : enchaînements guidés tout prêts,
   rouleau de massage (zone par zone) et étirements, joués par Yass
   avec le lecteur des routines (minuteur, voix, changement de côté).
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib || !window.KineRoutine || !KineRoutine.addMove) return;
  var step = KineAvatar.lib.step;
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function H(x, y, z, px, py, pz) { return { hand: { at: [x, y, z], pole: [px, py, pz] } }; }
  function F(x, y, z, o) { var f = { at: [x, y, z], yaw: 0 }; for (var k in (o || {})) f[k] = o[k]; return { foot: f }; }
  function roll(a, b, t) { return [step(a, t || 2.4), step(b, t || 2.4)]; }   // va-et-vient lent sur le rouleau

  /* ── 1. Yass sur le rouleau (le rouleau reste au sol, le corps glisse dessus) ── */
  var SIDE = { yaw: 1.35, pitch: 0.22, dist: 3.6, ty: 0.28, tz: 0 };
  function quad(z) { return { pelvis: { p: [0, 0.215, z], r: [80, 0, 0] }, spine: [-4, 0, 0], head: -12, L: { ang: [-6, 4, 0, 0, -10] }, R: { ang: [-6, 4, 0, 0, -10] }, LA: H(0.13, 0.047, 0.72 + z, 0.2, -1, -0.2), RA: H(-0.13, 0.047, 0.72 + z, -0.2, -1, -0.2) }; }
  function ham(z) { return { pelvis: { p: [0, 0.175, z], r: [-24, 0, 0] }, spine: [2, 0, 0], head: 22, L: { ang: [66, 4, 0, 0, 10] }, R: { ang: [66, 4, 0, 0, 10] }, LA: H(0.2, 0.047, z - 0.3, 0.4, 0.3, -0.6), RA: H(-0.2, 0.047, z - 0.3, -0.4, 0.3, -0.6) }; }
  function calf(z) { return { pelvis: { p: [0, 0.185, z], r: [-24, 0, 0] }, spine: [2, 0, 0], head: 22, L: { ang: [84, 4, 0, 0, 15] }, R: { ang: [84, 4, 0, 0, 15] }, LA: H(0.2, 0.047, z - 0.3, 0.4, 0.3, -0.6), RA: H(-0.2, 0.047, z - 0.3, -0.4, 0.3, -0.6) }; }
  function glute(z) { return { pelvis: { p: [0.06, 0.25, z], r: [-25, 0, 12] }, spine: [0, 0, -6], head: 6, L: F(0.2, 0, 0.45 + z), R: { ang: [78, 35, 60, 100, 0] }, LA: H(0.06, 0.6, 0.32 + z, 1, 0, -0.3), RA: H(-0.24, 0.047, z - 0.25, -0.5, 0.3, -0.6) }; }
  function itb(x) { return { pelvis: { p: [x, 0.27, 0], r: [0, 0, -78] }, spine: [0, 0, 0], head: 0, L: { ang: [0, 0, 0, 0, 0] }, R: F(-0.15 + x, 0, 0.35, { pole: [0, 1, 1] }), LA: H(0.48 + x, 0.047, 0.12, 0.2, -1, -0.3), RA: H(0.15 + x, 0.047, 0.35, 0.3, -1, 0) }; }
  function add(x) { return { pelvis: { p: [x, 0.2, 0], r: [84, 0, 0] }, spine: [0, 0, 0], head: -8, L: { ang: [20, 70, 30, 95, 0] }, R: { ang: [0, 4, 0, 0, -30] }, LA: H(0.13 + x, 0.047, 0.72, 0.2, -1, -0.2), RA: H(-0.13 + x, 0.047, 0.72, -0.2, -1, -0.2) }; }
  function thor(z) { return { pelvis: { p: [0, 0.3, z], r: [-98, 0, 0] }, spine: [-6, 0, 0], head: 20, L: F(0.14, 0, 0.7, { pole: [0.15, 1, 0] }), R: F(-0.14, 0, 0.7, { pole: [-0.15, 1, 0] }), LA: { ang: [160, 35, 0, 135] }, RA: { ang: [160, 35, 0, 135] } }; }
  function lat(x) { return { pelvis: { p: [x, 0.16, 0], r: [0, 0, -82] }, spine: [0, 0, 0], head: 6, L: { ang: [30, 0, 0, 60, 0] }, R: { ang: [30, 0, 0, 60, 0] }, LA: { ang: [170, 0, 0, 5] }, RA: H(0.25 + x, 0.047, 0.32, 0.3, -1, 0.2) }; }
  function pec(a) { return { pelvis: { p: [0, 0.25, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0, L: F(0.18, 0, 0.62, { pole: [0.3, 1, 0] }), R: F(-0.18, 0, 0.62, { pole: [-0.3, 1, 0] }), LA: { ang: [a, 80, 60, 15] }, RA: { ang: [a, 80, 60, 15] } }; }
  var RO = ["roller"];
  var MOVES = {
    rollQuad:  { camera: SIDE, props: RO, roller: { p: [0, 0.075, -0.3] }, start: "a", poses: { a: quad(-0.14), b: quad(0.08) }, loop: roll("b", "a") },
    rollHam:   { camera: SIDE, props: RO, roller: { p: [0, 0.075, 0.32] }, start: "a", poses: { a: ham(-0.04), b: ham(0.16) }, loop: roll("b", "a") },
    rollCalf:  { camera: SIDE, props: RO, roller: { p: [0, 0.075, 0.6] }, start: "a", poses: { a: calf(-0.05), b: calf(0.12) }, loop: roll("b", "a") },
    rollGlute: { sides: true, camera: { yaw: 0.9, pitch: 0.25, dist: 3.4, ty: 0.3 }, props: RO, roller: { p: [0, 0.075, 0] }, start: "a", poses: { a: glute(-0.05), b: glute(0.06) }, loop: roll("b", "a", 2) },
    rollITB:   { sides: true, camera: { yaw: 0.08, pitch: 0.28, dist: 3.4, ty: 0.3 }, props: RO, roller: { p: [-0.28, 0.075, 0], along: "z" }, start: "a", poses: { a: itb(0), b: itb(0.16) }, loop: roll("b", "a", 2.8) },
    rollAdd:   { sides: true, camera: { yaw: 0.35, pitch: 0.55, dist: 3.4, ty: 0.2 }, props: RO, roller: { p: [0.42, 0.075, -0.1], along: "z" }, start: "a", poses: { a: add(0), b: add(-0.12) }, loop: roll("b", "a") },
    rollThor:  { camera: { yaw: 1.3, pitch: 0.25, dist: 3.5, ty: 0.3 }, props: RO, roller: { p: [0, 0.075, -0.5] }, start: "a", poses: { a: thor(0), b: thor(0.14) }, loop: roll("b", "a") },
    rollLat:   { sides: true, camera: { yaw: 0.08, pitch: 0.28, dist: 3.5, ty: 0.25 }, props: RO, roller: { p: [0.47, 0.075, 0], along: "z" }, start: "a", poses: { a: lat(0), b: lat(-0.08) }, loop: roll("b", "a", 2.2) },
    rollPec:   { camera: { yaw: 0.5, pitch: 0.5, dist: 3.4, ty: 0.25 }, props: RO, roller: { p: [0, 0.075, -0.3], along: "z" }, start: "a", poses: { a: pec(10), b: pec(40) }, loop: roll("b", "a", 4) }
  };
  Object.keys(MOVES).forEach(function (k) { KineRoutine.addMove(k, MOVES[k]); });

  /* ── 2. Contenu ── */
  // Rouleau : 1 minute par zone (30 s par côté)
  var ROLL = [
    { move: "rollQuad",  name: "Rouleau sous les quadriceps", cue: "Sur les avant-bras, roulez lentement de la hanche jusqu'au-dessus du genou.", zone: "Cuisses, devant" },
    { move: "rollHam",   name: "Rouleau sous les ischio-jambiers", cue: "Mains derrière vous, fesses décollées, roulez du pli de la fesse jusqu'au-dessus du genou.", zone: "Cuisses, derrière" },
    { move: "rollCalf",  name: "Rouleau sous les mollets", cue: "Fesses décollées, roulez de la cheville jusque sous le genou. Croisez une jambe pour appuyer plus.", zone: "Mollets" },
    { move: "rollGlute", name: "Rouleau sous les fessiers", cue: "Assis sur le rouleau, cheville sur le genou opposé, penchez-vous du côté de la jambe croisée.", zone: "Fessiers", sides: true },
    { move: "rollITB",   name: "Rouleau sur la face externe de la cuisse", cue: "Sur le côté, appui sur l'avant-bras et le pied de devant. Roulez doucement, sans insister si ça fait mal.", zone: "Cuisses, côté", sides: true },
    { move: "rollAdd",   name: "Rouleau sous les adducteurs", cue: "À plat ventre, cuisse ouverte posée sur le rouleau, roulez l'intérieur de la cuisse.", zone: "Cuisses, intérieur", sides: true },
    { move: "rollThor",  name: "Rouleau sous le haut du dos", cue: "Mains derrière la tête, fesses décollées, roulez entre les omoplates. Jamais sur le bas du dos.", zone: "Haut du dos" },
    { move: "rollLat",   name: "Rouleau sous le grand dorsal", cue: "Sur le côté, bras tendu au-dessus de la tête, roulez sous l'aisselle.", zone: "Côtés du dos", sides: true },
    { move: "rollPec",   name: "Ouverture des pectoraux sur le rouleau", cue: "Allongé sur le rouleau dans la longueur, ouvrez les bras et laissez les épaules s'étirer.", zone: "Poitrine et épaules" }
  ];
  // Étirements : mêmes textes que les routines existantes (voix déjà enregistrées)
  var STRETCH = [
    { move: "quadStretch", name: "Étirement des quadriceps, debout", cue: "Talon vers la fesse, genoux serrés, main sur le mur.", zone: "Cuisses, devant", sides: true },
    { move: "hamSeated", name: "Ischio-jambiers, assis jambe tendue", cue: "Dos droit, penchez-vous vers le pied sans forcer.", zone: "Cuisses, derrière", sides: true },
    { move: "calfWall", name: "Mollets en fente basse contre le mur", cue: "Jambe arrière tendue, talon au sol.", zone: "Mollets", sides: true },
    { move: "figure4", name: "Rotation de hanche en figure 4", cue: "Cheville sur le genou opposé, tirez la cuisse vers vous.", zone: "Fessiers", sides: true },
    { move: "lowLunge", name: "Fente basse au sol pour l'iliopsoas", cue: "Genou arrière au sol, avancez le bassin, buste droit.", zone: "Avant de la hanche", sides: true },
    { move: "adductorSeated", name: "Demi-grand écart assis, adducteurs", cue: "Jambes écartées, dos droit, penchez-vous légèrement.", zone: "Cuisses, intérieur" },
    { move: "childPose", name: "Position de l'enfant, bras tendus", cue: "Assis sur les talons, front vers le sol, bras loin devant.", zone: "Dos" },
    { move: "catCow", name: "Chat-vache à quatre pattes", cue: "Inspirez en creusant le bas du dos (bassin basculé vers l'avant, regard devant). Expirez en arrondissant le bas du dos (bassin rentré, tête vers le sol).", zone: "Dos", breath: [4, 4] },
    { move: "lumbarTwist", name: "Torsion lombaire, allongé sur le dos", cue: "Genoux vers le sol d'un côté, épaules à plat.", zone: "Bas du dos", sides: true },
    { move: "cobra", name: "Cobra allongé", cue: "Bassin au sol, poussez sur les mains, épaules basses.", zone: "Ventre et dos" },
    { move: "pecWall", name: "Pectoraux contre le mur, coude à 90°", cue: "Avant-bras sur le mur, tournez le buste à l'opposé.", zone: "Poitrine", sides: true },
    { move: "triceps", name: "Triceps, coude derrière la tête", cue: "L'autre main pousse doucement le coude.", zone: "Bras", sides: true },
    { move: "neckElongation", name: "Auto-agrandissement cervical, assis", cue: "Grandissez-vous comme si un fil tirait le sommet du crâne.", zone: "Nuque" }
  ];
  var BY = {}; ROLL.concat(STRETCH).forEach(function (e) { BY[e.move] = e; });
  function st(move, dur) { var e = BY[move]; var o = { name: e.name, dur: dur || 60, move: move, cue: e.cue }; if (e.sides) o.sides = true; if (e.breath) o.breath = e.breath; return o; }
  var BREATH = { name: "Respiration abdominale", dur: 60, move: "breathSupine", breath: [4, 6], cue: "Main sur le ventre : il se gonfle puis se vide." };
  var FLOWS = [
    { id: "jambes", name: "Jambes légères", sub: "Rouleau puis étirements des jambes", kit: true,
      steps: [st("rollCalf"), st("rollQuad"), st("rollHam"), st("calfWall"), st("quadStretch"), st("hamSeated"), BREATH] },
    { id: "dos", name: "Dos et épaules", sub: "Haut du dos, épaules, poitrine", kit: true,
      steps: [st("rollThor"), st("rollLat"), st("rollPec"), st("childPose"), st("catCow", 56), st("lumbarTwist"), st("pecWall")] },
    { id: "hanches", name: "Hanches et bassin", sub: "Fessiers, adducteurs, avant de hanche", kit: true,
      steps: [st("rollGlute"), st("rollITB"), st("rollAdd"), st("figure4"), st("lowLunge"), st("adductorSeated", 40), BREATH] },
    { id: "souple", name: "Souplesse sans matériel", sub: "Étirements du corps entier", kit: false,
      steps: [st("quadStretch"), st("hamSeated"), st("calfWall"), st("figure4"), st("lowLunge"), st("childPose"), st("pecWall")] }
  ];
  FLOWS.forEach(function (f) { KineRoutine.define("Récupération : " + f.name, f.steps); });
  function mins(steps) { return Math.round(steps.reduce(function (a, s) { return a + s.dur; }, 0) / 60); }

  /* ── 3. Lecture ── */
  function flow(id) {
    var f = FLOWS.filter(function (x) { return x.id === id; })[0]; if (!f) return;
    if (window.KineStats) KineStats.ev("r", f.name);
    KineRoutine.open({ name: "Récupération : " + f.name, kind: "Récupération" }, null);
  }
  function one(move) {
    var e = BY[move]; if (!e) return;
    var key = "Récupération : " + e.name;
    KineRoutine.define(key, [st(move, e.sides ? 60 : 60)]);
    if (window.KineStats) KineStats.ev("r", e.name);
    KineRoutine.open({ name: key, kind: /^roll/.test(move) ? "Récupération" : "Étirements" }, null);
  }

  /* ── 4. L'onglet ── */
  var PLAY = "<svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor' aria-hidden='true'><path d='M8 5.5v13l11-6.5z'/></svg>";
  var ROLLER_IC = "<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><rect x='3' y='8' width='18' height='8' rx='4'/><path d='M8 8v8M12 8v8M16 8v8'/></svg>";
  function card(e) {
    return "<div class='lu-card rc-card' data-n='move:" + e.move + "'><button class='lu-card-b' onclick=\"KineRecup.one('" + e.move + "')\">" +
      "<span class='lu-im'><img data-n='move:" + e.move + "' alt=''></span>" +
      "<span class='lu-d'><b>" + esc(e.name) + "</b><small>" + esc(e.zone) + " · " + (e.sides ? "30 s par côté" : "1 min") + "</small></span></button></div>";
  }
  function render() {
    var box = $("lu-rec"); if (!box) return;
    box.innerHTML =
      "<p class='rc-intro'>Après l'effort ou les jours de repos : on relâche les muscles, on retrouve de la souplesse. Yass te guide, minuteur et voix compris.</p>" +
      "<h2 class='lu-gh'>Enchaînements guidés</h2><div class='rc-flows'>" + FLOWS.map(function (f) {
        return "<button class='rc-flow' onclick=\"KineRecup.flow('" + f.id + "')\"><span class='rc-fl-im'><img data-n='move:" + f.steps[0].move + "' alt=''></span>" +
          "<span class='rc-fl-tx'><b>" + esc(f.name) + "</b><small>" + esc(f.sub) + "</small><em>" + mins(f.steps) + " min" + (f.kit ? " · " + ROLLER_IC + "rouleau" : " · sans matériel") + "</em></span>" +
          "<span class='rc-fl-go' aria-hidden='true'>" + PLAY + "</span></button>";
      }).join("") + "</div>" +
      "<h2 class='lu-gh'>Auto-massage au rouleau<small>" + ROLL.length + "</small></h2>" +
      "<div class='rc-note'><b>Bien rouler</b>Pression modérée, lentement, 30 secondes à 1 minute par zone. Jamais sur une articulation, le bas du dos, une zone douloureuse ou gonflée, ni sur des varices. Demande un avis médical avant si tu as une phlébite, un traitement anticoagulant ou de l'ostéoporose.</div>" +
      "<div class='lu-cards'>" + ROLL.map(card).join("") + "</div>" +
      "<h2 class='lu-gh'>Étirements<small>" + STRETCH.length + "</small></h2>" +
      "<div class='rc-note'><b>Bien s'étirer</b>Une tension douce, jamais une douleur. Respire calmement, sans à-coups.</div>" +
      "<div class='lu-cards'>" + STRETCH.map(card).join("") + "</div>";
  }

  window.KineRecup = { render: render, flow: flow, one: one, moves: MOVES, list: function () { return { roll: ROLL, stretch: STRETCH, flows: FLOWS }; } };
})();
