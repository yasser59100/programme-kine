/* ═══════════ KinéForce — célébration de fin de séance ═══════════
   Avant le bilan, un vrai moment de réussite : Yass applaudit, des confettis tombent,
   la semaine se remplit d'une séance de plus. Puis « Faire mon bilan » ouvre le bilan habituel. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function list() { try { return typeof sessions !== "undefined" && sessions ? sessions : JSON.parse(localStorage.getItem("kf-sessions") || "[]"); } catch (e) { return []; } }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function monday() { var d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
  var PER_WEEK = 5;

  function stats() {
    var ss = list(), mon = monday();
    var week = ss.filter(function (s) { return String(s.date).slice(0, 10) >= mon; }).length + 1;   // + la séance qui vient de finir
    var total = ss.length + 1;
    var w = window.KineProgress ? KineProgress.week() : 1;
    var title = total === 1 ? "Première séance, bravo !"
      : week === PER_WEEK ? "Semaine complète !"
      : week > PER_WEEK ? "Encore une, quelle régularité !"
      : "Séance terminée, bravo !";
    var sub = total === 1 ? "Le plus dur, c'est de commencer. C'est fait."
      : week === PER_WEEK ? "Les 5 séances de la semaine sont faites. Ton corps va adorer."
      : week > PER_WEEK ? "Tu dépasses l'objectif de la semaine. Pense aussi à récupérer."
      : "Plus que " + (PER_WEEK - week) + " séance" + (PER_WEEK - week > 1 ? "s" : "") + " pour boucler la semaine.";
    return { week: Math.min(week, PER_WEEK), weekRaw: week, total: total, w: w, title: title, sub: sub };
  }

  /* ── Confettis (légers, coupés si l'utilisateur préfère moins d'animations) ── */
  function confetti(host) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas"); c.className = "cele-confetti"; host.appendChild(c);
    var W = c.width = host.clientWidth * (window.devicePixelRatio || 1), H = c.height = host.clientHeight * (window.devicePixelRatio || 1);
    var g = c.getContext("2d"), cols = ["#4B5BFF", "#7B88FF", "#3CF2B0", "#FFC56B", "#FF5C73", "#FFFFFF"], P = [];
    for (var i = 0; i < 110; i++) P.push({ x: Math.random() * W, y: -Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 2.2, vy: 2 + Math.random() * 3.5,
      r: 4 + Math.random() * 6, a: Math.random() * 6.3, va: (Math.random() - 0.5) * 0.25, c: cols[i % cols.length] });
    var t0 = performance.now();
    (function tick(now) {
      if (!c.isConnected) return;
      var k = (now - t0) / 1000; g.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        p.x += p.vx; p.y += p.vy * (window.devicePixelRatio || 1); p.a += p.va; p.vx *= 0.995;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = Math.max(0, 1 - Math.max(0, k - 2.6) / 0.8);
        g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore();
      });
      if (k < 3.4) requestAnimationFrame(tick); else c.remove();
    })(t0);
  }

  /* ── Yass applaudit ── */
  function cheer(stage) {
    if (!window.KineAvatar || !window.KineMascotte) return false;
    try { KineMascotte.portrait(); } catch (e) {}           // s'assure que Yass est prêt
    if (!KineAvatar.show(stage, "__mascotte")) return false;
    var seq = [["cheer1", 0.45], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.35], ["open", 0.7]], i = 0;
    (function next() {
      if (!stage.isConnected || i >= seq.length) return;
      var s = seq[i++]; KineAvatar.step({ pose: s[0], dur: s[1] }); setTimeout(next, s[1] * 1000);
    })();
    return true;
  }

  function show(duration, done) {
    var st = stats(), day = (window.SEQ_DAYS && SEQ_DAYS[seqCurrentDay]) ? SEQ_DAYS[seqCurrentDay].label.replace(" — ", " · ") : "";
    var el = $("kf-cele");
    if (!el) { el = document.createElement("div"); el.id = "kf-cele"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Séance terminée"); document.body.appendChild(el); }
    var dots = "";
    for (var i = 1; i <= PER_WEEK; i++) dots += "<i class='" + (i < st.week ? "on" : i === st.week ? "on new" : "") + "'></i>";
    el.innerHTML =
      "<div class='cele-in'>" +
        "<div class='cele-stage' id='cele-stage'></div>" +
        "<h1 class='cele-h'>" + esc(st.title) + "</h1>" +
        "<p class='cele-sub'>" + esc(st.sub) + "</p>" +
        "<div class='cele-week' aria-label='" + st.weekRaw + " séance" + (st.weekRaw > 1 ? "s" : "") + " cette semaine sur " + PER_WEEK + "'>" + dots + "</div>" +
        "<div class='cele-stats'>" +
          "<div><b>" + Math.min(st.weekRaw, 99) + "/" + PER_WEEK + "</b><span>cette semaine</span></div>" +
          "<div><b>" + (duration || 1) + " min</b><span>durée</span></div>" +
          "<div><b>" + st.total + "</b><span>séance" + (st.total > 1 ? "s" : "") + " en tout</span></div>" +
        "</div>" +
        "<button class='seq-btn-main cele-go' id='cele-go'>Faire mon bilan</button>" +
      "</div>";
    el.classList.add("open");
    if (!cheer($("cele-stage"))) $("cele-stage").innerHTML = "<div class='cele-trophy' aria-hidden='true'>🏆</div>";
    confetti(el);
    $("cele-go").onclick = function () {
      el.classList.remove("open");
      if (window.KineAvatar) { try { KineAvatar.hide(); } catch (e) {} }
      setTimeout(function () { el.innerHTML = ""; }, 300);
      done();
    };
  }

  // On s'insère juste avant le bilan de fin de séance
  function hook() {
    if (typeof window.renderSeqBilan !== "function" || window.renderSeqBilan.__cele) return !!(window.renderSeqBilan && window.renderSeqBilan.__cele);
    var base = window.renderSeqBilan;
    window.renderSeqBilan = function (duration) {
      var args = arguments, self = this;
      try { show(duration, function () { base.apply(self, args); }); }
      catch (e) { base.apply(self, args); }
    };
    window.renderSeqBilan.__cele = true;
    return true;
  }
  if (!hook()) document.addEventListener("DOMContentLoaded", hook);
  window.KineCelebration = { show: show };
})();
