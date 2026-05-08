import { buildExcelExportModel, createXlsxBlob, createXlsxBlobFromModel } from '@/utils/xlsx';
import type { ComputedSummaryRow, ExportContext } from '@/types';

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

function createContext(overrides: Partial<ExportContext> = {}): ExportContext {
  return {
    columnTree: [],
    leafColumns: [],
    rows: [],
    headerDepth: 0,
    leftFixedLeafColumnCount: 0,
    bodyMerges: [],
    ...overrides,
  };
}

describe('createXlsxBlob', () => {
  it('exports the xlsx helpers from the dedicated module', () => {
    expect(typeof createXlsxBlob).toBe('function');
    expect(typeof buildExcelExportModel).toBe('function');
  });

  it('creates a real xlsx zip package with escaped worksheet text', async () => {
    const blob = createXlsxBlob([
      ['Name', 'Note'],
      ['Alice', 'A&B <ok>'],
    ]);

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const bytes = new Uint8Array(await readBlob(blob));
    expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe('PK');

    const content = Buffer.from(bytes).toString('utf8');
    expect(content).toContain('[Content_Types].xml');
    expect(content).toContain('xl/worksheets/sheet1.xml');
    expect(content).toContain('<t>A&amp;B &lt;ok&gt;</t>');
  });

  it('builds merged hierarchical header rows by default', () => {
    const model = buildExcelExportModel(
      createContext({
        columnTree: [
          {
            key: 'person',
            title: 'Person',
            children: [
              { key: 'name', title: 'Name' },
              { key: 'age', title: 'Age', type: 'number' },
            ],
          },
          { key: 'createdAt', title: 'Created At', type: 'date' },
        ],
        leafColumns: [
          { key: 'name', title: 'Name' },
          { key: 'age', title: 'Age', type: 'number' },
          { key: 'createdAt', title: 'Created At', type: 'date' },
        ],
        headerDepth: 2,
      }),
      { hierarchicalHeaders: true },
      'Sheet1',
    );

    expect(model.rows.slice(0, 2).map((row) => row.cells.map((cell) => cell.value))).toEqual([
      ['Person', '', 'Created At'],
      ['Name', 'Age', ''],
    ]);
    expect(model.merges).toEqual([
      { startRow: 0, startCol: 0, endRow: 0, endCol: 1 },
      { startRow: 0, startCol: 2, endRow: 1, endCol: 2 },
    ]);
  });

  it('resolves explicit column widths before schema widths and builds typed body rows', () => {
    const model = buildExcelExportModel(
      createContext({
        leafColumns: [
          { key: 'name', title: 'Name', width: 120 },
          { key: 'amount', title: 'Amount', width: 80, type: 'number' },
          { key: 'active', title: 'Active' },
        ],
        rows: [
          {
            row: { id: 'row-1', data: {} },
            rowIndex: 0,
            cells: [
              { column: { key: 'name', title: 'Name', width: 120 }, rawValue: 'Alice', displayValue: 'Alice' },
              {
                column: { key: 'amount', title: 'Amount', width: 80, type: 'number' },
                rawValue: 42.5,
                displayValue: '42.5',
              },
              { column: { key: 'active', title: 'Active' }, rawValue: true, displayValue: 'true' },
            ],
          },
        ],
      }),
      { columnWidths: [{ key: 'amount', width: 160 }] },
      'Sheet1',
    );

    expect(model.columns).toEqual([
      { key: 'name', width: 120 },
      { key: 'amount', width: 160 },
      { key: 'active' },
    ]);
    expect(model.rows.at(-1)?.cells).toEqual([
      { value: 'Alice', type: 'string' },
      { value: 42.5, type: 'number' },
      { value: true, type: 'boolean' },
    ]);
  });

  it('includes summary rows and converts cross-column summary cells to merge ranges', () => {
    const topSummary: ComputedSummaryRow = {
      key: 'top',
      height: 32,
      source: { key: 'top', cells: [] },
      cells: [
        {
          key: 'top:label',
          startColumnIndex: 0,
          endColumnIndex: 1,
          startColumnKey: 'name',
          endColumnKey: 'amount',
          config: { startColumnKey: 'name', endColumnKey: 'amount', text: 'Report Total' },
          renderResult: { text: 'Report Total', type: 'text' },
        },
      ],
    };
    const bottomSummary: ComputedSummaryRow = {
      key: 'bottom',
      height: 32,
      source: { key: 'bottom', cells: [] },
      cells: [
        {
          key: 'bottom:label',
          startColumnIndex: 0,
          endColumnIndex: 0,
          startColumnKey: 'name',
          endColumnKey: 'name',
          config: { columnKey: 'name', text: 'Total' },
          renderResult: { text: 'Total', type: 'text' },
        },
        {
          key: 'bottom:amount',
          startColumnIndex: 1,
          endColumnIndex: 1,
          startColumnKey: 'amount',
          endColumnKey: 'amount',
          config: { columnKey: 'amount', value: 42, type: 'number' },
          renderResult: { text: '42', type: 'number' },
        },
      ],
    };

    const model = buildExcelExportModel(
      createContext({
        leafColumns: [
          { key: 'name', title: 'Name' },
          { key: 'amount', title: 'Amount', type: 'number' },
        ],
        headerDepth: 1,
        rows: [
          {
            row: { id: 'row-1', data: {} },
            rowIndex: 0,
            cells: [
              { column: { key: 'name', title: 'Name' }, rawValue: 'Alice', displayValue: 'Alice' },
              { column: { key: 'amount', title: 'Amount', type: 'number' }, rawValue: 42, displayValue: '42' },
            ],
          },
        ],
        summaryTopRows: [topSummary],
        summaryBottomRows: [bottomSummary],
      }),
      { hierarchicalHeaders: false },
      'Sheet1',
    );

    expect(model.rows.map((row) => row.cells.map((cell) => cell.value))).toEqual([
      ['Name', 'Amount'],
      ['Report Total', ''],
      ['Alice', 42],
      ['Total', 42],
    ]);
    expect(model.rows.map((row) => row.kind)).toEqual(['header', 'summary', 'body', 'summary']);
    expect(model.merges).toContainEqual({ startRow: 1, startCol: 0, endRow: 1, endCol: 1 });
  });

  it('uses explicit export merges instead of current-view body merges', () => {
    const model = buildExcelExportModel(
      createContext({
        leafColumns: [{ key: 'name', title: 'Name' }],
        headerDepth: 1,
        bodyMerges: [{ startRow: 0, startCol: 0, endRow: 2, endCol: 0 }],
      }),
      { merges: [{ startRow: 0, startCol: 0, endRow: 1, endCol: 0 }] },
      'Sheet1',
    );

    expect(model.merges).toContainEqual({ startRow: 1, startCol: 0, endRow: 2, endCol: 0 });
    expect(model.merges).not.toContainEqual({ startRow: 1, startCol: 0, endRow: 3, endCol: 0 });
  });

  it('serializes freeze panes for header rows and left fixed columns', async () => {
    const model = buildExcelExportModel(
      createContext({
        columnTree: [{ key: 'name', title: 'Name', fixed: 'left' }],
        leafColumns: [{ key: 'name', title: 'Name', fixed: 'left' }],
        headerDepth: 2,
        leftFixedLeafColumnCount: 1,
      }),
      { freeze: { header: true, leftFixedColumns: true } },
      'Sheet1',
    );

    const blob = createXlsxBlobFromModel(model);
    const content = Buffer.from(new Uint8Array(await readBlob(blob))).toString('utf8');

    expect(content).toContain('<pane xSplit="1" ySplit="2" topLeftCell="B3" state="frozen"/>');
  });

  it('serializes column widths and mergeCells into worksheet xml', async () => {
    const model = buildExcelExportModel(
      createContext({
        leafColumns: [{ key: 'name', title: 'Name', width: 140 }],
        headerDepth: 1,
      }),
      {
        columnWidths: [{ key: 'name', width: 140 }],
        merges: [{ startRow: 0, startCol: 0, endRow: 1, endCol: 0 }],
      },
      'Sheet1',
    );

    const blob = createXlsxBlobFromModel(model);
    const content = Buffer.from(new Uint8Array(await readBlob(blob))).toString('utf8');

    expect(content).toContain('<cols>');
    expect(content).toContain('<col min="1" max="1"');
    expect(content).toContain('<mergeCell ref="A2:A3"/>');
  });

  it('serializes number cells as numeric values', async () => {
    const model = buildExcelExportModel(
      createContext({
        leafColumns: [{ key: 'amount', title: 'Amount', type: 'number' }],
        rows: [
          {
            row: { id: 'row-1', data: {} },
            rowIndex: 0,
            cells: [
              {
                column: { key: 'amount', title: 'Amount', type: 'number' },
                rawValue: 42.5,
                displayValue: '42.5',
              },
            ],
          },
        ],
      }),
      undefined,
      'Sheet1',
    );

    const blob = createXlsxBlobFromModel(model);
    const content = Buffer.from(new Uint8Array(await readBlob(blob))).toString('utf8');

    expect(content).toContain('<v>42.5</v>');
  });

  it('serializes date cells using excel serial values and styles.xml', async () => {
    const model = buildExcelExportModel(
      createContext({
        leafColumns: [{ key: 'createdAt', title: 'Created At', type: 'date' }],
        rows: [
          {
            row: { id: 'row-1', data: {} },
            rowIndex: 0,
            cells: [
              {
                column: { key: 'createdAt', title: 'Created At', type: 'date' },
                rawValue: '2026-04-29',
                displayValue: '2026-04-29',
              },
            ],
          },
        ],
      }),
      undefined,
      'Sheet1',
    );

    const blob = createXlsxBlobFromModel(model);
    const content = Buffer.from(new Uint8Array(await readBlob(blob))).toString('utf8');

    expect(content).toContain('xl/styles.xml');
    expect(content).toMatch(/<numFmt numFmtId="\d+" formatCode="yyyy-mm-dd"/);
    expect(content).not.toContain('<t>2026-04-29</t>');
  });
});
