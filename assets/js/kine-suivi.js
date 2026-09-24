/* ═══════════════════════════════════════════════════════════════
   KinéForce — Onglet Suivi
   Vue d'ensemble (séances, douleur et effort), historique, douleurs signalées,
   « Envoyer à mon kiné » (menu de partage du téléphone : rien ne part tout seul).
   Les données restent dans le téléphone du patient.
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var BORG = ["", "Très facile", "Facile", "Modéré", "Difficile", "Épuisant"];
  var DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

  function list() { return typeof sessions !== "undefined" && sessions ? sessions : []; }
  function pains() { try { return JSON.parse(localStorage.getItem("kf-pain") || "[]"); } catch (e) { return []; } }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var p = String(s).slice(0, 10).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dateFr(s, withDay) { var d = parse(s); return (withDay !== false ? DAYS[d.getDay()] + " " : "") + ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); }
  function monday() { var d = new Date(); d.setHours(12); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
  function ago(s) { var n = Math.round((parse(iso()) - parse(s)) / 86400000); return n <= 0 ? "aujourd'hui" : n === 1 ? "hier" : "il y a " + n + " jours"; }
  function code(s) { return String(s.seance || "").split(" ")[0]; }
  function weekOf(s) { var m = String(s.semaine || "").match(/[1-4]/); return m ? +m[0] : null; }
  function state() { return window.KineProgress ? KineProgress.state() : { week: 1, start: null }; }

  /* ════════ Vue d'ensemble ════════ */
  function chart(ss) {
    var pts = ss.slice(0, 6).reverse();
    if (pts.length < 2) return "<p class='kf-sub'>La courbe apparaîtra après 2 séances enregistrées avec le bilan.</p>";
    var W = 330, x0 = 30, x1 = 320, y = function (v) { return 110 - v * 10; };
    var xs = pts.map(function (_, i) { return x0 + (x1 - x0) * (pts.length === 1 ? 0 : i / (pts.length - 1)); });
    var line = function (vals, col, dash) {
      var segs = [], cur = [];
      vals.forEach(function (v, i) { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push(xs[i].toFixed(1) + "," + y(v).toFixed(1)); });
      if (cur.length) segs.push(cur);
      return segs.map(function (s) { return s.length > 1 ? "<polyline points='" + s.join(" ") + "' fill='none' stroke='" + col + "' stroke-width='3' stroke-linejoin='round'" + (dash ? " stroke-dasharray='6 5'" : "") + "/>"
        : "<circle cx='" + s[0].split(",")[0] + "' cy='" + s[0].split(",")[1] + "' r='4' fill='" + col + "'/>"; }).join("");
    };
    var pain = pts.map(function (s) { return s.douleur != null && s.douleur !== "" ? +s.douleur : null; });
    var eff = pts.map(function (s) { return s.borg ? +s.borg * 2 : null; });
    var grid = [0, 5, 10].map(function (v) { return "<line x1='24' y1='" + y(v) + "' x2='" + W + "' y2='" + y(v) + "' stroke='var(--surface3)'/><text x='" + (v === 10 ? 0 : 4) + "' y='" + (y(v) + 4) + "' font-size='11' fill='var(--text3)'>" + v + "</text>"; }).join("");
    var labels = pts.map(function (s, i) { return "<text x='" + xs[i] + "' y='132' font-size='11' fill='var(--text3)' text-anchor='middle'>" + esc(code(s)) + "</text>"; }).join("");
    return "<svg viewBox='0 0 " + W + " 140' width='100%' role='img' aria-label='Douleur et effort sur les dernières séances'>" + grid + line(eff, "#6fb0ff", true) + line(pain, "#f87171") + labels + "</svg>" +
      "<div class='su-legend'><span><i style='background:#f87171'></i>Douleur après la séance (0 à 10)</span><span><i style='background:#6fb0ff'></i>Effort (sur 5)</span></div>";
  }

  function render() {
    var page = $("page-suivi"); if (!page) return;
    var content = page.querySelector(".content") || page;
    var box = $("suivi-v2");
    if (!box) {
      box = document.createElement("div"); box.id = "suivi-v2";
      content.insertBefore(box, content.firstChild);
      page.classList.add("v2");
      // L'ajout manuel d'une séance devient une carte à ouvrir, sous les badges
      var ql = $("quick-log");
      if (ql && !ql.closest(".kf-acc")) {
        var title = ql.previousElementSibling;
        var det = document.createElement("details"); det.className = "kf-acc su-ql";
        det.innerHTML = "<summary>Ajouter une séance faite sans l'appli</summary>";
        ql.parentNode.insertBefore(det, ql); det.appendChild(ql);
        if (title && title.classList.contains("sec-title")) title.remove();
      }
    }
    var ss = list(), st = state(), mon = monday(), pp = pains();
    var cycle = st.start ? ss.filter(function (s) { return s.date >= st.start; }) : ss;
    var pCycle = st.start ? pp.filter(function (p) { return String(p.date).slice(0, 10) >= st.start; }) : pp;
    var week = ss.filter(function (s) { return s.date >= mon; }).length;
    var last = pp[0];
    box.innerHTML =
      "<div class='su-head'><div class='kf-h1'>Mon suivi</div><div class='kf-sub'>Semaine " + st.week + " sur 4" + (st.start ? " · depuis le " + dateFr(st.start, false) : "") + "</div></div>" +
      "<div class='kf-stats'>" +
        "<div class='kf-stat'><b>" + cycle.length + "</b><span>séance" + (cycle.length > 1 ? "s" : "") + " faite" + (cycle.length > 1 ? "s" : "") + "</span></div>" +
        "<div class='kf-stat'><b>" + week + "/5</b><span>cette semaine</span></div>" +
        "<div class='kf-stat" + (pCycle.length ? " warn" : "") + "'><b>" + pCycle.length + "</b><span>douleur" + (pCycle.length > 1 ? "s" : "") + " signalée" + (pCycle.length > 1 ? "s" : "") + "</span></div>" +
      "</div>" +
      "<div class='su-card'><div class='su-card-h'><b>Douleur et effort</b><span>" + Math.min(6, ss.length) + " dernière" + (ss.length > 1 ? "s" : "") + " séance" + (ss.length > 1 ? "s" : "") + "</span></div>" + chart(ss) + "</div>" +
      (last ? "<button class='su-last' onclick='KineSuivi.open(\"douleurs\")'><div><div class='su-k'>Dernière douleur</div>" +
        "<div><strong>" + esc(last.zone) + ", " + last.intensite + "/10</strong> · " + esc(last.exercice) + " · " + ago(last.date) + "</div>" +
        "<div class='su-dec'>" + esc(cap(last.action)) + "</div></div><span aria-hidden='true'>›</span></button>" : "") +
      "<div class='v2-other'>" +
        "<button class='v2-row' onclick='KineSuivi.open(\"historique\")'><b>Historique des séances</b><span>›</span></button>" +
        "<button class='v2-row' onclick='KineSuivi.open(\"douleurs\")'><b>Douleurs signalées</b><span>›</span></button></div>" +
      "<button class='today-go su-send' onclick='KineSuivi.open(\"envoyer\")'>Envoyer à mon kiné</button>" +
      "<div class='v2-h' style='margin-top:22px'>Mes badges</div>";
    // Les badges existants se placent juste après
    var badges = $("badges-suivi");
    if (badges && badges.previousElementSibling !== box) { box.parentNode.insertBefore(badges, box.nextSibling); }
    var bt = badges && badges.previousElementSibling && badges.previousElementSibling.classList && badges.previousElementSibling.classList.contains("sec-title") ? badges.previousElementSibling : null;
    if (bt) bt.remove();
  }
  function cap(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ════════ Écrans : historique, douleurs, envoi ════════ */
  var filterPain = false, period = "week";
  function sheet() {
    var el = $("kf-suivi");
    if (!el) { el = document.createElement("div"); el.id = "kf-suivi"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function frame(title, sub, body, foot) {
    return "<div class='kf-sheet-body'><button class='kf-back' onclick='KineSuivi.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + title + "</div>" + (sub ? "<div class='kf-sub'>" + sub + "</div>" : "") + "</div>" + body + "</div>" +
      (foot ? "<div class='kf-sheet-foot'>" + foot + "</div>" : "");
  }

  function historique() {
    var ss = list().filter(function (s) { return !filterPain || (s.douleur >= 1) || (s.douleurs && s.douleurs.length); });
    var chips = "<div class='kf-chips'><button class='" + (!filterPain ? "sel" : "") + "' onclick='KineSuivi.filter(false)'>Toutes</button><button class='" + (filterPain ? "sel" : "") + "' onclick='KineSuivi.filter(true)'>Avec douleur</button></div>";
    if (!ss.length) return frame("Historique des séances", "", chips + "<div class='kf-note'>" + (filterPain ? "Aucune séance avec douleur. Tant mieux !" : "Aucune séance enregistrée pour l'instant. Terminez une séance guidée : le bilan s'enregistre ici.") + "</div>");
    var html = chips, lastW = null;
    ss.forEach(function (s) {
      var w = weekOf(s);
      if (w !== lastW) { html += "<div class='kf-phase' style='color:var(--text2)'>" + (w ? "Semaine " + w : "Semaine non précisée") + "</div>"; lastW = w; }
      var hurt = (s.douleur >= 5) || (s.douleurs && s.douleurs.length);
      var tags = [];
      if (s.duree) tags.push(s.duree + " min");
      if (s.borg) tags.push("Effort " + s.borg + " · " + BORG[s.borg]);
      if (s.completion) tags.push(String(s.completion).replace(" — ", " · "));
      if (s.douleur != null && s.douleur !== "") tags.push("<span class='" + (s.douleur >= 5 ? "su-red" : "") + "'>Douleur " + s.douleur + "/10</span>");
      html += "<div class='su-sess" + (hurt ? " hurt" : "") + "'><div class='su-sess-h'><b>" + esc(s.seance || "Séance") + "</b><span>" + dateFr(s.date) + "</span></div>" +
        "<div class='su-tags'>" + tags.map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div>" +
        (s.douleurs && s.douleurs.length ? "<div class='su-pain-line'>Pendant la séance : " + s.douleurs.map(function (p) { return esc(p.zone.toLowerCase()) + " " + p.intensite + "/10 (" + esc(p.exercice) + ", " + esc(p.action) + ")"; }).join(" ; ") + "</div>" : "") +
        (s.notes ? "<div class='kf-sub'>« " + esc(s.notes) + " »</div>" : "") + "</div>";
    });
    return frame("Historique des séances", "", html, "<button class='seq-btn-secondary' onclick='KineSuivi.clear()'>Effacer l'historique</button>");
  }

  function douleurs() {
    var pp = pains();
    if (!pp.length) return frame("Douleurs signalées", "Pendant les exercices, avec le bouton « J'ai mal »", "<div class='kf-note'>Aucune douleur signalée. Si une douleur apparaît pendant un exercice, appuyez sur « J'ai mal » : elle sera enregistrée ici.</div>");
    var zones = {}; pp.forEach(function (p) { zones[p.zone] = (zones[p.zone] || 0) + 1; });
    var max = Math.max.apply(null, Object.keys(zones).map(function (k) { return zones[k]; }));
    var bars = Object.keys(zones).sort(function (a, b) { return zones[b] - zones[a]; }).map(function (z) {
      return "<div class='su-bar'><span>" + esc(z) + "</span><i><em style='width:" + Math.round(zones[z] / max * 100) + "%'></em></i><b>" + zones[z] + "</b></div>"; }).join("");
    var eps = pp.map(function (p) {
      var strong = p.intensite >= 5 || p.vive;
      return "<div class='su-sess" + (strong ? " hurt" : "") + "'><div class='su-sess-h'><b>" + esc(p.zone) + " · " + p.intensite + "/10" + (p.vive ? " · vive" : "") + "</b><span>" + dateFr(p.date) + "</span></div>" +
        "<div>" + esc(p.exercice) + (p.serie ? ", série " + p.serie : "") + "</div><div class='" + (strong ? "su-dec" : "kf-sub") + "'>Décision : " + esc(p.action) + "</div></div>";
    }).join("");
    return frame("Douleurs signalées", "Pendant les exercices, avec le bouton « J'ai mal »",
      "<div class='su-card'><b>Par zone</b>" + bars + "</div><div class='kf-phase' style='color:var(--text2)'>Épisodes</div>" + eps +
      "<div class='kf-kit'>Une douleur revient au même endroit ? Parlez-en à votre kinésithérapeute avant la prochaine séance.</div>",
      "<button class='seq-btn-main' onclick='KineSuivi.open(\"envoyer\")'>Envoyer à mon kiné</button>");
  }

  function summary() {
    var st = state(), name = localStorage.getItem("kf-patient-name") || "";
    var from = period === "week" ? monday() : (st.start || "0000");
    var ss = list().filter(function (s) { return s.date >= from; });
    var pp = pains().filter(function (p) { return String(p.date).slice(0, 10) >= from; });
    var L = [];
    L.push("KinéForce" + (name ? " · " + name : ""));
    L.push("Semaine " + st.week + " sur 4" + (st.start ? " (début le " + dateFr(st.start, false) + ")" : ""));
    L.push("");
    L.push(period === "week" ? "Séances cette semaine : " + ss.length + " sur 5" : "Séances depuis le début : " + ss.length);
    ss.forEach(function (s) {
      var bits = [];
      if (s.borg) bits.push("effort " + s.borg + "/5");
      if (s.douleur != null && s.douleur !== "") bits.push("douleur " + s.douleur + "/10");
      if (s.completion) bits.push(String(s.completion).split(" — ")[0]);
      L.push("· " + dateFr(s.date) + " " + code(s) + (bits.length ? " : " + bits.join(", ") : ""));
    });
    if (pp.length) {
      L.push(""); L.push("Douleurs pendant les exercices :");
      pp.forEach(function (p) { L.push("· " + dateFr(p.date, false) + " " + p.zone.toLowerCase() + " " + p.intensite + "/10" + (p.vive ? " (vive)" : "") + ", " + p.exercice + ", " + p.action); });
    }
    var notes = ss.map(function (s) { return s.notes; }).filter(Boolean);
    if (notes.length) { L.push(""); L.push("Remarques : " + notes.join(" ; ")); }
    var extra = ($("su-extra") && $("su-extra").value.trim()) || "";
    if (extra) { L.push(""); L.push("Mot du patient : " + extra); }
    return L.join("\n");
  }
  function envoyer() {
    var name = localStorage.getItem("kf-patient-name") || "";
    var chips = "<div class='kf-chips'><button class='" + (period === "week" ? "sel" : "") + "' onclick='KineSuivi.period(\"week\")'>Cette semaine</button><button class='" + (period === "all" ? "sel" : "") + "' onclick='KineSuivi.period(\"all\")'>Tout le programme</button></div>";
    var nameField = "<label class='su-label'>Votre prénom et nom<input class='kf-text su-input' id='su-name' value='" + esc(name) + "' placeholder='Pour que votre kiné sache de qui il s'agit' oninput='KineSuivi.name(this.value)'></label>";
    return frame("Envoyer à mon kiné", "Vous choisissez à qui l'envoyer (SMS, WhatsApp, e-mail…). Rien n'est envoyé automatiquement.",
      (name ? "" : nameField) + chips +
      "<div class='su-card'><div class='su-k' style='color:#6fb0ff'>Aperçu du message</div><pre class='su-pre' id='su-pre'></pre></div>" +
      (name ? "<label class='su-label'>Votre nom<input class='kf-text su-input' id='su-name' value='" + esc(name) + "' oninput='KineSuivi.name(this.value)'></label>" : "") +
      "<label class='su-label'>Ajouter un mot (facultatif)<textarea class='kf-text' id='su-extra' oninput='KineSuivi.preview()'></textarea></label>",
      "<button class='seq-btn-main' onclick='KineSuivi.share()'>Partager le résumé</button><button class='seq-btn-secondary' onclick='KineSuivi.copy()'>Copier le texte</button>");
  }

  var SCREENS = { historique: historique, douleurs: douleurs, envoyer: envoyer };
  var current = null;
  window.KineSuivi = {
    render: render,
    open: function (name) { current = name; var el = sheet(); el.innerHTML = SCREENS[name](); el.classList.add("open"); el.scrollTop = 0; if (name === "envoyer") KineSuivi.preview(); },
    close: function () { var el = $("kf-suivi"); if (el) el.classList.remove("open"); current = null; },
    filter: function (v) { filterPain = v; KineSuivi.open("historique"); },
    period: function (p) { period = p; var extra = $("su-extra") ? $("su-extra").value : ""; KineSuivi.open("envoyer"); if ($("su-extra")) $("su-extra").value = extra; KineSuivi.preview(); },
    name: function (v) { try { localStorage.setItem("kf-patient-name", v.trim()); } catch (e) {} KineSuivi.preview(); },
    preview: function () { var pre = $("su-pre"); if (pre) pre.textContent = summary(); },
    share: function () {
      if (!(localStorage.getItem("kf-patient-name") || "").trim()) { var f = $("su-name"); if (f) { f.focus(); f.classList.add("su-need"); } return; }
      var text = summary();
      if (navigator.share) navigator.share({ title: "Mon suivi KinéForce", text: text }).catch(function () {});
      else KineSuivi.copy();
    },
    copy: function () {
      var text = summary(), done = function () { var b = document.querySelector("#kf-suivi .kf-sheet-foot .seq-btn-secondary"); if (b) { b.textContent = "Texte copié"; setTimeout(function () { b.textContent = "Copier le texte"; }, 1800); } };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {}); else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); }
    },
    clear: function () { if (typeof clearSessions === "function") { clearSessions(); } KineSuivi.close(); render(); }
  };

  function init() {
    render();
    if (typeof renderAll === "function" && !renderAll.__suivi) {
      var base = renderAll;
      renderAll = function () { base.apply(this, arguments); render(); };
      renderAll.__suivi = true;
      renderAll.__today = base.__today;
    }
  }
  if (document.readyState === "complete") init(); else document.addEventListener("DOMContentLoaded", init);
})();
