/* ═══════════════════════════════════════════════════════════════
   KinéForce — Parcours de séance guidée
   Accueil « séance du jour » → aperçu → exercices guidés enchaînés
   → repos avec l'exercice suivant → bilan qui s'ouvre tout seul.
   S'appuie sur les fonctions existantes de index.html (SEQ_DAYS,
   launchSeq, launchRepGuide, sessions, rgWeek…).
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   PROGRESSION AUTOMATIQUE (règles de l'onglet Programme)
   · Semaine calculée depuis le début du cycle (S1 → S4)
   · Absence de plus d'une semaine → reprise en S1, sans exception
   · S1 : 2 séries · S2 : 2 à 3 séries ou +2 répétitions (un seul paramètre)
     · S3 : 3 séries · S4 : 3 séries + variante avancée
   · Effort (Borg) à 4–5 sur les 2 dernières séances → on ne monte pas
═══════════════════════════════════════════════════════════════ */
var KineProgress = (function () {
  "use strict";
  var DAY = 86400000;
  function iso(d) { var z = new Date(d); return z.getFullYear() + "-" + ("0" + (z.getMonth() + 1)).slice(-2) + "-" + ("0" + z.getDate()).slice(-2); }
  function parse(x) { var p = String(x).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).getTime(); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / DAY); }
  function list() { return typeof sessions !== "undefined" && sessions ? sessions : []; }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function state() {
    var today = iso(Date.now()), all = list();
    var dates = all.map(function (s) { return s.date; }).filter(Boolean).sort();
    var last = dates.length ? dates[dates.length - 1] : null;
    var start = get("kf-start");
    if (!start && dates.length) { start = dates[0]; set("kf-start", start); } // patients déjà en cours
    var reset = false;
    var ref = last && (!start || last >= start) ? last : start;
    if (start && ref && daysBetween(ref, today) > 7) { // absence de plus d'une semaine
      start = null; set("kf-start", ""); set("kf-reset", today); reset = true;
    }
    if (get("kf-reset") && daysBetween(get("kf-reset"), today) <= 7) reset = true;
    var elapsed = start ? Math.max(0, daysBetween(start, today)) : 0;
    var week = Math.min(4, Math.floor(elapsed / 7) + 1);
    var cycle = all.filter(function (s) { return s.date && start && s.date >= start; });
    return { today: today, start: start, week: week, cycleDone: !!start && elapsed >= 28, reset: reset, cycle: cycle, dayInCycle: elapsed + 1 };
  }

  function plan() {
    var st = state(), w = st.week;
    var borgs = st.cycle.map(function (s) { return +s.borg; }).filter(function (b) { return b >= 1 && b <= 5; });
    var high = borgs.length >= 2 && borgs[0] >= 4 && borgs[1] >= 4;           // les plus récentes en premier
    var recent = borgs.slice(0, 3), avg = recent.length ? recent.reduce(function (a, b) { return a + b; }, 0) / recent.length : null;
    var easy = recent.length >= 2 && avg <= 2;
    var series = 2, bonus = 0, reason;
    if (w === 1) { reason = "Semaine 1 : 2 séries, on apprend la technique"; }
    else if (w === 2) {
      if (high) reason = "Effort élevé aux dernières séances : volume maintenu";
      else if (easy) { series = 3; reason = "Effort bien toléré : passage à 3 séries"; }
      else { bonus = 2; reason = "Semaine 2 : +2 répétitions"; }
    } else {
      series = high ? 2 : 3;
      reason = high ? "Effort élevé aux dernières séances : on reste à 2 séries"
                    : w === 3 ? "Semaine 3 : 3 séries, renforcement" : "Semaine 4 : 3 séries et variante avancée";
    }
    return { week: w, series: series, repsBonus: bonus, high: high, reason: reason, state: st };
  }

  // « 12 répétitions » → « 14 répétitions » en S2 ; « 8 à 12 » → 8 (+2 en S2, sans dépasser 12)
  function repsLabel(ex) {
    var label = String(ex && ex.repsLabel || "");
    // Exercices en durée : durée de la semaine (ex. chaise 30 s → 45 s → 1 min, planche 20 → 40 s)
    if (/seconde/i.test(label) && window.KineAvatar) {
      var inf = KineAvatar.info(ex.name, label, state().week);
      if (inf.mode === "timed") {
        var sec = inf.seconds, txt = sec >= 60 && sec % 60 === 0 ? (sec / 60) + " minute" + (sec > 60 ? "s" : "") : sec + " secondes";
        return txt + (/par (jambe|côté)/i.test(label) ? " par côté" : "");
      }
    }
    if (!/répétition/i.test(label)) return label;
    var bonus = plan().repsBonus, m = label.match(/(\d+)\s*à\s*(\d+)/);
    if (m) { var lo = +m[1], hi = +m[2]; return label.replace(m[0], String(Math.min(hi, lo + bonus))); }
    return bonus ? label.replace(/\d+/, function (n) { return String(+n + bonus); }) : label;
  }

  // Variante décrite dans la fiche de l'exercice (« Variante S4 : … », « Variante S3–S4 : … »)
  function variant(dayId, idx) {
    var el = document.querySelector("#ex-" + dayId + "-" + idx + " .ex-variant");
    if (!el) return null;
    var txt = el.textContent.replace(/\s+/g, " ").trim(), m = txt.match(/S(\d)(?:\s*[–-]\s*S(\d))?/);
    if (!m) return null;
    var from = +m[1], to = m[2] ? +m[2] : from, w = state().week;
    return w >= from ? txt.replace(/^Variante[^:]*:\s*/, "") : null;
  }

  return {
    state: state, plan: plan, repsLabel: repsLabel, variant: variant,
    week: function () { return state().week; },
    markStart: function () { if (!get("kf-start")) { set("kf-start", iso(Date.now())); set("kf-reset", ""); } }
  };
})();
window.KineProgress = KineProgress;

