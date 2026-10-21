/* ═══════════ KinéForce — bibliothèque d'exercices ═══════════
   Chaque exercice a un groupe musculaire et une couleur de base :
   1 vert (facile), 2 orange (intermédiaire), 3 rouge (difficile).
   La façon de faire monte d'un cran (tempo lent, isométrique, sur une jambe, charge),
   au plus jusqu'au rouge. Les exercices des 5 séances y sont rangés aussi. */
var KineBiblio = (function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var GROUPS = [
    ["genou", "Genou et quadriceps"], ["hanche", "Hanche et fessiers"], ["ischio", "Ischio-jambiers"], ["mollet", "Mollets, cheville et pied"],
    ["dos", "Dos bas"], ["gainage", "Gainage"], ["cou", "Cou et nuque"], ["epaule", "Épaules"], ["poussee", "Poussée"], ["tirage", "Tirage et dos haut"],
    ["bras", "Bras"], ["main", "Coude, poignet et main"], ["equilibre", "Équilibre"], ["mobilite", "Mobilité"], ["cardio", "Cardio doux"], ["reactif", "Réactivité (couleurs)"]
  ];
  var COLORS = { 1: ["vert", "Facile"], 2: ["orange", "Intermédiaire"], 3: ["rouge", "Difficile"] };

  // Exercices des 5 séances : groupe et couleur de base
  var TAGS = {
    "Squat bilatéral": ["genou", 2], "Fentes avant unilatérales": ["genou", 2], "Chaise contre le mur": ["genou", 2],
    "Step-up sur marche": ["genou", 1], "Pont ischio-jambiers talons sur chaise": ["ischio", 2], "Élévation des talons": ["mollet", 1],
    "Rotation externe d'épaule": ["epaule", 1], "Pompes sur genoux": ["poussee", 2], "Dips sur chaise": ["poussee", 2],
    "Pike push-up": ["epaule", 3], "Superman en Y et en W": ["tirage", 2], "Crunch abdominal contrôlé": ["gainage", 1],
    "Portefeuille (V-up)": ["gainage", 3], "Dead bug": ["gainage", 2], "Superman quadrupédique en gainage": ["dos", 1],
    "Ciseaux et vélo": ["gainage", 2], "Plank — gainage avant-bras": ["gainage", 2], "Side plank sur genoux": ["gainage", 1],
    "Squat sumo": ["hanche", 1], "Donkey kick": ["hanche", 1], "Pont de hanche": ["hanche", 1], "Clamshell": ["hanche", 1],
    "Abduction hanche debout": ["hanche", 1], "Pont fessier unilatéral": ["hanche", 2], "Squat + élévation bras": ["cardio", 1],
    "Inchworm et pompes": ["poussee", 3], "Fente latérale avec toucher sol": ["cardio", 2], "Burpee modifié sans saut": ["cardio", 2],
    "Équilibre unipodal": ["equilibre", 1]
  };

  // Nouveaux exercices (fiche complète). cue : le point clé ; err : l'erreur fréquente rappelée par la mascotte
  var NEW = [
    { name: "Assis-debout de chaise", group: "genou", color: 1, kit: ["une chaise"], repsLabel: "10 répétitions",
      desc: "Assis au bord d'une chaise, pieds à plat largeur de hanches, bras tendus devant. Penche le buste en avant, lève-toi en poussant dans les talons jusqu'à être bien droit, puis rassieds-toi lentement, sans te laisser tomber.",
      cue: "Le nez passe au-dessus des orteils, puis on pousse dans les talons.",
      err: "Ne te laisse pas tomber sur la chaise : la descente se contrôle.",
      tip: "Plus facile : une chaise plus haute ou un coussin. Plus dur : descente en 3 secondes, sans toucher la chaise.",
      stop: "Arrêt si douleur vive au genou ou vertige en te levant." },
    { name: "Extension de genou assis", group: "genou", color: 1, kit: ["une chaise"], repsLabel: "12 répétitions par jambe",
      desc: "Assis au fond de la chaise, dos droit, mains sur les bords de l'assise. Tends une jambe jusqu'à l'horizontale, pointe de pied vers toi, tiens 1 seconde puis redescends lentement. Toutes les répétitions d'un côté, puis l'autre.",
      cue: "Jambe bien tendue, pointe de pied vers toi.",
      err: "Le dos reste contre le dossier : on ne bascule pas en arrière pour lever la jambe.",
      tip: "Plus dur : une bouteille d'eau ou un sac léger accroché à la cheville.",
      stop: "Arrêt si douleur sous la rotule qui augmente." },
    { name: "Fente arrière", group: "genou", color: 2, kit: [], repsLabel: "8 répétitions par jambe",
      desc: "Debout, pieds largeur de hanches. Fais un grand pas en arrière et descends jusqu'à ce que les deux genoux soient à 90°, genou arrière près du sol, buste droit. Pousse sur la jambe avant pour revenir. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "Le poids reste sur la jambe avant.",
      err: "Le genou avant reste au-dessus du pied, il ne part pas vers l'intérieur.",
      tip: "Souvent mieux tolérée que la fente avant pour les genoux. Tiens une chaise si l'équilibre est précaire.",
      stop: "Arrêt si douleur vive au genou ou à la hanche." },
    { name: "Squat bulgare", group: "genou", color: 3, kit: ["une chaise"], repsLabel: "8 répétitions par jambe",
      desc: "Dos à une chaise calée contre un mur, pose le dessus d'un pied sur l'assise derrière toi, le pied avant un grand pas devant. Descends en fléchissant le genou avant jusqu'à ce que la cuisse soit presque horizontale, buste légèrement penché, puis remonte en poussant dans le talon avant.",
      cue: "Le genou avant reste dans l'axe du pied, on pousse dans le talon.",
      err: "Ne pousse pas avec la jambe arrière : elle sert seulement d'appui.",
      tip: "Plus facile : amplitude réduite, ou une main sur un appui stable.",
      stop: "Arrêt si douleur vive au genou ou à la hanche, ou perte d'équilibre." },
    { name: "Fire hydrant", group: "hanche", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions par côté",
      desc: "À quatre pattes, mains sous les épaules, genoux sous les hanches, dos plat. Lève un genou sur le côté jusqu'à hauteur de hanche, genou fléchi à 90°, tiens 1 seconde puis redescends lentement.",
      cue: "Le bassin reste horizontal, seul le genou s'ouvre.",
      err: "Ne penche pas le corps du côté opposé pour monter plus haut.",
      tip: "Mains ou genoux sensibles : un coussin dessous.",
      stop: "Arrêt si douleur dans l'aine ou au bas du dos." },
    { name: "Abduction couché sur le côté", group: "hanche", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions par côté",
      desc: "Allongé sur le côté, tête posée sur le bras, jambe du dessous un peu fléchie. Lève la jambe du dessus, tendue, jusqu'à environ 35°, pointe de pied vers l'avant, puis redescends lentement.",
      cue: "Le talon mène le mouvement, les orteils ne regardent pas le plafond.",
      err: "Le bassin ne bascule pas en arrière : reste bien sur le côté.",
      tip: "Plus dur : tenue de 3 secondes en haut, ou un poids léger à la cheville.",
      stop: "Arrêt si douleur sur le côté de la hanche qui augmente." },
    { name: "Hip thrust épaules sur canapé", group: "hanche", color: 2, kit: ["un canapé"], repsLabel: "12 répétitions",
      desc: "Le haut du dos appuyé sur le bord d'un canapé, pieds à plat largeur de hanches, genoux fléchis. Monte le bassin jusqu'à aligner épaules, hanches et genoux, serre les fessiers 2 secondes, puis redescends lentement sans poser les fesses.",
      cue: "Menton rentré, côtes basses : on ne cambre pas.",
      err: "En haut, les genoux sont à 90° : si ce sont les ischios qui chauffent, rapproche les pieds.",
      tip: "Plus dur : une jambe à la fois, ou un sac lesté posé sur le bassin.",
      stop: "Arrêt si douleur au bas du dos ou à la nuque." }
    ,
    { name: "Good morning debout", group: "ischio", color: 1, kit: [], repsLabel: "12 répétitions",
      desc: "Debout, pieds largeur de hanches, genoux légèrement fléchis, bras croisés sur la poitrine. Bascule le buste vers l'avant en reculant les fesses, dos bien droit, jusqu'à sentir l'étirement derrière les cuisses, puis redresse-toi en serrant les fessiers.",
      cue: "Les fesses reculent, le dos reste plat.",
      err: "Ne courbe pas le dos : arrête la descente dès qu'il veut s'arrondir.",
      tip: "Plus dur : un sac à dos chargé tenu contre la poitrine.",
      stop: "Arrêt si douleur au bas du dos ou douleur qui descend dans la jambe." },
    { name: "Soulevé de terre roumain unipodal", group: "ischio", color: 2, kit: [], repsLabel: "8 répétitions par jambe",
      desc: "Debout sur une jambe, genou légèrement fléchi. Bascule le buste vers l'avant pendant que l'autre jambe recule tendue, jusqu'à ce que buste et jambe soient presque à l'horizontale, bras vers le sol. Remonte en poussant dans le talon. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "Le corps bascule d'un bloc, le bassin reste horizontal.",
      err: "Le bassin ne s'ouvre pas sur le côté : les orteils de la jambe arrière regardent le sol.",
      tip: "Plus facile : une main sur le dossier d'une chaise. Plus dur : une bouteille d'eau dans la main opposée.",
      stop: "Arrêt si douleur au bas du dos ou perte d'équilibre." },
    { name: "Leg curl serviette au sol", group: "ischio", color: 3, kit: ["une serviette"], repsLabel: "8 répétitions",
      desc: "Allongé sur le dos sur un sol lisse, talons posés sur une serviette, bassin décollé. Ramène les talons vers les fesses en gardant le bassin haut, puis repousse-les lentement jusqu'à avoir les jambes presque tendues, sans reposer le bassin.",
      cue: "Bassin haut tout le long, on repousse lentement.",
      err: "Ne laisse pas retomber le bassin quand les jambes s'allongent.",
      tip: "Plus facile : repose le bassin pendant le retour. Plus dur : une jambe à la fois.",
      stop: "Arrêt en cas de crampe ou de douleur vive derrière la cuisse." },
    { name: "Nordic curl assisté", group: "ischio", color: 3, kit: ["un canapé"], repsLabel: "5 répétitions",
      desc: "À genoux sur un coussin, talons bloqués sous un canapé, corps droit des genoux aux épaules. Bascule lentement vers l'avant en freinant avec l'arrière des cuisses, aussi loin que possible, puis rattrape-toi avec les mains et reviens en t'aidant d'une légère poussée.",
      cue: "Le corps reste droit des genoux à la tête, on freine le plus longtemps possible.",
      err: "Ne casse pas aux hanches : les fesses ne reculent pas.",
      tip: "Exercice très exigeant : commence par une petite amplitude.",
      stop: "Arrêt en cas de crampe ou de douleur vive derrière la cuisse." },
    { name: "Marche sur les talons", group: "mollet", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Marche sur place, ou dans la pièce, sur les talons, pointes de pieds relevées, sans que l'avant du pied touche le sol.",
      cue: "Pointes de pieds bien relevées.",
      err: "Ne penche pas le buste en arrière pour relever les pieds.",
      tip: "Renforce les releveurs du pied, utiles pour l'équilibre et la prévention des entorses.",
      stop: "Arrêt si douleur sur le devant du tibia." },
    { name: "Élévation des talons genoux fléchis", group: "mollet", color: 2, kit: ["un mur libre"], repsLabel: "15 répétitions",
      desc: "Face au mur, mains en appui, genoux fléchis d'environ 30° et gardés fléchis. Monte sur la pointe des pieds, tiens 1 seconde, puis redescends lentement.",
      cue: "Les genoux restent pliés : c'est le soléaire qui travaille.",
      err: "Ne tends pas les genoux en montant.",
      tip: "Complète l'élévation jambes tendues, utile pour le tendon d'Achille.",
      stop: "Arrêt si douleur au tendon d'Achille qui augmente." },
    { name: "Élévation des talons unipodale", group: "mollet", color: 2, kit: ["un mur libre"], repsLabel: "12 répétitions par jambe",
      desc: "Face au mur, mains en appui, sur une jambe, l'autre pied décollé derrière. Monte le plus haut possible sur la pointe, tiens 1 seconde, redescends lentement. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "Monte bien haut, le poids sur le gros orteil.",
      err: "La cheville ne part pas vers l'extérieur en montant.",
      tip: "Compare les deux côtés : un écart net mérite d'être signalé à ton kiné.",
      stop: "Arrêt si douleur au tendon d'Achille ou au mollet." },
    { name: "Excentrique mollet sur marche", group: "mollet", color: 3, kit: ["une marche"], repsLabel: "12 répétitions par jambe",
      desc: "Debout sur une marche, l'avant des pieds sur le bord, talons dans le vide, une main au mur. Monte sur la pointe des deux pieds, lève un pied, puis descends lentement sur une jambe jusqu'à ce que le talon passe sous le niveau de la marche. Remonte sur les deux pieds.",
      cue: "La descente prend 3 à 4 secondes, sur une seule jambe.",
      err: "On ne remonte pas sur une seule jambe : c'est la descente qui compte.",
      tip: "Utilisé pour le tendon d'Achille (protocole d'Alfredson) : une gêne modérée est acceptée si elle a disparu le lendemain matin.",
      stop: "Arrêt si douleur vive, ou douleur encore présente le lendemain." },
    { name: "Extension lombaire couché sur le ventre", group: "dos", color: 1, kit: ["un tapis"], repsLabel: "10 répétitions",
      desc: "Allongé sur le ventre, mains à plat près des épaules, front au sol. Décolle doucement le buste en gardant le regard vers le sol, tiens 2 secondes, puis repose-toi. Les bras accompagnent sans pousser fort.",
      cue: "Le regard reste vers le sol, la nuque longue.",
      err: "Ne pousse pas fort sur les bras : ce sont les muscles du dos qui soulèvent.",
      tip: "Plus facile : un coussin sous le ventre. Plus dur : mains sur les tempes.",
      stop: "Arrêt si douleur au bas du dos ou douleur qui descend dans la jambe." },
    { name: "Superman bras-jambe opposés", group: "dos", color: 2, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "Allongé sur le ventre, bras tendus devant. Lève en même temps un bras et la jambe opposée de quelques centimètres, tiens 2 secondes, repose, puis change de côté.",
      cue: "Bras et jambe s'allongent plus qu'ils ne montent.",
      err: "Ne relève pas la tête : le front reste près du sol.",
      tip: "Plus dur : lève les deux bras et les deux jambes ensemble.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Pont en marche", group: "dos", color: 2, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "Allongé sur le dos, genoux fléchis. Monte en pont, puis lève un pied pour amener la cuisse à la verticale, repose-le, puis l'autre, sans que le bassin ne bascule. Redescends à la fin.",
      cue: "Le bassin reste horizontal quand le pied se lève.",
      err: "Ne laisse pas tomber la hanche du côté du pied levé.",
      tip: "Plus facile : un petit pont, pieds proches des fesses.",
      stop: "Arrêt si douleur au bas du dos ou crampe derrière la cuisse." },
    { name: "Bear plank", group: "gainage", color: 2, kit: ["un tapis"], repsLabel: "30 secondes",
      desc: "À quatre pattes, mains sous les épaules, pointes de pieds au sol. Décolle les genoux de quelques centimètres et tiens, dos plat, en respirant normalement.",
      cue: "Genoux à 5 cm du sol, dos plat comme une table.",
      err: "Les fesses ne montent pas : elles restent à hauteur des épaules.",
      tip: "Plus facile : 10 secondes de tenue, 5 secondes de repos, et on recommence.",
      stop: "Arrêt si douleur aux poignets ou au bas du dos." },
    { name: "Side plank sur genoux", group: "gainage", color: 1, kit: ["un tapis"], repsLabel: "20 secondes par côté",
      desc: "Sur le côté, appui sur l'avant-bras (coude sous l'épaule) et sur le genou du dessous, genoux pliés. Monte les hanches jusqu'à aligner épaule, hanche et genou, et tiens. Change de côté.",
      cue: "Lève les hanches jusqu'à aligner épaule, hanche et genou.",
      err: "La hanche ne retombe pas : elle reste bien levée.",
      tip: "C'est la version facile de la planche latérale complète.",
      stop: "Arrêt si douleur à l'épaule d'appui ou douleur lombaire." },
    { name: "Gainage frontal sur genoux", group: "gainage", color: 1, kit: ["un tapis"], repsLabel: "20 secondes",
      desc: "Appui sur les avant-bras (coudes sous les épaules) et sur les genoux. Rentre légèrement le ventre et aligne épaules, hanches et genoux, sans creuser le dos ni lever les fesses. Tiens en respirant normalement.",
      cue: "Une ligne droite des épaules aux genoux, le ventre rentré.",
      err: "Les fesses ne montent pas et le dos ne se creuse pas.",
      tip: "C'est la version facile de la planche. Quand 30 secondes deviennent faciles, passe à la planche sur les pieds.",
      stop: "Arrêt si douleur lombaire ou aux épaules." },
    { name: "Planche latérale complète", group: "gainage", color: 3, kit: ["un tapis"], repsLabel: "20 secondes par côté",
      desc: "Sur le côté, appui sur l'avant-bras (coude sous l'épaule) et sur les pieds, jambes tendues. Monte les hanches jusqu'à aligner épaule, hanche et cheville, et tiens.",
      cue: "Une ligne droite de la tête aux pieds.",
      err: "Les hanches ne s'affaissent pas et ne partent pas en arrière.",
      tip: "Plus facile : la version sur les genoux (bouton « − Plus facile » pendant la séance).",
      stop: "Arrêt si douleur à l'épaule d'appui." },
    { name: "Mountain climber lent", group: "gainage", color: 3, kit: [], repsLabel: "30 secondes",
      desc: "En planche sur les mains, bras tendus, corps aligné. Amène lentement un genou vers la poitrine, repose le pied, puis l'autre, sans bouger le bassin.",
      cue: "Lent et contrôlé : le bassin ne monte pas.",
      err: "Les fesses ne montent pas quand le genou avance.",
      tip: "Plus facile : mains sur une chaise ou un canapé.",
      stop: "Arrêt si douleur aux poignets, aux épaules ou au bas du dos." },
    { name: "Rotation externe couché sur le côté", group: "epaule", color: 1, kit: ["une bouteille d'eau"], repsLabel: "12 répétitions par côté",
      desc: "Allongé sur le côté, coude du dessus collé au flanc et plié à 90°, avant-bras devant le ventre, une petite bouteille d'eau en main. Tourne l'avant-bras vers le plafond en gardant le coude collé, puis redescends lentement.",
      cue: "Le coude reste collé, seul l'avant-bras tourne.",
      err: "Ne roule pas le corps vers l'arrière pour monter plus haut.",
      tip: "Une serviette roulée entre le coude et le flanc aide à garder la bonne position.",
      stop: "Arrêt si douleur dans l'épaule qui augmente." },
    { name: "Élévation latérale", group: "epaule", color: 1, kit: ["deux bouteilles d'eau"], repsLabel: "12 répétitions",
      desc: "Debout, une bouteille d'eau dans chaque main, bras le long du corps. Monte les bras sur les côtés jusqu'à hauteur d'épaules, coudes légèrement fléchis, tiens 1 seconde, puis redescends lentement.",
      cue: "On monte jusqu'aux épaules, pas plus haut.",
      err: "Ne hausse pas les épaules vers les oreilles.",
      tip: "Commence par des petites bouteilles (50 cl).",
      stop: "Arrêt si douleur ou accrochage dans l'épaule." },
    { name: "Wall slides", group: "epaule", color: 1, kit: ["un mur libre"], repsLabel: "10 répétitions",
      desc: "Dos contre un mur, pieds un peu décollés, bras en W : coudes et dos des mains contre le mur. Fais glisser les bras vers le haut en Y en gardant le contact avec le mur, puis redescends en W.",
      cue: "Bas du dos, coudes et mains restent contre le mur.",
      err: "Ne cambre pas pour monter plus haut : on s'arrête quand le contact se perd.",
      tip: "Excellent pour la posture et le dos haut.",
      stop: "Arrêt si douleur ou fourmillements dans le bras." },
    { name: "Élévation en Y", group: "epaule", color: 2, kit: ["deux bouteilles d'eau"], repsLabel: "10 répétitions",
      desc: "Debout, une bouteille dans chaque main, pouces vers le haut. Monte les bras en Y, un peu en avant de la ligne du corps, jusqu'au-dessus de la tête, puis redescends lentement.",
      cue: "Pouces vers le ciel, les bras forment un Y.",
      err: "Ne cambre pas le bas du dos en montant.",
      tip: "Plus facile : sans bouteilles, ou jusqu'à hauteur d'épaules seulement.",
      stop: "Arrêt si douleur ou accrochage dans l'épaule." },
    { name: "Pompes contre le mur", group: "poussee", color: 1, kit: ["un mur libre"], repsLabel: "12 répétitions",
      desc: "Face au mur, à un grand pas, mains à plat à hauteur d'épaules un peu plus larges que les épaules. Fléchis les coudes pour approcher la poitrine du mur, corps droit, puis repousse.",
      cue: "Le corps reste droit comme une planche.",
      err: "Les coudes ne s'ouvrent pas à l'horizontale : garde-les à 45° du corps.",
      tip: "Plus dur : recule les pieds.",
      stop: "Arrêt si douleur à l'épaule ou au poignet." },
    { name: "Pompes inclinées", group: "poussee", color: 2, kit: ["une table ou une chaise stable"], repsLabel: "10 répétitions",
      desc: "Mains sur le bord d'une table solide ou d'une chaise calée contre un mur, corps aligné en planche inclinée. Descends la poitrine vers le bord en fléchissant les coudes, puis repousse.",
      cue: "La poitrine descend vers le bord, le corps reste gainé.",
      err: "Le bassin ne s'affaisse pas et les fesses ne montent pas.",
      tip: "Plus le support est bas, plus c'est difficile.",
      stop: "Arrêt si douleur à l'épaule ou au poignet." },
    { name: "Pompes complètes", group: "poussee", color: 3, kit: [], repsLabel: "8 répétitions",
      desc: "En planche sur les mains et les pointes de pieds, mains un peu plus larges que les épaules. Descends la poitrine près du sol, corps aligné, puis repousse.",
      cue: "Une seule ligne de la tête aux talons.",
      err: "Le bassin ne s'affaisse pas : serre fessiers et abdos.",
      tip: "Plus facile : sur les genoux ou mains surélevées.",
      stop: "Arrêt si douleur à l'épaule, au coude ou au poignet." },
    { name: "T au sol", group: "tirage", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions",
      desc: "Allongé sur le ventre, bras écartés en T, pouces vers le haut, front sur une serviette. Décolle les bras du sol en serrant les omoplates, tiens 2 secondes, puis repose.",
      cue: "On serre les omoplates comme pour tenir un crayon entre elles.",
      err: "Ne hausse pas les épaules vers les oreilles.",
      tip: "Plus dur : tiens une petite bouteille dans chaque main.",
      stop: "Arrêt si douleur dans l'épaule ou la nuque." },
    { name: "Rowing un bras appui chaise", group: "tirage", color: 1, kit: ["une chaise", "une bouteille d'eau"], repsLabel: "10 répétitions par côté",
      desc: "Une main en appui sur l'assise d'une chaise, buste penché et dos plat, une bouteille d'eau dans l'autre main, bras tendu vers le sol. Tire le coude vers le plafond le long du corps, tiens 1 seconde, puis redescends lentement.",
      cue: "Le coude monte le long du corps, l'omoplate se rapproche de la colonne.",
      err: "Le buste ne tourne pas pour tirer plus haut.",
      tip: "Plus dur : un sac à dos chargé à la place de la bouteille.",
      stop: "Arrêt si douleur au bas du dos ou à l'épaule." },
    { name: "Rowing deux bras penché", group: "tirage", color: 2, kit: ["deux bouteilles d'eau"], repsLabel: "10 répétitions",
      desc: "Debout, genoux légèrement fléchis, buste penché à environ 45°, dos plat, une bouteille dans chaque main. Tire les coudes vers l'arrière en serrant les omoplates, tiens 1 seconde, puis redescends lentement.",
      cue: "Dos plat, on serre les omoplates en haut.",
      err: "Ne redresse pas le buste pour tirer.",
      tip: "Plus facile : buste moins penché.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Tirage inversé sous une table", group: "tirage", color: 3, kit: ["une table très solide"], repsLabel: "8 répétitions",
      desc: "Allongé sous une table très solide, mains au bord du plateau, talons au sol, corps aligné. Tire la poitrine vers la table en gardant le corps droit, puis redescends lentement.",
      cue: "Le corps monte d'un bloc, comme une planche.",
      err: "Le bassin ne reste pas au sol : on garde l'alignement.",
      tip: "Vérifie que la table ne peut pas basculer. Plus facile : genoux fléchis.",
      stop: "Arrêt si douleur à l'épaule ou au coude, ou si la table bouge." },
    { name: "Curl biceps", group: "bras", color: 1, kit: ["deux bouteilles d'eau"], repsLabel: "12 répétitions",
      desc: "Debout, une bouteille dans chaque main, paumes vers l'avant, coudes collés au corps. Plie les coudes pour monter les bouteilles vers les épaules, puis redescends lentement.",
      cue: "Les coudes restent collés au corps.",
      err: "Ne balance pas le buste pour monter.",
      tip: "Plus dur : descente en 3 secondes.",
      stop: "Arrêt si douleur au coude." },
    { name: "Extension triceps au-dessus de la tête", group: "bras", color: 1, kit: ["deux bouteilles d'eau"], repsLabel: "12 répétitions",
      desc: "Debout, bras levés, coudes pliés, bouteilles derrière la tête. Tends les bras vers le plafond, puis replie lentement.",
      cue: "Les coudes restent près de la tête et pointent vers le plafond.",
      err: "Ne cambre pas le bas du dos.",
      tip: "Plus facile : une seule bouteille tenue à deux mains.",
      stop: "Arrêt si douleur au coude ou à l'épaule." },
    { name: "Curl marteau tempo lent", group: "bras", color: 2, kit: ["deux bouteilles d'eau"], repsLabel: "10 répétitions",
      desc: "Debout, une bouteille dans chaque main, pouces vers l'avant. Monte en 3 secondes, tiens 1 seconde, redescends en 3 secondes.",
      cue: "3 secondes pour monter, 3 secondes pour descendre.",
      err: "Le poignet reste droit, il ne se casse pas.",
      tip: "Le tempo lent rend l'exercice difficile même avec peu de poids.",
      stop: "Arrêt si douleur au coude ou au poignet." },
    { name: "Tandem talon-pointe", group: "equilibre", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout près d'un mur ou d'un meuble, place un pied juste devant l'autre, le talon contre les orteils. Tiens la position, regard droit devant.",
      cue: "Regard sur un point fixe devant toi.",
      err: "Ne regarde pas tes pieds.",
      tip: "Plus dur : change de pied devant, ou ferme les yeux près d'un appui.",
      stop: "Arrêt si vertige." },
    { name: "Unipodal yeux fermés", group: "equilibre", color: 2, kit: [], repsLabel: "30 secondes par pied",
      desc: "Debout près d'un mur ou d'un meuble, sur une jambe, bras croisés. Ferme les yeux et garde l'équilibre. Rouvre les yeux ou touche l'appui si besoin.",
      cue: "Toujours à portée de main d'un appui.",
      err: "Ne bloque pas le genou d'appui : garde-le légèrement souple.",
      tip: "Commence par 10 secondes et augmente.",
      stop: "Arrêt si vertige ou perte d'équilibre répétée." },
    { name: "Unipodal sur coussin", group: "equilibre", color: 2, kit: ["un coussin ferme"], repsLabel: "30 secondes par pied",
      desc: "Debout sur un coussin ferme posé au sol, sur une jambe, près d'un appui. Tiens l'équilibre, genou légèrement fléchi.",
      cue: "Le genou reste au-dessus du pied, souple.",
      err: "Le genou ne part pas vers l'intérieur.",
      tip: "Utile après une entorse de cheville.",
      stop: "Arrêt si douleur à la cheville ou au genou." },
    { name: "Toucher en étoile unipodal", group: "equilibre", color: 3, kit: [], repsLabel: "6 répétitions par côté",
      desc: "Debout sur une jambe, genou légèrement fléchi. Avec la pointe de l'autre pied, touche légèrement le sol devant, sur le côté puis derrière, en revenant au centre à chaque fois, sans poser le poids.",
      cue: "On touche le sol du bout du pied, sans s'appuyer dessus.",
      err: "Le genou d'appui ne rentre pas vers l'intérieur.",
      tip: "Plus facile : des touches plus proches du pied d'appui.",
      stop: "Arrêt si douleur au genou ou perte d'équilibre." },
    { name: "Chat-vache", group: "mobilite", color: 1, kit: ["un tapis"], repsLabel: "8 répétitions",
      desc: "À quatre pattes, mains sous les épaules, genoux sous les hanches. Arrondis le dos en soufflant, menton vers la poitrine, puis creuse doucement le dos en inspirant, regard vers l'avant.",
      cue: "Le mouvement suit la respiration.",
      err: "Pas d'à-coup : on reste dans une amplitude confortable.",
      tip: "Idéal le matin ou après une longue position assise.",
      stop: "Arrêt si douleur au bas du dos ou à la nuque." },
    { name: "Rotation thoracique à quatre pattes", group: "mobilite", color: 1, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "À quatre pattes. Ouvre un bras vers le plafond en tournant le haut du dos, regard qui suit la main, puis ramène la main sous l'épaule opposée.",
      cue: "Le regard suit la main.",
      err: "Le bassin reste immobile : seule la poitrine tourne.",
      tip: "Bon complément pour les douleurs entre les omoplates.",
      stop: "Arrêt si douleur dans le dos ou l'épaule." },
    { name: "Fente psoas dynamique", group: "mobilite", color: 1, kit: ["un coussin"], repsLabel: "8 répétitions par côté",
      desc: "Un genou au sol sur un coussin, l'autre pied devant. Avance doucement le bassin en serrant le fessier de la jambe arrière, bras du même côté levé, tiens 2 secondes, puis reviens.",
      cue: "On serre le fessier de la jambe arrière, sans cambrer.",
      err: "Ne creuse pas le bas du dos.",
      tip: "Étire l'avant de la hanche, utile si tu es souvent assis.",
      stop: "Arrêt si douleur au genou posé au sol ou au bas du dos." },
    { name: "Essuie-glace genoux pliés", group: "mobilite", color: 1, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "Allongé sur le dos, genoux fléchis, pieds au sol, bras écartés. Laisse tomber doucement les deux genoux d'un côté, épaules au sol, puis reviens au centre et passe de l'autre côté.",
      cue: "Les épaules restent posées au sol.",
      err: "On ne force pas en bout de mouvement.",
      tip: "Doux pour le bas du dos, à faire le matin ou le soir.",
      stop: "Arrêt si douleur au bas du dos ou dans la hanche." },
    { name: "Montées de genoux", group: "cardio", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout, marche sur place en montant les genoux à hauteur de hanches, bras qui accompagnent le mouvement, à un rythme régulier.",
      cue: "Genoux à hauteur de hanches, buste droit.",
      err: "Ne te penche pas en arrière.",
      tip: "Plus facile : genoux moins hauts, rythme plus lent.",
      stop: "Arrêt si essoufflement important ou douleur à la poitrine." },
    { name: "Jumping jack sans saut", group: "cardio", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout. Écarte un pied sur le côté en levant les deux bras au-dessus de la tête, reviens, puis fais de même de l'autre côté, à un rythme régulier.",
      cue: "Pied et bras partent en même temps.",
      err: "Ne hausse pas les épaules.",
      tip: "Plus facile : bras à hauteur d'épaules seulement.",
      stop: "Arrêt si essoufflement important ou douleur à la poitrine." },
    { name: "Skater latéral sans saut", group: "cardio", color: 2, kit: [], repsLabel: "30 secondes",
      desc: "Debout. Croise une jambe en arrière de l'autre en fléchissant le genou d'appui, buste un peu penché, bras qui balancent, puis reviens et change de côté, à un rythme régulier.",
      cue: "On fléchit le genou d'appui, le buste reste gainé.",
      err: "Le genou d'appui reste dans l'axe du pied.",
      tip: "Plus dur : un rythme plus soutenu.",
      stop: "Arrêt si douleur au genou ou essoufflement important." },
    { name: "Rotation externe à l'élastique", group: "epaule", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions par côté",
      desc: "Debout, l'élastique accroché à hauteur de coude (poignée de porte) du côté opposé au bras qui travaille. Coude collé au flanc et plié à 90°, avant-bras devant le ventre. Tourne l'avant-bras vers l'extérieur, puis reviens lentement.",
      cue: "Le coude reste collé au corps, seul l'avant-bras tourne.",
      err: "Le buste ne tourne pas pour aider le bras.",
      tip: "Une serviette roulée sous le coude aide à le garder collé.",
      stop: "Arrêt si douleur dans l'épaule qui augmente." },
    { name: "Rotation interne à l'élastique", group: "epaule", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions par côté",
      desc: "Debout, l'élastique accroché à hauteur de coude du même côté que le bras qui travaille. Coude collé au flanc et plié à 90°, avant-bras tourné vers l'extérieur. Ramène l'avant-bras vers le ventre, puis reviens lentement.",
      cue: "Le coude reste collé, on ramène la main vers le nombril.",
      err: "L'épaule ne s'enroule pas vers l'avant.",
      tip: "Complète la rotation externe pour équilibrer l'épaule.",
      stop: "Arrêt si douleur dans l'épaule qui augmente." },
    { name: "Pull-apart à l'élastique", group: "tirage", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions",
      desc: "Debout, l'élastique tenu à deux mains devant toi à hauteur d'épaules, bras tendus. Écarte les bras sur les côtés en serrant les omoplates, tiens 1 seconde, puis reviens lentement.",
      cue: "On serre les omoplates, les épaules restent basses.",
      err: "Ne cambre pas le bas du dos.",
      tip: "Plus dur : rapproche les mains sur l'élastique.",
      stop: "Arrêt si douleur à l'épaule ou fourmillements dans les bras." },
    { name: "Tirage horizontal à l'élastique", group: "tirage", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions",
      desc: "Debout face à une porte, l'élastique accroché à hauteur de poitrine. Bras tendus devant, tire les coudes vers l'arrière le long du corps en serrant les omoplates, tiens 1 seconde, puis reviens lentement.",
      cue: "Coudes près du corps, omoplates serrées en fin de mouvement.",
      err: "Le buste ne part pas en arrière pour tirer.",
      tip: "Plus dur : recule d'un pas.",
      stop: "Arrêt si douleur au dos ou à l'épaule." },
    { name: "Face pull à l'élastique", group: "tirage", color: 2, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions",
      desc: "Debout face à une porte, l'élastique accroché au-dessus de la tête. Tire l'élastique vers le visage en écartant les coudes hauts, mains de chaque côté des oreilles, puis reviens lentement.",
      cue: "Coudes hauts, mains vers les oreilles.",
      err: "Ne hausse pas les épaules.",
      tip: "Excellent pour les épaules et la posture.",
      stop: "Arrêt si douleur ou accrochage dans l'épaule." },
    { name: "Pallof press", group: "gainage", color: 2, kit: ["un élastique"], gear: "elastique", repsLabel: "10 répétitions par côté",
      desc: "Debout de profil par rapport à la porte, l'élastique accroché à hauteur de poitrine, tenu à deux mains contre le sternum. Pousse les mains droit devant toi, tiens 2 secondes sans laisser le buste tourner, puis ramène.",
      cue: "Le buste reste face à l'avant : on résiste à la rotation.",
      err: "Les hanches ne tournent pas vers l'élastique.",
      tip: "Plus dur : éloigne-toi de la porte.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Squat élastique aux genoux", group: "genou", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions",
      desc: "Debout, un élastique en boucle juste au-dessus des genoux, pieds largeur de hanches. Descends en squat en poussant les genoux vers l'extérieur contre l'élastique, puis remonte.",
      cue: "Les genoux poussent l'élastique vers l'extérieur.",
      err: "Les genoux ne rentrent pas vers l'intérieur.",
      tip: "Utile si les genoux ont tendance à rentrer pendant le squat.",
      stop: "Arrêt si douleur vive au genou." },
    { name: "Extension terminale du genou", group: "genou", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "15 répétitions par jambe",
      desc: "Debout, l'élastique accroché devant toi à un pied de meuble, la boucle derrière le genou. Le genou légèrement fléchi, tends-le complètement en serrant la cuisse, tiens 2 secondes, puis relâche.",
      cue: "On verrouille le genou en serrant la cuisse.",
      err: "Le bassin ne part pas en arrière.",
      tip: "Exercice classique après une chirurgie ou une entorse du genou.",
      stop: "Arrêt si douleur vive au genou." },
    { name: "Marche latérale élastique", group: "hanche", color: 2, kit: ["un élastique"], gear: "elastique", repsLabel: "10 répétitions par côté",
      desc: "Élastique en boucle autour des chevilles, genoux légèrement fléchis, buste un peu penché. Fais un pas sur le côté, puis rapproche l'autre pied sans que l'élastique se détende. 10 pas d'un côté, puis 10 de l'autre.",
      cue: "L'élastique reste tendu, les pieds restent parallèles.",
      err: "Ne te redresse pas entre les pas.",
      tip: "Plus facile : l'élastique au-dessus des genoux.",
      stop: "Arrêt si douleur à la hanche ou au genou." },
    { name: "Goblet squat", group: "genou", color: 2, kit: ["une bouteille de 1,5 L ou un haltère"], gear: "charge", repsLabel: "10 répétitions",
      desc: "Debout, une bouteille d'eau de 1,5 L ou un haltère tenu à deux mains contre la poitrine. Descends en squat, buste droit, coudes entre les genoux, puis remonte en poussant dans les talons.",
      cue: "La charge reste collée à la poitrine, buste droit.",
      err: "Les talons ne décollent pas.",
      tip: "La charge devant aide à garder le buste droit.",
      stop: "Arrêt si douleur vive au genou ou au bas du dos." },
    { name: "Soulevé de terre roumain avec charge", group: "ischio", color: 2, kit: ["deux bouteilles ou haltères"], gear: "charge", repsLabel: "10 répétitions",
      desc: "Debout, une charge dans chaque main, genoux légèrement fléchis. Bascule le buste en reculant les fesses, charges qui glissent le long des cuisses, dos plat, jusqu'à sentir l'étirement derrière les cuisses, puis remonte en serrant les fessiers.",
      cue: "Les charges frôlent les jambes, le dos reste plat.",
      err: "Ne courbe pas le dos pour descendre plus bas.",
      tip: "Un sac à dos lesté tenu à deux mains fonctionne aussi.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Développé épaules assis", group: "epaule", color: 2, kit: ["une chaise", "deux bouteilles ou haltères"], gear: "charge", repsLabel: "10 répétitions",
      desc: "Assis droit sur une chaise, une charge dans chaque main à hauteur d'épaules. Pousse vers le plafond jusqu'à avoir les bras presque tendus, puis redescends lentement.",
      cue: "Le dos reste contre le dossier, on pousse droit vers le haut.",
      err: "Ne cambre pas le bas du dos en poussant.",
      tip: "Plus facile : un bras à la fois.",
      stop: "Arrêt si douleur ou accrochage dans l'épaule." },
    { name: "Fente avec charge", group: "genou", color: 3, kit: ["deux bouteilles ou haltères"], gear: "charge", repsLabel: "8 répétitions par jambe",
      desc: "Debout, une charge dans chaque main, bras le long du corps. Fais un grand pas en avant et descends jusqu'à ce que les deux genoux soient à 90°, puis reviens en poussant sur la jambe avant.",
      cue: "Buste droit, le poids sur la jambe avant.",
      err: "Le genou avant reste au-dessus du pied.",
      tip: "Maîtrise d'abord la fente sans charge.",
      stop: "Arrêt si douleur vive au genou ou perte d'équilibre." },
    { name: "Hip thrust lesté", group: "hanche", color: 3, kit: ["un canapé", "une charge (sac lesté ou haltère)"], gear: "charge", repsLabel: "10 répétitions",
      desc: "Le haut du dos sur le bord d'un canapé, une charge posée sur le bassin et tenue à deux mains. Monte le bassin jusqu'à aligner épaules, hanches et genoux, serre les fessiers 2 secondes, puis redescends lentement.",
      cue: "Menton rentré, on pousse dans les talons.",
      err: "On ne cambre pas en haut : les côtes restent basses.",
      tip: "Une serviette pliée sous la charge protège le bassin.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Élévation du bâton bras tendus", group: "epaule", color: 1, kit: ["un bâton ou un manche à balai"], repsLabel: "10 répétitions",
      desc: "Debout, pieds largeur de hanches, le bâton tenu à deux mains devant les cuisses, mains un peu plus écartées que les épaules. Monte le bâton bras tendus jusqu'au-dessus de la tête, aussi haut que possible sans douleur, puis redescends lentement.",
      cue: "Bras tendus, les côtes restent basses.",
      err: "Ne cambre pas le bas du dos pour monter plus haut.",
      tip: "Plus facile : monte seulement jusqu'à hauteur des yeux. Plus dur : tiens 3 secondes en haut.",
      stop: "Arrêt si douleur ou accrochage dans l'épaule." },
    { name: "Rotation du buste bâton sur les épaules", group: "mobilite", color: 1, kit: ["un bâton ou un manche à balai"], repsLabel: "10 répétitions par côté",
      desc: "Debout, pieds un peu écartés, genoux souples, le bâton posé derrière la nuque sur le haut des épaules, tenu à deux mains. Tourne le buste d'un côté, en douceur, le bassin reste face à l'avant, puis reviens au centre et tourne de l'autre côté.",
      cue: "Le bassin reste face à l'avant, seul le buste tourne.",
      err: "Ne force pas en fin de mouvement : la rotation reste confortable.",
      tip: "Plus facile : assis sur une chaise, le bassin est bloqué.",
      stop: "Arrêt si douleur dans le dos ou la nuque." },
    { name: "Good morning au bâton", group: "ischio", color: 2, kit: ["un bâton ou un manche à balai"], repsLabel: "10 répétitions",
      desc: "Debout, pieds largeur de hanches, genoux légèrement fléchis, le bâton posé derrière la nuque. Bascule le buste en avant en reculant les fesses, dos bien droit, jusqu'à sentir l'étirement derrière les cuisses, puis redresse-toi en serrant les fessiers.",
      cue: "Le bâton reste collé à la nuque, le dos reste droit.",
      err: "Ne plie pas le dos : ce sont les hanches qui plient.",
      tip: "Le bâton aide à sentir si le dos reste droit. Descends seulement jusqu'où le dos reste plat.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Serrage de ballon entre les genoux", group: "hanche", color: 1, kit: ["une chaise", "un ballon ou un coussin"], repsLabel: "10 répétitions",
      desc: "Assis droit sur une chaise, pieds à plat, un ballon (ou un coussin roulé) entre les genoux. Serre le ballon fort pendant 5 secondes, puis relâche doucement.",
      cue: "On serre avec l'intérieur des cuisses, le dos reste droit.",
      err: "Ne bloque pas la respiration en serrant.",
      tip: "Très bien toléré en cas de douleur de hanche ou de pubis. Plus dur : serre 10 secondes.",
      stop: "Arrêt si douleur à l'aine ou au pubis." },
    { name: "Pont avec ballon entre les genoux", group: "hanche", color: 2, kit: ["un tapis", "un ballon ou un coussin"], repsLabel: "12 répétitions",
      desc: "Allongé sur le dos, genoux pliés, pieds à plat, un ballon entre les genoux. Serre le ballon et monte le bassin jusqu'à aligner épaules, hanches et genoux, tiens 2 secondes, puis redescends lentement sans lâcher le ballon.",
      cue: "On serre le ballon pendant toute la montée.",
      err: "Ne cambre pas en haut : les fessiers font le travail.",
      tip: "Le ballon active aussi l'intérieur des cuisses et garde les genoux alignés.",
      stop: "Arrêt si douleur au bas du dos ou à l'aine." },
    { name: "Squat ballon bras tendus", group: "genou", color: 2, kit: ["un ballon"], repsLabel: "12 répétitions",
      desc: "Debout, pieds largeur d'épaules, un ballon tenu contre la poitrine. Descends en squat en tendant les bras devant toi avec le ballon, puis remonte en ramenant le ballon contre la poitrine.",
      cue: "Le ballon part devant, les fesses partent en arrière.",
      err: "Les talons restent au sol, les genoux suivent les pieds.",
      tip: "Les bras tendus aident à garder l'équilibre et le buste droit.",
      stop: "Arrêt si douleur vive au genou." },
    { name: "Tirage serviette au-dessus de la tête", group: "tirage", color: 1, kit: ["une serviette"], repsLabel: "12 répétitions",
      desc: "Debout, une serviette tendue entre les mains au-dessus de la tête, mains larges. Tire la serviette vers le bas, derrière la tête ou devant le visage, en écartant fort les mains et en ramenant les coudes vers les côtes, puis remonte.",
      cue: "On tire comme pour déchirer la serviette.",
      err: "Ne pousse pas la tête en avant.",
      tip: "Plus la serviette est tirée fort, plus le dos travaille.",
      stop: "Arrêt si douleur dans l'épaule." },
    { name: "Écartement de serviette bras tendus", group: "tirage", color: 1, kit: ["une serviette"], repsLabel: "8 répétitions",
      desc: "Debout, bras tendus devant toi à hauteur des épaules, une serviette tenue à deux mains. Tire sur la serviette comme pour l'écarter, pendant 5 secondes, en serrant les omoplates, puis relâche.",
      cue: "Les épaules restent basses, les omoplates se rapprochent.",
      err: "Ne hausse pas les épaules.",
      tip: "Exercice discret, faisable aussi assis au bureau.",
      stop: "Arrêt si douleur dans l'épaule ou la nuque." },
    { name: "Élévation frontale avec bouteilles", group: "epaule", color: 1, kit: ["deux bouteilles d'eau"], gear: "charge", repsLabel: "10 répétitions",
      desc: "Debout, une bouteille d'eau dans chaque main, bras le long du corps. Monte les bras tendus devant toi jusqu'à hauteur des épaules, tiens 1 seconde, puis redescends lentement.",
      cue: "On monte jusqu'aux épaules, pas plus haut.",
      err: "Ne te balance pas en arrière pour monter.",
      tip: "Plus facile : un bras à la fois, ou des bouteilles plus petites.",
      stop: "Arrêt si douleur dans l'épaule." },
    { name: "Squat et développé avec bouteilles", group: "cardio", color: 3, kit: ["deux bouteilles d'eau"], gear: "charge", repsLabel: "10 répétitions",
      desc: "Debout, une bouteille dans chaque main à hauteur des épaules. Descends en squat, puis remonte en poussant les bouteilles au-dessus de la tête dans le même élan. Ramène les bouteilles aux épaules en redescendant.",
      cue: "Les jambes lancent le mouvement, les bras finissent.",
      err: "Ne cambre pas le dos en poussant vers le haut.",
      tip: "Un mouvement complet qui fait monter le cœur. Plus facile : sans bouteilles.",
      stop: "Arrêt si douleur à l'épaule, au genou ou au dos." },
    { name: "Marche du fermier sur place", group: "gainage", color: 2, kit: ["deux bouteilles d'eau ou deux sacs"], gear: "charge", repsLabel: "40 secondes",
      desc: "Debout, une charge dans chaque main (bouteilles, sacs de courses), bras le long du corps. Marche sur place, ou dans le couloir, en restant bien grand, épaules basses et ventre gainé.",
      cue: "Grand et droit, comme si on te tirait par le haut de la tête.",
      err: "Ne penche pas d'un côté.",
      tip: "Le même exercice avec une seule charge travaille encore plus le côté du tronc.",
      stop: "Arrêt si douleur dans le dos ou les épaules." },
    { name: "Relevé de jambe tendue couché", group: "genou", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions par jambe",
      desc: "Allongé sur le dos, une jambe pliée pied à plat, l'autre tendue au sol. Contracte la cuisse de la jambe tendue, pointe de pied vers toi, et monte-la jusqu'à hauteur du genou plié, tiens 1 seconde puis redescends lentement.",
      cue: "Le genou reste bien tendu pendant toute la montée.",
      err: "Le dos reste collé au sol.",
      tip: "Un grand classique après une opération du genou. Plus dur : un poids léger à la cheville.",
      stop: "Arrêt si douleur au genou ou au bas du dos." },
    { name: "Talons-fesses debout", group: "ischio", color: 1, kit: ["un mur ou un dossier de chaise"], repsLabel: "12 répétitions par jambe",
      desc: "Debout face à un mur, mains en appui. Plie un genou pour amener le talon vers la fesse, la cuisse reste à la verticale, puis redescends lentement.",
      cue: "Les deux genoux restent côte à côte.",
      err: "Ne cambre pas le dos pour monter le talon plus haut.",
      tip: "Plus dur : une bouteille coincée derrière le genou ou un poids à la cheville.",
      stop: "Arrêt si crampe ou douleur derrière le genou." },
    { name: "Toucher d'épaule en planche", group: "gainage", color: 3, kit: ["un tapis"], repsLabel: "30 secondes",
      desc: "En planche sur les mains, bras tendus, pieds un peu écartés, corps aligné. Touche l'épaule opposée avec une main, repose-la, puis l'autre, sans laisser le bassin tourner.",
      cue: "Le bassin ne bouge pas, comme un verre d'eau posé sur le dos.",
      err: "Ne remonte pas les fesses.",
      tip: "Plus facile : genoux au sol, ou mains sur une table.",
      stop: "Arrêt si douleur au poignet, à l'épaule ou au bas du dos." },
    { name: "Crunch inversé", group: "gainage", color: 2, kit: ["un tapis"], repsLabel: "10 répétitions",
      desc: "Allongé sur le dos, bras le long du corps, hanches et genoux pliés à 90°. Ramène les genoux vers la poitrine en enroulant le bassin pour le décoller un peu du sol, puis redescends lentement.",
      cue: "On enroule le bas du dos, sans élan.",
      err: "Ne lance pas les jambes : le mouvement est petit et contrôlé.",
      tip: "Ménage la nuque mieux que le crunch classique.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Fente arrière et montée de genou", group: "genou", color: 3, kit: [], repsLabel: "8 répétitions par jambe",
      desc: "Debout, fais une fente arrière jusqu'à ce que les deux genoux soient à 90°, puis remonte en poussant sur la jambe avant et ramène directement le genou arrière vers le haut, devant toi. Repose le pied et recommence.",
      cue: "On remonte d'un seul élan jusqu'au genou haut.",
      err: "Le genou avant reste dans l'axe du pied.",
      tip: "Travaille la force et l'équilibre en même temps. Plus facile : sans la montée de genou.",
      stop: "Arrêt si douleur au genou ou perte d'équilibre." },
    { name: "Squat ballon dans le dos contre le mur", group: "genou", color: 1, kit: ["un mur", "un ballon"], repsLabel: "12 répétitions",
      desc: "Dos au mur, un ballon coincé entre le bas du dos et le mur, pieds un pas devant toi, largeur de hanches. Descends en squat en laissant le ballon rouler le long du dos, jusqu'à ce que les cuisses soient presque horizontales, puis remonte en poussant dans les talons.",
      cue: "Le ballon guide le mouvement : le dos reste droit.",
      err: "Les genoux restent dans l'axe des pieds.",
      tip: "Parfait pour reprendre le squat en confiance. Plus facile : descends moins bas.",
      stop: "Arrêt si douleur vive au genou." },
    { name: "Marche talon-pointe livre sur la tête", group: "equilibre", color: 2, kit: ["un livre léger ou un coussin plat"], repsLabel: "30 secondes",
      desc: "Un livre léger posé à plat sur la tête, marche lentement en ligne droite en posant le talon d'un pied juste devant les orteils de l'autre. Regarde droit devant, bras légèrement écartés.",
      cue: "Grand et droit : le livre ne doit pas tomber.",
      err: "Ne regarde pas tes pieds.",
      tip: "Le livre oblige à garder la tête droite et la posture haute. Fais-le le long d'un mur ou d'un plan de travail.",
      stop: "Arrêt en cas de vertige." },
    { name: "Le bûcheron avec ballon", group: "gainage", color: 2, kit: ["un ballon ou une bouteille"], repsLabel: "10 répétitions par côté",
      desc: "Debout, pieds écartés, un ballon tenu à deux mains au-dessus d'une épaule. Descends en diagonale, en pliant les genoux, pour amener le ballon près du genou opposé, comme pour donner un coup de hache, puis remonte en haut. Toutes les répétitions d'un côté, puis l'autre.",
      cue: "Le mouvement part des jambes et du tronc, pas seulement des bras.",
      err: "Ne tourne pas le dos rond : le buste pivote, les genoux plient.",
      tip: "Un mouvement complet, proche des gestes du jardinage.",
      stop: "Arrêt si douleur au dos ou à l'épaule." },
    { name: "Le boxeur", group: "cardio", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout, pieds décalés, genoux souples, poings à hauteur du menton. Frappe droit devant toi en alternant gauche et droite, en tournant légèrement le buste, puis ramène aussitôt le poing en garde.",
      cue: "On frappe vite et on revient en garde.",
      err: "Ne verrouille pas le coude en fin de coup.",
      tip: "Excellent pour le souffle et les épaules, sans impact pour les articulations. Plus dur : petites bouteilles dans les mains.",
      stop: "Arrêt si douleur à l'épaule ou essoufflement important." },
    { name: "Le nageur", group: "dos", color: 2, kit: ["un tapis"], repsLabel: "30 secondes",
      desc: "Allongé sur le ventre, front au-dessus du sol, bras tendus devant. Décolle légèrement bras et jambes, puis fais des battements alternés, comme en nageant le crawl : un bras devant pendant que l'autre descend vers la hanche.",
      cue: "Petits mouvements, le regard vers le sol.",
      err: "Ne relève pas la tête : la nuque reste dans l'axe.",
      tip: "Renforce tout l'arrière du corps, du dos aux fessiers.",
      stop: "Arrêt si douleur au bas du dos ou à la nuque." },
    { name: "Le grimpeur debout", group: "cardio", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout, fais comme si tu grimpais à une échelle : un bras monte au-dessus de la tête pendant que le genou opposé monte devant toi, puis on alterne, à un rythme régulier.",
      cue: "Bras et genou opposés montent ensemble.",
      err: "Reste grand, sans te pencher en arrière.",
      tip: "Coordination et souffle en même temps. Plus facile : sans lever les genoux.",
      stop: "Arrêt si vertige ou essoufflement important." },
    { name: "Position du skieur", group: "genou", color: 2, kit: [], repsLabel: "30 secondes",
      desc: "Debout, pieds largeur de hanches, plie les genoux et bascule le buste en avant comme un skieur en descente, fesses en arrière, bras devant toi. Tiens la position en respirant calmement.",
      cue: "Le poids reste sur tout le pied, genoux au-dessus des orteils.",
      err: "Garde le dos plat.",
      tip: "Comme la chaise contre le mur, mais sans mur : l'équilibre travaille en plus.",
      stop: "Arrêt si douleur vive au genou." },
    { name: "Passage genou au sol", group: "mobilite", color: 2, kit: ["un tapis ou un coussin pour le genou"], repsLabel: "6 répétitions par genou",
      desc: "Debout, fais un grand pas en arrière et pose doucement un genou au sol, sur un coussin, l'autre pied à plat devant. Installe-toi une seconde, puis relève-toi en poussant sur la jambe avant. Toutes les répétitions d'un côté, puis l'autre.",
      cue: "On descend et on remonte en contrôle, sans se laisser tomber.",
      err: "Le genou avant reste au-dessus du pied.",
      tip: "C'est la première étape pour savoir se relever du sol. Garde une chaise à côté de toi comme appui.",
      stop: "Arrêt si douleur au genou posé au sol." },
    { name: "Le chef d'orchestre", group: "equilibre", color: 2, kit: ["un appui à portée de main"], repsLabel: "30 secondes par pied",
      desc: "Debout sur un pied, l'autre genou légèrement levé. Fais de grands mouvements de bras dans toutes les directions, comme un chef d'orchestre, sans poser le pied.",
      cue: "Les bras bougent, la jambe d'appui tient.",
      err: "Le genou d'appui reste légèrement fléchi.",
      tip: "Les bras qui bougent déséquilibrent le corps : la cheville et la hanche apprennent à corriger. Reste près d'un mur.",
      stop: "Arrêt en cas de vertige." },
    { name: "Superman serviette", group: "tirage", color: 2, kit: ["un tapis", "une serviette"], repsLabel: "10 répétitions",
      desc: "Allongé sur le ventre, une serviette tendue entre les mains, bras tendus devant. Décolle légèrement les bras et tire la serviette vers tes épaules en ramenant les coudes vers les côtes, puis retends les bras devant, sans toucher le sol.",
      cue: "On tire sur la serviette pour la garder tendue.",
      err: "Le regard reste vers le sol.",
      tip: "Renforce le haut du dos et le grand dorsal, contre le dos voûté.",
      stop: "Arrêt si douleur au bas du dos, à la nuque ou à l'épaule." },
    { name: "Squat sumo ballon au sol", group: "hanche", color: 1, kit: ["un ballon"], repsLabel: "12 répétitions",
      desc: "Debout, pieds bien écartés et pointes vers l'extérieur, un ballon contre la poitrine. Descends en squat jusqu'à poser le ballon au sol entre tes pieds, puis remonte en serrant les fessiers.",
      cue: "Les genoux suivent la direction des pieds.",
      err: "Le dos reste plat en descendant le ballon.",
      tip: "Plus facile : touche une chaise ou une pile de livres au lieu du sol.",
      stop: "Arrêt si douleur au genou ou au bas du dos." },
    { name: "Rotation ballon assis", group: "gainage", color: 1, kit: ["une chaise", "un ballon ou une bouteille"], repsLabel: "10 répétitions par côté",
      desc: "Assis au bord d'une chaise, dos droit, un ballon tenu à deux mains devant la poitrine. Tourne le buste d'un côté en emmenant le ballon, le bassin reste face à l'avant, puis reviens au centre et tourne de l'autre côté.",
      cue: "Le bassin reste immobile, seul le buste tourne.",
      err: "Ne t'affaisse pas : reste grand.",
      tip: "Un gainage doux, faisable même quand la station debout est difficile.",
      stop: "Arrêt si douleur dans le dos." },
    { name: "Élévation des talons bras au plafond", group: "mollet", color: 1, kit: [], repsLabel: "12 répétitions",
      desc: "Debout, pieds largeur de hanches, bras tendus au-dessus de la tête. Monte sur la pointe des pieds en te grandissant au maximum, tiens 1 seconde, puis redescends lentement.",
      cue: "On se grandit de la pointe des pieds jusqu'au bout des doigts.",
      err: "Ne cambre pas le dos.",
      tip: "Mollets, équilibre et posture en un seul geste. Plus facile : une main sur un mur.",
      stop: "Arrêt si crampe au mollet ou vertige." },
    { name: "Fente avant et rotation ballon", group: "genou", color: 3, kit: ["un ballon ou une bouteille"], repsLabel: "8 répétitions par jambe",
      desc: "Debout, un ballon tenu devant la poitrine. Fais une grande fente avant et, en bas, tourne le buste vers la jambe avant en emmenant le ballon, puis reviens au centre et remonte. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "On descend d'abord, puis on tourne.",
      err: "Le genou avant reste dans l'axe du pied pendant la rotation.",
      tip: "Force, équilibre et rotation du tronc ensemble. Maîtrise d'abord la fente seule.",
      stop: "Arrêt si douleur au genou ou au dos." }
  ];

  var FULL = null;
  // Toute la bibliothèque (fiches d'origine + modifications publiées par le kiné) ; withHidden : y compris les masqués
  function all(withHidden) {
    if (!FULL) {
      FULL = []; var seen = {}, src = window.KineOfficiel ? KineOfficiel.orig : (typeof SEQ_DAYS !== "undefined" ? SEQ_DAYS : {});
      Object.keys(src).forEach(function (id) {
        src[id].exercises.forEach(function (ex, i) {
          var t = TAGS[ex.name]; if (!t || seen[ex.name]) return; seen[ex.name] = 1;
          FULL.push({ name: ex.name, group: t[0], color: t[1], base: t[1], repsLabel: ex.repsLabel, desc: ex.desc, tip: ex.tip, stop: ex.stop, day: id, idx: i,
                      kit: window.KF && KF.kitFor ? KF.kitFor({ exercises: [ex] }) : [] });
        });
      });
      NEW.forEach(function (e) { var c = JSON.parse(JSON.stringify(e)); c.isNew = true; c.base = e.color; FULL.push(c); });
      // Exercices créés par le kiné et publiés
      var cu = window.KineOfficiel && KineOfficiel.customs ? KineOfficiel.customs() : {};
      Object.keys(cu).forEach(function (n) { var c = JSON.parse(JSON.stringify(cu[n].fiche)); c.isNew = true; c.custom = true; c.base = c.color; c.kit = c.kit || []; FULL.push(c); });
      if (window.KineOfficiel) FULL.forEach(function (e) { KineOfficiel.patch(e); });
    }
    return withHidden ? FULL : FULL.filter(function (e) { return !(window.KineOfficiel && KineOfficiel.hidden(e.name)); });
  }
  // Exercices ajoutés par d'autres modules (ex. exercices réactifs) : ils rejoignent la bibliothèque et « Ma séance »
  function extend(list) { list.forEach(function (e) { if (!NEW.some(function (x) { return x.name === e.name; })) NEW.push(e); }); FULL = null; }
  function find(name) { var a = all(true); for (var i = 0; i < a.length; i++) if (a[i].name === name) return a[i]; return null; }

  // Couleur du moment : la base, +1 si l'exercice est passé en tempo lent (charges progressives)
  function color(name) {
    var e = find(name); if (!e) return 0;
    var c = e.color + (window.KineLevel && KineLevel.tempo(name) ? 1 : 0);
    return Math.min(3, c);
  }
  function dot(c) { return "<i class='kb-dot c" + c + "' aria-label='" + (COLORS[c] ? COLORS[c][1] : "") + "'></i>"; }

  // Les points clés et erreurs des nouveaux exercices rejoignent ceux de l'appli
  function wire() {
    NEW.forEach(function (e) {
      if (window.KF_CUES && e.cue && !KF_CUES[e.name]) KF_CUES[e.name] = e.cue;
      if (window.KineMascotte && KineMascotte.errors && e.err && !KineMascotte.errors[e.name]) KineMascotte.errors[e.name] = e.err;
    });
  }

  /* ════════ Écran : la bibliothèque ════════ */
  var filter = "";
  function sheet() {
    var el = $("kb-sheet");
    if (!el) { el = document.createElement("div"); el.id = "kb-sheet"; el.className = "kf-sheet"; el.setAttribute("role", "dialog"); document.body.appendChild(el); }
    return el;
  }
  function open(g) {
    wire();
    if (g != null) filter = g;
    var list = all().filter(function (e) { return !filter || e.group === filter; });
    var chips = "<button class='kb-chip" + (!filter ? " on" : "") + "' onclick='KineBiblio.open(\"\")'>Tous</button>" +
      GROUPS.map(function (gr) {
        var n = all().filter(function (e) { return e.group === gr[0]; }).length; if (!n) return "";
        return "<button class='kb-chip" + (filter === gr[0] ? " on" : "") + "' onclick='KineBiblio.open(\"" + gr[0] + "\")'>" + esc(gr[1]) + " <small>" + n + "</small></button>";
      }).join("");
    var rows = GROUPS.map(function (gr) {
      var items = list.filter(function (e) { return e.group === gr[0]; }).sort(function (a, b) { return a.color - b.color; });
      if (!items.length) return "";
      return "<div class='kf-phase' style='color:var(--text2)'>" + esc(gr[1]) + "</div>" + items.map(function (e) {
        var thumb = e.thumb || (window.KineAvatar && KineAvatar.supports(e.name) ? KineAvatar.snapshot(e.name, 104) : null), c = color(e.name);
        return "<button class='pg-ex kb-ex' onclick='KineBiblio.demo(" + JSON.stringify(e.name).replace(/'/g, "&#39;") + ")'>" +
          (thumb ? "<img src='" + thumb + "' alt=''>" : "<span class='pg-fig' aria-hidden='true'></span>") +
          "<span class='pg-day-t'><b>" + dot(c) + esc(e.name) + "</b><span>" + (e.isNew ? "<em class='kb-new'>Nouveau</em> " : "") + esc(COLORS[c][1]) + ", " + esc(e.repsLabel) + (e.kit && e.kit.length ? ", " + esc(e.kit.join(", ")) : "") + "</span></span><span class='pg-chev' aria-hidden='true'>›</span></button>";
      }).join("");
    }).join("");
    var el = sheet();
    el.innerHTML = "<div class='kf-sheet-body'><button class='kf-back' onclick='KineBiblio.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Bibliothèque d'exercices</div><div class='kf-sub'>" + all().length + " exercices, classés par groupe musculaire</div></div>" +
      "<div class='kb-legend'>" + dot(1) + "Facile " + dot(2) + "Intermédiaire " + dot(3) + "Difficile</div>" +
      "<div class='kb-note'>La façon de faire compte : un tempo lent, un maintien, une jambe à la fois ou une charge rendent l'exercice plus difficile.</div>" +
      "<div class='kb-chips'>" + chips + "</div>" + rows + "</div>";
    el.classList.add("open");
  }

  /* ── Recherche et filtres, partagés par la bibliothèque, la création de séance et « Ma séance » ── */
  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " "); }
  function gname(id) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i][0] === id) return GROUPS[i][1]; return ""; }
  function isReact(e) { return !!(e && (e.reactif || e.group === "reactif")); }
  // Texte dans lequel on cherche : nom, groupe musculaire, type, et quelques mots courants
  function hay(e) { var c = color(e.name); return norm([e.name, gname(e.group), isReact(e) ? "reactif reactivite couleurs reflexe" : "classique", COLORS[c] ? COLORS[c][1] : "", e.kit && e.kit.join ? e.kit.join(" ") : ""].join(" ")); }
  var FILTERS = [["", "Tous"], ["reactif", "Réactifs"], ["classique", "Classiques"], ["c1", "Faciles"], ["c2", "Intermédiaires"], ["c3", "Difficiles"]];
  var SVG_S = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' aria-hidden='true'><circle cx='11' cy='11' r='7'/><path d='m20 20-3.5-3.5'/></svg>";
  // Barre de recherche + puces de filtre. ns : nom de l'objet global qui reçoit q(texte) et f(filtre)
  function searchUI(ns, q, f, ph, noChips) {
    var qa = esc(q || "").replace(/'/g, "&#39;");
    return "<div class='kf-find'><label class='kf-search'>" + SVG_S + "<input type='search' enterkeyhint='search' autocomplete='off' placeholder='" + esc(ph || "Rechercher un exercice") + "' value='" + qa + "' oninput='" + ns + ".q(this.value)'>" +
      "<button type='button' class='kf-clear' aria-label='Effacer' onclick='" + ns + ".q(\"\");this.parentNode.querySelector(\"input\").value=\"\"'" + (q ? "" : " hidden") + ">✕</button></label>" +
      (noChips ? "" : "<div class='kf-fchips' role='group' aria-label='Filtrer'>" + FILTERS.map(function (x) {
        return "<button type='button' class='" + ((f || "") === x[0] ? "on" : "") + "' onclick='" + ns + ".f(\"" + x[0] + "\")'>" + (x[0].length === 2 ? "<i class='kb-dot " + x[0] + "'></i>" : "") + x[1] + "</button>";
      }).join("") + "</div>") + "</div>";
  }
  function setChips(root, f) { if (root) [].forEach.call(root.querySelectorAll(".kf-fchips button"), function (b) { b.classList.toggle("on", (b.getAttribute("onclick").match(/f\("([^"]*)"\)/) || [])[1] === (f || "")); }); }
  function matches(e, q, f) {
    if (f === "reactif" && !isReact(e)) return false;
    if (f === "classique" && isReact(e)) return false;
    if (f && f.charAt(0) === "c" && f.length === 2 && String(color(e.name)) !== f.charAt(1)) return false;
    var words = norm(q).split(/\s+/).filter(Boolean); if (!words.length) return true;
    var h = hay(e); return words.every(function (w) { return h.indexOf(w) >= 0 || h.indexOf(w.replace(/s$/, "")) >= 0; });
  }
  // Masque les éléments qui ne correspondent pas (chaque élément porte data-n = nom de l'exercice) et les titres de groupe vides
  function applyFind(root, itemSel, q, f, emptyMsg) {
    if (!root) return 0;
    var n = 0;
    [].forEach.call(root.querySelectorAll(itemSel), function (it) { var e = find(it.getAttribute("data-n")), ok = !e || matches(e, q, f); it.hidden = !ok; if (ok) n++; });
    [].forEach.call(root.querySelectorAll("[data-grp]"), function (h) { var g = h.getAttribute("data-grp"); h.hidden = ![].some.call(root.querySelectorAll("[data-ing='" + g + "']"), function (x) { return !x.hidden; }); });
    var cl = root.querySelector(".kf-clear"); if (cl) cl.hidden = !q;
    var em = root.querySelector(".kf-none"); if (!em && emptyMsg !== false) { em = document.createElement("p"); em.className = "kf-none"; var anchor = root.querySelector(".kf-find"); if (anchor) anchor.insertAdjacentElement("afterend", em); }
    if (em) { em.hidden = n > 0; em.textContent = "Aucun exercice ne correspond. Essaie un autre mot, ou retire le filtre."; }
    return n;
  }
  function close() { var el = $("kb-sheet"); if (el) el.classList.remove("open"); }
  function demo(name) {
    var e = find(name); if (!e) return;
    if (e.reactif && window.KineReactif) { KineReactif.open(e.reactif); return; }
    wire();
    var cur = e.day && typeof SEQ_DAYS !== "undefined" && SEQ_DAYS[e.day] && SEQ_DAYS[e.day].exercises[e.idx];
    if (cur && cur.name === e.name && typeof openDemo === "function") { openDemo(e.day, e.idx); return; }
    if (typeof openDemoEx === "function") openDemoEx(e);
  }

  return { searchUI: searchUI, setChips: setChips, matches: matches, applyFind: applyFind, isReact: isReact, groupName: gname, norm: norm,
           groups: GROUPS, colors: COLORS, all: all, find: find, extend: extend, color: color, open: open, close: close, demo: demo, wire: wire, NEW: NEW,
           reset: function () { FULL = null; }, baseColor: function (n) { var e = find(n); return e ? e.base : 0; } };
})();
window.KineBiblio = KineBiblio;
document.addEventListener("DOMContentLoaded", function () { setTimeout(KineBiblio.wire, 0); });
