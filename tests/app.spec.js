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
  await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  await expect(page.locator(".lu-slab, .lu-hello").first()).toBeVisible();
  await navOk(page); await page.waitForTimeout(1200); await shot(page, info, "1-accueil");
  await page.evaluate(() => window.scrollBy(0, 1400)); await page.waitForTimeout(900); await shot(page, info, "2-accueil-bas");
  await clean(errs);
});

test("onglets", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
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
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
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
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
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
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
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
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
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

test("mode salle de sport : charge, séries et progression", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  const r = await page.evaluate(() => {
    KineOfficiel.themes = () => ({ salle: 1, sgenou: 1, sepaule: 1, sdos: 1 });
    const miss = [];
    ["salle", "sgenou", "sepaule", "sdos"].forEach(id => { const T = KineTheme.THEMES[id]; T.sessions.forEach(s => s.ex.concat([[s.warm], [s.cool]]).forEach(x => { if (!KineOfficiel.asExercise(x[0])) miss.push(x[0]); })); });
    KineSalleEx.list.forEach(n => { if (!KineAvatar.supports(n) || !KineBiblio.find(n)) miss.push(n); });
    KineTheme.choose("salle", true);
    return { miss, keys: Object.keys(SEQ_DAYS).join(",") };
  });
  expect(r.miss).toEqual([]);
  expect(r.keys).toBe("s0,s1,s2");
  await page.evaluate(() => { window.speak = () => {}; _launchSeq("s2"); seqSkipExercise(); });
  await expect(page.locator("#ks-load")).toBeVisible();
  await page.evaluate(() => KineSalle._start("Squat à la barre"));
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => document.querySelector("#seq-actions button").click());
    await expect(page.locator("#ks-set")).toBeVisible();
    if (i === 0) await shot(page, info, "10-salle-serie");
    await page.evaluate(() => seqSkipRest());
  }
  const plan = await page.evaluate(() => { seqFinish(); return KineSalle.plans()["Squat à la barre"]; });
  expect(plan.kg).toBe(22.5);
  expect(plan.d).toBe(1);
  await page.evaluate(() => { document.querySelectorAll("#kf-cele").forEach(e => e.remove()); closeSeq(); KineSalle.open("Squat à la barre"); });
  await expect(page.locator("#ks-sheet .ks-hist")).toBeVisible();
  expect(await page.evaluate(() => KineModeFx.STORIES.salle)).toBe("gym");
  // journal de séance, sans lancer Yass
  await page.evaluate(() => { KineSalle.close(); KineSalle.log("s1"); KineSalle._jv(0, 0, "kg", "30"); KineSalle._jdone(0, 0); });
  await expect(page.locator("#ks-log .ks-srow.done")).toHaveCount(1);
  await expect(page.locator("#ks-rest")).toBeVisible();
  const saved = await page.evaluate(() => { KineSalle._rest(0); KineSalle._jend(); KineSalle._jsave(); return sessions[0].seance; });
  expect(saved).toBe("S2 — Pull (tirer)");
  await page.evaluate(() => { KineSalle._jclose(); KineTheme.gymPicker(); });
  await expect(page.locator(".th-gopt")).toHaveCount(4);
  await clean(errs);
});

