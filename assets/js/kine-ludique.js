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

  /* ════════ 2. Illustrations : Yass met en scène le conseil, avec le chiffre clé en grand ════════ */
  var GROUP = { "Activité": "walk", "Marche": "walk", "Sédentarité": "walk", "Mal de dos": "back", "Imagerie": "back", "Os": "back",
    "Genou": "knee", "Ménisque": "knee", "Arthrose": "knee", "Articulations": "knee", "Renforcement": "muscle", "Force": "muscle", "Sport": "muscle",
    "Cerveau": "brain", "Mémoire": "brain", "Moral": "moral", "Lien social": "moral", "Sommeil": "sleep", "Équilibre": "balance", "Mobilité": "balance", "Tabac": "lungs" };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hero(t, big) {
    var g = GROUP[t.theme] || "walk";
    return "<div class='lq-hero g-" + g + (big ? " big" : "") + "' aria-hidden='true'>" +
      "<span class='lq-ring'></span>" +
      "<div class='lq-stat'><b>" + esc(t.stat) + "</b><span>" + esc(t.statLabel) + "</span></div>" +
      "<img src='assets/illus/" + g + ".webp' alt='' class='lq-ill lq-" + g + "'></div>";
  }
  function decorateSavoir() {
    var c = $("ks-card"); if (!c || c.__lq || !window.KineSavoir) return;
    c.__lq = 1;
    var t = KineSavoir.tips[KineSavoir.today()]; if (!t) return;
    c.classList.add("lq-ks"); c.insertAdjacentHTML("afterbegin", hero(t, false));
  }
  function hookSavoirSheet() {
    if (!window.KineSavoir || KineSavoir.open.__lq) return;
    var base = KineSavoir.open;
    KineSavoir.open = function (i) {
      base.apply(this, arguments);
      var sh = $("ks-sheet"), body = sh && sh.querySelector(".ks-body"), n = sh && sh.querySelector(".ks-count");
      var k = n ? (parseInt(n.textContent, 10) || 1) - 1 : 0, t = KineSavoir.tips[k];
      if (body && t && !sh.querySelector(".lq-hero")) {
        var back = body.querySelector(".kf-back");
        (back || body.firstChild).insertAdjacentHTML(back ? "afterend" : "beforebegin", hero(t, true));
        sh.classList.add("lq-sheet");
      }
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
  window.KineLudique = { hero: hero, _stop: stopYass };
})();
