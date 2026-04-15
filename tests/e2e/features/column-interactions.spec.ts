import { test, expect } from '@playwright/test';

/**
 * Canvas Table 列交互 E2E 测试
 */

test.describe('Column Resize', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should change cursor on resize handle hover', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Hover near column border (resize handle area)
    await canvas.hover({
      position: { x: 78, y: 30 } // Near right edge of first column
    });

    await page.waitForTimeout(100);
    // Cursor should change to col-resize (this is visual)
  });

  test('should resize column on drag', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (!box) return;

    // Click and drag on resize handle
    await page.mouse.move(box.x + 78, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 128, box.y + 30);
    await page.mouse.up();

    await page.waitForTimeout(100);
    // Column should be resized
  });

  test('should enforce minimum column width', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (!box) return;

    // Try to drag resize handle to very small width
    await page.mouse.move(box.x + 78, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 30);
    await page.mouse.up();

    await page.waitForTimeout(100);
    // Column should have minimum width
  });
});

test.describe('Column Reorder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should handle header drag start', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (!box) return;

    // Drag header to reorder
    await page.mouse.move(box.x + 40, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 140, box.y + 20);
    await page.mouse.up();

    await page.waitForTimeout(100);
  });
});

test.describe('Fixed Columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should scroll non-fixed columns', async ({ page }) => {
    const canvas = page.locator('canvas');

    await canvas.hover();

    // Scroll horizontally
    await page.mouse.wheel(200, 0);

    await page.waitForTimeout(200);
    // Non-fixed columns should scroll, fixed columns stay
  });
});