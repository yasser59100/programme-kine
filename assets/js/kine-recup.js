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

  /* ── 1. Yass sur le rouleau ── */
  // Positions calculées : contact réel du rouleau sur la zone, mains et pieds posés au sol, rien ne traverse le rouleau ni le sol
  // (le corps glisse entre a et b, le rouleau reste au sol et tourne)
  function LOOP(t) { return [step("b", t), step("a", t)]; }
  var MOVES = {
    rollQuad: {"camera":{"yaw":1.35,"pitch":0.22,"dist":2.85,"ty":0.25,"tz":0},"props":["roller"],"roller":{"p":[0,0.075,-0.2]},"start":"a","poses":{"a":{"pelvis":{"p":[0,0.238,-0.092],"r":[79.188,0,0]},"spine":[0,0,0],"head":-6,"L":{"ang":[-4.938,4,0,0,-20]},"R":{"ang":[-4.938,4,0,0,-20]},"LA":{"hand":{"at":[0.14,0.047,0.637],"pole":[0.2,-1,-0.5]}},"RA":{"hand":{"at":[-0.14,0.047,0.637],"pole":[-0.2,-1,-0.5]}}},"b":{"pelvis":{"p":[0,0.25,0.135],"r":[81,0,0]},"spine":[0,0,0],"head":-6,"L":{"ang":[-4.933,4,0,0,-20]},"R":{"ang":[-4.933,4,0,0,-20]},"LA":{"hand":{"at":[0.14,0.047,0.865],"pole":[0.2,-1,-0.5]}},"RA":{"hand":{"at":[-0.14,0.047,0.865],"pole":[-0.2,-1,-0.5]}}}},"loop":LOOP(2.4)},
    rollHam: {"camera":{"yaw":1.3,"pitch":0.2,"dist":2.65,"ty":0.36,"tz":0.27},"props":["roller"],"roller":{"p":[0,0.075,0.3]},"start":"a","poses":{"a":{"pelvis":{"p":[0,0.22,0.183],"r":[-41.571,0,0]},"spine":[0,0,0],"head":29,"L":{"ang":[51.375,4,0,0,12]},"R":{"ang":[51.375,4,0,0,12]},"LA":{"hand":{"at":[0.2,0.047,-0.18],"pole":[0.5,0.2,-1]}},"RA":{"hand":{"at":[-0.2,0.047,-0.18],"pole":[-0.5,0.2,-1]}}},"b":{"pelvis":{"p":[0,0.213,-0.02],"r":[-40.502,0,0]},"spine":[0,0,0],"head":28,"L":{"ang":[51.375,4,0,0,12]},"R":{"ang":[51.375,4,0,0,12]},"LA":{"hand":{"at":[0.2,0.047,-0.18],"pole":[0.5,0.2,-1]}},"RA":{"hand":{"at":[-0.2,0.047,-0.18],"pole":[-0.5,0.2,-1]}}}},"loop":LOOP(2.4)},
    rollCalf: {"camera":{"yaw":1.3,"pitch":0.2,"dist":2.75,"ty":0.36,"tz":0.3},"props":["roller"],"roller":{"p":[0,0.075,0.78]},"start":"a","poses":{"a":{"pelvis":{"p":[0,0.228,0.258],"r":[-43.979,0,0]},"spine":[0,0,0],"head":31,"L":{"ang":[44.062,4,0,0,12]},"R":{"ang":[44.062,4,0,0,12]},"LA":{"hand":{"at":[0.2,0.047,-0.18],"pole":[0.5,0.2,-1]}},"RA":{"hand":{"at":[-0.2,0.047,-0.18],"pole":[-0.5,0.2,-1]}}},"b":{"pelvis":{"p":[0,0.234,0.031],"r":[-44.077,0,0]},"spine":[0,0,0],"head":31,"L":{"ang":[44.062,4,0,0,12]},"R":{"ang":[44.062,4,0,0,12]},"LA":{"hand":{"at":[0.2,0.047,-0.18],"pole":[0.5,0.2,-1]}},"RA":{"hand":{"at":[-0.2,0.047,-0.18],"pole":[-0.5,0.2,-1]}}}},"loop":LOOP(2.4)},
    rollGlute: {"sides":true,"camera":{"yaw":0.85,"pitch":0.22,"dist":2.35,"ty":0.42,"tz":0},"props":["roller"],"roller":{"p":[0,0.075,0]},"start":"a","poses":{"a":{"pelvis":{"p":[0.04,0.259,-0.05],"r":[-29.812,0,21.75]},"spine":[0,0,-13],"head":8,"L":{"foot":{"at":[0.2,0,0.46],"yaw":0,"pole":[0.3,1,0.6]}},"R":{"ang":[118.25,7.75,62.25,99.25,0]},"LA":{"hand":{"at":[-0.178,0.637,0.212],"pole":[1,0,-0.3]}},"RA":{"hand":{"at":[-0.26,0.047,-0.24],"pole":[-0.5,0.2,-1]}}},"b":{"pelvis":{"p":[0.04,0.256,0.06],"r":[-29.648,0,21.75]},"spine":[0,0,-13],"head":8,"L":{"foot":{"at":[0.2,0,0.46],"yaw":0,"pole":[0.3,1,0.6]}},"R":{"ang":[118.194,7.75,62.25,99.25,0]},"LA":{"hand":{"at":[-0.177,0.637,0.324],"pole":[1,0,-0.3]}},"RA":{"hand":{"at":[-0.26,0.047,-0.24],"pole":[-0.5,0.2,-1]}}}},"loop":LOOP(2)},
    rollITB: {"sides":true,"camera":{"yaw":0.12,"pitch":0.3,"dist":2.85,"ty":0.3,"tz":0.2,"tx":-0.17},"props":["roller"],"roller":{"p":[-0.3,0.075,-0.18],"along":"z"},"start":"a","poses":{"a":{"pelvis":{"p":[-0.247,0.336,0],"r":[0,0,-67.913]},"spine":[0,0,0],"head":0,"L":{"ang":[0,-10.125,0,0,0]},"R":{"foot":{"at":[-0.227,0,0.56],"yaw":-10,"pole":[0,1,1]}},"LA":{"hand":{"at":[0.334,0.047,0.255],"pole":[0,-1,-0.2]}},"RA":{"ang":[0,12,0,55]}},"b":{"pelvis":{"p":[-0.065,0.359,0],"r":[0,0,-69.128]},"spine":[0,0,0],"head":0,"L":{"ang":[0,-10.01,0,0,0]},"R":{"foot":{"at":[-0.045,0,0.56],"yaw":-10,"pole":[0,1,1]}},"LA":{"hand":{"at":[0.516,0.047,0.255],"pole":[0,-1,-0.2]}},"RA":{"ang":[0,12,0,55]}}},"loop":LOOP(2.8)},
    rollAdd: {"sides":true,"camera":{"yaw":0.45,"pitch":0.55,"dist":2.85,"ty":0.2,"tz":0,"tx":0.2},"props":["roller"],"roller":{"p":[0.4,0.075,-0.12],"along":"z"},"start":"a","poses":{"a":{"pelvis":{"p":[0.05,0.285,0],"r":[84.712,0,0]},"spine":[0,0,0],"head":-8,"L":{"ang":[56.625,74.31,39.747,66.616,0]},"R":{"ang":[0,4,0,0,-30]},"LA":{"hand":{"at":[0.19,0.047,0.736],"pole":[0.2,-1,-0.5]}},"RA":{"hand":{"at":[-0.09,0.047,0.736],"pole":[-0.2,-1,-0.5]}}},"b":{"pelvis":{"p":[-0.1,0.285,0],"r":[84.712,0,0]},"spine":[0,0,0],"head":-8,"L":{"ang":[14.404,45.021,91.932,91.999,0]},"R":{"ang":[0,4,0,0,-30]},"LA":{"hand":{"at":[0.04,0.047,0.736],"pole":[0.2,-1,-0.5]}},"RA":{"hand":{"at":[-0.24,0.047,0.736],"pole":[-0.2,-1,-0.5]}}}},"loop":LOOP(2.4)},
    rollThor: {"camera":{"yaw":1.3,"pitch":0.26,"dist":2.6,"ty":0.3,"tz":-0.3},"props":["roller"],"roller":{"p":[0,0.075,-0.38]},"start":"a","poses":{"a":{"pelvis":{"p":[0,0.269,-0.119],"r":[-91.25,0,0]},"spine":[0,0,0],"head":22,"L":{"foot":{"at":[0.14,0,0.42],"yaw":0,"pole":[0.05,1,0]}},"R":{"foot":{"at":[-0.14,0,0.42],"yaw":0,"pole":[-0.05,1,0]}},"LA":{"ang":[144.688,0,-36.75,87.25]},"RA":{"ang":[144.688,0,-36.75,87.25]}},"b":{"pelvis":{"p":[0,0.295,-0.025],"r":[-94.988,0,0]},"spine":[0,0,0],"head":22,"L":{"foot":{"at":[0.14,0,0.42],"yaw":0,"pole":[0.05,1,0]}},"R":{"foot":{"at":[-0.14,0,0.42],"yaw":0,"pole":[-0.05,1,0]}},"LA":{"ang":[144.688,0,-36.75,87.25]},"RA":{"ang":[144.688,0,-36.75,87.25]}}},"loop":LOOP(2.4)},
    rollLat: {"sides":true,"camera":{"yaw":0.15,"pitch":0.3,"dist":2.85,"ty":0.25,"tz":0.18,"tx":0.22},"props":["roller"],"roller":{"p":[0.42,0.075,0],"along":"z"},"start":"a","poses":{"a":{"pelvis":{"p":[0.085,0.126,0],"r":[0,0,-74.878]},"spine":[0,0,0],"head":0,"headZ":-18,"L":{"ang":[35,-21.534,0,70,4.817]},"R":{"ang":[50,7.498,0,85,4.817]},"LA":{"ang":[152.098,12.114,0,5]},"RA":{"ang":[30,10,0,40]}},"b":{"pelvis":{"p":[0.02,0.127,0],"r":[0,0,-74.947]},"spine":[0,0,0],"head":0,"headZ":-18,"L":{"ang":[35,-21.485,0,70,4.817]},"R":{"ang":[50,7.498,0,85,4.817]},"LA":{"ang":[152.098,12.114,0,5]},"RA":{"ang":[30,10,0,40]}}},"loop":LOOP(2.2)},
    rollPec: {"camera":{"yaw":0.55,"pitch":0.5,"dist":2.7,"ty":0.25,"tz":-0.2},"props":["roller"],"roller":{"p":[0,0.075,-0.36],"along":"z"},"start":"a","poses":{"a":{"pelvis":{"p":[0,0.264,0.011],"r":[-90,0,0]},"spine":[0,0,0],"head":0,"L":{"foot":{"at":[0.2,0,0.561],"yaw":0,"pole":[0.12,1,0]}},"R":{"foot":{"at":[-0.2,0,0.561],"yaw":0,"pole":[-0.12,1,0]}},"LA":{"ang":[40,95,144,20]},"RA":{"ang":[40,95,144,20]}},"b":{"pelvis":{"p":[0,0.267,0.03],"r":[-90,0,0]},"spine":[0,0,0],"head":0,"L":{"foot":{"at":[0.2,0,0.58],"yaw":0,"pole":[0.12,1,0]}},"R":{"foot":{"at":[-0.2,0,0.58],"yaw":0,"pole":[-0.12,1,0]}},"LA":{"ang":[35.375,125,63,25]},"RA":{"ang":[35.375,125,63,25]}}},"loop":LOOP(4)}
  };
  Object.keys(MOVES).forEach(function (k) { KineRoutine.addMove(k, MOVES[k]); });
  // Étirements ajoutés (positions vérifiées en 3D, comme le rouleau)
  var MORE = {
    neckSide: {"sides":true,"camera":{"yaw":0.25,"ty":1.0,"dist":2.6},"props":["chair"],"chair":{"z":0.3},"start":"hold","poses":{"hold":{"pelvis":{"p":[0,0.5,-0.05],"r":[0,0,0]},"spine":[0,0,0],"head":0,"L":{"ang":[90,6,0,90,0]},"R":{"ang":[90,6,0,90,0]},"headZ":34.844,"LA":{"hand":{"at":[0.245,0.46,-0.05],"pole":[0.6,-0.3,-0.3]}},"RA":{"hand":{"at":[0.007,1.376,-0.06],"pole":[-1,0.15,0.1]}}}},"loop":[step("hold", 3)]},
    postShoulder: {"sides":true,"camera":{"yaw":0.6,"ty":1.2,"dist":2.6},"props":[],"start":"hold","poses":{"hold":{"pelvis":{"p":[0,"auto",0],"r":[0,0,0]},"spine":[0,0,0],"head":0,"headY":12,"L":{"foot":{"at":[0.12,0,0],"yaw":0}},"R":{"foot":{"at":[-0.12,0,0],"yaw":0}},"LA":{"hand":{"at":[-0.255,1.43,0.245],"pole":[0,-1,0.6]}},"RA":{"hand":{"at":[-0.019,1.367,0.217],"pole":[-0.4,-1,0.4]}}}},"loop":[step("hold", 3)]},
    wristFlex: {"sides":true,"camera":{"yaw":1.0,"ty":1.2,"dist":2.6},"props":[],"start":"hold","poses":{"hold":{"pelvis":{"p":[0,"auto",0],"r":[0,0,0]},"spine":[0,0,0],"head":8,"L":{"foot":{"at":[0.12,0,0],"yaw":0}},"R":{"foot":{"at":[-0.12,0,0],"yaw":0}},"LA":{"hand":{"at":[0.05,1.33,0.5],"pole":[0.4,-1,0]},"wrist":-70},"RA":{"hand":{"at":[0.025,1.26,0.515],"pole":[-0.6,-1,0]}}}},"loop":[step("hold", 3)]},
    sideBend: {"sides":true,"camera":{"yaw":0.1,"ty":1.0,"dist":3.4},"props":[],"start":"hold","poses":{"hold":{"pelvis":{"p":[0.06,"auto",0],"r":[0,0,0]},"spine":[0,19.938,0],"head":0,"L":{"foot":{"at":[0.2,0,0],"yaw":8}},"R":{"foot":{"at":[-0.2,0,0],"yaw":-8}},"LA":{"ang":[173,10,0,15]},"RA":{"hand":{"at":[-0.14,0.98,0.02],"pole":[-1,0,-0.6]}}}},"loop":[step("hold", 3)]},
    kneesChest: {"camera":{"yaw":1.25,"pitch":0.35,"dist":2.8,"ty":0.25,"tz":-0.15},"props":[],"start":"hold","poses":{"hold":{"pelvis":{"p":[0,0.12,0],"r":[-90,0,0]},"spine":[0,0,0],"head":16.431,"L":{"ang":[131.794,8,0,132.046,10]},"R":{"ang":[131.794,8,0,132.046,10]},"LA":{"hand":{"at":[0.149,0.52,-0.215],"pole":[1,-0.3,-0.5]}},"RA":{"hand":{"at":[-0.149,0.52,-0.215],"pole":[-1,-0.3,-0.5]}}}},"loop":[step("hold", 3)]},
    butterfly: {"camera":{"yaw":0.35,"pitch":0.35,"dist":2.6,"ty":0.35,"tz":0.1},"props":[],"start":"hold","poses":{"hold":{"pelvis":{"p":[0,0.14,0],"r":[3.254,0,0]},"spine":[34,0,0],"head":5,"L":{"ang":[105.875,52.375,62.75,132.125,0]},"R":{"ang":[105.875,52.375,62.75,132.125,0]},"LA":{"hand":{"at":[0.06,0.1,0.36],"pole":[1,0.5,0]}},"RA":{"hand":{"at":[-0.06,0.1,0.36],"pole":[-1,0.5,0]}}}},"loop":[step("hold", 3)]},
    piriChair: {"sides":true,"camera":{"yaw":0.7,"ty":0.75,"dist":2.9},"props":["chair"],"chair":{"z":0.3},"start":"hold","poses":{"hold":{"pelvis":{"p":[0,0.5,-0.05],"r":[0,0,0]},"spine":[13.643,0,0],"head":-8,"L":{"foot":{"at":[0.15,0,0.36],"yaw":0,"pole":[0.2,1,0.6]}},"R":{"ang":[103.347,18.487,84.191,106.881,0]},"LA":{"hand":{"at":[0.183,0.609,0.376],"pole":[1,0,-0.3]}},"RA":{"hand":{"at":[-0.235,0.666,0.356],"pole":[-1,0,-0.3]}}}},"loop":[step("hold", 3)]},
    soleusWall: {"sides":true,"camera":{"yaw":1.3,"dist":3.6},"props":["wall"],"start":"hold","poses":{"hold":{"pelvis":{"p":[0,0.82,0.02],"r":[8,0,0]},"spine":[4,0,0],"head":0,"L":{"foot":{"at":[0.1,0,0.3],"yaw":0}},"R":{"foot":{"at":[-0.1,0,-0.18],"yaw":0}},"LA":{"wrist":70,"hand":{"at":[0.22,1.2,0.545],"pole":[0.5,-1,-0.3]}},"RA":{"wrist":70,"hand":{"at":[-0.22,1.2,0.545],"pole":[-0.5,-1,-0.3]}}}},"loop":[step("hold", 3)]},
    hamStep: {"sides":true,"camera":{"yaw":1.3,"ty":0.75,"dist":3.4},"props":["step"],"start":"hold","poses":{"hold":{"pelvis":{"p":[0,1.01,0.138],"r":[36.818,0,0]},"spine":[6,0,0],"head":-6,"L":{"foot":{"at":[0.11,0.18,0.48],"yaw":0,"lift":-25}},"R":{"foot":{"at":[-0.11,0,-0.08],"yaw":0}},"LA":{"hand":{"at":[0.16,0.902,0.26],"pole":[1,0,-0.3]}},"RA":{"hand":{"at":[0.04,0.902,0.26],"pole":[-1,0,-0.3]}}}},"loop":[step("hold", 3)]},
    gluteSupine: {"sides":true,"camera":{"yaw":0.6,"pitch":0.45,"dist":2.8,"ty":0.25,"tz":-0.2},"props":[],"start":"hold","poses":{"hold":{"pelvis":{"p":[0,0.12,0],"r":[-90,0,0]},"spine":[0,0,0],"head":15,"L":{"ang":[127.892,-20.326,41.687,122.507,0]},"R":{"ang":[0,4,0,0,-30]},"LA":{"hand":{"at":[-0.008,0.513,-0.23],"pole":[1,-0.2,-0.4]}},"RA":{"hand":{"at":[-0.137,0.479,-0.231],"pole":[-1,-0.2,-0.4]}}}},"loop":[step("hold", 3)]}
  };
  Object.keys(MORE).forEach(function (k) { KineRoutine.addMove(k, MORE[k]); });

  /* ── 2. Contenu ── */
  // Rouleau : 1 minute par zone (30 s par côté)
  var ROLL = [
    { move: "rollQuad",  name: "Rouleau sous les quadriceps", cue: "Sur les avant-bras, roule lentement de la hanche jusqu'au-dessus du genou.", zone: "Cuisses, devant" },
    { move: "rollHam",   name: "Rouleau sous les ischio-jambiers", cue: "Mains derrière toi, fesses décollées, roule du pli de la fesse jusqu'au-dessus du genou.", zone: "Cuisses, derrière" },
    { move: "rollCalf",  name: "Rouleau sous les mollets", cue: "Fesses décollées, roule de la cheville jusque sous le genou. Croise une jambe pour appuyer plus.", zone: "Mollets" },
    { move: "rollGlute", name: "Rouleau sous les fessiers", cue: "Assis sur le rouleau, cheville sur le genou opposé, penche-toi du côté de la jambe croisée.", zone: "Fessiers", sides: true },
    { move: "rollITB",   name: "Rouleau sur la face externe de la cuisse", cue: "Sur le côté, appui sur l'avant-bras et le pied de devant. Roule doucement, sans insister si ça fait mal.", zone: "Cuisses, côté", sides: true },
    { move: "rollAdd",   name: "Rouleau sous les adducteurs", cue: "À plat ventre, cuisse ouverte posée sur le rouleau, roule l'intérieur de la cuisse.", zone: "Cuisses, intérieur", sides: true },
    { move: "rollThor",  name: "Rouleau sous le haut du dos", cue: "Mains derrière la tête, fesses décollées, roule entre les omoplates. Jamais sur le bas du dos.", zone: "Haut du dos" },
    { move: "rollLat",   name: "Rouleau sous le grand dorsal", cue: "Sur le côté, bras tendu au-dessus de la tête, roule sous l'aisselle.", zone: "Côtés du dos", sides: true },
    { move: "rollPec",   name: "Ouverture des pectoraux sur le rouleau", cue: "Allongé sur le rouleau dans la longueur, ouvre les bras et laisse les épaules s'étirer.", zone: "Poitrine et épaules" }
  ];
  // Étirements : mêmes textes que les routines existantes (voix déjà enregistrées)
  var STRETCH = [
    { g: "Nuque et épaules", move: "neckElongation", name: "Auto-agrandissement cervical, assis", cue: "Grandis-toi comme si un fil tirait le sommet du crâne.", zone: "Nuque" },
    { g: "Nuque et épaules", move: "neckSide", name: "Inclinaison de la nuque", cue: "Assis, tiens la chaise d'une main. Penche l'oreille vers l'épaule opposée, sans tourner la tête.", zone: "Nuque", sides: true },
    { g: "Nuque et épaules", move: "postShoulder", name: "Arrière de l'épaule, bras croisé", cue: "Bras tendu devant la poitrine, l'autre main ramène le coude vers toi.", zone: "Épaules", sides: true },
    { g: "Nuque et épaules", move: "pecWall", name: "Pectoraux contre le mur, coude à 90°", cue: "Avant-bras sur le mur, tourne le buste à l'opposé.", zone: "Poitrine", sides: true },
    { g: "Nuque et épaules", move: "triceps", name: "Triceps, coude derrière la tête", cue: "L'autre main pousse doucement le coude.", zone: "Bras", sides: true },
    { g: "Nuque et épaules", move: "wristFlex", name: "Avant-bras, paume vers l'avant", cue: "Bras tendu, doigts vers le bas : l'autre main tire doucement les doigts vers toi.", zone: "Avant-bras", sides: true },
    { g: "Dos", move: "sideBend", name: "Inclinaison latérale debout", cue: "Un bras au-dessus de la tête, penche-toi sur le côté sans basculer en avant.", zone: "Flancs", sides: true },
    { g: "Dos", move: "catCow", name: "Chat-vache à quatre pattes", cue: "Inspire en creusant le bas du dos (bassin basculé vers l'avant, regard devant). Expire en arrondissant le bas du dos (bassin rentré, tête vers le sol).", zone: "Dos", breath: [4, 4] },
    { g: "Dos", move: "childPose", name: "Position de l'enfant, bras tendus", cue: "Assis sur les talons, front vers le sol, bras loin devant.", zone: "Dos" },
    { g: "Dos", move: "kneesChest", name: "Genoux à la poitrine", cue: "Sur le dos, ramène les genoux vers la poitrine. Le bas du dos reste au sol.", zone: "Bas du dos" },
    { g: "Dos", move: "lumbarTwist", name: "Torsion lombaire, allongé sur le dos", cue: "Genoux vers le sol d'un côté, épaules à plat.", zone: "Bas du dos", sides: true },
    { g: "Dos", move: "cobra", name: "Cobra allongé", cue: "Bassin au sol, pousse sur les mains, épaules basses.", zone: "Ventre et dos" },
    { g: "Hanches", move: "figure4", name: "Rotation de hanche en figure 4", cue: "Cheville sur le genou opposé, tire la cuisse vers toi.", zone: "Fessiers", sides: true },
    { g: "Hanches", move: "gluteSupine", name: "Fessier allongé, genou vers l'épaule opposée", cue: "Sur le dos, ramène le genou vers l'épaule opposée avec les deux mains.", zone: "Fessiers", sides: true },
    { g: "Hanches", move: "piriChair", name: "Fessier assis sur une chaise", cue: "Cheville sur le genou opposé, dos droit, penche le buste en avant.", zone: "Fessiers", sides: true },
    { g: "Hanches", move: "lowLunge", name: "Fente basse au sol pour l'iliopsoas", cue: "Genou arrière au sol, avance le bassin, buste droit.", zone: "Avant de la hanche", sides: true },
    { g: "Hanches", move: "butterfly", name: "Papillon assis", cue: "Plantes des pieds jointes, dos droit, laisse les genoux descendre.", zone: "Cuisses, intérieur" },
    { g: "Hanches", move: "adductorSeated", name: "Demi-grand écart assis, adducteurs", cue: "Jambes écartées, dos droit, penche-toi légèrement.", zone: "Cuisses, intérieur" },
    { g: "Jambes", move: "quadStretch", name: "Étirement des quadriceps, debout", cue: "Talon vers la fesse, genoux serrés, main sur le mur.", zone: "Cuisses, devant", sides: true },
    { g: "Jambes", move: "hamSeated", name: "Ischio-jambiers, assis jambe tendue", cue: "Dos droit, penche-toi vers le pied sans forcer.", zone: "Cuisses, derrière", sides: true },
    { g: "Jambes", move: "hamStep", name: "Ischio-jambiers debout, talon sur une marche", cue: "Jambe tendue, pointe du pied vers toi, penche le buste dos droit.", zone: "Cuisses, derrière", sides: true },
    { g: "Jambes", move: "calfWall", name: "Mollets en fente basse contre le mur", cue: "Jambe arrière tendue, talon au sol.", zone: "Mollets", sides: true },
    { g: "Jambes", move: "soleusWall", name: "Soléaire contre le mur", cue: "Comme pour le mollet, mais genou arrière plié, talon au sol.", zone: "Mollets", sides: true }
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
      steps: [st("neckSide"), st("postShoulder"), st("sideBend"), st("quadStretch"), st("hamSeated"), st("figure4"), st("childPose")] }
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
      ["Nuque et épaules", "Dos", "Hanches", "Jambes"].map(function (g) {
        return "<h3 class='rc-sub'>" + g + "</h3><div class='lu-cards'>" + STRETCH.filter(function (e) { return e.g === g; }).map(card).join("") + "</div>";
      }).join("");
  }

  window.KineRecup = { render: render, flow: flow, one: one, moves: MOVES, list: function () { return { roll: ROLL, stretch: STRETCH, flows: FLOWS }; } };
})();
