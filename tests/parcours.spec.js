// Solidité des parcours de rééducation : intégrité des 35 parcours, règles de passage d'étape dans les cas limites,
// cohérence entre le texte d'un critère et la règle réellement appliquée. Lancé par GitHub à chaque envoi.
const { test, expect } = require("@playwright/test");

async function ouvrir(page) {
  await page.addInitScript(() => {
    localStorage.setItem("kf-onboarded", "1"); localStorage.setItem("kf-install-never", "1");
    localStorage.setItem("kf-tour-v2", "1"); sessionStorage.setItem("kf-ressenti-later", "1");
  });
  await page.goto("index.html");
  await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
  await page.waitForFunction(() => window.KineParcours && window.KineBiblio, null, { timeout: 15000 });
}

test("parcours : structure, exercices, mesures, sources et critères de chacun des parcours", async ({ page }) => {
  await ouvrir(page);
  const r = await page.evaluate(() => {
    const KP = KineParcours, issues = [], add = (pid, msg) => issues.push(pid + " : " + msg);
    KP.ORDER.forEach(pid => {
      const p = KP.P[pid]; if (!p) { add(pid, "absent de P"); return; }
      ["nom", "long", "zone", "mes", "etapes", "src"].forEach(k => { if (!p[k] || (Array.isArray(p[k]) && !p[k].length)) add(pid, "champ vide " + k); });
      (p.src || []).forEach(s => { if (!KP.SRC[s]) add(pid, "source inconnue " + s); });
      (p.mes || []).forEach(m => { if (!KP.M[m]) add(pid, "mesure inconnue " + m); });
      if (p.key && p.mes.indexOf(p.key.m) < 0) add(pid, "mesure clé absente du parcours " + p.key.m);
      if (p.ref && !KineBiblio.find(p.ref)) add(pid, "exercice de référence introuvable « " + p.ref + " »");
      const seen = {};
      p.etapes.forEach((e, i) => {
        const tag = "étape " + (i + 1);
        if (!e.but) add(pid, tag + " sans but");
        if (!e.obj || !e.obj.length) add(pid, tag + " sans objectif");
        if (!e.exos || !e.exos.length) add(pid, tag + " sans exercice");
        const ids = {};
        (e.obj || []).forEach(o => {
          if (!o.id || !o.t || !o.p) add(pid, tag + " objectif incomplet " + (o.id || "?"));
          if (o.id) { if (ids[o.id] || seen[o.id]) add(pid, tag + " id d'objectif en double " + o.id); ids[o.id] = seen[o.id] = 1; }
          const a = o.a; if (!a) return;
          if (a.m) {
            if (!KP.M[a.m]) add(pid, tag + " " + o.id + " mesure inconnue " + a.m);
            else {
              if (p.mes.indexOf(a.m) < 0) add(pid, tag + " " + o.id + " mesure " + a.m + " absente du parcours (jamais évaluable)");
              if ((a.lsi != null || a.diff != null) && !KP.M[a.m].s) add(pid, tag + " " + o.id + " symétrie sur une mesure non bilatérale " + a.m);
            }
          } else if (a.hops != null) {
            (a.need || []).forEach(h => { if (p.mes.indexOf(h) < 0) add(pid, tag + " " + o.id + " test de saut exigé absent du parcours " + h); });
            if (!a.need && !["hop1", "hop3", "hop6"].some(h => p.mes.indexOf(h) >= 0)) add(pid, tag + " " + o.id + " aucun test de saut dans le parcours");
          } else if (!["j", "dou"].some(k => a[k] != null)) add(pid, tag + " " + o.id + " règle non reconnue");
        });
        const names = {};
        (e.exos || []).forEach(x => {
          const n = typeof x === "string" ? x : x.n;
          if (names[n]) add(pid, tag + " exercice en double « " + n + " »"); names[n] = 1;
          if (!KineBiblio.find(n)) add(pid, tag + " « " + n + " » introuvable dans la bibliothèque");
        });
      });
      // les seuils de symétrie ne doivent jamais baisser d'une étape à l'autre
      const by = {};
      p.etapes.forEach((e, i) => (e.obj || []).forEach(o => { const a = o.a; if (a && a.m && a.lsi != null) (by[a.m] = by[a.m] || []).push([i + 1, a.lsi]); }));
      Object.keys(by).forEach(m => { const v = by[m]; for (let k = 1; k < v.length; k++) if (v[k][1] < v[k - 1][1]) add(pid, "symétrie " + m + " : " + v[k - 1][1] + " % (étape " + v[k - 1][0] + ") puis " + v[k][1] + " % (étape " + v[k][0] + ")"); });
    });
    return { n: KP.ORDER.length, issues };
  });
  expect(r.n).toBe(35);
  expect(r.issues, r.issues.join("\n")).toEqual([]);
});

