import type {
  Column,
  ComputedSummaryRow,
  ExcelExportOptions,
  ExportContext,
  ExportMerge,
} from "../types";

const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

export interface ExcelSheetModel {
  sheetName: string;
  columns: Array<{ key: string; width?: number }>;
  rows: Array<{
    kind: "header" | "body" | "summary";
    cells: Array<{
      value: string | number | boolean | Date | null;
      type: "string" | "number" | "boolean" | "date" | "blank";
      styleId?: number;
    }>;
  }>;
  merges: ExportMerge[];
  freeze?: { xSplit: number; ySplit: number; topLeftCell: string };
  styles: Array<{ numFmtId?: number }>;
  numFmts: Array<{ id: number; formatCode: string }>;
}

type ExcelCellModel = ExcelSheetModel["rows"][number]["cells"][number];

function resolveColumnFormat(
  column: Column,
  options: ExcelExportOptions | undefined,
): { type: "number" | "date"; formatCode: string } | undefined {
  const explicit = options?.formats?.find((entry) => entry.key === column.key);
  if (explicit?.type && explicit.formatCode) {
    return { type: explicit.type, formatCode: explicit.formatCode };
  }
  if (column.type === "date") {
    return { type: "date", formatCode: "yyyy-mm-dd" };
  }
  if (column.type === "number") {
    return { type: "number", formatCode: "General" };
  }
  return undefined;
}

function createStyleRegistry() {
  const numFmtByCode = new Map<string, number>();
  const styleByKey = new Map<string, number>();
  const numFmts: Array<{ id: number; formatCode: string }> = [];
  const styles: Array<{ numFmtId?: number }> = [{}];

  return {
    styles,
    numFmts,
    getStyleId(formatCode?: string) {
      if (!formatCode || formatCode === "General") {
        return 0;
      }
      let numFmtId = numFmtByCode.get(formatCode);
      if (!numFmtId) {
        numFmtId = 164 + numFmts.length;
        numFmtByCode.set(formatCode, numFmtId);
        numFmts.push({ id: numFmtId, formatCode });
      }
      const styleKey = `numFmt:${numFmtId}`;
      let styleId = styleByKey.get(styleKey);
      if (styleId === undefined) {
        styleId = styles.length;
        styles.push({ numFmtId });
        styleByKey.set(styleKey, styleId);
      }
      return styleId;
    },
  };
}

function toExcelDateSerial(value: Date | string | number): number | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getTime() / 86400000 + 25569;
}

function buildBodyRows(
  context: ExportContext,
  options: ExcelExportOptions | undefined,
  styleRegistry: ReturnType<typeof createStyleRegistry>,
): ExcelSheetModel["rows"] {
  return context.rows.map((exportRow) => ({
    kind: "body",
    cells: exportRow.cells.map((cell) => {
      const columnFormat = resolveColumnFormat(cell.column, options);

      if (columnFormat?.type === "date") {
        const serial = toExcelDateSerial(cell.rawValue as Date | string | number);
        if (serial !== null) {
          return {
            value: serial,
            type: "number" as const,
            styleId: styleRegistry.getStyleId(columnFormat.formatCode),
          };
        }
      }

      if (typeof cell.rawValue === "number" && Number.isFinite(cell.rawValue)) {
        const styleId = styleRegistry.getStyleId(columnFormat?.formatCode);
        return {
          value: cell.rawValue,
          type: "number" as const,
          ...(styleId > 0 ? { styleId } : {}),
        };
      }
      if (typeof cell.rawValue === "boolean") {
        return { value: cell.rawValue, type: "boolean" as const };
      }
      return { value: cell.displayValue, type: "string" as const };
    }),
  }));
}

