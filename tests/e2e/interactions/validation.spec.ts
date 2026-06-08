import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    table: any;
  }
}

/**
 * Validation E2E tests
 *
 * Strategy: use window.table API to start/edit state, then use real canvas click
 * to test the critical mousedown → shouldBlockEditingClose flow.
 * This avoids fragile coordinate-based dblclick while still testing browser event timing.
 *
 * NOTE: rows 0 and 1 (id=1, id=2) are disabled per isRowDisabled.
 * All tests use row 2 (id=3) as the first editable row.
 *
 * For tags dropdown tests: after scrolling to skills, the id column scrolls out of view.
 * Instead, we click at a viewport position that's guaranteed visible and outside the dropdown.
 */

const HEADER_HEIGHT = 72;
const ROW_HEIGHT = 32;
const ROW_2_Y = HEADER_HEIGHT + ROW_HEIGHT * 2 + ROW_HEIGHT / 2; // row index 2
const ROW_3_Y = HEADER_HEIGHT + ROW_HEIGHT * 3 + ROW_HEIGHT / 2; // row index 3

// Helper: start DOM editing via API
async function startDomEditing(page: any, rowIndex: number, columnKey: string) {
  const started = await page.evaluate(([ri, ck]: [number, string]) => {
    const table = window.table;
    if (!table) return false;
    const leafColumns = table.layoutManager.getLeafColumns();
    const colIndex = leafColumns.findIndex((c: any) => c.key === ck);
    if (colIndex < 0) return false;
    return table.interactionManager.editingHandler.startEditing({ rowIndex: ri, columnIndex: colIndex });
  }, [rowIndex, columnKey]);
  if (!started) return false;
  await page.waitForTimeout(300);
  return true;
}

// Helper: start tags dropdown via API
async function startTagsEditing(page: any, rowIndex: number, columnKey: string) {
  const started = await page.evaluate(([ri, ck]: [number, string]) => {
    const table = window.table;
    if (!table) return false;
    const leafColumns = table.layoutManager.getLeafColumns();
    const colIndex = leafColumns.findIndex((c: any) => c.key === ck);
    if (colIndex < 0) return false;
    const column = leafColumns[colIndex];
    const row = table.dataManager.getRows()[ri];
    if (!column || !row) return false;
    const value = row.data[column.key];
    const renderResult = column.render ? column.render(value, row, column, ri) : null;
    const tagsConfig = renderResult?.tags;
    if (!tagsConfig) return false;
    return table.interactionManager.editingHandler.startTagsEditing(
      { rowIndex: ri, columnIndex: colIndex }, tagsConfig);
  }, [rowIndex, columnKey]);
  if (!started) return false;
  await page.waitForTimeout(300);
  return true;
}

// Helper: set input value
async function setInputValue(page: any, value: string) {
  const input = page.locator('#table-container input, #table-container textarea').first();
  await input.click();
  await input.fill(value);
  await page.waitForTimeout(50);
}

// Helper: check DOM editing state
async function isDomEditingActive(page: any) {
  return page.evaluate(() => !!window.table?.editorManager.getEditingCell());
}

// Helper: check dropdown state
async function isDropdownActive(page: any) {
  return page.evaluate(() => !!window.table?.interactionManager.getDropdown());
}

// Helper: get validation errors
async function getValidationErrors(page: any) {
  return page.evaluate(() => {
    const table = window.table;
    if (!table) return [];
    return table.getValidationErrors().map((e: any) => ({ message: e.message, level: e.level }));
  });
}

// Helper: get column X center for canvas click
async function getColumnCenterX(page: any, columnKey: string) {
  return page.evaluate((ck: string) => {
    const table = window.table;
    if (!table) return -1;
    const lm = table.layoutManager;
    const leafColumns = lm.getLeafColumns();
    const scrollLeft = table.interactionManager.getScrollState().scrollLeft;
    for (let i = 0; i < leafColumns.length; i++) {
      if (leafColumns[i].key === ck) {
        return lm.getColumnOffset(i) - scrollLeft + leafColumns[i].width / 2;
      }
    }
    return -1;
  }, columnKey);
}

