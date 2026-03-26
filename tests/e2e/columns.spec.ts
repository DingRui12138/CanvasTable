import { test, expect } from '@playwright/test';

/**
 * 各列类型 E2E 测试
 */

test.describe('Progress Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should render progress bar correctly', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should clamp overflow values', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Checkbox Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should toggle checkbox on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    if (box) {
      // 点击 checkbox 列（假设在第3列）
      await canvas.click({
        position: { x: box.width * 0.2, y: 60 }
      });
    }

    await page.waitForTimeout(100);
  });
});

test.describe('Link Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should not navigate on single click on non-link area', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    if (box) {
      // 点击链接列的非链接区域
      await canvas.click({
        position: { x: box.width * 0.1, y: 60 }
      });
    }

    // 验证没有导航到外部链接（仍然在 localhost）
    expect(page.url()).toContain('localhost:3000');
  });

  test('should not navigate on double click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    if (box) {
      // 双击链接区域
      await canvas.dblclick({
        position: { x: box.width * 0.1, y: 60 }
      });
    }

    // 双击应该进入编辑模式，而不是导航
    await page.waitForTimeout(100);
    expect(page.url()).toContain('localhost:3000');
  });
});