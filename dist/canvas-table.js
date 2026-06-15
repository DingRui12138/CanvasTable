var xe = Object.defineProperty;
var we = (x, t, e) => t in x ? xe(x, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : x[t] = e;
var b = (x, t, e) => we(x, typeof t != "symbol" ? t + "" : t, e);
const O = {
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
  BUTTONS: "buttons",
  INPUT: "input",
  SELECT: "select",
  SWITCH: "switch",
  IMAGE: "image",
  PROGRESS: "progress",
  RATING: "rating",
  COLOR: "color"
}, re = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ye = (() => {
  const x = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let e = t;
    for (let i = 0; i < 8; i++)
      e = e & 1 ? 3988292384 ^ e >>> 1 : e >>> 1;
    x[t] = e >>> 0;
  }
  return x;
})();
function Ce(x, t) {
  var i;
  const e = (i = t == null ? void 0 : t.formats) == null ? void 0 : i.find((s) => s.key === x.key);
  if (e != null && e.type && e.formatCode)
    return { type: e.type, formatCode: e.formatCode };
  if (x.type === O.DATE)
    return { type: "date", formatCode: "yyyy-mm-dd" };
  if (x.type === O.NUMBER)
    return { type: "number", formatCode: "General" };
}
function be() {
  const x = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map(), e = [], i = [{}];
  return {
    styles: i,
    numFmts: e,
    getStyleId(s) {
      if (!s || s === "General")
        return 0;
      let o = x.get(s);
      o || (o = 164 + e.length, x.set(s, o), e.push({ id: o, formatCode: s }));
      const n = `numFmt:${o}`;
      let r = t.get(n);
      return r === void 0 && (r = i.length, i.push({ numFmtId: o }), t.set(n, r)), r;
    }
  };
}
function Re(x) {
  const t = x instanceof Date ? x : new Date(x);
  return Number.isNaN(t.getTime()) ? null : t.getTime() / 864e5 + 25569;
}
function ve(x, t, e) {
  return x.rows.map((i) => ({
    kind: "body",
    cells: i.cells.map((s) => {
      const o = Ce(s.column, t);
      if ((o == null ? void 0 : o.type) === "date") {
        const n = Re(s.rawValue);
        if (n !== null)
          return {
            value: n,
            type: "number",
            styleId: e.getStyleId(o.formatCode)
          };
      }
      if (typeof s.rawValue == "number" && Number.isFinite(s.rawValue)) {
        const n = e.getStyleId(o == null ? void 0 : o.formatCode);
        return {
          value: s.rawValue,
          type: "number",
          ...n > 0 ? { styleId: n } : {}
        };
      }
      return typeof s.rawValue == "boolean" ? { value: s.rawValue, type: "boolean" } : { value: s.displayValue, type: "string" };
    })
  }));
}
function Vt(x, t) {
  const e = [], i = [];
  for (const s of x ?? []) {
    const o = Array.from({ length: t }, () => ({
      value: "",
      type: "blank"
    }));
    for (const n of s.cells) {
      if (n.startColumnIndex < 0 || n.startColumnIndex >= t || n.endColumnIndex < n.startColumnIndex)
        continue;
      const r = n.config.value ?? n.renderResult.text ?? "", a = typeof r == "number" ? "number" : typeof r == "boolean" ? "boolean" : "string";
      o[n.startColumnIndex] = {
        value: r,
        type: a
      }, n.endColumnIndex > n.startColumnIndex && i.push({
        startRow: e.length,
        startCol: n.startColumnIndex,
        endRow: e.length,
        endCol: Math.min(n.endColumnIndex, t - 1)
      });
    }
    e.push({ kind: "summary", cells: o });
  }
  return { rows: e, merges: i };
}
function Ie(x, t) {
  if (Array.isArray(t)) {
    const e = t.find((i) => i.key === x.key);
    if (e)
      return e.width;
  }
  return x.width;
}
function ae(x) {
  let t = x, e = "";
  for (; t > 0; ) {
    const i = (t - 1) % 26;
    e = String.fromCharCode(65 + i) + e, t = Math.floor((t - 1) / 26);
  }
  return e;
}
function zt(x, t) {
  return `${ae(t + 1)}${x + 1}`;
}
function Se(x) {
  return Math.max(0, x / 7).toFixed(2);
}
function Et(x, t) {
  return x.map((e) => ({
    startRow: e.startRow + t,
    startCol: e.startCol,
    endRow: e.endRow + t,
    endCol: e.endCol
  }));
}
function Ee(x) {
  for (const t of x)
    if (t.endRow < t.startRow || t.endCol < t.startCol)
      throw new Error(`Invalid merge range: ${JSON.stringify(t)}`);
  for (let t = 0; t < x.length; t++)
    for (let e = t + 1; e < x.length; e++) {
      const i = x[t], s = x[e];
      if (i.startRow <= s.endRow && i.endRow >= s.startRow && i.startCol <= s.endCol && i.endCol >= s.startCol)
        throw new Error(`Overlapping merge ranges: ${JSON.stringify(i)} and ${JSON.stringify(s)}`);
    }
}
function Me(x, t, e) {
  var o, n, r, a;
  const i = ((o = t == null ? void 0 : t.freeze) == null ? void 0 : o.xSplit) ?? (((n = t == null ? void 0 : t.freeze) == null ? void 0 : n.leftFixedColumns) === !1 ? 0 : x.leftFixedLeafColumnCount), s = ((r = t == null ? void 0 : t.freeze) == null ? void 0 : r.ySplit) ?? (((a = t == null ? void 0 : t.freeze) == null ? void 0 : a.header) === !1 ? 0 : e);
  if (!(i === 0 && s === 0))
    return {
      xSplit: i,
      ySplit: s,
      topLeftCell: `${ae(i + 1)}${s + 1}`
    };
}
function Te(x) {
  const t = x.map(
    (e, i) => e.width ? `<col min="${i + 1}" max="${i + 1}" width="${Se(e.width)}" customWidth="1"/>` : ""
  ).filter(Boolean).join("");
  return t ? `<cols>${t}</cols>` : "";
}
function De(x) {
  return x ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${x.xSplit}" ySplit="${x.ySplit}" topLeftCell="${x.topLeftCell}" state="frozen"/></sheetView></sheetViews>` : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
}
function He(x) {
  if (x.length === 0)
    return "";
  const t = x.map(
    (e) => `<mergeCell ref="${zt(e.startRow, e.startCol)}:${zt(e.endRow, e.endCol)}"/>`
  ).join("");
  return `<mergeCells count="${x.length}">${t}</mergeCells>`;
}
function ke(x) {
  const t = x.numFmts.length ? `<numFmts count="${x.numFmts.length}">${x.numFmts.map((i) => `<numFmt numFmtId="${i.id}" formatCode="${It(i.formatCode)}"/>`).join("")}</numFmts>` : "", e = (x.styles.length > 0 ? x.styles : [{}]).map(
    (i) => `<xf numFmtId="${i.numFmtId ?? 0}" fontId="0" fillId="0" borderId="0" xfId="0"${i.numFmtId ? ' applyNumberFormat="1"' : ""}/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${t}
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${x.styles.length > 0 ? x.styles.length : 1}">${e}</cellXfs>
</styleSheet>`;
}
function Oe(x) {
  const t = x.rows.map((e, i) => {
    const s = i + 1, o = e.cells.map((n, r) => {
      const a = `${le(r)}${s}`, l = n.styleId !== void 0 ? ` s="${n.styleId}"` : "";
      return n.type === "blank" ? `<c r="${a}"${l}/>` : n.type === "number" ? `<c r="${a}"${l}><v>${n.value}</v></c>` : n.type === "boolean" ? `<c r="${a}" t="b"${l}><v>${n.value ? 1 : 0}</v></c>` : `<c r="${a}" t="inlineStr"${l}><is><t>${It(n.value)}</t></is></c>`;
    }).join("");
    return `<row r="${s}">${o}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${De(x.freeze)}${Te(x.columns)}<sheetData>${t}</sheetData>${He(x.merges)}</worksheet>`;
}
function Pe(x) {
  let t = 4294967295;
  for (const e of x)
    t = ye[(t ^ e) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
function Z(x, t, e) {
  x[t] = e & 255, x[t + 1] = e >>> 8 & 255;
}
function at(x, t, e) {
  x[t] = e & 255, x[t + 1] = e >>> 8 & 255, x[t + 2] = e >>> 16 & 255, x[t + 3] = e >>> 24 & 255;
}
function Xt(x) {
  const t = x.reduce((s, o) => s + o.length, 0), e = new Uint8Array(t);
  let i = 0;
  for (const s of x)
    e.set(s, i), i += s.length;
  return e;
}
function Yt(x) {
  const t = [];
  for (let e = 0; e < x.length; e++) {
    let i = x.codePointAt(e);
    i > 65535 && e++, i <= 127 ? t.push(i) : i <= 2047 ? t.push(192 | i >> 6, 128 | i & 63) : i <= 65535 ? t.push(
      224 | i >> 12,
      128 | i >> 6 & 63,
      128 | i & 63
    ) : t.push(
      240 | i >> 18,
      128 | i >> 12 & 63,
      128 | i >> 6 & 63,
      128 | i & 63
    );
  }
  return new Uint8Array(t);
}
function It(x) {
  return String(x ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function le(x) {
  let t = x + 1, e = "";
  for (; t > 0; ) {
    const i = (t - 1) % 26;
    e = String.fromCharCode(65 + i) + e, t = Math.floor((t - 1) / 26);
  }
  return e;
}
function he(x) {
  const t = x.trim() || "Sheet1";
  return It(t.slice(0, 31));
}
function Be(x) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${x.map((e, i) => {
    const s = i + 1, o = e.map((n, r) => `<c r="${`${le(r)}${s}`}" t="inlineStr"><is><t>${It(n)}</t></is></c>`).join("");
    return `<row r="${s}">${o}</row>`;
  }).join("")}</sheetData></worksheet>`;
}
function ce(x) {
  const t = [], e = [];
  let i = 0;
  for (const n of x) {
    const r = Yt(n.name), a = Yt(n.content), l = Pe(a), h = new Uint8Array(30 + r.length);
    at(h, 0, 67324752), Z(h, 4, 20), Z(h, 6, 0), Z(h, 8, 0), Z(h, 10, 0), Z(h, 12, 0), at(h, 14, l), at(h, 18, a.length), at(h, 22, a.length), Z(h, 26, r.length), Z(h, 28, 0), h.set(r, 30), t.push(h, a);
    const c = new Uint8Array(46 + r.length);
    at(c, 0, 33639248), Z(c, 4, 20), Z(c, 6, 20), Z(c, 8, 0), Z(c, 10, 0), Z(c, 12, 0), Z(c, 14, 0), at(c, 16, l), at(c, 20, a.length), at(c, 24, a.length), Z(c, 28, r.length), Z(c, 30, 0), Z(c, 32, 0), Z(c, 34, 0), Z(c, 36, 0), at(c, 38, 0), at(c, 42, i), c.set(r, 46), e.push(c), i += h.length + a.length;
  }
  const s = Xt(e), o = new Uint8Array(22);
  return at(o, 0, 101010256), Z(o, 4, 0), Z(o, 6, 0), Z(o, 8, x.length), Z(o, 10, x.length), at(o, 12, s.length), at(o, 16, i), Z(o, 20, 0), Xt([...t, s, o]);
}
function Le(x, t) {
  const e = Array.from({ length: t }, () => []), i = [], s = (n, r, a) => {
    if (n.children && n.children.length > 0) {
      e[r][a] = { value: n.title, type: "string" };
      let l = a;
      for (const h of n.children)
        l = s(h, r + 1, l);
      return l - 1 > a && i.push({ startRow: r, startCol: a, endRow: r, endCol: l - 1 }), l;
    }
    return e[r][a] = { value: n.title, type: "string" }, r < t - 1 && i.push({ startRow: r, startCol: a, endRow: t - 1, endCol: a }), a + 1;
  };
  let o = 0;
  for (const n of x)
    o = s(n, 0, o);
  return {
    rows: e.map((n) => ({
      kind: "header",
      cells: Array.from(
        { length: o },
        (r, a) => n[a] ?? { value: "", type: "blank" }
      )
    })),
    merges: i
  };
}
function We(x, t, e) {
  const s = (t == null ? void 0 : t.hierarchicalHeaders) !== !1 && x.headerDepth > 0 ? Le(x.columnTree, x.headerDepth) : {
    rows: x.leafColumns.length > 0 ? [
      {
        kind: "header",
        cells: x.leafColumns.map((m) => ({
          value: m.title,
          type: "string"
        }))
      }
    ] : [],
    merges: []
  }, o = be(), n = Vt(x.summaryTopRows, x.leafColumns.length), r = ve(x, t, o), a = Vt(
    x.summaryBottomRows,
    x.leafColumns.length
  ), l = s.rows.length + n.rows.length, h = l + r.length, c = Et((t == null ? void 0 : t.merges) ?? x.bodyMerges, l), d = Et(n.merges, s.rows.length), u = Et(a.merges, h), f = [
    ...s.merges,
    ...d,
    ...c,
    ...u
  ];
  Ee(f);
  const g = Me(x, t, s.rows.length);
  return {
    sheetName: e,
    columns: x.leafColumns.map((m) => ({
      key: m.key,
      width: Ie(m, t == null ? void 0 : t.columnWidths)
    })),
    rows: [
      ...s.rows,
      ...n.rows,
      ...r,
      ...a.rows
    ],
    merges: f,
    freeze: g,
    styles: o.styles,
    numFmts: o.numFmts
  };
}
function Ae(x) {
  const t = he(x.sheetName), e = [
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
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${t}" sheetId="1" r:id="rId1"/></sheets></workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
    },
    {
      name: "xl/styles.xml",
      content: ke(x)
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: Oe(x)
    }
  ], i = ce(e), s = new ArrayBuffer(i.byteLength);
  return new Uint8Array(s).set(i), new Blob([s], { type: re });
}
function ts(x, t = "Sheet1") {
  const e = he(t), i = [
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
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${e}" sheetId="1" r:id="rId1"/></sheets></workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: Be(x)
    }
  ], s = ce(i), o = new ArrayBuffer(s.byteLength);
  return new Uint8Array(o).set(s), new Blob([o], { type: re });
}
function $(x) {
  return x.field ?? x.key;
}
function _e(x, t) {
  const { thousandSeparator: e = !0, decimalPlaces: i, prefix: s = "", suffix: o = "" } = t ?? {};
  if (!isFinite(x))
    return String(x);
  let n = i !== void 0 ? x.toFixed(i) : String(x);
  if (e) {
    const r = n.split(".");
    r[0] = r[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","), n = r.join(".");
  }
  return s + n + o;
}
function es(x, t = 2) {
  return _e(x * 100, { decimalPlaces: t, suffix: "%" });
}
function is(x, t = "YYYY-MM-DD") {
  const e = x instanceof Date ? x : new Date(x);
  if (isNaN(e.getTime()))
    return String(x);
  const i = e.getFullYear(), s = String(e.getMonth() + 1).padStart(2, "0"), o = String(e.getDate()).padStart(2, "0"), n = String(e.getHours()).padStart(2, "0"), r = String(e.getMinutes()).padStart(2, "0"), a = String(e.getSeconds()).padStart(2, "0");
  return t.replace("YYYY", String(i)).replace("MM", s).replace("DD", o).replace("HH", n).replace("mm", r).replace("ss", a);
}
function ss(x, t = "Yes", e = "No") {
  return x ? t : e;
}
function ft(x, t, e = "...") {
  return x.length <= t ? x : x.slice(0, t - e.length) + e;
}
function os() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function Ne(x, t) {
  let e = null;
  return function(...i) {
    e !== null && clearTimeout(e), e = setTimeout(() => {
      x.apply(this, i), e = null;
    }, t);
  };
}
function ns(x, t) {
  let e = !1;
  return function(...i) {
    e || (x.apply(this, i), e = !0, setTimeout(() => {
      e = !1;
    }, t));
  };
}
function J(x, t, e) {
  return Math.min(Math.max(x, t), e);
}
function $t(x) {
  if (x === null || typeof x != "object")
    return x;
  if (Array.isArray(x))
    return x.map((e) => $t(e));
  const t = {};
  for (const e in x)
    Object.prototype.hasOwnProperty.call(x, e) && (t[e] = $t(x[e]));
  return t;
}
function Fe(x, t) {
  if (x === t)
    return !0;
  if (typeof x != typeof t)
    return !1;
  if (x === null || t === null || typeof x != "object")
    return x === t;
  if (Array.isArray(x) !== Array.isArray(t))
    return !1;
  const e = x, i = t, s = Object.keys(e), o = Object.keys(i);
  if (s.length !== o.length)
    return !1;
  for (const n of s)
    if (!Object.prototype.hasOwnProperty.call(i, n) || !Fe(e[n], i[n]))
      return !1;
  return !0;
}
function rs(x, t) {
  const e = t.split(".");
  let i = x;
  for (const s of e) {
    if (i == null)
      return;
    i = i[s];
  }
  return i;
}
function as(x, t, e) {
  const i = t.split(".");
  let s = x;
  for (let o = 0; o < i.length - 1; o++) {
    const n = i[o];
    (s[n] === void 0 || s[n] === null) && (s[n] = {}), s = s[n];
  }
  s[i[i.length - 1]] = e;
}
function Gt(x, t, e) {
  let i = 0, s = x.length - 1;
  for (; i <= s; ) {
    const o = Math.floor((i + s) / 2), n = e(x[o]);
    if (n === t)
      return o;
    n < t ? i = o + 1 : s = o - 1;
  }
  return i;
}
function ls(x, t, e, i) {
  return x.font = `${e}px ${i}`, {
    width: x.measureText(t).width,
    height: e
  };
}
function Ht(x, t, e = 8) {
  return Math.max(1, Math.floor((x - e * 2) / t));
}
function kt(x, t, e, i) {
  const s = [];
  let o = "";
  for (const a of t) {
    const l = o + a;
    if (x.measureText(l).width > e) {
      if (o && s.push(o), o = a, s.length >= i)
        break;
    } else
      o = l;
  }
  o && s.length < i && s.push(o);
  const n = s.join(""), r = t.length > n.length;
  if (r && s.length === i) {
    const a = "...";
    let l = s[s.length - 1] ?? "";
    for (; l.length > 0 && x.measureText(l + a).width > e; )
      l = l.slice(0, -1);
    s[s.length - 1] = l + a;
  }
  return { lines: s, isTruncated: r };
}
function de(x, t, e, i, s) {
  const l = "...", h = s + 8, c = e - 8 * 2, d = Math.max(1, Math.floor((i - 8 * 2) / (h + 2))), u = Math.min(t.maxRows ?? d, d), f = t.tags ?? [], g = /* @__PURE__ */ new Map(), m = (M) => {
    let S = g.get(M);
    return S === void 0 && (S = x.measureText(M).width, g.set(M, S)), S;
  }, p = (M) => {
    const S = `+${M}`;
    return m(S) + 4 * 2;
  }, y = (M) => m(M.text) + 4 * 2, w = m(l), C = [];
  let R = [], v = 0, I = 0;
  for (let M = 0; M < f.length; M++) {
    const S = f[M], T = y(S), H = C.length >= u - 1, D = f.length - M;
    if (H) {
      const k = D > 1 ? p(D - 1) + 4 : 0, P = c - v - k;
      if (T <= P)
        R.push({ tag: S, displayText: S.text, width: T }), v += T + 4, I++;
      else {
        const B = c - v - k;
        if (B >= 4 * 2 + w + 10) {
          const L = B - 8 - w;
          let A = "", W = 0, _ = S.text.length;
          for (; W < _; ) {
            const F = Math.floor((W + _ + 1) / 2), V = S.text.slice(0, F);
            m(V) <= L ? (W = F, A = V) : _ = F - 1;
          }
          if (A.length > 0) {
            const F = A + l, V = m(F) + 4 * 2;
            R.push({ tag: S, displayText: F, width: V }), I++;
          }
        }
        break;
      }
    } else if (T <= c - v)
      R.push({ tag: S, displayText: S.text, width: T }), v += T + 4, I++;
    else if (R.length > 0 && C.push(R), R = [{ tag: S, displayText: S.text, width: T }], v = T + 4, I++, C.length >= u)
      break;
  }
  return R.length > 0 && C.length < u && C.push(R), {
    lines: C,
    processedTags: I,
    isTruncated: I < f.length
  };
}
function bt() {
  return window.devicePixelRatio || 1;
}
function hs(x, t) {
  const e = document.createElement("canvas"), i = bt();
  e.width = x * i, e.height = t * i, e.style.width = `${x}px`, e.style.height = `${t}px`;
  const s = e.getContext("2d");
  if (!s)
    throw new Error("Failed to get 2D context");
  return s.scale(i, i), { canvas: e, ctx: s };
}
function cs(x) {
  let t = null, e = null;
  return function(...i) {
    e = i, t === null && (t = requestAnimationFrame(() => {
      e !== null && x.apply(this, e), t = null, e = null;
    }));
  };
}
function Rt(x) {
  return x !== null && typeof x == "object" && typeof x.then == "function";
}
function ds(x, t) {
  const e = URL.createObjectURL(x), i = document.createElement("a");
  i.href = e, i.download = t, document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(e);
}
function Ut(x, t = ",") {
  return x.map((e) => e.map((i) => {
    const s = String(i ?? "");
    return s.includes(t) || s.includes('"') || s.includes(`
`) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(t)).join(`
`);
}
function xt(x, t, e) {
  return x === void 0 ? !1 : typeof x == "function" ? x(t, e) : x;
}
function lt(x, t, e) {
  const i = $(x), s = t.data[i];
  let o = {
    text: String(s ?? ""),
    type: x.type ?? "text"
  };
  if (x.render)
    try {
      const n = x.render(s, t, x, e);
      n && (o = { ...o, ...n });
    } catch (n) {
      console.error(`Error in render function at row ${e}, column ${x.key}:`, n), o = {
        text: "[Error]",
        type: "text"
      };
    }
  return o.type === O.CHECKBOX && !o.checkbox && (o.checkbox = {
    checked: !!s
  }), o.type === O.SWITCH && !o.switch && (o.switch = {
    checked: !!s
  }), o;
}
function ue(x, t, e) {
  var n, r;
  const i = $(x), s = t.data[i], o = lt(x, t, e);
  if (o.type === O.SWITCH && o.switch)
    return o.switch.checked ? "是" : "否";
  if (o.type === O.CHECKBOX && o.checkbox)
    return o.checkbox.indeterminate ? "部分选中" : o.checkbox.checked ? "是" : "否";
  if (o.type === O.RADIO && o.radio) {
    const a = (n = o.radio.options) == null ? void 0 : n.find(
      (l) => {
        var h;
        return l.value === ((h = o.radio) == null ? void 0 : h.value);
      }
    );
    return (a == null ? void 0 : a.label) || String(o.radio.value ?? "");
  }
  if (o.type === O.BUTTON && o.button)
    return o.button.text || "";
  if (o.tags)
    return o.tags.tags.map((a) => a.text).join(", ");
  if (o.type === O.SELECT && o.select) {
    const a = o.select.value;
    if (Array.isArray(a))
      return a.map(
        (c) => {
          var d, u, f;
          return ((f = (u = (d = o.select) == null ? void 0 : d.options) == null ? void 0 : u.find((g) => g.value === c)) == null ? void 0 : f.label) || String(c);
        }
      ).filter(Boolean).join(", ");
    const l = (r = o.select.options) == null ? void 0 : r.find((h) => h.value === a);
    return (l == null ? void 0 : l.label) || String(a ?? "");
  }
  if (o.type === O.DATE && o.date) {
    if (o.date.value) {
      const a = o.date.value;
      return a instanceof Date ? a.toLocaleDateString() : String(a);
    }
    return "";
  }
  if (o.type === O.INPUT && o.input)
    return String(o.input.value ?? "");
  if (x.formatter)
    return x.formatter(s, t, x);
  if (o.text !== void 0)
    return String(o.text);
  switch (x.type) {
    case "number":
      return typeof s == "number" ? s.toLocaleString() : String(s ?? "");
    case "boolean":
      return s ? "是" : "否";
    case "date":
      return s instanceof Date ? s.toLocaleDateString() : String(s ?? "");
    default:
      return String(s ?? "");
  }
}
class us {
  constructor(t = 100) {
    b(this, "cache");
    b(this, "maxSize");
    this.cache = /* @__PURE__ */ new Map(), this.maxSize = t;
  }
  /**
   * 获取缓存值，同时更新访问顺序
   */
  get(t) {
    if (!this.cache.has(t))
      return;
    const e = this.cache.get(t);
    return this.cache.delete(t), this.cache.set(t, e), e;
  }
  /**
   * 设置缓存值
   */
  set(t, e) {
    if (this.cache.has(t))
      this.cache.delete(t);
    else if (this.cache.size >= this.maxSize) {
      const i = this.cache.keys().next().value;
      i !== void 0 && this.cache.delete(i);
    }
    this.cache.set(t, e);
  }
  /**
   * 检查是否存在
   */
  has(t) {
    return this.cache.has(t);
  }
  /**
   * 删除缓存
   */
  delete(t) {
    return this.cache.delete(t);
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
const Ve = {
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
}, ze = ["button", "buttons", "image"];
function Xe(x) {
  var e, i;
  if ((e = x.filter) != null && e.mode)
    return x.filter.mode;
  if ((i = x.filter) != null && i.disabled)
    return null;
  const t = x.type ?? "text";
  return ze.includes(t) ? null : Ve[t] ?? "search";
}
const Ye = 100, $e = 100;
function fe(x, t, e = 0) {
  var n;
  if ((n = x.filter) != null && n.options && x.filter.options.length > 0)
    return x.filter.options;
  if (!t || t.length === 0)
    return [];
  const i = $(x), s = t.slice(e, e + Ye), o = /* @__PURE__ */ new Map();
  for (let r = 0; r < s.length; r++) {
    const a = s[r], l = a.data[i], h = lt(x, a, e + r), c = Ge(h, l);
    for (const d of c) {
      const u = String(d.value);
      o.has(u) || o.set(u, d);
    }
  }
  return Array.from(o.values());
}
function Ge(x, t) {
  var i, s, o, n;
  const e = [];
  if ((i = x.select) != null && i.options && e.push(...x.select.options), (s = x.tags) != null && s.options && e.push(
    ...x.tags.options.map((r) => ({
      label: r.text,
      value: r.value ?? r.text
    }))
  ), (o = x.radio) != null && o.options && e.push(...x.radio.options), (n = x.color) != null && n.presetColors && e.push(
    ...x.color.presetColors.map((r) => ({
      label: r,
      value: r
    }))
  ), e.length === 0 && t !== void 0 && t !== null)
    if (Array.isArray(t))
      for (const r of t)
        e.push({
          label: String(r),
          value: r
        });
    else
      e.push({
        label: String(t),
        value: t
      });
  return e;
}
function Ue(x, t, e, i = $e) {
  if (!e || e.trim() === "")
    return [];
  const s = $(x), o = e.toLowerCase(), n = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (n.size >= i)
      break;
    const a = r.data[s];
    if (String(a ?? "").toLowerCase().includes(o)) {
      const h = String(a);
      n.has(h) || n.set(h, {
        label: String(a ?? ""),
        value: a
      });
    }
  }
  return Array.from(n.values());
}
class Ke {
  constructor() {
    b(this, "map", /* @__PURE__ */ new WeakMap());
    b(this, "counter", 0);
  }
  /**
   * 获取行 ID（懒创建）
   */
  getId(t) {
    let e = this.map.get(t);
    return e || (e = `r${this.counter++}`, this.map.set(t, e)), e;
  }
  /**
   * 重置（loadData 时调用）
   */
  reset() {
    this.map = /* @__PURE__ */ new WeakMap(), this.counter = 0;
  }
}
class je {
  constructor() {
    b(this, "map", /* @__PURE__ */ new WeakMap());
    b(this, "counter", 0);
  }
  /**
   * 获取列 ID（懒创建）
   */
  getId(t) {
    let e = this.map.get(t);
    return e || (e = `c${this.counter++}`, this.map.set(t, e)), e;
  }
  /**
   * 重置（setColumns 时调用）
   */
  reset() {
    this.map = /* @__PURE__ */ new WeakMap(), this.counter = 0;
  }
}
class Qe {
  constructor() {
    b(this, "map", /* @__PURE__ */ new WeakMap());
  }
  /**
   * 获取行版本号
   */
  getVersion(t) {
    return this.map.get(t) ?? 0;
  }
  /**
   * 递增行版本号
   */
  incrementVersion(t) {
    const e = this.map.get(t) ?? 0;
    this.map.set(t, e + 1);
  }
  /**
   * 批量递增版本号
   */
  batchIncrement(t) {
    for (const e of t)
      this.incrementVersion(e);
  }
}
class qe {
  constructor(t, e, i, s = 3e3) {
    /** 单元格缓存：key = rowId-columnId */
    b(this, "cellCache", /* @__PURE__ */ new Map());
    /** 列值缓存：key = columnId-value */
    b(this, "valueCache", /* @__PURE__ */ new Map());
    /** 行 ID 管理器 */
    b(this, "rowIdManager");
    /** 列 ID 管理器 */
    b(this, "columnIdManager");
    /** 行版本管理器 */
    b(this, "rowVersionManager");
    /** 单元格缓存最大数量 */
    b(this, "maxCellCacheSize");
    this.rowIdManager = t, this.columnIdManager = e, this.rowVersionManager = i, this.maxCellCacheSize = s;
  }
  // ==================== Key 生成 ====================
  /**
   * 生成单元格缓存 key
   */
  getCellCacheKey(t, e) {
    const i = this.rowIdManager.getId(t), s = this.columnIdManager.getId(e);
    return `${i}-${s}`;
  }
  /**
   * 生成列值缓存 key
   */
  getValueCacheKey(t, e) {
    const i = this.columnIdManager.getId(t), s = this.stringifyValue(e);
    return `${i}-${s}`;
  }
  /**
   * 将值转换为字符串用于缓存 key
   */
  stringifyValue(t) {
    if (t === null) return "__null__";
    if (t === void 0) return "__undefined__";
    if (typeof t == "object")
      try {
        return JSON.stringify(t);
      } catch {
        return String(t);
      }
    return String(t);
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
  get(t, e, i, s) {
    if (s === "value") {
      const a = this.getValueCacheKey(e, i);
      return this.valueCache.get(a) ?? null;
    }
    const o = this.getCellCacheKey(t, e), n = this.cellCache.get(o);
    if (!n) return null;
    const r = this.rowVersionManager.getVersion(t);
    return n.value !== i || n.rowVersion !== r ? (this.cellCache.delete(o), null) : n.renderResult;
  }
  /**
   * 设置缓存
   */
  set(t, e, i, s, o) {
    if (o === "value") {
      const n = this.getValueCacheKey(e, i);
      this.valueCache.set(n, s);
    } else {
      const n = this.getCellCacheKey(t, e);
      this.ensureCellCapacity(), this.cellCache.set(n, {
        value: i,
        renderResult: s,
        rowVersion: this.rowVersionManager.getVersion(t)
      });
    }
  }
  /**
   * 确保单元格缓存不超过最大数量
   */
  ensureCellCapacity() {
    if (this.cellCache.size >= this.maxCellCacheSize) {
      const t = this.cellCache.keys().next().value;
      t !== void 0 && this.cellCache.delete(t);
    }
  }
  // ==================== 缓存清理 ====================
  /**
   * 清理不可见行的缓存
   * @param visibleRowIds 可见行的 ID 集合
   */
  cleanupInvisibleRows(t) {
    const e = [];
    for (const i of this.cellCache.keys()) {
      const s = i.split("-")[0];
      s && !t.has(s) && e.push(i);
    }
    for (const i of e)
      this.cellCache.delete(i);
  }
  /**
   * 清理不可见列的缓存
   * @param visibleColumnIds 可见列的 ID 集合
   */
  cleanupInvisibleColumns(t) {
    const e = [];
    for (const i of this.cellCache.keys()) {
      const o = i.split("-").slice(1).join("-");
      o && !t.has(o) && e.push(i);
    }
    for (const i of e)
      this.cellCache.delete(i);
  }
  /**
   * 清空所有缓存
   */
  clear() {
    this.cellCache.clear(), this.valueCache.clear();
  }
  // ==================== 管理器重置 ====================
  /**
   * 重置行 ID 管理器并清空缓存（loadData 时调用）
   */
  resetRowIds() {
    this.rowIdManager.reset(), this.cellCache.clear(), this.valueCache.clear();
  }
  /**
   * 重置列 ID 管理器并清空缓存（setColumns 时调用）
   */
  resetColumnIds() {
    this.columnIdManager.reset(), this.cellCache.clear(), this.valueCache.clear();
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
const Mt = 200;
class Ze {
  constructor(t, e) {
    b(this, "state", {
      rows: [],
      filteredRows: [],
      sortedRows: [],
      columns: [],
      filters: [],
      sort: [],
      loading: !1,
      error: null
    });
    /** 历史记录栈 */
    b(this, "historyStack", []);
    /** 重做记录栈 */
    b(this, "redoStack", []);
    /** 历史记录配置 */
    b(this, "historyOptions");
    /** 行版本管理器（用于渲染缓存） */
    b(this, "rowVersionManager", new Qe());
    this.historyOptions = {
      maxActions: (e == null ? void 0 : e.maxActions) ?? Mt
    };
  }
  /**
   * 获取行版本管理器
   */
  getRowVersionManager() {
    return this.rowVersionManager;
  }
  async loadRows(t) {
    this.state.loading = !0, this.state.error = null, this.state.filters = [], this.state.sort = [];
    try {
      let e;
      typeof t == "function" ? e = await t() : Rt(t) ? e = await t : e = t, this.state.rows = this.processRows(e), this.historyStack = [], this.redoStack = [], this.applyFiltersAndSort();
    } catch (e) {
      throw this.state.error = e instanceof Error ? e : new Error(String(e)), e;
    } finally {
      this.state.loading = !1;
    }
  }
  processRows(t, e = 0) {
    return t.map((i) => {
      const s = {
        ...i,
        level: e,
        expanded: i.expanded ?? !1,
        selected: i.selected ?? !1
      };
      return i.children && (s.children = this.processRows(i.children, e + 1)), s;
    });
  }
  setColumns(t) {
    this.state.columns = t;
  }
  setRows(t) {
    this.state.rows = this.processRows(t), this.applyFiltersAndSort();
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
  swapColumnsByKey(t, e) {
    if (t === e) return;
    const i = this.findColumnByKey(this.state.columns, t), s = this.findColumnByKey(this.state.columns, e);
    if (!(!i || !s)) {
      if (i.parentKey && s.parentKey) {
        if (i.parentKey === s.parentKey) {
          const o = this.findColumnByKey(this.state.columns, i.parentKey);
          if (o && o.children) {
            const n = o.children.findIndex((a) => a.key === t), r = o.children.findIndex((a) => a.key === e);
            if (n >= 0 && r >= 0) {
              const a = [...o.children];
              [a[n], a[r]] = [a[r], a[n]], o.children = a;
            }
          }
        }
      } else if (!i.parentKey && !s.parentKey) {
        const o = this.state.columns.findIndex((r) => r.key === t), n = this.state.columns.findIndex((r) => r.key === e);
        if (o >= 0 && n >= 0) {
          const r = [...this.state.columns];
          [r[o], r[n]] = [r[n], r[o]], this.state.columns = r;
        }
      }
    }
  }
  reorderColumns(t, e) {
    if (t === e) return;
    const i = this.getLeafColumnInfo(t);
    if (!i) return;
    const s = this.countLeafColumns(this.state.columns);
    let o = e;
    t < e && (o = e - 1), o < 0 && (o = 0), o > s - 1 && (o = s - 1);
    const n = this.getLeafColumnInfo(o);
    if (n)
      if (i.parent && n.parent)
        if (i.parent === n.parent) {
          const r = this.findColumnByKey(this.state.columns, i.parent);
          if (r && r.children) {
            const a = [...r.children], [l] = a.splice(i.indexInParent, 1);
            a.splice(n.indexInParent, 0, l), r.children = a;
          }
        } else
          return;
      else if (!i.parent && !n.parent) {
        const r = [...this.state.columns], [a] = r.splice(i.indexInParent, 1);
        r.splice(n.indexInParent, 0, a), this.state.columns = r;
      } else
        return;
  }
  countLeafColumns(t) {
    let e = 0;
    for (const i of t)
      i.children && i.children.length > 0 ? e += this.countLeafColumns(i.children) : e++;
    return e;
  }
  getLeafColumnInfo(t) {
    let e = 0;
    const i = (s, o) => {
      for (let n = 0; n < s.length; n++) {
        const r = s[n];
        if (r.children && r.children.length > 0) {
          const a = i(r.children, r.key);
          if (a) return a;
        } else {
          if (e === t)
            return { parent: o, indexInParent: n, column: r };
          e++;
        }
      }
      return null;
    };
    return i(this.state.columns, null);
  }
  findColumnByKey(t, e) {
    for (const i of t) {
      if (i.key === e) return i;
      if (i.children) {
        const s = this.findColumnByKey(i.children, e);
        if (s) return s;
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
  countAllRows(t) {
    let e = 0;
    for (const i of t)
      e++, i.children && i.expanded && (e += this.countAllRows(i.children));
    return e;
  }
  sort(t) {
    this.state.sort = t, this.applyFiltersAndSort();
  }
  getSort() {
    return [...this.state.sort];
  }
  clearSort() {
    this.state.sort = [], this.applyFiltersAndSort();
  }
  filter(t) {
    this.state.filters = [...t], this.applyFiltersAndSort();
  }
  getFilters() {
    return [...this.state.filters];
  }
  clearFilters() {
    this.state.filters = [], this.applyFiltersAndSort();
  }
  applyFiltersAndSort() {
    let t = [...this.state.rows];
    this.state.filters.length > 0 && (t = this.applyFilters(t)), this.state.filteredRows = t, this.state.sort.length > 0 && (t = this.applySort(t)), t = this.flattenRowsForDisplay(t), this.state.sortedRows = t;
  }
  flattenRowsForDisplay(t, e = !0) {
    const i = [];
    for (const s of t)
      if (e && (i.push(s), s.children && s.children.length > 0 && s.expanded)) {
        const o = this.flattenRowsForDisplay(s.children, !0);
        i.push(...o);
      }
    return i;
  }
  applyFilters(t) {
    const e = (i, s) => {
      for (const o of i) {
        if (o.key === s) return o;
        if (o.children) {
          const n = e(o.children, s);
          if (n) return n;
        }
      }
    };
    return t.filter((i) => {
      const s = this.state.filters.every((o) => {
        const n = e(this.state.columns, o.column);
        if (!n) return !0;
        const r = i.data[$(n)];
        return this.matchesFilter(r, o, i, n);
      });
      return s && i.children && this.applyFilters(i.children).length > 0 ? !0 : s;
    });
  }
  matchesFilter(t, e, i, s) {
    var a;
    if ((a = s.filter) != null && a.custom)
      return s.filter.custom(t, e.value, i);
    const o = e.value, n = String(t ?? "").toLowerCase(), r = String(o ?? "").toLowerCase();
    if (e.operator === "in")
      return Array.isArray(o) ? Array.isArray(t) ? t.some((l) => typeof l == "object" && l !== null && "text" in l ? o.some((h) => String(h) === String(l.text)) : o.some((h) => String(h) === String(l))) : o.some((l) => String(l) === String(t)) : !1;
    if (e.operator === "between" && typeof o == "object" && o !== null) {
      const l = o, h = Number(t);
      if (isNaN(h)) return !1;
      const { min: c, max: d } = l;
      return c !== void 0 && d !== void 0 ? h >= c && h <= d : c !== void 0 ? h >= c : d !== void 0 ? h <= d : !0;
    }
    if (e.operator === "dateRange" && typeof o == "object" && o !== null) {
      const l = o, h = t instanceof Date ? t : new Date(String(t));
      if (isNaN(h.getTime())) return !1;
      const { start: c, end: d } = l;
      return c && d ? h >= c && h <= d : c ? h >= c : d ? h <= d : !0;
    }
    switch (e.operator) {
      case "equals":
      case "=":
        return n === r;
      case "notEquals":
      case "!=":
        return n !== r;
      case "contains":
        return n.includes(r);
      case "notContains":
        return !n.includes(r);
      case "startsWith":
        return n.startsWith(r);
      case "endsWith":
        return n.endsWith(r);
      case "gt":
      case ">":
        return Number(t) > Number(o);
      case "gte":
      case ">=":
        return Number(t) >= Number(o);
      case "lt":
      case "<":
        return Number(t) < Number(o);
      case "lte":
      case "<=":
        return Number(t) <= Number(o);
      case "notIn":
        return Array.isArray(o) ? !o.some((l) => String(l) === String(t)) : !1;
      case "isEmpty":
        return t == null || t === "";
      case "isNotEmpty":
        return t != null && t !== "";
      case "regex":
        try {
          return new RegExp(String(o), "i").test(n);
        } catch {
          return !1;
        }
      default:
        return !0;
    }
  }
  applySort(t) {
    const e = (s, o) => {
      for (const n of s) {
        if (n.key === o) return n;
        if (n.children) {
          const r = e(n.children, o);
          if (r) return r;
        }
      }
    }, i = [...t].sort((s, o) => {
      for (const n of this.state.sort) {
        const r = e(this.state.columns, n.column);
        if (!r) continue;
        const a = $(r), l = s.data[a], h = o.data[a];
        let c = this.compareValues(l, h, r.type);
        if (c !== 0)
          return n.direction === "desc" ? -c : c;
      }
      return 0;
    });
    for (const s of i)
      s.children && this.applySort(s.children);
    return i;
  }
  compareValues(t, e, i) {
    if (t === e) return 0;
    if (t == null) return -1;
    if (e == null) return 1;
    switch (i) {
      case "number":
        return Number(t) - Number(e);
      case "date":
        return new Date(t).getTime() - new Date(e).getTime();
      case "boolean":
        return Number(t) - Number(e);
      default: {
        const s = this.extractNumber(t), o = this.extractNumber(e);
        return s !== null && o !== null ? s - o : String(t).localeCompare(String(e));
      }
    }
  }
  /**
   * Extract numeric value from a value
   * Handles: numbers, strings with numbers (e.g., "8%", "79%", "$100", "1,234.56")
   * Returns null if not a valid number
   */
  extractNumber(t) {
    if (typeof t == "number") return t;
    if (typeof t != "string") return null;
    const e = t.replace(/^[^\d.-]+/, "").replace(/[^\d.-]+$/, "").replace(/,/g, ""), i = parseFloat(e);
    return isNaN(i) ? null : i;
  }
  updateCell(t, e, i, s) {
    const o = this.state.sortedRows[t];
    if (!o)
      throw new Error(`Row at index ${t} not found`);
    const n = (d, u) => {
      for (const f of d) {
        if (f.key === u) return f;
        if (f.children) {
          const g = n(f.children, u);
          if (g) return g;
        }
      }
    }, r = n(this.state.columns, e), a = s ?? (r == null ? void 0 : r.field) ?? e;
    let l = i;
    if (r)
      switch (r.type) {
        case "number":
          l = i !== "" && i !== null && i !== void 0 ? Number(i) : null;
          break;
        case "boolean":
          l = !!i;
          break;
        case "date":
          typeof i == "string" && i && (l = i);
          break;
        default:
          l = i;
      }
    const h = o.data[a];
    o.data[a] = l, this.rowVersionManager.incrementVersion(o), this.recordAction({
      type: "update",
      row: o,
      column: a,
      oldValue: h,
      newValue: l
    });
    const c = this.findStateRow(o);
    return c && (c.data[a] = l), this.applyFiltersAndSort(), {
      type: "update",
      rowIndex: t,
      column: a,
      oldValue: h,
      newValue: l
    };
  }
  updateRow(t, e) {
    const i = this.state.sortedRows[t];
    if (!i)
      throw new Error(`Row at index ${t} not found`);
    const s = [];
    for (const [n, r] of Object.entries(e)) {
      const a = i.data[n];
      a !== r && (i.data[n] = r, s.push({
        type: "update",
        rowIndex: t,
        column: n,
        oldValue: a,
        newValue: r
      }));
    }
    for (const n of s)
      this.recordAction({
        type: "update",
        row: i,
        column: n.column,
        oldValue: n.oldValue,
        newValue: n.newValue
      });
    s.length > 0 && this.rowVersionManager.incrementVersion(i);
    const o = this.findStateRow(i);
    return o && Object.assign(o.data, e), this.applyFiltersAndSort(), s;
  }
  addRow(t, e) {
    const i = {
      data: t,
      expanded: !1,
      selected: !1,
      level: 0
    }, s = e !== void 0 && e >= 0 && e <= this.state.rows.length ? e : this.state.rows.length;
    return e !== void 0 && e >= 0 && e <= this.state.rows.length ? this.state.rows.splice(e, 0, i) : this.state.rows.push(i), this.recordAction({
      type: "add",
      row: i,
      rowIndex: s,
      rowData: { ...i, data: { ...i.data } }
    }), this.applyFiltersAndSort(), {
      type: "add",
      rowIndex: s,
      row: i
    };
  }
  findRootRowIndexByRef(t) {
    return this.state.rows.findIndex((e) => e === t);
  }
  addRowRelativeTo(t, e, i) {
    if ((t.level ?? 0) > 0)
      throw new Error("Adding rows relative to child rows is not supported");
    const s = this.findRootRowIndexByRef(t);
    if (s < 0)
      throw new Error("Target row not found");
    const o = i === "above" ? s : s + 1;
    return this.addRow(e, o);
  }
  deleteRow(t) {
    const e = this.state.sortedRows[t];
    if (!e)
      throw new Error(`Row at index ${t} not found`);
    const i = this.state.rows.indexOf(e);
    return i !== -1 && this.state.rows.splice(i, 1), this.recordAction({
      type: "delete",
      row: e,
      rowIndex: i,
      rowData: { ...e, data: { ...e.data } }
    }), this.applyFiltersAndSort(), {
      type: "delete",
      rowIndex: t,
      row: e
    };
  }
  deleteRowByRef(t) {
    if ((t.level ?? 0) > 0)
      throw new Error("Deleting child rows by reference is not supported");
    const e = this.findRootRowIndexByRef(t);
    if (e < 0)
      throw new Error("Row not found");
    return this.state.rows.splice(e, 1), this.recordAction({
      type: "delete",
      row: t,
      rowIndex: e,
      rowData: { ...t, data: { ...t.data } }
    }), this.applyFiltersAndSort(), {
      type: "delete",
      rowIndex: e,
      row: t
    };
  }
  toggleRowExpand(t) {
    const e = this.state.sortedRows[t];
    if (!e || !e.children) return !1;
    e.expanded = !e.expanded;
    const i = this.findStateRow(e);
    return i && (i.expanded = e.expanded), this.applyFiltersAndSort(), e.expanded;
  }
  setRowSelected(t, e) {
    const i = this.state.sortedRows[t];
    if (!i) return;
    i.selected = e;
    const s = this.findStateRow(i);
    s && (s.selected = e);
  }
  findStateRow(t) {
    const e = (i) => {
      for (const s of i) {
        if (s === t) return s;
        if (s.children) {
          const o = e(s.children);
          if (o) return o;
        }
      }
    };
    return e(this.state.rows);
  }
  getSelectedRows() {
    const t = [];
    return this.state.sortedRows.forEach((e, i) => {
      e.selected && t.push(i);
    }), t;
  }
  selectAll(t) {
    const e = (i) => {
      i.forEach((s) => {
        s.selected = t, s.children && e(s.children);
      });
    };
    e(this.state.sortedRows), e(this.state.rows);
  }
  getVisibleRows(t, e) {
    const i = [], s = (o, n, r) => {
      let a = 0;
      for (const l of o)
        if (a >= n && a <= r && i.push(l), a++, l.children && l.expanded && s(l.children, n - a, r - a), a > r) break;
    };
    return s(this.state.sortedRows, t, e), i;
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
    for (; this.canUndo(); )
      this.undo();
    this.state.filters = [], this.state.sort = [], this.applyFiltersAndSort();
  }
  // === 历史记录方法 ===
  /**
   * 记录操作到历史栈
   */
  recordAction(t) {
    const e = this.historyOptions.maxActions ?? Mt;
    e <= 0 || (this.historyStack.push(t), this.redoStack = [], this.historyStack.length > e && this.historyStack.shift());
  }
  /**
   * 撤销上一步操作
   * @returns 是否撤销成功
   */
  undo() {
    if (!this.canUndo()) return !1;
    const t = this.historyStack.pop();
    return this.undoAction(t), this.redoStack.push(t), !0;
  }
  /**
   * 执行撤销操作
   */
  undoAction(t) {
    switch (t.type) {
      case "update": {
        t.row.data[t.column] = t.oldValue;
        break;
      }
      case "add": {
        const e = this.state.rows.indexOf(t.row);
        e !== -1 && this.state.rows.splice(e, 1);
        break;
      }
      case "delete": {
        t.rowIndex >= 0 && t.rowIndex <= this.state.rows.length ? this.state.rows.splice(t.rowIndex, 0, t.rowData) : this.state.rows.push(t.rowData);
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
    if (!this.canRedo()) return !1;
    const t = this.redoStack.pop();
    return this.redoAction(t), this.historyStack.push(t), !0;
  }
  /**
   * 执行重做操作
   */
  redoAction(t) {
    switch (t.type) {
      case "update": {
        t.row.data[t.column] = t.newValue;
        break;
      }
      case "add": {
        t.rowIndex >= 0 && t.rowIndex <= this.state.rows.length ? this.state.rows.splice(t.rowIndex, 0, t.rowData) : this.state.rows.push(t.rowData);
        break;
      }
      case "delete": {
        const e = this.state.rows.indexOf(t.rowData);
        e !== -1 && this.state.rows.splice(e, 1);
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
    this.historyStack = [], this.redoStack = [];
  }
  /**
   * 销毁实例，清理所有状态
   */
  destroy() {
    this.state.rows = [], this.state.filteredRows = [], this.state.sortedRows = [], this.state.columns = [], this.state.filters = [], this.state.sort = [], this.historyStack = [], this.redoStack = [];
  }
  /**
   * 设置历史记录配置
   */
  setHistoryOptions(t) {
    this.historyOptions = { ...this.historyOptions, ...t };
    const e = this.historyOptions.maxActions ?? Mt;
    for (; this.historyStack.length > e && e > 0; )
      this.historyStack.shift();
  }
  exportData(t) {
    const { includeHeaders: e = !0 } = t, i = this.getExportContext(t), s = [];
    e && s.push(i.leafColumns.map((o) => o.title));
    for (const o of i.rows)
      s.push(o.cells.map((n) => n.displayValue));
    return s;
  }
  getExportContext(t) {
    const { includeHidden: e = !1, selectedOnly: i = !1, showRowNumbers: s = !1 } = t, o = i ? this.state.sortedRows.filter((h) => h.selected) : this.state.sortedRows, n = this.getExportColumnTree(e), r = this.getLeafColumnsList(e), a = this.getHeaderDepth(n), l = r.filter((h) => h.fixed === "left").length;
    return {
      columnTree: n,
      leafColumns: r,
      rows: o.map((h, c) => ({
        row: h,
        rowIndex: c,
        cells: r.map((d) => {
          const u = h.data[$(d)];
          return {
            column: d,
            rawValue: u,
            displayValue: ue(d, h, c)
          };
        })
      })),
      bodyMerges: o.flatMap(
        (h, c) => (h.cellMerges ?? []).map((d) => ({
          startRow: c,
          startCol: Math.max(0, d.columnIndex - (s ? 1 : 0)),
          endRow: c + d.rowspan - 1,
          endCol: Math.max(0, d.columnIndex - (s ? 1 : 0)) + d.colspan - 1
        }))
      ),
      headerDepth: a,
      leftFixedLeafColumnCount: l
    };
  }
  getLeafColumnsList(t = !1) {
    const e = [], i = (s, o = !1) => {
      for (const n of s) {
        const r = o || n.hidden === !0;
        n.children && n.children.length > 0 ? i(n.children, r) : (t || !r) && e.push(n);
      }
    };
    return i(this.state.columns), e;
  }
  getExportColumnTree(t = !1) {
    const e = (i, s = !1) => {
      const o = [];
      for (const n of i) {
        const r = s || n.hidden === !0, a = n.children ? e(n.children, r) : void 0;
        if (a && a.length > 0) {
          o.push({
            ...n,
            children: a
          });
          continue;
        }
        (t || !r) && o.push({
          ...n,
          children: void 0
        });
      }
      return o;
    };
    return e(this.state.columns);
  }
  getHeaderDepth(t) {
    return t.length === 0 ? 0 : Math.max(
      ...t.map(
        (e) => e.children && e.children.length > 0 ? 1 + this.getHeaderDepth(e.children) : 1
      )
    );
  }
}
const Kt = 5, jt = 2, Je = 32, Tt = 150, Qt = 50, qt = 500, it = class it {
  constructor(t, e) {
    b(this, "layoutInfo");
    b(this, "visibleRange");
    b(this, "config");
    b(this, "theme");
    b(this, "columnWidths", /* @__PURE__ */ new Map());
    b(this, "rowHeights", []);
    b(this, "rowOffsets", []);
    b(this, "rowBands");
    b(this, "rowPinManager");
    b(this, "rowHeightByRow", /* @__PURE__ */ new WeakMap());
    b(this, "rowIndexByRow", /* @__PURE__ */ new WeakMap());
    b(this, "bodyRowIndexByRow", /* @__PURE__ */ new WeakMap());
    b(this, "rowBandOffsetByRow", /* @__PURE__ */ new WeakMap());
    b(this, "pinnedRowByRow", /* @__PURE__ */ new WeakMap());
    b(this, "bodyRowHeights", []);
    b(this, "bodyRowOffsets", []);
    b(this, "pinnedTopHeight", 0);
    b(this, "pinnedBottomHeight", 0);
    b(this, "summaryTopHeight", 0);
    b(this, "summaryBottomHeight", 0);
    b(this, "bodyViewportHeight", 0);
    b(this, "columnOffsets", []);
    b(this, "columns", []);
    b(this, "headerDepth", 1);
    b(this, "headerCells", []);
    b(this, "leafColumns", []);
    b(this, "cellMergeMap", /* @__PURE__ */ new Map());
    b(this, "cellMergeByRow", /* @__PURE__ */ new Map());
    b(this, "mergedCellSet", /* @__PURE__ */ new Set());
    b(this, "cellToMergeMap", /* @__PURE__ */ new Map());
    // 动态行高支持
    b(this, "rowHeightOverrides", /* @__PURE__ */ new WeakMap());
    b(this, "hasRowHeightOverrides", !1);
    b(this, "rowHeightFn");
    b(this, "cachedRows", []);
    // 缓存行引用，用于检测数据变化
    b(this, "rowHeightsDirty", !0);
    // 标记行高度是否需要重新计算
    b(this, "viewportWidth", 0);
    b(this, "viewportHeight", 0);
    b(this, "scrollLeft", 0);
    b(this, "scrollTop", 0);
    b(this, "showRowNumbers", !1);
    b(this, "rowNumberColumnWidth", 50);
    this.config = {
      enabled: (t == null ? void 0 : t.enabled) ?? !0,
      rowBufferSize: (t == null ? void 0 : t.rowBufferSize) ?? Kt,
      columnBufferSize: (t == null ? void 0 : t.columnBufferSize) ?? jt,
      estimatedRowHeight: (t == null ? void 0 : t.estimatedRowHeight) ?? Je,
      estimatedColumnWidth: (t == null ? void 0 : t.estimatedColumnWidth) ?? Tt
    }, this.theme = e, this.layoutInfo = this.createEmptyLayoutInfo(), this.rowBands = this.createEmptyRowBands(), this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
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
  setShowRowNumbers(t) {
    this.showRowNumbers = t;
  }
  getShowRowNumbers() {
    return this.showRowNumbers;
  }
  getRowNumberColumnWidth() {
    return this.showRowNumbers ? this.rowNumberColumnWidth : 0;
  }
  hasLeftFixedColumns() {
    return this.leafColumns.some(
      (t) => (t == null ? void 0 : t.fixed) === "left" && !t._isRowNumber && !t.key.startsWith(it.HIDDEN_PLACEHOLDER_PREFIX)
    );
  }
  isHiddenPlaceholderColumn(t) {
    return t.key.startsWith(it.HIDDEN_PLACEHOLDER_PREFIX);
  }
  getHiddenColumnKey(t) {
    return this.isHiddenPlaceholderColumn(t) ? t._hiddenColumnKey ?? null : null;
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
  setViewportSize(t, e) {
    this.viewportWidth = t, this.viewportHeight = e, this.layoutInfo.viewportWidth = t, this.layoutInfo.viewportHeight = e, this.updateVisibleRange();
  }
  setTheme(t) {
    this.theme = t, this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth, this.layoutInfo.rowHeight = this.theme.row.height;
  }
  setRowHeightFn(t) {
    this.rowHeightFn = t, this.rowHeightsDirty = !0;
  }
  setRowPinManager(t) {
    this.rowPinManager = t, this.rowHeightsDirty = !0;
  }
  setSummaryRows(t, e) {
    this.rowBands.summaryTop.rows = [...t], this.rowBands.summaryBottom.rows = [...e], this.summaryTopHeight = this.calculateSummaryRowsHeight(t), this.summaryBottomHeight = this.calculateSummaryRowsHeight(e), this.rowBands.summaryTop.height = this.summaryTopHeight, this.rowBands.summaryBottom.height = this.summaryBottomHeight, this.updateRowBandGeometry(), this.updateVisibleRange();
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
  getRowPinPosition(t) {
    var e;
    return ((e = this.rowPinManager) == null ? void 0 : e.getPosition(t)) ?? null;
  }
  setRowHeight(t, e) {
    const i = J(e, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(t, i), this.hasRowHeightOverrides = !0, this.rowHeightsDirty = !0;
  }
  updateRowHeight(t, e) {
    const i = J(e, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(t, i), this.hasRowHeightOverrides = !0;
    const s = this.rowIndexByRow.get(t);
    if (s === void 0 || s < 0 || s >= this.rowHeights.length)
      return this.rowHeightsDirty = !0, !1;
    const o = this.rowHeights[s] ?? this.theme.row.height, n = i - o;
    if (n === 0)
      return !0;
    this.rowHeights[s] = i, this.rowHeightByRow.set(t, i);
    for (let a = s + 1; a < this.rowOffsets.length; a++)
      this.rowOffsets[a] = (this.rowOffsets[a] ?? 0) + n;
    this.layoutInfo.rowOffsets = this.rowOffsets;
    const r = this.bodyRowIndexByRow.get(t);
    if (r !== void 0 && r >= 0) {
      this.bodyRowHeights[r] = i;
      for (let a = r + 1; a < this.bodyRowOffsets.length; a++)
        this.bodyRowOffsets[a] = (this.bodyRowOffsets[a] ?? 0) + n;
      this.rowBands.body.height += n;
    } else
      this.updatePinnedRowHeight(t, n);
    return this.updateRowBandGeometry(), this.layoutInfo.totalHeight = this.calculateTotalHeight(this.rowHeights.length), this.updateVisibleRange(), !0;
  }
  updateRowPin(t, e, i) {
    const s = this.rowIndexByRow.get(t);
    if (s === void 0 || s < 0 || s >= this.rowHeights.length)
      return !1;
    if (e === i)
      return !0;
    const o = this.getResolvedRowHeight(t);
    return !this.removeRowFromPinSource(t, e, o) || !this.addRowToPinTarget(t, i, s, o) ? !1 : (this.updatePinnedBandOffsets(this.rowBands.pinnedTop.rows), this.updatePinnedBandOffsets(this.rowBands.pinnedBottom.rows), this.updateRowBandGeometry(), this.layoutInfo.totalHeight = this.calculateTotalHeight(this.rowHeights.length), this.updateVisibleRange(), !0);
  }
  clearRowHeightOverrides() {
    this.hasRowHeightOverrides && (this.rowHeightOverrides = /* @__PURE__ */ new WeakMap(), this.hasRowHeightOverrides = !1, this.rowHeightsDirty = !0);
  }
  setScrollPosition(t, e) {
    this.scrollLeft = t, this.scrollTop = e, this.updateVisibleRange();
  }
  getScrollLeft() {
    return this.scrollLeft;
  }
  createRowNumberColumn(t) {
    return {
      key: `__row_number_${Date.now()}__`,
      title: "#",
      width: this.rowNumberColumnWidth,
      fixed: t ? "left" : !1,
      type: "text",
      align: "center",
      hideable: !1,
      sortable: !1,
      reorderable: !1,
      _isRowNumber: !0,
      render: (e, i, s, o) => ({
        text: String(o + 1),
        type: "text",
        style: {
          color: this.theme.colors.placeholderText,
          horizontalAlign: "center"
        }
      })
    };
  }
  hasLeftFixedColumnsIn(t) {
    for (const e of t)
      if (e.fixed === "left" || e.children && this.hasLeftFixedColumnsIn(e.children)) return !0;
    return !1;
  }
  buildLayoutColumns(t) {
    return this.showRowNumbers ? [this.createRowNumberColumn(this.hasLeftFixedColumnsIn(t)), ...t] : t;
  }
  getVisibleLeafColumnsForLayout(t) {
    const e = [], i = (n, r) => ({
      key: it.HIDDEN_PLACEHOLDER_PREFIX + n.key,
      title: "",
      width: it.HIDDEN_PLACEHOLDER_WIDTH,
      type: "text",
      fixed: r,
      _hiddenColumnKey: n.key
    }), s = (n, r, a) => {
      for (let l = r; l >= 0 && l < n.length; l += a) {
        const h = n[l];
        if (h && !h.hidden)
          return h.fixed === "left" || h.fixed === "right" ? h.fixed : void 0;
      }
    }, o = (n, r) => {
      let a = 0, l = !1;
      for (let h = 0; h < n.length; h++) {
        const c = n[h];
        if (c) {
          if (c.hidden) {
            const d = n.slice(0, h).some((g) => g && !g.hidden), u = n.slice(h + 1).some((g) => g && !g.hidden);
            if (r ? d && u : (l === !1 || a > 0) && (u || a > 0)) {
              const g = s(n, h - 1, -1), m = s(n, h + 1, 1), y = i(c, g === m ? g : void 0);
              e.push(y), a += it.HIDDEN_PLACEHOLDER_WIDTH;
            }
            l = !0;
            continue;
          }
          if (l = !1, c.children && c.children.length > 0) {
            const d = e.length;
            o(c.children, !1), e.length > d && (a += e.slice(d).reduce((u, f) => u + this.getColumnWidth(f), 0));
          } else
            e.push(c), a += this.getColumnWidth(c);
        }
      }
    };
    return o(this.buildLayoutColumns(t), !0), e;
  }
  calculateLayout(t, e) {
    return this.columns = this.buildLayoutColumns(t), this.calculateHeaderLayout(this.columns), this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth, this.calculateColumnLayout(this.columns), this.calculateRowLayout(e), this.calculateCellMerges(e), this.layoutInfo.totalWidth = this.calculateTotalWidth(), this.layoutInfo.totalHeight = this.calculateTotalHeight(e.length), { ...this.layoutInfo };
  }
  /**
   * 只更新列相关的布局（用于列重排、列交换等操作）
   * 避免遍历所有行，提升大数据量时的性能
   */
  calculateColumnLayoutOnly(t) {
    return this.columns = this.buildLayoutColumns(t), this.calculateHeaderLayout(this.columns), this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth, this.calculateColumnLayout(this.columns), this.layoutInfo.totalWidth = this.calculateTotalWidth(), { ...this.layoutInfo };
  }
  calculateHeaderLayout(t) {
    this.headerCells = [], this.leafColumns = [], this.headerDepth = 1;
    const e = (o, n) => {
      if (o.hidden) return n;
      if (o.children && o.children.length > 0) {
        let r = n;
        for (const a of o.children)
          a.hidden || (r = Math.max(
            r,
            e(a, n + 1)
          ));
        return r;
      }
      return n;
    };
    for (const o of t)
      o.hidden || (this.headerDepth = Math.max(this.headerDepth, e(o, 0) + 1));
    const i = (o, n, r, a) => {
      if (o.depth = n, o.parentKey = a, o.hidden)
        return 0;
      if (o.children && o.children.length > 0) {
        let l = r, h = 0, c = 0, d = !1;
        for (let u = 0; u < o.children.length; u++) {
          const f = o.children[u];
          if (!f) continue;
          if (f.hidden) {
            const m = o.children.slice(u + 1).some((p) => p && !p.hidden);
            if ((d === !1 || h > 0) && (m || h > 0)) {
              let p;
              for (let S = u - 1; S >= 0; S--) {
                const T = o.children[S];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (p = T.fixed);
                  break;
                }
              }
              let y;
              for (let S = u + 1; S < o.children.length; S++) {
                const T = o.children[S];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (y = T.fixed);
                  break;
                }
              }
              const w = p === y ? p : void 0, C = it.HIDDEN_PLACEHOLDER_PREFIX + f.key, R = {
                key: C,
                title: "",
                width: it.HIDDEN_PLACEHOLDER_WIDTH,
                type: "text",
                fixed: w,
                _hiddenColumnKey: f.key
              }, v = it.HIDDEN_PLACEHOLDER_WIDTH;
              this.columnWidths.set(C, v), this.leafColumns.push(R);
              const I = n + 1, M = this.headerDepth - I;
              this.headerCells.push({
                column: R,
                x: l,
                y: I * this.theme.row.headerHeight,
                width: v,
                height: this.theme.row.headerHeight * M,
                rowIndex: I,
                colIndex: this.leafColumns.length - 1,
                colspan: 1,
                rowspan: M,
                isLeaf: !0
              }), h += v, l += v;
            }
            d = !0;
            continue;
          }
          d = !1;
          const g = i(f, n + 1, l, o.key);
          l += g, h += g, c++;
        }
        return c === 0 ? 0 : (this.headerCells.push({
          column: o,
          x: r,
          y: n * this.theme.row.headerHeight,
          width: h,
          height: this.theme.row.headerHeight,
          rowIndex: n,
          colIndex: this.headerCells.length,
          colspan: c,
          rowspan: 1,
          isLeaf: !1
        }), h);
      } else {
        const l = this.getColumnWidth(o);
        this.columnWidths.set(o.key, l);
        const h = this.headerDepth - n;
        return this.headerCells.push({
          column: o,
          x: r,
          y: n * this.theme.row.headerHeight,
          width: l,
          height: this.theme.row.headerHeight * h,
          rowIndex: n,
          colIndex: this.leafColumns.length,
          colspan: 1,
          rowspan: h,
          isLeaf: !0
        }), this.leafColumns.push(o), l;
      }
    };
    let s = 0;
    for (let o = 0; o < t.length; o++) {
      const n = t[o];
      if (n) {
        if (n.hidden) {
          const r = t.slice(o + 1).some((l) => l && !l.hidden);
          if (t.slice(0, o).some((l) => l && !l.hidden) && r) {
            let l;
            for (let g = o - 1; g >= 0; g--) {
              const m = t[g];
              if (m && !m.hidden) {
                (m.fixed === "left" || m.fixed === "right") && (l = m.fixed);
                break;
              }
            }
            let h;
            for (let g = o + 1; g < t.length; g++) {
              const m = t[g];
              if (m && !m.hidden) {
                (m.fixed === "left" || m.fixed === "right") && (h = m.fixed);
                break;
              }
            }
            const c = l === h ? l : void 0, d = it.HIDDEN_PLACEHOLDER_PREFIX + n.key, u = {
              key: d,
              title: "",
              width: it.HIDDEN_PLACEHOLDER_WIDTH,
              type: "text",
              fixed: c,
              _hiddenColumnKey: n.key
            }, f = it.HIDDEN_PLACEHOLDER_WIDTH;
            this.columnWidths.set(d, f), this.headerCells.push({
              column: u,
              x: s,
              y: 0,
              width: f,
              height: this.theme.row.headerHeight * this.headerDepth,
              rowIndex: 0,
              colIndex: this.leafColumns.length,
              colspan: 1,
              rowspan: this.headerDepth,
              isLeaf: !0
            }), this.leafColumns.push(u), s += f;
          }
          continue;
        }
        s += i(n, 0, s);
      }
    }
  }
  calculateColumnLayout(t) {
    this.columnOffsets = [];
    const e = [];
    let i = 0;
    for (const s of this.leafColumns) {
      const o = this.columnWidths.get(s.key) ?? this.getColumnWidth(s);
      e.push(o), this.columnOffsets.push(i), i += o;
    }
    this.layoutInfo.columnWidths = e;
  }
  calculateCellMerges(t) {
    this.cellMergeMap.clear(), this.cellMergeByRow.clear(), this.mergedCellSet.clear(), this.cellToMergeMap.clear();
    for (let e = 0; e < t.length; e++) {
      const i = t[e];
      if (!(!i || !i.cellMerges))
        for (const s of i.cellMerges) {
          const o = {
            ...s,
            rowIndex: e
          }, n = `${e}-${s.columnIndex}`;
          this.cellMergeMap.set(n, o), this.cellToMergeMap.set(n, o);
          for (let r = e; r < e + s.rowspan; r++) {
            this.cellMergeByRow.has(r) || this.cellMergeByRow.set(r, []), this.cellMergeByRow.get(r).push(o);
            for (let a = s.columnIndex; a < s.columnIndex + s.colspan; a++)
              (r !== e || a !== s.columnIndex) && (this.mergedCellSet.add(`${r}-${a}`), this.cellToMergeMap.set(`${r}-${a}`, o));
          }
        }
    }
  }
  calculateRowLayout(t) {
    const e = t.length, i = this.theme.row.height;
    if (!(e !== this.cachedRows.length || t.some((n, r) => n !== this.cachedRows[r])) && !this.rowHeightsDirty && this.rowHeights.length === e) {
      this.calculateRowBands(t);
      return;
    }
    this.cachedRows = [...t], this.rowHeightsDirty = !1, this.rowHeightByRow = /* @__PURE__ */ new WeakMap(), this.rowIndexByRow = /* @__PURE__ */ new WeakMap();
    const o = this.rowHeightFn;
    this.rowHeights = t.map((n, r) => {
      const a = this.rowHeightOverrides.get(n);
      return a !== void 0 ? J(a, this.theme.row.minHeight, this.theme.row.maxHeight) : o ? o(n, r) : i;
    }), t.forEach((n, r) => {
      this.rowHeightByRow.set(n, this.rowHeights[r] ?? i), this.rowIndexByRow.set(n, r);
    }), this.rowOffsets = Array.from({ length: e }), this.rowOffsets[0] = this.layoutInfo.headerHeight;
    for (let n = 1; n < e; n++)
      this.rowOffsets[n] = this.rowOffsets[n - 1] + this.rowHeights[n - 1];
    this.layoutInfo.rowOffsets = [...this.rowOffsets], this.calculateRowBands(t);
  }
  calculateRowBands(t) {
    this.bodyRowIndexByRow = /* @__PURE__ */ new WeakMap(), this.rowBandOffsetByRow = /* @__PURE__ */ new WeakMap(), this.pinnedRowByRow = /* @__PURE__ */ new WeakMap();
    const e = new Set(t), i = this.rowPinManager ? this.rowPinManager.getTopRows().filter((u) => e.has(u)) : [], s = this.rowPinManager ? this.rowPinManager.getBottomRows().filter((u) => e.has(u)) : [], o = this.rowPinManager ? t.filter((u) => !this.rowPinManager.isPinned(u)) : t;
    this.pinnedTopHeight = this.calculateRowsHeight(i), this.pinnedBottomHeight = this.calculateRowsHeight(s), this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight - this.layoutInfo.headerHeight - this.summaryTopHeight - this.pinnedTopHeight - this.pinnedBottomHeight - this.summaryBottomHeight
    );
    const n = this.layoutInfo.headerHeight, r = n + this.summaryTopHeight, a = r + this.pinnedTopHeight, l = this.viewportHeight > 0 ? Math.max(a, this.viewportHeight - this.summaryBottomHeight) : a + this.calculateRowsHeight(o) + this.pinnedBottomHeight, h = this.viewportHeight > 0 ? Math.max(a, l - this.pinnedBottomHeight) : a + this.calculateRowsHeight(o);
    if (this.rowBands = {
      summaryTop: {
        type: "summary-top",
        rows: this.rowBands.summaryTop.rows,
        height: this.summaryTopHeight,
        y: n
      },
      pinnedTop: {
        type: "pinned-top",
        rows: i,
        height: this.pinnedTopHeight,
        y: r
      },
      body: {
        type: "body",
        rows: o,
        height: this.calculateRowsHeight(o),
        y: a
      },
      pinnedBottom: {
        type: "pinned-bottom",
        rows: s,
        height: this.pinnedBottomHeight,
        y: h
      },
      summaryBottom: {
        type: "summary-bottom",
        rows: this.rowBands.summaryBottom.rows,
        height: this.summaryBottomHeight,
        y: l
      }
    }, this.bodyRowHeights = o.map((u) => this.getResolvedRowHeight(u)), this.bodyRowOffsets = Array.from({ length: o.length }), o.length > 0) {
      this.bodyRowOffsets[0] = 0;
      for (let u = 1; u < o.length; u++)
        this.bodyRowOffsets[u] = this.bodyRowOffsets[u - 1] + this.bodyRowHeights[u - 1];
    }
    let c = 0;
    for (const u of i)
      this.pinnedRowByRow.set(u, !0), this.rowBandOffsetByRow.set(u, c), c += this.getResolvedRowHeight(u);
    for (let u = 0; u < o.length; u++) {
      const f = o[u];
      this.bodyRowIndexByRow.set(f, u), this.rowBandOffsetByRow.set(f, this.bodyRowOffsets[u] ?? 0);
    }
    let d = 0;
    for (const u of s)
      this.pinnedRowByRow.set(u, !0), this.rowBandOffsetByRow.set(u, d), d += this.getResolvedRowHeight(u);
  }
  updatePinnedRowHeight(t, e) {
    const i = this.getRowPinPosition(t);
    if (i === "top") {
      this.pinnedTopHeight += e, this.rowBands.pinnedTop.height = this.pinnedTopHeight, this.updatePinnedBandOffsets(this.rowBands.pinnedTop.rows);
      return;
    }
    i === "bottom" && (this.pinnedBottomHeight += e, this.rowBands.pinnedBottom.height = this.pinnedBottomHeight, this.updatePinnedBandOffsets(this.rowBands.pinnedBottom.rows));
  }
  removeRowFromPinSource(t, e, i) {
    return e === "top" ? this.removePinnedRow(this.rowBands.pinnedTop.rows, t, () => {
      this.pinnedTopHeight -= i, this.rowBands.pinnedTop.height = this.pinnedTopHeight;
    }) : e === "bottom" ? this.removePinnedRow(this.rowBands.pinnedBottom.rows, t, () => {
      this.pinnedBottomHeight -= i, this.rowBands.pinnedBottom.height = this.pinnedBottomHeight;
    }) : this.removeBodyRow(t, i);
  }
  addRowToPinTarget(t, e, i, s) {
    return e === "top" ? (this.rowBands.pinnedTop.rows.push(t), this.pinnedTopHeight += s, this.rowBands.pinnedTop.height = this.pinnedTopHeight, this.pinnedRowByRow.set(t, !0), !0) : e === "bottom" ? (this.rowBands.pinnedBottom.rows.push(t), this.pinnedBottomHeight += s, this.rowBands.pinnedBottom.height = this.pinnedBottomHeight, this.pinnedRowByRow.set(t, !0), !0) : (this.insertBodyRow(t, i, s), this.pinnedRowByRow.delete(t), !0);
  }
  removePinnedRow(t, e, i) {
    const s = t.indexOf(e);
    return s < 0 ? !1 : (t.splice(s, 1), this.pinnedRowByRow.delete(e), this.rowBandOffsetByRow.delete(e), i(), !0);
  }
  removeBodyRow(t, e) {
    const i = this.bodyRowIndexByRow.get(t);
    return i === void 0 || i < 0 ? !1 : (this.rowBands.body.rows.splice(i, 1), this.bodyRowHeights.splice(i, 1), this.bodyRowOffsets.splice(i, 1), this.rowBands.body.height -= e, this.bodyRowIndexByRow.delete(t), this.rowBandOffsetByRow.delete(t), this.rebuildBodyBandFrom(i), !0);
  }
  insertBodyRow(t, e, i) {
    const s = this.findBodyInsertionIndex(e);
    this.rowBands.body.rows.splice(s, 0, t), this.bodyRowHeights.splice(s, 0, i), this.bodyRowOffsets.splice(s, 0, 0), this.rowBands.body.height += i, this.rebuildBodyBandFrom(s);
  }
  findBodyInsertionIndex(t) {
    let e = 0, i = this.rowBands.body.rows.length;
    for (; e < i; ) {
      const s = Math.floor((e + i) / 2), o = this.rowBands.body.rows[s];
      (o ? this.getRowIndexByRef(o) : -1) < t ? e = s + 1 : i = s;
    }
    return e;
  }
  rebuildBodyBandFrom(t) {
    const e = Math.max(0, t);
    for (let i = e; i < this.rowBands.body.rows.length; i++) {
      this.bodyRowOffsets[i] = i === 0 ? 0 : (this.bodyRowOffsets[i - 1] ?? 0) + (this.bodyRowHeights[i - 1] ?? 0);
      const s = this.rowBands.body.rows[i];
      this.bodyRowIndexByRow.set(s, i), this.rowBandOffsetByRow.set(s, this.bodyRowOffsets[i] ?? 0);
    }
  }
  updatePinnedBandOffsets(t) {
    let e = 0;
    for (const i of t)
      this.rowBandOffsetByRow.set(i, e), e += this.getResolvedRowHeight(i);
  }
  updateRowBandGeometry() {
    this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight - this.layoutInfo.headerHeight - this.summaryTopHeight - this.pinnedTopHeight - this.pinnedBottomHeight - this.summaryBottomHeight
    );
    const t = this.layoutInfo.headerHeight, e = t + this.summaryTopHeight, i = e + this.pinnedTopHeight, s = this.viewportHeight > 0 ? Math.max(i, this.viewportHeight - this.summaryBottomHeight) : i + this.rowBands.body.height + this.pinnedBottomHeight;
    this.rowBands.summaryTop.y = t, this.rowBands.pinnedTop.y = e, this.rowBands.body.y = i, this.rowBands.pinnedBottom.y = this.viewportHeight > 0 ? Math.max(i, s - this.pinnedBottomHeight) : i + this.rowBands.body.height, this.rowBands.summaryBottom.y = s;
  }
  calculateRowsHeight(t) {
    return t.reduce((e, i) => e + this.getResolvedRowHeight(i), 0);
  }
  calculateSummaryRowsHeight(t) {
    return t.reduce((e, i) => e + i.height, 0);
  }
  getResolvedRowHeight(t) {
    return this.rowHeightByRow.get(t) ?? this.theme.row.height;
  }
  getRowIndexByRef(t) {
    return this.rowIndexByRow.get(t) ?? -1;
  }
  getBodyRowIndexByRef(t) {
    return this.bodyRowIndexByRow.get(t) ?? -1;
  }
  getRowBandOffsetByRef(t) {
    const e = this.bodyRowIndexByRow.get(t);
    return e !== void 0 && e >= 0 ? this.bodyRowOffsets[e] ?? null : this.rowBandOffsetByRow.get(t) ?? null;
  }
  isRowInPinnedBand(t) {
    return this.pinnedRowByRow.has(t);
  }
  getColumnWidth(t) {
    if (this.columnWidths.has(t.key))
      return this.columnWidths.get(t.key);
    if (t.children && t.children.length > 0) {
      let i = 0;
      for (const s of t.children)
        i += this.getColumnWidth(s);
      return i;
    }
    let e = t.width ?? this.config.estimatedColumnWidth ?? Tt;
    return e = J(e, t.minWidth ?? Qt, t.maxWidth ?? qt), e;
  }
  setColumnWidth(t, e) {
    const i = this.getColumnByKey(t);
    if (i) {
      const s = J(
        e,
        i.minWidth ?? Qt,
        i.maxWidth ?? qt
      );
      this.columnWidths.set(t, s), this.recalculateColumnLayout(), this.recalculateHeaderLayout();
    }
  }
  recalculateColumnLayout() {
    this.columnOffsets = [];
    const t = [];
    let e = 0;
    for (const i of this.leafColumns) {
      const s = this.columnWidths.get(i.key) ?? this.getColumnWidth(i);
      t.push(s), this.columnOffsets.push(e), e += s;
    }
    this.layoutInfo.columnWidths = t, this.layoutInfo.totalWidth = this.calculateTotalWidth();
  }
  recalculateHeaderLayout() {
    const t = (e, i) => {
      let s = i;
      for (const o of e) {
        const n = this.headerCells.find((r) => r.column === o);
        n && (n.x = s, o.children && o.children.length > 0 ? n.width = t(o.children, s) : n.width = this.columnWidths.get(o.key) ?? this.getColumnWidth(o), s += n.width);
      }
      return s - i;
    };
    t(this.columns, 0);
  }
  getColumnByKey(t) {
    const e = (i) => {
      for (const s of i) {
        if (s.key === t) return s;
        if (s.children) {
          const o = e(s.children);
          if (o) return o;
        }
      }
    };
    return e(this.columns);
  }
  getLeafColumnIndexByKey(t) {
    var e;
    for (let i = 0; i < this.leafColumns.length; i++)
      if (((e = this.leafColumns[i]) == null ? void 0 : e.key) === t)
        return i;
    return null;
  }
  getLeafColumnIndex(t) {
    return this.leafColumns.findIndex((e) => e === t);
  }
  getRowHeight(t) {
    return this.theme.row.height;
  }
  calculateTotalWidth() {
    let t = 0;
    for (const e of this.leafColumns)
      t += this.columnWidths.get(e.key) ?? this.getColumnWidth(e);
    return t;
  }
  calculateTotalHeight(t) {
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
    const t = this.layoutInfo.headerHeight, e = this.config.rowBufferSize ?? Kt, i = this.config.columnBufferSize ?? jt, s = this.bodyViewportHeight > 0 ? this.bodyViewportHeight : Math.max(0, this.viewportHeight - t), o = this.findBodyRowIndexAtOffset(this.scrollTop), n = this.findBodyRowIndexAtOffset(this.scrollTop + s);
    this.visibleRange.startRow = Math.max(0, o - e), this.visibleRange.endRow = Math.min(this.bodyRowHeights.length - 1, n + e);
    const r = this.findColumnIndexAtOffset(this.scrollLeft), a = this.findColumnIndexAtOffset(this.scrollLeft + this.viewportWidth);
    this.visibleRange.startColumn = Math.max(0, r - i), this.visibleRange.endColumn = Math.min(
      this.layoutInfo.columnWidths.length - 1,
      a + i
    );
  }
  findRowIndexAtOffset(t) {
    if (t <= 0 || this.rowOffsets.length === 0) return 0;
    const e = this.rowOffsets[this.rowOffsets.length - 1] ?? 0;
    return t >= e ? this.rowOffsets.length - 1 : Gt(this.rowOffsets, t, (i) => i);
  }
  findBodyRowIndexAtOffset(t) {
    if (t <= 0 || this.bodyRowOffsets.length === 0) return 0;
    const e = this.bodyRowOffsets.length - 1, i = this.bodyRowOffsets[e] ?? 0, s = this.bodyRowHeights[e] ?? 0;
    if (t >= i + s)
      return e;
    let o = 0, n = e;
    for (; o <= n; ) {
      const r = Math.floor((o + n) / 2), a = this.bodyRowOffsets[r], l = this.bodyRowHeights[r];
      if (t >= a && t < a + l)
        return r;
      t < a ? n = r - 1 : o = r + 1;
    }
    return Math.max(0, Math.min(e, o));
  }
  findRowInBandAtOffset(t, e) {
    if (e < 0)
      return null;
    let i = 0;
    for (const s of t) {
      const o = this.getResolvedRowHeight(s);
      if (e >= i && e < i + o)
        return s;
      i += o;
    }
    return null;
  }
  findSummaryRowInBandAtOffset(t, e) {
    if (e < 0)
      return null;
    let i = 0;
    for (const s of t) {
      if (e >= i && e < i + s.height)
        return s;
      i += s.height;
    }
    return null;
  }
  getRowViewportY(t, e = this.scrollTop) {
    const i = this.cachedRows[t];
    return i ? this.rowBands.pinnedTop.rows.includes(i) ? this.rowBands.pinnedTop.y + (this.getRowBandOffsetByRef(i) ?? 0) : this.getBodyRowIndexByRef(i) >= 0 ? this.rowBands.body.y + (this.getRowBandOffsetByRef(i) ?? 0) - e : this.rowBands.pinnedBottom.rows.includes(i) ? this.rowBands.pinnedBottom.y + (this.getRowBandOffsetByRef(i) ?? 0) : null : null;
  }
  getCellViewportY(t, e = this.scrollTop) {
    return t === -1 ? 0 : this.getRowViewportY(t, e) ?? this.getRowOffset(t) - e;
  }
  findColumnIndexAtOffset(t) {
    if (t <= 0 || this.columnOffsets.length === 0) return 0;
    const e = this.columnOffsets[this.columnOffsets.length - 1] ?? 0;
    return t >= e ? this.columnOffsets.length - 1 : Gt(this.columnOffsets, t, (i) => i);
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
  getHeaderCellAtPosition(t, e) {
    const i = [];
    for (const n of this.headerCells) {
      let r;
      if (n.column.fixed === "left")
        r = n.x;
      else if (n.column.fixed === "right") {
        const a = this.getRightFixedWidth(), h = this.viewportWidth - a - (this.layoutInfo.totalWidth - a);
        r = n.x + h;
      } else
        r = n.x - this.scrollLeft;
      t >= r && t < r + n.width && e >= n.y && e < n.y + n.height && i.push(n);
    }
    if (i.length === 0) return null;
    if (i.length === 1) return i[0];
    const s = i.find(
      (n) => n.column.fixed === "left" || n.column.fixed === "right"
    );
    if (s) {
      if (s.isLeaf) return s;
      for (const n of this.headerCells) {
        if (!n.isLeaf || n.column.fixed !== s.column.fixed) continue;
        let r;
        if (n.column.fixed === "left")
          r = n.x;
        else {
          const a = this.getRightFixedWidth(), h = this.viewportWidth - a - (this.layoutInfo.totalWidth - a);
          r = n.x + h;
        }
        if (t >= r && t < r + n.width)
          return n;
      }
    }
    const o = i.find((n) => n.isLeaf);
    if (o) return o;
    for (const n of this.headerCells) {
      if (!n.isLeaf) continue;
      let r;
      if (n.column.fixed === "left")
        r = n.x;
      else if (n.column.fixed === "right") {
        const a = this.getRightFixedWidth(), h = this.viewportWidth - a - (this.layoutInfo.totalWidth - a);
        r = n.x + h;
      } else
        r = n.x - this.scrollLeft;
      if (t >= r && t < r + n.width)
        return n;
    }
    return i.reduce(
      (n, r) => r.rowIndex > n.rowIndex ? r : n
    );
  }
  getLeafHeaderCell(t) {
    const e = this.leafColumns[t];
    return e ? this.headerCells.find((i) => i.column === e && i.isLeaf) ?? null : null;
  }
  getLeafHeaderCellViewportPosition(t) {
    const e = this.getLeafHeaderCell(t);
    if (!e) return null;
    const i = e.column;
    let s = e.x;
    const o = e.y, n = e.width, r = e.height;
    if (i.fixed !== "left") if (i.fixed === "right") {
      const a = this.getRightFixedWidth(), h = this.viewportWidth - a - (this.layoutInfo.totalWidth - a);
      s = e.x + h;
    } else
      s = s - this.scrollLeft;
    return { x: s, y: o, width: n, height: r };
  }
  getLeafColumns() {
    return [...this.leafColumns];
  }
  getColumns() {
    return [...this.columns];
  }
  getLeafColumn(t) {
    return this.leafColumns[t];
  }
  getHeaderDepth() {
    return this.headerDepth;
  }
  getCellMerge(t, e) {
    return this.cellToMergeMap.get(`${t}-${e}`) ?? null;
  }
  isCellMerged(t, e) {
    return this.mergedCellSet.has(`${t}-${e}`);
  }
  isMergeStartCell(t, e) {
    const i = `${t}-${e}`;
    return this.cellMergeMap.has(i);
  }
  getMergesAffectingRow(t) {
    return this.cellMergeByRow.get(t) ?? [];
  }
  getMergedCellPosition(t, e) {
    const i = this.getCellMerge(t, e);
    if (!i) return null;
    const s = this.getColumnOffset(i.columnIndex), o = this.getRowOffset(i.rowIndex);
    let n = 0;
    for (let a = 0; a < i.colspan; a++)
      n += this.getColumnWidthByIndex(i.columnIndex + a);
    let r = 0;
    for (let a = 0; a < i.rowspan; a++)
      r += this.getRowHeightByIndex(i.rowIndex + a);
    return { x: s, y: o, width: n, height: r };
  }
  getRowOffset(t) {
    return this.rowOffsets[t] ?? 0;
  }
  getColumnOffset(t) {
    return this.columnOffsets[t] ?? 0;
  }
  getRowHeightByIndex(t) {
    return this.rowHeights[t] ?? this.theme.row.height;
  }
  getRowHeightBounds() {
    return {
      min: this.theme.row.minHeight,
      max: this.theme.row.maxHeight
    };
  }
  getColumnWidthByIndex(t) {
    return this.layoutInfo.columnWidths[t] ?? Tt;
  }
  getCellPosition(t, e) {
    const i = this.leafColumns[e];
    let s = this.getColumnOffset(e);
    const o = t === -1 ? 0 : this.getRowOffset(t), n = this.getColumnWidthByIndex(e), r = t === -1 ? this.layoutInfo.headerHeight : this.getRowHeightByIndex(t);
    if ((i == null ? void 0 : i.fixed) === "left") {
      let a = 0;
      for (let l = 0; l < this.leafColumns.length; l++) {
        const h = this.leafColumns[l];
        if ((h == null ? void 0 : h.fixed) === "left") {
          if (l === e) {
            s = a;
            break;
          }
          a += this.layoutInfo.columnWidths[l];
        }
      }
    }
    if ((i == null ? void 0 : i.fixed) === "right") {
      const a = this.getRightFixedWidth();
      let l = this.viewportWidth - a;
      for (let h = 0; h < this.leafColumns.length; h++) {
        const c = this.leafColumns[h];
        if ((c == null ? void 0 : c.fixed) === "right") {
          if (h === e) {
            s = l;
            break;
          }
          l += this.layoutInfo.columnWidths[h];
        }
      }
    }
    return { x: s, y: o, width: n, height: r };
  }
  getCellAtPosition(t, e, i) {
    const s = this.layoutInfo.headerHeight, o = i ?? this.scrollTop;
    if (e - o < s) {
      const h = this.findColumnIndexAtPosition(t);
      return h < 0 ? null : { rowIndex: -1, columnIndex: h };
    }
    const r = this.findRowIndexAtPosition(e), a = this.findColumnIndexAtPosition(t);
    if (r < 0 || r >= this.rowHeights.length || a < 0 || a >= this.layoutInfo.columnWidths.length)
      return null;
    const l = this.getCellMerge(r, a);
    return l ? { rowIndex: l.rowIndex, columnIndex: l.columnIndex } : { rowIndex: r, columnIndex: a };
  }
  getRowHitAtViewportPosition(t, e, i) {
    const s = (() => {
      const a = this.getMouseRegion(t);
      return a === "left-fixed" ? this.findColumnIndexInLeftFixed(t) : a === "right-fixed" ? this.findColumnIndexInRightFixed(t) : this.findColumnIndexInScrollable(t + this.scrollLeft);
    })();
    if (s < 0 || s >= this.layoutInfo.columnWidths.length || e < this.layoutInfo.headerHeight)
      return null;
    if (this.summaryTopHeight > 0 && e < this.rowBands.summaryTop.y + this.summaryTopHeight) {
      const a = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryTop.rows,
        e - this.rowBands.summaryTop.y
      );
      return a ? { row: a, band: "summary-top", columnIndex: s } : null;
    }
    if (e < this.rowBands.pinnedTop.y + this.pinnedTopHeight) {
      const a = this.findRowInBandAtOffset(
        this.rowBands.pinnedTop.rows,
        e - this.rowBands.pinnedTop.y
      );
      return a ? { row: a, band: "pinned-top", columnIndex: s } : null;
    }
    if (this.summaryBottomHeight > 0 && e >= this.rowBands.summaryBottom.y && e < this.rowBands.summaryBottom.y + this.summaryBottomHeight) {
      const a = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryBottom.rows,
        e - this.rowBands.summaryBottom.y
      );
      return a ? { row: a, band: "summary-bottom", columnIndex: s } : null;
    }
    if (this.pinnedBottomHeight > 0 && e >= this.rowBands.pinnedBottom.y && e < this.rowBands.pinnedBottom.y + this.pinnedBottomHeight) {
      const a = this.findRowInBandAtOffset(
        this.rowBands.pinnedBottom.rows,
        e - this.rowBands.pinnedBottom.y
      );
      return a ? { row: a, band: "pinned-bottom", columnIndex: s } : null;
    }
    const o = i + (e - this.rowBands.body.y), n = this.findBodyRowIndexAtOffset(o), r = this.rowBands.body.rows[n];
    return r ? { row: r, band: "body", columnIndex: s } : null;
  }
  getCellAtViewportPosition(t, e, i = this.scrollTop) {
    if (e < this.layoutInfo.headerHeight) {
      const r = this.findColumnIndexAtPosition(t + this.scrollLeft);
      return r < 0 ? null : { rowIndex: -1, columnIndex: r };
    }
    const s = this.getRowHitAtViewportPosition(t, e, i);
    if (!s || s.band === "summary-top" || s.band === "summary-bottom")
      return null;
    const o = this.getRowIndexByRef(s.row);
    if (o < 0)
      return null;
    const n = this.getCellMerge(o, s.columnIndex);
    return n ? { rowIndex: n.rowIndex, columnIndex: n.columnIndex } : { rowIndex: o, columnIndex: s.columnIndex };
  }
  findRowIndexAtPosition(t) {
    let e = 0, i = this.rowOffsets.length - 1;
    for (; e <= i; ) {
      const s = Math.floor((e + i) / 2), o = this.rowOffsets[s], n = this.rowHeights[s];
      if (t >= o && t < o + n)
        return s;
      t < o ? i = s - 1 : e = s + 1;
    }
    return -1;
  }
  findColumnIndexAtPosition(t) {
    const e = t - this.scrollLeft, i = this.getLeftFixedWidth(), s = this.getRightFixedWidth();
    if (i > 0 && e < i) {
      let o = 0;
      for (let n = 0; n < this.leafColumns.length; n++) {
        const r = this.leafColumns[n];
        if ((r == null ? void 0 : r.fixed) === "left") {
          const a = this.layoutInfo.columnWidths[n];
          if (e >= o && e < o + a)
            return n;
          o += a;
        }
      }
      return -1;
    }
    if (s > 0) {
      const o = this.viewportWidth - s;
      if (e >= o && e < this.viewportWidth) {
        let n = o;
        for (let r = 0; r < this.leafColumns.length; r++) {
          const a = this.leafColumns[r];
          if ((a == null ? void 0 : a.fixed) === "right") {
            const l = this.layoutInfo.columnWidths[r];
            if (e >= n && e < n + l)
              return r;
            n += l;
          }
        }
        return -1;
      }
    }
    for (let o = 0; o < this.columnOffsets.length; o++) {
      const n = this.leafColumns[o];
      if ((n == null ? void 0 : n.fixed) === "left" || (n == null ? void 0 : n.fixed) === "right")
        continue;
      const r = this.columnOffsets[o], a = this.layoutInfo.columnWidths[o];
      if (t >= r && t < r + a)
        return o;
    }
    return -1;
  }
  getRightFixedWidth() {
    let t = 0;
    for (let e = 0; e < this.leafColumns.length; e++) {
      const i = this.leafColumns[e];
      (i == null ? void 0 : i.fixed) === "right" && (t += this.layoutInfo.columnWidths[e] ?? 0);
    }
    return t;
  }
  getLeftFixedWidth() {
    let t = 0;
    for (let e = 0; e < this.leafColumns.length; e++) {
      const i = this.leafColumns[e];
      (i == null ? void 0 : i.fixed) === "left" && (t += this.layoutInfo.columnWidths[e] ?? 0);
    }
    return t;
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
  getScrollOffsetForRow(t) {
    const e = this.getRowOffset(t), i = this.getRowHeightByIndex(t);
    return e < this.scrollTop ? e : e + i > this.scrollTop + this.viewportHeight ? e + i - this.viewportHeight : this.scrollTop;
  }
  getScrollOffsetForColumn(t) {
    const e = this.getColumnOffset(t), i = this.getColumnWidthByIndex(t);
    return e < this.scrollLeft ? e : e + i > this.scrollLeft + this.viewportWidth ? e + i - this.viewportWidth : this.scrollLeft;
  }
  getFixedColumnsInfo(t) {
    const e = [], i = [], s = [];
    for (const a of this.leafColumns.length > 0 ? this.leafColumns : t)
      a.fixed === "left" ? e.push(a) : a.fixed === "right" ? i.push(a) : s.push(a);
    const o = e.reduce((a, l) => a + this.getColumnWidth(l), 0), n = i.reduce((a, l) => a + this.getColumnWidth(l), 0), r = s.reduce((a, l) => a + this.getColumnWidth(l), 0);
    return {
      leftFixed: { columns: e, width: o },
      rightFixed: { columns: i, width: n },
      center: { columns: s, width: r }
    };
  }
  isColumnResizable(t) {
    return !0;
  }
  getResizeHandlePosition(t) {
    let e = 0;
    for (let i = 0; i <= t; i++)
      e += this.layoutInfo.columnWidths[i] ?? 0;
    return e;
  }
  isResizeHandleAtPosition(t, e) {
    if (e > this.layoutInfo.headerHeight)
      return -1;
    const s = t - this.scrollLeft, o = this.getLeftFixedWidth(), n = this.getRightFixedWidth();
    if (o > 0 && s < o) {
      let r = 0;
      for (let a = 0; a < this.leafColumns.length; a++) {
        const l = this.leafColumns[a];
        if ((l == null ? void 0 : l.fixed) === "left") {
          if (r += this.layoutInfo.columnWidths[a], Math.abs(s - r) <= 5)
            return a;
        } else
          break;
      }
      return -1;
    }
    if (n > 0) {
      const r = this.viewportWidth - n;
      if (s >= r) {
        let a = this.viewportWidth;
        if (Math.abs(s - r) <= 5)
          for (let l = 0; l < this.leafColumns.length; l++) {
            const h = this.leafColumns[l];
            if ((h == null ? void 0 : h.fixed) === "right")
              return l;
          }
        for (let l = this.leafColumns.length - 1; l >= 0; l--) {
          const h = this.leafColumns[l];
          if ((h == null ? void 0 : h.fixed) === "right") {
            if (a -= this.layoutInfo.columnWidths[l], Math.abs(s - a) <= 5)
              return l;
          } else
            break;
        }
        return -1;
      }
    }
    for (let r = 0; r < this.leafColumns.length; r++) {
      const a = this.leafColumns[r];
      if ((a == null ? void 0 : a.fixed) === "left" || (a == null ? void 0 : a.fixed) === "right")
        continue;
      const l = this.getResizeHandlePosition(r);
      if (Math.abs(t - l) <= 5)
        return r;
    }
    return -1;
  }
  getVisibleCenterColumnIndices() {
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), i = this.scrollLeft + t, s = this.scrollLeft + this.viewportWidth - e, o = [];
    for (let n = 0; n < this.leafColumns.length; n++) {
      const r = this.leafColumns[n];
      if ((r == null ? void 0 : r.fixed) === "left" || (r == null ? void 0 : r.fixed) === "right")
        continue;
      const a = this.columnOffsets[n] ?? 0;
      a + (this.layoutInfo.columnWidths[n] ?? 0) >= i && a <= s && o.push(n);
    }
    return o;
  }
  getVisibleHeaderCells() {
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), i = this.scrollLeft + t, s = this.scrollLeft + this.viewportWidth - e, o = [], n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
    for (const a of this.headerCells) {
      const l = a.x, h = a.x + a.width, c = a.column.fixed === "left", d = a.column.fixed === "right", u = a.column.key;
      if (c || d) {
        if (!n.has(u)) {
          o.push(a), n.add(u);
          let f = a.column.parentKey;
          for (; f; ) {
            r.add(f);
            const g = this.getColumnByKey(f);
            f = g == null ? void 0 : g.parentKey;
          }
        }
        continue;
      }
      if (h >= i && l <= s && !n.has(u)) {
        o.push(a), n.add(u);
        let f = a.column.parentKey;
        for (; f; ) {
          r.add(f);
          const g = this.getColumnByKey(f);
          f = g == null ? void 0 : g.parentKey;
        }
      }
    }
    for (const a of this.headerCells) {
      const l = a.column.key;
      r.has(a.column.key) && !n.has(l) && (o.push(a), n.add(l));
    }
    return o;
  }
  updateTheme(t) {
    this.theme = t, this.layoutInfo.headerHeight = t.row.headerHeight, this.layoutInfo.rowHeight = t.row.height, this.rowHeightsDirty = !0;
  }
  reset() {
    this.columnWidths.clear(), this.rowHeights = [], this.rowOffsets = [], this.columnOffsets = [], this.columns = [], this.scrollLeft = 0, this.scrollTop = 0, this.headerCells = [], this.leafColumns = [], this.headerDepth = 1, this.cellMergeMap.clear(), this.cellMergeByRow.clear(), this.mergedCellSet.clear(), this.cellToMergeMap.clear(), this.rowHeightOverrides = /* @__PURE__ */ new WeakMap(), this.hasRowHeightOverrides = !1, this.rowHeightFn = void 0, this.cachedRows = [], this.rowHeightsDirty = !0, this.layoutInfo = this.createEmptyLayoutInfo(), this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
  }
  // ==================== Hit Test Methods ====================
  /**
   * 获取鼠标所在的区域类型
   */
  getMouseRegion(t) {
    const e = this.getLeftFixedWidth(), i = this.getRightFixedWidth();
    return e > 0 && t < e ? "left-fixed" : i > 0 && t >= this.viewportWidth - i ? "right-fixed" : "scrollable";
  }
  /**
   * 统一命中测试入口
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param scrollbarBounds 可选的滚动条边界（由 Renderer 计算，确保与渲染一致）
   */
  hitTest(t, e, i) {
    const s = this.hitTestScrollbar(t, e, i);
    return s || (e < this.layoutInfo.headerHeight ? this.hitTestHeader(t, e) : this.hitTestCell(t, e));
  }
  /**
   * 检测滚动条区域
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param externalBounds 可选的外部滚动条边界（优先使用）
   */
  hitTestScrollbar(t, e, i) {
    if (i) {
      if (i.vertical) {
        const { x: h, y: c, width: d, height: u } = i.vertical;
        if (t >= h && t <= h + d && e >= c && e <= c + u)
          return {
            region: "scrollbar-vertical",
            scrollbar: {
              type: "vertical",
              bounds: { x: h, y: c, width: d, height: u }
            },
            viewport: { x: t, y: e }
          };
      }
      if (i.horizontal) {
        const { x: h, y: c, width: d, height: u } = i.horizontal;
        if (t >= h && t <= h + d && e >= c && e <= c + u)
          return {
            region: "scrollbar-horizontal",
            scrollbar: {
              type: "horizontal",
              bounds: { x: h, y: c, width: d, height: u }
            },
            viewport: { x: t, y: e }
          };
      }
      return null;
    }
    const s = this.layoutInfo, o = this.getMaxScrollTop(), n = this.getMaxScrollLeft(), r = 10, a = 30, l = s.headerHeight;
    if (o > 0) {
      const h = this.viewportHeight - l, c = Math.max(
        a,
        this.viewportHeight / s.totalHeight * h
      ), d = l + this.scrollTop / o * (h - c), u = this.viewportWidth - r, f = r - 2;
      if (t >= u && t <= u + f && e >= d && e <= d + c)
        return {
          region: "scrollbar-vertical",
          scrollbar: {
            type: "vertical",
            bounds: { x: u, y: d, width: f, height: c }
          },
          viewport: { x: t, y: e }
        };
    }
    if (n > 0) {
      const h = this.viewportWidth - (o > 0 ? r : 0), c = Math.max(
        a,
        this.viewportWidth / s.totalWidth * h
      ), d = this.scrollLeft / n * (h - c), u = this.viewportHeight - r, f = r - 2;
      if (t >= d && t <= d + c && e >= u && e <= u + f)
        return {
          region: "scrollbar-horizontal",
          scrollbar: {
            type: "horizontal",
            bounds: { x: d, y: u, width: c, height: f }
          },
          viewport: { x: t, y: e }
        };
    }
    return null;
  }
  /**
   * 检测列头区域
   */
  hitTestHeader(t, e) {
    const i = this.getMouseRegion(t), s = this.hitTestResizeHandle(t, i);
    if (s >= 0)
      return {
        region: "header",
        regionDetail: i,
        isResizeHandle: !0,
        resizeColumnIndex: s,
        viewport: { x: t, y: e }
      };
    const o = this.getHeaderCellAtPosition(t, e);
    return {
      region: "header",
      regionDetail: i,
      headerCell: o ?? void 0,
      viewport: { x: t, y: e }
    };
  }
  /**
   * 检测 resize handle（按区域检测，避免穿透）
   */
  hitTestResizeHandle(t, e) {
    return e === "left-fixed" ? this.hitTestLeftFixedResizeHandle(t, 5) : e === "right-fixed" ? this.hitTestRightFixedResizeHandle(t, 5) : this.hitTestScrollableResizeHandle(t, 5);
  }
  /**
   * 检测左侧固定列的 resize handle
   */
  hitTestLeftFixedResizeHandle(t, e) {
    let i = 0;
    for (let s = 0; s < this.leafColumns.length; s++) {
      const o = this.leafColumns[s];
      if ((o == null ? void 0 : o.fixed) === "left") {
        if (i += this.layoutInfo.columnWidths[s], Math.abs(t - i) <= e)
          return s;
      } else
        break;
    }
    return -1;
  }
  /**
   * 检测右侧固定列的 resize handle
   */
  hitTestRightFixedResizeHandle(t, e) {
    const i = this.getRightFixedWidth(), s = this.viewportWidth - i;
    if (Math.abs(t - s) <= e)
      for (let n = 0; n < this.leafColumns.length; n++) {
        const r = this.leafColumns[n];
        if ((r == null ? void 0 : r.fixed) === "right")
          return n;
      }
    let o = this.viewportWidth;
    for (let n = this.leafColumns.length - 1; n >= 0; n--) {
      const r = this.leafColumns[n];
      if ((r == null ? void 0 : r.fixed) === "right") {
        if (o -= this.layoutInfo.columnWidths[n], Math.abs(t - o) <= e)
          return n;
      } else
        break;
    }
    return -1;
  }
  /**
   * 检测滚动区域的 resize handle
   */
  hitTestScrollableResizeHandle(t, e) {
    const i = t + this.scrollLeft;
    for (let s = 0; s < this.leafColumns.length; s++) {
      const o = this.leafColumns[s];
      if ((o == null ? void 0 : o.fixed) === "left" || (o == null ? void 0 : o.fixed) === "right")
        continue;
      const n = this.columnOffsets[s], r = this.layoutInfo.columnWidths[s];
      if (n !== void 0 && Math.abs(i - (n + r)) <= e)
        return s;
    }
    return -1;
  }
  /**
   * 检测单元格区域
   */
  hitTestCell(t, e) {
    const i = this.getMouseRegion(t), s = this.hitTestRowResizeHandleAtViewportPosition(e);
    let o;
    if (i === "left-fixed")
      o = this.findColumnIndexInLeftFixed(t);
    else if (i === "right-fixed")
      o = this.findColumnIndexInRightFixed(t);
    else {
      const h = t + this.scrollLeft;
      o = this.findColumnIndexInScrollable(h);
    }
    if (o < 0 || o >= this.layoutInfo.columnWidths.length)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const n = this.getRowHitAtViewportPosition(t, e, this.scrollTop);
    if ((n == null ? void 0 : n.band) === "summary-top" || (n == null ? void 0 : n.band) === "summary-bottom")
      return {
        region: "cell",
        regionDetail: i,
        rowHit: n,
        viewport: { x: t, y: e }
      };
    const r = this.getCellAtViewportPosition(t, e, this.scrollTop);
    if (!r && s < 0)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const a = s >= 0 ? s : (r == null ? void 0 : r.rowIndex) ?? -1;
    if (a < 0 || a >= this.rowHeights.length)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const l = this.getCellMerge(a, o);
    return l ? {
      region: "cell",
      regionDetail: i,
      cell: { rowIndex: l.rowIndex, columnIndex: l.columnIndex },
      rowHit: n ?? void 0,
      isRowResizeHandle: s >= 0,
      resizeRowIndex: s >= 0 ? s : void 0,
      viewport: { x: t, y: e }
    } : {
      region: "cell",
      regionDetail: i,
      cell: { rowIndex: a, columnIndex: o },
      rowHit: n ?? void 0,
      isRowResizeHandle: s >= 0,
      resizeRowIndex: s >= 0 ? s : void 0,
      viewport: { x: t, y: e }
    };
  }
  hitTestRowResizeHandleAtViewportPosition(t) {
    const i = this.findResizeHandleInPinnedRows(
      this.rowBands.pinnedTop.rows,
      this.rowBands.pinnedTop.y,
      t,
      4
    );
    if (i >= 0)
      return i;
    const s = this.findBodyResizeHandleAtViewportY(t, 4);
    if (s >= 0)
      return s;
    const o = this.findResizeHandleInPinnedRows(
      this.rowBands.pinnedBottom.rows,
      this.rowBands.pinnedBottom.y,
      t,
      4
    );
    return o >= 0 ? o : -1;
  }
  findBodyResizeHandleAtViewportY(t, e) {
    if (this.rowBands.body.rows.length === 0)
      return -1;
    const i = this.rowBands.body.y, s = i + this.bodyViewportHeight;
    if (t < i - e || t > s + e)
      return -1;
    const o = this.scrollTop + (t - i), n = this.findBodyRowIndexAtOffset(Math.max(0, o - e)), r = [n, n + 1];
    for (const a of r) {
      const l = this.rowBands.body.rows[a];
      if (!l) continue;
      const h = i + (this.bodyRowOffsets[a] ?? 0) + this.getResolvedRowHeight(l) - this.scrollTop;
      if (Math.abs(t - h) <= e)
        return this.getRowIndexByRef(l);
    }
    return -1;
  }
  findResizeHandleInPinnedRows(t, e, i, s) {
    for (const o of t) {
      const n = e + (this.getRowBandOffsetByRef(o) ?? 0) + this.getResolvedRowHeight(o);
      if (Math.abs(i - n) <= s)
        return this.getRowIndexByRef(o);
    }
    return -1;
  }
  /**
   * 在左侧固定列中查找列索引
   */
  findColumnIndexInLeftFixed(t) {
    let e = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const s = this.leafColumns[i];
      if ((s == null ? void 0 : s.fixed) === "left") {
        const o = this.layoutInfo.columnWidths[i];
        if (t >= e && t < e + o)
          return i;
        e += o;
      }
    }
    return -1;
  }
  /**
   * 在右侧固定列中查找列索引
   */
  findColumnIndexInRightFixed(t) {
    const e = this.getRightFixedWidth();
    let s = this.viewportWidth - e;
    for (let o = 0; o < this.leafColumns.length; o++) {
      const n = this.leafColumns[o];
      if ((n == null ? void 0 : n.fixed) === "right") {
        const r = this.layoutInfo.columnWidths[o];
        if (t >= s && t < s + r)
          return o;
        s += r;
      }
    }
    return -1;
  }
  /**
   * 在滚动区域中查找列索引
   */
  findColumnIndexInScrollable(t) {
    for (let e = 0; e < this.columnOffsets.length; e++) {
      const i = this.leafColumns[e];
      if ((i == null ? void 0 : i.fixed) === "left" || (i == null ? void 0 : i.fixed) === "right")
        continue;
      const s = this.columnOffsets[e], o = this.layoutInfo.columnWidths[e];
      if (s !== void 0 && t >= s && t < s + o)
        return e;
    }
    return -1;
  }
};
// 占位列相关常量
b(it, "HIDDEN_PLACEHOLDER_WIDTH", 5), b(it, "HIDDEN_PLACEHOLDER_PREFIX", "__hidden_placeholder__");
let Ot = it;
class Zt {
  constructor(t = {}) {
    b(this, "maxConcurrent");
    b(this, "maxCacheSize");
    /** 已加载缓存（包含尺寸信息） */
    b(this, "cache", /* @__PURE__ */ new Map());
    /** 加载失败 */
    b(this, "failed", /* @__PURE__ */ new Set());
    /** 正在加载中 */
    b(this, "loading", /* @__PURE__ */ new Map());
    /** 等待加载队列 */
    b(this, "pendingQueue", /* @__PURE__ */ new Map());
    /** 当前帧收集的请求 */
    b(this, "frameRequests", /* @__PURE__ */ new Map());
    /** 是否已销毁 */
    b(this, "destroyed", !1);
    this.maxConcurrent = t.maxConcurrent ?? 6, this.maxCacheSize = t.maxCacheSize ?? 200;
  }
  /**
   * 请求加载图片
   * @param src 图片 URL
   * @param targetSize 需要的渲染尺寸（像素），默认 64
   * @param callback 加载完成回调
   */
  request(t, e = 64, i) {
    if (this.destroyed) return;
    const s = this.cache.get(t);
    if (s) {
      if (s.size >= e) {
        i == null || i(!0, s.image);
        return;
      }
      if (s.originalImage) {
        const a = this.scaleImage(s.originalImage, e);
        s.image = a, s.size = e, i == null || i(!0, a);
        return;
      }
    }
    if (this.failed.has(t)) {
      i == null || i(!1, null);
      return;
    }
    const o = this.loading.get(t);
    if (o) {
      o.maxSize = Math.max(o.maxSize, e), i && o.callbacks.push(i);
      return;
    }
    const n = this.pendingQueue.get(t);
    if (n) {
      n.maxSize = Math.max(n.maxSize, e), i && n.callbacks.push(i);
      return;
    }
    const r = {
      src: t,
      callbacks: i ? [i] : [],
      maxSize: e
    };
    if (this.loading.size < this.maxConcurrent) {
      this.startLoad(t, r);
      return;
    }
    this.pendingQueue.set(t, r);
  }
  /**
   * 提交当前帧的请求
   * 取消不可见的请求后调用，启动队列处理
   */
  commitFrame() {
    for (const [t, e] of this.frameRequests) {
      const i = this.pendingQueue.get(t);
      i ? (i.maxSize = Math.max(i.maxSize, e.maxSize), i.callbacks.push(...e.callbacks)) : this.pendingQueue.set(t, e);
    }
    this.frameRequests.clear(), this.processQueue();
  }
  /**
   * 取消指定图片的加载请求
   */
  cancel(t) {
    this.pendingQueue.delete(t), this.frameRequests.delete(t);
  }
  /**
   * 批量取消不在可见区域的请求
   */
  cancelInvisible(t) {
    for (const e of this.pendingQueue.keys())
      t.has(e) || this.pendingQueue.delete(e);
    for (const e of this.frameRequests.keys())
      t.has(e) || this.frameRequests.delete(e);
  }
  /**
   * 处理加载队列
   */
  processQueue() {
    if (!this.destroyed)
      for (; this.loading.size < this.maxConcurrent && this.pendingQueue.size > 0; ) {
        const [t, e] = this.pendingQueue.entries().next().value;
        this.pendingQueue.delete(t), this.startLoad(t, e);
      }
  }
  /**
   * 开始加载图片
   */
  startLoad(t, e) {
    if (this.destroyed) return;
    this.loading.set(t, e);
    const i = new Image();
    i.crossOrigin = "anonymous", i.onload = () => {
      if (this.destroyed) return;
      const s = this.scaleImage(i, e.maxSize);
      this.addToCache(t, {
        image: s,
        size: e.maxSize,
        originalImage: i
      }), this.loading.delete(t);
      for (const o of e.callbacks)
        o(!0, s);
      this.processQueue();
    }, i.onerror = () => {
      if (!this.destroyed) {
        this.loading.delete(t), this.failed.add(t);
        for (const s of e.callbacks)
          s(!1, null);
        this.processQueue();
      }
    }, i.src = t;
  }
  /**
   * 缩放图片
   */
  scaleImage(t, e) {
    if (t.width <= e && t.height <= e)
      return t;
    const i = Math.min(e / t.width, e / t.height), s = Math.round(t.width * i), o = Math.round(t.height * i), n = document.createElement("canvas");
    n.width = s, n.height = o;
    const r = n.getContext("2d");
    return r ? (r.imageSmoothingEnabled = !0, r.imageSmoothingQuality = "high", r.drawImage(t, 0, 0, s, o), n) : t;
  }
  /**
   * 获取缓存的图片（如果尺寸不够会返回 null）
   */
  get(t, e) {
    const i = this.cache.get(t);
    return !i || e && i.size < e ? null : i.image;
  }
  /**
   * 检查是否已缓存（且尺寸满足需求）
   */
  has(t, e) {
    const i = this.cache.get(t);
    return !(!i || e && i.size < e);
  }
  /**
   * 检查是否加载失败
   */
  isFailed(t) {
    return this.failed.has(t);
  }
  /**
   * 检查是否正在加载（包括等待中）
   */
  isLoading(t) {
    return this.loading.has(t) || this.pendingQueue.has(t) || this.frameRequests.has(t);
  }
  /**
   * 重试失败的图片
   */
  retry(t) {
    this.failed.delete(t);
  }
  /**
   * 添加到缓存（LRU 淘汰）
   */
  addToCache(t, e) {
    if (this.cache.size >= this.maxCacheSize) {
      const i = this.cache.keys().next().value;
      i && this.cache.delete(i);
    }
    this.cache.set(t, e);
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
    this.pendingQueue.clear(), this.frameRequests.clear(), this.loading.clear(), this.cache.clear(), this.failed.clear();
  }
  /**
   * 销毁
   */
  destroy() {
    this.destroyed = !0, this.clear();
  }
}
const nt = {
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
}, ti = {
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
}, Jt = {
  "zh-CN": nt,
  "en-US": ti
};
function ei(x) {
  return typeof x == "object" && x !== null && ("preset" in x || "messages" in x);
}
function Pt(x) {
  if (Array.isArray(x))
    return [...x];
  if (x && typeof x == "object") {
    const t = {};
    for (const [e, i] of Object.entries(x))
      t[e] = Pt(i);
    return t;
  }
  return x;
}
function mt(x, t) {
  if (!t)
    return Pt(x);
  const e = Pt(x);
  for (const [i, s] of Object.entries(t))
    s && typeof s == "object" && !Array.isArray(s) && e[i] && typeof e[i] == "object" && !Array.isArray(e[i]) ? e[i] = mt(e[i], s) : s !== void 0 && (e[i] = s);
  return e;
}
function te(x) {
  if (!x)
    return mt(nt);
  if (typeof x == "string")
    return mt(Jt[x] ?? nt);
  if (ei(x)) {
    const t = x.preset ?? "zh-CN";
    return mt(Jt[t] ?? nt, x.messages);
  }
  return mt(nt, x);
}
class ii {
  constructor(t, e, i, s = nt) {
    b(this, "ctx");
    b(this, "theme");
    b(this, "locale");
    b(this, "measureTextWidth");
    this.ctx = t, this.theme = e, this.measureTextWidth = i, this.locale = s;
  }
  setContext(t) {
    this.ctx = t;
  }
  setTheme(t) {
    this.theme = t;
  }
  setLocale(t) {
    this.locale = t;
  }
  renderButtonsDropdown(t) {
    let o = 100;
    for (const r of t.buttons) {
      const a = r.text ?? this.locale.cell.buttonText, l = this.measureTextWidth(a);
      o = Math.max(o, l + 8 * 2 + 16);
    }
    const n = t.buttons.length * 32;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, o, n, 4), this.ctx.fill(), this.ctx.stroke();
    for (let r = 0; r < t.buttons.length; r++) {
      const a = t.buttons[r], l = t.y + r * 32;
      r === t.hoveredIndex && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(t.x, l, o, 32));
      let c;
      switch (a.variant) {
        case "primary":
          c = this.theme.colors.button.primaryBg;
          break;
        case "danger":
          c = this.theme.colors.button.dangerBg;
          break;
        case "warning":
          c = this.theme.colors.button.warningBg;
          break;
        case "link":
          c = this.theme.colors.button.linkText;
          break;
        default:
          c = this.theme.colors.cellText;
      }
      this.ctx.fillStyle = c, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText(
        a.text ?? this.locale.cell.buttonText,
        t.x + 8,
        l + 32 / 2
      );
    }
    this.ctx.restore();
  }
  renderDropdown(t) {
    if (t.type === "tags" && t.tagsConfig) {
      this.renderTagsDropdown(t);
      return;
    }
    const { config: e, x: i, y: s, width: o, scrollTop: n, hoveredIndex: r } = t, a = 32, l = 8, c = Math.min(e.options.length, l) * a;
    this.ctx.save(), this.drawDropdownPanel(i, s, o, c), this.ctx.beginPath(), this.ctx.rect(i, s, o, c), this.ctx.clip();
    const d = e.multiple && Array.isArray(e.value) ? e.value : e.value !== void 0 ? [e.value] : [];
    for (let u = 0; u < e.options.length; u++) {
      const f = e.options[u], g = s + u * a - n;
      if (g + a < s || g > s + c) continue;
      u === r && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(i, g, o, a));
      const m = d.includes(f.value);
      m && !e.multiple && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(i, g, o, a)), e.multiple ? this.renderMultipleOption(f.label, f.disabled, m, i, g, o) : this.renderSingleOption(f.label, f.disabled, m, i, g, o);
    }
    this.renderDropdownScrollbar(
      e.options.length,
      l,
      i,
      s,
      o,
      c,
      n
    ), this.ctx.restore();
  }
  renderTagsDropdown(t) {
    const { x: e, y: i, width: s, scrollTop: o, hoveredIndex: n, tagsConfig: r } = t;
    if (!r || !r.options) return;
    const { options: a, selectedValues: l = [] } = r, h = 32, c = 8, u = Math.min(a.length, c) * h;
    this.ctx.save(), this.drawDropdownPanel(e, i, s, u), this.ctx.beginPath(), this.ctx.rect(e, i, s, u), this.ctx.clip();
    for (let f = 0; f < a.length; f++) {
      const g = a[f], m = i + f * h - o;
      if (m + h < i || m > i + u) continue;
      const p = l.includes(g.value ?? g.text);
      f === n && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, s, h)), p && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(e, m, s, h));
      const y = 14, w = e + 10, C = m + (h - y) / 2;
      this.ctx.fillStyle = p ? this.theme.colors.checkbox.checkedBg : this.theme.colors.button.background, this.ctx.strokeStyle = p ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(w, C, y, y, 2), this.ctx.fill(), this.ctx.stroke(), p && (this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(w + 3, C + 7), this.ctx.lineTo(w + 6, C + 10), this.ctx.lineTo(w + 11, C + 4), this.ctx.stroke()), this.ctx.fillStyle = g.disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
      const R = w + y + 8, v = m + h / 2, I = s - (y + 28), M = ft(
        g.text,
        Math.floor(I / (this.theme.font.size * 0.6))
      );
      this.ctx.fillText(M, R, v);
    }
    this.renderDropdownScrollbar(
      a.length,
      c,
      e,
      i,
      s,
      u,
      o
    ), this.ctx.restore();
  }
  renderMultipleOption(t, e, i, s, o, n) {
    const l = s + 10, h = o + 18 / 2;
    this.ctx.strokeStyle = i ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(l, h, 14, 14, 2), this.ctx.stroke(), i && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(l, h, 14, 14, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.lineCap = "round", this.ctx.lineJoin = "round", this.ctx.beginPath(), this.ctx.moveTo(l + 3, h + 14 / 2), this.ctx.lineTo(l + 14 / 2, h + 14 - 4), this.ctx.lineTo(l + 14 - 3, h + 4), this.ctx.stroke()), this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const c = l + 14 + 8, d = o + 32 / 2, u = n - 42, f = ft(
      t,
      Math.floor(u / (this.theme.font.size * 0.6))
    );
    this.ctx.fillText(f, c, d);
  }
  renderSingleOption(t, e, i, s, o, n) {
    i ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`) : (this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`), this.ctx.textBaseline = "middle";
    const a = s + 12, l = o + 32 / 2, h = n - 24, c = ft(
      t,
      Math.floor(h / (this.theme.font.size * 0.6))
    );
    if (this.ctx.fillText(c, a, l), i) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath();
      const d = s + n - 20, u = l;
      this.ctx.moveTo(d - 6, u), this.ctx.lineTo(d - 2, u + 4), this.ctx.lineTo(d + 6, u - 4), this.ctx.strokeStyle = this.theme.colors.checkbox.checkedBg, this.ctx.lineWidth = 2, this.ctx.stroke();
    }
  }
  renderDropdownScrollbar(t, e, i, s, o, n, r) {
    if (t <= e) return;
    const a = 6, l = i + o - a - 2, h = t * 32, c = Math.max(20, n / h * n), d = s + r / h * n, u = this.ctx.globalAlpha;
    this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(l, d, a, c, 3), this.ctx.fill(), this.ctx.globalAlpha = u;
  }
  drawDropdownPanel(t, e, i, s) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(t, e, i, s, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0;
  }
}
class si {
  constructor(t, e, i = nt) {
    b(this, "ctx");
    b(this, "theme");
    b(this, "locale");
    this.ctx = t, this.theme = e, this.locale = i;
  }
  setContext(t) {
    this.ctx = t;
  }
  setTheme(t) {
    this.theme = t;
  }
  setLocale(t) {
    this.locale = t;
  }
  render(t) {
    switch (t.mode) {
      case "search":
        this.renderSearchFilterDropdown(t);
        break;
      case "select":
        this.renderSelectFilterDropdown(t);
        break;
      case "range":
        this.renderRangeFilterDropdown(t);
        break;
      case "boolean":
        this.renderBooleanFilterDropdown(t);
        break;
      case "dateRange":
        this.renderDateRangeFilterDropdown(t), t.activeDateField && t.currentYear !== void 0 && t.currentMonth !== void 0 && this.renderDateRangeCalendarPopover(t);
        break;
    }
  }
  renderSearchFilterDropdown(t) {
    const { x: e, y: i, width: s, searchValue: o } = t, n = 8, r = 4, a = 36, l = 36, h = n + a + r + l;
    this.drawPanelBackground(e, i, s, h);
    const c = i + n;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + n, c, s - n * 2, a, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const d = c + a / 2, u = e + n + 12;
    o ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(o, u, d)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.searchPlaceholder, u, d)), this.renderFilterButtons(e, i + n + a + r, s, l), this.drawPanelBorder(e, i, s, h);
  }
  renderSelectFilterDropdown(t) {
    const { x: e, y: i, width: s, options: o, scrollTop: n, hoveredIndex: r, isLoading: a } = t;
    if (!o && !a) return;
    const l = 8, h = 4, c = 32, d = 32, u = 8, f = 36, g = (o == null ? void 0 : o.length) ?? 0, m = Math.min(g, u), p = m * d, y = l + c + h + p + h + f;
    this.drawPanelBackground(e, i, s, y);
    const w = i + l;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + l, w, s - l * 2, c, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", t.searchText ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(t.searchText, e + l + 12, w + c / 2)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(
      this.locale.filter.selectSearchPlaceholder,
      e + l + 12,
      w + c / 2
    ));
    const C = i + l + c + h;
    if (a)
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.loading, e + l, C + d / 2);
    else if (o && o.length > 0) {
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(e, C, s, p), this.ctx.clip();
      const R = 14, v = 8, I = Math.floor(n / d), M = -(n % d);
      for (let S = 0; S <= m + 1; S++) {
        const T = I + S;
        if (T < 0 || T >= o.length) continue;
        const H = o[T];
        if (!H) continue;
        const D = C + S * d + M;
        T === r && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, D, s, d));
        const k = e + l, P = D + (d - R) / 2;
        this.ctx.strokeStyle = H.checked ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(k, P, R, R, 2), this.ctx.stroke(), H.checked && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(k, P, R, R, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(k + 3, P + 7), this.ctx.lineTo(k + 6, P + 10), this.ctx.lineTo(k + 11, P + 4), this.ctx.stroke()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const B = k + R + v, L = s - l * 2 - R - v, A = String(H.value);
        if (/^#[0-9A-Fa-f]{6}$/.test(A)) {
          const F = D + (d - 16) / 2, V = B;
          this.ctx.fillStyle = A, this.ctx.beginPath(), this.ctx.roundRect(V, F, 16, 16, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
          const z = V + 16 + 6, X = L - 16 - 6, G = ft(
            A.toUpperCase(),
            Math.floor(X / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(G, z, D + d / 2);
        } else {
          const _ = ft(
            H.label,
            Math.floor(L / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(_, B, D + d / 2);
        }
      }
      if (this.ctx.restore(), o.length > u) {
        const T = o.length * d, H = Math.max(20, p / T * p), D = p - H, k = n / (T - p) * D, P = this.ctx.globalAlpha;
        this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(
          e + s - 6 - 2,
          C + k + 2,
          6,
          H,
          3
        ), this.ctx.fill(), this.ctx.globalAlpha = P;
      }
    } else
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.noData, e + l, C + d / 2);
    this.renderFilterButtons(
      e,
      i + l + c + h + p + h,
      s,
      f
    ), this.drawPanelBorder(e, i, s, y);
  }
  renderRangeFilterDropdown(t) {
    const { x: e, y: i, width: s, minValue: o, maxValue: n } = t, r = 8, a = 4, l = 32, h = 8, c = 36, d = r + l + a + c;
    this.drawPanelBackground(e, i, s, d), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const u = i + r, f = (s - r * 3) / 2;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + r, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = o ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(
      o ? String(o) : this.locale.filter.minPlaceholder,
      e + r + 8,
      u + l / 2
    );
    const g = e + r + f + h;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.beginPath(), this.ctx.roundRect(g, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = n ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(
      n ? String(n) : this.locale.filter.maxPlaceholder,
      g + 8,
      u + l / 2
    ), this.renderFilterButtons(e, i + r + l + a, s, c), this.drawPanelBorder(e, i, s, d);
  }
  renderBooleanFilterDropdown(t) {
    const { x: e, y: i, width: s, boolValue: o } = t, n = 8, r = 4, a = 32, l = 36, h = n + a * 3 + r + l;
    this.drawPanelBackground(e, i, s, h);
    const c = [
      { value: "all", label: this.locale.filter.all },
      { value: "true", label: this.locale.filter.selected },
      { value: "false", label: this.locale.filter.unselected }
    ], d = 14, u = 8;
    for (let f = 0; f < c.length; f++) {
      const g = c[f], m = i + n + f * a, p = o === g.value;
      p && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, s, a));
      const y = e + n, w = m + (a - d) / 2;
      this.ctx.strokeStyle = p ? this.theme.colors.button.primaryBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.arc(y + d / 2, w + d / 2, d / 2, 0, Math.PI * 2), this.ctx.stroke(), p && (this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.beginPath(), this.ctx.arc(y + d / 2, w + d / 2, d / 4, 0, Math.PI * 2), this.ctx.fill()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText(g.label, y + d + u, m + a / 2);
    }
    this.renderFilterButtons(e, i + n + a * 3 + r, s, l), this.drawPanelBorder(e, i, s, h);
  }
  renderDateRangeFilterDropdown(t) {
    const { x: e, y: i, width: s, startDate: o, endDate: n, activeDateField: r } = t, a = 8, l = 4, h = 32, c = 8, d = 36, u = a + h + l + d;
    this.drawPanelBackground(e, i, s, u), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const f = i + a, g = (s - a * 3) / 2, m = e + a, p = r === "startDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = p ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = p ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(m, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const y = o ? this.formatDate(o, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = y ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(
      y || this.locale.filter.startDatePlaceholder,
      m + 8,
      f + h / 2
    );
    const w = e + a + g + c, C = r === "endDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = C ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = C ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(w, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const R = n ? this.formatDate(n, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = R ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(
      R || this.locale.filter.endDatePlaceholder,
      w + 8,
      f + h / 2
    ), this.renderFilterButtons(e, i + a + h + l, s, d), this.drawPanelBorder(e, i, s, u);
  }
  renderDateRangeCalendarPopover(t) {
    const {
      x: e,
      y: i,
      width: s,
      startDate: o,
      endDate: n,
      activeDateField: r,
      currentYear: a,
      currentMonth: l,
      hoveredDate: h
    } = t;
    if (!r || a === void 0 || l === void 0) return;
    const c = 8, d = 32, u = 8, f = 40, g = 28, m = 28, p = 8, w = f + g + 6 * m + p * 2, C = 240, R = (s - c * 3) / 2, v = e + c, I = e + c + R + u, M = i + c;
    let H = (r === "startDate" ? v : I) + R / 2 - C / 2;
    H < e && (H = e), H + C > e + s && (H = e + s - C);
    const D = M + d + u, k = r === "startDate" ? o : n;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(H, D, C, w, 6), this.ctx.fill(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke();
    const P = this.locale.calendar.months[l] ?? String(l + 1), B = this.locale.calendar.yearMonthFormat.replace("{year}", String(a)).replace("{month}", P);
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(B, H + C / 2, D + f / 2);
    const L = 6, A = H + 20, W = H + C - 20, _ = D + f / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(A + L, _ - L), this.ctx.lineTo(A - L, _), this.ctx.lineTo(A + L, _ + L), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(W - L, _ - L), this.ctx.lineTo(W + L, _), this.ctx.lineTo(W - L, _ + L), this.ctx.closePath(), this.ctx.fill();
    const F = this.locale.calendar.weekdays, V = (C - p * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let K = 0; K < 7; K++) {
      const tt = H + p + K * V + V / 2, st = D + f + g / 2;
      this.ctx.fillText(F[K], tt, st);
    }
    const X = new Date(a, l, 1).getDay(), G = new Date(a, l + 1, 0).getDate(), U = /* @__PURE__ */ new Date();
    U.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let K = 1; K <= G; K++) {
      const tt = X + K - 1, st = Math.floor(tt / 7), Y = tt % 7, j = H + p + Y * V, dt = D + f + g + st * m, ht = j + V / 2, yt = dt + m / 2, St = new Date(a, l, K), ge = k && St.getTime() === k.getTime(), me = h && St.getTime() === h.getTime(), pe = St.getTime() === U.getTime();
      if (ge)
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.beginPath(), this.ctx.arc(ht, yt, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = "#ffffff";
      else if (me)
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.beginPath(), this.ctx.arc(ht, yt, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
      else if (pe) {
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.fillText(String(K), ht, yt), this.ctx.fillStyle = this.theme.colors.dropdown.text;
        continue;
      } else
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.textAlign = "center", this.ctx.fillText(String(K), ht, yt);
    }
    this.ctx.restore();
  }
  renderFilterButtons(t, e, i, s) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(t, e, i, s), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.lineTo(t + i, e), this.ctx.stroke(), this.ctx.font = `14px ${this.theme.font.family}`;
    const r = this.locale.filter.reset, a = this.locale.filter.confirm, l = this.ctx.measureText(a).width, h = t + 8, c = t + i - 8 - l, d = e + s / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(r, h, d), this.ctx.fillStyle = this.theme.colors.linkColor, this.ctx.fillText(a, c, d);
  }
  drawPanelBackground(t, e, i, s) {
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(t, e, i, s, 6), this.ctx.fill(), this.ctx.restore();
  }
  drawPanelBorder(t, e, i, s) {
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(t, e, i, s, 6), this.ctx.stroke();
  }
  formatDate(t, e) {
    const i = t.getFullYear(), s = String(t.getMonth() + 1).padStart(2, "0"), o = String(t.getDate()).padStart(2, "0");
    return e.replace("YYYY", String(i)).replace("MM", s).replace("DD", o);
  }
}
function oi(x) {
  x.shadowColor = "transparent", x.shadowBlur = 0, x.shadowOffsetX = 0, x.shadowOffsetY = 0;
}
function ni(x, t) {
  x.shadowColor = t.colors.shadow.color, x.shadowBlur = t.colors.shadow.blur, x.shadowOffsetX = t.colors.shadow.offsetX, x.shadowOffsetY = t.colors.shadow.offsetY;
}
function vt(x, t, e) {
  const i = e.radius ?? 6;
  e.shadow && ni(x, t), x.fillStyle = e.fillStyle, x.beginPath(), x.roundRect(e.x, e.y, e.width, e.height, i), x.fill(), e.shadow && oi(x), e.clip && (x.beginPath(), x.roundRect(e.x, e.y, e.width, e.height, i), x.clip()), e.strokeStyle && (x.strokeStyle = e.strokeStyle, x.lineWidth = 1, x.beginPath(), x.roundRect(e.x, e.y, e.width, e.height, i), x.stroke());
}
function ee(x, t, e, i, s, o, n, r) {
  const a = x.globalAlpha;
  x.globalAlpha = t.colors.scrollbar.opacity, x.fillStyle = t.colors.scrollbar.track, x.fillRect(e, i, s, o), x.fillStyle = t.colors.scrollbar.thumb, x.fillRect(e, n, s, r), x.globalAlpha = a;
}
class ri {
  constructor(t, e, i, s = nt) {
    b(this, "ctx");
    b(this, "theme");
    b(this, "loader");
    b(this, "locale");
    this.ctx = t, this.theme = e, this.loader = i, this.locale = s;
  }
  setContext(t) {
    this.ctx = t;
  }
  setTheme(t) {
    this.theme = t;
  }
  setLocale(t) {
    this.locale = t;
  }
  renderImageTooltip(t) {
    const h = t.maxRows * 72 + 16 - 8, c = Math.ceil(t.images.length / 4), d = c * 72 - 8;
    this.ctx.save(), vt(this.ctx, this.theme, {
      x: t.x,
      y: t.y,
      width: 304,
      height: h,
      fillStyle: this.theme.colors.tooltip.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0,
      clip: !0
    });
    const u = Math.floor(t.scrollTop / 72), f = Math.min(c, u + t.maxRows + 1);
    for (let g = u; g < f; g++)
      for (let m = 0; m < 4; m++) {
        const p = g * 4 + m;
        if (p >= t.images.length) break;
        const y = t.images[p];
        if (!y) continue;
        const w = t.x + 8 + m * 72, C = t.y + 8 + g * 72 - t.scrollTop;
        C + 64 < t.y || C > t.y + h || this.renderImageTile(
          y,
          w,
          C,
          64,
          p === t.hoveredIndex,
          !1,
          !1
        );
      }
    if (d > h - 8 * 2) {
      const g = h - 16, m = Math.max(
        30,
        h / d * g
      ), p = t.y + 8 + t.scrollTop / (d - g + 8 * 2) * (g - m);
      ee(
        this.ctx,
        this.theme,
        t.x + 304 - 8 - 4,
        t.y + 8,
        4,
        g,
        p,
        m
      );
    }
    this.ctx.restore();
  }
  renderImageEditor(t) {
    const e = t.images ?? [], i = t.pendingImages ?? [], s = 64, o = 8, n = 8, r = 4, a = 60, l = s + n, h = 4, d = r * s + (r - 1) * n + o * 2 + 4 + h, u = t.maxRows * l + o * 2 - n, f = a + u;
    this.ctx.save(), vt(this.ctx, this.theme, {
      x: t.x,
      y: t.y,
      width: d,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.renderUploadArea(t, d, a, o);
    const g = t.y + a, m = Math.ceil((e.length + i.length) / r), p = m * l - n, y = u - o * 2;
    this.ctx.beginPath(), this.ctx.rect(t.x, g, d, u), this.ctx.clip();
    const w = Math.floor(t.scrollTop / l), C = Math.min(m, w + t.maxRows + 1), R = [...e, ...i.map((v) => v.preview)];
    for (let v = w; v < C; v++)
      for (let I = 0; I < r; I++) {
        const M = v * r + I;
        if (M >= R.length) break;
        const S = R[M];
        if (!S) continue;
        const T = t.x + o + I * (s + n), H = g + o + v * l - t.scrollTop;
        if (H + s < g || H > g + u) continue;
        const D = M === t.hoveredIndex, k = M >= e.length;
        this.renderImageTile(S, T, H, s, D, k, !0);
      }
    if (p > y) {
      const v = y, I = Math.max(
        30,
        y / p * v
      ), M = g + o + t.scrollTop / (p - y + o * 2) * (v - I);
      ee(
        this.ctx,
        this.theme,
        t.x + d - o - h,
        g + o,
        h,
        v,
        M,
        I
      );
    }
    this.ctx.restore();
  }
  renderUploadArea(t, e, i, s) {
    const o = t.y, n = t.isDragging;
    this.ctx.fillStyle = n ? this.theme.colors.dropdown.selectedBg : this.theme.colors.image.placeholderBg, this.ctx.fillRect(
      t.x + s,
      o + s,
      e - s * 2,
      i - s * 2
    ), this.ctx.strokeStyle = n ? this.theme.colors.checkbox.checkedBg : this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.setLineDash([4, 4]), this.ctx.strokeRect(
      t.x + s,
      o + s,
      e - s * 2,
      i - s * 2
    ), this.ctx.setLineDash([]), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const r = n ? this.locale.image.uploadDragging : this.locale.image.uploadIdle;
    this.ctx.fillText(r, t.x + e / 2, o + i / 2);
  }
  renderImageTile(t, e, i, s, o, n, r) {
    const a = this.loader.get(t, s);
    if (a ? (this.ctx.save(), o && (this.ctx.strokeStyle = this.theme.colors.image.hoverBorder, this.ctx.lineWidth = 2, this.ctx.strokeRect(e - 1, i - 1, s + 2, s + 2)), this.ctx.drawImage(a, e, i, s, s), this.ctx.restore(), this.loader.collectVisible(t)) : (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.fillRect(e, i, s, s), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, i, s, s), this.loader.isLoading(t) || this.loader.load(t, s)), n && (this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)", this.ctx.fillRect(e, i + s - 20, s, 20), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.fillText(this.locale.image.uploading, e + s / 2, i + s - 10)), o && !n && r) {
      const h = e + s - 8 - 2, c = i + 16 / 2 + 2;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)", this.ctx.beginPath(), this.ctx.arc(h, c, 16 / 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.strokeStyle = "#ffffff", this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.moveTo(h - 3, c - 3), this.ctx.lineTo(h + 3, c + 3), this.ctx.moveTo(h + 3, c - 3), this.ctx.lineTo(h - 3, c + 3), this.ctx.stroke();
    }
  }
}
class ai {
  constructor(t, e, i, s, o, n = nt) {
    b(this, "ctx");
    b(this, "canvas");
    b(this, "theme");
    b(this, "layoutManager");
    b(this, "locale");
    b(this, "dpr");
    b(this, "watermarkConfig", null);
    this.canvas = t, this.ctx = e, this.theme = i, this.layoutManager = s, this.locale = n, this.dpr = o;
  }
  setCanvas(t, e) {
    this.canvas = t, this.ctx = e;
  }
  setTheme(t) {
    this.theme = t;
  }
  setLocale(t) {
    this.locale = t;
  }
  setDpr(t) {
    this.dpr = t;
  }
  setWatermarkConfig(t) {
    this.watermarkConfig = t;
  }
  renderColorDropdown(t) {
    const { config: e, x: i, y: s, width: o, hoveredColor: n } = t, r = e.presetColors || this.getDefaultPresetColors(), a = 8, l = 24, h = 4, c = 8, d = Math.ceil(r.length / a), u = c * 2 + d * (l + h) - h;
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.beginPath(), this.ctx.roundRect(i, s, o, u, 6), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(i, s, o, u, 6), this.ctx.stroke();
    for (let f = 0; f < r.length; f++) {
      const g = r[f], m = f % a, p = Math.floor(f / a), y = i + c + m * (l + h), w = s + c + p * (l + h);
      this.ctx.fillStyle = g, this.ctx.fillRect(y, w, l, l), g === n ? (this.ctx.strokeStyle = "#1890ff", this.ctx.lineWidth = 2, this.ctx.strokeRect(y - 1, w - 1, l + 2, l + 2)) : (this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(y, w, l, l));
    }
  }
  renderTooltip(t) {
    const { x: e, y: i, width: s, content: o } = t, n = 8, r = 20, a = 4, l = 4, h = 4;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    let c = n * 2;
    const d = [], u = [], f = 140, g = 300, m = s ?? g;
    let p = 0;
    if (o.type === "text") {
      const v = this.ctx.measureText(o.text).width;
      p = Math.min(v + n * 2, g);
      const I = Math.max(f, Math.min(p, m));
      let M = "";
      for (const S of o.text.split("")) {
        const T = M + S;
        this.ctx.measureText(T).width > I - n * 2 ? (M && d.push(M), M = S) : M = T;
      }
      M && d.push(M), c += d.length * r;
    } else if (o.type === "tags") {
      const v = o.tags;
      let I = [], M = n;
      for (const S of v) {
        const T = this.ctx.measureText(S.text).width + l * 2;
        p = Math.max(p, M + T + n), M + T + a > m - n && I.length > 0 && (u.push(I), I = [], M = n), I.push(S), M += T + a;
      }
      I.length > 0 && u.push(I), c += u.length * (this.theme.font.size + l * 2) + (u.length - 1) * a;
    }
    const y = Math.max(f, Math.min(p, m));
    let w = e + (m - y) / 2;
    const C = this.canvas.width / this.dpr;
    w < 0 ? w = 4 : w + y > C && (w = C - y - 4);
    const R = i - c - this.theme.colors.tooltip.gap;
    if (this.ctx.save(), this.ctx.fillStyle = this.theme.colors.tooltip.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(w, R, y, c, 6), this.ctx.fill(), this.ctx.restore(), this.ctx.fillStyle = this.theme.colors.tooltip.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "top", o.type === "text") {
      let v = R + n;
      for (const I of d)
        this.ctx.fillText(I, w + n, v), v += r;
    } else if (o.type === "tags") {
      let v = R + n;
      const I = this.theme.font.size + l * 2;
      for (const M of u) {
        let S = w + n;
        for (const T of M) {
          const H = this.ctx.measureText(T.text).width + l * 2;
          this.ctx.fillStyle = T.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0"), this.ctx.beginPath(), this.ctx.roundRect(S, v, H, I, h), this.ctx.fill(), this.ctx.fillStyle = T.color ?? this.theme.colors.cellText ?? "#333", this.ctx.textBaseline = "middle";
          const D = S + (H - this.ctx.measureText(T.text).width) / 2;
          this.ctx.fillText(T.text, D, v + I / 2), S += H + a;
        }
        v += I + a;
      }
    }
  }
  renderScrollbars(t, e, i, s, o) {
    const n = this.canvas.width / this.dpr, r = this.canvas.height / this.dpr, a = this.layoutManager.getLayoutInfo(), l = a.headerHeight, h = 10, c = 30;
    if (s > 0) {
      const d = r - l, u = Math.max(
        c,
        r / a.totalHeight * d
      ), f = l + e / s * (d - u), g = n - h;
      let m = this.theme.colors.scrollbar.thumb;
      o.verticalDragging ? m = this.theme.colors.scrollbar.thumbActive : o.verticalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const p = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(g, f, h - 2, u, 4), this.ctx.fill(), this.ctx.globalAlpha = p;
    }
    if (i > 0) {
      const d = n, u = Math.max(
        c,
        n / a.totalWidth * d
      ), f = t / i * (d - u), g = r - h;
      let m = this.theme.colors.scrollbar.thumb;
      o.horizontalDragging ? m = this.theme.colors.scrollbar.thumbActive : o.horizontalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const p = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(f, g, u, h - 2, 4), this.ctx.fill(), this.ctx.globalAlpha = p;
    }
  }
  getScrollbarBounds(t, e, i, s) {
    const o = this.canvas.width / this.dpr, n = this.canvas.height / this.dpr, r = this.layoutManager.getLayoutInfo(), a = r.headerHeight, l = 10, h = 30;
    let c = null, d = null;
    if (s > 0) {
      const u = n - a, f = Math.max(
        h,
        n / r.totalHeight * u
      ), g = a + e / s * (u - f);
      c = {
        x: o - l,
        y: g,
        width: l - 2,
        height: f
      };
    }
    if (i > 0) {
      const u = o, f = Math.max(
        h,
        o / r.totalWidth * u
      ), g = t / i * (u - f), m = n - l;
      d = {
        x: g,
        y: m,
        width: f,
        height: l - 2
      };
    }
    return { vertical: c, horizontal: d };
  }
  renderWatermark() {
    if (!this.watermarkConfig || !(this.watermarkConfig.enabled ?? !0)) return;
    const e = this.watermarkConfig.content ?? "Watermark";
    if (!e) return;
    const i = this.canvas.width / this.dpr, s = this.canvas.height / this.dpr, o = this.theme.colors.watermark, n = this.watermarkConfig.fontSize ?? o.fontSize, r = this.watermarkConfig.fontFamily ?? o.fontFamily ?? this.theme.font.family, a = this.watermarkConfig.color ?? o.color, l = this.watermarkConfig.rotation ?? -22, h = this.watermarkConfig.gapX ?? 100, c = this.watermarkConfig.gapY ?? 100, d = this.watermarkConfig.opacity ?? o.opacity;
    this.ctx.save(), this.ctx.globalAlpha = d, this.ctx.font = `${n}px ${r}`, this.ctx.fillStyle = a, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const u = l * Math.PI / 180, g = this.ctx.measureText(e).width + h, m = n + c, p = Math.ceil(i / g) + 2, y = Math.ceil(s / m) + 2;
    for (let w = -1; w <= y; w++)
      for (let C = -1; C <= p; C++) {
        const R = C * g + (w % 2 === 0 ? 0 : g / 2), v = w * m;
        this.ctx.save(), this.ctx.translate(R, v), this.ctx.rotate(u), this.ctx.fillText(e, 0, 0), this.ctx.restore();
      }
    this.ctx.restore();
  }
  renderContextMenu(t) {
    const { x: e, y: i, hoveredIndex: s, items: o } = t, n = 140, r = 32, a = o.length * r;
    this.ctx.save(), this.drawMenuPanel(e, i, n, a), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < o.length; l++) {
      const h = o[l], c = i + l * r;
      l === s && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, n, r)), this.ctx.fillStyle = h.danger ? "#f56c6c" : this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + r / 2);
    }
    this.ctx.restore();
  }
  renderHeaderContextMenu(t) {
    const { x: e, y: i, hoveredIndex: s } = t, o = 120, n = 32, r = [{ text: this.locale.contextMenu.hideColumn }], a = r.length * n;
    this.ctx.save(), this.drawMenuPanel(e, i, o, a), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < r.length; l++) {
      const h = r[l], c = i + l * n;
      l === s && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, o, n)), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + n / 2);
    }
    this.ctx.restore();
  }
  renderDateDropdown(t) {
    const { x: e, y: i, width: s, currentYear: o, currentMonth: n, selectedDate: r, hoveredDate: a } = t, l = 40, h = 28, c = 28, d = 8, f = l + h + 6 * c + d * 2;
    this.ctx.save(), vt(this.ctx, this.theme, {
      x: e,
      y: i,
      width: s,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(e, i, s, f);
    const g = this.locale.calendar.months[n] ?? String(n + 1), m = this.locale.calendar.yearMonthFormat.replace("{year}", String(o)).replace("{month}", g);
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(m, e + s / 2, i + l / 2);
    const p = 6, y = e + 20, w = e + s - 20, C = i + l / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(y + p, C - p), this.ctx.lineTo(y - p, C), this.ctx.lineTo(y + p, C + p), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(w - p, C - p), this.ctx.lineTo(w + p, C), this.ctx.lineTo(w - p, C + p), this.ctx.closePath(), this.ctx.fill();
    const R = this.locale.calendar.weekdays, v = (s - d * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let H = 0; H < 7; H++) {
      const D = e + d + H * v + v / 2, k = i + l + h / 2;
      this.ctx.fillText(R[H], D, k);
    }
    const M = new Date(o, n, 1).getDay(), S = new Date(o, n + 1, 0).getDate(), T = /* @__PURE__ */ new Date();
    T.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let H = 1; H <= S; H++) {
      const D = M + H - 1, k = Math.floor(D / 7), P = D % 7, B = e + d + P * v, L = i + l + h + k * c, A = new Date(o, n, H), W = A.getTime() === T.getTime(), _ = r && A.getFullYear() === r.getFullYear() && A.getMonth() === r.getMonth() && A.getDate() === r.getDate(), F = a && A.getFullYear() === a.getFullYear() && A.getMonth() === a.getMonth() && A.getDate() === a.getDate();
      _ ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        B + v / 2,
        L + c / 2,
        Math.min(v, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : F ? (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.beginPath(), this.ctx.arc(
        B + v / 2,
        L + c / 2,
        Math.min(v, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text) : W ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        B + v / 2,
        L + c / 2,
        Math.min(v, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(String(H), B + v / 2, L + c / 2);
    }
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e, i, s, f, 6), this.ctx.stroke(), this.ctx.restore();
  }
  drawMenuPanel(t, e, i, s) {
    vt(this.ctx, this.theme, {
      x: t,
      y: e,
      width: i,
      height: s,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
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
class rt {
  /**
   * Get cell padding
   */
  getPadding() {
    return 8;
  }
  /**
   * Get the text alignment for a column
   */
  getTextAlign(t) {
    return t.align ?? "left";
  }
  /**
   * Calculate text position based on alignment
   */
  calculateTextX(t, e, i, s, o, n) {
    const r = n.measureText(t).width;
    switch (o) {
      case "center":
        return e + (i - r) / 2;
      case "right":
        return e + i - s - r;
      default:
        return e + s;
    }
  }
  /**
   * Draw a rounded rectangle
   */
  drawRoundedRect(t, e, i, s, o, n) {
    t.beginPath(), t.moveTo(e + n, i), t.lineTo(e + s - n, i), t.quadraticCurveTo(e + s, i, e + s, i + n), t.lineTo(e + s, i + o - n), t.quadraticCurveTo(e + s, i + o, e + s - n, i + o), t.lineTo(e + n, i + o), t.quadraticCurveTo(e, i + o, e, i + o - n), t.lineTo(e, i + n), t.quadraticCurveTo(e, i, e + n, i), t.closePath();
  }
  /**
   * Truncate text to fit within a given width
   */
  truncateText(t, e, i, s = "...") {
    if (t.measureText(e).width <= i)
      return e;
    let o = e;
    for (; o.length > 0 && t.measureText(o + s).width > i; )
      o = o.slice(0, -1);
    return o + s;
  }
}
class ie extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "text");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u } = e, f = this.getPadding(), g = this.getTextAlign(l), m = this.formatValue(c, l, h);
    i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const p = m || (l.placeholder ?? ""), y = m ? this.getTextColor(s, d, u) : s.colors.placeholderText;
    i.fillStyle = y;
    const w = r - f * 2, C = this.truncateText(i, p, w), R = this.calculateTextX(C, o, r, f, g, i), v = n + a / 2;
    return i.fillText(C, R, v), { type: "text" };
  }
  getTextColor(e, i, s) {
    return e.colors.cellText;
  }
  formatValue(e, i, s) {
    return e == null ? "" : i.formatter ? i.formatter(e, s, i) : String(e);
  }
}
class li extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "number");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u, locale: f } = e, g = 8, m = this.getTextAlign(l), p = this.formatValue(c, l, h);
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(o, n, r, a), i.stroke();
    const y = l.placeholder ?? f.cell.numberPlaceholder, w = p || y;
    i.fillStyle = p ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const C = r - g * 2, R = this.truncateText(i, w, C), v = this.calculateTextX(R, o, r, g, m, i), I = n + a / 2;
    return i.fillText(R, v, I), { type: "number" };
  }
  formatValue(e, i, s) {
    return e == null || e === "" ? "" : i.formatter ? i.formatter(e, s, i) : typeof e == "number" ? e.toLocaleString() : String(e);
  }
}
class hi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "checkbox");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = o + (r - d) / 2, f = n + (a - d) / 2, g = h ?? !1;
    return i.fillStyle = g ? s.colors.checkbox.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.checkbox.border, i.lineWidth = 1, i.beginPath(), i.roundRect(u, f, d, d, 3), i.fill(), i.stroke(), c.indeterminate ? (i.strokeStyle = g ? s.colors.checkbox.border : s.colors.checkbox.checkedBg, i.lineWidth = 2, i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d - 4, f + d / 2), i.stroke()) : c.checked && (i.strokeStyle = g ? s.colors.checkbox.border : s.colors.checkbox.checkedBg, i.lineWidth = 2, i.lineCap = "round", i.lineJoin = "round", i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d / 2 - 1, f + d - 5), i.lineTo(u + d - 3, f + 4), i.stroke()), { type: "checkbox", config: c };
  }
}
class ci extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "radio");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = 8, f = 4, g = h ?? !1;
    if (i.save(), i.beginPath(), i.rect(o, n, r, a), i.clip(), c.options && c.options.length > 0) {
      i.font = `${s.font.size}px ${s.font.family}`;
      const m = c.options.map((w) => {
        const C = i.measureText(w.label).width;
        return d + f + C + u;
      });
      let p = o + u;
      const y = o + r - u;
      for (let w = 0; w < c.options.length; w++) {
        const C = c.options[w], R = m[w];
        if (p + R - u > y)
          break;
        const v = p, I = n + (a - d) / 2, M = v + d / 2, S = I + d / 2, T = C.disabled || g, H = c.value === C.value;
        i.fillStyle = T ? s.colors.radio.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(M, S, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), H && (i.fillStyle = T ? s.colors.radio.border : s.colors.radio.checkedBg, i.beginPath(), i.arc(M, S, d / 2 - 4, 0, Math.PI * 2), i.fill()), i.fillStyle = T ? s.colors.placeholderText : s.colors.cellText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
        const D = v + d + f;
        i.fillText(C.label, D, S), p += R;
      }
    } else {
      const m = o + (r - d) / 2, p = n + (a - d) / 2, y = m + d / 2, w = p + d / 2;
      i.fillStyle = g ? s.colors.radio.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(y, w, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), c.checked && (i.fillStyle = g ? s.colors.radio.border : s.colors.radio.checkedBg, i.beginPath(), i.arc(y, w, d / 2 - 4, 0, Math.PI * 2), i.fill());
    }
    return i.restore(), { type: "radio", config: c };
  }
}
class di extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "button");
  }
  render(e) {
    const { value: i, buttonHoverState: s } = e, o = i;
    return this.isButtonsConfig(o) ? this.renderButtons(e, o) : this.renderSingleButton(e, o, s == null ? void 0 : s.progress);
  }
  isButtonsConfig(e) {
    return "buttons" in e;
  }
  renderSingleButton(e, i, s) {
    const { ctx: o, theme: n, locale: r, x: a, y: l, width: h, height: c, isDisabled: d } = e, u = 8, f = i.size === "small" ? 24 : i.size === "large" ? 40 : 32, g = l + (c - f) / 2, m = d ?? !1, p = i.text ?? r.cell.buttonText;
    o.font = `${n.font.size}px ${n.font.family}`;
    const y = o.measureText(p).width, C = Math.min(
      Math.max(y + 16 * 2, 60),
      h - u * 2
    ), R = a + (h - C) / 2, v = s ?? 0;
    let I, M, S;
    if (m)
      I = n.colors.button.disabledBg, M = n.colors.button.disabledText, S = n.colors.button.disabledBorder;
    else
      switch (i.variant) {
        case "primary":
          I = n.colors.button.primaryBg, M = n.colors.button.primaryText, S = I;
          break;
        case "danger":
          I = n.colors.button.dangerBg, M = n.colors.button.dangerText, S = I;
          break;
        case "warning":
          I = n.colors.button.warningBg, M = n.colors.button.warningText, S = I;
          break;
        case "link":
          I = "transparent", M = n.colors.button.linkText, S = "transparent";
          break;
        default:
          I = n.colors.button.background, M = n.colors.button.text, S = n.colors.button.border;
      }
    if (!m && v > 0 && i.variant !== "link")
      if (i.variant === "default" || !i.variant) {
        const H = this.hexToRgb(n.colors.button.background);
        if ((H.r * 299 + H.g * 587 + H.b * 114) / 1e3 > 128) {
          const k = Math.round(H.r - v * 0.2 * H.r);
          I = `rgb(${k}, ${k}, ${k})`;
        } else {
          const k = Math.round(H.r + v * 0.2 * (255 - H.r));
          I = `rgb(${k}, ${k}, ${k})`;
        }
      } else
        o.globalAlpha = 1 - v * 0.2;
    o.fillStyle = I, o.strokeStyle = S, o.lineWidth = 1;
    const T = 4;
    return o.beginPath(), o.roundRect(R, g, C, f, T), o.fill(), o.stroke(), !m && v > 0 && i.variant !== "link" && (o.globalAlpha = 1), o.fillStyle = M, o.font = `${n.font.size}px ${n.font.family}`, o.textBaseline = "middle", o.textAlign = "center", o.fillText(p, R + C / 2, g + f / 2), o.textAlign = "left", { type: "button", config: i };
  }
  renderButtons(e, i) {
    const { ctx: s, theme: o, locale: n, x: r, y: a, height: l, isDisabled: h, hoveredButtonIndex: c } = e, d = 8, u = i.gap ?? 4, f = i.maxVisible ?? 3, g = 24, m = a + (l - g) / 2, p = i.buttons.filter((R) => R.visible !== !1), y = p.slice(0, f), w = p.slice(f);
    let C = r + d;
    for (let R = 0; R < y.length; R++) {
      const v = y[R], I = v.text ?? n.cell.buttonText;
      s.font = `${o.font.size}px ${o.font.family}`;
      const M = s.measureText(I).width, S = Math.max(M + 16, 40), T = c === R && !h, H = h ?? !1;
      let D, k, P;
      H ? (D = o.colors.button.disabledBg, k = o.colors.button.disabledText, P = o.colors.button.disabledBorder) : v.variant === "primary" ? (D = o.colors.button.primaryBg, k = o.colors.button.primaryText, P = D) : v.variant === "danger" ? (D = o.colors.button.dangerBg, k = o.colors.button.dangerText, P = D) : v.variant === "warning" ? (D = o.colors.button.warningBg, k = o.colors.button.warningText, P = D) : v.variant === "link" ? (D = "transparent", k = o.colors.button.linkText, P = "transparent") : (D = T ? o.colors.button.hoverBg : o.colors.button.background, k = o.colors.button.text, P = o.colors.button.border), s.fillStyle = D, s.strokeStyle = P, s.lineWidth = 1, s.beginPath(), s.roundRect(C, m, S, g, 4), s.fill(), s.stroke(), s.fillStyle = k, s.font = `${o.font.size}px ${o.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(I, C + S / 2, m + g / 2), C += S + u;
    }
    if (w.length > 0) {
      const R = i.moreButtonText ?? "···", v = s.measureText(R).width, I = Math.max(v + 16, 32), M = h ?? !1, S = c === y.length && !M;
      s.fillStyle = M ? o.colors.button.disabledBg : S ? o.colors.button.hoverBg : o.colors.button.background, s.strokeStyle = M ? o.colors.button.disabledBorder : o.colors.button.border, s.lineWidth = 1, s.beginPath(), s.roundRect(C, m, I, g, 4), s.fill(), s.stroke(), s.fillStyle = M ? o.colors.button.disabledText : o.colors.button.text, s.font = `${o.font.size}px ${o.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(R, C + I / 2, m + g / 2);
    }
    return s.textAlign = "left", { type: "buttons", config: i };
  }
  hexToRgb(e) {
    const i = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return i ? {
      r: parseInt(i[1], 16),
      g: parseInt(i[2], 16),
      b: parseInt(i[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
class ui extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "switch");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h, switchAnimation: c } = e, d = l, u = 44, f = 22, g = 18, m = o + (r - u) / 2, p = n + (a - f) / 2, y = f / 2, w = d.checked ?? !1, C = h ?? !1, R = (c == null ? void 0 : c.progress) ?? (w ? 1 : 0), v = u - g - 4, I = m + 2 + R * v, M = p + (f - g) / 2;
    i.save();
    const S = C ? s.colors.switch.disabledOffBg : s.colors.switch.offBg, T = C ? s.colors.switch.disabledOnBg : s.colors.switch.onBg, H = this.hexToRgb(S), D = this.hexToRgb(T), k = Math.round(H.r + (D.r - H.r) * R), P = Math.round(H.g + (D.g - H.g) * R), B = Math.round(H.b + (D.b - H.b) * R);
    return i.fillStyle = `rgb(${k}, ${P}, ${B})`, i.beginPath(), i.roundRect(m, p, u, f, y), i.fill(), i.fillStyle = s.colors.switch.thumb, i.beginPath(), i.arc(I + g / 2, M + g / 2, g / 2, 0, Math.PI * 2), i.fill(), i.shadowColor = s.colors.shadow.color, i.shadowBlur = s.colors.shadow.blur, i.shadowOffsetX = s.colors.shadow.offsetX, i.shadowOffsetY = s.colors.shadow.offsetY, i.restore(), { type: "switch", config: d };
  }
  hexToRgb(e) {
    const i = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return i ? {
      r: parseInt(i[1], 16),
      g: parseInt(i[2], 16),
      b: parseInt(i[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
const se = 32;
class fi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "progress");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = h.shape ?? "line";
    return c === "line" ? this.renderLineProgress(i, s, o, n, r, a, h) : c === "circle" ? this.renderCircleProgress(i, s, o, n, r, a, h) : c === "dashboard" && this.renderDashboardProgress(i, s, o, n, r, a, h), { type: "progress", config: h };
  }
  renderLineProgress(e, i, s, o, n, r, a) {
    const h = a.textPosition ?? "right", c = a.showText ?? !0, d = a.size ?? "medium";
    e.save();
    const u = a.height ?? (d === "small" ? 6 : d === "large" ? 16 : 10), f = 8, g = c && h === "right" ? 40 : 0, m = a.width ?? n - 8 * 2 - g, p = s + 8, y = o + (r - u) / 2, w = Math.min(100, Math.max(0, a.value)), C = this.getProgressColor(i, a, w), R = a.trackColor ?? i.colors.progress.track, v = a.borderRadius ?? u / 2;
    e.fillStyle = R, e.beginPath(), e.roundRect(p, y, m, u, v), e.fill();
    const I = w / 100 * m;
    if (I > 0) {
      e.fillStyle = C, e.beginPath();
      const M = Math.max(I, v * 2);
      e.roundRect(p, y, M, u, v), e.fill();
    }
    if (c) {
      const M = a.precision ?? 0, S = a.format ? a.format(w) : `${M === 0 ? Math.round(w) : w.toFixed(M)}%`;
      let T;
      h === "inside" ? T = Math.min(i.font.size, Math.max(10, u - 2)) : T = d === "small" ? 11 : d === "large" ? 14 : i.font.size, e.font = `${T}px ${i.font.family}`, e.textBaseline = "middle", h === "right" ? (e.textAlign = "left", e.fillStyle = a.textColor ?? i.colors.cellText, e.fillText(S, p + m + f, o + r / 2)) : (e.textAlign = "center", e.fillStyle = a.textColor ?? i.colors.cellText, e.fillText(S, p + m / 2, o + r / 2));
    }
    e.restore();
  }
  renderCircleProgress(e, i, s, o, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(se * (l === "small" ? 0.6 : l === "large" ? 0.9 : 0.75)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.12)), f = s + n / 2, g = o + r / 2, m = (d - u) / 2, p = Math.min(100, Math.max(0, a.value)), y = this.getProgressColor(i, a, p), w = a.trackColor ?? i.colors.progress.track;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.beginPath(), e.arc(f, g, m, 0, Math.PI * 2), e.stroke();
    const C = p / 100, R = -Math.PI / 2, v = R + C * Math.PI * 2;
    if (C > 0 && (e.strokeStyle = y, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, R, v), e.stroke()), a.showText ?? !0) {
      const I = a.precision ?? 0, M = a.format ? a.format(p) : `${I === 0 ? Math.round(p) : p.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? i.colors.cellText;
      const S = Math.max(8, Math.round(d * 0.32));
      e.font = `bold ${S}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(M, f, g);
    }
    e.restore();
  }
  renderDashboardProgress(e, i, s, o, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(se * (l === "small" ? 0.7 : l === "large" ? 0.95 : 0.85)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.1)), f = s + n / 2, g = o + r / 2 + r * 0.05, m = (d - u) / 2, p = Math.min(100, Math.max(0, a.value)), y = this.getProgressColor(i, a, p), w = a.trackColor ?? i.colors.progress.track, C = Math.PI * 0.75, R = Math.PI * 1.5;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, C, C + R, !1), e.stroke();
    const v = p / 100;
    if (v > 0) {
      const I = C + v * R;
      e.strokeStyle = y, e.beginPath(), e.arc(f, g, m, C, I, !1), e.stroke();
    }
    if (a.showText ?? !0) {
      const I = a.precision ?? 0, M = a.format ? a.format(p) : `${I === 0 ? Math.round(p) : p.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? i.colors.cellText;
      const S = Math.max(8, Math.round(d * 0.28));
      e.font = `bold ${S}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(M, f, g);
    }
    e.restore();
  }
  getProgressColor(e, i, s) {
    const { color: o, status: n } = i;
    if (n === "success") return e.colors.progress.success;
    if (n === "warning") return e.colors.progress.warning;
    if (n === "error") return e.colors.progress.error;
    if (typeof o == "string") return o;
    if (typeof o == "function") return o(s);
    if (Array.isArray(o) && o.length > 0) {
      const r = [...o].sort((a, l) => a.value - l.value);
      if (s <= r[0].value) return r[0].color;
      if (s >= r[r.length - 1].value) return r[r.length - 1].color;
      for (let a = 0; a < r.length - 1; a++) {
        const l = r[a], h = r[a + 1];
        if (s >= l.value && s <= h.value) {
          const c = (s - l.value) / (h.value - l.value);
          return this.interpolateColor(l.color, h.color, c);
        }
      }
    }
    return e.colors.progress.default;
  }
  interpolateColor(e, i, s) {
    const o = this.hexToRgb(e), n = this.hexToRgb(i), r = Math.round(o.r + (n.r - o.r) * s), a = Math.round(o.g + (n.g - o.g) * s), l = Math.round(o.b + (n.b - o.b) * s);
    return `rgb(${r}, ${a}, ${l})`;
  }
  hexToRgb(e) {
    const i = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return i ? {
      r: parseInt(i[1], 16),
      g: parseInt(i[2], 16),
      b: parseInt(i[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
const gi = 32, ot = class ot extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "image");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isHovered: h, hoveredImageIndex: c } = e, d = l;
    if (d.images && d.images.length > 0)
      return this.renderMultipleImages(
        i,
        s,
        o,
        n,
        r,
        a,
        d,
        h,
        c
      );
    if (!d.src)
      return { type: "image", config: d };
    const f = this.getMaxImageSize(r, a, 4, d), g = d.width ?? 32, m = d.height ?? 32, p = Math.min(g, f), y = Math.min(m, f), w = d.circle ? Math.min(p, y) / 2 : d.borderRadius ?? 0, C = o + (r - p) / 2, R = n + (a - y) / 2;
    if (i.fillStyle = s.colors.image.placeholderBg, i.beginPath(), w > 0 ? i.roundRect(C, R, p, y, w) : i.rect(C, R, p, y), i.fill(), ot.failedImages.has(d.src))
      return this.renderImageError(
        i,
        s,
        C,
        R,
        p,
        y,
        w,
        d.errorImage
      ), { type: "image", config: d };
    const v = ot.imageCache.get(d.src);
    return v ? (i.save(), i.beginPath(), w > 0 ? i.roundRect(C, R, p, y, w) : i.rect(C, R, p, y), i.clip(), this.drawImageWithFit(
      i,
      v,
      C,
      R,
      p,
      y,
      d.fit ?? "cover"
    ), i.restore()) : ot.loadingImages.has(d.src) ? this.renderImagePlaceholder(
      i,
      s,
      C,
      R,
      p,
      y,
      w,
      d.placeholder
    ) : this.renderImagePlaceholder(
      i,
      s,
      C,
      R,
      p,
      y,
      w,
      d.placeholder
    ), h && d.hoverable !== !1 && this.renderImageHover(i, s, C, R, p, y, w), { type: "image", config: d };
  }
  renderMultipleImages(e, i, s, o, n, r, a, l, h) {
    const c = a.images, d = 4, u = this.getMaxImageSize(n, r, d, a), f = a.width ?? 32, g = a.height ?? 32, m = Math.min(f, u), p = Math.min(g, u), y = a.gap ?? 4, w = a.circle ? Math.min(m, p) / 2 : a.borderRadius ?? 0, C = a.showMoreCount !== !1, R = n - d * 2, v = r - d * 2, I = Math.max(1, Math.floor((R + y) / (m + y))), M = Math.max(1, Math.floor((v + y) / (p + y))), S = I * M, T = a.maxVisible ?? S, D = C && c.length > T ? Math.max(1, S - 1) : S, k = Math.max(1, Math.min(T, D)), P = c.length > k, B = P ? k : c.length, L = c.slice(0, B), A = P ? c.length - k : 0, W = B + (P && C ? 1 : 0), _ = Math.max(1, Math.ceil(W / I)), F = Math.min(W, I), V = F * m + Math.max(0, F - 1) * y, z = _ * p + Math.max(0, _ - 1) * y;
    let X = s + (n - V) / 2;
    X = Math.max(s + d, X);
    const G = o + (r - z) / 2;
    for (let U = 0; U < L.length; U++) {
      const K = L[U], tt = Math.floor(U / I), st = U % I, Y = X + st * (m + y), j = G + tt * (p + y), dt = l && a.hoverable !== !1 && h === U;
      if (e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), w > 0 ? e.roundRect(Y, j, m, p, w) : e.rect(Y, j, m, p), e.fill(), ot.failedImages.has(K)) {
        this.renderImageError(
          e,
          i,
          Y,
          j,
          m,
          p,
          w,
          a.errorImage
        ), dt && this.renderImageHover(e, i, Y, j, m, p, w);
        continue;
      }
      const ht = ot.imageCache.get(K);
      ht ? (e.save(), e.beginPath(), w > 0 ? e.roundRect(Y, j, m, p, w) : e.rect(Y, j, m, p), e.clip(), this.drawImageWithFit(
        e,
        ht,
        Y,
        j,
        m,
        p,
        a.fit ?? "cover"
      ), e.restore()) : this.renderImagePlaceholder(
        e,
        i,
        Y,
        j,
        m,
        p,
        w,
        a.placeholder
      ), dt && this.renderImageHover(e, i, Y, j, m, p, w);
    }
    if (P && C) {
      const U = Math.floor(B / I), K = B % I, tt = X + K * (m + y), st = G + U * (p + y), Y = l && a.hoverable !== !1 && h === B;
      this.renderMoreCount(
        e,
        i,
        tt,
        st,
        m,
        p,
        w,
        A,
        Y
      );
    }
    return { type: "image", config: a };
  }
  renderImagePlaceholder(e, i, s, o, n, r, a, l) {
    e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), a > 0 ? e.roundRect(s, o, n, r, a) : e.rect(s, o, n, r), e.fill(), l && (e.fillStyle = i.colors.placeholderText, e.font = `${Math.min(12, n / 4)}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(l, s + n / 2, o + r / 2), e.textAlign = "left");
  }
  getMaxImageSize(e, i, s, o) {
    const n = o.scaleWithRowHeight === !1 ? Math.min(i, gi) : i;
    return Math.max(0, Math.min(e, n) - s * 2);
  }
  renderImageError(e, i, s, o, n, r, a, l) {
    if (e.fillStyle = i.colors.image.errorBg ?? "#f0f0f0", e.beginPath(), a > 0 ? e.roundRect(s, o, n, r, a) : e.rect(s, o, n, r), e.fill(), l) {
      const h = ot.imageCache.get(l);
      if (h) {
        e.save(), e.beginPath(), a > 0 ? e.roundRect(s, o, n, r, a) : e.rect(s, o, n, r), e.clip(), this.drawImageWithFit(e, h, s, o, n, r, "cover"), e.restore();
        return;
      }
    }
    e.fillStyle = i.colors.placeholderText, e.font = `bold ${Math.min(16, n / 2)}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText("!", s + n / 2, o + r / 2), e.textAlign = "left";
  }
  renderImageHover(e, i, s, o, n, r, a) {
    e.strokeStyle = i.colors.image.hoverBorder, e.lineWidth = 2, e.beginPath(), a > 0 ? e.roundRect(s, o, n, r, a) : e.rect(s, o, n, r), e.stroke();
  }
  renderMoreCount(e, i, s, o, n, r, a, l, h) {
    e.fillStyle = h ? i.colors.image.hoverBorder : i.colors.moreCount.background, e.beginPath(), a > 0 ? e.roundRect(s, o, n, r, a) : e.rect(s, o, n, r), e.fill();
    const c = `+${l}`;
    e.fillStyle = i.colors.moreCount.text, e.font = `bold ${i.font.size}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(c, s + n / 2, o + r / 2), e.textAlign = "left";
  }
  drawImageWithFit(e, i, s, o, n, r, a) {
    if (a === "none") {
      e.drawImage(i, s, o, n, r);
      return;
    }
    const l = i.width / i.height, h = n / r;
    let c, d, u, f;
    switch (a) {
      case "cover":
        l > h ? (d = r, c = r * l, u = s - (c - n) / 2, f = o) : (c = n, d = n / l, u = s, f = o - (d - r) / 2);
        break;
      case "contain":
        l > h ? (c = n, d = n / l, u = s, f = o + (r - d) / 2) : (d = r, c = r * l, u = s + (n - c) / 2, f = o);
        break;
      case "fill":
      default:
        u = s, f = o, c = n, d = r;
    }
    e.drawImage(i, u, f, c, d);
  }
  /**
   * Clear all static caches to prevent memory leaks
   */
  static clearCache() {
    ot.imageCache.clear(), ot.loadingImages.clear(), ot.failedImages.clear();
  }
};
/**
 * Image cache reference - set by Renderer during initialization
 */
b(ot, "imageCache", /* @__PURE__ */ new Map()), b(ot, "loadingImages", /* @__PURE__ */ new Set()), b(ot, "failedImages", /* @__PURE__ */ new Set());
let wt = ot;
class mi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "tag");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, locale: h } = e, c = l, d = 8;
    if (!c.tags || c.tags.length === 0) {
      const S = c.placeholder ?? h.cell.tagPlaceholder;
      return S && (i.fillStyle = s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle", i.fillText(S, o + d, n + a / 2)), { type: "tag", config: c };
    }
    const u = 4, f = s.font.size + u * 2, g = 4, m = 4, p = 2, y = /* @__PURE__ */ new Map(), w = (S) => {
      let T = y.get(S);
      return T === void 0 && (T = i.measureText(S).width, y.set(S, T)), T;
    }, C = (S) => w(`+${S}`) + u * 2, { lines: R, processedTags: v } = de(i, c, r, a, s.font.size), I = R.length * f + (R.length - 1) * p, M = n + (a - I) / 2;
    for (let S = 0; S < R.length; S++) {
      const T = R[S], H = M + S * (f + p);
      let D = o + d;
      for (const { tag: k, displayText: P, width: B } of T) {
        let L = k.bgColor ?? (s.colors.tagColors.default || "#f0f0f0"), A = k.color ?? s.colors.cellText;
        i.fillStyle = L, i.beginPath(), i.roundRect(D, H, B, f, g), i.fill(), i.fillStyle = A, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
        const W = H + f / 2, _ = D + (B - w(P)) / 2;
        i.fillText(P, _, W), D += B + m;
      }
      if (S === R.length - 1) {
        const k = c.tags.length - v;
        if (k > 0) {
          const P = `+${k}`, B = C(k);
          i.fillStyle = s.colors.moreCount.background, i.beginPath(), i.roundRect(D, H, B, f, g), i.fill(), i.fillStyle = s.colors.moreCount.text, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
          const L = H + f / 2, A = D + (B - w(P)) / 2;
          i.fillText(P, A, L);
        }
      }
    }
    return { type: "tag", config: c };
  }
}
class pi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "date");
  }
  render(e) {
    const { ctx: i, theme: s, locale: o, x: n, y: r, width: a, height: l, value: h } = e, c = h, d = 8, u = 20;
    i.strokeStyle = s.colors.date.border, i.lineWidth = 1, i.beginPath(), i.rect(n, r, a, l), i.stroke();
    let f = "";
    if (c.value) {
      const v = c.value instanceof Date ? c.value : new Date(c.value);
      if (!isNaN(v.getTime())) {
        const I = c.format ?? "YYYY-MM-DD";
        f = this.formatDate(v, I);
      }
    }
    const g = c.placeholder ?? o.cell.datePlaceholder, m = f || g;
    i.fillStyle = f ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const p = a - d * 2 - u, y = "...";
    let w = m;
    if (i.measureText(m).width > p) {
      let v = m;
      for (; v.length > 0 && i.measureText(v + y).width > p; )
        v = v.slice(0, -1);
      w = v + y;
    }
    i.fillText(w, n + d, r + l / 2), i.strokeStyle = s.colors.date.icon, i.lineWidth = 1.5;
    const C = n + a - d - 10, R = r + l / 2;
    return i.beginPath(), i.moveTo(C - 6, R - 6), i.lineTo(C - 6, R + 6), i.lineTo(C + 6, R + 6), i.lineTo(C + 6, R - 6), i.closePath(), i.stroke(), i.beginPath(), i.moveTo(C - 6, R - 2), i.lineTo(C + 6, R - 2), i.stroke(), i.beginPath(), i.moveTo(C - 3, R - 8), i.lineTo(C - 3, R - 5), i.stroke(), i.beginPath(), i.moveTo(C + 3, R - 8), i.lineTo(C + 3, R - 5), i.stroke(), { type: "date", config: c };
  }
  formatDate(e, i) {
    const s = e.getFullYear(), o = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0"), r = String(e.getHours()).padStart(2, "0"), a = String(e.getMinutes()).padStart(2, "0"), l = String(e.getSeconds()).padStart(2, "0");
    return i.replace("YYYY", String(s)).replace("MM", o).replace("DD", n).replace("HH", r).replace("mm", a).replace("ss", l);
  }
}
class xi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "select");
  }
  render(e) {
    const { ctx: i, theme: s, locale: o, x: n, y: r, width: a, height: l, value: h, multipleSelectSeparator: c } = e, d = h, u = 8, f = 20;
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(n, r, a, l), i.stroke();
    const g = s.font.size, m = g * 1.5;
    if (d.multiple && Array.isArray(d.value) && d.value.length > 0) {
      const w = this.calculateMaxRows(l, m, u), C = a - u * 2 - f, R = d.value.map((T) => {
        const H = d.options.find((D) => D.value === T);
        return (H == null ? void 0 : H.label) ?? String(T);
      }), v = d.separator ?? c ?? ", ", I = this.wrapTextToLines(i, R.join(v), C, w);
      i.fillStyle = s.colors.cellText, i.font = `${g}px ${s.font.family}`, i.textBaseline = "top";
      const M = I.length * m, S = r + (l - M) / 2;
      for (let T = 0; T < I.length; T++) {
        const H = I[T];
        i.fillText(H, n + u, S + T * m + (m - g) / 2);
      }
    } else {
      let w = "";
      if (d.value !== void 0 && d.value !== null) {
        const M = d.options.find((S) => S.value === d.value);
        w = (M == null ? void 0 : M.label) ?? String(d.value);
      }
      const C = d.placeholder ?? o.cell.selectPlaceholder, R = w || C;
      i.fillStyle = w ? s.colors.cellText : s.colors.placeholderText, i.font = `${g}px ${s.font.family}`, i.textBaseline = "middle";
      const v = a - u * 2 - f, I = this.truncateText(i, R, v);
      i.fillText(I, n + u, r + l / 2);
    }
    i.fillStyle = s.colors.date.icon, i.beginPath();
    const p = n + a - u - 8, y = r + l / 2;
    return i.moveTo(p - 4, y - 2), i.lineTo(p, y + 3), i.lineTo(p + 4, y - 2), i.closePath(), i.fill(), { type: "select", config: d };
  }
  calculateMaxRows(e, i, s = 8) {
    return Math.max(1, Math.floor((e - s * 2) / i));
  }
  wrapTextToLines(e, i, s, o) {
    const n = [];
    let r = "";
    for (const a of i) {
      const l = r + a;
      if (e.measureText(l).width > s && r) {
        if (n.push(r), r = a, n.length >= o) {
          const c = n[o - 1], d = "...";
          let u = c;
          for (; e.measureText(u + d).width > s && u.length > 0; )
            u = u.slice(0, -1);
          return n[o - 1] = u + d, n;
        }
      } else
        r = l;
    }
    return r && n.push(r), n.slice(0, o);
  }
}
class wi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "input");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = 8;
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(o, n, r, a), i.stroke();
    const d = h.value ?? "", u = h.placeholder ?? "", f = d || u;
    i.fillStyle = d ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const g = r - c * 2;
    if (h.multiline) {
      const m = s.font.size * 1.5, p = h.maxRows ?? 5, y = a - c * 2, w = Math.max(1, Math.floor(y / m)), C = Math.min(p, w), R = this.wrapText(i, f, g), v = R.slice(0, C), I = v.length * m;
      let S = n + (a - I) / 2 + m / 2;
      for (let T = 0; T < v.length; T++) {
        let H = v[T];
        const D = T === v.length - 1, k = R.length > v.length;
        D && (H = this.truncateTextWithEllipsis(i, H, g, k)), i.fillText(H, o + c, S), S += m;
      }
    } else {
      const m = this.truncateTextWithEllipsis(i, f, g);
      i.fillText(m, o + c, n + a / 2);
    }
    return { type: "input", config: h };
  }
  wrapText(e, i, s) {
    const o = [], n = i.split(`
`);
    for (const r of n) {
      if (r === "") {
        o.push("");
        continue;
      }
      let a = r;
      for (; a.length > 0; ) {
        const l = this.findLineBreakPoint(e, a, s);
        l === 0 ? (o.push(a[0]), a = a.slice(1)) : (o.push(a.slice(0, l)), a = a.slice(l));
      }
    }
    return o;
  }
  /**
   * 二分查找找到能放入 maxWidth 的最大字符数
   */
  findLineBreakPoint(e, i, s) {
    const o = i.length;
    if (o === 0) return 0;
    if (e.measureText(i).width <= s)
      return o;
    let n = 1, r = o, a = 0;
    for (; n <= r; ) {
      const l = Math.floor((n + r) / 2), h = i.slice(0, l);
      e.measureText(h).width <= s ? (a = l, n = l + 1) : r = l - 1;
    }
    return a;
  }
  truncateTextWithEllipsis(e, i, s, o = !1) {
    const n = "...", r = e.measureText(n).width, a = e.measureText(i).width;
    return a <= s ? o ? a + r <= s ? i + n : this.truncateWithEllipsisBinary(e, i, s, n, r) : i : this.truncateWithEllipsisBinary(e, i, s, n, r);
  }
  /**
   * 二分查找截断文本并添加省略号
   */
  truncateWithEllipsisBinary(e, i, s, o, n) {
    const r = s - n;
    if (r <= 0)
      return o;
    const a = i.length;
    let l = 0, h = a, c = 0;
    for (; l <= h; ) {
      const d = Math.floor((l + h) / 2), u = i.slice(0, d);
      e.measureText(u).width <= r ? (c = d, l = d + 1) : h = d - 1;
    }
    return i.slice(0, c) + o;
  }
}
class yi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "rating");
  }
  render(e) {
    const { ctx: i, x: s, y: o, width: n, height: r, value: a, isDisabled: l } = e, h = a, c = h.value ?? 0, d = h.max ?? 5, u = h.starSize ?? 16, f = h.allowHalf ?? !1, g = Math.min(u, Math.floor(n / d)), m = h.color ?? "#FFD700", p = h.inactiveColor ?? "#E0E0E0", y = h.disabledColor ?? "#BDBDBD", w = l ? y : m, C = l ? y : p, R = d * g, v = s + (n - R) / 2, I = o + (r - g) / 2;
    i.save();
    const M = [];
    for (let S = 0; S < d; S++) {
      const T = v + S * g;
      M.push({
        index: S,
        x: T,
        width: g
      });
      const H = c - S;
      let D = 0;
      H >= 1 ? D = 1 : H > 0 && (D = f ? H : 0), this.drawStar(i, T, I, g, D, w, C);
    }
    return i.restore(), {
      type: "rating",
      config: { ...h, value: c },
      starBounds: M
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
  drawStar(e, i, s, o, n, r, a) {
    const l = i + o / 2, h = s + o / 2, c = o / 2, d = c * 0.4, u = this.getStarPoints(l, h, c, d);
    e.beginPath(), e.moveTo(u[0].x, u[0].y);
    for (let f = 1; f < u.length; f++)
      e.lineTo(u[f].x, u[f].y);
    if (e.closePath(), e.fillStyle = a, e.fill(), n > 0) {
      e.save(), e.beginPath(), e.rect(i, s, o * n, o), e.clip(), e.beginPath(), e.moveTo(u[0].x, u[0].y);
      for (let f = 1; f < u.length; f++)
        e.lineTo(u[f].x, u[f].y);
      e.closePath(), e.fillStyle = r, e.fill(), e.restore();
    }
  }
  /**
   * Calculate star points coordinates
   */
  getStarPoints(e, i, s, o) {
    const n = [], r = Math.PI / 5, a = -Math.PI / 2;
    for (let l = 0; l < 10; l++) {
      const h = a + l * r, c = l % 2 === 0 ? s : o;
      n.push({
        x: e + c * Math.cos(h),
        y: i + c * Math.sin(h)
      });
    }
    return n;
  }
}
const Ci = 32;
class bi extends rt {
  constructor() {
    super(...arguments);
    b(this, "type", "color");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, u = Math.min(Ci - 8 * 2, 24), f = o + (r - u) / 2, g = n + (a - u) / 2;
    return i.fillStyle = c.value || "#ffffff", i.fillRect(f, g, u, u), i.strokeStyle = h ? "#bdbdbd" : "#d9d9d9", i.lineWidth = 1, i.strokeRect(f, g, u, u), c.showText && (i.fillStyle = this.getContrastColor(c.value || "#ffffff"), i.font = `${s.font.size}px ${s.font.family}`, i.textAlign = "center", i.textBaseline = "middle", i.fillText(c.value || "", f + u / 2, g + u / 2)), { type: "color", config: c };
  }
  getContrastColor(e) {
    const i = this.hexToRgb(e);
    return (0.299 * i.r + 0.587 * i.g + 0.114 * i.b) / 255 > 0.5 ? "#000000" : "#ffffff";
  }
  hexToRgb(e) {
    const i = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return i ? {
      r: parseInt(i[1], 16),
      g: parseInt(i[2], 16),
      b: parseInt(i[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }
}
class Ri {
  constructor() {
    b(this, "enabled", !1);
    b(this, "stats", /* @__PURE__ */ new Map());
    b(this, "currentFrame", null);
    b(this, "frameHistory", []);
    b(this, "maxFrameHistory", 60);
  }
  // Keep last 60 frames
  /**
   * Enable or disable performance monitoring
   */
  setEnabled(t) {
    this.enabled = t, t || this.reset();
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
    this.enabled && (this.currentFrame = {
      frameStart: performance.now(),
      rendererTimes: /* @__PURE__ */ new Map(),
      totalFrameTime: 0,
      cellCount: 0
    });
  }
  /**
   * End the current frame and record stats
   */
  endFrame() {
    !this.enabled || !this.currentFrame || (this.currentFrame.totalFrameTime = performance.now() - this.currentFrame.frameStart, this.frameHistory.push(this.currentFrame), this.frameHistory.length > this.maxFrameHistory && this.frameHistory.shift(), this.currentFrame = null);
  }
  /**
   * Record a render call
   * @param rendererType The type of renderer
   * @param duration The duration of the render call in ms
   */
  recordRender(t, e) {
    if (!this.enabled) return;
    const i = this.stats.get(t) || {
      totalTime: 0,
      callCount: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: 1 / 0
    };
    if (i.totalTime += e, i.callCount++, i.avgTime = i.totalTime / i.callCount, i.maxTime = Math.max(i.maxTime, e), i.minTime = Math.min(i.minTime, e), this.stats.set(t, i), this.currentFrame) {
      const s = this.currentFrame.rendererTimes.get(t) || [];
      s.push(e), this.currentFrame.rendererTimes.set(t, s), this.currentFrame.cellCount++;
    }
  }
  /**
   * Measure the execution time of a render function
   */
  measure(t, e) {
    if (!this.enabled)
      return e();
    const i = performance.now(), s = e(), o = performance.now() - i;
    return this.recordRender(t, o), s;
  }
  /**
   * Get stats for a specific renderer
   */
  getStats(t) {
    return this.stats.get(t);
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
    return this.frameHistory.length === 0 ? 0 : this.frameHistory.reduce((e, i) => e + i.totalFrameTime, 0) / this.frameHistory.length;
  }
  /**
   * Get FPS based on recent frames
   */
  getFPS() {
    const t = this.getAverageFrameTime();
    return t === 0 ? 0 : 1e3 / t;
  }
  /**
   * Get the slowest renderers by average time
   */
  getSlowestRenderers(t = 5) {
    return Array.from(this.stats.entries()).map(([i, s]) => ({ type: i, stats: s })).sort((i, s) => s.stats.avgTime - i.stats.avgTime).slice(0, t);
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
    this.stats.clear(), this.frameHistory = [], this.currentFrame = null;
  }
  /**
   * Get a formatted report string
   */
  getReport() {
    const t = [
      "=== Renderer Performance Report ===",
      `Status: ${this.enabled ? "Enabled" : "Disabled"}`,
      `Average Frame Time: ${this.getAverageFrameTime().toFixed(2)}ms`,
      `Estimated FPS: ${this.getFPS().toFixed(1)}`,
      "",
      "Renderer Stats (sorted by avg time):",
      "-".repeat(60)
    ], e = this.getSlowestRenderers(20);
    for (const { type: i, stats: s } of e)
      t.push(
        `${i.padEnd(15)} | calls: ${s.callCount.toString().padStart(6)} | avg: ${s.avgTime.toFixed(3).padStart(8)}ms | max: ${s.maxTime.toFixed(3).padStart(8)}ms | total: ${s.totalTime.toFixed(1).padStart(8)}ms`
      );
    return t.join(`
`);
  }
  /**
   * Print report to console
   */
  printReport() {
    console.log(this.getReport());
  }
}
let Dt = null;
function vi() {
  return Dt || (Dt = new Ri()), Dt;
}
class Ii {
  constructor(t = nt) {
    b(this, "renderers", /* @__PURE__ */ new Map());
    b(this, "defaultRenderer");
    b(this, "performanceMonitor");
    b(this, "locale");
    this.locale = t, this.register(new ie()), this.register(new li()), this.register(new hi()), this.register(new ci());
    const e = new di();
    this.register(e), this.renderers.set("buttons", e), this.register(new ui()), this.register(new fi()), this.register(new wt()), this.register(new mi()), this.register(new pi()), this.register(new xi()), this.register(new wi()), this.register(new yi()), this.register(new bi()), this.defaultRenderer = new ie(), this.performanceMonitor = vi();
  }
  setLocale(t) {
    this.locale = t;
  }
  /**
   * Enable or disable performance monitoring
   */
  setPerformanceMonitoring(t) {
    this.performanceMonitor.setEnabled(t);
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
  register(t) {
    this.renderers.set(t.type, t);
  }
  /**
   * Get a renderer by cell type
   */
  get(t) {
    return this.renderers.get(t);
  }
  /**
   * Check if a renderer exists for a type
   */
  has(t) {
    return this.renderers.has(t);
  }
  /**
   * Render a cell using the appropriate renderer
   */
  render(t) {
    const e = t.column.type ?? "text", i = this.renderers.get(e) ?? this.defaultRenderer;
    return this.performanceMonitor.measure(e, () => i.render(t));
  }
  /**
   * Create a render context
   */
  createContext(t) {
    return { ...t, locale: t.locale ?? this.locale };
  }
}
function fs(x, t, ...e) {
  const i = Si(e);
  if (typeof x == "function") {
    const s = { ...t, children: i };
    return x(s);
  }
  return {
    type: x,
    props: t || {},
    children: i
  };
}
function Si(x) {
  return x.filter((t) => t != null && t !== !1).map((t) => typeof t == "string" ? { type: "CTText", props: { text: t }, children: [] } : typeof t == "number" ? { type: "CTText", props: { text: String(t) }, children: [] } : t);
}
class Ei {
  constructor(t) {
    b(this, "measurementEngine");
    b(this, "layoutResults", []);
    /** 当前根元素的父容器尺寸（通常是单元格尺寸），用于解析根元素百分比 */
    b(this, "rootParentSize");
    this.measurementEngine = t;
  }
  /**
   * 计算元素树布局，返回所有元素的绝对坐标
   * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
   */
  layout(t, e, i, s) {
    return this.layoutResults = [], this.rootParentSize = s, this.layoutElement(t, e, i, s), this.rootParentSize = void 0, this.layoutResults.sort((o, n) => (o.zIndex ?? 0) - (n.zIndex ?? 0));
  }
  /**
   * 计算元素树布局，返回树形结构（用于渲染时直接定位子元素）
   * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
   */
  layoutTree(t, e, i, s) {
    this.rootParentSize = s;
    const o = this.layoutNode(t, e, i, s);
    return this.rootParentSize = void 0, o;
  }
  /** 解析尺寸值（支持百分比字符串和数字） */
  resolveSize(t, e) {
    if (t !== void 0) {
      if (typeof t == "number") return t;
      if (typeof t == "string" && t.endsWith("%")) {
        if (e === void 0) return;
        const i = parseFloat(t);
        return isNaN(i) ? void 0 : e * i / 100;
      }
    }
  }
  layoutNode(t, e, i, s) {
    if (t.type === "CTBox" && t.props.display === "flex")
      return this.layoutGroupNode(t, e, i, s);
    if (t.type === "CTBox" && t.props.position === "relative")
      return this.layoutPositionedGroupNode(t, e, i, s);
    const o = this.measurementEngine.measureElement(t), n = this.clampSize(o, t.props, s), r = t.props.zIndex, a = this.parseMargin(t.props.margin);
    return {
      element: t,
      x: e,
      y: i,
      width: n.width,
      height: n.height,
      zIndex: r,
      margin: a,
      children: []
    };
  }
  layoutElement(t, e, i, s) {
    if (t.type === "CTBox" && t.props.display === "flex")
      return this.layoutGroup(t, e, i, s);
    if (t.type === "CTBox" && t.props.position === "relative")
      return this.layoutPositionedGroup(t, e, i, s);
    const o = this.measurementEngine.measureElement(t), n = this.clampSize(o, t.props, s), r = t.props.zIndex, a = this.parseMargin(t.props.margin), l = { x: e, y: i, width: n.width, height: n.height, zIndex: r, margin: a };
    return this.layoutResults.push(l), l;
  }
  /**
   * 解析容器自身尺寸：优先使用 width/height（支持百分比），否则用 fallback（内容尺寸）
   * 根元素（即 parentSize 来自外部传入时）默认撑满父容器
   */
  resolveContainerSize(t, e, i, s, o) {
    const n = e == null ? void 0 : e.width, r = e == null ? void 0 : e.height;
    let a = this.resolveSize(t.width, n), l = this.resolveSize(t.height, r);
    a === void 0 && (a = o && n !== void 0 ? n : i), l === void 0 && (l = o && r !== void 0 ? r : s);
    const h = this.resolveSize(t.minWidth, n), c = this.resolveSize(t.maxWidth, n), d = this.resolveSize(t.minHeight, r), u = this.resolveSize(t.maxHeight, r);
    return {
      width: this.clampValue(a, h, c),
      height: this.clampValue(l, d, u)
    };
  }
  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  layoutPositionedGroup(t, e, i, s) {
    const o = t.props, n = t.children || [], r = s !== void 0 && s === this.rootParentSize, { width: a, height: l } = this.resolveContainerSize(
      o,
      s,
      100,
      100,
      r
    ), h = [...n].sort((u, f) => {
      const g = u.props.zIndex ?? 0, m = f.props.zIndex ?? 0;
      return g - m;
    }), c = { width: a, height: l };
    for (const u of h) {
      const f = e + (u.props.x ?? 0), g = i + (u.props.y ?? 0);
      this.layoutElement(u, f, g, c);
    }
    const d = { x: e, y: i, width: a, height: l };
    return this.layoutResults.push(d), d;
  }
  layoutPositionedGroupNode(t, e, i, s) {
    const o = t.props, n = t.children || [], r = s !== void 0 && s === this.rootParentSize, { width: a, height: l } = this.resolveContainerSize(
      o,
      s,
      100,
      100,
      r
    ), h = [...n].sort((u, f) => {
      const g = u.props.zIndex ?? 0, m = f.props.zIndex ?? 0;
      return g - m;
    }), c = { width: a, height: l }, d = h.map((u) => {
      const f = e + (u.props.x ?? 0), g = i + (u.props.y ?? 0);
      return this.layoutNode(u, f, g, c);
    });
    return {
      element: t,
      x: e,
      y: i,
      width: a,
      height: l,
      children: d
    };
  }
  layoutGroup(t, e, i, s) {
    const o = t.props, n = t.children || [], r = s !== void 0 && s === this.rootParentSize, a = this.parsePadding(o.padding), l = o.width !== void 0 || r && (s == null ? void 0 : s.width) !== void 0, h = o.height !== void 0 || r && (s == null ? void 0 : s.height) !== void 0;
    let c, d;
    if (l && h) {
      const y = this.resolveContainerSize(o, s, 0, 0, r);
      c = y.width, d = y.height;
    } else {
      const y = n.map((M) => this.measureChildSize(M)), w = this.calculateContentSize(y, o), C = this.calculateContentHeight(y, o), R = w + a.left + a.right, v = C + a.top + a.bottom, I = this.resolveContainerSize(o, s, R, v, r);
      c = I.width, d = I.height;
    }
    const u = {
      width: c - a.left - a.right,
      height: d - a.top - a.bottom
    }, f = n.map(
      (y) => this.measureChildSize(y, u)
    ), g = e + a.left, m = i + a.top;
    this.layoutChildren(
      n,
      f,
      g,
      m,
      o,
      c,
      d,
      u
    );
    const p = { x: e, y: i, width: c, height: d };
    return this.layoutResults.push(p), p;
  }
  layoutGroupNode(t, e, i, s) {
    const o = t.props, n = t.children || [], r = s !== void 0 && s === this.rootParentSize, a = this.parsePadding(o.padding), l = o.width !== void 0 || r && (s == null ? void 0 : s.width) !== void 0, h = o.height !== void 0 || r && (s == null ? void 0 : s.height) !== void 0;
    let c, d;
    if (l && h) {
      const D = this.resolveContainerSize(o, s, 0, 0, r);
      c = D.width, d = D.height;
    } else {
      const D = n.map((W) => this.measureChildSize(W)), k = this.calculateContentSize(D, o), P = this.calculateContentHeight(D, o), B = k + a.left + a.right, L = P + a.top + a.bottom, A = this.resolveContainerSize(o, s, B, L, r);
      c = A.width, d = A.height;
    }
    const u = {
      width: c - a.left - a.right,
      height: d - a.top - a.bottom
    }, f = n.map(
      (D) => this.measureChildSize(D, u)
    ), g = e + a.left, m = i + a.top, p = o.flexDirection ?? "row", y = o.justifyContent ?? "flex-start", w = o.alignItems ?? "flex-start";
    let C = o.gap ?? 0;
    const R = u.width, v = u.height, I = this.calculateContentSize(f, o), M = this.calculateContentHeight(f, o);
    let S = 0;
    if (p === "row" || p === "row-reverse") {
      if (S = this.calcMainOffset(
        R,
        I,
        y,
        f,
        n.length,
        C
      ), y === "space-between" && n.length > 1) {
        const D = f.reduce((k, P) => k + P.width, 0);
        C = (R - D) / (n.length - 1);
      } else if (y === "space-around" && n.length > 0) {
        const D = f.reduce((P, B) => P + B.width, 0), k = (R - D) / n.length;
        S = k / 2, C = k;
      } else if (y === "space-evenly" && n.length > 0) {
        const D = f.reduce((P, B) => P + B.width, 0), k = (R - D) / (n.length + 1);
        S = k, C = k;
      }
    } else if (S = this.calcMainOffset(
      v,
      M,
      y,
      f,
      n.length,
      C
    ), y === "space-between" && n.length > 1) {
      const D = f.reduce((k, P) => k + P.height, 0);
      C = (v - D) / (n.length - 1);
    } else if (y === "space-around" && n.length > 0) {
      const D = f.reduce((P, B) => P + B.height, 0), k = (v - D) / n.length;
      S = k / 2, C = k;
    } else if (y === "space-evenly" && n.length > 0) {
      const D = f.reduce((P, B) => P + B.height, 0), k = (v - D) / (n.length + 1);
      S = k, C = k;
    }
    let T = S;
    const H = [];
    for (let D = 0; D < n.length; D++) {
      const k = n[D], P = f[D], B = P.margin ?? { top: 0, right: 0, bottom: 0, left: 0 }, L = P.width - B.left - B.right, A = P.height - B.top - B.bottom, W = k.props.alignSelf ?? w;
      let _ = 0;
      p === "row" || p === "row-reverse" ? _ = this.calcCrossOffset(v, A, W) : _ = this.calcCrossOffset(R, L, W);
      let F, V;
      p === "row" ? (F = g + T + B.left, V = m + _ + B.top) : p === "row-reverse" ? (F = g + R - T - P.width + B.left, V = m + _ + B.top) : p === "column" ? (F = g + _ + B.left, V = m + T + B.top) : (F = g + _ + B.left, V = m + v - T - P.height + B.top), H.push(this.layoutNode(k, F, V, u)), T += (p === "row" || p === "row-reverse" ? P.width : P.height) + C;
    }
    return {
      element: t,
      x: e,
      y: i,
      width: c,
      height: d,
      children: H
    };
  }
  /**
   * 测量子元素尺寸（包含 margin），用于 flex 布局计算
   * @param parentSize 父容器内容区尺寸，用于解析子元素的百分比 width/height
   */
  measureChildSize(t, e) {
    const i = this.parseMargin(t.props.margin);
    if (t.type === "CTBox" && t.props.display === "flex") {
      const n = this.measureGroupSize(t, e);
      return {
        x: 0,
        y: 0,
        width: n.width + i.left + i.right,
        height: n.height + i.top + i.bottom,
        margin: i
      };
    }
    if (t.type === "CTBox" && t.props.position === "relative") {
      const n = t.props, r = e == null ? void 0 : e.width, a = e == null ? void 0 : e.height, l = this.resolveSize(n.width, r) ?? 100, h = this.resolveSize(n.height, a) ?? 100, c = this.resolveSize(n.minWidth, r), d = this.resolveSize(n.maxWidth, r), u = this.resolveSize(n.minHeight, a), f = this.resolveSize(n.maxHeight, a);
      return {
        x: 0,
        y: 0,
        width: this.clampValue(l, c, d) + i.left + i.right,
        height: this.clampValue(h, u, f) + i.top + i.bottom,
        margin: i
      };
    }
    const s = this.measurementEngine.measureElement(t), o = this.clampSize(s, t.props, e);
    return {
      x: 0,
      y: 0,
      width: o.width + i.left + i.right,
      height: o.height + i.top + i.bottom,
      margin: i
    };
  }
  /**
   * 测量 group 尺寸，不影响 layoutResults
   */
  measureGroupSize(t, e) {
    const i = t.props, s = t.children || [], o = this.parsePadding(i.padding), n = e == null ? void 0 : e.width, r = e == null ? void 0 : e.height, a = this.resolveSize(i.width, n), l = this.resolveSize(i.height, r);
    let h, c;
    if (a !== void 0 && l !== void 0)
      h = a, c = l;
    else {
      const m = s.map((w) => this.measureChildSize(w)), p = this.calculateContentSize(m, i), y = this.calculateContentHeight(m, i);
      h = a ?? p + o.left + o.right, c = l ?? y + o.top + o.bottom;
    }
    const d = this.resolveSize(i.minWidth, n), u = this.resolveSize(i.maxWidth, n), f = this.resolveSize(i.minHeight, r), g = this.resolveSize(i.maxHeight, r);
    return {
      x: 0,
      y: 0,
      width: this.clampValue(h, d, u),
      height: this.clampValue(c, f, g)
    };
  }
  // ─── Helpers ───
  parsePadding(t) {
    return t === void 0 ? { top: 0, right: 0, bottom: 0, left: 0 } : typeof t == "number" ? { top: t, right: t, bottom: t, left: t } : {
      top: t.top ?? 0,
      right: t.right ?? 0,
      bottom: t.bottom ?? 0,
      left: t.left ?? 0
    };
  }
  parseMargin(t) {
    return t === void 0 ? { top: 0, right: 0, bottom: 0, left: 0 } : typeof t == "number" ? { top: t, right: t, bottom: t, left: t } : {
      top: t.top ?? 0,
      right: t.right ?? 0,
      bottom: t.bottom ?? 0,
      left: t.left ?? 0
    };
  }
  clampValue(t, e, i) {
    return e !== void 0 && (t = Math.max(e, t)), i !== void 0 && (t = Math.min(i, t)), t;
  }
  clampSize(t, e, i) {
    const s = i == null ? void 0 : i.width, o = i == null ? void 0 : i.height, n = this.resolveSize(e.minWidth, s), r = this.resolveSize(e.maxWidth, s), a = this.resolveSize(e.minHeight, o), l = this.resolveSize(e.maxHeight, o);
    return {
      x: t.x,
      y: t.y,
      width: this.clampValue(t.width, n, r),
      height: this.clampValue(t.height, a, l)
    };
  }
  calcMainOffset(t, e, i, s, o, n) {
    if (i === "center") return (t - e) / 2;
    if (i === "flex-end") return t - e;
    if (i === "space-between" && o > 1)
      return 0;
    if (i === "space-around" && o > 0) {
      const r = s.reduce((l, h) => l + h.width, 0);
      return (t - r) / o / 2;
    }
    if (i === "space-evenly" && o > 0) {
      const r = s.reduce((l, h) => l + h.width, 0);
      return (t - r) / (o + 1);
    }
    return 0;
  }
  calcCrossOffset(t, e, i) {
    return i === "center" ? (t - e) / 2 : i === "flex-end" ? t - e : 0;
  }
  calculateContentSize(t, e) {
    const i = e.gap ?? 0, s = e.flexDirection ?? "row";
    if (s === "row" || s === "row-reverse") {
      const o = t.reduce((r, a) => r + a.width, 0), n = t.length > 1 ? (t.length - 1) * i : 0;
      return o + n;
    } else
      return Math.max(...t.map((o) => o.width), 0);
  }
  calculateContentHeight(t, e) {
    const i = e.gap ?? 0, s = e.flexDirection ?? "row";
    if (s === "column" || s === "column-reverse") {
      const o = t.reduce((r, a) => r + a.height, 0), n = t.length > 1 ? (t.length - 1) * i : 0;
      return o + n;
    } else
      return Math.max(...t.map((o) => o.height), 0);
  }
  layoutChildren(t, e, i, s, o, n, r, a) {
    const l = o.flexDirection ?? "row", h = o.justifyContent ?? "flex-start", c = o.alignItems ?? "flex-start";
    let d = o.gap ?? 0;
    const u = this.calculateContentSize(e, o), f = this.calculateContentHeight(e, o), g = a.width, m = a.height;
    let p = 0;
    if (l === "row" || l === "row-reverse") {
      if (p = this.calcMainOffset(
        g,
        u,
        h,
        e,
        t.length,
        d
      ), h === "space-between" && t.length > 1) {
        const w = e.reduce((C, R) => C + R.width, 0);
        d = (g - w) / (t.length - 1);
      }
      if (h === "space-around" && t.length > 0) {
        const w = e.reduce((R, v) => R + v.width, 0), C = (g - w) / t.length;
        p = C / 2, d = C;
      }
      if (h === "space-evenly" && t.length > 0) {
        const w = e.reduce((R, v) => R + v.width, 0), C = (g - w) / (t.length + 1);
        p = C, d = C;
      }
    } else {
      if (p = this.calcMainOffset(
        m,
        f,
        h,
        e,
        t.length,
        d
      ), h === "space-between" && t.length > 1) {
        const w = e.reduce((C, R) => C + R.height, 0);
        d = (m - w) / (t.length - 1);
      }
      if (h === "space-around" && t.length > 0) {
        const w = e.reduce((R, v) => R + v.height, 0), C = (m - w) / t.length;
        p = C / 2, d = C;
      }
      if (h === "space-evenly" && t.length > 0) {
        const w = e.reduce((R, v) => R + v.height, 0), C = (m - w) / (t.length + 1);
        p = C, d = C;
      }
    }
    let y = p;
    for (let w = 0; w < t.length; w++) {
      const C = t[w], R = e[w], v = R.margin ?? { top: 0, right: 0, bottom: 0, left: 0 }, I = R.width - v.left - v.right, M = R.height - v.top - v.bottom, S = C.props.alignSelf ?? c;
      let T = 0;
      l === "row" || l === "row-reverse" ? T = this.calcCrossOffset(m, M, S) : T = this.calcCrossOffset(g, I, S);
      let H, D;
      l === "row" ? (H = i + y + v.left, D = s + T + v.top) : l === "row-reverse" ? (H = i + g - y - R.width + v.left, D = s + T + v.top) : l === "column" ? (H = i + T + v.left, D = s + y + v.top) : (H = i + T + v.left, D = s + m - y - R.height + v.top), this.layoutElement(C, H, D, a), y += (l === "row" || l === "row-reverse" ? R.width : R.height) + d;
    }
  }
}
class Mi {
  constructor(t) {
    b(this, "ctx");
    this.ctx = t;
  }
  measureTextWidth(t, e, i, s, o) {
    return this.ctx.font = `${o ?? "normal"} ${s ?? "normal"} ${e}px ${i}`, this.ctx.measureText(t).width;
  }
  measureElement(t) {
    switch (t.type) {
      case "CTText":
        return this.measureText(t);
      case "CTBox":
        return this.measureBox(t);
      case "CTCircle":
        return this.measureCircle(t);
      case "CTImage":
        return this.measureImage(t);
      case "CTLine":
        return this.measureLine(t);
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }
  measureText(t) {
    const e = t.props, i = e.fontSize ?? 14, s = e.fontFamily ?? "Arial", o = e.lineHeight ?? i, n = e.fontWeight ?? "normal", r = e.fontStyle ?? "normal", a = e.letterSpacing ?? 0;
    let l = this.measureTextWidth(e.text, i, s, n, r);
    return a > 0 && e.text.length > 1 && (l += a * (e.text.length - 1)), e.maxWidth && l > e.maxWidth && (l = e.maxWidth), { x: 0, y: 0, width: l, height: o };
  }
  measureBox(t) {
    const e = t.props;
    return { x: 0, y: 0, width: e.width ?? 0, height: e.height ?? 0 };
  }
  measureCircle(t) {
    const i = t.props.radius * 2;
    return { x: 0, y: 0, width: i, height: i };
  }
  measureImage(t) {
    const e = t.props;
    return { x: 0, y: 0, width: e.width, height: e.height };
  }
  measureLine(t) {
    const e = t.props;
    if (e.points.length === 0)
      return { x: 0, y: 0, width: 0, height: 0 };
    const i = e.points.map((l) => l.x), s = e.points.map((l) => l.y), o = Math.min(...i), n = Math.max(...i), r = Math.min(...s), a = Math.max(...s);
    return { x: o, y: r, width: n - o, height: a - r };
  }
}
class Ti {
  constructor(t, e, i) {
    b(this, "ctx");
    b(this, "layoutEngine");
    b(this, "theme");
    b(this, "layouts", []);
    this.ctx = t, this.layoutEngine = e, this.theme = i;
  }
  render(t, e, i, s) {
    const o = this.layoutEngine.layoutTree(t, e, i, s);
    this.layouts = this.flattenLayoutTree(o), this.ctx.save();
    try {
      this.renderLayoutNode(o);
    } finally {
      this.ctx.restore();
    }
  }
  getLayouts() {
    return this.layouts;
  }
  flattenLayoutTree(t) {
    const e = [
      {
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        zIndex: t.zIndex,
        margin: t.margin
      }
    ];
    for (const i of t.children)
      e.push(...this.flattenLayoutTree(i));
    return e;
  }
  renderLayoutNode(t) {
    switch (t.element.type) {
      case "CTBox":
        this.renderBoxNode(t);
        break;
      case "CTCircle":
        this.renderCircle(t.element, t.x, t.y);
        break;
      case "CTText":
        this.renderText(t.element, t.x, t.y, t.width);
        break;
      case "CTImage":
        this.renderImage(t.element, t.x, t.y);
        break;
      case "CTLine":
        this.renderLine(t.element, t.x, t.y);
        break;
    }
  }
  getBorderRadiusArray(t, e) {
    const i = t.borderTopLeftRadius ?? e, s = t.borderTopRightRadius ?? e, o = t.borderBottomRightRadius ?? e, n = t.borderBottomLeftRadius ?? e;
    return i === s && s === o && o === n ? i : [i, s, o, n];
  }
  drawRoundedRect(t, e, i, s, o) {
    this.ctx.beginPath(), typeof o == "number" && o === 0 ? this.ctx.rect(t, e, i, s) : this.ctx.roundRect(t, e, i, s, o);
  }
  createGradientFill(t, e, i, s, o) {
    if (o.type === "linear") {
      const r = (o.angle - 90) * Math.PI / 180, a = t + i / 2, l = e + s / 2, h = Math.max(i, s), c = a - Math.cos(r) * h / 2, d = l - Math.sin(r) * h / 2, u = a + Math.cos(r) * h / 2, f = l + Math.sin(r) * h / 2, g = this.ctx.createLinearGradient(c, d, u, f);
      return o.colors.forEach((m, p) => {
        g.addColorStop(p / (o.colors.length - 1), m);
      }), g;
    } else {
      const n = t + i / 2, r = e + s / 2, a = Math.max(i, s) / 2, l = this.ctx.createRadialGradient(n, r, 0, n, r, a);
      return o.colors.forEach((h, c) => {
        l.addColorStop(c / (o.colors.length - 1), h);
      }), l;
    }
  }
  normalizeBorderSide(t) {
    if (t) {
      if (typeof t == "string") return { width: 1, color: t };
      if (t.width || t.color) return { width: t.width ?? 1, color: t.color ?? "#000" };
    }
  }
  renderBoxNode(t) {
    const e = t.element, i = t.x, s = t.y, o = e.props, n = t.width, r = t.height, a = o.borderRadius ?? 0, l = this.getBorderRadiusArray(o, a), h = o.opacity !== void 0;
    h && (this.ctx.save(), this.ctx.globalAlpha = o.opacity);
    try {
      const c = !!o.boxShadow;
      if (c) {
        const p = this.normalizeShadow(o.boxShadow);
        this.ctx.save(), this.ctx.shadowColor = p.color, this.ctx.shadowBlur = p.blur, this.ctx.shadowOffsetX = p.offsetX, this.ctx.shadowOffsetY = p.offsetY, o.backgroundColor || o.backgroundGradient || (this.drawRoundedRect(
          i + (p.spread ?? 0),
          s + (p.spread ?? 0),
          n + (p.spread ?? 0) * 2,
          r + (p.spread ?? 0) * 2,
          l
        ), this.ctx.fillStyle = p.color, this.ctx.fill());
      }
      try {
        o.backgroundGradient ? (this.ctx.fillStyle = this.createGradientFill(
          i,
          s,
          n,
          r,
          o.backgroundGradient
        ), this.drawRoundedRect(i, s, n, r, l), this.ctx.fill()) : o.backgroundColor && (this.ctx.fillStyle = o.backgroundColor, this.drawRoundedRect(i, s, n, r, l), this.ctx.fill());
      } finally {
        c && this.ctx.restore();
      }
      o.borderColor && o.borderWidth && (this.ctx.strokeStyle = o.borderColor, this.ctx.lineWidth = o.borderWidth, this.drawRoundedRect(i, s, n, r, l), this.ctx.stroke());
      const d = this.normalizeBorderSide(o.borderTop), u = this.normalizeBorderSide(o.borderRight), f = this.normalizeBorderSide(o.borderBottom), g = this.normalizeBorderSide(o.borderLeft);
      (d || u || f || g) && (d && (this.ctx.strokeStyle = d.color, this.ctx.lineWidth = d.width, this.ctx.beginPath(), this.ctx.moveTo(i, s), this.ctx.lineTo(i + n, s), this.ctx.stroke()), f && (this.ctx.strokeStyle = f.color, this.ctx.lineWidth = f.width, this.ctx.beginPath(), this.ctx.moveTo(i, s + r), this.ctx.lineTo(i + n, s + r), this.ctx.stroke()), g && (this.ctx.strokeStyle = g.color, this.ctx.lineWidth = g.width, this.ctx.beginPath(), this.ctx.moveTo(i, s), this.ctx.lineTo(i, s + r), this.ctx.stroke()), u && (this.ctx.strokeStyle = u.color, this.ctx.lineWidth = u.width, this.ctx.beginPath(), this.ctx.moveTo(i + n, s), this.ctx.lineTo(i + n, s + r), this.ctx.stroke()));
      const m = o.overflow === "hidden" || o.overflow === "clip";
      m && (this.ctx.save(), this.drawRoundedRect(i, s, n, r, l), this.ctx.clip());
      try {
        for (const p of t.children)
          this.renderLayoutNode(p);
      } finally {
        m && this.ctx.restore();
      }
    } finally {
      h && this.ctx.restore();
    }
  }
  normalizeShadow(t) {
    if (typeof t == "string") {
      const e = t.trim().split(/\s+/), i = Number(e[0]) || 0, s = Number(e[1]) || 0, o = Number(e[2]) || 0, n = e.filter((l) => !isNaN(Number(l))), r = n.length > 3 ? Number(e[3]) : 0, a = e.slice(n.length > 3 ? 4 : 3).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX: i, offsetY: s, blur: o, spread: r, color: a };
    }
    return t;
  }
  renderCircle(t, e, i) {
    const s = t.props, o = e + s.radius, n = i + s.radius, r = s.startAngle ?? 0, a = s.endAngle ?? Math.PI * 2;
    this.ctx.beginPath(), this.ctx.arc(o, n, s.radius, r, a, !1), s.backgroundColor && (this.ctx.fillStyle = s.backgroundColor, this.ctx.fill()), s.borderColor && s.borderWidth && (this.ctx.strokeStyle = s.borderColor, this.ctx.lineWidth = s.borderWidth, this.ctx.stroke());
  }
  renderText(t, e, i, s) {
    const o = t.props, n = o.fontSize ?? this.theme.font.size, r = o.fontFamily ?? this.theme.font.family, a = o.fontWeight ?? "normal", l = o.fontStyle ?? "normal", h = o.color ?? this.theme.colors.cellText, c = o.lineHeight ?? n, d = o.textAlign ?? "left", u = o.textDecoration ?? "none", f = o.letterSpacing ?? 0;
    this.ctx.font = `${l} ${a} ${n}px ${r}`, this.ctx.fillStyle = h;
    let g = e;
    d === "center" ? (g = e + s / 2, this.ctx.textAlign = "center") : d === "right" ? (g = e + s, this.ctx.textAlign = "right") : this.ctx.textAlign = "left", this.ctx.textBaseline = "middle";
    const m = i + c / 2;
    if (f > 0) {
      this.ctx.textAlign = "left";
      let p = d === "center" ? e + (s - this.getTextWidthWithSpacing(
        o.text,
        n,
        r,
        a,
        l,
        f
      )) / 2 : d === "right" ? e + s - this.getTextWidthWithSpacing(
        o.text,
        n,
        r,
        a,
        l,
        f
      ) : e;
      for (let y = 0; y < o.text.length; y++) {
        const w = o.text[y];
        o.maxWidth ? this.ctx.fillText(w, p, m, o.maxWidth) : this.ctx.fillText(w, p, m);
        const C = this.measureCharWidth(w, n, r, a, l);
        p += C + f;
      }
    } else
      o.maxWidth ? this.ctx.fillText(o.text, g, m, o.maxWidth) : this.ctx.fillText(o.text, g, m);
    if (u === "underline") {
      const p = f > 0 ? this.getTextWidthWithSpacing(
        o.text,
        n,
        r,
        a,
        l,
        f
      ) : this.ctx.measureText(o.text).width, y = m + n / 2 + 1, w = d === "center" ? g - p / 2 : d === "right" ? g - p : g;
      this.ctx.strokeStyle = h, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(w, y), this.ctx.lineTo(w + p, y), this.ctx.stroke();
    } else if (u === "line-through") {
      const p = f > 0 ? this.getTextWidthWithSpacing(
        o.text,
        n,
        r,
        a,
        l,
        f
      ) : this.ctx.measureText(o.text).width, y = m, w = d === "center" ? g - p / 2 : d === "right" ? g - p : g;
      this.ctx.strokeStyle = h, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(w, y), this.ctx.lineTo(w + p, y), this.ctx.stroke();
    }
    this.ctx.textAlign = "left", this.ctx.textBaseline = "alphabetic";
  }
  measureCharWidth(t, e, i, s, o) {
    return this.ctx.font = `${o} ${s} ${e}px ${i}`, this.ctx.measureText(t).width;
  }
  getTextWidthWithSpacing(t, e, i, s, o, n) {
    this.ctx.font = `${o} ${s} ${e}px ${i}`;
    let r = 0;
    for (let a = 0; a < t.length; a++)
      r += this.ctx.measureText(t[a]).width, a < t.length - 1 && (r += n);
    return r;
  }
  renderImage(t, e, i) {
    const s = t.props;
    this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(e, i, s.width, s.height);
  }
  renderLine(t, e, i) {
    const s = t.props;
    if (!(s.points.length < 2)) {
      this.ctx.beginPath(), this.ctx.strokeStyle = s.strokeColor ?? "#333333", this.ctx.lineWidth = s.strokeWidth ?? 1, this.ctx.lineCap = s.strokeLinecap ?? "butt", this.ctx.moveTo(e + s.points[0].x, i + s.points[0].y);
      for (let o = 1; o < s.points.length; o++)
        this.ctx.lineTo(e + s.points[o].x, i + s.points[o].y);
      this.ctx.stroke();
    }
  }
}
function Di(x) {
  return x ? typeof x == "string" ? { borderWidth: 1, borderColor: x } : {
    borderWidth: x.width,
    borderColor: x.color
  } : {};
}
function Ct(x) {
  if (x)
    return typeof x == "string" ? { width: 1, color: x } : x;
}
function Hi(x) {
  if (x) {
    if (typeof x == "string") {
      const t = x.trim().split(/\s+/), e = Number(t[0]) || 0, i = Number(t[1]) || 0, s = Number(t[2]) || 0, o = Number(t[3]) || 0, n = t.length > 5 || t[3] && !isNaN(Number(t[3])) ? 4 : 3, r = t.slice(n).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX: e, offsetY: i, blur: s, spread: o, color: r };
    }
    return x;
  }
}
function ki(x) {
  const t = Di(x.border), e = Ct(x.borderTop), i = Ct(x.borderRight), s = Ct(x.borderBottom), o = Ct(x.borderLeft), n = Hi(x.shadow ?? x.boxShadow);
  return {
    id: x.id,
    styles: x.styles,
    display: x.position === "relative" ? void 0 : "flex",
    position: x.position,
    x: x.x,
    y: x.y,
    zIndex: x.zIndex,
    width: x.width,
    height: x.height,
    minWidth: x.minW ?? x.minWidth,
    maxWidth: x.maxW ?? x.maxWidth,
    minHeight: x.minH ?? x.minHeight,
    maxHeight: x.maxH ?? x.maxHeight,
    padding: x.padding,
    margin: x.mg ?? x.margin,
    gap: x.gap,
    flexDirection: x.direction ?? x.flexDirection ?? "row",
    justifyContent: x.justify ?? x.justifyContent,
    alignItems: x.align ?? x.alignItems,
    alignSelf: x.selfAlign ?? x.alignSelf,
    backgroundColor: x.bgColor ?? x.backgroundColor,
    backgroundGradient: x.gradient ?? x.backgroundGradient,
    borderRadius: x.radius ?? x.borderRadius,
    borderTopLeftRadius: x.borderTLR ?? x.borderTopLeftRadius,
    borderTopRightRadius: x.borderTRR ?? x.borderTopRightRadius,
    borderBottomLeftRadius: x.borderBLR ?? x.borderBottomLeftRadius,
    borderBottomRightRadius: x.borderBRR ?? x.borderBottomRightRadius,
    borderWidth: x.borderWidth ?? t.borderWidth,
    borderColor: x.borderColor ?? t.borderColor,
    borderTop: e,
    borderRight: i,
    borderBottom: s,
    borderLeft: o,
    opacity: x.opacity,
    overflow: x.clip ? "hidden" : x.overflow,
    boxShadow: n
  };
}
function Oi(x) {
  return x.text !== void 0 ? x.text : (x.children ?? []).map((t) => String(t.props.text ?? "")).join("");
}
function Ft(x) {
  return {
    type: "CTBox",
    props: ki(x),
    children: x.children ?? []
  };
}
function gs(x) {
  return Ft({ ...x, direction: "row" });
}
function ms(x) {
  return Ft({ ...x, direction: "column" });
}
const ps = Ft;
function xs(x) {
  const { children: t, text: e, ...i } = x;
  return {
    type: "CTText",
    props: {
      ...i,
      text: Oi(x)
    },
    children: []
  };
}
function ws(x) {
  const { children: t, bgColor: e, ...i } = x;
  return {
    type: "CTCircle",
    props: {
      ...i,
      backgroundColor: e ?? i.backgroundColor
    },
    children: []
  };
}
function ys(x) {
  const { children: t, ...e } = x;
  return {
    type: "CTImage",
    props: e,
    children: []
  };
}
function Cs(x) {
  const { children: t, ...e } = x;
  return {
    type: "CTLine",
    props: e,
    children: []
  };
}
const Pi = 32;
class Bi {
  constructor(t, e, i, s = nt) {
    b(this, "canvas");
    b(this, "ctx");
    b(this, "theme");
    b(this, "layoutManager");
    b(this, "locale");
    b(this, "dpr");
    b(this, "offscreenCanvas");
    b(this, "offscreenCtx");
    b(this, "cellRendererRegistry");
    b(this, "dropdownRenderer");
    b(this, "filterDropdownRenderer");
    b(this, "imageOverlayRenderer");
    b(this, "overlayRenderer");
    b(this, "dirtyRegions", []);
    b(this, "watermarkConfig", null);
    b(this, "expandColumnKey", null);
    b(this, "currentSwitchAnimations");
    b(this, "currentButtonHoverStates");
    b(this, "hoveredPlaceholderColumnIndex", -1);
    b(this, "isDestroyed", !1);
    // 多选列分隔符
    b(this, "multipleSelectSeparator", ", ");
    // 图片加载队列（延迟加载 + 请求取消）
    b(this, "imageLoadQueue");
    /** 当前帧收集的可见图片 URL */
    b(this, "frameVisibleUrls", /* @__PURE__ */ new Set());
    // 文本宽度缓存（用于按钮等需要测量文本宽度的场景）
    b(this, "textWidthCache", /* @__PURE__ */ new Map());
    b(this, "textWidthCacheKey", "");
    // 性能监控
    b(this, "performanceEnabled", !1);
    b(this, "performanceStats", /* @__PURE__ */ new Map());
    b(this, "frameStartTime", 0);
    b(this, "frameCount", 0);
    b(this, "lastReportTime", 0);
    // 当前帧统计
    b(this, "currentFrameStats", /* @__PURE__ */ new Map());
    // 上一帧统计（用于报告）
    b(this, "lastFrameStats", /* @__PURE__ */ new Map());
    // 懒加载相关
    b(this, "currentVisibleRange", null);
    b(this, "currentRows", []);
    b(this, "currentScrollTop", 0);
    b(this, "rowHeight", 0);
    b(this, "currentHoveredCell", null);
    b(this, "currentHoveredImageIndex", -1);
    b(this, "currentHoveredButtonIndex", -1);
    b(this, "currentProgressDragState");
    b(this, "currentRowResizeState");
    b(this, "currentValidationErrors", /* @__PURE__ */ new Map());
    b(this, "currentPendingValidations", /* @__PURE__ */ new Set());
    // 渲染缓存相关
    b(this, "renderCache", null);
    b(this, "rowIdManager", new Ke());
    b(this, "columnIdManager", new je());
    // 图片加载完成后的渲染触发回调
    b(this, "onImageLoaded", null);
    this.canvas = t, this.ctx = this.getContext(t), this.theme = e, this.layoutManager = i, this.locale = s, this.dpr = bt(), this.offscreenCanvas = document.createElement("canvas"), this.offscreenCtx = this.getContext(this.offscreenCanvas), this.cellRendererRegistry = new Ii(s), this.dropdownRenderer = new ii(
      this.ctx,
      this.theme,
      (o) => this.measureTextWidth(o),
      s
    ), this.filterDropdownRenderer = new si(this.ctx, this.theme, s), this.imageOverlayRenderer = new ri(
      this.ctx,
      this.theme,
      {
        get: (o, n) => this.imageLoadQueue.get(o, n),
        isLoading: (o) => this.imageLoadQueue.isLoading(o),
        load: (o, n) => this.loadImage(o, n),
        collectVisible: (o) => this.collectVisibleImage(o)
      },
      s
    ), this.overlayRenderer = new ai(
      this.canvas,
      this.ctx,
      this.theme,
      this.layoutManager,
      this.dpr,
      s
    ), this.imageLoadQueue = new Zt();
  }
  // 当前字体配置的 key
  // 动态行高支持
  /**
   * 根据单元格高度计算可显示行数
   */
  calculateMaxRows(t, e, i = 8) {
    return Ht(t, e, i);
  }
  /**
   * 多行文本换行
   */
  wrapTextToLines(t, e, i) {
    return kt(this.ctx, t, e, i).lines;
  }
  getContext(t) {
    const e = t.getContext("2d");
    if (!e)
      throw new Error("Failed to get 2D context");
    return e;
  }
  setCanvas(t) {
    this.canvas = t, this.ctx = this.getContext(t), this.dropdownRenderer.setContext(this.ctx), this.filterDropdownRenderer.setContext(this.ctx), this.imageOverlayRenderer.setContext(this.ctx), this.overlayRenderer.setCanvas(this.canvas, this.ctx);
  }
  setTheme(t) {
    this.theme = t, this.dropdownRenderer.setTheme(t), this.filterDropdownRenderer.setTheme(t), this.imageOverlayRenderer.setTheme(t), this.overlayRenderer.setTheme(t);
  }
  setLocale(t) {
    this.locale = t, this.cellRendererRegistry.setLocale(t), this.dropdownRenderer.setLocale(t), this.filterDropdownRenderer.setLocale(t), this.imageOverlayRenderer.setLocale(t), this.overlayRenderer.setLocale(t);
  }
  setMultipleSelectSeparator(t) {
    this.multipleSelectSeparator = t;
  }
  /**
   * 设置图片加载配置
   */
  setImageLoadConfig(t) {
    this.imageLoadQueue = new Zt({
      maxConcurrent: t.maxConcurrent ?? 6,
      maxCacheSize: t.maxCacheSize ?? 200
    });
  }
  setWatermarkConfig(t) {
    this.watermarkConfig = t, this.overlayRenderer.setWatermarkConfig(t);
  }
  setExpandColumnKey(t) {
    this.expandColumnKey = t;
  }
  /**
   * 设置渲染缓存
   */
  setRenderCache(t) {
    this.renderCache = t;
  }
  /**
   * 设置图片加载完成后的渲染触发回调
   */
  setOnImageLoaded(t) {
    this.onImageLoaded = t;
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
  resize(t, e) {
    const i = bt();
    i !== this.dpr && (this.dpr = i, this.overlayRenderer.setDpr(i)), this.canvas.width = t * this.dpr, this.canvas.height = e * this.dpr, this.canvas.style.width = `${t}px`, this.canvas.style.height = `${e}px`, this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), this.offscreenCanvas.width = t * this.dpr, this.offscreenCanvas.height = e * this.dpr, this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  updateTheme(t) {
    this.theme = t, this.dropdownRenderer.setTheme(t), this.filterDropdownRenderer.setTheme(t), this.imageOverlayRenderer.setTheme(t), this.overlayRenderer.setTheme(t);
  }
  markDirty(t, e, i, s) {
    this.dirtyRegions.push({ x: t, y: e, width: i, height: s });
  }
  markFullRedraw() {
  }
  render(t, e, i, s, o, n) {
    var R, v, I;
    this.currentSwitchAnimations = n.switchAnimations, this.currentButtonHoverStates = n.buttonHoverStates, this.currentHoveredCell = n.hoveredCell, this.currentHoveredImageIndex = n.hoveredImageIndex ?? -1, this.currentHoveredButtonIndex = n.hoveredButtonIndex ?? -1, this.currentProgressDragState = n.progressDragState, this.currentRowResizeState = n.rowResizeState, this.currentValidationErrors = n.validationErrors ?? /* @__PURE__ */ new Map(), this.currentPendingValidations = n.pendingValidations ?? /* @__PURE__ */ new Set(), this.beginFrame(), this.currentVisibleRange = i, this.currentRows = e, this.currentScrollTop = o, this.rowHeight = this.theme.row.height;
    const { startRow: r, endRow: a } = i, l = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, l, h);
    const c = this.layoutManager.getLeafColumns(), d = this.layoutManager.getFixedColumnsInfo(t), u = d.leftFixed.columns.length > 0, f = d.rightFixed.columns.length > 0;
    this.hoveredPlaceholderColumnIndex = n.hoveredCell && ((R = c[n.hoveredCell.columnIndex]) != null && R.key.startsWith("__hidden_placeholder__")) ? n.hoveredCell.columnIndex : -1;
    const g = u ? d.leftFixed.width : 0, m = l - (f ? d.rightFixed.width : 0), p = this.layoutManager.getVisibleCenterColumnIndices(), y = [], w = [];
    for (let M = 0; M < c.length; M++) {
      const S = c[M];
      S && (S.fixed === "left" && y.push(M), S.fixed === "right" && w.push(M));
    }
    const C = this.shouldRenderRowBands();
    this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(g, 0, m - g, h), this.ctx.clip(), C ? this.renderRowBands(
      e,
      p,
      [],
      [],
      s,
      o,
      i,
      d,
      n
    ) : this.renderCenterRows(
      c,
      e,
      r,
      a,
      p,
      s,
      o,
      {
        ...n,
        dragColumnIndex: (v = n.columnReorderState) == null ? void 0 : v.dragColumnIndex,
        columnReorderState: n.columnReorderState
      }
    ), this.ctx.restore(), this.renderCenterSelections(n.selectedCells, s, o, p), n.showHeader && this.renderCenterHeader(
      t,
      p,
      o,
      n.sortConfig,
      n.filterConfig,
      s,
      n.hoveredHeaderColumnKey,
      (I = n.columnReorderState) == null ? void 0 : I.dragColumnIndex,
      n.columnReorderState
    ), u && !C && this.renderFixedColumnsContent(
      c,
      e,
      y,
      0,
      o,
      i,
      n
    ), f && !C && this.renderFixedColumnsContent(
      c,
      e,
      w,
      l - d.rightFixed.width,
      o,
      i,
      n
    ), C && (u || f) && this.renderRowBands(
      e,
      [],
      y,
      w,
      s,
      o,
      i,
      d,
      n
    ), this.renderFixedSelections(
      n.selectedCells,
      o,
      y,
      w
    ), n.showHeader && (u && this.renderFixedColumnsHeader(
      c,
      y,
      0,
      n.sortConfig,
      n.filterConfig,
      n.hoveredHeaderColumnKey,
      n.columnReorderState
    ), f && this.renderFixedColumnsHeader(
      c,
      w,
      l - d.rightFixed.width,
      n.sortConfig,
      n.filterConfig,
      n.hoveredHeaderColumnKey,
      n.columnReorderState
    )), this.renderRowResizeGuide(l), n.dropdown && this.renderDropdown(n.dropdown), n.headerContextMenu && this.renderHeaderContextMenu(n.headerContextMenu), n.columnReorderState && this.renderColumnReorderIndicator(n.columnReorderState, e, i, o), this.ctx.restore(), this.commitVisibleImages(), this.dirtyRegions = [];
  }
  shouldRenderRowBands() {
    const t = this.layoutManager.getRowBandsForRender();
    return this.layoutManager.hasPinnedRows() || t.summaryTop.rows.length > 0 || t.summaryBottom.rows.length > 0;
  }
  renderRowBandCells(t, e, i, s, o, n, r, a) {
    var d;
    let l = t.y;
    t.type === "body" && (l -= o);
    const h = t.type === "body" ? n.startRow : 0, c = t.type === "body" ? Math.min(n.endRow, t.rows.length - 1) : t.rows.length - 1;
    for (let u = h; u <= c; u++) {
      const f = t.rows[u];
      if (!f)
        continue;
      const g = this.layoutManager.getRowIndexByRef(f);
      if (g < 0)
        continue;
      const m = this.layoutManager.getRowHeightByIndex(g);
      t.type === "body" && (l = t.y - o + (this.layoutManager.getRowBandOffsetByRef(f) ?? 0));
      const p = this.canvas.height / this.dpr;
      if (l + m < 0 || l > p) {
        l += m;
        continue;
      }
      let y = this.theme.colors.rowBackground;
      r.stripeRows && g % 2 === 1 && (y = this.theme.colors.rowAltBackground), f.selected && (y = this.theme.colors.rowSelectedBackground), ((d = r.hoveredCell) == null ? void 0 : d.rowIndex) === g && (y = this.theme.colors.rowHoverBackground);
      for (const w of i) {
        const C = this.layoutManager.getLeafColumn(w);
        if (!C) continue;
        const R = this.layoutManager.getColumnWidthByIndex(w), v = a !== void 0 ? a + this.layoutManager.getColumnOffset(w) - this.layoutManager.getColumnOffset(i[0]) : this.layoutManager.getColumnOffset(w) - s;
        this.ctx.fillStyle = y, this.ctx.fillRect(v, l, R, m), this.renderCellWithPosition(
          C,
          f,
          g,
          w,
          f.data[$(C)],
          v,
          l,
          R,
          m,
          r
        );
      }
      l += m;
    }
  }
  renderRowBands(t, e, i, s, o, n, r, a, l) {
    const h = this.layoutManager.getRowBandsForRender(), c = [h.pinnedTop, h.pinnedBottom], d = [h.summaryTop, h.summaryBottom];
    this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(
      0,
      h.body.y,
      this.canvas.width / this.dpr,
      this.layoutManager.getBodyViewportHeight()
    ), this.ctx.clip(), this.renderRowBandCells(
      h.body,
      t,
      e,
      o,
      n,
      r,
      l
    ), this.ctx.restore();
    for (const u of c)
      this.renderRowBandCells(
        u,
        t,
        e,
        o,
        n,
        r,
        l
      );
    for (const u of d)
      this.renderSummaryBandCells(u, e, o);
    if (i.length > 0) {
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(
        0,
        h.body.y,
        this.canvas.width / this.dpr,
        this.layoutManager.getBodyViewportHeight()
      ), this.ctx.clip(), this.renderRowBandCells(
        h.body,
        t,
        i,
        o,
        n,
        r,
        l,
        0
      ), this.ctx.restore();
      for (const u of c)
        this.renderRowBandCells(
          u,
          t,
          i,
          o,
          n,
          r,
          l,
          0
        );
      for (const u of d)
        this.renderSummaryBandCells(u, i, o, 0);
    }
    if (s.length > 0) {
      const u = this.canvas.width / this.dpr;
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(
        0,
        h.body.y,
        this.canvas.width / this.dpr,
        this.layoutManager.getBodyViewportHeight()
      ), this.ctx.clip(), this.renderRowBandCells(
        h.body,
        t,
        s,
        o,
        n,
        r,
        l,
        u - a.rightFixed.width
      ), this.ctx.restore();
      for (const f of c)
        this.renderRowBandCells(
          f,
          t,
          s,
          o,
          n,
          r,
          l,
          u - a.rightFixed.width
        );
      for (const f of d)
        this.renderSummaryBandCells(
          f,
          s,
          o,
          u - a.rightFixed.width
        );
    }
  }
  renderSummaryBandCells(t, e, i, s) {
    var r, a, l;
    if (t.rows.length === 0 || e.length === 0) return;
    let o = t.y;
    const n = new Set(e);
    for (const h of t.rows) {
      const c = h.height;
      for (const d of e) {
        const u = this.getSummaryColumnX(d, e, i, s), f = this.layoutManager.getColumnWidthByIndex(d);
        this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(u, o, f, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(u, o, f, c);
      }
      for (const d of h.cells) {
        const u = this.getSummaryCellSegments(d, n);
        if (u.length === 0)
          continue;
        const f = this.layoutManager.getLeafColumn(d.startColumnIndex);
        if (f)
          for (const g of u) {
            const m = this.getSummaryColumnX(g.start, e, i, s), y = this.layoutManager.getColumnOffset(g.end) + this.layoutManager.getColumnWidthByIndex(g.end) - this.layoutManager.getColumnOffset(g.start);
            this.ctx.fillStyle = ((r = d.renderResult.style) == null ? void 0 : r.backgroundColor) ?? this.theme.colors.headerBackground, this.ctx.fillRect(m, o, y, c), g.start <= d.startColumnIndex && d.startColumnIndex <= g.end && this.renderCellContent(
              d.renderResult,
              m,
              o,
              y,
              c,
              8,
              f.align,
              -1,
              d.startColumnIndex,
              !1
            ), this.ctx.strokeStyle = ((a = d.renderResult.style) == null ? void 0 : a.borderColor) ?? this.theme.colors.cellBorder, this.ctx.lineWidth = ((l = d.renderResult.style) == null ? void 0 : l.borderWidth) ?? this.theme.border.width, this.ctx.strokeRect(m, o, y, c);
          }
      }
      o += c;
    }
  }
  getSummaryColumnX(t, e, i, s) {
    const o = this.layoutManager.getColumnOffset(t);
    return s !== void 0 ? s + o - this.layoutManager.getColumnOffset(e[0]) : o - i;
  }
  getSummaryCellSegments(t, e) {
    const i = [];
    let s = null, o = null;
    for (let n = t.startColumnIndex; n <= t.endColumnIndex; n++) {
      if (!e.has(n)) {
        s !== null && o !== null && (i.push({ start: s, end: o }), s = null, o = null);
        continue;
      }
      s === null ? s = n : o !== null && n !== o + 1 && (i.push({ start: s, end: o }), s = n), o = n;
    }
    return s !== null && o !== null && i.push({ start: s, end: o }), i;
  }
  renderCenterHeader(t, e, i, s, o, n, r, a, l) {
    const c = this.layoutManager.getLayoutInfo().headerHeight, d = this.layoutManager.getVisibleHeaderCells();
    let u = 0, f = 0;
    for (const g of e) {
      if (!this.layoutManager.getLeafColumn(g)) continue;
      const p = this.layoutManager.getColumnOffset(g), y = this.layoutManager.getColumnWidthByIndex(g);
      f === 0 && (u = p - n), f += y;
    }
    this.ctx.save(), f > 0 && (this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(u, 0, f, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(u, c), this.ctx.lineTo(u + f, c), this.ctx.stroke());
    for (const g of d) {
      if (g.column.fixed === "left" || g.column.fixed === "right")
        continue;
      const p = this.layoutManager.getLeafColumns().findIndex((R) => R === g.column), y = e.indexOf(p);
      let w = g.x - n;
      if (y !== -1) {
        let R = 0;
        for (let I = 0; I < y; I++) {
          const M = e[I];
          M !== void 0 && (R += this.layoutManager.getColumnWidthByIndex(M));
        }
        w = this.layoutManager.getColumnOffset(e[0]) - n + R;
      }
      const C = g.column.key === r;
      this.renderHeaderCellMultiLevel(
        g.column,
        w,
        g.y,
        g.width,
        g.height,
        g.colspan,
        g.rowspan,
        s,
        o,
        C,
        !1,
        p
      );
    }
    this.endFrame(), this.ctx.restore();
  }
  renderHeaderCellMultiLevel(t, e, i, s, o, n, r, a, l, h = !1, c = !1, d = -1) {
    var P, B;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const L = this.hoveredPlaceholderColumnIndex === d;
      this.ctx.fillStyle = L ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
      return;
    }
    const u = 8, g = t.reorderable !== !1 && h, m = g ? 10 : 0;
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const p = a.find((L) => L.column === t.key), y = (p == null ? void 0 : p.direction) ?? "none", w = t.sortable !== !1, C = !((P = t.children) != null && P.length) && w && (y !== "none" || h), R = C ? 20 : 0, v = l.some((L) => L.column === t.key), I = !((B = t.children) != null && B.length) && t.filterable && (v || h), M = I ? 20 : 0, S = s - u * 2 - R - M - m - (g ? 4 : 0), T = ft(t.title, Math.floor(S / 7)), H = t.align ?? "center";
    let D = e + u + m + (g ? 4 : 0);
    H === "center" ? (D = e + (s - this.ctx.measureText(T).width - R - M) / 2, g && (D = Math.max(D, e + u + m + 4))) : H === "right" && (D = e + s - u - this.ctx.measureText(T).width - R - M);
    const k = i + o / 2;
    if (this.ctx.fillText(T, D, k), g && this.renderDragHandle(e + u, i + o / 2), I) {
      const L = e + s - u - 10;
      C && this.renderSortIndicator(
        L - 16,
        k,
        y === "none" ? "hover" : y
      ), this.renderFilterIndicator(L, k, v);
    } else C && this.renderSortIndicator(
      e + s - u - 10,
      k,
      y === "none" ? "hover" : y
    );
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
  }
  renderCenterRows(t, e, i, s, o, n, r, a) {
    var d;
    const l = /* @__PURE__ */ new Set(), h = (d = this.currentRowResizeState) == null ? void 0 : d.rowIndex;
    for (let u = i; u <= s; u++) {
      if (u === h)
        continue;
      const f = e[u];
      f && this.renderCenterRow(
        t,
        e,
        f,
        u,
        o,
        n,
        r,
        a,
        l
      );
    }
    const c = h !== void 0 && h >= i && h <= s ? e[h] : void 0;
    h !== void 0 && c && this.renderCenterRow(
      t,
      e,
      c,
      h,
      o,
      n,
      r,
      a,
      /* @__PURE__ */ new Set()
    );
  }
  renderCenterRow(t, e, i, s, o, n, r, a, l) {
    var p, y;
    const h = this.layoutManager.getRowOffset(s), c = this.getRenderedRowHeight(s), d = h - r, u = this.layoutManager.getLeafColumns();
    let f = this.theme.colors.rowBackground;
    a.stripeRows && s % 2 === 1 && (f = this.theme.colors.rowAltBackground), i.selected && (f = this.theme.colors.rowSelectedBackground), ((p = a.hoveredCell) == null ? void 0 : p.rowIndex) === s && (f = this.theme.colors.rowHoverBackground);
    for (const w of o) {
      if (this.layoutManager.isCellMerged(s, w) || !u[w]) continue;
      const R = o.indexOf(w);
      let v;
      if (R !== -1) {
        let M = 0;
        for (let T = 0; T < R; T++) {
          const H = o[T];
          H !== void 0 && (M += this.layoutManager.getColumnWidthByIndex(H));
        }
        v = this.layoutManager.getColumnOffset(o[0]) - n + M;
      } else
        v = this.layoutManager.getColumnOffset(w) - n;
      const I = this.layoutManager.getColumnWidthByIndex(w);
      this.ctx.fillStyle = f, this.ctx.fillRect(v, d, I, c);
    }
    const m = this.layoutManager.getMergesAffectingRow(s);
    for (const w of m) {
      if (!o.includes(w.columnIndex)) continue;
      const C = `${w.rowIndex}-${w.columnIndex}`;
      if (l.has(C)) continue;
      const R = e[w.rowIndex];
      if (!R) continue;
      const v = this.layoutManager.getMergedCellPosition(w.rowIndex, w.columnIndex);
      if (!v) continue;
      const I = u[w.columnIndex];
      if (!I) continue;
      const M = R.data[$(I)], T = ((y = a.hoveredCell) == null ? void 0 : y.rowIndex) !== void 0 && a.hoveredCell.rowIndex >= w.rowIndex && a.hoveredCell.rowIndex < w.rowIndex + w.rowspan ? this.theme.colors.rowHoverBackground : f, H = v.x - n, D = v.y - r;
      this.ctx.fillStyle = T, this.ctx.fillRect(H, D, v.width, v.height), this.renderCellWithPosition(
        I,
        R,
        w.rowIndex,
        w.columnIndex,
        M,
        H,
        D,
        v.width,
        v.height,
        a
      ), l.add(C);
    }
    for (const w of o) {
      const C = u[w];
      if (!C || this.layoutManager.isCellMerged(s, w) || this.layoutManager.getCellMerge(s, w))
        continue;
      const v = i.data[$(C)], I = o.indexOf(w);
      let M;
      if (I !== -1) {
        let k = 0;
        for (let B = 0; B < I; B++) {
          const L = o[B];
          L !== void 0 && (k += this.layoutManager.getColumnWidthByIndex(L));
        }
        M = this.layoutManager.getColumnOffset(o[0]) - n + k;
      } else
        M = this.layoutManager.getColumnOffset(w) - n;
      const S = this.layoutManager.getColumnWidthByIndex(w), H = this.layoutManager.getRowOffset(s) - r, D = this.getRenderedRowHeight(s);
      this.renderCellWithPosition(
        C,
        i,
        s,
        w,
        v,
        M,
        H,
        S,
        D,
        a
      );
    }
  }
  renderFixedColumnsContent(t, e, i, s, o, n, r) {
    var g, m, p;
    const a = this.canvas.height / this.dpr;
    this.ctx.save();
    let l = 0;
    for (const y of i)
      l += this.layoutManager.getColumnWidthByIndex(y);
    const h = /* @__PURE__ */ new Set(), c = (g = this.currentRowResizeState) == null ? void 0 : g.rowIndex, d = Math.max(0, n.startRow), u = Math.min(e.length - 1, n.endRow);
    for (let y = d; y <= u; y++) {
      if (y === c)
        continue;
      const w = e[y];
      if (!w) continue;
      const C = this.layoutManager.getRowOffset(y), R = this.getRenderedRowHeight(y), v = C - o;
      if (C + R < o || C > o + a)
        continue;
      let I = this.theme.colors.rowBackground;
      r.stripeRows && y % 2 === 1 && (I = this.theme.colors.rowAltBackground), w.selected && (I = this.theme.colors.rowSelectedBackground), ((m = r.hoveredCell) == null ? void 0 : m.rowIndex) === y && (I = this.theme.colors.rowHoverBackground);
      for (const D of i) {
        if (this.layoutManager.isCellMerged(y, D))
          continue;
        const k = this.layoutManager.getColumnWidthByIndex(D), P = s + this.layoutManager.getColumnOffset(D) - this.layoutManager.getColumnOffset(i[0]);
        this.ctx.fillStyle = I, this.ctx.fillRect(P, v, k, R);
      }
      const S = this.layoutManager.getMergesAffectingRow(y), T = this.layoutManager.getLeafColumns();
      for (const D of S) {
        if (!i.includes(D.columnIndex)) continue;
        const k = `${D.rowIndex}-${D.columnIndex}`;
        if (h.has(k)) continue;
        const P = e[D.rowIndex];
        if (!P) continue;
        const B = this.layoutManager.getMergedCellPosition(
          D.rowIndex,
          D.columnIndex
        );
        if (!B) continue;
        const L = T[D.columnIndex];
        if (!L) continue;
        const A = P.data[$(L)];
        let W = 0;
        const _ = s + this.layoutManager.getColumnOffset(D.columnIndex) - this.layoutManager.getColumnOffset(i[0]);
        for (let X = 0; X < D.colspan; X++) {
          const G = D.columnIndex + X;
          i.includes(G) && (W += this.layoutManager.getColumnWidthByIndex(G));
        }
        const V = ((p = r.hoveredCell) == null ? void 0 : p.rowIndex) !== void 0 && r.hoveredCell.rowIndex >= D.rowIndex && r.hoveredCell.rowIndex < D.rowIndex + D.rowspan ? this.theme.colors.rowHoverBackground : I, z = B.y - o;
        this.ctx.fillStyle = V, this.ctx.fillRect(_, z, W, B.height), this.renderCellWithPosition(
          L,
          P,
          D.rowIndex,
          D.columnIndex,
          A,
          _,
          z,
          W,
          B.height,
          r
        ), h.add(k);
      }
      let H = s;
      for (const D of i) {
        const k = T[D];
        if (!k) {
          H += this.layoutManager.getColumnWidthByIndex(D);
          continue;
        }
        if (this.layoutManager.isCellMerged(y, D)) {
          H += this.layoutManager.getColumnWidthByIndex(D);
          continue;
        }
        if (this.layoutManager.getCellMerge(y, D)) {
          H += this.layoutManager.getColumnWidthByIndex(D);
          continue;
        }
        const B = this.layoutManager.getColumnWidthByIndex(D), L = w.data[$(k)];
        this.renderCellWithPosition(
          k,
          w,
          y,
          D,
          L,
          H,
          v,
          B,
          R,
          r
        ), H += B;
      }
    }
    const f = c !== void 0 ? e[c] : void 0;
    c !== void 0 && f && this.renderFixedRowOverlay(
      t,
      f,
      c,
      i,
      s,
      o,
      r
    ), this.ctx.restore();
  }
  renderFixedRowOverlay(t, e, i, s, o, n, r) {
    var g;
    const a = this.layoutManager.getRowOffset(i), l = this.getRenderedRowHeight(i), h = a - n, c = this.canvas.height / this.dpr, d = this.layoutManager.getLeafColumns();
    if (a + l < n || a > n + c)
      return;
    let u = this.theme.colors.rowBackground;
    r.stripeRows && i % 2 === 1 && (u = this.theme.colors.rowAltBackground), e.selected && (u = this.theme.colors.rowSelectedBackground), ((g = r.hoveredCell) == null ? void 0 : g.rowIndex) === i && (u = this.theme.colors.rowHoverBackground);
    let f = o;
    for (const m of s) {
      const p = this.layoutManager.getColumnWidthByIndex(m), y = d[m];
      if (!y) {
        f += p;
        continue;
      }
      if (this.layoutManager.isCellMerged(i, m)) {
        f += p;
        continue;
      }
      const w = this.layoutManager.getCellMerge(i, m);
      if (w && (w.rowIndex !== i || w.columnIndex !== m)) {
        f += p;
        continue;
      }
      this.ctx.fillStyle = u, this.ctx.fillRect(f, h, p, l);
      const C = e.data[$(y)];
      this.renderCellWithPosition(
        y,
        e,
        i,
        m,
        C,
        f,
        h,
        p,
        l,
        r
      ), f += p;
    }
  }
  renderFixedColumnsHeader(t, e, i, s, o, n, r) {
    var f;
    const a = this.layoutManager.getLayoutInfo(), l = a.headerHeight, h = this.layoutManager.getHeaderCells();
    this.ctx.save();
    let c = 0;
    for (const g of e)
      c += this.layoutManager.getColumnWidthByIndex(g);
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(i, 0, c, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(i, l), this.ctx.lineTo(i + c, l), this.ctx.stroke();
    const u = e.length > 0 && ((f = this.layoutManager.getLeafColumn(e[0])) == null ? void 0 : f.fixed) === "right" ? i - (a.totalWidth - c) : 0;
    for (const g of h) {
      if (!g.isLeaf || !e.includes(g.colIndex)) continue;
      const m = g.column.key === n;
      this.renderHeaderCellMultiLevel(
        g.column,
        g.x + u,
        g.y,
        g.width,
        g.height,
        g.colspan,
        g.rowspan,
        s,
        o,
        m,
        !1,
        g.colIndex
      );
    }
    this.ctx.restore();
  }
  renderHeader(t, e, i, s, o, n) {
    const r = this.layoutManager.getLayoutInfo(), a = r.headerHeight, l = this.layoutManager.getLeafColumns();
    this.ctx.save(), this.ctx.translate(0, s), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, r.totalWidth, a), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, a), this.ctx.lineTo(r.totalWidth, a), this.ctx.stroke();
    for (let h = e; h <= i; h++) {
      const c = l[h];
      if (!c) continue;
      const { x: d, width: u } = this.layoutManager.getCellPosition(0, h);
      this.renderHeaderCell(c, d, 0, u, a, h, o);
    }
    this.ctx.restore();
  }
  renderHeaderCell(t, e, i, s, o, n, r) {
    if (t.key.startsWith("__hidden_placeholder__")) {
      const p = this.hoveredPlaceholderColumnIndex === n;
      this.ctx.fillStyle = p ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
      return;
    }
    const a = 8, l = 0;
    this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const h = r.find((p) => p.column === t.key), c = (h == null ? void 0 : h.direction) ?? "none", d = c !== "none" ? 20 : 0, u = s - a * 2 - d - l - 0, f = ft(t.title, Math.floor(u / 7)), g = t.align ?? "left";
    let m = e + a + l + 0;
    g === "center" ? m = e + (s - this.ctx.measureText(f).width - d) / 2 : g === "right" && (m = e + s - a - this.ctx.measureText(f).width - d), this.ctx.fillText(f, m, i + o / 2), c !== "none" && this.renderSortIndicator(e + s - a - 10, i + o / 2, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
  }
  renderDragHandle(t, e) {
    const l = t, h = e - 8 / 2;
    this.ctx.fillStyle = this.theme.colors.indicator.inactive;
    for (let c = 0; c < 3; c++)
      for (let d = 0; d < 2; d++) {
        const u = l + d * 5, f = h + c * 4;
        this.ctx.beginPath(), this.ctx.arc(u, f, 1, 0, Math.PI * 2), this.ctx.fill();
      }
  }
  renderSortIndicator(t, e, i) {
    const r = this.theme.colors.indicator.active, a = this.theme.colors.indicator.inactive;
    this.ctx.beginPath(), this.ctx.moveTo(t - 8 / 2, e - 2), this.ctx.lineTo(t + 8 / 2, e - 2), this.ctx.lineTo(t, e - 2 - 5), this.ctx.closePath(), this.ctx.fillStyle = i === "asc" ? r : a, this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(t - 8 / 2, e + 2), this.ctx.lineTo(t + 8 / 2, e + 2), this.ctx.lineTo(t, e + 2 + 5), this.ctx.closePath(), this.ctx.fillStyle = i === "desc" ? r : a, this.ctx.fill();
  }
  renderFilterIndicator(t, e, i) {
    const o = this.theme.colors.indicator.active, n = this.theme.colors.indicator.inactive;
    this.ctx.fillStyle = i ? o : n, this.ctx.beginPath(), this.ctx.moveTo(t - 10 / 2, e - 10 / 2), this.ctx.lineTo(t + 10 / 2, e - 10 / 2), this.ctx.lineTo(t, e), this.ctx.closePath(), this.ctx.fill(), this.ctx.fillRect(t - 1, e, 2, 10 / 2);
  }
  renderRows(t, e, i, s, o, n, r) {
    for (let a = i; a <= s; a++) {
      const l = e[a];
      l && this.renderRow(t, l, a, o, n, r);
    }
  }
  renderRow(t, e, i, s, o, n) {
    var u;
    const r = this.layoutManager.getLayoutInfo(), { x: a, y: l, height: h } = this.layoutManager.getCellPosition(i, 0), c = r.totalWidth;
    let d = this.theme.colors.rowBackground;
    n.stripeRows && i % 2 === 1 && (d = this.theme.colors.rowAltBackground), e.selected && (d = this.theme.colors.rowSelectedBackground), ((u = n.hoveredCell) == null ? void 0 : u.rowIndex) === i && (d = this.theme.colors.rowHoverBackground), this.ctx.fillStyle = d, this.ctx.fillRect(a, l, c, h);
    for (let f = s; f <= o; f++) {
      const g = t[f];
      if (!g) continue;
      const m = e.data[$(g)];
      this.renderCell(g, e, i, f, m, n);
    }
  }
  renderCell(t, e, i, s, o, n) {
    const { x: r, y: a, width: l, height: h } = this.layoutManager.getCellPosition(i, s);
    this.renderCellInternal(t, e, i, s, o, r, a, l, h, n);
  }
  renderCellWithPosition(t, e, i, s, o, n, r, a, l, h) {
    this.renderCellInternal(t, e, i, s, o, n, r, a, l, h);
  }
  renderCellInternal(t, e, i, s, o, n, r, a, l, h) {
    var w, C, R, v;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const I = this.hoveredPlaceholderColumnIndex === s;
      this.ctx.fillStyle = I ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.rowBackground, this.ctx.fillRect(n, r, a, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(n + a, r), this.ctx.lineTo(n + a, r + l), this.ctx.stroke();
      return;
    }
    const d = this.resolveDisabled(t.disabled, e, t), u = this.getCacheMode(t);
    let f;
    if (this.renderCache && u !== !1) {
      const I = this.renderCache.get(e, t, o, u);
      I ? f = I : (f = this.executeRender(t, e, i, o), this.renderCache.set(e, t, o, f, u));
    } else
      f = this.executeRender(t, e, i, o);
    const g = this.isCellSelected(i, s, h.selectedCells), m = ((w = h.hoveredCell) == null ? void 0 : w.rowIndex) === i && ((C = h.hoveredCell) == null ? void 0 : C.columnIndex) === s, p = ((R = h.editingCell) == null ? void 0 : R.rowIndex) === i && ((v = h.editingCell) == null ? void 0 : v.columnIndex) === s;
    if (g && !e.selected ? (this.ctx.fillStyle = this.theme.colors.rowSelectedBackground, this.ctx.fillRect(n, r, a, l)) : m && !e.selected && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(n, r, a, l)), !p) {
      const I = this.expandColumnKey === t.key, M = e.children && e.children.length > 0, S = e.level ?? 0;
      if (I && M) {
        this.renderExpandIcon(n, r, a, l, e.expanded ?? !1, S);
        const T = 20, H = S * 16;
        this.renderCellContent(
          f,
          n + T + H,
          r,
          a - T - H,
          l,
          8,
          t.align,
          i,
          s,
          d
        );
      } else {
        const T = I ? S * 16 : 0;
        this.renderCellContent(
          f,
          n + T,
          r,
          a - T,
          l,
          8,
          t.align,
          i,
          s,
          d
        );
      }
    }
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(n, r, a, l);
    const y = this.currentValidationErrors.get(`${i}-${s}`);
    if (y) {
      const I = Math.max(this.theme.border.width, 2), M = I / 2;
      this.ctx.strokeStyle = y.level === "warning" ? this.theme.colors.tagColors.warning ?? "#faad14" : this.theme.colors.tagColors.error ?? "#ff4d4f", this.ctx.lineWidth = I, this.ctx.strokeRect(n + M, r + M, a - I, l - I);
    } else if (this.currentPendingValidations.has(`${i}-${s}`)) {
      const I = Math.max(this.theme.border.width, 2), M = I / 2, S = Date.now() % 1500 / 1500, T = 0.3 + 0.4 * Math.sin(S * Math.PI * 2);
      this.ctx.strokeStyle = `rgba(59, 130, 246, ${T})`, this.ctx.lineWidth = I, this.ctx.strokeRect(n + M, r + M, a - I, l - I);
    }
    if (d) {
      const I = this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
      this.ctx.fillStyle = I, this.ctx.fillRect(n, r, a, l);
    }
  }
  /**
   * 获取列的缓存模式
   */
  getCacheMode(t) {
    return t.cacheRender === !1 || t.cacheMode === !1 ? !1 : t.cacheMode === "value" ? "value" : t.cacheMode === "cell" ? "cell" : !1;
  }
  /**
   * 执行渲染函数
   */
  executeRender(t, e, i, s) {
    let o = {
      text: this.formatValue(s, t, e),
      type: t.type ?? "text"
    };
    if (t.type === "number" && (o.placeholder = t.placeholder ?? this.locale.cell.numberPlaceholder), t.render)
      try {
        const n = t.render(s, e, t, i);
        n && (o = { ...o, ...n });
      } catch (n) {
        console.error(`Error rendering cell at row ${i}, column ${t.key}:`, n), o = {
          text: "[Error]",
          type: "text"
        };
      }
    return o;
  }
  renderCellContent(t, e, i, s, o, n, r, a, l, h) {
    try {
      this.renderCellContentInternal(
        t,
        e,
        i,
        s,
        o,
        n,
        r,
        a,
        l,
        h
      );
    } catch (c) {
      console.error(`Error rendering cell content at row ${a}, col ${l}:`, c), this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText("[Render Error]", e + n, i + o / 2);
    }
  }
  renderWithCellRenderer(t, e, i, s, o, n, r = {}) {
    const a = this.cellRendererRegistry.get(t);
    return a ? a.render(
      this.cellRendererRegistry.createContext({
        ctx: this.ctx,
        theme: this.theme,
        layoutManager: this.layoutManager,
        x: i,
        y: s,
        width: o,
        height: n,
        column: { key: t, title: t, type: t },
        row: { id: "", data: {} },
        rowIndex: r.rowIndex ?? -1,
        colIndex: r.colIndex ?? -1,
        value: e,
        isDisabled: r.isDisabled ?? !1,
        isHovered: r.isHovered ?? !1,
        isSelected: !1,
        dpr: this.dpr,
        locale: this.locale,
        switchAnimation: r.switchAnimation,
        buttonHoverState: r.buttonHoverState,
        multipleSelectSeparator: r.multipleSelectSeparator,
        hoveredButtonIndex: r.hoveredButtonIndex
      })
    ) : null;
  }
  renderCellContentInternal(t, e, i, s, o, n, r, a, l, h) {
    var c, d, u, f;
    this.ctx.save();
    try {
      const { text: g, type: m, style: p, checkbox: y, radio: w, button: C, input: R, tags: v, link: I } = t, M = (p == null ? void 0 : p.fontSize) ?? this.theme.font.size, S = (p == null ? void 0 : p.fontFamily) ?? this.theme.font.family, T = (p == null ? void 0 : p.fontWeight) ?? "normal", H = (p == null ? void 0 : p.fontStyle) ?? "normal";
      if (this.ctx.font = `${H} ${T} ${M}px ${S}`, m === O.CHECKBOX && y) {
        this.measureRender("checkbox", () => {
          this.renderWithCellRenderer("checkbox", y, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.RADIO && w) {
        this.measureRender("radio", () => {
          this.renderWithCellRenderer("radio", w, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.BUTTON && C) {
        let D;
        if (a !== void 0 && l !== void 0 && this.currentButtonHoverStates) {
          const k = `${a}-${l}`, P = this.currentButtonHoverStates.get(k);
          P && (D = P);
        }
        this.measureRender("button", () => {
          this.renderWithCellRenderer("button", C, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            buttonHoverState: D
          });
        });
        return;
      }
      if (m === O.BUTTONS && t.buttons) {
        let D = -1;
        a !== void 0 && l !== void 0 && ((c = this.currentHoveredCell) == null ? void 0 : c.rowIndex) === a && ((d = this.currentHoveredCell) == null ? void 0 : d.columnIndex) === l && (D = this.currentHoveredButtonIndex), this.measureRender("buttons", () => {
          this.renderWithCellRenderer("buttons", t.buttons, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            hoveredButtonIndex: D
          });
        });
        return;
      }
      if (m === O.SWITCH && t.switch) {
        let D;
        if (a !== void 0 && l !== void 0 && this.currentSwitchAnimations) {
          const k = `${a}-${l}`, P = this.currentSwitchAnimations.get(k);
          P && (D = P);
        }
        this.measureRender("switch", () => {
          this.renderWithCellRenderer("switch", t.switch, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            switchAnimation: D
          });
        });
        return;
      }
      if (m === O.INPUT && R) {
        this.measureRender("input", () => {
          this.renderWithCellRenderer("input", R, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.SELECT && t.select) {
        this.measureRender("select", () => {
          this.renderWithCellRenderer("select", t.select, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            multipleSelectSeparator: this.multipleSelectSeparator
          });
        });
        return;
      }
      if (m === O.DATE && t.date) {
        this.measureRender("date", () => {
          this.renderWithCellRenderer("date", t.date, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.TAG && v) {
        this.measureRender("tags", () => {
          this.renderWithCellRenderer("tag", v, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.IMAGE && t.image) {
        const D = a !== void 0 && l !== void 0 && ((u = this.currentHoveredCell) == null ? void 0 : u.rowIndex) === a && ((f = this.currentHoveredCell) == null ? void 0 : f.columnIndex) === l;
        this.measureRender(
          "image",
          () => this.renderImage(e, i, s, o, t.image, a, D)
        );
        return;
      }
      if (m === O.PROGRESS && t.progress) {
        const k = a !== void 0 && l !== void 0 && this.currentProgressDragState && this.currentProgressDragState.cell.rowIndex === a && this.currentProgressDragState.cell.columnIndex === l ? { ...t.progress, value: this.currentProgressDragState.displayValue } : t.progress;
        this.measureRender("progress", () => {
          this.renderWithCellRenderer("progress", k, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.RATING && t.rating) {
        let D;
        this.measureRender("rating", () => {
          var k;
          D = (k = this.renderWithCellRenderer(
            "rating",
            t.rating,
            e,
            i,
            s,
            o,
            {
              rowIndex: a,
              colIndex: l,
              isDisabled: h
            }
          )) == null ? void 0 : k.starBounds;
        }), D && (t.starBounds = D);
        return;
      }
      if (m === O.COLOR && t.color) {
        this.measureRender("color", () => {
          this.renderWithCellRenderer("color", t.color, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (t.type === "custom" && t.jsxRender) {
        this.measureRender("jsx", () => {
          this.ctx.save();
          try {
            const D = t.jsxRender(), k = new Mi(this.ctx), P = new Ei(k);
            new Ti(this.ctx, P, this.theme).render(D, e, i, { width: s, height: o });
          } catch (D) {
            console.error(
              `[Renderer] JSX render error at row ${a}, col ${l}:`,
              D
            );
          } finally {
            this.ctx.restore();
          }
        });
        return;
      }
      if (t.type === "custom" && t.customRender) {
        this.measureRender("custom", () => {
          try {
            t.customRender({
              ctx: this.ctx,
              x: e,
              y: i,
              width: s,
              height: o,
              padding: n,
              theme: this.theme,
              dpr: this.dpr
            });
          } catch (D) {
            console.error(
              `[Renderer] customRender error at row ${a}, col ${l}:`,
              D
            );
          }
        });
        return;
      }
      this.measureRender("text", () => {
        let D = g, k = (p == null ? void 0 : p.color) ?? this.theme.colors.cellText;
        if (m === O.LINK && I && (D = I.text || I.link, k = (p == null ? void 0 : p.color) ?? this.theme.colors.linkColor), m === O.NUMBER && !D && (D = t.placeholder ?? this.locale.cell.numberPlaceholder, k = this.theme.colors.placeholderText), !D) return;
        this.ctx.fillStyle = k;
        const P = (p == null ? void 0 : p.horizontalAlign) ?? r ?? "left", B = (p == null ? void 0 : p.verticalAlign) ?? "middle", L = this.theme.font.size, A = L * 1.5, W = s - n * 2, _ = this.calculateMaxRows(o, A, n);
        if (_ > 1) {
          const F = this.wrapTextToLines(D, W, _), V = F.length * A;
          let z;
          B === "top" ? z = i + n : B === "bottom" ? z = i + o - n - V : z = i + (o - V) / 2, this.ctx.textBaseline = "top";
          for (let X = 0; X < F.length; X++) {
            const G = F[X];
            let U;
            switch (P) {
              case "center":
                U = e + (s - this.ctx.measureText(G).width) / 2;
                break;
              case "right":
                U = e + s - n - this.ctx.measureText(G).width;
                break;
              default:
                U = e + n;
            }
            this.ctx.fillText(G, U, z + X * A);
          }
        } else {
          const F = "...";
          if (this.ctx.measureText(D).width > W) {
            let G = D;
            for (; G.length > 0 && this.ctx.measureText(G + F).width > W; )
              G = G.slice(0, -1);
            D = G + F;
          }
          let z;
          switch (P) {
            case "center":
              z = e + (s - this.ctx.measureText(D).width) / 2;
              break;
            case "right":
              z = e + s - n - this.ctx.measureText(D).width;
              break;
            default:
              z = e + n;
          }
          let X;
          switch (B) {
            case "top":
              this.ctx.textBaseline = "top", X = i + n;
              break;
            case "bottom":
              this.ctx.textBaseline = "bottom", X = i + o - n;
              break;
            default:
              this.ctx.textBaseline = "middle", X = i + o / 2;
          }
          if (m === O.TAG)
            this.renderTag(D, z, X, L);
          else if (this.ctx.fillText(D, z, X), m === O.LINK) {
            const G = this.ctx.measureText(D).width;
            this.ctx.strokeStyle = k, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(z, X + L / 2 + 2), this.ctx.lineTo(z + G, X + L / 2 + 2), this.ctx.stroke();
          }
        }
      });
    } finally {
      this.ctx.restore();
    }
  }
  renderExpandIcon(t, e, i, s, o, n) {
    const l = n * 16, h = t + 8 + l + 8 / 2, c = e + s / 2;
    this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.beginPath(), o ? (this.ctx.moveTo(h - 8 / 2, c - 8 / 2), this.ctx.lineTo(h + 8 / 2, c - 8 / 2), this.ctx.lineTo(h, c + 8 / 2)) : (this.ctx.moveTo(h - 8 / 2, c - 8 / 2), this.ctx.lineTo(h + 8 / 2, c), this.ctx.lineTo(h - 8 / 2, c + 8 / 2)), this.ctx.closePath(), this.ctx.fill();
  }
  renderButtonsDropdown(t) {
    this.dropdownRenderer.renderButtonsDropdown(t);
  }
  renderImageTooltip(t) {
    this.imageOverlayRenderer.renderImageTooltip(t);
  }
  renderImageEditor(t) {
    this.imageOverlayRenderer.renderImageEditor(t);
  }
  /**
   * 获取文本宽度（使用缓存优化性能）
   * 避免每帧都调用 measureText
   */
  measureTextWidth(t) {
    const e = `${this.theme.font.size}-${this.theme.font.family}`;
    this.textWidthCacheKey !== e && (this.textWidthCache.clear(), this.textWidthCacheKey = e);
    const i = this.textWidthCache.get(t);
    if (i !== void 0)
      return i;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const s = this.ctx.measureText(t).width;
    return this.textWidthCache.set(t, s), s;
  }
  renderColorDropdown(t) {
    this.overlayRenderer.renderColorDropdown(t);
  }
  renderImage(t, e, i, s, o, n, r) {
    if (o.images && o.images.length > 0) {
      this.renderMultipleImages(t, e, i, s, o, n, r);
      return;
    }
    if (!o.src)
      return;
    const l = this.getMaxImageSize(i, s, 4, o), h = o.width ?? 32, c = o.height ?? 32, d = Math.min(h, l), u = Math.min(c, l), f = o.circle ? Math.min(d, u) / 2 : o.borderRadius ?? 0, g = t + (i - d) / 2, m = e + (s - u) / 2;
    if (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.beginPath(), f > 0 ? this.ctx.roundRect(g, m, d, u, f) : this.ctx.rect(g, m, d, u), this.ctx.fill(), o.src) {
      const p = o.lazy !== !1, y = o.lazyThreshold ?? 200;
      if (p && n !== void 0 && this.currentVisibleRange && !this.isInLazyLoadRange(n, y)) {
        this.renderImagePlaceholder(
          g,
          m,
          d,
          u,
          f,
          o.placeholder
        ), r && o.hoverable !== !1 && this.renderImageHover(g, m, d, u, f);
        return;
      }
      if (this.imageLoadQueue.isFailed(o.src)) {
        this.renderImageError(g, m, d, u, f, o.errorImage);
        return;
      }
      const w = this.imageLoadQueue.get(o.src, Math.max(d, u));
      w ? (this.ctx.save(), this.ctx.beginPath(), f > 0 ? this.ctx.roundRect(g, m, d, u, f) : this.ctx.rect(g, m, d, u), this.ctx.clip(), this.drawImageWithFit(w, g, m, d, u, o.fit ?? "cover"), this.ctx.restore(), this.collectVisibleImage(o.src)) : this.imageLoadQueue.isLoading(o.src) ? (this.collectVisibleImage(o.src), this.renderImagePlaceholder(
        g,
        m,
        d,
        u,
        f,
        o.placeholder
      )) : (this.collectVisibleImage(o.src), this.loadImage(o.src, Math.max(d, u)), this.renderImagePlaceholder(
        g,
        m,
        d,
        u,
        f,
        o.placeholder
      ));
    } else
      this.renderImagePlaceholder(
        g,
        m,
        d,
        u,
        f,
        o.placeholder
      );
    r && o.hoverable !== !1 && this.renderImageHover(g, m, d, u, f);
  }
  getMaxImageSize(t, e, i, s) {
    const o = s.scaleWithRowHeight === !1 ? Math.min(e, Pi) : e;
    return Math.max(0, Math.min(t, o) - i * 2);
  }
  renderMultipleImages(t, e, i, s, o, n, r) {
    const a = o.images, l = 4, h = this.getMaxImageSize(i, s, l, o), c = o.width ?? 32, d = o.height ?? 32, u = Math.min(c, h), f = Math.min(d, h), g = o.gap ?? 4, m = o.circle ? Math.min(u, f) / 2 : o.borderRadius ?? 0, p = o.showMoreCount !== !1, y = i - l * 2, w = s - l * 2, C = Math.max(1, Math.floor((y + g) / (u + g))), R = Math.max(1, Math.floor((w + g) / (f + g))), v = C * R, I = o.maxVisible ?? v, S = p && a.length > I ? Math.max(1, v - 1) : v, T = Math.max(1, Math.min(I, S)), H = o.lazy !== !1, D = o.lazyThreshold ?? 200;
    let k = !0;
    H && n !== void 0 && this.currentVisibleRange && (k = this.isInLazyLoadRange(n, D));
    const P = a.length > T, B = P ? T : a.length, L = a.slice(0, B), A = P ? a.length - T : 0, W = B + (P && p ? 1 : 0), _ = Math.max(1, Math.ceil(W / C)), F = Math.min(W, C), V = F * u + Math.max(0, F - 1) * g, z = _ * f + Math.max(0, _ - 1) * g;
    let X = t + (i - V) / 2;
    X = Math.max(t + l, X);
    const G = e + (s - z) / 2;
    for (let U = 0; U < L.length; U++) {
      const K = L[U], tt = Math.floor(U / C), st = U % C, Y = X + st * (u + g), j = G + tt * (f + g), dt = r && o.hoverable !== !1 && this.currentHoveredImageIndex === U;
      if (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.beginPath(), m > 0 ? this.ctx.roundRect(Y, j, u, f, m) : this.ctx.rect(Y, j, u, f), this.ctx.fill(), !k) {
        this.renderImagePlaceholder(
          Y,
          j,
          u,
          f,
          m,
          o.placeholder
        ), dt && this.renderImageHover(Y, j, u, f, m);
        continue;
      }
      if (this.imageLoadQueue.isFailed(K)) {
        this.renderImageError(Y, j, u, f, m, o.errorImage), dt && this.renderImageHover(Y, j, u, f, m);
        continue;
      }
      const ht = this.imageLoadQueue.get(K, Math.max(u, f));
      ht ? (this.ctx.save(), this.ctx.beginPath(), m > 0 ? this.ctx.roundRect(Y, j, u, f, m) : this.ctx.rect(Y, j, u, f), this.ctx.clip(), this.drawImageWithFit(ht, Y, j, u, f, o.fit ?? "cover"), this.ctx.restore(), this.collectVisibleImage(K)) : this.imageLoadQueue.isLoading(K) ? (this.collectVisibleImage(K), this.renderImagePlaceholder(
        Y,
        j,
        u,
        f,
        m,
        o.placeholder
      )) : (this.collectVisibleImage(K), this.loadImage(K, Math.max(u, f)), this.renderImagePlaceholder(
        Y,
        j,
        u,
        f,
        m,
        o.placeholder
      )), dt && this.renderImageHover(Y, j, u, f, m);
    }
    if (P && p) {
      const U = Math.floor(B / C), K = B % C, tt = X + K * (u + g), st = G + U * (f + g), Y = r && o.hoverable !== !1 && this.currentHoveredImageIndex === B;
      this.renderMoreCount(
        tt,
        st,
        u,
        f,
        m,
        A,
        Y
      );
    }
  }
  renderMoreCount(t, e, i, s, o, n, r) {
    this.ctx.fillStyle = r ? this.theme.colors.image.hoverBorder : this.theme.colors.moreCount.background, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, i, s, o) : this.ctx.rect(t, e, i, s), this.ctx.fill();
    const a = `+${n}`;
    this.ctx.fillStyle = this.theme.colors.moreCount.text, this.ctx.font = `bold ${Math.min(i, s) * 0.4}px ${this.theme.font.family}`;
    const l = this.ctx.textAlign, h = this.ctx.textBaseline;
    this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(a, t + i / 2, e + s / 2), this.ctx.textAlign = l, this.ctx.textBaseline = h;
  }
  renderImageHover(t, e, i, s, o) {
    const n = this.theme.colors.image.hoverBorder, r = this.ctx.strokeStyle, a = this.ctx.lineWidth;
    this.ctx.strokeStyle = n, this.ctx.lineWidth = 2, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, i, s, o) : this.ctx.rect(t, e, i, s), this.ctx.stroke(), this.ctx.save(), this.ctx.shadowColor = this.theme.colors.image.hoverShadow, this.ctx.shadowBlur = 4, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0, this.ctx.strokeStyle = n, this.ctx.lineWidth = 1, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, i, s, o) : this.ctx.rect(t, e, i, s), this.ctx.stroke(), this.ctx.restore(), this.ctx.strokeStyle = r, this.ctx.lineWidth = a;
  }
  renderImagePlaceholder(t, e, i, s, o, n) {
    if (n) {
      const d = this.imageLoadQueue.get(n, Math.max(i, s));
      if (d) {
        this.ctx.save(), this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, i, s, o) : this.ctx.rect(t, e, i, s), this.ctx.clip(), this.drawImageWithFit(d, t, e, i, s, "cover"), this.ctx.restore();
        return;
      } else this.imageLoadQueue.isLoading(n) || this.loadImage(n, Math.max(i, s));
    }
    this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, i, s, o) : this.ctx.rect(t, e, i, s), this.ctx.fill();
    const r = Math.min(i, s) * 0.4, a = t + i / 2, l = e + s / 2, h = this.ctx.strokeStyle, c = this.ctx.lineWidth;
    this.ctx.strokeStyle = this.theme.colors.placeholderText, this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.rect(a - r / 2, l - r / 2, r, r), this.ctx.stroke(), this.ctx.beginPath(), this.ctx.moveTo(a - r / 2, l + r / 4), this.ctx.lineTo(a - r / 4, l), this.ctx.lineTo(a, l + r / 4), this.ctx.lineTo(a + r / 4, l - r / 4), this.ctx.lineTo(a + r / 2, l + r / 4), this.ctx.stroke(), this.ctx.strokeStyle = h, this.ctx.lineWidth = c;
  }
  renderImageError(t, e, i, s, o, n) {
    if (n) {
      const d = this.imageLoadQueue.get(n, Math.max(i, s));
      if (d) {
        this.ctx.save(), this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, i, s, o) : this.ctx.rect(t, e, i, s), this.ctx.clip(), this.drawImageWithFit(d, t, e, i, s, "cover"), this.ctx.restore();
        return;
      } else !this.imageLoadQueue.isLoading(n) && !this.imageLoadQueue.isFailed(n) && this.loadImage(n, Math.max(i, s));
    }
    this.ctx.fillStyle = this.theme.colors.image.errorBg, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, i, s, o) : this.ctx.rect(t, e, i, s), this.ctx.fill();
    const r = Math.min(i, s) * 0.4, a = t + i / 2, l = e + s / 2, h = this.ctx.strokeStyle, c = this.ctx.lineWidth;
    this.ctx.strokeStyle = this.theme.colors.image.errorBorder, this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.rect(a - r / 2, l - r / 2, r, r), this.ctx.stroke(), this.ctx.beginPath(), this.ctx.moveTo(a - r / 4, l - r / 4), this.ctx.lineTo(a + r / 4, l + r / 4), this.ctx.moveTo(a + r / 4, l - r / 4), this.ctx.lineTo(a - r / 4, l + r / 4), this.ctx.stroke(), this.ctx.strokeStyle = h, this.ctx.lineWidth = c;
  }
  drawImageWithFit(t, e, i, s, o, n) {
    const r = t.width / t.height, a = s / o;
    let l, h, c, d;
    switch (n) {
      case "fill":
        l = s, h = o, c = e, d = i;
        break;
      case "contain":
        r > a ? (l = s, h = s / r) : (h = o, l = o * r), c = e + (s - l) / 2, d = i + (o - h) / 2;
        break;
      case "cover":
        r > a ? (h = o, l = o * r) : (l = s, h = s / r), c = e + (s - l) / 2, d = i + (o - h) / 2;
        break;
      case "none":
      default:
        l = t.width, h = t.height, c = e + (s - l) / 2, d = i + (o - h) / 2;
        break;
    }
    this.ctx.drawImage(t, c, d, l, h);
  }
  /**
   * 检查行是否在懒加载范围内
   */
  isInLazyLoadRange(t, e) {
    if (!this.currentVisibleRange) return !0;
    const { startRow: i, endRow: s } = this.currentVisibleRange, o = this.rowHeight || this.theme.row.height, n = Math.ceil(e / o), r = Math.max(0, i - n), a = s + n, l = this.currentRows[t];
    if (!l)
      return t >= r && t <= a;
    if (this.layoutManager.isRowInPinnedBand(l))
      return !0;
    const h = this.layoutManager.getBodyRowIndexByRef(l);
    return h >= 0 ? h >= r && h <= a : t >= r && t <= a;
  }
  loadImage(t, e) {
    this.isDestroyed || this.imageLoadQueue.request(t, e, (i) => {
      var s;
      this.isDestroyed || i && (this.markDirty(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr), (s = this.onImageLoaded) == null || s.call(this));
    });
  }
  /**
   * 收集当前帧可见的图片 URL
   */
  collectVisibleImage(t) {
    t && !t.startsWith("data:") && this.frameVisibleUrls.add(t);
  }
  /**
   * 提交当前帧可见图片集合
   */
  commitVisibleImages() {
    this.imageLoadQueue.cancelInvisible(this.frameVisibleUrls), this.imageLoadQueue.commitFrame(), this.frameVisibleUrls = /* @__PURE__ */ new Set();
  }
  /**
   * 重试加载失败的图片
   */
  retryImage(t) {
    this.imageLoadQueue.retry(t);
  }
  /**
   * 检查图片是否加载失败
   */
  isImageFailed(t) {
    return this.imageLoadQueue.isFailed(t);
  }
  /**
   * 检查图片是否已加载
   */
  isImageLoaded(t) {
    return this.imageLoadQueue.has(t);
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
   * 启用或禁用性能监控
   */
  setPerformanceMonitoring(t) {
    this.performanceEnabled = t;
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
    this.performanceStats.clear(), this.currentFrameStats.clear(), this.lastFrameStats.clear(), this.frameCount = 0, this.lastReportTime = 0;
  }
  /**
   * 开始帧计时
   */
  beginFrame() {
    this.performanceEnabled && (this.frameStartTime = performance.now(), this.currentFrameStats.clear());
  }
  /**
   * 结束帧计时
   */
  endFrame() {
    if (this.performanceEnabled) {
      this.frameCount++, this.lastFrameStats = new Map(this.currentFrameStats);
      for (const [t, e] of this.currentFrameStats) {
        const i = this.performanceStats.get(t) || { totalTime: 0, count: 0, maxTime: 0 };
        i.totalTime += e.totalTime, i.count += e.count;
        const s = e.totalTime / e.count;
        i.maxTime = Math.max(i.maxTime, s), this.performanceStats.set(t, i);
      }
    }
  }
  /**
   * 测量渲染类型的时间
   */
  measureRender(t, e) {
    if (!this.performanceEnabled) {
      e();
      return;
    }
    const i = performance.now();
    e();
    const s = performance.now() - i, o = this.currentFrameStats.get(t) || { totalTime: 0, count: 0 };
    o.totalTime += s, o.count++, this.currentFrameStats.set(t, o);
  }
  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const t = /* @__PURE__ */ new Map();
    for (const [e, i] of this.performanceStats)
      t.set(e, {
        ...i,
        avgTime: i.totalTime / i.count
      });
    return t;
  }
  /**
   * 输出性能报告到控制台
   */
  logPerformanceReport() {
    if (!this.performanceEnabled) return;
    const t = Array.from(this.performanceStats.entries()).map(([e, i]) => ({
      type: e,
      avgTime: i.totalTime / i.count,
      ...i
    })).sort((e, i) => i.avgTime - e.avgTime);
    console.group(`🎯 Renderer Performance (Frame ${this.frameCount})`), console.table(
      t.map((e) => ({
        Type: e.type,
        Calls: e.count,
        "Avg(ms)": e.avgTime.toFixed(3),
        "Max(ms)": e.maxTime.toFixed(3),
        "Total(ms)": e.totalTime.toFixed(1)
      }))
    ), console.groupEnd();
  }
  /**
   * 获取格式化的性能报告字符串
   */
  getPerformanceReport() {
    const t = [
      "=== Renderer Performance Report ===",
      `Status: ${this.performanceEnabled ? "Enabled" : "Disabled"}`,
      `Total Frames: ${this.frameCount}`
    ], e = this.frameCount || 1;
    if (this.performanceStats.size === 0)
      return t.push(""), t.push("No rendering data collected yet."), t.push("Try scrolling the table while monitoring is enabled."), t.join(`
`);
    if (this.lastFrameStats.size > 0) {
      t.push(""), t.push("=== LAST FRAME STATS (most recent frame) ==="), t.push("-".repeat(70));
      const o = Array.from(this.lastFrameStats.entries()).map(([r, a]) => ({
        type: r,
        count: a.count,
        totalTime: a.totalTime,
        avgTime: a.count > 0 ? a.totalTime / a.count : 0
      })).sort((r, a) => a.totalTime - r.totalTime);
      for (const r of o)
        t.push(
          `${r.type.padEnd(15)} | calls: ${r.count.toString().padStart(4)} | avg: ${r.avgTime.toFixed(3).padStart(7)}ms | total: ${r.totalTime.toFixed(2).padStart(6)}ms`
        );
      const n = o.reduce((r, a) => r + a.totalTime, 0);
      t.push(""), t.push(`Last frame total render time: ${n.toFixed(2)}ms`);
    }
    t.push(""), t.push("=== TOTAL STATS (all frames average) ==="), t.push("-".repeat(70));
    const i = Array.from(this.performanceStats.entries()).map(([o, n]) => ({
      type: o,
      count: n.count,
      totalTime: n.totalTime,
      maxTime: n.maxTime,
      avgTime: n.count > 0 ? n.totalTime / n.count : 0,
      callsPerFrame: Math.round(n.count / e),
      avgFrameTime: n.totalTime / e
    })).sort((o, n) => n.avgFrameTime - o.avgFrameTime);
    for (const o of i)
      t.push(
        `${o.type.padEnd(15)} | avg calls/frame: ${o.callsPerFrame.toString().padStart(4)} | avg: ${o.avgTime.toFixed(3).padStart(7)}ms | max: ${o.maxTime.toFixed(3).padStart(7)}ms | frameTotal: ${o.avgFrameTime.toFixed(2).padStart(6)}ms`
      );
    const s = i.reduce((o, n) => o + n.avgFrameTime, 0);
    return t.push(""), t.push(`Average frame render time: ${s.toFixed(2)}ms`), t.join(`
`);
  }
  /**
   * 打印性能报告到控制台
   */
  printPerformanceReport() {
    console.log(this.getPerformanceReport());
  }
  renderDropdown(t) {
    this.dropdownRenderer.renderDropdown(t);
  }
  renderTag(t, e, i, s) {
    const r = this.ctx.measureText(t).width + 4 * 2, a = s + 4 * 2, l = this.theme.colors.tagColors[t.toLowerCase()] ?? this.theme.colors.tagColors.default;
    this.ctx.fillStyle = l, this.ctx.beginPath();
    const h = 4, c = e - 4, d = i - s / 2 - 4;
    this.ctx.roundRect(c, d, r, a, h), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.fillText(t, e, i);
  }
  resolveDisabled(t, e, i) {
    return t === void 0 ? !1 : typeof t == "function" ? t(e, i) : t;
  }
  formatValue(t, e, i) {
    if (t == null)
      return "";
    if (e.formatter)
      return e.formatter(t, i, e);
    switch (e.type) {
      case "number":
        return typeof t == "number" ? t.toLocaleString() : String(t);
      case "boolean":
        return t ? "Yes" : "No";
      case "date":
        return t instanceof Date ? t.toLocaleDateString() : String(t);
      default:
        return String(t);
    }
  }
  isCellSelected(t, e, i) {
    return i.some((s) => {
      const o = Math.min(s.start.rowIndex, s.end.rowIndex), n = Math.max(s.start.rowIndex, s.end.rowIndex), r = Math.min(s.start.columnIndex, s.end.columnIndex), a = Math.max(s.start.columnIndex, s.end.columnIndex);
      return t >= o && t <= n && e >= r && e <= a;
    });
  }
  renderCenterSelections(t, e, i, s) {
    const o = this.layoutManager.getLeafColumns();
    for (const n of t) {
      const r = Math.min(n.start.rowIndex, n.end.rowIndex), a = Math.max(n.start.rowIndex, n.end.rowIndex), l = Math.min(n.start.columnIndex, n.end.columnIndex), h = Math.max(n.start.columnIndex, n.end.columnIndex), c = this.layoutManager.getCellMerge(r, l);
      let d = r, u = a, f = l, g = h;
      c && (d = c.rowIndex, u = c.rowIndex + c.rowspan - 1, f = c.columnIndex, g = c.columnIndex + c.colspan - 1);
      const m = Math.max(f, Math.min(...s)), p = Math.min(g, Math.max(...s));
      if (m > p) continue;
      const y = o[m], w = o[p];
      if (!y || !w || y.fixed || w.fixed) continue;
      const C = this.layoutManager.getRowViewportY(d, i);
      if (C === null) continue;
      const R = this.layoutManager.getRowOffset(u) + this.layoutManager.getRowHeightByIndex(u) - this.layoutManager.getRowOffset(d), v = this.layoutManager.getCellPosition(d, m), I = this.layoutManager.getCellPosition(u, p), M = I.x + I.width - v.x, S = v.x - e;
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]), this.ctx.strokeRect(S, C, M, R);
    }
  }
  renderFixedSelections(t, e, i, s) {
    for (const o of t) {
      const n = Math.min(o.start.rowIndex, o.end.rowIndex), r = Math.max(o.start.rowIndex, o.end.rowIndex), a = Math.min(o.start.columnIndex, o.end.columnIndex), l = Math.max(o.start.columnIndex, o.end.columnIndex), h = this.layoutManager.getCellMerge(n, a);
      let c = n, d = r, u = a, f = l;
      h && (c = h.rowIndex, d = h.rowIndex + h.rowspan - 1, u = h.columnIndex, f = h.columnIndex + h.colspan - 1);
      const g = this.layoutManager.getRowViewportY(c, e);
      if (g === null) continue;
      const m = this.layoutManager.getRowOffset(d) + this.layoutManager.getRowHeightByIndex(d) - this.layoutManager.getRowOffset(c);
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]);
      const p = i.filter(
        (w) => w >= u && w <= f
      );
      if (p.length > 0) {
        const w = p[0], C = p[p.length - 1], R = this.layoutManager.getCellPosition(c, w), v = this.layoutManager.getCellPosition(d, C), I = v.x + v.width - R.x;
        this.ctx.strokeRect(R.x, g, I, m);
      }
      const y = s.filter(
        (w) => w >= u && w <= f
      );
      if (y.length > 0) {
        const w = y[0], C = y[y.length - 1], R = this.layoutManager.getCellPosition(c, w), v = this.layoutManager.getCellPosition(d, C), I = v.x + v.width - R.x;
        this.ctx.strokeRect(R.x, g, I, m);
      }
    }
  }
  renderLoadingOverlay() {
    const t = this.canvas.width / this.dpr, e = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)", this.ctx.fillRect(0, 0, t, e), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(this.locale.loadingText, t / 2, e / 2), this.ctx.restore();
  }
  renderEmptyState(t, e = [], i = [], s, o = 0) {
    const n = this.canvas.width / this.dpr, r = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, n, r);
    const l = this.layoutManager.getLayoutInfo().headerHeight, h = this.layoutManager.getLeafColumns();
    if (h.length > 0) {
      const c = this.layoutManager.getFixedColumnsInfo(h), d = c.leftFixed.columns.length > 0, u = c.rightFixed.columns.length > 0, f = d ? c.leftFixed.width : 0, g = u ? c.rightFixed.width : 0;
      this.ctx.save(), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, n, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, l), this.ctx.lineTo(n, l), this.ctx.stroke();
      const m = this.layoutManager.getVisibleHeaderCells();
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(f, 0, n - f - g, l), this.ctx.clip();
      for (const p of m) {
        if (p.column.fixed === "left" || p.column.fixed === "right")
          continue;
        const y = p.x - o;
        this.renderEmptyStateHeaderCell(
          p,
          y,
          e,
          i,
          s
        );
      }
      if (this.ctx.restore(), d)
        for (const p of m)
          p.column.fixed === "left" && this.renderEmptyStateHeaderCell(
            p,
            p.x,
            e,
            i,
            s
          );
      if (u)
        for (const p of m) {
          if (p.column.fixed !== "right") continue;
          const w = n - g - (this.layoutManager.getLayoutInfo().totalWidth - g), C = p.x + w;
          this.renderEmptyStateHeaderCell(
            p,
            C,
            e,
            i,
            s
          );
        }
      this.ctx.restore();
    }
    this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(t, n / 2, l + (r - l) / 2), this.ctx.restore();
  }
  renderEmptyStateHeaderCell(t, e, i, s, o) {
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, t.y, t.width, t.height), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const n = i.find((R) => R.column === t.column.key), r = (n == null ? void 0 : n.direction) ?? "none", a = t.column.sortable !== !1, l = t.column.key === o, h = t.isLeaf && a && (r !== "none" || l), c = h ? 20 : 0, d = s.some((R) => R.column === t.column.key), u = t.isLeaf && t.column.filterable, f = u ? 20 : 0, g = 8, m = t.width - g * 2 - c - f, p = ft(t.column.title, Math.floor(m / 7)), y = t.column.align ?? "center";
    let w = e + g;
    y === "center" ? w = e + (t.width - this.ctx.measureText(p).width - c - f) / 2 : y === "right" && (w = e + t.width - g - this.ctx.measureText(p).width - c - f);
    const C = t.y + t.height / 2;
    if (this.ctx.fillText(p, w, C), t.isLeaf)
      if (u) {
        const R = e + t.width - g - 10;
        h && this.renderSortIndicator(
          R - 16,
          C,
          r === "none" ? "hover" : r
        ), this.renderFilterIndicator(R, C, d);
      } else h && this.renderSortIndicator(
        e + t.width - g - 10,
        C,
        r === "none" ? "hover" : r
      );
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, t.y, t.width, t.height);
  }
  isColumnHovered(t, e) {
    const s = this.layoutManager.getLeafColumns()[e];
    return s ? t.key === s.key : !1;
  }
  renderFixedColumnsShadow(t, e) {
    const i = this.canvas.width / this.dpr, s = this.canvas.height / this.dpr, o = 10;
    this.ctx.save();
    const n = this.ctx.createLinearGradient(
      e === "left" ? t : i - t - o,
      0,
      e === "left" ? t + o : i - t,
      0
    );
    e === "left" ? (n.addColorStop(0, "rgba(0, 0, 0, 0.15)"), n.addColorStop(1, "rgba(0, 0, 0, 0)")) : (n.addColorStop(0, "rgba(0, 0, 0, 0)"), n.addColorStop(1, "rgba(0, 0, 0, 0.15)")), this.ctx.fillStyle = n, this.ctx.fillRect(
      e === "left" ? t : i - t - o,
      0,
      o,
      s
    ), this.ctx.restore();
  }
  getCanvas() {
    return this.canvas;
  }
  getCanvasContext() {
    return this.ctx;
  }
  renderTooltip(t) {
    this.overlayRenderer.renderTooltip(t);
  }
  renderScrollbars(t, e, i, s, o) {
    this.overlayRenderer.renderScrollbars(
      t,
      e,
      i,
      s,
      o
    );
  }
  renderWatermark() {
    this.overlayRenderer.renderWatermark();
  }
  getScrollbarBounds(t, e, i, s) {
    return this.overlayRenderer.getScrollbarBounds(
      t,
      e,
      i,
      s
    );
  }
  renderFilterDropdown(t) {
    this.filterDropdownRenderer.render(t);
  }
  renderDateDropdown(t) {
    this.overlayRenderer.renderDateDropdown(t);
  }
  renderContextMenu(t) {
    this.overlayRenderer.renderContextMenu(t);
  }
  renderHeaderContextMenu(t) {
    this.overlayRenderer.renderHeaderContextMenu(t);
  }
  getRenderedRowHeight(t) {
    var e;
    return ((e = this.currentRowResizeState) == null ? void 0 : e.rowIndex) === t ? this.currentRowResizeState.displayHeight : this.layoutManager.getRowHeightByIndex(t);
  }
  renderRowResizeGuide(t) {
    if (!this.currentRowResizeState)
      return;
    const e = this.layoutManager.getRowViewportY(
      this.currentRowResizeState.rowIndex,
      this.currentScrollTop
    );
    if (e === null)
      return;
    const i = e + this.currentRowResizeState.displayHeight;
    this.ctx.save(), this.ctx.strokeStyle = this.theme.row.resizeGuideColor, this.ctx.lineWidth = this.theme.row.resizeGuideWidth, this.ctx.beginPath(), this.ctx.moveTo(0, i), this.ctx.lineTo(t, i), this.ctx.stroke(), this.ctx.restore();
  }
  renderColumnReorderIndicator(t, e, i, s) {
    const n = this.layoutManager.getLayoutInfo().headerHeight, r = this.canvas.height / this.dpr, a = this.layoutManager.getColumnByKey(t.dragColumnKey), l = a ? this.layoutManager.getColumnWidth(a) : 100, h = t.currentX - l / 2;
    this.ctx.save(), this.ctx.globalAlpha = 0.7, this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(h, 0, l, r), this.ctx.strokeStyle = this.theme.colors.button.primaryBg, this.ctx.lineWidth = 2, this.ctx.setLineDash([5, 5]), this.ctx.strokeRect(h, 0, l, r), this.ctx.setLineDash([]), t.isParentColumn && a && a.children && a.children.length > 0 ? (this.renderParentColumnGhost(a, h, n), this.renderParentColumnRowsGhost(a, h, n, e, i, s)) : a && (this.renderLeafColumnGhost(a, h, 0, n), this.renderLeafColumnRowsGhost(a, h, n, e, i, s)), this.ctx.restore();
  }
  renderParentColumnGhost(t, e, i) {
    const s = t.depth ?? 0, o = this.theme.row.headerHeight, n = s * o, r = o, a = this.layoutManager.getColumnWidth(t);
    this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.fillRect(e, n, a, r), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, n, a, r), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const l = t.title, h = this.ctx.measureText(l).width, c = e + (a - h) / 2;
    this.ctx.fillText(l, c, n + r / 2), this.renderChildColumnsGhost(t, e, s + 1, i);
  }
  renderChildColumnsGhost(t, e, i, s) {
    if (!t.children || t.children.length === 0) return;
    const o = this.theme.row.headerHeight;
    let n = e;
    for (const r of t.children) {
      const a = this.layoutManager.getColumnWidth(r);
      if (r.children && r.children.length > 0) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        const l = i * o, h = o;
        this.ctx.fillRect(n, l, a, h), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(n, l, a, h), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const c = r.title, d = this.ctx.measureText(c).width, u = n + (a - d) / 2;
        this.ctx.fillText(c, u, l + h / 2), this.renderChildColumnsGhost(r, n, i + 1, s);
      } else
        this.renderLeafColumnGhost(r, n, i, s);
      n += a;
    }
  }
  renderLeafColumnGhost(t, e, i, s) {
    const o = this.theme.row.headerHeight, n = this.layoutManager.getColumnWidth(t), r = i * o, a = s - r;
    this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.fillRect(e, r, n, a), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, r, n, a), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const l = t.title, h = this.ctx.measureText(l).width, c = e + (n - h) / 2;
    this.ctx.fillText(l, c, r + a / 2);
  }
  isDescendantOfColumn(t, e) {
    if (t.key === e || t.parentKey === e)
      return !0;
    if (t.parentKey) {
      const i = this.layoutManager.getColumnByKey(t.parentKey);
      if (i)
        return this.isDescendantOfColumn(i, e);
    }
    return !1;
  }
  renderLeafColumnRowsGhost(t, e, i, s, o, n) {
    const r = this.layoutManager.getColumnWidth(t), { startRow: a, endRow: l } = o;
    for (let h = a; h <= l; h++) {
      const c = s[h];
      if (!c) continue;
      const d = this.layoutManager.getRowOffset(h), u = this.layoutManager.getRowHeightByIndex(h), f = d - n;
      if (f + u < i || f > this.canvas.height / this.dpr)
        continue;
      this.ctx.fillStyle = this.theme.colors.rowBackground, this.ctx.fillRect(e, f, r, u), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(e, f + u), this.ctx.lineTo(e + r, f + u), this.ctx.stroke();
      const g = c.data[$(t)];
      this.renderGhostCellValue(t, c, h, g, e, f, r, u);
    }
  }
  renderParentColumnRowsGhost(t, e, i, s, o, n) {
    if (!t.children || t.children.length === 0) return;
    let r = e;
    for (const a of t.children) {
      const l = this.layoutManager.getColumnWidth(a);
      a.children && a.children.length > 0 ? this.renderParentColumnRowsGhost(
        a,
        r,
        i,
        s,
        o,
        n
      ) : this.renderLeafColumnRowsGhost(
        a,
        r,
        i,
        s,
        o,
        n
      ), r += l;
    }
  }
  renderGhostCellValue(t, e, i, s, o, n, r, a) {
    let h = {
      text: this.formatValue(s, t, e),
      type: t.type ?? "text"
    };
    if (t.render)
      try {
        const d = t.render(s, e, t, i);
        d && (h = { ...h, ...d });
      } catch (d) {
        console.error("Error rendering ghost cell:", d), h = { text: "[Error]", type: "text" };
      }
    const c = xt(t.disabled, e, t);
    this.renderCellContent(
      h,
      o,
      n,
      r,
      a,
      8,
      t.align,
      i,
      void 0,
      c
    );
  }
  // ==================== 缓存管理方法 ====================
  /**
   * 清空渲染缓存
   */
  clearRenderCache() {
    this.renderCache && this.renderCache.clear();
  }
  /**
   * 重置行 ID 管理器
   */
  resetRowIds() {
    this.renderCache && this.renderCache.resetRowIds(), this.rowIdManager.reset();
  }
  /**
   * 重置列 ID 管理器
   */
  resetColumnIds() {
    this.renderCache && this.renderCache.resetColumnIds(), this.columnIdManager.reset();
  }
  /**
   * 清理不可见行的缓存
   */
  cleanupInvisibleRows(t) {
    this.renderCache && this.renderCache.cleanupInvisibleRows(t);
  }
  /**
   * 清理不可见列的缓存
   */
  cleanupInvisibleColumns(t) {
    this.renderCache && this.renderCache.cleanupInvisibleColumns(t);
  }
  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    var t;
    return ((t = this.renderCache) == null ? void 0 : t.getStats()) ?? null;
  }
  destroy() {
    this.isDestroyed = !0, this.dirtyRegions = [], this.imageLoadQueue.destroy(), this.renderCache && this.renderCache.clear();
  }
}
const E = {
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
}, gt = class gt {
  constructor(t, e, i) {
    b(this, "layoutManager");
    b(this, "scrollState");
    b(this, "canvas");
    this.layoutManager = t, this.scrollState = e, this.canvas = i;
  }
  /**
   * Get logical canvas dimensions (CSS pixels, accounting for devicePixelRatio)
   */
  getLogicalCanvasSize() {
    const t = bt();
    return {
      width: this.canvas.width / t,
      height: this.canvas.height / t
    };
  }
  /**
   * Calculate initial dropdown position
   */
  calculate(t) {
    const { width: e, height: i, gap: s = gt.DEFAULT_GAP } = t, { width: o, height: n } = this.getLogicalCanvasSize(), r = this.calculateX(t, e, o), { anchorY: a, cellViewportY: l } = this.calculateAnchorY(t), { y: h, showAbove: c } = this.calculateInitialY(a, i, s, n);
    return { x: r, y: h, showAbove: c, anchorViewportY: a, cellViewportY: l };
  }
  /**
   * Update Y position during scroll (preserves or toggles showAbove)
   */
  updateY(t, e, i, s = gt.DEFAULT_GAP) {
    const { height: o } = this.getLogicalCanvasSize(), { anchorY: n, cellViewportY: r } = this.calculateAnchorY(t);
    let a;
    e ? a = n - s - i : a = n + s;
    let l = e;
    return e && a < 0 ? n + s + i <= o && (a = n + s, l = !1) : !e && a + i > o && n - s - i >= 0 && (a = n - s - i, l = !0), { y: a, showAbove: l, cellViewportY: r };
  }
  /**
   * Update X position during horizontal scroll
   */
  updateX(t, e) {
    const { width: i } = this.getLogicalCanvasSize();
    return this.calculateX(t, e, i);
  }
  /**
   * Calculate X position (handles fixed columns and boundary)
   */
  calculateX(t, e, i) {
    let s;
    t.anchorType === "header" ? s = this.getHeaderCellX(t.columnKey, t.column) : t.anchorType === "button" && t.buttonRelativeX !== void 0 ? s = this.getCellViewportX(t) + t.buttonRelativeX : s = this.getCellViewportX(t);
    const o = gt.EDGE_PADDING, n = t.column ?? this.getColumn(t), r = (n == null ? void 0 : n.width) ?? 100, l = s + r > o && s < i - o;
    let h = s;
    return l && (e <= i - o * 2 ? (h + e > i - o && (h = i - e - o), h < o && (h = o)) : h = (i - e) / 2), h;
  }
  /**
   * Get cell viewport X (handles fixed columns)
   */
  getCellViewportX(t) {
    const e = this.getCellPosition(t), i = t.column ?? this.getColumn(t);
    return i != null && i.fixed ? e.x : e.x - this.scrollState.scrollLeft;
  }
  /**
   * Get cell position from params
   */
  getCellPosition(t) {
    return t.cell ? this.layoutManager.getCellPosition(t.cell.rowIndex, t.cell.columnIndex) : this.layoutManager.getCellPosition(0, t.columnIndex ?? 0);
  }
  getCellViewportY(t) {
    return t.cell ? this.layoutManager.getCellViewportY(t.cell.rowIndex, this.scrollState.scrollTop) : this.layoutManager.getCellViewportY(0, this.scrollState.scrollTop);
  }
  /**
   * Get column from params
   */
  getColumn(t) {
    return t.column ? t.column : t.cell ? this.layoutManager.getLeafColumns()[t.cell.columnIndex] : this.layoutManager.getLeafColumns()[t.columnIndex ?? 0];
  }
  /**
   * Get header cell X position
   */
  getHeaderCellX(t, e) {
    if (e) {
      const i = this.layoutManager.getColumns();
      let s = 0;
      for (const o of i) {
        if (o.key === t)
          return o.fixed ? s : s - this.scrollState.scrollLeft;
        s += o.width ?? 100;
      }
    }
    return 0;
  }
  /**
   * Calculate Y anchor point based on anchor type
   */
  calculateAnchorY(t) {
    const e = this.getCellPosition(t), i = this.getCellViewportY(t);
    switch (t.anchorType) {
      case "cell":
        return {
          anchorY: i + e.height,
          // Cell bottom
          cellViewportY: i
        };
      case "cell-top":
        return {
          anchorY: i,
          // Cell top
          cellViewportY: i
        };
      case "button":
        return {
          anchorY: i + t.buttonY + t.buttonHeight,
          // Button bottom
          cellViewportY: i
        };
      case "header":
        return {
          anchorY: this.layoutManager.getLayoutInfo().headerHeight,
          cellViewportY: 0
        };
      case "custom":
        return {
          anchorY: t.customAnchorY,
          cellViewportY: t.customAnchorY
        };
      default:
        return { anchorY: 0, cellViewportY: 0 };
    }
  }
  /**
   * Calculate initial Y position with space detection
   */
  calculateInitialY(t, e, i, s) {
    let o = t + i, n = !1;
    if (o + e > s) {
      const r = t - i - e;
      r >= 0 && (o = r, n = !0);
    }
    return { y: o, showAbove: n };
  }
  /**
   * Check if cell is still visible in viewport
   */
  isCellInViewport(t) {
    const e = this.getCellPosition(t), i = this.getCellViewportY(t), s = this.layoutManager.getLayoutInfo().headerHeight, { height: o } = this.getLogicalCanvasSize();
    return i >= s && i + e.height <= o;
  }
};
// Default configuration
b(gt, "DEFAULT_GAP", 4), b(gt, "EDGE_PADDING", 8);
let Bt = gt;
class ct {
  constructor(t, e) {
    b(this, "context");
    b(this, "eventEmitter");
    b(this, "dropdownCalculator");
    this.context = t, this.eventEmitter = e, this.dropdownCalculator = new Bt(
      t.layoutManager,
      t.scrollState,
      t.canvas
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
  getCellInfo(t) {
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], s = this.rows[t.rowIndex];
    return !i || !s ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: s,
      column: i
    };
  }
  /**
   * Calculate cell viewport X position
   */
  getCellViewportX(t, e) {
    return e != null && e.fixed ? t.x : t.x - this.scrollState.scrollLeft;
  }
  getCellViewportY(t) {
    return this.layoutManager.getCellViewportY(t, this.scrollState.scrollTop);
  }
  /**
   * Update expand column key
   */
  updateExpandColumnKey(t) {
    this.context.expandColumnKey = t;
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
  getViewportCoords(t) {
    const e = this.getCanvasBounds();
    return {
      x: t.clientX - e.left,
      y: t.clientY - e.top
    };
  }
  // Dropdown position calculation methods
  /**
   * Calculate initial dropdown position
   */
  calculateDropdownPosition(t, e, i, s = "cell", o) {
    return this.dropdownCalculator.calculate({
      cell: t,
      column: (o == null ? void 0 : o.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
      width: e,
      height: i,
      anchorType: s,
      gap: o == null ? void 0 : o.gap,
      buttonRelativeX: o == null ? void 0 : o.buttonRelativeX,
      buttonY: o == null ? void 0 : o.buttonY,
      buttonHeight: o == null ? void 0 : o.buttonHeight,
      columnKey: o == null ? void 0 : o.columnKey,
      customAnchorY: o == null ? void 0 : o.customAnchorY
    });
  }
  /**
   * Update dropdown Y position during scroll
   */
  updateDropdownY(t, e, i, s) {
    return this.dropdownCalculator.updateY(
      {
        cell: t,
        column: (s == null ? void 0 : s.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
        anchorType: (s == null ? void 0 : s.anchorType) ?? "cell",
        buttonY: s == null ? void 0 : s.buttonY,
        buttonHeight: s == null ? void 0 : s.buttonHeight
      },
      e,
      i,
      s == null ? void 0 : s.gap
    );
  }
  /**
   * Update dropdown X position during horizontal scroll
   */
  updateDropdownX(t, e, i) {
    return this.dropdownCalculator.updateX(
      {
        cell: t,
        column: (i == null ? void 0 : i.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
        anchorType: (i == null ? void 0 : i.anchorType) ?? "cell",
        buttonRelativeX: i == null ? void 0 : i.buttonRelativeX
      },
      e
    );
  }
  /**
   * Check if cell is in viewport
   */
  isCellInViewport(t) {
    return this.dropdownCalculator.isCellInViewport({
      cell: t,
      column: this.layoutManager.getLeafColumns()[t.columnIndex]
    });
  }
}
class Li extends ct {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle single cell selection
   */
  handleSingleSelection(t) {
    this.state.selectedCells = [
      {
        start: t,
        end: t
      }
    ], this.eventEmitter.emit(E.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Handle range selection (shift+click)
   */
  handleRangeSelection(t) {
    if (!this.state.selectionStart) {
      this.handleSingleSelection(t);
      return;
    }
    this.state.selectedCells = [
      {
        start: this.state.selectionStart,
        end: t
      }
    ], this.eventEmitter.emit(E.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Handle toggle selection (ctrl/cmd+click)
   */
  handleToggleSelection(t) {
    const e = this.state.selectedCells.findIndex((i) => {
      const { minRow: s, maxRow: o, minCol: n, maxCol: r } = this.getNormalizedRange(i);
      return t.rowIndex >= s && t.rowIndex <= o && t.columnIndex >= n && t.columnIndex <= r;
    });
    e >= 0 ? this.state.selectedCells.splice(e, 1) : this.state.selectedCells.push({ start: t, end: t }), this.eventEmitter.emit(E.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Select all cells
   */
  selectAll() {
    const t = this.layoutManager.getLeafColumns();
    this.rows.length === 0 || t.length === 0 || (this.state.selectedCells = [
      {
        start: { rowIndex: 0, columnIndex: 0 },
        end: { rowIndex: this.rows.length - 1, columnIndex: t.length - 1 }
      }
    ], this.eventEmitter.emit(E.SELECTION_CHANGE, [...this.state.selectedCells]));
  }
  /**
   * Clear selection
   */
  clearSelection() {
    this.state.selectedCells = [], this.eventEmitter.emit(E.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Move selection by delta
   */
  moveSelection(t, e) {
    if (this.state.selectedCells.length === 0) return;
    const i = this.layoutManager.getLeafColumns(), s = this.state.selectedCells[0].start, o = J(s.rowIndex + t, 0, this.rows.length - 1), n = J(s.columnIndex + e, 0, i.length - 1), r = { rowIndex: o, columnIndex: n };
    this.handleSingleSelection(r), this.scrollToCell(r);
  }
  /**
   * Get normalized range (min/max row and column)
   */
  getNormalizedRange(t) {
    return {
      minRow: Math.min(t.start.rowIndex, t.end.rowIndex),
      maxRow: Math.max(t.start.rowIndex, t.end.rowIndex),
      minCol: Math.min(t.start.columnIndex, t.end.columnIndex),
      maxCol: Math.max(t.start.columnIndex, t.end.columnIndex)
    };
  }
  /**
   * Scroll to make a cell visible
   */
  scrollToCell(t) {
    const e = this.layoutManager.getScrollOffsetForRow(t.rowIndex), i = this.layoutManager.getScrollOffsetForColumn(t.columnIndex);
    (e !== this.scrollState.scrollTop || i !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = e, this.eventEmitter.emit(E.SCROLL, i, e));
  }
  /**
   * Check if a cell is selected
   */
  isCellSelected(t) {
    return this.state.selectedCells.some((e) => {
      const { minRow: i, maxRow: s, minCol: o, maxCol: n } = this.getNormalizedRange(e);
      return t.rowIndex >= i && t.rowIndex <= s && t.columnIndex >= o && t.columnIndex <= n;
    });
  }
  /**
   * Get selected cells as flat array
   */
  getSelectedCells() {
    const t = [];
    for (const e of this.state.selectedCells) {
      const { minRow: i, maxRow: s, minCol: o, maxCol: n } = this.getNormalizedRange(e);
      for (let r = i; r <= s; r++)
        for (let a = o; a <= n; a++)
          t.push({ rowIndex: r, columnIndex: a });
    }
    return t;
  }
}
class Wi extends ct {
  constructor(e, i, s, o) {
    super(e, i);
    b(this, "selectionHandler");
    b(this, "editingConfig");
    this.selectionHandler = s, this.editingConfig = o;
  }
  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e) {
    e.preventDefault();
    const i = this.layoutManager.getLeafColumns();
    let s;
    if (this.state.selectedCells.length > 0) {
      const a = this.state.selectedCells[0];
      s = e.key === "ArrowUp" || e.key === "ArrowLeft" ? a.start : a.end;
    } else
      s = { rowIndex: 0, columnIndex: 0 };
    let o = s.rowIndex, n = s.columnIndex;
    switch (e.key) {
      case "ArrowUp":
        o = Math.max(0, o - 1);
        break;
      case "ArrowDown":
        o = Math.min(this.rows.length - 1, o + 1);
        break;
      case "ArrowLeft":
        n = Math.max(0, n - 1);
        break;
      case "ArrowRight":
        n = Math.min(i.length - 1, n + 1);
        break;
    }
    const r = { rowIndex: o, columnIndex: n };
    this.selectionHandler.handleSingleSelection(r), this.scrollToCell(r);
  }
  /**
   * Handle Enter key
   * @returns Editing configuration if editing should start, null otherwise
   */
  handleEnterKey(e) {
    var s;
    if (this.state.selectedCells.length === 0) return null;
    e.preventDefault(), e.stopPropagation();
    const i = this.state.selectedCells[0].start;
    if (this.editingConfig.enabled !== !1) {
      const n = this.layoutManager.getLeafColumns()[i.columnIndex], r = this.rows[i.rowIndex];
      if (n && r) {
        const a = lt(n, r, i.rowIndex), l = ["checkbox", "radio", "button", "switch"];
        return a.type && l.includes(a.type) ? a.type === O.SWITCH && a.switch ? (this.editorRegistry.getStrategy(n).canEdit(i, r, n) && this.eventEmitter.emit(
          E.SWITCH_CHANGE,
          this.getCellInfo(i),
          !a.switch.checked
        ), null) : (this.toggleRowExpand(i.rowIndex), null) : !this.editorRegistry.getStrategy(n).canEdit(i, r, n) || (s = a.input) != null && s.readonly ? null : this.getEditingStartConfig(i, n, r, a);
      }
    } else
      this.toggleRowExpand(i.rowIndex);
    return null;
  }
  /**
   * Get editing start configuration for a cell
   */
  getEditingStartConfig(e, i, s, o) {
    const n = s.data[$(i)];
    if (i.editRender)
      try {
        const r = i.editRender(n, s, e.rowIndex);
        if (r) {
          const l = {
            input: "input",
            select: "select",
            tags: "tags",
            date: "date",
            checkbox: "checkbox",
            radio: "radio",
            switch: "switch"
          }[r.type];
          return { type: r.type, config: l ? r[l] : void 0 };
        }
      } catch (r) {
        console.error("Error in editRender:", r);
      }
    return o.type === O.SELECT && o.select ? { type: "select", config: o.select } : o.type === O.TAG && o.tags && o.tags.editable ? { type: "tags", config: o.tags } : o.type === O.DATE && o.date ? { type: "date", config: o.date } : o.type === O.IMAGE && o.image ? { type: "image", config: o.image } : { type: "input", config: o.input };
  }
  /**
   * Handle keyboard events while editing
   */
  handleEditingKeyDown(e) {
    if (!this.state.editingCell) return !1;
    switch (e.key) {
      case "Enter":
        return !0;
      case "Escape":
        return !0;
      case "Tab":
        return e.preventDefault(), !0;
    }
    return !1;
  }
  /**
   * Scroll to make a cell visible
   */
  scrollToCell(e) {
    const i = this.layoutManager.getScrollOffsetForRow(e.rowIndex), s = this.layoutManager.getScrollOffsetForColumn(e.columnIndex);
    (i !== this.scrollState.scrollTop || s !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = s, this.scrollState.scrollTop = i, this.eventEmitter.emit(E.SCROLL, s, i));
  }
  /**
   * Toggle row expand state
   */
  toggleRowExpand(e) {
    const i = this.rows[e];
    i && i.children && i.children.length > 0 && this.eventEmitter.emit(E.EXPAND, i, e, !i.expanded);
  }
  /**
   * Update editing config
   */
  updateEditingConfig(e) {
    this.editingConfig = e;
  }
}
const ut = class ut extends ct {
  constructor(e, i, s) {
    super(e, i);
    b(this, "editingConfig");
    this.editingConfig = s;
  }
  /**
   * Validate if a cell can be edited
   */
  validateCellForEditing(e) {
    const s = this.layoutManager.getLeafColumns()[e.columnIndex];
    if (!s) return null;
    const o = this.rows[e.rowIndex];
    return !o || !this.editorRegistry.getStrategy(s).canEdit(e, o, s) ? null : { column: s, row: o };
  }
  /**
   * Get edit configuration for a cell
   * Priority: editRender > render result > null (default logic)
   */
  getEditConfig(e, i, s) {
    const o = i.data[$(e)];
    if (e.editRender)
      try {
        const n = e.editRender(o, i, s);
        if (n) return n;
      } catch (n) {
        console.error("Error in editRender:", n);
      }
    if (e.render)
      try {
        const n = e.render(o, i, e, s);
        if (n && n.type && n.type !== O.CUSTOM && n.type !== O.BUTTON && n.type !== O.BUTTONS && n.type !== O.IMAGE && n.type !== O.PROGRESS && n.type !== O.LINK)
          return {
            type: n.type,
            input: n.input,
            select: n.select,
            tags: n.tags,
            date: n.date,
            checkbox: n.checkbox,
            radio: n.radio,
            switch: n.switch
          };
      } catch (n) {
        console.error("Error in render:", n);
      }
    return null;
  }
  /**
   * Start text/input editing
   */
  startEditing(e, i) {
    return this.validateCellForEditing(e) ? (this.state.tooltip = null, this.state.editingCell = e, this.eventEmitter.emit(E.EDIT_START, this.getCellInfo(e), i), !0) : !1;
  }
  /**
   * Start select dropdown editing
   */
  startSelectEditing(e, i) {
    var d;
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = ut.DROPDOWN_ITEM_HEIGHT, n = ut.DROPDOWN_MAX_VISIBLE, r = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * o, h = s.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
      column: s.column
    });
    return this.state.dropdown = {
      cell: e,
      config: i,
      x: c.x,
      y: c.y,
      width: h,
      scrollTop: 0,
      hoveredIndex: -1,
      showAbove: c.showAbove
    }, this.eventEmitter.emit(E.DROPDOWN_OPEN), !0;
  }
  /**
   * Start tags editing
   */
  startTagsEditing(e, i) {
    var d;
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = ut.DROPDOWN_ITEM_HEIGHT, n = ut.DROPDOWN_MAX_VISIBLE, r = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * o, h = s.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
      column: s.column
    });
    return this.state.dropdown = {
      cell: e,
      config: {
        value: i.selectedValues,
        options: (i.options ?? []).map((u) => ({
          label: u.text,
          value: u.value ?? u.text,
          disabled: u.disabled
        }))
      },
      x: c.x,
      y: c.y,
      width: h,
      scrollTop: 0,
      hoveredIndex: -1,
      type: "tags",
      tagsConfig: i,
      showAbove: c.showAbove
    }, this.eventEmitter.emit(E.DROPDOWN_OPEN), !0;
  }
  /**
   * Start date editing
   */
  startDateEditing(e, i) {
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = Math.max(s.column.width ?? 100, 280), n = 68 + 6 * 28 + 16, r = this.calculateDropdownPosition(e, o, n, "cell", {
      column: s.column
    });
    let a = null;
    i.value && (i.value instanceof Date ? a = i.value : typeof i.value == "string" && (a = new Date(i.value)));
    const l = (a == null ? void 0 : a.getFullYear()) ?? (/* @__PURE__ */ new Date()).getFullYear(), h = (a == null ? void 0 : a.getMonth()) ?? (/* @__PURE__ */ new Date()).getMonth();
    return this.state.dateDropdown = {
      cell: e,
      config: i,
      x: r.x,
      y: r.y,
      width: o,
      currentYear: l,
      currentMonth: h,
      selectedDate: a,
      hoveredDate: null,
      showAbove: r.showAbove
    }, this.eventEmitter.emit(E.DATE_DROPDOWN_OPEN), !0;
  }
  /**
   * Start image editing
   */
  startImageEditing(e, i) {
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = 64, n = 8, r = 8, a = 4, l = 60, h = o + r, c = a * o + (a - 1) * r + n * 2 + 4 + 4, d = 3, u = d * h + n * 2 - r, f = l + u, g = this.calculateDropdownPosition(e, c, f, "cell", {
      column: s.column
    }), m = i.images ?? (i.src ? [i.src] : []), p = !m || m.length <= 1 && !i.multiple;
    return this.state.imageEditor = {
      cell: e,
      x: g.x,
      y: g.y,
      images: [...m],
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows: d,
      showAbove: g.showAbove,
      isDragging: !1,
      pendingImages: [],
      isSingleImage: p
    }, this.eventEmitter.emit(E.IMAGE_EDITOR_OPEN), !0;
  }
  /**
   * Start color picker editing
   */
  startColorEditing(e, i) {
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = i.presetColors || this.getDefaultPresetColors(), n = 8, r = Math.ceil(o.length / n), a = 24, l = 4, h = 8, c = Math.max(
      s.column.width ?? 100,
      n * (a + l) + h * 2 - l
    ), d = r * (a + l) + h * 2 - l, u = this.calculateDropdownPosition(e, c, d, "cell", {
      column: s.column
    });
    return this.state.colorDropdown = {
      cell: e,
      config: i,
      x: u.x,
      y: u.y,
      width: c,
      hoveredColor: null
    }, this.eventEmitter.emit(E.COLOR_DROPDOWN_OPEN), !0;
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
  endEditing(e) {
    if (!this.state.editingCell) return;
    const i = this.state.editingCell;
    this.state.editingCell = null, e && this.eventEmitter.emit(
      E.EDIT_END,
      this.getCellInfo(i),
      this.state.editingValue
    ), this.state.editingValue = null;
  }
  /**
   * Update editing config
   */
  updateEditingConfig(e) {
    this.editingConfig = e;
  }
  /**
   * Check if editing is enabled
   */
  isEditingEnabled() {
    return this.editingConfig.enabled !== !1;
  }
  /**
   * Get editing mode
   */
  getEditingMode() {
    return this.editingConfig.mode ?? "dblclick";
  }
};
// Constants for dropdown positioning
b(ut, "DROPDOWN_ITEM_HEIGHT", 32), b(ut, "DROPDOWN_MAX_VISIBLE", 8);
let Lt = ut;
const et = class et extends ct {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle dropdown click
   */
  handleDropdownClick(t) {
    var m, p;
    if (!this.state.dropdown) return !1;
    const { x: e, y: i, width: s, scrollTop: o, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = et.DROPDOWN_ITEM_HEIGHT, u = et.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const w = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + s && c >= i && c <= i + w) {
        const C = c - i + o, R = Math.floor(C / d);
        if (R >= 0 && R < (((p = r.options) == null ? void 0 : p.length) ?? 0) && r.options) {
          const v = r.options[R];
          if (!v.disabled)
            if (r.multiple !== !1) {
              const M = [...r.selectedValues ?? []], S = v.value ?? v.text, T = M.indexOf(S);
              T >= 0 ? M.splice(T, 1) : M.push(S), this.eventEmitter.emit(
                E.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                M,
                !0
              ), this.state.dropdown.tagsConfig = {
                ...r,
                selectedValues: M
              }, this.eventEmitter.emit(E.DROPDOWN_HOVER);
            } else {
              const M = v.value ?? v.text;
              this.eventEmitter.emit(
                E.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                [M],
                !1
              );
            }
        }
        return !0;
      }
      return !1;
    }
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + s && c >= i && c <= i + g) {
      const y = c - i + o, w = Math.floor(y / d);
      if (w >= 0 && w < a.options.length) {
        const C = a.options[w];
        if (!C.disabled)
          if (a.multiple) {
            const R = Array.isArray(a.value) ? [...a.value] : [], v = C.value, I = R.indexOf(v);
            I >= 0 ? R.splice(I, 1) : R.push(v), this.eventEmitter.emit(
              E.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              R,
              !0
            ), this.state.dropdown.config = {
              ...a,
              value: R
            }, this.eventEmitter.emit(E.DROPDOWN_HOVER);
          } else
            this.eventEmitter.emit(
              E.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              C.value,
              !1
            );
      }
      return !0;
    }
    return !1;
  }
  /**
   * Handle dropdown hover
   */
  handleDropdownHover(t) {
    var m, p;
    if (!this.state.dropdown) return;
    const { x: e, y: i, width: s, scrollTop: o, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = et.DROPDOWN_ITEM_HEIGHT, u = et.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const w = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + s && c >= i && c <= i + w) {
        const C = c - i + o, R = Math.floor(C / d);
        R >= 0 && R < (((p = r.options) == null ? void 0 : p.length) ?? 0) && (this.state.dropdown.hoveredIndex = R, this.eventEmitter.emit(E.DROPDOWN_HOVER));
      } else
        this.state.dropdown.hoveredIndex = -1;
      return;
    }
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + s && c >= i && c <= i + g) {
      const y = c - i + o, w = Math.floor(y / d);
      w >= 0 && w < a.options.length && (this.state.dropdown.hoveredIndex = w, this.eventEmitter.emit(E.DROPDOWN_HOVER));
    } else
      this.state.dropdown.hoveredIndex = -1;
  }
  /**
   * Handle buttons dropdown click
   */
  handleButtonsDropdownClick(t) {
    if (!this.state.buttonsDropdown) return !1;
    const { x: e, y: i, buttons: s, cell: o } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(o))
      return this.state.buttonsDropdown = null, this.eventEmitter.emit(E.BUTTONS_DROPDOWN_CLOSE), !0;
    const n = this.getViewportCoords(t), r = n.x, a = n.y, l = et.DROPDOWN_ITEM_HEIGHT, h = s.length * l;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let c = 100;
    for (const d of s) {
      const u = d.text ?? this.locale.cell.buttonText, f = this.ctx.measureText(u).width;
      c = Math.max(c, f + 24);
    }
    if (r >= e && r <= e + c && a >= i && a <= i + h) {
      const d = a - i, u = Math.floor(d / l);
      if (u >= 0 && u < s.length) {
        const f = s[u];
        return this.state.buttonsDropdown = null, this.eventEmitter.emit(E.BUTTONS_DROPDOWN_CLOSE), this.eventEmitter.emit(E.BUTTON_CLICK, this.getCellInfo(o), f.actionKey), !0;
      }
    }
    return this.state.buttonsDropdown = null, this.eventEmitter.emit(E.BUTTONS_DROPDOWN_CLOSE), !0;
  }
  /**
   * Handle buttons dropdown hover
   */
  handleButtonsDropdownHover(t) {
    if (!this.state.buttonsDropdown) return;
    const { x: e, y: i, buttons: s } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(this.state.buttonsDropdown.cell)) {
      this.state.buttonsDropdown.hoveredIndex = -1, this.eventEmitter.emit(E.DROPDOWN_HOVER);
      return;
    }
    const o = this.getViewportCoords(t), n = o.x, r = o.y, a = et.DROPDOWN_ITEM_HEIGHT, l = s.length * a;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let h = 100;
    for (const c of s) {
      const d = c.text ?? this.locale.cell.buttonText, u = this.ctx.measureText(d).width;
      h = Math.max(h, u + 24);
    }
    if (n >= e && n <= e + h && r >= i && r <= i + l) {
      const c = r - i, d = Math.floor(c / a);
      d >= 0 && d < s.length && (this.state.buttonsDropdown.hoveredIndex = d, this.eventEmitter.emit(E.DROPDOWN_HOVER));
    } else
      this.state.buttonsDropdown.hoveredIndex = -1;
  }
  isButtonsDropdownSourceDisabled(t) {
    const e = this.layoutManager.getLeafColumns()[t.columnIndex], i = this.rows[t.rowIndex];
    return e && i ? !this.editorRegistry.getStrategy(e).canEdit({ rowIndex: t.rowIndex, columnIndex: t.columnIndex }, i, e) : !0;
  }
  /**
   * Handle filter dropdown click
   */
  handleFilterDropdownClick(t) {
    if (!this.state.filterDropdown) return !1;
    const { x: e, y: i, width: s, mode: o } = this.state.filterDropdown, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 8;
    if (o === "dateRange") {
      const g = l + 32 + 4 + 36, m = r >= e && r <= e + s && a >= i && a <= i + g;
      let p = !1;
      if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0) {
        const C = (s - l * 3) / 2, R = e + l, v = e + l + C + 8, I = i + l;
        let T = (this.state.filterDropdown.activeDateField === "startDate" ? R : v) + C / 2 - 240 / 2;
        T < e && (T = e), T + 240 > e + s && (T = e + s - 240);
        const H = I + 32 + 8;
        p = r >= T && r <= T + 240 && a >= H && a <= H + 252;
      }
      return m || p ? (this.handleDateRangeModeClick(t, r, a), !0) : !1;
    }
    const h = this.getFilterDropdownHeight();
    if (r >= e && r <= e + s && a >= i && a <= i + h) {
      switch (o) {
        case "select":
          this.handleSelectModeClick(t, r, a);
          break;
        case "search":
          this.handleSearchModeClick(t, r, a);
          break;
        case "range":
          this.handleRangeModeClick(t, r, a);
          break;
        case "boolean":
          this.handleBooleanModeClick(t, r, a);
          break;
      }
      return !0;
    }
    return !1;
  }
  /**
   * 获取筛选下拉框高度
   */
  getFilterDropdownHeight() {
    if (!this.state.filterDropdown) return 0;
    const { mode: t, options: e } = this.state.filterDropdown, i = 8, s = 4, o = 36;
    switch (t) {
      case "search":
        return i + 36 + s + o;
      case "select": {
        const n = et.DROPDOWN_ITEM_HEIGHT, r = et.DROPDOWN_MAX_VISIBLE, a = 32, l = 4, c = Math.min((e == null ? void 0 : e.length) ?? 0, r) * n;
        return i + a + l + c + l + o;
      }
      case "range":
        return i + 32 + s + o;
      case "boolean":
        return i + 32 * 3 + s + o;
      case "dateRange":
        return i + 32 + s + o;
      default:
        return 0;
    }
  }
  /**
   * 处理 select 模式点击
   */
  handleSelectModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n, options: r, scrollTop: a } = this.state.filterDropdown;
    if (!r) return;
    const l = et.DROPDOWN_ITEM_HEIGHT, h = et.DROPDOWN_MAX_VISIBLE, c = Math.min(r.length, h), d = 36, u = 32, f = c * l, g = 8, m = 4;
    if (r.length > h) {
      const C = r.length * l, R = Math.max(20, f / C * f), v = f - R, I = a / (C - f) * v, M = s + n - 6 - 2, S = o + g + u + m;
      if (e >= M && e <= M + 6 && i >= S + I && i <= S + I + R) {
        this.state.filterDropdown.isScrollbarDragging = !0, this.state.filterDropdown.scrollbarDragStartY = t.clientY, this.state.filterDropdown.scrollbarDragStartScrollTop = a;
        return;
      }
    }
    const p = o + g + u + m + f + m;
    if (i >= p && i <= p + d) {
      this.ctx.font = "14px sans-serif";
      const C = this.locale.filter.reset, R = this.locale.filter.confirm, v = this.ctx.measureText(C).width, I = this.ctx.measureText(R).width, M = s + g, S = s + n - g - I;
      if (e >= M && e <= M + v + 10) {
        this.state.filterDropdown.options && this.state.filterDropdown.options.forEach((T) => T.checked = !1), this.eventEmitter.emit(E.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= S - 10 && e <= S + I) {
        this.eventEmitter.emit(E.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
    const y = o + g + u + m;
    if (i >= y && i <= y + f) {
      const w = i - y + a, C = Math.floor(w / l);
      C >= 0 && C < r.length && (r[C].checked = !r[C].checked, this.eventEmitter.emit(E.FILTER_DROPDOWN_CHANGE));
    }
  }
  /**
   * 处理 search 模式点击
   */
  handleSearchModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n } = this.state.filterDropdown, r = 8, a = 4, l = 36, h = 36, c = o + r + l + a;
    if (i >= c && i <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = this.locale.filter.reset, f = this.locale.filter.confirm, g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, p = s + r, y = s + n - r - m;
      if (e >= p && e <= p + g + 10) {
        this.state.filterDropdown.searchValue = "", this.eventEmitter.emit(E.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= y - 10 && e <= y + m) {
        this.eventEmitter.emit(E.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 range 模式点击
   */
  handleRangeModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n } = this.state.filterDropdown, r = 8, a = 32, l = 4, h = 36, c = o + r + a + l;
    if (i >= c && i <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = this.locale.filter.reset, f = this.locale.filter.confirm, g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, p = s + r, y = s + n - r - m;
      if (e >= p && e <= p + g + 10) {
        this.state.filterDropdown.minValue = "", this.state.filterDropdown.maxValue = "", this.eventEmitter.emit(E.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= y - 10 && e <= y + m) {
        this.eventEmitter.emit(E.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 boolean 模式点击
   */
  handleBooleanModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n } = this.state.filterDropdown, r = 8, a = 4, l = 32, h = 36, c = o + r, d = l * 3;
    if (i >= c && i <= c + d) {
      const f = Math.floor((i - c) / l), g = ["all", "true", "false"];
      f >= 0 && f < 3 && (this.state.filterDropdown.boolValue = g[f], this.eventEmitter.emit(E.FILTER_DROPDOWN_CHANGE));
      return;
    }
    const u = o + r + d + a;
    if (i >= u && i <= u + h) {
      this.ctx.font = "14px sans-serif";
      const g = this.locale.filter.reset, m = this.locale.filter.confirm, p = this.ctx.measureText(g).width, y = this.ctx.measureText(m).width, w = s + r, C = s + n - r - y;
      if (e >= w && e <= w + p + 10) {
        this.state.filterDropdown.boolValue = "all", this.eventEmitter.emit(E.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= C - 10 && e <= C + y) {
        this.eventEmitter.emit(E.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 dateRange 模式点击
   */
  handleDateRangeModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n, startDate: r, endDate: a } = this.state.filterDropdown, l = 8, h = 32, c = 8, d = 4, u = 36, f = o + l, g = (n - l * 3) / 2, m = s + l, p = s + l + g + c;
    if (e >= m && e <= m + g && i >= f && i <= f + h) {
      this.state.filterDropdown.activeDateField = "startDate";
      const w = r || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (e >= p && e <= p + g && i >= f && i <= f + h) {
      this.state.filterDropdown.activeDateField = "endDate";
      const w = a || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0 && this.handleDateRangeCalendarClick(
      e,
      i,
      s,
      o,
      n,
      l,
      h,
      c
    ))
      return;
    const y = o + l + h + d;
    if (i >= y && i <= y + u) {
      this.ctx.font = "14px sans-serif";
      const C = this.locale.filter.reset, R = this.locale.filter.confirm, v = this.ctx.measureText(C).width, I = this.ctx.measureText(R).width, M = s + l, S = s + n - l - I;
      if (e >= M && e <= M + v + 10) {
        this.state.filterDropdown.startDate = null, this.state.filterDropdown.endDate = null, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= S - 10 && e <= S + I) {
        this.eventEmitter.emit(E.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * Handle calendar popover click for date range filter
   */
  handleDateRangeCalendarClick(t, e, i, s, o, n, r, a) {
    if (!this.state.filterDropdown) return !1;
    const { activeDateField: l, currentYear: h, currentMonth: c } = this.state.filterDropdown;
    if (!l || h === void 0 || c === void 0) return !1;
    const d = 40, u = 28, f = 28, g = 8, p = d + u + 6 * f + g * 2, y = 240, w = (o - n * 3) / 2, C = i + n, R = i + n + w + a, v = s + n;
    let S = (l === "startDate" ? C : R) + w / 2 - y / 2;
    S < i && (S = i), S + y > i + o && (S = i + o - y);
    const T = v + r + a;
    if (t < S || t > S + y || e < T || e > T + p)
      return !1;
    if (e >= T && e <= T + d) {
      const A = S + 20, W = S + y - 20;
      if (t >= A - 6 - 5 && t <= A + 6 + 5)
        return c === 0 ? (this.state.filterDropdown.currentYear = h - 1, this.state.filterDropdown.currentMonth = 11) : this.state.filterDropdown.currentMonth = c - 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN), !0;
      if (t >= W - 6 - 5 && t <= W + 6 + 5)
        return c === 11 ? (this.state.filterDropdown.currentYear = h + 1, this.state.filterDropdown.currentMonth = 0) : this.state.filterDropdown.currentMonth = c + 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN), !0;
    }
    const H = (y - g * 2) / 7, k = new Date(h, c, 1).getDay(), P = new Date(h, c + 1, 0).getDate(), B = T + d + u;
    for (let L = 1; L <= P; L++) {
      const A = k + L - 1, W = Math.floor(A / 7), _ = A % 7, F = S + g + _ * H, V = B + W * f;
      if (t >= F && t <= F + H && e >= V && e <= V + f) {
        const z = new Date(h, c, L);
        return l === "startDate" ? this.state.filterDropdown.startDate = z : this.state.filterDropdown.endDate = z, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_CHANGE), !0;
      }
    }
    return !0;
  }
  /**
   * Handle calendar popover hover for date range filter
   */
  handleDateRangeCalendarHover(t) {
    if (!this.state.filterDropdown) return;
    const {
      x: e,
      y: i,
      width: s,
      activeDateField: o,
      currentYear: n,
      currentMonth: r,
      hoveredDate: a
    } = this.state.filterDropdown;
    if (!o || n === void 0 || r === void 0)
      return;
    const l = this.getViewportCoords(t), h = l.x, c = l.y, d = 8, u = 32, f = 8, g = 40, m = 28, p = 28, y = 8, C = g + m + 6 * p + y * 2, R = 240, v = (s - d * 3) / 2, I = e + d, M = e + d + v + f, S = i + d;
    let D = (o === "startDate" ? I : M) + v / 2 - R / 2;
    D < e && (D = e), D + R > e + s && (D = e + s - R);
    const k = S + u + f;
    if (h < D || h > D + R || c < k || c > k + C) {
      this.state.filterDropdown.hoveredDate !== null && (this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN));
      return;
    }
    const P = (R - y * 2) / 7, L = new Date(n, r, 1).getDay(), A = new Date(n, r + 1, 0).getDate(), W = k + g + m;
    let _ = null;
    for (let z = 1; z <= A; z++) {
      const X = L + z - 1, G = Math.floor(X / 7), U = X % 7, K = D + y + U * P, tt = W + G * p;
      if (h >= K && h <= K + P && c >= tt && c <= tt + p) {
        _ = new Date(n, r, z);
        break;
      }
    }
    const F = a ? a.getTime() : null, V = _ ? _.getTime() : null;
    F !== V && (this.state.filterDropdown.hoveredDate = _, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN));
  }
  /**
   * Handle filter dropdown hover
   */
  handleFilterDropdownHover(t) {
    if (!this.state.filterDropdown) return;
    const { mode: e, x: i, y: s, width: o, options: n, scrollTop: r } = this.state.filterDropdown;
    if (e === "dateRange") {
      this.handleDateRangeCalendarHover(t);
      return;
    }
    if (e !== "select" || !n) return;
    const a = this.getViewportCoords(t), l = a.x, h = a.y, c = et.DROPDOWN_ITEM_HEIGHT, d = et.DROPDOWN_MAX_VISIBLE, u = Math.min(n.length, d), f = 36, g = u * c;
    if (n.length > d) {
      const y = n.length * c, w = Math.max(20, g / y * g), C = g - w, R = r / (y - g) * C, v = i + o - 6 - 2;
      if (l >= v && l <= v + 6 && h >= s + f + R && h <= s + f + R + w) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }
    const m = s + f;
    if (l >= i && l <= i + o && h >= m && h <= m + g) {
      const p = h - m + r, y = Math.floor(p / c);
      y >= 0 && y < n.length && (this.state.filterDropdown.hoveredIndex = y, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN));
    } else
      this.state.filterDropdown.hoveredIndex = -1;
  }
  /**
   * Update dropdown position after scroll
   */
  updateDropdownPosition() {
    var u, f;
    if (!this.state.dropdown) return;
    const { cell: t, width: e, showAbove: i } = this.state.dropdown, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) return;
    const n = et.DROPDOWN_ITEM_HEIGHT, r = et.DROPDOWN_MAX_VISIBLE;
    let a;
    this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig ? a = ((u = this.state.dropdown.tagsConfig.options) == null ? void 0 : u.length) ?? 0 : a = ((f = this.state.dropdown.config.options) == null ? void 0 : f.length) ?? 0;
    const h = Math.min(a, r) * n, c = this.updateDropdownY(t, i ?? !1, h, { column: o }), d = this.updateDropdownX(t, e, { column: o });
    this.state.dropdown.x = d, this.state.dropdown.y = c.y, this.state.dropdown.showAbove = c.showAbove, this.eventEmitter.emit(E.DROPDOWN_HOVER);
  }
  /**
   * Close all dropdowns
   */
  closeAllDropdowns() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(E.DROPDOWN_CLOSE, null)), this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_CLOSE)), this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(E.DATE_DROPDOWN_CLOSE, null)), this.state.buttonsDropdown && (this.state.buttonsDropdown = null, this.eventEmitter.emit(E.BUTTONS_DROPDOWN_CLOSE)), this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(E.COLOR_DROPDOWN_CLOSE, null));
  }
  /**
   * Update filter dropdown position
   */
  updateFilterDropdownPosition() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.layoutManager.getLeafColumns(), i = e.findIndex((a) => a.key === t);
    if (i < 0) return;
    const s = e[i];
    if (!s) return;
    const o = this.layoutManager.getCellPosition(-1, i), n = this.layoutManager.getLayoutInfo().headerHeight;
    let r;
    s.fixed === "left" || s.fixed === "right" ? r = o.x : r = o.x - this.scrollState.scrollLeft, this.state.filterDropdown.x = r, this.state.filterDropdown.y = n, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Update date dropdown position
   */
  updateDateDropdownPosition() {
    if (!this.state.dateDropdown) return;
    const { cell: t, showAbove: e } = this.state.dateDropdown, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) return;
    const o = 68 + 6 * 28 + 16, n = Math.max(s.width ?? 100, 280), r = this.updateDropdownY(t, e ?? !1, o, { column: s }), a = this.updateDropdownX(t, n, { column: s });
    this.state.dateDropdown.x = a, this.state.dateDropdown.y = r.y, this.state.dateDropdown.width = n, this.state.dateDropdown.showAbove = r.showAbove, this.eventEmitter.emit(E.DATE_DROPDOWN_OPEN);
  }
  /**
   * Update color dropdown position
   */
  updateColorDropdownPosition() {
    if (!this.state.colorDropdown) return;
    const { cell: t, config: e } = this.state.colorDropdown, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) return;
    const o = e.presetColors || this.getDefaultPresetColors(), n = 8, r = Math.ceil(o.length / n), a = 24, l = 4, h = 8, c = r * (a + l) + h * 2 - l, d = Math.max(
      s.width ?? 100,
      n * (a + l) + h * 2 - l
    ), u = this.updateDropdownY(t, !1, c, { column: s }), f = this.updateDropdownX(t, d, { column: s });
    this.state.colorDropdown.x = f, this.state.colorDropdown.y = u.y, this.state.colorDropdown.width = d, this.eventEmitter.emit(E.COLOR_DROPDOWN_OPEN);
  }
  /**
   * Update buttons dropdown position
   */
  updateButtonsDropdownPosition() {
    if (!this.state.buttonsDropdown) return;
    const { cell: t, buttonRelativeX: e, buttonY: i, buttonHeight: s, buttons: o, showAbove: n } = this.state.buttonsDropdown, a = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!a) {
      this.state.buttonsDropdown = null;
      return;
    }
    const l = et.DROPDOWN_ITEM_HEIGHT, h = o.length * l, c = this.updateDropdownY(t, n, h, {
      column: a,
      anchorType: "button",
      buttonY: i,
      buttonHeight: s
    }), d = this.updateDropdownX(t, 120, {
      column: a,
      anchorType: "button",
      buttonRelativeX: e
    });
    this.state.buttonsDropdown.x = d, this.state.buttonsDropdown.y = c.y, this.state.buttonsDropdown.showAbove = c.showAbove, this.eventEmitter.emit(E.DROPDOWN_HOVER);
  }
  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(t) {
    const e = t.getFullYear(), i = String(t.getMonth() + 1).padStart(2, "0"), s = String(t.getDate()).padStart(2, "0");
    return `${e}-${i}-${s}`;
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
  handleDateDropdownClick(t) {
    if (!this.state.dateDropdown) return !1;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, width: r, currentYear: a, currentMonth: l } = this.state.dateDropdown, h = 40, c = 28, d = 28, u = 8, g = h + c + 6 * d + u * 2;
    if (i >= o && i <= o + r && s >= n && s <= n + g) {
      const p = o + 20, y = o + r - 20;
      if (s >= n && s <= n + h) {
        if (i >= p - 6 - 5 && i <= p + 6 + 5)
          return l === 0 ? (this.state.dateDropdown.currentYear = a - 1, this.state.dateDropdown.currentMonth = 11) : this.state.dateDropdown.currentMonth = l - 1, this.eventEmitter.emit(E.DATE_DROPDOWN_OPEN), !0;
        if (i >= y - 6 - 5 && i <= y + 6 + 5)
          return l === 11 ? (this.state.dateDropdown.currentYear = a + 1, this.state.dateDropdown.currentMonth = 0) : this.state.dateDropdown.currentMonth = l + 1, this.eventEmitter.emit(E.DATE_DROPDOWN_OPEN), !0;
      }
      const w = (r - u * 2) / 7, R = new Date(a, l, 1).getDay(), v = new Date(a, l + 1, 0).getDate();
      for (let I = 1; I <= v; I++) {
        const M = R + I - 1, S = Math.floor(M / 7), T = M % 7, H = o + u + T * w, D = n + h + c + S * d;
        if (i >= H && i <= H + w && s >= D && s <= D + d) {
          const k = new Date(a, l, I), P = this.formatDate(k), B = this.state.dateDropdown.cell;
          return this.state.dateDropdown = null, this.eventEmitter.emit(E.DATE_DROPDOWN_CLOSE, null), this.eventEmitter.emit(E.DATE_SELECT, this.getCellInfo(B), P), !0;
        }
      }
      return !0;
    }
    return !1;
  }
  /**
   * Handle date dropdown hover
   */
  handleDateDropdownHover(t) {
    if (!this.state.dateDropdown) return;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, {
      x: o,
      y: n,
      width: r,
      currentYear: a,
      currentMonth: l,
      hoveredDate: h
    } = this.state.dateDropdown, c = 40, d = 28, u = 28, f = 8, m = c + d + 6 * u + f * 2;
    let p = null;
    if (i >= o && i <= o + r && s >= n && s <= n + m) {
      const C = (r - f * 2) / 7, v = new Date(a, l, 1).getDay(), I = new Date(a, l + 1, 0).getDate();
      for (let M = 1; M <= I; M++) {
        const S = v + M - 1, T = Math.floor(S / 7), H = S % 7, D = o + f + H * C, k = n + c + d + T * u;
        if (i >= D && i <= D + C && s >= k && s <= k + u) {
          p = new Date(a, l, M);
          break;
        }
      }
    }
    const y = h ? h.getTime() : null, w = p ? p.getTime() : null;
    y !== w && (this.state.dateDropdown.hoveredDate = p, this.eventEmitter.emit(E.DATE_DROPDOWN_HOVER));
  }
  /**
   * Handle color dropdown click
   */
  handleColorDropdownClick(t) {
    if (!this.state.colorDropdown) return !1;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { cell: o, config: n, x: r, y: a, width: l } = this.state.colorDropdown, h = n.presetColors || this.getDefaultPresetColors(), c = 8, d = 24, u = 4, f = 8, m = Math.ceil(h.length / c) * (d + u) + f * 2 - u;
    if (i >= r && i <= r + l && s >= a && s <= a + m) {
      const p = Math.floor((i - r - f) / (d + u)), y = Math.floor((s - a - f) / (d + u));
      if (p >= 0 && p < c && y >= 0) {
        const w = y * c + p;
        if (w >= 0 && w < h.length) {
          const C = h[w];
          return this.state.colorDropdown = null, this.eventEmitter.emit(E.COLOR_DROPDOWN_CLOSE, null), this.eventEmitter.emit(E.COLOR_CHANGE, this.getCellInfo(o), C), !0;
        }
      }
    }
    return !1;
  }
  /**
   * Handle color dropdown hover
   */
  handleColorDropdownHover(t) {
    if (!this.state.colorDropdown) return;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { config: o, x: n, y: r } = this.state.colorDropdown, a = o.presetColors || this.getDefaultPresetColors(), l = 8, h = 24, c = 4, d = 8, u = Math.floor((i - n - d) / (h + c)), f = Math.floor((s - r - d) / (h + c));
    let g = null;
    if (u >= 0 && u < l && f >= 0) {
      const m = f * l + u;
      m >= 0 && m < a.length && (g = a[m]);
    }
    this.state.colorDropdown.hoveredColor !== g && (this.state.colorDropdown.hoveredColor = g, this.eventEmitter.emit(E.COLOR_DROPDOWN_HOVER));
  }
};
b(et, "DROPDOWN_ITEM_HEIGHT", 32), b(et, "DROPDOWN_MAX_VISIBLE", 8);
let Wt = et;
const N = class N extends ct {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle image tooltip hover
   */
  handleImageTooltipHover(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: s, scrollTop: o, maxRows: n } = this.state.imageTooltip, r = this.getViewportCoords(t), a = r.x, l = r.y, h = N.IMAGE_SIZE, c = N.IMAGE_PADDING, d = N.IMAGE_GAP, u = N.IMAGES_PER_ROW, m = u * h + (u - 1) * d + c * 2 + 4 + 4, p = h + d, y = n * p + c * 2 - d, w = this.state.imageTooltip.hoveredIndex;
    if (a >= e && a <= e + m && l >= i && l <= i + y) {
      const C = Math.ceil(s.length / u), R = Math.floor(o / p), v = Math.min(C, R + n + 1);
      for (let I = R; I < v; I++)
        for (let M = 0; M < u; M++) {
          const S = I * u + M;
          if (S >= s.length) break;
          const T = e + c + M * (h + d), H = i + c + I * p - o;
          if (a >= T && a <= T + h && l >= H && l <= H + h)
            return this.state.imageTooltip.hoveredIndex = S, w !== S && this.eventEmitter.emit(E.IMAGE_TOOLTIP_SCROLL), !0;
        }
      return this.state.imageTooltip.hoveredIndex = -1, w !== -1 && this.eventEmitter.emit(E.IMAGE_TOOLTIP_SCROLL), !0;
    }
    return this.state.imageTooltip.hoveredIndex = -1, w !== -1 && this.eventEmitter.emit(E.IMAGE_TOOLTIP_SCROLL), !1;
  }
  /**
   * Handle image tooltip click
   */
  handleImageTooltipClick(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: s, cell: o, scrollTop: n, maxRows: r } = this.state.imageTooltip, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, p = f * c + (f - 1) * u + d * 2 + 4 + 4, y = c + u, w = r * y + d * 2 - u;
    if (l < e || l > e + p || h < i || h > i + w)
      return !1;
    const C = l - e - d, R = h - i - d + n, v = Math.floor(C / (c + u)), I = Math.floor(R / y);
    if (v >= 0 && v < f && I >= 0) {
      const M = I * f + v;
      if (M >= 0 && M < s.length) {
        const S = s[M];
        S && this.eventEmitter.emit(E.IMAGE_CLICK, this.getCellInfo(o), S, t);
      }
    }
    return !0;
  }
  /**
   * Handle image editor hover
   */
  handleImageEditorHover(t) {
    if (!this.state.imageEditor) return !1;
    const { x: e, y: i, images: s, pendingImages: o, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, g = N.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, p = f * c + (f - 1) * u + d * 2 + 4 + 4, y = r * m + d * 2 - u, w = g + y, C = this.state.imageEditor.hoveredIndex;
    if (l < e || l > e + p || h < i || h > i + w)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(E.IMAGE_EDITOR_HOVER), !1;
    if (h >= i && h <= i + g)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(E.IMAGE_EDITOR_HOVER), !0;
    const R = i + g, v = s.length + o.length;
    for (let I = 0; I < r + 1; I++)
      for (let M = 0; M < f; M++) {
        const S = I * f + M;
        if (S >= v) break;
        const T = e + d + M * (c + u), H = R + d + I * m - n;
        if (l >= T && l <= T + c && h >= H && h <= H + c)
          return this.state.imageEditor.hoveredIndex = S, C !== S && this.eventEmitter.emit(E.IMAGE_EDITOR_HOVER), !0;
      }
    return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(E.IMAGE_EDITOR_HOVER), !0;
  }
  /**
   * Handle image editor click
   */
  handleImageEditorClick(t) {
    var v;
    if (!this.state.imageEditor) return "outside";
    const { x: e, y: i, images: s, cell: o, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, g = N.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, p = f * c + (f - 1) * u + d * 2 + 4 + 4, y = r * m + d * 2 - u, w = g + y;
    if (l < e || l > e + p || h < i || h > i + w)
      return "outside";
    if (h >= i && h <= i + g)
      return "upload";
    const C = i + g, R = s.length + (((v = this.state.imageEditor.pendingImages) == null ? void 0 : v.length) ?? 0);
    for (let I = 0; I < r + 1; I++)
      for (let M = 0; M < f; M++) {
        const S = I * f + M;
        if (S >= R) break;
        const T = e + d + M * (c + u), H = C + d + I * m - n;
        if (l >= T && l <= T + c && h >= H && h <= H + c) {
          if (S < s.length) {
            const D = s[S];
            s.splice(S, 1), this.state.imageEditor.images = [...s], this.eventEmitter.emit(
              E.IMAGE_DELETE,
              this.getCellInfo(o),
              D,
              S
            );
          }
          return "inside";
        }
      }
    return "inside";
  }
  /**
   * Handle file upload
   */
  async handleFileUpload(t) {
    if (!this.state.imageEditor) return;
    const i = this.layoutManager.getLeafColumns()[this.state.imageEditor.cell.columnIndex];
    if (!i) return;
    const s = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!s) return;
    const n = (i.render ? i.render(
      s.data[$(i)],
      s,
      i,
      this.state.imageEditor.cell.rowIndex
    ) : { image: s.data[$(i)] }).image ?? {}, r = n.onUpload, a = n.maxCount, l = this.state.imageEditor.isSingleImage;
    let h;
    if (l)
      h = 1, this.state.imageEditor.images = [];
    else {
      const u = this.state.imageEditor.images.length + this.state.imageEditor.pendingImages.length;
      h = a !== void 0 ? a - u : t.length;
    }
    const c = t.slice(0, h), d = [];
    for (const u of c) {
      const f = await this.readFileAsDataURL(u);
      d.push({ file: u, preview: f });
    }
    if (this.state.imageEditor.pendingImages = [
      ...this.state.imageEditor.pendingImages,
      ...d
    ], this.eventEmitter.emit(E.IMAGE_EDITOR_SCROLL), r)
      for (const u of d) {
        try {
          const f = await r(u.file), g = this.state.imageEditor.pendingImages.findIndex(
            (m) => m.preview === u.preview
          );
          g >= 0 && (this.state.imageEditor.pendingImages.splice(g, 1), this.state.imageEditor.images = [...this.state.imageEditor.images, f], this.eventEmitter.emit(
            E.IMAGE_UPLOAD,
            this.getCellInfo(this.state.imageEditor.cell),
            f
          ));
        } catch (f) {
          console.error("Upload failed:", f);
          const g = this.state.imageEditor.pendingImages.findIndex(
            (m) => m.preview === u.preview
          );
          g >= 0 && this.state.imageEditor.pendingImages.splice(g, 1);
        }
        this.eventEmitter.emit(E.IMAGE_EDITOR_SCROLL);
      }
    else {
      for (const u of d) {
        const f = this.state.imageEditor.pendingImages.findIndex(
          (g) => g.preview === u.preview
        );
        f >= 0 && (this.state.imageEditor.pendingImages.splice(f, 1), this.state.imageEditor.images = [...this.state.imageEditor.images, u.preview], this.eventEmitter.emit(
          E.IMAGE_UPLOAD,
          this.getCellInfo(this.state.imageEditor.cell),
          u.preview
        ));
      }
      this.eventEmitter.emit(E.IMAGE_EDITOR_SCROLL);
    }
  }
  /**
   * Commit image editor changes
   */
  commitImageEditorChanges() {
    if (!this.state.imageEditor) return;
    const { cell: t, images: e, isSingleImage: i } = this.state.imageEditor, o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (o && n) {
      const r = n.data[$(o)];
      let a;
      if (i) {
        const l = e[0] ?? null;
        typeof r == "string" ? a = l : Array.isArray(r) ? a = { src: l } : r && typeof r == "object" ? a = {
          ...r,
          src: l
        } : a = l;
      } else
        Array.isArray(r) ? a = e : r && typeof r == "object" ? a = {
          ...r,
          images: e
        } : a = e;
      this.eventEmitter.emit(E.EDIT_END, this.getCellInfo(t), a);
    }
    this.state.imageEditor = null, this.eventEmitter.emit(E.IMAGE_EDITOR_CLOSE);
  }
  /**
   * Read file as data URL
   */
  readFileAsDataURL(t) {
    return new Promise((e, i) => {
      const s = new FileReader();
      s.onload = () => e(s.result), s.onerror = i, s.readAsDataURL(t);
    });
  }
  /**
   * Update image tooltip position after scroll
   */
  updateImageTooltipPosition() {
    if (!this.state.imageTooltip) return;
    const { cell: t, showAbove: e, maxRows: i } = this.state.imageTooltip, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) {
      this.state.imageTooltip = null;
      return;
    }
    const n = N.IMAGE_SIZE, r = N.IMAGE_PADDING, a = N.IMAGE_GAP, l = N.IMAGES_PER_ROW, h = l * n + (l - 1) * a + r * 2, c = n + a, d = i * c + r * 2 - a, u = this.updateDropdownY(t, e, d, { column: o }), f = this.updateDropdownX(t, h, { column: o });
    this.state.imageTooltip.x = f, this.state.imageTooltip.y = u.y, this.state.imageTooltip.showAbove = u.showAbove;
  }
  /**
   * Update image editor position after scroll
   */
  updateImageEditorPosition() {
    if (!this.state.imageEditor) return;
    const { cell: t, showAbove: e, maxRows: i } = this.state.imageEditor, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) {
      this.commitImageEditorChanges();
      return;
    }
    const n = N.IMAGE_SIZE, r = N.IMAGE_PADDING, a = N.IMAGE_GAP, l = N.IMAGES_PER_ROW, h = N.IMAGE_UPLOAD_AREA_HEIGHT, c = n + a, d = l * n + (l - 1) * a + r * 2 + 4 + 4, u = i * c + r * 2 - a, f = h + u, g = this.updateDropdownY(t, e, f, { column: o }), m = this.updateDropdownX(t, d, { column: o });
    this.state.imageEditor.x = m, this.state.imageEditor.y = g.y, this.state.imageEditor.showAbove = g.showAbove;
  }
  /**
   * Handle drag over event for image editor
   */
  handleDragOver(t) {
    if (!this.state.imageEditor) return !1;
    t.preventDefault();
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, maxRows: r } = this.state.imageEditor, a = N.IMAGE_SIZE, l = N.IMAGE_PADDING, h = N.IMAGE_GAP, c = N.IMAGES_PER_ROW, d = N.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    return i >= o && i <= o + f && s >= n && s <= n + m ? (this.state.imageEditor.isDragging = !0, this.eventEmitter.emit(E.IMAGE_EDITOR_SCROLL), !0) : !1;
  }
  /**
   * Handle drag leave event for image editor
   */
  handleDragLeave(t) {
    if (!this.state.imageEditor) return;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, maxRows: r } = this.state.imageEditor, a = N.IMAGE_SIZE, l = N.IMAGE_PADDING, h = N.IMAGE_GAP, c = N.IMAGES_PER_ROW, d = N.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    (i < o || i > o + f || s < n || s > n + m) && (this.state.imageEditor.isDragging = !1, this.eventEmitter.emit(E.IMAGE_EDITOR_SCROLL));
  }
  /**
   * Handle drop event for image editor
   */
  async handleDrop(t) {
    var i;
    if (!this.state.imageEditor) return !1;
    t.preventDefault(), this.state.imageEditor.isDragging = !1;
    const e = Array.from(((i = t.dataTransfer) == null ? void 0 : i.files) ?? []).filter(
      (s) => s.type.startsWith("image/")
    );
    return e.length > 0 && await this.handleFileUpload(e), this.eventEmitter.emit(E.IMAGE_EDITOR_SCROLL), !0;
  }
};
b(N, "IMAGE_SIZE", 64), b(N, "IMAGE_PADDING", 8), b(N, "IMAGE_GAP", 8), b(N, "IMAGES_PER_ROW", 4), b(N, "IMAGE_UPLOAD_AREA_HEIGHT", 60);
let At = N;
const pt = class pt extends ct {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle context menu click
   */
  handleContextMenuClick(t) {
    if (!this.state.contextMenu) return !1;
    const { x: e, y: i, row: s, items: o } = this.state.contextMenu, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 140, h = pt.DROPDOWN_ITEM_HEIGHT, c = o.length * h;
    if (r >= e && r <= e + l && a >= i && a <= i + c) {
      const d = a - i, u = Math.floor(d / h), f = o[u];
      return !f || f.disabled || (f.key === "pin-top" ? this.eventEmitter.emit(E.ROW_PIN_CHANGE, s, "top") : f.key === "pin-bottom" ? this.eventEmitter.emit(E.ROW_PIN_CHANGE, s, "bottom") : f.key === "unpin" ? this.eventEmitter.emit(E.ROW_PIN_CHANGE, s, null) : f.key === "add-above" ? this.eventEmitter.emit(E.ROW_ADD_ABOVE, s) : f.key === "add-below" ? this.eventEmitter.emit(E.ROW_ADD_BELOW, s) : f.key === "delete" && this.eventEmitter.emit(E.ROW_DELETE, s), this.state.contextMenu = null, this.eventEmitter.emit(E.CONTEXT_MENU_CLOSE)), !0;
    }
    return !1;
  }
  /**
   * Handle context menu hover
   */
  handleContextMenuHover(t) {
    if (!this.state.contextMenu) return;
    const { x: e, y: i, items: s, hoveredIndex: o } = this.state.contextMenu, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 140, h = pt.DROPDOWN_ITEM_HEIGHT, c = s.length * h;
    let d = -1;
    if (r >= e && r <= e + l && a >= i && a <= i + c) {
      const u = a - i;
      d = Math.floor(u / h);
    }
    d !== o && (this.state.contextMenu.hoveredIndex = d, this.eventEmitter.emit(E.CONTEXT_MENU_HOVER));
  }
  /**
   * Handle header context menu click
   */
  handleHeaderContextMenuClick(t) {
    if (!this.state.headerContextMenu) return !1;
    const { x: e, y: i, columnKey: s } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y;
    return n >= e && n <= e + 120 && r >= i && r <= i + 32 ? (this.eventEmitter.emit(E.COLUMN_HIDE, s), this.state.headerContextMenu = null, this.eventEmitter.emit(E.HEADER_CONTEXT_MENU_CLOSE), !0) : !1;
  }
  /**
   * Handle header context menu hover
   */
  handleHeaderContextMenuHover(t) {
    if (!this.state.headerContextMenu) return;
    const { x: e, y: i, hoveredIndex: s } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y, a = 120, l = 32;
    let h = -1;
    n >= e && n <= e + a && r >= i && r <= i + l && (h = 0), h !== s && (this.state.headerContextMenu.hoveredIndex = h, this.eventEmitter.emit(E.HEADER_CONTEXT_MENU_HOVER));
  }
  /**
   * Close context menus
   */
  closeContextMenus() {
    this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(E.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(E.HEADER_CONTEXT_MENU_CLOSE));
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
};
b(pt, "DROPDOWN_ITEM_HEIGHT", 32);
let _t = pt;
class Ai extends ct {
  constructor(e, i, s, o) {
    super(e, i);
    b(this, "sortConfig");
    b(this, "filterConfig");
    this.sortConfig = s, this.filterConfig = o;
  }
  /**
   * Handle header hover
   */
  handleHeaderHover(e, i, s) {
    const o = e.column, n = this.state.hoveredHeaderColumnKey;
    let r;
    if (o.fixed === "left")
      r = e.x;
    else if (o.fixed === "right") {
      const L = this.layoutManager.getRightFixedWidth(), W = this.layoutManager.getViewportWidth() - L - (this.layoutManager.getLayoutInfo().totalWidth - L);
      r = e.x + W;
    } else
      r = e.x - this.scrollState.scrollLeft;
    const a = e.y, l = e.width, h = e.height, c = 8, d = 10, u = 10, f = r + c, g = a + (h - u) / 2, p = o.reorderable !== !1 && i >= f && i <= f + d && s >= g && s <= g + u;
    this.state.hoveredHeaderColumnKey = o.key;
    const y = (o == null ? void 0 : o.filterable) && e.isLeaf;
    let w, C;
    y ? (w = r + l - c - 10, C = w - 16) : C = r + l - c - 10;
    const R = a + h / 2, v = 8, I = 5, M = 2, S = 4, T = R - M - I - S, H = R + M + I + S, D = C - v / 2 - S, k = C + v / 2 + S, P = e.isLeaf && y && w !== void 0 && Math.abs(i - w) < 12, B = e.isLeaf && o && o.sortable !== !1 && i >= D && i <= k && s >= T && s <= H;
    p ? this.canvas.style.cursor = "grab" : P || B ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", this.state.hoveredCell = null, this.state.tooltip = null, n !== this.state.hoveredHeaderColumnKey && this.eventEmitter.emit(E.HEADER_HOVER, this.state.hoveredHeaderColumnKey);
  }
  /**
   * Handle header mouse down
   */
  handleHeaderMouseDown(e, i) {
    const s = this.getViewportCoords(i), o = s.x, n = s.y, r = this.layoutManager.getHeaderCellAtPosition(o, n);
    if (!r) return !1;
    const a = r.column;
    if (a.reorderable === !1 || this.layoutManager.isResizeHandleAtPosition(
      o + this.scrollState.scrollLeft,
      0
    ) >= 0)
      return !1;
    let h;
    if (a.fixed === "left")
      h = r.x;
    else if (a.fixed === "right") {
      const I = this.layoutManager.getRightFixedWidth(), S = this.layoutManager.getViewportWidth() - I, T = this.layoutManager.getLayoutInfo().totalWidth, H = S - (T - I);
      h = r.x + H;
    } else
      h = r.x - this.scrollState.scrollLeft;
    const c = r.y, d = r.height, u = 8, f = 10, g = 10, m = h + u, p = c + (d - g) / 2, y = o >= m && o <= m + f && n >= p && n <= p + g;
    if (r.isLeaf && !y || !r.isLeaf && !y)
      return !1;
    let w = a.key, C = e;
    if (!r.isLeaf && a.children && a.children.length > 0) {
      const I = this.getFirstLeaf(a);
      I && (w = a.key, C = this.layoutManager.getLeafColumnIndex(I), C < 0 && (C = e));
    }
    const R = this.calculateSiblingColumns(a), v = R.findIndex((I) => I.key === a.key);
    return this.state.columnReorderState = {
      dragColumnIndex: C,
      dragColumnKey: w,
      dragStartX: o,
      currentX: o,
      targetColumnIndex: C,
      isParentColumn: !r.isLeaf,
      isFixedColumn: !!a.fixed,
      siblingColumns: R,
      dragSiblingIndex: v,
      lastSwapTime: void 0,
      lastSwapTargetKey: void 0
    }, !0;
  }
  /**
   * Handle header click (sort/filter)
   */
  handleHeaderClick(e, i) {
    const s = this.layoutManager.getLeafColumn(e);
    if (!s) return;
    this.eventEmitter.emit(E.HEADER_CLICK, s, e, i);
    const o = this.getViewportCoords(i), n = o.x, r = o.y, a = this.layoutManager.getLeafHeaderCellViewportPosition(e);
    if (!a) return;
    const l = a.x, h = a.y, c = a.width, d = a.height, u = s.filterable, f = 8;
    let g, m;
    if (u ? (g = l + c - f - 10, m = g - 16) : m = l + c - f - 10, u && g !== void 0 && Math.abs(n - g) < 12) {
      this.openFilterDropdown(s, e);
      return;
    }
    if (s.sortable === !1)
      return;
    const p = h + d / 2, y = 8, w = 5, C = 2, R = 4, v = p - C - w - R, I = p - C + R, M = p + C - R, S = p + C + w + R, T = m - y / 2 - R, H = m + y / 2 + R;
    if (n >= T && n <= H && r >= v && r <= S) {
      const k = r >= v && r <= I, P = r >= M && r <= S;
      k ? this.setSortDirection(s, "asc", i) : P ? this.setSortDirection(s, "desc", i) : this.toggleSort(s, i);
    }
  }
  /**
   * Set sort direction
   */
  setSortDirection(e, i, s) {
    const o = this.sortConfig.findIndex((r) => r.column === e.key);
    if ((o >= 0 ? this.sortConfig[o].direction : "none") === i) {
      s.shiftKey ? o >= 0 && this.sortConfig.splice(o, 1) : this.sortConfig = [], this.eventEmitter.emit(E.SORT_CHANGE, [...this.sortConfig]);
      return;
    }
    s.shiftKey ? o >= 0 ? this.sortConfig[o].direction = i : this.sortConfig.push({ column: e.key, direction: i }) : this.sortConfig = [{ column: e.key, direction: i }], this.eventEmitter.emit(E.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Toggle sort
   */
  toggleSort(e, i) {
    const s = this.sortConfig.findIndex((n) => n.column === e.key);
    let o = "asc";
    if (s >= 0) {
      const n = this.sortConfig[s].direction;
      n === "asc" ? o = "desc" : n === "desc" && (o = "none");
    }
    i.shiftKey ? s >= 0 ? o === "none" ? this.sortConfig.splice(s, 1) : this.sortConfig[s].direction = o : o !== "none" && this.sortConfig.push({ column: e.key, direction: o }) : o === "none" ? this.sortConfig = [] : this.sortConfig = [{ column: e.key, direction: o }], this.eventEmitter.emit(E.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Open filter dropdown
   */
  openFilterDropdown(e, i) {
    const s = this.layoutManager.getCellPosition(-1, i), o = this.layoutManager.getLayoutInfo().headerHeight, n = Xe(e);
    if (!n) return;
    let r;
    e.fixed === "left" || e.fixed === "right" ? r = s.x : r = s.x - this.scrollState.scrollLeft;
    const a = this.allRows.length > 0 ? this.allRows : this.rows, l = this.filterConfig.find((h) => h.column === e.key);
    switch (n) {
      case "search": {
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "search",
          x: r,
          y: o,
          width: Math.max(s.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          searchValue: (l == null ? void 0 : l.value) ?? ""
        };
        break;
      }
      case "select": {
        const h = fe(e, a, 0), c = l ? l.value : [], d = h.length === 0 && a.length > 0;
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "select",
          x: r,
          y: o,
          width: Math.max(s.width, 200),
          options: h.map((u) => ({
            label: u.label,
            value: u.value,
            checked: c.includes(u.value)
          })),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          isLoading: d
        };
        break;
      }
      case "range": {
        const h = l == null ? void 0 : l.value;
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "range",
          x: r,
          y: o,
          width: Math.max(s.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          minValue: (h == null ? void 0 : h.min) ?? "",
          maxValue: (h == null ? void 0 : h.max) ?? ""
        };
        break;
      }
      case "dateRange": {
        const h = l == null ? void 0 : l.value;
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "dateRange",
          x: r,
          y: o,
          width: Math.max(s.width, 240),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          startDate: (h == null ? void 0 : h.start) ?? null,
          endDate: (h == null ? void 0 : h.end) ?? null
        };
        break;
      }
      case "boolean": {
        const h = l == null ? void 0 : l.value;
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "boolean",
          x: r,
          y: o,
          width: Math.max(s.width, 160),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          boolValue: h ?? "all"
        };
        break;
      }
    }
    this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Calculate sibling columns for reorder
   */
  calculateSiblingColumns(e) {
    const i = [], s = this.scrollState.scrollLeft;
    let o = [];
    if (e.parentKey) {
      const l = this.layoutManager.getColumnByKey(e.parentKey);
      l && l.children && (o = l.children);
    } else
      o = this.layoutManager.getColumns().filter((h) => h.reorderable === !1 ? !1 : h.fixed === e.fixed);
    const n = this.layoutManager.getLeftFixedWidth(), r = this.layoutManager.getRightFixedWidth(), a = this.layoutManager.getViewportWidth();
    for (const l of o) {
      const h = this.getChildLeafCount(l), c = this.getFirstLeaf(l), d = c ? this.layoutManager.getLeafColumnIndex(c) : -1;
      if (d < 0) continue;
      const u = this.layoutManager.getColumnWidth(l), f = l.fixed;
      let g = 0;
      if (f === "left")
        for (let m = 0; m < d; m++) {
          const p = this.layoutManager.getLeafColumn(m);
          (p == null ? void 0 : p.fixed) === "left" && (g += this.layoutManager.getColumnWidthByIndex(m));
        }
      else if (f === "right") {
        g = a - r;
        for (let m = 0; m < d; m++) {
          const p = this.layoutManager.getLeafColumn(m);
          (p == null ? void 0 : p.fixed) === "right" && (g += this.layoutManager.getColumnWidthByIndex(m));
        }
      } else {
        g = n;
        for (let m = 0; m < d; m++) {
          const p = this.layoutManager.getLeafColumn(m);
          p != null && p.fixed || (g += this.layoutManager.getColumnWidthByIndex(m));
        }
        g -= s;
      }
      i.push({
        key: l.key,
        left: g,
        right: g + u,
        center: g + u / 2,
        width: u,
        leafCount: h,
        firstLeafIndex: d,
        fixed: f || !1
      });
    }
    return i;
  }
  /**
   * Get first leaf column from a column (possibly parent)
   */
  getFirstLeaf(e) {
    return !e.children || e.children.length === 0 ? e : this.getFirstLeaf(e.children[0]);
  }
  /**
   * Get child leaf count for a column
   */
  getChildLeafCount(e) {
    if (!e.children || e.children.length === 0)
      return 1;
    let i = 0;
    for (const s of e.children)
      i += this.getChildLeafCount(s);
    return i;
  }
  /**
   * Update sort config reference
   */
  updateSortConfig(e) {
    this.sortConfig = e;
  }
  /**
   * Update filter config reference
   */
  updateFilterConfig(e) {
    this.filterConfig = e;
  }
}
class _i extends ct {
  constructor(e, i) {
    super(e, i);
    /**
     * Handle expand icon click
     */
    b(this, "handleExpandIconClick", (e, i, s) => {
      const o = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), a = this.layoutManager.getLeafColumns()[e.columnIndex], l = i.clientX - o.left, h = this.getCellViewportX(n, a), c = l - h, d = s.level ?? 0, u = 8, f = 8, g = d * 16, m = u + g, p = m + f + 4;
      return c >= m && c <= p ? (this.eventEmitter.emit(E.EXPAND, s, e.rowIndex, !s.expanded), !0) : !1;
    });
  }
  /**
   * Handle progress bar click
   */
  handleProgressClick(e, i, s, o, n) {
    if (!s.interactive || n && o && !this.editorRegistry.getStrategy(o).canEdit(e, n, o))
      return !1;
    const r = this.canvas.getBoundingClientRect(), a = i.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = s.shape ?? "line";
    if (c === "line") {
      const u = s.size ?? "medium", f = s.height ?? (u === "small" ? 6 : u === "large" ? 16 : 10), g = s.textPosition ?? "right", p = (s.showText ?? !0) && g === "right" ? 40 : 0, y = s.width ?? l.width - 8 * 2 - p, w = h + 8, C = this.getCellViewportY(e.rowIndex) + (l.height - f) / 2, R = i.clientY - r.top, v = a - w, I = R - C;
      if (v >= 0 && v <= y && I >= 0 && I <= f) {
        const M = s.precision ?? 0, S = Math.max(0, Math.min(100, v / y * 100)), T = M === 0 ? Math.round(S) : Number(S.toFixed(M));
        return this.eventEmitter.emit(E.PROGRESS_CHANGE, this.getCellInfo(e), T), !0;
      }
    } else if (c === "circle" || c === "dashboard") {
      const d = i.clientY - r.top, u = this.getCellViewportY(e.rowIndex), f = s.size ?? "medium";
      let g, m = 0;
      c === "circle" ? g = f === "small" ? 0.6 : f === "large" ? 0.9 : 0.75 : (g = f === "small" ? 0.7 : f === "large" ? 0.95 : 0.85, m = l.height * 0.05);
      const p = Math.floor(l.height * g), y = s.width ?? p, w = s.strokeWidth ?? Math.max(2, Math.round(y * 0.12)), C = (y - w) / 2, R = h + l.width / 2, v = u + l.height / 2 + m, I = a - R, M = d - v, S = Math.sqrt(I * I + M * M);
      if (S >= C - w && S <= C + w) {
        let T = Math.atan2(M, I), H;
        if (c === "circle")
          T = T + Math.PI / 2, T < 0 && (T += Math.PI * 2), H = T / (Math.PI * 2) * 100;
        else {
          const k = Math.PI * 0.75, P = Math.PI * 1.5;
          T < 0 && (T += Math.PI * 2);
          let B = T - k;
          if (B < 0 && (B += Math.PI * 2), B > P) return !1;
          H = B / P * 100;
        }
        H = Math.max(0, Math.min(100, H));
        const D = s.precision ?? 0;
        return H = D === 0 ? Math.round(H) : Number(H.toFixed(D)), this.eventEmitter.emit(E.PROGRESS_CHANGE, this.getCellInfo(e), H), !0;
      }
    }
    return !1;
  }
  /**
   * Handle rating click
   */
  handleRatingClick(e, i, s, o, n) {
    if (n && o && !this.editorRegistry.getStrategy(o).canEdit(e, n, o))
      return !1;
    const r = this.canvas.getBoundingClientRect(), a = i.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = a - h, d = s.max ?? 5, u = s.starSize ?? 16, f = s.allowHalf ?? !1, g = s.value ?? 0, m = d * u, p = (l.width - m) / 2, y = (l.height - u) / 2, w = i.clientY - r.top, C = l.y - this.context.scrollState.scrollTop, R = w - C;
    if (R < y || R > y + u) return !1;
    for (let v = 0; v < d; v++) {
      const I = p + v * u;
      if (c >= I && c <= I + u) {
        let M;
        return f ? (c - I < u / 2 ? M = v + 0.5 : M = v + 1, M === g && (M = 0)) : (M = v + 1, M === g && (M = 0)), M = Math.min(M, d), this.eventEmitter.emit(E.RATING_CHANGE, this.getCellInfo(e), M), !0;
      }
    }
    return !1;
  }
  /**
   * Get clicked radio option
   */
  getClickedRadioOption(e, i, s) {
    const o = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), a = this.layoutManager.getLeafColumns()[e.columnIndex], l = i.clientX - o.left, h = i.clientY - o.top, c = this.getCellViewportX(n, a), d = l - c, u = h - this.getCellViewportY(e.rowIndex), f = 8, g = 16, m = 4, p = n.width - f;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let y = f;
    for (let w = 0; w < s.length; w++) {
      const C = s[w], R = this.ctx.measureText(C.label).width, v = g + m + R + f;
      if (y + v - f > p)
        break;
      const I = y, M = (n.height - g) / 2, S = M + g / 2, T = d >= I && d <= I + g && u >= M && u <= M + g, H = I + g + m, D = d >= H && d <= H + R && u >= S - 10 && u <= S + 10;
      if (T || D)
        return C;
      y += v;
    }
    return null;
  }
}
class Ni extends ct {
  constructor(e, i) {
    super(e, i);
    b(this, "buttonHoverAnimationRunning", !1);
    b(this, "switchAnimationRunning", !1);
    b(this, "isDestroyed", !1);
  }
  /**
   * Set destroyed state
   */
  setDestroyed(e) {
    this.isDestroyed = e;
  }
  /**
   * Start button hover animation loop
   */
  startButtonHoverAnimationLoop() {
    this.buttonHoverAnimationRunning || (this.buttonHoverAnimationRunning = !0, this.runButtonHoverAnimationLoop());
  }
  /**
   * Run button hover animation loop
   */
  runButtonHoverAnimationLoop() {
    if (!this.buttonHoverAnimationRunning || this.isDestroyed) return;
    const e = 150, i = Date.now();
    let s = !1;
    this.state.buttonHoverStates.forEach((o, n) => {
      const r = i - o.startTime, a = Math.abs(o.targetProgress - o.startProgress);
      if (a === 0) {
        this.state.buttonHoverStates.delete(n);
        return;
      }
      const l = e * a;
      let h = r / l;
      h = Math.max(0, Math.min(1, h));
      const c = o.startProgress + (o.targetProgress - o.startProgress) * h;
      o.progress = c, h >= 1 ? o.targetProgress === 0 && this.state.buttonHoverStates.delete(n) : s = !0;
    }), this.eventEmitter.emit(E.BUTTON_HOVER_ANIMATION_UPDATE), s ? requestAnimationFrame(() => this.runButtonHoverAnimationLoop()) : this.buttonHoverAnimationRunning = !1;
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
    this.switchAnimationRunning || (this.switchAnimationRunning = !0, this.runSwitchAnimationLoop());
  }
  /**
   * Run switch animation loop
   */
  runSwitchAnimationLoop() {
    if (!this.switchAnimationRunning || this.isDestroyed) return;
    const e = 200, i = Date.now();
    let s = !1;
    this.state.switchAnimations.forEach((o, n) => {
      const r = i - o.startTime, a = Math.abs(o.targetProgress - o.startProgress), l = e * a;
      let h = r / l;
      h = Math.max(0, Math.min(1, h));
      const c = o.startProgress + (o.targetProgress - o.startProgress) * h;
      o.progress = c, h >= 1 ? this.state.switchAnimations.delete(n) : s = !0;
    }), this.eventEmitter.emit(E.SWITCH_ANIMATION_UPDATE), s ? requestAnimationFrame(() => this.runSwitchAnimationLoop()) : this.switchAnimationRunning = !1;
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
    this.state.switchAnimations.clear(), this.state.buttonHoverStates.clear(), this.switchAnimationRunning = !1, this.buttonHoverAnimationRunning = !1;
  }
}
const oe = 64;
class Fi extends ct {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Get image size constant
   */
  static get IMAGE_SIZE() {
    return oe;
  }
  /**
   * Check and show tooltip for cell content
   */
  checkTooltip(t) {
    if (!t || t.rowIndex < 0) {
      this.state.tooltip = null;
      return;
    }
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], s = this.rows[t.rowIndex];
    if (!i || !s) {
      this.state.tooltip = null;
      return;
    }
    const o = lt(i, s, t.rowIndex), n = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), r = this.getCellViewportX(n, i), a = this.getCellViewportY(t.rowIndex);
    if (o.type === O.TAG && o.tags) {
      this.handleTagsTooltip(t, o.tags, n, r);
      return;
    }
    if (o.type === O.SELECT && o.select) {
      this.handleSelectTooltip(t, o.select, n, r);
      return;
    }
    if (o.type === O.IMAGE && o.image) {
      this.handleImageTooltip(t, o.image, n, r, a);
      return;
    }
    if (o.text) {
      this.handleTextTooltip(t, o.text, n, r);
      return;
    }
    this.state.tooltip = null;
  }
  checkSummaryTooltip(t) {
    if (!t || t.band !== "summary-top" && t.band !== "summary-bottom") {
      this.state.tooltip = null;
      return;
    }
    const e = t.row, i = e.cells.find(
      (d) => t.columnIndex >= d.startColumnIndex && t.columnIndex <= d.endColumnIndex
    );
    if (!i) {
      this.state.tooltip = null;
      return;
    }
    const s = i.renderResult.text;
    if (!s) {
      this.state.tooltip = null;
      return;
    }
    const o = this.getSummaryCellRect(
      e,
      t.band,
      i.startColumnIndex,
      i.endColumnIndex
    );
    if (!o) {
      this.state.tooltip = null;
      return;
    }
    const n = 8, r = o.width - n * 2, l = this.getFontSize() * 1.5, h = Ht(o.height, l, n);
    if (!(h > 1 ? kt(this.ctx, s, r, h).isTruncated : this.ctx.measureText(s).width > r)) {
      this.state.tooltip = null;
      return;
    }
    this.state.tooltip = {
      cell: { rowIndex: -1, columnIndex: i.startColumnIndex },
      x: o.x,
      y: o.y,
      width: o.width,
      content: { type: "text", text: s }
    };
  }
  getSummaryCellRect(t, e, i, s) {
    const o = this.layoutManager.getRowBandsForRender(), n = e === "summary-top" ? o.summaryTop : o.summaryBottom, r = n.rows.indexOf(t);
    if (r < 0) return null;
    const a = this.layoutManager.getColumnOffset(i), l = this.layoutManager.getColumnOffset(s) + this.layoutManager.getColumnWidthByIndex(s), h = this.layoutManager.getLeafColumn(i), c = h != null && h.fixed ? a : a - this.scrollState.scrollLeft, d = n.y + n.rows.slice(0, r).reduce((u, f) => u + f.height, 0);
    return {
      x: c,
      y: d,
      width: l - a,
      height: t.height
    };
  }
  /**
   * Handle tags tooltip
   */
  handleTagsTooltip(t, e, i, s) {
    const o = this.getFontSize(), { isTruncated: n } = de(this.ctx, e, i.width, i.height, o);
    if (!n) {
      this.state.tooltip = null;
      return;
    }
    this.state.tooltip = {
      cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
      x: s,
      y: this.getCellViewportY(t.rowIndex),
      width: i.width,
      content: { type: "tags", tags: e.tags }
    };
  }
  /**
   * Handle select tooltip
   */
  handleSelectTooltip(t, e, i, s) {
    const r = i.width - 16 - 20;
    let a = "";
    const l = e.value;
    if (e.multiple && Array.isArray(l))
      l.length > 0 && (a = l.map((c) => {
        const d = e.options.find((u) => u.value === c);
        return (d == null ? void 0 : d.label) ?? String(c);
      }).join(", "));
    else if (l != null) {
      const h = e.options.find((c) => c.value === l);
      a = (h == null ? void 0 : h.label) ?? String(l);
    }
    if (a && this.ctx.measureText(a).width > r) {
      this.state.tooltip = {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        x: s,
        y: this.getCellViewportY(t.rowIndex),
        width: i.width,
        content: { type: "text", text: a }
      };
      return;
    }
    this.state.tooltip = null;
  }
  /**
   * Handle image tooltip (preview dropdown)
   */
  handleImageTooltip(t, e, i, s, o) {
    const n = e.images;
    if (!n || n.length <= 1) {
      this.state.tooltip = null;
      return;
    }
    const r = this.canvas.getBoundingClientRect(), a = oe, l = 8, h = 8, c = 4, d = Math.ceil(n.length / c);
    let u;
    d <= 1 ? u = 1 : d <= 2 ? u = 2 : u = 3;
    const f = c * a + (c - 1) * h + l * 2, g = a + h, m = u * g + l * 2 - h;
    let p = o + i.height, y = !1;
    p + m > r.height && (p = o - m, y = !0);
    let w = s;
    w + f > r.width && (w = r.width - f - 4), w < 0 && (w = 4), this.state.imageTooltip = {
      cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
      x: w,
      y: p,
      images: n,
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows: u,
      showAbove: y
    };
  }
  /**
   * Handle text tooltip
   */
  handleTextTooltip(t, e, i, s) {
    const n = i.width - 16, a = this.getFontSize() * 1.5, l = Ht(i.height, a, 8);
    if (l > 1 ? kt(this.ctx, e, n, l).isTruncated : this.ctx.measureText(e).width > n) {
      this.state.tooltip = {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        x: s,
        y: this.getCellViewportY(t.rowIndex),
        width: i.width,
        content: { type: "text", text: e }
      };
      return;
    }
    this.state.tooltip = null;
  }
  getFontSize() {
    const t = this.ctx.font.match(/(\d+(?:\.\d+)?)px/);
    return t ? Number(t[1]) : 13;
  }
  /**
   * Update tooltip position on scroll
   */
  updateTooltipPosition() {
    if (!this.state.tooltip) return;
    const { cell: t } = this.state.tooltip, i = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!i) return;
    const s = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let o;
    i.fixed === "left" || i.fixed === "right" ? o = s.x : o = s.x - this.scrollState.scrollLeft;
    const n = this.getCellViewportY(t.rowIndex);
    this.state.tooltip.x = o, this.state.tooltip.y = n, this.state.tooltip.width = s.width;
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
const q = class q {
  constructor(t, e, i, s, o, n, r = nt, a) {
    b(this, "state");
    b(this, "scrollState");
    b(this, "scrollbarState");
    b(this, "layoutManager");
    b(this, "eventEmitter");
    b(this, "canvas");
    b(this, "ctx");
    b(this, "editingConfig");
    b(this, "dataManager");
    b(this, "sortConfig", []);
    b(this, "filterConfig", []);
    b(this, "expandColumnKey", null);
    b(this, "isDestroyed", !1);
    // Handler instances
    b(this, "editingHandler");
    b(this, "dropdownHandler");
    b(this, "selectionHandler");
    b(this, "navigationHandler");
    b(this, "contextMenuHandler");
    b(this, "imageHandler");
    b(this, "headerHandler");
    b(this, "controlClickHandler");
    b(this, "buttonAnimationHandler");
    b(this, "tooltipHandler");
    b(this, "resizeColumnIndex", -1);
    b(this, "resizeStartX", 0);
    b(this, "resizeStartWidth", 0);
    // 用于检测双击，防止双击时触发 link 跳转
    b(this, "_lastClickTime", 0);
    b(this, "_lastClickCell", null);
    b(this, "getScrollbarBounds", () => ({ vertical: null, horizontal: null }));
    // 懒加载相关
    b(this, "lazyLoadEnabled", !1);
    b(this, "lazyLoadThreshold", 5);
    b(this, "isLoadingMore", !1);
    b(this, "hasMoreData", !0);
    // 是否还有更多数据
    b(this, "rowHeightResizeEnabled", !1);
    b(this, "rowResizable", !0);
    b(this, "enableRowPinning", !1);
    b(this, "rowPinnable", !0);
    b(this, "locale");
    b(this, "handlerContext", null);
    b(this, "editorRegistry");
    /** 校验失败时阻止下拉关闭的回调（调用实际 validation hook） */
    b(this, "shouldBlockDropdownClose", null);
    /** 校验失败时阻止关闭编辑态的回调（调用实际 commit/validation hook）
     * 接收 mousedown 事件以便在 DOM 编辑器场景下 preventDefault 阻止焦点转移 */
    b(this, "shouldBlockEditingClose", null);
    b(this, "handleMouseDown", async (t) => {
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      if (this.state.contextMenu) {
        if (this.contextMenuHandler.handleContextMenuClick(t)) return;
        this.state.contextMenu = null, this.eventEmitter.emit(E.CONTEXT_MENU_CLOSE);
        return;
      }
      if (this.state.headerContextMenu) {
        if (this.contextMenuHandler.handleHeaderContextMenuClick(t)) return;
        this.state.headerContextMenu = null, this.eventEmitter.emit(E.HEADER_CONTEXT_MENU_CLOSE);
        return;
      }
      if (this.state.filterDropdown) {
        if (this.dropdownHandler.handleFilterDropdownClick(t)) return;
        this.state.filterDropdown = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_CLOSE);
        return;
      }
      if (this.state.dateDropdown) {
        if (this.dropdownHandler.handleDateDropdownClick(t) || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const r = this.state.dateDropdown.cell;
        this.state.dateDropdown = null, this.eventEmitter.emit(E.DATE_DROPDOWN_CLOSE, r);
        return;
      }
      if (this.state.colorDropdown) {
        if (this.dropdownHandler.handleColorDropdownClick(t) || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const r = this.state.colorDropdown.cell;
        this.state.colorDropdown = null, this.eventEmitter.emit(E.COLOR_DROPDOWN_CLOSE, r);
        return;
      }
      if (this.state.dropdown) {
        if (this.dropdownHandler.handleDropdownClick(t)) return;
        const r = this.state.dropdown.cell;
        if (this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(r))
          return;
        this.state.dropdown = null, this.eventEmitter.emit(E.DROPDOWN_CLOSE, r);
        return;
      }
      if (this.state.buttonsDropdown) {
        if (this.dropdownHandler.handleButtonsDropdownClick(t)) return;
        this.state.buttonsDropdown = null;
        return;
      }
      if (this.state.imageTooltip) {
        if (this.imageHandler.handleImageTooltipClick(t)) return;
        this.state.imageTooltip = null;
      }
      if (this.state.imageEditor) {
        const n = this.imageHandler.handleImageEditorClick(t);
        if (n === "upload") {
          this.triggerFileInput();
          return;
        }
        if (n === "inside")
          return;
        this.imageHandler.commitImageEditorChanges();
        return;
      }
      const o = this.layoutManager.hitTest(i, s, this.getScrollbarBounds());
      switch (o.region) {
        case "scrollbar-vertical":
          this.scrollbarState.verticalDragging = !0, this.scrollbarState.dragStartY = t.clientY, this.scrollbarState.dragStartScrollTop = this.scrollState.scrollTop, this.canvas.style.cursor = "grabbing", this.bindDocumentEvents();
          return;
        case "scrollbar-horizontal":
          this.scrollbarState.horizontalDragging = !0, this.scrollbarState.dragStartX = t.clientX, this.scrollbarState.dragStartScrollLeft = this.scrollState.scrollLeft, this.canvas.style.cursor = "grabbing", this.bindDocumentEvents();
          return;
        case "header":
          if (o.isResizeHandle && o.resizeColumnIndex !== void 0) {
            this.state.isDragging = !0, this.state.dragType = "column-resize", this.resizeColumnIndex = o.resizeColumnIndex, this.resizeStartX = t.clientX, this.resizeStartWidth = this.layoutManager.getColumnWidthByIndex(
              o.resizeColumnIndex
            ), this.canvas.style.cursor = "col-resize";
            return;
          }
          o.headerCell && (this.headerHandler.handleHeaderMouseDown(
            o.headerCell.colIndex ?? -1,
            t
          ) || this.headerHandler.handleHeaderClick(o.headerCell.colIndex ?? -1, t));
          return;
        case "cell":
          const n = !!this.state.editingCell;
          if (n && this.shouldBlockEditingClose && await this.shouldBlockEditingClose(t))
            return;
          const r = n;
          if (this.rowHeightResizeEnabled && o.isRowResizeHandle && o.resizeRowIndex !== void 0 && this.isRowResizable(o.resizeRowIndex)) {
            if (!this.rows[o.resizeRowIndex]) return;
            const l = this.layoutManager.getRowHeightByIndex(o.resizeRowIndex);
            this.state.isDragging = !0, this.state.dragType = "row-resize", this.state.rowResizeState = {
              rowIndex: o.resizeRowIndex,
              startY: t.clientY,
              startHeight: l,
              displayHeight: l
            }, this.canvas.style.cursor = "ns-resize", this.bindDocumentEvents();
            return;
          }
          if (o.cell && this.handleControlClick(o.cell, t))
            return;
          if (o.cell) {
            t.shiftKey && this.state.selectedCells.length > 0 ? this.selectionHandler.handleRangeSelection(o.cell) : t.ctrlKey || t.metaKey ? this.selectionHandler.handleToggleSelection(o.cell) : (this.selectionHandler.handleSingleSelection(o.cell), r || (this.state.isSelecting = !0, this.state.selectionStart = o.cell));
            const a = this.getCellInfo(o.cell);
            a && this.eventEmitter.emit(E.CELL_CLICK, a, t);
          }
          return;
        case "outside":
          return;
      }
    });
    b(this, "handleDragOver", (t) => {
      this.imageHandler.handleDragOver(t);
    });
    b(this, "handleDragLeave", (t) => {
      this.imageHandler.handleDragLeave(t);
    });
    b(this, "handleDrop", async (t) => {
      await this.imageHandler.handleDrop(t);
    });
    b(this, "handleContextMenu", async (t) => {
      if (t.preventDefault(), this.shouldBlockEditingClose && await this.shouldBlockEditingClose(t))
        return;
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(E.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(E.HEADER_CONTEXT_MENU_CLOSE)), this.closeAllDropdowns();
      const n = this.layoutManager.getLayoutInfo().headerHeight;
      if (s <= n) {
        const m = this.layoutManager.getHeaderCellAtPosition(i, s);
        if (m) {
          const p = m.column;
          if (p.hideable === !1) return;
          const y = this.canvas.getBoundingClientRect(), w = 120, C = 32;
          let R = i, v = s;
          R + w > y.width && (R = y.width - w - 8), R < 0 && (R = 8), v + C > y.height && (v = y.height - C - 8), this.state.headerContextMenu = {
            x: R,
            y: v,
            columnKey: p.key,
            columnIndex: m.colIndex,
            hoveredIndex: -1
          }, this.eventEmitter.emit(E.HEADER_CONTEXT_MENU_OPEN);
          return;
        }
        return;
      }
      const r = this.layoutManager.getRowHitAtViewportPosition(
        i,
        s,
        this.scrollState.scrollTop
      );
      if (!r || r.band === "summary-top" || r.band === "summary-bottom") return;
      const a = r.row, l = this.getRowContextMenuItems(a), h = this.canvas.getBoundingClientRect(), c = 140, d = q.DROPDOWN_ITEM_HEIGHT, u = l.length * d;
      let f = i, g = s;
      f + c > h.width && (f = h.width - c - 8), f < 0 && (f = 8), g + u > h.height && (g = h.height - u - 8), g < 0 && (g = 8), this.state.contextMenu = {
        x: f,
        y: g,
        row: a,
        hoveredIndex: -1,
        items: l
      }, this.eventEmitter.emit(E.CONTEXT_MENU_OPEN);
    });
    b(this, "handleDocumentMouseMove", (t) => {
      var e;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { min: i, max: s } = this.layoutManager.getRowHeightBounds(), o = t.clientY - this.state.rowResizeState.startY;
        this.state.rowResizeState.displayHeight = J(
          this.state.rowResizeState.startHeight + o,
          i,
          s
        ), this.eventEmitter.emit(E.ROW_RESIZE_DRAG);
        return;
      }
      if ((e = this.state.filterDropdown) != null && e.isScrollbarDragging) {
        const { options: i, scrollbarDragStartY: s, scrollbarDragStartScrollTop: o } = this.state.filterDropdown;
        if (!i) return;
        const n = q.DROPDOWN_ITEM_HEIGHT, r = q.DROPDOWN_MAX_VISIBLE, l = Math.min(i.length, r) * n, h = i.length * n, c = Math.max(20, l / h * l), d = l - c, f = (t.clientY - (s ?? 0)) / d, g = h - l, m = (o ?? 0) + f * g;
        this.state.filterDropdown.scrollTop = J(m, 0, g), this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
        return;
      }
      if (this.scrollbarState.verticalDragging) {
        const i = this.layoutManager.getLayoutInfo(), s = i.headerHeight, o = this.canvas.height / (window.devicePixelRatio || 1), n = o - s, r = Math.max(30, o / i.totalHeight * n), a = n - r, h = (t.clientY - this.scrollbarState.dragStartY) / a, c = this.scrollbarState.dragStartScrollTop + h * this.scrollState.maxScrollTop;
        this.scrollState.scrollTop = J(c, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
          E.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
      if (this.scrollbarState.horizontalDragging) {
        const i = this.layoutManager.getLayoutInfo(), s = this.canvas.width / (window.devicePixelRatio || 1), o = Math.max(30, s / i.totalWidth * s), n = s - o, a = (t.clientX - this.scrollbarState.dragStartX) / n, l = this.scrollbarState.dragStartScrollLeft + a * this.scrollState.maxScrollLeft;
        this.scrollState.scrollLeft = J(l, 0, this.scrollState.maxScrollLeft), this.eventEmitter.emit(
          E.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
    });
    b(this, "handleDocumentMouseUp", () => {
      var t;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, s = this.rows[e];
        s && this.eventEmitter.emit(E.ROW_HEIGHT_CHANGE, s, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if ((t = this.state.filterDropdown) != null && t.isScrollbarDragging) {
        this.state.filterDropdown.isScrollbarDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) && (this.scrollbarState.verticalDragging = !1, this.scrollbarState.horizontalDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents());
    });
    b(this, "handleMouseMove", (t) => {
      var n, r;
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      if (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging)
        return;
      if (this.state.contextMenu) {
        this.contextMenuHandler.handleContextMenuHover(t), this.canvas.style.cursor = "pointer";
        return;
      }
      if (this.state.headerContextMenu) {
        this.contextMenuHandler.handleHeaderContextMenuHover(t), this.canvas.style.cursor = "pointer";
        return;
      }
      if (this.state.dropdown) {
        this.dropdownHandler.handleDropdownHover(t), this.canvas.style.cursor = "pointer";
        return;
      }
      if (this.state.buttonsDropdown) {
        this.dropdownHandler.handleButtonsDropdownHover(t), this.canvas.style.cursor = "pointer";
        return;
      }
      if (this.state.imageTooltip) {
        if (this.imageHandler.handleImageTooltipHover(t)) {
          this.canvas.style.cursor = "pointer";
          return;
        }
        this.state.imageTooltip = null;
      }
      if (this.state.imageEditor && this.imageHandler.handleImageEditorHover(t)) {
        const { y: l, hoveredIndex: h } = this.state.imageEditor, c = 60, d = t.clientY - this.canvas.getBoundingClientRect().top, u = d >= l && d <= l + c, f = h >= 0;
        this.canvas.style.cursor = u || f ? "pointer" : "default";
        return;
      }
      if (this.state.filterDropdown) {
        this.dropdownHandler.handleFilterDropdownHover(t), this.canvas.style.cursor = "pointer";
        return;
      }
      if (this.state.dateDropdown) {
        this.dropdownHandler.handleDateDropdownHover(t), this.canvas.style.cursor = "pointer";
        return;
      }
      if (this.state.colorDropdown) {
        this.dropdownHandler.handleColorDropdownHover(t), this.canvas.style.cursor = "pointer";
        return;
      }
      if (this.state.isDragging && this.state.dragType === "column-resize") {
        const a = this.layoutManager.getLeafColumn(this.resizeColumnIndex);
        if (a) {
          let l = t.clientX - this.resizeStartX;
          a.fixed === "right" && (l = -l);
          const h = Math.max(50, this.resizeStartWidth + l);
          this.layoutManager.setColumnWidth(a.key, h), this.eventEmitter.emit(E.COLUMN_RESIZE, a, h);
        }
        return;
      }
      if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
        this.handleProgressDragMove(t);
        return;
      }
      if (this.state.columnReorderState && !this.state.isDragging) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left;
        Math.abs(l - this.state.columnReorderState.dragStartX) > 5 && (this.state.isDragging = !0, this.state.dragType = "column-reorder", this.bindDocumentEvents());
      }
      if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left;
        this.state.columnReorderState.currentX = l;
        const h = this.state.columnReorderState, c = h.siblingColumns, d = h.dragSiblingIndex;
        if (!c || c.length === 0) {
          this.eventEmitter.emit(E.COLUMN_REORDER_DRAG);
          return;
        }
        const u = Date.now();
        if (h.lastSwapTime && u - h.lastSwapTime < 50) {
          this.eventEmitter.emit(E.COLUMN_REORDER_DRAG);
          return;
        }
        let f = -1, g = 0;
        for (let m = 0; m < c.length; m++) {
          const p = c[m];
          if (l >= p.left && l < p.right) {
            f = m, g = p.center;
            break;
          }
        }
        if (f === -1 && (h.lastSwapTargetKey = void 0), f !== -1 && f !== d) {
          const m = c[d], p = c[f];
          if (m && p) {
            if (h.lastSwapTargetKey === p.key) {
              this.eventEmitter.emit(E.COLUMN_REORDER_DRAG);
              return;
            }
            let y = !1;
            if ((f > d ? "right" : "left") === "right" ? y = l >= g : y = l < g, y) {
              this.eventEmitter.emit(E.COLUMN_SWAP, m.key, p.key), h.lastSwapTime = u, h.lastSwapTargetKey = void 0;
              const C = this.layoutManager.getColumnByKey(h.dragColumnKey);
              if (C) {
                const R = this.headerHandler.calculateSiblingColumns(C), v = R.findIndex(
                  (M) => M.key === h.dragColumnKey
                );
                h.siblingColumns = R, h.dragSiblingIndex = v >= 0 ? v : d;
                const I = R[h.dragSiblingIndex];
                I && (h.dragColumnIndex = I.firstLeafIndex);
              }
            }
          }
        } else f === d && (h.lastSwapTargetKey = void 0);
        if (f !== -1) {
          const m = c[f];
          m && (h.targetColumnIndex = m.firstLeafIndex);
        } else {
          const m = c[d];
          m && (h.targetColumnIndex = m.firstLeafIndex);
        }
        this.eventEmitter.emit(E.COLUMN_REORDER_DRAG);
        return;
      }
      if (this.state.isSelecting && this.state.selectionStart) {
        const a = this.layoutManager.hitTest(i, s, this.getScrollbarBounds());
        a.region === "cell" && a.cell && a.cell.rowIndex >= 0 && this.selectionHandler.handleRangeSelection(a.cell);
        return;
      }
      const o = this.layoutManager.hitTest(i, s, this.getScrollbarBounds());
      switch (o.region) {
        case "scrollbar-vertical":
          this.scrollbarState.verticalHovered = !0, this.scrollbarState.horizontalHovered = !1, this.canvas.style.cursor = "grab", this.state.tooltip = null;
          return;
        case "scrollbar-horizontal":
          this.scrollbarState.horizontalHovered = !0, this.scrollbarState.verticalHovered = !1, this.canvas.style.cursor = "grab", this.state.tooltip = null;
          return;
      }
      if (this.scrollbarState.verticalHovered = !1, this.scrollbarState.horizontalHovered = !1, o.region === "header") {
        if (o.isResizeHandle) {
          this.canvas.style.cursor = "col-resize", this.state.tooltip = null, this.state.hoveredHeaderColumnKey = void 0;
          return;
        }
        o.headerCell && this.headerHandler.handleHeaderHover(o.headerCell, i, s);
        return;
      }
      if (o.region === "cell" && o.rowHit && (o.rowHit.band === "summary-top" || o.rowHit.band === "summary-bottom")) {
        this.canvas.style.cursor = "default", this.state.hoveredCell = null, this.tooltipHandler.checkSummaryTooltip(o.rowHit);
        return;
      }
      if (o.region === "cell" && o.cell) {
        if (this.rowHeightResizeEnabled && o.isRowResizeHandle && o.resizeRowIndex !== void 0 && this.isRowResizable(o.resizeRowIndex)) {
          this.canvas.style.cursor = "ns-resize", this.state.tooltip = null;
          return;
        }
        const a = o.cell;
        this.updateButtonHoverState(a, i, s);
        const l = this.layoutManager.getLeafColumns(), h = a.columnIndex >= 0 ? l[a.columnIndex] : void 0, c = a.rowIndex >= 0 ? this.rows[a.rowIndex] : void 0;
        if ((h && c ? !this.editorRegistry.getStrategy(h).canEdit(a, c, h) : !1) ? this.canvas.style.cursor = "not-allowed" : this.isClickableElement(a, i, s) ? this.canvas.style.cursor = "pointer" : h && h.key.startsWith("__hidden_placeholder__") ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", ((n = this.state.hoveredCell) == null ? void 0 : n.rowIndex) !== a.rowIndex || ((r = this.state.hoveredCell) == null ? void 0 : r.columnIndex) !== a.columnIndex) {
          this.state.hoveredCell = a.rowIndex >= 0 ? a : null;
          const u = this.state.hoveredCell ? this.getCellInfo(this.state.hoveredCell) : null;
          this.eventEmitter.emit(E.CELL_HOVER, u, t);
        }
        this.updateImageHoverIndex(a, i, s), this.updateButtonsHoverIndex(a, i, s), this.state.hoveredHeaderColumnKey !== void 0 && (this.state.hoveredHeaderColumnKey = void 0, this.eventEmitter.emit(E.HEADER_HOVER, void 0)), this.checkTooltip(a);
      }
    });
    b(this, "startButtonHoverAnimationLoop", () => {
      this.buttonAnimationHandler.startButtonHoverAnimationLoop();
    });
    b(this, "getButtonHoverStates", () => this.buttonAnimationHandler.getButtonHoverStates());
    b(this, "checkTooltip", (t) => {
      this.tooltipHandler.checkTooltip(t);
    });
    b(this, "handleMouseUp", (t) => {
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, s = this.rows[e];
        s && this.eventEmitter.emit(E.ROW_HEIGHT_CHANGE, s, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
        const { cell: e, displayValue: i } = this.state.progressDragState;
        this.eventEmitter.emit(E.PROGRESS_CHANGE, this.getCellInfo(e), i), this.state.isDragging = !1, this.state.dragType = null, this.state.progressDragState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
        const { dragColumnIndex: e, targetColumnIndex: i } = this.state.columnReorderState;
        e !== i && i >= 0 && this.eventEmitter.emit(E.COLUMN_REORDER, e, i), this.state.isDragging = !1, this.state.dragType = null, this.state.columnReorderState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents(), this.eventEmitter.emit(E.COLUMN_REORDER_DRAG);
        return;
      }
      if (this.state.columnReorderState && !this.state.isDragging) {
        this.state.columnReorderState = void 0;
        return;
      }
      if (this.state.isDragging) {
        this.state.isDragging = !1, this.state.dragType = null, this.canvas.style.cursor = "default";
        return;
      }
      this.state.isSelecting && (this.state.isSelecting = !1, this.state.selectionStart = null);
    });
    b(this, "handleMouseLeave", () => {
      const t = this.state.hoveredHeaderColumnKey !== void 0;
      this.state.hoveredCell = null, this.state.hoveredHeaderColumnKey = void 0, this.state.hoveredImageIndex = -1, this.state.hoveredButtonIndex = -1, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.columnReorderState = void 0, this.scrollbarState.verticalHovered = !1, this.scrollbarState.horizontalHovered = !1, this.clearAllButtonHoverStates(), t && this.eventEmitter.emit(E.HEADER_HOVER, void 0);
    });
    b(this, "handleDblClick", async (t) => {
      var h;
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose(t))
        return;
      if (this.state.dateDropdown) {
        const { x: c, y: d, width: u } = this.state.dateDropdown, w = 40 + 28 + 6 * 28 + 8 * 2;
        if (i >= c && i <= c + u && s >= d && s <= d + w || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const C = this.state.dateDropdown.cell;
        this.state.dateDropdown = null, this.eventEmitter.emit(E.DATE_DROPDOWN_CLOSE, C);
      }
      if (this.state.dropdown) {
        const { x: c, y: d, width: u, type: f, tagsConfig: g, config: m } = this.state.dropdown, p = q.DROPDOWN_ITEM_HEIGHT, y = q.DROPDOWN_MAX_VISIBLE;
        let w;
        f === "tags" && g ? w = ((h = g.options) == null ? void 0 : h.length) ?? 0 : w = m.options.length;
        const R = Math.min(w, y) * p;
        if (i >= c && i <= c + u && s >= d && s <= d + R)
          return;
        const v = this.state.dropdown.cell;
        if (this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(v))
          return;
        this.state.dropdown = null, this.eventEmitter.emit(E.DROPDOWN_CLOSE, null);
      }
      if (this.state.filterDropdown) {
        const { x: c, y: d, width: u, mode: f, options: g } = this.state.filterDropdown, m = 8, p = 36, y = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE;
        let C;
        switch (f) {
          case "search": {
            C = 36 + p + m;
            break;
          }
          case "select": {
            C = 36 + Math.min((g == null ? void 0 : g.length) ?? 0, w) * y + p;
            break;
          }
          case "range": {
            C = m + 32 + 8 + p + m;
            break;
          }
          case "boolean": {
            C = 32 * 3 + p;
            break;
          }
          case "dateRange": {
            C = m + 32 + 8 + p + m;
            break;
          }
          default:
            C = 200;
        }
        if (i >= c && i <= c + u && s >= d && s <= d + C)
          return;
        this.state.filterDropdown = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_CLOSE);
      }
      const o = this.layoutManager.getCellAtViewportPosition(
        i,
        s,
        this.scrollState.scrollTop
      );
      if (!o || o.rowIndex < 0) return;
      const r = this.layoutManager.getLeafColumns()[o.columnIndex], a = this.rows[o.rowIndex], l = [
        O.CHECKBOX,
        O.RADIO,
        O.BUTTON,
        O.BUTTONS,
        O.SWITCH,
        O.RATING
      ];
      if (r && a) {
        const c = lt(r, a, o.rowIndex);
        if (c.type && l.includes(c.type))
          return;
        if (c.type === O.PROGRESS && c.progress) {
          if (c.progress.interactive !== !0 || !this.editorRegistry.getStrategy(r).canEdit(o, a, r)) return;
          this.eventEmitter.emit(E.CELL_DBL_CLICK, this.getCellInfo(o), t), this.eventEmitter.emit(E.ROW_DBL_CLICK, a, o.rowIndex, t), this.editingConfig.enabled !== !1 && this.startEditing(o, {
            value: String(c.progress.value),
            type: "number",
            placeholder: "0-100"
          });
          return;
        }
        if (c.type === O.COLOR && c.color) {
          const d = this.layoutManager.getCellPosition(o.rowIndex, o.columnIndex), u = this.getCellViewportX(d, r), f = this.getCellViewportY(o.rowIndex), m = Math.min(d.height - 8 * 2, 24), p = u + (d.width - m) / 2, y = f + (d.height - m) / 2;
          if (!(i >= p && i <= p + m && s >= y && s <= y + m)) return;
        }
        if (!this.editorRegistry.getStrategy(r).canEdit(o, a, r)) return;
        if (this.eventEmitter.emit(E.CELL_DBL_CLICK, this.getCellInfo(o), t), this.eventEmitter.emit(E.ROW_DBL_CLICK, a, o.rowIndex, t), this.editingConfig.enabled !== !1) {
          const d = this.getEditConfig(r, a, o.rowIndex);
          d ? d.type === O.SELECT && d.select ? this.startSelectEditing(o, d.select) : d.type === O.TAG && d.tags ? this.startTagsEditing(o, d.tags) : d.type === O.DATE && d.date ? this.startDateEditing(o, d.date) : d.type === O.COLOR && d.color ? this.startColorEditing(o, d.color) : d.type === O.INPUT || !d.type ? this.startEditing(o, d.input) : this.startEditing(o, d.input) : c.type === O.SELECT && c.select ? this.startSelectEditing(o, c.select) : c.type === O.TAG && c.tags && c.tags.editable ? this.startTagsEditing(o, c.tags) : c.type === O.DATE && c.date ? this.startDateEditing(o, c.date) : c.type === O.COLOR && c.color ? this.startColorEditing(o, c.color) : c.type === O.IMAGE && c.image ? this.startImageEditing(o, c.image) : this.startEditing(o, c.input);
        }
      }
    });
    b(this, "handleControlClick", (t, e) => {
      var a, l;
      const s = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.rows[t.rowIndex];
      if (!s || !o) return !1;
      if (s.key.startsWith("__hidden_placeholder__")) {
        const h = s._hiddenColumnKey;
        if (h)
          return this.eventEmitter.emit(E.COLUMN_SHOW, h), !0;
      }
      if (this.expandColumnKey === s.key && o.children && o.children.length > 0 && this.handleExpandIconClick(t, e, o))
        return !0;
      const n = lt(s, o, t.rowIndex), r = !this.editorRegistry.getStrategy(s).canEdit(t, o, s);
      if (n.type === O.CHECKBOX && n.checkbox) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = 16, p = f + (h.width - m) / 2, y = g + (h.height - m) / 2;
        if (d >= p && d <= p + m && u >= y && u <= y + m && !r) {
          const C = !n.checkbox.checked;
          return this.eventEmitter.emit(E.CHECKBOX_CHANGE, this.getCellInfo(t), C), !0;
        }
        return !1;
      }
      if (n.type === O.RADIO && n.radio) {
        if (r) return !1;
        if (n.radio.options && n.radio.options.length > 0) {
          const h = this.getClickedRadioOption(t, e, n.radio.options);
          return h && !h.disabled ? (this.eventEmitter.emit(
            E.RADIO_CHANGE,
            this.getCellInfo(t),
            h.value
          ), !0) : !1;
        } else
          return this.eventEmitter.emit(
            E.RADIO_CHANGE,
            this.getCellInfo(t),
            n.radio.value
          ), !0;
      }
      if (n.type === O.BUTTON && n.button) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, y = n.button.size === "small" ? 24 : n.button.size === "large" ? 40 : 32, w = (h.height - y) / 2, C = n.button.text ?? this.locale.cell.buttonText, R = 13;
        this.ctx.font = `${R}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const v = this.ctx.measureText(C).width, S = Math.min(
          Math.max(v + 16 * 2, 60),
          h.width - 8 * 2
        ), T = (h.width - S) / 2;
        return p >= w && p <= w + y && m >= T && m <= T + S ? (this.eventEmitter.emit(
          E.BUTTON_CLICK,
          this.getCellInfo(t),
          n.button.actionKey
        ), !0) : !1;
      }
      if (n.type === O.BUTTONS && n.buttons) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, y = 8, w = n.buttons.gap ?? 4, C = n.buttons.maxVisible ?? 3, R = 24, v = (h.height - R) / 2, I = n.buttons.buttons.filter((H) => H.visible !== !1), M = I.slice(0, C), S = I.slice(C);
        let T = y;
        for (let H = 0; H < M.length; H++) {
          const D = M[H], k = D.text ?? this.locale.cell.buttonText;
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const P = this.ctx.measureText(k).width, B = Math.max(P + 16, 40);
          if (p >= v && p <= v + R && m >= T && m <= T + B)
            return this.eventEmitter.emit(E.BUTTON_CLICK, this.getCellInfo(t), D.actionKey), !0;
          T += B + w;
        }
        if (S.length > 0) {
          const H = n.buttons.moreButtonText ?? "···";
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const D = this.ctx.measureText(H).width, k = Math.max(D + 16, 32);
          if (p >= v && p <= v + R && m >= T && m <= T + k) {
            const P = f + T, B = q.DROPDOWN_ITEM_HEIGHT, L = S.length * B, A = this.canvas.getBoundingClientRect();
            let W = g + v + R + 4, _ = !1;
            return W + L > A.height && (W = g + v - L - 4, _ = !0), this.state.buttonsDropdown = {
              cell: t,
              x: P,
              y: W,
              buttons: S,
              hoveredIndex: -1,
              buttonRelativeX: T,
              buttonY: v,
              buttonHeight: R,
              showAbove: _
            }, this.eventEmitter.emit(E.DROPDOWN_OPEN), !0;
          }
        }
        return !1;
      }
      if (n.type === O.SWITCH && n.switch) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, y = 44, w = 22, C = (h.width - y) / 2, R = (h.height - w) / 2;
        if (!(m >= C && m <= C + y && p >= R && p <= R + w)) return !1;
        const I = `${t.rowIndex}-${t.columnIndex}`, M = this.state.switchAnimations.get(I), S = n.switch.checked ?? !1, T = M ? M.progress : S ? 1 : 0, H = T < 0.5 ? 1 : 0, D = H === 1;
        return S !== D && this.eventEmitter.emit(E.SWITCH_CHANGE, this.getCellInfo(t), D), this.state.switchAnimations.set(I, {
          cell: t,
          progress: T,
          targetProgress: H,
          startTime: Date.now(),
          startProgress: T
        }), this.startSwitchAnimationLoop(), !0;
      }
      if (n.type === O.INPUT && n.input)
        return r || n.input.readonly, !1;
      if (n.type === O.LINK && n.link) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, y = n.link, w = y.link, C = y.text || y.link;
        if (!w || !C) return !1;
        const R = 8, v = 13;
        this.ctx.font = `${v}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const I = h.width - R * 2;
        let M = this.ctx.measureText(C).width, S = C;
        if (M > I) {
          const L = "...";
          for (; S.length > 0 && this.ctx.measureText(S + L).width > I; )
            S = S.slice(0, -1);
          S += L, M = this.ctx.measureText(S).width;
        }
        const T = s.align ?? "left";
        let H;
        switch (T) {
          case "center":
            H = (h.width - M) / 2;
            break;
          case "right":
            H = h.width - R - M;
            break;
          default:
            H = R;
        }
        const D = (h.height - v) / 2;
        if (!(m >= H && m <= H + M && p >= D && p <= D + v)) return !1;
        const P = Date.now(), B = ((a = this._lastClickCell) == null ? void 0 : a.rowIndex) === t.rowIndex && ((l = this._lastClickCell) == null ? void 0 : l.columnIndex) === t.columnIndex && P - this._lastClickTime < 350;
        return this._lastClickTime = P, this._lastClickCell = { rowIndex: t.rowIndex, columnIndex: t.columnIndex }, B ? !1 : (window.open(w, "_blank", "noopener,noreferrer"), !0);
      }
      if (n.type === O.PROGRESS && n.progress) {
        const h = this.handleProgressClick(t, e, n.progress, s, o);
        if (h) {
          const c = n.progress.precision ?? 0, d = c === 0 ? Math.round(n.progress.value) : Number(n.progress.value.toFixed(c));
          this.state.isDragging = !0, this.state.dragType = "progress-drag", this.state.progressDragState = {
            cell: t,
            config: n.progress,
            column: s,
            row: o,
            startX: e.clientX,
            startValue: n.progress.value,
            displayValue: d
          }, this.canvas.style.cursor = "grabbing", this.bindDocumentEvents();
        }
        return h;
      }
      if (n.type === O.RATING && n.rating)
        return this.handleRatingClick(t, e, n.rating, s, o);
      if (n.type === O.COLOR && n.color) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, s), d = this.getCellViewportY(t.rowIndex), u = this.canvas.getBoundingClientRect(), f = e.clientX - u.left, g = e.clientY - u.top, p = Math.min(h.height - 8 * 2, 24), y = c + (h.width - p) / 2, w = d + (h.height - p) / 2;
        return f >= y && f <= y + p && g >= w && g <= w + p ? (this.startColorEditing(t, n.color), !0) : !1;
      }
      if (n.type === O.IMAGE && n.image) {
        if (n.image.clickable === !1) return !1;
        const h = n.image, c = h.images, d = this.canvas.getBoundingClientRect(), u = e.clientX - d.left, f = e.clientY - d.top, g = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), m = this.getCellViewportX(g, s), p = this.getCellViewportY(t.rowIndex), y = u - m, w = f - p, C = 4, R = Math.min(g.width, g.height) - C * 2, v = h.width ?? 32, I = h.height ?? 32, M = Math.min(v, R), S = Math.min(I, R), T = h.gap ?? 4;
        if (c && c.length > 1) {
          const B = h.maxVisible ?? 3, L = h.showMoreCount !== !1, A = g.width - C * 2, W = Math.floor((A + T) / (M + T)), F = Math.max(1, W - (L ? 1 : 0)), V = Math.min(B, F), z = c.length > V ? V : c.length, X = c.length > V;
          let G;
          X && L ? G = z * M + z * T + M : G = z * M + Math.max(0, z - 1) * T;
          let U = (g.width - G) / 2;
          U = Math.max(C, U);
          const K = (g.height - S) / 2, tt = y - U, st = w - K;
          if (tt < 0 || tt > G || st < 0 || st > S)
            return !1;
          const Y = Math.floor(tt / (M + T));
          if (X && L && Y === z)
            return !1;
          if (Y >= 0 && Y < c.length) {
            const j = c[Y];
            if (j)
              return this.eventEmitter.emit(E.IMAGE_CLICK, this.getCellInfo(t), j, e), !0;
          }
          return !1;
        }
        const H = (g.width - M) / 2, D = (g.height - S) / 2;
        if (!(y >= H && y <= H + M && w >= D && w <= D + S)) return !1;
        const P = h.src || c && c[0];
        return P ? (this.eventEmitter.emit(E.IMAGE_CLICK, this.getCellInfo(t), P, e), !0) : !1;
      }
      return !1;
    });
    b(this, "handleProgressClick", (t, e, i, s, o) => this.controlClickHandler.handleProgressClick(t, e, i, s, o));
    b(this, "handleProgressDragMove", (t) => {
      const e = this.state.progressDragState;
      if (!e) return;
      const { cell: i, config: s, column: o } = e, n = this.canvas.getBoundingClientRect(), r = t.clientX - n.left, a = this.layoutManager.getCellPosition(i.rowIndex, i.columnIndex), l = this.getCellViewportX(a, o), h = s.shape ?? "line";
      if (h === "line") {
        const d = s.textPosition ?? "right", f = (s.showText ?? !0) && d === "right" ? 40 : 0, g = s.width ?? a.width - 8 * 2 - f, m = l + 8, p = r - m, y = s.precision ?? 0, w = Math.max(0, Math.min(100, p / g * 100)), C = y === 0 ? Math.round(w) : Number(w.toFixed(y));
        e.displayValue = C, this.eventEmitter.emit(E.PROGRESS_DRAG);
      } else if (h === "circle" || h === "dashboard") {
        const c = t.clientY - n.top, d = this.getCellViewportY(i.rowIndex);
        let u = 0;
        h === "dashboard" && (u = a.height * 0.05);
        const f = l + a.width / 2, g = d + a.height / 2 + u, m = r - f, p = c - g;
        let y = Math.atan2(p, m), w;
        if (h === "circle")
          y = y + Math.PI / 2, y < 0 && (y += Math.PI * 2), w = y / (Math.PI * 2) * 100;
        else {
          const R = Math.PI * 0.75, v = Math.PI * 1.5;
          y < 0 && (y += Math.PI * 2);
          let I = y - R;
          I < 0 && (I += Math.PI * 2), w = I / v * 100;
        }
        w = Math.max(0, Math.min(100, w));
        const C = s.precision ?? 0;
        w = C === 0 ? Math.round(w) : Number(w.toFixed(C)), e.displayValue = w, this.eventEmitter.emit(E.PROGRESS_DRAG);
      }
    });
    b(this, "handleRatingClick", (t, e, i, s, o) => this.controlClickHandler.handleRatingClick(t, e, i, s, o));
    b(this, "handleExpandIconClick", (t, e, i) => this.controlClickHandler.handleExpandIconClick(t, e, i));
    b(this, "getClickedRadioOption", (t, e, i) => this.controlClickHandler.getClickedRadioOption(t, e, i));
    b(this, "handleWheel", (t) => {
      var r;
      const e = t.target;
      if (e.tagName === "TEXTAREA" || e.tagName === "INPUT") {
        const a = e, l = a.scrollHeight > a.clientHeight, h = a.scrollWidth > a.clientWidth;
        if (l || h)
          return;
      }
      if (this.state.imageTooltip) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g } = this.state.imageTooltip, m = q.IMAGE_SIZE, p = 8, y = 8, w = 4, v = w * m + (w - 1) * y + p * 2 + 4 + 4, I = m + y, M = f * I + p * 2 - y;
        if (l >= c && l <= c + v && h >= d && h <= d + M) {
          const T = Math.ceil(u.length / w), H = Math.max(0, (T - f) * I), D = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (H > 0 && D) {
            const P = g <= 0.5 && t.deltaY < 0, B = g >= H - 0.5 && t.deltaY > 0;
            if (!P && !B) {
              this.state.imageTooltip.scrollTop = J(g + t.deltaY, 0, H), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(E.IMAGE_TOOLTIP_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageTooltipPosition();
      }
      if (this.state.imageEditor) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g, pendingImages: m } = this.state.imageEditor, p = q.IMAGE_SIZE, y = 8, w = 8, C = 4, R = 60, v = p + w, I = C * p + (C - 1) * w + y * 2 + 4 + 4, M = f * v + y * 2 - w, S = R + M;
        if (l >= c && l <= c + I && h >= d && h <= d + S) {
          const H = u.length + m.length, D = Math.ceil(H / C), k = Math.max(0, (D - f) * v), P = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (k > 0 && P) {
            const L = g <= 0.5 && t.deltaY < 0, A = g >= k - 0.5 && t.deltaY > 0;
            if (!L && !A) {
              this.state.imageEditor.scrollTop = J(g + t.deltaY, 0, k), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(E.IMAGE_EDITOR_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageEditorPosition();
      }
      if (this.state.filterDropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, mode: f, options: g, scrollTop: m } = this.state.filterDropdown;
        if (f === "select" && g) {
          const y = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE, C = Math.min(g.length, w), R = 32, v = 4, I = C * y, M = 8 + R + v + I + v + 36;
          if (l >= c && l <= c + u && h >= d && h <= d + M) {
            const T = Math.abs(t.deltaY) >= Math.abs(t.deltaX), H = Math.max(0, g.length * y - I);
            if (H > 0 && T) {
              const k = m <= 0.5 && t.deltaY < 0, P = m >= H - 0.5 && t.deltaY > 0;
              if (!k && !P) {
                this.state.filterDropdown.scrollTop = J(m + t.deltaY, 0, H), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
                return;
              }
            }
          }
        }
        this.dropdownHandler.updateFilterDropdownPosition();
      }
      if (this.state.dropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, type: f, tagsConfig: g, config: m, scrollTop: p } = this.state.dropdown, y = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE;
        let C;
        f === "tags" && g ? C = ((r = g.options) == null ? void 0 : r.length) ?? 0 : C = m.options.length;
        const v = Math.min(C, w) * y;
        if (l >= c && l <= c + u && h >= d && h <= d + v) {
          const M = Math.abs(t.deltaY) >= Math.abs(t.deltaX), S = Math.max(0, C * y - v);
          if (S > 0 && M) {
            const H = p ?? 0, D = H <= 0.5 && t.deltaY < 0, k = H >= S - 0.5 && t.deltaY > 0;
            if (!D && !k) {
              this.state.dropdown.scrollTop = J(H + t.deltaY, 0, S), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(E.DROPDOWN_HOVER);
              return;
            }
          }
        }
        this.dropdownHandler.updateDropdownPosition();
      }
      this.updateAllDropdownPositions(), t.preventDefault();
      const i = t.deltaX, s = t.deltaY, o = J(
        this.scrollState.scrollLeft + i,
        0,
        this.scrollState.maxScrollLeft
      ), n = J(
        this.scrollState.scrollTop + s,
        0,
        this.scrollState.maxScrollTop
      );
      (o !== this.scrollState.scrollLeft || n !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = o, this.scrollState.scrollTop = n, this.scrollState.isScrolling = !0, this.eventEmitter.emit(E.SCROLL, o, n), this.checkLazyLoad(n, s), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = !1;
      }, 150));
    });
    b(this, "updateTooltipPosition", () => {
      this.tooltipHandler.updateTooltipPosition();
    });
    b(this, "scrollTimeout", null);
    b(this, "handleKeyDown", async (t) => {
      if (this.state.editingCell) {
        this.handleEditingKeyDown(t);
        return;
      }
      if (this.state.dropdown) {
        if (t.key === "Escape") {
          const e = this.state.dropdown.cell;
          this.state.dropdown = null, this.eventEmitter.emit(E.DROPDOWN_CLOSE, e);
        }
        return;
      }
      switch (t.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          this.navigationHandler.handleArrowNavigation(t);
          break;
        case "Enter":
          this.handleEnterKey(t);
          break;
        case "Escape":
          this.selectionHandler.clearSelection();
          break;
        case "a":
        case "A":
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.selectionHandler.selectAll());
          break;
        case "c":
        case "C":
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.copySelection());
          break;
        case "z":
        case "Z":
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.eventEmitter.emit(E.UNDO));
          break;
        case "y":
        case "Y":
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.eventEmitter.emit(E.REDO));
          break;
        case " ":
          if (this.state.selectedCells.length > 0) {
            const e = this.state.selectedCells[0].start;
            this.toggleRowExpand(e.rowIndex);
          }
          break;
      }
    });
    /** 设置 DOM 编辑器活跃状态检查回调，用于避免 keydown 重复触发 endEditing */
    b(this, "isDomEditorActive", null);
    b(this, "startSwitchAnimationLoop", () => {
      this.buttonAnimationHandler.startSwitchAnimationLoop();
    });
    b(this, "getSwitchAnimations", () => this.buttonAnimationHandler.getSwitchAnimations());
    this.canvas = t, this.ctx = t.getContext("2d"), this.layoutManager = e, this.dataManager = i, this.eventEmitter = s, this.editingConfig = n, this.locale = r, this.editorRegistry = a, this.state = {
      hoveredCell: null,
      selectedCells: [],
      editingCell: null,
      editingValue: null,
      isSelecting: !1,
      selectionStart: null,
      isDragging: !1,
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
    }, this.scrollState = {
      scrollLeft: 0,
      scrollTop: 0,
      maxScrollLeft: 0,
      maxScrollTop: 0,
      isScrolling: !1
    }, this.scrollbarState = {
      verticalHovered: !1,
      horizontalHovered: !1,
      verticalDragging: !1,
      horizontalDragging: !1,
      dragStartY: 0,
      dragStartScrollTop: 0,
      dragStartX: 0,
      dragStartScrollLeft: 0
    }, this.initHandlers(), this.bindEvents();
  }
  // Data accessors via DataManager
  get rows() {
    return this.dataManager.getRows();
  }
  get allRows() {
    return this.dataManager.getAllRows();
  }
  /**
   * Initialize handler instances
   */
  initHandlers() {
    const t = {
      state: this.state,
      scrollState: this.scrollState,
      layoutManager: this.layoutManager,
      dataManager: this.dataManager,
      canvas: this.canvas,
      ctx: this.ctx,
      expandColumnKey: this.expandColumnKey,
      locale: this.locale,
      editorRegistry: this.editorRegistry
    };
    this.handlerContext = t, this.editingHandler = new Lt(t, this.eventEmitter, this.editingConfig), this.dropdownHandler = new Wt(t, this.eventEmitter), this.selectionHandler = new Li(t, this.eventEmitter), this.navigationHandler = new Wi(
      t,
      this.eventEmitter,
      this.selectionHandler,
      this.editingConfig
    ), this.contextMenuHandler = new _t(t, this.eventEmitter), this.imageHandler = new At(t, this.eventEmitter), this.headerHandler = new Ai(
      t,
      this.eventEmitter,
      this.sortConfig,
      this.filterConfig
    ), this.controlClickHandler = new _i(t, this.eventEmitter), this.buttonAnimationHandler = new Ni(t, this.eventEmitter), this.tooltipHandler = new Fi(t, this.eventEmitter);
  }
  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  getCellInfo(t) {
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], s = this.rows[t.rowIndex];
    return !i || !s ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: s,
      column: i
    };
  }
  /**
   * 计算单元格在视口中的 X 坐标
   */
  getCellViewportX(t, e) {
    return e != null && e.fixed ? t.x : t.x - this.scrollState.scrollLeft;
  }
  getCellViewportY(t) {
    return this.layoutManager.getCellViewportY(t, this.scrollState.scrollTop);
  }
  /**
   * 获取规范化的选择范围
   */
  getNormalizedRange(t) {
    return {
      minRow: Math.min(t.start.rowIndex, t.end.rowIndex),
      maxRow: Math.max(t.start.rowIndex, t.end.rowIndex),
      minCol: Math.min(t.start.columnIndex, t.end.columnIndex),
      maxCol: Math.max(t.start.columnIndex, t.end.columnIndex)
    };
  }
  bindEvents() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown), this.canvas.addEventListener("mousemove", this.handleMouseMove), this.canvas.addEventListener("mouseup", this.handleMouseUp), this.canvas.addEventListener("mouseleave", this.handleMouseLeave), this.canvas.addEventListener("dblclick", this.handleDblClick), this.canvas.addEventListener("wheel", this.handleWheel, { passive: !1 }), this.canvas.addEventListener("contextmenu", this.handleContextMenu), this.canvas.addEventListener("dragover", this.handleDragOver), this.canvas.addEventListener("dragleave", this.handleDragLeave), this.canvas.addEventListener("drop", this.handleDrop), document.addEventListener("keydown", this.handleKeyDown);
  }
  unbindEvents() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown), this.canvas.removeEventListener("mousemove", this.handleMouseMove), this.canvas.removeEventListener("mouseup", this.handleMouseUp), this.canvas.removeEventListener("mouseleave", this.handleMouseLeave), this.canvas.removeEventListener("dblclick", this.handleDblClick), this.canvas.removeEventListener("wheel", this.handleWheel), this.canvas.removeEventListener("contextmenu", this.handleContextMenu), this.canvas.removeEventListener("dragover", this.handleDragOver), this.canvas.removeEventListener("dragleave", this.handleDragLeave), this.canvas.removeEventListener("drop", this.handleDrop), document.removeEventListener("keydown", this.handleKeyDown);
  }
  bindDocumentEvents() {
    document.addEventListener("mousemove", this.handleDocumentMouseMove), document.addEventListener("mouseup", this.handleDocumentMouseUp);
  }
  unbindDocumentEvents() {
    document.removeEventListener("mousemove", this.handleDocumentMouseMove), document.removeEventListener("mouseup", this.handleDocumentMouseUp);
  }
  setGetScrollbarBounds(t) {
    this.getScrollbarBounds = t;
  }
  getScrollbarState() {
    return { ...this.scrollbarState };
  }
  triggerFileInput() {
    if (!this.state.imageEditor) return;
    const e = this.layoutManager.getLeafColumns()[this.state.imageEditor.cell.columnIndex];
    if (!e) return;
    const i = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!i) return;
    const o = (e.render ? e.render(
      i.data[$(e)],
      i,
      e,
      this.state.imageEditor.cell.rowIndex
    ) : { image: i.data[$(e)] }).image ?? {}, n = document.createElement("input");
    n.type = "file", n.accept = o.accept ?? "image/*", n.multiple = !this.state.imageEditor.isSingleImage && o.multiple !== !1, n.onchange = async (r) => {
      const a = r.target.files;
      !a || a.length === 0 || await this.imageHandler.handleFileUpload(Array.from(a));
    }, n.click();
  }
  getContextMenu() {
    return this.contextMenuHandler.getContextMenu();
  }
  getHeaderContextMenu() {
    return this.contextMenuHandler.getHeaderContextMenu();
  }
  updateButtonHoverState(t, e, i) {
    const s = t && t.rowIndex >= 0 ? `${t.rowIndex}-${t.columnIndex}` : null;
    if (this.state.buttonHoverStates.forEach((S, T) => {
      T !== s && S.progress > 0 && this.state.buttonHoverStates.set(T, {
        ...S,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: S.progress
      });
    }), !t || t.rowIndex < 0) {
      this.state.buttonHoverStates.size > 0 && this.startButtonHoverAnimationLoop();
      return;
    }
    const n = this.layoutManager.getLeafColumns()[t.columnIndex], r = this.rows[t.rowIndex];
    if (!n || !r) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const a = lt(n, r, t.rowIndex);
    if (a.type !== O.BUTTON || !a.button || !this.editorRegistry.getStrategy(n).canEdit(t, r, n)) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const l = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), h = this.getCellViewportX(l, n), c = this.getCellViewportY(t.rowIndex), d = e - h, u = i - c, f = a.button.size === "small" ? 24 : a.button.size === "large" ? 40 : 32, g = (l.height - f) / 2, m = a.button.text ?? this.locale.cell.buttonText, p = 13;
    this.ctx.font = `${p}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const y = this.ctx.measureText(m).width, R = Math.min(
      Math.max(y + 16 * 2, 60),
      l.width - 8 * 2
    ), v = (l.width - R) / 2, I = u >= g && u <= g + f && d >= v && d <= v + R, M = `${t.rowIndex}-${t.columnIndex}`;
    if (I) {
      const S = this.state.buttonHoverStates.get(M);
      if (!S || S.targetProgress !== 1) {
        const T = S ? S.progress : 0;
        this.state.buttonHoverStates.set(M, {
          cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
          progress: T,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: T
        }), this.startButtonHoverAnimationLoop();
      }
    } else {
      const S = this.state.buttonHoverStates.get(M);
      S && S.progress > 0 && (this.state.buttonHoverStates.set(M, {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        progress: S.progress,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: S.progress
      }), this.startButtonHoverAnimationLoop());
    }
  }
  clearAllButtonHoverStates() {
    let t = !1;
    this.state.buttonHoverStates.forEach((e, i) => {
      (e.progress > 0 || e.targetProgress !== 0) && (this.state.buttonHoverStates.set(i, {
        ...e,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: e.progress
      }), t = !0);
    }), t && this.startButtonHoverAnimationLoop();
  }
  getHoveredImageIndex() {
    return this.state.hoveredImageIndex ?? -1;
  }
  getHoveredButtonIndex() {
    return this.state.hoveredButtonIndex ?? -1;
  }
  updateImageHoverIndex(t, e, i) {
    if (!t || t.rowIndex < 0) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (!o || !n) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const r = lt(o, n, t.rowIndex);
    if (r.type !== O.IMAGE || !r.image) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const a = r.image, l = a.images, h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, o), d = this.getCellViewportY(t.rowIndex), u = e - c, f = i - d, g = 4, m = Math.min(h.width, h.height) - g * 2, p = a.width ?? 32, y = a.height ?? 32, w = Math.min(p, m), C = Math.min(y, m), R = a.gap ?? 4;
    if (!l || l.length <= 1) {
      const W = (h.width - w) / 2, _ = (h.height - C) / 2, F = u >= W && u <= W + w && f >= _ && f <= _ + C;
      this.state.hoveredImageIndex = F && a.hoverable !== !1 ? 0 : -1;
      return;
    }
    const v = h.width - g * 2, I = a.showMoreCount !== !1, M = a.maxVisible;
    let S;
    if (l.length === 1)
      S = 1;
    else {
      const W = Math.floor((v + R) / (w + R));
      S = Math.max(1, W - (I ? 1 : 0));
    }
    const T = M !== void 0 ? Math.min(M, S) : S, H = l.length > T, D = H ? T : l.length;
    let k;
    H && I ? k = D * w + D * R + w : k = D * w + Math.max(0, D - 1) * R;
    let P = c + (h.width - k) / 2;
    P = Math.max(c + g, P);
    const B = d + (h.height - C) / 2, L = e - P, A = i - B;
    if (A < 0 || A > C) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    for (let W = 0; W < D; W++) {
      const _ = W * (w + R), F = _ + w;
      if (L >= _ && L < F) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? W : -1;
        return;
      }
    }
    if (H && I) {
      const W = D * (w + R), _ = W + w;
      if (L >= W && L < _) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? D : -1;
        return;
      }
    }
    this.state.hoveredImageIndex = -1;
  }
  updateButtonsHoverIndex(t, e, i) {
    if (!t || t.rowIndex < 0) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (!o || !n) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const r = lt(o, n, t.rowIndex);
    if (r.type !== O.BUTTONS || !r.buttons) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    if (!this.editorRegistry.getStrategy(o).canEdit(t, n, o)) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const a = r.buttons, l = a.buttons.filter((I) => I.visible !== !1), h = a.maxVisible ?? 3, c = a.gap ?? 4, d = 8, u = 24, f = l.slice(0, h), g = l.slice(h), m = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), p = this.getCellViewportX(m, o), w = this.getCellViewportY(t.rowIndex) + (m.height - u) / 2, C = i - w;
    if (C < 0 || C > u) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    let R = p + d;
    const v = 13;
    this.ctx.font = `${v}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    for (let I = 0; I < f.length; I++) {
      const S = f[I].text ?? this.locale.cell.buttonText, T = this.ctx.measureText(S).width, H = Math.max(T + 16, 40);
      if (e >= R && e < R + H) {
        this.state.hoveredButtonIndex = I;
        return;
      }
      R += H + c;
    }
    if (g.length > 0) {
      const I = a.moreButtonText ?? "···", M = this.ctx.measureText(I).width, S = Math.max(M + 16, 32);
      if (e >= R && e < R + S) {
        this.state.hoveredButtonIndex = h;
        return;
      }
    }
    this.state.hoveredButtonIndex = -1;
  }
  isClickableElement(t, e, i) {
    if (!t) return !1;
    if (t.rowIndex === -1)
      return !0;
    const o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (!o || !n) return !1;
    const r = lt(o, n, t.rowIndex), a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), l = !this.editorRegistry.getStrategy(o).canEdit(t, n, o), h = this.getCellViewportX(a, o), c = this.getCellViewportY(t.rowIndex), d = e - h, u = i - c;
    if (r.type === O.CHECKBOX && r.checkbox) {
      if (l) return !1;
      const f = 16, g = (a.width - f) / 2, m = (a.height - f) / 2;
      return d >= g && d <= g + f && u >= m && u <= m + f;
    }
    if (r.type === O.RADIO && r.radio) {
      if (l) return !1;
      const f = 16;
      if (r.radio.options && r.radio.options.length > 0) {
        const p = a.width - 8;
        this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        let y = 8;
        for (let w = 0; w < r.radio.options.length; w++) {
          const C = r.radio.options[w];
          if (C.disabled) {
            const k = this.ctx.measureText(C.label).width;
            y += f + 4 + k + 8;
            continue;
          }
          const R = this.ctx.measureText(C.label).width, v = f + 4 + R + 8;
          if (y + v - 8 > p)
            break;
          const I = y, M = (a.height - f) / 2, S = M + f / 2, T = d >= I && d <= I + f && u >= M && u <= M + f, H = I + f + 4, D = d >= H && d <= H + R && u >= S - 10 && u <= S + 10;
          if (T || D)
            return !0;
          y += v;
        }
        return !1;
      } else {
        const g = (a.width - f) / 2, m = (a.height - f) / 2;
        return d >= g && d <= g + f && u >= m && u <= m + f;
      }
    }
    if (r.type === O.BUTTON && r.button) {
      if (l) return !1;
      const f = r.button.size === "small" ? 24 : r.button.size === "large" ? 40 : 32, g = (a.height - f) / 2, m = 8;
      return u >= g && u <= g + f && d >= m && d <= a.width - m;
    }
    if (r.type === O.BUTTONS && r.buttons) {
      if (l) return !1;
      const f = 8, g = r.buttons.gap ?? 4, m = r.buttons.maxVisible ?? 3, p = 24, y = (a.height - p) / 2, w = r.buttons.buttons.filter((v) => v.visible !== !1), C = w.slice(0, m);
      let R = f;
      for (const v of C) {
        const I = v.text ?? this.locale.cell.buttonText;
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const M = this.ctx.measureText(I).width, S = Math.max(M + 16, 40);
        if (u >= y && u <= y + p && d >= R && d <= R + S)
          return !0;
        R += S + g;
      }
      if (w.length > m) {
        const v = r.buttons.moreButtonText ?? "···";
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const I = this.ctx.measureText(v).width, M = Math.max(I + 16, 32);
        if (u >= y && u <= y + p && d >= R && d <= R + M)
          return !0;
      }
      return !1;
    }
    if (r.type === O.SWITCH && r.switch) {
      if (l) return !1;
      const f = 44, g = 22, m = (a.width - f) / 2, p = (a.height - g) / 2;
      return d >= m && d <= m + f && u >= p && u <= p + g;
    }
    if (r.type === O.SELECT && r.select)
      return !l;
    if (r.type === O.TAG && r.tags)
      return !0;
    if (r.type === O.INPUT && r.input)
      return !(l || r.input.readonly);
    if (r.type === O.LINK && r.link) {
      const f = r.link, g = f.text || f.link;
      if (!g) return !1;
      const m = 8, p = 13;
      this.ctx.font = `${p}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      const y = a.width - m * 2;
      let w = this.ctx.measureText(g).width, C = g;
      if (w > y) {
        const M = "...";
        for (; C.length > 0 && this.ctx.measureText(C + M).width > y; )
          C = C.slice(0, -1);
        C += M, w = this.ctx.measureText(C).width;
      }
      const R = o.align ?? "left";
      let v;
      switch (R) {
        case "center":
          v = (a.width - w) / 2;
          break;
        case "right":
          v = a.width - m - w;
          break;
        default:
          v = m;
      }
      const I = (a.height - p) / 2;
      return d >= v && d <= v + w && u >= I && u <= I + p;
    }
    if (r.type === O.IMAGE && r.image) {
      const f = r.image;
      if (f.clickable === !1) return !1;
      const g = f.images;
      if (!g || g.length <= 1)
        return !!(f.src || g && g[0]);
      const m = this.state.hoveredImageIndex ?? -1;
      return m >= 0 && m < g.length;
    }
    if (r.type === O.PROGRESS && r.progress) {
      const f = r.progress;
      if (f.interactive !== !0 || l) return !1;
      const g = f.shape ?? "line";
      if (g === "line") {
        const p = f.size ?? "medium", y = f.height ?? (p === "small" ? 6 : p === "large" ? 16 : 10), w = f.textPosition ?? "right", R = (f.showText ?? !0) && w === "right" ? 40 : 0, v = f.width ?? a.width - 8 * 2 - R, I = 8, M = (a.height - y) / 2;
        return d >= I && d <= I + v && u >= M && u <= M + y;
      }
      if (g === "circle" || g === "dashboard") {
        const m = f.size ?? "medium";
        let p, y = 0;
        g === "circle" ? p = m === "small" ? 0.6 : m === "large" ? 0.9 : 0.75 : (p = m === "small" ? 0.7 : m === "large" ? 0.95 : 0.85, y = a.height * 0.05);
        const w = Math.floor(a.height * p), C = f.width ?? w, R = f.strokeWidth ?? Math.max(2, Math.round(C * 0.12)), v = a.width / 2, I = a.height / 2 + y, M = (C - R) / 2, S = d - v, T = u - I, H = Math.sqrt(S * S + T * T);
        return H >= M - R && H <= M + R;
      }
    }
    if (r.type === O.RATING && r.rating) {
      if (l) return !1;
      const f = r.rating, g = f.max ?? 5, m = f.starSize ?? 16, p = g * m, y = (a.width - p) / 2, w = (a.height - m) / 2;
      return d >= y && d <= y + p && u >= w && u <= w + m;
    }
    if (r.type === O.COLOR && r.color) {
      if (l) return !1;
      const g = Math.min(a.height - 8 * 2, 24), m = (a.width - g) / 2, p = (a.height - g) / 2;
      return d >= m && d <= m + g && u >= p && u <= p + g;
    }
    return !1;
  }
  /**
   * 检查是否需要触发懒加载
   */
  checkLazyLoad(t, e) {
    if (!this.lazyLoadEnabled || this.isLoadingMore || !this.hasMoreData || e <= 0) return;
    const i = this.rows;
    if (i.length === 0) return;
    const s = this.layoutManager.getLayoutInfo(), o = s.viewportHeight, n = s.headerHeight, r = s.totalHeight - n, a = t + o - n, l = r - a, h = this.layoutManager.getRowHeightByIndex(i.length - 1);
    Math.ceil(l / h) <= this.lazyLoadThreshold && (this.isLoadingMore = !0, this.eventEmitter.emit(E.LOAD_MORE, {
      startIndex: i.length,
      scrollTop: t,
      direction: "down"
    }));
  }
  handleExternalWheel(t, e) {
    this.state.dropdown && this.dropdownHandler.updateDropdownPosition(), this.state.tooltip && this.updateTooltipPosition();
    const i = J(
      this.scrollState.scrollLeft + t,
      0,
      this.scrollState.maxScrollLeft
    ), s = J(
      this.scrollState.scrollTop + e,
      0,
      this.scrollState.maxScrollTop
    );
    (i !== this.scrollState.scrollLeft || s !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = s, this.scrollState.isScrolling = !0, this.eventEmitter.emit(E.SCROLL, i, s), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrollState.isScrolling = !1;
    }, 150));
  }
  handleEditingKeyDown(t) {
    var e;
    if (this.state.editingCell) {
      if ((e = this.isDomEditorActive) != null && e.call(this)) {
        if (t.key === "Tab") {
          t.preventDefault();
          const i = t.shiftKey ? -1 : 1;
          this.selectionHandler.moveSelection(0, i);
        }
        return;
      }
      switch (t.key) {
        case "Enter":
          this.endEditing(!0);
          break;
        case "Escape":
          this.endEditing(!1);
          break;
        case "Tab":
          t.preventDefault(), this.endEditing(!0);
          const i = t.shiftKey ? -1 : 1;
          this.selectionHandler.moveSelection(0, i);
          break;
      }
    }
  }
  handleEnterKey(t) {
    var i;
    if (this.state.selectedCells.length === 0) return;
    t.preventDefault(), t.stopPropagation();
    const e = this.state.selectedCells[0].start;
    if (this.editingConfig.enabled !== !1) {
      const o = this.layoutManager.getLeafColumns()[e.columnIndex], n = this.rows[e.rowIndex];
      if (o && n) {
        const r = lt(o, n, e.rowIndex), a = [
          O.CHECKBOX,
          O.RADIO,
          O.BUTTON,
          O.BUTTONS,
          O.SWITCH,
          O.RATING,
          O.PROGRESS
        ];
        if (r.type && a.includes(r.type)) {
          if (r.type === O.SWITCH && r.switch) {
            this.editorRegistry.getStrategy(o).canEdit(e, n, o) && this.eventEmitter.emit(
              E.SWITCH_CHANGE,
              this.getCellInfo(e),
              !r.switch.checked
            );
            return;
          }
          this.toggleRowExpand(e.rowIndex);
          return;
        }
        if (!this.editorRegistry.getStrategy(o).canEdit(e, n, o) || (i = r.input) != null && i.readonly) return;
        const l = this.getEditConfig(o, n, e.rowIndex);
        if (l) {
          if (l.type === O.SELECT && l.select) {
            this.startSelectEditing(e, l.select);
            return;
          }
          if (l.type === O.TAG && l.tags) {
            this.startTagsEditing(e, l.tags);
            return;
          }
          if (l.type === O.DATE && l.date) {
            this.startDateEditing(e, l.date);
            return;
          }
          if (l.type === O.COLOR && l.color) {
            this.startColorEditing(e, l.color);
            return;
          }
          this.startEditing(e, l.input);
          return;
        }
        if (r.type === O.SELECT && r.select) {
          this.startSelectEditing(e, r.select);
          return;
        }
        if (r.type === O.TAG && r.tags && r.tags.editable) {
          this.startTagsEditing(e, r.tags);
          return;
        }
        if (r.type === O.DATE && r.date) {
          this.startDateEditing(e, r.date);
          return;
        }
        if (r.type === O.COLOR && r.color) {
          this.startColorEditing(e, r.color);
          return;
        }
        if (r.type === O.IMAGE && r.image) {
          this.startImageEditing(e, r.image);
          return;
        }
        this.startEditing(e, r.input);
      }
    } else
      this.toggleRowExpand(e.rowIndex);
  }
  /**
   * 获取编辑配置
   * 优先级：editRender > render 返回的编辑配置 > null（走默认逻辑）
   */
  getEditConfig(t, e, i) {
    const s = e.data[$(t)];
    if (t.editRender)
      try {
        const o = t.editRender(s, e, i);
        if (o) return o;
      } catch (o) {
        console.error("Error in editRender:", o);
      }
    if (t.render)
      try {
        const o = t.render(s, e, t, i);
        if (o && o.type && o.type !== O.CUSTOM && o.type !== O.BUTTON && o.type !== O.BUTTONS && o.type !== O.IMAGE && o.type !== O.PROGRESS && o.type !== O.LINK)
          return {
            type: o.type,
            input: o.input,
            select: o.select,
            tags: o.tags,
            date: o.date,
            checkbox: o.checkbox,
            radio: o.radio,
            switch: o.switch
          };
      } catch (o) {
        console.error("Error in render:", o);
      }
    return null;
  }
  // === Editing methods - delegated to EditingHandler ===
  startEditing(t, e) {
    this.editingHandler.startEditing(t, e);
  }
  startSelectEditing(t, e) {
    this.editingHandler.startSelectEditing(t, e);
  }
  startTagsEditing(t, e) {
    this.editingHandler.startTagsEditing(t, e);
  }
  startDateEditing(t, e) {
    this.editingHandler.startDateEditing(t, e);
  }
  startColorEditing(t, e) {
    this.editingHandler.startColorEditing(t, e);
  }
  startImageEditing(t, e) {
    this.editingHandler.startImageEditing(t, e);
  }
  endEditing(t) {
    this.editingHandler.endEditing(t);
  }
  clearEditingState() {
    this.state.editingCell = null, this.state.editingValue = null;
  }
  isEditing() {
    return this.state.editingCell !== null;
  }
  getDropdown() {
    return this.state.dropdown;
  }
  toggleRowExpand(t) {
    const e = this.rows[t];
    !e || !e.children || (e.expanded = !e.expanded, this.eventEmitter.emit(E.EXPAND, e, t, e.expanded));
  }
  clearSelection() {
    this.selectionHandler.clearSelection();
  }
  resetState() {
    this.state.selectedCells = [], this.state.editingCell = null, this.state.editingValue = null, this.state.hoveredCell = null, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.state.dragTarget = null, this.state.tooltip = null, this.closeAllDropdowns(), this.sortConfig = [], this.filterConfig = [], this.state.switchAnimations.clear(), this.state.buttonHoverStates.clear(), this.eventEmitter.emit(E.SELECTION_CHANGE, []);
  }
  // ==================== Dropdown 公共方法 ====================
  /** 关闭 select/tags dropdown（公开方法，供 CanvasTable 在校验成功后调用） */
  closeSelectDropdown() {
    this.closeDropdown();
  }
  /** 关闭 select/tags dropdown */
  closeDropdown() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(E.DROPDOWN_CLOSE, null));
  }
  /** 关闭 filter dropdown */
  closeFilterDropdown() {
    this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_CLOSE));
  }
  /** 关闭 date dropdown（programmatic，非用户取消） */
  closeDateDropdown() {
    this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(E.DATE_DROPDOWN_CLOSE, null));
  }
  /** 关闭 color dropdown（programmatic，非用户取消） */
  closeColorDropdown() {
    this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(E.COLOR_DROPDOWN_CLOSE, null));
  }
  /** 关闭 buttons dropdown */
  closeButtonsDropdown() {
    this.state.buttonsDropdown && (this.state.buttonsDropdown = null);
  }
  /** 关闭所有 dropdown */
  closeAllDropdowns() {
    this.closeDropdown(), this.closeFilterDropdown(), this.closeDateDropdown(), this.closeColorDropdown(), this.closeButtonsDropdown();
  }
  /** 更新所有 dropdown 位置（滚动时调用） */
  updateAllDropdownPositions() {
    this.state.dateDropdown && this.dropdownHandler.updateDateDropdownPosition(), this.state.colorDropdown && this.dropdownHandler.updateColorDropdownPosition(), this.state.buttonsDropdown && this.dropdownHandler.updateButtonsDropdownPosition(), this.state.tooltip && this.updateTooltipPosition();
  }
  // ==================== End Dropdown 公共方法 ====================
  copySelection() {
    if (this.state.selectedCells.length === 0) return;
    const t = this.getSelectedText();
    navigator.clipboard.writeText(t).catch(() => {
    });
  }
  getSelectedText() {
    const t = [], e = this.layoutManager.getLeafColumns();
    for (const i of this.state.selectedCells) {
      const { minRow: s, maxRow: o, minCol: n, maxCol: r } = this.getNormalizedRange(i);
      for (let a = s; a <= o; a++) {
        const l = [];
        for (let h = n; h <= r; h++) {
          const c = e[h];
          if (!c) {
            l.push("");
            continue;
          }
          const d = this.rows[a];
          if (!d) {
            l.push("");
            continue;
          }
          const u = ue(c, d, a);
          l.push(u);
        }
        t.push(l.join("	"));
      }
    }
    return t.join(`
`);
  }
  setScrollPosition(t, e) {
    this.scrollState.scrollLeft = J(t, 0, this.scrollState.maxScrollLeft), this.scrollState.scrollTop = J(e, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
      E.SCROLL,
      this.scrollState.scrollLeft,
      this.scrollState.scrollTop
    );
  }
  updateMaxScroll(t, e) {
    this.scrollState.maxScrollLeft = t, this.scrollState.maxScrollTop = e;
  }
  setSortConfig(t) {
    this.sortConfig = t, this.headerHandler.updateSortConfig(t);
  }
  setFilterConfig(t) {
    this.filterConfig = t, this.headerHandler.updateFilterConfig(t);
  }
  setExpandColumnKey(t) {
    this.expandColumnKey = t;
  }
  setLazyLoadConfig(t, e = 5) {
    this.lazyLoadEnabled = t, this.lazyLoadThreshold = e, this.hasMoreData = !0;
  }
  setLoadingMore(t) {
    this.isLoadingMore = t;
  }
  /**
   * 设置是否还有更多数据
   * @param hasMore 是否还有更多数据，false 表示加载完成
   */
  setHasMore(t) {
    this.hasMoreData = t, t || (this.isLoadingMore = !0);
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
    var n;
    if (!this.state.filterDropdown) return;
    const { columnKey: t, mode: e } = this.state.filterDropdown, i = this.filterConfig.findIndex((r) => r.column === t);
    i >= 0 && this.filterConfig.splice(i, 1);
    let s = null, o = !1;
    switch (e) {
      case "search": {
        const r = (n = this.state.filterDropdown.searchValue) == null ? void 0 : n.trim();
        r && (s = r, o = !0);
        break;
      }
      case "select": {
        const r = this.state.filterDropdown.options;
        if (r) {
          const a = r.filter((l) => l.checked);
          a.length > 0 && a.length < r.length && (s = a.map((l) => l.value), o = !0);
        }
        break;
      }
      case "range": {
        const r = this.state.filterDropdown.minValue, a = this.state.filterDropdown.maxValue;
        (r !== "" || a !== "") && (s = {
          min: r !== "" ? Number(r) : void 0,
          max: a !== "" ? Number(a) : void 0
        }, o = !0);
        break;
      }
      case "dateRange": {
        const r = this.state.filterDropdown.startDate, a = this.state.filterDropdown.endDate;
        (r || a) && (s = {
          start: r,
          end: a
        }, o = !0);
        break;
      }
      case "boolean": {
        const r = this.state.filterDropdown.boolValue;
        r !== "all" && (s = r, o = !0);
        break;
      }
    }
    o && this.filterConfig.push({
      column: t,
      operator: this.getOperatorByMode(e),
      value: s
    }), this.eventEmitter.emit(E.FILTER_CHANGE, [...this.filterConfig]), this.state.filterDropdown = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_CLOSE);
  }
  /**
   * 根据筛选模式获取操作符
   */
  getOperatorByMode(t) {
    switch (t) {
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
  clearFilter() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.filterConfig.findIndex((i) => i.column === t);
    e >= 0 && this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.eventEmitter.emit(E.FILTER_CHANGE, [...this.filterConfig]), this.state.filterDropdown = null, this.eventEmitter.emit(E.FILTER_DROPDOWN_CLOSE);
  }
  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.filterConfig.findIndex((i) => i.column === t);
    e >= 0 && (this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.dataManager.filter(this.filterConfig), this.eventEmitter.emit(E.FILTER_CHANGE, [...this.filterConfig])), this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
  }
  /**
   * 处理筛选下拉框的搜索输入
   * 用于延迟加载模式下的选项搜索
   */
  handleFilterDropdownSearch(t) {
    if (!this.state.filterDropdown) return;
    const { mode: e, columnKey: i } = this.state.filterDropdown;
    if (e === "select") {
      this.state.filterDropdown.searchText = t;
      const o = this.layoutManager.getLeafColumns().find((r) => r.key === i);
      if (!o) return;
      const n = this.allRows.length > 0 ? this.allRows : this.rows;
      if (t.trim()) {
        const r = Ue(o, n, t);
        this.state.filterDropdown.options = r.map((a) => ({
          label: a.label,
          value: a.value,
          checked: !1
        })), this.state.filterDropdown.isLoading = !1;
      } else {
        const r = fe(o, n, 0);
        r.length === 0 && n.length > 0 ? (this.state.filterDropdown.isLoading = !0, this.state.filterDropdown.options = void 0) : (this.state.filterDropdown.options = r.map((a) => ({
          label: a.label,
          value: a.value,
          checked: !1
        })), this.state.filterDropdown.isLoading = !1);
      }
      this.state.filterDropdown.scrollTop = 0, this.state.filterDropdown.hoveredIndex = -1, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN);
    } else e === "search" && (this.state.filterDropdown.searchValue = t, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(t, e) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "range" || (this.state.filterDropdown.minValue = t, this.state.filterDropdown.maxValue = e, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(t) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "boolean" || (this.state.filterDropdown.boolValue = t, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(t, e) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "dateRange" || (this.state.filterDropdown.startDate = t, this.state.filterDropdown.endDate = e, this.eventEmitter.emit(E.FILTER_DROPDOWN_OPEN));
  }
  getScrollState() {
    return { ...this.scrollState };
  }
  getInteractionState() {
    return { ...this.state };
  }
  getSelectedCells() {
    const t = [];
    for (const e of this.state.selectedCells) {
      const { minRow: i, maxRow: s, minCol: o, maxCol: n } = this.getNormalizedRange(e);
      for (let r = i; r <= s; r++)
        for (let a = o; a <= n; a++)
          t.push({ rowIndex: r, columnIndex: a });
    }
    return t;
  }
  getSelectedRows() {
    const t = /* @__PURE__ */ new Set();
    for (const e of this.state.selectedCells) {
      const { minRow: i, maxRow: s } = this.getNormalizedRange(e);
      for (let o = i; o <= s; o++)
        t.add(o);
    }
    return Array.from(t);
  }
  setSelectedCells(t) {
    this.state.selectedCells = t.map((e) => ({
      start: e,
      end: e
    })), this.eventEmitter.emit(E.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  updateConfig(t, e) {
    this.editingConfig = e;
  }
  setRowHeightResizeEnabled(t) {
    this.rowHeightResizeEnabled = t;
  }
  setShouldBlockDropdownClose(t) {
    this.shouldBlockDropdownClose = t;
  }
  setDomEditorActiveChecker(t) {
    this.isDomEditorActive = t;
  }
  setShouldBlockEditingClose(t) {
    this.shouldBlockEditingClose = t;
  }
  setRowResizable(t) {
    this.rowResizable = t ?? !0;
  }
  setRowPinningEnabled(t) {
    this.enableRowPinning = t;
  }
  setRowPinnable(t) {
    this.rowPinnable = t ?? !0;
  }
  setLocale(t) {
    this.locale = t, this.handlerContext && (this.handlerContext.locale = t);
  }
  isRowPinnable(t) {
    return typeof this.rowPinnable == "function" ? this.rowPinnable(t) : this.rowPinnable;
  }
  getRowContextMenuItems(t) {
    const e = [], i = this.layoutManager.getRowPinPosition(t);
    return this.enableRowPinning && this.isRowPinnable(t) && (i !== "top" && e.push({ key: "pin-top", text: this.locale.contextMenu.pinTop }), i !== "bottom" && e.push({ key: "pin-bottom", text: this.locale.contextMenu.pinBottom }), i && e.push({ key: "unpin", text: this.locale.contextMenu.unpin })), e.push(
      { key: "add-above", text: this.locale.contextMenu.addRowAbove },
      { key: "add-below", text: this.locale.contextMenu.addRowBelow },
      { key: "delete", text: this.locale.contextMenu.deleteRow, danger: !0 }
    ), e;
  }
  isRowResizable(t) {
    if (this.rowResizable === !1)
      return !1;
    if (this.rowResizable === !0)
      return !0;
    const e = this.rows[t];
    return e ? this.rowResizable(e, t) : !1;
  }
  destroy() {
    this.isDestroyed = !0, this.scrollTimeout && (clearTimeout(this.scrollTimeout), this.scrollTimeout = null), this.unbindEvents(), this.unbindDocumentEvents(), this.buttonAnimationHandler.setDestroyed(!0), this.buttonAnimationHandler.clearAllAnimations();
  }
};
// 下拉菜单常量
b(q, "DROPDOWN_ITEM_HEIGHT", 32), b(q, "DROPDOWN_MAX_VISIBLE", 8), // 图片编辑器常量 (用于 ImageHandler 和其他图片相关操作)
b(q, "IMAGE_SIZE", 64), b(q, "IMAGE_PADDING", 8), b(q, "IMAGE_GAP", 8), b(q, "IMAGES_PER_ROW", 4), b(q, "IMAGE_UPLOAD_AREA_HEIGHT", 60), b(q, "IMAGE_MAX_ROWS", 3);
let Nt = q;
class Vi {
  constructor(t, e, i, s, o, n, r) {
    b(this, "wrapper");
    b(this, "layoutManager");
    b(this, "eventEmitter");
    b(this, "theme");
    b(this, "locale");
    b(this, "getRows");
    b(this, "inputElement", null);
    b(this, "editingCell", null);
    b(this, "scrollLeft", 0);
    b(this, "scrollTop", 0);
    b(this, "onScrollCallback", null);
    b(this, "beforeCommitCallback", null);
    b(this, "cancelCallback", null);
    b(this, "wheelHandler", null);
    /** 当 shouldBlockEditingClose 路径已处理提交时，跳过后续的 handleBlur */
    b(this, "skipNextBlur", !1);
    b(this, "placeholderStyle", null);
    b(this, "scrollbarStyle", null);
    b(this, "handleBlur", async () => {
      if (this.skipNextBlur) {
        this.skipNextBlur = !1;
        return;
      }
      await this.endEditing(!0);
    });
    b(this, "handleKeyDown", async (t) => {
      var s;
      const e = t, i = ((s = this.inputElement) == null ? void 0 : s.tagName) === "TEXTAREA";
      e.key === "Enter" && !i ? (e.preventDefault(), await this.endEditing(!0)) : e.key === "Enter" && i && (e.ctrlKey || e.metaKey) ? (e.preventDefault(), await this.endEditing(!0)) : e.key === "Escape" ? (e.preventDefault(), await this.endEditing(!1)) : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && t.stopPropagation();
    });
    b(this, "handleInputWheel", (t) => {
      const e = t;
      e.preventDefault(), this.onScrollCallback && this.onScrollCallback(e.deltaX, e.deltaY);
    });
    this.wrapper = t, this.layoutManager = i, this.eventEmitter = s, this.theme = o, this.locale = n, this.getRows = r;
  }
  setLocale(t) {
    this.locale = t;
  }
  setOnScrollCallback(t) {
    this.onScrollCallback = t;
  }
  setBeforeCommitCallback(t) {
    this.beforeCommitCallback = t;
  }
  setCancelCallback(t) {
    this.cancelCallback = t;
  }
  /** 标记下一次 blur 事件应被跳过（由 shouldBlockEditingClose 路径已处理提交） */
  markSkipNextBlur() {
    this.skipNextBlur = !0;
  }
  setTheme(t) {
    this.theme = t;
  }
  setScroll(t, e) {
    this.scrollLeft = t, this.scrollTop = e;
  }
  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  getCellInfo(t) {
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.getRows()[t.rowIndex];
    return !i || !o ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: o,
      column: i
    };
  }
  async startEditing(t, e) {
    if (this.inputElement && !await this.endEditing(!0) && this.inputElement)
      return !1;
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.getRows()[t.rowIndex];
    if (!s || !n) return !1;
    this.editingCell = t;
    const r = this.layoutManager.getCellMerge(t.rowIndex, t.columnIndex);
    let a;
    const l = r ? r.rowIndex : t.rowIndex;
    r ? a = this.layoutManager.getMergedCellPosition(r.rowIndex, r.columnIndex) : a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let h;
    s.fixed === "left" || s.fixed === "right" ? h = a.x : h = a.x - this.scrollLeft;
    const c = this.layoutManager.getCellViewportY(l, this.scrollTop), d = h - 1, u = c - 1, f = a.width + 2, g = 14 * 1.5, m = 8;
    if ((e == null ? void 0 : e.multiline) ?? !1) {
      const y = Math.max(1, Math.floor((a.height - m * 2) / g)), w = Math.min((e == null ? void 0 : e.maxRows) ?? y, y), C = g * w + m * 2, R = Math.min(a.height + 2, C + 2);
      this.inputElement = document.createElement("textarea");
      const v = String(n.data[$(s)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : v, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = xt(s.disabled, n, s), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${d}px;
        top: ${u}px;
        width: ${f}px;
        height: ${R}px;
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
        max-height: ${C}px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      const I = document.createElement("style");
      I.textContent = `
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
      `, document.head.appendChild(I), this.inputElement.className = "canvas-table-editor-textarea", this.scrollbarStyle = I;
      const M = document.createElement("style");
      M.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `, document.head.appendChild(M), this.placeholderStyle = M, this.wrapper.appendChild(this.inputElement);
      const S = () => {
        if (!this.inputElement) return;
        const T = this.inputElement, H = T.scrollTop;
        T.style.height = "auto";
        const D = T.scrollHeight, P = Math.max(R, Math.min(D, C));
        T.style.height = `${P}px`, T.scrollTop = H;
      };
      this.inputElement.addEventListener("input", S), requestAnimationFrame(() => {
        S();
      }), this.wheelHandler = (T) => {
        if (this.inputElement && T.target === this.inputElement) {
          const H = this.inputElement, D = H.scrollTop === 0, k = H.scrollTop + H.clientHeight >= H.scrollHeight - 1, P = T.deltaY < 0, B = T.deltaY > 0;
          (D && P || k && B) && T.preventDefault(), T.stopPropagation();
        }
      }, document.addEventListener("wheel", this.wheelHandler, { capture: !0, passive: !1 }), S();
    } else {
      const y = a.height + 2;
      this.inputElement = document.createElement("input"), this.inputElement.type = (e == null ? void 0 : e.type) ?? "text";
      const w = String(n.data[$(s)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : w, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = xt(s.disabled, n, s), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${d}px;
        top: ${u}px;
        width: ${f}px;
        height: ${y}px;
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
      const C = document.createElement("style");
      C.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `, document.head.appendChild(C), this.placeholderStyle = C, this.wrapper.appendChild(this.inputElement);
    }
    return this.inputElement.addEventListener("blur", this.handleBlur), this.inputElement.addEventListener("keydown", this.handleKeyDown), this.inputElement.addEventListener("wheel", this.handleInputWheel, { passive: !1 }), requestAnimationFrame(() => {
      this.inputElement && (this.inputElement.focus(), this.inputElement.select());
    }), !0;
  }
  async endEditing(t) {
    var s;
    const e = this.editingCell;
    let i = null;
    if (this.inputElement) {
      if (i = this.inputElement.value, t && e && this.beforeCommitCallback) {
        const o = this.beforeCommitCallback(e, i);
        Rt(o) && this.setLoadingState(!0);
        const n = Rt(o) ? await o : o;
        if (this.setLoadingState(!1), !n)
          return this.applyValidationStyle("error"), requestAnimationFrame(() => {
            var r;
            (r = this.inputElement) == null || r.focus();
          }), !1;
      }
      !t && e && ((s = this.cancelCallback) == null || s.call(this, e)), this.destroyInputElement();
    }
    return t && e && this.eventEmitter.emit(E.EDIT_END, this.getCellInfo(e), i), this.editingCell = null, !0;
  }
  isEditing() {
    return this.inputElement !== null;
  }
  getEditingCell() {
    return this.editingCell;
  }
  updatePosition() {
    if (this.inputElement && this.editingCell) {
      const e = this.layoutManager.getLeafColumns()[this.editingCell.columnIndex];
      if (!e) return;
      const i = this.layoutManager.getCellMerge(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex
      ), s = i ? i.rowIndex : this.editingCell.rowIndex, o = i ? this.layoutManager.getMergedCellPosition(i.rowIndex, i.columnIndex) : this.layoutManager.getCellPosition(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex
      );
      let n;
      e.fixed === "left" || e.fixed === "right" ? n = o.x : n = o.x - this.scrollLeft;
      const r = this.layoutManager.getCellViewportY(s, this.scrollTop);
      this.inputElement.style.left = `${n - 1}px`, this.inputElement.style.top = `${r - 1}px`;
    }
  }
  applyValidationStyle(t) {
    if (!this.inputElement) return;
    const e = t === "error" ? this.theme.colors.tagColors.error ?? "#ff4d4f" : this.theme.colors.selectionBorder;
    this.inputElement.style.border = `2px solid ${e}`;
  }
  setLoadingState(t) {
    this.inputElement && (t ? (this.inputElement.disabled = !0, this.inputElement.style.opacity = "0.6", this.inputElement.style.cursor = "wait") : (this.inputElement.disabled = !1, this.inputElement.style.opacity = "", this.inputElement.style.cursor = ""));
  }
  destroyInputElement() {
    this.inputElement && (this.inputElement.removeEventListener("blur", this.handleBlur), this.inputElement.removeEventListener("keydown", this.handleKeyDown), this.inputElement.removeEventListener("wheel", this.handleInputWheel), this.inputElement.remove(), this.inputElement = null), this.wheelHandler && (document.removeEventListener("wheel", this.wheelHandler, { capture: !0 }), this.wheelHandler = null), this.placeholderStyle && (this.placeholderStyle.remove(), this.placeholderStyle = null), this.scrollbarStyle && (this.scrollbarStyle.remove(), this.scrollbarStyle = null);
  }
  destroy() {
    this.destroyInputElement(), this.editingCell = null;
  }
}
class zi {
  constructor(t, e, i, s = nt) {
    b(this, "wrapper");
    b(this, "eventEmitter");
    b(this, "theme");
    b(this, "locale");
    // 输入元素
    b(this, "searchInput", null);
    b(this, "minInput", null);
    b(this, "maxInput", null);
    b(this, "currentMode", null);
    b(this, "currentColumnKey", null);
    b(this, "onInputChange", null);
    // 标记是否正在从外部更新，避免触发 input 事件导致循环
    b(this, "isUpdatingFromExternal", !1);
    this.wrapper = t, this.eventEmitter = e, this.theme = i, this.locale = s;
  }
  setTheme(t) {
    this.theme = t;
  }
  setLocale(t) {
    this.locale = t, this.updatePlaceholders();
  }
  updatePlaceholders() {
    this.searchInput && (this.searchInput.placeholder = this.currentMode === "select" ? this.locale.filter.selectSearchPlaceholder : this.locale.filter.searchPlaceholder), this.minInput && (this.minInput.placeholder = this.locale.filter.minPlaceholder), this.maxInput && (this.maxInput.placeholder = this.locale.filter.maxPlaceholder);
  }
  setOnInputChange(t) {
    this.onInputChange = t;
  }
  /**
   * 更新筛选下拉框状态并创建/更新输入框
   */
  updateFilterDropdown(t) {
    if (!t) {
      this.removeInputs(), this.currentMode = null, this.currentColumnKey = null;
      return;
    }
    const { mode: e, columnKey: i } = t;
    if (this.currentMode !== e || this.currentColumnKey !== i)
      switch (this.removeInputs(), this.currentMode = e, this.currentColumnKey = i, e) {
        case "search":
          this.createSearchInput(t);
          break;
        case "select":
          this.createSelectSearchInput(t);
          break;
        case "range":
          this.createRangeInputs(t);
          break;
      }
    else
      this.updatePositions(t), this.forceUpdateValues(t);
  }
  /**
   * 更新输入框位置和值（不重新创建）
   */
  updatePositions(t) {
    const { x: e, y: i, width: s } = t, o = 8;
    switch (this.isUpdatingFromExternal = !0, t.mode) {
      case "search": {
        const n = e + o, r = i + o, a = s - o * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${r}px`, this.searchInput.style.width = `${a}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchValue ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "select": {
        const n = e + o, r = i + o, a = s - o * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${r}px`, this.searchInput.style.width = `${a}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchText ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "range": {
        const r = (s - o * 3) / 2, a = i + o;
        if (this.minInput && (this.minInput.style.left = `${e + o}px`, this.minInput.style.top = `${a}px`, this.minInput.style.width = `${r}px`, document.activeElement !== this.minInput)) {
          const l = t.minValue !== void 0 && t.minValue !== "" ? String(t.minValue) : "";
          this.minInput.value !== l && (this.minInput.value = l);
        }
        if (this.maxInput && (this.maxInput.style.left = `${e + o + r + 8}px`, this.maxInput.style.top = `${a}px`, this.maxInput.style.width = `${r}px`, document.activeElement !== this.maxInput)) {
          const l = t.maxValue !== void 0 && t.maxValue !== "" ? String(t.maxValue) : "";
          this.maxInput.value !== l && (this.maxInput.value = l);
        }
        break;
      }
    }
    this.isUpdatingFromExternal = !1;
  }
  /**
   * 创建 search 模式的输入框
   */
  createSearchInput(t) {
    const { x: e, y: i, width: s } = t, o = 8, n = 36, r = e + o, a = i + o, l = s - o * 2;
    this.searchInput = document.createElement("input"), this.searchInput.type = "text", this.searchInput.value = t.searchValue ?? "", this.searchInput.placeholder = this.locale.filter.searchPlaceholder, this.searchInput.style.cssText = `
      position: absolute;
      left: ${r}px;
      top: ${a}px;
      width: ${l}px;
      height: ${n}px;
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
    `, this.searchInput.addEventListener("input", () => {
      !this.isUpdatingFromExternal && this.onInputChange && this.searchInput && this.onInputChange(this.searchInput.value, "searchValue");
    }), this.searchInput.addEventListener("focus", () => {
      this.searchInput && (this.searchInput.style.borderColor = this.theme.colors.input.focusBorder);
    }), this.searchInput.addEventListener("blur", () => {
      this.searchInput && (this.searchInput.style.borderColor = this.theme.colors.input.border);
    }), this.wrapper.appendChild(this.searchInput), requestAnimationFrame(() => {
      this.searchInput && this.searchInput.focus();
    });
  }
  /**
   * 创建 select 模式的搜索输入框
   */
  createSelectSearchInput(t) {
    const { x: e, y: i, width: s } = t, o = 8, n = 36 - o, r = e + o, a = i + o, l = s - o * 2;
    this.searchInput = document.createElement("input"), this.searchInput.type = "text", this.searchInput.value = t.searchText ?? "", this.searchInput.placeholder = this.locale.filter.selectSearchPlaceholder, this.searchInput.style.cssText = `
      position: absolute;
      left: ${r}px;
      top: ${a}px;
      width: ${l}px;
      height: ${n}px;
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
    `, this.searchInput.addEventListener("input", () => {
      !this.isUpdatingFromExternal && this.onInputChange && this.searchInput && this.onInputChange(this.searchInput.value, "searchText");
    }), this.searchInput.addEventListener("focus", () => {
      this.searchInput && (this.searchInput.style.borderColor = this.theme.colors.input.focusBorder);
    }), this.searchInput.addEventListener("blur", () => {
      this.searchInput && (this.searchInput.style.borderColor = this.theme.colors.input.border);
    }), this.wrapper.appendChild(this.searchInput), requestAnimationFrame(() => {
      this.searchInput && this.searchInput.focus();
    });
  }
  /**
   * 创建 range 模式的两个输入框
   */
  createRangeInputs(t) {
    const { x: e, y: i, width: s, minValue: o, maxValue: n } = t, r = 8, a = 32, l = 8, h = (s - r * 3) / 2, c = i + r;
    this.minInput = document.createElement("input"), this.minInput.type = "number", this.minInput.value = o !== void 0 && o !== "" ? String(o) : "", this.minInput.placeholder = this.locale.filter.minPlaceholder, this.minInput.style.cssText = `
      position: absolute;
      left: ${e + r}px;
      top: ${c}px;
      width: ${h}px;
      height: ${a}px;
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
    `, this.minInput.addEventListener("input", () => {
      !this.isUpdatingFromExternal && this.onInputChange && this.minInput && this.onInputChange(this.minInput.value, "minValue");
    }), this.minInput.addEventListener("focus", () => {
      this.minInput && (this.minInput.style.borderColor = this.theme.colors.input.focusBorder);
    }), this.minInput.addEventListener("blur", () => {
      this.minInput && (this.minInput.style.borderColor = this.theme.colors.input.border);
    }), this.maxInput = document.createElement("input"), this.maxInput.type = "number", this.maxInput.value = n !== void 0 && n !== "" ? String(n) : "", this.maxInput.placeholder = this.locale.filter.maxPlaceholder, this.maxInput.style.cssText = `
      position: absolute;
      left: ${e + r + h + l}px;
      top: ${c}px;
      width: ${h}px;
      height: ${a}px;
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
    `, this.maxInput.addEventListener("input", () => {
      !this.isUpdatingFromExternal && this.onInputChange && this.maxInput && this.onInputChange(this.maxInput.value, "maxValue");
    }), this.maxInput.addEventListener("focus", () => {
      this.maxInput && (this.maxInput.style.borderColor = this.theme.colors.input.focusBorder);
    }), this.maxInput.addEventListener("blur", () => {
      this.maxInput && (this.maxInput.style.borderColor = this.theme.colors.input.border);
    }), this.wrapper.appendChild(this.minInput), this.wrapper.appendChild(this.maxInput), requestAnimationFrame(() => {
      this.minInput && this.minInput.focus();
    });
  }
  /**
   * 移除所有输入框
   */
  removeInputs() {
    this.searchInput && (this.searchInput.remove(), this.searchInput = null), this.minInput && (this.minInput.remove(), this.minInput = null), this.maxInput && (this.maxInput.remove(), this.maxInput = null);
  }
  /**
   * 强制重置所有输入框的值
   * 用于重置按钮点击时，即使输入框有焦点也要清空
   */
  forceReset() {
    this.isUpdatingFromExternal = !0, this.searchInput && (this.searchInput.value = ""), this.minInput && (this.minInput.value = ""), this.maxInput && (this.maxInput.value = ""), this.isUpdatingFromExternal = !1;
  }
  /**
   * 强制更新输入框的值
   * 用于重新打开筛选器时同步状态
   */
  forceUpdateValues(t) {
    switch (this.isUpdatingFromExternal = !0, t.mode) {
      case "search":
        if (this.searchInput) {
          const e = t.searchValue ?? "";
          this.searchInput.value = e;
        }
        break;
      case "select":
        if (this.searchInput) {
          const e = t.searchText ?? "";
          this.searchInput.value = e;
        }
        break;
      case "range":
        if (this.minInput) {
          const e = t.minValue !== void 0 && t.minValue !== "" ? String(t.minValue) : "";
          this.minInput.value = e;
        }
        if (this.maxInput) {
          const e = t.maxValue !== void 0 && t.maxValue !== "" ? String(t.maxValue) : "";
          this.maxInput.value = e;
        }
        break;
    }
    this.isUpdatingFromExternal = !1;
  }
  /**
   * 更新输入框位置（滚动时调用）
   */
  updatePosition(t) {
    this.updatePositions(t);
  }
  /**
   * 销毁
   */
  destroy() {
    this.removeInputs();
  }
}
class Xi {
  constructor() {
    b(this, "listeners", /* @__PURE__ */ new Map());
  }
  on(t, e) {
    const i = t;
    this.listeners.has(i) || this.listeners.set(i, /* @__PURE__ */ new Set()), this.listeners.get(i).add(e);
  }
  off(t, e) {
    const i = this.listeners.get(t);
    i && i.delete(e);
  }
  emit(t, ...e) {
    const i = this.listeners.get(t);
    i && i.forEach((s) => {
      try {
        s(...e);
      } catch (o) {
        console.error(`Error in event handler for "${String(t)}":`, o);
      }
    });
  }
  once(t, e) {
    const i = (...s) => {
      this.off(t, i), e(...s);
    };
    this.on(t, i);
  }
  removeAllListeners(t) {
    t ? this.listeners.delete(t) : this.listeners.clear();
  }
  listenerCount(t) {
    var e;
    return ((e = this.listeners.get(t)) == null ? void 0 : e.size) ?? 0;
  }
}
const Q = {
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
}, ne = {
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
function bs(x) {
  var t, e, i, s, o, n, r, a, l, h, c, d, u, f, g, m;
  return x ? {
    ...Q,
    ...x,
    colors: {
      ...Q.colors,
      ...x.colors,
      tagColors: {
        ...Q.colors.tagColors,
        ...(t = x.colors) == null ? void 0 : t.tagColors
      },
      date: {
        ...Q.colors.date,
        ...(e = x.colors) == null ? void 0 : e.date
      },
      input: {
        ...Q.colors.input,
        ...(i = x.colors) == null ? void 0 : i.input
      },
      checkbox: {
        ...Q.colors.checkbox,
        ...(s = x.colors) == null ? void 0 : s.checkbox
      },
      radio: {
        ...Q.colors.radio,
        ...(o = x.colors) == null ? void 0 : o.radio
      },
      button: {
        ...Q.colors.button,
        ...(n = x.colors) == null ? void 0 : n.button
      },
      dropdown: {
        ...Q.colors.dropdown,
        ...(r = x.colors) == null ? void 0 : r.dropdown
      },
      scrollbar: {
        ...Q.colors.scrollbar,
        ...(a = x.colors) == null ? void 0 : a.scrollbar
      },
      indicator: {
        ...Q.colors.indicator,
        ...(l = x.colors) == null ? void 0 : l.indicator
      },
      tooltip: {
        ...Q.colors.tooltip,
        ...(h = x.colors) == null ? void 0 : h.tooltip
      },
      image: {
        ...Q.colors.image,
        ...(c = x.colors) == null ? void 0 : c.image
      },
      hiddenPlaceholder: {
        ...Q.colors.hiddenPlaceholder,
        ...(d = x.colors) == null ? void 0 : d.hiddenPlaceholder
      },
      moreCount: {
        ...Q.colors.moreCount,
        ...(u = x.colors) == null ? void 0 : u.moreCount
      },
      shadow: {
        ...Q.colors.shadow,
        ...(f = x.colors) == null ? void 0 : f.shadow
      },
      watermark: {
        ...Q.colors.watermark,
        ...(g = x.colors) == null ? void 0 : g.watermark
      },
      loading: (m = x.colors) != null && m.loading ? { ...Q.colors.loading, ...x.colors.loading } : Q.colors.loading
    },
    font: {
      ...Q.font,
      ...x.font
    },
    row: {
      ...Q.row,
      ...x.row
    },
    border: {
      ...Q.border,
      ...x.border
    }
  } : { ...Q };
}
class Yi {
  constructor(t, e, i = {}) {
    b(this, "element");
    b(this, "spinnerElement");
    b(this, "textElement");
    b(this, "theme");
    b(this, "config");
    this.theme = e, this.config = i, this.element = document.createElement("div"), this.element.style.cssText = `
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
    `, this.spinnerElement = document.createElement("div"), this.spinnerElement.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `, this.textElement = document.createElement("div"), this.textElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `, this.element.appendChild(this.spinnerElement), this.element.appendChild(this.textElement), t.appendChild(this.element);
    const s = "canvas-table-loading-animation";
    if (!document.getElementById(s)) {
      const o = document.createElement("style");
      o.id = s, o.textContent = `
        @keyframes canvas-table-spin {
          to { transform: rotate(360deg); }
        }
      `, document.head.appendChild(o);
    }
    this.element.addEventListener("mousedown", (o) => o.stopPropagation(), !0), this.element.addEventListener("mouseup", (o) => o.stopPropagation(), !0), this.element.addEventListener("click", (o) => o.stopPropagation(), !0), this.element.addEventListener("dblclick", (o) => o.stopPropagation(), !0), this.element.addEventListener(
      "wheel",
      (o) => {
        o.stopPropagation(), o.preventDefault();
      },
      { passive: !1 }
    ), this.element.addEventListener("touchstart", (o) => o.stopPropagation(), !0), this.element.addEventListener(
      "touchmove",
      (o) => {
        o.stopPropagation(), o.preventDefault();
      },
      { passive: !1 }
    ), this.element.addEventListener("touchend", (o) => o.stopPropagation(), !0), this.element.addEventListener("keydown", (o) => o.stopPropagation(), !0), this.element.addEventListener("keyup", (o) => o.stopPropagation(), !0), this.element.addEventListener("contextmenu", (o) => {
      o.stopPropagation(), o.preventDefault();
    }), this.applyTheme();
  }
  applyTheme() {
    const t = this.theme.colors.loading ?? {
      background: "rgba(255, 255, 255, 0.85)",
      spinnerBorder: "#d9d9d9",
      spinnerActive: "#1890ff",
      text: "#333333"
    };
    this.element.style.background = t.background, this.spinnerElement.style.borderColor = t.spinnerBorder, this.spinnerElement.style.borderTopColor = t.spinnerActive, this.spinnerElement.style.animation = "canvas-table-spin 1s linear infinite", this.textElement.style.color = t.text, this.textElement.style.fontFamily = this.theme.font.family;
  }
  setTheme(t) {
    this.theme = t, this.applyTheme();
  }
  setConfig(t) {
    this.config = t, this.updateText();
  }
  updateText() {
    this.textElement.textContent = this.config.text ?? nt.loadingText;
  }
  show(t) {
    t ? this.textElement.textContent = t : this.updateText(), this.element.style.display = "flex";
  }
  hide() {
    this.element.style.display = "none";
  }
  isVisible() {
    return this.element.style.display === "flex";
  }
  destroy() {
    this.element.parentNode && this.element.parentNode.removeChild(this.element);
  }
}
class $i {
  constructor() {
    b(this, "topPinnedRows", /* @__PURE__ */ new Set());
    b(this, "bottomPinnedRows", /* @__PURE__ */ new Set());
  }
  pin(t, e) {
    e === "top" ? (this.bottomPinnedRows.delete(t), this.topPinnedRows.add(t)) : (this.topPinnedRows.delete(t), this.bottomPinnedRows.add(t));
  }
  remove(t) {
    this.topPinnedRows.delete(t), this.bottomPinnedRows.delete(t);
  }
  clear() {
    this.topPinnedRows.clear(), this.bottomPinnedRows.clear();
  }
  getPosition(t) {
    return this.topPinnedRows.has(t) ? "top" : this.bottomPinnedRows.has(t) ? "bottom" : null;
  }
  isPinned(t) {
    return this.getPosition(t) !== null;
  }
  isPinnedTop(t) {
    return this.topPinnedRows.has(t);
  }
  isPinnedBottom(t) {
    return this.bottomPinnedRows.has(t);
  }
  getTopRows() {
    return [...this.topPinnedRows];
  }
  getBottomRows() {
    return [...this.bottomPinnedRows];
  }
}
class Gi {
  static buildRows(t, e, i) {
    var l, h;
    const s = (t == null ? void 0 : t.enabled) ?? !!((l = t == null ? void 0 : t.rows) != null && l.length), o = (t == null ? void 0 : t.position) ?? "bottom", n = (t == null ? void 0 : t.scope) ?? "view";
    if (!s || !((h = t == null ? void 0 : t.rows) != null && h.length))
      return { enabled: !1, position: o, scope: n, rows: [] };
    const r = n === "all" ? e.allRows : e.viewRows, a = {
      ...e,
      scopeRows: r
    };
    return {
      enabled: s,
      position: o,
      scope: n,
      rows: t.rows.map((c, d) => {
        var m;
        const u = (m = c.build) == null ? void 0 : m.call(c, a), f = this.normalizeRowResult(u, c.cells ?? []), g = {
          key: c.key,
          height: f.height ?? c.height ?? i,
          cells: [],
          source: c
        };
        return g.cells = this.buildCells(f.cells, g, d, a), g;
      })
    };
  }
  static normalizeRowResult(t, e) {
    return Array.isArray(t) ? { cells: t } : t || { cells: e };
  }
  static buildCells(t, e, i, s) {
    const o = [], n = /* @__PURE__ */ new Set();
    return t.forEach((r, a) => {
      const l = this.resolveColumnRange(r, s.visibleLeafColumns);
      if (!l) return;
      for (let c = l.startColumnIndex; c <= l.endColumnIndex; c++)
        if (n.has(c))
          throw new Error(`Overlapping summary cells in row "${e.key}"`);
      for (let c = l.startColumnIndex; c <= l.endColumnIndex; c++)
        n.add(c);
      const h = s.visibleLeafColumns[l.startColumnIndex];
      o.push({
        key: `${e.key}:${a}`,
        ...l,
        config: r,
        renderResult: this.resolveRenderResult(r, e, i, h, s)
      });
    }), o;
  }
  static resolveColumnRange(t, e) {
    const i = t.startColumnKey ?? t.columnKey, s = t.endColumnKey ?? t.columnKey ?? i;
    if (!i || !s) return;
    const o = e.findIndex((l) => l.key === i), n = e.findIndex((l) => l.key === s);
    if (o < 0 || n < 0) return;
    const r = Math.min(o, n), a = Math.max(o, n);
    return {
      startColumnIndex: r,
      endColumnIndex: a,
      startColumnKey: e[r].key,
      endColumnKey: e[a].key
    };
  }
  static resolveRenderResult(t, e, i, s, o) {
    return t.render ? t.render({
      cell: t,
      row: e,
      rowIndex: i,
      column: s,
      columnIndex: o.visibleLeafColumns.indexOf(s),
      context: o
    }) : {
      text: String(t.text ?? t.value ?? ""),
      type: t.type ?? "text",
      style: t.style
    };
  }
}
const Ui = {
  isInteractive: !0,
  canEdit(x, t, e) {
    return e.editable === !1 ? !1 : !xt(e.disabled, t, e);
  }
}, Ki = {
  isInteractive: !1,
  canEdit(x, t, e) {
    return e.editable === !1 ? !1 : !xt(e.disabled, t, e);
  },
  shouldBlockFocusLoss(x, t) {
    return t.level === "error";
  }
}, ji = {
  isInteractive: !0,
  canEdit(x, t, e) {
    return e.editable === !0;
  }
}, Qi = /* @__PURE__ */ new Set([
  O.CHECKBOX,
  O.RADIO,
  O.SWITCH,
  O.SELECT,
  O.TAG,
  O.DATE,
  O.COLOR,
  O.RATING,
  O.PROGRESS,
  O.BUTTON,
  O.BUTTONS
]), qi = /* @__PURE__ */ new Set([O.INPUT, O.TEXT, O.NUMBER]);
class Zi {
  constructor() {
    b(this, "strategies", /* @__PURE__ */ new Map());
    for (const t of Qi)
      this.strategies.set(t, Ui);
    for (const t of qi)
      this.strategies.set(t, Ki);
  }
  /** 注册自定义策略 */
  register(t, e) {
    this.strategies.set(t, e);
  }
  /** 获取列对应的编辑器策略 */
  getStrategy(t) {
    const e = t.type ?? O.TEXT, i = this.strategies.get(e);
    return i || ji;
  }
  /** 检查列是否是交互式编辑器 */
  isInteractive(t) {
    return this.getStrategy(t).isInteractive;
  }
}
class Rs {
  constructor(t, e) {
    b(this, "container");
    b(this, "wrapper");
    b(this, "canvas");
    b(this, "props");
    b(this, "dataManager");
    b(this, "layoutManager");
    b(this, "rowPinManager");
    b(this, "renderer");
    b(this, "interactionManager");
    b(this, "editorManager");
    b(this, "editorRegistry");
    b(this, "filterInputManager");
    b(this, "eventEmitter");
    b(this, "loadingOverlay");
    b(this, "theme");
    b(this, "themeMode");
    b(this, "locale");
    b(this, "mediaQuery", null);
    b(this, "isDestroyed", !1);
    b(this, "resizeObserver", null);
    b(this, "renderCache");
    b(this, "rowIdManager");
    b(this, "columnIdManager");
    b(this, "scheduledRender", null);
    b(this, "manualLoading", !1);
    // 用户手动设置的 loading 状态
    b(this, "validationErrorRows", /* @__PURE__ */ new WeakMap());
    b(this, "pendingValidationCells", /* @__PURE__ */ new Set());
    b(this, "pendingAnimationFrame", null);
    b(this, "forcedValidationTooltipCell", null);
    b(this, "warningTooltipTimeout", null);
    b(this, "handleResize", Ne(() => {
      this.resize();
    }, 100));
    b(this, "handleThemeChange", () => {
      this.themeMode === "auto" && (this.theme = this.resolveTheme(), this.applyTheme(), this.render());
    });
    var n, r, a, l, h, c;
    if (typeof t == "string") {
      const d = document.querySelector(t);
      if (!d)
        throw new Error(`Container not found: ${t}`);
      this.container = d;
    } else
      this.container = t;
    this.props = e, this.locale = te(e.locale), this.themeMode = e.themeMode ?? "light", this.theme = this.resolveTheme(), this.themeMode === "auto" && this.setupAutoThemeDetection(), this.wrapper = document.createElement("div"), this.wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `, this.container.appendChild(this.wrapper), this.canvas = document.createElement("canvas"), this.canvas.style.cssText = `
      display: block;
      position: relative;
      z-index: 1;
    `, this.wrapper.appendChild(this.canvas), this.loadingOverlay = new Yi(this.wrapper, this.theme, {
      text: this.props.loadingText ?? this.locale.loadingText
    }), this.eventEmitter = new Xi(), this.setupEventHandlers();
    const i = {
      enabled: ((n = e.virtualScroll) == null ? void 0 : n.enabled) ?? !0,
      rowBufferSize: ((r = e.virtualScroll) == null ? void 0 : r.rowBufferSize) ?? e.bufferSize ?? 5,
      columnBufferSize: ((a = e.virtualScroll) == null ? void 0 : a.columnBufferSize) ?? 2
    };
    ((l = e.virtualScroll) == null ? void 0 : l.estimatedRowHeight) !== void 0 && (i.estimatedRowHeight = e.virtualScroll.estimatedRowHeight), ((h = e.virtualScroll) == null ? void 0 : h.estimatedColumnWidth) !== void 0 && (i.estimatedColumnWidth = e.virtualScroll.estimatedColumnWidth);
    const s = e.selection ?? {
      mode: "cell",
      multi: !0
    }, o = e.editing ?? {
      enabled: !0,
      mode: "dblclick"
    };
    this.dataManager = new Ze(e.rowKey), this.layoutManager = new Ot(i, this.theme), this.rowPinManager = new $i(), this.layoutManager.setRowPinManager(this.rowPinManager), this.layoutManager.setShowRowNumbers(e.showRowNumbers === !0), this.layoutManager.setRowHeightFn(e.rowHeight), this.renderer = new Bi(this.canvas, this.theme, this.layoutManager, this.locale), this.renderer.setMultipleSelectSeparator(e.multipleSelectSeparator ?? ", "), this.rowIdManager = this.renderer.getRowIdManager(), this.columnIdManager = this.renderer.getColumnIdManager(), this.renderCache = new qe(
      this.rowIdManager,
      this.columnIdManager,
      this.dataManager.getRowVersionManager()
    ), this.renderer.setRenderCache(this.renderCache), this.renderer.setOnImageLoaded(() => this.render()), e.watermark && this.renderer.setWatermarkConfig(e.watermark), e.imageLoad && this.renderer.setImageLoadConfig(e.imageLoad), this.editorRegistry = new Zi(), this.interactionManager = new Nt(
      this.canvas,
      this.layoutManager,
      this.dataManager,
      this.eventEmitter,
      s,
      o,
      this.locale,
      this.editorRegistry
    ), this.interactionManager.setRowHeightResizeEnabled(e.enableRowHeightResize === !0), this.interactionManager.setRowResizable(e.rowResizable), this.interactionManager.setShouldBlockDropdownClose(async (d) => {
      var y;
      const u = this.layoutManager.getLeafColumn(d.columnIndex), f = this.dataManager.getRows()[d.rowIndex];
      if (!u || !f) return !1;
      const g = this.interactionManager.getDropdown();
      let m;
      return g && g.type === "tags" && g.tagsConfig ? m = g.tagsConfig.multiple !== !1 ? g.tagsConfig.selectedValues ?? [] : ((y = g.tagsConfig.selectedValues) == null ? void 0 : y[0]) ?? "" : g ? m = g.config.value : m = f.data[$(u)], !await this.validateEditorCommit(d, m);
    }), this.interactionManager.setShouldBlockEditingClose(async (d) => {
      var p;
      const u = this.editorManager.getEditingCell();
      if (u) {
        if (d && d.preventDefault(), this.editorManager.markSkipNextBlur(), !await this.editorManager.endEditing(!0)) {
          const w = this.layoutManager.getLeafColumn(u.columnIndex);
          if (w) {
            const C = this.editorRegistry.getStrategy(w), R = this.getValidationError(u);
            if (R && !C.shouldBlockFocusLoss(u, R))
              return await this.editorManager.endEditing(!1), !1;
          }
          return !0;
        }
        return !1;
      }
      const f = this.interactionManager.getDropdown();
      if (f) {
        const y = this.layoutManager.getLeafColumn(f.cell.columnIndex), w = this.dataManager.getRows()[f.cell.rowIndex];
        if (!y || !w) return !1;
        let C;
        return f.type === "tags" && f.tagsConfig ? C = f.tagsConfig.multiple !== !1 ? f.tagsConfig.selectedValues ?? [] : ((p = f.tagsConfig.selectedValues) == null ? void 0 : p[0]) ?? "" : C = f.config.value, !await this.validateEditorCommit(f.cell, C);
      }
      const g = this.interactionManager.getDateDropdown();
      if (g) {
        const y = this.layoutManager.getLeafColumn(g.cell.columnIndex), w = this.dataManager.getRows()[g.cell.rowIndex];
        if (!y || !w) return !1;
        const C = g.selectedDate ?? w.data[$(y)];
        return !await this.validateEditorCommit(g.cell, C);
      }
      const m = this.interactionManager.getColorDropdown();
      if (m) {
        const y = this.layoutManager.getLeafColumn(m.cell.columnIndex), w = this.dataManager.getRows()[m.cell.rowIndex];
        if (!y || !w) return !1;
        const C = m.config.value ?? w.data[$(y)];
        return !await this.validateEditorCommit(m.cell, C);
      }
      return !1;
    }), this.interactionManager.setDomEditorActiveChecker(() => this.editorManager.isEditing()), this.interactionManager.setRowPinningEnabled(e.enableRowPinning === !0), this.interactionManager.setRowPinnable(e.rowPinnable), this.interactionManager.setGetScrollbarBounds(() => {
      const d = this.interactionManager.getScrollState();
      return this.renderer.getScrollbarBounds(
        d.scrollLeft,
        d.scrollTop,
        d.maxScrollLeft,
        d.maxScrollTop
      );
    }), this.editorManager = new Vi(
      this.wrapper,
      this.canvas,
      this.layoutManager,
      this.eventEmitter,
      this.theme,
      this.locale,
      () => this.dataManager.getRows()
    ), this.editorManager.setOnScrollCallback((d, u) => {
      this.interactionManager.handleExternalWheel(d, u);
    }), this.editorManager.setBeforeCommitCallback(
      (d, u) => this.validateEditorCommit(d, u)
    ), this.editorManager.setCancelCallback((d) => {
      var f;
      this.clearValidationErrorForCell(d);
      const u = this.layoutManager.getLeafColumn(d.columnIndex);
      if (u) {
        const g = this.editorRegistry.getStrategy(u);
        (f = g.onCancel) == null || f.call(g, d);
      }
    }), this.filterInputManager = new zi(
      this.wrapper,
      this.eventEmitter,
      this.theme,
      this.locale
    ), this.filterInputManager.setOnInputChange((d, u) => {
      const f = this.interactionManager.getFilterDropdown();
      f && (u === "searchValue" || u === "searchText" ? this.interactionManager.handleFilterDropdownSearch(d) : u === "minValue" ? this.interactionManager.handleFilterDropdownRangeUpdate(
        d,
        String(f.maxValue ?? "")
      ) : u === "maxValue" && this.interactionManager.handleFilterDropdownRangeUpdate(
        String(f.minValue ?? ""),
        d
      ), this.render());
    }), (c = e.lazyLoad) != null && c.enabled && this.interactionManager.setLazyLoadConfig(!0, e.lazyLoad.threshold ?? 5), this.setupInternalEventListeners(), this.setupResizeObserver(), this.initialize();
  }
  setupInternalEventListeners() {
    this.eventEmitter.on(E.SCROLL, (t, e) => {
      this.editorManager.setScroll(t, e), this.editorManager.updatePosition();
      const i = this.interactionManager.getFilterDropdown();
      i && this.filterInputManager.updatePosition(i), this.render();
    }), this.eventEmitter.on(E.COLUMN_RESIZE, () => {
      const t = this.dataManager.getColumns();
      this.layoutManager.calculateColumnLayoutOnly(t), this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      ), this.render();
    }), this.eventEmitter.on(E.ROW_RESIZE_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(
      E.ROW_HEIGHT_CHANGE,
      (t, e, i) => {
        const s = t, o = e;
        if (!this.layoutManager.updateRowHeight(s, o)) {
          const r = this.dataManager.getColumns(), a = this.dataManager.getRows();
          this.layoutManager.calculateLayout(r, a);
        }
        this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop()
        ), this.editorManager.updatePosition(), this.render();
      }
    ), this.eventEmitter.on(E.COLUMN_REORDER, (t, e) => {
      const i = t, s = e;
      this.dataManager.reorderColumns(i, s);
      const o = this.dataManager.getColumns();
      if (this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(o), this.props.onColumnReorder) {
        const n = o.map((r) => r.key);
        this.props.onColumnReorder(n);
      }
      this.render();
    }), this.eventEmitter.on(E.COLUMN_REORDER_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(E.COLUMN_SWAP, (t, e) => {
      const i = t, s = e;
      this.dataManager.swapColumnsByKey(i, s);
      const o = this.dataManager.getColumns();
      this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(o), this.render();
    }), this.eventEmitter.on(E.SORT_CHANGE, (t) => {
      const e = t;
      this.dataManager.sort(e), this.interactionManager.setSortConfig(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(E.FILTER_CHANGE, (t) => {
      const e = t;
      this.dataManager.filter(e), this.interactionManager.setFilterConfig(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(E.FILTER_DROPDOWN_OPEN, () => {
      const t = this.interactionManager.getFilterDropdown();
      this.filterInputManager.updateFilterDropdown(t), this.render();
    }), this.eventEmitter.on(E.FILTER_DROPDOWN_CLOSE, () => {
      this.filterInputManager.updateFilterDropdown(null), this.render();
    }), this.eventEmitter.on(E.FILTER_DROPDOWN_CONFIRM, () => {
      this.interactionManager.applyFilter(), this.filterInputManager.updateFilterDropdown(null), this.render();
    }), this.eventEmitter.on(E.FILTER_DROPDOWN_RESET, () => {
      this.interactionManager.resetFilterValue(), this.filterInputManager.forceReset(), this.render();
    }), this.eventEmitter.on(E.FILTER_DROPDOWN_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(E.SELECTION_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(E.CELL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const s = this.dataManager.getRows()[t.rowIndex];
        s && this.eventEmitter.emit(E.ROW_CLICK, s, t.rowIndex, e);
      }
    }), this.eventEmitter.on(E.CELL_DBL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const s = this.dataManager.getRows()[t.rowIndex];
        s && this.eventEmitter.emit(E.ROW_DBL_CLICK, s, t.rowIndex, e);
      }
    }), this.eventEmitter.on(E.CELL_HOVER, (t) => {
      this.render();
    }), this.eventEmitter.on(E.HEADER_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.CHECKBOX_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onCheckboxChange
      );
    }), this.eventEmitter.on(E.RADIO_CHANGE, async (t, e) => {
      await this.handleEditorCommit(t, e, this.props.onRadioChange);
    }), this.eventEmitter.on(E.SWITCH_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onSwitchChange
      );
    }), this.eventEmitter.on(E.PROGRESS_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onProgressChange
      );
    }), this.eventEmitter.on(E.PROGRESS_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(E.RATING_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onRatingChange
      );
    }), this.eventEmitter.on(E.COLOR_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onColorChange
      );
    }), this.eventEmitter.on(E.COLOR_DROPDOWN_OPEN, () => {
      var e;
      const t = this.interactionManager.getColorDropdown();
      if (t) {
        const i = this.layoutManager.getLeafColumn(t.cell.columnIndex), s = this.dataManager.getRows()[t.cell.rowIndex];
        if (i && s) {
          const o = this.editorRegistry.getStrategy(i);
          (e = o.onDropdownOpen) == null || e.call(o, t.cell, s, i);
        }
      }
      this.render();
    }), this.eventEmitter.on(E.COLOR_DROPDOWN_CLOSE, (t) => {
      var i;
      const e = t;
      if (e) {
        const s = this.layoutManager.getLeafColumn(e.columnIndex);
        if (s) {
          const o = this.editorRegistry.getStrategy(s);
          (i = o.onDropdownCancel) == null || i.call(o, e);
        }
      }
      this.render();
    }), this.eventEmitter.on(E.COLOR_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.SWITCH_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(E.BUTTON_HOVER_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(E.EDIT_START, async (t, e) => {
      const i = t, s = e;
      await this.editorManager.startEditing(i, s);
      const o = this.layoutManager.getLeafColumn(i.columnIndex);
      if (o) {
        const n = this.editorRegistry.getStrategy(o);
        !n.isInteractive && n.onEditStart && n.onEditStart(i, s);
      }
      this.render();
    }), this.eventEmitter.on(
      E.SELECT_CHANGE,
      async (t, e, i) => {
        const s = t, o = i;
        await this.handleEditorCommit(s, e, this.props.onSelectChange) && (o || (this.clearValidationErrorForCell(s), this.interactionManager.closeSelectDropdown()));
      }
    ), this.eventEmitter.on(
      E.TAGS_CHANGE,
      async (t, e, i) => {
        const s = t, o = e, n = i, r = n ? o : o[0] ?? "";
        await this.handleEditorCommit(
          s,
          r,
          this.props.onTagsChange ? (l, h) => this.props.onTagsChange(l, o) : void 0
        ) && !n && (this.clearValidationErrorForCell(s), this.interactionManager.closeSelectDropdown());
      }
    ), this.eventEmitter.on(E.EXPAND, (t, e, i) => {
      const s = t, o = e, n = i;
      this.props.onExpand && this.props.onExpand(s, o, n), this.dataManager.toggleRowExpand(o), this.updateLayout(), this.render();
    }), this.eventEmitter.on(E.DROPDOWN_OPEN, () => {
      var e;
      const t = this.interactionManager.getDropdown();
      if (t) {
        const i = this.layoutManager.getLeafColumn(t.cell.columnIndex), s = this.dataManager.getRows()[t.cell.rowIndex];
        if (i && s) {
          const o = this.editorRegistry.getStrategy(i);
          (e = o.onDropdownOpen) == null || e.call(o, t.cell, s, i);
        }
      }
      this.render();
    }), this.eventEmitter.on(E.DROPDOWN_CLOSE, (t) => {
      var i;
      const e = t;
      if (e) {
        this.clearValidationErrorForCell(e);
        const s = this.layoutManager.getLeafColumn(e.columnIndex);
        if (s) {
          const o = this.editorRegistry.getStrategy(s);
          (i = o.onDropdownCancel) == null || i.call(o, e);
        }
      }
      this.render();
    }), this.eventEmitter.on(E.DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.BUTTONS_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(E.DATE_DROPDOWN_OPEN, () => {
      var e;
      const t = this.interactionManager.getDateDropdown();
      if (t) {
        const i = this.layoutManager.getLeafColumn(t.cell.columnIndex), s = this.dataManager.getRows()[t.cell.rowIndex];
        if (i && s) {
          const o = this.editorRegistry.getStrategy(i);
          (e = o.onDropdownOpen) == null || e.call(o, t.cell, s, i);
        }
      }
      this.render();
    }), this.eventEmitter.on(E.DATE_DROPDOWN_CLOSE, (t) => {
      var i;
      const e = t;
      if (e) {
        const s = this.layoutManager.getLeafColumn(e.columnIndex);
        if (s) {
          const o = this.editorRegistry.getStrategy(s);
          (i = o.onDropdownCancel) == null || i.call(o, e);
        }
      }
      this.render();
    }), this.eventEmitter.on(E.DATE_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.DATE_SELECT, async (t, e) => {
      await this.handleEditorCommit(t, e, this.props.onEditEnd), this.interactionManager.clearEditingState(), this.render();
    }), this.eventEmitter.on(E.CONTEXT_MENU_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(E.CONTEXT_MENU_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(E.CONTEXT_MENU_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.HEADER_CONTEXT_MENU_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(E.HEADER_CONTEXT_MENU_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(E.HEADER_CONTEXT_MENU_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.COLUMN_HIDE, (t) => {
      const e = t;
      this.hideColumnInternal(e);
    }), this.eventEmitter.on(E.COLUMN_SHOW, (t) => {
      const e = t;
      this.showColumnInternal(e);
    }), this.eventEmitter.on(E.ROW_ADD_ABOVE, (t) => {
      const e = t, i = this.dataManager.getColumns(), s = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, s, "above"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(E.ROW_ADD_BELOW, (t) => {
      const e = t, i = this.dataManager.getColumns(), s = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, s, "below"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(E.ROW_DELETE, (t) => {
      const e = t;
      this.rowPinManager.remove(e), this.dataManager.deleteRowByRef(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(E.ROW_PIN_CHANGE, (t, e) => {
      var r, a;
      const i = t, s = e, o = this.rowPinManager.getPosition(i);
      s ? this.rowPinManager.pin(i, s) : this.rowPinManager.remove(i), this.layoutManager.updateRowPin(i, o, s) ? (this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      ), this.editorManager.updatePosition()) : this.updateLayout(), this.render(), (a = (r = this.props).onRowPinChange) == null || a.call(r, i, s);
    }), this.eventEmitter.on(E.UNDO, () => {
      this.undo();
    }), this.eventEmitter.on(E.REDO, () => {
      this.redo();
    }), this.eventEmitter.on(
      E.IMAGE_CLICK,
      (t, e, i) => {
        const s = t, o = e, n = i;
        this.props.onImageClick && this.props.onImageClick(s, o, n);
      }
    ), this.eventEmitter.on(E.IMAGE_TOOLTIP_SCROLL, () => {
      this.render();
    }), this.eventEmitter.on(E.IMAGE_TOOLTIP_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.IMAGE_EDITOR_SCROLL, () => {
      this.render();
    }), this.eventEmitter.on(E.IMAGE_EDITOR_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(E.IMAGE_EDITOR_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(E.IMAGE_UPLOAD, (t, e) => {
      const i = t, s = e;
      this.props.onImageUpload && this.props.onImageUpload(i, s);
    }), this.eventEmitter.on(
      E.IMAGE_DELETE,
      (t, e, i) => {
        const s = t, o = e, n = i;
        this.props.onImageDelete && this.props.onImageDelete(s, o, n);
      }
    ), this.eventEmitter.on(E.EDIT_END, async (t, e) => {
      await this.handleEditorCommit(t, e, this.props.onEditEnd), this.interactionManager.clearEditingState(), this.render();
    }), this.eventEmitter.on(E.LOAD_MORE, (t) => {
      const e = t;
      this.props.onLoadMore && this.props.onLoadMore(e);
    });
  }
  setupEventHandlers() {
    const t = {
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
    for (const [e, i] of Object.entries(t))
      if (i) {
        const s = e.replace("on", "").replace(/^./, (o) => o.toLowerCase());
        this.eventEmitter.on(s, i);
      }
  }
  setupResizeObserver() {
    typeof ResizeObserver < "u" && (this.resizeObserver = new ResizeObserver(this.handleResize), this.resizeObserver.observe(this.container)), window.addEventListener("resize", this.handleResize);
  }
  async initialize() {
    try {
      const t = this.container.getBoundingClientRect(), e = t.width || this.props.width || 800, i = t.height || this.props.height || 400;
      this.renderer.resize(e, i), this.layoutManager.setViewportSize(e, i), await this.dataManager.loadRows(this.props.rows), this.dataManager.setColumns(this.props.columns), this.props.expandColumnKey && (this.renderer.setExpandColumnKey(this.props.expandColumnKey), this.interactionManager.setExpandColumnKey(this.props.expandColumnKey)), this.updateLayout();
      const s = {
        rows: this.dataManager.getRows(),
        columns: this.dataManager.getColumns()
      };
      this.eventEmitter.emit(E.LOAD, s), this.render();
    } catch (t) {
      const e = t instanceof Error ? t : new Error(String(t));
      this.eventEmitter.emit(E.ERROR, e);
    }
  }
  updateLayout() {
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows();
    this.updateSummaryRows(), this.layoutManager.calculateLayout(t, e), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    );
  }
  updateSummaryRows() {
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows(), i = this.dataManager.getAllRows(), s = Gi.buildRows(
      this.props.summary,
      {
        columns: t,
        visibleLeafColumns: this.layoutManager.getVisibleLeafColumnsForLayout(t),
        viewRows: e,
        allRows: i,
        scopeRows: e
      },
      this.theme.row.height
    );
    this.layoutManager.setSummaryRows(
      s.position === "top" ? s.rows : [],
      s.position === "bottom" ? s.rows : []
    );
  }
  refreshSummaryRowsAfterDataChange() {
    this.updateSummaryRows(), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    ), this.editorManager.updatePosition();
  }
  normalizeValidationResult(t) {
    if (t === !0)
      return { valid: !0, level: "error" };
    if (t === !1)
      return { valid: !1, message: "Invalid value", level: "error" };
    if (typeof t == "string")
      return { valid: !1, message: t || "Invalid value", level: "error" };
    if (!t || typeof t != "object")
      return { valid: !0, level: "error" };
    const e = t.message || (t.valid ? void 0 : "Invalid value");
    return {
      valid: t.valid,
      message: e,
      level: t.level ?? "error"
    };
  }
  async handleValidation(t, e, i) {
    var u, f, g, m, p;
    const s = this.editorRegistry.getStrategy(e), o = e.validate ?? ((u = e.editor) == null ? void 0 : u.validate), n = s.validate;
    if (!o && !n) return { valid: !0, issue: null };
    const r = this.dataManager.getRows()[t.rowIndex];
    if (!r) return { valid: !0, issue: null };
    const a = o ? o(i, r, e) : n(t, i, r, e), l = Rt(a);
    l && this.addPendingValidation(t);
    const h = l ? await a : a, c = this.normalizeValidationResult(h), d = c.message && (c.level === "warning" || !c.valid) ? {
      cell: t,
      row: r,
      column: e,
      value: i,
      message: c.message,
      level: c.level
    } : null;
    if (l && this.removePendingValidation(t), d) {
      const y = this.validationErrorRows.get(r) ?? /* @__PURE__ */ new Map();
      if (y.set(e.key, d), this.validationErrorRows.set(r, y), this.forcedValidationTooltipCell = d.cell, d.level === "warning") {
        const w = d.cell;
        this.warningTooltipTimeout && clearTimeout(this.warningTooltipTimeout), this.warningTooltipTimeout = setTimeout(() => {
          this.isDestroyed || this.forcedValidationTooltipCell && this.forcedValidationTooltipCell.rowIndex === w.rowIndex && this.forcedValidationTooltipCell.columnIndex === w.columnIndex && (this.forcedValidationTooltipCell = null, this.render());
        }, 3e3);
      }
      (g = (f = this.props).onValidationError) == null || g.call(f, d), d.level === "error" ? (m = s.onReject) == null || m.call(s, t, d) : d.level === "warning" && ((p = s.onWarning) == null || p.call(s, t, d));
    } else
      this.deleteValidationError(r, e.key);
    return {
      valid: c.valid || c.level === "warning",
      issue: d
    };
  }
  addPendingValidation(t) {
    const e = `${t.rowIndex}-${t.columnIndex}`;
    this.pendingValidationCells.add(e), this.startPendingAnimation();
  }
  removePendingValidation(t) {
    const e = `${t.rowIndex}-${t.columnIndex}`;
    this.pendingValidationCells.delete(e), this.pendingValidationCells.size === 0 && this.stopPendingAnimation();
  }
  startPendingAnimation() {
    if (this.pendingAnimationFrame !== null) return;
    const t = () => {
      this.pendingValidationCells.size > 0 ? (this.render(), this.pendingAnimationFrame = requestAnimationFrame(t)) : this.pendingAnimationFrame = null;
    };
    this.pendingAnimationFrame = requestAnimationFrame(t);
  }
  stopPendingAnimation() {
    this.pendingAnimationFrame !== null && (cancelAnimationFrame(this.pendingAnimationFrame), this.pendingAnimationFrame = null);
  }
  deleteValidationError(t, e) {
    const i = this.validationErrorRows.get(t);
    i && (i.delete(e), i.size === 0 && this.validationErrorRows.delete(t)), this.clearTooltipForValidation(t, e);
  }
  clearTooltipForValidation(t, e) {
    if (this.forcedValidationTooltipCell) {
      const i = this.dataManager.getRows()[this.forcedValidationTooltipCell.rowIndex], s = this.layoutManager.getLeafColumn(
        this.forcedValidationTooltipCell.columnIndex
      );
      i === t && (s == null ? void 0 : s.key) === e && (this.forcedValidationTooltipCell = null);
    }
  }
  async commitCellValue(t, e, i) {
    var r;
    const { valid: s } = await this.handleValidation(t, e, i);
    if (!s) return !1;
    const o = this.dataManager.getRows()[t.rowIndex];
    this.dataManager.updateCell(t.rowIndex, e.key, i, $(e)), this.refreshSummaryRowsAfterDataChange();
    const n = this.editorRegistry.getStrategy(e);
    return (r = n.onCommit) == null || r.call(n, t, i, o, e), !0;
  }
  /**
   * 统一的编辑器提交流程 — 交互式和 DOM 编辑器共用
   *
   * get column → await commitCellValue → if committed call callback → render
   */
  async handleEditorCommit(t, e, i) {
    const s = this.layoutManager.getLeafColumn(t.columnIndex);
    if (!s)
      return this.render(), !1;
    const o = this.editorRegistry.getStrategy(s);
    if (o.isInteractive) {
      const r = o;
      if (r.beforeInteract) {
        const a = this.dataManager.getRows()[t.rowIndex];
        if (a && !r.beforeInteract(t, a, s))
          return this.render(), !1;
      }
    }
    const n = await this.commitCellValue(t, s, e);
    return n && (i == null || i(t, e)), this.performRender(), this.scheduledRender = null, n;
  }
  async validateEditorCommit(t, e) {
    const i = this.layoutManager.getLeafColumn(t.columnIndex);
    if (!i) return !0;
    const { valid: s } = await this.handleValidation(t, i, e);
    return s ? (this.clearValidationErrorForCell(t), !0) : (this.render(), !1);
  }
  clearValidationErrorForCell(t) {
    const e = this.dataManager.getRows()[t.rowIndex], i = this.layoutManager.getLeafColumn(t.columnIndex);
    e && i && this.deleteValidationError(e, i.key), this.render();
  }
  buildVisibleValidationErrorIndex() {
    const t = /* @__PURE__ */ new Map(), e = this.dataManager.getRows(), i = this.layoutManager.getVisibleRange(), s = this.layoutManager.getLeafColumns();
    for (let o = i.startRow; o <= i.endRow; o++) {
      const n = e[o];
      if (!n) continue;
      const r = this.validationErrorRows.get(n);
      if (r)
        for (let a = 0; a < s.length; a++) {
          const l = s[a];
          if (!l) continue;
          const h = r.get(l.key);
          h && t.set(`${o}-${a}`, h);
        }
    }
    return t;
  }
  render() {
    this.isDestroyed || this.scheduledRender || (this.scheduledRender = () => {
      this.performRender(), this.scheduledRender = null;
    }, requestAnimationFrame(() => {
      this.scheduledRender && this.scheduledRender();
    }));
  }
  performRender() {
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows(), i = this.interactionManager.getInteractionState(), s = this.interactionManager.getScrollState();
    if (this.layoutManager.setScrollPosition(s.scrollLeft, s.scrollTop), e.length === 0) {
      this.loadingOverlay.hide(), this.renderer.renderEmptyState(
        this.props.emptyText ?? this.locale.emptyText,
        this.dataManager.getSort(),
        this.dataManager.getFilters(),
        i.hoveredHeaderColumnKey,
        s.scrollLeft
      );
      const m = this.interactionManager.getFilterDropdown();
      m && this.renderer.renderFilterDropdown(m), this.renderer.renderWatermark();
      return;
    }
    if (this.dataManager.isLoading() || this.manualLoading) {
      this.loadingOverlay.show(this.props.loadingText ?? this.locale.loadingText), this.renderer.renderWatermark();
      return;
    }
    this.loadingOverlay.hide();
    const o = this.layoutManager.getVisibleRange();
    this.renderer.render(
      t,
      e,
      o,
      s.scrollLeft,
      s.scrollTop,
      {
        hoveredCell: i.hoveredCell,
        selectedCells: i.selectedCells,
        editingCell: i.editingCell,
        sortConfig: this.dataManager.getSort(),
        filterConfig: this.dataManager.getFilters(),
        showHeader: this.props.showHeader !== !1,
        stripeRows: this.props.stripeRows !== !1,
        dropdown: i.dropdown,
        hoveredHeaderColumnKey: i.hoveredHeaderColumnKey,
        switchAnimations: i.switchAnimations,
        buttonHoverStates: i.buttonHoverStates,
        columnReorderState: i.columnReorderState,
        headerContextMenu: i.headerContextMenu,
        hoveredImageIndex: this.interactionManager.getHoveredImageIndex(),
        hoveredButtonIndex: this.interactionManager.getHoveredButtonIndex(),
        progressDragState: i.progressDragState,
        rowResizeState: i.rowResizeState,
        validationErrors: this.buildVisibleValidationErrorIndex(),
        pendingValidations: this.pendingValidationCells
      }
    );
    const n = this.interactionManager.getScrollbarState();
    this.renderer.renderScrollbars(
      s.scrollLeft,
      s.scrollTop,
      s.maxScrollLeft,
      s.maxScrollTop,
      n
    );
    const r = this.forcedValidationTooltipCell ?? i.hoveredCell, a = this.getValidationTooltip(
      r,
      s.scrollLeft,
      s.scrollTop
    );
    if (a && i.tooltip) {
      const m = i.tooltip.cell, p = a.cell.rowIndex === m.rowIndex && a.cell.columnIndex === m.columnIndex, y = a.content.type === "text" ? a.content.text : "";
      if (p && i.tooltip.content.type === "text") {
        const w = i.tooltip.content.text;
        this.renderer.renderTooltip({
          ...a,
          content: {
            type: "text",
            text: y + `
` + w
          }
        });
      } else
        this.renderer.renderTooltip(a);
    } else a ? this.renderer.renderTooltip(a) : i.tooltip && this.renderer.renderTooltip(i.tooltip);
    const l = this.interactionManager.getFilterDropdown();
    l && this.renderer.renderFilterDropdown(l);
    const h = this.interactionManager.getDateDropdown();
    h && this.renderer.renderDateDropdown(h);
    const c = this.interactionManager.getColorDropdown();
    c && this.renderer.renderColorDropdown(c);
    const d = this.interactionManager.getButtonsDropdown();
    d && this.renderer.renderButtonsDropdown(d);
    const u = this.interactionManager.getImageTooltip();
    u && this.renderer.renderImageTooltip(u);
    const f = this.interactionManager.getImageEditor();
    f && this.renderer.renderImageEditor(f);
    const g = this.interactionManager.getContextMenu();
    g && this.renderer.renderContextMenu(g), this.renderer.renderWatermark();
  }
  resize() {
    if (this.isDestroyed) return;
    const t = this.container.getBoundingClientRect(), e = t.width || this.props.width || 800, i = t.height || this.props.height || 400;
    this.renderer.resize(e, i), this.layoutManager.setViewportSize(e, i), this.updateLayout(), this.render();
  }
  setRows(t) {
    this.dataManager.loadRows(t).then(() => {
      this.interactionManager.setScrollPosition(0, 0), this.interactionManager.resetState(), this.editorManager.destroy(), this.renderer.clearImageCache(), wt.clearCache(), this.renderer.resetRowIds(), this.renderCache.clear(), this.updateLayout(), this.render();
    }).catch((e) => {
      this.eventEmitter.emit(E.ERROR, e);
    });
  }
  getRows() {
    return this.dataManager.getRows();
  }
  getRow(t) {
    return this.dataManager.getRows()[t];
  }
  getColumns() {
    return this.dataManager.getColumns();
  }
  setColumns(t) {
    this.dataManager.setColumns(t), this.renderer.resetColumnIds(), this.renderCache.clear(), this.updateLayout(), this.render();
  }
  async scrollToRow(t, e) {
    const i = this.layoutManager.getScrollOffsetForRow(t);
    let s = this.interactionManager.getScrollState().scrollLeft;
    e !== void 0 && (s = this.layoutManager.getScrollOffsetForColumn(e)), this.interactionManager.setScrollPosition(s, i), this.render();
  }
  scrollTo(t, e) {
    this.interactionManager.setScrollPosition(t, e), this.render();
  }
  getScrollPosition() {
    const t = this.interactionManager.getScrollState();
    return {
      scrollLeft: t.scrollLeft,
      scrollTop: t.scrollTop
    };
  }
  getSelectedCells() {
    return this.interactionManager.getSelectedCells();
  }
  getSelectedRows() {
    return this.interactionManager.getSelectedRows();
  }
  getPinnedRows(t) {
    return t === "top" ? this.rowPinManager.getTopRows() : this.rowPinManager.getBottomRows();
  }
  setSelectedCells(t) {
    this.interactionManager.setSelectedCells(t), this.render();
  }
  setSelectedRows(t) {
    t.forEach((e) => {
      this.dataManager.setRowSelected(e, !0);
    }), this.render();
  }
  clearSelection() {
    this.interactionManager.clearSelection(), this.dataManager.selectAll(!1), this.render();
  }
  async updateCell(t, e, i) {
    const s = this.layoutManager.getColumnByKey(e), o = this.layoutManager.getLeafColumnIndexByKey(e);
    if (s && o !== null) {
      if (!await this.commitCellValue({ rowIndex: t, columnIndex: o }, s, i)) {
        this.render();
        return;
      }
    } else {
      const l = this.dataManager.updateCell(t, e, i);
      this.eventEmitter.emit(E.CHANGE, [l]), this.refreshSummaryRowsAfterDataChange(), this.render();
      return;
    }
    const n = this.dataManager.getRows()[t], r = $(s), a = {
      type: "update",
      rowIndex: t,
      column: r,
      newValue: n == null ? void 0 : n.data[r]
    };
    this.eventEmitter.emit(E.CHANGE, [a]), this.render();
  }
  async updateRow(t, e) {
    const i = this.layoutManager.getLeafColumns();
    for (let o = 0; o < i.length; o++) {
      const n = i[o];
      if (!n) continue;
      const r = $(n), a = Object.prototype.hasOwnProperty.call(e, r), l = Object.prototype.hasOwnProperty.call(e, n.key);
      if (!a && !l)
        continue;
      const h = a ? e[r] : e[n.key], c = { rowIndex: t, columnIndex: o };
      if (!(await this.handleValidation(c, n, h)).valid) {
        this.render();
        return;
      }
    }
    const s = this.dataManager.updateRow(t, e);
    this.eventEmitter.emit(E.CHANGE, s), this.refreshSummaryRowsAfterDataChange(), this.render();
  }
  getValidationErrors() {
    const t = [], e = this.dataManager.getRows();
    for (const i of e) {
      const s = this.validationErrorRows.get(i);
      if (s)
        for (const o of s.values())
          t.push(o);
    }
    return t;
  }
  getValidationError(t) {
    var s;
    const e = this.dataManager.getRows()[t.rowIndex], i = this.layoutManager.getLeafColumn(t.columnIndex);
    return !e || !i ? null : ((s = this.validationErrorRows.get(e)) == null ? void 0 : s.get(i.key)) ?? null;
  }
  clearValidationErrors() {
    this.validationErrorRows = /* @__PURE__ */ new WeakMap(), this.forcedValidationTooltipCell = null, this.render();
  }
  getValidationTooltip(t, e, i) {
    if (!t)
      return null;
    const s = this.getValidationError(t);
    if (!s)
      return null;
    const o = this.layoutManager.getLeafColumn(t.columnIndex), n = this.layoutManager.getCellPosition(
      t.rowIndex,
      t.columnIndex
    ), r = (o == null ? void 0 : o.fixed) === "left" || (o == null ? void 0 : o.fixed) === "right" ? n.x : n.x - e;
    return {
      cell: t,
      x: r,
      y: n.y - i,
      width: n.width,
      content: { type: "text", text: s.message }
    };
  }
  addRow(t, e) {
    const i = this.dataManager.addRow(t, e);
    this.eventEmitter.emit(E.CHANGE, [i]), this.updateLayout(), this.render();
  }
  deleteRow(t) {
    const e = this.dataManager.deleteRow(t);
    this.eventEmitter.emit(E.CHANGE, [e]), this.updateLayout(), this.render();
  }
  /**
   * 追加数据行（用于懒加载）
   * @param rows 要追加的行数据
   */
  appendRows(t) {
    const e = this.dataManager.getAllRows();
    this.dataManager.setRows([...e, ...t]), this.interactionManager.setLoadingMore(!1), this.updateLayout(), this.render();
  }
  /**
   * 设置加载更多状态
   * @param loading 是否正在加载
   */
  setLoadingMore(t) {
    this.interactionManager.setLoadingMore(t);
  }
  /**
   * 设置是否还有更多数据
   * @param hasMore 是否还有更多数据，false 表示加载完成
   */
  setHasMore(t) {
    this.interactionManager.setHasMore(t);
  }
  /**
   * 显示 loading overlay
   * @param text 可选的 loading 文本
   */
  showLoading(t) {
    this.manualLoading = !0, this.loadingOverlay.show(t ?? this.props.loadingText ?? this.locale.loadingText), this.render();
  }
  /**
   * 隐藏 loading overlay
   */
  hideLoading() {
    this.manualLoading = !1, this.loadingOverlay.hide(), this.render();
  }
  sort(t) {
    this.dataManager.sort(t), this.interactionManager.setSortConfig(t), this.eventEmitter.emit(E.SORT, t), this.updateLayout(), this.render();
  }
  filter(t) {
    this.dataManager.filter(t), this.interactionManager.setFilterConfig(t), this.eventEmitter.emit(E.FILTER, t), this.updateLayout(), this.render();
  }
  clearFilters() {
    this.dataManager.clearFilters(), this.interactionManager.setFilterConfig([]), this.eventEmitter.emit(E.FILTER, []), this.updateLayout(), this.render();
  }
  async export(t) {
    var e;
    switch (t.format) {
      case "csv":
        return new Blob(
          [
            Ut(
              this.dataManager.exportData({
                includeHeaders: t.includeHeaders ?? !0,
                includeHidden: t.includeHidden ?? !1,
                selectedOnly: t.selectedOnly ?? !1,
                showRowNumbers: this.props.showRowNumbers === !0
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
                includeHeaders: t.includeHeaders ?? !0,
                includeHidden: t.includeHidden ?? !1,
                selectedOnly: t.selectedOnly ?? !1,
                showRowNumbers: this.props.showRowNumbers === !0
              }),
              null,
              2
            )
          ],
          { type: "application/json" }
        );
      case "excel": {
        this.updateSummaryRows();
        const i = this.layoutManager.getRowBandsForRender(), s = this.dataManager.getExportContext({
          includeHeaders: t.includeHeaders ?? !0,
          includeHidden: t.includeHidden ?? !1,
          selectedOnly: t.selectedOnly ?? !1,
          showRowNumbers: this.props.showRowNumbers === !0
        }), o = We(
          {
            ...s,
            summaryTopRows: i.summaryTop.rows,
            summaryBottomRows: i.summaryBottom.rows
          },
          t.excel,
          ((e = t.filename) == null ? void 0 : e.replace(/\.[^.]+$/, "")) ?? "Sheet1"
        );
        return Ae(o);
      }
      default:
        return new Blob(
          [
            Ut(
              this.dataManager.exportData({
                includeHeaders: t.includeHeaders ?? !0,
                includeHidden: t.includeHidden ?? !1,
                selectedOnly: t.selectedOnly ?? !1,
                showRowNumbers: this.props.showRowNumbers === !0
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
    const t = this.dataManager.undo();
    return t && (this.updateLayout(), this.render()), t;
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
    const t = this.dataManager.redo();
    return t && (this.updateLayout(), this.render()), t;
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
  setHistoryOptions(t) {
    this.dataManager.setHistoryOptions(t);
  }
  hideColumn(t) {
    this.hideColumnInternal(t);
  }
  showColumn(t) {
    this.showColumnInternal(t);
  }
  showColumnInternal(t) {
    const e = this.dataManager.getColumns(), i = [], s = (r, a = []) => {
      for (const l of r) {
        if (l.key === t) {
          for (const h of a)
            i.push(h.key);
          return !0;
        }
        if (l.children && s(l.children, [...a, l]))
          return !0;
      }
      return !1;
    }, o = (r, a) => {
      let l, h, c = !1;
      const d = (u) => {
        for (const f of u)
          if (c && h === void 0 && !f.hidden && (f.fixed === "left" || f.fixed === "right") && (h = f.fixed), f.key === a && (c = !0), !c && !f.hidden && f.key !== a && (f.fixed === "left" || f.fixed === "right") && (l = f.fixed), f.children && d(f.children), c && h !== void 0)
            return;
      };
      return d(r), { prevFixed: l, nextFixed: h };
    }, n = (r) => {
      for (const a of r) {
        if (a.key === t || i.includes(a.key)) {
          if (a.hidden = !1, a.key === t && a.fixed === void 0) {
            const { prevFixed: h, nextFixed: c } = o(e, t);
            h !== void 0 && h === c && (a.fixed = h);
          }
          const l = (h) => {
            for (const c of h)
              c.hidden = !1, c.children && l(c.children);
          };
          return a.children && l(a.children), !0;
        }
        if (a.children && n(a.children))
          return !0;
      }
      return !1;
    };
    s(e), n(e) && (this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.updateSummaryRows(), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    ), this.render(), this.props.onColumnShow && this.props.onColumnShow(t));
  }
  hideColumnInternal(t) {
    const e = this.dataManager.getColumns(), i = (o) => {
      if (o.hidden = !0, o.children)
        for (const n of o.children)
          i(n);
    }, s = (o) => {
      for (const n of o) {
        if (n.key === t)
          return i(n), !0;
        if (n.children && s(n.children))
          return !0;
      }
      return !1;
    };
    s(e) && (this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    ), this.render(), this.props.onColumnHide && this.props.onColumnHide(t));
  }
  getViewConfig() {
    const t = this.dataManager.getColumns(), e = {};
    t.forEach((s, o) => {
      e[s.key] = this.layoutManager.getColumnWidthByIndex(o);
    });
    const i = (s) => {
      const o = [];
      for (const n of s)
        n.hidden && o.push(n.key), n.children && o.push(...i(n.children));
      return o;
    };
    return {
      columnWidths: e,
      columnOrder: t.map((s) => s.key),
      hiddenColumns: i(t),
      fixedColumns: { left: [], right: [] },
      sort: this.dataManager.getSort(),
      filters: this.dataManager.getFilters()
    };
  }
  setViewConfig(t) {
    if (t.sort && this.dataManager.sort(t.sort), t.filters && this.dataManager.filter(t.filters), t.hiddenColumns) {
      const e = this.dataManager.getColumns(), i = (s, o) => {
        for (const n of s)
          n.hidden = o.includes(n.key), n.children && i(n.children, o);
      };
      i(e, t.hiddenColumns);
    }
    this.updateLayout(), this.render();
  }
  setLocale(t) {
    this.props = { ...this.props, locale: t }, this.locale = te(t), this.loadingOverlay.setConfig({
      text: this.props.loadingText ?? this.locale.loadingText
    }), this.renderer.setLocale(this.locale), this.interactionManager.setLocale(this.locale), this.filterInputManager.setLocale(this.locale), this.render();
  }
  getLocale() {
    return this.locale;
  }
  refresh() {
    this.updateLayout(), this.render();
  }
  createDefaultRowData(t) {
    const e = {};
    for (const i of t) {
      const s = $(i);
      switch (i.type) {
        case "number":
          e[s] = 0;
          break;
        case "checkbox":
        case "switch":
          e[s] = !1;
          break;
        case "date":
          e[s] = "";
          break;
        default:
          e[s] = "";
      }
    }
    return e;
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
  setThemeMode(t) {
    if (this.themeMode === t) return;
    const e = this.themeMode === "auto", i = t === "auto";
    this.themeMode = t, e && !i ? this.teardownAutoThemeDetection() : !e && i && this.setupAutoThemeDetection(), this.theme = this.resolveTheme(), this.applyTheme(), this.render();
  }
  setTheme(t) {
    this.theme = this.resolveTheme(t), this.applyTheme(), this.render();
  }
  setWatermark(t) {
    this.renderer.setWatermarkConfig(t), this.render();
  }
  /**
   * 设置图片加载配置
   */
  setImageLoadConfig(t) {
    this.renderer.setImageLoadConfig(t);
  }
  /**
   * 获取图片加载队列统计信息
   */
  getImageLoadStats() {
    return this.renderer.getImageLoadStats();
  }
  setExpandColumnKey(t) {
    this.renderer.setExpandColumnKey(t), this.interactionManager.setExpandColumnKey(t), this.render();
  }
  resolveTheme(t) {
    var s, o, n, r, a, l, h, c, d, u, f, g, m, p, y;
    let e;
    this.themeMode === "auto" ? e = window.matchMedia("(prefers-color-scheme: dark)").matches ? ne : Q : this.themeMode === "dark" ? e = ne : e = Q;
    const i = t ?? this.props.theme;
    return i ? {
      ...e,
      ...i,
      colors: {
        ...e.colors,
        ...i.colors,
        tagColors: {
          ...e.colors.tagColors,
          ...(s = i.colors) == null ? void 0 : s.tagColors
        },
        date: {
          ...e.colors.date,
          ...(o = i.colors) == null ? void 0 : o.date
        },
        input: {
          ...e.colors.input,
          ...(n = i.colors) == null ? void 0 : n.input
        },
        checkbox: {
          ...e.colors.checkbox,
          ...(r = i.colors) == null ? void 0 : r.checkbox
        },
        radio: {
          ...e.colors.radio,
          ...(a = i.colors) == null ? void 0 : a.radio
        },
        button: {
          ...e.colors.button,
          ...(l = i.colors) == null ? void 0 : l.button
        },
        dropdown: {
          ...e.colors.dropdown,
          ...(h = i.colors) == null ? void 0 : h.dropdown
        },
        scrollbar: {
          ...e.colors.scrollbar,
          ...(c = i.colors) == null ? void 0 : c.scrollbar
        },
        indicator: {
          ...e.colors.indicator,
          ...(d = i.colors) == null ? void 0 : d.indicator
        },
        tooltip: {
          ...e.colors.tooltip,
          ...(u = i.colors) == null ? void 0 : u.tooltip
        },
        image: {
          ...e.colors.image,
          ...(f = i.colors) == null ? void 0 : f.image
        },
        hiddenPlaceholder: {
          ...e.colors.hiddenPlaceholder,
          ...(g = i.colors) == null ? void 0 : g.hiddenPlaceholder
        },
        moreCount: {
          ...e.colors.moreCount,
          ...(m = i.colors) == null ? void 0 : m.moreCount
        },
        shadow: {
          ...e.colors.shadow,
          ...(p = i.colors) == null ? void 0 : p.shadow
        },
        watermark: {
          ...e.colors.watermark,
          ...(y = i.colors) == null ? void 0 : y.watermark
        }
      },
      font: {
        ...e.font,
        ...i.font
      },
      row: {
        ...e.row,
        ...i.row
      },
      border: {
        ...e.border,
        ...i.border
      }
    } : { ...e };
  }
  applyTheme() {
    this.layoutManager.setTheme(this.theme), this.renderer.setTheme(this.theme), this.editorManager.setTheme(this.theme), this.filterInputManager.setTheme(this.theme), this.loadingOverlay.setTheme(this.theme);
  }
  setupAutoThemeDetection() {
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)"), this.mediaQuery.addEventListener("change", this.handleThemeChange);
  }
  teardownAutoThemeDetection() {
    this.mediaQuery && (this.mediaQuery.removeEventListener("change", this.handleThemeChange), this.mediaQuery = null);
  }
  // 性能监控 API
  /**
   * 启用或禁用渲染器性能监控
   * @param enabled 是否启用
   */
  setPerformanceMonitoring(t) {
    this.renderer.setPerformanceMonitoring(t);
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
    return this.renderer.getPerformanceReport();
  }
  /**
   * 打印性能统计报告到控制台
   */
  printPerformanceReport() {
    this.renderer.printPerformanceReport();
  }
  /**
   * 重置性能统计数据
   */
  resetPerformanceStats() {
    this.renderer.resetPerformanceStats();
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
    console.group("CanvasTable State"), console.log("Filters:", this.getFilterConfig()), console.log("Sorts:", this.getSortConfig()), console.groupEnd();
  }
  destroy() {
    this.isDestroyed || (this.isDestroyed = !0, this.stopPendingAnimation(), this.warningTooltipTimeout && (clearTimeout(this.warningTooltipTimeout), this.warningTooltipTimeout = null), this.teardownAutoThemeDetection(), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), window.removeEventListener("resize", this.handleResize), this.interactionManager.destroy(), this.renderer.destroy(), this.editorManager.destroy(), this.filterInputManager.destroy(), this.loadingOverlay.destroy(), this.dataManager.destroy(), wt.clearCache(), this.wrapper.parentNode && this.wrapper.parentNode.removeChild(this.wrapper), this.eventEmitter.removeAllListeners());
  }
  on(t, e) {
    this.eventEmitter.on(t, e);
  }
  off(t, e) {
    this.eventEmitter.off(t, e);
  }
}
export {
  Ft as Box,
  Ti as CTRenderer,
  Rs as CanvasTable,
  O as CellTypes,
  ws as Circle,
  ms as Column,
  je as ColumnIdManager,
  ne as DARK_THEME,
  Q as DEFAULT_THEME,
  Ze as DataManager,
  Xi as EventEmitter,
  Ye as FILTER_SAMPLE_ROWS,
  $e as FILTER_SEARCH_LIMIT,
  ys as Image,
  Nt as InteractionManager,
  us as LRUCache,
  Ei as LayoutEngine,
  Ot as LayoutManager,
  Cs as Line,
  Mi as MeasurementEngine,
  qe as RenderCache,
  Bi as Renderer,
  gs as Row,
  Ke as RowIdManager,
  Qe as RowVersionManager,
  ps as Stack,
  xs as Text,
  Ut as arrayToCsv,
  Gt as binarySearch,
  We as buildExcelExportModel,
  Ht as calculateMaxTextRows,
  J as clamp,
  fs as createCTElement,
  hs as createCanvas,
  ts as createXlsxBlob,
  Ae as createXlsxBlobFromModel,
  Ne as debounce,
  $t as deepClone,
  Rs as default,
  ds as downloadBlob,
  ti as enUS,
  ss as formatBoolean,
  is as formatDate,
  _e as formatNumber,
  es as formatPercent,
  os as generateId,
  ue as getCellDisplayText,
  $ as getColumnField,
  fe as getColumnFilterOptions,
  bt as getDevicePixelRatio,
  Xe as getFilterModeByColumnType,
  rs as getNestedValue,
  lt as getRenderResult,
  Oi as getTextFromChildren,
  Fe as isEqual,
  Rt as isPromise,
  de as layoutTags,
  kt as layoutWrappedText,
  ls as measureText,
  bs as mergeTheme,
  ki as normalizeBoxProps,
  cs as requestAnimationFrameThrottle,
  xt as resolveDisabled,
  te as resolveLocale,
  Ue as searchFilterOptions,
  as as setNestedValue,
  ns as throttle,
  ft as truncateText,
  nt as zhCN
};
//# sourceMappingURL=canvas-table.js.map
