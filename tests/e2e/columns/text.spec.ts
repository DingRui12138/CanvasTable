import { test, expect } from '@playwright/test';

/**
 * Text 列 E2E 测试
 * 基于 examples/main.ts 中的列定义：
 * - department 列位于 x: 630-730，中心点 x: 680
 * - 注意：前两行被禁用（isRowDisabled），无法编辑
 * - 表头为两层，第一行动态高度 100px，第三行中心点 y 约 220
 */

const DEPARTMENT_EDIT_POINT = { x: 680, y: 220 };

test.describe('Text Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    // 等待表格渲染完成
    await page.waitForTimeout(500);
  });

  test('should render text content', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should enter edit mode on double click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // 双击 department 列第三行
    // 前两行被禁用，无法编辑
    await canvas.dblclick({ position: DEPARTMENT_EDIT_POINT });

    // 等待编辑器出现
    await page.waitForTimeout(200);

    // 应出现输入框
    const input = page.locator('#table-container input, #table-container textarea');
    await expect(input).toBeVisible({ timeout: 3000 });
  });

  test('should save value when pressing Enter', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.dblclick({ position: DEPARTMENT_EDIT_POINT });

    const input = page.locator('#table-container input');
    await expect(input).toBeVisible({ timeout: 3000 });
    await input.fill('New Department');
    await page.keyboard.press('Enter');

    // Enter should save the value. If the global Enter shortcut re-enters edit mode,
    // close the editor before verifying the persisted value.
    if (await input.isVisible()) {
      await input.press('Escape');
    }
    await expect(input).not.toBeVisible({ timeout: 3000 });

    await canvas.dblclick({ position: DEPARTMENT_EDIT_POINT });
    await expect(input).toBeVisible({ timeout: 3000 });
    await expect(input).toHaveValue('New Department');
  });

  test('should cancel edit when pressing Escape', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.dblclick({ position: DEPARTMENT_EDIT_POINT });

    const input = page.locator('#table-container input');
    await expect(input).toBeVisible({ timeout: 3000 });
    await input.fill('Cancelled Value');
    await input.press('Escape');

    // 输入框应消失，值未保存
    await expect(input).not.toBeVisible({ timeout: 3000 });
  });

  test('should show original value in input', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.dblclick({ position: DEPARTMENT_EDIT_POINT });

    const input = page.locator('#table-container input');
    await expect(input).toBeVisible({ timeout: 3000 });
    // 输入框应包含原始值
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});
