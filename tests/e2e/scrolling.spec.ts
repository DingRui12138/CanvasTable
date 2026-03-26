import { test, expect } from '@playwright/test';

/**
 * Canvas Table 滚动功能 E2E 测试
 */

test.describe('Scrolling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);

    // Load more data for scrolling tests
    await page.click('#load1k');
    await page.waitForTimeout(500);
  });

  test('should scroll vertically with mouse wheel', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Hover on canvas
    await canvas.hover();

    // Scroll down
    await page.mouse.wheel(0, 200);

    await page.waitForTimeout(200);
  });

  test('should scroll horizontally with mouse wheel', async ({ page }) => {
    const canvas = page.locator('canvas');

    await canvas.hover();

    // Scroll right
    await page.mouse.wheel(200, 0);

    await page.waitForTimeout(200);
  });

  test('should scroll with scrollbar drag', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (!box) return;

    // Scrollbar is usually on the right edge
    const scrollbarX = box.width - 5;
    const scrollbarY = 100;

    // Click and drag scrollbar
    await page.mouse.move(box.x + scrollbarX, box.y + scrollbarY);
    await page.mouse.down();
    await page.mouse.move(box.x + scrollbarX, box.y + scrollbarY + 200);
    await page.mouse.up();

    await page.waitForTimeout(200);
  });

  test('should handle rapid scrolling', async ({ page }) => {
    const canvas = page.locator('canvas');

    await canvas.hover();

    // Rapid scroll events
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 50);
      await page.waitForTimeout(20);
    }

    await page.waitForTimeout(200);
  });

  test('should scroll to selected cell', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Select a cell
    await canvas.click({
      position: { x: 100, y: 60 }
    });

    // Navigate down multiple times
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(30);
    }

    await page.waitForTimeout(200);
    // View should scroll to show the selected cell
  });
});