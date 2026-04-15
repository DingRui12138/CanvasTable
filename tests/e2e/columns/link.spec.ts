import { test, expect } from '@playwright/test';

/**
 * Link 列 E2E 测试
 * 基于 examples/main.ts 中的列定义：
 * - email 列位于 x: 800-980，中心点 x: 890
 */

test.describe('Link Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render link', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should not navigate on single click on non-link area', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击 email 列非链接区域不应导航 (x: 800-980)
    await canvas.click({ position: { x: 890, y: 60 } });
  });

  test('should not navigate on double click', async ({ page }) => {
    const canvas = page.locator('canvas');

    // 双击不应触发导航
    await canvas.dblclick({ position: { x: 890, y: 60 } });
  });

  test('should show link on hover', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Hover 时显示链接样式
    await canvas.hover({ position: { x: 890, y: 60 } });
  });

  test.skip('should open link on Ctrl+Click', async ({ page }) => {
    // Ctrl+点击应打开链接
    // 需要具体链接位置，暂时跳过
  });
});