/* ═══════════ KinéForce — niveau réglable par le patient, exercice par exercice ═══════════
   Sur l'écran d'un exercice, avant de démarrer : « − Plus facile » et « Plus difficile + ».
   + passe à la variante au-dessus de la même famille (ex. gainage latéral sur genoux → planche latérale complète).
   En haut de la famille (ou sans famille), + ajoute des répétitions ou du temps, puis une pause de 2 s.
   Le choix vaut tout de suite et pour les séances suivantes ; il figure dans le résumé envoyé au kiné. */
(function () {
  "use strict";
  // Familles d'exercices, du plus facile au plus difficile
  var CHAINS = [["Assis-debout de chaise", "Squat ballon dans le dos contre le mur", "Squat bilatéral", "Goblet squat", "Squat et développé avec bouteilles"], ["Fente arrière", "Fentes avant unilatérales", "Fente avec charge", "Squat bulgare"], ["Chaise contre le mur", "Position du skieur"], ["Pont de hanche", "Pont avec ballon entre les genoux", "Pont en marche", "Pont fessier unilatéral", "Hip thrust épaules sur canapé", "Hip thrust lesté"], ["Talons-fesses debout", "Pont ischio-jambiers talons sur chaise", "Leg curl serviette au sol", "Nordic curl assisté"], ["Élévation des talons", "Élévation des talons bras au plafond", "Élévation des talons unipodale", "Excentrique mollet sur marche"], ["Pompes contre le mur", "Pompes inclinées", "Pompes sur genoux", "Pompes complètes"], ["Rotation externe couché sur le côté", "Rotation externe d'épaule", "Rotation externe à l'élastique"], ["T au sol", "Superman en Y et en W", "Le nageur", "Superman serviette"], ["Crunch abdominal contrôlé", "Crunch inversé", "Portefeuille (V-up)"], ["Dead bug", "Ciseaux et vélo"], ["Superman quadrupédique en gainage", "Bear plank"], ["Plank — gainage avant-bras", "Toucher d'épaule en planche", "Mountain climber lent"], ["Side plank sur genoux", "Planche latérale complète"], ["Clamshell", "Abduction couché sur le côté", "Abduction hanche debout", "Marche latérale élastique"], ["Squat sumo", "Squat sumo ballon au sol"], ["Équilibre unipodal", "Le chef d'orchestre", "Unipodal yeux fermés", "Unipodal sur coussin", "Toucher en étoile unipodal"], ["Tandem talon-pointe", "Marche talon-pointe livre sur la tête"], ["Good morning debout", "Good morning au bâton", "Soulevé de terre roumain unipodal", "Soulevé de terre roumain avec charge"], ["Tirage serviette au-dessus de la tête", "Rowing un bras appui chaise", "Rowing deux bras penché", "Tirage inversé sous une table"], ["Curl biceps", "Curl marteau tempo lent"], ["Extension lombaire couché sur le ventre", "Superman bras-jambe opposés"], ["Extension de genou assis", "Relevé de jambe tendue couché"], ["Squat + élévation bras", "Fente avant et rotation ballon"]];
  var KEY = "kf-variant", LOG = "kf-variant-log";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function today() { var d = new Date(); return d.getDate() + "/" + (d.getMonth() + 1); }
  function chainOf(name) { for (var i = 0; i < CHAINS.length; i++) { var k = CHAINS[i].indexOf(name); if (k >= 0) return { c: CHAINS[i], i: k }; } return null; }
  function hasGear(e) { if (!e || !e.gear) return true; var g = jget("kf-gear", {}); return !!g[e.gear]; }
  function lib(name) { return window.KineBiblio && KineBiblio.find ? KineBiblio.find(name) : null; }
  // Variante voisine utilisable (matériel disponible), dans la direction dir
  function neighbor(name, dir) {
    var ch = chainOf(name); if (!ch) return null;
    for (var k = ch.i + dir; k >= 0 && k < ch.c.length; k += dir) { var e = lib(ch.c[k]); if (e && hasGear(e)) return e; }
    return null;
  }

  /* ── Appliquer les choix aux séances (le nom d'origine reste mémorisé dans __orig) ── */
  function swapInto(ex, e) {
    if (!ex.__origData) ex.__origData = { name: ex.name, desc: ex.desc, tip: ex.tip, stop: ex.stop, repsLabel: ex.repsLabel };
    ex.name = e.name; ex.desc = e.desc || ""; ex.tip = e.tip || ""; ex.stop = e.stop || ""; ex.repsLabel = e.repsLabel || ex.repsLabel;
  }
  function restore(ex) { if (ex.__origData) { for (var k in ex.__origData) ex[k] = ex.__origData[k]; } }
  function applyAll() {
    if (typeof SEQ_DAYS === "undefined") return;
    var map = jget(KEY, {});
    Object.getOwnPropertyNames(SEQ_DAYS).forEach(function (id) {
      var d = SEQ_DAYS[id]; if (!d || !d.exercises) return;
      d.exercises.forEach(function (ex) {
        if (!ex || ex.phase !== "work") return;
        var orig = ex.__origData ? ex.__origData.name : ex.name, want = map[orig];
        if (want && want !== ex.name) { var e = lib(want); if (e) swapInto(ex, e); }
        else if (!want && ex.__origData && ex.name !== orig) restore(ex);
      });
    });
  }
  function origOf(ex) { return ex.__origData ? ex.__origData.name : ex.name; }

  function log(line) { var l = jget(LOG, []); l.unshift({ t: line, d: today() }); jset(LOG, l.slice(0, 30)); }
  function setLevel(ex, dir) {
    var nb = neighbor(ex.name, dir), map = jget(KEY, {}), orig = origOf(ex), msg = "";
    if (nb) {
      if (nb.name === orig) delete map[orig]; else map[orig] = nb.name;
      jset(KEY, map); log(ex.name + " → " + nb.name);
      msg = (dir > 0 ? "Plus difficile : " : "Plus facile : ") + nb.name + ".";
      applyAll();
    } else if (window.KineLevel && KineLevel.bump) {
      msg = KineLevel.bump(ex, dir);
      if (msg) log(ex.name + " : " + msg.replace(/^Plus (difficile|facile) : /, "").replace(/\.$/, ""));
    }
    return msg;
  }

  /* ── Le réglage sur l'écran d'exercice ── */
  function curEx() {
    var ov = $("seq-overlay");
    if (!ov || !ov.classList.contains("open") || typeof SEQ_DAYS === "undefined") return null;
    var ex = SEQ_DAYS[seqCurrentDay] && SEQ_DAYS[seqCurrentDay].exercises[seqExIdx];
    return ex && ex.phase === "work" ? ex : null;
  }
  function hint(ex, dir) {
    var nb = neighbor(ex.name, dir);
    if (nb) return nb.name;
    if (dir > 0) return "plus de répétitions ou de temps";
    var r = window.KineLevel && KineLevel.get ? KineLevel.get(ex.name) : null;
    return r && (r.tempo || r.d > -2) ? "moins de répétitions ou de temps" : "";
  }
  function control() {
    var old = $("kv-level"); if (old) old.remove();
    var ex = curEx(), cue = $("rg2-cue"); if (!ex || !cue) return;
    var ch = chainOf(ex.name), dots = "";
    if (ch) for (var i = 0; i < ch.c.length; i++) dots += "<i class='" + (i < ch.i ? "on" : i === ch.i ? "on cur" : "") + "'></i>";
    var down = hint(ex, -1), up = hint(ex, 1);
    var el = document.createElement("div"); el.id = "kv-level";
    el.innerHTML = "<div class='kv-row'>" +
      "<button type='button' class='kv-btn' " + (down ? "" : "disabled") + " data-d='-1' aria-label='Plus facile" + (down ? " : " + esc(down) : "") + "'>−<small>Plus facile</small></button>" +
      "<div class='kv-mid'><b>Niveau</b>" + (dots ? "<span class='kv-dots' aria-hidden='true'>" + dots + "</span>" : "<span class='kv-n'>à votre mesure</span>") + "</div>" +
      "<button type='button' class='kv-btn up' data-d='1' aria-label='Plus difficile : " + esc(up) + "'>+<small>Plus difficile</small></button></div>" +
      "<p class='kv-hint' id='kv-hint'>" + (up ? "Trop facile ? + passe à : <strong>" + esc(up) + "</strong>" : "") + "</p>";
    cue.parentNode.insertBefore(el, cue.nextSibling);
    el.querySelectorAll(".kv-btn").forEach(function (b) {
      b.onclick = function () {
        var dir = +b.getAttribute("data-d"), msg = setLevel(ex, dir);
        if (!msg) return;
        var nx = SEQ_DAYS[seqCurrentDay].exercises[seqExIdx];
        if (typeof launchRepGuide === "function" && window.rgState) {
          launchRepGuide(nx.name, window.KineProgress ? KineProgress.repsLabel(nx) : nx.repsLabel, rgState.currentSerie, rgState.totalSeries, rgState.onSerieComplete);
        }
        var h = $("kv-hint"); if (h) { h.innerHTML = "<span class='kv-ok'>✓ " + esc(msg) + " On garde ce niveau pour les prochaines séances.</span>"; }
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
      };
    });
  }

  /* ── Résumé pour le kiné ── */
  function summaryLines() {
    var l = jget(LOG, []); if (!l.length) return [];
    return ["", "Niveaux réglés par le patient :"].concat(l.slice(0, 10).map(function (x) { return "· " + x.t + " (le " + x.d + ")"; }));
  }

  function hook() {
    if (typeof window.launchRepGuide !== "function" || window.launchRepGuide.__kv) return !!(window.launchRepGuide && window.launchRepGuide.__kv);
    var base = window.launchRepGuide;
    window.launchRepGuide = launchRepGuide = function () { var r = base.apply(this, arguments); try { control(); } catch (e) {} return r; };
    window.launchRepGuide.__kv = true;
    // La variante de la semaine décrite dans la fiche ne vaut que pour l'exercice d'origine
    if (window.KineProgress && KineProgress.variant && !KineProgress.variant.__kv) {
      var bv = KineProgress.variant;
      KineProgress.variant = function (dayId, idx) {
        var ex = typeof SEQ_DAYS !== "undefined" && SEQ_DAYS[dayId] && SEQ_DAYS[dayId].exercises[idx];
        if (ex && ex.__origData && ex.name !== ex.__origData.name) return null;
        return bv.apply(this, arguments);
      };
      KineProgress.variant.__kv = true;
    }
    ["launchSeq", "openPreview"].forEach(function (f) {
      var b = window[f]; if (typeof b !== "function" || b.__kv) return;
      window[f] = function () { applyAll(); return b.apply(this, arguments); }; window[f].__kv = true;
    });
    return true;
  }
  window.KineVariantes = { chains: CHAINS, neighbor: neighbor, setLevel: setLevel, applyAll: applyAll, summaryLines: summaryLines };
  function init() { hook(); applyAll(); setTimeout(function () { hook(); applyAll(); }, 1500); }
  window.addEventListener("kf-fb-ready", function () { setTimeout(applyAll, 1200); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
