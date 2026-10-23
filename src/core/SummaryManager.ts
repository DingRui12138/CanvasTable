import type {
  Column,
  ComputedSummaryCell,
  ComputedSummaryResult,
  ComputedSummaryRow,
  RenderResult,
  SummaryCellConfig,
  SummaryConfig,
  SummaryContext,
  SummaryRowResult,
} from "../types";

export class SummaryManager {
  static buildRows(
    config: SummaryConfig | undefined,
    context: SummaryContext,
    defaultRowHeight: number,
  ): ComputedSummaryResult {
    const enabled = config?.enabled ?? Boolean(config?.rows?.length);
    const position = config?.position ?? "bottom";
    const scope = config?.scope ?? "view";

    if (!enabled || !config?.rows?.length) {
      return { enabled: false, position, scope, rows: [] };
    }

    const scopeRows = scope === "all" ? context.allRows : context.viewRows;
    const summaryContext: SummaryContext = {
      ...context,
      scopeRows,
    };
    // 预先建立 key -> 索引映射，避免每个合计单元格重复 findIndex/indexOf
    const columnIndexByKey = new Map(
      context.visibleLeafColumns.map((column, index) => [column.key, index]),
    );

    return {
      enabled,
      position,
      scope,
      rows: config.rows.map((rowConfig, rowIndex) => {
        const built = rowConfig.build?.(summaryContext);
        const result = this.normalizeRowResult(built, rowConfig.cells ?? []);
        const row: ComputedSummaryRow = {
          key: rowConfig.key,
          height: result.height ?? rowConfig.height ?? defaultRowHeight,
          cells: [],
          source: rowConfig,
          style: config.style,
        };

        row.cells = this.buildCells(result.cells, row, rowIndex, summaryContext, columnIndexByKey);
        return row;
      }),
    };
  }

  private static normalizeRowResult(
    result: SummaryCellConfig[] | SummaryRowResult | undefined,
    fallbackCells: SummaryCellConfig[],
  ): SummaryRowResult {
    if (Array.isArray(result)) {
      return { cells: result };
    }

    if (result) {
      return result;
    }

    return { cells: fallbackCells };
  }

  private static buildCells(
    cells: SummaryCellConfig[],
    row: ComputedSummaryRow,
    rowIndex: number,
    context: SummaryContext,
    columnIndexByKey: Map<string, number>,
  ): ComputedSummaryCell[] {
    const builtCells: ComputedSummaryCell[] = [];
    const occupiedColumns = new Set<number>();

    cells.forEach((cell, cellIndex) => {
      const range = this.resolveColumnRange(cell, context.visibleLeafColumns, columnIndexByKey);
      if (!range) return;

      for (let index = range.startColumnIndex; index <= range.endColumnIndex; index++) {
        if (occupiedColumns.has(index)) {
          throw new Error(`Overlapping summary cells in row "${row.key}"`);
        }
        occupiedColumns.add(index);
      }

      const column = context.visibleLeafColumns[range.startColumnIndex]!;
      builtCells.push({
        key: `${row.key}:${cellIndex}`,
        ...range,
        config: cell,
        renderResult: this.resolveRenderResult(
          cell,
          row,
          rowIndex,
          column,
          range.startColumnIndex,
          context,
        ),
      });
    });

    return builtCells;
  }

  private static resolveColumnRange(
    cell: SummaryCellConfig,
    visibleLeafColumns: Column[],
    columnIndexByKey: Map<string, number>,
  ):
    | {
        startColumnIndex: number;
        endColumnIndex: number;
        startColumnKey: string;
        endColumnKey: string;
      }
    | undefined {
    const startKey = cell.startColumnKey ?? cell.columnKey;
    const endKey = cell.endColumnKey ?? cell.columnKey ?? startKey;

    if (!startKey || !endKey) return undefined;

    const startColumnIndex = columnIndexByKey.get(startKey);
    const endColumnIndex = columnIndexByKey.get(endKey);

    if (startColumnIndex === undefined || endColumnIndex === undefined) return undefined;

    const start = Math.min(startColumnIndex, endColumnIndex);
    const end = Math.max(startColumnIndex, endColumnIndex);

    return {
      startColumnIndex: start,
      endColumnIndex: end,
      startColumnKey: visibleLeafColumns[start]!.key,
      endColumnKey: visibleLeafColumns[end]!.key,
    };
  }

  private static resolveRenderResult(
    cell: SummaryCellConfig,
    row: ComputedSummaryRow,
    rowIndex: number,
    column: Column,
    columnIndex: number,
    context: SummaryContext,
  ): RenderResult {
    if (cell.render) {
      return cell.render({
        cell,
        row,
        rowIndex,
        column,
        columnIndex,
        context,
      });
    }

    return {
      text: String(cell.text ?? cell.value ?? ""),
      type: cell.type ?? "text",
      style: cell.style,
    };
  }
}
