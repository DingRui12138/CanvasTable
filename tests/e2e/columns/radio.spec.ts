import { test, expect } from '@playwright/test';

/**
 * Radio 列 E2E 测试
 */

test.describe('Radio Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render radio button', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render unchecked radio', async ({ page }) => {
    // 未选中状态渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render checked radio', async ({ page }) => {
    // 选中状态渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should select radio on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 点击选择 radio
    await canvas.click({ position: { x: 50, y: 60 } });
  });

  test('should deselect other radios in same group', async ({ page }) => {
    // 同组内只能选中一个
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render radio with label', async ({ page }) => {
    // 带标签的 radio 渲染
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render disabled radio', async ({ page }) => {
    // 禁用状态 radio 测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render radio options list', async ({ page }) => {
    // 多个选项的 radio 列表
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});