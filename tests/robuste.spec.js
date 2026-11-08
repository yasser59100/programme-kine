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