// Helper: click on a column cell via canvas (for DOM editor tests where no scrolling)
async function clickCell(page: any, columnKey: string, rowY: number) {
  const canvas = page.locator('#table-container canvas');
  const centerX = await getColumnCenterX(page, columnKey);
  if (centerX < 0) return false;
  await canvas.click({ position: { x: centerX, y: rowY } });
  await page.waitForTimeout(200);
  return true;
}

// Helper: click at a visible viewport position outside the dropdown
// After scrolling to skills, the dropdown is near the skills column in the middle of the viewport.
// Clicking at (10, 10) — top-left header area — is guaranteed visible and outside the dropdown.
async function clickOutsideDropdown(page: any) {
  const canvas = page.locator('#table-container canvas');
  // Click in header area at left edge — always visible, outside dropdown bounds
  await canvas.click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(200);
}

// Helper: scroll to make a column visible
async function scrollToColumn(page: any, columnKey: string) {
  await page.evaluate((ck: string) => {
    const table = window.table;
    if (!table) return;
    const lm = table.layoutManager;
    const leafColumns = lm.getLeafColumns();
    const scrollLeft = table.interactionManager.getScrollState().scrollLeft;
    const viewportWidth = lm.getLayoutInfo().viewportWidth;
    for (let i = 0; i < leafColumns.length; i++) {
      if (leafColumns[i].key === ck) {
        const offset = lm.getColumnOffset(i);
        const width = leafColumns[i].width;
        if (offset >= scrollLeft && offset + width <= scrollLeft + viewportWidth) return;
        const target = Math.max(0, offset - viewportWidth / 2 + width / 2);
        table.interactionManager.setScrollPosition(target, table.interactionManager.getScrollState().scrollTop);
        return;
      }
    }
  }, columnKey);
  await page.waitForTimeout(100);
}

// Helper: reset all editing/dropdown state
async function resetEditingState(page: any) {
  await page.evaluate(() => {
    const table = window.table;
    if (!table) return;
    table.editorManager.endEditing(false);
    table.interactionManager.state.editingCell = null;
    table.interactionManager.state.dropdown = null;
    table.interactionManager.state.dateDropdown = null;
    table.interactionManager.state.colorDropdown = null;
    table.clearValidationErrors();
    table.render();
  });
  await page.waitForTimeout(100);
}

test.describe('Validation - DOM Editor', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
    await resetEditingState(page);
  });

  test('error validation should keep editing open when clicking other cell', async ({ page }) => {
    const started = await startDomEditing(page, 2, 'age');
    expect(started).toBe(true);
    expect(await isDomEditingActive(page)).toBe(true);

    await setInputValue(page, '5');

    const clicked = await clickCell(page, 'id', ROW_3_Y);
    expect(clicked).toBe(true);

    expect(await isDomEditingActive(page)).toBe(true);
    const errors = await getValidationErrors(page);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].level).toBe('error');
  });

  test('valid input should close editing when clicking other cell', async ({ page }) => {
    const started = await startDomEditing(page, 2, 'age');
    expect(started).toBe(true);
    expect(await isDomEditingActive(page)).toBe(true);

    await setInputValue(page, '30');
    const clicked = await clickCell(page, 'id', ROW_3_Y);
    expect(clicked).toBe(true);

    expect(await isDomEditingActive(page)).toBe(false);
  });

  test('warning level validation should close editing', async ({ page }) => {
    const started = await startDomEditing(page, 2, 'age');
    expect(started).toBe(true);
    expect(await isDomEditingActive(page)).toBe(true);

    await setInputValue(page, '55');
    const clicked = await clickCell(page, 'id', ROW_3_Y);
    expect(clicked).toBe(true);

    expect(await isDomEditingActive(page)).toBe(false);
    const errors = await getValidationErrors(page);
    expect(errors.some((e: { level: string }) => e.level === 'warning')).toBe(true);
  });

  test('out-of-range error should keep editing open', async ({ page }) => {
    const started = await startDomEditing(page, 2, 'age');
    expect(started).toBe(true);
    expect(await isDomEditingActive(page)).toBe(true);

    await setInputValue(page, '100');
    const clicked = await clickCell(page, 'id', ROW_3_Y);
    expect(clicked).toBe(true);

    expect(await isDomEditingActive(page)).toBe(true);
  });
});