test("suivi au cabinet : parcours, bilan, objectifs et patient relié", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  // contenu : chaque exercice proposé existe dans la bibliothèque, chaque mesure et source existe
  const miss = await page.evaluate(() => {
    const m = [];
    KineParcours.ORDER.forEach(id => { const P = KineParcours.P[id];
      if (!KineBiblio.find(P.ref)) m.push(id + " ref");
      P.mes.forEach(x => { if (!KineParcours.M[x]) m.push(id + " " + x); }); P.src.forEach(x => { if (!KineParcours.SRC[x]) m.push(id + " src " + x); });
      P.etapes.forEach((e, i) => KineParcours.exos(id, i, {}).forEach(n => { if (!KineBiblio.find(n)) m.push(id + " " + n); })); });
    return m;
  });
  expect(miss).toEqual([]);
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true, name: "Kiné" }; KineCabinet.open(); });
  await expect(page.locator("#kcb-sheet .kcb-fab")).toBeVisible();
  await page.evaluate(() => KineCabinet.setKine());
  expect(await page.evaluate(() => localStorage.getItem("kf-role"))).toBe("kine");
  await expect(page.locator("#kcb-sheet .kcb-setk")).toHaveCount(0);
  await page.evaluate(() => KineCabinet.nouveau());
  await page.fill("#kcb-alias", "S.B.");
  await page.evaluate(() => { KineCabinet.set("parcours", "lca_op"); KineCabinet.set("date0", "2026-01-10", 1); KineCabinet.saveForm(null); });
  await expect(page.locator("#kcb-sheet .kcb-code")).toBeVisible();
  const pid = await page.evaluate(() => Object.keys(window.__db.patients)[0]);
  await page.evaluate((pid) => KineCabinet.fiche(pid), pid);
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible();
  await page.evaluate(() => KineCabinet.bilan());
  await page.fill("input[data-m=flex][data-s=a][data-i='0']", "115");
  await page.fill("input[data-m=ext][data-s=a][data-i='0']", "-2");
  await page.fill("input[data-m=ext][data-s=s][data-i='0']", "0");
  await page.evaluate(() => KineCabinet.saveBilan());
  await expect(page.locator("#kcb-sheet .kcb-obj.done")).toHaveCount(2);
  await shot(page, info, "20-cabinet-fiche");
  // guide : description d'un test (appui long)
  await page.evaluate(() => { KineCabinet.guide(null); KineCabinet.testInfo("lachman"); });
  await expect(page.locator("#kcb-tinfo .kgd-ib.pos")).toBeVisible();
  expect(await page.evaluate(() => Object.keys(KineParcours.TESTS).every(k => Object.keys(KineParcours.GUIDES).some(z => KineParcours.GUIDES[z].g.q.filter(x => x.id === "tests")[0].ch.some(c => c[0] === k))))).toBe(true);
  // guide de la cheville
  await page.evaluate(() => { document.getElementById("kcb-tinfo").classList.remove("open"); KineCabinet.gZ("cheville"); KineCabinet.gQ("trauma", "inversion", 0); KineCabinet.gQ("zone", "ext", 0); KineCabinet.gQ("tests", "tiroir", 1); });
  await expect(page.locator("#kcb-sheet .kcb-h1").first()).toHaveText("Cheville et pied sans diagnostic");
  await expect(page.locator("#kcb-sheet .kgd-p.first b").first()).toHaveText("Entorse du ligament latéral externe");
  await shot(page, info, "22-guide-cheville");
  await page.evaluate(() => { KineCabinet.gZ("epaule"); KineCabinet.gQ("trauma", "progressif", 0); KineCabinet.gQ("zone", "antlat", 0); KineCabinet.gQ("age", "50", 0); });
  await expect(page.locator("#kcb-sheet .kgd-sug .kgd-st")).toHaveCount(3);
  await page.evaluate(() => { const el = document.querySelector("#kcb-sheet .kgd-sug"); el.scrollIntoView(); });
  await shot(page, info, "25-guide-epaule");
  await page.evaluate(() => { KineCabinet.gZ("rachis"); KineCabinet.gQ("zone", "lombjambe", 0); KineCabinet.gQ("signes", "jambe", 1); });
  await expect(page.locator("#kcb-sheet .kgd-p.first b").first()).toHaveText("Sciatique (radiculalgie lombaire)");
  await shot(page, info, "26-guide-rachis");
  await page.evaluate(() => { KineCabinet.gZ("epaule"); KineCabinet.gQ("trauma", "progressif", 0); KineCabinet.gQ("zone", "antlat", 0); });
  await page.evaluate(() => KineCabinet.gN("hawkins"));
  await expect(page.locator("#kcb-sheet .kgd-chips button.neg")).toHaveCount(1);
  await page.evaluate(() => { KineCabinet.gZ("genou"); KineCabinet.testInfo("thompson"); });
  await expect(page.locator("#kcb-tinfo .kgd-in")).toHaveText("Test de Thompson");
  await page.evaluate((pid) => { document.getElementById("kcb-tinfo").classList.remove("open"); KineCabinet.fiche(pid); }, pid);
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible();
  await page.evaluate(() => { KineCabinet.pick("Pont de hanche"); KineCabinet.pick("Équilibre unipodal"); KineCabinet.sendExos(); });
  await page.waitForTimeout(300);
  // côté patient
  await page.evaluate(() => { KineCabinet.close(); window.fbUser = null; showPage("suivi"); KineMonSuivi.join(); });
  await page.fill("#kms-code", "K7M2QX");
  await page.evaluate(() => KineMonSuivi.doJoin());
  await expect(page.locator("#kms-sheet .seq-btn-main")).toHaveText("Oui, sauvegarder");
  await page.evaluate(() => KineMonSuivi.consent(0));
  await expect(page.locator("#kms-sheet .kms-et.now")).toBeVisible();
  await shot(page, info, "21-cabinet-patient");
  const custom = await page.evaluate(() => JSON.parse(localStorage.getItem("kf-custom") || "[]").filter(x => x.id === "kine").map(x => x.ex.length)[0]);
  expect(custom).toBe(2);
  await clean(errs);
});

