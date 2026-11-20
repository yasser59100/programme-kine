/* ═══════════ KinéForce — étirements et mobilité en bibliothèque ═══════════
   Ces étirements existaient seulement dans les routines guidées (échauffements, récupération) : ils ne pouvaient pas
   être envoyés à un patient. Ici ils entrent dans la bibliothèque, avec la même animation de Yass, la fiche
   et la phrase « à quoi ça sert », pour pouvoir figurer dans une séance. */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.register || !KineAvatar._def) return;
  // Reprend les poses d'un mouvement des routines : « move:<clé> »
  function port(name, move, o) {
    var d = KineAvatar._def("move:" + move); if (!d || !d.poses || KineAvatar.supports(name)) return;
    var def = { noIso: true, timed: { seconds: o.sec || 30 }, camera: o.cam ? Object.assign({}, d.camera, o.cam) : d.camera, start: d.start || "hold", thumb: d.start || "hold", poses: d.poses };
    if (d.props) def.props = d.props; if (d.chair) def.chair = d.chair; if (d.aid) def.aid = d.aid;
    if (o.side) { def.sides = "blocks"; def.sideWord = o.side; if (d.labelSwap) def.labelSwap = true; }
    KineAvatar.register(name, def);
  }
  port("Étirement des quadriceps debout", "quadStretch", { sec: 30, side: "jambe" });
  port("Étirement des ischio-jambiers assis", "hamSeated", { sec: 30, side: "jambe" });
  port("Étirement des fessiers, cheville sur le genou", "figure4", { sec: 30, side: "jambe" });
  port("Fente basse, étirement du psoas", "lowLunge", { sec: 30, side: "jambe" });
  port("Écart assis, étirement des adducteurs", "adductorSeated", { sec: 30, cam: { dist: 4.6 } });
  port("Étirement des pectoraux contre le mur", "pecWall", { sec: 30, side: "bras" });
  port("Étirement du triceps, coude derrière la tête", "triceps", { sec: 30, side: "bras" });
  port("Position de l'enfant", "childPose", { sec: 30 });
  port("Torsion du bas du dos, genoux sur le côté", "lumbarTwist", { sec: 30, side: "côté", cam: { dist: 4.1 } });
  port("Rotation du tronc assis", "trunkRotSeated", { sec: 30 });

  var E = function (name, group, color, kit, reps, desc, cue, err, tip, stop) { return { name: name, group: group, color: color, kit: kit, repsLabel: reps, desc: desc, cue: cue, err: err, tip: tip, stop: stop }; };
  var F = [
    E("Étirement des quadriceps debout", "mobilite", 1, ["un mur"], "30 secondes par jambe, 2 fois",
      "Debout, une main au mur. Plie un genou et attrape ton pied derrière toi, talon vers la fesse. Les genoux restent l'un à côté de l'autre.",
      "Le bassin reste droit, le ventre rentré.", "On ne cambre pas le bas du dos.",
      "Assouplit l'avant de la cuisse, qui tire sur le genou. Plus facile : une sangle ou une serviette autour du pied.", "Arrêt si douleur vive dans le genou : une tension est normale, pas une douleur."),
    E("Étirement des ischio-jambiers assis", "mobilite", 1, ["une chaise ou un tapis"], "30 secondes par jambe, 2 fois",
      "Assis au bord d'une chaise ou au sol, une jambe tendue devant toi, talon posé, l'autre pliée. Penche-toi en avant, le dos droit, en partant des hanches.",
      "Le dos reste long, on se penche depuis les hanches.", "On n'arrondit pas le dos pour aller plus bas.",
      "Assouplit l'arrière de la cuisse. Une tension derrière la cuisse est normale. Plus facile : le pied sur un petit tabouret.", "Arrêt si fourmillements ou douleur qui descend dans la jambe."),
    E("Étirement des fessiers, cheville sur le genou", "mobilite", 1, ["un tapis"], "30 secondes par côté, 2 fois",
      "Allongé sur le dos, genoux pliés. Pose la cheville droite sur le genou gauche. Passe les mains derrière la cuisse gauche et ramène-la doucement vers toi.",
      "La tête et les épaules restent posées au sol.", "On ne tire pas fort : une tension profonde dans la fesse suffit.",
      "Assouplit les fessiers et le piriforme, souvent tendus quand le dos ou la hanche font mal. Plus facile : le pied de la jambe du dessous au mur.", "Arrêt si douleur dans la hanche ou si la douleur descend dans la jambe."),
    E("Fente basse, étirement du psoas", "mobilite", 1, ["un tapis"], "30 secondes par jambe, 2 fois",
      "Un genou au sol sur un coussin, l'autre pied loin devant toi. Serre la fesse du côté du genou au sol et avance doucement le bassin, le buste droit.",
      "Le buste reste droit, la fesse arrière serrée.", "On ne cambre pas le bas du dos.",
      "Assouplit l'avant de la hanche, raccourci par la position assise. Plus facile : se tenir à une chaise.", "Arrêt si douleur dans l'aine ou le genou au sol."),
    E("Écart assis, étirement des adducteurs", "mobilite", 1, ["un tapis"], "30 secondes, 2 fois",
      "Assis au sol, jambes écartées sans forcer, le dos droit. Pose les mains devant toi et penche-toi doucement en avant, sans arrondir le dos.",
      "On écarte les jambes seulement jusqu'à une tension douce.", "On ne rebondit pas.",
      "Assouplit l'intérieur des cuisses. Plus facile : s'asseoir sur un coussin.", "Arrêt si douleur dans l'aine : une simple tension est normale."),
    E("Étirement des pectoraux contre le mur", "mobilite", 1, ["un mur"], "30 secondes par bras, 2 fois",
      "Debout à côté d'un mur, avant-bras posé contre le mur, coude à hauteur d'épaule. Tourne doucement le buste à l'opposé du mur.",
      "Le coude reste à hauteur d'épaule, les épaules basses.", "On ne cambre pas le dos.",
      "Ouvre la poitrine et redresse les épaules, utile après de longues heures devant un écran. Plus facile : coude plus bas.", "Arrêt si douleur dans l'épaule ou fourmillements dans la main."),
    E("Étirement du triceps, coude derrière la tête", "mobilite", 1, [], "30 secondes par bras, 2 fois",
      "Lève un bras, plie le coude pour poser la main derrière la tête. Avec l'autre main, appuie doucement sur le coude vers l'arrière.",
      "Le cou reste droit, les côtes ne s'ouvrent pas.", "On ne tire pas fort sur le coude.",
      "Assouplit l'arrière du bras et le côté de l'épaule. Plus facile : sans pousser sur le coude.", "Arrêt si douleur dans l'épaule : une tension est normale."),
    E("Position de l'enfant", "mobilite", 1, ["un tapis"], "30 secondes, 3 fois",
      "À quatre pattes, assieds-toi doucement sur les talons et glisse les mains loin devant, front vers le sol. Respire lentement dans le dos.",
      "Les fesses cherchent les talons, la respiration est calme.", "On ne force pas pour aller au bout.",
      "Étire doucement tout le dos et détend. Plus facile : un coussin entre les fesses et les talons.", "Arrêt si douleur au genou ou si les fesses ne se posent pas : garde un coussin."),
    E("Torsion du bas du dos, genoux sur le côté", "mobilite", 1, ["un tapis"], "30 secondes par côté, 2 fois",
      "Allongé sur le dos, genoux pliés serrés, bras en croix. Laisse tomber les genoux d'un côté et tourne la tête de l'autre côté. Épaules à plat.",
      "Les deux épaules restent posées au sol.", "On ne force pas pour poser les genoux au sol.",
      "Détend le bas du dos et les hanches. Plus facile : un coussin sous les genoux.", "Arrêt si la douleur descend dans la jambe."),
    E("Rotation du tronc assis", "mobilite", 1, ["une chaise"], "10 répétitions de chaque côté",
      "Assis bien droit sur une chaise, bras croisés sur la poitrine. Tourne le buste d'un côté, regard dans la même direction, puis de l'autre.",
      "Le bassin reste face à l'avant, on tourne depuis le milieu du dos.", "On ne fait pas pivoter les genoux.",
      "Redonne de la rotation au haut du dos, utile pour regarder derrière soi. Plus facile : une moindre amplitude.", "Arrêt si douleur vive dans le dos.")
  ];
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  var U = function (s2, e) { return { s: s2, e: e }; };
  var USE = {
    "Étirement des quadriceps debout": U("L'avant de la cuisse s'assouplit : le genou plie plus facilement et se sent moins tiré.", ["S'accroupir", "Monter les escaliers", "Courir sans tension au genou"]),
    "Étirement des ischio-jambiers assis": U("L'arrière de la cuisse s'allonge : le bassin et le bas du dos tirent moins.", ["Se pencher pour lacer ses chaussures", "Ramasser un objet", "Courir plus librement"]),
    "Étirement des fessiers, cheville sur le genou": U("Les fessiers et le piriforme se relâchent : la hanche et le bas du dos se détendent.", ["Rester assis plus longtemps", "Croiser les jambes", "Dormir plus confortablement"]),
    "Fente basse, étirement du psoas": U("L'avant de la hanche s'ouvre, le bassin se remet droit.", ["Se tenir droit après une journée assis", "Marcher d'un pas plus ample", "Courir"]),
    "Écart assis, étirement des adducteurs": U("L'intérieur des cuisses s'assouplit : la hanche s'ouvre et l'aine tire moins.", ["Changer de direction au sport", "Sortir de la voiture", "S'asseoir en tailleur"]),
    "Étirement des pectoraux contre le mur": U("La poitrine s'ouvre, les épaules reviennent en arrière.", ["Travailler sur écran sans tension", "Lever les bras plus facilement", "Se tenir droit"]),
    "Étirement du triceps, coude derrière la tête": U("L'arrière du bras et l'épaule s'assouplissent.", ["Lever le bras au-dessus de la tête", "Attraper un objet en hauteur", "S'habiller plus facilement"]),
    "Position de l'enfant": U("Le dos s'allonge et se détend, la respiration devient plus calme.", ["Soulager un dos raide", "Se détendre après l'effort", "Mieux dormir"]),
    "Torsion du bas du dos, genoux sur le côté": U("Le bas du dos et les hanches se détendent en rotation.", ["Se retourner dans le lit", "Se lever le matin", "Moins de raideur"]),
    "Rotation du tronc assis": U("Le haut du dos retrouve sa rotation, le cou et le bas du dos n'ont plus à compenser.", ["Regarder derrière soi en voiture", "Attraper un objet sur le côté", "Se tourner sur sa chaise"])
  };
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });
  window.KineEtirementsEx = { names: F.map(function (f) { return f.name; }) };
})();
