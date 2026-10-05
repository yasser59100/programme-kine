/* KinéForce — « Le saviez-vous ? »
   Une notion d'hygiène de vie par jour, tirée d'une étude publiée, avec sa source.
   Carte sur l'accueil (sous « Voir les exercices ») et fiche détaillée avec navigation. */
(function () {
  "use strict";
  function pm(q) { return "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(q); }

  // Les études d'observation montrent une association, pas une preuve de cause à effet :
  // le texte le dit quand c'est le cas.
  var TIPS = [
    { theme: "Activité", title: "7 000 pas par jour apportent déjà l'essentiel des bénéfices.",
      stat: "−47 %", statLabel: "de risque de décès à 7 000 pas par jour, comparé à 2 000",
      body: "En regroupant 57 études, des chercheurs ont montré que le bénéfice est presque le même à 7 000 pas qu'à 10 000. Le risque de démence est aussi plus faible (−38 %). Il s'agit d'études d'observation : elles montrent un lien fort, sans prouver à elles seules la cause.",
      action: "Passer de 2 000 à 4 000 pas par jour apporte déjà un gain. Ajoutez une marche de 10 minutes après un repas.",
      source: "Ding et al., The Lancet Public Health, 2025", url: pm("Ding daily steps health outcomes dose-response meta-analysis Lancet Public Health 2025") },
    { theme: "Mal de dos", title: "Marcher régulièrement espace les rechutes de mal de dos.",
      stat: "208 j", statLabel: "sans rechute en moyenne avec la marche, contre 112 jours sans",
      body: "Dans l'essai WalkBack, 701 adultes qui sortaient d'un épisode de lombalgie ont suivi un programme de marche progressive avec quelques séances d'accompagnement. Leurs rechutes sont arrivées presque deux fois plus tard que dans le groupe sans programme.",
      action: "Une marche quotidienne, en augmentant peu à peu la durée, est l'une des meilleures protections pour votre dos.",
      source: "Pocovi et al., The Lancet, 2024 (essai WalkBack)", url: pm("Pocovi WalkBack walking recurrence low back pain Lancet 2024") },
    { theme: "Mal de dos", title: "Face à une lombalgie, rester actif vaut mieux que rester au lit.",
      stat: "10 essais", statLabel: "comparant le repos au lit et le conseil de rester actif",
      body: "Une revue Cochrane montre que les personnes à qui l'on conseille de rester actives ont un peu moins mal et reprennent plus facilement leurs activités que celles à qui l'on conseille le repos au lit.",
      action: "Bougez dans la limite du supportable : marche, activités du quotidien, en adaptant le rythme.",
      source: "Dahm et al., Cochrane, 2010", url: "https://doi.org/10.1002/14651858.CD007612.pub2" },
    { theme: "Mal de dos", title: "L'exercice diminue la douleur du mal de dos chronique.",
      stat: "249 essais", statLabel: "et plus de 24 000 participants analysés",
      body: "La plus grande revue sur le sujet montre que l'exercice réduit la douleur d'environ 15 points sur 100 par rapport à l'absence de traitement. Aucun type d'exercice ne se détache nettement : le meilleur est celui que l'on pratique vraiment.",
      action: "La régularité compte plus que le type d'exercice : votre programme en est un bon exemple.",
      source: "Hayden et al., Cochrane, 2021", url: "https://doi.org/10.1002/14651858.CD009790.pub2" },
    { theme: "Activité", title: "Trois petits efforts intenses d'une minute par jour comptent.",
      stat: "−38 %", statLabel: "de mortalité chez des personnes qui ne faisaient pas de sport",
      body: "Chez plus de 25 000 personnes équipées d'un capteur, trois courts moments d'effort soutenu par jour (monter les escaliers d'un bon pas, marcher vite pour un bus) étaient associés à une mortalité nettement plus faible. Environ 4 minutes par jour au total.",
      action: "Prenez l'escalier d'un bon pas, portez vos courses vous-même, marchez vite sur une courte distance.",
      source: "Stamatakis et al., Nature Medicine, 2022", url: pm("Stamatakis vigorous intermittent lifestyle physical activity mortality Nature Medicine 2022") },
    { theme: "Renforcement", title: "30 à 60 minutes de renforcement par semaine suffisent.",
      stat: "10 à 20 %", statLabel: "de risque en moins de décès, de maladies cardiovasculaires et de cancer",
      body: "Une méta-analyse de 16 études montre que le bénéfice est maximal autour de 30 à 60 minutes de renforcement musculaire par semaine, et encore plus grand quand il est associé à une activité d'endurance comme la marche.",
      action: "Deux séances de votre programme par semaine vous placent déjà dans cette zone.",
      source: "Momma et al., British Journal of Sports Medicine, 2022", url: "https://bjsm.bmj.com/content/56/13/755" },
    { theme: "Activité", title: "Faire son activité en un ou deux jours, c'est aussi efficace.",
      stat: "350 000", statLabel: "personnes suivies pendant 10 ans",
      body: "Concentrer son activité physique sur le week-end apporte des bénéfices comparables à une activité répartie sur la semaine, à volume égal. L'important est d'atteindre son total.",
      action: "Semaine chargée ? Ce n'est pas grave : rattrapez vos séances quand vous pouvez.",
      source: "dos Santos et al., JAMA Internal Medicine, 2022", url: "https://pubmed.ncbi.nlm.nih.gov/35788615/" },
    { theme: "Sédentarité", title: "5 minutes de marche toutes les 30 minutes assis protègent votre santé.",
      stat: "−58 %", statLabel: "de pics de sucre dans le sang après les repas",
      body: "Des adultes restés assis 8 heures ont testé plusieurs rythmes de pauses. Marcher 5 minutes toutes les 30 minutes était le seul rythme qui abaissait à la fois la glycémie et la tension artérielle (4 à 5 points).",
      action: "Réglez un rappel toutes les 30 minutes au travail ou devant un écran, et levez-vous quelques minutes.",
      source: "Duran, Diaz et al., Medicine & Science in Sports & Exercise, 2023", url: pm("Duran Diaz breaking up prolonged sitting cardiometabolic dose-response 2023") },
    { theme: "Sommeil", title: "Une nuit trop courte rend plus sensible à la douleur.",
      stat: "+126 %", statLabel: "d'activité dans la zone du cerveau qui perçoit la douleur",
      body: "Après une nuit blanche, les participants ressentaient la douleur pour une chaleur plus faible. Le manque de sommeil amplifie les zones qui perçoivent la douleur et freine celles qui la soulagent naturellement.",
      action: "Si vous avez mal, soigner votre sommeil fait partie du traitement : horaires réguliers, écrans coupés avant le coucher.",
      source: "Krause et al., Journal of Neuroscience, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6433768/" },
    { theme: "Articulations", title: "Courir pour le plaisir n'use pas les genoux.",
      stat: "3,5 %", statLabel: "d'arthrose chez les coureurs loisirs, contre 10,2 % chez les sédentaires",
      body: "En regroupant les données de plus de 100 000 personnes, l'arthrose de hanche et de genou était moins fréquente chez les coureurs loisirs que chez les sédentaires. Seule la compétition de haut niveau était associée à plus d'arthrose (13,3 %).",
      action: "Le mouvement nourrit le cartilage. Reprenez progressivement, en écoutant vos sensations.",
      source: "Alentorn-Geli et al., JOSPT, 2017", url: pm("Alentorn-Geli association of recreational and competitive running with hip and knee osteoarthritis 2017") },
    { theme: "Tabac", title: "Fumer retarde la consolidation des fractures.",
      stat: "×2,2", statLabel: "de risque de consolidation retardée ou absente chez les fumeurs",
      body: "Sur 40 études, les fumeurs mettent en moyenne près d'un mois de plus à consolider une fracture. La nicotine resserre les vaisseaux et le monoxyde de carbone réduit l'oxygène apporté à l'os.",
      action: "Réduire ou arrêter le tabac aide votre récupération. Votre médecin ou Tabac Info Service (39 89) peuvent vous accompagner.",
      source: "Pearson et al., BMJ Open, 2016", url: "https://bmjopen.bmj.com/content/6/11/e010303" },
    { theme: "Moral", title: "L'exercice aide aussi à soigner la déprime.",
      stat: "218 essais", statLabel: "et plus de 14 000 personnes analysés",
      body: "Marche ou jogging, yoga et renforcement musculaire étaient les plus efficaces pour réduire les symptômes de dépression, et l'effet augmentait avec l'intensité. Le renforcement et le yoga étaient les mieux acceptés.",
      action: "Votre programme agit aussi sur le moral. Si vous vous sentez déprimé, parlez-en à votre médecin : l'exercice complète un suivi, il ne le remplace pas.",
      source: "Noetel et al., BMJ, 2024", url: pm("Noetel effect of exercise for depression network meta-analysis BMJ 2024") },
    { theme: "Équilibre", title: "Les exercices d'équilibre réduisent les chutes.",
      stat: "−23 %", statLabel: "de chutes chez les personnes âgées qui font des exercices",
      body: "En analysant 108 essais, les programmes centrés sur l'équilibre et les gestes du quotidien (se lever, se tourner, tenir sur un pied) sont ceux qui réduisent le plus les chutes. Le tai-chi semble aussi efficace.",
      action: "L'équilibre unipodal de votre programme est un excellent exercice : faites-le près d'un appui.",
      source: "Sherrington et al., Cochrane, 2019", url: "https://doi.org/10.1002/14651858.CD012424.pub2" }
  ];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function todayIdx() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000) % TIPS.length; }

  var ICON = "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z'/></svg>";

  function card() {
    var t = TIPS[todayIdx()];
    var b = document.createElement("button");
    b.type = "button"; b.className = "ks-card"; b.id = "ks-card";
    b.setAttribute("aria-label", "Le saviez-vous ? " + t.title);
    b.onclick = function () { open(todayIdx()); };
    b.innerHTML = "<span class='ks-tag'>" + ICON + "Le saviez-vous ?</span>" +
      "<span class='ks-title'>" + esc(t.title) + "</span>" +
      "<span class='ks-src'>" + esc(t.source.replace(/^.*?,\s*/, "")) + "<span aria-hidden='true'>›</span></span>";
    return b;
  }
  function place() {
    var box = $("today-card"); if (!box || !box.firstChild) return;
    if ($("ks-card")) return;
    var anchor = box.querySelector(".lx-link") || box.querySelector(".lx-cta");
    var c = card();
    if (anchor && anchor.nextSibling) box.insertBefore(c, anchor.nextSibling); else box.appendChild(c);
  }

  var cur = 0;
  function open(i) {
    cur = (i + TIPS.length) % TIPS.length;
    var t = TIPS[cur], sh = $("ks-sheet");
    if (!sh) { sh = document.createElement("div"); sh.id = "ks-sheet"; sh.className = "kf-sheet ks-sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Le saviez-vous ?"); document.body.appendChild(sh); }
    sh.innerHTML = "<div class='kf-sheet-body ks-body'>" +
      "<button class='kf-back' onclick='KineSavoir.close()' aria-label='Fermer'>←</button>" +
      "<div class='ks-tag'>" + ICON + "Le saviez-vous ? · " + esc(t.theme) + "</div>" +
      "<h2 class='ks-h'>" + esc(t.title) + "</h2>" +
      "<div class='ks-stat'><b>" + esc(t.stat) + "</b><span>" + esc(t.statLabel) + "</span></div>" +
      "<p class='ks-p'>" + esc(t.body) + "</p>" +
      "<div class='ks-do'><strong>Pour vous</strong><span>" + esc(t.action) + "</span></div>" +
      "<div class='ks-ref'><span>Source</span><strong>" + esc(t.source) + "</strong>" +
      "<a href='" + esc(t.url) + "' target='_blank' rel='noopener'>Voir l'étude</a></div>" +
      "<p class='ks-note'>Ces informations générales ne remplacent pas l'avis de votre kinésithérapeute ou de votre médecin.</p>" +
      "</div><div class='kf-sheet-foot ks-foot'>" +
      "<button class='seq-btn-secondary' onclick='KineSavoir.open(" + (cur - 1) + ")' aria-label='Précédent'>‹</button>" +
      "<span class='ks-count'>" + (cur + 1) + " sur " + TIPS.length + "</span>" +
      "<button class='seq-btn-secondary' onclick='KineSavoir.open(" + (cur + 1) + ")' aria-label='Suivant'>›</button></div>";
    sh.classList.add("open");
    var body = sh.querySelector(".ks-body"); if (body) body.scrollTop = 0;
  }
  function close() { var sh = $("ks-sheet"); if (sh) sh.classList.remove("open"); }

  window.KineSavoir = { tips: TIPS, open: open, close: close, place: place };

  function init() {
    var box = $("today-card"); if (!box) return;
    place();
    new MutationObserver(function () { if (!$("ks-card")) place(); }).observe(box, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
