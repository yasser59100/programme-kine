const { test, expect } = require('@playwright/test');
async function boot(page) {
  await page.addInitScript(() => { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-masc-off", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); });
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 }); await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
}
const hide = { content: "#kf-role,#kf-hub,.krl:not(#kcb-sheet){display:none!important}" };
test("kiné : séances toutes faites, fin de parcours, reprise de course, guide", async ({ page }) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await boot(page);
  const id = await page.evaluate(async () => {
    window.fbUser = { uid: "k1", isAdmin: true };
    const id = await fbCab.create({ alias: "Marc D.", parcours: "genou_lca_op", etape: 1, cote: "D", date0: "2026-08-01" }).catch(() => null);
    return id;
  });
  const pid = await page.evaluate(() => Object.keys(KineParcours ? KineParcours.P : {}).slice(0, 1)[0]).catch(() => null);
  expect(pid).toBeTruthy();
  const pidLca = await page.evaluate(() => Object.keys(KineParcours.P).filter(k => /lca/i.test(k))[0] || Object.keys(KineParcours.P)[0]);
  const id2 = await page.evaluate(async (pp) => { const i = await fbCab.create({ alias: "Marc D.", parcours: pp, etape: 1, cote: "D", date0: "2026-08-01" }); return i; }, pidLca);
  await page.evaluate(() => KineCabinet.open());
  await page.addStyleTag(hide);
  await page.evaluate(i => KineCabinet.fiche(i), id2); await page.waitForTimeout(700);
  await expect(page.locator("#kcb-sheet .kcb-tile.wide")).toContainText("Reprise de la course");
  await page.screenshot({ path: "/tmp/kl-fiche.png" });
  // séances toutes faites
  await page.evaluate(() => KineCabinet.maison()); await page.waitForTimeout(600);
  await expect(page.locator("#kcb-sheet .kcb-pre")).toBeVisible();
  expect(await page.locator("#kcb-sheet .kcb-pre-s").count()).toBeGreaterThanOrEqual(3);
  await page.screenshot({ path: "/tmp/kl-prefab.png" });
  await page.locator("#kcb-sheet .kcb-pre-l.now .kcb-pre-s").first().locator("button", { hasText: "Modifier" }).dispatchEvent("click");
  await expect(page.locator("#kcb-sheet .kcb-exck.on").first()).toBeVisible();
  await page.evaluate(() => KineCabinet.maison()); await page.waitForTimeout(300);
  // envoi tel quel
  await page.evaluate(() => { KineCabinet.exEdit && 0; });
  // dernière étape : valider
  await page.evaluate(async (i) => { const P = KineParcours.get(KineCabinet._C().parcours); await fbCab.save(i, { etape: P.etapes.length - 1 }); }, id2);
  await page.evaluate(i => KineCabinet.fiche(i), id2); await page.waitForTimeout(500);
  await page.evaluate(() => KineCabinet.etapes()); await page.waitForTimeout(500);
  await expect(page.locator("#kcb-sheet button", { hasText: "Valider la fin du parcours" })).toBeVisible();
  page.once("dialog", d => d.accept());
  await page.locator("#kcb-sheet button", { hasText: "Valider la fin du parcours" }).click();
  await expect(page.locator("#kcb-sheet")).toContainText("Parcours validé le", { timeout: 8000 });
  await page.screenshot({ path: "/tmp/kl-fin.png" });
  // guide
  await page.evaluate(() => KineCabinet.guide(null)); await page.waitForTimeout(700);
  await page.screenshot({ path: "/tmp/kl-guide.png" });
  expect(errs).toEqual([]);
});
