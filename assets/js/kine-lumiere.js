/* ═══════════ KinéForce — refonte « claire et sportive » ═══════════
   Cinq onglets simples : Aujourd'hui · Exercices · Yass · Progrès · Communauté.
   - Exercices regroupe Programme, Bibliothèque et Mes séances (onglets en haut).
   - La Bibliothèque met en vitrine « Tester en vidéo » et marque d'un 📷 les exercices filmables.
   - Yass, au centre, ouvre l'aide (vidéo, question, bouger, ressenti, réglages).
   - Les réglages quittent la page Progrès : ils passent dans une feuille ⚙. */
var KineLumiere = (function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function q(s) { return esc(JSON.stringify(s)); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var ICAM = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' aria-hidden='true'><path d='M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><circle cx='12' cy='13' r='3.5'/></svg>";
  var CHEV = "<span class='lu-chev' aria-hidden='true'>›</span>";
  var SHORT = { genou: "Genou", hanche: "Hanche", ischio: "Ischios", mollet: "Mollets", dos: "Dos", gainage: "Gainage", epaule: "Épaules", poussee: "Poussée",
                tirage: "Tirage", bras: "Bras", equilibre: "Équilibre", mobilite: "Mobilité", cardio: "Cardio", reactif: "Réactifs" };

  /* ════════ Feuille du bas (aide de Yass, réglages) ════════ */
  function sheet(html, cls) {
    var el = $("lu-sheet");
    if (!el) {
      el = document.createElement("div"); el.id = "lu-sheet"; el.className = "lu-sheet";
      el.innerHTML = "<div class='lu-sh-bg' onclick='KineLumiere.closeSheet()'></div><div class='lu-sh-panel' role='dialog' aria-modal='true'></div>";
      document.body.appendChild(el);
    }
    var p = el.querySelector(".lu-sh-panel");
    p.className = "lu-sh-panel" + (cls ? " " + cls : "");
    p.innerHTML = "<span class='lu-grab' aria-hidden='true'></span>" + html;
    requestAnimationFrame(function () { el.classList.add("open"); });
    return p;
  }
  function closeSheet() { var el = $("lu-sheet"); if (el) el.classList.remove("open"); }
  function then(js) { closeSheet(); setTimeout(js, 180); }

  function row(onclick, title, sub, right) {
    return "<button class='lu-row' onclick=\"" + onclick + "\"><span><b>" + esc(title) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" + (right != null ? "<em>" + esc(right) + "</em>" : CHEV) + "</button>";
  }

  // Yass, au centre de la barre : tout ce qu'il sait faire, au même endroit
  function hub() {
    var M = window.KineMascotte, face = M && M.portrait ? M.portrait() : null;
    var noted = window.KineCheckin && KineCheckin.get && KineCheckin.get(iso(new Date()));
    var h = "<div class='lu-hub-head'>" + (face ? "<img src='" + face + "' alt=''>" : "") + "<div><b>Je peux t'aider ?</b><small>Yass, ton coach</small></div></div>" +
      (window.KineCamera ? "<button class='lu-hub-vid' onclick=\"KineLumiere.then('KineCamera.open()')\"><span class='lu-ic'>" + ICAM + "</span><span><b>Tester en vidéo</b><small>Je regarde ton mouvement, je te corrige à voix haute et je compte pour toi</small></span>" + CHEV + "</button>" : "") +
      "<div class='lu-rows'>" +
        (M ? row("KineLumiere.then('KineMascotte.faq()')", "Poser une question", "Douleur, matériel, programme…") : "") +
        (M ? row("KineLumiere.then('KineMascotte.bouge()')", "Bouger 2 minutes avec moi", "Une pause active, debout") : "") +
        (window.KineCheckin && !noted ? row("KineLumiere.then('KineCheckin.open()')", "Noter mon ressenti", "30 secondes : douleur, sommeil, moral") : "") +
        (window.KineLexique ? row("KineLumiere.then('KineLexique.open()')", "Les mots du kiné expliqués", "") : "") +
        row("KineLumiere.settings()", "Réglages", "Coach, son, taille du texte, notifications") +
      "</div>";
    sheet(h, "lu-hub");
    if (M && M.isOff && !M.isOff() && typeof speak === "function" && (typeof seqSoundOn === "undefined" || seqSoundOn)) { try { speak("Je peux t'aider ?", { prio: 1, now: true, ttl: 4000 }); } catch (e) {} }
  }
  // Les mêmes choix, dans la bulle de Yass (sa tête sur le côté de l'écran)
  function go(js) { if (window.KineMascotte) KineMascotte.hide(); setTimeout(function () { (new Function(js))(); }, 200); }
  function menuHtml(canNote) {
    var M = window.KineMascotte, it = function (js, t, sub) { return "<button class='lu-row' onclick=\"KineLumiere.go('" + js + "')\"><span><b>" + esc(t) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" + CHEV + "</button>"; };
    return (window.KineCamera ? "<button class='lu-hub-vid' onclick=\"KineLumiere.go('KineCamera.open()')\"><span class='lu-ic'>" + ICAM + "</span><span><b>Tester en vidéo</b><small>Je regarde ton mouvement et je te corrige</small></span>" + CHEV + "</button>" : "") +
      "<div class='lu-rows'>" +
        (M ? it("KineMascotte.faq()", "Poser une question", "Douleur, matériel, programme…") : "") +
        (M ? it("KineMascotte.bouge()", "Bouger 2 minutes avec moi", "Une pause active, debout") : "") +
        (window.KineCheckin && canNote ? it("KineCheckin.open()", "Noter mon ressenti", "30 secondes") : "") +
        (window.KineLexique ? it("KineLexique.open()", "Les mots du kiné expliqués", "") : "") +
        it("KineLumiere.explainMenu()", "Tu n'as pas compris comment ça marche ?", "Je te réexplique l'appli ou un onglet") +
        it("KineLumiere.settings()", "Réglages", "Coach, son, taille du texte") +
      "</div>";
  }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  function bigOn() { try { return localStorage.getItem("kf-big") === "1"; } catch (e) { return false; } }
  function settings() {
    var M = window.KineMascotte, N = window.KineNotifs, G = window.KineGuide;
    var h = "<h2 class='lu-sh-t'>Réglages</h2><div class='lu-rows'>" +
      (M ? row("KineMascotte.off(!KineMascotte.isOff());KineLumiere.settings()", "Yass, ton coach", "Ses conseils et ses encouragements", M.isOff() ? "désactivé" : "activé") : "") +
      (G ? row("KineLumiere.then('KineGuide.menu()')", "Guidage sonore", "Voix, bips ou métronome", G.label().toLowerCase()) : "") +
      (N && N.available() ? row("KineLumiere.then('KineNotifs.open()')", "Notifications du jour", "", N.label()) : "") +
      row("KineLayout.bigText();KineLumiere.settings()", "Taille du texte", "", bigOn() ? "grande" : "normale") +
      row("KineLumiere.ecoCycle();KineLumiere.settings()", "Animations de Yass", "Économie : moins d'animations en même temps, pour la batterie", ecoPref() === "1" ? "économie" : ecoPref() === "0" ? "complètes" : (eco() ? "auto (économie)" : "auto")) +
      (window.KineCamera && KineCamera.modeSheet ? row("KineLumiere.then('KineCamera.modeSheet()')", "Caméra pendant la séance", "Jamais, me demander, ou toujours") : "") +
      (window.KineCompose ? row("KineLumiere.then('KineCompose.kine()')", "Espace kiné", "Réservé à votre kinésithérapeute") : "") +
      "</div>";
    sheet(h);
  }

  /* ════════ Exercices : Programme · Bibliothèque · Mes séances ════════ */
  var TAB_KEY = "kf-lu-tab", tabNow = jget(TAB_KEY, "prog"), filt = "";
  function exHeader() {
    var page = $("page-guide"), c = page && page.querySelector(".content"); if (!c || $("lu-exh")) return c;
    var h = document.createElement("div"); h.id = "lu-exh"; h.className = "lu-exh";
    h.innerHTML = "<h1 class='lu-h1'>Exercices</h1><div class='lu-tabs' role='tablist'>" +
      [["prog", "Programme"], ["lib", "Bibliothèque"]].map(function (t) {
        return "<button role='tab' data-t='" + t[0] + "' onclick=\"KineLumiere.tab('" + t[0] + "')\">" + t[1] + "</button>"; }).join("") + "</div>";
    c.insertBefore(h, c.firstChild);
    var lib = document.createElement("div"); lib.id = "lu-lib"; lib.className = "lu-panel"; c.appendChild(lib);
    return c;
  }
  function tab(t) {
    if (t) { tabNow = t; jset(TAB_KEY, t); }
    if (tabNow !== "lib") tabNow = "prog";
    var c = exHeader(); if (!c) return;
    var page = $("page-guide");
    page.classList.remove("lu-t-prog", "lu-t-lib", "lu-t-mes"); page.classList.add("lu-t-" + tabNow);
    [].forEach.call(c.querySelectorAll(".lu-tabs button"), function (b) { var on = b.getAttribute("data-t") === tabNow; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    if (tabNow === "lib") renderLib();
    if (t) explainSoon();
  }

  var thumbs = {};
  function camOf(name) { return window.KineCamera && KineCamera.forExercise ? KineCamera.forExercise(name) : null; }
  function renderLib() {
    var box = $("lu-lib"); if (!box || !window.KineBiblio) return;
    KineBiblio.wire();
    var all = KineBiblio.all(), groups = KineBiblio.groups;
    var list = filt === "video" ? all.filter(function (e) { return camOf(e.name); }) : filt ? all.filter(function (e) { return e.group === filt; }) : all;
    var nCam = all.filter(function (e) { return camOf(e.name); }).length;
    var chips = "<button class='lu-chip" + (!filt ? " on" : "") + "' onclick=\"KineLumiere.filter('')\">Tous</button>" +
      (nCam ? "<button class='lu-chip lu-chip-cam" + (filt === "video" ? " on" : "") + "' onclick=\"KineLumiere.filter('video')\">" + ICAM + "En vidéo</button>" : "") +
      groups.map(function (g) { return all.some(function (e) { return e.group === g[0]; }) ? "<button class='lu-chip" + (filt === g[0] ? " on" : "") + "' onclick=\"KineLumiere.filter('" + g[0] + "')\">" + esc(SHORT[g[0]] || g[1]) + "</button>" : ""; }).join("");
    var card = function (e) {
      var c = KineBiblio.color(e.name), cam = camOf(e.name), src = e.thumb || thumbs[e.name];
      return "<div class='lu-card' data-n='" + esc(e.name) + "'" + (e.reactif ? " data-r='" + esc(e.reactif) + "'" : "") + "><button class='lu-card-b' onclick='KineBiblio.demo(" + q(e.name) + ")'>" +
        "<span class='lu-im'>" + (src ? "<img src='" + src + "' alt=''>" : "<img data-n='" + esc(e.name) + "' alt=''>") + "</span>" +
        "<span class='lu-d'><b><i class='lu-lvl c" + c + "'></i>" + esc(e.name) + "</b><small>" + esc(e.repsLabel || "") + "</small></span></button>" +
        (cam ? "<button class='lu-camb' aria-label='Tester " + esc(e.name) + " en vidéo' onclick=\"KineCamera.open('" + cam + "')\">" + ICAM + "</button>" : "") + "</div>";
    };
    var body;
    if (filt) body = "<div class='lu-cards'>" + list.sort(function (a, b) { return KineBiblio.color(a.name) - KineBiblio.color(b.name); }).map(card).join("") + "</div>";
    else body = groups.map(function (g) {
      var it = list.filter(function (e) { return e.group === g[0]; }).sort(function (a, b) { return KineBiblio.color(a.name) - KineBiblio.color(b.name); });
      return it.length ? "<h2 class='lu-gh'>" + esc(g[1]) + "<small>" + it.length + "</small></h2><div class='lu-cards'>" + it.map(card).join("") + "</div>" : "";
    }).join("");
    box.innerHTML =
      (window.KineCamera ? "<button class='lu-hero2' onclick='KineCamera.open()'><span class='lu-ring' aria-hidden='true'></span><img src='assets/lumiere/video-fente.webp' alt=''>" +
        "<span class='lu-tx'><b>Teste ton mouvement en vidéo</b><small>Yass te corrige à voix haute et compte pour toi</small></span><span class='lu-try'>" + ICAM + "Essayer</span></button>" : "") +
      "<div class='lu-chips'>" + chips + "</div>" +
      "<p class='lu-legend'><span><i class='lu-lvl c1'></i>Facile</span><span><i class='lu-lvl c2'></i>Intermédiaire</span><span><i class='lu-lvl c3'></i>Difficile</span>" + (nCam ? "<span class='lu-leg-cam'>" + ICAM + "testable en vidéo</span>" : "") + "</p>" +
      body;
    lazyThumbs(box);
    setTimeout(liveCheck, 450);
  }
  // Les vignettes 3D se dessinent au fil du défilement, quelques-unes à la fois
  var io = null, queue = [], busy = false;
  function lazyThumbs(box) {
    var imgs = box.querySelectorAll("img[data-n]");
    if (!("IntersectionObserver" in window)) { [].forEach.call(imgs, function (im) { queue.push(im); }); pump(); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); queue.push(en.target); } });
      pump();
    }, { rootMargin: "300px" });
    [].forEach.call(imgs, function (im) { io.observe(im); });
  }
  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    setTimeout(function () {
      var t0 = Date.now();
      while (queue.length && Date.now() - t0 < 40) {
        var im = queue.shift(), n = im.getAttribute("data-n"); if (!im.isConnected) continue;
        if (!thumbs[n]) { try { thumbs[n] = window.KineAvatar && KineAvatar.supports(n) ? KineAvatar.snapshot(n, 200) : null; } catch (e) { thumbs[n] = null; } }
        if (thumbs[n]) { im.src = thumbs[n]; im.removeAttribute("data-n"); } else im.parentNode.classList.add("lu-none");
      }
      busy = false; if (queue.length) pump();
    }, 16);
  }
  function filter(f) { filt = f; renderLib(); var c = document.querySelector("#lu-lib .lu-chips"); if (c) { var on = c.querySelector(".on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center" }); } }

  /* ════════ Mode économie : moins d'avatars 3D à la fois sur les téléphones lents ════════
     kf-eco = "1" (forcé), "0" (animations complètes) ; sinon automatique : mémoire faible, ou image saccadée mesurée. */
  function ecoPref() { try { return localStorage.getItem("kf-eco"); } catch (e) { return null; } }
  function eco() {
    var p = ecoPref(); if (p === "1") return true; if (p === "0") return false;
    try { if (localStorage.getItem("kf-eco-auto") === "1") return true; } catch (e) {}
    if (navigator.deviceMemory && navigator.deviceMemory <= 3) return true;
    if (navigator.connection && navigator.connection.saveData) return true;
    return false;
  }
  // Mesure de fluidité pendant une animation : moins de 30 images/s en moyenne → mode économie
  var probed = false;
  function probe() {
    if (probed || ecoPref()) return; probed = true;
    var n = 0, t0 = 0, last = 0, slow = 0;
    (function f(t) {
      if (!t0) { t0 = last = t; return requestAnimationFrame(f); }
      n++; if (t - last > 50) slow++; last = t;
      if (t - t0 < 4000) return requestAnimationFrame(f);
      if (document.hidden) { probed = false; return; }
      var fps = n * 1000 / (t - t0);
      if (fps < 30 || slow > n * 0.25) { try { localStorage.setItem("kf-eco-auto", "1"); } catch (e) {} liveCheck(); }
    })(0);
  }
  function setEco(v) {
    try { if (v == null) localStorage.removeItem("kf-eco"); else localStorage.setItem("kf-eco", v ? "1" : "0"); if (v === false || v == null) localStorage.removeItem("kf-eco-auto"); } catch (e) {}
    liveStop(); liveCheck();
  }

  /* ════════ Les cases au centre de l'écran s'animent : Yass fait l'exercice ════════
     Une rangée entière s'anime (2 cases dans la Bibliothèque, 3 dans Ma séance).
     Chaque case a son propre avatar : le premier est celui de l'appli, les autres sont des copies chargées à la demande. */
  var POOL = [], poolSrc = null, slots = [], chkRaf = 0, gen = 0;
  function inst(i, cb) {
    if (i === 0) return cb(window.KineAvatar || null);
    if (POOL[i]) return cb(POOL[i]);
    if (!poolSrc) poolSrc = fetch("assets/js/kine-avatar.js").then(function (r) { return r.text(); }).catch(function () { return null; });
    poolSrc.then(function (src) {
      if (!src) return cb(null);
      if (!POOL[i]) { try { (new Function(src.replace("window.KineAvatar = {", "window.__kaCopy = {")))(); POOL[i] = window.__kaCopy; window.__kaCopy = null; } catch (e) { return cb(null); } }
      cb(POOL[i] || null);
    });
  }
  function lib() { var p = $("page-guide"); return p && p.classList.contains("active") && p.classList.contains("lu-t-lib") ? "#lu-lib .lu-card" : null; }
  function mes() { var p = $("page-mes"); return p && p.classList.contains("active") ? "#mx-lib .mx-grp[data-n]" : null; }
  function blocked() {
    if (document.hidden) return true;
    return !!document.querySelector(".kf-sheet.open, #rep-guide.open, #seq-overlay.open, #kf-masc.open, #kcam-run.open, #lu-sheet.open, #kf-routine.open");
  }
  function stopSlot(s) {
    s.dead = true;
    if (s.A && s.box.querySelector("canvas")) s.A.hide();
    if (s.box.isConnected) { s.box.innerHTML = s.html; s.box.classList.remove("lu-live"); }
  }
  function liveStop() { slots.forEach(stopSlot); slots = []; }
  function liveCheck() {
    chkRaf = 0;
    var sel = lib() || mes();
    if (!sel || !window.KineAvatar || !window.KineBiblio || blocked()) { liveStop(); return; }
    slots = slots.filter(function (s) { if (!s.dead && s.started && !s.box.querySelector("canvas")) { stopSlot(s); return false; } return !s.dead; });
    var cards = document.querySelectorAll(sel), vh = window.innerHeight, cy = vh * 0.46, best = null, bd = 1e9;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect(); if (r.bottom < 90 || r.top > vh - 110) continue;
      var d = Math.abs(r.top + r.height / 2 - cy); if (d < bd) { bd = d; best = cards[i]; }
    }
    if (!best) { liveStop(); return; }
    var top = Math.round(best.getBoundingClientRect().top), row = [].filter.call(cards, function (c) { return Math.abs(c.getBoundingClientRect().top - top) < 8; });
    if (eco()) row = [best];
    if (slots.length === row.length && slots.every(function (s, k) { return s.card === row[k]; })) return;
    liveStop(); var g = ++gen;
    row.forEach(function (card, k) { start(card, k, g); });
  }
  function start(card, k, g) {
    var box = card.querySelector(".lu-im, .mx-im"), name = card.getAttribute("data-n"), rid = card.getAttribute("data-r") || (window.KineBiblio && (KineBiblio.find(name) || {}).reactif) || null; if (!box || !name) return;
    var s = { card: card, box: box, html: box.innerHTML, A: null };
    slots.push(s);
    inst(k, function (A) {
      if (!A || s.dead || g !== gen) return;
      s.A = A;
      var alive = function () { return !s.dead && box.isConnected && !!box.querySelector("canvas"); };
      var ok;
      if (rid) ok = window.KineReactif && KineReactif.mini && KineReactif.mini(box, rid, alive, A);
      else {
        if (!A.supports(name) && KineAvatar._def(name)) A.register(name, KineAvatar._def(name));
        ok = A.supports(name) && A.show(box, name);
      }
      if (!ok) { s.dead = true; box.innerHTML = s.html; return; }
      s.started = true; box.classList.add("lu-live"); probe();
      if (A.pause) A.pause(false);
      if (!rid) loop(A, name, alive);
    });
  }
  function loop(A, name, alive) {
    var e = KineBiblio.find(name) || {}, wk = window.KineProgress ? (KineProgress.state().week || 1) : 1;
    var inf = A.info(name, e.repsLabel || "10 répétitions", wk), rep = 1, alt = (inf && inf.perSide ? inf.perSide : 1) + 1;
    var startPose = A.startOf(name);
    function cycle() {
      if (!alive()) return;
      var st = (A.plan(name, rep, inf, wk).steps || []).filter(function (x) { return x.pose; });
      rep = rep === 1 && inf && inf.sides ? alt : 1;
      var k = 0;
      (function nx() {
        if (!alive()) return;
        if (k >= st.length) {
          if (st.length < 2 && startPose) { A.step({ pose: startPose, dur: 0.8, side: st[0] ? st[0].side : "L" }); setTimeout(cycle, 1100); }
          else setTimeout(cycle, 250);
          return;
        }
        var s0 = st[k++], d = Math.min(Math.max(s0.dur || 1, 0.3), 2.5);
        A.step({ pose: s0.pose, dur: Math.min(d, 1.6), side: s0.side });
        setTimeout(nx, d * 1000 + 60);
      })();
    }
    setTimeout(cycle, 300);
  }
  function queueCheck() { if (!chkRaf) chkRaf = requestAnimationFrame(liveCheck); }
  window.addEventListener("scroll", queueCheck, { passive: true });
  setInterval(function () { if (slots.length || !blocked()) liveCheck(); }, 1500);

  /* ════════ Yass présente chaque onglet la première fois qu'on l'ouvre ════════ */
  var TABS = {
    prog: { key: "kf-g-prog", steps: [
      { sel: ".lu-pslab", text: "Ici, ta semaine en cours et ta progression sur les vingt-huit jours du programme.", gesture: "point" },
      { sel: ".lu-wks", text: "Tes quatre semaines : chacune a sa règle, et je te préviens quand tu passes à la suivante.", gesture: "point" },
      { sel: ".lu-sess", text: "Tes cinq séances : touches-en une pour voir ses exercices ou la lancer.", gesture: "point" },
      { sel: ".lu-pduo", text: "Tu peux aussi composer ta propre séance, ou relire les règles du programme.", gesture: "point" },
      { sel: ".lu-tabs", text: "Et dans l'onglet Bibliothèque, tu trouves tous les exercices.", gesture: "open" } ] },
    lib: { key: "kf-g-lib", steps: [
      { sel: ".lu-hero2", text: "Ici, tu peux te filmer : je regarde ton mouvement et je te corrige à voix haute.", gesture: "point" },
      { sel: ".lu-chips", text: "Filtre par zone du corps, ou choisis En vidéo pour voir les exercices que je suis à la caméra.", gesture: "point" },
      { sel: "#lu-lib .lu-cards", text: "Fais défiler : je fais l'exercice dans les cases au milieu de l'écran. Touche une case pour le voir en grand.", gesture: "point" },
      { sel: "#lu-lib .lu-camb", text: "Ce petit bouton caméra lance l'exercice directement devant la caméra.", gesture: "open" } ] },
    suivi: { key: "kf-g-suivi", steps: [
      { sel: ".lu-kpi", text: "Tes trois chiffres : les séances faites, celles de la semaine, et ta douleur depuis le début.", gesture: "point" },
      { sel: "#suivi-v2 .kr-remind, #suivi-v2 .kr-cta", text: "Note ton ressenti chaque jour en trente secondes : douleur, sommeil, moral.", gesture: "point" },
      { sel: ".lu-bars", text: "Ici, tes séances semaine par semaine.", gesture: "point" },
      { sel: "#suivi-v2 .lx-send", text: "Ce bouton envoie ton bilan à ton kiné, par message ou par e-mail.", gesture: "point" },
      { sel: ".lu-gear", text: "Et dans la petite roue, tes réglages : ma voix, la taille du texte, les animations.", gesture: "open" } ] },
    community: { key: "kf-g-comm", steps: [
      { sel: ".community-header", text: "La communauté : les séances des autres patients du cabinet, pour se motiver ensemble.", gesture: "wave" },
      { sel: "#community-feed", text: "Connecte-toi pour partager tes séances, envoyer un message et encourager les autres.", gesture: "open" } ] }
  };
  // Revoir une explication, à la demande (bulle de Yass › « Tu n'as pas compris comment ça marche ? »)
  function explainMenu() {
    var o = function (js, t, sub) { return "<button class='lu-row' onclick=\"KineLumiere.closeSheet();setTimeout(function(){" + js + "},250)\"><span><b>" + esc(t) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" + CHEV + "</button>"; };
    sheet("<h2 class='lu-sh-t'>Je te réexplique quoi ?</h2><div class='lu-rows'>" +
      o("KineLumiere.replay('tour')", "Toute l'appli", "La visite complète, en 7 étapes") +
      o("KineLumiere.replay('prog')", "Exercices › Programme", "Tes 4 semaines et tes 5 séances") +
      o("KineLumiere.replay('lib')", "Exercices › Bibliothèque", "Tous les exercices, la vidéo") +
      o("KineLumiere.replay('mes')", "Ma séance", "Composer ta propre séance") +
      o("KineLumiere.replay('suivi')", "Progrès", "Tes chiffres, ton bilan, tes réglages") +
      o("KineLumiere.replay('community')", "Communauté", "Les autres patients du cabinet") + "</div>");
  }
  function replay(k) {
    var M = window.KineMascotte; if (!M || !M.replay) return;
    window.scrollTo(0, 0);
    if (k === "tour") { showPage("home"); setTimeout(function () { window.scrollTo(0, 0); M.replay(null, "kf-tour-v2"); }, 500); return; }
    if (k === "mes") { showPage("mes"); setTimeout(function () { try { localStorage.removeItem("kf-mes-guide"); } catch (e) {} if (window.KineCompose) KineCompose.tab(); }, 400); return; }
    if (k === "prog" || k === "lib") { showPage("guide"); tab(k); } else showPage(k);
    clearTimeout(explT);
    setTimeout(function () { window.scrollTo(0, 0); M.replay(TABS[k].steps, TABS[k].key); }, 700);
  }
  var explT = null;
  function explainSoon() { clearTimeout(explT); explT = setTimeout(explain, 1100); }
  function explain() {
    var M = window.KineMascotte; if (!M || !M.guide || (M.isOff && M.isOff())) return;
    try { if (!localStorage.getItem("kf-tour-v2")) return; } catch (e) { return; }   // la visite générale passe d'abord
    if (document.querySelector(".kf-sheet.open, #kf-masc.open, #rep-guide.open, #seq-overlay.open, #lu-sheet.open")) { explT = setTimeout(explain, 2500); return; }
    var act = document.querySelector(".page.active"), id = act ? act.id.replace("page-", "") : "";
    var k = id === "guide" ? tabNow : id === "suivi" || id === "community" ? id : null, g = k && TABS[k];
    if (!g) return;
    try { if (localStorage.getItem(g.key)) return; } catch (e) { return; }
    window.scrollTo(0, 0);
    M.guide(g.steps, g.key);
  }

  /* ════════ Navigation ════════ */
  function hookNav() {
    if (typeof window.showPage !== "function" || window.showPage.__lu) return;
    var base = window.showPage;
    window.showPage = function (id) {
      base.apply(this, arguments);
      if (id === "guide") tab();
      explainSoon();
    };
    window.showPage.__lu = true;
  }
  // La tête de Yass dans la barre (photo prise par l'avatar dès qu'il est prêt)
  function face() {
    var f = window.KineMascotte && KineMascotte.portrait ? KineMascotte.portrait() : null, el = $("bn-mes-face");
    if (f && el && !el.querySelector("img")) el.innerHTML = "<img src='" + f + "' alt=''>";
    return !!f;
  }

  function init() {
    document.documentElement.classList.add("lu");
    hookNav(); exHeader(); tab();
    // le fond de la barre d'état suit le nouveau fond clair
    var m = document.querySelector("meta[name='theme-color']"); if (m) m.setAttribute("content", "#F6F8FB");
    // iPhone : la zone de l'heure et de la batterie prend la couleur de la page. Quand un voile sombre couvre l'écran
    // (visite de Yass, bulle, fenêtres), on l'assombrit aussi, sinon une bande blanche reste en haut.
    var tint = "";
    setInterval(function () {
      var hole = document.getElementById("km-hole"), c = "#F6F8FB";
      if (hole && parseFloat(getComputedStyle(hole).opacity) > 0.2) c = "#606368";
      else if (document.querySelector("#kin-sheet.open, .kf-masc.ask.open, .kf-masc.big.open")) c = "#77808A";
      else if (document.querySelector("#lu-sheet.open")) c = "#8E969F";
      if (c === tint) return; tint = c;
      if (m) m.setAttribute("content", c);
      document.documentElement.style.backgroundColor = c;
    }, 200);
    var tries = 0, t = setInterval(function () { if (face() || ++tries > 20) clearInterval(t); }, 1200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 30); }); else setTimeout(init, 30);

  return { explainMenu: explainMenu, replay: replay, eco: eco, ecoCycle: function () { var p = ecoPref(); setEco(p == null ? true : p === "1" ? false : null); }, avatar: inst, go: go, menuHtml: menuHtml, _live: function () { return slots.map(function (x) { return x.card.getAttribute("data-n") + (x.started ? "" : "?"); }); }, check: function () { liveCheck(); }, hub: hub, settings: settings, closeSheet: closeSheet, then: function (js) { then(function () { (new Function(js))(); }); }, tab: tab, filter: filter, renderLib: renderLib };
})();
window.KineLumiere = KineLumiere;
