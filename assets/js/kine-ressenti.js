/* ═══════════════════════════════════════════════════════════════
   KinéForce — Ressenti du jour, calendrier et tendances (onglet Suivi)
   Inspiré des applis de suivi quotidien : 30 secondes par jour, séance ou non,
   puis l'appli montre au patient ce que ses propres données révèlent.
   Données dans le téléphone (localStorage « kf-checkin »), envoyées au kiné
   seulement par « Envoyer à mon kiné ».
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var KEY = "kf-checkin";
  var WD = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var WS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  var MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var BORG = ["", "très facile", "facile", "modéré", "difficile", "épuisant"];
  var ZONES = ["Cou", "Épaule", "Coude, poignet", "Haut du dos", "Bas du dos", "Hanche", "Genou", "Cheville, pied", "Autre"];
  var STIFF = ["Aucune", "Moins de 30 min", "Plus de 30 min"];
  var SLEEP = ["Bonne", "Moyenne", "Mauvaise"];
  var ACTS = ["Marche", "Vélo", "Natation", "Jardinage", "Sport", "Rien de plus"];
  var MIN_DAYS = 10;   // jours notés avant d'afficher une tendance

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var p = String(s).slice(0, 10).split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function dayLong(s) { var d = parse(s); return cap(WD[d.getDay()]) + " " + d.getDate() + " " + MO[d.getMonth()]; }
  function fmt1(v) { return (Math.round(v * 10) / 10).toString().replace(".", ","); }

  function all() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(map) { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) {} }
  function get(date) { return all()[date || iso()] || null; }
  function sessList() { try { return typeof sessions !== "undefined" && sessions ? sessions : JSON.parse(localStorage.getItem("kf-sessions") || "[]"); } catch (e) { return []; } }
  function pains() { try { return JSON.parse(localStorage.getItem("kf-pain") || "[]"); } catch (e) { return []; } }
  function state() { return window.KineProgress ? KineProgress.state() : { week: 1, start: null }; }
  function dayMap() { return window.KF ? KF.DAY_OF_WEEK : {}; }
  function sessOn(date) { return sessList().filter(function (s) { return String(s.date).slice(0, 10) === date; }); }
  function painOn(date) { return pains().filter(function (p) { return String(p.date).slice(0, 10) === date; }); }
  function plannedOn(date) { var id = dayMap()[parse(date).getDay()]; return id && typeof SEQ_DAYS !== "undefined" ? SEQ_DAYS[id] : null; }
  function hurtOn(date) {
    return painOn(date).some(function (p) { return +p.intensite >= 5; }) ||
      sessOn(date).some(function (s) { return +s.douleur >= 5; }) ||
      (get(date) && +get(date).pain >= 5);
  }

  // Séance prévue mais pas faite (seulement après la toute première séance, et jamais aujourd'hui)
  function firstDay() { var d = sessList().map(function (s) { return String(s.date).slice(0, 10); }).filter(Boolean).sort(); return d[0] || null; }
  function missed(date) { var f = firstDay(); return !!f && date >= f && date < iso() && !!plannedOn(date) && !sessOn(date).length; }
  // Régularité sur les 14 derniers jours : séances faites / séances prévues
  function adherence() {
    var f = firstDay(), today = iso(); if (!f) return null;
    var planned = 0, done = 0;
    for (var i = 13; i >= 0; i--) {
      var d = addDays(today, -i); if (d < f) continue;
      var did = sessOn(d).length > 0, pl = !!plannedOn(d);
      if (d === today && !did) continue;                 // la journée n'est pas finie
      if (pl) { planned++; if (did) done++; } else if (did) done++;
    }
    if (planned < 3) return null;
    return { done: Math.min(done, planned), planned: planned, pct: Math.min(100, Math.round(done / planned * 100)) };
  }
  function adherenceHtml() {
    var a = adherence(); if (!a) return "";
    var col = a.pct >= 80 ? "#00d4e6" : a.pct >= 50 ? "#f5a524" : "#f87171";
    return "<div class='kr-adh'><div class='kr-adh-t'><span>Régularité sur 14 jours</span><b style='color:" + col + "'>" + a.pct + " %</b></div>" +
      "<div class='kr-prog'><span style='width:" + a.pct + "%;background:" + col + "'></span></div>" +
      "<div class='kr-muted'>" + a.done + " séance" + (a.done > 1 ? "s" : "") + " faite" + (a.done > 1 ? "s" : "") + " sur " + a.planned + " prévue" + (a.planned > 1 ? "s" : "") + "." +
      (a.pct < 80 ? " Une séance manquée n'est pas grave : reprenez simplement à la prochaine." : "") + "</div></div>";
  }

  /* ════════ Ressenti du jour ════════ */
  var draft = null, draftDate = null;
  function sheet(id) {
    var el = $(id);
    if (!el) { el = document.createElement("div"); el.id = id; el.className = "kf-sheet kr-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function chips(name, opts, multi) {
    var v = draft[name];
    return "<div class='kr-chips' data-name='" + name + "' data-multi='" + (multi ? 1 : 0) + "'>" + opts.map(function (o, i) {
      var on = multi ? (v || []).indexOf(o) >= 0 : v === i;
      return "<button type='button' aria-pressed='" + on + "' data-v='" + (multi ? esc(o) : i) + "'>" + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  var SLEEP_ICONS = [
    "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'/></svg>",
    "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><path d='M5 12h14'/></svg>",
    "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><circle cx='12' cy='12' r='9'/><path d='M12 8v5M12 16.5h.01'/></svg>"
  ];
  function seg(name, opts, icons) {
    return "<div class='kr-seg' data-name='" + name + "'>" + opts.map(function (o, i) {
      return "<button type='button' aria-pressed='" + (draft[name] === i) + "' data-v='" + i + "'>" + (icons ? icons[i] : "") + "<span>" + esc(o) + "</span></button>";
    }).join("") + "</div>";
  }
  function scale(name, from, to, cls) {
    var h = "<div class='kr-scale " + (cls || "") + "' data-name='" + name + "'>";
    for (var i = from; i <= to; i++) h += "<button type='button' aria-pressed='" + (draft[name] === i) + "' data-v='" + i + "' aria-label='" + i + "'>" + i + "</button>";
    return h + "</div>";
  }
  function open(date) {
    draftDate = date || iso();
    var prev = get(draftDate);
    draft = prev ? JSON.parse(JSON.stringify(prev)) : { pain: null, zones: [], stiff: null, sleep: null, mood: null, acts: [], note: "" };
    var el = sheet("kr-checkin");
    el.setAttribute("aria-label", "Comment ça va aujourd'hui ?");
    el.innerHTML = "<div class='kf-sheet-body kr-body'>" +
      "<div class='kr-top'><span class='kr-date'>" + esc(dayLong(draftDate)) + "</span><button class='kr-close' onclick='KineCheckin.close()'>Fermer</button></div>" +
      "<h2 class='kr-h'>" + (draftDate === iso() ? "Comment ça va aujourd'hui ?" : "Comment ça allait ce jour-là ?") + "</h2>" +
      "<div class='kr-q'><strong>Douleur en ce moment</strong>" + scale("pain", 0, 10, "pain") + "<div class='kr-ends'><span>Aucune</span><span>La pire imaginable</span></div></div>" +
      "<div class='kr-q' id='kr-zones'" + (draft.pain ? "" : " hidden") + "><strong>Où ?</strong>" + chips("zones", ZONES, true) + "</div>" +
      "<div class='kr-q'><strong>Raideur au réveil</strong>" + seg("stiff", STIFF) + "</div>" +
      "<div class='kr-q'><strong>Votre nuit</strong>" + seg("sleep", SLEEP, SLEEP_ICONS) + "</div>" +
      "<div class='kr-q'><strong>Moral</strong>" + scale("mood", 1, 5, "mood") + "<div class='kr-ends'><span>Très bas</span><span>Très bon</span></div></div>" +
      "<div class='kr-q'><strong>Autre activité aujourd'hui</strong>" + chips("acts", ACTS, true) + "</div>" +
      "<label class='kr-q'><strong>Une remarque ?</strong><textarea class='kf-text kr-note' id='kr-note' placeholder='Facultatif, envoyée à votre kiné avec votre suivi'>" + esc(draft.note || "") + "</textarea></label>" +
      "<p class='kr-msg' id='kr-msg' role='status'></p>" +
      "</div><div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineCheckin.save()'>Enregistrer</button></div>";
    el.classList.add("open");
    var body = el.querySelector(".kr-body"); if (body) body.scrollTop = 0;
    el.onclick = function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      var box = b.parentElement, name = box.dataset.name;
      if (box.dataset.multi === "1") {
        var v = b.dataset.v, arr = draft[name] || [];
        if (v === "Rien de plus") arr = arr.indexOf(v) >= 0 ? [] : [v];
        else { arr = arr.filter(function (x) { return x !== "Rien de plus"; }); arr = arr.indexOf(v) >= 0 ? arr.filter(function (x) { return x !== v; }) : arr.concat(v); }
        draft[name] = arr;
        Array.prototype.forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", arr.indexOf(c.dataset.v) >= 0); });
      } else {
        var n = +b.dataset.v; draft[name] = draft[name] === n ? null : n;
        Array.prototype.forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", +c.dataset.v === draft[name]); });
        if (name === "pain") { var z = $("kr-zones"); if (z) z.hidden = !draft.pain; }
      }
      $("kr-msg").textContent = "";
    };
  }
  function doSave() {
    draft.note = ($("kr-note") && $("kr-note").value.trim()) || "";
    if (draft.pain == null && draft.sleep == null && draft.mood == null && draft.stiff == null) {
      $("kr-msg").textContent = "Indiquez au moins votre douleur, votre nuit ou votre moral.";
      return;
    }
    if (!draft.pain) draft.zones = [];
    draft.at = Date.now();
    var map = all(); map[draftDate] = draft; save(map);
    close();
    refresh();
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
  }
  function close() { ["kr-checkin"].forEach(function (id) { var el = $(id); if (el) el.classList.remove("open"); }); }
  function refresh() {
    if (window.KineSuivi && KineSuivi.render) KineSuivi.render();   // badges, puis la mise en page par-dessus
    if (window.KineLayout && KineLayout.render) KineLayout.render();
  }

  /* ════════ Anneau du programme (28 jours) ════════ */
  function ring() {
    var st = state(), size = 250, cx = 125, cy = 125, R = 113, r0 = 96;
    var started = !!st.start, day = started ? Math.min(28, st.dayInCycle || 1) : 0;
    var defs = "<defs><linearGradient id='kr-g' x1='0' x2='1'><stop offset='0' stop-color='#00e5f5'/><stop offset='1' stop-color='#4f8ff7'/></linearGradient></defs>";
    var h = defs + "<circle cx='125' cy='125' r='" + r0 + "' fill='none' style='stroke:var(--kr-track)' stroke-width='10'/>";
    if (day > 0) {
      var a = Math.min(0.9999, day / 28) * 2 * Math.PI, x = cx + r0 * Math.sin(a), y = cy - r0 * Math.cos(a);
      h += "<path d='M125 " + (cy - r0) + " A" + r0 + " " + r0 + " 0 " + (a > Math.PI ? 1 : 0) + " 1 " + x.toFixed(1) + " " + y.toFixed(1) + "' fill='none' stroke='url(#kr-g)' stroke-width='10' stroke-linecap='round'/>";
    }
    for (var d = 1; d <= 28; d++) {
      var t = (d - 0.5) / 28 * 2 * Math.PI, px = cx + R * Math.sin(t), py = cy - R * Math.cos(t);
      var date = started ? addDays(st.start, d - 1) : null, past = started && d <= day;
      var done = date && sessOn(date).length, hurt = date && hurtOn(date), noted = date && get(date);
      var col = hurt ? "#f87171" : done ? "#00d4e6" : noted ? "var(--kr-noted)" : past ? "var(--kr-past)" : "var(--kr-future)";
      h += "<circle cx='" + px.toFixed(1) + "' cy='" + py.toFixed(1) + "' r='" + (done || hurt ? 6 : 4) + "' style='fill:" + col + "'/>";
      if (d === day) h += "<circle cx='" + px.toFixed(1) + "' cy='" + py.toFixed(1) + "' r='10' fill='none' style='stroke:var(--text)' stroke-width='2'/>";
    }
    var nx = nextSession(), centre;
    if (!started) centre = "<div class='kr-k'>Programme</div><div class='kr-big sm'>À venir</div><div class='kr-s'>28 jours, 4 semaines</div><div class='kr-n'>Il démarre à votre première séance.</div>";
    else if (st.cycleDone) centre = "<div class='kr-k'>Programme</div><div class='kr-big sm'>Terminé</div><div class='kr-s'>28 jours sur 28</div><div class='kr-n'>Parlez-en à votre kiné pour la suite.</div>";
    else centre = "<div class='kr-k'>Semaine " + st.week + "</div><div class='kr-big'>Jour " + day + "</div><div class='kr-s'>sur 28 jours</div>" + (nx ? "<div class='kr-n'>" + esc(nx) + "</div>" : "");
    return "<div class='kr-ring' role='img' aria-label='" + (started ? "Jour " + day + " sur 28 du programme" : "Programme pas encore commencé") + "'><svg viewBox='0 0 250 250' width='" + size + "' height='" + size + "'>" + h + "</svg><div class='kr-c'>" + centre + "</div></div>" +
      "<div class='kr-legend'><span><i style='background:#00d4e6'></i>Séance faite</span><span><i style='background:#f87171'></i>Douleur</span><span><i style='background:var(--kr-noted)'></i>Ressenti noté</span></div>";
  }
  function nextSession() {
    var map = dayMap(), today = iso(), doneToday = sessOn(today).length;
    for (var i = doneToday ? 1 : 0; i <= 7; i++) {
      var date = addDays(today, i), id = map[parse(date).getDay()];
      if (id && typeof SEQ_DAYS !== "undefined") {
        var nm = (SEQ_DAYS[id].label.split(" — ")[1] || "").toLowerCase();
        return (i === 0 ? "Séance aujourd'hui : " : i === 1 ? "Prochaine séance demain : " : "Prochaine séance " + WD[parse(date).getDay()] + " : ") + nm;
      }
    }
    return "";
  }

  /* ════════ Bouton du jour et semaine ════════ */
  var PLUS = "<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' aria-hidden='true'><path d='M12 5v14M5 12h14'/></svg>";
  var CHECK = "<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg>";
  function cta() {
    var c = get(iso());
    if (!c) return "<button class='kr-cta' onclick='KineCheckin.open()'>" + PLUS + "<span>Comment ça va aujourd'hui ?<small>30 secondes : douleur, sommeil, moral</small></span></button>";
    var bits = [];
    if (c.pain != null) bits.push("douleur " + c.pain + "/10");
    if (c.sleep != null) bits.push("nuit " + SLEEP[c.sleep].toLowerCase());
    if (c.mood != null) bits.push("moral " + c.mood + "/5");
    return "<button class='kr-cta done' onclick='KineCheckin.open()'>" + CHECK + "<span>Ressenti noté aujourd'hui<small>" + esc(bits.join(", ")) + ". Toucher pour modifier</small></span></button>";
  }
  function week() {
    var today = iso(), d0 = parse(today); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    var h = "<div class='kr-week'>";
    for (var i = 0; i < 7; i++) {
      var date = iso(new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i, 12)), dd = parse(date);
      var done = sessOn(date).length, plan = !done && plannedOn(date) && date >= today, hurt = hurtOn(date), noted = get(date), miss = missed(date);
      h += "<button type='button' onclick=\"KineCheckin.calendar('" + date + "')\" aria-label='" + esc(dayLong(date)) + (miss ? ", séance manquée" : "") + "'><span>" + WS[dd.getDay()] + "</span><b class='" + (done ? "done" : plan ? "plan" : miss ? "miss" : "") + (date === today ? " today" : "") + "'>" + dd.getDate() + "</b><em>" +
        (hurt ? "<i style='background:#f87171'></i>" : "") + (noted ? "<i style='background:var(--kr-noted)'></i>" : "") + "</em></button>";
    }
    return h + "</div>" + adherenceHtml();
  }

  /* ════════ Tendances : ce que montrent les données du patient ════════ */
  function insights() {
    var map = all(), days = Object.keys(map).sort(), withPain = days.filter(function (d) { return map[d].pain != null; });
    if (withPain.length < MIN_DAYS) {
      var left = MIN_DAYS - withPain.length;
      return "<div class='kr-card'><div class='kr-lab'>" + TREND + "Vos tendances</div>" +
        "<div class='kr-ins sm'>Notez votre ressenti encore " + left + " jour" + (left > 1 ? "s" : "") + " pour découvrir ce que vos données montrent.</div>" +
        "<div class='kr-prog'><span style='width:" + Math.round(withPain.length / MIN_DAYS * 100) + "%'></span></div>" +
        "<div class='kr-muted'>Par exemple : votre douleur est-elle plus basse les lendemains de séance ? Votre sommeil joue-t-il sur la douleur ?</div></div>";
    }
    var recent = withPain.slice(-28), cards = [];
    // 1. Lendemains de séance
    var after = [], other = [];
    recent.forEach(function (d) { (sessOn(addDays(d, -1)).length ? after : other).push(+map[d].pain); });
    if (after.length >= 3 && other.length >= 3) {
      var a = avg(after), o = avg(other), diff = o - a;
      var title = diff >= 1 ? "Votre douleur est plus basse les lendemains de séance."
        : diff <= -1 ? "Votre douleur est un peu plus haute les lendemains de séance."
        : "Les séances ne changent pas votre douleur du lendemain.";
      var note = diff <= -1 ? " Une légère hausse peut être normale au début ; si elle dure ou dépasse 5 sur 10, parlez-en à votre kiné." : "";
      cards.push("<div class='kr-card'><div class='kr-lab'>" + TREND + "Ce que montrent vos données</div><div class='kr-ins'>" + title + "</div>" +
        bars([[a, "après séance", "#00d4e6"], [o, "autres jours", "#3a4a5e"]]) +
        "<div class='kr-muted'>Douleur moyenne sur 10, d'après vos " + recent.length + " derniers jours notés." + note + "</div></div>");
    }
    // 2. Sommeil et douleur (la nuit notée est celle qui précède)
    var bad = [], good = [];
    recent.forEach(function (d) { var s = map[d].sleep; if (s === 2) bad.push(+map[d].pain); else if (s === 0) good.push(+map[d].pain); });
    if (bad.length >= 3 && good.length >= 3) {
      var b = avg(bad), g = avg(good), dd = b - g;
      if (Math.abs(dd) >= 1) cards.push("<div class='kr-card'><div class='kr-lab mute'>Sommeil et douleur</div><div class='kr-ins sm'>" +
        (dd > 0 ? "Après une mauvaise nuit, votre douleur est plus haute de " + fmt1(dd) + " point" + (dd >= 2 ? "s" : "") + " en moyenne."
                : "Votre douleur ne semble pas dépendre de votre nuit.") + "</div>" +
        bars([[g, "bonne nuit", "#6fb0ff"], [b, "mauvaise nuit", "#3a4a5e"]]) + "</div>");
    }
    // 3. Évolution : 7 derniers jours notés contre les 7 précédents
    if (withPain.length >= 14) {
      var last7 = withPain.slice(-7).map(function (d) { return +map[d].pain; }), prev7 = withPain.slice(-14, -7).map(function (d) { return +map[d].pain; });
      var e = avg(prev7) - avg(last7);
      if (Math.abs(e) >= 0.8) cards.push("<div class='kr-card'><div class='kr-lab mute'>Évolution</div><div class='kr-ins sm'>" +
        (e > 0 ? "Votre douleur a baissé de " + fmt1(e) + " point" + (e >= 2 ? "s" : "") + " par rapport à la semaine d'avant."
               : "Votre douleur a augmenté de " + fmt1(-e) + " point" + (-e >= 2 ? "s" : "") + " par rapport à la semaine d'avant. Si ça continue, parlez-en à votre kiné.") + "</div></div>");
    }
    if (!cards.length) cards.push("<div class='kr-card'><div class='kr-lab'>" + TREND + "Vos tendances</div><div class='kr-ins sm'>Pas de tendance nette pour l'instant. Continuez à noter votre ressenti, les constats apparaîtront ici.</div></div>");
    return cards.join("");
  }
  var TREND = "<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 17l6-6 4 4 8-8'/><path d='M15 7h6v6'/></svg>";
  function avg(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function bars(items) {
    var max = Math.max(10 * 0.6, Math.max.apply(null, items.map(function (x) { return x[0]; })));
    return "<div class='kr-bars'>" + items.map(function (x) {
      return "<div><span style='height:" + Math.max(6, Math.round(x[0] / max * 60)) + "px;background:" + x[2] + "'></span><b>" + fmt1(x[0]) + "</b><small>" + x[1] + "</small></div>";
    }).join("") + "</div>";
  }

  /* ════════ Calendrier ════════ */
  var calMonth = null, calSel = null;
  function calendar(date) {
    calSel = date || calSel || iso();
    var d = parse(calSel); if (!calMonth || date) calMonth = new Date(d.getFullYear(), d.getMonth(), 1, 12);
    var el = sheet("kr-cal"); el.setAttribute("aria-label", "Calendrier");
    var y = calMonth.getFullYear(), m = calMonth.getMonth(), first = new Date(y, m, 1, 12), lead = (first.getDay() + 6) % 7;
    var today = iso(), h = "<div class='kr-cal'>" + ["L", "M", "M", "J", "V", "S", "D"].map(function (x) { return "<span class='h'>" + x + "</span>"; }).join("");
    for (var i = 0; i < lead; i++) h += "<span></span>";
    var n = new Date(y, m + 1, 0).getDate();
    for (var k = 1; k <= n; k++) {
      var ds = iso(new Date(y, m, k, 12)), done = sessOn(ds).length, plan = !done && ds >= today && plannedOn(ds), hurt = hurtOn(ds), noted = get(ds), miss = missed(ds);
      h += "<button type='button' class='d" + (done ? " done" : plan ? " plan" : miss ? " miss" : "") + (ds === calSel ? " sel" : "") + (ds === today ? " today" : "") + "' onclick=\"KineCheckin.calendar('" + ds + "')\">" + k +
        (hurt ? "<i style='background:#f87171'></i>" : noted ? "<i style='background:var(--kr-noted)'></i>" : "") + "</button>";
    }
    h += "</div>";
    el.innerHTML = "<div class='kf-sheet-body kr-body'>" +
      "<div class='kr-top'><button class='kf-back' onclick='KineCheckin.closeCal()' aria-label='Fermer'>←</button></div>" +
      "<h2 class='kr-h'>Calendrier</h2>" +
      "<div class='kr-mhead'><button onclick='KineCheckin.month(-1)' aria-label='Mois précédent'>‹</button><span>" + cap(MO[m]) + " " + y + "</span><button onclick='KineCheckin.month(1)' aria-label='Mois suivant'>›</button></div>" +
      h +
      "" + adherenceHtml() + "<div class='kr-legend wrap'><span><i style='background:#00d4e6'></i>Séance faite</span><span><i class='dash'></i>Prévue</span><span><i style='background:#f5a524'></i>Manquée</span><span><i style='background:#f87171'></i>Douleur 5 et plus</span><span><i style='background:var(--kr-noted)'></i>Ressenti noté</span></div>" +
      detail(calSel) + "</div>";
    el.classList.add("open");
  }
  function detail(ds) {
    var ss = sessOn(ds), pp = painOn(ds), c = get(ds), plan = plannedOn(ds), h = "<div class='kr-card kr-det'><div class='kr-dt'>" + esc(dayLong(ds)) + "</div>";
    if (ss.length) ss.forEach(function (s) {
      var kv = [];
      if (s.duree) kv.push(s.duree + " min");
      if (s.completion) kv.push(String(s.completion).split(" — ")[0] + " réalisé");
      if (s.borg) kv.push("Effort " + s.borg + ", " + BORG[s.borg]);
      if (s.douleur != null && s.douleur !== "") kv.push((+s.douleur >= 5 ? "!" : "") + "Douleur après " + s.douleur + "/10");
      h += "<div class='kr-lab cy'>Séance</div><div class='kr-st'>" + esc(String(s.seance || "Séance").replace(" — ", " ")) + "</div>" + kv0(kv);
    });
    pp.forEach(function (p) { h += kv0(["!" + cap(p.zone) + " " + p.intensite + "/10 pendant « " + p.exercice + " », " + p.action]); });
    if (missed(ds)) h += "<div class='kr-lab' style='color:#f5a524'>Séance manquée</div><div class='kr-st'>" + esc(plan.label.replace(" — ", " ")) + "</div>";
    if (!ss.length && plan && ds >= iso()) h += "<div class='kr-lab cy'>Prévue</div><div class='kr-st'>" + esc(plan.label.replace(" — ", " ")) + "</div>";
    if (c) {
      var kv = [];
      if (c.pain != null) kv.push((+c.pain >= 5 ? "!" : "") + "Douleur " + c.pain + "/10" + (c.zones && c.zones.length ? ", " + c.zones.join(", ").toLowerCase() : ""));
      if (c.sleep != null) kv.push("Nuit " + SLEEP[c.sleep].toLowerCase());
      if (c.mood != null) kv.push("Moral " + c.mood + "/5");
      if (c.stiff != null) kv.push("Raideur : " + STIFF[c.stiff].toLowerCase());
      (c.acts || []).forEach(function (a) { if (a !== "Rien de plus") kv.push(a); });
      h += "<div class='kr-lab mute'>Ressenti du jour</div>" + kv0(kv) + (c.note ? "<p class='kr-note-t'>« " + esc(c.note) + " »</p>" : "");
    }
    if (!ss.length && !c && !pp.length && !(plan && ds >= iso())) h += "<p class='kr-muted'>Rien de noté ce jour-là.</p>";
    if (ds <= iso()) h += "<button class='lx-link left' onclick=\"KineCheckin.closeCal();KineCheckin.open('" + ds + "')\">" + (c ? "Modifier le ressenti" : "Noter le ressenti de ce jour") + "</button>";
    return h + "</div>";
  }
  function kv0(arr) { return arr.length ? "<div class='kr-kv'>" + arr.map(function (x) { return x.charAt(0) === "!" ? "<span class='r'>" + esc(x.slice(1)) + "</span>" : "<span>" + esc(x) + "</span>"; }).join("") + "</div>" : ""; }

  /* ════════ Courbe douleur et effort (fenêtre) ════════ */
  function chartSheet() {
    var el = sheet("kr-chart"); el.setAttribute("aria-label", "Douleur et effort");
    var html = window.KineLayout && KineLayout.chart ? KineLayout.chart(sessList()) : "";
    el.innerHTML = "<div class='kf-sheet-body kr-body'><div class='kr-top'><button class='kf-back' onclick=\"document.getElementById('kr-chart').classList.remove('open')\" aria-label='Fermer'>←</button></div>" +
      "<h2 class='kr-h'>Douleur et effort</h2><p class='kr-muted'>Vos 6 dernières séances, d'après le bilan de fin de séance.</p><div class='lx-chart'>" + html + "</div></div>";
    el.classList.add("open");
  }

  /* ════════ Rappel sur l'accueil ════════ */
  function homeReminder() {
    if (get(iso())) return "";
    var h = new Date().getHours();
    return "<button class='kr-remind' onclick='KineCheckin.open()'>" + PLUS + "<span><b>" + (h < 12 ? "Bonjour" : h < 18 ? "Bonne après-midi" : "Bonsoir") + ", comment ça va aujourd'hui ?</b><small>Notez votre ressenti en 30 secondes</small></span></button>";
  }

  /* ════════ Résumé pour le kiné ════════ */
  function summaryLines(from) {
    var map = all(), days = Object.keys(map).filter(function (d) { return d >= from; }).sort();
    if (!days.length) return [];
    var L = ["", "Ressenti au quotidien (" + days.length + (days.length > 1 ? " jours notés" : " jour noté") + ") :"];
    days.forEach(function (d) {
      var c = map[d], b = [];
      if (c.pain != null) b.push("douleur " + c.pain + "/10" + (c.zones && c.zones.length ? " (" + c.zones.join(", ").toLowerCase() + ")" : ""));
      if (c.stiff != null) b.push("raideur " + STIFF[c.stiff].toLowerCase());
      if (c.sleep != null) b.push("nuit " + SLEEP[c.sleep].toLowerCase());
      if (c.mood != null) b.push("moral " + c.mood + "/5");
      var acts = (c.acts || []).filter(function (a) { return a !== "Rien de plus"; });
      if (acts.length) b.push(acts.join(", ").toLowerCase());
      var dd = parse(d);
      L.push("· " + ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."][dd.getDay()] + " " + ("0" + dd.getDate()).slice(-2) + "/" + ("0" + (dd.getMonth() + 1)).slice(-2) + " : " + b.join(", ") + (c.note ? ". « " + c.note + " »" : ""));
    });
    var pv = days.filter(function (d) { return map[d].pain != null; }).map(function (d) { return +map[d].pain; });
    if (pv.length >= 2) L.push("Douleur moyenne : " + fmt1(avg(pv)) + "/10 (min " + Math.min.apply(null, pv) + ", max " + Math.max.apply(null, pv) + ")");
    return L;
  }

  // Le constat le plus parlant, en une phrase, pour la mascotte
  function topInsight() {
    var map = all(), withPain = Object.keys(map).sort().filter(function (d) { return map[d].pain != null; });
    if (withPain.length < MIN_DAYS) return null;
    if (withPain.length >= 14) {
      var e = avg(withPain.slice(-14, -7).map(function (d) { return +map[d].pain; })) - avg(withPain.slice(-7).map(function (d) { return +map[d].pain; }));
      if (e >= 0.8) return { id: "baisse", good: true, text: "Ta douleur a baissé de " + fmt1(e) + " point" + (e >= 2 ? "s" : "") + " en une semaine. Bien joué, continue comme ça !" };
      if (e <= -1.5) return { id: "hausse", good: false, text: "Ta douleur a un peu augmenté cette semaine. Si ça continue, parles-en à ton kiné : il pourra adapter le programme." };
    }
    var recent = withPain.slice(-28), after = [], other = [];
    recent.forEach(function (d) { (sessOn(addDays(d, -1)).length ? after : other).push(+map[d].pain); });
    if (after.length >= 3 && other.length >= 3 && avg(other) - avg(after) >= 1)
      return { id: "lendemain", good: true, text: "Tu as remarqué ? Ta douleur est plus basse les lendemains de séance : " + fmt1(avg(after)) + " contre " + fmt1(avg(other)) + ". Bouger te fait du bien !" };
    var bad = [], good = [];
    recent.forEach(function (d) { var s = map[d].sleep; if (s === 2) bad.push(+map[d].pain); else if (s === 0) good.push(+map[d].pain); });
    if (bad.length >= 3 && good.length >= 3 && avg(bad) - avg(good) >= 1.5)
      return { id: "sommeil", good: false, text: "Après une mauvaise nuit, ta douleur monte. Soigner ton sommeil, c'est aussi soigner ta douleur." };
    return null;
  }

  window.KineCheckin = {
    topInsight: topInsight,
    all: all, get: get, open: open, save: doSave, close: close,
    ring: ring, cta: cta, week: week, adherence: adherence, insights: insights, homeReminder: homeReminder, summaryLines: summaryLines,
    calendar: calendar, closeCal: function () { var el = $("kr-cal"); if (el) el.classList.remove("open"); },
    month: function (n) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + n, 1, 12); var y = calMonth.getFullYear(), m = calMonth.getMonth(); var s = parse(calSel); if (s.getFullYear() !== y || s.getMonth() !== m) calSel = iso(calMonth); calendar(); },
    chart: chartSheet
  };
})();
