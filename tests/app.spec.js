// Parcours de tous les écrans : aucune erreur, barre du bas en bas, éléments principaux présents
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const SHOTS = process.env.SHOTS || "captures";
fs.mkdirSync(SHOTS, { recursive: true });

function setup(page, errs) {
  page.on("pageerror", e => errs.push(String(e.message || e)));
  return page.addInitScript(() => {
    localStorage.setItem("kf-onboarded", "1"); localStorage.setItem("kf-install-never", "1");
    localStorage.setItem("kf-tour-v2", "1"); sessionStorage.setItem("kf-ressenti-later", "1");
  });
}
const IGNORE = /firebase|gstatic|Failed to fetch|NetworkError|Load failed|play\(\)|NotAllowedError|AbortError/i;
async function shot(page, info, name) { await page.screenshot({ path: `${SHOTS}/${info.project.name}-${name}.png` }); }
async function navOk(page) {
  const nav = page.locator(".bottom-nav"); await expect(nav).toBeVisible();
  const b = await nav.boundingBox(), vh = page.viewportSize().height;
  expect(b.y + b.height).toBeGreaterThan(vh - 4);   // collée en bas de l'écran
}
async function clean(errs) { const real = errs.filter(e => !IGNORE.test(e)); expect(real, real.join("\n")).toEqual([]); }

test("accueil et ouverture", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.goto("index.html");
  await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 8000 });
  await expect(page.locator(".lu-slab, .lu-hello").first()).toBeVisible();
  await navOk(page); await page.waitForTimeout(1200); await shot(page, info, "1-accueil");
  await page.evaluate(() => window.scrollBy(0, 1400)); await page.waitForTimeout(900); await shot(page, info, "2-accueil-bas");
  await clean(errs);
});

test("onglets", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 8000 });
  const tabs = await page.locator(".bottom-nav button, .bottom-nav a").all();
  expect(tabs.length).toBeGreaterThanOrEqual(5);
  for (let i = 0; i < tabs.length; i++) {
    await tabs[i].click(); await page.waitForTimeout(1300);
    await page.evaluate(() => { const m = document.getElementById("kf-masc"); if (m && m.classList.contains("open") && window.KineMascotte && KineMascotte.hide) KineMascotte.hide(); });
    await navOk(page); await shot(page, info, "3-onglet-" + i);
  }
  await clean(errs);
});

test("exercices : recherche et bibliothèque", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 8000 });
  await page.evaluate(() => { showPage("guide"); KineLumiere.tab && KineLumiere.tab("lib"); });
  await page.waitForTimeout(1200);
  const q = page.locator("#lu-lib .kf-search input"); await expect(q).toBeVisible();
  await q.fill("squat"); await page.waitForTimeout(500);
  const n = await page.locator("#lu-lib .lu-card:not([hidden])").count(); expect(n).toBeGreaterThan(2);
  await q.blur(); await page.waitForTimeout(400); await navOk(page);
  await shot(page, info, "4-biblio-recherche");
  await page.evaluate(() => KineCompose.open()); await page.waitForTimeout(600);
  await page.locator("#kc-sheet .kf-search input").fill("épaule"); await page.waitForTimeout(400);
  expect(await page.locator("#kc-sheet .kc-row:not([hidden])").count()).toBeGreaterThan(1);
  await shot(page, info, "5-creer-seance");
  await clean(errs);
});

test("vrai ou faux", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 8000 });
  // l'accueil peut se redessiner juste après l'ouverture : on réessaie si le bloc a été remplacé
  for (let i = 0; i < 4; i++) { try { await page.locator("#ki-vf").scrollIntoViewIfNeeded({ timeout: 3000 }); break; } catch (e) { await page.waitForTimeout(500); } }
  await page.waitForTimeout(2500);
  const card = page.locator(".lq-card");
  if (await card.count()) {
    const b = await card.boundingBox(), vw = page.viewportSize().width;
    expect(b.x + b.width).toBeLessThanOrEqual(vw + 2);   // la carte reste dans l'écran
  }
  await shot(page, info, "6-vrai-faux");
  await clean(errs);
});

