import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: { headless: false, viewport: { width: 1280, height: 720 } },
  reporter: 'list',
});