test("questionnaires : envoi depuis le bilan, réponse du patient, retour dans la fiche", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true, name: "Kiné" }; KineCabinet.open(); });
  await expect(page.locator("#kcb-sheet .kcb-fab")).toBeVisible();
  await page.evaluate(() => KineCabinet.nouveau());
  await page.fill("#kcb-alias", "M.D.");
  await page.evaluate(() => { KineCabinet.set("parcours", "coiffe"); KineCabinet.saveForm(null); });
  await expect(page.locator("#kcb-sheet .kcb-code")).toBeVisible();
  const pid = await page.evaluate(() => Object.keys(window.__db.patients)[0]);
  // le bilan propose les questionnaires, les conseillés en premier
  await page.evaluate((pid) => KineCabinet.fiche(pid), pid);
  await expect(page.locator("#kcb-sheet .kq-card")).toBeVisible();
  await page.evaluate(() => KineCabinet.bilan());
  await expect(page.locator("#kcb-sheet .kq-item.sug").first()).toBeVisible();
  await expect(page.locator("#kcb-sheet .kcb-tag").first()).toBeVisible();
  await shot(page, info, "23-bilan-questionnaires");
  await page.evaluate(() => KineCabinet.qSend("sane"));
  await expect(page.locator("#kcb-sheet .kq-item.pend")).toHaveCount(1);
  // le patient se relie, voit la carte, répond
  await page.evaluate(() => { KineCabinet.close(); window.fbUser = null; showPage("suivi"); KineMonSuivi.join(); });
  await page.fill("#kms-code", "K7M2QX");
  await page.evaluate(() => KineMonSuivi.doJoin());
  await expect(page.locator("#kms-sheet .seq-btn-main")).toHaveText("Oui, sauvegarder");
  await page.evaluate(() => KineMonSuivi.consent(0));
  await expect(page.locator("#kms-sheet .kq-pcard")).toBeVisible();
  await page.locator("#kms-sheet .kq-pcard").click();
  await expect(page.locator("#kq-sheet.open .kq-intro")).toBeVisible();
  await page.locator("#kq-sheet .seq-btn-main").click();
  await expect(page.locator("#kq-sheet .kq-q")).toContainText("ton épaule");
  await page.evaluate(() => KineQuest.set("n", 70));
  await shot(page, info, "24-questionnaire-patient");
  await page.locator("#kq-next").click();
  await expect(page.locator("#kq-sheet .kq-end")).toBeVisible();
  await expect(page.locator("#kq-sheet .kq-sum b")).toHaveText("70/100");
  await page.locator("#kq-sheet .seq-btn-main").click();
  // retour automatique dans la fiche du kiné et dans le bilan suivant
  await page.evaluate((pid) => { KineMonSuivi.close(); window.fbUser = { uid: "k1", isAdmin: true, name: "Kiné" }; KineCabinet.fiche(pid); }, pid);
  await expect(page.locator("#kcb-sheet .kq-card")).toContainText("Note globale : 70/100");
  await page.evaluate(() => KineCabinet.bilan());
  await expect(page.locator("#kcb-sheet input[data-m=sane][data-s=a][data-i='0']")).toHaveValue("70");
  await expect(page.locator("#kcb-sheet .kcb-tagq")).toHaveCount(1);
  await clean(errs);
});