test.describe('Validation - Tags Dropdown', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
    await resetEditingState(page);
  });

  test('tags validation error (>10) should keep dropdown open', async ({ page }) => {
    await scrollToColumn(page, 'skills');

    const started = await startTagsEditing(page, 2, 'skills');
    expect(started).toBe(true);
    expect(await isDropdownActive(page)).toBe(true);

    // Select 11+ tags (validation error)
    await page.evaluate(() => {
      const table = window.table;
      const dropdown = table.interactionManager.getDropdown();
      if (!dropdown || !dropdown.tagsConfig) return;
      const allOptions = dropdown.tagsConfig.options ?? [];
      const selectedValues = allOptions.slice(0, 11).map((o: any) => o.value ?? o.text);
      dropdown.tagsConfig = { ...dropdown.tagsConfig, selectedValues };
      dropdown.config = { ...dropdown.config, value: selectedValues };
      table.eventEmitter.emit('tagsChange',
        table.interactionManager.getCellInfo(dropdown.cell), selectedValues, true);
    });
    await page.waitForTimeout(200);

    // Click outside dropdown — should block close due to validation error
    await clickOutsideDropdown(page);

    expect(await isDropdownActive(page)).toBe(true);
  });

  test('valid tags selection (<10) should allow dropdown close', async ({ page }) => {
    await scrollToColumn(page, 'skills');

    const started = await startTagsEditing(page, 2, 'skills');
    expect(started).toBe(true);
    expect(await isDropdownActive(page)).toBe(true);

    // Select 3 tags (valid)
    await page.evaluate(() => {
      const table = window.table;
      const dropdown = table.interactionManager.getDropdown();
      if (!dropdown || !dropdown.tagsConfig) return;
      const allOptions = dropdown.tagsConfig.options ?? [];
      const selectedValues = allOptions.slice(0, 3).map((o: any) => o.value ?? o.text);
      dropdown.tagsConfig = { ...dropdown.tagsConfig, selectedValues };
      dropdown.config = { ...dropdown.config, value: selectedValues };
      table.eventEmitter.emit('tagsChange',
        table.interactionManager.getCellInfo(dropdown.cell), selectedValues, true);
    });
    await page.waitForTimeout(200);

    // Click outside dropdown — should close (validation passes)
    await clickOutsideDropdown(page);

    expect(await isDropdownActive(page)).toBe(false);
  });
});

test.describe('Validation - Escape', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
    await page.waitForTimeout(500);
    await resetEditingState(page);
  });

  test('Escape cancels DOM editing even with validation error', async ({ page }) => {
    const started = await startDomEditing(page, 2, 'age');
    expect(started).toBe(true);
    expect(await isDomEditingActive(page)).toBe(true);

    await setInputValue(page, '5');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDomEditingActive(page)).toBe(false);
  });

  test('Escape closes dropdown even with validation error', async ({ page }) => {
    await scrollToColumn(page, 'skills');
    const started = await startTagsEditing(page, 2, 'skills');
    expect(started).toBe(true);
    expect(await isDropdownActive(page)).toBe(true);

    // Select 11 tags (validation error)
    await page.evaluate(() => {
      const table = window.table;
      const dropdown = table.interactionManager.getDropdown();
      if (!dropdown || !dropdown.tagsConfig) return;
      const allOptions = dropdown.tagsConfig.options ?? [];
      const selectedValues = allOptions.slice(0, 11).map((o: any) => o.value ?? o.text);
      dropdown.tagsConfig = { ...dropdown.tagsConfig, selectedValues };
      dropdown.config = { ...dropdown.config, value: selectedValues };
      table.eventEmitter.emit('tagsChange',
        table.interactionManager.getCellInfo(dropdown.cell), selectedValues, true);
    });
    await page.waitForTimeout(200);

    // Escape should always close dropdown (cancel, no validation)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    expect(await isDropdownActive(page)).toBe(false);
  });
});