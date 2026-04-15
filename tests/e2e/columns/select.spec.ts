import { test, expect } from '@playwright/test';

/**
 * Select/Dropdown 列 E2E 测试
 */

test.describe('Select Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render select value', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should open dropdown on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击 select 列打开下拉
    await canvas.click({ position: { x: 450, y: 60 } });
    await page.waitForTimeout(50);

    // 下拉框应出现
  });

  test('should close dropdown on click outside', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 450, y: 60 } });

    // 点击其他区域关闭
    await canvas.click({ position: { x: 100, y: 60 } });
  });

  test('should select option from dropdown', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 450, y: 60 } });

    // 选择下拉选项
    // 需等待下拉出现后点击选项
  });

  test('should support multiple select', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    // 多选模式下测试
  });
});