test("kiné ou patient : premier lancement, demande d'accès et acceptation", async ({ page }, info) => {
  const errs = []; page.on("pageerror", e => errs.push(String(e.message || e)));
  await page.addInitScript(() => { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-masc-off", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); });
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  // nouveau téléphone : l'écran de choix s'ouvre
  await expect(page.locator("#kf-role.open .krl-card")).toHaveCount(2, { timeout: 8000 });
  await shot(page, info, "22-role-choix");
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
  await page.evaluate(() => KineRole.pick("patient"));
  await expect(page.locator("#kf-role .krl-row")).toHaveCount(3);
  await page.evaluate(() => KineRole.demande());
  await page.fill("#krl-prenom", "Samir"); await page.fill("#krl-nom", "Benali"); await page.check("#krl-ok");
  await page.evaluate(() => KineRole.send());
  await expect(page.locator("#kms-slot .kms-wait")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("kf-role"))).toBe("patient");
  // le kiné accepte
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true }; KineCabinet.open(); });
  await expect(page.locator("#kcb-sheet .kcb-dem")).toBeVisible();
  await expect(page.locator("#kcb-sheet .kcb-tabs button")).toHaveCount(5);
  await page.evaluate(() => KineCabinet.demandes());
  await expect(page.locator("#kcb-sheet .kcb-pat")).toHaveCount(1);
  await page.evaluate(() => { KineCabinet.accept("anonP"); KineCabinet.set("parcours", "sfp"); KineCabinet.saveForm(null); });
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible();
  expect(await page.evaluate(() => Object.keys(window.__db.demandes).length)).toBe(0);
  // le téléphone du patient se relie tout seul
  await page.evaluate(() => { KineCabinet.close(); window.fbUser = null; return KineMonSuivi.refresh(true); });
  expect(await page.evaluate(() => !!JSON.parse(localStorage.getItem("kf-cab") || "{}").pid)).toBe(true);
  // sauvegarde avec Google, puis on le retrouve après avoir « supprimé » l'appli
  const pid = await page.evaluate(() => JSON.parse(localStorage.getItem("kf-cab")).pid);
  await page.evaluate(() => { KineRole.hub(); KineRole.saveGoogle(); });
  await expect(page.locator("#kf-hub .kcb-ok")).toContainText("samir@gmail.com");
  await page.evaluate(() => { KineRole.hubClose(); localStorage.removeItem("kf-cab"); KineRole.hub(); KineRole.restoreGoogle(); });
  await expect.poll(() => page.evaluate(() => (JSON.parse(localStorage.getItem("kf-cab") || "{}")).pid)).toBe(pid);
  await clean(errs);
});

test("mon espace : bouton toujours visible, code du kiné dans Progrès", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  await expect(page.locator("#kf-me")).toBeVisible();
  await page.evaluate(() => showPage("suivi"));
  await expect(page.locator("#page-suivi #kms-join-row")).toBeVisible();
  await page.locator("#kf-me").click();
  await expect(page.locator("#kf-hub.open .khb-seg button")).toHaveCount(2);
  await shot(page, info, "23-mon-espace");
  await clean(errs);
});

