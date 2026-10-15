/* ═══════════ KinéForce — exercices réactifs « couleurs » ═══════════
   Le patient dispose 2 à 4 plots (ou objets) de couleurs différentes. L'écran s'allume d'une couleur,
   Yass l'annonce, le patient va toucher le plot de cette couleur, puis revient. 10, 15 ou 20 couleurs par série,
   au rythme choisi. Les exercices sur une jambe se font des deux côtés. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var COLS = [
    { id: "rouge", name: "Rouge", hex: "#FF4D5E", ink: "#fff" },
    { id: "bleu", name: "Bleu", hex: "#3D8EF0", ink: "#fff" },
    { id: "jaune", name: "Jaune", hex: "#FFD23F", ink: "#14181f" },
    { id: "vert", name: "Vert", hex: "#2ECC71", ink: "#0c1a12" }
  ];
  var RYTHMES = [["calme", "Calme", 3000], ["soutenu", "Soutenu", 2000], ["rapide", "Rapide", 1500]];
  var COUNTS = [10, 15, 20];

  // Schémas vus de dessus : P = patient, C = chaise, plots = positions (x, y) dans un cadre 300 × 190
  var EXOS = [
    { id: "fentes", name: "Fentes réactives", level: 3, sides: false,
      kit: "vos plots et un sol dégagé",
      place: "Debout, pieds joints. Posez les plots au sol devant vous, en arc de cercle, à un grand pas : un en diagonale à gauche, un droit devant, un en diagonale à droite, et le quatrième sur le côté si vous en avez quatre.",
      action: "À chaque couleur, faites une fente : avancez le pied vers le plot de cette couleur, touchez-le du pied en pliant les deux genoux, puis poussez pour revenir pieds joints.",
      cue: "Le genou avant reste dans l'axe du pied. Revenez toujours bien au centre avant la couleur suivante.",
      spots: [[80, 62], [150, 35], [220, 62], [250, 120]], feet: "both" },
    { id: "chasses", name: "Pas chassés réactifs", level: 2, sides: false,
      kit: "vos plots et environ 3 mètres d'espace sur les côtés",
      place: "Debout au centre, légèrement fléchi. Posez un plot loin à gauche et un loin à droite (environ 3 pas chassés), puis les autres devant et derrière vous si vous en avez plus.",
      action: "À chaque couleur, rejoignez le plot en pas chassés, sans croiser les pieds, touchez-le du pied, puis revenez au centre.",
      cue: "Restez fléchi, le buste face à l'avant, et poussez sur la jambe extérieure.",
      spots: [[30, 105], [270, 105], [150, 28], [150, 180]], feet: "both" },
    { id: "squat", name: "Squat réactif", level: 2, sides: false,
      kit: "vos plots",
      place: "Debout, pieds largeur d'épaules. Posez les plots au sol devant vous, en arc de cercle, à une longueur de bras : un à gauche, un au centre, un à droite.",
      action: "À chaque couleur, descendez en squat et touchez le plot de cette couleur avec la main, puis remontez bien droit.",
      cue: "Les fesses reculent, le dos reste plat, les talons restent au sol.",
      spots: [[80, 80], [150, 50], [220, 80], [150, 22]], feet: "both" },
    { id: "unipodal", name: "Équilibre réactif sur une jambe", level: 2, sides: true, sideWord: "jambe",
      kit: "vos plots, et un appui stable à portée de main (mur, dossier de chaise)",
      place: "Debout sur une jambe au centre. Posez les plots au sol autour de vous, à environ 50 cm : un devant, un sur le côté, un en arrière en diagonale.",
      action: "À chaque couleur, touchez le plot du bout du pied libre, sans poser le pied, puis revenez au centre.",
      cue: "Le genou d'appui est légèrement fléchi et reste dans l'axe du pied.",
      spots: [[150, 40], [235, 105], [80, 160], [70, 60]], feet: "one" },
    { id: "pas", name: "Pas réactifs", level: 1, sides: false,
      kit: "vos plots et un peu d'espace",
      place: "Debout au centre. Posez les plots au sol autour de vous, à un grand pas : un devant, un à gauche, un à droite, un derrière si vous en avez quatre.",
      action: "À chaque couleur, faites un pas vers le plot, touchez-le du pied, puis revenez au centre.",
      cue: "Restez léger sur les pieds et revenez toujours au centre.",
      spots: [[150, 30], [55, 105], [245, 105], [150, 175]], feet: "both" },
    { id: "assis", name: "Réaction assis", level: 1, sides: false,
      kit: "une chaise stable sans roulettes et vos plots (ou objets de couleur)",
      place: "Assis au bord d'une chaise, pieds à plat. Posez les plots au sol autour de vos pieds, à portée : un à gauche, un devant, un à droite, un en diagonale si vous en avez quatre.",
      action: "À chaque couleur, allez toucher le plot de cette couleur avec le pied, puis reposez le pied au centre.",
      cue: "Restez bien assis, le dos droit. Pour plus de difficulté, alternez les pieds.",
      spots: [[85, 70], [150, 40], [215, 70], [230, 130]], feet: "seat" }
  ];
  var LVL = { 1: ["vert", "Facile"], 2: ["orange", "Intermédiaire"], 3: ["rouge", "Difficile"] };

  function settings() {
    var s = Object.assign({ exo: "fentes", ncol: 3, count: 15, rythme: "soutenu", pieges: false }, jget("kf-reactif-set", {}));
    if (!EXOS.some(function (e) { return e.id === s.exo; })) s.exo = "fentes";
    return s;
  }
  function save(s) { jset("kf-reactif-set", s); }
  function exoOf(id) { for (var i = 0; i < EXOS.length; i++) if (EXOS[i].id === id) return EXOS[i]; return EXOS[0]; }

  function say(t) { if (typeof speak === "function") { try { speak(t, { prio: 1, now: true, ttl: 2500 }); } catch (e) {} } }
  function beep(f, d, v) { if (typeof playBeep === "function") playBeep(f, d, v, "triangle"); }

  /* ── Schéma de placement ── */
  function diagram(ex, ncol) {
    var cones = ex.spots.slice(0, ncol).map(function (p, i) {
      var c = COLS[i];
      return "<g><path d='M" + (p[0] - 11) + " " + (p[1] + 9) + " L" + p[0] + " " + (p[1] - 12) + " L" + (p[0] + 11) + " " + (p[1] + 9) + " Z' fill='" + c.hex + "' stroke='rgba(0,0,0,.35)' stroke-width='1.2'/>" +
        "<rect x='" + (p[0] - 14) + "' y='" + (p[1] + 8) + "' width='28' height='4' rx='2' fill='" + c.hex + "' opacity='.7'/></g>";
    }).join("");
    var cx = 150, cy = ex.chair ? 128 : (ex.feet === "one" ? 100 : ex.feet === "seat" ? 95 : 110);
    var foot = function (x, y, op) { return "<ellipse cx='" + x + "' cy='" + y + "' rx='7' ry='13' fill='currentColor' opacity='" + (op || 0.9) + "'/>"; };
    var body = "";
    if (ex.feet === "split") body = foot(cx, cy - 6) + "<rect x='118' y='160' width='64' height='24' rx='5' fill='none' stroke='currentColor' stroke-width='2' opacity='.55'/>" +
      "<text x='150' y='176' text-anchor='middle' font-size='10' fill='currentColor' opacity='.7'>chaise</text>" + foot(cx, 166, 0.45);
    else if (ex.feet === "one") body = foot(cx, cy);
    else if (ex.feet === "seat") body = foot(cx - 14, cy) + foot(cx + 14, cy) + "<rect x='120' y='118' width='60' height='44' rx='6' fill='none' stroke='currentColor' stroke-width='2' opacity='.55'/>" +
      "<text x='150' y='145' text-anchor='middle' font-size='10' fill='currentColor' opacity='.7'>chaise</text>";
    else body = foot(cx - 14, cy) + foot(cx + 14, cy);
    var ring = ex.id === "pas" ? "<circle cx='150' cy='105' r='22' fill='none' stroke='currentColor' stroke-dasharray='4 4' opacity='.4'/>" : "";
    return "<svg class='kr-svg' viewBox='0 0 300 190' role='img' aria-label='Placement des plots vu de dessus'>" + ring + cones + body +
      "<text x='292' y='14' text-anchor='end' font-size='10' fill='currentColor' opacity='.6'>vu de dessus</text></svg>";
  }

  /* ── Écran de réglage ── */
  function open(exoId) {
    var s = settings(); if (exoId) s.exo = exoId;
    var el = $("kr-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kr-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Exercices réactifs"); document.body.appendChild(el); }
    var ex = exoOf(s.exo), hist = jget("kf-reactif-hist", []), last = hist.filter(function (h) { return h.exo === ex.id; })[0];
    var chip = function (cls, val, cur, txt) { return "<button type='button' class='" + (val === cur ? "sel" : "") + "' onclick='KineReactif._set(\"" + cls + "\"," + JSON.stringify(val) + ")'>" + txt + "</button>"; };
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineReactif.close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Exercices réactifs</div><div class='kf-sub'>L'écran s'allume d'une couleur et Yass l'annonce : allez toucher le plot de cette couleur, le plus vite possible, puis revenez.</div>" +
      "<div class='kr-exos'>" + EXOS.map(function (e) {
        return "<button type='button' class='kr-exo" + (e.id === ex.id ? " on" : "") + "' onclick='KineReactif._set(\"exo\",\"" + e.id + "\")'><i class='kb-dot c" + e.level + "'></i><b>" + esc(e.name) + "</b><span>" + LVL[e.level][1] + (e.sides ? ", des deux côtés" : "") + "</span></button>";
      }).join("") + "</div>" +
      "<div class='kr-place'>" + diagram(ex, s.ncol) +
        "<p><strong>Mise en place.</strong> " + esc(ex.place) + "</p><p><strong>À chaque couleur.</strong> " + esc(ex.action) + "</p>" +
        "<p class='kr-cue'>" + esc(ex.cue) + "</p></div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Nombre de plots</div><div class='kf-chips'>" + [2, 3, 4].map(function (n) { return chip("ncol", n, s.ncol, n + " couleurs"); }).join("") + "</div>" +
      "<div class='kr-swatch'>" + COLS.slice(0, s.ncol).map(function (c) { return "<span style='background:" + c.hex + ";color:" + c.ink + "'>" + c.name + "</span>"; }).join("") + "</div>" +
      "<p class='lx-muted kr-small'>Pas de plots ? Des gobelets, des t-shirts ou des feuilles de couleur posés au sol font très bien l'affaire.</p>" +
      "<div class='kf-phase' style='color:var(--text2)'>Couleurs par série" + (ex.sides ? " (pour chaque " + ex.sideWord + ")" : "") + "</div><div class='kf-chips'>" + COUNTS.map(function (n) { return chip("count", n, s.count, String(n)); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Rythme</div><div class='kf-chips'>" + RYTHMES.map(function (r) { return chip("rythme", r[0], s.rythme, r[1] + " <small>· " + (r[2] / 1000).toString().replace(".", ",") + " s</small>"); }).join("") + "</div>" +
      "<div class='kf-phase' style='color:var(--text2)'>Pièges</div><div class='kf-chips'>" + chip("pieges", false, !!s.pieges, "Non") + chip("pieges", true, !!s.pieges, "Oui") + "</div>" +
      "<p class='lx-muted kr-small'>Avec les pièges, l'écran affiche parfois « Pas le bleu » : il ne faut pas bouger. Ça entraîne l'attention et le contrôle.</p>" +
      (last ? "<p class='lx-muted kr-small'>Dernière fois : " + last.n + " couleurs, rythme " + esc(last.r) + ", le " + esc(last.d) + ".</p>" : "") +
      "<div class='kf-kit'><strong>Il vous faut :</strong> " + esc(ex.kit) + ". Espace dégagé, sol non glissant. Arrêtez si une douleur atteint 5 sur 10, ou en cas de vertige.</div>" +
      "</div><div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineReactif.start()'>C'est parti</button></div>";
    el.classList.add("open");
  }
  function setOpt(k, v) { var s = settings(); s[k] = v; save(s); var el = $("kr-sheet"), top = el ? el.querySelector(".kf-sheet-body").scrollTop : 0; open(); if (el) el.querySelector(".kf-sheet-body").scrollTop = top; }
  function close() { var el = $("kr-sheet"); if (el) el.classList.remove("open"); }

  /* ── La série ── */
  var run = null, wake = null;
  function sequence(n, k) {
    var out = [], prev = -1, prev2 = -1;
    for (var i = 0; i < n; i++) {
      var c; do { c = Math.floor(Math.random() * k); } while (c === prev && c === prev2);
      out.push(c); prev2 = prev; prev = c;
    }
    for (var j = 0; j < k && j < n; j++) if (out.indexOf(j) < 0) out[Math.floor(Math.random() * n)] = j;  // chaque plot sert au moins une fois
    return out;
  }
  function screen() {
    var el = $("kr-run");
    if (!el) { el = document.createElement("div"); el.id = "kr-run"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Exercice réactif en cours"); document.body.appendChild(el); }
    return el;
  }
  function paint(bg, ink, big, small, prog) {
    var el = screen();
    el.style.background = bg; el.style.color = ink;
    el.innerHTML = "<div class='kr-top'><span>" + esc(run.ex.name) + (run.sideTxt ? " · " + esc(run.sideTxt) : "") + "</span><span>" + (prog || "") + "</span></div>" +
      "<div class='kr-bar'><i style='width:" + (run.total ? Math.round((run.calls || 0) / run.total * 100) : 0) + "%'></i></div>" +
      "<div class='kr-big' aria-live='assertive'>" + big + "</div><div class='kr-small2'>" + (small || "") + "</div>" +
      "<div class='kr-btns'><button type='button' onclick='KineReactif.pause()'>" + (run.paused ? "Reprendre" : "Pause") + "</button><button type='button' onclick='KineReactif.stop()'>Arrêter</button></div>";
    el.classList.add("open");
  }
  function later(fn, ms) { run.t = setTimeout(function () { if (run && !run.paused) fn(); else if (run) run.resume = fn; }, ms); }

  function start() {
    var s = settings(), ex = exoOf(s.exo), r = RYTHMES.filter(function (x) { return x[0] === s.rythme; })[0] || RYTHMES[1];
    close();
    if (typeof getAudioCtx === "function") { var ctx = getAudioCtx(); if (ctx && ctx.state === "suspended") ctx.resume(); }
    if (typeof kfvPreloadAll === "function") { try { kfvPreloadAll(); } catch (e) {} }
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e) {}
    var sides = ex.sides ? [ex.sideWord === "jambe" ? "jambe droite" : "côté droit", ex.sideWord === "jambe" ? "jambe gauche" : "côté gauche"] : [null];
    run = { ex: ex, s: s, every: r[2], rName: r[1], sides: sides, si: 0, seq: [], i: 0, done: 0, total: s.count * sides.length, paused: false, t: null };
    document.body.style.overflow = "hidden";
    side();
  }
  function side() {
    run.seq = sequence(run.s.count, run.s.ncol).map(function (c, i) {
      return { c: c, trap: !!run.s.pieges && i >= 2 && Math.random() < 0.2 };
    });
    for (var k = 1; k < run.seq.length; k++) if (run.seq[k].trap && run.seq[k - 1].trap) run.seq[k].trap = false;   // jamais deux pièges de suite
    run.i = 0;
    run.sideTxt = run.sides[run.si] ? (run.ex.id === "bulgare" ? cap(run.sides[run.si]) + " devant" : "Sur la " + run.sides[run.si]) : "";
    paint("#0E141F", "#fff", "Prêt ?", run.sideTxt ? esc(run.sideTxt) + ". " + esc(run.ex.place.split(".")[0]) + "." : "Mettez-vous en place.", "");
    say(run.si === 0 ? "Mettez-vous en place." : "Changez de jambe.");
    var n = 3;
    later(function tick() {
      if (n > 0) { paint("#0E141F", "#fff", String(n), "", ""); say(String(n)); beep(660, 0.12, 0.25); n--; later(tick, 1000); }
      else { say("Partez !"); beep(990, 0.2, 0.3); later(cue, 600); }
    }, 3500);
  }
  function cue() {
    if (run.i >= run.seq.length) return endSide();
    var it = run.seq[run.i], c = COLS[it.c];
    run.i++; run.calls = (run.calls || 0) + 1;
    if (it.trap) {
      paint("#0E141F", "#fff", "<span class='kr-trap' style='border-color:" + c.hex + ";color:" + c.hex + "'>Pas le " + c.name.toLowerCase() + "</span>", "Ne bougez pas", run.i + " / " + run.seq.length);
      say("Pas le " + c.name.toLowerCase() + " !"); beep(330, 0.12, 0.18);
      later(cue, Math.max(1200, run.every * 0.8));
      return;
    }
    run.done++;
    paint(c.hex, c.ink, c.name, "", run.i + " / " + run.seq.length);
    say(c.name + " !"); beep(880, 0.06, 0.18);
    if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
    later(cue, run.every);
  }
  function endSide() {
    run.si++;
    if (run.si < run.sides.length) {
      var left = 20;
      paint("#0E141F", "#fff", "Changez de jambe", "Récupérez quelques secondes, puis placez-vous sur la " + esc(run.sides[run.si]) + ".", "");
      say("Changez de jambe.");
      later(function rest() {
        left--; var sm = screen().querySelector(".kr-small2");
        if (sm) sm.textContent = "On reprend dans " + left + " s, sur la " + run.sides[run.si] + ".";
        if (left > 0) later(rest, 1000); else side();
      }, 1000);
      return;
    }
    finish(true);
  }
  function finish(complete) {
    var r = run; if (!r) return;
    clearTimeout(r.t);
    if (complete || r.done >= 5) {
      var h = jget("kf-reactif-hist", []), d = new Date();
      h.unshift({ exo: r.ex.id, n: r.done, r: r.rName.toLowerCase(), d: d.getDate() + "/" + (d.getMonth() + 1) });
      jset("kf-reactif-hist", h.slice(0, 30));
    }
    if (complete) {
      paint("#0E141F", "#fff", "Bravo !", r.done + " couleurs touchées. Notez si une douleur est apparue, et pensez à boire un peu d'eau.", "");
      say("Série terminée, bravo !"); if (typeof playStartBeep === "function") playStartBeep();
      var el = screen(); el.querySelector(".kr-btns").innerHTML = "<button type='button' onclick='KineReactif.again()'>Recommencer</button><button type='button' onclick='KineReactif.stop()'>Terminer</button>";
    } else quit();
  }
  function quit() {
    if (run) clearTimeout(run.t);
    run = null;
    if (typeof stopSpeech === "function") stopSpeech();
    try { if (wake) wake.release(); } catch (e) {} wake = null;
    var el = $("kr-run"); if (el) el.classList.remove("open");
    document.body.style.overflow = "";
  }
  function pause() {
    if (!run) return;
    run.paused = !run.paused;
    var b = screen().querySelector(".kr-btns button"); if (b) b.textContent = run.paused ? "Reprendre" : "Pause";
    if (run.paused) { if (typeof stopSpeech === "function") stopSpeech(); say("Pause."); }
    else { var fn = run.resume; run.resume = null; say("On reprend."); if (fn) run.t = setTimeout(function () { if (run && !run.paused) fn(); }, 1200); }
  }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ── Accès depuis la bibliothèque ── */
  function libCard() {
    var box = $("kb-sheet"); if (!box) return;
    var body = box.querySelector(".kf-sheet-body"); if (!body || body.querySelector(".kr-libcard")) return;
    var chips = body.querySelector(".kb-chips"); if (!chips) return;
    var c = document.createElement("button");
    c.type = "button"; c.className = "kr-libcard";
    c.innerHTML = "<span class='kr-dots' aria-hidden='true'>" + COLS.slice(0, 3).map(function (x) { return "<i style='background:" + x.hex + "'></i>"; }).join("") + "</span>" +
      "<span class='kr-lt'><b>Exercices réactifs : les couleurs</b><small>Fentes, pas chassés, squat, équilibre, assis : allez toucher le plot de la couleur annoncée</small></span><span aria-hidden='true'>›</span>";
    c.onclick = function () { open(); };
    chips.parentNode.insertBefore(c, chips.nextSibling);
  }
  function watch() {
    var box = $("kb-sheet"); if (!box || box.__kr) return; box.__kr = 1;
    new MutationObserver(libCard).observe(box, { childList: true }); libCard();
  }

  window.KineReactif = { open: open, close: close, start: start, stop: function () { if (run && run.i > 0 && run.done < run.total) finish(false); else quit(); }, pause: pause,
    again: function () { quit(); open(); }, _set: setOpt, exos: EXOS, colors: COLS };
  function init() { watch(); new MutationObserver(watch).observe(document.body, { childList: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
