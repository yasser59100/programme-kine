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

  /* Séances prêtes à l'emploi : courtes, sans matériel, du plus doux au plus tonique */
  var SEANCES = [
    { id: "hop-reveil", nom: "Réveil en douceur", min: 10, desc: "On remet le corps en route, sans forcer.",
      ex: ["Assis-debout de chaise", "Élévation des talons", "Serrage des omoplates", "Chat-vache", "Bascule du bassin couché", "Pont de hanche"] },
    { id: "hop-energie", nom: "Un coup d'énergie", min: 12, desc: "Le cœur et la respiration travaillent, sans sauts.",
      ex: ["Jumping jack sans saut", "Montées de genoux", "Talons-fesses debout", "Squat bilatéral", "Skater latéral sans saut", "Le boxeur"] },
    { id: "hop-force", nom: "Force du corps", min: 15, desc: "Jambes, dos, bras et ventre, à ton rythme.",
      ex: ["Squat bilatéral", "Pompes contre le mur", "Rowing deux bras penché", "Pont de hanche", "Dead bug", "Curl biceps"] },
    { id: "hop-calme", nom: "Équilibre et détente", min: 10, desc: "Pour se sentir stable, souple et apaisé.",
      ex: ["Tandem talon-pointe", "Équilibre unipodal", "Marche en tournant la tête", "Enfiler l'aiguille", "Rotation thoracique à quatre pattes", "Chat-vache"] }
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

  /* ── séances ── */
  function startSeance(i) {
    var S = SEANCES[i]; if (!S || !window.KineBiblio) return;
    var ex = S.ex.filter(function (n) { return KineBiblio.find(n); });
    var list = jget("kf-custom", []).filter(function (x) { return x.id !== S.id; });
    list.unshift({ id: S.id, name: S.nom, ex: ex, at: Date.now() });
    jset("kf-custom", list.slice(0, 12));
    try { if (window.KineMonSuivi && KineMonSuivi.close) KineMonSuivi.close(); } catch (e) {}
    if (window.KineCompose) KineCompose.start(S.id);
  }

  /* ── le savais-tu ? ── */
  var cur = 0;
  function tipOpen(i) {
    cur = (i + TIPS.length) % TIPS.length;
    var t = TIPS[cur], sh = $("kh-sheet");
    if (!sh) { sh = document.createElement("div"); sh.id = "kh-sheet"; sh.className = "kf-sheet ks-sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Le savais-tu ?"); document.body.appendChild(sh); }
    sh.innerHTML = "<div class='kf-sheet-body ks-body'>" +
      "<button class='kf-back' onclick='KineHopital.tipClose()' aria-label='Fermer'>←</button>" +
      "<div class='ks-tag'>Le savais-tu ? · " + esc(t.theme) + "</div>" +
      "<h2 class='ks-h'>" + esc(t.title) + "</h2>" +
      "<div class='ks-stat'><b>" + esc(t.stat) + "</b><span>" + esc(t.statLabel) + "</span></div>" +
      "<p class='ks-p'>" + esc(t.body) + "</p>" +
      "<div class='ks-do'><strong>Pour toi</strong><span>" + esc(t.action) + "</span></div>" +
      "<div class='ks-ref'><span>Source</span><strong>" + esc(t.source) + "</strong><a href='" + esc(t.url) + "' target='_blank' rel='noopener'>Voir l'étude</a></div>" +
      "<p class='ks-note'>Ces informations générales ne remplacent pas l'avis de ton équipe soignante.</p>" +
      "</div><div class='kf-sheet-foot ks-foot'>" +
      "<button class='seq-btn-secondary' onclick='KineHopital.tipOpen(" + (cur - 1) + ")' aria-label='Précédent'>‹</button>" +
      "<span class='ks-count'>" + (cur + 1) + " sur " + TIPS.length + "</span>" +
      "<button class='seq-btn-secondary' onclick='KineHopital.tipOpen(" + (cur + 1) + ")' aria-label='Suivant'>›</button></div>";
    sh.classList.add("open");
    var b = sh.querySelector(".ks-body"); if (b) b.scrollTop = 0;
  }
  function tipClose() { var sh = $("kh-sheet"); if (sh) sh.classList.remove("open"); }

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
    "hop-reveil": "<circle cx='12' cy='13' r='4'/><path d='M12 3v2M4.2 7.2l1.4 1.4M19.8 7.2l-1.4 1.4M2 13h2M20 13h2M3 20h18'/>",
    "hop-energie": "<path d='M13 2L4 14h7l-1 8 9-12h-7z'/>",
    "hop-force": "<path d='M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11'/>",
    "hop-calme": "<path d='M5 19c0-9 5-14 14-14 0 9-5 14-14 14z'/><path d='M5 19c3-4 6-6 9-8'/>"
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

  /* ── bloc affiché dans l'écran de suivi ── */
  function html(prev) {
    var hi = day() % SEANCES.length, H = SEANCES[hi], t = TIPS[day() % TIPS.length], wk = weekDone(), goal = 4;
    var h = "<div class='kh-wrap'>";
    // 1. le héros : Yass et la séance du jour
    h += "<section class='kh-hero kh-in' style='--i:0'><span class='kh-yw'><button type='button' class='lu-yass lu-ys' aria-label='Yass' onclick='KineLayout.yass(this)' data-g='salut'></button></span>" +
      "<div class='kh-kick'>Ta séance du jour</div><div class='kh-big'>" + esc(H.nom) + "</div>" +
      "<div class='kh-meta'>" + H.min + " minutes · " + H.ex.length + " exercices</div>" +
      "<div class='kh-say'>" + esc(H.desc) + "</div>" +
      (prev ? "" : "<button type='button' class='kh-go' onclick='KineHopital.start(" + hi + ")'>Commencer<span aria-hidden='true'>›</span></button>") + "</section>";
    // 2. ma semaine
    h += "<section class='kh-week kh-in' style='--i:1'><div class='kh-wk-h'><b>Ma semaine</b><span>" + wk.n + " séance" + (wk.n > 1 ? "s" : "") + "</span></div><div class='kh-dots'>";
    var lab = ["L", "M", "M", "J", "V", "S", "D"], today = iso(new Date());
    for (var i = 0; i < 7; i++) {
      var d = new Date(wk.mon.getTime()); d.setDate(d.getDate() + i); var k = iso(d), done = !!wk.days[k];
      h += "<span class='kh-dot" + (done ? " ok" : "") + (k === today ? " now" : "") + "' style='--d:" + (i * 0.07 + 0.5) + "s'><i aria-hidden='true'>" + (done ? "✓" : "") + "</i><em>" + lab[i] + "</em></span>";
    }
    h += "</div><div class='kh-wk-s'>" + (wk.n === 0 ? "Une première séance cette semaine ? Je suis avec toi." : wk.n >= goal ? "Objectif de la semaine atteint, bravo !" : "Encore " + (goal - wk.n) + " pour atteindre ton objectif.") + "</div></section>";
    // 3. mes séances, en cartes à faire défiler
    h += "<div class='kh-sec kh-in' style='--i:2'>Mes séances</div><div class='kh-rail kh-in' style='--i:3'>";
    SEANCES.forEach(function (S, i) {
      h += "<button type='button' class='kh-card c" + i + "'" + (prev ? " disabled" : " onclick='KineHopital.start(" + i + ")'") + ">" +
        "<svg viewBox='0 0 24 24' width='34' height='34' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + ICON[S.id] + "</svg>" +
        "<b>" + esc(S.nom) + "</b><span>" + S.min + " min</span></button>";
    });
    h += "</div>";
    // 4. le savais-tu
    h += "<button type='button' class='kh-tip kh-in' style='--i:4' onclick='KineHopital.tipOpen(" + (day() % TIPS.length) + ")'><span class='kh-bulb' aria-hidden='true'><svg viewBox='0 0 24 24' width='26' height='26' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z'/></svg></span>" +
      "<span class='kh-tt'><em>Le savais-tu ? · " + esc(t.theme) + "</em><b>" + esc(t.title) + "</b></span><span class='kh-arr' aria-hidden='true'>›</span></button>";
    // 5. vrai ou faux
    h += vfBlock().replace("class='kh-vf'", "class='kh-vf kh-in' style='--i:5'");
    setTimeout(function () { try { if (window.KineLayout && KineLayout.arm) KineLayout.arm(); } catch (e) {} }, 80);
    setTimeout(function () { try { if (window.KineLayout && KineLayout.arm) KineLayout.arm(); } catch (e) {} }, 500);
    return h + "</div>";
  }

  function vfBlock() {
    var i = day() % VF.length, v = VF[i], h = jget("kf-hop-vf", {}), r = h[v.q];
    var dn = r && r.d === day(), good = dn && r.r === v.a;
    var b = "<div class='kh-kick vf'>Vrai ou faux du jour</div><div class='kh-q'>« " + esc(v.q) + " »</div>";
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
    if (good) { burst(n); haptic([14, 40, 14]); } else haptic(30);
  }

  window.KineHopital = { burst: burst, html: html, start: startSeance, tipOpen: tipOpen, tipClose: tipClose, vf: vf, seances: SEANCES, tips: TIPS, vfs: VF };
})();