test("sauvegarde : identifiant, journal des séances à la maison et récupération", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
  // le kiné crée la fiche et le code, le patient se relie et accepte la sauvegarde des séances
  await page.evaluate(async () => { window.fbUser = { uid: "k1", isAdmin: true }; const id = await fbCab.create({ alias: "S.B.", parcours: "genou", etape: 0, cote: "D", date0: "2026-10-01" }); await fbCab.code(id); window.fbUser = null; KineMonSuivi.join(); });
  await page.fill("#kms-code", "K7M2QX");
  await page.evaluate(() => KineMonSuivi.doJoin());
  await expect(page.locator("#kms-sheet .seq-btn-main")).toHaveText("Oui, sauvegarder");
  await page.evaluate(() => { localStorage.setItem("kf-sessions", JSON.stringify([{ id: 11, ts: 11, date: "2026-10-27", seance: "J1 — Membres inférieurs", borg: 3, douleur: 2, duree: 30 }])); sessions = JSON.parse(localStorage.getItem("kf-sessions")); KineMonSuivi.consent(1); });
  await expect.poll(() => page.evaluate(() => { const p = Object.values(window.__db.patients)[0]; return p.journal && p.journal["2026-10"] && p.journal["2026-10"].s.length; })).toBe(1);
  // identifiant et mot de passe
  await page.evaluate(() => { KineMonSuivi.close(); KineRole.loginForm("create"); });
  await page.fill("#kl-id", "samir.b"); await page.fill("#kl-pw", "secret12");
  await page.evaluate(() => KineRole.loginGo("create"));
  await expect(page.locator("#kf-hub .kcb-ok")).toContainText("samir.b");
  // le kiné voit le détail
  await page.evaluate(() => { KineRole.hubClose(); window.fbUser = { uid: "k1", isAdmin: true }; KineCabinet.fiche(Object.keys(window.__db.patients)[0]); });
  await expect(page.locator("#kcb-sheet .kcb-jh")).toBeVisible();
  // nouveau téléphone : tout est effacé, puis retrouvé avec l'identifiant
  await page.evaluate(() => { KineCabinet.close(); window.fbUser = null; ["kf-cab", "kf-sessions", "kf-cab-jh"].forEach(k => localStorage.removeItem(k)); sessions = []; KineRole.loginForm("restore"); });
  await page.fill("#kl-id", "samir.b"); await page.fill("#kl-pw", "mauvais1");
  await page.evaluate(() => KineRole.loginGo("restore"));
  await expect(page.locator("#kf-hub .kcb-alert")).toContainText("incorrect");
  await page.fill("#kl-pw", "secret12");
  await page.evaluate(() => KineRole.loginGo("restore"));
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("kf-sessions") || "[]").length)).toBe(1);
  expect(await page.evaluate(() => !!JSON.parse(localStorage.getItem("kf-cab") || "{}").pid)).toBe(true);
  await clean(errs);
});

