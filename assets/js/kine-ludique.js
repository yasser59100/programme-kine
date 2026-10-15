/* ═══════════ KinéForce — plus ludique ═══════════
   1. Vrai ou faux : une carte à balayer (à droite = vrai, à gauche = faux). Yass, en 3D, réfléchit
      pendant qu'on hésite, puis applaudit ou hausse les épaules, et lit l'explication.
   2. « Le saviez-vous ? » : un petit schéma animé par thème (pas, dos, genou, muscle, cerveau, sommeil…). */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  var YASS = "__mascotte", SLOT = 4;

  /* ════════ Yass en 3D dans une petite scène ════════ */
  var cur = null;   // { A, box, id, img }
  function yass(box, cb) {
    var L = window.KineLumiere, M = window.KineMascotte;
    if (!box || !L || !L.avatar || !window.KineAvatar) return cb(null);
    if (M && M.portrait) M.portrait();              // enregistre Yass dans l'avatar principal
    var def = KineAvatar._def(YASS); if (!def) return cb(null);
    L.avatar(SLOT, function (A) {
      if (!A || !box.isConnected) return cb(null);
      if (!A.supports(YASS)) A.register(YASS, def);
      if (cur && cur.A === A && cur.box !== box) stopYass();
      if (!A.show(box, YASS)) return cb(null);
      if (A.pause) A.pause(false);
      var id = {}; cur = { A: A, box: box, id: id };
      cb(cur);
    });
  }
  function stopYass() {
    if (!cur) return;
    var c = cur; cur = null; c.id.dead = true;
    if (c.box.querySelector("canvas")) c.A.hide();
  }
  function play(c, seq, loop, then) {
    var i = 0;
    (function next() {
      if (!c || c.id.dead || !c.box.isConnected) return;
      if (i >= seq.length) { if (loop) i = 0; else { if (then) then(); return; } }
      var s = seq[i++]; c.A.step({ pose: s[0], dur: s[1] });
      setTimeout(next, s[1] * 1000 + 40);
    })();
  }
  var THINK = [["idle", 1.2], ["talkA", 0.9], ["talkA", 1.1], ["idle", 0.9], ["talkB", 0.9], ["idle", 1.4]];
  var CHEER = [["cheer1", 0.45], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.3], ["cheer1", 0.3], ["thumb", 0.6], ["thumb", 1.4], ["idle", 0.7]];
  var SHRUG = [["open", 0.6], ["talkA", 0.5], ["talkB", 0.5], ["talkA", 0.5], ["open", 0.6], ["open", 1.2], ["idle", 0.7]];

  /* ════════ 1. Vrai ou faux à balayer ════════ */
  var justAnswered = 0;
  function decorateVF() {
    var el = $("ki-vf"); if (!el || el.__lq) return;
    el.__lq = 1; el.classList.add("lq-vf");
    var q = el.querySelector(".ki-q"), btns = el.querySelector(".ki-vf-b");
    if (q && btns) return swipeCard(el, q, btns);
    var res = el.querySelector(".ki-vf-r");
    if (res && Date.now() - justAnswered < 4000) reaction(el, res);
  }
  function swipeCard(el, q, btns) {
    var deck = document.createElement("div"); deck.className = "lq-deck";
    deck.innerHTML = "<div class='lq-stage' aria-hidden='true'></div>" +
      "<div class='lq-card' tabindex='0' aria-label='Carte à balayer : à droite pour vrai, à gauche pour faux'>" +
        "<span class='lq-lab lq-v'>Vrai</span><span class='lq-lab lq-f'>Faux</span><div class='lq-q'></div>" +
        "<small class='lq-hint'><span>‹ Faux</span><span>Vrai ›</span></small></div>";
    el.insertBefore(deck, q); deck.querySelector(".lq-q").appendChild(q);
    var b = btns.querySelectorAll("button");
    if (b.length === 2) { b[0].innerHTML = "<span aria-hidden='true'>✓</span>Vrai"; b[1].innerHTML = "<span aria-hidden='true'>✕</span>Faux"; btns.insertBefore(b[1], b[0]); b[1].classList.add("lq-no"); b[0].classList.add("lq-yes"); }
    var card = deck.querySelector(".lq-card"), stage = deck.querySelector(".lq-stage");
    // Yass réfléchit, seulement quand la carte est à l'écran
    watchVisible(stage, function (on) {
      if (on) yass(stage, function (c) { if (c) { stage.classList.add("on"); play(c, THINK, true); } });
      else if (cur && cur.box === stage) stopYass();
    });
    var x0 = null, dx = 0, id = null;
    function set(x) {
      dx = x;
      card.style.transform = "translateX(" + x + "px) rotate(" + (x / 16) + "deg)";
      var k = Math.min(1, Math.abs(x) / 90);
      card.querySelector(".lq-v").style.opacity = x > 0 ? k : 0;
      card.querySelector(".lq-f").style.opacity = x < 0 ? k : 0;
      card.classList.toggle("lq-to-v", x > 40); card.classList.toggle("lq-to-f", x < -40);
    }
    card.addEventListener("pointerdown", function (e) { x0 = e.clientX; id = e.pointerId; card.classList.add("drag"); try { card.setPointerCapture(id); } catch (er) {} });
    card.addEventListener("pointermove", function (e) { if (x0 == null || e.pointerId !== id) return; set(e.clientX - x0); });
    function up() {
      if (x0 == null) return;
      x0 = null; card.classList.remove("drag");
      if (Math.abs(dx) > 80) fly(dx > 0); else { card.style.transition = "transform .3s cubic-bezier(.2,.9,.3,1.3)"; set(0); setTimeout(function () { card.style.transition = ""; }, 320); }
    }
    card.addEventListener("pointerup", up); card.addEventListener("pointercancel", up);
    card.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") fly(true); if (e.key === "ArrowLeft") fly(false); });
    function fly(yes) {
      if (navigator.vibrate) { try { navigator.vibrate(12); } catch (er) {} }
      card.style.transition = "transform .28s ease-in, opacity .28s";
      card.style.transform = "translateX(" + (yes ? 460 : -460) + "px) rotate(" + (yes ? 24 : -24) + "deg)"; card.style.opacity = "0";
      setTimeout(function () { answer(yes); }, 260);
    }
    [].forEach.call(btns.querySelectorAll("button"), function (bt) {
      var yes = bt.classList.contains("lq-yes");
      bt.removeAttribute("onclick"); bt.onclick = function () { fly(yes); };
    });
  }
  function answer(yes) { justAnswered = Date.now(); stopYass(); if (window.KineIdees) KineIdees._vf(yes); }
  function reaction(el, res) {
    var good = !!res.querySelector("b.ok");
    res.classList.add("lq-flip");
    var img = res.querySelector("img"), stage = document.createElement("div");
    stage.className = "lq-stage lq-react on"; stage.setAttribute("aria-hidden", "true");
    if (img) img.replaceWith(stage); else res.insertBefore(stage, res.firstChild);
    if (good) confetti(el);
    yass(stage, function (c) {
      if (!c) { if (img) stage.replaceWith(img); return; }
      play(c, good ? CHEER : SHRUG, false, function () {
        setTimeout(function () { if (cur === c) stopYass(); if (img && stage.isConnected) stage.replaceWith(img); }, 1200);
      });
    });
  }
  function confetti(el) {
    var box = document.createElement("div"); box.className = "lq-conf"; box.setAttribute("aria-hidden", "true");
    var cols = ["#19C3A0", "#4B5BFF", "#FFB38A", "#F5A524", "#E5484D"], h = "";
    for (var i = 0; i < 26; i++) h += "<i style='left:" + (8 + Math.random() * 84) + "%;background:" + cols[i % 5] + ";animation-delay:" + (Math.random() * .25).toFixed(2) + "s;--dx:" + Math.round(Math.random() * 120 - 60) + "px;--r:" + Math.round(Math.random() * 720 - 360) + "deg'></i>";
    box.innerHTML = h; el.appendChild(box);
    setTimeout(function () { box.remove(); }, 1800);
  }
  var vis = [];
  function watchVisible(node, cb) {
    if (!("IntersectionObserver" in window)) return cb(true);
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { cb(x.isIntersecting && !document.hidden); }); }, { threshold: 0.3 });
    io.observe(node); vis.push(io);
  }

  /* ════════ 2. Petites scènes : Yass joue le conseil ════════
     décès → il sort de sa tombe ; marche → il traverse la carte ; arthrose, genou, os → rayons X, on voit ses os ;
     dos → bird-dog et colonne aux rayons X ; sommeil → il dort ; cerveau → un cerveau qui s'allume ; moral → des cœurs ;
     tabac → il respire, la fumée s'en va ; équilibre → sur une jambe ; force → il soulève, « +1 » à chaque répétition. */
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var RULES = [
    ["tomb", /décès|mortalit|mourir/i], ["walk", /\bpas\b|march|walkback|sédentar|assis/i], ["sleep", /sommeil|dorm|nuit/i], ["bed", /\bau lit\b|alité|repos au lit/i],
    ["back", /\bdos\b|lombalg|lombaire/i], ["xray", /arthros|cartilag|ménisque|genou|\bos\b|osseu|imagerie|irm|radio|articul|fracture/i],
    ["brain", /cerveau|mémoire|démence|cognit|alzheimer/i], ["moral", /déprim|moral|dépress|anxi|social|ami|isol|stress/i],
    ["lungs", /tabac|fum|cigaret|poumon/i], ["balance", /équilibre|chute|tomber|mobilit/i], ["muscle", /./]
  ];
  // d'abord le titre et le thème (le sujet), le chiffre clé seulement si rien ne correspond
  function kind(t) {
    var a = [t.theme, t.title].join(" "), b = String(t.statLabel || "");
    for (var i = 0; i < RULES.length - 1; i++) if (RULES[i][1].test(a)) return RULES[i][0];
    for (var j = 0; j < RULES.length - 1; j++) if (RULES[j][1].test(b)) return RULES[j][0];
    return "muscle";
  }
  var IMG = { bed: "sleep", tomb: "moral", walk: "walk", sleep: "sleep", back: "back", xray: "knee", brain: "brain", moral: "moral", lungs: "lungs", balance: "balance", muscle: "muscle" };
  var MASC = { yaw: 0.3, dist: 3.9, ty: 0.98, pitch: 0.06 };
  var SCN = {
    tomb:    { def: YASS, cam: MASC, seq: [["cheer1", 0.45], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.3], ["thumb", 0.6], ["thumb", 1.6], ["idle", 0.8]] },
    walk:    { def: "__walk", cam: { yaw: -1.57, dist: 4.2, ty: 0.9, pitch: 0.05 }, seq: [["wA", 0.48], ["wB", 0.48]], loop: true },
    // repos au lit contre rester actif : il dort dans son lit… puis se lève et bouge
    bed:     { def: "__bed", cam: { yaw: 1.35, pitch: 0.22, dist: 5, ty: 0.85 }, seq: [["lie", 2.4], ["lie", 0.4], ["stand", 0.9], ["cheer1", 0.4], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.3], ["thumb", 1.2], ["stand", 0.6], ["lie", 1.1]], loop: true },
    sleep:   { def: "Pont de hanche", cam: { yaw: 1.35, pitch: 0.38, dist: 4.2, ty: 0.42 }, seq: [["down", 2.2], ["down", 2.2]], loop: true },
    back:    { def: "Bird-dog", cam: { yaw: 1.3, pitch: 0.24, dist: 4.9, ty: 0.62, tz: 0.15 }, seq: [["up", 1.6], ["up", 1.4], ["down", 1.4]], loop: true, xray: true },
    xray:    { def: "Squat bilatéral", cam: { yaw: 0.85, dist: 4.2, ty: 0.85, pitch: 0.1 }, seq: [["down", 1.5], ["up", 1.1]], loop: true, xray: true },
    brain:   { def: "Jumping jack sans saut", cam: { yaw: 0.25, dist: 4.4, ty: 0.9, pitch: 0.06 }, seq: [["oL", 0.6], ["up", 0.5], ["oR", 0.6], ["up", 0.5]], loop: true },
    moral:   { def: YASS, cam: MASC, seq: [["cheer1", 0.5], ["cheer2", 0.35], ["cheer1", 0.35], ["cheer2", 0.35], ["open", 0.7], ["open", 1.2], ["idle", 0.8], ["idle", 0.8]], loop: true },
    lungs:   { def: YASS, cam: MASC, seq: [["ouvre", 1.8], ["ouvre", 0.6], ["idle", 1.8], ["idle", 0.5]], loop: true },
    balance: { def: "Montées de genoux", cam: { yaw: 0.9, dist: 4.2, ty: 0.9, pitch: 0.06 }, seq: [["kL", 0.8], ["kL", 2.4], ["up", 0.6], ["kR", 0.8], ["kR", 2.4], ["up", 0.6]], loop: true },
    muscle:  { def: "Curl biceps", cam: { yaw: 0.8, dist: 4.2, ty: 0.9, pitch: 0.06 }, seq: [["up", 1.1], ["down", 1.3]], loop: true, plus: "up" }
  };
  var DECO = {
    tomb: "<div class='lq-tomb'><b>R.I.P.</b></div><div class='lq-ground'></div><div class='lq-dirt'>" + "<i></i>".repeat(9) + "</div>",
    walk: "<div class='lq-road'></div>",
    bed: "<div class='lq-bed'></div><div class='lq-zz'><i>Z</i><i>z</i><i>z</i></div>",
    sleep: "<div class='lq-moon'></div><div class='lq-zz'><i>Z</i><i>z</i><i>z</i></div>",
    back: "<div class='lq-scan'></div>", xray: "<div class='lq-scan'></div>",
    brain: "<div class='lq-brain'><svg viewBox='0 0 64 52'><path d='M32 6c-6-5-17-2-18 7-7 2-7 14 0 16 0 8 10 13 18 7 8 6 18 1 18-7 7-2 7-14 0-16-1-9-12-12-18-7z' fill='#fff' fill-opacity='.18' stroke='#fff' stroke-width='2.5'/><path d='M32 8v34M22 18l10 6 10-6M23 30l9-6 9 6' stroke='#fff' stroke-width='1.6' fill='none' opacity='.6'/></svg><i></i><i></i><i></i></div>",
    moral: "<div class='lq-hearts'><i>♥</i><i>♥</i><i>♥</i><i>♥</i><i>♥</i></div>",
    lungs: "<div class='lq-smoke'><i></i><i></i><i></i></div><div class='lq-nosmo'>🚭</div>",
    balance: "", muscle: "<div class='lq-plus'></div>"
  };
  // Une marche simple : jambe et bras opposés vers l'avant, en alternance
  function walkDef() {
    if (KineAvatar._def("__walk") || !KineAvatar.lib) return;
    var L = KineAvatar.lib, base = L.STAND(0.1, 4);
    // une jambe reste posée au sol (le bassin se cale dessus), l'autre passe devant
    var a = function (sw) { var o = {}; o[sw] = { ang: [30, 2, 0, 38, 0] }; o[sw + "A"] = { ang: [-25, 8, 0, 25] }; o[sw === "L" ? "RA" : "LA"] = { ang: [28, 8, 0, 25] }; o.spine = [5, 0, 0]; return L.merge(base, o); };
    KineAvatar.register("__walk", { camera: { yaw: -1.57 }, start: "wA", thumb: "wA", poses: { wA: a("L"), wB: a("R") } });
  }
  function bedDef() {
    if (KineAvatar._def("__bed")) return;
    var p = KineAvatar._def("Pont de hanche"), m = KineAvatar._def(YASS); if (!p || !m) return;
    // allongé à plat sur le matelas (hauteur ~0,4 m), jambes tendues, bras le long du corps
    var lie = KineAvatar.lib.merge(p.poses.down, { pelvis: { p: [0, 0.5, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
      L: { foot: { at: [0.12, 0.47, 0.86], yaw: 0, pole: [0.1, 1, 0] } }, R: { foot: { at: [-0.12, 0.47, 0.86], yaw: 0, pole: [-0.1, 1, 0] } },
      LA: { hand: { at: [0.27, 0.48, 0.1], pole: [1, 0.4, 0] } }, RA: { hand: { at: [-0.27, 0.48, 0.1], pole: [-1, 0.4, 0] } } });
    KineAvatar.register("__bed", { camera: { yaw: 1.35 }, start: "lie", thumb: "lie", poses: { lie: lie, stand: m.poses.idle, cheer1: m.poses.cheer1, cheer2: m.poses.cheer2, thumb: m.poses.thumb } });
  }
  function hero(t, big, k, idx) {
    var kd = k || kind(t), S = window.KineScenes, own = S && idx != null && S.has(idx);
    var bg = own ? (S.bg(idx) || kd) : kd;
    return "<div class='lq-hero s-" + bg + (own ? " tip t" + idx : "") + (big ? " big" : "") + (String(t.stat).length > 7 ? " long" : "") + "' data-k='" + kd + "'" + (own ? " data-i='" + idx + "'" : "") + " aria-hidden='true'>" +
      "<span class='lq-ring'></span>" + (own ? S.deco(idx) : (DECO[kd] || "")) +
      "<div class='lq-stat'><b>" + esc(t.stat) + "</b><span>" + esc(t.statLabel) + "</span></div>" +
      "<div class='lq-st'><img src='assets/illus/" + IMG[kd] + ".webp' alt='' class='lq-ill'></div></div>";
  }
  /* Une scène vivante par emplacement d'avatar (5 : carte de l'accueil, 6 : fiche) */
  var running = {};
  // Scène sur mesure (kine-scenes.js) : Yass + accessoires, pilotés pas à pas
  function runTip(band, slot, idx) {
    var st = band.querySelector(".lq-st"), L = window.KineLumiere; if (!st || !L || !L.avatar || !window.KineAvatar) return;
    var def = KineScenes.def(idx); if (!def) return;
    stopScene(slot);
    var me = { band: band, dead: false, timers: [] }; running[slot] = me;
    L.avatar(slot, function (A) {
      if (!A || me.dead || !band.isConnected) return;
      var name = "__tip" + idx;
      A.register(name, def);
      var img = st.innerHTML;
      if (!A.show(st, name)) return;
      if (A.pause) A.pause(false);
      me.A = A; me.st = st; me.img = img;
      band.classList.add("live"); if (A.xray) A.xray(false);
      var alive = function () { return !me.dead && band.isConnected && !!st.querySelector("canvas"); };
      var c = { A: A, band: band, alive: alive,
        T: function (f, ms) { me.timers.push(setTimeout(function () { if (alive()) f(); }, ms)); },
        step: function (pose, dur) { if (def.poses[pose]) A.step({ pose: pose, dur: dur }); },
        q: function (sel) { return band.querySelector(sel); },
        xray: function (on) { if (A.xray) A.xray(on); },
        // un autre Yass dans la même scène (avatar supplémentaire, emplacements 7 et 8 réservés à la fiche)
        spawn: function (sel, def2, cb) {
          var box = band.querySelector(sel), n = (me.extras = me.extras || []).length; if (!box) return;
          L.avatar((slot === 6 ? 7 : 9) + n, function (B) {
            if (!B || !alive() || !box.isConnected) return;
            B.register(name + "_x" + n, def2); if (!B.show(box, name + "_x" + n)) return;
            if (B.pause) B.pause(false); me.extras.push({ B: B, box: box });
            cb({ step: function (pose, dur) { if (def2.poses[pose]) B.step({ pose: pose, dur: dur }); } });
          });
        } };
      try { KineScenes.run(idx, c); } catch (e) {}
    });
  }
  function runScene(band, slot) {
    var ti = band.getAttribute("data-i");
    if (ti != null && window.KineScenes) return runTip(band, slot, +ti);
    var k = band.getAttribute("data-k"), sc = SCN[k], st = band.querySelector(".lq-st"); if (!sc || !st) return;
    var L = window.KineLumiere, M = window.KineMascotte;
    if (!L || !L.avatar || !window.KineAvatar) return;
    if (sc.def === YASS && M && M.portrait) M.portrait();
    if (sc.def === "__walk") walkDef();
    if (sc.def === "__bed") bedDef();
    var def = KineAvatar._def(sc.def); if (!def) return;
    stopScene(slot);
    var me = { band: band, dead: false, timers: [] }; running[slot] = me;
    L.avatar(slot, function (A) {
      if (!A || me.dead || !band.isConnected) return;
      var name = "__scn_" + k;
      A.register(name, { camera: sc.cam, props: def.props, chair: def.chair, poses: def.poses, start: sc.seq[0][0], thumb: sc.seq[0][0] });
      var img = st.innerHTML;
      if (!A.show(st, name)) return;
      if (A.pause) A.pause(false);
      me.A = A; me.st = st; me.img = img;
      band.classList.add("live");
      if (A.xray) A.xray(false);
      var alive = function () { return !me.dead && band.isConnected && !!st.querySelector("canvas"); };
      var T = function (f, ms) { me.timers.push(setTimeout(function () { if (alive()) f(); }, ms)); };
      var i = 0;
      (function next() {
        if (!alive()) return;
        if (i >= sc.seq.length) { if (!sc.loop && k !== "tomb") return; i = 0; }
        var s = sc.seq[i++]; A.step({ pose: s[0], dur: s[1] });
        if (sc.plus && s[0] === sc.plus) plusOne(band);
        if (k === "bed") band.classList.toggle("awake", s[0] !== "lie");
        T(next, s[1] * 1000 + 30);
      })();
      if (sc.xray) xrayLoop(me, A, alive, T);
      if (k === "tomb") tombLoop(me, A, alive, T);
    });
  }
  function xrayLoop(me, A, alive, T) {
    (function cyc() {
      me.band.classList.remove("scan"); void me.band.offsetWidth; me.band.classList.add("scan");
      T(function () { A.xray(true); me.band.classList.add("xr"); }, 900);
      T(function () { A.xray(false); me.band.classList.remove("xr"); }, 4200);
      T(cyc, 6200);
    })();
  }
  function tombLoop(me, A, alive, T) {
    (function cyc() {
      me.band.classList.remove("up"); me.band.classList.add("down");
      T(function () { me.band.classList.remove("down"); me.band.classList.add("up"); }, 700);
      T(cyc, 8200);
    })();
  }
  function plusOne(band) {
    var p = band.querySelector(".lq-plus"); if (!p) return;
    var n = (+p.getAttribute("data-n") || 0) + 1; p.setAttribute("data-n", n);
    var i = document.createElement("i"); i.textContent = "+" + n; p.appendChild(i); setTimeout(function () { i.remove(); }, 1300);
  }
  function stopScene(slot) {
    var r = running[slot]; if (!r) return;
    r.dead = true; r.timers.forEach(clearTimeout); running[slot] = null;
    if (r.A) { if (r.A.xray) r.A.xray(false); if (r.st && r.st.querySelector("canvas")) r.A.hide(); }
    (r.extras || []).forEach(function (x) { if (x.box.querySelector("canvas")) x.B.hide(); x.box.innerHTML = ""; });
    if (r.st && r.st.isConnected) r.st.innerHTML = r.img;
    r.band.classList.remove("live", "xr", "scan", "up", "down", "moving", "awake", "done", "tick", "ring", "zap", "smoke", "healed", "sunny", "wobble", "cake", "squeeze", "inmri", "result", "drop", "light", "glow", "lean", "eq", "shield", "book", "fill", "tilt", "lit");
  }
  function liveWhenVisible(band, slot) {
    if (!("IntersectionObserver" in window)) return runScene(band, slot);
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!band.isConnected) { io.disconnect(); stopScene(slot); return; }
        if (x.isIntersecting && !document.hidden) { if (!running[slot] || running[slot].band !== band) runScene(band, slot); }
        else if (running[slot] && running[slot].band === band) stopScene(slot);
      });
    }, { threshold: 0.35 });
    io.observe(band);
  }
  function decorateSavoir() {
    var c = $("ks-card"); if (!c || c.__lq || !window.KineSavoir) return;
    c.__lq = 1;
    var t = KineSavoir.tips[KineSavoir.today()]; if (!t) return;
    c.classList.add("lq-ks"); c.insertAdjacentHTML("afterbegin", hero(t, false, null, KineSavoir.today()));
    liveWhenVisible(c.querySelector(".lq-hero"), 5);
  }
  function hookSavoirSheet() {
    if (!window.KineSavoir || KineSavoir.open.__lq) return;
    var base = KineSavoir.open, baseClose = KineSavoir.close;
    KineSavoir.open = function (i) {
      stopScene(6);
      base.apply(this, arguments);
      var sh = $("ks-sheet"), body = sh && sh.querySelector(".ks-body"), n = sh && sh.querySelector(".ks-count");
      var k = n ? (parseInt(n.textContent, 10) || 1) - 1 : 0, t = KineSavoir.tips[k];
      if (body && t && !sh.querySelector(".lq-hero")) {
        var back = body.querySelector(".kf-back");
        (back || body.firstChild).insertAdjacentHTML(back ? "afterend" : "beforebegin", hero(t, true, null, k));
        sh.classList.add("lq-sheet");
        var band = sh.querySelector(".lq-hero"); setTimeout(function () { runScene(band, 6); }, 250);
      }
    };
    KineSavoir.close = function () { stopScene(6); return baseClose.apply(this, arguments); };
    KineSavoir.open.__lq = true;
  }

  function scan() { decorateVF(); decorateSavoir(); }
  function init() {
    hookSavoirSheet(); scan();
    var box = $("today-card"); if (box && "MutationObserver" in window) new MutationObserver(scan).observe(box, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stopYass(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 60); }); else setTimeout(init, 60);
  window.KineLudique = { hero: hero, kind: kind, _stop: stopYass, _scene: function (i) { return running[i] && running[i].band.getAttribute('data-k'); } };
})();
