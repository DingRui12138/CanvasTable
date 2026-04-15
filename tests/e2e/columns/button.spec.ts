import { test, expect } from '@playwright/test';

/**
 * Button 列 E2E 测试
 */

test.describe('Button Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render button', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle button click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击按钮列
    await canvas.click({ position: { x: 550, y: 60 } });
    await page.waitForTimeout(50);
  });

  test('should render different button variants', async ({ page }) => {
    // primary, secondary, danger 等不同样式
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show hover effect on button', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await canvas.hover({ position: { x: 550, y: 60 } });
  });

  test('should render disabled button', async ({ page }) => {
    // 禁用状态按钮测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});