/* ═══════════ KinéForce — petites histoires des modes genou et cheville ═══════════
   Genou : le genou est « rouillé », Yass marche raide, une burette d'huile le soulage, il repart souple.
   Cheville : Yass marche, se tord la cheville sur un caillou, elle gonfle, une bande s'enroule, il repart.
   Les images de Yass sont précalculées (profil) ; ANCH donne la place du genou et de la cheville droits dans chaque image. */
var KineModeFx = (function () {
  "use strict";
  var ANCH = {"marche":{"n":12,"k":[[0.52,0.698],[0.477,0.689],[0.447,0.689],[0.436,0.69],[0.447,0.717],[0.477,0.715],[0.52,0.698],[0.561,0.68],[0.589,0.674],[0.599,0.673],[0.589,0.702],[0.561,0.706]],"a":[[0.513,0.876],[0.431,0.861],[0.373,0.851],[0.352,0.848],[0.311,0.833],[0.325,0.808],[0.379,0.808],[0.465,0.831],[0.575,0.852],[0.671,0.836],[0.652,0.869],[0.595,0.881]],"t":[[0.585,0.904],[0.494,0.904],[0.428,0.904],[0.404,0.904],[0.339,0.904],[0.342,0.883],[0.403,0.88],[0.513,0.891],[0.645,0.883],[0.748,0.83],[0.728,0.868],[0.671,0.892]]},"raide":{"n":12,"k":[[0.519,0.705],[0.494,0.69],[0.475,0.696],[0.469,0.697],[0.475,0.698],[0.494,0.701],[0.519,0.696],[0.544,0.688],[0.56,0.69],[0.566,0.693],[0.56,0.709],[0.544,0.709]],"a":[[0.531,0.881],[0.482,0.864],[0.445,0.866],[0.432,0.865],[0.445,0.868],[0.482,0.874],[0.531,0.871],[0.579,0.86],[0.612,0.857],[0.624,0.858],[0.612,0.876],[0.579,0.881]],"t":[[0.605,0.901],[0.552,0.894],[0.512,0.902],[0.498,0.904],[0.512,0.904],[0.552,0.904],[0.605,0.891],[0.655,0.869],[0.688,0.859],[0.7,0.857],[0.688,0.878],[0.655,0.89]]},"debout":{"n":1,"k":[[0.526,0.692]],"a":[[0.513,0.87]],"t":[[0.584,0.901]]},"entorse":{"n":8,"k":[[0.539,0.688],[0.524,0.685],[0.511,0.683],[0.502,0.681],[0.496,0.681],[0.495,0.683],[0.498,0.687],[0.504,0.689]],"a":[[0.545,0.866],[0.478,0.857],[0.423,0.838],[0.387,0.819],[0.372,0.81],[0.376,0.816],[0.398,0.835],[0.437,0.854]],"t":[[0.613,0.902],[0.544,0.896],[0.487,0.881],[0.449,0.864],[0.432,0.857],[0.435,0.865],[0.457,0.885],[0.495,0.904]]},"tient":{"n":1,"k":[[0.647,0.617]],"a":[[0.542,0.762]],"t":[[0.595,0.816]]},"cloche":{"n":10,"k":[[0.43,0.664],[0.43,0.623],[0.43,0.603],[0.43,0.603],[0.43,0.623],[0.43,0.664],[0.43,0.664],[0.43,0.664],[0.43,0.664],[0.43,0.664]],"a":[[0.271,0.583],[0.271,0.542],[0.271,0.522],[0.271,0.522],[0.271,0.542],[0.271,0.583],[0.271,0.583],[0.271,0.583],[0.271,0.583],[0.271,0.583]],"t":[[0.231,0.648],[0.231,0.607],[0.231,0.587],[0.231,0.587],[0.231,0.607],[0.231,0.648],[0.231,0.648],[0.231,0.648],[0.231,0.648],[0.231,0.648]]}};
  var DIR = "assets/lumiere/yass-anim/st-";
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // déroulé : [image, durée (ms), x départ, x arrivée (fraction de l'écran, centre de Yass), cadence d'une boucle (s) ou null si non bouclé]
  var STORIES = {
    genou: [["raide", 1300, -0.25, 0.42, 0.95], ["debout", 1250, 0.42, 0.42, null], ["marche", 1000, 0.42, 1.3, 0.75]],
    cheville: [["marche", 900, -0.25, 0.36, 0.75], ["entorse", 650, 0.36, 0.43, null], ["tient", 1250, 0.43, 0.43, null], ["cloche", 650, 0.43, 0.72, 0.5], ["marche", 650, 0.72, 1.3, 0.75]]
  };

  function play(el, id, M) {
    var story = STORIES[id]; if (!story) return null;
    var cv = document.createElement("canvas"), y = document.createElement("div");
    cv.className = "th-fire"; y.className = "th-runner"; el.insertBefore(y, el.firstChild); el.insertBefore(cv, y.nextSibling);   // dessins par-dessus Yass (burette, bande)
    story.forEach(function (s) { var im = new Image(); im.src = DIR + s[0] + ".webp"; });
    var W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1), c = cv.getContext("2d");
    cv.width = W * dpr; cv.height = H * dpr; c.scale(dpr, dpr);
    var S = Math.min(260, W * 0.66), y0 = H * 0.5 - S * 0.62, t0 = performance.now(), total = 0, P = [], raf = 0, alive = true, cur = -1, lastSqueak = 0;
    story.forEach(function (s) { total += s[1]; });
    y.style.width = y.style.height = S + "px"; y.style.top = y0 + "px"; y.style.animation = "none";
    var ground = y0 + S * 0.95;
    function seg(ms) { var acc = 0; for (var i = 0; i < story.length; i++) { if (ms < acc + story[i][1] || i === story.length - 1) return [i, Math.min(1, (ms - acc) / story[i][1])]; acc += story[i][1]; } }
    function glow(x, yy, r, col, a) { var g = c.createRadialGradient(x, yy, 0, x, yy, r); g.addColorStop(0, col.replace("A", a)); g.addColorStop(1, col.replace("A", 0)); c.fillStyle = g; c.beginPath(); c.arc(x, yy, r, 0, Math.PI * 2); c.fill(); }
    function frame(now) {
      if (!alive) return;
      var ms = Math.max(0, now - t0), sg = seg(ms), i = sg[0], k = sg[1], s = story[i], A = ANCH[s[0]];
      if (i !== cur) { cur = i; y.style.backgroundImage = "url(" + DIR + s[0] + ".webp)"; y.style.backgroundSize = (A.n * 100) + "% 100%"; }
      var fr = s[4] ? Math.floor(ms / 1000 / s[4] * A.n) % A.n : Math.min(A.n - 1, Math.floor(k * A.n));
      y.style.backgroundPosition = (A.n > 1 ? fr / (A.n - 1) * 100 : 0) + "% 0";
      var cx = lerp(s[2], s[3], s[4] ? k : ease(k)) * W, x = cx - S / 2;
      y.style.transform = "translateX(" + x + "px)";
      var kn = [x + A.k[fr][0] * S, y0 + A.k[fr][1] * S], an = [x + A.a[fr][0] * S, y0 + A.a[fr][1] * S];
      c.clearRect(0, 0, W, H); c.globalCompositeOperation = "source-over";
      if (id === "genou") drawKnee(i, k, kn, now); else drawAnkle(i, k, an, now, x, fr);
      // particules : rouille, huile, étincelles
      for (var j = P.length - 1; j >= 0; j--) {
        var p = P[j]; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.l -= p.d;
        if (p.l <= 0 || p.y > H) { P.splice(j, 1); continue; }
        c.globalAlpha = Math.max(0, p.l); c.fillStyle = p.c; c.beginPath();
        if (p.sq) c.rect(p.x, p.y, p.r, p.r * 0.7); else c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill(); c.globalAlpha = 1;
      }
      if (ms < total + 400) raf = requestAnimationFrame(frame); else { cv.remove(); y.remove(); }
      if (ms > total) y.style.display = "none";
    }
    /* ── Genou rouillé ── */
    function drawKnee(i, k, kn, now) {
      if (i === 0 || (i === 1 && k < 0.55)) {
        var pulse = 0.55 + 0.35 * Math.sin(now / 120), heat = i === 1 ? 1 - Math.max(0, (k - 0.3) / 0.25) : 1;
        glow(kn[0], kn[1], 30, "rgba(255,70,50,A)", pulse * heat);
        if (Math.random() < 0.45) P.push({ x: kn[0] + (Math.random() - 0.5) * 14, y: kn[1], vx: (Math.random() - 0.5) * 1.2, vy: 0.5, g: 0.18, r: 2.5 + Math.random() * 3, l: 1, d: 0.02, c: ["#8B4A1C", "#B5652A", "#D9873E"][Math.floor(Math.random() * 3)], sq: true });
        if (i === 0 && now - lastSqueak > 330) { lastSqueak = now; squeak = now; }
        if (now - squeak < 260) {   // « grince » : deux petits arcs de part et d'autre du genou
          var sa = 1 - (now - squeak) / 260; c.strokeStyle = "rgba(255,255,255," + sa + ")"; c.lineWidth = 2.5; c.lineCap = "round";
          [-1, 1].forEach(function (sd) { for (var r = 0; r < 2; r++) { c.beginPath(); c.arc(kn[0], kn[1], 20 + r * 8, sd > 0 ? -0.6 : Math.PI - 0.6, sd > 0 ? 0.6 : Math.PI + 0.6); c.stroke(); } });
        }
      }
      if (i === 1) {   // la burette arrive, verse l'huile, et repart
        var inK = Math.min(1, k / 0.28), outK = Math.max(0, (k - 0.82) / 0.18);
        var bx = kn[0] + 52 + (1 - ease(inK)) * 160 + outK * 160, by = kn[1] - 26 - (1 - ease(inK)) * 140 - outK * 140;
        var tilt = k > 0.28 && k < 0.82 ? -0.75 : -0.75 * (k <= 0.28 ? ease(inK) : 1 - outK);
        can(bx, by, tilt);
        if (k > 0.32 && k < 0.78 && Math.random() < 0.8) P.push({ x: kn[0] + 8 + Math.random() * 4, y: kn[1] - 12, vx: -0.3, vy: 0.6, g: 0.2, r: 3 + Math.random() * 2, l: 0.9, d: 0.05, c: "#F5B82E" });
        if (k > 0.45) { glow(kn[0], kn[1], 34, "rgba(20,184,166,A)", Math.min(0.7, (k - 0.45) * 2)); if (Math.random() < 0.3) P.push({ x: kn[0] + (Math.random() - 0.5) * 30, y: kn[1] + (Math.random() - 0.5) * 20, vx: 0, vy: -0.7, g: 0, r: 2, l: 1, d: 0.03, c: "#FFFFFF" }); }
      }
      if (i === 2 && Math.random() < 0.5) P.push({ x: kn[0] - 10, y: kn[1] + (Math.random() - 0.5) * 30, vx: -1.2, vy: 0, g: 0, r: 2 + Math.random() * 2, l: 1, d: 0.03, c: M.a });
    }
    var squeak = -1e9;
    function can(x, yy, tilt) {   // burette d'huile : corps rond, bec allongé, poignée
      c.save(); c.translate(x, yy); c.rotate(tilt);
      var g = c.createLinearGradient(-18, -18, 18, 18); g.addColorStop(0, "#E8ECF2"); g.addColorStop(1, "#8D97A6");
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 6, 20, 16, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#C9A227"; c.fillRect(-20, 2, 40, 6);
      c.strokeStyle = "#8D97A6"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(-12, -2); c.lineTo(-44, -18); c.stroke();
      c.strokeStyle = "#5B6472"; c.lineWidth = 4; c.beginPath(); c.arc(18, 2, 12, -1.2, 1.4); c.stroke();
      c.restore();
    }
    /* ── Entorse, puis strapping ── */
    var swell = 0;
    function drawAnkle(i, k, an, now, x, fr) {
      // le caillou où le pied va se poser
      var pebX = STORIES.cheville[1][2] * W - S / 2 + ANCH.entorse.a[0][0] * S - S * 0.09;
      if (i <= 2) { c.fillStyle = "#8A8378"; c.beginPath(); c.ellipse(pebX, ground - 3, 13, 7, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#B4AEA4"; c.beginPath(); c.ellipse(pebX - 3, ground - 6, 6, 3, 0, 0, Math.PI * 2); c.fill(); }
      if (i === 1) {   // la cheville tourne : flash rouge et flèche de torsion
        glow(an[0], an[1], 26 + 20 * k, "rgba(255,60,60,A)", 0.8);
        c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = 3; c.lineCap = "round";
        var a0 = -0.4 + k * 2.6; c.beginPath(); c.arc(an[0], an[1], 22, -0.4, a0); c.stroke();
        var ex = an[0] + Math.cos(a0) * 22, ey = an[1] + Math.sin(a0) * 22;
        c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - 8 * Math.cos(a0 - 0.6), ey - 8 * Math.sin(a0 - 0.6)); c.moveTo(ex, ey); c.lineTo(ex + 8 * Math.sin(a0 + 0.9), ey - 8 * Math.cos(a0 + 0.9)); c.stroke();
      }
      if (i === 2) {
        swell = k < 0.3 ? ease(k / 0.3) : k < 0.85 ? 1 - ease((k - 0.45) / 0.4) * (k > 0.45 ? 1 : 0) : 0;
        if (k >= 0.85) swell = 0;
        if (swell > 0.02) {   // ça gonfle
          var r = 10 + 18 * swell, g = c.createRadialGradient(an[0] - 4, an[1] - 4, 2, an[0], an[1], r);
          g.addColorStop(0, "rgba(255,150,140,.95)"); g.addColorStop(1, "rgba(220,40,60,.85)");
          c.fillStyle = g; c.beginPath(); c.arc(an[0], an[1], r, 0, Math.PI * 2); c.fill();
        }
        if (k > 0.35) {   // la bande s'enroule en huit autour de la cheville
          var wrap = Math.min(1, (k - 0.35) / 0.5), turns = 3.2 * wrap;
          c.strokeStyle = "#F4EBDD"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath();
          for (var t = 0; t <= turns; t += 0.04) { var px = an[0] + Math.sin(t * Math.PI * 2) * 13, py = an[1] - 10 + t * 7 + Math.sin(t * Math.PI * 4) * 3; if (t === 0) c.moveTo(px, py); else c.lineTo(px, py); }
          c.stroke();
          c.strokeStyle = "rgba(180,160,130,.6)"; c.lineWidth = 1.5; c.stroke();
          if (wrap >= 1 && Math.random() < 0.4) P.push({ x: an[0] + (Math.random() - 0.5) * 30, y: an[1] + (Math.random() - 0.5) * 24, vx: 0, vy: -0.6, g: 0, r: 2, l: 1, d: 0.03, c: "#FFFFFF" });
        }
      }
      if (i >= 3) {   // la bande reste en place pendant qu'il repart
        c.strokeStyle = "#F4EBDD"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath();
        for (var t2 = 0; t2 <= 3.2; t2 += 0.05) { var qx = an[0] + Math.sin(t2 * Math.PI * 2) * 11, qy = an[1] - 9 + t2 * 6; if (t2 === 0) c.moveTo(qx, qy); else c.lineTo(qx, qy); }
        c.stroke();
      }
    }
    raf = requestAnimationFrame(frame);
    return { stop: function () { alive = false; cancelAnimationFrame(raf); }, lead: total };
  }
  return { play: play, STORIES: STORIES };
})();
window.KineModeFx = KineModeFx;
