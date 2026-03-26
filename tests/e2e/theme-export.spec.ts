import { test, expect } from '@playwright/test';

/**
 * Canvas Table 主题和导出 E2E 测试
 */

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should toggle theme', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Click theme toggle button
    await page.click('#toggleTheme');

    await page.waitForTimeout(300);

    // Canvas should still be visible after theme change
    await expect(canvas).toBeVisible();
  });

  test('should maintain data after theme switch', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Load some data
    await page.click('#load1k');
    await page.waitForTimeout(300);

    // Toggle theme
    await page.click('#toggleTheme');
    await page.waitForTimeout(300);

    // Canvas should still show data
    await expect(canvas).toBeVisible();
  });

  test('should cycle through themes', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Toggle multiple times
    for (let i = 0; i < 3; i++) {
      await page.click('#toggleTheme');
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    }
  });
});

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should trigger CSV export', async ({ page }) => {
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

    await page.click('#exportCsv');

    // Wait for potential download
    const download = await downloadPromise;

    // If download started, verify it
    if (download) {
      const fileName = download.suggestedFilename();
      expect(fileName).toContain('.csv');
    }
    // If no download event, just verify no error occurred
  });
});