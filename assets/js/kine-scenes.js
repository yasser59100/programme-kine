/* ═══════════ KinéForce — une scène sur mesure pour chaque « Le saviez-vous ? » ═══════════
   Chaque conseil a sa petite histoire jouée par Yass (avatar 3D) avec des accessoires dessinés autour :
   compteurs, calendriers, jauges, horloge, lit, rayons X…
   Les scènes tournent en boucle tant que la carte est à l'écran (moteur : kine-ludique.js). */
var KineScenes = (function () {
  "use strict";
  var YASS = "__mascotte";
  function P(def, pose) { var d = window.KineAvatar && KineAvatar._def(def); return d && d.poses ? d.poses[pose] : null; }
  function M() { return KineAvatar.lib.merge.apply(null, arguments); }
  function nf(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  /* ── Poses fabriquées ── */
  // Marche : une jambe posée (le bassin se cale dessus), l'autre passe devant, bras opposé
  function walk(knee, hip, lean) {
    var base = KineAvatar.lib.STAND(0.1, 4);
    var a = function (sw) {
      var o = {}; o[sw] = { ang: [hip || 30, 2, 0, knee || 38, 0] };
      o[sw + "A"] = { ang: [-25, 8, 0, 25 + (lean ? 40 : 0)] }; o[sw === "L" ? "RA" : "LA"] = { ang: [28 + (lean ? 20 : 0), 8, 0, 25 + (lean ? 50 : 0)] };
      o.spine = [lean || 5, 0, 0]; return M(base, o);
    };
    return { wA: a("L"), wB: a("R"), stand: P(YASS, "idle") };
  }
  function lie() {
    var p = P("Pont de hanche", "down");
    return M(p, { pelvis: { p: [0, 0.5, 0], r: [-90, 0, 0] }, spine: [0, 0, 0], head: 0,
      L: { foot: { at: [0.12, 0.47, 0.86], yaw: 0, pole: [0.1, 1, 0] } }, R: { foot: { at: [-0.12, 0.47, 0.86], yaw: 0, pole: [-0.1, 1, 0] } },
      LA: { hand: { at: [0.27, 0.48, 0.1], pole: [1, 0.4, 0] } }, RA: { hand: { at: [-0.27, 0.48, 0.1], pole: [-1, 0.4, 0] } } });
  }
  function yassPoses() { var o = {}; ["idle", "thumb", "cheer1", "cheer2", "open", "talkA", "talkB", "point", "wave1", "wave2"].forEach(function (k) { o["y_" + k] = P(YASS, k); }); return o; }
  function from(def, prefix) { var d = KineAvatar._def(def), o = {}; if (d) for (var k in d.poses) o[prefix + k] = d.poses[k]; return o; }
  function all() { var o = {}; for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) o[k] = arguments[i][k]; return o; }

  /* ── Outils de mise en scène ── */
  // list : [pose, secondes] | ["~", ms] (attendre) | fonction (exécutée tout de suite)
  function play(c, list, done) {
    var i = 0;
    (function next() {
      if (!c.alive()) return;
      if (i >= list.length) { if (done) done(); return; }
      var s = list[i++];
      if (typeof s === "function") { s(); return next(); }
      if (s[0] === "~") return c.T(next, s[1]);
      c.step(s[0], s[1]); c.T(next, s[1] * 1000 + 20);
    })();
  }
  function rep(list, n) { var o = []; for (var i = 0; i < n; i++) o = o.concat(list); return o; }
  function loop(c, build) { (function again() { play(c, build(), again); })(); }
  function count(c, sel, a, b, ms, fmt) {
    var el = c.q(sel); if (!el) return; var t0 = performance.now();
    (function f(now) {
      if (!c.alive()) return; var k = Math.max(0, Math.min(1, ((now || performance.now()) - t0) / ms)), e = 1 - Math.pow(1 - k, 2);
      el.textContent = (fmt || nf)(a + (b - a) * e); if (k < 1) requestAnimationFrame(f);
    })();
  }
  function bar(c, sel, pct, ms) { var el = c.q(sel); if (!el) return; el.style.transition = "width " + (ms || 0) + "ms ease-out, height " + (ms || 0) + "ms ease-out"; el.style.setProperty("--p", pct + "%"); }
  function cls(c, name, on) { c.band.classList.toggle(name, !!on); }
  var WEEK = ["L", "M", "M", "J", "V", "S", "D"];
  function weekHtml(extra) { return "<div class='tp-week" + (extra || "") + "'>" + WEEK.map(function (d, i) { return "<i data-d='" + i + "'><b>" + d + "</b><em></em></i>"; }).join("") + "</div>"; }
  function day(c, i, on, txt) { var d = c.q(".tp-week i[data-d='" + i + "']"); if (!d) return; d.classList.toggle("on", !!on); if (txt != null) d.querySelector("em").textContent = txt; }
  function clearWeek(c) { for (var i = 0; i < 7; i++) { day(c, i, false, ""); var d = c.q(".tp-week i[data-d='" + i + "']"); if (d) d.classList.remove("now", "rest"); } }

  var CAM_WALK = { yaw: -1.57, dist: 4.3, ty: 0.9, pitch: 0.05 };
  var CAM_FRONT = { yaw: 0.35, dist: 4.2, ty: 0.92, pitch: 0.06 };

  var S = {
    /* 1. 7 000 pas : il marche, le compteur monte de 2 000 à 7 000, la jauge des bénéfices plafonne */
    0: { bg: "walk", cam: CAM_WALK, poses: function () { return all(walk(), yassPoses()); },
      deco: "<div class='lq-road'></div><div class='tp-count'><b data-c>2 000</b><small>pas aujourd'hui</small></div><div class='tp-gauge'><small>Bénéfices</small><span><i></i></span></div>",
      run: function (c) { loop(c, function () {
        return [function () { c.q("[data-c]").textContent = "2 000"; bar(c, ".tp-gauge i", 10, 0); cls(c, "moving", true); count(c, "[data-c]", 2000, 7000, 5200); setTimeout(function () { bar(c, ".tp-gauge i", 88, 3000); }, 60); }]
          .concat(rep([["wA", 0.45], ["wB", 0.45]], 6))
          .concat([function () { cls(c, "moving", false); }, ["y_thumb", 0.6], ["~", 1800], ["stand", 0.5]]);
      }); } },

    /* 2. Marcher espace les rechutes : 112 jours sans marche, 208 avec */
    1: { bg: "walk", cam: CAM_WALK, poses: function () { return all(walk(), yassPoses()); },
      deco: "<div class='lq-road'></div><div class='tp-bars'><div><small>Sans marche</small><span class='g'><i style='--p:54%'></i></span><b>112 j</b></div><div><small>Avec la marche</small><span><i data-b></i></span><b data-c>0 j</b></div></div>",
      run: function (c) { loop(c, function () {
        return [function () { bar(c, "[data-b]", 0, 0); cls(c, "moving", true); count(c, "[data-c]", 0, 208, 5000, function (n) { return Math.round(n) + " j"; }); setTimeout(function () { bar(c, "[data-b]", 100, 5000); }, 60); }]
          .concat(rep([["wA", 0.45], ["wB", 0.45]], 6))
          .concat([function () { cls(c, "moving", false); }, ["y_cheer1", 0.45], ["y_cheer2", 0.3], ["y_cheer1", 0.3], ["~", 1500], ["stand", 0.6]]);
      }); } },

    /* 3. Rester actif plutôt qu'au lit : il dort, le lit s'efface, il se lève et bouge */
    2: { bg: "bed", cam: { yaw: 1.35, pitch: 0.22, dist: 5, ty: 0.85 }, poses: function () { return all({ lie: lie() }, yassPoses(), from("Jumping jack sans saut", "j_")); },
      deco: "<div class='lq-bed'></div><div class='lq-zz'><i>Z</i><i>z</i><i>z</i></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "awake", false); }, ["lie", 0.6], ["~", 2400], function () { cls(c, "awake", true); }, ["y_idle", 0.9], ["j_oL", 0.5], ["j_up", 0.4], ["j_oR", 0.5], ["j_up", 0.4], ["j_oL", 0.5], ["j_up", 0.4], ["y_thumb", 0.6], ["~", 1200], ["y_idle", 0.5], ["lie", 1.1]];
      }); } },

    /* 4. Exercice et dos chronique : bird-dog, la douleur descend */
    3: { bg: "back", cam: { yaw: 1.3, pitch: 0.24, dist: 4.9, ty: 0.62, tz: 0.15 }, poses: function () { return from("Bird-dog", ""); },
      deco: "<div class='tp-pain'><small>Douleur</small><b data-c>7</b><span>/10</span><div class='tp-dots'><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>",
      run: function (c) { var n = 7; loop(c, function () {
        var l = [function () { n = 7; setPain(c, n); }];
        for (var r = 0; r < 4; r++) l = l.concat([["up", 1.2], ["~", 400], ["down", 1], function () { setPain(c, --n); }]);
        return l.concat([["~", 1800]]);
      }); } },

    /* 5. Trois efforts d'une minute : il monte la marche d'un bon pas, le chrono fait 1:00, une case se coche */
    4: { bg: "muscle", cam: { yaw: 1.0, dist: 4.4, ty: 0.9, pitch: 0.08 }, props: ["step"], poses: function () { return all(from("Step-up sur marche", ""), yassPoses()); },
      deco: "<div class='tp-chrono'><b data-c>0:00</b><div class='tp-checks'><i></i><i></i><i></i></div></div>",
      run: function (c) { var k = 0; loop(c, function () {
        if (k === 3) { k = 0; [].forEach.call(c.band.querySelectorAll(".tp-checks i"), function (x) { x.classList.remove("on"); }); }
        var steps = stepsOf("Step-up sur marche", 0.45), l = [function () { count(c, "[data-c]", 0, 60, 4200, function (s) { s = Math.round(s); return s >= 60 ? "1:00" : "0:" + ("0" + s).slice(-2); }); }];
        l = l.concat(rep(steps, 3));
        return l.concat([function () { c.q("[data-c]").textContent = "1:00"; var b = c.band.querySelectorAll(".tp-checks i")[k++]; if (b) b.classList.add("on"); }, ["y_thumb", 0.5], ["~", 900], ["floor", 0.4]]);
      }); } },

    /* 6. 30 à 60 minutes de renforcement par semaine : squats, deux jours se remplissent */
    5: { bg: "muscle", cam: { yaw: 0.65, dist: 4.4, ty: 0.9, pitch: 0.06 }, poses: function () { return all(from("Squat bilatéral", ""), yassPoses()); },
      deco: weekHtml(),
      run: function (c) { loop(c, function () {
        var sq = rep([["down", 0.9], ["up", 0.7]], 2);
        return [function () { clearWeek(c); }, ["~", 300], function () { day(c, 1, true, "30'"); }]
          .concat(sq).concat([function () { day(c, 4, true, "30'"); }]).concat(sq)
          .concat([function () { cls(c, "done", true); }, ["y_cheer1", 0.45], ["y_cheer2", 0.3], ["y_cheer1", 0.3], ["~", 1400], function () { cls(c, "done", false); }, ["up", 0.5]]);
      }); } },

    /* 7. Tout faire en un ou deux jours : assis la semaine, il bouge le samedi et le dimanche */
    6: { bg: "brain", cam: { yaw: 1.2, dist: 4.4, ty: 0.85, pitch: 0.06 }, props: ["chair"], poses: function () { return all(from("Assis-debout de chaise", "c_"), from("Jumping jack sans saut", "j_"), yassPoses()); },
      deco: weekHtml(" big"),
      run: function (c) { loop(c, function () {
        var l = [function () { clearWeek(c); }, ["c_sit", 0.6]];
        for (var i = 0; i < 5; i++) (function (i) { l.push(function () { var d = c.q(".tp-week i[data-d='" + i + "']"); if (d) d.classList.add("rest"); }); l.push(["~", 420]); })(i);
        l.push(["c_up", 0.7]);
        [5, 6].forEach(function (i) { l.push(function () { day(c, i, true, "✓"); }); l = l.concat([["j_oL", 0.45], ["j_up", 0.35], ["j_oR", 0.45], ["j_up", 0.35]]); });
        return l.concat([["y_thumb", 0.5], ["~", 1300], ["c_up", 0.4]]);
      }); } },

    /* 8. 5 minutes de marche toutes les 30 minutes : assis, l'horloge tourne, il marche, le pic de sucre baisse */
    7: { bg: "walk", cam: { yaw: 1.2, dist: 4.4, ty: 0.85, pitch: 0.06 }, props: ["chair"], poses: function () { return all(from("Assis-debout de chaise", "c_"), from("Montées de genoux", "m_"), yassPoses()); },
      deco: "<div class='tp-clock'><i></i><b data-c>0 min</b></div><div class='tp-sugar'><small>Pic de sucre</small><span><i data-b></i></span></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "tick", true); bar(c, "[data-b]", 95, 0); count(c, "[data-c]", 0, 30, 3000, function (n) { return Math.round(n) + " min"; }); }, ["c_sit", 0.6], ["~", 2600],
          function () { cls(c, "tick", false); c.q("[data-c]").textContent = "5 min de marche"; setTimeout(function () { bar(c, "[data-b]", 40, 2600); }, 50); }, ["c_up", 0.8]]
          .concat(rep([["m_kL", 0.4], ["m_up", 0.3], ["m_kR", 0.4], ["m_up", 0.3]], 3)).concat([["y_thumb", 0.5], ["~", 1200], ["c_up", 0.3], ["c_sit", 0.8]]);
      }); } },

    /* 9. Une nuit trop courte : il dort, le réveil sonne à 4 h, la douleur s'allume dans sa tête */
    8: { bg: "sleep", cam: { yaw: 1.35, pitch: 0.22, dist: 5, ty: 0.85 }, poses: function () { return { lie: lie() }; },
      deco: "<div class='lq-bed'></div><div class='lq-zz'><i>Z</i><i>z</i><i>z</i></div><div class='tp-alarm'>⏰<b>4:00</b></div><div class='tp-zap'>⚡<b>+126 %</b><small>de douleur ressentie</small></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "ring", false); cls(c, "zap", false); }, ["lie", 0.5], ["~", 2600], function () { cls(c, "ring", true); }, ["~", 1500], function () { cls(c, "zap", true); }, ["~", 2600]];
      }); } },

    /* 10. Courir n'use pas les genoux : il court aux rayons X, ses genoux restent verts */
    9: { bg: "xray", cam: CAM_WALK, poses: function () { return walk(70, 45, 12); },
      deco: "<div class='lq-road'></div><div class='tp-ok'><b>✓</b> genoux en bon état</div>",
      run: function (c) { c.xray(true); cls(c, "moving", true); cls(c, "xr", true); loop(c, function () { return rep([["wA", 0.28], ["wB", 0.28]], 8); }); } }
