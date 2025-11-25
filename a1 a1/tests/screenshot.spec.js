import { test, expect } from '@playwright/test';

test.use({ headless: true });

test('take screenshot', async ({ page }) => {
  page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', error => {
    console.log(`ERROR: ${error.message}`);
  });
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`FAILED request: ${response.url()} ${response.status()}`);
    }
  });
  await page.goto('http://localhost:8000/index.html');
  await page.waitForTimeout(10000); // wait for 10 seconds
  await page.screenshot({ path: 'screenshot.png' });
});
