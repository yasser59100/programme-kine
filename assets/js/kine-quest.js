/* ═══════════ KinéForce — questionnaires remplis par le patient ═══════════
   Le kiné envoie un questionnaire depuis le bilan (ou la fiche) ; le patient le reçoit dans son suivi, répond
   une question par écran, et le score arrive tout seul dans sa fiche : il compte pour les objectifs et la courbe,
   et pré-remplit le bilan suivant. On peut l'envoyer autant de fois que l'on veut.
   Ici : des outils libres de droits (note globale, activités choisies par le patient, douleur, impression de
   changement). Les questionnaires sous licence (KOOS, VISA-A…) s'ajoutent au même format, avec leur texte officiel. */
var KineQuest = (function () {
  "use strict";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var ZW = { genou: { art: "ton genou", adj: "normal" }, cheville: { art: "ta cheville", adj: "normale" }, epaule: { art: "ton épaule", adj: "normale" }, hanche: { art: "ta hanche", adj: "normale" }, rachis: { art: "ton dos", adj: "normal" }, cou: { art: "ton cou", adj: "normal" } };
  function zw(z) { return ZW[z] || { art: "ton articulation", adj: "normale" }; }
  function iso() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function days(a) { if (!a) return 9999; var p = String(a).split("-"); return Math.floor((Date.now() - new Date(+p[0], +p[1] - 1, +p[2]).getTime()) / 864e5); }

  /* ════════ Les questionnaires ════════
     items(Z, rep) : la liste des questions (peut dépendre des réponses, pour les activités du PSFS)
     calc(rep) : { score, m: { mesure: valeur } } — les mesures alimentent la fiche */
  var Q = {
    sane: { nom: "Note globale", court: "1 question : la note de son articulation sur 100", dur: "10 secondes", src: "williams99",
      items: function (Z) { return [{ id: "n", type: "slider", min: 0, max: 100, step: 5, def: 50, t: "Aujourd'hui, quelle note donnes-tu à " + Z.art + ", de 0 à 100 ?", sub: "100 = " + Z.art + " tout à fait " + Z.adj + ", comme avant le problème. 0 = le pire possible." }]; },
      calc: function (r) { var n = +r.n; return { score: n, m: { sane: n } }; }, u: "/100" },
    psfs: { nom: "Mes activités difficiles", court: "Ses 3 activités importantes, notées de 0 à 10 : idéal pour fixer les objectifs", dur: "1 minute", src: "stratford",
      items: function (Z, rep) {
        var L = [{ id: "acts", type: "acts", t: "Quelles activités as-tu du mal à faire à cause de " + Z.art + " ?", sub: "Jusqu'à 3 activités importantes pour toi. Par exemple : monter les escaliers, porter mon enfant, courir 20 minutes." }];
        (rep.acts || []).forEach(function (a, i) { if (String(a || "").trim()) L.push({ id: "a" + i, type: "scale", t: "Aujourd'hui, à quel point arrives-tu à : « " + a + " » ?", lo: "0 : impossible", hi: "10 : comme avant" }); });
        return L;
      },
      calc: function (r) { var v = [0, 1, 2].map(function (i) { return r["a" + i]; }).filter(function (x) { return x != null && x !== ""; }).map(Number); var s = v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10 : 0; return { score: s, m: { psfs: s } }; }, u: "/10" },
    dou: { nom: "Douleur de la semaine", court: "Au repos, pendant les activités et la nuit, de 0 à 10", dur: "20 secondes",
      items: function (Z) { return [
        { id: "rep", type: "scale", t: "Cette semaine, quelle douleur as-tu eue au repos, en moyenne ?", sub: "Douleur de " + Z.art + ".", lo: "0 : aucune", hi: "10 : la pire imaginable" },
        { id: "act", type: "scale", t: "Et pendant tes activités, au plus fort ?", lo: "0 : aucune", hi: "10 : la pire imaginable" },
        { id: "nuit", type: "scale", t: "Et la nuit, au plus fort ?", lo: "0 : aucune", hi: "10 : la pire imaginable" }]; },
      calc: function (r) { return { score: +r.act, m: { dou: +r.act, dnu: +r.nuit } }; }, u: "/10" },
    groc: { nom: "Impression de changement", court: "Comment il juge son évolution depuis le début", dur: "10 secondes", src: "kamper",
      items: function (Z) { return [{ id: "g", type: "choice", t: "Depuis le début de ta rééducation, comment va " + Z.art + " ?",
        ch: [["Beaucoup mieux", 3], ["Mieux", 2], ["Un peu mieux", 1], ["Pareil", 0], ["Un peu moins bien", -1], ["Moins bien", -2], ["Beaucoup moins bien", -3]] }]; },
      calc: function (r) { return { score: +r.g, m: { groc: +r.g } }; }, u: "", fmt: function (v) { return ["Beaucoup moins bien", "Moins bien", "Un peu moins bien", "Pareil", "Un peu mieux", "Mieux", "Beaucoup mieux"][(+v) + 3] || ""; } },
    dmat: { nom: "Premiers pas du matin", court: "La douleur sous le talon au lever, de 0 à 10", dur: "10 secondes", only: "dmat",
      items: function () { return [{ id: "n", type: "scale", t: "Ce matin, aux premiers pas du lever, quelle douleur as-tu eue sous le talon ?", lo: "0 : aucune", hi: "10 : la pire imaginable" }]; },
      calc: function (r) { return { score: +r.n, m: { dmat: +r.n } }; }, u: "/10" }
  };
  var ORDER = ["sane", "psfs", "dou", "groc", "dmat"];
  function fmtScore(q, v) { var d = Q[q]; if (!d || v == null) return "–"; if (d.fmt) return d.fmt(v); return String(Math.round(v * 10) / 10).replace(".", ",") + (d.u || ""); }

  /* ════════ Conseils pour le kiné ════════ */
  function last(list, q, done) { return (list || []).filter(function (x) { return x.q === q && (done ? x.fini : true); }).sort(function (a, b) { return (b.fini || b.env || "") < (a.fini || a.env || "") ? -1 : 1; })[0]; }
  function conseils(C, P) {
    var L = C.quest || [], E = Math.min(C.etape || 0, P.etapes.length - 1), objM = [];
    P.etapes[E].obj.forEach(function (o) { if (o.a && o.a.m) objM.push(o.a.m); });
    var out = ORDER.filter(function (id) { return !Q[id].only || P.mes.indexOf(Q[id].only) >= 0; }).map(function (id) {
      var ld = last(L, id, true), pend = L.filter(function (x) { return x.q === id && !x.fini; })[0], c = null;
      var age = ld ? days(ld.fini) : 9999, start = days(C.date0);
      if (id === "psfs") c = !ld ? "Pour fixer avec lui ses objectifs" : age > 28 ? "Dernière fois il y a plus de 4 semaines" : null;
      if (id === "sane") c = age > 14 ? "1 question, à refaire à chaque bilan" : null;
      if (id === "dou") c = (objM.indexOf("dnu") >= 0 || objM.indexOf("dou") >= 0) && age > 7 ? "Objectif de l'étape : la douleur" : null;
      if (id === "groc") c = start >= 21 && age > 21 ? "Pour juger l'évolution depuis le début" : null;
      if (id === "dmat") c = objM.indexOf("dmat") >= 0 && age > 7 ? "Objectif de l'étape : les premiers pas" : null;
      return { id: id, conseil: !pend && c ? c : null, pend: pend, last: ld };
    });
    var n = 0; out.forEach(function (x) { if (x.conseil && ++n > 2) x.conseil = null; });
    return out.sort(function (a, b) { return (b.conseil ? 1 : 0) - (a.conseil ? 1 : 0); });
  }
  // Les questionnaires remplis deviennent des « mini-bilans » : objectifs, courbe et bilan suivant les voient
  function asBilans(list) {
    return (list || []).filter(function (x) { return x.fini && x.m; }).map(function (x) { var m = {}; Object.keys(x.m).forEach(function (k) { if (x.m[k] != null && isFinite(x.m[k])) m[k] = { a: +x.m[k] }; }); return { d: x.fini, m: m, q: x.q }; });
  }
  function merge(bilans, list) { return (bilans || []).concat(asBilans(list)).sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : (a.q ? 1 : -1); }); }

  /* Carte du kiné : envoyer, voir ce qui est en attente et ce qui est revenu */
  function card(C, P, where) {
    var L = conseils(C, P), done = (C.quest || []).filter(function (x) { return x.fini; }).sort(function (a, b) { return a.fini < b.fini ? 1 : -1; });
    var h = "<div class='su-card kq-card'><div class='su-card-h'><b>Questionnaires du patient</b><span>" + (C.membres ? "il répond sur son téléphone" : "téléphone pas encore relié") + "</span></div>" +
      "<div class='kf-sub'>Un appui pour l'envoyer : il le reçoit dans son suivi, et ses réponses arrivent ici toutes seules.</div><div class='kq-list'>";
    h += L.map(function (x) {
      var d = Q[x.id];
      if (x.pend) return "<button class='kq-item pend' onclick='KineCabinet.qCancel(" + JSON.stringify(x.pend.id).replace(/'/g, "&#39;") + ")'><span><b>" + esc(d.nom) + "</b><em>Envoyé le " + esc(dfr(x.pend.env)) + " · en attente de réponse</em></span><i>Annuler</i></button>";
      return "<button class='kq-item" + (x.conseil ? " sug" : "") + "' onclick='KineCabinet.qSend(\"" + x.id + "\")'>" + (x.conseil ? "<u class='kf-hop'>Conseillé</u>" : "") +
        "<span><b>" + esc(d.nom) + "</b><em>" + esc(x.conseil || d.court) + " · " + esc(d.dur) + "</em>" + (x.last ? "<em class='kq-last'>Dernière réponse : " + esc(fmtScore(x.id, x.last.score)) + " le " + esc(dfr(x.last.fini)) + "</em>" : "") + "</span><i>Envoyer</i></button>";
    }).join("") + "</div>";
    if (done.length && where !== "bilan") h += "<div class='kcb-v2h kq-h'>Réponses reçues</div>" + done.slice(0, 6).map(function (x) {
      return "<button class='kcb-brow' onclick='KineCabinet.qView(" + JSON.stringify(x.id).replace(/'/g, "&#39;") + ")'><b>" + esc(dfr(x.fini)) + "</b><span>" + esc(Q[x.q] ? Q[x.q].nom : x.q) + " : " + esc(fmtScore(x.q, x.score)) + "</span><em>›</em></button>";
    }).join("");
    return h + "</div>";
  }
  function dfr(s) { if (!s) return ""; var p = String(s).split("-"); return p.length === 3 ? +p[2] + "/" + +p[1] : s; }
  // Détail des réponses (côté kiné)
  function detail(x, zone) {
    var d = Q[x.q]; if (!d) return "";
    var Z = zw(zone || x.zone), rep = x.rep || {};
    return "<div class='kq-sum'><b>" + esc(fmtScore(x.q, x.score)) + "</b><span>" + esc(d.nom) + ", rempli le " + esc(dfr(x.fini)) + "</span></div>" +
      d.items(Z, rep).map(function (it) {
        var v = rep[it.id], t = it.type === "acts" ? (rep.acts || []).filter(Boolean).join(" · ") : it.type === "choice" ? ((it.ch.filter(function (c) { return c[1] === +v; })[0] || [""])[0]) : v == null ? "–" : String(v);
        return "<div class='kq-ans'><span>" + esc(it.t) + "</span><b>" + esc(t || "–") + "</b></div>";
      }).join("");
  }

  /* ════════ Côté patient : une question par écran ════════ */
  var F = null;   // { pid, doc, q, Z, rep, i, done }
  function sheet() {
    var el = $("kq-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kq-sheet"; el.className = "kf-sheet kcb kq"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Questionnaire de ton kiné"); document.body.appendChild(el); }
    return el;
  }
  function draftKey() { return "kf-quest-" + (F && F.doc ? F.doc.id : ""); }
  function fill(pid, doc, prevActs) {
    var d = Q[doc.q]; if (!d) return;
    var rep = {}; try { rep = JSON.parse(localStorage.getItem("kf-quest-" + doc.id) || "null") || {}; } catch (e) {}
    if (doc.q === "psfs" && !rep.acts && prevActs) rep.acts = prevActs.slice(0, 3);
    F = { pid: pid, doc: doc, q: doc.q, Z: zw(doc.zone), rep: rep, i: -1 };
    render(); sheet().classList.add("open");
  }
  function items() { return Q[F.q].items(F.Z, F.rep); }
  function save() { try { localStorage.setItem(draftKey(), JSON.stringify(F.rep)); } catch (e) {} }
  function render() {
    var d = Q[F.q], L = items(), el = sheet(), body, foot, i = F.i;
    var top = "<div class='kcb-top'><button class='kf-back' onclick='KineQuest.back()' aria-label='Retour'><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M15 18l-6-6 6-6'/></svg></button><span class='kcb-tl'>Questionnaire de ton kiné</span></div>";
    if (F.done) {
      body = top + "<div class='kq-end'><i aria-hidden='true'><svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg></i><b>Merci, c'est envoyé</b><span>Ton kiné a tes réponses dans ta fiche.</span>" +
        "<div class='kq-sum'><b>" + esc(fmtScore(F.q, F.done.score)) + "</b><span>" + esc(d.nom) + (F.prev != null ? " · la dernière fois : " + esc(fmtScore(F.q, F.prev)) : "") + "</span></div></div>";
      foot = "<button class='seq-btn-main' onclick='KineQuest.close()'>Terminer</button>";
    } else if (i < 0) {
      body = top + "<div class='kq-intro'><span>" + esc(d.dur) + "</span><div class='kf-h1 kcb-h1'>" + esc(d.nom) + "</div><div class='kf-sub'>" + esc(L.length > 1 ? L.length + " questions sur " + F.Z.art + ". Il n'y a pas de bonne ou de mauvaise réponse : réponds selon ce que tu ressens." : "Une seule question sur " + F.Z.art + ".") + "</div>" +
        "<p class='kcb-hint'>Tes réponses vont seulement à ton kiné. Tu peux t'arrêter et reprendre plus tard.</p></div>";
      foot = "<button class='seq-btn-main' onclick='KineQuest.next()'>Commencer</button>";
    } else {
      var it = L[i], v = F.rep[it.id];
      var pr = "<div class='kq-prog' aria-hidden='true'><u style='width:" + Math.round((i + 1) / L.length * 100) + "%'></u></div><div class='kq-n'>Question " + (i + 1) + " sur " + L.length + "</div>";
      var q = "<div class='kq-q'>" + esc(it.t) + "</div>" + (it.sub ? "<div class='kf-sub'>" + esc(it.sub) + "</div>" : "");
      var input = "";
      if (it.type === "scale") input = "<div class='kq-scale' role='radiogroup'>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return "<button class='" + (v === n ? "on" : "") + "' role='radio' aria-checked='" + (v === n) + "' onclick='KineQuest.set(\"" + it.id + "\"," + n + ",1)'>" + n + "</button>"; }).join("") + "</div><div class='kq-lh'><span>" + esc(it.lo || "") + "</span><span>" + esc(it.hi || "") + "</span></div>";
      if (it.type === "slider") { var sv = v == null ? it.def : v; input = "<div class='kq-big' id='kq-big'>" + sv + "</div><input type='range' class='kq-range' min='" + it.min + "' max='" + it.max + "' step='" + it.step + "' value='" + sv + "' oninput='KineQuest.set(\"" + it.id + "\",+this.value)' aria-label='" + esc(it.t) + "'><div class='kq-lh'><span>" + it.min + "</span><span>" + it.max + "</span></div>"; if (v == null) { F.rep[it.id] = sv; } }
      if (it.type === "choice") input = "<div class='kq-ch'>" + it.ch.map(function (c) { return "<button class='" + (v === c[1] ? "on" : "") + "' onclick='KineQuest.set(\"" + it.id + "\"," + c[1] + ",1)'>" + esc(c[0]) + "</button>"; }).join("") + "</div>";
      if (it.type === "acts") { var A = F.rep.acts || []; input = "<div class='kq-acts'>" + [0, 1, 2].map(function (k) { return "<input class='kcb-in' maxlength='60' id='kq-a" + k + "' value='" + esc(A[k] || "") + "' placeholder='Activité " + (k + 1) + (k ? " (facultatif)" : "") + "' oninput='KineQuest.acts()'>"; }).join("") + "</div>"; }
      body = top + pr + q + input;
      var ok = it.type === "acts" ? (F.rep.acts || []).some(function (a) { return String(a || "").trim(); }) : F.rep[it.id] != null;
      foot = "<button class='seq-btn-main' id='kq-next' onclick='KineQuest.next()'" + (ok ? "" : " disabled") + ">" + (i === L.length - 1 ? "Envoyer à mon kiné" : "Suivant") + "</button>";
    }
    el.innerHTML = "<div class='kf-sheet-body'>" + body + "</div><div class='kf-sheet-foot'>" + foot + "</div>";
  }
  function set(id, v, auto) {
    F.rep[id] = v; save();
    var b = $("kq-big"); if (b) b.textContent = v;
    var nx = $("kq-next"); if (nx) nx.disabled = false;
    if (auto) { render(); setTimeout(function () { if (F && !F.done && items()[F.i] && items()[F.i].id === id) next(); }, 260); }
  }
  function acts() { F.rep.acts = [0, 1, 2].map(function (k) { var e = $("kq-a" + k); return e ? e.value.trim() : ""; }); save(); var nx = $("kq-next"); if (nx) nx.disabled = !F.rep.acts.some(Boolean); }
  function next() {
    var L = items();
    if (F.i >= 0 && L[F.i] && L[F.i].type === "acts") acts();
    if (F.i < L.length - 1) { F.i++; render(); sheet().scrollTop = 0; return; }
    submit();
  }
  function back() { if (F && !F.done && F.i >= 0) { F.i--; render(); return; } close(); }
  function close() { var el = $("kq-sheet"); if (el) el.classList.remove("open"); var w = F && F.done; F = null; if (w && window.KineMonSuivi && KineMonSuivi.refresh) KineMonSuivi.refresh(true); }
  function submit() {
    var d = Q[F.q], r = d.calc(F.rep), rep = {};
    Object.keys(F.rep).forEach(function (k) { var v = F.rep[k]; if (k === "acts") rep.acts = (v || []).filter(function (x) { return String(x || "").trim(); }).slice(0, 3).map(function (x) { return String(x).slice(0, 60); }); else if (typeof v === "number") rep[k] = v; });
    var data = { rep: rep, score: r.score, m: r.m, fini: iso() };
    var nx = $("kq-next"); if (nx) { nx.disabled = true; nx.textContent = "Envoi…"; }
    if (!window.fbPat || !fbPat.questDone) { if (nx) { nx.disabled = false; nx.textContent = "Réessayer"; } return; }
    fbPat.questDone(F.pid, F.doc.id, data).then(function () {
      try { localStorage.removeItem(draftKey()); } catch (e) {}
      F.done = data; render();
    }, function () { if (nx) { nx.disabled = false; nx.textContent = "Pas de connexion : réessayer"; } });
  }
  // Carte « ton kiné t'a envoyé un questionnaire » (Progrès et suivi)
  function patientCard(d, pid) {
    var P = (d.quest || []).filter(function (x) { return !x.fini && Q[x.q]; });
    if (!P.length) return "";
    var x = P[0], dq = Q[x.q];
    return "<button class='kq-pcard' onclick='KineQuest.start(" + JSON.stringify(x.id).replace(/'/g, "&#39;") + ")'><i aria-hidden='true'><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 4h6l1 2h3v14H5V6h3z'/><path d='M9 12l2 2 4-4'/></svg></i>" +
      "<span><b>Ton kiné t'a envoyé " + (P.length > 1 ? P.length + " questionnaires" : "un questionnaire") + "</b><em>" + esc(dq.nom) + " · " + esc(dq.dur) + "</em></span><u class='kf-hop'>Répondre</u></button>";
  }
  function start(docId) {
    var s = window.KineMonSuivi && KineMonSuivi.state ? KineMonSuivi.state() : null; if (!s || !s.d) return;
    var doc = (s.d.quest || []).filter(function (x) { return x.id === docId; })[0]; if (!doc) return;
    var prev = last(s.d.quest, doc.q, true);
    fill(s.pid, doc, prev && prev.rep && prev.rep.acts);
    if (F) F.prev = prev ? prev.score : null;
  }
  return { Q: Q, ORDER: ORDER, conseils: conseils, card: card, detail: detail, asBilans: asBilans, merge: merge, fmt: fmtScore, patientCard: patientCard, start: start, fill: fill,
    set: set, acts: acts, next: next, back: back, close: close, zw: zw };
})();