,

    /* 11. Fumer retarde la consolidation : fissure qui se referme sans tabac, qui reste avec */
    10: { bg: "xray", cam: CAM_FRONT, poses: function () { return yassPoses(); },
      deco: "<div class='tp-crack'><svg viewBox='0 0 20 40'><path d='M10 0 L4 10 L14 18 L5 27 L13 34 L9 40' fill='none' stroke='#FF4D4D' stroke-width='3.5' stroke-linejoin='round' stroke-linecap='round'/></svg></div><div class='tp-cig'>🚬<i></i><i></i></div><div class='tp-tag' data-t></div>",
      run: function (c) { c.xray(true); cls(c, "xr", true); loop(c, function () {
        return [function () { cls(c, "smoke", false); cls(c, "healed", false); tag(c, "Sans tabac"); }, ["y_idle", 0.5], ["~", 1600], function () { cls(c, "healed", true); tag(c, "Os consolidé ✓"); }, ["y_thumb", 0.5], ["~", 1800],
          function () { cls(c, "healed", false); cls(c, "smoke", true); tag(c, "Avec tabac"); }, ["y_open", 0.6], ["~", 2400], function () { tag(c, "Toujours fissuré ×2,2"); }, ["~", 1800]];
      }); } },

    /* 12. L'exercice aide à soigner la déprime : un nuage de pluie, il bouge, le soleil revient */
    11: { bg: "rain", cam: { yaw: 0.35, dist: 4.7, ty: 1.2, pitch: 0.06 }, poses: function () { return all(yassPoses(), from("Jumping jack sans saut", "j_"), { sad: M(P(YASS, "idle"), { head: 28, spine: [18, 0, 0] }) }); },
      deco: "<div class='tp-cloud'><i></i><i></i><i></i><i></i></div><div class='tp-sun'></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "sunny", false); }, ["sad", 0.8], ["~", 2200]].concat(rep([["j_oL", 0.45], ["j_up", 0.35], ["j_oR", 0.45], ["j_up", 0.35]], 2))
          .concat([function () { cls(c, "sunny", true); }]).concat(rep([["j_oL", 0.45], ["j_up", 0.35], ["j_oR", 0.45], ["j_up", 0.35]], 1))
          .concat([["y_cheer1", 0.45], ["y_cheer2", 0.3], ["y_cheer1", 0.3], ["~", 1600]]);
      }); } },

    /* 13. Les exercices d'équilibre réduisent les chutes : sur une jambe, il vacille mais tient */
    12: { bg: "balance", cam: { yaw: 0.9, dist: 4.3, ty: 0.9, pitch: 0.06 }, poses: function () { return all(from("Montées de genoux", "m_"), yassPoses()); },
      deco: "<div class='tp-tag' data-t></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "wobble", true); tag(c, "Il vacille…"); }, ["m_kL", 0.7], ["~", 2400], function () { cls(c, "wobble", false); tag(c, "…mais il tient ✓"); }, ["~", 1200], ["m_up", 0.5],
          function () { cls(c, "wobble", true); tag(c, "Il vacille…"); }, ["m_kR", 0.7], ["~", 2400], function () { cls(c, "wobble", false); tag(c, "…mais il tient ✓"); }, ["~", 1200], ["y_thumb", 0.5], ["~", 900], ["m_up", 0.5]];
      }); } },

    /* 14. On gagne de la force à 90 ans : 90 bougies, puis squats, la force grimpe */
    13: { bg: "moral", cam: { yaw: 0.65, dist: 4.4, ty: 0.9, pitch: 0.06 }, poses: function () { return all(from("Squat bilatéral", ""), yassPoses()); },
      deco: "<div class='tp-cake'><b>90</b><span></span></div><div class='tp-gauge'><small>Force des cuisses</small><span><i></i></span><b data-c>+0 %</b></div>",
      run: function (c) { loop(c, function () {
        var l = [function () { cls(c, "cake", true); bar(c, ".tp-gauge i", 4, 0); c.q("[data-c]").textContent = "+0 %"; }, ["y_wave1", 0.45], ["y_wave2", 0.3], ["y_wave1", 0.3], ["~", 1200], function () { cls(c, "cake", false); count(c, "[data-c]", 0, 174, 5200, function (n) { return "+" + Math.round(n) + " %"; }); setTimeout(function () { bar(c, ".tp-gauge i", 100, 5200); }, 40); }];
        return l.concat(rep([["down", 0.9], ["up", 0.7]], 3)).concat([["y_cheer1", 0.45], ["y_cheer2", 0.3], ["~", 1600]]);
      }); } },

    /* 15. La force de la main : il serre, l'aiguille du dynamomètre monte */
    14: { bg: "muscle", cam: { yaw: 0.6, dist: 3.4, ty: 1.1, pitch: 0.04 }, poses: function () { return all(yassPoses(), { grip: M(P(YASS, "thumb"), { head: 6 }) }); },
      deco: "<div class='tp-dyn'><svg viewBox='0 0 100 56'><path d='M8 52a42 42 0 0 1 84 0' fill='none' stroke='rgba(255,255,255,.3)' stroke-width='9' stroke-linecap='round'/><path class='tp-arc' d='M8 52a42 42 0 0 1 84 0' fill='none' stroke='#fff' stroke-width='9' stroke-linecap='round' pathLength='100'/><line class='tp-needle' x1='50' y1='52' x2='50' y2='16' stroke='#0F1D2E' stroke-width='4' stroke-linecap='round'/><circle cx='50' cy='52' r='5' fill='#0F1D2E'/></svg><b data-c>0 kg</b></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "squeeze", false); c.q("[data-c]").textContent = "0 kg"; }, ["y_idle", 0.6], ["~", 700], ["grip", 0.6], function () { cls(c, "squeeze", true); count(c, "[data-c]", 0, 38, 2200, function (n) { return Math.max(0, Math.round(n)) + " kg"; }); }, ["~", 2600], ["y_thumb", 0.4], ["~", 1500], ["y_idle", 0.6]];
      }); } },

    /* 16. S'asseoir et se relever du sol : il s'assoit par terre, puis se relève sans les mains */
    15: { bg: "balance", cam: { yaw: 1.1, dist: 4.4, ty: 0.75, pitch: 0.1 }, poses: function () { return all(from("Squat bilatéral", "s_"), yassPoses(), { floor: floorSit() }); },
      deco: "<div class='tp-tag' data-t></div>",
      run: function (c) { loop(c, function () {
        return [function () { tag(c, ""); }, ["s_up", 0.5], ["s_down", 1], ["floor", 1.1], ["~", 1500], function () { tag(c, "Sans les mains !"); }, ["s_down", 1.1], ["s_up", 0.9], ["y_cheer1", 0.45], ["y_cheer2", 0.3], ["y_cheer1", 0.3], ["~", 1500]];
      }); } },

    /* 17. La vitesse de marche reflète la santé : il accélère, le compteur de vitesse monte */
    16: { bg: "walk", cam: CAM_WALK, poses: function () { return all(walk(), yassPoses()); },
      deco: "<div class='lq-road'></div><div class='tp-count'><b data-c>0,8</b><small>m/s</small></div>",
      run: function (c) { loop(c, function () {
        var l = [function () { cls(c, "moving", true); c.band.style.setProperty("--road", "1.2s"); count(c, "[data-c]", 0.8, 1.3, 6000, function (n) { return n.toFixed(1).replace(".", ","); }); }];
        [0.55, 0.5, 0.45, 0.4, 0.36, 0.33, 0.3, 0.28].forEach(function (d, i) { l.push(function () { c.band.style.setProperty("--road", (1.2 - i * 0.11).toFixed(2) + "s"); }); l.push(["wA", d]); l.push(["wB", d]); });
        return l.concat([function () { cls(c, "moving", false); }, ["y_thumb", 0.5], ["~", 1500], ["stand", 0.5]]);
      }); } },

    /* 18. L'exercice soulage l'arthrose du genou : extension de genou, genou aux rayons X, la douleur baisse */
    17: { bg: "xray", cam: { yaw: 1.3, dist: 4.2, ty: 0.7, pitch: 0.08 }, props: ["chair"], poses: function () { return from("Extension de genou assis", ""); },
      deco: "<div class='tp-pain'><small>Douleur au genou</small><b data-c>7</b><span>/10</span><div class='tp-dots'><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>",
      run: function (c) { var n = 7; c.xray(true); cls(c, "xr", true); loop(c, function () {
        var l = [function () { n = 7; setPain(c, n); }];
        for (var r = 0; r < 4; r++) l = l.concat([["up", 1], ["~", 500], ["down", 0.9], function () { setPain(c, --n); }]);
        return l.concat([["~", 1600]]);
      }); } },

    /* 19. IRM : de l'usure à l'image, mais aucune douleur */
    18: { bg: "xray", cam: { yaw: 1.35, pitch: 0.2, dist: 5, ty: 0.8 }, poses: function () { return all({ lie: lie() }, yassPoses()); },
      deco: "<div class='tp-table'></div><div class='tp-mri'></div><div class='tp-screen'><small>IRM</small><b>Disque « usé »</b></div><div class='tp-tag' data-t></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "inmri", false); cls(c, "result", false); cls(c, "awake", false); tag(c, ""); }, ["lie", 0.6], ["~", 300], function () { cls(c, "inmri", true); }, ["~", 2400], function () { cls(c, "result", true); }, ["~", 1600],
          function () { cls(c, "inmri", false); cls(c, "awake", true); tag(c, "Douleur : 0 / 10"); }, ["y_idle", 0.9], ["y_thumb", 0.5], ["~", 2000]];
      }); } },

    /* 20. Un kilo perdu, c'est 4 kilos de moins sur le genou à chaque pas */
    19: { bg: "knee", cam: CAM_WALK, poses: function () { return all(walk(), yassPoses()); },
      deco: "<div class='lq-road'></div><div class='tp-kg'>1 kg</div><div class='tp-knee'>−4 kg<small>sur le genou à chaque pas</small></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "moving", true); cls(c, "drop", false); cls(c, "light", false); }].concat(rep([["wA", 0.45], ["wB", 0.45]], 2))
          .concat([function () { cls(c, "drop", true); }]).concat(rep([["wA", 0.45], ["wB", 0.45]], 1))
          .concat([function () { cls(c, "light", true); }]).concat(rep([["wA", 0.4], ["wB", 0.4]], 3))
          .concat([function () { cls(c, "moving", false); }, ["y_thumb", 0.5], ["~", 1500], ["stand", 0.5]]);
      }); } }
