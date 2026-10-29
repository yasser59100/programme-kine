// Enregistrements d'accéléromètre simulés (60 Hz) pour le test de saut : immobile, puis sauts (temps de vol tf, contact tc)
window.sautSim = function (jumps, opt) {
  opt = opt || {}; var hz = 60, dt = 1 / hz, rows = [], t = 10, G = 9.81, s = 1;
  var rnd = function () { s = (s * 16807) % 2147483647; return (s / 2147483647 - 0.5) * 0.4; };
  var push = function (a) { rows.push([t, a + rnd()]); t += dt; };
  var hold = function (sec) { for (var k = 0; k < sec * hz; k++) push(G); };
  hold(opt.still || 1.6);
  jumps.forEach(function (j, idx) {
    var k;
    if (!j.rebound || idx === 0) { for (k = 0; k < 0.25 * hz; k++) push(G - 5 * Math.sin(Math.PI * k / (0.25 * hz))); for (k = 0; k < 0.2 * hz; k++) push(G + 12 * Math.sin(Math.PI * k / (0.2 * hz))); }
    var up = t; while (t < up + j.tf) push(0.2);
    var tc = j.tc || 0.6; for (k = 0; k < tc * hz; k++) push(G + 25 * Math.sin(Math.PI * k / (tc * hz)));
  });
  hold(2);
  return rows;
};
