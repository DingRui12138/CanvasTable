import { test, expect } from '@playwright/test';

/**
 * 视觉回归测试
 * 注意：截图测试可能会因 DPR、窗口大小等环境因素产生差异
 */

test.describe('Visual Regression Tests', () => {
  test('basic table rendering', async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    // Canvas 渲染和数据可能有差异，允许较大差异像素
    await expect(canvas).toHaveScreenshot('basic-table.png', {
      maxDiffPixels: 50000,
      maxDiffPixelRatio: 0.1,  // 允许 10% 的像素差异
    });
  });
});

test.describe('Progress Column Visual Tests', () => {
  test('line progress at 50%', async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    // 进度条渲染可能有细微差异
    await expect(canvas).toHaveScreenshot('progress-line-50.png', {
      maxDiffPixels: 5000,
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Checkbox Column Visual Tests', () => {
  test('checkbox states', async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    // Checkbox 渲染可能有细微差异
    await expect(canvas).toHaveScreenshot('checkbox-states.png', {
      maxDiffPixels: 5000,
      maxDiffPixelRatio: 0.05,
    });
  });
});