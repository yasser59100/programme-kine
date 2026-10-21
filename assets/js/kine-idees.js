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
    "Squat bilatéral": { s: "Le squat fait travailler ensemble les quadriceps (devant de la cuisse) et les fessiers, les deux moteurs qui redressent le corps. En descendant lentement, les muscles apprennent à freiner, ce qui protège aussi les genoux.", e: ["Se lever d'une chaise, du canapé ou des toilettes sans les mains", "S'accroupir pour ramasser un objet ou jouer avec un enfant", "Sortir de la voiture plus facilement"] },
    "Fentes avant unilatérales": { s: "Une jambe porte presque tout le poids du corps : quadriceps et fessier travaillent plus fort, et l'équilibre est sollicité en même temps. C'est un mouvement très proche de la marche et des escaliers.", e: ["Monter les escaliers d'un pas sûr", "Se relever d'un genou posé au sol", "Faire un grand pas pour éviter une flaque"] },
    "Chaise contre le mur": { s: "Les quadriceps restent contractés sans bouger : c'est un effort isométrique. Il renforce l'endurance de la cuisse et calme souvent les douleurs de genou, car l'articulation ne frotte pas pendant l'effort.", e: ["Rester debout longtemps, en cuisine ou dans une file d'attente", "Descendre une pente ou des escaliers sans cuisses qui brûlent", "Tenir une position à demi accroupie pour bricoler ou jardiner"] },
    "Pont ischio-jambiers talons sur chaise": { s: "Les ischio-jambiers, à l'arrière de la cuisse, plient le genou et tirent la hanche vers l'arrière. Les renforcer équilibre la jambe et soulage le genou et le bas du dos.", e: ["Marcher d'un bon pas sans fatigue derrière les cuisses", "Monter une côte en poussant bien sur les jambes", "Reprendre la course ou le vélo"] },
    "Élévation des talons": { s: "Les mollets propulsent le corps à chaque pas. Plus ils sont forts, plus la marche est économique, et plus la cheville est stable sur un sol irrégulier.", e: ["Marcher plus longtemps sans fatigue", "Se mettre sur la pointe des pieds pour attraper un objet en hauteur", "Garder l'équilibre dans un bus ou un tram qui freine"] },
    "Step-up sur marche": { s: "Monter sur une marche demande de pousser tout le poids du corps avec une seule jambe. C'est exactement l'effort des escaliers, avec en plus l'équilibre du bassin.", e: ["Monter les escaliers sans la rampe", "Monter sur un trottoir ou dans un bus", "Grimper sur un escabeau en toute sécurité"] },
    "Rotation externe d'épaule": { s: "Les petits muscles de la coiffe des rotateurs tiennent la tête de l'humérus bien centrée dans l'épaule. Quand ils sont forts, le bras se lève sans que l'épaule se coince.", e: ["Se coiffer ou se laver les cheveux", "Attraper un objet sur une étagère haute", "Lancer une balle à un enfant"] },
    "Pompes sur genoux": { s: "Les pectoraux, l'avant des épaules et les triceps poussent ensemble, pendant que le ventre garde le corps gainé. On travaille la poussée sans porter tout son poids.", e: ["Se relever du sol en poussant sur les bras", "Pousser une porte lourde ou un chariot", "Se redresser dans le lit"] },
    "Dips sur chaise": { s: "Les triceps, à l'arrière du bras, tendent le coude. Ce sont eux qui poussent quand on s'appuie sur les mains pour se lever.", e: ["Se lever d'un fauteuil en poussant sur les accoudoirs", "Sortir de la baignoire en s'appuyant sur le bord", "Se repositionner sur une chaise"] },
    "Pike push-up": { s: "Les épaules poussent vers le haut, presque à la verticale. On renforce les deltoïdes et les triceps dans la position du bras levé.", e: ["Ranger une valise ou un carton en hauteur", "Fermer le coffre de la voiture", "Accrocher un rideau ou changer une ampoule"] },
    "Superman en Y et en W": { s: "Les muscles entre les omoplates et le long du dos redressent le haut du corps. Ils compensent les heures passées penché vers l'avant, sur un écran ou au volant.", e: ["Se tenir droit, assis comme debout", "Moins de tension dans la nuque après une journée de bureau", "Lever les bras au-dessus de la tête plus facilement"] },
    "Crunch abdominal contrôlé": { s: "Le grand droit de l'abdomen enroule le haut du corps vers le bassin. En contrôlant le mouvement, on renforce le ventre sans tirer sur la nuque.", e: ["Se redresser dans le lit le matin", "Se relever d'une position allongée au sol", "Mieux tousser ou éternuer sans douleur"] },
    "Portefeuille (V-up)": { s: "Le ventre et les fléchisseurs de hanche travaillent ensemble pour rapprocher le buste et les jambes. C'est un renforcement complet de l'avant du tronc.", e: ["Sortir du lit d'un seul mouvement", "S'asseoir en voiture en levant les jambes", "Enfiler un pantalon assis"] },
    "Dead bug": { s: "Les abdominaux profonds gardent le bas du dos immobile pendant que bras et jambes bougent. C'est la base de la stabilité du tronc : un dos protégé pendant que le reste du corps travaille.", e: ["Porter un enfant ou des courses sans se faire mal au dos", "Passer l'aspirateur ou le balai sans douleur", "Garder le dos stable en marchant vite"] },
    "Superman quadrupédique en gainage": { s: "À quatre pattes, on tend un bras et la jambe opposée : les muscles du dos et des fessiers travaillent en croix, comme pendant la marche. Le tronc apprend à rester stable sur un appui réduit.", e: ["Se pencher et se relever sans tirer sur le dos", "Faire son lit ou ramasser un jouet", "Jardiner à genoux"] },
    "Ciseaux et vélo": { s: "Le ventre maintient le bassin pendant que les jambes bougent en alternance. On renforce les abdominaux et les fléchisseurs de hanche, qui lèvent la jambe.", e: ["Monter dans une voiture et lever la jambe par-dessus le seuil", "Enjamber un obstacle ou le bord de la baignoire", "Monter les escaliers sans traîner les pieds"] },
    "Plank — gainage avant-bras": { s: "Tous les muscles du tronc se contractent en même temps pour garder le corps droit comme une planche. C'est une « ceinture » naturelle qui protège la colonne quand on porte ou qu'on pousse.", e: ["Porter des courses ou un pack d'eau", "Pousser un meuble ou une poussette", "Rester debout longtemps sans mal de dos"] },
    "Side plank sur genoux": { s: "Les muscles du côté du tronc (obliques et carré des lombes) empêchent le corps de pencher sur le côté. Ils travaillent dès qu'on porte une charge d'une seule main.", e: ["Porter un sac lourd d'un seul côté sans pencher", "Porter un enfant sur la hanche", "Garder l'équilibre en marchant sur un sol irrégulier"] },
    "Gainage frontal sur genoux": { s: "La version de départ de la planche : les genoux au sol raccourcissent le levier, mais tous les muscles du tronc travaillent déjà ensemble pour garder le dos droit.", e: ["Se pencher au-dessus d'un lavabo ou d'une table sans mal de dos", "Porter des courses en gardant le dos tenu", "Se préparer à la planche complète"] },
    "Squat sumo": { s: "Pieds écartés, le squat sollicite davantage les fessiers et l'intérieur des cuisses (adducteurs). Cette position large est souvent plus confortable pour les hanches.", e: ["Ramasser un objet au sol en gardant le dos droit", "Se baisser vers un enfant ou un animal", "Soulever un panier à linge posé par terre"] },
    "Donkey kick": { s: "Le grand fessier tend la hanche vers l'arrière. C'est le muscle le plus puissant du corps : il propulse à chaque pas et dans chaque marche d'escalier.", e: ["Monter les escaliers sans tirer sur la rampe", "Marcher en côte", "Se relever d'une position accroupie"] },
    "Pont de hanche": { s: "Les fessiers et les ischio-jambiers soulèvent le bassin. On renforce l'arrière de la chaîne des jambes, qui soutient le bas du dos.", e: ["Se retourner dans le lit ou se remonter vers l'oreiller", "Monter les escaliers", "Moins de douleurs dans le bas du dos en position debout"] },
    "Clamshell": { s: "Le moyen fessier, sur le côté de la hanche, tourne la cuisse vers l'extérieur. Il empêche le genou de rentrer vers l'intérieur à chaque pas, une cause fréquente de douleur au genou.", e: ["Marcher avec le genou bien aligné", "Descendre les escaliers sans douleur au genou", "Se stabiliser sur une jambe pour enfiler une chaussure"] },
    "Abduction hanche debout": { s: "Le moyen fessier écarte la jambe et, surtout, tient le bassin à l'horizontale quand on est sur un pied. Sans lui, la hanche s'affaisse à chaque pas.", e: ["Tenir sur une jambe pour enfiler un pantalon", "Marcher sans se déhancher", "Faire un pas de côté pour éviter quelqu'un"] },
    "Pont fessier unilatéral": { s: "Le pont sur une jambe double le travail du fessier et oblige le bassin à rester stable. On corrige souvent ainsi un côté plus faible que l'autre.", e: ["Monter les marches deux à deux", "Trottiner ou courir après un bus", "Se relever du sol en poussant sur une jambe"] },
    "Squat + élévation bras": { s: "Jambes et épaules travaillent dans un même geste : on descend, on remonte et on lève les bras. Le corps apprend à coordonner le bas et le haut, comme dans la vie.", e: ["Ranger les courses, du sol jusqu'au placard du haut", "Soulever un carton et le poser sur une étagère", "Accrocher le linge sur un fil"] },
    "Inchworm et pompes": { s: "On passe de debout à la planche avec les mains, puis on revient : l'arrière des jambes s'assouplit, et les épaules et le ventre se renforcent. C'est un vrai travail du passage au sol.", e: ["Se mettre au sol et se relever facilement", "Jouer par terre avec les enfants", "Chercher un objet tombé sous un meuble"] },
    "Fente latérale avec toucher sol": { s: "La jambe qui plie travaille fort pendant que l'intérieur de l'autre cuisse s'étire. On renforce les mouvements sur le côté, souvent oubliés.", e: ["Ramasser un objet tombé sur le côté", "Jardiner ou désherber", "Se rattraper par un pas de côté"] },
    "Burpee modifié sans saut": { s: "On descend au sol, on passe en planche, puis on se relève : tout le corps travaille, et le cœur aussi. C'est l'entraînement du relevé du sol.", e: ["Savoir se relever seul après une chute", "S'asseoir et se relever du sol, à la plage ou au parc", "Monter le souffle sans choc pour les articulations"] },
    "Équilibre unipodal": { s: "Sur un pied, la cheville, la hanche et le cerveau corrigent sans arrêt de petits déséquilibres. Ce réflexe s'entretient, et il réduit le risque de chute.", e: ["Enfiler ses chaussettes ou son pantalon debout", "Moins de risques de chute", "Monter dans une baignoire ou enjamber un obstacle"] },
    "Assis-debout de chaise": { s: "C'est le squat le plus utile : quadriceps et fessiers redressent le corps depuis une assise. Le nombre d'assis-debout en 30 secondes est même un test médical de la force des jambes.", e: ["Se lever d'une chaise, du canapé ou des toilettes", "Sortir de la voiture", "Rester autonome au quotidien"] },
    "Extension de genou assis": { s: "Le quadriceps tend le genou, sans poids sur l'articulation. C'est souvent le premier exercice après une opération ou une douleur du genou.", e: ["Monter les escaliers", "Se lever sans s'appuyer sur les mains", "Tendre complètement la jambe en marchant"] },
    "Fente arrière": { s: "En reculant, la jambe avant freine la descente : le genou est moins sollicité qu'avec une fente avant. Quadriceps et fessiers travaillent en douceur.", e: ["Descendre les escaliers en contrôle", "Poser un genou au sol pour ramasser un objet", "Reculer sans perdre l'équilibre"] },
    "Squat bulgare": { s: "Le pied arrière posé sur une chaise, presque tout le poids est sur la jambe avant. C'est un des exercices au poids du corps les plus efficaces pour la cuisse et le fessier.", e: ["Monter une grande marche ou un rocher en randonnée", "Reprendre le sport (course, ski, football)", "Se relever d'un genou sans les mains"] },
    "Fire hydrant": { s: "À quatre pattes, on écarte la jambe pliée sur le côté : le moyen fessier et les rotateurs de hanche travaillent. Ils stabilisent la hanche dans tous les mouvements latéraux.", e: ["Enjamber le bord de la baignoire ou de la voiture", "Monter sur un vélo", "Garder la hanche stable en marchant"] },
    "Abduction couché sur le côté": { s: "Couché, on lève la jambe sur le côté : le moyen fessier travaille seul, sans compensation. C'est le muscle qui tient le bassin droit à chaque pas.", e: ["Marcher sans se déhancher", "Soulager une douleur sur le côté de la hanche", "Tenir debout sur une jambe"] },
    "Hip thrust épaules sur canapé": { s: "Les épaules en appui, le bassin monte plus haut qu'un simple pont : le grand fessier travaille sur toute son amplitude. C'est l'exercice de référence pour ce muscle.", e: ["Se relever d'une chaise basse", "Pousser une charge lourde, comme une voiture en panne", "Marcher d'un bon pas en côte"] },
    "Good morning debout": { s: "On se penche en avant en gardant le dos droit : ce sont les hanches qui plient, pas le bas du dos. L'arrière des cuisses et les muscles du dos apprennent à travailler ensemble.", e: ["Se pencher au-dessus de l'évier ou du lavabo sans douleur", "Faire la vaisselle ou se brosser les dents penché", "Soulever un objet léger avec le bon geste"] },
    "Soulevé de terre roumain unipodal": { s: "Sur une jambe, on se penche en avant : l'arrière de la cuisse s'étire en travaillant, et la cheville et la hanche gèrent l'équilibre. Force et équilibre en un seul geste.", e: ["Ramasser un objet léger en restant en équilibre", "Se pencher pour attraper quelque chose sans plier le dos", "Mieux se rattraper en cas de déséquilibre"] },
    "Leg curl serviette au sol": { s: "Les ischio-jambiers plient le genou en tirant les talons vers les fesses. Ils freinent la jambe à chaque foulée : quand ils sont faibles, ils se blessent facilement.", e: ["Courir et accélérer sans claquage derrière la cuisse", "Marcher vite", "Protéger le genou dans les changements de direction"] },
    "Nordic curl assisté": { s: "On freine lentement la chute du buste avec l'arrière des cuisses. Ce travail en freinage (excentrique) réduit nettement les blessures des ischio-jambiers chez les sportifs.", e: ["Protéger l'arrière de la cuisse pendant le sport", "Courir ou sprinter avec confiance", "Freiner sans risque dans les descentes"] },
    "Marche sur les talons": { s: "Le muscle à l'avant du tibia relève la pointe du pied. Quand il est faible, le pied traîne et accroche les obstacles.", e: ["Ne plus accrocher le pied sur un tapis ou une marche", "Moins de risques de trébucher", "Marcher plus sûrement en descente"] },
    "Élévation des talons genoux fléchis": { s: "Genoux pliés, c'est le soléaire, le muscle profond du mollet, qui travaille. Il soutient la cheville quand on marche longtemps et dans les côtes.", e: ["Monter les côtes et les escaliers à pied", "Marcher longtemps sans fatigue des mollets", "Soulager le tendon d'Achille"] },
    "Élévation des talons unipodale": { s: "Sur un pied, le mollet porte tout le poids du corps, comme à chaque pas de course ou de marche rapide. C'est aussi un excellent travail d'équilibre de la cheville.", e: ["Marcher longtemps et vite", "Tenir sur la pointe d'un pied", "Moins d'entorses de cheville"] },
    "Excentrique mollet sur marche": { s: "On redescend lentement le talon sous le niveau de la marche : le mollet travaille en freinant. Ce travail lent aide le tendon d'Achille à se renforcer et à se réparer.", e: ["Soulager une douleur du tendon d'Achille", "Reprendre la marche ou la course", "Descendre les escaliers plus en souplesse"] },
    "Extension lombaire couché sur le ventre": { s: "Les muscles le long de la colonne redressent le dos. Les entraîner progressivement les rend plus endurants et diminue souvent les douleurs lombaires.", e: ["Rester debout ou assis longtemps sans mal de dos", "Se redresser après s'être penché", "Porter un sac à dos"] },
    "Superman bras-jambe opposés": { s: "Comme pendant la marche, le bras et la jambe opposés travaillent ensemble : les muscles du dos et des fessiers se coordonnent en croix.", e: ["Garder le dos stable en marchant", "Porter une charge sans se cambrer", "Nager le crawl plus facilement"] },
    "Pont en marche": { s: "Le bassin reste en l'air pendant qu'on lève un pied, puis l'autre : les fessiers travaillent chacun leur tour en empêchant le bassin de basculer.", e: ["Marcher d'un bon pas sans se déhancher", "Monter les escaliers", "Moins de douleurs au bas du dos"] },
    "Bear plank": { s: "À quatre pattes, genoux décollés du sol : épaules, ventre et cuisses travaillent ensemble pour tenir la position. C'est un gainage proche des gestes au sol.", e: ["Jouer au sol avec les enfants", "Se relever du sol plus facilement", "Ramper ou chercher sous un meuble"] },
    "Planche latérale complète": { s: "Sur le côté, tout le flanc du corps (obliques, moyen fessier, épaule) tient la ligne droite. C'est le gainage latéral le plus complet.", e: ["Porter une valise d'une seule main", "Porter un seau d'eau ou un sac de courses lourd", "Garder l'équilibre si on est bousculé"] },
    "Mountain climber lent": { s: "En planche, on ramène un genou puis l'autre vers la poitrine : le ventre stabilise, les hanches plient, le cœur accélère un peu.", e: ["Monter les escaliers sans être essoufflé", "Lever le genou haut pour enjamber un obstacle", "Améliorer le souffle sans sauter"] },
    "Rotation externe couché sur le côté": { s: "Couché, le bras tourne vers l'extérieur avec un petit poids : on isole l'infra-épineux, un des muscles clés de la coiffe des rotateurs.", e: ["Se coiffer ou mettre un chapeau", "Attraper sa ceinture de sécurité", "Lever le bras sans douleur d'épaule"] },
    "Élévation latérale": { s: "Le deltoïde, le muscle rond de l'épaule, écarte le bras du corps. Il travaille dans tous les gestes où les bras s'éloignent du tronc.", e: ["Étendre le linge", "Ranger en hauteur", "Porter un plateau ou un carton à bout de bras"] },
    "Wall slides": { s: "Dos au mur, on glisse les bras vers le haut : les muscles qui font tourner l'omoplate apprennent à bien la positionner, ce qui libère la place pour lever le bras.", e: ["Lever les bras au-dessus de la tête sans pincement", "Changer une ampoule ou attraper un objet en hauteur", "Se tenir plus droit"] },
    "Élévation en Y": { s: "Bras en Y, le bas du trapèze tire les omoplates vers le bas et l'arrière. C'est souvent le muscle oublié des épaules douloureuses.", e: ["Lever les bras en hauteur sans douleur", "Garder les épaules en arrière, pas enroulées", "Moins de tension dans la nuque"] },
    "Pompes contre le mur": { s: "La version la plus douce de la pompe : pectoraux, épaules et triceps poussent, avec une petite partie du poids du corps seulement.", e: ["Pousser une porte", "Se relever en s'appuyant contre un mur ou un meuble", "Se rattraper avec les mains en cas de déséquilibre"] },
    "Pompes inclinées": { s: "Les mains sur une table ou un plan de travail : on pousse une plus grande part du poids qu'au mur, en gardant le corps gainé.", e: ["Se relever du sol en poussant sur les bras", "Pousser un meuble", "Porter un objet lourd devant soi"] },
    "Pompes complètes": { s: "La pompe classique fait pousser environ deux tiers du poids du corps : pectoraux, épaules, triceps et gainage du ventre travaillent ensemble.", e: ["Se relever du sol facilement", "Pousser fort, par exemple une voiture", "Garder des bras solides pour se rattraper en cas de chute"] },
    "T au sol": { s: "À plat ventre, bras en croix : on renforce les muscles entre les omoplates qui ramènent les épaules en arrière.", e: ["Se tenir droit devant l'écran", "Moins de douleur dans le haut du dos", "Ouvrir les bras pour serrer quelqu'un sans gêne"] },
    "Rowing un bras appui chaise": { s: "Le grand dorsal et les muscles entre les omoplates tirent le coude vers l'arrière. C'est le geste opposé de la pompe, indispensable pour l'équilibre de l'épaule.", e: ["Tirer une porte lourde", "Porter un seau ou un sac", "Démarrer une tondeuse à lanceur"] },
    "Rowing deux bras penché": { s: "Penché en avant, dos droit, on tire les deux bras : le dos travaille en tirant et reste gainé en même temps.", e: ["Soulever un carton en gardant le dos droit", "Ramer en kayak", "Se tenir droit plus longtemps"] },
    "Tirage inversé sous une table": { s: "On tire son propre poids vers une table : le dos et les biceps travaillent fort. C'est l'exercice de traction le plus accessible à la maison.", e: ["Se hisser, grimper", "Tirer une charge vers soi", "Se relever en se tirant sur une rampe"] },
    "Curl biceps": { s: "Le biceps plie le coude et tourne la paume vers le haut. Il travaille dès qu'on porte quelque chose devant soi.", e: ["Porter les courses ou un enfant dans les bras", "Soulever une casserole pleine", "Ouvrir un pot en vissant"] },
    "Extension triceps au-dessus de la tête": { s: "Le triceps tend le coude, ici bras levé. Il pousse dans tous les gestes en hauteur.", e: ["Ranger un objet en hauteur", "Pousser sur les bras pour se lever", "Se laver le dos"] },
    "Curl marteau tempo lent": { s: "Prise pouce vers le haut, on renforce le biceps et les muscles de l'avant-bras, qui serrent la main. Le tempo lent augmente le travail sans charge lourde.", e: ["Porter un sac par la poignée", "Tenir une casserole ou un arrosoir", "Ouvrir un bocal"] },
    "Tandem talon-pointe": { s: "Un pied devant l'autre, la base d'appui est très étroite : les muscles des chevilles et des hanches corrigent sans arrêt. C'est un test classique de l'équilibre.", e: ["Marcher sur un chemin étroit ou un trottoir encombré", "Moins de risques de chute", "Se retourner sans perdre l'équilibre"] },
    "Unipodal yeux fermés": { s: "Sans la vue, le corps doit se fier aux capteurs des pieds, des articulations et de l'oreille interne. On les entraîne à prendre le relais.", e: ["Garder l'équilibre dans le noir, la nuit", "Rester stable en fermant les yeux sous la douche", "Mieux se rattraper en cas de déséquilibre"] },
    "Unipodal sur coussin": { s: "Le coussin rend le sol instable : la cheville réagit plus vite et plus souvent. C'est un bon entraînement après une entorse.", e: ["Marcher sur l'herbe, le sable ou un chemin", "Moins d'entorses de cheville", "Rester stable sur un sol glissant"] },
    "Toucher en étoile unipodal": { s: "Sur un pied, l'autre jambe va toucher loin dans plusieurs directions : équilibre, force et contrôle du genou travaillent en même temps.", e: ["Se rattraper quand on trébuche", "Attraper un objet loin de soi sans tomber", "Reprendre un sport avec changements de direction"] },
    "Chat-vache": { s: "On arrondit puis on creuse le dos, vertèbre par vertèbre. Le mouvement nourrit les disques et assouplit la colonne sans forcer.", e: ["Dérouiller le dos le matin", "Soulager un dos raide après être resté assis", "Se pencher plus facilement"] },
    "Rotation thoracique à quatre pattes": { s: "Le haut du dos tourne pendant que le bas reste stable. Retrouver cette rotation soulage souvent la nuque et le bas du dos, qui compensent.", e: ["Se retourner pour regarder derrière soi en voiture", "Attraper un objet sur le siège arrière", "Jouer au golf ou au tennis"] },
    "Fente psoas dynamique": { s: "Le psoas, à l'avant de la hanche, se raccourcit quand on reste assis longtemps. Cette fente l'étire en mouvement et redonne de l'amplitude à la hanche.", e: ["Marcher à grands pas en restant bien droit", "Se redresser après une longue période assise", "Moins de tiraillements dans le bas du dos"] },
    "Essuie-glace genoux pliés": { s: "Les genoux basculent d'un côté à l'autre : le bas du dos tourne doucement et les obliques travaillent. C'est une mobilisation douce de la colonne.", e: ["Se tourner dans le lit", "Assouplir le bas du dos", "Sortir du lit en roulant sur le côté"] },
    "Montées de genoux": { s: "On lève les genoux en rythme : les fléchisseurs de hanche travaillent et le cœur accélère. C'est un échauffement et un cardio sans saut.", e: ["Monter les escaliers sans traîner les pieds", "Enjamber un obstacle", "Améliorer le souffle"] },
    "Jumping jack sans saut": { s: "Bras et jambes s'écartent en rythme, sans quitter le sol : le cœur et la respiration travaillent sans choc pour les articulations.", e: ["Améliorer le souffle au quotidien", "S'échauffer avant une activité", "Bouger sans abîmer genoux et hanches"] },
    "Skater latéral sans saut": { s: "Un grand pas de côté, puis l'autre : les fessiers et l'intérieur des cuisses freinent et relancent le mouvement latéral.", e: ["Faire un pas de côté rapide pour se rattraper", "Éviter quelqu'un sur le trottoir", "Reprendre le tennis ou le football"] },
    "Rotation externe à l'élastique": { s: "L'élastique résiste quand le bras tourne vers l'extérieur : la coiffe des rotateurs se renforce et garde l'épaule centrée.", e: ["Se coiffer sans douleur d'épaule", "Lancer ou servir au tennis", "Attraper un objet en hauteur"] },
    "Rotation interne à l'élastique": { s: "Le subscapulaire, devant l'omoplate, tourne le bras vers l'intérieur. Il est indispensable aux gestes derrière le dos.", e: ["Mettre la main dans le dos", "Attacher un soutien-gorge ou rentrer sa chemise", "Mettre la main dans sa poche arrière"] },
    "Pull-apart à l'élastique": { s: "On écarte l'élastique bras tendus : l'arrière des épaules et les muscles entre les omoplates ramènent les épaules en arrière.", e: ["Garder les épaules ouvertes", "Se tenir droit devant l'écran", "Moins de tensions dans le haut du dos"] },
    "Tirage horizontal à l'élastique": { s: "Le dos tire l'élastique vers soi, coudes près du corps : c'est le geste de tirer, avec une résistance progressive.", e: ["Tirer une porte ou un tiroir lourd", "Tirer une valise à roulettes", "Ramer"] },
    "Face pull à l'élastique": { s: "On tire vers le visage en ouvrant les coudes : l'arrière des épaules et les rotateurs externes travaillent ensemble. C'est l'exercice anti-épaules enroulées.", e: ["Garder les épaules en arrière", "Moins de tension dans la nuque au bureau", "Lever les bras au-dessus de la tête plus librement"] },
    "Pallof press": { s: "On pousse l'élastique devant soi en résistant à la rotation : le tronc apprend à ne pas se tordre quand une force tire sur le côté.", e: ["Porter une charge sans se tordre", "Tenir un chien qui tire en laisse", "Garder l'équilibre dans un transport qui freine"] },
    "Squat élastique aux genoux": { s: "L'élastique tire les genoux vers l'intérieur et les fessiers doivent résister : le genou reste dans l'axe pendant la flexion.", e: ["Se lever d'une chaise sans que les genoux rentrent", "Descendre les escaliers sans douleur au genou", "Protéger le genou dans les sports"] },
    "Extension terminale du genou": { s: "L'élastique derrière le genou oblige le quadriceps à finir le mouvement : on récupère les derniers degrés d'extension, souvent perdus après une blessure.", e: ["Tendre complètement le genou pour bien marcher", "Rester debout sans fatigue du genou", "Récupérer après une opération du genou"] },
    "Marche latérale élastique": { s: "En marchant de côté contre l'élastique, le moyen fessier travaille à chaque pas pour garder le bassin stable.", e: ["Marcher sans se déhancher", "Être plus stable sur une jambe", "Moins de douleurs au genou et à la hanche"] },
    "Goblet squat": { s: "Le poids tenu devant la poitrine aide à garder le buste droit : jambes et fessiers travaillent davantage, et le dos reste protégé.", e: ["Se baisser en portant un objet devant soi, comme un enfant", "Poser un carton au sol", "Se relever avec une charge dans les bras"] },
    "Soulevé de terre roumain avec charge": { s: "Avec une charge, on plie à la hanche, dos droit : fessiers et ischio-jambiers soulèvent le poids, pas le bas du dos. C'est le geste de base pour soulever sans se blesser.", e: ["Soulever un carton du sol sans mal de dos", "Sortir les courses du coffre", "Porter un pack d'eau"] },
    "Développé épaules assis": { s: "Assis, on pousse la charge au-dessus de la tête : les deltoïdes et les triceps travaillent sans que le dos compense.", e: ["Ranger une valise en hauteur", "Mettre un objet lourd sur une armoire", "Lever les bras avec une charge sans douleur"] },
    "Fente avec charge": { s: "La fente devient plus exigeante avec un poids : cuisses et fessiers travaillent comme lorsqu'on monte chargé.", e: ["Monter les escaliers avec les courses", "Porter un enfant en montant", "Randonner avec un sac à dos"] },
    "Hip thrust lesté": { s: "Le hip thrust avec une charge sur le bassin pousse le grand fessier près de son maximum. C'est l'exercice le plus efficace pour gagner de la force de hanche.", e: ["Plus de force pour se relever et monter", "Pousser une charge lourde", "Courir et sprinter plus fort"] },
    "Élévation du bâton bras tendus": { s: "En montant le bâton, les épaules travaillent sur toute leur amplitude et les omoplates apprennent à bien tourner. Le bâton guide les deux bras à la même hauteur.", e: ["Attraper un objet sur une étagère haute", "Se coiffer, enfiler un pull", "Étendre le linge"] },
    "Rotation du buste bâton sur les épaules": { s: "Le haut du dos (la colonne thoracique) est fait pour tourner. En retrouvant cette rotation, on soulage la nuque et le bas du dos, qui compensent quand il est raide.", e: ["Se retourner pour regarder derrière soi en voiture", "Attraper quelque chose sur le côté", "Jouer au golf, au tennis ou à la pétanque"] },
    "Good morning au bâton": { s: "Le bâton sur la nuque aide à garder le dos droit pendant que les hanches plient. Les fessiers et l'arrière des cuisses apprennent à porter le buste à la place du bas du dos.", e: ["Se pencher au-dessus du lavabo ou de l'évier", "Charger le lave-vaisselle", "Ramasser un objet léger avec le bon geste"] },
    "Serrage de ballon entre les genoux": { s: "Serrer le ballon fait travailler les adducteurs, les muscles de l'intérieur des cuisses, sans bouger l'articulation. Ils stabilisent le bassin et les genoux.", e: ["Monter et descendre de voiture en gardant les genoux ensemble", "Rester stable en marchant", "Soulager une hanche ou un pubis sensibles"] },
    "Pont avec ballon entre les genoux": { s: "Le pont renforce les fessiers ; le ballon ajoute l'intérieur des cuisses et garde les genoux alignés. Le bassin devient plus solide et plus stable.", e: ["Se retourner dans le lit", "Monter les escaliers", "Moins de douleurs au bas du dos debout"] },
    "Squat ballon bras tendus": { s: "Cuisses et fessiers redressent le corps pendant que les bras tendus servent de contrepoids. On apprend à descendre plus bas en restant équilibré.", e: ["Se lever d'une chaise basse ou du canapé", "S'accroupir pour ramasser un objet", "Porter un objet devant soi en se baissant"] },
    "Tirage serviette au-dessus de la tête": { s: "Tirer la serviette vers le bas fait travailler le grand dorsal et les muscles entre les omoplates. Ils redressent le haut du dos et tirent les bras vers le bas.", e: ["Tirer une porte lourde ou un tiroir", "Se hisser en s'aidant d'une rampe", "Se tenir droit plus longtemps"] },
    "Écartement de serviette bras tendus": { s: "En tirant sur la serviette sans la lâcher, les muscles de l'arrière des épaules et entre les omoplates travaillent en isométrie. Ils ramènent les épaules en arrière.", e: ["Garder les épaules ouvertes devant l'écran", "Moins de tension dans la nuque", "Porter un plateau à bout de bras"] },
    "Élévation frontale avec bouteilles": { s: "L'avant de l'épaule, le deltoïde, lève le bras devant soi. C'est le muscle de tous les gestes où l'on tend les bras vers l'avant.", e: ["Porter un plateau ou une casserole", "Tendre un objet à quelqu'un", "Ranger la vaisselle dans un placard"] },
    "Squat et développé avec bouteilles": { s: "Les jambes poussent et les bras finissent le mouvement : tout le corps travaille ensemble, et le cœur aussi. C'est un geste complet de la vie quotidienne.", e: ["Soulever un carton du sol et le ranger en hauteur", "Monter une valise dans le coffre", "Améliorer le souffle"] },
    "Marche du fermier sur place": { s: "Porter une charge en marchant oblige le ventre, le dos et les épaules à garder le corps droit. Les mains et les avant-bras se renforcent aussi.", e: ["Porter les courses jusqu'à la maison", "Porter des sacs ou une valise", "Marcher droit avec un sac lourd"] },
    "Relevé de jambe tendue couché": { s: "Le quadriceps garde le genou tendu pendant que la hanche lève la jambe. C'est un des premiers exercices pour réveiller la cuisse, sans charge sur le genou.", e: ["Bien tendre la jambe en marchant", "Monter dans le lit ou dans la voiture", "Récupérer après une opération du genou"] },
    "Talons-fesses debout": { s: "Les ischio-jambiers plient le genou en ramenant le talon vers la fesse. Les renforcer protège l'arrière de la cuisse et aide à bien marcher.", e: ["Marcher d'un bon pas", "Monter les escaliers", "Lever le pied pour enfiler une chaussure"] },
    "Toucher d'épaule en planche": { s: "Quand une main quitte le sol, le ventre et le côté du tronc empêchent le corps de tourner. On renforce le gainage et la stabilité des épaules en même temps.", e: ["Porter une charge d'un côté sans se tordre", "Se relever du sol en s'aidant d'une main", "Garder l'équilibre si on est bousculé"] },
    "Crunch inversé": { s: "Le bas des abdominaux enroule le bassin vers les côtes. On renforce le ventre sans tirer sur la nuque.", e: ["Sortir du lit plus facilement", "Se redresser depuis la position allongée", "Protéger le bas du dos en portant"] },
    "Fente arrière et montée de genou": { s: "La fente arrière renforce la cuisse et le fessier, puis la montée de genou ajoute l'équilibre sur une jambe. C'est proche de la marche rapide et des escaliers.", e: ["Monter les escaliers d'un pas sûr", "Enjamber un obstacle", "Reprendre la course ou un sport"] },
    "Squat ballon dans le dos contre le mur": { s: "Le ballon soutient le dos et guide la descente : les cuisses et les fessiers travaillent pendant que le dos reste droit. On apprend le bon geste du squat en toute sécurité.", e: ["Se lever d'une chaise ou du canapé", "S'accroupir sans perdre l'équilibre", "Reprendre confiance après une douleur de genou"] },
    "Marche talon-pointe livre sur la tête": { s: "Marcher pied devant pied réduit la base d'appui : chevilles et hanches corrigent sans arrêt. Le livre oblige à garder la tête droite, ce qui améliore la posture.", e: ["Marcher sur un chemin étroit", "Se tenir droit en marchant", "Moins de risques de chute"] },
    "Le bûcheron avec ballon": { s: "Le mouvement en diagonale relie les jambes, le tronc et les épaules. Les obliques freinent et relancent la rotation, comme dans beaucoup de gestes du quotidien.", e: ["Jardiner, ratisser, pelleter", "Ranger un objet du bas vers le haut", "Porter un enfant d'un côté à l'autre"] },
    "Le boxeur": { s: "Les coups rapides font monter le cœur et travaillent les épaules et le gainage, sans aucun choc pour les articulations.", e: ["Améliorer le souffle au quotidien", "Garder des épaules toniques", "Se défouler et réduire le stress"] },
    "Le nageur": { s: "Allongé sur le ventre, tout l'arrière du corps travaille : muscles du dos, fessiers et arrière des épaules. Ils redressent la colonne et protègent le bas du dos.", e: ["Se tenir droit plus longtemps", "Moins de douleurs dans le dos", "Mieux nager le crawl"] },
    "Le grimpeur debout": { s: "Bras et jambes opposés travaillent ensemble, comme à la marche. Le cerveau entraîne la coordination pendant que le cœur accélère.", e: ["Monter les escaliers d'un bon pas", "Attraper un objet en hauteur", "Améliorer le souffle"] },
    "Position du skieur": { s: "Tenir cette position fait travailler les cuisses en isométrie, avec l'équilibre en plus puisqu'il n'y a pas de mur.", e: ["Descendre une pente ou des escaliers", "Rester accroupi pour bricoler ou jardiner", "Préparer une reprise du ski"] },
    "Passage genou au sol": { s: "Poser un genou au sol et se relever, c'est la base pour savoir se relever d'une chute. Cuisses, fessiers et équilibre travaillent ensemble.", e: ["Se relever du sol après une chute", "Jouer par terre avec les enfants", "Chercher un objet sous un meuble"] },
    "Le chef d'orchestre": { s: "Les grands mouvements de bras perturbent l'équilibre : la cheville, la hanche et le tronc apprennent à se rattraper très vite.", e: ["Garder l'équilibre en se tournant", "Se rattraper quand on est bousculé", "Moins de risques de chute"] },
    "Superman serviette": { s: "En tirant la serviette vers les épaules, le grand dorsal et les muscles entre les omoplates redressent le haut du dos, contre la position voûtée.", e: ["Se tenir droit devant l'écran", "Tirer une porte ou un tiroir", "Moins de tensions dans le haut du dos"] },
    "Squat sumo ballon au sol": { s: "Pieds écartés, les fessiers et l'intérieur des cuisses travaillent davantage. Poser le ballon au sol entraîne le geste de ramasser un objet.", e: ["Ramasser un objet au sol en gardant le dos plat", "Se baisser vers un enfant ou un animal", "Soulever un panier à linge"] },
    "Rotation ballon assis": { s: "Le tronc tourne pendant que le bassin reste fixe : les obliques et les muscles du dos travaillent en douceur, sans charge sur les jambes.", e: ["Se retourner pour attraper un objet sur le côté", "Attacher sa ceinture de sécurité", "Garder un dos mobile"] },
    "Élévation des talons bras au plafond": { s: "Les mollets soulèvent le corps pendant que les bras tendus étirent tout le corps vers le haut. On travaille la force, l'équilibre et la posture.", e: ["Attraper un objet en hauteur sur la pointe des pieds", "Marcher plus longtemps", "Se tenir plus droit"] },
    "Fente avant et rotation ballon": { s: "La fente renforce cuisse et fessier ; la rotation ajoute le contrôle du tronc et du genou. C'est un mouvement complet, proche des sports et des gestes du quotidien.", e: ["Se retourner en marchant", "Reprendre un sport (tennis, football, golf)", "Porter un objet en se déplaçant"] }
  };
  function usage(name) { return USAGE[name] || null; }
  function low(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  var USE_ICON = "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 12l2-2 7-7 7 7 2 2'/><path d='M5 10v10h14V10'/></svg>";
  // Version courte (listes) : les exemples du quotidien
  function usageShort(name) {
    var u = usage(name); if (!u) return "";
    return "<span class='ki-use'>" + USE_ICON + "<span>Utile pour " + esc(u.e.map(low).join(", ")) + ".</span></span>";
  }
  // Version complète (fiche, tuto, page du programme) : l'explication, puis les exemples
  function usageFull(name) {
    var u = usage(name); if (!u) return "";
    return "<details class='ki-why'><summary>" + USE_ICON + "<span>À quoi ça sert ?</span><i aria-hidden='true'>›</i></summary><div class='ki-why-b'><p>" + esc(u.s) + "</p>" +
      "<div class='ki-why-k'>Dans la vie de tous les jours</div><ul>" + u.e.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div></details>";
  }

  // Ajoute l'explication dans l'aperçu de séance, la bibliothèque, la démonstration, le tuto « Première fois » et la page du programme
  function decorate(root) {
    if (!root || !root.querySelectorAll) return;
    // Dans les listes, rien : l'explication s'ouvre seulement si on appuie dessus, dans la fiche
    root.querySelectorAll("#kf-demo .kf-h1, .kf-tuto-h").forEach(function (h) {
      var host = h.parentNode; if (host.querySelector(".ki-why")) return;
      var u = usageFull(h.textContent.trim()); if (!u) return;
      if (h.classList.contains("kf-tuto-h")) { var pts = host.querySelector(".kf-tuto-pts"); (pts || h).insertAdjacentHTML("afterend", u); return; }
      host = h.closest(".kf-sheet-body") || host;
      var cue = host.querySelector(".pg-cue") || host.querySelector(".v2-stage");
      if (cue) cue.insertAdjacentHTML("afterend", u); else h.insertAdjacentHTML("afterend", u);
    });
    if (typeof SEQ_DAYS !== "undefined") root.querySelectorAll(".ex[id^='ex-day']").forEach(function (card) {
      if (card.querySelector(".ki-why")) return;
      var m = /^ex-(day\d+)-(\d+)$/.exec(card.id), ex = m && SEQ_DAYS[m[1]] && SEQ_DAYS[m[1]].exercises[+m[2]];
      var u = ex && usageFull(ex.name), d = card.querySelector(".ex-desc");
      if (u && d) d.insertAdjacentHTML("afterend", u);
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
      "<div class='ki-goal ki-empty'><p>Qu'aimerais-tu <strong>refaire au quotidien</strong> grâce au programme ? Choisis un geste, note-le de 0 à 10, et vois-le progresser.</p>" +
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
      "<div class='kf-h1'>Mon objectif</div><div class='kf-sub'>Un geste du quotidien que la douleur ou la fatigue t'empêche de faire comme avant.</div>" +
      (list ? "<div class='kf-phase' style='color:var(--text2)'>Mes objectifs</div>" + list : "") +
      (canAdd ? "<div class='kf-phase' style='color:var(--text2)'>" + (g.length ? "Ajouter un objectif" : "Choisir") + "</div>" +
        "<div class='kf-chips ki-chips'>" + SUGG.map(function (s) { return "<button type='button' onclick='KineIdees._sugg(this)'>" + esc(s) + "</button>"; }).join("") + "</div>" +
        "<label class='su-label'>Ou écris le tien<input class='kf-text su-input' id='ki-text' maxlength='70' placeholder='Par exemple : porter mon petit-fils' oninput='KineIdees._chk()'></label>" +
        "<div class='su-label'>Aujourd'hui, j'y arrive à…</div>" + scale("n", null)
        : "<p class='lx-muted'>Trois objectifs au maximum : retires-en un pour en ajouter un autre.</p>") +
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
      "<div class='kf-h1'>Où en es-tu ?</div><div class='kf-sub'>Pour chaque objectif, à quel point y arrives-tu aujourd'hui ? 0 = impossible, 10 = comme avant.</div>" +
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
    if (best >= 2) say("Bravo ! Deux points de plus, c'est un vrai progrès que tu ressens au quotidien.");
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
    { q: "Courir abîme forcément les genoux.", a: false,
      e: "Chez les coureurs de loisir, l'arthrose du genou et de la hanche n'est pas plus fréquente que chez les sédentaires. Le cartilage s'adapte aux charges progressives.", s: "Alentorn-Geli et al., JOSPT, 2017" },
    { q: "Marcher d'un bon pas est un vrai exercice pour la santé.", a: true,
      e: "La marche fait travailler le cœur, les muscles et les os. Environ 7 000 pas par jour sont déjà associés à une baisse nette de la mortalité.", s: "Paluch et al., Lancet Public Health, 2022" },
    { q: "Le repos complet est le meilleur traitement d'une tendinite.", a: false,
      e: "Un tendon douloureux guérit mieux avec une charge adaptée et progressive. Le repos total l'affaiblit.", s: "" },
    { q: "Le système nerveux peut apprendre à moins amplifier la douleur.", a: true,
      e: "Avec l'exercice progressif, le sommeil et une meilleure compréhension de la douleur, l'alarme se recalibre. C'est un des buts de ton programme.", s: "" },
    { q: "Un matelas très dur est meilleur pour le dos.", a: false,
      e: "Un matelas moyennement ferme semble plus confortable pour la plupart des personnes qui ont mal au dos. Le meilleur matelas, c'est surtout celui sur lequel tu dors bien.", s: "Kovacs et al., The Lancet, 2003" },
    { q: "On peut se muscler sans aucun matériel.", a: true,
      e: "Le poids du corps suffit à renforcer les muscles, à condition d'augmenter peu à peu la difficulté. C'est le principe de ton programme.", s: "" },
    { q: "Une sciatique se soigne presque toujours par une opération.", a: false,
      e: "La plupart des sciatiques s'améliorent sans chirurgie, en quelques semaines à quelques mois. L'opération est réservée à des situations précises.", s: "" },
    { q: "Bouger dans la journée aide à mieux dormir.", a: true,
      e: "L'activité physique améliore la qualité du sommeil, surtout le sommeil profond. Évite simplement un effort intense juste avant le coucher.", s: "" },
    { q: "Une douleur chronique, c'est dans la tête, donc imaginaire.", a: false,
      e: "La douleur est toujours réelle, même sans lésion visible. Le système nerveux peut devenir trop sensible, et cela se soigne, notamment par le mouvement.", s: "" },
    { q: "Le surpoids augmente la charge sur les genoux.", a: true,
      e: "À chaque pas, le genou supporte plusieurs fois le poids du corps. Perdre quelques kilos soulage nettement des genoux arthrosiques.", s: "Messier et al., Arthritis Rheum, 2005" },
    { q: "Porter une ceinture lombaire tous les jours protège le dos.", a: false,
      e: "Porter une ceinture en permanence ne prévient pas le mal de dos. Renforcer ses propres muscles du tronc est plus utile.", s: "van Duijvenbode et al., Cochrane, 2008" },
    { q: "Le vélo est un sport doux pour les genoux.", a: true,
      e: "Le vélo fait travailler les cuisses sans choc. Il est souvent conseillé en cas d'arthrose du genou, avec une selle bien réglée.", s: "" },
    { q: "Faire des abdos fait maigrir du ventre.", a: false,
      e: "On ne peut pas choisir où le corps perd sa graisse. Les abdominaux renforcent les muscles, mais c'est l'activité générale et l'alimentation qui font maigrir.", s: "Vispute et al., JSCR, 2011" },
    { q: "Le renforcement musculaire rend aussi les os plus solides.", a: true,
      e: "Les os se densifient quand les muscles tirent dessus et qu'on porte son poids. C'est une protection contre l'ostéoporose et les fractures.", s: "" },
    { q: "Avoir mal le lendemain d'une séance veut dire qu'il faut tout arrêter.", a: false,
      e: "Une gêne qui revient à son niveau habituel en 24 heures est acceptable. Si elle dure ou augmente, on allège la séance suivante et on en parle au kiné.", s: "" },
    { q: "Le yoga et le tai-chi peuvent soulager le mal de dos.", a: true,
      e: "Ces pratiques associent mouvement, respiration et détente. Elles aident la lombalgie chronique, comme les autres formes d'exercice.", s: "" },
    { q: "Une épaule douloureuse doit rester immobile.", a: false,
      e: "Immobiliser une épaule trop longtemps la raidit. Des mouvements doux et un renforcement adapté aident à récupérer.", s: "" },
    { q: "Le moral influence la récupération.", a: true,
      e: "La confiance et l'optimisme sont liés à une meilleure récupération après une blessure. Se fixer de petits objectifs atteignables aide beaucoup.", s: "" },
    { q: "Les étirements rendent plus fort.", a: false,
      e: "Les étirements améliorent la souplesse, mais pas la force. Pour être plus fort, il faut faire travailler le muscle contre une résistance.", s: "" },
    { q: "Faire ses exercices devant la télé, ça compte aussi.", a: true,
      e: "Ce qui compte, c'est de les faire, pas l'endroit. Les glisser dans la routine du quotidien aide à tenir sur la durée.", s: "" },
    { q: "Il faut bloquer sa respiration pendant l'effort.", a: false,
      e: "Bloquer la respiration fait monter la tension artérielle. Expire pendant l'effort et inspire au retour.", s: "" },
    { q: "Bien s'hydrater compte aussi pour les muscles.", a: true,
      e: "Même une petite déshydratation diminue la force et l'endurance. Bois régulièrement, sans attendre d'avoir soif.", s: "" },
    { q: "Après 40 ans, les tendons ne peuvent plus se renforcer.", a: false,
      e: "Les tendons s'adaptent à l'entraînement à tout âge, simplement plus lentement. Il suffit d'augmenter la charge progressivement.", s: "" },
    { q: "Fumer ralentit la cicatrisation des os et des tendons.", a: true,
      e: "La nicotine resserre les vaisseaux, donc moins d'oxygène arrive aux tissus. Les fractures consolident plus lentement chez les fumeurs.", s: "" },
    { q: "Les courbatures sont dues à l'acide lactique.", a: false,
      e: "L'acide lactique disparaît environ une heure après l'effort. Les courbatures viennent de petites lésions des fibres musculaires, qui se réparent en quelques jours.", s: "" },
    { q: "Se lever et bouger toutes les heures fait du bien au dos.", a: true,
      e: "Couper les longues périodes assises détend les muscles et nourrit les disques. Une minute de marche toutes les heures, c'est déjà bien.", s: "" },
    { q: "Un muscle qui tremble pendant l'effort, c'est dangereux.", a: false,
      e: "Les tremblements montrent simplement que le muscle travaille près de sa limite. Sans douleur, c'est normal.", s: "" },
    { q: "Une articulation qui gonfle après l'effort, ce n'est jamais grave.", a: false,
      e: "Un gonflement qui apparaît ou augmente doit être signalé à ton kiné. Il peut indiquer qu'il faut adapter la charge.", s: "" },
    { q: "Il faut des semelles orthopédiques pour tous les pieds plats.", a: false,
      e: "Beaucoup de pieds plats ne posent aucun problème. Les semelles se discutent seulement en cas de douleur.", s: "" },
    { q: "Se muscler rend forcément très musclé et massif.", a: false,
      e: "Prendre beaucoup de volume demande des années d'entraînement intensif et une alimentation adaptée. Le renforcement apporte surtout de la force, du tonus et des os plus solides.", s: "" },
    { q: "Faire craquer son dos ou ses doigts abîme les articulations.", a: false,
      e: "Le bruit vient d'une petite bulle de gaz qui se forme dans le liquide de l'articulation. Les études n'ont pas trouvé plus d'arthrose chez ceux qui font craquer leurs doigts.", s: "deWeber et al., JABFM, 2011" },
    { q: "S'étirer avant le sport évite les courbatures.", a: false,
      e: "Les études montrent que les étirements ne réduisent presque pas les courbatures. Un échauffement progressif prépare mieux le corps.", s: "Herbert et al., Cochrane, 2011" },
    { q: "Avoir mal pendant un exercice veut dire qu'on s'abîme.", a: false,
      e: "La douleur est une alarme, souvent plus sensible que nécessaire. Une gêne jusqu'à 5 sur 10, qui se calme dans les 24 heures, est acceptable pendant la rééducation.", s: "Smith et al., BJSM, 2017" },
    { q: "Le froid ou le chaud peuvent soulager une douleur.", a: true,
      e: "Ils brouillent en partie le signal de douleur envoyé au cerveau. Le froid calme un gonflement récent, le chaud détend les muscles raides.", s: "" },
    { q: "Plus on a mal, plus la blessure est grave.", a: false,
      e: "L'intensité de la douleur ne reflète pas la gravité des dégâts. Un petit choc peut faire très mal, et une vraie lésion peut passer presque inaperçue.", s: "" },
    { q: "Avec un mal de dos, le mieux est de rester au lit.", a: false,
      e: "Rester alité ralentit la récupération. Rester actif, même doucement, aide le dos à guérir plus vite.", s: "Dahm et al., Cochrane, 2010" },
    { q: "Une hernie discale peut se résorber toute seule.", a: true,
      e: "Dans beaucoup de cas, le corps fait régresser la hernie en quelques mois. Les plus grosses sont même celles qui diminuent le plus souvent.", s: "Chiu et al., Clin Rehabil, 2015" },
    { q: "Le renforcement musculaire est mauvais pour les articulations.", a: false,
      e: "Des muscles forts absorbent les chocs et soulagent les articulations. Le renforcement fait partie des traitements recommandés de l'arthrose du genou et de la hanche.", s: "OARSI, 2019" },
    { q: "Avoir des courbatures le lendemain d'une séance, c'est normal.", a: true,
      e: "Elles arrivent un à deux jours après un effort inhabituel et disparaissent en quelques jours. Elles diminuent à mesure que le corps s'habitue.", s: "" },
    { q: "Il faut attendre de ne plus avoir mal du tout pour reprendre le sport.", a: false,
      e: "Une reprise progressive, avec une gêne légère qui se calme, vaut souvent mieux qu'un repos complet. Ton kiné t'aide à doser l'effort.", s: "" },
    { q: "Bien dormir aide les muscles à récupérer.", a: true,
      e: "C'est pendant le sommeil profond que le corps répare les tissus. Sept à neuf heures par nuit, c'est l'idéal pour un adulte.", s: "" },
    { q: "Il existe une posture parfaite à garder toute la journée.", a: false,
      e: "Aucune posture n'est dangereuse en soi : c'est de rester figé trop longtemps qui fatigue. La meilleure posture, c'est la suivante, alors bouge souvent.", s: "Slater et al., BJSM, 2019" },
    { q: "Le gainage, ça sert seulement à avoir un ventre plat.", a: false,
      e: "Le gainage apprend aux muscles du tronc à protéger la colonne quand on porte, pousse ou se penche. C'est utile pour le dos, pas seulement pour l'apparence.", s: "" },
    { q: "Le mal de dos vient presque toujours d'une vertèbre déplacée.", a: false,
      e: "Les vertèbres ne se déplacent pas comme on l'imagine. Dans la grande majorité des cas, aucune lésion grave n'est trouvée, et le dos s'améliore en restant actif.", s: "Maher et al., The Lancet, 2017" },
    { q: "Soulever une charge le dos rond est forcément dangereux.", a: false,
      e: "Le dos est solide et fait pour se plier. Les études ne montrent pas que le dos rond cause plus de douleur ; l'important, c'est d'y aller progressivement.", s: "Saraceni et al., JOSPT, 2020" },
    { q: "La plupart des lombalgies récentes s'améliorent en quelques semaines.", a: true,
      e: "La douleur diminue nettement dans les six premières semaines chez la plupart des personnes. Rester actif aide à aller mieux plus vite.", s: "Menezes Costa et al., CMAJ, 2012" },
    { q: "Bouger quand on a mal peut libérer des antidouleurs naturels.", a: true,
      e: "L'effort libère des substances, comme les endorphines, qui atténuent la douleur. C'est pour ça qu'on se sent souvent mieux après une séance.", s: "" },
    { q: "Une IRM qui montre une hernie explique forcément la douleur.", a: false,
      e: "Beaucoup de personnes sans aucune douleur ont des hernies ou de l'usure à l'IRM. Ce sont souvent des signes normaux de l'âge, comme les cheveux gris.", s: "Brinjikji et al., AJNR, 2015" },
    { q: "Respirer lentement peut aider à calmer la douleur.", a: true,
      e: "Une respiration lente, environ six respirations par minute, apaise le système nerveux. C'est la cohérence cardiaque de tes étirements.", s: "" },
    { q: "Un genou qui craque est forcément un genou abîmé.", a: false,
      e: "Les craquements sont très fréquents, même chez les personnes en bonne santé. Sans douleur ni gonflement, ils ne sont pas inquiétants.", s: "" },
    { q: "Après 70 ans, il est trop tard pour se muscler.", a: false,
      e: "On gagne de la force à tout âge, même après 90 ans. Le renforcement améliore la marche et réduit le risque de chute.", s: "Fiatarone et al., JAMA, 1990" },
    { q: "Les antidouleurs suffisent pour guérir un mal de dos.", a: false,
      e: "Ils peuvent soulager un moment, mais ils ne réparent rien. Le mouvement et l'exercice restent le traitement le plus efficace sur la durée.", s: "" },
    { q: "Le stress peut rendre la douleur plus forte.", a: true,
      e: "Le cerveau règle le volume de la douleur, et le stress le monte. Respirer, bouger et se détendre aident à le baisser.", s: "" },
    { q: "Avoir des jambes fortes réduit le risque de chute.", a: true,
      e: "Des cuisses et des mollets forts rattrapent mieux un déséquilibre. Avec des exercices d'équilibre, le renforcement réduit nettement les chutes.", s: "Sherrington et al., Cochrane, 2019" },
    { q: "Si je rate une séance, je dois tout recommencer.", a: false,
      e: "Une séance manquée ne fait pas perdre tes progrès. Reprends simplement à la suivante : c'est la régularité sur plusieurs semaines qui compte.", s: "" },
    { q: "Avoir peur de bouger peut entretenir la douleur.", a: true,
      e: "Quand on évite un geste par peur, les muscles s'affaiblissent et le geste devient plus difficile. Le reprendre petit à petit rassure le corps et le cerveau.", s: "" },
    { q: "S'échauffer avant l'effort ne sert pas à grand-chose.", a: false,
      e: "L'échauffement réchauffe les muscles, active la circulation et réveille la coordination. Il réduit le risque de blessure, surtout dans les sports avec des changements de direction.", s: "" },
    { q: "Mal dormir peut augmenter la douleur.", a: true,
      e: "Une mauvaise nuit rend le système nerveux plus sensible à la douleur. Prendre soin de son sommeil fait partie du traitement.", s: "Finan et al., J Pain, 2013" },
    { q: "Marcher régulièrement aide à éviter que le mal de dos revienne.", a: true,
      e: "Une grande étude de 2024 montre qu'un programme de marche progressif réduit nettement les rechutes. Environ 30 minutes, 5 fois par semaine, à ton rythme.", s: "Pocovi et al., The Lancet, 2024" },
    { q: "Avec de l'arthrose, il vaut mieux éviter de bouger.", a: false,
      e: "Le mouvement nourrit le cartilage et les muscles protègent l'articulation. L'exercice est le premier traitement recommandé de l'arthrose.", s: "OARSI, 2019" }
  ];
  // Une question par jour ; l'historique garde la dernière réponse à chaque question
  function dayNo() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function vfIdx() { return dayNo() % VF.length; }
  function spoken(i) { var v = VF[i]; return (v.a ? "C'est vrai. " : "C'est faux. ") + v.e; }
  // Historique rangé par question (le texte), pour rester juste quand on ajoute des questions
  function qIndex(q) { for (var i = 0; i < VF.length; i++) if (VF[i].q === q) return i; return -1; }
  function hist() {                           // { indice actuel: { a, d } }
    var raw = jget("kf-vf-hist", {}), h = {};
    if (!raw || typeof raw !== "object") return h;
    Object.keys(raw).forEach(function (k) {
      var i = /^\d+$/.test(k) ? +k + 30 : qIndex(k);   // anciennes réponses (liste de 30, rangées par numéro)
      if (VF[i] && raw[k]) h[i] = raw[k];
    });
    return h;
  }
  function saveHist(h) { var o = {}; Object.keys(h).forEach(function (i) { o[VF[+i].q] = h[i]; }); jset("kf-vf-hist", o); }
  function answered() {                       // les questions déjà répondues, la plus récente d'abord
    var h = hist();
    return Object.keys(h).map(function (i) { return { i: +i, a: h[i].a, d: h[i].d }; })
      .sort(function (x, y) { return x.d < y.d ? 1 : x.d > y.d ? -1 : 0; });
  }
  var VF_ICON = "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='9'/><path d='M9.2 9.2a3 3 0 0 1 5.6 1.3c0 2-2.8 2.4-2.8 4'/><path d='M12 17.5h.01'/></svg>";
  function verdict(v, mine) {
    var good = mine === v.a;
    return "<b class='" + (good ? "ok" : "ko") + "'>" + (good ? "Bien vu ! " : "Pas tout à fait. ") + (v.a ? "C'est vrai." : "C'est faux.") + "</b>";
  }
  // « Encore une question » : une question jamais répondue, au hasard (jamais celle du jour)
  var extra = null;
  function pool() { var h = hist(), t = vfIdx(), out = []; for (var k = 0; k < VF.length; k++) if (k !== t && !h[k]) out.push(k); return out; }
  function vfMore() {
    var p = pool(); if (!p.length) return;
    extra = p[Math.floor(Math.random() * p.length)];
    var old = $("ki-vf"); if (old) old.replaceWith(vfCard());
    if (typeof stopSpeech === "function") stopSpeech();
  }
  function vfCard() {
    var i = extra != null ? extra : vfIdx(), v = VF[i], h = hist()[i], n = answered().length;
    var mine = h && (extra != null || h.d === iso()) ? h.a : null;
    var c = document.createElement("div");
    c.className = "ki-vf"; c.id = "ki-vf";
    var face = window.KineMascotte && KineMascotte.portrait && yassOn() ? KineMascotte.portrait() : null;
    var html = "<span class='ks-tag'>" + VF_ICON + (extra != null ? "Vrai ou faux, encore une" : "Vrai ou faux du jour") + "</span><p class='ki-q'>« " + esc(v.q) + " »</p>";
    if (mine == null) {
      html += "<div class='ki-vf-b'><button type='button' onclick='KineIdees._vf(true)'>Vrai</button><button type='button' onclick='KineIdees._vf(false)'>Faux</button></div>";
    } else {
      html += "<div class='ki-vf-r'>" + (face ? "<img src='" + face + "' alt=''>" : "") +
        "<div>" + verdict(v, mine) + "<p>" + esc(v.e) + "</p>" + (v.s ? "<small>" + esc(v.s) + "</small>" : "") +
        "<button type='button' class='ki-replay' onclick='KineIdees._vfSay(" + i + ")'>Écouter Yass</button></div></div>";
    }
    var today = hist()[vfIdx()], todayDone = today && today.d === iso();
    if (mine != null && todayDone && pool().length) html += "<button type='button' class='ki-more' onclick='KineIdees.vfMore()'>Encore une question</button>";
    if (n) html += "<button type='button' class='ki-vf-all' onclick='KineIdees.vfList(0)'><span>Mes réponses (" + n + ")</span><span aria-hidden='true'>›</span></button>";
    c.innerHTML = html;
    return c;
  }
  function vfAnswer(a) {
    var i = extra != null ? extra : vfIdx();
    var h = hist(); h[i] = { a: a, d: iso() }; saveHist(h);
    var old = $("ki-vf"); if (old) old.replaceWith(vfCard());
    say(spoken(i));
  }
  // Revoir les questions déjà répondues, comme les fiches « Le saviez-vous ? »
  function vfList(k) {
    var L = answered(); if (!L.length) return;
    k = (k + L.length) % L.length;
    var it = L[k], v = VF[it.i], sh = $("ki-vf-sheet");
    if (!sh) { sh = document.createElement("div"); sh.id = "ki-vf-sheet"; sh.className = "kf-sheet ks-sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Mes réponses au vrai ou faux"); document.body.appendChild(sh); }
    sh.innerHTML = "<div class='kf-sheet-body ks-body'>" +
      "<button class='kf-back' onclick='KineIdees.vfClose()' aria-label='Fermer'>←</button>" +
      "<div class='ks-tag ki-vf-tag'>" + VF_ICON + "Vrai ou faux · répondu le " + dfr(it.d) + "</div>" +
      "<h2 class='ks-h'>« " + esc(v.q) + " »</h2>" +
      "<div class='ki-vf-r'><div>" + verdict(v, it.a) + "<small>Ta réponse : " + (it.a ? "vrai" : "faux") + "</small></div></div>" +
      "<p class='ks-p'>" + esc(v.e) + "</p>" +
      (v.s ? "<div class='ks-ref'><span>Source</span><strong>" + esc(v.s) + "</strong></div>" : "") +
      "<button type='button' class='ki-replay' onclick='KineIdees._vfSay(" + it.i + ")'>Écouter Yass</button>" +
      "<p class='ks-note'>Ces informations générales ne remplacent pas l'avis de ton kinésithérapeute ou de ton médecin.</p>" +
      "</div><div class='kf-sheet-foot ks-foot'>" +
      "<button class='seq-btn-secondary' onclick='KineIdees.vfList(" + (k - 1) + ")' aria-label='Précédent'>‹</button>" +
      "<span class='ks-count'>" + (k + 1) + " sur " + L.length + "</span>" +
      "<button class='seq-btn-secondary' onclick='KineIdees.vfList(" + (k + 1) + ")' aria-label='Suivant'>›</button></div>";
    sh.classList.add("open");
    var body = sh.querySelector(".ks-body"); if (body) body.scrollTop = 0;
  }
  function vfClose() { var sh = $("ki-vf-sheet"); if (sh) sh.classList.remove("open"); if (typeof stopSpeech === "function") stopSpeech(); }

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
    vf: VF, vfIdx: vfIdx, spoken: spoken, express: express, defineExpress: defineExpress, decorate: decorate, USAGE: USAGE, usageFull: usageFull,
    _pick: pick, _sugg: sugg, _chk: chk, _saveNew: saveNew, _del: del, _saveRate: saveRate, _close: closeSheet,
    _vf: vfAnswer, _vfSay: function (i) { say(spoken(i == null ? vfIdx() : i)); }, vfList: vfList, vfClose: vfClose, vfMore: vfMore, answered: answered
  };

  function init() {
    var box = $("today-card");
    if (box) { placeHome(); new MutationObserver(function () { if (!$("ki-vf") || !$("ki-express")) placeHome(); }).observe(box, { childList: true }); }
    watchSheets();
    decorate(document.body);
    new MutationObserver(watchSheets).observe(document.body, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
