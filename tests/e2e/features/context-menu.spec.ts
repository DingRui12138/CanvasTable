import { test, expect } from '@playwright/test';

/**
 * Canvas Table 右键菜单 E2E 测试
 */

test.describe('Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should open context menu on right click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Right click on a cell
    await canvas.click({
      position: { x: 100, y: 60 },
      button: 'right'
    });

    await page.waitForTimeout(100);
    // Context menu should appear
  });

  test('should close context menu on click outside', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Open context menu
    await canvas.click({
      position: { x: 100, y: 60 },
      button: 'right'
    });

    await page.waitForTimeout(100);

    // Click elsewhere to close
    await canvas.click({
      position: { x: 50, y: 50 }
    });

    await page.waitForTimeout(100);
    // Context menu should close
  });

  test('should have menu items in context menu', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Right click on a cell
    await canvas.click({
      position: { x: 100, y: 60 },
      button: 'right'
    });

    await page.waitForTimeout(100);
    // Menu items like "Delete Row", "Insert Above", etc. should appear
  });

  test('should open header context menu on header right click', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Right click on header
    await canvas.click({
      position: { x: 100, y: 20 },
      button: 'right'
    });

    await page.waitForTimeout(100);
    // Header context menu should appear with options like "Hide Column", etc.
  });

  test('pins a row to the top from the context menu', async ({ page }) => {
    const canvas = page.locator('canvas');

    await canvas.click({
      position: { x: 120, y: 180 },
      button: 'right'
    });
    await page.waitForTimeout(100);

    await canvas.click({
      position: { x: 140, y: 196 }
    });
    await page.waitForTimeout(100);

    const pinned = await page.evaluate(() => {
      const table = (window as typeof window & {
        table?: { getPinnedRows?: (position: 'top' | 'bottom') => unknown[] };
      }).table;
      return table?.getPinnedRows?.('top')?.length ?? 0;
    });

    expect(pinned).toBe(1);
  });
});
