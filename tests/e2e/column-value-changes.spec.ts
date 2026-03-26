import { test, expect } from '@playwright/test';

/**
 * Canvas Table 列值修改 E2E 测试
 *
 * 列宽度配置:
 * - id: 50 (x: 0-50)
 * - name: 100 (x: 50-150) - 可编辑
 * - checkbox: 60 (x: 150-210)
 * - switch: 60 (x: 210-270)
 * - age: 50 (x: 270-320) - 可编辑
 *
 * Header 高度: 36px
 * Row 高度: 32px
 * 第一行中心 Y: 36 + 16 = 52
 */

const COL = {
  id: 25,           // center of column
  name: 100,        // center of name column (50-150)
  checkbox: 180,    // center of checkbox column (150-210)
  switch: 240,      // center of switch column (210-270)
  age: 295,         // center of age column (270-320)
};

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 32;
const ROW1_Y = HEADER_HEIGHT + ROW_HEIGHT / 2; // 52

test.describe('Column Value Changes - Real Edit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/test-page.html');
    await page.waitForTimeout(500);
  });

  test.describe('Text Column Edit', () => {
    test('should create input element on double click', async ({ page }) => {
      const canvas = page.locator('canvas');

      // Double click on name column center
      await canvas.dblclick({
        position: { x: COL.name, y: ROW1_Y }
      });

      await page.waitForTimeout(300);

      // Verify input element was created in document.body
      const input = page.locator('body > input, body > textarea');
      await expect(input).toBeVisible({ timeout: 5000 });
    });

    test('should save value when pressing Enter', async ({ page }) => {
      const canvas = page.locator('canvas');

      // Double click to start editing
      await canvas.dblclick({
        position: { x: COL.name, y: ROW1_Y }
      });

      await page.waitForTimeout(300);

      const input = page.locator('body > input, body > textarea').first();
      await expect(input).toBeVisible();

      // Clear and type new value
      await input.fill('NewName');
      await input.press('Enter');

      await page.waitForTimeout(300);

      // Verify the value was saved
      const rows = await page.evaluate(() => (window as any).__getRows());
      expect(rows[0]?.data.name).toBe('NewName');

      // Verify event was emitted
      const events = await page.evaluate(() => (window as any).__testEvents);
      const editEvent = events?.find((e: any) => e.type === 'editEnd');
      expect(editEvent).toBeDefined();
      expect(editEvent?.detail.value).toBe('NewName');
    });

    test('should cancel edit when pressing Escape', async ({ page }) => {
      const canvas = page.locator('canvas');

      const rowsBefore = await page.evaluate(() => (window as any).__getRows());
      const originalName = rowsBefore?.[0]?.data.name;

      await canvas.dblclick({
        position: { x: COL.name, y: ROW1_Y }
      });

      await page.waitForTimeout(300);

      const input = page.locator('body > input, body > textarea').first();
      await expect(input).toBeVisible();

      await input.fill('CancelledName');
      await input.press('Escape');

      await page.waitForTimeout(300);

      // Value should NOT be changed
      const rowsAfter = await page.evaluate(() => (window as any).__getRows());
      expect(rowsAfter?.[0]?.data.name).toBe(originalName);
    });

    test('should show original value in input', async ({ page }) => {
      const canvas = page.locator('canvas');

      await canvas.dblclick({
        position: { x: COL.name, y: ROW1_Y }
      });

      await page.waitForTimeout(300);

      const input = page.locator('body > input, body > textarea').first();
      const value = await input.inputValue();
      expect(value).toBe('Alice'); // First row name
    });
  });

  test.describe('Checkbox Column', () => {
    test('should toggle checkbox value on click', async ({ page }) => {
      const canvas = page.locator('canvas');

      // Get initial value
      const rowsBefore = await page.evaluate(() => (window as any).__getRows());
      expect(rowsBefore?.[0]?.data.checkbox).toBe(true);

      // Click on checkbox column
      await canvas.click({
        position: { x: COL.checkbox, y: ROW1_Y }
      });

      await page.waitForTimeout(300);

      // Verify event was emitted
      const events = await page.evaluate(() => (window as any).__testEvents);
      const checkboxEvent = events?.find((e: any) => e.type === 'checkboxChange');
      expect(checkboxEvent).toBeDefined();
      expect(checkboxEvent?.detail.checked).toBe(false);

      // Verify row data was updated
      const rowsAfter = await page.evaluate(() => (window as any).__getRows());
      expect(rowsAfter?.[0]?.data.checkbox).toBe(false);
    });
  });

  test.describe('Switch Column', () => {
    test('should toggle switch value on click', async ({ page }) => {
      const canvas = page.locator('canvas');

      const rowsBefore = await page.evaluate(() => (window as any).__getRows());
      expect(rowsBefore?.[0]?.data.switch).toBe(true);

      await canvas.click({
        position: { x: COL.switch, y: ROW1_Y }
      });

      await page.waitForTimeout(300);

      const events = await page.evaluate(() => (window as any).__testEvents);
      const switchEvent = events?.find((e: any) => e.type === 'switchChange');
      expect(switchEvent).toBeDefined();
      expect(switchEvent?.detail.checked).toBe(false);

      const rowsAfter = await page.evaluate(() => (window as any).__getRows());
      expect(rowsAfter?.[0]?.data.switch).toBe(false);
    });
  });

  test.describe('Number Column Edit', () => {
    test('should edit number column', async ({ page }) => {
      const canvas = page.locator('canvas');

      await canvas.dblclick({
        position: { x: COL.age, y: ROW1_Y }
      });

      await page.waitForTimeout(300);

      const input = page.locator('body > input, body > textarea').first();
      await expect(input).toBeVisible();

      await input.fill('99');
      await input.press('Enter');

      await page.waitForTimeout(300);

      const rows = await page.evaluate(() => (window as any).__getRows());
      // Input value is string, so we compare as string or convert
      expect(String(rows[0]?.data.age)).toBe('99');
    });
  });
});