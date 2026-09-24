/* ═══════════════════════════════════════════════════════════════
   KinéForce — Communauté : partage avec accord explicite
   · Rien n'est publié tant que le patient n'a pas accepté
   · Publication sous pseudonyme, sans nom, photo, e-mail, douleurs ni remarques
   · Le patient peut arrêter le partage et retirer ses publications à tout moment
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var A = ["Lion", "Aigle", "Loup", "Faucon", "Ours", "Tigre", "Renard", "Dauphin", "Lynx", "Cerf", "Colibri", "Panthère"];
  var B = ["agile", "tenace", "serein", "vaillant", "rapide", "solide", "déterminé", "du Nord", "calme", "courageux"];
  function suggest() { return A[Math.floor(Math.random() * A.length)] + " " + B[Math.floor(Math.random() * B.length)]; }
  var pending = null;

  function sheet() {
    var el = $("kf-share");
    if (!el) { el = document.createElement("div"); el.id = "kf-share"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-labelledby", "sh-title"); document.body.appendChild(el); }
    return el;
  }

  window.KineShare = {
    allowed: function () { return get("kf-share") === "yes" && !!(get("kf-pseudo") || "").trim(); },
    undecided: function () { return !get("kf-share"); },
    pseudo: function () { return (get("kf-pseudo") || "Membre").trim(); },
    ask: function (then) {
      pending = then || null;
      var el = sheet(), p = get("kf-pseudo") || suggest();
      el.innerHTML =
        "<div class='kf-sheet-body'>" +
          "<div class='kf-h1' id='sh-title'>Partager vos séances avec les autres patients ?</div>" +
          "<div class='kf-sub'>C'est facultatif. Si vous acceptez, vos séances terminées apparaîtront dans la Communauté, visibles par les autres patients du cabinet.</div>" +
          "<div class='sh-card'><b>Ce qui sera visible</b><ul class='sh-list'><li>votre pseudonyme (pas votre nom)</li><li>la séance faite (J1 à J5) et l'effort ressenti</li><li>les messages que vous choisissez d'écrire</li></ul></div>" +
          "<div class='sh-card'><b>Ce qui ne sera jamais visible</b><ul class='sh-list'><li>votre nom, votre photo, votre adresse e-mail</li><li>vos douleurs et vos remarques de fin de séance</li></ul></div>" +
          "<label class='su-label'>Votre pseudonyme<input class='kf-text su-input' id='sh-pseudo' maxlength='24' value='" + esc(p) + "'></label>" +
          "<div class='kf-sub'>Vous pourrez arrêter le partage et retirer vos publications à tout moment, depuis l'onglet Communauté.</div>" +
        "</div>" +
        "<div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineShare.accept()'>Oui, partager sous ce pseudonyme</button>" +
        "<button class='seq-btn-secondary' onclick='KineShare.refuse()'>Non merci</button></div>";
      el.classList.add("open");
    },
    accept: function () {
      var v = ($("sh-pseudo") && $("sh-pseudo").value.trim()) || "";
      if (v.length < 2) { $("sh-pseudo").classList.add("su-need"); $("sh-pseudo").focus(); return; }
      set("kf-pseudo", v); set("kf-share", "yes");
      sheet().classList.remove("open"); renderCard();
      var t = pending; pending = null; if (t) t();
    },
    refuse: function () { set("kf-share", "no"); sheet().classList.remove("open"); pending = null; renderCard(); },
    stop: function () { set("kf-share", "no"); renderCard(); },
    removeAll: async function () {
      if (!window.fbDeleteMine) return;
      if (!confirm("Retirer toutes vos publications de la Communauté ? Cette action est définitive.")) return;
      var btn = document.querySelector(".sh-remove"); if (btn) { btn.disabled = true; btn.textContent = "Suppression…"; }
      try { var n = await window.fbDeleteMine(); alert(n ? n + " publication" + (n > 1 ? "s retirées." : " retirée.") : "Aucune publication à retirer."); }
      catch (e) { alert("La suppression n'a pas pu se faire. Demandez à votre kinésithérapeute de retirer vos publications."); }
      renderCard();
    }
  };

  // Carte de réglage en haut de la Communauté (quand le patient est connecté)
  function renderCard() {
    var page = $("page-community"); if (!page) return;
    var host = $("sh-settings");
    if (!host) {
      host = document.createElement("div"); host.id = "sh-settings";
      var anchor = $("msg-composer") || $("login-prompt-wrap");
      if (!anchor) return;
      anchor.parentNode.insertBefore(host, anchor);
    }
    if (!window.fbUser) { host.innerHTML = ""; return; }
    if (KineShare.allowed()) {
      host.innerHTML = "<div class='sh-card'><b>Partage activé</b><div class='kf-sub'>Vous apparaissez sous le pseudonyme <strong>" + esc(KineShare.pseudo()) + "</strong>. Seuls la séance et l'effort sont visibles.</div>" +
        "<div class='sh-actions'><button onclick='KineShare.ask()'>Changer de pseudonyme</button><button onclick='KineShare.stop()'>Arrêter le partage</button><button class='danger sh-remove' onclick='KineShare.removeAll()'>Retirer mes publications</button></div></div>";
    } else {
      host.innerHTML = "<div class='sh-card'><b>Partage désactivé</b><div class='kf-sub'>Vos séances ne sont pas publiées. Vous pouvez lire la Communauté et l'activer quand vous voulez.</div>" +
        "<div class='sh-actions'><button onclick='KineShare.ask()'>Activer le partage</button>" + (get("kf-share") ? "<button class='danger sh-remove' onclick='KineShare.removeAll()'>Retirer mes publications</button>" : "") + "</div></div>";
    }
    var comp = $("msg-composer");
    if (comp) comp.classList.toggle("sh-off", !KineShare.allowed());
  }
  window.KineShare.render = renderCard;

  function init() {
    renderCard();
    // Rafraîchir la carte à la connexion / déconnexion
    ["onFbLogin", "onFbLogout"].forEach(function (fn) {
      if (typeof window[fn] === "function") {
        var base = window[fn];
        window[fn] = function () { var r = base.apply(this, arguments); renderCard(); return r; };
      }
    });
  }
  if (document.readyState === "complete") init(); else document.addEventListener("DOMContentLoaded", init);
})();
