// Robustesse : l'appli démarre et reste utilisable même si les données enregistrées sur le téléphone sont abîmées
// (JSON cassé, mauvais type, éléments vides). Aucune erreur JavaScript ne doit remonter.
const { test, expect } = require("@playwright/test");

const CLES = ["kf-sessions", "kf-pain", "kf-runs", "kf-custom", "kf-kpush", "kf-sign", "kf-seen", "kf-checkin", "kf-salle-log",
  "kf-mode-start", "kf-mode-seen", "kf-ex", "kf-tee", "kf-cab"];
const MAUVAIS = { "JSON cassé": "{pas du json", "null": "null", "nombre": "42", "liste au lieu d'objet": "[1,2,3]",
  "objet au lieu de liste": '{"a":1}', "éléments vides": '[null,1,"x",{"date":"zzz"}]', "chaîne vide": "" };

for (const [nom, val] of Object.entries(MAUVAIS)) {
  test("données abîmées (" + nom + ") : aucune erreur, appli utilisable", async ({ page }) => {
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(String(e.message)));
    await page.addInitScript(([cles, v]) => {
      cles.forEach((k) => localStorage.setItem(k, v));
      localStorage.setItem("kf-onboarded", "1"); localStorage.setItem("kf-install-never", "1");
      localStorage.setItem("kf-tour-v2", "1"); sessionStorage.setItem("kf-ressenti-later", "1");
    }, [CLES, val]);
    await page.goto("index.html");
    await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
    await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
    const boutons = page.locator("nav button");
    const n = await boutons.count();
    for (let i = 0; i < n; i++) {
      const b = boutons.nth(i);
      if (await b.isVisible()) { await b.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(250); }
    }
    expect(await page.evaluate(() => document.body.innerText.trim().length)).toBeGreaterThan(100);
    expect(erreurs).toEqual([]);
  });
}

// Hors connexion : tout script chargé par l'appli doit être dans la liste de précache de sw.js, et tout fichier de la liste doit exister.
test("hors connexion : liste de précache complète et sans fichier manquant", async () => {
  const fs = require("fs"), path = require("path");
  const racine = path.join(__dirname, "..");
  const sw = fs.readFileSync(path.join(racine, "sw.js"), "utf8");
  const liste = [...sw.match(/APP_FILES\s*=\s*\[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const html = fs.readFileSync(path.join(racine, "index.html"), "utf8");
  const paresseux = ["kine-parcours", "kine-quest", "kine-saut", "kine-fiches", "kine-reprise", "kine-cabinet"].map((n) => "assets/js/" + n + ".js");
  const utilises = [...new Set([...[...html.matchAll(/src="(assets\/js\/[^"]+)"/g)].map((m) => m[1]), ...paresseux])];
  expect(utilises.filter((u) => !liste.includes(u))).toEqual([]);
  expect(liste.filter((f) => f !== "./" && !fs.existsSync(path.join(racine, f)))).toEqual([]);
});
