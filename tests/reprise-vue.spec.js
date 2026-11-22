const { test, expect } = require('@playwright/test');
async function boot(page) {
  await page.addInitScript(() => { localStorage.setItem("kf-install-never", "1"); localStorage.setItem("kf-masc-off", "1"); sessionStorage.setItem("kf-ressenti-later", "1"); });
  await page.route(/firebase|gstatic|googleapis/, r => r.abort());
  await page.addInitScript(() => { window.__vib = []; navigator.vibrate = (p) => { window.__vib.push(p); return true; }; });
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
  await expect(page.locator("#krp-q h2")).toContainText("Quelques mesures");
  await page.fill("#krq-age", "40"); await page.fill("#krq-kg", "88"); await page.fill("#krq-cm", "170");
  await page.screenshot({ path: "/tmp/ra-mes.png" });
  await page.locator("#krp-q .seq-btn-main").click();
  await expect(page.locator("#krp-q h2")).toContainText("Ton cœur");
  await page.locator("#krp-q .seq-btn-main").click();
  await page.locator("#krp-q .krq-opts button", { hasText: "Non" }).click();
  await expect(page.locator("#krp-q h2")).toContainText("allure de reprise");
  await expect(page.locator("#krp-q .krq-z > b")).toHaveText("115 à 137 battements par minute");
  await expect(page.locator("#krp-q .krq-n")).toContainText("30,4");
  await expect(page.locator("#krp-q .krq-res b").first()).toHaveText("8,5 km/h");
  await page.screenshot({ path: "/tmp/ra-q2.png" });
  await page.locator("#krp-q .krq-z summary").click(); await page.evaluate(() => document.querySelector("#krp-q").scrollTo(0, 99999)); await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/ra-q3.png" });
  await expect(page.locator("#krq-tell")).toBeChecked();
  await page.locator("#krp-q .seq-btn-main").click();
  expect(await page.evaluate(() => KineReprise.prof().v)).toBe(8.5);
  const msg = await page.evaluate(() => { const P = window.__db.patients[Object.keys(window.__db.patients)[0]]; return P.msgs[0]; });
  expect(msg.txt).toContain("8,5 km/h"); expect([msg.p.v, msg.p.age, msg.p.z, msg.p.niv, msg.p.vit]).toEqual([8.5, 40, "115-137", "r", 10]);
  // 2. écran de départ
  await page.evaluate(() => KineReprise.go()); await page.waitForTimeout(400);
  await expect(page.locator("#krp-start")).toBeVisible();
  await page.screenshot({ path: "/tmp/ra-pre.png" });
  await page.locator(".krp-seg button", { hasText: "GPS du téléphone" }).click();
  await page.evaluate(() => { window.__geo = null; navigator.geolocation.watchPosition = function (ok) { window.__geo = ok; return 1; }; navigator.geolocation.clearWatch = function () {}; });
  await page.screenshot({ path: "/tmp/ra-pre2.png" });
  await expect(page.locator(".krp-know")).toContainText("s'arrête quand l'écran se verrouille");
  await page.evaluate(() => { document.querySelector("#krp-run .krp-pre").scrollTo(0, 99999); }); await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/ra-pre3.png" });
  await page.evaluate(() => { document.querySelector("#krp-run .krp-pre").scrollTo(0, 0); });
  await page.locator("#krp-start").click();
  await expect(page.locator("#krp-run .krp-big b")).toHaveText("Marche vite");
  await page.evaluate(() => { KineReprise._skip(); KineReprise._skip(); });
  await expect(page.locator("#krp-run .krp-big b")).toHaveText("Cours");
  await expect(page.locator("#krp-run .krp-v strong")).toHaveText("8,5");
  await page.evaluate(() => { const t0 = Date.now(); for (let i = 0; i < 8; i++) window.__geo({ coords: { latitude: 50 + i * 2 * 2.78 / 111320, longitude: 3, accuracy: 5 }, timestamp: t0 + i * 2000 }); });
  await expect(page.locator("#krp-g")).toContainText("Un peu trop vite");
  await expect(page.locator("#krp-g")).toContainText("10");
  await page.waitForTimeout(700);
  await page.screenshot({ path: "/tmp/ra-run.png" });
  await page.screenshot({ path: "/tmp/ra-run2.png" });
  let lat0 = 50 + 7 * 2 * 2.78 / 111320, tEnd = Date.now() + 30000;
  for (const [nm, kmh] of [["ok", 8.5], ["lent", 5.5]]) {
    await page.evaluate(([kmh, lat0, T]) => { const d = kmh / 3.6 * 2 / 111320; for (let i = 1; i <= 12; i++) window.__geo({ coords: { latitude: lat0 + i * d, longitude: 3, accuracy: 5 }, timestamp: T + i * 2000 }); }, [kmh, lat0, tEnd]);
    lat0 += 12 * kmh / 3.6 * 2 / 111320; tEnd += 24000;
    await page.waitForTimeout(2200); await page.screenshot({ path: "/tmp/ra-piste-" + nm + ".png" });
  }
  await page.locator(".krp-lnk", { hasText: "Mode poche" }).click();
  await expect(page.locator("#krp-poche.open")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.__vib || []))).toContain("[700]");   // trop lent : vibration lente
  await page.evaluate(([la, T]) => { const d = 12 / 3.6 * 2 / 111320; KineReprise._run().lastVib = 0; for (let i = 1; i <= 12; i++) window.__geo({ coords: { latitude: la + i * d, longitude: 3, accuracy: 5 }, timestamp: T + i * 2000 }); }, [lat0, tEnd]);
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.__vib || []))).toContain("[70,50,70,50,70,50,70]");   // trop vite : vibrations rapides
  await expect(page.locator("#krp-pt")).toContainText("Course");
  await page.locator("#krp-pw").click();   // un simple toucher ne réveille pas
  await expect(page.locator("#krp-poche.open")).toBeVisible();
  const bb = await page.locator("#krp-pw").boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(2100); await page.mouse.up();
  await expect(page.locator("#krp-poche.open")).toHaveCount(0);
  // 3. ralentir en direct
  await page.locator(".krp-slow").click();
  await expect(page.locator("#krp-run .krp-v strong")).toHaveText("8");
  await page.locator(".krp-slow").click();
  await expect(page.locator("#krp-run .krp-v strong")).toHaveText("7,5");
  await page.screenshot({ path: "/tmp/ra-slow.png" });
  for (let i = 0; i < 14; i++) { if (await page.locator("#krp-run .krp-end").count()) break; await page.evaluate(() => KineReprise._skip()); }
  await page.screenshot({ path: "/tmp/ra-end.png" });
  await page.fill("#krp-hr", "150");
  await page.locator("#krp-run .krp-scale button", { hasText: "1" }).first().click();
  const r = await page.evaluate(() => JSON.parse(localStorage.getItem("kf-runs")).pop());
  expect([r.v0, r.v1, r.slow]).toEqual([8.5, 7.5, 2]);
  expect([r.hr, r.hz, r.hot]).toEqual([150, "115-137", 1]);
  expect(await page.evaluate(() => KineReprise.prof().v)).toBe(7);   // 7,5 puis encore 0,5 : cœur au-dessus de la zone
  // 4. ralenti deux fois : on ne monte pas de palier, même sans douleur
  const e = await page.evaluate(() => { const c = { id: "x", d: 3, max: 3, f: 3 }; return [KineReprise.etat(c, [{ cid: "x", rp: 3, d: "2026-10-01", pain: 1, next: 1, slow: 2 }]).palier, KineReprise.etat(c, [{ cid: "x", rp: 3, d: "2026-10-01", pain: 1, next: 1, slow: 1 }]).palier]; });
  expect(e).toEqual([3, 4]);
  const z = await page.evaluate(() => [KineReprise.hrOf({ age: 40 }), KineReprise.hrOf({ age: 40, hrr: 60 }), KineReprise.hrOf({ age: 40, hrm: 190 }), KineReprise.hrOf({ age: 40, coeur: "oui" })]);
  expect([z[0].mx, z[0].lo, z[0].hi, z[1].lo, z[1].hi, z[2].mx, z[3]]).toEqual([180, 115, 137, 108, 131, 190, null]);
  expect(errs).toEqual([]);
});
