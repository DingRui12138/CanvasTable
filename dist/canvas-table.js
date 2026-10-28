const CellTypes = {
  TEXT: "text",
  NUMBER: "number",
  BOOLEAN: "boolean",
  LINK: "link",
  TAG: "tag",
  DATE: "date",
  CUSTOM: "custom",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  BUTTON: "button",
  INPUT: "input",
  SELECT: "select",
  SWITCH: "switch",
  IMAGE: "image",
  PROGRESS: "progress",
  RATING: "rating",
  COLOR: "color"
};
const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 3988292384 ^ crc >>> 1 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();
function resolveColumnFormat(column, options) {
  const explicit = options?.formats?.find((entry) => entry.key === column.key);
  if (explicit?.type && explicit.formatCode) {
    return { type: explicit.type, formatCode: explicit.formatCode };
  }
  if (column.type === CellTypes.DATE) {
    return { type: "date", formatCode: "yyyy-mm-dd" };
  }
  if (column.type === CellTypes.NUMBER) {
    return { type: "number", formatCode: "General" };
  }
  return void 0;
}
function createStyleRegistry() {
  const numFmtByCode = /* @__PURE__ */ new Map();
  const styleByKey = /* @__PURE__ */ new Map();
  const numFmts = [];
  const styles = [{}];
  return {
    styles,
    numFmts,
    getStyleId(formatCode) {
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
      if (styleId === void 0) {
        styleId = styles.length;
        styles.push({ numFmtId });
        styleByKey.set(styleKey, styleId);
      }
      return styleId;
    }
  };
}
function toExcelDateSerial(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getTime() / 864e5 + 25569;
}
function buildBodyRows(context, options, styleRegistry) {
  return context.rows.map((exportRow) => ({
    kind: "body",
    cells: exportRow.cells.map((cell) => {
      const columnFormat = resolveColumnFormat(cell.column, options);
      if (columnFormat?.type === "date") {
        const serial = toExcelDateSerial(cell.rawValue);
        if (serial !== null) {
          return {
            value: serial,
            type: "number",
            styleId: styleRegistry.getStyleId(columnFormat.formatCode)
          };
        }
      }
      if (typeof cell.rawValue === "number" && Number.isFinite(cell.rawValue)) {
        const styleId = styleRegistry.getStyleId(columnFormat?.formatCode);
        return {
          value: cell.rawValue,
          type: "number",
          ...styleId > 0 ? { styleId } : {}
        };
      }
      if (typeof cell.rawValue === "boolean") {
        return { value: cell.rawValue, type: "boolean" };
      }
      return { value: cell.displayValue, type: "string" };
    })
  }));
}
function buildSummaryRows(summaryRows, columnCount) {
  const rows = [];
  const merges = [];
  for (const summaryRow of summaryRows ?? []) {
    const cells = Array.from({ length: columnCount }, () => ({
      value: "",
      type: "blank"
    }));
    for (const summaryCell of summaryRow.cells) {
      if (summaryCell.startColumnIndex < 0 || summaryCell.startColumnIndex >= columnCount) {
        continue;
      }
      if (summaryCell.endColumnIndex < summaryCell.startColumnIndex) {
        continue;
      }
      const value = summaryCell.config.value ?? summaryCell.renderResult.text ?? "";
      const type = typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string";
      cells[summaryCell.startColumnIndex] = {
        value,
        type
      };
      if (summaryCell.endColumnIndex > summaryCell.startColumnIndex) {
        merges.push({
          startRow: rows.length,
          startCol: summaryCell.startColumnIndex,
          endRow: rows.length,
          endCol: Math.min(summaryCell.endColumnIndex, columnCount - 1)
        });
      }
    }
    rows.push({ kind: "summary", cells });
  }
  return { rows, merges };
}
function resolveColumnWidth(column, widthOption) {
  if (Array.isArray(widthOption)) {
    const explicit = widthOption.find((entry) => entry.key === column.key);
    if (explicit) {
      return explicit.width;
    }
  }
  return column.width;
}
function columnNumberToName(index) {
  let value = index;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}
function toCellRef(rowIndex, columnIndex) {
  return `${columnNumberToName(columnIndex + 1)}${rowIndex + 1}`;
}
function pixelWidthToExcelWidth(width) {
  return Math.max(0, width / 7).toFixed(2);
}
function offsetMerges(merges, rowOffset) {
  return merges.map((merge) => ({
    startRow: merge.startRow + rowOffset,
    startCol: merge.startCol,
    endRow: merge.endRow + rowOffset,
    endCol: merge.endCol
  }));
}
function validateMerges(merges) {
  for (const merge of merges) {
    if (merge.endRow < merge.startRow || merge.endCol < merge.startCol) {
      throw new Error(`Invalid merge range: ${JSON.stringify(merge)}`);
    }
  }
  for (let i = 0; i < merges.length; i++) {
    for (let j = i + 1; j < merges.length; j++) {
      const a = merges[i];
      const b = merges[j];
      const overlap = a.startRow <= b.endRow && a.endRow >= b.startRow && a.startCol <= b.endCol && a.endCol >= b.startCol;
      if (overlap) {
        throw new Error(`Overlapping merge ranges: ${JSON.stringify(a)} and ${JSON.stringify(b)}`);
      }
    }
  }
}
function resolveFreeze(context, options, headerRowCount) {
  const xSplit = options?.freeze?.xSplit ?? (options?.freeze?.leftFixedColumns === false ? 0 : context.leftFixedLeafColumnCount);
  const ySplit = options?.freeze?.ySplit ?? (options?.freeze?.header === false ? 0 : headerRowCount);
  if (xSplit === 0 && ySplit === 0) {
    return void 0;
  }
  return {
    xSplit,
    ySplit,
    topLeftCell: `${columnNumberToName(xSplit + 1)}${ySplit + 1}`
  };
}
function columnsXml(columns) {
  const cols = columns.map(
    (column, index) => column.width ? `<col min="${index + 1}" max="${index + 1}" width="${pixelWidthToExcelWidth(column.width)}" customWidth="1"/>` : ""
  ).filter(Boolean).join("");
  return cols ? `<cols>${cols}</cols>` : "";
}
function sheetViewsXml(freeze) {
  if (!freeze) {
    return `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  }
  return `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${freeze.xSplit}" ySplit="${freeze.ySplit}" topLeftCell="${freeze.topLeftCell}" state="frozen"/></sheetView></sheetViews>`;
}
function mergeCellsXml(merges) {
  if (merges.length === 0) {
    return "";
  }
  const refs = merges.map(
    (merge) => `<mergeCell ref="${toCellRef(merge.startRow, merge.startCol)}:${toCellRef(merge.endRow, merge.endCol)}"/>`
  ).join("");
  return `<mergeCells count="${merges.length}">${refs}</mergeCells>`;
}
function stylesXml(model) {
  const numFmtsXml = model.numFmts.length ? `<numFmts count="${model.numFmts.length}">${model.numFmts.map((fmt) => `<numFmt numFmtId="${fmt.id}" formatCode="${escapeXml(fmt.formatCode)}"/>`).join("")}</numFmts>` : "";
  const cellXfs = (model.styles.length > 0 ? model.styles : [{}]).map(
    (style) => `<xf numFmtId="${style.numFmtId ?? 0}" fontId="0" fillId="0" borderId="0" xfId="0"${style.numFmtId ? ` applyNumberFormat="1"` : ""}/>`
  ).join("");
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
function worksheetXmlFromModel(model) {
  const rowsXml = model.rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = row.cells.map((cell, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowNumber}`;
      const styleAttr = cell.styleId !== void 0 ? ` s="${cell.styleId}"` : "";
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
    }).join("");
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${sheetViewsXml(model.freeze)}${columnsXml(model.columns)}<sheetData>${rowsXml}</sheetData>${mergeCellsXml(model.merges)}</worksheet>`;
}
function crc32(data) {
  let crc = 4294967295;
  for (const byte of data) {
    crc = CRC32_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}
function writeUint16(target, offset, value) {
  target[offset] = value & 255;
  target[offset + 1] = value >>> 8 & 255;
}
function writeUint32(target, offset, value) {
  target[offset] = value & 255;
  target[offset + 1] = value >>> 8 & 255;
  target[offset + 2] = value >>> 16 & 255;
  target[offset + 3] = value >>> 24 & 255;
}
function concatBytes(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
function encodeUtf8(input) {
  const bytes = [];
  for (let i = 0; i < input.length; i++) {
    let codePoint = input.codePointAt(i);
    if (codePoint > 65535) {
      i++;
    }
    if (codePoint <= 127) {
      bytes.push(codePoint);
    } else if (codePoint <= 2047) {
      bytes.push(192 | codePoint >> 6, 128 | codePoint & 63);
    } else if (codePoint <= 65535) {
      bytes.push(
        224 | codePoint >> 12,
        128 | codePoint >> 6 & 63,
        128 | codePoint & 63
      );
    } else {
      bytes.push(
        240 | codePoint >> 18,
        128 | codePoint >> 12 & 63,
        128 | codePoint >> 6 & 63,
        128 | codePoint & 63
      );
    }
  }
  return new Uint8Array(bytes);
}
function escapeXml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function columnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}
function sheetNameXml(name) {
  const trimmed = name.trim() || "Sheet1";
  return escapeXml(trimmed.slice(0, 31));
}
function worksheetXml(data) {
  const rows = data.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = row.map((cell, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowNumber}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}
function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = encodeUtf8(file.name);
    const data = encodeUtf8(file.content);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 67324752);
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
    writeUint32(centralHeader, 0, 33639248);
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
  writeUint32(endRecord, 0, 101010256);
  writeUint16(endRecord, 4, 0);
  writeUint16(endRecord, 6, 0);
  writeUint16(endRecord, 8, files.length);
  writeUint16(endRecord, 10, files.length);
  writeUint32(endRecord, 12, centralDirectory.length);
  writeUint32(endRecord, 16, offset);
  writeUint16(endRecord, 20, 0);
  return concatBytes([...localParts, centralDirectory, endRecord]);
}
function buildHeaderRows(columns, headerDepth) {
  const matrix = Array.from({ length: headerDepth }, () => []);
  const merges = [];
  const visit = (column, depth, startCol) => {
    if (column.children && column.children.length > 0) {
      matrix[depth][startCol] = { value: column.title, type: "string" };
      let cursor = startCol;
      for (const child of column.children) {
        cursor = visit(child, depth + 1, cursor);
      }
      if (cursor - 1 > startCol) {
        merges.push({ startRow: depth, startCol, endRow: depth, endCol: cursor - 1 });
      }
      return cursor;
    }
    matrix[depth][startCol] = { value: column.title, type: "string" };
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
        (_, index) => cells[index] ?? { value: "", type: "blank" }
      )
    })),
    merges
  };
}
function buildExcelExportModel(context, options, sheetName) {
  const includeHierarchicalHeaders = options?.hierarchicalHeaders !== false && context.headerDepth > 0;
  const headerSection = includeHierarchicalHeaders ? buildHeaderRows(context.columnTree, context.headerDepth) : {
    rows: context.leafColumns.length > 0 ? [
      {
        kind: "header",
        cells: context.leafColumns.map((column) => ({
          value: column.title,
          type: "string"
        }))
      }
    ] : [],
    merges: []
  };
  const styleRegistry = createStyleRegistry();
  const topSummarySection = buildSummaryRows(context.summaryTopRows, context.leafColumns.length);
  const bodyRows = buildBodyRows(context, options, styleRegistry);
  const bottomSummarySection = buildSummaryRows(
    context.summaryBottomRows,
    context.leafColumns.length
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
    ...bottomSummaryMerges
  ];
  validateMerges(merges);
  const freeze = resolveFreeze(context, options, headerSection.rows.length);
  return {
    sheetName,
    columns: context.leafColumns.map((column) => ({
      key: column.key,
      width: resolveColumnWidth(column, options?.columnWidths)
    })),
    rows: [
      ...headerSection.rows,
      ...topSummarySection.rows,
      ...bodyRows,
      ...bottomSummarySection.rows
    ],
    merges,
    freeze,
    styles: styleRegistry.styles,
    numFmts: styleRegistry.numFmts
  };
}
function createXlsxBlobFromModel(model) {
  const safeSheetName = sheetNameXml(model.sheetName);
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Canvas Table</Application></Properties>`
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Canvas Table</dc:creator><cp:lastModifiedBy>Canvas Table</cp:lastModifiedBy></cp:coreProperties>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
    },
    {
      name: "xl/styles.xml",
      content: stylesXml(model)
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: worksheetXmlFromModel(model)
    }
  ];
  const zip = createZip(files);
  const buffer = new ArrayBuffer(zip.byteLength);
  new Uint8Array(buffer).set(zip);
  return new Blob([buffer], { type: XLSX_MIME_TYPE });
}
function createXlsxBlob(data, sheetName = "Sheet1") {
  const safeSheetName = sheetNameXml(sheetName);
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Canvas Table</Application></Properties>`
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Canvas Table</dc:creator><cp:lastModifiedBy>Canvas Table</cp:lastModifiedBy></cp:coreProperties>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: worksheetXml(data)
    }
  ];
  const zip = createZip(files);
  const buffer = new ArrayBuffer(zip.byteLength);
  new Uint8Array(buffer).set(zip);
  return new Blob([buffer], { type: XLSX_MIME_TYPE });
}
function getColumnField(column) {
  return column.field ?? column.key;
}
function formatNumber(value, options) {
  const { thousandSeparator = true, decimalPlaces, prefix = "", suffix = "" } = options ?? {};
  if (!isFinite(value)) {
    return String(value);
  }
  let formatted = decimalPlaces !== void 0 ? value.toFixed(decimalPlaces) : String(value);
  if (thousandSeparator) {
    const parts = formatted.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    formatted = parts.join(".");
  }
  return prefix + formatted + suffix;
}
function formatPercent(value, decimalPlaces = 2) {
  return formatNumber(value * 100, { decimalPlaces, suffix: "%" });
}
function formatDate(value, format = "YYYY-MM-DD") {
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return String(value);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
}
function formatBoolean(value, trueText = "Yes", falseText = "No") {
  return value ? trueText : falseText;
}
function truncateText(text, maxLength, ellipsis = "...") {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function debounce(fn, delay) {
  let timeoutId = null;
  return function(...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}
function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}
function isEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null || b === null) {
    return a === b;
  }
  if (typeof a !== "object") {
    return a === b;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  const objA = a;
  const objB = b;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) {
      return false;
    }
    if (!isEqual(objA[key], objB[key])) {
      return false;
    }
  }
  return true;
}
function getNestedValue(obj, path) {
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result === null || result === void 0) {
      return void 0;
    }
    result = result[key];
  }
  return result;
}
function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === void 0 || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}
function binarySearch(array, value, getValue) {
  let left = 0;
  let right = array.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = getValue(array[mid]);
    if (midValue === value) {
      return mid;
    }
    if (midValue < value) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return left;
}
function measureText(ctx, text, fontSize, fontFamily) {
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width,
    height: fontSize
  };
}
function calculateMaxTextRows(cellHeight, lineHeight, padding = 8) {
  return Math.max(1, Math.floor((cellHeight - padding * 2) / lineHeight));
}
function layoutWrappedText(ctx, text, maxWidth, maxRows) {
  const lines = [];
  let currentLine = "";
  for (const char of text) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = char;
      if (lines.length >= maxRows) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < maxRows) {
    lines.push(currentLine);
  }
  const visibleText = lines.join("");
  const isTruncated = text.length > visibleText.length;
  if (isTruncated && lines.length === maxRows) {
    const ellipsis = "...";
    let truncated = lines[lines.length - 1] ?? "";
    while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    lines[lines.length - 1] = truncated + ellipsis;
  }
  return { lines, isTruncated };
}
function layoutTags(ctx, config, width, height, fontSize) {
  const padding = 8;
  const tagPadding = 4;
  const gap = 4;
  const lineGap = 2;
  const ellipsis = "...";
  const tagHeight = fontSize + tagPadding * 2;
  const availableWidth = width - padding * 2;
  const autoMaxRows = Math.max(1, Math.floor((height - padding * 2) / (tagHeight + lineGap)));
  const maxLineCount = Math.min(config.maxRows ?? autoMaxRows, autoMaxRows);
  const tags = config.tags ?? [];
  const textWidthCache = /* @__PURE__ */ new Map();
  const measureTextCached = (text) => {
    let measuredWidth = textWidthCache.get(text);
    if (measuredWidth === void 0) {
      measuredWidth = ctx.measureText(text).width;
      textWidthCache.set(text, measuredWidth);
    }
    return measuredWidth;
  };
  const moreTagWidth = (count) => {
    const moreText = `+${count}`;
    return measureTextCached(moreText) + tagPadding * 2;
  };
  const calculateTagWidth = (tag) => {
    return measureTextCached(tag.text) + tagPadding * 2;
  };
  const ellipsisWidth = measureTextCached(ellipsis);
  const lines = [];
  let currentLine = [];
  let currentLineWidth = 0;
  let processedTags = 0;
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const tagWidth = calculateTagWidth(tag);
    const isLastLine = lines.length >= maxLineCount - 1;
    const remainingTags = tags.length - i;
    if (isLastLine) {
      const moreWidth = remainingTags > 1 ? moreTagWidth(remainingTags - 1) + gap : 0;
      const remainingSpace = availableWidth - currentLineWidth - moreWidth;
      if (tagWidth <= remainingSpace) {
        currentLine.push({ tag, displayText: tag.text, width: tagWidth });
        currentLineWidth += tagWidth + gap;
        processedTags++;
      } else {
        const truncatedTagSpace = availableWidth - currentLineWidth - moreWidth;
        if (truncatedTagSpace >= tagPadding * 2 + ellipsisWidth + 10) {
          const maxTextWidth = truncatedTagSpace - tagPadding * 2 - ellipsisWidth;
          let truncatedText = "";
          let left = 0;
          let right = tag.text.length;
          while (left < right) {
            const mid = Math.floor((left + right + 1) / 2);
            const testText = tag.text.slice(0, mid);
            if (measureTextCached(testText) <= maxTextWidth) {
              left = mid;
              truncatedText = testText;
            } else {
              right = mid - 1;
            }
          }
          if (truncatedText.length > 0) {
            const displayText = truncatedText + ellipsis;
            const truncatedWidth = measureTextCached(displayText) + tagPadding * 2;
            currentLine.push({ tag, displayText, width: truncatedWidth });
            processedTags++;
          }
        }
        break;
      }
    } else if (tagWidth <= availableWidth - currentLineWidth) {
      currentLine.push({ tag, displayText: tag.text, width: tagWidth });
      currentLineWidth += tagWidth + gap;
      processedTags++;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [{ tag, displayText: tag.text, width: tagWidth }];
      currentLineWidth = tagWidth + gap;
      processedTags++;
      if (lines.length >= maxLineCount) {
        break;
      }
    }
  }
  if (currentLine.length > 0 && lines.length < maxLineCount) {
    lines.push(currentLine);
  }
  return {
    lines,
    processedTags,
    isTruncated: processedTags < tags.length
  };
}
function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}
function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  const dpr = getDevicePixelRatio();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}
function requestAnimationFrameThrottle(fn) {
  let rafId = null;
  let lastArgs = null;
  return function(...args) {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs !== null) {
          fn.apply(this, lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}
function isPromise(value) {
  return value !== null && typeof value === "object" && typeof value.then === "function";
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function arrayToCsv(data, delimiter = ",") {
  return data.map((row) => {
    return row.map((cell) => {
      const str = String(cell ?? "");
      if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(delimiter);
  }).join("\n");
}
function resolveDisabled(disabled, row, column) {
  if (disabled === void 0) {
    return false;
  }
  if (typeof disabled === "function") {
    return disabled(row, column);
  }
  return disabled;
}
function getRenderResult(column, row, rowIndex) {
  const field = getColumnField(column);
  const value = row.data[field];
  let renderResult = {
    text: String(value ?? ""),
    type: column.type ?? "text"
  };
  if (column.render) {
    try {
      const customResult = column.render(value, row, column, rowIndex);
      if (customResult) {
        renderResult = { ...renderResult, ...customResult };
      }
    } catch (error) {
      console.error(`Error in render function at row ${rowIndex}, column ${column.key}:`, error);
      renderResult = {
        text: "[Error]",
        type: "text"
      };
    }
  }
  if (renderResult.type === CellTypes.CHECKBOX && !renderResult.checkbox) {
    renderResult.checkbox = {
      checked: Boolean(value)
    };
  }
  if (renderResult.type === CellTypes.SWITCH && !renderResult.switch) {
    renderResult.switch = {
      checked: Boolean(value)
    };
  }
  return renderResult;
}
function getCellDisplayText(column, row, rowIndex) {
  const field = getColumnField(column);
  const value = row.data[field];
  const renderResult = getRenderResult(column, row, rowIndex);
  if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
    return renderResult.switch.checked ? "是" : "否";
  }
  if (renderResult.type === CellTypes.CHECKBOX && renderResult.checkbox) {
    if (renderResult.checkbox.indeterminate) {
      return "部分选中";
    }
    return renderResult.checkbox.checked ? "是" : "否";
  }
  if (renderResult.type === CellTypes.RADIO && renderResult.radio) {
    const selectedOption = renderResult.radio.options?.find(
      (opt) => opt.value === renderResult.radio?.value
    );
    return selectedOption?.label || String(renderResult.radio.value ?? "");
  }
  if (renderResult.type === CellTypes.BUTTON && renderResult.button) {
    const buttonConfig = renderResult.button;
    if (Array.isArray(buttonConfig)) {
      return buttonConfig.map((btn) => btn.text ?? "").join(", ");
    }
    return buttonConfig.text || "";
  }
  if (renderResult.tags) {
    return renderResult.tags.tags.map((tag) => tag.text).join(", ");
  }
  if (renderResult.type === CellTypes.SELECT && renderResult.select) {
    const selectValue = renderResult.select.value;
    if (Array.isArray(selectValue)) {
      const labels = selectValue.map(
        (val) => renderResult.select?.options?.find((opt) => opt.value === val)?.label || String(val)
      ).filter(Boolean);
      return labels.join(", ");
    }
    const selectedOption = renderResult.select.options?.find((opt) => opt.value === selectValue);
    return selectedOption?.label || String(selectValue ?? "");
  }
  if (renderResult.type === CellTypes.DATE && renderResult.date) {
    if (renderResult.date.value) {
      const dateValue = renderResult.date.value;
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      return String(dateValue);
    }
    return "";
  }
  if (renderResult.type === CellTypes.INPUT && renderResult.input) {
    return String(renderResult.input.value ?? "");
  }
  if (column.formatter) {
    return column.formatter(value, row, column);
  }
  if (renderResult.text !== void 0) {
    return String(renderResult.text);
  }
  switch (column.type) {
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value ?? "");
    case "boolean":
      return value ? "是" : "否";
    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return String(value ?? "");
    default:
      return String(value ?? "");
  }
}
class LRUCache {
  cache;
  maxSize;
  constructor(maxSize = 100) {
    this.cache = /* @__PURE__ */ new Map();
    this.maxSize = maxSize;
  }
  /**
   * 获取缓存值，同时更新访问顺序
   */
  get(key) {
    if (!this.cache.has(key)) {
      return void 0;
    }
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  /**
   * 设置缓存值
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== void 0) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }
  /**
   * 检查是否存在
   */
  has(key) {
    return this.cache.has(key);
  }
  /**
   * 删除缓存
   */
  delete(key) {
    return this.cache.delete(key);
  }
  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
  }
  /**
   * 获取缓存大小
   */
  get size() {
    return this.cache.size;
  }
  /**
   * 获取所有键
   */
  keys() {
    return this.cache.keys();
  }
}
const COLUMN_TYPE_FILTER_MODE_MAP = {
  text: "search",
  link: "search",
  number: "range",
  progress: "range",
  select: "select",
  tag: "select",
  radio: "select",
  color: "select",
  date: "dateRange",
  checkbox: "boolean",
  switch: "boolean"
};
const UNSUPPORTED_FILTER_TYPES = ["button", "image"];
function getFilterModeByColumnType(column) {
  if (column.filter?.mode) {
    return column.filter.mode;
  }
  if (column.filter?.disabled) {
    return null;
  }
  const columnType = column.type ?? "text";
  if (UNSUPPORTED_FILTER_TYPES.includes(columnType)) {
    return null;
  }
  return COLUMN_TYPE_FILTER_MODE_MAP[columnType] ?? "search";
}
const FILTER_SAMPLE_ROWS = 100;
const FILTER_SEARCH_LIMIT = 100;
function getColumnFilterOptions(column, rows, startIndex = 0) {
  if (column.filter?.options && column.filter.options.length > 0) {
    return column.filter.options;
  }
  if (!rows || rows.length === 0) {
    return [];
  }
  const field = getColumnField(column);
  const sampledRows = rows.slice(startIndex, startIndex + FILTER_SAMPLE_ROWS);
  const optionsMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < sampledRows.length; i++) {
    const row = sampledRows[i];
    const value = row.data[field];
    const renderResult = getRenderResult(column, row, startIndex + i);
    const extractedOptions = extractOptionsFromRenderResult(renderResult, value);
    for (const opt of extractedOptions) {
      const key = String(opt.value);
      if (!optionsMap.has(key)) {
        optionsMap.set(key, opt);
      }
    }
  }
  return Array.from(optionsMap.values());
}
function extractOptionsFromRenderResult(renderResult, rawValue) {
  const options = [];
  if (renderResult.select?.options) {
    options.push(...renderResult.select.options);
  }
  if (renderResult.tags?.options) {
    options.push(
      ...renderResult.tags.options.map((tag) => ({
        label: tag.text,
        value: tag.value ?? tag.text
      }))
    );
  }
  if (renderResult.radio?.options) {
    options.push(...renderResult.radio.options);
  }
  if (renderResult.color?.presetColors) {
    options.push(
      ...renderResult.color.presetColors.map((color) => ({
        label: color,
        value: color
      }))
    );
  }
  if (options.length === 0 && rawValue !== void 0 && rawValue !== null) {
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        options.push({
          label: String(item),
          value: item
        });
      }
    } else {
      options.push({
        label: String(rawValue),
        value: rawValue
      });
    }
  }
  return options;
}
function searchFilterOptions(column, rows, searchText, maxResults = FILTER_SEARCH_LIMIT) {
  if (!searchText || searchText.trim() === "") {
    return [];
  }
  const field = getColumnField(column);
  const keyword = searchText.toLowerCase();
  const optionsMap = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (optionsMap.size >= maxResults) {
      break;
    }
    const value = row.data[field];
    const valueStr = String(value ?? "").toLowerCase();
    if (valueStr.includes(keyword)) {
      const key = String(value);
      if (!optionsMap.has(key)) {
        optionsMap.set(key, {
          label: String(value ?? ""),
          value
        });
      }
    }
  }
  return Array.from(optionsMap.values());
}
class RowIdManager {
  map = /* @__PURE__ */ new WeakMap();
  counter = 0;
  /**
   * 获取行 ID（懒创建）
   */
  getId(row) {
    let id = this.map.get(row);
    if (!id) {
      id = `r${this.counter++}`;
      this.map.set(row, id);
    }
    return id;
  }
  /**
   * 重置（loadData 时调用）
   */
  reset() {
    this.map = /* @__PURE__ */ new WeakMap();
    this.counter = 0;
  }
}
class ColumnIdManager {
  map = /* @__PURE__ */ new WeakMap();
  counter = 0;
  /**
   * 获取列 ID（懒创建）
   */
  getId(column) {
    let id = this.map.get(column);
    if (!id) {
      id = `c${this.counter++}`;
      this.map.set(column, id);
    }
    return id;
  }
  /**
   * 重置（setColumns 时调用）
   */
  reset() {
    this.map = /* @__PURE__ */ new WeakMap();
    this.counter = 0;
  }
}
class RowVersionManager {
  map = /* @__PURE__ */ new WeakMap();
  /**
   * 获取行版本号
   */
  getVersion(row) {
    return this.map.get(row) ?? 0;
  }
  /**
   * 递增行版本号
   */
  incrementVersion(row) {
    const current = this.map.get(row) ?? 0;
    this.map.set(row, current + 1);
  }
  /**
   * 批量递增版本号
   */
  batchIncrement(rows) {
    for (const row of rows) {
      this.incrementVersion(row);
    }
  }
}
class RenderCache {
  /** 单元格缓存：key = rowId-columnId */
  cellCache = /* @__PURE__ */ new Map();
  /** 列值缓存：key = columnId-value */
  valueCache = /* @__PURE__ */ new Map();
  /** 行 ID 管理器 */
  rowIdManager;
  /** 列 ID 管理器 */
  columnIdManager;
  /** 行版本管理器 */
  rowVersionManager;
  /** 单元格缓存最大数量 */
  maxCellCacheSize;
  /** 列值缓存最大数量 */
  maxValueCacheSize;
  constructor(rowIdManager, columnIdManager, rowVersionManager, maxCellCacheSize = 3e3, maxValueCacheSize = 5e3) {
    this.rowIdManager = rowIdManager;
    this.columnIdManager = columnIdManager;
    this.rowVersionManager = rowVersionManager;
    this.maxCellCacheSize = maxCellCacheSize;
    this.maxValueCacheSize = maxValueCacheSize;
  }
  // ==================== Key 生成 ====================
  /**
   * 生成单元格缓存 key
   */
  getCellCacheKey(row, column) {
    const rowId = this.rowIdManager.getId(row);
    const columnId = this.columnIdManager.getId(column);
    return `${rowId}-${columnId}`;
  }
  /**
   * 生成列值缓存 key
   */
  getValueCacheKey(column, value) {
    const columnId = this.columnIdManager.getId(column);
    const valueStr = this.stringifyValue(value);
    return `${columnId}-${valueStr}`;
  }
  /**
   * 将值转换为字符串用于缓存 key
   */
  stringifyValue(value) {
    if (value === null) return "__null__";
    if (value === void 0) return "__undefined__";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }
  // ==================== 缓存操作 ====================
  /**
   * 获取缓存
   * @param row 行对象
   * @param column 列对象
   * @param value 单元格值
   * @param cacheMode 缓存模式
   * @returns 缓存的 RenderResult 或 null
   */
  get(row, column, value, cacheMode) {
    if (cacheMode === "value") {
      const key2 = this.getValueCacheKey(column, value);
      return this.valueCache.get(key2) ?? null;
    }
    const key = this.getCellCacheKey(row, column);
    const cached = this.cellCache.get(key);
    if (!cached) return null;
    const rowVersion = this.rowVersionManager.getVersion(row);
    if (cached.value !== value || cached.rowVersion !== rowVersion) {
      this.cellCache.delete(key);
      return null;
    }
    return cached.renderResult;
  }
  /**
   * 设置缓存
   */
  set(row, column, value, renderResult, cacheMode) {
    if (cacheMode === "value") {
      const key = this.getValueCacheKey(column, value);
      this.ensureValueCapacity();
      this.valueCache.set(key, renderResult);
    } else {
      const key = this.getCellCacheKey(row, column);
      this.ensureCellCapacity();
      this.cellCache.set(key, {
        value,
        renderResult,
        rowVersion: this.rowVersionManager.getVersion(row)
      });
    }
  }
  /**
   * 确保值缓存不超过最大数量
   */
  ensureValueCapacity() {
    if (this.valueCache.size >= this.maxValueCacheSize) {
      const firstKey = this.valueCache.keys().next().value;
      if (firstKey !== void 0) {
        this.valueCache.delete(firstKey);
      }
    }
  }
  /**
   * 确保单元格缓存不超过最大数量
   */
  ensureCellCapacity() {
    if (this.cellCache.size >= this.maxCellCacheSize) {
      const firstKey = this.cellCache.keys().next().value;
      if (firstKey !== void 0) {
        this.cellCache.delete(firstKey);
      }
    }
  }
  // ==================== 缓存清理 ====================
  /**
   * 清理不可见行的缓存
   * @param visibleRowIds 可见行的 ID 集合
   */
  cleanupInvisibleRows(visibleRowIds) {
    const keysToDelete = [];
    for (const key of this.cellCache.keys()) {
      const rowId = key.split("-")[0];
      if (rowId && !visibleRowIds.has(rowId)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cellCache.delete(key);
    }
  }
  /**
   * 清理不可见列的缓存
   * @param visibleColumnIds 可见列的 ID 集合
   */
  cleanupInvisibleColumns(visibleColumnIds) {
    const keysToDelete = [];
    for (const key of this.cellCache.keys()) {
      const parts = key.split("-");
      const columnId = parts.slice(1).join("-");
      if (columnId && !visibleColumnIds.has(columnId)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cellCache.delete(key);
    }
  }
  /**
   * 清空所有缓存
   */
  clear() {
    this.cellCache.clear();
    this.valueCache.clear();
  }
  // ==================== 管理器重置 ====================
  /**
   * 重置行 ID 管理器并清空缓存（loadData 时调用）
   */
  resetRowIds() {
    this.rowIdManager.reset();
    this.cellCache.clear();
    this.valueCache.clear();
  }
  /**
   * 重置列 ID 管理器并清空缓存（setColumns 时调用）
   */
  resetColumnIds() {
    this.columnIdManager.reset();
    this.cellCache.clear();
    this.valueCache.clear();
  }
  // ==================== 统计信息 ====================
  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      cellCacheSize: this.cellCache.size,
      valueCacheSize: this.valueCache.size,
      maxCellCacheSize: this.maxCellCacheSize
    };
  }
}
const DEFAULT_MAX_ACTIONS = 200;
class DataManager {
  state = {
    rows: [],
    filteredRows: [],
    sortedRows: [],
    columns: [],
    filters: [],
    sort: [],
    loading: false,
    error: null
  };
  /** 历史记录栈 */
  historyStack = [];
  /** 重做记录栈 */
  redoStack = [];
  /** 历史记录配置 */
  historyOptions;
  /** 行版本管理器（用于渲染缓存） */
  rowVersionManager = new RowVersionManager();
  constructor(_rowKey, historyOptions) {
    this.historyOptions = {
      maxActions: historyOptions?.maxActions ?? DEFAULT_MAX_ACTIONS
    };
  }
  /**
   * 获取行版本管理器
   */
  getRowVersionManager() {
    return this.rowVersionManager;
  }
  async loadRows(rows) {
    this.state.loading = true;
    this.state.error = null;
    this.state.filters = [];
    this.state.sort = [];
    try {
      let tableRows;
      if (typeof rows === "function") {
        tableRows = await rows();
      } else if (isPromise(rows)) {
        tableRows = await rows;
      } else {
        tableRows = rows;
      }
      this.state.rows = this.processRows(tableRows);
      this.historyStack = [];
      this.redoStack = [];
      this.applyFiltersAndSort();
    } catch (error) {
      this.state.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    } finally {
      this.state.loading = false;
    }
  }
  processRows(rows, level = 0) {
    return rows.map((row) => {
      const processedRow = {
        ...row,
        level,
        expanded: row.expanded ?? false,
        selected: row.selected ?? false
      };
      if (row.children) {
        processedRow.children = this.processRows(row.children, level + 1);
      }
      return processedRow;
    });
  }
  setColumns(columns) {
    this.state.columns = columns;
  }
  setRows(rows) {
    this.state.rows = this.processRows(rows);
    this.applyFiltersAndSort();
  }
  getColumns() {
    return this.state.columns;
  }
  /**
   * 交换两个列的位置（基于 key）
   * 前提：调用方已确保两个列是同级的
   * @param fromKey 源列的 key
   * @param toKey 目标列的 key
   * @param fromUid 源列的唯一标识符（可选，用于精确匹配相同 key 的不同列）
   * @param toUid 目标列的唯一标识符（可选）
   */
  swapColumnsByKey(fromKey, toKey) {
    if (fromKey === toKey) return;
    const fromColumn = this.findColumnByKey(this.state.columns, fromKey);
    const toColumn = this.findColumnByKey(this.state.columns, toKey);
    if (!fromColumn || !toColumn) return;
    if (fromColumn.parentKey && toColumn.parentKey) {
      if (fromColumn.parentKey === toColumn.parentKey) {
        const parentColumn = this.findColumnByKey(this.state.columns, fromColumn.parentKey);
        if (parentColumn && parentColumn.children) {
          const fromIndex = parentColumn.children.findIndex((c) => c.key === fromKey);
          const toIndex = parentColumn.children.findIndex((c) => c.key === toKey);
          if (fromIndex >= 0 && toIndex >= 0) {
            const children = [...parentColumn.children];
            [children[fromIndex], children[toIndex]] = [children[toIndex], children[fromIndex]];
            parentColumn.children = children;
          }
        }
      }
    } else if (!fromColumn.parentKey && !toColumn.parentKey) {
      const fromIndex = this.state.columns.findIndex((c) => c.key === fromKey);
      const toIndex = this.state.columns.findIndex((c) => c.key === toKey);
      if (fromIndex >= 0 && toIndex >= 0) {
        const columns = [...this.state.columns];
        [columns[fromIndex], columns[toIndex]] = [columns[toIndex], columns[fromIndex]];
        this.state.columns = columns;
      }
    }
  }
  reorderColumns(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const leafInfo = this.getLeafColumnInfo(fromIndex);
    if (!leafInfo) return;
    const totalLeaves = this.countLeafColumns(this.state.columns);
    let actualToIndex = toIndex;
    if (fromIndex < toIndex) {
      actualToIndex = toIndex - 1;
    }
    if (actualToIndex < 0) actualToIndex = 0;
    if (actualToIndex > totalLeaves - 1) actualToIndex = totalLeaves - 1;
    const targetLeafInfo = this.getLeafColumnInfo(actualToIndex);
    if (!targetLeafInfo) return;
    if (leafInfo.parent && targetLeafInfo.parent) {
      if (leafInfo.parent === targetLeafInfo.parent) {
        const parentColumn = this.findColumnByKey(this.state.columns, leafInfo.parent);
        if (parentColumn && parentColumn.children) {
          const children = [...parentColumn.children];
          const [movedChild] = children.splice(leafInfo.indexInParent, 1);
          children.splice(targetLeafInfo.indexInParent, 0, movedChild);
          parentColumn.children = children;
        }
      } else {
        return;
      }
    } else if (!leafInfo.parent && !targetLeafInfo.parent) {
      const columns = [...this.state.columns];
      const [movedColumn] = columns.splice(leafInfo.indexInParent, 1);
      columns.splice(targetLeafInfo.indexInParent, 0, movedColumn);
      this.state.columns = columns;
    } else {
      return;
    }
  }
  countLeafColumns(columns) {
    let count = 0;
    for (const column of columns) {
      if (column.children && column.children.length > 0) {
        count += this.countLeafColumns(column.children);
      } else {
        count++;
      }
    }
    return count;
  }
  getLeafColumnInfo(leafIndex) {
    let currentLeafIndex = 0;
    const findLeaf = (columns, parentKey) => {
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        if (column.children && column.children.length > 0) {
          const result = findLeaf(column.children, column.key);
          if (result) return result;
        } else {
          if (currentLeafIndex === leafIndex) {
            return { parent: parentKey, indexInParent: i, column };
          }
          currentLeafIndex++;
        }
      }
      return null;
    };
    return findLeaf(this.state.columns, null);
  }
  findColumnByKey(columns, key) {
    for (const column of columns) {
      if (column.key === key) return column;
      if (column.children) {
        const found = this.findColumnByKey(column.children, key);
        if (found) return found;
      }
    }
    return null;
  }
  getRows() {
    return this.state.sortedRows;
  }
  getAllRows() {
    return this.state.rows;
  }
  /** @deprecated 使用 getRows() 或 getAllRows() 代替 */
  getOriginalRows() {
    return this.state.rows;
  }
  getRowCount() {
    return this.state.sortedRows.length;
  }
  getTotalRowCount() {
    return this.countAllRows(this.state.rows);
  }
  countAllRows(rows) {
    let count = 0;
    for (const row of rows) {
      count++;
      if (row.children && row.expanded) {
        count += this.countAllRows(row.children);
      }
    }
    return count;
  }
  sort(configs) {
    this.state.sort = configs;
    this.applyFiltersAndSort();
  }
  getSort() {
    return [...this.state.sort];
  }
  clearSort() {
    this.state.sort = [];
    this.applyFiltersAndSort();
  }
  filter(filters) {
    this.state.filters = [...filters];
    this.applyFiltersAndSort();
  }
  getFilters() {
    return [...this.state.filters];
  }
  clearFilters() {
    this.state.filters = [];
    this.applyFiltersAndSort();
  }
  applyFiltersAndSort() {
    let rows = [...this.state.rows];
    if (this.state.filters.length > 0) {
      rows = this.applyFilters(rows);
    }
    this.state.filteredRows = rows;
    if (this.state.sort.length > 0) {
      rows = this.applySort(rows);
    }
    rows = this.flattenRowsForDisplay(rows);
    this.state.sortedRows = rows;
  }
  flattenRowsForDisplay(rows, parentExpanded = true) {
    const result = [];
    for (const row of rows) {
      if (!parentExpanded) continue;
      result.push(row);
      if (row.children && row.children.length > 0 && row.expanded) {
        const childRows = this.flattenRowsForDisplay(row.children, true);
        result.push(...childRows);
      }
    }
    return result;
  }
  applyFilters(rows) {
    const findColumn = (columns, key) => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children, key);
          if (found) return found;
        }
      }
      return void 0;
    };
    return rows.filter((row) => {
      const matchesAllFilters = this.state.filters.every((filter) => {
        const column = findColumn(this.state.columns, filter.column);
        if (!column) return true;
        const value = row.data[getColumnField(column)];
        return this.matchesFilter(value, filter, row, column);
      });
      if (matchesAllFilters && row.children) {
        const filteredChildren = this.applyFilters(row.children);
        if (filteredChildren.length > 0) {
          return true;
        }
      }
      return matchesAllFilters;
    });
  }
  matchesFilter(value, filter, row, column) {
    if (column.filter?.custom) {
      return column.filter.custom(value, filter.value, row);
    }
    const filterValue = filter.value;
    const strValue = String(value ?? "").toLowerCase();
    const strFilterValue = String(filterValue ?? "").toLowerCase();
    if (filter.operator === "in") {
      if (Array.isArray(filterValue)) {
        if (Array.isArray(value)) {
          return value.some((item) => {
            if (typeof item === "object" && item !== null && "text" in item) {
              return filterValue.some((v) => String(v) === String(item.text));
            }
            return filterValue.some((v) => String(v) === String(item));
          });
        }
        return filterValue.some((v) => String(v) === String(value));
      }
      return false;
    }
    if (filter.operator === "between" && typeof filterValue === "object" && filterValue !== null) {
      const range = filterValue;
      const numValue = Number(value);
      if (isNaN(numValue)) return false;
      const { min, max } = range;
      if (min !== void 0 && max !== void 0) {
        return numValue >= min && numValue <= max;
      } else if (min !== void 0) {
        return numValue >= min;
      } else if (max !== void 0) {
        return numValue <= max;
      }
      return true;
    }
    if (filter.operator === "dateRange" && typeof filterValue === "object" && filterValue !== null) {
      const dateRange = filterValue;
      const dateValue = value instanceof Date ? value : new Date(String(value));
      if (isNaN(dateValue.getTime())) return false;
      const { start, end } = dateRange;
      if (start && end) {
        return dateValue >= start && dateValue <= end;
      } else if (start) {
        return dateValue >= start;
      } else if (end) {
        return dateValue <= end;
      }
      return true;
    }
    switch (filter.operator) {
      case "equals":
      case "=":
        return strValue === strFilterValue;
      case "notEquals":
      case "!=":
        return strValue !== strFilterValue;
      case "contains":
        return strValue.includes(strFilterValue);
      case "notContains":
        return !strValue.includes(strFilterValue);
      case "startsWith":
        return strValue.startsWith(strFilterValue);
      case "endsWith":
        return strValue.endsWith(strFilterValue);
      case "gt":
      case ">":
        return Number(value) > Number(filterValue);
      case "gte":
      case ">=":
        return Number(value) >= Number(filterValue);
      case "lt":
      case "<":
        return Number(value) < Number(filterValue);
      case "lte":
      case "<=":
        return Number(value) <= Number(filterValue);
      case "notIn":
        if (Array.isArray(filterValue)) {
          return !filterValue.some((v) => String(v) === String(value));
        }
        return false;
      case "isEmpty":
        return value === null || value === void 0 || value === "";
      case "isNotEmpty":
        return value !== null && value !== void 0 && value !== "";
      case "regex":
        try {
          const regex = new RegExp(String(filterValue), "i");
          return regex.test(strValue);
        } catch {
          return false;
        }
      default:
        return true;
    }
  }
  applySort(rows) {
    const findColumn = (columns, key) => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children, key);
          if (found) return found;
        }
      }
      return void 0;
    };
    const sortedRows = [...rows].sort((a, b) => {
      for (const config of this.state.sort) {
        const column = findColumn(this.state.columns, config.column);
        if (!column) continue;
        const field = getColumnField(column);
        const aValue = a.data[field];
        const bValue = b.data[field];
        let comparison = this.compareValues(aValue, bValue, column.type);
        if (comparison !== 0) {
          return config.direction === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });
    for (const row of sortedRows) {
      if (row.children) {
        this.applySort(row.children);
      }
    }
    return sortedRows;
  }
  compareValues(a, b, type) {
    if (a === b) return 0;
    if (a === null || a === void 0) return -1;
    if (b === null || b === void 0) return 1;
    switch (type) {
      case "number":
        return Number(a) - Number(b);
      case "date":
        return new Date(a).getTime() - new Date(b).getTime();
      case "boolean":
        return Number(a) - Number(b);
      default: {
        const aNum = this.extractNumber(a);
        const bNum = this.extractNumber(b);
        if (aNum !== null && bNum !== null) {
          return aNum - bNum;
        }
        return String(a).localeCompare(String(b));
      }
    }
  }
  /**
   * Extract numeric value from a value
   * Handles: numbers, strings with numbers (e.g., "8%", "79%", "$100", "1,234.56")
   * Returns null if not a valid number
   */
  extractNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return null;
    const cleaned = value.replace(/^[^\d.-]+/, "").replace(/[^\d.-]+$/, "").replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  updateCell(rowIndex, columnKey, value, field) {
    const row = this.state.sortedRows[rowIndex];
    if (!row) {
      throw new Error(`Row at index ${rowIndex} not found`);
    }
    const findColumn = (columns, key) => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children, key);
          if (found) return found;
        }
      }
      return void 0;
    };
    const columnDef = findColumn(this.state.columns, columnKey);
    const dataField = field ?? columnDef?.field ?? columnKey;
    let convertedValue = value;
    if (columnDef) {
      switch (columnDef.type) {
        case "number":
          convertedValue = value !== "" && value !== null && value !== void 0 ? Number(value) : null;
          break;
        case "boolean":
          convertedValue = Boolean(value);
          break;
        case "date":
          if (typeof value === "string" && value) {
            convertedValue = value;
          }
          break;
        default:
          convertedValue = value;
      }
    }
    const oldValue = row.data[dataField];
    row.data[dataField] = convertedValue;
    this.rowVersionManager.incrementVersion(row);
    this.recordAction({
      type: "update",
      row,
      column: dataField,
      oldValue,
      newValue: convertedValue
    });
    const stateRow = this.findStateRow(row);
    if (stateRow) {
      stateRow.data[dataField] = convertedValue;
    }
    this.applyFiltersAndSort();
    return {
      type: "update",
      rowIndex,
      column: dataField,
      oldValue,
      newValue: convertedValue
    };
  }
  updateRow(rowIndex, data) {
    const row = this.state.sortedRows[rowIndex];
    if (!row) {
      throw new Error(`Row at index ${rowIndex} not found`);
    }
    const changes = [];
    for (const [key, value] of Object.entries(data)) {
      const oldValue = row.data[key];
      if (oldValue !== value) {
        row.data[key] = value;
        changes.push({
          type: "update",
          rowIndex,
          column: key,
          oldValue,
          newValue: value
        });
      }
    }
    for (const change of changes) {
      this.recordAction({
        type: "update",
        row,
        column: change.column,
        oldValue: change.oldValue,
        newValue: change.newValue
      });
    }
    if (changes.length > 0) {
      this.rowVersionManager.incrementVersion(row);
    }
    const stateRow = this.findStateRow(row);
    if (stateRow) {
      Object.assign(stateRow.data, data);
    }
    this.applyFiltersAndSort();
    return changes;
  }
  addRow(data, index) {
    const newRow = {
      data,
      expanded: false,
      selected: false,
      level: 0
    };
    const insertIndex = index !== void 0 && index >= 0 && index <= this.state.rows.length ? index : this.state.rows.length;
    if (index !== void 0 && index >= 0 && index <= this.state.rows.length) {
      this.state.rows.splice(index, 0, newRow);
    } else {
      this.state.rows.push(newRow);
    }
    this.recordAction({
      type: "add",
      row: newRow,
      rowIndex: insertIndex,
      rowData: { ...newRow, data: { ...newRow.data } }
    });
    this.applyFiltersAndSort();
    return {
      type: "add",
      rowIndex: insertIndex,
      row: newRow
    };
  }
  findRootRowIndexByRef(targetRow) {
    return this.state.rows.findIndex((row) => row === targetRow);
  }
  addRowRelativeTo(targetRow, data, placement) {
    if ((targetRow.level ?? 0) > 0) {
      throw new Error("Adding rows relative to child rows is not supported");
    }
    const targetIndex = this.findRootRowIndexByRef(targetRow);
    if (targetIndex < 0) {
      throw new Error("Target row not found");
    }
    const insertIndex = placement === "above" ? targetIndex : targetIndex + 1;
    return this.addRow(data, insertIndex);
  }
  deleteRow(rowIndex) {
    const row = this.state.sortedRows[rowIndex];
    if (!row) {
      throw new Error(`Row at index ${rowIndex} not found`);
    }
    const originalIndex = this.state.rows.indexOf(row);
    if (originalIndex !== -1) {
      this.state.rows.splice(originalIndex, 1);
    }
    this.recordAction({
      type: "delete",
      row,
      rowIndex: originalIndex,
      rowData: { ...row, data: { ...row.data } }
    });
    this.applyFiltersAndSort();
    return {
      type: "delete",
      rowIndex,
      row
    };
  }
  deleteRowByRef(row) {
    if ((row.level ?? 0) > 0) {
      throw new Error("Deleting child rows by reference is not supported");
    }
    const originalIndex = this.findRootRowIndexByRef(row);
    if (originalIndex < 0) {
      throw new Error("Row not found");
    }
    this.state.rows.splice(originalIndex, 1);
    this.recordAction({
      type: "delete",
      row,
      rowIndex: originalIndex,
      rowData: { ...row, data: { ...row.data } }
    });
    this.applyFiltersAndSort();
    return {
      type: "delete",
      rowIndex: originalIndex,
      row
    };
  }
  toggleRowExpand(rowIndex) {
    const row = this.state.sortedRows[rowIndex];
    if (!row || !row.children) return false;
    row.expanded = !row.expanded;
    const stateRow = this.findStateRow(row);
    if (stateRow) {
      stateRow.expanded = row.expanded;
    }
    this.applyFiltersAndSort();
    return row.expanded;
  }
  setRowSelected(rowIndex, selected) {
    const row = this.state.sortedRows[rowIndex];
    if (!row) return;
    row.selected = selected;
    const stateRow = this.findStateRow(row);
    if (stateRow) {
      stateRow.selected = selected;
    }
  }
  findStateRow(row) {
    const findInRows = (rows) => {
      for (const r of rows) {
        if (r === row) return r;
        if (r.children) {
          const found = findInRows(r.children);
          if (found) return found;
        }
      }
      return void 0;
    };
    return findInRows(this.state.rows);
  }
  getSelectedRows() {
    const selectedIndices = [];
    this.state.sortedRows.forEach((row, index) => {
      if (row.selected) {
        selectedIndices.push(index);
      }
    });
    return selectedIndices;
  }
  selectAll(selected) {
    const updateRows = (rows) => {
      rows.forEach((row) => {
        row.selected = selected;
        if (row.children) {
          updateRows(row.children);
        }
      });
    };
    updateRows(this.state.sortedRows);
    updateRows(this.state.rows);
  }
  getVisibleRows(startIndex, endIndex) {
    const result = [];
    const collectVisibleRows = (rows, start, end) => {
      let currentIndex = 0;
      for (const row of rows) {
        if (currentIndex >= start && currentIndex <= end) {
          result.push(row);
        }
        currentIndex++;
        if (row.children && row.expanded) {
          collectVisibleRows(row.children, start - currentIndex, end - currentIndex);
        }
        if (currentIndex > end) break;
      }
    };
    collectVisibleRows(this.state.sortedRows, startIndex, endIndex);
    return result;
  }
  isLoading() {
    return this.state.loading;
  }
  getError() {
    return this.state.error;
  }
  getState() {
    return { ...this.state };
  }
  /**
   * 重置表格状态（撤销所有操作）
   */
  reset() {
    while (this.canUndo()) {
      this.undo();
    }
    this.state.filters = [];
    this.state.sort = [];
    this.applyFiltersAndSort();
  }
  // === 历史记录方法 ===
  /**
   * 记录操作到历史栈
   */
  recordAction(action) {
    const maxActions = this.historyOptions.maxActions ?? DEFAULT_MAX_ACTIONS;
    if (maxActions <= 0) return;
    this.historyStack.push(action);
    this.redoStack = [];
    if (this.historyStack.length > maxActions) {
      this.historyStack.shift();
    }
  }
  /**
   * 撤销上一步操作
   * @returns 是否撤销成功
   */
  undo() {
    if (!this.canUndo()) return false;
    const action = this.historyStack.pop();
    this.undoAction(action);
    this.redoStack.push(action);
    return true;
  }
  /**
   * 执行撤销操作
   */
  undoAction(action) {
    switch (action.type) {
      case "update": {
        action.row.data[action.column] = action.oldValue;
        break;
      }
      case "add": {
        const index = this.state.rows.indexOf(action.row);
        if (index !== -1) {
          this.state.rows.splice(index, 1);
        }
        break;
      }
      case "delete": {
        if (action.rowIndex >= 0 && action.rowIndex <= this.state.rows.length) {
          this.state.rows.splice(action.rowIndex, 0, action.rowData);
        } else {
          this.state.rows.push(action.rowData);
        }
        break;
      }
    }
    this.applyFiltersAndSort();
  }
  /**
   * 重做上一步撤销的操作
   * @returns 是否重做成功
   */
  redo() {
    if (!this.canRedo()) return false;
    const action = this.redoStack.pop();
    this.redoAction(action);
    this.historyStack.push(action);
    return true;
  }
  /**
   * 执行重做操作
   */
  redoAction(action) {
    switch (action.type) {
      case "update": {
        action.row.data[action.column] = action.newValue;
        break;
      }
      case "add": {
        if (action.rowIndex >= 0 && action.rowIndex <= this.state.rows.length) {
          this.state.rows.splice(action.rowIndex, 0, action.rowData);
        } else {
          this.state.rows.push(action.rowData);
        }
        break;
      }
      case "delete": {
        const index = this.state.rows.indexOf(action.rowData);
        if (index !== -1) {
          this.state.rows.splice(index, 1);
        }
        break;
      }
    }
    this.applyFiltersAndSort();
  }
  /**
   * 是否可以撤销
   */
  canUndo() {
    return this.historyStack.length > 0;
  }
  /**
   * 是否可以重做
   */
  canRedo() {
    return this.redoStack.length > 0;
  }
  /**
   * 获取历史记录数量
   */
  getHistoryLength() {
    return this.historyStack.length;
  }
  /**
   * 清空历史记录和重做记录
   */
  clearHistory() {
    this.historyStack = [];
    this.redoStack = [];
  }
  /**
   * 销毁实例，清理所有状态
   */
  destroy() {
    this.state.rows = [];
    this.state.filteredRows = [];
    this.state.sortedRows = [];
    this.state.columns = [];
    this.state.filters = [];
    this.state.sort = [];
    this.historyStack = [];
    this.redoStack = [];
  }
  /**
   * 设置历史记录配置
   */
  setHistoryOptions(options) {
    this.historyOptions = { ...this.historyOptions, ...options };
    const maxActions = this.historyOptions.maxActions ?? DEFAULT_MAX_ACTIONS;
    while (this.historyStack.length > maxActions && maxActions > 0) {
      this.historyStack.shift();
    }
  }
  exportData(options) {
    const { includeHeaders = true } = options;
    const context = this.getExportContext(options);
    const result = [];
    if (includeHeaders) {
      result.push(context.leafColumns.map((col) => col.title));
    }
    for (const row of context.rows) {
      result.push(row.cells.map((cell) => cell.displayValue));
    }
    return result;
  }
  getExportContext(options) {
    const { includeHidden = false, selectedOnly = false, showRowNumbers = false } = options;
    const rows = selectedOnly ? this.state.sortedRows.filter((row) => row.selected) : this.state.sortedRows;
    const columnTree = this.getExportColumnTree(includeHidden);
    const leafColumns = this.getLeafColumnsList(includeHidden);
    const headerDepth = this.getHeaderDepth(columnTree);
    const leftFixedLeafColumnCount = leafColumns.filter((column) => column.fixed === "left").length;
    return {
      columnTree,
      leafColumns,
      rows: rows.map((row, rowIndex) => ({
        row,
        rowIndex,
        cells: leafColumns.map((column) => {
          const rawValue = row.data[getColumnField(column)];
          return {
            column,
            rawValue,
            displayValue: getCellDisplayText(column, row, rowIndex)
          };
        })
      })),
      bodyMerges: rows.flatMap(
        (row, rowIndex) => (row.cellMerges ?? []).map((merge) => ({
          startRow: rowIndex,
          startCol: Math.max(0, merge.columnIndex - (showRowNumbers ? 1 : 0)),
          endRow: rowIndex + merge.rowspan - 1,
          endCol: Math.max(0, merge.columnIndex - (showRowNumbers ? 1 : 0)) + merge.colspan - 1
        }))
      ),
      headerDepth,
      leftFixedLeafColumnCount
    };
  }
  getLeafColumnsList(includeHidden = false) {
    const leafColumns = [];
    const collectLeaves = (columns, ancestorHidden = false) => {
      for (const column of columns) {
        const isHidden = ancestorHidden || column.hidden === true;
        if (column.children && column.children.length > 0) {
          collectLeaves(column.children, isHidden);
        } else if (includeHidden || !isHidden) {
          leafColumns.push(column);
        }
      }
    };
    collectLeaves(this.state.columns);
    return leafColumns;
  }
  getExportColumnTree(includeHidden = false) {
    const cloneColumns = (columns, ancestorHidden = false) => {
      const result = [];
      for (const column of columns) {
        const isHidden = ancestorHidden || column.hidden === true;
        const children = column.children ? cloneColumns(column.children, isHidden) : void 0;
        if (children && children.length > 0) {
          result.push({
            ...column,
            children
          });
          continue;
        }
        if (includeHidden || !isHidden) {
          result.push({
            ...column,
            children: void 0
          });
        }
      }
      return result;
    };
    return cloneColumns(this.state.columns);
  }
  getHeaderDepth(columns) {
    if (columns.length === 0) {
      return 0;
    }
    return Math.max(
      ...columns.map(
        (column) => column.children && column.children.length > 0 ? 1 + this.getHeaderDepth(column.children) : 1
      )
    );
  }
}
const DEFAULT_ROW_BUFFER_SIZE = 5;
const DEFAULT_COLUMN_BUFFER_SIZE = 2;
const DEFAULT_ROW_HEIGHT = 32;
const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;
class LayoutManager {
  layoutInfo;
  visibleRange;
  config;
  theme;
  columnWidths = /* @__PURE__ */ new Map();
  rowHeights = [];
  rowOffsets = [];
  rowBands;
  rowPinManager;
  rowHeightByRow = /* @__PURE__ */ new WeakMap();
  rowIndexByRow = /* @__PURE__ */ new WeakMap();
  bodyRowIndexByRow = /* @__PURE__ */ new WeakMap();
  rowBandOffsetByRow = /* @__PURE__ */ new WeakMap();
  pinnedRowByRow = /* @__PURE__ */ new WeakMap();
  bodyRowHeights = [];
  bodyRowOffsets = [];
  pinnedTopHeight = 0;
  pinnedBottomHeight = 0;
  summaryTopHeight = 0;
  summaryBottomHeight = 0;
  bodyViewportHeight = 0;
  columnOffsets = [];
  columns = [];
  headerDepth = 1;
  headerCells = [];
  leafColumns = [];
  cellMergeMap = /* @__PURE__ */ new Map();
  cellMergeByRow = /* @__PURE__ */ new Map();
  mergedCellSet = /* @__PURE__ */ new Set();
  cellToMergeMap = /* @__PURE__ */ new Map();
  // 动态行高支持
  rowHeightOverrides = /* @__PURE__ */ new WeakMap();
  hasRowHeightOverrides = false;
  rowHeightFn;
  cachedRows = [];
  // 缓存行引用，用于检测数据变化
  rowHeightsDirty = true;
  // 标记行高度是否需要重新计算
  viewportWidth = 0;
  viewportHeight = 0;
  scrollLeft = 0;
  scrollTop = 0;
  showRowNumbers = false;
  rowNumberColumnWidth = 50;
  constructor(config, theme) {
    this.config = {
      enabled: config?.enabled ?? true,
      rowBufferSize: config?.rowBufferSize ?? DEFAULT_ROW_BUFFER_SIZE,
      columnBufferSize: config?.columnBufferSize ?? DEFAULT_COLUMN_BUFFER_SIZE,
      estimatedRowHeight: config?.estimatedRowHeight ?? DEFAULT_ROW_HEIGHT,
      estimatedColumnWidth: config?.estimatedColumnWidth ?? DEFAULT_COLUMN_WIDTH
    };
    this.theme = theme;
    this.layoutInfo = this.createEmptyLayoutInfo();
    this.rowBands = this.createEmptyRowBands();
    this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
  }
  createEmptyRowBands() {
    return {
      summaryTop: { type: "summary-top", rows: [], height: 0, y: this.theme.row.headerHeight },
      pinnedTop: { type: "pinned-top", rows: [], height: 0, y: this.theme.row.headerHeight },
      body: { type: "body", rows: [], height: 0, y: this.theme.row.headerHeight },
      pinnedBottom: { type: "pinned-bottom", rows: [], height: 0, y: this.viewportHeight },
      summaryBottom: { type: "summary-bottom", rows: [], height: 0, y: this.viewportHeight }
    };
  }
  setShowRowNumbers(show) {
    this.showRowNumbers = show;
  }
  getShowRowNumbers() {
    return this.showRowNumbers;
  }
  getRowNumberColumnWidth() {
    return this.showRowNumbers ? this.rowNumberColumnWidth : 0;
  }
  // 占位列相关常量
  static HIDDEN_PLACEHOLDER_WIDTH = 5;
  static HIDDEN_PLACEHOLDER_PREFIX = "__hidden_placeholder__";
  hasLeftFixedColumns() {
    return this.leafColumns.some(
      (col) => col?.fixed === "left" && !col._isRowNumber && !col.key.startsWith(LayoutManager.HIDDEN_PLACEHOLDER_PREFIX)
    );
  }
  isHiddenPlaceholderColumn(column) {
    return column.key.startsWith(LayoutManager.HIDDEN_PLACEHOLDER_PREFIX);
  }
  getHiddenColumnKey(placeholderColumn) {
    if (this.isHiddenPlaceholderColumn(placeholderColumn)) {
      return placeholderColumn._hiddenColumnKey ?? null;
    }
    return null;
  }
  createEmptyLayoutInfo() {
    return {
      totalWidth: 0,
      totalHeight: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      headerHeight: this.theme.row.headerHeight,
      rowHeight: this.theme.row.height,
      columnWidths: [],
      rowOffsets: [],
      columnOffsets: []
    };
  }
  setViewportSize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.layoutInfo.viewportWidth = width;
    this.layoutInfo.viewportHeight = height;
    this.updateVisibleRange();
  }
  setTheme(theme) {
    this.theme = theme;
    this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth;
    this.layoutInfo.rowHeight = this.theme.row.height;
  }
  setRowHeightFn(fn) {
    this.rowHeightFn = fn;
    this.rowHeightsDirty = true;
  }
  setRowPinManager(rowPinManager) {
    this.rowPinManager = rowPinManager;
    this.rowHeightsDirty = true;
  }
  setSummaryRows(summaryTopRows, summaryBottomRows) {
    this.rowBands.summaryTop.rows = [...summaryTopRows];
    this.rowBands.summaryBottom.rows = [...summaryBottomRows];
    this.summaryTopHeight = this.calculateSummaryRowsHeight(summaryTopRows);
    this.summaryBottomHeight = this.calculateSummaryRowsHeight(summaryBottomRows);
    this.rowBands.summaryTop.height = this.summaryTopHeight;
    this.rowBands.summaryBottom.height = this.summaryBottomHeight;
    this.updateRowBandGeometry();
    this.updateVisibleRange();
  }
  getRowBands() {
    return {
      summaryTop: { ...this.rowBands.summaryTop, rows: [...this.rowBands.summaryTop.rows] },
      pinnedTop: { ...this.rowBands.pinnedTop, rows: [...this.rowBands.pinnedTop.rows] },
      body: { ...this.rowBands.body, rows: [...this.rowBands.body.rows] },
      pinnedBottom: {
        ...this.rowBands.pinnedBottom,
        rows: [...this.rowBands.pinnedBottom.rows]
      },
      summaryBottom: {
        ...this.rowBands.summaryBottom,
        rows: [...this.rowBands.summaryBottom.rows]
      }
    };
  }
  getRowBandsForRender() {
    return this.rowBands;
  }
  hasPinnedRows() {
    return this.rowBands.pinnedTop.rows.length > 0 || this.rowBands.pinnedBottom.rows.length > 0;
  }
  getBodyViewportHeight() {
    return this.bodyViewportHeight;
  }
  getBodyContentHeight() {
    return this.rowBands.body.height;
  }
  getRowPinPosition(row) {
    return this.rowPinManager?.getPosition(row) ?? null;
  }
  setRowHeight(row, height) {
    const clampedHeight = clamp(height, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(row, clampedHeight);
    this.hasRowHeightOverrides = true;
    this.rowHeightsDirty = true;
  }
  updateRowHeight(row, height) {
    const clampedHeight = clamp(height, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(row, clampedHeight);
    this.hasRowHeightOverrides = true;
    const rowIndex = this.rowIndexByRow.get(row);
    if (rowIndex === void 0 || rowIndex < 0 || rowIndex >= this.rowHeights.length) {
      this.rowHeightsDirty = true;
      return false;
    }
    const previousHeight = this.rowHeights[rowIndex] ?? this.theme.row.height;
    const delta = clampedHeight - previousHeight;
    if (delta === 0) {
      return true;
    }
    this.rowHeights[rowIndex] = clampedHeight;
    this.rowHeightByRow.set(row, clampedHeight);
    for (let i = rowIndex + 1; i < this.rowOffsets.length; i++) {
      this.rowOffsets[i] = (this.rowOffsets[i] ?? 0) + delta;
    }
    this.layoutInfo.rowOffsets = this.rowOffsets;
    const bodyRowIndex = this.bodyRowIndexByRow.get(row);
    if (bodyRowIndex !== void 0 && bodyRowIndex >= 0) {
      this.bodyRowHeights[bodyRowIndex] = clampedHeight;
      for (let i = bodyRowIndex + 1; i < this.bodyRowOffsets.length; i++) {
        this.bodyRowOffsets[i] = (this.bodyRowOffsets[i] ?? 0) + delta;
      }
      this.rowBands.body.height += delta;
    } else {
      this.updatePinnedRowHeight(row, delta);
    }
    this.updateRowBandGeometry();
    this.layoutInfo.totalHeight = this.calculateTotalHeight(this.rowHeights.length);
    this.updateVisibleRange();
    return true;
  }
  updateRowPin(row, previousPosition, nextPosition) {
    const rowIndex = this.rowIndexByRow.get(row);
    if (rowIndex === void 0 || rowIndex < 0 || rowIndex >= this.rowHeights.length) {
      return false;
    }
    if (previousPosition === nextPosition) {
      return true;
    }
    const height = this.getResolvedRowHeight(row);
    if (!this.removeRowFromPinSource(row, previousPosition, height)) {
      return false;
    }
    if (!this.addRowToPinTarget(row, nextPosition, rowIndex, height)) {
      return false;
    }
    this.updatePinnedBandOffsets(this.rowBands.pinnedTop.rows);
    this.updatePinnedBandOffsets(this.rowBands.pinnedBottom.rows);
    this.updateRowBandGeometry();
    this.layoutInfo.totalHeight = this.calculateTotalHeight(this.rowHeights.length);
    this.updateVisibleRange();
    return true;
  }
  clearRowHeightOverrides() {
    if (!this.hasRowHeightOverrides) {
      return;
    }
    this.rowHeightOverrides = /* @__PURE__ */ new WeakMap();
    this.hasRowHeightOverrides = false;
    this.rowHeightsDirty = true;
  }
  setScrollPosition(scrollLeft, scrollTop) {
    this.scrollLeft = scrollLeft;
    this.scrollTop = scrollTop;
    this.updateVisibleRange();
  }
  getScrollLeft() {
    return this.scrollLeft;
  }
  createRowNumberColumn(hasLeftFixed) {
    return {
      key: `__row_number_${Date.now()}__`,
      title: "#",
      width: this.rowNumberColumnWidth,
      fixed: hasLeftFixed ? "left" : false,
      type: "text",
      align: "center",
      hideable: false,
      sortable: false,
      reorderable: false,
      _isRowNumber: true,
      render: (_value, _row, _column, rowIndex) => ({
        text: String(rowIndex + 1),
        type: "text",
        style: {
          color: this.theme.colors.placeholderText,
          horizontalAlign: "center"
        }
      })
    };
  }
  hasLeftFixedColumnsIn(columns) {
    for (const column of columns) {
      if (column.fixed === "left") return true;
      if (column.children && this.hasLeftFixedColumnsIn(column.children)) return true;
    }
    return false;
  }
  buildLayoutColumns(columns) {
    if (!this.showRowNumbers) {
      return columns;
    }
    return [this.createRowNumberColumn(this.hasLeftFixedColumnsIn(columns)), ...columns];
  }
  getVisibleLeafColumnsForLayout(columns) {
    const leafColumns = [];
    const createHiddenPlaceholder = (column, fixed) => ({
      key: LayoutManager.HIDDEN_PLACEHOLDER_PREFIX + column.key,
      title: "",
      width: LayoutManager.HIDDEN_PLACEHOLDER_WIDTH,
      type: "text",
      fixed,
      _hiddenColumnKey: column.key
    });
    const collectLeaves = (items, includeEdgePlaceholders) => {
      const count = items.length;
      const previousVisibleFixed = Array.from({
        length: count
      });
      const nextVisibleFixed = Array.from({
        length: count
      });
      const hasFollowingVisible = Array.from({ length: count + 1 }).fill(false);
      let lastVisibleFixed;
      for (let index = 0; index < count; index++) {
        previousVisibleFixed[index] = lastVisibleFixed;
        const column = items[index];
        if (column && !column.hidden) {
          lastVisibleFixed = column.fixed === "left" || column.fixed === "right" ? column.fixed : void 0;
        }
      }
      for (let index = count - 1; index >= 0; index--) {
        const column = items[index];
        hasFollowingVisible[index] = Boolean(column && !column.hidden) || hasFollowingVisible[index + 1];
      }
      lastVisibleFixed = void 0;
      for (let index = count - 1; index >= 0; index--) {
        nextVisibleFixed[index] = lastVisibleFixed;
        const column = items[index];
        if (column && !column.hidden) {
          lastVisibleFixed = column.fixed === "left" || column.fixed === "right" ? column.fixed : void 0;
        }
      }
      let accumulatedWidth = 0;
      let previousWasHidden = false;
      let hasPreviousVisible = false;
      for (let index = 0; index < count; index++) {
        const column = items[index];
        if (!column) continue;
        if (column.hidden) {
          const hasNextVisible = hasFollowingVisible[index + 1];
          const shouldAddPlaceholder = includeEdgePlaceholders ? hasPreviousVisible && hasNextVisible : (previousWasHidden === false || accumulatedWidth > 0) && (hasNextVisible || accumulatedWidth > 0);
          if (shouldAddPlaceholder) {
            const previousFixed = previousVisibleFixed[index];
            const nextFixed = nextVisibleFixed[index];
            const placeholderFixed = previousFixed === nextFixed ? previousFixed : void 0;
            const placeholder = createHiddenPlaceholder(column, placeholderFixed);
            leafColumns.push(placeholder);
            accumulatedWidth += LayoutManager.HIDDEN_PLACEHOLDER_WIDTH;
          }
          previousWasHidden = true;
          continue;
        }
        previousWasHidden = false;
        hasPreviousVisible = true;
        if (column.children && column.children.length > 0) {
          accumulatedWidth += collectLeaves(column.children, false);
        } else {
          leafColumns.push(column);
          accumulatedWidth += this.getColumnWidth(column);
        }
      }
      return accumulatedWidth;
    };
    collectLeaves(this.buildLayoutColumns(columns), true);
    return leafColumns;
  }
  calculateLayout(columns, rows) {
    this.columns = this.buildLayoutColumns(columns);
    this.calculateHeaderLayout(this.columns);
    this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth;
    this.calculateColumnLayout(this.columns);
    this.calculateRowLayout(rows);
    this.calculateCellMerges(rows);
    this.layoutInfo.totalWidth = this.calculateTotalWidth();
    this.layoutInfo.totalHeight = this.calculateTotalHeight(rows.length);
    return { ...this.layoutInfo };
  }
  /**
   * 只更新列相关的布局（用于列重排、列交换等操作）
   * 避免遍历所有行，提升大数据量时的性能
   */
  calculateColumnLayoutOnly(columns) {
    this.columns = this.buildLayoutColumns(columns);
    this.calculateHeaderLayout(this.columns);
    this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth;
    this.calculateColumnLayout(this.columns);
    this.layoutInfo.totalWidth = this.calculateTotalWidth();
    return { ...this.layoutInfo };
  }
  calculateHeaderLayout(columns) {
    this.headerCells = [];
    this.leafColumns = [];
    this.headerDepth = 1;
    const calculateDepthSkipHidden = (column, currentDepth) => {
      if (column.hidden) return currentDepth;
      if (column.children && column.children.length > 0) {
        let maxChildDepth = currentDepth;
        for (const child of column.children) {
          if (!child.hidden) {
            maxChildDepth = Math.max(
              maxChildDepth,
              calculateDepthSkipHidden(child, currentDepth + 1)
            );
          }
        }
        return maxChildDepth;
      }
      return currentDepth;
    };
    for (const column of columns) {
      if (!column.hidden) {
        this.headerDepth = Math.max(this.headerDepth, calculateDepthSkipHidden(column, 0) + 1);
      }
    }
    const processColumn = (column, depth, startX, parentKey) => {
      column.depth = depth;
      column.parentKey = parentKey;
      if (column.hidden) {
        return 0;
      }
      if (column.children && column.children.length > 0) {
        let childX = startX;
        let totalWidth = 0;
        let visibleChildCount = 0;
        let prevChildWasHidden = false;
        for (let i = 0; i < column.children.length; i++) {
          const child = column.children[i];
          if (!child) continue;
          if (child.hidden) {
            const hasNextVisible = column.children.slice(i + 1).some((c) => c && !c.hidden);
            if ((prevChildWasHidden === false || totalWidth > 0) && (hasNextVisible || totalWidth > 0)) {
              let prevChildFixed;
              for (let j = i - 1; j >= 0; j--) {
                const prevChild = column.children[j];
                if (prevChild && !prevChild.hidden) {
                  if (prevChild.fixed === "left" || prevChild.fixed === "right") {
                    prevChildFixed = prevChild.fixed;
                  }
                  break;
                }
              }
              let nextChildFixed;
              for (let j = i + 1; j < column.children.length; j++) {
                const nextChild = column.children[j];
                if (nextChild && !nextChild.hidden) {
                  if (nextChild.fixed === "left" || nextChild.fixed === "right") {
                    nextChildFixed = nextChild.fixed;
                  }
                  break;
                }
              }
              const placeholderFixed = prevChildFixed === nextChildFixed ? prevChildFixed : void 0;
              const placeholderKey = LayoutManager.HIDDEN_PLACEHOLDER_PREFIX + child.key;
              const placeholderColumn = {
                key: placeholderKey,
                title: "",
                width: LayoutManager.HIDDEN_PLACEHOLDER_WIDTH,
                type: "text",
                fixed: placeholderFixed,
                _hiddenColumnKey: child.key
              };
              const placeholderWidth = LayoutManager.HIDDEN_PLACEHOLDER_WIDTH;
              this.columnWidths.set(placeholderKey, placeholderWidth);
              this.leafColumns.push(placeholderColumn);
              const placeholderDepth = depth + 1;
              const placeholderRowspan = this.headerDepth - placeholderDepth;
              this.headerCells.push({
                column: placeholderColumn,
                x: childX,
                y: placeholderDepth * this.theme.row.headerHeight,
                width: placeholderWidth,
                height: this.theme.row.headerHeight * placeholderRowspan,
                rowIndex: placeholderDepth,
                colIndex: this.leafColumns.length - 1,
                colspan: 1,
                rowspan: placeholderRowspan,
                isLeaf: true
              });
              totalWidth += placeholderWidth;
              childX += placeholderWidth;
            }
            prevChildWasHidden = true;
            continue;
          }
          prevChildWasHidden = false;
          const childWidth = processColumn(child, depth + 1, childX, column.key);
          childX += childWidth;
          totalWidth += childWidth;
          visibleChildCount++;
        }
        if (visibleChildCount === 0) {
          return 0;
        }
        this.headerCells.push({
          column,
          x: startX,
          y: depth * this.theme.row.headerHeight,
          width: totalWidth,
          height: this.theme.row.headerHeight,
          rowIndex: depth,
          colIndex: this.headerCells.length,
          colspan: visibleChildCount,
          rowspan: 1,
          isLeaf: false
        });
        return totalWidth;
      } else {
        const width = this.getColumnWidth(column);
        this.columnWidths.set(column.key, width);
        const rowspan = this.headerDepth - depth;
        this.headerCells.push({
          column,
          x: startX,
          y: depth * this.theme.row.headerHeight,
          width,
          height: this.theme.row.headerHeight * rowspan,
          rowIndex: depth,
          colIndex: this.leafColumns.length,
          colspan: 1,
          rowspan,
          isLeaf: true
        });
        this.leafColumns.push(column);
        return width;
      }
    };
    let x = 0;
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      if (!column) continue;
      if (column.hidden) {
        const hasNextVisible = columns.slice(colIndex + 1).some((c) => c && !c.hidden);
        const hasPrevVisible = columns.slice(0, colIndex).some((c) => c && !c.hidden);
        if (hasPrevVisible && hasNextVisible) {
          let prevFixed;
          for (let j = colIndex - 1; j >= 0; j--) {
            const prevCol = columns[j];
            if (prevCol && !prevCol.hidden) {
              if (prevCol.fixed === "left" || prevCol.fixed === "right") {
                prevFixed = prevCol.fixed;
              }
              break;
            }
          }
          let nextFixed;
          for (let j = colIndex + 1; j < columns.length; j++) {
            const nextCol = columns[j];
            if (nextCol && !nextCol.hidden) {
              if (nextCol.fixed === "left" || nextCol.fixed === "right") {
                nextFixed = nextCol.fixed;
              }
              break;
            }
          }
          const placeholderFixed = prevFixed === nextFixed ? prevFixed : void 0;
          const placeholderKey = LayoutManager.HIDDEN_PLACEHOLDER_PREFIX + column.key;
          const placeholderColumn = {
            key: placeholderKey,
            title: "",
            width: LayoutManager.HIDDEN_PLACEHOLDER_WIDTH,
            type: "text",
            fixed: placeholderFixed,
            _hiddenColumnKey: column.key
          };
          const placeholderWidth = LayoutManager.HIDDEN_PLACEHOLDER_WIDTH;
          this.columnWidths.set(placeholderKey, placeholderWidth);
          this.headerCells.push({
            column: placeholderColumn,
            x,
            y: 0,
            width: placeholderWidth,
            height: this.theme.row.headerHeight * this.headerDepth,
            rowIndex: 0,
            colIndex: this.leafColumns.length,
            colspan: 1,
            rowspan: this.headerDepth,
            isLeaf: true
          });
          this.leafColumns.push(placeholderColumn);
          x += placeholderWidth;
        }
        continue;
      }
      x += processColumn(column, 0, x);
    }
  }
  calculateColumnLayout(_columns) {
    this.columnOffsets = [];
    const widths = [];
    let offset = 0;
    for (const column of this.leafColumns) {
      const width = this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
      widths.push(width);
      this.columnOffsets.push(offset);
      offset += width;
    }
    this.layoutInfo.columnWidths = widths;
  }
  calculateCellMerges(rows) {
    this.cellMergeMap.clear();
    this.cellMergeByRow.clear();
    this.mergedCellSet.clear();
    this.cellToMergeMap.clear();
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || !row.cellMerges) continue;
      for (const merge of row.cellMerges) {
        const normalizedMerge = {
          ...merge,
          rowIndex
        };
        const key = `${rowIndex}-${merge.columnIndex}`;
        this.cellMergeMap.set(key, normalizedMerge);
        this.cellToMergeMap.set(key, normalizedMerge);
        for (let r = rowIndex; r < rowIndex + merge.rowspan; r++) {
          if (!this.cellMergeByRow.has(r)) {
            this.cellMergeByRow.set(r, []);
          }
          this.cellMergeByRow.get(r).push(normalizedMerge);
          for (let c = merge.columnIndex; c < merge.columnIndex + merge.colspan; c++) {
            if (r !== rowIndex || c !== merge.columnIndex) {
              this.mergedCellSet.add(`${r}-${c}`);
              this.cellToMergeMap.set(`${r}-${c}`, normalizedMerge);
            }
          }
        }
      }
    }
  }
  calculateRowLayout(rows) {
    const rowCount = rows.length;
    const defaultHeight = this.theme.row.height;
    const rowsChanged = rowCount !== this.cachedRows.length || rows.some((row, i) => row !== this.cachedRows[i]);
    if (!rowsChanged && !this.rowHeightsDirty && this.rowHeights.length === rowCount) {
      this.calculateRowBands(rows);
      return;
    }
    this.cachedRows = [...rows];
    this.rowHeightsDirty = false;
    this.rowHeightByRow = /* @__PURE__ */ new WeakMap();
    this.rowIndexByRow = /* @__PURE__ */ new WeakMap();
    const fn = this.rowHeightFn;
    this.rowHeights = rows.map((row, index) => {
      const overrideHeight = this.rowHeightOverrides.get(row);
      if (overrideHeight !== void 0) {
        return clamp(overrideHeight, this.theme.row.minHeight, this.theme.row.maxHeight);
      }
      if (fn) {
        return fn(row, index);
      }
      return defaultHeight;
    });
    rows.forEach((row, index) => {
      this.rowHeightByRow.set(row, this.rowHeights[index] ?? defaultHeight);
      this.rowIndexByRow.set(row, index);
    });
    this.rowOffsets = Array.from({ length: rowCount });
    this.rowOffsets[0] = this.layoutInfo.headerHeight;
    for (let i = 1; i < rowCount; i++) {
      this.rowOffsets[i] = this.rowOffsets[i - 1] + this.rowHeights[i - 1];
    }
    this.layoutInfo.rowOffsets = [...this.rowOffsets];
    this.calculateRowBands(rows);
  }
  calculateRowBands(rows) {
    this.bodyRowIndexByRow = /* @__PURE__ */ new WeakMap();
    this.rowBandOffsetByRow = /* @__PURE__ */ new WeakMap();
    this.pinnedRowByRow = /* @__PURE__ */ new WeakMap();
    const visibleRows = new Set(rows);
    const pinnedTopRows = this.rowPinManager ? this.rowPinManager.getTopRows().filter((row) => visibleRows.has(row)) : [];
    const pinnedBottomRows = this.rowPinManager ? this.rowPinManager.getBottomRows().filter((row) => visibleRows.has(row)) : [];
    const bodyRows = this.rowPinManager ? rows.filter((row) => !this.rowPinManager.isPinned(row)) : rows;
    this.pinnedTopHeight = this.calculateRowsHeight(pinnedTopRows);
    this.pinnedBottomHeight = this.calculateRowsHeight(pinnedBottomRows);
    this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight - this.layoutInfo.headerHeight - this.summaryTopHeight - this.pinnedTopHeight - this.pinnedBottomHeight - this.summaryBottomHeight
    );
    const summaryTopY = this.layoutInfo.headerHeight;
    const pinnedTopY = summaryTopY + this.summaryTopHeight;
    const bodyY = pinnedTopY + this.pinnedTopHeight;
    const summaryBottomY = this.viewportHeight > 0 ? Math.max(bodyY, this.viewportHeight - this.summaryBottomHeight) : bodyY + this.calculateRowsHeight(bodyRows) + this.pinnedBottomHeight;
    const pinnedBottomY = this.viewportHeight > 0 ? Math.max(bodyY, summaryBottomY - this.pinnedBottomHeight) : bodyY + this.calculateRowsHeight(bodyRows);
    this.rowBands = {
      summaryTop: {
        type: "summary-top",
        rows: this.rowBands.summaryTop.rows,
        height: this.summaryTopHeight,
        y: summaryTopY
      },
      pinnedTop: {
        type: "pinned-top",
        rows: pinnedTopRows,
        height: this.pinnedTopHeight,
        y: pinnedTopY
      },
      body: {
        type: "body",
        rows: bodyRows,
        height: this.calculateRowsHeight(bodyRows),
        y: bodyY
      },
      pinnedBottom: {
        type: "pinned-bottom",
        rows: pinnedBottomRows,
        height: this.pinnedBottomHeight,
        y: pinnedBottomY
      },
      summaryBottom: {
        type: "summary-bottom",
        rows: this.rowBands.summaryBottom.rows,
        height: this.summaryBottomHeight,
        y: summaryBottomY
      }
    };
    this.bodyRowHeights = bodyRows.map((row) => this.getResolvedRowHeight(row));
    this.bodyRowOffsets = Array.from({ length: bodyRows.length });
    if (bodyRows.length > 0) {
      this.bodyRowOffsets[0] = 0;
      for (let i = 1; i < bodyRows.length; i++) {
        this.bodyRowOffsets[i] = this.bodyRowOffsets[i - 1] + this.bodyRowHeights[i - 1];
      }
    }
    let pinnedTopOffset = 0;
    for (const row of pinnedTopRows) {
      this.pinnedRowByRow.set(row, true);
      this.rowBandOffsetByRow.set(row, pinnedTopOffset);
      pinnedTopOffset += this.getResolvedRowHeight(row);
    }
    for (let i = 0; i < bodyRows.length; i++) {
      const row = bodyRows[i];
      this.bodyRowIndexByRow.set(row, i);
      this.rowBandOffsetByRow.set(row, this.bodyRowOffsets[i] ?? 0);
    }
    let pinnedBottomOffset = 0;
    for (const row of pinnedBottomRows) {
      this.pinnedRowByRow.set(row, true);
      this.rowBandOffsetByRow.set(row, pinnedBottomOffset);
      pinnedBottomOffset += this.getResolvedRowHeight(row);
    }
  }
  updatePinnedRowHeight(row, delta) {
    const position = this.getRowPinPosition(row);
    if (position === "top") {
      this.pinnedTopHeight += delta;
      this.rowBands.pinnedTop.height = this.pinnedTopHeight;
      this.updatePinnedBandOffsets(this.rowBands.pinnedTop.rows);
      return;
    }
    if (position === "bottom") {
      this.pinnedBottomHeight += delta;
      this.rowBands.pinnedBottom.height = this.pinnedBottomHeight;
      this.updatePinnedBandOffsets(this.rowBands.pinnedBottom.rows);
    }
  }
  removeRowFromPinSource(row, previousPosition, height) {
    if (previousPosition === "top") {
      return this.removePinnedRow(this.rowBands.pinnedTop.rows, row, () => {
        this.pinnedTopHeight -= height;
        this.rowBands.pinnedTop.height = this.pinnedTopHeight;
      });
    }
    if (previousPosition === "bottom") {
      return this.removePinnedRow(this.rowBands.pinnedBottom.rows, row, () => {
        this.pinnedBottomHeight -= height;
        this.rowBands.pinnedBottom.height = this.pinnedBottomHeight;
      });
    }
    return this.removeBodyRow(row, height);
  }
  addRowToPinTarget(row, nextPosition, rowIndex, height) {
    if (nextPosition === "top") {
      this.rowBands.pinnedTop.rows.push(row);
      this.pinnedTopHeight += height;
      this.rowBands.pinnedTop.height = this.pinnedTopHeight;
      this.pinnedRowByRow.set(row, true);
      return true;
    }
    if (nextPosition === "bottom") {
      this.rowBands.pinnedBottom.rows.push(row);
      this.pinnedBottomHeight += height;
      this.rowBands.pinnedBottom.height = this.pinnedBottomHeight;
      this.pinnedRowByRow.set(row, true);
      return true;
    }
    this.insertBodyRow(row, rowIndex, height);
    this.pinnedRowByRow.delete(row);
    return true;
  }
  removePinnedRow(rows, row, onRemoved) {
    const index = rows.indexOf(row);
    if (index < 0) {
      return false;
    }
    rows.splice(index, 1);
    this.pinnedRowByRow.delete(row);
    this.rowBandOffsetByRow.delete(row);
    onRemoved();
    return true;
  }
  removeBodyRow(row, height) {
    const bodyIndex = this.bodyRowIndexByRow.get(row);
    if (bodyIndex === void 0 || bodyIndex < 0) {
      return false;
    }
    this.rowBands.body.rows.splice(bodyIndex, 1);
    this.bodyRowHeights.splice(bodyIndex, 1);
    this.bodyRowOffsets.splice(bodyIndex, 1);
    this.rowBands.body.height -= height;
    this.bodyRowIndexByRow.delete(row);
    this.rowBandOffsetByRow.delete(row);
    this.rebuildBodyBandFrom(bodyIndex);
    return true;
  }
  insertBodyRow(row, rowIndex, height) {
    const bodyIndex = this.findBodyInsertionIndex(rowIndex);
    this.rowBands.body.rows.splice(bodyIndex, 0, row);
    this.bodyRowHeights.splice(bodyIndex, 0, height);
    this.bodyRowOffsets.splice(bodyIndex, 0, 0);
    this.rowBands.body.height += height;
    this.rebuildBodyBandFrom(bodyIndex);
  }
  findBodyInsertionIndex(rowIndex) {
    let left = 0;
    let right = this.rowBands.body.rows.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const currentRow = this.rowBands.body.rows[mid];
      const currentIndex = currentRow ? this.getRowIndexByRef(currentRow) : -1;
      if (currentIndex < rowIndex) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    return left;
  }
  rebuildBodyBandFrom(startIndex) {
    const start = Math.max(0, startIndex);
    for (let i = start; i < this.rowBands.body.rows.length; i++) {
      this.bodyRowOffsets[i] = i === 0 ? 0 : (this.bodyRowOffsets[i - 1] ?? 0) + (this.bodyRowHeights[i - 1] ?? 0);
      const row = this.rowBands.body.rows[i];
      this.bodyRowIndexByRow.set(row, i);
      this.rowBandOffsetByRow.set(row, this.bodyRowOffsets[i] ?? 0);
    }
  }
  updatePinnedBandOffsets(rows) {
    let offset = 0;
    for (const pinnedRow of rows) {
      this.rowBandOffsetByRow.set(pinnedRow, offset);
      offset += this.getResolvedRowHeight(pinnedRow);
    }
  }
  updateRowBandGeometry() {
    this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight - this.layoutInfo.headerHeight - this.summaryTopHeight - this.pinnedTopHeight - this.pinnedBottomHeight - this.summaryBottomHeight
    );
    const summaryTopY = this.layoutInfo.headerHeight;
    const pinnedTopY = summaryTopY + this.summaryTopHeight;
    const bodyY = pinnedTopY + this.pinnedTopHeight;
    const summaryBottomY = this.viewportHeight > 0 ? Math.max(bodyY, this.viewportHeight - this.summaryBottomHeight) : bodyY + this.rowBands.body.height + this.pinnedBottomHeight;
    this.rowBands.summaryTop.y = summaryTopY;
    this.rowBands.pinnedTop.y = pinnedTopY;
    this.rowBands.body.y = bodyY;
    this.rowBands.pinnedBottom.y = this.viewportHeight > 0 ? Math.max(bodyY, summaryBottomY - this.pinnedBottomHeight) : bodyY + this.rowBands.body.height;
    this.rowBands.summaryBottom.y = summaryBottomY;
  }
  calculateRowsHeight(rows) {
    return rows.reduce((total, row) => total + this.getResolvedRowHeight(row), 0);
  }
  calculateSummaryRowsHeight(rows) {
    return rows.reduce((total, row) => total + row.height, 0);
  }
  getResolvedRowHeight(row) {
    return this.rowHeightByRow.get(row) ?? this.theme.row.height;
  }
  getRowIndexByRef(row) {
    return this.rowIndexByRow.get(row) ?? -1;
  }
  getBodyRowIndexByRef(row) {
    return this.bodyRowIndexByRow.get(row) ?? -1;
  }
  getRowBandOffsetByRef(row) {
    const bodyRowIndex = this.bodyRowIndexByRow.get(row);
    if (bodyRowIndex !== void 0 && bodyRowIndex >= 0) {
      return this.bodyRowOffsets[bodyRowIndex] ?? null;
    }
    return this.rowBandOffsetByRow.get(row) ?? null;
  }
  isRowInPinnedBand(row) {
    return this.pinnedRowByRow.has(row);
  }
  getColumnWidth(column) {
    if (this.columnWidths.has(column.key)) {
      return this.columnWidths.get(column.key);
    }
    if (column.children && column.children.length > 0) {
      let totalWidth = 0;
      for (const child of column.children) {
        totalWidth += this.getColumnWidth(child);
      }
      return totalWidth;
    }
    let width = column.width ?? this.config.estimatedColumnWidth ?? DEFAULT_COLUMN_WIDTH;
    width = clamp(width, column.minWidth ?? MIN_COLUMN_WIDTH, column.maxWidth ?? MAX_COLUMN_WIDTH);
    return width;
  }
  setColumnWidth(columnKey, width) {
    const column = this.getColumnByKey(columnKey);
    if (column) {
      const clampedWidth = clamp(
        width,
        column.minWidth ?? MIN_COLUMN_WIDTH,
        column.maxWidth ?? MAX_COLUMN_WIDTH
      );
      this.columnWidths.set(columnKey, clampedWidth);
      this.recalculateColumnLayout();
      this.recalculateHeaderLayout();
    }
  }
  recalculateColumnLayout() {
    this.columnOffsets = [];
    const widths = [];
    let offset = 0;
    for (const column of this.leafColumns) {
      const width = this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
      widths.push(width);
      this.columnOffsets.push(offset);
      offset += width;
    }
    this.layoutInfo.columnWidths = widths;
    this.layoutInfo.totalWidth = this.calculateTotalWidth();
  }
  recalculateHeaderLayout() {
    const updateHeaderCellPositions = (columns, startX) => {
      let x = startX;
      for (const column of columns) {
        const headerCell = this.headerCells.find((hc) => hc.column === column);
        if (headerCell) {
          headerCell.x = x;
          if (column.children && column.children.length > 0) {
            headerCell.width = updateHeaderCellPositions(column.children, x);
          } else {
            headerCell.width = this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
          }
          x += headerCell.width;
        }
      }
      return x - startX;
    };
    updateHeaderCellPositions(this.columns, 0);
  }
  getColumnByKey(key) {
    const findColumn = (columns) => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children);
          if (found) return found;
        }
      }
      return void 0;
    };
    return findColumn(this.columns);
  }
  getLeafColumnIndexByKey(key) {
    for (let i = 0; i < this.leafColumns.length; i++) {
      if (this.leafColumns[i]?.key === key) {
        return i;
      }
    }
    return null;
  }
  getLeafColumnIndex(column) {
    return this.leafColumns.findIndex((col) => col === column);
  }
  getRowHeight(_row) {
    return this.theme.row.height;
  }
  calculateTotalWidth() {
    let total = 0;
    for (const column of this.leafColumns) {
      total += this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
    }
    return total;
  }
  calculateTotalHeight(_rowCount) {
    return this.layoutInfo.headerHeight + this.pinnedTopHeight + this.rowBands.body.height + this.pinnedBottomHeight;
  }
  updateVisibleRange() {
    if (!this.config.enabled) {
      this.visibleRange = {
        startRow: 0,
        endRow: Math.max(0, this.rowHeights.length - 1),
        startColumn: 0,
        endColumn: Math.max(0, this.layoutInfo.columnWidths.length - 1)
      };
      return;
    }
    const headerHeight = this.layoutInfo.headerHeight;
    const rowBufferSize = this.config.rowBufferSize ?? DEFAULT_ROW_BUFFER_SIZE;
    const columnBufferSize = this.config.columnBufferSize ?? DEFAULT_COLUMN_BUFFER_SIZE;
    const bodyViewportHeight = this.bodyViewportHeight > 0 ? this.bodyViewportHeight : Math.max(0, this.viewportHeight - headerHeight);
    const startRow = this.findBodyRowIndexAtOffset(this.scrollTop);
    const endRow = this.findBodyRowIndexAtOffset(this.scrollTop + bodyViewportHeight);
    this.visibleRange.startRow = Math.max(0, startRow - rowBufferSize);
    this.visibleRange.endRow = Math.min(this.bodyRowHeights.length - 1, endRow + rowBufferSize);
    const startColumn = this.findColumnIndexAtOffset(this.scrollLeft);
    const endColumn = this.findColumnIndexAtOffset(this.scrollLeft + this.viewportWidth);
    this.visibleRange.startColumn = Math.max(0, startColumn - columnBufferSize);
    this.visibleRange.endColumn = Math.min(
      this.layoutInfo.columnWidths.length - 1,
      endColumn + columnBufferSize
    );
  }
  findRowIndexAtOffset(offset) {
    if (offset <= 0) return 0;
    if (this.rowOffsets.length === 0) return 0;
    const lastOffset = this.rowOffsets[this.rowOffsets.length - 1] ?? 0;
    if (offset >= lastOffset) {
      return this.rowOffsets.length - 1;
    }
    return binarySearch(this.rowOffsets, offset, (item) => item);
  }
  findBodyRowIndexAtOffset(offset) {
    if (offset <= 0) return 0;
    if (this.bodyRowOffsets.length === 0) return 0;
    const lastIndex = this.bodyRowOffsets.length - 1;
    const lastOffset = this.bodyRowOffsets[lastIndex] ?? 0;
    const lastHeight = this.bodyRowHeights[lastIndex] ?? 0;
    if (offset >= lastOffset + lastHeight) {
      return lastIndex;
    }
    let left = 0;
    let right = lastIndex;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const rowOffset = this.bodyRowOffsets[mid];
      const rowHeight = this.bodyRowHeights[mid];
      if (offset >= rowOffset && offset < rowOffset + rowHeight) {
        return mid;
      }
      if (offset < rowOffset) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return Math.max(0, Math.min(lastIndex, left));
  }
  findRowInBandAtOffset(rows, offset) {
    if (offset < 0) {
      return null;
    }
    let currentOffset = 0;
    for (const row of rows) {
      const height = this.getResolvedRowHeight(row);
      if (offset >= currentOffset && offset < currentOffset + height) {
        return row;
      }
      currentOffset += height;
    }
    return null;
  }
  findSummaryRowInBandAtOffset(rows, offset) {
    if (offset < 0) {
      return null;
    }
    let currentOffset = 0;
    for (const row of rows) {
      if (offset >= currentOffset && offset < currentOffset + row.height) {
        return row;
      }
      currentOffset += row.height;
    }
    return null;
  }
  getRowViewportY(rowIndex, scrollTop = this.scrollTop) {
    const row = this.cachedRows[rowIndex];
    if (!row) {
      return null;
    }
    if (this.rowBands.pinnedTop.rows.includes(row)) {
      return this.rowBands.pinnedTop.y + (this.getRowBandOffsetByRef(row) ?? 0);
    }
    if (this.getBodyRowIndexByRef(row) >= 0) {
      return this.rowBands.body.y + (this.getRowBandOffsetByRef(row) ?? 0) - scrollTop;
    }
    if (this.rowBands.pinnedBottom.rows.includes(row)) {
      return this.rowBands.pinnedBottom.y + (this.getRowBandOffsetByRef(row) ?? 0);
    }
    return null;
  }
  getCellViewportY(rowIndex, scrollTop = this.scrollTop) {
    if (rowIndex === -1) {
      return 0;
    }
    return this.getRowViewportY(rowIndex, scrollTop) ?? this.getRowOffset(rowIndex) - scrollTop;
  }
  findColumnIndexAtOffset(offset) {
    if (offset <= 0) return 0;
    if (this.columnOffsets.length === 0) return 0;
    const lastOffset = this.columnOffsets[this.columnOffsets.length - 1] ?? 0;
    if (offset >= lastOffset) {
      return this.columnOffsets.length - 1;
    }
    return binarySearch(this.columnOffsets, offset, (item) => item);
  }
  getVisibleRange() {
    return { ...this.visibleRange };
  }
  getLayoutInfo() {
    return { ...this.layoutInfo };
  }
  getHeaderCells() {
    return [...this.headerCells];
  }
  getHeaderCellAtPosition(viewportX, viewportY) {
    const matchedCells = [];
    for (const cell of this.headerCells) {
      let cellViewportX;
      if (cell.column.fixed === "left") {
        cellViewportX = cell.x;
      } else if (cell.column.fixed === "right") {
        const rightFixedWidth = this.getRightFixedWidth();
        const startX = this.viewportWidth - rightFixedWidth;
        const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
        cellViewportX = cell.x + offsetX;
      } else {
        cellViewportX = cell.x - this.scrollLeft;
      }
      if (viewportX >= cellViewportX && viewportX < cellViewportX + cell.width && viewportY >= cell.y && viewportY < cell.y + cell.height) {
        matchedCells.push(cell);
      }
    }
    if (matchedCells.length === 0) return null;
    if (matchedCells.length === 1) return matchedCells[0];
    const fixedCell = matchedCells.find(
      (c) => c.column.fixed === "left" || c.column.fixed === "right"
    );
    if (fixedCell) {
      if (fixedCell.isLeaf) return fixedCell;
      for (const cell of this.headerCells) {
        if (!cell.isLeaf) continue;
        if (cell.column.fixed !== fixedCell.column.fixed) continue;
        let cellViewportX;
        if (cell.column.fixed === "left") {
          cellViewportX = cell.x;
        } else {
          const rightFixedWidth = this.getRightFixedWidth();
          const startX = this.viewportWidth - rightFixedWidth;
          const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
          cellViewportX = cell.x + offsetX;
        }
        if (viewportX >= cellViewportX && viewportX < cellViewportX + cell.width) {
          return cell;
        }
      }
    }
    const leafCell = matchedCells.find((c) => c.isLeaf);
    if (leafCell) return leafCell;
    for (const cell of this.headerCells) {
      if (!cell.isLeaf) continue;
      let cellViewportX;
      if (cell.column.fixed === "left") {
        cellViewportX = cell.x;
      } else if (cell.column.fixed === "right") {
        const rightFixedWidth = this.getRightFixedWidth();
        const startX = this.viewportWidth - rightFixedWidth;
        const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
        cellViewportX = cell.x + offsetX;
      } else {
        cellViewportX = cell.x - this.scrollLeft;
      }
      if (viewportX >= cellViewportX && viewportX < cellViewportX + cell.width) {
        return cell;
      }
    }
    return matchedCells.reduce(
      (deepest, cell) => cell.rowIndex > deepest.rowIndex ? cell : deepest
    );
  }
  getLeafHeaderCell(columnIndex) {
    const column = this.leafColumns[columnIndex];
    if (!column) return null;
    return this.headerCells.find((hc) => hc.column === column && hc.isLeaf) ?? null;
  }
  getLeafHeaderCellViewportPosition(columnIndex) {
    const leafHeaderCell = this.getLeafHeaderCell(columnIndex);
    if (!leafHeaderCell) return null;
    const column = leafHeaderCell.column;
    let x = leafHeaderCell.x;
    const y = leafHeaderCell.y;
    const width = leafHeaderCell.width;
    const height = leafHeaderCell.height;
    if (column.fixed === "left") ;
    else if (column.fixed === "right") {
      const rightFixedWidth = this.getRightFixedWidth();
      const startX = this.viewportWidth - rightFixedWidth;
      const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
      x = leafHeaderCell.x + offsetX;
    } else {
      x = x - this.scrollLeft;
    }
    return { x, y, width, height };
  }
  getLeafColumns() {
    return [...this.leafColumns];
  }
  getColumns() {
    return [...this.columns];
  }
  getLeafColumn(index) {
    return this.leafColumns[index];
  }
  getHeaderDepth() {
    return this.headerDepth;
  }
  getCellMerge(rowIndex, columnIndex) {
    return this.cellToMergeMap.get(`${rowIndex}-${columnIndex}`) ?? null;
  }
  isCellMerged(rowIndex, columnIndex) {
    return this.mergedCellSet.has(`${rowIndex}-${columnIndex}`);
  }
  isMergeStartCell(rowIndex, columnIndex) {
    const key = `${rowIndex}-${columnIndex}`;
    return this.cellMergeMap.has(key);
  }
  getMergesAffectingRow(rowIndex) {
    return this.cellMergeByRow.get(rowIndex) ?? [];
  }
  getMergedCellPosition(rowIndex, columnIndex) {
    const merge = this.getCellMerge(rowIndex, columnIndex);
    if (!merge) return null;
    const x = this.getColumnOffset(merge.columnIndex);
    const y = this.getRowOffset(merge.rowIndex);
    let width = 0;
    for (let i = 0; i < merge.colspan; i++) {
      width += this.getColumnWidthByIndex(merge.columnIndex + i);
    }
    let height = 0;
    for (let i = 0; i < merge.rowspan; i++) {
      height += this.getRowHeightByIndex(merge.rowIndex + i);
    }
    return { x, y, width, height };
  }
  getRowOffset(rowIndex) {
    return this.rowOffsets[rowIndex] ?? 0;
  }
  getColumnOffset(columnIndex) {
    return this.columnOffsets[columnIndex] ?? 0;
  }
  getRowHeightByIndex(rowIndex) {
    return this.rowHeights[rowIndex] ?? this.theme.row.height;
  }
  getRowHeightBounds() {
    return {
      min: this.theme.row.minHeight,
      max: this.theme.row.maxHeight
    };
  }
  getColumnWidthByIndex(columnIndex) {
    return this.layoutInfo.columnWidths[columnIndex] ?? DEFAULT_COLUMN_WIDTH;
  }
  getCellPosition(rowIndex, columnIndex) {
    const column = this.leafColumns[columnIndex];
    let x = this.getColumnOffset(columnIndex);
    const y = rowIndex === -1 ? 0 : this.getRowOffset(rowIndex);
    const width = this.getColumnWidthByIndex(columnIndex);
    const height = rowIndex === -1 ? this.layoutInfo.headerHeight : this.getRowHeightByIndex(rowIndex);
    if (column?.fixed === "left") {
      let currentX = 0;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const col = this.leafColumns[i];
        if (col?.fixed === "left") {
          if (i === columnIndex) {
            x = currentX;
            break;
          }
          currentX += this.layoutInfo.columnWidths[i];
        }
      }
    }
    if (column?.fixed === "right") {
      const rightFixedWidth = this.getRightFixedWidth();
      let currentX = this.viewportWidth - rightFixedWidth;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const col = this.leafColumns[i];
        if (col?.fixed === "right") {
          if (i === columnIndex) {
            x = currentX;
            break;
          }
          currentX += this.layoutInfo.columnWidths[i];
        }
      }
    }
    return { x, y, width, height };
  }
  getCellAtPosition(x, y, scrollTop) {
    const headerHeight = this.layoutInfo.headerHeight;
    const actualScrollTop = scrollTop ?? this.scrollTop;
    const viewportY = y - actualScrollTop;
    if (viewportY < headerHeight) {
      const columnIndex2 = this.findColumnIndexAtPosition(x);
      if (columnIndex2 < 0) return null;
      return { rowIndex: -1, columnIndex: columnIndex2 };
    }
    const rowIndex = this.findRowIndexAtPosition(y);
    const columnIndex = this.findColumnIndexAtPosition(x);
    if (rowIndex < 0 || rowIndex >= this.rowHeights.length) {
      return null;
    }
    if (columnIndex < 0 || columnIndex >= this.layoutInfo.columnWidths.length) {
      return null;
    }
    const merge = this.getCellMerge(rowIndex, columnIndex);
    if (merge) {
      return { rowIndex: merge.rowIndex, columnIndex: merge.columnIndex };
    }
    return { rowIndex, columnIndex };
  }
  getRowHitAtViewportPosition(viewportX, viewportY, scrollTop) {
    const columnIndex = (() => {
      const regionDetail = this.getMouseRegion(viewportX);
      if (regionDetail === "left-fixed") {
        return this.findColumnIndexInLeftFixed(viewportX);
      }
      if (regionDetail === "right-fixed") {
        return this.findColumnIndexInRightFixed(viewportX);
      }
      return this.findColumnIndexInScrollable(viewportX + this.scrollLeft);
    })();
    if (columnIndex < 0 || columnIndex >= this.layoutInfo.columnWidths.length) {
      return null;
    }
    if (viewportY < this.layoutInfo.headerHeight) {
      return null;
    }
    if (this.summaryTopHeight > 0 && viewportY < this.rowBands.summaryTop.y + this.summaryTopHeight) {
      const row2 = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryTop.rows,
        viewportY - this.rowBands.summaryTop.y
      );
      return row2 ? { row: row2, band: "summary-top", columnIndex } : null;
    }
    if (viewportY < this.rowBands.pinnedTop.y + this.pinnedTopHeight) {
      const row2 = this.findRowInBandAtOffset(
        this.rowBands.pinnedTop.rows,
        viewportY - this.rowBands.pinnedTop.y
      );
      return row2 ? { row: row2, band: "pinned-top", columnIndex } : null;
    }
    if (this.summaryBottomHeight > 0 && viewportY >= this.rowBands.summaryBottom.y && viewportY < this.rowBands.summaryBottom.y + this.summaryBottomHeight) {
      const row2 = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryBottom.rows,
        viewportY - this.rowBands.summaryBottom.y
      );
      return row2 ? { row: row2, band: "summary-bottom", columnIndex } : null;
    }
    if (this.pinnedBottomHeight > 0 && viewportY >= this.rowBands.pinnedBottom.y && viewportY < this.rowBands.pinnedBottom.y + this.pinnedBottomHeight) {
      const row2 = this.findRowInBandAtOffset(
        this.rowBands.pinnedBottom.rows,
        viewportY - this.rowBands.pinnedBottom.y
      );
      return row2 ? { row: row2, band: "pinned-bottom", columnIndex } : null;
    }
    const bodyOffset = scrollTop + (viewportY - this.rowBands.body.y);
    const bodyRowIndex = this.findBodyRowIndexAtOffset(bodyOffset);
    const row = this.rowBands.body.rows[bodyRowIndex];
    return row ? { row, band: "body", columnIndex } : null;
  }
  getCellAtViewportPosition(viewportX, viewportY, scrollTop = this.scrollTop) {
    if (viewportY < this.layoutInfo.headerHeight) {
      const columnIndex = this.findColumnIndexAtPosition(viewportX + this.scrollLeft);
      if (columnIndex < 0) return null;
      return { rowIndex: -1, columnIndex };
    }
    const hit = this.getRowHitAtViewportPosition(viewportX, viewportY, scrollTop);
    if (!hit) {
      return null;
    }
    if (hit.band === "summary-top" || hit.band === "summary-bottom") {
      return null;
    }
    const rowIndex = this.getRowIndexByRef(hit.row);
    if (rowIndex < 0) {
      return null;
    }
    const merge = this.getCellMerge(rowIndex, hit.columnIndex);
    if (merge) {
      return { rowIndex: merge.rowIndex, columnIndex: merge.columnIndex };
    }
    return { rowIndex, columnIndex: hit.columnIndex };
  }
  findRowIndexAtPosition(y) {
    let left = 0;
    let right = this.rowOffsets.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const offset = this.rowOffsets[mid];
      const height = this.rowHeights[mid];
      if (y >= offset && y < offset + height) {
        return mid;
      }
      if (y < offset) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return -1;
  }
  findColumnIndexAtPosition(x) {
    const viewportX = x - this.scrollLeft;
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();
    if (leftFixedWidth > 0 && viewportX < leftFixedWidth) {
      let currentX = 0;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const column = this.leafColumns[i];
        if (column?.fixed === "left") {
          const width = this.layoutInfo.columnWidths[i];
          if (viewportX >= currentX && viewportX < currentX + width) {
            return i;
          }
          currentX += width;
        }
      }
      return -1;
    }
    if (rightFixedWidth > 0) {
      const rightFixedStartX = this.viewportWidth - rightFixedWidth;
      if (viewportX >= rightFixedStartX && viewportX < this.viewportWidth) {
        let currentX = rightFixedStartX;
        for (let i = 0; i < this.leafColumns.length; i++) {
          const column = this.leafColumns[i];
          if (column?.fixed === "right") {
            const width = this.layoutInfo.columnWidths[i];
            if (viewportX >= currentX && viewportX < currentX + width) {
              return i;
            }
            currentX += width;
          }
        }
        return -1;
      }
    }
    for (let i = 0; i < this.columnOffsets.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }
      const offset = this.columnOffsets[i];
      const width = this.layoutInfo.columnWidths[i];
      if (x >= offset && x < offset + width) {
        return i;
      }
    }
    return -1;
  }
  getRightFixedWidth() {
    let width = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "right") {
        width += this.layoutInfo.columnWidths[i] ?? 0;
      }
    }
    return width;
  }
  getLeftFixedWidth() {
    let width = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left") {
        width += this.layoutInfo.columnWidths[i] ?? 0;
      }
    }
    return width;
  }
  getMaxScrollLeft() {
    return Math.max(0, this.layoutInfo.totalWidth - this.viewportWidth);
  }
  getMaxScrollTop() {
    return Math.max(0, this.rowBands.body.height - this.bodyViewportHeight);
  }
  getViewportWidth() {
    return this.viewportWidth;
  }
  getScrollOffsetForRow(rowIndex) {
    const rowOffset = this.getRowOffset(rowIndex);
    const rowHeight = this.getRowHeightByIndex(rowIndex);
    if (rowOffset < this.scrollTop) {
      return rowOffset;
    }
    if (rowOffset + rowHeight > this.scrollTop + this.viewportHeight) {
      return rowOffset + rowHeight - this.viewportHeight;
    }
    return this.scrollTop;
  }
  getScrollOffsetForColumn(columnIndex) {
    const columnOffset = this.getColumnOffset(columnIndex);
    const columnWidth = this.getColumnWidthByIndex(columnIndex);
    if (columnOffset < this.scrollLeft) {
      return columnOffset;
    }
    if (columnOffset + columnWidth > this.scrollLeft + this.viewportWidth) {
      return columnOffset + columnWidth - this.viewportWidth;
    }
    return this.scrollLeft;
  }
  getFixedColumnsInfo(columns) {
    const leftFixed = [];
    const rightFixed = [];
    const center = [];
    for (const column of this.leafColumns.length > 0 ? this.leafColumns : columns) {
      if (column.fixed === "left") {
        leftFixed.push(column);
      } else if (column.fixed === "right") {
        rightFixed.push(column);
      } else {
        center.push(column);
      }
    }
    const leftWidth = leftFixed.reduce((sum, col) => sum + this.getColumnWidth(col), 0);
    const rightWidth = rightFixed.reduce((sum, col) => sum + this.getColumnWidth(col), 0);
    const centerWidth = center.reduce((sum, col) => sum + this.getColumnWidth(col), 0);
    return {
      leftFixed: { columns: leftFixed, width: leftWidth },
      rightFixed: { columns: rightFixed, width: rightWidth },
      center: { columns: center, width: centerWidth }
    };
  }
  isColumnResizable(_columnIndex) {
    return true;
  }
  getResizeHandlePosition(columnIndex) {
    let position = 0;
    for (let i = 0; i <= columnIndex; i++) {
      position += this.layoutInfo.columnWidths[i] ?? 0;
    }
    return position;
  }
  isResizeHandleAtPosition(x, y) {
    const tolerance = 5;
    if (y > this.layoutInfo.headerHeight) {
      return -1;
    }
    const viewportX = x - this.scrollLeft;
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();
    if (leftFixedWidth > 0 && viewportX < leftFixedWidth) {
      let currentX = 0;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const column = this.leafColumns[i];
        if (column?.fixed === "left") {
          currentX += this.layoutInfo.columnWidths[i];
          if (Math.abs(viewportX - currentX) <= tolerance) {
            return i;
          }
        } else {
          break;
        }
      }
      return -1;
    }
    if (rightFixedWidth > 0) {
      const rightFixedStartX = this.viewportWidth - rightFixedWidth;
      if (viewportX >= rightFixedStartX) {
        let currentX = this.viewportWidth;
        if (Math.abs(viewportX - rightFixedStartX) <= tolerance) {
          for (let i = 0; i < this.leafColumns.length; i++) {
            const column = this.leafColumns[i];
            if (column?.fixed === "right") {
              return i;
            }
          }
        }
        for (let i = this.leafColumns.length - 1; i >= 0; i--) {
          const column = this.leafColumns[i];
          if (column?.fixed === "right") {
            currentX -= this.layoutInfo.columnWidths[i];
            if (Math.abs(viewportX - currentX) <= tolerance) {
              return i;
            }
          } else {
            break;
          }
        }
        return -1;
      }
    }
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }
      const handleX = this.getResizeHandlePosition(i);
      if (Math.abs(x - handleX) <= tolerance) {
        return i;
      }
    }
    return -1;
  }
  getVisibleCenterColumnIndices() {
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();
    const visibleStart = this.scrollLeft + leftFixedWidth;
    const visibleEnd = this.scrollLeft + this.viewportWidth - rightFixedWidth;
    const indices = [];
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }
      const colStart = this.columnOffsets[i] ?? 0;
      const colEnd = colStart + (this.layoutInfo.columnWidths[i] ?? 0);
      if (colEnd >= visibleStart && colStart <= visibleEnd) {
        indices.push(i);
      }
    }
    return indices;
  }
  getVisibleHeaderCells() {
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();
    const visibleStart = this.scrollLeft + leftFixedWidth;
    const visibleEnd = this.scrollLeft + this.viewportWidth - rightFixedWidth;
    const visibleCells = [];
    const addedKeys = /* @__PURE__ */ new Set();
    const parentKeys = /* @__PURE__ */ new Set();
    for (const headerCell of this.headerCells) {
      const colStart = headerCell.x;
      const colEnd = headerCell.x + headerCell.width;
      const isFixedLeft = headerCell.column.fixed === "left";
      const isFixedRight = headerCell.column.fixed === "right";
      const columnKey = headerCell.column.key;
      if (isFixedLeft || isFixedRight) {
        if (!addedKeys.has(columnKey)) {
          visibleCells.push(headerCell);
          addedKeys.add(columnKey);
          let parentKey = headerCell.column.parentKey;
          while (parentKey) {
            parentKeys.add(parentKey);
            const parentColumn = this.getColumnByKey(parentKey);
            parentKey = parentColumn?.parentKey;
          }
        }
        continue;
      }
      if (colEnd >= visibleStart && colStart <= visibleEnd) {
        if (!addedKeys.has(columnKey)) {
          visibleCells.push(headerCell);
          addedKeys.add(columnKey);
          let parentKey = headerCell.column.parentKey;
          while (parentKey) {
            parentKeys.add(parentKey);
            const parentColumn = this.getColumnByKey(parentKey);
            parentKey = parentColumn?.parentKey;
          }
        }
      }
    }
    for (const headerCell of this.headerCells) {
      const columnKey = headerCell.column.key;
      if (parentKeys.has(headerCell.column.key) && !addedKeys.has(columnKey)) {
        visibleCells.push(headerCell);
        addedKeys.add(columnKey);
      }
    }
    return visibleCells;
  }
  updateTheme(theme) {
    this.theme = theme;
    this.layoutInfo.headerHeight = theme.row.headerHeight;
    this.layoutInfo.rowHeight = theme.row.height;
    this.rowHeightsDirty = true;
  }
  reset() {
    this.columnWidths.clear();
    this.rowHeights = [];
    this.rowOffsets = [];
    this.columnOffsets = [];
    this.columns = [];
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.headerCells = [];
    this.leafColumns = [];
    this.headerDepth = 1;
    this.cellMergeMap.clear();
    this.cellMergeByRow.clear();
    this.mergedCellSet.clear();
    this.cellToMergeMap.clear();
    this.rowHeightOverrides = /* @__PURE__ */ new WeakMap();
    this.hasRowHeightOverrides = false;
    this.rowHeightFn = void 0;
    this.cachedRows = [];
    this.rowHeightsDirty = true;
    this.layoutInfo = this.createEmptyLayoutInfo();
    this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
  }
  // ==================== Hit Test Methods ====================
  /**
   * 获取鼠标所在的区域类型
   */
  getMouseRegion(viewportX) {
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();
    if (leftFixedWidth > 0 && viewportX < leftFixedWidth) {
      return "left-fixed";
    }
    if (rightFixedWidth > 0 && viewportX >= this.viewportWidth - rightFixedWidth) {
      return "right-fixed";
    }
    return "scrollable";
  }
  /**
   * 统一命中测试入口
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param scrollbarBounds 可选的滚动条边界（由 Renderer 计算，确保与渲染一致）
   */
  hitTest(viewportX, viewportY, scrollbarBounds) {
    const scrollbarResult = this.hitTestScrollbar(viewportX, viewportY, scrollbarBounds);
    if (scrollbarResult) return scrollbarResult;
    if (viewportY < this.layoutInfo.headerHeight) {
      return this.hitTestHeader(viewportX, viewportY);
    }
    return this.hitTestCell(viewportX, viewportY);
  }
  /**
   * 检测滚动条区域
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param externalBounds 可选的外部滚动条边界（优先使用）
   */
  hitTestScrollbar(viewportX, viewportY, externalBounds) {
    if (externalBounds) {
      if (externalBounds.vertical) {
        const { x, y, width, height } = externalBounds.vertical;
        if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + height) {
          return {
            region: "scrollbar-vertical",
            scrollbar: {
              type: "vertical",
              bounds: { x, y, width, height }
            },
            viewport: { x: viewportX, y: viewportY }
          };
        }
      }
      if (externalBounds.horizontal) {
        const { x, y, width, height } = externalBounds.horizontal;
        if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + height) {
          return {
            region: "scrollbar-horizontal",
            scrollbar: {
              type: "horizontal",
              bounds: { x, y, width, height }
            },
            viewport: { x: viewportX, y: viewportY }
          };
        }
      }
      return null;
    }
    const layoutInfo = this.layoutInfo;
    const maxScrollTop = this.getMaxScrollTop();
    const maxScrollLeft = this.getMaxScrollLeft();
    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;
    const headerHeight = layoutInfo.headerHeight;
    if (maxScrollTop > 0) {
      const trackHeight = this.viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        this.viewportHeight / layoutInfo.totalHeight * trackHeight
      );
      const thumbY = headerHeight + this.scrollTop / maxScrollTop * (trackHeight - thumbHeight);
      const thumbX = this.viewportWidth - scrollbarWidth;
      const thumbWidth = scrollbarWidth - 2;
      if (viewportX >= thumbX && viewportX <= thumbX + thumbWidth && viewportY >= thumbY && viewportY <= thumbY + thumbHeight) {
        return {
          region: "scrollbar-vertical",
          scrollbar: {
            type: "vertical",
            bounds: { x: thumbX, y: thumbY, width: thumbWidth, height: thumbHeight }
          },
          viewport: { x: viewportX, y: viewportY }
        };
      }
    }
    if (maxScrollLeft > 0) {
      const trackWidth = this.viewportWidth - (maxScrollTop > 0 ? scrollbarWidth : 0);
      const thumbWidth = Math.max(
        scrollbarMinSize,
        this.viewportWidth / layoutInfo.totalWidth * trackWidth
      );
      const thumbX = this.scrollLeft / maxScrollLeft * (trackWidth - thumbWidth);
      const thumbY = this.viewportHeight - scrollbarWidth;
      const thumbHeight = scrollbarWidth - 2;
      if (viewportX >= thumbX && viewportX <= thumbX + thumbWidth && viewportY >= thumbY && viewportY <= thumbY + thumbHeight) {
        return {
          region: "scrollbar-horizontal",
          scrollbar: {
            type: "horizontal",
            bounds: { x: thumbX, y: thumbY, width: thumbWidth, height: thumbHeight }
          },
          viewport: { x: viewportX, y: viewportY }
        };
      }
    }
    return null;
  }
  /**
   * 检测列头区域
   */
  hitTestHeader(viewportX, viewportY) {
    const regionDetail = this.getMouseRegion(viewportX);
    const resizeIndex = this.hitTestResizeHandle(viewportX, regionDetail);
    if (resizeIndex >= 0) {
      return {
        region: "header",
        regionDetail,
        isResizeHandle: true,
        resizeColumnIndex: resizeIndex,
        viewport: { x: viewportX, y: viewportY }
      };
    }
    const headerCell = this.getHeaderCellAtPosition(viewportX, viewportY);
    return {
      region: "header",
      regionDetail,
      headerCell: headerCell ?? void 0,
      viewport: { x: viewportX, y: viewportY }
    };
  }
  /**
   * 检测 resize handle（按区域检测，避免穿透）
   */
  hitTestResizeHandle(viewportX, region) {
    const tolerance = 5;
    if (region === "left-fixed") {
      return this.hitTestLeftFixedResizeHandle(viewportX, tolerance);
    }
    if (region === "right-fixed") {
      return this.hitTestRightFixedResizeHandle(viewportX, tolerance);
    }
    return this.hitTestScrollableResizeHandle(viewportX, tolerance);
  }
  /**
   * 检测左侧固定列的 resize handle
   */
  hitTestLeftFixedResizeHandle(viewportX, tolerance) {
    let currentX = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left") {
        currentX += this.layoutInfo.columnWidths[i];
        if (Math.abs(viewportX - currentX) <= tolerance) {
          return i;
        }
      } else {
        break;
      }
    }
    return -1;
  }
  /**
   * 检测右侧固定列的 resize handle
   */
  hitTestRightFixedResizeHandle(viewportX, tolerance) {
    const rightFixedWidth = this.getRightFixedWidth();
    const rightFixedStartX = this.viewportWidth - rightFixedWidth;
    if (Math.abs(viewportX - rightFixedStartX) <= tolerance) {
      for (let i = 0; i < this.leafColumns.length; i++) {
        const column = this.leafColumns[i];
        if (column?.fixed === "right") {
          return i;
        }
      }
    }
    let currentX = this.viewportWidth;
    for (let i = this.leafColumns.length - 1; i >= 0; i--) {
      const column = this.leafColumns[i];
      if (column?.fixed === "right") {
        currentX -= this.layoutInfo.columnWidths[i];
        if (Math.abs(viewportX - currentX) <= tolerance) {
          return i;
        }
      } else {
        break;
      }
    }
    return -1;
  }
  /**
   * 检测滚动区域的 resize handle
   */
  hitTestScrollableResizeHandle(viewportX, tolerance) {
    const x = viewportX + this.scrollLeft;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }
      const offset = this.columnOffsets[i];
      const width = this.layoutInfo.columnWidths[i];
      if (offset !== void 0 && Math.abs(x - (offset + width)) <= tolerance) {
        return i;
      }
    }
    return -1;
  }
  /**
   * 检测单元格区域
   */
  hitTestCell(viewportX, viewportY) {
    const regionDetail = this.getMouseRegion(viewportX);
    const rowResizeIndex = this.hitTestRowResizeHandleAtViewportPosition(viewportY);
    let columnIndex;
    if (regionDetail === "left-fixed") {
      columnIndex = this.findColumnIndexInLeftFixed(viewportX);
    } else if (regionDetail === "right-fixed") {
      columnIndex = this.findColumnIndexInRightFixed(viewportX);
    } else {
      const x = viewportX + this.scrollLeft;
      columnIndex = this.findColumnIndexInScrollable(x);
    }
    if (columnIndex < 0 || columnIndex >= this.layoutInfo.columnWidths.length) {
      return { region: "outside", regionDetail, viewport: { x: viewportX, y: viewportY } };
    }
    const rowHit = this.getRowHitAtViewportPosition(viewportX, viewportY, this.scrollTop);
    if (rowHit?.band === "summary-top" || rowHit?.band === "summary-bottom") {
      return {
        region: "cell",
        regionDetail,
        rowHit,
        viewport: { x: viewportX, y: viewportY }
      };
    }
    const cell = this.getCellAtViewportPosition(viewportX, viewportY, this.scrollTop);
    if (!cell && rowResizeIndex < 0) {
      return { region: "outside", regionDetail, viewport: { x: viewportX, y: viewportY } };
    }
    const resolvedRowIndex = rowResizeIndex >= 0 ? rowResizeIndex : cell?.rowIndex ?? -1;
    if (resolvedRowIndex < 0 || resolvedRowIndex >= this.rowHeights.length) {
      return { region: "outside", regionDetail, viewport: { x: viewportX, y: viewportY } };
    }
    const merge = this.getCellMerge(resolvedRowIndex, columnIndex);
    if (merge) {
      return {
        region: "cell",
        regionDetail,
        cell: { rowIndex: merge.rowIndex, columnIndex: merge.columnIndex },
        rowHit: rowHit ?? void 0,
        isRowResizeHandle: rowResizeIndex >= 0,
        resizeRowIndex: rowResizeIndex >= 0 ? rowResizeIndex : void 0,
        viewport: { x: viewportX, y: viewportY }
      };
    }
    return {
      region: "cell",
      regionDetail,
      cell: { rowIndex: resolvedRowIndex, columnIndex },
      rowHit: rowHit ?? void 0,
      isRowResizeHandle: rowResizeIndex >= 0,
      resizeRowIndex: rowResizeIndex >= 0 ? rowResizeIndex : void 0,
      viewport: { x: viewportX, y: viewportY }
    };
  }
  hitTestRowResizeHandleAtViewportPosition(viewportY) {
    const tolerance = 4;
    const pinnedTopIndex = this.findResizeHandleInPinnedRows(
      this.rowBands.pinnedTop.rows,
      this.rowBands.pinnedTop.y,
      viewportY,
      tolerance
    );
    if (pinnedTopIndex >= 0) {
      return pinnedTopIndex;
    }
    const bodyIndex = this.findBodyResizeHandleAtViewportY(viewportY, tolerance);
    if (bodyIndex >= 0) {
      return bodyIndex;
    }
    const pinnedBottomIndex = this.findResizeHandleInPinnedRows(
      this.rowBands.pinnedBottom.rows,
      this.rowBands.pinnedBottom.y,
      viewportY,
      tolerance
    );
    if (pinnedBottomIndex >= 0) {
      return pinnedBottomIndex;
    }
    return -1;
  }
  findBodyResizeHandleAtViewportY(viewportY, tolerance) {
    if (this.rowBands.body.rows.length === 0) {
      return -1;
    }
    const bodyTop = this.rowBands.body.y;
    const bodyBottom = bodyTop + this.bodyViewportHeight;
    if (viewportY < bodyTop - tolerance || viewportY > bodyBottom + tolerance) {
      return -1;
    }
    const bodyOffset = this.scrollTop + (viewportY - bodyTop);
    const candidateBodyIndex = this.findBodyRowIndexAtOffset(Math.max(0, bodyOffset - tolerance));
    const candidateIndexes = [candidateBodyIndex, candidateBodyIndex + 1];
    for (const bodyIndex of candidateIndexes) {
      const row = this.rowBands.body.rows[bodyIndex];
      if (!row) continue;
      const bottom = bodyTop + (this.bodyRowOffsets[bodyIndex] ?? 0) + this.getResolvedRowHeight(row) - this.scrollTop;
      if (Math.abs(viewportY - bottom) <= tolerance) {
        return this.getRowIndexByRef(row);
      }
    }
    return -1;
  }
  findResizeHandleInPinnedRows(rows, bandY, viewportY, tolerance) {
    for (const row of rows) {
      const bottom = bandY + (this.getRowBandOffsetByRef(row) ?? 0) + this.getResolvedRowHeight(row);
      if (Math.abs(viewportY - bottom) <= tolerance) {
        return this.getRowIndexByRef(row);
      }
    }
    return -1;
  }
  /**
   * 在左侧固定列中查找列索引
   */
  findColumnIndexInLeftFixed(viewportX) {
    let currentX = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left") {
        const width = this.layoutInfo.columnWidths[i];
        if (viewportX >= currentX && viewportX < currentX + width) {
          return i;
        }
        currentX += width;
      }
    }
    return -1;
  }
  /**
   * 在右侧固定列中查找列索引
   */
  findColumnIndexInRightFixed(viewportX) {
    const rightFixedWidth = this.getRightFixedWidth();
    const rightFixedStartX = this.viewportWidth - rightFixedWidth;
    let currentX = rightFixedStartX;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "right") {
        const width = this.layoutInfo.columnWidths[i];
        if (viewportX >= currentX && viewportX < currentX + width) {
          return i;
        }
        currentX += width;
      }
    }
    return -1;
  }
  /**
   * 在滚动区域中查找列索引
   */
  findColumnIndexInScrollable(x) {
    for (let i = 0; i < this.columnOffsets.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }
      const offset = this.columnOffsets[i];
      const width = this.layoutInfo.columnWidths[i];
      if (offset !== void 0 && x >= offset && x < offset + width) {
        return i;
      }
    }
    return -1;
  }
}
class ImageLoadQueue {
  maxConcurrent;
  maxCacheSize;
  /** 已加载缓存（包含尺寸信息） */
  cache = /* @__PURE__ */ new Map();
  /** 加载失败 */
  failed = /* @__PURE__ */ new Set();
  /** 正在加载中 */
  loading = /* @__PURE__ */ new Map();
  /** 等待加载队列 */
  pendingQueue = /* @__PURE__ */ new Map();
  /** 当前帧收集的请求 */
  frameRequests = /* @__PURE__ */ new Map();
  /** 是否已销毁 */
  destroyed = false;
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 6;
    this.maxCacheSize = options.maxCacheSize ?? 200;
  }
  /**
   * 请求加载图片
   * @param src 图片 URL
   * @param targetSize 需要的渲染尺寸（像素），默认 64
   * @param callback 加载完成回调
   */
  request(src, targetSize = 64, callback) {
    if (this.destroyed) return;
    const cached = this.cache.get(src);
    if (cached) {
      if (cached.size >= targetSize) {
        callback?.(true, cached.image);
        return;
      }
      if (cached.originalImage) {
        const newImage = this.scaleImage(cached.originalImage, targetSize);
        cached.image = newImage;
        cached.size = targetSize;
        callback?.(true, newImage);
        return;
      }
    }
    if (this.failed.has(src)) {
      callback?.(false, null);
      return;
    }
    const loadingItem = this.loading.get(src);
    if (loadingItem) {
      loadingItem.maxSize = Math.max(loadingItem.maxSize, targetSize);
      if (callback) loadingItem.callbacks.push(callback);
      return;
    }
    const pendingItem = this.pendingQueue.get(src);
    if (pendingItem) {
      pendingItem.maxSize = Math.max(pendingItem.maxSize, targetSize);
      if (callback) pendingItem.callbacks.push(callback);
      return;
    }
    const item = {
      src,
      callbacks: callback ? [callback] : [],
      maxSize: targetSize
    };
    if (this.loading.size < this.maxConcurrent) {
      this.startLoad(src, item);
      return;
    }
    this.pendingQueue.set(src, item);
  }
  /**
   * 提交当前帧的请求
   * 取消不可见的请求后调用，启动队列处理
   */
  commitFrame() {
    for (const [src, item] of this.frameRequests) {
      const existing = this.pendingQueue.get(src);
      if (existing) {
        existing.maxSize = Math.max(existing.maxSize, item.maxSize);
        existing.callbacks.push(...item.callbacks);
      } else {
        this.pendingQueue.set(src, item);
      }
    }
    this.frameRequests.clear();
    this.processQueue();
  }
  /**
   * 取消指定图片的加载请求
   */
  cancel(src) {
    this.pendingQueue.delete(src);
    this.frameRequests.delete(src);
  }
  /**
   * 批量取消不在可见区域的请求
   */
  cancelInvisible(visibleUrls) {
    for (const src of this.pendingQueue.keys()) {
      if (!visibleUrls.has(src)) {
        this.pendingQueue.delete(src);
      }
    }
    for (const src of this.frameRequests.keys()) {
      if (!visibleUrls.has(src)) {
        this.frameRequests.delete(src);
      }
    }
  }
  /**
   * 处理加载队列
   */
  processQueue() {
    if (this.destroyed) return;
    while (this.loading.size < this.maxConcurrent && this.pendingQueue.size > 0) {
      const [src, item] = this.pendingQueue.entries().next().value;
      this.pendingQueue.delete(src);
      this.startLoad(src, item);
    }
  }
  /**
   * 开始加载图片
   */
  startLoad(src, item) {
    if (this.destroyed) return;
    this.loading.set(src, item);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (this.destroyed) return;
      const scaledImage = this.scaleImage(img, item.maxSize);
      this.addToCache(src, {
        image: scaledImage,
        size: item.maxSize,
        originalImage: img
      });
      this.loading.delete(src);
      for (const cb of item.callbacks) {
        cb(true, scaledImage);
      }
      this.processQueue();
    };
    img.onerror = () => {
      if (this.destroyed) return;
      this.loading.delete(src);
      this.failed.add(src);
      for (const cb of item.callbacks) {
        cb(false, null);
      }
      this.processQueue();
    };
    img.src = src;
  }
  /**
   * 缩放图片
   */
  scaleImage(img, targetSize) {
    if (img.width <= targetSize && img.height <= targetSize) {
      return img;
    }
    const ratio = Math.min(targetSize / img.width, targetSize / img.height);
    const scaledWidth = Math.round(img.width * ratio);
    const scaledHeight = Math.round(img.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
    return canvas;
  }
  /**
   * 获取缓存的图片（如果尺寸不够会返回 null）
   */
  get(src, minSize) {
    const cached = this.cache.get(src);
    if (!cached) return null;
    if (minSize && cached.size < minSize) return null;
    return cached.image;
  }
  /**
   * 检查是否已缓存（且尺寸满足需求）
   */
  has(src, minSize) {
    const cached = this.cache.get(src);
    if (!cached) return false;
    if (minSize && cached.size < minSize) return false;
    return true;
  }
  /**
   * 检查是否加载失败
   */
  isFailed(src) {
    return this.failed.has(src);
  }
  /**
   * 检查是否正在加载（包括等待中）
   */
  isLoading(src) {
    return this.loading.has(src) || this.pendingQueue.has(src) || this.frameRequests.has(src);
  }
  /**
   * 重试失败的图片
   */
  retry(src) {
    this.failed.delete(src);
  }
  /**
   * 添加到缓存（LRU 淘汰）
   */
  addToCache(src, entry) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(src, entry);
  }
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      pending: this.pendingQueue.size,
      loading: this.loading.size,
      cached: this.cache.size,
      failed: this.failed.size
    };
  }
  /**
   * 清除所有缓存和队列
   */
  clear() {
    this.pendingQueue.clear();
    this.frameRequests.clear();
    this.loading.clear();
    this.cache.clear();
    this.failed.clear();
  }
  /**
   * 销毁
   */
  destroy() {
    this.destroyed = true;
    this.clear();
  }
}
const zhCN = {
  emptyText: "暂无数据",
  loadingText: "加载中...",
  contextMenu: {
    pinTop: "固定到顶部",
    pinBottom: "固定到底部",
    unpin: "取消固定",
    addRowAbove: "上方添加行",
    addRowBelow: "下方添加行",
    deleteRow: "删除行",
    hideColumn: "隐藏列",
    showColumn: "显示列"
  },
  filter: {
    searchPlaceholder: "输入关键字筛选...",
    selectSearchPlaceholder: "搜索...",
    minPlaceholder: "最小值",
    maxPlaceholder: "最大值",
    startDatePlaceholder: "开始日期",
    endDatePlaceholder: "结束日期",
    reset: "重置",
    confirm: "确定",
    noData: "暂无数据",
    loading: "加载中...",
    all: "全部",
    yes: "是",
    no: "否",
    selected: "已选",
    unselected: "未选"
  },
  cell: {
    selectPlaceholder: "请选择",
    datePlaceholder: "选择日期",
    tagPlaceholder: "请选择标签",
    numberPlaceholder: "—",
    buttonText: "Button"
  },
  image: {
    uploadIdle: "点击上传或拖拽图片到此处",
    uploadDragging: "释放以上传图片",
    uploading: "上传中..."
  },
  calendar: {
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    yearMonthFormat: "{year}年 {month}"
  }
};
const enUS = {
  emptyText: "No data",
  loadingText: "Loading...",
  contextMenu: {
    pinTop: "Pin to top",
    pinBottom: "Pin to bottom",
    unpin: "Unpin",
    addRowAbove: "Insert row above",
    addRowBelow: "Insert row below",
    deleteRow: "Delete row",
    hideColumn: "Hide column",
    showColumn: "Show column"
  },
  filter: {
    searchPlaceholder: "Enter keywords...",
    selectSearchPlaceholder: "Search...",
    minPlaceholder: "Min",
    maxPlaceholder: "Max",
    startDatePlaceholder: "Start date",
    endDatePlaceholder: "End date",
    reset: "Reset",
    confirm: "OK",
    noData: "No data",
    loading: "Loading...",
    all: "All",
    yes: "Yes",
    no: "No",
    selected: "Checked",
    unselected: "Unchecked"
  },
  cell: {
    selectPlaceholder: "Select",
    datePlaceholder: "Select date",
    tagPlaceholder: "Select tags",
    numberPlaceholder: "—",
    buttonText: "Button"
  },
  image: {
    uploadIdle: "Click or drag images here",
    uploadDragging: "Release to upload",
    uploading: "Uploading..."
  },
  calendar: {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    yearMonthFormat: "{month} {year}"
  }
};
const PRESETS = {
  "zh-CN": zhCN,
  "en-US": enUS
};
function isLocaleOptions(config) {
  return typeof config === "object" && config !== null && ("preset" in config || "messages" in config);
}
function cloneValue(value) {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value && typeof value === "object") {
    const cloned = {};
    for (const [key, childValue] of Object.entries(value)) {
      cloned[key] = cloneValue(childValue);
    }
    return cloned;
  }
  return value;
}
function deepMerge(base, override) {
  if (!override) {
    return cloneValue(base);
  }
  const result = cloneValue(base);
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else if (value !== void 0) {
      result[key] = value;
    }
  }
  return result;
}
function resolveLocale(config) {
  if (!config) {
    return deepMerge(zhCN);
  }
  if (typeof config === "string") {
    return deepMerge(PRESETS[config] ?? zhCN);
  }
  if (isLocaleOptions(config)) {
    const preset = config.preset ?? "zh-CN";
    return deepMerge(PRESETS[preset] ?? zhCN, config.messages);
  }
  return deepMerge(zhCN, config);
}
class DropdownRenderer {
  ctx;
  theme;
  locale;
  measureTextWidth;
  constructor(ctx, theme, measureTextWidth, locale = zhCN) {
    this.ctx = ctx;
    this.theme = theme;
    this.measureTextWidth = measureTextWidth;
    this.locale = locale;
  }
  setContext(ctx) {
    this.ctx = ctx;
  }
  setTheme(theme) {
    this.theme = theme;
  }
  setLocale(locale) {
    this.locale = locale;
  }
  renderButtonsDropdown(dropdown) {
    const itemHeight = 32;
    const minWidth = 100;
    const padding = 8;
    let maxWidth = minWidth;
    for (const btn of dropdown.buttons) {
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.measureTextWidth(text);
      maxWidth = Math.max(maxWidth, textWidth + padding * 2 + 16);
    }
    const dropdownHeight = dropdown.buttons.length * itemHeight;
    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(dropdown.x, dropdown.y, maxWidth, dropdownHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();
    for (let i = 0; i < dropdown.buttons.length; i++) {
      const btn = dropdown.buttons[i];
      const itemY = dropdown.y + i * itemHeight;
      const isHovered = i === dropdown.hoveredIndex;
      if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
        this.ctx.fillRect(dropdown.x, itemY, maxWidth, itemHeight);
      }
      let textColor;
      switch (btn.variant) {
        case "primary":
          textColor = this.theme.colors.button.primaryBg;
          break;
        case "danger":
          textColor = this.theme.colors.button.dangerBg;
          break;
        case "warning":
          textColor = this.theme.colors.button.warningBg;
          break;
        case "link":
          textColor = this.theme.colors.button.linkText;
          break;
        default:
          textColor = this.theme.colors.cellText;
      }
      this.ctx.fillStyle = textColor;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        btn.text ?? this.locale.cell.buttonText,
        dropdown.x + padding,
        itemY + itemHeight / 2
      );
    }
    this.ctx.restore();
  }
  renderDropdown(dropdown) {
    if (dropdown.type === "tags" && dropdown.tagsConfig) {
      this.renderTagsDropdown(dropdown);
      return;
    }
    const { config, x, y, width, scrollTop, hoveredIndex } = dropdown;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    this.ctx.save();
    this.drawDropdownPanel(x, y, width, dropdownHeight);
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, dropdownHeight);
    this.ctx.clip();
    const selectedValues = config.multiple && Array.isArray(config.value) ? config.value : config.value !== void 0 ? [config.value] : [];
    for (let i = 0; i < config.options.length; i++) {
      const option = config.options[i];
      const itemY = y + i * itemHeight - scrollTop;
      if (itemY + itemHeight < y || itemY > y + dropdownHeight) continue;
      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }
      const isSelected = selectedValues.includes(option.value);
      if (isSelected && !config.multiple) {
        this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }
      if (config.multiple) {
        this.renderMultipleOption(option.label, option.disabled, isSelected, x, itemY, width);
      } else {
        this.renderSingleOption(option.label, option.disabled, isSelected, x, itemY, width);
      }
    }
    this.renderDropdownScrollbar(
      config.options.length,
      maxVisibleItems,
      x,
      y,
      width,
      dropdownHeight,
      scrollTop
    );
    this.ctx.restore();
  }
  renderTagsDropdown(dropdown) {
    const { x, y, width, scrollTop, hoveredIndex, tagsConfig } = dropdown;
    if (!tagsConfig || !tagsConfig.options) return;
    const { options, selectedValues = [] } = tagsConfig;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    this.ctx.save();
    this.drawDropdownPanel(x, y, width, dropdownHeight);
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, dropdownHeight);
    this.ctx.clip();
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const itemY = y + i * itemHeight - scrollTop;
      if (itemY + itemHeight < y || itemY > y + dropdownHeight) continue;
      const isSelected = selectedValues.includes(option.value ?? option.text);
      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }
      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }
      const checkboxSize = 14;
      const checkboxX = x + 10;
      const checkboxY = itemY + (itemHeight - checkboxSize) / 2;
      this.ctx.fillStyle = isSelected ? this.theme.colors.checkbox.checkedBg : this.theme.colors.button.background;
      this.ctx.strokeStyle = isSelected ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
      this.ctx.fill();
      this.ctx.stroke();
      if (isSelected) {
        this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(checkboxX + 3, checkboxY + 7);
        this.ctx.lineTo(checkboxX + 6, checkboxY + 10);
        this.ctx.lineTo(checkboxX + 11, checkboxY + 4);
        this.ctx.stroke();
      }
      this.ctx.fillStyle = option.disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      const textX = checkboxX + checkboxSize + 8;
      const textY = itemY + itemHeight / 2;
      const maxTextWidth = width - (checkboxSize + 28);
      const truncatedText = truncateText(
        option.text,
        Math.floor(maxTextWidth / (this.theme.font.size * 0.6))
      );
      this.ctx.fillText(truncatedText, textX, textY);
    }
    this.renderDropdownScrollbar(
      options.length,
      maxVisibleItems,
      x,
      y,
      width,
      dropdownHeight,
      scrollTop
    );
    this.ctx.restore();
  }
  renderMultipleOption(label, disabled, isSelected, x, itemY, width) {
    const itemHeight = 32;
    const checkboxSize = 14;
    const checkboxX = x + 10;
    const checkboxY = itemY + (itemHeight - checkboxSize) / 2;
    this.ctx.strokeStyle = isSelected ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
    this.ctx.stroke();
    if (isSelected) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.beginPath();
      this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
      this.ctx.fill();
      this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.beginPath();
      this.ctx.moveTo(checkboxX + 3, checkboxY + checkboxSize / 2);
      this.ctx.lineTo(checkboxX + checkboxSize / 2, checkboxY + checkboxSize - 4);
      this.ctx.lineTo(checkboxX + checkboxSize - 3, checkboxY + 4);
      this.ctx.stroke();
    }
    this.ctx.fillStyle = disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const textX = checkboxX + checkboxSize + 8;
    const textY = itemY + itemHeight / 2;
    const maxTextWidth = width - (checkboxSize + 28);
    const truncatedText = truncateText(
      label,
      Math.floor(maxTextWidth / (this.theme.font.size * 0.6))
    );
    this.ctx.fillText(truncatedText, textX, textY);
  }
  renderSingleOption(label, disabled, isSelected, x, itemY, width) {
    const itemHeight = 32;
    if (isSelected) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
    } else {
      this.ctx.fillStyle = disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    }
    this.ctx.textBaseline = "middle";
    const textX = x + 12;
    const textY = itemY + itemHeight / 2;
    const maxTextWidth = width - 24;
    const truncatedText = truncateText(
      label,
      Math.floor(maxTextWidth / (this.theme.font.size * 0.6))
    );
    this.ctx.fillText(truncatedText, textX, textY);
    if (isSelected) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.beginPath();
      const checkX = x + width - 20;
      const checkY = textY;
      this.ctx.moveTo(checkX - 6, checkY);
      this.ctx.lineTo(checkX - 2, checkY + 4);
      this.ctx.lineTo(checkX + 6, checkY - 4);
      this.ctx.strokeStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }
  renderDropdownScrollbar(itemCount, maxVisibleItems, x, y, width, dropdownHeight, scrollTop) {
    if (itemCount <= maxVisibleItems) return;
    const scrollbarWidth = 6;
    const scrollbarX = x + width - scrollbarWidth - 2;
    const totalHeight = itemCount * 32;
    const scrollbarHeight = Math.max(20, dropdownHeight / totalHeight * dropdownHeight);
    const scrollbarY = y + scrollTop / totalHeight * dropdownHeight;
    const prevAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
    this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
    this.ctx.beginPath();
    this.ctx.roundRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);
    this.ctx.fill();
    this.ctx.globalAlpha = prevAlpha;
  }
  drawDropdownPanel(x, y, width, height) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 4);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }
}
class FilterDropdownRenderer {
  ctx;
  theme;
  locale;
  constructor(ctx, theme, locale = zhCN) {
    this.ctx = ctx;
    this.theme = theme;
    this.locale = locale;
  }
  setContext(ctx) {
    this.ctx = ctx;
  }
  setTheme(theme) {
    this.theme = theme;
  }
  setLocale(locale) {
    this.locale = locale;
  }
  render(filterDropdown) {
    switch (filterDropdown.mode) {
      case "search":
        this.renderSearchFilterDropdown(filterDropdown);
        break;
      case "select":
        this.renderSelectFilterDropdown(filterDropdown);
        break;
      case "range":
        this.renderRangeFilterDropdown(filterDropdown);
        break;
      case "boolean":
        this.renderBooleanFilterDropdown(filterDropdown);
        break;
      case "dateRange":
        this.renderDateRangeFilterDropdown(filterDropdown);
        if (filterDropdown.activeDateField && filterDropdown.currentYear !== void 0 && filterDropdown.currentMonth !== void 0) {
          this.renderDateRangeCalendarPopover(filterDropdown);
        }
        break;
    }
  }
  renderSearchFilterDropdown(filterDropdown) {
    const { x, y, width, searchValue } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const inputHeight = 36;
    const buttonHeight = 36;
    const dropdownHeight = padding + inputHeight + gap + buttonHeight;
    this.drawPanelBackground(x, y, width, dropdownHeight);
    const inputY = y + padding;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x + padding, inputY, width - padding * 2, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const textY = inputY + inputHeight / 2;
    const textX = x + padding + 12;
    if (searchValue) {
      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.fillText(searchValue, textX, textY);
    } else {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(this.locale.filter.searchPlaceholder, textX, textY);
    }
    this.renderFilterButtons(x, y + padding + inputHeight + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }
  renderSelectFilterDropdown(filterDropdown) {
    const { x, y, width, options, scrollTop, hoveredIndex, isLoading } = filterDropdown;
    if (!options && !isLoading) return;
    const padding = 8;
    const gap = 4;
    const searchHeight = 32;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const buttonHeight = 36;
    const visibleOptions = options?.length ?? 0;
    const visibleCount = Math.min(visibleOptions, maxVisibleItems);
    const listHeight = visibleCount * itemHeight;
    const dropdownHeight = padding + searchHeight + gap + listHeight + gap + buttonHeight;
    this.drawPanelBackground(x, y, width, dropdownHeight);
    const searchY = y + padding;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x + padding, searchY, width - padding * 2, searchHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    if (filterDropdown.searchText) {
      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.fillText(filterDropdown.searchText, x + padding + 12, searchY + searchHeight / 2);
    } else {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(
        this.locale.filter.selectSearchPlaceholder,
        x + padding + 12,
        searchY + searchHeight / 2
      );
    }
    const listY = y + padding + searchHeight + gap;
    if (isLoading) {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(this.locale.filter.loading, x + padding, listY + itemHeight / 2);
    } else if (options && options.length > 0) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(x, listY, width, listHeight);
      this.ctx.clip();
      const checkboxSize = 14;
      const checkboxGap = 8;
      const startIndex = Math.floor(scrollTop / itemHeight);
      const offsetY = -(scrollTop % itemHeight);
      for (let i = 0; i <= visibleCount + 1; i++) {
        const optionIndex = startIndex + i;
        if (optionIndex < 0 || optionIndex >= options.length) continue;
        const option = options[optionIndex];
        if (!option) continue;
        const itemY = listY + i * itemHeight + offsetY;
        if (optionIndex === hoveredIndex) {
          this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
          this.ctx.fillRect(x, itemY, width, itemHeight);
        }
        const checkboxX = x + padding;
        const checkboxY = itemY + (itemHeight - checkboxSize) / 2;
        this.ctx.strokeStyle = option.checked ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
        this.ctx.stroke();
        if (option.checked) {
          this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
          this.ctx.beginPath();
          this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
          this.ctx.fill();
          this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(checkboxX + 3, checkboxY + 7);
          this.ctx.lineTo(checkboxX + 6, checkboxY + 10);
          this.ctx.lineTo(checkboxX + 11, checkboxY + 4);
          this.ctx.stroke();
        }
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
        this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";
        const textX = checkboxX + checkboxSize + checkboxGap;
        const maxTextWidth = width - padding * 2 - checkboxSize - checkboxGap;
        const colorValue = String(option.value);
        const isColorOption = /^#[0-9A-Fa-f]{6}$/.test(colorValue);
        if (isColorOption) {
          const colorBoxSize = 16;
          const colorBoxY = itemY + (itemHeight - colorBoxSize) / 2;
          const colorBoxX = textX;
          this.ctx.fillStyle = colorValue;
          this.ctx.beginPath();
          this.ctx.roundRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize, 2);
          this.ctx.fill();
          this.ctx.strokeStyle = this.theme.colors.dropdown.border;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
          this.ctx.fillStyle = this.theme.colors.dropdown.text;
          const colorTextX = colorBoxX + colorBoxSize + 6;
          const colorMaxWidth = maxTextWidth - colorBoxSize - 6;
          const colorText = truncateText(
            colorValue.toUpperCase(),
            Math.floor(colorMaxWidth / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(colorText, colorTextX, itemY + itemHeight / 2);
        } else {
          const text = truncateText(
            option.label,
            Math.floor(maxTextWidth / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(text, textX, itemY + itemHeight / 2);
        }
      }
      this.ctx.restore();
      if (options.length > maxVisibleItems) {
        const scrollbarWidth = 6;
        const totalHeight = options.length * itemHeight;
        const thumbHeight = Math.max(20, listHeight / totalHeight * listHeight);
        const maxThumbY = listHeight - thumbHeight;
        const thumbY = scrollTop / (totalHeight - listHeight) * maxThumbY;
        const prevAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
        this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
        this.ctx.beginPath();
        this.ctx.roundRect(
          x + width - scrollbarWidth - 2,
          listY + thumbY + 2,
          scrollbarWidth,
          thumbHeight,
          3
        );
        this.ctx.fill();
        this.ctx.globalAlpha = prevAlpha;
      }
    } else {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(this.locale.filter.noData, x + padding, listY + itemHeight / 2);
    }
    this.renderFilterButtons(
      x,
      y + padding + searchHeight + gap + listHeight + gap,
      width,
      buttonHeight
    );
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }
  renderRangeFilterDropdown(filterDropdown) {
    const { x, y, width, minValue, maxValue } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const inputHeight = 32;
    const inputGap = 8;
    const buttonHeight = 36;
    const dropdownHeight = padding + inputHeight + gap + buttonHeight;
    this.drawPanelBackground(x, y, width, dropdownHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const input1Y = y + padding;
    const inputWidth = (width - padding * 3) / 2;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x + padding, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = minValue ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      minValue ? String(minValue) : this.locale.filter.minPlaceholder,
      x + padding + 8,
      input1Y + inputHeight / 2
    );
    const input2X = x + padding + inputWidth + inputGap;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.beginPath();
    this.ctx.roundRect(input2X, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = maxValue ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText;
    this.ctx.fillText(
      maxValue ? String(maxValue) : this.locale.filter.maxPlaceholder,
      input2X + 8,
      input1Y + inputHeight / 2
    );
    this.renderFilterButtons(x, y + padding + inputHeight + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }
  renderBooleanFilterDropdown(filterDropdown) {
    const { x, y, width, boolValue } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const itemHeight = 32;
    const buttonHeight = 36;
    const dropdownHeight = padding + itemHeight * 3 + gap + buttonHeight;
    this.drawPanelBackground(x, y, width, dropdownHeight);
    const options = [
      { value: "all", label: this.locale.filter.all },
      { value: "true", label: this.locale.filter.selected },
      { value: "false", label: this.locale.filter.unselected }
    ];
    const radioSize = 14;
    const radioGap = 8;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const itemY = y + padding + i * itemHeight;
      const isSelected = boolValue === option.value;
      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }
      const radioX = x + padding;
      const radioY = itemY + (itemHeight - radioSize) / 2;
      this.ctx.strokeStyle = isSelected ? this.theme.colors.button.primaryBg : this.theme.colors.checkbox.border;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(radioX + radioSize / 2, radioY + radioSize / 2, radioSize / 2, 0, Math.PI * 2);
      this.ctx.stroke();
      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        this.ctx.beginPath();
        this.ctx.arc(radioX + radioSize / 2, radioY + radioSize / 2, radioSize / 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(option.label, radioX + radioSize + radioGap, itemY + itemHeight / 2);
    }
    this.renderFilterButtons(x, y + padding + itemHeight * 3 + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }
  renderDateRangeFilterDropdown(filterDropdown) {
    const { x, y, width, startDate, endDate, activeDateField } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const inputHeight = 32;
    const inputGap = 8;
    const buttonHeight = 36;
    const dropdownHeight = padding + inputHeight + gap + buttonHeight;
    this.drawPanelBackground(x, y, width, dropdownHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const input1Y = y + padding;
    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;
    const isStartActive = activeDateField === "startDate";
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = isStartActive ? this.theme.colors.primary : this.theme.colors.input.border;
    this.ctx.lineWidth = isStartActive ? 2 : 1;
    this.ctx.beginPath();
    this.ctx.roundRect(input1X, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();
    const startText = startDate ? this.formatDate(startDate, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = startText ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      startText || this.locale.filter.startDatePlaceholder,
      input1X + 8,
      input1Y + inputHeight / 2
    );
    const input2X = x + padding + inputWidth + inputGap;
    const isEndActive = activeDateField === "endDate";
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = isEndActive ? this.theme.colors.primary : this.theme.colors.input.border;
    this.ctx.lineWidth = isEndActive ? 2 : 1;
    this.ctx.beginPath();
    this.ctx.roundRect(input2X, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();
    const endText = endDate ? this.formatDate(endDate, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = endText ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText;
    this.ctx.fillText(
      endText || this.locale.filter.endDatePlaceholder,
      input2X + 8,
      input1Y + inputHeight / 2
    );
    this.renderFilterButtons(x, y + padding + inputHeight + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }
  renderDateRangeCalendarPopover(filterDropdown) {
    const {
      x,
      y,
      width,
      startDate,
      endDate,
      activeDateField,
      currentYear,
      currentMonth,
      hoveredDate
    } = filterDropdown;
    if (!activeDateField || currentYear === void 0 || currentMonth === void 0) return;
    const padding = 8;
    const inputHeight = 32;
    const gap = 8;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const calendarRows = 6;
    const calendarHeight = headerHeight + weekdayHeight + calendarRows * dayHeight + rowPadding * 2;
    const calendarWidth = 240;
    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;
    const input2X = x + padding + inputWidth + gap;
    const input1Y = y + padding;
    const activeInputX = activeDateField === "startDate" ? input1X : input2X;
    const activeInputCenterX = activeInputX + inputWidth / 2;
    let calendarX = activeInputCenterX - calendarWidth / 2;
    if (calendarX < x) {
      calendarX = x;
    }
    if (calendarX + calendarWidth > x + width) {
      calendarX = x + width - calendarWidth;
    }
    const calendarY = input1Y + inputHeight + gap;
    const selectedDate = activeDateField === "startDate" ? startDate : endDate;
    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;
    this.ctx.beginPath();
    this.ctx.roundRect(calendarX, calendarY, calendarWidth, calendarHeight, 6);
    this.ctx.fill();
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    const monthText = this.locale.calendar.months[currentMonth] ?? String(currentMonth + 1);
    const headerText = this.locale.calendar.yearMonthFormat.replace("{year}", String(currentYear)).replace("{month}", monthText);
    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(headerText, calendarX + calendarWidth / 2, calendarY + headerHeight / 2);
    const arrowSize = 6;
    const leftArrowX = calendarX + 20;
    const rightArrowX = calendarX + calendarWidth - 20;
    const arrowY = calendarY + headerHeight / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText;
    this.ctx.beginPath();
    this.ctx.moveTo(leftArrowX + arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(leftArrowX - arrowSize, arrowY);
    this.ctx.lineTo(leftArrowX + arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(rightArrowX - arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(rightArrowX + arrowSize, arrowY);
    this.ctx.lineTo(rightArrowX - arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();
    const weekdays = this.locale.calendar.weekdays;
    const dayWidth = (calendarWidth - rowPadding * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`;
    this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let i = 0; i < 7; i++) {
      const dayX = calendarX + rowPadding + i * dayWidth + dayWidth / 2;
      const dayY = calendarY + headerHeight + weekdayHeight / 2;
      this.ctx.fillText(weekdays[i], dayX, dayY);
    }
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;
      const cellX = calendarX + rowPadding + col * dayWidth;
      const cellY = calendarY + headerHeight + weekdayHeight + row * dayHeight;
      const cellCenterX = cellX + dayWidth / 2;
      const cellCenterY = cellY + dayHeight / 2;
      const currentDate = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate && currentDate.getTime() === selectedDate.getTime();
      const isHovered = hoveredDate && currentDate.getTime() === hoveredDate.getTime();
      const isToday = currentDate.getTime() === today.getTime();
      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.primary;
        this.ctx.beginPath();
        this.ctx.arc(cellCenterX, cellCenterY, dayHeight / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
        this.ctx.beginPath();
        this.ctx.arc(cellCenterX, cellCenterY, dayHeight / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      } else if (isToday) {
        this.ctx.fillStyle = this.theme.colors.primary;
        this.ctx.fillText(String(day), cellCenterX, cellCenterY);
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
        continue;
      } else {
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      }
      this.ctx.textAlign = "center";
      this.ctx.fillText(String(day), cellCenterX, cellCenterY);
    }
    this.ctx.restore();
  }
  renderFilterButtons(x, y, width, buttonHeight) {
    const padding = 8;
    const fontSize = 14;
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.fillRect(x, y, width, buttonHeight);
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width, y);
    this.ctx.stroke();
    this.ctx.font = `${fontSize}px ${this.theme.font.family}`;
    const resetText = this.locale.filter.reset;
    const confirmText = this.locale.filter.confirm;
    const confirmWidth = this.ctx.measureText(confirmText).width;
    const resetX = x + padding;
    const confirmX = x + width - padding - confirmWidth;
    const textY = y + buttonHeight / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(resetText, resetX, textY);
    this.ctx.fillStyle = this.theme.colors.linkColor;
    this.ctx.fillText(confirmText, confirmX, textY);
  }
  drawPanelBackground(x, y, width, height) {
    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 6);
    this.ctx.fill();
    this.ctx.restore();
  }
  drawPanelBorder(x, y, width, height) {
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 6);
    this.ctx.stroke();
  }
  formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day);
  }
}
function resetShadow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}
function applyThemeShadow(ctx, theme) {
  ctx.shadowColor = theme.colors.shadow.color;
  ctx.shadowBlur = theme.colors.shadow.blur;
  ctx.shadowOffsetX = theme.colors.shadow.offsetX;
  ctx.shadowOffsetY = theme.colors.shadow.offsetY;
}
function drawOverlayPanel(ctx, theme, options) {
  const radius = options.radius ?? 6;
  if (options.shadow) {
    applyThemeShadow(ctx, theme);
  }
  ctx.fillStyle = options.fillStyle;
  ctx.beginPath();
  ctx.roundRect(options.x, options.y, options.width, options.height, radius);
  ctx.fill();
  if (options.shadow) {
    resetShadow(ctx);
  }
  if (options.clip) {
    ctx.beginPath();
    ctx.roundRect(options.x, options.y, options.width, options.height, radius);
    ctx.clip();
  }
  if (options.strokeStyle) {
    ctx.strokeStyle = options.strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(options.x, options.y, options.width, options.height, radius);
    ctx.stroke();
  }
}
function renderOverlayVerticalScrollbar(ctx, theme, x, y, width, trackHeight, thumbY, thumbHeight) {
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = theme.colors.scrollbar.opacity;
  ctx.fillStyle = theme.colors.scrollbar.track;
  ctx.fillRect(x, y, width, trackHeight);
  ctx.fillStyle = theme.colors.scrollbar.thumb;
  ctx.fillRect(x, thumbY, width, thumbHeight);
  ctx.globalAlpha = prevAlpha;
}
class ImageOverlayRenderer {
  ctx;
  theme;
  loader;
  locale;
  constructor(ctx, theme, loader, locale = zhCN) {
    this.ctx = ctx;
    this.theme = theme;
    this.loader = loader;
    this.locale = locale;
  }
  setContext(ctx) {
    this.ctx = ctx;
  }
  setTheme(theme) {
    this.theme = theme;
  }
  setLocale(locale) {
    this.locale = locale;
  }
  renderImageTooltip(imageTooltip) {
    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const rowHeight = imgSize + gap;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const tooltipWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + scrollbarGap + scrollbarWidth;
    const visibleHeight = imageTooltip.maxRows * rowHeight + padding * 2 - gap;
    const totalRows = Math.ceil(imageTooltip.images.length / imagesPerRow);
    const contentHeight = totalRows * rowHeight - gap;
    this.ctx.save();
    drawOverlayPanel(this.ctx, this.theme, {
      x: imageTooltip.x,
      y: imageTooltip.y,
      width: tooltipWidth,
      height: visibleHeight,
      fillStyle: this.theme.colors.tooltip.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true,
      clip: true
    });
    const startRow = Math.floor(imageTooltip.scrollTop / rowHeight);
    const endRow = Math.min(totalRows, startRow + imageTooltip.maxRows + 1);
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= imageTooltip.images.length) break;
        const imgSrc = imageTooltip.images[index];
        if (!imgSrc) continue;
        const x = imageTooltip.x + padding + col * (imgSize + gap);
        const y = imageTooltip.y + padding + row * rowHeight - imageTooltip.scrollTop;
        if (y + imgSize < imageTooltip.y || y > imageTooltip.y + visibleHeight) continue;
        this.renderImageTile(
          imgSrc,
          x,
          y,
          imgSize,
          index === imageTooltip.hoveredIndex,
          false,
          false
        );
      }
    }
    if (contentHeight > visibleHeight - padding * 2) {
      const scrollbarTrackHeight = visibleHeight - padding * 2;
      const scrollbarThumbHeight = Math.max(
        30,
        visibleHeight / contentHeight * scrollbarTrackHeight
      );
      const scrollbarThumbY = imageTooltip.y + padding + imageTooltip.scrollTop / (contentHeight - scrollbarTrackHeight + padding * 2) * (scrollbarTrackHeight - scrollbarThumbHeight);
      renderOverlayVerticalScrollbar(
        this.ctx,
        this.theme,
        imageTooltip.x + tooltipWidth - padding - scrollbarWidth,
        imageTooltip.y + padding,
        scrollbarWidth,
        scrollbarTrackHeight,
        scrollbarThumbY,
        scrollbarThumbHeight
      );
    }
    this.ctx.restore();
  }
  renderImageEditor(editor) {
    const images = editor.images ?? [];
    const pendingImages = editor.pendingImages ?? [];
    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + scrollbarGap + scrollbarWidth;
    const imagesHeight = editor.maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;
    this.ctx.save();
    drawOverlayPanel(this.ctx, this.theme, {
      x: editor.x,
      y: editor.y,
      width: editorWidth,
      height: editorHeight,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true
    });
    this.renderUploadArea(editor, editorWidth, uploadAreaHeight, padding);
    const imagesY = editor.y + uploadAreaHeight;
    const totalRows = Math.ceil((images.length + pendingImages.length) / imagesPerRow);
    const contentHeight = totalRows * rowHeight - gap;
    const visibleHeight = imagesHeight - padding * 2;
    this.ctx.beginPath();
    this.ctx.rect(editor.x, imagesY, editorWidth, imagesHeight);
    this.ctx.clip();
    const startRow = Math.floor(editor.scrollTop / rowHeight);
    const endRow = Math.min(totalRows, startRow + editor.maxRows + 1);
    const allImages = [...images, ...pendingImages.map((p) => p.preview)];
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= allImages.length) break;
        const imgSrc = allImages[index];
        if (!imgSrc) continue;
        const imgX = editor.x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - editor.scrollTop;
        if (imgY + imgSize < imagesY || imgY > imagesY + imagesHeight) continue;
        const isHovered = index === editor.hoveredIndex;
        const isPending = index >= images.length;
        this.renderImageTile(imgSrc, imgX, imgY, imgSize, isHovered, isPending, true);
      }
    }
    if (contentHeight > visibleHeight) {
      const scrollbarTrackHeight = visibleHeight;
      const scrollbarThumbHeight = Math.max(
        30,
        visibleHeight / contentHeight * scrollbarTrackHeight
      );
      const scrollbarThumbY = imagesY + padding + editor.scrollTop / (contentHeight - visibleHeight + padding * 2) * (scrollbarTrackHeight - scrollbarThumbHeight);
      renderOverlayVerticalScrollbar(
        this.ctx,
        this.theme,
        editor.x + editorWidth - padding - scrollbarWidth,
        imagesY + padding,
        scrollbarWidth,
        scrollbarTrackHeight,
        scrollbarThumbY,
        scrollbarThumbHeight
      );
    }
    this.ctx.restore();
  }
  renderUploadArea(editor, editorWidth, uploadAreaHeight, padding) {
    const uploadY = editor.y;
    const isDragging = editor.isDragging;
    this.ctx.fillStyle = isDragging ? this.theme.colors.dropdown.selectedBg : this.theme.colors.image.placeholderBg;
    this.ctx.fillRect(
      editor.x + padding,
      uploadY + padding,
      editorWidth - padding * 2,
      uploadAreaHeight - padding * 2
    );
    this.ctx.strokeStyle = isDragging ? this.theme.colors.checkbox.checkedBg : this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(
      editor.x + padding,
      uploadY + padding,
      editorWidth - padding * 2,
      uploadAreaHeight - padding * 2
    );
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    const uploadText = isDragging ? this.locale.image.uploadDragging : this.locale.image.uploadIdle;
    this.ctx.fillText(uploadText, editor.x + editorWidth / 2, uploadY + uploadAreaHeight / 2);
  }
  renderImageTile(imgSrc, x, y, imgSize, isHovered, isPending, showDelete) {
    const cachedImg = this.loader.get(imgSrc, imgSize);
    if (cachedImg) {
      this.ctx.save();
      if (isHovered) {
        this.ctx.strokeStyle = this.theme.colors.image.hoverBorder;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - 1, y - 1, imgSize + 2, imgSize + 2);
      }
      this.ctx.drawImage(cachedImg, x, y, imgSize, imgSize);
      this.ctx.restore();
      this.loader.collectVisible(imgSrc);
    } else {
      this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
      this.ctx.fillRect(x, y, imgSize, imgSize);
      this.ctx.strokeStyle = this.theme.colors.dropdown.border;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, imgSize, imgSize);
      if (!this.loader.isLoading(imgSrc)) {
        this.loader.load(imgSrc, imgSize);
      }
    }
    if (isPending) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(x, y + imgSize - 20, imgSize, 20);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`;
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.locale.image.uploading, x + imgSize / 2, y + imgSize - 10);
    }
    if (isHovered && !isPending && showDelete) {
      const deleteBtnSize = 16;
      const deleteBtnX = x + imgSize - deleteBtnSize / 2 - 2;
      const deleteBtnY = y + deleteBtnSize / 2 + 2;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      this.ctx.beginPath();
      this.ctx.arc(deleteBtnX, deleteBtnY, deleteBtnSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(deleteBtnX - 3, deleteBtnY - 3);
      this.ctx.lineTo(deleteBtnX + 3, deleteBtnY + 3);
      this.ctx.moveTo(deleteBtnX + 3, deleteBtnY - 3);
      this.ctx.lineTo(deleteBtnX - 3, deleteBtnY + 3);
      this.ctx.stroke();
    }
  }
}
class OverlayRenderer {
  ctx;
  canvas;
  theme;
  layoutManager;
  locale;
  dpr;
  watermarkConfig = null;
  constructor(canvas, ctx, theme, layoutManager, dpr, locale = zhCN) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.layoutManager = layoutManager;
    this.locale = locale;
    this.dpr = dpr;
  }
  setCanvas(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }
  setTheme(theme) {
    this.theme = theme;
  }
  setLocale(locale) {
    this.locale = locale;
  }
  setDpr(dpr) {
    this.dpr = dpr;
  }
  setWatermarkConfig(config) {
    this.watermarkConfig = config;
  }
  renderColorDropdown(dropdown) {
    const { config, x, y, width, hoveredColor } = dropdown;
    const presetColors = config.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const dropdownHeight = padding * 2 + rows * (cellSize + gap) - gap;
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.fill();
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.stroke();
    for (let i = 0; i < presetColors.length; i++) {
      const color = presetColors[i];
      const col = i % columns;
      const row = Math.floor(i / columns);
      const cellX = x + padding + col * (cellSize + gap);
      const cellY = y + padding + row * (cellSize + gap);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(cellX, cellY, cellSize, cellSize);
      if (color === hoveredColor) {
        this.ctx.strokeStyle = "#1890ff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(cellX - 1, cellY - 1, cellSize + 2, cellSize + 2);
      } else {
        this.ctx.strokeStyle = "#d9d9d9";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      }
    }
  }
  renderTooltip(tooltip) {
    const { x, y, width: cellWidth, content } = tooltip;
    const padding = 8;
    const lineHeight = 20;
    const tagGap = 4;
    const tagPadding = 4;
    const tagRadius = 4;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    let tooltipHeight = padding * 2;
    const lines = [];
    const tagLines = [];
    const minTooltipWidth = 140;
    const maxTooltipWidth = 300;
    const availableWidth = cellWidth ?? maxTooltipWidth;
    let contentWidth = 0;
    if (content.type === "text") {
      const textWidth = this.ctx.measureText(content.text).width;
      contentWidth = Math.min(textWidth + padding * 2, maxTooltipWidth);
      const maxWidth = Math.max(minTooltipWidth, Math.min(contentWidth, availableWidth));
      let currentLine = "";
      for (const char of content.text.split("")) {
        const testLine = currentLine + char;
        const testWidth = this.ctx.measureText(testLine).width;
        if (testWidth > maxWidth - padding * 2) {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      tooltipHeight += lines.length * lineHeight;
    } else if (content.type === "tags") {
      const tags = content.tags;
      let currentTagLine = [];
      let currentLineWidth = padding;
      for (const tag of tags) {
        const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;
        contentWidth = Math.max(contentWidth, currentLineWidth + tagWidth + padding);
        if (currentLineWidth + tagWidth + tagGap > availableWidth - padding) {
          if (currentTagLine.length > 0) {
            tagLines.push(currentTagLine);
            currentTagLine = [];
            currentLineWidth = padding;
          }
        }
        currentTagLine.push(tag);
        currentLineWidth += tagWidth + tagGap;
      }
      if (currentTagLine.length > 0) {
        tagLines.push(currentTagLine);
      }
      tooltipHeight += tagLines.length * (this.theme.font.size + tagPadding * 2) + (tagLines.length - 1) * tagGap;
    }
    const tooltipWidth = Math.max(minTooltipWidth, Math.min(contentWidth, availableWidth));
    let tooltipX = x + (availableWidth - tooltipWidth) / 2;
    const viewportWidth = this.canvas.width / this.dpr;
    if (tooltipX < 0) {
      tooltipX = 4;
    } else if (tooltipX + tooltipWidth > viewportWidth) {
      tooltipX = viewportWidth - tooltipWidth - 4;
    }
    const tooltipY = y - tooltipHeight - this.theme.colors.tooltip.gap;
    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.tooltip.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;
    this.ctx.beginPath();
    this.ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
    this.ctx.fill();
    this.ctx.restore();
    this.ctx.fillStyle = this.theme.colors.tooltip.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "top";
    if (content.type === "text") {
      let textY = tooltipY + padding;
      for (const line of lines) {
        this.ctx.fillText(line, tooltipX + padding, textY);
        textY += lineHeight;
      }
    } else if (content.type === "tags") {
      let tagY = tooltipY + padding;
      const tagHeight = this.theme.font.size + tagPadding * 2;
      for (const tagLine of tagLines) {
        let tagX = tooltipX + padding;
        for (const tag of tagLine) {
          const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;
          this.ctx.fillStyle = tag.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0");
          this.ctx.beginPath();
          this.ctx.roundRect(tagX, tagY, tagWidth, tagHeight, tagRadius);
          this.ctx.fill();
          this.ctx.fillStyle = tag.color ?? this.theme.colors.cellText ?? "#333";
          this.ctx.textBaseline = "middle";
          const textX = tagX + (tagWidth - this.ctx.measureText(tag.text).width) / 2;
          this.ctx.fillText(tag.text, textX, tagY + tagHeight / 2);
          tagX += tagWidth + tagGap;
        }
        tagY += tagHeight + tagGap;
      }
    }
  }
  renderScrollbars(scrollLeft, scrollTop, maxScrollLeft, maxScrollTop, scrollbarState) {
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;
    if (maxScrollTop > 0) {
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        viewportHeight / layoutInfo.totalHeight * trackHeight
      );
      const thumbY = headerHeight + scrollTop / maxScrollTop * (trackHeight - thumbHeight);
      const thumbX = viewportWidth - scrollbarWidth;
      let thumbColor = this.theme.colors.scrollbar.thumb;
      if (scrollbarState.verticalDragging) {
        thumbColor = this.theme.colors.scrollbar.thumbActive;
      } else if (scrollbarState.verticalHovered) {
        thumbColor = this.theme.colors.scrollbar.thumbHover;
      }
      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = thumbColor;
      this.ctx.beginPath();
      this.ctx.roundRect(thumbX, thumbY, scrollbarWidth - 2, thumbHeight, 4);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }
    if (maxScrollLeft > 0) {
      const trackWidth = viewportWidth;
      const thumbWidth = Math.max(
        scrollbarMinSize,
        viewportWidth / layoutInfo.totalWidth * trackWidth
      );
      const thumbX = scrollLeft / maxScrollLeft * (trackWidth - thumbWidth);
      const thumbY = viewportHeight - scrollbarWidth;
      let thumbColor = this.theme.colors.scrollbar.thumb;
      if (scrollbarState.horizontalDragging) {
        thumbColor = this.theme.colors.scrollbar.thumbActive;
      } else if (scrollbarState.horizontalHovered) {
        thumbColor = this.theme.colors.scrollbar.thumbHover;
      }
      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = thumbColor;
      this.ctx.beginPath();
      this.ctx.roundRect(thumbX, thumbY, thumbWidth, scrollbarWidth - 2, 4);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }
  }
  getScrollbarBounds(scrollLeft, scrollTop, maxScrollLeft, maxScrollTop) {
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;
    let vertical = null;
    let horizontal = null;
    if (maxScrollTop > 0) {
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        viewportHeight / layoutInfo.totalHeight * trackHeight
      );
      const thumbY = headerHeight + scrollTop / maxScrollTop * (trackHeight - thumbHeight);
      const thumbX = viewportWidth - scrollbarWidth;
      vertical = {
        x: thumbX,
        y: thumbY,
        width: scrollbarWidth - 2,
        height: thumbHeight
      };
    }
    if (maxScrollLeft > 0) {
      const trackWidth = viewportWidth;
      const thumbWidth = Math.max(
        scrollbarMinSize,
        viewportWidth / layoutInfo.totalWidth * trackWidth
      );
      const thumbX = scrollLeft / maxScrollLeft * (trackWidth - thumbWidth);
      const thumbY = viewportHeight - scrollbarWidth;
      horizontal = {
        x: thumbX,
        y: thumbY,
        width: thumbWidth,
        height: scrollbarWidth - 2
      };
    }
    return { vertical, horizontal };
  }
  renderWatermark() {
    if (!this.watermarkConfig) return;
    const enabled = this.watermarkConfig.enabled ?? true;
    if (!enabled) return;
    const content = this.watermarkConfig.content ?? "Watermark";
    if (!content) return;
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;
    const themeWatermark = this.theme.colors.watermark;
    const fontSize = this.watermarkConfig.fontSize ?? themeWatermark.fontSize;
    const fontFamily = this.watermarkConfig.fontFamily ?? themeWatermark.fontFamily ?? this.theme.font.family;
    const color = this.watermarkConfig.color ?? themeWatermark.color;
    const rotation = this.watermarkConfig.rotation ?? -22;
    const gapX = this.watermarkConfig.gapX ?? 100;
    const gapY = this.watermarkConfig.gapY ?? 100;
    const opacity = this.watermarkConfig.opacity ?? themeWatermark.opacity;
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    const radians = rotation * Math.PI / 180;
    const textWidth = this.ctx.measureText(content).width;
    const cellWidth = textWidth + gapX;
    const cellHeight = fontSize + gapY;
    const cols = Math.ceil(viewportWidth / cellWidth) + 2;
    const rows = Math.ceil(viewportHeight / cellHeight) + 2;
    for (let row = -1; row <= rows; row++) {
      for (let col = -1; col <= cols; col++) {
        const x = col * cellWidth + (row % 2 === 0 ? 0 : cellWidth / 2);
        const y = row * cellHeight;
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(radians);
        this.ctx.fillText(content, 0, 0);
        this.ctx.restore();
      }
    }
    this.ctx.restore();
  }
  renderContextMenu(contextMenu) {
    const { x, y, hoveredIndex, items } = contextMenu;
    const menuWidth = 140;
    const itemHeight = 32;
    const menuHeight = items.length * itemHeight;
    this.ctx.save();
    this.drawMenuPanel(x, y, menuWidth, menuHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemY = y + i * itemHeight;
      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, menuWidth, itemHeight);
      }
      this.ctx.fillStyle = item.danger ? "#f56c6c" : this.theme.colors.dropdown.text;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(item.text, x + 12, itemY + itemHeight / 2);
    }
    this.ctx.restore();
  }
  renderHeaderContextMenu(headerContextMenu) {
    const { x, y, hoveredIndex } = headerContextMenu;
    const menuWidth = 120;
    const itemHeight = 32;
    const menuItems = [{ text: this.locale.contextMenu.hideColumn }];
    const menuHeight = menuItems.length * itemHeight;
    this.ctx.save();
    this.drawMenuPanel(x, y, menuWidth, menuHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      const itemY = y + i * itemHeight;
      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, menuWidth, itemHeight);
      }
      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(item.text, x + 12, itemY + itemHeight / 2);
    }
    this.ctx.restore();
  }
  renderDateDropdown(dateDropdown) {
    const { x, y, width, currentYear, currentMonth, selectedDate, hoveredDate } = dateDropdown;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;
    this.ctx.save();
    drawOverlayPanel(this.ctx, this.theme, {
      x,
      y,
      width,
      height: dropdownHeight,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true
    });
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.fillRect(x, y, width, dropdownHeight);
    const monthText = this.locale.calendar.months[currentMonth] ?? String(currentMonth + 1);
    const headerText = this.locale.calendar.yearMonthFormat.replace("{year}", String(currentYear)).replace("{month}", monthText);
    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(headerText, x + width / 2, y + headerHeight / 2);
    const arrowSize = 6;
    const leftArrowX = x + 20;
    const rightArrowX = x + width - 20;
    const arrowY = y + headerHeight / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText;
    this.ctx.beginPath();
    this.ctx.moveTo(leftArrowX + arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(leftArrowX - arrowSize, arrowY);
    this.ctx.lineTo(leftArrowX + arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(rightArrowX - arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(rightArrowX + arrowSize, arrowY);
    this.ctx.lineTo(rightArrowX - arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();
    const weekdays = this.locale.calendar.weekdays;
    const dayWidth = (width - rowPadding * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`;
    this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let i = 0; i < 7; i++) {
      const dayX = x + rowPadding + i * dayWidth + dayWidth / 2;
      const dayY = y + headerHeight + weekdayHeight / 2;
      this.ctx.fillText(weekdays[i], dayX, dayY);
    }
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;
      const cellX = x + rowPadding + col * dayWidth;
      const cellY = y + headerHeight + weekdayHeight + row * dayHeight;
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getFullYear() === selectedDate.getFullYear() && date.getMonth() === selectedDate.getMonth() && date.getDate() === selectedDate.getDate();
      const isHovered = hoveredDate && date.getFullYear() === hoveredDate.getFullYear() && date.getMonth() === hoveredDate.getMonth() && date.getDate() === hoveredDate.getDate();
      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      } else if (isToday) {
        this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else {
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      }
      this.ctx.fillText(String(day), cellX + dayWidth / 2, cellY + dayHeight / 2);
    }
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.stroke();
    this.ctx.restore();
  }
  drawMenuPanel(x, y, width, height) {
    drawOverlayPanel(this.ctx, this.theme, {
      x,
      y,
      width,
      height,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true
    });
  }
  getDefaultPresetColors() {
    return [
      "#ff4d4f",
      "#ff7a45",
      "#ffa940",
      "#ffc53d",
      "#bae637",
      "#73d13d",
      "#36cfc9",
      "#40a9ff",
      "#597ef7",
      "#9254de",
      "#f759ab",
      "#ff85c0",
      "#a0d911",
      "#13c2c2",
      "#1890ff",
      "#722ed1",
      "#eb2f96",
      "#faad14",
      "#52c41a",
      "#2f54eb",
      "#ffffff",
      "#f5f5f5",
      "#d9d9d9",
      "#8c8c8c",
      "#595959",
      "#262626",
      "#000000",
      "#f50"
    ];
  }
}
class BaseCellRenderer {
  /**
   * Get cell padding
   */
  getPadding() {
    return 8;
  }
  /**
   * Get the text alignment for a column
   */
  getTextAlign(column) {
    return column.align ?? "left";
  }
  /**
   * Calculate text position based on alignment
   */
  calculateTextX(text, x, width, padding, align, ctx) {
    const textWidth = ctx.measureText(text).width;
    switch (align) {
      case "center":
        return x + (width - textWidth) / 2;
      case "right":
        return x + width - padding - textWidth;
      default:
        return x + padding;
    }
  }
  /**
   * Draw a rounded rectangle
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  /**
   * Truncate text to fit within a given width
   */
  truncateText(ctx, text, maxWidth, ellipsis = "...") {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }
    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + ellipsis;
  }
}
class TextRenderer extends BaseCellRenderer {
  type = "text";
  render(context) {
    const { ctx, theme, x, y, width, height, column, row, value, isSelected, isHovered } = context;
    const padding = this.getPadding();
    const align = this.getTextAlign(column);
    const displayValue = this.formatValue(value, column, row);
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";
    const text = displayValue || (column.placeholder ?? "");
    const textColor = displayValue ? this.getTextColor(theme, isSelected, isHovered) : theme.colors.placeholderText;
    ctx.fillStyle = textColor;
    const maxTextWidth = width - padding * 2;
    const truncatedText = this.truncateText(ctx, text, maxTextWidth);
    const textX = this.calculateTextX(truncatedText, x, width, padding, align, ctx);
    const textY = y + height / 2;
    ctx.fillText(truncatedText, textX, textY);
    return { type: "text" };
  }
  getTextColor(theme, isSelected, isHovered) {
    if (isSelected) {
      return theme.colors.cellText;
    }
    if (isHovered) {
      return theme.colors.cellText;
    }
    return theme.colors.cellText;
  }
  formatValue(value, column, row) {
    if (value === null || value === void 0) {
      return "";
    }
    if (column.formatter) {
      return column.formatter(value, row, column);
    }
    return String(value);
  }
}
class NumberRenderer extends BaseCellRenderer {
  type = "number";
  render(context) {
    const { ctx, theme, x, y, width, height, column, row, value, locale } = context;
    const padding = 8;
    const align = this.getTextAlign(column);
    const displayValue = this.formatValue(value, column, row);
    ctx.strokeStyle = theme.colors.input.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    const placeholder = column.placeholder ?? locale.cell.numberPlaceholder;
    const text = displayValue || placeholder;
    ctx.fillStyle = displayValue ? theme.colors.cellText : theme.colors.placeholderText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";
    const maxTextWidth = width - padding * 2;
    const truncatedText = this.truncateText(ctx, text, maxTextWidth);
    const textX = this.calculateTextX(truncatedText, x, width, padding, align, ctx);
    const textY = y + height / 2;
    ctx.fillText(truncatedText, textX, textY);
    return { type: "number" };
  }
  formatValue(value, column, row) {
    if (value === null || value === void 0 || value === "") {
      return "";
    }
    if (column.formatter) {
      return column.formatter(value, row, column);
    }
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return String(value);
  }
}
class CheckboxRenderer extends BaseCellRenderer {
  type = "checkbox";
  render(context) {
    const { ctx, theme, x, y, width, height, value, isDisabled } = context;
    const config = value;
    const size = 16;
    const checkboxX = x + (width - size) / 2;
    const checkboxY = y + (height - size) / 2;
    const disabled = isDisabled ?? false;
    ctx.fillStyle = disabled ? theme.colors.checkbox.disabledBg : theme.colors.button.background;
    ctx.strokeStyle = theme.colors.checkbox.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(checkboxX, checkboxY, size, size, 3);
    ctx.fill();
    ctx.stroke();
    if (config.indeterminate) {
      ctx.strokeStyle = disabled ? theme.colors.checkbox.border : theme.colors.checkbox.checkedBg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(checkboxX + 4, checkboxY + size / 2);
      ctx.lineTo(checkboxX + size - 4, checkboxY + size / 2);
      ctx.stroke();
    } else if (config.checked) {
      ctx.strokeStyle = disabled ? theme.colors.checkbox.border : theme.colors.checkbox.checkedBg;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(checkboxX + 4, checkboxY + size / 2);
      ctx.lineTo(checkboxX + size / 2 - 1, checkboxY + size - 5);
      ctx.lineTo(checkboxX + size - 3, checkboxY + 4);
      ctx.stroke();
    }
    return { type: "checkbox", config };
  }
}
class RadioRenderer extends BaseCellRenderer {
  type = "radio";
  render(context) {
    const { ctx, theme, x, y, width, height, value, isDisabled } = context;
    const config = value;
    const size = 16;
    const padding = 8;
    const gap = 4;
    const columnDisabled = isDisabled ?? false;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    if (config.options && config.options.length > 0) {
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      const optionWidths = config.options.map((option) => {
        const textWidth = ctx.measureText(option.label).width;
        return size + gap + textWidth + padding;
      });
      let currentX = x + padding;
      const maxX = x + width - padding;
      for (let i = 0; i < config.options.length; i++) {
        const option = config.options[i];
        const optionWidth = optionWidths[i];
        if (currentX + optionWidth - padding > maxX) {
          break;
        }
        const radioX = currentX;
        const radioY = y + (height - size) / 2;
        const centerX = radioX + size / 2;
        const centerY = radioY + size / 2;
        const optionDisabled = option.disabled || columnDisabled;
        const isChecked = config.value === option.value;
        ctx.fillStyle = optionDisabled ? theme.colors.radio.disabledBg : theme.colors.button.background;
        ctx.strokeStyle = theme.colors.radio.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (isChecked) {
          ctx.fillStyle = optionDisabled ? theme.colors.radio.border : theme.colors.radio.checkedBg;
          ctx.beginPath();
          ctx.arc(centerX, centerY, size / 2 - 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = optionDisabled ? theme.colors.placeholderText : theme.colors.cellText;
        ctx.font = `${theme.font.size}px ${theme.font.family}`;
        ctx.textBaseline = "middle";
        const textX = radioX + size + gap;
        ctx.fillText(option.label, textX, centerY);
        currentX += optionWidth;
      }
    } else {
      const radioX = x + (width - size) / 2;
      const radioY = y + (height - size) / 2;
      const centerX = radioX + size / 2;
      const centerY = radioY + size / 2;
      ctx.fillStyle = columnDisabled ? theme.colors.radio.disabledBg : theme.colors.button.background;
      ctx.strokeStyle = theme.colors.radio.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (config.checked) {
        ctx.fillStyle = columnDisabled ? theme.colors.radio.border : theme.colors.radio.checkedBg;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return { type: "radio", config };
  }
}
class ButtonRenderer extends BaseCellRenderer {
  type = "button";
  render(context) {
    const { value, buttonHoverState, buttonOptions } = context;
    const config = value;
    if (Array.isArray(config)) {
      return this.renderButtons(context, config, buttonOptions ?? {});
    }
    return this.renderSingleButton(context, config, buttonHoverState?.progress);
  }
  renderSingleButton(context, config, hoverProgress) {
    const { ctx, theme, locale, x, y, width, height, isDisabled } = context;
    const cellPadding = 8;
    const buttonHeight = config.size === "small" ? 24 : config.size === "large" ? 40 : 32;
    const buttonY = y + (height - buttonHeight) / 2;
    const disabled = isDisabled ?? false;
    const text = config.text ?? locale.cell.buttonText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    const textWidth = ctx.measureText(text).width;
    const buttonPadding = 16;
    const buttonWidth = Math.min(
      Math.max(textWidth + buttonPadding * 2, 60),
      width - cellPadding * 2
    );
    const buttonX = x + (width - buttonWidth) / 2;
    const progress = hoverProgress ?? 0;
    let bgColor;
    let textColor;
    let borderColor;
    if (disabled) {
      bgColor = theme.colors.button.disabledBg;
      textColor = theme.colors.button.disabledText;
      borderColor = theme.colors.button.disabledBorder;
    } else {
      switch (config.variant) {
        case "primary":
          bgColor = theme.colors.button.primaryBg;
          textColor = theme.colors.button.primaryText;
          borderColor = bgColor;
          break;
        case "danger":
          bgColor = theme.colors.button.dangerBg;
          textColor = theme.colors.button.dangerText;
          borderColor = bgColor;
          break;
        case "warning":
          bgColor = theme.colors.button.warningBg;
          textColor = theme.colors.button.warningText;
          borderColor = bgColor;
          break;
        case "link":
          bgColor = "transparent";
          textColor = theme.colors.button.linkText;
          borderColor = "transparent";
          break;
        default:
          bgColor = theme.colors.button.background;
          textColor = theme.colors.button.text;
          borderColor = theme.colors.button.border;
      }
    }
    if (!disabled && progress > 0 && config.variant !== "link") {
      if (config.variant === "default" || !config.variant) {
        const bgRgb = this.hexToRgb(theme.colors.button.background);
        const brightness = (bgRgb.r * 299 + bgRgb.g * 587 + bgRgb.b * 114) / 1e3;
        if (brightness > 128) {
          const hoverGray = Math.round(bgRgb.r - progress * 0.2 * bgRgb.r);
          bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
        } else {
          const hoverGray = Math.round(bgRgb.r + progress * 0.2 * (255 - bgRgb.r));
          bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
        }
      } else {
        ctx.globalAlpha = 1 - progress * 0.2;
      }
    }
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    const radius = 4;
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, radius);
    ctx.fill();
    ctx.stroke();
    if (!disabled && progress > 0 && config.variant !== "link") {
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = textColor;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    ctx.textAlign = "left";
    return { type: "button", config };
  }
  renderButtons(context, buttons, options) {
    const { ctx, theme, locale, x, y, height, isDisabled, hoveredButtonIndex } = context;
    const padding = 8;
    const gap = options.gap ?? 4;
    const maxVisible = options.maxVisible ?? 3;
    const buttonHeight = 24;
    const buttonY = y + (height - buttonHeight) / 2;
    const visibleButtons = buttons.filter((btn) => btn.visible !== false);
    const displayButtons = visibleButtons.slice(0, maxVisible);
    const moreButtons = visibleButtons.slice(maxVisible);
    let currentX = x + padding;
    for (let i = 0; i < displayButtons.length; i++) {
      const btn = displayButtons[i];
      const text = btn.text ?? locale.cell.buttonText;
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      const textWidth = ctx.measureText(text).width;
      const buttonWidth = Math.max(textWidth + 16, 40);
      const isHovered = hoveredButtonIndex === i && !isDisabled;
      const isBtnDisabled = isDisabled ?? false;
      let bgColor;
      let textColor;
      let borderColor;
      if (isBtnDisabled) {
        bgColor = theme.colors.button.disabledBg;
        textColor = theme.colors.button.disabledText;
        borderColor = theme.colors.button.disabledBorder;
      } else if (btn.variant === "primary") {
        bgColor = theme.colors.button.primaryBg;
        textColor = theme.colors.button.primaryText;
        borderColor = bgColor;
      } else if (btn.variant === "danger") {
        bgColor = theme.colors.button.dangerBg;
        textColor = theme.colors.button.dangerText;
        borderColor = bgColor;
      } else if (btn.variant === "warning") {
        bgColor = theme.colors.button.warningBg;
        textColor = theme.colors.button.warningText;
        borderColor = bgColor;
      } else if (btn.variant === "link") {
        bgColor = "transparent";
        textColor = theme.colors.button.linkText;
        borderColor = "transparent";
      } else {
        bgColor = isHovered ? theme.colors.button.hoverBg : theme.colors.button.background;
        textColor = theme.colors.button.text;
        borderColor = theme.colors.button.border;
      }
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(currentX, buttonY, buttonWidth, buttonHeight, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(text, currentX + buttonWidth / 2, buttonY + buttonHeight / 2);
      currentX += buttonWidth + gap;
    }
    if (moreButtons.length > 0) {
      const moreText = options.moreButtonText ?? "···";
      const textWidth = ctx.measureText(moreText).width;
      const moreWidth = Math.max(textWidth + 16, 32);
      const isMoreDisabled = isDisabled ?? false;
      const isMoreHovered = hoveredButtonIndex === displayButtons.length && !isMoreDisabled;
      ctx.fillStyle = isMoreDisabled ? theme.colors.button.disabledBg : isMoreHovered ? theme.colors.button.hoverBg : theme.colors.button.background;
      ctx.strokeStyle = isMoreDisabled ? theme.colors.button.disabledBorder : theme.colors.button.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(currentX, buttonY, moreWidth, buttonHeight, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isMoreDisabled ? theme.colors.button.disabledText : theme.colors.button.text;
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(moreText, currentX + moreWidth / 2, buttonY + buttonHeight / 2);
    }
    ctx.textAlign = "left";
    return { type: "button", config: buttons };
  }
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
class SwitchRenderer extends BaseCellRenderer {
  type = "switch";
  render(context) {
    const { ctx, theme, x, y, width, height, value, isDisabled, switchAnimation } = context;
    const config = value;
    const switchWidth = 44;
    const switchHeight = 22;
    const thumbSize = 18;
    const switchX = x + (width - switchWidth) / 2;
    const switchY = y + (height - switchHeight) / 2;
    const radius = switchHeight / 2;
    const isChecked = config.checked ?? false;
    const disabled = isDisabled ?? false;
    const progress = switchAnimation?.progress ?? (isChecked ? 1 : 0);
    const thumbTravel = switchWidth - thumbSize - 4;
    const thumbX = switchX + 2 + progress * thumbTravel;
    const thumbY = switchY + (switchHeight - thumbSize) / 2;
    ctx.save();
    const offColor = disabled ? theme.colors.switch.disabledOffBg : theme.colors.switch.offBg;
    const onColor = disabled ? theme.colors.switch.disabledOnBg : theme.colors.switch.onBg;
    const offRGB = this.hexToRgb(offColor);
    const onRGB = this.hexToRgb(onColor);
    const r = Math.round(offRGB.r + (onRGB.r - offRGB.r) * progress);
    const g = Math.round(offRGB.g + (onRGB.g - offRGB.g) * progress);
    const b = Math.round(offRGB.b + (onRGB.b - offRGB.b) * progress);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.roundRect(switchX, switchY, switchWidth, switchHeight, radius);
    ctx.fill();
    ctx.fillStyle = theme.colors.switch.thumb;
    ctx.beginPath();
    ctx.arc(thumbX + thumbSize / 2, thumbY + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = theme.colors.shadow.color;
    ctx.shadowBlur = theme.colors.shadow.blur;
    ctx.shadowOffsetX = theme.colors.shadow.offsetX;
    ctx.shadowOffsetY = theme.colors.shadow.offsetY;
    ctx.restore();
    return { type: "switch", config };
  }
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
const STANDARD_ROW_HEIGHT$2 = 32;
class ProgressRenderer extends BaseCellRenderer {
  type = "progress";
  render(context) {
    const { ctx, theme, x, y, width, height, value } = context;
    const config = value;
    const shape = config.shape ?? "line";
    if (shape === "line") {
      this.renderLineProgress(ctx, theme, x, y, width, height, config);
    } else if (shape === "circle") {
      this.renderCircleProgress(ctx, theme, x, y, width, height, config);
    } else if (shape === "dashboard") {
      this.renderDashboardProgress(ctx, theme, x, y, width, height, config);
    }
    return { type: "progress", config };
  }
  renderLineProgress(ctx, theme, x, y, cellWidth, cellHeight, config) {
    const padding = 8;
    const textPosition = config.textPosition ?? "right";
    const showText = config.showText ?? true;
    const size = config.size ?? "medium";
    ctx.save();
    const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
    const textGap = 8;
    const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
    const barWidth = config.width ?? cellWidth - padding * 2 - textReservedWidth;
    const barX = x + padding;
    const barY = y + (cellHeight - barHeight) / 2;
    const clampedValue = Math.min(100, Math.max(0, config.value));
    const progressColor = this.getProgressColor(theme, config, clampedValue);
    const trackColor = config.trackColor ?? theme.colors.progress.track;
    const radius = config.borderRadius ?? barHeight / 2;
    ctx.fillStyle = trackColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, radius);
    ctx.fill();
    const progressWidth = clampedValue / 100 * barWidth;
    if (progressWidth > 0) {
      ctx.fillStyle = progressColor;
      ctx.beginPath();
      const actualProgressWidth = Math.max(progressWidth, radius * 2);
      ctx.roundRect(barX, barY, actualProgressWidth, barHeight, radius);
      ctx.fill();
    }
    if (showText) {
      const precision = config.precision ?? 0;
      const text = config.format ? config.format(clampedValue) : `${precision === 0 ? Math.round(clampedValue) : clampedValue.toFixed(precision)}%`;
      let fontSize;
      if (textPosition === "inside") {
        fontSize = Math.min(theme.font.size, Math.max(10, barHeight - 2));
      } else {
        fontSize = size === "small" ? 11 : size === "large" ? 14 : theme.font.size;
      }
      ctx.font = `${fontSize}px ${theme.font.family}`;
      ctx.textBaseline = "middle";
      if (textPosition === "right") {
        ctx.textAlign = "left";
        ctx.fillStyle = config.textColor ?? theme.colors.cellText;
        ctx.fillText(text, barX + barWidth + textGap, y + cellHeight / 2);
      } else {
        ctx.textAlign = "center";
        ctx.fillStyle = config.textColor ?? theme.colors.cellText;
        ctx.fillText(text, barX + barWidth / 2, y + cellHeight / 2);
      }
    }
    ctx.restore();
  }
  renderCircleProgress(ctx, theme, x, y, cellWidth, cellHeight, config) {
    const size = config.size ?? "medium";
    const sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
    const defaultDiameter = Math.floor(STANDARD_ROW_HEIGHT$2 * sizeRatio);
    const diameter = config.width ?? defaultDiameter;
    const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));
    const centerX = x + cellWidth / 2;
    const centerY = y + cellHeight / 2;
    const radius = (diameter - strokeWidth) / 2;
    const clampedValue = Math.min(100, Math.max(0, config.value));
    const progressColor = this.getProgressColor(theme, config, clampedValue);
    const trackColor = config.trackColor ?? theme.colors.progress.track;
    ctx.save();
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    const progress = clampedValue / 100;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;
    if (progress > 0) {
      ctx.strokeStyle = progressColor;
      ctx.lineCap = config.strokeLinecap ?? "round";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
    }
    if (config.showText ?? true) {
      const precision = config.precision ?? 0;
      const text = config.format ? config.format(clampedValue) : `${precision === 0 ? Math.round(clampedValue) : clampedValue.toFixed(precision)}%`;
      ctx.fillStyle = config.textColor ?? theme.colors.cellText;
      const fontSize = Math.max(8, Math.round(diameter * 0.32));
      ctx.font = `bold ${fontSize}px ${theme.font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, centerX, centerY);
    }
    ctx.restore();
  }
  renderDashboardProgress(ctx, theme, x, y, cellWidth, cellHeight, config) {
    const size = config.size ?? "medium";
    const sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
    const defaultDiameter = Math.floor(STANDARD_ROW_HEIGHT$2 * sizeRatio);
    const diameter = config.width ?? defaultDiameter;
    const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.1));
    const centerX = x + cellWidth / 2;
    const centerY = y + cellHeight / 2 + cellHeight * 0.05;
    const radius = (diameter - strokeWidth) / 2;
    const clampedValue = Math.min(100, Math.max(0, config.value));
    const progressColor = this.getProgressColor(theme, config, clampedValue);
    const trackColor = config.trackColor ?? theme.colors.progress.track;
    const startAngle = Math.PI * 0.75;
    const totalAngle = Math.PI * 1.5;
    ctx.save();
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = config.strokeLinecap ?? "round";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle, false);
    ctx.stroke();
    const progress = clampedValue / 100;
    if (progress > 0) {
      const progressEndAngle = startAngle + progress * totalAngle;
      ctx.strokeStyle = progressColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, progressEndAngle, false);
      ctx.stroke();
    }
    if (config.showText ?? true) {
      const precision = config.precision ?? 0;
      const text = config.format ? config.format(clampedValue) : `${precision === 0 ? Math.round(clampedValue) : clampedValue.toFixed(precision)}%`;
      ctx.fillStyle = config.textColor ?? theme.colors.cellText;
      const fontSize = Math.max(8, Math.round(diameter * 0.28));
      ctx.font = `bold ${fontSize}px ${theme.font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, centerX, centerY);
    }
    ctx.restore();
  }
  getProgressColor(theme, config, value) {
    const { color, status } = config;
    if (status === "success") return theme.colors.progress.success;
    if (status === "warning") return theme.colors.progress.warning;
    if (status === "error") return theme.colors.progress.error;
    if (typeof color === "string") return color;
    if (typeof color === "function") return color(value);
    if (Array.isArray(color) && color.length > 0) {
      const sorted = [...color].sort((a, b) => a.value - b.value);
      if (value <= sorted[0].value) return sorted[0].color;
      if (value >= sorted[sorted.length - 1].value) return sorted[sorted.length - 1].color;
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];
        if (value >= curr.value && value <= next.value) {
          const ratio = (value - curr.value) / (next.value - curr.value);
          return this.interpolateColor(curr.color, next.color, ratio);
        }
      }
    }
    return theme.colors.progress.default;
  }
  interpolateColor(color1, color2, ratio) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
const STANDARD_ROW_HEIGHT$1 = 32;
class ImageRenderer extends BaseCellRenderer {
  type = "image";
  render(context) {
    const {
      ctx,
      theme,
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      value,
      isHovered,
      hoveredImageIndex,
      rowIndex,
      imageRuntime
    } = context;
    const config = value;
    if (config.images && config.images.length > 0) {
      this.renderMultipleImages(
        ctx,
        theme,
        x,
        y,
        cellWidth,
        cellHeight,
        config,
        rowIndex,
        isHovered,
        hoveredImageIndex,
        imageRuntime
      );
      return { type: "image", config };
    }
    if (!config.src) {
      return { type: "image", config };
    }
    const src = config.src;
    const padding = 4;
    const maxImgSize = this.getMaxImageSize(cellWidth, cellHeight, padding, config);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const borderRadius = config.circle ? Math.min(imgWidth, imgHeight) / 2 : config.borderRadius ?? 0;
    const imgX = x + (cellWidth - imgWidth) / 2;
    const imgY = y + (cellHeight - imgHeight) / 2;
    ctx.fillStyle = theme.colors.image.placeholderBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
    } else {
      ctx.rect(imgX, imgY, imgWidth, imgHeight);
    }
    ctx.fill();
    const lazyEnabled = config.lazy !== false;
    const threshold = config.lazyThreshold ?? 200;
    const inLazyRange = !(lazyEnabled && rowIndex !== void 0 && rowIndex >= 0 && imageRuntime && !imageRuntime.isInLazyLoadRange(rowIndex, threshold));
    if (!inLazyRange) {
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
        imageRuntime
      );
      if (isHovered && config.hoverable !== false) {
        this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
      }
      return { type: "image", config };
    }
    if (imageRuntime?.isFailed(src)) {
      this.renderImageError(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.errorImage,
        imageRuntime
      );
      return { type: "image", config };
    }
    const cachedImage = imageRuntime?.get(src, Math.max(imgWidth, imgHeight)) ?? null;
    if (cachedImage) {
      ctx.save();
      ctx.beginPath();
      if (borderRadius > 0) {
        ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
      } else {
        ctx.rect(imgX, imgY, imgWidth, imgHeight);
      }
      ctx.clip();
      this.drawImageWithFit(
        ctx,
        cachedImage,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        config.fit ?? "cover"
      );
      ctx.restore();
      imageRuntime?.collectVisible(src);
    } else if (imageRuntime && !imageRuntime.isLoading(src)) {
      imageRuntime.collectVisible(src);
      imageRuntime.load(src, Math.max(imgWidth, imgHeight));
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
        imageRuntime
      );
    } else {
      imageRuntime?.collectVisible(src);
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
        imageRuntime
      );
    }
    if (isHovered && config.hoverable !== false) {
      this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
    }
    return { type: "image", config };
  }
  renderMultipleImages(ctx, theme, x, y, cellWidth, cellHeight, config, rowIndex, isHovered, hoveredImageIndex, imageRuntime) {
    const images = config.images;
    const padding = 4;
    const maxImgSize = this.getMaxImageSize(cellWidth, cellHeight, padding, config);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const gap = config.gap ?? 4;
    const borderRadius = config.circle ? Math.min(imgWidth, imgHeight) / 2 : config.borderRadius ?? 0;
    const showMoreCount = config.showMoreCount !== false;
    const availableWidth = cellWidth - padding * 2;
    const availableHeight = cellHeight - padding * 2;
    const imagesPerRow = Math.max(1, Math.floor((availableWidth + gap) / (imgWidth + gap)));
    const maxRows = Math.max(1, Math.floor((availableHeight + gap) / (imgHeight + gap)));
    const slotCapacity = imagesPerRow * maxRows;
    const requestedMaxVisible = config.maxVisible ?? slotCapacity;
    const needsMoreCount = showMoreCount && images.length > requestedMaxVisible;
    const maxVisibleCapacity = needsMoreCount ? Math.max(0, slotCapacity - 1) : slotCapacity;
    const maxVisible = Math.min(requestedMaxVisible, maxVisibleCapacity);
    const lazyEnabled = config.lazy !== false;
    const threshold = config.lazyThreshold ?? 200;
    let inLazyRange = true;
    if (lazyEnabled && rowIndex !== void 0 && rowIndex >= 0 && imageRuntime) {
      inLazyRange = imageRuntime.isInLazyLoadRange(rowIndex, threshold);
    }
    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;
    const displayImages = images.slice(0, displayCount);
    const moreCount = hasMore ? images.length - maxVisible : 0;
    const renderItemCount = displayCount + (hasMore && showMoreCount ? 1 : 0);
    const displayRows = Math.max(1, Math.ceil(renderItemCount / imagesPerRow));
    const widestRowItems = Math.min(renderItemCount, imagesPerRow);
    const contentWidth = widestRowItems * imgWidth + Math.max(0, widestRowItems - 1) * gap;
    const contentHeight = displayRows * imgHeight + Math.max(0, displayRows - 1) * gap;
    let startX = x + (cellWidth - contentWidth) / 2;
    startX = Math.max(x + padding, startX);
    const startY = y + (cellHeight - contentHeight) / 2;
    for (let i = 0; i < displayImages.length; i++) {
      const src = displayImages[i];
      const row = Math.floor(i / imagesPerRow);
      const col = i % imagesPerRow;
      const imgX = startX + col * (imgWidth + gap);
      const imgY = startY + row * (imgHeight + gap);
      const isCurrentHovered = !!isHovered && config.hoverable !== false && hoveredImageIndex === i;
      ctx.fillStyle = theme.colors.image.placeholderBg;
      ctx.beginPath();
      if (borderRadius > 0) {
        ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
      } else {
        ctx.rect(imgX, imgY, imgWidth, imgHeight);
      }
      ctx.fill();
      if (!inLazyRange) {
        this.renderImagePlaceholder(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
          imageRuntime
        );
        if (isCurrentHovered) {
          this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }
      if (imageRuntime?.isFailed(src)) {
        this.renderImageError(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.errorImage,
          imageRuntime
        );
        if (isCurrentHovered) {
          this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }
      const cachedImage = imageRuntime?.get(src, Math.max(imgWidth, imgHeight)) ?? null;
      if (cachedImage) {
        ctx.save();
        ctx.beginPath();
        if (borderRadius > 0) {
          ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
        } else {
          ctx.rect(imgX, imgY, imgWidth, imgHeight);
        }
        ctx.clip();
        this.drawImageWithFit(
          ctx,
          cachedImage,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          config.fit ?? "cover"
        );
        ctx.restore();
        imageRuntime?.collectVisible(src);
      } else if (imageRuntime && !imageRuntime.isLoading(src)) {
        imageRuntime.collectVisible(src);
        imageRuntime.load(src, Math.max(imgWidth, imgHeight));
        this.renderImagePlaceholder(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
          imageRuntime
        );
      } else {
        imageRuntime?.collectVisible(src);
        this.renderImagePlaceholder(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
          imageRuntime
        );
      }
      if (isCurrentHovered) {
        this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
      }
    }
    if (hasMore && showMoreCount) {
      const lastRow = Math.floor(displayCount / imagesPerRow);
      const lastCol = displayCount % imagesPerRow;
      const countX = startX + lastCol * (imgWidth + gap);
      const countY = startY + lastRow * (imgHeight + gap);
      const isMoreHovered = !!isHovered && config.hoverable !== false && hoveredImageIndex === displayCount;
      this.renderMoreCount(
        ctx,
        theme,
        countX,
        countY,
        imgWidth,
        imgHeight,
        borderRadius,
        moreCount,
        isMoreHovered
      );
    }
  }
  getMaxImageSize(cellWidth, cellHeight, padding, config) {
    const maxHeight = config.scaleWithRowHeight === false ? Math.min(cellHeight, STANDARD_ROW_HEIGHT$1) : cellHeight;
    return Math.max(0, Math.min(cellWidth, maxHeight) - padding * 2);
  }
  renderImagePlaceholder(ctx, theme, x, y, width, height, borderRadius, placeholder, imageRuntime) {
    if (placeholder && imageRuntime) {
      const cachedPlaceholder = imageRuntime.get(placeholder, Math.max(width, height));
      if (cachedPlaceholder) {
        ctx.save();
        ctx.beginPath();
        if (borderRadius > 0) {
          ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          ctx.rect(x, y, width, height);
        }
        ctx.clip();
        this.drawImageWithFit(ctx, cachedPlaceholder, x, y, width, height, "cover");
        ctx.restore();
        return;
      } else if (!imageRuntime.isLoading(placeholder)) {
        imageRuntime.load(placeholder, Math.max(width, height));
      }
    }
    ctx.fillStyle = theme.colors.image.placeholderBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();
    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;
    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    ctx.strokeStyle = theme.colors.placeholderText;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconX - iconSize / 2, iconY + iconSize / 4);
    ctx.lineTo(iconX - iconSize / 4, iconY);
    ctx.lineTo(iconX, iconY + iconSize / 4);
    ctx.lineTo(iconX + iconSize / 4, iconY - iconSize / 4);
    ctx.lineTo(iconX + iconSize / 2, iconY + iconSize / 4);
    ctx.stroke();
    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
  }
  renderImageError(ctx, theme, x, y, width, height, borderRadius, errorImage, imageRuntime) {
    if (errorImage && imageRuntime) {
      const cachedErrorImage = imageRuntime.get(errorImage, Math.max(width, height));
      if (cachedErrorImage) {
        ctx.save();
        ctx.beginPath();
        if (borderRadius > 0) {
          ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          ctx.rect(x, y, width, height);
        }
        ctx.clip();
        this.drawImageWithFit(ctx, cachedErrorImage, x, y, width, height, "cover");
        ctx.restore();
        return;
      } else if (!imageRuntime.isLoading(errorImage) && !imageRuntime.isFailed(errorImage)) {
        imageRuntime.load(errorImage, Math.max(width, height));
      }
    }
    ctx.fillStyle = theme.colors.image.errorBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();
    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;
    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    ctx.strokeStyle = theme.colors.image.errorBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconX - iconSize / 4, iconY - iconSize / 4);
    ctx.lineTo(iconX + iconSize / 4, iconY + iconSize / 4);
    ctx.moveTo(iconX + iconSize / 4, iconY - iconSize / 4);
    ctx.lineTo(iconX - iconSize / 4, iconY + iconSize / 4);
    ctx.stroke();
    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
  }
  renderImageHover(ctx, theme, x, y, width, height, borderRadius) {
    const hoverBorderColor = theme.colors.image.hoverBorder;
    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    ctx.strokeStyle = hoverBorderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = theme.colors.image.hoverShadow;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = hoverBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
  }
  renderMoreCount(ctx, theme, x, y, width, height, borderRadius, count, isHovered) {
    ctx.fillStyle = isHovered ? theme.colors.image.hoverBorder : theme.colors.moreCount.background;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();
    const text = `+${count}`;
    ctx.fillStyle = theme.colors.moreCount.text;
    ctx.font = `bold ${Math.min(width, height) * 0.4}px ${theme.font.family}`;
    const prevAlign = ctx.textAlign;
    const prevBaseline = ctx.textBaseline;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + height / 2);
    ctx.textAlign = prevAlign;
    ctx.textBaseline = prevBaseline;
  }
  drawImageWithFit(ctx, img, x, y, containerWidth, containerHeight, fit) {
    const imgRatio = img.width / img.height;
    const containerRatio = containerWidth / containerHeight;
    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;
    switch (fit) {
      case "fill":
        drawWidth = containerWidth;
        drawHeight = containerHeight;
        drawX = x;
        drawY = y;
        break;
      case "contain":
        if (imgRatio > containerRatio) {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        } else {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;
      case "cover":
        if (imgRatio > containerRatio) {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        } else {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;
      case "none":
      default:
        drawWidth = img.width;
        drawHeight = img.height;
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;
    }
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }
}
class TagsRenderer extends BaseCellRenderer {
  type = "tag";
  render(context) {
    const { ctx, theme, x, y, width, height, value, locale } = context;
    const config = value;
    const padding = 8;
    if (!config.tags || config.tags.length === 0) {
      const placeholder = config.placeholder ?? locale.cell.tagPlaceholder;
      if (placeholder) {
        ctx.fillStyle = theme.colors.placeholderText;
        ctx.font = `${theme.font.size}px ${theme.font.family}`;
        ctx.textBaseline = "middle";
        ctx.fillText(placeholder, x + padding, y + height / 2);
      }
      return { type: "tag", config };
    }
    const tagPadding = 4;
    const tagHeight = theme.font.size + tagPadding * 2;
    const tagRadius = 4;
    const gap = 4;
    const lineGap = 2;
    const textWidthCache = /* @__PURE__ */ new Map();
    const measureTextCached = (text) => {
      let measuredWidth = textWidthCache.get(text);
      if (measuredWidth === void 0) {
        measuredWidth = ctx.measureText(text).width;
        textWidthCache.set(text, measuredWidth);
      }
      return measuredWidth;
    };
    const moreTagWidth = (count) => measureTextCached(`+${count}`) + tagPadding * 2;
    const { lines, processedTags } = layoutTags(ctx, config, width, height, theme.font.size);
    const totalHeight = lines.length * tagHeight + (lines.length - 1) * lineGap;
    const startY = y + (height - totalHeight) / 2;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineY = startY + lineIndex * (tagHeight + lineGap);
      let currentX = x + padding;
      for (const { tag, displayText, width: tagWidth } of line) {
        let bgColor = tag.bgColor ?? (theme.colors.tagColors.default || "#f0f0f0");
        let textColor = tag.color ?? theme.colors.cellText;
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(currentX, lineY, tagWidth, tagHeight, tagRadius);
        ctx.fill();
        ctx.fillStyle = textColor;
        ctx.font = `${theme.font.size}px ${theme.font.family}`;
        ctx.textBaseline = "middle";
        const textY = lineY + tagHeight / 2;
        const textX = currentX + (tagWidth - measureTextCached(displayText)) / 2;
        ctx.fillText(displayText, textX, textY);
        currentX += tagWidth + gap;
      }
      if (lineIndex === lines.length - 1) {
        const remainingCount = config.tags.length - processedTags;
        if (remainingCount > 0) {
          const moreText = `+${remainingCount}`;
          const moreWidth = moreTagWidth(remainingCount);
          ctx.fillStyle = theme.colors.moreCount.background;
          ctx.beginPath();
          ctx.roundRect(currentX, lineY, moreWidth, tagHeight, tagRadius);
          ctx.fill();
          ctx.fillStyle = theme.colors.moreCount.text;
          ctx.font = `${theme.font.size}px ${theme.font.family}`;
          ctx.textBaseline = "middle";
          const textY = lineY + tagHeight / 2;
          const textX = currentX + (moreWidth - measureTextCached(moreText)) / 2;
          ctx.fillText(moreText, textX, textY);
        }
      }
    }
    return { type: "tag", config };
  }
}
class DateRenderer extends BaseCellRenderer {
  type = "date";
  render(context) {
    const { ctx, theme, locale, x, y, width, height, value } = context;
    const config = value;
    const padding = 8;
    const iconWidth = 20;
    ctx.strokeStyle = theme.colors.date.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    let displayText = "";
    if (config.value) {
      const date = config.value instanceof Date ? config.value : new Date(config.value);
      if (!isNaN(date.getTime())) {
        const format = config.format ?? "YYYY-MM-DD";
        displayText = this.formatDate(date, format);
      }
    }
    const placeholder = config.placeholder ?? locale.cell.datePlaceholder;
    const text = displayText || placeholder;
    ctx.fillStyle = displayText ? theme.colors.cellText : theme.colors.placeholderText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";
    const maxTextWidth = width - padding * 2 - iconWidth;
    const ellipsis = "...";
    let finalText = text;
    if (ctx.measureText(text).width > maxTextWidth) {
      let truncated = text;
      while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxTextWidth) {
        truncated = truncated.slice(0, -1);
      }
      finalText = truncated + ellipsis;
    }
    ctx.fillText(finalText, x + padding, y + height / 2);
    ctx.strokeStyle = theme.colors.date.icon;
    ctx.lineWidth = 1.5;
    const iconX = x + width - padding - 10;
    const iconY = y + height / 2;
    ctx.beginPath();
    ctx.moveTo(iconX - 6, iconY - 6);
    ctx.lineTo(iconX - 6, iconY + 6);
    ctx.lineTo(iconX + 6, iconY + 6);
    ctx.lineTo(iconX + 6, iconY - 6);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconX - 6, iconY - 2);
    ctx.lineTo(iconX + 6, iconY - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconX - 3, iconY - 8);
    ctx.lineTo(iconX - 3, iconY - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconX + 3, iconY - 8);
    ctx.lineTo(iconX + 3, iconY - 5);
    ctx.stroke();
    return { type: "date", config };
  }
  formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
  }
}
class SelectRenderer extends BaseCellRenderer {
  type = "select";
  render(context) {
    const { ctx, theme, locale, x, y, width, height, value, multipleSelectSeparator } = context;
    const config = value;
    const padding = 8;
    const arrowWidth = 20;
    ctx.strokeStyle = theme.colors.input.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    const fontSize = theme.font.size;
    const lineHeight = fontSize * 1.5;
    if (config.multiple && Array.isArray(config.value) && config.value.length > 0) {
      const maxRows = this.calculateMaxRows(height, lineHeight, padding);
      const maxTextWidth = width - padding * 2 - arrowWidth;
      const labels = config.value.map((v) => {
        const opt = config.options.find((o) => o.value === v);
        return opt?.label ?? String(v);
      });
      const separator = config.separator ?? multipleSelectSeparator ?? ", ";
      const lines = this.wrapTextToLines(ctx, labels.join(separator), maxTextWidth, maxRows);
      ctx.fillStyle = theme.colors.cellText;
      ctx.font = `${fontSize}px ${theme.font.family}`;
      ctx.textBaseline = "top";
      const totalHeight = lines.length * lineHeight;
      const startY = y + (height - totalHeight) / 2;
      for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
        const line = lines[rowIdx];
        ctx.fillText(line, x + padding, startY + rowIdx * lineHeight + (lineHeight - fontSize) / 2);
      }
    } else {
      let displayText = "";
      if (config.value !== void 0 && config.value !== null) {
        const selectedOption = config.options.find((opt) => opt.value === config.value);
        displayText = selectedOption?.label ?? String(config.value);
      }
      const placeholder = config.placeholder ?? locale.cell.selectPlaceholder;
      const text = displayText || placeholder;
      ctx.fillStyle = displayText ? theme.colors.cellText : theme.colors.placeholderText;
      ctx.font = `${fontSize}px ${theme.font.family}`;
      ctx.textBaseline = "middle";
      const maxTextWidth = width - padding * 2 - arrowWidth;
      const truncatedText = this.truncateText(ctx, text, maxTextWidth);
      ctx.fillText(truncatedText, x + padding, y + height / 2);
    }
    ctx.fillStyle = theme.colors.date.icon;
    ctx.beginPath();
    const arrowX = x + width - padding - 8;
    const arrowY = y + height / 2;
    ctx.moveTo(arrowX - 4, arrowY - 2);
    ctx.lineTo(arrowX, arrowY + 3);
    ctx.lineTo(arrowX + 4, arrowY - 2);
    ctx.closePath();
    ctx.fill();
    return { type: "select", config };
  }
  calculateMaxRows(cellHeight, lineHeight, padding = 8) {
    return Math.max(1, Math.floor((cellHeight - padding * 2) / lineHeight));
  }
  wrapTextToLines(ctx, text, maxWidth, maxRows) {
    const lines = [];
    let currentLine = "";
    for (const char of text) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
        if (lines.length >= maxRows) {
          const lastLine = lines[maxRows - 1];
          const ellipsis = "...";
          let truncated = lastLine;
          while (ctx.measureText(truncated + ellipsis).width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          lines[maxRows - 1] = truncated + ellipsis;
          return lines;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.slice(0, maxRows);
  }
}
class InputRenderer extends BaseCellRenderer {
  type = "input";
  render(context) {
    const { ctx, theme, x, y, width, height, value } = context;
    const config = value;
    const padding = 8;
    ctx.strokeStyle = theme.colors.input.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    const displayText = config.value ?? "";
    const placeholder = config.placeholder ?? "";
    const text = displayText || placeholder;
    ctx.fillStyle = displayText ? theme.colors.cellText : theme.colors.placeholderText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";
    const maxTextWidth = width - padding * 2;
    if (config.multiline) {
      const lineHeight = theme.font.size * 1.5;
      const maxRows = config.maxRows ?? 5;
      const maxVisibleHeight = height - padding * 2;
      const maxVisibleRows = Math.max(1, Math.floor(maxVisibleHeight / lineHeight));
      const actualMaxRows = Math.min(maxRows, maxVisibleRows);
      const lines = this.wrapText(ctx, text, maxTextWidth);
      const visibleLines = lines.slice(0, actualMaxRows);
      const visibleTextHeight = visibleLines.length * lineHeight;
      const textBlockY = y + (height - visibleTextHeight) / 2;
      let textY = textBlockY + lineHeight / 2;
      for (let i = 0; i < visibleLines.length; i++) {
        let lineText = visibleLines[i];
        const isLastVisibleLine = i === visibleLines.length - 1;
        const hasMoreLines = lines.length > visibleLines.length;
        if (isLastVisibleLine) {
          lineText = this.truncateTextWithEllipsis(ctx, lineText, maxTextWidth, hasMoreLines);
        }
        ctx.fillText(lineText, x + padding, textY);
        textY += lineHeight;
      }
    } else {
      const truncatedText = this.truncateTextWithEllipsis(ctx, text, maxTextWidth);
      ctx.fillText(truncatedText, x + padding, y + height / 2);
    }
    return { type: "input", config };
  }
  wrapText(ctx, text, maxWidth) {
    const lines = [];
    const paragraphs = text.split("\n");
    for (const paragraph of paragraphs) {
      if (paragraph === "") {
        lines.push("");
        continue;
      }
      let remaining = paragraph;
      while (remaining.length > 0) {
        const breakPoint = this.findLineBreakPoint(ctx, remaining, maxWidth);
        if (breakPoint === 0) {
          lines.push(remaining[0]);
          remaining = remaining.slice(1);
        } else {
          lines.push(remaining.slice(0, breakPoint));
          remaining = remaining.slice(breakPoint);
        }
      }
    }
    return lines;
  }
  /**
   * 二分查找找到能放入 maxWidth 的最大字符数
   */
  findLineBreakPoint(ctx, text, maxWidth) {
    const len = text.length;
    if (len === 0) return 0;
    if (ctx.measureText(text).width <= maxWidth) {
      return len;
    }
    let left = 1;
    let right = len;
    let result = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const substr = text.slice(0, mid);
      const width = ctx.measureText(substr).width;
      if (width <= maxWidth) {
        result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return result;
  }
  truncateTextWithEllipsis(ctx, text, maxWidth, forceEllipsis = false) {
    const ellipsis = "...";
    const ellipsisWidth = ctx.measureText(ellipsis).width;
    const textWidth = ctx.measureText(text).width;
    if (textWidth <= maxWidth) {
      if (forceEllipsis) {
        if (textWidth + ellipsisWidth <= maxWidth) {
          return text + ellipsis;
        }
        return this.truncateWithEllipsisBinary(ctx, text, maxWidth, ellipsis, ellipsisWidth);
      }
      return text;
    }
    return this.truncateWithEllipsisBinary(ctx, text, maxWidth, ellipsis, ellipsisWidth);
  }
  /**
   * 二分查找截断文本并添加省略号
   */
  truncateWithEllipsisBinary(ctx, text, maxWidth, ellipsis, ellipsisWidth) {
    const targetWidth = maxWidth - ellipsisWidth;
    if (targetWidth <= 0) {
      return ellipsis;
    }
    const len = text.length;
    let left = 0;
    let right = len;
    let result = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const substr = text.slice(0, mid);
      const width = ctx.measureText(substr).width;
      if (width <= targetWidth) {
        result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return text.slice(0, result) + ellipsis;
  }
}
class RatingRenderer extends BaseCellRenderer {
  type = "rating";
  render(context) {
    const { ctx, x, y, width, height, value, isDisabled } = context;
    const config = value;
    const ratingValue = config.value ?? 0;
    const max = config.max ?? 5;
    const configuredStarSize = config.starSize ?? 16;
    const allowHalf = config.allowHalf ?? false;
    const starSize = Math.min(configuredStarSize, Math.floor(width / max));
    const activeColor = config.color ?? "#FFD700";
    const inactiveColor = config.inactiveColor ?? "#E0E0E0";
    const disabledColor = config.disabledColor ?? "#BDBDBD";
    const fillColor = isDisabled ? disabledColor : activeColor;
    const emptyColor = isDisabled ? disabledColor : inactiveColor;
    const totalWidth = max * starSize;
    const startX = x + (width - totalWidth) / 2;
    const startY = y + (height - starSize) / 2;
    ctx.save();
    const starBounds = [];
    for (let i = 0; i < max; i++) {
      const starX = startX + i * starSize;
      starBounds.push({
        index: i,
        x: starX,
        width: starSize
      });
      const starValue = ratingValue - i;
      let fillAmount = 0;
      if (starValue >= 1) {
        fillAmount = 1;
      } else if (starValue > 0) {
        fillAmount = allowHalf ? starValue : 0;
      }
      this.drawStar(ctx, starX, startY, starSize, fillAmount, fillColor, emptyColor);
    }
    ctx.restore();
    return {
      type: "rating",
      config: { ...config, value: ratingValue },
      starBounds
    };
  }
  /**
   * Draw a star at the given position
   * @param ctx Canvas context
   * @param x Star center X
   * @param y Star center Y
   * @param size Star size
   * @param fillAmount Fill amount (0-1, supports half)
   * @param fillColor Fill color
   * @param emptyColor Empty/background color
   */
  drawStar(ctx, x, y, size, fillAmount, fillColor, emptyColor) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const points = this.getStarPoints(centerX, centerY, outerRadius, innerRadius);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = emptyColor;
    ctx.fill();
    if (fillAmount > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, size * fillAmount, size);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.restore();
    }
  }
  /**
   * Calculate star points coordinates
   */
  getStarPoints(centerX, centerY, outerRadius, innerRadius) {
    const points = [];
    const angleStep = Math.PI / 5;
    const startAngle = -Math.PI / 2;
    for (let i = 0; i < 10; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    return points;
  }
}
const STANDARD_ROW_HEIGHT = 32;
class ColorRenderer extends BaseCellRenderer {
  type = "color";
  render(context) {
    const { ctx, theme, x, y, width, height, value, isDisabled } = context;
    const config = value;
    const padding = 8;
    const colorBoxSize = Math.min(STANDARD_ROW_HEIGHT - padding * 2, 24);
    const colorBoxX = x + (width - colorBoxSize) / 2;
    const colorBoxY = y + (height - colorBoxSize) / 2;
    ctx.fillStyle = config.value || "#ffffff";
    ctx.fillRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);
    ctx.strokeStyle = isDisabled ? "#bdbdbd" : "#d9d9d9";
    ctx.lineWidth = 1;
    ctx.strokeRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);
    if (config.showText) {
      ctx.fillStyle = this.getContrastColor(config.value || "#ffffff");
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.value || "", colorBoxX + colorBoxSize / 2, colorBoxY + colorBoxSize / 2);
    }
    return { type: "color", config };
  }
  getContrastColor(hexColor) {
    const rgb = this.hexToRgb(hexColor);
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }
}
class RendererPerformanceMonitor {
  enabled = false;
  stats = /* @__PURE__ */ new Map();
  currentFrame = null;
  frameHistory = [];
  maxFrameHistory = 60;
  // Keep last 60 frames
  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }
  /**
   * Check if monitoring is enabled
   */
  isEnabled() {
    return this.enabled;
  }
  /**
   * Start a new frame
   */
  startFrame() {
    if (!this.enabled) return;
    this.currentFrame = {
      frameStart: performance.now(),
      rendererTimes: /* @__PURE__ */ new Map(),
      totalFrameTime: 0,
      cellCount: 0
    };
  }
  /**
   * End the current frame and record stats
   */
  endFrame() {
    if (!this.enabled || !this.currentFrame) return;
    this.currentFrame.totalFrameTime = performance.now() - this.currentFrame.frameStart;
    this.frameHistory.push(this.currentFrame);
    if (this.frameHistory.length > this.maxFrameHistory) {
      this.frameHistory.shift();
    }
    this.currentFrame = null;
  }
  /**
   * Record a render call
   * @param rendererType The type of renderer
   * @param duration The duration of the render call in ms
   */
  recordRender(rendererType, duration) {
    if (!this.enabled) return;
    const stats = this.stats.get(rendererType) || {
      totalTime: 0,
      callCount: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity
    };
    stats.totalTime += duration;
    stats.callCount++;
    stats.avgTime = stats.totalTime / stats.callCount;
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.minTime = Math.min(stats.minTime, duration);
    this.stats.set(rendererType, stats);
    if (this.currentFrame) {
      const times = this.currentFrame.rendererTimes.get(rendererType) || [];
      times.push(duration);
      this.currentFrame.rendererTimes.set(rendererType, times);
      this.currentFrame.cellCount++;
    }
  }
  /**
   * Measure the execution time of a render function
   */
  measure(rendererType, fn) {
    if (!this.enabled) {
      return fn();
    }
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.recordRender(rendererType, duration);
    return result;
  }
  /**
   * Get stats for a specific renderer
   */
  getStats(rendererType) {
    return this.stats.get(rendererType);
  }
  /**
   * Get all stats
   */
  getAllStats() {
    return new Map(this.stats);
  }
  /**
   * Get average frame time over recent frames
   */
  getAverageFrameTime() {
    if (this.frameHistory.length === 0) return 0;
    const sum = this.frameHistory.reduce((acc, f) => acc + f.totalFrameTime, 0);
    return sum / this.frameHistory.length;
  }
  /**
   * Get FPS based on recent frames
   */
  getFPS() {
    const avgFrameTime = this.getAverageFrameTime();
    if (avgFrameTime === 0) return 0;
    return 1e3 / avgFrameTime;
  }
  /**
   * Get the slowest renderers by average time
   */
  getSlowestRenderers(limit = 5) {
    const entries = Array.from(this.stats.entries()).map(([type, stats]) => ({ type, stats })).sort((a, b) => b.stats.avgTime - a.stats.avgTime).slice(0, limit);
    return entries;
  }
  /**
   * Get frame history
   */
  getFrameHistory() {
    return [...this.frameHistory];
  }
  /**
   * Reset all stats
   */
  reset() {
    this.stats.clear();
    this.frameHistory = [];
    this.currentFrame = null;
  }
  /**
   * Get a formatted report string
   */
  getReport() {
    const lines = [
      "=== Renderer Performance Report ===",
      `Status: ${this.enabled ? "Enabled" : "Disabled"}`,
      `Average Frame Time: ${this.getAverageFrameTime().toFixed(2)}ms`,
      `Estimated FPS: ${this.getFPS().toFixed(1)}`,
      "",
      "Renderer Stats (sorted by avg time):",
      "-".repeat(60)
    ];
    const sorted = this.getSlowestRenderers(20);
    for (const { type, stats } of sorted) {
      lines.push(
        `${type.padEnd(15)} | calls: ${stats.callCount.toString().padStart(6)} | avg: ${stats.avgTime.toFixed(3).padStart(8)}ms | max: ${stats.maxTime.toFixed(3).padStart(8)}ms | total: ${stats.totalTime.toFixed(1).padStart(8)}ms`
      );
    }
    return lines.join("\n");
  }
  /**
   * Print report to console
   */
  printReport() {
    console.log(this.getReport());
  }
}
let globalMonitor = null;
function getPerformanceMonitor() {
  if (!globalMonitor) {
    globalMonitor = new RendererPerformanceMonitor();
  }
  return globalMonitor;
}
class CellRendererRegistry {
  renderers = /* @__PURE__ */ new Map();
  defaultRenderer;
  performanceMonitor;
  locale;
  constructor(locale = zhCN) {
    this.locale = locale;
    this.register(new TextRenderer());
    this.register(new NumberRenderer());
    this.register(new CheckboxRenderer());
    this.register(new RadioRenderer());
    this.register(new ButtonRenderer());
    this.register(new SwitchRenderer());
    this.register(new ProgressRenderer());
    this.register(new ImageRenderer());
    this.register(new TagsRenderer());
    this.register(new DateRenderer());
    this.register(new SelectRenderer());
    this.register(new InputRenderer());
    this.register(new RatingRenderer());
    this.register(new ColorRenderer());
    this.defaultRenderer = new TextRenderer();
    this.performanceMonitor = getPerformanceMonitor();
  }
  setLocale(locale) {
    this.locale = locale;
  }
  /**
   * Enable or disable performance monitoring
   */
  setPerformanceMonitoring(enabled) {
    this.performanceMonitor.setEnabled(enabled);
  }
  /**
   * Check if performance monitoring is enabled
   */
  isPerformanceMonitoringEnabled() {
    return this.performanceMonitor.isEnabled();
  }
  /**
   * Get the performance monitor instance
   */
  getPerformanceMonitor() {
    return this.performanceMonitor;
  }
  /**
   * Start a new frame (call before rendering begins)
   */
  startFrame() {
    this.performanceMonitor.startFrame();
  }
  /**
   * End the current frame (call after rendering completes)
   */
  endFrame() {
    this.performanceMonitor.endFrame();
  }
  /**
   * Register a renderer
   */
  register(renderer) {
    this.renderers.set(renderer.type, renderer);
  }
  /**
   * Get a renderer by cell type
   */
  get(type) {
    return this.renderers.get(type);
  }
  /**
   * Check if a renderer exists for a type
   */
  has(type) {
    return this.renderers.has(type);
  }
  /**
   * Render a cell using the appropriate renderer
   */
  render(context) {
    const cellType = context.column.type ?? "text";
    const renderer = this.renderers.get(cellType) ?? this.defaultRenderer;
    return this.performanceMonitor.measure(cellType, () => renderer.render(context));
  }
  /**
   * Create a render context
   */
  createContext(params) {
    return { ...params, locale: params.locale ?? this.locale };
  }
}
function createCTElement(type, props, ...children) {
  const normalizedChildren = normalizeChildren(children);
  if (typeof type === "function") {
    const mergedProps = { ...props, children: normalizedChildren };
    return type(mergedProps);
  }
  return {
    type,
    props: props || {},
    children: normalizedChildren
  };
}
function normalizeChildren(children) {
  return children.filter((child) => child !== null && child !== void 0 && child !== false).map((child) => {
    if (typeof child === "string") {
      return { type: "CTText", props: { text: child }, children: [] };
    }
    if (typeof child === "number") {
      return { type: "CTText", props: { text: String(child) }, children: [] };
    }
    return child;
  });
}
const ZERO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
class LayoutEngine {
  measurementEngine;
  layoutResults = [];
  /** 当前根元素的父容器尺寸（通常是单元格尺寸），用于解析根元素百分比 */
  rootParentSize;
  /** 单次 layout/layoutTree 调用内的 measureChildSize 缓存 */
  measureCache = /* @__PURE__ */ new Map();
  constructor(measurementEngine) {
    this.measurementEngine = measurementEngine;
  }
  /**
   * 计算元素树布局，返回所有元素的绝对坐标
   * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
   */
  layout(root, startX, startY, parentSize) {
    this.layoutResults = [];
    this.rootParentSize = parentSize;
    this.measureCache.clear();
    try {
      this.layoutElement(root, startX, startY, parentSize);
    } finally {
      this.rootParentSize = void 0;
      this.measureCache.clear();
    }
    return this.layoutResults.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }
  /**
   * 计算元素树布局，返回树形结构（用于渲染时直接定位子元素）
   * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
   */
  layoutTree(root, startX, startY, parentSize, _explicitCacheKey) {
    this.rootParentSize = parentSize;
    this.measureCache.clear();
    try {
      const relative = this.layoutNode(root, 0, 0, parentSize);
      return startX === 0 && startY === 0 ? relative : this.createOffsetLayoutTreeSimple(relative, startX, startY);
    } finally {
      this.rootParentSize = void 0;
      this.measureCache.clear();
    }
  }
  createOffsetLayoutTreeSimple(node, offsetX, offsetY) {
    return {
      ...node,
      x: node.x + offsetX,
      y: node.y + offsetY,
      offsetX,
      offsetY,
      children: node.children.map((child) => this.createOffsetLayoutTreeSimple(child, offsetX, offsetY))
    };
  }
  /** 解析尺寸值（支持百分比字符串和数字） */
  resolveSize(value, parentSize) {
    if (value === void 0) return void 0;
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.endsWith("%")) {
      if (parentSize === void 0) return void 0;
      const percent = parseFloat(value);
      if (isNaN(percent)) return void 0;
      return parentSize * percent / 100;
    }
    return void 0;
  }
  layoutNode(element, x, y, parentSize, presetSize) {
    if (element.type === "CTBox" && element.props.display === "flex") {
      return this.layoutGroupNode(element, x, y, parentSize, presetSize);
    }
    if (element.type === "CTBox" && element.props.position === "relative") {
      return this.layoutPositionedGroupNode(element, x, y, parentSize, presetSize);
    }
    if (element.type === "CTTooltip" || element.type === "CTDropdown") {
      return this.layoutTransparentWrapperNode(element, x, y, parentSize, presetSize);
    }
    let width;
    let height;
    let margin;
    if (presetSize) {
      width = presetSize.width;
      height = presetSize.height;
      margin = presetSize.margin ?? this.parseMargin(element.props.margin);
    } else {
      const size = this.measurementEngine.measureElement(element);
      const clampedSize = this.clampSize(size, element.props, parentSize);
      width = clampedSize.width;
      height = clampedSize.height;
      margin = this.parseMargin(element.props.margin);
    }
    const zIndex = element.props.zIndex;
    return {
      element,
      x,
      y,
      width,
      height,
      zIndex,
      margin,
      children: []
    };
  }
  layoutTransparentWrapperNode(element, x, y, parentSize, presetSize) {
    const child = element.children[0];
    if (!child) {
      const width = presetSize?.width ?? 0;
      const height = presetSize?.height ?? 0;
      return {
        element,
        x,
        y,
        width,
        height,
        margin: presetSize?.margin ?? ZERO_MARGIN,
        children: []
      };
    }
    const childNode = this.layoutNode(child, x, y, parentSize, presetSize);
    return {
      element,
      x: childNode.x,
      y: childNode.y,
      width: childNode.width,
      height: childNode.height,
      zIndex: childNode.zIndex,
      margin: childNode.margin,
      children: [childNode]
    };
  }
  layoutTransparentWrapper(element, x, y, parentSize) {
    const child = element.children[0];
    if (!child) {
      const layout = { x, y, width: 0, height: 0, margin: ZERO_MARGIN };
      this.layoutResults.push(layout);
      return layout;
    }
    return this.layoutElement(child, x, y, parentSize);
  }
  layoutElement(element, x, y, parentSize) {
    if (element.type === "CTBox" && element.props.display === "flex") {
      return this.layoutGroup(element, x, y, parentSize);
    }
    if (element.type === "CTBox" && element.props.position === "relative") {
      return this.layoutPositionedGroup(element, x, y, parentSize);
    }
    if (element.type === "CTTooltip" || element.type === "CTDropdown") {
      return this.layoutTransparentWrapper(element, x, y, parentSize);
    }
    const size = this.measurementEngine.measureElement(element);
    const clampedSize = this.clampSize(size, element.props, parentSize);
    const zIndex = element.props.zIndex;
    const margin = this.parseMargin(element.props.margin);
    const layout = {
      x,
      y,
      width: clampedSize.width,
      height: clampedSize.height,
      zIndex,
      margin
    };
    this.layoutResults.push(layout);
    return layout;
  }
  /**
   * 解析容器自身尺寸：优先使用 width/height（支持百分比），否则用 fallback（内容尺寸）
   * 根元素（即 parentSize 来自外部传入时）默认撑满父容器
   */
  resolveContainerSize(props, parentSize, fallbackWidth, fallbackHeight, isRoot) {
    const parentW = parentSize?.width;
    const parentH = parentSize?.height;
    let width = this.resolveSize(props.width, parentW);
    let height = this.resolveSize(props.height, parentH);
    if (width === void 0) {
      width = isRoot && parentW !== void 0 ? parentW : fallbackWidth;
    }
    if (height === void 0) {
      height = isRoot && parentH !== void 0 ? parentH : fallbackHeight;
    }
    const minWidth = this.resolveSize(props.minWidth, parentW);
    const maxWidth = this.resolveSize(props.maxWidth, parentW);
    const minHeight = this.resolveSize(props.minHeight, parentH);
    const maxHeight = this.resolveSize(props.maxHeight, parentH);
    return {
      width: this.clampValue(width, minWidth, maxWidth),
      height: this.clampValue(height, minHeight, maxHeight)
    };
  }
  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  layoutPositionedGroup(group, x, y, parentSize) {
    const props = group.props;
    const children = group.children || [];
    const isRoot = parentSize !== void 0 && parentSize === this.rootParentSize;
    const { width: groupWidth, height: groupHeight } = this.resolveContainerSize(
      props,
      parentSize,
      100,
      100,
      isRoot
    );
    const sortedChildren = [...children].sort((a, b) => {
      const aZ = a.props.zIndex ?? 0;
      const bZ = b.props.zIndex ?? 0;
      return aZ - bZ;
    });
    const childParentSize = { width: groupWidth, height: groupHeight };
    for (const child of sortedChildren) {
      const childX = x + (child.props.x ?? 0);
      const childY = y + (child.props.y ?? 0);
      this.layoutElement(child, childX, childY, childParentSize);
    }
    const groupLayout = { x, y, width: groupWidth, height: groupHeight };
    this.layoutResults.push(groupLayout);
    return groupLayout;
  }
  layoutPositionedGroupNode(group, x, y, parentSize, presetSize) {
    const props = group.props;
    const children = group.children || [];
    const isRoot = parentSize !== void 0 && parentSize === this.rootParentSize;
    let groupWidth;
    let groupHeight;
    if (presetSize) {
      groupWidth = presetSize.width;
      groupHeight = presetSize.height;
    } else {
      const resolved = this.resolveContainerSize(props, parentSize, 100, 100, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    }
    const sortedChildren = [...children].sort((a, b) => {
      const aZ = a.props.zIndex ?? 0;
      const bZ = b.props.zIndex ?? 0;
      return aZ - bZ;
    });
    const childParentSize = { width: groupWidth, height: groupHeight };
    const childNodes = sortedChildren.map((child) => {
      const childX = x + (child.props.x ?? 0);
      const childY = y + (child.props.y ?? 0);
      return this.layoutNode(child, childX, childY, childParentSize);
    });
    return {
      element: group,
      x,
      y,
      width: groupWidth,
      height: groupHeight,
      children: childNodes
    };
  }
  layoutGroup(group, x, y, parentSize) {
    const props = group.props;
    const children = group.children || [];
    const isRoot = parentSize !== void 0 && parentSize === this.rootParentSize;
    const padding = this.parsePadding(props.padding);
    const hasExplicitWidth = props.width !== void 0 || isRoot && parentSize?.width !== void 0;
    const hasExplicitHeight = props.height !== void 0 || isRoot && parentSize?.height !== void 0;
    let groupWidth;
    let groupHeight;
    if (hasExplicitWidth && hasExplicitHeight) {
      const resolved = this.resolveContainerSize(props, parentSize, 0, 0, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    } else {
      const tempSizes = children.map((child) => this.measureChildSize(child));
      const contentWidth = this.calculateContentSize(tempSizes, props);
      const contentHeight = this.calculateContentHeight(tempSizes, props);
      const fallbackW = contentWidth + padding.left + padding.right;
      const fallbackH = contentHeight + padding.top + padding.bottom;
      const resolved = this.resolveContainerSize(props, parentSize, fallbackW, fallbackH, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    }
    const childContentSize = {
      width: groupWidth - padding.left - padding.right,
      height: groupHeight - padding.top - padding.bottom
    };
    const childSizes = children.map(
      (child) => this.measureChildSize(child, childContentSize)
    );
    const contentX = x + padding.left;
    const contentY = y + padding.top;
    this.layoutChildren(
      children,
      childSizes,
      contentX,
      contentY,
      props,
      groupWidth,
      groupHeight,
      childContentSize
    );
    const groupLayout = { x, y, width: groupWidth, height: groupHeight };
    this.layoutResults.push(groupLayout);
    return groupLayout;
  }
  layoutGroupNode(group, x, y, parentSize, presetSize) {
    const props = group.props;
    const children = group.children || [];
    const isRoot = parentSize !== void 0 && parentSize === this.rootParentSize;
    const padding = this.parsePadding(props.padding);
    let groupWidth;
    let groupHeight;
    let childSizes;
    const hasExplicitWidth = props.width !== void 0 || isRoot && parentSize?.width !== void 0;
    const hasExplicitHeight = props.height !== void 0 || isRoot && parentSize?.height !== void 0;
    if (presetSize) {
      groupWidth = presetSize.width;
      groupHeight = presetSize.height;
    } else if (hasExplicitWidth && hasExplicitHeight) {
      const resolved = this.resolveContainerSize(props, parentSize, 0, 0, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    } else {
      const tempSizes = children.map((child) => this.measureChildSize(child));
      const contentWidth2 = this.calculateContentSize(tempSizes, props);
      const contentHeight2 = this.calculateContentHeight(tempSizes, props);
      const fallbackW = contentWidth2 + padding.left + padding.right;
      const fallbackH = contentHeight2 + padding.top + padding.bottom;
      const resolved = this.resolveContainerSize(props, parentSize, fallbackW, fallbackH, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    }
    const childContentSize = {
      width: groupWidth - padding.left - padding.right,
      height: groupHeight - padding.top - padding.bottom
    };
    childSizes = children.map((child) => this.measureChildSize(child, childContentSize));
    const contentX = x + padding.left;
    const contentY = y + padding.top;
    const direction = props.flexDirection ?? "row";
    const justifyContent = props.justifyContent ?? "flex-start";
    const alignItems = props.alignItems ?? "flex-start";
    let gap = props.gap ?? 0;
    const availableWidth = childContentSize.width;
    const availableHeight = childContentSize.height;
    const contentWidth = this.calculateContentSize(childSizes, props);
    const contentHeight = this.calculateContentHeight(childSizes, props);
    let mainOffset = 0;
    if (direction === "row" || direction === "row-reverse") {
      mainOffset = this.calcMainOffset(
        availableWidth,
        contentWidth,
        justifyContent,
        childSizes,
        children.length,
        gap
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
        gap = (availableWidth - totalChild) / (children.length - 1);
      } else if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      } else if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    } else {
      mainOffset = this.calcMainOffset(
        availableHeight,
        contentHeight,
        justifyContent,
        childSizes,
        children.length,
        gap
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = childSizes.reduce((s, c) => s + c.height, 0);
        gap = (availableHeight - totalChild) / (children.length - 1);
      } else if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      } else if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    }
    let currentMain = mainOffset;
    const childNodes = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const size = childSizes[i];
      const childMargin = size.margin ?? ZERO_MARGIN;
      const childWidth = size.width - childMargin.left - childMargin.right;
      const childHeight = size.height - childMargin.top - childMargin.bottom;
      const effectiveAlignSelf = child.props.alignSelf ?? alignItems;
      let crossOffset = 0;
      if (direction === "row" || direction === "row-reverse") {
        crossOffset = this.calcCrossOffset(availableHeight, childHeight, effectiveAlignSelf);
      } else {
        crossOffset = this.calcCrossOffset(availableWidth, childWidth, effectiveAlignSelf);
      }
      let childX, childY;
      if (direction === "row") {
        childX = contentX + currentMain + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "row-reverse") {
        childX = contentX + availableWidth - currentMain - size.width + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "column") {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + currentMain + childMargin.top;
      } else {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + availableHeight - currentMain - size.height + childMargin.top;
      }
      childNodes.push(
        this.layoutNode(child, childX, childY, childContentSize, {
          width: childWidth,
          height: childHeight,
          margin: childMargin
        })
      );
      currentMain += (direction === "row" || direction === "row-reverse" ? size.width : size.height) + gap;
    }
    return {
      element: group,
      x,
      y,
      width: groupWidth,
      height: groupHeight,
      children: childNodes
    };
  }
  /**
   * 测量子元素尺寸（包含 margin），用于 flex 布局计算
   * @param parentSize 父容器内容区尺寸，用于解析子元素的百分比 width/height
   *
   * 单次布局内对相同 (element, parentSize) 的请求记忆化。
   */
  measureChildSize(child, parentSize) {
    let bucket = this.measureCache.get(child);
    if (bucket) {
      for (let i = 0; i < bucket.length; i++) {
        const entry = bucket[i];
        if (this.parentSizeMatches(entry.parentSize, parentSize)) {
          return entry.size;
        }
      }
    }
    const margin = this.parseMargin(child.props.margin);
    let result;
    if (child.type === "CTBox" && child.props.display === "flex") {
      const groupSize = this.measureGroupSize(child, parentSize);
      result = {
        x: 0,
        y: 0,
        width: groupSize.width + margin.left + margin.right,
        height: groupSize.height + margin.top + margin.bottom,
        margin
      };
    } else if (child.type === "CTBox" && child.props.position === "relative") {
      const props = child.props;
      const parentW = parentSize?.width;
      const parentH = parentSize?.height;
      const w = this.resolveSize(props.width, parentW) ?? 100;
      const h = this.resolveSize(props.height, parentH) ?? 100;
      const minW = this.resolveSize(props.minWidth, parentW);
      const maxW = this.resolveSize(props.maxWidth, parentW);
      const minH = this.resolveSize(props.minHeight, parentH);
      const maxH = this.resolveSize(props.maxHeight, parentH);
      result = {
        x: 0,
        y: 0,
        width: this.clampValue(w, minW, maxW) + margin.left + margin.right,
        height: this.clampValue(h, minH, maxH) + margin.top + margin.bottom,
        margin
      };
    } else {
      const size = this.measurementEngine.measureElement(child);
      const clampedSize = this.clampSize(size, child.props, parentSize);
      result = {
        x: 0,
        y: 0,
        width: clampedSize.width + margin.left + margin.right,
        height: clampedSize.height + margin.top + margin.bottom,
        margin
      };
    }
    if (!bucket) {
      bucket = [];
      this.measureCache.set(child, bucket);
    }
    bucket.push({
      size: result,
      parentSize: parentSize ? { ...parentSize } : void 0
    });
    return result;
  }
  /**
   * 测量 group 尺寸，不影响 layoutResults
   *
   * 显式尺寸短路：当 props.width/height 已显式给出时，不递归测量子元素，
   * 仅基于声明值（含 min/max clamp）返回容器尺寸。
   */
  measureGroupSize(group, parentSize) {
    const props = group.props;
    const children = group.children || [];
    const padding = this.parsePadding(props.padding);
    const parentW = parentSize?.width;
    const parentH = parentSize?.height;
    const explicitWidth = this.resolveSize(props.width, parentW);
    const explicitHeight = this.resolveSize(props.height, parentH);
    let groupWidth;
    let groupHeight;
    if (explicitWidth !== void 0 && explicitHeight !== void 0) {
      groupWidth = explicitWidth;
      groupHeight = explicitHeight;
    } else {
      const childSizes = children.map((child) => this.measureChildSize(child));
      const contentWidth = this.calculateContentSize(childSizes, props);
      const contentHeight = this.calculateContentHeight(childSizes, props);
      groupWidth = explicitWidth ?? contentWidth + padding.left + padding.right;
      groupHeight = explicitHeight ?? contentHeight + padding.top + padding.bottom;
    }
    const minW = this.resolveSize(props.minWidth, parentW);
    const maxW = this.resolveSize(props.maxWidth, parentW);
    const minH = this.resolveSize(props.minHeight, parentH);
    const maxH = this.resolveSize(props.maxHeight, parentH);
    return {
      x: 0,
      y: 0,
      width: this.clampValue(groupWidth, minW, maxW),
      height: this.clampValue(groupHeight, minH, maxH)
    };
  }
  // ─── Helpers ───
  parsePadding(padding) {
    if (padding === void 0) return { top: 0, right: 0, bottom: 0, left: 0 };
    if (typeof padding === "number")
      return { top: padding, right: padding, bottom: padding, left: padding };
    return {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0
    };
  }
  parseMargin(margin) {
    if (margin === void 0) return { top: 0, right: 0, bottom: 0, left: 0 };
    if (typeof margin === "number")
      return { top: margin, right: margin, bottom: margin, left: margin };
    return {
      top: margin.top ?? 0,
      right: margin.right ?? 0,
      bottom: margin.bottom ?? 0,
      left: margin.left ?? 0
    };
  }
  clampValue(value, min, max) {
    if (min !== void 0) value = Math.max(min, value);
    if (max !== void 0) value = Math.min(max, value);
    return value;
  }
  clampSize(size, props, parentSize) {
    const parentW = parentSize?.width;
    const parentH = parentSize?.height;
    const minWidth = this.resolveSize(props.minWidth, parentW);
    const maxWidth = this.resolveSize(props.maxWidth, parentW);
    const minHeight = this.resolveSize(props.minHeight, parentH);
    const maxHeight = this.resolveSize(props.maxHeight, parentH);
    return {
      x: size.x,
      y: size.y,
      width: this.clampValue(size.width, minWidth, maxWidth),
      height: this.clampValue(size.height, minHeight, maxHeight)
    };
  }
  calcMainOffset(availableSize, contentSize, justifyContent, childSizes, childCount, _gap) {
    if (justifyContent === "center") return (availableSize - contentSize) / 2;
    if (justifyContent === "flex-end") return availableSize - contentSize;
    if (justifyContent === "space-between" && childCount > 1) {
      return 0;
    }
    if (justifyContent === "space-around" && childCount > 0) {
      const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
      const space = (availableSize - totalChild) / childCount;
      return space / 2;
    }
    if (justifyContent === "space-evenly" && childCount > 0) {
      const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
      const space = (availableSize - totalChild) / (childCount + 1);
      return space;
    }
    return 0;
  }
  calcCrossOffset(availableSize, childSize, align) {
    if (align === "center") return (availableSize - childSize) / 2;
    if (align === "flex-end") return availableSize - childSize;
    if (align === "stretch") return 0;
    return 0;
  }
  calculateContentSize(sizes, props) {
    const gap = props.gap ?? 0;
    const direction = props.flexDirection ?? "row";
    if (direction === "row" || direction === "row-reverse") {
      const totalWidth = sizes.reduce((sum, s) => sum + s.width, 0);
      const gaps = sizes.length > 1 ? (sizes.length - 1) * gap : 0;
      return totalWidth + gaps;
    } else {
      return Math.max(...sizes.map((s) => s.width), 0);
    }
  }
  calculateContentHeight(sizes, props) {
    const gap = props.gap ?? 0;
    const direction = props.flexDirection ?? "row";
    if (direction === "column" || direction === "column-reverse") {
      const totalHeight = sizes.reduce((sum, s) => sum + s.height, 0);
      const gaps = sizes.length > 1 ? (sizes.length - 1) * gap : 0;
      return totalHeight + gaps;
    } else {
      return Math.max(...sizes.map((s) => s.height), 0);
    }
  }
  layoutChildren(children, sizes, contentX, contentY, props, _groupWidth, _groupHeight, childContentSize) {
    const direction = props.flexDirection ?? "row";
    const justifyContent = props.justifyContent ?? "flex-start";
    const alignItems = props.alignItems ?? "flex-start";
    let gap = props.gap ?? 0;
    const contentWidth = this.calculateContentSize(sizes, props);
    const contentHeight = this.calculateContentHeight(sizes, props);
    const availableWidth = childContentSize.width;
    const availableHeight = childContentSize.height;
    let mainOffset = 0;
    if (direction === "row" || direction === "row-reverse") {
      mainOffset = this.calcMainOffset(
        availableWidth,
        contentWidth,
        justifyContent,
        sizes,
        children.length,
        gap
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = sizes.reduce((s, c) => s + c.width, 0);
        gap = (availableWidth - totalChild) / (children.length - 1);
      }
      if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      }
      if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    } else {
      mainOffset = this.calcMainOffset(
        availableHeight,
        contentHeight,
        justifyContent,
        sizes,
        children.length,
        gap
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = sizes.reduce((s, c) => s + c.height, 0);
        gap = (availableHeight - totalChild) / (children.length - 1);
      }
      if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      }
      if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    }
    let currentMain = mainOffset;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const size = sizes[i];
      const childMargin = size.margin ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
      const childWidth = size.width - childMargin.left - childMargin.right;
      const childHeight = size.height - childMargin.top - childMargin.bottom;
      const effectiveAlign = child.props.alignSelf ?? alignItems;
      let crossOffset = 0;
      if (direction === "row" || direction === "row-reverse") {
        crossOffset = this.calcCrossOffset(availableHeight, childHeight, effectiveAlign);
      } else {
        crossOffset = this.calcCrossOffset(availableWidth, childWidth, effectiveAlign);
      }
      let childX, childY;
      if (direction === "row") {
        childX = contentX + currentMain + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "row-reverse") {
        childX = contentX + availableWidth - currentMain - size.width + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "column") {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + currentMain + childMargin.top;
      } else {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + availableHeight - currentMain - size.height + childMargin.top;
      }
      this.layoutElement(child, childX, childY, childContentSize);
      currentMain += (direction === "row" || direction === "row-reverse" ? size.width : size.height) + gap;
    }
  }
  // ─── measureCache / parent size match helpers ───
  parentSizeMatches(cachedParentSize, parentSize) {
    if (cachedParentSize === void 0 || parentSize === void 0) {
      return cachedParentSize === void 0 && parentSize === void 0;
    }
    return cachedParentSize.width === parentSize.width && cachedParentSize.height === parentSize.height;
  }
}
const TEXT_WIDTH_CACHE = /* @__PURE__ */ new Map();
const TEXT_WIDTH_CACHE_MAX = 2e3;
class MeasurementEngine {
  ctx;
  constructor(ctx) {
    this.ctx = ctx;
  }
  setContext(ctx) {
    this.ctx = ctx;
  }
  measureTextWidth(text, fontSize, fontFamily, fontWeight, fontStyle) {
    const normalizedFontStyle = fontStyle ?? "normal";
    const normalizedFontWeight = fontWeight ?? "normal";
    const cacheKey = `${normalizedFontStyle}|${normalizedFontWeight}|${fontSize}|${fontFamily}|${text}`;
    const cached = TEXT_WIDTH_CACHE.get(cacheKey);
    if (cached !== void 0) {
      TEXT_WIDTH_CACHE.delete(cacheKey);
      TEXT_WIDTH_CACHE.set(cacheKey, cached);
      return cached;
    }
    this.ctx.font = `${normalizedFontStyle} ${normalizedFontWeight} ${fontSize}px ${fontFamily}`;
    const width = this.ctx.measureText(text).width;
    if (TEXT_WIDTH_CACHE.size >= TEXT_WIDTH_CACHE_MAX) {
      const oldestKey = TEXT_WIDTH_CACHE.keys().next().value;
      if (oldestKey !== void 0) TEXT_WIDTH_CACHE.delete(oldestKey);
    }
    TEXT_WIDTH_CACHE.set(cacheKey, width);
    return width;
  }
  measureElement(element) {
    switch (element.type) {
      case "CTText":
        return this.measureText(element);
      case "CTBox":
        return this.measureBox(element);
      case "CTCircle":
        return this.measureCircle(element);
      case "CTImage":
        return this.measureImage(element);
      case "CTLine":
        return this.measureLine(element);
      case "CTTooltip":
      case "CTDropdown":
        return element.children[0] ? this.measureElement(element.children[0]) : { x: 0, y: 0, width: 0, height: 0 };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }
  measureText(element) {
    const props = element.props;
    const fontSize = props.fontSize ?? 14;
    const fontFamily = props.fontFamily ?? "Arial";
    const lineHeight = props.lineHeight ?? fontSize;
    const fontWeight = props.fontWeight ?? "normal";
    const fontStyle = props.fontStyle ?? "normal";
    const letterSpacing = props.letterSpacing ?? 0;
    let width = this.measureTextWidth(props.text, fontSize, fontFamily, fontWeight, fontStyle);
    if (letterSpacing > 0 && props.text.length > 1) {
      width += letterSpacing * (props.text.length - 1);
    }
    if (props.maxWidth && width > props.maxWidth) {
      width = props.maxWidth;
    }
    return { x: 0, y: 0, width, height: lineHeight };
  }
  measureBox(element) {
    const props = element.props;
    return { x: 0, y: 0, width: props.width ?? 0, height: props.height ?? 0 };
  }
  measureCircle(element) {
    const props = element.props;
    const diameter = props.radius * 2;
    return { x: 0, y: 0, width: diameter, height: diameter };
  }
  measureImage(element) {
    const props = element.props;
    return { x: 0, y: 0, width: props.width, height: props.height };
  }
  measureLine(element) {
    const props = element.props;
    if (props.points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const xs = props.points.map((p) => p.x);
    const ys = props.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
const SIGNATURE_CACHE = /* @__PURE__ */ new WeakMap();
const LAYOUT_PROPS = /* @__PURE__ */ new Set([
  "type",
  "display",
  "position",
  "x",
  "y",
  "zIndex",
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "padding",
  "margin",
  "gap",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "alignSelf",
  "radius",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "lineHeight",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "text"
]);
class JSXElementSignature {
  static layout(element) {
    let entry = SIGNATURE_CACHE.get(element);
    if (entry?.layout !== void 0) return entry.layout;
    const sig = this.elementSignature(element, "layout");
    entry = entry ?? { layout: void 0, visual: void 0 };
    entry.layout = sig;
    SIGNATURE_CACHE.set(element, entry);
    return sig;
  }
  static visual(element) {
    let entry = SIGNATURE_CACHE.get(element);
    if (entry?.visual !== void 0) return entry.visual;
    const sig = this.elementSignature(element, "visual");
    entry = entry ?? { layout: void 0, visual: void 0 };
    entry.visual = sig;
    SIGNATURE_CACHE.set(element, entry);
    return sig;
  }
  static elementSignature(element, mode) {
    const parts = [];
    this.appendElementSignature(element, mode, parts);
    return parts.join("|");
  }
  static appendElementSignature(element, mode, parts) {
    parts.push(`type:${element.type}`);
    this.appendPropsSignature(element.props, parts, mode === "layout" ? LAYOUT_PROPS : void 0);
    parts.push(`children:${element.children.length}`);
    for (const child of element.children) {
      this.appendElementSignature(child, mode, parts);
    }
  }
  static appendPropsSignature(props, parts, allowedProps) {
    const propParts = [];
    for (const key of Object.keys(props).sort()) {
      const value = props[key];
      if (this.isEventCallbackProp(key, value)) continue;
      if (allowedProps && !allowedProps.has(key)) continue;
      propParts.push(`${key}:${this.valueSignature(value)}`);
    }
    parts.push(`props{${propParts.join(",")}}`);
  }
  static isEventCallbackProp(key, value) {
    return typeof value === "function" && /^on[A-Z]/.test(key);
  }
  static valueSignature(value) {
    if (value === null) return "null";
    if (value === void 0) return "undefined";
    if (typeof value === "string") return `string:${value}`;
    if (typeof value === "number") return `number:${value}`;
    if (typeof value === "boolean") return `boolean:${value}`;
    if (typeof value === "function") return "function";
    if (Array.isArray(value)) {
      return `array:[${value.map((item) => this.valueSignature(item)).join(",")}]`;
    }
    if (typeof value === "object") {
      return `object:{${Object.keys(value).sort().map((key) => `${key}:${this.valueSignature(value[key])}`).join(",")}}`;
    }
    return String(value);
  }
}
class JSXRenderCache {
  maxPlans;
  plans = /* @__PURE__ */ new Map();
  stats = {
    planHits: 0,
    planMisses: 0,
    planEvictions: 0
  };
  constructor(options = {}) {
    this.maxPlans = options.maxPlans ?? 500;
  }
  getOrCreatePlan(key, factory) {
    const cached = this.plans.get(key);
    if (cached) {
      this.stats.planHits++;
      this.plans.delete(key);
      this.plans.set(key, cached);
      return cached;
    }
    this.stats.planMisses++;
    const plan = factory();
    this.plans.set(key, plan);
    if (this.plans.size > this.maxPlans) {
      const oldest = this.plans.keys().next().value;
      if (oldest !== void 0) {
        this.plans.delete(oldest);
        this.stats.planEvictions++;
      }
    }
    return plan;
  }
  clear() {
    this.plans.clear();
  }
  resetStats() {
    this.stats = {
      planHits: 0,
      planMisses: 0,
      planEvictions: 0
    };
  }
  getStats() {
    return { ...this.stats };
  }
}
class CTElementRenderer {
  ctx;
  layoutEngine;
  theme;
  renderContext;
  layouts;
  layoutTree;
  renderCache = new JSXRenderCache();
  gradientCache = /* @__PURE__ */ new Map();
  static GRADIENT_CACHE_MAX = 200;
  // Store render position for cell offscreen cache
  cellX = 0;
  cellY = 0;
  constructor(ctx, layoutEngine, theme, renderContext) {
    this.ctx = ctx;
    this.layoutEngine = layoutEngine;
    this.theme = theme;
    this.renderContext = renderContext;
  }
  render(root, x, y, parentSize, layoutCacheKey) {
    this.cellX = x;
    this.cellY = y;
    const planKey = this.buildRenderPlanKey(root, parentSize, layoutCacheKey);
    const layoutTree = this.renderCache.getOrCreatePlan(planKey, () => {
      return this.layoutEngine.layoutTree(root, 0, 0, parentSize, layoutCacheKey);
    });
    this.layoutTree = layoutTree;
    this.layouts = void 0;
    this.ctx.save();
    this.ctx.translate(x, y);
    try {
      this.renderLayoutNode(layoutTree, root, 0, 0);
    } finally {
      this.ctx.restore();
    }
  }
  getRenderCacheStats() {
    return this.renderCache.getStats();
  }
  invalidateOffscreen(_scope) {
    this.renderCache.clear();
    this.gradientCache.clear();
  }
  getLayouts() {
    if (!this.layouts && this.layoutTree) {
      this.layouts = this.flattenLayoutTree(this.layoutTree, this.cellX, this.cellY);
    }
    return this.layouts ?? [];
  }
  setContext(ctx) {
    this.ctx = ctx;
    this.renderCache.clear();
    this.gradientCache.clear();
  }
  setTheme(theme) {
    this.theme = theme;
    this.renderCache.clear();
    this.gradientCache.clear();
  }
  setRenderContext(renderContext) {
    this.renderContext = renderContext;
  }
  buildRenderPlanKey(root, parentSize, layoutCacheKey) {
    const sizeKey = parentSize ? `${parentSize.width}x${parentSize.height}` : "auto";
    if (layoutCacheKey) {
      return `${layoutCacheKey}|${sizeKey}`;
    }
    return `${sizeKey}|${JSXElementSignature.layout(root)}|${JSXElementSignature.visual(root)}`;
  }
  flattenLayoutTree(node, offsetX = 0, offsetY = 0) {
    const result = [
      {
        x: node.x + offsetX,
        y: node.y + offsetY,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex,
        margin: node.margin
      }
    ];
    for (const child of node.children) {
      result.push(...this.flattenLayoutTree(child, offsetX, offsetY));
    }
    return result;
  }
  getLayoutOrderedChildren(element) {
    const children = element.children || [];
    if (element.type === "CTBox" && element.props.position === "relative") {
      return [...children].sort((a, b) => {
        const aZ = a.props.zIndex ?? 0;
        const bZ = b.props.zIndex ?? 0;
        return aZ - bZ;
      });
    }
    return children;
  }
  renderLayoutNode(node, currentElement = node.currentElement ?? node.element, offsetX = 0, offsetY = 0) {
    const x = node.x + offsetX;
    const y = node.y + offsetY;
    switch (currentElement.type) {
      case "CTBox":
        this.renderBoxNode(node, currentElement, x, y, offsetX, offsetY);
        break;
      case "CTCircle":
        this.renderCircle(currentElement, x, y);
        break;
      case "CTText":
        this.renderText(currentElement, x, y, node.width);
        break;
      case "CTImage":
        this.renderImage(currentElement, x, y);
        break;
      case "CTLine":
        this.renderLine(currentElement, x, y);
        break;
      case "CTTooltip":
      case "CTDropdown":
        this.renderInteractiveWrapperNode(node, currentElement, x, y, offsetX, offsetY);
        break;
    }
  }
  renderInteractiveWrapperNode(node, element, x, y, offsetX, offsetY) {
    const regionType = element.type === "CTTooltip" ? "tooltip" : "dropdown";
    this.renderContext?.collectInteractiveRegion?.({
      type: regionType,
      rect: {
        x: x + this.cellX,
        y: y + this.cellY,
        width: node.width,
        height: node.height
      },
      element,
      props: element.props,
      row: this.renderContext.row,
      column: this.renderContext.column,
      rowIndex: this.renderContext.rowIndex,
      colIndex: this.renderContext.colIndex
    });
    const currentChildren = this.getLayoutOrderedChildren(element);
    const childOffsetX = offsetX + (node.offsetX ?? 0);
    const childOffsetY = offsetY + (node.offsetY ?? 0);
    for (let index = 0; index < node.children.length; index++) {
      const childNode = node.children[index];
      const childElement = currentChildren[index];
      if (!childElement) continue;
      this.renderLayoutNode(childNode, childElement, childOffsetX, childOffsetY);
    }
  }
  getBorderRadiusArray(props, defaultValue) {
    const tl = props.borderTopLeftRadius ?? defaultValue;
    const tr = props.borderTopRightRadius ?? defaultValue;
    const br = props.borderBottomRightRadius ?? defaultValue;
    const bl = props.borderBottomLeftRadius ?? defaultValue;
    if (tl === tr && tr === br && br === bl) return tl;
    return [tl, tr, br, bl];
  }
  drawRoundedRect(x, y, w, h, radii) {
    this.ctx.beginPath();
    if (typeof radii === "number" && radii === 0) {
      this.ctx.rect(x, y, w, h);
    } else {
      this.ctx.roundRect(x, y, w, h, radii);
    }
  }
  createGradientFill(w, h, gradient) {
    const cacheKey = this.getGradientCacheKey(w, h, gradient);
    const cached = this.gradientCache.get(cacheKey);
    if (cached) {
      this.gradientCache.delete(cacheKey);
      this.gradientCache.set(cacheKey, cached);
      return cached;
    }
    const created = this.createRelativeGradientFill(w, h, gradient);
    this.gradientCache.set(cacheKey, created);
    if (this.gradientCache.size > CTElementRenderer.GRADIENT_CACHE_MAX) {
      const oldest = this.gradientCache.keys().next().value;
      if (oldest) this.gradientCache.delete(oldest);
    }
    return created;
  }
  getGradientCacheKey(w, h, gradient) {
    return `${w}x${h}|${gradient.type}|${gradient.type === "linear" ? gradient.angle : "_"}|${gradient.colors.join(",")}`;
  }
  createRelativeGradientFill(w, h, gradient) {
    if (gradient.type === "linear") {
      const angle = gradient.angle;
      const rad = (angle - 90) * Math.PI / 180;
      const cx2 = w / 2;
      const cy2 = h / 2;
      const len = Math.max(w, h);
      const x0 = cx2 - Math.cos(rad) * len / 2;
      const y0 = cy2 - Math.sin(rad) * len / 2;
      const x1 = cx2 + Math.cos(rad) * len / 2;
      const y1 = cy2 + Math.sin(rad) * len / 2;
      const grad2 = this.ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.colors.forEach((color, i) => {
        grad2.addColorStop(i / (gradient.colors.length - 1), color);
      });
      return grad2;
    }
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(w, h) / 2;
    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.colors.forEach((color, i) => {
      grad.addColorStop(i / (gradient.colors.length - 1), color);
    });
    return grad;
  }
  normalizeBorderSide(side) {
    if (!side) return void 0;
    if (typeof side === "string") return { width: 1, color: side };
    if (side.width || side.color) return { width: side.width ?? 1, color: side.color ?? "#000" };
    return void 0;
  }
  renderBoxNode(node, element = node.element, x = node.x, y = node.y, offsetX = 0, offsetY = 0) {
    const props = element.props;
    const boxWidth = node.width;
    const boxHeight = node.height;
    const borderRadius = props.borderRadius ?? 0;
    const borderRadiusArray = this.getBorderRadiusArray(props, borderRadius);
    const hasOpacity = props.opacity !== void 0;
    if (hasOpacity) {
      this.ctx.save();
      this.ctx.globalAlpha = props.opacity;
    }
    try {
      const hasShadow = !!props.boxShadow;
      if (hasShadow) {
        const shadow = this.normalizeShadow(props.boxShadow);
        this.ctx.save();
        this.ctx.shadowColor = shadow.color;
        this.ctx.shadowBlur = shadow.blur;
        this.ctx.shadowOffsetX = shadow.offsetX;
        this.ctx.shadowOffsetY = shadow.offsetY;
        if (props.backgroundColor || props.backgroundGradient) {
        } else {
          this.drawRoundedRect(
            x + (shadow.spread ?? 0),
            y + (shadow.spread ?? 0),
            boxWidth + (shadow.spread ?? 0) * 2,
            boxHeight + (shadow.spread ?? 0) * 2,
            borderRadiusArray
          );
          this.ctx.fillStyle = shadow.color;
          this.ctx.fill();
        }
      }
      try {
        if (props.backgroundGradient) {
          this.ctx.save();
          this.ctx.translate(x, y);
          this.ctx.fillStyle = this.createGradientFill(
            boxWidth,
            boxHeight,
            props.backgroundGradient
          );
          this.drawRoundedRect(0, 0, boxWidth, boxHeight, borderRadiusArray);
          this.ctx.fill();
          this.ctx.restore();
        } else if (props.backgroundColor) {
          this.ctx.fillStyle = props.backgroundColor;
          this.drawRoundedRect(x, y, boxWidth, boxHeight, borderRadiusArray);
          this.ctx.fill();
        }
      } finally {
        if (hasShadow) {
          this.ctx.restore();
        }
      }
      if (props.borderColor && props.borderWidth) {
        this.ctx.strokeStyle = props.borderColor;
        this.ctx.lineWidth = props.borderWidth;
        this.drawRoundedRect(x, y, boxWidth, boxHeight, borderRadiusArray);
        this.ctx.stroke();
      }
      const top = this.normalizeBorderSide(props.borderTop);
      const right = this.normalizeBorderSide(props.borderRight);
      const bottom = this.normalizeBorderSide(props.borderBottom);
      const left = this.normalizeBorderSide(props.borderLeft);
      if (top || right || bottom || left) {
        if (top) {
          this.ctx.strokeStyle = top.color;
          this.ctx.lineWidth = top.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x + boxWidth, y);
          this.ctx.stroke();
        }
        if (bottom) {
          this.ctx.strokeStyle = bottom.color;
          this.ctx.lineWidth = bottom.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y + boxHeight);
          this.ctx.lineTo(x + boxWidth, y + boxHeight);
          this.ctx.stroke();
        }
        if (left) {
          this.ctx.strokeStyle = left.color;
          this.ctx.lineWidth = left.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x, y + boxHeight);
          this.ctx.stroke();
        }
        if (right) {
          this.ctx.strokeStyle = right.color;
          this.ctx.lineWidth = right.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x + boxWidth, y);
          this.ctx.lineTo(x + boxWidth, y + boxHeight);
          this.ctx.stroke();
        }
      }
      const hasOverflow = props.overflow === "hidden" || props.overflow === "clip";
      if (hasOverflow) {
        this.ctx.save();
        this.drawRoundedRect(x, y, boxWidth, boxHeight, borderRadiusArray);
        this.ctx.clip();
      }
      try {
        const currentChildren = this.getLayoutOrderedChildren(element);
        const childOffsetX = offsetX + (node.offsetX ?? 0);
        const childOffsetY = offsetY + (node.offsetY ?? 0);
        for (let index = 0; index < node.children.length; index++) {
          const childNode = node.children[index];
          const childElement = currentChildren[index];
          if (!childElement) continue;
          this.renderLayoutNode(childNode, childElement, childOffsetX, childOffsetY);
        }
      } finally {
        if (hasOverflow) {
          this.ctx.restore();
        }
      }
    } finally {
      if (hasOpacity) {
        this.ctx.restore();
      }
    }
  }
  normalizeShadow(shadow) {
    if (typeof shadow === "string") {
      const parts = shadow.trim().split(/\s+/);
      const offsetX = Number(parts[0]) || 0;
      const offsetY = Number(parts[1]) || 0;
      const blur = Number(parts[2]) || 0;
      const numericParts = parts.filter((p) => !isNaN(Number(p)));
      const spread = numericParts.length > 3 ? Number(parts[3]) : 0;
      const color = parts.slice(numericParts.length > 3 ? 4 : 3).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX, offsetY, blur, spread, color };
    }
    return shadow;
  }
  renderCircle(element, x, y) {
    const props = element.props;
    const centerX = x + props.radius;
    const centerY = y + props.radius;
    const startAngle = props.startAngle ?? 0;
    const endAngle = props.endAngle ?? Math.PI * 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, props.radius, startAngle, endAngle, false);
    if (props.backgroundColor) {
      this.ctx.fillStyle = props.backgroundColor;
      this.ctx.fill();
    }
    if (props.borderColor && props.borderWidth) {
      this.ctx.strokeStyle = props.borderColor;
      this.ctx.lineWidth = props.borderWidth;
      this.ctx.stroke();
    }
  }
  renderText(element, x, y, layoutWidth) {
    const props = element.props;
    const fontSize = props.fontSize ?? this.theme.font.size;
    const fontFamily = props.fontFamily ?? this.theme.font.family;
    const fontWeight = props.fontWeight ?? "normal";
    const fontStyle = props.fontStyle ?? "normal";
    const color = props.color ?? this.theme.colors.cellText;
    const lineHeight = props.lineHeight ?? fontSize;
    const textAlign = props.textAlign ?? "left";
    const textDecoration = props.textDecoration ?? "none";
    const letterSpacing = props.letterSpacing ?? 0;
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    let textX = x;
    if (textAlign === "center") {
      textX = x + layoutWidth / 2;
      this.ctx.textAlign = "center";
    } else if (textAlign === "right") {
      textX = x + layoutWidth;
      this.ctx.textAlign = "right";
    } else {
      this.ctx.textAlign = "left";
    }
    this.ctx.textBaseline = "middle";
    const textY = y + lineHeight / 2;
    if (letterSpacing > 0) {
      this.ctx.textAlign = "left";
      let charX = textAlign === "center" ? x + (layoutWidth - this.getTextWidthWithSpacing(
        props.text,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacing
      )) / 2 : textAlign === "right" ? x + layoutWidth - this.getTextWidthWithSpacing(
        props.text,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacing
      ) : x;
      for (let i = 0; i < props.text.length; i++) {
        const ch = props.text[i];
        if (props.maxWidth) {
          this.ctx.fillText(ch, charX, textY, props.maxWidth);
        } else {
          this.ctx.fillText(ch, charX, textY);
        }
        const charWidth = this.measureCharWidth(ch, fontSize, fontFamily, fontWeight, fontStyle);
        charX += charWidth + letterSpacing;
      }
    } else {
      if (props.maxWidth) {
        this.ctx.fillText(props.text, textX, textY, props.maxWidth);
      } else {
        this.ctx.fillText(props.text, textX, textY);
      }
    }
    if (textDecoration === "underline") {
      const textWidth = letterSpacing > 0 ? this.getTextWidthWithSpacing(
        props.text,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacing
      ) : this.ctx.measureText(props.text).width;
      const lineY = textY + fontSize / 2 + 1;
      const lineX = textAlign === "center" ? textX - textWidth / 2 : textAlign === "right" ? textX - textWidth : textX;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, lineY);
      this.ctx.lineTo(lineX + textWidth, lineY);
      this.ctx.stroke();
    } else if (textDecoration === "line-through") {
      const textWidth = letterSpacing > 0 ? this.getTextWidthWithSpacing(
        props.text,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacing
      ) : this.ctx.measureText(props.text).width;
      const lineY = textY;
      const lineX = textAlign === "center" ? textX - textWidth / 2 : textAlign === "right" ? textX - textWidth : textX;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, lineY);
      this.ctx.lineTo(lineX + textWidth, lineY);
      this.ctx.stroke();
    }
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "alphabetic";
  }
  measureCharWidth(ch, fontSize, fontFamily, fontWeight, fontStyle) {
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    return this.ctx.measureText(ch).width;
  }
  getTextWidthWithSpacing(text, fontSize, fontFamily, fontWeight, fontStyle, letterSpacing) {
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    let total = 0;
    for (let i = 0; i < text.length; i++) {
      total += this.ctx.measureText(text[i]).width;
      if (i < text.length - 1) total += letterSpacing;
    }
    return total;
  }
  renderImage(element, x, y) {
    const props = element.props;
    const width = props.width;
    const height = props.height;
    const radius = props.circle ? Math.min(width, height) / 2 : props.radius ?? props.borderRadius ?? 0;
    const imageRuntime = this.renderContext?.imageRuntime;
    const src = props.src;
    const targetSize = Math.max(width, height);
    if (src && imageRuntime) {
      const cached = imageRuntime.get(src, targetSize);
      if (cached) {
        imageRuntime.collectVisible(src);
        this.drawImageWithFit(
          cached,
          x,
          y,
          width,
          height,
          radius,
          props.fit ?? props.objectFit ?? "cover"
        );
        return;
      }
    }
    this.drawImagePlaceholder(x, y, width, height, radius);
    if (!src || !imageRuntime) return;
    const lazyEnabled = props.lazy !== false;
    const rowIndex = this.renderContext?.rowIndex;
    const threshold = props.lazyThreshold ?? 200;
    if (lazyEnabled && rowIndex !== void 0 && rowIndex >= 0 && !imageRuntime.isInLazyLoadRange(rowIndex, threshold)) {
      return;
    }
    imageRuntime.collectVisible(src);
    if (imageRuntime.isFailed(src)) {
      this.renderImageFallback(
        props.errorImage,
        x,
        y,
        width,
        height,
        radius,
        props.fit ?? props.objectFit
      );
      return;
    }
    if (!imageRuntime.isLoading(src)) {
      imageRuntime.load(src, targetSize);
    }
    this.renderImageFallback(
      props.placeholder,
      x,
      y,
      width,
      height,
      radius,
      props.fit ?? props.objectFit
    );
  }
  drawImagePlaceholder(x, y, width, height, radius) {
    this.ctx.fillStyle = "#f5f5f5";
    this.drawRoundedRect(x, y, width, height, radius);
    this.ctx.fill();
    this.ctx.strokeStyle = "#d9d9d9";
    this.ctx.lineWidth = 1;
    this.drawRoundedRect(x, y, width, height, radius);
    this.ctx.stroke();
  }
  renderImageFallback(src, x, y, width, height, radius, fit) {
    if (!src || !this.renderContext?.imageRuntime) return;
    const image = this.renderContext.imageRuntime.get(src, Math.max(width, height));
    if (image) {
      this.drawImageWithFit(image, x, y, width, height, radius, fit ?? "cover");
    } else if (!this.renderContext.imageRuntime.isLoading(src)) {
      this.renderContext.imageRuntime.load(src, Math.max(width, height));
    }
  }
  drawImageWithFit(image, x, y, width, height, radius, fit) {
    this.ctx.save();
    this.drawRoundedRect(x, y, width, height, radius);
    this.ctx.clip();
    const imageWidth = image.width;
    const imageHeight = image.height;
    let drawX = x;
    let drawY = y;
    let drawWidth = width;
    let drawHeight = height;
    if (fit === "contain" || fit === "cover") {
      const scale = fit === "contain" ? Math.min(width / imageWidth, height / imageHeight) : Math.max(width / imageWidth, height / imageHeight);
      drawWidth = imageWidth * scale;
      drawHeight = imageHeight * scale;
      drawX = x + (width - drawWidth) / 2;
      drawY = y + (height - drawHeight) / 2;
    } else if (fit === "none") {
      drawWidth = imageWidth;
      drawHeight = imageHeight;
      drawX = x + (width - drawWidth) / 2;
      drawY = y + (height - drawHeight) / 2;
    }
    this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    this.ctx.restore();
  }
  renderLine(element, x, y) {
    const props = element.props;
    if (props.points.length < 2) return;
    this.ctx.beginPath();
    this.ctx.strokeStyle = props.strokeColor ?? "#333333";
    this.ctx.lineWidth = props.strokeWidth ?? 1;
    this.ctx.lineCap = props.strokeLinecap ?? "butt";
    this.ctx.moveTo(x + props.points[0].x, y + props.points[0].y);
    for (let i = 1; i < props.points.length; i++) {
      this.ctx.lineTo(x + props.points[i].x, y + props.points[i].y);
    }
    this.ctx.stroke();
  }
}
function normalizeBorder(border) {
  if (!border) return {};
  if (typeof border === "string") {
    return { borderWidth: 1, borderColor: border };
  }
  return {
    borderWidth: border.width,
    borderColor: border.color
  };
}
function normalizeBorderSide(side) {
  if (!side) return void 0;
  if (typeof side === "string") {
    return { width: 1, color: side };
  }
  return side;
}
function normalizeBoxShadow(shadow) {
  if (!shadow) return void 0;
  if (typeof shadow === "string") {
    const parts = shadow.trim().split(/\s+/);
    const offsetX = Number(parts[0]) || 0;
    const offsetY = Number(parts[1]) || 0;
    const blur = Number(parts[2]) || 0;
    const spread = Number(parts[3]) || 0;
    const colorStart = parts.length > 5 ? 4 : parts[3] && !isNaN(Number(parts[3])) ? 4 : 3;
    const color = parts.slice(colorStart).join(" ") || "rgba(0,0,0,0.15)";
    return { offsetX, offsetY, blur, spread, color };
  }
  return shadow;
}
function normalizeBoxProps(props) {
  const border = normalizeBorder(props.border);
  const borderTop = normalizeBorderSide(props.borderTop);
  const borderRight = normalizeBorderSide(props.borderRight);
  const borderBottom = normalizeBorderSide(props.borderBottom);
  const borderLeft = normalizeBorderSide(props.borderLeft);
  const boxShadow = normalizeBoxShadow(props.shadow ?? props.boxShadow);
  return {
    id: props.id,
    styles: props.styles,
    display: props.position === "relative" ? void 0 : "flex",
    position: props.position,
    x: props.x,
    y: props.y,
    zIndex: props.zIndex,
    width: props.width,
    height: props.height,
    minWidth: props.minW ?? props.minWidth,
    maxWidth: props.maxW ?? props.maxWidth,
    minHeight: props.minH ?? props.minHeight,
    maxHeight: props.maxH ?? props.maxHeight,
    padding: props.padding,
    margin: props.mg ?? props.margin,
    gap: props.gap,
    flexDirection: props.direction ?? props.flexDirection ?? "row",
    justifyContent: props.justify ?? props.justifyContent,
    alignItems: props.align ?? props.alignItems,
    alignSelf: props.selfAlign ?? props.alignSelf,
    backgroundColor: props.bgColor ?? props.backgroundColor,
    backgroundGradient: props.gradient ?? props.backgroundGradient,
    borderRadius: props.radius ?? props.borderRadius,
    borderTopLeftRadius: props.borderTLR ?? props.borderTopLeftRadius,
    borderTopRightRadius: props.borderTRR ?? props.borderTopRightRadius,
    borderBottomLeftRadius: props.borderBLR ?? props.borderBottomLeftRadius,
    borderBottomRightRadius: props.borderBRR ?? props.borderBottomRightRadius,
    borderWidth: props.borderWidth ?? border.borderWidth,
    borderColor: props.borderColor ?? border.borderColor,
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    opacity: props.opacity,
    overflow: props.clip ? "hidden" : props.overflow,
    boxShadow
  };
}
function getTextFromChildren(props) {
  if (props.text !== void 0) return props.text;
  return (props.children ?? []).map((child) => String(child.props.text ?? "")).join("");
}
function formatDateValue(date, format) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
}
function getDateText(props) {
  if (props.value === void 0 || props.value === null || props.value === "") {
    return props.placeholder ?? "";
  }
  const date = props.value instanceof globalThis.Date ? props.value : new globalThis.Date(props.value);
  if (Number.isNaN(date.getTime())) {
    return props.placeholder ?? "";
  }
  return formatDateValue(date, props.format ?? "YYYY-MM-DD");
}
function CTBox(props) {
  return {
    type: "CTBox",
    props: normalizeBoxProps(props),
    children: props.children ?? []
  };
}
function CTRow(props) {
  return CTBox({ ...props, direction: "row" });
}
function CTColumn(props) {
  return CTBox({ ...props, direction: "column" });
}
const CTStack = CTBox;
function CTText(props) {
  const { children: _children, text: _text, ...rest } = props;
  return {
    type: "CTText",
    props: {
      ...rest,
      text: getTextFromChildren(props)
    },
    children: []
  };
}
function CTDate(props) {
  const {
    children: _children,
    value: _value,
    format: _format,
    placeholder: _placeholder,
    ...textProps
  } = props;
  return CTText({
    ...textProps,
    text: getDateText(props)
  });
}
function CTCircle(props) {
  const { children: _children, bgColor, ...rest } = props;
  return {
    type: "CTCircle",
    props: {
      ...rest,
      backgroundColor: bgColor ?? rest.backgroundColor
    },
    children: []
  };
}
function CTImage(props) {
  const { children: _children, ...rest } = props;
  return {
    type: "CTImage",
    props: rest,
    children: []
  };
}
function CTLine(props) {
  const { children: _children, ...rest } = props;
  return {
    type: "CTLine",
    props: rest,
    children: []
  };
}
function CTTooltip(props) {
  const { children, ...rest } = props;
  return {
    type: "CTTooltip",
    props: rest,
    children: children ?? []
  };
}
function CTDropdown(props) {
  const { children, ...rest } = props;
  return {
    type: "CTDropdown",
    props: rest,
    children: children ?? []
  };
}
const CELL_TEXT_CACHE_LIMIT = 5e3;
const WRAPPED_TEXT_CACHE_LIMIT = 2e3;
const CELL_TEXT_CACHE_MIN_LENGTH = 40;
class Renderer {
  canvas;
  ctx;
  theme;
  layoutManager;
  locale;
  dpr;
  offscreenCanvas;
  offscreenCtx;
  cellRendererRegistry;
  dropdownRenderer;
  filterDropdownRenderer;
  imageOverlayRenderer;
  overlayRenderer;
  dirtyRegions = [];
  expandColumnKey = null;
  currentSwitchAnimations;
  currentButtonHoverStates;
  hoveredPlaceholderColumnIndex = -1;
  isDestroyed = false;
  // 多选列分隔符
  multipleSelectSeparator = ", ";
  // 图片加载队列（延迟加载 + 请求取消）
  imageLoadQueue;
  // 图片渲染器使用的运行时桥接
  imageRuntime;
  // 图片单元格的快路径：缓存渲染器与可复用 context，
  // 避免在滚动热路径上每个单元格都分配 options/context 对象。
  imageRenderer;
  imageRenderContext;
  jsxMeasurementEngine;
  jsxLayoutEngine;
  jsxRenderer;
  jsxInteractiveRegions = [];
  jsxUpdateHandlers = null;
  /** 渲染 context 预分配及行列缺失时的占位列，冻结避免跨单元格污染 */
  static RENDER_CONTEXT_PLACEHOLDER_COLUMN = Object.freeze({
    key: "",
    title: "",
    type: CellTypes.TEXT
  });
  /** 渲染 context 预分配及行列缺失时的占位行，冻结避免跨单元格污染 */
  static RENDER_CONTEXT_PLACEHOLDER_ROW = Object.freeze({
    id: "",
    data: Object.freeze({})
  });
  /** 当前帧收集的可见图片 URL */
  frameVisibleUrls = /* @__PURE__ */ new Set();
  // 文本宽度缓存（用于按钮等需要测量文本宽度的场景）
  textWidthCache = /* @__PURE__ */ new Map();
  textWidthCacheKey = "";
  // 当前字体配置的 key
  // 单元格文本截断/换行缓存，key 含字体与最大宽度，滚动重复绘制时直接复用
  cellTextCache = /* @__PURE__ */ new Map();
  wrappedTextCache = /* @__PURE__ */ new Map();
  /**
   * 单行文本截断（带缓存）
   * 短文本直接测量，避免缓存 key 拼接和 Map 查找的开销；
   * 长文本复用截断结果，避免每帧重复 measureText
   */
  measureSingleLineText(text, fontKey, maxWidth) {
    if (text.length < CELL_TEXT_CACHE_MIN_LENGTH) {
      const width = this.ctx.measureText(text).width;
      return width <= maxWidth ? { text, width } : this.truncateSingleLineText(text, maxWidth);
    }
    const cacheKey = `${fontKey}\0${maxWidth}\0${text}`;
    const cached = this.cellTextCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const fullWidth = this.ctx.measureText(text).width;
    const result = fullWidth <= maxWidth ? { text, width: fullWidth } : this.truncateSingleLineText(text, maxWidth);
    if (this.cellTextCache.size >= CELL_TEXT_CACHE_LIMIT) {
      const oldestKey = this.cellTextCache.keys().next().value;
      if (oldestKey !== void 0) {
        this.cellTextCache.delete(oldestKey);
      }
    }
    this.cellTextCache.set(cacheKey, result);
    return result;
  }
  truncateSingleLineText(text, maxWidth) {
    const ellipsis = "...";
    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = low + high + 1 >> 1;
      if (this.ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    const finalText = text.slice(0, low) + ellipsis;
    return { text: finalText, width: this.ctx.measureText(finalText).width };
  }
  /**
   * 多行文本换行（带缓存）
   * 短文本且无换行符时直接测量/换行，不走缓存
   */
  measureWrappedText(text, fontKey, maxWidth, maxRows) {
    if (text.length < CELL_TEXT_CACHE_MIN_LENGTH && !text.includes("\n")) {
      const width = this.ctx.measureText(text).width;
      if (width <= maxWidth) {
        return { lines: [text], widths: [width] };
      }
      const lines2 = layoutWrappedText(this.ctx, text, maxWidth, maxRows).lines;
      return { lines: lines2, widths: lines2.map((line) => this.ctx.measureText(line).width) };
    }
    const cacheKey = `${fontKey}\0${maxWidth}\0${maxRows}\0${text}`;
    const cached = this.wrappedTextCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const lines = layoutWrappedText(this.ctx, text, maxWidth, maxRows).lines;
    const widths = lines.map((line) => this.ctx.measureText(line).width);
    const result = { lines, widths };
    if (this.wrappedTextCache.size >= WRAPPED_TEXT_CACHE_LIMIT) {
      const oldestKey = this.wrappedTextCache.keys().next().value;
      if (oldestKey !== void 0) {
        this.wrappedTextCache.delete(oldestKey);
      }
    }
    this.wrappedTextCache.set(cacheKey, result);
    return result;
  }
  // 动态行高支持
  /**
   * 根据单元格高度计算可显示行数
   */
  calculateMaxRows(cellHeight, lineHeight, padding = 8) {
    return calculateMaxTextRows(cellHeight, lineHeight, padding);
  }
  // 性能监控
  performanceEnabled = false;
  // type -> columnKey -> stats
  performanceStats = /* @__PURE__ */ new Map();
  frameStartTime = 0;
  frameCount = 0;
  // 帧历史记录（保留最近 120 帧）
  frameHistory = [];
  static MAX_FRAME_HISTORY = 120;
  // 当前帧统计 (type -> columnKey -> stats)
  currentFrameStats = /* @__PURE__ */ new Map();
  // 当前帧阶段统计 (phaseName -> stats)
  currentFramePhases = /* @__PURE__ */ new Map();
  // 当前帧 rowBands 内部细分统计 (detailName -> stats)
  currentFrameRowBandDetails = /* @__PURE__ */ new Map();
  // 上一帧统计（用于报告）
  lastFrameStats = /* @__PURE__ */ new Map();
  // 懒加载相关
  currentVisibleRange = null;
  currentRows = [];
  currentScrollTop = 0;
  rowHeight = 0;
  currentHoveredCell = null;
  currentHoveredImageIndex = -1;
  currentHoveredButtonIndex = -1;
  currentProgressDragState = void 0;
  currentRowResizeState = void 0;
  currentValidationErrors = /* @__PURE__ */ new Map();
  currentPendingValidations = /* @__PURE__ */ new Set();
  // 渲染缓存相关
  renderCache = null;
  rowIdManager = new RowIdManager();
  columnIdManager = new ColumnIdManager();
  // 图片加载完成后的渲染触发回调
  onImageLoaded = null;
  constructor(canvas, theme, layoutManager, locale = zhCN) {
    this.canvas = canvas;
    this.ctx = this.getContext(canvas);
    this.theme = theme;
    this.layoutManager = layoutManager;
    this.locale = locale;
    this.dpr = getDevicePixelRatio();
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.getContext(this.offscreenCanvas);
    this.cellRendererRegistry = new CellRendererRegistry(locale);
    this.dropdownRenderer = new DropdownRenderer(
      this.ctx,
      this.theme,
      (text) => this.measureTextWidth(text),
      locale
    );
    this.filterDropdownRenderer = new FilterDropdownRenderer(this.ctx, this.theme, locale);
    this.imageOverlayRenderer = new ImageOverlayRenderer(
      this.ctx,
      this.theme,
      {
        get: (src, minSize) => this.imageLoadQueue.get(src, minSize),
        isLoading: (src) => this.imageLoadQueue.isLoading(src),
        load: (src, targetSize) => this.loadImage(src, targetSize),
        collectVisible: (src) => this.collectVisibleImage(src)
      },
      locale
    );
    this.overlayRenderer = new OverlayRenderer(
      this.canvas,
      this.ctx,
      this.theme,
      this.layoutManager,
      this.dpr,
      locale
    );
    this.jsxMeasurementEngine = new MeasurementEngine(this.ctx);
    this.jsxLayoutEngine = new LayoutEngine(this.jsxMeasurementEngine);
    this.jsxRenderer = new CTElementRenderer(this.ctx, this.jsxLayoutEngine, this.theme);
    this.imageLoadQueue = new ImageLoadQueue();
    this.imageRuntime = {
      get: (src, targetSize) => this.imageLoadQueue.get(src, targetSize),
      isLoading: (src) => this.imageLoadQueue.isLoading(src),
      isFailed: (src) => this.imageLoadQueue.isFailed(src),
      load: (src, targetSize) => this.loadImage(src, targetSize),
      collectVisible: (src) => this.collectVisibleImage(src),
      isInLazyLoadRange: (rowIndex, threshold) => this.isInLazyLoadRange(rowIndex, threshold)
    };
    this.imageRenderer = this.cellRendererRegistry.get("image");
    this.imageRenderContext = {
      ctx: this.ctx,
      theme: this.theme,
      locale: this.locale,
      layoutManager: this.layoutManager,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      column: Renderer.RENDER_CONTEXT_PLACEHOLDER_COLUMN,
      row: Renderer.RENDER_CONTEXT_PLACEHOLDER_ROW,
      rowIndex: -1,
      colIndex: -1,
      value: void 0,
      isDisabled: false,
      isHovered: false,
      isSelected: false,
      dpr: this.dpr,
      hoveredImageIndex: -1,
      imageRuntime: this.imageRuntime
    };
  }
  getContext(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    return ctx;
  }
  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = this.getContext(canvas);
    this.dropdownRenderer.setContext(this.ctx);
    this.filterDropdownRenderer.setContext(this.ctx);
    this.imageOverlayRenderer.setContext(this.ctx);
    this.overlayRenderer.setCanvas(this.canvas, this.ctx);
    this.jsxMeasurementEngine.setContext(this.ctx);
    this.jsxRenderer.setContext(this.ctx);
    this.jsxRenderer.invalidateOffscreen("all");
  }
  setTheme(theme) {
    this.theme = theme;
    this.dropdownRenderer.setTheme(theme);
    this.filterDropdownRenderer.setTheme(theme);
    this.imageOverlayRenderer.setTheme(theme);
    this.overlayRenderer.setTheme(theme);
    this.jsxRenderer.setTheme(theme);
    this.jsxRenderer.invalidateOffscreen("all");
  }
  setLocale(locale) {
    this.locale = locale;
    this.cellRendererRegistry.setLocale(locale);
    this.dropdownRenderer.setLocale(locale);
    this.filterDropdownRenderer.setLocale(locale);
    this.imageOverlayRenderer.setLocale(locale);
    this.overlayRenderer.setLocale(locale);
  }
  setMultipleSelectSeparator(separator) {
    this.multipleSelectSeparator = separator;
  }
  /**
   * 设置图片加载配置
   */
  setImageLoadConfig(config) {
    this.imageLoadQueue = new ImageLoadQueue({
      maxConcurrent: config.maxConcurrent ?? 6,
      maxCacheSize: config.maxCacheSize ?? 200
    });
  }
  setWatermarkConfig(config) {
    this.overlayRenderer.setWatermarkConfig(config);
  }
  setExpandColumnKey(key) {
    this.expandColumnKey = key;
  }
  /**
   * 设置渲染缓存
   */
  setRenderCache(renderCache) {
    this.renderCache = renderCache;
  }
  /**
   * 设置图片加载完成后的渲染触发回调
   */
  setOnImageLoaded(callback) {
    this.onImageLoaded = callback;
  }
  /**
   * 获取行 ID 管理器
   */
  getRowIdManager() {
    return this.rowIdManager;
  }
  /**
   * 获取列 ID 管理器
   */
  getColumnIdManager() {
    return this.columnIdManager;
  }
  resize(width, height) {
    const newDpr = getDevicePixelRatio();
    if (newDpr !== this.dpr) {
      this.dpr = newDpr;
      this.overlayRenderer.setDpr(newDpr);
    }
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.offscreenCanvas.width = width * this.dpr;
    this.offscreenCanvas.height = height * this.dpr;
    this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  updateTheme(theme) {
    this.theme = theme;
    this.dropdownRenderer.setTheme(theme);
    this.filterDropdownRenderer.setTheme(theme);
    this.imageOverlayRenderer.setTheme(theme);
    this.overlayRenderer.setTheme(theme);
    this.jsxRenderer.setTheme(theme);
    this.jsxRenderer.invalidateOffscreen("all");
  }
  markDirty(x, y, width, height) {
    this.dirtyRegions.push({ x, y, width, height });
  }
  markFullRedraw() {
  }
  getJSXInteractiveRegions() {
    return this.jsxInteractiveRegions;
  }
  setJSXUpdateHandlers(handlers) {
    this.jsxUpdateHandlers = handlers;
  }
  createJSXRenderContext(row, column, rowIndex, colIndex, value) {
    return {
      value,
      row,
      column,
      rowIndex,
      colIndex,
      updateValue: async (nextValue) => {
        await this.jsxUpdateHandlers?.updateValue(rowIndex, column, nextValue);
      },
      updateField: async (field, nextValue) => {
        await this.jsxUpdateHandlers?.updateField(rowIndex, field, nextValue);
      },
      updateRow: async (data) => {
        await this.jsxUpdateHandlers?.updateRow(rowIndex, data);
      }
    };
  }
  render(columns, rows, visibleRange, scrollLeft, scrollTop, options) {
    this.currentSwitchAnimations = options.switchAnimations;
    this.currentButtonHoverStates = options.buttonHoverStates;
    this.currentHoveredCell = options.hoveredCell;
    this.currentHoveredImageIndex = options.hoveredImageIndex ?? -1;
    this.currentHoveredButtonIndex = options.hoveredButtonIndex ?? -1;
    this.currentProgressDragState = options.progressDragState;
    this.currentRowResizeState = options.rowResizeState;
    this.currentValidationErrors = options.validationErrors ?? /* @__PURE__ */ new Map();
    this.currentPendingValidations = options.pendingValidations ?? /* @__PURE__ */ new Set();
    this.jsxInteractiveRegions = [];
    this.beginFrame();
    let rootStateSaved = false;
    let centerClipStateSaved = false;
    try {
      this.currentVisibleRange = visibleRange;
      this.currentRows = rows;
      this.currentScrollTop = scrollTop;
      this.rowHeight = this.theme.row.height;
      const { startRow, endRow } = visibleRange;
      const viewportWidth = this.canvas.width / this.dpr;
      const viewportHeight = this.canvas.height / this.dpr;
      this.ctx.save();
      rootStateSaved = true;
      this.measurePhase("clearBackground", () => {
        this.ctx.fillStyle = this.theme.colors.background;
        this.ctx.fillRect(0, 0, viewportWidth, viewportHeight);
      });
      const leafColumns = this.layoutManager.getLeafColumns();
      const fixedInfo = this.layoutManager.getFixedColumnsInfo(columns);
      const hasLeftFixed = fixedInfo.leftFixed.columns.length > 0;
      const hasRightFixed = fixedInfo.rightFixed.columns.length > 0;
      this.hoveredPlaceholderColumnIndex = options.hoveredCell && leafColumns[options.hoveredCell.columnIndex]?.key.startsWith("__hidden_placeholder__") ? options.hoveredCell.columnIndex : -1;
      const centerStartX = hasLeftFixed ? fixedInfo.leftFixed.width : 0;
      const centerEndX = viewportWidth - (hasRightFixed ? fixedInfo.rightFixed.width : 0);
      const centerColumnIndices = this.layoutManager.getVisibleCenterColumnIndices();
      const leftFixedIndices = [];
      const rightFixedIndices = [];
      for (let i = 0; i < leafColumns.length; i++) {
        const col = leafColumns[i];
        if (col) {
          if (col.fixed === "left") leftFixedIndices.push(i);
          if (col.fixed === "right") rightFixedIndices.push(i);
        }
      }
      const renderBands = this.shouldRenderRowBands();
      this.ctx.save();
      centerClipStateSaved = true;
      this.ctx.beginPath();
      this.ctx.rect(centerStartX, 0, centerEndX - centerStartX, viewportHeight);
      this.ctx.clip();
      if (renderBands) {
        this.measurePhase("rowBands", () => {
          this.renderRowBands(
            rows,
            centerColumnIndices,
            [],
            [],
            scrollLeft,
            scrollTop,
            visibleRange,
            fixedInfo,
            options,
            "rowBands"
          );
        });
      } else {
        this.measurePhase("centerRows", () => {
          this.renderCenterRows(
            leafColumns,
            rows,
            startRow,
            endRow,
            centerColumnIndices,
            scrollLeft,
            scrollTop,
            {
              ...options,
              dragColumnIndex: options.columnReorderState?.dragColumnIndex,
              columnReorderState: options.columnReorderState
            }
          );
        });
      }
      this.ctx.restore();
      centerClipStateSaved = false;
      this.measurePhase("centerSelections", () => {
        this.renderCenterSelections(
          options.selectedCells,
          scrollLeft,
          scrollTop,
          centerColumnIndices
        );
      });
      if (options.showHeader) {
        this.measurePhase("centerHeader", () => {
          this.renderCenterHeader(
            columns,
            centerColumnIndices,
            scrollTop,
            options.sortConfig,
            options.filterConfig,
            scrollLeft,
            options.hoveredHeaderColumnKey,
            options.columnReorderState?.dragColumnIndex,
            options.columnReorderState
          );
        });
      }
      if (hasLeftFixed && !renderBands) {
        this.measurePhase("fixedColumnsContentLeft", () => {
          this.renderFixedColumnsContent(
            leafColumns,
            rows,
            leftFixedIndices,
            0,
            scrollTop,
            visibleRange,
            options
          );
        });
      }
      if (hasRightFixed && !renderBands) {
        this.measurePhase("fixedColumnsContentRight", () => {
          this.renderFixedColumnsContent(
            leafColumns,
            rows,
            rightFixedIndices,
            viewportWidth - fixedInfo.rightFixed.width,
            scrollTop,
            visibleRange,
            options
          );
        });
      }
      if (renderBands && (hasLeftFixed || hasRightFixed)) {
        this.measurePhase("rowBandsFixed", () => {
          this.renderRowBands(
            rows,
            [],
            leftFixedIndices,
            rightFixedIndices,
            scrollLeft,
            scrollTop,
            visibleRange,
            fixedInfo,
            options,
            "rowBandsFixed"
          );
        });
      }
      this.measurePhase("fixedSelections", () => {
        this.renderFixedSelections(
          options.selectedCells,
          scrollTop,
          leftFixedIndices,
          rightFixedIndices
        );
      });
      if (options.showHeader) {
        if (hasLeftFixed) {
          this.measurePhase("fixedColumnsHeaderLeft", () => {
            this.renderFixedColumnsHeader(
              leafColumns,
              leftFixedIndices,
              0,
              options.sortConfig,
              options.filterConfig,
              options.hoveredHeaderColumnKey,
              options.columnReorderState
            );
          });
        }
        if (hasRightFixed) {
          this.measurePhase("fixedColumnsHeaderRight", () => {
            this.renderFixedColumnsHeader(
              leafColumns,
              rightFixedIndices,
              viewportWidth - fixedInfo.rightFixed.width,
              options.sortConfig,
              options.filterConfig,
              options.hoveredHeaderColumnKey,
              options.columnReorderState
            );
          });
        }
      }
      this.measurePhase("rowResizeGuide", () => {
        this.renderRowResizeGuide(viewportWidth);
      });
      if (options.dropdown) {
        const dropdown = options.dropdown;
        this.measurePhase("dropdown", () => {
          this.renderDropdown(dropdown);
        });
      }
      if (options.headerContextMenu) {
        const headerContextMenu = options.headerContextMenu;
        this.measurePhase("headerContextMenu", () => {
          this.renderHeaderContextMenu(headerContextMenu);
        });
      }
      if (options.columnReorderState) {
        const columnReorderState = options.columnReorderState;
        this.measurePhase("columnReorderIndicator", () => {
          this.renderColumnReorderIndicator(columnReorderState, rows, visibleRange, scrollTop);
        });
      }
      this.ctx.restore();
      rootStateSaved = false;
      this.measurePhase("imageCommit", () => {
        this.commitVisibleImages();
      });
      this.dirtyRegions = [];
    } finally {
      if (centerClipStateSaved) {
        this.ctx.restore();
      }
      if (rootStateSaved) {
        this.ctx.restore();
      }
      this.endFrame(visibleRange, scrollTop, scrollLeft, columns);
    }
  }
  shouldRenderRowBands() {
    const rowBands = this.layoutManager.getRowBandsForRender();
    return this.layoutManager.hasPinnedRows() || rowBands.summaryTop.rows.length > 0 || rowBands.summaryBottom.rows.length > 0;
  }
  renderRowBandCells(band, allRows, columnIndices, scrollLeft, scrollTop, visibleRange, options, startX, detailPrefix) {
    let y = band.y;
    if (band.type === "body") {
      y -= scrollTop;
    }
    const startIndex = band.type === "body" ? visibleRange.startRow : 0;
    const endIndex = band.type === "body" ? Math.min(visibleRange.endRow, band.rows.length - 1) : band.rows.length - 1;
    const measureDetail = (name, fn) => detailPrefix ? this.measureRowBandDetail(`${detailPrefix}.${name}`, fn) : fn();
    const countDetail = (name) => {
      if (detailPrefix) {
        this.recordRowBandDetail(`${detailPrefix}.${name}`, 0);
      }
    };
    for (let bandRowIndex = startIndex; bandRowIndex <= endIndex; bandRowIndex++) {
      const row = band.rows[bandRowIndex];
      if (!row) {
        continue;
      }
      countDetail("rows.visited");
      const rowIndex = measureDetail(
        "rowIndexLookup",
        () => this.layoutManager.getRowIndexByRef(row)
      );
      if (rowIndex < 0) {
        continue;
      }
      const rowHeight = measureDetail(
        "rowHeightLookup",
        () => this.layoutManager.getRowHeightByIndex(rowIndex)
      );
      if (band.type === "body") {
        const rowOffset = measureDetail(
          "rowOffsetLookup",
          () => this.layoutManager.getRowBandOffsetByRef(row)
        );
        y = band.y - scrollTop + (rowOffset ?? 0);
      }
      const viewportHeight = this.canvas.height / this.dpr;
      if (y + rowHeight < 0 || y > viewportHeight) {
        y += rowHeight;
        continue;
      }
      let backgroundColor = this.theme.colors.rowBackground;
      if (options.stripeRows && rowIndex % 2 === 1) {
        backgroundColor = this.theme.colors.rowAltBackground;
      }
      if (row.selected) {
        backgroundColor = this.theme.colors.rowSelectedBackground;
      }
      if (options.hoveredCell?.rowIndex === rowIndex) {
        backgroundColor = this.theme.colors.rowHoverBackground;
      }
      for (const colIndex of columnIndices) {
        countDetail("cells.visited");
        const column = measureDetail(
          "columnLookup",
          () => this.layoutManager.getLeafColumn(colIndex)
        );
        if (!column) continue;
        const width = measureDetail(
          "columnWidthLookup",
          () => this.layoutManager.getColumnWidthByIndex(colIndex)
        );
        const x = measureDetail(
          "columnOffsetLookup",
          () => startX !== void 0 ? startX + this.layoutManager.getColumnOffset(colIndex) - this.layoutManager.getColumnOffset(columnIndices[0]) : this.layoutManager.getColumnOffset(colIndex) - scrollLeft
        );
        measureDetail("backgroundFill", () => {
          this.ctx.fillStyle = backgroundColor;
          this.ctx.fillRect(x, y, width, rowHeight);
        });
        const cellTrace = detailPrefix ? {
          prefix: `${detailPrefix}.cellInternal`,
          location: { rowIndex, colIndex, x, y, width, height: rowHeight },
          columnKey: column.key
        } : void 0;
        measureDetail("cellWithPosition", () => {
          this.renderCellWithPosition(
            column,
            row,
            rowIndex,
            colIndex,
            row.data[getColumnField(column)],
            x,
            y,
            width,
            rowHeight,
            options,
            cellTrace
          );
        });
      }
      y += rowHeight;
    }
  }
  renderRowBands(rows, centerColumnIndices, leftFixedIndices, rightFixedIndices, scrollLeft, scrollTop, visibleRange, fixedInfo, options, detailRoot) {
    const rowBands = this.measureRowBandDetail(
      `${detailRoot}.getBands`,
      () => this.layoutManager.getRowBandsForRender()
    );
    const pinnedBands = [rowBands.pinnedTop, rowBands.pinnedBottom];
    const summaryBands = [rowBands.summaryTop, rowBands.summaryBottom];
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(
      0,
      rowBands.body.y,
      this.canvas.width / this.dpr,
      this.layoutManager.getBodyViewportHeight()
    );
    this.ctx.clip();
    this.renderRowBandCells(
      rowBands.body,
      rows,
      centerColumnIndices,
      scrollLeft,
      scrollTop,
      visibleRange,
      options,
      void 0,
      `${detailRoot}.center.body`
    );
    this.ctx.restore();
    for (const band of pinnedBands) {
      this.renderRowBandCells(
        band,
        rows,
        centerColumnIndices,
        scrollLeft,
        scrollTop,
        visibleRange,
        options,
        void 0,
        `${detailRoot}.center.${band.type}`
      );
    }
    for (const band of summaryBands) {
      this.measureRowBandDetail(`${detailRoot}.center.${band.type}.summaryCells`, () => {
        this.renderSummaryBandCells(band, centerColumnIndices, scrollLeft);
      });
    }
    if (leftFixedIndices.length > 0) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(
        0,
        rowBands.body.y,
        this.canvas.width / this.dpr,
        this.layoutManager.getBodyViewportHeight()
      );
      this.ctx.clip();
      this.renderRowBandCells(
        rowBands.body,
        rows,
        leftFixedIndices,
        scrollLeft,
        scrollTop,
        visibleRange,
        options,
        0,
        `${detailRoot}.leftFixed.body`
      );
      this.ctx.restore();
      for (const band of pinnedBands) {
        this.renderRowBandCells(
          band,
          rows,
          leftFixedIndices,
          scrollLeft,
          scrollTop,
          visibleRange,
          options,
          0,
          `${detailRoot}.leftFixed.${band.type}`
        );
      }
      for (const band of summaryBands) {
        this.measureRowBandDetail(`${detailRoot}.leftFixed.${band.type}.summaryCells`, () => {
          this.renderSummaryBandCells(band, leftFixedIndices, scrollLeft, 0);
        });
      }
    }
    if (rightFixedIndices.length > 0) {
      const viewportWidth = this.canvas.width / this.dpr;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(
        0,
        rowBands.body.y,
        this.canvas.width / this.dpr,
        this.layoutManager.getBodyViewportHeight()
      );
      this.ctx.clip();
      this.renderRowBandCells(
        rowBands.body,
        rows,
        rightFixedIndices,
        scrollLeft,
        scrollTop,
        visibleRange,
        options,
        viewportWidth - fixedInfo.rightFixed.width,
        `${detailRoot}.rightFixed.body`
      );
      this.ctx.restore();
      for (const band of pinnedBands) {
        this.renderRowBandCells(
          band,
          rows,
          rightFixedIndices,
          scrollLeft,
          scrollTop,
          visibleRange,
          options,
          viewportWidth - fixedInfo.rightFixed.width,
          `${detailRoot}.rightFixed.${band.type}`
        );
      }
      for (const band of summaryBands) {
        this.measureRowBandDetail(`${detailRoot}.rightFixed.${band.type}.summaryCells`, () => {
          this.renderSummaryBandCells(
            band,
            rightFixedIndices,
            scrollLeft,
            viewportWidth - fixedInfo.rightFixed.width
          );
        });
      }
    }
  }
  renderSummaryBandCells(band, columnIndices, scrollLeft, startX) {
    if (band.rows.length === 0 || columnIndices.length === 0) return;
    let y = band.y;
    const visibleColumns = new Set(columnIndices);
    for (const row of band.rows) {
      const rowHeight = row.height;
      for (const columnIndex of columnIndices) {
        const x = this.getSummaryColumnX(columnIndex, columnIndices, scrollLeft, startX);
        const width = this.layoutManager.getColumnWidthByIndex(columnIndex);
        this.ctx.fillStyle = this.theme.colors.headerBackground;
        this.ctx.fillRect(x, y, width, rowHeight);
        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = this.theme.border.width;
        this.ctx.strokeRect(x, y, width, rowHeight);
      }
      for (const cell of row.cells) {
        const segments = this.getSummaryCellSegments(cell, visibleColumns);
        if (segments.length === 0) {
          continue;
        }
        const column = this.layoutManager.getLeafColumn(cell.startColumnIndex);
        if (!column) continue;
        for (const segment of segments) {
          const x = this.getSummaryColumnX(segment.start, columnIndices, scrollLeft, startX);
          const endOffset = this.layoutManager.getColumnOffset(segment.end) + this.layoutManager.getColumnWidthByIndex(segment.end);
          const width = endOffset - this.layoutManager.getColumnOffset(segment.start);
          this.ctx.fillStyle = cell.renderResult.style?.backgroundColor ?? this.theme.colors.headerBackground;
          this.ctx.fillRect(x, y, width, rowHeight);
          if (segment.start <= cell.startColumnIndex && cell.startColumnIndex <= segment.end) {
            this.renderCellContent(
              cell.renderResult,
              x,
              y,
              width,
              rowHeight,
              8,
              column.align,
              -1,
              cell.startColumnIndex,
              false,
              column.key
            );
          }
          this.ctx.strokeStyle = cell.renderResult.style?.borderColor ?? this.theme.colors.cellBorder;
          this.ctx.lineWidth = cell.renderResult.style?.borderWidth ?? this.theme.border.width;
          this.ctx.strokeRect(x, y, width, rowHeight);
        }
      }
      y += rowHeight;
    }
  }
  getSummaryColumnX(columnIndex, columnIndices, scrollLeft, startX) {
    const columnOffset = this.layoutManager.getColumnOffset(columnIndex);
    if (startX !== void 0) {
      return startX + columnOffset - this.layoutManager.getColumnOffset(columnIndices[0]);
    }
    return columnOffset - scrollLeft;
  }
  getSummaryCellSegments(cell, visibleColumns) {
    const segments = [];
    let segmentStart = null;
    let previousIndex = null;
    for (let index = cell.startColumnIndex; index <= cell.endColumnIndex; index++) {
      if (!visibleColumns.has(index)) {
        if (segmentStart !== null && previousIndex !== null) {
          segments.push({ start: segmentStart, end: previousIndex });
          segmentStart = null;
          previousIndex = null;
        }
        continue;
      }
      if (segmentStart === null) {
        segmentStart = index;
      } else if (previousIndex !== null && index !== previousIndex + 1) {
        segments.push({ start: segmentStart, end: previousIndex });
        segmentStart = index;
      }
      previousIndex = index;
    }
    if (segmentStart !== null && previousIndex !== null) {
      segments.push({ start: segmentStart, end: previousIndex });
    }
    return segments;
  }
  renderCenterHeader(_columns, centerColumnIndices, _scrollTop, sortConfig, filterConfig, scrollLeft, hoveredHeaderColumnKey, _dragColumnIndex, _columnReorderState) {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const visibleHeaderCells = this.layoutManager.getVisibleHeaderCells();
    let headerX = 0;
    let headerWidth = 0;
    for (const colIndex of centerColumnIndices) {
      const col = this.layoutManager.getLeafColumn(colIndex);
      if (!col) continue;
      const colOffset = this.layoutManager.getColumnOffset(colIndex);
      const colWidth = this.layoutManager.getColumnWidthByIndex(colIndex);
      if (headerWidth === 0) {
        headerX = colOffset - scrollLeft;
      }
      headerWidth += colWidth;
    }
    this.ctx.save();
    if (headerWidth > 0) {
      this.ctx.fillStyle = this.theme.colors.headerBackground;
      this.ctx.fillRect(headerX, 0, headerWidth, headerHeight);
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(headerX, headerHeight);
      this.ctx.lineTo(headerX + headerWidth, headerHeight);
      this.ctx.stroke();
    }
    for (const headerCell of visibleHeaderCells) {
      if (headerCell.column.fixed === "left" || headerCell.column.fixed === "right") {
        continue;
      }
      const leafColumns = this.layoutManager.getLeafColumns();
      const columnIndex = leafColumns.findIndex((col) => col === headerCell.column);
      const reorderedIndex = centerColumnIndices.indexOf(columnIndex);
      let cellX = headerCell.x - scrollLeft;
      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== void 0) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]);
        cellX = firstColOffset - scrollLeft + newOffset;
      }
      const isHovered = headerCell.column.key === hoveredHeaderColumnKey;
      this.renderHeaderCellMultiLevel(
        headerCell.column,
        cellX,
        headerCell.y,
        headerCell.width,
        headerCell.height,
        headerCell.colspan,
        headerCell.rowspan,
        sortConfig,
        filterConfig,
        isHovered,
        false,
        columnIndex
      );
    }
    this.ctx.restore();
  }
  renderHeaderCellMultiLevel(column, x, y, width, height, _colspan, _rowspan, sortConfig, filterConfig, isHovered = false, _isDragHandleHovered = false, columnIndex = -1) {
    if (column.key.startsWith("__hidden_placeholder__")) {
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === columnIndex;
      this.ctx.fillStyle = isColumnHovered ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground;
      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }
    const padding = 8;
    const isReorderable = column.reorderable !== false;
    const showDragHandle = isReorderable && isHovered;
    const dragHandleWidth = showDragHandle ? 10 : 0;
    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const sortInfo = sortConfig.find((s) => s.column === column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const isSortable = column.sortable !== false;
    const showSortIndicator = !column.children?.length && isSortable && (sortDirection !== "none" || isHovered);
    const sortIndicatorWidth = showSortIndicator ? 20 : 0;
    const hasFilter = filterConfig.some((f) => f.column === column.key);
    const showFilterIndicator = !column.children?.length && column.filterable && (hasFilter || isHovered);
    const filterIndicatorWidth = showFilterIndicator ? 20 : 0;
    const maxTextWidth = width - padding * 2 - sortIndicatorWidth - filterIndicatorWidth - dragHandleWidth - (showDragHandle ? 4 : 0);
    const text = truncateText(column.title, Math.floor(maxTextWidth / 7));
    const align = column.align ?? "center";
    let textX = x + padding + dragHandleWidth + (showDragHandle ? 4 : 0);
    if (align === "center") {
      textX = x + (width - this.ctx.measureText(text).width - sortIndicatorWidth - filterIndicatorWidth) / 2;
      if (showDragHandle) {
        textX = Math.max(textX, x + padding + dragHandleWidth + 4);
      }
    } else if (align === "right") {
      textX = x + width - padding - this.ctx.measureText(text).width - sortIndicatorWidth - filterIndicatorWidth;
    }
    const textY = y + height / 2;
    this.ctx.fillText(text, textX, textY);
    if (showDragHandle) {
      this.renderDragHandle(x + padding, y + height / 2);
    }
    if (showFilterIndicator) {
      const filterX = x + width - padding - 10;
      if (showSortIndicator) {
        this.renderSortIndicator(
          filterX - 16,
          textY,
          sortDirection === "none" ? "hover" : sortDirection
        );
      }
      this.renderFilterIndicator(filterX, textY, hasFilter);
    } else if (showSortIndicator) {
      this.renderSortIndicator(
        x + width - padding - 10,
        textY,
        sortDirection === "none" ? "hover" : sortDirection
      );
    }
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);
  }
  renderCenterRows(columns, rows, startRow, endRow, centerColumnIndices, scrollLeft, scrollTop, options) {
    const renderedMerges = /* @__PURE__ */ new Set();
    const activeRowIndex = this.currentRowResizeState?.rowIndex;
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (rowIndex === activeRowIndex) {
        continue;
      }
      const row = rows[rowIndex];
      if (!row) continue;
      this.renderCenterRow(
        columns,
        rows,
        row,
        rowIndex,
        centerColumnIndices,
        scrollLeft,
        scrollTop,
        options,
        renderedMerges
      );
    }
    const activeRow = activeRowIndex !== void 0 && activeRowIndex >= startRow && activeRowIndex <= endRow ? rows[activeRowIndex] : void 0;
    if (activeRowIndex !== void 0 && activeRow) {
      this.renderCenterRow(
        columns,
        rows,
        activeRow,
        activeRowIndex,
        centerColumnIndices,
        scrollLeft,
        scrollTop,
        options,
        /* @__PURE__ */ new Set()
      );
    }
  }
  renderCenterRow(columns, rows, row, rowIndex, centerColumnIndices, scrollLeft, scrollTop, options, renderedMerges) {
    const absRowY = this.layoutManager.getRowOffset(rowIndex);
    const rowHeight = this.getRenderedRowHeight(rowIndex);
    const rowY = absRowY - scrollTop;
    const leafColumns = this.layoutManager.getLeafColumns();
    let backgroundColor = this.theme.colors.rowBackground;
    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }
    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }
    const isHoveredRow = options.hoveredCell?.rowIndex === rowIndex;
    if (isHoveredRow) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }
    for (const colIndex of centerColumnIndices) {
      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        continue;
      }
      const column = leafColumns[colIndex];
      if (!column) continue;
      const reorderedIndex = centerColumnIndices.indexOf(colIndex);
      let x;
      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== void 0) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]);
        x = firstColOffset - scrollLeft + newOffset;
      } else {
        const absX = this.layoutManager.getColumnOffset(colIndex);
        x = absX - scrollLeft;
      }
      const width = this.layoutManager.getColumnWidthByIndex(colIndex);
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(x, rowY, width, rowHeight);
    }
    const affectingMerges = this.layoutManager.getMergesAffectingRow(rowIndex);
    for (const merge of affectingMerges) {
      if (!centerColumnIndices.includes(merge.columnIndex)) continue;
      const mergeKey = `${merge.rowIndex}-${merge.columnIndex}`;
      if (renderedMerges.has(mergeKey)) continue;
      const startRow = rows[merge.rowIndex];
      if (!startRow) continue;
      const mergedPos = this.layoutManager.getMergedCellPosition(merge.rowIndex, merge.columnIndex);
      if (!mergedPos) continue;
      const column = leafColumns[merge.columnIndex];
      if (!column) continue;
      const value = startRow.data[getColumnField(column)];
      const mergeContainsHoveredRow = options.hoveredCell?.rowIndex !== void 0 && options.hoveredCell.rowIndex >= merge.rowIndex && options.hoveredCell.rowIndex < merge.rowIndex + merge.rowspan;
      const mergeBackgroundColor = mergeContainsHoveredRow ? this.theme.colors.rowHoverBackground : backgroundColor;
      const mergeX = mergedPos.x - scrollLeft;
      const mergeY = mergedPos.y - scrollTop;
      this.ctx.fillStyle = mergeBackgroundColor;
      this.ctx.fillRect(mergeX, mergeY, mergedPos.width, mergedPos.height);
      this.renderCellWithPosition(
        column,
        startRow,
        merge.rowIndex,
        merge.columnIndex,
        value,
        mergeX,
        mergeY,
        mergedPos.width,
        mergedPos.height,
        options
      );
      renderedMerges.add(mergeKey);
    }
    for (const colIndex of centerColumnIndices) {
      const column = leafColumns[colIndex];
      if (!column) continue;
      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        continue;
      }
      const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
      if (merge) {
        continue;
      }
      const value = row.data[getColumnField(column)];
      const reorderedIndex = centerColumnIndices.indexOf(colIndex);
      let x;
      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== void 0) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]);
        x = firstColOffset - scrollLeft + newOffset;
      } else {
        const absX = this.layoutManager.getColumnOffset(colIndex);
        x = absX - scrollLeft;
      }
      const width = this.layoutManager.getColumnWidthByIndex(colIndex);
      const absY = this.layoutManager.getRowOffset(rowIndex);
      const y = absY - scrollTop;
      const height = this.getRenderedRowHeight(rowIndex);
      this.renderCellWithPosition(
        column,
        row,
        rowIndex,
        colIndex,
        value,
        x,
        y,
        width,
        height,
        options
      );
    }
  }
  renderFixedColumnsContent(columns, rows, fixedColumnIndices, startX, scrollTop, visibleRange, options) {
    const viewportHeight = this.canvas.height / this.dpr;
    this.ctx.save();
    let _totalFixedWidth = 0;
    for (const colIndex of fixedColumnIndices) {
      _totalFixedWidth += this.layoutManager.getColumnWidthByIndex(colIndex);
    }
    const renderedMerges = /* @__PURE__ */ new Set();
    const activeRowIndex = this.currentRowResizeState?.rowIndex;
    const startRow = Math.max(0, visibleRange.startRow);
    const endRow = Math.min(rows.length - 1, visibleRange.endRow);
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (rowIndex === activeRowIndex) {
        continue;
      }
      const row = rows[rowIndex];
      if (!row) continue;
      const absRowY = this.layoutManager.getRowOffset(rowIndex);
      const rowHeight = this.getRenderedRowHeight(rowIndex);
      const rowY = absRowY - scrollTop;
      if (absRowY + rowHeight < scrollTop || absRowY > scrollTop + viewportHeight) {
        continue;
      }
      let backgroundColor = this.theme.colors.rowBackground;
      if (options.stripeRows && rowIndex % 2 === 1) {
        backgroundColor = this.theme.colors.rowAltBackground;
      }
      if (row.selected) {
        backgroundColor = this.theme.colors.rowSelectedBackground;
      }
      const isHoveredRow = options.hoveredCell?.rowIndex === rowIndex;
      if (isHoveredRow) {
        backgroundColor = this.theme.colors.rowHoverBackground;
      }
      for (const colIndex of fixedColumnIndices) {
        if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
          continue;
        }
        const colWidth = this.layoutManager.getColumnWidthByIndex(colIndex);
        const colX = startX + this.layoutManager.getColumnOffset(colIndex) - this.layoutManager.getColumnOffset(fixedColumnIndices[0]);
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(colX, rowY, colWidth, rowHeight);
      }
      const affectingMerges = this.layoutManager.getMergesAffectingRow(rowIndex);
      const leafColumns = this.layoutManager.getLeafColumns();
      for (const merge of affectingMerges) {
        if (!fixedColumnIndices.includes(merge.columnIndex)) continue;
        const mergeKey = `${merge.rowIndex}-${merge.columnIndex}`;
        if (renderedMerges.has(mergeKey)) continue;
        const startRow2 = rows[merge.rowIndex];
        if (!startRow2) continue;
        const mergedPos = this.layoutManager.getMergedCellPosition(
          merge.rowIndex,
          merge.columnIndex
        );
        if (!mergedPos) continue;
        const column = leafColumns[merge.columnIndex];
        if (!column) continue;
        const value = startRow2.data[getColumnField(column)];
        let mergedWidth = 0;
        const mergedStartX = startX + this.layoutManager.getColumnOffset(merge.columnIndex) - this.layoutManager.getColumnOffset(fixedColumnIndices[0]);
        for (let i = 0; i < merge.colspan; i++) {
          const mergedColIndex = merge.columnIndex + i;
          if (fixedColumnIndices.includes(mergedColIndex)) {
            mergedWidth += this.layoutManager.getColumnWidthByIndex(mergedColIndex);
          }
        }
        const mergeContainsHoveredRow = options.hoveredCell?.rowIndex !== void 0 && options.hoveredCell.rowIndex >= merge.rowIndex && options.hoveredCell.rowIndex < merge.rowIndex + merge.rowspan;
        const mergeBackgroundColor = mergeContainsHoveredRow ? this.theme.colors.rowHoverBackground : backgroundColor;
        const mergeY = mergedPos.y - scrollTop;
        this.ctx.fillStyle = mergeBackgroundColor;
        this.ctx.fillRect(mergedStartX, mergeY, mergedWidth, mergedPos.height);
        this.renderCellWithPosition(
          column,
          startRow2,
          merge.rowIndex,
          merge.columnIndex,
          value,
          mergedStartX,
          mergeY,
          mergedWidth,
          mergedPos.height,
          options
        );
        renderedMerges.add(mergeKey);
      }
      let currentX = startX;
      for (const colIndex of fixedColumnIndices) {
        const column = leafColumns[colIndex];
        if (!column) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }
        if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }
        const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
        if (merge) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }
        const width = this.layoutManager.getColumnWidthByIndex(colIndex);
        const value = row.data[getColumnField(column)];
        this.renderCellWithPosition(
          column,
          row,
          rowIndex,
          colIndex,
          value,
          currentX,
          rowY,
          width,
          rowHeight,
          options
        );
        currentX += width;
      }
    }
    const activeRow = activeRowIndex !== void 0 ? rows[activeRowIndex] : void 0;
    if (activeRowIndex !== void 0 && activeRow) {
      this.renderFixedRowOverlay(
        columns,
        activeRow,
        activeRowIndex,
        fixedColumnIndices,
        startX,
        scrollTop,
        options
      );
    }
    this.ctx.restore();
  }
  renderFixedRowOverlay(columns, row, rowIndex, fixedColumnIndices, startX, scrollTop, options) {
    const absRowY = this.layoutManager.getRowOffset(rowIndex);
    const rowHeight = this.getRenderedRowHeight(rowIndex);
    const rowY = absRowY - scrollTop;
    const viewportHeight = this.canvas.height / this.dpr;
    const leafColumns = this.layoutManager.getLeafColumns();
    if (absRowY + rowHeight < scrollTop || absRowY > scrollTop + viewportHeight) {
      return;
    }
    let backgroundColor = this.theme.colors.rowBackground;
    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }
    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }
    if (options.hoveredCell?.rowIndex === rowIndex) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }
    let currentX = startX;
    for (const colIndex of fixedColumnIndices) {
      const width = this.layoutManager.getColumnWidthByIndex(colIndex);
      const column = leafColumns[colIndex];
      if (!column) {
        currentX += width;
        continue;
      }
      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        currentX += width;
        continue;
      }
      const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
      if (merge && (merge.rowIndex !== rowIndex || merge.columnIndex !== colIndex)) {
        currentX += width;
        continue;
      }
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(currentX, rowY, width, rowHeight);
      const value = row.data[getColumnField(column)];
      this.renderCellWithPosition(
        column,
        row,
        rowIndex,
        colIndex,
        value,
        currentX,
        rowY,
        width,
        rowHeight,
        options
      );
      currentX += width;
    }
  }
  renderFixedColumnsHeader(_columns, fixedColumnIndices, startX, sortConfig, filterConfig, hoveredHeaderColumnKey, _columnReorderState) {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const headerCells = this.layoutManager.getHeaderCells();
    this.ctx.save();
    let _totalFixedWidth = 0;
    for (const colIndex of fixedColumnIndices) {
      _totalFixedWidth += this.layoutManager.getColumnWidthByIndex(colIndex);
    }
    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(startX, 0, _totalFixedWidth, headerHeight);
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, headerHeight);
    this.ctx.lineTo(startX + _totalFixedWidth, headerHeight);
    this.ctx.stroke();
    const isRightFixed = fixedColumnIndices.length > 0 && this.layoutManager.getLeafColumn(fixedColumnIndices[0])?.fixed === "right";
    const offsetX = isRightFixed ? startX - (layoutInfo.totalWidth - _totalFixedWidth) : 0;
    for (const headerCell of headerCells) {
      if (!headerCell.isLeaf) continue;
      if (!fixedColumnIndices.includes(headerCell.colIndex)) continue;
      const isHovered = headerCell.column.key === hoveredHeaderColumnKey;
      this.renderHeaderCellMultiLevel(
        headerCell.column,
        headerCell.x + offsetX,
        headerCell.y,
        headerCell.width,
        headerCell.height,
        headerCell.colspan,
        headerCell.rowspan,
        sortConfig,
        filterConfig,
        isHovered,
        false,
        headerCell.colIndex
      );
    }
    this.ctx.restore();
  }
  renderHeader(columns, startColumn, endColumn, scrollTop, sortConfig, _scrollLeft) {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const leafColumns = this.layoutManager.getLeafColumns();
    this.ctx.save();
    this.ctx.translate(0, scrollTop);
    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(0, 0, layoutInfo.totalWidth, headerHeight);
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerHeight);
    this.ctx.lineTo(layoutInfo.totalWidth, headerHeight);
    this.ctx.stroke();
    for (let colIndex = startColumn; colIndex <= endColumn; colIndex++) {
      const column = leafColumns[colIndex];
      if (!column) continue;
      const { x, width } = this.layoutManager.getCellPosition(0, colIndex);
      this.renderHeaderCell(column, x, 0, width, headerHeight, colIndex, sortConfig);
    }
    this.ctx.restore();
  }
  renderHeaderCell(column, x, y, width, height, columnIndex, sortConfig) {
    if (column.key.startsWith("__hidden_placeholder__")) {
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === columnIndex;
      this.ctx.fillStyle = isColumnHovered ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground;
      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }
    const padding = 8;
    const dragHandleWidth = 0;
    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const sortInfo = sortConfig.find((s) => s.column === column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const sortIndicatorWidth = sortDirection !== "none" ? 20 : 0;
    const maxTextWidth = width - padding * 2 - sortIndicatorWidth - dragHandleWidth - 0;
    const text = truncateText(column.title, Math.floor(maxTextWidth / 7));
    const align = column.align ?? "left";
    let textX = x + padding + dragHandleWidth + 0;
    if (align === "center") {
      textX = x + (width - this.ctx.measureText(text).width - sortIndicatorWidth) / 2;
    } else if (align === "right") {
      textX = x + width - padding - this.ctx.measureText(text).width - sortIndicatorWidth;
    }
    this.ctx.fillText(text, textX, y + height / 2);
    if (sortDirection !== "none") {
      this.renderSortIndicator(x + width - padding - 10, y + height / 2, sortDirection);
    }
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);
  }
  renderDragHandle(x, y) {
    const dotRadius = 1;
    const dotGapX = 5;
    const dotGapY = 4;
    const cols = 2;
    const rows = 3;
    const totalHeight = (rows - 1) * dotGapY;
    const startX = x;
    const startY = y - totalHeight / 2;
    this.ctx.fillStyle = this.theme.colors.indicator.inactive;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dotX = startX + col * dotGapX;
        const dotY = startY + row * dotGapY;
        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
  renderSortIndicator(x, y, direction) {
    const arrowWidth = 8;
    const arrowHeight = 5;
    const gap = 2;
    const activeColor = this.theme.colors.indicator.active;
    const inactiveColor = this.theme.colors.indicator.inactive;
    this.ctx.beginPath();
    this.ctx.moveTo(x - arrowWidth / 2, y - gap);
    this.ctx.lineTo(x + arrowWidth / 2, y - gap);
    this.ctx.lineTo(x, y - gap - arrowHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = direction === "asc" ? activeColor : inactiveColor;
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(x - arrowWidth / 2, y + gap);
    this.ctx.lineTo(x + arrowWidth / 2, y + gap);
    this.ctx.lineTo(x, y + gap + arrowHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = direction === "desc" ? activeColor : inactiveColor;
    this.ctx.fill();
  }
  renderFilterIndicator(x, y, hasFilter) {
    const size = 10;
    const activeColor = this.theme.colors.indicator.active;
    const inactiveColor = this.theme.colors.indicator.inactive;
    this.ctx.fillStyle = hasFilter ? activeColor : inactiveColor;
    this.ctx.beginPath();
    this.ctx.moveTo(x - size / 2, y - size / 2);
    this.ctx.lineTo(x + size / 2, y - size / 2);
    this.ctx.lineTo(x, y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillRect(x - 1, y, 2, size / 2);
  }
  renderRows(columns, rows, startRow, endRow, startColumn, endColumn, options) {
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;
      this.renderRow(columns, row, rowIndex, startColumn, endColumn, options);
    }
  }
  renderRow(columns, row, rowIndex, startColumn, endColumn, options) {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const { x: rowX, y: rowY, height: rowHeight } = this.layoutManager.getCellPosition(rowIndex, 0);
    const rowWidth = layoutInfo.totalWidth;
    let backgroundColor = this.theme.colors.rowBackground;
    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }
    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }
    if (options.hoveredCell?.rowIndex === rowIndex) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(rowX, rowY, rowWidth, rowHeight);
    for (let colIndex = startColumn; colIndex <= endColumn; colIndex++) {
      const column = columns[colIndex];
      if (!column) continue;
      const value = row.data[getColumnField(column)];
      this.renderCell(column, row, rowIndex, colIndex, value, options);
    }
  }
  renderCell(column, row, rowIndex, colIndex, value, options) {
    const { x, y, width, height } = this.layoutManager.getCellPosition(rowIndex, colIndex);
    this.renderCellInternal(column, row, rowIndex, colIndex, value, x, y, width, height, options);
  }
  renderCellWithPosition(column, row, rowIndex, colIndex, value, x, y, width, height, options, rowBandTrace) {
    this.renderCellInternal(
      column,
      row,
      rowIndex,
      colIndex,
      value,
      x,
      y,
      width,
      height,
      options,
      rowBandTrace
    );
  }
  renderCellInternal(column, row, rowIndex, colIndex, value, x, y, width, height, options, rowBandTrace) {
    const padding = 8;
    const measureCell = (name, fn) => this.measureRowBandCellDetail(rowBandTrace, name, fn);
    if (column.key.startsWith("__hidden_placeholder__")) {
      measureCell("hiddenPlaceholder", () => {
        const isColumnHovered = this.hoveredPlaceholderColumnIndex === colIndex;
        this.ctx.fillStyle = isColumnHovered ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.rowBackground;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = this.theme.border.width;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width, y);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.stroke();
      });
      return;
    }
    const isDisabled = measureCell(
      "resolveDisabled",
      () => this.resolveDisabled(column.disabled, row, column)
    );
    const cacheMode = measureCell("cacheMode", () => this.getCacheMode(column));
    let renderResult;
    if (this.renderCache && cacheMode !== false) {
      const cached = measureCell(
        "cacheGet",
        () => this.renderCache.get(row, column, value, cacheMode)
      );
      if (cached) {
        renderResult = cached;
      } else {
        renderResult = measureCell(
          "executeRender",
          () => this.executeRender(column, row, rowIndex, value, rowBandTrace)
        );
        measureCell("cacheSet", () => {
          this.renderCache.set(row, column, value, renderResult, cacheMode);
        });
      }
    } else {
      renderResult = measureCell(
        "executeRender",
        () => this.executeRender(column, row, rowIndex, value, rowBandTrace)
      );
    }
    const isCellSelected = measureCell(
      "selectionCheck",
      () => this.isCellSelected(rowIndex, colIndex, options.selectedCells)
    );
    const { isHovered, isEditing } = measureCell("hoverEditingCheck", () => ({
      isHovered: options.hoveredCell?.rowIndex === rowIndex && options.hoveredCell?.columnIndex === colIndex,
      isEditing: options.editingCell?.rowIndex === rowIndex && options.editingCell?.columnIndex === colIndex
    }));
    measureCell("stateBackground", () => {
      if (isCellSelected && !row.selected) {
        this.ctx.fillStyle = this.theme.colors.rowSelectedBackground;
        this.ctx.fillRect(x, y, width, height);
      } else if (isHovered && !row.selected) {
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
        this.ctx.fillRect(x, y, width, height);
      }
    });
    if (!isEditing) {
      const isExpandColumn = this.expandColumnKey === column.key;
      const hasChildren = row.children && row.children.length > 0;
      const level = row.level ?? 0;
      if (isExpandColumn && hasChildren) {
        measureCell("expandIcon", () => {
          this.renderExpandIcon(x, y, width, height, row.expanded ?? false, level);
        });
        const iconWidth = 12 + padding;
        const levelIndent = level * 16;
        measureCell("renderCellContent", () => {
          this.renderCellContent(
            renderResult,
            x + iconWidth + levelIndent,
            y,
            width - iconWidth - levelIndent,
            height,
            padding,
            column.align,
            rowIndex,
            colIndex,
            isDisabled,
            column.key,
            row,
            column,
            value
          );
        });
      } else {
        const levelIndent = isExpandColumn ? level * 16 : 0;
        measureCell("renderCellContent", () => {
          this.renderCellContent(
            renderResult,
            x + levelIndent,
            y,
            width - levelIndent,
            height,
            padding,
            column.align,
            rowIndex,
            colIndex,
            isDisabled,
            column.key,
            row,
            column,
            value
          );
        });
      }
    }
    measureCell("border", () => {
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
    });
    const validationKey = `${rowIndex}-${colIndex}`;
    const validationError = measureCell(
      "validationLookup",
      () => this.currentValidationErrors.get(validationKey)
    );
    if (validationError) {
      measureCell("validationDraw", () => {
        const outlineWidth = Math.max(this.theme.border.width, 2);
        const inset = outlineWidth / 2;
        this.ctx.strokeStyle = validationError.level === "warning" ? this.theme.colors.tagColors.warning ?? "#faad14" : this.theme.colors.tagColors.error ?? "#ff4d4f";
        this.ctx.lineWidth = outlineWidth;
        this.ctx.strokeRect(x + inset, y + inset, width - outlineWidth, height - outlineWidth);
      });
    } else {
      const isPendingValidation = measureCell(
        "pendingValidationLookup",
        () => this.currentPendingValidations.has(validationKey)
      );
      if (isPendingValidation) {
        measureCell("pendingValidationDraw", () => {
          const outlineWidth = Math.max(this.theme.border.width, 2);
          const inset = outlineWidth / 2;
          const pulsePhase = Date.now() % 1500 / 1500;
          const alpha = 0.3 + 0.4 * Math.sin(pulsePhase * Math.PI * 2);
          this.ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          this.ctx.lineWidth = outlineWidth;
          this.ctx.strokeRect(x + inset, y + inset, width - outlineWidth, height - outlineWidth);
        });
      }
    }
    if (isDisabled) {
      measureCell("disabledOverlay", () => {
        const overlayColor = this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
        this.ctx.fillStyle = overlayColor;
        this.ctx.fillRect(x, y, width, height);
      });
    }
  }
  /**
   * 获取列的缓存模式
   */
  getCacheMode(column) {
    if (column.cacheRender === false) return false;
    if (column.cacheMode === false) return false;
    if (column.cacheMode === "value") return "value";
    if (column.cacheMode === "cell") return "cell";
    return false;
  }
  /**
   * 执行渲染函数
   */
  executeRender(column, row, rowIndex, value, rowBandTrace) {
    const measureCell = (name, fn) => this.measureRowBandCellDetail(rowBandTrace, name, fn);
    let renderResult = {
      text: measureCell("formatValue", () => this.formatValue(value, column, row, rowBandTrace)),
      type: column.type ?? "text"
    };
    if (column.type === "number") {
      renderResult.placeholder = column.placeholder ?? this.locale.cell.numberPlaceholder;
    }
    if (column.render) {
      try {
        const customResult = measureCell(
          "columnRender",
          () => column.render(value, row, column, rowIndex)
        );
        if (customResult) {
          renderResult = measureCell("mergeRenderResult", () => ({
            ...renderResult,
            ...customResult
          }));
        }
      } catch (error) {
        measureCell("renderError", () => {
          console.error(`Error rendering cell at row ${rowIndex}, column ${column.key}:`, error);
        });
        renderResult = {
          text: "[Error]",
          type: "text"
        };
      }
    }
    return renderResult;
  }
  renderCellContent(renderResult, x, y, width, height, padding, defaultAlign, rowIndex, colIndex, isDisabled, columnKey, row, column, value) {
    try {
      this.renderCellContentInternal(
        renderResult,
        x,
        y,
        width,
        height,
        padding,
        defaultAlign,
        rowIndex,
        colIndex,
        isDisabled,
        columnKey,
        row,
        column,
        value
      );
    } catch (error) {
      console.error(`Error rendering cell content at row ${rowIndex}, col ${colIndex}:`, error);
      this.ctx.fillStyle = this.theme.colors.cellText;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("[Render Error]", x + padding, y + height / 2);
    }
  }
  renderWithCellRenderer(type, value, x, y, width, height, options = {}) {
    const renderer = this.cellRendererRegistry.get(type);
    if (!renderer) {
      return null;
    }
    return renderer.render(
      this.cellRendererRegistry.createContext({
        ctx: this.ctx,
        theme: this.theme,
        layoutManager: this.layoutManager,
        x,
        y,
        width,
        height,
        column: { key: type, title: type, type },
        row: { id: "", data: {} },
        rowIndex: options.rowIndex ?? -1,
        colIndex: options.colIndex ?? -1,
        value,
        isDisabled: options.isDisabled ?? false,
        isHovered: options.isHovered ?? false,
        isSelected: false,
        dpr: this.dpr,
        locale: this.locale,
        switchAnimation: options.switchAnimation,
        buttonHoverState: options.buttonHoverState,
        multipleSelectSeparator: options.multipleSelectSeparator,
        hoveredButtonIndex: options.hoveredButtonIndex,
        hoveredImageIndex: options.hoveredImageIndex,
        buttonOptions: options.buttonOptions,
        imageRuntime: options.imageRuntime
      })
    );
  }
  renderCellContentInternal(renderResult, x, y, width, height, padding, defaultAlign, rowIndex, colIndex, isDisabled, columnKey, row, column, value) {
    this.ctx.save();
    try {
      const { text, type, style, checkbox, radio, button, input, tags, link } = renderResult;
      const ck = columnKey ?? "(unknown)";
      const fontSize = style?.fontSize ?? this.theme.font.size;
      const fontFamily = style?.fontFamily ?? this.theme.font.family;
      const fontWeight = style?.fontWeight ?? "normal";
      const fontStyle = style?.fontStyle ?? "normal";
      const fontKey = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      const cellLocation = this.performanceEnabled ? { rowIndex, colIndex, x, y, width, height } : void 0;
      this.ctx.font = fontKey;
      if (type === CellTypes.CHECKBOX && checkbox) {
        this.measureRender("checkbox", ck, cellLocation, () => {
          this.renderWithCellRenderer("checkbox", checkbox, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled
          });
        });
        return;
      }
      if (type === CellTypes.RADIO && radio) {
        this.measureRender("radio", ck, cellLocation, () => {
          this.renderWithCellRenderer("radio", radio, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled
          });
        });
        return;
      }
      if (type === CellTypes.BUTTON && button) {
        if (Array.isArray(button)) {
          let hoveredButtonIndex = -1;
          if (rowIndex !== void 0 && colIndex !== void 0) {
            const isCurrentCellHovered = this.currentHoveredCell?.rowIndex === rowIndex && this.currentHoveredCell?.columnIndex === colIndex;
            if (isCurrentCellHovered) {
              hoveredButtonIndex = this.currentHoveredButtonIndex;
            }
          }
          this.measureRender("button", ck, cellLocation, () => {
            this.renderWithCellRenderer("button", button, x, y, width, height, {
              rowIndex,
              colIndex,
              isDisabled,
              hoveredButtonIndex,
              buttonOptions: renderResult.buttonOptions
            });
          });
          return;
        }
        let buttonHoverState;
        if (rowIndex !== void 0 && colIndex !== void 0 && this.currentButtonHoverStates) {
          const cellKey = `${rowIndex}-${colIndex}`;
          const hoverState = this.currentButtonHoverStates.get(cellKey);
          if (hoverState) {
            buttonHoverState = hoverState;
          }
        }
        this.measureRender("button", ck, cellLocation, () => {
          this.renderWithCellRenderer("button", button, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            buttonHoverState
          });
        });
        return;
      }
      if (type === CellTypes.SWITCH && renderResult.switch) {
        let switchAnimation;
        if (rowIndex !== void 0 && colIndex !== void 0 && this.currentSwitchAnimations) {
          const cellKey = `${rowIndex}-${colIndex}`;
          const animation = this.currentSwitchAnimations.get(cellKey);
          if (animation) {
            switchAnimation = animation;
          }
        }
        this.measureRender("switch", ck, cellLocation, () => {
          this.renderWithCellRenderer("switch", renderResult.switch, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            switchAnimation
          });
        });
        return;
      }
      if (type === CellTypes.INPUT && input) {
        this.measureRender("input", ck, cellLocation, () => {
          this.renderWithCellRenderer("input", input, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled
          });
        });
        return;
      }
      if (type === CellTypes.SELECT && renderResult.select) {
        this.measureRender("select", ck, cellLocation, () => {
          this.renderWithCellRenderer("select", renderResult.select, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            multipleSelectSeparator: this.multipleSelectSeparator
          });
        });
        return;
      }
      if (type === CellTypes.DATE && renderResult.date) {
        this.measureRender("date", ck, cellLocation, () => {
          this.renderWithCellRenderer("date", renderResult.date, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled
          });
        });
        return;
      }
      if (type === CellTypes.TAG && tags) {
        this.measureRender("tags", ck, cellLocation, () => {
          this.renderWithCellRenderer("tag", tags, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled
          });
        });
        return;
      }
      if (type === CellTypes.IMAGE && renderResult.image) {
        const isHovered = rowIndex !== void 0 && colIndex !== void 0 && this.currentHoveredCell?.rowIndex === rowIndex && this.currentHoveredCell?.columnIndex === colIndex;
        const imageCtx = this.imageRenderContext;
        imageCtx.ctx = this.ctx;
        imageCtx.theme = this.theme;
        imageCtx.locale = this.locale;
        imageCtx.layoutManager = this.layoutManager;
        imageCtx.dpr = this.dpr;
        imageCtx.x = x;
        imageCtx.y = y;
        imageCtx.width = width;
        imageCtx.height = height;
        imageCtx.value = renderResult.image;
        imageCtx.rowIndex = rowIndex ?? -1;
        imageCtx.colIndex = colIndex ?? -1;
        imageCtx.isDisabled = isDisabled ?? false;
        imageCtx.isHovered = !!isHovered;
        imageCtx.hoveredImageIndex = this.currentHoveredImageIndex;
        this.measureRender("image", ck, cellLocation, () => {
          this.imageRenderer.render(imageCtx);
        });
        return;
      }
      if (type === CellTypes.PROGRESS && renderResult.progress) {
        const isDragging = rowIndex !== void 0 && colIndex !== void 0 && this.currentProgressDragState && this.currentProgressDragState.cell.rowIndex === rowIndex && this.currentProgressDragState.cell.columnIndex === colIndex;
        const progressConfig = isDragging ? { ...renderResult.progress, value: this.currentProgressDragState.displayValue } : renderResult.progress;
        this.measureRender("progress", ck, cellLocation, () => {
          this.renderWithCellRenderer("progress", progressConfig, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled
          });
        });
        return;
      }
      if (type === CellTypes.RATING && renderResult.rating) {
        let starBounds;
        this.measureRender("rating", ck, cellLocation, () => {
          starBounds = this.renderWithCellRenderer(
            "rating",
            renderResult.rating,
            x,
            y,
            width,
            height,
            {
              rowIndex,
              colIndex,
              isDisabled
            }
          )?.starBounds;
        });
        if (starBounds) {
          renderResult.starBounds = starBounds;
        }
        return;
      }
      if (type === CellTypes.COLOR && renderResult.color) {
        this.measureRender("color", ck, cellLocation, () => {
          this.renderWithCellRenderer("color", renderResult.color, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled
          });
        });
        return;
      }
      if (renderResult.type === "custom" && renderResult.jsxRender) {
        this.measureRender("jsx", ck, cellLocation, () => {
          this.ctx.save();
          try {
            const contextRow = row ?? Renderer.RENDER_CONTEXT_PLACEHOLDER_ROW;
            const contextColumn = column ?? Renderer.RENDER_CONTEXT_PLACEHOLDER_COLUMN;
            const jsxContext = this.createJSXRenderContext(
              contextRow,
              contextColumn,
              rowIndex ?? -1,
              colIndex ?? -1,
              value
            );
            const elementTree = renderResult.jsxRender(jsxContext);
            const jsxLayoutKey = renderResult.jsxLayoutKey;
            const layoutCacheKey = typeof jsxLayoutKey === "function" ? jsxLayoutKey(jsxContext) ?? null : jsxLayoutKey ?? null;
            this.jsxRenderer.setRenderContext({
              ctx: this.ctx,
              theme: this.theme,
              imageRuntime: this.imageRuntime,
              row: contextRow,
              column: contextColumn,
              rowIndex,
              colIndex,
              cellRect: { x, y, width, height },
              updateValue: jsxContext.updateValue,
              updateField: jsxContext.updateField,
              updateRow: jsxContext.updateRow,
              collectInteractiveRegion: (region) => {
                this.jsxInteractiveRegions.push(region);
              }
            });
            this.jsxRenderer.render(elementTree, x, y, { width, height }, layoutCacheKey);
          } catch (e) {
            console.error(`[Renderer] JSX render error at row ${rowIndex}, col ${colIndex}:`, e);
          } finally {
            this.ctx.restore();
          }
        });
        return;
      }
      if (renderResult.type === "custom" && renderResult.customRender) {
        this.measureRender("custom", ck, cellLocation, () => {
          try {
            renderResult.customRender({
              ctx: this.ctx,
              x,
              y,
              width,
              height,
              padding,
              theme: this.theme,
              dpr: this.dpr
            });
          } catch (e) {
            console.error(`[Renderer] customRender error at row ${rowIndex}, col ${colIndex}:`, e);
          }
        });
        return;
      }
      this.measureRender("text", ck, cellLocation, () => {
        let displayText = text;
        let color = style?.color ?? this.theme.colors.cellText;
        if (type === CellTypes.LINK && link) {
          displayText = link.text || link.link;
          color = style?.color ?? this.theme.colors.linkColor;
        }
        if (type === CellTypes.NUMBER && !displayText) {
          displayText = renderResult.placeholder ?? this.locale.cell.numberPlaceholder;
          color = this.theme.colors.placeholderText;
        }
        if (!displayText) return;
        this.ctx.fillStyle = color;
        const align = style?.horizontalAlign ?? defaultAlign ?? "left";
        const verticalAlign = style?.verticalAlign ?? "middle";
        const fontSize2 = this.theme.font.size;
        const lineHeight = fontSize2 * 1.5;
        const maxTextWidth = width - padding * 2;
        const maxRows = this.calculateMaxRows(height, lineHeight, padding);
        if (maxRows > 1) {
          const wrapped = this.measureWrappedText(displayText, fontKey, maxTextWidth, maxRows);
          const lines = wrapped.lines;
          const totalHeight = lines.length * lineHeight;
          let startY;
          if (verticalAlign === "top") {
            startY = y + padding;
          } else if (verticalAlign === "bottom") {
            startY = y + height - padding - totalHeight;
          } else {
            startY = y + (height - totalHeight) / 2;
          }
          this.ctx.textBaseline = "top";
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineWidth = wrapped.widths[i] ?? 0;
            let textX;
            switch (align) {
              case "center":
                textX = x + (width - lineWidth) / 2;
                break;
              case "right":
                textX = x + width - padding - lineWidth;
                break;
              default:
                textX = x + padding;
            }
            this.ctx.fillText(line, textX, startY + i * lineHeight);
          }
        } else {
          const metrics = this.measureSingleLineText(displayText, fontKey, maxTextWidth);
          displayText = metrics.text;
          const displayWidth = metrics.width;
          let textX;
          switch (align) {
            case "center":
              textX = x + (width - displayWidth) / 2;
              break;
            case "right":
              textX = x + width - padding - displayWidth;
              break;
            default:
              textX = x + padding;
          }
          let textY;
          switch (verticalAlign) {
            case "top":
              this.ctx.textBaseline = "top";
              textY = y + padding;
              break;
            case "bottom":
              this.ctx.textBaseline = "bottom";
              textY = y + height - padding;
              break;
            default:
              this.ctx.textBaseline = "middle";
              textY = y + height / 2;
          }
          if (type === CellTypes.TAG) {
            this.renderTag(displayText, textX, textY, fontSize2);
          } else {
            this.ctx.fillText(displayText, textX, textY);
            if (type === CellTypes.LINK) {
              this.ctx.strokeStyle = color;
              this.ctx.lineWidth = 1;
              this.ctx.beginPath();
              this.ctx.moveTo(textX, textY + fontSize2 / 2 + 2);
              this.ctx.lineTo(textX + displayWidth, textY + fontSize2 / 2 + 2);
              this.ctx.stroke();
            }
          }
        }
      });
    } finally {
      this.ctx.restore();
    }
  }
  renderExpandIcon(x, y, width, height, expanded, level) {
    const size = 8;
    const padding = 8;
    const levelIndent = level * 16;
    const iconX = x + padding + levelIndent + size / 2;
    const iconY = y + height / 2;
    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.beginPath();
    if (expanded) {
      this.ctx.moveTo(iconX - size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX + size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX, iconY + size / 2);
    } else {
      this.ctx.moveTo(iconX - size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX + size / 2, iconY);
      this.ctx.lineTo(iconX - size / 2, iconY + size / 2);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }
  renderButtonsDropdown(dropdown) {
    this.dropdownRenderer.renderButtonsDropdown(dropdown);
  }
  renderImageTooltip(imageTooltip) {
    this.imageOverlayRenderer.renderImageTooltip(imageTooltip);
  }
  renderImageEditor(editor) {
    this.imageOverlayRenderer.renderImageEditor(editor);
  }
  /**
   * 获取文本宽度（使用缓存优化性能）
   * 避免每帧都调用 measureText
   */
  measureTextWidth(text) {
    const fontKey = `${this.theme.font.size}-${this.theme.font.family}`;
    if (this.textWidthCacheKey !== fontKey) {
      this.textWidthCache.clear();
      this.textWidthCacheKey = fontKey;
    }
    const cachedWidth = this.textWidthCache.get(text);
    if (cachedWidth !== void 0) {
      return cachedWidth;
    }
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const width = this.ctx.measureText(text).width;
    this.textWidthCache.set(text, width);
    return width;
  }
  renderColorDropdown(dropdown) {
    this.overlayRenderer.renderColorDropdown(dropdown);
  }
  /**
   * 检查行是否在懒加载范围内
   */
  isInLazyLoadRange(rowIndex, threshold) {
    if (!this.currentVisibleRange) return true;
    const { startRow, endRow } = this.currentVisibleRange;
    const rowHeight = this.rowHeight || this.theme.row.height;
    const extraRows = Math.ceil(threshold / rowHeight);
    const lazyStartRow = Math.max(0, startRow - extraRows);
    const lazyEndRow = endRow + extraRows;
    const row = this.currentRows[rowIndex];
    if (!row) {
      return rowIndex >= lazyStartRow && rowIndex <= lazyEndRow;
    }
    if (this.layoutManager.isRowInPinnedBand(row)) {
      return true;
    }
    const bodyRowIndex = this.layoutManager.getBodyRowIndexByRef(row);
    if (bodyRowIndex >= 0) {
      return bodyRowIndex >= lazyStartRow && bodyRowIndex <= lazyEndRow;
    }
    return rowIndex >= lazyStartRow && rowIndex <= lazyEndRow;
  }
  loadImage(src, targetSize) {
    if (this.isDestroyed) return;
    this.imageLoadQueue.request(src, targetSize, (success) => {
      if (this.isDestroyed) return;
      if (success) {
        this.markDirty(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
        this.onImageLoaded?.();
      }
    });
  }
  /**
   * 收集当前帧可见的图片 URL
   */
  collectVisibleImage(src) {
    if (src && !src.startsWith("data:")) {
      this.frameVisibleUrls.add(src);
    }
  }
  /**
   * 提交当前帧可见图片集合
   */
  commitVisibleImages() {
    this.imageLoadQueue.cancelInvisible(this.frameVisibleUrls);
    this.imageLoadQueue.commitFrame();
    this.frameVisibleUrls = /* @__PURE__ */ new Set();
  }
  /**
   * 重试加载失败的图片
   */
  retryImage(src) {
    this.imageLoadQueue.retry(src);
  }
  /**
   * 检查图片是否加载失败
   */
  isImageFailed(src) {
    return this.imageLoadQueue.isFailed(src);
  }
  /**
   * 检查图片是否已加载
   */
  isImageLoaded(src) {
    return this.imageLoadQueue.has(src);
  }
  /**
   * 清除图片缓存
   */
  clearImageCache() {
    this.imageLoadQueue.clear();
  }
  /**
   * 获取图片加载队列统计信息
   */
  getImageLoadStats() {
    return this.imageLoadQueue.getStats();
  }
  // ==================== 性能监控方法 ====================
  /**
   * 获取最后一帧的诊断信息
   */
  getLastFrameDiagnostics() {
    if (this.frameHistory.length === 0) return null;
    return this.frameHistory[this.frameHistory.length - 1] ?? null;
  }
  /**
   * 获取最差帧的诊断信息（总时间最长的帧）
   */
  getWorstFrameDiagnostics() {
    if (this.frameHistory.length === 0) return null;
    return this.frameHistory.reduce(
      (worst, frame) => frame.totalTime > worst.totalTime ? frame : worst
    );
  }
  /**
   * 获取完整的性能诊断信息
   */
  getPerformanceDiagnostics() {
    return {
      frameHistory: [...this.frameHistory],
      lastFrame: this.getLastFrameDiagnostics(),
      worstFrame: this.getWorstFrameDiagnostics(),
      jsxCache: this.jsxRenderer.getRenderCacheStats()
    };
  }
  /**
   * 启用或禁用性能监控
   */
  setPerformanceMonitoring(enabled) {
    this.performanceEnabled = enabled;
  }
  /**
   * 检查性能监控是否启用
   */
  isPerformanceMonitoringEnabled() {
    return this.performanceEnabled;
  }
  /**
   * 重置性能统计
   */
  resetPerformanceStats() {
    this.performanceStats.clear();
    this.currentFrameStats.clear();
    this.currentFramePhases.clear();
    this.currentFrameRowBandDetails.clear();
    this.lastFrameStats.clear();
    this.frameHistory = [];
    this.frameCount = 0;
  }
  /**
   * 开始帧计时
   */
  beginFrame() {
    if (!this.performanceEnabled) return;
    this.frameStartTime = performance.now();
    this.currentFrameStats.clear();
    this.currentFramePhases.clear();
    this.currentFrameRowBandDetails.clear();
  }
  /**
   * 结束帧计时
   */
  endFrame(visibleRange, scrollTop, scrollLeft, columns) {
    if (!this.performanceEnabled) return;
    const frameEndTime = performance.now();
    const frameTotalTime = frameEndTime - this.frameStartTime;
    this.frameCount++;
    this.lastFrameStats = /* @__PURE__ */ new Map();
    for (const [type, byKey] of this.currentFrameStats) {
      const copiedByKey = /* @__PURE__ */ new Map();
      for (const [columnKey, stats] of byKey) {
        copiedByKey.set(columnKey, this.copyCellStats(stats));
      }
      this.lastFrameStats.set(type, copiedByKey);
    }
    let cellRenderTime = 0;
    for (const byKey of this.currentFrameStats.values()) {
      for (const stat of byKey.values()) {
        cellRenderTime += stat.totalTime;
      }
    }
    let instrumentedPhaseTime = 0;
    for (const stat of this.currentFramePhases.values()) {
      instrumentedPhaseTime += stat.totalTime;
    }
    for (const [type, byKey] of this.currentFrameStats) {
      let totalByKey = this.performanceStats.get(type);
      if (!totalByKey) {
        totalByKey = /* @__PURE__ */ new Map();
        this.performanceStats.set(type, totalByKey);
      }
      for (const [columnKey, frameStat] of byKey) {
        const stats = totalByKey.get(columnKey) || { totalTime: 0, count: 0, maxTime: 0 };
        stats.totalTime += frameStat.totalTime;
        stats.count += frameStat.count;
        if (frameStat.maxTime > stats.maxTime) {
          stats.maxTime = frameStat.maxTime;
          stats.maxCell = frameStat.maxCell ? { ...frameStat.maxCell } : void 0;
        }
        totalByKey.set(columnKey, stats);
      }
    }
    const visibleRows = visibleRange.endRow - visibleRange.startRow + 1;
    const fixedInfo = this.layoutManager.getFixedColumnsInfo(columns);
    const visibleColumns = this.layoutManager.getVisibleCenterColumnIndices().length + fixedInfo.leftFixed.columns.length + fixedInfo.rightFixed.columns.length;
    const visibleCells = visibleRows * visibleColumns;
    const cellsByType = /* @__PURE__ */ new Map();
    for (const [type, byKey] of this.currentFrameStats) {
      const copiedByKey = /* @__PURE__ */ new Map();
      for (const [columnKey, stats] of byKey) {
        copiedByKey.set(columnKey, this.copyCellStats(stats));
      }
      cellsByType.set(type, copiedByKey);
    }
    const phases = /* @__PURE__ */ new Map();
    for (const [name, stats] of this.currentFramePhases) {
      phases.set(name, { ...stats });
    }
    const rowBandDetails = /* @__PURE__ */ new Map();
    for (const [name, stats] of this.currentFrameRowBandDetails) {
      rowBandDetails.set(name, {
        ...stats,
        maxAt: stats.maxAt ? { ...stats.maxAt } : void 0
      });
    }
    const nonCellRendererTime = Math.max(0, frameTotalTime - cellRenderTime);
    const unaccountedTime = Math.max(0, frameTotalTime - instrumentedPhaseTime);
    const frameEntry = {
      frameId: this.frameCount,
      startTime: this.frameStartTime,
      totalTime: frameTotalTime,
      cellRenderTime,
      nonCellRendererTime,
      unaccountedTime,
      phases,
      rowBandDetails,
      cellsByType,
      visibleRows,
      visibleColumns,
      visibleCells,
      scrollTop,
      scrollLeft
    };
    this.frameHistory.push(frameEntry);
    if (this.frameHistory.length > Renderer.MAX_FRAME_HISTORY) {
      this.frameHistory.shift();
    }
  }
  formatCellLocation(location) {
    if (!location) return "row: N/A col: N/A xy: N/A";
    return `row: ${location.rowIndex ?? "N/A"} col: ${location.colIndex ?? "N/A"} xy: (${location.x.toFixed(0)},${location.y.toFixed(0)}) size: ${location.width.toFixed(0)}x${location.height.toFixed(0)}`;
  }
  copyCellStats(stats) {
    return {
      ...stats,
      maxCell: stats.maxCell ? { ...stats.maxCell } : void 0
    };
  }
  /**
   * 测量渲染类型的时间
   */
  measureRender(type, columnKey, location, fn) {
    if (!this.performanceEnabled) {
      fn();
      return;
    }
    const renderLocation = location ?? { x: 0, y: 0, width: 0, height: 0 };
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    this.recordRenderTiming(type, columnKey, duration, renderLocation);
  }
  /**
   * 记录单次渲染耗时（用于内联性能采样的场景，如 image 热路径）
   */
  recordRenderTiming(type, columnKey, duration, location) {
    let byKey = this.currentFrameStats.get(type);
    if (!byKey) {
      byKey = /* @__PURE__ */ new Map();
      this.currentFrameStats.set(type, byKey);
    }
    const frameStats = byKey.get(columnKey) || { totalTime: 0, count: 0, maxTime: 0 };
    frameStats.totalTime += duration;
    frameStats.count++;
    if (duration > frameStats.maxTime) {
      frameStats.maxTime = duration;
      frameStats.maxCell = { ...location };
    }
    byKey.set(columnKey, frameStats);
  }
  /**
   * 测量渲染阶段的时间
   */
  measurePhase(name, fn) {
    if (!this.performanceEnabled) {
      return fn();
    }
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    const phaseStats = this.currentFramePhases.get(name) || { totalTime: 0, count: 0, maxTime: 0 };
    phaseStats.totalTime += duration;
    phaseStats.count++;
    phaseStats.maxTime = Math.max(phaseStats.maxTime, duration);
    this.currentFramePhases.set(name, phaseStats);
    return result;
  }
  recordRowBandDetail(name, duration, location, columnKey) {
    if (!this.performanceEnabled) return;
    const stats = this.currentFrameRowBandDetails.get(name) ?? {
      totalTime: 0,
      count: 0,
      maxTime: 0
    };
    stats.totalTime += duration;
    stats.count++;
    if (duration > stats.maxTime) {
      stats.maxTime = duration;
      stats.maxAt = location ? { ...location } : void 0;
      stats.columnKey = columnKey;
    }
    this.currentFrameRowBandDetails.set(name, stats);
  }
  measureRowBandDetail(name, fn, location, columnKey) {
    if (!this.performanceEnabled) {
      return fn();
    }
    const start = performance.now();
    try {
      return fn();
    } finally {
      this.recordRowBandDetail(name, performance.now() - start, location, columnKey);
    }
  }
  measureRowBandCellDetail(trace, name, fn) {
    if (!trace) {
      return fn();
    }
    return this.measureRowBandDetail(
      `${trace.prefix}.${name}`,
      fn,
      trace.location,
      trace.columnKey
    );
  }
  /**
   * 获取性能统计（按类型聚合，丢失列粒度，仅供向后兼容）
   */
  getPerformanceStats() {
    const result = /* @__PURE__ */ new Map();
    for (const [type, byKey] of this.performanceStats) {
      let totalTime = 0;
      let count = 0;
      let maxTime = 0;
      for (const stats of byKey.values()) {
        totalTime += stats.totalTime;
        count += stats.count;
        maxTime = Math.max(maxTime, stats.maxTime);
      }
      result.set(type, {
        totalTime,
        count,
        maxTime,
        avgTime: count > 0 ? totalTime / count : 0
      });
    }
    return result;
  }
  /**
   * 输出性能报告到控制台
   */
  logPerformanceReport() {
    if (!this.performanceEnabled) return;
    const formatCellLocation = (location) => this.formatCellLocation(location);
    const rows = [];
    for (const [type, byKey] of this.performanceStats) {
      const keyEntries = Array.from(byKey.entries()).map(([columnKey, stats]) => ({
        columnKey,
        ...stats,
        avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0
      })).sort((a, b) => b.avgTime - a.avgTime);
      for (const e of keyEntries) {
        rows.push({
          Type: type,
          Key: e.columnKey,
          Calls: e.count,
          "Avg(ms)": e.avgTime.toFixed(3),
          "Max(ms)": e.maxTime.toFixed(3),
          "Total(ms)": e.totalTime.toFixed(1),
          MaxAt: formatCellLocation(e.maxCell)
        });
      }
    }
    console.group(`🎯 Renderer Performance (Frame ${this.frameCount})`);
    console.table(rows);
    const lastFrame = this.getLastFrameDiagnostics();
    const rowBandDetails = lastFrame?.rowBandDetails;
    if (rowBandDetails && rowBandDetails.size > 0) {
      const phases = lastFrame.phases;
      const rowBandsTotal = phases.get("rowBands")?.totalTime ?? 0;
      const rowBandsFixedTotal = phases.get("rowBandsFixed")?.totalTime ?? 0;
      const total = rowBandsTotal + rowBandsFixedTotal;
      const rowBandRows = Array.from(rowBandDetails.entries()).map(([name, stats]) => ({
        Step: name,
        Column: stats.columnKey ?? "",
        "Total(ms)": stats.totalTime.toFixed(3),
        Count: stats.count,
        "Avg(ms)": (stats.count > 0 ? stats.totalTime / stats.count : 0).toFixed(3),
        "Max(ms)": stats.maxTime.toFixed(3),
        "%": (total > 0 ? stats.totalTime / total * 100 : 0).toFixed(1),
        MaxAt: this.formatCellLocation(stats.maxAt)
      })).sort((a, b) => Number(b["Total(ms)"]) - Number(a["Total(ms)"])).slice(0, 24);
      console.group("🔎 RowBands Details (last frame)");
      console.table(rowBandRows);
      console.groupEnd();
    }
    console.groupEnd();
  }
  /**
   * 获取格式化的性能报告字符串
   */
  getPerformanceReport() {
    const lines = [
      "=== Renderer Performance Report ===",
      `Status: ${this.performanceEnabled ? "Enabled" : "Disabled"}`,
      `Captured Renderer Frames: ${this.frameCount}`,
      `Retained Renderer Frames: ${this.frameHistory.length} (last ${Renderer.MAX_FRAME_HISTORY} max)`
    ];
    const formatRowBandDetails = (details, totalTime, indent = "  ") => {
      if (!details || details.size === 0) return [];
      return Array.from(details.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        avg: stats.count > 0 ? stats.totalTime / stats.count : 0,
        percentage: totalTime > 0 ? stats.totalTime / totalTime * 100 : 0
      })).sort((a, b) => b.totalTime - a.totalTime).slice(0, 24).map((detail) => {
        const location = detail.maxAt ? ` | maxAt: ${this.formatCellLocation(detail.maxAt)}` : "";
        const column = detail.columnKey ? ` | column: ${detail.columnKey}` : "";
        return `${indent}${detail.name.padEnd(42)} | calls: ${detail.count.toString().padStart(5)} | avg: ${detail.avg.toFixed(3).padStart(7)}ms | max: ${detail.maxTime.toFixed(3).padStart(7)}ms | total: ${detail.totalTime.toFixed(2).padStart(8)}ms | ${detail.percentage.toFixed(1).padStart(5)}%` + column + location;
      });
    };
    const frameCount = this.frameCount || 1;
    if (this.performanceStats.size === 0) {
      lines.push("");
      lines.push("No rendering data collected yet.");
      lines.push("Try scrolling the table while monitoring is enabled.");
      return lines.join("\n");
    }
    if (this.lastFrameStats.size > 0) {
      lines.push("");
      lines.push("=== LAST FRAME STATS (most recent frame) ===");
      lines.push("-".repeat(70));
      const typeBuckets2 = Array.from(this.lastFrameStats.entries()).map(([type, byKey]) => {
        const keyEntries = Array.from(byKey.entries()).map(([columnKey, stats]) => ({
          columnKey,
          count: stats.count,
          totalTime: stats.totalTime,
          avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
          maxTime: stats.maxTime,
          maxCell: stats.maxCell
        })).sort((a, b) => b.totalTime - a.totalTime);
        const totalTime = keyEntries.reduce((s, e) => s + e.totalTime, 0);
        const totalCount = keyEntries.reduce((s, e) => s + e.count, 0);
        return { type, totalTime, totalCount, keyEntries };
      }).sort((a, b) => b.totalTime - a.totalTime);
      for (const bucket of typeBuckets2) {
        lines.push(`[${bucket.type}]`);
        for (const e of bucket.keyEntries) {
          lines.push(
            `  ${e.columnKey.padEnd(20)} | calls: ${e.count.toString().padStart(4)} | avg: ${e.avgTime.toFixed(3).padStart(7)}ms | max: ${e.maxTime.toFixed(3).padStart(7)}ms | total: ${e.totalTime.toFixed(2).padStart(6)}ms | maxAt: ${this.formatCellLocation(e.maxCell)}`
          );
        }
        const typeAvg = bucket.totalCount > 0 ? bucket.totalTime / bucket.totalCount : 0;
        let typeMax = 0;
        for (const e of bucket.keyEntries) {
          typeMax = Math.max(typeMax, e.maxTime);
        }
        lines.push(
          `  ${"total".padEnd(20)} | calls: ${bucket.totalCount.toString().padStart(4)} | avg: ${typeAvg.toFixed(3).padStart(7)}ms | max: ${typeMax.toFixed(3).padStart(7)}ms | total: ${bucket.totalTime.toFixed(2).padStart(6)}ms`
        );
      }
      const lastFrameTotal = typeBuckets2.reduce((s, b) => s + b.totalTime, 0);
      lines.push("");
      lines.push(`Last frame total render time: ${lastFrameTotal.toFixed(2)}ms`);
      const lastFrame = this.getLastFrameDiagnostics();
      if (lastFrame?.rowBandDetails?.size > 0) {
        const rowBandsTotal = lastFrame.phases.get("rowBands")?.totalTime ?? 0;
        const rowBandsFixedTotal = lastFrame.phases.get("rowBandsFixed")?.totalTime ?? 0;
        lines.push("");
        lines.push("=== ROW BANDS DETAIL (last frame, top 24) ===");
        lines.push(
          ...formatRowBandDetails(
            lastFrame.rowBandDetails,
            rowBandsTotal + rowBandsFixedTotal,
            "  "
          )
        );
      }
    }
    lines.push("");
    lines.push("=== TOTAL STATS (all frames average) ===");
    lines.push("-".repeat(70));
    const typeBuckets = Array.from(this.performanceStats.entries()).map(([type, byKey]) => {
      const keyEntries = Array.from(byKey.entries()).map(([columnKey, stats]) => ({
        columnKey,
        count: stats.count,
        totalTime: stats.totalTime,
        maxTime: stats.maxTime,
        maxCell: stats.maxCell,
        avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        callsPerFrame: Math.round(stats.count / frameCount),
        avgFrameTime: stats.totalTime / frameCount
      })).sort((a, b) => b.avgFrameTime - a.avgFrameTime);
      const totalCount = keyEntries.reduce((s, e) => s + e.count, 0);
      const totalTime = keyEntries.reduce((s, e) => s + e.totalTime, 0);
      const maxTime = keyEntries.reduce((m, e) => Math.max(m, e.maxTime), 0);
      return { type, totalCount, totalTime, maxTime, keyEntries };
    }).sort((a, b) => b.totalTime - a.totalTime);
    for (const bucket of typeBuckets) {
      lines.push(`[${bucket.type}]`);
      for (const e of bucket.keyEntries) {
        lines.push(
          `  ${e.columnKey.padEnd(20)} | avg calls/frame: ${e.callsPerFrame.toString().padStart(4)} | avg: ${e.avgTime.toFixed(3).padStart(7)}ms | max: ${e.maxTime.toFixed(3).padStart(7)}ms | frameTotal: ${e.avgFrameTime.toFixed(2).padStart(6)}ms | maxAt: ${this.formatCellLocation(e.maxCell)}`
        );
      }
      const typeAvg = bucket.totalCount > 0 ? bucket.totalTime / bucket.totalCount : 0;
      const typeFrameTotal = bucket.totalTime / frameCount;
      const typeCallsPerFrame = Math.round(bucket.totalCount / frameCount);
      lines.push(
        `  ${"total".padEnd(20)} | avg calls/frame: ${typeCallsPerFrame.toString().padStart(4)} | avg: ${typeAvg.toFixed(3).padStart(7)}ms | max: ${bucket.maxTime.toFixed(3).padStart(7)}ms | frameTotal: ${typeFrameTotal.toFixed(2).padStart(6)}ms`
      );
    }
    const avgFrameTotal = typeBuckets.reduce((sum, b) => sum + b.totalTime / frameCount, 0);
    lines.push("");
    lines.push(`Average frame render time: ${avgFrameTotal.toFixed(2)}ms`);
    return lines.join("\n");
  }
  /**
   * 打印性能报告到控制台
   */
  printPerformanceReport() {
    console.log(this.getPerformanceReport());
  }
  renderDropdown(dropdown) {
    this.dropdownRenderer.renderDropdown(dropdown);
  }
  renderTag(text, x, y, fontSize) {
    const padding = 4;
    const textWidth = this.ctx.measureText(text).width;
    const tagWidth = textWidth + padding * 2;
    const tagHeight = fontSize + padding * 2;
    const tagColor = this.theme.colors.tagColors[text.toLowerCase()] ?? this.theme.colors.tagColors["default"];
    this.ctx.fillStyle = tagColor;
    this.ctx.beginPath();
    const radius = 4;
    const tagX = x - padding;
    const tagY = y - fontSize / 2 - padding;
    this.ctx.roundRect(tagX, tagY, tagWidth, tagHeight, radius);
    this.ctx.fill();
    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.fillText(text, x, y);
  }
  resolveDisabled(disabled, row, column) {
    if (disabled === void 0) {
      return false;
    }
    if (typeof disabled === "function") {
      return disabled(row, column);
    }
    return disabled;
  }
  formatValue(value, column, row, rowBandTrace) {
    const measureCell = (name, fn) => this.measureRowBandCellDetail(rowBandTrace, `formatValue.${name}`, fn);
    if (value === null || value === void 0) {
      return measureCell("empty", () => "");
    }
    if (column.formatter) {
      return measureCell("columnFormatter", () => column.formatter(value, row, column));
    }
    switch (column.type) {
      case "number":
        return typeof value === "number" ? measureCell("number.toLocaleString", () => value.toLocaleString()) : measureCell("number.stringConvert", () => String(value));
      case "boolean":
        return measureCell("boolean", () => value ? "Yes" : "No");
      case "date":
        if (value instanceof Date) {
          return measureCell("date.toLocaleDateString", () => value.toLocaleDateString());
        }
        return measureCell("date.stringConvert", () => String(value));
      default:
        return measureCell("default.stringConvert", () => String(value));
    }
  }
  isCellSelected(rowIndex, colIndex, selectedCells) {
    return selectedCells.some((range) => {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);
      return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
    });
  }
  renderCenterSelections(selectedCells, scrollLeft, scrollTop, centerColumnIndices) {
    const leafColumns = this.layoutManager.getLeafColumns();
    for (const range of selectedCells) {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);
      const merge = this.layoutManager.getCellMerge(minRow, minCol);
      let effectiveMinRow = minRow;
      let effectiveMaxRow = maxRow;
      let effectiveMinCol = minCol;
      let effectiveMaxCol = maxCol;
      if (merge) {
        effectiveMinRow = merge.rowIndex;
        effectiveMaxRow = merge.rowIndex + merge.rowspan - 1;
        effectiveMinCol = merge.columnIndex;
        effectiveMaxCol = merge.columnIndex + merge.colspan - 1;
      }
      const centerMinCol = Math.max(effectiveMinCol, Math.min(...centerColumnIndices));
      const centerMaxCol = Math.min(effectiveMaxCol, Math.max(...centerColumnIndices));
      if (centerMinCol > centerMaxCol) continue;
      const startCol = leafColumns[centerMinCol];
      const endCol = leafColumns[centerMaxCol];
      if (!startCol || !endCol) continue;
      if (startCol.fixed || endCol.fixed) continue;
      const drawY = this.layoutManager.getRowViewportY(effectiveMinRow, scrollTop);
      if (drawY === null) continue;
      const selectionHeight = this.layoutManager.getRowOffset(effectiveMaxRow) + this.layoutManager.getRowHeightByIndex(effectiveMaxRow) - this.layoutManager.getRowOffset(effectiveMinRow);
      const startPos = this.layoutManager.getCellPosition(effectiveMinRow, centerMinCol);
      const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, centerMaxCol);
      const selectionWidth = endPos.x + endPos.width - startPos.x;
      const drawX = startPos.x - scrollLeft;
      this.ctx.strokeStyle = this.theme.colors.selectionBorder;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);
      this.ctx.strokeRect(drawX, drawY, selectionWidth, selectionHeight);
    }
  }
  renderFixedSelections(selectedCells, scrollTop, leftFixedIndices, rightFixedIndices) {
    for (const range of selectedCells) {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);
      const merge = this.layoutManager.getCellMerge(minRow, minCol);
      let effectiveMinRow = minRow;
      let effectiveMaxRow = maxRow;
      let effectiveMinCol = minCol;
      let effectiveMaxCol = maxCol;
      if (merge) {
        effectiveMinRow = merge.rowIndex;
        effectiveMaxRow = merge.rowIndex + merge.rowspan - 1;
        effectiveMinCol = merge.columnIndex;
        effectiveMaxCol = merge.columnIndex + merge.colspan - 1;
      }
      const drawY = this.layoutManager.getRowViewportY(effectiveMinRow, scrollTop);
      if (drawY === null) continue;
      const selectionHeight = this.layoutManager.getRowOffset(effectiveMaxRow) + this.layoutManager.getRowHeightByIndex(effectiveMaxRow) - this.layoutManager.getRowOffset(effectiveMinRow);
      this.ctx.strokeStyle = this.theme.colors.selectionBorder;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);
      const leftFixedInSelection = leftFixedIndices.filter(
        (i) => i >= effectiveMinCol && i <= effectiveMaxCol
      );
      if (leftFixedInSelection.length > 0) {
        const leftFixedMin = leftFixedInSelection[0];
        const leftFixedMax = leftFixedInSelection[leftFixedInSelection.length - 1];
        const startPos = this.layoutManager.getCellPosition(effectiveMinRow, leftFixedMin);
        const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, leftFixedMax);
        const selectionWidth = endPos.x + endPos.width - startPos.x;
        this.ctx.strokeRect(startPos.x, drawY, selectionWidth, selectionHeight);
      }
      const rightFixedInSelection = rightFixedIndices.filter(
        (i) => i >= effectiveMinCol && i <= effectiveMaxCol
      );
      if (rightFixedInSelection.length > 0) {
        const rightFixedMin = rightFixedInSelection[0];
        const rightFixedMax = rightFixedInSelection[rightFixedInSelection.length - 1];
        const startPos = this.layoutManager.getCellPosition(effectiveMinRow, rightFixedMin);
        const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, rightFixedMax);
        const selectionWidth = endPos.x + endPos.width - startPos.x;
        this.ctx.strokeRect(startPos.x, drawY, selectionWidth, selectionHeight);
      }
    }
  }
  renderLoadingOverlay() {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    this.ctx.save();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `14px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.locale.loadingText, width / 2, height / 2);
    this.ctx.restore();
  }
  renderEmptyState(message, sortConfig = [], filterConfig = [], hoveredHeaderColumnKey, scrollLeft = 0) {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.fillRect(0, 0, width, height);
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const columns = this.layoutManager.getLeafColumns();
    if (columns.length > 0) {
      const fixedInfo = this.layoutManager.getFixedColumnsInfo(columns);
      const hasLeftFixed = fixedInfo.leftFixed.columns.length > 0;
      const hasRightFixed = fixedInfo.rightFixed.columns.length > 0;
      const leftFixedWidth = hasLeftFixed ? fixedInfo.leftFixed.width : 0;
      const rightFixedWidth = hasRightFixed ? fixedInfo.rightFixed.width : 0;
      this.ctx.save();
      this.ctx.fillStyle = this.theme.colors.headerBackground;
      this.ctx.fillRect(0, 0, width, headerHeight);
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(0, headerHeight);
      this.ctx.lineTo(width, headerHeight);
      this.ctx.stroke();
      const headerCells = this.layoutManager.getVisibleHeaderCells();
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(leftFixedWidth, 0, width - leftFixedWidth - rightFixedWidth, headerHeight);
      this.ctx.clip();
      for (const headerCell of headerCells) {
        if (headerCell.column.fixed === "left" || headerCell.column.fixed === "right") {
          continue;
        }
        const cellX = headerCell.x - scrollLeft;
        this.renderEmptyStateHeaderCell(
          headerCell,
          cellX,
          sortConfig,
          filterConfig,
          hoveredHeaderColumnKey
        );
      }
      this.ctx.restore();
      if (hasLeftFixed) {
        for (const headerCell of headerCells) {
          if (headerCell.column.fixed !== "left") continue;
          this.renderEmptyStateHeaderCell(
            headerCell,
            headerCell.x,
            sortConfig,
            filterConfig,
            hoveredHeaderColumnKey
          );
        }
      }
      if (hasRightFixed) {
        for (const headerCell of headerCells) {
          if (headerCell.column.fixed !== "right") continue;
          const startX = width - rightFixedWidth;
          const offsetX = startX - (this.layoutManager.getLayoutInfo().totalWidth - rightFixedWidth);
          const cellX = headerCell.x + offsetX;
          this.renderEmptyStateHeaderCell(
            headerCell,
            cellX,
            sortConfig,
            filterConfig,
            hoveredHeaderColumnKey
          );
        }
      }
      this.ctx.restore();
    }
    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.font = `14px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(message, width / 2, headerHeight + (height - headerHeight) / 2);
    this.ctx.restore();
  }
  renderEmptyStateHeaderCell(headerCell, cellX, sortConfig, filterConfig, hoveredHeaderColumnKey) {
    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(cellX, headerCell.y, headerCell.width, headerCell.height);
    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const sortInfo = sortConfig.find((s) => s.column === headerCell.column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const isSortable = headerCell.column.sortable !== false;
    const isHovered = headerCell.column.key === hoveredHeaderColumnKey;
    const showSortIndicator = headerCell.isLeaf && isSortable && (sortDirection !== "none" || isHovered);
    const sortIndicatorWidth = showSortIndicator ? 20 : 0;
    const hasFilter = filterConfig.some((f) => f.column === headerCell.column.key);
    const showFilterIndicator = headerCell.isLeaf && headerCell.column.filterable;
    const filterIndicatorWidth = showFilterIndicator ? 20 : 0;
    const padding = 8;
    const maxTextWidth = headerCell.width - padding * 2 - sortIndicatorWidth - filterIndicatorWidth;
    const text = truncateText(headerCell.column.title, Math.floor(maxTextWidth / 7));
    const align = headerCell.column.align ?? "center";
    let textX = cellX + padding;
    if (align === "center") {
      textX = cellX + (headerCell.width - this.ctx.measureText(text).width - sortIndicatorWidth - filterIndicatorWidth) / 2;
    } else if (align === "right") {
      textX = cellX + headerCell.width - padding - this.ctx.measureText(text).width - sortIndicatorWidth - filterIndicatorWidth;
    }
    const textY = headerCell.y + headerCell.height / 2;
    this.ctx.fillText(text, textX, textY);
    if (headerCell.isLeaf) {
      if (showFilterIndicator) {
        const filterX = cellX + headerCell.width - padding - 10;
        if (showSortIndicator) {
          this.renderSortIndicator(
            filterX - 16,
            textY,
            sortDirection === "none" ? "hover" : sortDirection
          );
        }
        this.renderFilterIndicator(filterX, textY, hasFilter);
      } else if (showSortIndicator) {
        this.renderSortIndicator(
          cellX + headerCell.width - padding - 10,
          textY,
          sortDirection === "none" ? "hover" : sortDirection
        );
      }
    }
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(cellX, headerCell.y, headerCell.width, headerCell.height);
  }
  isColumnHovered(column, hoveredIndex) {
    const leafColumns = this.layoutManager.getLeafColumns();
    const hoveredColumn = leafColumns[hoveredIndex];
    if (!hoveredColumn) return false;
    return column.key === hoveredColumn.key;
  }
  renderFixedColumnsShadow(fixedWidth, side) {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const shadowWidth = 10;
    this.ctx.save();
    const gradient = this.ctx.createLinearGradient(
      side === "left" ? fixedWidth : width - fixedWidth - shadowWidth,
      0,
      side === "left" ? fixedWidth + shadowWidth : width - fixedWidth,
      0
    );
    if (side === "left") {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.15)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    } else {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      side === "left" ? fixedWidth : width - fixedWidth - shadowWidth,
      0,
      shadowWidth,
      height
    );
    this.ctx.restore();
  }
  getCanvas() {
    return this.canvas;
  }
  getCanvasContext() {
    return this.ctx;
  }
  renderTooltip(tooltip) {
    this.overlayRenderer.renderTooltip(tooltip);
  }
  renderScrollbars(scrollLeft, scrollTop, maxScrollLeft, maxScrollTop, scrollbarState) {
    this.overlayRenderer.renderScrollbars(
      scrollLeft,
      scrollTop,
      maxScrollLeft,
      maxScrollTop,
      scrollbarState
    );
  }
  renderWatermark() {
    this.overlayRenderer.renderWatermark();
  }
  getScrollbarBounds(scrollLeft, scrollTop, maxScrollLeft, maxScrollTop) {
    return this.overlayRenderer.getScrollbarBounds(
      scrollLeft,
      scrollTop,
      maxScrollLeft,
      maxScrollTop
    );
  }
  renderFilterDropdown(filterDropdown) {
    this.filterDropdownRenderer.render(filterDropdown);
  }
  renderDateDropdown(dateDropdown) {
    this.overlayRenderer.renderDateDropdown(dateDropdown);
  }
  renderContextMenu(contextMenu) {
    this.overlayRenderer.renderContextMenu(contextMenu);
  }
  renderHeaderContextMenu(headerContextMenu) {
    this.overlayRenderer.renderHeaderContextMenu(headerContextMenu);
  }
  getRenderedRowHeight(rowIndex) {
    if (this.currentRowResizeState?.rowIndex === rowIndex) {
      return this.currentRowResizeState.displayHeight;
    }
    return this.layoutManager.getRowHeightByIndex(rowIndex);
  }
  renderRowResizeGuide(viewportWidth) {
    if (!this.currentRowResizeState) {
      return;
    }
    const rowY = this.layoutManager.getRowViewportY(
      this.currentRowResizeState.rowIndex,
      this.currentScrollTop
    );
    if (rowY === null) {
      return;
    }
    const guideY = rowY + this.currentRowResizeState.displayHeight;
    this.ctx.save();
    this.ctx.strokeStyle = this.theme.row.resizeGuideColor;
    this.ctx.lineWidth = this.theme.row.resizeGuideWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(0, guideY);
    this.ctx.lineTo(viewportWidth, guideY);
    this.ctx.stroke();
    this.ctx.restore();
  }
  renderColumnReorderIndicator(state, rows, visibleRange, scrollTop) {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const viewportHeight = this.canvas.height / this.dpr;
    const column = this.layoutManager.getColumnByKey(state.dragColumnKey);
    const dragColWidth = column ? this.layoutManager.getColumnWidth(column) : 100;
    const ghostX = state.currentX - dragColWidth / 2;
    this.ctx.save();
    this.ctx.globalAlpha = 0.7;
    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(ghostX, 0, dragColWidth, viewportHeight);
    this.ctx.strokeStyle = this.theme.colors.button.primaryBg;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(ghostX, 0, dragColWidth, viewportHeight);
    this.ctx.setLineDash([]);
    if (state.isParentColumn && column && column.children && column.children.length > 0) {
      this.renderParentColumnGhost(column, ghostX, headerHeight);
      this.renderParentColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop);
    } else if (column) {
      this.renderLeafColumnGhost(column, ghostX, 0, headerHeight);
      this.renderLeafColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop);
    }
    this.ctx.restore();
  }
  renderParentColumnGhost(column, ghostX, headerHeight) {
    const colDepth = column.depth ?? 0;
    const rowHeight = this.theme.row.headerHeight;
    const parentHeaderY = colDepth * rowHeight;
    const parentHeaderHeight = rowHeight;
    const totalWidth = this.layoutManager.getColumnWidth(column);
    this.ctx.fillStyle = this.theme.colors.button.primaryBg;
    this.ctx.fillRect(ghostX, parentHeaderY, totalWidth, parentHeaderHeight);
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(ghostX, parentHeaderY, totalWidth, parentHeaderHeight);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const text = column.title;
    const textWidth = this.ctx.measureText(text).width;
    const textX = ghostX + (totalWidth - textWidth) / 2;
    this.ctx.fillText(text, textX, parentHeaderY + parentHeaderHeight / 2);
    this.renderChildColumnsGhost(column, ghostX, colDepth + 1, headerHeight);
  }
  renderChildColumnsGhost(column, startX, depth, headerHeight) {
    if (!column.children || column.children.length === 0) return;
    const rowHeight = this.theme.row.headerHeight;
    let currentX = startX;
    for (const child of column.children) {
      const childWidth = this.layoutManager.getColumnWidth(child);
      if (child.children && child.children.length > 0) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        const headerY = depth * rowHeight;
        const headerH = rowHeight;
        this.ctx.fillRect(currentX, headerY, childWidth, headerH);
        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(currentX, headerY, childWidth, headerH);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";
        const text = child.title;
        const textWidth = this.ctx.measureText(text).width;
        const textX = currentX + (childWidth - textWidth) / 2;
        this.ctx.fillText(text, textX, headerY + headerH / 2);
        this.renderChildColumnsGhost(child, currentX, depth + 1, headerHeight);
      } else {
        this.renderLeafColumnGhost(child, currentX, depth, headerHeight);
      }
      currentX += childWidth;
    }
  }
  renderLeafColumnGhost(column, ghostX, depth, headerHeight) {
    const rowHeight = this.theme.row.headerHeight;
    const colWidth = this.layoutManager.getColumnWidth(column);
    const headerY = depth * rowHeight;
    const headerH = headerHeight - headerY;
    this.ctx.fillStyle = this.theme.colors.button.primaryBg;
    this.ctx.fillRect(ghostX, headerY, colWidth, headerH);
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(ghostX, headerY, colWidth, headerH);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const text = column.title;
    const textWidth = this.ctx.measureText(text).width;
    const textX = ghostX + (colWidth - textWidth) / 2;
    this.ctx.fillText(text, textX, headerY + headerH / 2);
  }
  isDescendantOfColumn(column, ancestorKey) {
    if (column.key === ancestorKey) {
      return true;
    }
    if (column.parentKey === ancestorKey) {
      return true;
    }
    if (column.parentKey) {
      const parent = this.layoutManager.getColumnByKey(column.parentKey);
      if (parent) {
        return this.isDescendantOfColumn(parent, ancestorKey);
      }
    }
    return false;
  }
  renderLeafColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop) {
    const colWidth = this.layoutManager.getColumnWidth(column);
    const { startRow, endRow } = visibleRange;
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;
      const absY = this.layoutManager.getRowOffset(rowIndex);
      const rowHeight = this.layoutManager.getRowHeightByIndex(rowIndex);
      const y = absY - scrollTop;
      if (y + rowHeight < headerHeight || y > this.canvas.height / this.dpr) {
        continue;
      }
      this.ctx.fillStyle = this.theme.colors.rowBackground;
      this.ctx.fillRect(ghostX, y, colWidth, rowHeight);
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(ghostX, y + rowHeight);
      this.ctx.lineTo(ghostX + colWidth, y + rowHeight);
      this.ctx.stroke();
      const value = row.data[getColumnField(column)];
      this.renderGhostCellValue(column, row, rowIndex, value, ghostX, y, colWidth, rowHeight);
    }
  }
  renderParentColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop) {
    if (!column.children || column.children.length === 0) return;
    let currentX = ghostX;
    for (const child of column.children) {
      const childWidth = this.layoutManager.getColumnWidth(child);
      if (child.children && child.children.length > 0) {
        this.renderParentColumnRowsGhost(
          child,
          currentX,
          headerHeight,
          rows,
          visibleRange,
          scrollTop
        );
      } else {
        this.renderLeafColumnRowsGhost(
          child,
          currentX,
          headerHeight,
          rows,
          visibleRange,
          scrollTop
        );
      }
      currentX += childWidth;
    }
  }
  renderGhostCellValue(column, row, rowIndex, value, x, y, width, height) {
    const padding = 8;
    let renderResult = {
      text: this.formatValue(value, column, row),
      type: column.type ?? "text"
    };
    if (column.render) {
      try {
        const customResult = column.render(value, row, column, rowIndex);
        if (customResult) {
          renderResult = { ...renderResult, ...customResult };
        }
      } catch (error) {
        console.error(`Error rendering ghost cell:`, error);
        renderResult = { text: "[Error]", type: "text" };
      }
    }
    const isDisabled = resolveDisabled(column.disabled, row, column);
    this.renderCellContent(
      renderResult,
      x,
      y,
      width,
      height,
      padding,
      column.align,
      rowIndex,
      void 0,
      isDisabled,
      column.key
    );
  }
  // ==================== 缓存管理方法 ====================
  /**
   * 清空渲染缓存
   */
  clearRenderCache() {
    if (this.renderCache) {
      this.renderCache.clear();
    }
  }
  /**
   * 重置行 ID 管理器
   */
  resetRowIds() {
    if (this.renderCache) {
      this.renderCache.resetRowIds();
    }
    this.rowIdManager.reset();
    this.jsxRenderer.invalidateOffscreen("all");
  }
  /**
   * 重置列 ID 管理器
   */
  resetColumnIds() {
    if (this.renderCache) {
      this.renderCache.resetColumnIds();
    }
    this.columnIdManager.reset();
    this.jsxRenderer.invalidateOffscreen("all");
  }
  /**
   * 清理不可见行的缓存
   */
  cleanupInvisibleRows(visibleRowIds) {
    if (this.renderCache) {
      this.renderCache.cleanupInvisibleRows(visibleRowIds);
    }
  }
  /**
   * 清理不可见列的缓存
   */
  cleanupInvisibleColumns(visibleColumnIds) {
    if (this.renderCache) {
      this.renderCache.cleanupInvisibleColumns(visibleColumnIds);
    }
  }
  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return this.renderCache?.getStats() ?? null;
  }
  destroy() {
    this.isDestroyed = true;
    this.dirtyRegions = [];
    this.imageLoadQueue.destroy();
    if (this.renderCache) {
      this.renderCache.clear();
    }
  }
  invalidateJsxOffscreen(scope) {
    this.jsxRenderer.invalidateOffscreen(scope);
  }
}
const TableEvents = {
  // 数据相关
  LOAD: "load",
  ERROR: "error",
  CHANGE: "change",
  // 排序和筛选
  SORT: "sort",
  SORT_CHANGE: "sortChange",
  FILTER: "filter",
  FILTER_CHANGE: "filterChange",
  // 选择相关
  SELECT: "select",
  SELECTION_CHANGE: "selectionChange",
  // 单元格事件
  CELL_CLICK: "cellClick",
  CELL_DBL_CLICK: "cellDblClick",
  CELL_HOVER: "cellHover",
  // 行事件
  ROW_CLICK: "rowClick",
  ROW_DBL_CLICK: "rowDblClick",
  ROW_HEIGHT_CHANGE: "rowHeightChange",
  ROW_PIN_CHANGE: "rowPinChange",
  ROW_ADD_ABOVE: "rowAddAbove",
  ROW_ADD_BELOW: "rowAddBelow",
  ROW_DELETE: "rowDelete",
  // 表头事件
  HEADER_CLICK: "headerClick",
  HEADER_HOVER: "headerHover",
  HEADER_CONTEXT_MENU_OPEN: "headerContextMenuOpen",
  HEADER_CONTEXT_MENU_CLOSE: "headerContextMenuClose",
  HEADER_CONTEXT_MENU_HOVER: "headerContextMenuHover",
  // 列事件
  COLUMN_RESIZE: "columnResize",
  COLUMN_REORDER: "columnReorder",
  COLUMN_REORDER_DRAG: "columnReorderDrag",
  ROW_RESIZE_DRAG: "rowResizeDrag",
  COLUMN_SWAP: "columnSwap",
  COLUMN_HIDE: "columnHide",
  COLUMN_SHOW: "columnShow",
  // 编辑事件
  EDIT_START: "editStart",
  EDIT_END: "editEnd",
  // 撤销事件
  UNDO: "undo",
  REDO: "redo",
  // 下拉框事件
  DROPDOWN_OPEN: "dropdownOpen",
  DROPDOWN_CLOSE: "dropdownClose",
  DROPDOWN_HOVER: "dropdownHover",
  FILTER_DROPDOWN_OPEN: "filterDropdownOpen",
  FILTER_DROPDOWN_CLOSE: "filterDropdownClose",
  FILTER_DROPDOWN_CONFIRM: "filterDropdownConfirm",
  FILTER_DROPDOWN_CHANGE: "filterDropdownChange",
  FILTER_DROPDOWN_RESET: "filterDropdownReset",
  DATE_DROPDOWN_OPEN: "dateDropdownOpen",
  DATE_DROPDOWN_CLOSE: "dateDropdownClose",
  DATE_DROPDOWN_HOVER: "dateDropdownHover",
  COLOR_DROPDOWN_OPEN: "colorDropdownOpen",
  COLOR_DROPDOWN_CLOSE: "colorDropdownClose",
  COLOR_DROPDOWN_HOVER: "colorDropdownHover",
  BUTTONS_DROPDOWN_CLOSE: "buttonsDropdownClose",
  // 右键菜单事件
  CONTEXT_MENU_OPEN: "contextMenuOpen",
  CONTEXT_MENU_CLOSE: "contextMenuClose",
  CONTEXT_MENU_HOVER: "contextMenuHover",
  // 滚动事件
  SCROLL: "scroll",
  // 动画事件
  SWITCH_ANIMATION_UPDATE: "switchAnimationUpdate",
  BUTTON_HOVER_ANIMATION_UPDATE: "buttonHoverAnimationUpdate",
  // 展开/折叠
  EXPAND: "expand",
  // 控件值变更
  CHECKBOX_CHANGE: "checkboxChange",
  RADIO_CHANGE: "radioChange",
  SWITCH_CHANGE: "switchChange",
  BUTTON_CLICK: "buttonClick",
  SELECT_CHANGE: "selectChange",
  TAGS_CHANGE: "tagsChange",
  DATE_SELECT: "dateSelect",
  PROGRESS_CHANGE: "progressChange",
  PROGRESS_DRAG: "progressDrag",
  // 进度条拖拽过程中的实时渲染
  RATING_CHANGE: "ratingChange",
  COLOR_CHANGE: "colorChange",
  // 图片事件
  IMAGE_CLICK: "imageClick",
  IMAGE_TOOLTIP_SCROLL: "imageTooltipScroll",
  IMAGE_TOOLTIP_HOVER: "imageTooltipHover",
  IMAGE_EDITOR_OPEN: "imageEditorOpen",
  IMAGE_EDITOR_CLOSE: "imageEditorClose",
  IMAGE_EDITOR_SCROLL: "imageEditorScroll",
  IMAGE_EDITOR_HOVER: "imageEditorHover",
  IMAGE_UPLOAD: "imageUpload",
  IMAGE_DELETE: "imageDelete",
  // 懒加载事件
  LOAD_MORE: "loadMore"
};
class DropdownPositionCalculator {
  layoutManager;
  scrollState;
  canvas;
  // Default configuration
  static DEFAULT_GAP = 4;
  static EDGE_PADDING = 8;
  constructor(layoutManager, scrollState, canvas) {
    this.layoutManager = layoutManager;
    this.scrollState = scrollState;
    this.canvas = canvas;
  }
  /**
   * Get logical canvas dimensions (CSS pixels, accounting for devicePixelRatio)
   */
  getLogicalCanvasSize() {
    const dpr = getDevicePixelRatio();
    return {
      width: this.canvas.width / dpr,
      height: this.canvas.height / dpr
    };
  }
  /**
   * Calculate initial dropdown position
   */
  calculate(params) {
    const { width, height, gap = DropdownPositionCalculator.DEFAULT_GAP } = params;
    const { width: canvasWidth, height: canvasHeight } = this.getLogicalCanvasSize();
    const x = this.calculateX(params, width, canvasWidth);
    const { anchorY, cellViewportY } = this.calculateAnchorY(params);
    const { y, showAbove } = this.calculateInitialY(anchorY, height, gap, canvasHeight);
    return { x, y, showAbove, anchorViewportY: anchorY, cellViewportY };
  }
  /**
   * Update Y position during scroll (preserves or toggles showAbove)
   */
  updateY(params, currentShowAbove, dropdownHeight, gap = DropdownPositionCalculator.DEFAULT_GAP) {
    const { height: canvasHeight } = this.getLogicalCanvasSize();
    const { anchorY, cellViewportY } = this.calculateAnchorY(params);
    let y;
    if (currentShowAbove) {
      y = anchorY - gap - dropdownHeight;
    } else {
      y = anchorY + gap;
    }
    let newShowAbove = currentShowAbove;
    if (currentShowAbove && y < 0) {
      if (anchorY + gap + dropdownHeight <= canvasHeight) {
        y = anchorY + gap;
        newShowAbove = false;
      }
    } else if (!currentShowAbove && y + dropdownHeight > canvasHeight) {
      if (anchorY - gap - dropdownHeight >= 0) {
        y = anchorY - gap - dropdownHeight;
        newShowAbove = true;
      }
    }
    return { y, showAbove: newShowAbove, cellViewportY };
  }
  /**
   * Update X position during horizontal scroll
   */
  updateX(params, dropdownWidth) {
    const { width: canvasWidth } = this.getLogicalCanvasSize();
    return this.calculateX(params, dropdownWidth, canvasWidth);
  }
  /**
   * Calculate X position (handles fixed columns and boundary)
   */
  calculateX(params, dropdownWidth, canvasWidth) {
    let baseX;
    if (params.anchorType === "header") {
      baseX = this.getHeaderCellX(params.columnKey, params.column);
    } else if (params.anchorType === "button" && params.buttonRelativeX !== void 0) {
      const cellViewportX = this.getCellViewportX(params);
      baseX = cellViewportX + params.buttonRelativeX;
    } else {
      baseX = this.getCellViewportX(params);
    }
    const minPadding = DropdownPositionCalculator.EDGE_PADDING;
    const column = params.column ?? this.getColumn(params);
    const cellWidth = column?.width ?? 100;
    const cellRight = baseX + cellWidth;
    const isCellVisible = cellRight > minPadding && baseX < canvasWidth - minPadding;
    let x = baseX;
    if (isCellVisible) {
      if (dropdownWidth <= canvasWidth - minPadding * 2) {
        if (x + dropdownWidth > canvasWidth - minPadding) {
          x = canvasWidth - dropdownWidth - minPadding;
        }
        if (x < minPadding) {
          x = minPadding;
        }
      } else {
        x = (canvasWidth - dropdownWidth) / 2;
      }
    }
    return x;
  }
  /**
   * Get cell viewport X (handles fixed columns)
   */
  getCellViewportX(params) {
    const cellPos = this.getCellPosition(params);
    const column = params.column ?? this.getColumn(params);
    return column?.fixed ? cellPos.x : cellPos.x - this.scrollState.scrollLeft;
  }
  /**
   * Get cell position from params
   */
  getCellPosition(params) {
    if (params.cell) {
      return this.layoutManager.getCellPosition(params.cell.rowIndex, params.cell.columnIndex);
    }
    return this.layoutManager.getCellPosition(0, params.columnIndex ?? 0);
  }
  getCellViewportY(params) {
    if (params.cell) {
      return this.layoutManager.getCellViewportY(params.cell.rowIndex, this.scrollState.scrollTop);
    }
    return this.layoutManager.getCellViewportY(0, this.scrollState.scrollTop);
  }
  /**
   * Get column from params
   */
  getColumn(params) {
    if (params.column) return params.column;
    if (params.cell) {
      return this.layoutManager.getLeafColumns()[params.cell.columnIndex];
    }
    return this.layoutManager.getLeafColumns()[params.columnIndex ?? 0];
  }
  /**
   * Get header cell X position
   */
  getHeaderCellX(columnKey, column) {
    if (column) {
      const columns = this.layoutManager.getColumns();
      let x = 0;
      for (const col of columns) {
        if (col.key === columnKey) {
          return col.fixed ? x : x - this.scrollState.scrollLeft;
        }
        x += col.width ?? 100;
      }
    }
    return 0;
  }
  /**
   * Calculate Y anchor point based on anchor type
   */
  calculateAnchorY(params) {
    const cellPos = this.getCellPosition(params);
    const cellViewportY = this.getCellViewportY(params);
    switch (params.anchorType) {
      case "cell":
        return {
          anchorY: cellViewportY + cellPos.height,
          // Cell bottom
          cellViewportY
        };
      case "cell-top":
        return {
          anchorY: cellViewportY,
          // Cell top
          cellViewportY
        };
      case "button":
        return {
          anchorY: cellViewportY + params.buttonY + params.buttonHeight,
          // Button bottom
          cellViewportY
        };
      case "header":
        const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
        return {
          anchorY: headerHeight,
          cellViewportY: 0
        };
      case "custom":
        return {
          anchorY: params.customAnchorY,
          cellViewportY: params.customAnchorY
        };
      default:
        return { anchorY: 0, cellViewportY: 0 };
    }
  }
  /**
   * Calculate initial Y position with space detection
   */
  calculateInitialY(anchorY, dropdownHeight, gap, canvasHeight) {
    let y = anchorY + gap;
    let showAbove = false;
    if (y + dropdownHeight > canvasHeight) {
      const aboveY = anchorY - gap - dropdownHeight;
      if (aboveY >= 0) {
        y = aboveY;
        showAbove = true;
      }
    }
    return { y, showAbove };
  }
  /**
   * Check if cell is still visible in viewport
   */
  isCellInViewport(params) {
    const cellPos = this.getCellPosition(params);
    const cellViewportY = this.getCellViewportY(params);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    const { height: canvasHeight } = this.getLogicalCanvasSize();
    return cellViewportY >= headerHeight && cellViewportY + cellPos.height <= canvasHeight;
  }
}
class BaseHandler {
  context;
  eventEmitter;
  dropdownCalculator;
  constructor(context, eventEmitter) {
    this.context = context;
    this.eventEmitter = eventEmitter;
    this.dropdownCalculator = new DropdownPositionCalculator(
      context.layoutManager,
      context.scrollState,
      context.canvas
    );
  }
  // Protected accessors for common dependencies
  get state() {
    return this.context.state;
  }
  get scrollState() {
    return this.context.scrollState;
  }
  get layoutManager() {
    return this.context.layoutManager;
  }
  get dataManager() {
    return this.context.dataManager;
  }
  get canvas() {
    return this.context.canvas;
  }
  get ctx() {
    return this.context.ctx;
  }
  get locale() {
    return this.context.locale;
  }
  get rows() {
    return this.dataManager.getRows();
  }
  get allRows() {
    return this.dataManager.getAllRows();
  }
  get editorRegistry() {
    return this.context.editorRegistry;
  }
  // Shared utility methods
  /**
   * Convert CellPosition to CellInfo with row and column data
   */
  getCellInfo(cell) {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) return null;
    return {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      row,
      column
    };
  }
  /**
   * Calculate cell viewport X position
   */
  getCellViewportX(cellPos, column) {
    return column?.fixed ? cellPos.x : cellPos.x - this.scrollState.scrollLeft;
  }
  getCellViewportY(rowIndex) {
    return this.layoutManager.getCellViewportY(rowIndex, this.scrollState.scrollTop);
  }
  /**
   * Update expand column key
   */
  updateExpandColumnKey(key) {
    this.context.expandColumnKey = key;
  }
  /**
   * Get the viewport bounds from the canvas
   */
  getCanvasBounds() {
    return this.canvas.getBoundingClientRect();
  }
  /**
   * Convert mouse event to viewport coordinates
   */
  getViewportCoords(e) {
    const rect = this.getCanvasBounds();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  // Dropdown position calculation methods
  /**
   * Calculate initial dropdown position
   */
  calculateDropdownPosition(cell, width, height, anchorType = "cell", options) {
    return this.dropdownCalculator.calculate({
      cell,
      column: options?.column ?? this.layoutManager.getLeafColumns()[cell.columnIndex],
      width,
      height,
      anchorType,
      gap: options?.gap,
      buttonRelativeX: options?.buttonRelativeX,
      buttonY: options?.buttonY,
      buttonHeight: options?.buttonHeight,
      columnKey: options?.columnKey,
      customAnchorY: options?.customAnchorY
    });
  }
  /**
   * Update dropdown Y position during scroll
   */
  updateDropdownY(cell, currentShowAbove, dropdownHeight, options) {
    return this.dropdownCalculator.updateY(
      {
        cell,
        column: options?.column ?? this.layoutManager.getLeafColumns()[cell.columnIndex],
        anchorType: options?.anchorType ?? "cell",
        buttonY: options?.buttonY,
        buttonHeight: options?.buttonHeight
      },
      currentShowAbove,
      dropdownHeight,
      options?.gap
    );
  }
  /**
   * Update dropdown X position during horizontal scroll
   */
  updateDropdownX(cell, dropdownWidth, options) {
    return this.dropdownCalculator.updateX(
      {
        cell,
        column: options?.column ?? this.layoutManager.getLeafColumns()[cell.columnIndex],
        anchorType: options?.anchorType ?? "cell",
        buttonRelativeX: options?.buttonRelativeX
      },
      dropdownWidth
    );
  }
  /**
   * Check if cell is in viewport
   */
  isCellInViewport(cell) {
    return this.dropdownCalculator.isCellInViewport({
      cell,
      column: this.layoutManager.getLeafColumns()[cell.columnIndex]
    });
  }
}
class SelectionHandler extends BaseHandler {
  constructor(context, eventEmitter) {
    super(context, eventEmitter);
  }
  /**
   * Handle single cell selection
   */
  handleSingleSelection(cell) {
    this.state.selectedCells = [
      {
        start: cell,
        end: cell
      }
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Handle range selection (shift+click)
   */
  handleRangeSelection(cell) {
    if (!this.state.selectionStart) {
      this.handleSingleSelection(cell);
      return;
    }
    this.state.selectedCells = [
      {
        start: this.state.selectionStart,
        end: cell
      }
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Handle toggle selection (ctrl/cmd+click)
   */
  handleToggleSelection(cell) {
    const existingIndex = this.state.selectedCells.findIndex((range) => {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);
      return cell.rowIndex >= minRow && cell.rowIndex <= maxRow && cell.columnIndex >= minCol && cell.columnIndex <= maxCol;
    });
    if (existingIndex >= 0) {
      this.state.selectedCells.splice(existingIndex, 1);
    } else {
      this.state.selectedCells.push({ start: cell, end: cell });
    }
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Select all cells
   */
  selectAll() {
    const leafColumns = this.layoutManager.getLeafColumns();
    if (this.rows.length === 0 || leafColumns.length === 0) return;
    this.state.selectedCells = [
      {
        start: { rowIndex: 0, columnIndex: 0 },
        end: { rowIndex: this.rows.length - 1, columnIndex: leafColumns.length - 1 }
      }
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Clear selection
   */
  clearSelection() {
    this.state.selectedCells = [];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Move selection by delta
   */
  moveSelection(rowDelta, colDelta) {
    if (this.state.selectedCells.length === 0) return;
    const leafColumns = this.layoutManager.getLeafColumns();
    const cell = this.state.selectedCells[0].start;
    const newRow = clamp(cell.rowIndex + rowDelta, 0, this.rows.length - 1);
    const newCol = clamp(cell.columnIndex + colDelta, 0, leafColumns.length - 1);
    const newCell = { rowIndex: newRow, columnIndex: newCol };
    this.handleSingleSelection(newCell);
    this.scrollToCell(newCell);
  }
  /**
   * Get normalized range (min/max row and column)
   */
  getNormalizedRange(range) {
    return {
      minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
      maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
      minCol: Math.min(range.start.columnIndex, range.end.columnIndex),
      maxCol: Math.max(range.start.columnIndex, range.end.columnIndex)
    };
  }
  /**
   * Scroll to make a cell visible
   */
  scrollToCell(cell) {
    const targetScrollTop = this.layoutManager.getScrollOffsetForRow(cell.rowIndex);
    const targetScrollLeft = this.layoutManager.getScrollOffsetForColumn(cell.columnIndex);
    if (targetScrollTop !== this.scrollState.scrollTop || targetScrollLeft !== this.scrollState.scrollLeft) {
      this.scrollState.scrollLeft = targetScrollLeft;
      this.scrollState.scrollTop = targetScrollTop;
      this.eventEmitter.emit(TableEvents.SCROLL, targetScrollLeft, targetScrollTop);
    }
  }
  /**
   * Check if a cell is selected
   */
  isCellSelected(cell) {
    return this.state.selectedCells.some((range) => {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);
      return cell.rowIndex >= minRow && cell.rowIndex <= maxRow && cell.columnIndex >= minCol && cell.columnIndex <= maxCol;
    });
  }
  /**
   * Get selected cells as flat array
   */
  getSelectedCells() {
    const cells = [];
    for (const range of this.state.selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({ rowIndex: row, columnIndex: col });
        }
      }
    }
    return cells;
  }
}
class NavigationHandler extends BaseHandler {
  selectionHandler;
  editingConfig;
  constructor(context, eventEmitter, selectionHandler, editingConfig) {
    super(context, eventEmitter);
    this.selectionHandler = selectionHandler;
    this.editingConfig = editingConfig;
  }
  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e) {
    e.preventDefault();
    const leafColumns = this.layoutManager.getLeafColumns();
    let currentCell;
    if (this.state.selectedCells.length > 0) {
      const range = this.state.selectedCells[0];
      currentCell = e.key === "ArrowUp" || e.key === "ArrowLeft" ? range.start : range.end;
    } else {
      currentCell = { rowIndex: 0, columnIndex: 0 };
    }
    let newRow = currentCell.rowIndex;
    let newCol = currentCell.columnIndex;
    switch (e.key) {
      case "ArrowUp":
        newRow = Math.max(0, newRow - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(this.rows.length - 1, newRow + 1);
        break;
      case "ArrowLeft":
        newCol = Math.max(0, newCol - 1);
        break;
      case "ArrowRight":
        newCol = Math.min(leafColumns.length - 1, newCol + 1);
        break;
    }
    const newCell = { rowIndex: newRow, columnIndex: newCol };
    this.selectionHandler.handleSingleSelection(newCell);
    this.scrollToCell(newCell);
  }
  /**
   * Handle Enter key
   * @returns Editing configuration if editing should start, null otherwise
   */
  handleEnterKey(e) {
    if (this.state.selectedCells.length === 0) return null;
    e.preventDefault();
    e.stopPropagation();
    const cell = this.state.selectedCells[0].start;
    if (this.editingConfig.enabled !== false) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];
      const row = this.rows[cell.rowIndex];
      if (column && row) {
        const renderResult = getRenderResult(column, row, cell.rowIndex);
        const controlTypes = ["checkbox", "radio", "button", "switch"];
        if (renderResult.type && controlTypes.includes(renderResult.type)) {
          if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
            if (this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) {
              this.eventEmitter.emit(
                TableEvents.SWITCH_CHANGE,
                this.getCellInfo(cell),
                !renderResult.switch.checked
              );
            }
            return null;
          }
          this.toggleRowExpand(cell.rowIndex);
          return null;
        }
        if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return null;
        if (renderResult.input?.readonly) return null;
        return this.getEditingStartConfig(cell, column, row, renderResult);
      }
    } else {
      this.toggleRowExpand(cell.rowIndex);
    }
    return null;
  }
  /**
   * Get editing start configuration for a cell
   */
  getEditingStartConfig(cell, column, row, renderResult) {
    const value = row.data[getColumnField(column)];
    if (column.editRender) {
      try {
        const result = column.editRender(value, row, cell.rowIndex);
        if (result) {
          const configMap = {
            input: "input",
            select: "select",
            tag: "tags",
            date: "date",
            checkbox: "checkbox",
            radio: "radio",
            switch: "switch"
          };
          const configKey = configMap[result.type];
          return { type: result.type, config: configKey ? result[configKey] : void 0 };
        }
      } catch (error) {
        console.error("Error in editRender:", error);
      }
    }
    if (renderResult.type === CellTypes.SELECT && renderResult.select) {
      return { type: "select", config: renderResult.select };
    }
    if (renderResult.type === CellTypes.TAG && renderResult.tags && renderResult.tags.editable) {
      return { type: "tags", config: renderResult.tags };
    }
    if (renderResult.type === CellTypes.DATE && renderResult.date) {
      return { type: "date", config: renderResult.date };
    }
    if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
      return { type: "image", config: renderResult.image };
    }
    return { type: "input", config: renderResult.input };
  }
  /**
   * Handle keyboard events while editing
   */
  handleEditingKeyDown(e) {
    if (!this.state.editingCell) return false;
    switch (e.key) {
      case "Enter":
        return true;
      // Signal to end editing
      case "Escape":
        return true;
      // Signal to cancel editing
      case "Tab":
        e.preventDefault();
        return true;
    }
    return false;
  }
  /**
   * Scroll to make a cell visible
   */
  scrollToCell(cell) {
    const targetScrollTop = this.layoutManager.getScrollOffsetForRow(cell.rowIndex);
    const targetScrollLeft = this.layoutManager.getScrollOffsetForColumn(cell.columnIndex);
    if (targetScrollTop !== this.scrollState.scrollTop || targetScrollLeft !== this.scrollState.scrollLeft) {
      this.scrollState.scrollLeft = targetScrollLeft;
      this.scrollState.scrollTop = targetScrollTop;
      this.eventEmitter.emit(TableEvents.SCROLL, targetScrollLeft, targetScrollTop);
    }
  }
  /**
   * Toggle row expand state
   */
  toggleRowExpand(rowIndex) {
    const row = this.rows[rowIndex];
    if (row && row.children && row.children.length > 0) {
      this.eventEmitter.emit(TableEvents.EXPAND, row, rowIndex, !row.expanded);
    }
  }
  /**
   * Update editing config
   */
  updateEditingConfig(config) {
    this.editingConfig = config;
  }
}
class ClipboardHandler extends BaseHandler {
  selectionHandler;
  constructor(context, eventEmitter, selectionHandler) {
    super(context, eventEmitter);
    this.selectionHandler = selectionHandler;
  }
  /**
   * Copy selected cells to clipboard
   */
  async copySelection() {
    const text = this.getSelectedText();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        this.fallbackCopyToClipboard(text);
      }
    }
  }
  /**
   * Get selected cells as tab-separated text
   */
  getSelectedText() {
    const selectedCells = this.state.selectedCells;
    if (selectedCells.length === 0) return "";
    const leafColumns = this.layoutManager.getLeafColumns();
    const lines = [];
    for (const range of selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.selectionHandler.getNormalizedRange(range);
      for (let row = minRow; row <= maxRow; row++) {
        const rowData = this.rows[row];
        if (!rowData) continue;
        const cells = [];
        for (let col = minCol; col <= maxCol; col++) {
          const column = leafColumns[col];
          if (!column) continue;
          const displayText = getCellDisplayText(column, rowData, row);
          cells.push(displayText);
        }
        lines.push(cells.join("	"));
      }
    }
    return lines.join("\n");
  }
  /**
   * Get selected cells as a 2D array of values
   */
  getSelectedValues() {
    const selectedCells = this.state.selectedCells;
    if (selectedCells.length === 0) return [];
    const leafColumns = this.layoutManager.getLeafColumns();
    const result = [];
    for (const range of selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.selectionHandler.getNormalizedRange(range);
      for (let row = minRow; row <= maxRow; row++) {
        const rowData = this.rows[row];
        if (!rowData) continue;
        const rowValues = [];
        for (let col = minCol; col <= maxCol; col++) {
          const column = leafColumns[col];
          if (!column) continue;
          const value = rowData.data[getColumnField(column)];
          rowValues.push(value);
        }
        result.push(rowValues);
      }
    }
    return result;
  }
  /**
   * Get selected cells as CSV format
   */
  getSelectedCSV() {
    const values = this.getSelectedValues();
    return values.map(
      (row) => row.map((cell) => {
        const str = String(cell ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    ).join("\n");
  }
  /**
   * Fallback copy method for older browsers
   */
  fallbackCopyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  /**
   * Check if there is any selection
   */
  hasSelection() {
    return this.state.selectedCells.length > 0;
  }
  /**
   * Get selection bounds
   */
  getSelectionBounds() {
    if (this.state.selectedCells.length === 0) return null;
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;
    for (const range of this.state.selectedCells) {
      const normalized = this.selectionHandler.getNormalizedRange(range);
      minRow = Math.min(minRow, normalized.minRow);
      maxRow = Math.max(maxRow, normalized.maxRow);
      minCol = Math.min(minCol, normalized.minCol);
      maxCol = Math.max(maxCol, normalized.maxCol);
    }
    return { minRow, maxRow, minCol, maxCol };
  }
}
class EditingHandler extends BaseHandler {
  editingConfig;
  // Constants for dropdown positioning
  static DROPDOWN_ITEM_HEIGHT = 32;
  static DROPDOWN_MAX_VISIBLE = 8;
  constructor(context, eventEmitter, editingConfig) {
    super(context, eventEmitter);
    this.editingConfig = editingConfig;
  }
  /**
   * Validate if a cell can be edited
   */
  validateCellForEditing(cell) {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return null;
    const row = this.rows[cell.rowIndex];
    if (!row) return null;
    if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return null;
    return { column, row };
  }
  /**
   * Get edit configuration for a cell
   * Priority: editRender > render result > null (default logic)
   */
  getEditConfig(column, row, rowIndex) {
    const value = row.data[getColumnField(column)];
    if (column.editRender) {
      try {
        const result = column.editRender(value, row, rowIndex);
        if (result) return result;
      } catch (error) {
        console.error("Error in editRender:", error);
      }
    }
    if (column.render) {
      try {
        const result = column.render(value, row, column, rowIndex);
        if (result && result.type && result.type !== CellTypes.CUSTOM && result.type !== CellTypes.BUTTON && result.type !== CellTypes.IMAGE && result.type !== CellTypes.PROGRESS && result.type !== CellTypes.LINK) {
          return {
            type: result.type,
            input: result.input,
            select: result.select,
            tags: result.tags,
            date: result.date,
            checkbox: result.checkbox,
            radio: result.radio,
            switch: result.switch
          };
        }
      } catch (error) {
        console.error("Error in render:", error);
      }
    }
    return null;
  }
  /**
   * Start text/input editing
   */
  startEditing(cell, inputConfig) {
    const validated = this.validateCellForEditing(cell);
    if (!validated) return false;
    this.state.tooltip = null;
    this.state.editingCell = cell;
    this.eventEmitter.emit(TableEvents.EDIT_START, this.getCellInfo(cell), inputConfig);
    return true;
  }
  /**
   * Start select dropdown editing
   */
  startSelectEditing(cell, selectConfig) {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !selectConfig) return false;
    this.state.tooltip = null;
    const itemHeight = EditingHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = EditingHandler.DROPDOWN_MAX_VISIBLE;
    const optionsCount = selectConfig.options?.length ?? 0;
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    const dropdownWidth = validated.column.width ?? 100;
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column
    });
    this.state.dropdown = {
      cell,
      config: selectConfig,
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      scrollTop: 0,
      hoveredIndex: -1,
      showAbove: result.showAbove
    };
    this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
    return true;
  }
  /**
   * Start tags editing
   */
  startTagsEditing(cell, tagsConfig) {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !tagsConfig) return false;
    this.state.tooltip = null;
    const itemHeight = EditingHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = EditingHandler.DROPDOWN_MAX_VISIBLE;
    const optionsCount = tagsConfig.options?.length ?? 0;
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    const dropdownWidth = validated.column.width ?? 100;
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column
    });
    this.state.dropdown = {
      cell,
      config: {
        value: tagsConfig.selectedValues,
        options: (tagsConfig.options ?? []).map((opt) => ({
          label: opt.text,
          value: opt.value ?? opt.text,
          disabled: opt.disabled
        }))
      },
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      scrollTop: 0,
      hoveredIndex: -1,
      type: "tags",
      tagsConfig,
      showAbove: result.showAbove
    };
    this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
    return true;
  }
  /**
   * Start date editing
   */
  startDateEditing(cell, dateConfig) {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !dateConfig) return false;
    this.state.tooltip = null;
    const dropdownWidth = Math.max(validated.column.width ?? 100, 280);
    const dropdownHeight = 40 + 28 + 6 * 28 + 16;
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column
    });
    let selectedDate = null;
    if (dateConfig.value) {
      if (dateConfig.value instanceof Date) {
        selectedDate = dateConfig.value;
      } else if (typeof dateConfig.value === "string") {
        selectedDate = new Date(dateConfig.value);
      }
    }
    const currentYear = selectedDate?.getFullYear() ?? (/* @__PURE__ */ new Date()).getFullYear();
    const currentMonth = selectedDate?.getMonth() ?? (/* @__PURE__ */ new Date()).getMonth();
    this.state.dateDropdown = {
      cell,
      config: dateConfig,
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      currentYear,
      currentMonth,
      selectedDate,
      hoveredDate: null,
      showAbove: result.showAbove
    };
    this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
    return true;
  }
  /**
   * Start image editing
   */
  startImageEditing(cell, imageConfig) {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !imageConfig) return false;
    this.state.tooltip = null;
    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const maxRows = 3;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;
    const result = this.calculateDropdownPosition(cell, editorWidth, editorHeight, "cell", {
      column: validated.column
    });
    const images = imageConfig.images ?? (imageConfig.src ? [imageConfig.src] : []);
    const isSingleImage = !images || images.length <= 1 && !imageConfig.multiple;
    this.state.imageEditor = {
      cell,
      x: result.x,
      y: result.y,
      images: [...images],
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows,
      showAbove: result.showAbove,
      isDragging: false,
      pendingImages: [],
      isSingleImage
    };
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_OPEN);
    return true;
  }
  /**
   * Start color picker editing
   */
  startColorEditing(cell, colorConfig) {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !colorConfig) return false;
    this.state.tooltip = null;
    const presetColors = colorConfig.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const dropdownWidth = Math.max(
      validated.column.width ?? 100,
      columns * (cellSize + gap) + padding * 2 - gap
    );
    const dropdownHeight = rows * (cellSize + gap) + padding * 2 - gap;
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column
    });
    this.state.colorDropdown = {
      cell,
      config: colorConfig,
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      hoveredColor: null
    };
    this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_OPEN);
    return true;
  }
  /**
   * Get default preset colors for color picker
   */
  getDefaultPresetColors() {
    return [
      "#ff4d4f",
      "#ff7a45",
      "#ffa940",
      "#ffc53d",
      "#bae637",
      "#73d13d",
      "#36cfc9",
      "#40a9ff",
      "#597ef7",
      "#9254de",
      "#f759ab",
      "#ff85c0",
      "#a0d911",
      "#13c2c2",
      "#1890ff",
      "#722ed1",
      "#eb2f96",
      "#faad14",
      "#52c41a",
      "#2f54eb",
      "#ffffff",
      "#f5f5f5",
      "#d9d9d9",
      "#8c8c8c",
      "#595959",
      "#262626",
      "#000000",
      "#f50"
    ];
  }
  /**
   * End editing
   */
  endEditing(save) {
    if (!this.state.editingCell) return;
    const cell = this.state.editingCell;
    this.state.editingCell = null;
    if (save) {
      this.eventEmitter.emit(
        TableEvents.EDIT_END,
        this.getCellInfo(cell),
        this.state.editingValue
      );
    }
    this.state.editingValue = null;
  }
  /**
   * Update editing config
   */
  updateEditingConfig(config) {
    this.editingConfig = config;
  }
  /**
   * Check if editing is enabled
   */
  isEditingEnabled() {
    return this.editingConfig.enabled !== false;
  }
  /**
   * Get editing mode
   */
  getEditingMode() {
    return this.editingConfig.mode ?? "dblclick";
  }
}
class DropdownHandler extends BaseHandler {
  static DROPDOWN_ITEM_HEIGHT = 32;
  static DROPDOWN_MAX_VISIBLE = 8;
  constructor(context, eventEmitter) {
    super(context, eventEmitter);
  }
  invokeJSXDropdownChange(value, option, multiple) {
    const dropdown = this.state.dropdown;
    const onChange = dropdown?.onChange;
    if (!dropdown || !onChange) return;
    try {
      const result = onChange(value, option, {
        config: dropdown.config,
        multiple,
        row: dropdown.row,
        column: dropdown.column,
        rowIndex: dropdown.rowIndex,
        colIndex: dropdown.colIndex
      });
      Promise.resolve(result).catch((error) => {
        console.error("[DropdownHandler] JSX dropdown onChange error:", error);
      });
    } catch (error) {
      console.error("[DropdownHandler] JSX dropdown onChange error:", error);
    }
  }
  /**
   * Handle dropdown click
   */
  handleDropdownClick(e) {
    if (!this.state.dropdown) return false;
    const { x, y, width, scrollTop, type, tagsConfig, config } = this.state.dropdown;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    if (type === "tags" && tagsConfig) {
      const visibleCount2 = Math.min(tagsConfig.options?.length ?? 0, maxVisibleItems);
      const dropdownHeight2 = visibleCount2 * itemHeight;
      if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight2) {
        const relativeY = viewportY - y + scrollTop;
        const itemIndex = Math.floor(relativeY / itemHeight);
        if (itemIndex >= 0 && itemIndex < (tagsConfig.options?.length ?? 0) && tagsConfig.options) {
          const option = tagsConfig.options[itemIndex];
          if (!option.disabled) {
            const isMultiple = tagsConfig.multiple !== false;
            if (isMultiple) {
              const selectedValues = [...tagsConfig.selectedValues ?? []];
              const optionValue = option.value ?? option.text;
              const existingIndex = selectedValues.indexOf(optionValue);
              if (existingIndex >= 0) {
                selectedValues.splice(existingIndex, 1);
              } else {
                selectedValues.push(optionValue);
              }
              this.eventEmitter.emit(
                TableEvents.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                selectedValues,
                true
              );
              this.state.dropdown.tagsConfig = {
                ...tagsConfig,
                selectedValues
              };
              this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
            } else {
              const optionValue = option.value ?? option.text;
              this.eventEmitter.emit(
                TableEvents.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                [optionValue],
                false
              );
            }
          }
        }
        return true;
      }
      return false;
    }
    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);
      if (itemIndex >= 0 && itemIndex < config.options.length) {
        const option = config.options[itemIndex];
        if (!option.disabled) {
          if (config.multiple) {
            const currentValues = Array.isArray(config.value) ? [...config.value] : [];
            const optionValue = option.value;
            const existingIndex = currentValues.indexOf(optionValue);
            if (existingIndex >= 0) {
              currentValues.splice(existingIndex, 1);
            } else {
              currentValues.push(optionValue);
            }
            if (this.state.dropdown.source === "jsx" || this.state.dropdown.onChange) {
              this.invokeJSXDropdownChange(currentValues, option, true);
              this.state.dropdown.config = {
                ...config,
                value: currentValues
              };
              this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
              return true;
            }
            this.eventEmitter.emit(
              TableEvents.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              currentValues,
              true
            );
            this.state.dropdown.config = {
              ...config,
              value: currentValues
            };
            this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
          } else {
            if (this.state.dropdown.source === "jsx" || this.state.dropdown.onChange) {
              const dropdownCell = this.state.dropdown.cell;
              this.invokeJSXDropdownChange(option.value, option, false);
              this.state.dropdown = null;
              this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, dropdownCell);
              return true;
            }
            this.eventEmitter.emit(
              TableEvents.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              option.value,
              false
            );
          }
        }
      }
      return true;
    }
    return false;
  }
  /**
   * Handle dropdown hover
   */
  handleDropdownHover(e) {
    if (!this.state.dropdown) return;
    const { x, y, width, scrollTop, type, tagsConfig, config } = this.state.dropdown;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    if (type === "tags" && tagsConfig) {
      const visibleCount2 = Math.min(tagsConfig.options?.length ?? 0, maxVisibleItems);
      const dropdownHeight2 = visibleCount2 * itemHeight;
      if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight2) {
        const relativeY = viewportY - y + scrollTop;
        const itemIndex = Math.floor(relativeY / itemHeight);
        if (itemIndex >= 0 && itemIndex < (tagsConfig.options?.length ?? 0)) {
          this.state.dropdown.hoveredIndex = itemIndex;
          this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
        }
      } else {
        this.state.dropdown.hoveredIndex = -1;
      }
      return;
    }
    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);
      if (itemIndex >= 0 && itemIndex < config.options.length) {
        this.state.dropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      }
    } else {
      this.state.dropdown.hoveredIndex = -1;
    }
  }
  /**
   * Handle buttons dropdown click
   */
  handleButtonsDropdownClick(e) {
    if (!this.state.buttonsDropdown) return false;
    const { x, y, buttons, cell } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(cell)) {
      this.state.buttonsDropdown = null;
      this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
      return true;
    }
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;
    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    let maxWidth = 100;
    for (const btn of buttons) {
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.ctx.measureText(text).width;
      maxWidth = Math.max(maxWidth, textWidth + 24);
    }
    if (viewportX >= x && viewportX <= x + maxWidth && viewportY >= y && viewportY <= y + dropdownHeight) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);
      if (itemIndex >= 0 && itemIndex < buttons.length) {
        const btn = buttons[itemIndex];
        this.state.buttonsDropdown = null;
        this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
        this.eventEmitter.emit(TableEvents.BUTTON_CLICK, this.getCellInfo(cell), btn.actionKey);
        return true;
      }
    }
    this.state.buttonsDropdown = null;
    this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
    return true;
  }
  /**
   * Handle buttons dropdown hover
   */
  handleButtonsDropdownHover(e) {
    if (!this.state.buttonsDropdown) return;
    const { x, y, buttons } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(this.state.buttonsDropdown.cell)) {
      this.state.buttonsDropdown.hoveredIndex = -1;
      this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      return;
    }
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;
    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    let maxWidth = 100;
    for (const btn of buttons) {
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.ctx.measureText(text).width;
      maxWidth = Math.max(maxWidth, textWidth + 24);
    }
    if (viewportX >= x && viewportX <= x + maxWidth && viewportY >= y && viewportY <= y + dropdownHeight) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);
      if (itemIndex >= 0 && itemIndex < buttons.length) {
        this.state.buttonsDropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      }
    } else {
      this.state.buttonsDropdown.hoveredIndex = -1;
    }
  }
  isButtonsDropdownSourceDisabled(cell) {
    const column = this.layoutManager.getLeafColumns()[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    return column && row ? !this.editorRegistry.getStrategy(column).canEdit({ rowIndex: cell.rowIndex, columnIndex: cell.columnIndex }, row, column) : true;
  }
  /**
   * Handle filter dropdown click
   */
  handleFilterDropdownClick(e) {
    if (!this.state.filterDropdown) return false;
    const { x, y, width, mode } = this.state.filterDropdown;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const padding = 8;
    if (mode === "dateRange") {
      const inputHeight = 32;
      const inputGap = 8;
      const gap = 4;
      const buttonHeight = 36;
      const baseHeight = padding + inputHeight + gap + buttonHeight;
      const isInBaseDropdown = viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + baseHeight;
      let isInCalendar = false;
      if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0) {
        const calendarWidth = 240;
        const calendarHeight = 40 + 28 + 6 * 28 + 16;
        const inputWidth = (width - padding * 3) / 2;
        const input1X = x + padding;
        const input2X = x + padding + inputWidth + inputGap;
        const input1Y = y + padding;
        const activeInputX = this.state.filterDropdown.activeDateField === "startDate" ? input1X : input2X;
        const activeInputCenterX = activeInputX + inputWidth / 2;
        let calendarX = activeInputCenterX - calendarWidth / 2;
        if (calendarX < x) calendarX = x;
        if (calendarX + calendarWidth > x + width) calendarX = x + width - calendarWidth;
        const calendarY = input1Y + inputHeight + inputGap;
        isInCalendar = viewportX >= calendarX && viewportX <= calendarX + calendarWidth && viewportY >= calendarY && viewportY <= calendarY + calendarHeight;
      }
      if (isInBaseDropdown || isInCalendar) {
        this.handleDateRangeModeClick(e, viewportX, viewportY);
        return true;
      }
      return false;
    }
    const dropdownHeight = this.getFilterDropdownHeight();
    if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
      switch (mode) {
        case "select":
          this.handleSelectModeClick(e, viewportX, viewportY);
          break;
        case "search":
          this.handleSearchModeClick(e, viewportX, viewportY);
          break;
        case "range":
          this.handleRangeModeClick(e, viewportX, viewportY);
          break;
        case "boolean":
          this.handleBooleanModeClick(e, viewportX, viewportY);
          break;
      }
      return true;
    }
    return false;
  }
  /**
   * 获取筛选下拉框高度
   */
  getFilterDropdownHeight() {
    if (!this.state.filterDropdown) return 0;
    const { mode, options } = this.state.filterDropdown;
    const padding = 8;
    const gap = 4;
    const buttonHeight = 36;
    switch (mode) {
      case "search": {
        const inputHeight = 36;
        return padding + inputHeight + gap + buttonHeight;
      }
      case "select": {
        const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
        const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
        const searchHeight = 32;
        const gapSelect = 4;
        const visibleCount = Math.min(options?.length ?? 0, maxVisibleItems);
        const listHeight = visibleCount * itemHeight;
        return padding + searchHeight + gapSelect + listHeight + gapSelect + buttonHeight;
      }
      case "range": {
        const inputHeight = 32;
        return padding + inputHeight + gap + buttonHeight;
      }
      case "boolean": {
        const itemHeight = 32;
        return padding + itemHeight * 3 + gap + buttonHeight;
      }
      case "dateRange": {
        const inputHeight = 32;
        return padding + inputHeight + gap + buttonHeight;
      }
      default:
        return 0;
    }
  }
  /**
   * 处理 select 模式点击
   */
  handleSelectModeClick(e, viewportX, viewportY) {
    if (!this.state.filterDropdown) return;
    const { x, y, width, options, scrollTop } = this.state.filterDropdown;
    if (!options) return;
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const buttonHeight = 36;
    const searchHeight = 32;
    const listHeight = visibleCount * itemHeight;
    const padding = 8;
    const gap = 4;
    if (options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, listHeight / totalHeight * listHeight);
      const maxThumbY = listHeight - thumbHeight;
      const thumbY = scrollTop / (totalHeight - listHeight) * maxThumbY;
      const scrollbarX = x + width - scrollbarWidth - 2;
      const listY2 = y + padding + searchHeight + gap;
      if (viewportX >= scrollbarX && viewportX <= scrollbarX + scrollbarWidth && viewportY >= listY2 + thumbY && viewportY <= listY2 + thumbY + thumbHeight) {
        this.state.filterDropdown.isScrollbarDragging = true;
        this.state.filterDropdown.scrollbarDragStartY = e.clientY;
        this.state.filterDropdown.scrollbarDragStartScrollTop = scrollTop;
        return;
      }
    }
    const buttonY = y + padding + searchHeight + gap + listHeight + gap;
    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;
      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;
      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        if (this.state.filterDropdown.options) {
          this.state.filterDropdown.options.forEach((opt) => opt.checked = false);
        }
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }
      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
    const listY = y + padding + searchHeight + gap;
    if (viewportY >= listY && viewportY <= listY + listHeight) {
      const relativeY = viewportY - listY + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);
      if (itemIndex >= 0 && itemIndex < options.length) {
        options[itemIndex].checked = !options[itemIndex].checked;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CHANGE);
      }
    }
  }
  /**
   * 处理 search 模式点击
   */
  handleSearchModeClick(_e, viewportX, viewportY) {
    if (!this.state.filterDropdown) return;
    const { x, y, width } = this.state.filterDropdown;
    const padding = 8;
    const gap = 4;
    const inputHeight = 36;
    const buttonHeight = 36;
    const buttonY = y + padding + inputHeight + gap;
    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;
      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;
      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.searchValue = "";
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }
      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 range 模式点击
   */
  handleRangeModeClick(_e, viewportX, viewportY) {
    if (!this.state.filterDropdown) return;
    const { x, y, width } = this.state.filterDropdown;
    const padding = 8;
    const inputHeight = 32;
    const gap = 4;
    const buttonHeight = 36;
    const buttonY = y + padding + inputHeight + gap;
    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;
      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;
      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.minValue = "";
        this.state.filterDropdown.maxValue = "";
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }
      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 boolean 模式点击
   */
  handleBooleanModeClick(_e, viewportX, viewportY) {
    if (!this.state.filterDropdown) return;
    const { x, y, width } = this.state.filterDropdown;
    const padding = 8;
    const gap = 4;
    const itemHeight = 32;
    const buttonHeight = 36;
    const listY = y + padding;
    const listHeight = itemHeight * 3;
    if (viewportY >= listY && viewportY <= listY + listHeight) {
      const itemIndex = Math.floor((viewportY - listY) / itemHeight);
      const values = ["all", "true", "false"];
      if (itemIndex >= 0 && itemIndex < 3) {
        this.state.filterDropdown.boolValue = values[itemIndex];
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CHANGE);
      }
      return;
    }
    const buttonY = y + padding + listHeight + gap;
    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;
      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;
      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.boolValue = "all";
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }
      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 dateRange 模式点击
   */
  handleDateRangeModeClick(_e, viewportX, viewportY) {
    if (!this.state.filterDropdown) return;
    const { x, y, width, startDate, endDate } = this.state.filterDropdown;
    const padding = 8;
    const inputHeight = 32;
    const inputGap = 8;
    const gap = 4;
    const buttonHeight = 36;
    const inputY = y + padding;
    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;
    const input2X = x + padding + inputWidth + inputGap;
    if (viewportX >= input1X && viewportX <= input1X + inputWidth && viewportY >= inputY && viewportY <= inputY + inputHeight) {
      this.state.filterDropdown.activeDateField = "startDate";
      const dateToUse = startDate || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = dateToUse.getFullYear();
      this.state.filterDropdown.currentMonth = dateToUse.getMonth();
      this.state.filterDropdown.hoveredDate = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (viewportX >= input2X && viewportX <= input2X + inputWidth && viewportY >= inputY && viewportY <= inputY + inputHeight) {
      this.state.filterDropdown.activeDateField = "endDate";
      const dateToUse = endDate || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = dateToUse.getFullYear();
      this.state.filterDropdown.currentMonth = dateToUse.getMonth();
      this.state.filterDropdown.hoveredDate = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0) {
      const calendarHandled = this.handleDateRangeCalendarClick(
        viewportX,
        viewportY,
        x,
        y,
        width,
        padding,
        inputHeight,
        inputGap
      );
      if (calendarHandled) return;
    }
    const buttonY = y + padding + inputHeight + gap;
    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;
      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;
      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.startDate = null;
        this.state.filterDropdown.endDate = null;
        this.state.filterDropdown.activeDateField = void 0;
        this.state.filterDropdown.currentYear = void 0;
        this.state.filterDropdown.currentMonth = void 0;
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }
      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * Handle calendar popover click for date range filter
   */
  handleDateRangeCalendarClick(viewportX, viewportY, dropdownX, dropdownY, dropdownWidth, padding, inputHeight, inputGap) {
    if (!this.state.filterDropdown) return false;
    const { activeDateField, currentYear, currentMonth } = this.state.filterDropdown;
    if (!activeDateField || currentYear === void 0 || currentMonth === void 0) return false;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const calendarRows = 6;
    const calendarHeight = headerHeight + weekdayHeight + calendarRows * dayHeight + rowPadding * 2;
    const calendarWidth = 240;
    const inputWidth = (dropdownWidth - padding * 3) / 2;
    const input1X = dropdownX + padding;
    const input2X = dropdownX + padding + inputWidth + inputGap;
    const input1Y = dropdownY + padding;
    const activeInputX = activeDateField === "startDate" ? input1X : input2X;
    const activeInputCenterX = activeInputX + inputWidth / 2;
    let calendarX = activeInputCenterX - calendarWidth / 2;
    if (calendarX < dropdownX) {
      calendarX = dropdownX;
    }
    if (calendarX + calendarWidth > dropdownX + dropdownWidth) {
      calendarX = dropdownX + dropdownWidth - calendarWidth;
    }
    const calendarY = input1Y + inputHeight + inputGap;
    if (viewportX < calendarX || viewportX > calendarX + calendarWidth || viewportY < calendarY || viewportY > calendarY + calendarHeight) {
      return false;
    }
    if (viewportY >= calendarY && viewportY <= calendarY + headerHeight) {
      const arrowSize = 6;
      const leftArrowX = calendarX + 20;
      const rightArrowX = calendarX + calendarWidth - 20;
      if (viewportX >= leftArrowX - arrowSize - 5 && viewportX <= leftArrowX + arrowSize + 5) {
        if (currentMonth === 0) {
          this.state.filterDropdown.currentYear = currentYear - 1;
          this.state.filterDropdown.currentMonth = 11;
        } else {
          this.state.filterDropdown.currentMonth = currentMonth - 1;
        }
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
        return true;
      }
      if (viewportX >= rightArrowX - arrowSize - 5 && viewportX <= rightArrowX + arrowSize + 5) {
        if (currentMonth === 11) {
          this.state.filterDropdown.currentYear = currentYear + 1;
          this.state.filterDropdown.currentMonth = 0;
        } else {
          this.state.filterDropdown.currentMonth = currentMonth + 1;
        }
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
        return true;
      }
    }
    const dayWidth = (calendarWidth - rowPadding * 2) / 7;
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayAreaY = calendarY + headerHeight + weekdayHeight;
    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;
      const cellX = calendarX + rowPadding + col * dayWidth;
      const cellY = dayAreaY + row * dayHeight;
      if (viewportX >= cellX && viewportX <= cellX + dayWidth && viewportY >= cellY && viewportY <= cellY + dayHeight) {
        const selectedDate = new Date(currentYear, currentMonth, day);
        if (activeDateField === "startDate") {
          this.state.filterDropdown.startDate = selectedDate;
        } else {
          this.state.filterDropdown.endDate = selectedDate;
        }
        this.state.filterDropdown.activeDateField = void 0;
        this.state.filterDropdown.currentYear = void 0;
        this.state.filterDropdown.currentMonth = void 0;
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CHANGE);
        return true;
      }
    }
    return true;
  }
  /**
   * Handle calendar popover hover for date range filter
   */
  handleDateRangeCalendarHover(e) {
    if (!this.state.filterDropdown) return;
    const {
      x,
      y,
      width,
      activeDateField,
      currentYear,
      currentMonth,
      hoveredDate: prevHoveredDate
    } = this.state.filterDropdown;
    if (!activeDateField || currentYear === void 0 || currentMonth === void 0) {
      return;
    }
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const padding = 8;
    const inputHeight = 32;
    const inputGap = 8;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const calendarRows = 6;
    const calendarHeight = headerHeight + weekdayHeight + calendarRows * dayHeight + rowPadding * 2;
    const calendarWidth = 240;
    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;
    const input2X = x + padding + inputWidth + inputGap;
    const input1Y = y + padding;
    const activeInputX = activeDateField === "startDate" ? input1X : input2X;
    const activeInputCenterX = activeInputX + inputWidth / 2;
    let calendarX = activeInputCenterX - calendarWidth / 2;
    if (calendarX < x) {
      calendarX = x;
    }
    if (calendarX + calendarWidth > x + width) {
      calendarX = x + width - calendarWidth;
    }
    const calendarY = input1Y + inputHeight + inputGap;
    if (viewportX < calendarX || viewportX > calendarX + calendarWidth || viewportY < calendarY || viewportY > calendarY + calendarHeight) {
      if (this.state.filterDropdown.hoveredDate !== null) {
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      }
      return;
    }
    const dayWidth = (calendarWidth - rowPadding * 2) / 7;
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayAreaY = calendarY + headerHeight + weekdayHeight;
    let newHoveredDate = null;
    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;
      const cellX = calendarX + rowPadding + col * dayWidth;
      const cellY = dayAreaY + row * dayHeight;
      if (viewportX >= cellX && viewportX <= cellX + dayWidth && viewportY >= cellY && viewportY <= cellY + dayHeight) {
        newHoveredDate = new Date(currentYear, currentMonth, day);
        break;
      }
    }
    const prevTime = prevHoveredDate ? prevHoveredDate.getTime() : null;
    const newTime = newHoveredDate ? newHoveredDate.getTime() : null;
    if (prevTime !== newTime) {
      this.state.filterDropdown.hoveredDate = newHoveredDate;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    }
  }
  /**
   * Handle filter dropdown hover
   */
  handleFilterDropdownHover(e) {
    if (!this.state.filterDropdown) return;
    const { mode, x, y, width, options, scrollTop } = this.state.filterDropdown;
    if (mode === "dateRange") {
      this.handleDateRangeCalendarHover(e);
      return;
    }
    if (mode !== "select" || !options) return;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const searchHeight = 36;
    const listHeight = visibleCount * itemHeight;
    if (options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, listHeight / totalHeight * listHeight);
      const maxThumbY = listHeight - thumbHeight;
      const thumbY = scrollTop / (totalHeight - listHeight) * maxThumbY;
      const scrollbarX = x + width - scrollbarWidth - 2;
      if (viewportX >= scrollbarX && viewportX <= scrollbarX + scrollbarWidth && viewportY >= y + searchHeight + thumbY && viewportY <= y + searchHeight + thumbY + thumbHeight) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }
    const listY = y + searchHeight;
    if (viewportX >= x && viewportX <= x + width && viewportY >= listY && viewportY <= listY + listHeight) {
      const relativeY = viewportY - listY + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);
      if (itemIndex >= 0 && itemIndex < options.length) {
        this.state.filterDropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      }
    } else {
      this.state.filterDropdown.hoveredIndex = -1;
    }
  }
  /**
   * Update dropdown position after scroll
   */
  updateDropdownPosition() {
    if (!this.state.dropdown) return;
    const { cell, width, showAbove } = this.state.dropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    let optionsCount;
    if (this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig) {
      optionsCount = this.state.dropdown.tagsConfig.options?.length ?? 0;
    } else {
      optionsCount = this.state.dropdown.config.options?.length ?? 0;
    }
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    const yResult = this.updateDropdownY(cell, showAbove ?? false, dropdownHeight, { column });
    const newX = this.updateDropdownX(cell, width, { column });
    this.state.dropdown.x = newX;
    this.state.dropdown.y = yResult.y;
    this.state.dropdown.showAbove = yResult.showAbove;
    this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
  }
  /**
   * Close all dropdowns
   */
  closeAllDropdowns() {
    if (this.state.dropdown) {
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, null);
    }
    if (this.state.filterDropdown) {
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }
    if (this.state.dateDropdown) {
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, null);
    }
    if (this.state.buttonsDropdown) {
      this.state.buttonsDropdown = null;
      this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
    }
    if (this.state.colorDropdown) {
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE, null);
    }
  }
  /**
   * Update filter dropdown position
   */
  updateFilterDropdownPosition() {
    if (!this.state.filterDropdown) return;
    const { columnKey } = this.state.filterDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const columnIndex = leafColumns.findIndex((col) => col.key === columnKey);
    if (columnIndex < 0) return;
    const column = leafColumns[columnIndex];
    if (!column) return;
    const cellPos = this.layoutManager.getCellPosition(-1, columnIndex);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    let dropdownX;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }
    this.state.filterDropdown.x = dropdownX;
    this.state.filterDropdown.y = headerHeight;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Update date dropdown position
   */
  updateDateDropdownPosition() {
    if (!this.state.dateDropdown) return;
    const { cell, showAbove } = this.state.dateDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;
    const dropdownHeight = 40 + 28 + 6 * 28 + 16;
    const dropdownWidth = Math.max(column.width ?? 100, 280);
    const yResult = this.updateDropdownY(cell, showAbove ?? false, dropdownHeight, { column });
    const newX = this.updateDropdownX(cell, dropdownWidth, { column });
    this.state.dateDropdown.x = newX;
    this.state.dateDropdown.y = yResult.y;
    this.state.dateDropdown.width = dropdownWidth;
    this.state.dateDropdown.showAbove = yResult.showAbove;
    this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
  }
  /**
   * Update color dropdown position
   */
  updateColorDropdownPosition() {
    if (!this.state.colorDropdown) return;
    const { cell, config } = this.state.colorDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;
    const presetColors = config.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const dropdownHeight = rows * (cellSize + gap) + padding * 2 - gap;
    const dropdownWidth = Math.max(
      column.width ?? 100,
      columns * (cellSize + gap) + padding * 2 - gap
    );
    const yResult = this.updateDropdownY(cell, false, dropdownHeight, { column });
    const newX = this.updateDropdownX(cell, dropdownWidth, { column });
    this.state.colorDropdown.x = newX;
    this.state.colorDropdown.y = yResult.y;
    this.state.colorDropdown.width = dropdownWidth;
    this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_OPEN);
  }
  /**
   * Update buttons dropdown position
   */
  updateButtonsDropdownPosition() {
    if (!this.state.buttonsDropdown) return;
    const { cell, buttonRelativeX, buttonY, buttonHeight, buttons, showAbove } = this.state.buttonsDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.state.buttonsDropdown = null;
      return;
    }
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;
    const yResult = this.updateDropdownY(cell, showAbove, dropdownHeight, {
      column,
      anchorType: "button",
      buttonY,
      buttonHeight
    });
    const newX = this.updateDropdownX(cell, 120, {
      column,
      anchorType: "button",
      buttonRelativeX
    });
    this.state.buttonsDropdown.x = newX;
    this.state.buttonsDropdown.y = yResult.y;
    this.state.buttonsDropdown.showAbove = yResult.showAbove;
    this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
  }
  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  /**
   * Get default preset colors for color picker
   */
  getDefaultPresetColors() {
    return [
      "#ff4d4f",
      "#ff7a45",
      "#ffa940",
      "#ffc53d",
      "#bae637",
      "#73d13d",
      "#36cfc9",
      "#40a9ff",
      "#597ef7",
      "#9254de",
      "#f759ab",
      "#ff85c0",
      "#a0d911",
      "#13c2c2",
      "#1890ff",
      "#722ed1",
      "#eb2f96",
      "#faad14",
      "#52c41a",
      "#2f54eb",
      "#ffffff",
      "#f5f5f5",
      "#d9d9d9",
      "#8c8c8c",
      "#595959",
      "#262626",
      "#000000",
      "#f50"
    ];
  }
  /**
   * Handle date dropdown click
   */
  handleDateDropdownClick(e) {
    if (!this.state.dateDropdown) return false;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const { x, y, width, currentYear, currentMonth } = this.state.dateDropdown;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;
    if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
      const arrowSize = 6;
      const leftArrowX = x + 20;
      const rightArrowX = x + width - 20;
      if (viewportY >= y && viewportY <= y + headerHeight) {
        if (viewportX >= leftArrowX - arrowSize - 5 && viewportX <= leftArrowX + arrowSize + 5) {
          if (currentMonth === 0) {
            this.state.dateDropdown.currentYear = currentYear - 1;
            this.state.dateDropdown.currentMonth = 11;
          } else {
            this.state.dateDropdown.currentMonth = currentMonth - 1;
          }
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
          return true;
        }
        if (viewportX >= rightArrowX - arrowSize - 5 && viewportX <= rightArrowX + arrowSize + 5) {
          if (currentMonth === 11) {
            this.state.dateDropdown.currentYear = currentYear + 1;
            this.state.dateDropdown.currentMonth = 0;
          } else {
            this.state.dateDropdown.currentMonth = currentMonth + 1;
          }
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
          return true;
        }
      }
      const dayWidth = (width - rowPadding * 2) / 7;
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startWeekday = firstDay.getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const index = startWeekday + day - 1;
        const row = Math.floor(index / 7);
        const col = index % 7;
        const cellX = x + rowPadding + col * dayWidth;
        const cellY = y + headerHeight + weekdayHeight + row * dayHeight;
        if (viewportX >= cellX && viewportX <= cellX + dayWidth && viewportY >= cellY && viewportY <= cellY + dayHeight) {
          const selectedDate = new Date(currentYear, currentMonth, day);
          const formattedDate = this.formatDate(selectedDate);
          const cell = this.state.dateDropdown.cell;
          this.state.dateDropdown = null;
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, null);
          this.eventEmitter.emit(TableEvents.DATE_SELECT, this.getCellInfo(cell), formattedDate);
          return true;
        }
      }
      return true;
    }
    return false;
  }
  /**
   * Handle date dropdown hover
   */
  handleDateDropdownHover(e) {
    if (!this.state.dateDropdown) return;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const {
      x,
      y,
      width,
      currentYear,
      currentMonth,
      hoveredDate: prevHoveredDate
    } = this.state.dateDropdown;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;
    let newHoveredDate = null;
    if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
      const dayWidth = (width - rowPadding * 2) / 7;
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startWeekday = firstDay.getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const index = startWeekday + day - 1;
        const row = Math.floor(index / 7);
        const col = index % 7;
        const cellX = x + rowPadding + col * dayWidth;
        const cellY = y + headerHeight + weekdayHeight + row * dayHeight;
        if (viewportX >= cellX && viewportX <= cellX + dayWidth && viewportY >= cellY && viewportY <= cellY + dayHeight) {
          newHoveredDate = new Date(currentYear, currentMonth, day);
          break;
        }
      }
    }
    const prevTime = prevHoveredDate ? prevHoveredDate.getTime() : null;
    const newTime = newHoveredDate ? newHoveredDate.getTime() : null;
    if (prevTime !== newTime) {
      this.state.dateDropdown.hoveredDate = newHoveredDate;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_HOVER);
    }
  }
  /**
   * Handle color dropdown click
   */
  handleColorDropdownClick(e) {
    if (!this.state.colorDropdown) return false;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const { cell, config, x, y, width } = this.state.colorDropdown;
    const presetColors = config.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const dropdownHeight = rows * (cellSize + gap) + padding * 2 - gap;
    if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
      const col = Math.floor((viewportX - x - padding) / (cellSize + gap));
      const row = Math.floor((viewportY - y - padding) / (cellSize + gap));
      if (col >= 0 && col < columns && row >= 0) {
        const index = row * columns + col;
        if (index >= 0 && index < presetColors.length) {
          const selectedColor = presetColors[index];
          this.state.colorDropdown = null;
          this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE, null);
          this.eventEmitter.emit(TableEvents.COLOR_CHANGE, this.getCellInfo(cell), selectedColor);
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Handle color dropdown hover
   */
  handleColorDropdownHover(e) {
    if (!this.state.colorDropdown) return;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const { config, x, y } = this.state.colorDropdown;
    const presetColors = config.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const col = Math.floor((viewportX - x - padding) / (cellSize + gap));
    const row = Math.floor((viewportY - y - padding) / (cellSize + gap));
    let hoveredColor = null;
    if (col >= 0 && col < columns && row >= 0) {
      const index = row * columns + col;
      if (index >= 0 && index < presetColors.length) {
        hoveredColor = presetColors[index];
      }
    }
    if (this.state.colorDropdown.hoveredColor !== hoveredColor) {
      this.state.colorDropdown.hoveredColor = hoveredColor;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_HOVER);
    }
  }
}
class ImageHandler extends BaseHandler {
  static IMAGE_SIZE = 64;
  static IMAGE_PADDING = 8;
  static IMAGE_GAP = 8;
  static IMAGES_PER_ROW = 4;
  static IMAGE_UPLOAD_AREA_HEIGHT = 60;
  constructor(context, eventEmitter) {
    super(context, eventEmitter);
  }
  /**
   * Handle image tooltip hover
   */
  handleImageTooltipHover(e) {
    if (!this.state.imageTooltip) return false;
    const { x, y, images, scrollTop, maxRows } = this.state.imageTooltip;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const dropdownWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + scrollbarGap + scrollbarWidth;
    const rowHeight = imgSize + gap;
    const visibleHeight = maxRows * rowHeight + padding * 2 - gap;
    const prevHoveredIndex = this.state.imageTooltip.hoveredIndex;
    if (viewportX >= x && viewportX <= x + dropdownWidth && viewportY >= y && viewportY <= y + visibleHeight) {
      const totalRows = Math.ceil(images.length / imagesPerRow);
      const startRow = Math.floor(scrollTop / rowHeight);
      const endRow = Math.min(totalRows, startRow + maxRows + 1);
      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < imagesPerRow; col++) {
          const index = row * imagesPerRow + col;
          if (index >= images.length) break;
          const imgX = x + padding + col * (imgSize + gap);
          const imgY = y + padding + row * rowHeight - scrollTop;
          if (viewportX >= imgX && viewportX <= imgX + imgSize && viewportY >= imgY && viewportY <= imgY + imgSize) {
            this.state.imageTooltip.hoveredIndex = index;
            if (prevHoveredIndex !== index) {
              this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
            }
            return true;
          }
        }
      }
      this.state.imageTooltip.hoveredIndex = -1;
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
      }
      return true;
    }
    this.state.imageTooltip.hoveredIndex = -1;
    if (prevHoveredIndex !== -1) {
      this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
    }
    return false;
  }
  /**
   * Handle image tooltip click
   */
  handleImageTooltipClick(e) {
    if (!this.state.imageTooltip) return false;
    const { x, y, images, cell, scrollTop, maxRows } = this.state.imageTooltip;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const dropdownWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + scrollbarGap + scrollbarWidth;
    const rowHeight = imgSize + gap;
    const visibleHeight = maxRows * rowHeight + padding * 2 - gap;
    if (viewportX < x || viewportX > x + dropdownWidth || viewportY < y || viewportY > y + visibleHeight) {
      return false;
    }
    const relativeX = viewportX - x - padding;
    const relativeY = viewportY - y - padding + scrollTop;
    const col = Math.floor(relativeX / (imgSize + gap));
    const row = Math.floor(relativeY / rowHeight);
    if (col >= 0 && col < imagesPerRow && row >= 0) {
      const index = row * imagesPerRow + col;
      if (index >= 0 && index < images.length) {
        const imageSrc = images[index];
        if (imageSrc) {
          this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell), imageSrc, e);
        }
      }
    }
    return true;
  }
  /**
   * Handle image editor hover
   */
  handleImageEditorHover(e) {
    if (!this.state.imageEditor) return false;
    const { x, y, images, pendingImages, scrollTop, maxRows } = this.state.imageEditor;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;
    const prevHoveredIndex = this.state.imageEditor.hoveredIndex;
    if (viewportX < x || viewportX > x + editorWidth || viewportY < y || viewportY > y + editorHeight) {
      this.state.imageEditor.hoveredIndex = -1;
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
      }
      return false;
    }
    if (viewportY >= y && viewportY <= y + uploadAreaHeight) {
      this.state.imageEditor.hoveredIndex = -1;
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
      }
      return true;
    }
    const imagesY = y + uploadAreaHeight;
    const totalImages = images.length + pendingImages.length;
    for (let row = 0; row < maxRows + 1; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= totalImages) break;
        const imgX = x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - scrollTop;
        if (viewportX >= imgX && viewportX <= imgX + imgSize && viewportY >= imgY && viewportY <= imgY + imgSize) {
          this.state.imageEditor.hoveredIndex = index;
          if (prevHoveredIndex !== index) {
            this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
          }
          return true;
        }
      }
    }
    this.state.imageEditor.hoveredIndex = -1;
    if (prevHoveredIndex !== -1) {
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
    }
    return true;
  }
  /**
   * Handle image editor click
   */
  handleImageEditorClick(e) {
    if (!this.state.imageEditor) return "outside";
    const { x, y, images, cell, scrollTop, maxRows } = this.state.imageEditor;
    const coords2 = this.getViewportCoords(e);
    const viewportX = coords2.x;
    const viewportY = coords2.y;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;
    if (viewportX < x || viewportX > x + editorWidth || viewportY < y || viewportY > y + editorHeight) {
      return "outside";
    }
    if (viewportY >= y && viewportY <= y + uploadAreaHeight) {
      return "upload";
    }
    const imagesY = y + uploadAreaHeight;
    const totalImages = images.length + (this.state.imageEditor.pendingImages?.length ?? 0);
    for (let row = 0; row < maxRows + 1; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= totalImages) break;
        const imgX = x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - scrollTop;
        if (viewportX >= imgX && viewportX <= imgX + imgSize && viewportY >= imgY && viewportY <= imgY + imgSize) {
          if (index < images.length) {
            const deletedImage = images[index];
            images.splice(index, 1);
            this.state.imageEditor.images = [...images];
            this.eventEmitter.emit(
              TableEvents.IMAGE_DELETE,
              this.getCellInfo(cell),
              deletedImage,
              index
            );
          }
          return "inside";
        }
      }
    }
    return "inside";
  }
  /**
   * Handle file upload
   */
  async handleFileUpload(files) {
    if (!this.state.imageEditor) return;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[this.state.imageEditor.cell.columnIndex];
    if (!column) return;
    const row = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!row) return;
    const renderResult = column.render ? column.render(
      row.data[getColumnField(column)],
      row,
      column,
      this.state.imageEditor.cell.rowIndex
    ) : { image: row.data[getColumnField(column)] };
    const imageConfig = renderResult.image ?? {};
    const onUpload = imageConfig.onUpload;
    const maxCount = imageConfig.maxCount;
    const isSingleImage = this.state.imageEditor.isSingleImage;
    let remainingSlots;
    if (isSingleImage) {
      remainingSlots = 1;
      this.state.imageEditor.images = [];
    } else {
      const currentCount = this.state.imageEditor.images.length + this.state.imageEditor.pendingImages.length;
      remainingSlots = maxCount !== void 0 ? maxCount - currentCount : files.length;
    }
    const filesToUpload = files.slice(0, remainingSlots);
    const pendingImages = [];
    for (const file of filesToUpload) {
      const preview = await this.readFileAsDataURL(file);
      pendingImages.push({ file, preview });
    }
    this.state.imageEditor.pendingImages = [
      ...this.state.imageEditor.pendingImages,
      ...pendingImages
    ];
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    if (onUpload) {
      for (const pending of pendingImages) {
        try {
          const url = await onUpload(pending.file);
          const index = this.state.imageEditor.pendingImages.findIndex(
            (p) => p.preview === pending.preview
          );
          if (index >= 0) {
            this.state.imageEditor.pendingImages.splice(index, 1);
            this.state.imageEditor.images = [...this.state.imageEditor.images, url];
            this.eventEmitter.emit(
              TableEvents.IMAGE_UPLOAD,
              this.getCellInfo(this.state.imageEditor.cell),
              url
            );
          }
        } catch (error) {
          console.error("Upload failed:", error);
          const index = this.state.imageEditor.pendingImages.findIndex(
            (p) => p.preview === pending.preview
          );
          if (index >= 0) {
            this.state.imageEditor.pendingImages.splice(index, 1);
          }
        }
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
      }
    } else {
      for (const pending of pendingImages) {
        const index = this.state.imageEditor.pendingImages.findIndex(
          (p) => p.preview === pending.preview
        );
        if (index >= 0) {
          this.state.imageEditor.pendingImages.splice(index, 1);
          this.state.imageEditor.images = [...this.state.imageEditor.images, pending.preview];
          this.eventEmitter.emit(
            TableEvents.IMAGE_UPLOAD,
            this.getCellInfo(this.state.imageEditor.cell),
            pending.preview
          );
        }
      }
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    }
  }
  /**
   * Commit image editor changes
   */
  commitImageEditorChanges() {
    if (!this.state.imageEditor) return;
    const { cell, images, isSingleImage } = this.state.imageEditor;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (column && row) {
      const originalValue = row.data[getColumnField(column)];
      let newValue;
      if (isSingleImage) {
        const newSrc = images[0] ?? null;
        if (typeof originalValue === "string") {
          newValue = newSrc;
        } else if (Array.isArray(originalValue)) {
          newValue = { src: newSrc };
        } else if (originalValue && typeof originalValue === "object") {
          newValue = {
            ...originalValue,
            src: newSrc
          };
        } else {
          newValue = newSrc;
        }
      } else {
        if (Array.isArray(originalValue)) {
          newValue = images;
        } else if (originalValue && typeof originalValue === "object") {
          newValue = {
            ...originalValue,
            images
          };
        } else {
          newValue = images;
        }
      }
      this.eventEmitter.emit(TableEvents.EDIT_END, this.getCellInfo(cell), newValue);
    }
    this.state.imageEditor = null;
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_CLOSE);
  }
  /**
   * Read file as data URL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  /**
   * Update image tooltip position after scroll
   */
  updateImageTooltipPosition() {
    if (!this.state.imageTooltip) return;
    const { cell, showAbove, maxRows } = this.state.imageTooltip;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.state.imageTooltip = null;
      return;
    }
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const tooltipWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2;
    const rowHeight = imgSize + gap;
    const tooltipHeight = maxRows * rowHeight + padding * 2 - gap;
    const yResult = this.updateDropdownY(cell, showAbove, tooltipHeight, { column });
    const newX = this.updateDropdownX(cell, tooltipWidth, { column });
    this.state.imageTooltip.x = newX;
    this.state.imageTooltip.y = yResult.y;
    this.state.imageTooltip.showAbove = yResult.showAbove;
  }
  /**
   * Update image editor position after scroll
   */
  updateImageEditorPosition() {
    if (!this.state.imageEditor) return;
    const { cell, showAbove, maxRows } = this.state.imageEditor;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.commitImageEditorChanges();
      return;
    }
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;
    const yResult = this.updateDropdownY(cell, showAbove, editorHeight, { column });
    const newX = this.updateDropdownX(cell, editorWidth, { column });
    this.state.imageEditor.x = newX;
    this.state.imageEditor.y = yResult.y;
    this.state.imageEditor.showAbove = yResult.showAbove;
  }
  /**
   * Handle drag over event for image editor
   */
  handleDragOver(e) {
    if (!this.state.imageEditor) return false;
    e.preventDefault();
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const { x, y, maxRows } = this.state.imageEditor;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;
    if (viewportX >= x && viewportX <= x + editorWidth && viewportY >= y && viewportY <= y + editorHeight) {
      this.state.imageEditor.isDragging = true;
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
      return true;
    }
    return false;
  }
  /**
   * Handle drag leave event for image editor
   */
  handleDragLeave(e) {
    if (!this.state.imageEditor) return;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const { x, y, maxRows } = this.state.imageEditor;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;
    if (viewportX < x || viewportX > x + editorWidth || viewportY < y || viewportY > y + editorHeight) {
      this.state.imageEditor.isDragging = false;
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    }
  }
  /**
   * Handle drop event for image editor
   */
  async handleDrop(e) {
    if (!this.state.imageEditor) return false;
    e.preventDefault();
    this.state.imageEditor.isDragging = false;
    const files = Array.from(e.dataTransfer?.files ?? []).filter(
      (file) => file.type.startsWith("image/")
    );
    if (files.length > 0) {
      await this.handleFileUpload(files);
    }
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    return true;
  }
}
class ContextMenuHandler extends BaseHandler {
  static DROPDOWN_ITEM_HEIGHT = 32;
  constructor(context, eventEmitter) {
    super(context, eventEmitter);
  }
  /**
   * Handle context menu click
   */
  handleContextMenuClick(e) {
    if (!this.state.contextMenu) return false;
    const { x, y, row, items } = this.state.contextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const menuWidth = 140;
    const itemHeight = ContextMenuHandler.DROPDOWN_ITEM_HEIGHT;
    const menuHeight = items.length * itemHeight;
    if (viewportX >= x && viewportX <= x + menuWidth && viewportY >= y && viewportY <= y + menuHeight) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);
      const item = items[itemIndex];
      if (!item || item.disabled) {
        return true;
      }
      if (item.key === "pin-top") {
        this.eventEmitter.emit(TableEvents.ROW_PIN_CHANGE, row, "top");
      } else if (item.key === "pin-bottom") {
        this.eventEmitter.emit(TableEvents.ROW_PIN_CHANGE, row, "bottom");
      } else if (item.key === "unpin") {
        this.eventEmitter.emit(TableEvents.ROW_PIN_CHANGE, row, null);
      } else if (item.key === "add-above") {
        this.eventEmitter.emit(TableEvents.ROW_ADD_ABOVE, row);
      } else if (item.key === "add-below") {
        this.eventEmitter.emit(TableEvents.ROW_ADD_BELOW, row);
      } else if (item.key === "delete") {
        this.eventEmitter.emit(TableEvents.ROW_DELETE, row);
      }
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
      return true;
    }
    return false;
  }
  /**
   * Handle context menu hover
   */
  handleContextMenuHover(e) {
    if (!this.state.contextMenu) return;
    const { x, y, items, hoveredIndex: prevHoveredIndex } = this.state.contextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const menuWidth = 140;
    const itemHeight = ContextMenuHandler.DROPDOWN_ITEM_HEIGHT;
    const menuHeight = items.length * itemHeight;
    let newHoveredIndex = -1;
    if (viewportX >= x && viewportX <= x + menuWidth && viewportY >= y && viewportY <= y + menuHeight) {
      const relativeY = viewportY - y;
      newHoveredIndex = Math.floor(relativeY / itemHeight);
    }
    if (newHoveredIndex !== prevHoveredIndex) {
      this.state.contextMenu.hoveredIndex = newHoveredIndex;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_HOVER);
    }
  }
  /**
   * Handle header context menu click
   */
  handleHeaderContextMenuClick(e) {
    if (!this.state.headerContextMenu) return false;
    const { x, y, columnKey } = this.state.headerContextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const menuWidth = 120;
    const menuHeight = 32;
    if (viewportX >= x && viewportX <= x + menuWidth && viewportY >= y && viewportY <= y + menuHeight) {
      this.eventEmitter.emit(TableEvents.COLUMN_HIDE, columnKey);
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
      return true;
    }
    return false;
  }
  /**
   * Handle header context menu hover
   */
  handleHeaderContextMenuHover(e) {
    if (!this.state.headerContextMenu) return;
    const { x, y, hoveredIndex: prevHoveredIndex } = this.state.headerContextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;
    const menuWidth = 120;
    const menuHeight = 32;
    let newHoveredIndex = -1;
    if (viewportX >= x && viewportX <= x + menuWidth && viewportY >= y && viewportY <= y + menuHeight) {
      newHoveredIndex = 0;
    }
    if (newHoveredIndex !== prevHoveredIndex) {
      this.state.headerContextMenu.hoveredIndex = newHoveredIndex;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_HOVER);
    }
  }
  /**
   * Close context menus
   */
  closeContextMenus() {
    if (this.state.contextMenu) {
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
    }
    if (this.state.headerContextMenu) {
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
    }
  }
  /**
   * Get context menu state
   */
  getContextMenu() {
    return this.state.contextMenu;
  }
  /**
   * Get header context menu state
   */
  getHeaderContextMenu() {
    return this.state.headerContextMenu;
  }
}
class HeaderHandler extends BaseHandler {
  sortConfig;
  filterConfig;
  constructor(context, eventEmitter, sortConfig, filterConfig) {
    super(context, eventEmitter);
    this.sortConfig = sortConfig;
    this.filterConfig = filterConfig;
  }
  /**
   * Handle header hover
   */
  handleHeaderHover(headerCell, viewportX, viewportY) {
    const column = headerCell.column;
    const prevHoveredHeader = this.state.hoveredHeaderColumnKey;
    let cellViewportX;
    if (column.fixed === "left") {
      cellViewportX = headerCell.x;
    } else if (column.fixed === "right") {
      const rightFixedWidth = this.layoutManager.getRightFixedWidth();
      const startX = this.layoutManager.getViewportWidth() - rightFixedWidth;
      const offsetX = startX - (this.layoutManager.getLayoutInfo().totalWidth - rightFixedWidth);
      cellViewportX = headerCell.x + offsetX;
    } else {
      cellViewportX = headerCell.x - this.scrollState.scrollLeft;
    }
    const cellViewportY = headerCell.y;
    const cellWidth = headerCell.width;
    const cellHeight = headerCell.height;
    const padding = 8;
    const dragHandleWidth = 10;
    const dragHandleHeight = 10;
    const dragHandleX = cellViewportX + padding;
    const dragHandleY = cellViewportY + (cellHeight - dragHandleHeight) / 2;
    const isReorderable = column.reorderable !== false;
    const isOnDragHandle = isReorderable && viewportX >= dragHandleX && viewportX <= dragHandleX + dragHandleWidth && viewportY >= dragHandleY && viewportY <= dragHandleY + dragHandleHeight;
    this.state.hoveredHeaderColumnKey = column.key;
    const showFilterIndicator = column?.filterable && headerCell.isLeaf;
    let filterIconX;
    let sortIconX;
    if (showFilterIndicator) {
      filterIconX = cellViewportX + cellWidth - padding - 10;
      sortIconX = filterIconX - 16;
    } else {
      sortIconX = cellViewportX + cellWidth - padding - 10;
    }
    const sortIconY = cellViewportY + cellHeight / 2;
    const arrowWidth = 8;
    const arrowHeight = 5;
    const gap = 2;
    const hitAreaPadding = 4;
    const upArrowTop = sortIconY - gap - arrowHeight - hitAreaPadding;
    const downArrowBottom = sortIconY + gap + arrowHeight + hitAreaPadding;
    const containerLeft = sortIconX - arrowWidth / 2 - hitAreaPadding;
    const containerRight = sortIconX + arrowWidth / 2 + hitAreaPadding;
    const isOnFilterIcon = headerCell.isLeaf && showFilterIndicator && filterIconX !== void 0 && Math.abs(viewportX - filterIconX) < 12;
    const isInSortContainer = headerCell.isLeaf && column && column.sortable !== false && viewportX >= containerLeft && viewportX <= containerRight && viewportY >= upArrowTop && viewportY <= downArrowBottom;
    if (isOnDragHandle) {
      this.canvas.style.cursor = "grab";
    } else if (isOnFilterIcon || isInSortContainer) {
      this.canvas.style.cursor = "pointer";
    } else {
      this.canvas.style.cursor = "default";
    }
    this.state.hoveredCell = null;
    this.state.tooltip = null;
    if (prevHoveredHeader !== this.state.hoveredHeaderColumnKey) {
      this.eventEmitter.emit(TableEvents.HEADER_HOVER, this.state.hoveredHeaderColumnKey);
    }
  }
  /**
   * Handle header mouse down
   */
  handleHeaderMouseDown(columnIndex, e) {
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const headerCell = this.layoutManager.getHeaderCellAtPosition(viewportX, viewportY);
    if (!headerCell) return false;
    const column = headerCell.column;
    if (column.reorderable === false) {
      return false;
    }
    const resizeColIndex = this.layoutManager.isResizeHandleAtPosition(
      viewportX + this.scrollState.scrollLeft,
      0
    );
    if (resizeColIndex >= 0) {
      return false;
    }
    let cellViewportX;
    if (column.fixed === "left") {
      cellViewportX = headerCell.x;
    } else if (column.fixed === "right") {
      const rightFixedWidth = this.layoutManager.getRightFixedWidth();
      const viewportWidth = this.layoutManager.getViewportWidth();
      const startX = viewportWidth - rightFixedWidth;
      const totalWidth = this.layoutManager.getLayoutInfo().totalWidth;
      const offsetX = startX - (totalWidth - rightFixedWidth);
      cellViewportX = headerCell.x + offsetX;
    } else {
      cellViewportX = headerCell.x - this.scrollState.scrollLeft;
    }
    const cellViewportY = headerCell.y;
    const cellHeight = headerCell.height;
    const padding = 8;
    const dragHandleWidth = 10;
    const dragHandleHeight = 10;
    const dragHandleX = cellViewportX + padding;
    const dragHandleY = cellViewportY + (cellHeight - dragHandleHeight) / 2;
    const isOnDragHandle = viewportX >= dragHandleX && viewportX <= dragHandleX + dragHandleWidth && viewportY >= dragHandleY && viewportY <= dragHandleY + dragHandleHeight;
    if (headerCell.isLeaf && !isOnDragHandle) {
      return false;
    }
    if (!headerCell.isLeaf && !isOnDragHandle) {
      return false;
    }
    let dragColumnKey = column.key;
    let dragColumnIndex = columnIndex;
    if (!headerCell.isLeaf && column.children && column.children.length > 0) {
      const firstLeaf = this.getFirstLeaf(column);
      if (firstLeaf) {
        dragColumnKey = column.key;
        dragColumnIndex = this.layoutManager.getLeafColumnIndex(firstLeaf);
        if (dragColumnIndex < 0) dragColumnIndex = columnIndex;
      }
    }
    const siblingColumns = this.calculateSiblingColumns(column);
    const dragSiblingIndex = siblingColumns.findIndex((s) => s.key === column.key);
    this.state.columnReorderState = {
      dragColumnIndex,
      dragColumnKey,
      dragStartX: viewportX,
      currentX: viewportX,
      targetColumnIndex: dragColumnIndex,
      isParentColumn: !headerCell.isLeaf,
      isFixedColumn: !!column.fixed,
      siblingColumns,
      dragSiblingIndex,
      lastSwapTime: void 0,
      lastSwapTargetKey: void 0
    };
    return true;
  }
  /**
   * Handle header click (sort/filter)
   */
  handleHeaderClick(columnIndex, e) {
    const column = this.layoutManager.getLeafColumn(columnIndex);
    if (!column) return;
    this.eventEmitter.emit(TableEvents.HEADER_CLICK, column, columnIndex, e);
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;
    const viewportPos = this.layoutManager.getLeafHeaderCellViewportPosition(columnIndex);
    if (!viewportPos) return;
    const cellViewportX = viewportPos.x;
    const cellViewportY = viewportPos.y;
    const cellWidth = viewportPos.width;
    const cellHeight = viewportPos.height;
    const showFilterIndicator = column.filterable;
    const padding = 8;
    let filterIconX;
    let sortIconX;
    if (showFilterIndicator) {
      filterIconX = cellViewportX + cellWidth - padding - 10;
      sortIconX = filterIconX - 16;
    } else {
      sortIconX = cellViewportX + cellWidth - padding - 10;
    }
    if (showFilterIndicator && filterIconX !== void 0 && Math.abs(viewportX - filterIconX) < 12) {
      this.openFilterDropdown(column, columnIndex);
      return;
    }
    if (column.sortable === false) {
      return;
    }
    const sortIconY = cellViewportY + cellHeight / 2;
    const arrowWidth = 8;
    const arrowHeight = 5;
    const gap = 2;
    const hitAreaPadding = 4;
    const upArrowTop = sortIconY - gap - arrowHeight - hitAreaPadding;
    const upArrowBottom = sortIconY - gap + hitAreaPadding;
    const downArrowTop = sortIconY + gap - hitAreaPadding;
    const downArrowBottom = sortIconY + gap + arrowHeight + hitAreaPadding;
    const containerLeft = sortIconX - arrowWidth / 2 - hitAreaPadding;
    const containerRight = sortIconX + arrowWidth / 2 + hitAreaPadding;
    const isInContainer = viewportX >= containerLeft && viewportX <= containerRight && viewportY >= upArrowTop && viewportY <= downArrowBottom;
    if (isInContainer) {
      const isInUpArrow = viewportY >= upArrowTop && viewportY <= upArrowBottom;
      const isInDownArrow = viewportY >= downArrowTop && viewportY <= downArrowBottom;
      if (isInUpArrow) {
        this.setSortDirection(column, "asc", e);
      } else if (isInDownArrow) {
        this.setSortDirection(column, "desc", e);
      } else {
        this.toggleSort(column, e);
      }
    }
  }
  /**
   * Set sort direction
   */
  setSortDirection(column, direction, e) {
    const existingIndex = this.sortConfig.findIndex((s) => s.column === column.key);
    const currentDirection = existingIndex >= 0 ? this.sortConfig[existingIndex].direction : "none";
    if (currentDirection === direction) {
      if (e.shiftKey) {
        if (existingIndex >= 0) {
          this.sortConfig.splice(existingIndex, 1);
        }
      } else {
        this.sortConfig = [];
      }
      this.eventEmitter.emit(TableEvents.SORT_CHANGE, [...this.sortConfig]);
      return;
    }
    if (e.shiftKey) {
      if (existingIndex >= 0) {
        this.sortConfig[existingIndex].direction = direction;
      } else {
        this.sortConfig.push({ column: column.key, direction });
      }
    } else {
      this.sortConfig = [{ column: column.key, direction }];
    }
    this.eventEmitter.emit(TableEvents.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Toggle sort
   */
  toggleSort(column, _e) {
    const existingIndex = this.sortConfig.findIndex((s) => s.column === column.key);
    let newDirection = "asc";
    if (existingIndex >= 0) {
      const currentDirection = this.sortConfig[existingIndex].direction;
      if (currentDirection === "asc") {
        newDirection = "desc";
      } else if (currentDirection === "desc") {
        newDirection = "none";
      }
    }
    if (_e.shiftKey) {
      if (existingIndex >= 0) {
        if (newDirection === "none") {
          this.sortConfig.splice(existingIndex, 1);
        } else {
          this.sortConfig[existingIndex].direction = newDirection;
        }
      } else if (newDirection !== "none") {
        this.sortConfig.push({ column: column.key, direction: newDirection });
      }
    } else {
      if (newDirection === "none") {
        this.sortConfig = [];
      } else {
        this.sortConfig = [{ column: column.key, direction: newDirection }];
      }
    }
    this.eventEmitter.emit(TableEvents.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Open filter dropdown
   */
  openFilterDropdown(column, columnIndex) {
    const cellPos = this.layoutManager.getCellPosition(-1, columnIndex);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    const mode = getFilterModeByColumnType(column);
    if (!mode) return;
    let dropdownX;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }
    const rowsToUse = this.allRows.length > 0 ? this.allRows : this.rows;
    const existingFilter = this.filterConfig.find((f) => f.column === column.key);
    switch (mode) {
      case "search": {
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "search",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          searchValue: existingFilter?.value ?? ""
        };
        break;
      }
      case "select": {
        const options = getColumnFilterOptions(column, rowsToUse, 0);
        const selectedValues = existingFilter ? existingFilter.value : [];
        const isLoading = options.length === 0 && rowsToUse.length > 0;
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "select",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 200),
          options: options.map((item) => ({
            label: item.label,
            value: item.value,
            checked: selectedValues.includes(item.value)
          })),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          isLoading
        };
        break;
      }
      case "range": {
        const existingValues = existingFilter?.value;
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "range",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          minValue: existingValues?.min ?? "",
          maxValue: existingValues?.max ?? ""
        };
        break;
      }
      case "dateRange": {
        const existingDateValues = existingFilter?.value;
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "dateRange",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 240),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          startDate: existingDateValues?.start ?? null,
          endDate: existingDateValues?.end ?? null
        };
        break;
      }
      case "boolean": {
        const existingBoolValue = existingFilter?.value;
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "boolean",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 160),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          boolValue: existingBoolValue ?? "all"
        };
        break;
      }
    }
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Calculate sibling columns for reorder
   */
  calculateSiblingColumns(column) {
    const siblings = [];
    const scrollLeft = this.scrollState.scrollLeft;
    let siblingColumns = [];
    if (column.parentKey) {
      const parentColumn = this.layoutManager.getColumnByKey(column.parentKey);
      if (parentColumn && parentColumn.children) {
        siblingColumns = parentColumn.children;
      }
    } else {
      const allColumns = this.layoutManager.getColumns();
      siblingColumns = allColumns.filter((col) => {
        if (col.reorderable === false) return false;
        return col.fixed === column.fixed;
      });
    }
    const leftFixedWidth = this.layoutManager.getLeftFixedWidth();
    const rightFixedWidth = this.layoutManager.getRightFixedWidth();
    const viewportWidth = this.layoutManager.getViewportWidth();
    for (const sibling of siblingColumns) {
      const leafCount = this.getChildLeafCount(sibling);
      const firstLeaf = this.getFirstLeaf(sibling);
      const firstLeafIndex = firstLeaf ? this.layoutManager.getLeafColumnIndex(firstLeaf) : -1;
      if (firstLeafIndex < 0) continue;
      const width = this.layoutManager.getColumnWidth(sibling);
      const siblingFixed = sibling.fixed;
      let left = 0;
      if (siblingFixed === "left") {
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "left") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else if (siblingFixed === "right") {
        left = viewportWidth - rightFixedWidth;
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "right") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else {
        left = leftFixedWidth;
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (!col?.fixed) {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
        left -= scrollLeft;
      }
      siblings.push({
        key: sibling.key,
        left,
        right: left + width,
        center: left + width / 2,
        width,
        leafCount,
        firstLeafIndex,
        fixed: siblingFixed || false
      });
    }
    return siblings;
  }
  /**
   * Get first leaf column from a column (possibly parent)
   */
  getFirstLeaf(column) {
    if (!column.children || column.children.length === 0) {
      return column;
    }
    return this.getFirstLeaf(column.children[0]);
  }
  /**
   * Get child leaf count for a column
   */
  getChildLeafCount(column) {
    if (!column.children || column.children.length === 0) {
      return 1;
    }
    let count = 0;
    for (const child of column.children) {
      count += this.getChildLeafCount(child);
    }
    return count;
  }
  /**
   * Update sort config reference
   */
  updateSortConfig(config) {
    this.sortConfig = config;
  }
  /**
   * Update filter config reference
   */
  updateFilterConfig(config) {
    this.filterConfig = config;
  }
}
const DROPDOWN_ITEM_HEIGHT$1 = 32;
class ControlClickHandler extends BaseHandler {
  editingHandler;
  buttonAnimationHandler;
  constructor(context, eventEmitter, editingHandler, buttonAnimationHandler) {
    super(context, eventEmitter);
    this.editingHandler = editingHandler;
    this.buttonAnimationHandler = buttonAnimationHandler;
  }
  /**
   * Handle click on any interactive cell control (checkbox/radio/button/switch/link/…).
   * Returns true when the click has been consumed by a control.
   */
  handleControlClick(cell, e) {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) return false;
    if (column.key.startsWith("__hidden_placeholder__")) {
      const hiddenColumnKey = column._hiddenColumnKey;
      if (hiddenColumnKey) {
        this.eventEmitter.emit(TableEvents.COLUMN_SHOW, hiddenColumnKey);
        return true;
      }
    }
    if (this.context.expandColumnKey === column.key && row.children && row.children.length > 0) {
      const expandClick = this.handleExpandIconClick(cell, e, row);
      if (expandClick) return true;
    }
    const renderResult = getRenderResult(column, row, cell.rowIndex);
    const isDisabled = !this.editorRegistry.getStrategy(column).canEdit(cell, row, column);
    if (renderResult.type === CellTypes.CHECKBOX && renderResult.checkbox) {
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      const checkboxSize = 16;
      const checkboxX = cellViewportX + (cellPos.width - checkboxSize) / 2;
      const checkboxY = cellViewportY + (cellPos.height - checkboxSize) / 2;
      const isOnCheckbox = viewportX >= checkboxX && viewportX <= checkboxX + checkboxSize && viewportY >= checkboxY && viewportY <= checkboxY + checkboxSize;
      if (isOnCheckbox && !isDisabled) {
        const newChecked = !renderResult.checkbox.checked;
        this.eventEmitter.emit(TableEvents.CHECKBOX_CHANGE, this.getCellInfo(cell), newChecked);
        return true;
      }
      return false;
    }
    if (renderResult.type === CellTypes.RADIO && renderResult.radio) {
      if (isDisabled) return false;
      if (renderResult.radio.options && renderResult.radio.options.length > 0) {
        const clickedOption = this.getClickedRadioOption(cell, e, renderResult.radio.options);
        if (clickedOption && !clickedOption.disabled) {
          this.eventEmitter.emit(
            TableEvents.RADIO_CHANGE,
            this.getCellInfo(cell),
            clickedOption.value
          );
          return true;
        }
        return false;
      } else {
        this.eventEmitter.emit(
          TableEvents.RADIO_CHANGE,
          this.getCellInfo(cell),
          renderResult.radio.value
        );
        return true;
      }
    }
    if (renderResult.type === CellTypes.BUTTON && renderResult.button) {
      if (isDisabled) return false;
      const buttonConfig = renderResult.button;
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;
      if (Array.isArray(buttonConfig)) {
        const options = renderResult.buttonOptions ?? {};
        const padding = 8;
        const gap = options.gap ?? 4;
        const maxVisible = options.maxVisible ?? 3;
        const buttonHeight2 = 24;
        const buttonY2 = (cellPos.height - buttonHeight2) / 2;
        const visibleButtons = buttonConfig.filter((btn) => btn.visible !== false);
        const displayButtons = visibleButtons.slice(0, maxVisible);
        const moreButtons = visibleButtons.slice(maxVisible);
        let currentX = padding;
        for (let i = 0; i < displayButtons.length; i++) {
          const btn = displayButtons[i];
          const text2 = btn.text ?? this.locale.cell.buttonText;
          this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          const textWidth2 = this.ctx.measureText(text2).width;
          const buttonWidth2 = Math.max(textWidth2 + 16, 40);
          if (relativeY >= buttonY2 && relativeY <= buttonY2 + buttonHeight2 && relativeX >= currentX && relativeX <= currentX + buttonWidth2) {
            this.eventEmitter.emit(
              TableEvents.BUTTON_CLICK,
              this.getCellInfo(cell),
              btn.actionKey
            );
            return true;
          }
          currentX += buttonWidth2 + gap;
        }
        if (moreButtons.length > 0) {
          const moreText = options.moreButtonText ?? "···";
          this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          const textWidth2 = this.ctx.measureText(moreText).width;
          const buttonWidth2 = Math.max(textWidth2 + 16, 32);
          if (relativeY >= buttonY2 && relativeY <= buttonY2 + buttonHeight2 && relativeX >= currentX && relativeX <= currentX + buttonWidth2) {
            const dropdownX = cellViewportX + currentX;
            const itemHeight = DROPDOWN_ITEM_HEIGHT$1;
            const dropdownHeight = moreButtons.length * itemHeight;
            const canvasRect = this.canvas.getBoundingClientRect();
            let dropdownY = cellViewportY + buttonY2 + buttonHeight2 + 4;
            let showAbove = false;
            if (dropdownY + dropdownHeight > canvasRect.height) {
              dropdownY = cellViewportY + buttonY2 - dropdownHeight - 4;
              showAbove = true;
            }
            this.state.buttonsDropdown = {
              cell,
              x: dropdownX,
              y: dropdownY,
              buttons: moreButtons,
              hoveredIndex: -1,
              buttonRelativeX: currentX,
              buttonY: buttonY2,
              buttonHeight: buttonHeight2,
              showAbove
            };
            this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
            return true;
          }
        }
        return false;
      }
      const buttonHeight = buttonConfig.size === "small" ? 24 : buttonConfig.size === "large" ? 40 : 32;
      const buttonY = (cellPos.height - buttonHeight) / 2;
      const text = buttonConfig.text ?? this.locale.cell.buttonText;
      const fontSize = 13;
      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = this.ctx.measureText(text).width;
      const buttonPadding = 16;
      const cellPadding = 8;
      const buttonWidth = Math.min(
        Math.max(textWidth + buttonPadding * 2, 60),
        cellPos.width - cellPadding * 2
      );
      const buttonX = (cellPos.width - buttonWidth) / 2;
      const isOnButton = relativeY >= buttonY && relativeY <= buttonY + buttonHeight && relativeX >= buttonX && relativeX <= buttonX + buttonWidth;
      if (!isOnButton) return false;
      this.eventEmitter.emit(
        TableEvents.BUTTON_CLICK,
        this.getCellInfo(cell),
        buttonConfig.actionKey
      );
      return true;
    }
    if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
      if (isDisabled) return false;
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;
      const switchWidth = 44;
      const switchHeight = 22;
      const switchX = (cellPos.width - switchWidth) / 2;
      const switchY = (cellPos.height - switchHeight) / 2;
      const isOnSwitch = relativeX >= switchX && relativeX <= switchX + switchWidth && relativeY >= switchY && relativeY <= switchY + switchHeight;
      if (!isOnSwitch) return false;
      const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
      const existingAnimation = this.state.switchAnimations.get(cellKey);
      const currentChecked = renderResult.switch.checked ?? false;
      const currentProgress = existingAnimation ? existingAnimation.progress : currentChecked ? 1 : 0;
      const targetProgress = currentProgress < 0.5 ? 1 : 0;
      const targetChecked = targetProgress === 1;
      if (currentChecked !== targetChecked) {
        this.eventEmitter.emit(TableEvents.SWITCH_CHANGE, this.getCellInfo(cell), targetChecked);
      }
      this.state.switchAnimations.set(cellKey, {
        cell,
        progress: currentProgress,
        targetProgress,
        startTime: Date.now(),
        startProgress: currentProgress
      });
      this.buttonAnimationHandler.startSwitchAnimationLoop();
      return true;
    }
    if (renderResult.type === CellTypes.INPUT && renderResult.input) {
      if (isDisabled || renderResult.input.readonly) return false;
      return false;
    }
    if (renderResult.type === CellTypes.LINK && renderResult.link) {
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;
      const link = renderResult.link;
      const linkUrl = link.link;
      const linkText = link.text || link.link;
      if (!linkUrl || !linkText) return false;
      const padding = 8;
      const fontSize = 13;
      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      const maxTextWidth = cellPos.width - padding * 2;
      let textWidth = this.ctx.measureText(linkText).width;
      let displayText = linkText;
      if (textWidth > maxTextWidth) {
        const ellipsis = "...";
        while (displayText.length > 0 && this.ctx.measureText(displayText + ellipsis).width > maxTextWidth) {
          displayText = displayText.slice(0, -1);
        }
        displayText += ellipsis;
        textWidth = this.ctx.measureText(displayText).width;
      }
      const align = column.align ?? "left";
      let textX;
      switch (align) {
        case "center":
          textX = (cellPos.width - textWidth) / 2;
          break;
        case "right":
          textX = cellPos.width - padding - textWidth;
          break;
        default:
          textX = padding;
      }
      const textY = (cellPos.height - fontSize) / 2;
      const isOnLink = relativeX >= textX && relativeX <= textX + textWidth && relativeY >= textY && relativeY <= textY + fontSize;
      if (!isOnLink) return false;
      const now = Date.now();
      const isDoubleClick = this.lastClickCell?.rowIndex === cell.rowIndex && this.lastClickCell?.columnIndex === cell.columnIndex && now - this.lastClickTime < 350;
      this.lastClickTime = now;
      this.lastClickCell = { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex };
      if (isDoubleClick) {
        return false;
      }
      window.open(linkUrl, "_blank", "noopener,noreferrer");
      return true;
    }
    if (renderResult.type === CellTypes.PROGRESS && renderResult.progress) {
      const result = this.handleProgressClick(cell, e, renderResult.progress, column, row);
      if (result) {
        const precision = renderResult.progress.precision ?? 0;
        const displayValue = precision === 0 ? Math.round(renderResult.progress.value) : Number(renderResult.progress.value.toFixed(precision));
        this.state.isDragging = true;
        this.state.dragType = "progress-drag";
        this.state.progressDragState = {
          cell,
          config: renderResult.progress,
          column,
          row,
          startX: e.clientX,
          startValue: renderResult.progress.value,
          displayValue
        };
        this.canvas.style.cursor = "grabbing";
        this.context.onDragStart?.();
      }
      return result;
    }
    if (renderResult.type === CellTypes.RATING && renderResult.rating) {
      return this.handleRatingClick(cell, e, renderResult.rating, column, row);
    }
    if (renderResult.type === CellTypes.COLOR && renderResult.color) {
      if (isDisabled) return false;
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      const rect = this.canvas.getBoundingClientRect();
      const clickViewportX = e.clientX - rect.left;
      const clickViewportY = e.clientY - rect.top;
      const padding = 8;
      const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
      const colorBoxX = cellViewportX + (cellPos.width - colorBoxSize) / 2;
      const colorBoxY = cellViewportY + (cellPos.height - colorBoxSize) / 2;
      if (clickViewportX >= colorBoxX && clickViewportX <= colorBoxX + colorBoxSize && clickViewportY >= colorBoxY && clickViewportY <= colorBoxY + colorBoxSize) {
        this.editingHandler.startColorEditing(cell, renderResult.color);
        return true;
      }
      return false;
    }
    if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
      if (renderResult.image.clickable === false) return false;
      const config = renderResult.image;
      const images = config.images;
      const rect = this.canvas.getBoundingClientRect();
      const clickViewportX = e.clientX - rect.left;
      const clickViewportY = e.clientY - rect.top;
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      const relativeX = clickViewportX - cellViewportX;
      const relativeY = clickViewportY - cellViewportY;
      const padding = 4;
      const maxImgSize = Math.min(cellPos.width, cellPos.height) - padding * 2;
      const configWidth = config.width ?? 32;
      const configHeight = config.height ?? 32;
      const imgWidth = Math.min(configWidth, maxImgSize);
      const imgHeight = Math.min(configHeight, maxImgSize);
      const gap = config.gap ?? 4;
      if (images && images.length > 1) {
        const maxVisible = config.maxVisible ?? 3;
        const showMoreCount = config.showMoreCount !== false;
        const availableWidth = cellPos.width - padding * 2;
        const maxByWidth = Math.floor((availableWidth + gap) / (imgWidth + gap));
        const reservedForMore = showMoreCount ? 1 : 0;
        const calculatedMaxVisible = Math.max(1, maxByWidth - reservedForMore);
        const actualMaxVisible = Math.min(maxVisible, calculatedMaxVisible);
        const displayCount = images.length > actualMaxVisible ? actualMaxVisible : images.length;
        const hasMore = images.length > actualMaxVisible;
        let contentWidth;
        if (hasMore && showMoreCount) {
          contentWidth = displayCount * imgWidth + displayCount * gap + imgWidth;
        } else {
          contentWidth = displayCount * imgWidth + Math.max(0, displayCount - 1) * gap;
        }
        let startX = (cellPos.width - contentWidth) / 2;
        startX = Math.max(padding, startX);
        const imgY2 = (cellPos.height - imgHeight) / 2;
        const relX = relativeX - startX;
        const relY = relativeY - imgY2;
        if (relX < 0 || relX > contentWidth || relY < 0 || relY > imgHeight) {
          return false;
        }
        const clickedIndex = Math.floor(relX / (imgWidth + gap));
        if (hasMore && showMoreCount && clickedIndex === displayCount) {
          return false;
        }
        if (clickedIndex >= 0 && clickedIndex < images.length) {
          const clickedSrc = images[clickedIndex];
          if (clickedSrc) {
            this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell), clickedSrc, e);
            return true;
          }
        }
        return false;
      }
      const imgX = (cellPos.width - imgWidth) / 2;
      const imgY = (cellPos.height - imgHeight) / 2;
      const isInImage = relativeX >= imgX && relativeX <= imgX + imgWidth && relativeY >= imgY && relativeY <= imgY + imgHeight;
      if (!isInImage) return false;
      const src = config.src || images && images[0];
      if (!src) return false;
      this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell), src, e);
      return true;
    }
    return false;
  }
  /**
   * Handle progress bar drag move (display value only, data is committed on mouseup)
   */
  handleProgressDragMove(e) {
    const dragState = this.state.progressDragState;
    if (!dragState) return;
    const { cell, config, column } = dragState;
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const shape = config.shape ?? "line";
    if (shape === "line") {
      const padding = 8;
      const textPosition = config.textPosition ?? "right";
      const showText = config.showText ?? true;
      const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
      const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;
      const barX = cellViewportX + padding;
      const relativeX = clickViewportX - barX;
      const precision = config.precision ?? 0;
      const rawValue = Math.max(0, Math.min(100, relativeX / barWidth * 100));
      const newValue = precision === 0 ? Math.round(rawValue) : Number(rawValue.toFixed(precision));
      dragState.displayValue = newValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_DRAG);
    } else if (shape === "circle" || shape === "dashboard") {
      const clickViewportY = e.clientY - rect.top;
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      let centerYOffset = 0;
      if (shape === "dashboard") {
        centerYOffset = cellPos.height * 0.05;
      }
      const cellCenterX = cellViewportX + cellPos.width / 2;
      const cellCenterY = cellViewportY + cellPos.height / 2 + centerYOffset;
      const dx = clickViewportX - cellCenterX;
      const dy = clickViewportY - cellCenterY;
      let angle = Math.atan2(dy, dx);
      let newValue;
      if (shape === "circle") {
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        newValue = angle / (Math.PI * 2) * 100;
      } else {
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;
        if (angle < 0) angle += Math.PI * 2;
        let offset = angle - startAngle;
        if (offset < 0) offset += Math.PI * 2;
        newValue = offset / totalAngle * 100;
      }
      newValue = Math.max(0, Math.min(100, newValue));
      const precision = config.precision ?? 0;
      newValue = precision === 0 ? Math.round(newValue) : Number(newValue.toFixed(precision));
      dragState.displayValue = newValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_DRAG);
    }
  }
  /** 记录最近一次点击，用于区分双击（避免链接跳转） */
  lastClickTime = 0;
  lastClickCell = null;
  /**
   * Handle progress bar click
   */
  handleProgressClick(cell, e, config, column, row) {
    if (!config.interactive) return false;
    if (row && column && !this.editorRegistry.getStrategy(column).canEdit(cell, row, column))
      return false;
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const shape = config.shape ?? "line";
    if (shape === "line") {
      const padding = 8;
      const size = config.size ?? "medium";
      const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
      const textPosition = config.textPosition ?? "right";
      const showText = config.showText ?? true;
      const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
      const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;
      const barX = cellViewportX + padding;
      const barY = this.getCellViewportY(cell.rowIndex) + (cellPos.height - barHeight) / 2;
      const clickViewportY = e.clientY - rect.top;
      const relativeX = clickViewportX - barX;
      const relativeY = clickViewportY - barY;
      if (relativeX >= 0 && relativeX <= barWidth && relativeY >= 0 && relativeY <= barHeight) {
        const precision = config.precision ?? 0;
        const rawValue = Math.max(0, Math.min(100, relativeX / barWidth * 100));
        const newValue = precision === 0 ? Math.round(rawValue) : Number(rawValue.toFixed(precision));
        this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell), newValue);
        return true;
      }
    } else if (shape === "circle" || shape === "dashboard") {
      const clickViewportY = e.clientY - rect.top;
      const cellViewportY = this.getCellViewportY(cell.rowIndex);
      const size = config.size ?? "medium";
      let sizeRatio;
      let centerYOffset = 0;
      if (shape === "circle") {
        sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
      } else {
        sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
        centerYOffset = cellPos.height * 0.05;
      }
      const defaultDiameter = Math.floor(cellPos.height * sizeRatio);
      const diameter = config.width ?? defaultDiameter;
      const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));
      const radius = (diameter - strokeWidth) / 2;
      const cellCenterX = cellViewportX + cellPos.width / 2;
      const cellCenterY = cellViewportY + cellPos.height / 2 + centerYOffset;
      const dx = clickViewportX - cellCenterX;
      const dy = clickViewportY - cellCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance >= radius - strokeWidth && distance <= radius + strokeWidth) {
        let angle = Math.atan2(dy, dx);
        let newValue;
        if (shape === "circle") {
          angle = angle + Math.PI / 2;
          if (angle < 0) angle += Math.PI * 2;
          newValue = angle / (Math.PI * 2) * 100;
        } else {
          const startAngle = Math.PI * 0.75;
          const totalAngle = Math.PI * 1.5;
          if (angle < 0) angle += Math.PI * 2;
          let offset = angle - startAngle;
          if (offset < 0) offset += Math.PI * 2;
          if (offset > totalAngle) return false;
          newValue = offset / totalAngle * 100;
        }
        newValue = Math.max(0, Math.min(100, newValue));
        const precision = config.precision ?? 0;
        newValue = precision === 0 ? Math.round(newValue) : Number(newValue.toFixed(precision));
        this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell), newValue);
        return true;
      }
    }
    return false;
  }
  /**
   * Handle rating click
   */
  handleRatingClick(cell, e, config, column, row) {
    if (row && column && !this.editorRegistry.getStrategy(column).canEdit(cell, row, column))
      return false;
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const relativeX = clickViewportX - cellViewportX;
    const max = config.max ?? 5;
    const starSize = config.starSize ?? 16;
    const allowHalf = config.allowHalf ?? false;
    const currentValue = config.value ?? 0;
    const totalWidth = max * starSize;
    const startX = (cellPos.width - totalWidth) / 2;
    const startY = (cellPos.height - starSize) / 2;
    const clickViewportY = e.clientY - rect.top;
    const cellViewportY = cellPos.y - this.context.scrollState.scrollTop;
    const relativeY = clickViewportY - cellViewportY;
    if (relativeY < startY || relativeY > startY + starSize) return false;
    for (let i = 0; i < max; i++) {
      const starX = startX + i * starSize;
      if (relativeX >= starX && relativeX <= starX + starSize) {
        let newValue;
        if (allowHalf) {
          const starRelativeX = relativeX - starX;
          const isLeftHalf = starRelativeX < starSize / 2;
          if (isLeftHalf) {
            newValue = i + 0.5;
          } else {
            newValue = i + 1;
          }
          if (newValue === currentValue) {
            newValue = 0;
          }
        } else {
          newValue = i + 1;
          if (newValue === currentValue) {
            newValue = 0;
          }
        }
        newValue = Math.min(newValue, max);
        this.eventEmitter.emit(TableEvents.RATING_CHANGE, this.getCellInfo(cell), newValue);
        return true;
      }
    }
    return false;
  }
  /**
   * Handle expand icon click
   */
  handleExpandIconClick = (cell, e, row) => {
    const rect = this.canvas.getBoundingClientRect();
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const clickX = e.clientX - rect.left;
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const relativeX = clickX - cellViewportX;
    const level = row.level ?? 0;
    const padding = 8;
    const iconSize = 8;
    const levelIndent = level * 16;
    const iconX = padding + levelIndent;
    const iconEndX = iconX + iconSize + 4;
    if (relativeX >= iconX && relativeX <= iconEndX) {
      this.eventEmitter.emit(TableEvents.EXPAND, row, cell.rowIndex, !row.expanded);
      return true;
    }
    return false;
  };
  /**
   * Get clicked radio option
   */
  getClickedRadioOption(cell, e, options) {
    const rect = this.canvas.getBoundingClientRect();
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const relativeX = clickX - cellViewportX;
    const relativeY = clickY - this.getCellViewportY(cell.rowIndex);
    const padding = 8;
    const size = 16;
    const gap = 4;
    const maxX = cellPos.width - padding;
    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    let currentX = padding;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const textWidth = this.ctx.measureText(option.label).width;
      const optionWidth = size + gap + textWidth + padding;
      if (currentX + optionWidth - padding > maxX) {
        break;
      }
      const radioX = currentX;
      const radioY = (cellPos.height - size) / 2;
      const centerY = radioY + size / 2;
      const inRadioCircle = relativeX >= radioX && relativeX <= radioX + size && relativeY >= radioY && relativeY <= radioY + size;
      const textX = radioX + size + gap;
      const inText = relativeX >= textX && relativeX <= textX + textWidth && relativeY >= centerY - 10 && relativeY <= centerY + 10;
      if (inRadioCircle || inText) {
        return option;
      }
      currentX += optionWidth;
    }
    return null;
  }
}
class ButtonAnimationHandler extends BaseHandler {
  buttonHoverAnimationRunning = false;
  switchAnimationRunning = false;
  isDestroyed = false;
  constructor(context, eventEmitter) {
    super(context, eventEmitter);
  }
  /**
   * Update button hover state for the given cell / mouse position.
   * Starts the hover animation loop when a transition is needed.
   */
  updateButtonHoverState(cell, mouseX, mouseY) {
    const currentHoveredCellKey = cell && cell.rowIndex >= 0 ? `${cell.rowIndex}-${cell.columnIndex}` : null;
    this.state.buttonHoverStates.forEach((state, key) => {
      if (key !== currentHoveredCellKey && state.progress > 0) {
        this.state.buttonHoverStates.set(key, {
          ...state,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: state.progress
        });
      }
    });
    if (!cell || cell.rowIndex < 0) {
      if (this.state.buttonHoverStates.size > 0) {
        this.startButtonHoverAnimationLoop();
      }
      return;
    }
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const renderResult = getRenderResult(column, row, cell.rowIndex);
    if (renderResult.type !== CellTypes.BUTTON || !renderResult.button || Array.isArray(renderResult.button) || !this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const buttonConfig = renderResult.button;
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);
    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;
    const buttonHeight = buttonConfig.size === "small" ? 24 : buttonConfig.size === "large" ? 40 : 32;
    const buttonY = (cellPos.height - buttonHeight) / 2;
    const text = buttonConfig.text ?? this.locale.cell.buttonText;
    const fontSize = 13;
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textWidth = this.ctx.measureText(text).width;
    const buttonPadding = 16;
    const cellPadding = 8;
    const buttonWidth = Math.min(
      Math.max(textWidth + buttonPadding * 2, 60),
      cellPos.width - cellPadding * 2
    );
    const buttonX = (cellPos.width - buttonWidth) / 2;
    const isOnButton = relativeY >= buttonY && relativeY <= buttonY + buttonHeight && relativeX >= buttonX && relativeX <= buttonX + buttonWidth;
    const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
    if (isOnButton) {
      const existingState = this.state.buttonHoverStates.get(cellKey);
      if (!existingState || existingState.targetProgress !== 1) {
        const currentProgress = existingState ? existingState.progress : 0;
        this.state.buttonHoverStates.set(cellKey, {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          progress: currentProgress,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: currentProgress
        });
        this.startButtonHoverAnimationLoop();
      }
    } else {
      const existingState = this.state.buttonHoverStates.get(cellKey);
      if (existingState && existingState.progress > 0) {
        this.state.buttonHoverStates.set(cellKey, {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          progress: existingState.progress,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: existingState.progress
        });
        this.startButtonHoverAnimationLoop();
      }
    }
  }
  /**
   * Fade out all hovered buttons
   */
  clearAllButtonHoverStates() {
    let hasChanges = false;
    this.state.buttonHoverStates.forEach((state, key) => {
      if (state.progress > 0 || state.targetProgress !== 0) {
        this.state.buttonHoverStates.set(key, {
          ...state,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: state.progress
        });
        hasChanges = true;
      }
    });
    if (hasChanges) {
      this.startButtonHoverAnimationLoop();
    }
  }
  /**
   * Set destroyed state
   */
  setDestroyed(destroyed) {
    this.isDestroyed = destroyed;
  }
  /**
   * Start button hover animation loop
   */
  startButtonHoverAnimationLoop() {
    if (this.buttonHoverAnimationRunning) return;
    this.buttonHoverAnimationRunning = true;
    this.runButtonHoverAnimationLoop();
  }
  /**
   * Run button hover animation loop
   */
  runButtonHoverAnimationLoop() {
    if (!this.buttonHoverAnimationRunning || this.isDestroyed) return;
    const animationDuration = 150;
    const now = Date.now();
    let hasActiveAnimations = false;
    this.state.buttonHoverStates.forEach((animation, key) => {
      const elapsed = now - animation.startTime;
      const totalDistance = Math.abs(animation.targetProgress - animation.startProgress);
      if (totalDistance === 0) {
        this.state.buttonHoverStates.delete(key);
        return;
      }
      const fullDuration = animationDuration * totalDistance;
      let rawProgress = elapsed / fullDuration;
      rawProgress = Math.max(0, Math.min(1, rawProgress));
      const displayProgress = animation.startProgress + (animation.targetProgress - animation.startProgress) * rawProgress;
      animation.progress = displayProgress;
      if (rawProgress >= 1) {
        if (animation.targetProgress === 0) {
          this.state.buttonHoverStates.delete(key);
        }
      } else {
        hasActiveAnimations = true;
      }
    });
    this.eventEmitter.emit(TableEvents.BUTTON_HOVER_ANIMATION_UPDATE);
    if (hasActiveAnimations) {
      requestAnimationFrame(() => this.runButtonHoverAnimationLoop());
    } else {
      this.buttonHoverAnimationRunning = false;
    }
  }
  /**
   * Get button hover states
   */
  getButtonHoverStates() {
    return this.state.buttonHoverStates;
  }
  /**
   * Start switch animation loop
   */
  startSwitchAnimationLoop() {
    if (this.switchAnimationRunning) return;
    this.switchAnimationRunning = true;
    this.runSwitchAnimationLoop();
  }
  /**
   * Run switch animation loop
   */
  runSwitchAnimationLoop() {
    if (!this.switchAnimationRunning || this.isDestroyed) return;
    const animationDuration = 200;
    const now = Date.now();
    let hasActiveAnimations = false;
    this.state.switchAnimations.forEach((animation, key) => {
      const elapsed = now - animation.startTime;
      const totalDistance = Math.abs(animation.targetProgress - animation.startProgress);
      const fullDuration = animationDuration * totalDistance;
      let rawProgress = elapsed / fullDuration;
      rawProgress = Math.max(0, Math.min(1, rawProgress));
      const displayProgress = animation.startProgress + (animation.targetProgress - animation.startProgress) * rawProgress;
      animation.progress = displayProgress;
      if (rawProgress >= 1) {
        this.state.switchAnimations.delete(key);
      } else {
        hasActiveAnimations = true;
      }
    });
    this.eventEmitter.emit(TableEvents.SWITCH_ANIMATION_UPDATE);
    if (hasActiveAnimations) {
      requestAnimationFrame(() => this.runSwitchAnimationLoop());
    } else {
      this.switchAnimationRunning = false;
    }
  }
  /**
   * Get switch animations
   */
  getSwitchAnimations() {
    return this.state.switchAnimations;
  }
  /**
   * Clear all animations (for destroy)
   */
  clearAllAnimations() {
    this.state.switchAnimations.clear();
    this.state.buttonHoverStates.clear();
    this.switchAnimationRunning = false;
    this.buttonHoverAnimationRunning = false;
  }
}
const IMAGE_SIZE$1 = 64;
class TooltipHandler extends BaseHandler {
  constructor(context, eventEmitter) {
    super(context, eventEmitter);
  }
  /**
   * Get image size constant
   */
  static get IMAGE_SIZE() {
    return IMAGE_SIZE$1;
  }
  /**
   * Check and show tooltip for cell content
   */
  checkTooltip(cell) {
    if (!cell || cell.rowIndex < 0) {
      this.state.tooltip = null;
      return;
    }
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) {
      this.state.tooltip = null;
      return;
    }
    const renderResult = getRenderResult(column, row, cell.rowIndex);
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);
    if (renderResult.type === CellTypes.TAG && renderResult.tags) {
      this.handleTagsTooltip(cell, renderResult.tags, cellPos, cellViewportX);
      return;
    }
    if (renderResult.type === CellTypes.SELECT && renderResult.select) {
      this.handleSelectTooltip(cell, renderResult.select, cellPos, cellViewportX);
      return;
    }
    if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
      this.handleImageTooltip(cell, renderResult.image, cellPos, cellViewportX, cellViewportY);
      return;
    }
    if (renderResult.text) {
      this.handleTextTooltip(cell, renderResult.text, cellPos, cellViewportX);
      return;
    }
    this.state.tooltip = null;
  }
  checkSummaryTooltip(hit) {
    if (!hit || hit.band !== "summary-top" && hit.band !== "summary-bottom") {
      this.state.tooltip = null;
      return;
    }
    const row = hit.row;
    const summaryCell = row.cells.find(
      (cell) => hit.columnIndex >= cell.startColumnIndex && hit.columnIndex <= cell.endColumnIndex
    );
    if (!summaryCell) {
      this.state.tooltip = null;
      return;
    }
    const text = summaryCell.renderResult.text;
    if (!text) {
      this.state.tooltip = null;
      return;
    }
    const rect = this.getSummaryCellRect(
      row,
      hit.band,
      summaryCell.startColumnIndex,
      summaryCell.endColumnIndex
    );
    if (!rect) {
      this.state.tooltip = null;
      return;
    }
    const padding = 8;
    const maxTextWidth = rect.width - padding * 2;
    const fontSize = this.getFontSize();
    const lineHeight = fontSize * 1.5;
    const maxRows = calculateMaxTextRows(rect.height, lineHeight, padding);
    const isTruncated = maxRows > 1 ? layoutWrappedText(this.ctx, text, maxTextWidth, maxRows).isTruncated : this.ctx.measureText(text).width > maxTextWidth;
    if (!isTruncated) {
      this.state.tooltip = null;
      return;
    }
    this.state.tooltip = {
      cell: { rowIndex: -1, columnIndex: summaryCell.startColumnIndex },
      x: rect.x,
      y: rect.y,
      width: rect.width,
      content: { type: "text", text }
    };
  }
  getSummaryCellRect(row, band, startColumnIndex, endColumnIndex) {
    const rowBands = this.layoutManager.getRowBandsForRender();
    const rowBand = band === "summary-top" ? rowBands.summaryTop : rowBands.summaryBottom;
    const rowIndex = rowBand.rows.indexOf(row);
    if (rowIndex < 0) return null;
    const startOffset = this.layoutManager.getColumnOffset(startColumnIndex);
    const endOffset = this.layoutManager.getColumnOffset(endColumnIndex) + this.layoutManager.getColumnWidthByIndex(endColumnIndex);
    const column = this.layoutManager.getLeafColumn(startColumnIndex);
    const x = column?.fixed ? startOffset : startOffset - this.scrollState.scrollLeft;
    const y = rowBand.y + rowBand.rows.slice(0, rowIndex).reduce((total, summaryRow) => total + summaryRow.height, 0);
    return {
      x,
      y,
      width: endOffset - startOffset,
      height: row.height
    };
  }
  /**
   * Handle tags tooltip
   */
  handleTagsTooltip(cell, config, cellPos, cellViewportX) {
    const fontSize = this.getFontSize();
    const { isTruncated } = layoutTags(this.ctx, config, cellPos.width, cellPos.height, fontSize);
    if (!isTruncated) {
      this.state.tooltip = null;
      return;
    }
    this.state.tooltip = {
      cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
      x: cellViewportX,
      y: this.getCellViewportY(cell.rowIndex),
      width: cellPos.width,
      content: { type: "tags", tags: config.tags }
    };
  }
  /**
   * Handle select tooltip
   */
  handleSelectTooltip(cell, config, cellPos, cellViewportX) {
    const padding = 8;
    const arrowWidth = 20;
    const maxTextWidth = cellPos.width - padding * 2 - arrowWidth;
    let displayText = "";
    const value = config.value;
    if (config.multiple && Array.isArray(value)) {
      if (value.length > 0) {
        const labels = value.map((v) => {
          const opt = config.options.find((o) => o.value === v);
          return opt?.label ?? String(v);
        });
        displayText = labels.join(", ");
      }
    } else if (value !== void 0 && value !== null) {
      const selectedOption = config.options.find((opt) => opt.value === value);
      displayText = selectedOption?.label ?? String(value);
    }
    if (displayText) {
      const textWidth = this.ctx.measureText(displayText).width;
      if (textWidth > maxTextWidth) {
        this.state.tooltip = {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          x: cellViewportX,
          y: this.getCellViewportY(cell.rowIndex),
          width: cellPos.width,
          content: { type: "text", text: displayText }
        };
        return;
      }
    }
    this.state.tooltip = null;
  }
  /**
   * Handle image tooltip (preview dropdown)
   */
  handleImageTooltip(cell, config, cellPos, cellViewportX, cellViewportY) {
    const images = config.images;
    if (!images || images.length <= 1) {
      this.state.tooltip = null;
      return;
    }
    const canvasRect = this.canvas.getBoundingClientRect();
    const imgSize = IMAGE_SIZE$1;
    const dropdownPadding = 8;
    const dropdownGap = 8;
    const imagesPerRow = 4;
    const rowCount = Math.ceil(images.length / imagesPerRow);
    let maxRows;
    if (rowCount <= 1) {
      maxRows = 1;
    } else if (rowCount <= 2) {
      maxRows = 2;
    } else {
      maxRows = 3;
    }
    const dropdownWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * dropdownGap + dropdownPadding * 2;
    const rowHeight = imgSize + dropdownGap;
    const dropdownHeight = maxRows * rowHeight + dropdownPadding * 2 - dropdownGap;
    let dropdownY = cellViewportY + cellPos.height;
    let showAbove = false;
    if (dropdownY + dropdownHeight > canvasRect.height) {
      dropdownY = cellViewportY - dropdownHeight;
      showAbove = true;
    }
    let dropdownX = cellViewportX;
    if (dropdownX + dropdownWidth > canvasRect.width) {
      dropdownX = canvasRect.width - dropdownWidth - 4;
    }
    if (dropdownX < 0) {
      dropdownX = 4;
    }
    this.state.imageTooltip = {
      cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
      x: dropdownX,
      y: dropdownY,
      images,
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows,
      showAbove
    };
  }
  /**
   * Handle text tooltip
   */
  handleTextTooltip(cell, text, cellPos, cellViewportX) {
    const padding = 8;
    const maxTextWidth = cellPos.width - padding * 2;
    const fontSize = this.getFontSize();
    const lineHeight = fontSize * 1.5;
    const maxRows = calculateMaxTextRows(cellPos.height, lineHeight, padding);
    const isTruncated = maxRows > 1 ? layoutWrappedText(this.ctx, text, maxTextWidth, maxRows).isTruncated : this.ctx.measureText(text).width > maxTextWidth;
    if (isTruncated) {
      this.state.tooltip = {
        cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        x: cellViewportX,
        y: this.getCellViewportY(cell.rowIndex),
        width: cellPos.width,
        content: { type: "text", text }
      };
      return;
    }
    this.state.tooltip = null;
  }
  getFontSize() {
    const match = this.ctx.font.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 13;
  }
  /**
   * Update tooltip position on scroll
   */
  updateTooltipPosition() {
    if (!this.state.tooltip) return;
    const { cell } = this.state.tooltip;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    let tooltipX;
    if (column.fixed === "left") {
      tooltipX = cellPos.x;
    } else if (column.fixed === "right") {
      tooltipX = cellPos.x;
    } else {
      tooltipX = cellPos.x - this.scrollState.scrollLeft;
    }
    const tooltipY = this.getCellViewportY(cell.rowIndex);
    this.state.tooltip.x = tooltipX;
    this.state.tooltip.y = tooltipY;
    this.state.tooltip.width = cellPos.width;
  }
  /**
   * Clear tooltip
   */
  clearTooltip() {
    this.state.tooltip = null;
  }
  /**
   * Get tooltip state
   */
  getTooltip() {
    return this.state.tooltip;
  }
  /**
   * Get image tooltip state
   */
  getImageTooltip() {
    return this.state.imageTooltip;
  }
}
class HoverHandler extends BaseHandler {
  /**
   * 判断鼠标位置是否落在可点击元素上（用于设置 pointer 光标）
   */
  isClickableElement(cell, mouseX, mouseY) {
    if (!cell) return false;
    if (cell.rowIndex === -1) {
      return true;
    }
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) return false;
    const renderResult = getRenderResult(column, row, cell.rowIndex);
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const isDisabled = !this.editorRegistry.getStrategy(column).canEdit(cell, row, column);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);
    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;
    if (renderResult.type === CellTypes.CHECKBOX && renderResult.checkbox) {
      if (isDisabled) return false;
      const size = 16;
      const checkboxX = (cellPos.width - size) / 2;
      const checkboxY = (cellPos.height - size) / 2;
      return relativeX >= checkboxX && relativeX <= checkboxX + size && relativeY >= checkboxY && relativeY <= checkboxY + size;
    }
    if (renderResult.type === CellTypes.RADIO && renderResult.radio) {
      if (isDisabled) return false;
      const size = 16;
      if (renderResult.radio.options && renderResult.radio.options.length > 0) {
        const padding = 8;
        const gap = 4;
        const maxX = cellPos.width - padding;
        this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        let currentX = padding;
        for (let i = 0; i < renderResult.radio.options.length; i++) {
          const option = renderResult.radio.options[i];
          if (option.disabled) {
            const textWidth2 = this.ctx.measureText(option.label).width;
            currentX += size + gap + textWidth2 + padding;
            continue;
          }
          const textWidth = this.ctx.measureText(option.label).width;
          const optionWidth = size + gap + textWidth + padding;
          if (currentX + optionWidth - padding > maxX) {
            break;
          }
          const radioX = currentX;
          const radioY = (cellPos.height - size) / 2;
          const centerY = radioY + size / 2;
          const inRadioCircle = relativeX >= radioX && relativeX <= radioX + size && relativeY >= radioY && relativeY <= radioY + size;
          const textX = radioX + size + gap;
          const inText = relativeX >= textX && relativeX <= textX + textWidth && relativeY >= centerY - 10 && relativeY <= centerY + 10;
          if (inRadioCircle || inText) {
            return true;
          }
          currentX += optionWidth;
        }
        return false;
      } else {
        const radioX = (cellPos.width - size) / 2;
        const radioY = (cellPos.height - size) / 2;
        return relativeX >= radioX && relativeX <= radioX + size && relativeY >= radioY && relativeY <= radioY + size;
      }
    }
    if (renderResult.type === CellTypes.BUTTON && renderResult.button) {
      if (isDisabled) return false;
      const button = renderResult.button;
      if (Array.isArray(button)) {
        const options = renderResult.buttonOptions ?? {};
        const padding2 = 8;
        const gap = options.gap ?? 4;
        const maxVisible = options.maxVisible ?? 3;
        const buttonHeight2 = 24;
        const buttonY2 = (cellPos.height - buttonHeight2) / 2;
        const visibleButtons = button.filter((btn) => btn.visible !== false);
        const displayButtons = visibleButtons.slice(0, maxVisible);
        let currentX = padding2;
        for (const btn of displayButtons) {
          const text = btn.text ?? this.locale.cell.buttonText;
          this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          const textWidth = this.ctx.measureText(text).width;
          const buttonWidth = Math.max(textWidth + 16, 40);
          if (relativeY >= buttonY2 && relativeY <= buttonY2 + buttonHeight2 && relativeX >= currentX && relativeX <= currentX + buttonWidth) {
            return true;
          }
          currentX += buttonWidth + gap;
        }
        if (visibleButtons.length > maxVisible) {
          const moreText = options.moreButtonText ?? "···";
          this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          const textWidth = this.ctx.measureText(moreText).width;
          const buttonWidth = Math.max(textWidth + 16, 32);
          if (relativeY >= buttonY2 && relativeY <= buttonY2 + buttonHeight2 && relativeX >= currentX && relativeX <= currentX + buttonWidth) {
            return true;
          }
        }
        return false;
      }
      const buttonHeight = button.size === "small" ? 24 : button.size === "large" ? 40 : 32;
      const buttonY = (cellPos.height - buttonHeight) / 2;
      const padding = 8;
      return relativeY >= buttonY && relativeY <= buttonY + buttonHeight && relativeX >= padding && relativeX <= cellPos.width - padding;
    }
    if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
      if (isDisabled) return false;
      const switchWidth = 44;
      const switchHeight = 22;
      const switchX = (cellPos.width - switchWidth) / 2;
      const switchY = (cellPos.height - switchHeight) / 2;
      return relativeX >= switchX && relativeX <= switchX + switchWidth && relativeY >= switchY && relativeY <= switchY + switchHeight;
    }
    if (renderResult.type === CellTypes.SELECT && renderResult.select) {
      if (isDisabled) return false;
      return true;
    }
    if (renderResult.type === CellTypes.TAG && renderResult.tags) {
      return true;
    }
    if (renderResult.type === CellTypes.INPUT && renderResult.input) {
      if (isDisabled || renderResult.input.readonly) return false;
      return true;
    }
    if (renderResult.type === CellTypes.LINK && renderResult.link) {
      const link = renderResult.link;
      const linkText = link.text || link.link;
      if (!linkText) return false;
      const padding = 8;
      const fontSize = 13;
      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      const maxTextWidth = cellPos.width - padding * 2;
      let textWidth = this.ctx.measureText(linkText).width;
      let displayText = linkText;
      if (textWidth > maxTextWidth) {
        const ellipsis = "...";
        while (displayText.length > 0 && this.ctx.measureText(displayText + ellipsis).width > maxTextWidth) {
          displayText = displayText.slice(0, -1);
        }
        displayText += ellipsis;
        textWidth = this.ctx.measureText(displayText).width;
      }
      const align = column.align ?? "left";
      let textX;
      switch (align) {
        case "center":
          textX = (cellPos.width - textWidth) / 2;
          break;
        case "right":
          textX = cellPos.width - padding - textWidth;
          break;
        default:
          textX = padding;
      }
      const textY = (cellPos.height - fontSize) / 2;
      return relativeX >= textX && relativeX <= textX + textWidth && relativeY >= textY && relativeY <= textY + fontSize;
    }
    if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
      const config = renderResult.image;
      if (config.clickable === false) return false;
      const images = config.images;
      if (!images || images.length <= 1) {
        const src = config.src || images && images[0];
        return !!src;
      }
      const hoveredImageIndex = this.state.hoveredImageIndex ?? -1;
      return hoveredImageIndex >= 0 && hoveredImageIndex < images.length;
    }
    if (renderResult.type === CellTypes.PROGRESS && renderResult.progress) {
      const config = renderResult.progress;
      if (config.interactive !== true) return false;
      if (isDisabled) return false;
      const shape = config.shape ?? "line";
      if (shape === "line") {
        const padding = 8;
        const size = config.size ?? "medium";
        const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
        const textPosition = config.textPosition ?? "right";
        const showText = config.showText ?? true;
        const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
        const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;
        const barX = padding;
        const barY = (cellPos.height - barHeight) / 2;
        return relativeX >= barX && relativeX <= barX + barWidth && relativeY >= barY && relativeY <= barY + barHeight;
      }
      if (shape === "circle" || shape === "dashboard") {
        const size = config.size ?? "medium";
        let sizeRatio;
        let centerYOffset = 0;
        if (shape === "circle") {
          sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
        } else {
          sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
          centerYOffset = cellPos.height * 0.05;
        }
        const defaultDiameter = Math.floor(cellPos.height * sizeRatio);
        const diameter = config.width ?? defaultDiameter;
        const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));
        const centerX = cellPos.width / 2;
        const centerY = cellPos.height / 2 + centerYOffset;
        const radius = (diameter - strokeWidth) / 2;
        const dx = relativeX - centerX;
        const dy = relativeY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance >= radius - strokeWidth && distance <= radius + strokeWidth;
      }
    }
    if (renderResult.type === CellTypes.RATING && renderResult.rating) {
      if (isDisabled) return false;
      const config = renderResult.rating;
      const max = config.max ?? 5;
      const starSize = config.starSize ?? 16;
      const totalWidth = max * starSize;
      const startX = (cellPos.width - totalWidth) / 2;
      const startY = (cellPos.height - starSize) / 2;
      return relativeX >= startX && relativeX <= startX + totalWidth && relativeY >= startY && relativeY <= startY + starSize;
    }
    if (renderResult.type === CellTypes.COLOR && renderResult.color) {
      if (isDisabled) return false;
      const padding = 8;
      const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
      const colorBoxX = (cellPos.width - colorBoxSize) / 2;
      const colorBoxY = (cellPos.height - colorBoxSize) / 2;
      return relativeX >= colorBoxX && relativeX <= colorBoxX + colorBoxSize && relativeY >= colorBoxY && relativeY <= colorBoxY + colorBoxSize;
    }
    return false;
  }
  /**
   * 更新单元格内被 hover 的图片索引
   */
  updateImageHoverIndex(cell, mouseX, mouseY) {
    if (!cell || cell.rowIndex < 0) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const renderResult = getRenderResult(column, row, cell.rowIndex);
    if (renderResult.type !== CellTypes.IMAGE || !renderResult.image) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const config = renderResult.image;
    const images = config.images;
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);
    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;
    const padding = 4;
    const STANDARD_ROW_HEIGHT2 = 32;
    const effectiveCellHeight = config.scaleWithRowHeight === false ? Math.min(cellPos.height, STANDARD_ROW_HEIGHT2) : cellPos.height;
    const maxImgSize = Math.max(0, Math.min(cellPos.width, effectiveCellHeight) - padding * 2);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const gap = config.gap ?? 4;
    if (!images || images.length <= 1) {
      const imgX = (cellPos.width - imgWidth) / 2;
      const imgY = (cellPos.height - imgHeight) / 2;
      const isInImage = relativeX >= imgX && relativeX <= imgX + imgWidth && relativeY >= imgY && relativeY <= imgY + imgHeight;
      this.state.hoveredImageIndex = isInImage && config.hoverable !== false ? 0 : -1;
      return;
    }
    const availableWidth = cellPos.width - padding * 2;
    const availableHeight = cellPos.height - padding * 2;
    const showMoreCount = config.showMoreCount !== false;
    const userMaxVisible = config.maxVisible;
    const imagesPerRow = Math.max(1, Math.floor((availableWidth + gap) / (imgWidth + gap)));
    const maxRows = Math.max(1, Math.floor((availableHeight + gap) / (imgHeight + gap)));
    const slotCapacity = imagesPerRow * maxRows;
    const requestedMaxVisible = userMaxVisible ?? slotCapacity;
    const needsMoreCount = showMoreCount && images.length > requestedMaxVisible;
    const maxVisibleCapacity = needsMoreCount ? Math.max(0, slotCapacity - 1) : slotCapacity;
    const maxVisible = Math.min(requestedMaxVisible, maxVisibleCapacity);
    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;
    const renderItemCount = displayCount + (hasMore && showMoreCount ? 1 : 0);
    const displayRows = Math.max(1, Math.ceil(renderItemCount / imagesPerRow));
    const widestRowItems = Math.min(renderItemCount, imagesPerRow);
    const contentWidth = widestRowItems * imgWidth + Math.max(0, widestRowItems - 1) * gap;
    const contentHeight = displayRows * imgHeight + Math.max(0, displayRows - 1) * gap;
    let startX = (cellPos.width - contentWidth) / 2;
    startX = Math.max(padding, startX);
    const startY = (cellPos.height - contentHeight) / 2;
    const relX = relativeX - startX;
    const relY = relativeY - startY;
    for (let i = 0; i < displayCount; i++) {
      const row2 = Math.floor(i / imagesPerRow);
      const col = i % imagesPerRow;
      const imgStartX = col * (imgWidth + gap);
      const imgStartY = row2 * (imgHeight + gap);
      if (relX >= imgStartX && relX < imgStartX + imgWidth && relY >= imgStartY && relY < imgStartY + imgHeight) {
        this.state.hoveredImageIndex = config.hoverable !== false ? i : -1;
        return;
      }
    }
    if (hasMore && showMoreCount) {
      const moreRow = Math.floor(displayCount / imagesPerRow);
      const moreCol = displayCount % imagesPerRow;
      const moreStartX = moreCol * (imgWidth + gap);
      const moreStartY = moreRow * (imgHeight + gap);
      if (relX >= moreStartX && relX < moreStartX + imgWidth && relY >= moreStartY && relY < moreStartY + imgHeight) {
        this.state.hoveredImageIndex = config.hoverable !== false ? displayCount : -1;
        return;
      }
    }
    this.state.hoveredImageIndex = -1;
  }
  /**
   * 更新单元格内被 hover 的按钮索引
   */
  updateButtonsHoverIndex(cell, mouseX, mouseY) {
    if (!cell || cell.rowIndex < 0) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const renderResult = getRenderResult(column, row, cell.rowIndex);
    if (renderResult.type !== CellTypes.BUTTON || !renderResult.button || !Array.isArray(renderResult.button)) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const buttons = renderResult.button;
    const options = renderResult.buttonOptions ?? {};
    const visibleButtons = buttons.filter((btn) => btn.visible !== false);
    const maxVisible = options.maxVisible ?? 3;
    const gap = options.gap ?? 4;
    const padding = 8;
    const buttonHeight = 24;
    const displayButtons = visibleButtons.slice(0, maxVisible);
    const moreButtons = visibleButtons.slice(maxVisible);
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);
    const buttonY = cellViewportY + (cellPos.height - buttonHeight) / 2;
    const relativeY = mouseY - buttonY;
    if (relativeY < 0 || relativeY > buttonHeight) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    let currentX = cellViewportX + padding;
    const fontSize = 13;
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    for (let i = 0; i < displayButtons.length; i++) {
      const btn = displayButtons[i];
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.ctx.measureText(text).width;
      const buttonWidth = Math.max(textWidth + 16, 40);
      if (mouseX >= currentX && mouseX < currentX + buttonWidth) {
        this.state.hoveredButtonIndex = i;
        return;
      }
      currentX += buttonWidth + gap;
    }
    if (moreButtons.length > 0) {
      const moreText = options.moreButtonText ?? "···";
      const textWidth = this.ctx.measureText(moreText).width;
      const buttonWidth = Math.max(textWidth + 16, 32);
      if (mouseX >= currentX && mouseX < currentX + buttonWidth) {
        this.state.hoveredButtonIndex = maxVisible;
        return;
      }
    }
    this.state.hoveredButtonIndex = -1;
  }
}
const IMAGE_SIZE = 64;
const DROPDOWN_ITEM_HEIGHT = 32;
const DROPDOWN_MAX_VISIBLE = 8;
class WheelHandler extends BaseHandler {
  dropdownHandler;
  imageHandler;
  tooltipHandler;
  lazyLoadEnabled = false;
  lazyLoadThreshold = 5;
  isLoadingMore = false;
  hasMoreData = true;
  scrollTimeout = null;
  constructor(context, eventEmitter, dropdownHandler, imageHandler, tooltipHandler) {
    super(context, eventEmitter);
    this.dropdownHandler = dropdownHandler;
    this.imageHandler = imageHandler;
    this.tooltipHandler = tooltipHandler;
  }
  setLazyLoadConfig(enabled, threshold) {
    this.lazyLoadEnabled = enabled;
    this.lazyLoadThreshold = threshold;
    this.hasMoreData = true;
  }
  setLoadingMore(loading) {
    this.isLoadingMore = loading;
  }
  setHasMore(hasMore) {
    this.hasMoreData = hasMore;
    if (!hasMore) {
      this.isLoadingMore = true;
    }
  }
  destroy() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }
  handleWheel(e) {
    const target = e.target;
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
      const element = target;
      const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
      const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;
      if (hasVerticalScrollbar || hasHorizontalScrollbar) {
        return;
      }
    }
    if (this.state.imageTooltip) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const { x, y, images, maxRows, scrollTop } = this.state.imageTooltip;
      const imgSize = IMAGE_SIZE;
      const padding = 8;
      const gap = 8;
      const imagesPerRow = 4;
      const scrollbarWidth = 4;
      const scrollbarGap = 4;
      const dropdownWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + scrollbarGap + scrollbarWidth;
      const rowHeight = imgSize + gap;
      const visibleHeight = maxRows * rowHeight + padding * 2 - gap;
      const isInDropdown = viewportX >= x && viewportX <= x + dropdownWidth && viewportY >= y && viewportY <= y + visibleHeight;
      if (isInDropdown) {
        const totalRows = Math.ceil(images.length / imagesPerRow);
        const maxScrollTop = Math.max(0, (totalRows - maxRows) * rowHeight);
        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (maxScrollTop > 0 && isMainlyVertical) {
          const epsilon = 0.5;
          const atTop = scrollTop <= epsilon && e.deltaY < 0;
          const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;
          if (!atTop && !atBottom) {
            this.state.imageTooltip.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
            return;
          }
        }
      }
      this.imageHandler.updateImageTooltipPosition();
    }
    if (this.state.imageEditor) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const { x, y, images, maxRows, scrollTop, pendingImages } = this.state.imageEditor;
      const imgSize = IMAGE_SIZE;
      const padding = 8;
      const gap = 8;
      const imagesPerRow = 4;
      const uploadAreaHeight = 60;
      const rowHeight = imgSize + gap;
      const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
      const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
      const editorHeight = uploadAreaHeight + imagesHeight;
      const isInEditor = viewportX >= x && viewportX <= x + editorWidth && viewportY >= y && viewportY <= y + editorHeight;
      if (isInEditor) {
        const totalImages = images.length + pendingImages.length;
        const totalRows = Math.ceil(totalImages / imagesPerRow);
        const maxScrollTop = Math.max(0, (totalRows - maxRows) * rowHeight);
        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (maxScrollTop > 0 && isMainlyVertical) {
          const epsilon = 0.5;
          const atTop = scrollTop <= epsilon && e.deltaY < 0;
          const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;
          if (!atTop && !atBottom) {
            this.state.imageEditor.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
            return;
          }
        }
      }
      this.imageHandler.updateImageEditorPosition();
    }
    if (this.state.filterDropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const { x, y, width, mode, options, scrollTop } = this.state.filterDropdown;
      if (mode === "select" && options) {
        const padding = 8;
        const itemHeight = DROPDOWN_ITEM_HEIGHT;
        const maxVisibleItems = DROPDOWN_MAX_VISIBLE;
        const visibleCount = Math.min(options.length, maxVisibleItems);
        const searchHeight = 32;
        const gap = 4;
        const listHeight = visibleCount * itemHeight;
        const dropdownHeight = padding + searchHeight + gap + listHeight + gap + 36;
        const isInDropdown = viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight;
        if (isInDropdown) {
          const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
          const maxScrollTop = Math.max(0, options.length * itemHeight - listHeight);
          if (maxScrollTop > 0 && isMainlyVertical) {
            const epsilon = 0.5;
            const atTop = scrollTop <= epsilon && e.deltaY < 0;
            const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;
            if (!atTop && !atBottom) {
              this.state.filterDropdown.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
              e.preventDefault();
              e.stopPropagation();
              this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
              return;
            }
          }
        }
      }
      this.dropdownHandler.updateFilterDropdownPosition();
    }
    if (this.state.dropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const { x, y, width, type, tagsConfig, config, scrollTop } = this.state.dropdown;
      const itemHeight = DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = DROPDOWN_MAX_VISIBLE;
      let optionsLength;
      if (type === "tags" && tagsConfig) {
        optionsLength = tagsConfig.options?.length ?? 0;
      } else {
        optionsLength = config.options.length;
      }
      const visibleCount = Math.min(optionsLength, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;
      const isInDropdown = viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight;
      if (isInDropdown) {
        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        const maxScrollTop = Math.max(0, optionsLength * itemHeight - dropdownHeight);
        if (maxScrollTop > 0 && isMainlyVertical) {
          const epsilon = 0.5;
          const currentScrollTop = scrollTop ?? 0;
          const atTop = currentScrollTop <= epsilon && e.deltaY < 0;
          const atBottom = currentScrollTop >= maxScrollTop - epsilon && e.deltaY > 0;
          if (!atTop && !atBottom) {
            this.state.dropdown.scrollTop = clamp(currentScrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
            return;
          }
        }
      }
      this.dropdownHandler.updateDropdownPosition();
    }
    this.updateAllDropdownPositions();
    e.preventDefault();
    const deltaX = e.deltaX;
    const deltaY = e.deltaY;
    const newScrollLeft = clamp(
      this.scrollState.scrollLeft + deltaX,
      0,
      this.scrollState.maxScrollLeft
    );
    const newScrollTop = clamp(
      this.scrollState.scrollTop + deltaY,
      0,
      this.scrollState.maxScrollTop
    );
    if (newScrollLeft !== this.scrollState.scrollLeft || newScrollTop !== this.scrollState.scrollTop) {
      this.scrollState.scrollLeft = newScrollLeft;
      this.scrollState.scrollTop = newScrollTop;
      this.scrollState.isScrolling = true;
      this.eventEmitter.emit(TableEvents.SCROLL, newScrollLeft, newScrollTop);
      this.checkLazyLoad(newScrollTop, deltaY);
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = false;
      }, 150);
    }
  }
  handleExternalWheel(deltaX, deltaY) {
    if (this.state.dropdown) {
      this.dropdownHandler.updateDropdownPosition();
    }
    if (this.state.tooltip) {
      this.tooltipHandler.updateTooltipPosition();
    }
    const newScrollLeft = clamp(
      this.scrollState.scrollLeft + deltaX,
      0,
      this.scrollState.maxScrollLeft
    );
    const newScrollTop = clamp(
      this.scrollState.scrollTop + deltaY,
      0,
      this.scrollState.maxScrollTop
    );
    if (newScrollLeft !== this.scrollState.scrollLeft || newScrollTop !== this.scrollState.scrollTop) {
      this.scrollState.scrollLeft = newScrollLeft;
      this.scrollState.scrollTop = newScrollTop;
      this.scrollState.isScrolling = true;
      this.eventEmitter.emit(TableEvents.SCROLL, newScrollLeft, newScrollTop);
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = false;
      }, 150);
    }
  }
  /** 更新所有 dropdown 位置（滚动时调用） */
  updateAllDropdownPositions() {
    if (this.state.dateDropdown) this.dropdownHandler.updateDateDropdownPosition();
    if (this.state.colorDropdown) this.dropdownHandler.updateColorDropdownPosition();
    if (this.state.buttonsDropdown) this.dropdownHandler.updateButtonsDropdownPosition();
    if (this.state.tooltip) this.tooltipHandler.updateTooltipPosition();
  }
  /**
   * 检查是否需要触发懒加载
   */
  checkLazyLoad(newScrollTop, deltaY) {
    if (!this.lazyLoadEnabled) return;
    if (this.isLoadingMore) return;
    if (!this.hasMoreData) return;
    if (deltaY <= 0) return;
    const rows = this.rows;
    if (rows.length === 0) return;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const viewportHeight = layoutInfo.viewportHeight;
    const headerHeight = layoutInfo.headerHeight;
    const totalContentHeight = layoutInfo.totalHeight - headerHeight;
    const scrollBottom = newScrollTop + viewportHeight - headerHeight;
    const distanceToBottom = totalContentHeight - scrollBottom;
    const lastRowHeight = this.layoutManager.getRowHeightByIndex(rows.length - 1);
    const rowsToBottom = Math.ceil(distanceToBottom / lastRowHeight);
    if (rowsToBottom <= this.lazyLoadThreshold) {
      this.isLoadingMore = true;
      this.eventEmitter.emit(TableEvents.LOAD_MORE, {
        startIndex: rows.length,
        scrollTop: newScrollTop,
        direction: "down"
      });
    }
  }
}
class FilterHandler extends BaseHandler {
  filterConfig;
  headerHandler;
  constructor(context, eventEmitter, filterConfig, headerHandler) {
    super(context, eventEmitter);
    this.filterConfig = filterConfig;
    this.headerHandler = headerHandler;
  }
  applyFilter() {
    if (!this.state.filterDropdown) return;
    const { columnKey, mode } = this.state.filterDropdown;
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }
    let filterValue = null;
    let hasFilter = false;
    switch (mode) {
      case "search": {
        const searchValue = this.state.filterDropdown.searchValue?.trim();
        if (searchValue) {
          filterValue = searchValue;
          hasFilter = true;
        }
        break;
      }
      case "select": {
        const options = this.state.filterDropdown.options;
        if (options) {
          const checkedOptions = options.filter((o) => o.checked);
          if (checkedOptions.length > 0 && checkedOptions.length < options.length) {
            filterValue = checkedOptions.map((o) => o.value);
            hasFilter = true;
          }
        }
        break;
      }
      case "range": {
        const minVal = this.state.filterDropdown.minValue;
        const maxVal = this.state.filterDropdown.maxValue;
        if (minVal !== "" || maxVal !== "") {
          filterValue = {
            min: minVal !== "" ? Number(minVal) : void 0,
            max: maxVal !== "" ? Number(maxVal) : void 0
          };
          hasFilter = true;
        }
        break;
      }
      case "dateRange": {
        const startDate = this.state.filterDropdown.startDate;
        const endDate = this.state.filterDropdown.endDate;
        if (startDate || endDate) {
          filterValue = {
            start: startDate,
            end: endDate
          };
          hasFilter = true;
        }
        break;
      }
      case "boolean": {
        const boolValue = this.state.filterDropdown.boolValue;
        if (boolValue !== "all") {
          filterValue = boolValue;
          hasFilter = true;
        }
        break;
      }
    }
    if (hasFilter) {
      this.filterConfig.push({
        column: columnKey,
        operator: this.getOperatorByMode(mode),
        value: filterValue
      });
    }
    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }
  clearFilter() {
    if (!this.state.filterDropdown) return;
    const { columnKey } = this.state.filterDropdown;
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }
    this.headerHandler.updateFilterConfig(this.filterConfig);
    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }
  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue() {
    if (!this.state.filterDropdown) return;
    const { columnKey } = this.state.filterDropdown;
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
      this.headerHandler.updateFilterConfig(this.filterConfig);
      this.dataManager.filter(this.filterConfig);
      this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    }
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }
  /**
   * 处理筛选下拉框的搜索输入
   * 用于延迟加载模式下的选项搜索
   */
  handleFilterDropdownSearch(searchText) {
    if (!this.state.filterDropdown) return;
    const { mode, columnKey } = this.state.filterDropdown;
    if (mode === "select") {
      this.state.filterDropdown.searchText = searchText;
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns.find((col) => col.key === columnKey);
      if (!column) return;
      const rowsToUse = this.allRows.length > 0 ? this.allRows : this.rows;
      if (searchText.trim()) {
        const matchedOptions = searchFilterOptions(column, rowsToUse, searchText);
        this.state.filterDropdown.options = matchedOptions.map((opt) => ({
          label: opt.label,
          value: opt.value,
          checked: false
        }));
        this.state.filterDropdown.isLoading = false;
      } else {
        const sampledOptions = getColumnFilterOptions(column, rowsToUse, 0);
        if (sampledOptions.length === 0 && rowsToUse.length > 0) {
          this.state.filterDropdown.isLoading = true;
          this.state.filterDropdown.options = void 0;
        } else {
          this.state.filterDropdown.options = sampledOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            checked: false
          }));
          this.state.filterDropdown.isLoading = false;
        }
      }
      this.state.filterDropdown.scrollTop = 0;
      this.state.filterDropdown.hoveredIndex = -1;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    } else if (mode === "search") {
      this.state.filterDropdown.searchValue = searchText;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    }
  }
  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(minValue, maxValue) {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "range") return;
    this.state.filterDropdown.minValue = minValue;
    this.state.filterDropdown.maxValue = maxValue;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }
  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(value) {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "boolean") return;
    this.state.filterDropdown.boolValue = value;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }
  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(startDate, endDate) {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "dateRange") return;
    this.state.filterDropdown.startDate = startDate;
    this.state.filterDropdown.endDate = endDate;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }
  /**
   * 根据筛选模式获取操作符
   */
  getOperatorByMode(mode) {
    switch (mode) {
      case "search":
        return "contains";
      case "select":
        return "in";
      case "range":
        return "between";
      case "dateRange":
        return "dateRange";
      case "boolean":
        return "equals";
      default:
        return "contains";
    }
  }
}
class InteractionManager {
  // 下拉菜单常量
  static DROPDOWN_ITEM_HEIGHT = 32;
  static DROPDOWN_MAX_VISIBLE = 8;
  // 图片编辑器常量 (用于 ImageHandler 和其他图片相关操作)
  static IMAGE_SIZE = 64;
  static IMAGE_PADDING = 8;
  static IMAGE_GAP = 8;
  static IMAGES_PER_ROW = 4;
  static IMAGE_UPLOAD_AREA_HEIGHT = 60;
  static IMAGE_MAX_ROWS = 3;
  state;
  scrollState;
  scrollbarState;
  layoutManager;
  eventEmitter;
  canvas;
  ctx;
  editingConfig;
  dataManager;
  sortConfig = [];
  filterConfig = [];
  expandColumnKey = null;
  isDestroyed = false;
  // Handler instances
  editingHandler;
  dropdownHandler;
  selectionHandler;
  navigationHandler;
  contextMenuHandler;
  imageHandler;
  headerHandler;
  controlClickHandler;
  buttonAnimationHandler;
  tooltipHandler;
  clipboardHandler;
  hoverHandler;
  wheelHandler;
  filterHandler;
  // Data accessors via DataManager
  get rows() {
    return this.dataManager.getRows();
  }
  resizeColumnIndex = -1;
  resizeStartX = 0;
  resizeStartWidth = 0;
  getScrollbarBounds = () => ({ vertical: null, horizontal: null });
  // 懒加载相关（状态由 WheelHandler 持有）
  rowHeightResizeEnabled = false;
  rowResizable = true;
  enableRowPinning = false;
  rowPinnable = true;
  locale;
  handlerContext = null;
  editorRegistry;
  jsxInteractiveRegions = [];
  /** 校验失败时阻止下拉关闭的回调（调用实际 validation hook） */
  shouldBlockDropdownClose = null;
  /** 校验失败时阻止关闭编辑态的回调（调用实际 commit/validation hook）
   * 接收 mousedown 事件以便在 DOM 编辑器场景下 preventDefault 阻止焦点转移 */
  shouldBlockEditingClose = null;
  constructor(canvas, layoutManager, dataManager, eventEmitter, _selectionConfig, editingConfig, locale = zhCN, editorRegistry) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.layoutManager = layoutManager;
    this.dataManager = dataManager;
    this.eventEmitter = eventEmitter;
    this.editingConfig = editingConfig;
    this.locale = locale;
    this.editorRegistry = editorRegistry;
    this.state = {
      hoveredCell: null,
      selectedCells: [],
      editingCell: null,
      editingValue: null,
      isSelecting: false,
      selectionStart: null,
      isDragging: false,
      dragType: null,
      dragTarget: null,
      tooltip: null,
      dropdown: null,
      filterDropdown: null,
      dateDropdown: null,
      colorDropdown: null,
      buttonsDropdown: null,
      imageTooltip: null,
      imageEditor: null,
      contextMenu: null,
      headerContextMenu: null,
      switchAnimations: /* @__PURE__ */ new Map(),
      buttonHoverStates: /* @__PURE__ */ new Map(),
      hoveredImageIndex: -1,
      hoveredButtonIndex: -1
    };
    this.scrollState = {
      scrollLeft: 0,
      scrollTop: 0,
      maxScrollLeft: 0,
      maxScrollTop: 0,
      isScrolling: false
    };
    this.scrollbarState = {
      verticalHovered: false,
      horizontalHovered: false,
      verticalDragging: false,
      horizontalDragging: false,
      dragStartY: 0,
      dragStartScrollTop: 0,
      dragStartX: 0,
      dragStartScrollLeft: 0
    };
    this.initHandlers();
    this.bindEvents();
  }
  /**
   * Initialize handler instances
   */
  initHandlers() {
    const context = {
      state: this.state,
      scrollState: this.scrollState,
      layoutManager: this.layoutManager,
      dataManager: this.dataManager,
      canvas: this.canvas,
      ctx: this.ctx,
      expandColumnKey: this.expandColumnKey,
      locale: this.locale,
      editorRegistry: this.editorRegistry,
      onDragStart: () => this.bindDocumentEvents(),
      onDragEnd: () => this.unbindDocumentEvents()
    };
    this.handlerContext = context;
    this.editingHandler = new EditingHandler(context, this.eventEmitter, this.editingConfig);
    this.dropdownHandler = new DropdownHandler(context, this.eventEmitter);
    this.selectionHandler = new SelectionHandler(context, this.eventEmitter);
    this.navigationHandler = new NavigationHandler(
      context,
      this.eventEmitter,
      this.selectionHandler,
      this.editingConfig
    );
    this.contextMenuHandler = new ContextMenuHandler(context, this.eventEmitter);
    this.imageHandler = new ImageHandler(context, this.eventEmitter);
    this.headerHandler = new HeaderHandler(
      context,
      this.eventEmitter,
      this.sortConfig,
      this.filterConfig
    );
    this.buttonAnimationHandler = new ButtonAnimationHandler(context, this.eventEmitter);
    this.controlClickHandler = new ControlClickHandler(
      context,
      this.eventEmitter,
      this.editingHandler,
      this.buttonAnimationHandler
    );
    this.tooltipHandler = new TooltipHandler(context, this.eventEmitter);
    this.clipboardHandler = new ClipboardHandler(context, this.eventEmitter, this.selectionHandler);
    this.hoverHandler = new HoverHandler(context, this.eventEmitter);
    this.wheelHandler = new WheelHandler(
      context,
      this.eventEmitter,
      this.dropdownHandler,
      this.imageHandler,
      this.tooltipHandler
    );
    this.filterHandler = new FilterHandler(
      context,
      this.eventEmitter,
      this.filterConfig,
      this.headerHandler
    );
  }
  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  getCellInfo(cell) {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) return null;
    return {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      row,
      column
    };
  }
  /**
   * 计算单元格在视口中的 X 坐标
   */
  getCellViewportX(cellPos, column) {
    return column?.fixed ? cellPos.x : cellPos.x - this.scrollState.scrollLeft;
  }
  getCellViewportY(rowIndex) {
    return this.layoutManager.getCellViewportY(rowIndex, this.scrollState.scrollTop);
  }
  /**
   * 获取规范化的选择范围
   */
  getNormalizedRange(range) {
    return {
      minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
      maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
      minCol: Math.min(range.start.columnIndex, range.end.columnIndex),
      maxCol: Math.max(range.start.columnIndex, range.end.columnIndex)
    };
  }
  bindEvents() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.addEventListener("dblclick", this.handleDblClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
    this.canvas.addEventListener("dragover", this.handleDragOver);
    this.canvas.addEventListener("dragleave", this.handleDragLeave);
    this.canvas.addEventListener("drop", this.handleDrop);
    document.addEventListener("keydown", this.handleKeyDown);
  }
  unbindEvents() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.removeEventListener("dblclick", this.handleDblClick);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
    this.canvas.removeEventListener("dragover", this.handleDragOver);
    this.canvas.removeEventListener("dragleave", this.handleDragLeave);
    this.canvas.removeEventListener("drop", this.handleDrop);
    document.removeEventListener("keydown", this.handleKeyDown);
  }
  bindDocumentEvents() {
    document.addEventListener("mousemove", this.handleDocumentMouseMove);
    document.addEventListener("mouseup", this.handleDocumentMouseUp);
  }
  unbindDocumentEvents() {
    document.removeEventListener("mousemove", this.handleDocumentMouseMove);
    document.removeEventListener("mouseup", this.handleDocumentMouseUp);
  }
  setGetScrollbarBounds(callback) {
    this.getScrollbarBounds = callback;
  }
  getScrollbarState() {
    return { ...this.scrollbarState };
  }
  handleMouseDown = async (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;
    if (this.state.contextMenu) {
      const menuClick = this.contextMenuHandler.handleContextMenuClick(e);
      if (menuClick) return;
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
      return;
    }
    if (this.state.headerContextMenu) {
      const menuClick = this.contextMenuHandler.handleHeaderContextMenuClick(e);
      if (menuClick) return;
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
      return;
    }
    if (this.state.filterDropdown) {
      const filterClick = this.dropdownHandler.handleFilterDropdownClick(e);
      if (filterClick) return;
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
      return;
    }
    if (this.state.dateDropdown) {
      const dateClick = this.dropdownHandler.handleDateDropdownClick(e);
      if (dateClick) return;
      if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose()) {
        return;
      }
      const dateCell = this.state.dateDropdown.cell;
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, dateCell);
      return;
    }
    if (this.state.colorDropdown) {
      const colorClick = this.dropdownHandler.handleColorDropdownClick(e);
      if (colorClick) return;
      if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose()) {
        return;
      }
      const colorCell = this.state.colorDropdown.cell;
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE, colorCell);
      return;
    }
    if (this.state.dropdown) {
      const dropdownClick = this.dropdownHandler.handleDropdownClick(e);
      if (dropdownClick) return;
      const dropdownCell = this.state.dropdown.cell;
      if (this.state.dropdown.source !== "jsx" && this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(dropdownCell)) {
        return;
      }
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, dropdownCell);
      return;
    }
    if (this.state.buttonsDropdown) {
      const dropdownClick = this.dropdownHandler.handleButtonsDropdownClick(e);
      if (dropdownClick) return;
      this.state.buttonsDropdown = null;
      return;
    }
    if (this.state.imageTooltip) {
      const dropdownClick = this.imageHandler.handleImageTooltipClick(e);
      if (dropdownClick) return;
      this.state.imageTooltip = null;
    }
    if (this.state.imageEditor) {
      const editorClick = this.imageHandler.handleImageEditorClick(e);
      if (editorClick === "upload") {
        this.triggerFileInput();
        return;
      }
      if (editorClick === "inside") {
        return;
      }
      this.imageHandler.commitImageEditorChanges();
      return;
    }
    const jsxRegion = this.getJSXInteractiveRegionAt(viewportX, viewportY);
    if (jsxRegion?.type === "dropdown") {
      const config = jsxRegion.props.config;
      if (config) {
        this.state.dropdown = {
          cell: {
            rowIndex: jsxRegion.rowIndex ?? -1,
            columnIndex: jsxRegion.colIndex ?? -1
          },
          config,
          x: jsxRegion.rect.x,
          y: jsxRegion.rect.y + jsxRegion.rect.height,
          width: jsxRegion.props.width ?? jsxRegion.rect.width,
          scrollTop: 0,
          hoveredIndex: -1,
          showAbove: jsxRegion.props.placement === "top",
          source: "jsx",
          onChange: jsxRegion.props.onChange,
          row: jsxRegion.row,
          column: jsxRegion.column,
          rowIndex: jsxRegion.rowIndex,
          colIndex: jsxRegion.colIndex
        };
        this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
        return;
      }
    }
    const hitResult = this.layoutManager.hitTest(viewportX, viewportY, this.getScrollbarBounds());
    switch (hitResult.region) {
      case "scrollbar-vertical":
        this.scrollbarState.verticalDragging = true;
        this.scrollbarState.dragStartY = e.clientY;
        this.scrollbarState.dragStartScrollTop = this.scrollState.scrollTop;
        this.canvas.style.cursor = "grabbing";
        this.bindDocumentEvents();
        return;
      case "scrollbar-horizontal":
        this.scrollbarState.horizontalDragging = true;
        this.scrollbarState.dragStartX = e.clientX;
        this.scrollbarState.dragStartScrollLeft = this.scrollState.scrollLeft;
        this.canvas.style.cursor = "grabbing";
        this.bindDocumentEvents();
        return;
      case "header":
        if (hitResult.isResizeHandle && hitResult.resizeColumnIndex !== void 0) {
          this.state.isDragging = true;
          this.state.dragType = "column-resize";
          this.resizeColumnIndex = hitResult.resizeColumnIndex;
          this.resizeStartX = e.clientX;
          this.resizeStartWidth = this.layoutManager.getColumnWidthByIndex(
            hitResult.resizeColumnIndex
          );
          this.canvas.style.cursor = "col-resize";
          return;
        }
        if (hitResult.headerCell) {
          const handled = this.headerHandler.handleHeaderMouseDown(
            hitResult.headerCell.colIndex ?? -1,
            e
          );
          if (!handled) {
            this.headerHandler.handleHeaderClick(hitResult.headerCell.colIndex ?? -1, e);
          }
        }
        return;
      case "cell":
        const hadEditingCell = !!this.state.editingCell;
        if (hadEditingCell && this.shouldBlockEditingClose && await this.shouldBlockEditingClose(e)) {
          return;
        }
        const wasInEditing = hadEditingCell;
        if (this.rowHeightResizeEnabled && hitResult.isRowResizeHandle && hitResult.resizeRowIndex !== void 0 && this.isRowResizable(hitResult.resizeRowIndex)) {
          const row = this.rows[hitResult.resizeRowIndex];
          if (!row) return;
          const startHeight = this.layoutManager.getRowHeightByIndex(hitResult.resizeRowIndex);
          this.state.isDragging = true;
          this.state.dragType = "row-resize";
          this.state.rowResizeState = {
            rowIndex: hitResult.resizeRowIndex,
            startY: e.clientY,
            startHeight,
            displayHeight: startHeight
          };
          this.canvas.style.cursor = "ns-resize";
          this.bindDocumentEvents();
          return;
        }
        if (hitResult.cell && this.handleControlClick(hitResult.cell, e)) {
          return;
        }
        if (hitResult.cell) {
          if (e.shiftKey && this.state.selectedCells.length > 0) {
            this.selectionHandler.handleRangeSelection(hitResult.cell);
          } else if (e.ctrlKey || e.metaKey) {
            this.selectionHandler.handleToggleSelection(hitResult.cell);
          } else {
            this.selectionHandler.handleSingleSelection(hitResult.cell);
            if (!wasInEditing) {
              this.state.isSelecting = true;
              this.state.selectionStart = hitResult.cell;
            }
          }
          const cellInfo = this.getCellInfo(hitResult.cell);
          if (cellInfo) {
            this.eventEmitter.emit(TableEvents.CELL_CLICK, cellInfo, e);
          }
        }
        return;
      case "outside":
        return;
    }
  };
  triggerFileInput() {
    if (!this.state.imageEditor) return;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[this.state.imageEditor.cell.columnIndex];
    if (!column) return;
    const row = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!row) return;
    const renderResult = column.render ? column.render(
      row.data[getColumnField(column)],
      row,
      column,
      this.state.imageEditor.cell.rowIndex
    ) : { image: row.data[getColumnField(column)] };
    const imageConfig = renderResult.image ?? {};
    const input = document.createElement("input");
    input.type = "file";
    input.accept = imageConfig.accept ?? "image/*";
    input.multiple = !this.state.imageEditor.isSingleImage && imageConfig.multiple !== false;
    input.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      await this.imageHandler.handleFileUpload(Array.from(files));
    };
    input.click();
  }
  handleDragOver = (e) => {
    this.imageHandler.handleDragOver(e);
  };
  handleDragLeave = (e) => {
    this.imageHandler.handleDragLeave(e);
  };
  handleDrop = async (e) => {
    await this.imageHandler.handleDrop(e);
  };
  handleContextMenu = async (e) => {
    e.preventDefault();
    if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose(e)) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;
    if (this.state.contextMenu) {
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
    }
    if (this.state.headerContextMenu) {
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
    }
    this.closeAllDropdowns();
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    if (viewportY <= headerHeight) {
      const headerCell = this.layoutManager.getHeaderCellAtPosition(viewportX, viewportY);
      if (headerCell) {
        const column = headerCell.column;
        if (column.hideable === false) return;
        const canvasRect2 = this.canvas.getBoundingClientRect();
        const menuWidth2 = 120;
        const menuHeight2 = 32;
        let menuX2 = viewportX;
        let menuY2 = viewportY;
        if (menuX2 + menuWidth2 > canvasRect2.width) {
          menuX2 = canvasRect2.width - menuWidth2 - 8;
        }
        if (menuX2 < 0) {
          menuX2 = 8;
        }
        if (menuY2 + menuHeight2 > canvasRect2.height) {
          menuY2 = canvasRect2.height - menuHeight2 - 8;
        }
        this.state.headerContextMenu = {
          x: menuX2,
          y: menuY2,
          columnKey: column.key,
          columnIndex: headerCell.colIndex,
          hoveredIndex: -1
        };
        this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_OPEN);
        return;
      }
      return;
    }
    const hit = this.layoutManager.getRowHitAtViewportPosition(
      viewportX,
      viewportY,
      this.scrollState.scrollTop
    );
    if (!hit) return;
    if (hit.band === "summary-top" || hit.band === "summary-bottom") return;
    const row = hit.row;
    const items = this.getRowContextMenuItems(row);
    const canvasRect = this.canvas.getBoundingClientRect();
    const menuWidth = 140;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const menuHeight = items.length * itemHeight;
    let menuX = viewportX;
    let menuY = viewportY;
    if (menuX + menuWidth > canvasRect.width) {
      menuX = canvasRect.width - menuWidth - 8;
    }
    if (menuX < 0) {
      menuX = 8;
    }
    if (menuY + menuHeight > canvasRect.height) {
      menuY = canvasRect.height - menuHeight - 8;
    }
    if (menuY < 0) {
      menuY = 8;
    }
    this.state.contextMenu = {
      x: menuX,
      y: menuY,
      row,
      hoveredIndex: -1,
      items
    };
    this.eventEmitter.emit(TableEvents.CONTEXT_MENU_OPEN);
  };
  getContextMenu() {
    return this.contextMenuHandler.getContextMenu();
  }
  getHeaderContextMenu() {
    return this.contextMenuHandler.getHeaderContextMenu();
  }
  handleDocumentMouseMove = (e) => {
    if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
      const { min, max } = this.layoutManager.getRowHeightBounds();
      const deltaY = e.clientY - this.state.rowResizeState.startY;
      this.state.rowResizeState.displayHeight = clamp(
        this.state.rowResizeState.startHeight + deltaY,
        min,
        max
      );
      this.eventEmitter.emit(TableEvents.ROW_RESIZE_DRAG);
      return;
    }
    if (this.state.filterDropdown?.isScrollbarDragging) {
      const { options, scrollbarDragStartY, scrollbarDragStartScrollTop } = this.state.filterDropdown;
      if (!options) return;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
      const visibleCount = Math.min(options.length, maxVisibleItems);
      const listHeight = visibleCount * itemHeight;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, listHeight / totalHeight * listHeight);
      const maxThumbY = listHeight - thumbHeight;
      const deltaY = e.clientY - (scrollbarDragStartY ?? 0);
      const scrollRatio = deltaY / maxThumbY;
      const maxScrollTop = totalHeight - listHeight;
      const newScrollTop = (scrollbarDragStartScrollTop ?? 0) + scrollRatio * maxScrollTop;
      this.state.filterDropdown.scrollTop = clamp(newScrollTop, 0, maxScrollTop);
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (this.scrollbarState.verticalDragging) {
      const layoutInfo = this.layoutManager.getLayoutInfo();
      const headerHeight = layoutInfo.headerHeight;
      const viewportHeight = this.canvas.height / (window.devicePixelRatio || 1);
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(30, viewportHeight / layoutInfo.totalHeight * trackHeight);
      const maxThumbY = trackHeight - thumbHeight;
      const deltaY = e.clientY - this.scrollbarState.dragStartY;
      const scrollRatio = deltaY / maxThumbY;
      const newScrollTop = this.scrollbarState.dragStartScrollTop + scrollRatio * this.scrollState.maxScrollTop;
      this.scrollState.scrollTop = clamp(newScrollTop, 0, this.scrollState.maxScrollTop);
      this.eventEmitter.emit(
        TableEvents.SCROLL,
        this.scrollState.scrollLeft,
        this.scrollState.scrollTop
      );
      return;
    }
    if (this.scrollbarState.horizontalDragging) {
      const layoutInfo = this.layoutManager.getLayoutInfo();
      const viewportWidth = this.canvas.width / (window.devicePixelRatio || 1);
      const thumbWidth = Math.max(30, viewportWidth / layoutInfo.totalWidth * viewportWidth);
      const maxThumbX = viewportWidth - thumbWidth;
      const deltaX = e.clientX - this.scrollbarState.dragStartX;
      const scrollRatio = deltaX / maxThumbX;
      const newScrollLeft = this.scrollbarState.dragStartScrollLeft + scrollRatio * this.scrollState.maxScrollLeft;
      this.scrollState.scrollLeft = clamp(newScrollLeft, 0, this.scrollState.maxScrollLeft);
      this.eventEmitter.emit(
        TableEvents.SCROLL,
        this.scrollState.scrollLeft,
        this.scrollState.scrollTop
      );
      return;
    }
  };
  handleDocumentMouseUp = () => {
    if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
      const { rowIndex, displayHeight } = this.state.rowResizeState;
      const row = this.rows[rowIndex];
      if (row) {
        this.eventEmitter.emit(TableEvents.ROW_HEIGHT_CHANGE, row, displayHeight, rowIndex);
      }
      this.state.isDragging = false;
      this.state.dragType = null;
      this.state.rowResizeState = void 0;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      return;
    }
    if (this.state.filterDropdown?.isScrollbarDragging) {
      this.state.filterDropdown.isScrollbarDragging = false;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      return;
    }
    if (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) {
      this.scrollbarState.verticalDragging = false;
      this.scrollbarState.horizontalDragging = false;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
    }
  };
  handleMouseMove = (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;
    if (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) {
      return;
    }
    if (this.state.contextMenu) {
      this.contextMenuHandler.handleContextMenuHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }
    if (this.state.headerContextMenu) {
      this.contextMenuHandler.handleHeaderContextMenuHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }
    if (this.state.dropdown) {
      this.dropdownHandler.handleDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }
    if (this.state.buttonsDropdown) {
      this.dropdownHandler.handleButtonsDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }
    if (this.state.imageTooltip) {
      const inDropdown = this.imageHandler.handleImageTooltipHover(e);
      if (inDropdown) {
        this.canvas.style.cursor = "pointer";
        return;
      }
      this.state.imageTooltip = null;
    }
    if (this.state.imageEditor) {
      const inEditor = this.imageHandler.handleImageEditorHover(e);
      if (inEditor) {
        const { y, hoveredIndex } = this.state.imageEditor;
        const uploadAreaHeight = 60;
        const viewportY2 = e.clientY - this.canvas.getBoundingClientRect().top;
        const inUploadArea = viewportY2 >= y && viewportY2 <= y + uploadAreaHeight;
        const onImage = hoveredIndex >= 0;
        this.canvas.style.cursor = inUploadArea || onImage ? "pointer" : "default";
        return;
      }
    }
    if (this.state.filterDropdown) {
      this.dropdownHandler.handleFilterDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }
    if (this.state.dateDropdown) {
      this.dropdownHandler.handleDateDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }
    if (this.state.colorDropdown) {
      this.dropdownHandler.handleColorDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }
    if (this.state.isDragging && this.state.dragType === "column-resize") {
      const column = this.layoutManager.getLeafColumn(this.resizeColumnIndex);
      if (column) {
        let deltaX = e.clientX - this.resizeStartX;
        if (column.fixed === "right") {
          deltaX = -deltaX;
        }
        const newWidth = Math.max(50, this.resizeStartWidth + deltaX);
        this.layoutManager.setColumnWidth(column.key, newWidth);
        this.eventEmitter.emit(TableEvents.COLUMN_RESIZE, column, newWidth);
      }
      return;
    }
    if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
      this.handleProgressDragMove(e);
      return;
    }
    if (this.state.columnReorderState && !this.state.isDragging) {
      const rect2 = this.canvas.getBoundingClientRect();
      const viewportX2 = e.clientX - rect2.left;
      const dragDistance = Math.abs(viewportX2 - this.state.columnReorderState.dragStartX);
      if (dragDistance > 5) {
        this.state.isDragging = true;
        this.state.dragType = "column-reorder";
        this.bindDocumentEvents();
      }
    }
    if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
      const rect2 = this.canvas.getBoundingClientRect();
      const viewportX2 = e.clientX - rect2.left;
      this.state.columnReorderState.currentX = viewportX2;
      const reorderState = this.state.columnReorderState;
      const siblingColumns = reorderState.siblingColumns;
      const dragSiblingIndex = reorderState.dragSiblingIndex;
      if (!siblingColumns || siblingColumns.length === 0) {
        this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
        return;
      }
      const now = Date.now();
      if (reorderState.lastSwapTime && now - reorderState.lastSwapTime < 50) {
        this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
        return;
      }
      let targetSiblingIndex = -1;
      let targetCenter = 0;
      for (let i = 0; i < siblingColumns.length; i++) {
        const sibling = siblingColumns[i];
        if (viewportX2 >= sibling.left && viewportX2 < sibling.right) {
          targetSiblingIndex = i;
          targetCenter = sibling.center;
          break;
        }
      }
      if (targetSiblingIndex === -1) {
        reorderState.lastSwapTargetKey = void 0;
      }
      if (targetSiblingIndex !== -1 && targetSiblingIndex !== dragSiblingIndex) {
        const dragSibling = siblingColumns[dragSiblingIndex];
        const targetSibling = siblingColumns[targetSiblingIndex];
        if (dragSibling && targetSibling) {
          if (reorderState.lastSwapTargetKey === targetSibling.key) {
            this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
            return;
          }
          let shouldSwap = false;
          const direction = targetSiblingIndex > dragSiblingIndex ? "right" : "left";
          if (direction === "right") {
            shouldSwap = viewportX2 >= targetCenter;
          } else {
            shouldSwap = viewportX2 < targetCenter;
          }
          if (shouldSwap) {
            this.eventEmitter.emit(TableEvents.COLUMN_SWAP, dragSibling.key, targetSibling.key);
            reorderState.lastSwapTime = now;
            reorderState.lastSwapTargetKey = void 0;
            const dragColumn = this.layoutManager.getColumnByKey(reorderState.dragColumnKey);
            if (dragColumn) {
              const newSiblingColumns = this.headerHandler.calculateSiblingColumns(dragColumn);
              const newDragSiblingIndex = newSiblingColumns.findIndex(
                (s) => s.key === reorderState.dragColumnKey
              );
              reorderState.siblingColumns = newSiblingColumns;
              reorderState.dragSiblingIndex = newDragSiblingIndex >= 0 ? newDragSiblingIndex : dragSiblingIndex;
              const newDragSibling = newSiblingColumns[reorderState.dragSiblingIndex];
              if (newDragSibling) {
                reorderState.dragColumnIndex = newDragSibling.firstLeafIndex;
              }
            }
          }
        }
      } else if (targetSiblingIndex === dragSiblingIndex) {
        reorderState.lastSwapTargetKey = void 0;
      }
      if (targetSiblingIndex !== -1) {
        const targetSibling = siblingColumns[targetSiblingIndex];
        if (targetSibling) {
          reorderState.targetColumnIndex = targetSibling.firstLeafIndex;
        }
      } else {
        const dragSibling = siblingColumns[dragSiblingIndex];
        if (dragSibling) {
          reorderState.targetColumnIndex = dragSibling.firstLeafIndex;
        }
      }
      this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
      return;
    }
    if (this.state.isSelecting && this.state.selectionStart) {
      const hitResult2 = this.layoutManager.hitTest(viewportX, viewportY, this.getScrollbarBounds());
      if (hitResult2.region === "cell" && hitResult2.cell && hitResult2.cell.rowIndex >= 0) {
        this.selectionHandler.handleRangeSelection(hitResult2.cell);
      }
      return;
    }
    const jsxRegion = this.getJSXInteractiveRegionAt(viewportX, viewportY);
    if (jsxRegion?.type === "dropdown") {
      this.canvas.style.cursor = "pointer";
      this.state.tooltip = null;
      return;
    }
    if (jsxRegion?.type === "tooltip") {
      this.canvas.style.cursor = "default";
      const text = String(jsxRegion.props.content ?? "");
      const previous = this.state.tooltip;
      const nextTooltip = {
        cell: {
          rowIndex: jsxRegion.rowIndex ?? -1,
          columnIndex: jsxRegion.colIndex ?? -1
        },
        x: jsxRegion.rect.x,
        y: jsxRegion.rect.y,
        width: jsxRegion.props.width ?? jsxRegion.rect.width,
        content: { type: "text", text }
      };
      this.state.tooltip = nextTooltip;
      const changed = !previous || previous.x !== nextTooltip.x || previous.y !== nextTooltip.y || previous.width !== nextTooltip.width || previous.content.type !== "text" || previous.content.text !== text;
      if (changed) {
        this.eventEmitter.emit(TableEvents.CELL_HOVER, null, e);
      }
      return;
    }
    const hitResult = this.layoutManager.hitTest(viewportX, viewportY, this.getScrollbarBounds());
    switch (hitResult.region) {
      case "scrollbar-vertical":
        this.scrollbarState.verticalHovered = true;
        this.scrollbarState.horizontalHovered = false;
        this.canvas.style.cursor = "grab";
        this.state.tooltip = null;
        return;
      case "scrollbar-horizontal":
        this.scrollbarState.horizontalHovered = true;
        this.scrollbarState.verticalHovered = false;
        this.canvas.style.cursor = "grab";
        this.state.tooltip = null;
        return;
    }
    this.scrollbarState.verticalHovered = false;
    this.scrollbarState.horizontalHovered = false;
    if (hitResult.region === "header") {
      if (hitResult.isResizeHandle) {
        this.canvas.style.cursor = "col-resize";
        this.state.tooltip = null;
        this.state.hoveredHeaderColumnKey = void 0;
        return;
      }
      if (hitResult.headerCell) {
        this.headerHandler.handleHeaderHover(hitResult.headerCell, viewportX, viewportY);
      }
      return;
    }
    if (hitResult.region === "cell" && hitResult.rowHit && (hitResult.rowHit.band === "summary-top" || hitResult.rowHit.band === "summary-bottom")) {
      this.canvas.style.cursor = "default";
      this.state.hoveredCell = null;
      this.tooltipHandler.checkSummaryTooltip(hitResult.rowHit);
      return;
    }
    if (hitResult.region === "cell" && hitResult.cell) {
      if (this.rowHeightResizeEnabled && hitResult.isRowResizeHandle && hitResult.resizeRowIndex !== void 0 && this.isRowResizable(hitResult.resizeRowIndex)) {
        this.canvas.style.cursor = "ns-resize";
        this.state.tooltip = null;
        return;
      }
      const cell = hitResult.cell;
      this.buttonAnimationHandler.updateButtonHoverState(cell, viewportX, viewportY);
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = cell.columnIndex >= 0 ? leafColumns[cell.columnIndex] : void 0;
      const row = cell.rowIndex >= 0 ? this.rows[cell.rowIndex] : void 0;
      const isDisabled = column && row ? resolveDisabled(column.disabled, row, column) : false;
      if (isDisabled) {
        this.canvas.style.cursor = "not-allowed";
      } else if (this.hoverHandler.isClickableElement(cell, viewportX, viewportY)) {
        this.canvas.style.cursor = "pointer";
      } else if (column && column.key.startsWith("__hidden_placeholder__")) {
        this.canvas.style.cursor = "pointer";
      } else {
        this.canvas.style.cursor = "default";
      }
      if (this.state.hoveredCell?.rowIndex !== cell.rowIndex || this.state.hoveredCell?.columnIndex !== cell.columnIndex) {
        this.state.hoveredCell = cell.rowIndex >= 0 ? cell : null;
        const cellInfo = this.state.hoveredCell ? this.getCellInfo(this.state.hoveredCell) : null;
        this.eventEmitter.emit(TableEvents.CELL_HOVER, cellInfo, e);
      }
      this.hoverHandler.updateImageHoverIndex(cell, viewportX, viewportY);
      this.hoverHandler.updateButtonsHoverIndex(cell, viewportX, viewportY);
      if (this.state.hoveredHeaderColumnKey !== void 0) {
        this.state.hoveredHeaderColumnKey = void 0;
        this.eventEmitter.emit(TableEvents.HEADER_HOVER, void 0);
      }
      this.checkTooltip(cell);
    }
  };
  clearAllButtonHoverStates() {
    this.buttonAnimationHandler.clearAllButtonHoverStates();
  }
  getButtonHoverStates = () => {
    return this.buttonAnimationHandler.getButtonHoverStates();
  };
  getHoveredImageIndex() {
    return this.state.hoveredImageIndex ?? -1;
  }
  getHoveredButtonIndex() {
    return this.state.hoveredButtonIndex ?? -1;
  }
  checkTooltip = (cell) => {
    this.tooltipHandler.checkTooltip(cell);
  };
  handleMouseUp = (_e) => {
    if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
      const { rowIndex, displayHeight } = this.state.rowResizeState;
      const row = this.rows[rowIndex];
      if (row) {
        this.eventEmitter.emit(TableEvents.ROW_HEIGHT_CHANGE, row, displayHeight, rowIndex);
      }
      this.state.isDragging = false;
      this.state.dragType = null;
      this.state.rowResizeState = void 0;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      return;
    }
    if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
      const { cell, displayValue } = this.state.progressDragState;
      this.state.isDragging = false;
      this.state.dragType = null;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      this.state.progressDragState.pendingValue = displayValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell), displayValue);
      return;
    }
    if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
      const { dragColumnIndex, targetColumnIndex } = this.state.columnReorderState;
      if (dragColumnIndex !== targetColumnIndex && targetColumnIndex >= 0) {
        this.eventEmitter.emit(TableEvents.COLUMN_REORDER, dragColumnIndex, targetColumnIndex);
      }
      this.state.isDragging = false;
      this.state.dragType = null;
      this.state.columnReorderState = void 0;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
      return;
    }
    if (this.state.columnReorderState && !this.state.isDragging) {
      this.state.columnReorderState = void 0;
      return;
    }
    if (this.state.isDragging) {
      this.state.isDragging = false;
      this.state.dragType = null;
      this.canvas.style.cursor = "default";
      return;
    }
    if (this.state.isSelecting) {
      this.state.isSelecting = false;
      this.state.selectionStart = null;
    }
  };
  handleMouseLeave = () => {
    const hadHoveredHeader = this.state.hoveredHeaderColumnKey !== void 0;
    this.state.hoveredCell = null;
    this.state.hoveredHeaderColumnKey = void 0;
    this.state.hoveredImageIndex = -1;
    this.state.hoveredButtonIndex = -1;
    this.state.isSelecting = false;
    this.state.selectionStart = null;
    this.state.columnReorderState = void 0;
    this.scrollbarState.verticalHovered = false;
    this.scrollbarState.horizontalHovered = false;
    this.clearAllButtonHoverStates();
    if (hadHoveredHeader) {
      this.eventEmitter.emit(TableEvents.HEADER_HOVER, void 0);
    }
  };
  handleDblClick = async (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;
    if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose(e)) {
      return;
    }
    if (this.state.dateDropdown) {
      const { x, y, width } = this.state.dateDropdown;
      const headerHeight = 40;
      const weekdayHeight = 28;
      const dayHeight = 28;
      const rowPadding = 8;
      const rows = 6;
      const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;
      if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
        return;
      }
      if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose()) {
        return;
      }
      const dateCell = this.state.dateDropdown.cell;
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, dateCell);
    }
    if (this.state.dropdown) {
      const { x, y, width, type, tagsConfig, config } = this.state.dropdown;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
      let optionsLength;
      if (type === "tags" && tagsConfig) {
        optionsLength = tagsConfig.options?.length ?? 0;
      } else {
        optionsLength = config.options.length;
      }
      const visibleCount = Math.min(optionsLength, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;
      if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
        return;
      }
      const dropdownCell = this.state.dropdown.cell;
      if (this.state.dropdown.source !== "jsx" && this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(dropdownCell)) {
        return;
      }
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, null);
    }
    if (this.state.filterDropdown) {
      const { x, y, width, mode, options } = this.state.filterDropdown;
      const padding = 8;
      const buttonHeight = 36;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
      let dropdownHeight;
      switch (mode) {
        case "search": {
          const inputHeight = 36;
          dropdownHeight = inputHeight + buttonHeight + padding;
          break;
        }
        case "select": {
          const searchHeight = 36;
          const visibleCount = Math.min(options?.length ?? 0, maxVisibleItems);
          const listHeight = visibleCount * itemHeight;
          dropdownHeight = searchHeight + listHeight + buttonHeight;
          break;
        }
        case "range": {
          const inputHeight = 32;
          const gap = 8;
          dropdownHeight = padding + inputHeight + gap + buttonHeight + padding;
          break;
        }
        case "boolean": {
          const boolItemHeight = 32;
          dropdownHeight = boolItemHeight * 3 + buttonHeight;
          break;
        }
        case "dateRange": {
          const inputHeight = 32;
          const gap = 8;
          dropdownHeight = padding + inputHeight + gap + buttonHeight + padding;
          break;
        }
        default:
          dropdownHeight = 200;
      }
      if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + dropdownHeight) {
        return;
      }
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }
    const cell = this.layoutManager.getCellAtViewportPosition(
      viewportX,
      viewportY,
      this.scrollState.scrollTop
    );
    if (!cell || cell.rowIndex < 0) return;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    const controlTypes = [
      CellTypes.CHECKBOX,
      CellTypes.RADIO,
      CellTypes.BUTTON,
      CellTypes.SWITCH,
      CellTypes.RATING
    ];
    if (column && row) {
      const renderResult = getRenderResult(column, row, cell.rowIndex);
      if (renderResult.type && controlTypes.includes(renderResult.type)) {
        return;
      }
      if (renderResult.type === CellTypes.PROGRESS && renderResult.progress) {
        if (renderResult.progress.interactive !== true) return;
        if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return;
        this.eventEmitter.emit(TableEvents.CELL_DBL_CLICK, this.getCellInfo(cell), e);
        this.eventEmitter.emit(TableEvents.ROW_DBL_CLICK, row, cell.rowIndex, e);
        if (this.editingConfig.enabled !== false) {
          this.startEditing(cell, {
            value: String(renderResult.progress.value),
            type: "number",
            placeholder: "0-100"
          });
        }
        return;
      }
      if (renderResult.type === CellTypes.COLOR && renderResult.color) {
        const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
        const cellViewportX = this.getCellViewportX(cellPos, column);
        const cellViewportY = this.getCellViewportY(cell.rowIndex);
        const padding = 8;
        const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
        const colorBoxX = cellViewportX + (cellPos.width - colorBoxSize) / 2;
        const colorBoxY = cellViewportY + (cellPos.height - colorBoxSize) / 2;
        const isOnColorBox = viewportX >= colorBoxX && viewportX <= colorBoxX + colorBoxSize && viewportY >= colorBoxY && viewportY <= colorBoxY + colorBoxSize;
        if (!isOnColorBox) return;
      }
      if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return;
      this.eventEmitter.emit(TableEvents.CELL_DBL_CLICK, this.getCellInfo(cell), e);
      this.eventEmitter.emit(TableEvents.ROW_DBL_CLICK, row, cell.rowIndex, e);
      if (this.editingConfig.enabled !== false) {
        const editConfig = this.getEditConfig(column, row, cell.rowIndex);
        if (editConfig) {
          if (editConfig.type === CellTypes.SELECT && editConfig.select) {
            this.startSelectEditing(cell, editConfig.select);
          } else if (editConfig.type === CellTypes.TAG && editConfig.tags) {
            this.startTagsEditing(cell, editConfig.tags);
          } else if (editConfig.type === CellTypes.DATE && editConfig.date) {
            this.startDateEditing(cell, editConfig.date);
          } else if (editConfig.type === CellTypes.COLOR && editConfig.color) {
            this.startColorEditing(cell, editConfig.color);
          } else if (editConfig.type === CellTypes.INPUT || !editConfig.type) {
            this.startEditing(cell, editConfig.input);
          } else {
            this.startEditing(cell, editConfig.input);
          }
        } else {
          if (renderResult.type === CellTypes.SELECT && renderResult.select) {
            this.startSelectEditing(cell, renderResult.select);
          } else if (renderResult.type === CellTypes.TAG && renderResult.tags && renderResult.tags.editable) {
            this.startTagsEditing(cell, renderResult.tags);
          } else if (renderResult.type === CellTypes.DATE && renderResult.date) {
            this.startDateEditing(cell, renderResult.date);
          } else if (renderResult.type === CellTypes.COLOR && renderResult.color) {
            this.startColorEditing(cell, renderResult.color);
          } else if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
            this.startImageEditing(cell, renderResult.image);
          } else {
            this.startEditing(cell, renderResult.input);
          }
        }
      }
    }
  };
  handleControlClick = (cell, e) => {
    return this.controlClickHandler.handleControlClick(cell, e);
  };
  handleProgressDragMove = (e) => {
    this.controlClickHandler.handleProgressDragMove(e);
  };
  handleWheel = (e) => {
    this.wheelHandler.handleWheel(e);
  };
  handleExternalWheel(deltaX, deltaY) {
    this.wheelHandler.handleExternalWheel(deltaX, deltaY);
  }
  handleKeyDown = async (e) => {
    if (this.state.editingCell) {
      this.handleEditingKeyDown(e);
      return;
    }
    if (this.state.dropdown) {
      if (e.key === "Escape") {
        const dropdownCell = this.state.dropdown.cell;
        this.state.dropdown = null;
        this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, dropdownCell);
      }
      return;
    }
    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        this.navigationHandler.handleArrowNavigation(e);
        break;
      case "Enter":
        this.handleEnterKey(e);
        break;
      case "Escape":
        this.selectionHandler.clearSelection();
        break;
      case "a":
      case "A":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.selectionHandler.selectAll();
        }
        break;
      case "c":
      case "C":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.copySelection();
        }
        break;
      case "z":
      case "Z":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.eventEmitter.emit(TableEvents.UNDO);
        }
        break;
      case "y":
      case "Y":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.eventEmitter.emit(TableEvents.REDO);
        }
        break;
      case " ":
        if (this.state.selectedCells.length > 0) {
          const cell = this.state.selectedCells[0].start;
          this.toggleRowExpand(cell.rowIndex);
        }
        break;
    }
  };
  handleEditingKeyDown(e) {
    if (!this.state.editingCell) return;
    if (this.isDomEditorActive?.()) {
      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = e.shiftKey ? -1 : 1;
        this.selectionHandler.moveSelection(0, nextCol);
      }
      return;
    }
    switch (e.key) {
      case "Enter":
        this.endEditing(true);
        break;
      case "Escape":
        this.endEditing(false);
        break;
      case "Tab":
        e.preventDefault();
        this.endEditing(true);
        const nextCol = e.shiftKey ? -1 : 1;
        this.selectionHandler.moveSelection(0, nextCol);
        break;
    }
  }
  handleEnterKey(e) {
    if (this.state.selectedCells.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    const cell = this.state.selectedCells[0].start;
    if (this.editingConfig.enabled !== false) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];
      const row = this.rows[cell.rowIndex];
      if (column && row) {
        const renderResult = getRenderResult(column, row, cell.rowIndex);
        const controlTypes = [
          CellTypes.CHECKBOX,
          CellTypes.RADIO,
          CellTypes.BUTTON,
          CellTypes.SWITCH,
          CellTypes.RATING,
          CellTypes.PROGRESS
        ];
        if (renderResult.type && controlTypes.includes(renderResult.type)) {
          if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
            if (this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) {
              this.eventEmitter.emit(
                TableEvents.SWITCH_CHANGE,
                this.getCellInfo(cell),
                !renderResult.switch.checked
              );
            }
            return;
          }
          this.toggleRowExpand(cell.rowIndex);
          return;
        }
        if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return;
        if (renderResult.input?.readonly) return;
        const editConfig = this.getEditConfig(column, row, cell.rowIndex);
        if (editConfig) {
          if (editConfig.type === CellTypes.SELECT && editConfig.select) {
            this.startSelectEditing(cell, editConfig.select);
            return;
          }
          if (editConfig.type === CellTypes.TAG && editConfig.tags) {
            this.startTagsEditing(cell, editConfig.tags);
            return;
          }
          if (editConfig.type === CellTypes.DATE && editConfig.date) {
            this.startDateEditing(cell, editConfig.date);
            return;
          }
          if (editConfig.type === CellTypes.COLOR && editConfig.color) {
            this.startColorEditing(cell, editConfig.color);
            return;
          }
          this.startEditing(cell, editConfig.input);
          return;
        }
        if (renderResult.type === CellTypes.SELECT && renderResult.select) {
          this.startSelectEditing(cell, renderResult.select);
          return;
        }
        if (renderResult.type === CellTypes.TAG && renderResult.tags && renderResult.tags.editable) {
          this.startTagsEditing(cell, renderResult.tags);
          return;
        }
        if (renderResult.type === CellTypes.DATE && renderResult.date) {
          this.startDateEditing(cell, renderResult.date);
          return;
        }
        if (renderResult.type === CellTypes.COLOR && renderResult.color) {
          this.startColorEditing(cell, renderResult.color);
          return;
        }
        if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
          this.startImageEditing(cell, renderResult.image);
          return;
        }
        this.startEditing(cell, renderResult.input);
      }
    } else {
      this.toggleRowExpand(cell.rowIndex);
    }
  }
  /**
   * 获取编辑配置
   * 优先级：editRender > render 返回的编辑配置 > null（走默认逻辑）
   */
  getEditConfig(column, row, rowIndex) {
    const value = row.data[getColumnField(column)];
    if (column.editRender) {
      try {
        const result = column.editRender(value, row, rowIndex);
        if (result) return result;
      } catch (error) {
        console.error("Error in editRender:", error);
      }
    }
    if (column.render) {
      try {
        const result = column.render(value, row, column, rowIndex);
        if (result && result.type && result.type !== CellTypes.CUSTOM && result.type !== CellTypes.BUTTON && result.type !== CellTypes.IMAGE && result.type !== CellTypes.PROGRESS && result.type !== CellTypes.LINK) {
          return {
            type: result.type,
            input: result.input,
            select: result.select,
            tags: result.tags,
            date: result.date,
            checkbox: result.checkbox,
            radio: result.radio,
            switch: result.switch
          };
        }
      } catch (error) {
        console.error("Error in render:", error);
      }
    }
    return null;
  }
  // === Editing methods - delegated to EditingHandler ===
  startEditing(cell, inputConfig) {
    this.editingHandler.startEditing(cell, inputConfig);
  }
  startSelectEditing(cell, selectConfig) {
    this.editingHandler.startSelectEditing(cell, selectConfig);
  }
  startTagsEditing(cell, tagsConfig) {
    this.editingHandler.startTagsEditing(cell, tagsConfig);
  }
  startDateEditing(cell, dateConfig) {
    this.editingHandler.startDateEditing(cell, dateConfig);
  }
  startColorEditing(cell, colorConfig) {
    this.editingHandler.startColorEditing(cell, colorConfig);
  }
  startImageEditing(cell, imageConfig) {
    this.editingHandler.startImageEditing(cell, imageConfig);
  }
  endEditing(save) {
    this.editingHandler.endEditing(save);
  }
  clearEditingState() {
    this.state.editingCell = null;
    this.state.editingValue = null;
  }
  /**
   * 清除进度条拖拽的临时显示值（提交完成后调用）
   *
   * 仅在「提交完成的值为拖拽结束时记录的最终值」时才清除，
   * 以避免拖拽过程中 mousedown 触发的提前提交（值不同）或在拖拽进行中误清除。
   *
   * @param cell 提交的单元格；仅当与当前拖拽单元格一致时才清除
   * @param value 提交完成的值；仅当与 pendingValue 一致时才清除
   */
  clearProgressDragState(cell, value) {
    const dragState = this.state.progressDragState;
    if (!dragState) return;
    if (this.state.isDragging && this.state.dragType === "progress-drag") return;
    if (cell && (dragState.cell.rowIndex !== cell.rowIndex || dragState.cell.columnIndex !== cell.columnIndex)) {
      return;
    }
    if (dragState.pendingValue === void 0 || dragState.pendingValue !== value) return;
    this.state.progressDragState = void 0;
  }
  isEditing() {
    return this.state.editingCell !== null;
  }
  getDropdown() {
    return this.state.dropdown;
  }
  setJSXInteractiveRegions(regions) {
    this.jsxInteractiveRegions = regions;
  }
  getJSXInteractiveRegionAt(x, y) {
    for (let i = this.jsxInteractiveRegions.length - 1; i >= 0; i--) {
      const region = this.jsxInteractiveRegions[i];
      const rect = region.rect;
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return region;
      }
    }
    return void 0;
  }
  toggleRowExpand(rowIndex) {
    const row = this.rows[rowIndex];
    if (!row || !row.children) return;
    row.expanded = !row.expanded;
    this.eventEmitter.emit(TableEvents.EXPAND, row, rowIndex, row.expanded);
  }
  clearSelection() {
    this.selectionHandler.clearSelection();
  }
  resetState() {
    this.state.selectedCells = [];
    this.state.editingCell = null;
    this.state.editingValue = null;
    this.state.hoveredCell = null;
    this.state.isSelecting = false;
    this.state.selectionStart = null;
    this.state.isDragging = false;
    this.state.dragType = null;
    this.state.rowResizeState = void 0;
    this.state.dragTarget = null;
    this.state.progressDragState = void 0;
    this.state.tooltip = null;
    this.closeAllDropdowns();
    this.sortConfig = [];
    this.filterConfig = [];
    this.state.switchAnimations.clear();
    this.state.buttonHoverStates.clear();
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, []);
  }
  // ==================== Dropdown 公共方法 ====================
  /** 关闭 select/tags dropdown（公开方法，供 CanvasTable 在校验成功后调用） */
  closeSelectDropdown() {
    this.closeDropdown();
  }
  /** 关闭 select/tags dropdown */
  closeDropdown() {
    if (this.state.dropdown) {
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, null);
    }
  }
  /** 关闭 filter dropdown */
  closeFilterDropdown() {
    if (this.state.filterDropdown) {
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }
  }
  /** 关闭 date dropdown（programmatic，非用户取消） */
  closeDateDropdown() {
    if (this.state.dateDropdown) {
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, null);
    }
  }
  /** 关闭 color dropdown（programmatic，非用户取消） */
  closeColorDropdown() {
    if (this.state.colorDropdown) {
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE, null);
    }
  }
  /** 关闭 buttons dropdown */
  closeButtonsDropdown() {
    if (this.state.buttonsDropdown) {
      this.state.buttonsDropdown = null;
    }
  }
  /** 关闭所有 dropdown */
  closeAllDropdowns() {
    this.closeDropdown();
    this.closeFilterDropdown();
    this.closeDateDropdown();
    this.closeColorDropdown();
    this.closeButtonsDropdown();
  }
  // ==================== End Dropdown 公共方法 ====================
  copySelection() {
    void this.clipboardHandler.copySelection();
  }
  setScrollPosition(scrollLeft, scrollTop) {
    this.scrollState.scrollLeft = clamp(scrollLeft, 0, this.scrollState.maxScrollLeft);
    this.scrollState.scrollTop = clamp(scrollTop, 0, this.scrollState.maxScrollTop);
    this.eventEmitter.emit(
      TableEvents.SCROLL,
      this.scrollState.scrollLeft,
      this.scrollState.scrollTop
    );
  }
  updateMaxScroll(maxScrollLeft, maxScrollTop) {
    this.scrollState.maxScrollLeft = maxScrollLeft;
    this.scrollState.maxScrollTop = maxScrollTop;
  }
  setSortConfig(config) {
    this.sortConfig = config;
    this.headerHandler.updateSortConfig(config);
  }
  setFilterConfig(config) {
    this.filterConfig.length = 0;
    this.filterConfig.push(...config);
    this.headerHandler.updateFilterConfig(this.filterConfig);
  }
  setExpandColumnKey(key) {
    this.expandColumnKey = key;
    if (this.handlerContext) {
      this.handlerContext.expandColumnKey = key;
    }
  }
  setLazyLoadConfig(enabled, threshold = 5) {
    this.wheelHandler.setLazyLoadConfig(enabled, threshold);
  }
  setLoadingMore(loading) {
    this.wheelHandler.setLoadingMore(loading);
  }
  /**
   * 设置是否还有更多数据
   * @param hasMore 是否还有更多数据，false 表示加载完成
   */
  setHasMore(hasMore) {
    this.wheelHandler.setHasMore(hasMore);
  }
  getFilterDropdown() {
    return this.state.filterDropdown;
  }
  getDateDropdown() {
    return this.state.dateDropdown;
  }
  getColorDropdown() {
    return this.state.colorDropdown;
  }
  getButtonsDropdown() {
    return this.state.buttonsDropdown;
  }
  getImageTooltip() {
    return this.state.imageTooltip;
  }
  getImageEditor() {
    return this.state.imageEditor;
  }
  applyFilter() {
    this.filterHandler.applyFilter();
  }
  clearFilter() {
    this.filterHandler.clearFilter();
  }
  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue() {
    this.filterHandler.resetFilterValue();
  }
  /**
   * 处理筛选下拉框的搜索输入
   * 用于延迟加载模式下的选项搜索
   */
  handleFilterDropdownSearch(searchText) {
    this.filterHandler.handleFilterDropdownSearch(searchText);
  }
  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(minValue, maxValue) {
    this.filterHandler.handleFilterDropdownRangeUpdate(minValue, maxValue);
  }
  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(value) {
    this.filterHandler.handleFilterDropdownBooleanUpdate(value);
  }
  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(startDate, endDate) {
    this.filterHandler.handleFilterDropdownDateRangeUpdate(startDate, endDate);
  }
  getScrollState() {
    return { ...this.scrollState };
  }
  getInteractionState() {
    return { ...this.state };
  }
  getSelectedCells() {
    const cells = [];
    for (const range of this.state.selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({ rowIndex: row, columnIndex: col });
        }
      }
    }
    return cells;
  }
  getSelectedRows() {
    const rows = /* @__PURE__ */ new Set();
    for (const range of this.state.selectedCells) {
      const { minRow, maxRow } = this.getNormalizedRange(range);
      for (let row = minRow; row <= maxRow; row++) {
        rows.add(row);
      }
    }
    return Array.from(rows);
  }
  setSelectedCells(cells) {
    this.state.selectedCells = cells.map((cell) => ({
      start: cell,
      end: cell
    }));
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  updateConfig(_selection, editing) {
    this.editingConfig = editing;
  }
  setRowHeightResizeEnabled(enabled) {
    this.rowHeightResizeEnabled = enabled;
  }
  setShouldBlockDropdownClose(callback) {
    this.shouldBlockDropdownClose = callback;
  }
  /** 设置 DOM 编辑器活跃状态检查回调，用于避免 keydown 重复触发 endEditing */
  isDomEditorActive = null;
  setDomEditorActiveChecker(checker) {
    this.isDomEditorActive = checker;
  }
  setShouldBlockEditingClose(callback) {
    this.shouldBlockEditingClose = callback;
  }
  setRowResizable(resizable) {
    this.rowResizable = resizable ?? true;
  }
  setRowPinningEnabled(enabled) {
    this.enableRowPinning = enabled;
  }
  setRowPinnable(pinnable) {
    this.rowPinnable = pinnable ?? true;
  }
  setLocale(locale) {
    this.locale = locale;
    if (this.handlerContext) {
      this.handlerContext.locale = locale;
    }
  }
  isRowPinnable(row) {
    if (typeof this.rowPinnable === "function") {
      return this.rowPinnable(row);
    }
    return this.rowPinnable;
  }
  getRowContextMenuItems(row) {
    const items = [];
    const pinPosition = this.layoutManager.getRowPinPosition(row);
    if (this.enableRowPinning && this.isRowPinnable(row)) {
      if (pinPosition !== "top") {
        items.push({ key: "pin-top", text: this.locale.contextMenu.pinTop });
      }
      if (pinPosition !== "bottom") {
        items.push({ key: "pin-bottom", text: this.locale.contextMenu.pinBottom });
      }
      if (pinPosition) {
        items.push({ key: "unpin", text: this.locale.contextMenu.unpin });
      }
    }
    items.push(
      { key: "add-above", text: this.locale.contextMenu.addRowAbove },
      { key: "add-below", text: this.locale.contextMenu.addRowBelow },
      { key: "delete", text: this.locale.contextMenu.deleteRow, danger: true }
    );
    return items;
  }
  isRowResizable(rowIndex) {
    if (this.rowResizable === false) {
      return false;
    }
    if (this.rowResizable === true) {
      return true;
    }
    const row = this.rows[rowIndex];
    return row ? this.rowResizable(row, rowIndex) : false;
  }
  getSwitchAnimations = () => {
    return this.buttonAnimationHandler.getSwitchAnimations();
  };
  destroy() {
    this.isDestroyed = true;
    this.wheelHandler.destroy();
    this.unbindEvents();
    this.unbindDocumentEvents();
    this.buttonAnimationHandler.setDestroyed(true);
    this.buttonAnimationHandler.clearAllAnimations();
  }
}
class EditorManager {
  wrapper;
  layoutManager;
  eventEmitter;
  theme;
  locale;
  getRows;
  inputElement = null;
  editingCell = null;
  scrollLeft = 0;
  scrollTop = 0;
  onScrollCallback = null;
  beforeCommitCallback = null;
  cancelCallback = null;
  wheelHandler = null;
  /** 当 shouldBlockEditingClose 路径已处理提交时，跳过后续的 handleBlur */
  skipNextBlur = false;
  placeholderStyle = null;
  scrollbarStyle = null;
  constructor(wrapper, _canvas, layoutManager, eventEmitter, theme, locale, getRows) {
    this.wrapper = wrapper;
    this.layoutManager = layoutManager;
    this.eventEmitter = eventEmitter;
    this.theme = theme;
    this.locale = locale;
    this.getRows = getRows;
  }
  setLocale(locale) {
    this.locale = locale;
  }
  setOnScrollCallback(callback) {
    this.onScrollCallback = callback;
  }
  setBeforeCommitCallback(callback) {
    this.beforeCommitCallback = callback;
  }
  setCancelCallback(callback) {
    this.cancelCallback = callback;
  }
  /** 标记下一次 blur 事件应被跳过（由 shouldBlockEditingClose 路径已处理提交） */
  markSkipNextBlur() {
    this.skipNextBlur = true;
  }
  setTheme(theme) {
    this.theme = theme;
  }
  setScroll(scrollLeft, scrollTop) {
    this.scrollLeft = scrollLeft;
    this.scrollTop = scrollTop;
  }
  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  getCellInfo(cell) {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const rows = this.getRows();
    const row = rows[cell.rowIndex];
    if (!column || !row) return null;
    return {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      row,
      column
    };
  }
  async startEditing(cell, config) {
    if (this.inputElement) {
      const committed = await this.endEditing(true);
      if (!committed && this.inputElement) {
        return false;
      }
    }
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const rows = this.getRows();
    const row = rows[cell.rowIndex];
    if (!column || !row) return false;
    this.editingCell = cell;
    const merge = this.layoutManager.getCellMerge(cell.rowIndex, cell.columnIndex);
    let cellPos;
    const viewportRowIndex = merge ? merge.rowIndex : cell.rowIndex;
    if (merge) {
      cellPos = this.layoutManager.getMergedCellPosition(merge.rowIndex, merge.columnIndex);
    } else {
      cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    }
    let cellViewportX;
    if (column.fixed === "left") {
      cellViewportX = cellPos.x;
    } else if (column.fixed === "right") {
      cellViewportX = cellPos.x;
    } else {
      cellViewportX = cellPos.x - this.scrollLeft;
    }
    const cellViewportY = this.layoutManager.getCellViewportY(viewportRowIndex, this.scrollTop);
    const inputX = cellViewportX - 1;
    const inputY = cellViewportY - 1;
    const inputWidth = cellPos.width + 2;
    const lineHeight = 14 * 1.5;
    const padding = 8;
    const isMultiline = config?.multiline ?? false;
    if (isMultiline) {
      const autoMaxRows = Math.max(1, Math.floor((cellPos.height - padding * 2) / lineHeight));
      const maxRows = Math.min(config?.maxRows ?? autoMaxRows, autoMaxRows);
      const maxHeight = lineHeight * maxRows + padding * 2;
      const inputHeight = Math.min(cellPos.height + 2, maxHeight + 2);
      this.inputElement = document.createElement("textarea");
      const cellValue = String(row.data[getColumnField(column)] ?? "");
      this.inputElement.value = config?.value !== void 0 ? config.value : cellValue;
      this.inputElement.placeholder = config?.placeholder ?? "";
      this.inputElement.disabled = resolveDisabled(column.disabled, row, column);
      this.inputElement.readOnly = config?.readonly ?? false;
      this.inputElement.style.cssText = `
        position: absolute;
        left: ${inputX}px;
        top: ${inputY}px;
        width: ${inputWidth}px;
        height: ${inputHeight}px;
        padding: 4px 8px;
        border: 2px solid ${this.theme.colors.selectionBorder};
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${this.theme.colors.input.background};
        color: ${this.theme.colors.input.text};
        outline: none;
        box-sizing: border-box;
        z-index: 1000;
        resize: none;
        line-height: 1.5;
        max-height: ${maxHeight}px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      const scrollbarStyle = document.createElement("style");
      scrollbarStyle.textContent = `
        .canvas-table-editor-textarea::-webkit-scrollbar {
          width: 6px;
        }
        .canvas-table-editor-textarea::-webkit-scrollbar-track {
          background: ${this.theme.colors.scrollbar.track};
          border-radius: 3px;
        }
        .canvas-table-editor-textarea::-webkit-scrollbar-thumb {
          background: ${this.theme.colors.scrollbar.thumb};
          border-radius: 3px;
        }
        .canvas-table-editor-textarea::-webkit-scrollbar-thumb:hover {
          background: ${this.theme.colors.scrollbar.thumbHover};
        }
      `;
      document.head.appendChild(scrollbarStyle);
      this.inputElement.className = "canvas-table-editor-textarea";
      this.scrollbarStyle = scrollbarStyle;
      const placeholderStyle = document.createElement("style");
      placeholderStyle.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `;
      document.head.appendChild(placeholderStyle);
      this.placeholderStyle = placeholderStyle;
      this.wrapper.appendChild(this.inputElement);
      const adjustHeight = () => {
        if (!this.inputElement) return;
        const textarea = this.inputElement;
        const scrollTop = textarea.scrollTop;
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        const minHeight = inputHeight;
        const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
        textarea.style.height = `${newHeight}px`;
        textarea.scrollTop = scrollTop;
      };
      this.inputElement.addEventListener("input", adjustHeight);
      requestAnimationFrame(() => {
        adjustHeight();
      });
      this.wheelHandler = (e) => {
        if (this.inputElement && e.target === this.inputElement) {
          const target = this.inputElement;
          const atTop = target.scrollTop === 0;
          const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
          const scrollingUp = e.deltaY < 0;
          const scrollingDown = e.deltaY > 0;
          if (atTop && scrollingUp || atBottom && scrollingDown) {
            e.preventDefault();
          }
          e.stopPropagation();
        }
      };
      document.addEventListener("wheel", this.wheelHandler, { capture: true, passive: false });
      adjustHeight();
    } else {
      const inputHeight = cellPos.height + 2;
      this.inputElement = document.createElement("input");
      this.inputElement.type = config?.type ?? "text";
      const cellValue = String(row.data[getColumnField(column)] ?? "");
      this.inputElement.value = config?.value !== void 0 ? config.value : cellValue;
      this.inputElement.placeholder = config?.placeholder ?? "";
      this.inputElement.disabled = resolveDisabled(column.disabled, row, column);
      this.inputElement.readOnly = config?.readonly ?? false;
      this.inputElement.style.cssText = `
        position: absolute;
        left: ${inputX}px;
        top: ${inputY}px;
        width: ${inputWidth}px;
        height: ${inputHeight}px;
        padding: 0 8px;
        border: 2px solid ${this.theme.colors.selectionBorder};
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${this.theme.colors.input.background};
        color: ${this.theme.colors.input.text};
        outline: none;
        box-sizing: border-box;
        z-index: 1000;
      `;
      const placeholderStyle = document.createElement("style");
      placeholderStyle.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `;
      document.head.appendChild(placeholderStyle);
      this.placeholderStyle = placeholderStyle;
      this.wrapper.appendChild(this.inputElement);
    }
    this.inputElement.addEventListener("blur", this.handleBlur);
    this.inputElement.addEventListener("keydown", this.handleKeyDown);
    this.inputElement.addEventListener("wheel", this.handleInputWheel, { passive: false });
    requestAnimationFrame(() => {
      if (this.inputElement) {
        this.inputElement.focus();
        this.inputElement.select();
      }
    });
    return true;
  }
  async endEditing(save) {
    const cell = this.editingCell;
    let value = null;
    if (this.inputElement) {
      value = this.inputElement.value;
      if (save && cell && this.beforeCommitCallback) {
        const result = this.beforeCommitCallback(cell, value);
        if (isPromise(result)) {
          this.setLoadingState(true);
        }
        const commitAllowed = isPromise(result) ? await result : result;
        this.setLoadingState(false);
        if (!commitAllowed) {
          this.applyValidationStyle("error");
          requestAnimationFrame(() => {
            this.inputElement?.focus();
          });
          return false;
        }
      }
      if (!save && cell) {
        this.cancelCallback?.(cell);
      }
      this.destroyInputElement();
    }
    if (save && cell) {
      this.eventEmitter.emit(TableEvents.EDIT_END, this.getCellInfo(cell), value);
    }
    this.editingCell = null;
    return true;
  }
  isEditing() {
    return this.inputElement !== null;
  }
  getEditingCell() {
    return this.editingCell;
  }
  updatePosition() {
    if (this.inputElement && this.editingCell) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[this.editingCell.columnIndex];
      if (!column) return;
      const merge = this.layoutManager.getCellMerge(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex
      );
      const viewportRowIndex = merge ? merge.rowIndex : this.editingCell.rowIndex;
      const cellPos = merge ? this.layoutManager.getMergedCellPosition(merge.rowIndex, merge.columnIndex) : this.layoutManager.getCellPosition(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex
      );
      let cellViewportX;
      if (column.fixed === "left") {
        cellViewportX = cellPos.x;
      } else if (column.fixed === "right") {
        cellViewportX = cellPos.x;
      } else {
        cellViewportX = cellPos.x - this.scrollLeft;
      }
      const cellViewportY = this.layoutManager.getCellViewportY(viewportRowIndex, this.scrollTop);
      this.inputElement.style.left = `${cellViewportX - 1}px`;
      this.inputElement.style.top = `${cellViewportY - 1}px`;
    }
  }
  handleBlur = async () => {
    if (this.skipNextBlur) {
      this.skipNextBlur = false;
      return;
    }
    await this.endEditing(true);
  };
  handleKeyDown = async (e) => {
    const keyEvent = e;
    const isTextarea = this.inputElement?.tagName === "TEXTAREA";
    if (keyEvent.key === "Enter" && !isTextarea) {
      keyEvent.preventDefault();
      await this.endEditing(true);
    } else if (keyEvent.key === "Enter" && isTextarea && (keyEvent.ctrlKey || keyEvent.metaKey)) {
      keyEvent.preventDefault();
      await this.endEditing(true);
    } else if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      await this.endEditing(false);
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyEvent.key)) {
      e.stopPropagation();
    }
  };
  handleInputWheel = (e) => {
    const wheelEvent = e;
    wheelEvent.preventDefault();
    if (this.onScrollCallback) {
      this.onScrollCallback(wheelEvent.deltaX, wheelEvent.deltaY);
    }
  };
  applyValidationStyle(level) {
    if (!this.inputElement) return;
    const borderColor = level === "error" ? this.theme.colors.tagColors.error ?? "#ff4d4f" : this.theme.colors.selectionBorder;
    this.inputElement.style.border = `2px solid ${borderColor}`;
  }
  setLoadingState(loading) {
    if (!this.inputElement) return;
    if (loading) {
      this.inputElement.disabled = true;
      this.inputElement.style.opacity = "0.6";
      this.inputElement.style.cursor = "wait";
    } else {
      this.inputElement.disabled = false;
      this.inputElement.style.opacity = "";
      this.inputElement.style.cursor = "";
    }
  }
  destroyInputElement() {
    if (this.inputElement) {
      this.inputElement.removeEventListener("blur", this.handleBlur);
      this.inputElement.removeEventListener("keydown", this.handleKeyDown);
      this.inputElement.removeEventListener("wheel", this.handleInputWheel);
      this.inputElement.remove();
      this.inputElement = null;
    }
    if (this.wheelHandler) {
      document.removeEventListener("wheel", this.wheelHandler, { capture: true });
      this.wheelHandler = null;
    }
    if (this.placeholderStyle) {
      this.placeholderStyle.remove();
      this.placeholderStyle = null;
    }
    if (this.scrollbarStyle) {
      this.scrollbarStyle.remove();
      this.scrollbarStyle = null;
    }
  }
  destroy() {
    this.destroyInputElement();
    this.editingCell = null;
  }
}
class FilterInputManager {
  wrapper;
  eventEmitter;
  theme;
  locale;
  // 输入元素
  searchInput = null;
  minInput = null;
  maxInput = null;
  currentMode = null;
  currentColumnKey = null;
  onInputChange = null;
  // 标记是否正在从外部更新，避免触发 input 事件导致循环
  isUpdatingFromExternal = false;
  constructor(wrapper, eventEmitter, theme, locale = zhCN) {
    this.wrapper = wrapper;
    this.eventEmitter = eventEmitter;
    this.theme = theme;
    this.locale = locale;
  }
  setTheme(theme) {
    this.theme = theme;
  }
  setLocale(locale) {
    this.locale = locale;
    this.updatePlaceholders();
  }
  updatePlaceholders() {
    if (this.searchInput) {
      this.searchInput.placeholder = this.currentMode === "select" ? this.locale.filter.selectSearchPlaceholder : this.locale.filter.searchPlaceholder;
    }
    if (this.minInput) {
      this.minInput.placeholder = this.locale.filter.minPlaceholder;
    }
    if (this.maxInput) {
      this.maxInput.placeholder = this.locale.filter.maxPlaceholder;
    }
  }
  setOnInputChange(callback) {
    this.onInputChange = callback;
  }
  /**
   * 更新筛选下拉框状态并创建/更新输入框
   */
  updateFilterDropdown(filterDropdown) {
    if (!filterDropdown) {
      this.removeInputs();
      this.currentMode = null;
      this.currentColumnKey = null;
      return;
    }
    const { mode, columnKey } = filterDropdown;
    const needRecreate = this.currentMode !== mode || this.currentColumnKey !== columnKey;
    if (needRecreate) {
      this.removeInputs();
      this.currentMode = mode;
      this.currentColumnKey = columnKey;
      switch (mode) {
        case "search":
          this.createSearchInput(filterDropdown);
          break;
        case "select":
          this.createSelectSearchInput(filterDropdown);
          break;
        case "range":
          this.createRangeInputs(filterDropdown);
          break;
      }
    } else {
      this.updatePositions(filterDropdown);
      this.forceUpdateValues(filterDropdown);
    }
  }
  /**
   * 更新输入框位置和值（不重新创建）
   */
  updatePositions(filterDropdown) {
    const { x, y, width } = filterDropdown;
    const padding = 8;
    this.isUpdatingFromExternal = true;
    switch (filterDropdown.mode) {
      case "search": {
        const inputX = x + padding;
        const inputY = y + padding;
        const inputWidth = width - padding * 2;
        if (this.searchInput) {
          this.searchInput.style.left = `${inputX}px`;
          this.searchInput.style.top = `${inputY}px`;
          this.searchInput.style.width = `${inputWidth}px`;
          if (document.activeElement !== this.searchInput) {
            const newValue = filterDropdown.searchValue ?? "";
            if (this.searchInput.value !== newValue) {
              this.searchInput.value = newValue;
            }
          }
        }
        break;
      }
      case "select": {
        const inputX = x + padding;
        const inputY = y + padding;
        const inputWidth = width - padding * 2;
        if (this.searchInput) {
          this.searchInput.style.left = `${inputX}px`;
          this.searchInput.style.top = `${inputY}px`;
          this.searchInput.style.width = `${inputWidth}px`;
          if (document.activeElement !== this.searchInput) {
            const newValue = filterDropdown.searchText ?? "";
            if (this.searchInput.value !== newValue) {
              this.searchInput.value = newValue;
            }
          }
        }
        break;
      }
      case "range": {
        const gap = 8;
        const inputWidth = (width - padding * 3) / 2;
        const inputY = y + padding;
        if (this.minInput) {
          this.minInput.style.left = `${x + padding}px`;
          this.minInput.style.top = `${inputY}px`;
          this.minInput.style.width = `${inputWidth}px`;
          if (document.activeElement !== this.minInput) {
            const newMinValue = filterDropdown.minValue !== void 0 && filterDropdown.minValue !== "" ? String(filterDropdown.minValue) : "";
            if (this.minInput.value !== newMinValue) {
              this.minInput.value = newMinValue;
            }
          }
        }
        if (this.maxInput) {
          this.maxInput.style.left = `${x + padding + inputWidth + gap}px`;
          this.maxInput.style.top = `${inputY}px`;
          this.maxInput.style.width = `${inputWidth}px`;
          if (document.activeElement !== this.maxInput) {
            const newMaxValue = filterDropdown.maxValue !== void 0 && filterDropdown.maxValue !== "" ? String(filterDropdown.maxValue) : "";
            if (this.maxInput.value !== newMaxValue) {
              this.maxInput.value = newMaxValue;
            }
          }
        }
        break;
      }
    }
    this.isUpdatingFromExternal = false;
  }
  /**
   * 创建 search 模式的输入框
   */
  createSearchInput(filterDropdown) {
    const { x, y, width } = filterDropdown;
    const padding = 8;
    const inputHeight = 36;
    const inputX = x + padding;
    const inputY = y + padding;
    const inputWidth = width - padding * 2;
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.value = filterDropdown.searchValue ?? "";
    this.searchInput.placeholder = this.locale.filter.searchPlaceholder;
    this.searchInput.style.cssText = `
      position: absolute;
      left: ${inputX}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 12px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;
    this.searchInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.searchInput) {
        this.onInputChange(this.searchInput.value, "searchValue");
      }
    });
    this.searchInput.addEventListener("focus", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });
    this.searchInput.addEventListener("blur", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.border;
      }
    });
    this.wrapper.appendChild(this.searchInput);
    requestAnimationFrame(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    });
  }
  /**
   * 创建 select 模式的搜索输入框
   */
  createSelectSearchInput(filterDropdown) {
    const { x, y, width } = filterDropdown;
    const padding = 8;
    const inputHeight = 36 - padding;
    const inputX = x + padding;
    const inputY = y + padding;
    const inputWidth = width - padding * 2;
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.value = filterDropdown.searchText ?? "";
    this.searchInput.placeholder = this.locale.filter.selectSearchPlaceholder;
    this.searchInput.style.cssText = `
      position: absolute;
      left: ${inputX}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 12px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;
    this.searchInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.searchInput) {
        this.onInputChange(this.searchInput.value, "searchText");
      }
    });
    this.searchInput.addEventListener("focus", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });
    this.searchInput.addEventListener("blur", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.border;
      }
    });
    this.wrapper.appendChild(this.searchInput);
    requestAnimationFrame(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    });
  }
  /**
   * 创建 range 模式的两个输入框
   */
  createRangeInputs(filterDropdown) {
    const { x, y, width, minValue, maxValue } = filterDropdown;
    const padding = 8;
    const inputHeight = 32;
    const gap = 8;
    const inputWidth = (width - padding * 3) / 2;
    const inputY = y + padding;
    this.minInput = document.createElement("input");
    this.minInput.type = "number";
    this.minInput.value = minValue !== void 0 && minValue !== "" ? String(minValue) : "";
    this.minInput.placeholder = this.locale.filter.minPlaceholder;
    this.minInput.style.cssText = `
      position: absolute;
      left: ${x + padding}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 8px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;
    this.minInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.minInput) {
        this.onInputChange(this.minInput.value, "minValue");
      }
    });
    this.minInput.addEventListener("focus", () => {
      if (this.minInput) {
        this.minInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });
    this.minInput.addEventListener("blur", () => {
      if (this.minInput) {
        this.minInput.style.borderColor = this.theme.colors.input.border;
      }
    });
    this.maxInput = document.createElement("input");
    this.maxInput.type = "number";
    this.maxInput.value = maxValue !== void 0 && maxValue !== "" ? String(maxValue) : "";
    this.maxInput.placeholder = this.locale.filter.maxPlaceholder;
    this.maxInput.style.cssText = `
      position: absolute;
      left: ${x + padding + inputWidth + gap}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 8px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;
    this.maxInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.maxInput) {
        this.onInputChange(this.maxInput.value, "maxValue");
      }
    });
    this.maxInput.addEventListener("focus", () => {
      if (this.maxInput) {
        this.maxInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });
    this.maxInput.addEventListener("blur", () => {
      if (this.maxInput) {
        this.maxInput.style.borderColor = this.theme.colors.input.border;
      }
    });
    this.wrapper.appendChild(this.minInput);
    this.wrapper.appendChild(this.maxInput);
    requestAnimationFrame(() => {
      if (this.minInput) {
        this.minInput.focus();
      }
    });
  }
  /**
   * 移除所有输入框
   */
  removeInputs() {
    if (this.searchInput) {
      this.searchInput.remove();
      this.searchInput = null;
    }
    if (this.minInput) {
      this.minInput.remove();
      this.minInput = null;
    }
    if (this.maxInput) {
      this.maxInput.remove();
      this.maxInput = null;
    }
  }
  /**
   * 强制重置所有输入框的值
   * 用于重置按钮点击时，即使输入框有焦点也要清空
   */
  forceReset() {
    this.isUpdatingFromExternal = true;
    if (this.searchInput) {
      this.searchInput.value = "";
    }
    if (this.minInput) {
      this.minInput.value = "";
    }
    if (this.maxInput) {
      this.maxInput.value = "";
    }
    this.isUpdatingFromExternal = false;
  }
  /**
   * 强制更新输入框的值
   * 用于重新打开筛选器时同步状态
   */
  forceUpdateValues(filterDropdown) {
    this.isUpdatingFromExternal = true;
    switch (filterDropdown.mode) {
      case "search":
        if (this.searchInput) {
          const newValue = filterDropdown.searchValue ?? "";
          this.searchInput.value = newValue;
        }
        break;
      case "select":
        if (this.searchInput) {
          const newValue = filterDropdown.searchText ?? "";
          this.searchInput.value = newValue;
        }
        break;
      case "range":
        if (this.minInput) {
          const newMinValue = filterDropdown.minValue !== void 0 && filterDropdown.minValue !== "" ? String(filterDropdown.minValue) : "";
          this.minInput.value = newMinValue;
        }
        if (this.maxInput) {
          const newMaxValue = filterDropdown.maxValue !== void 0 && filterDropdown.maxValue !== "" ? String(filterDropdown.maxValue) : "";
          this.maxInput.value = newMaxValue;
        }
        break;
    }
    this.isUpdatingFromExternal = false;
  }
  /**
   * 更新输入框位置（滚动时调用）
   */
  updatePosition(filterDropdown) {
    this.updatePositions(filterDropdown);
  }
  /**
   * 销毁
   */
  destroy() {
    this.removeInputs();
  }
}
class EventEmitter {
  listeners = /* @__PURE__ */ new Map();
  on(event, callback) {
    const key = event;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, /* @__PURE__ */ new Set());
    }
    this.listeners.get(key).add(callback);
  }
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  emit(event, ...args) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      });
    }
  }
  once(event, callback) {
    const onceCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  listenerCount(event) {
    return this.listeners.get(event)?.size ?? 0;
  }
}
const DEFAULT_THEME = {
  name: "light",
  colors: {
    background: "#ffffff",
    headerBackground: "#f5f5f5",
    headerText: "#333333",
    rowBackground: "#ffffff",
    rowAltBackground: "#fafafa",
    rowHoverBackground: "#f0f7ff",
    rowSelectedBackground: "#e6f4ff",
    cellText: "#333333",
    cellBorder: "#e8e8e8",
    selectionBorder: "#1890ff",
    linkColor: "#1890ff",
    placeholderText: "#bfbfbf",
    primary: "#1890ff",
    tagColors: {
      default: "#f0f0f0",
      primary: "#1890ff",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f",
      info: "#1890ff"
    },
    date: {
      border: "#d9d9d9",
      icon: "#999999"
    },
    input: {
      border: "#d9d9d9",
      focusBorder: "#1890ff",
      background: "#ffffff",
      text: "#333333",
      placeholder: "#bfbfbf"
    },
    checkbox: {
      border: "#d9d9d9",
      checkedBg: "#1890ff",
      checkmark: "#ffffff",
      disabledBg: "#f5f5f5"
    },
    radio: {
      border: "#d9d9d9",
      checkedBg: "#1890ff",
      dot: "#ffffff",
      disabledBg: "#f5f5f5"
    },
    switch: {
      onBg: "#1890ff",
      offBg: "#bfbfbf",
      thumb: "#ffffff",
      disabledOnBg: "#a0cfff",
      disabledOffBg: "#d9d9d9"
    },
    button: {
      background: "#ffffff",
      text: "#333333",
      border: "#d9d9d9",
      hoverBg: "#e6e6e6",
      primaryBg: "#1890ff",
      primaryText: "#ffffff",
      dangerBg: "#ff4d4f",
      dangerText: "#ffffff",
      warningBg: "#faad14",
      warningText: "#ffffff",
      linkText: "#1890ff",
      disabledBg: "#f5f5f5",
      disabledText: "#bfbfbf",
      disabledBorder: "#d9d9d9"
    },
    dropdown: {
      background: "#ffffff",
      border: "#e8e8e8",
      hoverBg: "#f5f5f5",
      selectedBg: "#e6f4ff",
      text: "#333333"
    },
    scrollbar: {
      track: "#f0f0f0",
      thumb: "#c1c1c1",
      thumbHover: "#a8a8a8",
      thumbActive: "#909090",
      opacity: 0.8
    },
    progress: {
      track: "#f0f0f0",
      default: "#1890ff",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f"
    },
    indicator: {
      active: "#333333",
      inactive: "#bfbfbf"
    },
    tooltip: {
      background: "rgba(255, 255, 255, 0.95)",
      text: "#333333",
      gap: 4
    },
    image: {
      hoverBorder: "#1890ff",
      hoverShadow: "rgba(24, 144, 255, 0.3)",
      placeholderBg: "#f0f0f0",
      errorBg: "#fff1f0",
      errorBorder: "#ff4d4f"
    },
    hiddenPlaceholder: {
      hoverBg: "#bae0ff"
    },
    moreCount: {
      background: "rgba(0, 0, 0, 0.08)",
      text: "#666666"
    },
    shadow: {
      color: "rgba(0, 0, 0, 0.4)",
      blur: 12,
      offsetX: 0,
      offsetY: 2
    },
    watermark: {
      color: "rgba(0, 0, 0, 0.15)",
      fontSize: 16,
      opacity: 1
    },
    loading: {
      background: "rgba(255, 255, 255, 0.85)",
      spinnerBorder: "#d9d9d9",
      spinnerActive: "#1890ff",
      text: "#333333"
    }
  },
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: 13,
    headerSize: 13
  },
  row: {
    height: 32,
    headerHeight: 36,
    minHeight: 24,
    maxHeight: 320,
    resizeGuideColor: "#1890ff",
    resizeGuideWidth: 1
  },
  border: {
    width: 1,
    color: "#e8e8e8"
  }
};
const DARK_THEME = {
  name: "dark",
  colors: {
    background: "#1f1f1f",
    headerBackground: "#2d2d2d",
    headerText: "#e0e0e0",
    rowBackground: "#1f1f1f",
    rowAltBackground: "#262626",
    rowHoverBackground: "#303030",
    rowSelectedBackground: "#177ddc",
    cellText: "#e0e0e0",
    cellBorder: "#434343",
    selectionBorder: "#177ddc",
    linkColor: "#177ddc",
    placeholderText: "#666666",
    primary: "#177ddc",
    tagColors: {
      default: "#434343",
      primary: "#177ddc",
      success: "#49aa19",
      warning: "#d89614",
      error: "#a61d24",
      info: "#177ddc"
    },
    date: {
      border: "#434343",
      icon: "#666666"
    },
    input: {
      border: "#434343",
      focusBorder: "#177ddc",
      background: "#2d2d2d",
      text: "#e0e0e0",
      placeholder: "#666666"
    },
    checkbox: {
      border: "#434343",
      checkedBg: "#177ddc",
      checkmark: "#ffffff",
      disabledBg: "#363636"
    },
    radio: {
      border: "#434343",
      checkedBg: "#177ddc",
      dot: "#ffffff",
      disabledBg: "#363636"
    },
    switch: {
      onBg: "#177ddc",
      offBg: "#595959",
      thumb: "#ffffff",
      disabledOnBg: "#1a4a6e",
      disabledOffBg: "#363636"
    },
    button: {
      background: "#2d2d2d",
      text: "#e0e0e0",
      border: "#434343",
      hoverBg: "#404040",
      primaryBg: "#177ddc",
      primaryText: "#ffffff",
      dangerBg: "#a61d24",
      dangerText: "#ffffff",
      warningBg: "#d89614",
      warningText: "#ffffff",
      linkText: "#177ddc",
      disabledBg: "#363636",
      disabledText: "#666666",
      disabledBorder: "#434343"
    },
    dropdown: {
      background: "#2d2d2d",
      border: "#434343",
      hoverBg: "#3a3a3a",
      selectedBg: "#177ddc",
      text: "#e0e0e0"
    },
    scrollbar: {
      track: "#2d2d2d",
      thumb: "#4a4a4a",
      thumbHover: "#5a5a5a",
      thumbActive: "#6a6a6a",
      opacity: 0.8
    },
    progress: {
      track: "#2d2d2d",
      default: "#177ddc",
      success: "#49aa19",
      warning: "#d89614",
      error: "#a61d24"
    },
    indicator: {
      active: "#e0e0e0",
      inactive: "#666666"
    },
    tooltip: {
      background: "rgba(60, 60, 60, 0.95)",
      text: "#ffffff",
      gap: 4
    },
    image: {
      hoverBorder: "#177ddc",
      hoverShadow: "rgba(23, 125, 220, 0.3)",
      placeholderBg: "#363636",
      errorBg: "#2a1215",
      errorBorder: "#a61d24"
    },
    hiddenPlaceholder: {
      hoverBg: "#1a4a6e"
    },
    moreCount: {
      background: "rgba(255, 255, 255, 0.25)",
      text: "#ffffff"
    },
    shadow: {
      color: "rgba(0, 0, 0, 0.55)",
      blur: 12,
      offsetX: 0,
      offsetY: 2
    },
    watermark: {
      color: "rgba(255, 255, 255, 0.1)",
      fontSize: 16,
      opacity: 1
    },
    loading: {
      background: "rgba(31, 31, 31, 0.85)",
      spinnerBorder: "#434343",
      spinnerActive: "#177ddc",
      text: "#e0e0e0"
    }
  },
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: 13,
    headerSize: 13
  },
  row: {
    height: 32,
    headerHeight: 36,
    minHeight: 24,
    maxHeight: 320,
    resizeGuideColor: "#177ddc",
    resizeGuideWidth: 1
  },
  border: {
    width: 1,
    color: "#434343"
  }
};
function mergeTheme(theme) {
  if (!theme) {
    return { ...DEFAULT_THEME };
  }
  return {
    ...DEFAULT_THEME,
    ...theme,
    colors: {
      ...DEFAULT_THEME.colors,
      ...theme.colors,
      tagColors: {
        ...DEFAULT_THEME.colors.tagColors,
        ...theme.colors?.tagColors
      },
      date: {
        ...DEFAULT_THEME.colors.date,
        ...theme.colors?.date
      },
      input: {
        ...DEFAULT_THEME.colors.input,
        ...theme.colors?.input
      },
      checkbox: {
        ...DEFAULT_THEME.colors.checkbox,
        ...theme.colors?.checkbox
      },
      radio: {
        ...DEFAULT_THEME.colors.radio,
        ...theme.colors?.radio
      },
      button: {
        ...DEFAULT_THEME.colors.button,
        ...theme.colors?.button
      },
      dropdown: {
        ...DEFAULT_THEME.colors.dropdown,
        ...theme.colors?.dropdown
      },
      scrollbar: {
        ...DEFAULT_THEME.colors.scrollbar,
        ...theme.colors?.scrollbar
      },
      indicator: {
        ...DEFAULT_THEME.colors.indicator,
        ...theme.colors?.indicator
      },
      tooltip: {
        ...DEFAULT_THEME.colors.tooltip,
        ...theme.colors?.tooltip
      },
      image: {
        ...DEFAULT_THEME.colors.image,
        ...theme.colors?.image
      },
      hiddenPlaceholder: {
        ...DEFAULT_THEME.colors.hiddenPlaceholder,
        ...theme.colors?.hiddenPlaceholder
      },
      moreCount: {
        ...DEFAULT_THEME.colors.moreCount,
        ...theme.colors?.moreCount
      },
      shadow: {
        ...DEFAULT_THEME.colors.shadow,
        ...theme.colors?.shadow
      },
      watermark: {
        ...DEFAULT_THEME.colors.watermark,
        ...theme.colors?.watermark
      },
      loading: theme.colors?.loading ? { ...DEFAULT_THEME.colors.loading, ...theme.colors.loading } : DEFAULT_THEME.colors.loading
    },
    font: {
      ...DEFAULT_THEME.font,
      ...theme.font
    },
    row: {
      ...DEFAULT_THEME.row,
      ...theme.row
    },
    border: {
      ...DEFAULT_THEME.border,
      ...theme.border
    }
  };
}
class LoadingOverlay {
  element;
  spinnerElement;
  textElement;
  theme;
  config;
  constructor(wrapper, theme, config = {}) {
    this.theme = theme;
    this.config = config;
    this.element = document.createElement("div");
    this.element.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 16px;
      z-index: 9999;
    `;
    this.spinnerElement = document.createElement("div");
    this.spinnerElement.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    this.textElement = document.createElement("div");
    this.textElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;
    this.element.appendChild(this.spinnerElement);
    this.element.appendChild(this.textElement);
    wrapper.appendChild(this.element);
    const styleId = "canvas-table-loading-animation";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes canvas-table-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    this.element.addEventListener("mousedown", (e) => e.stopPropagation(), true);
    this.element.addEventListener("mouseup", (e) => e.stopPropagation(), true);
    this.element.addEventListener("click", (e) => e.stopPropagation(), true);
    this.element.addEventListener("dblclick", (e) => e.stopPropagation(), true);
    this.element.addEventListener(
      "wheel",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      { passive: false }
    );
    this.element.addEventListener("touchstart", (e) => e.stopPropagation(), true);
    this.element.addEventListener(
      "touchmove",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      { passive: false }
    );
    this.element.addEventListener("touchend", (e) => e.stopPropagation(), true);
    this.element.addEventListener("keydown", (e) => e.stopPropagation(), true);
    this.element.addEventListener("keyup", (e) => e.stopPropagation(), true);
    this.element.addEventListener("contextmenu", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    this.applyTheme();
  }
  applyTheme() {
    const loadingColors = this.theme.colors.loading ?? {
      background: "rgba(255, 255, 255, 0.85)",
      spinnerBorder: "#d9d9d9",
      spinnerActive: "#1890ff",
      text: "#333333"
    };
    this.element.style.background = loadingColors.background;
    this.spinnerElement.style.borderColor = loadingColors.spinnerBorder;
    this.spinnerElement.style.borderTopColor = loadingColors.spinnerActive;
    this.spinnerElement.style.animation = "canvas-table-spin 1s linear infinite";
    this.textElement.style.color = loadingColors.text;
    this.textElement.style.fontFamily = this.theme.font.family;
  }
  setTheme(theme) {
    this.theme = theme;
    this.applyTheme();
  }
  setConfig(config) {
    this.config = config;
    this.updateText();
  }
  updateText() {
    this.textElement.textContent = this.config.text ?? zhCN.loadingText;
  }
  show(text) {
    if (text) {
      this.textElement.textContent = text;
    } else {
      this.updateText();
    }
    this.element.style.display = "flex";
  }
  hide() {
    this.element.style.display = "none";
  }
  isVisible() {
    return this.element.style.display === "flex";
  }
  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
class RowPinManager {
  topPinnedRows = /* @__PURE__ */ new Set();
  bottomPinnedRows = /* @__PURE__ */ new Set();
  pin(row, position) {
    if (position === "top") {
      this.bottomPinnedRows.delete(row);
      this.topPinnedRows.add(row);
    } else {
      this.topPinnedRows.delete(row);
      this.bottomPinnedRows.add(row);
    }
  }
  remove(row) {
    this.topPinnedRows.delete(row);
    this.bottomPinnedRows.delete(row);
  }
  clear() {
    this.topPinnedRows.clear();
    this.bottomPinnedRows.clear();
  }
  getPosition(row) {
    if (this.topPinnedRows.has(row)) return "top";
    if (this.bottomPinnedRows.has(row)) return "bottom";
    return null;
  }
  isPinned(row) {
    return this.getPosition(row) !== null;
  }
  isPinnedTop(row) {
    return this.topPinnedRows.has(row);
  }
  isPinnedBottom(row) {
    return this.bottomPinnedRows.has(row);
  }
  getTopRows() {
    return [...this.topPinnedRows];
  }
  getBottomRows() {
    return [...this.bottomPinnedRows];
  }
}
class SummaryManager {
  static buildRows(config, context, defaultRowHeight) {
    const enabled = config?.enabled ?? Boolean(config?.rows?.length);
    const position = config?.position ?? "bottom";
    const scope = config?.scope ?? "view";
    if (!enabled || !config?.rows?.length) {
      return { enabled: false, position, scope, rows: [] };
    }
    const scopeRows = scope === "all" ? context.allRows : context.viewRows;
    const summaryContext = {
      ...context,
      scopeRows
    };
    const columnIndexByKey = new Map(
      context.visibleLeafColumns.map((column, index) => [column.key, index])
    );
    return {
      enabled,
      position,
      scope,
      rows: config.rows.map((rowConfig, rowIndex) => {
        const built = rowConfig.build?.(summaryContext);
        const result = this.normalizeRowResult(built, rowConfig.cells ?? []);
        const row = {
          key: rowConfig.key,
          height: result.height ?? rowConfig.height ?? defaultRowHeight,
          cells: [],
          source: rowConfig,
          style: config.style
        };
        row.cells = this.buildCells(result.cells, row, rowIndex, summaryContext, columnIndexByKey);
        return row;
      })
    };
  }
  static normalizeRowResult(result, fallbackCells) {
    if (Array.isArray(result)) {
      return { cells: result };
    }
    if (result) {
      return result;
    }
    return { cells: fallbackCells };
  }
  static buildCells(cells, row, rowIndex, context, columnIndexByKey) {
    const builtCells = [];
    const occupiedColumns = /* @__PURE__ */ new Set();
    cells.forEach((cell, cellIndex) => {
      const range = this.resolveColumnRange(cell, context.visibleLeafColumns, columnIndexByKey);
      if (!range) return;
      for (let index = range.startColumnIndex; index <= range.endColumnIndex; index++) {
        if (occupiedColumns.has(index)) {
          throw new Error(`Overlapping summary cells in row "${row.key}"`);
        }
        occupiedColumns.add(index);
      }
      const column = context.visibleLeafColumns[range.startColumnIndex];
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
          context
        )
      });
    });
    return builtCells;
  }
  static resolveColumnRange(cell, visibleLeafColumns, columnIndexByKey) {
    const startKey = cell.startColumnKey ?? cell.columnKey;
    const endKey = cell.endColumnKey ?? cell.columnKey ?? startKey;
    if (!startKey || !endKey) return void 0;
    const startColumnIndex = columnIndexByKey.get(startKey);
    const endColumnIndex = columnIndexByKey.get(endKey);
    if (startColumnIndex === void 0 || endColumnIndex === void 0) return void 0;
    const start = Math.min(startColumnIndex, endColumnIndex);
    const end = Math.max(startColumnIndex, endColumnIndex);
    return {
      startColumnIndex: start,
      endColumnIndex: end,
      startColumnKey: visibleLeafColumns[start].key,
      endColumnKey: visibleLeafColumns[end].key
    };
  }
  static resolveRenderResult(cell, row, rowIndex, column, columnIndex, context) {
    if (cell.render) {
      return cell.render({
        cell,
        row,
        rowIndex,
        column,
        columnIndex,
        context
      });
    }
    return {
      text: String(cell.text ?? cell.value ?? ""),
      type: cell.type ?? "text",
      style: cell.style
    };
  }
}
const defaultInteractiveStrategy = {
  isInteractive: true,
  canEdit(_cell, row, column) {
    if (column.editable === false) return false;
    return !resolveDisabled(column.disabled, row, column);
  }
};
const defaultDomStrategy = {
  isInteractive: false,
  canEdit(_cell, row, column) {
    if (column.editable === false) return false;
    return !resolveDisabled(column.disabled, row, column);
  },
  shouldBlockFocusLoss(_cell, error) {
    return error.level === "error";
  }
};
const unknownTypeStrategy = {
  isInteractive: true,
  canEdit(_cell, _row, column) {
    return column.editable === true;
  }
};
const INTERACTIVE_TYPES = /* @__PURE__ */ new Set([
  CellTypes.CHECKBOX,
  CellTypes.RADIO,
  CellTypes.SWITCH,
  CellTypes.SELECT,
  CellTypes.TAG,
  CellTypes.DATE,
  CellTypes.COLOR,
  CellTypes.RATING,
  CellTypes.PROGRESS,
  CellTypes.BUTTON
]);
const DOM_TYPES = /* @__PURE__ */ new Set([CellTypes.INPUT, CellTypes.TEXT, CellTypes.NUMBER]);
class EditorRegistry {
  strategies = /* @__PURE__ */ new Map();
  constructor() {
    for (const type of INTERACTIVE_TYPES) {
      this.strategies.set(type, defaultInteractiveStrategy);
    }
    for (const type of DOM_TYPES) {
      this.strategies.set(type, defaultDomStrategy);
    }
  }
  /** 注册自定义策略 */
  register(type, strategy) {
    this.strategies.set(type, strategy);
  }
  /** 获取列对应的编辑器策略 */
  getStrategy(column) {
    const type = column.type ?? CellTypes.TEXT;
    const strategy = this.strategies.get(type);
    if (strategy) return strategy;
    return unknownTypeStrategy;
  }
  /** 检查列是否是交互式编辑器 */
  isInteractive(column) {
    return this.getStrategy(column).isInteractive;
  }
}
class CanvasTable {
  container;
  wrapper;
  canvas;
  props;
  dataManager;
  layoutManager;
  rowPinManager;
  renderer;
  interactionManager;
  editorManager;
  editorRegistry;
  filterInputManager;
  eventEmitter;
  loadingOverlay;
  theme;
  themeMode;
  locale;
  mediaQuery = null;
  isDestroyed = false;
  resizeObserver = null;
  renderCache;
  rowIdManager;
  columnIdManager;
  scheduledRender = null;
  manualLoading = false;
  // 用户手动设置的 loading 状态
  validationErrorRows = /* @__PURE__ */ new WeakMap();
  pendingValidationCells = /* @__PURE__ */ new Set();
  pendingAnimationFrame = null;
  forcedValidationTooltipCell = null;
  warningTooltipTimeout = null;
  // CanvasTable 性能监控字段
  ctPerformanceEnabled = false;
  ctFrameHistory = [];
  static CT_MAX_FRAME_HISTORY = 120;
  ctFrameCount = 0;
  ctLastRafTime = null;
  ctScheduledAt = null;
  ctRafInterval = null;
  ctScheduledToStartDelay = 0;
  ctCoalescedCount = 0;
  ctCurrentFramePhases = /* @__PURE__ */ new Map();
  constructor(container, props) {
    if (typeof container === "string") {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = element;
    } else {
      this.container = container;
    }
    this.props = props;
    this.locale = resolveLocale(props.locale);
    this.themeMode = props.themeMode ?? "light";
    this.theme = this.resolveTheme();
    if (this.themeMode === "auto") {
      this.setupAutoThemeDetection();
    }
    this.wrapper = document.createElement("div");
    this.wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;
    this.container.appendChild(this.wrapper);
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = `
      display: block;
      position: relative;
      z-index: 1;
    `;
    this.wrapper.appendChild(this.canvas);
    this.loadingOverlay = new LoadingOverlay(this.wrapper, this.theme, {
      text: this.props.loadingText ?? this.locale.loadingText
    });
    this.eventEmitter = new EventEmitter();
    this.setupEventHandlers();
    const virtualScrollConfig = {
      enabled: props.virtualScroll?.enabled ?? true,
      rowBufferSize: props.virtualScroll?.rowBufferSize ?? props.bufferSize ?? 5,
      columnBufferSize: props.virtualScroll?.columnBufferSize ?? 2
    };
    if (props.virtualScroll?.estimatedRowHeight !== void 0) {
      virtualScrollConfig.estimatedRowHeight = props.virtualScroll.estimatedRowHeight;
    }
    if (props.virtualScroll?.estimatedColumnWidth !== void 0) {
      virtualScrollConfig.estimatedColumnWidth = props.virtualScroll.estimatedColumnWidth;
    }
    const selectionConfig = props.selection ?? {
      mode: "cell",
      multi: true
    };
    const editingConfig = props.editing ?? {
      enabled: true,
      mode: "dblclick"
    };
    this.dataManager = new DataManager(props.rowKey);
    this.layoutManager = new LayoutManager(virtualScrollConfig, this.theme);
    this.rowPinManager = new RowPinManager();
    this.layoutManager.setRowPinManager(this.rowPinManager);
    this.layoutManager.setShowRowNumbers(props.showRowNumbers === true);
    this.layoutManager.setRowHeightFn(props.rowHeight);
    this.renderer = new Renderer(this.canvas, this.theme, this.layoutManager, this.locale);
    this.renderer.setMultipleSelectSeparator(props.multipleSelectSeparator ?? ", ");
    this.renderer.setJSXUpdateHandlers({
      updateValue: async (rowIndex, column, value) => {
        await this.updateCell(rowIndex, getColumnField(column), value);
      },
      updateField: async (rowIndex, field, value) => {
        await this.updateCell(rowIndex, field, value);
      },
      updateRow: async (rowIndex, data) => {
        await this.updateRow(rowIndex, data);
      }
    });
    this.rowIdManager = this.renderer.getRowIdManager();
    this.columnIdManager = this.renderer.getColumnIdManager();
    this.renderCache = new RenderCache(
      this.rowIdManager,
      this.columnIdManager,
      this.dataManager.getRowVersionManager()
    );
    this.renderer.setRenderCache(this.renderCache);
    this.renderer.setOnImageLoaded(() => this.render());
    if (props.watermark) {
      this.renderer.setWatermarkConfig(props.watermark);
    }
    if (props.imageLoad) {
      this.renderer.setImageLoadConfig(props.imageLoad);
    }
    this.editorRegistry = new EditorRegistry();
    this.interactionManager = new InteractionManager(
      this.canvas,
      this.layoutManager,
      this.dataManager,
      this.eventEmitter,
      selectionConfig,
      editingConfig,
      this.locale,
      this.editorRegistry
    );
    this.interactionManager.setRowHeightResizeEnabled(props.enableRowHeightResize === true);
    this.interactionManager.setRowResizable(props.rowResizable);
    this.interactionManager.setShouldBlockDropdownClose(async (cell) => {
      const column = this.layoutManager.getLeafColumn(cell.columnIndex);
      const row = this.dataManager.getRows()[cell.rowIndex];
      if (!column || !row) return false;
      const dropdown = this.interactionManager.getDropdown();
      let value;
      if (dropdown && dropdown.type === "tags" && dropdown.tagsConfig) {
        const isMultiple = dropdown.tagsConfig.multiple !== false;
        value = isMultiple ? dropdown.tagsConfig.selectedValues ?? [] : dropdown.tagsConfig.selectedValues?.[0] ?? "";
      } else if (dropdown) {
        value = dropdown.config.value;
      } else {
        value = row.data[getColumnField(column)];
      }
      const valid = await this.validateEditorCommit(cell, value);
      return !valid;
    });
    this.interactionManager.setShouldBlockEditingClose(async (e) => {
      const editingCell = this.editorManager.getEditingCell();
      if (editingCell) {
        if (e) e.preventDefault();
        this.editorManager.markSkipNextBlur();
        const committed = await this.editorManager.endEditing(true);
        if (!committed) {
          const column = this.layoutManager.getLeafColumn(editingCell.columnIndex);
          if (column) {
            const strategy = this.editorRegistry.getStrategy(column);
            const error = this.getValidationError(editingCell);
            if (error && !strategy.shouldBlockFocusLoss(editingCell, error)) {
              await this.editorManager.endEditing(false);
              return false;
            }
          }
          return true;
        }
        return false;
      }
      const dropdown = this.interactionManager.getDropdown();
      if (dropdown) {
        const column = this.layoutManager.getLeafColumn(dropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dropdown.cell.rowIndex];
        if (!column || !row) return false;
        let value;
        if (dropdown.type === "tags" && dropdown.tagsConfig) {
          const isMultiple = dropdown.tagsConfig.multiple !== false;
          value = isMultiple ? dropdown.tagsConfig.selectedValues ?? [] : dropdown.tagsConfig.selectedValues?.[0] ?? "";
        } else {
          value = dropdown.config.value;
        }
        const valid = await this.validateEditorCommit(dropdown.cell, value);
        return !valid;
      }
      const dateDropdown = this.interactionManager.getDateDropdown();
      if (dateDropdown) {
        const column = this.layoutManager.getLeafColumn(dateDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dateDropdown.cell.rowIndex];
        if (!column || !row) return false;
        const value = dateDropdown.selectedDate ?? row.data[getColumnField(column)];
        const valid = await this.validateEditorCommit(dateDropdown.cell, value);
        return !valid;
      }
      const colorDropdown = this.interactionManager.getColorDropdown();
      if (colorDropdown) {
        const column = this.layoutManager.getLeafColumn(colorDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[colorDropdown.cell.rowIndex];
        if (!column || !row) return false;
        const value = colorDropdown.config.value ?? row.data[getColumnField(column)];
        const valid = await this.validateEditorCommit(colorDropdown.cell, value);
        return !valid;
      }
      return false;
    });
    this.interactionManager.setDomEditorActiveChecker(() => this.editorManager.isEditing());
    this.interactionManager.setRowPinningEnabled(props.enableRowPinning === true);
    this.interactionManager.setRowPinnable(props.rowPinnable);
    this.interactionManager.setGetScrollbarBounds(() => {
      const scrollState = this.interactionManager.getScrollState();
      return this.renderer.getScrollbarBounds(
        scrollState.scrollLeft,
        scrollState.scrollTop,
        scrollState.maxScrollLeft,
        scrollState.maxScrollTop
      );
    });
    this.editorManager = new EditorManager(
      this.wrapper,
      this.canvas,
      this.layoutManager,
      this.eventEmitter,
      this.theme,
      this.locale,
      () => this.dataManager.getRows()
    );
    this.editorManager.setOnScrollCallback((deltaX, deltaY) => {
      this.interactionManager.handleExternalWheel(deltaX, deltaY);
    });
    this.editorManager.setBeforeCommitCallback(
      (cell, value) => this.validateEditorCommit(cell, value)
    );
    this.editorManager.setCancelCallback((cell) => {
      this.clearValidationErrorForCell(cell);
      const column = this.layoutManager.getLeafColumn(cell.columnIndex);
      if (column) {
        const strategy = this.editorRegistry.getStrategy(column);
        strategy.onCancel?.(cell);
      }
    });
    this.filterInputManager = new FilterInputManager(
      this.wrapper,
      this.eventEmitter,
      this.theme,
      this.locale
    );
    this.filterInputManager.setOnInputChange((value, field) => {
      const filterDropdown = this.interactionManager.getFilterDropdown();
      if (filterDropdown) {
        if (field === "searchValue" || field === "searchText") {
          this.interactionManager.handleFilterDropdownSearch(value);
        } else if (field === "minValue") {
          this.interactionManager.handleFilterDropdownRangeUpdate(
            value,
            String(filterDropdown.maxValue ?? "")
          );
        } else if (field === "maxValue") {
          this.interactionManager.handleFilterDropdownRangeUpdate(
            String(filterDropdown.minValue ?? ""),
            value
          );
        }
        this.render();
      }
    });
    if (props.lazyLoad?.enabled) {
      this.interactionManager.setLazyLoadConfig(true, props.lazyLoad.threshold ?? 5);
    }
    this.setupInternalEventListeners();
    this.setupResizeObserver();
    this.initialize();
  }
  setupInternalEventListeners() {
    this.eventEmitter.on(TableEvents.SCROLL, (scrollLeft, scrollTop) => {
      this.editorManager.setScroll(scrollLeft, scrollTop);
      this.editorManager.updatePosition();
      const filterDropdown = this.interactionManager.getFilterDropdown();
      if (filterDropdown) {
        this.filterInputManager.updatePosition(filterDropdown);
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.COLUMN_RESIZE, () => {
      const columns = this.dataManager.getColumns();
      this.layoutManager.calculateColumnLayoutOnly(columns);
      this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      );
      this.render();
    });
    this.eventEmitter.on(TableEvents.ROW_RESIZE_DRAG, () => {
      this.render();
    });
    this.eventEmitter.on(
      TableEvents.ROW_HEIGHT_CHANGE,
      (_row, _newHeight, _rowIndex) => {
        const row = _row;
        const newHeight = _newHeight;
        const updatedIncrementally = this.layoutManager.updateRowHeight(row, newHeight);
        if (!updatedIncrementally) {
          const columns = this.dataManager.getColumns();
          const rows = this.dataManager.getRows();
          this.layoutManager.calculateLayout(columns, rows);
        }
        this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop()
        );
        this.editorManager.updatePosition();
        this.render();
      }
    );
    this.eventEmitter.on(TableEvents.COLUMN_REORDER, (_fromIndex, _toIndex) => {
      const fromIndex = _fromIndex;
      const toIndex = _toIndex;
      this.dataManager.reorderColumns(fromIndex, toIndex);
      const columns = this.dataManager.getColumns();
      this.updateSummaryRows();
      this.layoutManager.calculateColumnLayoutOnly(columns);
      if (this.props.onColumnReorder) {
        const columnKeys = columns.map((col) => col.key);
        this.props.onColumnReorder(columnKeys);
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.COLUMN_REORDER_DRAG, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.COLUMN_SWAP, (_fromKey, _toKey) => {
      const fromKey = _fromKey;
      const toKey = _toKey;
      this.dataManager.swapColumnsByKey(fromKey, toKey);
      const columns = this.dataManager.getColumns();
      this.updateSummaryRows();
      this.layoutManager.calculateColumnLayoutOnly(columns);
      this.render();
    });
    this.eventEmitter.on(TableEvents.SORT_CHANGE, (sortConfig) => {
      const config = sortConfig;
      this.dataManager.sort(config);
      this.interactionManager.setSortConfig(config);
      this.updateLayout();
      this.render();
    });
    this.eventEmitter.on(TableEvents.FILTER_CHANGE, (filterConfig) => {
      const config = filterConfig;
      this.dataManager.filter(config);
      this.interactionManager.setFilterConfig(config);
      this.updateLayout();
      this.render();
    });
    this.eventEmitter.on(TableEvents.FILTER_DROPDOWN_OPEN, () => {
      const filterDropdown = this.interactionManager.getFilterDropdown();
      this.filterInputManager.updateFilterDropdown(filterDropdown);
      this.render();
    });
    this.eventEmitter.on(TableEvents.FILTER_DROPDOWN_CLOSE, () => {
      this.filterInputManager.updateFilterDropdown(null);
      this.render();
    });
    this.eventEmitter.on(TableEvents.FILTER_DROPDOWN_CONFIRM, () => {
      this.interactionManager.applyFilter();
      this.filterInputManager.updateFilterDropdown(null);
      this.render();
    });
    this.eventEmitter.on(TableEvents.FILTER_DROPDOWN_RESET, () => {
      this.interactionManager.resetFilterValue();
      this.filterInputManager.forceReset();
      this.render();
    });
    this.eventEmitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.SELECTION_CHANGE, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.CELL_CLICK, (cell, _event) => {
      if (cell.rowIndex >= 0) {
        const rows = this.dataManager.getRows();
        const row = rows[cell.rowIndex];
        if (row) {
          this.eventEmitter.emit(TableEvents.ROW_CLICK, row, cell.rowIndex, _event);
        }
      }
    });
    this.eventEmitter.on(TableEvents.CELL_DBL_CLICK, (cell, _event) => {
      if (cell.rowIndex >= 0) {
        const rows = this.dataManager.getRows();
        const row = rows[cell.rowIndex];
        if (row) {
          this.eventEmitter.emit(TableEvents.ROW_DBL_CLICK, row, cell.rowIndex, _event);
        }
      }
    });
    this.eventEmitter.on(TableEvents.CELL_HOVER, (_cell) => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.HEADER_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.CHECKBOX_CHANGE, async (_cell, _checked) => {
      await this.handleEditorCommit(
        _cell,
        _checked,
        this.props.onCheckboxChange
      );
    });
    this.eventEmitter.on(TableEvents.RADIO_CHANGE, async (_cell, _value) => {
      await this.handleEditorCommit(_cell, _value, this.props.onRadioChange);
    });
    this.eventEmitter.on(TableEvents.SWITCH_CHANGE, async (_cell, _checked) => {
      await this.handleEditorCommit(
        _cell,
        _checked,
        this.props.onSwitchChange
      );
    });
    this.eventEmitter.on(TableEvents.PROGRESS_CHANGE, async (_cell, _value) => {
      await this.handleEditorCommit(
        _cell,
        _value,
        this.props.onProgressChange
      );
      this.interactionManager.clearProgressDragState(_cell, _value);
      this.render();
    });
    this.eventEmitter.on(TableEvents.PROGRESS_DRAG, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.RATING_CHANGE, async (_cell, _value) => {
      await this.handleEditorCommit(
        _cell,
        _value,
        this.props.onRatingChange
      );
    });
    this.eventEmitter.on(TableEvents.COLOR_CHANGE, async (_cell, _color) => {
      await this.handleEditorCommit(
        _cell,
        _color,
        this.props.onColorChange
      );
    });
    this.eventEmitter.on(TableEvents.COLOR_DROPDOWN_OPEN, () => {
      const colorDropdown = this.interactionManager.getColorDropdown();
      if (colorDropdown) {
        const column = this.layoutManager.getLeafColumn(colorDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[colorDropdown.cell.rowIndex];
        if (column && row) {
          const strategy = this.editorRegistry.getStrategy(column);
          strategy.onDropdownOpen?.(colorDropdown.cell, row, column);
        }
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.COLOR_DROPDOWN_CLOSE, (_cell) => {
      const cell = _cell;
      if (cell) {
        const column = this.layoutManager.getLeafColumn(cell.columnIndex);
        if (column) {
          const strategy = this.editorRegistry.getStrategy(column);
          strategy.onDropdownCancel?.(cell);
        }
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.COLOR_DROPDOWN_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.SWITCH_ANIMATION_UPDATE, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.BUTTON_HOVER_ANIMATION_UPDATE, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.EDIT_START, async (_cell, _inputConfig) => {
      const cell = _cell;
      const inputConfig = _inputConfig;
      await this.editorManager.startEditing(cell, inputConfig);
      const column = this.layoutManager.getLeafColumn(cell.columnIndex);
      if (column) {
        const strategy = this.editorRegistry.getStrategy(column);
        if (!strategy.isInteractive && strategy.onEditStart) {
          strategy.onEditStart(cell, inputConfig);
        }
      }
      this.render();
    });
    this.eventEmitter.on(
      TableEvents.SELECT_CHANGE,
      async (_cell, _value, _multiple) => {
        const cell = _cell;
        const isMultiple = _multiple;
        const committed = await this.handleEditorCommit(cell, _value, this.props.onSelectChange);
        if (committed) {
          if (!isMultiple) {
            this.clearValidationErrorForCell(cell);
            this.interactionManager.closeSelectDropdown();
          }
        }
      }
    );
    this.eventEmitter.on(
      TableEvents.TAGS_CHANGE,
      async (_cell, _values, _multiple) => {
        const cell = _cell;
        const values = _values;
        const isMultiple = _multiple;
        const valueToStore = isMultiple ? values : values[0] ?? "";
        const committed = await this.handleEditorCommit(
          cell,
          valueToStore,
          this.props.onTagsChange ? (c, _v) => this.props.onTagsChange(c, values) : void 0
        );
        if (committed && !isMultiple) {
          this.clearValidationErrorForCell(cell);
          this.interactionManager.closeSelectDropdown();
        }
      }
    );
    this.eventEmitter.on(TableEvents.EXPAND, (_row, _rowIndex, _expanded) => {
      const row = _row;
      const rowIndex = _rowIndex;
      const expanded = _expanded;
      if (this.props.onExpand) {
        this.props.onExpand(row, rowIndex, expanded);
      }
      this.dataManager.toggleRowExpand(rowIndex);
      this.updateLayout();
      this.render();
    });
    this.eventEmitter.on(TableEvents.DROPDOWN_OPEN, () => {
      const dropdown = this.interactionManager.getDropdown();
      if (dropdown) {
        const column = this.layoutManager.getLeafColumn(dropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dropdown.cell.rowIndex];
        if (column && row) {
          const strategy = this.editorRegistry.getStrategy(column);
          strategy.onDropdownOpen?.(dropdown.cell, row, column);
        }
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.DROPDOWN_CLOSE, (_cell) => {
      const cell = _cell;
      if (cell) {
        this.clearValidationErrorForCell(cell);
        const column = this.layoutManager.getLeafColumn(cell.columnIndex);
        if (column) {
          const strategy = this.editorRegistry.getStrategy(column);
          strategy.onDropdownCancel?.(cell);
        }
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.DROPDOWN_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.BUTTONS_DROPDOWN_CLOSE, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.DATE_DROPDOWN_OPEN, () => {
      const dateDropdown = this.interactionManager.getDateDropdown();
      if (dateDropdown) {
        const column = this.layoutManager.getLeafColumn(dateDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dateDropdown.cell.rowIndex];
        if (column && row) {
          const strategy = this.editorRegistry.getStrategy(column);
          strategy.onDropdownOpen?.(dateDropdown.cell, row, column);
        }
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.DATE_DROPDOWN_CLOSE, (_cell) => {
      const cell = _cell;
      if (cell) {
        const column = this.layoutManager.getLeafColumn(cell.columnIndex);
        if (column) {
          const strategy = this.editorRegistry.getStrategy(column);
          strategy.onDropdownCancel?.(cell);
        }
      }
      this.render();
    });
    this.eventEmitter.on(TableEvents.DATE_DROPDOWN_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.DATE_SELECT, async (_cell, _value) => {
      await this.handleEditorCommit(_cell, _value, this.props.onEditEnd);
      this.interactionManager.clearEditingState();
      this.render();
    });
    this.eventEmitter.on(TableEvents.CONTEXT_MENU_OPEN, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.CONTEXT_MENU_CLOSE, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.CONTEXT_MENU_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.HEADER_CONTEXT_MENU_OPEN, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.HEADER_CONTEXT_MENU_CLOSE, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.HEADER_CONTEXT_MENU_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.COLUMN_HIDE, (_columnKey) => {
      const columnKey = _columnKey;
      this.hideColumnInternal(columnKey);
    });
    this.eventEmitter.on(TableEvents.COLUMN_SHOW, (_columnKey) => {
      const columnKey = _columnKey;
      this.showColumnInternal(columnKey);
    });
    this.eventEmitter.on(TableEvents.ROW_ADD_ABOVE, (_row) => {
      const row = _row;
      const columns = this.dataManager.getColumns();
      const emptyRow = this.props.createRowData ? this.props.createRowData(columns) : this.createDefaultRowData(columns);
      this.dataManager.addRowRelativeTo(row, emptyRow, "above");
      this.updateLayout();
      this.render();
    });
    this.eventEmitter.on(TableEvents.ROW_ADD_BELOW, (_row) => {
      const row = _row;
      const columns = this.dataManager.getColumns();
      const emptyRow = this.props.createRowData ? this.props.createRowData(columns) : this.createDefaultRowData(columns);
      this.dataManager.addRowRelativeTo(row, emptyRow, "below");
      this.updateLayout();
      this.render();
    });
    this.eventEmitter.on(TableEvents.ROW_DELETE, (_row) => {
      const row = _row;
      this.rowPinManager.remove(row);
      this.dataManager.deleteRowByRef(row);
      this.updateLayout();
      this.render();
    });
    this.eventEmitter.on(TableEvents.ROW_PIN_CHANGE, (_row, _position) => {
      const row = _row;
      const position = _position;
      const previousPosition = this.rowPinManager.getPosition(row);
      if (position) {
        this.rowPinManager.pin(row, position);
      } else {
        this.rowPinManager.remove(row);
      }
      const updatedIncrementally = this.layoutManager.updateRowPin(row, previousPosition, position);
      if (!updatedIncrementally) {
        this.updateLayout();
      } else {
        this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop()
        );
        this.editorManager.updatePosition();
      }
      this.render();
      this.props.onRowPinChange?.(row, position);
    });
    this.eventEmitter.on(TableEvents.UNDO, () => {
      this.undo();
    });
    this.eventEmitter.on(TableEvents.REDO, () => {
      this.redo();
    });
    this.eventEmitter.on(
      TableEvents.IMAGE_CLICK,
      (_cell, _imageSrc, _event) => {
        const cell = _cell;
        const imageSrc = _imageSrc;
        const event = _event;
        if (this.props.onImageClick) {
          this.props.onImageClick(cell, imageSrc, event);
        }
      }
    );
    this.eventEmitter.on(TableEvents.IMAGE_TOOLTIP_SCROLL, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.IMAGE_TOOLTIP_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.IMAGE_EDITOR_SCROLL, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.IMAGE_EDITOR_HOVER, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.IMAGE_EDITOR_OPEN, () => {
      this.render();
    });
    this.eventEmitter.on(TableEvents.IMAGE_UPLOAD, (_cell, _url) => {
      const cell = _cell;
      const url = _url;
      if (this.props.onImageUpload) {
        this.props.onImageUpload(cell, url);
      }
    });
    this.eventEmitter.on(
      TableEvents.IMAGE_DELETE,
      (_cell, _deletedImage, _index) => {
        const cell = _cell;
        const deletedImage = _deletedImage;
        const index = _index;
        if (this.props.onImageDelete) {
          this.props.onImageDelete(cell, deletedImage, index);
        }
      }
    );
    this.eventEmitter.on(TableEvents.EDIT_END, async (_cell, _value) => {
      await this.handleEditorCommit(_cell, _value, this.props.onEditEnd);
      this.interactionManager.clearEditingState();
      this.render();
    });
    this.eventEmitter.on(TableEvents.LOAD_MORE, (_params) => {
      const params = _params;
      if (this.props.onLoadMore) {
        this.props.onLoadMore(params);
      }
    });
  }
  setupEventHandlers() {
    const handlers = {
      onLoad: this.props.onLoad,
      onError: this.props.onError,
      onChange: this.props.onChange,
      onSort: this.props.onSort,
      onFilter: this.props.onFilter,
      onSelect: this.props.onSelect,
      onCellClick: this.props.onCellClick,
      onCellDblClick: this.props.onCellDblClick,
      onCellHover: this.props.onCellHover,
      onRowClick: this.props.onRowClick,
      onRowDblClick: this.props.onRowDblClick,
      onHeaderClick: this.props.onHeaderClick,
      onScroll: this.props.onScroll,
      onColumnResize: this.props.onColumnResize,
      onRowHeightChange: this.props.onRowHeightChange,
      onColumnReorder: this.props.onColumnReorder,
      onEditStart: this.props.onEditStart,
      onExpand: this.props.onExpand,
      onButtonClick: this.props.onButtonClick,
      onColumnHide: this.props.onColumnHide,
      onColumnShow: this.props.onColumnShow
    };
    for (const [event, handler] of Object.entries(handlers)) {
      if (handler) {
        const eventName = event.replace("on", "").replace(/^./, (c) => c.toLowerCase());
        this.eventEmitter.on(eventName, handler);
      }
    }
  }
  setupResizeObserver() {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener("resize", this.handleResize);
  }
  handleResize = debounce(() => {
    this.resize();
  }, 100);
  async initialize() {
    try {
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || this.props.width || 800;
      const height = rect.height || this.props.height || 400;
      this.renderer.resize(width, height);
      this.layoutManager.setViewportSize(width, height);
      await this.dataManager.loadRows(this.props.rows);
      this.dataManager.setColumns(this.props.columns);
      if (this.props.expandColumnKey) {
        this.renderer.setExpandColumnKey(this.props.expandColumnKey);
        this.interactionManager.setExpandColumnKey(this.props.expandColumnKey);
      }
      this.updateLayout();
      const data = {
        rows: this.dataManager.getRows(),
        columns: this.dataManager.getColumns()
      };
      this.eventEmitter.emit(TableEvents.LOAD, data);
      this.render();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit(TableEvents.ERROR, err);
    }
  }
  updateLayout() {
    const columns = this.dataManager.getColumns();
    const rows = this.dataManager.getRows();
    this.updateSummaryRows();
    this.layoutManager.calculateLayout(columns, rows);
    this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    );
  }
  updateSummaryRows() {
    const columns = this.dataManager.getColumns();
    const viewRows = this.dataManager.getRows();
    const allRows = this.dataManager.getAllRows();
    const summary = SummaryManager.buildRows(
      this.props.summary,
      {
        columns,
        visibleLeafColumns: this.layoutManager.getVisibleLeafColumnsForLayout(columns),
        viewRows,
        allRows,
        scopeRows: viewRows
      },
      this.theme.row.height
    );
    this.layoutManager.setSummaryRows(
      summary.position === "top" ? summary.rows : [],
      summary.position === "bottom" ? summary.rows : []
    );
  }
  refreshSummaryRowsAfterDataChange() {
    this.updateSummaryRows();
    this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    );
    this.editorManager.updatePosition();
  }
  normalizeValidationResult(result) {
    if (result === true) {
      return { valid: true, level: "error" };
    }
    if (result === false) {
      return { valid: false, message: "Invalid value", level: "error" };
    }
    if (typeof result === "string") {
      return { valid: false, message: result || "Invalid value", level: "error" };
    }
    if (!result || typeof result !== "object") {
      return { valid: true, level: "error" };
    }
    const message = result.message || (result.valid ? void 0 : "Invalid value");
    return {
      valid: result.valid,
      message,
      level: result.level ?? "error"
    };
  }
  async handleValidation(cell, column, value) {
    const strategy = this.editorRegistry.getStrategy(column);
    const columnValidator = column.validate ?? column.editor?.validate;
    const strategyValidator = strategy.validate;
    if (!columnValidator && !strategyValidator) return { valid: true, issue: null };
    const row = this.dataManager.getRows()[cell.rowIndex];
    if (!row) return { valid: true, issue: null };
    const rawResult = columnValidator ? columnValidator(value, row, column) : strategyValidator(cell, value, row, column);
    const isAsync = isPromise(rawResult);
    if (isAsync) {
      this.addPendingValidation(cell);
    }
    const result = isAsync ? await rawResult : rawResult;
    const normalized = this.normalizeValidationResult(result);
    const issue = normalized.message && (normalized.level === "warning" || !normalized.valid) ? {
      cell,
      row,
      column,
      value,
      message: normalized.message,
      level: normalized.level
    } : null;
    if (isAsync) {
      this.removePendingValidation(cell);
    }
    if (issue) {
      const columnErrors = this.validationErrorRows.get(row) ?? /* @__PURE__ */ new Map();
      columnErrors.set(column.key, issue);
      this.validationErrorRows.set(row, columnErrors);
      this.forcedValidationTooltipCell = issue.cell;
      if (issue.level === "warning") {
        const warningCell = issue.cell;
        if (this.warningTooltipTimeout) clearTimeout(this.warningTooltipTimeout);
        this.warningTooltipTimeout = setTimeout(() => {
          if (this.isDestroyed) return;
          if (this.forcedValidationTooltipCell && this.forcedValidationTooltipCell.rowIndex === warningCell.rowIndex && this.forcedValidationTooltipCell.columnIndex === warningCell.columnIndex) {
            this.forcedValidationTooltipCell = null;
            this.render();
          }
        }, 3e3);
      }
      this.props.onValidationError?.(issue);
      if (issue.level === "error") {
        strategy.onReject?.(cell, issue);
      } else if (issue.level === "warning") {
        strategy.onWarning?.(cell, issue);
      }
    } else {
      this.deleteValidationError(row, column.key);
    }
    return {
      valid: normalized.valid || normalized.level === "warning",
      issue
    };
  }
  addPendingValidation(cell) {
    const key = `${cell.rowIndex}-${cell.columnIndex}`;
    this.pendingValidationCells.add(key);
    this.startPendingAnimation();
  }
  removePendingValidation(cell) {
    const key = `${cell.rowIndex}-${cell.columnIndex}`;
    this.pendingValidationCells.delete(key);
    if (this.pendingValidationCells.size === 0) {
      this.stopPendingAnimation();
    }
  }
  startPendingAnimation() {
    if (this.pendingAnimationFrame !== null) return;
    const animate = () => {
      if (this.pendingValidationCells.size > 0) {
        this.render();
        this.pendingAnimationFrame = requestAnimationFrame(animate);
      } else {
        this.pendingAnimationFrame = null;
      }
    };
    this.pendingAnimationFrame = requestAnimationFrame(animate);
  }
  stopPendingAnimation() {
    if (this.pendingAnimationFrame !== null) {
      cancelAnimationFrame(this.pendingAnimationFrame);
      this.pendingAnimationFrame = null;
    }
  }
  deleteValidationError(row, columnKey) {
    const columnErrors = this.validationErrorRows.get(row);
    if (columnErrors) {
      columnErrors.delete(columnKey);
      if (columnErrors.size === 0) {
        this.validationErrorRows.delete(row);
      }
    }
    this.clearTooltipForValidation(row, columnKey);
  }
  clearTooltipForValidation(row, columnKey) {
    if (this.forcedValidationTooltipCell) {
      const fRow = this.dataManager.getRows()[this.forcedValidationTooltipCell.rowIndex];
      const fColumn = this.layoutManager.getLeafColumn(
        this.forcedValidationTooltipCell.columnIndex
      );
      if (fRow === row && fColumn?.key === columnKey) {
        this.forcedValidationTooltipCell = null;
      }
    }
  }
  async commitCellValue(cell, column, value) {
    const { valid } = await this.handleValidation(cell, column, value);
    if (!valid) return false;
    const row = this.dataManager.getRows()[cell.rowIndex];
    this.dataManager.updateCell(cell.rowIndex, column.key, value, getColumnField(column));
    this.refreshSummaryRowsAfterDataChange();
    const strategy = this.editorRegistry.getStrategy(column);
    strategy.onCommit?.(cell, value, row, column);
    return true;
  }
  /**
   * 统一的编辑器提交流程 — 交互式和 DOM 编辑器共用
   *
   * get column → await commitCellValue → if committed call callback → render
   */
  async handleEditorCommit(cell, value, callback) {
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (!column) {
      this.render();
      return false;
    }
    const strategy = this.editorRegistry.getStrategy(column);
    if (strategy.isInteractive) {
      const interactiveStrategy = strategy;
      if (interactiveStrategy.beforeInteract) {
        const row = this.dataManager.getRows()[cell.rowIndex];
        if (row && !interactiveStrategy.beforeInteract(cell, row, column)) {
          this.render();
          return false;
        }
      }
    }
    const committed = await this.commitCellValue(cell, column, value);
    if (committed) {
      callback?.(cell, value);
    }
    this.performRender();
    this.scheduledRender = null;
    return committed;
  }
  async validateEditorCommit(cell, value) {
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (!column) return true;
    const { valid } = await this.handleValidation(cell, column, value);
    if (valid) {
      this.clearValidationErrorForCell(cell);
      return true;
    }
    this.render();
    return false;
  }
  clearValidationErrorForCell(cell) {
    const row = this.dataManager.getRows()[cell.rowIndex];
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (row && column) {
      this.deleteValidationError(row, column.key);
    }
    this.render();
  }
  buildVisibleValidationErrorIndex() {
    const index = /* @__PURE__ */ new Map();
    const rows = this.dataManager.getRows();
    const visibleRange = this.layoutManager.getVisibleRange();
    const leafColumns = this.layoutManager.getLeafColumns();
    for (let rowIndex = visibleRange.startRow; rowIndex <= visibleRange.endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;
      const columnErrors = this.validationErrorRows.get(row);
      if (!columnErrors) continue;
      for (let columnIndex = 0; columnIndex < leafColumns.length; columnIndex++) {
        const column = leafColumns[columnIndex];
        if (!column) continue;
        const error = columnErrors.get(column.key);
        if (error) {
          index.set(`${rowIndex}-${columnIndex}`, error);
        }
      }
    }
    return index;
  }
  render() {
    if (this.isDestroyed) return;
    if (this.scheduledRender) {
      if (this.ctPerformanceEnabled) {
        this.ctCoalescedCount++;
      }
      return;
    }
    if (this.ctPerformanceEnabled) {
      this.ctScheduledAt = performance.now();
    }
    this.scheduledRender = () => {
      this.performRender();
      this.scheduledRender = null;
    };
    requestAnimationFrame(() => {
      if (this.scheduledRender) {
        if (this.ctPerformanceEnabled) {
          const now = performance.now();
          this.ctScheduledToStartDelay = this.ctScheduledAt ? now - this.ctScheduledAt : 0;
          this.ctRafInterval = this.ctLastRafTime ? now - this.ctLastRafTime : null;
          this.ctLastRafTime = now;
        }
        this.scheduledRender();
      }
    });
  }
  performRender() {
    const totalStart = this.ctPerformanceEnabled ? performance.now() : 0;
    if (this.ctPerformanceEnabled) {
      this.ctCurrentFramePhases.clear();
    }
    const { columns, rows, interactionState, scrollState } = this.measureCanvasPhase(
      "dataState",
      () => ({
        columns: this.dataManager.getColumns(),
        rows: this.dataManager.getRows(),
        interactionState: this.interactionManager.getInteractionState(),
        scrollState: this.interactionManager.getScrollState()
      })
    );
    const visibleRange = this.measureCanvasPhase("layoutUpdate", () => {
      this.layoutManager.setScrollPosition(scrollState.scrollLeft, scrollState.scrollTop);
      return this.layoutManager.getVisibleRange();
    });
    if (rows.length === 0) {
      this.measureCanvasPhase("rendererRender", () => {
        this.loadingOverlay.hide();
        this.renderer.renderEmptyState(
          this.props.emptyText ?? this.locale.emptyText,
          this.dataManager.getSort(),
          this.dataManager.getFilters(),
          interactionState.hoveredHeaderColumnKey,
          scrollState.scrollLeft
        );
      });
      this.measureCanvasPhase("overlays", () => {
        const filterDropdown = this.interactionManager.getFilterDropdown();
        if (filterDropdown) {
          this.renderer.renderFilterDropdown(filterDropdown);
        }
        this.renderer.renderWatermark();
      });
      this._recordCtFrame(totalStart);
      return;
    }
    if (this.dataManager.isLoading() || this.manualLoading) {
      this.measureCanvasPhase("rendererRender", () => {
        this.loadingOverlay.show(this.props.loadingText ?? this.locale.loadingText);
        this.renderer.renderWatermark();
      });
      this._recordCtFrame(totalStart);
      return;
    }
    this.loadingOverlay.hide();
    this.measureCanvasPhase("rendererRender", () => {
      this.renderer.render(
        columns,
        rows,
        visibleRange,
        scrollState.scrollLeft,
        scrollState.scrollTop,
        {
          hoveredCell: interactionState.hoveredCell,
          selectedCells: interactionState.selectedCells,
          editingCell: interactionState.editingCell,
          sortConfig: this.dataManager.getSort(),
          filterConfig: this.dataManager.getFilters(),
          showHeader: this.props.showHeader !== false,
          stripeRows: this.props.stripeRows !== false,
          dropdown: interactionState.dropdown,
          hoveredHeaderColumnKey: interactionState.hoveredHeaderColumnKey,
          switchAnimations: interactionState.switchAnimations,
          buttonHoverStates: interactionState.buttonHoverStates,
          columnReorderState: interactionState.columnReorderState,
          headerContextMenu: interactionState.headerContextMenu,
          hoveredImageIndex: this.interactionManager.getHoveredImageIndex(),
          hoveredButtonIndex: this.interactionManager.getHoveredButtonIndex(),
          progressDragState: interactionState.progressDragState,
          rowResizeState: interactionState.rowResizeState,
          validationErrors: this.buildVisibleValidationErrorIndex(),
          pendingValidations: this.pendingValidationCells
        }
      );
      this.interactionManager.setJSXInteractiveRegions(this.renderer.getJSXInteractiveRegions());
    });
    this.measureCanvasPhase("overlays", () => {
      const scrollbarState = this.interactionManager.getScrollbarState();
      this.renderer.renderScrollbars(
        scrollState.scrollLeft,
        scrollState.scrollTop,
        scrollState.maxScrollLeft,
        scrollState.maxScrollTop,
        scrollbarState
      );
      const validationTooltipCell = this.forcedValidationTooltipCell ?? interactionState.hoveredCell;
      const validationTooltip = this.getValidationTooltip(
        validationTooltipCell,
        scrollState.scrollLeft,
        scrollState.scrollTop
      );
      if (validationTooltip && interactionState.tooltip) {
        const normalCell = interactionState.tooltip.cell;
        const isSameCell = validationTooltip.cell.rowIndex === normalCell.rowIndex && validationTooltip.cell.columnIndex === normalCell.columnIndex;
        const validationText = validationTooltip.content.type === "text" ? validationTooltip.content.text : "";
        if (isSameCell && interactionState.tooltip.content.type === "text") {
          const normalText = interactionState.tooltip.content.text;
          this.renderer.renderTooltip({
            ...validationTooltip,
            content: {
              type: "text",
              text: validationText + "\n" + normalText
            }
          });
        } else {
          this.renderer.renderTooltip(validationTooltip);
        }
      } else if (validationTooltip) {
        this.renderer.renderTooltip(validationTooltip);
      } else if (interactionState.tooltip) {
        this.renderer.renderTooltip(interactionState.tooltip);
      }
      const filterDropdown = this.interactionManager.getFilterDropdown();
      if (filterDropdown) {
        this.renderer.renderFilterDropdown(filterDropdown);
      }
      const dateDropdown = this.interactionManager.getDateDropdown();
      if (dateDropdown) {
        this.renderer.renderDateDropdown(dateDropdown);
      }
      const colorDropdown = this.interactionManager.getColorDropdown();
      if (colorDropdown) {
        this.renderer.renderColorDropdown(colorDropdown);
      }
      const buttonsDropdown = this.interactionManager.getButtonsDropdown();
      if (buttonsDropdown) {
        this.renderer.renderButtonsDropdown(buttonsDropdown);
      }
      const imageTooltip = this.interactionManager.getImageTooltip();
      if (imageTooltip) {
        this.renderer.renderImageTooltip(imageTooltip);
      }
      const imageEditor = this.interactionManager.getImageEditor();
      if (imageEditor) {
        this.renderer.renderImageEditor(imageEditor);
      }
      const contextMenu = this.interactionManager.getContextMenu();
      if (contextMenu) {
        this.renderer.renderContextMenu(contextMenu);
      }
      this.renderer.renderWatermark();
    });
    this._recordCtFrame(totalStart);
  }
  /**
   * 记录 CanvasTable 帧统计
   */
  _recordCtFrame(totalStart) {
    if (!this.ctPerformanceEnabled) return;
    const now = performance.now();
    const totalTime = now - totalStart;
    const dataStateTime = this.ctCurrentFramePhases.get("dataState")?.totalTime ?? 0;
    const layoutUpdateTime = this.ctCurrentFramePhases.get("layoutUpdate")?.totalTime ?? 0;
    const rendererRenderTime = this.ctCurrentFramePhases.get("rendererRender")?.totalTime ?? 0;
    const overlaysTime = this.ctCurrentFramePhases.get("overlays")?.totalTime ?? 0;
    const nonRendererTime = Math.max(0, totalTime - rendererRenderTime);
    const phases = /* @__PURE__ */ new Map();
    for (const [name, stats] of this.ctCurrentFramePhases) {
      phases.set(name, { ...stats });
    }
    const frameEntry = {
      frameId: ++this.ctFrameCount,
      startTime: totalStart,
      scheduledAt: this.ctScheduledAt ?? 0,
      scheduledToStartDelay: this.ctScheduledToStartDelay,
      rafInterval: this.ctRafInterval,
      totalTime,
      dataStateTime,
      layoutUpdateTime,
      rendererRenderTime,
      overlaysTime,
      nonRendererTime,
      coalescedCount: this.ctCoalescedCount,
      phases,
      rendererFrame: this.renderer.getLastFrameDiagnostics()
    };
    this.ctFrameHistory.push(frameEntry);
    if (this.ctFrameHistory.length > CanvasTable.CT_MAX_FRAME_HISTORY) {
      this.ctFrameHistory.shift();
    }
    this.ctScheduledAt = null;
    this.ctScheduledToStartDelay = 0;
    this.ctRafInterval = null;
    this.ctCoalescedCount = 0;
  }
  resize() {
    if (this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || this.props.width || 800;
    const height = rect.height || this.props.height || 400;
    this.renderer.resize(width, height);
    this.layoutManager.setViewportSize(width, height);
    this.updateLayout();
    this.render();
  }
  setRows(rows) {
    this.dataManager.loadRows(rows).then(() => {
      this.interactionManager.setScrollPosition(0, 0);
      this.interactionManager.resetState();
      this.editorManager.destroy();
      this.renderer.clearImageCache();
      this.renderer.resetRowIds();
      this.renderCache.clear();
      this.updateLayout();
      this.render();
    }).catch((error) => {
      this.eventEmitter.emit(TableEvents.ERROR, error);
    });
  }
  getRows() {
    return this.dataManager.getRows();
  }
  getRow(rowIndex) {
    const rows = this.dataManager.getRows();
    return rows[rowIndex];
  }
  getColumns() {
    return this.dataManager.getColumns();
  }
  setColumns(columns) {
    this.dataManager.setColumns(columns);
    this.renderer.resetColumnIds();
    this.renderCache.clear();
    this.updateLayout();
    this.render();
  }
  async scrollToRow(rowIndex, column) {
    const scrollOffset = this.layoutManager.getScrollOffsetForRow(rowIndex);
    let scrollLeft = this.interactionManager.getScrollState().scrollLeft;
    if (column !== void 0) {
      scrollLeft = this.layoutManager.getScrollOffsetForColumn(column);
    }
    this.interactionManager.setScrollPosition(scrollLeft, scrollOffset);
    this.render();
  }
  scrollTo(scrollLeft, scrollTop) {
    this.interactionManager.setScrollPosition(scrollLeft, scrollTop);
    this.render();
  }
  getScrollPosition() {
    const state = this.interactionManager.getScrollState();
    return {
      scrollLeft: state.scrollLeft,
      scrollTop: state.scrollTop
    };
  }
  getSelectedCells() {
    return this.interactionManager.getSelectedCells();
  }
  getSelectedRows() {
    return this.interactionManager.getSelectedRows();
  }
  getPinnedRows(position) {
    return position === "top" ? this.rowPinManager.getTopRows() : this.rowPinManager.getBottomRows();
  }
  setSelectedCells(cells) {
    this.interactionManager.setSelectedCells(cells);
    this.render();
  }
  setSelectedRows(rows) {
    rows.forEach((rowIndex) => {
      this.dataManager.setRowSelected(rowIndex, true);
    });
    this.render();
  }
  clearSelection() {
    this.interactionManager.clearSelection();
    this.dataManager.selectAll(false);
    this.render();
  }
  async updateCell(rowIndex, column, value) {
    const columnDef = this.layoutManager.getColumnByKey(column);
    const columnIndex = this.layoutManager.getLeafColumnIndexByKey(column);
    if (columnDef && columnIndex !== null) {
      if (!await this.commitCellValue({ rowIndex, columnIndex }, columnDef, value)) {
        this.render();
        return;
      }
    } else {
      const change2 = this.dataManager.updateCell(rowIndex, column, value);
      this.eventEmitter.emit(TableEvents.CHANGE, [change2]);
      this.refreshSummaryRowsAfterDataChange();
      this.render();
      return;
    }
    const row = this.dataManager.getRows()[rowIndex];
    const dataField = getColumnField(columnDef);
    const change = {
      type: "update",
      rowIndex,
      column: dataField,
      newValue: row?.data[dataField]
    };
    this.eventEmitter.emit(TableEvents.CHANGE, [change]);
    this.render();
  }
  async updateRow(rowIndex, data) {
    const leafColumns = this.layoutManager.getLeafColumns();
    for (let columnIndex = 0; columnIndex < leafColumns.length; columnIndex++) {
      const column = leafColumns[columnIndex];
      if (!column) continue;
      const field = getColumnField(column);
      const hasFieldValue = Object.prototype.hasOwnProperty.call(data, field);
      const hasKeyValue = Object.prototype.hasOwnProperty.call(data, column.key);
      if (!hasFieldValue && !hasKeyValue) {
        continue;
      }
      const value = hasFieldValue ? data[field] : data[column.key];
      const cell = { rowIndex, columnIndex };
      const validation = await this.handleValidation(cell, column, value);
      if (!validation.valid) {
        this.render();
        return;
      }
    }
    const changes = this.dataManager.updateRow(rowIndex, data);
    this.eventEmitter.emit(TableEvents.CHANGE, changes);
    this.refreshSummaryRowsAfterDataChange();
    this.render();
  }
  getValidationErrors() {
    const errors = [];
    const rows = this.dataManager.getRows();
    for (const row of rows) {
      const columnErrors = this.validationErrorRows.get(row);
      if (columnErrors) {
        for (const error of columnErrors.values()) {
          errors.push(error);
        }
      }
    }
    return errors;
  }
  getValidationError(cell) {
    const row = this.dataManager.getRows()[cell.rowIndex];
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (!row || !column) return null;
    return this.validationErrorRows.get(row)?.get(column.key) ?? null;
  }
  clearValidationErrors() {
    this.validationErrorRows = /* @__PURE__ */ new WeakMap();
    this.forcedValidationTooltipCell = null;
    this.render();
  }
  getValidationTooltip(hoveredCell, scrollLeft, scrollTop) {
    if (!hoveredCell) {
      return null;
    }
    const error = this.getValidationError(hoveredCell);
    if (!error) {
      return null;
    }
    const column = this.layoutManager.getLeafColumn(hoveredCell.columnIndex);
    const cellPosition = this.layoutManager.getCellPosition(
      hoveredCell.rowIndex,
      hoveredCell.columnIndex
    );
    const x = column?.fixed === "left" || column?.fixed === "right" ? cellPosition.x : cellPosition.x - scrollLeft;
    return {
      cell: hoveredCell,
      x,
      y: cellPosition.y - scrollTop,
      width: cellPosition.width,
      content: { type: "text", text: error.message }
    };
  }
  addRow(data, index) {
    const change = this.dataManager.addRow(data, index);
    this.eventEmitter.emit(TableEvents.CHANGE, [change]);
    this.updateLayout();
    this.render();
  }
  deleteRow(rowIndex) {
    const change = this.dataManager.deleteRow(rowIndex);
    this.eventEmitter.emit(TableEvents.CHANGE, [change]);
    this.updateLayout();
    this.render();
  }
  /**
   * 追加数据行（用于懒加载）
   * @param rows 要追加的行数据
   */
  appendRows(rows) {
    const currentRows = this.dataManager.getAllRows();
    this.dataManager.setRows([...currentRows, ...rows]);
    this.interactionManager.setLoadingMore(false);
    this.updateLayout();
    this.render();
  }
  /**
   * 设置加载更多状态
   * @param loading 是否正在加载
   */
  setLoadingMore(loading) {
    this.interactionManager.setLoadingMore(loading);
  }
  /**
   * 设置是否还有更多数据
   * @param hasMore 是否还有更多数据，false 表示加载完成
   */
  setHasMore(hasMore) {
    this.interactionManager.setHasMore(hasMore);
  }
  /**
   * 显示 loading overlay
   * @param text 可选的 loading 文本
   */
  showLoading(text) {
    this.manualLoading = true;
    this.loadingOverlay.show(text ?? this.props.loadingText ?? this.locale.loadingText);
    this.render();
  }
  /**
   * 隐藏 loading overlay
   */
  hideLoading() {
    this.manualLoading = false;
    this.loadingOverlay.hide();
    this.render();
  }
  sort(configs) {
    this.dataManager.sort(configs);
    this.interactionManager.setSortConfig(configs);
    this.eventEmitter.emit(TableEvents.SORT, configs);
    this.updateLayout();
    this.render();
  }
  filter(filters) {
    this.dataManager.filter(filters);
    this.interactionManager.setFilterConfig(filters);
    this.eventEmitter.emit(TableEvents.FILTER, filters);
    this.updateLayout();
    this.render();
  }
  clearFilters() {
    this.dataManager.clearFilters();
    this.interactionManager.setFilterConfig([]);
    this.eventEmitter.emit(TableEvents.FILTER, []);
    this.updateLayout();
    this.render();
  }
  async export(options) {
    switch (options.format) {
      case "csv":
        return new Blob(
          [
            arrayToCsv(
              this.dataManager.exportData({
                includeHeaders: options.includeHeaders ?? true,
                includeHidden: options.includeHidden ?? false,
                selectedOnly: options.selectedOnly ?? false,
                showRowNumbers: this.props.showRowNumbers === true
              })
            )
          ],
          { type: "text/csv" }
        );
      case "json":
        return new Blob(
          [
            JSON.stringify(
              this.dataManager.exportData({
                includeHeaders: options.includeHeaders ?? true,
                includeHidden: options.includeHidden ?? false,
                selectedOnly: options.selectedOnly ?? false,
                showRowNumbers: this.props.showRowNumbers === true
              }),
              null,
              2
            )
          ],
          { type: "application/json" }
        );
      case "excel": {
        this.updateSummaryRows();
        const rowBands = this.layoutManager.getRowBandsForRender();
        const context = this.dataManager.getExportContext({
          includeHeaders: options.includeHeaders ?? true,
          includeHidden: options.includeHidden ?? false,
          selectedOnly: options.selectedOnly ?? false,
          showRowNumbers: this.props.showRowNumbers === true
        });
        const model = buildExcelExportModel(
          {
            ...context,
            summaryTopRows: rowBands.summaryTop.rows,
            summaryBottomRows: rowBands.summaryBottom.rows
          },
          options.excel,
          options.filename?.replace(/\.[^.]+$/, "") ?? "Sheet1"
        );
        return createXlsxBlobFromModel(model);
      }
      default:
        return new Blob(
          [
            arrayToCsv(
              this.dataManager.exportData({
                includeHeaders: options.includeHeaders ?? true,
                includeHidden: options.includeHidden ?? false,
                selectedOnly: options.selectedOnly ?? false,
                showRowNumbers: this.props.showRowNumbers === true
              })
            )
          ],
          { type: "text/csv" }
        );
    }
  }
  // === 历史记录方法 ===
  /**
   * 撤销上一步操作
   * @returns 是否撤销成功
   */
  undo() {
    const result = this.dataManager.undo();
    if (result) {
      this.updateLayout();
      this.render();
    }
    return result;
  }
  /**
   * 是否可以撤销
   */
  canUndo() {
    return this.dataManager.canUndo();
  }
  /**
   * 重做上一步撤销的操作
   * @returns 是否重做成功
   */
  redo() {
    const result = this.dataManager.redo();
    if (result) {
      this.updateLayout();
      this.render();
    }
    return result;
  }
  /**
   * 是否可以重做
   */
  canRedo() {
    return this.dataManager.canRedo();
  }
  /**
   * 获取历史记录数量
   */
  getHistoryLength() {
    return this.dataManager.getHistoryLength();
  }
  /**
   * 清空历史记录
   */
  clearHistory() {
    this.dataManager.clearHistory();
  }
  /**
   * 设置历史记录配置
   */
  setHistoryOptions(options) {
    this.dataManager.setHistoryOptions(options);
  }
  hideColumn(columnKey) {
    this.hideColumnInternal(columnKey);
  }
  showColumn(columnKey) {
    this.showColumnInternal(columnKey);
  }
  showColumnInternal(columnKey) {
    const columns = this.dataManager.getColumns();
    const parentKeys = [];
    const findColumnAndParents = (cols, parents = []) => {
      for (const col of cols) {
        if (col.key === columnKey) {
          for (const parent of parents) {
            parentKeys.push(parent.key);
          }
          return true;
        }
        if (col.children && findColumnAndParents(col.children, [...parents, col])) {
          return true;
        }
      }
      return false;
    };
    const findAdjacentFixed = (cols, targetKey) => {
      let prevFixed;
      let nextFixed;
      let foundTarget = false;
      const traverse = (columns2) => {
        for (const col of columns2) {
          if (foundTarget && nextFixed === void 0 && !col.hidden) {
            if (col.fixed === "left" || col.fixed === "right") {
              nextFixed = col.fixed;
            }
          }
          if (col.key === targetKey) {
            foundTarget = true;
          }
          if (!foundTarget && !col.hidden && col.key !== targetKey) {
            if (col.fixed === "left" || col.fixed === "right") {
              prevFixed = col.fixed;
            }
          }
          if (col.children) {
            traverse(col.children);
          }
          if (foundTarget && nextFixed !== void 0) {
            return;
          }
        }
      };
      traverse(cols);
      return { prevFixed, nextFixed };
    };
    const setColumnVisible = (cols) => {
      for (const col of cols) {
        if (col.key === columnKey || parentKeys.includes(col.key)) {
          col.hidden = false;
          if (col.key === columnKey && col.fixed === void 0) {
            const { prevFixed, nextFixed } = findAdjacentFixed(columns, columnKey);
            if (prevFixed !== void 0 && prevFixed === nextFixed) {
              col.fixed = prevFixed;
            }
          }
          const showChildren = (children) => {
            for (const child of children) {
              child.hidden = false;
              if (child.children) {
                showChildren(child.children);
              }
            }
          };
          if (col.children) {
            showChildren(col.children);
          }
          return true;
        }
        if (col.children && setColumnVisible(col.children)) {
          return true;
        }
      }
      return false;
    };
    findColumnAndParents(columns);
    if (setColumnVisible(columns)) {
      this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns());
      this.updateSummaryRows();
      this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      );
      this.render();
      if (this.props.onColumnShow) {
        this.props.onColumnShow(columnKey);
      }
    }
  }
  hideColumnInternal(columnKey) {
    const columns = this.dataManager.getColumns();
    const hideColumnAndChildren = (col) => {
      col.hidden = true;
      if (col.children) {
        for (const child of col.children) {
          hideColumnAndChildren(child);
        }
      }
    };
    const findAndHideColumn = (cols) => {
      for (const col of cols) {
        if (col.key === columnKey) {
          hideColumnAndChildren(col);
          return true;
        }
        if (col.children && findAndHideColumn(col.children)) {
          return true;
        }
      }
      return false;
    };
    if (findAndHideColumn(columns)) {
      this.updateSummaryRows();
      this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns());
      this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      );
      this.render();
      if (this.props.onColumnHide) {
        this.props.onColumnHide(columnKey);
      }
    }
  }
  getViewConfig() {
    const columns = this.dataManager.getColumns();
    const columnWidths = {};
    columns.forEach((col, index) => {
      columnWidths[col.key] = this.layoutManager.getColumnWidthByIndex(index);
    });
    const collectHiddenColumns = (cols) => {
      const hidden = [];
      for (const col of cols) {
        if (col.hidden) {
          hidden.push(col.key);
        }
        if (col.children) {
          hidden.push(...collectHiddenColumns(col.children));
        }
      }
      return hidden;
    };
    return {
      columnWidths,
      columnOrder: columns.map((c) => c.key),
      hiddenColumns: collectHiddenColumns(columns),
      fixedColumns: { left: [], right: [] },
      sort: this.dataManager.getSort(),
      filters: this.dataManager.getFilters()
    };
  }
  setViewConfig(config) {
    if (config.sort) {
      this.dataManager.sort(config.sort);
    }
    if (config.filters) {
      this.dataManager.filter(config.filters);
    }
    if (config.hiddenColumns) {
      const columns = this.dataManager.getColumns();
      const setHidden = (cols, hiddenKeys) => {
        for (const col of cols) {
          col.hidden = hiddenKeys.includes(col.key);
          if (col.children) {
            setHidden(col.children, hiddenKeys);
          }
        }
      };
      setHidden(columns, config.hiddenColumns);
    }
    this.updateLayout();
    this.render();
  }
  setLocale(locale) {
    this.props = { ...this.props, locale };
    this.locale = resolveLocale(locale);
    this.loadingOverlay.setConfig({
      text: this.props.loadingText ?? this.locale.loadingText
    });
    this.renderer.setLocale(this.locale);
    this.interactionManager.setLocale(this.locale);
    this.filterInputManager.setLocale(this.locale);
    this.render();
  }
  getLocale() {
    return this.locale;
  }
  refresh() {
    this.updateLayout();
    this.render();
  }
  createDefaultRowData(columns) {
    const emptyRow = {};
    for (const col of columns) {
      const field = getColumnField(col);
      switch (col.type) {
        case "number":
          emptyRow[field] = 0;
          break;
        case "checkbox":
        case "switch":
          emptyRow[field] = false;
          break;
        case "date":
          emptyRow[field] = "";
          break;
        default:
          emptyRow[field] = "";
      }
    }
    return emptyRow;
  }
  getCanvas() {
    return this.canvas;
  }
  getLayoutInfo() {
    return this.layoutManager.getLayoutInfo();
  }
  getTheme() {
    return { ...this.theme };
  }
  getThemeMode() {
    return this.themeMode;
  }
  setThemeMode(mode) {
    if (this.themeMode === mode) return;
    const wasAuto = this.themeMode === "auto";
    const isAuto = mode === "auto";
    this.themeMode = mode;
    if (wasAuto && !isAuto) {
      this.teardownAutoThemeDetection();
    } else if (!wasAuto && isAuto) {
      this.setupAutoThemeDetection();
    }
    this.theme = this.resolveTheme();
    this.applyTheme();
    this.render();
  }
  setTheme(theme) {
    this.theme = this.resolveTheme(theme);
    this.applyTheme();
    this.render();
  }
  setWatermark(config) {
    this.renderer.setWatermarkConfig(config);
    this.render();
  }
  /**
   * 设置图片加载配置
   */
  setImageLoadConfig(config) {
    this.renderer.setImageLoadConfig(config);
  }
  /**
   * 获取图片加载队列统计信息
   */
  getImageLoadStats() {
    return this.renderer.getImageLoadStats();
  }
  setExpandColumnKey(key) {
    this.renderer.setExpandColumnKey(key);
    this.interactionManager.setExpandColumnKey(key);
    this.render();
  }
  resolveTheme(customTheme) {
    let baseTheme;
    if (this.themeMode === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      baseTheme = isDark ? DARK_THEME : DEFAULT_THEME;
    } else if (this.themeMode === "dark") {
      baseTheme = DARK_THEME;
    } else {
      baseTheme = DEFAULT_THEME;
    }
    const mergedCustomTheme = customTheme ?? this.props.theme;
    if (mergedCustomTheme) {
      return {
        ...baseTheme,
        ...mergedCustomTheme,
        colors: {
          ...baseTheme.colors,
          ...mergedCustomTheme.colors,
          tagColors: {
            ...baseTheme.colors.tagColors,
            ...mergedCustomTheme.colors?.tagColors
          },
          date: {
            ...baseTheme.colors.date,
            ...mergedCustomTheme.colors?.date
          },
          input: {
            ...baseTheme.colors.input,
            ...mergedCustomTheme.colors?.input
          },
          checkbox: {
            ...baseTheme.colors.checkbox,
            ...mergedCustomTheme.colors?.checkbox
          },
          radio: {
            ...baseTheme.colors.radio,
            ...mergedCustomTheme.colors?.radio
          },
          button: {
            ...baseTheme.colors.button,
            ...mergedCustomTheme.colors?.button
          },
          dropdown: {
            ...baseTheme.colors.dropdown,
            ...mergedCustomTheme.colors?.dropdown
          },
          scrollbar: {
            ...baseTheme.colors.scrollbar,
            ...mergedCustomTheme.colors?.scrollbar
          },
          indicator: {
            ...baseTheme.colors.indicator,
            ...mergedCustomTheme.colors?.indicator
          },
          tooltip: {
            ...baseTheme.colors.tooltip,
            ...mergedCustomTheme.colors?.tooltip
          },
          image: {
            ...baseTheme.colors.image,
            ...mergedCustomTheme.colors?.image
          },
          hiddenPlaceholder: {
            ...baseTheme.colors.hiddenPlaceholder,
            ...mergedCustomTheme.colors?.hiddenPlaceholder
          },
          moreCount: {
            ...baseTheme.colors.moreCount,
            ...mergedCustomTheme.colors?.moreCount
          },
          shadow: {
            ...baseTheme.colors.shadow,
            ...mergedCustomTheme.colors?.shadow
          },
          watermark: {
            ...baseTheme.colors.watermark,
            ...mergedCustomTheme.colors?.watermark
          }
        },
        font: {
          ...baseTheme.font,
          ...mergedCustomTheme.font
        },
        row: {
          ...baseTheme.row,
          ...mergedCustomTheme.row
        },
        border: {
          ...baseTheme.border,
          ...mergedCustomTheme.border
        }
      };
    }
    return { ...baseTheme };
  }
  applyTheme() {
    this.layoutManager.setTheme(this.theme);
    this.renderer.setTheme(this.theme);
    this.editorManager.setTheme(this.theme);
    this.filterInputManager.setTheme(this.theme);
    this.loadingOverlay.setTheme(this.theme);
  }
  setupAutoThemeDetection() {
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQuery.addEventListener("change", this.handleThemeChange);
  }
  teardownAutoThemeDetection() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener("change", this.handleThemeChange);
      this.mediaQuery = null;
    }
  }
  handleThemeChange = () => {
    if (this.themeMode !== "auto") return;
    this.theme = this.resolveTheme();
    this.applyTheme();
    this.render();
  };
  // 性能监控 API
  /**
   * 测量 CanvasTable 阶段时间的辅助方法
   */
  measureCanvasPhase(name, fn) {
    if (!this.ctPerformanceEnabled) {
      return fn();
    }
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    const stats = this.ctCurrentFramePhases.get(name) ?? { totalTime: 0, count: 0, maxTime: 0 };
    stats.totalTime += duration;
    stats.count++;
    stats.maxTime = Math.max(stats.maxTime, duration);
    this.ctCurrentFramePhases.set(name, stats);
    return result;
  }
  /**
   * 启用或禁用性能监控
   * @param enabled 是否启用
   */
  setPerformanceMonitoring(enabled) {
    this.renderer.setPerformanceMonitoring(enabled);
    this.ctPerformanceEnabled = enabled;
  }
  /**
   * 检查性能监控是否启用
   */
  isPerformanceMonitoringEnabled() {
    return this.renderer.isPerformanceMonitoringEnabled();
  }
  /**
   * 获取性能统计报告
   */
  getPerformanceReport() {
    const lines = [
      "=== CanvasTable Performance Report ===",
      `Status: ${this.ctPerformanceEnabled ? "Enabled" : "Disabled"}`
    ];
    const rendererDiagnostics = this.renderer.getPerformanceDiagnostics();
    const hasData = this.ctFrameHistory.length > 0 || rendererDiagnostics.frameHistory.length > 0;
    if (!hasData) {
      lines.push("");
      lines.push("No performance data collected yet.");
      lines.push("Try scrolling the table while monitoring is enabled.");
      return lines.join("\n");
    }
    lines.push("");
    lines.push("=== SUMMARY ===");
    lines.push("-".repeat(70));
    const retainedFrames = this.ctFrameHistory.length;
    const avgCtFrameTime = retainedFrames > 0 ? this.ctFrameHistory.reduce((sum, f) => sum + f.totalTime, 0) / retainedFrames : 0;
    const worstFrameTotal = retainedFrames > 0 ? Math.max(...this.ctFrameHistory.map((f) => f.totalTime)) : 0;
    const countSlowFrames = (threshold) => this.ctFrameHistory.filter((f) => f.totalTime > threshold).length;
    const rafSamples = this.ctFrameHistory.map((f) => f.rafInterval).filter((v) => v !== null && Number.isFinite(v));
    const avgRafInterval = rafSamples.length > 0 ? rafSamples.reduce((sum, v) => sum + v, 0) / rafSamples.length : null;
    const worstRafInterval = rafSamples.length > 0 ? Math.max(...rafSamples) : null;
    const estimatedFps = avgRafInterval && avgRafInterval > 0 ? 1e3 / avgRafInterval : null;
    const worstFps = worstRafInterval && worstRafInterval > 0 ? 1e3 / worstRafInterval : null;
    lines.push(`Captured CanvasTable Frames: ${this.ctFrameCount}`);
    lines.push(
      `Retained CanvasTable Frames: ${retainedFrames} (last ${CanvasTable.CT_MAX_FRAME_HISTORY} max)`
    );
    lines.push(`Average CanvasTable Frame Time: ${avgCtFrameTime.toFixed(2)}ms (retained)`);
    lines.push(`Worst Frame Total: ${worstFrameTotal.toFixed(2)}ms (retained)`);
    lines.push(`Slow Retained Frames >16.7ms: ${countSlowFrames(16.7)}`);
    lines.push(`Slow Retained Frames >33.3ms: ${countSlowFrames(33.3)}`);
    lines.push(`Slow Retained Frames >50ms: ${countSlowFrames(50)}`);
    lines.push(`Slow Retained Frames >100ms: ${countSlowFrames(100)}`);
    lines.push(
      `RAF Interval (retained samples=${rafSamples.length}): avg ${avgRafInterval !== null ? `${avgRafInterval.toFixed(2)}ms` : "N/A"}, worst ${worstRafInterval !== null ? `${worstRafInterval.toFixed(2)}ms` : "N/A"}`
    );
    lines.push(
      `Estimated FPS: avg ${estimatedFps !== null ? estimatedFps.toFixed(1) : "N/A"}, worst ${worstFps !== null ? worstFps.toFixed(1) : "N/A"}`
    );
    lines.push("");
    lines.push("=== WORST FRAME DETAILS ===");
    lines.push("-".repeat(70));
    const ctWorstFrame = this.getCtWorstFrameDiagnostics();
    if (ctWorstFrame) {
      lines.push(`[CanvasTable]`);
      lines.push(`  Total Time:        ${ctWorstFrame.totalTime.toFixed(2)}ms`);
      lines.push(`  Renderer Time:     ${ctWorstFrame.rendererRenderTime.toFixed(2)}ms`);
      lines.push(`  Non-Renderer Time: ${ctWorstFrame.nonRendererTime.toFixed(2)}ms`);
      lines.push(`  Data State:        ${ctWorstFrame.dataStateTime.toFixed(2)}ms`);
      lines.push(`  Layout Update:     ${ctWorstFrame.layoutUpdateTime.toFixed(2)}ms`);
      lines.push(`  Overlays:          ${ctWorstFrame.overlaysTime.toFixed(2)}ms`);
      lines.push(`  RAF Interval:      ${ctWorstFrame.rafInterval?.toFixed(2) ?? "N/A"}ms`);
      lines.push(`  Scheduled Delay:   ${ctWorstFrame.scheduledToStartDelay.toFixed(2)}ms`);
      lines.push(`  Coalesced Count:   ${ctWorstFrame.coalescedCount}`);
      const matchedRendererFrame = ctWorstFrame.rendererFrame;
      if (matchedRendererFrame) {
        lines.push("");
        lines.push(`[Renderer - matching CanvasTable worst frame]`);
        lines.push(`  Total Time:        ${matchedRendererFrame.totalTime.toFixed(2)}ms`);
        lines.push(`  Cell Render Time:  ${matchedRendererFrame.cellRenderTime.toFixed(2)}ms`);
        lines.push(`  Non-Cell Time:     ${matchedRendererFrame.nonCellRendererTime.toFixed(2)}ms`);
        lines.push(`  Unaccounted Time:  ${matchedRendererFrame.unaccountedTime.toFixed(2)}ms`);
        lines.push(`  Visible Rows:      ${matchedRendererFrame.visibleRows}`);
        lines.push(`  Visible Columns:   ${matchedRendererFrame.visibleColumns}`);
        lines.push(`  Visible Cells:     ${matchedRendererFrame.visibleCells}`);
        lines.push(`  Scroll Top:        ${matchedRendererFrame.scrollTop.toFixed(0)}`);
        lines.push(`  Scroll Left:       ${matchedRendererFrame.scrollLeft.toFixed(0)}`);
      }
    }
    const rendererFrameForBreakdown = ctWorstFrame?.rendererFrame ?? rendererDiagnostics.worstFrame ?? rendererDiagnostics.lastFrame;
    const rendererFrameLabel = ctWorstFrame?.rendererFrame ? "Matching CanvasTable Worst Frame" : "Renderer Worst/Last Frame";
    const rendererFrames = rendererDiagnostics.frameHistory ?? [];
    const formatCellLocation = (location) => {
      if (!location) return "row: N/A col: N/A xy: N/A";
      return `row: ${location.rowIndex ?? "N/A"} col: ${location.colIndex ?? "N/A"} xy: (${location.x.toFixed(0)},${location.y.toFixed(0)}) size: ${location.width.toFixed(0)}x${location.height.toFixed(0)}`;
    };
    const formatRowBandDetails = (details, totalTime, indent = "  ") => {
      if (!details || details.size === 0) return [];
      return Array.from(details.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        avg: stats.count > 0 ? stats.totalTime / stats.count : 0,
        percentage: totalTime > 0 ? stats.totalTime / totalTime * 100 : 0
      })).sort((a, b) => b.totalTime - a.totalTime).slice(0, 24).map((detail) => {
        const column = detail.columnKey ? ` | column: ${detail.columnKey}` : "";
        const location = detail.maxAt ? ` | maxAt: ${formatCellLocation(detail.maxAt)}` : "";
        return `${indent}${detail.name.padEnd(42)} | calls: ${detail.count.toString().padStart(5)} | avg: ${detail.avg.toFixed(3).padStart(7)}ms | max: ${detail.maxTime.toFixed(3).padStart(7)}ms | total: ${detail.totalTime.toFixed(2).padStart(8)}ms | ${detail.percentage.toFixed(1).padStart(5)}%` + column + location;
      });
    };
    const aggregatePhases = /* @__PURE__ */ new Map();
    for (const frame of rendererFrames) {
      for (const [name, stats] of frame.phases.entries()) {
        const aggregate = aggregatePhases.get(name) ?? { totalTime: 0, count: 0, maxTime: 0 };
        aggregate.totalTime += stats.totalTime;
        aggregate.count += stats.count;
        aggregate.maxTime = Math.max(aggregate.maxTime, stats.maxTime);
        aggregatePhases.set(name, aggregate);
      }
    }
    if (aggregatePhases.size > 0) {
      lines.push("");
      lines.push(
        "=== AGGREGATE RENDERER PHASE BREAKDOWN (All Retained Renderer Frames; last 120 max) ==="
      );
      lines.push(`Retained Renderer Frames: ${rendererFrames.length}`);
      lines.push("-".repeat(86));
      const phases = Array.from(aggregatePhases.entries()).map(([name, stats]) => ({
        name,
        totalTime: stats.totalTime,
        maxTime: stats.maxTime,
        count: stats.count,
        avg: stats.count > 0 ? stats.totalTime / stats.count : 0
      })).sort((a, b) => b.totalTime - a.totalTime);
      for (const phase of phases) {
        lines.push(
          `${phase.name.padEnd(25)} | calls: ${phase.count.toString().padStart(6)} | avg: ${phase.avg.toFixed(3).padStart(7)}ms | max: ${phase.maxTime.toFixed(3).padStart(7)}ms | total: ${phase.totalTime.toFixed(2).padStart(8)}ms`
        );
      }
      const aggregateRowBandDetails = /* @__PURE__ */ new Map();
      for (const frame of rendererFrames) {
        for (const [name, stats] of frame.rowBandDetails?.entries() ?? []) {
          const aggregate = aggregateRowBandDetails.get(name) ?? {
            totalTime: 0,
            count: 0,
            maxTime: 0
          };
          aggregate.totalTime += stats.totalTime;
          aggregate.count += stats.count;
          if (stats.maxTime > aggregate.maxTime) {
            aggregate.maxTime = stats.maxTime;
            aggregate.maxAt = stats.maxAt ? { ...stats.maxAt } : void 0;
            aggregate.columnKey = stats.columnKey;
          }
          aggregateRowBandDetails.set(name, aggregate);
        }
      }
      if (aggregateRowBandDetails.size > 0) {
        const rowBandsTotal = aggregatePhases.get("rowBands")?.totalTime ?? 0;
        const rowBandsFixedTotal = aggregatePhases.get("rowBandsFixed")?.totalTime ?? 0;
        lines.push("");
        lines.push("  rowBands detail (aggregate, top 24):");
        lines.push(
          ...formatRowBandDetails(
            aggregateRowBandDetails,
            rowBandsTotal + rowBandsFixedTotal,
            "    "
          )
        );
      }
    }
    const aggregateCells = /* @__PURE__ */ new Map();
    for (const frame of rendererFrames) {
      for (const [type, byKey] of frame.cellsByType.entries()) {
        let aggregateByKey = aggregateCells.get(type);
        if (!aggregateByKey) {
          aggregateByKey = /* @__PURE__ */ new Map();
          aggregateCells.set(type, aggregateByKey);
        }
        for (const [columnKey, stats] of byKey.entries()) {
          const aggregate = aggregateByKey.get(columnKey) ?? { totalTime: 0, count: 0, maxTime: 0 };
          aggregate.totalTime += stats.totalTime;
          aggregate.count += stats.count;
          if (stats.maxTime > aggregate.maxTime) {
            aggregate.maxTime = stats.maxTime;
            aggregate.maxCell = stats.maxCell ? { ...stats.maxCell } : void 0;
          }
          aggregateByKey.set(columnKey, aggregate);
        }
      }
    }
    if (aggregateCells.size > 0) {
      lines.push("");
      lines.push(
        "=== AGGREGATE CELL RENDERER BREAKDOWN (All Retained Renderer Frames; last 120 max) ==="
      );
      lines.push(`Retained Renderer Frames: ${rendererFrames.length}`);
      lines.push("-".repeat(92));
      const allCells = [];
      for (const [type, byKey] of aggregateCells.entries()) {
        for (const [columnKey, stats] of byKey.entries()) {
          allCells.push({ type, columnKey, ...stats });
        }
      }
      allCells.sort((a, b) => b.totalTime - a.totalTime);
      for (const cell of allCells) {
        const avg = cell.count > 0 ? cell.totalTime / cell.count : 0;
        lines.push(
          `${`${cell.type}/${cell.columnKey}`.padEnd(30)} | totalCalls: ${cell.count.toString().padStart(6)} | avg: ${avg.toFixed(3).padStart(7)}ms | maxCell: ${cell.maxTime.toFixed(3).padStart(7)}ms | total: ${cell.totalTime.toFixed(2).padStart(8)}ms | maxAt: ${formatCellLocation(cell.maxCell)}`
        );
      }
    }
    if (rendererFrameForBreakdown && rendererFrameForBreakdown.phases.size > 0) {
      lines.push("");
      lines.push(
        `=== RENDERER PHASE BREAKDOWN (${rendererFrameLabel}; calls are this frame only) ===`
      );
      lines.push(`Frame ID: ${rendererFrameForBreakdown.frameId}`);
      lines.push("-".repeat(86));
      const phaseEntries = Array.from(
        rendererFrameForBreakdown.phases
      );
      const phases = phaseEntries.map(([name, stats]) => ({
        name,
        totalTime: stats.totalTime,
        maxTime: stats.maxTime,
        count: stats.count,
        percentage: rendererFrameForBreakdown.totalTime > 0 ? stats.totalTime / rendererFrameForBreakdown.totalTime * 100 : 0
      })).sort((a, b) => b.totalTime - a.totalTime);
      for (const phase of phases) {
        lines.push(
          `${phase.name.padEnd(25)} | calls/frame: ${phase.count.toString().padStart(3)} | max: ${phase.maxTime.toFixed(2).padStart(7)}ms | total: ${phase.totalTime.toFixed(2).padStart(7)}ms | ${phase.percentage.toFixed(1).padStart(5)}%`
        );
      }
      if (rendererFrameForBreakdown.rowBandDetails && rendererFrameForBreakdown.rowBandDetails.size > 0) {
        const rowBandsTotal = rendererFrameForBreakdown.phases.get("rowBands")?.totalTime ?? 0;
        const rowBandsFixedTotal = rendererFrameForBreakdown.phases.get("rowBandsFixed")?.totalTime ?? 0;
        lines.push("");
        lines.push("  rowBands detail (matching frame, top 24):");
        lines.push(
          ...formatRowBandDetails(
            rendererFrameForBreakdown.rowBandDetails,
            rowBandsTotal + rowBandsFixedTotal,
            "    "
          )
        );
      }
    }
    if (rendererFrameForBreakdown && rendererFrameForBreakdown.cellsByType.size > 0) {
      lines.push("");
      lines.push(
        `=== CELL RENDERER BREAKDOWN (${rendererFrameLabel}; calls are this frame only) ===`
      );
      lines.push(`Frame ID: ${rendererFrameForBreakdown.frameId}`);
      lines.push("-".repeat(92));
      const allCells = [];
      const cellsByType = rendererFrameForBreakdown.cellsByType;
      for (const [type, byKey] of cellsByType.entries()) {
        for (const [columnKey, stats] of byKey.entries()) {
          allCells.push({ type, columnKey, ...stats });
        }
      }
      allCells.sort((a, b) => b.totalTime - a.totalTime);
      for (const cell of allCells) {
        const avg = cell.count > 0 ? cell.totalTime / cell.count : 0;
        lines.push(
          `${`${cell.type}/${cell.columnKey}`.padEnd(30)} | calls/frame: ${cell.count.toString().padStart(4)} | avg: ${avg.toFixed(3).padStart(7)}ms | maxCell: ${cell.maxTime.toFixed(3).padStart(7)}ms | total: ${cell.totalTime.toFixed(2).padStart(6)}ms | maxAt: ${formatCellLocation(cell.maxCell)}`
        );
      }
    }
    if (this.ctFrameHistory.length > 0) {
      lines.push("");
      lines.push("=== TOP 10 SLOW CANVASTABLE FRAMES ===");
      lines.push("-".repeat(70));
      const topSlow = [...this.ctFrameHistory].sort((a, b) => b.totalTime - a.totalTime).slice(0, 10);
      lines.push(
        `${"Frame".padStart(6)} | ${"Total".padStart(8)} | ${"Renderer".padStart(8)} | ${"NonRender".padStart(8)} | ${"Overlays".padStart(8)} | ${"RAF int".padStart(8)} | ${"Coalesced".padStart(8)}`
      );
      lines.push("-".repeat(70));
      for (const frame of topSlow) {
        lines.push(
          `${frame.frameId.toString().padStart(6)} | ${frame.totalTime.toFixed(1).padStart(8)} | ${frame.rendererRenderTime.toFixed(1).padStart(8)} | ${frame.nonRendererTime.toFixed(1).padStart(8)} | ${frame.overlaysTime.toFixed(1).padStart(8)} | ${(frame.rafInterval === null ? "N/A" : frame.rafInterval.toFixed(1)).padStart(8)} | ${frame.coalescedCount.toString().padStart(8)}`
        );
      }
    }
    return lines.join("\n");
  }
  /**
   * 打印性能统计报告到控制台
   */
  printPerformanceReport() {
    console.log(this.getPerformanceReport());
  }
  /**
   * 重置性能统计数据
   */
  resetPerformanceStats() {
    this.renderer.resetPerformanceStats();
    this.ctFrameHistory = [];
    this.ctFrameCount = 0;
    this.ctLastRafTime = null;
    this.ctScheduledAt = null;
    this.ctCoalescedCount = 0;
  }
  /**
   * 获取 CanvasTable 最后一帧的诊断信息
   */
  getCtLastFrameDiagnostics() {
    if (this.ctFrameHistory.length === 0) return null;
    return this.ctFrameHistory[this.ctFrameHistory.length - 1] ?? null;
  }
  /**
   * 获取 CanvasTable 最差帧的诊断信息（总时间最长的帧）
   */
  getCtWorstFrameDiagnostics() {
    if (this.ctFrameHistory.length === 0) return null;
    return this.ctFrameHistory.reduce(
      (worst, frame) => frame.totalTime > worst.totalTime ? frame : worst
    );
  }
  /**
   * 获取慢帧数组（总时间超过阈值的帧，默认 16ms）
   */
  getCtSlowFrames(threshold = 16) {
    return this.ctFrameHistory.filter((frame) => frame.totalTime > threshold);
  }
  /**
   * 获取完整的性能诊断信息（包含 CanvasTable 和 Renderer）
   */
  getPerformanceDiagnostics() {
    return {
      canvasTable: {
        frameHistory: [...this.ctFrameHistory],
        lastFrame: this.getCtLastFrameDiagnostics(),
        worstFrame: this.getCtWorstFrameDiagnostics(),
        slowFrames: this.getCtSlowFrames()
      },
      renderer: this.renderer.getPerformanceDiagnostics()
    };
  }
  // === 渲染缓存 API ===
  /**
   * 清空渲染缓存
   * 当数据外部变化时调用，确保缓存失效
   */
  clearRenderCache() {
    this.renderCache.clear();
  }
  /**
   * 获取渲染缓存统计信息
   */
  getRenderCacheStats() {
    return this.renderCache.getStats();
  }
  // === 调试方法 ===
  /**
   * 获取当前的筛选配置
   * @returns 筛选配置数组
   */
  getFilterConfig() {
    return this.dataManager.getFilters();
  }
  /**
   * 获取当前的排序配置
   * @returns 排序配置数组
   */
  getSortConfig() {
    return this.dataManager.getSort();
  }
  /**
   * 打印当前的筛选和排序状态到控制台
   */
  debugState() {
    console.group("CanvasTable State");
    console.log("Filters:", this.getFilterConfig());
    console.log("Sorts:", this.getSortConfig());
    console.groupEnd();
  }
  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.stopPendingAnimation();
    if (this.warningTooltipTimeout) {
      clearTimeout(this.warningTooltipTimeout);
      this.warningTooltipTimeout = null;
    }
    this.teardownAutoThemeDetection();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener("resize", this.handleResize);
    this.interactionManager.destroy();
    this.renderer.destroy();
    this.editorManager.destroy();
    this.filterInputManager.destroy();
    this.loadingOverlay.destroy();
    this.dataManager.destroy();
    if (this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    this.eventEmitter.removeAllListeners();
  }
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
}
export {
  CTBox,
  CTCircle,
  CTColumn,
  CTDate,
  CTDropdown,
  CTElementRenderer,
  CTImage,
  CTLine,
  CTRow,
  CTStack,
  CTText,
  CTTooltip,
  CanvasTable,
  CellTypes,
  ColumnIdManager,
  DARK_THEME,
  DEFAULT_THEME,
  DataManager,
  EventEmitter,
  FILTER_SAMPLE_ROWS,
  FILTER_SEARCH_LIMIT,
  InteractionManager,
  LRUCache,
  LayoutEngine,
  LayoutManager,
  MeasurementEngine,
  RenderCache,
  Renderer,
  RowIdManager,
  RowVersionManager,
  arrayToCsv,
  binarySearch,
  buildExcelExportModel,
  calculateMaxTextRows,
  clamp,
  createCTElement,
  createCanvas,
  createXlsxBlob,
  createXlsxBlobFromModel,
  debounce,
  deepClone,
  CanvasTable as default,
  downloadBlob,
  enUS,
  formatBoolean,
  formatDate,
  formatNumber,
  formatPercent,
  generateId,
  getCellDisplayText,
  getColumnField,
  getColumnFilterOptions,
  getDateText,
  getDevicePixelRatio,
  getFilterModeByColumnType,
  getNestedValue,
  getRenderResult,
  getTextFromChildren,
  isEqual,
  isPromise,
  layoutTags,
  layoutWrappedText,
  measureText,
  mergeTheme,
  normalizeBoxProps,
  requestAnimationFrameThrottle,
  resolveDisabled,
  resolveLocale,
  searchFilterOptions,
  setNestedValue,
  throttle,
  truncateText,
  zhCN
};
//# sourceMappingURL=canvas-table.js.map