var seqRestNext = null;   // ce qui vient après le repos { exIdx, serie }
var seqSkipped = 0;       // exercices passés pendant la séance

(function () {
  "use strict";

  // Phrase clé affichée pendant l'exercice (validée par le kiné)
  var CUES = {
    "Squat bilatéral": "Talons au sol, genoux dans l'axe des pieds, dos neutre. Serrez les fessiers en remontant.",
    "Fentes avant unilatérales": "Genou avant au-dessus du pied, genou arrière vers le sol, buste droit.",
    "Chaise contre le mur": "Dos plaqué au mur, genoux au-dessus des chevilles, respirez normalement.",
    "Pont ischio-jambiers talons sur chaise": "Poussez dans les talons jusqu'à aligner épaules, hanches et genoux.",
    "Élévation des talons": "Montez le plus haut possible, redescendez lentement.",
    "Step-up sur marche": "Poussez sur le pied posé sur la marche, sans vous aider de l'autre jambe.",
    "Rotation externe d'épaule": "Coude collé au flanc, l'avant-bras monte vers le plafond.",
    "Pompes sur genoux": "Corps aligné, coudes à 45° du tronc, descente lente.",
    "Dips sur chaise": "Épaules basses et en arrière, coudes à 90° maximum.",
    "Pike push-up": "Hanches hautes, amenez la tête entre les mains.",
    "Superman en Y et en W": "Y : levez bras et jambes. W : rapprochez les omoplates.",
    "Plank — gainage avant-bras": "Corps aligné, ni cambré ni fessiers relevés, respiration libre.",
    "Dead bug": "Le bas du dos reste collé au sol.",
    "Side plank sur genoux": "Levez les hanches jusqu'à aligner épaule, hanche et genou.",
    "Crunch abdominal contrôlé": "Épaules décollées à 30°, expirez en montant, sans tirer sur la nuque.",
    "Bird-dog": "Bassin strictement horizontal ; s'il tourne, réduisez l'amplitude.",
    "Squat sumo": "Genoux dans l'axe des orteils, remontée en serrant fessiers et adducteurs.",
    "Donkey kick": "La cuisse monte vers le plafond, le bassin ne tourne pas.",
    "Pont de hanche": "Alignez épaules, hanches et genoux, sans cambrer le bas du dos.",
    "Clamshell": "Pieds joints, ouvrez le genou, bassin immobile.",
    "Abduction hanche debout": "Jambe tendue sur le côté, sans pencher le buste.",
    "Pont fessier unilatéral": "Poussez avec le fessier de la jambe au sol, bassin horizontal.",
    "Squat + élévation bras": "Remontez en levant les deux bras jusqu'à la verticale.",
    "Inchworm et pompes": "Marchez avec les mains jusqu'en planche, dos gainé.",
    "Fente latérale avec toucher sol": "Genou porteur fléchi, touchez le sol avec la main opposée.",
    "Burpee modifié sans saut": "La qualité prime sur la vitesse, planche gainée 2 secondes.",
    "Équilibre unipodal": "Fixez un point devant vous, bougez doucement les bras."
  };
  window.KF_CUES = CUES;

  var DAY_OF_WEEK = { 1: "day0", 2: "day1", 3: "day2", 5: "day3", 6: "day4" }; // Lun J1 … Sam J5
  var WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var PHASES = { warm: ["Échauffement", "var(--amber)"], work: ["Renforcement", "var(--blue)"], cool: ["Retour au calme", "var(--green)"] };
  var BORG = [null, ["Très facile"], ["Facile"], ["Modéré"], ["Difficile"], ["Épuisant"]];
  var CHIPS = ["Légère fatigue", "Très motivé", "Manque d'énergie", "Progression ressentie", "Trop facile", "Trop difficile"];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function week() { return typeof rgWeek === "function" ? rgWeek() : 1; }
  function seriesFor() { return KineProgress.plan().series; }
  function isGuided(ex) { return ex && ex.phase === "work" && ex.repsLabel && /\d/.test(ex.repsLabel); }

  function kitFor(day) {
    var txt = day.exercises.map(function (e) { return [e.name, e.desc, e.tip].join(" "); }).join(" ").toLowerCase();
    var kit = [];
    [["haltère", "un haltère de 1 kg ou une bouteille d'eau"], ["chaise", "une chaise"], ["marche", "une marche"], ["mur", "un mur libre"], ["tapis", "un tapis"], ["serviette", "une serviette"], ["élastique", "un élastique"]]
      .forEach(function (k) { if (new RegExp("\\b" + k[0]).test(txt)) kit.push(k[1]); });
    return kit;
  }
  function tempoText(ex) {
    if (!window.KineAvatar || !KineAvatar.hasSteps || !KineAvatar.hasSteps(ex.name)) return "";
    var inf = KineAvatar.info(ex.name, ex.repsLabel, week());
    if (inf.mode === "timed") return "";
    return KineAvatar.plan(ex.name, 1, inf, week()).steps
      .map(function (s) { return s.label.replace(/ · (jambe |côté )?(gauche|droite)$/, "").toLowerCase() + " " + String(s.dur).replace(".", ",") + " s"; })
      .join(" → ");
  }
  function mondayISO() {
    var d = new Date(); d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }

  /* ════════ ACCUEIL : séance du jour ════════ */
  var SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  function userName() {
    var el = $("hero-name"), t = el ? el.textContent.trim() : "";
    return t && t !== "Mon programme" ? t.split(" ")[0] : "";
  }
  function renderToday() {
    var box = $("today-card");
    if (!box || typeof SEQ_DAYS === "undefined") return;
    var page = $("page-home"); if (page) page.classList.add("v2");
    var now = new Date(), dow = now.getDay(), todayId = DAY_OF_WEEK[dow], w = week();
    var list = typeof sessions !== "undefined" ? sessions : [];
    var mon = mondayISO(), todayISO = now.toISOString().slice(0, 10);
    var doneWeek = list.filter(function (s) { return s.date && s.date >= mon; });
    var doneCodes = doneWeek.map(function (s) { return String(s.seance || "").split(" ")[0]; });

    var targetId = todayId, kicker = "Séance du jour";
    if (!todayId) {
      for (var i = 1; i <= 7; i++) { var n = DAY_OF_WEEK[(dow + i) % 7]; if (n) { targetId = n; kicker = "Aujourd'hui : repos · prochaine séance " + WEEKDAYS[(dow + i) % 7]; break; } }
    }
    var day = SEQ_DAYS[targetId], code = day.label.split(" — ")[0];
    var doneToday = todayId && list.some(function (s) { return s.date === todayISO && String(s.seance || "").indexOf(code) === 0; });
    var kit = kitFor(day), name = userName();

    var bar = ""; for (var k = 1; k <= 4; k++) bar += "<i" + (k <= w ? " class='on'" : "") + "></i>";
    var days = "";
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var id = DAY_OF_WEEK[d], c = id ? SEQ_DAYS[id].label.split(" — ")[0] : null;
      var cls = "v2-day" + (!id ? " rest" : "") + (d === dow ? " today" : "") + (c && doneCodes.indexOf(c) >= 0 ? " done" : "");
      days += "<div class='" + cls + "'><span>" + SHORT[d] + "</span><b>" + (id ? (doneCodes.indexOf(c) >= 0 ? "✓ " : "") + c : "repos") + "</b></div>";
    });
    var others = "";
    Object.keys(SEQ_DAYS).forEach(function (id) {
      if (id === targetId) return;
      others += "<button class='v2-row' onclick=\"openPreview('" + id + "')\"><b>" + esc(SEQ_DAYS[id].label) + "</b><span>40 min</span></button>";
    });

    var st = KineProgress.state(), banner = "";
    if (st.reset) banner = "<div class='kf-note' style='margin-bottom:16px'><strong>Reprise en semaine 1.</strong> Plus d'une semaine sans séance : comme prévu par votre programme, on repart du début.</div>";
    else if (st.cycleDone) banner = "<div class='kf-note' style='margin-bottom:16px'><strong>Cycle de 4 semaines terminé.</strong> Parlez-en à votre kinésithérapeute pour la suite.</div>";
    box.innerHTML = banner +
      "<div class='v2-hello'><span>" + WEEKDAYS[dow] + "</span><strong>Bonjour" + (name ? " " + esc(name) : "") + "</strong></div>" +
      "<div class='v2-week'><div class='v2-week-top'><b>Semaine " + w + " sur 4" + (st.start ? " · jour " + Math.min(28, st.dayInCycle) : "") + "</b><span>" + doneWeek.length + " séance" + (doneWeek.length > 1 ? "s" : "") + " sur 5 faite" + (doneWeek.length > 1 ? "s" : "") + "</span></div>" +
        "<div class='today-bar'>" + bar + "</div></div>" +
      "<div class='v2-card'>" +
        "<div><div class='today-kicker'>" + esc(kicker) + "</div><div class='today-title'>" + esc(day.label) + "</div></div>" +
        "<div class='today-pills'><span>~40 min</span><span>" + day.exercises.length + " exercices</span><span>" +
          (kit.length ? esc(kit.map(function (x) { return x.replace(/^(une?|un) /, "").replace(" libre", ""); }).join(" · ")) : "Sans matériel") + "</span></div>" +
        (doneToday
          ? "<button class='today-go done' onclick=\"openPreview('" + targetId + "')\">✓ Faite aujourd'hui · la refaire</button>"
          : "<button class='today-go' onclick=\"openPreview('" + targetId + "')\">▶ " + (todayId ? "Commencer la séance" : "Voir la prochaine séance") + "</button>") +
        "<button class='v2-link' style='margin-top:-6px' onclick=\"openExplain('" + targetId + "')\">Voir les explications des exercices</button>" +
      "</div>" +
      "<div class='v2-h'>Cette semaine</div><div class='v2-days'>" + days + "</div>" +
      "<div class='v2-h'>Faire une autre séance</div><div class='v2-other'>" + others + "</div>";
  }
  window.renderToday = renderToday;

  /* ════════ APERÇU AVANT DE COMMENCER ════════ */
  window.openPreview = function (dayId) {
    var day = SEQ_DAYS[dayId], sheet = $("seq-preview"), kit = kitFor(day), nS = seriesFor();
    var rest = 0; day.exercises.forEach(function (e) { if (e.phase === "work") rest = Math.max(rest, e.restAfter || 0); });
    var html = "<div class='kf-sheet-body'>" +
      "<button class='kf-back' onclick='closePreview()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + esc(day.label) + "</div>" +
      "<div class='kf-sub'>Semaine " + KineProgress.week() + " · ~40 min · " + (day.circuit ? "circuit de " + nS + " tours : 40 s par exercice, 20 s de transition, 2 min entre les tours" : nS + " séries par exercice") + "</div></div>" +
      "<div class='kf-note'>" + esc(KineProgress.plan().reason) + "</div>" +
      (kit.length ? "<div class='kf-kit'><strong>À préparer :</strong> " + esc(kit.join(", ")) + "</div>" : "") +
      "<button class='v2-row' onclick=\"closePreview();openExplain('" + dayId + "')\"><b>Lire les explications des exercices</b><span>›</span></button>";
    var lastPhase = null;
    day.exercises.forEach(function (ex, i) {
      if (ex.phase !== lastPhase) { var ph = PHASES[ex.phase] || [ex.phase, "var(--text2)"]; html += "<div class='kf-phase' style='color:" + ph[1] + "'>" + ph[0] + "</div>"; lastPhase = ex.phase; }
      var meta = ex.phase === "work" ? (day.circuit ? KineProgress.repsLabel(ex) + " à chaque tour" : nS + " × " + KineProgress.repsLabel(ex)) : ex.repsLabel;
      var t = tempoText(ex), v = KineProgress.variant(dayId, i);
      if (v) t = (t ? t + "\n" : "") + "Variante : " + v;
      var img = window.KineAvatar && KineAvatar.snapshot ? KineAvatar.snapshot(ex.name, 112) : null;
      var thumb = img ? "<div class='kf-ex-n thumb'><img alt='' src='" + img + "'></div>" : "<div class='kf-ex-n'>" + (i + 1) + "</div>";
      html += "<div class='kf-ex' role='button' tabindex='0' onclick=\"closePreview();openExplain('" + dayId + "'," + i + ")\">" + thumb + "<div style='flex:1'><div class='kf-ex-name'>" + esc(ex.name) + "</div>" +
              "<div class='kf-ex-meta'>" + esc(meta) + (t ? "<br>" + esc(t).replace(/\n/g, "<br>") : "") + "</div></div><span class='kf-chev' aria-hidden='true'>›</span></div>";
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
  function guideState(st) { var g = $("rep-guide"); if (g) g.setAttribute("data-state", st); }
  window.rgSyncSound = function () {
    var b = $("rg2-sound"); if (b) b.classList.toggle("off", typeof seqSoundOn !== "undefined" && !seqSoundOn);
  };
  var baseStart = window.repGuideStart;
  window.repGuideStart = repGuideStart = function () { guideState("running"); return baseStart.apply(this, arguments); };
  var baseFinish = window.finishSerie;
  window.finishSerie = finishSerie = function () { guideState("done"); return baseFinish.apply(this, arguments); };

  var baseLaunch = window.launchRepGuide;
  window.launchRepGuide = launchRepGuide = function (exName, repsLabel, serie, totalSeries) {
    baseLaunch.apply(this, arguments);
    guideState("ready");
    rgSyncSound();
    $("rg-main-btn").textContent = "▶ Démarrer";
    var inSeq = $("seq-overlay").classList.contains("open") && typeof SEQ_DAYS !== "undefined";
    var ex = inSeq ? SEQ_DAYS[seqCurrentDay].exercises[seqExIdx] : null;
    if (inSeq) {
      var nEx = SEQ_DAYS[seqCurrentDay].exercises.length;
      $("rg-serie-info").textContent = SEQ_DAYS[seqCurrentDay].circuit
        ? "Tour " + serie + " sur " + totalSeries + " · Exercice " + (seqExIdx + 1) + " sur " + nEx
        : "Exercice " + (seqExIdx + 1) + " sur " + nEx + " · Série " + serie + " sur " + totalSeries;
      $("rg2-prog-fill").style.width = Math.round(((seqExIdx + (serie - 1) / totalSeries) / nEx) * 100) + "%";
    } else {
      $("rg-serie-info").textContent = "Série " + serie + " sur " + totalSeries;
      $("rg2-prog-fill").style.width = Math.round(((serie - 1) / totalSeries) * 100) + "%";
    }
    var v = ex ? KineProgress.variant(seqCurrentDay, seqExIdx) : null;
    var cue = CUES[exName] || (ex && ex.desc) || "";
    var cueEl = $("rg2-cue");
    cueEl.classList.remove("open");
    cueEl.innerHTML = (v ? "<strong>Variante de la semaine :</strong> " + esc(v) + "<br>" : "") + esc(cue) +
      (ex && ex.desc && CUES[exName] ? "<span class='cue-more'>Consigne complète ›</span><span class='cue-full'>" + esc(ex.desc) + (ex.tip ? "<br><strong>Conseil :</strong> " + esc(ex.tip) : "") + "</span>" : "");
    cueEl.onclick = function () { cueEl.classList.toggle("open"); };
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
    var meta = ex.phase === "work" ? (day.circuit ? "Tour " : "Série ") + nx.serie + " sur " + seqTotalSeries + " · " + KineProgress.repsLabel(ex) : ex.repsLabel;
    info.innerHTML = "<div class='seq-next-k'>Ensuite</div><div class='seq-next-name'>" + esc(ex.name) + "</div><div class='seq-next-meta'>" + esc(meta) + "</div>";
    box.appendChild(demo); box.appendChild(info);
    body.appendChild(box);
    if (!(window.KineAvatar && KineAvatar.supports(ex.name) && KineAvatar.show(demo, ex.name))) { demo.remove(); return; }
    // Démonstration en boucle, au tempo de l'exercice
    var inf = KineAvatar.info(ex.name, KineProgress.repsLabel(ex), week()), cycle = 0;
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

    var borgBtns = ""; for (var b = 1; b <= 5; b++) borgBtns += "<button data-borg='" + b + "' aria-label='Effort " + b + " sur 5, " + BORG[b][0] + "'>" + b + "</button>";
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
    var d0 = new Date(), localDate = d0.getFullYear() + "-" + ("0" + (d0.getMonth() + 1)).slice(-2) + "-" + ("0" + d0.getDate()).slice(-2);
    var s = { id: Date.now(), date: localDate, seance: bilan.day.label, semaine: "S" + week(),
              borg: bilan.borg, completion: completion, douleur: bilan.pain, douleurs: bilan.pains, duree: bilan.duration,
              notes: notes.join(", "), ts: Date.now() };
    sessions.unshift(s);
    saveSessions();
    if (typeof renderAll === "function") renderAll();
    if (typeof checkBadges === "function") checkBadges();
    // Compteur collectif : chaque séance faite en entier avec l'appli, pour tout le monde, sans donnée personnelle
    if (/^100/.test(completion) && window.fbCountSession) window.fbCountSession((bilan.day.label.match(/J\d/) || [""])[0]);
    if (window.fbUser && typeof postSessionToFeed === "function") postSessionToFeed(s);
    speak("Séance enregistrée. À bientôt !");
    $("seq-bilan").querySelector(".kf-sheet-body").innerHTML =
      "<div style='text-align:center;padding:40px 0;display:flex;flex-direction:column;gap:10px'>" +
      "<div style='color:var(--green);display:flex;justify-content:center'>" + (window.KFI ? KFI.check : "") + "</div><div class='kf-h1'>Séance enregistrée</div>" +
      "<div class='kf-sub'>Retrouvez-la dans votre suivi. Pensez à bien vous hydrater.</div></div>";
    $("kf-bilan-foot").innerHTML = "<button class='seq-btn-main' onclick=\"closeSeqBilan();showPage('home')\">Retour à l'accueil</button>";
  };
  window.closeSeqBilan = function () {
    $("seq-bilan").classList.remove("open");
    if (typeof closeSeq === "function") closeSeq();
  };

  /* ════════ EXPLICATIONS SANS LANCER LA SÉANCE ════════ */
  window.openExplain = function (dayId, idx) {
    if (typeof showPage === "function") showPage(dayId);
    setTimeout(function () {
      var el = idx != null ? $("ex-" + dayId + "-" + idx) : null;
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.add("kf-flash"); setTimeout(function () { el.classList.remove("kf-flash"); }, 1600); }
      else window.scrollTo(0, 0);
    }, 80);
  };

  // Démonstration animée d'un exercice, depuis sa fiche
  window.openDemo = function (dayId, idx) {
    var ex = SEQ_DAYS[dayId].exercises[idx], sheet = $("kf-demo");
    if (!sheet) { sheet = document.createElement("div"); sheet.id = "kf-demo"; sheet.className = "kf-sheet"; sheet.setAttribute("role", "dialog"); document.body.appendChild(sheet); }
    var t = tempoText(ex), v = KineProgress.variant(dayId, idx);
    sheet.innerHTML = "<div class='kf-sheet-body'>" +
      "<button class='kf-back' onclick='closeDemo()' aria-label='Fermer'>←</button>" +
      "<div><div class='kf-h1'>" + esc(ex.name) + "</div><div class='kf-sub'>" + esc(KineProgress.repsLabel(ex)) + (t ? " · " + esc(t) : "") + "</div></div>" +
      "<div class='v2-stage' style='min-height:340px'><div class='rg-phase-label up' id='kf-demo-label'>Démonstration</div><div id='kf-demo-stage' style='display:flex;justify-content:center;padding-top:30px'></div></div>" +
      "<div class='kf-note'>" + esc(ex.desc || "") + "</div>" +
      (v ? "<div class='kf-note'><strong>Variante de la semaine :</strong> " + esc(v) + "</div>" : "") +
      (ex.tip ? "<div class='kf-note'><strong>Conseil :</strong> " + esc(ex.tip) + "</div>" : "") +
      (ex.stop ? "<div class='kf-note' style='border-color:rgba(248,113,113,.45)'>" + esc(ex.stop) + "</div>" : "") +
      "</div><div class='kf-sheet-foot'><button class='seq-btn-secondary' onclick='closeDemo()'>Fermer</button></div>";
    sheet.classList.add("open");
    var stage = $("kf-demo-stage");
    if (!(window.KineAvatar && KineAvatar.show(stage, ex.name))) { stage.innerHTML = "<p class='kf-sub'>Démonstration bientôt disponible.</p>"; return; }
    var inf = KineAvatar.info(ex.name, KineProgress.repsLabel(ex), week()), cycle = 0;
    (function loop() {
      if (!stage.isConnected || !sheet.classList.contains("open")) return;
      cycle++;
      var st0 = KineAvatar.startOf(ex.name);
      var steps = inf.mode === "timed" && !KineAvatar.hasSteps(ex.name)
        ? [{ pose: "hold", dur: 2, label: "Position tenue" }, { pose: "hold", dur: 2.5, label: "Position tenue" }, { pose: st0, dur: 2, label: "Retour" }]
        : KineAvatar.plan(ex.name, cycle, inf, week()).steps, i = 0;
      (function next() {
        if (!stage.isConnected || !sheet.classList.contains("open")) return;
        if (i >= steps.length) { setTimeout(loop, 500); return; }
        var st = steps[i++]; KineAvatar.step(st);
        var lb = $("kf-demo-label"); if (lb) lb.textContent = st.label || "";
        setTimeout(next, st.dur * 1000);
      })();
    })();
  };
  window.closeDemo = function () {
    var sheet = $("kf-demo"); if (!sheet) return;
    sheet.classList.remove("open");
    if (window.KineAvatar) KineAvatar.hide();
  };

  // Boutons « Voir la démonstration » dans les fiches, et onglet Programme en cartes à ouvrir
  function enhancePages() {
    if (typeof SEQ_DAYS === "undefined") return;
    Object.keys(SEQ_DAYS).forEach(function (dayId) {
      SEQ_DAYS[dayId].exercises.forEach(function (ex, i) {
        var card = $("ex-" + dayId + "-" + i); if (!card || card.querySelector(".kf-demo-btn")) return;
        if (!(window.KineAvatar && KineAvatar.supports(ex.name))) return;
        var b = document.createElement("button");
        b.className = "kf-demo-btn"; b.type = "button";
        b.innerHTML = "<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M7 4.5v15l13-7.5z'/></svg> Voir la démonstration";
        b.onclick = function () { openDemo(dayId, i); };
        var anchor = card.querySelector(".ex-tip, .ex-stop, .timer-triggers");
        var main = card.querySelector(".ex-main") || card;
        if (anchor && anchor.parentNode === main) main.insertBefore(b, anchor); else main.appendChild(b);
      });
    });
    var guide = document.querySelector("#page-guide .content");
    if (guide && !guide.querySelector(".kf-days")) {
      var list = "<div class='v2-h' style='margin-top:4px'>Les séances et leurs exercices</div><div class='v2-other kf-days'>";
      Object.keys(SEQ_DAYS).forEach(function (id) {
        list += "<button class='v2-row' onclick=\"openExplain('" + id + "')\"><b>" + esc(SEQ_DAYS[id].label) + "</b><span>›</span></button>";
      });
      guide.insertAdjacentHTML("afterbegin", list + "</div>");
      // Chaque rubrique devient une carte à ouvrir
      guide.querySelectorAll(":scope > .sec-title").forEach(function (title, n) {
        var card = title.nextElementSibling;
        if (!card || !card.classList.contains("info-card")) return;
        var det = document.createElement("details"); det.className = "kf-acc";
        var sum = document.createElement("summary"); sum.textContent = title.textContent.trim();
        det.appendChild(sum); title.parentNode.insertBefore(det, title); det.appendChild(card); title.remove();
      });
      var notice = guide.querySelector(".notice-bar"); if (notice) guide.insertBefore(notice, guide.firstChild);
    }
  }

  /* ════════ Mise en route ════════ */
  function init() {
    var pain = $("rg-pain"); if (pain && pain.parentNode !== document.body) document.body.appendChild(pain);
    if (typeof renderAll === "function" && !renderAll.__today) {
      var base = renderAll;
      renderAll = function () { base.apply(this, arguments); renderToday(); };
      renderAll.__today = true;
    }
    renderToday();
    enhancePages();
  }
  if (document.readyState === "complete") init(); else document.addEventListener("DOMContentLoaded", init);
})();
