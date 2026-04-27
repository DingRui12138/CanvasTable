import { test, expect } from '@playwright/test';

test.describe('Row Height Resize', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should resize the first row and emit the committed height', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const before = await page.evaluate(() => {
      const testWindow = window as typeof window & {
        table?: { getLayoutInfo: () => { rowOffsets: number[]; totalHeight: number } };
        lastRowHeightChange?: { rowName: string; newHeight: number; rowIndex: number };
      };

      return {
        layout: testWindow.table?.getLayoutInfo(),
        lastRowHeightChange: testWindow.lastRowHeightChange ?? null,
      };
    });

    const beforeLayout = before.layout;
    expect(beforeLayout).toBeTruthy();
    expect(before.lastRowHeightChange).toBeNull();

    const firstRowBottom = beforeLayout!.rowOffsets[1]!;
    const dragDelta = 30;

    await page.mouse.move(box!.x + 320, box!.y + firstRowBottom);
    await page.mouse.down();
    await page.mouse.move(box!.x + 320, box!.y + firstRowBottom + dragDelta);
    await page.mouse.up();

    await page.waitForTimeout(100);

    const after = await page.evaluate(() => {
      const testWindow = window as typeof window & {
        table?: { getLayoutInfo: () => { rowOffsets: number[]; totalHeight: number } };
        lastRowHeightChange?: { rowName: string; newHeight: number; rowIndex: number };
      };

      return {
        layout: testWindow.table?.getLayoutInfo(),
        lastRowHeightChange: testWindow.lastRowHeightChange ?? null,
      };
    });

    const afterLayout = after.layout;
    expect(afterLayout).toBeTruthy();
    expect(afterLayout!.rowOffsets[1]!).toBe(beforeLayout!.rowOffsets[1]! + dragDelta);
    expect(afterLayout!.totalHeight).toBe(beforeLayout!.totalHeight + dragDelta);
    expect(after.lastRowHeightChange).toEqual({
      rowName: '周芳',
      newHeight: 130,
      rowIndex: 0,
    });
  });
});
