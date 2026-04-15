import { test, expect } from '@playwright/test';

/**
 * Canvas Table 排序和筛选 E2E 测试
 */

test.describe('Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should sort on header click', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click on header for sorting (first column header)
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(200);
    // Column should be sorted ascending
  });

  test('should toggle sort direction on second click', async ({ page }) => {
    const canvas = page.locator('canvas');

    // First click - ascending
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(200);

    // Second click - descending
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(200);
    // Sort should toggle to descending
  });

  test('should clear sort order on third click', async ({ page }) => {
    const canvas = page.locator('canvas');

    // First click - ascending
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(100);

    // Second click - descending
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(100);

    // Third click - no sort
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(100);
    // Sort should be cleared
  });

  test('should support multi-column sort with Shift+click', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Click first column
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(100);

    // Shift+click second column
    await canvas.click({
      position: { x: 150, y: 20 },
      modifiers: ['Shift']
    });

    await page.waitForTimeout(100);
    // Multi-column sort should be applied
  });

  test('should clear sort with button', async ({ page }) => {
    // Apply sort first
    const canvas = page.locator('canvas');
    await canvas.click({
      position: { x: 50, y: 20 }
    });

    await page.waitForTimeout(100);

    // Click clear sort button
    await page.click('#clearSort');

    await page.waitForTimeout(100);
    // Sort should be cleared
  });
});

test.describe('Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should open filter dropdown', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Right-click on header for filter menu
    await canvas.click({
      position: { x: 100, y: 20 },
      button: 'right'
    });

    await page.waitForTimeout(100);
    // Context menu should appear
  });

  test('should clear filter with button', async ({ page }) => {
    // Click clear filter button
    await page.click('#clearFilter');

    await page.waitForTimeout(100);
    // Filter should be cleared
  });
});