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
  expect(await page.evaluate(() => KineHopital.isHop())).toBe(true);
  await page.evaluate(() => { const d = document.createElement("div"); d.id = "zz"; d.innerHTML = KineHopital.feelHtml(); document.body.appendChild(d); });
  await page.locator("#zz .kh-face").nth(2).dispatchEvent("click");
  expect(await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("kf-checkin"))).some(c => c.feel === 3))).toBe(true);
  await expect(page.locator(".kh-card").first()).toBeVisible({ timeout: 8000 });
  expect(await page.locator(".kh-card").count()).toBe(4);
  await page.waitForTimeout(1500); await page.screenshot({ path: "/tmp/hop-espace.png" }); await page.locator(".kh-vf").scrollIntoViewIfNeeded(); await page.screenshot({ path: "/tmp/hop-espace2.png" });
  await page.locator(".kh-tip").first().dispatchEvent("click");
  await expect(page.locator("#kh-sheet.open")).toBeVisible();
  await page.evaluate(() => KineHopital.tipClose());
  await page.locator("#kh-vf .kh-vb").first().dispatchEvent("click");
  await expect(page.locator("#kh-vf")).toContainText(/C'est (vrai|faux)/);
  await page.locator(".kh-go").dispatchEvent("click");
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("kf-custom")).some(x => String(x.id).indexOf("hop-") === 0))).toBe(true);
  expect(errs).toEqual([]);
});

test("liste des patients : groupe Hôpital, deux boutons à l'acceptation", async ({ page }) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await boot(page);
  await page.evaluate(() => { KineRole.pick("patient"); return KineRole.demande(); });
  await page.fill("#krl-prenom", "Léa"); await page.fill("#krl-nom", "Martin"); await page.check("#krl-ok");
  await page.evaluate(() => KineRole.send());
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true }; KineCabinet.open(); });
  await page.evaluate(() => KineCabinet.demandes());
  await expect(page.locator("#kcb-sheet .kcb-pick")).toHaveCount(2);
  await page.addStyleTag({ content: "#kf-role,#kf-hub,.krl:not(#kcb-sheet){display:none!important}" }); await page.waitForTimeout(700); await page.screenshot({ path: "/tmp/kine-accept.png" });
  await page.locator("#kcb-sheet .kcb-hopq").dispatchEvent("click");
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => { window.__db.patients.p2 = { doc: { alias: "Marc D.", parcours: "lca_opere", etape: 0, cote: "D" }, bilans: {}, seances: {}, maison: {}, notes: {}, journal: {}, membres: 0 }; });
  await page.evaluate(() => KineCabinet.open());
  await expect(page.locator("#kcb-sheet .kcb-grp").first()).toContainText("Hôpital", { timeout: 8000 });
  await expect(page.locator("#kcb-sheet .kcb-grp")).toHaveCount(2);
  await page.waitForTimeout(500); await page.screenshot({ path: "/tmp/kine-liste.png" });
  expect(errs).toEqual([]);
});

test("critères hôpital : la présence aux séances valide les étapes", async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const KP = window.KineParcours, iso = n => { const d = new Date(Date.now() - n * 86400000); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
    const P = KP.get("hopital"), o = id => P.etapes.flatMap(e => e.obj).find(x => x.id === id);
    const ev = (id, off) => KP.evalObj(o(id).a, { bilans: [], seances: [], jours: off.map(iso) }).ok;
    return { v2: ev("venu", [0, 2]), v3: ev("venu", [0, 2, 5]), vOld: ev("venu", [0, 2, 9]),
      r1: ev("regul", [0, 1, 2, 3]), r2: ev("regul", [0, 1, 2, 3, 7, 8, 9, 10]), r2b: ev("regul", [0, 1, 2, 3, 7, 8, 9]),
      a3: ev("act", [0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18]) };
  });
  expect(r).toEqual({ v2: false, v3: true, vOld: false, r1: false, r2: true, r2b: false, a3: true });
});
