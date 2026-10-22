/* ═══════════ KinéForce — carnet de charges (mode salle de sport) ═══════════
   Pendant une séance en salle :
   - écran de l'exercice : la charge du jour (ou la charge de départ, fixée avec le kiné, à noter une fois) ;
   - repos entre les séries : on note la charge, les répétitions, les répétitions en réserve et la douleur ;
   - fin de séance : double progression. Haut de la fourchette à toutes les séries, douleur de 3 au plus :
     la charge monte d'un cran. Douleur de 6 ou plus : la charge baisse de 10 % et on en parle au kiné.
   Le carnet (historique et courbes) s'ouvre depuis le programme. Tout reste sur le téléphone. */
var KineSalle = (function () {
  "use strict";
  var LOG = "kf-salle-log", PLAN = "kf-salle-plan", CUR = "kf-salle-cur";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function fmt(kg) { return kg == null || isNaN(kg) ? "–" : String(Math.round(kg * 10) / 10).replace(".", ","); }
  function round(kg, step) { step = step || 0.5; return Math.max(0, Math.round(kg / step) * step); }
  function q(s) { return JSON.stringify(String(s)).replace(/'/g, "&#39;"); }

  // Unité : par haltère, par main, ou charge totale (machine, barre avec disques)
  function unit(name) {
    var d = window.KineAvatar && KineAvatar._def ? KineAvatar._def(name) : null, k = d && d.loadKind;
    if (k === "kettlebell" || /fermier/i.test(name)) return "par main";
    if (k === "dumbbell" || /haltère/i.test(name)) return "par haltère";
    return "";
  }
  function curEx() { try { var d = SEQ_DAYS[seqCurrentDay]; return d && d.exercises[seqExIdx]; } catch (e) { return null; } }
  function range(ex) { if (ex && ex.gymRange !== undefined) return ex.gymRange; var m = String(ex && ex.repsLabel || "").match(/(\d+)\s*à\s*(\d+)/); return m ? [+m[1], +m[2]] : null; }
  function plans() { return jget(PLAN, {}); }
  function logs() { return jget(LOG, {}); }
  function draft() {
    var c = jget(CUR, null), day = typeof seqCurrentDay !== "undefined" ? seqCurrentDay : null;
    if (!c || c.date !== today() || c.day !== day) c = { date: today(), day: day, ex: {} };
    return c;
  }
  function lastEntry(name) { var L = logs()[name]; return L && L.length ? L[L.length - 1] : null; }

  /* ════════ Progression (double progression) ════════ */
  function next(name, entry, rg, inc) {
    var sets = entry.sets.filter(Boolean); if (!sets.length) return null;
    var kg = sets[sets.length - 1].kg, pain = Math.max.apply(null, sets.map(function (s) { return +s.pain || 0; }));
    var rirs = sets.map(function (s) { return s.rir == null ? 2 : +s.rir; }), minRir = Math.min.apply(null, rirs);
    inc = inc || 2.5;
    if (pain >= 6) return { kg: round(kg * 0.9, inc >= 2 ? 1 : 0.5), why: "Douleur de " + pain + " sur 10 : charge baissée de 10 %. Parles-en à ton kiné.", d: -1 };
    if (pain >= 4) return { kg: kg, why: "Douleur à " + pain + " sur 10 : on garde la charge tant qu'elle ne redescend pas.", d: 0 };
    if (!rg) {   // marche du fermier : sans fourchette, on monte si les séries restaient faciles
      return minRir >= 2 && sets.length >= 3 ? { kg: kg + inc, why: "Toutes tes séries étaient confortables : +" + fmt(inc) + " kg.", d: 1 } : { kg: kg, why: "Même charge : tiens la distance en gardant le buste droit.", d: 0 };
    }
    var reps = sets.map(function (s) { return +s.reps || 0; }), low = reps.filter(function (r) { return r < rg[0]; }).length;
    if (sets.length >= 3 && reps.every(function (r) { return r >= rg[1]; }) && minRir >= 1)
      return { kg: kg + inc, why: rg[1] + " répétitions à toutes les séries : +" + fmt(inc) + " kg.", d: 1 };
    if (low >= 2 || (minRir === 0 && low >= 1))
      return { kg: round(Math.max(0, kg - inc), 0.5), why: "Moins de " + rg[0] + " répétitions : charge un peu trop lourde pour l'instant, −" + fmt(inc) + " kg.", d: -1 };
    return { kg: kg, why: "Même charge : vise une répétition de plus par série, jusqu'à " + rg[1] + ".", d: 0 };
  }

  /* ════════ Écran de l'exercice : la charge du jour ════════ */
  function stepper(id, val, step, onch) {
    return "<div class='ks-step'><button type='button' aria-label='Moins' onclick='KineSalle._bump(\"" + id + "\",-1)'>−</button>" +
      "<output id='" + id + "' data-step='" + step + "' data-cb='" + onch + "'>" + fmt(val) + "</output>" +
      "<button type='button' aria-label='Plus' onclick='KineSalle._bump(\"" + id + "\",1)'>+</button></div>";
  }
  function bump(id, dir) {
    var o = $(id); if (!o) return;
    var st = +o.getAttribute("data-step") || 1, v = parseFloat(String(o.textContent).replace(",", ".")) || 0;
    v = Math.max(0, Math.round((v + dir * st) * 10) / 10); o.textContent = fmt(v);
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    var cb = o.getAttribute("data-cb"); if (cb && API[cb]) API[cb](id, v);
  }
  function demoBtn(name) { return window.KineBiblio && KineBiblio.demo ? "<button class='ks-demo' onclick='KineBiblio.demo(" + q(name) + ")'>Voir le mouvement avec Yass</button>" : ""; }
  function loadBox(ex) {
    var P = plans()[ex.name], last = lastEntry(ex.name), u = unit(ex.name), rg = range(ex), inc = ex.gymInc || 2.5;
    var lastTxt = last ? "La dernière fois : " + fmt(last.sets.filter(Boolean).slice(-1)[0] ? last.sets.filter(Boolean).slice(-1)[0].kg : null) + " kg" +
      (rg ? " · " + last.sets.filter(Boolean).map(function (s) { return s.reps; }).join(", ") + " répétitions" : "") : "";
    var target = "Objectif : 3 séries" + (rg ? " de " + rg[0] + " à " + rg[1] + " répétitions" : "") + ", en gardant 2 répétitions en réserve.";
    if (!P) {
      return "<div class='ks-load ks-first' id='ks-load'><div class='ks-k'>Charge de départ</div>" +
        "<p>Note la charge fixée avec ton kiné. Pas encore fixée ? Prends une charge que tu peux soulever " + (rg ? rg[1] : 12) + " fois en gardant 2 répétitions en réserve.</p>" +
        "<div class='ks-row'>" + stepper("ks-start", inc >= 2 ? 20 : 4, inc >= 2 ? 2.5 : 1, "") + "<span class='ks-u'>kg" + (u ? " " + u : "") + "</span></div>" +
        "<button class='ks-ok' onclick='KineSalle._start(" + q(ex.name) + ")'>C'est ma charge, fixée avec mon kiné</button>" +
        "<div class='ks-target'>" + esc(target) + "</div></div>" + demoBtn(ex.name);
    }
    return "<div class='ks-load' id='ks-load'><div class='ks-k'>Charge du jour</div>" +
      "<div class='ks-kg'><b>" + fmt(P.kg) + "</b><span>kg" + (u ? " " + u : "") + "</span>" +
      (P.d > 0 ? "<em class='up'>+" + fmt(P.step || inc) + "</em>" : P.d < 0 ? "<em class='dn'>baissée</em>" : "") + "</div>" +
      (P.why ? "<div class='ks-why'>" + esc(P.why) + "</div>" : P.src === "kine" ? "<div class='ks-why'>Charge fixée avec ton kiné.</div>" : "") +
      "<div class='ks-target'>" + esc(target) + "</div>" + (lastTxt ? "<div class='ks-last'>" + esc(lastTxt) + "</div>" : "") +
      (P.kg >= (inc >= 2 ? 20 : 8) && rg ? "<div class='ks-warm'><b>Échauffement</b>10 répétitions à " + fmt(round(P.kg * 0.5, inc >= 2 ? 2.5 : 1)) + " kg, puis 5 à " + fmt(round(P.kg * 0.75, inc >= 2 ? 2.5 : 1)) + " kg.</div>" : "") + "</div>" + demoBtn(ex.name);
  }
  function start(name) {
    var o = $("ks-start"), v = o ? parseFloat(String(o.textContent).replace(",", ".")) : 0, P = plans();
    P[name] = { kg: v, src: "kine", d: 0, why: "" }; jset(PLAN, P);
    var b = $("ks-load"), ex = curEx(); if (b && ex) { var nx = b.nextElementSibling; if (nx && nx.classList.contains("ks-demo")) nx.remove(); b.outerHTML = loadBox(ex); }
    if (window.KineStats) KineStats.ev("p", "salle:depart");
  }

  /* ════════ Repos : noter la série ════════ */
  var pending = null;
  function chips(kind, n, cur, labels) {
    var h = "";
    for (var i = 0; i < n; i++) {
      var cls = kind === "pain" ? (i <= 3 ? " g" : i <= 5 ? " o" : " r") : "";
      h += "<button type='button' class='ks-chip" + cls + (i === cur ? " on" : "") + "' onclick='KineSalle._set(\"" + kind + "\"," + i + ",this)'>" + (labels ? labels[i] : i) + "</button>";
    }
    return "<div class='ks-chips ks-" + kind + "'>" + h + "</div>";
  }
  function setCard(p) {
    var c = draft(), s = (c.ex[p.name] || [])[p.set - 1] || {}, u = unit(p.name), rg = p.rg;
    var RIR = ["0<small>à fond</small>", "1", "2<small>idéal</small>", "3", "4+<small>facile</small>"];
    return "<div class='ks-set' id='ks-set'><div class='ks-sh'><div><div class='ks-k'>Série " + p.set + " sur " + p.of + " terminée</div><div class='ks-n'>" + esc(p.name) + "</div></div>" +
      "<span class='ks-pr' id='ks-pr'" + (isPR(p.name, s) ? "" : " hidden") + ">Nouveau record</span></div>" +
      "<div class='ks-grid'><div><label>Charge" + (u ? " " + u : "") + "</label><div class='ks-row'>" + stepper("ks-kg", s.kg, p.inc >= 2 ? 2.5 : 1, "_kg") + "<span class='ks-u'>kg</span></div></div>" +
      (rg ? "<div><label>Répétitions faites</label><div class='ks-row'>" + stepper("ks-reps", s.reps, 1, "_reps") + "</div></div>" : "") + "</div>" +
      "<label>Tu en aurais fait combien de plus ?</label>" + chips("rir", 5, s.rir == null ? 2 : s.rir, RIR) +
      "<label>Douleur pendant la série <small class='ks-leg'><i class='g'></i>0 à 3 ça va <i class='o'></i>4 à 5 on surveille <i class='r'></i>6 et plus on arrête</small></label>" + chips("pain", 11, s.pain || 0) +
      "<div class='ks-warn' id='ks-warn'" + ((s.pain || 0) >= 6 ? "" : " hidden") + "><b>Douleur forte.</b> Arrête cet exercice pour aujourd'hui et parles-en à ton kiné. La charge sera baissée la prochaine fois.</div>" +
      "<div class='ks-saved'>Enregistré automatiquement</div></div>";
  }
  function isPR(name, s) {
    if (!s || !(+s.kg > 0)) return false;
    var r = record(logs()[name]); return !!r && e1rm(s) > e1rm(r.s) + 0.01;
  }
  function saveSet(patch) {
    if (!pending) return;
    var c = draft(), L = c.ex[pending.name] = c.ex[pending.name] || [], s = L[pending.set - 1] = L[pending.set - 1] || {};
    for (var k in patch) s[k] = patch[k];
    jset(CUR, c);
    var b = $("ks-pr"); if (b) b.hidden = !isPR(pending.name, s);
  }
  function setVal(kind, v, el) {
    if (el) { var box = el.parentNode; Array.prototype.forEach.call(box.children, function (b) { b.classList.toggle("on", b === el); }); }
    var o = {}; o[kind] = v; saveSet(o);
    if (kind === "pain") { var w = $("ks-warn"); if (w) w.hidden = v < 6; }
  }
  function mark(name, setNo, of, ex) {
    var c = draft(), L = c.ex[name] = c.ex[name] || [], prev = L[setNo - 2], P = plans()[name], rg = range(ex);
    if (!L[setNo - 1]) L[setNo - 1] = { kg: prev ? prev.kg : P ? P.kg : null, reps: prev ? prev.reps : rg ? rg[1] : null, rir: 2, pain: 0 };
    jset(CUR, c);
    pending = { name: name, set: setNo, of: of, rg: rg, inc: ex.gymInc || 2.5, at: Date.now() };
  }

  /* ════════ Fin de séance : on enregistre et on prépare la prochaine ════════ */
  function commit() { return commitDraft(jget(CUR, null), true); }
  // Enregistre une séance (Yass ou journal) et prépare la charge de la prochaine fois. c.meta : fourchette et marche des exercices hors programme
  function commitDraft(c, clear) {
    if (!c || !c.ex) return [];
    var day = typeof SEQ_DAYS !== "undefined" && c.day && SEQ_DAYS[c.day], L = logs(), P = plans(), out = [];
    Object.keys(c.ex).forEach(function (name) {
      var sets = (c.ex[name] || []).filter(Boolean); if (!sets.length) return;
      var ex = day ? day.exercises.filter(function (e) { return e.name === name; })[0] : null, m = c.meta && c.meta[name], entry = { d: c.date, sets: sets };
      var rg = m ? m.r : range(ex), inc = m ? m.inc : ex && ex.gymInc;
      (L[name] = L[name] || []).push(entry); if (L[name].length > 60) L[name] = L[name].slice(-60);
      if (!sets.some(function (x) { return +x.kg > 0; }) && !P[name]) return;   // charge jamais notée : on la demandera la prochaine fois
      var nx = next(name, entry, rg, inc);
      if (nx) { P[name] = { kg: nx.kg, d: nx.d, why: nx.why, step: inc, src: "auto" }; out.push({ name: name, kg: nx.kg, d: nx.d, why: nx.why }); }
    });
    jset(LOG, L); jset(PLAN, P); if (clear) try { localStorage.removeItem(CUR); } catch (e) {}
    return out;
  }
  function summary(list) {
    if (!list.length) return "";
    return "<div class='ks-sum'><div class='ks-k'>Carnet de charges</div>" + list.map(function (r) {
      return "<div class='ks-sr'><span>" + esc(r.name) + "</span><b class='" + (r.d > 0 ? "up" : r.d < 0 ? "dn" : "") + "'>" + fmt(r.kg) + " kg" + (r.d > 0 ? " ↑" : r.d < 0 ? " ↓" : "") + "</b></div>";
    }).join("") + "<button class='ks-open' onclick='KineSalle.open()'>Ouvrir mon carnet</button></div>";
  }

  /* ════════ Le carnet ════════ */
  // Repères : meilleure série, charge maximale estimée (formule d'Epley), tonnage
  function best(sets) { var b = 0; (sets || []).forEach(function (x) { if (x && +x.kg > b) b = +x.kg; }); return b; }
  function e1rm(x) { var kg = +x.kg || 0, r = +x.reps || 0; return r ? kg * (1 + Math.min(r, 15) / 30) : kg; }
  function top(sets) { var t = null; (sets || []).forEach(function (x) { if (x && (!t || e1rm(x) > e1rm(t))) t = x; }); return t; }
  function tonnage(sets) { return (sets || []).reduce(function (a, x) { return a + (x ? (+x.kg || 0) * (+x.reps || 1) : 0); }, 0); }
  function record(h) { var r = null; (h || []).forEach(function (e) { var t = top(e.sets); if (t && (!r || e1rm(t) > e1rm(r.s))) r = { s: t, d: e.d }; }); return r; }
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  function dlabel(d, withDay) { var x = new Date(d + "T12:00:00"); return (withDay ? JOURS[x.getDay()] + " " : "") + x.getDate() + " " + MOIS[x.getMonth()]; }
  var ZONE = function (n) {
    if (/presse|leg |squat|fente|hip thrust|soulevé|abduction|adduction|kickback|mollet|traîneau|leg$/i.test(n)) return "bas";
    if (/pallof|lombaire|fermier|planche|gainage/i.test(n)) return "tronc";
    return "haut";
  };
  var ZL = { "": "Tout", bas: "Jambes", haut: "Haut du corps", tronc: "Tronc" }, zf = "", detail = null;
  function spark(list) {
    var v = list.map(function (e) { return best(e.sets); }).slice(-12);
    if (v.length < 2) return "<svg class='ks-spark' viewBox='0 0 140 40' aria-hidden='true'></svg>";
    var W = 140, H = 40, mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), r = mx - mn || 1;
    var pts = v.map(function (y, i) { return [Math.round(i / (v.length - 1) * (W - 8) + 4), Math.round(H - 6 - (y - mn) / r * (H - 12))]; });
    return "<svg class='ks-spark' viewBox='0 0 " + W + " " + H + "' aria-hidden='true'><polyline points='" + pts.map(function (p) { return p.join(","); }).join(" ") + "'/>" +
      "<circle cx='" + pts[pts.length - 1][0] + "' cy='" + pts[pts.length - 1][1] + "' r='3.2'/></svg>";
  }
  // Grande courbe d'un exercice : charge de la meilleure série à chaque séance, records marqués
  function chart(h) {
    var v = h.slice(-16), n = v.length; if (n < 2) return "<div class='ks-nochart'>La courbe apparaît après ta deuxième séance sur cet exercice.</div>";
    var W = 330, H = 170, l = 34, r = 12, t = 14, b = 26, ys = v.map(function (e) { return best(e.sets); });
    var mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys); if (mx === mn) { mx += 2.5; mn = Math.max(0, mn - 2.5); }
    var X = function (i) { return l + i / (n - 1) * (W - l - r); }, Yp = function (y) { return t + (1 - (y - mn) / (mx - mn)) * (H - t - b); };
    var pr = -1, run = 0; ys.forEach(function (y, i) { if (y > run) { run = y; pr = i; } });
    var area = "M" + X(0) + "," + (H - b) + " " + ys.map(function (y, i) { return "L" + X(i).toFixed(1) + "," + Yp(y).toFixed(1); }).join(" ") + " L" + X(n - 1) + "," + (H - b) + "Z";
    var line = ys.map(function (y, i) { return (i ? "L" : "M") + X(i).toFixed(1) + "," + Yp(y).toFixed(1); }).join(" ");
    return "<svg class='ks-chart' viewBox='0 0 " + W + " " + H + "' role='img' aria-label='Évolution de la charge'>" +
      "<defs><linearGradient id='ksg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='currentColor' stop-opacity='.28'/><stop offset='1' stop-color='currentColor' stop-opacity='0'/></linearGradient></defs>" +
      [mn, round((mn + mx) / 2, 0.5), mx].map(function (g) { return "<line x1='" + l + "' x2='" + (W - r) + "' y1='" + Yp(g) + "' y2='" + Yp(g) + "' class='ks-grid'/><text x='" + (l - 6) + "' y='" + (Yp(g) + 4) + "' text-anchor='end'>" + fmt(g) + "</text>"; }).join("") +
      "<path d='" + area + "' fill='url(#ksg)'/><path d='" + line + "' class='ks-line'/>" +
      ys.map(function (y, i) { return "<circle cx='" + X(i) + "' cy='" + Yp(y) + "' r='" + (i === pr ? 5.5 : 3.5) + "' class='" + (i === pr ? "pr" : "") + "'/>"; }).join("") +
      "<text x='" + l + "' y='" + (H - 6) + "'>" + dlabel(v[0].d) + "</text><text x='" + (W - r) + "' y='" + (H - 6) + "' text-anchor='end'>" + dlabel(v[n - 1].d) + "</text></svg>";
  }
  function names() {
    var L = logs(), P = plans(), all = {};
    Object.keys(P).forEach(function (n) { all[n] = 1; }); Object.keys(L).forEach(function (n) { all[n] = 1; });
    return Object.keys(all).sort(function (a, b) { var la = L[a] ? L[a][L[a].length - 1].d : "", lb = L[b] ? L[b][L[b].length - 1].d : ""; return lb < la ? -1 : lb > la ? 1 : a.localeCompare(b); });
  }
  function sheet() {
    var el = $("ks-sheet");
    if (!el) { el = document.createElement("div"); el.id = "ks-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Carnet de charges"); document.body.appendChild(el); }
    return el;
  }
  function weekStart() { var d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function open(name) {
    detail = typeof name === "string" ? name : null;
    if (detail) return openDetail(detail);
    var L = logs(), P = plans(), list = names(), f = window.KineTheme && KineTheme.gymFreq ? KineTheme.gymFreq() : 3, mon = weekStart(), sess = {}, wk = 0, prs = 0;
    list.forEach(function (n) {
      var run = 0; (L[n] || []).forEach(function (e) { sess[e.d] = 1; if (e.d >= mon) wk += tonnage(e.sets); var b = best(e.sets); if (run && b > run) prs++; run = Math.max(run, b); });
    });
    var nS = Object.keys(sess).length;
    var shown = list.filter(function (n) { return !zf || ZONE(n) === zf; });
    var rows = shown.map(function (n) {
      var h = L[n] || [], p = P[n], u = unit(n), first = h.length ? best(h[0].sets) : null, now = p ? p.kg : first, gain = first != null && now != null ? now - first : 0, rec = record(h);
      return "<button class='ks-row2' onclick='KineSalle.open(" + q(n) + ")'><span class='ks-r-t'><b>" + esc(n) + "</b>" +
        "<small>" + (rec ? "Record : " + fmt(rec.s.kg) + " kg" + (rec.s.reps ? " × " + rec.s.reps : "") : "Pas encore de série notée") + "</small></span>" +
        "<span class='ks-r-sp'>" + spark(h) + "</span>" +
        "<span class='ks-r-kg'><b>" + fmt(now) + "</b><small>kg" + (u ? " " + u.replace("par ", "/ ") : "") + "</small>" + (gain > 0 ? "<em>+" + fmt(gain) + "</em>" : "") + "</span><i aria-hidden='true'>›</i></button>";
    }).join("");
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSalle.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Carnet de charges</div><div class='kf-sub'>Touche un exercice pour voir ta courbe, tes records et corriger la charge avec ton kiné.</div></div>" +
      "<div class='ks-tiles'><div><b>" + nS + "</b><small>séance" + (nS > 1 ? "s" : "") + " notée" + (nS > 1 ? "s" : "") + "</small></div>" +
        "<div><b>" + (wk >= 1000 ? fmt(Math.round(wk / 100) / 10) + " t" : Math.round(wk) + " kg") + "</b><small>soulevés cette semaine</small></div>" +
        "<div><b>" + prs + "</b><small>record" + (prs > 1 ? "s" : "") + " battu" + (prs > 1 ? "s" : "") + "</small></div></div>" +
      "<div class='ks-freq'><span>Séances en salle par semaine</span><div>" + [2, 3, 4].map(function (n) { return "<button class='" + (f === n ? "on" : "") + "' onclick='KineSalle._freq(" + n + ")'>" + n + "</button>"; }).join("") + "</div></div>" +
      "<div class='ks-quick'><button onclick='KineSalle.log()'>Noter une séance</button><button onclick='KineSalle.mine()'>Mes séances salle</button></div>" +
      (list.length ? "<div class='ks-seg' role='tablist'>" + Object.keys(ZL).map(function (k) { return "<button role='tab' aria-selected='" + (zf === k) + "' class='" + (zf === k ? "on" : "") + "' onclick='KineSalle._zone(\"" + k + "\")'>" + ZL[k] + "</button>"; }).join("") + "</div>" : "") +
      (rows ? "<div class='ks-list'>" + rows + "</div>" : list.length ? "<div class='ks-empty'>Rien dans cette catégorie pour l'instant.</div>" :
        "<div class='ks-empty'><b>Ton carnet se remplit tout seul pendant tes séances en salle.</b><ol><li>Au début de chaque exercice, note une fois la charge fixée avec ton kiné.</li><li>Pendant le repos, deux touchers suffisent : charge et répétitions.</li><li>À la fin, la charge de la prochaine séance est prête.</li></ol></div>") +
      "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function openDetail(n) {
    var L = logs(), P = plans(), h = L[n] || [], p = P[n], u = unit(n), id = "ks-e" + Math.abs(hash(n)), rec = record(h), first = h.length ? best(h[0].sets) : null;
    var now = p ? p.kg : first, gain = first != null && now != null ? now - first : null, est = rec ? e1rm(rec.s) : 0;
    var hist = h.slice().reverse().map(function (e) {
      var pain = Math.max.apply(null, e.sets.filter(Boolean).map(function (x) { return +x.pain || 0; }).concat([0]));
      return "<div class='ks-hrow'><span class='ks-hd'>" + dlabel(e.d, true) + "</span><span class='ks-hs'>" + e.sets.filter(Boolean).map(function (x) {
        return "<i>" + fmt(x.kg) + (x.reps ? " × " + x.reps : " kg") + "</i>"; }).join("") + "</span>" +
        (pain >= 4 ? "<span class='ks-hp " + (pain >= 6 ? "r" : "o") + "'>douleur " + pain + "</span>" : "") + "</div>";
    }).join("");
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSalle.open(null)' aria-label='Retour au carnet'>←</button>" +
      "<div><div class='kf-h1'>" + esc(n) + "</div><div class='kf-sub'>" + (h.length ? h.length + " séance" + (h.length > 1 ? "s" : "") + " depuis le " + dlabel(h[0].d) : "Pas encore de série notée") + "</div></div>" +
      "<div class='ks-chartbox'>" + chart(h) + "</div>" +
      "<div class='ks-tiles'><div><b>" + fmt(first) + "</b><small>kg au départ</small></div><div><b>" + (gain != null ? (gain > 0 ? "+" : "") + fmt(gain) : "–") + "</b><small>kg gagnés</small></div>" +
        "<div><b>" + (est ? fmt(Math.round(est * 2) / 2) : "–") + "</b><small>max estimé sur 1 répétition</small></div></div>" +
      "<div class='ks-next'><div><span class='ks-k'>Prochaine séance</span>" + (p && p.why ? "<p>" + esc(p.why) + "</p>" : "<p>Ajuste-la avec ton kiné si besoin.</p>") + "</div>" +
        "<div class='ks-row'>" + stepper(id, now || 0, /haltère|fermier/i.test(n) ? 1 : 2.5, "_plan") + "<span class='ks-u'>kg" + (u ? " " + u : "") + "</span></div>" +
        "<input type='hidden' data-name='" + esc(n) + "' id='" + id + "-n'></div>" +
      (rec ? "<div class='ks-rec'><span>Record</span><b>" + fmt(rec.s.kg) + " kg" + (rec.s.reps ? " × " + rec.s.reps : "") + "</b><small>" + dlabel(rec.d) + "</small></div>" : "") +
      (hist ? "<h3 class='ks-h3'>Historique</h3><div class='ks-hist'>" + hist + "</div>" : "") +
      (window.KineBiblio ? "<button class='ks-demo' onclick='KineBiblio.demo(" + q(n) + ")'>Revoir le mouvement avec Yass</button>" : "") +
      (h.length ? "<button class='ks-del' id='ks-del' onclick='KineSalle._del(" + q(n) + ",this)'>Effacer l'historique de cet exercice</button>" : "") +
      "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function close() { detail = null; var el = $("ks-sheet"); if (el) el.classList.remove("open"); }


  /* ════════ Journal de séance : noter sa séance à la salle, sans lancer Yass ════════
     Une liste d'exercices, des lignes de séries (charge, répétitions, validé), un minuteur de repos qui part tout seul,
     et en fin de séance le même calcul de progression que pendant la séance guidée. Le brouillon survit si on quitte l'appli. */
  var JKEY = "kf-salle-journal", MINE = "kf-salle-mine";
  function gymOpts(name) {
    var o = window.KineTheme && KineTheme.gymOpts ? KineTheme.gymOpts(name) : null;
    if (o) return o;
    var f = window.KineBiblio && KineBiblio.find ? KineBiblio.find(name) : null, m = String(f && f.repsLabel || "").match(/(\d+)/), n = m ? +m[1] : 10;
    var sec = /seconde|mètre/i.test(String(f && f.repsLabel || ""));
    return { r: sec ? null : [Math.max(5, n - 2), n + 3], rest: 90, inc: /haltère|poulie|élévation|curl|rotation/i.test(name) ? 1 : 2.5 };
  }
  var PUSH = /développé|triceps|élévation latérale|pompe|dips|landmine/i, PULLR = /tirage|rowing|face pull|curl biceps|rotation (externe|interne)|pull-apart/i,
      LEGS = /presse|squat|fente|leg |leg$|soulevé|hip thrust|mollet|abduction|adduction|kickback|traîneau|saut|step-up|nordic/i;
  function ppl(n) { return PUSH.test(n) ? "push" : PULLR.test(n) ? "pull" : LEGS.test(n) ? "legs" : "tronc"; }
  var PL = { "": "Tout", push: "Push", pull: "Pull", legs: "Legs", tronc: "Tronc" };
  function exItem(name, r, inc, rest) { var o = gymOpts(name); return { name: name, r: r !== undefined ? r : o.r, inc: inc || o.inc, rest: rest || o.rest || 90, sets: [{}, {}, {}], rir: null, pain: null }; }
  function jload() { var j = jget(JKEY, null); return j && j.date === today() ? j : null; }
  function jsave(j) { jset(JKEY, j); }
  function jsheet() {
    var el = $("ks-log");
    if (!el) { el = document.createElement("div"); el.id = "ks-log"; el.className = "kf-sheet ks-sheet2"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Journal de séance"); document.body.appendChild(el); }
    return el;
  }
  // Choisir la séance à noter : celle du jour, une autre du programme, une séance perso, ou une séance libre
  function log(key) {
    if (key) return jstart(key);
    var cur = jload(), days = typeof SEQ_DAYS !== "undefined" ? Object.keys(SEQ_DAYS).filter(function (k) { return SEQ_DAYS[k].gym; }) : [];
    var map = window.KineTheme && KineTheme.schedule ? KineTheme.schedule() : null, todayKey = map ? map[new Date().getDay()] : null;
    var row = function (k, t, sub, on) { return "<button class='ks-pick" + (on ? " on" : "") + "' onclick='KineSalle.log(" + q(k) + ")'><b>" + esc(t) + "</b><small>" + esc(sub) + "</small><i aria-hidden='true'>›</i></button>"; };
    var mine = jget(MINE, []);
    var el = jsheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSalle._jclose()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Noter une séance</div><div class='kf-sub'>Tu fais ta séance à ton rythme, et tu notes tes séries au fur et à mesure. Pas besoin de lancer Yass.</div></div>" +
      (cur ? row("__resume", "Reprendre la séance en cours", cur.label + " · " + countDone(cur) + " séries notées", true) : "") +
      (days.length ? "<h3 class='ks-h3'>Mon programme</h3>" + days.map(function (k) {
        var d = SEQ_DAYS[k], n = d.exercises.filter(function (e) { return e.phase === "work"; }).length;
        return row(k, d.label.replace(/^[A-Z]\d — /, ""), n + " exercices" + (k === todayKey ? " · prévue aujourd'hui" : ""), k === todayKey && !cur);
      }).join("") : "") +
      "<h3 class='ks-h3'>Mes séances salle</h3>" + (mine.length ? mine.map(function (m) { return row("mine:" + m.id, m.name, m.ex.length + " exercices"); }).join("") : "") +
      "<button class='ks-pick ghost' onclick='KineSalle.mine(\"new\")'><b>Créer une séance</b><small>Choisis tes exercices</small><i aria-hidden='true'>+</i></button>" +
      "<button class='ks-pick ghost' onclick='KineSalle.log(\"libre\")'><b>Séance libre</b><small>Tu ajoutes les exercices au fur et à mesure</small><i aria-hidden='true'>›</i></button>" +
      "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function countDone(j) { var n = 0; j.ex.forEach(function (e) { e.sets.forEach(function (x) { if (x.done) n++; }); }); return n; }
  function jstart(key) {
    var j = jload();
    if (key === "__resume" && j) return jrender();
    var label = "Séance libre", ex = [];
    if (key && key.indexOf("mine:") === 0) {
      var m = jget(MINE, []).filter(function (x) { return "mine:" + x.id === key; })[0]; if (!m) return log();
      label = m.name; ex = m.ex.map(function (n) { return exItem(n); });
    } else if (key !== "libre" && typeof SEQ_DAYS !== "undefined" && SEQ_DAYS[key]) {
      var d = SEQ_DAYS[key]; label = d.label;
      ex = d.exercises.filter(function (e) { return e.phase === "work"; }).map(function (e) { return exItem(e.name, e.gym ? e.gymRange : range(e), e.gymInc, e.restAfter); });
    }
    j = { date: today(), key: key, day: SEQ_DAYS && SEQ_DAYS[key] ? key : null, label: label, t0: Date.now(), ex: ex };
    jsave(j); jrender();
    if (window.KineStats) KineStats.ev("p", "salle:journal");
  }
  function planOf(name) { var P = plans()[name]; return P ? P.kg : null; }
  function jrender() {
    var j = jload(); if (!j) return log();
    var el = jsheet(), done = countDone(j), t0 = new Date(j.t0);
    var cards = j.ex.map(function (e, i) {
      var p = planOf(e.name), u = unit(e.name), last = lastEntry(e.name), P = plans()[e.name];
      var img = window.KineAvatar && KineAvatar.snapshot && KineAvatar.supports(e.name) ? KineAvatar.snapshot(e.name, 112) : null;
      var lastTxt = last ? last.sets.filter(Boolean).map(function (x) { return fmt(x.kg) + (x.reps ? "×" + x.reps : ""); }).join("  ") : "";
      var rows = e.sets.map(function (x, k) {
        var prev = k ? e.sets[k - 1] : null, phKg = prev && prev.kg != null ? prev.kg : p, phR = prev && prev.reps ? prev.reps : e.r ? e.r[1] : "";
        return "<div class='ks-srow" + (x.done ? " done" : "") + "'><span class='ks-sn'>" + (k + 1) + "</span>" +
          "<input inputmode='decimal' aria-label='Charge série " + (k + 1) + "' placeholder='" + (phKg != null ? fmt(phKg) : "kg") + "' value='" + (x.kg != null ? fmt(x.kg) : "") + "' onchange='KineSalle._jv(" + i + "," + k + ",\"kg\",this.value)'>" +
          (e.r ? "<input inputmode='numeric' aria-label='Répétitions série " + (k + 1) + "' placeholder='" + phR + "' value='" + (x.reps != null ? x.reps : "") + "' onchange='KineSalle._jv(" + i + "," + k + ",\"reps\",this.value)'>" : "<span class='ks-na'>–</span>") +
          "<button class='ks-ok2' aria-label='Série faite' onclick='KineSalle._jdone(" + i + "," + k + ")'>" + (x.done ? "✓" : "") + "</button></div>";
      }).join("");
      var rirB = [["0", 0], ["1", 1], ["2", 2], ["3", 3], ["4+", 4]].map(function (r) { return "<button class='" + (e.rir === r[1] ? "on" : "") + "' onclick='KineSalle._jf(" + i + ",\"rir\"," + r[1] + ")'>" + r[0] + "</button>"; }).join("");
      var painB = [["0", 0, "g"], ["1 à 3", 3, "g"], ["4 à 5", 5, "o"], ["6+", 7, "r"]].map(function (r) { return "<button class='" + r[2] + (e.pain === r[1] ? " on" : "") + "' onclick='KineSalle._jf(" + i + ",\"pain\"," + r[1] + ")'>" + r[0] + "</button>"; }).join("");
      return "<div class='ks-jcard' id='ks-j" + i + "'><div class='ks-jh'>" + (img ? "<button class='ks-jimg' onclick='KineBiblio.demo(" + q(e.name) + ")' aria-label='Voir le mouvement'><img alt='' src='" + img + "'></button>" : "") +
        "<div class='ks-jt'><b>" + esc(e.name) + "</b><small>" + (e.r ? e.sets.length + " × " + e.r[0] + " à " + e.r[1] : e.sets.length + " séries") + (p != null ? " · charge du jour " + fmt(p) + " kg" + (u ? " " + u : "") : " · note la charge fixée avec ton kiné") + "</small>" +
        (P && P.why && P.d ? "<em class='" + (P.d > 0 ? "up" : "dn") + "'>" + esc(P.why) + "</em>" : "") + (lastTxt ? "<span class='ks-jl'>La dernière fois : " + esc(lastTxt) + "</span>" : "") + "</div>" +
        "<button class='ks-jx' aria-label='Retirer l'exercice' onclick='KineSalle._jdel(" + i + ",this)'>✕</button></div>" +
        "<div class='ks-shead'><span>Série</span><span>kg" + (u ? " " + u.replace("par ", "/ ") : "") + "</span><span>" + (e.r ? "Rép." : "") + "</span><span></span></div>" + rows +
        "<button class='ks-addset' onclick='KineSalle._jset(" + i + ")'>+ Ajouter une série</button>" +
        "<div class='ks-feel'><div><span>En réserve à la dernière série</span><div class='ks-mini'>" + rirB + "</div></div><div><span>Douleur</span><div class='ks-mini pain'>" + painB + "</div></div></div>" +
        (e.pain >= 7 ? "<div class='ks-warn'><b>Douleur forte.</b> Arrête cet exercice pour aujourd'hui et parles-en à ton kiné.</div>" : "") + "</div>";
    }).join("");
    el.innerHTML = "<div class='kf-sheet-body'><div class='ks-jtop'><button class='kf-back' onclick='KineSalle._jclose()' aria-label='Fermer (la séance est gardée)'>←</button>" +
      "<div><b>" + esc(j.label) + "</b><small>Commencée à " + t0.getHours() + " h " + ("0" + t0.getMinutes()).slice(-2) + " · " + done + " série" + (done > 1 ? "s" : "") + " faite" + (done > 1 ? "s" : "") + "</small></div></div>" +
      "<div class='ks-rest' id='ks-rest' hidden><span>Repos</span><b id='ks-rest-t'>0:00</b><i><u id='ks-rest-f'></u></i><button onclick='KineSalle._rest(30)'>+30 s</button><button onclick='KineSalle._rest(0)'>Passer</button></div>" +
      (cards || "<div class='ks-empty'>Ajoute ton premier exercice pour commencer.</div>") +
      "<button class='ks-addex' onclick='KineSalle._jadd()'>+ Ajouter un exercice</button>" +
      "<button class='ks-finish' onclick='KineSalle._jend()'" + (done ? "" : " disabled") + ">Terminer la séance</button>" +
      "<p class='ks-note'>Ta séance est gardée si tu fermes l'appli : tu la retrouves dans « Noter une séance ».</p></div>";
    el.classList.add("open");
    restPaint();
  }
  // Minuteur de repos : part tout seul quand on valide une série
  var RT = { end: 0, tot: 0, t: 0 };
  function restStart(sec) { RT.end = Date.now() + sec * 1000; RT.tot = sec; clearInterval(RT.t); RT.t = setInterval(restPaint, 250); restPaint(); }
  function restPaint() {
    var b = $("ks-rest"); if (!b) return;
    var left = Math.max(0, Math.round((RT.end - Date.now()) / 1000));
    if (!RT.end || left <= 0) {
      if (RT.end && left <= 0) { RT.end = 0; clearInterval(RT.t); try { if (navigator.vibrate) navigator.vibrate([200, 80, 200]); } catch (e) {} if (typeof playDoneBeep === "function") try { playDoneBeep(); } catch (e) {} }
      b.hidden = true; return;
    }
    b.hidden = false; $("ks-rest-t").textContent = Math.floor(left / 60) + ":" + ("0" + left % 60).slice(-2);
    $("ks-rest-f").style.width = (100 * left / RT.tot) + "%";
  }
  function num(v) { v = String(v || "").replace(",", ".").trim(); return v === "" ? null : Math.max(0, parseFloat(v) || 0); }
  function jfinishHtml(j) {
    var sets = 0, ton = 0, prs = [];
    j.ex.forEach(function (e) {
      var d = e.sets.filter(function (x) { return x.done; }); sets += d.length; ton += tonnage(d);
      var r = record(logs()[e.name]), t = top(d); if (t && r && e1rm(t) > e1rm(r.s) + 0.01) prs.push(e.name);
    });
    var mins = Math.max(1, Math.round((Date.now() - j.t0) / 60000));
    return { sets: sets, ton: ton, prs: prs, mins: mins };
  }
  function jend() {
    var j = jload(); if (!j) return;
    var st = jfinishHtml(j), el = jsheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSalle._jback()' aria-label='Retour à la séance'>←</button>" +
      "<div><div class='kf-h1'>Fin de séance</div><div class='kf-sub'>" + esc(j.label) + "</div></div>" +
      "<div class='ks-tiles'><div><b>" + st.sets + "</b><small>séries</small></div><div><b>" + (st.ton >= 1000 ? fmt(Math.round(st.ton / 100) / 10) + " t" : Math.round(st.ton) + " kg") + "</b><small>soulevés</small></div><div><b>" + st.mins + " min</b><small>durée</small></div></div>" +
      (st.prs.length ? "<div class='ks-rec'><span>Record</span><b>" + esc(st.prs.join(", ")) + "</b></div>" : "") +
      "<div class='ks-set'><label>Effort de la séance</label><div class='ks-chips ks-rir' id='ks-borg'>" + [["1", "très facile"], ["2", "facile"], ["3", "modéré"], ["4", "difficile"], ["5", "épuisant"]].map(function (b, i) {
        return "<button class='ks-chip" + (i === 2 ? " on" : "") + "' onclick='KineSalle._borg(" + (i + 1) + ",this)'>" + b[0] + "<small>" + b[1] + "</small></button>"; }).join("") + "</div></div>" +
      "<button class='ks-finish' onclick='KineSalle._jsave()'>Enregistrer la séance</button></div>";
    el.scrollTop = 0; borg = 3;
  }
  var borg = 3;
  function jsaveAll() {
    var j = jload(); if (!j) return;
    var st = jfinishHtml(j), c = { date: j.date, day: j.day, ex: {}, meta: {} }, maxPain = 0;
    j.ex.forEach(function (e) {
      var d = e.sets.filter(function (x) { return x.done; }); if (!d.length) return;
      c.ex[e.name] = d.map(function (x, k) { return { kg: x.kg, reps: x.reps, rir: k === d.length - 1 && e.rir != null ? e.rir : e.rir != null ? Math.min(4, e.rir + 1) : 2, pain: e.pain || 0 }; });
      c.meta[e.name] = { r: e.r, inc: e.inc }; maxPain = Math.max(maxPain, e.pain || 0);
    });
    var res = commitDraft(c, false);
    // La séance compte dans le suivi, comme une séance faite avec Yass
    var sObj = { id: Date.now(), date: j.date, seance: j.day ? SEQ_DAYS[j.day].label : "Salle — " + j.label, semaine: "S" + (window.KineProgress ? KineProgress.week() : 1), borg: borg,
      completion: "100% — Complète", douleur: maxPain, duree: st.mins, notes: "Carnet : " + Object.keys(c.ex).length + " exercices, " + st.sets + " séries", ts: Date.now(), salle: true };
    try { if (typeof sessions !== "undefined") { sessions.unshift(sObj); if (typeof saveSessions === "function") saveSessions(); } } catch (e) {}
    try { if (j.day && typeof exState !== "undefined") { SEQ_DAYS[j.day].exercises.forEach(function (_, k) { exState[j.day + "-" + k] = true; }); if (typeof saveExState === "function") saveExState(); } } catch (e) {}
    try { localStorage.removeItem(JKEY); } catch (e) {}
    try { if (typeof renderAll === "function") renderAll(); if (typeof checkBadges === "function") checkBadges(); } catch (e) {}
    var el = jsheet();
    el.innerHTML = "<div class='kf-sheet-body'><div class='ks-done'><div class='kf-h1'>Séance enregistrée</div><div class='kf-sub'>" + st.sets + " séries notées. Elle compte dans ton suivi, et ton kiné la verra.</div></div>" +
      summary(res) + "<button class='ks-finish' onclick='KineSalle._jclose()'>Terminé</button></div>";
    if (window.KineStats) KineStats.ev("p", "salle:journal-fin");
  }
  // Ajouter un exercice : les exercices de salle d'abord, rangés Push, Pull, Legs, Tronc, puis toute la bibliothèque
  var pf = "", pq = "";
  function catalogue() {
    var gym = window.KineSalleEx ? KineSalleEx.list.slice() : [], more = ["Curl biceps", "Élévation latérale", "Planche latérale complète", "Dead bug", "Planche Copenhague genou", "Pompes sur genoux", "Gainage frontal sur genoux"];
    var all = window.KineBiblio ? KineBiblio.all().map(function (e) { return e.name; }) : [];
    var seen = {}, out = [];
    gym.concat(more).concat(all).forEach(function (n) { if (!seen[n] && (!window.KineBiblio || KineBiblio.find(n))) { seen[n] = 1; out.push({ n: n, gym: gym.indexOf(n) >= 0 }); } });
    return out;
  }
  function pickerHtml(onPick, chosen) {
    var nq = pq.toLowerCase(), list = catalogue().filter(function (o) { return (!pf || ppl(o.n) === pf) && (!nq || o.n.toLowerCase().indexOf(nq) >= 0); });
    var g = list.filter(function (o) { return o.gym; }), b = nq ? list.filter(function (o) { return !o.gym; }).slice(0, 30) : [];
    var item = function (o) { var on = chosen && chosen.indexOf(o.n) >= 0; return "<button class='ks-pex" + (on ? " on" : "") + "' onclick='" + onPick + "(" + q(o.n) + ")'><span>" + esc(o.n) + "</span><i>" + (on ? "✓" : "+") + "</i></button>"; };
    return "<input class='ks-search' type='search' placeholder='Chercher un exercice' value='" + esc(pq) + "' oninput='KineSalle._pq(this.value)'>" +
      "<div class='ks-seg'>" + Object.keys(PL).map(function (k) { return "<button class='" + (pf === k ? "on" : "") + "' onclick='KineSalle._pf(\"" + k + "\")'>" + PL[k] + "</button>"; }).join("") + "</div>" +
      "<div class='ks-plist'>" + g.map(item).join("") + (b.length ? "<h3 class='ks-h3'>Bibliothèque</h3>" + b.map(item).join("") : "") +
      (!g.length && !b.length ? "<div class='ks-empty'>Aucun exercice trouvé.</div>" : "") + "</div>";
  }
  var pickCtx = null;
  function jadd() { pickCtx = "journal"; pf = ""; pq = ""; paintPicker(); }
  function paintPicker() {
    var el = jsheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSalle._jback()' aria-label='Retour'>←</button><div class='kf-h1'>Ajouter un exercice</div>" + pickerHtml("KineSalle._jpick") + "</div>";
  }
  /* ════════ Mes séances salle ════════ */
  var edit = null;
  function msheet() {
    var el = $("ks-mine");
    if (!el) { el = document.createElement("div"); el.id = "ks-mine"; el.className = "kf-sheet ks-sheet2"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Mes séances salle"); document.body.appendChild(el); }
    return el;
  }
  function mine(id) {
    if (id === "new") { edit = { id: "m" + Date.now(), name: "", ex: [], fresh: true }; pf = ""; pq = ""; return mpaint(); }
    if (id) { var m = jget(MINE, []).filter(function (x) { return x.id === id; })[0]; if (m) { edit = JSON.parse(JSON.stringify(m)); pf = ""; pq = ""; return mpaint(); } }
    edit = null;
    var list = jget(MINE, []), el = msheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSalle._mclose()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Mes séances salle</div><div class='kf-sub'>Tes propres séances, avec les exercices que tu veux. Elles se notent dans le même carnet et la charge progresse de la même façon.</div></div>" +
      list.map(function (m) {
        var z = {}; m.ex.forEach(function (n) { z[PL[ppl(n)]] = 1; });
        return "<div class='ks-mcard'><div><b>" + esc(m.name) + "</b><small>" + m.ex.length + " exercices · " + Object.keys(z).join(", ") + "</small></div>" +
          "<div class='ks-mact'><button class='pri' onclick='KineSalle._mclose();KineSalle.log(" + q("mine:" + m.id) + ")'>Noter</button><button onclick='KineSalle._myass(" + q(m.id) + ")'>Avec Yass</button><button onclick='KineSalle.mine(" + q(m.id) + ")'>Modifier</button></div></div>";
      }).join("") +
      "<button class='ks-finish' onclick='KineSalle.mine(\"new\")'>Créer une séance</button></div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function mpaint() {
    var el = msheet(), e = edit;
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSalle.mine()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>" + (e.fresh ? "Nouvelle séance" : "Modifier la séance") + "</div>" +
      "<input class='ks-search ks-name' maxlength='40' placeholder='Nom de la séance (ex. Push du lundi)' value='" + esc(e.name) + "' oninput='KineSalle._mname(this.value)'>" +
      "<div class='ks-chosen'>" + (e.ex.length ? e.ex.map(function (n, i) { return "<div class='ks-csel'><span>" + (i + 1) + "</span><b>" + esc(n) + "</b>" + (i ? "<button aria-label='Monter' onclick='KineSalle._mup(" + i + ")'>↑</button>" : "") + "<button aria-label='Retirer' onclick='KineSalle._mpick(" + q(n) + ")'>✕</button></div>"; }).join("") : "<div class='ks-empty'>Choisis tes exercices ci-dessous.</div>") + "</div>" +
      "<button class='ks-finish' onclick='KineSalle._msave()'" + (e.ex.length && e.name.trim() ? "" : " disabled") + " id='ks-msave'>Enregistrer la séance</button>" +
      (e.fresh ? "" : "<button class='ks-del' onclick='KineSalle._mdel(this)'>Supprimer cette séance</button>") +
      "<h3 class='ks-h3'>Exercices</h3>" + pickerHtml("KineSalle._mpick", e.ex) + "</div>";
    el.classList.add("open");
  }
  // Séance perso avec Yass : elle devient une séance guidée, hors de la liste du programme
  function mineYass(id) {
    var m = jget(MINE, []).filter(function (x) { return x.id === id; })[0]; if (!m || typeof SEQ_DAYS === "undefined") return;
    var as = function (n) { return window.KineOfficiel && KineOfficiel.asExercise ? KineOfficiel.asExercise(n) : null; };
    var warm = as("Échauffement global progressif"), cool = as("Étirements globaux et Savasana");
    var ex = m.ex.map(function (n) {
      var e = as(n); if (!e) return null; var o = gymOpts(n);
      e.phase = "work"; e.series = 3; e.gym = true; e.restAfter = o.rest || 90; e.gymRange = o.r; e.gymInc = o.inc;
      if (o.r) e.repsLabel = o.r[0] + " à " + o.r[1] + " répétitions";
      return e;
    }).filter(Boolean);
    var day = { label: "Salle — " + m.name, color: "var(--blue)", exercises: [warm].concat(ex, [cool]).filter(Boolean), gym: true, tours: 3, custom: true };
    Object.defineProperty(SEQ_DAYS, "ksm", { value: day, enumerable: false, configurable: true, writable: true });
    msheet().classList.remove("open");
    if (typeof launchSeq === "function") launchSeq("ksm");
  }

  /* ════════ Aperçu d'une séance de salle (avant de commencer) ════════ */
  function previewHtml(dayId) {
    var d = SEQ_DAYS[dayId], P = plans();
    var work = d.exercises.filter(function (e) { return e.phase === "work"; });
    return "<div class='kf-sheet-body'><button class='kf-back' onclick='closePreview()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + esc(d.label) + "</div><div class='kf-sub'>" + (d.focus ? esc(d.focus) + " " : "") + "3 séries par exercice, repos de 1 min 30 à 2 min 30.</div></div>" +
      "<div class='ks-twoways'><button class='pri' onclick=\"closePreview();KineSalle.log('" + dayId + "')\"><b>Noter ma séance</b><small>Tu t'entraînes à ton rythme et tu notes tes séries</small></button>" +
      "<button onclick=\"closePreview();launchSeq('" + dayId + "')\"><b>Avec Yass</b><small>Séance guidée : démonstration, minuteur et saisie au repos</small></button></div>" +
      work.map(function (e) {
        var img = window.KineAvatar && KineAvatar.snapshot ? KineAvatar.snapshot(e.name, 112) : null, p = P[e.name];
        return "<div class='kf-ex' role='button' tabindex='0' data-n='" + esc(e.name) + "' onclick='KineBiblio.demo(this.dataset.n)'>" + (img ? "<div class='kf-ex-n thumb'><img alt='' src='" + img + "'></div>" : "") +
          "<div style='flex:1'><div class='kf-ex-name'>" + esc(e.name) + "</div><div class='kf-ex-meta'>" + esc(e.repsLabel) + (p ? " · " + fmt(p.kg) + " kg" : e.gym ? " · charge à noter avec ton kiné" : "") + "</div></div><span class='kf-chev' aria-hidden='true'>›</span></div>";
      }).join("") + "</div>";
  }

  // Onglet Programme en mode salle : la charge qui progresse remplace les 4 semaines
  function progHtml() {
    var L = logs(), P = plans(), ns = Object.keys(P), up = 0, sess = {};
    ns.forEach(function (n) { if (P[n].d > 0) up++; });
    Object.keys(L).forEach(function (n) { L[n].forEach(function (e) { sess[e.d] = 1; }); });
    var nS = Object.keys(sess).length, f = window.KineTheme && KineTheme.perWeek ? KineTheme.perWeek() : 3;
    var map = window.KineTheme && KineTheme.schedule ? KineTheme.schedule() : {}, dow = new Date().getDay(), nk = null, when = "aujourd'hui";
    var WD = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    for (var i = 0; i < 7 && !nk; i++) { var k = map && map[(dow + i) % 7]; if (k) { nk = k; when = i === 0 ? "aujourd'hui" : i === 1 ? "demain" : WD[(dow + i) % 7]; } }
    var cur = jload(), nd = nk && SEQ_DAYS[nk];
    var nm = nd ? nd.label.replace(/^[A-Z]\d — /, "") : "";
    return "<div class='lu-pslab ks-slab'><p class='lu-k'>Salle de sport · " + f + " séances par semaine</p>" +
      "<h2 class='lu-t'>" + (cur ? "Séance en cours" : nd ? esc(nm) : "Push, Pull, Legs") + "</h2>" +
      "<p class='lu-m'>" + (cur ? esc(cur.label) + " · " + countDone(cur) + " séries notées." : nd ? "Prochaine séance " + when + ". " + (nS ? nS + " séance" + (nS > 1 ? "s" : "") + " dans ton carnet" + (up ? ", " + up + " charge" + (up > 1 ? "s" : "") + " en hausse." : ".") : "La charge progresse toute seule, séance après séance.") : "") + "</p>" +
      "<div class='ks-slab-row'><button class='ks-slab-btn pri' onclick=\"KineSalle.log(" + (cur ? "'__resume'" : nk ? "'" + nk + "'" : "") + ")\">" + (cur ? "Reprendre" : "Noter ma séance") + "</button>" +
      (nk && !cur ? "<button class='ks-slab-btn' onclick=\"openPreview('" + nk + "')\">Avec Yass</button>" : "") + "</div>" +
      "<div class='ks-slab-row'><button class='ks-slab-link' onclick='KineSalle.open()'>Carnet de charges</button><button class='ks-slab-link' onclick='KineSalle.mine()'>Mes séances salle</button><button class='ks-slab-link' onclick='KineTheme.gymPicker()'>Objectif et rythme</button></div></div>";
  }

  var API = {
    progHtml: progHtml, log: log, mine: mine, previewHtml: previewHtml, ppl: ppl,
    _jclose: function () { clearInterval(RT.t); RT.end = 0; var el = $("ks-log"); if (el) el.classList.remove("open"); try { if (typeof renderAll === "function") renderAll(); } catch (e) {} },
    _jback: function () { jrender(); },
    _jv: function (i, k, f, v) { var j = jload(); if (!j) return; var x = j.ex[i].sets[k]; x[f] = f === "reps" ? (num(v) == null ? null : Math.round(num(v))) : num(v); jsave(j); },
    _jdone: function (i, k) {
      var j = jload(); if (!j) return; var e = j.ex[i], x = e.sets[k], prev = k ? e.sets[k - 1] : null;
      if (x.done) { x.done = false; jsave(j); return jrender(); }
      if (x.kg == null) x.kg = prev && prev.kg != null ? prev.kg : planOf(e.name);
      if (x.reps == null && e.r) x.reps = prev && prev.reps ? prev.reps : e.r[1];
      if (x.kg == null) { var inp = document.querySelector("#ks-j" + i + " .ks-srow:nth-of-type(" + (k + 1) + ") input"); jsave(j); jrender(); var f = document.querySelectorAll("#ks-j" + i + " .ks-srow")[k]; if (f) { f.classList.add("need"); var ii = f.querySelector("input"); if (ii) ii.focus(); } return; }
      x.done = true; jsave(j);
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (er) {}
      var sc = document.querySelector(".ks-sheet2.open") ? $("ks-log").scrollTop : 0; jrender(); $("ks-log").scrollTop = sc;
      if (e.sets.some(function (s) { return !s.done; }) || i < j.ex.length - 1) restStart(e.rest || 90);
    },
    _jset: function (i) { var j = jload(); if (!j) return; j.ex[i].sets.push({}); jsave(j); var sc = $("ks-log").scrollTop; jrender(); $("ks-log").scrollTop = sc; },
    _jf: function (i, f, v) { var j = jload(); if (!j) return; j.ex[i][f] = j.ex[i][f] === v ? null : v; jsave(j); var sc = $("ks-log").scrollTop; jrender(); $("ks-log").scrollTop = sc; },
    _jdel: function (i, b) { if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = "Retirer ?"; return; } var j = jload(); if (!j) return; j.ex.splice(i, 1); jsave(j); jrender(); },
    _jadd: jadd,
    _jpick: function (n) { var j = jload(); if (!j) return; j.ex.push(exItem(n)); jsave(j); jrender(); var el = $("ks-log"); el.scrollTop = el.scrollHeight; },
    _jend: jend, _jsave: jsaveAll,
    _borg: function (n, el) { borg = n; Array.prototype.forEach.call(el.parentNode.children, function (b) { b.classList.toggle("on", b === el); }); },
    _rest: function (n) { if (!n) { RT.end = Date.now(); restPaint(); } else { RT.end += n * 1000; RT.tot += n; restPaint(); } },
    _pq: function (v) { pq = v; var focus = document.activeElement && document.activeElement.classList.contains("ks-search") && !document.activeElement.classList.contains("ks-name"); if (edit) mpaint(); else paintPicker(); if (focus) { var s2 = document.querySelector(".ks-sheet2.open .ks-search:not(.ks-name)"); if (s2) { s2.focus(); s2.setSelectionRange(v.length, v.length); } } },
    _pf: function (k) { pf = k; if (edit) mpaint(); else paintPicker(); },
    _mclose: function () { edit = null; var el = $("ks-mine"); if (el) el.classList.remove("open"); },
    _mname: function (v) { if (edit) { edit.name = v; var b = $("ks-msave"); if (b) b.disabled = !(edit.ex.length && v.trim()); } },
    _mpick: function (n) { if (!edit) return; var i = edit.ex.indexOf(n); if (i >= 0) edit.ex.splice(i, 1); else edit.ex.push(n); var sc = $("ks-mine").scrollTop; mpaint(); $("ks-mine").scrollTop = sc; },
    _mup: function (i) { if (!edit || i < 1) return; var t = edit.ex[i]; edit.ex[i] = edit.ex[i - 1]; edit.ex[i - 1] = t; mpaint(); },
    _msave: function () { if (!edit || !edit.ex.length || !edit.name.trim()) return; var L = jget(MINE, []), i = -1; L.forEach(function (m, k) { if (m.id === edit.id) i = k; }); var m = { id: edit.id, name: edit.name.trim(), ex: edit.ex.slice() }; if (i >= 0) L[i] = m; else L.push(m); jset(MINE, L); mine(); },
    _mdel: function (b) { if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = "Touche encore pour supprimer"; return; } jset(MINE, jget(MINE, []).filter(function (m) { return m.id !== edit.id; })); mine(); },
    _myass: mineYass,
    open: open, close: close, next: next, commit: commit, plans: plans, logs: logs,
    _bump: bump, _start: start, _set: setVal,
    _kg: function (id, v) { saveSet({ kg: v }); },
    _reps: function (id, v) { saveSet({ reps: v }); },
    _plan: function (id, v) { var n = $(id + "-n"); if (!n) return; var P = plans(), k = n.getAttribute("data-name"); P[k] = { kg: v, src: "kine", d: 0, why: "Charge réglée à la main, avec ton kiné." }; jset(PLAN, P); },
    _freq: function (n) { if (window.KineTheme && KineTheme.setFreq) KineTheme.setFreq(n); open(null); },
    _zone: function (z) { zf = z; open(null); },
    _del: function (n, b) {   // deux touchers : on confirme sur le bouton lui-même
      if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = "Touche encore pour effacer"; return; }
      var L = logs(), P = plans(); delete L[n]; delete P[n]; jset(LOG, L); jset(PLAN, P); open(null);
    }
  };

  /* ════════ Branchements sur le lecteur de séance ════════ */
  function hook() {
    if (typeof renderSeqExercise !== "function" || window.__ksHooked) return;
    window.__ksHooked = true;
    var rEx = window.renderSeqExercise;
    window.renderSeqExercise = function () {
      var r = rEx.apply(this, arguments), ex = curEx();
      if (ex && ex.gym) {
        var card = document.querySelector("#seq-body .seq-ex-card");
        if (card) card.insertAdjacentHTML("afterend", loadBox(ex));
        var sl = document.querySelector("#seq-body .seq-series-label"); if (sl) sl.textContent = sl.textContent.replace(/^(Circuit — )?[Tt]our/, "Série");
        Array.prototype.forEach.call(document.querySelectorAll("#seq-actions button"), function (b) { b.textContent = b.textContent.replace(/✓ Tour (\d+) terminé/, "Série $1 terminée").replace(/^✓ Terminé — Repos.*/, "Série " + seqTotalSeries + " terminée"); });
      }
      return r;
    };
    var wrapDone = function (fn) {
      return function () {
        var ex = curEx();
        if (ex && ex.gym) mark(ex.name, seqSerieIdx + 1, seqTotalSeries, ex); else pending = null;
        return fn.apply(this, arguments);
      };
    };
    if (typeof seqSeriesDone === "function") window.seqSeriesDone = wrapDone(window.seqSeriesDone);
    if (typeof seqExDone === "function") window.seqExDone = wrapDone(window.seqExDone);
    var rRest = window.renderSeqRest;
    window.renderSeqRest = function (secs, onDone) {
      var r = rRest.apply(this, arguments);
      if (pending && Date.now() - pending.at < 3000) {
        var body = $("seq-body"); if (body) body.insertAdjacentHTML("afterbegin", setCard(pending));
        var msg = body && body.querySelector(".v2-rest-msg"); if (msg) msg.textContent = "Note ta série pendant que tu récupères.";
      }
      return r;
    };
    if (typeof window.openPreview === "function") {
      var oPrev = window.openPreview;
      window.openPreview = function (dayId) {
        var d = typeof SEQ_DAYS !== "undefined" && SEQ_DAYS[dayId];
        if (!d || !d.gym) return oPrev.apply(this, arguments);
        var sh = $("seq-preview"); sh.innerHTML = previewHtml(dayId); sh.classList.add("open"); sh.scrollTop = 0; document.body.style.overflow = "hidden";
      };
    }
    var rFin = window.seqFinish;
    window.seqFinish = function () {
      var day = typeof SEQ_DAYS !== "undefined" && SEQ_DAYS[seqCurrentDay], res = day && day.gym ? commit() : [];
      var r = rFin.apply(this, arguments);
      if (res.length) setTimeout(function () {
        var go = $("cele-go"), up = res.filter(function (x) { return x.d > 0; }).length, dn = res.filter(function (x) { return x.d < 0; }).length;
        if (go) go.insertAdjacentHTML("beforebegin", "<div class='ks-cele'><b>Carnet de charges à jour</b><span>" +
          (up ? up + " charge" + (up > 1 ? "s" : "") + " en hausse" : "Mêmes charges, vise une répétition de plus") + (dn ? " · " + dn + " en baisse" : "") + "</span></div>");
        var b = $("seq-body"); if (b) b.insertAdjacentHTML("beforeend", summary(res));
      }, 120);
      pending = null;
      return r;
    };
  }
  if (document.readyState === "complete") setTimeout(hook, 0); else window.addEventListener("load", function () { setTimeout(hook, 0); });
  return API;
})();
window.KineSalle = KineSalle;
