/* ═══════════ KinéForce — « Mets l'appli sur ton écran d'accueil » ═══════════
   Tant que l'appli est ouverte dans le navigateur (et pas depuis l'icône), c'est la première chose proposée
   à chaque ouverture : un bouton « Installer » quand le téléphone le permet (Android, Chrome),
   sinon les étapes exactes pour ce téléphone et ce navigateur (iPhone Safari, Chrome, Samsung…). */
(function () {
  "use strict";
  var ua = navigator.userAgent || "";
  function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true || document.referrer.indexOf("android-app://") === 0; }
  var IOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var ANDROID = /android/i.test(ua), SAMSUNG = /SamsungBrowser/i.test(ua), FIREFOX = /firefox|fxios/i.test(ua);
  var INAPP = /FBAN|FBAV|Instagram|Line\/|Snapchat|Messenger|; wv\)/i.test(ua);
  var IOS_OTHER = IOS && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//i.test(ua);   // iPhone, mais pas Safari
  var MOBILE = IOS || ANDROID || /mobile/i.test(ua);
  var prompt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); prompt = e; window.deferredPrompt = e; var b = document.getElementById("kin-go"); if (b) refresh(); });
  window.addEventListener("appinstalled", function () { close(true); });

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var SHARE = "<svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M12 3v12M7.5 7.5 12 3l4.5 4.5'/><path d='M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1'/></svg>";
  var PLUS = "<svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' aria-hidden='true'><rect x='4' y='4' width='16' height='16' rx='4'/><path d='M12 8v8M8 12h8'/></svg>";
  var DOTS = "<svg viewBox='0 0 24 24' width='22' height='22' fill='currentColor' aria-hidden='true'><circle cx='12' cy='5' r='2'/><circle cx='12' cy='12' r='2'/><circle cx='12' cy='19' r='2'/></svg>";
  var MENU = "<svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' aria-hidden='true'><path d='M4 7h16M4 12h16M4 17h16'/></svg>";
  function step(n, ic, html) { return "<li><b>" + n + "</b><span>" + html + "</span>" + (ic ? "<i>" + ic + "</i>" : "") + "</li>"; }

  function body() {
    if (prompt) return "<p class='kin-p'>Un appui suffit : KinéForce s'ajoute à côté de tes autres applis.</p><button class='kin-go' id='kin-go'>Installer KinéForce</button>";
    if (INAPP) return "<p class='kin-p'>Tu es dans le navigateur d'une autre appli (Facebook, Instagram…). Ouvre d'abord ce lien dans " + (IOS ? "<strong>Safari</strong>" : "<strong>Chrome</strong>") + " :</p>" +
      "<ol class='kin-steps'>" + step(1, IOS ? SHARE : DOTS, "Touche le menu de cette page") + step(2, null, "Choisis <strong>« Ouvrir dans " + (IOS ? "Safari" : "le navigateur") + " »</strong>") + "</ol>" + copyBtn();
    if (IOS && !IOS_OTHER) return "<ol class='kin-steps'>" +
      step(1, SHARE, "Touche le bouton <strong>Partager</strong>, " + (/ipad/i.test(ua) || navigator.maxTouchPoints > 1 && !/iphone/i.test(ua) ? "en haut de l'écran" : "en bas de l'écran") + ".") +
      step(2, PLUS, "Fais défiler, puis touche <strong>« Sur l'écran d'accueil »</strong>.") +
      step(3, null, "Touche <strong>« Ajouter »</strong>, en haut à droite. C'est fait !") + "</ol>" +
      "<div class='kin-arrow' aria-hidden='true'>↓</div>";
    if (IOS_OTHER) return "<ol class='kin-steps'>" +
      step(1, SHARE, "Touche le bouton <strong>Partager</strong> (en haut à droite, à côté de l'adresse).") +
      step(2, PLUS, "Touche <strong>« Sur l'écran d'accueil »</strong>, puis <strong>« Ajouter »</strong>.") + "</ol>" +
      "<p class='kin-small'>Si tu ne trouves pas ce choix, ouvre ce lien dans <strong>Safari</strong>.</p>" + copyBtn();
    if (SAMSUNG) return "<ol class='kin-steps'>" + step(1, MENU, "Touche le <strong>menu</strong> ≡, en bas à droite.") +
      step(2, PLUS, "Touche <strong>« Ajouter la page à »</strong>, puis <strong>« Écran d'accueil »</strong>.") + step(3, null, "Confirme avec <strong>« Ajouter »</strong>.") + "</ol>";
    if (ANDROID && FIREFOX) return "<ol class='kin-steps'>" + step(1, DOTS, "Touche le <strong>menu</strong> ⋮.") + step(2, PLUS, "Touche <strong>« Installer »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.") + "</ol>";
    if (ANDROID) return "<ol class='kin-steps'>" + step(1, DOTS, "Touche le <strong>menu</strong> ⋮, en haut à droite.") +
      step(2, PLUS, "Touche <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.") + step(3, null, "Confirme avec <strong>« Installer »</strong>.") + "</ol>";
    return "<p class='kin-p'>Ouvre cette adresse sur ton téléphone pour installer KinéForce :</p>" + copyBtn();
  }
  function copyBtn() { return "<button class='kin-copy' id='kin-copy'>Copier le lien de l'appli</button>"; }

  function el() {
    var e = document.getElementById("kin-sheet"); if (e) return e;
    e = document.createElement("div"); e.id = "kin-sheet"; e.className = "kin-sheet kf-sheet"; e.setAttribute("role", "dialog"); e.setAttribute("aria-modal", "true"); e.setAttribute("aria-label", "Installer KinéForce");
    document.body.appendChild(e); return e;
  }
  function refresh() {
    if (!prompt && window.deferredPrompt) prompt = window.deferredPrompt;
    var e = el(), seen = +(get("kf-install-seen") || 0);
    e.innerHTML = "<div class='kin-card'>" +
      "<div class='kin-hero'><img src='assets/icons/icon-192.png' alt='' class='kin-icon'><img src='assets/lumiere/yass-salut.webp' alt='' class='kin-yass'></div>" +
      "<h2 class='kin-h'>Mets KinéForce sur ton écran d'accueil</h2>" +
      "<p class='kin-lede'>Elle s'ouvre alors comme une vraie appli, en plein écran, et elle marche même sans internet. Tes rappels et Yass sont toujours là.</p>" +
      body() +
      "<button class='kin-later' id='kin-later'>Plus tard</button>" +
      (seen >= 2 ? "<button class='kin-never' id='kin-never'>C'est déjà fait, ne plus afficher</button>" : "") +
      "</div>";
    var go = document.getElementById("kin-go"); if (go) go.onclick = install;
    var cp = document.getElementById("kin-copy"); if (cp) cp.onclick = copy;
    document.getElementById("kin-later").onclick = function () { close(false); };
    var nv = document.getElementById("kin-never"); if (nv) nv.onclick = function () { set("kf-install-never", "1"); close(false); };
  }
  function install() {
    if (!prompt) return;
    prompt.prompt();
    prompt.userChoice.then(function (r) { prompt = null; window.deferredPrompt = null; if (r.outcome === "accepted") { set("kf-installed", "1"); close(true); } else refresh(); });
  }
  function copy() {
    var url = location.origin + location.pathname, b = document.getElementById("kin-copy");
    var done = function () { if (b) b.textContent = "Lien copié ✓"; };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { if (b) b.textContent = url; }); else if (b) b.textContent = url;
  }
  function close(installed) {
    var e = document.getElementById("kin-sheet"); if (e) e.classList.remove("open");
    document.documentElement.classList.remove("kin-on");
    if (installed) set("kf-installed", "1");
    try { sessionStorage.setItem("kf-install-later", "1"); } catch (er) {}
    // La mascotte, qui attendait que la fenêtre se ferme, peut maintenant se présenter
    if (window.KineMascotte && KineMascotte.maybe) setTimeout(function () { try { KineMascotte.maybe(); } catch (er) {} }, 600);
  }
  function show() {
    if (standalone() || get("kf-install-never") === "1") return;
    if (!prompt && window.deferredPrompt) prompt = window.deferredPrompt;
    if (!MOBILE && !prompt) return;              // ordinateur : seulement si le navigateur sait installer
    try { if (sessionStorage.getItem("kf-install-later")) return; } catch (e) {}
    set("kf-install-seen", String(+(get("kf-install-seen") || 0) + 1));
    var bar = document.getElementById("pwa-install-bar"); if (bar) bar.style.display = "none";
    refresh(); document.documentElement.classList.add("kin-on");
    requestAnimationFrame(function () { el().classList.add("open"); });
  }
  window.KineInstaller = { show: function () { try { sessionStorage.removeItem("kf-install-later"); } catch (e) {} show(); }, standalone: standalone };
  // Tout de suite à l'ouverture (l'ordinateur attend un peu que le navigateur dise s'il sait installer)
  function init() { if (MOBILE) show(); else setTimeout(show, 2500); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
