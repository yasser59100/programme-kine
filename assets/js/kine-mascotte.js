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
    var DEF = {
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
    };
    KineAvatar.register(NAME, DEF);
    KineAvatar.register(NAME + "_ask", L.merge(DEF, { camera: { yaw: 0.06, pitch: 0.02, dist: 1.05, ty: 1.5 } }));
    // pause active : face au patient, en grand, bras levés compris dans le cadre
    KineAvatar.register(NAME + "_big", L.merge(DEF, { camera: { yaw: 0.1, pitch: 0.06, dist: 3.7, ty: 1.02 } }));
    // Portrait (tête et épaules), utilisé quand l'avatar 3D est déjà occupé par la séance
    var face = L.merge(base, { LA: { ang: [0, 82, 40, 108] }, RA: { ang: DOWN }, head: 4, headZ: 6 });
    KineAvatar.register(NAME + "_face", { camera: { yaw: 0.12, pitch: 0.0, dist: 1.15, ty: 1.58 }, start: "f", thumb: "f", poses: { f: face } });
    var peek = L.merge(base, { LA: { ang: DOWN }, RA: { ang: DOWN }, head: 6, headZ: -12, headY: 8 });
    KineAvatar.register(NAME + "_peek", { camera: { yaw: 0.55, pitch: 0.02, dist: 1.05, ty: 1.6 }, start: "p", thumb: "p", poses: { p: peek } });
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
    ["Chaud ou froid après la séance ?", "Choisis ce qui te fait du bien. Le chaud détend quand tu te sens tendu ou raide. Le froid, 10 à 15 minutes dans un linge, calme un gonflement ou une douleur qui s'emballe. Mais pas besoin de glacer après chaque séance : la petite inflammation après l'effort fait partie de la réparation et de la progression du muscle. Si une douleur persiste, parles-en à ton kiné."],
    ["Je suis fatigué ou malade aujourd'hui.", "En cas de fièvre, d'infection ou de grosse fatigue, repose-toi et reprends quand ça va mieux. Si c'est juste une petite fatigue, adapte la séance à ton ressenti : moins de répétitions, moins de séries, une amplitude plus petite ou un rythme plus doux. Et note un effort élevé dans le bilan, le programme en tiendra compte."],
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
    { name: "Bras au ciel", say: "Bras au ciel. On inspire en montant, on souffle en descendant.", seq: [["ciel", 2, "Inspire, les bras montent"], ["idle", 2, "Souffle, ils redescendent"]] },
    { name: "Ouverture de la poitrine", say: "On ouvre la poitrine. Bras devant, puis on ouvre grand.", seq: [["avant", 1.8, "Bras tendus devant"], ["ouvre", 2, "Ouvre grand la poitrine"]] },
    { name: "Inclinaison du cou", say: "Le cou, tout doucement. Oreille vers l'épaule, d'un côté puis de l'autre.", seq: [["couG", 3, "Oreille vers l'épaule"], ["idle", 1.5, "Retour au centre"], ["couD", 3, "De l'autre côté"], ["idle", 1.5, "Retour au centre"]] },
    { name: "Inclinaison du buste", say: "On s'étire sur le côté. Le bras passe au-dessus de la tête.", seq: [["latG", 2.5, "Le bras passe au-dessus"], ["idle", 1.5, "Retour au centre"], ["latD", 2.5, "De l'autre côté"], ["idle", 1.5, "Retour au centre"]] }
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
    if (window.visualViewport) {
      var kb = function () {
        var vv = window.visualViewport, h = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        e.style.setProperty("--kb", h + "px"); e.classList.toggle("kb", h > 80);
      };
      visualViewport.addEventListener("resize", kb); visualViewport.addEventListener("scroll", kb);
    }
    // toucher le fond assombri referme (sauf pendant « Bouger »)
    e.addEventListener("click", function (ev) { if (ev.target === e && mode !== "bouge") hide(); });
    var y0 = null;
    e.addEventListener("touchstart", function (ev) { y0 = ev.touches[0].clientY; }, { passive: true });
    e.addEventListener("touchend", function (ev) { if (y0 != null && ev.changedTouches[0].clientY - y0 > 60 && mode !== "bouge") hide(); y0 = null; });
    return e;
  }
  function play(seq, loop, onStep) {
    var i = 0, id = {};
    playing = id;
    (function next() {
      if (playing !== id) return;
      if (i >= seq.length) { if (loop) i = 0; else return; }
      var s = seq[i++]; KineAvatar.step({ pose: s[0], dur: s[1] });
      if (onStep) onStep(s);
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
  var look = null;
  function appear(lk) {
    if (!register()) return false;
    lk = lk || "msg";
    var box = el(), wasOpen = box.classList.contains("open");
    if (!wasOpen || lk !== look) {
      box.classList.remove("big", "ask");
      if (lk !== "msg") box.classList.add(lk);
      look = lk;
      // le cadre change de taille : on relance l'avatar dans le nouveau cadre
      var name = lk === "msg" ? NAME : NAME + "_" + lk;
      if (!wasOpen) { if (!KineAvatar.show($("km-stage"), name)) return false; }
      else requestAnimationFrame(function () { KineAvatar.show($("km-stage"), name); });
    }
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
    box.classList.remove("open"); look = null; hud(false);
    setTimeout(function () { if (!box.classList.contains("open")) box.classList.remove("big", "ask"); }, 450);
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
  var SEARCH = "<label class='km-search'><span class='km-sr'>Pose ta question</span><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' aria-hidden='true'><circle cx='11' cy='11' r='7'></circle><path d='M20 20l-3.5-3.5'></path></svg>" +
    "<input type='search' id='km-q' placeholder='Pose ta question…' autocomplete='off' enterkeyhint='search' oninput='KineMascotte.search(this.value)'></label>";
  function faq() {
    if (mode === "bouge" || busy() || !appear("ask")) return;
    mode = "faq"; clearTimeout(timer);
    bubble("", SEARCH + "<div id='km-res' class='km-list'>" + faqList() + "</div>",
      "<button class='km-go' onclick='KineMascotte.bouge()'>Bouger avec toi</button>" + "<button class='km-later' onclick='KineMascotte.hide()'>Fermer</button>");
    play(GESTURES.open);
  }
  function faqList() {
    return "<p class='km-hint'>Ou choisis une question fréquente :</p>" + FAQ.map(function (q, i) { return "<button class='km-q' onclick='KineMascotte.answer(" + i + ")'>" + esc(q[0]) + "</button>"; }).join("");
  }
  function answer(i) {
    var q = FAQ[i]; if (!q) return;
    showDoc({ title: q[0], text: q[1] });
  }
  function showDoc(d, extra) {
    if (!appear("ask")) return;
    mode = "faq"; clearTimeout(timer);
    var act = d.action ? "<button class='km-go' onclick='KineMascotte.doAct(" + JSON.stringify(d.action).replace(/'/g, "&#39;") + ")'>" + esc(d.actionLabel) + "</button>" : "";
    bubble("", "<p class='km-qt'>" + esc(d.title) + "</p><p class='km-a'>" + esc(d.text) + "</p>",
      act + "<button class='" + (act ? "km-later" : "km-go") + "' onclick='KineMascotte.faq()'>Autre question</button><button class='km-later' onclick='KineMascotte.hide()'>Merci</button>");
    play(GESTURES.talk);
    talk(d.text);
  }
  GESTURES.talk = [["talkA", 0.55], ["talkB", 0.6], ["talkA", 0.6], ["talkB", 0.6], ["open", 0.6], ["talkA", 0.6], ["idle", 0.8]];

  /* ════════ « Bouge avec moi » ════════ */
  var bougeT = null;
  function hud(on) {
    var box = el(), h = $("km-hud");
    if (!on) { if (h) h.remove(); return; }
    if (!h) {
      h = document.createElement("div"); h.id = "km-hud"; h.className = "km-hud"; h.setAttribute("aria-hidden", "true");
      h.innerHTML = "<div class='km-seg'>" + BOUGE.map(function () { return "<i><b></b></i>"; }).join("") + "</div>" +
        "<div class='km-big'><b id='km-sec'>30</b><span>s</span></div>" +
        "<svg class='km-floor' viewBox='0 0 200 60'><ellipse cx='100' cy='30' rx='92' ry='24' class='km-fl0'/><path id='km-fl' d='M100 54 A92 24 0 1 1 100.01 54' class='km-fl1' pathLength='100' stroke-dasharray='0 100'/></svg>";
      box.appendChild(h);
    }
  }
  function bouge() {
    if (busy() || !appear("big")) return;
    mode = "bouge"; clearTimeout(timer); clearInterval(bougeT);
    var k = 0, t0 = 0;
    function cue(s) { var c = $("km-cue"); if (c && s[2]) { c.textContent = s[2]; c.classList.remove("in"); void c.offsetWidth; c.classList.add("in"); } }
    function startMove() {
      var m = BOUGE[k]; t0 = Date.now();
      bubble("", "<p class='km-mv'>Mouvement " + (k + 1) + " sur " + BOUGE.length + "</p><p class='km-name'>" + esc(m.name) + "</p><p class='km-cue' id='km-cue'></p>" +
        (BOUGE[k + 1] ? "<p class='km-next'>Ensuite : " + esc(BOUGE[k + 1].name) + "</p>" : "<p class='km-next'>Dernier mouvement</p>"),
        "<button class='km-later' onclick='KineMascotte.hide()'>Arrêter</button>");
      play(m.seq, true, cue);
      talk(m.say);
      tick();
    }
    function tick() {
      var el2 = (Date.now() - t0) / 1000, left = Math.max(0, BOUGE_SEC - Math.floor(el2)), pct = Math.min(100, el2 / BOUGE_SEC * 100);
      if ($("km-sec")) $("km-sec").textContent = left;
      if ($("km-fl")) $("km-fl").setAttribute("stroke-dasharray", pct.toFixed(1) + " 100");
      var segs = document.querySelectorAll("#km-hud .km-seg b");
      for (var n = 0; n < segs.length; n++) segs[n].style.width = (n < k ? 100 : n === k ? pct : 0) + "%";
      if (left <= 0) {
        k++;
        if (k >= BOUGE.length) {
          clearInterval(bougeT); hud(false);
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
    hud(true);
    var intro = "C'est parti pour 2 minutes ! Debout ou assis, fais comme moi, comme dans un miroir.";
    bubble(intro, "", "<button class='km-later' onclick='KineMascotte.hide()'>Arrêter</button>");
    play(GESTURES.open); talk(intro);
    setTimeout(function () { if (mode !== "bouge") return; startMove(); bougeT = setInterval(function () { if (mode === "bouge") tick(); else clearInterval(bougeT); }, 250); }, 3200);
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

  /* ════════ À la demande : sa tête dépasse dans un coin, on la touche, il arrive ════════ */
  function menu() {
    if (busy() || !appear()) return;
    mode = "faq"; clearTimeout(timer);
    var noted = window.KineCheckin && KineCheckin.get(iso());
    bubble("Je peux t'aider ?", "",
      "<button class='km-go' onclick='KineMascotte.faq()'>Une question</button>" +
      "<button class='km-later' onclick='KineMascotte.bouge()'>Bouger 2 minutes</button>" +
      (noted ? "" : "<button class='km-later' onclick='KineMascotte.act(\"ressenti\")'>Noter mon ressenti</button>") +
      "<button class='km-later' onclick='KineMascotte.hide()'>Fermer</button>");
    play(GESTURES.wave);
    talk("Je peux t'aider ?");
  }
  function peekImg() {
    var c = get("kf-masc-peek"); if (c) return c;
    if (!register() || !window.THREE) return null;
    var g = $("rep-guide"); if (g && g.classList.contains("open")) return null;
    try { var u = KineAvatar.snapshot(NAME + "_peek", 160); if (u) { set("kf-masc-peek", u); return u; } } catch (e) {}
    return null;
  }
  function peekTick() {
    var p = $("km-peek");
    if (!p && (busy() || mode)) return;   // la photo de la tête se prend quand l'avatar est libre
    if (!p) {
      var src = peekImg(); if (!src) return;
      p = document.createElement("button");
      p.id = "km-peek"; p.type = "button"; p.className = "km-peek";
      p.setAttribute("aria-label", "Appeler la mascotte");
      p.innerHTML = "<img src='" + src + "' alt=''>";
      document.body.appendChild(p);
      peekPlace(p);
      peekDrag(p);
    }
    var m = $("kf-masc"), open = m && m.classList.contains("open");
    var hidden = open || busy() || get("kf-masc-peek-off") === "1" || !!document.querySelector("#kf-onboard.open, .modal.open, #rg-pain.open");
    p.classList.toggle("show", !hidden);
  }

  // La tête se déplace au doigt : on la glisse où on veut, elle se range contre le bord le plus proche
  function peekPlace(p) {
    var pos = null; try { pos = JSON.parse(get("kf-masc-peek-pos") || "null"); } catch (e) {}
    p.classList.toggle("left", !!(pos && pos.side === "L"));
    if (pos && pos.y != null) { p.style.top = Math.round(Math.min(Math.max(pos.y, 0.08), 0.82) * window.innerHeight) + "px"; p.style.bottom = "auto"; }
  }
  function peekDrag(p) {
    var st = null;
    p.addEventListener("pointerdown", function (e) {
      var r = p.getBoundingClientRect();
      st = { x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, id: e.pointerId };
      try { p.setPointerCapture(e.pointerId); } catch (er) {}
    });
    p.addEventListener("pointermove", function (e) {
      if (!st || e.pointerId !== st.id) return;
      if (!st.moved && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 8) return;
      if (!st.moved) { st.moved = true; p.classList.add("drag"); }
      var w = p.offsetWidth, h = p.offsetHeight;
      p.style.left = Math.min(Math.max(e.clientX - st.dx, 0), window.innerWidth - w) + "px"; p.style.right = "auto";
      p.style.top = Math.min(Math.max(e.clientY - st.dy, 40), window.innerHeight - h - 70) + "px"; p.style.bottom = "auto";
      e.preventDefault();
    });
    function end(e) {
      if (!st) return;
      var moved = st.moved; st = null;
      if (!moved) return;
      var r = p.getBoundingClientRect(), side = r.left + r.width / 2 < window.innerWidth / 2 ? "L" : "R";
      p.classList.remove("drag"); p.style.left = ""; p.style.right = "";
      set("kf-masc-peek-pos", JSON.stringify({ side: side, y: r.top / window.innerHeight }));
      peekPlace(p);
      p._dragged = Date.now();
    }
    p.addEventListener("pointerup", end); p.addEventListener("pointercancel", end);
    p.addEventListener("click", function () { if (p._dragged && Date.now() - p._dragged < 400) return; p.classList.remove("show"); menu(); });
  }

  /* ════════ Moteur de recherche local (sans IA, rien ne sort du téléphone) ════════ */
  var HELP = [
    { title: "Envoyer mes résultats à mon kiné", kw: "envoyer partager kiné bilan résumé message mail sms whatsapp transmettre",
      text: "Dans l'onglet Suivi, touche « Envoyer à mon kiné ». Tu choisis la période, tu ajoutes un mot si tu veux, puis tu partages le résumé par message ou par mail.", action: "envoyer", actionLabel: "Ouvrir l'envoi" },
    { title: "Noter mon ressenti du jour", kw: "ressenti humeur forme moral sommeil énergie noter journée",
      text: "Chaque jour, tu peux noter en quelques secondes ta douleur, ton énergie, ton sommeil et ton moral. Après une dizaine de jours, je te montre ce qui ressort.", action: "ressenti", actionLabel: "Noter maintenant" },
    { title: "Voir mon calendrier", kw: "calendrier agenda jours séances faites historique mois",
      text: "Le calendrier montre les jours où tu as fait ta séance et ceux où tu as noté ton ressenti. Touche un jour pour voir le détail.", action: "calendrier", actionLabel: "Ouvrir le calendrier" },
    { title: "Voir ma courbe de progression", kw: "courbe graphique évolution progrès progression statistiques",
      text: "La courbe montre l'évolution de ta douleur, de ton énergie, de ton sommeil et de ton moral jour après jour.", action: "courbe", actionLabel: "Voir la courbe" },
    { title: "Voir mes douleurs signalées", kw: "douleurs signalées historique j'ai mal zones",
      text: "Toutes les douleurs signalées pendant les exercices avec « J'ai mal » sont regroupées dans Suivi, avec la zone, le niveau et l'exercice.", action: "douleurs", actionLabel: "Voir mes douleurs" },
    { title: "J'ai mal pendant un exercice", kw: "mal douleur pendant exercice bouton arrêter stop vive",
      text: "Appuie sur « J'ai mal » en bas de l'écran. Je te demande où et combien, puis je te dis quoi faire : adapter, passer l'exercice ou arrêter. Une douleur vive ou qui augmente, on arrête." },
    { title: "Couper ou remettre le son et la voix", kw: "son voix audio muet volume couper parler silence",
      text: "Pendant la séance, touche l'icône haut-parleur en haut de l'écran pour couper ou remettre la voix. Vérifie aussi que ton téléphone n'est pas en mode silencieux." },
    { title: "Mettre en pause ou passer un exercice", kw: "pause arrêter interrompre passer sauter suivant reprendre",
      text: "Pendant la séance, le bouton pause arrête le chrono. Tu peux reprendre quand tu veux. Pour sauter un exercice, utilise « Passer »." },
    { title: "Afficher les angles sur l'avatar", kw: "angles degrés avatar démonstration flexion mesure",
      text: "Dans la démonstration d'un exercice, touche « Angles » : les vrais angles de l'avatar s'affichent, par exemple 90° au genou pendant le squat." },
    { title: "Changer de séance ou de jour", kw: "autre séance jour programme changer choisir semaine",
      text: "Dans l'onglet Programme, choisis le jour que tu veux faire. Garde au moins un jour de repos entre deux séances qui travaillent les mêmes muscles.", action: "programme", actionLabel: "Ouvrir le programme" },
    { title: "Installer l'appli sur mon écran d'accueil", kw: "installer écran accueil application appli icône raccourci télécharger iphone android",
      text: "Sur iPhone : dans Safari, touche Partager puis « Sur l'écran d'accueil ». Sur Android : dans Chrome, touche les trois points puis « Installer l'application ». L'appli marche ensuite comme une vraie appli, même hors connexion." },
    { title: "Reprendre après une absence", kw: "reprise reprendre absence vacances arrêt pause longue semaines",
      text: "Après plus d'une semaine sans séance, reprends en douceur : moins de séries et une amplitude réduite la première fois, puis remonte selon ton ressenti. Si tu as eu une douleur nouvelle entre-temps, parles-en à ton kiné." },
    { title: "Passer en mode clair ou sombre", kw: "thème mode sombre clair nuit couleur luminosité",
      text: "Touche l'icône soleil ou lune en haut de l'accueil pour changer de thème.", action: "theme", actionLabel: "Changer maintenant" },
    { title: "Bouger 2 minutes avec moi", kw: "bouger pause active étirer étirements bureau assis dégourdir",
      text: "Quatre mouvements doux de 30 secondes, debout, à faire quand tu es resté assis longtemps. Je les fais avec toi.", action: "bouge", actionLabel: "On y va" },
    { title: "La communauté", kw: "communauté messages autres patients encouragement forum",
      text: "L'onglet Communauté permet d'échanger des encouragements avec les autres patients. Ne partage jamais d'informations médicales personnelles.", action: "communaute", actionLabel: "Ouvrir la communauté" }
  ];
  var STOP = {};
  ("le la les l un une des de du d et ou a au aux en je j tu te t il elle on nous vous mon ma mes ton ta tes son sa ses ce cet cette ces c ca qui que qu quoi est es suis sont etre pour par sur dans avec sans ne n pas se s y me m moi toi comment quand pourquoi quel quelle quels quelles faire fais fait faut peux peut puis dois doit plus tres trop bien si combien mais donc alors encore ai as avoir quoi svp stp bonjour salut merci exercice exercices exo exos apres pendant lors").split(" ").forEach(function (w) { STOP[w] = 1; });
  var SYN = {};
  [["dos", "lombaire", "lombalgie", "rachis", "colonne", "rein", "lumbago"],
   ["douleur", "mal", "douloureux", "souffre", "souffrir", "douleureu", "blessure", "blesse"],
   ["respiration", "respirer", "souffle", "souffler", "expirer", "inspirer", "expiration", "inspiration", "apnee"],
   ["kine", "kinesitherapeute", "kinesi", "kinesitherapie", "therapeute", "physio", "physiotherapeute"],
   ["envoyer", "partager", "transmettre", "exporter", "envoi", "partage"],
   ["courbature", "courbaturer", "raideur", "raide", "ankylose"],
   ["seance", "entrainement", "session", "workout", "training"],
   ["genou", "rotule", "rotulien", "rotulienne", "menisque"],
   ["epaule", "scapula", "omoplate"],
   ["hanche", "bassin"],
   ["cheville", "pied", "talon"],
   ["nuque", "cou", "cervical", "cervicale"],
   ["abdo", "abdominal", "abdominaux", "ventre", "gainage", "sangle"],
   ["fessier", "fesse", "glute"],
   ["fatigue", "fatiguer", "creve", "epuise", "epuisement", "kao"],
   ["malade", "fievre", "rhume", "grippe", "infection"],
   ["glace", "froid", "glacon", "cryo"],
   ["chaud", "chaleur", "bouillotte"],
   ["pause", "arreter", "arret", "interrompre", "stop"],
   ["passer", "sauter", "skip", "suivant"],
   ["voix", "son", "audio", "parle", "volume", "muet", "silence"],
   ["theme", "sombre", "clair", "nuit"],
   ["installer", "telecharger", "accueil", "raccourci", "icone"],
   ["ressenti", "humeur", "moral", "forme", "ressens"],
   ["rater", "oublier", "manquer", "louper", "absence", "reprise", "reprendre"],
   ["poids", "charge", "haltere", "kilo", "lest"],
   ["sommeil", "dormir", "dors"],
   ["marche", "marcher", "pas", "promenade"],
   ["sport", "course", "courir", "velo", "natation", "foot"],
   ["etirement", "etirer", "souplesse", "assouplir"],
   ["echauffement", "echauffer", "chauffer"],
   ["calendrier", "agenda", "planning"],
   ["donnee", "confidentialite", "rgpd", "prive", "privee", "personnel", "personnelle", "securite"],
   ["difficile", "dur", "dure", "compliquer", "arrive"],
   ["facile", "simple", "leger", "rien"],
   ["equilibre", "desequilibre", "tomber", "chute", "stabilite"]
  ].forEach(function (g) { g.forEach(function (w) { SYN[w] = g[0]; }); });
  function fold(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/[^a-z0-9]+/g, " ").replace(/(\d) (?=\d{3}\b)/g, "$1"); }
  function stem(w) {
    if (w.length > 4) w = w.replace(/(s|x)$/, "");
    if (w.length > 5) w = w.replace(/(ement|ment)$/, "").replace(/(ees|ee|er|ez|e)$/, "");
    return w;
  }
  var SYNK = null;
  function canon(w) {
    if (SYN[w]) return SYN[w];
    var pl = w.length > 3 ? w.replace(/(s|x)$/, "") : w; if (SYN[pl]) return SYN[pl];
    var st = stem(w); if (SYN[st]) return SYN[st];
    if (w.length >= 5) {
      // faute de frappe sur un mot connu : « fesier » → fessier
      SYNK = SYNK || Object.keys(SYN);
      for (var i = 0; i < SYNK.length; i++) if (SYNK[i].length >= 5 && lev1(w, SYNK[i], 1)) return SYN[SYNK[i]];
    }
    return st;
  }
  function toks(t) {
    var out = [], prev = "";
    fold(t).split(" ").forEach(function (w) {
      // « pas » : nombre de pas (marche), sinon simple négation
      if (w === "pas" && /^(\d+|de|des|nombre|combien|mille)$/.test(prev)) w = "marche";
      prev = w;
      if (!w || STOP[w] || w.length < 2) return;
      var s = canon(w);
      if (out.indexOf(s) < 0) out.push(s);
    });
    return out;
  }
  function lev1(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i], rowMin = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return false;
      prev = cur;
    }
    return prev[b.length] <= max;
  }
  function sim(q, d) {
    if (q === d) return 1;
    var n = Math.min(q.length, d.length), cp = 0;
    while (cp < n && q[cp] === d[cp]) cp++;
    if (cp >= 5 || (cp >= 4 && cp === n)) return 0.85 * Math.sqrt(cp / Math.max(q.length, d.length));
    if (q.length >= 5 && lev1(q, d, q.length >= 8 ? 2 : 1)) return 0.7;
    return 0;
  }
  var DOCS = null;
  function buildDocs() {
    if (DOCS) return DOCS;
    DOCS = [];
    FAQ.forEach(function (q) { DOCS.push({ type: "Question", title: q[0], text: q[1], kw: "" }); });
    HELP.forEach(function (h) { DOCS.push({ type: "Appli", title: h.title, text: h.text, kw: h.kw, action: h.action, actionLabel: h.actionLabel }); });
    var seen = {};
    if (typeof SEQ_DAYS !== "undefined") Object.keys(SEQ_DAYS).forEach(function (id) {
      (SEQ_DAYS[id].exercises || []).forEach(function (ex, i) {
        if (seen[ex.name]) return; seen[ex.name] = 1;
        var cue = (window.KF_CUES || {})[ex.name], err = ERRORS[ex.name];
        var txt = (ex.desc || "") + (cue ? " Le point clé : " + cue : "") + (err ? " Erreur fréquente : " + err : "") + (ex.tip ? " Astuce : " + ex.tip : "") + (ex.stop ? " " + ex.stop : "");
        DOCS.push({ type: "Exercice", title: ex.name, text: txt, kw: SEQ_DAYS[id].label + " " + (ex.repsLabel || ""),
          action: ex.phase === "work" ? "demo:" + id + ":" + i : "programme", actionLabel: ex.phase === "work" ? "Voir la démonstration" : "Ouvrir le programme" });
      });
    });
    if (window.KineSavoir) KineSavoir.tips.forEach(function (t, i) {
      DOCS.push({ type: "Le saviez-vous", title: t.title, text: t.body, kw: t.theme + " " + (t.statLabel || ""), action: "savoir:" + i, actionLabel: "Voir la fiche" });
    });
    DOCS.forEach(function (d) { d.f = [[toks(d.title), 3], [toks(d.kw), 2], [toks(d.text), 1]]; });
    return DOCS;
  }
  function find(query) {
    var q = toks(query); if (!q.length) return [];
    var res = [], docs = buildDocs(), N = docs.length;
    // un mot présent partout (genou, séance…) compte moins qu'un mot rare
    var best = docs.map(function (d) {
      return q.map(function (w) {
        var b = 0;
        d.f.forEach(function (f) { for (var i = 0; i < f[0].length; i++) { var s = sim(w, f[0][i]) * f[1]; if (s > b) b = s; } });
        return b;
      });
    });
    var idf = q.map(function (w, j) { var df = 0; best.forEach(function (b) { if (b[j]) df++; }); return 1 + Math.log(N / (df || 1)); });
    docs.forEach(function (d, k) {
      var score = 0, hit = 0;
      best[k].forEach(function (b, j) { if (b) hit++; score += b * idf[j]; });
      // la plupart des mots de la question doivent être trouvés
      if (hit && hit >= Math.ceil(q.length * 0.5)) res.push({ k: k, s: score * hit / q.length + (hit === q.length ? 2 : 0) });
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return res.slice(0, 5).map(function (r) { return r.k; });
  }
  function search(v) {
    var box = $("km-res"); if (!box) return;
    if (!fold(v).trim()) { box.innerHTML = faqList(); return; }
    var ids = find(v);
    if (!ids.length) {
      box.innerHTML = "<p class='km-none'>Je n'ai pas trouvé de réponse à ça. Essaie avec d'autres mots, ou garde ta question pour ta prochaine séance : ton kiné y répondra.</p>";
      return;
    }
    box.innerHTML = ids.map(function (k) { var d = DOCS[k]; return "<button class='km-q' onclick='KineMascotte.open(" + k + ")'><span class='km-tag'>" + esc(d.type) + "</span>" + esc(d.title) + "</button>"; }).join("");
  }
  function doAct(a) {
    var p = String(a).split(":");
    hide();
    setTimeout(function () {
      if (p[0] === "envoyer" && window.KineSuivi) KineSuivi.open("envoyer");
      else if (p[0] === "douleurs" && window.KineSuivi) KineSuivi.open("douleurs");
      else if (p[0] === "ressenti" && window.KineCheckin) KineCheckin.open();
      else if (p[0] === "calendrier" && window.KineCheckin) KineCheckin.calendar();
      else if (p[0] === "courbe" && window.KineCheckin) KineCheckin.chart();
      else if (p[0] === "savoir" && window.KineSavoir) KineSavoir.open(+p[1] || 0);
      else if (p[0] === "demo" && typeof openDemo === "function") openDemo(p[1], +p[2]);
      else if (p[0] === "programme" && typeof showPage === "function") showPage("guide");
      else if (p[0] === "communaute" && typeof showPage === "function") showPage("community");
      else if (p[0] === "theme" && typeof toggleDark === "function") toggleDark();
      else if (p[0] === "bouge") bouge();
    }, p[0] === "bouge" ? 500 : 60);
  }

  window.KineMascotte = {
    menu: menu,
    show: show, hide: hide, maybe: maybe, pick: pickMessage, faq: faq, answer: answer, bouge: bouge, tour: tour,
    faqList: FAQ, errors: ERRORS, search: search, find: find, open: function (k) { var d = buildDocs()[k]; if (d) showDoc(d); }, doAct: doAct, docs: buildDocs, coachHtml: coachHtml, portrait: portrait,
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
    setInterval(peekTick, 700);
    var base = window.showPage;
    if (typeof base === "function" && !base.__masc) {
      window.showPage = function () { var r = base.apply(this, arguments); if (mode !== "bouge" && mode !== "tour") hide(); setTimeout(maybe, 1200); return r; };
      window.showPage.__masc = true;
    }
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
