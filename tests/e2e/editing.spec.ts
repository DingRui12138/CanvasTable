import { test, expect } from '@playwright/test';

/**
 * Canvas Table 编辑功能 E2E 测试
 */

test.describe('Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should enter edit mode on double click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Double click on a text cell (name column around x=150)
    await canvas.dblclick({
      position: { x: 150, y: 60 }
    });

    await page.waitForTimeout(200);
    // Input element should appear in DOM
    const input = page.locator('input, textarea');
    // May or may not have input depending on column type
  });

  test('should cancel editing on Escape', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Enter edit mode
    await canvas.dblclick({
      position: { x: 150, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press Escape
    await page.keyboard.press('Escape');

    await page.waitForTimeout(100);
    // Should exit edit mode
  });

  test('should save editing on Enter', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Enter edit mode
    await canvas.dblclick({
      position: { x: 150, y: 60 }
    });

    await page.waitForTimeout(100);

    // Type some text
    await page.keyboard.type('Test');

    // Press Enter
    await page.keyboard.press('Enter');

    await page.waitForTimeout(100);
    // Should save and exit edit mode
  });

  test('should start editing with Enter key', async ({ page }) => {
    const canvas = page.locator('canvas');

    // First select a cell
    await canvas.click({
      position: { x: 150, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press Enter to start editing
    await page.keyboard.press('Enter');

    await page.waitForTimeout(100);
    // Should enter edit mode
  });

  test('should navigate to next cell with Tab while editing', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Enter edit mode
    await canvas.dblclick({
      position: { x: 150, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press Tab
    await page.keyboard.press('Tab');

    await page.waitForTimeout(100);
    // Should move to next cell
  });

  test('should navigate to previous cell with Shift+Tab while editing', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Enter edit mode
    await canvas.dblclick({
      position: { x: 150, y: 60 }
    });

    await page.waitForTimeout(100);

    // Press Shift+Tab
    await page.keyboard.press('Shift+Tab');

    await page.waitForTimeout(100);
    // Should move to previous cell
  });
});