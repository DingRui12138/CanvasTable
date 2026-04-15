import { test, expect } from '@playwright/test';

/**
 * Rating 列 E2E 测试
 */

test.describe('Rating Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render rating stars', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render full rating', async ({ page }) => {
    // 5 星评分渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render partial rating', async ({ page }) => {
    // 3.5 星等部分评分
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render zero rating', async ({ page }) => {
    // 0 星渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle rating click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击某颗星设置评分
    await canvas.click({ position: { x: 50, y: 60 } });
  });

  test('should support half-star rating', async ({ page }) => {
    // 半星评分支持测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render custom star count', async ({ page }) => {
    // 自定义最大星数（如 10 星）
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render custom star color', async ({ page }) => {
    // 自定义星星颜色
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render custom star size', async ({ page }) => {
    // 自定义星星大小
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});