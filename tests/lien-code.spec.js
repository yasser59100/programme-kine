// Lien envoyé par le kiné : …/#code=ABC123 ouvre l'appli sur « Relier mon téléphone » avec le code déjà tapé.
const { test, expect } = require("@playwright/test");

test("lien avec code : l'appli s'ouvre sur la saisie, code rempli, adresse nettoyée", async ({ page }) => {
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e.message)));
  await page.addInitScript(() => { try { localStorage.setItem("kf-install-never", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); } catch (e) {} });
  await page.route(/firebase|gstatic|googleapis/, (r) => r.abort());
  await page.goto("index.html#code=k7m2qx");
  await expect(page.locator("#kms-code")).toHaveValue("K7M2QX", { timeout: 15000 });
  expect(await page.evaluate(() => location.hash)).toBe("");
  expect(await page.evaluate(() => localStorage.getItem("kf-role"))).toBe("patient");
  expect(erreurs.filter((e) => !/firebase|gstatic|Failed to fetch|NetworkError|Load failed/i.test(e))).toEqual([]);
});

test("lien avec code : un faux code est ignoré, un kiné garde son rôle", async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-role", "kine"); localStorage.setItem("kf-onboarded", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); } catch (e) {} });
  await page.route(/firebase|gstatic|googleapis/, (r) => r.abort());
  await page.goto("index.html#code=abc");
  await page.waitForTimeout(1500);
  await expect(page.locator("#kms-code")).toHaveCount(0);
  await page.goto("index.html#code=ABC123");
  await expect(page.locator("#kms-code")).toHaveValue("ABC123", { timeout: 15000 });
  expect(await page.evaluate(() => localStorage.getItem("kf-role"))).toBe("kine");
});
