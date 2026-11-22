const { test, expect } = require('@playwright/test');
test('glossaire : mot technique souligné, définition en appui prolongé, texte inchangé', async ({ page }) => {
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { try { localStorage.setItem('kf-onboarded', '1'); localStorage.setItem('kf-install-never', '1'); localStorage.setItem('kf-tour-v2', '1'); } catch (e) {} });
  await page.goto('/index.html');
  await page.waitForFunction(() => window.KineGlossaire);
  await page.waitForFunction(() => { const s = document.getElementById('kf-splash'); return !s || getComputedStyle(s).display === 'none' || getComputedStyle(s).visibility === 'hidden' || +getComputedStyle(s).opacity === 0; }, null, { timeout: 20000 });
  await page.evaluate(() => {
    const d = document.createElement('div'); d.id = 'gl-t'; d.style.cssText = 'position:fixed;top:120px;left:20px;z-index:6500;background:#fff;color:#000;padding:8px;width:300px';
    d.innerHTML = '<p id="gl-p">Allongé en décubitus dorsal, puis descente excentrique. Valgus du genou.</p>';
    document.body.appendChild(d);
  });
  await expect(page.locator('#gl-p .kf-def')).toHaveCount(3);
  expect(await page.locator('#gl-p').innerText()).toBe('Allongé en décubitus dorsal, puis descente excentrique. Valgus du genou.');
  const w = page.locator('#gl-p .kf-def').first();
  const b = await w.boundingBox();
  await page.mouse.move(b.x + 5, b.y + 5); await page.mouse.down(); await page.waitForTimeout(700);
  await expect(page.locator('.kf-defpop')).toContainText('Allongé sur le dos');
  await page.mouse.up();
  await page.mouse.click(300, 600);
  await expect(page.locator('.kf-defpop')).toHaveCount(0);
  // un tap court n'affiche rien
  await w.click(); await page.waitForTimeout(600);
  await expect(page.locator('.kf-defpop')).toHaveCount(0);
  expect(errs).toEqual([]);
});

test('lot 3 : les nouveaux exercices sont dans la bibliothèque, animés et expliqués', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('kf-onboarded', '1'); localStorage.setItem('kf-install-never', '1'); localStorage.setItem('kf-tour-v2', '1'); } catch (e) {} });
  await page.goto('/index.html');
  await page.waitForFunction(() => window.KineAvatar && window.KineBiblio && window.KineIdees);
  const r = await page.evaluate(() => ["Curl biceps à l'élastique", "Extension triceps à l'élastique", "Pompes diamant", "Contraction du cou en rotation contre la main"].map(n => ({ n, anim: KineAvatar.supports(n) && KineAvatar.hasSteps(n), fiche: !!KineBiblio.find(n), usage: !!(KineIdees.USAGE && KineIdees.USAGE[n]) })));
  r.forEach(x => { expect(x.anim, x.n + ' animé').toBeTruthy(); expect(x.fiche, x.n + ' fiche').toBeTruthy(); expect(x.usage, x.n + ' à quoi ça sert').toBeTruthy(); });
});
