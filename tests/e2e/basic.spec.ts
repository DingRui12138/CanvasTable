import { test, expect } from '@playwright/test';

/**
 * Canvas Table E2E 测试基础测试
 */

test.describe('Canvas Table Basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    // 等待表格渲染
    await page.waitForTimeout(500);
  });

  test('should render table canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render headers', async ({ page }) => {
    // 检查 canvas 是否有内容
    const canvas = page.locator('canvas');
    const boundingBox = await canvas.boundingBox();

    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);
  });
});

test.describe('Canvas Table Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should handle mouse click on canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    if (box) {
      // 点击表头下方第一行
      await canvas.click({
        position: { x: 100, y: 60 }
      });
    }

    // 等待可能的交互响应
    await page.waitForTimeout(100);
  });

  test('should handle scroll', async ({ page }) => {
    const canvas = page.locator('canvas');

    // 鼠标滚轮滚动
    await canvas.hover();
    await page.mouse.wheel(0, 100);

    await page.waitForTimeout(200);
  });
});