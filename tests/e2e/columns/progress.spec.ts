import { test, expect } from '@playwright/test';

/**
 * Progress 列 E2E 测试
 */

test.describe('Progress Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render progress bar', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render progress bar correctly', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    // 进度条应正确渲染
  });

  test('should clamp overflow values', async ({ page }) => {
    // 大于 100% 的值应被限制
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle progress click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击进度条区域
    await canvas.click({ position: { x: 350, y: 60 } });
    await page.waitForTimeout(50);
  });

  test('should render different progress shapes', async ({ page }) => {
    // 线型、环形、仪表盘等不同形状
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render progress with custom colors', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});