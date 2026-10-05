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
    ["genou", "Genou et quadriceps"], ["hanche", "Hanche et fessiers"], ["ischio", "Ischio-jambiers"], ["mollet", "Mollets et cheville"],
    ["dos", "Dos bas"], ["gainage", "Gainage"], ["epaule", "Épaules"], ["poussee", "Poussée"], ["tirage", "Tirage et dos haut"],
    ["bras", "Bras"], ["equilibre", "Équilibre"], ["mobilite", "Mobilité"], ["cardio", "Cardio doux"]
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
      desc: "Assis au bord d'une chaise, pieds à plat largeur de hanches, bras tendus devant. Penchez le buste en avant, levez-vous en poussant dans les talons jusqu'à être bien droit, puis rasseyez-vous lentement, sans vous laisser tomber.",
      cue: "Le nez passe au-dessus des orteils, puis on pousse dans les talons.",
      err: "Ne vous laissez pas tomber sur la chaise : la descente se contrôle.",
      tip: "Plus facile : une chaise plus haute ou un coussin. Plus dur : descente en 3 secondes, sans toucher la chaise.",
      stop: "Arrêt si douleur vive au genou ou vertige en vous levant." },
    { name: "Extension de genou assis", group: "genou", color: 1, kit: ["une chaise"], repsLabel: "12 répétitions par jambe",
      desc: "Assis au fond de la chaise, dos droit, mains sur les bords de l'assise. Tendez une jambe jusqu'à l'horizontale, pointe de pied vers vous, tenez 1 seconde puis redescendez lentement. Toutes les répétitions d'un côté, puis l'autre.",
      cue: "Jambe bien tendue, pointe de pied vers vous.",
      err: "Le dos reste contre le dossier : on ne bascule pas en arrière pour lever la jambe.",
      tip: "Plus dur : une bouteille d'eau ou un sac léger accroché à la cheville.",
      stop: "Arrêt si douleur sous la rotule qui augmente." },
    { name: "Fente arrière", group: "genou", color: 2, kit: [], repsLabel: "8 répétitions par jambe",
      desc: "Debout, pieds largeur de hanches. Faites un grand pas en arrière et descendez jusqu'à ce que les deux genoux soient à 90°, genou arrière près du sol, buste droit. Poussez sur la jambe avant pour revenir. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "Le poids reste sur la jambe avant.",
      err: "Le genou avant reste au-dessus du pied, il ne part pas vers l'intérieur.",
      tip: "Souvent mieux tolérée que la fente avant pour les genoux. Tenez une chaise si l'équilibre est précaire.",
      stop: "Arrêt si douleur vive au genou ou à la hanche." },
    { name: "Squat bulgare", group: "genou", color: 3, kit: ["une chaise"], repsLabel: "8 répétitions par jambe",
      desc: "Dos à une chaise calée contre un mur, posez le dessus d'un pied sur l'assise derrière vous, le pied avant un grand pas devant. Descendez en fléchissant le genou avant jusqu'à ce que la cuisse soit presque horizontale, buste légèrement penché, puis remontez en poussant dans le talon avant.",
      cue: "Le genou avant reste dans l'axe du pied, on pousse dans le talon.",
      err: "Ne poussez pas avec la jambe arrière : elle sert seulement d'appui.",
      tip: "Plus facile : amplitude réduite, ou une main sur un appui stable.",
      stop: "Arrêt si douleur vive au genou ou à la hanche, ou perte d'équilibre." },
    { name: "Fire hydrant", group: "hanche", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions par côté",
      desc: "À quatre pattes, mains sous les épaules, genoux sous les hanches, dos plat. Levez un genou sur le côté jusqu'à hauteur de hanche, genou fléchi à 90°, tenez 1 seconde puis redescendez lentement.",
      cue: "Le bassin reste horizontal, seul le genou s'ouvre.",
      err: "Ne penchez pas le corps du côté opposé pour monter plus haut.",
      tip: "Mains ou genoux sensibles : un coussin dessous.",
      stop: "Arrêt si douleur dans l'aine ou au bas du dos." },
    { name: "Abduction couché sur le côté", group: "hanche", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions par côté",
      desc: "Allongé sur le côté, tête posée sur le bras, jambe du dessous un peu fléchie. Levez la jambe du dessus, tendue, jusqu'à environ 35°, pointe de pied vers l'avant, puis redescendez lentement.",
      cue: "Le talon mène le mouvement, les orteils ne regardent pas le plafond.",
      err: "Le bassin ne bascule pas en arrière : restez bien sur le côté.",
      tip: "Plus dur : tenue de 3 secondes en haut, ou un poids léger à la cheville.",
      stop: "Arrêt si douleur sur le côté de la hanche qui augmente." },
    { name: "Hip thrust épaules sur canapé", group: "hanche", color: 2, kit: ["un canapé"], repsLabel: "12 répétitions",
      desc: "Le haut du dos appuyé sur le bord d'un canapé, pieds à plat largeur de hanches, genoux fléchis. Montez le bassin jusqu'à aligner épaules, hanches et genoux, serrez les fessiers 2 secondes, puis redescendez lentement sans poser les fesses.",
      cue: "Menton rentré, côtes basses : on ne cambre pas.",
      err: "En haut, les genoux sont à 90° : si ce sont les ischios qui chauffent, rapprochez les pieds.",
      tip: "Plus dur : une jambe à la fois, ou un sac lesté posé sur le bassin.",
      stop: "Arrêt si douleur au bas du dos ou à la nuque." }
    ,
    { name: "Good morning debout", group: "ischio", color: 1, kit: [], repsLabel: "12 répétitions",
      desc: "Debout, pieds largeur de hanches, genoux légèrement fléchis, bras croisés sur la poitrine. Basculez le buste vers l'avant en reculant les fesses, dos bien droit, jusqu'à sentir l'étirement derrière les cuisses, puis redressez-vous en serrant les fessiers.",
      cue: "Les fesses reculent, le dos reste plat.",
      err: "Ne courbez pas le dos : arrêtez la descente dès qu'il veut s'arrondir.",
      tip: "Plus dur : un sac à dos chargé tenu contre la poitrine.",
      stop: "Arrêt si douleur au bas du dos ou douleur qui descend dans la jambe." },
    { name: "Soulevé de terre roumain unipodal", group: "ischio", color: 2, kit: [], repsLabel: "8 répétitions par jambe",
      desc: "Debout sur une jambe, genou légèrement fléchi. Basculez le buste vers l'avant pendant que l'autre jambe recule tendue, jusqu'à ce que buste et jambe soient presque à l'horizontale, bras vers le sol. Remontez en poussant dans le talon. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "Le corps bascule d'un bloc, le bassin reste horizontal.",
      err: "Le bassin ne s'ouvre pas sur le côté : les orteils de la jambe arrière regardent le sol.",
      tip: "Plus facile : une main sur le dossier d'une chaise. Plus dur : une bouteille d'eau dans la main opposée.",
      stop: "Arrêt si douleur au bas du dos ou perte d'équilibre." },
    { name: "Leg curl serviette au sol", group: "ischio", color: 3, kit: ["une serviette"], repsLabel: "8 répétitions",
      desc: "Allongé sur le dos sur un sol lisse, talons posés sur une serviette, bassin décollé. Ramenez les talons vers les fesses en gardant le bassin haut, puis repoussez-les lentement jusqu'à avoir les jambes presque tendues, sans reposer le bassin.",
      cue: "Bassin haut tout le long, on repousse lentement.",
      err: "Ne laissez pas retomber le bassin quand les jambes s'allongent.",
      tip: "Plus facile : reposez le bassin pendant le retour. Plus dur : une jambe à la fois.",
      stop: "Arrêt en cas de crampe ou de douleur vive derrière la cuisse." },
    { name: "Nordic curl assisté", group: "ischio", color: 3, kit: ["un canapé"], repsLabel: "5 répétitions",
      desc: "À genoux sur un coussin, talons bloqués sous un canapé, corps droit des genoux aux épaules. Basculez lentement vers l'avant en freinant avec l'arrière des cuisses, aussi loin que possible, puis rattrapez-vous avec les mains et revenez en vous aidant d'une légère poussée.",
      cue: "Le corps reste droit des genoux à la tête, on freine le plus longtemps possible.",
      err: "Ne cassez pas aux hanches : les fesses ne reculent pas.",
      tip: "Exercice très exigeant : commencez par une petite amplitude.",
      stop: "Arrêt en cas de crampe ou de douleur vive derrière la cuisse." },
    { name: "Marche sur les talons", group: "mollet", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Marchez sur place, ou dans la pièce, sur les talons, pointes de pieds relevées, sans que l'avant du pied touche le sol.",
      cue: "Pointes de pieds bien relevées.",
      err: "Ne penchez pas le buste en arrière pour relever les pieds.",
      tip: "Renforce les releveurs du pied, utiles pour l'équilibre et la prévention des entorses.",
      stop: "Arrêt si douleur sur le devant du tibia." },
    { name: "Élévation des talons genoux fléchis", group: "mollet", color: 2, kit: ["un mur libre"], repsLabel: "15 répétitions",
      desc: "Face au mur, mains en appui, genoux fléchis d'environ 30° et gardés fléchis. Montez sur la pointe des pieds, tenez 1 seconde, puis redescendez lentement.",
      cue: "Les genoux restent pliés : c'est le soléaire qui travaille.",
      err: "Ne tendez pas les genoux en montant.",
      tip: "Complète l'élévation jambes tendues, utile pour le tendon d'Achille.",
      stop: "Arrêt si douleur au tendon d'Achille qui augmente." },
    { name: "Élévation des talons unipodale", group: "mollet", color: 2, kit: ["un mur libre"], repsLabel: "12 répétitions par jambe",
      desc: "Face au mur, mains en appui, sur une jambe, l'autre pied décollé derrière. Montez le plus haut possible sur la pointe, tenez 1 seconde, redescendez lentement. Toutes les répétitions d'une jambe, puis l'autre.",
      cue: "Montez bien haut, le poids sur le gros orteil.",
      err: "La cheville ne part pas vers l'extérieur en montant.",
      tip: "Comparez les deux côtés : un écart net mérite d'être signalé à votre kiné.",
      stop: "Arrêt si douleur au tendon d'Achille ou au mollet." },
    { name: "Excentrique mollet sur marche", group: "mollet", color: 3, kit: ["une marche"], repsLabel: "12 répétitions par jambe",
      desc: "Debout sur une marche, l'avant des pieds sur le bord, talons dans le vide, une main au mur. Montez sur la pointe des deux pieds, levez un pied, puis descendez lentement sur une jambe jusqu'à ce que le talon passe sous le niveau de la marche. Remontez sur les deux pieds.",
      cue: "La descente prend 3 à 4 secondes, sur une seule jambe.",
      err: "On ne remonte pas sur une seule jambe : c'est la descente qui compte.",
      tip: "Utilisé pour le tendon d'Achille (protocole d'Alfredson) : une gêne modérée est acceptée si elle a disparu le lendemain matin.",
      stop: "Arrêt si douleur vive, ou douleur encore présente le lendemain." },
    { name: "Extension lombaire couché sur le ventre", group: "dos", color: 1, kit: ["un tapis"], repsLabel: "10 répétitions",
      desc: "Allongé sur le ventre, mains à plat près des épaules, front au sol. Décollez doucement le buste en gardant le regard vers le sol, tenez 2 secondes, puis reposez-vous. Les bras accompagnent sans pousser fort.",
      cue: "Le regard reste vers le sol, la nuque longue.",
      err: "Ne poussez pas fort sur les bras : ce sont les muscles du dos qui soulèvent.",
      tip: "Plus facile : un coussin sous le ventre. Plus dur : mains sur les tempes.",
      stop: "Arrêt si douleur au bas du dos ou douleur qui descend dans la jambe." },
    { name: "Superman bras-jambe opposés", group: "dos", color: 2, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "Allongé sur le ventre, bras tendus devant. Levez en même temps un bras et la jambe opposée de quelques centimètres, tenez 2 secondes, reposez, puis changez de côté.",
      cue: "Bras et jambe s'allongent plus qu'ils ne montent.",
      err: "Ne relevez pas la tête : le front reste près du sol.",
      tip: "Plus dur : levez les deux bras et les deux jambes ensemble.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Pont en marche", group: "dos", color: 2, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "Allongé sur le dos, genoux fléchis. Montez en pont, puis levez un pied pour amener la cuisse à la verticale, reposez-le, puis l'autre, sans que le bassin ne bascule. Redescendez à la fin.",
      cue: "Le bassin reste horizontal quand le pied se lève.",
      err: "Ne laissez pas tomber la hanche du côté du pied levé.",
      tip: "Plus facile : un petit pont, pieds proches des fesses.",
      stop: "Arrêt si douleur au bas du dos ou crampe derrière la cuisse." },
    { name: "Bear plank", group: "gainage", color: 2, kit: ["un tapis"], repsLabel: "30 secondes",
      desc: "À quatre pattes, mains sous les épaules, pointes de pieds au sol. Décollez les genoux de quelques centimètres et tenez, dos plat, en respirant normalement.",
      cue: "Genoux à 5 cm du sol, dos plat comme une table.",
      err: "Les fesses ne montent pas : elles restent à hauteur des épaules.",
      tip: "Plus facile : 10 secondes de tenue, 5 secondes de repos, et on recommence.",
      stop: "Arrêt si douleur aux poignets ou au bas du dos." },
    { name: "Planche latérale complète", group: "gainage", color: 3, kit: ["un tapis"], repsLabel: "20 secondes par côté",
      desc: "Sur le côté, appui sur l'avant-bras (coude sous l'épaule) et sur les pieds, jambes tendues. Montez les hanches jusqu'à aligner épaule, hanche et cheville, et tenez.",
      cue: "Une ligne droite de la tête aux pieds.",
      err: "Les hanches ne s'affaissent pas et ne partent pas en arrière.",
      tip: "Plus facile : la version sur les genoux.",
      stop: "Arrêt si douleur à l'épaule d'appui." },
    { name: "Mountain climber lent", group: "gainage", color: 3, kit: [], repsLabel: "30 secondes",
      desc: "En planche sur les mains, bras tendus, corps aligné. Amenez lentement un genou vers la poitrine, reposez le pied, puis l'autre, sans bouger le bassin.",
      cue: "Lent et contrôlé : le bassin ne monte pas.",
      err: "Les fesses ne montent pas quand le genou avance.",
      tip: "Plus facile : mains sur une chaise ou un canapé.",
      stop: "Arrêt si douleur aux poignets, aux épaules ou au bas du dos." },
    { name: "Rotation externe couché sur le côté", group: "epaule", color: 1, kit: ["une bouteille d'eau"], repsLabel: "12 répétitions par côté",
      desc: "Allongé sur le côté, coude du dessus collé au flanc et plié à 90°, avant-bras devant le ventre, une petite bouteille d'eau en main. Tournez l'avant-bras vers le plafond en gardant le coude collé, puis redescendez lentement.",
      cue: "Le coude reste collé, seul l'avant-bras tourne.",
      err: "Ne roulez pas le corps vers l'arrière pour monter plus haut.",
      tip: "Une serviette roulée entre le coude et le flanc aide à garder la bonne position.",
      stop: "Arrêt si douleur dans l'épaule qui augmente." },
    { name: "Élévation latérale", group: "epaule", color: 1, kit: ["deux bouteilles d'eau"], repsLabel: "12 répétitions",
      desc: "Debout, une bouteille d'eau dans chaque main, bras le long du corps. Montez les bras sur les côtés jusqu'à hauteur d'épaules, coudes légèrement fléchis, tenez 1 seconde, puis redescendez lentement.",
      cue: "On monte jusqu'aux épaules, pas plus haut.",
      err: "Ne haussez pas les épaules vers les oreilles.",
      tip: "Commencez par des petites bouteilles (50 cl).",
      stop: "Arrêt si douleur ou accrochage dans l'épaule." },
    { name: "Wall slides", group: "epaule", color: 1, kit: ["un mur libre"], repsLabel: "10 répétitions",
      desc: "Dos contre un mur, pieds un peu décollés, bras en W : coudes et dos des mains contre le mur. Faites glisser les bras vers le haut en Y en gardant le contact avec le mur, puis redescendez en W.",
      cue: "Bas du dos, coudes et mains restent contre le mur.",
      err: "Ne cambrez pas pour monter plus haut : on s'arrête quand le contact se perd.",
      tip: "Excellent pour la posture et le dos haut.",
      stop: "Arrêt si douleur ou fourmillements dans le bras." },
    { name: "Élévation en Y", group: "epaule", color: 2, kit: ["deux bouteilles d'eau"], repsLabel: "10 répétitions",
      desc: "Debout, une bouteille dans chaque main, pouces vers le haut. Montez les bras en Y, un peu en avant de la ligne du corps, jusqu'au-dessus de la tête, puis redescendez lentement.",
      cue: "Pouces vers le ciel, les bras forment un Y.",
      err: "Ne cambrez pas le bas du dos en montant.",
      tip: "Plus facile : sans bouteilles, ou jusqu'à hauteur d'épaules seulement.",
      stop: "Arrêt si douleur ou accrochage dans l'épaule." },
    { name: "Pompes contre le mur", group: "poussee", color: 1, kit: ["un mur libre"], repsLabel: "12 répétitions",
      desc: "Face au mur, à un grand pas, mains à plat à hauteur d'épaules un peu plus larges que les épaules. Fléchissez les coudes pour approcher la poitrine du mur, corps droit, puis repoussez.",
      cue: "Le corps reste droit comme une planche.",
      err: "Les coudes ne s'ouvrent pas à l'horizontale : gardez-les à 45° du corps.",
      tip: "Plus dur : reculez les pieds.",
      stop: "Arrêt si douleur à l'épaule ou au poignet." },
    { name: "Pompes inclinées", group: "poussee", color: 2, kit: ["une table ou une chaise stable"], repsLabel: "10 répétitions",
      desc: "Mains sur le bord d'une table solide ou d'une chaise calée contre un mur, corps aligné en planche inclinée. Descendez la poitrine vers le bord en fléchissant les coudes, puis repoussez.",
      cue: "La poitrine descend vers le bord, le corps reste gainé.",
      err: "Le bassin ne s'affaisse pas et les fesses ne montent pas.",
      tip: "Plus le support est bas, plus c'est difficile.",
      stop: "Arrêt si douleur à l'épaule ou au poignet." },
    { name: "Pompes complètes", group: "poussee", color: 3, kit: [], repsLabel: "8 répétitions",
      desc: "En planche sur les mains et les pointes de pieds, mains un peu plus larges que les épaules. Descendez la poitrine près du sol, corps aligné, puis repoussez.",
      cue: "Une seule ligne de la tête aux talons.",
      err: "Le bassin ne s'affaisse pas : serrez fessiers et abdos.",
      tip: "Plus facile : sur les genoux ou mains surélevées.",
      stop: "Arrêt si douleur à l'épaule, au coude ou au poignet." },
    { name: "T au sol", group: "tirage", color: 1, kit: ["un tapis"], repsLabel: "12 répétitions",
      desc: "Allongé sur le ventre, bras écartés en T, pouces vers le haut, front sur une serviette. Décollez les bras du sol en serrant les omoplates, tenez 2 secondes, puis reposez.",
      cue: "On serre les omoplates comme pour tenir un crayon entre elles.",
      err: "Ne haussez pas les épaules vers les oreilles.",
      tip: "Plus dur : tenez une petite bouteille dans chaque main.",
      stop: "Arrêt si douleur dans l'épaule ou la nuque." },
    { name: "Rowing un bras appui chaise", group: "tirage", color: 1, kit: ["une chaise", "une bouteille d'eau"], repsLabel: "10 répétitions par côté",
      desc: "Une main en appui sur l'assise d'une chaise, buste penché et dos plat, une bouteille d'eau dans l'autre main, bras tendu vers le sol. Tirez le coude vers le plafond le long du corps, tenez 1 seconde, puis redescendez lentement.",
      cue: "Le coude monte le long du corps, l'omoplate se rapproche de la colonne.",
      err: "Le buste ne tourne pas pour tirer plus haut.",
      tip: "Plus dur : un sac à dos chargé à la place de la bouteille.",
      stop: "Arrêt si douleur au bas du dos ou à l'épaule." },
    { name: "Rowing deux bras penché", group: "tirage", color: 2, kit: ["deux bouteilles d'eau"], repsLabel: "10 répétitions",
      desc: "Debout, genoux légèrement fléchis, buste penché à environ 45°, dos plat, une bouteille dans chaque main. Tirez les coudes vers l'arrière en serrant les omoplates, tenez 1 seconde, puis redescendez lentement.",
      cue: "Dos plat, on serre les omoplates en haut.",
      err: "Ne redressez pas le buste pour tirer.",
      tip: "Plus facile : buste moins penché.",
      stop: "Arrêt si douleur au bas du dos." },
    { name: "Tirage inversé sous une table", group: "tirage", color: 3, kit: ["une table très solide"], repsLabel: "8 répétitions",
      desc: "Allongé sous une table très solide, mains au bord du plateau, talons au sol, corps aligné. Tirez la poitrine vers la table en gardant le corps droit, puis redescendez lentement.",
      cue: "Le corps monte d'un bloc, comme une planche.",
      err: "Le bassin ne reste pas au sol : on garde l'alignement.",
      tip: "Vérifiez que la table ne peut pas basculer. Plus facile : genoux fléchis.",
      stop: "Arrêt si douleur à l'épaule ou au coude, ou si la table bouge." },
    { name: "Curl biceps", group: "bras", color: 1, kit: ["deux bouteilles d'eau"], repsLabel: "12 répétitions",
      desc: "Debout, une bouteille dans chaque main, paumes vers l'avant, coudes collés au corps. Pliez les coudes pour monter les bouteilles vers les épaules, puis redescendez lentement.",
      cue: "Les coudes restent collés au corps.",
      err: "Ne balancez pas le buste pour monter.",
      tip: "Plus dur : descente en 3 secondes.",
      stop: "Arrêt si douleur au coude." },
    { name: "Extension triceps au-dessus de la tête", group: "bras", color: 1, kit: ["deux bouteilles d'eau"], repsLabel: "12 répétitions",
      desc: "Debout, bras levés, coudes pliés, bouteilles derrière la tête. Tendez les bras vers le plafond, puis repliez lentement.",
      cue: "Les coudes restent près de la tête et pointent vers le plafond.",
      err: "Ne cambrez pas le bas du dos.",
      tip: "Plus facile : une seule bouteille tenue à deux mains.",
      stop: "Arrêt si douleur au coude ou à l'épaule." },
    { name: "Curl marteau tempo lent", group: "bras", color: 2, kit: ["deux bouteilles d'eau"], repsLabel: "10 répétitions",
      desc: "Debout, une bouteille dans chaque main, pouces vers l'avant. Montez en 3 secondes, tenez 1 seconde, redescendez en 3 secondes.",
      cue: "3 secondes pour monter, 3 secondes pour descendre.",
      err: "Le poignet reste droit, il ne se casse pas.",
      tip: "Le tempo lent rend l'exercice difficile même avec peu de poids.",
      stop: "Arrêt si douleur au coude ou au poignet." },
    { name: "Tandem talon-pointe", group: "equilibre", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout près d'un mur ou d'un meuble, placez un pied juste devant l'autre, le talon contre les orteils. Tenez la position, regard droit devant.",
      cue: "Regard sur un point fixe devant vous.",
      err: "Ne regardez pas vos pieds.",
      tip: "Plus dur : changez de pied devant, ou fermez les yeux près d'un appui.",
      stop: "Arrêt si vertige." },
    { name: "Unipodal yeux fermés", group: "equilibre", color: 2, kit: [], repsLabel: "30 secondes par pied",
      desc: "Debout près d'un mur ou d'un meuble, sur une jambe, bras croisés. Fermez les yeux et gardez l'équilibre. Rouvrez les yeux ou touchez l'appui si besoin.",
      cue: "Toujours à portée de main d'un appui.",
      err: "Ne bloquez pas le genou d'appui : gardez-le légèrement souple.",
      tip: "Commencez par 10 secondes et augmentez.",
      stop: "Arrêt si vertige ou perte d'équilibre répétée." },
    { name: "Unipodal sur coussin", group: "equilibre", color: 2, kit: ["un coussin ferme"], repsLabel: "30 secondes par pied",
      desc: "Debout sur un coussin ferme posé au sol, sur une jambe, près d'un appui. Tenez l'équilibre, genou légèrement fléchi.",
      cue: "Le genou reste au-dessus du pied, souple.",
      err: "Le genou ne part pas vers l'intérieur.",
      tip: "Utile après une entorse de cheville.",
      stop: "Arrêt si douleur à la cheville ou au genou." },
    { name: "Toucher en étoile unipodal", group: "equilibre", color: 3, kit: [], repsLabel: "6 répétitions par côté",
      desc: "Debout sur une jambe, genou légèrement fléchi. Avec la pointe de l'autre pied, touchez légèrement le sol devant, sur le côté puis derrière, en revenant au centre à chaque fois, sans poser le poids.",
      cue: "On touche le sol du bout du pied, sans s'appuyer dessus.",
      err: "Le genou d'appui ne rentre pas vers l'intérieur.",
      tip: "Plus facile : des touches plus proches du pied d'appui.",
      stop: "Arrêt si douleur au genou ou perte d'équilibre." },
    { name: "Chat-vache", group: "mobilite", color: 1, kit: ["un tapis"], repsLabel: "8 répétitions",
      desc: "À quatre pattes, mains sous les épaules, genoux sous les hanches. Arrondissez le dos en soufflant, menton vers la poitrine, puis creusez doucement le dos en inspirant, regard vers l'avant.",
      cue: "Le mouvement suit la respiration.",
      err: "Pas d'à-coup : on reste dans une amplitude confortable.",
      tip: "Idéal le matin ou après une longue position assise.",
      stop: "Arrêt si douleur au bas du dos ou à la nuque." },
    { name: "Rotation thoracique à quatre pattes", group: "mobilite", color: 1, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "À quatre pattes. Ouvrez un bras vers le plafond en tournant le haut du dos, regard qui suit la main, puis ramenez la main sous l'épaule opposée.",
      cue: "Le regard suit la main.",
      err: "Le bassin reste immobile : seule la poitrine tourne.",
      tip: "Bon complément pour les douleurs entre les omoplates.",
      stop: "Arrêt si douleur dans le dos ou l'épaule." },
    { name: "Fente psoas dynamique", group: "mobilite", color: 1, kit: ["un coussin"], repsLabel: "8 répétitions par côté",
      desc: "Un genou au sol sur un coussin, l'autre pied devant. Avancez doucement le bassin en serrant le fessier de la jambe arrière, bras du même côté levé, tenez 2 secondes, puis revenez.",
      cue: "On serre le fessier de la jambe arrière, sans cambrer.",
      err: "Ne creusez pas le bas du dos.",
      tip: "Étire l'avant de la hanche, utile si vous êtes souvent assis.",
      stop: "Arrêt si douleur au genou posé au sol ou au bas du dos." },
    { name: "Essuie-glace genoux pliés", group: "mobilite", color: 1, kit: ["un tapis"], repsLabel: "8 répétitions par côté",
      desc: "Allongé sur le dos, genoux fléchis, pieds au sol, bras écartés. Laissez tomber doucement les deux genoux d'un côté, épaules au sol, puis revenez au centre et passez de l'autre côté.",
      cue: "Les épaules restent posées au sol.",
      err: "On ne force pas en bout de mouvement.",
      tip: "Doux pour le bas du dos, à faire le matin ou le soir.",
      stop: "Arrêt si douleur au bas du dos ou dans la hanche." },
    { name: "Montées de genoux", group: "cardio", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout, marchez sur place en montant les genoux à hauteur de hanches, bras qui accompagnent le mouvement, à un rythme régulier.",
      cue: "Genoux à hauteur de hanches, buste droit.",
      err: "Ne vous penchez pas en arrière.",
      tip: "Plus facile : genoux moins hauts, rythme plus lent.",
      stop: "Arrêt si essoufflement important ou douleur à la poitrine." },
    { name: "Jumping jack sans saut", group: "cardio", color: 1, kit: [], repsLabel: "30 secondes",
      desc: "Debout. Écartez un pied sur le côté en levant les deux bras au-dessus de la tête, revenez, puis faites de même de l'autre côté, à un rythme régulier.",
      cue: "Pied et bras partent en même temps.",
      err: "Ne haussez pas les épaules.",
      tip: "Plus facile : bras à hauteur d'épaules seulement.",
      stop: "Arrêt si essoufflement important ou douleur à la poitrine." },
    { name: "Skater latéral sans saut", group: "cardio", color: 2, kit: [], repsLabel: "30 secondes",
      desc: "Debout. Croisez une jambe en arrière de l'autre en fléchissant le genou d'appui, buste un peu penché, bras qui balancent, puis revenez et changez de côté, à un rythme régulier.",
      cue: "On fléchit le genou d'appui, le buste reste gainé.",
      err: "Le genou d'appui reste dans l'axe du pied.",
      tip: "Plus dur : un rythme plus soutenu.",
      stop: "Arrêt si douleur au genou ou essoufflement important." }
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
      if (window.KineOfficiel) FULL.forEach(function (e) { KineOfficiel.patch(e); });
    }
    return withHidden ? FULL : FULL.filter(function (e) { return !(window.KineOfficiel && KineOfficiel.hidden(e.name)); });
  }
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
        var thumb = window.KineAvatar && KineAvatar.supports(e.name) ? KineAvatar.snapshot(e.name, 104) : null, c = color(e.name);
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
  function close() { var el = $("kb-sheet"); if (el) el.classList.remove("open"); }
  function demo(name) {
    var e = find(name); if (!e) return;
    wire();
    var cur = e.day && typeof SEQ_DAYS !== "undefined" && SEQ_DAYS[e.day] && SEQ_DAYS[e.day].exercises[e.idx];
    if (cur && cur.name === e.name && typeof openDemo === "function") { openDemo(e.day, e.idx); return; }
    if (typeof openDemoEx === "function") openDemoEx(e);
  }

  return { groups: GROUPS, colors: COLORS, all: all, find: find, color: color, open: open, close: close, demo: demo, wire: wire, NEW: NEW,
           reset: function () { FULL = null; }, baseColor: function (n) { var e = find(n); return e ? e.base : 0; } };
})();
window.KineBiblio = KineBiblio;
document.addEventListener("DOMContentLoaded", function () { setTimeout(KineBiblio.wire, 0); });