test("nouveaux exercices et schémas animés", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  const ok = await page.evaluate(() => ["Rentrer le menton", "Pendulaire de Codman", "Spanish squat à l'élastique", "Pied court", "Planche Copenhague", "Copenhague dynamique genou", "Extension en appui sur les mains", "Reverse Nordic", "Coquillage à l'élastique", "Torsion de serviette", "Se relever du sol", "Regard fixe en tournant la tête"]
    .every(n => KineBiblio.find(n) && KineAvatar.supports(n)));
  expect(ok).toBe(true);
  // Exercices du genou : animation, fiche, usage, et chaque exercice des parcours genou existe
  const g = await page.evaluate(() => {
    const miss = KineGenouEx.names.filter(n => !(KineBiblio.find(n) && KineAvatar.supports(n) && KineIdees.USAGE[n]));
    KineParcours.list().forEach(({ id: pid }) => (KineParcours.get(pid).etapes || []).forEach((e, i) => KineParcours.exos(pid, i, {}).forEach(n => { if (!KineBiblio.find(n)) miss.push(pid + ":" + n); })));
    return { miss, nb: KineGenouEx.names.length };
  });
  expect(g.miss).toEqual([]); expect(g.nb).toBe(26);
  // Cheville et pied : exercices animés, parcours, guide d'orientation et t-shirt de Yass
  const c = await page.evaluate(() => {
    const miss = KineChevilleEx.names.filter(n => !(KineBiblio.find(n) && KineAvatar.supports(n) && KineIdees.USAGE[n]));
    const zones = KineParcours.ZONES.map(z => KineParcours.ORDER.filter(id => KineParcours.P[id].zone === z[0]).length);
    const piste = KineParcours.guide({ trauma: "inversion", zone: "ext", tests: ["tiroir"] }, "cheville").pistes[0];
    const rupt = KineParcours.guide({ trauma: "impulsion", tests: ["thompson"] }, "cheville").pistes[0];
    KineAvatar.setShirt(["Yasser", "Ladraa"]); const t1 = KineAvatar.shirt(); KineAvatar.setShirt(null);
    return { miss, nb: KineChevilleEx.names.length, zones, piste: piste && piste.parcours, rupt: rupt && rupt.parcours, t1, t2: KineAvatar.shirt(), al: KineParcours.alertes("entorse")[0].slice(0, 20) };
  });
  expect(c.miss).toEqual([]); expect(c.nb).toBe(23); expect(c.zones).toEqual([10, 7, 8, 6, 4]);
  expect(c.piste).toBe("entorse"); expect(c.rupt).toBe("rupt_achille");
  expect(c.t1).toEqual(["Yasser", "Ladraa"]); expect(c.t2).toBe(null); expect(c.al).toBe("Impossible de faire ");
  // Épaule : exercices animés, 8 parcours, guide avec tests conseillés
  const e = await page.evaluate(() => {
    const miss = KineEpauleEx.names.filter(n => !(KineBiblio.find(n) && KineAvatar.supports(n) && KineIdees.USAGE[n]));
    const g = KineParcours.guide({ trauma: "progressif", zone: "antlat" }, "epaule");
    const g2 = KineParcours.guide({ trauma: "progressif", zone: "antlat", neg: ["hawkins"] }, "epaule");
    return { miss, nb: KineEpauleEx.names.length, n: KineParcours.ORDER.filter(id => KineParcours.P[id].zone === "epaule").length, p: g.pistes[0].parcours, sug: g.suggest.map(x => x.t), s1: g.pistes[0].score, s2: g2.pistes[0] ? g2.pistes[0].score : 0, sug2: g2.suggest.map(x => x.t) };
  });
  expect(e.miss).toEqual([]); expect(e.nb).toBe(15); expect(e.n).toBe(8); expect(e.p).toBe("coiffe");
  expect(e.sug).toContain("hawkins"); expect(e.s2).toBeLessThan(e.s1); expect(e.sug2).not.toContain("hawkins");
  // Hanche et rachis : exercices animés, guides
  const h = await page.evaluate(() => {
    const miss = KineHancheDosEx.names.filter(n => !(KineBiblio.find(n) && KineAvatar.supports(n) && KineIdees.USAGE[n]));
    return { miss, nb: KineHancheDosEx.names.length,
      fess: KineParcours.guide({ zone: "lat", tests: ["sls30"] }, "hanche").pistes[0].parcours,
      cox: KineParcours.guide({ age: "50", zone: "aine", tests: ["rilim"] }, "hanche").pistes[0].parcours,
      sci: KineParcours.guide({ zone: "lombjambe", signes: ["jambe"] }, "rachis").pistes[0].parcours,
      ncb: KineParcours.guide({ zone: "coubras", tests: ["spurling", "distraction"] }, "rachis").pistes[0].parcours };
  });
  expect(h.miss).toEqual([]); expect(h.nb).toBe(22);
  expect([h.fess, h.cox, h.sci, h.ncb]).toEqual(["tendino_fess", "coxarthrose", "sciatique", "nevralgie_cb"]);
  // Renforcement exigeant : 52 exercices animés, présents à la fin des parcours, sans pliométrie pour les parcours arthrose
  const rf = await page.evaluate(() => ({ nb: KineRenfoEx.names.length, all: KineRenfoEx.all.length,
    miss: KineRenfoEx.names.filter(n => !(KineBiblio.find(n) && KineIdees.USAGE[n])),
    lca: KineParcours.exos("lca_op", 5, {}).indexOf("Saut en contrebas puis rebond (drop jump)") >= 0,
    ptg: KineParcours.exos("ptg", 2, {}).filter(n => /Saut|pistol|Nordic/.test(n)).length }));
  expect(rf.nb).toBe(52); expect(rf.all).toBe(52); expect(rf.miss).toEqual([]); expect(rf.lca).toBe(true); expect(rf.ptg).toBe(0);
  await page.evaluate(() => KineBiblio.open("cou")); await page.waitForTimeout(800);
  await expect(page.locator(".kf-sheet.open").getByText("Rentrer le menton").first()).toBeVisible();
  await page.evaluate(() => { document.querySelectorAll(".kf-sheet.open").forEach(e => e.classList.remove("open")); KineBiblio.demo("Rentrer le menton"); });
  await page.waitForTimeout(3000);
  if (await page.evaluate(() => !!window.THREE)) await expect(page.locator(".kf-aid[data-aid='chin']")).toBeVisible();
  await shot(page, info, "9-nouvel-exercice");
  await clean(errs);
});

