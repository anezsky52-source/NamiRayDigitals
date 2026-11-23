const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true });
  await page.addInitScript(() => { sessionStorage.setItem('nrd_studio_access', 'ok'); });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  try {
    const base = 'http://127.0.0.1:8000';
    await page.goto(base + '/custom-studio/project-memory/', { waitUntil: 'networkidle' });
    assert.equal(await page.title(), 'NamiRayDigitals — Project Memory & Character Library');

    for (const tab of ['characters', 'projects', 'environments', 'continuity', 'timeline', 'scriptwriter', 'director', 'intelligence', 'transfer']) {
      await page.locator('[data-tab="' + tab + '"]').click();
      assert.equal(await page.locator('#' + tab).isVisible(), true, 'tab should open: ' + tab);
    }

    await page.locator('[data-tab="scriptwriter"]').click();
    await page.locator('#writerProject').fill('Smoke Test Film');
    await page.locator('#writerAction').fill('Dua karakter bertemu di gerbang kota.');
    await page.locator('#writeScene').click();
    await page.locator('#writerOutput pre').waitFor();
    assert.match(await page.locator('#writerOutput pre').textContent(), /Smoke Test Film/);

    await page.locator('[data-tab="director"]').click();
    await page.locator('#directorProject').fill('Smoke Test Film');
    await page.locator('#directorMinutes').fill('1');
    await page.locator('#directorSceneSeconds').fill('10');
    await page.locator('#makePlan').click();
    await page.locator('#directorOutput .item').first().waitFor();
    assert.match(await page.locator('#directorOutput').innerText(), /Scene 1/);
    await page.locator('#savePlan').click();
    const timelineAfterPlan = await page.evaluate(() => JSON.parse(localStorage.getItem('nrd_production_timeline_v1') || '[]'));
    assert.equal(timelineAfterPlan.length, 6, 'one-minute plan at 10 seconds per scene should create 6 scenes');

    await page.locator('[data-tab="projects"]').click();
    await page.locator('#pName').fill('Smoke Test Film');
    await page.locator('#saveProject').click();
    await page.locator('#pStatusMsg').getByText(/tersimpan/).waitFor();

    await page.locator('[data-tab="characters"]').click();
    await page.locator('#cName').fill('Test Character');
    await page.locator('#saveChar').click();
    await page.locator('#cStatus').getByText(/tersimpan/).waitFor();

    await page.locator('[data-tab="environments"]').click();
    await page.locator('#eName').fill('Test Environment');
    await page.locator('#saveEnv').click();
    await page.locator('#eStatus').getByText(/tersimpan/).waitFor();

    await page.locator('[data-tab="continuity"]').click();
    await page.locator('#sProject').fill('Smoke Test Film');
    await page.locator('#sNumber').fill('1');
    await page.locator('#sSummary').fill('Karakter berdiri di gerbang kota.');
    await page.locator('#saveScene').click();
    await page.locator('#sStatus').getByText(/tersimpan/).waitFor();

    await page.locator('[data-tab="intelligence"]').click();
    await page.locator('#runAudit').click();
    await page.locator('#auditResults').waitFor();

    await page.locator('[data-tab="transfer"]').click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#exportAll').click()
    ]);
    assert.match(download.suggestedFilename(), /NamiRayDigitals-Project-Memory\.json/);

    await page.goto(base + '/custom-studio/creative-suite-agent/', { waitUntil: 'networkidle' });
    assert.match(await page.title(), /Creative Suite Agent/);

    await page.goto(base + '/studio.html', { waitUntil: 'networkidle' });
    assert.match(await page.title(), /NamiRayDigitals/);

    assert.deepEqual(errors, [], 'no uncaught browser JavaScript errors');
    console.log('PASS: project memory navigation, scriptwriter, director, timeline, project/character/environment/continuity saves, audit, backup download, creative suite and legacy Studio load.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
