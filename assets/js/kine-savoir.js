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
      action: "Passer de 2 000 à 4 000 pas par jour apporte déjà un gain. Ajoute une marche de 10 minutes après un repas.",
      source: "Ding et al., The Lancet Public Health, 2025", url: pm("Ding daily steps health outcomes dose-response meta-analysis Lancet Public Health 2025") },
    { theme: "Mal de dos", title: "Marcher régulièrement espace les rechutes de mal de dos.",
      stat: "208 j", statLabel: "sans rechute en moyenne avec la marche, contre 112 jours sans",
      body: "Dans l'essai WalkBack, 701 adultes qui sortaient d'un épisode de lombalgie ont suivi un programme de marche progressive avec quelques séances d'accompagnement. Leurs rechutes sont arrivées presque deux fois plus tard que dans le groupe sans programme.",
      action: "Une marche quotidienne, en augmentant peu à peu la durée, est l'une des meilleures protections pour ton dos.",
      source: "Pocovi et al., The Lancet, 2024 (essai WalkBack)", url: pm("Pocovi WalkBack walking recurrence low back pain Lancet 2024") },
    { theme: "Mal de dos", title: "Face à une lombalgie, rester actif vaut mieux que rester au lit.",
      stat: "10 essais", statLabel: "comparant le repos au lit et le conseil de rester actif",
      body: "Une revue Cochrane montre que les personnes à qui l'on conseille de rester actives ont un peu moins mal et reprennent plus facilement leurs activités que celles à qui l'on conseille le repos au lit.",
      action: "Bouge dans la limite du supportable : marche, activités du quotidien, en adaptant le rythme.",
      source: "Dahm et al., Cochrane, 2010", url: "https://doi.org/10.1002/14651858.CD007612.pub2" },
    { theme: "Mal de dos", title: "L'exercice diminue la douleur du mal de dos chronique.",
      stat: "249 essais", statLabel: "et plus de 24 000 participants analysés",
      body: "La plus grande revue sur le sujet montre que l'exercice réduit la douleur d'environ 15 points sur 100 par rapport à l'absence de traitement. Aucun type d'exercice ne se détache nettement : le meilleur est celui que l'on pratique vraiment.",
      action: "La régularité compte plus que le type d'exercice : ton programme en est un bon exemple.",
      source: "Hayden et al., Cochrane, 2021", url: "https://doi.org/10.1002/14651858.CD009790.pub2" },
    { theme: "Activité", title: "Trois petits efforts intenses d'une minute par jour comptent.",
      stat: "−38 %", statLabel: "de mortalité chez des personnes qui ne faisaient pas de sport",
      body: "Chez plus de 25 000 personnes équipées d'un capteur, trois courts moments d'effort soutenu par jour (monter les escaliers d'un bon pas, marcher vite pour un bus) étaient associés à une mortalité nettement plus faible. Environ 4 minutes par jour au total.",
      action: "Prends l'escalier d'un bon pas, porte tes courses toi-même, marche vite sur une courte distance.",
      source: "Stamatakis et al., Nature Medicine, 2022", url: pm("Stamatakis vigorous intermittent lifestyle physical activity mortality Nature Medicine 2022") },
    { theme: "Renforcement", title: "30 à 60 minutes de renforcement par semaine suffisent.",
      stat: "10 à 20 %", statLabel: "de risque en moins de décès, de maladies cardiovasculaires et de cancer",
      body: "Une méta-analyse de 16 études montre que le bénéfice est maximal autour de 30 à 60 minutes de renforcement musculaire par semaine, et encore plus grand quand il est associé à une activité d'endurance comme la marche.",
      action: "Deux séances de ton programme par semaine te placent déjà dans cette zone.",
      source: "Momma et al., British Journal of Sports Medicine, 2022", url: "https://bjsm.bmj.com/content/56/13/755" },
    { theme: "Activité", title: "Faire son activité en un ou deux jours, c'est aussi efficace.",
      stat: "350 000", statLabel: "personnes suivies pendant 10 ans",
      body: "Concentrer son activité physique sur le week-end apporte des bénéfices comparables à une activité répartie sur la semaine, à volume égal. L'important est d'atteindre son total.",
      action: "Semaine chargée ? Ce n'est pas grave : rattrape tes séances quand tu peux.",
      source: "dos Santos et al., JAMA Internal Medicine, 2022", url: "https://pubmed.ncbi.nlm.nih.gov/35788615/" },
    { theme: "Sédentarité", title: "5 minutes de marche toutes les 30 minutes assis protègent ta santé.",
      stat: "−58 %", statLabel: "de pics de sucre dans le sang après les repas",
      body: "Des adultes restés assis 8 heures ont testé plusieurs rythmes de pauses. Marcher 5 minutes toutes les 30 minutes était le seul rythme qui abaissait à la fois la glycémie et la tension artérielle (4 à 5 points).",
      action: "Règle un rappel toutes les 30 minutes au travail ou devant un écran, et lève-toi quelques minutes.",
      source: "Duran, Diaz et al., Medicine & Science in Sports & Exercise, 2023", url: pm("Duran Diaz breaking up prolonged sitting cardiometabolic dose-response 2023") },
    { theme: "Sommeil", title: "Une nuit trop courte rend plus sensible à la douleur.",
      stat: "+126 %", statLabel: "d'activité dans la zone du cerveau qui perçoit la douleur",
      body: "Après une nuit blanche, les participants ressentaient la douleur pour une chaleur plus faible. Le manque de sommeil amplifie les zones qui perçoivent la douleur et freine celles qui la soulagent naturellement.",
      action: "Si tu as mal, soigner ton sommeil fait partie du traitement : horaires réguliers, écrans coupés avant le coucher.",
      source: "Krause et al., Journal of Neuroscience, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6433768/" },
    { theme: "Articulations", title: "Courir pour le plaisir n'use pas les genoux.",
      stat: "3,5 %", statLabel: "d'arthrose chez les coureurs loisirs, contre 10,2 % chez les sédentaires",
      body: "En regroupant les données de plus de 100 000 personnes, l'arthrose de hanche et de genou était moins fréquente chez les coureurs loisirs que chez les sédentaires. Seule la compétition de haut niveau était associée à plus d'arthrose (13,3 %).",
      action: "Le mouvement nourrit le cartilage. Reprends progressivement, en écoutant tes sensations.",
      source: "Alentorn-Geli et al., JOSPT, 2017", url: pm("Alentorn-Geli association of recreational and competitive running with hip and knee osteoarthritis 2017") },
    { theme: "Tabac", title: "Fumer retarde la consolidation des fractures.",
      stat: "×2,2", statLabel: "de risque de consolidation retardée ou absente chez les fumeurs",
      body: "Sur 40 études, les fumeurs mettent en moyenne près d'un mois de plus à consolider une fracture. La nicotine resserre les vaisseaux et le monoxyde de carbone réduit l'oxygène apporté à l'os.",
      action: "Réduire ou arrêter le tabac aide ta récupération. Ton médecin ou Tabac Info Service (39 89) peuvent t'accompagner.",
      source: "Pearson et al., BMJ Open, 2016", url: "https://bmjopen.bmj.com/content/6/11/e010303" },
    { theme: "Moral", title: "L'exercice aide aussi à soigner la déprime.",
      stat: "218 essais", statLabel: "et plus de 14 000 personnes analysés",
      body: "Marche ou jogging, yoga et renforcement musculaire étaient les plus efficaces pour réduire les symptômes de dépression, et l'effet augmentait avec l'intensité. Le renforcement et le yoga étaient les mieux acceptés.",
      action: "Ton programme agit aussi sur le moral. Si tu te sens déprimé, parles-en à ton médecin : l'exercice complète un suivi, il ne le remplace pas.",
      source: "Noetel et al., BMJ, 2024", url: pm("Noetel effect of exercise for depression network meta-analysis BMJ 2024") },
    { theme: "Équilibre", title: "Les exercices d'équilibre réduisent les chutes.",
      stat: "−23 %", statLabel: "de chutes chez les personnes âgées qui font des exercices",
      body: "En analysant 108 essais, les programmes centrés sur l'équilibre et les gestes du quotidien (se lever, se tourner, tenir sur un pied) sont ceux qui réduisent le plus les chutes. Le tai-chi semble aussi efficace.",
      action: "L'équilibre unipodal de ton programme est un excellent exercice : fais-le près d'un appui.",
      source: "Sherrington et al., Cochrane, 2019", url: "https://doi.org/10.1002/14651858.CD012424.pub2" },
    { theme: "Renforcement", title: "On peut gagner de la force à 90 ans.",
      stat: "+174 %", statLabel: "de force des cuisses en 8 semaines, chez des personnes de 86 à 96 ans",
      body: "Dix résidents d'une maison de retraite ont fait du renforcement des cuisses trois fois par semaine. En deux mois, leur force a presque triplé et leur vitesse de marche s'est améliorée.",
      action: "Il n'est jamais trop tard : ton programme s'adapte à ton niveau, quel que soit ton âge.",
      source: "Fiatarone et al., JAMA, 1990", url: pm("Fiatarone high-intensity strength training in nonagenarians 1990") },
    { theme: "Force", title: "La force de la main en dit long sur la santé.",
      stat: "+16 %", statLabel: "de risque de décès pour chaque 5 kg de force de préhension en moins",
      body: "Chez près de 140 000 adultes de 17 pays, une poigne plus faible était associée à plus de décès, notamment cardiovasculaires. C'est une association : la force reflète l'état général du corps.",
      action: "Les exercices avec charge, comme le curl marteau ou le rowing, entretiennent aussi la force de la main.",
      source: "Leong et al., The Lancet, 2015", url: pm("Leong prognostic value of grip strength PURE Lancet 2015") },
    { theme: "Mobilité", title: "Savoir s'asseoir et se relever du sol, c'est précieux.",
      stat: "×5 à ×6", statLabel: "de risque de décès pour ceux qui y arrivent le plus difficilement",
      body: "Chez 2 000 adultes de 51 à 80 ans, ceux qui avaient le plus de mal à s'asseoir au sol et à se relever sans appui avaient un risque de décès bien plus élevé sur six ans. Là encore, c'est une association.",
      action: "Les exercices de ton programme qui passent par le sol, comme l'inchworm ou le burpee modifié, entraînent ce geste.",
      source: "Brito et al., Eur J Prev Cardiol, 2012", url: pm("Brito sitting-rising test mortality 2012") },
    { theme: "Marche", title: "La vitesse de marche reflète la santé.",
      stat: "−12 %", statLabel: "de risque de décès pour chaque 0,1 m/s de vitesse de marche en plus",
      body: "En réunissant neuf études et près de 35 000 personnes âgées, les chercheurs ont montré que marcher plus vite était associé à une espérance de vie plus longue.",
      action: "Renforcer les jambes et l'équilibre aide à marcher d'un pas plus sûr et plus rapide.",
      source: "Studenski et al., JAMA, 2011", url: pm("Studenski gait speed survival older adults JAMA 2011") },
    { theme: "Arthrose", title: "L'exercice soulage l'arthrose du genou.",
      stat: "54 essais", statLabel: "analysés, avec une baisse nette de la douleur",
      body: "Les exercices réduisent la douleur et améliorent la fonction dans l'arthrose du genou, avec un effet comparable à celui de certains médicaments antidouleur.",
      action: "Le renforcement des cuisses et des fessiers de ton programme fait partie de ce traitement.",
      source: "Fransen et al., Cochrane, 2015", url: pm("Fransen exercise for osteoarthritis of the knee Cochrane 2015") },
    { theme: "Imagerie", title: "Beaucoup d'IRM montrent de l'usure sans aucune douleur.",
      stat: "37 %", statLabel: "des personnes de 20 ans sans douleur ont un disque « usé » à l'imagerie",
      body: "Chez plus de 3 000 personnes sans mal de dos, l'usure des disques passe de 37 % à 20 ans à 96 % à 80 ans. Ces images sont souvent des signes normaux de l'âge.",
      action: "Une image ne dit pas tout : c'est ta fonction et ton ressenti qui guident la rééducation.",
      source: "Brinjikji et al., AJNR, 2015", url: pm("Brinjikji systematic literature review of imaging features of spinal degeneration in asymptomatic populations") },
    { theme: "Genou", title: "Un kilo perdu, c'est quatre kilos de moins sur le genou.",
      stat: "×4", statLabel: "de charge en moins sur le genou à chaque pas, pour chaque kilo perdu",
      body: "Chez des personnes en surpoids avec une arthrose du genou, chaque kilo perdu réduisait d'environ quatre kilos la force qui traverse le genou à chaque pas.",
      action: "Associer activité physique et alimentation équilibrée soulage vraiment les genoux.",
      source: "Messier et al., Arthritis & Rheumatism, 2005", url: pm("Messier weight loss reduces knee-joint loads overweight knee osteoarthritis 2005") },
    { theme: "Ménisque", title: "Pour un ménisque usé, la kiné fait aussi bien que l'opération.",
      stat: "2 ans", statLabel: "de suivi sans différence entre exercices et chirurgie",
      body: "Chez 140 adultes avec une lésion dégénérative du ménisque, un programme d'exercices supervisés a donné les mêmes résultats que l'arthroscopie, et les muscles étaient plus forts dans le groupe exercice.",
      action: "Parles-en à ton médecin et à ton kiné : l'exercice est souvent le premier traitement à essayer.",
      source: "Kise et al., BMJ, 2016", url: pm("Kise exercise therapy versus arthroscopic partial meniscectomy degenerative meniscal tear BMJ 2016") },
    { theme: "Mal de dos", title: "Exercice et explications préviennent le mal de dos.",
      stat: "−45 %", statLabel: "de risque d'un nouvel épisode de mal de dos dans l'année",
      body: "En réunissant 21 essais et plus de 30 000 personnes, l'exercice associé à des explications sur le dos réduisait nettement le risque de rechute. Les ceintures et les semelles, elles, ne protégeaient pas.",
      action: "Continuer tes exercices après la fin du programme, c'est la meilleure prévention.",
      source: "Steffens et al., JAMA Internal Medicine, 2016", url: pm("Steffens prevention of low back pain systematic review meta-analysis JAMA Intern Med 2016") },
    { theme: "Mal de dos", title: "Un mal de dos récent s'améliore vite chez la plupart.",
      stat: "52 → 23", statLabel: "sur 100 : la douleur moyenne au début, puis après 6 semaines",
      body: "En réunissant 33 études, les chercheurs ont observé que la douleur d'une lombalgie récente diminue de plus de moitié en six semaines en moyenne. Elle continue ensuite de baisser plus lentement.",
      action: "Reste actif et patient : la grande majorité des maux de dos récents s'améliorent.",
      source: "Menezes Costa et al., CMAJ, 2012", url: pm("Menezes Costa prognosis of acute and persistent low-back pain meta-analysis CMAJ 2012") },
    { theme: "Sport", title: "Un exercice simple divise par deux les blessures aux ischios.",
      stat: "−51 %", statLabel: "de blessures aux ischio-jambiers avec le Nordic curl",
      body: "Sur 15 études et plus de 8 000 sportifs, les programmes qui incluent le Nordic curl réduisent jusqu'à de moitié les blessures à l'arrière de la cuisse.",
      action: "Le Nordic curl assisté est dans la bibliothèque : vas-y progressivement.",
      source: "van Dyk et al., British Journal of Sports Medicine, 2019", url: pm("van Dyk including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries") },
    { theme: "Sport", title: "S'échauffer avec un vrai programme évite des blessures.",
      stat: "−39 %", statLabel: "de blessures chez les footballeurs avec l'échauffement FIFA 11+",
      body: "Ce programme d'échauffement de 20 minutes associe course, renforcement, équilibre et sauts. Pratiqué régulièrement, il réduit nettement les blessures.",
      action: "Ne zappe pas l'échauffement de tes séances : c'est lui qui prépare le corps.",
      source: "Thorborg et al., British Journal of Sports Medicine, 2017", url: pm("Thorborg effect of specific exercise-based football injury prevention programmes FIFA 11+ 2017") },
    { theme: "Os", title: "Le renforcement rend les os plus solides.",
      stat: "8 mois", statLabel: "de renforcement intensif et encadré ont augmenté la densité osseuse",
      body: "Chez 101 femmes ménopausées avec des os fragiles, un entraînement de renforcement intensif et supervisé a amélioré la densité des os du dos et de la hanche, sans plus de blessures.",
      action: "Les os aiment qu'on les sollicite : renforcement et marche sont tes alliés.",
      source: "Watson et al., Journal of Bone and Mineral Research, 2018", url: pm("Watson LIFTMOR high-intensity resistance and impact training bone mineral density postmenopausal 2018") },
    { theme: "Mémoire", title: "Marcher davantage est associé à moins de démence.",
      stat: "−51 %", statLabel: "de risque de démence autour de 9 800 pas par jour",
      body: "Chez 78 000 adultes suivis sept ans, ceux qui marchaient le plus avaient moins de démence. Dès 3 800 pas par jour, le risque était déjà plus bas de 25 %. C'est une association.",
      action: "Chaque pas compte : ajoute une petite marche à ta journée.",
      source: "del Pozo Cruz et al., JAMA Neurology, 2022", url: pm("del Pozo Cruz association of daily step count and intensity with incident dementia JAMA Neurology 2022") },
    { theme: "Sédentarité", title: "Bouger une heure par jour compense les longues journées assises.",
      stat: "60 à 75 min", statLabel: "d'activité modérée par jour effacent le risque lié à la position assise",
      body: "En réunissant plus d'un million de personnes, les chercheurs ont observé que 60 à 75 minutes d'activité modérée par jour, comme la marche rapide, faisaient disparaître le surrisque lié à beaucoup de temps assis.",
      action: "Pas besoin de tout faire d'un coup : séance, marche et trajets à pied s'additionnent.",
      source: "Ekelund et al., The Lancet, 2016", url: pm("Ekelund does physical activity attenuate or eliminate sitting time mortality Lancet 2016") },
    { theme: "Lien social", title: "Être bien entouré est bon pour la santé.",
      stat: "+50 %", statLabel: "de chances de survie avec des liens sociaux solides",
      body: "En réunissant 148 études et plus de 300 000 personnes, les liens sociaux forts étaient associés à une meilleure survie, avec un effet comparable à l'arrêt du tabac.",
      action: "Faire sa séance avec un proche ou marcher à plusieurs, c'est double bénéfice.",
      source: "Holt-Lunstad et al., PLOS Medicine, 2010", url: pm("Holt-Lunstad social relationships and mortality risk meta-analytic review 2010") },
    { theme: "Cerveau", title: "L'exercice entretient aussi la tête.",
      stat: "39 études", statLabel: "montrent que l'exercice améliore les capacités du cerveau après 50 ans",
      body: "Renforcement, aérobie et tai-chi amélioraient tous la mémoire, l'attention et la réflexion chez les plus de 50 ans, avec au moins 45 minutes par séance.",
      action: "Ton programme fait du bien à tes muscles, et à ton cerveau.",
      source: "Northey et al., British Journal of Sports Medicine, 2018", url: pm("Northey exercise interventions for cognitive function in adults older than 50 systematic review 2018") }
  ];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function todayIdx() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000) % TIPS.length; }

  var ICON = "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z'/></svg>";

  function card() {
    var t = TIPS[todayIdx()];
    var b = document.createElement("button");
    b.type = "button"; b.className = "ks-card"; b.id = "ks-card";
    b.setAttribute("aria-label", "Le savais-tu ? " + t.title);
    b.onclick = function () { open(todayIdx()); };
    b.innerHTML = "<span class='ks-tag'>" + ICON + "Le savais-tu ?</span>" +
      "<span class='ks-title'>" + esc(t.title) + "</span>" +
      "<span class='ks-src'>" + esc(t.source.replace(/^.*?,\s*/, "")) + "<span aria-hidden='true'>›</span></span>";
    return b;
  }
  function place() {
    var box = $("today-card"); if (!box || !box.firstChild) return;
    if ($("ks-card")) return;
    var anchor = box.querySelector(".kr-remind") || box.querySelector(".lx-link") || box.querySelector(".lx-cta");
    var c = card();
    if (anchor && anchor.nextSibling) box.insertBefore(c, anchor.nextSibling); else box.appendChild(c);
  }

  var cur = 0;
  function open(i) {
    cur = (i + TIPS.length) % TIPS.length;
    var t = TIPS[cur], sh = $("ks-sheet");
    if (!sh) { sh = document.createElement("div"); sh.id = "ks-sheet"; sh.className = "kf-sheet ks-sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Le savais-tu ?"); document.body.appendChild(sh); }
    sh.innerHTML = "<div class='kf-sheet-body ks-body'>" +
      "<button class='kf-back' onclick='KineSavoir.close()' aria-label='Fermer'>←</button>" +
      "<div class='ks-tag'>" + ICON + "Le savais-tu ? · " + esc(t.theme) + "</div>" +
      "<h2 class='ks-h'>" + esc(t.title) + "</h2>" +
      "<div class='ks-stat'><b>" + esc(t.stat) + "</b><span>" + esc(t.statLabel) + "</span></div>" +
      "<p class='ks-p'>" + esc(t.body) + "</p>" +
      "<div class='ks-do'><strong>Pour toi</strong><span>" + esc(t.action) + "</span></div>" +
      "<div class='ks-ref'><span>Source</span><strong>" + esc(t.source) + "</strong>" +
      "<a href='" + esc(t.url) + "' target='_blank' rel='noopener'>Voir l'étude</a></div>" +
      "<p class='ks-note'>Ces informations générales ne remplacent pas l'avis de ton kinésithérapeute ou de ton médecin.</p>" +
      "</div><div class='kf-sheet-foot ks-foot'>" +
      "<button class='seq-btn-secondary' onclick='KineSavoir.open(" + (cur - 1) + ")' aria-label='Précédent'>‹</button>" +
      "<span class='ks-count'>" + (cur + 1) + " sur " + TIPS.length + "</span>" +
      "<button class='seq-btn-secondary' onclick='KineSavoir.open(" + (cur + 1) + ")' aria-label='Suivant'>›</button></div>";
    sh.classList.add("open");
    var body = sh.querySelector(".ks-body"); if (body) body.scrollTop = 0;
  }
  function close() { var sh = $("ks-sheet"); if (sh) sh.classList.remove("open"); }

  window.KineSavoir = { tips: TIPS, open: open, close: close, place: place, today: todayIdx };

  function init() {
    var box = $("today-card"); if (!box) return;
    place();
    new MutationObserver(function () { if (!$("ks-card")) place(); }).observe(box, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