test("test de saut au téléphone et réception sur signal", async ({ page }, info) => {
  const errs = []; await setup(page, errs);
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.goto("index.html"); await expect(page.locator("#kf-splash")).toBeHidden({ timeout: 12000 });
  await page.addScriptTag({ path: require("path").join(__dirname, "cabinet-mock.js") });
  await page.addScriptTag({ path: require("path").join(__dirname, "saut-sim.js") });
  await page.evaluate(() => { window.fbUser = { uid: "k1", isAdmin: true, name: "Kiné" }; KineCabinet.open(); });
  await expect(page.locator("#kcb-sheet .kcb-fab")).toBeVisible();
  await page.evaluate(() => { KineCabinet.setKine(); KineCabinet.nouveau(); });
  await page.fill("#kcb-alias", "J.S.");
  await page.evaluate(() => { KineCabinet.set("parcours", "lca_op"); KineCabinet.saveForm(null); });
  await expect(page.locator("#kcb-sheet .kcb-code")).toBeVisible();
  const pid = await page.evaluate(() => Object.keys(window.__db.patients)[0]);
  await page.evaluate((pid) => KineCabinet.fiche(pid), pid);
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible();
  await page.evaluate(() => KineCabinet.bilan());
  await expect(page.locator("input[data-m=hopv][data-s=a][data-i='0']")).toHaveCount(1);
  // saut vertical sur une jambe : 3 essais détectés, hauteur calculée à partir du temps de vol
  await page.evaluate(() => { KineCabinet.saut("hopv", "a"); KineSaut.begin(); });
  await expect(page.locator("#ks-test .kcb-ang")).toHaveText("Prêt");
  for (const tf of [0.36, 0.4, 0.38]) {
    await page.evaluate((tf) => { KineSaut._feed(sautSim([{ tf }])); }, tf);
    await expect(page.locator("#ks-test .kcb-ang.big")).toContainText("cm");
    if (tf !== 0.38) await page.evaluate(() => KineSaut.begin());
  }
  await shot(page, info, "40-test-saut");
  await page.evaluate(() => KineSaut.use());
  const v = await page.evaluate(() => [0, 1, 2].map(i => +document.querySelector("input[data-m=hopv][data-s=a][data-i='" + i + "']").value.replace(",", ".")));
  expect(v[1]).toBeGreaterThan(19); expect(v[1]).toBeLessThan(21.5); expect(v[0]).toBeLessThan(v[1]);
  // sauts répétés : RSI et temps de contact
  await page.evaluate(() => { KineCabinet.saut("rsi", "a"); KineSaut.begin();
    const js = []; for (let i = 0; i < 10; i++) js.push({ tf: 0.42, tc: 0.21, rebound: true });
    KineSaut._feed(sautSim(js)); });
  await expect(page.locator("#ks-test .ks-c")).toContainText("RSI");
  await page.evaluate(() => KineSaut.use());
  const r = await page.evaluate(() => ({ rsi: +document.querySelector("input[data-m=rsi][data-s=a][data-i='0']").value.replace(",", "."), tc: +document.querySelector("input[data-m=tcs][data-s=a][data-i='0']").value }));
  expect(r.rsi).toBeGreaterThan(0.9); expect(r.rsi).toBeLessThan(1.25); expect(r.tc).toBeGreaterThan(180); expect(r.tc).toBeLessThan(250);
  // réception sur signal : réglages, puis la jambe s'affiche pendant le saut
  const lib = await page.evaluate(() => ({ e: !!(KineBiblio.find("Réception sur signal") || {}).reactif, lca: KineParcours.exos("lca_op", KineParcours.P.lca_op.etapes.length - 1, {}).indexOf("Réception sur signal") >= 0 }));
  expect(lib).toEqual({ e: true, lca: true });
  await page.evaluate(() => { document.querySelectorAll(".kf-sheet.open").forEach(e => e.classList.remove("open")); KineReactif.open("signal"); });
  await expect(page.locator("#kr-sheet .kr-svg")).toBeVisible();
  await page.waitForTimeout(1500);
  await shot(page, info, "41-reception-signal");
  await page.evaluate(() => { KineReactif._set("sig", "tot"); KineReactif.start(); });
  await expect(page.locator("#kr-run .kr-sig")).toBeVisible({ timeout: 9000 });
  await shot(page, info, "42-signal-en-cours");
  await page.evaluate(() => KineReactif.stop());
  // le kiné envoie le test de saut ; le patient le fait chez lui ; les hauteurs reviennent dans le bilan avec la symétrie
  await page.evaluate((pid) => { KineReactif.close(); KineCabinet.fiche(pid); }, pid);
  await expect(page.locator("#kcb-sheet .kcb-slab")).toBeVisible();
  await page.evaluate(() => KineCabinet.bilan());
  await expect(page.locator("#kcb-sheet #kcb-bd")).toHaveCount(1);
  await page.evaluate(() => KineCabinet.qSend("saut"));
  await expect(page.locator("#kcb-sheet .kq-item.pend")).toHaveCount(1);
  await page.evaluate(() => { KineCabinet.close(); window.fbUser = null; showPage("suivi"); KineMonSuivi.join(); });
  await page.fill("#kms-code", "K7M2QX");
  await page.evaluate(() => KineMonSuivi.doJoin());
  await page.evaluate(() => KineMonSuivi.consent(0));
  await expect(page.locator("#kms-sheet .kq-pcard")).toContainText("test de saut");
  await page.locator("#kms-sheet .kq-pcard").click();
  await expect(page.locator("#kq-sheet.open .kq-intro")).toBeVisible();
  await shot(page, info, "43-saut-patient-intro");
  await page.locator("#kq-sheet .seq-btn-main").click();
  for (const tf of [[0.4, 0.42], [0.36, 0.38]]) {   // jambe droite (atteinte) puis gauche
    await expect(page.locator("#kq-sheet .kq-q")).toContainText("Saut vertical");
    await page.locator("#kq-next").click();
    for (const t of tf) { await page.evaluate((t) => { KineSaut.begin(); KineSaut._feed(sautSim([{ tf: t }])); }, t); await expect(page.locator("#ks-test .kcb-ang.big")).toContainText("cm"); }
    await page.evaluate(() => KineSaut.use());
    await expect(page.locator("#kq-sheet .kq-sum b")).toContainText("cm");
    if (tf[0] === 0.4) await shot(page, info, "44-saut-patient-mesure");
    await page.locator("#kq-next").click();
  }
  await page.locator("#kq-sheet .kq-skip").click();
  await page.locator("#kq-sheet .kq-skip").click();
  await expect(page.locator("#kq-sheet .kq-end")).toBeVisible();
  await expect(page.locator("#kq-sheet .kq-sum b")).toContainText("Symétrie");
  await page.locator("#kq-sheet .seq-btn-main").click();
  await page.evaluate((pid) => { KineMonSuivi.close(); window.fbUser = { uid: "k1", isAdmin: true, name: "Kiné" }; KineCabinet.fiche(pid); }, pid);
  await expect(page.locator("#kcb-sheet .kq-card")).toContainText("Test de saut : Symétrie");
  await page.evaluate(() => KineCabinet.bilan());
  const hv = await page.evaluate(() => ["a", "s"].map(sd => +document.querySelector("#kcb-sheet input[data-m=hopv][data-s=" + sd + "][data-i='0']").value.replace(",", ".")));
  expect(hv[0]).toBeGreaterThan(hv[1]);
  await clean(errs);
});
