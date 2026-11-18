/* ═══════════ KinéForce — Reprise de la course, réglée par le kiné ═══════════
   Le kiné choisit un modèle (marche et course alternées, 10 paliers), le palier de départ, la douleur tolérée,
   le nombre de séances par semaine, la surface et une consigne. Le patient lance chaque séance avec Yass
   (minuteur et voix : « Cours », « Marche »), note sa douleur pendant, puis le lendemain matin.
   Règle de progression (modèle de suivi de la douleur) : douleur pendant ET le lendemain matin au plus au seuil
   → palier suivant ; au-dessus du seuil → on redescend d'un palier ; sinon on refait le même.
   Les sorties sont enregistrées dans le journal de course de l'appli (kf-runs). */
var KineReprise = (function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function iso(d) { d = d ? new Date(d) : new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function addD(s, n) { var p = String(s).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2], 12); d.setDate(d.getDate() + n); return iso(d); }
  var MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function dfr(s) { var p = String(s).split("-"); return +p[2] + " " + MO[+p[1] - 1]; }

  // Les 10 paliers : [marche (min), course (min), répétitions]. La marche vient avant chaque bloc de course.
  var PALIERS = [[4, 1, 5], [3, 2, 5], [2, 3, 5], [1, 4, 5], [1, 5, 4], [1, 8, 3], [1, 10, 2], [0, 20, 1], [0, 25, 1], [0, 30, 1]];
  var MODELES = {
    standard: { n: "Reprise standard", d: 1, max: 3, f: 3, s: "Plat et régulier (route, piste, chemin)", c: "Allure où tu peux parler. Échauffe-toi 5 minutes en marchant vite." },
    lca: { n: "Après une ligamentoplastie (LCA)", d: 1, max: 3, f: 3, s: "Plat et régulier (route, piste, tapis)", c: "Seulement en ligne droite, sans virage serré ni descente. Genou sans gonflement le lendemain." },
    tendon: { n: "Tendinopathie (Achille, rotulienne)", d: 3, max: 5, f: 3, s: "Plat et souple", c: "Une douleur jusqu'à 5 sur 10 est acceptée si elle est revenue à ton niveau habituel le lendemain matin. Pas de côtes ni de sprints." },
    entorse: { n: "Après une entorse de cheville", d: 3, max: 3, f: 3, s: "Plat et régulier", c: "Évite les terrains irréguliers au début. Chevillère si ton kiné te l'a conseillée." },
    os: { n: "Après une fracture ou une fracture de fatigue", d: 1, max: 2, f: 3, s: "Plat et souple (piste, herbe, tapis)", c: "Toute douleur précise sur l'os : arrête et préviens ton kiné." }
  };
  var SURF = ["Plat et régulier (route, piste, chemin)", "Plat et souple (piste, herbe, tapis)", "Plat et régulier (route, piste, tapis)", "Tapis de course", "Terrain varié (en fin de reprise)"];
  function total(i) { var p = PALIERS[i]; return (p[0] + p[1]) * p[2]; }
  function palTxt(i) { var p = PALIERS[i]; return p[0] ? p[2] + " × (" + p[0] + " min de marche + " + p[1] + " min de course)" : p[1] + " min de course continue"; }

  /* ── Allure : km/h et min/km ── */
  function fmtV(v) { return String(Math.round(v * 10) / 10).replace(".", ","); }
  function pace(v) { var t = Math.round(3600 / v), m = Math.floor(t / 60), x = t % 60; return m + ":" + ("0" + x).slice(-2); }
  function paceSay(v) { var t = Math.round(3600 / v), m = Math.floor(t / 60), x = t % 60; return m + " minutes " + (x ? x : ""); }
  function round5(v) { return Math.round(v * 2) / 2; }
  var LIEUX = { tapis: "Sur tapis", dehors: "Dehors", mixte: "Les deux" };
  var PKEY = "kf-runprof";
  function jget(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  // Le profil d'allure du patient pour cette reprise : réglé par le kiné, ou par le questionnaire. Si le kiné change l'allure, elle remplace l'ancienne.
  function prof(c) {
    if (!c) return null;
    var p = jget(PKEY, null);
    if (c.v && (!p || p.cid !== c.id || p.vk !== c.v)) {
      p = { cid: c.id, v: c.v, vw: c.vw || 6, lieu: c.lieu || "mixte", montre: !!(p && p.montre), src: "kine", vk: c.v, d: iso() };
      try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {}
    }
    return p && p.cid === c.id ? p : null;
  }
  function saveProf(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }

  /* ── Zone cardio estimée : FC max (Tanaka 2001 : 208 − 0,7 × âge, ou FC max connue), puis zone « modérée » des recommandations ACSM :
        64 à 76 % de la FC max, ou 40 à 59 % de la réserve cardiaque (Karvonen) si la FC de repos est connue.
        Aucune formule d'âge n'est précise : l'écart type est d'environ 10 battements. Le test de la parole reste la référence sur le terrain. ── */
  function num(v, lo, hi) { v = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(v) && v >= lo && v <= hi ? v : null; }
  function hrOf(P) {
    if (!P || P.coeur === "oui" || (!P.age && !P.hrm)) return null;
    var mx = P.hrm || Math.round(208 - 0.7 * P.age), lo, hi, meth;
    if (P.hrr && P.hrr < mx - 40) { lo = Math.round(P.hrr + 0.40 * (mx - P.hrr)); hi = Math.round(P.hrr + 0.59 * (mx - P.hrr)); meth = "reserve"; }
    else { lo = Math.round(mx * 0.64); hi = Math.round(mx * 0.76); meth = "fcmax"; }
    return { mx: mx, lo: lo, hi: hi, meas: !!P.hrm, meth: meth };
  }
  function imcOf(P) { return P && P.kg && P.cm ? Math.round(P.kg / Math.pow(P.cm / 100, 2) * 10) / 10 : null; }

  /* ── Où en est le patient : à partir de ses sorties de reprise (kf-runs, champ rp) ── */
  function runs() { try { return (JSON.parse(localStorage.getItem("kf-runs") || "[]") || []).filter(function (r) { return r.rp; }); } catch (e) { return []; } }
  function etat(cfg, list) {
    var R = (list || runs()).filter(function (r) { return r.cid === cfg.id; }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : (a.t || 0) - (b.t || 0); });
    var cur = Math.max(1, Math.min(PALIERS.length, cfg.d || 1)), last = R[R.length - 1] || null, wait = null, msg = "";
    R.forEach(function (r) {
      if (r.next == null) return;
      var worst = Math.max(+r.pain || 0, +r.next || 0);
      if (worst <= cfg.max && ((+r.slow || 0) >= 2 || r.hot)) { msg = r.hot ? "Cœur au-dessus de la zone : même palier, à une allure plus douce" : "Allure trop rapide : même palier, à une allure plus douce"; }   // ralenti deux fois ou plus : on ne monte pas
      else if (worst <= cfg.max) { if (r.rp >= cur) cur = Math.min(PALIERS.length + 1, r.rp + 1); msg = "Palier " + r.rp + " validé"; }
      else if (worst > cfg.max) { cur = Math.max(1, r.rp - 1); msg = "Douleur au-dessus du seuil : on redescend d'un palier"; }
    });
    if (last && last.next == null && last.d < iso()) wait = last;   // la douleur du lendemain matin manque
    var gap = cfg.f >= 4 ? 1 : 2, nextD = last ? addD(last.d, gap) : iso();
    return { palier: cur, fini: cur > PALIERS.length, last: last, wait: wait, nextD: nextD > iso() ? nextD : null, msg: msg, n: R.length };
  }

  /* ════════ Côté kiné : régler et envoyer ════════ */
  var CFG = null;
  function kineCard(C) {
    var c = C.course;
    if (!c) return "<div class='su-card krp-k'><div class='su-card-h'><b>Reprise de la course</b><span>marche et course</span></div><div class='kf-sub'>Un programme en 10 paliers que le patient lance avec Yass. Il passe au palier suivant si sa douleur reste sous ton seuil, pendant et le lendemain matin.</div><button class='seq-btn-secondary' onclick='KineReprise.edit()'>Préparer une reprise de course</button></div>";
    var R = (C.journal || []).reduce(function (a, d) { return a.concat((d.c || []).filter(function (r) { return r.cid === c.id; })); }, []), e = etat(c, R);
    return "<div class='su-card krp-k'><div class='su-card-h'><b>Reprise de la course</b><span>" + esc(MODELES[c.m] ? MODELES[c.m].n : "") + "</span></div>" +
      "<div class='krp-pals'>" + PALIERS.map(function (p, i) { return "<i class='" + (i + 1 < e.palier ? "ok" : i + 1 === e.palier ? "now" : "") + "'></i>"; }).join("") + "</div>" +
      "<div class='kf-sub'>" + (e.fini ? "Reprise terminée : 30 minutes de course continue. Le patient continue avec son journal de course (charge par semaine et douleur)." : "Palier " + e.palier + " sur 10 : " + esc(palTxt(e.palier - 1)) + ".") + " Seuil de douleur : " + c.max + " sur 10, " + c.f + " séances par semaine." + (function () { var l = R.filter(function (r) { return r.imc || r.hz; }).slice(-1)[0]; return l ? " Profil du patient : " + (l.imc ? "IMC " + String(l.imc).replace(".", ",") : "") + (l.imc && l.hz ? ", " : "") + (l.hz ? "zone cardio estimée " + l.hz.replace("-", " à ") + " battements" : "") + "." : ""; })() + (c.v ? " Allure fixée : " + fmtV(c.v) + " km/h (" + pace(c.v) + " /km)." : " Allure réglée par le patient.") + "</div>" +
      (R.length ? R.slice(-4).reverse().map(function (r) { return "<div class='kcb-srow'><b>" + esc(dfr(r.d)) + "</b><span>Palier " + r.rp + " · douleur pendant " + (r.pain || 0) + "/10" + (r.next != null ? ", le lendemain " + r.next + "/10" : ", lendemain pas encore noté") + (r.km ? " · " + String(r.km).replace(".", ",") + " km" : "") + (r.hr ? " · FC " + r.hr + (r.hz ? " (zone " + r.hz.replace("-", " à ") + ")" : "") : "") + (r.v0 ? " · " + (r.v1 && r.v1 !== r.v0 ? fmtV(r.v0) + " puis " + fmtV(r.v1) : fmtV(r.v0)) + " km/h" + (r.slow ? ", ralenti " + r.slow + " fois" : "") : "") + "</span></div>"; }).join("")
        : "<p class='kcb-hint'>" + (C.membres ? "Les séances apparaîtront ici si le patient sauvegarde son journal." : "Le patient la verra dès que son téléphone sera relié.") + "</p>") +
      "<div class='kcb-two'><button class='seq-btn-secondary' onclick='KineReprise.edit()'>Modifier</button><button class='seq-btn-secondary kcb-danger' onclick='KineReprise.stop()'>Arrêter</button></div></div>";
  }
  function edit() {
    var C = KineCabinet._C(), c = C.course || {};
    CFG = { id: c.id || Date.now().toString(36), m: c.m || "standard", d: c.d || 1, max: c.max != null ? c.max : 3, f: c.f || 3, s: c.s || MODELES.standard.s, c: c.c != null ? c.c : MODELES.standard.c, v: c.v || null, vw: c.vw || 6, lieu: c.lieu || "mixte", niv: c.niv || (declared(C) || {}).niv || "", vit: c.vit || (declared(C) || {}).vit || 0 };
    view();
  }
  // Ce que le patient a déclaré lui-même dans son questionnaire (message avec profil), le plus récent
  function declared(C) { var M = (C && C.msgs) || [], i; for (i = 0; i < M.length; i++) if (M[i].p && M[i].p.v) return M[i].p; return null; }
  // Le conseil de départ pour ce patient : palier, allure, et pourquoi
  function advise() {
    var C = KineCabinet._C(), M = MODELES[CFG.m], dc = declared(C), why = [], d = M.d, v = null, niv = CFG.niv, hab = CFG.vit || (niv && NIV[niv] ? NIV[niv][1] : 0);
    why.push("Modèle « " + M.n + " » : on part du palier " + M.d + ", douleur acceptée " + M.max + " sur 10, " + M.f + " séances par semaine.");
    if (niv === "n") { d = 1; why.push("Il ne courait pas régulièrement : on repart du palier 1."); }
    else if (niv) why.push("Avant sa blessure : " + NIV[niv][0].toLowerCase() + (CFG.vit ? ", vers " + CFG.vit + " km/h" : "") + ".");
    if (hab) { v = Math.max(6.5, Math.min(14, round5(hab * 0.85))); why.push("Allure de reprise : environ 85 % de son allure d'avant (" + fmtV(hab) + " km/h), pour partir plus doucement qu'avant.") ; }
    else { v = dc && dc.v ? dc.v : 8; why.push(dc && dc.v ? "Allure choisie par le patient dans son questionnaire." : "Sans niveau connu, 8 km/h est une allure de départ prudente."); }
    if (dc && dc.v && hab && Math.abs(dc.v - v) >= 1) why.push("Le patient s'est réglé lui-même à " + fmtV(dc.v) + " km/h" + (dc.z ? ", zone cardio estimée " + String(dc.z).replace("-", " à ") : "") + (dc.imc ? ", IMC " + String(dc.imc).replace(".", ",") : "") + ".");
    else if (dc && (dc.z || dc.imc)) why.push("Profil déclaré : " + (dc.age ? dc.age + " ans, " : "") + (dc.imc ? "IMC " + String(dc.imc).replace(".", ",") + ", " : "") + (dc.z ? "zone cardio estimée " + String(dc.z).replace("-", " à ") + " battements." : "").replace(/, $/, "."));
    var P = window.KineParcours && C.parcours ? KineParcours.get(C.parcours) : null, nE = P && P.etapes ? P.etapes.length : 0, e = (+C.etape || 0) + 1;
    if (nE) why.push("Son parcours en est à l'étape " + e + " sur " + nE + (e < nE ? " : la reprise de la course vient en général quand le parcours est bien avancé. À toi de juger si c'est le moment." : "."));
    why.push("Surface : " + M.s.charAt(0).toLowerCase() + M.s.slice(1) + ".");
    return { d: d, v: v, vw: niv === "n" ? 5.5 : 6, why: why };
  }
  function applyAdvice() { var a = advise(), M = MODELES[CFG.m]; CFG.d = a.d; CFG.v = a.v; CFG.vw = a.vw; CFG.max = M.max; CFG.f = M.f; view(); }
  function setM(m) { var M = MODELES[m]; CFG.m = m; CFG.d = M.d; CFG.max = M.max; CFG.f = M.f; CFG.s = M.s; CFG.c = M.c; view(); }
  function setK(k, v) { CFG[k] = v; view(); }
  function vStep(key, dir) { var lo = key === "v" ? 5 : 4, hi = key === "v" ? 18 : 8; CFG[key] = Math.max(lo, Math.min(hi, round5((CFG[key] || (key === "v" ? 9 : 6)) + dir * 0.5))); view(); }
  function vFix() { CFG.v = 9; view(); }
  function vClear() { CFG.v = null; view(); }
  function view() {
    var el = KineCabinet._ov("krp-ed"); el.setAttribute("aria-label", "Reprise de la course");
    var chips = function (k, list, fmt) { return "<div class='kf-chips'>" + list.map(function (v) { return "<button type='button' class='" + (CFG[k] === v ? "sel" : "") + "' onclick='KineReprise.k(" + JSON.stringify(k) + "," + JSON.stringify(v).replace(/'/g, "&#39;") + ")'>" + esc(fmt ? fmt(v) : v) + "</button>"; }).join("") + "</div>"; };
    el.innerHTML = "<div class='kcb-incl-card kcb-qcard'><div class='kcb-mh'><span>Reprise de la course</span><button class='kf-back' onclick='document.getElementById(\"krp-ed\").classList.remove(\"open\")' aria-label='Fermer'>×</button></div>" +
      "<span class='kcb-lab'>Modèle</span><div class='krp-mods'>" + Object.keys(MODELES).map(function (m) { return "<button class='" + (CFG.m === m ? "on" : "") + "' onclick='KineReprise.m(\"" + m + "\")'>" + esc(MODELES[m].n) + "</button>"; }).join("") + "</div>" +
      "<span class='kcb-lab'>Niveau avant la blessure</span>" + chips("niv", ["n", "o", "r", "c"], function (v) { return NIV[v][0]; }) +
      "<span class='kcb-lab'>Vitesse de course d'avant, à l'aise</span>" + chips("vit", [0, 8, 9, 10, 11, 12, 13], function (v) { return v ? v + " km/h" : "Inconnue"; }) +
      (function () { var a = advise(); return "<div class='krp-adv'><b>Conseil pour ce patient</b><p>Démarre au palier " + a.d + ", à " + fmtV(a.v) + " km/h (" + pace(a.v) + " par km), marche rapide à " + fmtV(a.vw) + " km/h.</p><ul>" + a.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul><button type='button' class='seq-btn-secondary' onclick='KineReprise.adv()'>Appliquer ce conseil</button><small>Ce n'est qu'une aide : tu règles toi-même le palier et la vitesse juste en dessous.</small></div>"; })() +
      "<span class='kcb-lab'>Palier de départ</span>" + chips("d", [1, 2, 3, 4, 5, 6, 7, 8]) + "<p class='kcb-hint'>" + esc(palTxt(CFG.d - 1)) + ", soit " + total(CFG.d - 1) + " minutes.</p>" +
      "<span class='kcb-lab'>Douleur acceptée, pendant et le lendemain matin</span>" + chips("max", [2, 3, 4, 5], function (v) { return v + " sur 10"; }) +
      "<span class='kcb-lab'>Séances par semaine</span>" + chips("f", [2, 3, 4], function (v) { return v + " par semaine"; }) +
      "<span class='kcb-lab'>Allure de course au départ</span>" + (CFG.v ?
        "<div class='krp-st'><button type='button' onclick='KineReprise.vs(\"v\",-1)' aria-label='Moins vite'>−</button><b>" + fmtV(CFG.v) + " km/h</b><button type='button' onclick='KineReprise.vs(\"v\",1)' aria-label='Plus vite'>+</button></div>" +
        "<p class='kcb-hint'>Soit " + pace(CFG.v) + " par km. Une allure où le patient peut encore parler. Le patient pourra la baisser en direct, jamais la monter.</p>" +
        "<span class='kcb-lab'>Marche rapide</span><div class='krp-st'><button type='button' onclick='KineReprise.vs(\"vw\",-1)' aria-label='Moins vite'>−</button><b>" + fmtV(CFG.vw) + " km/h</b><button type='button' onclick='KineReprise.vs(\"vw\",1)' aria-label='Plus vite'>+</button></div>" +
        "<span class='kcb-lab'>Où il court</span>" + chips("lieu", ["tapis", "dehors", "mixte"], function (v) { return LIEUX[v]; }) +
        "<button type='button' class='kcb-link' onclick='KineReprise.vc()'>Laisser le patient la régler seul</button>"
        : "<p class='kcb-hint'>Le patient la règle seul avec un court questionnaire (ou te demande de la régler avec lui).</p><button type='button' class='seq-btn-secondary' onclick='KineReprise.vf()'>Fixer l'allure moi-même</button>") +
      "<span class='kcb-lab'>Surface</span>" + chips("s", SURF) +
      "<label class='kcb-field'><span class='kcb-lab'>Consigne pour le patient</span><textarea class='kcb-in kcb-ta' id='krp-c' maxlength='300' rows='3'>" + esc(CFG.c) + "</textarea></label>" +
      "<details class='kcb-how'><summary>Les 10 paliers</summary><ol class='krp-ol'>" + PALIERS.map(function (p, i) { return "<li>" + esc(palTxt(i)) + " · " + total(i) + " min</li>"; }).join("") + "</ol>On passe au palier suivant si la douleur pendant la séance et le lendemain matin reste au plus au seuil ; au-dessus, on redescend d'un palier. Un jour de repos au moins entre deux séances.</details>" +
      "<button class='seq-btn-main' onclick='KineReprise.send()'>Envoyer au patient</button></div>";
    el.classList.add("open");
  }
  function send() {
    var t = $("krp-c"); CFG.c = t ? t.value.trim().slice(0, 300) : CFG.c; CFG.env = iso();
    var C = KineCabinet._C(), data = { course: CFG };
    fbCab.save(C.id, data).then(function () { C.course = CFG; KineCabinet._ping("course"); $("krp-ed").classList.remove("open"); KineCabinet._re(); KineCabinet._say("Reprise de course envoyée au patient"); }, function () { KineCabinet._say("Connexion impossible : réessaie."); });
  }
  function stop() {
    if (!confirm("Arrêter la reprise de course ? Le patient ne la verra plus.")) return;
    var C = KineCabinet._C(); fbCab.save(C.id, { course: null }).then(function () { C.course = null; KineCabinet._re(); });
  }

  /* ════════ Côté patient : la carte dans Mon kiné, l'allure, et la séance avec Yass ════════ */
  function patientCard(d) {
    var c = d && d.course; if (!c) return "";
    var e = etat(c), P = prof(c);
    var jr = "<button class='krp-jr' onclick='KineReprise.journal()'>Mon journal de course<span aria-hidden='true'>›</span></button>";
    if (e.fini) return "<div class='kms-card krp-p done'><div class='kms-ck'><span>Reprise de la course</span><span>terminée</span></div><div class='kms-ct'>Bravo : 30 minutes de course continue</div>" +
      "<div class='kms-cm'><span>La suite se fait dans ton journal de course : tu notes tes sorties, l'appli surveille ta charge semaine après semaine et ta douleur.</span></div>" +
      "<button class='seq-btn-main' onclick='KineReprise.journal()'>Continuer avec mon journal de course</button></div>";
    var head = "<div class='kms-ck'><span>Reprise de la course</span><span>Palier " + e.palier + " sur 10</span></div><div class='krp-pals'>" + PALIERS.map(function (p, i) { return "<i class='" + (i + 1 < e.palier ? "ok" : i + 1 === e.palier ? "now" : "") + "'></i>"; }).join("") + "</div>";
    if (e.wait) return "<div class='kms-card krp-p'>" + head + "<div class='kms-ct'>Ta douleur ce matin ?</div><div class='kms-cm'><span>Après ta séance du " + esc(dfr(e.wait.d)) + ", de 0 à 10</span></div><div class='krp-scale'>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return "<button onclick='KineReprise.lendemain(" + JSON.stringify(e.wait.id) + "," + v + ")'>" + v + "</button>"; }).join("") + "</div></div>";
    var al = !P ? "<div class='krp-ask'><b>Règle ton allure</b><span>Pour que l'appli te donne une vitesse claire à chaque étape.</span><button class='seq-btn-main' onclick='KineReprise.q()'>Je le fais seul, en 1 minute</button><button class='krp-jr' onclick='KineReprise.withKine()'>Je préfère le faire avec mon kiné</button></div>"
      : "<div class='krp-al'><div><b>" + fmtV(P.v) + " km/h</b><span>course · " + pace(P.v) + " /km</span></div><div><b>" + fmtV(P.vw) + " km/h</b><span>marche rapide</span></div></div>" +
        (P.src === "attente" ? "<p class='krp-wait'>Allure prudente en attendant ton kiné, qui la règle avec toi.</p>" : "") + "<button class='krp-lnk' onclick='KineReprise.q()'>Régler mon allure</button>";
    return "<div class='kms-card krp-p'>" + head + "<div class='kms-ct'>" + esc(palTxt(e.palier - 1)) + "</div><div class='kms-cm'><span>" + total(e.palier - 1) + " min, plus l'échauffement et le retour au calme · " + esc(c.s) + (e.msg ? " · " + esc(e.msg) : "") + "</span></div>" + al +
      (e.nextD ? "<p class='krp-wait'>Prochaine séance à partir du " + esc(dfr(e.nextD)) + " : le corps s'adapte pendant le repos.</p>" : P ? "<button class='seq-btn-main' onclick='KineReprise.go()'>Lancer la séance avec Yass</button>" : "") + jr + "</div>";
  }
  // Le journal de course : les séances de reprise y figurent, et il prend le relais une fois la reprise terminée
  function journal() { if (window.KineMonSuivi && KineMonSuivi.close) try { KineMonSuivi.close(); } catch (e) {} if (window.KineCourse) KineCourse.open(); }
  // Pour le journal : la reprise en cours (réglage du kiné et palier), ou null
  function active() { var c = cfgNow(); if (!c) return null; var e = etat(c); return { c: c, e: e, txt: e.fini ? "" : palTxt(e.palier - 1), min: e.fini ? 0 : total(e.palier - 1) }; }
  function cfgNow() { var s = window.KineMonSuivi && KineMonSuivi.state(); return s && s.d && s.d.course; }
  function lendemain(id, v) {
    try { var a = JSON.parse(localStorage.getItem("kf-runs") || "[]"); a.forEach(function (r) { if (r.id === id) r.next = v; }); localStorage.setItem("kf-runs", JSON.stringify(a)); } catch (e) {}
    var c = cfgNow(); if (c && v > c.max && window.showToast) showToast("Douleur au-dessus du seuil : la prochaine séance reprend le palier d'avant");
    refresh();
  }
  function refresh() { if (window.KineMonSuivi) { KineMonSuivi.page(); var sh = $("kms-sheet"); if (sh && sh.classList.contains("open")) KineMonSuivi.view(); } if (window.KineLayout && KineLayout.render) try { KineLayout.render(); } catch (e) {} }

  /* ── Le questionnaire d'allure : seul, en quelques questions ── */
  var QQ = null;
  var NIV = { n: ["Pas vraiment régulier", 8], o: ["1 à 2 fois par semaine", 9], r: ["3 fois par semaine ou plus", 10], c: ["En compétition", 11.5] };
  function qSteps() {
    var s = [{ k: "lieu", t: "Où vas-tu courir ?", sub: "Tu pourras changer à chaque séance.", o: [["tapis", "Sur tapis"], ["dehors", "Dehors"], ["mixte", "Les deux"]] }];
    if (!QQ.a.lieu || QQ.a.lieu !== "tapis") s.push({ k: "montre", t: "Tu as une montre ou une appli qui donne ton allure ?", sub: "Sans montre, on te donne une vitesse et tu te fies à ta respiration.", o: [["oui", "Oui"], ["non", "Non"]] });
    s.push({ k: "niv", t: "Avant ta blessure, tu courais…", sub: "", o: Object.keys(NIV).map(function (k) { return [k, NIV[k][0]]; }) });
    s.push({ k: "vit", t: "À quelle vitesse courais-tu à l'aise ?", sub: "Celle où tu pouvais encore parler. La reprise démarrera plus doucement, c'est voulu.", o: [["?", "Je ne sais pas"]].concat([8, 9, 10, 11, 12, 13].map(function (v) { return [String(v), v + " km/h", pace(v) + " /km"]; })) });
    s.push({ k: "profil", t: "Quelques mesures", sub: "Pour estimer ta zone d'endurance au rythme cardiaque. Tu peux passer cette étape.", f: [["age", "Âge", "ans", 14, 90], ["kg", "Poids", "kg", 30, 250], ["cm", "Taille", "cm", 120, 220]] });
    s.push({ k: "coeur", t: "Ton cœur", sub: "Si tu les connais. Sinon, laisse vide : on estimera avec ton âge.", f: [["hrr", "Rythme au repos, le matin au réveil", "battements/min", 35, 110], ["hrm", "Rythme maximal déjà mesuré (test, montre)", "battements/min", 120, 220]] });
    s.push({ k: "coeur2", t: "Un traitement pour le cœur ?", sub: "Un médicament qui ralentit le cœur (bêtabloquant), ou une consigne d'un médecin de limiter l'effort pour le cœur.", o: [["non", "Non"], ["oui", "Oui"], ["?", "Je ne sais pas"]] });
    return s;
  }
  function qCalc() {
    var A = QQ.a, hab = A.vit && A.vit !== "?" ? +A.vit : NIV[A.niv || "n"][1];
    return { v: Math.max(6.5, Math.min(14, round5(hab * 0.85))), vw: A.niv === "n" ? 5.5 : 6 };
  }
  function qEl() { var el = $("krp-q"); if (!el) { el = document.createElement("div"); el.id = "krp-q"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Régler mon allure"); document.body.appendChild(el); } return el; }
  function q() {
    var c = cfgNow(); if (!c) return;
    var p = prof(c); QQ = { i: 0, a: p ? { lieu: p.lieu } : {} };
    if ($("krp-run")) $("krp-run").classList.remove("open");
    qView();
  }
  function qView() {
    var el = qEl(), S = qSteps(), i = QQ.i, h = "";
    h += "<div class='krq-top'><button class='kf-back' onclick='" + (i ? "KineReprise.qb()" : "KineReprise.qx()") + "' aria-label='" + (i ? "Retour" : "Fermer") + "'>" + (i ? "‹" : "×") + "</button><span>" + (i < S.length ? "Question " + (i + 1) + " sur " + S.length : "Ton allure") + "</span></div><div class='krq-bar'><i style='width:" + Math.round(i / S.length * 100) + "%'></i></div>";
    if (i < S.length) {
      var st = S[i];
      if (st.f) {
        h += "<h2>" + esc(st.t) + "</h2><p>" + esc(st.sub) + "</p><div class='krq-f'>" + st.f.map(function (f) { return "<label><span>" + esc(f[1]) + "</span><div><input id='krq-" + f[0] + "' type='number' inputmode='decimal' min='" + f[3] + "' max='" + f[4] + "' value='" + esc(QQ.a[f[0]] || "") + "' /><em>" + esc(f[2]) + "</em></div></label>"; }).join("") + "</div>" +
          "<button class='seq-btn-main' onclick='KineReprise.qn()'>Continuer</button><button class='krp-lnk' style='color:inherit' onclick='KineReprise.qn(1)'>Passer</button>";
        el.innerHTML = h; el.classList.add("open"); return;
      }
      h += "<h2>" + esc(st.t) + "</h2>" + (st.sub ? "<p>" + esc(st.sub) + "</p>" : "") + "<div class='krq-opts'>" + st.o.map(function (o) { return "<button onclick='KineReprise.qa(" + JSON.stringify(st.k) + "," + JSON.stringify(o[0]) + ")'><b>" + esc(o[1]) + "</b>" + (o[2] ? "<span>" + esc(o[2]) + "</span>" : "") + "</button>"; }).join("") + "</div>";
    } else {
      var R = qCalc(); QQ.v = QQ.v || R.v; QQ.vw = QQ.vw || R.vw;
      h += "<h2>Voici ton allure de reprise</h2><p>Elle est plus douce que ton allure d'avant : le tendon ou l'articulation a besoin de temps. Tu pourras la baisser en direct pendant la séance.</p>" +
        "<div class='krq-res'><span>Course</span><div class='krp-st'><button onclick='KineReprise.qv(-1)' aria-label='Moins vite'>−</button><b>" + fmtV(QQ.v) + " km/h</b><button onclick='KineReprise.qv(1)' aria-label='Plus vite'>+</button></div><em>" + pace(QQ.v) + " par kilomètre</em>" +
        "<span>Marche rapide</span><div class='krp-st'><b>" + fmtV(QQ.vw) + " km/h</b></div><em>" + pace(QQ.vw) + " par kilomètre</em></div>" +
        zoneCard(QQ.a) + (linked() ? "<label class='krq-ck'><input type='checkbox' id='krq-tell' checked /><span>Prévenir mon kiné de cette allure, de mon niveau, de mon âge, de mon IMC et de ma zone cardio</span></label>" : "") + "<button class='seq-btn-main' onclick='KineReprise.qs()'>Valider mon allure</button>";
    }
    el.innerHTML = h; el.classList.add("open");
  }
  function linked() { var s = window.KineMonSuivi && KineMonSuivi.state(); return !!(s && s.pid && window.fbPat && fbPat.msgSend); }
  function tellKine(P0) {
    var s = KineMonSuivi.state(), z = hrOf(P0), im = imcOf(P0), nv = P0.niv && NIV[P0.niv] ? NIV[P0.niv][0] : "";
    var txt = "Allure de course réglée : " + fmtV(P0.v) + " km/h (" + pace(P0.v) + " par km), marche " + fmtV(P0.vw) + " km/h." + (nv ? " Avant : " + nv.toLowerCase() + (P0.vit ? ", " + P0.vit + " km/h" : "") + "." : "") +
      " " + (P0.lieu === "tapis" ? "Sur tapis." : P0.lieu === "dehors" ? "Dehors." : "Tapis et dehors.") + (P0.age ? " " + P0.age + " ans." : "") + (im ? " IMC " + String(im).replace(".", ",") + "." : "") + (z ? " Zone cardio estimée " + z.lo + " à " + z.hi + "." : "");
    var ex = { v: P0.v, vw: P0.vw, niv: P0.niv || "", lieu: P0.lieu }; if (P0.vit) ex.vit = P0.vit; if (P0.age) ex.age = P0.age; if (im) ex.imc = im; if (z) ex.z = z.lo + "-" + z.hi;
    try { fbPat.msgSend(s.pid, txt, ex).then(function () {}, function () {}); } catch (e) {}
  }
  function zoneCard(A) {
    var P = { age: num(A.age, 14, 90), hrm: num(A.hrm, 120, 220), hrr: num(A.hrr, 35, 110), coeur: A.coeur2 === "oui" ? "oui" : "", kg: num(A.kg, 30, 250), cm: num(A.cm, 120, 220) }, z = hrOf(P), im = imcOf(P), h = "";
    if (P.coeur === "oui") h += "<div class='krq-z'><b>Pas de zone cardio pour toi</b><p>Avec un traitement ou une consigne pour le cœur, les battements ne sont pas fiables. Tu te fies à la parole : tu dois pouvoir tenir une conversation en phrases complètes. Parles-en à ton kiné ou à ton médecin.</p></div>";
    else if (z) h += "<div class='krq-z'><span>Ta zone d'endurance (rythme cardiaque)</span><b>" + z.lo + " à " + z.hi + " battements par minute</b><p>" + (z.meas ? "À partir de ton rythme maximal mesuré (" + z.mx + ")" : "Rythme maximal estimé à " + z.mx + " avec ton âge") + (z.meth === "reserve" ? ", et de ton rythme au repos." : ".") + " C'est une estimation, à ± 10 battements : si tu peux parler en phrases complètes, tu es dans la bonne zone, même si le chiffre dit autre chose.</p>" +
      "<details><summary>Comment c'est calculé</summary><p>" + (z.meas ? "Rythme maximal : celui que tu as donné. " : "Rythme maximal : 208 − 0,7 × âge (Tanaka et coll., 2001, synthèse de 351 études). ") + (z.meth === "reserve" ? "Zone : 40 à 59 % de la réserve cardiaque (méthode de Karvonen), l'intensité « modérée » des recommandations de l'ACSM." : "Zone : 64 à 76 % du rythme maximal, l'intensité « modérée » des recommandations de l'ACSM.") + " Les formules d'âge se trompent de 10 battements en moyenne, et davantage selon les personnes : c'est pourquoi la parole passe avant le chiffre. Le poids ne change pas ce calcul.</p></details></div>";
    if (im && im >= 30) h += "<p class='krq-n'>Ton indice de masse corporelle est de " + String(im).replace(".", ",") + ". Parles-en à ton kiné : ta reprise peut demander des paliers plus longs.</p>";
    return h;
  }
  // Étape à champs numériques : on lit les cases, vides autorisées
  function qn(skip) {
    var st = qSteps()[QQ.i]; if (!st || !st.f) return;
    st.f.forEach(function (f) { var el = $("krq-" + f[0]), v = skip || !el ? null : num(el.value, f[3], f[4]); if (v == null) delete QQ.a[f[0]]; else QQ.a[f[0]] = v; });
    QQ.i++; QQ.v = QQ.vw = null; qView();
  }
  function qa(k, v) { QQ.a[k] = v; QQ.i++; if (k === "lieu" && v === "tapis") delete QQ.a.montre; QQ.v = QQ.vw = null; qView(); }
  function qb() { QQ.i = Math.max(0, QQ.i - 1); qView(); }
  function qx() { var el = $("krp-q"); if (el) el.classList.remove("open"); QQ = null; }
  function qv(dir) { QQ.v = Math.max(5, Math.min(18, round5(QQ.v + dir * 0.5))); qView(); }
  function qs() {
    var c = cfgNow(); if (!c || !QQ) return;
    var A = QQ.a, P0 = { cid: c.id, v: QQ.v, vw: QQ.vw, lieu: A.lieu || "mixte", montre: A.montre === "oui", src: "patient", niv: A.niv || "", d: iso(), vk: c.v || null,
      age: num(A.age, 14, 90), kg: num(A.kg, 30, 250), cm: num(A.cm, 120, 220), hrr: num(A.hrr, 35, 110), hrm: num(A.hrm, 120, 220), coeur: A.coeur2 === "oui" ? "oui" : "" };
    if (A.vit && A.vit !== "?") P0.vit = +A.vit;
    saveProf(P0);
    var tell = $("krq-tell"); if (tell && tell.checked && linked()) tellKine(P0);
    qx(); refresh();
  }
  // « Avec mon kiné » : une allure prudente en attendant, et le kiné est prévenu par message
  function withKine() {
    var c = cfgNow(); if (!c) return;
    saveProf({ cid: c.id, v: 8, vw: 6, lieu: "mixte", montre: false, src: "attente", d: iso(), vk: c.v || null });
    var s = window.KineMonSuivi && KineMonSuivi.state();
    if (s && s.pid && window.fbPat && fbPat.msgSend) { try { fbPat.msgSend(s.pid, "Je voudrais régler mon allure de course avec toi (reprise de la course).").then(function () {}, function () {}); } catch (e) {} }
    if (window.showToast) showToast("Ton kiné est prévenu. En attendant : allure prudente de 8 km/h");
    refresh();
  }

  /* ── La séance : marche / course, avec la vitesse à tenir, des alertes sonores et un bouton « ralentir » ── */
  var RUN = null, wake = null, PRE = null;
  function say(t) { if (typeof speak === "function") { try { speak(t, { prio: 1, now: true, ttl: 3000 }); } catch (e) {} } }
  function beep(f, d) { if (typeof playBeep === "function") playBeep(f, d || 0.15, 0.3, "triangle"); }
  var LAB = { echauf: ["Échauffement", "Marche vite", "#0E141F", "Marche vite pour t'échauffer."], marche: ["Marche", "Marche", "#0B6E59", "Marche."], course: ["Course", "Cours", "#3341E0", "Cours, tranquille."], retour: ["Retour au calme", "Marche lente", "#0E141F", "Retour au calme, marche lentement."] };
  function screen() { var el = $("krp-run"); if (!el) { el = document.createElement("div"); el.id = "krp-run"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Séance de reprise de course"); document.body.appendChild(el); } return el; }
  function mmss(s) { s = Math.max(0, s); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }

  // Étape 1 : un écran de départ avec l'allure, le lieu du jour et ce qui va se passer
  function go() {
    var c = cfgNow(); if (!c) return; var e = etat(c); if (e.fini) return;
    var P = prof(c); if (!P) { q(); return; }
    PRE = { where: P.lieu !== "mixte" ? P.lieu : (P.where || "dehors"), montre: !!P.montre && !P.gps, gps: !!P.gps, auto: P.auto != null ? !!P.auto : !!P.gps };
    preView();
  }
  // La frise de la séance : une barre découpée en étapes (marche, course), avec l'étape en cours qui se remplit
  function tlHtml(steps, cur) {
    return "<div class='krp-tl' aria-hidden='true'>" + steps.map(function (st, i) { return "<i class='" + st[0] + (i < cur ? " done" : i === cur ? " now" : "") + "' style='flex:" + st[1] + "'>" + (i === cur ? "<u id='krp-tlu'></u>" : "") + "</i>"; }).join("") + "</div>";
  }
  function stepsFor(e) { var pl = PALIERS[e.palier - 1], st = [["echauf", 5]]; for (var i = 0; i < pl[2]; i++) { if (pl[0]) st.push(["marche", pl[0]]); st.push(["course", pl[1]]); } st.push(["retour", 3]); return st; }
  function preView() {
    var c = cfgNow(), P = prof(c), e = etat(c), p = PALIERS[e.palier - 1], el = screen();
    el.style.background = "#0E141F";
    var chip = function (on, fn, txt) { return "<button type='button' class='" + (on ? "on" : "") + "' onclick='" + fn + "'>" + txt + "</button>"; };
    var z = hrOf(P), tot = total(e.palier - 1) + 8;
    var seg = function (items) { return "<div class='krp-seg'>" + items.map(function (it) { return chip(it[0], it[1], it[2]); }).join("") + "</div>"; };
    el.innerHTML = "<div class='kr-top'><span>Palier " + e.palier + " sur 10</span><button class='krp-x' onclick='KineReprise.close()' aria-label='Fermer'>×</button></div>" +
      "<div class='krp-pre'><h2>Séance du palier " + e.palier + "</h2><p class='krp-meta'>" + tot + " minutes, échauffement et retour au calme compris</p>" + tlHtml(stepsFor(e), -1) +
      "<div class='krp-leg'><span class='marche'>Marche</span><span class='course'>Course</span></div>" +
      "<div class='krp-stats'><div><b>" + fmtV(P.v) + "</b><span>km/h en course<br>" + pace(P.v) + " par km</span></div><div><b>" + fmtV(P.vw) + "</b><span>km/h en marche<br>" + pace(P.vw) + " par km</span></div>" + (z ? "<div><b>" + z.lo + "–" + z.hi + "</b><span>battements<br>par minute</span></div>" : "") + "</div>" +
      (z ? "" : P.coeur === "oui" ? "<p class='krp-note'>Pas de zone cardio pour toi : tu te fies à la parole.</p>" : "") +
      (P.lieu === "mixte" ? "<div class='krp-opt'><span>Où cours-tu aujourd'hui</span>" + seg([[PRE.where === "tapis", "KineReprise.pw(\"tapis\")", "Tapis"], [PRE.where === "dehors", "KineReprise.pw(\"dehors\")", "Dehors"]]) + "</div>" : "") +
      (PRE.where === "dehors" ? "<div class='krp-opt'><span>Suivre mon allure avec</span>" + seg([[PRE.montre, "KineReprise.pm(1)", "Ma montre"], [PRE.gps, "KineReprise.pm(2)", "GPS du téléphone"], [!PRE.montre && !PRE.gps, "KineReprise.pm(0)", "Rien"]]) + "</div>" : "") +
      (PRE.where === "dehors" && PRE.gps ? "<div class='krp-know'><p>Le GPS d'une page web s'arrête quand l'écran se verrouille. Active le mode poche : l'écran reste allumé mais noir, et le GPS continue.</p><details><summary>Comment ça marche</summary><p>Les touches sont bloquées, donc rien ne se déclenche dans ta poche. Pour réveiller l'écran, maintiens le bouton 2 secondes. Avec une montre, tu n'as pas besoin du GPS du téléphone.</p></details></div>" : "") +
      "<div class='krp-opt'><span>Écran noir au bout de 10 secondes</span>" + seg([[PRE.auto, "KineReprise.pa(1)", "Oui"], [!PRE.auto, "KineReprise.pa(0)", "Non"]]) + "</div>" +
      "<p class='krp-note'>Chaque changement est annoncé par un bip, même écran verrouillé. Pense à monter le volume." + (P.src === "attente" ? " Allure prudente en attendant ton kiné." : "") + "</p></div>" +
      "<div class='kr-btns one'><button type='button' id='krp-start' class='go' onclick='KineReprise.start()'>C'est parti</button></div><button class='krp-lnk dark' onclick='KineReprise.q()'>Régler mon allure</button>";
    el.classList.add("open");
  }
  function pw(w) { PRE.where = w; preView(); }
  function pm(v) { PRE.montre = v === 1; PRE.gps = v === 2; if (v === 2) PRE.auto = true; preView(); }
  function pa(v) { PRE.auto = !!v; preView(); }

  // Une piste audio préparée à l'avance : les bips tombent à la seconde près, même quand le téléphone est verrouillé
  function buildTrack(starts, steps) {
    var SR = 8000, secs = Math.ceil(starts[steps.length]) + 3, n = SR * secs, buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer);
    var W = function (o, t) { for (var i = 0; i < t.length; i++) buf[o + i] = t.charCodeAt(i); };
    W(0, "RIFF"); dv.setUint32(4, 36 + n, true); W(8, "WAVE"); W(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); W(36, "data"); dv.setUint32(40, n, true);
    buf.fill(128, 44);
    function tone(at, f, d) { var s0 = Math.round(at * SR), len = Math.round(d * SR); for (var j = 0; j < len && s0 + j < n; j++) { var env = Math.min(1, j / (SR * 0.01), (len - j) / (SR * 0.02)); buf[44 + s0 + j] = 128 + Math.round(110 * env * Math.sin(2 * Math.PI * f * j / SR)); } }
    steps.forEach(function (s, i) {
      var at = starts[i], dur = s[1] * 60;
      if (s[0] === "course") { tone(at, 988, 0.18); tone(at + 0.3, 988, 0.18); } else tone(at, i ? 587 : 660, 0.35);
      if (dur >= 20) for (var k = 1; k <= 3; k++) tone(at + dur - k, 784, 0.08);
    });
    var end = starts[steps.length]; tone(end, 660, 0.2); tone(end + 0.3, 880, 0.2); tone(end + 0.6, 1175, 0.3);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }

  function start() {
    var c = cfgNow(); if (!c) return; var e = etat(c), P = prof(c); if (e.fini || !P) return;
    P.where = PRE ? PRE.where : "dehors"; P.montre = PRE ? PRE.montre : false; P.gps = PRE ? PRE.gps && P.where === "dehors" : false; P.auto = PRE ? !!PRE.auto : false; saveProf(P);
    var pl = PALIERS[e.palier - 1], steps = [["echauf", 5]];
    for (var i = 0; i < pl[2]; i++) { if (pl[0]) steps.push(["marche", pl[0]]); steps.push(["course", pl[1]]); }
    steps.push(["retour", 3]);
    var starts = [0]; steps.forEach(function (s, i) { starts.push(starts[i] + s[1] * 60); });
    RUN = { c: c, rp: e.palier, steps: steps, starts: starts, tot: starts[steps.length], i: -1, left: -1, paused: false, t0: 0, pausedMs: 0, off: 0, p: { v: P.v, vw: P.vw }, z: hrOf(P), imc: imcOf(P), v0: P.v, slow: 0, where: P.where, montre: P.montre || P.gps, gps: false, km: 0, pts: [], sp: null, au: null, auOk: false };
    if (typeof getAudioCtx === "function") { var ctx = getAudioCtx(); if (ctx && ctx.state === "suspended") ctx.resume(); }
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e2) {}
    document.body.style.overflow = "hidden";
    var run = RUN, go1 = function () { if (RUN !== run) return; run.t0 = Date.now(); if (P.gps) gpsStart(); if (P.auto) run.pk = setTimeout(function () { if (RUN === run && !run.paused && run.i >= 0) poche(); }, 10000); clearInterval(run.tm); run.tm = setInterval(tick, 250); tick(); };
    try {
      run.au = new Audio(buildTrack(starts, steps)); run.au.setAttribute("playsinline", ""); run.au.preload = "auto";
      var pr = run.au.play();
      if (pr && pr.then) pr.then(function () { run.auOk = true; go1(); }, function () { run.au = null; go1(); }); else { run.auOk = true; go1(); }
    } catch (e3) { run.au = null; go1(); }
    if (!window._krpVis) { window._krpVis = 1; document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && RUN) { tick(); try { if (!wake && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () {}); } catch (e4) {} } }); }
  }
  /* ── GPS du téléphone : vitesse lissée sur 15 s, distance, alerte si trop vite ── */
  function hav(a, b) { var R = 6371000, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r, x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
  function gpsStart() {
    if (!navigator.geolocation) { if (window.showToast) showToast("GPS indisponible sur ce téléphone : la séance continue sans"); return; }
    RUN.gps = true;
    try { RUN.gw = navigator.geolocation.watchPosition(gpsPos, gpsErr, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }); } catch (e) { RUN.gps = false; }
  }
  function gpsStop() { try { if (RUN && RUN.gw != null && navigator.geolocation) navigator.geolocation.clearWatch(RUN.gw); } catch (e) {} if (RUN) RUN.gw = null; }
  function gpsErr(e) { if (RUN && e && e.code === 1) { RUN.gps = false; gpsStop(); if (window.showToast) showToast("GPS refusé : la séance continue sans"); paint(); } }
  function gpsPos(po) {
    if (!RUN || RUN.paused || !RUN.gps) return;
    var c = po.coords, t = po.timestamp || Date.now(); if (c.accuracy > 40) return;
    var pt = { lat: c.latitude, lon: c.longitude, t: t }, last = RUN.pts[RUN.pts.length - 1];
    if (last) { var dt = (t - last.t) / 1000, d = hav(last, pt); if (dt <= 0 || d / dt * 3.6 > 30) return; RUN.km += d / 1000; }
    RUN.pts.push(pt); if (RUN.pts.length > 40) RUN.pts.shift();
    var w = RUN.pts.filter(function (q) { return t - q.t <= 15000; });
    if (w.length >= 2 && (w[w.length - 1].t - w[0].t) >= 5000) RUN.sp = hav(w[0], w[w.length - 1]) / ((w[w.length - 1].t - w[0].t) / 1000) * 3.6;
    RUN.spT = Date.now();
  }
  function gpsTick() {
    if (!RUN || !RUN.gps) return;
    var el = $("krp-g"), k = RUN.steps[RUN.i] && RUN.steps[RUN.i][0], now = Date.now(), tgt = RUN.p.v, st = "", cls = "";
    if (RUN.sp == null || now - (RUN.spT || 0) > 10000) { st = "Recherche du signal GPS"; cls = "wait"; RUN.hotSince = 0; }
    else if (k === "course") {
      if (RUN.sp > tgt * 1.08) { st = "Un peu trop vite"; cls = "hot"; if (!RUN.hotSince) RUN.hotSince = now; if (now - RUN.hotSince > 12000 && now - (RUN.lastWarn || 0) > 45000) { RUN.lastWarn = now; say("Un peu trop vite. Ralentis."); if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} } } }
      else { RUN.hotSince = 0; st = RUN.sp < tgt * 0.92 ? "Plus lent que prévu" : "Dans la cible"; cls = RUN.sp < tgt * 0.92 ? "low" : "ok"; }
    } else { RUN.hotSince = 0; }
    if (el) { el.className = "krp-g " + cls; el.innerHTML = (RUN.sp != null && cls !== "wait" ? "<b>" + fmtV(RUN.sp) + " km/h</b> mesurés" : "") + "<span>" + st + "</span><em>" + (RUN.km >= 0.05 ? String(Math.round(RUN.km * 100) / 100).replace(".", ",") + " km" : "") + "</em>"; }
  }
  function pos() { var base = RUN.auOk && RUN.au && !RUN.au.paused ? RUN.au.currentTime : (Date.now() - RUN.t0 - RUN.pausedMs) / 1000; return base + RUN.off; }
  function stepAt(t) { var i = 0; while (i < RUN.steps.length - 1 && t >= RUN.starts[i + 1]) i++; return i; }
  // La vitesse et la consigne claire de l'étape en cours
  function spd(kind) { return kind === "course" ? RUN.p.v : kind === "retour" ? Math.max(3.5, RUN.p.vw - 1.5) : RUN.p.vw; }
  function instr(kind) {
    var v = spd(kind), tp = RUN.where === "tapis", m = RUN.montre, big = kind === "course";
    if (tp) return { line: "Règle le tapis sur " + fmtV(v) + " km/h", say: (big ? "Cours." : "Marche.") + " Tapis à " + fmtV(v) + "." };
    if (m && big) return { line: "Vise " + pace(v) + " par km, entre " + pace(v * 1.04) + " et " + pace(v * 0.96), say: "Cours. Allure " + paceSay(v) + " par kilomètre." };
    if (m) return { line: kind === "retour" ? "Marche lente" : "Marche à environ " + pace(v) + " par km", say: LAB[kind][3] };
    return { line: big ? "Allure où tu peux parler, environ " + fmtV(v) + " km/h" : kind === "retour" ? "Marche lente" : "Marche d'un bon pas", say: LAB[kind][3] };
  }
  function announce() {
    var s = RUN.steps[RUN.i], k = s[0], I = instr(k);
    say(I.say);
    if (!RUN.auOk) beep(k === "course" ? 990 : 660, 0.2);
    if (navigator.vibrate) { try { navigator.vibrate(k === "course" ? [120, 80, 120] : 200); } catch (e) {} }
    try { if (navigator.mediaSession && window.MediaMetadata) { navigator.mediaSession.metadata = new MediaMetadata({ title: LAB[k][0] + " · " + fmtV(spd(k)) + " km/h", artist: "KinéForce · palier " + RUN.rp + " sur 10", album: "Reprise de la course" }); navigator.mediaSession.setActionHandler("pause", pause); navigator.mediaSession.setActionHandler("play", pause); } } catch (e2) {}
  }
  function tick() {
    if (!RUN || RUN.paused) return;
    var t = pos();
    if (t >= RUN.tot) { endRun(); return; }
    var i = stepAt(t);
    if (i !== RUN.i) { RUN.i = i; RUN.left = -1; announce(); paint(); }
    var left = Math.ceil(RUN.starts[i + 1] - t);
    gpsTick();
    if (left !== RUN.left) { RUN.left = left; if (left === 10 && RUN.steps[i][1] >= 1) say("Encore 10 secondes."); if (left <= 3 && left > 0 && !RUN.auOk) beep(520, 0.08); upd(); }
  }
  function paint() {
    var s = RUN.steps[RUN.i], L = LAB[s[0]], el = screen(), k = s[0], I = instr(k), v = spd(k);
    var rest = Math.round(RUN.starts.slice(-1)[0] / 60 - RUN.starts[RUN.i + 1] / 60);
    var nCourse = RUN.steps.filter(function (x) { return x[0] === "course"; }).length, kC = RUN.steps.slice(0, RUN.i + 1).filter(function (x) { return x[0] === "course"; }).length;
    var nx = RUN.steps[RUN.i + 1];
    el.style.background = L[2];
    el.innerHTML = "<div class='kr-top'><span>Palier " + RUN.rp + " sur 10</span><span>" + (k === "course" ? "Course " + kC + " sur " + nCourse : esc(L[0])) + "</span></div>" + tlHtml(RUN.steps, RUN.i) +
      "<div class='krp-big'><b>" + esc(L[1]) + "</b><em id='krp-t'>" + mmss(Math.max(0, Math.ceil(RUN.starts[RUN.i + 1] - pos()))) + "</em></div>" +
      "<div class='krp-card'><div class='krp-v'><strong>" + fmtV(v) + "</strong><span>km/h</span><i>" + pace(v) + " /km</i></div><p class='krp-line'>" + esc(I.line) + "</p>" +
      (k === "course" && RUN.z ? "<p class='krp-line hr'>Zone cardio : " + RUN.z.lo + " à " + RUN.z.hi + " battements</p>" : k === "course" ? "<p class='krp-line hr'>Tu dois pouvoir parler en phrases complètes</p>" : "") +
      (RUN.gps ? "<div class='krp-g wait' id='krp-g'></div>" : "") + "</div>" +
      "<div class='kr-small2' id='krp-r'>" + (nx ? "Ensuite : " + esc(LAB[nx[0]][0].toLowerCase()) + " · " + fmtV(spd(nx[0])) + " km/h · " + nx[1] + " min" : "Dernière étape") + "</div>" +
      (k === "course" && RUN.p.v - 0.5 >= 5 && !RUN.paused ? "<button type='button' class='krp-slow' onclick='KineReprise.slower()'>Je n'arrive pas à tenir cette allure<span>Ralentir de 0,5 km/h" + (RUN.slow ? " · déjà " + RUN.slow + " fois" : "") + "</span></button>" : "") +
      "<button type='button' class='krp-lnk dark' onclick='KineReprise.poche()'>Mode poche : écran noir et touches bloquées" + (RUN.gps ? ", le GPS continue" : "") + "</button>" +
      "<div class='kr-btns'><button type='button' onclick='KineReprise.pause()'>" + (RUN.paused ? "Reprendre" : "Pause") + "</button><button type='button' onclick='KineReprise.quit()'>Arrêter</button></div>";
    el.classList.add("open"); upd();
  }
  // Mode poche : l'écran reste allumé (donc le GPS tourne) mais il est noir et ne réagit pas aux touches ; on le réveille en maintenant le bouton
  var PT = null;
  function poche() {
    if (!RUN) return; var el = $("krp-poche");
    if (!el) { el = document.createElement("div"); el.id = "krp-poche"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Mode poche"); document.body.appendChild(el); }
    el.innerHTML = "<div class='kp-t' id='krp-pt'></div><button type='button' id='krp-pw'>Maintiens 2 secondes pour réveiller</button>";
    var b = $("krp-pw"), go = function () { clearTimeout(PT); b.classList.add("hold"); PT = setTimeout(function () { el.classList.remove("open"); }, 1800); }, no = function () { clearTimeout(PT); b.classList.remove("hold"); };
    b.addEventListener("pointerdown", go); b.addEventListener("pointerup", no); b.addEventListener("pointerleave", no); b.addEventListener("pointercancel", no);
    el.classList.add("open"); upd();
  }
  function upd() {
    var pt = $("krp-pt"); if (pt && RUN && RUN.i >= 0) pt.textContent = LAB[RUN.steps[RUN.i][0]][0] + " " + mmss(Math.max(0, Math.ceil(RUN.starts[RUN.i + 1] - pos()))); var t = $("krp-t"); if (t && RUN) t.textContent = mmss(Math.max(0, Math.ceil(RUN.starts[RUN.i + 1] - pos()))); }
  // Le patient ne tient pas l'allure : on la baisse tout de suite, pour la suite de la séance et pour les prochaines
  function slower() {
    if (!RUN || RUN.p.v - 0.5 < 5) return;
    RUN.p.v = round5(RUN.p.v - 0.5); RUN.slow++;
    var P = prof(RUN.c); if (P) { P.v = RUN.p.v; saveProf(P); }
    say("D'accord. " + (RUN.where === "tapis" ? "Tapis à " + fmtV(RUN.p.v) + "." : RUN.montre ? "Allure " + paceSay(RUN.p.v) + " par kilomètre." : "Ralentis un peu."));
    if (navigator.vibrate) { try { navigator.vibrate(150); } catch (e) {} }
    paint();
  }
  function pause() {
    if (!RUN) return; RUN.paused = !RUN.paused;
    if (RUN.paused) { RUN.ps = Date.now(); RUN.pt = pos(); try { if (RUN.au) RUN.au.pause(); } catch (e) {} say("Pause."); }
    else { RUN.pausedMs += Date.now() - RUN.ps; try { if (RUN.au && RUN.auOk) RUN.au.play(); } catch (e) {} say("On reprend."); }
    paint();
  }
  function quit() { if (!RUN) return; if (RUN.i >= 0 && pos() > 120 && confirm("Arrêter la séance ? Tu pourras noter ta douleur pour que ton kiné le sache.")) { RUN.partial = true; endRun(); return; } close(); }
  function endRun() {
    clearInterval(RUN.tm); gpsStop(); try { if (RUN.au) RUN.au.pause(); } catch (e) {} say(RUN.partial ? "Séance arrêtée." : "Séance terminée, bravo !");
    var el = screen(); el.style.background = "#0E141F";
    el.innerHTML = "<div class='kr-top'><span>Palier " + RUN.rp + " sur 10</span><span>" + (RUN.partial ? "arrêtée" : "terminée") + "</span></div><div class='krp-end'><b>" + (RUN.partial ? "Séance arrêtée" : "Bravo !") + "</b>" +
      (RUN.gps && RUN.km >= 0.05 ? "<p>Distance mesurée : " + String(Math.round(RUN.km * 100) / 100).replace(".", ",") + " km.</p>" : "") + (RUN.slow ? "<p>Tu as ralenti " + RUN.slow + " fois : ta prochaine allure est de " + fmtV(RUN.p.v) + " km/h" + (RUN.slow >= 2 ? ", et tu refais ce palier pour te l'approprier." : ".") + "</p>" : "") +
      (RUN.gps ? "" : "<label class='krp-hrf'><span>Distance affichée par ta montre ou le tapis, en km (si tu veux)</span><input id='krp-km' type='number' inputmode='decimal' step='0.01' min='0' max='60' placeholder='facultatif' /></label>") +
      "<label class='krp-hrf'><span>Rythme cardiaque moyen en course (si ta montre le donne)</span><input id='krp-hr' type='number' inputmode='numeric' min='60' max='220' placeholder='facultatif' /></label>" +
      "<span>Douleur pendant la séance, de 0 à 10</span><div class='krp-scale'>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return "<button onclick='KineReprise.done(" + v + ")'>" + v + "</button>"; }).join("") + "</div>" +
      "<p>Demain matin, l'appli te demandera ta douleur au réveil : c'est elle qui décide du palier suivant. La séance s'ajoute aussi à ton journal de course.</p></div>";
  }
  function done(pain) {
    var r = RUN, min = Math.max(1, Math.round(Math.min(pos(), r.tot) / 60));
    var run = { id: Date.now().toString(36), t: Date.now(), d: iso(), min: min, eff: 2, pain: pain, rp: r.rp, cid: r.c.id, v0: r.v0, v1: r.p.v, slow: r.slow, lieu: r.where };
    var hrEl = $("krp-hr"), hr = hrEl ? num(hrEl.value, 60, 220) : null;
    if (r.gps && r.km >= 0.05) { run.km = Math.round(r.km * 100) / 100; run.gps = 1; }
    var kmEl = $("krp-km"), km = kmEl ? num(kmEl.value, 0.05, 60) : null; if (km) run.km = Math.round(km * 100) / 100;
    if (r.z) run.hz = r.z.lo + "-" + r.z.hi; if (r.imc) run.imc = r.imc;
    if (hr) { run.hr = Math.round(hr); if (r.z && hr > r.z.hi + 3) { run.hot = 1; var PP = prof(r.c); if (PP && PP.v - 0.5 >= 5) { PP.v = round5(PP.v - 0.5); saveProf(PP); } if (window.showToast) showToast("Ton cœur était au-dessus de la zone : prochaine séance à " + fmtV(PP ? PP.v : r.p.v) + " km/h"); } }
    if (r.partial || pain > r.c.max) run.stop = 1;
    try { var a = JSON.parse(localStorage.getItem("kf-runs") || "[]"); a.push(run); localStorage.setItem("kf-runs", JSON.stringify(a)); } catch (e) {}
    if (window.KineStats) try { KineStats.ev("p", "reprise"); } catch (e) {}
    close(); refresh();
  }
  function close() {
    if (RUN) { clearInterval(RUN.tm); clearTimeout(RUN.pk); gpsStop(); try { if (RUN.au) { RUN.au.pause(); URL.revokeObjectURL(RUN.au.src); } } catch (e) {} }
    RUN = null; PRE = null; var pk = $("krp-poche"); if (pk) pk.classList.remove("open"); var el = $("krp-run"); if (el) el.classList.remove("open"); document.body.style.overflow = "";
    try { if (wake) wake.release(); } catch (e) {} wake = null; if (typeof stopSpeech === "function") stopSpeech();
    try { if (navigator.mediaSession) navigator.mediaSession.metadata = null; } catch (e) {}
  }

  return { journal: journal, active: active, PALIERS: PALIERS, MODELES: MODELES, etat: etat, kineCard: kineCard, edit: edit, m: setM, k: setK, vs: vStep, vf: vFix, vc: vClear, send: send, stop: stop,
    patientCard: patientCard, lendemain: lendemain, go: go, start: start, pw: pw, pm: pm, q: q, qa: qa, qb: qb, qx: qx, qv: qv, qs: qs, withKine: withKine, slower: slower, pause: pause, quit: quit, done: done, close: close, qn: qn, poche: poche, pa: pa, adv: applyAdvice,
    pace: pace, hrOf: hrOf, prof: function () { return prof(cfgNow()); }, _setProf: function (o) { var c = cfgNow(); saveProf(Object.assign({ cid: c.id, v: 9, vw: 6, lieu: "tapis", montre: false, src: "patient", d: iso(), vk: c.v || null }, o || {})); },
    _run: function () { return RUN; }, _skip: function () { if (RUN && RUN.i >= 0) { RUN.off += RUN.starts[RUN.i + 1] - pos() + 0.05; tick(); } } };
})();
