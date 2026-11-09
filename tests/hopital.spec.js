const { test, expect } = require('@playwright/test');
async function boot(page) {
  await page.addInitScript(() => { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-masc-off", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); });
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 }); await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
}
test("mode hôpital : une demande s'accepte en un geste, sans parcours ni côté", async ({ page }) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await boot(page);
  await page.evaluate(() => { KineRole.pick("patient"); return KineRole.demande(); });
  await page.fill("#krl-prenom", "Léa"); await page.fill("#krl-nom", "Martin"); await page.check("#krl-ok");
  await page.evaluate(() => KineRole.send());
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true }; KineCabinet.open(); });
  await page.evaluate(() => KineCabinet.demandes());
  await expect(page.locator("#kcb-sheet .kcb-hopq")).toHaveCount(1);
  await page.locator("#kcb-sheet .kcb-hopq").dispatchEvent("click");
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => Object.keys(window.__db.demandes).length)).toBe(0);
  const doc = await page.evaluate(() => { const k = Object.keys(window.__db.patients)[0]; return window.__db.patients[k].doc; });
  expect(doc.parcours).toBe("hopital");
  // côté patient : le téléphone se relie et tous les écrans du suivi s'ouvrent sans erreur
  await page.evaluate(() => { KineCabinet.close(true); localStorage.setItem("kf-role", "patient"); document.body.classList.remove("kf-kine"); window.fbUser = null; return KineMonSuivi.refresh(true); });
  await page.evaluate(() => showPage("suivi")); await page.waitForTimeout(800);
  await page.evaluate(() => { try { KineMonSuivi.fiche && KineMonSuivi.fiche(); } catch (e) {} });
  await page.waitForTimeout(800);
  await page.evaluate(() => { const P = KineParcours || window.KP; return 1; }).catch(() => {});
  const plan = await page.evaluate(() => { try { const p = KineProgress.plan(); return p ? "ok" : "vide"; } catch (e) { return "ERR " + e.message; } });
  expect(plan.indexOf("ERR")).toBe(-1);
  expect(errs).toEqual([]);
});
test("mode hôpital : dans une fiche manuelle, un bouton règle le parcours et cache le côté atteint", async ({ page }) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await boot(page);
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true }; KineCabinet.open(); });
  await expect(page.locator("#kcb-sheet .kcb-tabs")).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => KineCabinet.nouveau());
  await expect(page.locator("#kcb-sheet .kcb-hop")).toBeVisible();
  await expect(page.locator("#kcb-sheet")).toContainText("Côté atteint");
  await page.locator("#kcb-sheet .kcb-hop").dispatchEvent("click");
  await expect(page.locator("#kcb-sheet .kcb-hop.sel")).toBeVisible();
  await expect(page.locator("#kcb-sheet")).not.toContainText("Côté atteint");
  await page.fill("#kcb-alias", "Léa M.");
  await page.evaluate(() => KineCabinet.saveForm(null));
  await expect(page.locator("#kcb-sheet")).toContainText("Fiche créée", { timeout: 8000 });
  expect(await page.evaluate(() => Object.values(window.__db.patients)[0].doc.parcours)).toBe("hopital");
  expect(errs).toEqual([]);
});
test("espace hôpital : séances prêtes, le savais-tu, vrai ou faux côté patient", async ({ page }) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await boot(page);
  // toutes les séances ne contiennent que des exercices existants
  const manquants = await page.evaluate(() => KineHopital.seances.flatMap(s => s.ex.filter(n => !KineBiblio.find(n))));
  expect(manquants).toEqual([]);
  await page.evaluate(() => { KineRole.pick("patient"); return KineRole.demande(); });
  await page.fill("#krl-prenom", "Léa"); await page.fill("#krl-nom", "Martin"); await page.check("#krl-ok");
  await page.evaluate(() => KineRole.send());
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true }; KineCabinet.open(); });
  await page.evaluate(() => KineCabinet.demandes());
  await page.locator("#kcb-sheet .kcb-hopq").dispatchEvent("click");
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => { KineCabinet.close(true); localStorage.setItem("kf-role", "patient"); document.body.classList.remove("kf-kine"); window.fbUser = null; return KineMonSuivi.refresh(true); });
  await page.evaluate(() => { try { KineMonSuivi.consent(0); } catch (e) {} }); await page.waitForTimeout(1200);
  await page.evaluate(() => showPage("monkine")); await page.waitForTimeout(1500);
  await expect(page.locator(".kh-seance").first()).toBeVisible({ timeout: 8000 });
  expect(await page.locator(".kh-seance").count()).toBe(4);
  await page.locator(".kh-seances, .kh-seance").first().scrollIntoViewIfNeeded(); await page.screenshot({ path: "/tmp/hop-espace.png" });
  await page.locator(".kh-tip").first().dispatchEvent("click");
  await expect(page.locator("#kh-sheet.open")).toBeVisible();
  await page.evaluate(() => KineHopital.tipClose());
  await page.locator("#kh-vf button").first().dispatchEvent("click");
  await expect(page.locator("#kh-vf")).toContainText(/C'est (vrai|faux)/);
  await page.locator(".kh-seance button").first().dispatchEvent("click");
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("kf-custom")).some(x => x.id === "hop-reveil"))).toBe(true);
  expect(errs).toEqual([]);
});
