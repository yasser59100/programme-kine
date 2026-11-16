/* KinéForce — Espace « sport adapté » pour les patients de l'hôpital.
   Séances toutes faites, « le savais-tu ? » et « vrai ou faux » sur l'hygiène de vie.
   S'affiche dans l'écran de suivi du patient dont le parcours est « hopital ». */
(function () {
  "use strict";
  function pm(q) { return "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(q); }
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function jget(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function day() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }

  /* Séances de la semaine, calquées sur celles de l'hôpital : les programmes de l'appli (J1, J3, J5) et une séance de récupération.
     jours : 0 dimanche … 6 samedi. Le vendredi (marche au marché) et le dimanche (marche ou repos) n'ont pas de séance guidée. */
  var SEANCES = [
    { id: "hop-global", nom: "Global fonctionnel", day: "day4", jours: [1], court: "Lundi", desc: "Jambes, tronc et bras dans la même séance.",
      ex: ["Squat bilatéral", "Pompes sur genoux", "Rowing deux bras penché", "Pont de hanche", "Dead bug", "Fentes avant unilatérales"] },
    { id: "hop-tronc", nom: "Gainage rachidien", day: "day2", jours: [2, 6], court: "Mardi et samedi", desc: "On renforce le tronc, la ceinture du dos.",
      ex: ["Dead bug", "Plank — gainage avant-bras", "Superman quadrupédique en gainage", "Chat-vache"] },
    { id: "hop-jambes", nom: "Membres inférieurs", day: "day0", jours: [4], court: "Jeudi", desc: "Cuisses, fessiers et mollets.",
      ex: ["Squat bilatéral", "Fentes avant unilatérales", "Chaise contre le mur", "Élévation des talons"] },
    { id: "hop-recup", nom: "Récupération et étirements", jours: [3], court: "Mercredi", min: 15, desc: "Mobilité et souplesse pour récupérer en douceur.",
      ex: ["Chat-vache", "Bascule du bassin couché", "Enfiler l'aiguille", "Rotation thoracique à quatre pattes", "Fente psoas dynamique"] }
  ];
  var DOW = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  function seanceDuJour() {
    var dw = new Date().getDay(), k = -1;
    SEANCES.forEach(function (S, i) { if (S.jours.indexOf(dw) >= 0) k = i; });
    return k;   // -1 : vendredi et dimanche (marche)
  }
  function nbEx(S) {
    try { var D = window.SEQ_DAYS && S.day && SEQ_DAYS[S.day]; if (D) return D.exercises.filter(function (e) { return e.phase === "work"; }).length; } catch (e) {}
    return S.ex.length;
  }

  /* Comment va ton corps ? : une phrase et une séance adaptée. Une douleur vive ou inhabituelle renvoie vers le kiné. */
  var ZONES = [
    { id: "bien", t: "Tout va bien", say: "Parfait, profite de ta séance du jour.", go: null },
    { id: "dos", t: "Le dos", say: "Un peu mal au dos aujourd'hui ? Essaie la séance « Récupération et étirements ».", go: { i: 3 } },
    { id: "bas", t: "Jambes ou genoux", say: "Jambes ou genoux sensibles ? Essaie plutôt une séance pour le haut du corps.", go: { day: "day1", nom: "Membres supérieurs" } },
    { id: "haut", t: "Épaules ou bras", say: "Épaule ou bras sensibles ? Essaie plutôt la séance « Membres inférieurs ».", go: { i: 2 } },
    { id: "fatigue", t: "Fatigué·e", v: "Fatigué aujourd'hui ? Choisis la récupération, ou une marche de 10 minutes : bouger un peu aide souvent à retrouver de l'énergie.", say: "Fatigué·e aujourd'hui ? Choisis la récupération, ou une marche de 10 minutes : bouger un peu aide souvent à retrouver de l'énergie.", go: { i: 3 } }
  ];

  /* Le savais-tu ? — les études d'observation montrent un lien, pas toujours une cause. */
  var TIPS = [
    { theme: "Le corps aussi compte", title: "Prendre soin de son corps protège aussi sur le long terme.",
      stat: "10 à 20 ans", statLabel: "de vie en moins en moyenne avec un trouble psychique sévère",
      body: "Cet écart vient surtout de maladies du corps (cœur, diabète, respiration), en grande partie évitables. Des chercheurs, réunis par la revue The Lancet Psychiatry, recommandent d'agir tôt sur l'activité physique, l'alimentation et le tabac.",
      action: "Bouger régulièrement est l'un des moyens les plus simples d'agir sur sa santé. Chaque séance compte.",
      source: "Firth et al., The Lancet Psychiatry, 2019", url: pm("Firth Lancet Psychiatry Commission blueprint protecting physical health people with mental illness 2019") },
    { theme: "Moral", title: "Bouger fait du bien au moral, même quand on n'en a pas envie.",
      stat: "+1 000 essais", statLabel: "analysés sur l'activité physique, la dépression et l'anxiété",
      body: "Une très grande synthèse d'études montre que l'activité physique améliore les symptômes de dépression, d'anxiété et de détresse. Les efforts plus soutenus donnent souvent un effet un peu plus marqué, mais une activité douce aide déjà.",
      action: "Commence petit : cinq minutes valent mieux que zéro. L'envie vient souvent après avoir démarré.",
      source: "Singh et al., British Journal of Sports Medicine, 2023", url: pm("Singh effectiveness of physical activity interventions for improving depression anxiety distress umbrella review BJSM 2023") },
    { theme: "Sommeil", title: "Bouger dans la journée aide à mieux dormir la nuit.",
      stat: "Sommeil", statLabel: "plus rapide à venir et de meilleure qualité en moyenne",
      body: "Une revue de nombreuses études montre que l'activité physique améliore le sommeil : on s'endort un peu plus vite, on dort plus profondément. Évite simplement les efforts très intenses juste avant de te coucher.",
      action: "Une séance ou une marche dans la journée, puis des horaires de coucher réguliers.",
      source: "Kredlow et al., Journal of Behavioral Medicine, 2015", url: pm("Kredlow effects of physical activity on sleep meta-analytic review 2015") },
    { theme: "Mémoire", title: "L'exercice aide la mémoire et l'attention.",
      stat: "Cerveau", statLabel: "des fonctions de pensée améliorées chez des personnes avec schizophrénie",
      body: "Dans les essais réunis par cette revue, l'exercice d'endurance (marche rapide, vélo) améliorait le fonctionnement de la pensée, surtout quand il était pratiqué plus souvent, sur plusieurs semaines.",
      action: "Marche d'un bon pas ou pédale un peu chaque jour, la régularité compte plus que la durée.",
      source: "Firth et al., Schizophrenia Bulletin, 2017", url: pm("Firth aerobic exercise improves cognitive functioning in people with schizophrenia meta-analysis 2017") },
    { theme: "Tabac", title: "Arrêter de fumer améliore aussi le moral.",
      stat: "Moins d'anxiété", statLabel: "et de dépression quelques semaines après l'arrêt",
      body: "Une revue publiée dans le BMJ a suivi des personnes après l'arrêt du tabac : leur anxiété, leur dépression et leur stress étaient plus faibles qu'avant. L'idée que la cigarette calme est surtout liée à l'état de manque.",
      action: "Si tu y penses, parles-en à l'équipe soignante : on peut t'aider avec un accompagnement adapté.",
      source: "Taylor et al., BMJ, 2014", url: pm("Taylor change in mental health after smoking cessation systematic review meta-analysis BMJ 2014") },
    { theme: "Alimentation", title: "Mieux manger peut alléger les symptômes dépressifs.",
      stat: "Assiette", statLabel: "plus de légumes, de fruits, de céréales complètes et de poisson",
      body: "Des essais contrôlés montrent qu'améliorer son alimentation (moins d'aliments ultra-transformés, plus d'aliments bruts) diminue les symptômes de dépression. Le bénéfice se construit sur la durée.",
      action: "Un changement à la fois : un fruit en plus, de l'eau plutôt qu'une boisson sucrée.",
      source: "Firth et al., Psychosomatic Medicine, 2019", url: pm("Firth effects of dietary improvement on symptoms of depression and anxiety meta-analysis 2019") },
    { theme: "Sédentarité", title: "Longtemps assis : une heure de mouvement compense.",
      stat: "60 à 75 min", statLabel: "d'activité modérée par jour effacent le risque lié à la position assise",
      body: "En réunissant plus d'un million de personnes, les chercheurs ont observé que l'activité modérée effaçait le surrisque lié à beaucoup de temps assis. Les minutes de marche, de ménage et de séance s'additionnent.",
      action: "Lève-toi toutes les heures, même deux minutes. Tout mouvement s'additionne.",
      source: "Ekelund et al., The Lancet, 2016", url: pm("Ekelund does physical activity attenuate or eliminate sitting time mortality Lancet 2016") },
    { theme: "Activité", title: "Chaque minute de mouvement compte, pas besoin de sport intense.",
      stat: "Tout compte", statLabel: "selon les recommandations de l'OMS pour les adultes",
      body: "Les recommandations de l'Organisation mondiale de la santé insistent sur le fait que chaque minute d'activité compte, de toute durée. Elles conseillent 150 à 300 minutes par semaine d'activité modérée et du renforcement musculaire 2 fois par semaine.",
      action: "Une séance ici, une marche là : tu construis ta semaine petit à petit.",
      source: "Bull et al., British Journal of Sports Medicine, 2020 (OMS)", url: pm("Bull World Health Organization 2020 guidelines on physical activity and sedentary behaviour") }
  ];

  var TH = {
    "Le corps aussi compte": { a: "#12a37f", b: "#0b7c66", i: "muscle" }, "Moral": { a: "#ff9f5a", b: "#f0603f", i: "moral" }, "Sommeil": { a: "#5566ff", b: "#3a2fb0", i: "sleep" },
    "Mémoire": { a: "#8a6cf5", b: "#5b45d6", i: "brain" }, "Tabac": { a: "#64748b", b: "#334155", g: "<path d='M3 16h14v3H3zM19 16h2v3h-2zM15 5c2 2-2 4 1 7' />" },
    "Alimentation": { a: "#34b36b", b: "#1f8a50", g: "<path d='M12 7c-3-2-8 0-7 6s5 8 7 7c2 1 6-1 7-7s-4-8-7-6zM12 7c0-2 1-3 3-4'/>" },
    "Sédentarité": { a: "#2f9be0", b: "#1d6fb8", i: "balance" }, "Activité": { a: "#ffb43c", b: "#f08a00", i: "walk" }, def: { a: "#5566ff", b: "#3342d8", g: "<circle cx='12' cy='12' r='8'/>" }
  };
  function thPic(th, sz) {
    return th.i ? "<img class='kh-thp " + sz + "' src='assets/illus/" + th.i + ".webp' alt='' loading='lazy'>"
      : "<span class='kh-thp " + sz + " gl'><svg viewBox='0 0 24 24' width='34' height='34' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + th.g + "</svg></span>";
  }

  /* Vrai ou faux : une idée reçue, la réponse, l'explication */
  var VF = [
    { q: "Quand on n'a pas le moral, bouger ne sert à rien.", a: false,
      e: "Au contraire : l'activité physique améliore le moral et diminue l'anxiété. Même une marche tranquille a un effet." },
    { q: "Il faut avoir envie de bouger avant de commencer.", a: false,
      e: "Souvent, l'envie arrive en commençant. Le plus dur, c'est de démarrer : cinq minutes suffisent pour lancer la machine." },
    { q: "Une marche de 10 minutes, ça compte vraiment.", a: true,
      e: "Oui. Les recommandations de l'OMS disent que chaque minute de mouvement compte, quelle que soit la durée." },
    { q: "Pour que le sport serve, il faut transpirer à grosses gouttes.", a: false,
      e: "Non. Une activité modérée, où tu peux encore parler, apporte déjà beaucoup. On monte l'intensité tout doucement." },
    { q: "Bouger dans la journée aide à mieux dormir.", a: true,
      e: "Oui. L'activité physique régulière aide à s'endormir plus vite et à dormir plus profondément. Évite juste les efforts intenses juste avant de te coucher." },
    { q: "Fumer calme l'anxiété.", a: false,
      e: "En réalité, c'est surtout le manque qui crée la tension, et la cigarette la soulage un instant. Après l'arrêt, l'anxiété est plutôt plus basse." },
    { q: "Être assis toute la journée n'a pas d'importance si on mange bien.", a: false,
      e: "Le temps assis a un effet en soi sur la santé. Se lever régulièrement et bouger une heure par jour le compense." },
    { q: "L'exercice peut aider la mémoire et l'attention.", a: true,
      e: "Oui. Des études montrent que l'activité d'endurance, comme la marche rapide ou le vélo, améliore la mémoire et la concentration." },
    { q: "Il faut faire une heure de sport d'un coup pour que ça serve.", a: false,
      e: "Non. Plusieurs petites séances dans la journée valent autant. Ce qui compte, c'est la régularité." },
    { q: "Boire de l'eau plutôt que des boissons sucrées est bon pour le corps comme pour l'énergie.", a: true,
      e: "Oui. Les boissons sucrées donnent un pic d'énergie bref, suivi d'un coup de fatigue. L'eau hydrate sans cela." },
    { q: "Se muscler, c'est seulement pour les sportifs.", a: false,
      e: "Non. Des muscles solides aident à se lever, à marcher, à porter ses courses et à rester autonome. Le renforcement fait partie des recommandations pour tous." },
    { q: "Quelques minutes d'étirements ou de respiration peuvent apaiser.", a: true,
      e: "Oui. Respirer lentement et étirer le corps détend les muscles et aide à retrouver le calme." }
  ];


  /* ── voix : Yass lit les conseils (voix de Léo enregistrée, voix du téléphone sinon). Le son se coupe avec le réglage de l'appli. ── */
  var WARN = "Douleur vive, qui descend dans la jambe ou avec des fourmillements : arrête et préviens ton kiné.";
  var BR = {
    intro: "Installe-toi confortablement, et pose une main sur ton ventre.",
    in: ["Inspire doucement par le nez.", "Inspire doucement."], out: ["Souffle lentement par la bouche.", "Souffle doucement."],
    end: "Bravo, tu as bien respiré. Reste un instant au calme.",
    why1: "Quand on est tendu, la respiration devient courte et haute, dans la poitrine. Respirer lentement envoie au corps le signal inverse : le cœur ralentit, les muscles se détendent, l'esprit s'apaise.",
    why2: "Le diaphragme est un grand muscle en forme de dôme, sous les poumons. Quand tu inspires, il descend et s'aplatit : les poumons se remplissent et le ventre se gonfle doucement. Quand tu souffles, il remonte.",
    why3: "Pose une main sur le ventre. Inspire par le nez : ta main avance, les épaules restent basses. Souffle lentement par la bouche, comme à travers une paille. Si tu as la tête qui tourne, reprends ton rythme normal."
  };
  function say(t, now) { try { if (typeof speak === "function" && t) speak(t, { prio: 1, now: now !== false, ttl: 60000 }); } catch (e) {} }
  function hush() { try { if (typeof kfvStop === "function") kfvStop(); if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
  function tipVoice(T) { return T.title + " " + T.body + " " + T.action; }
  function vfVoice(v) { return (v.a ? "C'est vrai. " : "C'est faux. ") + v.e; }
  /* toutes les phrases que Yass dit dans l'espace hôpital : alimente le fichier de voix (tools/voix_textes.json) */
  function voices() {
    var out = [];
    [BR.intro, BR.in[0], BR.in[1], BR.out[0], BR.out[1], BR.end].forEach(function (t) { out.push({ t: t, g: "calme" }); });
    [BR.why1, BR.why2, BR.why3].forEach(function (t) { out.push({ t: t, g: "calme" }); });
    ZONES.forEach(function (z) { out.push({ t: z.v || z.say, g: "mascotte" }); });
    out.push({ t: WARN, g: "mascotte" }, { t: "Bien vu !", g: "mascotte" }, { t: "Pas tout à fait.", g: "mascotte" });
    VF.forEach(function (v) { out.push({ t: v.q, g: "mascotte" }); out.push({ t: vfVoice(v), g: "mascotte" }); });
    TIPS.forEach(function (T) { out.push({ t: tipVoice(T), g: "mascotte" }); });
    return out;
  }

  /* ── séances ── */
  function startSeance(i) {
    var S = SEANCES[i]; if (!S) return;
    try { if (window.KineMonSuivi && KineMonSuivi.close) KineMonSuivi.close(); } catch (e) {}
    if (S.day && window.launchSeq) { launchSeq(S.day); return; }
    if (!window.KineBiblio) return;
    var ex = S.ex.filter(function (n) { return KineBiblio.find(n); });
    var list = jget("kf-custom", []).filter(function (x) { return x.id !== S.id; });
    list.unshift({ id: S.id, name: S.nom, ex: ex, at: Date.now() });
    jset("kf-custom", list.slice(0, 12));
    if (window.KineCompose) KineCompose.start(S.id);
  }
  function startDay(d) { try { if (window.KineMonSuivi && KineMonSuivi.close) KineMonSuivi.close(); } catch (e) {} if (window.launchSeq) launchSeq(d); }
  function zone(id) {
    var Z = ZONES.filter(function (z) { return z.id === id; })[0]; if (!Z) return;
    var m = jget("kf-checkin", {}), k = iso(new Date()); m[k] = m[k] || {}; m[k].zone = id; jset("kf-checkin", m);
    var card = $("kh-bodycard");
    if (card) {
      card.className = card.className.replace(/\bsel-\w+/g, "").trim() + " sel-" + id;
      [].forEach.call(card.querySelectorAll("[data-z]"), function (e) { e.classList.toggle("on", e.getAttribute("data-z") === id); });
      paintYass(id);
      var box = $("kh-advice"); if (box) { box.innerHTML = ""; void box.offsetWidth; box.innerHTML = adviceHtml(id); }
      if (id === "bien") burst($("kh-bodycard").querySelector(".kh-figw"));
    }
    haptic(id === "bien" ? [14, 40, 14] : 12);
    say(Z.v || Z.say);
    try { var st = jget("kf-cab", null); if (st && st.pid && window.KineMonSuivi && KineMonSuivi.sync) KineMonSuivi.sync(); } catch (e) {}
  }
  /* Le corps du jour : une silhouette que le patient touche là où il a une gêne, ou une liste de choix. */
  /* Yass joue la gêne choisie : dos voûté avec une canne, marche raide, étirement de l'épaule, fatigue, ou saut de joie. */
  var YST = {
    init:    { img: "salut", n: 12, w: 239, h: 300, dur: 1.2 },
    bien:    { img: "joie", n: 13, w: 244, h: 300, dur: 1.1 },
    dos:     { img: "mode-dos", n: 12, w: 240, h: 240, dur: 1.5, ring: [40, 46] },
    bas:     { img: "st-raide", n: 12, w: 240, h: 240, dur: 1.5, ring: [50, 64] },
    haut:    { img: "etire", n: 12, w: 244, h: 300, dur: 1.4, ring: [64, 33] },
    fatigue: { bed: true }
  };
  function paintYass(id) {
    var el = $("kh-sp"), r = $("kh-ring"); if (!el) return;
    var Y = YST[id] || YST.init, fw = el.parentNode;
    if (fw) fw.classList.toggle("bed", !!Y.bed);
    if (Y.bed) { if (r) r.className = "kh-ring"; var z0 = $("kh-zz"); if (z0) z0.className = "kh-zz on"; return; }
    el.style.cssText = "aspect-ratio:" + Y.w + "/" + Y.h + ";background-image:url(assets/lumiere/yass-anim/" + Y.img + ".webp);background-size:" + (Y.n * 100) + "% 100%;--n:" + (Y.n - 1) + ";--d:" + Y.dur + "s";
    el.className = "kh-sp"; void el.offsetWidth; el.classList.add("play");
    if (r) { if (Y.ring) { r.style.left = Y.ring[0] + "%"; r.style.top = Y.ring[1] + "%"; r.className = "kh-ring on"; } else r.className = "kh-ring"; }
    var z = $("kh-zz"); if (z) z.className = "kh-zz";
  }
  function bodyHtml(zc) {
    var chips = "";
    ZONES.forEach(function (z) { chips += "<button type='button' class='kh-zone" + (zc === z.id ? " on" : "") + "' data-z='" + z.id + "' onclick='KineHopital.zone(\"" + z.id + "\")'><i class='kh-zd z-" + z.id + "' aria-hidden='true'></i>" + esc(z.t) + "</button>"; });
    setTimeout(function () { paintYass(zc || "init"); }, 60);
    return "<section class='kh-body kh-in" + (zc ? " sel-" + zc : "") + "' id='kh-bodycard' style='--i:1'><div class='kh-body-h'>Comment va ton corps aujourd'hui ?</div><div class='kh-body-s'>Choisis ce qui te correspond, Yass te montre.</div>" +
      "<div class='kh-body-g'><div class='kh-figw'><div class='kh-sp' id='kh-sp' role='img' aria-label='Yass'><i class='kh-ring' id='kh-ring' aria-hidden='true'></i></div><svg class='kh-bedsvg' viewBox='0 0 132 112' aria-hidden='true'><defs><linearGradient id='khbl' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7a88ff'/><stop offset='1' stop-color='#3b49d6'/></linearGradient><linearGradient id='khwd' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a8714b'/><stop offset='1' stop-color='#7d4f33'/></linearGradient></defs>" +
      "<ellipse cx='68' cy='104' rx='60' ry='6' fill='rgba(30,40,120,.18)'/>" +
      "<rect x='4' y='34' width='11' height='66' rx='5' fill='url(#khwd)'/><rect x='117' y='60' width='10' height='40' rx='5' fill='url(#khwd)'/>" +
      "<rect x='12' y='72' width='108' height='16' rx='7' fill='#e8ecff' stroke='#cfd6f6'/><rect x='14' y='86' width='104' height='8' rx='4' fill='url(#khwd)'/>" +
      "<ellipse cx='34' cy='64' rx='21' ry='10' fill='#fff' stroke='#d6dcf5'/>" +
      "<circle cx='35' cy='57' r='13.5' fill='#e2ab83'/><path d='M22 55c1-10 9-14 14-14s12 3 13 12c-5-4-9-5-14-5s-9 2-13 7z' fill='#3a2a22'/><path d='M23 60c1 9 6 12 12 12s11-3 12-12c-3 3-7 4-12 4s-9-1-12-4z' fill='#3a2a22'/>" +
      "<path d='M28 56q3 2.5 6 0M37 56q3 2.5 6 0' fill='none' stroke='#3a2a22' stroke-width='1.8' stroke-linecap='round'/><path d='M32 64q3 1.6 6 0' fill='none' stroke='#e2ab83' stroke-width='2' stroke-linecap='round'/>" +
      "<g class='kh-blank'><path d='M46 70c6-8 18-8 30-6 14 2 30 0 42 6v20H46z' fill='url(#khbl)'/><path d='M46 76c20 4 50 4 72 0' fill='none' stroke='rgba(255,255,255,.45)' stroke-width='3' stroke-linecap='round'/></g></svg><span class='kh-zz' id='kh-zz' aria-hidden='true'>z<b>z</b><em>z</em></span></div><div class='kh-zones'>" + chips + "</div></div>" +
      "<div id='kh-advice' class='kh-advice'>" + (zc ? adviceHtml(zc) : "") + "</div></section>";
  }
  function adviceHtml(id) {
    var Z = ZONES.filter(function (z) { return z.id === id; })[0]; if (!Z) return "";
    var h = "<div class='kh-adv-t'>" + esc(Z.say) + "</div>";
    if (Z.go) h += "<button type='button' class='kh-go kh-adv-go' onclick=\"" + (Z.go.day ? "KineHopital.startDay('" + Z.go.day + "')" : "KineHopital.start(" + Z.go.i + ")") + "\">Essayer cette séance<span aria-hidden='true'>›</span></button>";
    if (id !== "bien") h += "<div class='kh-adv-w'>Douleur vive, qui descend dans la jambe ou avec des fourmillements : arrête et préviens ton kiné.</div>";
    return h;
  }
  function walk(btn) {
    var m = jget("kf-checkin", {}), k = iso(new Date()); m[k] = m[k] || {}; m[k].walk = 1; jset("kf-checkin", m);
    if (btn) { btn.textContent = "Bravo, c'est noté"; btn.disabled = true; burst(btn.parentNode); }
    haptic([14, 40, 14]);
  }

  /* ── le savais-tu ? ── */
  var cur = 0;
  var sl = 0;
  function reads() { return jget("kf-hop-read", {}); }
  function markRead(i) { var r = reads(); if (!r[i]) { r[i] = 1; jset("kf-hop-read", r); } }
  function tipOpen(i, slide) {
    var n = TIPS.length; cur = (i + n) % n; sl = Math.max(0, Math.min(2, slide || 0));
    var t = TIPS[cur], th = TH[t.theme] || TH.def, sh = $("kh-sheet");
    if (!sh) { sh = document.createElement("div"); sh.id = "kh-sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Le savais-tu ?"); document.body.appendChild(sh); }
    sh.className = "kh-story open"; sh.style.setProperty("--g1", th.a); sh.style.setProperty("--g2", th.b);
    var bars = ""; for (var k = 0; k < 3; k++) bars += "<i class='" + (k < sl ? "d" : k === sl ? "c" : "") + "'></i>";
    var body = "";
    if (sl === 0) body = "<div class='kh-sk'>Le savais-tu ? · " + esc(t.theme) + "</div><h2>" + esc(t.title) + "</h2><div class='kh-sbig'><b>" + esc(t.stat) + "</b><span>" + esc(t.statLabel) + "</span></div>";
    else if (sl === 1) body = "<div class='kh-sk'>Ce que montrent les études</div><p class='kh-sp'>" + esc(t.body) + "</p><div class='kh-sref'><span>Source</span><strong>" + esc(t.source) + "</strong><a href='" + esc(t.url) + "' target='_blank' rel='noopener'>Voir l'étude</a></div>";
    else { markRead(cur); body = "<div class='kh-sk'>Pour toi</div><p class='kh-sp big'>" + esc(t.action) + "</p><button type='button' class='kh-listen on-dark' onclick='KineHopital.listen(" + cur + ")'><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12'/></svg>Écouter toute la fiche</button><p class='kh-snote'>Ces informations générales ne remplacent pas l'avis de ton équipe soignante.</p>"; }
    sh.innerHTML = "<div class='kh-sbars'>" + bars + "</div><button class='kh-bx' onclick='KineHopital.tipClose()' aria-label='Fermer'>×</button>" +
      "<div class='kh-sbody' key='" + cur + sl + "'>" + body + "</div>" +
      "<div class='kh-bf kh-sf'>" + (sl > 0 ? "<button type='button' class='ghost sm' onclick='KineHopital.tipOpen(" + cur + "," + (sl - 1) + ")' aria-label='Précédent'>‹</button>" : "") +
      (sl < 2 ? "<button type='button' onclick='KineHopital.tipOpen(" + cur + "," + (sl + 1) + ")'>Suivant</button>" : "<button type='button' onclick='KineHopital.tipOpen(" + (cur + 1) + ",0)'>Info suivante · " + ((cur + 1) % n + 1) + " sur " + n + "</button>") + "</div>";
  }
  function listen(i) { say(tipVoice(TIPS[i])); }
  function tipClose() { hush(); var sh = $("kh-sheet"); if (sh) sh.classList.remove("open"); try { var pg = $("page-hop-learn"); if (pg && pg.classList.contains("active")) paintHop("hop-learn"); } catch (e) {} }

  /* ── vrai ou faux ── */
  function vfBlock() {
    var i = day() % VF.length, v = VF[i], h = jget("kf-hop-vf", {}), r = h[v.q];
    var dn = r && r.d === day();
    var body = "<span class='ks-tag'>Vrai ou faux du jour</span><span class='ks-title'>« " + esc(v.q) + " »</span>";
    if (dn) {
      var good = r.r === v.a;
      body += "<span class='ks-title'><b>" + (good ? "Bien vu ! " : "Pas tout à fait. ") + (v.a ? "C'est vrai." : "C'est faux.") + "</b> " + esc(v.e) + "</span>";
    } else {
      body += "<span class='kcb-two'><button type='button' class='seq-btn-secondary' onclick='KineHopital.vf(true)'>Vrai</button><button type='button' class='seq-btn-secondary' onclick='KineHopital.vf(false)'>Faux</button></span>";
    }
    return "<div class='ks-card kh-vf' id='kh-vf'>" + body + "</div>";
  }
  function vf(rep) {
    var i = day() % VF.length, h = jget("kf-hop-vf", {}); h[VF[i].q] = { r: !!rep, d: day() }; jset("kf-hop-vf", h);
    var el = $("kh-vf"); if (el) { var w = document.createElement("div"); w.innerHTML = vfBlock(); el.parentNode.replaceChild(w.firstChild, el); }
  }

  /* ── semaine : les séances faites se remplissent ── */
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function weekDone() {
    var ss = []; try { ss = (typeof sessions !== "undefined" && sessions) ? sessions : JSON.parse(localStorage.getItem("kf-sessions") || "[]"); } catch (e) {}
    var d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); var mon = iso(d), days = {};
    ss.forEach(function (x) { var k = String(x.date).slice(0, 10); if (k >= mon) days[k] = 1; });
    return { n: ss.filter(function (x) { return String(x.date).slice(0, 10) >= mon; }).length, days: days, mon: d };
  }

  var ICON = {
    "hop-global": "<circle cx='12' cy='4.2' r='2'/><path d='M12 7v6.5M4.5 8.5l7.5 1.5 7.5-1.5M12 13.5l-5 7M12 13.5l5 7'/><path d='M2.5 5.5l1.5 1M21.5 5.5l-1.5 1' opacity='.55'/>",
    "hop-tronc": "<rect x='9' y='2.5' width='6' height='3.2' rx='1.4'/><rect x='8.4' y='7' width='7.2' height='3.2' rx='1.4'/><rect x='7.8' y='11.5' width='8.4' height='3.2' rx='1.4'/><rect x='8.4' y='16' width='7.2' height='3.2' rx='1.4'/><path d='M12 19.5v2' opacity='.55'/>",
    "hop-jambes": "<circle cx='12' cy='4' r='2'/><path d='M12 6.5v5M8.5 9h7M12 11.5l-4.5 3.5V21M12 11.5l4.5 3.5V21'/><path d='M3 21h18' opacity='.55'/>",
    "hop-recup": "<path d='M12 20.5c-4.2 0-7.2-2.2-8.5-5.5 3.2-.2 5.8 1 8.5 4 2.7-3 5.3-4.2 8.5-4-1.3 3.3-4.3 5.5-8.5 5.5z'/><path d='M12 19c-3.2-3.2-3.2-8.2 0-13.5 3.2 5.3 3.2 10.3 0 13.5z'/>"
  };



  function haptic(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) {} }
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function burst(host) {
    if (reduced() || !host) return;
    var cols = ["#4B5BFF", "#3CF2B0", "#FFC56B", "#FF5C73", "#7B88FF"], w = document.createElement("span");
    w.className = "kh-burst"; w.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 16; i++) {
      var p = document.createElement("i"), a = (i / 16) * 6.283, r = 70 + Math.random() * 50;
      p.style.cssText = "background:" + cols[i % 5] + ";--dx:" + Math.round(Math.cos(a) * r) + "px;--dy:" + Math.round(Math.sin(a) * r - 20) + "px;animation-delay:" + (Math.random() * 0.08) + "s";
      w.appendChild(p);
    }
    host.appendChild(w); setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 1200);
  }


  /* ── patient de l'hôpital ? ── */
  function isHop() { var s = jget("kf-cab", null); return !!(s && s.d && s.d.parcours === "hopital"); }

  /* ── fin de séance : comment tu te sens ? (trois visages, envoyés au kiné avec le ressenti du jour) ── */
  var FACES = [
    { n: 1, t: "Difficile", f: "#fde8e1", s: "#e6a794", m: "M13 28q7-6 14 0" },
    { n: 2, t: "Moyen", f: "#fff1dc", s: "#e6c58a", m: "M13 26h14" },
    { n: 3, t: "Bien", f: "#e6f6f3", s: "#9fd8cf", m: "M13 24q7 7 14 0" }
  ];
  function feelHtml() {
    var h = "<div class='kh-feel' role='group' aria-label='Comment tu te sens ?'><div class='kh-feel-q'>Comment tu te sens ?</div><div class='kh-feel-r'>";
    FACES.forEach(function (F) {
      h += "<button type='button' class='kh-face' data-n='" + F.n + "' onclick='KineHopital.feel(" + F.n + ",this)'><svg viewBox='0 0 40 40' width='52' height='52' aria-hidden='true'><circle cx='20' cy='20' r='18' fill='" + F.f + "' stroke='" + F.s + "' stroke-width='1.5'/><circle cx='14' cy='16' r='2' fill='#111c2d'/><circle cx='26' cy='16' r='2' fill='#111c2d'/><path d='" + F.m + "' fill='none' stroke='#111c2d' stroke-width='2' stroke-linecap='round'/></svg><span>" + F.t + "</span></button>";
    });
    return h + "</div></div>";
  }
  function feel(n, btn) {
    var m = jget("kf-checkin", {}), k = iso(new Date()); m[k] = m[k] || {}; m[k].feel = n; jset("kf-checkin", m);
    [].forEach.call(document.querySelectorAll(".kh-face"), function (b) { b.classList.toggle("on", b === btn); });
    haptic(12);
    if (n === 3) burst(btn.parentNode);
    try { var st = jget("kf-cab", null); if (st && st.pid && window.KineMonSuivi && KineMonSuivi.sync) KineMonSuivi.sync(); } catch (e) {}
  }

  /* ── bloc affiché dans l'écran de suivi ── */
  function html(prev, part) {
    part = part || "all"; var P = function (n) { return part === "all" || part === n; };
    var hi = seanceDuJour(), H = hi >= 0 ? SEANCES[hi] : null, t = TIPS[day() % TIPS.length], wk = weekDone(), goal = 4, dw = new Date().getDay(), done0 = (jget("kf-checkin", {})[iso(new Date())] || {}).walk;
    var h = "<div class='kh-wrap'>" + (part === "today" ? "<h1 class='lx-title'>Aujourd'hui</h1>" : part === "seances" ? "<h1 class='lx-title'>Séances</h1><p class='lx-lede'>Les mêmes séances qu'à l'hôpital, pour les refaire ou les compléter.</p>" : part === "learn" ? "<h1 class='lx-title'>Apprendre</h1><p class='lx-lede'>Une info utile et un vrai ou faux, chaque jour.</p>" : "");
    // 1. le héros : Yass et la séance du jour
    if (P("today")) h += "<section class='kh-hero kh-in' style='--i:0'><span class='kh-yw'><button type='button' class='lu-yass lu-ys' aria-label='Yass' onclick='KineLayout.yass(this)' data-g='salut'></button></span>" +
      (H ? "<div class='kh-kick'>Ta séance du jour · " + DOW[dw] + "</div><div class='kh-big'>" + esc(H.nom) + "</div>" +
        "<div class='kh-meta'>" + (H.min ? H.min + " minutes · " : "") + nbEx(H) + " exercices</div>" +
        "<div class='kh-say'>" + esc(H.desc) + "</div>" +
        (prev ? "" : "<button type='button' class='kh-go' onclick='KineHopital.start(" + hi + ")'>Commencer<span aria-hidden='true'>›</span></button>")
       : "<div class='kh-kick'>Aujourd'hui · " + DOW[dw] + "</div><div class='kh-big'>" + (dw === 5 ? "Marche au marché" : "Marche ou repos") + "</div>" +
        "<div class='kh-meta'>" + (dw === 5 ? "Avec ton kiné" : "À ton rythme") + "</div>" +
        "<div class='kh-say'>" + (dw === 5 ? "Une sortie à pied, au rythme du groupe." : "Une marche tranquille si tu en as envie, sinon un vrai repos.") + "</div>" +
        (prev ? "" : "<button type='button' class='kh-go' onclick='KineHopital.walk(this)'" + (done0 ? " disabled" : "") + ">" + (done0 ? "Bravo, c'est noté" : "J'ai marché") + "<span aria-hidden='true'>›</span></button>")) + "</section>";
    // 1 bis. comment va ton corps ?
    var zc = (jget("kf-checkin", {})[iso(new Date())] || {}).zone;
    if (!prev && P("today")) h += moodHtml() + bodyHtml(zc);
    // 2. ma semaine
    if (P("today")) { h += "<section class='kh-week kh-in' style='--i:1'><div class='kh-wk-h'><b>Ma semaine</b><span>" + wk.n + " séance" + (wk.n > 1 ? "s" : "") + "</span></div><div class='kh-dots'>";
    var lab = ["L", "M", "M", "J", "V", "S", "D"], today = iso(new Date());
    for (var i = 0; i < 7; i++) {
      var d = new Date(wk.mon.getTime()); d.setDate(d.getDate() + i); var k = iso(d), done = !!wk.days[k];
      h += "<span class='kh-dot" + (done ? " ok" : "") + (k === today ? " now" : "") + "' style='--d:" + (i * 0.07 + 0.5) + "s'><i aria-hidden='true'>" + (done ? "✓" : "") + "</i><em>" + lab[i] + "</em></span>";
    }
    h += "</div><div class='kh-wk-s'>" + (wk.n === 0 ? "Une première séance cette semaine ? Je suis avec toi." : wk.n >= goal ? "Objectif de la semaine atteint, bravo !" : "Encore " + (goal - wk.n) + " pour atteindre ton objectif.") + "</div></section>"; }
    // 3. mes séances, en cartes à faire défiler
    if (P("seances")) {
      h += "<button type='button' class='kh-compose kh-in' style='--i:2' onclick=\"showPage('mes');window.KineCompose&&KineCompose.tab()\"><span class='kh-cp-t'><em>Nouveau</em><b>Composer ma séance</b><span>Choisis tes exercices parmi 372, je m'occupe de l'échauffement, des étirements et de l'ordre.</span></span><span class='kh-cp-go' aria-hidden='true'><svg viewBox='0 0 24 24' width='26' height='26' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round'><path d='M12 5v14M5 12h14'/></svg></span></button>";
      h += "<div class='kh-sec kh-in' style='--i:3'>La semaine à l'hôpital</div><div class='kh-rail kh-grid kh-in' style='--i:4'>";
      SEANCES.forEach(function (S, i) {
        h += "<button type='button' class='kh-card c" + i + "'" + (prev ? " disabled" : " onclick='KineHopital.start(" + i + ")'") + "><img class='kh-pic' src='assets/hop/" + S.id + ".webp' alt='' width='96' height='96'>" +
          "<b>" + esc(S.nom) + "</b><span>" + S.court + "</span></button>";
      });
      h += "</div><div class='kh-sec kh-in' style='--i:5'>Aller plus loin</div><div class='kh-tiles kh-in' style='--i:6'>" +
        "<button type='button' onclick='KineCamera&&KineCamera.open()'><i class='t1'><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 8h4l2-3h6l2 3h4v11H3z'/><circle cx='12' cy='13' r='3.5'/></svg></i><b>Filmer mon mouvement</b><span>Yass vérifie ton geste</span></button>" +
        "<button type='button' onclick='KineHopital.breathe()'><i class='t2'><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9c3-3 6-3 9 0s6 3 9 0M3 15c3-3 6-3 9 0s6 3 9 0'/></svg></i><b>Respirer</b><span>3 minutes pour se calmer</span></button>" +
        "<button type='button' onclick=\"showPage('guide')\"><i class='t3'><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 5h7v14H4zM13 5h7v14h-7z'/></svg></i><b>Bibliothèque</b><span>Variantes plus difficiles</span></button>" +
        "<button type='button' onclick=\"KineHopital.start(3)\"><i class='t4'><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 20.5c-4.2 0-7.2-2.2-8.5-5.5 3.2-.2 5.8 1 8.5 4 2.7-3 5.3-4.2 8.5-4-1.3 3.3-4.3 5.5-8.5 5.5z'/><path d='M12 19c-3.2-3.2-3.2-8.2 0-13.5 3.2 5.3 3.2 10.3 0 13.5z'/></svg></i><b>Étirements</b><span>15 minutes, en douceur</span></button></div>";
    }
    // 4. apprendre : l'info du jour, le vrai ou faux, la respiration, toutes les infos
    if (P("learn")) {
      var ti = day() % TIPS.length, th = TH[t.theme] || TH.def;
      h += "<button type='button' class='kh-lh kh-in' style='--i:3;--g1:" + th.a + ";--g2:" + th.b + "' onclick='KineHopital.tipOpen(" + ti + ")'><span class='kh-lh-t'><em>Info du jour · " + esc(t.theme) + "</em><b>" + esc(t.title) + "</b><span class='kh-lh-s'><strong>" + esc(t.stat) + "</strong>" + esc(t.statLabel) + "</span><span class='kh-lh-go'>Lire en 1 minute<i aria-hidden='true'>›</i></span></span>" + thPic(th, "lg") + "</button>";
      h += vfBlock().replace("class='kh-vf'", "class='kh-vf kh-in' style='--i:4'");
      h += "<button type='button' class='kh-br-card kh-in' style='--i:5' onclick='KineHopital.breathe()'><span class='kh-bo' aria-hidden='true'><i></i><i></i><i></i></span><span class='kh-br-t'><em>À essayer</em><b>Pourquoi bien respirer ?</b><span>Le rôle du diaphragme, expliqué simplement, puis 3 minutes guidées.</span></span><span class='kh-arr' aria-hidden='true'>›</span></button>";
      h += "<div class='kh-sec kh-in' style='--i:6'>À lire ensuite · " + Object.keys(reads()).length + " sur " + TIPS.length + " lues</div><div class='kh-ed kh-in' style='--i:7'>";
      TIPS.forEach(function (T, i) { var q = TH[T.theme] || TH.def; h += "<button type='button' style='--g1:" + q.a + ";--g2:" + q.b + "' onclick='KineHopital.tipOpen(" + i + ")'><span class='kh-ed-n'><i>" + ("0" + (i + 1)).slice(-2) + "</i><strong>" + esc(T.stat) + "</strong></span><span class='kh-ed-t'><em>" + esc(T.theme) + "</em><b>" + esc(T.title) + "</b><small>" + (reads()[i] ? "Lue" : "1 min de lecture") + "<i aria-hidden='true'>" + (reads()[i] ? "✓" : "›") + "</i></small></span></button>"; });
      h += "</div>";
    }
    setTimeout(function () { try { if (window.KineLayout && KineLayout.arm) KineLayout.arm(); } catch (e) {} }, 80);
    setTimeout(function () { try { if (window.KineLayout && KineLayout.arm) KineLayout.arm(); } catch (e) {} }, 500);
    return h + "</div>";
  }

  function vfBlock() {
    var i = day() % VF.length, v = VF[i], h = jget("kf-hop-vf", {}), r = h[v.q];
    var dn = r && r.d === day(), good = dn && r.r === v.a;
    var b = "<div class='kh-kick vf'>Vrai ou faux du jour</div><div class='kh-q'>« " + esc(v.q) + " »</div>" + (dn ? "" : "<button type='button' class='kh-listen on-dark' onclick='KineHopital.vfListen()' aria-label='Écouter la question'><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12'/></svg>Écouter</button>");
    if (dn) {
      b += "<div class='kh-ans " + (good ? "yes" : "no") + "'><b>" + (good ? "Bien vu !" : "Pas tout à fait.") + " " + (v.a ? "C'est vrai." : "C'est faux.") + "</b><span>" + esc(v.e) + "</span></div>";
    } else {
      b += "<div class='kh-two'><button type='button' class='kh-vb' onclick='KineHopital.vf(true,this)'>Vrai</button><button type='button' class='kh-vb' onclick='KineHopital.vf(false,this)'>Faux</button></div>";
    }
    return "<section class='kh-vf' id='kh-vf'>" + b + "</section>";
  }
  function vf(rep, btn) {
    var i = day() % VF.length, h = jget("kf-hop-vf", {}); h[VF[i].q] = { r: !!rep, d: day() }; jset("kf-hop-vf", h);
    var good = (!!rep) === VF[i].a;
    var el = $("kh-vf"); if (!el) return;
    var w = document.createElement("div"); w.innerHTML = vfBlock(); var n = w.firstChild; n.className += " kh-in"; n.style.setProperty("--i", "0");
    el.parentNode.replaceChild(n, el);
    try { n.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" }); } catch (e) {}
    if (good) { burst(n); haptic([14, 40, 14]); } else haptic(30);
    say(good ? "Bien vu !" : "Pas tout à fait.", true); say(vfVoice(VF[i]), false);
  }
  function vfListen() { say(VF[day() % VF.length].q); }


  /* ── Respirer : explication du diaphragme, puis 3 minutes guidées (5 s d'inspiration, 5 s d'expiration) ── */
  var BT = null;
  var DIA = "<svg class='kh-dia' viewBox='0 0 220 240' aria-hidden='true'><defs><linearGradient id='khdl' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#bcd0ff'/><stop offset='1' stop-color='#5b6cff'/></linearGradient><linearGradient id='khdb' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffd58a'/><stop offset='1' stop-color='#ff9f5a'/></linearGradient></defs>" +
    "<path d='M64 26Q110 10 156 26Q176 34 178 66L182 130Q186 190 164 226L56 226Q34 190 38 130L42 66Q44 34 64 26Z' fill='rgba(255,255,255,.05)' stroke='rgba(255,255,255,.3)' stroke-width='2'/>" +
    "<path d='M110 26v90' stroke='rgba(255,255,255,.18)' stroke-width='3' stroke-linecap='round'/>" +
    "<ellipse cx='80' rx='26' fill='url(#khdl)' opacity='.92'><animate attributeName='ry' values='42;52;42' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/><animate attributeName='cy' values='80;90;80' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/><animate attributeName='cx' values='80;76;80' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/></ellipse>" +
    "<ellipse cx='140' rx='26' fill='url(#khdl)' opacity='.92'><animate attributeName='ry' values='42;52;42' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/><animate attributeName='cy' values='80;90;80' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/><animate attributeName='cx' values='140;144;140' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/></ellipse>" +
    "<path fill='none' stroke='#3cf2b0' stroke-width='6' stroke-linecap='round'><animate attributeName='d' values='M48 140Q110 100 172 140;M48 158Q110 152 172 158;M48 140Q110 100 172 140' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/></path>" +
    "<ellipse cx='110' cy='190' fill='url(#khdb)' opacity='.9'><animate attributeName='rx' values='34;48;34' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/><animate attributeName='ry' values='22;30;22' calcMode='spline' keyTimes='0;.5;1' keySplines='.45 0 .55 1;.45 0 .55 1' dur='10s' repeatCount='indefinite'/></ellipse>" +
    "</svg><div class='kh-leg'><span><i style='background:#7f93ff'></i>Poumons</span><span><i style='background:#3cf2b0'></i>Diaphragme</span><span><i style='background:#ffb55e'></i>Ventre</span></div>";
  function breathe(go) {
    var sh = $("kh-breath");
    if (!sh) { sh = document.createElement("div"); sh.id = "kh-breath"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Respirer"); document.body.appendChild(sh); }
    if (BT) clearInterval(BT); BT = null;
    sh.className = "kh-bro open";
    if (go === true) return breatheGo();
    sh.innerHTML = "<button class='kh-bx' onclick='KineHopital.breatheClose()' aria-label='Fermer'>×</button><div class='kh-bi'>" +
      "<div class='kh-bk'>Respirer</div><h2>Pourquoi bien respirer ?</h2>" + DIA +
      "<div class='kh-bcap'><span class='in'>Tu inspires : le diaphragme descend, le ventre se gonfle</span><span class='out'>Tu souffles : il remonte, le ventre rentre</span></div>" +
      "<div class='kh-bp'><b>1</b><div><strong>Le signal du calme</strong><span>Quand on est tendu, la respiration devient courte et haute, dans la poitrine. Respirer lentement envoie au corps le signal inverse : le cœur ralentit, les muscles se détendent, l'esprit s'apaise.</span></div></div>" +
      "<div class='kh-bp'><b>2</b><div><strong>Ton diaphragme</strong><span>C'est un grand muscle en forme de dôme, sous les poumons. Quand tu inspires, il descend et s'aplatit : les poumons se remplissent et le ventre se gonfle doucement. Quand tu souffles, il remonte.</span></div></div>" +
      "<div class='kh-bp'><b>3</b><div><strong>Comment faire</strong><span>Pose une main sur le ventre. Inspire par le nez : ta main avance, les épaules restent basses. Souffle lentement par la bouche, comme à travers une paille. Si tu as la tête qui tourne, reprends ton rythme normal.</span></div></div>" +
      "<div style='height:150px'></div></div><div class='kh-bf'><button type='button' class='ghost' onclick='KineHopital.breatheListen()'>Écouter l'explication</button><button type='button' onclick='KineHopital.breatheGo()'>Commencer 3 minutes</button></div>";
    calmLoad();
    var d = sh.querySelector(".kh-dia"); try { if (d && d.setCurrentTime) d.setCurrentTime(0); if (reduced() && d && d.pauseAnimations) d.pauseAnimations(); } catch (e) {}
    sh.querySelector(".kh-bi").scrollTop = 0;
  }
  function calmLoad() { try { if (window.KFV && KFV.map) Object.keys(KFV.map).forEach(function (k) { var e = KFV.map[k]; if (e.g === "calme" && typeof kfvLoad === "function") kfvLoad(e); }); } catch (e) {} }
  function breatheListen() { say(BR.why1); say(BR.why2, false); say(BR.why3, false); }
  function breatheGo() {
    var sh = $("kh-breath"); if (!sh) return; sh.className = "kh-bro open"; hush(); calmLoad(); say(BR.intro); var lastPh = -1, nIn = 0, nOut = 0;
    sh.innerHTML = "<button class='kh-bx' onclick='KineHopital.breathe()' aria-label='Retour'>‹</button><div class='kh-bs'>" +
      "<div class='kh-bk'>3 minutes</div><div class='kh-orb2'><svg viewBox='0 0 260 260' class='kh-ring2' aria-hidden='true'><circle cx='130' cy='130' r='122' fill='none' stroke='rgba(255,255,255,.12)' stroke-width='4'/><circle id='kh-prog' cx='130' cy='130' r='122' fill='none' stroke='#3cf2b0' stroke-width='4' stroke-linecap='round' stroke-dasharray='766' stroke-dashoffset='766' transform='rotate(-90 130 130)'/></svg>" +
      "<i class='o3'></i><i class='o2'></i><i class='o1'></i><b id='kh-bw'>Prépare-toi</b></div>" +
      "<div class='kh-bt' id='kh-bt'>3:00</div><p>Une main sur le ventre. Suis le cercle.</p></div><div class='kh-bf'><button type='button' class='ghost' onclick='KineHopital.breatheClose()'>Terminer</button></div>";
    var t0 = Date.now() + 2500, pr = $("kh-prog"), orb = sh.querySelector(".kh-orb2"); if (BT) clearInterval(BT);
    if (!reduced()) setTimeout(function () { orb.classList.add("go"); if (pr) { pr.style.transition = "stroke-dashoffset 180s linear"; pr.style.strokeDashoffset = "0"; } }, 2500);
    BT = setInterval(function () {
      var e = Date.now() - t0, w = $("kh-bw"), c = $("kh-bt"); if (!w) { clearInterval(BT); return; }
      if (e < 0) { w.textContent = "Prépare-toi"; return; }
      var left = Math.max(0, 180 - Math.floor(e / 1000)); c.textContent = Math.floor(left / 60) + ":" + ("0" + (left % 60)).slice(-2);
      var k5 = Math.floor(e / 5000), ph = k5 % 2 === 0; if (k5 !== lastPh && left > 0) { lastPh = k5; w.textContent = ph ? "Inspire" : "Souffle"; haptic(10); if (k5 < 4 || k5 % 6 === 0) say(ph ? BR.in[nIn++ % 2] : BR.out[nOut++ % 2]); }
      if (left === 0) { w.textContent = "Bravo"; orb.classList.remove("go"); clearInterval(BT); haptic([14, 40, 14]); say(BR.end); }
    }, 250);
  }
  function breatheClose() { hush(); if (BT) clearInterval(BT); BT = null; var sh = $("kh-breath"); if (sh) sh.className = "kh-bro"; }

  /* ── humeur avant / après la séance ── */
  var MOOD = [{ n: 1, t: "Pas top", f: "#fde8e1", s: "#e6a794", m: "M13 28q7-6 14 0" }, { n: 2, t: "Moyen", f: "#fff1dc", s: "#e6c58a", m: "M13 26h14" }, { n: 3, t: "Bien", f: "#e6f6f3", s: "#9fd8cf", m: "M13 24q7 7 14 0" }];
  function faceSvg(F, sz) { return "<svg viewBox='0 0 40 40' width='" + sz + "' height='" + sz + "' aria-hidden='true'><circle cx='20' cy='20' r='18' fill='" + F.f + "' stroke='" + F.s + "' stroke-width='1.5'/><circle cx='14' cy='16' r='2' fill='#111c2d'/><circle cx='26' cy='16' r='2' fill='#111c2d'/><path d='" + F.m + "' fill='none' stroke='#111c2d' stroke-width='2' stroke-linecap='round'/></svg>"; }
  function moodHtml() {
    var c = (jget("kf-checkin", {})[iso(new Date())] || {}).pre, h = "<section class='kh-mood kh-in' style='--i:1'><div class='kh-mood-q'>Ton humeur ce matin ?</div><div class='kh-feel-r'>";
    MOOD.forEach(function (F) { h += "<button type='button' class='kh-face" + (c === F.n ? " on" : "") + "' data-n='" + F.n + "' onclick='KineHopital.mood(" + F.n + ",this)'>" + faceSvg(F, 52) + "<span>" + F.t + "</span></button>"; });
    return h + "</div><div class='kh-mood-s' id='kh-mood-s'>" + (c ? "Noté. Après ta séance, on regarde si ça a changé." : "Un visage suffit, il n'y a pas de bonne réponse.") + "</div></section>";
  }
  function mood(n, btn) {
    var m = jget("kf-checkin", {}), k = iso(new Date()); m[k] = m[k] || {}; m[k].pre = n; jset("kf-checkin", m);
    [].forEach.call(document.querySelectorAll(".kh-mood .kh-face"), function (b) { b.classList.toggle("on", b === btn); });
    var s2 = $("kh-mood-s"); if (s2) s2.textContent = "Noté. Après ta séance, on regarde si ça a changé.";
    haptic(12); if (n === 3) burst(btn.parentNode);
    try { var st = jget("kf-cab", null); if (st && st.pid && window.KineMonSuivi && KineMonSuivi.sync) KineMonSuivi.sync(); } catch (e) {}
  }
  function moiHtml() {
    var ck = jget("kf-checkin", {}), lab = ["D", "L", "M", "M", "J", "V", "S"], cols = "", both = 0, up = 0, any = 0;
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i); var c = ck[iso(d)] || {}, pre = MOOD[(c.pre || 0) - 1], post = MOOD[(c.feel || 0) - 1];
      if (c.pre || c.feel) any++; if (c.pre && c.feel) { both++; if (c.feel > c.pre) up++; }
      cols += "<div class='kh-mc'><div>" + (pre ? faceSvg(pre, 26) : "<i class='e'></i>") + "</div><div>" + (post ? faceSvg(post, 26) : "<i class='e'></i>") + "</div><em>" + lab[d.getDay()] + "</em></div>";
    }
    var msg = both >= 2 ? (up >= both / 2 ? "Après la séance, ton humeur est meilleure " + up + " fois sur " + both + ". Le mouvement te fait du bien." : "Ton humeur varie d'un jour à l'autre, c'est normal. Continue à la noter.") : "Note ton humeur le matin et après la séance : tu verras ici ce que le mouvement change pour toi.";
    var nr = Object.keys(reads()).length;
    return "<div class='kh-mcard'><div class='kh-mck'><span>Mon humeur</span><span>7 derniers jours</span></div><div class='kh-mrow'><div class='kh-ml'><span>Avant</span><span>Après</span></div>" + cols + "</div><p class='kh-mmsg'>" + msg + "</p></div>" +
      "<div class='kh-mcard'><div class='kh-mck'><span>Mes infos lues</span><span>" + nr + " sur " + TIPS.length + "</span></div><div class='kh-mbar'><i style='width:" + Math.round(nr / TIPS.length * 100) + "%'></i></div><button type='button' class='kh-mlink' onclick=\"showPage('hop-learn')\">Aller lire la suite ›</button></div>";
  }


  /* ── onglets de l'hôpital : Aujourd'hui, Séances, Apprendre, Moi ── */
  var NAVSAVE = null, PAGES = { "hop-today": "today", "hop-seances": "seances", "hop-learn": "learn" };
  var NI = {
    home: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'/></svg>",
    seances: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M13 3L5 14h6l-1 7 8-11h-6z'/></svg>",
    learn: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z'/></svg>",
    moi: "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='8' r='4'/><path d='M4 21c1-4 4-6 8-6s7 2 8 6'/></svg>"
  };
  function paintHop(id) {
    var el = $("page-" + id), part = PAGES[id]; if (!el) return;
    el.innerHTML = "<div class='content'>" + html(false, part) + "</div>";
  }
  function mode() {
    var on = isHop(), nav = document.querySelector(".bottom-nav"); if (!nav || !window.pageMap) return;
    var B = function (i) { return $("bn-" + i); };
    if (on && !NAVSAVE) {
      NAVSAVE = {}; ["home", "guide", "mes", "suivi", "monkine"].forEach(function (i) { var b = B(i); NAVSAVE[i] = { h: b.innerHTML, c: b.getAttribute("onclick"), d: b.style.display }; });
      var host = $("page-home").parentNode;
      Object.keys(PAGES).forEach(function (id) { if (!$("page-" + id)) { var d = document.createElement("div"); d.className = "page"; d.id = "page-" + id; host.insertBefore(d, $("page-home").nextSibling); } });
      pageMap["hop-today"] = "bn-home"; pageMap["hop-seances"] = "bn-guide"; pageMap["hop-learn"] = "bn-suivi";
      function set(i, svg, lab, go) { var b = B(i); b.innerHTML = "<span class='bnav-icon'>" + svg + "</span><span>" + lab + "</span>"; b.setAttribute("onclick", go); }
      set("home", NI.home, "Aujourd'hui", "showPage('hop-today')");
      set("guide", NI.seances, "Séances", "showPage('hop-seances')");
      set("suivi", NI.learn, "Apprendre", "showPage('hop-learn')");
      set("monkine", NI.moi, "Moi", "showPage('monkine')");
      B("mes").style.display = "none";
      document.body.classList.add("kf-hosp");
      var shown = document.querySelector(".page.active");
      if (shown && (shown.id === "page-home" || shown.id === "page-guide" || shown.id === "page-suivi")) showPage("hop-today");
    } else if (!on && NAVSAVE) {
      Object.keys(NAVSAVE).forEach(function (i) { var b = B(i), o = NAVSAVE[i]; b.innerHTML = o.h; if (o.c) b.setAttribute("onclick", o.c); b.style.display = o.d; });
      NAVSAVE = null; document.body.classList.remove("kf-hosp"); showPage("home");
    }
  }
  (function () {
    var orig = window.showPage; if (!orig) return;
    window.showPage = function (id) {
      if (isHop()) { mode(); if (id === "home") id = "hop-today"; else if (id === "suivi") id = "monkine"; }
      orig(id);
      if (PAGES[id]) paintHop(id);
    };
  })();
  document.addEventListener("DOMContentLoaded", function () { setTimeout(mode, 50); });
  if (document.readyState !== "loading") setTimeout(mode, 50);

  window.KineHopital = { mode: mode, mood: mood, moiHtml: moiHtml, breathe: breathe, breatheGo: breatheGo, breatheListen: breatheListen, listen: listen, vfListen: vfListen, voices: voices, breatheClose: breatheClose,  isHop: isHop, feelHtml: feelHtml, feel: feel, burst: burst, html: html, start: startSeance, startDay: startDay, zone: zone, walk: walk, tipOpen: tipOpen, tipClose: tipClose, vf: vf, seances: SEANCES, tips: TIPS, vfs: VF };
})();
