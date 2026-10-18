/* ═══════════ KinéForce — fiabilité ═══════════
   1. Rapports d'erreurs automatiques : quand l'appli plante sur un téléphone, elle envoie (anonymement, sans aucune
      donnée de santé) le message d'erreur, l'endroit, la version et le modèle d'appareil. Au plus 5 par ouverture.
   2. « Signaler un souci » : la personne décrit le problème en une phrase, le contexte technique est joint.
   3. Nettoyage des vieux réglages qui pourraient faire diverger l'appli d'un téléphone à l'autre.
   Chargé tout en haut de la page pour attraper aussi les erreurs du démarrage. */
(function () {
  "use strict";
  var LOG = [], SENT = {}, nAuto = 0, QKEY = "kf-bugq";
  function cut(t, n) { t = String(t == null ? "" : t); return t.length > n ? t.slice(0, n) : t; }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // ── 3. Vieux réglages retirés (les données du patient ne sont jamais touchées) ──
  try { ["kf-eco", "kf-eco-auto", "kf-masc-peek", "kf-install-dismissed"].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}

  function where() {
    try {
      var pg = document.querySelector(".page.active"), ov = document.querySelector("#seq-overlay.open, #kcam-run.open, #kc-sheet.open, #kb-sheet.open, #kf-masc.open, .kf-sheet.open");
      return cut((pg ? pg.id : "?") + (ov ? " > " + (ov.id || ov.className.split(" ")[0]) : ""), 80);
    } catch (e) { return "?"; }
  }
  function ctx() {
    var sa = false; try { sa = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; } catch (e) {}
    return { v: cut(window.KF_VERSION || "?", 40), ua: cut(navigator.userAgent, 380), scr: cut(innerWidth + "x" + innerHeight + "@" + (window.devicePixelRatio || 1), 40), pg: where(), sa: !!sa };
  }
  function push(d) {
    if (typeof window.fbReport === "function") { try { window.fbReport(d).catch(function () { queue(d); }); return; } catch (e) {} }
    queue(d);
  }
  function queue(d) { var q = lsGet(QKEY, []); if (q.length < 10) { q.push(d); lsSet(QKEY, q); } }
  function flush() {
    if (typeof window.fbReport !== "function" || !navigator.onLine) return;
    var q = lsGet(QKEY, []); if (!q.length) return; lsSet(QKEY, []);
    q.forEach(function (d) { try { window.fbReport(d).catch(function () {}); } catch (e) {} });
  }
  window.addEventListener("online", flush);

  // ── 1. Erreurs automatiques ──
  var NOISE = /ResizeObserver loop|Script error\.?$|Non-Error promise rejection|AbortError|The play\(\) request was interrupted|NotAllowedError: play|webkitExitFullScreen|Load failed|Failed to fetch|NetworkError|chrome-extension|moz-extension/i;
  function report(msg, src, stack) {
    msg = cut(msg, 600); if (!msg || NOISE.test(msg) || NOISE.test(src || "")) return;
    LOG.push(new Date().toISOString().slice(11, 19) + " " + cut(msg, 140)); if (LOG.length > 8) LOG.shift();
    var key = msg + "|" + src; if (SENT[key] || nAuto >= 5) return; SENT[key] = 1; nAuto++;
    var d = ctx(); d.k = "auto"; d.m = msg; d.src = cut(src || "", 200); d.st = cut(stack || "", 1400);
    // laisser l'appli finir de démarrer (Firebase) avant d'envoyer
    setTimeout(function () { push(d); }, 1500);
  }
  window.addEventListener("error", function (e) {
    if (e && e.target && e.target !== window && (e.target.src || e.target.href)) return;   // ressource absente (image…) : pas un plantage
    var er = e && e.error; if (!er && !(e && e.message)) return;   // événement vide (ressource bloquée…) : rien à signaler
    report((er && er.message) || (e && e.message) || "Erreur", (e && e.filename ? e.filename.replace(location.origin, "") : "") + ":" + (e && e.lineno) + ":" + (e && e.colno), er && er.stack);
  }, true);
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason; report("Promesse : " + ((r && r.message) || String(r)), "", r && r.stack);
  });

  // ── 2. Signaler un souci ──
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sheet() {
    var el = $("kf-bug"); if (el) return el;
    el = document.createElement("div"); el.id = "kf-bug"; el.className = "kf-sheet kf-bug"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Signaler un souci");
    document.body.appendChild(el); return el;
  }
  function open() {
    var el = sheet(), c = ctx();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineFiable.close()' aria-label='Retour'>←</button>" +
      "<h2 class='kfb-h'>Signaler un souci</h2><p class='kfb-p'>Dites en une phrase ce qui ne va pas : un écran bizarre, un bouton qui ne répond pas, Yass qu'on n'entend pas… Je reçois aussi le modèle du téléphone et la version de l'appli, rien d'autre.</p>" +
      "<textarea id='kfb-t' maxlength='800' rows='5' placeholder='Ex. : quand je lance la caméra, je n’entends pas Yass.'></textarea>" +
      "<div class='kfb-ctx'><span>Version " + esc(String(c.v).replace("kineforce-v", "")) + "</span><span>" + esc(c.scr) + "</span><span>" + (c.sa ? "Appli installée" : "Navigateur") + "</span></div>" +
      "<p class='kfb-ok' id='kfb-ok' role='status'></p>" +
      "<button class='seq-btn-main' id='kfb-send'>Envoyer</button></div>";
    el.classList.add("open");
    $("kfb-send").onclick = function () {
      var t = ($("kfb-t").value || "").trim(); if (t.length < 3) { $("kfb-t").focus(); return; }
      var d = ctx(); d.k = "user"; d.m = cut(t, 1000); d.log = cut(LOG.join("\n"), 1400);
      push(d);
      $("kfb-ok").textContent = "Merci ! C'est envoyé. Je regarde ça au plus vite."; this.disabled = true; this.textContent = "Envoyé";
      setTimeout(close, 1800);
    };
    setTimeout(function () { try { $("kfb-t").focus(); } catch (e) {} }, 300);
  }
  function close() { var el = $("kf-bug"); if (el) el.classList.remove("open"); }

  // Mise à jour à la demande : on demande au téléphone de vérifier, puis on recharge derrière l'écran d'ouverture
  function update() {
    var go = function () { if (window.KineSplash) KineSplash.show(); setTimeout(function () { location.reload(); }, 250); };
    try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.update().then(go, go); else go(); }, go); else go(); } catch (e) { go(); }
  }
  // Espace kiné : les derniers rapports (lecture réservée au compte du kiné)
  function admin() {
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineFiable.close()' aria-label='Retour'>←</button><h2 class='kfb-h'>Rapports de bugs</h2><p class='kfb-p' id='kfb-st'>Chargement…</p><div id='kfb-list'></div></div>";
    el.classList.add("open");
    if (typeof window.fbBugs !== "function" || !(window.fbUser && fbUser.isAdmin)) { $("kfb-st").textContent = "Connectez-vous avec votre compte kiné (Communauté, en haut) pour lire les rapports."; return; }
    fbBugs().then(function (L) {
      $("kfb-st").textContent = L.length ? L.length + " rapport" + (L.length > 1 ? "s" : "") + ", du plus récent au plus ancien." : "Aucun rapport pour l'instant.";
      $("kfb-list").innerHTML = L.map(function (b) {
        var d = b.t && b.t.toDate ? b.t.toDate() : null, dev = /iPhone|iPad/.test(b.ua) ? "iPhone" : /Android/.test(b.ua) ? "Android" : "Ordinateur";
        var os = (b.ua.match(/OS (\d+[_\d]*)/) || b.ua.match(/Android (\d+)/) || [])[1];
        return "<div class='kfb-item " + b.k + "'><b>" + (b.k === "user" ? "Signalé" : "Erreur") + " · " + dev + (os ? " " + esc(String(os).replace(/_/g, ".")) : "") + " · v" + esc(String(b.v).replace("kineforce-v", "")) + "</b>" +
          "<p>" + esc(b.m) + "</p><small>" + (d ? d.toLocaleString("fr-FR") : "") + " · " + esc(b.pg || "") + "</small></div>";
      }).join("");
    }).catch(function () { $("kfb-st").textContent = "Lecture impossible : vérifiez la connexion et le compte kiné."; });
  }

  window.KineFiable = { update: update, admin: admin, open: open, close: close, flush: flush, log: function () { return LOG.slice(); }, _report: report };
})();
