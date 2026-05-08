import { SummaryManager } from "@/core/SummaryManager";
import type { Column, Row, SummaryConfig, SummaryContext } from "@/types";

function createRows(values: number[]): Row[] {
  return values.map((value, index) => ({
    id: `row-${index}`,
    data: {
      id: index + 1,
      name: `Item ${index + 1}`,
      category: index % 2 === 0 ? "A" : "B",
      amount: value,
    },
  }));
}

function createColumns(): Column[] {
  return [
    { key: "id", title: "ID", width: 80 },
    { key: "name", title: "Name", width: 120 },
    { key: "category", title: "Category", width: 100 },
    { key: "amount", title: "Amount", width: 100, type: "number" },
    { key: "hidden", title: "Hidden", hidden: true },
  ];
}

function createContext(overrides: Partial<SummaryContext> = {}): SummaryContext {
  const columns = createColumns();
  const allRows = createRows([10, 20, 30]);
  const viewRows = allRows.slice(0, 2);
  const visibleLeafColumns = columns.filter((column) => !column.hidden);

  return {
    columns,
    visibleLeafColumns,
    viewRows,
    allRows,
    scopeRows: viewRows,
    ...overrides,
  };
}

describe("SummaryManager", () => {
  it("uses bottom position and view scope by default", () => {
    const config: SummaryConfig = {
      rows: [{ key: "total", cells: [{ columnKey: "name", text: "Total" }] }],
    };

    const result = SummaryManager.buildRows(config, createContext(), 32);

    expect(result.enabled).toBe(true);
    expect(result.position).toBe("bottom");
    expect(result.scope).toBe("view");
    expect(result.rows).toHaveLength(1);
  });

  it("passes view rows or all rows according to scope", () => {
    const viewConfig: SummaryConfig = {
      scope: "view",
      rows: [
        {
          key: "view-total",
          build: ({ scopeRows }) => [
            {
              columnKey: "amount",
              value: scopeRows.reduce((total, row) => total + Number(row.data.amount), 0),
            },
          ],
        },
      ],
    };
    const allConfig: SummaryConfig = { ...viewConfig, scope: "all" };
    const context = createContext();

    const viewResult = SummaryManager.buildRows(viewConfig, context, 32);
    const allResult = SummaryManager.buildRows(allConfig, context, 32);

    expect(viewResult.rows[0]!.cells[0]!.renderResult.text).toBe("30");
    expect(allResult.rows[0]!.cells[0]!.renderResult.text).toBe("60");
  });

  it("lets build results override static cells and row height", () => {
    const config: SummaryConfig = {
      rows: [
        {
          key: "total",
          height: 32,
          cells: [{ columnKey: "name", text: "Static" }],
          build: () => ({
            height: 48,
            cells: [{ columnKey: "amount", value: 42, type: "number" }],
          }),
        },
      ],
    };

    const result = SummaryManager.buildRows(config, createContext(), 32);

    expect(result.rows[0]!.height).toBe(48);
    expect(result.rows[0]!.cells).toHaveLength(1);
    expect(result.rows[0]!.cells[0]!.startColumnKey).toBe("amount");
    expect(result.rows[0]!.cells[0]!.renderResult).toEqual({ text: "42", type: "number" });
  });

  it("maps single-column and cross-column cells by visible column key", () => {
    const config: SummaryConfig = {
      rows: [
        {
          key: "total",
          cells: [
            { startColumnKey: "name", endColumnKey: "category", text: "Total" },
            { columnKey: "amount", value: 30 },
          ],
        },
      ],
    };

    const result = SummaryManager.buildRows(config, createContext(), 32);

    expect(result.rows[0]!.cells[0]).toMatchObject({
      startColumnIndex: 1,
      endColumnIndex: 2,
      startColumnKey: "name",
      endColumnKey: "category",
    });
    expect(result.rows[0]!.cells[1]).toMatchObject({
      startColumnIndex: 3,
      endColumnIndex: 3,
      startColumnKey: "amount",
      endColumnKey: "amount",
    });
  });

  it("maps cells after hidden placeholders by the layout leaf column indices", () => {
    const columns: Column[] = [
      { key: "name", title: "Name", width: 120, fixed: "left" },
      {
        key: "__hidden_placeholder__secret",
        title: "",
        width: 5,
        fixed: "left",
      },
      { key: "avatar", title: "Avatar", width: 80, fixed: "left" },
      { key: "website", title: "Website", width: 150 },
      { key: "salary", title: "Salary", width: 100 },
    ];
    const config: SummaryConfig = {
      rows: [{ key: "total", cells: [{ columnKey: "salary", value: 30 }] }],
    };

    const result = SummaryManager.buildRows(
      config,
      createContext({ visibleLeafColumns: columns }),
      32,
    );

    expect(result.rows[0]!.cells[0]).toMatchObject({
      startColumnIndex: 4,
      endColumnIndex: 4,
      startColumnKey: "salary",
      endColumnKey: "salary",
    });
  });

  it("skips cells that reference hidden or missing columns", () => {
    const config: SummaryConfig = {
      rows: [
        {
          key: "total",
          cells: [
            { columnKey: "hidden", text: "Hidden" },
            { columnKey: "missing", text: "Missing" },
            { columnKey: "amount", value: 30 },
          ],
        },
      ],
    };

    const result = SummaryManager.buildRows(config, createContext(), 32);

    expect(result.rows[0]!.cells).toHaveLength(1);
    expect(result.rows[0]!.cells[0]!.startColumnKey).toBe("amount");
  });

  it("rejects overlapping cells in the same summary row", () => {
    const config: SummaryConfig = {
      rows: [
        {
          key: "total",
          cells: [
            { startColumnKey: "name", endColumnKey: "category", text: "Total" },
            { columnKey: "category", value: "Overlap" },
          ],
        },
      ],
    };

    expect(() => SummaryManager.buildRows(config, createContext(), 32)).toThrow(
      /overlapping summary cells/i,
    );
  });
});