test("parcours : le chiffre écrit dans chaque critère est celui que le code applique", async ({ page }) => {
  await ouvrir(page);
  const bad = await page.evaluate(() => {
    const KP = KineParcours, res = [];
    KP.ORDER.forEach(pid => KP.P[pid].etapes.forEach((e, i) => e.obj.forEach(o => {
      const a = o.a; if (!a) return;
      if (a.m === "cait") return;   // « au-dessus de 25 » s'écrit ≥ 26 dans la règle
      const nums = (o.t.replace(/\d+\s*×\s*\d+/g, "").match(/\d+(?:[.,]\d+)?/g) || []).map(x => +x.replace(",", "."));
      let want = null;
      if (a.lsi != null) want = a.lsi; else if (a.hops != null) want = a.hops; else if (a.def != null) want = a.def;
      else if (a.diff != null) want = a.diff; else if (a.gain != null) want = a.gain; else if (a.min != null) want = a.min;
      else if (a.max != null && !KP.M[a.m].ch) want = a.max; else if (a.dou != null) want = a.dou;
      else if (a.j != null) { const w = a.j / 7, m = a.j / 30; if (!nums.some(n => Math.abs(n - w) < 1.1 || Math.abs(n - m) < 0.6)) res.push(pid + " étape " + (i + 1) + " " + o.id + " : délai " + a.j + " j ↔ « " + o.t + " »"); return; }
      if (want != null && !nums.includes(want)) res.push(pid + " étape " + (i + 1) + " " + o.id + " : " + want + " ↔ « " + o.t + " »");
    })));
    return res;
  });
  expect(bad, bad.join("\n")).toEqual([]);
});

