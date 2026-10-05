/* ═══════════════════════════════════════════════════════════════
   KinéForce — Mascotte
   L'avatar 3D apparaît de temps en temps en bas de l'écran (accueil, suivi),
   cadré du buste, avec une bulle et des gestes (coucou, montrer, bravo).
   Règles : une apparition au maximum par ouverture de l'appli, jamais pendant
   une séance, et on peut la couper (réglage « kf-mascotte » = "off").
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var NAME = "__mascotte";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ════════ Gestes ════════
     Bras : ang = [flexion épaule, abduction, rotation, flexion coude] */
  var registered = false;
  function register() {
    if (registered || !window.KineAvatar || !KineAvatar.lib) return !!registered;
    var L = KineAvatar.lib, base = L.STAND(0.11, 8);
    function pose(la, ra, extra) { return L.merge(base, { LA: { ang: la }, RA: { ang: ra } }, extra || {}); }
    var DOWN = [4, 7, 0, 10];
    KineAvatar.register(NAME, {
      camera: { yaw: 0.45, pitch: 0.04, dist: 1.95, ty: 1.4 },
      start: "idle", thumb: "idle",
      poses: {
        idle:   pose(DOWN, DOWN),
        wave1:  pose([0, 82, 40, 108], DOWN, { head: 4, headZ: 6 }),
        wave2:  pose([0, 82, 120, 108], DOWN, { head: 4, headZ: 6 }),
        open:   pose([10, 60, 0, 20], [10, 60, 0, 20], { head: -4 }),
        point:  pose(DOWN, [25, 55, 0, 8], { head: 8, headY: -14 }),
        cheer1: pose([0, 140, 0, 40], [0, 140, 0, 40], { head: -6 }),
        cheer2: pose([0, 158, 0, 12], [0, 158, 0, 12], { head: -8 }),
        thumb:  pose([90, 0, 0, 95], DOWN, { head: 2 }),
        talkA:  pose([35, 20, 20, 85], [25, 20, -10, 70], { head: 3 }),
        talkB:  pose([25, 20, -10, 70], [35, 20, 20, 85], { head: -2, headY: 6 })
      }
    });
    registered = true;
    return true;
  }
  var GESTURES = {
    wave:  [["wave1", 0.45], ["wave2", 0.32], ["wave1", 0.32], ["wave2", 0.32], ["wave1", 0.32], ["talkA", 0.5], ["talkB", 0.6], ["talkA", 0.6], ["idle", 0.7]],
    point: [["talkA", 0.5], ["talkB", 0.55], ["point", 0.6], ["point", 1.4], ["talkA", 0.6], ["idle", 0.7]],
    cheer: [["cheer1", 0.45], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.3], ["thumb", 0.6], ["thumb", 1.2], ["idle", 0.7]],
    open:  [["open", 0.6], ["talkA", 0.55], ["talkB", 0.55], ["open", 0.6], ["open", 1], ["idle", 0.7]]
  };

  /* ════════ Messages ════════ */
  function sessions() { try { return JSON.parse(get("kf-sessions") || "[]"); } catch (e) { return []; } }
  function pickMessage(page) {
    var today = iso(), ss = sessions();
    var last = ss.map(function (s) { return String(s.date).slice(0, 10); }).sort().pop();
    var gap = last ? Math.round((new Date(today) - new Date(last)) / 86400000) : null;
    var doneToday = ss.some(function (s) { return String(s.date).slice(0, 10) === today; });
    var noted = window.KineCheckin && KineCheckin.get(today);
    var M = [];
    if (gap != null && gap >= 4) M.push({ id: "retour", gesture: "open", text: "Content de te revoir ! On reprend en douceur, à ton rythme.", cta: null });
    if (doneToday && !noted) M.push({ id: "ressenti-apres", gesture: "point", text: "Bravo pour la séance ! Tu me dis comment tu te sens ?", cta: "ressenti" });
    if (!doneToday && !noted && new Date().getHours() >= 9) M.push({ id: "ressenti", gesture: "wave", text: "Tu n'as pas encore donné ton ressenti aujourd'hui. Ça prend 30 secondes !", cta: "ressenti" });
    if (doneToday && noted) M.push({ id: "bravo", gesture: "cheer", text: ss.length + " séance" + (ss.length > 1 ? "s" : "") + " au compteur, continue comme ça !", cta: null });
    if (page === "home" && !doneToday && !M.length) M.push({ id: "savoir", gesture: "point", text: "Tu connais le « Le saviez-vous ? » du jour ? Jette un œil, c'est court.", cta: "savoir" });
    return M[0] || null;
  }

  /* ════════ Affichage ════════ */
  var shown = false, timer = null, playing = null;
  function busy() {
    var g = $("rep-guide"), seq = $("seq-overlay");
    if ((g && g.classList.contains("open")) || (seq && seq.classList.contains("open"))) return true;
    return !!document.querySelector(".kf-sheet.open, #kf-routine.open, #kf-tuto");
  }
  function currentPage() {
    var h = $("page-home"), s = $("page-suivi");
    if (h && h.classList.contains("active")) return "home";
    if (s && s.classList.contains("active")) return "suivi";
    return null;
  }
  function el() {
    var e = $("kf-masc");
    if (e) return e;
    e = document.createElement("div");
    e.id = "kf-masc"; e.className = "kf-masc"; e.setAttribute("role", "status"); e.setAttribute("aria-live", "polite");
    e.innerHTML = "<div class='km-bubble'><p class='km-text' id='km-text'></p><div class='km-acts' id='km-acts'></div></div>" +
      "<div class='km-stage' id='km-stage' aria-hidden='true'></div>" +
      "<button class='km-close' onclick='KineMascotte.hide()' aria-label='Fermer'>×</button>";
    document.body.appendChild(e);
    // glisser vers le bas pour le faire partir
    var y0 = null;
    e.addEventListener("touchstart", function (ev) { y0 = ev.touches[0].clientY; }, { passive: true });
    e.addEventListener("touchend", function (ev) { if (y0 != null && ev.changedTouches[0].clientY - y0 > 50) hide(); y0 = null; });
    return e;
  }
  function play(gesture) {
    var seq = GESTURES[gesture] || GESTURES.wave, i = 0, id = {};
    playing = id;
    (function next() {
      if (playing !== id) return;
      if (i >= seq.length) return;
      var s = seq[i++]; KineAvatar.step({ pose: s[0], dur: s[1] });
      setTimeout(next, s[1] * 1000);
    })();
  }
  function show(msg) {
    if (!msg || !register()) return false;
    var box = el();
    $("km-text").textContent = msg.text;
    var acts = "";
    if (msg.cta === "ressenti") acts = "<button class='km-go' onclick='KineMascotte.act(\"ressenti\")'>Noter mon ressenti</button>";
    if (msg.cta === "savoir") acts = "<button class='km-go' onclick='KineMascotte.act(\"savoir\")'>Lire</button>";
    $("km-acts").innerHTML = acts + "<button class='km-later' onclick='KineMascotte.hide()'>Plus tard</button>" +
      "<button class='km-off' onclick='KineMascotte.off(true)'>Ne plus afficher</button>";
    if (!KineAvatar.show($("km-stage"), NAME)) return false;
    box.classList.add("open");
    play(msg.gesture);
    if (typeof speak === "function" && (typeof seqSoundOn === "undefined" || seqSoundOn)) { try { speak(msg.text, { prio: 1 }); } catch (e) {} }
    set("kf-masc-last", msg.id + "|" + iso());
    clearTimeout(timer); timer = setTimeout(hide, 14000);
    return true;
  }
  function hide() {
    clearTimeout(timer); playing = null;
    var box = $("kf-masc"); if (!box || !box.classList.contains("open")) return;
    box.classList.remove("open");
    setTimeout(function () { if (window.KineAvatar && !box.classList.contains("open") && $("km-stage") && $("km-stage").firstChild) { KineAvatar.hide(); } }, 400);
  }
  function maybe() {
    if (shown || get("kf-masc-off") === "1" || busy()) return;
    var page = currentPage(); if (!page) return;
    var msg = pickMessage(page); if (!msg) return;
    if (get("kf-masc-last") === msg.id + "|" + iso()) return;   // même message déjà dit aujourd'hui
    if (show(msg)) shown = true;
  }

  window.KineMascotte = {
    show: show, hide: hide, maybe: maybe, pick: pickMessage,
    say: function (text, gesture) { return show({ id: "libre", text: text, gesture: gesture || "wave" }); },
    act: function (what) {
      hide();
      if (what === "ressenti" && window.KineCheckin) KineCheckin.open();
      if (what === "savoir" && window.KineSavoir) KineSavoir.open(KineSavoir.today ? KineSavoir.today() : 0);
    },
    off: function (v) { set("kf-masc-off", v ? "1" : "0"); if (v) hide(); if (window.KineLayout) KineLayout.render(); },
    isOff: function () { return get("kf-masc-off") === "1"; }
  };

  function init() {
    // première occasion : quelques secondes après l'ouverture, une fois l'accueil affiché
    setTimeout(function () { if (window.THREE) maybe(); else setTimeout(maybe, 4000); }, 3500);
    // en ouvrant l'onglet Suivi (si rien n'a encore été dit)
    var base = window.showPage;
    if (typeof base === "function" && !base.__masc) {
      window.showPage = function () { var r = base.apply(this, arguments); hide(); setTimeout(maybe, 1200); return r; };
      window.showPage.__masc = true;
    }
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
