/* ═══════════ KinéForce — séances de mobilité et d'étirement, pathologie par pathologie ═══════════
   Des séances toutes faites (6 à 7 exercices, une dizaine de minutes) à envoyer au patient depuis sa fiche.
   Chaque séance reprend des exercices de la bibliothèque ; la « note » est pour le kiné : contre-indications
   et précautions de la pathologie. Les séances proposées en premier sont celles du parcours du patient. */
var KineMob = (function () {
  "use strict";
  var ZONES = [["genou", "Genou"], ["cheville", "Cheville et pied"], ["epaule", "Épaule"], ["hanche", "Hanche"], ["rachis", "Dos et cou"], ["autre", "Autres"]];
  var S = [
    /* ── Genou ── */
    { id: "genou_amplitude", zone: "genou", nom: "Genou : retrouver l'amplitude", pour: ["genou", "lca_op", "menisectomie", "suture_men", "ptg", "lcm"],
      ex: ["Contraction du quadriceps couché", "Glissement du talon couché", "Extension passive talon sur un rouleau", "Flexion assise, le pied recule", "Genou qui se balance, assis sur une table", "Pompe de cheville couché"],
      note: "Suture méniscale : limiter la flexion selon le protocole du chirurgien (souvent 90° les premières semaines). Opération récente : valider avec les consignes du chirurgien. Gonflement ou douleur qui augmentent : on réduit l'amplitude." },
    { id: "genou_souplesse", zone: "genou", nom: "Genou : souplesse de la cuisse et du mollet", pour: ["sfp", "tendino_rot", "gonarthrose", "lca_cons", "genou"],
      ex: ["Étirement des quadriceps debout", "Étirement des ischio-jambiers assis", "Étirement du mollet contre le mur", "Fente basse, étirement du psoas", "Étirement des fessiers, cheville sur le genou", "Extension passive talon sur un rouleau"],
      note: "Tendinopathie rotulienne : étirer le quadriceps sans douleur (une tension suffit), ne pas le faire juste avant l'effort. Arthrose : rester doux, assis si l'équilibre est limité." },
    /* ── Cheville et pied ── */
    { id: "cheville_douce", zone: "cheville", nom: "Cheville : mobilité douce", pour: ["entorse", "instab", "fract_cheville", "cheville"],
      ex: ["Pompe de cheville couché", "Alphabet avec la cheville", "Alphabet avec le pied", "Rouler une balle sous le pied", "Yoga des orteils", "Fente de cheville au mur"],
      note: "Entorse récente : garder les trois premiers exercices tant que la douleur au repos et le gonflement sont là. Fracture : seulement avec l'accord du chirurgien, selon l'appui autorisé." },
    { id: "cheville_souplesse", zone: "cheville", nom: "Cheville : souplesse du mollet et du pied", pour: ["cheville", "entorse", "instab"],
      ex: ["Étirement du mollet contre le mur", "Étirement du soléaire, genou plié", "Fente de cheville au mur", "Étirement de la voûte plantaire", "Rouler une balle sous le pied", "Étirement des ischio-jambiers assis"],
      note: "À proposer quand la marche est normale et que la cheville ne gonfle plus. La flexion de cheville doit être comparable des deux côtés." },
    { id: "achille_mobilite", zone: "cheville", nom: "Tendon d'Achille : mobilité sans le tirer", pour: ["achille"],
      ex: ["Pompe de cheville couché", "Alphabet avec la cheville", "Rouler une balle sous le pied", "Étirement du soléaire, genou plié", "Étirement des ischio-jambiers assis", "Fente basse, étirement du psoas"],
      note: "Tendinopathie d'insertion : ne pas étirer le mollet genou tendu ni descendre le talon sous une marche (compression sur l'os). Soléaire genou plié : seulement sans douleur à l'insertion." },
    { id: "rupt_achille_mobilite", zone: "cheville", nom: "Rupture d'Achille : mobilité de la cheville", pour: ["rupt_achille"],
      ex: ["Alphabet avec le pied", "Pompe de cheville couché", "Rouler une balle sous le pied", "Yoga des orteils", "Contraction du quadriceps couché"],
      note: "Selon le protocole (botte, talonnettes) : pas de flexion dorsale au-delà du neutre au début, aucun étirement du mollet. Les mouvements restent petits et sans douleur." },
    { id: "aponev_etirements", zone: "cheville", nom: "Talon douloureux : pied et mollet", pour: ["aponev"],
      ex: ["Étirement de la voûte plantaire", "Rouler une balle sous le pied", "Étirement du mollet contre le mur", "Étirement du soléaire, genou plié", "Yoga des orteils", "Alphabet avec le pied"],
      note: "L'étirement de la voûte plantaire (orteils tirés vers soi) est le mieux étayé. À faire surtout avant les premiers pas du matin, 10 secondes par répétition." },
    /* ── Épaule ── */
    { id: "epaule_amplitude", zone: "epaule", nom: "Épaule : retrouver l'amplitude", pour: ["capsulite", "epaule", "coiffe"],
      ex: ["Pendulaire de Codman", "Élévation du bras aidée, couché", "Glissement de la main sur la table", "Marche des doigts sur le mur", "Rotation externe au bâton, coude au corps", "Étirement du bras croisé devant la poitrine", "Haussement et enroulement des épaules"],
      note: "Capsulite en phase douloureuse : amplitudes sans forcer, douleur tolérable (4/10 au plus) et revenue à son niveau d'avant dans les 24 h. Coiffe douloureuse : éviter l'étirement croisé s'il pince." },
    { id: "epaule_op", zone: "epaule", nom: "Épaule opérée : mobilité douce", pour: ["coiffe_op", "pte", "fx_humerus", "stab_op"],
      ex: ["Pendulaire de Codman", "Haussement et enroulement des épaules", "Élévation du bras aidée, couché", "Glissement de la main sur la table"],
      note: "Toujours selon le protocole du chirurgien : mobilisation passive d'abord, aucune rotation externe après stabilisation, élévation limitée au début. Les limites de ce protocole priment sur cette séance." },
    { id: "epaule_instable", zone: "epaule", nom: "Épaule instable : mobilité du haut du dos", pour: ["instab_ep"],
      ex: ["Haussement et enroulement des épaules", "Livre ouvert couché sur le côté", "Enfiler l'aiguille", "Rotation thoracique à quatre pattes", "Chat-vache", "Pendulaire de Codman"],
      note: "On évite les étirements de l'épaule bras en l'air avec rotation externe (pectoraux, triceps) : on assouplit le haut du dos plutôt que l'articulation instable." },
    /* ── Hanche ── */
    { id: "hanche_mobilite", zone: "hanche", nom: "Hanche : mobilité et étirements", pour: ["hanche", "coxarthrose"],
      ex: ["Rotation de hanche couché, genou plié", "Fente basse, étirement du psoas", "Étirement des fessiers, cheville sur le genou", "Étirement des ischio-jambiers assis", "Étirement des quadriceps debout", "Le hula hoop"],
      note: "Arthrose : rester dans une amplitude sans douleur, la raideur du matin s'améliore avec la répétition. Une douleur franche dans l'aine veut dire qu'on réduit l'amplitude." },
    { id: "pth_mobilite", zone: "hanche", nom: "Prothèse de hanche : mobilité douce", pour: ["pth"],
      ex: ["Contraction des fessiers couché", "Glissement de la jambe sur le côté, couché", "Glissement du talon couché", "Pompe de cheville couché", "Respiration abdominale couché"],
      note: "Respecter les précautions du chirurgien selon la voie d'abord : pas de flexion au-delà de 90°, pas de croisement des jambes, pas de rotation forcée. Exercices sans étirement." },
    { id: "fess_mobilite", zone: "hanche", nom: "Côté de la hanche douloureux : mobilité sans compression", pour: ["tendino_fess"],
      ex: ["Respiration abdominale couché", "Chat-vache", "Livre ouvert couché sur le côté", "Rotation thoracique à quatre pattes", "Fente basse, étirement du psoas", "Étirement des ischio-jambiers assis"],
      note: "Tendinopathie des fessiers : aucun étirement en adduction (jambe croisée, bras de la jambe vers l'épaule opposée) et ne pas dormir sur le côté douloureux. Le livre ouvert se fait côté sain contre le sol." },
    { id: "cfa_mobilite", zone: "hanche", nom: "Hanche du sportif : mobilité sans pincement", pour: ["cfa"],
      ex: ["Chat-vache", "Rotation thoracique à quatre pattes", "Livre ouvert couché sur le côté", "Fente basse, étirement du psoas", "Étirement des quadriceps debout", "Rotation de hanche couché, genou plié"],
      note: "Conflit fémoro-acétabulaire : pas de flexion profonde combinée à la rotation interne ou à l'adduction. On s'arrête avant le pincement à l'avant de la hanche." },
    { id: "pubalgie_etirements", zone: "hanche", nom: "Aine du sportif : souplesse de la hanche", pour: ["pubalgie"],
      ex: ["Fente basse, étirement du psoas", "Étirement des quadriceps debout", "Étirement des ischio-jambiers assis", "Écart assis, étirement des adducteurs", "Rotation de hanche couché, genou plié", "Chat-vache"],
      note: "Adducteurs : étirement doux et progressif, jamais jusqu'à la douleur à l'aine, sans rebond. S'il réveille la douleur, on le retire et on garde le psoas et les quadriceps." },
    /* ── Dos et cou ── */
    { id: "dos_mobilite", zone: "rachis", nom: "Dos : mobilité et détente", pour: ["dos"],
      ex: ["Respiration abdominale couché", "Bascule du bassin couché", "Genoux vers la poitrine couché", "Essuie-glace genoux pliés", "Chat-vache", "Position de l'enfant"],
      note: "Lombalgie : bouger fait du bien, une douleur gérable (4/10 au plus) est acceptable. Si un mouvement aggrave durablement, on le retire. Aucune flexion forcée si la douleur descend dans la jambe." },
    { id: "sciatique_mobilite", zone: "rachis", nom: "Sciatique : mobilité et glissement du nerf", pour: ["sciatique"],
      ex: ["Respiration abdominale couché", "Extension couché sur les coudes", "Bascule du bassin couché", "Genoux vers la poitrine couché", "Étirement des fessiers, cheville sur le genou", "Glissement du nerf sciatique assis"],
      note: "On garde les mouvements qui ramènent la douleur vers le dos et on retire ceux qui la font descendre. Pas d'étirement des ischio-jambiers tant que la sciatique est irritable. Le glissement du nerf ne doit pas reproduire la douleur de jambe." },
    { id: "cervicalgie_mobilite", zone: "rachis", nom: "Cou : mobilité et détente", pour: ["cervicalgie"],
      ex: ["Rentrer le menton", "Rotation du cou", "Inclinaison du cou", "Haussement et enroulement des épaules", "Étirement des pectoraux contre le mur", "Livre ouvert couché sur le côté"],
      note: "Cervicalgie : mouvements lents, dans une amplitude confortable. Vertiges, maux de tête nouveaux ou fourmillements : on arrête et on te le dit." },
    { id: "ncb_mobilite", zone: "rachis", nom: "Cou et bras : glissement du nerf", pour: ["nevralgie_cb"],
      ex: ["Rentrer le menton", "Glissement du nerf du bras", "Haussement et enroulement des épaules", "Livre ouvert couché sur le côté", "Respiration abdominale couché"],
      note: "Pas d'extension ni d'inclinaison du cou vers le côté douloureux. Le glissement du nerf ne doit pas reproduire les fourmillements. Déficit de force ou aggravation : avis médical." },
    /* ── Autres : scoliose, sport, bureau, tout public ── */
    { id: "scoliose", zone: "autre", nom: "Scoliose : souplesse et posture", pour: [],
      ex: ["Chat-vache", "Le métronome", "Rotation thoracique à quatre pattes", "Livre ouvert couché sur le côté", "Étirement des pectoraux contre le mur", "Rotation du buste bâton sur les épaules", "Position de l'enfant"],
      note: "Cette séance entretient la souplesse et le confort, elle ne corrige pas la courbure. Les exercices spécifiques (type Schroth, côté de la concavité) sont à enseigner par un kiné formé." },
    { id: "apres_sport", zone: "autre", nom: "Après le sport : jambes et hanches", pour: [],
      ex: ["Étirement des quadriceps debout", "Étirement des ischio-jambiers assis", "Étirement du mollet contre le mur", "Étirement des fessiers, cheville sur le genou", "Fente basse, étirement du psoas", "Écart assis, étirement des adducteurs"],
      note: "À faire une fois chaud, après l'effort. Pas d'étirement douloureux sur une zone blessée." },
    { id: "bureau", zone: "autre", nom: "Journée assise : dos, cou et épaules", pour: [],
      ex: ["Rentrer le menton", "Haussement et enroulement des épaules", "Rotation du tronc assis", "Étirement des pectoraux contre le mur", "Étirement du triceps, coude derrière la tête", "Chat-vache"],
      note: "Pour les douleurs de travail sur écran. Toutes les 1 à 2 heures plutôt qu'une grosse séance." },
    { id: "doux_tout_corps", zone: "autre", nom: "Mobilité douce pour tout le corps", pour: ["hopital"],
      ex: ["Respiration abdominale couché", "Chat-vache", "Rotation du tronc assis", "Étirement des pectoraux contre le mur", "Étirement des quadriceps debout", "Position de l'enfant"],
      note: "Séance simple, sans matériel, pour une reprise en douceur ou un patient hospitalisé." }
  ];
  var BY = {}; S.forEach(function (x) { BY[x.id] = x; });
  function get(id) { return BY[id] || null; }
  function forParcours(pid) { return S.filter(function (x) { return x.pour.indexOf(pid) >= 0; }); }
  // Durée estimée : 30 s par côté et par étirement, 10 répétitions pour les mobilisations
  function minutes(x) { return Math.max(5, Math.round(x.ex.length * 1.6 / 5) * 5); }
  return { S: S, ZONES: ZONES, get: get, forParcours: forParcours, minutes: minutes };
})();
window.KineMob = KineMob;