test("parcours : règles de passage d'étape dans les cas limites", async ({ page }) => {
  await ouvrir(page);
  const rows = await page.evaluate(() => {
    const KP = KineParcours, R = [];
    const bil = (d, m) => ({ d, m });
    const dt = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const T3 = ["hop1", "hop3", "hop6"];
    const t = (nom, a, ctx, attendu) => {
      let r; try { r = KP.evalObj(a, Object.assign({ bilans: [], seances: [], date0: null }, ctx)); } catch (e) { r = { err: String(e.message) }; }
      const ok = r && r.err ? false : attendu === null ? r && r.ok === null : r && r.ok === attendu;
      R.push({ nom, ok, got: r ? (r.err || (r.ok + " « " + r.v + " »")) : "null", attendu });
    };
    // symétrie
    t("quadriceps sans bilan", { m: "quad", lsi: 70 }, {}, null);
    t("quadriceps, côté sain non mesuré", { m: "quad", lsi: 70 }, { bilans: [bil("2026-10-01", { quad: { a: [20] } })] }, null);
    t("quadriceps 28/40 = 70 %", { m: "quad", lsi: 70 }, { bilans: [bil("2026-10-01", { quad: { a: [28], s: [40] } })] }, true);
    t("quadriceps 27/40 = 68 %", { m: "quad", lsi: 70 }, { bilans: [bil("2026-10-01", { quad: { a: [27], s: [40] } })] }, false);
    t("quadriceps 0 kg (ne contracte pas) = 0 %, pas « à mesurer »", { m: "quad", lsi: 70 }, { bilans: [bil("2026-10-01", { quad: { a: [0], s: [40] } })] }, false);
    t("virgule décimale", { m: "quad", lsi: 70 }, { bilans: [bil("2026-10-01", { quad: { a: ["28,5"], s: ["40"] } })] }, true);
    t("meilleur de 3 essais", { m: "quad", lsi: 70 }, { bilans: [bil("2026-10-01", { quad: { a: [20, 29, 25], s: [40, 38, 40] } })] }, true);
    t("6 m chronométré (plus petit = mieux)", { m: "hop6", lsi: 80 }, { bilans: [bil("2026-10-01", { hop6: { a: [6.25], s: [5] } })] }, true);
    t("valeur non numérique", { m: "quad", lsi: 70 }, { bilans: [bil("2026-10-01", { quad: { a: ["abc"], s: [40] } })] }, null);
    t("régression : le bilan le plus récent compte", { m: "quad", lsi: 80 }, { bilans: [bil("2026-10-10", { quad: { a: [24], s: [40] } }), bil("2026-09-10", { quad: { a: [34], s: [40] } })] }, false);
    // extension
    t("extension −3° (côté sain 0)", { m: "ext", def: 5 }, { bilans: [bil("2026-10-01", { ext: { a: [-3], s: [0] } })] }, true);
    t("extension −8°", { m: "ext", def: 5 }, { bilans: [bil("2026-10-01", { ext: { a: [-8], s: [0] } })] }, false);
    t("extension −3° sans côté sain", { m: "ext", def: 5 }, { bilans: [bil("2026-10-01", { ext: { a: [-3] } })] }, true);
    // seuils directs
    t("épanchement « Aucun »", { m: "epanch", max: 1 }, { bilans: [bil("2026-10-01", { epanch: { a: [0] } })] }, true);
    t("épanchement 2+", { m: "epanch", max: 1 }, { bilans: [bil("2026-10-01", { epanch: { a: [3] } })] }, false);
    t("flexion 112° (min 110)", { m: "flex", min: 110 }, { bilans: [bil("2026-10-01", { flex: { a: [112] } })] }, true);
    t("Y-balance 3 cm d'écart (≤ 4)", { m: "yb", diff: 4 }, { bilans: [bil("2026-10-01", { yb: { a: [90], s: [93] } })] }, true);
    // sauts
    t("sauts : rien mesuré", { hops: 80 }, { bilans: [bil("2026-10-01", {})] }, null);
    t("sauts LCA : saut simple seul à 92 %, triple et 6 m jamais mesurés → pas validé", { hops: 90, need: T3 }, { bilans: [bil("2026-10-01", { hop1: { a: [138], s: [150] } })] }, null);
    t("sauts LCA : un test sous le seuil suffit à refuser", { hops: 90, need: T3 }, { bilans: [bil("2026-10-01", { hop1: { a: [138], s: [150] }, hop3: { a: [425], s: [500] } })] }, false);
    t("sauts LCA : les 3 tests à 92 / 95 / 91 %", { hops: 90, need: T3 }, { bilans: [bil("2026-10-01", { hop1: { a: [138], s: [150] }, hop3: { a: [475], s: [500] }, hop6: { a: [5.5], s: [5.0] } })] }, true);
    t("sauts (parcours à un seul saut) : saut simple à 92 %", { hops: 90 }, { bilans: [bil("2026-10-01", { hop1: { a: [138], s: [150] } })] }, true);
    // douleur aux dernières séances (la plus récente en premier)
    t("douleur : une seule séance notée", { dou: 3 }, { seances: [{ dou: 2 }] }, null);
    t("douleur : 3 dernières [2,2,6]", { dou: 3 }, { seances: [{ dou: 2 }, { dou: 2 }, { dou: 6 }] }, false);
    t("douleur : [2,3,1], une 4e séance ancienne à 8 ignorée", { dou: 3 }, { seances: [{ dou: 2 }, { dou: 3 }, { dou: 1 }, { dou: 8 }] }, true);
    t("douleur : séances sans note ignorées", { dou: 3 }, { seances: [{ dou: "" }, { dou: 2 }, { dou: 1 }] }, true);
    // délais
    t("délai : date de l'opération absente", { j: 84 }, {}, null);
    t("délai : 90 jours (≥ 84)", { j: 84 }, { date0: dt(90) }, true);
    t("délai : 60 jours", { j: 84 }, { date0: dt(60) }, false);
    t("délai : date dans le futur", { j: 84 }, { date0: dt(-10) }, false);
    // progrès
    t("gain : un seul bilan", { m: "flex", gain: 10 }, { bilans: [bil("2026-10-01", { flex: { a: [100] } })] }, null);
    return R;
  });
  const ko = rows.filter(r => !r.ok).map(r => r.nom + " → obtenu " + r.got + ", attendu " + r.attendu);
  expect(rows.length).toBeGreaterThanOrEqual(30);
  expect(ko, ko.join("\n")).toEqual([]);
});

test("parcours : chaque option demandée au kiné change vraiment quelque chose", async ({ page }) => {
  await ouvrir(page);
  const inutiles = await page.evaluate(() => {
    const KP = KineParcours, res = [];
    KP.ORDER.forEach(pid => {
      const p = KP.P[pid];
      (p.opts || []).forEach(o => {
        const sert = p.etapes.some(e => (e.exos || []).some(x => typeof x !== "string" && x.sauf && x.sauf[o.id] != null));
        if (!sert) res.push(pid + " : l'option « " + o.l + " » n'a aucun effet sur les exercices");
      });
    });
    return res;
  });
  expect(inutiles, inutiles.join("\n")).toEqual([]);
});

