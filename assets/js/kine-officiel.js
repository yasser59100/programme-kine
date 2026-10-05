/* ═══════════ KinéForce — programme officiel publié par le kiné ═══════════
   Le kiné modifie les séances et les fiches depuis son téléphone (compte Google administrateur),
   puis publie : tous les téléphones reçoivent la mise à jour à l'ouverture suivante.
   Seul le CONTENU du programme passe par Firebase (document programme/officiel) ;
   aucune donnée patient n'y est jamais envoyée. Une copie est gardée sur le téléphone (hors connexion).
   Format : { v, by, ex: { nom: { repsLabel, desc, cue, err, tip, stop, color, hidden } }, days: { day0: [noms…] } } */
var KineOfficiel = (function () {
  "use strict";
  var CKEY = "kf-official", DKEY = "kf-official-draft";
  var ORIG = typeof SEQ_DAYS !== "undefined" ? JSON.parse(JSON.stringify(SEQ_DAYS)) : {};
  var data = null, ORIG_CUE = {}, ORIG_ERR = {};
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function jset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function q(s) { return JSON.stringify(s).replace(/'/g, "&#39;"); }
  var LABEL_RE = /^\d+( à \d+)? (répétitions?|secondes|minutes?)( par (côté|jambe))?$/;

  // Un exercice d'origine (5 séances) ou de la bibliothèque, sous forme d'exercice de séance
  function findOrig(name) {
    for (var id in ORIG) { var ex = ORIG[id].exercises; for (var i = 0; i < ex.length; i++) if (ex[i].name === name) return JSON.parse(JSON.stringify(ex[i])); }
    return null;
  }
  function asExercise(name) {
    var e = findOrig(name);
    if (e) return e;
    var b = window.KineBiblio && KineBiblio.NEW.filter(function (x) { return x.name === name; })[0];
    if (!b) return null;
    return { name: b.name, phase: "work", series: 2, repsLabel: b.repsLabel, restAfter: 60, desc: b.desc, tip: b.tip, stop: b.stop };
  }
  function patch(e) {
    var o = data && data.ex && data.ex[e.name]; if (!o) return e;
    ["repsLabel", "desc", "tip", "stop", "cue", "err"].forEach(function (k) { if (o[k]) e[k] = o[k]; });
    if (o.color) e.color = o.color;
    return e;
  }

  /* ════════ Appliquer le programme publié ════════ */
  function apply(d) {
    data = d || null;
    if (typeof SEQ_DAYS === "undefined") return;
    Object.keys(ORIG).forEach(function (id) {
      var base = JSON.parse(JSON.stringify(ORIG[id])), names = data && data.days && data.days[id];
      if (names && names.length) {
        var warm = base.exercises.filter(function (e) { return e.phase === "warm"; }), cool = base.exercises.filter(function (e) { return e.phase === "cool"; });
        var work = names.map(function (n) {
          var e = asExercise(n); if (!e) return null;
          if (base.circuit) { e.repsLabel = "40 secondes"; e.restAfter = 0; }
          return e;
        }).filter(Boolean);
        base.exercises = warm.concat(work, cool);
      }
      base.exercises.forEach(patch);
      if (base.circuit) base.exercises.forEach(function (e) { if (e.phase === "work") e.repsLabel = "40 secondes"; });
      SEQ_DAYS[id] = base;
    });
    if (data && data.ex) Object.keys(data.ex).forEach(function (n) {
      var o = data.ex[n];
      if (o.cue && window.KF_CUES) { if (!(n in ORIG_CUE)) ORIG_CUE[n] = KF_CUES[n] || ""; KF_CUES[n] = o.cue; }
      if (o.err && window.KineMascotte && KineMascotte.errors) { if (!(n in ORIG_ERR)) ORIG_ERR[n] = KineMascotte.errors[n] || ""; KineMascotte.errors[n] = o.err; }
    });
    if (window.KineBiblio && KineBiblio.reset) KineBiblio.reset();
  }
  function rerender() {
    try { if (typeof renderAll === "function") renderAll(); } catch (e) {}
    try { if (window.KineProgram) KineProgram.render(); } catch (e) {}
    try { if (window.KineLayout) KineLayout.render(); } catch (e) {}
  }
  function inSession() { var s = $("seq-overlay"); return !!(s && s.classList.contains("open")); }
  function refresh() {
    if (typeof window.fbGetProgramme !== "function") return;
    window.fbGetProgramme().then(function (d) {
      var cur = jget(CKEY);
      if (!d) return;
      if (cur && cur.v === d.v) return;
      jset(CKEY, d);
      if (!inSession()) { apply(d); rerender(); }
    }).catch(function () {});
  }

  // Au chargement : la copie locale tout de suite, puis la version en ligne
  apply(jget(CKEY));
  if (typeof window.fbGetProgramme === "function") setTimeout(refresh, 1500);
  else window.addEventListener("kf-fb-ready", function () { setTimeout(refresh, 1500); });

  /* ════════ Éditeur du kiné ════════ */
  function draft() { return jget(DKEY) || JSON.parse(JSON.stringify(data || { ex: {}, days: {} })); }
  function saveDraft(d) { d.ex = d.ex || {}; d.days = d.days || {}; jset(DKEY, d); }
  function dayNames(d, id) {
    if (d.days && d.days[id] && d.days[id].length) return d.days[id].slice();
    return (SEQ_DAYS[id] || ORIG[id]).exercises.filter(function (e) { return e.phase === "work"; }).map(function (e) { return e.name; });
  }
  function current(d, name) {
    var e = asExercise(name) || { name: name };
    var b = window.KineBiblio && KineBiblio.find(name);
    var o = (d.ex && d.ex[name]) || {};
    return {
      name: name, repsLabel: o.repsLabel || e.repsLabel || "", desc: o.desc || e.desc || "", tip: o.tip || e.tip || "", stop: o.stop || e.stop || "",
      cue: o.cue || (window.KF_CUES && KF_CUES[name]) || (b && b.cue) || "", err: o.err || (window.KineMascotte && KineMascotte.errors[name]) || (b && b.err) || "",
      color: o.color || (b && b.color) || 1, hidden: !!o.hidden
    };
  }
  // Fiche d'origine, sans aucune modification publiée (sert à ne garder que les vraies différences)
  function original(name) {
    var e = asExercise(name) || {}, b = window.KineBiblio && KineBiblio.NEW.filter(function (x) { return x.name === name; })[0];
    return { repsLabel: e.repsLabel || "", desc: e.desc || "", tip: e.tip || "", stop: e.stop || "",
             cue: name in ORIG_CUE ? ORIG_CUE[name] : (window.KF_CUES && KF_CUES[name]) || (b && b.cue) || "",
             err: name in ORIG_ERR ? ORIG_ERR[name] : (window.KineMascotte && KineMascotte.errors[name]) || (b && b.err) || "",
             color: window.KineBiblio ? KineBiblio.baseColor(name) : 1 };
  }
  function sheet() {
    var el = $("ko-sheet");
    if (!el) { el = document.createElement("div"); el.id = "ko-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function frame(title, sub, body, foot) {
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineOfficiel.back()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>" + esc(title) + "</div>" + (sub ? "<div class='kf-sub'>" + sub + "</div>" : "") + "</div>" + body + "</div>" +
      (foot ? "<div class='kf-sheet-foot'>" + foot + "</div>" : "");
    el.classList.add("open"); el.scrollTop = 0;
  }
  var stack = [];
  function go(fn, args) { stack.push([fn, args]); fn.apply(null, args || []); }
  function back() { stack.pop(); var t = stack[stack.length - 1]; if (t) t[0].apply(null, t[1] || []); else close(); }
  function close() { stack = []; var el = $("ko-sheet"); if (el) el.classList.remove("open"); }
  function changed() { var d = jget(DKEY); return !!d && JSON.stringify(d) !== JSON.stringify(data || { ex: {}, days: {} }); }

  function home() {
    var u = window.fbUser;
    if (!u || !u.isAdmin) {
      frame("Programme officiel", "Modifier les séances pour tous vos patients demande votre compte Google kiné.",
        "<div class='kf-note'>Connectez-vous avec le compte administrateur de l'appli. Les patients n'ont pas accès à cet écran.</div>",
        "<button class='seq-btn-main' onclick='signInWithGoogle && signInWithGoogle()'>Se connecter avec Google</button>");
      return;
    }
    var d = draft();
    var days = Object.keys(ORIG).map(function (id) {
      var n = dayNames(d, id).length;
      return "<button class='v2-row' onclick='KineOfficiel.day(\"" + id + "\")'><b>" + esc(ORIG[id].label) + "</b><span>" + n + " exercices ›</span></button>";
    }).join("");
    frame("Programme officiel", "Vos modifications partent chez tous les patients quand vous publiez." + (data && data.v ? " Dernière publication : " + new Date(data.v).toLocaleDateString("fr-FR") + "." : ""),
      "<div class='kf-phase' style='color:var(--text2)'>Les 5 séances</div>" + days +
      "<div class='kf-phase' style='color:var(--text2)'>Fiches d'exercices</div>" +
      "<button class='v2-row' onclick='KineOfficiel.lib()'><b>Toutes les fiches de la bibliothèque</b><span>›</span></button>" +
      (changed() ? "<div class='kf-note'>Des modifications ne sont pas encore publiées.</div><button class='kc-kine' onclick='KineOfficiel.discard()'>Annuler les modifications non publiées</button>" : ""),
      "<button class='seq-btn-main' " + (changed() ? "" : "disabled ") + "onclick='KineOfficiel.publish()'>Publier pour tous les patients</button>");
  }
  function day(id) {
    var d = draft(), names = dayNames(d, id);
    var rows = names.map(function (n, i) {
      var c = current(d, n).color;
      return "<div class='ko-row'><i class='kb-dot c" + c + "'></i><button class='ko-name' onclick='KineOfficiel.edit(" + q(n) + ")'><b>" + esc(n) + "</b><small>" + esc(current(d, n).repsLabel) + "</small></button>" +
        "<button aria-label='Monter' onclick='KineOfficiel.move(\"" + id + "\"," + i + ",-1)'" + (i ? "" : " disabled") + ">↑</button>" +
        "<button aria-label='Descendre' onclick='KineOfficiel.move(\"" + id + "\"," + i + ",1)'" + (i < names.length - 1 ? "" : " disabled") + ">↓</button>" +
        "<button aria-label='Retirer' onclick='KineOfficiel.del(\"" + id + "\"," + i + ")'>✕</button></div>";
    }).join("");
    frame(ORIG[id].label, "Touchez un exercice pour modifier sa fiche. L'échauffement et les étirements restent en place.",
      rows + "<button class='v2-row kc-new' onclick='KineOfficiel.pick(\"" + id + "\")'><b>＋ Ajouter un exercice</b><span>›</span></button>",
      "<button class='seq-btn-secondary' onclick='KineOfficiel.back()'>Terminé</button>");
  }
  function setDay(id, names) { var d = draft(); d.days = d.days || {}; d.days[id] = names; saveDraft(d); }
  function move(id, i, dir) { var n = dayNames(draft(), id), t = n[i]; n[i] = n[i + dir]; n[i + dir] = t; setDay(id, n); day(id); }
  function del(id, i) { var n = dayNames(draft(), id); if (n.length <= 1) return; n.splice(i, 1); setDay(id, n); day(id); }
  function pick(id) {
    var d = draft(), have = dayNames(d, id);
    var list = window.KineBiblio ? KineBiblio.groups.map(function (g) {
      var it = KineBiblio.all().filter(function (e) { return e.group === g[0] && have.indexOf(e.name) < 0; });
      if (!it.length) return "";
      return "<div class='kf-phase' style='color:var(--text2)'>" + esc(g[1]) + "</div>" + it.map(function (e) {
        return "<button class='v2-row' onclick='KineOfficiel.add(\"" + id + "\"," + q(e.name) + ")'><b><i class='kb-dot c" + KineBiblio.color(e.name) + "'></i>" + esc(e.name) + "</b><span>＋</span></button>";
      }).join("");
    }).join("") : "";
    stack.push([pick, [id]]);
    frame("Ajouter à " + ORIG[id].label, "", list, "");
  }
  function add(id, name) { var n = dayNames(draft(), id); n.push(name); setDay(id, n); stack.pop(); day(id); }
  function lib() {
    var d = draft();
    var list = KineBiblio.groups.map(function (g) {
      var it = KineBiblio.all(true).filter(function (e) { return e.group === g[0]; });
      if (!it.length) return "";
      return "<div class='kf-phase' style='color:var(--text2)'>" + esc(g[1]) + "</div>" + it.map(function (e) {
        var cur = current(d, e.name);
        return "<button class='v2-row' onclick='KineOfficiel.edit(" + q(e.name) + ")'><b><i class='kb-dot c" + cur.color + "'></i>" + esc(e.name) + (cur.hidden ? " (masqué)" : "") + "</b><span>✎</span></button>";
      }).join("");
    }).join("");
    frame("Fiches d'exercices", KineBiblio.all(true).length + " exercices", list, "");
  }
  function edit(name) {
    var c = current(draft(), name);
    stack.push([edit, [name]]);
    var seg = [1, 2, 3].map(function (k) { return "<button type='button' class='" + (c.color === k ? "on" : "") + "' onclick='KineOfficiel.col(this," + k + ")' data-k='" + k + "'><i class='kb-dot c" + k + "'></i>" + KineBiblio.colors[k][1] + "</button>"; }).join("");
    frame(name, "Ces textes s'affichent pendant la séance et dans la fiche.",
      "<label class='ko-f'><span>Répétitions ou durée</span><input id='ko-reps' value='" + esc(c.repsLabel) + "' placeholder='12 répétitions'><small>Exemples : 12 répétitions · 8 répétitions par jambe · 30 secondes · 20 secondes par côté</small></label>" +
      "<div class='ko-f'><span>Difficulté de base</span><div class='kc-seg' id='ko-col' data-v='" + c.color + "'>" + seg + "</div></div>" +
      "<label class='ko-f'><span>Consigne</span><textarea id='ko-desc' rows='4'>" + esc(c.desc) + "</textarea></label>" +
      "<label class='ko-f'><span>Point clé (affiché en grand, lu par la voix)</span><input id='ko-cue' value='" + esc(c.cue) + "'></label>" +
      "<label class='ko-f'><span>Erreur fréquente (rappelée par la mascotte)</span><input id='ko-err' value='" + esc(c.err) + "'></label>" +
      "<label class='ko-f'><span>Conseil</span><textarea id='ko-tip' rows='2'>" + esc(c.tip) + "</textarea></label>" +
      "<label class='ko-f'><span>Critère d'arrêt</span><input id='ko-stop' value='" + esc(c.stop) + "'></label>" +
      "<label class='kc-check'><input type='checkbox' id='ko-hide'" + (c.hidden ? " checked" : "") + "> Masquer cet exercice de la bibliothèque des patients</label>" +
      "<p class='kc-err' id='ko-err-msg'></p>",
      "<button class='seq-btn-main' onclick='KineOfficiel.saveEx(" + q(name) + ")'>Enregistrer la fiche</button>");
  }
  function saveEx(name) {
    var reps = $("ko-reps").value.trim().replace(/\s+/g, " ");
    if (!LABEL_RE.test(reps)) { $("ko-err-msg").textContent = "Répétitions ou durée : écrivez par exemple « 12 répétitions » ou « 30 secondes par côté »."; return; }
    var d = draft(), o = {}, base = original(name);
    var v = { repsLabel: reps, desc: $("ko-desc").value.trim(), cue: $("ko-cue").value.trim(), err: $("ko-err").value.trim(),
              tip: $("ko-tip").value.trim(), stop: $("ko-stop").value.trim(), color: +$("ko-col").getAttribute("data-v") };
    Object.keys(v).forEach(function (k) { if (v[k] && v[k] !== base[k]) o[k] = v[k]; });
    if ($("ko-hide").checked) o.hidden = true;
    d.ex = d.ex || {};
    if (Object.keys(o).length) d.ex[name] = o; else delete d.ex[name];
    saveDraft(d); back();
  }
  function publish() {
    var d = draft(); d.v = Date.now(); d.by = window.fbUser && window.fbUser.email;
    var btn = sheet().querySelector(".seq-btn-main"); if (btn) { btn.disabled = true; btn.textContent = "Publication…"; }
    window.fbSetProgramme(d).then(function () {
      jset(CKEY, d); jset(DKEY, null); apply(d); rerender();
      frame("Programme publié", "Vos patients recevront la mise à jour à la prochaine ouverture de l'appli.", "<div class='kf-note'>Publié le " + new Date(d.v).toLocaleString("fr-FR") + ".</div>",
        "<button class='seq-btn-secondary' onclick='KineOfficiel.close()'>Fermer</button>");
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = "Publier pour tous les patients"; }
      alert("La publication a échoué. Vérifiez la connexion et les règles Firebase (document programme/officiel).");
    });
  }

  return {
    orig: ORIG, patch: patch, apply: apply, refresh: refresh, hidden: function (n) { return !!(data && data.ex && data.ex[n] && data.ex[n].hidden); },
    open: function () { stack = []; go(home); }, back: back, close: close, day: function (id) { go(day, [id]); }, move: move, del: del, pick: pick, add: add,
    lib: function () { go(lib); }, edit: edit, saveEx: saveEx, publish: publish,
    discard: function () { jset(DKEY, null); home(); },
    col: function (btn, k) { var s = btn.parentNode; s.setAttribute("data-v", k); Array.prototype.forEach.call(s.children, function (b) { b.classList.toggle("on", b === btn); }); }
  };
})();
window.KineOfficiel = KineOfficiel;
