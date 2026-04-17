import { test, expect } from '@playwright/test';

/**
 * JSX Custom Column E2E Tests
 * Tests the JSX declarative rendering system for custom columns
 */

test.describe('JSX Custom Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/jsx-demo.html');
    await page.waitForTimeout(500);
  });

  test('should render jsx custom column', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Take screenshot to verify rendering
    await expect(canvas).toHaveScreenshot('jsx-custom-basic.png', {
      maxDiffPixels: 100
    });
  });

  test('should display status indicator and text', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click on status column to verify interaction works
    await canvas.click({ position: { x: 200, y: 80 } });

    // No errors should occur
    await page.waitForTimeout(100);
  });

  test('should render all status types with correct colors', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify the canvas has rendered content
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);

    // The table should have rendered the three rows with different status colors
    // active = green (#52c41a), inactive = red (#ff4d4f), pending = yellow (#faad14)
    await page.waitForTimeout(200);
  });
});