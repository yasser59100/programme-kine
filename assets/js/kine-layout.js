/* ═══════════════════════════════════════════════════════════════
   KinéForce — Mise en page éditoriale
   Moins de cases : le texte parle directement, des listes à séparateurs,
   des frises pour la semaine et le programme. Le verre est réservé à ce
   qui flotte (barre du bas, bouton pause, fenêtres).
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var WD = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var WS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  var MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var BORG = ["", "très facile", "facile", "modéré", "difficile", "épuisant"];
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function monday() { var d = new Date(); d.setHours(12); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
  function parse(s) { var p = String(s).slice(0, 10).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function list() { return typeof sessions !== "undefined" && sessions ? sessions : []; }
  function pains() { try { return JSON.parse(localStorage.getItem("kf-pain") || "[]"); } catch (e) { return []; } }
  function codeOf(id) { return SEQ_DAYS[id].label.split(" — ")[0]; }
  function nameOf(id) { return (SEQ_DAYS[id].label.split(" — ")[1] || "").toLowerCase(); }
  function minutes(id) { var s = window.KineProgram && KineProgram.estimate ? KineProgram.estimate(id) : 2400; return Math.max(5, Math.round(s / 300) * 5); }
  function kitText(id) {
    var k = window.KF ? KF.kitFor(SEQ_DAYS[id]) : [];
    if (!k.length) return "sans matériel";
    k = k.map(function (x) { return x.replace(" libre", ""); });
    return "avec " + (k.length > 1 ? k.slice(0, -1).join(", ") + " et " + k[k.length - 1] : k[0]);
  }
  function dayMap() { return window.KF ? KF.DAY_OF_WEEK : {}; }

  /* ════════ Accueil ════════ */
  function renderHome() {
    var box = $("today-card"); if (!box || typeof SEQ_DAYS === "undefined") return;
    var now = new Date(), dow = now.getDay(), map = dayMap(), todayId = map[dow];
    var st = window.KineProgress ? KineProgress.state() : { week: 1 }, w = st.week;
    var mon = monday(), today = iso(now), ss = list();
    var doneCodes = ss.filter(function (s) { return s.date >= mon; }).map(function (s) { return String(s.seance || "").split(" ")[0]; });
    var target = todayId, when = "aujourd'hui";
    if (!todayId) for (var i = 1; i <= 7; i++) { var n = map[(dow + i) % 7]; if (n) { target = n; when = WD[(dow + i) % 7]; break; } }
    var doneToday = todayId && ss.some(function (s) { return s.date === today && String(s.seance || "").indexOf(codeOf(todayId)) === 0; });
    var head, lede, cta;
    if (todayId && !doneToday) {
      head = "Aujourd'hui, " + nameOf(todayId) + ".";
      lede = "Semaine " + w + " sur 4. Environ " + minutes(todayId) + " minutes, " + kitText(todayId) + ".";
      cta = "Commencer la séance";
    } else if (doneToday) {
      head = "Séance faite, bravo.";
      var nx = null; for (var j = 1; j <= 7; j++) { var m = map[(dow + j) % 7]; if (m) { nx = [m, WD[(dow + j) % 7]]; break; } }
      lede = nx ? "Prochaine séance " + nx[1] + " : <strong>" + esc(nameOf(nx[0])) + "</strong>." : "";
      if (nx) target = nx[0];
      cta = "Voir la prochaine séance";
    } else {
      head = "Aujourd'hui, repos.";
      lede = "Prochaine séance " + when + " : <strong>" + esc(nameOf(target)) + "</strong>, environ " + minutes(target) + " minutes, " + kitText(target) + ".";
      cta = "Préparer la séance de " + when;
    }
    // Frise de la semaine
    var order = [1, 2, 3, 4, 5, 6, 0], lastDone = -1, dots = "";
    order.forEach(function (d, i) {
      var id = map[d], c = id ? codeOf(id) : null, done = c && doneCodes.indexOf(c) >= 0;
      if (done) lastDone = i;
      dots += "<div class='lx-day" + (!id ? " rest" : "") + (done ? " done" : "") + (d === dow ? " lx-today" : "") + "'><i></i><span>" + WS[d] + (c ? "<b>" + c + "</b>" : "") + "</span></div>";
    });
    var fill = lastDone < 0 ? 0 : (lastDone / 6) * 86;
    var banner = st.reset ? "<p class='lx-rule'>Plus d'une semaine sans séance : comme prévu par votre programme, on reprend en semaine 1.</p>"
               : st.cycleDone ? "<p class='lx-rule'>Cycle de 4 semaines terminé. Parlez-en à votre kinésithérapeute pour la suite.</p>" : "";
    var others = Object.keys(SEQ_DAYS).filter(function (id) { return id !== target; }).map(function (id) {
      return "<button class='lx-item' onclick=\"openPreview('" + id + "')\"><span class='lx-j'>" + codeOf(id) + "</span><span>" + esc(cap(nameOf(id))) + "</span><span class='lx-t'>" + minutes(id) + " min</span></button>";
    }).join("");
    box.innerHTML =
      "<p class='lx-date'>" + cap(WD[dow]) + " " + now.getDate() + " " + MO[now.getMonth()] + "</p>" +
      "<h1 class='lx-headline'>" + esc(head) + "</h1>" + (lede ? "<p class='lx-lede'>" + lede + "</p>" : "") + banner +
      "<div class='lx-week'><span class='lx-fill' style='width:" + fill + "%'></span>" + dots + "</div>" +
      "<button class='lx-cta' onclick=\"openPreview('" + target + "')\">" + esc(cta) + "</button>" +
      "<button class='lx-link' onclick=\"openExplain('" + target + "')\">Voir les exercices</button>" +
      "<h2 class='lx-section'>Faire une autre séance</h2><div class='lx-list'>" + others + "</div>";
    var page = $("page-home"); if (page) page.classList.add("lx");
  }

  /* ════════ Suivi ════════ */
  function chart(ss) {
    var pts = ss.slice(0, 6).reverse();
    if (pts.length < 2) return "<p class='lx-muted'>La courbe apparaîtra après deux séances terminées avec le bilan.</p>";
    var W = 342, y = function (v) { return 130 - v * 11; };
    var xs = pts.map(function (_, i) { return 8 + (W - 16) * i / (pts.length - 1); });
    var line = function (vals, col, dash, wdt) {
      var p = []; vals.forEach(function (v, i) { if (v != null) p.push(xs[i].toFixed(1) + "," + y(v).toFixed(1)); });
      return p.length > 1 ? "<polyline points='" + p.join(" ") + "' fill='none' stroke='" + col + "' stroke-width='" + wdt + "' stroke-linejoin='round'" + (dash ? " stroke-dasharray='5 5'" : "") + "/>" : "";
    };
    var pain = pts.map(function (s) { return s.douleur != null && s.douleur !== "" ? +s.douleur : null; });
    var eff = pts.map(function (s) { return s.borg ? +s.borg * 2 : null; });
    var mx = -1, mi = -1; pain.forEach(function (v, i) { if (v != null && v > mx) { mx = v; mi = i; } });
    var labels = pts.map(function (s, i) { return "<text x='" + (xs[i] - 6) + "' y='148' fill='#5E6A7C' font-size='11'>" + esc(String(s.seance || "").split(" ")[0]) + "</text>"; }).join("");
    return "<svg viewBox='0 0 " + W + " 152' width='100%' role='img' aria-label='Douleur et effort sur les dernières séances'>" +
      [20, 75, 130].map(function (v) { return "<line x1='0' y1='" + v + "' x2='" + W + "' y2='" + v + "' stroke='rgba(255,255,255,.06)'/>"; }).join("") +
      line(eff, "#4FACFE", true, 2.5) + line(pain, "#FF5C73", false, 3) +
      (mi >= 0 && mx >= 5 ? "<circle cx='" + xs[mi] + "' cy='" + y(mx) + "' r='5' fill='#FF5C73'/>" : "") + labels + "</svg>" +
      "<div class='lx-legend'><span><i style='background:#FF5C73'></i>Douleur, sur 10</span><span><i style='background:#4FACFE'></i>Effort, sur 5</span></div>";
  }
  function renderSuivi() {
    var box = $("suivi-v2"); if (!box) return;
    var st = window.KineProgress ? KineProgress.state() : {}, ss = list(), pp = pains(), mon = monday();
    var cyc = st.start ? ss.filter(function (s) { return s.date >= st.start; }) : ss;
    var wk = ss.filter(function (s) { return s.date >= mon; }).length;
    var pc = st.start ? pp.filter(function (p) { return String(p.date).slice(0, 10) >= st.start; }).length : pp.length;
    var since = st.start ? " depuis le " + parse(st.start).getDate() + " " + MO[parse(st.start).getMonth()] : "";
    var summary = cyc.length
      ? "<strong>" + cyc.length + " séance" + (cyc.length > 1 ? "s" : "") + "</strong>" + since + ", dont <strong>" + wk + " cette semaine</strong>." + (pc ? " <span class='lx-hurt'>" + pc + " douleur" + (pc > 1 ? "s" : "") + " signalée" + (pc > 1 ? "s" : "") + ".</span>" : " Aucune douleur signalée.")
      : "Pas encore de séance. Votre suivi se remplira dès la fin de votre première séance guidée.";
    var last = pp[0], alert = "";
    if (last) {
      var d = parse(String(last.date).slice(0, 10));
      alert = "<button class='lx-rule red' onclick='KineSuivi.open(\"douleurs\")'><b>" + esc(cap(last.zone)) + ", " + last.intensite + " sur 10</b> pendant « " + esc(last.exercice) + " », " + WD[d.getDay()] + " " + d.getDate() + ". " + esc(cap(last.action)) + ".</button>";
    }
    var rows = ss.slice(0, 4).map(function (s) {
      var d = parse(s.date), hurt = s.douleur >= 5;
      var meta = [s.duree ? s.duree + " min" : "", s.completion ? String(s.completion).split(" — ")[0] + " réalisé" : ""].filter(Boolean).join(", ");
      var v = hurt ? "douleur<b class='bad'>" + s.douleur + "</b>" : s.borg ? "effort<b>" + s.borg + "</b>" : "";
      return "<div class='lx-hrow'><span class='lx-d'><b>" + d.getDate() + "</b>" + WS[d.getDay()].toLowerCase() + ".</span><span>" + esc(s.seance || "Séance") + "<small>" + esc(meta) + "</small></span><span class='lx-v'>" + v + "</span></div>";
    }).join("");
    box.innerHTML =
      "<h1 class='lx-title'>Mon suivi</h1><p class='lx-lede'>" + summary + "</p>" +
      "<div class='lx-chart'>" + chart(ss) + "</div>" + alert +
      (rows ? "<h2 class='lx-section'>Dernières séances</h2><div class='lx-hist'>" + rows + "</div>" : "") +
      "<button class='lx-link left' onclick='KineSuivi.open(\"historique\")'>Tout l'historique</button>" +
      "<button class='lx-link left' onclick='KineSuivi.open(\"douleurs\")'>Douleurs signalées</button>" +
      "<button class='lx-send' onclick='KineSuivi.open(\"envoyer\")'>Envoyer à mon kiné</button>" +
      "<h2 class='lx-section'>Mes badges</h2>";
    var page = $("page-suivi"); if (page) page.classList.add("lx");
  }

  /* ════════ Programme ════════ */
  function renderProg() {
    var box = $("prog-v2"); if (!box || typeof SEQ_DAYS === "undefined") return;
    var p = window.KineProgress ? KineProgress.plan() : { week: 1, reason: "" }, st = window.KineProgress ? KineProgress.state() : {};
    var W = [["2 séries, on apprend la technique."], ["3 séries si l'effort reste facile, sinon 2 répétitions de plus."], ["3 séries, renforcement."], ["3 séries et variantes avancées."]];
    var weeks = W.map(function (t, i) {
      var n = i + 1, cls = n < p.week ? "done" : n === p.week ? "cur" : "";
      return "<div class='lx-wk " + cls + "'><h3>Semaine " + n + (n === p.week ? ", en cours" : "") + "</h3><p>" + t[0] + "</p></div>";
    }).join("");
    var rows = Object.keys(SEQ_DAYS).map(function (id) {
      var s = window.KineProgram && KineProgram.status ? KineProgram.status(id) : ["", ""], d = SEQ_DAYS[id];
      var nEx = d.exercises.filter(function (e) { return e.phase === "work"; }).length;
      return "<button class='lx-srow' onclick=\"KineProgram.open('" + id + "')\"><span class='lx-j'>" + codeOf(id) + "</span><span class='lx-n'>" + esc(cap(nameOf(id))) +
        "<small>" + (d.circuit ? "circuit" : nEx + " exercices") + ", " + minutes(id) + " min</small></span><span class='lx-s " + (s[1] === "done" ? "ok" : s[1] === "today" ? "now" : s[1] === "late" ? "late" : "") + "'>" + esc(s[0].replace(/^Faite .*/, "Faite")) + "</span></button>";
    }).join("");
    box.innerHTML = "<h1 class='lx-title'>Semaine " + p.week + " sur 4</h1>" + (st.start ? "<p class='lx-muted'>Jour " + Math.min(28, st.dayInCycle) + " du programme</p>" : "<p class='lx-muted'>Le programme démarre à votre première séance.</p>") +
      "<div class='lx-weeks'>" + weeks + "</div>" +
      "<h2 class='lx-section'>Les 5 séances</h2><div class='lx-list'>" + rows + "</div>" +
      "<button class='lx-link left' onclick='KineProgram.understand()'>Comprendre mon programme</button>";
    var page = $("page-guide"); if (page) page.classList.add("lx");
  }

  /* ════════ Écran d'exercice : réorganisation ════════ */
  function arrangeGuide() {
    var g = $("rep-guide"); if (!g || g.classList.contains("lx")) return;
    g.classList.add("lx");
    var prog = g.querySelector(".v2-prog"), title = $("rg-ex-name"), info = $("rg-serie-info");
    if (prog && title && info) { var head = document.createElement("div"); head.className = "lx-ghead"; head.appendChild(title); head.appendChild(info); prog.appendChild(head); }
    var count = g.querySelector(".v2-count"), phase = $("rg-phase-label");
    if (count && phase) { var row = document.createElement("div"); row.className = "lx-countrow"; count.parentNode.insertBefore(row, count); row.appendChild(count); row.appendChild(phase); }
    var duo = g.querySelector(".v2-duo"), fin = $("rg-finish-btn");
    if (duo && fin) { duo.insertBefore(fin, duo.firstChild); fin.textContent = "Passer"; }
  }

  function renderAllLx() { renderHome(); renderSuivi(); renderProg(); }
  function init() {
    arrangeGuide(); renderAllLx();
    if (typeof renderAll === "function" && !renderAll.__lx) {
      var base = renderAll;
      renderAll = function () { base.apply(this, arguments); renderAllLx(); };
      renderAll.__lx = true;
    }
  }
  if (document.readyState === "complete") init(); else document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 0); });
})();
