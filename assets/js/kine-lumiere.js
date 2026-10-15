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
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  function bigOn() { try { return localStorage.getItem("kf-big") === "1"; } catch (e) { return false; } }
  function settings() {
    var M = window.KineMascotte, N = window.KineNotifs, G = window.KineGuide;
    var h = "<h2 class='lu-sh-t'>Réglages</h2><div class='lu-rows'>" +
      (M ? row("KineMascotte.off(!KineMascotte.isOff());KineLumiere.settings()", "Yass, ton coach", "Ses conseils et ses encouragements", M.isOff() ? "désactivé" : "activé") : "") +
      (G ? row("KineLumiere.then('KineGuide.menu()')", "Guidage sonore", "Voix, bips ou métronome", G.label().toLowerCase()) : "") +
      (N && N.available() ? row("KineLumiere.then('KineNotifs.open()')", "Notifications du jour", "", N.label()) : "") +
      row("KineLayout.bigText();KineLumiere.settings()", "Taille du texte", "", bigOn() ? "grande" : "normale") +
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
      [["prog", "Programme"], ["lib", "Bibliothèque"], ["mes", "Mes séances"]].map(function (t) {
        return "<button role='tab' data-t='" + t[0] + "' onclick=\"KineLumiere.tab('" + t[0] + "')\">" + t[1] + "</button>"; }).join("") + "</div>";
    c.insertBefore(h, c.firstChild);
    var lib = document.createElement("div"); lib.id = "lu-lib"; lib.className = "lu-panel"; c.appendChild(lib);
    // « Ma séance » vient se ranger dans l'onglet Mes séances
    var mes = $("mes-root");
    if (mes) { mes.classList.remove("content"); mes.classList.add("lu-panel"); c.appendChild(mes); }
    return c;
  }
  function tab(t) {
    if (t) { tabNow = t; jset(TAB_KEY, t); }
    var c = exHeader(); if (!c) return;
    var page = $("page-guide");
    page.classList.remove("lu-t-prog", "lu-t-lib", "lu-t-mes"); page.classList.add("lu-t-" + tabNow);
    [].forEach.call(c.querySelectorAll(".lu-tabs button"), function (b) { var on = b.getAttribute("data-t") === tabNow; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    if (tabNow === "lib") renderLib();
    if (tabNow === "mes" && window.KineCompose) { KineCompose.tab(); }
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
      return "<div class='lu-card'><button class='lu-card-b' onclick='KineBiblio.demo(" + q(e.name) + ")'>" +
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

  /* ════════ Navigation ════════ */
  function hookNav() {
    if (typeof window.showPage !== "function" || window.showPage.__lu) return;
    var base = window.showPage;
    window.showPage = function (id) {
      if (id === "mes") { base.call(this, "guide"); tab("mes"); return; }
      base.apply(this, arguments);
      if (id === "guide") tab();
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
    var tries = 0, t = setInterval(function () { if (face() || ++tries > 20) clearInterval(t); }, 1200);
    // « Ma séance » se redessine : on retire la grille d'exercices, déjà dans Bibliothèque
    var mr = $("mes-root"); if (mr && "MutationObserver" in window) new MutationObserver(function () { if ($("mx-lib")) trimMes(); }).observe(mr, { childList: true });
    trimMes();
  }
  function trimMes() {
    var lib = $("mx-lib"); if (!lib) return;
    var h = lib.parentNode && [].filter.call(lib.parentNode.querySelectorAll(".lx-section"), function (x) { return /Explorer/.test(x.textContent); })[0];
    if (h) h.textContent = "Mon matériel";
    var g = $("mx-gear"); if (g) { var b = g.querySelector("b"); if (b) b.remove(); }
    lib.remove();
    [].forEach.call(document.querySelectorAll("#mes-root .mx-all"), function (x) { x.textContent = "Voir la bibliothèque ›"; x.setAttribute("onclick", "KineLumiere.tab('lib');window.scrollTo(0,0)"); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 30); }); else setTimeout(init, 30);

  return { hub: hub, settings: settings, closeSheet: closeSheet, then: function (js) { then(function () { (new Function(js))(); }); }, tab: tab, filter: filter, renderLib: renderLib };
})();
window.KineLumiere = KineLumiere;
