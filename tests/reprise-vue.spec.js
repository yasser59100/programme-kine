const { test, expect } = require('@playwright/test');
async function boot(page) {
  await page.addInitScript(() => { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-masc-off", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); });
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 }); await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
}
test("reprise de course vue par le patient du cabinet", async ({ page }) => {
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
  await page.evaluate(() => showPage("home")); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll(".kf-toast,.toast,#kf-toast").forEach(e => e.remove()));
  await expect(page.locator("#page-cab-today .lu-rp").first()).toBeVisible();
  await page.screenshot({ path: "/tmp/rp-today.png" });
  await page.locator("#page-cab-today .lu-rp").first().scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  await page.screenshot({ path: "/tmp/rp-today-b.png" });
  await page.evaluate(() => KineReprise.go()); await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/rp-run.png" });
  expect(errs).toEqual([]);
});
