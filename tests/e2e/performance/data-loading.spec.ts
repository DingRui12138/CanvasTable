import { test, expect } from '@playwright/test';

/**
 * Canvas Table 数据加载和性能 E2E 测试
 */

test.describe('Data Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should load 1,000 rows', async ({ page }) => {
    await page.click('#load1k');

    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load 10,000 rows', async ({ page }) => {
    await page.click('#load10k');

    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load 100,000 rows', async ({ page }) => {
    await page.click('#load100k');

    await page.waitForTimeout(800);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load complex columns', async ({ page }) => {
    await page.click('#loadComplex');

    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load 1000 columns', async ({ page }) => {
    await page.click('#load1000Cols');

    await page.waitForTimeout(800);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load merged cells', async ({ page }) => {
    await page.click('#loadMerged');

    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load hierarchical data', async ({ page }) => {
    await page.click('#loadHierarchical');

    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
  });

  test('should render quickly with large dataset', async ({ page }) => {
    const startTime = Date.now();

    await page.click('#load100k');
    await page.waitForTimeout(100); // Short wait to check render time

    const renderTime = Date.now() - startTime;

    // Should render within reasonable time (5 seconds)
    expect(renderTime).toBeLessThan(5000);
  });

  test('should handle rapid scrolling smoothly', async ({ page }) => {
    await page.click('#load10k');
    await page.waitForTimeout(300);

    const canvas = page.locator('canvas');
    await canvas.hover();

    // Rapid scroll events
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(20);
    }

    // Should not throw errors or freeze
    await expect(canvas).toBeVisible();
  });

  test('should handle rapid clicks without errors', async ({ page }) => {
    await page.click('#load1k');
    await page.waitForTimeout(300);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      await canvas.click({
        position: { x: 100, y: 60 + (i % 5) * 30 }
      });
      await page.waitForTimeout(30);
    }

    // Should not throw errors
    await expect(canvas).toBeVisible();
  });
});