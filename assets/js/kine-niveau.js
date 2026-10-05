/* ═══════════ KinéForce — charges progressives, exercice par exercice ═══════════
   Règles validées par le kiné :
   · Monter : 2 avis « Trop facile » de suite sur un exercice → +2 répétitions (+1 par côté)
     ou +5 s de maintien. Au plus une hausse par semaine et par exercice
     (double progression, ACSM 2009).
   · Descendre : « Trop dur » ou douleur > 5/10 sur l'exercice → −2 répétitions (−1 par côté)
     ou −5 s, et pas de hausse pendant 7 jours (surveillance de la douleur, Silbernagel 2007).
     Douleur vive → retour au niveau de départ, signalé dans le résumé envoyé au kiné.
   · Plafond (20 répétitions, 12 par côté, 60 s) : on garde le nombre et on ralentit le tempo
     (pause de 2 s dans la position la plus difficile). En durée, on reste à 60 s.
   Tout reste sur le téléphone (localStorage « kf-level »). */
var KineLevel = (function () {
  "use strict";
  var KEY = "kf-level", DAY = 86400000;
  var CAP_REPS = 20, CAP_SIDE = 12, CAP_SEC = 60, MIN_REPS = 4, MIN_SIDE = 3, MIN_SEC = 10, MIN_D = -2;

  function iso(t) { var z = new Date(t); return z.getFullYear() + "-" + ("0" + (z.getMonth() + 1)).slice(-2) + "-" + ("0" + z.getDate()).slice(-2); }
  function addDays(d, n) { var p = d.split("-"); return iso(new Date(+p[0], +p[1] - 1, +p[2] + n, 12).getTime()); }
  function all() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function rec(o, name) { return o[name] || (o[name] = { d: 0, votes: [], up: null, hold: null, tempo: false }); }
  function get(name) { return all()[name] || null; }

  /* Valeurs ajustées (appelées par KineAvatar.info et KineProgress.repsLabel) */
  function adjReps(name, n, perSide) {
    var r = get(name); if (!r || !r.d) return n;
    var cap = Math.max(n, perSide ? CAP_SIDE : CAP_REPS), min = Math.min(n, perSide ? MIN_SIDE : MIN_REPS);
    return Math.max(min, Math.min(cap, n + r.d * (perSide ? 1 : 2)));
  }
  function adjSec(name, s) {
    var r = get(name); if (!r || !r.d) return s;
    return Math.max(Math.min(s, MIN_SEC), Math.min(Math.max(s, CAP_SEC), s + r.d * 5));
  }
  function tempo(name) { var r = get(name); return !!(r && r.tempo); }

  // Où en est l'exercice, avec ses chiffres du moment
  function now(ex) {
    var label = window.KineProgress ? KineProgress.repsLabel(ex) : ex.repsLabel;
    var w = window.KineProgress ? KineProgress.week() : 1;
    var inf = window.KineAvatar ? KineAvatar.info(ex.name, label, w) : { mode: /seconde/i.test(label) ? "timed" : "reps", reps: parseInt(label, 10) || 12, perSide: 0, seconds: parseInt(label, 10) || 30 };
    if (inf.mode === "timed") return { mode: "timed", value: inf.seconds, atCap: inf.seconds >= CAP_SEC, label: label };
    var v = inf.perSide || inf.reps;
    return { mode: "reps", value: v, perSide: !!inf.perSide, atCap: inf.perSide ? inf.perSide >= CAP_SIDE : inf.reps >= CAP_REPS, label: label };
  }
  function unit(st, v) { return st.mode === "timed" ? v + " s" : v + (st.perSide ? " répétitions par " + (/par jambe/i.test(st.label) ? "jambe" : "côté") : " répétitions"); }

  /* Avis du patient : "f" trop facile, "b" juste bien, "d" trop dur. Renvoie le message à afficher. */
  function vote(ex, v) {
    if (!ex || !ex.name) return "";
    var o = all(), r = rec(o, ex.name), today = iso(Date.now()), st = now(ex), msg = "Noté, merci !";
    r.votes.unshift({ v: v, date: today }); r.votes = r.votes.slice(0, 6);
    if (v === "d") {
      if (r.tempo) { r.tempo = false; msg = "Noté. La prochaine fois, on enlève la pause de 2 secondes."; }
      else if (r.d > MIN_D) { r.d--; save(o); msg = "Noté. La prochaine fois : " + unit(st, now(ex).value) + "."; }
      else msg = "Noté. On reste au niveau le plus doux ; parles-en à ton kiné si c'est encore dur.";
      r = rec(o, ex.name); r.hold = addDays(today, 7); r.votes = [];
    } else if (v === "f") {
      var two = r.votes.length >= 2 && r.votes[1].v === "f";
      var wait = (r.up && addDays(r.up, 7) > today) || (r.hold && r.hold > today);
      if (two && !wait) {
        if (st.atCap) {
          if (st.mode === "reps" && !r.tempo) { r.tempo = true; r.up = today; r.votes = []; msg = "Bravo ! Tu as atteint le maximum : la prochaine fois, on garde " + unit(st, st.value) + " avec une pause de 2 secondes à chaque répétition."; }
          else msg = "Bravo, tu es au maximum sur cet exercice !";
        } else {
          r.d++; r.up = today; r.votes = []; save(o);
          msg = "Bravo ! La prochaine fois : " + unit(st, now(ex).value) + ".";
        }
      } else if (two && wait) msg = "Noté ! On augmentera dès que possible, au plus une fois par semaine.";
      else msg = "Noté ! Encore un « trop facile » la prochaine fois et on augmente.";
    }
    save(o);
    return msg;
  }

  /* Douleur signalée pendant l'exercice (bouton « J'ai mal ») */
  function pain(name, level, sharp) {
    if (!name || !(sharp || level > 5)) return;
    var o = all(); if (!o[name] && !sharp && level <= 5) return;
    var r = rec(o, name), today = iso(Date.now());
    if (sharp) { r.d = Math.min(r.d, 0); r.tempo = false; r.alert = today; }
    else if (r.tempo) r.tempo = false;
    else r.d = Math.max(MIN_D, r.d - 1);
    r.hold = addDays(today, 7); r.votes = [];
    save(o);
  }

  /* Lignes pour « Envoyer à mon kiné » */
  function summaryLines() {
    var o = all(), names = Object.keys(o).filter(function (n) { return o[n].d || o[n].tempo || o[n].alert; });
    if (!names.length) return [];
    var L = ["", "AJUSTEMENTS PAR EXERCICE"];
    names.forEach(function (n) {
      var r = o[n], parts = [];
      if (r.d) parts.push((r.d > 0 ? "+" : "") + r.d + " palier" + (Math.abs(r.d) > 1 ? "s" : ""));
      if (r.tempo) parts.push("plafond atteint, tempo lent (pause 2 s)");
      if (r.alert) parts.push("douleur vive le " + r.alert.split("-").reverse().join("/") + ", retour au niveau de départ");
      L.push("• " + n + " : " + parts.join(", "));
    });
    return L;
  }

  function reset(name) { var o = all(); if (name) delete o[name]; else o = {}; save(o); }

  return { adjReps: adjReps, adjSec: adjSec, tempo: tempo, now: now, vote: vote, pain: pain, get: get, all: all, summaryLines: summaryLines, reset: reset };
})();
window.KineLevel = KineLevel;

/* La douleur signalée avec « J'ai mal » ajuste l'exercice concerné */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof window.rgPainAction !== "function") return;
  var orig = window.rgPainAction;
  window.rgPainAction = function (action) {
    try {
      var name = typeof rgState !== "undefined" && rgState.exName, lvl = typeof rgPain !== "undefined" ? +rgPain.level : 0;
      var sharp = !!(document.getElementById("rg-pain-sharp") || {}).checked;
      var inSeq = typeof SEQ_DAYS !== "undefined" && Object.keys(SEQ_DAYS).some(function (k) { return SEQ_DAYS[k].exercises.some(function (e) { return e.name === name; }); });
      if (inSeq) KineLevel.pain(name, lvl, sharp);
    } catch (e) {}
    return orig.apply(this, arguments);
  };
});
