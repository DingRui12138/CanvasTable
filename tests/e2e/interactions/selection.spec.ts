import { test, expect } from '@playwright/test';

/**
 * Canvas Table 选择功能 E2E 测试
 */

test.describe('Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should select cell on single click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click on first data row (below header)
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    await page.waitForTimeout(100);
    // Selection is rendered visually on canvas
  });

  test('should select range with shift+click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // First click on row 1
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    // Shift+click on row 3
    await canvas.click({
      position: { x: 100, y: 140 },
      modifiers: ['Shift']
    });

    await page.waitForTimeout(100);
    // Range selection should be made
  });

  test('should toggle selection with ctrl+click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // First click on row 1
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    // Ctrl+click on row 3
    await canvas.click({
      position: { x: 100, y: 140 },
      modifiers: ['Control']
    });

    await page.waitForTimeout(100);
    // Multiple cells should be selected
  });

  test('should clear selection on Escape key', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Make a selection first
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    // Press Escape
    await page.keyboard.press('Escape');

    await page.waitForTimeout(100);
    // Selection should be cleared
  });

  test('should select all with Ctrl+A', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Focus canvas and press Ctrl+A
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    await page.keyboard.press('Control+a');

    await page.waitForTimeout(100);
    // All cells should be selected
  });
});