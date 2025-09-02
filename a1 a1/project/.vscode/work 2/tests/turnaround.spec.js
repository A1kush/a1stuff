const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

function fileUrl(relPath){
  const abs = path.resolve(__dirname, '..', relPath);
  return pathToFileURL(abs).toString();
}

test('turn-around test passes (shoots left)', async ({ page }) => {
  const url = fileUrl(path.join('a1 a1', 'a1 last update.html')) + '?dev=1&test=1';
  const logs = [];
  page.on('console', msg => { const t = msg.text(); logs.push(t); console.log(t) });
  await page.goto(url);
  // wait a bit for the test to run and assert
  await page.waitForTimeout(1500);
  const pass = logs.some(t => /\[TEST\]\s*Turn-around:\s*PASS/i.test(t) || /PASS:\s*Shot left/i.test(t));
  const fail = logs.some(t => /\[TEST\]\s*Turn-around:\s*FAIL/i.test(t) || /FAIL:\s*Did not shoot left/i.test(t));
  // Save a screenshot for inspection
  await page.screenshot({ path: path.resolve(__dirname, '..', 'test-artifacts', 'turnaround.png'), fullPage: true });
  expect(fail).toBeFalsy();
  expect(pass).toBeTruthy();
});


