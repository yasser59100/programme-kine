/* ═══════════ KinéForce — créateur d'exercice (kiné) ═══════════
   Le kiné part d'une position de base, règle une position de départ et une position d'arrivée
   avec des curseurs (l'avatar bouge en direct), choisit le tempo, puis remplit la fiche.
   L'exercice est publié avec le programme officiel et devient un exercice comme les autres
   (démonstration, séance guidée, décompte, voix, charges progressives, « J'ai mal »).
   Un exercice créé = { base, props, cam, poses: { a, b }, tempo, mode, seconds, sides, words, fiche } */
var KineCreateur = (function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ════════ Positions de base ════════ */
  var REL_ARMS = { LA: { ang: [4, 7, 0, 10] }, RA: { ang: [4, 7, 0, 10] } };
  function L() { return window.KineAvatar && KineAvatar.lib; }
  var BASES = {
    stand:  { label: "Debout", cam: 0.6, legsIK: true, armsFree: true },
    seat:   { label: "Assis sur une chaise", cam: 1.2, legsIK: true, armsFree: true, props: ["chair"] },
    kneel:  { label: "À genoux", cam: 1.35, legsIK: false, armsFree: true },
    quad:   { label: "À quatre pattes", cam: 1.25, legsIK: false, armsFree: false },
    supine: { label: "Couché sur le dos, genoux pliés", cam: 1.2, legsIK: true, armsFree: false },
    prone:  { label: "Couché sur le ventre", cam: 0.95, legsIK: false, armsFree: false },
    side:   { label: "Couché sur le côté", cam: 0.05, legsIK: false, armsFree: true },
    plank:  { label: "En planche", cam: 1.3, legsIK: true, armsFree: false }
  };
  function basePose(base) {
    var lib = L(), m = lib.merge;
    switch (base) {
      case "seat": return m({ pelvis: { p: [0, 0.53, -0.36], r: [0, 0, 0] }, spine: [4, 0, 0], head: 0,
        L: { foot: { at: [0.14, 0, 0.14], yaw: 6 } }, R: { foot: { at: [-0.14, 0, 0.14], yaw: -6 } } }, REL_ARMS);
      case "kneel": return m({ pelvis: { p: [0, 0.5, 0], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
        L: { ang: [0, 3, 0, 90, 30] }, R: { ang: [0, 3, 0, 90, 30] } }, REL_ARMS);
      case "quad": return clone(lib.QUAD);
      case "supine": return m(clone(lib.BRIDGE_DOWN), lib.SUPINE_HANDS);
      case "prone": return { pelvis: { p: [0, 0.12, 0], r: [90, 0, 0] }, spine: [0, 0, 0], head: -12,
        L: { ang: [0, 4, 0, 0, -60] }, R: { ang: [0, 4, 0, 0, -60] },
        LA: { hand: { at: [0.42, 0.06, 0.78], pole: [1, -0.3, -0.3] } }, RA: { hand: { at: [-0.42, 0.06, 0.78], pole: [-1, -0.3, -0.3] } } };
      case "side": return { pelvis: { p: [0, 0.2, 0], r: [0, 0, -90] }, spine: [0, 0, 0], head: 0,
        L: { ang: [20, 0, 0, 40, 0] }, R: { ang: [0, 0, 0, 0, 0] }, LA: { ang: [168, 0, 0, 20] }, RA: { ang: [0, 10, 0, 10] } };
      case "plank": return { pelvis: { p: [0, 0.426, -0.043], r: [70.8, 0, 0] }, spine: [0, 0, 0], head: 0,
        L: { foot: { at: [0.12, 0, -0.9], yaw: 0, lift: 70 } }, R: { foot: { at: [-0.12, 0, -0.9], yaw: 0, lift: 70 } },
        LA: { hand: { at: [0.22, 0.047, 0.42], pole: [0.6, 0.3, -0.7] } }, RA: { hand: { at: [-0.22, 0.047, 0.42], pole: [-0.6, 0.3, -0.7] } } };
      default: return m(lib.STAND(0.12, 6), REL_ARMS);
    }
  }
  // Valeurs des curseurs pour une position (P) : tout à zéro = position de base
  function blankP(base) {
    var b = basePose(base), leg = function (s) {
      var a = b[s] && b[s].ang;
      return { free: !(b[s] && b[s].foot), hf: a ? a[0] : 0, abd: a ? a[1] : 3, rot: a ? a[2] : 0, knee: a ? a[3] : 0, step: 0, wide: 0, heel: 0 };
    }, arm = function (s) {
      var a = b[s] && b[s].ang;
      return { free: !(b[s] && b[s].hand), fl: a ? a[0] : 4, ab: a ? a[1] : 7, ro: a ? a[2] : 0, el: a ? a[3] : 10 };
    };
    return { tilt: 0, flex: 0, lat: 0, rot: 0, down: 0, fwd: 0, head: 0, L: leg("L"), R: leg("R"), LA: arm("LA"), RA: arm("RA") };
  }
  function build(base, P) {
    var p = basePose(base);
    p.pelvis.r[0] += +P.tilt || 0;
    if (p.pelvis.p[1] === "auto") { if (P.down) p.pelvis.dy = -P.down; }
    else p.pelvis.p[1] = Math.max(0.05, p.pelvis.p[1] - (+P.down || 0));
    p.pelvis.p[2] += +P.fwd || 0;
    var sp = p.spine || [0, 0, 0]; p.spine = [sp[0] + (+P.flex || 0), sp[1] + (+P.lat || 0), sp[2] + (+P.rot || 0)];
    p.head = (p.head || 0) + (+P.head || 0);
    ["L", "R"].forEach(function (s) {
      var g = P[s], sg = s === "L" ? 1 : -1;
      if (g.free) p[s] = { ang: [+g.hf, +g.abd, +g.rot, +g.knee, 0] };
      else if (p[s] && p[s].foot) { var f = p[s].foot; f.at = [f.at[0] + sg * (+g.wide || 0), f.at[1], f.at[2] + (+g.step || 0)]; if (+g.heel) f.lift = (f.lift || 0) + (+g.heel); }
    });
    ["LA", "RA"].forEach(function (s) { var a = P[s]; if (a.free) p[s] = { ang: [+a.fl, +a.ab, +a.ro, +a.el] }; });
    return p;
  }
  function step(pose, dur, label, say, kind) { return { pose: pose, dur: dur, label: label, say: say, kind: kind }; }
  // La définition « avatar » d'un exercice créé
  function buildDef(x) {
    var t = x.tempo || {}, w = x.words || {};
    var steps = [step("b", +t.go || 2, w.go || "On y va", w.go || "On y va", "up")];
    if (+t.hold) steps.push(step("b", +t.hold, "On tient", "On tient", "hold"));
    steps.push(step("a", +t.back || 2, w.back || "On revient", w.back || "On revient", "down"));
    var d = { camera: { yaw: x.cam != null ? +x.cam : BASES[x.base].cam }, props: (x.props || []).slice(), start: "a", thumb: "b",
              poses: { a: build(x.base, x.poses.a), b: build(x.base, x.poses.b) }, steps: steps, custom: true };
    if (x.sides && x.sides !== "none") { d.sides = x.sides; if (x.sides === "blocks") d.sideWord = "côté"; }
    if (x.mode === "timed") { d.timed = { seconds: +x.seconds || 30 }; d.noIso = true; }
    if (x.noIso) d.noIso = true;
    if (x.load) d.load = x.load;
    if (x.base === "side" || x.base === "prone") d.snapSideChange = true;
    return d;
  }
  function register(name, x) { try { if (window.KineAvatar) KineAvatar.register(name, buildDef(x)); } catch (e) {} }

  /* ════════ Écran du créateur ════════ */
  var cur = null, which = "a", origName = null, playing = 0;
  function blank() {
    return { base: "stand", props: [], cam: null, poses: { a: blankP("stand"), b: blankP("stand") }, tempo: { go: 2, hold: 1, back: 2 },
             mode: "reps", seconds: 30, sides: "none", words: { go: "On y va", back: "On revient" },
             fiche: { name: "", group: "genou", color: 1, repsLabel: "12 répétitions", desc: "", cue: "", err: "", tip: "", stop: "" } };
  }
  function sheet() {
    var el = $("kcr-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kcr-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function slider(path, label, min, max, stepv, unit) {
    var v = get(path);
    return "<label class='kcr-sl'><span>" + esc(label) + "<b id='v-" + path.replace(/\./g, "-") + "'>" + fmt(v, unit) + "</b></span>" +
      "<input type='range' min='" + min + "' max='" + max + "' step='" + (stepv || 1) + "' value='" + v + "' oninput='KineCreateur.set(\"" + path + "\",this.value,\"" + (unit || "°") + "\")'></label>";
  }
  function fmt(v, unit) { return unit === "m" ? Math.round(v * 100) + " cm" : unit === "s" ? String(v).replace(".", ",") + " s" : Math.round(v) + "°"; }
  function get(path) { var o = cur.poses[which]; path.split(".").forEach(function (k) { o = o[k]; }); return o; }
  function setPath(path, v) { var ks = path.split("."), o = cur.poses[which]; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
  function render() {
    if ($("kcr-name")) readFiche();
    var x = cur, P = x.poses[which], B = BASES[x.base];
    var legBlock = function (s, name) {
      var g = P[s];
      var head = "<div class='kcr-sub'><b>" + name + "</b>" + (B.legsIK ? "<label class='kcr-tg'><input type='checkbox'" + (g.free ? " checked" : "") + " onchange='KineCreateur.free(\"" + s + "\",this.checked)'> Jambe levée</label>" : "") + "</div>";
      if (!g.free) return head + slider(s + ".step", "Pas avant / arrière", -0.9, 0.9, 0.02, "m") + slider(s + ".wide", "Écart sur le côté", -0.1, 0.5, 0.02, "m") + slider(s + ".heel", "Talon décollé", -40, 70, 1);
      return head + slider(s + ".hf", "Hanche : flexion", -40, 140, 1) + slider(s + ".abd", "Hanche : écart", -20, 70, 1) + slider(s + ".rot", "Hanche : rotation", -50, 50, 1) + slider(s + ".knee", "Genou : flexion", 0, 150, 1);
    };
    var armBlock = function (s, name) {
      var a = P[s];
      var head = "<div class='kcr-sub'><b>" + name + "</b>" + (!B.armsFree ? "<label class='kcr-tg'><input type='checkbox'" + (a.free ? " checked" : "") + " onchange='KineCreateur.free(\"" + s + "\",this.checked)'> Bras libre</label>" : "") + "</div>";
      if (!a.free) return head + "<p class='kcr-note'>La main reste en appui.</p>";
      return head + slider(s + ".fl", "Épaule : élévation avant", -40, 180, 1) + slider(s + ".ab", "Épaule : élévation côté", -30, 180, 1) + slider(s + ".ro", "Épaule : rotation", -90, 90, 1) + slider(s + ".el", "Coude : flexion", 0, 150, 1);
    };
    var bases = Object.keys(BASES).map(function (k) { return "<option value='" + k + "'" + (k === x.base ? " selected" : "") + ">" + BASES[k].label + "</option>"; }).join("");
    var groups = KineBiblio.groups.map(function (g) { return "<option value='" + g[0] + "'" + (g[0] === x.fiche.group ? " selected" : "") + ">" + g[1] + "</option>"; }).join("");
    var el = sheet();
    var y = el.scrollTop;
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineCreateur.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + (origName ? "Modifier l'exercice" : "Créer un exercice") + "</div><div class='kf-sub'>Réglez la position de départ, puis la position d'arrivée. L'avatar bouge en direct.</div></div>" +
      "<div class='kcr-stage-wrap'><div id='kcr-stage' class='kcr-stage'></div>" +
        "<div class='kcr-tabs'><button class='" + (which === "a" ? "on" : "") + "' onclick='KineCreateur.which(\"a\")'>Départ</button><button class='" + (which === "b" ? "on" : "") + "' onclick='KineCreateur.which(\"b\")'>Arrivée</button>" +
        "<button onclick='KineCreateur.play()'>▶ Lecture</button></div></div>" +
      "<details class='kf-acc' open><summary>Position et matériel</summary>" +
        "<label class='ko-f'><span>Position de base</span><select onchange='KineCreateur.base(this.value)'>" + bases + "</select></label>" +
        "<div class='kc-gear'>" + [["chair", "Chaise"], ["wall", "Mur devant"], ["step", "Marche"]].map(function (pr) {
          var on = x.props.indexOf(pr[0]) >= 0; return "<button type='button' class='kb-chip" + (on ? " on" : "") + "' onclick='KineCreateur.prop(\"" + pr[0] + "\")'>" + (on ? "✓ " : "") + pr[1] + "</button>"; }).join("") +
          "<button type='button' class='kb-chip" + (x.load ? " on" : "") + "' onclick='KineCreateur.load()'>" + (x.load ? "✓ " : "") + "Bouteilles</button></div>" +
        "<label class='kcr-sl'><span>Angle de vue<b id='v-cam'>" + Math.round(((x.cam != null ? x.cam : B.cam) * 180 / Math.PI)) + "°</b></span><input type='range' min='-3.14' max='3.14' step='0.05' value='" + (x.cam != null ? x.cam : B.cam) + "' oninput='KineCreateur.cam(this.value)'></label>" +
      "</details>" +
      "<details class='kf-acc' open><summary>Tronc et bassin (" + (which === "a" ? "départ" : "arrivée") + ")</summary>" +
        slider("tilt", "Bascule du bassin", -60, 120, 1) + slider("flex", "Dos : arrondi (+) / creusé (−)", -40, 40, 1) + slider("lat", "Inclinaison sur le côté", -40, 40, 1) +
        slider("rot", "Rotation du tronc", -60, 60, 1) + slider("down", "Bassin plus bas", -0.3, 0.6, 0.01, "m") + slider("fwd", "Bassin avant / arrière", -0.6, 0.6, 0.01, "m") + slider("head", "Tête : flexion", -40, 40, 1) +
      "</details>" +
      "<details class='kf-acc'><summary>Jambes</summary>" + legBlock("L", "Jambe gauche") + legBlock("R", "Jambe droite") + "</details>" +
      "<details class='kf-acc'><summary>Bras</summary>" + armBlock("LA", "Bras gauche") + armBlock("RA", "Bras droit") + "</details>" +
      "<details class='kf-acc'><summary>Rythme</summary>" +
        "<div class='kc-seg kcr-seg'>" + [["reps", "Répétitions"], ["timed", "Durée"]].map(function (m) { return "<button type='button' class='" + (x.mode === m[0] ? "on" : "") + "' onclick='KineCreateur.mode(\"" + m[0] + "\")'>" + m[1] + "</button>"; }).join("") + "</div>" +
        "<label class='kcr-sl'><span>Aller<b id='v-go'>" + fmt(x.tempo.go, "s") + "</b></span><input type='range' min='0.5' max='5' step='0.5' value='" + x.tempo.go + "' oninput='KineCreateur.tempo(\"go\",this.value)'></label>" +
        "<label class='kcr-sl'><span>Tenue<b id='v-hold'>" + fmt(x.tempo.hold, "s") + "</b></span><input type='range' min='0' max='10' step='0.5' value='" + x.tempo.hold + "' oninput='KineCreateur.tempo(\"hold\",this.value)'></label>" +
        "<label class='kcr-sl'><span>Retour<b id='v-back'>" + fmt(x.tempo.back, "s") + "</b></span><input type='range' min='0.5' max='6' step='0.5' value='" + x.tempo.back + "' oninput='KineCreateur.tempo(\"back\",this.value)'></label>" +
        "<label class='kc-check'><input type='checkbox'" + (x.noIso ? "" : " checked") + " onchange='KineCreateur.iso(this.checked)'> Maintiens isométriques habituels (à la moitié et à la dernière répétition)</label>" +
        "<label class='ko-f'><span>Côtés</span><select onchange='KineCreateur.sides(this.value)'>" +
          [["none", "Les deux ensemble"], ["blocks", "Un côté, puis l'autre"], ["alternate", "En alternance"]].map(function (o) { return "<option value='" + o[0] + "'" + (x.sides === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
        "<label class='ko-f'><span>Mot pour l'aller (voix)</span><input value='" + esc(x.words.go) + "' oninput='KineCreateur.word(\"go\",this.value)'></label>" +
        "<label class='ko-f'><span>Mot pour le retour (voix)</span><input value='" + esc(x.words.back) + "' oninput='KineCreateur.word(\"back\",this.value)'></label>" +
      "</details>" +
      "<details class='kf-acc' open><summary>Fiche</summary>" +
        "<label class='ko-f'><span>Nom de l'exercice</span><input id='kcr-name' value='" + esc(x.fiche.name) + "' maxlength='48'></label>" +
        "<label class='ko-f'><span>Groupe</span><select id='kcr-group'>" + groups + "</select></label>" +
        "<div class='ko-f'><span>Difficulté</span><div class='kc-seg' id='kcr-col' data-v='" + x.fiche.color + "'>" + [1, 2, 3].map(function (k) {
          return "<button type='button' class='" + (x.fiche.color === k ? "on" : "") + "' onclick='KineOfficiel.col(this," + k + ")'><i class='kb-dot c" + k + "'></i>" + KineBiblio.colors[k][1] + "</button>"; }).join("") + "</div></div>" +
        "<label class='ko-f'><span>Répétitions ou durée</span><input id='kcr-reps' value='" + esc(x.fiche.repsLabel) + "'><small>Exemples : 12 répétitions · 10 répétitions par côté · 30 secondes</small></label>" +
        "<label class='ko-f'><span>Consigne</span><textarea id='kcr-desc' rows='4'>" + esc(x.fiche.desc) + "</textarea></label>" +
        "<label class='ko-f'><span>Point clé</span><input id='kcr-cue' value='" + esc(x.fiche.cue) + "'></label>" +
        "<label class='ko-f'><span>Erreur fréquente</span><input id='kcr-err' value='" + esc(x.fiche.err) + "'></label>" +
        "<label class='ko-f'><span>Conseil</span><textarea id='kcr-tip' rows='2'>" + esc(x.fiche.tip) + "</textarea></label>" +
        "<label class='ko-f'><span>Critère d'arrêt</span><input id='kcr-stop' value='" + esc(x.fiche.stop) + "'></label>" +
      "</details><p class='kc-err' id='kcr-msg'></p></div>" +
      "<div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineCreateur.save()'>Enregistrer l'exercice</button></div>";
    el.classList.add("open"); el.scrollTop = y;
    preview(true);
  }
  // L'avatar d'aperçu : la définition « __kcr » est modifiée en place, l'avatar suit
  var live = null;
  function preview(reshow) {
    var stage = $("kcr-stage"); if (!stage || !window.KineAvatar) return;
    var d = buildDef(cur);
    if (!live || reshow) { live = d; KineAvatar.register("__kcr", live); KineAvatar.hide(); KineAvatar.show(stage, "__kcr"); }
    else { live.poses.a = d.poses.a; live.poses.b = d.poses.b; }
    KineAvatar.step({ pose: which, dur: 0.12 });
  }
  function setv(path, v, unit) {
    setPath(path, +v);
    var lab = $("v-" + path.replace(/\./g, "-")); if (lab) lab.textContent = fmt(+v, unit);
    playing++; preview(false);
  }
  function play() {
    var id = ++playing, d = buildDef(cur), seq = [{ pose: "a", dur: 0.6 }].concat(d.steps).concat(d.steps), i = 0;
    (function next() { if (playing !== id || i >= seq.length) return; var s = seq[i++]; KineAvatar.step(s); setTimeout(next, s.dur * 1000); })();
  }
  function open(name) {
    var store = window.KineOfficiel ? KineOfficiel.customDraft() : {};
    cur = name && store[name] ? clone(store[name]) : blank(); origName = name || null; which = "a"; live = null;
    render();
  }
  function close() { playing++; var el = $("kcr-sheet"); if (el) el.classList.remove("open"); if (window.KineAvatar) KineAvatar.hide(); live = null; }
  function readFiche() {
    var f = cur.fiche;
    f.name = $("kcr-name").value.trim(); f.group = $("kcr-group").value; f.color = +$("kcr-col").getAttribute("data-v");
    f.repsLabel = $("kcr-reps").value.trim().replace(/\s+/g, " "); f.desc = $("kcr-desc").value.trim(); f.cue = $("kcr-cue").value.trim();
    f.err = $("kcr-err").value.trim(); f.tip = $("kcr-tip").value.trim(); f.stop = $("kcr-stop").value.trim();
  }
  function save() {
    readFiche();
    var f = cur.fiche, msg = $("kcr-msg");
    if (!f.name) { msg.textContent = "Donnez un nom à l'exercice."; return; }
    if (!/^\d+( à \d+)? (répétitions?|secondes|minutes?)( par (côté|jambe))?$/.test(f.repsLabel)) { msg.textContent = "Répétitions ou durée : par exemple « 12 répétitions » ou « 30 secondes »."; return; }
    if (cur.sides !== "none" && !/par (côté|jambe)/.test(f.repsLabel)) { msg.textContent = "Pour un exercice d'un côté puis de l'autre, écrivez « … par côté »."; return; }
    if (cur.mode === "timed") { var n = parseInt(f.repsLabel, 10); if (!/seconde|minute/.test(f.repsLabel)) { msg.textContent = "En mode « Durée », écrivez une durée, par exemple « 30 secondes »."; return; } cur.seconds = /minute/.test(f.repsLabel) ? n * 60 : n; }
    var exists = window.KineBiblio && KineBiblio.find(f.name);
    if (exists && f.name !== origName) { msg.textContent = "Ce nom existe déjà dans la bibliothèque."; return; }
    KineOfficiel.saveCustom(cur, origName);
    close();
  }

  return {
    BASES: BASES, buildDef: buildDef, register: register, open: open, close: close, save: save, play: play,
    set: setv, which: function (w) { which = w; render(); },
    free: function (s, on) { var P = cur.poses[which]; P[s].free = !!on; render(); },
    base: function (b) { cur.base = b; cur.poses = { a: blankP(b), b: blankP(b) }; cur.cam = null; cur.props = (BASES[b].props || []).slice(); render(); },
    prop: function (p) { var i = cur.props.indexOf(p); if (i >= 0) cur.props.splice(i, 1); else cur.props.push(p); render(); },
    load: function () { cur.load = cur.load ? null : "both"; render(); },
    cam: function (v) { cur.cam = +v; var l = $("v-cam"); if (l) l.textContent = Math.round(v * 180 / Math.PI) + "°"; preview(true); },
    tempo: function (k, v) { cur.tempo[k] = +v; var l = $("v-" + k); if (l) l.textContent = fmt(+v, "s"); },
    mode: function (m) { cur.mode = m; render(); },
    sides: function (v) { cur.sides = v; },
    iso: function (on) { cur.noIso = !on; },
    word: function (k, v) { cur.words[k] = v; }
  };
})();
window.KineCreateur = KineCreateur;
