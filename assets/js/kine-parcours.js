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
    quad:   { l: "Force du quadriceps", c: "Quadri", u: "kg", s: 1, n: 3, g: "Force", how: "Assis, genou fléchi à 60°, dynamomètre à la cheville, 3 essais de 5 s, on garde le meilleur. Toujours la même position." },
    ischio: { l: "Force des ischio-jambiers", u: "kg", s: 1, n: 3, g: "Force", how: "Assis, genou fléchi à 60°, dynamomètre derrière la cheville, 3 essais de 5 s." },
    abd:    { l: "Force des abducteurs de hanche", u: "kg", s: 1, n: 3, g: "Force", how: "Couché sur le côté, dynamomètre au-dessus de la malléole externe, 3 essais de 5 s." },
    flex:   { l: "Flexion du genou", c: "Flexion", u: "°", s: 1, incl: 1, g: "Amplitude", how: "Couché sur le dos, talon qui glisse vers la fesse. Au téléphone : posé sur la cuisse puis sur le tibia." },
    ext:    { l: "Extension du genou", c: "Extension", u: "°", s: 1, incl: 1, g: "Amplitude", how: "0 = extension complète, valeur négative = déficit (−5 = il manque 5°), positive = hyperextension." },
    peri:   { l: "Périmètre au milieu de la rotule", u: "cm", s: 1, g: "Périmètre", how: "Mètre ruban au milieu de la rotule, genou tendu et détendu. Reflète l'épanchement." },
    cuisse: { l: "Périmètre de la cuisse (15 cm au-dessus de la rotule)", u: "cm", s: 1, g: "Périmètre", how: "Repère pris depuis la pointe de la rotule. Reflète la fonte musculaire." },
    epanch: { l: "Épanchement (test du balayage)", ch: ["Aucun", "Traces", "1+", "2+", "3+"], g: "Périmètre", how: "Balayage de bas en haut du côté interne puis du côté externe : on observe la vague de liquide." },
    hop1:   { l: "Saut sur une jambe, en distance", c: "Saut", u: "cm", s: 1, n: 3, g: "Fonction", how: "Départ et réception sur la même jambe, réception tenue 2 s. Meilleur de 3 essais." },
    hop3:   { l: "Triple saut sur une jambe", u: "cm", s: 1, n: 3, g: "Fonction", how: "Trois sauts enchaînés sur la même jambe, réception tenue." },
    hop6:   { l: "6 m à cloche-pied, chronométré", u: "s", s: 1, n: 3, lo: 1, g: "Fonction", how: "6 mètres le plus vite possible sur une jambe." },
    yb:     { l: "Y-balance, direction antérieure", u: "cm", s: 1, n: 3, g: "Fonction", how: "Debout sur une jambe, l'autre pied pousse le plus loin possible vers l'avant sans perdre l'équilibre." },
    sts30:  { l: "Lever de chaise en 30 s", c: "Lever de chaise", u: "fois", g: "Fonction", how: "Chaise de 43 cm environ, bras croisés : nombre de levers complets en 30 secondes." },
    tug:    { l: "Timed Up and Go", u: "s", lo: 1, g: "Fonction", how: "Se lever, marcher 3 m, faire demi-tour, revenir s'asseoir, à vitesse habituelle." },
    marche40:{ l: "Marche rapide 4 × 10 m", u: "s", lo: 1, g: "Fonction", how: "40 m au total en 4 allers-retours de 10 m, vite mais en sécurité." },
    sldec:  { l: "Douleur au squat déclive sur une jambe", u: "/10", lo: 1, g: "Douleur", how: "Squat sur une jambe sur un plan incliné à 25°, jusqu'à 60° de flexion : douleur de 0 à 10." },
    dou:    { l: "Douleur à l'effort", c: "Douleur", u: "/10", lo: 1, g: "Douleur", how: "Douleur la plus forte pendant les activités de la semaine, de 0 à 10." },
    visap:  { l: "Score VISA-P", c: "VISA-P", u: "/100", g: "Questionnaire", how: "Questionnaire de la tendinopathie rotulienne : 100 = aucune gêne." },
    akps:   { l: "Score de Kujala (AKPS)", c: "Kujala", u: "/100", g: "Questionnaire", how: "Questionnaire de la douleur antérieure du genou : 100 = aucune gêne." },
    aclrsi: { l: "Score ACL-RSI", u: "/100", g: "Questionnaire", how: "Confiance psychologique pour reprendre le sport après une lésion du LCA." },
    koos:   { l: "KOOS, sous-score Douleur", u: "/100", g: "Questionnaire", how: "100 = aucune douleur." },
    /* cheville et pied */
    dfl:    { l: "Fente contre le mur (distance orteil-mur)", u: "cm", s: 1, n: 3, g: "Amplitude", c: "Fente au mur", how: "Pied face au mur, le genou vient toucher le mur sans que le talon décolle : on recule le pied jusqu'à la plus grande distance possible. Repère : moins de 9 à 10 cm, ou plus de 2 cm d'écart avec l'autre côté, est limitant." },
    dfa:    { l: "Flexion dorsale en charge (angle du tibia)", u: "°", s: 1, incl: 2, g: "Amplitude", c: "Flexion dorsale", how: "Même fente contre le mur, à la distance maximale : angle du tibia avec la verticale. Au téléphone : posé à plat sur l'avant du tibia, le haut du téléphone vers le genou." },
    atra:   { l: "Angle de repos du tendon d'Achille (ATRA)", u: "°", s: 1, g: "Amplitude", c: "ATRA", how: "À plat ventre, genou fléchi à 90°, cheville détendue : angle de flexion plantaire de la cheville, en degrés. Plus petit que du côté sain : le tendon est plus long." },
    fig8:   { l: "Périmètre en huit de la cheville", u: "cm", s: 1, g: "Périmètre", c: "Œdème", how: "Mètre ruban en huit : malléole externe, sous la voûte, malléole interne, puis devant le cou-de-pied. Reflète l'œdème." },
    heel:   { l: "Élévations du talon sur une jambe", u: "fois", s: 1, g: "Force", c: "Talons", how: "Sur une jambe, genou tendu, bout des doigts au mur, une montée par seconde environ, le plus haut possible, jusqu'à la fatigue ou la perte de hauteur. Repère : environ 25 chez l'adulte." },
    heelh:  { l: "Hauteur de l'élévation du talon", u: "cm", s: 1, g: "Force", c: "Hauteur du talon", how: "Hauteur maximale du talon en montant sur la pointe d'un pied (règle contre le talon). Après une rupture d'Achille, l'écart de hauteur reflète l'allongement du tendon." },
    hopside:{ l: "Side hop test", u: "s", s: 1, lo: 1, g: "Fonction", c: "Side hop", how: "Sur une jambe, 10 allers-retours par-dessus deux lignes espacées de 30 cm, le plus vite possible." },
    dmat:   { l: "Douleur aux premiers pas du matin", u: "/10", lo: 1, g: "Douleur", c: "Premiers pas", how: "Douleur sous le talon aux premiers pas du lever, de 0 à 10." },
    cait:   { l: "Score CAIT (instabilité de cheville)", u: "/30", g: "Questionnaire", c: "CAIT", how: "Cumberland Ankle Instability Tool : 30 = cheville stable. 25 ou moins : instabilité probable." },
    faam:   { l: "FAAM, activités quotidiennes", u: "%", g: "Questionnaire", c: "FAAM", how: "Foot and Ankle Ability Measure, sous-score des activités de la vie quotidienne : 100 % = aucune gêne." },
    visaa:  { l: "Score VISA-A", u: "/100", g: "Questionnaire", c: "VISA-A", how: "Questionnaire de la tendinopathie d'Achille : 100 = aucune gêne." },
    atrs:   { l: "Score ATRS", u: "/100", g: "Questionnaire", c: "ATRS", how: "Achilles tendon Total Rupture Score : 100 = aucune gêne." },
    omas:   { l: "Score OMAS (Olerud-Molander)", u: "/100", g: "Questionnaire", c: "OMAS", how: "Score fonctionnel après une fracture de cheville : 100 = aucune gêne." },
    /* épaule : incl 3 = téléphone posé dans la longueur du segment (angle avec la verticale, accéléromètre) */
    fle:    { l: "Élévation du bras (flexion)", u: "°", s: 1, incl: 3, iref: "down", g: "Amplitude", c: "Élévation", how: "Debout, dos droit, le bras monte devant le plus haut possible, coude tendu. Au téléphone : posé contre le bras, dans sa longueur, le haut vers le coude.", ph: "Pose le téléphone contre le <b>bras</b>, dans sa longueur, <b>le haut du téléphone vers le coude</b>. Le patient lève le bras devant lui le plus haut possible, coude tendu." },
    abd:    { l: "Abduction du bras", u: "°", s: 1, incl: 3, iref: "down", g: "Amplitude", c: "Abduction", how: "Debout, le bras monte sur le côté le plus haut possible, coude tendu. Au téléphone : posé contre le bras, dans sa longueur, le haut vers le coude.", ph: "Pose le téléphone contre le <b>bras</b>, dans sa longueur, <b>le haut du téléphone vers le coude</b>. Le patient lève le bras sur le côté le plus haut possible." },
    re1:    { l: "Rotation externe, coude au corps", u: "°", s: 1, g: "Amplitude", c: "Rotation externe", how: "Coude collé au corps, fléchi à 90° : l'avant-bras tourne vers l'extérieur. Goniomètre. Repère clé de la capsulite rétractile." },
    re90:   { l: "Rotation externe, bras écarté à 90°", u: "°", s: 1, incl: 3, iref: "up", g: "Amplitude", c: "Rotation externe à 90°", how: "Couché sur le dos, bras écarté à 90°, coude à 90° : l'avant-bras bascule vers l'arrière. Au téléphone : contre l'avant-bras, le haut vers la main.", ph: "Couché sur le dos, bras écarté à 90°, coude plié à 90°. Pose le téléphone contre l'<b>avant-bras</b>, dans sa longueur, <b>le haut vers la main</b> : 0° quand l'avant-bras est vertical." },
    fRE:    { l: "Force des rotateurs externes", u: "kg", s: 1, n: 3, g: "Force", c: "Rotateurs externes", how: "Assis, coude au corps fléchi à 90°, dynamomètre sur la face externe du poignet, 3 essais de 5 s." },
    fElev:  { l: "Force en élévation (bras à 90°)", u: "kg", s: 1, n: 3, g: "Force", c: "Force en élévation", how: "Debout, bras à 90° dans le plan de l'omoplate (30° en avant), pouce vers le haut, dynamomètre au poignet, 3 essais de 5 s." },
    ckc:    { l: "CKCUEST (appui sur les mains)", u: "touches", g: "Fonction", c: "CKCUEST", how: "En position de pompe (sur les genoux si besoin), mains écartées de 91 cm : toucher la main d'appui avec l'autre main, en alternant, le plus de fois possible en 15 s. Meilleur de 3 essais." },
    dnu:    { l: "Douleur la nuit", u: "/10", lo: 1, g: "Douleur", c: "Nuit", how: "Douleur la plus forte la nuit cette semaine, de 0 à 10." },
    /* remplis par le patient (questionnaires envoyés depuis le bilan) */
    sane:   { l: "Note globale (SANE)", u: "/100", g: "Questionnaire", c: "Note globale", how: "Le patient note son articulation de 0 à 100, 100 étant une articulation normale. Envoyé et rempli sur son téléphone." },
    psfs:   { l: "Activités choisies (PSFS)", u: "/10", g: "Questionnaire", c: "Activités", how: "Le patient choisit jusqu'à 3 activités difficiles à cause de son problème et note chacune de 0 (impossible) à 10 (comme avant) : score = moyenne. Envoyé et rempli sur son téléphone." },
    groc:   { l: "Impression globale de changement", u: "", g: "Questionnaire", c: "Changement", how: "De −3 (beaucoup moins bien) à +3 (beaucoup mieux) depuis le début de la rééducation. Envoyé et rempli sur son téléphone." }
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
    decary: "Décary S et al. Diagnostic validity of combining history elements and physical examination tests for traumatic and non-traumatic knee disorders. Br J Sports Med 2018.",
    martinLAS: "Martin RL et al. Ankle stability and movement coordination impairments: lateral ankle ligament sprains, revision 2021. J Orthop Sports Phys Ther 2021.",
    vuurberg: "Vuurberg G et al. Diagnosis, treatment and prevention of ankle sprains: update of an evidence-based clinical guideline. Br J Sports Med 2018.",
    doherty: "Doherty C et al. Treatment and prevention of acute and recurrent ankle sprain: an overview of systematic reviews with meta-analysis. Br J Sports Med 2017.",
    dubois: "Dubois B, Esculier JF. Soft-tissue injuries simply need PEACE and LOVE. Br J Sports Med 2020.",
    hupperets: "Hupperets MDW et al. Effect of unsupervised home based proprioceptive training on recurrences of ankle sprain: randomised controlled trial. BMJ 2009.",
    stiellA: "Stiell IG et al. A study to develop clinical decision rules for the use of radiography in acute ankle injuries (Ottawa ankle rules). Ann Emerg Med 1992.",
    gribble: "Gribble PA et al. Selection criteria for patients with chronic ankle instability in controlled research: a position statement of the International Ankle Consortium. J Orthop Sports Phys Ther 2013.",
    hiller: "Hiller CE et al. The Cumberland Ankle Instability Tool: a report of validity and reliability testing. Arch Phys Med Rehabil 2006.",
    caffrey: "Caffrey E et al. The ability of 4 single-limb hopping tests to detect functional performance deficits in individuals with functional ankle instability. J Orthop Sports Phys Ther 2009.",
    croy: "Croy T et al. Anterior talocrural joint laxity: diagnostic accuracy of the anterior drawer test of the ankle. J Orthop Sports Phys Ther 2013.",
    sman: "Sman AD et al. Diagnostic accuracy of clinical tests for diagnosis of ankle syndesmosis injury: a systematic review. Br J Sports Med 2013.",
    martinAch: "Martin RL et al. Achilles pain, stiffness, and muscle power deficits: midportion Achilles tendinopathy, revision 2018. J Orthop Sports Phys Ther 2018.",
    beyer: "Beyer R et al. Heavy slow resistance versus eccentric training as treatment for Achilles tendinopathy: a randomized controlled trial. Am J Sports Med 2015.",
    alfredson: "Alfredson H et al. Heavy-load eccentric calf muscle training for the treatment of chronic Achilles tendinosis. Am J Sports Med 1998.",
    robinson: "Robinson JM et al. The VISA-A questionnaire: a valid and reliable index of the clinical severity of Achilles tendinopathy. Br J Sports Med 2001.",
    maffulli: "Maffulli N. The clinical diagnosis of subcutaneous tear of the Achilles tendon: a prospective study in 174 patients. Am J Sports Med 1998.",
    willits: "Willits K et al. Operative versus nonoperative treatment of acute Achilles tendon ruptures: a multicenter randomized trial using accelerated functional rehabilitation. J Bone Joint Surg Am 2010.",
    ochen: "Ochen Y et al. Operative treatment versus nonoperative treatment of Achilles tendon ruptures: systematic review and meta-analysis. BMJ 2019.",
    carmont: "Carmont MR et al. Reliability of Achilles tendon resting angle and calf circumference measurement techniques. Foot Ankle Surg 2013.",
    nilsson: "Nilsson-Helander K et al. The Achilles tendon Total Rupture Score (ATRS): development and validation. Am J Sports Med 2007.",
    hebert: "Hébert-Losier K et al. Updated reliability and normative values for the standing heel-rise test in healthy adults. Physiotherapy 2017.",
    koc: "Koc TA Jr et al. Heel pain – plantar fasciitis: revision 2023. J Orthop Sports Phys Ther 2023.",
    morrissey: "Morrissey D et al. Management of plantar heel pain: a best practice guide informed by a systematic review, expert clinical reasoning and patient values. Br J Sports Med 2021.",
    rathleff: "Rathleff MS et al. High-load strength training improves outcome in patients with plantar fasciitis: a randomized controlled trial with 12-month follow-up. Scand J Med Sci Sports 2015.",
    digiovanni: "DiGiovanni BF et al. Tissue-specific plantar fascia-stretching exercise enhances outcomes in patients with chronic heel pain. J Bone Joint Surg Am 2003.",
    degarceau: "De Garceau D et al. The association between diagnosis of plantar fasciitis and Windlass test results. Foot Ankle Int 2003.",
    linFx: "Lin CWC et al. Rehabilitation for ankle fractures in adults. Cochrane Database Syst Rev 2012.",
    olerud: "Olerud C, Molander H. A scoring scale for symptom evaluation after ankle fracture. Arch Orthop Trauma Surg 1984.",
    bennell: "Bennell KL et al. Intra-rater and inter-rater reliability of a weight-bearing lunge measure of ankle dorsiflexion. Aust J Physiother 1998.",
    diercks: "Diercks R et al. Guideline for diagnosis and treatment of subacromial pain syndrome: a multidisciplinary review by the Dutch Orthopaedic Association. Acta Orthop 2014.",
    littlewood: "Littlewood C et al. Exercise for rotator cuff tendinopathy: a systematic review. Physiotherapy 2012.",
    lewis16: "Lewis J. Rotator cuff related shoulder pain: assessment, management and uncertainties. Man Ther 2016.",
    beard: "Beard DJ et al. Arthroscopic subacromial decompression for subacromial shoulder pain (CSAW): a multicentre, pragmatic, parallel group, placebo-controlled, three-group, randomised surgical trial. Lancet 2018.",
    kuhn13: "Kuhn JE et al. Effectiveness of physical therapy in treating atraumatic full-thickness rotator cuff tears: a multicenter prospective cohort study. J Shoulder Elbow Surg 2013.",
    park05: "Park HB et al. Diagnostic accuracy of clinical tests for the different degrees of subacromial impingement syndrome. J Bone Joint Surg Am 2005.",
    hegedus: "Hegedus EJ et al. Which physical examination tests provide clinicians with the most value when examining the shoulder? Update of a systematic review with meta-analysis of individual tests. Br J Sports Med 2012.",
    hertel: "Hertel R et al. Lag signs in the diagnosis of rotator cuff rupture. J Shoulder Elbow Surg 1996.",
    lo04: "Lo IKY et al. An evaluation of the apprehension, relocation, and surprise tests for anterior shoulder instability. Am J Sports Med 2004.",
    wainner: "Wainner RS et al. Reliability and diagnostic accuracy of the clinical examination and patient self-report measures for cervical radiculopathy. Spine 2003.",
    thigpen: "Thigpen CA et al. The American Society of Shoulder and Elbow Therapists' consensus statement on rehabilitation following arthroscopic rotator cuff repair. J Shoulder Elbow Surg 2016.",
    kelley: "Kelley MJ et al. Shoulder pain and mobility deficits: adhesive capsulitis. J Orthop Sports Phys Ther 2013.",
    rangan: "Rangan A et al. Management of adults with primary frozen shoulder in secondary care (UK FROST): a multicentre, pragmatic, three-arm, superiority randomised clinical trial. Lancet 2020.",
    olds: "Olds M et al. Risk factors which predispose first-time traumatic anterior shoulder dislocations to recurrent instability in adults: a systematic review and meta-analysis. Br J Sports Med 2015.",
    kuhn10: "Kuhn JE. A new classification system for shoulder instability. Br J Sports Med 2010.",
    tucci: "Tucci HT et al. Closed Kinetic Chain Upper Extremity Stability test (CKCUES test): a reliability study in persons with and without shoulder impingement syndrome. BMC Musculoskelet Disord 2014.",
    watson: "Watson L et al. The treatment of multidirectional instability of the shoulder with a rehabilitation programme: part 1. Shoulder Elbow 2016.",
    gaunt: "Gaunt BW et al. The American Society of Shoulder and Elbow Therapists' consensus rehabilitation guideline for arthroscopic anterior capsulolabral repair of the shoulder. J Orthop Sports Phys Ther 2010.",
    kennedy: "Kennedy JS et al. The American Society of Shoulder and Elbow Therapists' consensus statement on rehabilitation for anatomic total shoulder arthroplasty. J Shoulder Elbow Surg 2020.",
    boudreau: "Boudreau S et al. Rehabilitation following reverse total shoulder arthroplasty. J Orthop Sports Phys Ther 2007.",
    lefevre: "Lefevre-Colau MM et al. Immediate mobilization compared with conventional immobilization for the impacted nonoperatively treated proximal humeral fracture: a randomized controlled trial. J Bone Joint Surg Am 2007.",
    profher: "Rangan A et al. Surgical vs nonsurgical treatment of adults with displaced fractures of the proximal humerus: the PROFHER randomized clinical trial. JAMA 2015.",
    williams99: "Williams GN et al. Comparison of the Single Assessment Numeric Evaluation method and two shoulder rating scales. Am J Sports Med 1999.",
    stratford: "Stratford P et al. Assessing disability and change on individual patients: a report of a patient specific measure. Physiother Can 1995.",
    kamper: "Kamper SJ et al. Global rating of change scales: a review of strengths and weaknesses and considerations for design. J Man Manip Ther 2009."
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
        exos: ["Fente latérale", "Marche latérale élastique", "Monster walk", "Squat bulgare", "Planche Copenhague genou", "Pallof press", "Fente avant et rotation ballon", "Toucher en étoile unipodal", "Avion sur une jambe", "Unipodal sur coussin", "Presse à une jambe", "Nordic curl assisté", "Squat sur une jambe vers la chaise", { n: "Pont des ischios, talons loin", sauf: { greffe: "didt" } }, "Fentes en marchant, bras au ciel", "Le squat du cosaque"] },
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
        exos: ["Fente latérale", "Monster walk", "Squat bulgare", "Pallof press", "Unipodal sur coussin", "Toucher en étoile unipodal", "Avion sur une jambe", "Équilibre réactif sur une jambe", "Planche Copenhague genou", "Squat sur une jambe vers la chaise", "Fentes en marchant, bras au ciel", "Le squat du cosaque"] },
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
        exos: ["Squat bilatéral", "Presse à une jambe", "Fente arrière", "Fente latérale", "Squat bulgare", "Pallof press", "Unipodal sur coussin", "Toucher en étoile unipodal", "Descente de marche sur le côté", "Mini-squat sur une jambe, tenu", "Squat sur une jambe vers la chaise", "Fentes en marchant, bras au ciel"] },
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
        exos: ["Squat bulgare", "Fente avec charge", "Petersen step-up", "Planche Copenhague genou", "Avion sur une jambe", "Petits sauts sur place", "Sauts latéraux par-dessus une ligne", "Squat sur une jambe vers la chaise", "Réception de saut stabilisée", "Fentes en marchant, bras au ciel", "Le squat du cosaque"] }
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
        exos: ["Fente arrière", "Montée de marche avec charge", "Goblet squat", "Squat bulgare", "Marche du fermier sur place", "Se relever du sol", "Squat sur une jambe vers la chaise", "Fentes en marchant, bras au ciel"] }
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
        exos: ["Goblet squat", "Fente arrière", "Montée de marche avec charge", "Unipodal sur coussin", "Se relever du sol", "Squat sur une jambe vers la chaise", "Fentes en marchant, bras au ciel"] }
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
        exos: ["Squat bulgare", "Fente avec charge", "Fente latérale", "Petits sauts sur place", "Avion sur une jambe", "Squat sur une jambe vers la chaise", "Réception de saut stabilisée", "Saut sur la marche", "Le kangourou", "Fentes en marchant, bras au ciel", "Le squat du cosaque"] }
    ],
    src: ["logMen", "willy", "oarsi"]
  };

  /* ═══════════════════════ CHEVILLE ET PIED ═══════════════════════ */
  var ALERTES_CHEVILLE = [
    "Impossible de faire 4 pas en appui, ou douleur à la palpation des malléoles, de la base du 5e métatarsien ou de l'os naviculaire : radiographie (règles d'Ottawa).",
    "Coup de bâton derrière le mollet, impossible de se mettre sur la pointe, test de Thompson positif : suspicion de rupture du tendon d'Achille, avis orthopédique rapide.",
    "Mollet douloureux, gonflé ou chaud, surtout après une immobilisation : suspicion de phlébite.",
    "Sous un plâtre ou une botte : pied froid, pâle, fourmillements ou douleur qui augmente fortement : avis médical en urgence.",
    "Pied chaud, rouge et gonflé chez une personne diabétique, ou cicatrice qui coule après une opération : avis médical rapide.",
    "Douleur la nuit sans lien avec les mouvements, perte de poids inexpliquée, antécédent de cancer : avis médical."
  ];

  P.cheville = {
    nom: "Cheville ou pied, sans diagnostic précis", long: "Douleur de cheville ou de pied sans diagnostic établi", zone: "cheville",
    key: { m: "heel", lsi: 1, l: "Symétrie des élévations du talon" },
    mes: ["dou", "fig8", "dfl", "heel", "yb", "faam"],
    ref: "Élévation des talons unipodale",
    notes: ["Parcours général en attendant d'affiner : le guide d'orientation propose une piste à partir de l'interrogatoire et des tests.",
            "Si aucune amélioration en 4 à 6 semaines, ou si un signe d'alerte apparaît : réorienter vers le médecin."],
    etapes: [
      { nom: "Calmer et bouger", but: "Adapter les activités, retrouver la mobilité de la cheville et la marche normale.",
        obj: [
          { id: "alerte", t: "Signes d'alerte écartés (dont les règles d'Ottawa)", p: "Ton kiné a vérifié qu'il n'y a pas de signe inquiétant" },
          { id: "dou5", t: "Douleur à l'effort de 5/10 au maximum", p: "La douleur à l'effort a baissé", a: { m: "dou", max: 5 } },
          { id: "marche", t: "Marche sans boiterie", p: "Tu marches normalement" }],
        exos: ["Pompe de cheville couché", "Alphabet avec le pied", "Talons levés assis", "Bascule d'un pied à l'autre", "Fente de cheville au mur", "Élévation des talons", "Équilibre unipodal", "Vélo d'appartement"] },
      { nom: "Renforcer et équilibrer", but: "Force du mollet et des muscles qui stabilisent la cheville, équilibre sur un pied.",
        obj: [
          { id: "dou3", t: "Douleur à l'effort de 3/10 au maximum", p: "Peu de douleur à l'effort", a: { m: "dou", max: 3 } },
          { id: "heel80", t: "Élévations du talon : au moins 80 % du côté sain", p: "Ton mollet a retrouvé 80 % de son endurance", a: { m: "heel", lsi: 80 } },
          { id: "eq30", t: "Tient 30 s sur un pied, yeux ouverts", p: "Tu tiens 30 secondes sur un pied" }],
        exos: ["Élévation des talons unipodale", "Élévation du talon sur une jambe, genou plié", "Éversion à l'élastique", "Inversion à l'élastique", "Unipodal yeux fermés", "Unipodal sur coussin", "Équilibre sur un pied, bras qui bougent", "Marche sur la pointe des pieds", "Le flamant rose", "Le pingouin"] },
      { nom: "Reprendre les activités", but: "Sauts, course et sport, avec une progression adaptée.",
        obj: [
          { id: "heel90", t: "Élévations du talon : au moins 90 % du côté sain", p: "Ton mollet a retrouvé 90 % de son endurance", a: { m: "heel", lsi: 90 } },
          { id: "activ", t: "Activités reprises sans douleur gênante", p: "Tu as repris tes activités" }],
        exos: ["Petits sauts sur place", "Sauts avant-arrière par-dessus une ligne", "Sauts latéraux par-dessus une ligne", "Réception sur une jambe depuis la marche", "Le cueilleur de pommes", "Le ninja"] }
    ],
    alertes: ALERTES_CHEVILLE,
    src: ["martinLAS", "stiellA", "morrissey"]
  };

  P.entorse = {
    nom: "Entorse de cheville", long: "Entorse du ligament latéral externe de la cheville", zone: "cheville",
    opts: [{ id: "grade", l: "Gravité", ch: [["1", "Bénigne"], ["2", "Moyenne"], ["3", "Grave"]] }],
    key: { m: "heel", lsi: 1, l: "Symétrie des élévations du talon" },
    mes: ["dou", "fig8", "dfl", "dfa", "heel", "yb", "hopside", "hop1", "cait", "faam"],
    ref: "Élévation des talons unipodale",
    notes: ["Appui et marche dès que la douleur le permet : l'immobilisation stricte retarde la récupération. Orthèse ou strapping les premières semaines selon la gravité.",
            "Le travail d'équilibre réduit d'environ un tiers le risque de récidive : à poursuivre au moins 8 à 12 semaines après la reprise, idéalement un an.",
            "Entorse haute (syndesmose) : récupération nettement plus longue, progression plus prudente."],
    etapes: [
      { nom: "Protéger et remettre en mouvement", but: "Appui selon la douleur, marche le plus tôt possible, dégonfler, retrouver la flexion dorsale.",
        obj: [
          { id: "ottawa", t: "Fracture écartée (règles d'Ottawa ou radiographie)", p: "Ton kiné a vérifié qu'il n'y a pas de fracture" },
          { id: "marche", t: "Marche sans boiterie, sans béquilles", p: "Tu marches normalement, sans béquilles" },
          { id: "oed", t: "Œdème : moins de 1 cm d'écart avec l'autre cheville", p: "Ta cheville a dégonflé", a: { m: "fig8", diff: 1 } },
          { id: "dou4", t: "Douleur à l'effort de 4/10 au maximum", p: "La douleur a bien baissé", a: { m: "dou", max: 4 } }],
        exos: ["Pompe de cheville couché", "Alphabet avec le pied", "Pousser le bord du pied contre le mur", "Talons levés assis", "Bascule d'un pied à l'autre", "Fente de cheville au mur", "Élévation des talons", "Équilibre unipodal", "Vélo d'appartement"] },
      { nom: "Renforcer et équilibrer", but: "Muscles fibulaires et mollet, équilibre sur un pied de plus en plus difficile.",
        obj: [
          { id: "dfl", t: "Fente au mur : moins de 2 cm d'écart avec l'autre côté", p: "Ta cheville se plie presque comme l'autre", a: { m: "dfl", diff: 2 } },
          { id: "heel80", t: "Élévations du talon : au moins 80 % du côté sain", p: "Ton mollet a retrouvé 80 % de son endurance", a: { m: "heel", lsi: 80 } },
          { id: "eq30", t: "Tient 30 s sur un pied, yeux fermés", p: "Tu tiens 30 secondes sur un pied, yeux fermés" }],
        exos: ["Éversion à l'élastique", "Inversion à l'élastique", "Élévation des talons unipodale", "Élévation des talons sur une marche", "Élévation du talon sur une jambe, genou plié", "Unipodal yeux fermés", "Unipodal sur coussin", "Équilibre sur un pied, bras qui bougent", "Toucher en étoile unipodal", "Marche sur la pointe des pieds", "Marche sur les talons", "Le flamant rose", "La statue de la liberté", "Le pingouin"] },
      { nom: "Sauter et changer de direction", but: "Sauts sur deux puis un pied, réceptions, appuis latéraux.",
        obj: [
          { id: "heel90", t: "Élévations du talon : au moins 90 % du côté sain", p: "Ton mollet a retrouvé 90 % de son endurance", a: { m: "heel", lsi: 90 } },
          { id: "yb", t: "Y-balance antérieur : moins de 4 cm d'écart", p: "Ton équilibre est le même des deux côtés", a: { m: "yb", diff: 4 } },
          { id: "side", t: "Side hop : au moins 90 % du côté sain", p: "Tes sauts sur le côté sont aussi rapides que de l'autre côté", a: { m: "hopside", lsi: 90 } }],
        exos: ["Petits sauts sur place", "Sauts avant-arrière par-dessus une ligne", "Sauts latéraux par-dessus une ligne", "Sauts en croix sur une jambe", "Réception sur une jambe depuis la marche", "Sauts sur une jambe", "Skater latéral sans saut", "Bonds du patineur", "Le ninja", "Le cueilleur de pommes"] },
      { nom: "Retour au sport", but: "Entraînement complet puis compétition, avec un programme d'équilibre en prévention.",
        obj: [
          { id: "hop90", t: "Saut sur une jambe : au moins 90 % du côté sain", p: "Tes sauts atteignent 90 % de l'autre jambe", a: { m: "hop1", lsi: 90 } },
          { id: "cait", t: "CAIT au-dessus de 25 (cheville stable)", p: "Ta cheville te paraît stable", a: { m: "cait", min: 26 } },
          { id: "entr", t: "Entraînement complet sans appréhension", p: "Tu as repris l'entraînement complet" },
          { id: "prev", t: "Programme d'équilibre en prévention, à garder un an", p: "Tu as ton programme de prévention" }],
        exos: ["Sauts latéraux sur une jambe réactifs", "Bonds du patineur", "Sauts en croix sur une jambe", "Fentes sautées", "Équilibre réactif sur une jambe", "Unipodal sur coussin"] }
    ],
    alertes: ALERTES_CHEVILLE,
    src: ["martinLAS", "vuurberg", "doherty", "dubois", "hupperets", "stiellA"]
  };

  P.instab = {
    nom: "Instabilité chronique de cheville", long: "Entorses à répétition, cheville qui « lâche »", zone: "cheville",
    key: { m: "cait", l: "Score CAIT" },
    mes: ["cait", "dfl", "heel", "yb", "hopside", "hop1", "faam"],
    ref: "Unipodal sur coussin",
    notes: ["Rééducation en première intention : équilibre, force des fibulaires et du mollet, sauts. La chirurgie se discute si l'instabilité persiste après une rééducation bien conduite.",
            "Strapping ou orthèse utiles pendant le sport, en complément des exercices."],
    etapes: [
      { nom: "Mobilité et contrôle", but: "Flexion dorsale symétrique, équilibre statique, force des fibulaires.",
        obj: [
          { id: "dfl", t: "Fente au mur : moins de 2 cm d'écart avec l'autre côté", p: "Ta cheville se plie comme l'autre", a: { m: "dfl", diff: 2 } },
          { id: "eq30", t: "Tient 30 s sur un pied, yeux fermés", p: "Tu tiens 30 secondes sur un pied, yeux fermés" }],
        exos: ["Fente de cheville au mur", "Éversion à l'élastique", "Élévation des talons unipodale", "Pied court", "Unipodal yeux fermés", "Équilibre sur un pied, bras qui bougent", "Le flamant rose", "Toucher en étoile unipodal"] },
      { nom: "Équilibre dynamique et force", but: "Équilibre en mouvement, surfaces instables, premières réceptions.",
        obj: [
          { id: "heel90", t: "Élévations du talon : au moins 90 % du côté sain", p: "Ton mollet a retrouvé 90 % de son endurance", a: { m: "heel", lsi: 90 } },
          { id: "yb", t: "Y-balance antérieur : moins de 4 cm d'écart", p: "Ton équilibre est le même des deux côtés", a: { m: "yb", diff: 4 } }],
        exos: ["Unipodal sur coussin", "Toucher en étoile unipodal", "Sauts avant-arrière par-dessus une ligne", "Réception sur une jambe depuis la marche", "Sauts en croix sur une jambe", "La statue de la liberté", "Le cueilleur de pommes", "Équilibre réactif sur une jambe"] },
      { nom: "Sport et prévention", but: "Appuis réactifs et changements de direction, puis programme d'entretien.",
        obj: [
          { id: "side", t: "Side hop : au moins 90 % du côté sain", p: "Tes sauts sur le côté sont aussi rapides que de l'autre côté", a: { m: "hopside", lsi: 90 } },
          { id: "cait", t: "CAIT au-dessus de 25 (cheville stable)", p: "Ta cheville te paraît stable", a: { m: "cait", min: 26 } },
          { id: "entr", t: "Sport repris sans dérobement", p: "Tu as repris le sport sans que la cheville tourne" }],
        exos: ["Sauts latéraux sur une jambe réactifs", "Bonds du patineur", "Sauts en croix sur une jambe", "Le ninja", "Fentes sautées", "Unipodal sur coussin"] }
    ],
    alertes: ALERTES_CHEVILLE,
    src: ["gribble", "hiller", "martinLAS", "doherty", "caffrey"]
  };

  P.achille = {
    nom: "Tendinopathie d'Achille", long: "Tendinopathie du tendon d'Achille (corps ou insertion)", zone: "cheville",
    opts: [{ id: "loc", l: "Localisation", ch: [["corps", "Corps du tendon"], ["insertion", "Insertion sur le talon"]] }],
    key: { m: "heel", lsi: 1, l: "Symétrie des élévations du talon" },
    mes: ["dou", "visaa", "heel", "heelh", "dfl", "hop1", "hopside"],
    ref: "Élévation des talons unipodale",
    notes: ["Suivi de la douleur : pendant l'exercice jusqu'à 5/10 accepté, à condition que la douleur et la raideur soient revenues à la normale le lendemain matin.",
            "Insertion : pas de talon qui descend dans le vide au début (la flexion dorsale en charge comprime le tendon sur l'os). Exercices au sol, puis amplitude progressive.",
            "Les sports à impulsion se reprennent progressivement, souvent sans arrêt complet si la douleur reste dans les limites."],
    etapes: [
      { nom: "Calmer et charger sans irriter", but: "Exercices statiques et élévations du talon sur deux pieds, adapter la course et les sauts.",
        obj: [
          { id: "edu", t: "Le patient applique le suivi de la douleur", p: "Tu sais doser tes séances avec la douleur" },
          { id: "dou5", t: "Douleur de 5/10 au maximum aux 3 dernières séances", p: "La douleur reste raisonnable pendant tes séances", a: { dou: 5 } },
          { id: "matin", t: "Raideur du matin en baisse", p: "Ton tendon est moins raide le matin" }],
        exos: ["Pointes de pieds tenues", "Talons levés assis", "Élévation des talons", "Mollet assis avec charge", "Élévation des talons genoux fléchis", "Vélo d'appartement", "Fente de cheville au mur"] },
      { nom: "Renforcer lourd et lent", but: "Élévations du talon sur une jambe, lentes et chargées, mollet tendu et genou plié.",
        obj: [
          { id: "heel80", t: "Élévations du talon : au moins 80 % du côté sain", p: "Ton mollet a retrouvé 80 % de son endurance", a: { m: "heel", lsi: 80 } },
          { id: "visa", t: "VISA-A en hausse d'au moins 10 points", p: "Ton tendon te gêne nettement moins", a: { m: "visaa", gain: 10 } }],
        exos: ["Élévation des talons unipodale", "Élévation du talon sur une jambe, genou plié", { n: "Élévation des talons sur une marche", sauf: { loc: "insertion" } }, { n: "Excentrique mollet sur marche", sauf: { loc: "insertion" } }, "Mollet assis avec charge", "Marche sur la pointe des pieds", "Le cueilleur de pommes"] },
      { nom: "Ressort et course", but: "Sauts sur deux pieds puis un pied, reprise progressive de la course.",
        obj: [
          { id: "heel90", t: "Élévations du talon : au moins 90 % du côté sain", p: "Ton mollet a retrouvé 90 % de son endurance", a: { m: "heel", lsi: 90 } },
          { id: "heel25", t: "Au moins 25 élévations du talon sur une jambe", p: "Tu fais 25 montées sur la pointe d'un pied", a: { m: "heel", min: 25 } },
          { id: "course", t: "Course de 30 min sans douleur le lendemain matin", p: "Tu cours 30 minutes sans douleur le lendemain" }],
        exos: ["Petits sauts sur place", "Sauts avant-arrière par-dessus une ligne", "Sauts latéraux par-dessus une ligne", "Sauts sur une jambe", "Le ninja", "Skater latéral sans saut"] },
      { nom: "Retour au sport", but: "Sauts réactifs, accélérations et sport complet.",
        obj: [
          { id: "visa80", t: "VISA-A d'au moins 80", p: "Ton tendon ne te gêne presque plus", a: { m: "visaa", min: 80 } },
          { id: "entr", t: "Entraînement complet sans réaction du tendon", p: "Tu as repris l'entraînement complet" }],
        exos: ["Sauts en croix sur une jambe", "Bonds du patineur", "Sauts latéraux sur une jambe réactifs", "Fentes sautées", "Élévation des talons unipodale"] }
    ],
    alertes: ALERTES_CHEVILLE,
    src: ["martinAch", "silber", "beyer", "alfredson", "robinson"]
  };

  P.rupt_achille = {
    nom: "Rupture du tendon d'Achille", long: "Rupture du tendon d'Achille, opérée ou traitée sans opération", zone: "cheville", op: 1,
    d0: "Date de la rupture ou de l'opération",
    opts: [{ id: "trait", l: "Traitement", ch: [["chir", "Opérée"], ["fonct", "Sans opération (botte)"]] }],
    key: { m: "heelh", lsi: 1, l: "Symétrie de la hauteur du talon" },
    mes: ["dou", "atra", "heel", "heelh", "fig8", "atrs", "hop1"],
    ref: "Talons levés assis",
    notes: ["Botte ou orthèse avec talonnettes retirées progressivement, selon le protocole du chirurgien.",
            "Pendant environ 12 semaines : pas d'étirement du mollet ni de flexion dorsale passive au-delà de la position neutre, pour éviter que le tendon cicatrise trop long. Surveiller l'angle de repos (ATRA) à chaque bilan.",
            "Avec une rééducation fonctionnelle précoce, les résultats sont proches avec ou sans opération ; le risque de re-rupture est un peu plus élevé sans opération."],
    etapes: [
      { nom: "Protéger", but: "Botte avec talonnettes, appui progressif selon le protocole, travail du reste du corps.",
        obj: [
          { id: "j42", t: "Au moins 6 semaines depuis la rupture ou l'opération", p: "6 semaines depuis le début", a: { j: 42 } },
          { id: "appui", t: "Appui complet dans la botte, sans douleur", p: "Tu marches en appui complet dans la botte" },
          { id: "atra", t: "ATRA : moins de 10° d'écart avec l'autre côté", p: "Ton tendon cicatrise à la bonne longueur", a: { m: "atra", diff: 10 } }],
        exos: ["Contraction du quadriceps couché", "Relevé de jambe tendue couché", "Pont de hanche", "Clamshell", "Abduction couché sur le côté"] },
      { nom: "Sortir de la botte et remarcher", but: "Sevrage de la botte, marche normale, premières contractions du mollet sans étirement.",
        obj: [
          { id: "j70", t: "Au moins 10 semaines", p: "10 semaines depuis le début", a: { j: 70 } },
          { id: "marche", t: "Marche sans boiterie, chaussures normales", p: "Tu marches normalement, sans botte" },
          { id: "deux", t: "Élévation du talon sur deux pieds", p: "Tu montes sur la pointe des deux pieds" }],
        exos: ["Talons levés assis", "Mollet assis avec charge", "Pointes de pieds tenues", "Élévation des talons", "Bascule d'un pied à l'autre", "Vélo d'appartement", "Équilibre unipodal", "Pousser le bord du pied contre le mur"] },
      { nom: "Renforcer le mollet", but: "Élévations du talon sur une jambe, de plus en plus hautes et nombreuses.",
        obj: [
          { id: "j112", t: "Au moins 16 semaines", p: "16 semaines depuis le début", a: { j: 112 } },
          { id: "heel60", t: "Élévations du talon : au moins 60 % du côté sain", p: "Ton mollet a retrouvé 60 % de son endurance", a: { m: "heel", lsi: 60 } },
          { id: "heelh80", t: "Hauteur du talon : au moins 80 % du côté sain", p: "Ton talon monte presque aussi haut que l'autre", a: { m: "heelh", lsi: 80 } }],
        exos: ["Élévation des talons unipodale", "Élévation du talon sur une jambe, genou plié", "Élévation des talons genoux fléchis", "Marche sur la pointe des pieds", "Unipodal sur coussin", "Le flamant rose", "Le cueilleur de pommes", "Élévation des talons sur une marche"] },
      { nom: "Courir et sauter", but: "Reprise de la course, puis sauts et sport, selon la force du mollet.",
        obj: [
          { id: "heel80", t: "Élévations du talon : au moins 80 % du côté sain", p: "Ton mollet a retrouvé 80 % de son endurance", a: { m: "heel", lsi: 80 } },
          { id: "heelh90", t: "Hauteur du talon : au moins 90 % du côté sain", p: "Ton talon monte aussi haut que l'autre", a: { m: "heelh", lsi: 90 } },
          { id: "atrs", t: "ATRS d'au moins 80", p: "Ton tendon ne te gêne presque plus", a: { m: "atrs", min: 80 } }],
        exos: ["Petits sauts sur place", "Sauts avant-arrière par-dessus une ligne", "Sauts sur une jambe", "Sauts latéraux par-dessus une ligne", "Réception sur une jambe depuis la marche", "Le ninja"] }
    ],
    alertes: ALERTES_CHEVILLE,
    src: ["willits", "ochen", "carmont", "nilsson", "hebert"]
  };

  P.aponev = {
    nom: "Douleur sous le talon (fasciopathie plantaire)", long: "Fasciopathie plantaire (aponévrosite)", zone: "cheville",
    key: { m: "dmat", l: "Douleur aux premiers pas" },
    mes: ["dmat", "dou", "dfl", "heel", "faam"],
    ref: "Montée sur pointe, serviette sous les orteils",
    notes: ["Première intention : explications, étirement du fascia et du mollet, renforcement lourd, chaussures amortissantes ; semelles ou talonnettes en appoint.",
            "Évolution souvent longue (6 à 12 mois) mais favorable. Ondes de choc ou infiltration se discutent en deuxième intention."],
    etapes: [
      { nom: "Calmer et étirer", but: "Comprendre la douleur, adapter la station debout et la course, étirer le fascia et le mollet.",
        obj: [
          { id: "edu", t: "Le patient sait quoi adapter (chaussures, activités)", p: "Tu sais quoi adapter au quotidien" },
          { id: "dmat5", t: "Douleur aux premiers pas de 5/10 au maximum", p: "Les premiers pas du matin font moins mal", a: { m: "dmat", max: 5 } }],
        exos: ["Étirement de la voûte plantaire", "Rouler une balle sous le pied", "Étirement du mollet contre le mur", "Étirement du soléaire, genou plié", "Talons levés assis", "Pied court", "Serviette ramassée avec les orteils", "Yoga des orteils"] },
      { nom: "Renforcer lourd", but: "Montées sur la pointe lentes et chargées, orteils relevés, un jour sur deux.",
        obj: [
          { id: "dmat3", t: "Douleur aux premiers pas de 3/10 au maximum", p: "Les premiers pas du matin font peu mal", a: { m: "dmat", max: 3 } },
          { id: "heel90", t: "Élévations du talon : au moins 90 % du côté sain", p: "Ton mollet a retrouvé 90 % de son endurance", a: { m: "heel", lsi: 90 } }],
        exos: ["Montée sur pointe, serviette sous les orteils", "Élévation des talons unipodale", "Élévation des talons sur une marche", "Pied court", "Relevé des orteils dos au mur", "Marche sur la pointe des pieds", "Le cueilleur de pommes"] },
      { nom: "Reprendre les activités", but: "Station debout prolongée, marche, course et sport.",
        obj: [
          { id: "dmat1", t: "Douleur aux premiers pas de 1/10 au maximum", p: "Les premiers pas du matin ne font presque plus mal", a: { m: "dmat", max: 1 } },
          { id: "activ", t: "Activités reprises sans douleur gênante", p: "Tu as repris tes activités" }],
        exos: ["Montée sur pointe, serviette sous les orteils", "Petits sauts sur place", "Sauts avant-arrière par-dessus une ligne", "Le ninja", "Élévation des talons unipodale"] }
    ],
    alertes: ALERTES_CHEVILLE,
    src: ["koc", "morrissey", "rathleff", "digiovanni"]
  };

  P.fract_cheville = {
    nom: "Fracture de la cheville", long: "Fracture de la cheville, opérée ou traitée par plâtre ou botte", zone: "cheville", op: 1,
    d0: "Date de l'opération ou du plâtre",
    opts: [{ id: "trait", l: "Traitement", ch: [["chir", "Opérée"], ["ortho", "Plâtre ou botte"]] }],
    key: { m: "dfl", lsi: 1, l: "Symétrie de la fente au mur" },
    mes: ["dou", "fig8", "dfl", "dfa", "heel", "yb", "omas"],
    ref: "Fente de cheville au mur",
    notes: ["L'appui suit les consignes du chirurgien ou du médecin selon le type de fracture.",
            "La raideur en flexion dorsale et la fonte du mollet sont les séquelles les plus fréquentes : à mesurer à chaque bilan."],
    etapes: [
      { nom: "Remobiliser et remarcher", but: "Mobilité de la cheville, dégonfler, reprise de l'appui selon les consignes.",
        obj: [
          { id: "appui", t: "Appui complet autorisé par le chirurgien ou le médecin", p: "Tu as le droit de poser le pied complètement" },
          { id: "marche", t: "Marche sans béquilles", p: "Tu marches sans béquilles" },
          { id: "oed", t: "Œdème : moins de 2 cm d'écart avec l'autre cheville", p: "Ta cheville a bien dégonflé", a: { m: "fig8", diff: 2 } }],
        exos: ["Pompe de cheville couché", "Alphabet avec le pied", "Talons levés assis", "Bascule d'un pied à l'autre", "Fente de cheville au mur", "Vélo d'appartement", "Étirement du mollet contre le mur", "Rouler une balle sous le pied"] },
      { nom: "Renforcer et équilibrer", but: "Force du mollet, équilibre, escaliers.",
        obj: [
          { id: "dfl80", t: "Fente au mur : au moins 80 % du côté sain", p: "Ta cheville se plie presque comme l'autre", a: { m: "dfl", lsi: 80 } },
          { id: "heel70", t: "Élévations du talon : au moins 70 % du côté sain", p: "Ton mollet a retrouvé 70 % de son endurance", a: { m: "heel", lsi: 70 } },
          { id: "eq30", t: "Tient 30 s sur un pied", p: "Tu tiens 30 secondes sur un pied" }],
        exos: ["Élévation des talons", "Élévation des talons unipodale", "Élévation des talons genoux fléchis", "Éversion à l'élastique", "Inversion à l'élastique", "Équilibre unipodal", "Unipodal sur coussin", "Équilibre sur un pied, bras qui bougent", "Marche sur les talons", "Marche sur la pointe des pieds", "Le flamant rose", "Le pingouin", "Step-up sur marche", "Descente de marche"] },
      { nom: "Reprendre les activités", but: "Marche longue, course et sport selon le patient.",
        obj: [
          { id: "dfl90", t: "Fente au mur : au moins 90 % du côté sain", p: "Ta cheville se plie comme l'autre", a: { m: "dfl", lsi: 90 } },
          { id: "heel85", t: "Élévations du talon : au moins 85 % du côté sain", p: "Ton mollet a presque retrouvé sa force", a: { m: "heel", lsi: 85 } },
          { id: "omas", t: "OMAS d'au moins 75", p: "Ta cheville ne te gêne presque plus", a: { m: "omas", min: 75 } }],
        exos: ["Petits sauts sur place", "Sauts avant-arrière par-dessus une ligne", "Sauts sur une jambe", "Réception sur une jambe depuis la marche", "Le ninja", "La statue de la liberté", "Le cueilleur de pommes"] }
    ],
    alertes: ALERTES_CHEVILLE,
    src: ["linFx", "olerud", "bennell", "stiellA"]
  };

  /* ═══════════════════════ ÉPAULE ═══════════════════════ */
  var ALERTES_EPAULE = [
    "Épaule chaude, rouge, très douloureuse avec fièvre : suspicion d'arthrite septique, avis médical le jour même.",
    "Chute chez une personne âgée avec douleur importante et bras impossible à lever : radiographie (fracture).",
    "Perte brutale de la force pour lever le bras après un traumatisme, chez un patient actif : avis chirurgical rapide (rupture aiguë de la coiffe).",
    "Douleur de l'épaule gauche ou de la mâchoire à l'effort, essoufflement, sueurs : penser au cœur, avis médical en urgence.",
    "Fourmillements, perte de force dans la main, douleur qui part du cou : examiner le rachis cervical.",
    "Douleur la nuit sans lien avec les mouvements, perte de poids inexpliquée, antécédent de cancer : avis médical."
  ];
  var QE = ["sane", "psfs", "dou"];

  P.epaule = {
    nom: "Épaule, sans diagnostic précis", long: "Douleur d'épaule sans diagnostic établi", zone: "epaule",
    key: { m: "fle", lsi: 1, l: "Symétrie de l'élévation du bras" },
    mes: ["dou", "dnu", "fle", "abd", "re1", "fRE", "fElev", "sane", "psfs"],
    ref: "Rotation externe à l'élastique",
    notes: ["Parcours général en attendant d'affiner : le guide d'orientation propose une piste à partir de l'interrogatoire et des tests.",
            "Toujours examiner le rachis cervical : une partie des douleurs d'épaule vient du cou."],
    etapes: [
      { nom: "Calmer et bouger", but: "Adapter les activités, bouger dans l'amplitude tolérée, mieux dormir.",
        obj: [
          { id: "alerte", t: "Signes d'alerte écartés (dont le rachis cervical)", p: "Ton kiné a vérifié qu'il n'y a pas de signe inquiétant" },
          { id: "nuit", t: "Douleur la nuit de 3/10 au maximum", p: "Tu dors mieux", a: { m: "dnu", max: 3 } },
          { id: "dou5", t: "Douleur à l'effort de 5/10 au maximum", p: "La douleur à l'effort a baissé", a: { m: "dou", max: 5 } }],
        exos: ["Pendulaire de Codman", "Élévation du bras aidée, couché", "Marche des doigts sur le mur", "Glissement de la main sur la table", "Haussement et enroulement des épaules", "Contraction de l'épaule contre le mur", "Serrage des omoplates"] },
      { nom: "Renforcer", but: "Coiffe des rotateurs et muscles de l'omoplate, de plus en plus haut.",
        obj: [
          { id: "fle90", t: "Élévation : au moins 90 % du côté sain", p: "Ton bras monte presque aussi haut que l'autre", a: { m: "fle", lsi: 90 } },
          { id: "fre80", t: "Force des rotateurs externes : au moins 80 % du côté sain", p: "Ton épaule a retrouvé 80 % de sa force", a: { m: "fRE", lsi: 80 } }],
        exos: ["Rotation externe à l'élastique", "Rotation externe couché sur le côté", "Élévation dans le plan de l'omoplate", "Coup de poing vers le plafond", "Bras en arrière à plat ventre", "Wall slides", "Rowing un bras appui chaise", "Le mime contre la vitre", "Le chef d'orchestre"] },
      { nom: "Reprendre les activités", but: "Bras au-dessus de la tête, charges, sport.",
        obj: [
          { id: "fre90", t: "Force des rotateurs externes : au moins 90 % du côté sain", p: "Ton épaule a retrouvé sa force", a: { m: "fRE", lsi: 90 } },
          { id: "activ", t: "Activités reprises sans douleur gênante", p: "Tu as repris tes activités" }],
        exos: ["Rotation externe à 90° à l'élastique", "Élévation en Y", "Pompes inclinées", "Lancer de balle contre le mur", "Le cow-boy au lasso", "Porté d'une bouteille bras tendu en l'air"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["diercks", "littlewood", "lewis16"]
  };

  P.coiffe = {
    nom: "Douleur de la coiffe des rotateurs", long: "Tendinopathie, conflit ou rupture non opérée de la coiffe des rotateurs", zone: "epaule",
    key: { m: "fRE", lsi: 1, l: "Symétrie de la force des rotateurs externes" },
    mes: ["dou", "dnu", "fle", "abd", "re1", "fRE", "fElev", "sane", "psfs"],
    ref: "Rotation externe à l'élastique",
    notes: ["Le renforcement progressif est le traitement de première intention, avec des résultats comparables à la chirurgie de décompression.",
            "La douleur pendant l'exercice est acceptée jusqu'à 5/10 si elle revient à son niveau habituel le lendemain.",
            "Rupture de la coiffe sans traumatisme : la rééducation aide souvent la majorité des patients ; avis chirurgical si échec après 3 mois environ."],
    etapes: [
      { nom: "Calmer et charger doucement", but: "Contractions statiques, mobilité, adapter les gestes au-dessus de la tête.",
        obj: [
          { id: "edu", t: "Le patient sait quels gestes adapter", p: "Tu sais quoi adapter au quotidien" },
          { id: "nuit", t: "Douleur la nuit de 3/10 au maximum", p: "Tu dors mieux", a: { m: "dnu", max: 3 } },
          { id: "dou5", t: "Douleur à l'effort de 5/10 au maximum", p: "La douleur à l'effort a baissé", a: { m: "dou", max: 5 } }],
        exos: ["Contraction de l'épaule contre le mur", "Pendulaire de Codman", "Élévation du bras aidée, couché", "Rotation externe au bâton, coude au corps", "Serrage des omoplates", "Haussement et enroulement des épaules", "Glissement de la main sur la table"] },
      { nom: "Renforcer la coiffe", but: "Rotations externes et élévations progressives, travail de l'omoplate.",
        obj: [
          { id: "fle", t: "Élévation complète, sans arc douloureux net", p: "Tu lèves le bras jusqu'en haut", a: { m: "fle", lsi: 95 } },
          { id: "fre80", t: "Force des rotateurs externes : au moins 80 % du côté sain", p: "Ton épaule a retrouvé 80 % de sa force", a: { m: "fRE", lsi: 80 } }],
        exos: ["Rotation externe à l'élastique", "Rotation externe couché sur le côté", "Rotation interne à l'élastique", "Élévation dans le plan de l'omoplate", "Coup de poing vers le plafond", "Bras en arrière à plat ventre", "Wall slides", "Face pull à l'élastique", "Le mime contre la vitre", "Le chef d'orchestre"] },
      { nom: "Bras en hauteur et reprise", but: "Charges au-dessus de la tête, vitesse, gestes du sport ou du travail.",
        obj: [
          { id: "fre90", t: "Force des rotateurs externes : au moins 90 % du côté sain", p: "Ton épaule a retrouvé sa force", a: { m: "fRE", lsi: 90 } },
          { id: "felev90", t: "Force en élévation : au moins 90 % du côté sain", p: "Tu soulèves aussi bien des deux côtés", a: { m: "fElev", lsi: 90 } },
          { id: "activ", t: "Gestes au-dessus de la tête sans douleur gênante", p: "Tu lèves les bras sans douleur gênante" }],
        exos: ["Rotation externe à 90° à l'élastique", "Élévation en Y", "Développé épaules assis", "Pompes inclinées", "Lancer de balle contre le mur", "Le cow-boy au lasso", "Porté d'une bouteille bras tendu en l'air"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["diercks", "littlewood", "beard", "kuhn13", "park05"]
  };

  P.coiffe_op = {
    nom: "Réparation de la coiffe opérée", long: "Suture des tendons de la coiffe des rotateurs", zone: "epaule", op: 1,
    opts: [{ id: "taille", l: "Taille de la rupture", ch: [["petite", "Petite ou moyenne"], ["large", "Large ou massive"]] }],
    key: { m: "fle", lsi: 1, l: "Symétrie de l'élévation du bras" },
    mes: ["dou", "dnu", "fle", "abd", "re1", "fRE", "fElev", "sane", "psfs"],
    ref: "Élévation du bras aidée, couché",
    notes: ["Attelle et mobilisation passive seulement pendant environ 4 à 6 semaines, selon le chirurgien : pas de mouvement actif contre la pesanteur.",
            "Rupture large ou massive : progression souvent plus lente, renforcement pas avant 10 à 12 semaines environ.",
            "La raideur des premières semaines est fréquente et se récupère ; la cicatrisation du tendon prime."],
    etapes: [
      { nom: "Protéger (attelle)", but: "Cicatrisation du tendon : mobilisation passive, mobilité du coude, de la main et du cou.",
        obj: [
          { id: "j42", t: "Au moins 6 semaines depuis l'opération", p: "6 semaines depuis l'opération", a: { j: 42 } },
          { id: "passif", t: "Élévation passive d'au moins 120°", p: "Ton bras monte bien quand on t'aide" },
          { id: "nuit", t: "Douleur la nuit de 3/10 au maximum", p: "Tu dors mieux", a: { m: "dnu", max: 3 } }],
        exos: ["Pendulaire de Codman", "Élévation du bras aidée, couché", "Glissement de la main sur la table", "Haussement et enroulement des épaules", "Serrage des omoplates"] },
      { nom: "Bouger activement", but: "Sevrage de l'attelle, mouvements actifs aidés puis actifs, sans charge.",
        obj: [
          { id: "j70", t: "Au moins 10 semaines", p: "10 semaines depuis l'opération", a: { j: 70 } },
          { id: "fle120", t: "Élévation active d'au moins 120°", p: "Tu lèves ton bras seul, assez haut", a: { m: "fle", min: 120 } }],
        exos: ["Marche des doigts sur le mur", "Rotation externe au bâton, coude au corps", "Élévation du bâton bras tendus", "Contraction de l'épaule contre le mur", "Coup de poing vers le plafond", "Wall slides", "Le mime contre la vitre"] },
      { nom: "Renforcer", but: "Renforcement progressif de la coiffe et de l'omoplate.",
        obj: [
          { id: "j112", t: "Au moins 16 semaines", p: "16 semaines depuis l'opération", a: { j: 112 } },
          { id: "fle90", t: "Élévation : au moins 90 % du côté sain", p: "Ton bras monte presque aussi haut que l'autre", a: { m: "fle", lsi: 90 } },
          { id: "fre70", t: "Force des rotateurs externes : au moins 70 % du côté sain", p: "Ton épaule a retrouvé 70 % de sa force", a: { m: "fRE", lsi: 70 } }],
        exos: ["Rotation externe à l'élastique", "Rotation externe couché sur le côté", "Rotation interne à l'élastique", "Élévation dans le plan de l'omoplate", "Bras en arrière à plat ventre", "Rowing un bras appui chaise", "Le chef d'orchestre"] },
      { nom: "Reprendre les activités", but: "Charges, bras au-dessus de la tête, sport, en général à partir de 6 mois.",
        obj: [
          { id: "fre90", t: "Force des rotateurs externes : au moins 90 % du côté sain", p: "Ton épaule a retrouvé sa force", a: { m: "fRE", lsi: 90 } },
          { id: "activ", t: "Activités reprises sans douleur gênante", p: "Tu as repris tes activités" }],
        exos: ["Rotation externe à 90° à l'élastique", "Élévation en Y", "Pompes inclinées", "Développé épaules assis", "Le cow-boy au lasso", "Porté d'une bouteille bras tendu en l'air"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["thigpen", "diercks"]
  };

  P.capsulite = {
    nom: "Capsulite rétractile (épaule gelée)", long: "Capsulite rétractile de l'épaule", zone: "epaule",
    key: { m: "re1", lsi: 1, l: "Symétrie de la rotation externe" },
    mes: ["dou", "dnu", "fle", "abd", "re1", "sane", "psfs"],
    ref: "Rotation externe au bâton, coude au corps",
    notes: ["Évolution en trois phases (douloureuse, raide, récupération) sur 1 à 3 ans en général : rassurer, c'est une maladie qui guérit.",
            "Phase douloureuse : mobiliser sans forcer, en dessous du seuil de douleur. Une infiltration peut aider au début : en parler au médecin.",
            "Plus fréquente chez les personnes diabétiques ou avec un problème de thyroïde."],
    etapes: [
      { nom: "Calmer la douleur", but: "Mouvements doux sans forcer, sommeil, explications sur l'évolution.",
        obj: [
          { id: "edu", t: "Le patient comprend l'évolution en phases", p: "Tu sais comment ça va évoluer" },
          { id: "nuit", t: "Douleur la nuit de 3/10 au maximum", p: "Tu dors mieux", a: { m: "dnu", max: 3 } }],
        exos: ["Pendulaire de Codman", "Élévation du bras aidée, couché", "Glissement de la main sur la table", "Marche des doigts sur le mur", "Haussement et enroulement des épaules"] },
      { nom: "Gagner de l'amplitude", but: "Étirements plus francs, tenus plus longtemps, quand la douleur le permet.",
        obj: [
          { id: "re1", t: "Rotation externe en hausse d'au moins 20°", p: "Ton bras tourne mieux vers l'extérieur", a: { m: "re1", gain: 20 } },
          { id: "fle", t: "Élévation en hausse d'au moins 30°", p: "Ton bras monte plus haut", a: { m: "fle", gain: 30 } }],
        exos: ["Rotation externe au bâton, coude au corps", "Élévation du bâton bras tendus", "Étirement du bras croisé devant la poitrine", "Étirement de l'épaule couché sur le côté", "Le chef d'orchestre", "Wall slides"] },
      { nom: "Récupérer la force et les gestes", but: "Renforcement et gestes du quotidien, au-dessus de la tête.",
        obj: [
          { id: "re80", t: "Rotation externe : au moins 80 % du côté sain", p: "Ton bras tourne presque comme l'autre", a: { m: "re1", lsi: 80 } },
          { id: "activ", t: "Gestes du quotidien possibles (s'habiller, se coiffer)", p: "Tu t'habilles et te coiffes sans gêne" }],
        exos: ["Rotation externe à l'élastique", "Élévation dans le plan de l'omoplate", "Coup de poing vers le plafond", "Rowing un bras appui chaise", "Le cow-boy au lasso", "Le mime contre la vitre"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["kelley", "rangan"]
  };

  P.instab_ep = {
    nom: "Instabilité ou luxation de l'épaule", long: "Luxation ou instabilité de l'épaule, traitée sans opération", zone: "epaule",
    opts: [{ id: "type", l: "Origine", ch: [["trauma", "Après une luxation"], ["laxe", "Sans traumatisme (épaule laxe)"]] }],
    key: { m: "fRE", lsi: 1, l: "Symétrie de la force des rotateurs externes" },
    mes: ["dou", "fle", "abd", "re1", "re90", "fRE", "ckc", "sane", "psfs"],
    ref: "Rotation externe à l'élastique",
    notes: ["Après une première luxation chez un patient jeune et sportif, le risque de récidive est élevé : en parler avec le chirurgien selon le sport.",
            "Pas d'armé du bras (abduction et rotation externe combinées) en force au début.",
            "Épaule laxe sans traumatisme : rééducation longue, centrée sur le contrôle de l'omoplate et de la tête de l'humérus."],
    etapes: [
      { nom: "Protéger et contrôler", but: "Calmer, mobilité dans la zone sûre, contractions statiques de la coiffe.",
        obj: [
          { id: "dou3", t: "Douleur à l'effort de 3/10 au maximum", p: "Peu de douleur", a: { m: "dou", max: 3 } },
          { id: "fle", t: "Élévation : au moins 90 % du côté sain", p: "Ton bras monte presque aussi haut que l'autre", a: { m: "fle", lsi: 90 } }],
        exos: ["Contraction de l'épaule contre le mur", "Serrage des omoplates", "Pompe au mur avec poussée des omoplates", "Coup de poing vers le plafond", "Rotation externe au bâton, coude au corps", "Le mime contre la vitre"] },
      { nom: "Renforcer", but: "Coiffe et omoplate, en élevant progressivement le bras.",
        obj: [
          { id: "fre80", t: "Force des rotateurs externes : au moins 80 % du côté sain", p: "Ton épaule a retrouvé 80 % de sa force", a: { m: "fRE", lsi: 80 } },
          { id: "appr", t: "Pas d'appréhension dans les gestes du quotidien", p: "Tu n'as plus peur que l'épaule ressorte au quotidien" }],
        exos: ["Rotation externe à l'élastique", "Rotation interne à l'élastique", "Rotation externe couché sur le côté", "Élévation dans le plan de l'omoplate", "Bras en arrière à plat ventre", "Pompes contre le mur", "Rowing un bras appui chaise", "Face pull à l'élastique"] },
      { nom: "Bras armé et appuis", but: "Positions à risque contrôlées, appui sur les mains, vitesse.",
        obj: [
          { id: "fre90", t: "Force des rotateurs externes : au moins 90 % du côté sain", p: "Ton épaule a retrouvé sa force", a: { m: "fRE", lsi: 90 } },
          { id: "ckc", t: "CKCUEST : au moins 21 touches en 15 s", p: "Tes appuis sur les mains sont solides", a: { m: "ckc", min: 21 } }],
        exos: ["Rotation externe à 90° à l'élastique", "Pompes inclinées", "Toucher d'épaule en planche", "Chute contrôlée sur les mains contre le mur", "Lancer de balle contre le mur", "Le cow-boy au lasso"] },
      { nom: "Retour au sport", but: "Gestes du sport complets, contacts, puis compétition.",
        obj: [
          { id: "appr2", t: "Pas d'appréhension dans les gestes du sport", p: "Tu fais les gestes de ton sport sans crainte" },
          { id: "entr", t: "Entraînement complet sans dérobement", p: "Tu as repris l'entraînement complet" }],
        exos: ["Pompes complètes", "Pompe avec rotation en T", "Marche de l'ours", "Lancer de balle contre le mur", "Chute contrôlée sur les mains contre le mur"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["olds", "kuhn10", "tucci", "watson"]
  };

  P.stab_op = {
    nom: "Stabilisation de l'épaule opérée", long: "Opération de Bankart ou de Latarjet après luxations", zone: "epaule", op: 1,
    opts: [{ id: "tech", l: "Opération", ch: [["bankart", "Bankart (sous arthroscopie)"], ["latarjet", "Latarjet (butée osseuse)"]] }],
    key: { m: "fRE", lsi: 1, l: "Symétrie de la force des rotateurs externes" },
    mes: ["dou", "fle", "abd", "re1", "re90", "fRE", "ckc", "sane", "psfs"],
    ref: "Rotation externe à l'élastique",
    notes: ["Rotation externe limitée les premières semaines selon le chirurgien (souvent 0 à 30° coude au corps), pour protéger la réparation.",
            "Latarjet : la consolidation de la butée permet souvent une progression un peu plus rapide qu'après un Bankart.",
            "Retour au sport de contact en général entre 4 et 6 mois, sur critères."],
    etapes: [
      { nom: "Protéger (attelle)", but: "Mobilisation passive dans les limites du chirurgien, omoplate, coude et main.",
        obj: [
          { id: "j28", t: "Au moins 4 semaines depuis l'opération", p: "4 semaines depuis l'opération", a: { j: 28 } },
          { id: "dou3", t: "Douleur de 3/10 au maximum", p: "La douleur a bien baissé", a: { m: "dou", max: 3 } }],
        exos: ["Pendulaire de Codman", "Élévation du bras aidée, couché", "Glissement de la main sur la table", "Serrage des omoplates", "Haussement et enroulement des épaules"] },
      { nom: "Bouger et contrôler", but: "Amplitudes actives progressives, contractions de la coiffe.",
        obj: [
          { id: "j56", t: "Au moins 8 semaines", p: "8 semaines depuis l'opération", a: { j: 56 } },
          { id: "fle90", t: "Élévation : au moins 90 % du côté sain", p: "Ton bras monte presque aussi haut que l'autre", a: { m: "fle", lsi: 90 } }],
        exos: ["Contraction de l'épaule contre le mur", "Marche des doigts sur le mur", "Rotation externe au bâton, coude au corps", "Coup de poing vers le plafond", "Wall slides", "Le mime contre la vitre"] },
      { nom: "Renforcer", but: "Coiffe, omoplate, appuis sur les mains.",
        obj: [
          { id: "j84", t: "Au moins 12 semaines", p: "12 semaines depuis l'opération", a: { j: 84 } },
          { id: "fre80", t: "Force des rotateurs externes : au moins 80 % du côté sain", p: "Ton épaule a retrouvé 80 % de sa force", a: { m: "fRE", lsi: 80 } }],
        exos: ["Rotation externe à l'élastique", "Rotation interne à l'élastique", "Élévation dans le plan de l'omoplate", "Bras en arrière à plat ventre", "Pompes contre le mur", "Rowing un bras appui chaise", "Face pull à l'élastique"] },
      { nom: "Retour au sport", but: "Bras armé, vitesse, contacts, sur critères.",
        obj: [
          { id: "fre90", t: "Force des rotateurs externes : au moins 90 % du côté sain", p: "Ton épaule a retrouvé sa force", a: { m: "fRE", lsi: 90 } },
          { id: "ckc", t: "CKCUEST : au moins 21 touches en 15 s", p: "Tes appuis sur les mains sont solides", a: { m: "ckc", min: 21 } },
          { id: "appr", t: "Pas d'appréhension dans les gestes du sport", p: "Tu fais les gestes de ton sport sans crainte" }],
        exos: ["Rotation externe à 90° à l'élastique", "Pompes inclinées", "Toucher d'épaule en planche", "Chute contrôlée sur les mains contre le mur", "Lancer de balle contre le mur", "Pompe avec rotation en T", "Le cow-boy au lasso"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["gaunt", "tucci"]
  };

  P.pte = {
    nom: "Prothèse d'épaule", long: "Prothèse totale d'épaule, anatomique ou inversée", zone: "epaule", op: 1,
    opts: [{ id: "type", l: "Type de prothèse", ch: [["anat", "Anatomique"], ["inv", "Inversée"]] }],
    key: { m: "fle", lsi: 1, l: "Symétrie de l'élévation du bras" },
    mes: ["dou", "dnu", "fle", "abd", "re1", "sane", "psfs"],
    ref: "Élévation du bras aidée, couché",
    notes: ["Prothèse anatomique : protéger le tendon sous-scapulaire (rotation externe et rotation interne contre résistance limitées les 6 premières semaines environ).",
            "Prothèse inversée : éviter la combinaison bras en arrière, rotation interne et rapprochement (main dans le dos) au début : risque de luxation.",
            "C'est le deltoïde qui lève le bras avec une prothèse inversée : son renforcement est central."],
    etapes: [
      { nom: "Protéger", but: "Attelle, mobilisation passive puis active aidée, selon le chirurgien.",
        obj: [
          { id: "j42", t: "Au moins 6 semaines depuis l'opération", p: "6 semaines depuis l'opération", a: { j: 42 } },
          { id: "nuit", t: "Douleur la nuit de 3/10 au maximum", p: "Tu dors mieux", a: { m: "dnu", max: 3 } }],
        exos: ["Pendulaire de Codman", "Élévation du bras aidée, couché", "Glissement de la main sur la table", "Haussement et enroulement des épaules", "Serrage des omoplates"] },
      { nom: "Bouger activement", but: "Mouvements actifs dans les amplitudes fonctionnelles.",
        obj: [
          { id: "fle120", t: "Élévation active d'au moins 120°", p: "Tu lèves ton bras seul, assez haut", a: { m: "fle", min: 120 } },
          { id: "quot", t: "Main à la bouche et à la tête sans aide", p: "Tu manges et te coiffes seul" }],
        exos: ["Marche des doigts sur le mur", "Élévation du bâton bras tendus", "Coup de poing vers le plafond", "Contraction de l'épaule contre le mur", "Le chef d'orchestre", "Le mime contre la vitre"] },
      { nom: "Renforcer et autonomie", but: "Renforcement du deltoïde et de la coiffe, gestes du quotidien et loisirs.",
        obj: [
          { id: "fle90", t: "Élévation : au moins 80 % du côté sain", p: "Ton bras monte presque aussi haut que l'autre", a: { m: "fle", lsi: 80 } },
          { id: "activ", t: "Gestes du quotidien et loisirs repris", p: "Tu as repris tes activités" }],
        exos: ["Élévation dans le plan de l'omoplate", "Élévation frontale avec bouteilles", "Rotation externe à l'élastique", "Rowing un bras appui chaise", "Pompes contre le mur", "Porté d'une bouteille bras tendu en l'air"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["kennedy", "boudreau"]
  };

  P.fx_humerus = {
    nom: "Fracture du haut de l'humérus", long: "Fracture de l'extrémité supérieure de l'humérus, traitée sans opération", zone: "epaule", op: 1,
    d0: "Date de la fracture",
    key: { m: "fle", lsi: 1, l: "Symétrie de l'élévation du bras" },
    mes: ["dou", "dnu", "fle", "abd", "re1", "sane", "psfs"],
    ref: "Pendulaire de Codman",
    notes: ["Fracture peu déplacée : une mobilisation précoce (dès la première ou la deuxième semaine, selon le médecin) donne de meilleurs résultats qu'une longue immobilisation.",
            "Chez la personne âgée, l'objectif est un bras utile au quotidien : manger, s'habiller, se laver."],
    etapes: [
      { nom: "Bouger tôt sans forcer", but: "Pendulaire, mobilisation passive, coude, poignet et main.",
        obj: [
          { id: "accord", t: "Mobilisation autorisée par le médecin", p: "Ton médecin a autorisé les mouvements" },
          { id: "nuit", t: "Douleur la nuit de 3/10 au maximum", p: "Tu dors mieux", a: { m: "dnu", max: 3 } }],
        exos: ["Pendulaire de Codman", "Élévation du bras aidée, couché", "Glissement de la main sur la table", "Haussement et enroulement des épaules"] },
      { nom: "Bouger activement", but: "Consolidation : mouvements actifs, gestes du quotidien.",
        obj: [
          { id: "j42", t: "Au moins 6 semaines depuis la fracture", p: "6 semaines depuis la fracture", a: { j: 42 } },
          { id: "quot", t: "Main à la bouche et à la tête sans aide", p: "Tu manges et te coiffes seul" }],
        exos: ["Marche des doigts sur le mur", "Élévation du bâton bras tendus", "Rotation externe au bâton, coude au corps", "Coup de poing vers le plafond", "Le chef d'orchestre"] },
      { nom: "Renforcer et autonomie", but: "Force, amplitude, autonomie complète.",
        obj: [
          { id: "fle80", t: "Élévation : au moins 80 % du côté sain", p: "Ton bras monte presque aussi haut que l'autre", a: { m: "fle", lsi: 80 } },
          { id: "activ", t: "Autonomie complète au quotidien", p: "Tu te débrouilles seul au quotidien" }],
        exos: ["Élévation dans le plan de l'omoplate", "Rotation externe à l'élastique", "Rowing un bras appui chaise", "Pompes contre le mur", "Le mime contre la vitre"] }
    ],
    alertes: ALERTES_EPAULE, q: QE,
    src: ["lefevre", "profher"]
  };

  var ORDER = ["genou", "lca_op", "lca_cons", "menisectomie", "suture_men", "sfp", "tendino_rot", "gonarthrose", "ptg", "lcm",
               "cheville", "entorse", "instab", "achille", "rupt_achille", "aponev", "fract_cheville",
               "epaule", "coiffe", "coiffe_op", "capsulite", "instab_ep", "stab_op", "pte", "fx_humerus"];
  // Les questionnaires remplis par le patient (note globale, activités choisies) sont proposés dans tous les parcours
  ORDER.forEach(function (id) { ["sane", "psfs"].forEach(function (m) { if (P[id].mes.indexOf(m) < 0) P[id].mes.push(m); }); });
  var ZONES = [["genou", "Genou"], ["cheville", "Cheville et pied"], ["epaule", "Épaule"]];

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
      val: "Signe d'appoint de l'arthrose, à associer à l'âge, à la douleur liée à l'activité et à la raideur matinale courte. Peu spécifique isolé.", src: "nice" },
    /* cheville et pied */
    thompson: { n: "Test de Thompson", how: "Patient à plat ventre, pieds dans le vide. Presser franchement le mollet.",
      pos: "Le pied ne part pas en flexion plantaire quand on presse le mollet.", neg: "Le pied part en flexion plantaire.",
      val: "Très fiable pour la rupture complète (sensibilité de l'ordre de 96 %). À associer à l'angle de repos (pied qui pend plus que l'autre, genou fléchi à 90°) et à la palpation d'une encoche dans le tendon.", src: "maffulli" },
    tiroir: { n: "Tiroir antérieur de la cheville", how: "Patient assis ou sur le dos, cheville en légère flexion plantaire. Une main stabilise le bas du tibia, l'autre tire le talon vers l'avant. Comparer au côté sain.",
      pos: "Avancée du pied plus grande que du côté sain, arrêt mou, parfois une fossette sous la malléole externe.", neg: "Avancée symétrique, arrêt ferme.",
      val: "Plus fiable 4 à 5 jours après l'entorse, quand le gonflement a diminué : douleur du ligament talo-fibulaire antérieur, hématome et tiroir positif rendent une rupture ligamentaire très probable.", src: "croy" },
    tilt: { n: "Bâillement en varus (talar tilt)", how: "Cheville en position neutre. Une main stabilise le tibia, l'autre bascule le talon vers l'intérieur.",
      pos: "Bâillement externe plus grand que du côté sain.", neg: "Bâillement symétrique.",
      val: "Évoque une atteinte associée du ligament calcanéo-fibulaire, donc une entorse plus sévère. Peu précis utilisé seul.", src: "vuurberg" },
    squeeze: { n: "Squeeze test", how: "Serrer le tibia et le péroné l'un contre l'autre à mi-mollet.",
      pos: "Douleur en bas de la jambe, au-dessus de la cheville (syndesmose).", neg: "Pas de douleur en bas.",
      val: "Plutôt spécifique mais peu sensible : à associer à la palpation de la syndesmose et à la rotation externe.", src: "sman" },
    rotext: { n: "Rotation externe (Kleiger)", how: "Patient assis, genou fléchi à 90°, cheville en position neutre. Tourner le pied vers l'extérieur en tenant la jambe.",
      pos: "Douleur au-dessus de la cheville, entre le tibia et le péroné.", neg: "Pas de douleur, ou douleur seulement sous la malléole.",
      val: "Un des tests les plus utiles pour la syndesmose. Palpation de la syndesmose douloureuse + rotation externe positive : forte suspicion d'entorse haute.", src: "sman" },
    ach: { n: "Palpation du tendon d'Achille (arc sign)", how: "Patient à plat ventre. Palper le tendon de l'insertion jusqu'au mollet, puis faire bouger la cheville.",
      pos: "Épaississement douloureux 2 à 6 cm au-dessus du talon qui suit le mouvement du tendon (corps du tendon), ou douleur précise à l'insertion sur le talon.", neg: "Palpation indolore.",
      val: "Palpation douloureuse et arc sign : assez fiables pour une tendinopathie du corps du tendon. La localisation oriente les exercices (corps ou insertion).", src: "martinAch" },
    fascia: { n: "Palpation de l'insertion du fascia plantaire", how: "Pied relâché, palper sous le talon, du côté interne.",
      pos: "Douleur localisée qui reproduit la douleur des premiers pas.", neg: "Palpation indolore.",
      val: "Signe clé de la fasciopathie plantaire, avec la douleur aux premiers pas du matin.", src: "koc" },
    windlass: { n: "Windlass test", how: "Patient debout, orteils au bord d'une marche : le kiné relève le gros orteil.",
      pos: "Douleur sous le talon reproduite.", neg: "Pas de douleur.",
      val: "Très spécifique mais peu sensible : positif, il renforce l'hypothèse ; négatif, il ne l'exclut pas.", src: "degarceau" },
    fente: { n: "Fente contre le mur", how: "Pied face au mur, le genou vient toucher le mur sans que le talon décolle : on mesure la plus grande distance orteil-mur.",
      pos: "Moins de 9 à 10 cm, ou plus de 2 cm d'écart avec l'autre côté.", neg: "Distance normale et symétrique.",
      val: "Mesure fiable de la flexion dorsale en charge. Souvent limitée après une entorse ou une fracture : à reprendre à chaque bilan.", src: "bennell" },
    /* épaule */
    arc: { n: "Arc douloureux", how: "Le patient lève le bras sur le côté, lentement, jusqu'en haut, puis redescend.",
      pos: "Douleur entre 60 et 120° environ, qui diminue au-delà.", neg: "Pas de douleur, ou douleur seulement en fin d'amplitude.",
      val: "Un des tests les plus utiles du conflit et de la coiffe. Associé à Hawkins et à une faiblesse des rotateurs externes, la probabilité d'atteinte de la coiffe devient élevée.", src: "park05" },
    jobe: { n: "Test de Jobe (empty can)", how: "Bras à 90° dans le plan de l'omoplate, pouces vers le bas. Le patient résiste à une pression vers le bas sur les avant-bras.",
      pos: "Douleur ou faiblesse par rapport au côté sain.", neg: "Force normale et indolore.",
      val: "Faiblesse : évoque une atteinte du sus-épineux (rupture possible) ; douleur seule : plutôt une tendinopathie.", src: "hegedus" },
    hawkins: { n: "Hawkins-Kennedy", how: "Bras et coude fléchis à 90° devant le patient. Le kiné tourne le bras en rotation interne (l'avant-bras descend).",
      pos: "Douleur à l'épaule qui reproduit la douleur habituelle.", neg: "Pas de douleur.",
      val: "Sensible mais peu spécifique : négatif, il rend une atteinte de la coiffe moins probable.", src: "hegedus" },
    rer: { n: "Rotation externe contre résistance", how: "Coude au corps fléchi à 90°. Le patient pousse vers l'extérieur contre la main du kiné.",
      pos: "Faiblesse par rapport au côté sain (avec ou sans douleur).", neg: "Force symétrique.",
      val: "Faiblesse nette : évoque une atteinte de l'infra-épineux ; un des 3 éléments de l'association de Park.", src: "park05" },
    lag: { n: "Signe de chute en rotation externe (lag sign)", how: "Coude au corps fléchi à 90°. Le kiné amène l'avant-bras en rotation externe presque maximale et demande au patient de tenir la position, puis lâche.",
      pos: "L'avant-bras revient vers le ventre : le patient ne peut pas tenir la position.", neg: "Le patient tient la position.",
      val: "Très spécifique d'une rupture transfixiante du sus- et de l'infra-épineux. Positif : avis chirurgical à discuter.", src: "hertel" },
    repass: { n: "Rotation externe passive limitée", how: "Coude au corps fléchi à 90°. Le kiné tourne l'avant-bras vers l'extérieur, le patient détendu. Comparer au côté sain.",
      pos: "Rotation externe passive nettement limitée (moins de la moitié du côté sain).", neg: "Rotation passive normale ou proche du côté sain.",
      val: "Signe clé de la capsulite rétractile (et de l'arthrose de l'épaule) : la coiffe seule limite le mouvement actif, pas le passif.", src: "kelley" },
    appr: { n: "Appréhension et relocation", how: "Patient sur le dos, bras à 90° d'abduction : le kiné amène progressivement en rotation externe (appréhension), puis pousse la tête de l'humérus vers l'arrière (relocation).",
      pos: "Appréhension (peur que l'épaule sorte) qui disparaît à la relocation.", neg: "Pas d'appréhension, ou seulement de la douleur.",
      val: "L'appréhension, et non la douleur, est le critère : très spécifique d'une instabilité antérieure.", src: "lo04" },
    sulcus: { n: "Signe du sillon (sulcus)", how: "Patient assis, bras détendu le long du corps : le kiné tire le bras vers le bas.",
      pos: "Un creux apparaît sous l'acromion (plus de 1 à 2 cm).", neg: "Pas de creux.",
      val: "Évoque une laxité inférieure, qui fait penser à une instabilité multidirectionnelle si elle est symptomatique.", src: "watson" },
    croise: { n: "Bras croisé (adduction horizontale)", how: "Bras à 90° devant le patient : le kiné le croise vers l'épaule opposée.",
      pos: "Douleur localisée sur le dessus de l'épaule (articulation acromio-claviculaire).", neg: "Pas de douleur sur l'articulation.",
      val: "Associé à une douleur à la palpation de l'articulation acromio-claviculaire, il oriente vers celle-ci.", src: "hegedus" },
    spurling: { n: "Test de Spurling", how: "Patient assis : tête inclinée du côté douloureux et légèrement en extension, le kiné appuie doucement sur le sommet du crâne.",
      pos: "Douleur ou fourmillements qui descendent dans le bras.", neg: "Pas de douleur dans le bras.",
      val: "Spécifique d'une souffrance d'une racine nerveuse du cou : la douleur d'épaule vient peut-être du cou.", src: "wainner" }
  };

  /* ════════ Guide d'orientation : cheville et pied sans diagnostic ════════ */
  var GUIDE_CHEVILLE = {
    alertes: [
      { id: "ottawa", t: "Traumatisme récent + incapable de faire 4 pas, ou douleur à la palpation des malléoles, de la base du 5e métatarsien ou de l'os naviculaire", d: "Radiographie avant de poursuivre (règles d'Ottawa de la cheville et du pied).", s: "stiellA" },
      { id: "rupture", t: "Coup de bâton derrière le mollet, Thompson positif, encoche palpable", d: "Suspicion de rupture du tendon d'Achille : avis orthopédique le jour même si possible.", s: "maffulli" },
      { id: "tvp", t: "Mollet douloureux, gonflé ou chaud", d: "Suspicion de phlébite : avis médical rapide." },
      { id: "vasc", t: "Pied froid, pâle, fourmillements, ou douleur intense sous un plâtre", d: "Avis médical en urgence." },
      { id: "charcot", t: "Pied chaud, rouge et gonflé chez une personne diabétique", d: "Penser au pied de Charcot ou à une infection : avis médical rapide." },
      { id: "nuit", t: "Douleur nocturne non mécanique, perte de poids, antécédent de cancer", d: "Avis médical." }
    ],
    q: [
      { id: "trauma", t: "Début", ch: [["inversion", "Torsion, le pied tourne vers l'intérieur"], ["rotext", "Torsion du pied vers l'extérieur, ou choc"], ["impulsion", "Douleur brutale à l'impulsion, comme un coup derrière la jambe"], ["progressif", "Progressif, sans traumatisme"]] },
      { id: "age", t: "Âge", ch: [["jeune", "Moins de 30 ans"], ["moyen", "30 à 44 ans"], ["45", "45 ans ou plus"]] },
      { id: "zone", t: "Où est la douleur", ch: [["ext", "Devant ou sous la malléole externe"], ["haut", "Au-dessus de la cheville, entre tibia et péroné"], ["achcorps", "Tendon d'Achille, 2 à 6 cm au-dessus du talon"], ["achins", "Insertion du tendon d'Achille sur le talon"], ["talon", "Sous le talon, côté interne"], ["diffuse", "Diffuse"]] },
      { id: "signes", t: "Ce que le patient décrit", multi: 1, ch: [["pop", "Craquement ou claquement"], ["hemat", "Gonflement et bleu rapides"], ["dero", "La cheville tourne souvent, entorses à répétition"], ["irreg", "Gêne sur terrain irrégulier"], ["pointe", "Impossible de monter sur la pointe d'un pied"], ["matin", "Douleur aux premiers pas du matin"], ["demarr", "Douleur au démarrage, qui passe à l'échauffement puis revient après"], ["course", "Douleur liée à la course ou aux sauts"], ["chauss", "Gêne au contact de la chaussure, derrière le talon"]] },
      { id: "tests", t: "Tests positifs", multi: 1, ch: [["thompson", "Thompson"], ["tiroir", "Tiroir antérieur"], ["tilt", "Bâillement en varus"], ["squeeze", "Squeeze test"], ["rotext", "Rotation externe"], ["ach", "Palpation du tendon d'Achille"], ["fascia", "Palpation du fascia plantaire"], ["windlass", "Windlass test"], ["fente", "Fente au mur limitée"]] }
    ]
  };
  function guideCheville(ans) {
    var has = function (k, v) { var x = ans[k]; return Array.isArray(x) ? x.indexOf(v) >= 0 : x === v; };
    var R = { entorse: { s: 0, why: [] }, syndes: { s: 0, why: [] }, instab: { s: 0, why: [] }, achille: { s: 0, why: [] }, rupture: { s: 0, why: [] }, aponev: { s: 0, why: [] } };
    function add(k, n, w) { R[k].s += n; R[k].why.push(w); }
    // Entorse latérale (Vuurberg 2018 ; Croy 2013)
    if (has("trauma", "inversion")) { add("entorse", 3, "torsion en inversion"); add("instab", 1, "torsion en inversion"); }
    if (has("zone", "ext")) add("entorse", 3, "douleur sous la malléole externe");
    if (has("signes", "hemat")) add("entorse", 1, "gonflement et bleu rapides");
    if (has("tests", "tiroir")) { add("entorse", 3, "tiroir antérieur positif"); add("instab", 1, "laxité au tiroir"); }
    if (has("tests", "tilt")) add("entorse", 2, "bâillement en varus");
    if (has("tests", "fente")) add("entorse", 1, "flexion dorsale limitée");
    // Syndesmose (Sman 2013)
    if (has("trauma", "rotext")) add("syndes", 3, "torsion en rotation externe ou choc");
    if (has("zone", "haut")) add("syndes", 3, "douleur au-dessus de la cheville");
    if (has("tests", "squeeze")) add("syndes", 2, "squeeze test positif");
    if (has("tests", "rotext")) add("syndes", 3, "rotation externe positive");
    // Instabilité chronique (Gribble 2013)
    if (has("signes", "dero")) add("instab", 4, "entorses à répétition");
    if (has("signes", "irreg")) add("instab", 2, "gêne sur terrain irrégulier");
    // Rupture d'Achille (Maffulli 1998)
    if (has("trauma", "impulsion")) add("rupture", 4, "douleur brutale à l'impulsion");
    if (has("signes", "pop") && !has("trauma", "inversion")) add("rupture", 1, "claquement");
    if (has("signes", "pop") && has("trauma", "inversion")) add("entorse", 1, "craquement");
    if (has("signes", "pointe")) add("rupture", 3, "impossible de monter sur la pointe");
    if (has("tests", "thompson")) add("rupture", 6, "Thompson positif");
    // Tendinopathie d'Achille (Martin 2018)
    if (has("trauma", "progressif")) { add("achille", 1, "début progressif"); add("aponev", 1, "début progressif"); }
    if (has("zone", "achcorps")) add("achille", 3, "douleur du corps du tendon");
    if (has("zone", "achins")) add("achille", 3, "douleur à l'insertion du tendon");
    if (has("signes", "demarr")) add("achille", 2, "douleur au démarrage qui passe à l'échauffement");
    if (has("signes", "course")) add("achille", 1, "douleur liée à la course ou aux sauts");
    if (has("signes", "chauss")) add("achille", 1, "gêne au contact de la chaussure");
    if (has("tests", "ach")) add("achille", 3, "palpation du tendon douloureuse");
    // Fasciopathie plantaire (Koc 2023)
    if (has("zone", "talon")) add("aponev", 3, "douleur sous le talon, côté interne");
    if (has("signes", "matin")) add("aponev", 3, "douleur aux premiers pas du matin");
    if (has("tests", "fascia")) add("aponev", 3, "palpation du fascia douloureuse");
    if (has("tests", "windlass")) add("aponev", 2, "windlass test positif");
    if (has("signes", "matin") && (has("zone", "achcorps") || has("zone", "achins"))) add("achille", 1, "raideur du matin");
    var NAME = { entorse: "Entorse du ligament latéral externe", syndes: "Entorse haute (syndesmose)", instab: "Instabilité chronique de cheville", achille: "Tendinopathie d'Achille", rupture: "Rupture du tendon d'Achille", aponev: "Fasciopathie plantaire" };
    var PATH = { entorse: "entorse", syndes: "entorse", instab: "instab", achille: "achille", rupture: "rupt_achille", aponev: "aponev" };
    var NOTE = {
      entorse: "Écarter d'abord une fracture (règles d'Ottawa). Le tiroir antérieur est plus fiable 4 à 5 jours après l'entorse.",
      syndes: "Récupération nettement plus longue qu'une entorse externe. Appui difficile ou douleur importante : avis médical pour une imagerie.",
      instab: "Entorses à répétition et cheville qui lâche : équilibre et force en première intention, chirurgie seulement si échec.",
      achille: "Corps du tendon : charge progressive. Insertion : pas de talon dans le vide au début.",
      rupture: "Avis orthopédique rapide : le traitement (opération ou botte) commence tôt.",
      aponev: "Douleur sous le talon côté interne, pire aux premiers pas du matin. Évolution souvent longue mais favorable."
    };
    return { R: R, NAME: NAME, PATH: PATH, NOTE: NOTE };
  }
  /* ════════ Guide d'orientation : épaule sans diagnostic ════════ */
  var GUIDE_EPAULE = {
    alertes: [
      { id: "septique", t: "Épaule chaude, rouge, très douloureuse avec fièvre", d: "Suspicion d'arthrite septique : avis médical le jour même." },
      { id: "fracture", t: "Chute avec douleur importante, bras impossible à lever, personne âgée ou déformation", d: "Radiographie avant de poursuivre (fracture, luxation non réduite)." },
      { id: "coiffe_aigue", t: "Perte brutale de la force pour lever le bras après un traumatisme, patient actif", d: "Rupture aiguë de la coiffe possible : avis chirurgical rapide." },
      { id: "coeur", t: "Douleur à l'épaule gauche ou à la mâchoire à l'effort, essoufflement, sueurs", d: "Penser au cœur : avis médical en urgence." },
      { id: "neuro", t: "Perte de force ou fourmillements dans la main, troubles de la sensibilité", d: "Atteinte neurologique possible (cou, plexus) : examen neurologique et avis médical." },
      { id: "nuit", t: "Douleur nocturne non mécanique, perte de poids, antécédent de cancer", d: "Avis médical." }
    ],
    q: [
      { id: "trauma", t: "Début", ch: [["chute", "Chute ou choc sur l'épaule"], ["luxation", "L'épaule est sortie (luxation)"], ["progressif", "Progressif, gestes répétés"], ["spontane", "Sans cause, raideur qui s'installe"]] },
      { id: "age", t: "Âge", ch: [["jeune", "Moins de 30 ans"], ["moyen", "30 à 49 ans"], ["50", "50 ans ou plus"]] },
      { id: "zone", t: "Où est la douleur", ch: [["antlat", "Face externe du bras (deltoïde)"], ["ant", "Devant de l'épaule"], ["sup", "Sur le dessus de l'épaule"], ["diffuse", "Profonde et diffuse"], ["cou", "Part du cou et descend dans le bras"]] },
      { id: "signes", t: "Ce que le patient décrit", multi: 1, ch: [["nuit", "Douleur la nuit, couché sur l'épaule"], ["elev", "Douleur en levant le bras ou au-dessus de la tête"], ["raideur", "Raideur : même aidé, le bras ne va pas loin"], ["faibl", "Manque de force pour lever le bras"], ["sort", "Sensation que l'épaule va sortir"], ["diab", "Diabète ou problème de thyroïde"], ["fourm", "Fourmillements dans la main, douleur du cou"]] },
      { id: "tests", t: "Tests positifs", multi: 1, ch: [["arc", "Arc douloureux"], ["jobe", "Jobe"], ["hawkins", "Hawkins-Kennedy"], ["rer", "Rotation externe contre résistance"], ["lag", "Lag sign en rotation externe"], ["repass", "Rotation externe passive limitée"], ["appr", "Appréhension et relocation"], ["sulcus", "Signe du sillon"], ["croise", "Bras croisé"], ["spurling", "Spurling"]] }
    ]
  };
  function guideEpaule(ans) {
    var has = function (k, v) { var x = ans[k]; return Array.isArray(x) ? x.indexOf(v) >= 0 : x === v; };
    var R = { coiffe: { s: 0, why: [] }, rupture: { s: 0, why: [] }, capsulite: { s: 0, why: [] }, instab: { s: 0, why: [] }, ac: { s: 0, why: [] }, cervical: { s: 0, why: [] } };
    function add(k, n, w) { R[k].s += n; R[k].why.push(w); }
    // Coiffe des rotateurs (Park 2005 ; Hegedus 2012)
    if (has("trauma", "progressif")) add("coiffe", 2, "début progressif, gestes répétés");
    if (has("age", "moyen")) add("coiffe", 1, "30 à 49 ans");
    if (has("age", "50")) { add("coiffe", 2, "50 ans ou plus"); add("rupture", 1, "50 ans ou plus"); }
    if (has("zone", "antlat")) add("coiffe", 3, "douleur de la face externe du bras");
    if (has("signes", "elev")) add("coiffe", 2, "douleur en levant le bras");
    if (has("signes", "nuit")) { add("coiffe", 1, "douleur la nuit"); add("capsulite", 1, "douleur la nuit"); }
    if (has("tests", "arc")) add("coiffe", 2, "arc douloureux");
    if (has("tests", "hawkins")) add("coiffe", 2, "Hawkins positif");
    if (has("tests", "jobe")) { add("coiffe", 2, "Jobe positif"); add("rupture", 1, "Jobe positif"); }
    if (has("tests", "rer")) { add("coiffe", 1, "faiblesse en rotation externe"); add("rupture", 3, "faiblesse en rotation externe"); }
    // Rupture de la coiffe (Hertel 1996)
    if (has("signes", "faibl")) add("rupture", 3, "manque de force pour lever le bras");
    if (has("trauma", "chute") && has("age", "50")) add("rupture", 1, "chute après 50 ans");
    if (has("tests", "lag")) add("rupture", 5, "lag sign positif");
    // Capsulite (Kelley 2013)
    if (has("trauma", "spontane")) add("capsulite", 3, "raideur qui s'installe sans cause");
    if (has("age", "50")) add("capsulite", 2, "50 ans ou plus");
    if (has("age", "moyen")) add("capsulite", 1, "30 à 49 ans");
    if (has("signes", "raideur")) add("capsulite", 4, "raideur même passive");
    if (has("signes", "diab")) add("capsulite", 3, "diabète ou thyroïde");
    if (has("zone", "diffuse")) add("capsulite", 1, "douleur profonde et diffuse");
    if (has("tests", "repass")) { add("capsulite", 5, "rotation externe passive limitée"); add("coiffe", -1, "rotation passive limitée : plutôt une capsulite"); }
    // Instabilité (Lo 2004)
    if (has("trauma", "luxation")) add("instab", 6, "luxation");
    if (has("signes", "sort")) add("instab", 4, "sensation que l'épaule va sortir");
    if (has("age", "jeune")) add("instab", 2, "moins de 30 ans");
    if (has("tests", "appr")) add("instab", 5, "appréhension levée par la relocation");
    if (has("tests", "sulcus")) add("instab", 2, "signe du sillon");
    // Acromio-claviculaire
    if (has("zone", "sup")) add("ac", 4, "douleur sur le dessus de l'épaule");
    if (has("trauma", "chute")) add("ac", 2, "chute sur l'épaule");
    if (has("tests", "croise")) add("ac", 3, "bras croisé douloureux");
    // Origine cervicale (Wainner 2003)
    if (has("zone", "cou")) add("cervical", 4, "douleur qui part du cou");
    if (has("signes", "fourm")) add("cervical", 3, "fourmillements, douleur du cou");
    if (has("tests", "spurling")) add("cervical", 4, "Spurling positif");
    var NAME = { coiffe: "Atteinte de la coiffe des rotateurs", rupture: "Rupture de la coiffe des rotateurs", capsulite: "Capsulite rétractile", instab: "Instabilité de l'épaule", ac: "Atteinte acromio-claviculaire", cervical: "Douleur d'origine cervicale" };
    var PATH = { coiffe: "coiffe", rupture: "coiffe", capsulite: "capsulite", instab: "instab_ep", ac: "epaule", cervical: "epaule" };
    var NOTE = {
      coiffe: "Arc douloureux + Hawkins + faiblesse en rotation externe : association la plus parlante. Renforcement progressif en première intention.",
      rupture: "Faiblesse nette et lag sign : rupture probable. Après un traumatisme chez un patient actif, avis chirurgical rapide ; sinon rééducation d'abord.",
      capsulite: "Rotation externe passive très limitée, souvent après 40 ans : capsulite probable (ou arthrose, à vérifier par une radiographie).",
      instab: "L'appréhension plus que la douleur. Première luxation chez un jeune sportif : en parler au chirurgien.",
      ac: "Douleur précise sur l'articulation, à la palpation et au bras croisé : parcours général de l'épaule, en ménageant les appuis.",
      cervical: "La douleur vient peut-être du cou : examiner le rachis cervical et la neurologie avant de traiter l'épaule."
    };
    return { R: R, NAME: NAME, PATH: PATH, NOTE: NOTE };
  }
  /* cles : pour chaque piste, les tests qui la confirment ou l'écartent (proposés « à tester ensuite ») */
  var GUIDES = {
    genou: { titre: "Genou sans diagnostic", def: "genou", defNom: "Parcours genou sans diagnostic précis", g: GUIDE, src: ["stiell", "benj", "decary", "nice", "malliaras", "logLig"],
      cles: { lca_cons: ["lachman", "pivotshift"], menisque: ["interligne", "mcmurray"], lcm: ["valgus"], tendino_rot: ["tendon", "declive"], gonarthrose: ["crepit"], sfp: [] } },
    cheville: { titre: "Cheville et pied sans diagnostic", def: "cheville", defNom: "Parcours cheville sans diagnostic précis", g: GUIDE_CHEVILLE, src: ["stiellA", "maffulli", "croy", "sman", "martinAch", "koc", "degarceau"],
      cles: { entorse: ["tiroir", "tilt", "fente"], syndes: ["squeeze", "rotext"], instab: ["tiroir", "fente"], achille: ["ach"], rupture: ["thompson"], aponev: ["fascia", "windlass"] } },
    epaule: { titre: "Épaule sans diagnostic", def: "epaule", defNom: "Parcours épaule sans diagnostic précis", g: GUIDE_EPAULE, src: ["park05", "hegedus", "hertel", "kelley", "lo04", "wainner"],
      cles: { coiffe: ["arc", "hawkins", "rer"], rupture: ["lag", "rer", "jobe"], capsulite: ["repass"], instab: ["appr", "sulcus"], ac: ["croise"], cervical: ["spurling"] } }
  };
  // Pistes classées, tests négatifs pris en compte, et tests conseillés pour départager les pistes
  function guide(ans, zone) {
    ans = ans || {};
    zone = GUIDES[zone] ? zone : "genou";
    var GZ = GUIDES[zone], r = zone === "cheville" ? guideCheville(ans) : zone === "epaule" ? guideEpaule(ans) : guideGenou(ans), R = r.R;
    var neg = ans.neg || [], pos = ans.tests || [], tn = {}; (GZ.g.q.filter(function (x) { return x.id === "tests"; })[0] || { ch: [] }).ch.forEach(function (c) { tn[c[0]] = c[1]; });
    Object.keys(R).forEach(function (k) { (GZ.cles[k] || []).forEach(function (t) { if (neg.indexOf(t) >= 0) { R[k].s -= 2; R[k].why.push(tn[t] + " négatif"); } }); });
    var pistes = Object.keys(R).filter(function (k) { return R[k].s >= 3; }).sort(function (a, b) { return R[b].s - R[a].s; }).map(function (k) {
      return { id: k, nom: r.NAME[k], parcours: r.PATH[k], score: R[k].s, why: R[k].why.filter(function (w, i, a) { return a.indexOf(w) === i; }), note: r.NOTE[k] };
    });
    // à tester ensuite : les tests clés des pistes les plus avancées (même faibles), pas encore faits
    var cand = Object.keys(R).filter(function (k) { return R[k].s > 0; }).sort(function (a, b) { return R[b].s - R[a].s; }).slice(0, 3), sug = [];
    cand.forEach(function (k) { (GZ.cles[k] || []).forEach(function (t) { if (pos.indexOf(t) < 0 && neg.indexOf(t) < 0 && !sug.some(function (x) { return x.t === t; })) sug.push({ t: t, nom: tn[t], pour: r.NAME[k] }); }); });
    var alert = (ans.alertes || []).map(function (id) { return GZ.g.alertes.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    return { alertes: alert, pistes: pistes, suggest: sug.slice(0, 3) };
  }
  function guideGenou(ans) {
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
    return { R: R, NAME: NAME, PATH: PATH, NOTE: NOTE };
  }

  return {
    M: M, P: P, ORDER: ORDER, ZONES: ZONES, SRC: SRC, ALERTES: ALERTES_GENOU, GUIDE: GUIDE, GUIDES: GUIDES, TESTS: TESTS,
    alertes: function (id) { var p = P[id]; return (p && p.alertes) || ALERTES_GENOU; },
    get: function (id) { return P[id] || null; },
    list: function () { return ORDER.map(function (id) { return { id: id, nom: P[id].nom }; }); },
    best: best, val: val, lsi: lsi, lastWith: lastWith, firstWith: firstWith, evalObj: evalObj, exos: exos, guide: guide, fmt: fmt, days: days
  };
})();
