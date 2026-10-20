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

  /* ════════ Grand texte : pour les yeux fatigués ════════ */
  function bigOn() { try { return localStorage.getItem("kf-big") === "1"; } catch (e) { return false; } }
  function applyBig() { document.documentElement.classList.toggle("kf-big", bigOn()); }
  applyBig();
  function bigText() {
    try { localStorage.setItem("kf-big", bigOn() ? "0" : "1"); } catch (e) {}
    applyBig(); renderSuivi();
  }

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
    var kick, cta, lede = "", state;
    if (!ss.length && !todayId) {
      // Nouveau patient un jour sans séance prévue : il peut commencer tout de suite
      target = Object.keys(SEQ_DAYS)[0]; state = "first";
      kick = "Votre première séance"; cta = "Commencer";
    } else if (todayId && !doneToday) {
      state = "today"; kick = "Séance du jour, semaine " + w + " sur 4"; cta = "Commencer";
    } else if (doneToday) {
      state = "done"; kick = "Séance faite, bravo !";
      var nx = null; for (var j = 1; j <= 7; j++) { var m = map[(dow + j) % 7]; if (m) { nx = [m, WD[(dow + j) % 7]]; break; } }
      if (nx) { target = nx[0]; lede = "Prochaine séance " + nx[1]; }
      cta = "Voir la prochaine séance";
    } else {
      state = "rest"; kick = "Aujourd'hui, repos. Prochaine séance " + when; cta = "Préparer la séance";
    }
    // La semaine : un jour par pastille, coché quand la séance est faite
    var order = [1, 2, 3, 4, 5, 6, 0], days = "", mon0 = parse(mon);
    order.forEach(function (d, i) {
      var id = map[d], c = id ? codeOf(id) : null, done = c && doneCodes.indexOf(c) >= 0;
      var dd = new Date(mon0); dd.setDate(mon0.getDate() + i);
      days += "<div class='lu-day" + (!id ? " rest" : "") + (done ? " ok" : "") + (d === dow ? " now" : "") + "'>" + WS[d] + "<b>" + (done ? "✓" : dd.getDate()) + "</b><i>" + (c || "repos") + "</i></div>";
    });
    var banner = st.reset ? "<p class='lx-rule'>Plus d'une semaine sans séance : comme prévu par votre programme, on reprend en semaine 1.</p>"
               : st.cycleDone ? "<p class='lx-rule'>Cycle de 4 semaines terminé. Parlez-en à votre kinésithérapeute pour la suite.</p>"
               : st.week >= 2 && window.KineProgress && KineProgress.painHold && KineProgress.painHold() ? "<p class='lx-rule red'><b>Douleur de 5 sur 10 ou plus à plusieurs reprises.</b> Par prudence, on reste à 2 tours, sans augmenter la difficulté, jusqu'à ce que la douleur baisse.</p>" : "";
    var others = Object.keys(SEQ_DAYS).filter(function (id) { return id !== target; }).map(function (id) {
      return "<button class='lx-item' onclick=\"openPreview('" + id + "')\"><span class='lx-j'>" + codeOf(id) + "</span><span>" + esc(cap(nameOf(id))) + "</span><span class='lx-t'>" + minutes(id) + " min</span></button>";
    }).join("");
    var nWork = SEQ_DAYS[target].exercises.filter(function (e) { return e.phase === "work"; }).length;
    var h = now.getHours(), who = typeof currentUser !== "undefined" && currentUser && currentUser.name ? String(currentUser.name).split(" ")[0] : "";
    var hello = (h >= 18 || h < 4 ? "Bonsoir" : "Bonjour") + (who ? "<br>" + esc(cap(who)) : "");
    var xd = window.KineIdees && KineIdees.defineExpress ? KineIdees.defineExpress(target) : null;
    var ICAM = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' aria-hidden='true'><path d='M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><circle cx='12' cy='13' r='3.5'/></svg>";
    var IZAP = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' aria-hidden='true'><path d='M13 2 4 14h7l-1 8 9-12h-7z'/></svg>";
    box.innerHTML =
      "<div class='lu-top'><p class='lx-date'>" + cap(WD[dow]) + " " + now.getDate() + " " + MO[now.getMonth()] + "</p>" +
        "<button class='lu-me' onclick='handleAuthClick()' aria-label='" + (who ? "Mon compte" : "Connexion") + "'>" + (who ? esc(who.charAt(0).toUpperCase()) : "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><circle cx='12' cy='8' r='4'/><path d='M4 21a8 8 0 0 1 16 0'/></svg>") + "</button></div>" +
      "<h1 class='lu-hello'>" + hello + "</h1>" +
      "<div class='lu-days'>" + days + "</div>" + banner +
      "<div class='lu-slab lu-" + state + "'>" + yassHtml(state) +
        "<p class='lu-k'>" + esc(kick) + "</p>" +
        "<h2 class='lu-t'>" + esc(cap(nameOf(target))) + "</h2>" +
        "<p class='lu-m'>" + (lede ? esc(lede) + ". " : "") + nWork + " exercices, " + minutes(target) + " minutes, " + kitText(target) + "</p>" +
        "<button class='lx-cta lu-go' onclick=\"openPreview('" + target + "')\"><svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M7 4v16l13-8z'/></svg>" + esc(cta) + "</button>" +
        "<button class='lx-link lu-see' onclick=\"openExplain('" + target + "')\">Voir les exercices</button></div>" +
      "<div class='lu-duo'>" +
        (window.KineCamera ? "<button class='lu-blk lu-vid' id='lu-video' onclick='KineCamera.open()'><span class='lu-ic'>" + ICAM + "</span><b>Tester en vidéo</b><small>Yass regarde ton mouvement et te corrige</small></button>" : "") +
        (xd ? "<button class='lu-blk lu-exp' id='ki-express' onclick=\"KineIdees.express('" + target + "')\"><span class='lu-ic'>" + IZAP + "</span><b>" + (xd.minutes || 10) + " minutes</b><small>Séance express, pas le temps</small></button>" : "") +
      "</div>" +
      (window.KineTheme && KineTheme.homeHtml ? KineTheme.homeHtml() : "") +
      (window.KineCheckin ? KineCheckin.homeReminder() : "");
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
      line(eff, "#7B88FF", true, 2.5) + line(pain, "#FF5C73", false, 3) +
      (mi >= 0 && mx >= 5 ? "<circle cx='" + xs[mi] + "' cy='" + y(mx) + "' r='5' fill='#FF5C73'/>" : "") + labels + "</svg>" +
      "<div class='lx-legend'><span><i style='background:#FF5C73'></i>Douleur, sur 10</span><span><i style='background:#7B88FF'></i>Effort, sur 5</span></div>";
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
    var C = window.KineCheckin;
    var now = new Date();
    // Premier jour : au lieu d'un anneau gris et de cases vides, un accueil qui explique la suite
    var fresh = !ss.length, welcome = "";
    if (fresh) {
      var first = (dayMap()[now.getDay()]) || Object.keys(SEQ_DAYS)[0];
      var face = window.KineMascotte && KineMascotte.portrait ? KineMascotte.portrait() : null;
      welcome = "<div class='su-welcome'>" + (face ? "<img class='su-face' src='" + face + "' alt=''>" : "") +
        "<h2 class='su-wh'>Votre suivi commence ici</h2>" +
        "<ol class='su-steps'>" +
          "<li><b>1</b><span><strong>Faites votre première séance</strong>Yass vous guide, mouvement par mouvement.</span></li>" +
          "<li><b>2</b><span><strong>Notez votre ressenti</strong>30 secondes par jour : douleur, sommeil, moral.</span></li>" +
          "<li><b>3</b><span><strong>Voyez vos progrès</strong>Votre semaine, votre régularité et vos courbes s'affichent ici.</span></li>" +
        "</ol><button class='lx-cta' onclick=\"openPreview('" + first + "')\">Commencer ma première séance</button></div>";
    }
    var GEAR = "<button class='lu-gear' onclick='KineLumiere.settings()' aria-label='Réglages'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'/></svg></button>";
    var head = "<div class='lu-ph'><h1 class='lx-title'>Progrès</h1>" + (window.KineLumiere ? GEAR : "") + "</div>";
    box.innerHTML = head +
      (fresh ? welcome + (C ? C.cta() + C.week() : "")
             : kpis(cyc, wk) + (C ? C.cta() : "") + alert + weekBars(ss) +
               (window.KineIdees ? KineIdees.goalCard() : "") +
               "<button class='lx-send' onclick='KineSuivi.open(\"envoyer\")'>Envoyer mon bilan à mon kiné</button>" +
               (C ? C.week() : "")) +
      (fresh && window.KineIdees ? KineIdees.goalCard() : "") +
      (C ? C.insights() : "<div class='lx-chart'>" + chart(ss) + "</div>") +
      "<h2 class='lx-section'>Mon historique</h2><div class='kr-links'>" +
        "<button onclick='KineCheckin.calendar()'><span>Calendrier</span><span aria-hidden='true'>›</span></button>" +
        "<button onclick='KineCheckin.chart()'><span>Douleur et effort, la courbe</span><span aria-hidden='true'>›</span></button>" +
        "<button onclick='KineSuivi.open(\"historique\")'><span>Historique des séances</span><span aria-hidden='true'>›</span></button>" +
        "<button onclick='KineSuivi.open(\"douleurs\")'><span>Douleurs signalées</span><span aria-hidden='true'>›</span></button>" +
      "</div>" +
      (fresh ? "<button class='lx-send' onclick='KineSuivi.open(\"envoyer\")'>Envoyer mon bilan à mon kiné</button>" : "") +
      beforeAfter();
    // Les badges ne sont plus affichés
    ["badges-suivi", "badges-home"].forEach(function (id) {
      var b = $(id); if (!b) return;
      var t = b.previousElementSibling; if (t && /badge/i.test(t.textContent || "")) t.remove();
      b.remove();
    });
    var page = $("page-suivi"); if (page) page.classList.add("lx");
  }


  /* ════════ Progrès : trois chiffres et les séances par semaine ════════ */
  function kpis(cyc, wk) {
    var pts = list().filter(function (s) { return s.douleur != null && s.douleur !== ""; }).map(function (s) { return [s.date, +s.douleur]; }).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var third;
    if (pts.length >= 4) {
      var av = function (a) { return a.reduce(function (t, x) { return t + x[1]; }, 0) / a.length; };
      var d = Math.round(av(pts.slice(-2)) - av(pts.slice(0, 2)));
      third = "<div class='" + (d < 0 ? "good" : d > 0 ? "bad" : "") + "'><b>" + (d > 0 ? "+" + d : d < 0 ? "−" + (-d) : "0") + "</b><small>point" + (Math.abs(d) > 1 ? "s" : "") + " de douleur depuis le début</small></div>";
    } else if (pts.length) third = "<div><b>" + pts[pts.length - 1][1] + "<small style='display:inline;font-size:.9rem'>/10</small></b><small>douleur à la dernière séance</small></div>";
    else third = "<div><b>—</b><small>douleur, après votre bilan de séance</small></div>";
    return "<div class='lu-kpi'><div class='d'><b>" + cyc.length + "</b><small>séance" + (cyc.length > 1 ? "s" : "") + " faite" + (cyc.length > 1 ? "s" : "") + "</small></div>" +
      "<div><b>" + wk + "</b><small>cette semaine</small></div>" + third + "</div>";
  }
  function weekBars(ss) {
    var m0 = parse(monday()), cols = [], max = 1;
    for (var i = 3; i >= 0; i--) {
      var a = new Date(m0); a.setDate(m0.getDate() - 7 * i); var b = new Date(a); b.setDate(a.getDate() + 7);
      var A = iso(a), B = iso(b), n = ss.filter(function (s) { var d = String(s.date).slice(0, 10); return d >= A && d < B; }).length;
      max = Math.max(max, n); cols.push([i === 0 ? "cette sem." : a.getDate() + " " + ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][a.getMonth()], n, i === 0]);
    }
    return "<div class='lu-bars'><b>Mes séances par semaine</b><div class='lu-bars-in'>" + cols.map(function (c) {
      return "<div class='" + (c[2] ? "hi" : "") + "'><em>" + c[1] + "</em><i style='height:" + Math.max(5, Math.round(c[1] / Math.max(max, 3) * 100)) + "%'></i>" + c[0] + "</div>";
    }).join("") + "</div></div>";
  }

  /* ════════ Avant / maintenant : première semaine de suivi comparée aux 7 derniers jours ════════ */
  function beforeAfter() {
    var map = {}; try { map = JSON.parse(localStorage.getItem("kf-checkin") || "{}") || {}; } catch (e) {}
    var ss = list(), days = {};
    Object.keys(map).forEach(function (d) { var c = map[d]; days[d] = { pain: c.pain, mood: c.mood, sleep: c.sleep }; });
    ss.forEach(function (x) { var d = String(x.date).slice(0, 10); days[d] = days[d] || {}; if (days[d].pain == null && x.douleur != null && x.douleur !== "") days[d].pain = +x.douleur; if (x.borg) days[d].borg = +x.borg; });
    var keys = Object.keys(days).sort();
    var head = "<h2 class='lx-section'>Avant / maintenant</h2>";
    if (!keys.length) return head + "<p class='lx-muted'>Notez votre ressenti et faites vos séances : dans deux semaines, vous verrez ici ce qui a changé.</p>";
    var first = keys[0], last7 = iso(addD(new Date(), -6)), first7 = iso(addD(parse(first), 6));
    var A = keys.filter(function (d) { return d <= first7; }), B = keys.filter(function (d) { return d >= last7; });
    var spanDays = Math.round((Date.now() - parse(first).getTime()) / 86400000);
    if (spanDays < 13) {
      var left = 13 - spanDays;
      return head + "<p class='lx-muted'>Encore " + left + " jour" + (left > 1 ? "s" : "") + " de suivi et vous pourrez comparer votre première semaine avec la semaine en cours.</p>" +
        "<div class='ba-wait'><i style='width:" + Math.round(spanDays / 13 * 100) + "%'></i></div>";
    }
    var avg = function (arr, k, f) { var v = arr.map(function (d) { return days[d][k]; }).filter(function (x) { return x != null && x !== ""; }).map(f || Number); return v.length >= 2 ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null; };
    var good = function (s) { return +s === 0 ? 1 : 0; };   // nuit « bonne »
    var rows = [
      ["Douleur", avg(A, "pain"), avg(B, "pain"), "/10", -1, 1],
      ["Moral", avg(A, "mood"), avg(B, "mood"), "/5", 1, 1],
      ["Bonnes nuits", avg(A, "sleep", good), avg(B, "sleep", good), "%", 1, 100],
      ["Effort des séances", avg(A, "borg"), avg(B, "borg"), "/5", 0, 1]
    ].filter(function (r) { return r[1] != null && r[2] != null; });
    if (!rows.length) return head + "<p class='lx-muted'>Pas encore assez de données sur ces deux semaines. Notez votre ressenti quelques jours de plus.</p>";
    var f = function (v, m) { return m === 100 ? Math.round(v * 100) + " %" : (Math.round(v * 10) / 10).toString().replace(".", ","); };
    var html = rows.map(function (r) {
      var d = r[2] - r[1], tol = r[5] === 100 ? 0.1 : 0.3, better = r[4] === 0 ? null : (d * r[4] > tol ? true : d * r[4] < -tol ? false : null);
      var tag = better === true ? "<em class='ba-up'>mieux</em>" : better === false ? "<em class='ba-down'>moins bien</em>" : "<em class='ba-eq'>stable</em>";
      var max = r[5] === 100 ? 1 : r[3] === "/10" ? 10 : 5;
      return "<div class='ba-row'><div class='ba-h'><b>" + r[0] + "</b>" + tag + "</div>" +
        "<div class='ba-bars'><span class='ba-l'>1re sem.</span><i class='ba-bar a' style='width:" + Math.max(4, Math.round(r[1] / max * 100)) + "%'></i><span class='ba-v'>" + f(r[1], r[5]) + (r[5] === 100 ? "" : r[3]) + "</span></div>" +
        "<div class='ba-bars'><span class='ba-l'>7 derniers j.</span><i class='ba-bar b' style='width:" + Math.max(4, Math.round(r[2] / max * 100)) + "%'></i><span class='ba-v'>" + f(r[2], r[5]) + (r[5] === 100 ? "" : r[3]) + "</span></div></div>";
    }).join("");
    return head + "<p class='lx-muted'>Votre première semaine (à partir du " + parse(first).getDate() + " " + MO[parse(first).getMonth()] + ") comparée aux 7 derniers jours.</p><div class='ba'>" + html + "</div>";
  }
  function addD(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  /* ════════ Programme ════════ */
  function renderProg() {
    var box = $("prog-v2"); if (!box || typeof SEQ_DAYS === "undefined") return;
    var p = window.KineProgress ? KineProgress.plan() : { week: 1, reason: "" }, st = window.KineProgress ? KineProgress.state() : {};
    var day = st.start ? Math.min(28, st.dayInCycle || 1) : 0;
    var W = [["On apprend", "2 tours, on apprend la technique."], ["On ajoute", "3 tours si l'effort reste facile, sinon 2 répétitions de plus."], ["On renforce", "3 tours, renforcement."], ["On passe au cran au-dessus", "3 tours et variantes avancées."]];
    var weeks = W.map(function (t, i) {
      var n = i + 1, cls = n < p.week ? "ok" : n === p.week ? "now" : "";
      return "<div class='lu-wk " + cls + "'><span class='lu-wn'>" + (n < p.week ? "✓" : "S" + n) + "</span><b>" + t[0] + "</b><small>" + t[1] + "</small></div>";
    }).join("");
    var cur = W[p.week - 1] || W[0], miss = false;
    var rows = Object.keys(SEQ_DAYS).map(function (id) {
      var s = window.KineProgram && KineProgram.status ? KineProgram.status(id) : ["", ""], d = SEQ_DAYS[id];
      var work = d.exercises.filter(function (e) { return e.phase === "work"; }), nEx = work.length;
      var wn = work[0] && work[0].name, th = wn && PTH[wn];
      if (!th && wn) { try { th = window.KineAvatar && KineAvatar.supports(wn) ? KineAvatar.snapshot(wn, 160) : null; } catch (e) {} if (th) PTH[wn] = th; else miss = true; }
      var tag = s[1] === "done" ? "Faite" : s[1] === "today" ? "Aujourd'hui" : s[1] === "late" ? "À rattraper" : s[0];
      return "<button class='lu-ses " + (s[1] || "") + "' onclick=\"KineProgram.open('" + id + "')\">" +
        "<span class='lu-ses-im'>" + (th ? "<img src='" + th + "' alt=''>" : "") + "<i>" + codeOf(id) + "</i></span>" +
        "<span class='lu-ses-t'><b>" + esc(cap(nameOf(id))) + "</b><small>" + (d.circuit ? "Circuit" : nEx + " exercices") + " · " + minutes(id) + " min</small>" +
        (tag ? "<em>" + esc(tag) + "</em>" : "") + "</span><span class='lu-chev' aria-hidden='true'>›</span></button>";
    }).join("");
    box.innerHTML = (window.KineTheme ? KineTheme.bannerHtml() : "") +
      "<div class='lu-pslab'><p class='lu-k'>" + (st.start ? "Jour " + day + " sur 28" : "Le programme démarre à votre première séance") + "</p>" +
        "<h2 class='lu-t'>Semaine " + p.week + " sur 4</h2><p class='lu-m'>" + esc(cur[1]) + "</p>" +
        "<div class='lu-ptrack'>" + [1, 2, 3, 4].map(function (n) {
          var f = n < p.week ? 100 : n > p.week ? 0 : st.start ? Math.max(8, Math.round(((day - 1) % 7 + 1) / 7 * 100)) : 0;
          return "<span><i style='width:" + f + "%'></i></span>"; }).join("") + "</div>" +
        (p.reason ? "<p class='lu-why'>" + esc(p.reason) + "</p>" : "") + "</div>" +
      "<h2 class='lx-section'>Mes 4 semaines</h2><div class='lu-wks'>" + weeks + "</div>" +
      "<h2 class='lx-section'>Les " + Object.keys(SEQ_DAYS).length + " séances</h2><div class='lu-sess'>" + rows + "</div>" +
      "<div class='lu-pduo'>" +
        (window.KineCompose ? "<button onclick=\"showPage('mes');KineCompose.tab()\"><span class='lu-ic'>＋</span><b>Composer ma séance</b><small>Mes propres exercices</small></button>" : "") +
        "<button onclick='KineProgram.understand()'><span class='lu-ic'>?</span><b>Comprendre mon programme</b><small>Les règles, en clair</small></button></div>" +
      (window.KineCompose ? "<button class='kc-kine' onclick='KineCompose.kine()'>Espace kiné</button>" : "");
    var page = $("page-guide"); if (page) page.classList.add("lx");
    // l'avatar 3D se charge après l'écran : on redessine pour afficher les vignettes
    if (miss && progTry++ < 6) setTimeout(renderProg, 1500);
  }
  var PTH = {}, progTry = 0;

  // Séances composées par le patient (« Ma séance »)
  function mineHtml() {
    if (!window.KineCompose) return "";
    var q = function (s) { return JSON.stringify(s).replace(/'/g, "&#39;"); };
    var rows = KineCompose.saved().map(function (s) {
      var reds = window.KineBiblio ? s.ex.filter(function (n) { return KineBiblio.color(n) === 3; }).length : 0;
      return "<div class='lx-mine'><button class='lx-srow' onclick='KineCompose.start(" + q(s.id) + ")'><span class='lx-j'>★</span><span class='lx-n'>" + esc(s.name) +
        "<small>" + s.ex.length + " exercices" + (reds ? ", " + reds + " difficile" + (reds > 1 ? "s" : "") : "") + "</small></span></button>" +
        "<button class='kc-mini' aria-label='Modifier' onclick='KineCompose.open(" + q(s.id) + ")'>✎</button>" +
        "<button class='kc-mini' aria-label='Supprimer' onclick='KineCompose.remove(" + q(s.id) + ")'>✕</button></div>";
    }).join("");
    return "<h2 class='lx-section'>Mes séances</h2><div class='lx-list'>" + rows +
      "<button class='lx-srow' onclick='KineCompose.open()'><span class='lx-j'>＋</span><span class='lx-n'>Créer ma séance<small>Choisissez vos exercices, par couleur de difficulté</small></span></button></div>";
  }
  function libHtml() {
    if (!window.KineBiblio) return "";
    var n = KineBiblio.all().length;
    return "<h2 class='lx-section'>Bibliothèque</h2><div class='lx-list'><button class='lx-srow' onclick='KineBiblio.open(\"\")'><span class='lx-j'>" + n + "</span>" +
      "<span class='lx-n'>Bibliothèque d'exercices<small>Tous les exercices, classés par groupe musculaire</small></span><span aria-hidden='true'>›</span></button></div>";
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


  /* Yass sur la carte du jour : un geste animé (différent selon les jours et les ouvertures), et un autre à chaque toucher */
  var YG = { salut: [12, 239, ""], joie: [13, 244, "jump"], biceps: [10, 245, "pump"], etire: [12, 244, ""], pouce: [10, 247, "pump"] }, yLast = null;
  function yPick(state) {
    var k = Object.keys(YG).filter(function (x) { return x !== yLast && (state === "done" || x !== "joie" || Math.random() < 0.5); });
    if (state === "done" && yLast !== "joie") return "joie";
    return k[Math.floor(Math.random() * k.length)];
  }
  function yassHtml(state) {
    var g = yPick(state); yLast = g;
    return "<button type='button' class='lu-yass lu-ys' aria-label='Yass' onclick='KineLayout.yass(this)' data-g='" + g + "'></button>";
  }
  function yassPlay(el, g) {
    var d = YG[g]; if (!el || !d) return;
    el.setAttribute("data-g", g);
    el.style.cssText = "aspect-ratio:" + d[1] + "/300;background-image:url(assets/lumiere/yass-anim/" + g + ".webp);background-size:" + (d[0] * 100) + "% 100%;--n:" + (d[0] - 1);
    el.className = "lu-yass lu-ys"; void el.offsetWidth;
    var go = function () { el.classList.add("play"); if (d[2]) el.classList.add(d[2]); };
    // pendant l'écran d'ouverture, on attend qu'il se lève pour que le geste soit vu
    (function wait(n) { var sp = document.getElementById("kf-splash"); if (sp && sp.style.display !== "none" && n < 40) return setTimeout(function () { wait(n + 1); }, 150); go(); })(0);
  }
  function yassArm() { document.querySelectorAll(".lu-ys:not(.armed)").forEach(function (el) { el.classList.add("armed"); yassPlay(el, el.getAttribute("data-g")); }); }
  function yassTap(el) { var g = yPick("today"); yLast = g; yassPlay(el, g); try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
  function renderAllLx() { renderHome(); renderSuivi(); renderProg(); yassArm(); }
  window.KineLayout = { yass: yassTap, render: renderAllLx, chart: chart, bigText: bigText };
  function init() {
    try { arrangeGuide(); renderAllLx(); } catch (e) {}
    // la nouvelle interface est dessinée : on lève l'écran de démarrage
    requestAnimationFrame(function () { document.documentElement.classList.remove("kf-boot"); });
    if (typeof renderAll === "function" && !renderAll.__lx) {
      var base = renderAll;
      renderAll = function () { base.apply(this, arguments); renderAllLx(); };
      renderAll.__lx = true;
    }
  }
  if (document.readyState === "complete") init(); else document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 0); });
})();
