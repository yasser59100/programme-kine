/* Statistiques d'usage anonymes : combien de personnes ouvrent l'appli, finissent leur séance, à quel exercice
   elles s'arrêtent… Aucun nom, aucun compte, aucune donnée de santé détaillée : un numéro tiré au hasard,
   renouvelé chaque mois, et des évènements comme « séance terminée ». On peut les couper dans les réglages. */
(function () {
  "use strict";
  var OFF = "kf-stats-off", Q = [], T0 = Date.now(), sid = null, finished = false;
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function off() { return get(OFF) === "1"; }
  function month() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1); }
  function id() {
    if (sid) return sid;
    var s = get("kf-sid"), m = month();
    if (!s || s.split(":")[0] !== m) { s = m + ":" + Math.random().toString(36).slice(2, 12); set("kf-sid", s); }   // nouveau numéro chaque mois
    return (sid = s.split(":")[1]);
  }
  function dev() { var u = navigator.userAgent; return /iPhone|iPad|iPod/.test(u) ? "ios" : /Android/.test(u) ? "android" : "autre"; }
  function installed() { try { return !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; } catch (e) { return false; } }
  function clean(a) { return String(a == null ? "" : a).replace(/\|/g, "/").slice(0, 60); }

  function ev(code, arg) {
    if (off()) return;
    Q.push(code + "|" + clean(arg) + "|" + Math.round((Date.now() - T0) / 1000));
    if (Q.length >= 25) flush();
  }
  function flush() {
    if (!Q.length || off()) { Q = []; return; }
    var e = Q.splice(0, 40);
    var d = { s: id(), v: String(window.KF_VERSION || "").slice(0, 30), d: dev(), i: installed(), e: e };
    if (typeof window.fbStat === "function") { try { window.fbStat(d).catch(function () { keep(e); }); } catch (x) { keep(e); } }
    else keep(e);
  }
  // hors connexion : on garde pour la prochaine fois (au plus 120 évènements)
  function keep(e) { try { var o = JSON.parse(get("kf-statq") || "[]").concat(e).slice(-120); set("kf-statq", JSON.stringify(o)); } catch (x) {} }
  function resend() { var o; try { o = JSON.parse(get("kf-statq") || "[]"); } catch (x) { o = []; } set("kf-statq", null); if (o.length) { Q = o.concat(Q); flush(); } }

  /* ── Ce qu'on compte (en se branchant sur les fonctions existantes, sans les modifier) ── */
  function wrap(name, before) {
    var f = window[name]; if (typeof f !== "function" || f.__kst) return;
    var w = function () { try { before.apply(this, arguments); } catch (e) {} return f.apply(this, arguments); };
    w.__kst = true; window[name] = w;
  }
  function exName() { try { var d = SEQ_DAYS[seqCurrentDay]; return d && d.exercises[seqExIdx] ? d.exercises[seqExIdx].name : ""; } catch (e) { return ""; } }
  function hook() {
    wrap("showPage", function (p) { ev("p", p); });
    wrap("_launchSeq", function (day) { finished = false; ev("s", day); });
    wrap("seqExDone", function () { ev("x", exName()); });
    wrap("seqSkipExercise", function () { ev("k", exName()); });
    wrap("seqFinish", function () { finished = true; ev("f", Math.round((Date.now() - (window.seqStartTime || Date.now())) / 60000)); });
    wrap("closeSeq", function () { var o = $("seq-overlay"); if (o && o.classList.contains("open") && !finished) ev("q", exName()); });
    wrap("rgOpenPain", function () { ev("m", (window.rgState && rgState.exName) || exName()); });
    if (window.KineCamera && KineCamera.open && !KineCamera.open.__kst) { var co = KineCamera.open; KineCamera.open = function () { ev("c", ""); return co.apply(this, arguments); }; KineCamera.open.__kst = true; }
    if (window.KineCompose && KineCompose.open && !KineCompose.open.__kst) { var cp = KineCompose.open; KineCompose.open = function () { ev("n", ""); return cp.apply(this, arguments); }; KineCompose.open.__kst = true; }
  }

  function start() {
    hook();
    ev("o", installed() ? "app" : "web");
    setInterval(flush, 60000);
    document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); });
    window.addEventListener("pagehide", flush);
    window.addEventListener("kf-fb-ready", resend); if (typeof window.fbStat === "function") resend();
  }
  if (document.readyState === "complete") setTimeout(start, 0); else window.addEventListener("load", function () { setTimeout(start, 0); });

  /* ── Lecture pour le kiné : un tableau de bord simple ── */
  var LBL = { home: "Aujourd'hui", guide: "Exercices", mes: "Ma séance", progress: "Progrès", community: "Communauté" };
  function top(o, n) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n || 5); }
  function list(t, rows, unit) {
    if (!rows.length) return "<div class='kst-blk'><h3>" + t + "</h3><p class='kst-none'>Rien pour l'instant</p></div>";
    var mx = rows[0][1] || 1;
    return "<div class='kst-blk'><h3>" + t + "</h3>" + rows.map(function (r) {
      return "<div class='kst-row'><span>" + esc(r[0] || "—") + "</span><b>" + r[1] + (unit || "") + "</b><i style='width:" + Math.round(r[1] / mx * 100) + "%'></i></div>";
    }).join("") + "</div>";
  }
  function admin() {
    var el = $("kf-stats"); if (!el) { el = document.createElement("div"); el.id = "kf-stats"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Statistiques"); document.body.appendChild(el); }
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick=\"document.getElementById('kf-stats').classList.remove('open')\" aria-label='Retour'>←</button>" +
      "<h2 class='kfb-h'>Statistiques</h2><p class='kfb-p' id='kst-st'>Chargement…</p><div id='kst-b'></div></div>";
    el.classList.add("open");
    if (typeof window.fbStats !== "function" || !(window.fbUser && fbUser.isAdmin)) { $("kst-st").textContent = "Connectez-vous avec votre compte kiné (Communauté, en haut) pour lire les statistiques."; return; }
    fbStats(30).then(function (docs) {
      var now = Date.now(), wk = now - 7 * 864e5, P7 = {}, P30 = {}, open7 = 0, st = 0, fin = 0, quit = {}, skip = {}, pain = {}, pages = {}, durs = [], devs = {}, inst = {}, cam = 0, comp = 0;
      docs.forEach(function (d) {
        var t = d.t && d.t.toDate ? d.t.toDate().getTime() : now; P30[d.s] = 1; if (t >= wk) P7[d.s] = 1;
        devs[d.s] = d.d; inst[d.s] = d.i;
        (d.e || []).forEach(function (x) {
          var p = String(x).split("|"), c = p[0], a = p[1];
          if (c === "o" && t >= wk) open7++;
          else if (c === "s") st++;
          else if (c === "f") { fin++; if (+a) durs.push(+a); }
          else if (c === "q") quit[a] = (quit[a] || 0) + 1;
          else if (c === "k") skip[a] = (skip[a] || 0) + 1;
          else if (c === "m") pain[a] = (pain[a] || 0) + 1;
          else if (c === "p") pages[LBL[a] || a] = (pages[LBL[a] || a] || 0) + 1;
          else if (c === "c") cam++;
          else if (c === "n") comp++;
        });
      });
      var n30 = Object.keys(P30).length, dv = { ios: 0, android: 0, autre: 0 }, ni = 0;
      Object.keys(devs).forEach(function (s) { dv[devs[s]] = (dv[devs[s]] || 0) + 1; if (inst[s]) ni++; });
      var med = durs.sort(function (a, b) { return a - b; })[Math.floor(durs.length / 2)];
      $("kst-st").textContent = n30 ? "Sur les 30 derniers jours. Chaque personne est un numéro au hasard, renouvelé chaque mois : aucun nom." : "Aucune donnée pour l'instant : elles arrivent au fil de l'utilisation.";
      if (!n30) return;
      $("kst-b").innerHTML =
        "<div class='kst-kpis'>" +
          "<div><b>" + Object.keys(P7).length + "</b><small>personnes cette semaine</small></div>" +
          "<div><b>" + n30 + "</b><small>personnes sur 30 jours</small></div>" +
          "<div><b>" + open7 + "</b><small>ouvertures cette semaine</small></div>" +
          "<div><b>" + st + "</b><small>séances commencées</small></div>" +
          "<div><b>" + fin + "</b><small>séances terminées" + (st ? " (" + Math.round(fin / st * 100) + " %)" : "") + "</small></div>" +
          "<div><b>" + (med ? med + " min" : "—") + "</b><small>durée habituelle</small></div>" +
        "</div>" +
        list("Où les séances s'arrêtent", top(quit)) +
        list("Exercices passés", top(skip)) +
        list("« J'ai mal » touché", top(pain)) +
        list("Écrans les plus ouverts", top(pages)) +
        "<div class='kst-blk'><h3>Téléphones</h3><p class='kst-none'>iPhone " + dv.ios + " · Android " + dv.android + (dv.autre ? " · ordinateur " + dv.autre : "") + " · appli installée chez " + ni + " sur " + n30 + "</p>" +
        "<p class='kst-none'>Caméra ouverte " + cam + " fois · séance composée " + comp + " fois</p></div>";
    }).catch(function () { $("kst-st").textContent = "Lecture impossible : vérifiez la connexion et le compte kiné."; });
  }

  window.KineStats = {
    ev: ev, flush: flush, admin: admin,
    off: off,
    toggle: function () { if (off()) set(OFF, null); else { set(OFF, "1"); Q = []; set("kf-statq", null); } return !off(); },
    label: function () { return off() ? "coupées" : "activées"; }
  };
})();