,

    /* 21. Ménisque usé : la kiné fait aussi bien que l'opération */
    20: { bg: "knee", cam: { yaw: 0.65, dist: 4.4, ty: 0.9, pitch: 0.06 }, poses: function () { return all(from("Squat bilatéral", ""), yassPoses()); },
      deco: "<div class='tp-vs'><div class='tp-op'><span>🩺</span><b>Opération</b><small data-y>…</small></div><i>=</i><div class='tp-op'><span>🏋️</span><b>Kiné</b><small data-z>…</small></div></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "eq", false); c.q("[data-y]").textContent = "…"; c.q("[data-z]").textContent = "…"; }].concat(rep([["down", 0.9], ["up", 0.7]], 3))
          .concat([function () { cls(c, "eq", true); c.q("[data-y]").textContent = "après 2 ans"; c.q("[data-z]").textContent = "après 2 ans"; }, ["y_thumb", 0.5], ["~", 2400], ["up", 0.5]]);
      }); } },

    /* 22. Exercice et explications préviennent le mal de dos : le livre s'ouvre, le bouclier protège son dos */
    21: { bg: "back", cam: { yaw: 1.3, pitch: 0.24, dist: 4.9, ty: 0.62, tz: 0.15 }, poses: function () { return from("Bird-dog", ""); },
      deco: "<div class='tp-book'>📖</div><div class='tp-shield'>🛡️</div><div class='tp-tag' data-t></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "book", false); cls(c, "shield", false); tag(c, ""); }, ["down", 0.6], ["~", 300], function () { cls(c, "book", true); tag(c, "Comprendre…"); }, ["~", 1400], function () { tag(c, "…et bouger"); }]
          .concat(rep([["up", 1.2], ["~", 300], ["down", 1]], 2)).concat([function () { cls(c, "shield", true); tag(c, "Dos protégé ✓"); }, ["~", 2400]]);
      }); } },

    /* 23. Un mal de dos récent s'améliore vite : penché au début, il se redresse en 6 semaines */
    22: { bg: "back", cam: { yaw: 1.05, dist: 4.4, ty: 0.92, pitch: 0.06 }, poses: function () {
        var idle = P(YASS, "idle"), o = { y_idle: idle, y_thumb: P(YASS, "thumb") };
        [0, 1, 2, 3].forEach(function (k) { o["b" + k] = M(idle, { spine: [34 - k * 11, 0, 6 - k * 2], head: 16 - k * 5, pelvis: { p: [0, "auto", 0], r: [12 - k * 4, 0, 0] } }); });
        return o; },
      deco: "<div class='tp-pain'><small data-w>Semaine 1</small><b data-c>52</b><span>/100</span><div class='tp-dots'><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>",
      run: function (c) { loop(c, function () {
        var l = [function () { setPain(c, 5); c.q("[data-c]").textContent = "52"; c.q("[data-w]").textContent = "Semaine 1"; }, ["b0", 0.8], ["~", 1200]];
        [[2, 44, "b1"], [3, 36, "b2"], [4, 30, "b2"], [5, 26, "b3"], [6, 23, "y_idle"]].forEach(function (w) {
          l.push(function () { c.q("[data-w]").textContent = "Semaine " + w[0]; count(c, "[data-c]", +c.q("[data-c]").textContent, w[1], 700); setPain(c, Math.round(w[1] / 10)); c.q("[data-c]").textContent; });
          l.push([w[2], 0.8]); l.push(["~", 400]);
        });
        return l.concat([["y_thumb", 0.5], ["~", 1800]]);
      }); } },

    /* 24. Nordic curl : à genoux, il se penche en avant, les ischios s'allument */
    23: { bg: "muscle", cam: { yaw: 1.45, dist: 4.4, ty: 0.65, pitch: 0.08 }, poses: function () { return nordic(); },
      deco: "<div class='tp-hams'></div><div class='tp-count'><b data-c>−51 %</b><small>de blessures</small></div>",
      run: function (c) { loop(c, function () {
        return [["kneel", 0.6], ["~", 500], function () { cls(c, "glow", true); }, ["lean1", 1.4], ["lean2", 1.2], ["~", 300], ["catch", 0.5], function () { cls(c, "glow", false); }, ["~", 500], ["kneel", 0.9], ["~", 900]];
      }); } },

    /* 25. Échauffement FIFA 11+ : ballon, échauffement, bouclier contre les blessures */
    24: { bg: "walk", cam: { yaw: 0.6, dist: 4.4, ty: 0.9, pitch: 0.08 }, poses: function () { return all(from("Montées de genoux", "m_"), from("Jumping jack sans saut", "j_"), yassPoses()); },
      deco: "<div class='tp-ball'>⚽</div><div class='tp-shield'>🛡️<small>−39 % de blessures</small></div><div class='tp-tag' data-t></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "shield", false); tag(c, "Échauffement 11+"); }].concat(rep([["m_kL", 0.4], ["m_up", 0.3], ["m_kR", 0.4], ["m_up", 0.3]], 2))
          .concat(rep([["j_oL", 0.45], ["j_up", 0.35], ["j_oR", 0.45], ["j_up", 0.35]], 2)).concat([function () { cls(c, "shield", true); tag(c, ""); }, ["y_thumb", 0.5], ["~", 2200], ["m_up", 0.4]]);
      }); } },

    /* 26. Le renforcement rend les os plus solides : squats aux rayons X, les os s'épaississent */
    25: { bg: "xray", cam: { yaw: 0.85, dist: 4.2, ty: 0.85, pitch: 0.1 }, poses: function () { return from("Squat bilatéral", ""); },
      deco: "<div class='tp-gauge'><small>Densité osseuse</small><span><i></i></span><b data-c>8 mois</b></div>",
      run: function (c) { c.xray(true); cls(c, "xr", true); loop(c, function () {
        var l = [function () { c.band.style.setProperty("--bone", "0"); bar(c, ".tp-gauge i", 15, 0); }];
        for (var m = 1; m <= 4; m++) (function (m) { l = l.concat([["down", 0.9], ["up", 0.7], function () { c.band.style.setProperty("--bone", String(m)); bar(c, ".tp-gauge i", 15 + m * 20, 700); c.q("[data-c]").textContent = "Mois " + (m * 2); }]); })(m);
        return l.concat([["~", 1800]]);
      }); } },

    /* 27. Marcher davantage, moins de démence : il marche, son cerveau s'allume, 9 800 pas */
    26: { bg: "brain", cam: CAM_WALK, poses: function () { return all(walk(), yassPoses()); },
      deco: "<div class='lq-road'></div><div class='lq-brain tp-brainw'><svg viewBox='0 0 64 52'><path d='M32 6c-6-5-17-2-18 7-7 2-7 14 0 16 0 8 10 13 18 7 8 6 18 1 18-7 7-2 7-14 0-16-1-9-12-12-18-7z' fill='#fff' fill-opacity='.18' stroke='#fff' stroke-width='2.5'/><path d='M32 8v34M22 18l10 6 10-6M23 30l9-6 9 6' stroke='#fff' stroke-width='1.6' fill='none' opacity='.6'/></svg><i></i><i></i><i></i></div><div class='tp-count'><b data-c>0</b><small>pas</small></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "lit", false); cls(c, "moving", true); count(c, "[data-c]", 0, 9800, 5200); setTimeout(function () { cls(c, "lit", true); }, 3600); }].concat(rep([["wA", 0.45], ["wB", 0.45]], 6))
          .concat([function () { cls(c, "moving", false); }, ["y_thumb", 0.5], ["~", 1800], ["stand", 0.5]]);
      }); } },

    /* 28. Une heure d'activité compense les journées assises : assis au bureau, puis la balance se rééquilibre */
    27: { bg: "walk", cam: { yaw: 1.2, dist: 4.4, ty: 0.85, pitch: 0.06 }, props: ["chair"], poses: function () { return all(from("Assis-debout de chaise", "c_"), walk(), yassPoses()); },
      deco: "<div class='tp-scale'><svg viewBox='0 0 100 60'><line x1='50' y1='56' x2='50' y2='14' stroke='#fff' stroke-width='4'/><g class='tp-beam'><line x1='10' y1='14' x2='90' y2='14' stroke='#fff' stroke-width='4' stroke-linecap='round'/><rect x='2' y='18' width='22' height='12' rx='3' fill='#FFB547'/><rect x='76' y='18' width='22' height='12' rx='3' fill='#3CF2B0'/></g></svg><small><span>Assis</span><span>Actif</span></small></div><div class='tp-tag' data-t></div>",
      run: function (c) { loop(c, function () {
        return [function () { cls(c, "tilt", false); tag(c, "8 h assis"); }, ["c_sit", 0.7], ["~", 2400], function () { tag(c, "+ 1 h d'activité"); }, ["c_up", 0.8]]
          .concat(rep([["wA", 0.45], ["wB", 0.45]], 3)).concat([function () { cls(c, "tilt", true); tag(c, "Équilibré ✓"); }, ["y_thumb", 0.5], ["~", 2000], ["c_up", 0.3], ["c_sit", 0.8]]);
      }); } },

    /* 29. Être bien entouré : trois Yass se retrouvent et fêtent ça */
    28: { bg: "moral", cam: { yaw: 0.2, dist: 4.4, ty: 0.92, pitch: 0.05 }, poses: function () { return yassPoses(); },
      deco: "<div class='tp-friend f1'></div><div class='tp-friend f2'></div><div class='lq-hearts'><i>♥</i><i>♥</i><i>♥</i><i>♥</i><i>♥</i></div>",
      run: function (c) {
        var fr = [], d2 = { camera: { yaw: 0.2, dist: 4.4, ty: 0.92, pitch: 0.05 }, poses: yassPoses(), start: "y_idle", thumb: "y_idle" };
        c.spawn(".tp-friend.f1", M(d2, { camera: { yaw: 0.9, dist: 4.4, ty: 0.92, pitch: 0.05 } }), function (f) { fr.push(f); });
        c.spawn(".tp-friend.f2", M(d2, { camera: { yaw: -0.6, dist: 4.4, ty: 0.92, pitch: 0.05 } }), function (f) { fr.push(f); });
        var all3 = function (p, d) { return function () { fr.forEach(function (f, i) { setTimeout(function () { f.step(p, d); }, i * 120); }); }; };
        loop(c, function () {
          return [all3("y_wave1", 0.45), ["y_wave1", 0.45], all3("y_wave2", 0.3), ["y_wave2", 0.3], all3("y_wave1", 0.3), ["y_wave1", 0.3], ["~", 500],
            all3("y_cheer1", 0.45), ["y_cheer1", 0.45], all3("y_cheer2", 0.3), ["y_cheer2", 0.3], all3("y_cheer1", 0.3), ["y_cheer1", 0.3], all3("y_cheer2", 0.3), ["y_cheer2", 0.3],
            all3("y_idle", 0.7), ["y_idle", 0.7], ["~", 1600]];
        });
      } },

    /* 30. L'exercice entretient la tête : jumping jacks, le cerveau s'allume de plus en plus */
    29: { bg: "brain", cam: { yaw: 0.25, dist: 4.6, ty: 1.05, pitch: 0.06 }, poses: function () { return all(from("Jumping jack sans saut", "j_"), yassPoses()); },
      deco: "<div class='lq-brain tp-brainw'><svg viewBox='0 0 64 52'><path d='M32 6c-6-5-17-2-18 7-7 2-7 14 0 16 0 8 10 13 18 7 8 6 18 1 18-7 7-2 7-14 0-16-1-9-12-12-18-7z' fill='#fff' fill-opacity='.18' stroke='#fff' stroke-width='2.5'/><path d='M32 8v34M22 18l10 6 10-6M23 30l9-6 9 6' stroke='#fff' stroke-width='1.6' fill='none' opacity='.6'/></svg><i></i><i></i><i></i></div><div class='tp-gauge'><small>Capacités du cerveau</small><span><i></i></span></div>",
      run: function (c) { loop(c, function () {
        var l = [function () { cls(c, "lit", false); bar(c, ".tp-gauge i", 20, 0); }];
        for (var r = 0; r < 4; r++) (function (r) { l = l.concat([["j_oL", 0.45], ["j_up", 0.35], ["j_oR", 0.45], ["j_up", 0.35], function () { bar(c, ".tp-gauge i", 20 + (r + 1) * 20, 600); if (r === 1) cls(c, "lit", true); }]); })(r);
        return l.concat([["y_cheer1", 0.45], ["y_cheer2", 0.3], ["~", 1500]]);
      }); } }
  };
  function nordic() {
    var base = { pelvis: { p: [0, 0.6, 0.02], r: [0, 0, 0] }, spine: [0, 0, 0], head: 0,
      L: { foot: { at: [0.11, 0.02, -0.42], yaw: 0, pole: [0.1, -0.3, 1] } }, R: { foot: { at: [-0.11, 0.02, -0.42], yaw: 0, pole: [-0.1, -0.3, 1] } },
      LA: { ang: [10, 12, 0, 70] }, RA: { ang: [10, 12, 0, 70] } };
    return { kneel: base,
      lean1: M(base, { pelvis: { p: [0, 0.55, 0.16], r: [28, 0, 0] } }),
      lean2: M(base, { pelvis: { p: [0, 0.45, 0.3], r: [52, 0, 0] }, LA: { ang: [70, 12, 0, 40] }, RA: { ang: [70, 12, 0, 40] } }),
      catch: M(base, { pelvis: { p: [0, 0.36, 0.38], r: [70, 0, 0] }, LA: { ang: [95, 10, 0, 20] }, RA: { ang: [95, 10, 0, 20] } }) };
  }
  function tag(c, t) { var el = c.q("[data-t]"); if (el) { el.textContent = t; el.classList.toggle("on", !!t); } }
  function floorSit() {
    var idle = P(YASS, "idle");
    return M(idle, { pelvis: { p: [0, 0.13, -0.05], r: [-8, 0, 0] }, spine: [12, 0, 0], head: 6,
      L: { foot: { at: [0.13, 0, 0.62], yaw: 6, pole: [0.1, 1, 0.3] } }, R: { foot: { at: [-0.13, 0, 0.62], yaw: -6, pole: [-0.1, 1, 0.3] } },
      LA: { hand: { at: [0.26, 0.03, -0.12], pole: [1, 0.3, 0] } }, RA: { hand: { at: [-0.26, 0.03, -0.12], pole: [-1, 0.3, 0] } } });
  }
  function setPain(c, n) {
    var b = c.q("[data-c]"); if (b) b.textContent = n;
    var dots = c.band.querySelectorAll(".tp-dots i"); [].forEach.call(dots, function (d, i) { d.className = i < n ? (n >= 6 ? "r" : n >= 4 ? "o" : "g") : ""; });
  }
  function stepsOf(name, k) {
    var inf = KineAvatar.info(name, "10 répétitions", 2), st = KineAvatar.plan(name, 1, inf, 2).steps || [];
    return st.filter(function (s) { return s.pose; }).map(function (s) { return [s.pose, Math.max(0.3, s.dur * k)]; });
  }

  return {
    has: function (i) { return !!S[i]; },
    bg: function (i) { return S[i] && S[i].bg; },
    deco: function (i) { return S[i] ? S[i].deco || "" : ""; },
    def: function (i) {
      var s = S[i]; if (!s || !window.KineAvatar || !KineAvatar.lib) return null;
      if (window.KineMascotte && KineMascotte.portrait) KineMascotte.portrait();
      var poses = s.poses(), first = null; for (var k in poses) { if (!poses[k]) delete poses[k]; else if (!first) first = k; }
      return { camera: s.cam, props: s.props, poses: poses, start: first, thumb: first };
    },
    run: function (i, c) { if (S[i]) S[i].run(c); }
  };
})();
window.KineScenes = KineScenes;
