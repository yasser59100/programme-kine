/* ═══════════ KinéForce — créer un exercice en se filmant (kiné) ═══════════
   Le kiné choisit la position de départ et le matériel, se filme, garde la répétition la plus propre,
   et Yass apprend le mouvement : deux positions (départ, arrivée) et le rythme, réglés ensuite dans le créateur.
   Tout se calcule dans le téléphone (détection MediaPipe déjà utilisée pour le bilan) : aucune image n'est envoyée.
   Seul l'exercice publié (positions de Yass + fiche) part chez les patients, avec le programme officiel. */
var KineCapture = (function () {
  "use strict";
  var BASE_DIR = "assets/pose/", MAX_S = 30;
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ════════ Petite géométrie 3D ════════ */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function unit(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; }
  function ortho(a, ref) { return unit(sub(a, mul(ref, dot(a, ref)))); }   // a sans sa composante selon ref
  var D2R = Math.PI / 180;
  function Rx(d) { var c = Math.cos(d * D2R), s = Math.sin(d * D2R); return [[1, 0, 0], [0, c, -s], [0, s, c]]; }
  function Ry(d) { var c = Math.cos(d * D2R), s = Math.sin(d * D2R); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; }
  function Rz(d) { var c = Math.cos(d * D2R), s = Math.sin(d * D2R); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; }
  function mm(A, B) { var o = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) o[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]; return o; }
  function mv(M, v) { return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]]; }
  function mtv(M, v) { return [M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2], M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2], M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2]]; }   // transposée
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function deg(r) { return r / D2R; }

  /* ════════ Points filmés → squelette aux proportions de Yass ════════
     Repère MediaPipe « monde » : x à droite de l'image, y vers le bas, z qui s'éloigne de la caméra, origine au milieu des hanches.
     Repère de Yass : x vers sa gauche, y vers le haut, z vers l'avant. */
  var IDX = { nose: 0, lEar: 7, rEar: 8, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28, lHe: 29, rHe: 30, lToe: 31, rToe: 32 };
  function pts(fr, Rc) {
    var o = {}, w = fr.w;
    for (var k in IDX) { var i = IDX[k], p = [w[i * 4], -w[i * 4 + 1], -w[i * 4 + 2]]; o[k] = Rc ? mv(Rc, p) : p; o[k].v = w[i * 4 + 3]; }
    return o;
  }
  function lens() { return (window.KineAvatar && KineAvatar.LEN) || { thigh: 0.44, shank: 0.42, upper: 0.28, fore: 0.26, hipX: 0.095, shX: 0.205, shY: 0.49 }; }
  // Contact avec le sol : distance entre le point et la surface du corps
  var FLOOR = [["L", "toe", 0.03], ["R", "toe", 0.03], ["L", "ankle", 0.06], ["R", "ankle", 0.06], ["L", "knee", 0.065], ["R", "knee", 0.065],
               ["LA", "hand", 0.03], ["RA", "hand", 0.03], ["LA", "el", 0.045], ["RA", "el", 0.045], ["pelvis", null, 0.12], ["LA", "sh", 0.09], ["RA", "sh", 0.09],
               ["L", "hip", 0.1], ["R", "hip", 0.1]];
  function target(fr, Rc) {
    var P = pts(fr, Rc), Lg = lens();
    var hm = mid(P.lHip, P.rHip), X = unit(sub(P.lHip, P.rHip));
    var shm = mid(P.lSh, P.rSh), up = unit(sub(shm, hm)), S = ortho(sub(P.lSh, P.rSh), up);
    var T = { pelvis: [0, 0, 0], neck: mul(up, Lg.shY), vis: {} };
    var vv = function (a, b) { return Math.min(a.v == null ? 1 : a.v, b.v == null ? 1 : b.v); };
    [["L", "l", 1], ["R", "r", -1]].forEach(function (z) {
      var s = z[0], c = z[1], hip = mul(X, z[2] * Lg.hipX);
      var knee = add(hip, mul(unit(sub(P[c + "Kn"], P[c + "Hip"])), Lg.thigh));
      var ankle = add(knee, mul(unit(sub(P[c + "An"], P[c + "Kn"])), Lg.shank));
      var toe = add(ankle, mul(unit(sub(P[c + "Toe"], P[c + "An"])), 0.18));
      T[s] = { hip: hip, knee: knee, ankle: ankle, toe: toe };
      T.vis[s] = { knee: vv(P[c + "Hip"], P[c + "Kn"]), ankle: vv(P[c + "Kn"], P[c + "An"]), toe: vv(P[c + "An"], P[c + "Toe"]) };
      var sh = add(T.neck, mul(S, z[2] * Lg.shX));
      var el = add(sh, mul(unit(sub(P[c + "El"], P[c + "Sh"])), Lg.upper));
      var hand = add(el, mul(unit(sub(P[c + "Wr"], P[c + "El"])), Lg.fore));
      T[s + "A"] = { sh: sh, el: el, hand: hand };
      T.vis[s + "A"] = { el: vv(P[c + "Sh"], P[c + "El"]), hand: vv(P[c + "El"], P[c + "Wr"]) };
    });
    var ear = mid(P.lEar, P.rEar);
    T.head = add(T.neck, mul(unit(sub(ear, shm)), 0.35));
    // Sol : le point le plus bas (moins l'épaisseur du corps) touche le sol
    var lo = 1e9;
    FLOOR.forEach(function (f) { var p = f[1] ? T[f[0]][f[1]] : T[f[0]]; lo = Math.min(lo, p[1] - f[2]); });
    var dy = -lo;
    (function shift(o) { for (var k in o) { if (k === "vis") continue; var v = o[k]; if (Array.isArray(v)) v[1] += dy; else if (v && typeof v === "object") shift(v); } })(T);
    T.up = up; T.X = X;
    return T;
  }

  /* ════════ Calage de la caméra : inclinaison du téléphone et orientation du corps ════════
     On cherche la rotation qui ramène la première image sur la position de départ choisie
     (tronc, bassin, épaules), en limitant l'inclinaison du téléphone à ± 12°. */
  function baseJoints(base) {
    var C = window.KineCreateur; if (!C || !window.KineAvatar) return null;
    var J = KineAvatar._joints(C.pose(base, C.blankP(base))); KineAvatar._fitEnd(); return J;
  }
  function calib(fr, base) {
    var B = baseJoints(base); if (!B) return mm(Ry(0), Rx(0));
    var bm = mid(B.L.hip, B.R.hip);
    var bv = [unit(sub(B.neck, bm)), unit(sub(B.L.hip, B.R.hip)), unit(sub(B.LA.sh, B.RA.sh)), unit(sub(bm, mid(B.L.ankle, B.R.ankle)))];
    var P = pts(fr), hm = mid(P.lHip, P.rHip);
    var cv = [unit(sub(mid(P.lSh, P.rSh), hm)), unit(sub(P.lHip, P.rHip)), unit(sub(P.lSh, P.rSh)), unit(sub(hm, mid(P.lAn, P.rAn)))];
    var W = [3, 1.5, 1, 0.6];
    function cost(pi, ro, ya) {
      var R = mm(Ry(ya), mm(Rz(ro), Rx(pi))), c = 0.0004 * (pi * pi + ro * ro);
      for (var i = 0; i < 4; i++) { var d = sub(mv(R, cv[i]), bv[i]); c += W[i] * dot(d, d); }
      return c;
    }
    var best = [1e9, 0, 0, 0];
    var LIM = 12;
    for (var ya = 0; ya < 360; ya += 6) for (var pi = -LIM; pi <= LIM; pi += 4) for (var ro = -LIM; ro <= LIM; ro += 4) { var c = cost(pi, ro, ya); if (c < best[0]) best = [c, pi, ro, ya]; }
    for (var st = 2; st >= 0.5; st /= 2) {
      var moved = true, guard = 0;
      while (moved && guard++ < 40) {
        moved = false;
        [[st, 0, 0], [-st, 0, 0], [0, st, 0], [0, -st, 0], [0, 0, st], [0, 0, -st]].forEach(function (d) {
          var p2 = clamp(best[1] + d[0], -LIM, LIM), r2 = clamp(best[2] + d[1], -LIM, LIM), y2 = best[3] + d[2] * 2, c2 = cost(p2, r2, y2);
          if (c2 < best[0] - 1e-9) { best = [c2, p2, r2, y2]; moved = true; }
        });
      }
    }
    var R = mm(Ry(best[3]), mm(Rz(best[2]), Rx(best[1])));
    R.info = { pitch: best[1], roll: best[2], yaw: best[3] };
    return R;
  }

  /* ════════ Ajustement des réglages du créateur sur le squelette filmé ════════ */
  var JW = [["L", "hip", 1], ["R", "hip", 1], ["L", "knee", 2], ["R", "knee", 2], ["L", "ankle", 2.5], ["R", "ankle", 2.5], ["L", "toe", 1], ["R", "toe", 1],
            ["LA", "sh", 1.5], ["RA", "sh", 1.5], ["LA", "el", 1.5], ["RA", "el", 1.5], ["LA", "hand", 2.5], ["RA", "hand", 2.5], ["neck", null, 1.5], ["head", null, 0.7]];
  function cost(J, T) {
    var c = 0, ox = J.pelvis[0] - T.pelvis[0], oz = J.pelvis[2] - T.pelvis[2];
    for (var f = 0; f < FLOOR.length; f++) { var q = FLOOR[f], y = (q[1] ? J[q[0]][q[1]] : J[q[0]])[1] - q[2] * 0.8; if (y < 0) c += 20 * y * y; }   // rien sous le sol
    c += 4 * Math.pow(J.pelvis[1] - T.pelvis[1], 2);
    for (var i = 0; i < JW.length; i++) {
      var j = JW[i], a = j[1] ? J[j[0]][j[1]] : J[j[0]], t = j[1] ? T[j[0]][j[1]] : T[j[0]];
      var v = T.vis[j[0]] && j[1] && T.vis[j[0]][j[1]] != null ? 0.25 + 0.75 * clamp(T.vis[j[0]][j[1]], 0, 1) : 1;
      var dx = a[0] - t[0] - ox, dy = a[1] - t[1], dz = a[2] - t[2] - oz;
      c += j[2] * v * (dx * dx + dy * dy + dz * dz);
    }
    return c;
  }
  function getP(P, path) { var o = P, ks = path.split("."); for (var i = 0; i < ks.length; i++) o = o[ks[i]]; return o; }
  function setP(P, path, v) { var o = P, ks = path.split("."); for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
  function params(P) {
    var L = [["tilt", 6, -90, 150], ["flex", 5, -40, 40], ["lat", 5, -40, 40], ["rot", 6, -60, 60], ["down", 0.04, -0.3, 0.8], ["fwd", 0.04, -0.8, 0.8], ["head", 6, -45, 45]];
    ["L", "R"].forEach(function (s) {
      if (P[s].free) L.push([s + ".hf", 8, -40, 140], [s + ".abd", 6, -25, 75], [s + ".rot", 8, -50, 50], [s + ".knee", 8, 0, 150]);
      else L.push([s + ".step", 0.04, -0.9, 0.9], [s + ".wide", 0.03, -0.15, 0.55], [s + ".heel", 6, -40, 75]);
    });
    ["LA", "RA"].forEach(function (s) { if (P[s].free) L.push([s + ".fl", 8, -60, 185], [s + ".ab", 8, -30, 185], [s + ".ro", 8, -90, 90], [s + ".el", 8, 0, 155]); });
    return L;
  }
  function evalP(base, P, T) { var J = KineAvatar._joints(KineCreateur.pose(base, P)); return J ? cost(J, T) : 1e9; }
  function fit(base, P0, T, budget) {
    var P = clone(P0), L = params(P), steps = L.map(function (p) { return p[1]; }), best = evalP(base, P, T), n = 0, max = budget || 2600;
    for (var round = 0; round < 8 && n < max; round++) {
      var improved = true;
      while (improved && n < max) {
        improved = false;
        for (var i = 0; i < L.length && n < max; i++) {
          var path = L[i][0], v0 = getP(P, path);
          for (var sgn = -1; sgn <= 1; sgn += 2) {
            var v1 = clamp(v0 + sgn * steps[i], L[i][2], L[i][3]); if (v1 === v0) continue;
            setP(P, path, v1); var c = evalP(base, P, T); n++;
            if (c < best - 1e-7) { best = c; v0 = v1; improved = true; break; }
            setP(P, path, v0);
          }
        }
      }
      steps = steps.map(function (s) { return s / 2; });
    }
    KineAvatar._fitEnd();
    return { P: P, err: Math.sqrt(best / 30), evals: n };
  }
  // Point de départ des bras et jambes libres : angles calculés directement, l'ajustement affine ensuite
  function limbInit(P, base, T) {
    var C = KineCreateur, bp = C.basePose(base), r = bp.pelvis.r;
    // bascule du bassin : celle qui aligne le tronc de Yass sur le tronc filmé
    var trunk = unit(sub(T.neck, T.pelvis)), sp = bp.spine || [0, 0, 0], bestT = 0, bc = -2;
    for (var t = -90; t <= 150; t += 2) {
      var M = mm(Ry(r[1]), mm(Rx(r[0] + t), Rz(r[2]))), u = mv(M, mv(mm(Ry(sp[2]), mm(Rx(sp[0]), Rz(sp[1]))), [0, 1, 0])), c = dot(u, trunk);
      if (c > bc) { bc = c; bestT = t; }
    }
    P.tilt = bestT;
    var Mp = mm(Ry(r[1]), mm(Rx(r[0] + bestT), Rz(r[2]))), Ms = mm(Mp, mm(Ry(sp[2]), mm(Rx(sp[0]), Rz(sp[1]))));
    ["L", "R"].forEach(function (s) {
      if (!P[s].free) return;
      var sg = s === "L" ? 1 : -1, d = mtv(Mp, unit(sub(T[s].knee, T[s].hip))), sh = mtv(Mp, unit(sub(T[s].ankle, T[s].knee)));
      var ph = Math.asin(clamp(d[0], -1, 1)), th = -Math.atan2(d[2], -d[1]);
      var q = mtv(Rz(deg(ph)), mtv(Rx(deg(th)), sh)), kn = Math.acos(clamp(-q[1], -1, 1)), ps = kn > 0.25 ? Math.atan2(-q[0], -q[2]) : 0;
      P[s].hf = clamp(deg(-th), -40, 140); P[s].abd = clamp(deg(ph) * sg, -25, 75); P[s].knee = clamp(deg(kn), 0, 150); P[s].rot = clamp(deg(ps) * sg, -50, 50);
    });
    ["LA", "RA"].forEach(function (s, i) {
      if (!P[s].free) return;
      var sg = i === 0 ? 1 : -1, d = mtv(Ms, unit(sub(T[s].el, T[s].sh))), f = mtv(Ms, unit(sub(T[s].hand, T[s].el)));
      var ph = Math.asin(clamp(d[0], -1, 1)), th = -Math.atan2(d[2], -d[1]);
      var q = mtv(Rz(deg(ph)), mtv(Rx(deg(th)), f)), el = Math.acos(clamp(-q[1], -1, 1)), ps = el > 0.25 ? Math.atan2(q[0], q[2]) : 0;
      P[s].fl = clamp(deg(-th), -60, 185); P[s].ab = clamp(deg(ph) * sg, -30, 185); P[s].el = clamp(deg(el), 0, 155); P[s].ro = clamp(deg(ps) * sg, -90, 90);
    });
    return P;
  }

  /* ════════ Lissage, répétitions, positions clés ════════ */
  function smoothFrames(F) {
    var n = F.length, out = [];
    for (var i = 0; i < n; i++) {
      var w = new Float32Array(132), tot = 0;
      for (var k = -2; k <= 2; k++) {
        var j = clamp(i + k, 0, n - 1), g = k === 0 ? 3 : Math.abs(k) === 1 ? 2 : 1;
        for (var q = 0; q < 132; q++) w[q] += F[j].w[q] * g;
        tot += g;
      }
      for (var q2 = 0; q2 < 132; q2++) w[q2] /= tot;
      out.push({ t: F[i].t, w: w });
    }
    return out;
  }
  var FEAT = [["L", "knee"], ["R", "knee"], ["L", "ankle"], ["R", "ankle"], ["LA", "el"], ["RA", "el"], ["LA", "hand"], ["RA", "hand"], ["neck"], ["head"], ["pelvis"]];
  function feat(T) {
    var o = [], c = T.pelvis;
    FEAT.forEach(function (f) { var p = f[1] ? T[f[0]][f[1]] : T[f[0]]; o.push(p[0] - c[0], p[1], p[2] - c[2]); });
    return o;
  }
  function dist(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]); return Math.sqrt(s / (a.length / 3)); }
  // Signal principal du mouvement (première composante) et découpage en répétitions
  function analyse(F, Rc) {
    var X = F.map(function (f) { return feat(target(f, Rc)); }), n = X.length, d = X[0].length;
    if (n < 6) return { s: X.map(function () { return 0; }), reps: [] };
    var mean = new Array(d).fill(0); X.forEach(function (x) { for (var i = 0; i < d; i++) mean[i] += x[i] / n; });
    var v = new Array(d).fill(0).map(function (_, i) { return Math.sin(i + 1); });
    for (var it = 0; it < 40; it++) {
      var nv = new Array(d).fill(0);
      X.forEach(function (x) { var pr = 0; for (var i = 0; i < d; i++) pr += (x[i] - mean[i]) * v[i]; for (var j = 0; j < d; j++) nv[j] += pr * (x[j] - mean[j]); });
      var l = Math.sqrt(nv.reduce(function (a, b) { return a + b * b; }, 0)) || 1; v = nv.map(function (q) { return q / l; });
    }
    var s = X.map(function (x) { var pr = 0; for (var i = 0; i < d; i++) pr += (x[i] - mean[i]) * v[i]; return pr; });
    var sm = s.map(function (_, i) { var a = 0, c = 0; for (var k = -3; k <= 3; k++) { var j = i + k; if (j >= 0 && j < n) { a += s[j]; c++; } } return a / c; });
    var sorted = sm.slice().sort(function (a, b) { return a - b; }), lo = sorted[Math.floor(n * 0.05)], hi = sorted[Math.floor(n * 0.95)], r = hi - lo;
    if (r < 0.04) return { s: sm, reps: [], lo: lo, hi: hi };
    // états avec hystérésis : 0 = bas, 1 = haut
    var st = [], cur = sm[0] > lo + r / 2 ? 1 : 0;
    sm.forEach(function (q) { if (cur === 0 && q > lo + 0.62 * r) cur = 1; else if (cur === 1 && q < lo + 0.38 * r) cur = 0; st.push(cur); });
    var runs = []; st.forEach(function (q, i) { if (!runs.length || runs[runs.length - 1].v !== q) runs.push({ v: q, a: i, b: i }); else runs[runs.length - 1].b = i; });
    var rest = runs[0].v, reps = [], T = function (i) { return F[i].t; }, lvl = rest ? hi : lo, near = function (i) { return Math.abs(sm[i] - lvl) < 0.14 * r; };
    for (var k = 0; k + 2 < runs.length; k += 2) {
      var r0 = runs[k], r2 = runs[k + 2]; if (r0.v !== rest) continue;
      // début : dernier instant encore au repos, un peu avant que le mouvement parte ; fin : retour au repos, un peu après
      var a = r0.b, b = r2.a;
      while (a > r0.a && !near(a)) a--;
      var a0 = a; while (a > r0.a && T(a0) - T(a - 1) < 0.2) a--;
      while (b < r2.b && !near(b)) b++;
      var b0 = b; while (b < r2.b && T(b + 1) - T(b0) < 0.2) b++;
      reps.push({ a: a, b: b });
    }
    return { s: sm, reps: reps, lo: lo, hi: hi, rest: rest };
  }
  function keyframes(Fs, Rc, a, b) {
    var Ts = []; for (var i = a; i <= b; i++) Ts.push(feat(target(Fs[i], Rc)));
    var f0 = Ts[0], dmax = -1, ib = 0;
    Ts.forEach(function (x, i) { var q = dist(x, f0); if (q > dmax) { dmax = q; ib = i; } });
    var h0 = ib, h1 = ib;
    while (h0 > 0 && dist(Ts[h0 - 1], f0) > dmax * 0.88) h0--;
    while (h1 < Ts.length - 1 && dist(Ts[h1 + 1], f0) > dmax * 0.88) h1++;
    var t = function (i) { return Fs[a + i].t; }, r5 = function (v) { return Math.round(v * 2) / 2; };
    return { a: a, b: a + ib, amp: dmax,
             tempo: { go: clamp(r5(t(h0) - t(0)), 0.5, 5), hold: clamp(r5(t(h1) - t(h0)), 0, 10), back: clamp(r5(t(Ts.length - 1) - t(h1)), 0.5, 6) } };
  }
  // Jambes et bras libres ou en appui (identiques au départ et à l'arrivée)
  function supports(base, Ta, Tb) {
    var B = KineCreateur.BASES[base], P = KineCreateur.blankP(base), lift = {};
    ["L", "R"].forEach(function (s) { lift[s] = Math.max(Math.min(Ta[s].ankle[1], Ta[s].toe[1] + 0.06), Math.min(Tb[s].ankle[1], Tb[s].toe[1] + 0.06)); });
    if (B.legsIK) {
      ["L", "R"].forEach(function (s) { P[s].free = lift[s] > 0.17; });
      if (base === "stand" && P.L.free && P.R.free) P[lift.L < lift.R ? "L" : "R"].free = false;
    }
    // bras en appui sur la main ; libres s'ils se lèvent ou si l'appui se fait sur l'avant-bras
    if (!B.armsFree) ["LA", "RA"].forEach(function (s) { P[s].free = Math.max(Ta[s].hand[1], Tb[s].hand[1]) > 0.16 || Math.min(Ta[s].el[1], Tb[s].el[1]) < 0.1; });
    return P;
  }
  // Plusieurs points de départ (bassin plus ou moins basculé) : on garde le meilleur, puis on affine
  function fitStart(base, P0, T, budget) {
    var init = limbInit(clone(P0), base, T), best = null;
    [0, -50, 50, 100, -100].forEach(function (dt) {
      var P = clone(init); P.tilt = clamp(init.tilt + dt, -90, 150);
      var r = fit(base, P, T, budget || 450); if (!best || r.err < best.err) best = r;
    });
    return best;
  }
  // Position de départ la plus probable, d'après la première image : tronc, hauteur du bassin, appuis
  function guessBase(Fs, a) {
    var T = target(Fs[a], null), hy = T.pelvis[1], up = unit(sub(T.neck, T.pelvis)), X = T.X, fwd = unit(cross(X, up));
    var kneeLo = Math.min(T.L.knee[1], T.R.knee[1]), handLo = Math.min(T.LA.hand[1], T.RA.hand[1]), elLo = Math.min(T.LA.el[1], T.RA.el[1]);
    var why = { tronc: Math.round(deg(Math.acos(clamp(up[1], -1, 1)))), bassin: Math.round(hy * 100), genou: Math.round(kneeLo * 100) };
    var base;
    if (Math.abs(X[1]) > 0.65) base = "side";
    else if (up[1] > 0.6) base = hy > 0.72 ? "stand" : kneeLo < 0.1 ? "kneel" : "seat";
    else if (fwd[1] > 0.45) base = "supine";
    else if ((handLo < 0.13 || elLo < 0.1) && kneeLo > 0.095 && hy > 0.14) base = "plank";
    else if (kneeLo < 0.1 && handLo < 0.13 && hy > 0.27) base = "quad";
    else if (hy < 0.27) base = "prone";
    else base = up[1] > 0.3 ? "kneel" : "quad";
    return { base: base, why: why };
  }
  // Un exercice complet pour le créateur, à partir des images filmées et de la répétition choisie
  function convert(frames, base, seg, extra) {
    var Fs = smoothFrames(frames), guess = null;
    if (!base || base === "auto") { guess = guessBase(Fs, seg.a); base = guess.base; }
    var Rc = calib(Fs[seg.a], base), K = keyframes(Fs, Rc, seg.a, seg.b);
    var Ta = target(Fs[K.a], Rc), Tb = target(Fs[K.b], Rc), P0 = supports(base, Ta, Tb);
    var fa = fitStart(base, P0, Ta); fa = fit(base, fa.P, Ta);
    var Pb0 = clone(fa.P); ["L", "R", "LA", "RA"].forEach(function (s) { if (P0[s].free) Object.assign(Pb0[s], limbInit(clone(P0), base, Tb)[s]); });
    var fb = fit(base, Pb0, Tb);
    // chaque position peut aussi partir de l'autre : on garde la meilleure
    var fa2 = fit(base, Object.assign(clone(fb.P), { L: clone(fb.P.L), R: clone(fb.P.R) }), Ta); if (fa2.err < fa.err) fa = fa2;
    var fb2 = fit(base, clone(fa.P), Tb); if (fb2.err < fb.err) fb = fb2;
    // vue de Yass : du même côté que la caméra
    var to = mv(Rc, [0, 0, 1]);
    var x = { base: base, props: [], cam: Math.atan2(to[0], to[2]), poses: { a: fa.P, b: fb.P }, tempo: K.tempo, mode: "reps", seconds: 30, sides: "none",
              words: { go: "On y va", back: "On revient" }, src: "camera" };
    if (extra) Object.assign(x, extra);
    return { x: x, err: [fa.err, fb.err], key: K, cal: Rc.info, guess: guess };
  }

  /* ════════ Détecteur (le même que pour le bilan) ════════ */
  var detP = null;
  function detector() {
    if (detP) return detP;
    detP = import(new URL(BASE_DIR + "vision_bundle.mjs", location.href).href).then(function (Vb) {
      return Vb.FilesetResolver.forVisionTasks(new URL(BASE_DIR + "wasm", location.href).href).then(function (files) {
        var opts = function (dlg) { return { baseOptions: { modelAssetPath: new URL(BASE_DIR + "pose_landmarker_lite.task", location.href).href, delegate: dlg },
                                              runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }; };
        return Vb.PoseLandmarker.createFromOptions(files, opts("GPU")).catch(function () { return Vb.PoseLandmarker.createFromOptions(files, opts("CPU")); });
      });
    });
    detP.catch(function () { detP = null; });
    return detP;
  }

  /* ════════ Écrans : préparer, filmer, choisir la répétition ════════ */
  var BASE_LABEL = { stand: "Debout", seat: "Assis", kneel: "À genoux", quad: "À quatre pattes", supine: "Couché sur le dos", prone: "Couché sur le ventre", side: "Couché sur le côté", plank: "En planche" };
  var BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]];
  var C = null;
  function fresh() { return { frames: [], facing: "user", extra: { props: [], loadKind: "", load: "both", band: "", bandArms: "both" }, base: "auto", sel: null, an: null, ri: 0 }; }
  function root() {
    var el = $("kcp"); if (!el) { el = document.createElement("div"); el.id = "kcp"; el.className = "kcp"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Créer un exercice en me filmant"); document.body.appendChild(el); }
    el.classList.add("open"); return el;
  }
  function stopCam() {
    if (!C) return;
    if (C.raf) cancelAnimationFrame(C.raf); C.raf = 0;
    if (C.stream) { C.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); C.stream = null; }
    if (C.wake) { try { C.wake.release(); } catch (e) {} C.wake = null; }
    if (C.play) { clearTimeout(C.play); C.play = 0; }
  }
  function close() { stopCam(); var el = $("kcp"); if (el) { el.classList.remove("open"); el.innerHTML = ""; } C = null; }
  function say(t) { try { if (typeof speak === "function") speak(t, { prio: 2, now: true }); } catch (e) {} }

  function chip(group, key, label, on) { return "<button type='button' class='kb-chip" + (on ? " on" : "") + "' onclick='KineCapture.pick(\"" + group + "\",\"" + key + "\")'>" + (on ? "✓ " : "") + label + "</button>"; }
  function intro() {
    var e = C.extra, el = root();
    el.innerHTML = "<div class='kcp-page'><button class='kf-back' onclick='KineCapture.close()' aria-label='Retour'>←</button>" +
      "<div><div class='kf-h1'>Créer un exercice en me filmant</div><div class='kf-sub'>Fais le mouvement devant le téléphone : Yass l'apprend, tu ajustes, tu publies.</div></div>" +
      "<div class='kcp-steps'><div><b>1</b><span>Pose le téléphone debout, à hauteur de hanche, à 2 ou 3 mètres. On doit te voir de la tête aux pieds.</span></div>" +
        "<div><b>2</b><span>Mets-toi <b>de profil</b> pour les exercices au sol et les flexions, <b>de face</b> pour les écartés et les élévations sur le côté.</span></div>" +
        "<div><b>3</b><span>Fais 3 à 5 répétitions lentes, avec une pause en bas et en haut. Tu choisiras la meilleure ensuite.</span></div></div>" +
      "<div class='kf-phase'>Matériel</div>" +
      "<div class='kc-gear'>" + [["chair", "Chaise"], ["bench", "Banc"], ["step", "Step"], ["wall", "Mur devant"], ["wallBack", "Mur derrière"]].map(function (p) { return chip("prop", p[0], p[1], e.props.indexOf(p[0]) >= 0); }).join("") + "</div>" +
      "<div class='kc-gear'>" + [["dumbbell", "Haltères"], ["kettlebell", "Kettlebell"], ["bottle", "Bouteilles d'eau"]].map(function (p) { return chip("load", p[0], p[1], e.loadKind === p[0]); }).join("") + "</div>" +
      (e.loadKind ? "<div class='kc-seg kcp-seg'>" + [["both", "Deux mains"], ["L", "Main gauche"], ["R", "Main droite"]].map(function (o) { return "<button type='button' class='" + (e.load === o[0] ? "on" : "") + "' onclick='KineCapture.pick(\"loadSide\",\"" + o[0] + "\")'>" + o[1] + "</button>"; }).join("") + "</div>" : "") +
      "<label class='ko-f'><span>Élastique</span><select onchange='KineCapture.pick(\"band\",this.value)'>" + [["", "Pas d'élastique"], ["hands", "Entre les mains"], ["feet", "Sous les pieds, tenu en main"], ["knees", "Autour des genoux"], ["ankles", "Autour des chevilles"], ["front", "Accroché devant"], ["back", "Accroché derrière"], ["high", "Accroché en haut"]].map(function (o) {
        return "<option value='" + o[0] + "'" + (e.band === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
      (/feet|front|back|high/.test(e.band) ? "<div class='kc-seg kcp-seg'>" + [["both", "Deux mains"], ["L", "Main gauche"], ["R", "Main droite"]].map(function (o) { return "<button type='button' class='" + (e.bandArms === o[0] ? "on" : "") + "' onclick='KineCapture.pick(\"bandArms\",\"" + o[0] + "\")'>" + o[1] + "</button>"; }).join("") + "</div>" : "") +
      "<p class='kcp-note'>La caméra ne voit pas le matériel : Yass le prendra tout seul, au bon endroit. Rien n'est enregistré ni envoyé : seule la position de Yass est gardée.</p>" +
      "<p class='kc-err' id='kcp-err' role='alert'></p></div>" +
      "<div class='kf-sheet-foot'><button class='seq-btn-main' id='kcp-go' onclick='KineCapture.camera()'>Ouvrir la caméra</button></div>";
  }
  function pick(group, key) {
    var e = C.extra;
    if (group === "prop") { var i = e.props.indexOf(key); if (i >= 0) e.props.splice(i, 1); else { e.props.push(key); if (key === "chair") e.props = e.props.filter(function (p) { return p !== "bench"; }); if (key === "bench") e.props = e.props.filter(function (p) { return p !== "chair"; }); } }
    else if (group === "load") e.loadKind = e.loadKind === key ? "" : key;
    else if (group === "loadSide") e.load = key;
    else if (group === "band") e.band = key;
    else if (group === "bandArms") e.bandArms = key;
    intro();
  }

  /* ── Filmer ── */
  function camera() {
    var err = $("kcp-err"), go = $("kcp-go");
    function fail(t) { if (err) err.textContent = t; if (go) { go.disabled = false; go.textContent = "Réessayer"; } }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { fail("Ce téléphone ne permet pas d'utiliser la caméra depuis l'appli."); return; }
    if (go) { go.disabled = true; go.textContent = "Préparation…"; }
    navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: C.facing, width: { ideal: 640 }, height: { ideal: 480 } } }).then(function (stream) {
      C.stream = stream; recView();
      return detector().then(function (det) { if (C) { C.det = det; msg("Place-toi pour qu'on te voie en entier."); } })
        .catch(function () { msg("L'outil d'analyse n'a pas pu se charger. Vérifie la connexion, puis réessaie.", "bad"); });
    }).catch(function (e) {
      fail(e && e.name === "NotAllowedError" ? "L'accès à la caméra est refusé. Autorise-le dans les réglages du téléphone, puis réessaie." : "La caméra n'a pas pu s'ouvrir. Ferme les autres applis qui l'utilisent, puis réessaie.");
    });
  }
  function msg(t, cls) { var m = $("kcp-msg"); if (m) { m.textContent = t; m.className = "kcp-msg" + (cls ? " " + cls : ""); } }
  function inFrame(n) {   // tête et pieds visibles dans l'image
    var ok = function (i) { return n[i * 3 + 2] > 0.5 && n[i * 3] > 0.01 && n[i * 3] < 0.99 && n[i * 3 + 1] > 0.01 && n[i * 3 + 1] < 0.99; };
    return ok(0) && (ok(27) || ok(31)) && (ok(28) || ok(32));
  }
  function recView() {
    var el = root();
    el.innerHTML = "<div class='kcp-stage'><video id='kcp-video' playsinline muted autoplay></video><canvas id='kcp-cv'></canvas>" +
      "<div class='kcp-top'><button class='kcp-round' onclick='KineCapture.back()' aria-label='Retour'>✕</button><div class='kcp-time' id='kcp-time'></div>" +
      "<button class='kcp-round' onclick='KineCapture.flip()' aria-label='Changer de caméra'>⟲</button></div>" +
      "<div class='kcp-msg' id='kcp-msg'>Chargement de l'analyse…</div>" +
      "<div class='kcp-bar'><button class='kcp-rec' id='kcp-rec' onclick='KineCapture.rec()' aria-label='Filmer'><i></i></button></div></div>";
    var v = $("kcp-video"); v.srcObject = C.stream; v.classList.toggle("mir", C.facing === "user");
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { if (C) C.wake = w; }).catch(function () {}); } catch (e) {}
    var cv = $("kcp-cv"), ctx = cv.getContext("2d"), th = document.createElement("canvas"), tctx = th.getContext("2d"), lastT = -1, lastOk = 0;
    function loop() {
      if (!C || !$("kcp-video")) return;
      C.raf = requestAnimationFrame(loop);
      var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      if (!C.det || v.readyState < 2 || !v.videoWidth || v.currentTime === lastT) return;
      lastT = v.currentTime;
      var res; try { res = C.det.detectForVideo(v, performance.now()); } catch (e) { return; }
      var lm = res && res.landmarks && res.landmarks[0], wl = res && res.worldLandmarks && res.worldLandmarks[0];
      var box = fitBox(W, H, v.videoWidth, v.videoHeight);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var n = null;
      if (lm) { n = new Float32Array(99); for (var i = 0; i < 33; i++) { n[i * 3] = lm[i].x; n[i * 3 + 1] = lm[i].y; n[i * 3 + 2] = lm[i].visibility == null ? 1 : lm[i].visibility; } drawSk(ctx, n, box, C.facing === "user"); }
      var now = performance.now(), full = n && inFrame(n);
      if (full) lastOk = now;
      if (C.rec && C.rec.on && now >= C.rec.t0) {
        var t = (now - C.rec.t0) / 1000;
        if (lm && wl) {
          var w = new Float32Array(132); for (var j = 0; j < 33; j++) { w[j * 4] = wl[j].x; w[j * 4 + 1] = wl[j].y; w[j * 4 + 2] = wl[j].z; w[j * 4 + 3] = lm[j].visibility == null ? 1 : lm[j].visibility; }
          var tw = 180, thh = Math.round(tw * v.videoHeight / v.videoWidth); if (th.width !== tw) { th.width = tw; th.height = thh; }
          tctx.drawImage(v, 0, 0, tw, thh);
          C.frames.push({ t: t, w: w, n: n, img: th.toDataURL("image/jpeg", 0.6) });
        }
        var tl = $("kcp-time"); if (tl) tl.textContent = Math.floor(t) + " s / " + MAX_S + " s";
        if (t >= MAX_S) stopRec();
      } else if (!C.rec || !C.rec.on) {
        if (!n) msg("Je ne te vois pas encore. Place-toi face au téléphone.");
        else if (!full) msg("Recule un peu : on doit voir ta tête et tes pieds.", "warn");
        else msg("C'est bon, je te vois en entier. Touche le bouton rouge pour filmer.", "ok");
      }
      if (C.rec && C.rec.on && now - lastOk > 1500 && now >= C.rec.t0) msg("Je ne vois plus tes pieds ou ta tête. Recule un peu.", "warn");
    }
    loop();
  }
  function fitBox(W, H, vw, vh) { var s = Math.min(W / vw, H / vh), w = vw * s, h = vh * s; return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h }; }
  function drawSk(ctx, n, box, mir) {
    var pt = function (i) { return [box.x + (mir ? 1 - n[i * 3] : n[i * 3]) * box.w, box.y + n[i * 3 + 1] * box.h]; };
    ctx.lineCap = "round"; ctx.lineWidth = Math.max(3, box.w / 110); ctx.strokeStyle = "rgba(255,255,255,.9)";
    BONES.forEach(function (b) { if (n[b[0] * 3 + 2] < 0.35 || n[b[1] * 3 + 2] < 0.35) return; var p = pt(b[0]), q = pt(b[1]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); });
    [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(function (i) {
      if (n[i * 3 + 2] < 0.35) return; var p = pt(i);
      ctx.fillStyle = i >= 23 ? "#22D3EE" : "#4FACFE"; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(3.5, box.w / 80), 0, Math.PI * 2); ctx.fill();
    });
  }
  function rec() {
    if (!C || !C.det) return;
    if (C.rec && C.rec.on) { stopRec(); return; }
    C.frames = []; C.rec = { on: true, t0: performance.now() + 3000 };
    var b = $("kcp-rec"); if (b) b.classList.add("on");
    var k = 3; (function tick() { if (!C || !C.rec || !C.rec.on) return; if (k > 0) { msg(String(k), "big"); say(String(k)); k--; setTimeout(tick, 1000); } else { msg("Vas-y, fais tes répétitions. Touche le bouton pour arrêter.", "rec"); say("C'est parti"); } })();
  }
  function stopRec() {
    if (!C || !C.rec) return;
    C.rec.on = false; var b = $("kcp-rec"); if (b) b.classList.remove("on");
    if (C.frames.length < 20) { msg("C'est un peu court : filme au moins 3 répétitions.", "warn"); return; }
    stopCam(); trim();
  }

  /* ── Choisir la répétition ── */
  var imgs = {};
  function frameImg(i) { var f = C.frames[i]; if (!f.im) { f.im = new Image(); f.im.src = f.img; } return f.im; }
  function trim() {
    var F = C.frames;
    if (!C.an) { C.an = analyse(smoothFrames(F), null); C.ri = Math.floor((C.an.reps.length - 1) / 2); }
    var R = C.an.reps;
    if (!C.sel) C.sel = R.length ? { a: R[Math.max(0, C.ri)].a, b: R[Math.max(0, C.ri)].b } : { a: 0, b: F.length - 1 };
    var g = guessBase(smoothFrames(F.slice(C.sel.a, C.sel.a + 5)), 0);
    var el = root();
    el.innerHTML = "<div class='kcp-page'><button class='kf-back' onclick='KineCapture.retake()' aria-label='Refilmer'>←</button>" +
      "<div><div class='kf-h1'>Choisis la répétition</div><div class='kf-sub'>" + (R.length ? R.length + " répétition" + (R.length > 1 ? "s" : "") + " trouvée" + (R.length > 1 ? "s" : "") + ". Garde la plus propre, ajuste le début et la fin si besoin." : "Je n'ai pas trouvé de répétition nette : règle le début et la fin à la main.") + "</div></div>" +
      "<div class='kcp-view'><canvas id='kcp-fv'></canvas></div>" +
      "<canvas id='kcp-graph' class='kcp-graph'></canvas>" +
      (R.length > 1 ? "<div class='kcp-nav'><button onclick='KineCapture.rep(-1)' aria-label='Répétition précédente'>‹</button><span>Répétition " + (C.ri + 1) + " sur " + R.length + "</span><button onclick='KineCapture.rep(1)' aria-label='Répétition suivante'>›</button></div>" : "") +
      "<label class='kcr-sl'><span>Début<b id='kcp-va'></b></span><input type='range' id='kcp-a' min='0' max='" + (F.length - 1) + "' value='" + C.sel.a + "' oninput='KineCapture.cut(\"a\",this.value)'></label>" +
      "<label class='kcr-sl'><span>Fin<b id='kcp-vb'></b></span><input type='range' id='kcp-b' min='0' max='" + (F.length - 1) + "' value='" + C.sel.b + "' oninput='KineCapture.cut(\"b\",this.value)'></label>" +
      "<label class='ko-f'><span>Position de départ</span><select id='kcp-base' onchange='KineCapture.setBase(this.value)'><option value='auto'>Automatique : " + esc(BASE_LABEL[g.base].toLowerCase()) + "</option>" +
        Object.keys(BASE_LABEL).map(function (k) { return "<option value='" + k + "'" + (C.base === k ? " selected" : "") + ">" + BASE_LABEL[k] + "</option>"; }).join("") + "</select></label>" +
      "<p class='kc-err' id='kcp-err' role='alert'></p></div>" +
      "<div class='kf-sheet-foot kcp-foot'><button class='seq-btn-secondary' onclick='KineCapture.retake()'>Refilmer</button><button class='seq-btn-main' id='kcp-learn' onclick='KineCapture.learn()'>Yass apprend ce mouvement</button></div>";
    labels(); graph(); playSel();
  }
  function labels() { var F = C.frames, a = $("kcp-va"), b = $("kcp-vb"); if (a) a.textContent = F[C.sel.a].t.toFixed(1).replace(".", ",") + " s"; if (b) b.textContent = F[C.sel.b].t.toFixed(1).replace(".", ",") + " s"; }
  function graph(head) {
    var cv = $("kcp-graph"); if (!cv) return;
    var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var s = C.an.s, n = s.length, lo = Math.min.apply(null, s), hi = Math.max.apply(null, s), r = hi - lo || 1, X = function (i) { return i / Math.max(1, n - 1) * W; }, Y = function (v) { return H - 6 - (v - lo) / r * (H - 12); };
    C.an.reps.forEach(function (q, k) { c.fillStyle = k % 2 ? "rgba(79,172,254,.08)" : "rgba(79,172,254,.14)"; c.fillRect(X(q.a), 0, X(q.b) - X(q.a), H); });
    c.fillStyle = "rgba(34,211,238,.28)"; c.fillRect(X(C.sel.a), 0, X(C.sel.b) - X(C.sel.a), H);
    c.strokeStyle = "#4FACFE"; c.lineWidth = 2; c.beginPath(); s.forEach(function (v, i) { if (i) c.lineTo(X(i), Y(v)); else c.moveTo(X(i), Y(v)); }); c.stroke();
    c.fillStyle = "#22D3EE"; [C.sel.a, C.sel.b].forEach(function (i) { c.fillRect(X(i) - 1.5, 0, 3, H); });
    if (head != null) { c.fillStyle = "#fff"; c.fillRect(X(head) - 1, 0, 2, H); }
  }
  function showFrame(i) {
    var cv = $("kcp-fv"); if (!cv) return;
    var f = C.frames[i], im = frameImg(i), W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    var draw = function () {
      var box = fitBox(W, H, im.naturalWidth || 4, im.naturalHeight || 3), mir = C.facing === "user";
      c.save(); if (mir) { c.translate(box.x * 2 + box.w, 0); c.scale(-1, 1); } c.drawImage(im, box.x, box.y, box.w, box.h); c.restore();
      if (f.n) drawSk(c, f.n, box, mir);
    };
    if (im.complete && im.naturalWidth) draw(); else im.onload = function () { if ($("kcp-fv")) draw(); };
  }
  function playSel() {
    if (C.play) clearTimeout(C.play);
    var i = C.sel.a;
    (function step() {
      if (!C || !$("kcp-fv")) return;
      showFrame(i); graph(i);
      var nx = i + 1 > C.sel.b ? C.sel.a : i + 1, dt = nx === C.sel.a ? 700 : Math.max(16, (C.frames[nx].t - C.frames[i].t) * 1000);
      i = nx; C.play = setTimeout(step, dt);
    })();
  }
  function cut(k, v) {
    v = +v; var F = C.frames;
    if (k === "a") C.sel.a = Math.min(v, C.sel.b - 5); else C.sel.b = Math.max(v, C.sel.a + 5);
    C.sel.a = clamp(C.sel.a, 0, F.length - 6); C.sel.b = clamp(C.sel.b, 5, F.length - 1);
    var ia = $("kcp-a"), ib = $("kcp-b"); if (ia) ia.value = C.sel.a; if (ib) ib.value = C.sel.b;
    labels(); graph(); if (C.play) clearTimeout(C.play);
    showFrame(k === "a" ? C.sel.a : C.sel.b);
    clearTimeout(C.resume); C.resume = setTimeout(playSel, 900);
  }
  function rep(d) { var R = C.an.reps; if (!R.length) return; C.ri = (C.ri + d + R.length) % R.length; C.sel = { a: R[C.ri].a, b: R[C.ri].b }; trim(); }
  function retake() { if (C.play) clearTimeout(C.play); var keep = C.extra, f = C.facing; C = fresh(); C.extra = keep; C.facing = f; camera(); }

  /* ── Yass apprend : conversion, matériel, puis le créateur ── */
  function whenThree(cb, n) { if (window.THREE) return cb(); if ((n || 0) > 100) return cb(new Error("3d")); setTimeout(function () { whenThree(cb, (n || 0) + 1); }, 100); }
  function learn() {
    var b = $("kcp-learn"); if (b) { b.disabled = true; b.textContent = "Yass apprend le mouvement…"; }
    if (C.play) clearTimeout(C.play);
    var holder = document.createElement("div"); holder.style.cssText = "position:fixed;left:-9999px;top:0;width:10px;height:10px"; document.body.appendChild(holder);
    try { if (window.KineAvatar) KineAvatar.show(holder, "Squat bilatéral"); } catch (e) {}
    whenThree(function (err) {
      setTimeout(function () {
        try { KineAvatar.hide(); } catch (e) {} holder.remove();
        if (err) { var m = $("kcp-err"); if (m) m.textContent = "Yass n'a pas pu se charger. Vérifie la connexion, puis réessaie."; if (b) { b.disabled = false; b.textContent = "Yass apprend ce mouvement"; } return; }
        var out;
        try { out = convert(C.frames, C.base, C.sel); } catch (e) {
          var m2 = $("kcp-err"); if (m2) m2.textContent = "Le mouvement n'a pas pu être calculé. Essaie une autre répétition ou refilme."; if (b) { b.disabled = false; b.textContent = "Yass apprend ce mouvement"; }
          if (window.console) console.error(e); return;
        }
        var x = gear(out.x, C.extra);
        close();
        KineCreateur.openWith(x);
      }, 60);
    });
  }
  // Matériel choisi : accessoires placés là où le corps s'appuie, charge, élastique
  function gear(x, e) {
    var J = KineAvatar._joints(KineCreateur.pose(x.base, x.poses.a)); KineAvatar._fitEnd();
    x.props = e.props.slice();
    if (x.base === "seat" && x.props.indexOf("bench") < 0 && x.props.indexOf("chair") < 0) x.props.push("chair");
    if (x.props.indexOf("bench") >= 0 && J) {
      // le banc va sous le point d'appui surélevé le plus bas (bassin assis, haut du dos, pied arrière…)
      var cand = [[J.pelvis, 0.12], [mid(J.LA.sh, J.RA.sh), 0.1], [J.L.ankle, 0.08], [J.R.ankle, 0.08], [J.LA.hand, 0.04], [J.RA.hand, 0.04]], bestP = null;
      cand.forEach(function (q) { var h = q[0][1] - q[1]; if (h > 0.25 && h < 0.7 && (!bestP || h < bestP[1])) bestP = [q[0], h]; });
      var pz = bestP ? bestP[0][2] : J.pelvis[2] - 0.1;
      x.bench = { x: 0, z: Math.round(pz * 100) / 100, along: "x" };
    }
    if (x.props.indexOf("step") >= 0 && J) {
      var up = J.L.ankle[1] > J.R.ankle[1] ? J.L : J.R;
      x.stepAt = up.ankle[1] > 0.17 ? { x: Math.round(up.ankle[0] * 100) / 100, z: Math.round((up.ankle[2] + 0.06) * 100) / 100 } : { x: 0, z: 0.42 };
    }
    if (e.loadKind) { x.load = e.load || "both"; x.loadKind = e.loadKind; }
    if (e.band) {
      x.band = { kind: e.band, arms: e.bandArms || "both", h: 1 };
      if (J && /front|back|high/.test(e.band)) x.band.h = Math.round(clamp((J.LA.hand[1] + J.RA.hand[1]) / 2, 0.1, 2.1) * 20) / 20;
    }
    return x;
  }

  return { open: function () { if (!(window.fbUser && fbUser.isAdmin)) { if (window.KineOfficiel) KineOfficiel.open(); return; } C = fresh(); intro(); },
           close: close, pick: pick, camera: camera, rec: rec, flip: function () { stopCam(); C.facing = C.facing === "user" ? "environment" : "user"; camera(); },
           back: function () { stopCam(); C.rec = null; intro(); }, cut: cut, rep: rep, retake: retake, learn: learn,
           setBase: function (v) { C.base = v; },
           _convert: convert, _analyse: analyse, _target: target, _calib: calib, _smooth: smoothFrames, _gear: gear, _guess: guessBase, detector: detector,
           _state: function () { return C; },
           _load: function (frames, facing) { C = fresh(); C.frames = frames; C.facing = facing || "environment"; trim(); } };
})();
window.KineCapture = KineCapture;