test("caméra, bilan et réglages", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 8000 });
  await page.evaluate(() => KineCamera.open()); await page.waitForTimeout(1500); await shot(page, info, "7-camera");
  await page.evaluate(() => KineCamera.bilan()); await page.waitForTimeout(800); await shot(page, info, "8-bilan");
  await page.evaluate(() => KineCamera.close());
  await page.evaluate(() => KineLumiere.settings()); await page.waitForTimeout(700); await shot(page, info, "9-reglages");
  await page.evaluate(() => KineFiable.open()); await page.waitForTimeout(500); await shot(page, info, "10-signaler");
  await clean(errs);
});

test("programmes ciblés et journal de course", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  // sans Firebase : le programme réellement publié par le kiné ne doit pas fausser le test
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 8000 });
  // masqués par défaut : un patient ne voit aucun programme ciblé
  expect(await page.evaluate(() => KineTheme.available())).toEqual([]);
  // le kiné en rend un visible (programme publié), le patient le choisit
  await page.evaluate(() => { localStorage.setItem("kf-mode-seen", JSON.stringify({ coureur: 1, cheville: 1 })); KineOfficiel.apply({ v: 1, ex: {}, days: {}, themes: { coureur: true } }); KineTheme.choose("coureur", true); });
  expect(await page.evaluate(() => Object.keys(SEQ_DAYS))).toEqual(["c0", "c1"]);
  expect(await page.evaluate(() => SEQ_DAYS.c1.exercises.map(e => e.name))).toContain("Petits sauts sur place");
  await page.evaluate(() => showPage("guide")); await page.waitForTimeout(900);
  await expect(page.locator("#prog-v2 .th-pill.on")).toContainText("Coureur"); await expect(page.locator("#today-card .th-pill.on")).toContainText("Coureur"); await shot(page, info, "7-programme-coureur");
  await page.evaluate(() => { KineCourse.open(); KineCourse.add(); });
  await page.locator("#kco-km").fill("6,5"); await page.locator("#kco-sheet .seq-btn-main").click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("kf-runs"))[0].km)).toBe(6.5);
  await shot(page, info, "8-journal-course");
  // le kiné le masque : retour automatique au programme général
  await page.evaluate(() => { KineCourse.close(); KineOfficiel.apply({ v: 2, ex: {}, days: {}, themes: {} }); });
  expect(await page.evaluate(() => [KineTheme.active(), Object.keys(SEQ_DAYS).length])).toEqual([null, 5]);
  await page.evaluate(() => { KineOfficiel.apply({ v: 3, ex: {}, days: {}, themes: { cheville: true } }); KineTheme.choose("cheville"); launchSeq("e0"); });
  await clean(errs);
});

test("nouveaux exercices et schémas animés", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 8000 });
  const ok = await page.evaluate(() => ["Rentrer le menton", "Pendulaire de Codman", "Spanish squat à l'élastique", "Pied court", "Planche Copenhague", "Copenhague dynamique genou", "Extension en appui sur les mains", "Reverse Nordic", "Coquillage à l'élastique", "Torsion de serviette", "Se relever du sol", "Regard fixe en tournant la tête"]
    .every(n => KineBiblio.find(n) && KineAvatar.supports(n)));
  expect(ok).toBe(true);
  await page.evaluate(() => KineBiblio.open("cou")); await page.waitForTimeout(800);
  await expect(page.locator(".kf-sheet.open").getByText("Rentrer le menton").first()).toBeVisible();
  await page.evaluate(() => { document.querySelectorAll(".kf-sheet.open").forEach(e => e.classList.remove("open")); KineBiblio.demo("Rentrer le menton"); });
  await page.waitForTimeout(3000);
  if (await page.evaluate(() => !!window.THREE)) await expect(page.locator(".kf-aid[data-aid='chin']")).toBeVisible();
  await shot(page, info, "9-nouvel-exercice");
  await clean(errs);
});
