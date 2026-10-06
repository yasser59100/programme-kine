/* ═══════════ KinéForce — « Ma séance » : le patient compose sa séance ═══════════
   Règles (validées par le kiné) :
   · 5 à 8 exercices, échauffement et retour au calme ajoutés automatiquement ;
   · 2 exercices difficiles (rouges) au plus, 3 exercices d'un même groupe au plus ;
   · un rouge se débloque quand un orange du même groupe a progressé (2 « trop facile »),
     ou après 2 semaines d'utilisation, ou par le kiné ;
   · ordre automatique : on alterne les groupes musculaires ;
   · zones protégées réglées par le kiné (code) : « pas de rouge » ou « exclu ».
   Tout reste sur le téléphone. */
var KineCompose = (function () {
  "use strict";
  var MIN = 5, MAX = 8, MAX_RED = 2, MAX_GROUP = 3, UNLOCK_DAYS = 14, MAX_MIN = 45;
  var GKEY = "kf-gear", KEY = "kf-custom", ZKEY = "kf-zones", PKEY = "kf-kine-pin", UKEY = "kf-reds-open";
  var REGION = { genou: "bas", hanche: "bas", ischio: "bas", mollet: "bas", epaule: "haut", poussee: "haut", tirage: "haut", bras: "haut",
                 dos: "tronc", gainage: "tronc", equilibre: "autre", mobilite: "autre", cardio: "autre" };
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function q(s) { return JSON.stringify(s).replace(/'/g, "&#39;"); }

  /* ════════ Règles ════════ */
  function zones() { return jget(ZKEY, {}); }
  function daysUsed() {
    var start = null; try { start = localStorage.getItem("kf-start"); } catch (e) {}
    var s = typeof sessions !== "undefined" && sessions && sessions.length ? sessions.map(function (x) { return x.date; }).filter(Boolean).sort()[0] : null;
    var first = [start, s].filter(Boolean).sort()[0];
    if (!first) return 0;
    var p = first.split("-"); return Math.floor((Date.now() - new Date(+p[0], +p[1] - 1, +p[2]).getTime()) / 86400000);
  }
  // Pourquoi un exercice n'est pas disponible (ou null s'il l'est)
  function lockReason(e) {
    var z = zones()[e.group];
    if (z === "off") return "Groupe retiré par ton kiné";
    var c = KineBiblio.color(e.name);
    if (c < 3) return null;
    if (z === "nored") return "Difficile : désactivé par ton kiné";
    if (jget(UKEY, false) || daysUsed() >= UNLOCK_DAYS) return null;
    var mastered = KineBiblio.all().some(function (o) {
      if (o.group !== e.group || KineBiblio.color(o.name) !== 2) return false;
      var r = window.KineLevel && KineLevel.get(o.name); return !!(r && (r.d > 0 || r.tempo));
    });
    return mastered ? null : "Se débloque quand un exercice orange du même groupe est devenu facile, ou après 2 semaines";
  }
  // Ce qui empêche d'ajouter cet exercice à la sélection
  function addBlock(sel, e) {
    var lock = lockReason(e); if (lock) return lock;
    if (sel.length >= MAX) return "Tu as déjà " + MAX + " exercices, c'est le maximum pour une séance.";
    if (KineBiblio.color(e.name) === 3 && sel.filter(function (n) { return KineBiblio.color(n) === 3; }).length >= MAX_RED)
      return "Tu as déjà " + MAX_RED + " exercices rouges : choisis plutôt un orange ou un vert.";
    if (sel.filter(function (n) { var o = KineBiblio.find(n); return o && o.group === e.group; }).length >= MAX_GROUP)
      return "Déjà " + MAX_GROUP + " exercices pour ce groupe : varie un peu, ton corps te dira merci.";
    return null;
  }
  // Ordre : on alterne les régions (bas, haut, tronc, autre) et jamais deux fois le même groupe à la suite si possible
  function order(names) {
    var rest = names.slice(), out = [], regions = ["bas", "haut", "tronc", "autre"], ri = 0;
    while (rest.length) {
      var lastG = out.length ? (KineBiblio.find(out[out.length - 1]) || {}).group : null, pick = -1;
      for (var t = 0; t < 4 && pick < 0; t++) {
        var reg = regions[(ri + t) % 4];
        pick = rest.findIndex(function (n) { var e = KineBiblio.find(n); return e && REGION[e.group] === reg && e.group !== lastG; });
        if (pick >= 0) ri = (ri + t + 1) % 4;
      }
      if (pick < 0) pick = 0;
      out.push(rest.splice(pick, 1)[0]);
    }
    return out;
  }
  function estimate(names) {
    define("perso", "Estimation", names);
    var s = window.KineProgram ? KineProgram.estimate("perso") : names.length * 240 + 600;
    return Math.round(s / 60);
  }

  /* ════════ La séance perso devient une séance comme les autres (sans apparaître dans les 5 séances) ════════ */
  function define(id, name, names) {
    var warm = SEQ_DAYS.day4.exercises[0], cool = SEQ_DAYS.day4.exercises[SEQ_DAYS.day4.exercises.length - 1];
    var ex = [warm].concat(names.map(function (n) {
      var e = KineBiblio.find(n) || { name: n, repsLabel: "10 répétitions" };
      return { name: e.name, phase: "work", series: 2, repsLabel: e.repsLabel, restAfter: 60, desc: e.desc, tip: e.tip, stop: e.stop };
    })).concat([cool]);
    var day = { label: "Ma séance — " + name, color: "var(--blue)", exercises: ex, custom: true };
    Object.defineProperty(SEQ_DAYS, id, { value: day, enumerable: false, configurable: true, writable: true });
    return day;
  }

  /* ════════ Écran : composer ════════ */
  var sel = [], editing = null, title = "";
  function sheet() {
    var el = $("kc-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kc-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function open(id) {
    var list = jget(KEY, []), s = id ? list.filter(function (x) { return x.id === id; })[0] : null;
    editing = s ? s.id : null; sel = s ? s.ex.slice() : []; title = s ? s.name : "";
    render();
    sheet().classList.add("open"); sheet().scrollTop = 0;
  }
  function render() {
    if (window.KineBiblio) KineBiblio.wire();
    var z = zones(), reds = sel.filter(function (n) { return KineBiblio.color(n) === 3; }).length;
    var mins = sel.length ? estimate(order(sel)) : 0, ok = sel.length >= MIN && sel.length <= MAX && mins <= MAX_MIN;
    var chosen = order(sel).map(function (n, i) {
      var c = KineBiblio.color(n);
      return "<div class='kc-sel'><span class='kc-n'>" + (i + 1) + "</span><i class='kb-dot c" + c + "'></i><b>" + esc(n) + "</b>" +
        "<button type='button' aria-label='Retirer' onclick='KineCompose.toggle(" + q(n) + ")'>✕</button></div>";
    }).join("");
    var groups = KineBiblio.groups.map(function (g) {
      if (z[g[0]] === "off") return "";
      var gear = jget(GKEY, {});
      var items = KineBiblio.all().filter(function (e) { return e.group === g[0] && (!e.gear || gear[e.gear]); }).sort(function (a, b) { return KineBiblio.color(a.name) - KineBiblio.color(b.name); });
      if (!items.length) return "";
      return "<div class='kf-phase' style='color:var(--text2)'>" + esc(g[1]) + (z[g[0]] === "nored" ? " <small class='kc-z'>pas de rouge</small>" : "") + "</div>" +
        items.map(function (e) {
          var c = KineBiblio.color(e.name), on = sel.indexOf(e.name) >= 0, lock = lockReason(e);
          return "<div class='kc-row" + (on ? " on" : "") + (lock ? " locked" : "") + "'>" +
            "<button type='button' class='kc-pick' onclick='KineCompose.toggle(" + q(e.name) + ")'" + (lock && !on ? " aria-disabled='true'" : "") + ">" +
              "<i class='kb-dot c" + c + "'></i><span><b>" + esc(e.name) + "</b><small>" + (lock ? "🔒 " + esc(lock) : esc(KineBiblio.colors[c][1]) + ", " + esc(e.repsLabel)) + "</small></span>" +
              "<em aria-hidden='true'>" + (on ? "✓" : lock ? "" : "+") + "</em></button>" +
            "<button type='button' class='kc-eye' aria-label='Voir la démonstration' onclick='KineBiblio.demo(" + q(e.name) + ")'>▶</button></div>";
        }).join("");
    }).join("");
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineCompose.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + (editing ? "Modifier ma séance" : "Créer ma séance") + "</div>" +
      "<div class='kf-sub'>Choisis 5 à 8 exercices. L'échauffement et les étirements sont ajoutés automatiquement.</div></div>" +
      "<div class='kc-rules'><span" + (sel.length >= MIN && sel.length <= MAX ? " class='ok'" : "") + ">" + sel.length + " / 5 à 8 exercices</span>" +
        "<span" + (reds <= MAX_RED ? " class='ok'" : "") + "><i class='kb-dot c3'></i>" + reds + " / 2 difficiles</span>" +
        "<span" + (mins && mins <= MAX_MIN ? " class='ok'" : "") + ">~" + mins + " min</span></div>" +
      "<div class='kc-gear'><b>Mon matériel</b>" + [["elastique", "Un élastique"], ["charge", "Haltères ou charges"]].map(function (g) {
        var on = !!jget(GKEY, {})[g[0]];
        return "<button type='button' class='kb-chip" + (on ? " on" : "") + "' aria-pressed='" + on + "' onclick='KineCompose.gear(\"" + g[0] + "\")'>" + (on ? "✓ " : "") + g[1] + "</button>"; }).join("") + "</div>" +
      (chosen ? "<div class='kc-tray'>" + chosen + "<div class='kf-sub'>L'ordre alterne les groupes musculaires pour que chacun récupère.</div></div>" : "") +
      groups + "</div>" +
      "<div class='kf-sheet-foot kc-foot'><input id='kc-name' class='kc-name' maxlength='30' placeholder='Nom de la séance' value='" + esc(title) + "' oninput='KineCompose.name(this.value)'>" +
        "<button class='seq-btn-main' " + (ok ? "" : "disabled ") + "onclick='KineCompose.save(true)'>Enregistrer et lancer</button>" +
        "<button class='seq-btn-secondary' " + (ok ? "" : "disabled ") + "onclick='KineCompose.save(false)'>Enregistrer</button></div>";
  }
  // La mascotte explique la règle, en bas de l'écran de composition
  var msgT = null;
  function say(text) {
    var el = sheet(), m = $("kc-msg");
    if (!m) { m = document.createElement("div"); m.id = "kc-msg"; m.className = "kc-msg"; m.setAttribute("role", "status"); el.appendChild(m); }
    m.innerHTML = window.KineMascotte && KineMascotte.coachHtml ? KineMascotte.coachHtml(text) : "<p>" + esc(text) + "</p>";
    m.classList.add("on"); clearTimeout(msgT); msgT = setTimeout(function () { m.classList.remove("on"); }, 5000);
    if (typeof speak === "function" && (typeof seqSoundOn === "undefined" || seqSoundOn)) { try { speak(text, { prio: 1, now: true }); } catch (e) {} }
  }
  function toggle(name) {
    var i = sel.indexOf(name), sc = sheet().querySelector(".kf-sheet-body"), y = sheet().scrollTop;
    if (i >= 0) sel.splice(i, 1);
    else { var e = KineBiblio.find(name), why = e && addBlock(sel, e); if (why) { say(why); return; } sel.push(name); }
    render(); sheet().scrollTop = y;
  }
  function save(launch) {
    if (sel.length < MIN) { say("Encore " + (MIN - sel.length) + " exercice" + (MIN - sel.length > 1 ? "s" : "") + " et ta séance est prête !"); return; }
    var list = jget(KEY, []), id = editing || "c" + Date.now().toString(36);
    var rec = { id: id, name: (title || "").trim() || "Ma séance " + (list.length + (editing ? 0 : 1)), ex: order(sel), at: Date.now() };
    list = list.filter(function (x) { return x.id !== id; }); list.unshift(rec); jset(KEY, list.slice(0, 12));
    close();
    if (window.KineProgram) KineProgram.render(); if (window.KineLayout) KineLayout.render(); page();
    if (launch) start(id);
  }
  function start(id) {
    var s = jget(KEY, []).filter(function (x) { return x.id === id; })[0]; if (!s) return;
    define("perso", s.name, s.ex);
    if (typeof openPreview === "function") openPreview("perso"); else if (typeof launchSeq === "function") launchSeq("perso");
  }
  function remove(id) {
    if (!confirm("Supprimer cette séance ?")) return;
    jset(KEY, jget(KEY, []).filter(function (x) { return x.id !== id; }));
    if (window.KineProgram) KineProgram.render(); if (window.KineLayout) KineLayout.render(); page();
  }
  function close() { var el = $("kc-sheet"); if (el) el.classList.remove("open"); }

  // Bloc « Mes séances » pour l'onglet Programme
  function listHtml() {
    var list = jget(KEY, []);
    var rows = list.map(function (s) {
      var reds = s.ex.filter(function (n) { return KineBiblio.color(n) === 3; }).length;
      return "<div class='kc-mine'><button class='pg-day' onclick='KineCompose.start(" + q(s.id) + ")'><span class='pg-j'>★</span>" +
        "<span class='pg-day-t'><b>" + esc(s.name) + "</b><span>" + s.ex.length + " exercices" + (reds ? ", " + reds + " difficile" + (reds > 1 ? "s" : "") : "") + "</span></span></button>" +
        "<button class='kc-mini' aria-label='Modifier' onclick='KineCompose.open(" + q(s.id) + ")'>✎</button>" +
        "<button class='kc-mini' aria-label='Supprimer' onclick='KineCompose.remove(" + q(s.id) + ")'>🗑</button></div>";
    }).join("");
    return "<div class='kf-phase' style='color:var(--text2)'>Mes séances</div>" + rows +
      "<button class='v2-row kc-new' onclick='KineCompose.open()'><b>＋ Créer ma séance</b><span>›</span></button>";
  }

  /* ════════ Espace kiné : code, zones protégées, déblocage des rouges ════════ */
  var kineOpen = 0;
  function hash(pin) { var h = 5381; for (var i = 0; i < pin.length; i++) h = ((h << 5) + h + pin.charCodeAt(i)) >>> 0; return "h" + h.toString(36); }
  function kine() {
    var el = sheet(), hasPin = !!localStorage.getItem(PKEY);
    if (Date.now() - kineOpen < 10 * 60000) return kinePanel();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineCompose.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Espace kiné</div><div class='kf-sub'>" + (hasPin ? "Entrez votre code à 4 chiffres." : "Première fois : choisissez un code à 4 chiffres. Ne le donnez pas au patient.") + "</div></div>" +
      "<input id='kc-pin' class='kc-pin' type='password' inputmode='numeric' maxlength='4' autocomplete='off' placeholder='••••'>" +
      "<p class='kc-err' id='kc-pin-err'></p></div>" +
      "<div class='kf-sheet-foot'><button class='seq-btn-main' onclick='KineCompose.pin()'>" + (hasPin ? "Déverrouiller" : "Créer le code") + "</button></div>";
    el.classList.add("open"); setTimeout(function () { var i = $("kc-pin"); if (i) i.focus(); }, 100);
  }
  function pin() {
    var v = ($("kc-pin") || {}).value || "", saved = localStorage.getItem(PKEY);
    if (!/^\d{4}$/.test(v)) { $("kc-pin-err").textContent = "4 chiffres, s'il vous plaît."; return; }
    if (!saved) localStorage.setItem(PKEY, hash(v));
    else if (saved !== hash(v)) { $("kc-pin-err").textContent = "Code incorrect."; return; }
    kineOpen = Date.now(); kinePanel();
  }
  function kinePanel() {
    var z = zones(), open = jget(UKEY, false);
    var rows = KineBiblio.groups.map(function (g) {
      var v = z[g[0]] || "ok";
      return "<div class='kc-zone'><b>" + esc(g[1]) + "</b><div class='kc-seg'>" +
        [["ok", "Normal"], ["nored", "Pas de rouge"], ["off", "Exclu"]].map(function (o) {
          return "<button type='button' class='" + (v === o[0] ? "on" : "") + "' onclick='KineCompose.zone(\"" + g[0] + "\",\"" + o[0] + "\")'>" + o[1] + "</button>"; }).join("") + "</div></div>";
    }).join("");
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineCompose.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Espace kiné</div><div class='kf-sub'>Réglages de ce téléphone, pour « Ma séance ». Se verrouille seul après 10 minutes.</div></div>" +
      "<div class='su-card'><b>Zones protégées</b><div class='kf-sub'>« Pas de rouge » retire les exercices difficiles du groupe, « Exclu » retire tout le groupe.</div>" + rows + "</div>" +
      "<label class='kc-check'><input type='checkbox' " + (open ? "checked " : "") + "onchange='KineCompose.reds(this.checked)'> Débloquer dès maintenant les exercices difficiles (hors zones protégées)</label>" +
      "<button class='v2-row' onclick='KineCompose.close();KineOfficiel.open()'><b>Programme officiel (tous les patients)</b><span>›</span></button>" +
      "<button class='v2-row' onclick='KineCompose.resetPin()'><b>Changer le code</b><span>›</span></button></div>" +
      "<div class='kf-sheet-foot'><button class='seq-btn-secondary' onclick='KineCompose.lock()'>Verrouiller</button></div>";
    el.classList.add("open");
  }
  function zone(g, v) { var z = zones(); if (v === "ok") delete z[g]; else z[g] = v; jset(ZKEY, z); kinePanel(); }

  /* ════════ Onglet « Ma séance » ════════ */
  var thumbs = {};
  function thumb(name) {
    if (thumbs[name]) return thumbs[name];
    try { var u = window.KineAvatar && KineAvatar.supports(name) ? KineAvatar.snapshot(name, 120) : null; if (u) thumbs[name] = u; return u; } catch (e) { return null; }
  }
  function page() {
    var root = $("mes-root"); if (!root || !window.KineBiblio) return;
    KineBiblio.wire();
    var all = KineBiblio.all(), gear = jget(GKEY, {}), list = jget(KEY, []);
    var count = function (c) { return all.filter(function (e) { return KineBiblio.color(e.name) === c; }).length; };
    var face = window.KineMascotte && KineMascotte.portrait ? KineMascotte.portrait() : null;
    var mine = list.length ? list.map(function (s) {
      var reds = s.ex.filter(function (n) { return KineBiblio.color(n) === 3; }).length;
      var dots = s.ex.map(function (n) { return "<i class='kb-dot c" + KineBiblio.color(n) + "'></i>"; }).join("");
      return "<div class='mx-mine'><button class='mx-sess' onclick='KineCompose.start(" + q(s.id) + ")'><b>" + esc(s.name) + "</b><span>" + dots + "</span><small>" + s.ex.length + " exercices" + (reds ? ", " + reds + " difficile" + (reds > 1 ? "s" : "") : "") + "</small><em>Lancer ›</em></button>" +
        "<div class='mx-tools'><button aria-label='Modifier' onclick='KineCompose.open(" + q(s.id) + ")'>✎</button><button aria-label='Supprimer' onclick='KineCompose.remove(" + q(s.id) + ")'>✕</button></div></div>";
    }).join("") : "<p class='mx-empty'>Aucune séance pour l'instant. Crée la première, ça prend une minute.</p>";
    var groups = KineBiblio.groups.map(function (g) {
      var it = all.filter(function (e) { return e.group === g[0] && (!e.gear || gear[e.gear]); }); if (!it.length) return "";
      var t = thumb(it[0].name);
      return "<button class='mx-grp' onclick='KineBiblio.open(\"" + g[0] + "\")'>" + (t ? "<img src='" + t + "' alt=''>" : "<span class='pg-fig'></span>") +
        "<b>" + esc(g[1]) + "</b><small>" + it.length + " exercice" + (it.length > 1 ? "s" : "") + "</small></button>";
    }).join("");
    root.innerHTML =
      "<div class='mx-hero' id='mx-create'>" + (face ? "<img class='mx-face' src='" + face + "' alt=''>" : "") +
        "<div><h1>Compose ta séance</h1><p>" + all.length + " exercices animés. Tu choisis, je m'occupe de l'échauffement, des étirements et de l'ordre.</p></div>" +
        "<button class='mx-cta' onclick='KineCompose.open()'>＋ Créer une séance</button></div>" +
      "<div class='mx-colors' id='mx-colors'><span><i class='kb-dot c1'></i>Facile <b>" + count(1) + "</b></span><span><i class='kb-dot c2'></i>Intermédiaire <b>" + count(2) + "</b></span><span><i class='kb-dot c3'></i>Difficile <b>" + count(3) + "</b></span></div>" +
      "<h2 class='lx-section' id='mx-mine'>Mes séances</h2>" + mine +
      "<h2 class='lx-section'>Explorer les exercices</h2>" +
      "<div class='kc-gear' id='mx-gear'><b>Mon matériel</b>" + [["elastique", "Un élastique"], ["charge", "Haltères ou charges"]].map(function (g) {
        var on = !!gear[g[0]]; return "<button type='button' class='kb-chip" + (on ? " on" : "") + "' aria-pressed='" + on + "' onclick='KineCompose.gearPage(\"" + g[0] + "\")'>" + (on ? "✓ " : "") + g[1] + "</button>"; }).join("") + "</div>" +
      "<div class='mx-grid' id='mx-lib'>" + groups + "</div>" +
      "<button class='mx-all' onclick='KineBiblio.open(\"\")'>Voir les " + all.length + " exercices ›</button>" +
      "<button class='kc-kine' onclick='KineCompose.kine()'>Espace kiné</button>";
  }
  var GUIDE = [
    { sel: "#mx-create", text: "Ici, tu crées ta propre séance : tu choisis 5 à 8 exercices, je m'occupe de l'échauffement, des étirements et de l'ordre.", gesture: "wave" },
    { sel: "#mx-colors", text: "Les couleurs, c'est la difficulté : vert facile, orange intermédiaire, rouge difficile. Deux rouges au maximum, et ils se débloquent quand tu progresses.", gesture: "point" },
    { sel: "#mx-lib", text: "Touche un groupe pour voir ses exercices, et un exercice pour me voir le faire. Tu as un élastique ou des haltères ? Coche-les juste au-dessus.", gesture: "open" },
    { sel: "#mx-mine", text: "Tes séances s'affichent ici : un appui et c'est parti. Si une règle bloque un exercice, je t'explique pourquoi.", gesture: "cheer" }
  ];
  function tab() {
    page();
    var seen = null; try { seen = localStorage.getItem("kf-mes-guide"); } catch (e) {}
    if (!seen && window.KineMascotte && KineMascotte.guide) setTimeout(function () { window.scrollTo(0, 0); KineMascotte.guide(GUIDE, "kf-mes-guide"); }, 450);
  }
  // L'onglet prend la tête du coach dès que son portrait est prêt
  var faceTry = setInterval(function () {
    var f = window.KineMascotte && KineMascotte.portrait ? KineMascotte.portrait() : null, el = $("bn-mes-face");
    if (f && el) { el.innerHTML = "<img src='" + f + "' alt=''>"; clearInterval(faceTry); }
  }, 1500);
  document.addEventListener("DOMContentLoaded", function () { setTimeout(page, 800); });

  return {
    page: page, tab: tab,
    gearPage: function (k) { var g = jget(GKEY, {}); g[k] = !g[k]; jset(GKEY, g); page(); },
    open: open, close: close, toggle: toggle, save: save, start: start, remove: remove, listHtml: listHtml, order: order, lockReason: lockReason, addBlock: addBlock,
    name: function (v) { title = v; }, saved: function () { return jget(KEY, []); },
    gear: function (k) { var g = jget(GKEY, {}); g[k] = !g[k]; jset(GKEY, g); var y = sheet().scrollTop; render(); sheet().scrollTop = y; }, kine: kine, pin: pin, zone: zone,
    reds: function (v) { jset(UKEY, !!v); },
    lock: function () { kineOpen = 0; close(); },
    resetPin: function () { try { localStorage.removeItem(PKEY); } catch (e) {} kineOpen = 0; kine(); },
    rules: { MIN: MIN, MAX: MAX, MAX_RED: MAX_RED, MAX_GROUP: MAX_GROUP }
  };
})();
window.KineCompose = KineCompose;