function buildSummaryRows(
  summaryRows: ComputedSummaryRow[] | undefined,
  columnCount: number,
): {
  rows: ExcelSheetModel["rows"];
  merges: ExportMerge[];
} {
  const rows: ExcelSheetModel["rows"] = [];
  const merges: ExportMerge[] = [];

  for (const summaryRow of summaryRows ?? []) {
    const cells: ExcelCellModel[] = Array.from({ length: columnCount }, () => ({
      value: "",
      type: "blank" as const,
    }));

    for (const summaryCell of summaryRow.cells) {
      if (summaryCell.startColumnIndex < 0 || summaryCell.startColumnIndex >= columnCount) {
        continue;
      }
      if (summaryCell.endColumnIndex < summaryCell.startColumnIndex) {
        continue;
      }

      const value = summaryCell.config.value ?? summaryCell.renderResult.text ?? "";
      const type =
        typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string";
      cells[summaryCell.startColumnIndex] = {
        value: value as string | number | boolean,
        type,
      };

      if (summaryCell.endColumnIndex > summaryCell.startColumnIndex) {
        merges.push({
          startRow: rows.length,
          startCol: summaryCell.startColumnIndex,
          endRow: rows.length,
          endCol: Math.min(summaryCell.endColumnIndex, columnCount - 1),
        });
      }
    }

    rows.push({ kind: "summary", cells });
  }

  return { rows, merges };
}

function resolveColumnWidth(
  column: Column,
  widthOption: ExcelExportOptions["columnWidths"],
): number | undefined {
  if (Array.isArray(widthOption)) {
    const explicit = widthOption.find((entry) => entry.key === column.key);
    if (explicit) {
      return explicit.width;
    }
  }

  return column.width;
}

