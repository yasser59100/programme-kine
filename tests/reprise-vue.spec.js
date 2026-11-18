const { test, expect } = require('@playwright/test');
async function boot(page) {
  await page.addInitScript(() => { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-masc-off", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); });
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 }); await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
}
test("reprise de course : allure, questionnaire, alertes, bouton ralentir", async ({ page }) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await boot(page);
  await page.evaluate(() => { KineRole.pick("patient"); return KineRole.demande(); });
  await page.fill("#krl-prenom", "Léa"); await page.fill("#krl-nom", "Martin"); await page.check("#krl-ok");
  await page.evaluate(() => KineRole.send());
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true }; KineCabinet.open(); });
  await page.evaluate(() => KineCabinet.demandes());
  await page.locator("#kcb-sheet .kcb-hopq").dispatchEvent("click");
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => {
    const k = Object.keys(window.__db.patients)[0], d = window.__db.patients[k].doc;
    d.parcours = "achille"; d.etape = 2; d.cote = "D"; d.date0 = "2026-09-20"; d.exos = ["Squat", "Pont fessier"]; d.exosD = "2026-11-12";
    d.course = { id: "c1", m: "tendinopathie", d: 3, max: 3, f: 3, s: "Terrain souple", c: "Vas-y doucement, on regarde la douleur demain matin.", env: new Date().toISOString().slice(0, 10) };
    KineCabinet.close(true); localStorage.setItem("kf-role", "patient"); document.body.classList.remove("kf-kine"); window.fbUser = null; return KineMonSuivi.refresh(true);
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { try { KineMonSuivi.consent(0); } catch (e) {} });
  await page.evaluate(() => showPage("home")); await page.waitForTimeout(1000);
  // 1. sans allure : le patient doit la régler
  await page.evaluate(() => KineReprise.go()); await page.waitForTimeout(500);
  await expect(page.locator("#krp-q.open h2")).toContainText("Où vas-tu courir");
  await page.screenshot({ path: "/tmp/ra-q1.png" });
  await page.locator("#krp-q .krq-opts button", { hasText: "Dehors" }).click();
  await page.locator("#krp-q .krq-opts button", { hasText: "Oui" }).click();
  await page.locator("#krp-q .krq-opts button", { hasText: "3 fois" }).click();
  await page.locator("#krp-q .krq-opts button", { hasText: "10 km/h" }).click();
  await expect(page.locator("#krp-q h2")).toContainText("allure de reprise");
  await expect(page.locator("#krp-q .krq-res b").first()).toHaveText("8,5 km/h");
  await page.screenshot({ path: "/tmp/ra-q2.png" });
  await page.locator("#krp-q .seq-btn-main").click();
  expect(await page.evaluate(() => KineReprise.prof().v)).toBe(8.5);
  // 2. écran de départ
  await page.evaluate(() => KineReprise.go()); await page.waitForTimeout(400);
  await expect(page.locator("#krp-start")).toBeVisible();
  await page.screenshot({ path: "/tmp/ra-pre.png" });
  await page.locator("#krp-start").click();
  await expect(page.locator("#krp-run .krp-big b")).toHaveText("Marche vite");
  await page.evaluate(() => { KineReprise._skip(); KineReprise._skip(); });
  await expect(page.locator("#krp-run .krp-big b")).toHaveText("Cours");
  await expect(page.locator("#krp-run .krp-v strong")).toHaveText("8,5");
  await page.screenshot({ path: "/tmp/ra-run.png" });
  // 3. ralentir en direct
  await page.locator(".krp-slow").click();
  await expect(page.locator("#krp-run .krp-v strong")).toHaveText("8");
  await page.locator(".krp-slow").click();
  await expect(page.locator("#krp-run .krp-v strong")).toHaveText("7,5");
  await page.screenshot({ path: "/tmp/ra-slow.png" });
  for (let i = 0; i < 14; i++) { if (await page.locator("#krp-run .krp-end").count()) break; await page.evaluate(() => KineReprise._skip()); }
  await page.screenshot({ path: "/tmp/ra-end.png" });
  await page.locator("#krp-run .krp-scale button", { hasText: "1" }).first().click();
  const r = await page.evaluate(() => JSON.parse(localStorage.getItem("kf-runs")).pop());
  expect([r.v0, r.v1, r.slow]).toEqual([8.5, 7.5, 2]);
  expect(await page.evaluate(() => KineReprise.prof().v)).toBe(7.5);   // la prochaine séance part plus doucement
  // 4. ralenti deux fois : on ne monte pas de palier, même sans douleur
  const e = await page.evaluate(() => { const c = { id: "x", d: 3, max: 3, f: 3 }; return [KineReprise.etat(c, [{ cid: "x", rp: 3, d: "2026-10-01", pain: 1, next: 1, slow: 2 }]).palier, KineReprise.etat(c, [{ cid: "x", rp: 3, d: "2026-10-01", pain: 1, next: 1, slow: 1 }]).palier]; });
  expect(e).toEqual([3, 4]);
  expect(errs).toEqual([]);
});
