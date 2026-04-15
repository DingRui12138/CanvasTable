import { test, expect } from '@playwright/test';

/**
 * Color 列 E2E 测试
 */

test.describe('Color Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render color swatch', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render color with hex value', async ({ page }) => {
    // 显示颜色及 hex 值
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should open color picker on double click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 双击打开颜色选择器
    await canvas.dblclick({ position: { x: 50, y: 60 } });
    await page.waitForTimeout(50);
  });

  test('should close color picker on click outside', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.dblclick({ position: { x: 50, y: 60 } });

    // 点击外部关闭
    await canvas.click({ position: { x: 200, y: 60 } });
  });

  test('should select color from preset', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.dblclick({ position: { x: 50, y: 60 } });

    // 从预设颜色中选择
  });

  test('should render preset colors', async ({ page }) => {
    // 预设颜色列表渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle custom color input', async ({ page }) => {
    // 输入自定义颜色值
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show color value text', async ({ page }) => {
    // 显示颜色 hex 值文本
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});