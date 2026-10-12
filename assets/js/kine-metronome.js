/* ═══════════ KinéForce — guidage sonore : voix, métronome, les deux, ou silence ═══════════
   Le patient choisit depuis le bouton son de l'écran d'exercice (ou dans Suivi). Le choix est mémorisé.
   - Voix et métronome : Yass annonce les phases, un tic doux marque chaque seconde (plus discret quand il parle).
   - Voix seule : comme avant.
   - Métronome seul : plus de « On descend / On monte » ni d'encouragements, seulement les tics ;
     les annonces utiles restent (exercice, tour, changement de côté, douleur, fin).
   - Silencieux : aucun son. */
(function () {
  "use strict";
  var KEY = "kf-guide";
  var MODES = [
    ["both", "Voix et métronome", "Yass vous guide, un tic doux marque chaque seconde"],
    ["voice", "Voix seule", "Yass vous guide, sans tic"],
    ["metro", "Métronome seul", "Un tic par seconde, Yass ne fait que les annonces"],
    ["mute", "Silencieux", "Aucun son"]
  ];
  function get() { try { var m = localStorage.getItem(KEY); return /^(both|voice|metro|mute)$/.test(m) ? m : "both"; } catch (e) { return "both"; } }
  function apply() {
    var m = get();
    if (typeof seqSoundOn !== "undefined") seqSoundOn = m !== "mute";
    if (m === "mute" && typeof stopSpeech === "function") stopSpeech();
    var btn = document.getElementById("seq-sound-btn");
    if (btn && window.KFI) { btn.innerHTML = m === "mute" ? KFI.mute : KFI.sound; btn.classList.toggle("on", m !== "mute"); }
    if (typeof rgSyncSound === "function") rgSyncSound();
    var lab = document.getElementById("kg-current"); if (lab) lab.textContent = label().toLowerCase();
  }
  function label() { var m = get(); for (var i = 0; i < MODES.length; i++) if (MODES[i][0] === m) return MODES[i][1]; return ""; }
  function set(m) { try { localStorage.setItem(KEY, m); } catch (e) {} apply(); }

  /* ── Choix ── */
  function menu() {
    var el = document.getElementById("kg-sheet");
    if (!el) {
      el = document.createElement("div"); el.id = "kg-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Guidage sonore");
      el.addEventListener("click", function (e) { if (e.target === el) close(); });
      document.body.appendChild(el);
    }
    var cur = get();
    el.innerHTML = "<div class='kg-card'><div class='kg-h'>Guidage sonore</div>" + MODES.map(function (m) {
      return "<button type='button' class='kg-opt" + (m[0] === cur ? " on" : "") + "' data-m='" + m[0] + "' aria-pressed='" + (m[0] === cur) + "'><b>" + m[1] + "</b><small>" + m[2] + "</small></button>";
    }).join("") + "</div>";
    el.querySelectorAll(".kg-opt").forEach(function (b) {
      b.onclick = function () {
        set(b.getAttribute("data-m")); close();
        if (b.getAttribute("data-m") !== "mute") tick(true);   // un aperçu du son
        if (window.KineLayout && KineLayout.render) KineLayout.render();
      };
    });
    el.classList.add("open");
  }
  function close() { var el = document.getElementById("kg-sheet"); if (el) el.classList.remove("open"); }

  /* ── Le tic ── */
  function metroOn() { var m = get(); return (m === "both" || m === "metro") && typeof seqSoundOn !== "undefined" && seqSoundOn; }
  function tick(accent) {
    if (typeof playBeep !== "function") return;
    var duck = typeof isSpeaking !== "undefined" && isSpeaking && get() === "both";
    var v = accent ? 0.17 : 0.1; if (duck) v *= 0.35;
    playBeep(accent ? 1480 : 1150, accent ? 0.04 : 0.028, v, "triangle");
  }
  // Un tic à chaque seconde pleine d'une étape (le début d'étape a déjà son bip)
  var done = typeof WeakSet !== "undefined" ? new WeakSet() : null;
  function tickStep(st, ok) {
    if (!st || !st.dur || (done && done.has(st))) return;
    if (done) done.add(st);
    var n = Math.floor(st.dur - 0.15);
    for (var k = 1; k <= n; k++) (function (k) {
      setTimeout(function () {
        if (!metroOn() || (ok && !ok()) || (window.rgState && rgState.paused)) return;
        tick(false);
      }, k * 1000);
    })(k);
  }

  function hook() {
    if (typeof runSteps !== "function" || runSteps.__kg) return false;
    var baseRun = runSteps;
    runSteps = function (steps, i, ok, rep, cb) {
      if (steps && i < steps.length && !(window.rgState && rgState.paused) && metroOn()) tickStep(steps[i], ok);
      return baseRun.apply(this, arguments);
    };
    runSteps.__kg = true;

    // Position tenue (gainage, chaise…) : un tic par seconde, un plus marqué toutes les 5 secondes
    var baseTimed = timedBlock;
    timedBlock = function (id, side, seconds, cb) {
      var r = baseTimed.apply(this, arguments);
      if (!(typeof rgHasSteps === "function" && rgHasSteps(rgState.exName))) {
        var t0 = Date.now(), paused = 0, pAt = 0, k = 0;
        var iv = setInterval(function () {
          if (typeof rgAlive === "function" && !rgAlive(id)) { clearInterval(iv); return; }
          if (rgState.paused) { if (!pAt) pAt = Date.now(); return; }
          if (pAt) { paused += Date.now() - pAt; pAt = 0; }
          var el = (Date.now() - t0 - paused) / 1000;
          if (el >= seconds - 0.2) { clearInterval(iv); return; }
          if (el >= k + 1) { k = Math.floor(el); if (metroOn()) tick(k % 5 === 0); }
        }, 100);
      }
      return r;
    };

    // Métronome seul : la voix ne garde que les annonces
    var baseSpeak = speak;
    window.speak = speak = function (text, opt) {
      if (get() === "metro" && opt && (opt.prio === 2 || opt.prio === 0)) return;
      return baseSpeak.apply(this, arguments);
    };

    // Le bouton son ouvre le choix
    window.toggleSeqSound = toggleSeqSound = function () { menu(); };
    return true;
  }
  if (!hook()) document.addEventListener("DOMContentLoaded", hook);
  apply();
  document.addEventListener("DOMContentLoaded", apply);

  window.KineGuide = { menu: menu, get: get, set: set, label: label };
})();
