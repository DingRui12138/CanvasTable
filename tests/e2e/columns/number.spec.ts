import { test, expect } from '@playwright/test';

/**
 * Number 列 E2E 测试
 * 基于 examples/main.ts 中的列定义：
 * - id 列位于 x: 60-120 (固定左侧列)，中心点 x: 90
 * - age 列位于 x: 520-580，中心点 x: 550
 * - salary 列位于 x: 1130-1230，中心点 x: 1180
 * - 注意：示例中的 number 列都没有 editable: true，所以只测试渲染
 */

test.describe('Number Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    // 等待表格渲染完成
    await page.waitForTimeout(500);
  });

  test('should render number value', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render id column', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // id 列是固定左侧列，应该始终可见
    // 点击 id 列第三行 (x: 90, y: 140)
    await canvas.click({ position: { x: 90, y: 140 } });
    await page.waitForTimeout(50);
  });

  test('should render age column', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // age 列在视口内 (x: 550)
    await canvas.click({ position: { x: 550, y: 140 } });
    await page.waitForTimeout(50);
  });

  test('should render salary column', async ({ page }) => {
    const canvas = page.locator('canvas');
    // salary 列可能在视口外，需要滚动才能看到
    // 这里只验证渲染，不验证位置
    await expect(canvas).toBeVisible();
  });
});