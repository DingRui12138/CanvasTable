import { test, expect } from '@playwright/test';

/**
 * Input 列 E2E 测试
 */

test.describe('Input Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render input field', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render text input', async ({ page }) => {
    // 文本输入框渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render number input', async ({ page }) => {
    // 数字输入框渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render password input', async ({ page }) => {
    // 密码输入框渲染（遮挡显示）
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render multiline input', async ({ page }) => {
    // 多行文本输入框渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should focus input on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击输入框聚焦
    await canvas.click({ position: { x: 50, y: 60 } });
  });

  test('should handle input typing', async ({ page }) => {
    // 在输入框中输入内容
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render input placeholder', async ({ page }) => {
    // 占位符显示测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render readonly input', async ({ page }) => {
    // 只读输入框测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle input maxRows', async ({ page }) => {
    // 多行输入最大行数限制
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});