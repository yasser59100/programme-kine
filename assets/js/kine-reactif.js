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
      kit: "vos plots et un sol dégagé",
      place: "Debout, pieds joints. Posez les plots au sol devant vous, en arc de cercle, à un grand pas : un en diagonale à gauche, un droit devant, un en diagonale à droite, et le quatrième sur le côté si vous en avez quatre.",
      action: "À chaque couleur, faites une fente : avancez le pied vers le plot de cette couleur, touchez-le du pied en pliant les deux genoux, puis poussez pour revenir pieds joints.",
      cue: "Le genou avant reste dans l'axe du pied. Revenez toujours bien au centre avant la couleur suivante.",
      spots: [[80, 62], [150, 35], [220, 62], [250, 120]], feet: "both",
      av: [[0.62, 0.74], [0, 0.98], [-0.62, 0.74], [-1.0, 0.06]] },
    { id: "bulgare", name: "Sauts bulgares réactifs", level: 3, sides: true, sideWord: "jambe",
      kit: "une chaise stable calée contre un mur, et vos plots",
      place: "Dos à la chaise, posez le dessus du pied arrière sur l'assise, le pied avant un grand pas devant. Posez les plots au sol autour du pied avant, à 40 ou 50 cm : un à gauche, un devant, un à droite, et un en diagonale si vous en avez quatre.",
      action: "À chaque couleur, faites un petit saut sur la jambe avant pour atterrir à côté du plot de cette couleur, genou fléchi, puis un petit saut pour revenir au centre. Le pied arrière reste sur la chaise.",
      cue: "Atterrissez en douceur, genou souple et dans l'axe du pied. Commencez par de tout petits sauts.",
      spots: [[68, 100], [150, 38], [232, 100], [92, 50]], chair: true, feet: "split",
      av: [[0.42, 0.4], [-0.1, 0.9], [-0.62, 0.4], [0.28, 0.8]] },
    { id: "chasses", name: "Pas chassés réactifs", level: 2, sides: false,
      kit: "vos plots et environ 3 mètres d'espace sur les côtés",
      place: "Debout au centre, légèrement fléchi. Posez un plot loin à gauche et un loin à droite (environ 3 pas chassés), puis les autres devant et derrière vous si vous en avez plus.",
      action: "À chaque couleur, rejoignez le plot en pas chassés, sans croiser les pieds, touchez-le du pied, puis revenez au centre.",
      cue: "Restez fléchi, le buste face à l'avant, et poussez sur la jambe extérieure.",
      spots: [[30, 105], [270, 105], [150, 28], [150, 180]], feet: "both",
      av: [[1.25, 0.05], [-1.25, 0.05], [0, 1.15], [0, -1.0]] },
    { id: "chasses1", name: "Sauts latéraux sur une jambe réactifs", level: 3, sides: true, sideWord: "jambe",
      kit: "vos plots et environ 2 mètres d'espace autour de vous, sol non glissant",
      place: "Debout sur une jambe au centre, genou légèrement fléchi. Posez un plot à gauche et un à droite, à environ 70 cm, puis un devant et un derrière si vous en avez quatre.",
      action: "À chaque couleur, faites un petit saut sur la même jambe pour atterrir à côté du plot de cette couleur, tenez une seconde bien stable, puis revenez au centre en sautant.",
      cue: "Atterrissez en douceur sur l'avant du pied, genou souple et dans l'axe. Commencez par de petits sauts, et posez l'autre pied si vous perdez l'équilibre.",
      spots: [[50, 100], [250, 100], [150, 32], [150, 172]], feet: "one",
      av: [[0.82, 0.08], [-0.66, 0.08], [0.08, 0.78], [0.08, -0.6]] },
    { id: "squat", name: "Squat réactif", level: 2, sides: false,
      kit: "vos plots",
      place: "Debout, pieds largeur d'épaules. Posez les plots au sol devant vous, en arc de cercle, à une longueur de bras : un à gauche, un au centre, un à droite.",
      action: "À chaque couleur, descendez en squat et touchez le plot de cette couleur avec la main, puis remontez bien droit.",
      cue: "Les fesses reculent, le dos reste plat, les talons restent au sol.",
      spots: [[80, 80], [150, 50], [220, 80], [150, 22]], feet: "both",
      av: [[0.4, 0.5], [0, 0.6], [-0.4, 0.5], [0, 0.78]] },
    { id: "unipodal", name: "Équilibre réactif sur une jambe", level: 2, sides: true, sideWord: "jambe",
      kit: "vos plots, et un appui stable à portée de main (mur, dossier de chaise)",
      place: "Debout sur une jambe au centre. Posez les plots au sol autour de vous, à environ 50 cm : un devant, un sur le côté, un en arrière en diagonale.",
      action: "À chaque couleur, touchez le plot du bout du pied libre, sans poser le pied, puis revenez au centre.",
      cue: "Le genou d'appui est légèrement fléchi et reste dans l'axe du pied.",
      spots: [[150, 40], [235, 105], [80, 160], [70, 60]], feet: "one",
      av: [[-0.06, 0.62], [-0.6, 0.08], [0.32, -0.42], [0.42, 0.5]] },
    { id: "pas", name: "Pas réactifs", level: 1, sides: false,
      kit: "vos plots et un peu d'espace",
      place: "Debout au centre. Posez les plots au sol autour de vous, à un grand pas : un devant, un à gauche, un à droite, un derrière si vous en avez quatre.",
      action: "À chaque couleur, faites un pas vers le plot, touchez-le du pied, puis revenez au centre.",
      cue: "Restez léger sur les pieds et revenez toujours au centre.",
      spots: [[150, 30], [55, 105], [245, 105], [150, 175]], feet: "both",
      av: [[0, 0.9], [0.9, 0.05], [-0.9, 0.05], [0, -0.8]] },
    { id: "assis", name: "Réaction assis", level: 1, sides: false,
      kit: "une chaise stable sans roulettes et vos plots (ou objets de couleur)",
      place: "Assis au bord d'une chaise, pieds à plat. Posez les plots au sol autour de vos pieds, à portée : un à gauche, un devant, un à droite, un en diagonale si vous en avez quatre.",
      action: "À chaque couleur, allez toucher le plot de cette couleur avec le pied, puis reposez le pied au centre.",
      cue: "Restez bien assis, le dos droit. Pour plus de difficulté, alternez les pieds.",
      spots: [[85, 70], [150, 40], [215, 70], [230, 130]], feet: "seat",
      av: [[0.42, 0.36], [0, 0.56], [-0.42, 0.36], [-0.46, -0.02]] }
  ];
  var LVL = { 1: ["vert", "Facile"], 2: ["orange", "Intermédiaire"], 3: ["rouge", "Difficile"] };

  function settings() {
    var s = Object.assign({ exo: "fentes", count: 15, rythme: "soutenu", pieges: false }, jget("kf-reactif-set", {}));
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
    var ARMS_BAL = { LA: { ang: [25, 30, 0, 25] }, RA: { ang: [25, 30, 0, 25] } };
    var base = ex.id === "assis" ? M({ pelvis: { p: [0, 0.53, -0.36], r: [0, 0, 0] }, spine: [6, 0, 0], head: 0,
                 L: { foot: { at: [0.14, 0, 0.14], yaw: 6 } }, R: { foot: { at: [-0.14, 0, 0.14], yaw: -6 } }, LA: { ang: [6, 14, 0, 50] }, RA: { ang: [6, 14, 0, 50] } }, {})
             : ex.id === "unipodal" || ex.id === "chasses1" ? M(L.STAND(0.11, 6), { pelvis: { p: [0.07, 0.9, 0], r: [6, 0, 0] }, L: { foot: { at: [0.1, 0, 0.12], yaw: 6 } }, R: { foot: { at: [-0.1, 0.16, 0.06], yaw: -6 } } }, ARMS_BAL)
             : ex.id === "chasses" ? M(L.STAND(0.17, 8), { pelvis: { p: [0, 0.86, 0], r: [14, 0, 0] }, spine: [8, 0, 0] }, ARMS_BAL)
             : ex.id === "bulgare" ? M(L.STAND(0.1, 0), { pelvis: { p: [0, 0.8, 0.16], r: [10, 0, 0] }, spine: [6, 0, 0],
                 L: { foot: { at: [0.1, 0.48, -0.5], yaw: 0, lift: 75 } }, R: { foot: { at: [-0.1, 0, 0.36], yaw: 0 } } }, { LA: { ang: [30, 18, 0, 40] }, RA: { ang: [30, 18, 0, 40] } })
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
        var rear = { L: { foot: { at: [0.1, 0.48, -0.5], yaw: 0, lift: 75 } } };
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
  var demoId = 0;
  function demo(stage, ex, cols) {
    if (!stage || !window.KineAvatar || !KineAvatar.register || !KineAvatar.lib) { if (stage) stage.remove(); return; }
    var avHop = ex.id === "bulgare" || ex.id === "chasses1";
    KineAvatar.register("__kr_demo", avDef(ex, cols));
    if (!KineAvatar.show(stage.querySelector(".kr-stage"), "__kr_demo")) { stage.remove(); return; }
    var id = ++demoId, tag = stage.querySelector(".kr-tag"), last = -1;
    var alive = function () { return id === demoId && stage.isConnected; };
    function wait(ms, f) { setTimeout(function () { if (alive()) f(); else if (id === demoId && stage.querySelector("canvas")) KineAvatar.hide(); }, ms); }
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

  /* ── Écran de réglage ── */
  function open(exoId) {
    var s = settings(); if (exoId) s.exo = exoId;
    var el = $("kr-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kr-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Exercices réactifs"); document.body.appendChild(el); }
    var ex = exoOf(s.exo), hist = jget("kf-reactif-hist", []), last = hist.filter(function (h) { return h.exo === ex.id; })[0];
    var chip = function (cls, val, cur, txt) { return "<button type='button' class='" + (val === cur ? "sel" : "") + "' onclick='KineReactif._set(\"" + cls + "\"," + JSON.stringify(val) + ")'>" + txt + "</button>"; };
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineReactif.close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Exercices réactifs</div><div class='kf-sub'>L'écran s'allume d'une couleur et Yass l'annonce : allez toucher le plot de cette couleur, le plus vite possible, puis revenez.</div>" +
      "<div class='kr-exos'>" + EXOS.map(function (e) {
        return "<button type='button' class='kr-exo" + (e.id === ex.id ? " on" : "") + "' onclick='KineReactif._set(\"exo\",\"" + e.id + "\")'><i class='kb-dot c" + e.level + "'></i><b>" + esc(e.name) + "</b><span>" + LVL[e.level][1] + (e.sides ? ", des deux côtés" : "") + "</span></button>";
      }).join("") + "</div>" +
      "<div class='kr-place'>" + (window.KineAvatar && KineAvatar.lib ? "<div class='kr-demo'><div class='kr-stage'></div><span class='kr-tag'></span></div>" : "") + diagram(ex, mine(s)) +
        "<p><strong>Mise en place.</strong> " + esc(ex.place) + "</p><p><strong>À chaque couleur.</strong> " + esc(ex.action) + "</p>" +
        "<p class='kr-cue'>" + esc(ex.cue) + "</p></div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Mes couleurs</div>" +
      "<p class='lx-muted kr-small'>Touchez les couleurs de vos plots, de 2 à 4. Choisies : " + s.cols.length + ".</p>" +
      "<div class='kr-swatch kr-pick'>" + COLS.map(function (c) {
        var on = s.cols.indexOf(c.id) >= 0;
        return "<button type='button' class='" + (on ? "on" : "") + "' aria-pressed='" + on + "' style='background:" + c.hex + ";color:" + c.ink + "' onclick='KineReactif._col(\"" + c.id + "\")'>" + (on ? "✓ " : "") + c.name + "</button>";
      }).join("") + "</div>" +
      "<p class='lx-muted kr-small'>Pas de plots ? Des gobelets, des t-shirts ou des feuilles de couleur posés au sol font très bien l'affaire.</p>" +
      "<div class='kf-phase' style='color:var(--text2)'>Couleurs par série" + (ex.sides ? " (pour chaque " + ex.sideWord + ")" : "") + "</div><div class='kf-chips'>" + COUNTS.map(function (n) { return chip("count", n, s.count, String(n)); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Rythme</div><div class='kf-chips'>" + RYTHMES.map(function (r) { return chip("rythme", r[0], s.rythme, r[1] + " <small>· " + (r[2] / 1000).toString().replace(".", ",") + " s</small>"); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Pièges</div><div class='kf-chips'>" + chip("pieges", false, !!s.pieges, "Non") + chip("pieges", true, !!s.pieges, "Oui") + "</div>" +
      "<p class='lx-muted kr-small'>Avec les pièges, l'écran affiche parfois « Pas le bleu » : il ne faut pas bouger. Ça entraîne l'attention et le contrôle.</p>" +
      (last ? "<p class='lx-muted kr-small'>Dernière fois : " + last.n + " couleurs, rythme " + esc(last.r) + ", le " + esc(last.d) + ".</p>" : "") +
      "<div class='kf-kit'><strong>Il vous faut :</strong> " + esc(ex.kit) + ". Espace dégagé, sol non glissant. Arrêtez si une douleur atteint 5 sur 10, ou en cas de vertige.</div>" +
      "</div><div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineReactif.start()'>C'est parti</button></div>";
    el.classList.add("open");
    var dm = el.querySelector(".kr-demo"); if (dm) demo(dm, ex, mine(s));
  }
  function setOpt(k, v) { var s = settings(); s[k] = v; save(s); var el = $("kr-sheet"), top = el ? el.querySelector(".kf-sheet-body").scrollTop : 0; open(); if (el) el.querySelector(".kf-sheet-body").scrollTop = top; }
  function toggleCol(id) {
    var s = settings(), i = s.cols.indexOf(id);
    if (i >= 0) { if (s.cols.length <= 2) return; s.cols.splice(i, 1); }
    else { if (s.cols.length >= 4) s.cols.shift(); s.cols.push(id); }
    save(s); var el = $("kr-sheet"), top = el ? el.querySelector(".kf-sheet-body").scrollTop : 0; open(); if (el) el.querySelector(".kf-sheet-body").scrollTop = top;
  }
  function close() { var el = $("kr-sheet"); if (el) el.classList.remove("open"); demoId++; if (el && el.querySelector(".kr-stage canvas") && window.KineAvatar) KineAvatar.hide(); }

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
    var s = settings(), ex = exoOf(s.exo), r = RYTHMES.filter(function (x) { return x[0] === s.rythme; })[0] || RYTHMES[1];
    close();
    if (typeof getAudioCtx === "function") { var ctx = getAudioCtx(); if (ctx && ctx.state === "suspended") ctx.resume(); }
    if (typeof kfvPreloadAll === "function") { try { kfvPreloadAll(); } catch (e) {} }
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    var sides = ex.sides ? [ex.sideWord === "jambe" ? "jambe droite" : "côté droit", ex.sideWord === "jambe" ? "jambe gauche" : "côté gauche"] : [null];
    run = { ex: ex, s: s, cols: mine(s), every: r[2], rName: r[1], sides: sides, si: 0, seq: [], i: 0, done: 0, total: s.count * sides.length, paused: false, t: null };
    document.body.style.overflow = "hidden";
    side();
  }
  function side() {
    run.seq = sequence(run.s.count, run.cols.length).map(function (c, i) {
      return { c: c, trap: !!run.s.pieges && i >= 2 && Math.random() < 0.2 };
    });
    for (var k = 1; k < run.seq.length; k++) if (run.seq[k].trap && run.seq[k - 1].trap) run.seq[k].trap = false;   // jamais deux pièges de suite
    run.i = 0;
    run.sideTxt = run.sides[run.si] ? (run.ex.id === "bulgare" ? cap(run.sides[run.si]) + " devant" : "Sur la " + run.sides[run.si]) : "";
    paint("#0E141F", "#fff", "Prêt ?", run.sideTxt ? esc(run.sideTxt) + ". " + esc(run.ex.place.split(".")[0]) + "." : "Mettez-vous en place.", "");
    say(run.si === 0 ? "Mettez-vous en place." : "Changez de jambe.");
    var n = 3;
    later(function tick() {
      if (n > 0) { paint("#0E141F", "#fff", String(n), "", ""); say(String(n)); beep(660, 0.12, 0.25); n--; later(tick, 1000); }
      else { say("Partez !"); beep(990, 0.2, 0.3); later(cue, 600); }
    }, 3500);
  }
  function cue() {
    if (run.i >= run.seq.length) return endSide();
    var it = run.seq[run.i], c = run.cols[it.c];
    run.i++; run.calls = (run.calls || 0) + 1;
    if (it.trap) {
      paint("#0E141F", "#fff", "<span class='kr-trap' style='border-color:" + c.hex + ";color:" + c.hex + "'>" + pasLe(c) + "</span>", "Ne bougez pas", run.i + " / " + run.seq.length);
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
  function endSide() {
    run.si++;
    if (run.si < run.sides.length) {
      var left = 20;
      paint("#0E141F", "#fff", "Changez de jambe", "Récupérez quelques secondes, puis placez-vous sur la " + esc(run.sides[run.si]) + ".", "");
      say("Changez de jambe.");
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
      paint("#0E141F", "#fff", "Bravo !", r.done + " couleurs touchées. Notez si une douleur est apparue, et pensez à boire un peu d'eau.", "");
      say("Série terminée, bravo !"); if (typeof playStartBeep === "function") playStartBeep();
      var el = screen(); el.querySelector(".kr-btns").innerHTML = "<button type='button' onclick='KineReactif.again()'>Recommencer</button><button type='button' onclick='KineReactif.stop()'>Terminer</button>";
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
      "<span class='kr-lt'><b>Exercices réactifs : les couleurs</b><small>Fentes, sauts, pas chassés, squat, équilibre, assis : allez vers le plot de la couleur annoncée</small></span><span aria-hidden='true'>›</span>";
    c.onclick = function () { open(); };
    chips.parentNode.insertBefore(c, chips.nextSibling);
  }
  function watch() {
    var box = $("kb-sheet"); if (!box || box.__kr) return; box.__kr = 1;
    new MutationObserver(libCard).observe(box, { childList: true }); libCard();
  }

  window.KineReactif = { open: open, close: close, start: start, stop: function () { if (run && run.i > 0 && run.done < run.total) finish(false); else quit(); }, pause: pause,
    again: function () { quit(); open(); }, _set: setOpt, _col: toggleCol, _avDef: avDef, exos: EXOS, colors: COLS };
  function init() { watch(); new MutationObserver(watch).observe(document.body, { childList: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
