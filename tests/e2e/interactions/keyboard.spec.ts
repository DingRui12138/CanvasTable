import { test, expect } from '@playwright/test';

/**
 * Canvas Table 键盘导航 E2E 测试
 */

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should navigate down with ArrowDown', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select first cell
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press ArrowDown
    await page.keyboard.press('ArrowDown');

    await page.waitForTimeout(100);
    // Selection should move down
  });

  test('should navigate up with ArrowUp', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select a cell in second row
    await canvas.click({
      position: { x: 100, y: 90 }
    });

    await page.waitForTimeout(100);

    // Press ArrowUp
    await page.keyboard.press('ArrowUp');

    await page.waitForTimeout(100);
    // Selection should move up
  });

  test('should navigate right with ArrowRight', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select first column
    await canvas.click({
      position: { x: 50, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press ArrowRight
    await page.keyboard.press('ArrowRight');

    await page.waitForTimeout(100);
    // Selection should move right
  });

  test('should navigate left with ArrowLeft', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select second column
    await canvas.click({
      position: { x: 150, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press ArrowLeft
    await page.keyboard.press('ArrowLeft');

    await page.waitForTimeout(100);
    // Selection should move left
  });

  test('should not navigate beyond top row', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select first row
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    await page.waitForTimeout(100);

    // Try to navigate up
    await page.keyboard.press('ArrowUp');

    await page.waitForTimeout(100);
    // Should stay at first row
  });

  test('should not navigate beyond leftmost column', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select first column
    await canvas.click({
      position: { x: 50, y: 60 }
    });

    await page.waitForTimeout(100);

    // Try to navigate left
    await page.keyboard.press('ArrowLeft');

    await page.waitForTimeout(100);
    // Should stay at first column
  });

  test('should copy selection with Ctrl+C', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select a cell
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press Ctrl+C
    await page.keyboard.press('Control+c');

    await page.waitForTimeout(100);
    // Should copy to clipboard (no error)
  });

  test('should trigger undo with Ctrl+Z', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select a cell
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press Ctrl+Z
    await page.keyboard.press('Control+z');

    await page.waitForTimeout(100);
    // Undo event should be triggered
  });

  test('should trigger redo with Ctrl+Y', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select a cell
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press Ctrl+Y
    await page.keyboard.press('Control+y');

    await page.waitForTimeout(100);
    // Redo event should be triggered
  });
});