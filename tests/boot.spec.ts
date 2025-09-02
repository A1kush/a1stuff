import { test } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const gameUrl = pathToFileURL(path.resolve('a1 last update.html')).href;

test('boot logs', async ({ page }) => {
  page.on('pageerror', (e: any) => console.log('pageerror:', e.message, '\n', e.stack || 'no-stack'));
  page.on('console', (m) => console.log('console:', m.type(), m.text()));
  await page.goto(gameUrl);
  await page.waitForTimeout(1500);
});
