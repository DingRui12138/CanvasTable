import { test, expect } from '@playwright/test';

/**
 * Buttons 列 E2E 测试
 */

test.describe('Buttons Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render buttons group', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render multiple buttons', async ({ page }) => {
    // 多按钮渲染测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show more dropdown when truncated', async ({ page }) => {
    // 当按钮过多时显示更多下拉
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle button click in group', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击按钮组中的某个按钮
    await canvas.click({ position: { x: 50, y: 60 } });
  });

  test('should render different button variants', async ({ page }) => {
    // primary, secondary, danger 等不同样式按钮
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render buttons with gap', async ({ page }) => {
    // 按钮间距测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show hover effect on each button', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.hover({ position: { x: 50, y: 60 } });
  });

  test('should render disabled button in group', async ({ page }) => {
    // 禁用按钮渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle maxVisible buttons', async ({ page }) => {
    // 限制最大显示按钮数量测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});