/* ═══════════ KinéForce — niveau réglable par le patient, exercice par exercice ═══════════
   Sur l'écran d'un exercice, avant de démarrer : « − Plus facile » et « Plus difficile + ».
   + ajoute d'abord du temps ou des répétitions (jusqu'à 60 s, 15 répétitions ou 10 par côté),
   puis propose la variante au-dessus de la même famille (ex. gainage latéral sur genoux → planche latérale complète).
   La variante est montrée (image de Yass, consigne) et ne remplace l'exercice qu'une fois acceptée.
   En haut de la famille (ou sans famille), + continue jusqu'au plafond, puis une pause de 2 s.
   Le choix vaut tout de suite et pour les séances suivantes ; il figure dans le résumé envoyé au kiné. */
(function () {
  "use strict";
  // Familles d'exercices, du plus facile au plus difficile : un même geste et les mêmes muscles d'un bout à l'autre
  // (le gainage latéral n'est pas la suite du gainage de face : ce sont deux familles)
  var CHAINS = [["Squat ballon dans le dos contre le mur", "Squat bilatéral", "Goblet squat"], ["Fente arrière", "Fentes avant unilatérales", "Fente avec charge", "Squat bulgare", "Squat bulgare lesté", "Squat bulgare, descente en 4 secondes"], ["Chaise contre le mur", "Position du skieur"], ["Pont de hanche", "Pont avec ballon entre les genoux", "Pont en marche", "Pont fessier unilatéral", "Hip thrust épaules sur canapé", "Hip thrust lesté"], ["Talons-fesses debout", "Pont ischio-jambiers talons sur chaise", "Leg curl serviette au sol", "Nordic curl assisté", "Nordic curl complet"], ["Élévation des talons", "Élévation des talons bras au plafond", "Élévation des talons unipodale", "Excentrique mollet sur marche"], ["Pompes contre le mur", "Pompes inclinées", "Pompes sur genoux", "Pompes complètes", "Pompes, descente en 4 secondes", "Pompes plyométriques"], ["Rotation externe couché sur le côté", "Rotation externe d'épaule", "Rotation externe à l'élastique", "Rotation externe couché sur le côté, retour en 4 secondes"], ["T au sol", "Superman en Y et en W", "Le nageur", "Superman serviette"], ["Crunch abdominal contrôlé", "Crunch inversé", "Portefeuille (V-up)"], ["Dead bug", "Ciseaux et vélo", "Dead bug lesté"], ["Gainage frontal sur genoux", "Plank — gainage avant-bras", "Toucher d'épaule en planche", "Mountain climber lent"], ["Side plank sur genoux", "Planche latérale complète", "Planche latérale avec levée de la jambe", "Planche latérale avec descentes du bassin"], ["Clamshell", "Abduction couché sur le côté", "Abduction hanche debout", "Marche latérale élastique"], ["Squat sumo", "Squat sumo ballon au sol"], ["Équilibre unipodal", "Le chef d'orchestre", "Unipodal yeux fermés", "Unipodal sur coussin", "Toucher en étoile unipodal"], ["Tandem talon-pointe", "Marche talon-pointe livre sur la tête"], ["Good morning debout", "Good morning au bâton", "Soulevé de terre roumain unipodal", "Soulevé de terre roumain avec charge", "Soulevé de terre roumain unipodal lesté"], ["Rowing un bras appui chaise", "Rowing deux bras penché", "Tirage inversé sous une table", "Tirage inversé, descente en 4 secondes"], ["Curl biceps", "Curl marteau tempo lent"], ["Extension lombaire couché sur le ventre", "Superman bras-jambe opposés", "Extension lombaire lestée au sol"], ["Contraction du quadriceps couché", "Arc court du quadriceps sur un rouleau", "Extension de genou tenue", "Extension terminale du genou"], ["Step-up sur marche", "Montée de marche avec charge", "Petersen step-up"], ["Descente de marche", "Descente de marche sur le côté", "Descente de marche lestée, en 4 secondes"], ["Mini-squat sur une jambe, tenu", "Squat sur une jambe vers la chaise", "Squat sur une jambe complet (pistol)"], ["Spanish squat à l'élastique", "Spanish squat tenu lourd"], ["Reverse Nordic", "Reverse Nordic, descente en 5 secondes"], ["Fente statique", "Fente arrière glissée", "Fente avant lestée, descente en 4 secondes"], ["Fente latérale", "Fente latérale glissée", "Fente latérale lestée"], ["Réception de saut stabilisée", "Saut sur la marche", "Squat sauté", "Saut en contrebas puis rebond (drop jump)"], ["Petits sauts sur place", "Sauts sur une jambe", "Sauts répétés sur une jambe (pogo)"], ["Talons levés assis", "Mollet assis avec charge", "Mollet assis lourd, descente en 3 secondes"], ["Élévation des talons sur une marche", "Élévation du talon lestée sur une marche"], ["Éversion à l'élastique", "Éversion à l'élastique, retour en 4 secondes"], ["Inversion à l'élastique", "Inversion à l'élastique, retour en 4 secondes"], ["Marche sur la pointe des pieds", "Marche sur la pointe des pieds lestée"], ["Marche sur les talons", "Marche sur les talons lestée"], ["Corde à sauter imaginaire", "Corde à sauter sur une jambe"], ["Rotation externe à 90° à l'élastique", "Rotation externe à 90°, retour en 4 secondes"], ["Rotation interne à l'élastique", "Rotation interne à l'élastique, retour en 4 secondes"], ["Élévation latérale", "Élévation latérale, descente en 4 secondes"], ["Développé épaules assis", "Développé épaules, descente en 4 secondes", "Pike push-up"], ["Pendulaire de Codman", "Glissement de la main sur la table", "Élévation du bras aidée, couché", "Marche des doigts sur le mur", "Élévation du bâton bras tendus"], ["Serrage des omoplates", "Pompe au mur avec poussée des omoplates", "Pompe des omoplates sur les genoux"], ["Dips sur chaise", "Dips sur chaise, descente en 4 secondes"], ["Contraction des fessiers couché", "Coquillage à l'élastique", "Coquillage pieds décollés"], ["Planche Copenhague genou", "Planche Copenhague", "Copenhague dynamique genou", "Copenhague dynamique", "Copenhague dynamique, descente en 4 secondes"], ["Copenhague inversée (abducteurs)", "Copenhague inversée dynamique"], ["Abduction contre le mur, debout", "Abduction debout, retour en 4 secondes"], ["Contraction des ischios talon au sol", "Pont isométrique talons qui tirent", "Pont des ischios, talons loin", "Pont des ischios sur une jambe, talon sur la chaise"], ["Leg curl serviette sur une jambe", "Leg curl serviette, retour en 5 secondes"], ["Charnière de hanche, fesses au mur", "Ramasser un objet en charnière de hanche", "Soulevé de terre avec deux sacs", "Soulevé de terre avec deux sacs, descente en 4 secondes"], ["Extension couché sur les coudes", "Extension en appui sur les mains"], ["Rentrer le menton", "Endurance des fléchisseurs du cou"]];
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
  // Variante plus difficile qui n'attend qu'un matériel que le patient n'a pas encore coché
  var GEAR = { charge: "une charge : haltère, bouteille d'eau pleine ou sac à dos lesté", elastique: "un élastique de rééducation" };
  function gearBlocked(name) {
    var ch = chainOf(name); if (!ch) return null;
    for (var k = ch.i + 1; k < ch.c.length; k++) { var e = lib(ch.c[k]); if (e && !hasGear(e)) return e; }
    return null;
  }
  function addGear(g) { var o = jget("kf-gear", {}); o[g] = true; jset("kf-gear", o); }

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
  // Ajustement en cours (répétitions, temps, tempo) de l'exercice affiché
  function adj(ex) { var r = window.KineLevel && KineLevel.get ? KineLevel.get(ex.name) : null; return { up: !!(r && (r.d > 0 || r.tempo)), down: !!(r && r.d < 0), r: r }; }
  // Seuil à partir duquel + propose la variante plutôt que d'ajouter encore (60 s, 15 répétitions, 10 par côté)
  var VAR_SEC = 60, VAR_REPS = 15, VAR_SIDE = 10;
  function dose(ex) { return window.KineLevel && KineLevel.now ? KineLevel.now(ex) : null; }
  function atVar(st) { return !st || st.atCap || (st.mode === "timed" ? st.value >= VAR_SEC : st.value >= (st.perSide ? VAR_SIDE : VAR_REPS)); }
  // Ce que fera le bouton : { v: variante } ou { d: 1 } (temps ou répétitions) ou null
  function plan(ex, dir) {
    var a = adj(ex);
    if ((dir < 0 && a.up) || (dir > 0 && a.down)) return { d: 1 };   // on défait d'abord le dernier réglage
    var nb = neighbor(ex.name, dir);
    if (dir > 0) return nb && atVar(dose(ex)) ? { v: nb } : { d: 1 };
    return nb ? { v: nb } : { d: 1 };
  }
  function takeVar(ex, nb, dir) {
    var map = jget(KEY, {}), orig = origOf(ex), from = ex.name;
    if (nb.name === orig) delete map[orig]; else map[orig] = nb.name;
    jset(KEY, map); log(from + " → " + nb.name); applyAll();
    return (dir > 0 ? "Plus difficile : " : "Plus facile : ") + nb.name + ".";
  }
  function setDose(ex, dir) {
    var msg = window.KineLevel && KineLevel.bump ? KineLevel.bump(ex, dir) : "";
    if (msg && !/maximum/.test(msg)) log(ex.name + " : " + msg.replace(/^Plus (difficile|facile) : /, "").replace(/\.$/, ""));
    return msg;
  }
  // Réglage direct (sans aperçu) : gardé pour les appels extérieurs
  function setLevel(ex, dir) { var p = plan(ex, dir); return p && p.v ? takeVar(ex, p.v, dir) : setDose(ex, dir); }

  /* ── Le réglage sur l'écran d'exercice ── */
  function curEx() {
    var ov = $("seq-overlay");
    if (!ov || !ov.classList.contains("open") || typeof SEQ_DAYS === "undefined") return null;
    var ex = SEQ_DAYS[seqCurrentDay] && SEQ_DAYS[seqCurrentDay].exercises[seqExIdx];
    return ex && ex.phase === "work" ? ex : null;
  }
  function hint(ex, dir) {
    var a = adj(ex), p = plan(ex, dir), st = dose(ex), more = st && st.mode === "timed" ? "plus de temps" : "plus de répétitions";
    if (dir < 0 && a.up) return a.r.tempo ? "sans la pause de 2 secondes" : st && st.mode === "timed" ? "moins de temps" : "moins de répétitions";
    if (p && p.v) return p.v.name;
    if (dir > 0) { var nb = neighbor(ex.name, 1); return nb ? more + ", puis " + nb.name : more; }
    return !a.r || a.r.d > -2 ? (st && st.mode === "timed" ? "moins de temps" : "moins de répétitions") : "";
  }
  function upHint(ex) {
    var p = plan(ex, 1), st = dose(ex), nb = neighbor(ex.name, 1);
    if (p && p.v) return "Trop facile ? + te montre la variante : <strong>" + esc(p.v.name) + "</strong>";
    if (nb && st) return "Trop facile ? + ajoute " + (st.mode === "timed" ? "du temps jusqu'à " + VAR_SEC + " s" : "des répétitions jusqu'à " + (st.perSide ? VAR_SIDE + " par côté" : VAR_REPS)) + ", puis te propose <strong>" + esc(nb.name) + "</strong>";
    return "Trop facile ? + ajoute " + (st && st.mode === "timed" ? "du temps" : "des répétitions");
  }
  // Aperçu de la variante : image de Yass, consigne, ce qui change ; rien ne change avant « Je prends »
  function shot(n) { try { var e = lib(n); return e && e.thumb || (window.KineAvatar && KineAvatar.supports(n) ? KineAvatar.snapshot(n, 220) : null); } catch (er) { return null; } }
  function previewVar(el, ex, nb, dir, done) {
    var box = el.querySelector(".kv-prev"); if (box) box.remove();
    box = document.createElement("div"); box.className = "kv-prev" + (dir > 0 ? " up" : "");
    var u = shot(nb.name), st = dose(ex);
    box.innerHTML = "<div class='kv-prev-h'>" + (dir > 0 ? "Variante plus difficile" : "Variante plus facile") + "</div>" +
      "<div class='kv-prev-b'>" + (u ? "<img src='" + u + "' alt=''>" : "<span class='kv-prev-ph' aria-hidden='true'></span>") + "<div><b>" + esc(nb.name) + "</b>" + (nb.desc ? "<span>" + esc(nb.desc) + "</span>" : "") + "</div></div>" +
      (dir > 0 && st ? "<p class='kv-prev-n'>Tu tiens " + (st.mode === "timed" ? st.value + " s" : st.value + " répétitions") + " sans difficulté : on passe à un geste plus exigeant, qui repart à " + (st.mode === "timed" ? "son temps" : "son nombre de répétitions") + " de départ.</p>" : "") +
      "<div class='kv-prev-a'><button type='button' class='kv-no'>Garder mon exercice</button><button type='button' class='kv-yes'>Je prends cette variante</button></div>";
    var anchor = el.querySelector(".kv-hint"); el.insertBefore(box, anchor);
    if (!u) setTimeout(function () { var u2 = shot(nb.name), ph = box.querySelector(".kv-prev-ph"); if (u2 && ph) ph.outerHTML = "<img src='" + u2 + "' alt=''>"; }, 600);
    box.querySelector(".kv-no").onclick = function () { box.remove(); };
    box.querySelector(".kv-yes").onclick = function () { box.remove(); done(takeVar(ex, nb, dir)); };
    if (box.scrollIntoView) try { box.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
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
      "<div class='kv-mid'><b>Niveau</b>" + (dots ? "<span class='kv-dots' aria-hidden='true'>" + dots + "</span>" : "<span class='kv-n'>à ta mesure</span>") + "</div>" +
      "<button type='button' class='kv-btn up' data-d='1' aria-label='Plus difficile : " + esc(up) + "'>+<small>Plus difficile</small></button></div>" +
      "<p class='kv-hint' id='kv-hint'>" + (up ? upHint(ex) : "") + "</p>";
    var gb = !neighbor(ex.name, 1) && !adj(ex).down ? gearBlocked(ex.name) : null;
    if (gb) el.querySelector(".kv-hint").innerHTML = "";
    if (gb) el.innerHTML += "<div class='kv-gear'>Niveau suivant : <strong>" + esc(gb.name) + "</strong>. Il faut " + esc(GEAR[gb.gear] || gb.gear) + ".<button type='button' class='kv-gearbtn'>J'en ai, je passe au niveau suivant</button></div>";
    cue.parentNode.insertBefore(el, cue.nextSibling);
    var gbtn = el.querySelector(".kv-gearbtn");
    if (gbtn) gbtn.onclick = function () { addGear(gb.gear); var up2 = el.querySelector(".kv-btn.up"); if (up2) up2.click(); };
    if (window.KineExplique) KineExplique.once("niveau", el);
    el.querySelectorAll(".kv-btn").forEach(function (b) {
      b.onclick = function () {
        var dir = +b.getAttribute("data-d"), p = plan(ex, dir);
        if (p && p.v) { previewVar(el, ex, p.v, dir, applied); return; }
        applied(setDose(ex, dir));
      };
    });
    function applied(msg) {
        if (!msg) return;
        var nx = SEQ_DAYS[seqCurrentDay].exercises[seqExIdx];
        if (typeof launchRepGuide === "function" && window.rgState) {
          launchRepGuide(nx.name, window.KineProgress ? KineProgress.repsLabel(nx) : nx.repsLabel, rgState.currentSerie, rgState.totalSeries, rgState.onSerieComplete);
        }
        var h = $("kv-hint"); if (h) { h.innerHTML = "<span class='kv-ok'>✓ " + esc(msg) + (/maximum/.test(msg) ? "" : " On garde ce niveau pour les prochaines séances.") + "</span>"; }
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
    }
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
  window.KineVariantes = { chains: CHAINS, neighbor: neighbor, setLevel: setLevel, plan: plan, applyAll: applyAll, summaryLines: summaryLines };
  function init() { hook(); applyAll(); setTimeout(function () { hook(); applyAll(); }, 1500); }
  window.addEventListener("kf-fb-ready", function () { setTimeout(applyAll, 1200); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
