const { test, expect } = require('@playwright/test');
async function boot(page) {
  await page.addInitScript(() => { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-masc-off", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); });
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 }); await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
}
test("mobilité et étirements : chaque exercice existe, chaque pathologie a sa séance", async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('kf-onboarded', '1'); localStorage.setItem('kf-install-never', '1'); localStorage.setItem('kf-tour-v2', '1'); } catch (e) {} });
  await page.goto('/index.html');
  await page.waitForFunction(() => window.KineAvatar && window.KineBiblio && window.KineIdees && window.KineMob && window.KineEtirementsEx);
  await page.evaluate(() => window.kfNeed && kfNeed("suivi"));
  await page.waitForFunction(() => window.KineParcours);
  const r = await page.evaluate(() => {
    const lib = KineBiblio.all().map(e => e.name || e.n || e.ex), bad = [], noAnim = [];
    KineMob.S.forEach(s => { if (s.ex.length < 4 || s.ex.length > 8) bad.push(s.id + " : " + s.ex.length + " exercices"); s.ex.forEach(n => { if (lib.indexOf(n) < 0) bad.push(s.id + " : " + n + " absent"); else if (!KineAvatar.supports(n)) noAnim.push(n); }); if (!s.note || s.note.length < 40) bad.push(s.id + " : note"); });
    const sans = KineParcours.list().filter(p => !KineMob.forParcours(p.id).length).map(p => p.id);
    const fiches = KineEtirementsEx.names.filter(n => !KineIdees.USAGE || !KineIdees.USAGE[n]);
    return { bad, noAnim: Array.from(new Set(noAnim)), sans, fiches };
  });
  expect(r.bad, "exercices ou notes manquants").toEqual([]);
  expect(r.noAnim, "exercices sans animation").toEqual([]);
  expect(r.sans, "parcours sans séance de mobilité").toEqual([]);
  expect(r.fiches, "« à quoi ça sert » manquant").toEqual([]);
});
test("kiné : séance de mobilité envoyée en un geste, selon la pathologie", async ({ page }) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await boot(page);
  const id = await page.evaluate(async () => { window.fbUser = { uid: "k1", isAdmin: true }; return await fbCab.create({ alias: "Léa M.", parcours: "sciatique", etape: 0, cote: "D", date0: "2026-10-01" }); });
  await page.evaluate(() => KineCabinet.open());
  await page.addStyleTag({ content: "#kf-role,#kf-hub,.krl:not(#kcb-sheet){display:none!important}" });
  await page.evaluate(i => KineCabinet.fiche(i), id); await page.waitForTimeout(600);
  await page.evaluate(() => KineCabinet.maison()); await page.waitForTimeout(600);
  const card = page.locator("#kcb-sheet .kcb-mob");
  await expect(card).toBeVisible();
  await expect(card).toContainText("Sciatique : mobilité et glissement du nerf");
  await expect(card).toContainText("Pas d'étirement des ischio-jambiers");
  await card.scrollIntoViewIfNeeded(); await page.screenshot({ path: "/tmp/mob-fiche.png" });
  await card.locator("button", { hasText: "Scoliose" }).count();   // les autres pathologies se choisissent par zone
  await card.locator(".kf-chips button", { hasText: "Autres" }).dispatchEvent("click");
  await expect(page.locator("#kcb-sheet .kcb-mob")).toContainText("Scoliose : souplesse et posture");
  await page.locator("#kcb-sheet .kcb-mob .kcb-pre-l").last().scrollIntoViewIfNeeded(); await page.locator("#kcb-sheet .kcb-mob .kcb-pre-l").last().screenshot({ path: "/tmp/mob-autres.png" });
  // envoi tel quel de la séance du patient
  await page.locator("#kcb-sheet .kcb-mob .kcb-pre-l.now .kcb-pre-s button", { hasText: "Envoyer tel quel" }).first().dispatchEvent("click");
  await page.waitForTimeout(600);
  const sent = await page.evaluate(() => KineCabinet._C().exos);
  expect(sent).toEqual(await page.evaluate(() => KineMob.get("sciatique_mobilite").ex));
  expect(errs).toEqual([]);
});
