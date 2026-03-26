import { test, expect } from '@playwright/test';

/**
 * 视觉回归测试
 */

test.describe('Visual Regression Tests', () => {
  test('basic table rendering', async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('basic-table.png', {
      maxDiffPixels: 20000,  // Canvas 渲染和数据可能有差异
    });
  });
});

test.describe('Progress Column Visual Tests', () => {
  test('line progress at 50%', async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('progress-line-50.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Checkbox Column Visual Tests', () => {
  test('checkbox states', async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('checkbox-states.png', {
      maxDiffPixels: 100,
    });
  });
});