function columnNumberToName(index: number): string {
  let value = index;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function toCellRef(rowIndex: number, columnIndex: number): string {
  return `${columnNumberToName(columnIndex + 1)}${rowIndex + 1}`;
}

function pixelWidthToExcelWidth(width: number): string {
  return Math.max(0, width / 7).toFixed(2);
}

function offsetMerges(merges: ExportMerge[], rowOffset: number): ExportMerge[] {
  return merges.map((merge) => ({
    startRow: merge.startRow + rowOffset,
    startCol: merge.startCol,
    endRow: merge.endRow + rowOffset,
    endCol: merge.endCol,
  }));
}

function validateMerges(merges: ExportMerge[]): void {
  for (const merge of merges) {
    if (merge.endRow < merge.startRow || merge.endCol < merge.startCol) {
      throw new Error(`Invalid merge range: ${JSON.stringify(merge)}`);
    }
  }

  for (let i = 0; i < merges.length; i++) {
    for (let j = i + 1; j < merges.length; j++) {
      const a = merges[i]!;
      const b = merges[j]!;
      const overlap =
        a.startRow <= b.endRow &&
        a.endRow >= b.startRow &&
        a.startCol <= b.endCol &&
        a.endCol >= b.startCol;

      if (overlap) {
        throw new Error(`Overlapping merge ranges: ${JSON.stringify(a)} and ${JSON.stringify(b)}`);
      }
    }
  }
}

function resolveFreeze(
  context: ExportContext,
  options: ExcelExportOptions | undefined,
  headerRowCount: number,
): ExcelSheetModel["freeze"] | undefined {
  const xSplit =
    options?.freeze?.xSplit ??
    (options?.freeze?.leftFixedColumns === false ? 0 : context.leftFixedLeafColumnCount);
  const ySplit =
    options?.freeze?.ySplit ?? (options?.freeze?.header === false ? 0 : headerRowCount);

  if (xSplit === 0 && ySplit === 0) {
    return undefined;
  }

  return {
    xSplit,
    ySplit,
    topLeftCell: `${columnNumberToName(xSplit + 1)}${ySplit + 1}`,
  };
}

function columnsXml(columns: ExcelSheetModel["columns"]): string {
  const cols = columns
    .map((column, index) =>
      column.width
        ? `<col min="${index + 1}" max="${index + 1}" width="${pixelWidthToExcelWidth(column.width)}" customWidth="1"/>`
        : "",
    )
    .filter(Boolean)
    .join("");
  return cols ? `<cols>${cols}</cols>` : "";
}

function sheetViewsXml(freeze: ExcelSheetModel["freeze"]): string {
  if (!freeze) {
    return `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  }

  return `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${freeze.xSplit}" ySplit="${freeze.ySplit}" topLeftCell="${freeze.topLeftCell}" state="frozen"/></sheetView></sheetViews>`;
}

function mergeCellsXml(merges: ExportMerge[]): string {
  if (merges.length === 0) {
    return "";
  }

  const refs = merges
    .map(
      (merge) =>
        `<mergeCell ref="${toCellRef(merge.startRow, merge.startCol)}:${toCellRef(merge.endRow, merge.endCol)}"/>`,
    )
    .join("");
  return `<mergeCells count="${merges.length}">${refs}</mergeCells>`;
}

function stylesXml(model: ExcelSheetModel): string {
  const numFmtsXml = model.numFmts.length
    ? `<numFmts count="${model.numFmts.length}">${model.numFmts
        .map((fmt) => `<numFmt numFmtId="${fmt.id}" formatCode="${escapeXml(fmt.formatCode)}"/>`)
        .join("")}</numFmts>`
    : "";
  const cellXfs = (model.styles.length > 0 ? model.styles : [{}])
    .map(
      (style) =>
        `<xf numFmtId="${style.numFmtId ?? 0}" fontId="0" fillId="0" borderId="0" xfId="0"${
          style.numFmtId ? ` applyNumberFormat="1"` : ""
        }/>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${numFmtsXml}
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${model.styles.length > 0 ? model.styles.length : 1}">${cellXfs}</cellXfs>
</styleSheet>`;
}

function worksheetXmlFromModel(model: ExcelSheetModel): string {
  const rowsXml = model.rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row.cells
        .map((cell, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowNumber}`;
          const styleAttr = cell.styleId !== undefined ? ` s="${cell.styleId}"` : "";

          if (cell.type === "blank") {
            return `<c r="${ref}"${styleAttr}/>`;
          }

          if (cell.type === "number") {
            return `<c r="${ref}"${styleAttr}><v>${cell.value}</v></c>`;
          }

          if (cell.type === "boolean") {
            return `<c r="${ref}" t="b"${styleAttr}><v>${cell.value ? 1 : 0}</v></c>`;
          }

          return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t>${escapeXml(cell.value)}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${sheetViewsXml(model.freeze)}${columnsXml(model.columns)}<sheetData>${rowsXml}</sheetData>${mergeCellsXml(model.merges)}</worksheet>`;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function encodeUtf8(input: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let codePoint = input.codePointAt(i)!;
    if (codePoint > 0xffff) {
      i++;
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number): string {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function sheetNameXml(name: string): string {
  const trimmed = name.trim() || "Sheet1";
  return escapeXml(trimmed.slice(0, 31));
}

function worksheetXml(data: unknown[][]): string {
  const rows = data
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row
        .map((cell, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowNumber}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}

function createZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name);
    const data = encodeUtf8(file.content);
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, 0);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, data.length);
    writeUint32(localHeader, 22, data.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, 0);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, data.length);
    writeUint32(centralHeader, 24, data.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const endRecord = new Uint8Array(22);
  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 4, 0);
  writeUint16(endRecord, 6, 0);
  writeUint16(endRecord, 8, files.length);
  writeUint16(endRecord, 10, files.length);
  writeUint32(endRecord, 12, centralDirectory.length);
  writeUint32(endRecord, 16, offset);
  writeUint16(endRecord, 20, 0);

  return concatBytes([...localParts, centralDirectory, endRecord]);
}

function buildHeaderRows(
  columns: Column[],
  headerDepth: number,
): {
  rows: ExcelSheetModel["rows"];
  merges: ExportMerge[];
} {
  const matrix = Array.from({ length: headerDepth }, () => [] as ExcelCellModel[]);
  const merges: ExportMerge[] = [];

  const visit = (column: Column, depth: number, startCol: number): number => {
    if (column.children && column.children.length > 0) {
      matrix[depth]![startCol] = { value: column.title, type: "string" };
      let cursor = startCol;
      for (const child of column.children) {
        cursor = visit(child, depth + 1, cursor);
      }
      if (cursor - 1 > startCol) {
        merges.push({ startRow: depth, startCol, endRow: depth, endCol: cursor - 1 });
      }
      return cursor;
    }

    matrix[depth]![startCol] = { value: column.title, type: "string" };
    if (depth < headerDepth - 1) {
      merges.push({ startRow: depth, startCol, endRow: headerDepth - 1, endCol: startCol });
    }
    return startCol + 1;
  };

  let leafIndex = 0;
  for (const column of columns) {
    leafIndex = visit(column, 0, leafIndex);
  }

  return {
    rows: matrix.map((cells) => ({
      kind: "header",
      cells: Array.from(
        { length: leafIndex },
        (_, index) => cells[index] ?? { value: "", type: "blank" },
      ),
    })),
    merges,
  };
}

export function buildExcelExportModel(
  context: ExportContext,
  options: ExcelExportOptions | undefined,
  sheetName: string,
): ExcelSheetModel {
  const includeHierarchicalHeaders =
    options?.hierarchicalHeaders !== false && context.headerDepth > 0;
  const headerSection = includeHierarchicalHeaders
    ? buildHeaderRows(context.columnTree, context.headerDepth)
    : {
        rows:
          context.leafColumns.length > 0
            ? [
                {
                  kind: "header" as const,
                  cells: context.leafColumns.map((column) => ({
                    value: column.title,
                    type: "string" as const,
                  })),
                },
              ]
            : [],
        merges: [],
      };
  const styleRegistry = createStyleRegistry();
  const topSummarySection = buildSummaryRows(context.summaryTopRows, context.leafColumns.length);
  const bodyRows = buildBodyRows(context, options, styleRegistry);
  const bottomSummarySection = buildSummaryRows(
    context.summaryBottomRows,
    context.leafColumns.length,
  );
  const bodyRowOffset = headerSection.rows.length + topSummarySection.rows.length;
  const bottomSummaryRowOffset = bodyRowOffset + bodyRows.length;
  const bodyMerges = offsetMerges(options?.merges ?? context.bodyMerges, bodyRowOffset);
  const topSummaryMerges = offsetMerges(topSummarySection.merges, headerSection.rows.length);
  const bottomSummaryMerges = offsetMerges(bottomSummarySection.merges, bottomSummaryRowOffset);
  const merges = [
    ...headerSection.merges,
    ...topSummaryMerges,
    ...bodyMerges,
    ...bottomSummaryMerges,
  ];
  validateMerges(merges);
  const freeze = resolveFreeze(context, options, headerSection.rows.length);

  return {
    sheetName,
    columns: context.leafColumns.map((column) => ({
      key: column.key,
      width: resolveColumnWidth(column, options?.columnWidths),
    })),
    rows: [
      ...headerSection.rows,
      ...topSummarySection.rows,
      ...bodyRows,
      ...bottomSummarySection.rows,
    ],
    merges,
    freeze,
    styles: styleRegistry.styles,
    numFmts: styleRegistry.numFmts,
  };
}

export function createXlsxBlobFromModel(model: ExcelSheetModel): Blob {
  const safeSheetName = sheetNameXml(model.sheetName);
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Canvas Table</Application></Properties>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Canvas Table</dc:creator><cp:lastModifiedBy>Canvas Table</cp:lastModifiedBy></cp:coreProperties>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: stylesXml(model),
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: worksheetXmlFromModel(model),
    },
  ];

  const zip = createZip(files);
  const buffer = new ArrayBuffer(zip.byteLength);
  new Uint8Array(buffer).set(zip);
  return new Blob([buffer], { type: XLSX_MIME_TYPE });
}

export function createXlsxBlob(data: unknown[][], sheetName: string = "Sheet1"): Blob {
  const safeSheetName = sheetNameXml(sheetName);
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Canvas Table</Application></Properties>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Canvas Table</dc:creator><cp:lastModifiedBy>Canvas Table</cp:lastModifiedBy></cp:coreProperties>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: worksheetXml(data),
    },
  ];

  const zip = createZip(files);
  const buffer = new ArrayBuffer(zip.byteLength);
  new Uint8Array(buffer).set(zip);
  return new Blob([buffer], { type: XLSX_MIME_TYPE });
}