test("parcours : le LCA non opéré exige aussi la confiance (ACL-RSI) et les ischio-jambiers au retour à l'activité", async ({ page }) => {
  await ouvrir(page);
  const ids = await page.evaluate(() => KineParcours.P.lca_cons.etapes[4].obj.map(o => o.id));
  expect(ids).toEqual(expect.arrayContaining(["quad90", "isch90", "rsi", "hop90"]));
});

test("parcours opérés : chaque passage d'étape demande l'accord du chirurgien", async ({ page }) => {
  await ouvrir(page);
  const manques = await page.evaluate(() => {
    const res = [];
    ["rupt_achille", "coiffe_op", "stab_op", "pte", "pth"].forEach((id) => {
      const q = KineParcours.P[id];
      if (!q) { res.push(id + " : parcours introuvable"); return; }
      q.etapes.slice(0, -1).forEach((e, i) => {
        if (!e.obj.some((o) => /^chir\d$/.test(o.id) && !o.a)) res.push(id + " étape " + (i + 1));
      });
    });
    return res;
  });
  expect(manques).toEqual([]);
});

// Une clé de mesure en double n'est pas une erreur JavaScript : la seconde écrase la première en silence
// (c'était le cas de « abd » : force de hanche en kg et abduction du bras en degrés).
test("parcours : aucune clé de mesure en double, et chaque mesure demandée existe", async ({ page }) => {
  const fs = require("fs"), path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "assets/js/kine-parcours.js"), "utf8");
  const bloc = src.slice(src.indexOf("var M = {"), src.indexOf("\n  };", src.indexOf("var M = {")));
  const cles = [...bloc.matchAll(/^    ([A-Za-z0-9_]+):\s*\{/gm)].map((m) => m[1]);
  const doublons = cles.filter((k, i) => cles.indexOf(k) !== i);
  expect(doublons).toEqual([]);
  expect(cles.length).toBeGreaterThan(50);
  await ouvrir(page);
  const inconnues = await page.evaluate(() => {
    const res = [];
    KineParcours.ORDER.forEach((id) => (KineParcours.P[id].mes || []).forEach((k) => { if (!KineParcours.M[k]) res.push(id + ":" + k); }));
    return res;
  });
  expect(inconnues).toEqual([]);
});

test("douleur forte notée ce matin : la séance du jour reste douce (2 tours, sans répétition en plus)", async ({ page }) => {
  await ouvrir(page);
  const r = await page.evaluate(() => {
    const iso = (d) => d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    const jour = (n) => iso(new Date(Date.now() - n * 864e5));
    window.sessions = [{ date: jour(2), borg: 1, douleur: 0 }, { date: jour(4), borg: 1, douleur: 0 }];
    localStorage.setItem("kf-start", jour(16)); localStorage.setItem("kf-reset", "");
    localStorage.setItem("kf-checkin", JSON.stringify({}));
    const normal = KineProgress.plan();
    localStorage.setItem("kf-checkin", JSON.stringify({ [jour(0)]: { pain: 8 } }));
    const forte = KineProgress.plan();
    localStorage.setItem("kf-checkin", JSON.stringify({ [jour(0)]: { pain: 6 } }));
    const moyenne = KineProgress.plan();
    localStorage.setItem("kf-checkin", JSON.stringify({ [jour(1)]: { pain: 9 } }));
    const hier = KineProgress.plan();
    return { normal: [normal.week, normal.series, normal.repsBonus, !!normal.pain], forte: [forte.series, forte.repsBonus, !!forte.pain, forte.reason], moyenne: [moyenne.series, !!moyenne.pain], hier: [hier.series, !!hier.pain] };
  });
  expect(r.normal[0]).toBeGreaterThanOrEqual(3);
  expect(r.normal[3]).toBe(false);
  expect(r.forte[0]).toBe(2); expect(r.forte[1]).toBe(0); expect(r.forte[2]).toBe(true);
  expect(r.forte[3]).toContain("Douleur forte ce matin");
  expect(r.moyenne[1]).toBe(false);   // 6 sur 10 : pas assez pour changer la séance
  expect(r.hier[1]).toBe(false);      // la douleur d'hier ne compte pas aujourd'hui
});
