/* ═══════════ KinéForce — Parcours de rééducation (contenu clinique) ═══════════
   Pour chaque pathologie : les mesures à faire au cabinet, les étapes, les objectifs
   pour passer à l'étape suivante (cochés par le kiné ou calculés depuis le bilan),
   les exercices proposés (dans la bibliothèque de l'appli) et les sources.
   Les seuils sont des repères tirés de la littérature : le kiné les ajuste pour chaque patient.
   Aucune donnée patient ici : seulement du contenu. */
var KineParcours = (function () {
  "use strict";

  /* ════════ Les mesures ════════
     s : mesurée des deux côtés (calcul de la symétrie) ; n : nombre d'essais ; lo : plus petit = mieux ;
     incl : mesurable avec le téléphone (inclinomètre) ; ch : choix proposés (valeur = indice) */
  var M = {
    quad:   { l: "Force du quadriceps", u: "kg", s: 1, n: 3, g: "Force", how: "Assis, genou fléchi à 60°, dynamomètre à la cheville, 3 essais de 5 s, on garde le meilleur. Toujours la même position." },
    ischio: { l: "Force des ischio-jambiers", u: "kg", s: 1, n: 3, g: "Force", how: "Assis, genou fléchi à 60°, dynamomètre derrière la cheville, 3 essais de 5 s." },
    abd:    { l: "Force des abducteurs de hanche", u: "kg", s: 1, n: 3, g: "Force", how: "Couché sur le côté, dynamomètre au-dessus de la malléole externe, 3 essais de 5 s." },
    flex:   { l: "Flexion du genou", u: "°", s: 1, incl: 1, g: "Amplitude", how: "Couché sur le dos, talon qui glisse vers la fesse. Au téléphone : posé sur la cuisse puis sur le tibia." },
    ext:    { l: "Extension du genou", u: "°", s: 1, incl: 1, g: "Amplitude", how: "0 = extension complète, valeur négative = déficit (−5 = il manque 5°), positive = hyperextension." },
    peri:   { l: "Périmètre au milieu de la rotule", u: "cm", s: 1, g: "Périmètre", how: "Mètre ruban au milieu de la rotule, genou tendu et détendu. Reflète l'épanchement." },
    cuisse: { l: "Périmètre de la cuisse (15 cm au-dessus de la rotule)", u: "cm", s: 1, g: "Périmètre", how: "Repère pris depuis la pointe de la rotule. Reflète la fonte musculaire." },
    epanch: { l: "Épanchement (test du balayage)", ch: ["Aucun", "Traces", "1+", "2+", "3+"], g: "Périmètre", how: "Balayage de bas en haut du côté interne puis du côté externe : on observe la vague de liquide." },
    hop1:   { l: "Saut sur une jambe, en distance", u: "cm", s: 1, n: 3, g: "Fonction", how: "Départ et réception sur la même jambe, réception tenue 2 s. Meilleur de 3 essais." },
    hop3:   { l: "Triple saut sur une jambe", u: "cm", s: 1, n: 3, g: "Fonction", how: "Trois sauts enchaînés sur la même jambe, réception tenue." },
    hop6:   { l: "6 m à cloche-pied, chronométré", u: "s", s: 1, n: 3, lo: 1, g: "Fonction", how: "6 mètres le plus vite possible sur une jambe." },
    yb:     { l: "Y-balance, direction antérieure", u: "cm", s: 1, n: 3, g: "Fonction", how: "Debout sur une jambe, l'autre pied pousse le plus loin possible vers l'avant sans perdre l'équilibre." },
    sts30:  { l: "Lever de chaise en 30 s", u: "fois", g: "Fonction", how: "Chaise de 43 cm environ, bras croisés : nombre de levers complets en 30 secondes." },
    tug:    { l: "Timed Up and Go", u: "s", lo: 1, g: "Fonction", how: "Se lever, marcher 3 m, faire demi-tour, revenir s'asseoir, à vitesse habituelle." },
    marche40:{ l: "Marche rapide 4 × 10 m", u: "s", lo: 1, g: "Fonction", how: "40 m au total en 4 allers-retours de 10 m, vite mais en sécurité." },
    sldec:  { l: "Douleur au squat déclive sur une jambe", u: "/10", lo: 1, g: "Douleur", how: "Squat sur une jambe sur un plan incliné à 25°, jusqu'à 60° de flexion : douleur de 0 à 10." },
    dou:    { l: "Douleur à l'effort", u: "/10", lo: 1, g: "Douleur", how: "Douleur la plus forte pendant les activités de la semaine, de 0 à 10." },
    visap:  { l: "Score VISA-P", u: "/100", g: "Questionnaire", how: "Questionnaire de la tendinopathie rotulienne : 100 = aucune gêne." },
    akps:   { l: "Score de Kujala (AKPS)", u: "/100", g: "Questionnaire", how: "Questionnaire de la douleur antérieure du genou : 100 = aucune gêne." },
    aclrsi: { l: "Score ACL-RSI", u: "/100", g: "Questionnaire", how: "Confiance psychologique pour reprendre le sport après une lésion du LCA." },
    koos:   { l: "KOOS, sous-score Douleur", u: "/100", g: "Questionnaire", how: "100 = aucune douleur." }
  };

  /* ════════ Les règles des objectifs calculés ════════
     m + lsi : symétrie ≥ x % ; m + min / max : valeur du côté atteint ; m + def : déficit d'extension ≤ x° ;
     m + diff : écart entre les côtés ≤ x ; m + gain : progrès depuis le premier bilan ≥ x ;
     j : jours depuis la date de départ (opération ou début) ; dou : douleur notée aux 3 dernières séances ≤ x ;
     hops : tous les tests de saut mesurés ≥ x % */

  var SRC = {
    melick: "van Melick N et al. Evidence-based clinical practice update: practice guidelines for ACL rehabilitation. Br J Sports Med 2016.",
    aspetar: "Kotsifaki R et al. Aspetar clinical practice guideline on rehabilitation after ACL reconstruction. Br J Sports Med 2023.",
    grindem: "Grindem H et al. Simple decision rules can reduce reinjury risk by 84% after ACL reconstruction: the Delaware-Oslo ACL cohort study. Br J Sports Med 2016.",
    webster: "Webster KE et al. Development and preliminary validation of a scale to measure the psychological impact of returning to sport following ACL reconstruction (ACL-RSI). Phys Ther Sport 2008.",
    noyes: "Noyes FR et al. Abnormal lower limb symmetry determined by function hop tests after ACL rupture. Am J Sports Med 1991.",
    plisky: "Plisky PJ et al. Star Excursion Balance Test as a predictor of lower extremity injury in high school basketball players. J Orthop Sports Phys Ther 2006.",
    filbay: "Filbay SR, Grindem H. Evidence-based recommendations for the management of anterior cruciate ligament (ACL) rupture. Best Pract Res Clin Rheumatol 2019.",
    frobell: "Frobell RB et al. A randomized trial of treatment for acute anterior cruciate ligament tears (KANON). N Engl J Med 2010.",
    eitzen: "Eitzen I et al. A progressive 5-week exercise therapy program leads to significant improvement in knee function early after ACL injury. J Orthop Sports Phys Ther 2010.",
    fitz: "Fitzgerald GK et al. The efficacy of perturbation training in nonoperative ACL rehabilitation programs for physically active individuals. Phys Ther 2000.",
    logMen: "Logerstedt DS et al. Knee pain and mobility impairments: meniscal and articular cartilage lesions, revision 2018. J Orthop Sports Phys Ther 2018.",
    kise: "Kise NJ et al. Exercise therapy versus arthroscopic partial meniscectomy for degenerative meniscal tear in middle aged patients. BMJ 2016.",
    logLig: "Logerstedt DS et al. Knee stability and movement coordination impairments: knee ligament sprain, revision 2017. J Orthop Sports Phys Ther 2017.",
    crossley: "Crossley KM et al. 2016 Patellofemoral pain consensus statement from the 4th International Patellofemoral Pain Research Retreat. Br J Sports Med 2016.",
    collins: "Collins NJ et al. 2018 Consensus statement on exercise therapy and physical interventions (orthoses, taping and manual therapy) to treat patellofemoral pain. Br J Sports Med 2018.",
    willy: "Willy RW et al. Patellofemoral pain: clinical practice guidelines. J Orthop Sports Phys Ther 2019.",
    malliaras: "Malliaras P et al. Patellar tendinopathy: clinical diagnosis, load management, and advice for challenging case presentations. J Orthop Sports Phys Ther 2015.",
    breda: "Breda SJ et al. Effectiveness of progressive tendon-loading exercise therapy in patients with patellar tendinopathy: a randomised clinical trial. Br J Sports Med 2021.",
    silber: "Silbernagel KG et al. Continued sports activity, using a pain-monitoring model, during rehabilitation in patients with Achilles tendinopathy. Am J Sports Med 2007.",
    oarsi: "Bannuru RR et al. OARSI guidelines for the non-surgical management of knee, hip, and polyarticular osteoarthritis. Osteoarthritis Cartilage 2019.",
    nice: "NICE guideline NG226. Osteoarthritis in over 16s: diagnosis and management. 2022.",
    glad: "Skou ST, Roos EM. Good Life with osteoArthritis in Denmark (GLA:D): evidence-based education and supervised neuromuscular exercise delivered by certified physiotherapists nationwide. BMC Musculoskelet Disord 2017.",
    fransen: "Fransen M et al. Exercise for osteoarthritis of the knee. Cochrane Database Syst Rev 2015.",
    dobson: "Dobson F et al. OARSI recommended performance-based tests to assess physical function in people diagnosed with hip or knee osteoarthritis. Osteoarthritis Cartilage 2013.",
    jette: "Jette DU et al. Physical therapist management of total knee arthroplasty (clinical practice guideline). Phys Ther 2020.",
    bade: "Bade MJ, Stevens-Lapsley JE. Early high-intensity rehabilitation following total knee arthroplasty improves outcomes. J Orthop Sports Phys Ther 2011.",
    stiell: "Stiell IG et al. Derivation of a decision rule for the use of radiography in acute knee injuries (Ottawa knee rule). Ann Emerg Med 1995.",
    benj: "Benjaminse A et al. Clinical diagnosis of an anterior cruciate ligament rupture: a meta-analysis. J Orthop Sports Phys Ther 2006.",
    decary: "Décary S et al. Diagnostic validity of combining history elements and physical examination tests for traumatic and non-traumatic knee disorders. Br J Sports Med 2018."
  };

  /* Alertes communes à tous les parcours du genou : on oriente vers le médecin */
  var ALERTES_GENOU = [
    "Genou chaud, rouge et gonflé avec fièvre ou frissons : suspicion d'infection, avis médical le jour même.",
    "Mollet douloureux, gonflé ou chaud, surtout après une opération ou une immobilisation : suspicion de phlébite.",
    "Vrai blocage du genou (impossible de l'étendre) : avis orthopédique rapide.",
    "Douleur la nuit sans lien avec les mouvements, perte de poids inexpliquée, antécédent de cancer : avis médical."
  ];

  /* ════════ Les parcours ════════ */
  var P = {};

  P.lca_op = {
    nom: "LCA opéré", long: "Ligamentoplastie du ligament croisé antérieur", zone: "genou", op: 1,
    opts: [{ id: "greffe", l: "Greffe", ch: [["didt", "Ischio-jambiers (DIDT)"], ["kj", "Tendon rotulien (KJ)"], ["quadri", "Tendon quadricipital"], ["autre", "Autre"]] },
           { id: "menisque", l: "Suture méniscale associée", ch: [["non", "Non"], ["oui", "Oui"]] }],
    key: { m: "quad", lsi: 1, l: "Symétrie du quadriceps" },
    mes: ["quad", "ischio", "flex", "ext", "peri", "cuisse", "epanch", "hop1", "hop3", "hop6", "yb", "aclrsi"],
    ref: "Leg extension amplitude limitée",
    notes: ["Greffe ischio-jambiers : renforcement des ischios en charge progressive, pas de travail lourd ni excentrique avant 6 à 8 semaines environ, selon le chirurgien.",
            "Leg extension : de 90° à 45° de flexion dès la 4e semaine environ, amplitude complète plus tard (vers la 12e semaine), en progression.",
            "Suture méniscale associée : respecter les consignes du chirurgien (flexion et appui limités au début, pas de squat profond en charge pendant plusieurs mois)."],
    etapes: [
      { nom: "Récupérer", but: "Extension complète, genou qui dégonfle, quadriceps qui se contracte, marche normale.",
        obj: [
          { id: "ext", t: "Extension : déficit de 5° maximum par rapport au côté sain", p: "Ton genou s'étend presque complètement", a: { m: "ext", def: 5 } },
          { id: "flex", t: "Flexion d'au moins 110°", p: "Ton genou se plie à 110°", a: { m: "flex", min: 110 } },
          { id: "epanch", t: "Épanchement à « Traces » au maximum", p: "Ton genou a dégonflé", a: { m: "epanch", max: 1 } },
          { id: "slr", t: "Jambe tendue levée sans décrochage du genou", p: "Tu lèves la jambe tendue sans que le genou plie" },
          { id: "marche", t: "Marche sans boiterie, sans béquilles", p: "Tu marches normalement, sans béquilles" }],
        exos: ["Extension de genou tenue", "Relevé de jambe tendue couché", "Extension terminale du genou", "Squat ballon dans le dos contre le mur", "Pont de hanche", "Élévation des talons", "Équilibre unipodal", "Assis-debout de chaise", { n: "Talons-fesses debout", sauf: { greffe: "didt" } }, "Pompe de cheville couché", "Contraction du quadriceps couché", "Glissement du talon couché", "Extension passive talon sur un rouleau", { n: "Contraction des ischios talon au sol", sauf: { greffe: "didt" } }, "Flexion assise, le pied recule", "Genou qui se balance, assis sur une table", "Vélo d'appartement", "Arc court du quadriceps sur un rouleau"] },
      { nom: "Renforcer dans l'axe", but: "Renforcement dans le plan sagittal, sans rotation. Équilibre sur une jambe.",
        obj: [
          { id: "dou", t: "Douleur de 3/10 au maximum aux 3 dernières séances", p: "Peu ou pas de douleur pendant tes séances", a: { dou: 3 } },
          { id: "epanch2", t: "Pas d'épanchement après les séances", p: "Ton genou ne gonfle pas après l'effort", a: { m: "epanch", max: 1 } },
          { id: "flex2", t: "Flexion d'au moins 90 % du côté sain", p: "Ton genou se plie presque comme l'autre", a: { m: "flex", lsi: 90 } },
          { id: "quad70", t: "Symétrie du quadriceps d'au moins 70 %", p: "Ta cuisse a retrouvé 70 % de sa force", a: { m: "quad", lsi: 70 } },
          { id: "squat", t: "Squat sur deux jambes symétrique, sans report du poids", p: "Tu fais des squats bien droits" }],
        exos: ["Squat bilatéral", "Goblet squat", "Chaise contre le mur", "Step-up sur marche", "Descente de marche", "Pont fessier unilatéral", { n: "Soulevé de terre roumain unipodal", sauf: { greffe: "didt" } }, "Presse à cuisses", "Leg extension amplitude limitée", "Élévation des talons unipodale", "Unipodal yeux fermés", "Mini-squat", "Marche arrière", "Fente statique", "Descente de marche sur le côté", "Mini-squat sur une jambe, tenu", "La chaise qui récite l'alphabet"] },
      { nom: "Renforcer dans tous les plans", but: "Plan frontal puis rotation. Équilibre sur surface instable.",
        obj: [
          { id: "j84", t: "Au moins 12 semaines depuis l'opération", p: "12 semaines depuis ton opération", a: { j: 84 } },
          { id: "quad80", t: "Symétrie du quadriceps d'au moins 80 %", p: "Ta cuisse a retrouvé 80 % de sa force", a: { m: "quad", lsi: 80 } },
          { id: "flex3", t: "Flexion d'au moins 95 % du côté sain", p: "Ton genou se plie comme l'autre", a: { m: "flex", lsi: 95 } },
          { id: "yb", t: "Y-balance antérieur : moins de 4 cm d'écart entre les côtés", p: "Ton équilibre est le même des deux côtés", a: { m: "yb", diff: 4 } },
          { id: "sls", t: "Squat sur une jambe contrôlé, sans valgus", p: "Tu fais un squat sur une jambe bien contrôlé" }],
        exos: ["Fente latérale", "Marche latérale élastique", "Monster walk", "Squat bulgare", "Planche Copenhague genou", "Pallof press", "Fente avant et rotation ballon", "Toucher en étoile unipodal", "Avion sur une jambe", "Unipodal sur coussin", "Presse à une jambe", "Nordic curl assisté", "Squat sur une jambe vers la chaise", { n: "Pont des ischios, talons loin", sauf: { greffe: "didt" } }, "Le serveur pressé", "Le squat du cosaque"] },
      { nom: "Courir et petits sauts", but: "Reprise de la course en ligne droite, sauts sur deux pieds puis sur un pied, de faible hauteur.",
        obj: [
          { id: "course", t: "30 min de course continue sans douleur ni gonflement le lendemain", p: "Tu cours 30 minutes sans douleur" },
          { id: "quad85", t: "Symétrie du quadriceps d'au moins 85 %", p: "Ta cuisse a retrouvé 85 % de sa force", a: { m: "quad", lsi: 85 } },
          { id: "hop80", t: "Tests de saut à au moins 80 % du côté sain", p: "Tes sauts atteignent 80 % de l'autre jambe", a: { hops: 80 } },
          { id: "recep", t: "Réceptions de sauts symétriques, genou dans l'axe", p: "Tu te réceptionnes bien droit" }],
        exos: ["Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Montées de genoux", "Skater latéral sans saut", "Squat réactif", "Squat bulgare", "Presse à une jambe", "Leg extension", "Copenhague dynamique genou", "Réception de saut stabilisée", "Saut sur la marche", "Le kangourou"] },
      { nom: "Grands sauts et changements de direction", but: "Pliométrie, pivots, agilité, puis travail spécifique au sport.",
        obj: [
          { id: "quad90", t: "Symétrie du quadriceps et des ischios d'au moins 90 %", p: "Ta cuisse a retrouvé 90 % de sa force", a: { m: "quad", lsi: 90 } },
          { id: "isch90", t: "Symétrie des ischio-jambiers d'au moins 90 %", p: "L'arrière de ta cuisse a retrouvé 90 % de sa force", a: { m: "ischio", lsi: 90 } },
          { id: "hop90", t: "Tests de saut (simple, triple, 6 m) à au moins 90 %", p: "Tes sauts atteignent 90 % de l'autre jambe", a: { hops: 90 } },
          { id: "agil", t: "Changements de direction et pivots sans appréhension", p: "Tu changes de direction sans crainte" }],
        exos: ["Sauts sur une jambe", "Sauts bulgares réactifs", "Sauts latéraux sur une jambe réactifs", "Fentes réactives", "Pas chassés réactifs", "Copenhague dynamique", "Nordic curl assisté", "Fente avec charge", "Saut sur une jambe, réception tenue", "Bonds du patineur", "Fentes sautées"] },
      { nom: "Retour au sport", but: "Entraînement complet puis compétition. Programme de prévention à garder.",
        obj: [
          { id: "j270", t: "Au moins 9 mois depuis l'opération", p: "9 mois depuis ton opération", a: { j: 270 } },
          { id: "rsi", t: "ACL-RSI satisfaisant (repère : 65 ou plus, à interpréter)", p: "Tu te sens prêt dans ta tête", a: { m: "aclrsi", min: 65 } },
          { id: "entr", t: "Entraînement collectif complet, sans restriction", p: "Tu as repris l'entraînement complet" },
          { id: "prev", t: "Programme de prévention expliqué et en place", p: "Tu as ton programme de prévention" }],
        exos: ["Nordic curl assisté", "Planche Copenhague", "Sauts sur une jambe", "Fentes réactives", "Squat bulgare", "Pallof press", "Bonds du patineur", "Fentes sautées"] }
    ],
    src: ["melick", "aspetar", "grindem", "webster", "noyes", "plisky"]
  };

  P.lca_cons = {
    nom: "LCA non opéré", long: "Rupture du ligament croisé antérieur, traitement par rééducation", zone: "genou",
    key: { m: "quad", lsi: 1, l: "Symétrie du quadriceps" },
    mes: ["quad", "ischio", "flex", "ext", "peri", "epanch", "hop1", "hop3", "hop6", "yb", "aclrsi"],
    ref: "Presse à une jambe",
    notes: ["La rééducation seule donne des résultats comparables à la chirurgie d'emblée chez de nombreux patients (essai KANON).",
            "Dérobements répétés malgré une rééducation bien conduite, ou souhait de reprendre un sport à pivots avec instabilité : avis chirurgical."],
    etapes: [
      { nom: "Calmer le genou", but: "Dégonfler, retrouver l'extension et la flexion, marcher normalement.",
        obj: [
          { id: "ext", t: "Extension complète ou presque (déficit de 3° maximum)", p: "Ton genou s'étend complètement", a: { m: "ext", def: 3 } },
          { id: "flex", t: "Flexion d'au moins 90 % du côté sain", p: "Ton genou se plie presque comme l'autre", a: { m: "flex", lsi: 90 } },
          { id: "epanch", t: "Épanchement à « Traces » au maximum", p: "Ton genou a dégonflé", a: { m: "epanch", max: 1 } },
          { id: "marche", t: "Marche sans boiterie", p: "Tu marches normalement" }],
        exos: ["Extension de genou tenue", "Relevé de jambe tendue couché", "Extension terminale du genou", "Assis-debout de chaise", "Pont de hanche", "Élévation des talons", "Équilibre unipodal", "Contraction du quadriceps couché", "Glissement du talon couché", "Extension passive talon sur un rouleau", "Vélo d'appartement", "Arc court du quadriceps sur un rouleau"] },
      { nom: "Renforcer dans l'axe", but: "Programme progressif de renforcement, plan sagittal d'abord.",
        obj: [
          { id: "dou", t: "Douleur de 3/10 au maximum aux 3 dernières séances", p: "Peu ou pas de douleur pendant tes séances", a: { dou: 3 } },
          { id: "quad80", t: "Symétrie du quadriceps d'au moins 80 %", p: "Ta cuisse a retrouvé 80 % de sa force", a: { m: "quad", lsi: 80 } },
          { id: "nodero", t: "Aucun dérobement dans la vie quotidienne", p: "Ton genou ne lâche pas" }],
        exos: ["Squat bilatéral", "Goblet squat", "Step-up sur marche", "Descente de marche", "Presse à une jambe", "Leg extension", "Leg curl assis", "Pont fessier unilatéral", "Unipodal yeux fermés", "Mini-squat", "Fente statique", "Descente de marche sur le côté", "Mini-squat sur une jambe, tenu", "Pont des ischios, talons loin"] },
      { nom: "Contrôle dans tous les plans", but: "Plan frontal, rotation, perturbations et surfaces instables.",
        obj: [
          { id: "quad85", t: "Symétrie du quadriceps d'au moins 85 %", p: "Ta cuisse a retrouvé 85 % de sa force", a: { m: "quad", lsi: 85 } },
          { id: "yb", t: "Y-balance antérieur : moins de 4 cm d'écart", p: "Ton équilibre est le même des deux côtés", a: { m: "yb", diff: 4 } },
          { id: "sls", t: "Squat sur une jambe contrôlé, sans valgus", p: "Tu fais un squat sur une jambe bien contrôlé" }],
        exos: ["Fente latérale", "Monster walk", "Squat bulgare", "Pallof press", "Unipodal sur coussin", "Toucher en étoile unipodal", "Avion sur une jambe", "Équilibre réactif sur une jambe", "Planche Copenhague genou", "Squat sur une jambe vers la chaise", "Le serveur pressé", "Le squat du cosaque"] },
      { nom: "Courir et sauter", but: "Course, sauts progressifs puis changements de direction.",
        obj: [
          { id: "course", t: "30 min de course sans douleur ni gonflement", p: "Tu cours 30 minutes sans douleur" },
          { id: "hop85", t: "Tests de saut à au moins 85 %", p: "Tes sauts atteignent 85 % de l'autre jambe", a: { hops: 85 } }],
        exos: ["Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Sauts sur une jambe", "Pas chassés réactifs", "Fentes réactives", "Squat réactif", "Réception de saut stabilisée", "Saut sur la marche", "Saut sur une jambe, réception tenue", "Le kangourou"] },
      { nom: "Retour à l'activité", but: "Reprise du sport choisi. Si sport à pivots : décision partagée avec le patient.",
        obj: [
          { id: "quad90", t: "Symétrie du quadriceps d'au moins 90 %", p: "Ta cuisse a retrouvé 90 % de sa force", a: { m: "quad", lsi: 90 } },
          { id: "hop90", t: "Tests de saut à au moins 90 %", p: "Tes sauts atteignent 90 % de l'autre jambe", a: { hops: 90 } },
          { id: "nodero2", t: "Pas de dérobement à l'entraînement", p: "Ton genou tient à l'entraînement" }],
        exos: ["Sauts bulgares réactifs", "Sauts latéraux sur une jambe réactifs", "Nordic curl assisté", "Planche Copenhague", "Bonds du patineur", "Fentes sautées"] }
    ],
    src: ["filbay", "frobell", "eitzen", "fitz", "grindem", "noyes"]
  };

  P.menisectomie = {
    nom: "Méniscectomie", long: "Méniscectomie partielle sous arthroscopie", zone: "genou", op: 1,
    key: { m: "quad", lsi: 1, l: "Symétrie du quadriceps" },
    mes: ["quad", "flex", "ext", "peri", "epanch", "hop1", "yb", "koos"],
    ref: "Presse à une jambe",
    notes: ["Lésion méniscale dégénérative sans blocage : la rééducation est le traitement de première intention, avant toute arthroscopie (Kise 2016)."],
    etapes: [
      { nom: "Récupérer", but: "Dégonfler, amplitude complète, marche normale.",
        obj: [
          { id: "epanch", t: "Épanchement à « Traces » au maximum", p: "Ton genou a dégonflé", a: { m: "epanch", max: 1 } },
          { id: "ext", t: "Extension complète (déficit de 3° maximum)", p: "Ton genou s'étend complètement", a: { m: "ext", def: 3 } },
          { id: "flex", t: "Flexion d'au moins 90 % du côté sain", p: "Ton genou se plie presque comme l'autre", a: { m: "flex", lsi: 90 } },
          { id: "marche", t: "Marche sans boiterie", p: "Tu marches normalement" }],
        exos: ["Extension de genou tenue", "Relevé de jambe tendue couché", "Extension terminale du genou", "Assis-debout de chaise", "Pont de hanche", "Équilibre unipodal", "Contraction du quadriceps couché", "Glissement du talon couché", "Extension passive talon sur un rouleau", "Flexion assise, le pied recule", "Vélo d'appartement", "Genou qui se balance, assis sur une table"] },
      { nom: "Renforcer", but: "Renforcement progressif du quadriceps, des fessiers et du mollet.",
        obj: [
          { id: "dou", t: "Douleur de 3/10 au maximum aux 3 dernières séances", p: "Peu ou pas de douleur pendant tes séances", a: { dou: 3 } },
          { id: "quad80", t: "Symétrie du quadriceps d'au moins 80 %", p: "Ta cuisse a retrouvé 80 % de sa force", a: { m: "quad", lsi: 80 } },
          { id: "sls", t: "Squat sur une jambe contrôlé", p: "Tu fais un squat sur une jambe bien contrôlé" }],
        exos: ["Squat bilatéral", "Step-up sur marche", "Descente de marche", "Presse à une jambe", "Leg extension", "Fente arrière", "Pont fessier unilatéral", "Marche latérale élastique", "Unipodal sur coussin", "Mini-squat", "Descente de marche sur le côté", "Fente statique", "Pont des ischios, talons loin", "Squat sur une jambe vers la chaise", "La chaise qui récite l'alphabet"] },
      { nom: "Reprendre course et sport", but: "Course, sauts, changements de direction selon le sport.",
        obj: [
          { id: "quad90", t: "Symétrie du quadriceps d'au moins 90 %", p: "Ta cuisse a retrouvé 90 % de sa force", a: { m: "quad", lsi: 90 } },
          { id: "hop90", t: "Saut sur une jambe à au moins 90 %", p: "Tes sauts atteignent 90 % de l'autre jambe", a: { hops: 90 } },
          { id: "course", t: "Course sans douleur ni gonflement", p: "Tu cours sans douleur" }],
        exos: ["Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Squat bulgare", "Fente latérale", "Pas chassés réactifs", "Sauts sur une jambe", "Réception de saut stabilisée", "Saut sur une jambe, réception tenue", "Bonds du patineur", "Le kangourou"] }
    ],
    src: ["logMen", "kise", "noyes"]
  };

  P.suture_men = {
    nom: "Suture méniscale", long: "Réparation (suture) d'un ménisque", zone: "genou", op: 1,
    key: { m: "quad", lsi: 1, l: "Symétrie du quadriceps" },
    mes: ["quad", "flex", "ext", "peri", "epanch", "hop1", "yb"],
    ref: "Leg extension amplitude limitée",
    notes: ["Les délais dépendent du type de lésion et du chirurgien : suivre son protocole en priorité.",
            "Repères fréquents : flexion limitée (souvent 90°) les 4 à 6 premières semaines, appui selon le chirurgien, pas de squat profond en charge ni de rotation en charge pendant 3 à 4 mois."],
    etapes: [
      { nom: "Protéger", but: "Respecter les limites de flexion et d'appui, extension complète, quadriceps actif.",
        obj: [
          { id: "ext", t: "Extension complète (déficit de 3° maximum)", p: "Ton genou s'étend complètement", a: { m: "ext", def: 3 } },
          { id: "epanch", t: "Épanchement à « Traces » au maximum", p: "Ton genou a dégonflé", a: { m: "epanch", max: 1 } },
          { id: "slr", t: "Jambe tendue levée sans décrochage", p: "Tu lèves la jambe tendue sans que le genou plie" },
          { id: "consigne", t: "Fin de la période de protection fixée par le chirurgien", p: "Ton chirurgien autorise la suite" }],
        exos: ["Extension de genou tenue", "Relevé de jambe tendue couché", "Extension terminale du genou", "Pont de hanche", "Élévation des talons", "Équilibre unipodal", "Pompe de cheville couché", "Contraction du quadriceps couché", "Glissement du talon couché", "Extension passive talon sur un rouleau", "Contraction des ischios talon au sol", "Arc court du quadriceps sur un rouleau"] },
      { nom: "Récupérer et renforcer", but: "Amplitude complète progressive, renforcement sans charge en flexion profonde.",
        obj: [
          { id: "flex", t: "Flexion d'au moins 90 % du côté sain", p: "Ton genou se plie presque comme l'autre", a: { m: "flex", lsi: 90 } },
          { id: "marche", t: "Marche sans boiterie", p: "Tu marches normalement" },
          { id: "quad70", t: "Symétrie du quadriceps d'au moins 70 %", p: "Ta cuisse a retrouvé 70 % de sa force", a: { m: "quad", lsi: 70 } }],
        exos: ["Squat ballon dans le dos contre le mur", "Step-up sur marche", "Leg extension amplitude limitée", "Pont fessier unilatéral", "Marche latérale élastique", "Unipodal yeux fermés", "Clamshell", "Vélo d'appartement", "Mini-squat", "Marche arrière", "Fente statique", "Pont des ischios, talons loin"] },
      { nom: "Renforcer en charge complète", but: "Charge progressive, plan frontal puis rotation, à partir de 3 à 4 mois.",
        obj: [
          { id: "quad80", t: "Symétrie du quadriceps d'au moins 80 %", p: "Ta cuisse a retrouvé 80 % de sa force", a: { m: "quad", lsi: 80 } },
          { id: "sls", t: "Squat sur une jambe contrôlé", p: "Tu fais un squat sur une jambe bien contrôlé" },
          { id: "dou", t: "Douleur de 3/10 au maximum aux 3 dernières séances", p: "Peu ou pas de douleur pendant tes séances", a: { dou: 3 } }],
        exos: ["Squat bilatéral", "Presse à une jambe", "Fente arrière", "Fente latérale", "Squat bulgare", "Pallof press", "Unipodal sur coussin", "Toucher en étoile unipodal", "Descente de marche sur le côté", "Mini-squat sur une jambe, tenu", "Squat sur une jambe vers la chaise", "Le serveur pressé"] },
      { nom: "Courir et reprendre le sport", but: "Course, sauts, pivots, en général vers 4 à 6 mois.",
        obj: [
          { id: "quad90", t: "Symétrie du quadriceps d'au moins 90 %", p: "Ta cuisse a retrouvé 90 % de sa force", a: { m: "quad", lsi: 90 } },
          { id: "hop90", t: "Saut sur une jambe à au moins 90 %", p: "Tes sauts atteignent 90 % de l'autre jambe", a: { hops: 90 } },
          { id: "course", t: "Course sans douleur ni gonflement", p: "Tu cours sans douleur" }],
        exos: ["Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Sauts sur une jambe", "Pas chassés réactifs", "Fentes réactives", "Réception de saut stabilisée", "Saut sur une jambe, réception tenue", "Bonds du patineur"] }
    ],
    src: ["logMen"]
  };

  P.sfp = {
    nom: "Syndrome fémoro-patellaire", long: "Douleur antérieure du genou (fémoro-patellaire)", zone: "genou",
    key: { m: "akps", l: "Score de Kujala" },
    mes: ["dou", "akps", "quad", "abd", "flex", "yb"],
    ref: "Chaise contre le mur",
    notes: ["Le traitement de référence associe des exercices pour la hanche et pour le genou, et l'éducation sur la gestion de la charge.",
            "Douleur tolérée pendant les exercices : jusqu'à 3 ou 4 sur 10, si elle redescend dans les 24 heures.",
            "Orthèses plantaires préfabriquées et taping : utiles à court terme chez certains patients. Pas d'électrothérapie ni de techniques passives seules."],
    etapes: [
      { nom: "Calmer et comprendre", but: "Éducation, adapter les activités qui chargent la rotule, exercices dans l'amplitude tolérée.",
        obj: [
          { id: "edu", t: "Le patient a compris la gestion de la charge (escaliers, squats, position assise prolongée)", p: "Tu sais quoi adapter au quotidien" },
          { id: "dou5", t: "Douleur à l'effort de 5/10 au maximum", p: "La douleur à l'effort a baissé", a: { m: "dou", max: 5 } },
          { id: "iso", t: "Exercices isométriques bien tolérés", p: "Les exercices statiques passent bien" }],
        exos: ["Chaise contre le mur", "Extension de genou tenue", "Clamshell", "Abduction couché sur le côté", "Pont de hanche", "Squat ballon dans le dos contre le mur", "Contraction du quadriceps couché", "Arc court du quadriceps sur un rouleau", "Marche arrière", "Vélo d'appartement", "La chaise qui récite l'alphabet"] },
      { nom: "Renforcer hanche et genou", but: "Renforcement progressif de la hanche et du quadriceps, contrôle du genou dans l'axe.",
        obj: [
          { id: "dou3", t: "Douleur à l'effort de 3/10 au maximum", p: "Peu de douleur à l'effort", a: { m: "dou", max: 3 } },
          { id: "akps", t: "Kujala amélioré d'au moins 10 points", p: "Ton genou te gêne nettement moins", a: { m: "akps", gain: 10 } },
          { id: "escalier", t: "Escaliers montés et descendus sans douleur gênante", p: "Les escaliers passent sans douleur" },
          { id: "sls", t: "Squat sur une jambe sans valgus", p: "Tu fais un squat sur une jambe bien contrôlé" }],
        exos: ["Marche latérale élastique", "Monster walk", "Pont fessier unilatéral", "Step-up sur marche", "Descente de marche", "Squat bilatéral", "Leg extension amplitude limitée", "Presse à cuisses", "Coquillage pieds décollés", "Unipodal sur coussin", "Mini-squat", "Descente de marche sur le côté", "Mini-squat sur une jambe, tenu", "Fente statique"] },
      { nom: "Reprendre les activités", but: "Course, squats profonds, sauts, sport, avec progression de la charge.",
        obj: [
          { id: "dou2", t: "Douleur à l'effort de 2/10 au maximum", p: "Presque plus de douleur à l'effort", a: { m: "dou", max: 2 } },
          { id: "akps85", t: "Kujala d'au moins 85", p: "Ton genou ne te gêne presque plus", a: { m: "akps", min: 85 } },
          { id: "activ", t: "Activité ou sport repris sans douleur gênante", p: "Tu as repris ton sport" }],
        exos: ["Squat bulgare", "Fente avec charge", "Petersen step-up", "Planche Copenhague genou", "Avion sur une jambe", "Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Squat sur une jambe vers la chaise", "Réception de saut stabilisée", "Le serveur pressé", "Le squat du cosaque"] }
    ],
    src: ["crossley", "collins", "willy"]
  };

  P.tendino_rot = {
    nom: "Tendinopathie rotulienne", long: "Tendinopathie du tendon rotulien (genou du sauteur)", zone: "genou",
    key: { m: "visap", l: "Score VISA-P" },
    mes: ["visap", "sldec", "dou", "quad", "hop1"],
    ref: "Spanish squat à l'élastique",
    notes: ["Suivi de la douleur : pendant l'exercice jusqu'à 3/10 ; le lendemain matin, la douleur et le test du squat déclive doivent revenir à leur niveau habituel. Sinon, on réduit la charge.",
            "Progression en 4 étapes (Breda 2021) : isométrique, charge lourde et lente, stockage d'énergie (sauts), retour au sport.",
            "Les étirements seuls et le repos complet ne suffisent pas : c'est la charge progressive qui soigne le tendon."],
    etapes: [
      { nom: "Isométrique", but: "Contractions statiques longues du quadriceps (par exemple 5 × 45 s), pour calmer la douleur et charger le tendon.",
        obj: [
          { id: "iso", t: "Isométriques à 3/10 de douleur au maximum", p: "Les exercices statiques passent bien" },
          { id: "dec", t: "Squat déclive : 3/10 de douleur au maximum", p: "Le test du squat incliné fait moins mal", a: { m: "sldec", max: 3 } }],
        exos: ["Spanish squat à l'élastique", "Chaise contre le mur", "Extension de genou tenue", "Pont de hanche", "Élévation des talons", "La chaise qui récite l'alphabet", "Vélo d'appartement"] },
      { nom: "Charge lourde et lente", but: "Mouvements lents et lourds (3 s en montée, 3 s en descente), charge qui augmente chaque semaine.",
        obj: [
          { id: "dou", t: "Douleur de 3/10 au maximum aux 3 dernières séances", p: "Peu de douleur pendant tes séances", a: { dou: 3 } },
          { id: "visap", t: "VISA-P amélioré d'au moins 15 points", p: "Ton tendon te gêne nettement moins", a: { m: "visap", gain: 15 } },
          { id: "sls", t: "Squat sur une jambe tolérable en charge", p: "Tu fais un squat sur une jambe avec charge" }],
        exos: ["Leg extension", "Presse à une jambe", "Squat talons surélevés", "Squat bulgare", "Petersen step-up", "Goblet squat", "Spanish squat à l'élastique", "Squat sur une jambe vers la chaise", "Fente statique", "Marche arrière"] },
      { nom: "Stockage d'énergie", but: "Sauts progressifs : sur deux pieds puis un pied, plus haut puis plus vite.",
        obj: [
          { id: "dec2", t: "Squat déclive : 2/10 de douleur au maximum", p: "Le test du squat incliné ne fait presque plus mal", a: { m: "sldec", max: 2 } },
          { id: "saut", t: "Sauts tolérés, retour au niveau de douleur habituel le lendemain", p: "Les sauts passent bien" }],
        exos: ["Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Sauts sur une jambe", "Squat réactif", "Fentes réactives", "Leg extension", "Réception de saut stabilisée", "Saut sur la marche", "Saut sur une jambe, réception tenue", "Le kangourou"] },
      { nom: "Retour au sport", but: "Reprise progressive de l'entraînement, puis de la compétition. On garde 2 séances de renforcement par semaine.",
        obj: [
          { id: "visap80", t: "VISA-P d'au moins 80 (repère)", p: "Ton tendon ne te gêne presque plus", a: { m: "visap", min: 80 } },
          { id: "entr", t: "Entraînement complet sans aggravation le lendemain", p: "Tu as repris l'entraînement complet" }],
        exos: ["Sauts bulgares réactifs", "Sauts latéraux sur une jambe réactifs", "Presse à une jambe", "Leg extension", "Squat bulgare", "Bonds du patineur", "Fentes sautées"] }
    ],
    src: ["malliaras", "breda", "silber"]
  };

  P.gonarthrose = {
    nom: "Arthrose du genou", long: "Gonarthrose", zone: "genou",
    key: { m: "sts30", l: "Lever de chaise en 30 s" },
    mes: ["dou", "sts30", "marche40", "tug", "flex", "ext", "quad", "koos"],
    ref: "Assis-debout de chaise",
    notes: ["L'exercice et l'éducation sont le traitement de première intention, quel que soit le stade radiologique. Perte de poids si surpoids.",
            "Douleur acceptable pendant l'exercice : jusqu'à 5/10 si elle revient à la normale dans les 24 heures (règle utilisée dans GLA:D).",
            "Objectif à long terme : activité physique régulière, environ 150 minutes par semaine."],
    etapes: [
      { nom: "Comprendre et bouger", but: "Éducation (l'exercice ne use pas le genou), reprise d'activité adaptée, premiers exercices.",
        obj: [
          { id: "edu", t: "Le patient a compris l'arthrose et la règle de la douleur acceptable", p: "Tu sais comment bouger avec l'arthrose" },
          { id: "regul", t: "2 à 3 séances d'exercices par semaine", p: "Tu fais tes exercices 2 à 3 fois par semaine" }],
        exos: ["Assis-debout de chaise", "Extension de genou assis", "Pont de hanche", "Abduction couché sur le côté", "Élévation des talons", "Équilibre unipodal", "Tandem talon-pointe", "Genou qui se balance, assis sur une table", "Vélo d'appartement", "Glissement du talon couché", "Arc court du quadriceps sur un rouleau", "Mini-squat"] },
      { nom: "Renforcer et contrôler", but: "Renforcement progressif et exercices neuromusculaires (genou dans l'axe, équilibre).",
        obj: [
          { id: "sts", t: "Lever de chaise amélioré d'au moins 2 répétitions", p: "Tu te lèves plus facilement de ta chaise", a: { m: "sts30", gain: 2 } },
          { id: "marche", t: "Marche rapide 4 × 10 m plus rapide qu'au premier bilan", p: "Tu marches plus vite", a: { m: "marche40", gain: 1 } },
          { id: "dou", t: "Douleur à l'effort de 4/10 au maximum", p: "La douleur à l'effort a baissé", a: { m: "dou", max: 4 } }],
        exos: ["Step-up sur marche", "Squat ballon dans le dos contre le mur", "Squat bilatéral", "Marche latérale élastique", "Pont fessier unilatéral", "Extension de genou assis", "Unipodal yeux fermés", "Toucher en étoile unipodal", "Presse à cuisses", "Leg extension", "Marche arrière", "Fente statique", "Descente de marche sur le côté", "La chaise qui récite l'alphabet"] },
      { nom: "Autonomie", but: "Programme à faire seul, activité physique régulière (marche, vélo, natation).",
        obj: [
          { id: "auto", t: "Programme maison fait en autonomie", p: "Tu fais ton programme seul" },
          { id: "act", t: "Activité physique régulière reprise", p: "Tu bouges régulièrement" }],
        exos: ["Fente arrière", "Montée de marche avec charge", "Goblet squat", "Squat bulgare", "Marche du fermier sur place", "Se relever du sol", "Squat sur une jambe vers la chaise", "Le serveur pressé"] }
    ],
    src: ["oarsi", "nice", "glad", "fransen", "dobson"]
  };

  P.ptg = {
    nom: "Prothèse de genou", long: "Prothèse totale de genou", zone: "genou", op: 1,
    key: { m: "flex", l: "Flexion du genou" },
    mes: ["flex", "ext", "peri", "quad", "tug", "sts30", "marche40", "dou"],
    ref: "Extension de genou assis",
    notes: ["Le renforcement du quadriceps doit commencer tôt et progresser en intensité : la faiblesse du quadriceps est le principal frein à la récupération.",
            "Surveiller la cicatrice, la température du genou et le mollet (phlébite)."],
    etapes: [
      { nom: "Récupérer", but: "Extension complète, flexion, marche avec puis sans aide technique, quadriceps actif.",
        obj: [
          { id: "flex90", t: "Flexion d'au moins 90°", p: "Ton genou se plie à 90°", a: { m: "flex", min: 90 } },
          { id: "ext", t: "Déficit d'extension de 5° maximum", p: "Ton genou s'étend presque complètement", a: { m: "ext", def: 5 } },
          { id: "slr", t: "Jambe tendue levée sans décrochage", p: "Tu lèves la jambe tendue sans que le genou plie" },
          { id: "cic", t: "Cicatrice fermée, pas de signe d'infection", p: "Ta cicatrice va bien" }],
        exos: ["Extension de genou tenue", "Relevé de jambe tendue couché", "Assis-debout de chaise", "Extension de genou assis", "Pont de hanche", "Élévation des talons", "Pompe de cheville couché", "Contraction du quadriceps couché", "Glissement du talon couché", "Extension passive talon sur un rouleau", "Flexion assise, le pied recule", "Genou qui se balance, assis sur une table", "Vélo d'appartement", "Arc court du quadriceps sur un rouleau"] },
      { nom: "Renforcer", but: "Renforcement progressif et intense du quadriceps, escaliers, équilibre.",
        obj: [
          { id: "flex110", t: "Flexion d'au moins 110°", p: "Ton genou se plie à 110°", a: { m: "flex", min: 110 } },
          { id: "marche", t: "Marche sans aide technique, sans boiterie", p: "Tu marches sans canne" },
          { id: "tug", t: "Timed Up and Go en moins de 10 s", p: "Tu te lèves et marches facilement", a: { m: "tug", max: 10 } },
          { id: "esc", t: "Escaliers en alternant les pieds", p: "Tu montes les escaliers normalement" }],
        exos: ["Step-up sur marche", "Descente de marche", "Squat ballon dans le dos contre le mur", "Leg extension", "Presse à cuisses", "Marche latérale élastique", "Équilibre unipodal", "Tandem talon-pointe", "Mini-squat", "Marche arrière", "Fente statique", "Descente de marche sur le côté"] },
      { nom: "Autonomie", but: "Programme maison, activités de loisir adaptées (marche, vélo, natation, golf).",
        obj: [
          { id: "sts", t: "Lever de chaise amélioré d'au moins 2 répétitions", p: "Tu te lèves plus facilement", a: { m: "sts30", gain: 2 } },
          { id: "auto", t: "Programme maison fait en autonomie", p: "Tu fais ton programme seul" }],
        exos: ["Goblet squat", "Fente arrière", "Montée de marche avec charge", "Unipodal sur coussin", "Se relever du sol", "Squat sur une jambe vers la chaise", "Le serveur pressé"] }
    ],
    src: ["jette", "bade"]
  };

  P.lcm = {
    nom: "Entorse du ligament latéral interne", long: "Entorse du ligament collatéral médial (LLI)", zone: "genou",
    opts: [{ id: "grade", l: "Gravité", ch: [["1", "Grade 1 (bénin)"], ["2", "Grade 2 (partielle)"], ["3", "Grade 3 (rupture)"]] }],
    key: { m: "quad", lsi: 1, l: "Symétrie du quadriceps" },
    mes: ["quad", "flex", "ext", "peri", "epanch", "hop1", "yb"],
    ref: "Presse à une jambe",
    notes: ["La plupart des entorses du LLI guérissent sans chirurgie. Grade 3 ou lésion associée (LCA) : avis orthopédique.",
            "Pas de contrainte en valgus ni de rotation en charge au début ; une attelle articulée peut être prescrite pour les grades 2 et 3."],
    etapes: [
      { nom: "Protéger et calmer", but: "Amplitude, quadriceps, marche, sans valgus forcé.",
        obj: [
          { id: "ext", t: "Extension complète (déficit de 3° maximum)", p: "Ton genou s'étend complètement", a: { m: "ext", def: 3 } },
          { id: "flex", t: "Flexion d'au moins 90 % du côté sain", p: "Ton genou se plie presque comme l'autre", a: { m: "flex", lsi: 90 } },
          { id: "marche", t: "Marche sans boiterie", p: "Tu marches normalement" }],
        exos: ["Extension de genou tenue", "Relevé de jambe tendue couché", "Assis-debout de chaise", "Pont de hanche", "Élévation des talons", "Équilibre unipodal", "Contraction du quadriceps couché", "Glissement du talon couché", "Vélo d'appartement", "Mini-squat"] },
      { nom: "Renforcer", but: "Renforcement dans l'axe puis plan frontal contrôlé.",
        obj: [
          { id: "valg", t: "Pas de douleur au test en valgus à 30°", p: "Ton ligament ne fait plus mal" },
          { id: "quad80", t: "Symétrie du quadriceps d'au moins 80 %", p: "Ta cuisse a retrouvé 80 % de sa force", a: { m: "quad", lsi: 80 } },
          { id: "dou", t: "Douleur de 3/10 au maximum aux 3 dernières séances", p: "Peu ou pas de douleur pendant tes séances", a: { dou: 3 } }],
        exos: ["Squat bilatéral", "Step-up sur marche", "Presse à une jambe", "Leg extension", "Fente arrière", "Marche latérale élastique", "Unipodal sur coussin", "Pallof press", "Fente statique", "Mini-squat sur une jambe, tenu", "Descente de marche sur le côté", "Squat sur une jambe vers la chaise"] },
      { nom: "Retour au sport", but: "Course, changements de direction, sauts, puis sport.",
        obj: [
          { id: "quad90", t: "Symétrie du quadriceps d'au moins 90 %", p: "Ta cuisse a retrouvé 90 % de sa force", a: { m: "quad", lsi: 90 } },
          { id: "hop90", t: "Saut sur une jambe à au moins 90 %", p: "Tes sauts atteignent 90 % de l'autre jambe", a: { hops: 90 } },
          { id: "agil", t: "Changements de direction sans douleur ni appréhension", p: "Tu changes de direction sans crainte" }],
        exos: ["Fente latérale", "Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Pas chassés réactifs", "Planche Copenhague genou", "Sauts sur une jambe", "Réception de saut stabilisée", "Saut sur une jambe, réception tenue", "Bonds du patineur", "Le squat du cosaque"] }
    ],
    src: ["logLig", "noyes"]
  };

  P.genou = {
    nom: "Genou, sans diagnostic précis", long: "Douleur de genou sans diagnostic établi", zone: "genou",
    key: { m: "quad", lsi: 1, l: "Symétrie du quadriceps" },
    mes: ["dou", "quad", "flex", "ext", "peri", "epanch", "sts30", "yb"],
    ref: "Assis-debout de chaise",
    notes: ["Parcours général en attendant d'affiner : le guide d'orientation propose une piste à partir de l'interrogatoire et des tests.",
            "Si aucune amélioration en 4 à 6 semaines, ou si un signe d'alerte apparaît : réorienter vers le médecin."],
    etapes: [
      { nom: "Calmer et comprendre", but: "Adapter les activités, exercices dans l'amplitude et la douleur tolérées.",
        obj: [
          { id: "alerte", t: "Signes d'alerte écartés", p: "Ton kiné a vérifié qu'il n'y a pas de signe inquiétant" },
          { id: "dou5", t: "Douleur à l'effort de 5/10 au maximum", p: "La douleur à l'effort a baissé", a: { m: "dou", max: 5 } },
          { id: "edu", t: "Le patient sait quelles activités adapter", p: "Tu sais quoi adapter au quotidien" }],
        exos: ["Extension de genou tenue", "Chaise contre le mur", "Assis-debout de chaise", "Pont de hanche", "Clamshell", "Élévation des talons", "Équilibre unipodal", "Contraction du quadriceps couché", "Glissement du talon couché", "Genou qui se balance, assis sur une table", "Vélo d'appartement", "Mini-squat", "Marche arrière"] },
      { nom: "Renforcer progressivement", but: "Renforcement du quadriceps et de la hanche, contrôle du genou dans l'axe.",
        obj: [
          { id: "dou3", t: "Douleur à l'effort de 3/10 au maximum", p: "Peu de douleur à l'effort", a: { m: "dou", max: 3 } },
          { id: "quad80", t: "Symétrie du quadriceps d'au moins 80 %", p: "Ta cuisse a retrouvé 80 % de sa force", a: { m: "quad", lsi: 80 } },
          { id: "sls", t: "Squat sur une jambe contrôlé", p: "Tu fais un squat sur une jambe bien contrôlé" }],
        exos: ["Squat bilatéral", "Step-up sur marche", "Descente de marche", "Marche latérale élastique", "Pont fessier unilatéral", "Presse à cuisses", "Leg extension", "Unipodal sur coussin", "Fente statique", "Descente de marche sur le côté", "Mini-squat sur une jambe, tenu", "Pont des ischios, talons loin", "La chaise qui récite l'alphabet", "La marche du canard"] },
      { nom: "Reprendre les activités", but: "Retour progressif aux activités et au sport.",
        obj: [
          { id: "quad90", t: "Symétrie du quadriceps d'au moins 90 %", p: "Ta cuisse a retrouvé 90 % de sa force", a: { m: "quad", lsi: 90 } },
          { id: "activ", t: "Activités reprises sans douleur gênante", p: "Tu as repris tes activités" }],
        exos: ["Squat bulgare", "Fente avec charge", "Fente latérale", "Petits sauts sur place", "Avion sur une jambe", "Squat sur une jambe vers la chaise", "Réception de saut stabilisée", "Saut sur la marche", "Le kangourou", "Le serveur pressé", "Le squat du cosaque"] }
    ],
    src: ["logMen", "willy", "oarsi"]
  };

  var ORDER = ["genou", "lca_op", "lca_cons", "menisectomie", "suture_men", "sfp", "tendino_rot", "gonarthrose", "ptg", "lcm"];

  /* ════════ Calculs ════════ */
  function num(v) { if (v == null || v === "") return null; var n = +String(v).replace(",", "."); return isFinite(n) ? n : null; }
  // Valeur retenue d'une mesure : meilleur des essais (ou plus petit si « plus petit = mieux »)
  function best(mid, arr) {
    if (!Array.isArray(arr)) return num(arr);
    var v = arr.map(num).filter(function (x) { return x != null; });
    if (!v.length) return null;
    return M[mid] && M[mid].lo ? Math.min.apply(null, v) : Math.max.apply(null, v);
  }
  function val(b, mid, side) { var r = b && b.m && b.m[mid]; if (!r) return null; return best(mid, side === "s" ? r.s : r.a); }
  function lsi(b, mid) {
    var a = val(b, mid, "a"), s = val(b, mid, "s");
    if (a == null || s == null || !a || !s) return null;
    return Math.round((M[mid] && M[mid].lo ? s / a : a / s) * 100);
  }
  // Dernière valeur connue d'une mesure dans l'historique des bilans (plus récent en premier)
  function lastWith(bilans, mid) { for (var i = 0; i < bilans.length; i++) if (val(bilans[i], mid, "a") != null) return bilans[i]; return null; }
  function firstWith(bilans, mid) { for (var i = bilans.length - 1; i >= 0; i--) if (val(bilans[i], mid, "a") != null) return bilans[i]; return null; }
  function days(from) { if (!from) return null; var p = String(from).split("-"); return Math.floor((Date.now() - new Date(+p[0], +p[1] - 1, +p[2]).getTime()) / 86400000); }

  /* Évalue un objectif calculé : { ok: true/false/null (pas de mesure), v: texte de la valeur } */
  function evalObj(a, ctx) {
    if (!a) return null;
    var B = ctx.bilans || [];
    if (a.j != null) { var d = days(ctx.date0); return d == null ? { ok: null, v: "date à renseigner" } : { ok: d >= a.j, v: Math.floor(d / 7) + " sem." }; }
    if (a.dou != null) {
      var ss = (ctx.seances || []).filter(function (s) { return s.dou != null && s.dou !== ""; }).slice(0, 3);
      if (ss.length < 2) return { ok: null, v: "2 séances à noter" };
      var mx = Math.max.apply(null, ss.map(function (s) { return +s.dou; }));
      return { ok: mx <= a.dou, v: "max " + mx + "/10" };
    }
    if (a.hops != null) {
      var b0 = B[0] ? B : [];
      var got = ["hop1", "hop3", "hop6"].map(function (h) { var bb = lastWith(b0, h); return bb ? lsi(bb, h) : null; }).filter(function (x) { return x != null; });
      if (!got.length) return { ok: null, v: "à mesurer" };
      var mn = Math.min.apply(null, got);
      return { ok: mn >= a.hops, v: mn + " %" };
    }
    var b = lastWith(B, a.m); if (!b) return { ok: null, v: "à mesurer" };
    var va = val(b, a.m, "a"), vs = val(b, a.m, "s"), u = M[a.m] && M[a.m].u ? M[a.m].u : "", sp = u === "°" ? "" : " ";
    if (a.lsi != null) { var l = lsi(b, a.m); return l == null ? { ok: null, v: "côté sain à mesurer" } : { ok: l >= a.lsi, v: l + " %" }; }
    if (a.def != null) { var ref = vs != null ? vs : 0, df = Math.max(0, ref - va); return { ok: df <= a.def, v: "déficit " + fmt(df) + "°" }; }
    if (a.diff != null) { if (vs == null) return { ok: null, v: "côté sain à mesurer" }; var dd = Math.abs(va - vs); return { ok: dd <= a.diff, v: "écart " + fmt(dd) + sp + u }; }
    if (a.gain != null) {
      var f = firstWith(B, a.m); if (!f || f === b) return { ok: null, v: "2 bilans nécessaires" };
      var g = val(b, a.m, "a") - val(f, a.m, "a"); if (M[a.m].lo) g = -g;
      return { ok: g >= a.gain, v: (g >= 0 ? "+" : "") + fmt(g) + sp + u };
    }
    if (a.min != null) return { ok: va >= a.min, v: fmt(va) + sp + u };
    if (a.max != null) {
      if (M[a.m].ch) return { ok: va <= a.max, v: M[a.m].ch[va] || "" };
      return { ok: va <= a.max, v: fmt(va) + sp + u };
    }
    return null;
  }
  function fmt(n) { if (n == null) return "–"; var r = Math.round(n * 10) / 10; return String(r).replace(".", ","); }

  // Exercices proposés pour une étape, en tenant compte des options du patient
  function exos(pid, i, opts) {
    var p = P[pid], e = p && p.etapes[i]; if (!e) return [];
    opts = opts || {};
    return e.exos.filter(function (x) {
      if (typeof x === "string") return true;
      if (x.sauf) return !Object.keys(x.sauf).some(function (k) { return opts[k] === x.sauf[k]; });
      return true;
    }).map(function (x) { return typeof x === "string" ? x : x.n; });
  }

  /* ════════ Guide d'orientation : genou sans diagnostic ════════
     Le kiné coche ce qu'il observe ; le guide propose des pistes classées, avec leurs raisons.
     C'est une aide au raisonnement, pas un diagnostic. */
  var GUIDE = {
    alertes: [
      { id: "ottawa", t: "Traumatisme récent + au moins un critère d'Ottawa : 55 ans ou plus, douleur isolée de la rotule, douleur de la tête du péroné, flexion impossible à 90°, incapable de faire 4 pas", d: "Radiographie avant de poursuivre (règle d'Ottawa du genou).", s: "stiell" },
      { id: "infect", t: "Genou chaud, rouge, gonflé avec fièvre", d: "Suspicion d'arthrite septique : avis médical le jour même." },
      { id: "tvp", t: "Mollet douloureux, gonflé ou chaud", d: "Suspicion de phlébite : avis médical rapide." },
      { id: "blocage", t: "Blocage vrai : extension impossible", d: "Avis orthopédique rapide (anse de seau méniscale possible)." },
      { id: "nuit", t: "Douleur nocturne non mécanique, perte de poids, antécédent de cancer", d: "Avis médical." },
      { id: "enfant", t: "Enfant ou adolescent avec boiterie et douleur du genou", d: "Penser à la hanche (épiphysiolyse) : examen de la hanche et avis médical." }
    ],
    q: [
      { id: "trauma", t: "Début", ch: [["pivot", "Traumatisme en pivot ou réception de saut"], ["choc", "Choc direct ou valgus forcé"], ["progressif", "Progressif, sans traumatisme"]] },
      { id: "age", t: "Âge", ch: [["jeune", "Moins de 30 ans"], ["moyen", "30 à 44 ans"], ["45", "45 ans ou plus"]] },
      { id: "zone", t: "Où est la douleur", ch: [["ant", "Autour ou derrière la rotule"], ["pointe", "Sous la pointe de la rotule"], ["int", "Interligne interne"], ["ext", "Interligne externe"], ["lli", "Face interne, au-dessus ou sous l'interligne"], ["diffuse", "Diffuse"]] },
      { id: "signes", t: "Ce que le patient décrit", multi: 1, ch: [["pop", "Craquement entendu ou ressenti"], ["hemar", "Gonflement dans les 2 heures"], ["gonfl", "Gonflement plus tardif ou intermittent"], ["dero", "Dérobements"], ["accroch", "Accrochages, sensation de blocage passager"], ["escaliers", "Douleur aux escaliers, au squat, assis longtemps"], ["saut", "Douleur aux sauts et à l'impulsion"], ["raideur", "Raideur matinale de 30 min au maximum"], ["effort", "Douleur liée à l'activité"]] },
      { id: "tests", t: "Tests positifs", multi: 1, ch: [["lachman", "Lachman"], ["pivotshift", "Pivot shift"], ["valgus", "Douleur ou laxité en valgus à 30°"], ["interligne", "Douleur à la palpation de l'interligne"], ["mcmurray", "McMurray ou Thessaly"], ["tendon", "Palpation douloureuse du tendon rotulien"], ["declive", "Squat déclive douloureux au tendon"], ["crepit", "Crépitements"]] }
    ]
  };
  /* Description des tests cliniques (appui long dans le guide) */
  var TESTS = {
    lachman: { n: "Test de Lachman", how: "Patient sur le dos, genou fléchi à 20-30°. Une main stabilise la cuisse, l'autre tire le haut du tibia vers l'avant. Comparer au côté sain.",
      pos: "Translation antérieure du tibia plus grande que du côté sain, avec un arrêt mou ou absent.", neg: "Translation symétrique avec un arrêt dur.",
      val: "Test clinique le plus sensible de la rupture du LCA (sensibilité de l'ordre de 85 %, spécificité de l'ordre de 94 %). Moins fiable sur un genou très gonflé ou douloureux : le refaire à distance.", src: "benj" },
    pivotshift: { n: "Pivot shift (ressaut rotatoire)", how: "Patient sur le dos, genou en extension. Rotation interne du tibia et contrainte en valgus, puis flexion progressive du genou.",
      pos: "Ressaut perçu vers 20 à 40° de flexion : le tibia subluxé se réduit.", neg: "Aucun ressaut.",
      val: "Très spécifique (de l'ordre de 98 %) mais peu sensible chez le patient éveillé (de l'ordre de 24 %) : positif, il confirme presque ; négatif, il n'exclut rien (défense musculaire).", src: "benj" },
    valgus: { n: "Contrainte en valgus à 30°", how: "Patient sur le dos, genou fléchi à 30°. Une main à la face externe du genou, l'autre pousse la cheville vers l'extérieur. Refaire genou en extension complète.",
      pos: "Douleur sur le trajet du ligament latéral interne et/ou bâillement interne plus grand que du côté sain.", neg: "Ni douleur ni laxité.",
      val: "Grade 1 : douleur sans laxité. Grade 2 : laxité avec un arrêt. Grade 3 : laxité sans arrêt net. Laxité aussi en extension complète : penser à une lésion associée (LCA, point d'angle postéro-interne).", src: "logLig" },
    interligne: { n: "Palpation de l'interligne", how: "Genou fléchi à 90°, palper l'interligne articulaire interne puis externe, d'avant en arrière.",
      pos: "Douleur qui reproduit la douleur du patient sur l'interligne.", neg: "Palpation indolore.",
      val: "Assez sensible pour une lésion méniscale mais peu spécifique (arthrose, ligament latéral interne). Utile en association avec l'interrogatoire et les autres tests.", src: "decary" },
    mcmurray: { n: "McMurray ou Thessaly", how: "McMurray : genou en flexion maximale, rotation du tibia (externe pour le ménisque interne, interne pour l'externe), puis extension progressive. Thessaly : debout sur la jambe atteinte, genou fléchi à 20°, le patient tourne le corps trois fois de chaque côté, mains tenues par le kiné.",
      pos: "Claquement douloureux, douleur de l'interligne, sensation d'accrochage ou de blocage.", neg: "Ni douleur de l'interligne ni accrochage.",
      val: "Valeur modeste quand le test est utilisé seul. L'association d'éléments de l'histoire (torsion, accrochages, gonflement retardé) et de plusieurs signes d'examen est plus informative.", src: "decary" },
    tendon: { n: "Palpation du tendon rotulien", how: "Genou en extension, quadriceps relâché. Palper le tendon rotulien, surtout au bord inférieur de la rotule.",
      pos: "Douleur localisée qui reproduit la douleur habituelle du patient.", neg: "Palpation indolore.",
      val: "Sensible mais peu spécifique : la palpation est souvent sensible chez des sportifs sans douleur. À associer à une douleur liée à la charge (sauts, impulsion).", src: "malliaras" },
    declive: { n: "Squat déclive sur une jambe", how: "Debout sur la jambe atteinte sur un plan incliné à 25°, descendre en squat jusqu'à environ 60° de flexion.",
      pos: "Douleur localisée au tendon rotulien, sous la pointe de la rotule.", neg: "Pas de douleur au tendon.",
      val: "Test de charge du tendon. Sert aussi à suivre l'évolution : noter la douleur de 0 à 10 à chaque bilan.", src: "malliaras" },
    crepit: { n: "Crépitements", how: "Palper le genou pendant la flexion-extension active ou passive.",
      pos: "Crépitations ou craquements palpables.", neg: "Mouvement fluide, sans crépitation.",
      val: "Signe d'appoint de l'arthrose, à associer à l'âge, à la douleur liée à l'activité et à la raideur matinale courte. Peu spécifique isolé.", src: "nice" }
  };

  function guide(ans) {
    ans = ans || {};
    var has = function (k, v) { var x = ans[k]; return Array.isArray(x) ? x.indexOf(v) >= 0 : x === v; };
    var R = {
      lca_cons: { s: 0, why: [] }, sfp: { s: 0, why: [] }, tendino_rot: { s: 0, why: [] },
      gonarthrose: { s: 0, why: [] }, lcm: { s: 0, why: [] }, menisque: { s: 0, why: [] }
    };
    function add(k, n, w) { R[k].s += n; R[k].why.push(w); }
    // LCA : mécanisme en pivot, craquement, hémarthrose rapide, Lachman (Benjaminse 2006 ; Décary 2018)
    if (has("trauma", "pivot")) add("lca_cons", 2, "mécanisme en pivot");
    if (has("signes", "pop")) add("lca_cons", 2, "craquement");
    if (has("signes", "hemar")) add("lca_cons", 3, "gonflement rapide (hémarthrose)");
    if (has("signes", "dero")) add("lca_cons", 2, "dérobements");
    if (has("tests", "lachman")) add("lca_cons", 4, "Lachman positif");
    if (has("tests", "pivotshift")) add("lca_cons", 4, "pivot shift positif (très spécifique)");
    // Ménisque
    if (has("trauma", "pivot")) add("menisque", 1, "torsion du genou");
    if (has("signes", "accroch")) add("menisque", 2, "accrochages");
    if (has("signes", "gonfl")) add("menisque", 1, "gonflement retardé");
    if (has("zone", "int") || has("zone", "ext")) add("menisque", 2, "douleur de l'interligne");
    if (has("tests", "interligne")) add("menisque", 2, "palpation de l'interligne douloureuse");
    if (has("tests", "mcmurray")) add("menisque", 2, "McMurray ou Thessaly positif");
    // LLI
    if (has("trauma", "choc")) add("lcm", 3, "valgus forcé ou choc");
    if (has("zone", "lli")) add("lcm", 2, "douleur face interne");
    if (has("tests", "valgus")) add("lcm", 4, "test en valgus positif");
    // Fémoro-patellaire
    if (has("trauma", "progressif")) { add("sfp", 1, "début progressif"); add("tendino_rot", 1, "début progressif"); add("gonarthrose", 1, "début progressif"); }
    if (has("zone", "ant")) add("sfp", 3, "douleur autour de la rotule");
    if (has("signes", "escaliers")) add("sfp", 3, "douleur aux escaliers, squat, position assise");
    if (has("age", "jeune") || has("age", "moyen")) add("sfp", 1, "âge plutôt jeune");
    // Tendinopathie rotulienne
    if (has("zone", "pointe")) add("tendino_rot", 3, "douleur sous la pointe de la rotule");
    if (has("signes", "saut")) add("tendino_rot", 2, "douleur à l'impulsion");
    if (has("tests", "tendon")) add("tendino_rot", 2, "palpation du tendon douloureuse");
    if (has("tests", "declive")) add("tendino_rot", 3, "squat déclive douloureux");
    // Arthrose : critères cliniques NICE (45 ans ou plus, douleur à l'activité, raideur matinale courte)
    if (has("age", "45")) add("gonarthrose", 3, "45 ans ou plus");
    if (has("signes", "effort")) add("gonarthrose", 2, "douleur à l'activité");
    if (has("signes", "raideur")) add("gonarthrose", 2, "raideur matinale courte");
    if (has("tests", "crepit")) add("gonarthrose", 1, "crépitements");
    if (has("age", "45") && (has("zone", "int") || has("tests", "mcmurray"))) add("menisque", -1, "après 45 ans, lésion méniscale souvent dégénérative");
    var NAME = { lca_cons: "Lésion du LCA", menisque: "Lésion méniscale", lcm: "Entorse du ligament latéral interne", sfp: "Syndrome fémoro-patellaire", tendino_rot: "Tendinopathie rotulienne", gonarthrose: "Arthrose du genou" };
    var PATH = { lca_cons: "lca_cons", menisque: "menisectomie", lcm: "lcm", sfp: "sfp", tendino_rot: "tendino_rot", gonarthrose: "gonarthrose" };
    var NOTE = {
      lca_cons: "À confirmer par le médecin (IRM). Lachman : test clinique le plus sensible ; pivot shift : le plus spécifique.",
      menisque: "Aucun test isolé n'est fiable : c'est l'association interrogatoire et examen qui compte. Lésion dégénérative sans blocage : rééducation en premier.",
      lcm: "Grade selon la laxité en valgus à 30°. Laxité aussi en extension complète : penser à une lésion associée (LCA, point d'angle).",
      sfp: "Diagnostic clinique : douleur autour de la rotule reproduite par le squat, les escaliers ou la position assise prolongée, après exclusion des autres causes.",
      tendino_rot: "Douleur localisée au tendon, liée à la charge, qui augmente avec la vitesse et la hauteur des sauts.",
      gonarthrose: "Diagnostic clinique possible sans imagerie (NICE) : 45 ans ou plus, douleur liée à l'activité, raideur matinale de 30 min au maximum."
    };
    var out = Object.keys(R).filter(function (k) { return R[k].s >= 3; }).sort(function (a, b) { return R[b].s - R[a].s; }).map(function (k) {
      return { id: k, nom: NAME[k], parcours: PATH[k], score: R[k].s, why: R[k].why.filter(function (w, i, a) { return a.indexOf(w) === i; }), note: NOTE[k] };
    });
    var alert = (ans.alertes || []).map(function (id) { return GUIDE.alertes.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    return { alertes: alert, pistes: out };
  }

  return {
    M: M, P: P, ORDER: ORDER, SRC: SRC, ALERTES: ALERTES_GENOU, GUIDE: GUIDE, TESTS: TESTS,
    get: function (id) { return P[id] || null; },
    list: function () { return ORDER.map(function (id) { return { id: id, nom: P[id].nom }; }); },
    best: best, val: val, lsi: lsi, lastWith: lastWith, firstWith: firstWith, evalObj: evalObj, exos: exos, guide: guide, fmt: fmt, days: days
  };
})();
