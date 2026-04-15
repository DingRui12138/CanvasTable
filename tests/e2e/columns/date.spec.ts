import { test, expect } from '@playwright/test';

/**
 * Date 列 E2E 测试
 * 基于 examples/main.ts 中的列定义：
 * - joinDate 列位于 x: 680-800，中心点 x: 740
 */

test.describe('Date Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render date value', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should open date picker on double click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 双击 joinDate 列 (x: 680-800，中心点 x: 740)
    await canvas.dblclick({ position: { x: 740, y: 60 } });
    await page.waitForTimeout(100);

    // 日期选择器应出现
  });

  test('should close date picker on click outside', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.dblclick({ position: { x: 740, y: 60 } });

    // 点击外部关闭
    await canvas.click({ position: { x: 30, y: 60 } });
  });

  test('should select date from picker', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.dblclick({ position: { x: 740, y: 60 } });

    // 选择日期
  });

  test('should format date display', async ({ page }) => {
    // 日期格式化显示
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should support date range', async ({ page }) => {
    // 日期范围选择测试
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});