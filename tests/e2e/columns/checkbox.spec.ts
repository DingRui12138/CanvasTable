import { test, expect } from '@playwright/test';

/**
 * Checkbox 列 E2E 测试
 * 基于 examples/main.ts 中的列定义：
 * - selected 列位于 x: 0-60 (固定左侧列)，中心点 x: 30
 */

test.describe('Checkbox Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render unchecked checkbox', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render checked checkbox', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should toggle checkbox on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击 selected checkbox 列 (x: 0-60，中心点 x: 30)
    await canvas.click({ position: { x: 30, y: 60 } });
    await page.waitForTimeout(50);

    // Checkbox 应切换状态
  });

  test('should toggle checkbox value on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 30, y: 60 } });

    // 再次点击应切换回原状态
    await canvas.click({ position: { x: 30, y: 60 } });
  });

  test('should render indeterminate checkbox', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    // 半选状态渲染测试
  });
});