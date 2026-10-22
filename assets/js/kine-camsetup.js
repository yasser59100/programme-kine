/* ═══════════ KinéForce — installer son téléphone pour la caméra (animation de Yass) ═══════════
   Yass pose le téléphone (à hauteur de taille, ou au sol pour les exercices allongés), recule de 2 à 3 mètres,
   se place de profil ou de face, puis fait l'exercice. Le champ de vision du téléphone est dessiné,
   et chaque étape est écrite sous l'animation. Montré sur l'écran d'accueil de chaque exercice caméra. */
var KineCamSetup = (function () {
  "use strict";
  var CUR = null;
  var AVN = { squat: "Squat bilatéral", fente: "Fentes avant unilatérales", assis: "Assis-debout de chaise", pont: "Pont de hanche",
              pompes: "Pompes sur genoux", unipodal: "Équilibre unipodal", planche: "Plank — gainage avant-bras", chaise: "Chaise contre le mur" };
  var FLOOR = { pont: 1, pompes: 1, planche: 1 }, FACE = { unipodal: 1 };
  var Y0 = 0.925;   // hauteur du bassin debout
  function cp(o) { return JSON.parse(JSON.stringify(o)); }
  // Debout en (x, z), tourné de th degrés (0 : regarde +z, 90 : regarde +x), une jambe éventuellement levée (marche)
  function standAt(x, z, th, lift, extra) {
    var r = th * Math.PI / 180, f = [Math.sin(r), Math.cos(r)], l = [Math.cos(r), -Math.sin(r)];
    var foot = function (s) { return { at: [x + l[0] * 0.1 * s + f[0] * 0.12, 0, z + l[1] * 0.1 * s + f[1] * 0.12], yaw: th + 4 * s }; };
    var p = { pelvis: { p: [x, Y0, z], r: [0, th, 0] }, spine: [2, 0, 0], head: 0, L: { foot: foot(1) }, R: { foot: foot(-1) },
              LA: { ang: [4, 7, 0, 10] }, RA: { ang: [4, 7, 0, 10] } };
    if (lift === "L") p.L = { ang: [22, 3, 0, 40, 0] };
    if (lift === "R") p.R = { ang: [22, 3, 0, 40, 0] };
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }
  function build(pid, A) {
    var ex = AVN[pid], d = A._def ? A._def(ex) : null;
    if (!d && window.KineAvatar && KineAvatar._def) d = KineAvatar._def(ex);
    if (!d) return null;
    d = cp(d);
    var floor = !!FLOOR[pid], face = !!FACE[pid], seated = pid === "assis";
    var px = face ? 0 : (floor ? 2.3 : 2.6), pz = face ? 2.6 : 0, th = face ? 0 : 90;   // téléphone et direction du regard vers lui
    var nx = face ? 0 : px - 0.42, nz = face ? pz - 0.42 : 0;                          // Yass à côté du téléphone
    var poses = {};
    // 1. il pose / ajuste le téléphone
    var reach = floor
      ? { pelvis: { p: [nx - (face ? 0 : 0.08), 0.6, nz - (face ? 0.08 : 0)], r: [35, th, 0] }, spine: [20, 0, 0], head: -10,
          RA: { hand: { at: [px - (face ? 0 : 0.1), 0.1, pz - (face ? 0.1 : 0) + (face ? 0 : 0.03)], pole: [0, -1, 0.3] } } }
      : { spine: [12, 0, 0], head: -6, RA: { hand: { at: [px - (face ? 0 : 0.07), 0.96, pz - (face ? 0.07 : 0) + (face ? 0 : 0.03)], pole: [0, -1, 0.2] } } };
    poses.near = standAt(nx, nz, th);
    poses.reach = floor ? (function () { var p = standAt(nx, nz, th); p.pelvis = reach.pelvis; p.spine = reach.spine; p.head = reach.head; p.RA = reach.RA; return p; })()
                        : standAt(nx, nz, th, null, reach);
    // 2. il recule en regardant le téléphone
    var N = 4;
    for (var i = 1; i <= N; i++) {
      var k = i / N, x = nx * (1 - k), z = nz * (1 - k);
      poses["w" + i] = standAt(x, z, th, i % 2 ? "L" : "R");
      poses["s" + i] = standAt(x, z, th);
    }
    // 3. il se place (de profil : il tourne d'un quart de tour), puis l'exercice
    poses.turn = standAt(0, 0, face ? 0 : 45);
    poses.ready = standAt(0, 0, 0);
    for (var pk in d.poses) poses["x_" + pk] = d.poses[pk];
    var def = { camera: face ? { yaw: 1.3, pitch: 0.42, dist: 5.8, ty: 0.55, tx: 0, tz: 1.2 } : { yaw: 0.42, pitch: 0.42, dist: 5.8, ty: 0.55, tx: 1.15, tz: 0 },
                props: ["camStand"].concat((d.props || []).filter(function (p) { return p !== "camStand"; })), camStand: { x: px, z: pz, floor: floor },
                start: "near", poses: poses };
    ["chair", "bands", "tool", "load", "loadKind", "bench", "stepAt", "floorTowel"].forEach(function (k) { if (d[k] != null) def[k] = d[k]; });
    // séquence de l'exercice (2 répétitions) d'après ses étapes, sinon aller-retour entre le départ et la vignette
    var exSteps = (d.steps || []).filter(function (s) { return s.pose && d.poses[s.pose]; }).map(function (s) { return { pose: "x_" + s.pose, dur: Math.max(0.5, s.dur) }; });
    if (!exSteps.length) { var st = d.start, tb = d.thumb || d.start; exSteps = [{ pose: "x_" + tb, dur: 1.6 }, { pose: "x_" + tb, dur: 2.2 }, { pose: "x_" + st, dur: 1.4 }]; }
    var xs = exSteps.concat(exSteps);
    var C = {
      put: floor ? "Pose le téléphone au sol, à l'horizontale, calé contre un livre." : face ? "Pose le téléphone debout, à hauteur de ta taille (une chaise, une étagère)." : "Pose le téléphone debout, à hauteur de ta taille (une chaise, une étagère).",
      back: "Recule de 2 à 3 mètres : tout ton corps doit entrer dans l'image.",
      side: face ? "Mets-toi bien de face au téléphone." : "Mets-toi de profil au téléphone.",
      light: "La lumière devant toi, jamais dans ton dos (pas de fenêtre derrière toi).",
      go: "Yass compte tes répétitions et te corrige à voix haute."
    };
    var seq = [{ pose: "near", dur: 0.6, cap: C.put, k: 1 }, { pose: "reach", dur: 1.1, cap: C.put, k: 1 }, { pose: "reach", dur: 1.0 }, { pose: "near", dur: 0.8 }];
    for (var j = 1; j <= N; j++) { seq.push({ pose: "w" + j, dur: 0.45, cap: C.back, k: 2 }); seq.push({ pose: "s" + j, dur: 0.35 }); }
    seq.push({ pose: "s" + N, dur: 0.6 });
    if (!face) { seq.push({ pose: "turn", dur: 0.6, cap: C.side, k: 3 }); seq.push({ pose: "ready", dur: 0.6 }); }
    else seq.push({ pose: "ready", dur: 0.8, cap: C.side, k: 3 });
    seq.push({ pose: "ready", dur: 1.4, cap: C.light, k: 4 });
    if (seated || floor || pid === "chaise") seq.push({ pose: "x_" + d.start, dur: 1.6 });
    xs.forEach(function (s, i) { seq.push({ pose: s.pose, dur: s.dur, cap: i === 0 ? C.go : null, k: i === 0 ? 5 : 0 }); });
    seq.push({ pose: "x_" + d.start, dur: 1.2 });
    return { def: def, seq: seq, caps: [C.put, C.back, C.side, C.light, C.go] };
  }
  function stop() {
    if (!CUR) return; var c = CUR; CUR = null; clearTimeout(c.t);
    try { if (c.A && c.A.hide) c.A.hide(); } catch (e) {}
  }
  // box : élément qui contient .kcs-stage (avatar) et .kcs-cap (légende) ; once : une seule fois puis arrêt sur la dernière image
  function play(box, pid) {
    stop();
    if (!box || !window.KineLumiere || !KineLumiere.avatar) return false;
    var stage = box.querySelector(".kcs-stage"), cap = box.querySelector(".kcs-cap"), dots = box.querySelector(".kcs-dots");
    var me = CUR = { A: null, t: 0 };
    KineLumiere.avatar(7, function (A) {
      if (!A || CUR !== me || !stage.isConnected) return;
      var B = build(pid, A); if (!B) { box.style.display = "none"; return; }
      var name = "__camsetup_" + pid; A.register(name, B.def);
      if (!A.show(stage, name)) { box.style.display = "none"; return; }
      me.A = A; if (A.pause) A.pause(false);
      if (dots) dots.innerHTML = B.caps.map(function (c, i) { return "<i data-k='" + (i + 1) + "'></i>"; }).join("");
      var i = 0;
      (function next() {
        if (CUR !== me || !stage.isConnected) { if (CUR === me) stop(); return; }
        if (document.hidden) { me.t = setTimeout(next, 500); return; }
        if (i >= B.seq.length) { i = 0; me.t = setTimeout(next, 900); A.step({ pose: "near", dur: 0.05 }); return; }
        var s = B.seq[i++];
        A.step({ pose: s.pose, dur: s.dur, side: "L" });
        if (s.cap && cap && cap.textContent !== s.cap) { cap.classList.remove("in"); void cap.offsetWidth; cap.textContent = s.cap; cap.classList.add("in"); }
        if (s.k && dots) dots.querySelectorAll("i").forEach(function (d) { d.classList.toggle("on", +d.getAttribute("data-k") <= s.k); });
        me.t = setTimeout(next, s.dur * 1000 + 40);
      })();
    });
    return true;
  }
  function html() {
    return "<div class='kcs-box' id='kcs-box'><div class='kcs-h'>Comment installer ton téléphone</div><div class='kcs-stage'></div>" +
      "<div class='kcs-dots' aria-hidden='true'></div><div class='kcs-cap' role='status'></div></div>";
  }
  return { play: play, stop: stop, html: html, _build: build };
})();
window.KineCamSetup = KineCamSetup;
