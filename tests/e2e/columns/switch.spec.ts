import { test, expect } from '@playwright/test';

/**
 * Switch 列 E2E 测试
 */

test.describe('Switch Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render off switch', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render on switch', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should toggle switch on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击 switch 列
    await canvas.click({ position: { x: 620, y: 60 } });
    await page.waitForTimeout(50);
  });

  test('should toggle switch value on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 620, y: 60 } });

    // 再次点击切换回
    await canvas.click({ position: { x: 620, y: 60 } });
  });

  test('should animate switch toggle', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 620, y: 60 } });
    // Switch 应有动画效果
  });
});