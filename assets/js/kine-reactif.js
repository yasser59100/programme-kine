/* ═══════════ KinéForce — exercices réactifs « couleurs » ═══════════
   Le patient dispose 2 à 4 plots (ou objets) de couleurs différentes. L'écran s'allume d'une couleur,
   Yass l'annonce, le patient va toucher le plot de cette couleur, puis revient. 10, 15 ou 20 couleurs par série,
   au rythme choisi. Les exercices sur une jambe se font des deux côtés. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // Toutes les couleurs proposées : le patient coche celles de ses plots (2 à 4)
  var COLS = [
    { id: "rouge", name: "Rouge", hex: "#FF4D5E", ink: "#fff" },
    { id: "bleu", name: "Bleu", hex: "#3D8EF0", ink: "#fff" },
    { id: "jaune", name: "Jaune", hex: "#FFD23F", ink: "#14181f" },
    { id: "vert", name: "Vert", hex: "#2ECC71", ink: "#0c1a12" },
    { id: "orange", name: "Orange", hex: "#FF8A2B", ink: "#1a0f05" },
    { id: "violet", name: "Violet", hex: "#8E5CF0", ink: "#fff" },
    { id: "rose", name: "Rose", hex: "#FF7EB6", ink: "#2a0716" },
    { id: "blanc", name: "Blanc", hex: "#F4F6FA", ink: "#14181f" },
    { id: "noir", name: "Noir", hex: "#000000", ink: "#fff", ring: true },
    { id: "gris", name: "Gris", hex: "#8B95A5", ink: "#fff" },
    { id: "marron", name: "Marron", hex: "#8B5A2B", ink: "#fff" },
    { id: "turquoise", name: "Turquoise", hex: "#1FC8C8", ink: "#06201f" }
  ];
  function colById(id) { for (var i = 0; i < COLS.length; i++) if (COLS[i].id === id) return COLS[i]; return COLS[0]; }
  function mine(s) { return (s.cols || []).map(colById); }
  function pasLe(c) { return /^[aeiouy]/i.test(c.name) ? "Pas l'" + c.name.toLowerCase() : "Pas le " + c.name.toLowerCase(); }
  var RYTHMES = [["calme", "Calme", 3000], ["soutenu", "Soutenu", 2000], ["rapide", "Rapide", 1500]];
  var COUNTS = [10, 15, 20];

  // Schémas vus de dessus : P = patient, C = chaise, plots = positions (x, y) dans un cadre 300 × 190
  var EXOS = [
    { id: "fentes", name: "Fentes réactives", level: 3, sides: false,
      kit: "tes plots et un sol dégagé",
      place: "Debout, pieds joints. Pose les plots au sol devant toi, en arc de cercle, à un grand pas : un en diagonale à gauche, un droit devant, un en diagonale à droite, et le quatrième sur le côté si tu en as quatre.",
      action: "À chaque couleur, fais une fente : avance le pied vers le plot de cette couleur, touche-le du pied en pliant les deux genoux, puis pousse pour revenir pieds joints.",
      cue: "Le genou avant reste dans l'axe du pied. Reviens toujours bien au centre avant la couleur suivante.",
      spots: [[80, 62], [150, 35], [220, 62], [250, 120]], feet: "both",
      av: [[0.62, 0.74], [0, 0.98], [-0.62, 0.74], [-1.0, 0.06]] },
    { id: "bulgare", name: "Sauts bulgares réactifs", level: 3, sides: true, sideWord: "jambe",
      kit: "une chaise stable calée contre un mur, et tes plots",
      place: "Dos à la chaise, pose le dessus du pied arrière sur l'assise, le pied avant un grand pas devant. Pose les plots au sol autour du pied avant, à 40 ou 50 cm : un à gauche, un devant, un à droite, et un en diagonale si tu en as quatre.",
      action: "À chaque couleur, fais un petit saut sur la jambe avant pour atterrir à côté du plot de cette couleur, genou fléchi, puis un petit saut pour revenir au centre. Le pied arrière reste sur la chaise.",
      cue: "Atterris en douceur, genou souple et dans l'axe du pied. Commence par de tout petits sauts.",
      spots: [[68, 100], [150, 38], [232, 100], [92, 50]], chair: true, feet: "split",
      av: [[0.42, 0.4], [-0.1, 0.9], [-0.62, 0.4], [0.28, 0.8]] },
    { id: "chasses", name: "Pas chassés réactifs", level: 2, sides: false,
      kit: "tes plots et environ 3 mètres d'espace sur les côtés",
      place: "Debout au centre, légèrement fléchi. Pose un plot loin à gauche et un loin à droite (environ 3 pas chassés), puis les autres devant et derrière toi si tu en as plus.",
      action: "À chaque couleur, rejoins le plot en pas chassés, sans croiser les pieds, touche-le du pied, puis reviens au centre.",
      cue: "Reste fléchi, le buste face à l'avant, et pousse sur la jambe extérieure.",
      spots: [[30, 105], [270, 105], [150, 28], [150, 180]], feet: "both",
      av: [[1.25, 0.05], [-1.25, 0.05], [0, 1.15], [0, -1.0]] },
    { id: "chasses1", name: "Sauts latéraux sur une jambe réactifs", level: 3, sides: true, sideWord: "jambe",
      kit: "tes plots et environ 2 mètres d'espace autour de toi, sol non glissant",
      place: "Debout sur une jambe au centre, genou légèrement fléchi. Pose un plot à gauche et un à droite, à environ 70 cm, puis un devant et un derrière si tu en as quatre.",
      action: "À chaque couleur, fais un petit saut sur la même jambe pour atterrir à côté du plot de cette couleur, tiens une seconde bien stable, puis reviens au centre en sautant.",
      cue: "Atterris en douceur sur l'avant du pied, genou souple et dans l'axe. Commence par de petits sauts, et pose l'autre pied si tu perds l'équilibre.",
      spots: [[50, 100], [250, 100], [150, 32], [150, 172]], feet: "one",
      av: [[0.82, 0.08], [-0.66, 0.08], [0.08, 0.78], [0.08, -0.6]] },
    { id: "squat", name: "Squat réactif", level: 2, sides: false,
      kit: "tes plots",
      place: "Debout, pieds largeur d'épaules. Pose les plots au sol devant toi, en arc de cercle, à une longueur de bras : un à gauche, un au centre, un à droite.",
      action: "À chaque couleur, descends en squat et touche le plot de cette couleur avec la main, puis remonte bien droit.",
      cue: "Les fesses reculent, le dos reste plat, les talons restent au sol.",
      spots: [[80, 80], [150, 50], [220, 80], [150, 22]], feet: "both",
      av: [[0.4, 0.5], [0, 0.6], [-0.4, 0.5], [0, 0.78]] },
    { id: "unipodal", name: "Équilibre réactif sur une jambe", level: 2, sides: true, sideWord: "jambe",
      kit: "tes plots, et un appui stable à portée de main (mur, dossier de chaise)",
      place: "Debout sur une jambe au centre. Pose les plots au sol autour de toi, à environ 50 cm : un devant, un sur le côté, un en arrière en diagonale.",
      action: "À chaque couleur, touche le plot du bout du pied libre, sans poser le pied, puis reviens au centre.",
      cue: "Le genou d'appui est légèrement fléchi et reste dans l'axe du pied.",
      spots: [[150, 40], [235, 105], [80, 160], [70, 60]], feet: "one",
      av: [[-0.06, 0.62], [-0.6, 0.08], [0.32, -0.42], [0.42, 0.5]] },
    { id: "pas", name: "Pas réactifs", level: 1, sides: false,
      kit: "tes plots et un peu d'espace",
      place: "Debout au centre. Pose les plots au sol autour de toi, à un grand pas : un devant, un à gauche, un à droite, un derrière si tu en as quatre.",
      action: "À chaque couleur, fais un pas vers le plot, touche-le du pied, puis reviens au centre.",
      cue: "Reste léger sur les pieds et reviens toujours au centre.",
      spots: [[150, 30], [55, 105], [245, 105], [150, 175]], feet: "both",
      av: [[0, 0.9], [0.9, 0.05], [-0.9, 0.05], [0, -0.8]] },
    { id: "assis", name: "Réaction assis", level: 1, sides: false,
      kit: "une chaise stable sans roulettes et tes plots (ou objets de couleur)",
      place: "Assis au bord d'une chaise, pieds à plat. Pose les plots au sol autour de tes pieds, à portée : un à gauche, un devant, un à droite, un en diagonale si tu en as quatre.",
      action: "À chaque couleur, va toucher le plot de cette couleur avec le pied, puis repose le pied au centre.",
      cue: "Reste bien assis, le dos droit. Pour plus de difficulté, alterne les pieds.",
      spots: [[85, 70], [150, 40], [215, 70], [230, 130]], feet: "seat",
      av: [[0.42, 0.36], [0, 0.56], [-0.42, 0.36], [-0.46, -0.02]] },
    { id: "signal", name: "Réception sur signal", level: 3, sides: false, signal: true,
      kit: "un sol dégagé et non glissant, et ton téléphone posé à hauteur des yeux, à 2 ou 3 mètres",
      place: "Debout, pieds largeur de bassin, face au téléphone.",
      action: "Au bip « Saute », saute bien haut sur tes deux pieds. Pendant le saut, l'écran et Yass t'annoncent ta réception : gauche, droite ou deux pieds. Atterris comme annoncé et tiens 3 secondes, immobile.",
      cue: "Réception en douceur : genou fléchi et dans l'axe du pied, bassin bien horizontal. Commence avec le signal « Tôt », puis « En l'air » quand c'est facile.",
      spots: [], feet: "both", av: [] }
  ];
  /* Réception sur signal : la jambe de réception est annoncée pendant le saut */
  var SIG = [
    { id: "g", name: "Gauche", big: "GAUCHE", arrow: "←", hex: "#3D8EF0", ink: "#fff", say: "Gauche !", f: 520 },
    { id: "d", name: "Droite", big: "DROITE", arrow: "→", hex: "#FF8A2B", ink: "#1a0f05", say: "Droite !", f: 1040 },
    { id: "2", name: "Deux pieds", big: "DEUX PIEDS", arrow: "↓", hex: "#F4F6FA", ink: "#14181f", say: "Deux pieds !", f: 780 }
  ];
  var MOMENTS = [["tot", "Tôt", 0, "avec le bip"], ["pendant", "Pendant l'impulsion", 300, "0,3 s après le bip"], ["air", "En l'air", 600, "0,6 s après le bip"]];
  var SCOUNTS = [6, 10, 15];
  var SRYTHMES = [["calme", "Calme", 7000], ["soutenu", "Soutenu", 5000], ["rapide", "Rapide", 3500]];
  // Ordre équilibré : autant de gauche que de droite, quelques « deux pieds », jamais trois fois la même de suite
  function sigSeq(n, deux) {
    var k2 = deux ? Math.max(1, Math.round(n * 0.2)) : 0, half = (n - k2) / 2, out = [], i;
    for (i = 0; i < Math.floor(half); i++) out.push(0, 1);
    if (out.length + k2 < n) out.push(Math.random() < 0.5 ? 0 : 1);
    for (i = 0; i < k2; i++) out.push(2);
    for (var tries = 0; tries < 200; tries++) {
      for (i = out.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = out[i]; out[i] = out[j]; out[j] = t; }
      var ok = true; for (i = 2; i < out.length; i++) if (out[i] === out[i - 1] && out[i] === out[i - 2]) ok = false;
      if (ok) break;
    }
    return out;
  }
  var LVL = { 1: ["vert", "Facile"], 2: ["orange", "Intermédiaire"], 3: ["rouge", "Difficile"] };

  function settings() {
    var s = Object.assign({ exo: "fentes", count: 15, rythme: "soutenu", pieges: false, sig: "pendant", deux: true, scount: 10 }, jget("kf-reactif-set", {}));
    if (!Array.isArray(s.cols) || s.cols.length < 2) s.cols = ["rouge", "bleu", "jaune", "vert"].slice(0, Math.min(4, Math.max(2, s.ncol || 3)));
    if (!EXOS.some(function (e) { return e.id === s.exo; })) s.exo = "fentes";
    return s;
  }
  function save(s) { jset("kf-reactif-set", s); }
  function exoOf(id) { for (var i = 0; i < EXOS.length; i++) if (EXOS[i].id === id) return EXOS[i]; return EXOS[0]; }

  function say(t) { if (typeof speak === "function") { try { speak(t, { prio: 1, now: true, ttl: 2500 }); } catch (e) {} } }
  function beep(f, d, v) { if (typeof playBeep === "function") playBeep(f, d, v, "triangle"); }

  /* ── Schéma de placement ── */
  function diagram(ex, cols) {
    if (ex.signal) return "<svg class='kr-svg' viewBox='0 0 300 120' role='img' aria-label='Les trois signaux de réception'>" + SIG.map(function (g, i) {
        var x = 55 + i * 95;
        return "<rect x='" + (x - 42) + "' y='18' width='84' height='60' rx='12' fill='" + g.hex + "'/><text x='" + x + "' y='58' text-anchor='middle' font-size='28' font-weight='800' fill='" + g.ink + "'>" + g.arrow + "</text>" +
          "<text x='" + x + "' y='102' text-anchor='middle' font-size='13' font-weight='700' fill='currentColor'>" + g.name + "</text>";
      }).join("") + "</svg>";
    var cones = ex.spots.slice(0, cols.length).map(function (p, i) {
      var c = cols[i];
      return "<g><path d='M" + (p[0] - 11) + " " + (p[1] + 9) + " L" + p[0] + " " + (p[1] - 12) + " L" + (p[0] + 11) + " " + (p[1] + 9) + " Z' fill='" + c.hex + "' stroke='" + (c.ring ? "rgba(255,255,255,.75)" : "rgba(0,0,0,.35)") + "' stroke-width='1.5'/>" +
        "<rect x='" + (p[0] - 14) + "' y='" + (p[1] + 8) + "' width='28' height='4' rx='2' fill='" + c.hex + "' opacity='.7'/></g>";
    }).join("");
    var cx = 150, cy = ex.chair ? 128 : (ex.feet === "one" ? 100 : ex.feet === "seat" ? 95 : 110);
    var foot = function (x, y, op) { return "<ellipse cx='" + x + "' cy='" + y + "' rx='7' ry='13' fill='currentColor' opacity='" + (op || 0.9) + "'/>"; };
    var body = "";
    if (ex.feet === "split") body = foot(cx, cy - 6) + "<rect x='118' y='160' width='64' height='24' rx='5' fill='none' stroke='currentColor' stroke-width='2' opacity='.55'/>" +
      "<text x='150' y='176' text-anchor='middle' font-size='10' fill='currentColor' opacity='.7'>chaise</text>" + foot(cx, 166, 0.45);
    else if (ex.feet === "one") body = foot(cx, cy);
    else if (ex.feet === "seat") body = foot(cx - 14, cy) + foot(cx + 14, cy) + "<rect x='120' y='118' width='60' height='44' rx='6' fill='none' stroke='currentColor' stroke-width='2' opacity='.55'/>" +
      "<text x='150' y='145' text-anchor='middle' font-size='10' fill='currentColor' opacity='.7'>chaise</text>";
    else body = foot(cx - 14, cy) + foot(cx + 14, cy);
    var ring = ex.id === "pas" ? "<circle cx='150' cy='105' r='22' fill='none' stroke='currentColor' stroke-dasharray='4 4' opacity='.4'/>" : "";
    return "<svg class='kr-svg' viewBox='0 0 300 190' role='img' aria-label='Placement des plots vu de dessus'>" + ring + cones + body +
      "<text x='292' y='14' text-anchor='end' font-size='10' fill='currentColor' opacity='.6'>vu de dessus</text></svg>";
  }

  /* ── Démonstration par l'avatar : Yass va toucher les plots de vos couleurs ── */
  function avDef(ex, cols) {
    var L = KineAvatar.lib, M = L.merge, n = cols.length;
    if (ex.signal) return sigAv(L, M);
    var ARMS_BAL = { LA: { ang: [25, 30, 0, 25] }, RA: { ang: [25, 30, 0, 25] } };
    var base = ex.id === "assis" ? M({ pelvis: { p: [0, 0.53, -0.36], r: [0, 0, 0] }, spine: [6, 0, 0], head: 0,
                 L: { foot: { at: [0.14, 0, 0.14], yaw: 6 } }, R: { foot: { at: [-0.14, 0, 0.14], yaw: -6 } }, LA: { ang: [6, 14, 0, 50] }, RA: { ang: [6, 14, 0, 50] } }, {})
             : ex.id === "unipodal" || ex.id === "chasses1" ? M(L.STAND(0.11, 6), { pelvis: { p: [0.07, 0.9, 0], r: [6, 0, 0] }, L: { foot: { at: [0.1, 0, 0.12], yaw: 6 } }, R: { foot: { at: [-0.1, 0.16, 0.06], yaw: -6 } } }, ARMS_BAL)
             : ex.id === "chasses" ? M(L.STAND(0.17, 8), { pelvis: { p: [0, 0.86, 0], r: [14, 0, 0] }, spine: [8, 0, 0] }, ARMS_BAL)
             : ex.id === "bulgare" ? M(L.STAND(0.1, 0), { pelvis: { p: [0, 0.8, 0.16], r: [10, 0, 0] }, spine: [6, 0, 0],
                 L: { foot: { at: [0.1, 0.48, -0.5], yaw: 0, lift: 75, pole: [0, -1, 0.45] } }, R: { foot: { at: [-0.1, 0, 0.36], yaw: 0 } } }, { LA: { ang: [30, 18, 0, 40] }, RA: { ang: [30, 18, 0, 40] } })
             : ex.id === "squat" ? L.STAND(0.17, 10)
             : L.STAND(0.11, 6);
    if (ex.id === "chasses1") base = M(base, { R: { foot: { at: [-0.12, 0.36, -0.2], yaw: -6, lift: 30 } } });
    var poses = { mid: base };
    ex.av.slice(0, n).forEach(function (c, i) {
      var x = c[0], z = c[1], d = Math.sqrt(x * x + z * z), ux = x / d, uz = z / d, th = Math.atan2(x, z) * 180 / Math.PI;
      var lead = x > 0.05 ? "L" : "R", other = lead === "L" ? "R" : "L", sg = lead === "L" ? 1 : -1, P;
      var keep = function (side) { return { foot: { at: [side === "L" ? 0.1 : -0.1, 0, 0.12], yaw: side === "L" ? 6 : -6, lift: 0 } }; };
      if (ex.id === "fentes" || ex.id === "pas") {
        var deep = ex.id === "fentes", reach = d - 0.17;
        if (Math.abs(th) > 70) {        // fente latérale
          P = { pelvis: { p: [ux * reach * 0.45, deep ? 0.7 : 0.86, -0.06], r: [deep ? 28 : 10, 0, 0] }, spine: [6, 0, 0] };
          P[lead] = { foot: { at: [ux * reach, 0, 0.1], yaw: sg * 25 } }; P[other] = keep(other);
        } else if (z < 0) {             // pas en arrière
          P = { pelvis: { p: [0, 0.9, -0.28], r: [4, 0, 0] } };
          P.R = { foot: { at: [-0.1, 0, z + 0.17], yaw: -4, lift: 35 } }; P.L = keep("L");
        } else {                        // fente avant ou en diagonale
          P = { pelvis: { p: [ux * reach * 0.48, deep ? 0.58 : 0.84, uz * reach * 0.48 - (deep ? 0.04 : 0)], r: [0, th * 0.5, 0] }, spine: [deep ? 4 : 2, 0, 0] };
          P[lead] = { foot: { at: [ux * reach, 0, uz * reach], yaw: th } }; P[other] = { foot: { at: [lead === "L" ? -0.1 : 0.1, 0, 0.12], yaw: th * 0.5, lift: deep ? 45 : 20 } };
        }
        poses["c" + i] = M(base, P, { LA: { ang: [14, 16, 0, 30] }, RA: { ang: [14, 16, 0, 30] } });
      } else if (ex.id === "bulgare") {   // petit saut sur la jambe avant vers le plot, le pied arrière reste sur la chaise
        var fx = -0.1 + (x + 0.1) * 0.72, fz = 0.36 + (z - 0.36) * 0.72, dx = fx + 0.1, dz = fz - 0.36;
        var rear = { L: { foot: { at: [0.1, 0.48, -0.5], yaw: 0, lift: 75, pole: [0, -1, 0.45] } } };
        poses["j" + i] = M(base, rear, { pelvis: { p: [dx * 0.35, 0.9, 0.16 + dz * 0.35], r: [6, 0, 0] }, R: { foot: { at: [-0.1 + dx * 0.5, 0.12, 0.36 + dz * 0.5], yaw: 0 } },
                                         LA: { ang: [55, 20, 0, 30] }, RA: { ang: [55, 20, 0, 30] } });
        poses["c" + i] = M(base, rear, { pelvis: { p: [dx * 0.55, 0.7, 0.16 + dz * 0.55], r: [14, 0, 0] }, spine: [8, 0, 0], R: { foot: { at: [fx, 0, fz], yaw: x * 20 } } });
      } else if (ex.id === "chasses1") {   // saut sur la jambe gauche vers le plot, l'autre pied reste en l'air
        var ax = x - ux * 0.16, az = z - uz * 0.16 + 0.04, hx = (ax - 0.1) * 0.5 + 0.1, hz = (az - 0.12) * 0.5 + 0.12;
        var tuck = function (px, pz, y) { return { foot: { at: [px - 0.18, y + 0.2, pz - 0.3], yaw: -6, lift: 30 } }; };   // jambe libre bien fléchie, pied derrière
        poses["j" + i] = M(base, { pelvis: { p: [hx - 0.03, 1.0, hz - 0.12], r: [8, 0, ux * -6] }, L: { foot: { at: [hx, 0.14, hz], yaw: 6, lift: -15 } }, R: tuck(hx, hz, 0.24),
                                   LA: { ang: [30, 45, 0, 30] }, RA: { ang: [30, 45, 0, 30] } });
        poses["c" + i] = M(base, { pelvis: { p: [ax - 0.03, 0.84, az - 0.14], r: [16, 0, 0] }, spine: [6, 0, 0], L: { foot: { at: [ax, 0, az], yaw: 6 } }, R: tuck(ax, az, 0.16) });
      } else if (ex.id === "chasses") {
        var tx = x - ux * 0.28, tz = z - uz * 0.28;
        P = { pelvis: { p: [tx, 0.84, tz], r: [14, 0, 0] } };
        if (Math.abs(ux) > 0.5) { P[lead] = { foot: { at: [tx + sg * 0.24, 0, tz + 0.12], yaw: sg * 10 } }; P[other] = { foot: { at: [tx - sg * 0.12, 0, tz + 0.12], yaw: -sg * 8 } }; }
        else { P.L = { foot: { at: [tx + 0.17, 0, tz + 0.12 + uz * 0.12], yaw: 8 } }; P.R = { foot: { at: [tx - 0.17, 0, tz + 0.12 - uz * 0.05], yaw: -8 } }; }
        poses["c" + i] = M(base, P);
      } else if (ex.id === "squat") {
        var hand = lead === "L" ? "LA" : "RA";
        P = { pelvis: { p: [ux * 0.06, 0.62 - (d > 0.7 ? 0.04 : 0), -0.14], r: [d > 0.7 ? 62 : 52, th * 0.35, 0] }, spine: [10, 0, 0], head: -10 };
        P[hand] = { hand: { at: [x - ux * 0.03, 0.25, z - uz * 0.03], pole: [sg * 0.6, 0.2, -1] } };
        poses["c" + i] = M(base, P);
      } else if (ex.id === "unipodal") {
        var back = z < 0;
        P = { pelvis: { p: [0.07, back ? 0.8 : 0.83, back ? 0.04 : -0.04], r: [back ? 34 : 14, 0, 0] }, spine: [back ? 10 : 4, 0, 0] };
        P.R = { foot: { at: [x, 0.02, z], yaw: th * 0.3, lift: back ? 50 : 15 } };
        poses["c" + i] = M(base, P);
      } else {                          // assis
        P = { spine: [2, 0, 0] }; P[lead] = { foot: { at: [x - ux * 0.08, 0.02, z - uz * 0.08], yaw: sg * 15, lift: 10 } };
        poses["c" + i] = M(base, P);
      }
    });
    // Vu de dos, légèrement en hauteur : la gauche de l'écran est la gauche de Yass, comme sur le schéma vu de dessus
    return { camera: ex.id === "bulgare" ? { yaw: 2.35, pitch: 0.95, dist: 4.4, ty: 0.45, tz: 0.25 }
                   : ex.id === "assis" ? { yaw: Math.PI - 0.95, pitch: 0.5, dist: 4.0, ty: 0.55, tz: 0.1 }
                   : ex.id === "chasses1" ? { yaw: Math.PI - 0.3, pitch: 0.5, dist: 4.7, ty: 0.78, tz: 0.05 }
                   : ex.id === "chasses" ? { yaw: Math.PI - 0.25, pitch: 0.5, dist: 5.6, ty: 0.75 }
                   : { yaw: Math.PI - 0.4, pitch: 0.48, dist: 4.6, ty: 0.8, tz: 0.2 },
             props: ex.id === "assis" || ex.id === "bulgare" ? ["chair"] : undefined, chair: ex.id === "bulgare" ? { z: -0.14 } : undefined, noIso: true, start: "mid",
             cones: ex.av.slice(0, n).map(function (c, i) { return { at: c, hex: cols[i].hex }; }), poses: poses };
  }
  // Réception sur signal : Yass se baisse, saute, puis atterrit sur la jambe annoncée (c0 gauche, c1 droite, c2 deux pieds)
  function sigAv(L, M) {
    var st = L.STAND(0.12, 6), arms = function (a) { return { LA: { ang: a.slice() }, RA: { ang: a.slice() } }; };
    var tuck = function (x) { return { foot: { at: [x, 0.32, -0.14], yaw: 0, lift: 35 } }; };
    return { camera: { yaw: Math.PI - 0.35, pitch: 0.3, dist: 4.4, ty: 0.85, tz: 0.05 }, noIso: true, start: "mid",
      poses: {
        mid: M(st, arms([10, 14, 0, 20])),
        k: M(st, { pelvis: { p: [0, 0.74, -0.12], r: [30, 0, 0] }, spine: [14, 0, 0], head: -8 }, arms([-35, 12, 0, 12])),
        j: M(st, { pelvis: { p: [0, 1.1, 0], r: [4, 0, 0] }, L: { foot: { at: [0.11, 0.18, 0.06], yaw: 6, lift: -20 } }, R: { foot: { at: [-0.11, 0.18, 0.06], yaw: -6, lift: -20 } } }, arms([150, 14, 0, 18])),
        c0: M(st, { pelvis: { p: [0.07, 0.82, -0.05], r: [18, 0, 0] }, spine: [8, 0, 0], L: { foot: { at: [0.1, 0, 0.1], yaw: 6 } }, R: tuck(-0.12) }, arms([30, 42, 0, 30])),
        c1: M(st, { pelvis: { p: [-0.07, 0.82, -0.05], r: [18, 0, 0] }, spine: [8, 0, 0], R: { foot: { at: [-0.1, 0, 0.1], yaw: -6 } }, L: tuck(0.12) }, arms([30, 42, 0, 30])),
        c2: M(st, { pelvis: { p: [0, 0.76, -0.1], r: [26, 0, 0] }, spine: [10, 0, 0], L: { foot: { at: [0.12, 0, 0.12], yaw: 8 } }, R: { foot: { at: [-0.12, 0, 0.12], yaw: -8 } } }, arms([45, 16, 0, 30]))
      } };
  }
  // Boucle de démonstration : « Saute », envol, signal, réception tenue
  function sigLoop(A, tag, wait) {
    var last = -1;
    (function cycle() {
      var i; do { i = Math.floor(Math.random() * 3); } while (i === last); last = i;
      var g = SIG[i];
      if (tag) { tag.textContent = "Saute"; tag.style.background = "#0E141F"; tag.style.color = "#fff"; tag.classList.add("on"); }
      A.step({ pose: "k", dur: 0.4 });
      wait(420, function () { A.step({ pose: "j", dur: 0.26 });
        wait(260, function () { if (tag) { tag.textContent = g.name; tag.style.background = g.hex; tag.style.color = g.ink; }
          A.step({ pose: "c" + i, dur: 0.24 });
          wait(1500, function () { if (tag) tag.classList.remove("on"); A.step({ pose: "mid", dur: 0.6 }); wait(1100, cycle); }); }); });
    })();
  }
  var demoId = 0;
  function demo(stage, ex, cols) {
    if (!stage || !window.KineAvatar || !KineAvatar.register || !KineAvatar.lib) { if (stage) stage.remove(); return; }
    var avHop = ex.id === "bulgare" || ex.id === "chasses1";
    KineAvatar.register("__kr_demo", avDef(ex, cols));
    if (!KineAvatar.show(stage.querySelector(".kr-stage"), "__kr_demo")) { stage.remove(); return; }
    var id = ++demoId, tag = stage.querySelector(".kr-tag"), last = -1;
    var alive = function () { return id === demoId && stage.isConnected; };
    function wait(ms, f) { setTimeout(function () { if (alive()) f(); else if (id === demoId && stage.querySelector("canvas")) KineAvatar.hide(); }, ms); }
    if (ex.signal) { sigLoop(KineAvatar, tag, wait); return; }
    (function cycle() {
      var i; do { i = Math.floor(Math.random() * cols.length); } while (i === last && cols.length > 1); last = i;
      var c = cols[i];
      tag.textContent = c.name; tag.style.background = c.hex; tag.style.color = c.ink; tag.classList.add("on");
      wait(350, function () {
        var hop = !!(KineAvatar.startOf && avHop);
        if (hop) {   // saut : envol, atterrissage près du plot, envol, retour au centre
          KineAvatar.step({ pose: "j" + i, dur: 0.28 });
          wait(280, function () { KineAvatar.step({ pose: "c" + i, dur: 0.24 });
            wait(1000, function () { tag.classList.remove("on"); KineAvatar.step({ pose: "j" + i, dur: 0.26 });
              wait(260, function () { KineAvatar.step({ pose: "mid", dur: 0.26 }); wait(1300, cycle); }); }); });
          return;
        }
        KineAvatar.step({ pose: "c" + i, dur: 0.85 });
        wait(1350, function () {
          tag.classList.remove("on"); KineAvatar.step({ pose: "mid", dur: 0.8 });
          wait(1300, cycle);
        });
      });
    })();
  }

  // Petite démo dans une vignette (bibliothèque) : l'avatar touche les plots tant que la case est au centre de l'écran
  function mini(box, id, alive, A) {
    A = A || window.KineAvatar;
    if (!box || !A || !window.KineAvatar || !KineAvatar.lib) return false;
    var ex = exoOf(id), cols = COLS.slice(0, 3), avHop = ex.id === "bulgare" || ex.id === "chasses1";
    A.register("__kr_mini", avDef(ex, cols));
    if (!A.show(box, "__kr_mini")) return false;
    var last = -1;
    function wait(ms, f) { setTimeout(function () { if (alive()) f(); }, ms); }
    if (ex.signal) { sigLoop(A, null, wait); return true; }
    (function cycle() {
      var i; do { i = Math.floor(Math.random() * cols.length); } while (i === last && cols.length > 1); last = i;
      if (avHop) {
        A.step({ pose: "j" + i, dur: 0.28 });
        wait(280, function () { A.step({ pose: "c" + i, dur: 0.24 });
          wait(900, function () { A.step({ pose: "j" + i, dur: 0.26 });
            wait(260, function () { A.step({ pose: "mid", dur: 0.26 }); wait(900, cycle); }); }); });
        return;
      }
      A.step({ pose: "c" + i, dur: 0.8 });
      wait(1200, function () { A.step({ pose: "mid", dur: 0.7 }); wait(1000, cycle); });
    })();
    return true;
  }

  /* ── Écran de réglage ── */
  var SESS = null;   // lancé depuis une séance : { onDone } (la série validée fait avancer la séance)
  function open(exoId, sess) {
    if (sess !== undefined) SESS = sess || null;
    var s = settings(); if (exoId) { s.exo = exoId; save(s); }
    var el = $("kr-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kr-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Exercices réactifs"); document.body.appendChild(el); }
    var ex = exoOf(s.exo), hist = jget("kf-reactif-hist", []), last = hist.filter(function (h) { return h.exo === ex.id; })[0];
    var chip = function (cls, val, cur, txt) { return "<button type='button' class='" + (val === cur ? "sel" : "") + "' onclick='KineReactif._set(\"" + cls + "\"," + JSON.stringify(val) + ")'>" + txt + "</button>"; };
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineReactif.close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Exercices réactifs</div><div class='kf-sub'>" + (ex.signal ? "Tu sautes, et pendant le saut Yass t'annonce sur quelle jambe atterrir : à toi de réagir en l'air." : "L'écran s'allume d'une couleur et Yass l'annonce : va toucher le plot de cette couleur, le plus vite possible, puis reviens.") + "</div>" +
      (SESS ? "<p class='kr-sesstag'>Dans ta séance" + (SESS.serie ? " : série " + SESS.serie : "") + ". Règle la série, puis « C'est parti ».</p><div class='kr-exos' style='display:none'>" : "<div class='kr-exos'>") + EXOS.map(function (e) {
        return "<button type='button' class='kr-exo" + (e.id === ex.id ? " on" : "") + "' onclick='KineReactif._set(\"exo\",\"" + e.id + "\")'><i class='kb-dot c" + e.level + "'></i><b>" + esc(e.name) + "</b><span>" + LVL[e.level][1] + (e.sides ? ", des deux côtés" : "") + "</span></button>";
      }).join("") + "</div>" +
      "<div class='kr-place'>" + (window.KineAvatar && KineAvatar.lib ? "<div class='kr-demo'><div class='kr-stage'></div><span class='kr-tag'></span></div>" : "") + diagram(ex, mine(s)) +
        "<p><strong>Mise en place.</strong> " + esc(ex.place) + "</p><p><strong>" + (ex.signal ? "À chaque saut." : "À chaque couleur.") + "</strong> " + esc(ex.action) + "</p>" +
        "<p class='kr-cue'>" + esc(ex.cue) + "</p></div>" +
      (ex.signal ? sigOpts(s, chip) : (      "<div class='kf-phase' style='color:var(--text2)'>Mes couleurs</div>" +
      "<p class='lx-muted kr-small'>Touche les couleurs de tes plots, de 2 à 4. Choisies : " + s.cols.length + ".</p>" +
      "<div class='kr-swatch kr-pick'>" + COLS.map(function (c) {
        var on = s.cols.indexOf(c.id) >= 0;
        return "<button type='button' class='" + (on ? "on" : "") + "' aria-pressed='" + on + "' style='background:" + c.hex + ";color:" + c.ink + "' onclick='KineReactif._col(\"" + c.id + "\")'>" + (on ? "✓ " : "") + c.name + "</button>";
      }).join("") + "</div>" +
      "<p class='lx-muted kr-small'>Pas de plots ? Des gobelets, des t-shirts ou des feuilles de couleur posés au sol font très bien l'affaire.</p>" +
      "<div class='kf-phase' style='color:var(--text2)'>Couleurs par série" + (ex.sides ? " (pour chaque " + ex.sideWord + ")" : "") + "</div><div class='kf-chips'>" + COUNTS.map(function (n) { return chip("count", n, s.count, String(n)); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Rythme</div><div class='kf-chips'>" + RYTHMES.map(function (r) { return chip("rythme", r[0], s.rythme, r[1] + " <small>· " + (r[2] / 1000).toString().replace(".", ",") + " s</small>"); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Pièges</div><div class='kf-chips'>" + chip("pieges", false, !!s.pieges, "Non") + chip("pieges", true, !!s.pieges, "Oui") + "</div>" +
      "<p class='lx-muted kr-small'>Avec les pièges, l'écran affiche parfois « Pas le bleu » : il ne faut pas bouger. Ça entraîne l'attention et le contrôle.</p>")) +
      (last ? "<p class='lx-muted kr-small'>Dernière fois : " + last.n + (ex.signal ? " sauts" : " couleurs") + ", rythme " + esc(last.r) + ", le " + esc(last.d) + ".</p>" : "") +
      "<div class='kf-kit'><strong>Il te faut :</strong> " + esc(ex.kit) + ". Espace dégagé, sol non glissant. Arrête si une douleur atteint 5 sur 10, ou en cas de vertige.</div>" +
      "</div><div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineReactif.start()'>C'est parti</button></div>";
    el.classList.add("open");
    var dm = el.querySelector(".kr-demo"); if (dm) demo(dm, ex, mine(s));
    var st = el.querySelector(".kr-sesstag"); if (st && window.KineExplique) KineExplique.once("reactifSeance", st);
  }
  // Réglages propres à la réception sur signal
  function sigOpts(s, chip) {
    return "<div class='kf-phase' style='color:var(--text2)'>Moment du signal</div><div class='kf-chips'>" + MOMENTS.map(function (m) { return chip("sig", m[0], s.sig, m[1] + " <small>· " + m[3] + "</small>"); }).join("") + "</div>" +
      "<p class='lx-muted kr-small'>Tôt : la jambe est annoncée avec le bip, tu as le temps de te préparer. En l'air : elle arrive pendant le vol, il faut réagir vite.</p>" +
      "<div class='kf-phase' style='color:var(--text2)'>Sauts par série</div><div class='kf-chips'>" + SCOUNTS.map(function (n) { return chip("scount", n, s.scount, String(n)); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Récupération entre deux sauts</div><div class='kf-chips'>" + SRYTHMES.map(function (r) { return chip("rythme", r[0], s.rythme, r[1] + " <small>· " + (r[2] / 1000).toString().replace(".", ",") + " s</small>"); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Réception sur les deux pieds aussi</div><div class='kf-chips'>" + chip("deux", true, !!s.deux, "Oui") + chip("deux", false, !!s.deux, "Non") + "</div>";
  }
  function setOpt(k, v) { var s = settings(); s[k] = v; save(s); var el = $("kr-sheet"), top = el ? el.querySelector(".kf-sheet-body").scrollTop : 0; open(); if (el) el.querySelector(".kf-sheet-body").scrollTop = top; }
  function toggleCol(id) {
    var s = settings(), i = s.cols.indexOf(id);
    if (i >= 0) { if (s.cols.length <= 2) return; s.cols.splice(i, 1); }
    else { if (s.cols.length >= 4) s.cols.shift(); s.cols.push(id); }
    save(s); var el = $("kr-sheet"), top = el ? el.querySelector(".kf-sheet-body").scrollTop : 0; open(); if (el) el.querySelector(".kf-sheet-body").scrollTop = top;
  }
  function close() { var el = $("kr-sheet"); if (el) el.classList.remove("open"); demoId++; if (!run) SESS = SESS && SESS.starting ? SESS : null; if (el && el.querySelector(".kr-stage canvas") && window.KineAvatar) KineAvatar.hide(); }

  /* ── La série ── */
  var run = null, wake = null;
  function sequence(n, k) {
    var out = [], prev = -1, prev2 = -1;
    for (var i = 0; i < n; i++) {
      var c; do { c = Math.floor(Math.random() * k); } while (c === prev && c === prev2);
      out.push(c); prev2 = prev; prev = c;
    }
    for (var j = 0; j < k && j < n; j++) if (out.indexOf(j) < 0) out[Math.floor(Math.random() * n)] = j;  // chaque plot sert au moins une fois
    return out;
  }
  function screen() {
    var el = $("kr-run");
    if (!el) { el = document.createElement("div"); el.id = "kr-run"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Exercice réactif en cours"); document.body.appendChild(el); }
    return el;
  }
  function paint(bg, ink, big, small, prog) {
    var el = screen();
    el.classList.remove("ring");
    el.style.background = bg; el.style.color = ink;
    el.innerHTML = "<div class='kr-top'><span>" + esc(run.ex.name) + (run.sideTxt ? " · " + esc(run.sideTxt) : "") + "</span><span>" + (prog || "") + "</span></div>" +
      "<div class='kr-bar'><i style='width:" + (run.total ? Math.round((run.calls || 0) / run.total * 100) : 0) + "%'></i></div>" +
      "<div class='kr-big' aria-live='assertive'>" + big + "</div><div class='kr-small2'>" + (small || "") + "</div>" +
      "<div class='kr-btns'><button type='button' onclick='KineReactif.pause()'>" + (run.paused ? "Reprendre" : "Pause") + "</button><button type='button' onclick='KineReactif.stop()'>Arrêter</button></div>";
    el.classList.add("open");
  }
  function later(fn, ms) { run.t = setTimeout(function () { if (run && !run.paused) fn(); else if (run) run.resume = fn; }, ms); }

  function start() {
    var s = settings(), ex = exoOf(s.exo), r = (ex.signal ? SRYTHMES : RYTHMES).filter(function (x) { return x[0] === s.rythme; })[0] || (ex.signal ? SRYTHMES : RYTHMES)[1];
    if (ex.signal) s.count = s.scount;
    if (SESS) SESS.starting = true;
    close();
    if (SESS) SESS.starting = false;
    if (typeof getAudioCtx === "function") { var ctx = getAudioCtx(); if (ctx && ctx.state === "suspended") ctx.resume(); }
    if (typeof kfvPreloadAll === "function") { try { kfvPreloadAll(); } catch (e) {} }
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    var sides = ex.sides ? [ex.sideWord === "jambe" ? "jambe droite" : "côté droit", ex.sideWord === "jambe" ? "jambe gauche" : "côté gauche"] : [null];
    run = { ex: ex, s: s, cols: mine(s), every: r[2], rName: r[1], sides: sides, si: 0, seq: [], i: 0, done: 0, total: s.count * sides.length, paused: false, t: null };
    document.body.style.overflow = "hidden";
    side();
  }
  function side() {
    if (run.ex.signal) return sigSide();
    run.seq = sequence(run.s.count, run.cols.length).map(function (c, i) {
      return { c: c, trap: !!run.s.pieges && i >= 2 && Math.random() < 0.2 };
    });
    for (var k = 1; k < run.seq.length; k++) if (run.seq[k].trap && run.seq[k - 1].trap) run.seq[k].trap = false;   // jamais deux pièges de suite
    run.i = 0;
    run.sideTxt = run.sides[run.si] ? (run.ex.id === "bulgare" ? cap(run.sides[run.si]) + " devant" : "Sur la " + run.sides[run.si]) : "";
    paint("#0E141F", "#fff", "Prêt ?", run.sideTxt ? esc(run.sideTxt) + ". " + esc(run.ex.place.split(".")[0]) + "." : "Mets-toi en place.", "");
    say(run.si === 0 ? "Mets-toi en place." : "Change de jambe.");
    var n = 3;
    later(function tick() {
      if (n > 0) { paint("#0E141F", "#fff", String(n), "", ""); say(String(n)); beep(660, 0.12, 0.25); n--; later(tick, 1000); }
      else { say("Pars !"); beep(990, 0.2, 0.3); later(cue, 600); }
    }, 3500);
  }
  function cue() {
    if (run.i >= run.seq.length) return endSide();
    var it = run.seq[run.i], c = run.cols[it.c];
    run.i++; run.calls = (run.calls || 0) + 1;
    if (it.trap) {
      paint("#0E141F", "#fff", "<span class='kr-trap' style='border-color:" + c.hex + ";color:" + c.hex + "'>" + pasLe(c) + "</span>", "Ne bouge pas", run.i + " / " + run.seq.length);
      say(pasLe(c) + " !"); beep(330, 0.12, 0.18);
      later(cue, Math.max(1200, run.every * 0.8));
      return;
    }
    run.done++;
    paint(c.hex, c.ink, c.name, "", run.i + " / " + run.seq.length);
    screen().classList.toggle("ring", !!c.ring);
    say(c.name + " !"); beep(880, 0.06, 0.18);
    if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
    later(cue, run.every);
  }
  /* ── Réception sur signal : bip-bip-« Saute », puis la jambe annoncée pendant le saut, réception tenue 3 s ── */
  function sigSide() {
    var mo = MOMENTS.filter(function (m) { return m[0] === run.s.sig; })[0] || MOMENTS[1];
    run.delay = mo[2]; run.seq = sigSeq(run.s.count, !!run.s.deux); run.i = 0; run.cnt = [0, 0, 0]; run.sideTxt = "";
    paint("#0E141F", "#fff", "Prêt ?", "Face au téléphone, pieds largeur de bassin. Deux bips, puis « Saute » : la jambe de réception s'affiche pendant le saut.", "");
    say("Mets-toi en place.");
    later(sigRep, 4000);
  }
  function sigRep() {
    if (run.i >= run.seq.length) return finish(true);
    var g = SIG[run.seq[run.i]], prog = (run.i + 1) + " / " + run.seq.length;
    run.i++; run.calls = (run.calls || 0) + 1;
    paint("#0E141F", "#fff", "Prêt", "Saut " + prog, prog); beep(660, 0.1, 0.22);
    later(function () {
      beep(660, 0.1, 0.22);
      later(function () {
        paint("#0E141F", "#fff", "Saute !", "", prog); beep(990, 0.16, 0.3);
        var show = function () {
          paint(g.hex, g.ink, "<span class='kr-sig'><i aria-hidden='true'>" + g.arrow + "</i>" + g.big + "</span>", "Tiens la réception", prog);
          screen().classList.toggle("ring", g.id === "2");
          say(g.say); beep(g.f, 0.12, 0.3); if (g.id === "2") setTimeout(function () { beep(g.f, 0.12, 0.3); }, 150);
          if (navigator.vibrate) { try { navigator.vibrate(g.id === "2" ? [60, 60, 60] : 90); } catch (e) {} }
          run.done++; run.cnt[run.seq[run.i - 1]]++;
          var hold = 3;
          later(function tick() {
            var sm = screen().querySelector(".kr-small2");
            if (hold > 0) { if (sm) sm.textContent = "Tiens… " + hold; hold--; later(tick, 1000); return; }
            if (run.i >= run.seq.length) return finish(true);
            paint("#0E141F", "#fff", "Reviens", "Pieds largeur de bassin, face au téléphone. Prochain saut dans un instant.", prog);
            later(sigRep, Math.max(1500, run.every - 3000));
          }, 600);
        };
        if (run.delay) later(show, run.delay); else show();
      }, 500);
    }, 500);
  }
  function endSide() {
    run.si++;
    if (run.si < run.sides.length) {
      var left = 20;
      paint("#0E141F", "#fff", "Change de jambe", "Récupère quelques secondes, puis place-toi sur la " + esc(run.sides[run.si]) + ".", "");
      say("Change de jambe.");
      later(function rest() {
        left--; var sm = screen().querySelector(".kr-small2");
        if (sm) sm.textContent = "On reprend dans " + left + " s, sur la " + run.sides[run.si] + ".";
        if (left > 0) later(rest, 1000); else side();
      }, 1000);
      return;
    }
    finish(true);
  }
  function finish(complete) {
    var r = run; if (!r) return;
    clearTimeout(r.t);
    if (complete || r.done >= 5) {
      var h = jget("kf-reactif-hist", []), d = new Date();
      h.unshift({ exo: r.ex.id, n: r.done, r: r.rName.toLowerCase(), d: d.getDate() + "/" + (d.getMonth() + 1) });
      jset("kf-reactif-hist", h.slice(0, 30));
    }
    if (complete) {
      paint("#0E141F", "#fff", "Bravo !", r.ex.signal ? r.done + " réceptions : " + r.cnt[0] + " à gauche, " + r.cnt[1] + " à droite" + (r.cnt[2] ? ", " + r.cnt[2] + " sur les deux pieds" : "") + ". Note si une réception a été difficile ou douloureuse, et pense à boire un peu d'eau."
        : r.done + " couleurs touchées. Note si une douleur est apparue, et pense à boire un peu d'eau.", "");
      say("Série terminée, bravo !"); if (typeof playStartBeep === "function") playStartBeep();
      var el = screen();
      el.querySelector(".kr-btns").innerHTML = SESS ? "<button type='button' onclick='KineReactif.next()'>Continuer la séance</button>"
        : "<button type='button' onclick='KineReactif.again()'>Recommencer</button><button type='button' onclick='KineReactif.stop()'>Terminer</button>";
    } else quit();
  }
  function quit() {
    if (run) clearTimeout(run.t);
    run = null;
    if (typeof stopSpeech === "function") stopSpeech();
    try { if (wake) wake.release(); } catch (e) {} wake = null;
    var el = $("kr-run"); if (el) el.classList.remove("open");
    document.body.style.overflow = "";
  }
  function pause() {
    if (!run) return;
    run.paused = !run.paused;
    var b = screen().querySelector(".kr-btns button"); if (b) b.textContent = run.paused ? "Reprendre" : "Pause";
    if (run.paused) { if (typeof stopSpeech === "function") stopSpeech(); say("Pause."); }
    else { var fn = run.resume; run.resume = null; say("On reprend."); if (fn) run.t = setTimeout(function () { if (run && !run.paused) fn(); }, 1200); }
  }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ── Accès depuis la bibliothèque ── */
  function libCard() {
    var box = $("kb-sheet"); if (!box) return;
    var body = box.querySelector(".kf-sheet-body"); if (!body || body.querySelector(".kr-libcard")) return;
    var chips = body.querySelector(".kb-chips"); if (!chips) return;
    var c = document.createElement("button");
    c.type = "button"; c.className = "kr-libcard";
    c.innerHTML = "<span class='kr-dots' aria-hidden='true'>" + COLS.slice(0, 3).map(function (x) { return "<i style='background:" + x.hex + "'></i>"; }).join("") + "</span>" +
      "<span class='kr-lt'><b>Exercices réactifs : les couleurs</b><small>Fentes, sauts, pas chassés, squat, équilibre, assis, réception sur signal : réagis à ce que Yass annonce</small></span><span aria-hidden='true'>›</span>";
    c.onclick = function () { open(); };
    chips.parentNode.insertBefore(c, chips.nextSibling);
  }
  function watch() {
    var box = $("kb-sheet"); if (!box || box.__kr) return; box.__kr = 1;
    new MutationObserver(libCard).observe(box, { childList: true }); libCard();
  }

  window.KineReactif = { open: open, close: close, start: start, stop: function () { if (run && run.i > 0 && run.done < run.total) finish(false); else quit(); }, pause: pause,
    mini: mini, _sess: function () { return SESS; }, again: function () { quit(); open(); }, next: function () { var cb = SESS && SESS.onDone; quit(); SESS = null; if (cb) cb(); }, _set: setOpt, _col: toggleCol, _avDef: avDef, exos: EXOS, colors: COLS };
  /* ── Les exercices réactifs rejoignent la bibliothèque et « Ma séance » ── */
  function thumb(cols) {
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 104 104'><rect width='104' height='104' rx='16' fill='#101826'/>" +
      cols.map(function (c, i) { var x = 22 + i * 30; return "<path d='M" + (x - 11) + " 70 L" + x + " 38 L" + (x + 11) + " 70 Z' fill='" + c + "'/><rect x='" + (x - 14) + "' y='69' width='28' height='5' rx='2' fill='" + c + "' opacity='.7'/>"; }).join("") + "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg).replace(/'/g, "%27");
  }
  function addToLibrary() {
    if (!window.KineBiblio || !KineBiblio.extend) return;
    KineBiblio.extend(EXOS.map(function (e, i) {
      return { name: e.name, group: "reactif", color: e.level, kit: [e.kit], reactif: e.id, thumb: thumb(e.signal ? SIG.map(function (g) { return g.hex; }) : [COLS[i % 4].hex, COLS[(i + 1) % 4].hex, COLS[(i + 2) % 4].hex]),
               repsLabel: e.signal ? "10 sauts" : "15 couleurs" + (e.sides ? " par " + e.sideWord : ""), desc: e.place + " " + e.action, cue: e.cue,
               tip: e.signal ? "Avant chaque série, choisis le moment du signal, le nombre de sauts et la récupération." : "Avant chaque série, choisis tes couleurs, le nombre de couleurs, le rythme et les pièges.",
               stop: "Arrêt si une douleur atteint 5 sur 10, en cas de vertige ou de perte d'équilibre." };
    }));
  }
  // Dans une séance : un exercice réactif ouvre ses réglages puis la série en couleurs, au lieu du guide de répétitions
  function hookSession() {
    if (typeof window.tryLaunchRepGuide !== "function" || window.tryLaunchRepGuide.__kr) return;
    var base = window.tryLaunchRepGuide;
    window.tryLaunchRepGuide = function (ex, serie, onDone) {
      var e = ex && ex.phase === "work" && window.KineBiblio && KineBiblio.find(ex.name);
      if (e && e.reactif) { open(e.reactif, { onDone: onDone, serie: serie }); return true; }
      return base.apply(this, arguments);
    };
    window.tryLaunchRepGuide.__kr = true;
  }
  function init() { addToLibrary(); hookSession(); watch(); new MutationObserver(watch).observe(document.body, { childList: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
