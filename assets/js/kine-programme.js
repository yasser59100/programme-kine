/* ═══════════════════════════════════════════════════════════════
   KinéForce — Onglet Programme
   Mon programme (semaine, 5 séances et leur statut) → une séance (exercices de la
   semaine) → fiche d'exercice (démonstration, phrase clé, progression S1 → S4)
   + « Comprendre mon programme » (progression, effort, courbatures / alarme).
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var WD = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var WDs = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function monday() { var d = new Date(); d.setHours(12); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
  function list() { return typeof sessions !== "undefined" && sessions ? sessions : []; }
  function plan() { return window.KineProgress ? KineProgress.plan() : { week: 1, series: 2, reason: "" }; }
  function code(id) { return SEQ_DAYS[id].label.split(" — ")[0]; }
  function works(id) { return SEQ_DAYS[id].exercises.filter(function (e) { return e.phase === "work"; }); }
  function focus(id) { var p = document.querySelector("#page-" + id + " .day-header-top p"); return p ? p.textContent.trim() : ""; }
  function fmtMin(s) { return "~" + Math.max(5, Math.round(s / 300) * 5) + " min"; }

  // Durée estimée d'une séance (échauffement + séries au tempo + repos + étirements)
  function estimate(id) {
    var d = SEQ_DAYS[id], p = plan(), w = p.week, tot = 0;
    d.exercises.forEach(function (ex) {
      if (ex.phase !== "work") { var st = window.KineRoutine && KineRoutine.steps(ex.name); tot += st ? st.reduce(function (a, s) { return a + s.dur; }, 0) : 300; return; }
      var inf = window.KineAvatar ? KineAvatar.info(ex.name, KineProgress.repsLabel(ex), w) : { mode: "reps", reps: 12 };
      var per = 30;
      if (inf.mode === "timed") per = inf.seconds * (inf.sides ? 2 : 1);
      else if (window.KineAvatar && KineAvatar.hasSteps(ex.name)) { var st2 = KineAvatar.plan(ex.name, 1, inf, w).steps; per = st2.reduce(function (a, s) { return a + s.dur; }, 0) * (inf.reps || 12); }
      else per = (inf.reps || 12) * 3;
      tot += d.circuit ? 60 * p.series : p.series * per + (p.series - 1) * 30 + 60;
    });
    if (d.circuit) tot += (p.series - 1) * 120;
    return tot;
  }
  function status(id) {
    var c = code(id), mon = monday();
    var done = list().filter(function (s) { return s.date >= mon && String(s.seance || "").indexOf(c) === 0; })[0];
    if (done) { var dd = new Date(done.date + "T12:00:00"); return ["Faite " + WDs[dd.getDay()], "done"]; }
    var map = window.KF ? KF.DAY_OF_WEEK : {}, dow = new Date().getDay(), planned = null;
    Object.keys(map).forEach(function (k) { if (map[k] === id) planned = +k; });
    if (planned === dow) return ["Aujourd'hui", "today"];
    if (planned != null) { var name = WD[planned]; return [name.charAt(0).toUpperCase() + name.slice(1), planned < dow && dow !== 0 ? "late" : "next"]; }
    return ["", "next"];
  }

  /* ════════ Écran 1 : Mon programme ════════ */
  function render() {
    var page = $("page-guide"); if (!page || typeof SEQ_DAYS === "undefined") return;
    var content = page.querySelector(".content") || page;
    var box = $("prog-v2");
    if (!box) {
      box = document.createElement("div"); box.id = "prog-v2";
      // L'ancien contenu (notice, rubriques détaillées) est conservé pour « Comprendre mon programme »
      var more = document.createElement("div"); more.id = "prog-more";
      Array.prototype.slice.call(content.children).forEach(function (n) { more.appendChild(n); });
      content.appendChild(box); content.appendChild(more);
      Array.prototype.slice.call(more.querySelectorAll(".kf-days")).forEach(function (el) {
        var prev = el.previousElementSibling; if (prev && prev.classList.contains("v2-h")) prev.remove(); el.remove(); });
      page.classList.add("v2");
    }
    var p = plan(), st = window.KineProgress ? KineProgress.state() : { week: 1, dayInCycle: 1, start: null };
    var bars = [1, 2, 3, 4].map(function (i) {
      var fill = i < p.week ? 100 : i > p.week ? 0 : Math.round(((st.dayInCycle - 1) % 7 + 1) / 7 * 100);
      return "<i class='pg-bar'><em style='width:" + (st.start ? fill : (i === 1 ? 5 : 0)) + "%'></em></i>";
    }).join("");
    var rows = Object.keys(SEQ_DAYS).map(function (id) {
      var d = SEQ_DAYS[id], s = status(id), kit = window.KF ? KF.kitFor(d) : [];
      var meta = (d.circuit ? "Circuit" : works(id).length + " exercices") + " · " + fmtMin(estimate(id)) + " · " + (kit.length ? kit.join(", ") : "sans matériel");
      return "<button class='pg-day' onclick=\"KineProgram.open('" + id + "')\"><span class='pg-j'>" + esc(code(id)) + "</span>" +
        "<span class='pg-day-t'><b>" + esc(d.label.split(" — ")[1] || d.label) + "</b><span>" + esc(meta) + "</span></span>" +
        (s[0] ? "<span class='pg-st " + s[1] + "'>" + esc(s[0]) + "</span>" : "") + "</button>";
    }).join("");
    box.innerHTML =
      "<div class='su-head'><div class='kf-h1'>Mon programme</div><div class='kf-sub'>4 semaines · 5 séances par semaine</div></div>" +
      "<div class='su-card'><div class='su-card-h'><b>Semaine " + p.week + " sur 4</b><span>" + (st.start ? "jour " + Math.min(28, st.dayInCycle) : "pas encore commencé") + "</span></div>" +
        "<div class='pg-bars'>" + bars + "</div><div class='kf-sub' style='color:var(--text)'>" + esc(p.reason) + "</div></div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Les 5 séances</div>" + rows +
      "<button class='v2-row' onclick='KineProgram.understand()'><b>Comprendre mon programme</b><span>›</span></button>";
  }

  /* ════════ Écran 2 : une séance ════════ */
  function sheet() {
    var el = $("kf-prog");
    if (!el) { el = document.createElement("div"); el.id = "kf-prog"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function openDay(id) {
    var d = SEQ_DAYS[id], p = plan(), w = p.week, kit = window.KF ? KF.kitFor(d) : [];
    var first = works(id)[0];
    var html = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineProgram.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + esc(d.label) + "</div><div class='kf-sub'>" + esc(focus(id)) + "</div></div>" +
      "<div class='su-tags'><span class='pg-chip'>Semaine " + w + "</span><span>" + (d.circuit ? p.series + " tours · 40 s par exercice" : p.series + " séries" + (first ? " · " + esc(KineProgress.repsLabel(first)) : "")) + "</span><span>" + fmtMin(estimate(id)) + "</span></div>" +
      (kit.length ? "<div class='kf-kit'><strong>À préparer :</strong> " + esc(kit.join(", ")) + "</div>" : "");
    d.exercises.forEach(function (ex, i) {
      if (ex.phase !== "work") {
        var st = window.KineRoutine && KineRoutine.steps(ex.name), dur = st ? st.reduce(function (a, s) { return a + s.dur; }, 0) : 0;
        html += "<button class='pg-rt' onclick=\"KineProgram.routine('" + id + "'," + i + ")\"><span><strong>" + (ex.phase === "warm" ? "Échauffement guidé" : "Étirements guidés") + "</strong>" + (st ? " · " + st.length + " étapes" : "") + "</span><span>" + (dur ? Math.round(dur / 60) + " min" : esc(ex.repsLabel)) + " ›</span></button>";
        return;
      }
      var thumb = window.KineAvatar && KineAvatar.supports(ex.name) ? KineAvatar.snapshot(ex.name, 104) : null;
      var tt = window.KF ? KF.tempoText(ex) : "", v = KineProgress.variant(id, i);
      var meta = (d.circuit ? KineProgress.repsLabel(ex) + " par tour" : p.series + " × " + KineProgress.repsLabel(ex)) + (tt ? " · " + tt : "");
      html += "<button class='pg-ex' onclick=\"openDemo('" + id + "'," + i + ")\">" +
        (thumb ? "<img src='" + thumb + "' alt=''>" : "<span class='pg-fig' aria-hidden='true'></span>") +
        "<span class='pg-day-t'><b>" + esc(ex.name) + "</b><span>" + esc(meta) + "</span>" + (v ? "<em>Variante : " + esc(v) + "</em>" : "") + "</span><span class='pg-chev' aria-hidden='true'>›</span></button>";
    });
    html += "</div><div class='kf-sheet-foot'><button class='seq-btn-main' onclick=\"KineProgram.close();launchSeq('" + id + "')\">Commencer la séance</button></div>";
    var el = sheet(); el.innerHTML = html; el.classList.add("open"); el.scrollTop = 0;
  }

  /* ════════ Écran 3 : progression S1 → S4 d'un exercice (dans la fiche) ════════ */
  function weeksTable(ex, dayId, idx) {
    if (ex.phase !== "work" || !window.KineAvatar) return "";
    var cur = plan().week, circuit = SEQ_DAYS[dayId] && SEQ_DAYS[dayId].circuit;
    var cells = [1, 2, 3, 4].map(function (w) {
      var inf = KineAvatar.info(ex.name, ex.repsLabel, w), txt;
      var side = /par (jambe|côté)/i.test(ex.repsLabel) ? " / côté" : "";
      if (inf.mode === "timed") txt = (circuit ? "" : (w === 1 ? "2" : w === 2 ? "2–3" : "3") + " × ") + inf.seconds + " s";
      else {
        var m = String(ex.repsLabel).match(/(\d+)(?:\s*à\s*(\d+))?/), n = m ? +m[1] : 12, hi = m && m[2] ? +m[2] : null;
        var n2 = hi ? Math.min(hi, n + 2) : n + 2;
        txt = w === 1 ? "2 × " + n : w === 2 ? "2 × " + n2 + " ou 3 × " + n : "3 × " + n;
        txt += side;
      }
      var card = document.querySelector("#ex-" + dayId + "-" + idx + " .ex-variant"), vm = card && card.textContent.match(/S(\d)(?:\s*[–-]\s*S(\d))?/);
      if (vm && w >= +vm[1]) txt += " + variante";
      if (ex.name === "Pike push-up") txt += w <= 2 ? " · genoux" : " · pieds";
      return "<div class='pg-w" + (w === cur ? " cur" : "") + "'><b>S" + w + "</b>" + esc(txt) + "</div>";
    }).join("");
    return "<div class='pg-weeks'>" + cells + "</div>";
  }

  /* ════════ Écran 4 : comprendre mon programme ════════ */
  function understand() {
    var p = plan();
    var eff = [[1, "Très facile", ""], [2, "Facile", "ok"], [3, "Modéré", "ok"], [4, "Difficile", "warn"], [5, "Épuisant", "bad"]].map(function (e) {
      return "<div class='pg-eff " + e[2] + "'><b>" + e[0] + "</b><span>" + e[1] + "</span></div>"; }).join("");
    var wk = [["S1", "2 séries, on apprend la technique"], ["S2", "3 séries si facile, sinon +2 répétitions"], ["S3", "3 séries, renforcement"], ["S4", "3 séries et variantes"]].map(function (x, i) {
      return "<div class='pg-w" + (i + 1 === p.week ? " cur" : "") + "'><b>" + x[0] + "</b>" + x[1] + "</div>"; }).join("");
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineProgram.close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Comprendre mon programme</div>" +
      "<div class='su-card'><b>Une progression sur 4 semaines</b><div class='pg-weeks'>" + wk + "</div><div class='kf-sub'>Plus d'une semaine sans séance : on reprend en semaine 1.</div></div>" +
      "<div class='su-card'><b>L'effort ressenti, sur 5</b><div class='pg-effs'>" + eff + "</div><div class='kf-sub'>Visez 2 à 3. Si vous êtes souvent à 4 ou 5, l'appli garde le même volume.</div></div>" +
      "<div class='pg-duo'><div class='pg-ok'><b>Courbatures : normal</b>Diffuses, dans les muscles, 24 à 72 h après, diminuent en bougeant.</div>" +
      "<div class='pg-bad'><b>Signal d'alarme : stop</b>Douleur vive, dans une articulation, pendant l'effort, qui augmente.</div></div>" +
      "<div class='kf-phase' style='color:var(--text2)'>En savoir plus</div><div id='pg-more-slot'></div></div>";
    var more = $("prog-more"); if (more) $("pg-more-slot").appendChild(more);
    el.classList.add("open"); el.scrollTop = 0;
  }

  window.KineProgram = {
    render: render, open: openDay, understand: understand, weeksTable: weeksTable,
    routine: function (id, i) { var ex = SEQ_DAYS[id].exercises[i]; if (window.KineRoutine && KineRoutine.has(ex.name)) KineRoutine.open(ex, null); },
    close: function () {
      var el = $("kf-prog"); if (el) el.classList.remove("open");
      var more = $("prog-more"), content = $("page-guide") && ($("page-guide").querySelector(".content") || $("page-guide"));
      if (more && content && more.parentNode !== content) content.appendChild(more);
    }
  };
  // Les liens « Voir les explications » ouvrent désormais la séance (et la fiche de l'exercice)
  window.openExplain = function (dayId, idx) {
    openDay(dayId);
    if (idx != null && SEQ_DAYS[dayId].exercises[idx] && SEQ_DAYS[dayId].exercises[idx].phase === "work") setTimeout(function () { openDemo(dayId, idx); }, 60);
  };

  function init() {
    render();
    if (typeof renderAll === "function" && !renderAll.__prog) {
      var base = renderAll;
      renderAll = function () { base.apply(this, arguments); render(); };
      renderAll.__prog = true; renderAll.__suivi = base.__suivi; renderAll.__today = base.__today;
    }
  }
  if (document.readyState === "complete") init(); else document.addEventListener("DOMContentLoaded", init);
})();
