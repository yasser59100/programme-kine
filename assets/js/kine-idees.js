/* ═══════════ KinéForce — idées du quotidien ═══════════
   1. Mon objectif (échelle PSFS) : le patient choisit 1 à 3 gestes du quotidien et les note de 0 à 10,
      toutes les 2 semaines. Visible dans Suivi et dans le résumé envoyé au kiné.
   2. Vrai ou faux de la semaine : une idée reçue sur la douleur, expliquée par Yass.
   3. À quoi ça sert dans la vie : une ligne par exercice, reliée à un geste du quotidien.
   4. Séance express : 10 minutes, échauffement et les 3 premiers exercices du jour, 2 tours. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var MO = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  function dfr(s) { var d = parse(s); return d.getDate() + " " + MO[d.getMonth()]; }
  function daysSince(s) { return Math.floor((parse(iso()) - parse(s)) / 86400000); }
  function yassOn() { return !(window.KineMascotte && KineMascotte.isOff && KineMascotte.isOff()); }
  function say(t) { if (yassOn() && typeof speak === "function" && (typeof seqSoundOn === "undefined" || seqSoundOn)) { try { speak(t, { prio: 1, now: true }); } catch (e) {} } }

  /* ════════ 3. À quoi ça sert dans la vie ════════ */
  var USAGE = {
    "Squat bilatéral": "Se lever d'une chaise ou des toilettes sans les mains.",
    "Fentes avant unilatérales": "Monter les escaliers et se relever d'un genou posé au sol.",
    "Chaise contre le mur": "Rester debout longtemps et descendre une pente sans fatiguer.",
    "Pont ischio-jambiers talons sur chaise": "Marcher d'un bon pas et protéger l'arrière du genou.",
    "Élévation des talons": "Marcher plus longtemps et attraper un objet en hauteur.",
    "Step-up sur marche": "Monter les escaliers ou un trottoir sans la rampe.",
    "Rotation externe d'épaule": "Lever le bras pour se coiffer ou attraper en hauteur.",
    "Pompes sur genoux": "Se relever du sol et pousser une porte lourde.",
    "Dips sur chaise": "Se lever d'un fauteuil en poussant sur les accoudoirs.",
    "Pike push-up": "Ranger un objet sur une étagère haute.",
    "Superman en Y et en W": "Se tenir droit, assis comme debout.",
    "Crunch abdominal contrôlé": "Se redresser dans le lit plus facilement.",
    "Portefeuille (V-up)": "Sortir du lit ou de la voiture d'un seul mouvement.",
    "Dead bug": "Garder le dos stable en portant un enfant ou des courses.",
    "Superman quadrupédique en gainage": "Se pencher et se relever sans tirer sur le dos.",
    "Ciseaux et vélo": "Monter dans une voiture et enjamber un obstacle.",
    "Plank — gainage avant-bras": "Porter et pousser sans se faire mal au dos.",
    "Side plank sur genoux": "Porter un sac d'un seul côté sans pencher.",
    "Squat sumo": "Ramasser un objet au sol, se baisser vers un enfant.",
    "Donkey kick": "Monter les marches et marcher en côte.",
    "Pont de hanche": "Se retourner dans le lit et monter les escaliers.",
    "Clamshell": "Garder le genou bien aligné quand on marche.",
    "Abduction hanche debout": "Tenir sur une jambe pour enfiler un pantalon.",
    "Pont fessier unilatéral": "Monter les marches deux à deux, trottiner.",
    "Squat + élévation bras": "Ranger les courses, du sol jusqu'au placard du haut.",
    "Inchworm et pompes": "Se mettre au sol et se relever facilement.",
    "Fente latérale avec toucher sol": "Ramasser un objet sur le côté, jardiner.",
    "Burpee modifié sans saut": "Savoir se relever du sol, par exemple après une chute.",
    "Équilibre unipodal": "Moins de risques de chute, enfiler ses chaussettes debout.",
    "Assis-debout de chaise": "Se lever d'une chaise, du canapé ou des toilettes.",
    "Extension de genou assis": "Monter les escaliers et se lever sans s'appuyer.",
    "Fente arrière": "Descendre les escaliers et ramasser un objet en douceur.",
    "Squat bulgare": "Monter une grande marche, reprendre le sport.",
    "Fire hydrant": "Enjamber le bord de la baignoire ou de la voiture.",
    "Abduction couché sur le côté": "Marcher sans se déhancher.",
    "Hip thrust épaules sur canapé": "Se relever, pousser, marcher d'un bon pas.",
    "Good morning debout": "Se pencher au-dessus de l'évier sans mal de dos.",
    "Soulevé de terre roumain unipodal": "Ramasser un objet léger en restant en équilibre.",
    "Leg curl serviette au sol": "Courir et accélérer sans se blesser derrière la cuisse.",
    "Nordic curl assisté": "Protéger l'arrière de la cuisse pendant le sport.",
    "Marche sur les talons": "Ne plus accrocher le pied sur un tapis ou un trottoir.",
    "Élévation des talons genoux fléchis": "Monter les côtes et les escaliers à pied.",
    "Élévation des talons unipodale": "Marcher longtemps et tenir sur la pointe d'un pied.",
    "Excentrique mollet sur marche": "Soulager le tendon d'Achille, marcher et courir.",
    "Extension lombaire couché sur le ventre": "Rester debout ou assis longtemps sans mal de dos.",
    "Superman bras-jambe opposés": "Garder le dos stable en marchant et en portant.",
    "Pont en marche": "Marcher d'un bon pas et monter les escaliers.",
    "Bear plank": "Jouer au sol avec les enfants et se relever.",
    "Planche latérale complète": "Porter une valise d'une seule main.",
    "Mountain climber lent": "Monter les escaliers sans être essoufflé.",
    "Rotation externe couché sur le côté": "Se coiffer, attraper sa ceinture de sécurité.",
    "Élévation latérale": "Étendre le linge, ranger en hauteur.",
    "Wall slides": "Lever les bras au-dessus de la tête sans pincement.",
    "Élévation en Y": "Lever les bras en hauteur, garder les épaules en arrière.",
    "Pompes contre le mur": "Pousser une porte, se relever en s'appuyant.",
    "Pompes inclinées": "Se relever du sol en poussant sur les bras.",
    "Pompes complètes": "Pousser fort et se relever du sol facilement.",
    "T au sol": "Se tenir droit devant l'écran.",
    "Rowing un bras appui chaise": "Tirer une porte, porter un seau.",
    "Rowing deux bras penché": "Soulever un carton en gardant le dos droit.",
    "Tirage inversé sous une table": "Tirer, grimper, se hisser.",
    "Curl biceps": "Porter les courses ou un enfant dans les bras.",
    "Extension triceps au-dessus de la tête": "Ranger en hauteur, pousser pour se lever.",
    "Curl marteau tempo lent": "Porter un sac, une casserole, ouvrir un bocal.",
    "Tandem talon-pointe": "Marcher sur un chemin étroit sans perdre l'équilibre.",
    "Unipodal yeux fermés": "Garder l'équilibre dans le noir, la nuit.",
    "Unipodal sur coussin": "Marcher sur l'herbe, le sable ou un sol inégal.",
    "Toucher en étoile unipodal": "Se rattraper quand on trébuche.",
    "Chat-vache": "Dérouiller le dos le matin.",
    "Rotation thoracique à quatre pattes": "Se retourner pour regarder derrière soi en voiture.",
    "Fente psoas dynamique": "Marcher à grands pas en restant bien droit.",
    "Essuie-glace genoux pliés": "Se tourner dans le lit, assouplir le bas du dos.",
    "Montées de genoux": "Monter les escaliers et enjamber un obstacle.",
    "Jumping jack sans saut": "Le cœur et le souffle, sans choc pour les articulations.",
    "Skater latéral sans saut": "Faire un pas de côté rapide pour se rattraper.",
    "Rotation externe à l'élastique": "Lever le bras pour se coiffer sans douleur d'épaule.",
    "Rotation interne à l'élastique": "Mettre la main dans le dos, attacher un vêtement.",
    "Pull-apart à l'élastique": "Garder les épaules ouvertes et se tenir droit.",
    "Tirage horizontal à l'élastique": "Tirer une porte, un tiroir, une valise.",
    "Face pull à l'élastique": "Épaules en arrière, nuque moins tendue au bureau.",
    "Pallof press": "Porter une charge sans se tordre, tenir un chien en laisse.",
    "Squat élastique aux genoux": "Se lever d'une chaise sans que les genoux rentrent.",
    "Extension terminale du genou": "Tendre complètement le genou pour bien marcher.",
    "Marche latérale élastique": "Marcher sans se déhancher, plus stable.",
    "Goblet squat": "Se baisser en portant un objet devant soi.",
    "Soulevé de terre roumain avec charge": "Soulever un carton du sol sans se faire mal au dos.",
    "Développé épaules assis": "Ranger une valise en hauteur.",
    "Fente avec charge": "Monter les escaliers avec les courses.",
    "Hip thrust lesté": "Plus de force pour se relever, pousser et monter."
  };
  function usage(name) { return USAGE[name] || null; }
  var USE_ICON = "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 12l2-2 7-7 7 7 2 2'/><path d='M5 10v10h14V10'/></svg>";
  function usageHtml(name) { var u = usage(name); return u ? "<span class='ki-use'>" + USE_ICON + "<span>" + esc(u) + "</span></span>" : ""; }

  // Ajoute la ligne dans l'aperçu de séance, la bibliothèque, la démonstration et le tuto « Première fois »
  function decorate(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(".kf-ex .kf-ex-name, .kb-ex .pg-day-t > b").forEach(function (b) {
      var host = b.parentNode; if (host.querySelector(".ki-use")) return;
      var u = usageHtml(b.textContent.trim()); if (u) host.insertAdjacentHTML("beforeend", u);
    });
    root.querySelectorAll("#kf-demo .kf-h1, .kf-tuto-h").forEach(function (h) {
      var host = h.parentNode; if (host.querySelector(".ki-use")) return;
      var u = usageHtml(h.textContent.trim()); if (!u) return;
      var after = h.nextElementSibling && h.nextElementSibling.classList.contains("kf-sub") ? h.nextElementSibling : h;
      after.insertAdjacentHTML("afterend", u.replace("ki-use", "ki-use big"));
    });
  }
  var watched = {};
  var mo = new MutationObserver(function (muts) { muts.forEach(function (m) { decorate(m.target); }); });
  function watchSheets() {
    ["seq-preview", "kb-sheet", "kf-demo", "rep-guide"].forEach(function (id) {
      var el = $(id); if (!el || watched[id] === el) return;
      watched[id] = el; mo.observe(el, { childList: true }); decorate(el);
    });
  }

  /* ════════ 1. Mon objectif (PSFS) ════════ */
  var GKEY = "kf-goals", EVERY = 14;
  var SUGG = ["Monter les escaliers sans la rampe", "Porter mes courses", "Me relever du sol", "Marcher 30 minutes",
              "Jouer avec mes enfants ou petits-enfants", "Reprendre le sport", "Jardiner", "Dormir sans être réveillé par la douleur"];
  function goals() { return jget(GKEY, []).filter(function (g) { return g && g.text; }); }
  function saveGoals(g) { jset(GKEY, g); }
  function lastScore(g) { return g.scores && g.scores.length ? g.scores[g.scores.length - 1] : null; }
  function due() {
    var g = goals(); if (!g.length) return false;
    return g.some(function (x) { var l = lastScore(x); return !l || daysSince(l.date) >= EVERY; });
  }
  function nextIn() {
    var g = goals(), m = 99;
    g.forEach(function (x) { var l = lastScore(x); if (l) m = Math.min(m, EVERY - daysSince(l.date)); });
    return Math.max(0, m);
  }
  function scoreTxt(v) { return v + "/10"; }

  function goalCard() {
    var g = goals();
    var head = "<h2 class='lx-section'>Mon objectif</h2>";
    if (!g.length) return head +
      "<div class='ki-goal ki-empty'><p>Qu'aimeriez-vous <strong>refaire au quotidien</strong> grâce au programme ? Choisissez un geste, notez-le de 0 à 10, et voyez-le progresser.</p>" +
      "<button class='lx-cta' onclick='KineIdees.goalEdit()'>Choisir mon objectif</button></div>";
    var rows = g.map(function (x) {
      var s = x.scores || [], f = s[0], l = lastScore(x), d = f && l && s.length > 1 ? l.v - f.v : null;
      var trend = d == null ? "" : d > 0 ? "<em class='up'>+" + d + "</em>" : d < 0 ? "<em class='down'>" + d + "</em>" : "<em>=</em>";
      return "<div class='ki-grow'><div class='ki-gt'><b>" + esc(x.text) + "</b>" +
        "<small>" + (s.length > 1 ? "Au début " + scoreTxt(f.v) + ", aujourd'hui " + scoreTxt(l.v) : l ? "Noté " + scoreTxt(l.v) + " le " + dfr(l.date) : "") + "</small></div>" +
        "<div class='ki-gv'><b>" + (l ? l.v : "–") + "</b><span>/10</span>" + trend + "</div>" +
        "<div class='ki-bar'><i style='width:" + (l ? l.v * 10 : 0) + "%'></i>" + (f && s.length > 1 ? "<s style='left:" + f.v * 10 + "%'></s>" : "") + "</div></div>";
    }).join("");
    var foot = due()
      ? "<button class='lx-cta' onclick='KineIdees.goalRate()'>Noter mon objectif aujourd'hui</button>"
      : "<p class='lx-muted ki-next'>Prochaine note dans " + nextIn() + " jour" + (nextIn() > 1 ? "s" : "") + ". 0 = impossible, 10 = comme avant.</p>";
    return head + "<div class='ki-goal'>" + rows + foot +
      "<button class='lx-link' onclick='KineIdees.goalEdit()'>" + (g.length < 3 ? "Ajouter ou modifier un objectif" : "Modifier mes objectifs") + "</button></div>";
  }

  function sheet() {
    var el = $("ki-sheet");
    if (!el) { el = document.createElement("div"); el.id = "ki-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Mon objectif"); document.body.appendChild(el); }
    return el;
  }
  function closeSheet() { var el = $("ki-sheet"); if (el) el.classList.remove("open"); refresh(); }
  function scale(id, cur) {
    var b = "";
    for (var i = 0; i <= 10; i++) b += "<button type='button' class='ki-n" + (cur === i ? " on" : "") + "' data-v='" + i + "' aria-pressed='" + (cur === i) + "' onclick='KineIdees._pick(\"" + id + "\"," + i + ")'>" + i + "</button>";
    return "<div class='ki-scale' id='ki-s-" + id + "'>" + b + "</div><div class='ki-ends'><span>Impossible</span><span>Comme avant</span></div>";
  }
  var draft = {};
  function pick(id, v) {
    draft[id] = v;
    var box = $("ki-s-" + id); if (!box) return;
    box.querySelectorAll(".ki-n").forEach(function (b) { var on = +b.getAttribute("data-v") === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    var ok = $("ki-ok"); if (ok) ok.disabled = !ready();
  }
  var mode = "rate";
  function ready() {
    if (mode === "new") return !!(($("ki-text") && $("ki-text").value.trim()) && draft.n != null);
    return goals().every(function (g) { return draft[g.id] != null; });
  }

  // Choisir / modifier
  function goalEdit() {
    mode = "new"; draft = {};
    var g = goals(), el = sheet();
    var list = g.map(function (x) {
      return "<div class='ki-erow'><span>" + esc(x.text) + "</span><button class='ki-del' onclick='KineIdees._del(\"" + x.id + "\")' aria-label='Supprimer cet objectif'>Retirer</button></div>";
    }).join("");
    var canAdd = g.length < 3;
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineIdees._close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Mon objectif</div><div class='kf-sub'>Un geste du quotidien que la douleur ou la fatigue vous empêche de faire comme avant.</div>" +
      (list ? "<div class='kf-phase' style='color:var(--text2)'>Mes objectifs</div>" + list : "") +
      (canAdd ? "<div class='kf-phase' style='color:var(--text2)'>" + (g.length ? "Ajouter un objectif" : "Choisir") + "</div>" +
        "<div class='kf-chips ki-chips'>" + SUGG.map(function (s) { return "<button type='button' onclick='KineIdees._sugg(this)'>" + esc(s) + "</button>"; }).join("") + "</div>" +
        "<label class='su-label'>Ou écrivez le vôtre<input class='kf-text su-input' id='ki-text' maxlength='70' placeholder='Par exemple : porter mon petit-fils' oninput='KineIdees._chk()'></label>" +
        "<div class='su-label'>Aujourd'hui, j'y arrive à…</div>" + scale("n", null)
        : "<p class='lx-muted'>Trois objectifs au maximum : retirez-en un pour en ajouter un autre.</p>") +
      "</div>" +
      (canAdd ? "<div class='kf-sheet-foot'><button class='seq-btn-main' id='ki-ok' disabled onclick='KineIdees._saveNew()'>Enregistrer</button></div>" : "");
    el.classList.add("open"); el.scrollTop = 0;
  }
  function sugg(btn) {
    var t = $("ki-text"); if (!t) return;
    t.value = btn.textContent;
    document.querySelectorAll(".ki-chips button").forEach(function (b) { b.classList.toggle("sel", b === btn); });
    chk();
  }
  function chk() { var ok = $("ki-ok"); if (ok) ok.disabled = !ready(); }
  function saveNew() {
    var t = ($("ki-text") && $("ki-text").value.trim()) || ""; if (!t || draft.n == null) return;
    var g = goals(); if (g.length >= 3) return;
    g.push({ id: "g" + Date.now().toString(36), text: t.charAt(0).toUpperCase() + t.slice(1), created: iso(), scores: [{ date: iso(), v: draft.n }] });
    saveGoals(g); closeSheet();
  }
  function del(id) { saveGoals(goals().filter(function (g) { return g.id !== id; })); goalEdit(); }

  // Noter toutes les 2 semaines
  function goalRate() {
    mode = "rate"; draft = {};
    var g = goals(), el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineIdees._close()' aria-label='Retour'>←</button>" +
      "<div class='kf-h1'>Où en êtes-vous ?</div><div class='kf-sub'>Pour chaque objectif, à quel point y arrivez-vous aujourd'hui ? 0 = impossible, 10 = comme avant.</div>" +
      g.map(function (x) {
        var l = lastScore(x);
        return "<div class='ki-rate'><b>" + esc(x.text) + "</b>" + (l ? "<small>Dernière note : " + l.v + "/10 le " + dfr(l.date) + "</small>" : "") + scale(x.id, null) + "</div>";
      }).join("") +
      "</div><div class='kf-sheet-foot'><button class='seq-btn-main' id='ki-ok' disabled onclick='KineIdees._saveRate()'>Enregistrer</button></div>";
    el.classList.add("open"); el.scrollTop = 0;
  }
  function saveRate() {
    var today = iso(), g = goals();
    g.forEach(function (x) {
      if (draft[x.id] == null) return;
      x.scores = (x.scores || []).filter(function (s) { return s.date !== today; });
      x.scores.push({ date: today, v: draft[x.id] });
    });
    saveGoals(g);
    var best = g.map(function (x) { var s = x.scores; return s.length > 1 ? s[s.length - 1].v - s[0].v : 0; }).reduce(function (a, b) { return Math.max(a, b); }, 0);
    closeSheet();
    if (best >= 2) say("Bravo ! Deux points de plus, c'est un vrai progrès que vous ressentez au quotidien.");
  }

  function summaryLines() {
    var g = goals(); if (!g.length) return [];
    var L = ["", "Objectifs du patient (PSFS, 0 = impossible, 10 = comme avant) :"];
    g.forEach(function (x) {
      var s = x.scores || [], f = s[0], l = s[s.length - 1];
      if (!f) { L.push("· " + x.text + " : pas encore noté"); return; }
      L.push("· " + x.text + " : " + f.v + "/10 le " + dfr(f.date) + (s.length > 1 ? " → " + l.v + "/10 le " + dfr(l.date) + " (" + (l.v - f.v >= 0 ? "+" : "") + (l.v - f.v) + ")" : ""));
    });
    return L;
  }

  /* ════════ 2. Vrai ou faux de la semaine ════════ */
  var VF = [
    { q: "Avoir mal pendant un exercice veut dire qu'on s'abîme.", a: false,
      e: "La douleur est une alarme, souvent plus sensible que nécessaire. Une gêne jusqu'à 5 sur 10, qui se calme dans les 24 heures, est acceptable pendant la rééducation.", s: "Smith et al., BJSM, 2017" },
    { q: "Avec un mal de dos, le mieux est de rester au lit.", a: false,
      e: "Rester alité ralentit la récupération. Rester actif, même doucement, aide le dos à guérir plus vite.", s: "Dahm et al., Cochrane, 2010" },
    { q: "Avoir des courbatures le lendemain d'une séance, c'est normal.", a: true,
      e: "Elles arrivent un à deux jours après un effort inhabituel et disparaissent en quelques jours. Elles diminuent à mesure que le corps s'habitue.", s: "" },
    { q: "Il existe une posture parfaite à garder toute la journée.", a: false,
      e: "Aucune posture n'est dangereuse en soi : c'est de rester figé trop longtemps qui fatigue. La meilleure posture, c'est la suivante, alors bougez souvent.", s: "Slater et al., BJSM, 2019" },
    { q: "Soulever une charge le dos rond est forcément dangereux.", a: false,
      e: "Le dos est solide et fait pour se plier. Les études ne montrent pas que le dos rond cause plus de douleur ; l'important, c'est d'y aller progressivement.", s: "Saraceni et al., JOSPT, 2020" },
    { q: "Une IRM qui montre une hernie explique forcément la douleur.", a: false,
      e: "Beaucoup de personnes sans aucune douleur ont des hernies ou de l'usure à l'IRM. Ce sont souvent des signes normaux de l'âge, comme les cheveux gris.", s: "Brinjikji et al., AJNR, 2015" },
    { q: "Après 70 ans, il est trop tard pour se muscler.", a: false,
      e: "On gagne de la force à tout âge, même après 90 ans. Le renforcement améliore la marche et réduit le risque de chute.", s: "Fiatarone et al., JAMA, 1990" },
    { q: "Si je rate une séance, je dois tout recommencer.", a: false,
      e: "Une séance manquée ne fait pas perdre vos progrès. Reprenez simplement à la suivante : c'est la régularité sur plusieurs semaines qui compte.", s: "" },
    { q: "Mal dormir peut augmenter la douleur.", a: true,
      e: "Une mauvaise nuit rend le système nerveux plus sensible à la douleur. Prendre soin de son sommeil fait partie du traitement.", s: "Finan et al., J Pain, 2013" },
    { q: "Marcher régulièrement aide à éviter que le mal de dos revienne.", a: true,
      e: "Une grande étude de 2024 montre qu'un programme de marche progressif réduit nettement les rechutes. Environ 30 minutes, 5 fois par semaine, à votre rythme.", s: "Pocovi et al., The Lancet, 2024" },
    { q: "Le stress peut rendre la douleur plus forte.", a: true,
      e: "Le cerveau règle le volume de la douleur, et le stress le monte. Respirer, bouger et se détendre aident à le baisser.", s: "" },
    { q: "Avec de l'arthrose, il vaut mieux éviter de bouger.", a: false,
      e: "Le mouvement nourrit le cartilage et les muscles protègent l'articulation. L'exercice est le premier traitement recommandé de l'arthrose.", s: "OARSI, 2019" }
  ];
  function weekNo() { var d = new Date(), m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return Math.floor((Date.UTC(m.getFullYear(), m.getMonth(), m.getDate())) / 604800000); }
  function vfIdx() { return weekNo() % VF.length; }
  function spoken(i) { var v = VF[i]; return (v.a ? "C'est vrai. " : "C'est faux. ") + v.e; }
  var VF_ICON = "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='9'/><path d='M9.2 9.2a3 3 0 0 1 5.6 1.3c0 2-2.8 2.4-2.8 4'/><path d='M12 17.5h.01'/></svg>";
  function vfCard() {
    var i = vfIdx(), v = VF[i], ans = jget("kf-vf", {}), mine = ans[weekNo()];
    var c = document.createElement("div");
    c.className = "ki-vf"; c.id = "ki-vf";
    var face = window.KineMascotte && KineMascotte.portrait && yassOn() ? KineMascotte.portrait() : null;
    var html = "<span class='ks-tag'>" + VF_ICON + "Vrai ou faux de la semaine</span><p class='ki-q'>« " + esc(v.q) + " »</p>";
    if (mine == null) {
      html += "<div class='ki-vf-b'><button type='button' onclick='KineIdees._vf(true)'>Vrai</button><button type='button' onclick='KineIdees._vf(false)'>Faux</button></div>";
    } else {
      var good = mine === v.a;
      html += "<div class='ki-vf-r'>" + (face ? "<img src='" + face + "' alt=''>" : "") +
        "<div><b class='" + (good ? "ok" : "ko") + "'>" + (good ? "Bien vu ! " : "Pas tout à fait. ") + (v.a ? "C'est vrai." : "C'est faux.") + "</b>" +
        "<p>" + esc(v.e) + "</p>" + (v.s ? "<small>" + esc(v.s) + "</small>" : "") +
        "<button type='button' class='ki-replay' onclick='KineIdees._vfSay()'>Écouter Yass</button></div></div>";
    }
    c.innerHTML = html;
    return c;
  }
  function vfAnswer(a) {
    var ans = jget("kf-vf", {}); ans[weekNo()] = a; jset("kf-vf", ans);
    var old = $("ki-vf"); if (old) old.replaceWith(vfCard());
    say(spoken(vfIdx()));
  }

  /* ════════ 4. Séance express ════════ */
  // Durée estimée d'un exercice (mêmes calculs que l'accueil), pour viser environ 10 minutes
  function estOne(ex, circuit) {
    if (!window.KineProgram || !KineProgram.estimate) return ex.phase === "work" ? 120 : 180;
    var s = window.KineProgress ? KineProgress.plan().series : 2;
    Object.defineProperty(SEQ_DAYS, "__ki", { value: { exercises: [ex], circuit: circuit }, enumerable: false, configurable: true });
    var t = KineProgram.estimate("__ki"); delete SEQ_DAYS.__ki;
    t -= (s - 1) * 120;
    return ex.phase === "work" ? Math.max(30, t / s) : t;          // durée d'un tour (repos compris) ou de l'échauffement
  }
  // Viser environ 10 minutes : 2 tours de 2 ou 3 exercices, ou 1 seul tour si les exercices du jour sont longs
  var TOUR_REST = 90, TARGET = 630;
  function build(warm, pool, circuit, tours) {
    var tot = (warm ? estOne(warm) : 0) + (tours - 1) * TOUR_REST, work = [];
    for (var i = 0; i < pool.length && work.length < 4; i++) {
      var d = estOne(pool[i], circuit) * tours;
      if (work.length >= 2 && tot + d > TARGET) break;
      var c = {}; for (var k in pool[i]) c[k] = pool[i][k]; c.restAfter = Math.min(pool[i].restAfter || 60, 45);
      work.push(c); tot += d;
    }
    return { work: work, tot: tot, tours: tours };
  }
  function defineExpress(src) {
    var base = typeof SEQ_DAYS !== "undefined" && SEQ_DAYS[src]; if (!base) return null;
    var warm = base.exercises.filter(function (e) { return e.phase === "warm"; })[0];
    var pool = base.exercises.filter(function (e) { return e.phase === "work"; });
    var b = build(warm, pool, base.circuit, 2);
    if (b.tot > TARGET + 60) { var one = build(warm, pool, base.circuit, 1); if (one.work.length >= 3) b = one; }
    var name = base.label.split(" — ").slice(1).join(" — ") || base.label;
    var day = { label: "Express — " + name, color: base.color, exercises: (warm ? [warm] : []).concat(b.work), tours: b.tours, tourRest: TOUR_REST, express: src, circuit: base.circuit, minutes: Math.round(b.tot / 60) };
    Object.defineProperty(SEQ_DAYS, "express", { value: day, enumerable: false, configurable: true, writable: true });
    return day;
  }
  function express(src) {
    if (!defineExpress(src)) return;
    if (typeof launchSeq === "function") launchSeq("express");
  }
  function expressLink(src) {
    var day = defineExpress(src), n = day ? day.exercises.filter(function (e) { return e.phase === "work"; }).length : 3;
    var b = document.createElement("button");
    b.type = "button"; b.className = "ki-express"; b.id = "ki-express";
    b.innerHTML = "<span class='ki-x-ic' aria-hidden='true'><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M13 2 4 14h7l-1 8 9-12h-7z'/></svg></span>" +
      "<span class='ki-x-t'><b>Pas le temps ? Séance express</b><small>Environ " + (day ? day.minutes : 10) + " minutes : l'échauffement et " + n + " exercices, en " + (day ? day.tours : 2) + " tour" + (day && day.tours > 1 ? "s" : "") + "</small></span><span aria-hidden='true'>›</span>";
    b.onclick = function () { express(src); };
    return b;
  }

  /* ════════ Accueil ════════ */
  function placeHome() {
    var box = $("today-card"); if (!box || !box.firstChild) return;
    var cta = box.querySelector(".lx-cta"), m = cta && /openPreview\('([^']+)'\)/.exec(cta.getAttribute("onclick") || "");
    if (m && !$("ki-express") && SEQ_DAYS[m[1]]) {
      var link = box.querySelector(".lx-link");
      var x = expressLink(m[1]);
      if (link && link.nextSibling) box.insertBefore(x, link.nextSibling); else box.appendChild(x);
    }
    if (!$("ki-vf")) {
      var after = $("ks-card") || box.querySelector(".kr-remind") || $("ki-express");
      var c = vfCard();
      if (after && after.nextSibling) box.insertBefore(c, after.nextSibling); else box.appendChild(c);
    }
  }

  function refresh() {
    if (window.KineLayout && KineLayout.render) { try { KineLayout.render(); } catch (e) {} }
  }

  window.KineIdees = {
    usage: usage, goals: goals, goalCard: goalCard, goalEdit: goalEdit, goalRate: goalRate, summaryLines: summaryLines, due: due,
    vf: VF, vfIdx: vfIdx, spoken: spoken, express: express, defineExpress: defineExpress, decorate: decorate, USAGE: USAGE,
    _pick: pick, _sugg: sugg, _chk: chk, _saveNew: saveNew, _del: del, _saveRate: saveRate, _close: closeSheet,
    _vf: vfAnswer, _vfSay: function () { say(spoken(vfIdx())); }
  };

  function init() {
    var box = $("today-card");
    if (box) { placeHome(); new MutationObserver(function () { if (!$("ki-vf") || !$("ki-express")) placeHome(); }).observe(box, { childList: true }); }
    watchSheets();
    new MutationObserver(watchSheets).observe(document.body, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
