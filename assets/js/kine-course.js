/* ═══════════ KinéForce — journal de course (programme coureur) ═══════════
   Chaque sortie : durée (et distance si on veut), effort, douleur pendant, puis douleur le lendemain matin.
   La charge se suit en minutes par semaine, comparée aux 4 semaines d'avant : l'appli prévient quand
   ça monte trop vite (« trop, trop vite ») ou quand la douleur dépasse les repères.
   Tout reste sur le téléphone. */
var KineCourse = (function () {
  "use strict";
  var KEY = "kf-runs", DAY = 86400000;
  var ZONES = ["", "Genou", "Tibia", "Mollet ou tendon d'Achille", "Pied", "Hanche ou fesse", "Dos", "Autre"];
  var EFF = ["", "Très facile", "Facile", "Modéré", "Difficile", "Très difficile"];
  var MO = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var WD = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function iso(d) { d = new Date(d); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function runs() { try { var a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(a) { a.sort(function (x, y) { return x.d < y.d ? 1 : x.d > y.d ? -1 : (y.t || 0) - (x.t || 0); }); try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 400))); } catch (e) {} }
  function monday(d) { d = new Date(d); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  function fmtD(s) { var d = parse(s); return WD[d.getDay()] + " " + d.getDate() + " " + MO[d.getMonth()]; }
  function km(v) { return (Math.round(v * 10) / 10).toString().replace(".", ","); }

  /* ════════ Charge et repères ════════ */
  // minutes (et km) par semaine, de la plus ancienne à la semaine en cours
  function weeks(n) {
    var a = runs(), m0 = monday(Date.now()), out = [];
    for (var i = n - 1; i >= 0; i--) {
      var s = new Date(m0); s.setDate(m0.getDate() - 7 * i); var e = new Date(s); e.setDate(s.getDate() + 7);
      var S = iso(s), E = iso(e), w = a.filter(function (r) { return r.d >= S && r.d < E; });
      out.push({ start: S, min: w.reduce(function (t, r) { return t + (+r.min || 0); }, 0), km: w.reduce(function (t, r) { return t + (+r.km || 0); }, 0), n: w.length });
    }
    return out;
  }
  // Semaine en cours comparée à la moyenne des 4 semaines d'avant (semaines vides comprises dès qu'on a de l'historique)
  function load() {
    var W = weeks(5), cur = W[4], prev = W.slice(0, 4), hist = prev.filter(function (w) { return w.n; }).length;
    if (hist < 2) return { level: "new", cur: cur, avg: null };
    var avg = prev.reduce(function (t, w) { return t + w.min; }, 0) / 4;
    var r = avg > 0 ? cur.min / avg : (cur.min ? 9 : 0);
    return { level: r > 1.3 ? "red" : r > 1.1 ? "orange" : "green", ratio: r, cur: cur, avg: avg };
  }
  // Douleur des 7 derniers jours : la plus forte, pendant ou le lendemain ; pire le lendemain ?
  function pain() {
    var since = iso(Date.now() - 7 * DAY), a = runs().filter(function (r) { return r.d >= since; });
    var worst = 0, worse = false, zone = "";
    a.forEach(function (r) {
      var p = Math.max(+r.pain || 0, r.next == null ? 0 : +r.next);
      if (p > worst) { worst = p; zone = r.zone || ""; }
      if (r.next != null && +r.next > (+r.pain || 0) && +r.next >= 3) worse = true;
    });
    return { worst: worst, worse: worse, zone: zone, level: worst >= 6 || worse ? "red" : worst >= 4 ? "orange" : "green" };
  }
  // Sortie d'hier ou d'avant-hier dont on n'a pas encore la douleur du lendemain matin
  function pending() {
    var today = iso(Date.now()), lim = iso(Date.now() - 3 * DAY);
    return runs().filter(function (r) { return r.next == null && r.d < today && r.d >= lim; })[0] || null;
  }

  /* ════════ Écran ════════ */
  function sheet() {
    var el = $("kco-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kco-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Journal de course"); document.body.appendChild(el); }
    return el;
  }
  function close() { var el = $("kco-sheet"); if (el) el.classList.remove("open"); try { if (window.KineLayout) KineLayout.render(); } catch (e) {} }
  function msgLoad(L) {
    var m = Math.round(L.cur.min);
    if (L.level === "new") return ["kco-n", "On apprend ton rythme", "Note tes sorties pendant deux semaines : l'appli pourra ensuite te dire si tu augmentes trop vite."];
    var pct = Math.round((L.ratio - 1) * 100), avg = Math.round(L.avg);
    if (L.level === "red") return ["kco-r", "Trop, trop vite", m + " min cette semaine contre " + avg + " min en moyenne : +" + pct + " %. C'est la première cause de blessure en course. Lève le pied : garde plutôt le niveau des semaines précédentes."];
    if (L.level === "orange") return ["kco-o", "Ça monte", m + " min cette semaine contre " + avg + " min en moyenne (+" + pct + " %). Reste à ce niveau la semaine prochaine avant d'augmenter encore."];
    return ["kco-g", "Progression tranquille", m + " min cette semaine, pour " + avg + " min en moyenne les 4 semaines d'avant. Tu peux continuer ainsi."];
  }
  function msgPain(P) {
    if (P.level === "red") return ["kco-r", "Douleur à surveiller", (P.worse ? "La douleur était plus forte le lendemain matin. " : "Douleur de " + P.worst + " sur 10 cette semaine" + (P.zone ? " (" + P.zone.toLowerCase() + ")" : "") + ". ") + "Réduis la durée et l'intensité des sorties, et parles-en à ton kiné."];
    if (P.level === "orange") return ["kco-o", "Douleur modérée", "Douleur de " + P.worst + " sur 10 cette semaine" + (P.zone ? " (" + P.zone.toLowerCase() + ")" : "") + ". C'est acceptable si elle est revenue à la normale le lendemain matin et n'augmente pas d'une sortie à l'autre."];
    return null;
  }
  function chart() {
    var W = weeks(8), mx = Math.max(30, Math.max.apply(null, W.map(function (w) { return w.min; })));
    return "<div class='kco-bars'>" + W.map(function (w, i) {
      var d = parse(w.start), last = i === W.length - 1;
      return "<div class='" + (last ? "hi" : "") + "'><em>" + (w.min ? Math.round(w.min) : "") + "</em><i style='height:" + Math.max(3, Math.round(w.min / mx * 100)) + "%'></i><span>" + (last ? "cette sem." : d.getDate() + " " + MO[d.getMonth()]) + "</span></div>";
    }).join("") + "</div><div class='kf-sub'>Minutes de course par semaine</div>";
  }
  function open() {
    var a = runs(), L = load(), P = pain(), q = pending(), ml = msgLoad(L), mp = msgPain(P);
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineCourse.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Mon journal de course</div><div class='kf-sub'>Note chaque sortie en 20 secondes. Ton kiné pourra voir avec toi comment la charge évolue.</div></div>" +
      (q ? "<div class='kco-ask'><b>Et ce matin ?</b><span>Après ta sortie de " + esc(fmtD(q.d)) + " (douleur " + (+q.pain || 0) + " sur 10 pendant), quelle douleur ressens-tu au réveil ?</span>" +
        "<div class='kco-scale'>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return "<button onclick='KineCourse.next(\"" + q.id + "\"," + v + ")'>" + v + "</button>"; }).join("") + "</div></div>" : "") +
      "<div class='kco-kpi'><div><b>" + Math.round(L.cur.min) + "</b><small>minutes cette semaine</small></div><div><b>" + L.cur.n + "</b><small>sortie" + (L.cur.n > 1 ? "s" : "") + "</small></div>" +
        "<div><b>" + (L.cur.km ? km(L.cur.km) : "—") + "</b><small>km</small></div></div>" +
      "<div class='kco-msg " + ml[0] + "'><b>" + esc(ml[1]) + "</b>" + esc(ml[2]) + "</div>" +
      (mp ? "<div class='kco-msg " + mp[0] + "'><b>" + esc(mp[1]) + "</b>" + esc(mp[2]) + "</div>" : "") +
      chart() +
      "<button class='seq-btn-main' onclick='KineCourse.add()'>＋ Ajouter une sortie</button>" +
      (a.length ? "<div class='kf-phase' style='color:var(--text2)'>Mes sorties</div>" + a.slice(0, 20).map(function (r) {
        var p = Math.max(+r.pain || 0, r.next == null ? 0 : +r.next), cls = p >= 6 ? "r" : p >= 4 ? "o" : "";
        return "<div class='kco-row'><span class='kco-d'>" + esc(fmtD(r.d)) + "</span><span class='kco-t'><b>" + (+r.min || 0) + " min" + (r.km ? ", " + km(+r.km) + " km" : "") + "</b><small>" + esc(EFF[+r.eff] || "") +
          (r.pain != null ? ", douleur " + (+r.pain) + (r.next != null ? " puis " + r.next + " au réveil" : "") : "") + (r.zone ? " (" + esc(r.zone.toLowerCase()) + ")" : "") + "</small></span>" +
          (cls ? "<i class='kco-dot " + cls + "'></i>" : "") + "<button class='kc-mini' aria-label='Supprimer cette sortie' onclick='KineCourse.del(\"" + r.id + "\")'>✕</button></div>";
      }).join("") : "<p class='kf-sub'>Aucune sortie notée pour l'instant.</p>") +
      "<details class='th-card'><summary>Les repères utilisés</summary><div>La charge est la durée de course de la semaine, comparée à la moyenne des 4 semaines d'avant. Jusqu'à +10 % : vert. De +10 à +30 % : orange. Au-delà : rouge. Ce sont des repères prudents, pas des règles absolues : ton kiné peut les adapter à toi.</div></details>" +
      "</div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  var F = null;
  function add() {
    F = { d: iso(Date.now()), min: 30, km: "", eff: 3, pain: 0, zone: "" };
    form();
  }
  function form() {
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineCourse.open()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Nouvelle sortie</div>" +
      "<label class='ko-f'><span>Date</span><input type='date' id='kco-d' value='" + F.d + "' max='" + iso(Date.now()) + "'></label>" +
      "<label class='kcr-sl'><span>Durée<b id='kco-vmin'>" + F.min + " min</b></span><input type='range' id='kco-min' min='5' max='240' step='5' value='" + F.min + "' oninput='document.getElementById(\"kco-vmin\").textContent=this.value+\" min\"'></label>" +
      "<label class='ko-f'><span>Distance (facultatif)</span><input type='text' id='kco-km' inputmode='decimal' maxlength='5' placeholder='en km, par exemple 7,5' value='" + esc(F.km) + "'></label>" +
      "<div class='ko-f'><span>Effort</span><div class='kc-seg kco-eff' id='kco-eff' data-v='" + F.eff + "'>" + [1, 2, 3, 4, 5].map(function (v) {
        return "<button type='button' class='" + (F.eff === v ? "on" : "") + "' onclick='KineCourse.eff(this," + v + ")'>" + EFF[v] + "</button>"; }).join("") + "</div></div>" +
      "<label class='kcr-sl'><span>Douleur pendant la sortie<b id='kco-vp'>" + F.pain + " sur 10</b></span><input type='range' id='kco-p' min='0' max='10' step='1' value='" + F.pain + "' oninput='KineCourse.painIn(this.value)'></label>" +
      "<label class='ko-f' id='kco-zw'" + (F.pain ? "" : " hidden") + "><span>Où ?</span><select id='kco-z'>" + ZONES.map(function (z) { return "<option value='" + esc(z) + "'" + (F.zone === z ? " selected" : "") + ">" + (z || "Choisir") + "</option>"; }).join("") + "</select></label>" +
      "<p class='kc-err' id='kco-err'></p></div>" +
      "<div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineCourse.save()'>Enregistrer la sortie</button></div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function saveRun() {
    var d = $("kco-d").value || iso(Date.now()), min = +$("kco-min").value, k = String($("kco-km").value || "").replace(",", ".");
    if (d > iso(Date.now())) { $("kco-err").textContent = "La date ne peut pas être dans le futur."; return; }
    var r = { id: Date.now().toString(36), t: Date.now(), d: d, min: min, eff: +$("kco-eff").getAttribute("data-v") || 3, pain: +$("kco-p").value || 0 };
    if (k && +k > 0) r.km = Math.round(+k * 10) / 10;
    if (r.pain) r.zone = $("kco-z").value || "";
    var a = runs(); a.push(r); save(a);
    if (window.KineStats) KineStats.ev("p", "course");
    open();
  }
  // Présentation, au premier passage en mode coureur
  function intro() {
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineCourse.close()' aria-label='Fermer'>←</button>" +
      "<div><div class='kf-h1'>Nouveau : ton journal de course</div><div class='kf-sub'>Le mode coureur ajoute un carnet pour suivre tes sorties. C'est ce qui protège le plus des blessures.</div></div>" +
      "<div class='kco-intro'>" +
        "<div><b>1</b><span><strong>Après chaque sortie</strong>Durée, effort et douleur éventuelle : 20 secondes.</span></div>" +
        "<div><b>2</b><span><strong>Le lendemain matin</strong>L'appli te demande comment va la douleur au réveil.</span></div>" +
        "<div><b>3</b><span><strong>Elle te prévient</strong>Si tes minutes de course montent trop vite, ou si la douleur dépasse les repères.</span></div>" +
      "</div><p class='kf-sub'>Tu le retrouves sur l'accueil et dans l'onglet Exercices. Tout reste sur ton téléphone.</p></div>" +
      "<div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineCourse.add()'>Noter ma dernière sortie</button><button class='seq-btn-secondary' onclick='KineCourse.close()'>Plus tard</button></div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  return {
    open: open, close: close, add: add, intro: intro, save: saveRun, load: load, pain: pain, pending: pending, weeks: weeks,
    eff: function (btn, v) { var s = btn.parentNode; s.setAttribute("data-v", v); Array.prototype.forEach.call(s.children, function (b) { b.classList.toggle("on", b === btn); }); },
    painIn: function (v) { $("kco-vp").textContent = v + " sur 10"; var z = $("kco-zw"); if (z) z.hidden = !+v; },
    next: function (id, v) { var a = runs(); a.forEach(function (r) { if (r.id === id) r.next = v; }); save(a); open(); },
    del: function (id) { save(runs().filter(function (r) { return r.id !== id; })); open(); }
  };
})();
window.KineCourse = KineCourse;
