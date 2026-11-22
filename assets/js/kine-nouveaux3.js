/* ═══════════ KinéForce — nouveaux exercices, lot 3 (bras à l'élastique, pompes diamant, cou en rotation) ═══════════
   Les poses de Yass sont copiées d'exercices déjà animés puis ajustées : on ne réinvente pas le mouvement. */
(function () {
  "use strict";
  if (!window.KineAvatar || !KineAvatar.lib) return;
  var lib = KineAvatar.lib, merge = lib.merge, STAND = lib.STAND, step = lib.step;
  function clone(n) { var d = KineAvatar._def(n); return d ? JSON.parse(JSON.stringify(d)) : null; }
  var reg = function (n, d) { if (d && !KineAvatar.supports(n)) KineAvatar.register(n, d); };

  var c1 = clone("Curl biceps");
  if (c1) { delete c1.load; c1.bands = [["LH", [0.14, 0.02, 0.05]], ["RH", [-0.14, 0.02, 0.05]]]; reg("Curl biceps à l'élastique", c1); }

  reg("Extension triceps à l'élastique", {
    camera: { yaw: 1.0, dist: 3.8, ty: 1.0 }, start: "bent", thumb: "ext", bands: [["LH", [0.1, 2.2, 0.1]], ["RH", [-0.1, 2.2, 0.1]]],
    poses: { bent: merge(STAND(0.11, 6), { LA: { ang: [12, 7, 0, 105] }, RA: { ang: [12, 7, 0, 105] } }), ext: merge(STAND(0.11, 6), { LA: { ang: [12, 7, 0, 6] }, RA: { ang: [12, 7, 0, 6] } }) },
    steps: [step("ext", 1.5, "On pousse vers le bas", "On tend les bras vers le bas", "up"), step("ext", 1, "On tient", "On tient", "hold"), step("bent", 2.5, "Remontée lente", "On remonte lentement", "down")]
  });

  var pd = clone("Pompes complètes");
  if (pd) {
    ["up", "down"].forEach(function (k) {
      ["LA", "RA"].forEach(function (a) {
        var h = pd.poses[k] && pd.poses[k][a] && pd.poses[k][a].hand; if (!h) return;
        h.at[0] = a === "LA" ? 0.06 : -0.06; h.pole[0] = a === "LA" ? 0.25 : -0.25;
      });
    });
    reg("Pompes diamant", pd);
  }

  var cr = clone("Contraction du cou contre la main");
  if (cr) {
    var SIT = cr.poses.rest;
    cr.poses.cheekR = merge(SIT, { RA: { hand: { at: [-0.1, 1.2, -0.15], pole: [-1, -0.2, 0.5] } } });
    cr.poses.cheekL = merge(SIT, { LA: { hand: { at: [0.1, 1.2, -0.15], pole: [1, -0.2, 0.5] } } });
    cr.start = "rest"; cr.thumb = "cheekR";
    cr.steps = [step("cheekR", 1, "Main sur la joue droite", null, "up"), step("cheekR", 5, "On tourne la tête contre la main, elle ne bouge pas", "On pousse comme pour tourner la tête, elle ne bouge pas", "hold"), step("rest", 2, "On relâche", "On relâche", "down"),
                step("cheekL", 1, "Main sur la joue gauche", null, "up"), step("cheekL", 5, "De l'autre côté", "De l'autre côté", "hold"), step("rest", 2, "On relâche", "On relâche", "down")];
    reg("Contraction du cou en rotation contre la main", cr);
  }

  var F = [
    { name: "Curl biceps à l'élastique", group: "bras", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions",
      desc: "Debout, un pied (ou les deux) sur l'élastique, une poignée dans chaque main, paumes vers l'avant, coudes collés au corps. Plie les coudes pour monter les mains vers les épaules, puis redescends lentement.",
      cue: "Les coudes restent collés au corps.", err: "Ne balance pas le buste pour monter.",
      tip: "Plus dur : descente en 3 secondes, ou élastique plus court. Plus facile : un élastique plus souple.", stop: "Arrêt si douleur au coude." },
    { name: "Extension triceps à l'élastique", group: "bras", color: 1, kit: ["un élastique"], gear: "elastique", repsLabel: "12 répétitions",
      desc: "Debout, l'élastique accroché en haut d'une porte, une poignée dans chaque main, coudes pliés collés au corps. Tends les bras vers le bas, puis remonte lentement sans écarter les coudes.",
      cue: "Les coudes ne bougent pas, seuls les avant-bras descendent.", err: "Ne pousse pas avec le buste, garde le dos droit.",
      tip: "Plus dur : recule d'un pas pour tendre l'élastique davantage.", stop: "Arrêt si douleur au coude ou à l'épaule." },
    { name: "Pompes diamant", group: "poussee", color: 3, kit: [], repsLabel: "6 répétitions",
      desc: "En position de pompe, les mains proches l'une de l'autre sous la poitrine, pouces et index qui se touchent. Descends en gardant le corps aligné, puis pousse pour remonter.",
      cue: "Le corps reste droit comme une planche.", err: "Ne creuse pas le bas du dos et ne laisse pas les coudes partir très loin sur les côtés.",
      tip: "Plus facile : sur les genoux, ou les mains sur une table. Fais d'abord les pompes complètes sans difficulté.", stop: "Arrêt si douleur au poignet, au coude ou à l'épaule." },
    { name: "Contraction du cou en rotation contre la main", group: "cou", color: 1, kit: ["une chaise"], repsLabel: "5 répétitions par côté",
      desc: "Assis bien droit. Pose la main droite sur la joue droite et pousse comme pour tourner la tête vers la droite : la main résiste, la tête ne bouge pas. Tiens 5 secondes, relâche, puis fais de même de l'autre côté.",
      cue: "On pousse à environ un tiers de sa force, la tête reste immobile.", err: "Ne bloque pas ta respiration et ne hausse pas les épaules.",
      tip: "Plus dur : tiens 8 secondes. Fais-la après la contraction du cou contre la main.", stop: "Arrêt si douleur vive dans le cou, ou douleur qui descend dans le bras." }
  ];
  var USE = {
    "Curl biceps à l'élastique": { s: "Le biceps plie le coude contre la résistance de l'élastique, qui augmente à la montée. On peut doser l'effort en changeant l'élastique.", e: ["Porter les courses ou un enfant", "Soulever une casserole pleine", "Ouvrir un pot"] },
    "Extension triceps à l'élastique": { s: "Le triceps tend le coude contre l'élastique. Il pousse dans tous les gestes de poussée.", e: ["Se relever en poussant sur les bras", "Pousser une porte lourde", "Ranger une valise en hauteur"] },
    "Pompes diamant": { s: "Les mains rapprochées font beaucoup travailler le triceps, en plus de la poitrine. C'est une pompe difficile : on y vient après les pompes complètes.", e: ["Se relever du sol", "Pousser un meuble", "Se hisser sur un muret"] },
    "Contraction du cou en rotation contre la main": { s: "Les muscles qui tournent la tête travaillent sans bouger : on les renforce en douceur, sans frotter sur les articulations du cou.", e: ["Regarder derrière soi en voiture", "Se retourner sans raideur", "Moins de tensions fin de journée"] }
  };
  if (window.KineBiblio && KineBiblio.extend) KineBiblio.extend(F);
  document.addEventListener("DOMContentLoaded", function () { if (window.KineIdees && KineIdees.USAGE) for (var k in USE) if (!KineIdees.USAGE[k]) KineIdees.USAGE[k] = USE[k]; });
})();
