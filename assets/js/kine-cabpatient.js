/* KinéForce — espace patient du cabinet : 4 onglets (Aujourd'hui, Séances, Apprendre, Moi),
   douleur du matin avec un conseil adapté, la séance du kiné, la semaine.
   S'active pour un patient relié à son kiné, hors parcours hôpital (qui a son propre espace). */
(function () {
  "use strict";
  function $(i) { return document.getElementById(i); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function jget(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var PAGES = { "cab-today": "today", "cab-learn": "learn" }, NAVSAVE = null;

  function isCab() { var s = jget("kf-cab", null); return !!(s && s.pid && s.d && s.d.parcours && s.d.parcours !== "hopital"); }
  function kineSeance() { return (jget("kf-custom", []) || []).filter(function (x) { return x && x.id === "kine" && x.ex && x.ex.length; })[0] || null; }
  function week() {
    var ss = jget("kf-sessions", []), d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); var mon = iso(d), days = {}, n = 0;
    ss.forEach(function (x) { var k = String(x.date).slice(0, 10); if (k >= mon) { days[k] = 1; n++; } });
    return { n: n, days: days, mon: d };
  }

  /* ── Douleur du matin et conseil adapté ── */
  var NIV = ["Aucune douleur", "Presque rien", "Très légère", "Légère", "Gênante", "Moyenne", "Marquée", "Forte", "Très forte", "Intense", "Insupportable"];
  function advice(v) {
    if (v == null) return null;
    if (v <= 1) return { t: "Parfait, tu peux faire ta séance normalement." };
    if (v <= 3) return { t: "Une petite gêne, c'est courant. Fais ta séance normalement et regarde si elle change en bougeant." };
    if (v <= 6) return { t: "Fais ta séance un cran plus doucement : moins d'amplitude, moins de charge. Si la douleur monte, arrête l'exercice." };
    return { t: "Aujourd'hui, ménage ta zone : pas de séance intense. Une marche tranquille est possible si elle ne fait pas mal. Dis-le à ton kiné.", write: true };
  }
  // vert (0) → jaune → rouge (10), même teinte que le curseur
  function colorOf(v) { var h = Math.round(v <= 5 ? 140 - 16.8 * v : 56 - 11.2 * (v - 5)); return "hsl(" + h + ",72%," + (v < 4 ? 40 : 46) + "%)"; }
  function today() { return (jget("kf-checkin", {})[iso(new Date())] || {}); }
  function painHtml() {
    var p = today().pain, set = p != null, v = set ? +p : 0, a = advice(set ? v : null);
    var h = "<section class='kh-body kc-pain kh-in' style='--i:1'><div class='kh-body-h'>Ta douleur ce matin ?</div><div class='kh-body-s'>Glisse le curseur : ton kiné le voit avant ton rendez-vous.</div>" +
      "<div class='kc-read' id='kc-read' style='--c:" + colorOf(v) + "'><b id='kc-n'>" + (set ? v : "–") + "</b><span id='kc-t'>" + (set ? NIV[v] : "Pas encore répondu") + "</span></div>" +
      "<input type='range' class='kc-range" + (set ? " set" : "") + "' id='kc-range' min='0' max='10' step='1' value='" + v + "' aria-label='Douleur de 0 à 10' style='--c:" + colorOf(v) + ";--p:" + (v * 10) + "%' oninput='KineCabPatient.live(this.value)' onchange='KineCabPatient.pain(this.value)'>" +
      "<div class='kc-ends'><span>Aucune</span><span>La pire imaginable</span></div>" +
      "<div class='kc-adv' id='kc-adv'" + (a ? "" : " hidden") + ">" + (a ? advHtml(a) : "") + "</div></section>";
    return h;
  }
  function advHtml(a) { return "<p>" + esc(a.t) + "</p>" + (a.write ? "<button type='button' class='kc-w' onclick='KineMonSuivi.msg()'>Écrire à mon kiné</button>" : ""); }
  function live(v) {
    v = +v; var r = $("kc-range"), rd = $("kc-read"), c = colorOf(v);
    if (r) { r.classList.add("set"); r.style.setProperty("--c", c); r.style.setProperty("--p", v * 10 + "%"); }
    if (rd) rd.style.setProperty("--c", c);
    var n = $("kc-n"), t = $("kc-t"); if (n) n.textContent = v; if (t) t.textContent = NIV[v];
  }
  function pain(v) {
    v = +v; live(v);
    var m = jget("kf-checkin", {}), k = iso(new Date()); m[k] = m[k] || {}; m[k].pain = v; jset("kf-checkin", m);
    var box = $("kc-adv"), a = advice(v); if (box && a) { box.hidden = false; box.innerHTML = advHtml(a); }
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    try { var st = jget("kf-cab", null); if (st && st.pid && window.KineMonSuivi && KineMonSuivi.sync) KineMonSuivi.sync(); } catch (e) {}
  }

  /* ── Aujourd'hui ── */
  function nbx(n) { return n + " exercice" + (n > 1 ? "s" : ""); }
  function heroHtml() {
    var k = kineSeance(), st = jget("kf-cab", {}), now = new Date(), t = iso(now);
    var done = jget("kf-sessions", []).some(function (x) { return String(x.date).slice(0, 10) === t && /kin[ée]/i.test(String(x.seance || "")); });
    var yass = "<span class='kh-yw'><button type='button' class='lu-yass lu-ys' aria-label='Yass' onclick='KineLayout.yass(this)' data-g='salut'></button></span>";
    if (k) return "<section class='kh-hero kc-h kh-in' style='--i:0'>" + yass +
      "<div class='kh-kick'>" + (done ? "Faite aujourd'hui, bravo !" : "La séance de ton kiné") + "</div><div class='kh-big'>" + nbx(k.ex.length) + "</div>" +
      "<div class='kh-meta'>" + esc(k.ex.slice(0, 3).join(", ") + (k.ex.length > 3 ? "…" : "")) + "</div>" +
      "<button type='button' class='kh-go' onclick=\"KineCompose.start('kine')\">" + (done ? "La refaire" : "Commencer") + "<span aria-hidden='true'>›</span></button></section>";
    return "<section class='kh-hero kc-h kh-in' style='--i:0'>" + yass + "<div class='kh-kick'>Pas encore de séance de ton kiné</div><div class='kh-big'>Compose la tienne</div>" +
      "<div class='kh-meta'>Tu choisis, Yass s'occupe de l'échauffement et de l'ordre.</div>" +
      "<button type='button' class='kh-go' onclick=\"showPage('mes');window.KineCompose&&KineCompose.tab()\">Composer ma séance<span aria-hidden='true'>›</span></button></section>";
  }
  function repriseHtml() {
    var R = null; try { R = window.KineReprise && KineReprise.active ? KineReprise.active() : null; } catch (e) {}
    if (!R || R.e.fini) return "";
    var sub = R.e.wait ? "Note ta douleur de ce matin" : R.e.nextD ? "Prochaine séance à partir du " + String(R.e.nextD).split("-").reverse().slice(0, 2).join("/") : esc(R.txt);
    return "<button class='lu-rp kh-in' style='--i:1' onclick=\"" + (R.e.wait || R.e.nextD ? "showPage('monkine')" : "KineReprise.go()") + "\"><span><b>Reprise de la course · palier " + R.e.palier + " sur 10</b><em>" + sub + "</em></span><i aria-hidden='true'>›</i></button>";
  }
  // En tête de l'onglet Séances : la séance envoyée par le kiné, prête à lancer
  function seanceHero() {
    var k = kineSeance(); if (!k) return "";
    var done = jget("kf-sessions", []).some(function (x) { return String(x.date).slice(0, 10) === iso(new Date()) && /kin[ée]/i.test(String(x.seance || "")); });
    return "<section class='kc-ses'><div class='kc-ses-k'>" + (done ? "Faite aujourd'hui" : "Envoyée par ton kiné") + "</div><div class='kc-ses-t'>" + nbx(k.ex.length) + "</div>" +
      "<ol class='kc-ses-l'>" + k.ex.slice(0, 5).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + (k.ex.length > 5 ? "<li class='more'>+ " + (k.ex.length - 5) + " autres</li>" : "") + "</ol>" +
      "<button type='button' class='kc-ses-go' onclick=\"KineCompose.start('kine')\">" + (done ? "La refaire" : "Lancer la séance") + "<span aria-hidden='true'>›</span></button></section>";
  }
  function rdvHtml() {
    var d = (jget("kf-cab", {}).d || {}), n = d.next; if (!n || String(n) < iso(new Date())) return "";
    var p = String(n).slice(0, 10).split("-"), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    return "<div class='kc-rdv kh-in' style='--i:3'><span>Prochain rendez-vous</span><b>" + cap(JOURS[dt.getDay()]) + " " + dt.getDate() + " " + MOIS[dt.getMonth()] + "</b></div>";
  }
  function weekHtml() {
    var wk = week(), lab = ["L", "M", "M", "J", "V", "S", "D"], td = iso(new Date());
    var h = "<section class='kh-week kh-in' style='--i:2'><div class='kh-wk-h'><b>Ma semaine</b><span>" + wk.n + " séance" + (wk.n > 1 ? "s" : "") + "</span></div><div class='kh-dots'>";
    for (var i = 0; i < 7; i++) { var d = new Date(wk.mon.getTime()); d.setDate(d.getDate() + i); var k = iso(d), dn = !!wk.days[k]; h += "<span class='kh-dot" + (dn ? " ok" : "") + (k === td ? " now" : "") + "' style='--d:" + (i * 0.07 + 0.5) + "s'><i aria-hidden='true'>" + (dn ? "✓" : "") + "</i><em>" + lab[i] + "</em></span>"; }
    return h + "</div><div class='kh-wk-s'>" + (wk.n === 0 ? "Une première séance cette semaine ? Je suis avec toi." : "Bravo, continue comme ça.") + "</div></section>";
  }
  function links() {
    return "<div class='kc-links kh-in' style='--i:4'>" +
      "<button type='button' class='kms-write' onclick='KineMonSuivi.msg()'><i aria-hidden='true'><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'/></svg></i><div><b>Écrire à mon kiné</b><span>Une question, un souci, une nouvelle</span></div></button>" +
      "<button type='button' class='kms-write' onclick=\"showPage('guide')\"><i aria-hidden='true'><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11'/></svg></i><div><b>Programme général</b><span>Les séances sur 4 semaines et les exercices</span></div></button>" +
      "<button type='button' class='kms-write' onclick=\"showPage('suivi')\"><i aria-hidden='true'><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 17l6-6 4 4 8-8M15 7h6v6'/></svg></i><div><b>Mes progrès</b><span>Ma douleur, ma régularité, mes courbes</span></div></button></div>";
  }
  function todayHtml() {
    var d = new Date();
    return "<div class='kh-wrap'><div class='kc-date'>" + JOURS[d.getDay()] + " " + d.getDate() + " " + MOIS[d.getMonth()] + "</div><h1 class='lx-title'>Aujourd'hui</h1>" + heroHtml() + repriseHtml() + painHtml() + weekHtml() + rdvHtml() + links() + "</div>";
  }

  /* ── Apprendre : de courtes lectures utiles, avec suivi des lectures ── */
  var READS = [
    { t: "Douleur ne veut pas dire dégât", s: "Une gêne légère pendant un exercice est fréquente. En général, si elle redescend dans la journée, c'est acceptable. Si elle dure, augmente ou te réveille la nuit, parles-en à ton kiné.", min: 1 },
    { t: "Bouger aide à récupérer", s: "Le repos complet pendant longtemps ralentit la récupération. Le plus souvent, on bouge dans la zone sans douleur et on augmente peu à peu. Ton programme est fait pour ça.", min: 1 },
    { t: "Un peu souvent, plutôt que beaucoup rarement", s: "Ton corps s'adapte à la régularité. Trois séances courtes dans la semaine valent mieux qu'une seule très longue, suivie de deux semaines de pause.", min: 1 },
    { t: "Le sommeil fait partie du traitement", s: "C'est pendant la nuit que les muscles et les tissus se réparent. Une mauvaise nuit peut rendre la douleur plus présente le lendemain. Ce n'est pas un signe que tu régresses.", min: 1 },
    { t: "On augmente la charge peu à peu", s: "Muscles, tendons et os s'adaptent à des efforts qui montent progressivement. C'est pour ça que ton kiné change tes exercices par étapes, et pas tout d'un coup.", min: 1 },
    { t: "Un exercice facile n'est pas inutile", s: "Bien faire le geste, lentement et sans compenser, prépare ton corps aux exercices plus difficiles. La qualité passe avant le nombre de répétitions.", min: 1 },
    { t: "Respirer pendant l'effort", s: "Bloquer sa respiration fait monter la tension et fatigue vite. Souffle sur la partie difficile du mouvement (quand tu pousses ou tu soulèves), inspire au retour.", min: 1 },
    { t: "Pourquoi noter ta douleur ?", s: "Ton kiné lit ce que tu notes avant ton rendez-vous. Il adapte ta séance à ton état réel : plus doux quand c'est sensible, plus ambitieux quand ça va bien.", min: 1 }
  ];
  function reads() { return jget("kf-cab-read", {}); }
  function learnHtml() {
    var R = reads(), nr = READS.filter(function (r, i) { return R[i]; }).length, di = Math.floor(Date.now() / 86400000) % READS.length, f = READS[di];
    var h = "<div class='kh-wrap'><h1 class='lx-title'>Apprendre</h1><p class='lx-lede'>De courtes lectures pour comprendre ta rééducation.</p>" +
      "<section class='kc-hero kh-in' style='--i:0'><div class='kh-kick'>À lire aujourd'hui</div><div class='kh-big'>" + esc(f.t) + "</div><div class='kh-say'>" + esc(f.s) + "</div>" +
      "<button type='button' class='kh-go' onclick='KineCabPatient.read(" + di + ")'>" + (R[di] ? "Déjà lu" : "J'ai lu") + "</button></section>" +
      "<div class='kh-sec'>À lire ensuite</div><div class='kc-prog'><b>" + nr + " sur " + READS.length + "</b> lues<i style='--p:" + Math.round(nr * 100 / READS.length) + "%'></i></div><div class='kc-ed'>";
    READS.forEach(function (r, i) {
      h += "<button type='button' class='kc-rd" + (R[i] ? " seen" : "") + "' onclick='KineCabPatient.open(" + i + ")'><span><b>" + esc(r.t) + "</b><em>" + r.min + " min</em></span><i aria-hidden='true'>" + (R[i] ? "✓" : "›") + "</i></button>" +
        "<div class='kc-rd-b' id='kc-rd-" + i + "' hidden><p>" + esc(r.s) + "</p></div>";
    });
    return h + "</div></div>";
  }
  function open(i) {
    var b = $("kc-rd-" + i); if (!b) return; var on = b.hidden; b.hidden = !on; if (on) mark(i);
  }
  function mark(i) { var R = reads(); if (!R[i]) { R[i] = 1; jset("kf-cab-read", R); } }
  function read(i) { mark(i); paint("cab-learn"); }

  function paint(id) { var el = $("page-" + id), part = PAGES[id]; if (!el) return; el.innerHTML = "<div class='content'>" + (part === "today" ? todayHtml() : learnHtml()) + "</div>"; try { if (window.KineLayout && KineLayout.arm) setTimeout(KineLayout.arm, 80); setTimeout(KineLayout.arm, 500); } catch (e) {} }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ── Barre du bas : Aujourd'hui, Séances, Apprendre, Moi ── */
  var NI = {
    home: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'/></svg>",
    seances: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11'/></svg>",
    learn: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zM4 19.5A2.5 2.5 0 0 1 6.5 17H20'/></svg>",
    moi: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='8' r='4'/><path d='M4 21a8 8 0 0 1 16 0'/></svg>"
  };
  function mode() {
    var on = isCab(), nav = document.querySelector(".bottom-nav"); if (!nav || !window.pageMap) return;
    var B = function (i) { return $("bn-" + i); };
    if (on && !NAVSAVE) {
      NAVSAVE = {}; ["home", "guide", "mes", "suivi", "monkine"].forEach(function (i) { var b = B(i); NAVSAVE[i] = { h: b.innerHTML, c: b.getAttribute("onclick"), d: b.style.display }; });
      var host = $("page-home").parentNode;
      Object.keys(PAGES).forEach(function (id) { if (!$("page-" + id)) { var d = document.createElement("div"); d.className = "page"; d.id = "page-" + id; host.insertBefore(d, $("page-home").nextSibling); } });
      pageMap["cab-today"] = "bn-home"; pageMap["cab-learn"] = "bn-suivi"; pageMap["mes"] = "bn-guide"; pageMap["suivi"] = "bn-monkine";
      function set(i, svg, lab, go) { var b = B(i); b.innerHTML = "<span class='bnav-icon'>" + svg + "</span><span>" + lab + "</span>"; b.setAttribute("onclick", go); }
      set("home", NI.home, "Aujourd'hui", "showPage('cab-today')");
      set("guide", NI.seances, "Séances", "showPage('mes');window.KineCompose&&KineCompose.tab()");
      set("suivi", NI.learn, "Apprendre", "showPage('cab-learn')");
      set("monkine", NI.moi, "Moi", "showPage('monkine')");
      B("mes").style.display = "none";
      document.body.classList.add("kf-cabp");
      var shown = document.querySelector(".page.active");
      if (shown && (shown.id === "page-home" || shown.id === "page-guide")) showPage("cab-today");
    } else if (!on && NAVSAVE) {
      Object.keys(NAVSAVE).forEach(function (i) { var b = B(i), o = NAVSAVE[i]; b.innerHTML = o.h; if (o.c) b.setAttribute("onclick", o.c); b.style.display = o.d; });
      NAVSAVE = null; pageMap["mes"] = "bn-mes"; pageMap["suivi"] = "bn-suivi"; document.body.classList.remove("kf-cabp"); showPage("home");
    }
  }
  (function () {
    var orig = window.showPage; if (!orig) return;
    window.showPage = function (id) {
      if (isCab()) { mode(); if (id === "home") id = "cab-today"; }
      orig(id);
      if (PAGES[id]) paint(id);
    };
  })();
  document.addEventListener("DOMContentLoaded", function () { setTimeout(mode, 80); });
  if (document.readyState !== "loading") setTimeout(mode, 80);

  window.KineCabPatient = { seanceHero: seanceHero, mode: mode, isCab: isCab, pain: pain, live: live, advice: advice, read: read, open: open, paint: paint };
})();
