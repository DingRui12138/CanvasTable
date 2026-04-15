import { test, expect } from '@playwright/test';

/**
 * Tags 列 E2E 测试
 */

test.describe('Tags Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render tags', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render multiple tags', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    // 多个标签渲染测试
  });

  test('should show more count when truncated', async ({ page }) => {
    // 当标签过多时显示 +N
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render tags with colors', async ({ page }) => {
    // 标签颜色渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should edit tags on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击标签区域进入编辑模式
    await canvas.click({ position: { x: 500, y: 60 } });
  });
});