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
      if (!c.alive()) return; var k = Math.min(1, ((now || performance.now()) - t0) / ms), e = 1 - Math.pow(1 - k, 2);
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
  };
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
