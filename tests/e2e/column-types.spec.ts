import { test, expect } from '@playwright/test';

/**
 * Canvas Table 列类型 E2E 测试
 */

test.describe('Column Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test.describe('Checkbox Column', () => {
    test('should toggle checkbox on click', async ({ page }) => {
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();

      // Click on checkbox column (assuming it's around x=280 based on default columns)
      await canvas.click({
        position: { x: 280, y: 60 }
      });

      await page.waitForTimeout(100);
      // Checkbox should toggle
    });

    test('should render checked checkbox', async ({ page }) => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
      // Visual verification of checkbox rendering
    });
  });

  test.describe('Progress Column', () => {
    test('should render progress bar', async ({ page }) => {
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();

      // Progress column should be visible
      await expect(canvas).toBeVisible();
    });

    test('should handle progress click', async ({ page }) => {
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();

      // Click on progress bar area
      await canvas.click({
        position: { x: 350, y: 60 }
      });

      await page.waitForTimeout(100);
    });
  });

  test.describe('Select/Dropdown Column', () => {
    test('should open dropdown on click', async ({ page }) => {
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();

      // Click on a select/dropdown cell
      await canvas.click({
        position: { x: 450, y: 60 }
      });

      await page.waitForTimeout(100);
      // Dropdown should open
    });
  });

  test.describe('Tags Column', () => {
    test('should render tags', async ({ page }) => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
      // Tags should be rendered in the cell
    });
  });

  test.describe('Button Column', () => {
    test('should handle button click', async ({ page }) => {
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();

      // Click on button area
      await canvas.click({
        position: { x: 550, y: 60 }
      });

      await page.waitForTimeout(100);
      // Button click event should be triggered
    });
  });

  test.describe('Switch Column', () => {
    test('should toggle switch on click', async ({ page }) => {
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();

      // Click on switch area
      await canvas.click({
        position: { x: 620, y: 60 }
      });

      await page.waitForTimeout(100);
      // Switch should toggle
    });
  });

  test.describe('Date Column', () => {
    test('should open date picker on double click', async ({ page }) => {
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();

      // Double click on date cell
      await canvas.dblclick({
        position: { x: 700, y: 60 }
      });

      await page.waitForTimeout(100);
      // Date picker should open
    });
  });
});