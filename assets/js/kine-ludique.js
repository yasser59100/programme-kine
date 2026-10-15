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

  /* ════════ 2. Schémas animés ════════ */
  var GROUP = { "Activité": "walk", "Marche": "walk", "Sédentarité": "walk", "Mal de dos": "back", "Imagerie": "back", "Os": "back",
    "Genou": "knee", "Ménisque": "knee", "Arthrose": "knee", "Articulations": "knee", "Renforcement": "muscle", "Force": "muscle", "Sport": "muscle",
    "Cerveau": "brain", "Mémoire": "brain", "Moral": "brain", "Lien social": "brain", "Sommeil": "sleep", "Équilibre": "balance", "Mobilité": "balance", "Tabac": "lungs" };
  var SC = {
    walk: "<svg viewBox='0 0 120 120'><rect class='lq-bg' width='120' height='120' rx='26'/>" +
      [0, 1, 2, 3, 4].map(function (i) { var x = 18 + i * 20, y = i % 2 ? 66 : 82; return "<g class='lq-foot' style='animation-delay:" + (i * .35) + "s' transform='translate(" + x + " " + y + ") rotate(-80)'><ellipse rx='7' ry='4.5' fill='#4B5BFF'/><circle cx='9' cy='-3' r='1.8' fill='#4B5BFF'/><circle cx='9.5' cy='1' r='1.6' fill='#4B5BFF'/></g>"; }).join("") +
      "<path class='lq-dash' d='M12 100 H108' stroke='#19C3A0' stroke-width='4' stroke-linecap='round'/><text x='60' y='38' text-anchor='middle' class='lq-num'>7 000</text></svg>",
    back: "<svg viewBox='0 0 120 120'><rect class='lq-bg' width='120' height='120' rx='26'/><g class='lq-spine'>" +
      [0, 1, 2, 3, 4, 5].map(function (i) { return "<g class='lq-vert' style='animation-delay:" + (i * .12) + "s'><rect x='48' y='" + (18 + i * 15) + "' width='24' height='11' rx='4' fill='#4B5BFF'/><rect x='52' y='" + (29.5 + i * 15) + "' width='16' height='3' rx='1.5' class='lq-disc'/></g>"; }).join("") +
      "</g><path class='lq-arc' d='M84 30 q16 30 0 60' fill='none' stroke='#19C3A0' stroke-width='3' stroke-linecap='round' stroke-dasharray='4 6'/></svg>",
    knee: "<svg viewBox='0 0 120 120'><rect class='lq-bg' width='120' height='120' rx='26'/>" +
      "<rect x='52' y='12' width='16' height='46' rx='8' fill='#C9D2FF'/><circle cx='60' cy='58' r='13' fill='#C9D2FF'/>" +
      "<g class='lq-shin'><rect x='52' y='62' width='16' height='46' rx='8' fill='#4B5BFF'/><circle cx='60' cy='64' r='10' fill='#4B5BFF'/></g>" +
      "<circle class='lq-glow' cx='60' cy='61' r='6' fill='#19C3A0'/></svg>",
    muscle: "<svg viewBox='0 0 120 120'><rect class='lq-bg' width='120' height='120' rx='26'/>" +
      "<line x1='14' y1='60' x2='30' y2='60' stroke='#8A98AB' stroke-width='4' stroke-linecap='round'/><line x1='90' y1='60' x2='106' y2='60' stroke='#8A98AB' stroke-width='4' stroke-linecap='round'/>" +
      "<g class='lq-belly'><ellipse cx='60' cy='60' rx='32' ry='16' fill='#FF8F6B'/><path d='M34 56 Q60 46 86 56 M32 62 Q60 72 88 62 M36 60 H84' stroke='#E5684A' stroke-width='1.6' fill='none'/></g>" +
      "<g class='lq-up'><path d='M60 30 l-7 8 h14 z' fill='#19C3A0'/><path d='M60 22 l-7 8 h14 z' fill='#19C3A0' opacity='.5'/></g></svg>",
    brain: "<svg viewBox='0 0 120 120'><rect class='lq-bg' width='120' height='120' rx='26'/>" +
      "<path d='M60 26c-10-8-30-4-32 12-12 4-12 24 0 28 0 14 18 22 32 12 14 10 32 2 32-12 12-4 12-24 0-28-2-16-22-20-32-12z' fill='#E4ECFF' stroke='#4B5BFF' stroke-width='3'/>" +
      "<path d='M60 28v54M42 46l18 10 18-10M44 66l16-10 16 10' stroke='#4B5BFF' stroke-width='2' fill='none' opacity='.5'/>" +
      [[42, 46], [78, 46], [60, 56], [44, 66], [76, 66]].map(function (p, i) { return "<circle class='lq-node' style='animation-delay:" + (i * .3) + "s' cx='" + p[0] + "' cy='" + p[1] + "' r='4.5' fill='#19C3A0'/>"; }).join("") + "</svg>",
    sleep: "<svg viewBox='0 0 120 120'><rect class='lq-bg lq-night' width='120' height='120' rx='26'/>" +
      "<path class='lq-moon' d='M70 30a30 30 0 1 0 22 50 26 26 0 1 1-22-50z' fill='#FFD27A'/>" +
      ["Z", "z", "z"].map(function (z, i) { return "<text class='lq-z' style='animation-delay:" + (i * .7) + "s' x='" + (30 + i * 9) + "' y='" + (54 - i * 10) + "' font-size='" + (18 - i * 3) + "'>" + z + "</text>"; }).join("") + "</svg>",
    balance: "<svg viewBox='0 0 120 120'><rect class='lq-bg' width='120' height='120' rx='26'/>" +
      "<path d='M52 100 L60 86 L68 100 Z' fill='#8A98AB'/><g class='lq-tilt'><rect x='22' y='82' width='76' height='5' rx='2.5' fill='#4B5BFF'/>" +
      "<circle cx='60' cy='36' r='7' fill='#0F1D2E'/><path d='M60 44 V66 M60 66 L52 82 M60 66 L68 82 M40 52 H80' stroke='#0F1D2E' stroke-width='5' stroke-linecap='round'/></g></svg>",
    lungs: "<svg viewBox='0 0 120 120'><rect class='lq-bg' width='120' height='120' rx='26'/><path d='M60 22V52' stroke='#8A98AB' stroke-width='5' stroke-linecap='round'/>" +
      "<g class='lq-breath'><path d='M56 50c-14-6-28 6-28 28 0 14 10 20 20 16 6-2 8-8 8-16z' fill='#FF8F9E'/><path d='M64 50c14-6 28 6 28 28 0 14-10 20-20 16-6-2-8-8-8-16z' fill='#FF8F9E'/></g>" +
      "<g class='lq-nosmoke'><circle cx='94' cy='26' r='14' fill='#fff' stroke='#E5484D' stroke-width='3'/><rect x='84' y='24' width='18' height='5' rx='1' fill='#8A98AB'/><path d='M84 36 L104 16' stroke='#E5484D' stroke-width='3'/></g></svg>"
  };
  function scene(theme) { return SC[GROUP[theme] || "walk"]; }
  function decorateSavoir() {
    var c = $("ks-card"); if (!c || c.__lq || !window.KineSavoir) return;
    c.__lq = 1;
    var t = KineSavoir.tips[KineSavoir.today()]; if (!t) return;
    var s = document.createElement("span"); s.className = "lq-sc"; s.setAttribute("aria-hidden", "true"); s.innerHTML = scene(t.theme);
    c.classList.add("lq-ks"); c.appendChild(s);
  }
  function hookSavoirSheet() {
    if (!window.KineSavoir || KineSavoir.open.__lq) return;
    var base = KineSavoir.open;
    KineSavoir.open = function (i) {
      base.apply(this, arguments);
      var sh = $("ks-sheet"), tag = sh && sh.querySelector(".ks-tag"), n = sh && sh.querySelector(".ks-count");
      var k = n ? (parseInt(n.textContent, 10) || 1) - 1 : 0, t = KineSavoir.tips[k];
      if (tag && t && !sh.querySelector(".lq-big")) { var d = document.createElement("div"); d.className = "lq-sc lq-big"; d.setAttribute("aria-hidden", "true"); d.innerHTML = scene(t.theme); tag.parentNode.insertBefore(d, tag.nextSibling); }
    };
    KineSavoir.open.__lq = true;
  }

  function scan() { decorateVF(); decorateSavoir(); }
  function init() {
    hookSavoirSheet(); scan();
    var box = $("today-card"); if (box && "MutationObserver" in window) new MutationObserver(scan).observe(box, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stopYass(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 60); }); else setTimeout(init, 60);
  window.KineLudique = { scene: scene, _stop: stopYass };
})();
