/* ═══════════════════════════════════════════════════════════════
   KinéForce — Mascotte
   L'avatar 3D apparaît de temps en temps en bas de l'écran (accueil, suivi),
   cadré du buste, avec une bulle et des gestes (coucou, montrer, bravo).
   Règles : une apparition au maximum par ouverture de l'appli, jamais pendant
   une séance, et on peut la couper (réglage « kf-mascotte » = "off").
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var NAME = "__mascotte";
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ════════ Gestes ════════
     Bras : ang = [flexion épaule, abduction, rotation, flexion coude] */
  var registered = false;
  function register() {
    if (registered || !window.KineAvatar || !KineAvatar.lib) return !!registered;
    var L = KineAvatar.lib, base = L.STAND(0.11, 8);
    function pose(la, ra, extra) { return L.merge(base, { LA: { ang: la }, RA: { ang: ra } }, extra || {}); }
    var DOWN = [4, 7, 0, 10];
    KineAvatar.register(NAME, {
      camera: { yaw: 0.45, pitch: 0.04, dist: 1.95, ty: 1.4 },
      start: "idle", thumb: "idle",
      poses: {
        idle:   pose(DOWN, DOWN),
        wave1:  pose([0, 82, 40, 108], DOWN, { head: 4, headZ: 6 }),
        wave2:  pose([0, 82, 120, 108], DOWN, { head: 4, headZ: 6 }),
        open:   pose([10, 60, 0, 20], [10, 60, 0, 20], { head: -4 }),
        point:  pose(DOWN, [25, 55, 0, 8], { head: 8, headY: -14 }),
        cheer1: pose([0, 140, 0, 40], [0, 140, 0, 40], { head: -6 }),
        cheer2: pose([0, 158, 0, 12], [0, 158, 0, 12], { head: -8 }),
        thumb:  pose([90, 0, 0, 95], DOWN, { head: 2 }),
        talkA:  pose([35, 20, 20, 85], [25, 20, -10, 70], { head: 3 }),
        talkB:  pose([25, 20, -10, 70], [35, 20, 20, 85], { head: -2, headY: 6 }),
        // « Bouge avec moi »
        ciel:   pose([0, 165, 0, 10], [0, 165, 0, 10], { head: -6 }),
        avant:  pose([90, 0, 0, 5], [90, 0, 0, 5]),
        ouvre:  pose([0, 90, 60, 5], [0, 90, 60, 5], { head: -8 }),
        couG:   pose(DOWN, DOWN, { headZ: 22 }),
        couD:   pose(DOWN, DOWN, { headZ: -22 }),
        latG:   pose([0, 160, 0, 20], DOWN, { spine: [2, 15, 0] }),
        latD:   pose(DOWN, [0, 160, 0, 20], { spine: [2, -15, 0] })
      }
    });
    // Portrait (tête et épaules), utilisé quand l'avatar 3D est déjà occupé par la séance
    var face = L.merge(base, { LA: { ang: [0, 82, 40, 108] }, RA: { ang: DOWN }, head: 4, headZ: 6 });
    KineAvatar.register(NAME + "_face", { camera: { yaw: 0.12, pitch: 0.0, dist: 1.15, ty: 1.58 }, start: "f", thumb: "f", poses: { f: face } });
    registered = true;
    return true;
  }
  var GESTURES = {
    wave:  [["wave1", 0.45], ["wave2", 0.32], ["wave1", 0.32], ["wave2", 0.32], ["wave1", 0.32], ["talkA", 0.5], ["talkB", 0.6], ["talkA", 0.6], ["idle", 0.7]],
    point: [["talkA", 0.5], ["talkB", 0.55], ["point", 0.6], ["point", 1.4], ["talkA", 0.6], ["idle", 0.7]],
    cheer: [["cheer1", 0.45], ["cheer2", 0.3], ["cheer1", 0.3], ["cheer2", 0.3], ["thumb", 0.6], ["thumb", 1.2], ["idle", 0.7]],
    open:  [["open", 0.6], ["talkA", 0.55], ["talkB", 0.55], ["open", 0.6], ["open", 1], ["idle", 0.7]]
  };

  /* ════════ Contenus (à valider par le kiné) ════════ */
  var FAQ = [
    ["J'ai des courbatures, c'est normal ?", "Oui, surtout les premières semaines. Une courbature, c'est une raideur dans le muscle qui apparaît 1 à 2 jours après l'effort, diffuse, et qui diminue quand tu bouges. Elle passe en 2 à 4 jours. Tu peux faire ta séance en réduisant un peu l'amplitude."],
    ["Douleur ou courbature, comment faire la différence ?", "La courbature est dans le muscle, diffuse, souvent des deux côtés, et elle s'améliore en bougeant. Une douleur à surveiller est dans l'articulation ou à un point précis, vive, augmente pendant l'exercice ou te réveille la nuit. Dans ce cas, utilise le bouton « J'ai mal » et parles-en à ton kiné."],
    ["J'ai raté une séance, je fais quoi ?", "Pas de panique : fais simplement la séance suivante prévue, sans doubler. Une séance manquée ne casse rien, c'est la régularité sur la semaine qui compte. Après plus d'une semaine sans séance, le programme reprend en semaine 1, pour ta sécurité."],
    ["Je peux faire deux séances le même jour ?", "Mieux vaut pas : les muscles progressent pendant la récupération. Une séance par jour au maximum, et garde au moins un jour de repos dans la semaine."],
    ["Je peux marcher ou faire du sport à côté ?", "La marche, oui, tous les jours si tu peux : c'est un excellent complément. Pour la course, les sports collectifs ou la salle, demande d'abord l'accord de ton kiné, selon ta blessure ou ton opération."],
    ["Comment je dois respirer ?", "Ne bloque jamais ta respiration. Souffle pendant l'effort, quand tu montes ou que tu pousses, et inspire en revenant. Pendant les gainages, respire calmement et régulièrement."],
    ["C'est trop facile, je ne sens rien.", "Dis-le dans le bilan de fin de séance en notant un effort facile : le programme s'adapte et augmente plus tôt. Tu peux aussi ralentir la descente : plus c'est lent, plus c'est exigeant."],
    ["C'est trop dur, je n'y arrive pas.", "Fais ce que tu peux avec une bonne technique, même avec moins de répétitions : le bouton « Terminer » est là pour ça. Note un effort élevé dans le bilan, le programme garde alors le même volume au lieu d'augmenter."],
    ["Quel est le meilleur moment pour ma séance ?", "Celui où tu peux la faire régulièrement. Évite juste de la faire juste après un gros repas."],
    ["Je peux sauter l'échauffement ?", "Non, il ne dure que quelques minutes et prépare tes articulations et tes muscles. C'est aussi ce qui limite les douleurs pendant la séance."],
    ["Chaud ou froid après la séance ?", "Pour une raideur musculaire, la chaleur détend. Si une zone gonfle ou chauffe, le froid 10 à 15 minutes dans un linge soulage. Si une douleur persiste, parles-en à ton kiné."],
    ["Je suis fatigué ou malade aujourd'hui.", "En cas de fièvre, d'infection ou de grosse fatigue, repose-toi et reprends quand ça va mieux. Si c'est juste une petite fatigue, fais la séance avec une série en moins."],
    ["Quand dois-je appeler mon kiné ?", "Si une douleur dépasse 5 sur 10 et ne passe pas, si une articulation gonfle, si la douleur te réveille la nuit, en cas d'instabilité, de fourmillements ou de perte de force. En cas de douleur dans la poitrine, de malaise ou d'essoufflement inhabituel, appelle le 15."],
    ["Où vont mes données ?", "Elles restent sur ton téléphone. Elles ne partent vers ton kiné que si tu utilises « Envoyer à mon kiné », et c'est toi qui choisis à qui les envoyer."]
  ];
  // Erreur la plus fréquente, rappelée pendant le repos avant l'exercice
  var ERRORS = {
    "Squat bilatéral": "Les genoux ne rentrent pas vers l'intérieur : pousse-les dans l'axe des pieds.",
    "Fentes avant unilatérales": "Buste droit, et le genou avant reste au-dessus de la cheville.",
    "Chaise contre le mur": "Dos bien collé au mur, et ne bloque pas ta respiration.",
    "Pont ischio-jambiers talons sur chaise": "Ne cambre pas en haut : serre les fessiers plutôt que de creuser le dos.",
    "Élévation des talons": "Monte haut, puis redescends lentement, sans rebondir.",
    "Step-up sur marche": "Pousse sur la jambe posée sur la marche, sans élan de la jambe du bas.",
    "Rotation externe d'épaule": "Coude collé au corps : c'est l'avant-bras qui tourne, l'épaule ne monte pas.",
    "Pompes sur genoux": "Garde la ligne tête, hanches, genoux : les fesses ne remontent pas.",
    "Dips sur chaise": "90° au coude au maximum, épaules loin des oreilles.",
    "Pike push-up": "La tête descend entre les mains, coudes vers l'arrière et pas vers l'extérieur.",
    "Superman en Y et en W": "Regarde le sol, nuque longue : ce sont les bras qui montent, pas la tête.",
    "Crunch abdominal contrôlé": "Ne tire pas sur la nuque : les mains soutiennent la tête sans tirer.",
    "Portefeuille (V-up)": "Monte sans à-coup, et redescends en contrôlant.",
    "Dead bug": "Le bas du dos reste collé au sol. S'il décolle, réduis l'amplitude.",
    "Superman quadrupédique en gainage": "Bassin stable et horizontal, comme un verre d'eau posé sur ton dos.",
    "Ciseaux et vélo": "Bas du dos plaqué au sol : plus les jambes sont hautes, plus c'est facile.",
    "Plank — gainage avant-bras": "Fesses ni trop hautes ni trop basses, et respire normalement.",
    "Side plank sur genoux": "Hanche bien levée, épaule au-dessus du coude.",
    "Squat sumo": "Genoux ouverts dans l'axe des pieds, dos droit.",
    "Donkey kick": "Ne cambre pas : le mouvement part de la hanche, pas du dos.",
    "Pont de hanche": "Pousse dans les talons et serre les fessiers en haut, sans cambrer.",
    "Clamshell": "Pieds collés et bassin immobile : il ne bascule pas vers l'arrière.",
    "Abduction hanche debout": "Buste droit : la jambe monte sur le côté sans que le corps penche.",
    "Pont fessier unilatéral": "Bassin horizontal : il ne tombe pas du côté de la jambe levée.",
    "Squat + élévation bras": "Les bras montent avec le dos droit, sans cambrer en haut.",
    "Inchworm et pompes": "Avance les mains doucement ; plie un peu les genoux si l'arrière des jambes tire.",
    "Fente latérale avec toucher sol": "Le genou plié reste au-dessus du pied, l'autre jambe tendue.",
    "Burpee modifié sans saut": "Pose bien les mains au sol avant de reculer les pieds.",
    "Équilibre unipodal": "Fixe un point devant toi, et reste près d'un appui."
  };
  var BOUGE = [
    { name: "Bras au ciel", say: "Bras au ciel. On inspire en montant, on souffle en descendant.", seq: [["ciel", 2], ["idle", 2]] },
    { name: "Ouverture de la poitrine", say: "On ouvre la poitrine. Bras devant, puis on ouvre grand.", seq: [["avant", 1.8], ["ouvre", 2]] },
    { name: "Inclinaison du cou", say: "Le cou, tout doucement. Oreille vers l'épaule, d'un côté puis de l'autre.", seq: [["couG", 3], ["idle", 1.5], ["couD", 3], ["idle", 1.5]] },
    { name: "Inclinaison du buste", say: "On s'étire sur le côté. Le bras passe au-dessus de la tête.", seq: [["latG", 2.5], ["idle", 1.5], ["latD", 2.5], ["idle", 1.5]] }
  ];
  var BOUGE_SEC = 30;

  /* ════════ Messages ════════ */
  function sessions() { try { return JSON.parse(get("kf-sessions") || "[]"); } catch (e) { return []; } }
  function weekMessage() {
    if (!window.KineProgress) return null;
    var st = KineProgress.state(); if (!st.start) return null;
    var key = st.cycleDone ? "fin" : "S" + st.week;
    if (get("kf-masc-week") === key) return null;
    var p = KineProgress.plan(), t;
    if (st.cycleDone) t = "Ton cycle de 4 semaines est terminé, bravo ! Parle à ton kiné de la suite : il pourra t'en préparer un nouveau.";
    else if (st.week === 1) t = "Bienvenue ! Cette semaine, 2 séries par exercice. On apprend les bons gestes, pas de course à la performance.";
    else if (st.week === 2) t = p.high ? "Semaine 2 ! Tu as noté des séances difficiles, alors on garde le même volume. On augmentera quand ce sera plus facile."
      : p.series >= 3 ? "Semaine 2 ! Les séances te semblent faciles, alors on passe à 3 séries par exercice."
      : "Semaine 2 ! On ajoute 2 répétitions à chaque exercice. Ton corps s'est habitué, on augmente un petit peu.";
    else if (st.week === 3) t = p.high ? "Semaine 3 ! Tes dernières séances étaient dures, on reste à 2 séries. C'est toi qui donnes le rythme."
      : "Semaine 3 : on passe à 3 séries. C'est la semaine du renforcement, c'est normal de le sentir un peu plus.";
    else t = "Dernière semaine ! 3 séries, et certains exercices passent à une version plus exigeante, comme le squat avec une pause de 2 secondes en bas.";
    return { id: "semaine-" + key, gesture: "open", text: t, onShow: function () { set("kf-masc-week", key); } };
  }
  function pickMessage(page) {
    var today = iso(), ss = sessions();
    var last = ss.map(function (s) { return String(s.date).slice(0, 10); }).sort().pop();
    var gap = last ? Math.round((new Date(today) - new Date(last)) / 86400000) : null;
    var doneToday = ss.some(function (s) { return String(s.date).slice(0, 10) === today; });
    var noted = window.KineCheckin && KineCheckin.get(today);
    var M = [], wk = weekMessage();
    if (page === "suivi") {
      var ins = window.KineCheckin && KineCheckin.topInsight ? KineCheckin.topInsight() : null;
      if (ins) M.push({ id: "suivi-" + ins.id, gesture: ins.good ? "cheer" : "open", text: ins.text });
    }
    if (wk) M.push(wk);
    if (gap != null && gap >= 4) M.push({ id: "retour", gesture: "open", text: "Content de te revoir ! On reprend en douceur, à ton rythme.", cta: "bouge" });
    if (doneToday && !noted) M.push({ id: "ressenti-apres", gesture: "point", text: "Bravo pour la séance ! Tu me dis comment tu te sens ?", cta: "ressenti" });
    if (!doneToday && !noted && new Date().getHours() >= 9) M.push({ id: "ressenti", gesture: "wave", text: "Tu n'as pas encore donné ton ressenti aujourd'hui. Ça prend 30 secondes !", cta: "ressenti" });
    if (doneToday && noted) M.push({ id: "bravo", gesture: "cheer", text: ss.length + " séance" + (ss.length > 1 ? "s" : "") + " au compteur, continue comme ça !", cta: null });
    if (!doneToday && new Date().getHours() >= 14) M.push({ id: "bouge", gesture: "wave", text: "Pas encore bougé aujourd'hui ? Je te propose une pause de 2 minutes, avec moi.", cta: "bouge" });
    if (page === "home" && !doneToday) M.push({ id: "savoir", gesture: "point", text: "Tu connais le « Le saviez-vous ? » du jour ? Jette un œil, c'est court.", cta: "savoir" });
    var last2 = get("kf-masc-last");
    for (var i = 0; i < M.length; i++) if (last2 !== M[i].id + "|" + today) return M[i];
    return null;
  }

  /* ════════ Affichage ════════ */
  var shown = {}, timer = null, playing = null, mode = null;
  function busy() {
    var g = $("rep-guide"), seq = $("seq-overlay");
    if ((g && g.classList.contains("open")) || (seq && seq.classList.contains("open"))) return true;
    return !!document.querySelector(".kf-sheet.open, #kf-routine.open, #kf-tuto");
  }
  function currentPage() {
    var h = $("page-home"), s = $("page-suivi");
    if (h && h.classList.contains("active")) return "home";
    if (s && s.classList.contains("active")) return "suivi";
    return null;
  }
  function el() {
    var e = $("kf-masc");
    if (e) return e;
    e = document.createElement("div");
    e.id = "kf-masc"; e.className = "kf-masc"; e.setAttribute("role", "status"); e.setAttribute("aria-live", "polite");
    e.innerHTML = "<div class='km-bubble'><div class='km-scroll' id='km-scroll'><p class='km-text' id='km-text'></p><div class='km-list' id='km-list'></div></div><div class='km-acts' id='km-acts'></div></div>" +
      "<button type='button' class='km-stage' id='km-stage' aria-label='Poser une question à la mascotte' onclick='KineMascotte.faq()'></button>";
    document.body.appendChild(e);
    var y0 = null;
    e.addEventListener("touchstart", function (ev) { y0 = ev.touches[0].clientY; }, { passive: true });
    e.addEventListener("touchend", function (ev) { if (y0 != null && ev.changedTouches[0].clientY - y0 > 60 && mode !== "bouge") hide(); y0 = null; });
    return e;
  }
  function play(seq, loop) {
    var i = 0, id = {};
    playing = id;
    (function next() {
      if (playing !== id) return;
      if (i >= seq.length) { if (loop) i = 0; else return; }
      var s = seq[i++]; KineAvatar.step({ pose: s[0], dur: s[1] });
      setTimeout(next, s[1] * 1000);
    })();
  }
  function bubble(text, listHtml, actsHtml) {
    $("km-text").textContent = text || "";
    $("km-text").hidden = !text;
    $("km-list").innerHTML = listHtml || "";
    $("km-acts").innerHTML = actsHtml || "";
    var sc = $("km-scroll"); if (sc) sc.scrollTop = 0;
  }
  function talk(text) { if (typeof speak === "function" && (typeof seqSoundOn === "undefined" || seqSoundOn)) { try { speak(text, { prio: 1, now: true }); } catch (e) {} } }
  function appear() {
    if (!register()) return false;
    var box = el();
    if (!box.classList.contains("open") && !KineAvatar.show($("km-stage"), NAME)) return false;
    box.classList.add("open");
    return true;
  }
  var LATER = "<button class='km-later' onclick='KineMascotte.hide()'>Plus tard</button>";
  var ASK = "<button class='km-later' onclick='KineMascotte.faq()'>Une question ?</button>";
  function show(msg) {
    if (!msg || !appear()) return false;
    mode = "msg";
    var acts = "";
    if (msg.cta === "ressenti") acts = "<button class='km-go' onclick='KineMascotte.act(\"ressenti\")'>Noter mon ressenti</button>";
    if (msg.cta === "savoir") acts = "<button class='km-go' onclick='KineMascotte.act(\"savoir\")'>Lire</button>";
    if (msg.cta === "bouge") acts = "<button class='km-go' onclick='KineMascotte.bouge()'>Bouger avec toi</button>";
    bubble(msg.text, "", msg.acts || (acts + LATER + (msg.cta ? "" : ASK) + "<button class='km-off' onclick='KineMascotte.off(true)'>Ne plus afficher</button>"));
    play(GESTURES[msg.gesture] || GESTURES.wave);
    talk(msg.text);
    if (msg.id) set("kf-masc-last", msg.id + "|" + iso());
    if (msg.onShow) msg.onShow();
    clearTimeout(timer); if (!msg.keep) timer = setTimeout(hide, 16000);
    return true;
  }
  function hide() {
    var h = $("km-hole"); if (h) h.classList.remove("on");
    clearTimeout(timer); clearInterval(bougeT); playing = null; mode = null;
    var box = $("kf-masc"); if (!box || !box.classList.contains("open")) return;
    box.classList.remove("open");
    if (typeof stopSpeech === "function") { try { stopSpeech(); } catch (e) {} }
    setTimeout(function () { if (window.KineAvatar && !box.classList.contains("open") && $("km-stage") && $("km-stage").querySelector("canvas")) { KineAvatar.hide(); } }, 400);
  }
  function maybe() {
    if (get("kf-masc-off") === "1" || busy() || mode) return;
    var page = currentPage(); if (!page || shown[page]) return;   // une apparition au plus par page et par ouverture
    if (page === "home" && !get("kf-masc-tour")) { if (tour(0)) shown[page] = true; return; }
    var msg = pickMessage(page); if (!msg) return;
    if (show(msg)) shown[page] = true;
  }

  /* ════════ « Demande-moi » ════════ */
  function faq() {
    if (mode === "bouge" || busy() || !appear()) return;
    mode = "faq"; clearTimeout(timer);
    bubble("Une question ? Choisis :", FAQ.map(function (q, i) { return "<button class='km-q' onclick='KineMascotte.answer(" + i + ")'>" + esc(q[0]) + "</button>"; }).join(""),
      "<button class='km-go' onclick='KineMascotte.bouge()'>Bouger avec toi</button>" + "<button class='km-later' onclick='KineMascotte.hide()'>Fermer</button>");
    play(GESTURES.open);
  }
  function answer(i) {
    var q = FAQ[i]; if (!q) return;
    mode = "faq"; clearTimeout(timer);
    bubble("", "<p class='km-qt'>" + esc(q[0]) + "</p><p class='km-a'>" + esc(q[1]) + "</p>", "<button class='km-go' onclick='KineMascotte.faq()'>Autre question</button><button class='km-later' onclick='KineMascotte.hide()'>Merci</button>");
    play(GESTURES.talk);
    talk(q[1]);
  }
  GESTURES.talk = [["talkA", 0.55], ["talkB", 0.6], ["talkA", 0.6], ["talkB", 0.6], ["open", 0.6], ["talkA", 0.6], ["idle", 0.8]];

  /* ════════ « Bouge avec moi » ════════ */
  var bougeT = null;
  function bouge() {
    if (busy() || !appear()) return;
    mode = "bouge"; clearTimeout(timer); clearInterval(bougeT);
    var k = 0, t0 = 0;
    function startMove() {
      var m = BOUGE[k]; t0 = Date.now();
      play(m.seq, true);
      talk(m.say);
      tick();
    }
    function tick() {
      var m = BOUGE[k], left = Math.max(0, BOUGE_SEC - Math.floor((Date.now() - t0) / 1000));
      bubble(m.name, "<div class='km-bouge'><span>" + (k + 1) + " sur " + BOUGE.length + "</span><b>" + left + " s</b></div><div class='km-bar'><i style='width:" + Math.round((1 - left / BOUGE_SEC) * 100) + "%'></i></div>",
        "<button class='km-later' onclick='KineMascotte.hide()'>Arrêter</button>");
      if (left <= 0) {
        k++;
        if (k >= BOUGE.length) {
          clearInterval(bougeT);
          var done = "Et voilà, 2 minutes de mouvement ! Ton dos et tes épaules te remercient.";
          bubble(done, "", "<button class='km-go' onclick='KineMascotte.hide()'>Merci !</button>");
          play(GESTURES.cheer); talk(done);
          set("kf-masc-bouge", iso());
          mode = "msg"; timer = setTimeout(hide, 9000);
          return;
        }
        startMove();
      }
    }
    var intro = "C'est parti pour 2 minutes ! Debout ou assis, imite-moi.";
    bubble(intro, "", "<button class='km-later' onclick='KineMascotte.hide()'>Arrêter</button>");
    play(GESTURES.open); talk(intro);
    setTimeout(function () { if (mode !== "bouge") return; startMove(); bougeT = setInterval(function () { if (mode === "bouge") tick(); else clearInterval(bougeT); }, 500); }, 3200);
  }

  /* ════════ Visite guidée (premier lancement) ════════ */
  var TOUR = [
    { sel: "#today-card .lx-cta", text: "Salut, je suis ton coach ! Ici, tu lances la séance du jour. Je te montre chaque mouvement, au bon rythme.", gesture: "wave" },
    { sel: ".kr-remind, #ks-card", text: "Chaque jour, note ton ressenti en 30 secondes. Ton kiné et moi, on suit comme ça ta douleur et ton sommeil.", gesture: "point" },
    { sel: "#bn-suivi", text: "Dans Suivi, tu verras tes progrès et tu pourras tout envoyer à ton kiné.", gesture: "point" },
    { sel: null, text: "Pendant les exercices, si quelque chose fait mal, appuie sur « J'ai mal » : je te dirai quoi faire. Et touche-moi quand tu as une question !", gesture: "open" }
  ];
  function tour(i) {
    var st = TOUR[i];
    var hole = $("km-hole");
    if (!hole) { hole = document.createElement("div"); hole.id = "km-hole"; document.body.appendChild(hole); }
    hole.classList.remove("on");
    if (!st) { set("kf-masc-tour", "1"); hide(); return true; }
    if (i === 99) { set("kf-masc-tour", "1"); hide(); return true; }
    if (!appear()) return false;
    mode = "tour"; clearTimeout(timer);
    if (st.sel) {
      // un « trou » de lumière posé sur l'élément expliqué, le reste de l'écran assombri
      var place = function () {
        if (mode !== "tour") return;
        var t = document.querySelector(st.sel); if (!t) return;
        var r = t.getBoundingClientRect();
        if (!t.closest(".bottom-nav") && (r.bottom > innerHeight - 260 || r.top < 60)) { try { window.scrollBy({ top: r.top - 140, behavior: "instant" }); } catch (e) { window.scrollBy(0, r.top - 140); } r = t.getBoundingClientRect(); }
        hole.style.cssText = "top:" + (r.top - 6) + "px;left:" + (r.left - 6) + "px;width:" + (r.width + 12) + "px;height:" + (r.height + 12) + "px";
        hole.classList.add("on");
      };
      place(); setTimeout(place, 400); setTimeout(place, 1200);   // l'accueil peut se redessiner juste après l'ouverture
    }
    bubble(st.text, "<div class='km-dots'>" + TOUR.map(function (_, j) { return "<i" + (j === i ? " class='on'" : "") + "></i>"; }).join("") + "</div>",
      "<button class='km-go' onclick='KineMascotte.tour(" + (i + 1) + ")'>" + (i < TOUR.length - 1 ? "Suivant" : "C'est compris") + "</button>" +
      (i < TOUR.length - 1 ? "<button class='km-later' onclick='KineMascotte.tour(99)'>Passer</button>" : ""));
    play(GESTURES[st.gesture]); talk(st.text);
    return true;
  }

  /* ════════ Portrait, pour les moments où l'avatar 3D est déjà occupé (séance) ════════ */
  function portrait() {
    var c = get("kf-masc-face3"); if (c) return c;
    if (!register() || !window.THREE) return null;
    var g = $("rep-guide"); if (g && g.classList.contains("open")) return null;
    try { var u = KineAvatar.snapshot(NAME + "_face", 120); if (u) { set("kf-masc-face3", u); return u; } } catch (e) {}
    return null;
  }
  function coachHtml(text) {
    var f = portrait();
    return "<div class='km-coach'>" + (f ? "<img src='" + f + "' alt=''>" : "") + "<p>" + esc(text) + "</p></div>";
  }

  window.KineMascotte = {
    show: show, hide: hide, maybe: maybe, pick: pickMessage, faq: faq, answer: answer, bouge: bouge, tour: tour,
    faqList: FAQ, errors: ERRORS, coachHtml: coachHtml, portrait: portrait,
    _bougeSec: function (n) { BOUGE_SEC = n; },
    say: function (text, gesture) { return show({ id: "libre", text: text, gesture: gesture || "wave" }); },
    act: function (what) {
      hide();
      if (what === "ressenti" && window.KineCheckin) KineCheckin.open();
      if (what === "savoir" && window.KineSavoir) KineSavoir.open(KineSavoir.today ? KineSavoir.today() : 0);
    },
    off: function (v) { set("kf-masc-off", v ? "1" : "0"); if (v) hide(); if (window.KineLayout) KineLayout.render(); },
    isOff: function () { return get("kf-masc-off") === "1"; }
  };

  function init() {
    setTimeout(function () { if (window.THREE) { portrait(); maybe(); } else setTimeout(function () { portrait(); maybe(); }, 4000); }, 3500);
    var base = window.showPage;
    if (typeof base === "function" && !base.__masc) {
      window.showPage = function () { var r = base.apply(this, arguments); if (mode !== "bouge" && mode !== "tour") hide(); setTimeout(maybe, 1200); return r; };
      window.showPage.__masc = true;
    }
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
