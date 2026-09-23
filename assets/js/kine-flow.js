/* ═══════════════════════════════════════════════════════════════
   KinéForce — Parcours de séance guidée
   Accueil « séance du jour » → aperçu → exercices guidés enchaînés
   → repos avec l'exercice suivant → bilan qui s'ouvre tout seul.
   S'appuie sur les fonctions existantes de index.html (SEQ_DAYS,
   launchSeq, launchRepGuide, sessions, rgWeek…).
═══════════════════════════════════════════════════════════════ */
var seqRestNext = null;   // ce qui vient après le repos { exIdx, serie }
var seqSkipped = 0;       // exercices passés pendant la séance

(function () {
  "use strict";

  var DAY_OF_WEEK = { 1: "day0", 2: "day1", 3: "day2", 5: "day3", 6: "day4" }; // Lun J1 … Sam J5
  var WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var PHASES = { warm: ["Échauffement", "var(--amber)"], work: ["Renforcement", "var(--blue)"], cool: ["Retour au calme", "var(--green)"] };
  var BORG = [null, ["Très facile", "😴"], ["Facile", "🙂"], ["Modéré", "💪"], ["Difficile", "😤"], ["Épuisant", "🥵"]];
  var CHIPS = ["Légère fatigue", "Très motivé", "Manque d'énergie", "Progression ressentie", "Trop facile", "Trop difficile"];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function week() { return typeof rgWeek === "function" ? rgWeek() : 1; }
  function seriesFor() { return week() >= 3 ? 3 : 2; }
  function isGuided(ex) { return ex && ex.phase === "work" && ex.repsLabel && /\d/.test(ex.repsLabel); }

  function kitFor(day) {
    var txt = day.exercises.map(function (e) { return [e.name, e.desc, e.tip].join(" "); }).join(" ").toLowerCase();
    var kit = [];
    [["chaise", "une chaise"], ["marche", "une marche"], ["mur", "un mur libre"], ["tapis", "un tapis"], ["serviette", "une serviette"], ["élastique", "un élastique"]]
      .forEach(function (k) { if (new RegExp("\\b" + k[0]).test(txt)) kit.push(k[1]); });
    return kit;
  }
  function tempoText(ex) {
    if (!window.KineAvatar || !KineAvatar.hasSteps || !KineAvatar.hasSteps(ex.name)) return "";
    var inf = KineAvatar.info(ex.name, ex.repsLabel, week());
    if (inf.mode === "timed") return "";
    return KineAvatar.plan(ex.name, 1, inf, week()).steps
      .map(function (s) { return s.label.replace(/ · (gauche|droite)$/, "").toLowerCase() + " " + String(s.dur).replace(".", ",") + " s"; })
      .join(" → ");
  }
  function mondayISO() {
    var d = new Date(); d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }

  /* ════════ ACCUEIL : séance du jour ════════ */
  function renderToday() {
    var box = $("today-card");
    if (!box || typeof SEQ_DAYS === "undefined") return;
    var dow = new Date().getDay(), todayId = DAY_OF_WEEK[dow], w = week();
    var list = typeof sessions !== "undefined" ? sessions : [];
    var mon = mondayISO(), todayISO = new Date().toISOString().slice(0, 10);
    var doneWeek = list.filter(function (s) { return s.date && s.date >= mon; }).length;

    var targetId = todayId, kicker = "Séance du jour", restTxt = "";
    if (!todayId) { // jour de repos : on montre la prochaine séance
      for (var i = 1; i <= 7; i++) { var n = DAY_OF_WEEK[(dow + i) % 7]; if (n) { targetId = n; restTxt = WEEKDAYS[(dow + i) % 7]; break; } }
      kicker = "Aujourd'hui : repos · prochaine séance " + restTxt;
    }
    var day = SEQ_DAYS[targetId], code = day.label.split(" — ")[0];
    var doneToday = todayId && list.some(function (s) { return s.date === todayISO && String(s.seance || "").indexOf(code) === 0; });
    var kit = kitFor(day);

    var bar = ""; for (var k = 1; k <= 4; k++) bar += "<i" + (k <= w ? " class='on'" : "") + "></i>";
    box.innerHTML =
      "<div class='today'>" +
        "<div class='today-week'><strong>Semaine " + w + " sur 4</strong><span>" + doneWeek + " séance" + (doneWeek > 1 ? "s" : "") + " sur 5 cette semaine</span></div>" +
        "<div class='today-bar'>" + bar + "</div>" +
        "<div><div class='today-kicker'>" + esc(kicker) + "</div>" +
        "<div class='today-title'>" + esc(day.label) + "</div></div>" +
        "<div class='today-pills'><span>~40 min</span><span>" + day.exercises.length + " exercices</span>" +
          (kit.length ? "<span>" + esc(kit.join(" · ")) + "</span>" : "<span>Sans matériel</span>") + "</div>" +
        (doneToday
          ? "<button class='today-go done' onclick=\"openPreview('" + targetId + "')\">✓ Faite aujourd'hui · la refaire</button>"
          : "<button class='today-go' onclick=\"openPreview('" + targetId + "')\">▶ " + (todayId ? "Commencer la séance" : "Voir la prochaine séance") + "</button>") +
      "</div>";
  }
  window.renderToday = renderToday;

  /* ════════ APERÇU AVANT DE COMMENCER ════════ */
  window.openPreview = function (dayId) {
    var day = SEQ_DAYS[dayId], sheet = $("seq-preview"), kit = kitFor(day), nS = seriesFor();
    var rest = 0; day.exercises.forEach(function (e) { if (e.phase === "work") rest = Math.max(rest, e.restAfter || 0); });
    var html = "<div class='kf-sheet-body'>" +
      "<button class='kf-back' onclick='closePreview()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + esc(day.label) + "</div>" +
      "<div class='kf-sub'>~40 min · " + nS + " séries par exercice" + (rest ? " · repos " + (rest >= 60 ? Math.floor(rest / 60) + " min" + (rest % 60 ? " " + (rest % 60) : "") : rest + " s") : "") + "</div></div>" +
      (kit.length ? "<div class='kf-kit'><strong>À préparer :</strong> " + esc(kit.join(", ")) + "</div>" : "");
    var lastPhase = null;
    day.exercises.forEach(function (ex, i) {
      if (ex.phase !== lastPhase) { var ph = PHASES[ex.phase] || [ex.phase, "var(--text2)"]; html += "<div class='kf-phase' style='color:" + ph[1] + "'>" + ph[0] + "</div>"; lastPhase = ex.phase; }
      var meta = ex.phase === "work" ? nS + " × " + ex.repsLabel : ex.repsLabel;
      var t = tempoText(ex);
      html += "<div class='kf-ex'><div class='kf-ex-n'>" + (i + 1) + "</div><div><div class='kf-ex-name'>" + esc(ex.name) + "</div>" +
              "<div class='kf-ex-meta'>" + esc(meta) + (t ? "<br>" + esc(t) : "") + "</div></div></div>";
    });
    html += "</div><div class='kf-sheet-foot'><button class='seq-btn-main' onclick=\"closePreview();launchSeq('" + dayId + "')\">▶ Démarrer · tout est guidé</button></div>";
    sheet.innerHTML = html;
    sheet.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  window.closePreview = function () { $("seq-preview").classList.remove("open"); document.body.style.overflow = ""; };

  /* ════════ ENCHAÎNEMENT AUTOMATIQUE ════════ */
  // Après un repos, la série suivante s'ouvre seule avec un compte à rebours
  window.seqAutoNext = function (seconds) {
    var ex = SEQ_DAYS[seqCurrentDay].exercises[seqExIdx];
    if (!isGuided(ex) || !$("seq-overlay").classList.contains("open")) return;
    rgState.autoStartIn = seconds;
    if (seqSerieIdx < seqTotalSeries - 1) seqSeriesDone(); else seqExDone();
  };
  var baseLaunch = window.launchRepGuide;
  window.launchRepGuide = launchRepGuide = function () {
    baseLaunch.apply(this, arguments);
    var n = rgState.autoStartIn; rgState.autoStartIn = 0;
    if (!n) return;
    var id = rgState.runId;
    (function tick() {
      if (!rgState.active || rgState.runId !== id || rgState.phase !== "ready") return;
      if (n <= 0) { repGuideStart(); return; }
      setPhaseLabel("Départ dans " + n, "hold");
      if (n <= 3) { speak(String(n)); playBeep(700, 0.05, 0.12); }
      n--;
      setTimeout(tick, 1000);
    })();
  };

  // Terminer la série maintenant (patient fatigué)
  window.rgFinishNow = function () {
    if (!rgState.active || (rgState.phase !== "running")) return;
    if (rgState.paused) rgTogglePause();
    rgState.runId++;             // stoppe l'enchaînement en cours
    rgState.active = true;
    finishSerie();
  };

  /* ════════ REPOS : l'exercice suivant en démonstration ════════ */
  window.seqRenderRestNext = function (body) {
    var nx = seqRestNext; seqRestNext = null;
    if (!nx) return;
    var day = SEQ_DAYS[seqCurrentDay], ex = day.exercises[nx.exIdx];
    var box = document.createElement("div");
    box.className = "seq-next";
    if (!ex) {
      box.innerHTML = "<div><div class='seq-next-k'>Ensuite</div><div class='seq-next-name'>Fin de la séance</div><div class='seq-next-meta'>Votre bilan s'ouvrira juste après.</div></div>";
      body.appendChild(box); return;
    }
    var demo = document.createElement("div"); demo.className = "seq-next-demo";
    var info = document.createElement("div");
    var meta = ex.phase === "work" ? "Série " + nx.serie + " sur " + seqTotalSeries + " · " + ex.repsLabel : ex.repsLabel;
    info.innerHTML = "<div class='seq-next-k'>Ensuite</div><div class='seq-next-name'>" + esc(ex.name) + "</div><div class='seq-next-meta'>" + esc(meta) + "</div>";
    box.appendChild(demo); box.appendChild(info);
    body.appendChild(box);
    if (!(window.KineAvatar && KineAvatar.supports(ex.name) && KineAvatar.show(demo, ex.name))) { demo.remove(); return; }
    // Démonstration en boucle, au tempo de l'exercice
    var inf = KineAvatar.info(ex.name, ex.repsLabel, week()), cycle = 0;
    (function loop() {
      if (!demo.isConnected) { if (demo.querySelector("canvas")) KineAvatar.hide(); return; }
      cycle++;
      var steps = KineAvatar.plan(ex.name, cycle, inf, week()).steps, i = 0;
      (function next() {
        if (!demo.isConnected) { if (demo.querySelector("canvas")) KineAvatar.hide(); return; }
        if (i >= steps.length) { setTimeout(loop, 400); return; }
        var st = steps[i++]; KineAvatar.step(st); setTimeout(next, st.dur * 1000);
      })();
    })();
  };
  window.seqRestPain = function () {
    seqTimerPaused = true;
    var b = $("seq-rest-pause"); if (b) b.textContent = "▶ Reprendre";
    rgOpenPain();
    rgPain.onResume = function () { seqTimerPaused = false; var b2 = $("seq-rest-pause"); if (b2) b2.textContent = "⏸ Pause"; };
  };

  /* ════════ BILAN DE FIN DE SÉANCE ════════ */
  var bilan = null;
  window.renderSeqBilan = function (duration) {
    var day = SEQ_DAYS[seqCurrentDay], total = day.exercises.length, done = Math.max(0, total - (seqSkipped || 0));
    var pains = []; try { pains = JSON.parse(localStorage.getItem("kf-pain") || "[]").filter(function (p) { return p.ts >= seqStartTime; }).reverse(); } catch (e) {}
    bilan = { day: day, duration: duration, done: done, total: total, pains: pains, borg: null, pain: null, chips: [] };
    var sheet = $("seq-bilan");

    var borgBtns = ""; for (var b = 1; b <= 5; b++) borgBtns += "<button data-borg='" + b + "' aria-label='Effort " + b + " sur 5, " + BORG[b][0] + "'>" + BORG[b][1] + " " + b + "</button>";
    var painBtns = ""; for (var p = 0; p <= 10; p++) painBtns += "<button data-pain='" + p + "' aria-label='Douleur " + p + " sur 10'>" + p + "</button>";
    var chips = CHIPS.map(function (c) { return "<button data-chip=\"" + esc(c) + "\">" + esc(c) + "</button>"; }).join("");
    var painNote = pains.length
      ? "<div class='kf-note'>Pendant la séance : " + pains.map(function (x) { return "<strong>" + esc(x.zone.toLowerCase()) + ", " + x.intensite + "/10</strong> (" + esc(x.exercice) + ", " + esc(x.action) + ")"; }).join(" ; ") + "</div>" : "";

    sheet.innerHTML = "<div class='kf-sheet-body'>" +
      "<div><div class='kf-h1'>Séance terminée, bravo</div><div class='kf-sub'>" + esc(day.label) + " · Semaine " + week() + "</div></div>" +
      "<div class='kf-stats'>" +
        "<div class='kf-stat'><b>" + done + "/" + total + "</b><span>exercices</span></div>" +
        "<div class='kf-stat'><b>" + duration + " min</b><span>durée</span></div>" +
        "<div class='kf-stat" + (pains.length ? " warn" : "") + "'><b>" + pains.length + "</b><span>douleur" + (pains.length > 1 ? "s" : "") + " signalée" + (pains.length > 1 ? "s" : "") + "</span></div>" +
      "</div>" +
      "<div class='kf-q'>Effort ressenti</div><div class='kf-scale' id='kf-borg' style='grid-template-columns:repeat(5,1fr)'>" + borgBtns + "</div><div class='kf-hint' id='kf-borg-hint'></div>" +
      "<div class='kf-q'>Douleur maintenant</div><div class='kf-scale pain' id='kf-pain' style='grid-template-columns:repeat(11,1fr)'>" + painBtns + "</div>" + painNote +
      "<div class='kf-q'>Un mot pour votre kiné ?</div><div class='kf-chips' id='kf-chips'>" + chips + "</div>" +
      "<textarea class='kf-text' id='kf-notes' placeholder='Écrire un commentaire (facultatif)'></textarea>" +
      "</div><div class='kf-sheet-foot' id='kf-bilan-foot'>" +
      "<button class='seq-btn-main green' onclick='saveSeqBilan()'>✓ Enregistrer ma séance</button>" +
      "<button class='seq-btn-secondary' onclick='closeSeqBilan()'>Ne pas enregistrer</button></div>";

    sheet.querySelectorAll("[data-borg]").forEach(function (el) { el.onclick = function () {
      bilan.borg = +el.dataset.borg;
      sheet.querySelectorAll("[data-borg]").forEach(function (x) { x.classList.toggle("sel", x === el); });
      $("kf-borg-hint").textContent = bilan.borg + " · " + BORG[bilan.borg][0];
    }; });
    sheet.querySelectorAll("[data-pain]").forEach(function (el) { el.onclick = function () {
      bilan.pain = +el.dataset.pain;
      sheet.querySelectorAll("[data-pain]").forEach(function (x) { x.classList.toggle("sel", x === el); });
    }; });
    sheet.querySelectorAll("[data-chip]").forEach(function (el) { el.onclick = function () {
      el.classList.toggle("sel");
      var c = el.dataset.chip, i = bilan.chips.indexOf(c);
      if (i < 0) bilan.chips.push(c); else bilan.chips.splice(i, 1);
    }; });
    sheet.classList.add("open");
  };

  window.saveSeqBilan = function () {
    var r = bilan.done / bilan.total;
    var completion = r >= 1 ? "100% — Complète" : r >= 0.75 ? "75% — Presque" : r >= 0.5 ? "50% — Allégée" : "25% — Courte";
    var txt = ($("kf-notes").value || "").trim();
    var notes = bilan.chips.slice();
    if (bilan.pains.length) notes.push("Douleur pendant la séance : " + bilan.pains.map(function (x) { return x.zone.toLowerCase() + " " + x.intensite + "/10 (" + x.exercice + ")"; }).join(", "));
    if (txt) notes.push(txt);
    var s = { id: Date.now(), date: new Date().toISOString().slice(0, 10), seance: bilan.day.label, semaine: "S" + week(),
              borg: bilan.borg, completion: completion, douleur: bilan.pain, douleurs: bilan.pains, duree: bilan.duration,
              notes: notes.join(", "), ts: Date.now() };
    sessions.unshift(s);
    saveSessions();
    if (typeof renderAll === "function") renderAll();
    if (typeof checkBadges === "function") checkBadges();
    if (window.fbUser && typeof postSessionToFeed === "function") postSessionToFeed(s);
    speak("Séance enregistrée. À bientôt !");
    $("seq-bilan").querySelector(".kf-sheet-body").innerHTML =
      "<div style='text-align:center;padding:40px 0;display:flex;flex-direction:column;gap:10px'>" +
      "<div style='font-size:3rem'>✅</div><div class='kf-h1'>Séance enregistrée</div>" +
      "<div class='kf-sub'>Retrouvez-la dans votre suivi. Pensez à bien vous hydrater.</div></div>";
    $("kf-bilan-foot").innerHTML = "<button class='seq-btn-main' onclick=\"closeSeqBilan();showPage('home')\">Retour à l'accueil</button>";
  };
  window.closeSeqBilan = function () {
    $("seq-bilan").classList.remove("open");
    if (typeof closeSeq === "function") closeSeq();
  };

  /* ════════ Mise en route ════════ */
  function init() {
    var pain = $("rg-pain"); if (pain && pain.parentNode !== document.body) document.body.appendChild(pain);
    if (typeof renderAll === "function" && !renderAll.__today) {
      var base = renderAll;
      renderAll = function () { base.apply(this, arguments); renderToday(); };
      renderAll.__today = true;
    }
    renderToday();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
