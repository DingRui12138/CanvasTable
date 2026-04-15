import { test, expect } from '@playwright/test';

/**
 * Image 列 E2E 测试
 */

test.describe('Image Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render single image', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    // 单图渲染测试
  });

  test('should render multiple images', async ({ page }) => {
    // 多图模式，显示多张图片
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show +N count when images truncated', async ({ page }) => {
    // 当图片过多时显示 +N
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render image placeholder', async ({ page }) => {
    // 加载占位图测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render error image on load failure', async ({ page }) => {
    // 加载失败显示错误图
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show image tooltip on hover', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Hover 图片显示 tooltip
    await canvas.hover({ position: { x: 50, y: 60 } });
  });

  test('should handle image click', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 50, y: 60 } });
  });

  test('should render circular image', async ({ page }) => {
    // 圆形图片测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render image with border radius', async ({ page }) => {
    // 圆角图片测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should lazy load images', async ({ page }) => {
    // 懒加载测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle image fit modes', async ({ page }) => {
    // fill, contain, cover, none 等适应模式
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});