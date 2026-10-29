/* ═══════════ KinéForce — renforcement exigeant, pour chaque membre ═══════════
   Ce qui manquait pour la fin des rééducations : versions lestées, excentriques au tempo lent, concentriques
   explosifs et pliométrie, et un vrai travail des chaînes interne et externe (adducteurs et abducteurs,
   rotateurs internes et externes de la hanche et de l'épaule, inverseurs et éverseurs de la cheville).
   Beaucoup reprennent l'animation d'un exercice existant (même geste, autre charge ou autre tempo). */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step, SEAT = lib.SEAT, SIDE = lib.SIDE;
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var reg = function (n, d) { if (d && !KineAvatar.supports(n)) KineAvatar.register(n, d); };
  var made = [];
  /* Variante d'un exercice existant.
     o.tempo : { down: secondes, mot: "Descente" | "Retour" } — la phase excentrique devient lente
     o.up : secondes de la phase concentrique (explosive si court) ; o.def : propriétés à changer ; o.poses(p) : poses à ajouter ou modifier */
  function V(name, base, o) {
    var d = KineAvatar._def(base); if (!d || !d.poses) return;
    var c = copy(d); o = o || {};
    if (o.def) Object.keys(o.def).forEach(function (k) { if (o.def[k] === null) delete c[k]; else c[k] = o.def[k]; });
    if (o.poses) { var np = o.poses(c.poses); Object.keys(np).forEach(function (k) { c.poses[k] = np[k]; }); }
    if (o.tempo && c.steps) {
      var t = o.tempo, mot = t.mot || "Descente";
      c.steps = c.steps.map(function (s) {
        if (s.kind === "down") return step(s.pose, t.down, mot + " en " + t.down + " secondes", (mot === "Retour" ? "On revient lentement, en " : "On descend lentement, en ") + t.down + " secondes", "down");
        if (s.kind === "up" && o.up) return step(s.pose, o.up, o.upLabel || s.label, o.upSay || s.say, "up");
        return s;
      });
    }
    if (o.steps) c.steps = o.steps;
    reg(name, c); made.push(name);
  }
  function N(name, d) { reg(name, d); made.push(name); }
  var HIPS = { LA: { hand: { at: [0.2, 0.98, -0.02], pole: [1, -0.3, -0.6] } }, RA: { hand: { at: [-0.2, 0.98, -0.02], pole: [-1, -0.3, -0.6] } } };
  var DB = { loadKind: "dumbbell" }, KB = { loadKind: "kettlebell" };

  /* ════════ GENOU : quadriceps ════════ */
  V("Squat bulgare lesté", "Squat bulgare", { def: { load: "both", loadKind: "dumbbell" } });
  V("Squat bulgare, descente en 4 secondes", "Squat bulgare", { tempo: { down: 4 } });
  V("Descente de marche lestée, en 4 secondes", "Descente de marche", { def: { load: "both", loadKind: "dumbbell" }, tempo: { down: 4 } });
  V("Squat sur une jambe complet (pistol)", "Squat sur une jambe vers la chaise", { def: { props: [] },
    poses: function (p) { var d = copy(p.down); d.pelvis = { p: [0.03, 0.46, -0.2], r: [32, 0, 0] }; d.spine = [24, 0, 0]; d.R = { ang: [82, 4, 0, 0, 0] }; return { down: d }; },
    steps: [step("down", 3, "On descend sur une jambe, jusqu'en bas", "On descend tout en bas, sur une jambe, l'autre tendue devant", "down"), step("up", 2, "On remonte sur la même jambe", "On pousse, on remonte", "up")] });
  V("Spanish squat tenu lourd", "Spanish squat à l'élastique", { def: { timed: { byWeek: [30, 45, 45, 45] }, noIso: true, start: "down", thumb: "down", holdSay: { L: "On tient, genoux à 70 degrés, le plus fort possible", R: "On tient" } },
    steps: [] });
  V("Reverse Nordic, descente en 5 secondes", "Reverse Nordic", { tempo: { down: 5 } });
  V("Fente avant lestée, descente en 4 secondes", "Fente avec charge", { def: DB, tempo: { down: 4 } });
  V("Squat sauté", "Squat bilatéral", {
    poses: function (p) { var a = copy(p.up); a.pelvis = { p: [0, "auto", 0], r: [0, 0, 0], dy: 0.12 }; a.LA = { ang: [120, 14, 0, 20] }; a.RA = { ang: [120, 14, 0, 20] }; ["L", "R"].forEach(function (s) { if (a[s] && a[s].foot) { a[s].foot.at[1] = 0.14; a[s].foot.lift = 30; } }); return { air: a }; },
    steps: [step("down", 1, "On descend", "On descend", "down"), step("air", 0.35, "On saute le plus haut possible", "On saute", "up"), step("down", 0.6, "Réception souple, on enchaîne", null, "down")] });
  V("Saut en contrebas puis rebond (drop jump)", "Réception de saut stabilisée", {
    poses: function (p) { var j = copy(p.air); j.pelvis = { p: [0, "auto", 0.32], r: [0, 0, 0] }; ["L", "R"].forEach(function (s) { if (j[s] && j[s].foot) { j[s].foot.at[1] = 0.26; j[s].foot.at[2] = 0.5; j[s].foot.lift = 20; } }); j.LA = { ang: [150, 12, 0, 20] }; j.RA = { ang: [150, 12, 0, 20] }; return { jump: j }; },
    steps: [step("air", 0.35, "On se laisse tomber de la marche", null, "up"), step("land", 0.25, "Contact bref au sol", "Contact bref", "down"), step("jump", 0.4, "Et on rebondit le plus haut possible", "Hop, on rebondit", "up"), step("land", 1.5, "Réception tenue", null, "hold"), step("top", 1.5, "On remonte sur la marche", null, "up")] });
  V("Chaise contre le mur lestée", "Chaise contre le mur", { def: { load: "both", loadKind: "kettlebell" } });
  V("Leg extension à une jambe, descente en 4 secondes", "Leg extension", { tempo: { down: 4 } });
  V("Presse à une jambe, descente en 4 secondes", "Presse à une jambe", { tempo: { down: 4 } });
  V("Squat à la barre, descente en 3 secondes", "Squat à la barre", { tempo: { down: 3 } });

  /* ════════ ISCHIO-JAMBIERS ════════ */
  V("Nordic curl complet", "Nordic curl assisté", { tempo: { down: 5 } });
  V("Soulevé de terre roumain unipodal lesté", "Soulevé de terre roumain unipodal", { def: { load: "both", loadKind: "dumbbell" } });
  V("Pont des ischios sur une jambe, talon sur la chaise", "Pont ischio-jambiers talons sur chaise", { def: { sides: "blocks", sideWord: "jambe" },
    poses: function (p) { var d = copy(p.down), u = copy(p.up); d.R = { ang: [70, 4, 0, 10, 0] }; u.R = { ang: [40, 4, 0, 0, 0] }; return { down: d, up: u }; } });
  V("Leg curl assis, retour en 4 secondes", "Leg curl assis", { tempo: { down: 4, mot: "Retour" } });
  V("Leg curl serviette, retour en 5 secondes", "Leg curl serviette sur une jambe", { tempo: { down: 5, mot: "Retour" } });

  /* ════════ CHEVILLE : mollet, éverseurs et inverseurs ════════ */
  V("Élévation du talon lestée sur une marche", "Montée sur pointe, serviette sous les orteils", { def: { props: ["step", "wall"], load: "R", loadKind: "dumbbell" },
    poses: function (p) { var o = {}; Object.keys(p).forEach(function (k) { var x = copy(p[k]); x.RA = { ang: [4, 8, 0, 6] }; o[k] = x; }); return o; } });
  V("Mollet assis lourd, descente en 3 secondes", "Mollet assis avec charge", { tempo: { down: 3 } });
  V("Sauts répétés sur une jambe (pogo)", "Sauts sur une jambe", { def: { timed: { seconds: 20 } },
    steps: [step("air", 0.2, "Petits rebonds, cheville raide", "Rebonds rapides, la cheville comme un ressort", "up"), step("ground", 0.2, "Contact bref", null, "down")] });
  V("Éversion à l'élastique, retour en 4 secondes", "Éversion à l'élastique", { tempo: { down: 4, mot: "Retour" } });
  V("Inversion à l'élastique, retour en 4 secondes", "Inversion à l'élastique", { tempo: { down: 4, mot: "Retour" } });
  V("Marche sur la pointe des pieds lestée", "Marche sur la pointe des pieds", { def: { load: "both", loadKind: "kettlebell" } });
  V("Marche sur les talons lestée", "Marche sur les talons", { def: { load: "both", loadKind: "kettlebell" } });
  V("Corde à sauter sur une jambe", "Corde à sauter imaginaire", { def: { sides: "blocks", sideWord: "jambe", timed: { byWeek: [15, 20, 30, 30] } },
    poses: function (p) { var o = {}; Object.keys(p).forEach(function (k) { var x = copy(p[k]); x.R = { ang: [25, 3, 0, 80, 0] }; o[k] = x; }); return o; } });

  /* ════════ HANCHE : fessiers, abducteurs (chaîne externe) et adducteurs (chaîne interne) ════════ */
  V("Hip thrust sur une jambe", "Hip thrust épaules sur canapé", { def: { sides: "blocks", sideWord: "jambe" },
    poses: function (p) { var d = copy(p.down), u = copy(p.up); d.R = { ang: [80, 4, 0, 90, 0] }; u.R = { ang: [60, 4, 0, 90, 0] }; return { down: d, up: u }; } });
  V("Copenhague dynamique, descente en 4 secondes", "Copenhague dynamique", { tempo: { down: 4 } });
  V("Planche latérale avec levée de la jambe", "Planche latérale complète", { def: { timed: null },
    poses: function (p) { var l = copy(p.hold); l.R = { ang: [0, 34, 0, 0, 0] }; return { lift: l }; },
    steps: [step("hold", 1.5, "On monte en planche sur le côté", "On monte le bassin", "up"), step("lift", 1.5, "La jambe du dessus monte", "La jambe du dessus monte", "up"), step("hold", 1.5, "Elle redescend lentement", null, "down"), step("rest", 1.5, "On repose", null, "down")] });
  V("Fente latérale lestée", "Fente latérale", { def: { load: "both", loadKind: "dumbbell" } });
  V("Squat sumo lesté", "Squat sumo", { def: { load: "both", loadKind: "kettlebell" } });
  V("Abduction debout, retour en 4 secondes", "Abduction hanche debout", { tempo: { down: 4, mot: "Retour" } });
  N("Adduction couché sur le côté, jambe du dessous", {
    sides: "blocks", snapSideChange: true, camera: { yaw: 0.05, pitch: 0.35, dist: 3.4, ty: 0.3 }, start: "down", thumb: "up",
    poses: { down: merge(SIDE, { R: { ang: [62, 0, 0, 90, 0] }, L: { ang: [0, 0, 0, 0, 0] } }), up: merge(SIDE, { R: { ang: [62, 0, 0, 90, 0] }, L: { ang: [0, -24, 0, 0, 0] } }) },
    steps: [step("up", 1.2, "La jambe du dessous monte", "La jambe du dessous monte, pointe du pied vers l'avant", "up"), step("up", 1, "On tient", null, "hold"), step("down", 3, "Descente en 3 secondes", "On redescend lentement", "down")]
  });
  var HROT = function (x) { return merge(SEAT, { spine: [6, 0, 0], LA: { hand: { at: [0.25, 0.5, -0.34], pole: [1, 0.2, 0] } }, RA: { hand: { at: [-0.25, 0.5, -0.34], pole: [-1, 0.2, 0] } }, L: { foot: { at: [x, 0.05, 0.16], yaw: 0, pole: [0, 0.3, 1] } } }); };
  N("Rotation de hanche vers l'extérieur à l'élastique, assis", {
    sides: "blocks", sideWord: "jambe", props: ["chair"], camera: { yaw: 0.25, dist: 3.4, ty: 0.55, pitch: 0.3 }, start: "out", thumb: "in",
    poses: { out: HROT(0.3), "in": HROT(-0.02) },
    steps: [step("in", 1.5, "Le pied part vers l'intérieur", "Genou immobile, le pied part vers l'intérieur contre l'élastique", "up"), step("in", 1, "On tient", null, "hold"), step("out", 3, "Retour en 3 secondes", "On revient lentement", "down")]
  });
  N("Rotation de hanche vers l'intérieur à l'élastique, assis", {
    sides: "blocks", sideWord: "jambe", props: ["chair"], camera: { yaw: 0.25, dist: 3.4, ty: 0.55, pitch: 0.3 }, start: "in", thumb: "out",
    poses: { "in": HROT(0.08), out: HROT(0.34) },
    steps: [step("out", 1.5, "Le pied part vers l'extérieur", "Genou immobile, le pied part vers l'extérieur contre l'élastique", "up"), step("out", 1, "On tient", null, "hold"), step("in", 3, "Retour en 3 secondes", "On revient lentement", "down")]
  });

  /* ════════ ÉPAULE : rotateurs externes et internes, poussée, tirage ════════ */
  V("Rotation externe couché sur le côté, retour en 4 secondes", "Rotation externe couché sur le côté", { def: DB, tempo: { down: 4, mot: "Retour" } });
  V("Rotation interne à l'élastique, retour en 4 secondes", "Rotation interne à l'élastique", { tempo: { down: 4, mot: "Retour" } });
  V("Rotation externe à 90°, retour en 4 secondes", "Rotation externe à 90° à l'élastique", { tempo: { down: 4, mot: "Retour" } });
  V("Pompes, descente en 4 secondes", "Pompes complètes", { tempo: { down: 4 } });
  V("Pompes plyométriques", "Pompes complètes", {
    poses: function (p) { var a = copy(p.up); a.pelvis = { p: [0, 0.5, 0.95], r: [66, 0, 0] }; a.LA = { hand: { at: [0.24, 0.16, 1.44], pole: [0.6, 0.3, -0.7] } }; a.RA = { hand: { at: [-0.24, 0.16, 1.44], pole: [-0.6, 0.3, -0.7] } }; return { air: a }; },
    steps: [step("down", 0.8, "On descend", "On descend", "down"), step("air", 0.3, "On pousse fort, les mains décollent", "On pousse, les mains décollent", "up"), step("down", 0.6, "Réception souple, on enchaîne", null, "down"), step("up", 0.8, "On remonte", null, "up")] });
  V("Développé épaules, descente en 4 secondes", "Développé épaules assis", { def: DB, tempo: { down: 4 } });
  V("Marche avec une charge au-dessus de la tête", "Porté d'une bouteille bras tendu en l'air", { def: KB });
  V("Dips sur chaise, descente en 4 secondes", "Dips sur chaise", { tempo: { down: 4 } });
  V("Tirage inversé, descente en 4 secondes", "Tirage inversé sous une table", { tempo: { down: 4 } });
  V("Élévation latérale, descente en 4 secondes", "Élévation latérale", { def: DB, tempo: { down: 4 } });
  V("Y-T-W lestés à plat ventre", "Superman en Y et en W", { def: { load: "both" } });

  /* ════════ TRONC ════════ */
  V("Roulette abdominale avec une serviette", "Gainage frontal sur genoux", { def: { timed: null, noIso: true },
    poses: function (p) { var r = copy(p.hold); r.pelvis = { p: [0, 0.2, 0.16], r: [76, 0, 0] }; r.LA = { hand: { at: [0.13, 0.047, 1.02], pole: [0.2, -1, -0.2] } }; r.RA = { hand: { at: [-0.13, 0.047, 1.02], pole: [-0.2, -1, -0.2] } }; return { roll: r }; },
    steps: [step("roll", 2.5, "Les mains glissent loin devant", "Les mains glissent loin devant, le dos reste plat", "down"), step("hold", 2, "On ramène, ventre serré", "On ramène en serrant le ventre", "up")] });
  V("Planche latérale avec descentes du bassin", "Planche latérale complète", { def: { timed: null },
    steps: [step("hold", 1.2, "Le bassin monte", "On monte le bassin", "up"), step("rest", 1.5, "Il redescend sans toucher", "On redescend presque au sol", "down")] });
  V("Extension lombaire lestée au sol", "Extension lombaire couché sur le ventre", { def: { load: "both" } });
  V("Dead bug lesté", "Dead bug", { def: { load: "both" } });
  V("Soulevé de terre avec deux sacs, descente en 4 secondes", "Soulevé de terre avec deux sacs", { tempo: { down: 4 } });
  V("Planche sur les mains, levée de jambe", "Pompes complètes", { def: { sides: "alternate", noIso: true },
    poses: function (p) { var l = copy(p.up); l.R = { foot: { at: [-0.12, 0.3, 0.02], yaw: 0, lift: 30 } }; return { lift: l }; },
    steps: [step("lift", 1.2, "Une jambe monte, le bassin ne bouge pas", "Une jambe monte, le bassin reste immobile", "up"), step("lift", 1, "On tient", null, "hold"), step("up", 1, "On repose", null, "down")] });

  /* ════════ FICHES ════════ */
  var E = function (name, group, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: group, color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop }; };
  var EXC = "Tempo lent à la descente : c'est le travail excentrique, le plus efficace pour gagner de la force et renforcer les tendons.";
  var F = [
    E("Squat bulgare lesté", "genou", 3, ["une chaise", "deux haltères, bouteilles ou sacs"], "3 × 6 à 8 par jambe",
      "Pied arrière posé sur une chaise, une charge dans chaque main. Descends en pliant le genou avant jusqu'à ce que la cuisse soit à l'horizontale, puis remonte en poussant dans le talon avant.",
      "Genou avant dans l'axe du pied, buste un peu penché en avant.", "Le genou avant ne rentre pas vers l'intérieur.",
      "La référence pour la force d'une jambe. Choisis une charge qui rend les 2 dernières répétitions difficiles.", "Arrêt si douleur dans le genou au-dessus de 3/10."),
    E("Squat bulgare, descente en 4 secondes", "genou", 3, ["une chaise"], "3 × 6 par jambe",
      "Même position que le squat bulgare. Descends en comptant 4 secondes, touche presque le sol avec le genou arrière, puis remonte normalement.",
      "4 secondes de descente, sans s'arrêter.", "On ne se laisse pas tomber en fin de descente.",
      EXC + " Plus dur : avec une charge.", "Arrêt si douleur dans le genou au-dessus de 3/10."),
    E("Descente de marche lestée, en 4 secondes", "genou", 3, ["une marche haute", "deux bouteilles ou haltères"], "3 × 8 par jambe",
      "Debout sur une marche, une charge dans chaque main. Descends lentement en 4 secondes sur une jambe jusqu'à effleurer le sol avec le talon de l'autre, puis remonte.",
      "Le genou reste au-dessus du pied, le bassin horizontal.", "Le genou ne rentre pas vers l'intérieur.",
      "Contrôle excentrique du quadriceps, celui qui protège le genou dans les descentes et les réceptions.", "Arrêt si douleur à l'avant du genou au-dessus de 3/10."),
    E("Squat sur une jambe complet (pistol)", "genou", 3, ["un appui pour la main au début"], "3 × 3 à 5 par jambe",
      "Debout sur une jambe, l'autre tendue devant toi. Descends jusqu'en bas sur une jambe, talon au sol, puis remonte sans t'aider de l'autre jambe.",
      "Talon d'appui collé au sol, genou dans l'axe.", "On ne s'écroule pas en bas : la descente reste contrôlée.",
      "Le sommet de la force d'une jambe. Plus facile : en se tenant à une porte, ou vers une chaise.", "Arrêt si douleur dans le genou ou dans le pli du genou."),
    E("Spanish squat tenu lourd", "genou", 3, ["un élastique solide", "un point fixe"], "5 × 45 secondes",
      "Élastique derrière les genoux, accroché à un point fixe devant toi. Descends en squat jusqu'à environ 70° de flexion des genoux, tibias verticaux, et tiens en poussant fort.",
      "Tibias verticaux, poids sur les talons, le buste reste droit.", "On ne laisse pas les genoux partir devant.",
      "Contractions statiques longues et lourdes : soulagent souvent la tendinopathie rotulienne.", "La douleur du tendon doit rester sous 3/10 et diminuer pendant la série."),
    E("Reverse Nordic, descente en 5 secondes", "genou", 3, ["un coussin sous les genoux"], "3 × 5",
      "À genoux, le corps droit des genoux à la tête. Penche-toi en arrière lentement, en 5 secondes, en gardant les hanches tendues, puis reviens.",
      "Le corps reste droit comme une planche, hanches en avant.", "On ne plie pas les hanches pour tricher.",
      "Excentrique du quadriceps très exigeant, utile pour les sportifs. " + "Plus facile : moins loin.", "Arrêt si douleur sous la rotule ou dans le genou."),
    E("Fente avant lestée, descente en 4 secondes", "genou", 3, ["deux haltères ou bouteilles"], "3 × 8 par jambe",
      "Une charge dans chaque main. Fais un grand pas en avant et descends lentement, en 4 secondes, jusqu'à ce que le genou arrière effleure le sol, puis repousse pour revenir.",
      "Descente lente, buste droit.", "Le genou avant ne part pas vers l'intérieur.",
      EXC, "Arrêt si douleur dans le genou au-dessus de 3/10."),
    E("Squat sauté", "genou", 3, [], "4 × 6",
      "Pieds à largeur d'épaules. Descends en squat puis saute le plus haut possible, réceptionne-toi souplement en redescendant directement dans le squat suivant.",
      "Réception silencieuse, genoux dans l'axe.", "On ne retombe pas jambes tendues.",
      "Puissance des jambes : la force qu'on sait utiliser vite. Plus dur : avec une petite charge.", "Arrêt si douleur dans le genou ou si les genoux rentrent à la réception."),
    E("Saut en contrebas puis rebond (drop jump)", "genou", 3, ["une marche ou un banc solide"], "4 × 5",
      "Debout sur une marche. Laisse-toi tomber, et dès que les pieds touchent le sol, rebondis le plus haut possible, avec un contact au sol le plus court possible.",
      "Contact bref, comme sur un trampoline, genoux dans l'axe.", "On ne s'écrase pas en bas avant de rebondir.",
      "La pliométrie de fin de rééducation : elle prépare aux sauts et aux changements de direction du sport.", "Réservé à un genou sans douleur et à une force proche de l'autre côté."),
    E("Chaise contre le mur lestée", "genou", 3, ["un mur", "deux charges"], "4 × 45 secondes",
      "Dos au mur, genoux à 90°, une charge dans chaque main ou posée sur les cuisses. Tiens la position sans bouger.",
      "Genoux au-dessus des chevilles, dos plaqué au mur.", "On ne retient pas la respiration.",
      "Endurance de force du quadriceps, bien tolérée par la rotule.", "Arrêt si douleur sous la rotule."),
    E("Leg extension à une jambe, descente en 4 secondes", "genou", 2, ["machine leg extension"], "3 × 8 par jambe",
      "À la machine, tends la jambe, puis laisse redescendre la charge lentement, en 4 secondes, sur une seule jambe.",
      "Montée contrôlée, descente très lente.", "On ne laisse pas la charge retomber.",
      "Isole le quadriceps, utile quand une cuisse reste plus faible que l'autre. Après une greffe de LCA, l'amplitude se règle avec le kiné.", "Arrêt si douleur sous la rotule."),
    E("Presse à une jambe, descente en 4 secondes", "genou", 2, ["presse à cuisses"], "3 × 8 par jambe",
      "À la presse, une seule jambe : pousse, puis laisse revenir la charge lentement en 4 secondes jusqu'à 90° de flexion du genou.",
      "Le genou reste dans l'axe du pied.", "On ne verrouille pas brutalement le genou en haut.",
      "Charge lourde possible sans contrainte d'équilibre.", "Arrêt si douleur dans le genou ou le bas du dos."),
    E("Squat à la barre, descente en 3 secondes", "genou", 3, ["barre et rack"], "4 × 5",
      "Barre sur le haut du dos. Descends en 3 secondes jusqu'à ce que les cuisses passent l'horizontale, puis remonte fort.",
      "Dos droit, genoux dans l'axe, talons au sol.", "Le dos ne s'arrondit pas en bas.",
      "La base de la force du bas du corps. Charge choisie pour garder 1 à 2 répétitions en réserve.", "Arrêt si douleur dans le genou, la hanche ou le dos."),
    E("Nordic curl complet", "ischio", 3, ["un appui pour bloquer les talons"], "3 × 4 à 6",
      "À genoux, talons bloqués sous un meuble lourd ou tenus par quelqu'un. Descends le buste vers l'avant le plus lentement possible, en 5 secondes, corps droit, puis rattrape-toi avec les mains et remonte.",
      "Le corps reste droit des genoux à la tête, la descente est très lente.", "On ne plie pas les hanches.",
      "Réduit nettement le risque de déchirure des ischio-jambiers chez les sportifs.", "Arrêt si douleur à l'arrière de la cuisse. Après une greffe DIDT : avec l'accord du kiné."),
    E("Soulevé de terre roumain unipodal lesté", "ischio", 3, ["un ou deux haltères"], "3 × 8 par jambe",
      "Debout sur une jambe, une charge dans chaque main. Penche le buste vers l'avant en reculant la jambe libre, dos droit, jusqu'à sentir l'arrière de la cuisse s'étirer, puis remonte.",
      "Le bassin reste horizontal, le dos droit.", "Le bassin ne s'ouvre pas sur le côté.",
      "Force des ischios et des fessiers en étirement, avec l'équilibre en plus.", "Arrêt si douleur à l'arrière de la cuisse."),
    E("Pont des ischios sur une jambe, talon sur la chaise", "ischio", 3, ["une chaise"], "3 × 8 par jambe",
      "Allongé sur le dos, un talon posé sur une chaise, l'autre jambe levée. Pousse dans le talon pour monter le bassin, tiens, puis redescends lentement.",
      "On pousse dans le talon, le bassin reste horizontal.", "On ne cambre pas le dos.",
      "Ischio-jambiers sur une jambe, en charge.", "Arrêt si crampe ou douleur à l'arrière de la cuisse."),
    E("Leg curl assis, retour en 4 secondes", "ischio", 2, ["machine leg curl"], "3 × 8",
      "À la machine, plie les genoux, puis laisse revenir la charge lentement, en 4 secondes.",
      "Retour très lent.", "On ne laisse pas la charge tirer d'un coup.",
      EXC, "Arrêt si douleur à l'arrière de la cuisse ou du genou."),
    E("Leg curl serviette, retour en 5 secondes", "ischio", 3, ["une serviette", "un sol lisse"], "3 × 6 par jambe",
      "Allongé sur le dos, bassin décollé, un talon sur une serviette. Ramène le talon vers les fesses, puis allonge la jambe très lentement en 5 secondes, bassin toujours décollé.",
      "Le bassin reste en l'air pendant tout le mouvement.", "On ne pose pas les fesses pendant le retour.",
      "Excentrique des ischios sans matériel.", "Arrêt si crampe ou douleur."),
    E("Élévation du talon lestée sur une marche", "mollet", 3, ["une marche", "un haltère ou un sac lesté", "un mur"], "3 × 10 par jambe",
      "Debout sur une jambe au bord d'une marche, une charge dans la main du même côté, l'autre main au mur. Monte le plus haut possible, puis descends lentement sous le niveau de la marche.",
      "Amplitude complète, descente lente.", "On ne rebondit pas en bas.",
      "Le mollet doit pouvoir porter plusieurs fois le poids du corps en course : la charge est indispensable en fin de rééducation.", "Insertion du tendon douloureuse : on reste au niveau de la marche."),
    E("Mollet assis lourd, descente en 3 secondes", "mollet", 2, ["une chaise", "une charge lourde sur les genoux"], "3 × 12",
      "Assis, une charge lourde posée sur les genoux (sac, haltère). Monte les talons, puis redescends en 3 secondes.",
      "Montée complète, descente lente.", "On ne s'aide pas avec les mains.",
      "Cible le soléaire, souvent oublié et pourtant essentiel en course.", "Arrêt si douleur au tendon d'Achille au-dessus de 5/10."),
    E("Sauts répétés sur une jambe (pogo)", "mollet", 3, [], "4 × 20 secondes par jambe",
      "Sur une jambe, enchaîne de petits rebonds rapides sur l'avant du pied, cheville raide, comme un ressort.",
      "Contact au sol très court, talon qui ne touche pas.", "On ne plie pas le genou pour amortir.",
      "Raideur et ressort du tendon d'Achille, indispensables avant de reprendre la course et le sport.", "Arrêt si douleur au tendon d'Achille ou sous le talon."),
    E("Éversion à l'élastique, retour en 4 secondes", "mollet", 2, ["un élastique", "une chaise"], "3 × 12 par pied",
      "Assis, élastique autour de l'avant-pied. Tourne le pied vers l'extérieur contre l'élastique, puis laisse-le revenir lentement en 4 secondes.",
      "Seul le pied bouge, la jambe reste immobile.", "Le genou ne part pas sur le côté.",
      "Chaîne externe de la cheville : les fibulaires, ceux qui empêchent la cheville de tourner.", "Arrêt si douleur sur le côté externe de la cheville."),
    E("Inversion à l'élastique, retour en 4 secondes", "mollet", 2, ["un élastique", "une chaise"], "3 × 12 par pied",
      "Assis, élastique autour de l'avant-pied. Tourne le pied vers l'intérieur contre l'élastique, puis laisse-le revenir lentement en 4 secondes.",
      "Seul le pied bouge.", "Le genou ne tourne pas avec le pied.",
      "Chaîne interne de la cheville : le tibial postérieur, qui soutient la voûte plantaire.", "Arrêt si douleur à l'intérieur de la cheville."),
    E("Marche sur la pointe des pieds lestée", "mollet", 3, ["deux charges lourdes"], "4 × 30 secondes",
      "Une charge lourde dans chaque main, marche sur la pointe des pieds, talons hauts, sans redescendre.",
      "Talons hauts pendant toute la marche.", "On ne se penche pas en avant.",
      "Endurance de force du mollet sous charge.", "Arrêt si douleur au tendon d'Achille."),
    E("Marche sur les talons lestée", "mollet", 2, ["deux charges"], "3 × 30 secondes",
      "Une charge dans chaque main, marche sur les talons, pointes de pieds bien relevées.",
      "Les pointes ne touchent jamais le sol.", "On ne se penche pas en arrière.",
      "Renforce l'avant de la jambe (tibial antérieur), qui freine le pied à chaque pas.", "Arrêt si douleur à l'avant de la jambe."),
    E("Corde à sauter sur une jambe", "mollet", 3, ["une corde ou une corde imaginaire"], "4 × 20 à 30 secondes par jambe",
      "Saute à la corde sur une seule jambe, petits sauts sur l'avant du pied, l'autre genou plié.",
      "Petits sauts réguliers, cheville souple mais tonique.", "On ne saute pas haut.",
      "Prépare la cheville et le mollet à la course et aux appuis.", "Arrêt si douleur à la cheville ou au tendon d'Achille."),
    E("Hip thrust sur une jambe", "hanche", 3, ["un canapé ou un banc"], "3 × 10 par jambe",
      "Haut du dos appuyé sur un canapé, un pied au sol, l'autre jambe levée. Pousse dans le talon pour monter le bassin jusqu'à l'alignement, tiens 2 secondes, puis redescends.",
      "Le bassin reste horizontal, on serre fort les fesses en haut.", "On ne cambre pas le bas du dos.",
      "La force du fessier, sur une jambe. Plus dur : une charge posée sur le bassin.", "Arrêt si douleur dans la hanche ou le dos."),
    E("Copenhague dynamique, descente en 4 secondes", "hanche", 3, ["un banc ou un canapé"], "3 × 6 par côté",
      "En planche sur le côté, le pied du dessus posé sur le banc. Monte le bassin, puis redescends lentement, en 4 secondes.",
      "Corps aligné, descente lente.", "On ne laisse pas le bassin tomber.",
      "Chaîne interne de la hanche : excentrique des adducteurs, la meilleure prévention des douleurs de l'aine.", "Arrêt si douleur dans l'aine."),
    E("Planche latérale avec levée de la jambe", "hanche", 3, [], "3 × 8 par côté",
      "En planche sur le côté, sur l'avant-bras. Monte la jambe du dessus, tiens, puis redescends lentement, le bassin toujours haut.",
      "Le bassin reste haut et aligné.", "On ne bascule pas en avant.",
      "Chaîne externe de la hanche (moyen fessier) et gainage en même temps.", "Arrêt si douleur sur le côté de la hanche."),
    E("Fente latérale lestée", "hanche", 3, ["deux haltères ou bouteilles"], "3 × 8 par côté",
      "Une charge dans chaque main. Fais un grand pas sur le côté et descends sur cette jambe, l'autre tendue, puis repousse pour revenir.",
      "Fesses en arrière, genou dans l'axe du pied.", "Le genou ne rentre pas.",
      "Renforce les adducteurs en étirement et les fessiers, pour les appuis latéraux du sport.", "Arrêt si douleur dans l'aine ou le genou."),
    E("Squat sumo lesté", "hanche", 2, ["un haltère ou un kettlebell"], "3 × 10",
      "Pieds très écartés, pointes vers l'extérieur, une charge tenue à deux mains entre les jambes. Descends en gardant le dos droit, puis remonte.",
      "Genoux dans l'axe des pieds, dos droit.", "Les genoux ne rentrent pas.",
      "Adducteurs et fessiers en charge.", "Arrêt si douleur dans l'aine."),
    E("Abduction debout, retour en 4 secondes", "hanche", 2, ["un élastique ou une poulie", "un mur"], "3 × 12 par jambe",
      "Debout, une main au mur, un élastique autour des chevilles. Écarte la jambe sur le côté, puis ramène-la lentement en 4 secondes.",
      "Le buste reste droit, la pointe du pied vers l'avant.", "On ne penche pas le buste.",
      "Chaîne externe : moyen fessier en excentrique.", "Arrêt si douleur sur le côté de la hanche."),
    E("Adduction couché sur le côté, jambe du dessous", "hanche", 2, ["un tapis", "un lest de cheville si besoin"], "3 × 12 par jambe",
      "Couché sur le côté, la jambe du dessus pliée devant toi, pied au sol. Monte la jambe du dessous tendue, tiens, puis redescends en 3 secondes.",
      "La jambe du dessous reste tendue, pointe vers l'avant.", "On ne roule pas en arrière.",
      "Chaîne interne : les adducteurs isolés. Plus dur : un lest à la cheville.", "Arrêt si douleur dans l'aine."),
    E("Rotation de hanche vers l'extérieur à l'élastique, assis", "hanche", 2, ["une chaise", "un élastique"], "3 × 12 par jambe",
      "Assis, un élastique autour de la cheville attaché sur le côté. Le genou reste immobile, le pied part vers l'intérieur : c'est la hanche qui tourne vers l'extérieur. Retour lent.",
      "La cuisse ne bouge pas, seul le tibia pivote.", "On ne soulève pas la fesse.",
      "Renforce les rotateurs externes de la hanche, qui empêchent le genou de rentrer.", "Arrêt si douleur dans l'aine ou le genou."),
    E("Rotation de hanche vers l'intérieur à l'élastique, assis", "hanche", 2, ["une chaise", "un élastique"], "3 × 12 par jambe",
      "Assis, un élastique autour de la cheville attaché de l'autre côté. Le genou reste immobile, le pied part vers l'extérieur : c'est la hanche qui tourne vers l'intérieur. Retour lent.",
      "La cuisse ne bouge pas, seul le tibia pivote.", "On ne soulève pas la fesse.",
      "Renforce les rotateurs internes de la hanche, souvent faibles dans les douleurs de hanche.", "Arrêt si douleur dans l'aine."),
    E("Rotation externe couché sur le côté, retour en 4 secondes", "epaule", 2, ["un haltère léger ou une bouteille"], "3 × 10 par bras",
      "Couché sur le côté, coude collé au corps, une charge dans la main du dessus. Tourne l'avant-bras vers le plafond, puis redescends lentement en 4 secondes.",
      "Coude collé, retour lent.", "On ne roule pas le buste en arrière.",
      "Chaîne externe de l'épaule (infra-épineux) en excentrique : celle qui freine le bras lors des lancers.", "Arrêt si douleur dans l'épaule."),
    E("Rotation interne à l'élastique, retour en 4 secondes", "epaule", 2, ["un élastique"], "3 × 12 par bras",
      "Debout, coude au corps à 90°, élastique attaché sur le côté. Ramène la main vers le ventre, puis laisse-la revenir lentement en 4 secondes.",
      "Coude collé au corps.", "Le coude ne s'écarte pas.",
      "Chaîne interne de l'épaule (sous-scapulaire), importante après une instabilité.", "Arrêt si douleur dans l'épaule."),
    E("Rotation externe à 90°, retour en 4 secondes", "epaule", 3, ["un élastique"], "3 × 10 par bras",
      "Bras écarté à 90°, coude à 90°, élastique devant toi. Monte l'avant-bras vers le haut, puis laisse-le redescendre lentement en 4 secondes.",
      "Coude à hauteur d'épaule, retour lent.", "On ne cambre pas le dos.",
      "La position du lanceur : prépare l'épaule aux gestes au-dessus de la tête.", "Arrêt si douleur ou appréhension dans l'épaule."),
    E("Pompes, descente en 4 secondes", "poussee", 3, [], "3 × 6 à 8",
      "En position de pompe, descends lentement, en 4 secondes, jusqu'à frôler le sol, puis remonte.",
      "Corps aligné, coudes à 45° du corps.", "Le bassin ne s'affaisse pas.",
      EXC + " Plus facile : sur les genoux.", "Arrêt si douleur dans l'épaule ou le poignet."),
    E("Pompes plyométriques", "poussee", 3, [], "4 × 5",
      "Fais une pompe, et pousse assez fort pour que les mains décollent du sol, puis réceptionne-toi souplement et enchaîne.",
      "Réception souple, coudes qui amortissent.", "On ne s'écrase pas sur le sol.",
      "Puissance de la poussée, pour les sports de contact et de lancer. Plus facile : contre un mur ou sur les genoux.", "Arrêt si douleur à l'épaule ou au poignet."),
    E("Développé épaules, descente en 4 secondes", "epaule", 2, ["une chaise", "deux haltères ou bouteilles"], "3 × 8",
      "Assis, une charge dans chaque main à hauteur d'épaules. Pousse au-dessus de la tête, puis redescends lentement en 4 secondes.",
      "Ventre serré, dos droit.", "On ne cambre pas le bas du dos.",
      "Force de l'épaule bras en haut, en excentrique.", "Arrêt si douleur dans l'épaule."),
    E("Marche avec une charge au-dessus de la tête", "epaule", 3, ["un haltère ou un kettlebell"], "3 × 30 secondes par bras",
      "Une charge tenue bras tendu au-dessus de la tête, marche lentement en gardant le bras bien vertical.",
      "Bras verrouillé à la verticale, ventre serré.", "Le bras ne part pas vers l'avant.",
      "Stabilité de l'épaule et du tronc, bras en haut.", "Arrêt si douleur ou fourmillements."),
    E("Dips sur chaise, descente en 4 secondes", "poussee", 3, ["une chaise solide"], "3 × 8",
      "Mains au bord d'une chaise derrière toi. Descends en pliant les coudes, lentement en 4 secondes, puis remonte.",
      "Coudes vers l'arrière, épaules basses.", "On ne descend pas trop bas si l'avant de l'épaule tire.",
      "Triceps et avant de l'épaule en excentrique.", "Arrêt si douleur à l'avant de l'épaule."),
    E("Tirage inversé, descente en 4 secondes", "tirage", 3, ["une table solide"], "3 × 8",
      "Allongé sous une table solide, mains au bord. Tire la poitrine vers la table, puis redescends lentement en 4 secondes.",
      "Corps droit, omoplates serrées en haut.", "Le bassin ne tombe pas.",
      "Dos et arrière de l'épaule, l'équilibre des pompes.", "Arrêt si douleur à l'épaule. Vérifie que la table est stable."),
    E("Élévation latérale, descente en 4 secondes", "epaule", 2, ["deux haltères ou bouteilles"], "3 × 10",
      "Une charge dans chaque main. Monte les bras sur le côté jusqu'à hauteur d'épaules, puis redescends lentement en 4 secondes.",
      "Coudes légèrement fléchis, épaules basses.", "On ne hausse pas les épaules.",
      "Deltoïde moyen en excentrique.", "Arrêt si douleur dans l'épaule."),
    E("Y-T-W lestés à plat ventre", "tirage", 3, ["deux bouteilles d'eau"], "3 × 8 de chaque lettre",
      "À plat ventre, une petite bouteille dans chaque main. Forme un Y bras en haut, puis un T bras sur le côté, puis un W coudes pliés, en levant les bras du sol à chaque fois.",
      "On serre les omoplates à chaque montée.", "On ne relève pas la tête.",
      "Muscles de l'omoplate et de l'arrière de l'épaule, sous charge.", "Arrêt si douleur dans l'épaule."),
    E("Roulette abdominale avec une serviette", "gainage", 3, ["une serviette", "un sol lisse"], "3 × 6 à 8",
      "À genoux, les mains sur une serviette. Fais glisser les mains loin devant toi en gardant le dos plat, puis ramène-les en serrant le ventre.",
      "Le dos reste plat, le ventre serré.", "Le bas du dos ne se creuse pas.",
      "Gainage très exigeant de l'avant du tronc.", "Arrêt si douleur dans le bas du dos."),
    E("Planche latérale avec descentes du bassin", "gainage", 3, [], "3 × 10 par côté",
      "En planche sur le côté. Descends le bassin presque jusqu'au sol, puis remonte au-dessus de l'alignement.",
      "Mouvement contrôlé, corps aligné.", "On ne bascule pas en avant.",
      "Muscles latéraux du tronc et de la hanche, en mouvement.", "Arrêt si douleur dans l'épaule ou le dos."),
    E("Extension lombaire lestée au sol", "dos", 3, ["deux bouteilles"], "3 × 10",
      "À plat ventre, une bouteille dans chaque main, bras le long du corps. Décolle le buste, tiens 2 secondes, puis redescends.",
      "Regard vers le sol, on monte peu mais on tient.", "On ne lance pas le buste.",
      "Muscles du dos en charge, pour porter et soulever.", "Arrêt si douleur qui descend dans la jambe."),
    E("Dead bug lesté", "gainage", 3, ["deux bouteilles"], "3 × 10",
      "Couché sur le dos, une bouteille dans chaque main, bras tendus vers le plafond, jambes à 90°. Descends un bras et la jambe opposée sans que le bas du dos décolle.",
      "Le bas du dos reste collé au sol.", "On ne retient pas la respiration.",
      "Gainage profond et coordination, sous charge.", "Arrêt si le bas du dos se creuse ou fait mal."),
    E("Soulevé de terre avec deux sacs, descente en 4 secondes", "dos", 3, ["deux sacs lourds ou deux haltères"], "3 × 8",
      "Un sac dans chaque main. Descends les sacs le long des jambes en 4 secondes, fesses en arrière, dos droit, puis relève-toi en poussant les hanches.",
      "Dos droit, sacs le long des jambes.", "On ne s'arrondit pas en bas.",
      EXC, "Arrêt si douleur vive ou qui descend dans la jambe."),
    E("Planche sur les mains, levée de jambe", "gainage", 3, [], "3 × 8 par jambe",
      "En planche sur les mains. Monte une jambe tendue sans que le bassin bouge, tiens, puis repose, et alterne.",
      "Le bassin reste immobile et horizontal.", "Le bassin ne tourne pas.",
      "Gainage avec moins d'appuis : le tronc doit résister à la rotation.", "Arrêt si douleur dans le dos ou l'épaule.")
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F.filter(function (f) { return KineAvatar.supports(f.name); }));
  var U = function (s2, e) { return { s: s2, e: e }; };
  var SPORT = ["Reprendre le sport", "Courir et sauter", "Porter des charges"];
  var USE = {};
  F.forEach(function (f) { USE[f.name] = U(f.tip.split(". ")[0].replace(/\.$/, "") + ".", SPORT); });
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });
  window.KineRenfoEx = { names: F.map(function (f) { return f.name; }).filter(function (n) { return KineAvatar.supports(n); }), all: F.map(function (f) { return f.name; }) };
})();
