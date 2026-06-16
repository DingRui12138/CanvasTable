var xe = Object.defineProperty;
var we = (p, t, e) => t in p ? xe(p, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : p[t] = e;
var v = (p, t, e) => we(p, typeof t != "symbol" ? t + "" : t, e);
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
}, he = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ye = (() => {
  const p = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let e = t;
    for (let i = 0; i < 8; i++)
      e = e & 1 ? 3988292384 ^ e >>> 1 : e >>> 1;
    p[t] = e >>> 0;
  }
  return p;
})();
function Ce(p, t) {
  var i;
  const e = (i = t == null ? void 0 : t.formats) == null ? void 0 : i.find((s) => s.key === p.key);
  if (e != null && e.type && e.formatCode)
    return { type: e.type, formatCode: e.formatCode };
  if (p.type === O.DATE)
    return { type: "date", formatCode: "yyyy-mm-dd" };
  if (p.type === O.NUMBER)
    return { type: "number", formatCode: "General" };
}
function be() {
  const p = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map(), e = [], i = [{}];
  return {
    styles: i,
    numFmts: e,
    getStyleId(s) {
      if (!s || s === "General")
        return 0;
      let o = p.get(s);
      o || (o = 164 + e.length, p.set(s, o), e.push({ id: o, formatCode: s }));
      const n = `numFmt:${o}`;
      let a = t.get(n);
      return a === void 0 && (a = i.length, i.push({ numFmtId: o }), t.set(n, a)), a;
    }
  };
}
function ve(p) {
  const t = p instanceof Date ? p : new Date(p);
  return Number.isNaN(t.getTime()) ? null : t.getTime() / 864e5 + 25569;
}
function Re(p, t, e) {
  return p.rows.map((i) => ({
    kind: "body",
    cells: i.cells.map((s) => {
      const o = Ce(s.column, t);
      if ((o == null ? void 0 : o.type) === "date") {
        const n = ve(s.rawValue);
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
function Yt(p, t) {
  const e = [], i = [];
  for (const s of p ?? []) {
    const o = Array.from({ length: t }, () => ({
      value: "",
      type: "blank"
    }));
    for (const n of s.cells) {
      if (n.startColumnIndex < 0 || n.startColumnIndex >= t || n.endColumnIndex < n.startColumnIndex)
        continue;
      const a = n.config.value ?? n.renderResult.text ?? "", r = typeof a == "number" ? "number" : typeof a == "boolean" ? "boolean" : "string";
      o[n.startColumnIndex] = {
        value: a,
        type: r
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
function Ie(p, t) {
  if (Array.isArray(t)) {
    const e = t.find((i) => i.key === p.key);
    if (e)
      return e.width;
  }
  return p.width;
}
function ce(p) {
  let t = p, e = "";
  for (; t > 0; ) {
    const i = (t - 1) % 26;
    e = String.fromCharCode(65 + i) + e, t = Math.floor((t - 1) / 26);
  }
  return e;
}
function $t(p, t) {
  return `${ce(t + 1)}${p + 1}`;
}
function Ee(p) {
  return Math.max(0, p / 7).toFixed(2);
}
function Tt(p, t) {
  return p.map((e) => ({
    startRow: e.startRow + t,
    startCol: e.startCol,
    endRow: e.endRow + t,
    endCol: e.endCol
  }));
}
function Se(p) {
  for (const t of p)
    if (t.endRow < t.startRow || t.endCol < t.startCol)
      throw new Error(`Invalid merge range: ${JSON.stringify(t)}`);
  for (let t = 0; t < p.length; t++)
    for (let e = t + 1; e < p.length; e++) {
      const i = p[t], s = p[e];
      if (i.startRow <= s.endRow && i.endRow >= s.startRow && i.startCol <= s.endCol && i.endCol >= s.startCol)
        throw new Error(`Overlapping merge ranges: ${JSON.stringify(i)} and ${JSON.stringify(s)}`);
    }
}
function Me(p, t, e) {
  var o, n, a, r;
  const i = ((o = t == null ? void 0 : t.freeze) == null ? void 0 : o.xSplit) ?? (((n = t == null ? void 0 : t.freeze) == null ? void 0 : n.leftFixedColumns) === !1 ? 0 : p.leftFixedLeafColumnCount), s = ((a = t == null ? void 0 : t.freeze) == null ? void 0 : a.ySplit) ?? (((r = t == null ? void 0 : t.freeze) == null ? void 0 : r.header) === !1 ? 0 : e);
  if (!(i === 0 && s === 0))
    return {
      xSplit: i,
      ySplit: s,
      topLeftCell: `${ce(i + 1)}${s + 1}`
    };
}
function Te(p) {
  const t = p.map(
    (e, i) => e.width ? `<col min="${i + 1}" max="${i + 1}" width="${Ee(e.width)}" customWidth="1"/>` : ""
  ).filter(Boolean).join("");
  return t ? `<cols>${t}</cols>` : "";
}
function De(p) {
  return p ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${p.xSplit}" ySplit="${p.ySplit}" topLeftCell="${p.topLeftCell}" state="frozen"/></sheetView></sheetViews>` : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
}
function He(p) {
  if (p.length === 0)
    return "";
  const t = p.map(
    (e) => `<mergeCell ref="${$t(e.startRow, e.startCol)}:${$t(e.endRow, e.endCol)}"/>`
  ).join("");
  return `<mergeCells count="${p.length}">${t}</mergeCells>`;
}
function ke(p) {
  const t = p.numFmts.length ? `<numFmts count="${p.numFmts.length}">${p.numFmts.map((i) => `<numFmt numFmtId="${i.id}" formatCode="${Mt(i.formatCode)}"/>`).join("")}</numFmts>` : "", e = (p.styles.length > 0 ? p.styles : [{}]).map(
    (i) => `<xf numFmtId="${i.numFmtId ?? 0}" fontId="0" fillId="0" borderId="0" xfId="0"${i.numFmtId ? ' applyNumberFormat="1"' : ""}/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${t}
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${p.styles.length > 0 ? p.styles.length : 1}">${e}</cellXfs>
</styleSheet>`;
}
function Oe(p) {
  const t = p.rows.map((e, i) => {
    const s = i + 1, o = e.cells.map((n, a) => {
      const r = `${de(a)}${s}`, l = n.styleId !== void 0 ? ` s="${n.styleId}"` : "";
      return n.type === "blank" ? `<c r="${r}"${l}/>` : n.type === "number" ? `<c r="${r}"${l}><v>${n.value}</v></c>` : n.type === "boolean" ? `<c r="${r}" t="b"${l}><v>${n.value ? 1 : 0}</v></c>` : `<c r="${r}" t="inlineStr"${l}><is><t>${Mt(n.value)}</t></is></c>`;
    }).join("");
    return `<row r="${s}">${o}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${De(p.freeze)}${Te(p.columns)}<sheetData>${t}</sheetData>${He(p.merges)}</worksheet>`;
}
function Pe(p) {
  let t = 4294967295;
  for (const e of p)
    t = ye[(t ^ e) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
function j(p, t, e) {
  p[t] = e & 255, p[t + 1] = e >>> 8 & 255;
}
function dt(p, t, e) {
  p[t] = e & 255, p[t + 1] = e >>> 8 & 255, p[t + 2] = e >>> 16 & 255, p[t + 3] = e >>> 24 & 255;
}
function Gt(p) {
  const t = p.reduce((s, o) => s + o.length, 0), e = new Uint8Array(t);
  let i = 0;
  for (const s of p)
    e.set(s, i), i += s.length;
  return e;
}
function Ut(p) {
  const t = [];
  for (let e = 0; e < p.length; e++) {
    let i = p.codePointAt(e);
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
function Mt(p) {
  return String(p ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function de(p) {
  let t = p + 1, e = "";
  for (; t > 0; ) {
    const i = (t - 1) % 26;
    e = String.fromCharCode(65 + i) + e, t = Math.floor((t - 1) / 26);
  }
  return e;
}
function ue(p) {
  const t = p.trim() || "Sheet1";
  return Mt(t.slice(0, 31));
}
function Be(p) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${p.map((e, i) => {
    const s = i + 1, o = e.map((n, a) => `<c r="${`${de(a)}${s}`}" t="inlineStr"><is><t>${Mt(n)}</t></is></c>`).join("");
    return `<row r="${s}">${o}</row>`;
  }).join("")}</sheetData></worksheet>`;
}
function fe(p) {
  const t = [], e = [];
  let i = 0;
  for (const n of p) {
    const a = Ut(n.name), r = Ut(n.content), l = Pe(r), h = new Uint8Array(30 + a.length);
    dt(h, 0, 67324752), j(h, 4, 20), j(h, 6, 0), j(h, 8, 0), j(h, 10, 0), j(h, 12, 0), dt(h, 14, l), dt(h, 18, r.length), dt(h, 22, r.length), j(h, 26, a.length), j(h, 28, 0), h.set(a, 30), t.push(h, r);
    const c = new Uint8Array(46 + a.length);
    dt(c, 0, 33639248), j(c, 4, 20), j(c, 6, 20), j(c, 8, 0), j(c, 10, 0), j(c, 12, 0), j(c, 14, 0), dt(c, 16, l), dt(c, 20, r.length), dt(c, 24, r.length), j(c, 28, a.length), j(c, 30, 0), j(c, 32, 0), j(c, 34, 0), j(c, 36, 0), dt(c, 38, 0), dt(c, 42, i), c.set(a, 46), e.push(c), i += h.length + r.length;
  }
  const s = Gt(e), o = new Uint8Array(22);
  return dt(o, 0, 101010256), j(o, 4, 0), j(o, 6, 0), j(o, 8, p.length), j(o, 10, p.length), dt(o, 12, s.length), dt(o, 16, i), j(o, 20, 0), Gt([...t, s, o]);
}
function Le(p, t) {
  const e = Array.from({ length: t }, () => []), i = [], s = (n, a, r) => {
    if (n.children && n.children.length > 0) {
      e[a][r] = { value: n.title, type: "string" };
      let l = r;
      for (const h of n.children)
        l = s(h, a + 1, l);
      return l - 1 > r && i.push({ startRow: a, startCol: r, endRow: a, endCol: l - 1 }), l;
    }
    return e[a][r] = { value: n.title, type: "string" }, a < t - 1 && i.push({ startRow: a, startCol: r, endRow: t - 1, endCol: r }), r + 1;
  };
  let o = 0;
  for (const n of p)
    o = s(n, 0, o);
  return {
    rows: e.map((n) => ({
      kind: "header",
      cells: Array.from(
        { length: o },
        (a, r) => n[r] ?? { value: "", type: "blank" }
      )
    })),
    merges: i
  };
}
function We(p, t, e) {
  const s = (t == null ? void 0 : t.hierarchicalHeaders) !== !1 && p.headerDepth > 0 ? Le(p.columnTree, p.headerDepth) : {
    rows: p.leafColumns.length > 0 ? [
      {
        kind: "header",
        cells: p.leafColumns.map((m) => ({
          value: m.title,
          type: "string"
        }))
      }
    ] : [],
    merges: []
  }, o = be(), n = Yt(p.summaryTopRows, p.leafColumns.length), a = Re(p, t, o), r = Yt(
    p.summaryBottomRows,
    p.leafColumns.length
  ), l = s.rows.length + n.rows.length, h = l + a.length, c = Tt((t == null ? void 0 : t.merges) ?? p.bodyMerges, l), d = Tt(n.merges, s.rows.length), u = Tt(r.merges, h), f = [
    ...s.merges,
    ...d,
    ...c,
    ...u
  ];
  Se(f);
  const g = Me(p, t, s.rows.length);
  return {
    sheetName: e,
    columns: p.leafColumns.map((m) => ({
      key: m.key,
      width: Ie(m, t == null ? void 0 : t.columnWidths)
    })),
    rows: [
      ...s.rows,
      ...n.rows,
      ...a,
      ...r.rows
    ],
    merges: f,
    freeze: g,
    styles: o.styles,
    numFmts: o.numFmts
  };
}
function Ae(p) {
  const t = ue(p.sheetName), e = [
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
      content: ke(p)
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: Oe(p)
    }
  ], i = fe(e), s = new ArrayBuffer(i.byteLength);
  return new Uint8Array(s).set(i), new Blob([s], { type: he });
}
function Ji(p, t = "Sheet1") {
  const e = ue(t), i = [
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
      content: Be(p)
    }
  ], s = fe(i), o = new ArrayBuffer(s.byteLength);
  return new Uint8Array(o).set(s), new Blob([o], { type: he });
}
function Y(p) {
  return p.field ?? p.key;
}
function _e(p, t) {
  const { thousandSeparator: e = !0, decimalPlaces: i, prefix: s = "", suffix: o = "" } = t ?? {};
  if (!isFinite(p))
    return String(p);
  let n = i !== void 0 ? p.toFixed(i) : String(p);
  if (e) {
    const a = n.split(".");
    a[0] = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","), n = a.join(".");
  }
  return s + n + o;
}
function ts(p, t = 2) {
  return _e(p * 100, { decimalPlaces: t, suffix: "%" });
}
function es(p, t = "YYYY-MM-DD") {
  const e = p instanceof Date ? p : new Date(p);
  if (isNaN(e.getTime()))
    return String(p);
  const i = e.getFullYear(), s = String(e.getMonth() + 1).padStart(2, "0"), o = String(e.getDate()).padStart(2, "0"), n = String(e.getHours()).padStart(2, "0"), a = String(e.getMinutes()).padStart(2, "0"), r = String(e.getSeconds()).padStart(2, "0");
  return t.replace("YYYY", String(i)).replace("MM", s).replace("DD", o).replace("HH", n).replace("mm", a).replace("ss", r);
}
function is(p, t = "Yes", e = "No") {
  return p ? t : e;
}
function mt(p, t, e = "...") {
  return p.length <= t ? p : p.slice(0, t - e.length) + e;
}
function ss() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function Ne(p, t) {
  let e = null;
  return function(...i) {
    e !== null && clearTimeout(e), e = setTimeout(() => {
      p.apply(this, i), e = null;
    }, t);
  };
}
function os(p, t) {
  let e = !1;
  return function(...i) {
    e || (p.apply(this, i), e = !0, setTimeout(() => {
      e = !1;
    }, t));
  };
}
function Z(p, t, e) {
  return Math.min(Math.max(p, t), e);
}
function Kt(p) {
  if (p === null || typeof p != "object")
    return p;
  if (Array.isArray(p))
    return p.map((e) => Kt(e));
  const t = {};
  for (const e in p)
    Object.prototype.hasOwnProperty.call(p, e) && (t[e] = Kt(p[e]));
  return t;
}
function Fe(p, t) {
  if (p === t)
    return !0;
  if (typeof p != typeof t)
    return !1;
  if (p === null || t === null || typeof p != "object")
    return p === t;
  if (Array.isArray(p) !== Array.isArray(t))
    return !1;
  const e = p, i = t, s = Object.keys(e), o = Object.keys(i);
  if (s.length !== o.length)
    return !1;
  for (const n of s)
    if (!Object.prototype.hasOwnProperty.call(i, n) || !Fe(e[n], i[n]))
      return !1;
  return !0;
}
function ns(p, t) {
  const e = t.split(".");
  let i = p;
  for (const s of e) {
    if (i == null)
      return;
    i = i[s];
  }
  return i;
}
function rs(p, t, e) {
  const i = t.split(".");
  let s = p;
  for (let o = 0; o < i.length - 1; o++) {
    const n = i[o];
    (s[n] === void 0 || s[n] === null) && (s[n] = {}), s = s[n];
  }
  s[i[i.length - 1]] = e;
}
function jt(p, t, e) {
  let i = 0, s = p.length - 1;
  for (; i <= s; ) {
    const o = Math.floor((i + s) / 2), n = e(p[o]);
    if (n === t)
      return o;
    n < t ? i = o + 1 : s = o - 1;
  }
  return i;
}
function as(p, t, e, i) {
  return p.font = `${e}px ${i}`, {
    width: p.measureText(t).width,
    height: e
  };
}
function Ot(p, t, e = 8) {
  return Math.max(1, Math.floor((p - e * 2) / t));
}
function Pt(p, t, e, i) {
  const s = [];
  let o = "";
  for (const r of t) {
    const l = o + r;
    if (p.measureText(l).width > e) {
      if (o && s.push(o), o = r, s.length >= i)
        break;
    } else
      o = l;
  }
  o && s.length < i && s.push(o);
  const n = s.join(""), a = t.length > n.length;
  if (a && s.length === i) {
    const r = "...";
    let l = s[s.length - 1] ?? "";
    for (; l.length > 0 && p.measureText(l + r).width > e; )
      l = l.slice(0, -1);
    s[s.length - 1] = l + r;
  }
  return { lines: s, isTruncated: a };
}
function ge(p, t, e, i, s) {
  const l = "...", h = s + 8, c = e - 8 * 2, d = Math.max(1, Math.floor((i - 8 * 2) / (h + 2))), u = Math.min(t.maxRows ?? d, d), f = t.tags ?? [], g = /* @__PURE__ */ new Map(), m = (M) => {
    let E = g.get(M);
    return E === void 0 && (E = p.measureText(M).width, g.set(M, E)), E;
  }, x = (M) => {
    const E = `+${M}`;
    return m(E) + 4 * 2;
  }, y = (M) => m(M.text) + 4 * 2, w = m(l), C = [];
  let b = [], R = 0, I = 0;
  for (let M = 0; M < f.length; M++) {
    const E = f[M], T = y(E), H = C.length >= u - 1, D = f.length - M;
    if (H) {
      const k = D > 1 ? x(D - 1) + 4 : 0, P = c - R - k;
      if (T <= P)
        b.push({ tag: E, displayText: E.text, width: T }), R += T + 4, I++;
      else {
        const B = c - R - k;
        if (B >= 4 * 2 + w + 10) {
          const L = B - 8 - w;
          let W = "", _ = 0, A = E.text.length;
          for (; _ < A; ) {
            const N = Math.floor((_ + A + 1) / 2), V = E.text.slice(0, N);
            m(V) <= L ? (_ = N, W = V) : A = N - 1;
          }
          if (W.length > 0) {
            const N = W + l, V = m(N) + 4 * 2;
            b.push({ tag: E, displayText: N, width: V }), I++;
          }
        }
        break;
      }
    } else if (T <= c - R)
      b.push({ tag: E, displayText: E.text, width: T }), R += T + 4, I++;
    else if (b.length > 0 && C.push(b), b = [{ tag: E, displayText: E.text, width: T }], R = T + 4, I++, C.length >= u)
      break;
  }
  return b.length > 0 && C.length < u && C.push(b), {
    lines: C,
    processedTags: I,
    isTruncated: I < f.length
  };
}
function It() {
  return window.devicePixelRatio || 1;
}
function ls(p, t) {
  const e = document.createElement("canvas"), i = It();
  e.width = p * i, e.height = t * i, e.style.width = `${p}px`, e.style.height = `${t}px`;
  const s = e.getContext("2d");
  if (!s)
    throw new Error("Failed to get 2D context");
  return s.scale(i, i), { canvas: e, ctx: s };
}
function hs(p) {
  let t = null, e = null;
  return function(...i) {
    e = i, t === null && (t = requestAnimationFrame(() => {
      e !== null && p.apply(this, e), t = null, e = null;
    }));
  };
}
function Et(p) {
  return p !== null && typeof p == "object" && typeof p.then == "function";
}
function cs(p, t) {
  const e = URL.createObjectURL(p), i = document.createElement("a");
  i.href = e, i.download = t, document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(e);
}
function Qt(p, t = ",") {
  return p.map((e) => e.map((i) => {
    const s = String(i ?? "");
    return s.includes(t) || s.includes('"') || s.includes(`
`) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(t)).join(`
`);
}
function bt(p, t, e) {
  return p === void 0 ? !1 : typeof p == "function" ? p(t, e) : p;
}
function ut(p, t, e) {
  const i = Y(p), s = t.data[i];
  let o = {
    text: String(s ?? ""),
    type: p.type ?? "text"
  };
  if (p.render)
    try {
      const n = p.render(s, t, p, e);
      n && (o = { ...o, ...n });
    } catch (n) {
      console.error(`Error in render function at row ${e}, column ${p.key}:`, n), o = {
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
function me(p, t, e) {
  var n, a;
  const i = Y(p), s = t.data[i], o = ut(p, t, e);
  if (o.type === O.SWITCH && o.switch)
    return o.switch.checked ? "是" : "否";
  if (o.type === O.CHECKBOX && o.checkbox)
    return o.checkbox.indeterminate ? "部分选中" : o.checkbox.checked ? "是" : "否";
  if (o.type === O.RADIO && o.radio) {
    const r = (n = o.radio.options) == null ? void 0 : n.find(
      (l) => {
        var h;
        return l.value === ((h = o.radio) == null ? void 0 : h.value);
      }
    );
    return (r == null ? void 0 : r.label) || String(o.radio.value ?? "");
  }
  if (o.type === O.BUTTON && o.button)
    return o.button.text || "";
  if (o.tags)
    return o.tags.tags.map((r) => r.text).join(", ");
  if (o.type === O.SELECT && o.select) {
    const r = o.select.value;
    if (Array.isArray(r))
      return r.map(
        (c) => {
          var d, u, f;
          return ((f = (u = (d = o.select) == null ? void 0 : d.options) == null ? void 0 : u.find((g) => g.value === c)) == null ? void 0 : f.label) || String(c);
        }
      ).filter(Boolean).join(", ");
    const l = (a = o.select.options) == null ? void 0 : a.find((h) => h.value === r);
    return (l == null ? void 0 : l.label) || String(r ?? "");
  }
  if (o.type === O.DATE && o.date) {
    if (o.date.value) {
      const r = o.date.value;
      return r instanceof Date ? r.toLocaleDateString() : String(r);
    }
    return "";
  }
  if (o.type === O.INPUT && o.input)
    return String(o.input.value ?? "");
  if (p.formatter)
    return p.formatter(s, t, p);
  if (o.text !== void 0)
    return String(o.text);
  switch (p.type) {
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
class ds {
  constructor(t = 100) {
    v(this, "cache");
    v(this, "maxSize");
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
function Xe(p) {
  var e, i;
  if ((e = p.filter) != null && e.mode)
    return p.filter.mode;
  if ((i = p.filter) != null && i.disabled)
    return null;
  const t = p.type ?? "text";
  return ze.includes(t) ? null : Ve[t] ?? "search";
}
const Ye = 100, $e = 100;
function pe(p, t, e = 0) {
  var n;
  if ((n = p.filter) != null && n.options && p.filter.options.length > 0)
    return p.filter.options;
  if (!t || t.length === 0)
    return [];
  const i = Y(p), s = t.slice(e, e + Ye), o = /* @__PURE__ */ new Map();
  for (let a = 0; a < s.length; a++) {
    const r = s[a], l = r.data[i], h = ut(p, r, e + a), c = Ge(h, l);
    for (const d of c) {
      const u = String(d.value);
      o.has(u) || o.set(u, d);
    }
  }
  return Array.from(o.values());
}
function Ge(p, t) {
  var i, s, o, n;
  const e = [];
  if ((i = p.select) != null && i.options && e.push(...p.select.options), (s = p.tags) != null && s.options && e.push(
    ...p.tags.options.map((a) => ({
      label: a.text,
      value: a.value ?? a.text
    }))
  ), (o = p.radio) != null && o.options && e.push(...p.radio.options), (n = p.color) != null && n.presetColors && e.push(
    ...p.color.presetColors.map((a) => ({
      label: a,
      value: a
    }))
  ), e.length === 0 && t !== void 0 && t !== null)
    if (Array.isArray(t))
      for (const a of t)
        e.push({
          label: String(a),
          value: a
        });
    else
      e.push({
        label: String(t),
        value: t
      });
  return e;
}
function Ue(p, t, e, i = $e) {
  if (!e || e.trim() === "")
    return [];
  const s = Y(p), o = e.toLowerCase(), n = /* @__PURE__ */ new Map();
  for (const a of t) {
    if (n.size >= i)
      break;
    const r = a.data[s];
    if (String(r ?? "").toLowerCase().includes(o)) {
      const h = String(r);
      n.has(h) || n.set(h, {
        label: String(r ?? ""),
        value: r
      });
    }
  }
  return Array.from(n.values());
}
class Ke {
  constructor() {
    v(this, "map", /* @__PURE__ */ new WeakMap());
    v(this, "counter", 0);
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
    v(this, "map", /* @__PURE__ */ new WeakMap());
    v(this, "counter", 0);
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
    v(this, "map", /* @__PURE__ */ new WeakMap());
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
    v(this, "cellCache", /* @__PURE__ */ new Map());
    /** 列值缓存：key = columnId-value */
    v(this, "valueCache", /* @__PURE__ */ new Map());
    /** 行 ID 管理器 */
    v(this, "rowIdManager");
    /** 列 ID 管理器 */
    v(this, "columnIdManager");
    /** 行版本管理器 */
    v(this, "rowVersionManager");
    /** 单元格缓存最大数量 */
    v(this, "maxCellCacheSize");
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
      const r = this.getValueCacheKey(e, i);
      return this.valueCache.get(r) ?? null;
    }
    const o = this.getCellCacheKey(t, e), n = this.cellCache.get(o);
    if (!n) return null;
    const a = this.rowVersionManager.getVersion(t);
    return n.value !== i || n.rowVersion !== a ? (this.cellCache.delete(o), null) : n.renderResult;
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
const Dt = 200;
class Ze {
  constructor(t, e) {
    v(this, "state", {
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
    v(this, "historyStack", []);
    /** 重做记录栈 */
    v(this, "redoStack", []);
    /** 历史记录配置 */
    v(this, "historyOptions");
    /** 行版本管理器（用于渲染缓存） */
    v(this, "rowVersionManager", new Qe());
    this.historyOptions = {
      maxActions: (e == null ? void 0 : e.maxActions) ?? Dt
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
      typeof t == "function" ? e = await t() : Et(t) ? e = await t : e = t, this.state.rows = this.processRows(e), this.historyStack = [], this.redoStack = [], this.applyFiltersAndSort();
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
            const n = o.children.findIndex((r) => r.key === t), a = o.children.findIndex((r) => r.key === e);
            if (n >= 0 && a >= 0) {
              const r = [...o.children];
              [r[n], r[a]] = [r[a], r[n]], o.children = r;
            }
          }
        }
      } else if (!i.parentKey && !s.parentKey) {
        const o = this.state.columns.findIndex((a) => a.key === t), n = this.state.columns.findIndex((a) => a.key === e);
        if (o >= 0 && n >= 0) {
          const a = [...this.state.columns];
          [a[o], a[n]] = [a[n], a[o]], this.state.columns = a;
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
          const a = this.findColumnByKey(this.state.columns, i.parent);
          if (a && a.children) {
            const r = [...a.children], [l] = r.splice(i.indexInParent, 1);
            r.splice(n.indexInParent, 0, l), a.children = r;
          }
        } else
          return;
      else if (!i.parent && !n.parent) {
        const a = [...this.state.columns], [r] = a.splice(i.indexInParent, 1);
        a.splice(n.indexInParent, 0, r), this.state.columns = a;
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
        const a = s[n];
        if (a.children && a.children.length > 0) {
          const r = i(a.children, a.key);
          if (r) return r;
        } else {
          if (e === t)
            return { parent: o, indexInParent: n, column: a };
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
        const a = i.data[Y(n)];
        return this.matchesFilter(a, o, i, n);
      });
      return s && i.children && this.applyFilters(i.children).length > 0 ? !0 : s;
    });
  }
  matchesFilter(t, e, i, s) {
    var r;
    if ((r = s.filter) != null && r.custom)
      return s.filter.custom(t, e.value, i);
    const o = e.value, n = String(t ?? "").toLowerCase(), a = String(o ?? "").toLowerCase();
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
        return n === a;
      case "notEquals":
      case "!=":
        return n !== a;
      case "contains":
        return n.includes(a);
      case "notContains":
        return !n.includes(a);
      case "startsWith":
        return n.startsWith(a);
      case "endsWith":
        return n.endsWith(a);
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
          const a = e(n.children, o);
          if (a) return a;
        }
      }
    }, i = [...t].sort((s, o) => {
      for (const n of this.state.sort) {
        const a = e(this.state.columns, n.column);
        if (!a) continue;
        const r = Y(a), l = s.data[r], h = o.data[r];
        let c = this.compareValues(l, h, a.type);
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
    }, a = n(this.state.columns, e), r = s ?? (a == null ? void 0 : a.field) ?? e;
    let l = i;
    if (a)
      switch (a.type) {
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
    const h = o.data[r];
    o.data[r] = l, this.rowVersionManager.incrementVersion(o), this.recordAction({
      type: "update",
      row: o,
      column: r,
      oldValue: h,
      newValue: l
    });
    const c = this.findStateRow(o);
    return c && (c.data[r] = l), this.applyFiltersAndSort(), {
      type: "update",
      rowIndex: t,
      column: r,
      oldValue: h,
      newValue: l
    };
  }
  updateRow(t, e) {
    const i = this.state.sortedRows[t];
    if (!i)
      throw new Error(`Row at index ${t} not found`);
    const s = [];
    for (const [n, a] of Object.entries(e)) {
      const r = i.data[n];
      r !== a && (i.data[n] = a, s.push({
        type: "update",
        rowIndex: t,
        column: n,
        oldValue: r,
        newValue: a
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
    const i = [], s = (o, n, a) => {
      let r = 0;
      for (const l of o)
        if (r >= n && r <= a && i.push(l), r++, l.children && l.expanded && s(l.children, n - r, a - r), r > a) break;
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
    const e = this.historyOptions.maxActions ?? Dt;
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
    const e = this.historyOptions.maxActions ?? Dt;
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
    const { includeHidden: e = !1, selectedOnly: i = !1, showRowNumbers: s = !1 } = t, o = i ? this.state.sortedRows.filter((h) => h.selected) : this.state.sortedRows, n = this.getExportColumnTree(e), a = this.getLeafColumnsList(e), r = this.getHeaderDepth(n), l = a.filter((h) => h.fixed === "left").length;
    return {
      columnTree: n,
      leafColumns: a,
      rows: o.map((h, c) => ({
        row: h,
        rowIndex: c,
        cells: a.map((d) => {
          const u = h.data[Y(d)];
          return {
            column: d,
            rawValue: u,
            displayValue: me(d, h, c)
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
      headerDepth: r,
      leftFixedLeafColumnCount: l
    };
  }
  getLeafColumnsList(t = !1) {
    const e = [], i = (s, o = !1) => {
      for (const n of s) {
        const a = o || n.hidden === !0;
        n.children && n.children.length > 0 ? i(n.children, a) : (t || !a) && e.push(n);
      }
    };
    return i(this.state.columns), e;
  }
  getExportColumnTree(t = !1) {
    const e = (i, s = !1) => {
      const o = [];
      for (const n of i) {
        const a = s || n.hidden === !0, r = n.children ? e(n.children, a) : void 0;
        if (r && r.length > 0) {
          o.push({
            ...n,
            children: r
          });
          continue;
        }
        (t || !a) && o.push({
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
const qt = 5, Zt = 2, Je = 32, Ht = 150, Jt = 50, te = 500, ot = class ot {
  constructor(t, e) {
    v(this, "layoutInfo");
    v(this, "visibleRange");
    v(this, "config");
    v(this, "theme");
    v(this, "columnWidths", /* @__PURE__ */ new Map());
    v(this, "rowHeights", []);
    v(this, "rowOffsets", []);
    v(this, "rowBands");
    v(this, "rowPinManager");
    v(this, "rowHeightByRow", /* @__PURE__ */ new WeakMap());
    v(this, "rowIndexByRow", /* @__PURE__ */ new WeakMap());
    v(this, "bodyRowIndexByRow", /* @__PURE__ */ new WeakMap());
    v(this, "rowBandOffsetByRow", /* @__PURE__ */ new WeakMap());
    v(this, "pinnedRowByRow", /* @__PURE__ */ new WeakMap());
    v(this, "bodyRowHeights", []);
    v(this, "bodyRowOffsets", []);
    v(this, "pinnedTopHeight", 0);
    v(this, "pinnedBottomHeight", 0);
    v(this, "summaryTopHeight", 0);
    v(this, "summaryBottomHeight", 0);
    v(this, "bodyViewportHeight", 0);
    v(this, "columnOffsets", []);
    v(this, "columns", []);
    v(this, "headerDepth", 1);
    v(this, "headerCells", []);
    v(this, "leafColumns", []);
    v(this, "cellMergeMap", /* @__PURE__ */ new Map());
    v(this, "cellMergeByRow", /* @__PURE__ */ new Map());
    v(this, "mergedCellSet", /* @__PURE__ */ new Set());
    v(this, "cellToMergeMap", /* @__PURE__ */ new Map());
    // 动态行高支持
    v(this, "rowHeightOverrides", /* @__PURE__ */ new WeakMap());
    v(this, "hasRowHeightOverrides", !1);
    v(this, "rowHeightFn");
    v(this, "cachedRows", []);
    // 缓存行引用，用于检测数据变化
    v(this, "rowHeightsDirty", !0);
    // 标记行高度是否需要重新计算
    v(this, "viewportWidth", 0);
    v(this, "viewportHeight", 0);
    v(this, "scrollLeft", 0);
    v(this, "scrollTop", 0);
    v(this, "showRowNumbers", !1);
    v(this, "rowNumberColumnWidth", 50);
    this.config = {
      enabled: (t == null ? void 0 : t.enabled) ?? !0,
      rowBufferSize: (t == null ? void 0 : t.rowBufferSize) ?? qt,
      columnBufferSize: (t == null ? void 0 : t.columnBufferSize) ?? Zt,
      estimatedRowHeight: (t == null ? void 0 : t.estimatedRowHeight) ?? Je,
      estimatedColumnWidth: (t == null ? void 0 : t.estimatedColumnWidth) ?? Ht
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
      (t) => (t == null ? void 0 : t.fixed) === "left" && !t._isRowNumber && !t.key.startsWith(ot.HIDDEN_PLACEHOLDER_PREFIX)
    );
  }
  isHiddenPlaceholderColumn(t) {
    return t.key.startsWith(ot.HIDDEN_PLACEHOLDER_PREFIX);
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
    const i = Z(e, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(t, i), this.hasRowHeightOverrides = !0, this.rowHeightsDirty = !0;
  }
  updateRowHeight(t, e) {
    const i = Z(e, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(t, i), this.hasRowHeightOverrides = !0;
    const s = this.rowIndexByRow.get(t);
    if (s === void 0 || s < 0 || s >= this.rowHeights.length)
      return this.rowHeightsDirty = !0, !1;
    const o = this.rowHeights[s] ?? this.theme.row.height, n = i - o;
    if (n === 0)
      return !0;
    this.rowHeights[s] = i, this.rowHeightByRow.set(t, i);
    for (let r = s + 1; r < this.rowOffsets.length; r++)
      this.rowOffsets[r] = (this.rowOffsets[r] ?? 0) + n;
    this.layoutInfo.rowOffsets = this.rowOffsets;
    const a = this.bodyRowIndexByRow.get(t);
    if (a !== void 0 && a >= 0) {
      this.bodyRowHeights[a] = i;
      for (let r = a + 1; r < this.bodyRowOffsets.length; r++)
        this.bodyRowOffsets[r] = (this.bodyRowOffsets[r] ?? 0) + n;
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
    const e = [], i = (n, a) => ({
      key: ot.HIDDEN_PLACEHOLDER_PREFIX + n.key,
      title: "",
      width: ot.HIDDEN_PLACEHOLDER_WIDTH,
      type: "text",
      fixed: a,
      _hiddenColumnKey: n.key
    }), s = (n, a, r) => {
      for (let l = a; l >= 0 && l < n.length; l += r) {
        const h = n[l];
        if (h && !h.hidden)
          return h.fixed === "left" || h.fixed === "right" ? h.fixed : void 0;
      }
    }, o = (n, a) => {
      let r = 0, l = !1;
      for (let h = 0; h < n.length; h++) {
        const c = n[h];
        if (c) {
          if (c.hidden) {
            const d = n.slice(0, h).some((g) => g && !g.hidden), u = n.slice(h + 1).some((g) => g && !g.hidden);
            if (a ? d && u : (l === !1 || r > 0) && (u || r > 0)) {
              const g = s(n, h - 1, -1), m = s(n, h + 1, 1), y = i(c, g === m ? g : void 0);
              e.push(y), r += ot.HIDDEN_PLACEHOLDER_WIDTH;
            }
            l = !0;
            continue;
          }
          if (l = !1, c.children && c.children.length > 0) {
            const d = e.length;
            o(c.children, !1), e.length > d && (r += e.slice(d).reduce((u, f) => u + this.getColumnWidth(f), 0));
          } else
            e.push(c), r += this.getColumnWidth(c);
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
        let a = n;
        for (const r of o.children)
          r.hidden || (a = Math.max(
            a,
            e(r, n + 1)
          ));
        return a;
      }
      return n;
    };
    for (const o of t)
      o.hidden || (this.headerDepth = Math.max(this.headerDepth, e(o, 0) + 1));
    const i = (o, n, a, r) => {
      if (o.depth = n, o.parentKey = r, o.hidden)
        return 0;
      if (o.children && o.children.length > 0) {
        let l = a, h = 0, c = 0, d = !1;
        for (let u = 0; u < o.children.length; u++) {
          const f = o.children[u];
          if (!f) continue;
          if (f.hidden) {
            const m = o.children.slice(u + 1).some((x) => x && !x.hidden);
            if ((d === !1 || h > 0) && (m || h > 0)) {
              let x;
              for (let E = u - 1; E >= 0; E--) {
                const T = o.children[E];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (x = T.fixed);
                  break;
                }
              }
              let y;
              for (let E = u + 1; E < o.children.length; E++) {
                const T = o.children[E];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (y = T.fixed);
                  break;
                }
              }
              const w = x === y ? x : void 0, C = ot.HIDDEN_PLACEHOLDER_PREFIX + f.key, b = {
                key: C,
                title: "",
                width: ot.HIDDEN_PLACEHOLDER_WIDTH,
                type: "text",
                fixed: w,
                _hiddenColumnKey: f.key
              }, R = ot.HIDDEN_PLACEHOLDER_WIDTH;
              this.columnWidths.set(C, R), this.leafColumns.push(b);
              const I = n + 1, M = this.headerDepth - I;
              this.headerCells.push({
                column: b,
                x: l,
                y: I * this.theme.row.headerHeight,
                width: R,
                height: this.theme.row.headerHeight * M,
                rowIndex: I,
                colIndex: this.leafColumns.length - 1,
                colspan: 1,
                rowspan: M,
                isLeaf: !0
              }), h += R, l += R;
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
          x: a,
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
          x: a,
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
          const a = t.slice(o + 1).some((l) => l && !l.hidden);
          if (t.slice(0, o).some((l) => l && !l.hidden) && a) {
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
            const c = l === h ? l : void 0, d = ot.HIDDEN_PLACEHOLDER_PREFIX + n.key, u = {
              key: d,
              title: "",
              width: ot.HIDDEN_PLACEHOLDER_WIDTH,
              type: "text",
              fixed: c,
              _hiddenColumnKey: n.key
            }, f = ot.HIDDEN_PLACEHOLDER_WIDTH;
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
          for (let a = e; a < e + s.rowspan; a++) {
            this.cellMergeByRow.has(a) || this.cellMergeByRow.set(a, []), this.cellMergeByRow.get(a).push(o);
            for (let r = s.columnIndex; r < s.columnIndex + s.colspan; r++)
              (a !== e || r !== s.columnIndex) && (this.mergedCellSet.add(`${a}-${r}`), this.cellToMergeMap.set(`${a}-${r}`, o));
          }
        }
    }
  }
  calculateRowLayout(t) {
    const e = t.length, i = this.theme.row.height;
    if (!(e !== this.cachedRows.length || t.some((n, a) => n !== this.cachedRows[a])) && !this.rowHeightsDirty && this.rowHeights.length === e) {
      this.calculateRowBands(t);
      return;
    }
    this.cachedRows = [...t], this.rowHeightsDirty = !1, this.rowHeightByRow = /* @__PURE__ */ new WeakMap(), this.rowIndexByRow = /* @__PURE__ */ new WeakMap();
    const o = this.rowHeightFn;
    this.rowHeights = t.map((n, a) => {
      const r = this.rowHeightOverrides.get(n);
      return r !== void 0 ? Z(r, this.theme.row.minHeight, this.theme.row.maxHeight) : o ? o(n, a) : i;
    }), t.forEach((n, a) => {
      this.rowHeightByRow.set(n, this.rowHeights[a] ?? i), this.rowIndexByRow.set(n, a);
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
    const n = this.layoutInfo.headerHeight, a = n + this.summaryTopHeight, r = a + this.pinnedTopHeight, l = this.viewportHeight > 0 ? Math.max(r, this.viewportHeight - this.summaryBottomHeight) : r + this.calculateRowsHeight(o) + this.pinnedBottomHeight, h = this.viewportHeight > 0 ? Math.max(r, l - this.pinnedBottomHeight) : r + this.calculateRowsHeight(o);
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
        y: a
      },
      body: {
        type: "body",
        rows: o,
        height: this.calculateRowsHeight(o),
        y: r
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
    let e = t.width ?? this.config.estimatedColumnWidth ?? Ht;
    return e = Z(e, t.minWidth ?? Jt, t.maxWidth ?? te), e;
  }
  setColumnWidth(t, e) {
    const i = this.getColumnByKey(t);
    if (i) {
      const s = Z(
        e,
        i.minWidth ?? Jt,
        i.maxWidth ?? te
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
        const n = this.headerCells.find((a) => a.column === o);
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
    const t = this.layoutInfo.headerHeight, e = this.config.rowBufferSize ?? qt, i = this.config.columnBufferSize ?? Zt, s = this.bodyViewportHeight > 0 ? this.bodyViewportHeight : Math.max(0, this.viewportHeight - t), o = this.findBodyRowIndexAtOffset(this.scrollTop), n = this.findBodyRowIndexAtOffset(this.scrollTop + s);
    this.visibleRange.startRow = Math.max(0, o - e), this.visibleRange.endRow = Math.min(this.bodyRowHeights.length - 1, n + e);
    const a = this.findColumnIndexAtOffset(this.scrollLeft), r = this.findColumnIndexAtOffset(this.scrollLeft + this.viewportWidth);
    this.visibleRange.startColumn = Math.max(0, a - i), this.visibleRange.endColumn = Math.min(
      this.layoutInfo.columnWidths.length - 1,
      r + i
    );
  }
  findRowIndexAtOffset(t) {
    if (t <= 0 || this.rowOffsets.length === 0) return 0;
    const e = this.rowOffsets[this.rowOffsets.length - 1] ?? 0;
    return t >= e ? this.rowOffsets.length - 1 : jt(this.rowOffsets, t, (i) => i);
  }
  findBodyRowIndexAtOffset(t) {
    if (t <= 0 || this.bodyRowOffsets.length === 0) return 0;
    const e = this.bodyRowOffsets.length - 1, i = this.bodyRowOffsets[e] ?? 0, s = this.bodyRowHeights[e] ?? 0;
    if (t >= i + s)
      return e;
    let o = 0, n = e;
    for (; o <= n; ) {
      const a = Math.floor((o + n) / 2), r = this.bodyRowOffsets[a], l = this.bodyRowHeights[a];
      if (t >= r && t < r + l)
        return a;
      t < r ? n = a - 1 : o = a + 1;
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
    return t >= e ? this.columnOffsets.length - 1 : jt(this.columnOffsets, t, (i) => i);
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
      let a;
      if (n.column.fixed === "left")
        a = n.x;
      else if (n.column.fixed === "right") {
        const r = this.getRightFixedWidth(), h = this.viewportWidth - r - (this.layoutInfo.totalWidth - r);
        a = n.x + h;
      } else
        a = n.x - this.scrollLeft;
      t >= a && t < a + n.width && e >= n.y && e < n.y + n.height && i.push(n);
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
        let a;
        if (n.column.fixed === "left")
          a = n.x;
        else {
          const r = this.getRightFixedWidth(), h = this.viewportWidth - r - (this.layoutInfo.totalWidth - r);
          a = n.x + h;
        }
        if (t >= a && t < a + n.width)
          return n;
      }
    }
    const o = i.find((n) => n.isLeaf);
    if (o) return o;
    for (const n of this.headerCells) {
      if (!n.isLeaf) continue;
      let a;
      if (n.column.fixed === "left")
        a = n.x;
      else if (n.column.fixed === "right") {
        const r = this.getRightFixedWidth(), h = this.viewportWidth - r - (this.layoutInfo.totalWidth - r);
        a = n.x + h;
      } else
        a = n.x - this.scrollLeft;
      if (t >= a && t < a + n.width)
        return n;
    }
    return i.reduce(
      (n, a) => a.rowIndex > n.rowIndex ? a : n
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
    const o = e.y, n = e.width, a = e.height;
    if (i.fixed !== "left") if (i.fixed === "right") {
      const r = this.getRightFixedWidth(), h = this.viewportWidth - r - (this.layoutInfo.totalWidth - r);
      s = e.x + h;
    } else
      s = s - this.scrollLeft;
    return { x: s, y: o, width: n, height: a };
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
    for (let r = 0; r < i.colspan; r++)
      n += this.getColumnWidthByIndex(i.columnIndex + r);
    let a = 0;
    for (let r = 0; r < i.rowspan; r++)
      a += this.getRowHeightByIndex(i.rowIndex + r);
    return { x: s, y: o, width: n, height: a };
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
    return this.layoutInfo.columnWidths[t] ?? Ht;
  }
  getCellPosition(t, e) {
    const i = this.leafColumns[e];
    let s = this.getColumnOffset(e);
    const o = t === -1 ? 0 : this.getRowOffset(t), n = this.getColumnWidthByIndex(e), a = t === -1 ? this.layoutInfo.headerHeight : this.getRowHeightByIndex(t);
    if ((i == null ? void 0 : i.fixed) === "left") {
      let r = 0;
      for (let l = 0; l < this.leafColumns.length; l++) {
        const h = this.leafColumns[l];
        if ((h == null ? void 0 : h.fixed) === "left") {
          if (l === e) {
            s = r;
            break;
          }
          r += this.layoutInfo.columnWidths[l];
        }
      }
    }
    if ((i == null ? void 0 : i.fixed) === "right") {
      const r = this.getRightFixedWidth();
      let l = this.viewportWidth - r;
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
    return { x: s, y: o, width: n, height: a };
  }
  getCellAtPosition(t, e, i) {
    const s = this.layoutInfo.headerHeight, o = i ?? this.scrollTop;
    if (e - o < s) {
      const h = this.findColumnIndexAtPosition(t);
      return h < 0 ? null : { rowIndex: -1, columnIndex: h };
    }
    const a = this.findRowIndexAtPosition(e), r = this.findColumnIndexAtPosition(t);
    if (a < 0 || a >= this.rowHeights.length || r < 0 || r >= this.layoutInfo.columnWidths.length)
      return null;
    const l = this.getCellMerge(a, r);
    return l ? { rowIndex: l.rowIndex, columnIndex: l.columnIndex } : { rowIndex: a, columnIndex: r };
  }
  getRowHitAtViewportPosition(t, e, i) {
    const s = (() => {
      const r = this.getMouseRegion(t);
      return r === "left-fixed" ? this.findColumnIndexInLeftFixed(t) : r === "right-fixed" ? this.findColumnIndexInRightFixed(t) : this.findColumnIndexInScrollable(t + this.scrollLeft);
    })();
    if (s < 0 || s >= this.layoutInfo.columnWidths.length || e < this.layoutInfo.headerHeight)
      return null;
    if (this.summaryTopHeight > 0 && e < this.rowBands.summaryTop.y + this.summaryTopHeight) {
      const r = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryTop.rows,
        e - this.rowBands.summaryTop.y
      );
      return r ? { row: r, band: "summary-top", columnIndex: s } : null;
    }
    if (e < this.rowBands.pinnedTop.y + this.pinnedTopHeight) {
      const r = this.findRowInBandAtOffset(
        this.rowBands.pinnedTop.rows,
        e - this.rowBands.pinnedTop.y
      );
      return r ? { row: r, band: "pinned-top", columnIndex: s } : null;
    }
    if (this.summaryBottomHeight > 0 && e >= this.rowBands.summaryBottom.y && e < this.rowBands.summaryBottom.y + this.summaryBottomHeight) {
      const r = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryBottom.rows,
        e - this.rowBands.summaryBottom.y
      );
      return r ? { row: r, band: "summary-bottom", columnIndex: s } : null;
    }
    if (this.pinnedBottomHeight > 0 && e >= this.rowBands.pinnedBottom.y && e < this.rowBands.pinnedBottom.y + this.pinnedBottomHeight) {
      const r = this.findRowInBandAtOffset(
        this.rowBands.pinnedBottom.rows,
        e - this.rowBands.pinnedBottom.y
      );
      return r ? { row: r, band: "pinned-bottom", columnIndex: s } : null;
    }
    const o = i + (e - this.rowBands.body.y), n = this.findBodyRowIndexAtOffset(o), a = this.rowBands.body.rows[n];
    return a ? { row: a, band: "body", columnIndex: s } : null;
  }
  getCellAtViewportPosition(t, e, i = this.scrollTop) {
    if (e < this.layoutInfo.headerHeight) {
      const a = this.findColumnIndexAtPosition(t + this.scrollLeft);
      return a < 0 ? null : { rowIndex: -1, columnIndex: a };
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
        const a = this.leafColumns[n];
        if ((a == null ? void 0 : a.fixed) === "left") {
          const r = this.layoutInfo.columnWidths[n];
          if (e >= o && e < o + r)
            return n;
          o += r;
        }
      }
      return -1;
    }
    if (s > 0) {
      const o = this.viewportWidth - s;
      if (e >= o && e < this.viewportWidth) {
        let n = o;
        for (let a = 0; a < this.leafColumns.length; a++) {
          const r = this.leafColumns[a];
          if ((r == null ? void 0 : r.fixed) === "right") {
            const l = this.layoutInfo.columnWidths[a];
            if (e >= n && e < n + l)
              return a;
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
      const a = this.columnOffsets[o], r = this.layoutInfo.columnWidths[o];
      if (t >= a && t < a + r)
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
    for (const r of this.leafColumns.length > 0 ? this.leafColumns : t)
      r.fixed === "left" ? e.push(r) : r.fixed === "right" ? i.push(r) : s.push(r);
    const o = e.reduce((r, l) => r + this.getColumnWidth(l), 0), n = i.reduce((r, l) => r + this.getColumnWidth(l), 0), a = s.reduce((r, l) => r + this.getColumnWidth(l), 0);
    return {
      leftFixed: { columns: e, width: o },
      rightFixed: { columns: i, width: n },
      center: { columns: s, width: a }
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
      let a = 0;
      for (let r = 0; r < this.leafColumns.length; r++) {
        const l = this.leafColumns[r];
        if ((l == null ? void 0 : l.fixed) === "left") {
          if (a += this.layoutInfo.columnWidths[r], Math.abs(s - a) <= 5)
            return r;
        } else
          break;
      }
      return -1;
    }
    if (n > 0) {
      const a = this.viewportWidth - n;
      if (s >= a) {
        let r = this.viewportWidth;
        if (Math.abs(s - a) <= 5)
          for (let l = 0; l < this.leafColumns.length; l++) {
            const h = this.leafColumns[l];
            if ((h == null ? void 0 : h.fixed) === "right")
              return l;
          }
        for (let l = this.leafColumns.length - 1; l >= 0; l--) {
          const h = this.leafColumns[l];
          if ((h == null ? void 0 : h.fixed) === "right") {
            if (r -= this.layoutInfo.columnWidths[l], Math.abs(s - r) <= 5)
              return l;
          } else
            break;
        }
        return -1;
      }
    }
    for (let a = 0; a < this.leafColumns.length; a++) {
      const r = this.leafColumns[a];
      if ((r == null ? void 0 : r.fixed) === "left" || (r == null ? void 0 : r.fixed) === "right")
        continue;
      const l = this.getResizeHandlePosition(a);
      if (Math.abs(t - l) <= 5)
        return a;
    }
    return -1;
  }
  getVisibleCenterColumnIndices() {
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), i = this.scrollLeft + t, s = this.scrollLeft + this.viewportWidth - e, o = [];
    for (let n = 0; n < this.leafColumns.length; n++) {
      const a = this.leafColumns[n];
      if ((a == null ? void 0 : a.fixed) === "left" || (a == null ? void 0 : a.fixed) === "right")
        continue;
      const r = this.columnOffsets[n] ?? 0;
      r + (this.layoutInfo.columnWidths[n] ?? 0) >= i && r <= s && o.push(n);
    }
    return o;
  }
  getVisibleHeaderCells() {
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), i = this.scrollLeft + t, s = this.scrollLeft + this.viewportWidth - e, o = [], n = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
    for (const r of this.headerCells) {
      const l = r.x, h = r.x + r.width, c = r.column.fixed === "left", d = r.column.fixed === "right", u = r.column.key;
      if (c || d) {
        if (!n.has(u)) {
          o.push(r), n.add(u);
          let f = r.column.parentKey;
          for (; f; ) {
            a.add(f);
            const g = this.getColumnByKey(f);
            f = g == null ? void 0 : g.parentKey;
          }
        }
        continue;
      }
      if (h >= i && l <= s && !n.has(u)) {
        o.push(r), n.add(u);
        let f = r.column.parentKey;
        for (; f; ) {
          a.add(f);
          const g = this.getColumnByKey(f);
          f = g == null ? void 0 : g.parentKey;
        }
      }
    }
    for (const r of this.headerCells) {
      const l = r.column.key;
      a.has(r.column.key) && !n.has(l) && (o.push(r), n.add(l));
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
    const s = this.layoutInfo, o = this.getMaxScrollTop(), n = this.getMaxScrollLeft(), a = 10, r = 30, l = s.headerHeight;
    if (o > 0) {
      const h = this.viewportHeight - l, c = Math.max(
        r,
        this.viewportHeight / s.totalHeight * h
      ), d = l + this.scrollTop / o * (h - c), u = this.viewportWidth - a, f = a - 2;
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
      const h = this.viewportWidth - (o > 0 ? a : 0), c = Math.max(
        r,
        this.viewportWidth / s.totalWidth * h
      ), d = this.scrollLeft / n * (h - c), u = this.viewportHeight - a, f = a - 2;
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
        const a = this.leafColumns[n];
        if ((a == null ? void 0 : a.fixed) === "right")
          return n;
      }
    let o = this.viewportWidth;
    for (let n = this.leafColumns.length - 1; n >= 0; n--) {
      const a = this.leafColumns[n];
      if ((a == null ? void 0 : a.fixed) === "right") {
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
      const n = this.columnOffsets[s], a = this.layoutInfo.columnWidths[s];
      if (n !== void 0 && Math.abs(i - (n + a)) <= e)
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
    const a = this.getCellAtViewportPosition(t, e, this.scrollTop);
    if (!a && s < 0)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const r = s >= 0 ? s : (a == null ? void 0 : a.rowIndex) ?? -1;
    if (r < 0 || r >= this.rowHeights.length)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const l = this.getCellMerge(r, o);
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
      cell: { rowIndex: r, columnIndex: o },
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
    const o = this.scrollTop + (t - i), n = this.findBodyRowIndexAtOffset(Math.max(0, o - e)), a = [n, n + 1];
    for (const r of a) {
      const l = this.rowBands.body.rows[r];
      if (!l) continue;
      const h = i + (this.bodyRowOffsets[r] ?? 0) + this.getResolvedRowHeight(l) - this.scrollTop;
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
        const a = this.layoutInfo.columnWidths[o];
        if (t >= s && t < s + a)
          return o;
        s += a;
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
v(ot, "HIDDEN_PLACEHOLDER_WIDTH", 5), v(ot, "HIDDEN_PLACEHOLDER_PREFIX", "__hidden_placeholder__");
let Bt = ot;
class ee {
  constructor(t = {}) {
    v(this, "maxConcurrent");
    v(this, "maxCacheSize");
    /** 已加载缓存（包含尺寸信息） */
    v(this, "cache", /* @__PURE__ */ new Map());
    /** 加载失败 */
    v(this, "failed", /* @__PURE__ */ new Set());
    /** 正在加载中 */
    v(this, "loading", /* @__PURE__ */ new Map());
    /** 等待加载队列 */
    v(this, "pendingQueue", /* @__PURE__ */ new Map());
    /** 当前帧收集的请求 */
    v(this, "frameRequests", /* @__PURE__ */ new Map());
    /** 是否已销毁 */
    v(this, "destroyed", !1);
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
        const r = this.scaleImage(s.originalImage, e);
        s.image = r, s.size = e, i == null || i(!0, r);
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
    const a = {
      src: t,
      callbacks: i ? [i] : [],
      maxSize: e
    };
    if (this.loading.size < this.maxConcurrent) {
      this.startLoad(t, a);
      return;
    }
    this.pendingQueue.set(t, a);
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
    const a = n.getContext("2d");
    return a ? (a.imageSmoothingEnabled = !0, a.imageSmoothingQuality = "high", a.drawImage(t, 0, 0, s, o), n) : t;
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
const ht = {
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
}, ie = {
  "zh-CN": ht,
  "en-US": ti
};
function ei(p) {
  return typeof p == "object" && p !== null && ("preset" in p || "messages" in p);
}
function Lt(p) {
  if (Array.isArray(p))
    return [...p];
  if (p && typeof p == "object") {
    const t = {};
    for (const [e, i] of Object.entries(p))
      t[e] = Lt(i);
    return t;
  }
  return p;
}
function yt(p, t) {
  if (!t)
    return Lt(p);
  const e = Lt(p);
  for (const [i, s] of Object.entries(t))
    s && typeof s == "object" && !Array.isArray(s) && e[i] && typeof e[i] == "object" && !Array.isArray(e[i]) ? e[i] = yt(e[i], s) : s !== void 0 && (e[i] = s);
  return e;
}
function se(p) {
  if (!p)
    return yt(ht);
  if (typeof p == "string")
    return yt(ie[p] ?? ht);
  if (ei(p)) {
    const t = p.preset ?? "zh-CN";
    return yt(ie[t] ?? ht, p.messages);
  }
  return yt(ht, p);
}
class ii {
  constructor(t, e, i, s = ht) {
    v(this, "ctx");
    v(this, "theme");
    v(this, "locale");
    v(this, "measureTextWidth");
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
    for (const a of t.buttons) {
      const r = a.text ?? this.locale.cell.buttonText, l = this.measureTextWidth(r);
      o = Math.max(o, l + 8 * 2 + 16);
    }
    const n = t.buttons.length * 32;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, o, n, 4), this.ctx.fill(), this.ctx.stroke();
    for (let a = 0; a < t.buttons.length; a++) {
      const r = t.buttons[a], l = t.y + a * 32;
      a === t.hoveredIndex && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(t.x, l, o, 32));
      let c;
      switch (r.variant) {
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
        r.text ?? this.locale.cell.buttonText,
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
    const { config: e, x: i, y: s, width: o, scrollTop: n, hoveredIndex: a } = t, r = 32, l = 8, c = Math.min(e.options.length, l) * r;
    this.ctx.save(), this.drawDropdownPanel(i, s, o, c), this.ctx.beginPath(), this.ctx.rect(i, s, o, c), this.ctx.clip();
    const d = e.multiple && Array.isArray(e.value) ? e.value : e.value !== void 0 ? [e.value] : [];
    for (let u = 0; u < e.options.length; u++) {
      const f = e.options[u], g = s + u * r - n;
      if (g + r < s || g > s + c) continue;
      u === a && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(i, g, o, r));
      const m = d.includes(f.value);
      m && !e.multiple && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(i, g, o, r)), e.multiple ? this.renderMultipleOption(f.label, f.disabled, m, i, g, o) : this.renderSingleOption(f.label, f.disabled, m, i, g, o);
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
    const { x: e, y: i, width: s, scrollTop: o, hoveredIndex: n, tagsConfig: a } = t;
    if (!a || !a.options) return;
    const { options: r, selectedValues: l = [] } = a, h = 32, c = 8, u = Math.min(r.length, c) * h;
    this.ctx.save(), this.drawDropdownPanel(e, i, s, u), this.ctx.beginPath(), this.ctx.rect(e, i, s, u), this.ctx.clip();
    for (let f = 0; f < r.length; f++) {
      const g = r[f], m = i + f * h - o;
      if (m + h < i || m > i + u) continue;
      const x = l.includes(g.value ?? g.text);
      f === n && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, s, h)), x && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(e, m, s, h));
      const y = 14, w = e + 10, C = m + (h - y) / 2;
      this.ctx.fillStyle = x ? this.theme.colors.checkbox.checkedBg : this.theme.colors.button.background, this.ctx.strokeStyle = x ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(w, C, y, y, 2), this.ctx.fill(), this.ctx.stroke(), x && (this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(w + 3, C + 7), this.ctx.lineTo(w + 6, C + 10), this.ctx.lineTo(w + 11, C + 4), this.ctx.stroke()), this.ctx.fillStyle = g.disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
      const b = w + y + 8, R = m + h / 2, I = s - (y + 28), M = mt(
        g.text,
        Math.floor(I / (this.theme.font.size * 0.6))
      );
      this.ctx.fillText(M, b, R);
    }
    this.renderDropdownScrollbar(
      r.length,
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
    const c = l + 14 + 8, d = o + 32 / 2, u = n - 42, f = mt(
      t,
      Math.floor(u / (this.theme.font.size * 0.6))
    );
    this.ctx.fillText(f, c, d);
  }
  renderSingleOption(t, e, i, s, o, n) {
    i ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`) : (this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`), this.ctx.textBaseline = "middle";
    const r = s + 12, l = o + 32 / 2, h = n - 24, c = mt(
      t,
      Math.floor(h / (this.theme.font.size * 0.6))
    );
    if (this.ctx.fillText(c, r, l), i) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath();
      const d = s + n - 20, u = l;
      this.ctx.moveTo(d - 6, u), this.ctx.lineTo(d - 2, u + 4), this.ctx.lineTo(d + 6, u - 4), this.ctx.strokeStyle = this.theme.colors.checkbox.checkedBg, this.ctx.lineWidth = 2, this.ctx.stroke();
    }
  }
  renderDropdownScrollbar(t, e, i, s, o, n, a) {
    if (t <= e) return;
    const r = 6, l = i + o - r - 2, h = t * 32, c = Math.max(20, n / h * n), d = s + a / h * n, u = this.ctx.globalAlpha;
    this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(l, d, r, c, 3), this.ctx.fill(), this.ctx.globalAlpha = u;
  }
  drawDropdownPanel(t, e, i, s) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(t, e, i, s, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0;
  }
}
class si {
  constructor(t, e, i = ht) {
    v(this, "ctx");
    v(this, "theme");
    v(this, "locale");
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
    const { x: e, y: i, width: s, searchValue: o } = t, n = 8, a = 4, r = 36, l = 36, h = n + r + a + l;
    this.drawPanelBackground(e, i, s, h);
    const c = i + n;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + n, c, s - n * 2, r, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const d = c + r / 2, u = e + n + 12;
    o ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(o, u, d)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.searchPlaceholder, u, d)), this.renderFilterButtons(e, i + n + r + a, s, l), this.drawPanelBorder(e, i, s, h);
  }
  renderSelectFilterDropdown(t) {
    const { x: e, y: i, width: s, options: o, scrollTop: n, hoveredIndex: a, isLoading: r } = t;
    if (!o && !r) return;
    const l = 8, h = 4, c = 32, d = 32, u = 8, f = 36, g = (o == null ? void 0 : o.length) ?? 0, m = Math.min(g, u), x = m * d, y = l + c + h + x + h + f;
    this.drawPanelBackground(e, i, s, y);
    const w = i + l;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + l, w, s - l * 2, c, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", t.searchText ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(t.searchText, e + l + 12, w + c / 2)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(
      this.locale.filter.selectSearchPlaceholder,
      e + l + 12,
      w + c / 2
    ));
    const C = i + l + c + h;
    if (r)
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.loading, e + l, C + d / 2);
    else if (o && o.length > 0) {
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(e, C, s, x), this.ctx.clip();
      const b = 14, R = 8, I = Math.floor(n / d), M = -(n % d);
      for (let E = 0; E <= m + 1; E++) {
        const T = I + E;
        if (T < 0 || T >= o.length) continue;
        const H = o[T];
        if (!H) continue;
        const D = C + E * d + M;
        T === a && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, D, s, d));
        const k = e + l, P = D + (d - b) / 2;
        this.ctx.strokeStyle = H.checked ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(k, P, b, b, 2), this.ctx.stroke(), H.checked && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(k, P, b, b, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(k + 3, P + 7), this.ctx.lineTo(k + 6, P + 10), this.ctx.lineTo(k + 11, P + 4), this.ctx.stroke()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const B = k + b + R, L = s - l * 2 - b - R, W = String(H.value);
        if (/^#[0-9A-Fa-f]{6}$/.test(W)) {
          const N = D + (d - 16) / 2, V = B;
          this.ctx.fillStyle = W, this.ctx.beginPath(), this.ctx.roundRect(V, N, 16, 16, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
          const z = V + 16 + 6, X = L - 16 - 6, $ = mt(
            W.toUpperCase(),
            Math.floor(X / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText($, z, D + d / 2);
        } else {
          const A = mt(
            H.label,
            Math.floor(L / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(A, B, D + d / 2);
        }
      }
      if (this.ctx.restore(), o.length > u) {
        const T = o.length * d, H = Math.max(20, x / T * x), D = x - H, k = n / (T - x) * D, P = this.ctx.globalAlpha;
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
      i + l + c + h + x + h,
      s,
      f
    ), this.drawPanelBorder(e, i, s, y);
  }
  renderRangeFilterDropdown(t) {
    const { x: e, y: i, width: s, minValue: o, maxValue: n } = t, a = 8, r = 4, l = 32, h = 8, c = 36, d = a + l + r + c;
    this.drawPanelBackground(e, i, s, d), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const u = i + a, f = (s - a * 3) / 2;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + a, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = o ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(
      o ? String(o) : this.locale.filter.minPlaceholder,
      e + a + 8,
      u + l / 2
    );
    const g = e + a + f + h;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.beginPath(), this.ctx.roundRect(g, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = n ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(
      n ? String(n) : this.locale.filter.maxPlaceholder,
      g + 8,
      u + l / 2
    ), this.renderFilterButtons(e, i + a + l + r, s, c), this.drawPanelBorder(e, i, s, d);
  }
  renderBooleanFilterDropdown(t) {
    const { x: e, y: i, width: s, boolValue: o } = t, n = 8, a = 4, r = 32, l = 36, h = n + r * 3 + a + l;
    this.drawPanelBackground(e, i, s, h);
    const c = [
      { value: "all", label: this.locale.filter.all },
      { value: "true", label: this.locale.filter.selected },
      { value: "false", label: this.locale.filter.unselected }
    ], d = 14, u = 8;
    for (let f = 0; f < c.length; f++) {
      const g = c[f], m = i + n + f * r, x = o === g.value;
      x && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, s, r));
      const y = e + n, w = m + (r - d) / 2;
      this.ctx.strokeStyle = x ? this.theme.colors.button.primaryBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.arc(y + d / 2, w + d / 2, d / 2, 0, Math.PI * 2), this.ctx.stroke(), x && (this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.beginPath(), this.ctx.arc(y + d / 2, w + d / 2, d / 4, 0, Math.PI * 2), this.ctx.fill()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText(g.label, y + d + u, m + r / 2);
    }
    this.renderFilterButtons(e, i + n + r * 3 + a, s, l), this.drawPanelBorder(e, i, s, h);
  }
  renderDateRangeFilterDropdown(t) {
    const { x: e, y: i, width: s, startDate: o, endDate: n, activeDateField: a } = t, r = 8, l = 4, h = 32, c = 8, d = 36, u = r + h + l + d;
    this.drawPanelBackground(e, i, s, u), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const f = i + r, g = (s - r * 3) / 2, m = e + r, x = a === "startDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = x ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = x ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(m, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const y = o ? this.formatDate(o, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = y ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(
      y || this.locale.filter.startDatePlaceholder,
      m + 8,
      f + h / 2
    );
    const w = e + r + g + c, C = a === "endDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = C ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = C ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(w, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const b = n ? this.formatDate(n, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = b ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(
      b || this.locale.filter.endDatePlaceholder,
      w + 8,
      f + h / 2
    ), this.renderFilterButtons(e, i + r + h + l, s, d), this.drawPanelBorder(e, i, s, u);
  }
  renderDateRangeCalendarPopover(t) {
    const {
      x: e,
      y: i,
      width: s,
      startDate: o,
      endDate: n,
      activeDateField: a,
      currentYear: r,
      currentMonth: l,
      hoveredDate: h
    } = t;
    if (!a || r === void 0 || l === void 0) return;
    const c = 8, d = 32, u = 8, f = 40, g = 28, m = 28, x = 8, w = f + g + 6 * m + x * 2, C = 240, b = (s - c * 3) / 2, R = e + c, I = e + c + b + u, M = i + c;
    let H = (a === "startDate" ? R : I) + b / 2 - C / 2;
    H < e && (H = e), H + C > e + s && (H = e + s - C);
    const D = M + d + u, k = a === "startDate" ? o : n;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(H, D, C, w, 6), this.ctx.fill(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke();
    const P = this.locale.calendar.months[l] ?? String(l + 1), B = this.locale.calendar.yearMonthFormat.replace("{year}", String(r)).replace("{month}", P);
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(B, H + C / 2, D + f / 2);
    const L = 6, W = H + 20, _ = H + C - 20, A = D + f / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(W + L, A - L), this.ctx.lineTo(W - L, A), this.ctx.lineTo(W + L, A + L), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(_ - L, A - L), this.ctx.lineTo(_ + L, A), this.ctx.lineTo(_ - L, A + L), this.ctx.closePath(), this.ctx.fill();
    const N = this.locale.calendar.weekdays, V = (C - x * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let Q = 0; Q < 7; Q++) {
      const st = H + x + Q * V + V / 2, it = D + f + g / 2;
      this.ctx.fillText(N[Q], st, it);
    }
    const X = new Date(r, l, 1).getDay(), $ = new Date(r, l + 1, 0).getDate(), tt = /* @__PURE__ */ new Date();
    tt.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let Q = 1; Q <= $; Q++) {
      const st = X + Q - 1, it = Math.floor(st / 7), nt = st % 7, U = H + x + nt * V, et = D + f + g + it * m, rt = U + V / 2, at = et + m / 2, q = new Date(r, l, Q), lt = k && q.getTime() === k.getTime(), wt = h && q.getTime() === h.getTime(), vt = q.getTime() === tt.getTime();
      if (lt)
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.beginPath(), this.ctx.arc(rt, at, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = "#ffffff";
      else if (wt)
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.beginPath(), this.ctx.arc(rt, at, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
      else if (vt) {
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.fillText(String(Q), rt, at), this.ctx.fillStyle = this.theme.colors.dropdown.text;
        continue;
      } else
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.textAlign = "center", this.ctx.fillText(String(Q), rt, at);
    }
    this.ctx.restore();
  }
  renderFilterButtons(t, e, i, s) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(t, e, i, s), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.lineTo(t + i, e), this.ctx.stroke(), this.ctx.font = `14px ${this.theme.font.family}`;
    const a = this.locale.filter.reset, r = this.locale.filter.confirm, l = this.ctx.measureText(r).width, h = t + 8, c = t + i - 8 - l, d = e + s / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(a, h, d), this.ctx.fillStyle = this.theme.colors.linkColor, this.ctx.fillText(r, c, d);
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
function oi(p) {
  p.shadowColor = "transparent", p.shadowBlur = 0, p.shadowOffsetX = 0, p.shadowOffsetY = 0;
}
function ni(p, t) {
  p.shadowColor = t.colors.shadow.color, p.shadowBlur = t.colors.shadow.blur, p.shadowOffsetX = t.colors.shadow.offsetX, p.shadowOffsetY = t.colors.shadow.offsetY;
}
function St(p, t, e) {
  const i = e.radius ?? 6;
  e.shadow && ni(p, t), p.fillStyle = e.fillStyle, p.beginPath(), p.roundRect(e.x, e.y, e.width, e.height, i), p.fill(), e.shadow && oi(p), e.clip && (p.beginPath(), p.roundRect(e.x, e.y, e.width, e.height, i), p.clip()), e.strokeStyle && (p.strokeStyle = e.strokeStyle, p.lineWidth = 1, p.beginPath(), p.roundRect(e.x, e.y, e.width, e.height, i), p.stroke());
}
function oe(p, t, e, i, s, o, n, a) {
  const r = p.globalAlpha;
  p.globalAlpha = t.colors.scrollbar.opacity, p.fillStyle = t.colors.scrollbar.track, p.fillRect(e, i, s, o), p.fillStyle = t.colors.scrollbar.thumb, p.fillRect(e, n, s, a), p.globalAlpha = r;
}
class ri {
  constructor(t, e, i, s = ht) {
    v(this, "ctx");
    v(this, "theme");
    v(this, "loader");
    v(this, "locale");
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
    this.ctx.save(), St(this.ctx, this.theme, {
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
        const x = g * 4 + m;
        if (x >= t.images.length) break;
        const y = t.images[x];
        if (!y) continue;
        const w = t.x + 8 + m * 72, C = t.y + 8 + g * 72 - t.scrollTop;
        C + 64 < t.y || C > t.y + h || this.renderImageTile(
          y,
          w,
          C,
          64,
          x === t.hoveredIndex,
          !1,
          !1
        );
      }
    if (d > h - 8 * 2) {
      const g = h - 16, m = Math.max(
        30,
        h / d * g
      ), x = t.y + 8 + t.scrollTop / (d - g + 8 * 2) * (g - m);
      oe(
        this.ctx,
        this.theme,
        t.x + 304 - 8 - 4,
        t.y + 8,
        4,
        g,
        x,
        m
      );
    }
    this.ctx.restore();
  }
  renderImageEditor(t) {
    const e = t.images ?? [], i = t.pendingImages ?? [], s = 64, o = 8, n = 8, a = 4, r = 60, l = s + n, h = 4, d = a * s + (a - 1) * n + o * 2 + 4 + h, u = t.maxRows * l + o * 2 - n, f = r + u;
    this.ctx.save(), St(this.ctx, this.theme, {
      x: t.x,
      y: t.y,
      width: d,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.renderUploadArea(t, d, r, o);
    const g = t.y + r, m = Math.ceil((e.length + i.length) / a), x = m * l - n, y = u - o * 2;
    this.ctx.beginPath(), this.ctx.rect(t.x, g, d, u), this.ctx.clip();
    const w = Math.floor(t.scrollTop / l), C = Math.min(m, w + t.maxRows + 1), b = [...e, ...i.map((R) => R.preview)];
    for (let R = w; R < C; R++)
      for (let I = 0; I < a; I++) {
        const M = R * a + I;
        if (M >= b.length) break;
        const E = b[M];
        if (!E) continue;
        const T = t.x + o + I * (s + n), H = g + o + R * l - t.scrollTop;
        if (H + s < g || H > g + u) continue;
        const D = M === t.hoveredIndex, k = M >= e.length;
        this.renderImageTile(E, T, H, s, D, k, !0);
      }
    if (x > y) {
      const R = y, I = Math.max(
        30,
        y / x * R
      ), M = g + o + t.scrollTop / (x - y + o * 2) * (R - I);
      oe(
        this.ctx,
        this.theme,
        t.x + d - o - h,
        g + o,
        h,
        R,
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
    const a = n ? this.locale.image.uploadDragging : this.locale.image.uploadIdle;
    this.ctx.fillText(a, t.x + e / 2, o + i / 2);
  }
  renderImageTile(t, e, i, s, o, n, a) {
    const r = this.loader.get(t, s);
    if (r ? (this.ctx.save(), o && (this.ctx.strokeStyle = this.theme.colors.image.hoverBorder, this.ctx.lineWidth = 2, this.ctx.strokeRect(e - 1, i - 1, s + 2, s + 2)), this.ctx.drawImage(r, e, i, s, s), this.ctx.restore(), this.loader.collectVisible(t)) : (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.fillRect(e, i, s, s), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, i, s, s), this.loader.isLoading(t) || this.loader.load(t, s)), n && (this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)", this.ctx.fillRect(e, i + s - 20, s, 20), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.fillText(this.locale.image.uploading, e + s / 2, i + s - 10)), o && !n && a) {
      const h = e + s - 8 - 2, c = i + 16 / 2 + 2;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)", this.ctx.beginPath(), this.ctx.arc(h, c, 16 / 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.strokeStyle = "#ffffff", this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.moveTo(h - 3, c - 3), this.ctx.lineTo(h + 3, c + 3), this.ctx.moveTo(h + 3, c - 3), this.ctx.lineTo(h - 3, c + 3), this.ctx.stroke();
    }
  }
}
class ai {
  constructor(t, e, i, s, o, n = ht) {
    v(this, "ctx");
    v(this, "canvas");
    v(this, "theme");
    v(this, "layoutManager");
    v(this, "locale");
    v(this, "dpr");
    v(this, "watermarkConfig", null);
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
    const { config: e, x: i, y: s, width: o, hoveredColor: n } = t, a = e.presetColors || this.getDefaultPresetColors(), r = 8, l = 24, h = 4, c = 8, d = Math.ceil(a.length / r), u = c * 2 + d * (l + h) - h;
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.beginPath(), this.ctx.roundRect(i, s, o, u, 6), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(i, s, o, u, 6), this.ctx.stroke();
    for (let f = 0; f < a.length; f++) {
      const g = a[f], m = f % r, x = Math.floor(f / r), y = i + c + m * (l + h), w = s + c + x * (l + h);
      this.ctx.fillStyle = g, this.ctx.fillRect(y, w, l, l), g === n ? (this.ctx.strokeStyle = "#1890ff", this.ctx.lineWidth = 2, this.ctx.strokeRect(y - 1, w - 1, l + 2, l + 2)) : (this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(y, w, l, l));
    }
  }
  renderTooltip(t) {
    const { x: e, y: i, width: s, content: o } = t, n = 8, a = 20, r = 4, l = 4, h = 4;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    let c = n * 2;
    const d = [], u = [], f = 140, g = 300, m = s ?? g;
    let x = 0;
    if (o.type === "text") {
      const R = this.ctx.measureText(o.text).width;
      x = Math.min(R + n * 2, g);
      const I = Math.max(f, Math.min(x, m));
      let M = "";
      for (const E of o.text.split("")) {
        const T = M + E;
        this.ctx.measureText(T).width > I - n * 2 ? (M && d.push(M), M = E) : M = T;
      }
      M && d.push(M), c += d.length * a;
    } else if (o.type === "tags") {
      const R = o.tags;
      let I = [], M = n;
      for (const E of R) {
        const T = this.ctx.measureText(E.text).width + l * 2;
        x = Math.max(x, M + T + n), M + T + r > m - n && I.length > 0 && (u.push(I), I = [], M = n), I.push(E), M += T + r;
      }
      I.length > 0 && u.push(I), c += u.length * (this.theme.font.size + l * 2) + (u.length - 1) * r;
    }
    const y = Math.max(f, Math.min(x, m));
    let w = e + (m - y) / 2;
    const C = this.canvas.width / this.dpr;
    w < 0 ? w = 4 : w + y > C && (w = C - y - 4);
    const b = i - c - this.theme.colors.tooltip.gap;
    if (this.ctx.save(), this.ctx.fillStyle = this.theme.colors.tooltip.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(w, b, y, c, 6), this.ctx.fill(), this.ctx.restore(), this.ctx.fillStyle = this.theme.colors.tooltip.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "top", o.type === "text") {
      let R = b + n;
      for (const I of d)
        this.ctx.fillText(I, w + n, R), R += a;
    } else if (o.type === "tags") {
      let R = b + n;
      const I = this.theme.font.size + l * 2;
      for (const M of u) {
        let E = w + n;
        for (const T of M) {
          const H = this.ctx.measureText(T.text).width + l * 2;
          this.ctx.fillStyle = T.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0"), this.ctx.beginPath(), this.ctx.roundRect(E, R, H, I, h), this.ctx.fill(), this.ctx.fillStyle = T.color ?? this.theme.colors.cellText ?? "#333", this.ctx.textBaseline = "middle";
          const D = E + (H - this.ctx.measureText(T.text).width) / 2;
          this.ctx.fillText(T.text, D, R + I / 2), E += H + r;
        }
        R += I + r;
      }
    }
  }
  renderScrollbars(t, e, i, s, o) {
    const n = this.canvas.width / this.dpr, a = this.canvas.height / this.dpr, r = this.layoutManager.getLayoutInfo(), l = r.headerHeight, h = 10, c = 30;
    if (s > 0) {
      const d = a - l, u = Math.max(
        c,
        a / r.totalHeight * d
      ), f = l + e / s * (d - u), g = n - h;
      let m = this.theme.colors.scrollbar.thumb;
      o.verticalDragging ? m = this.theme.colors.scrollbar.thumbActive : o.verticalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const x = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(g, f, h - 2, u, 4), this.ctx.fill(), this.ctx.globalAlpha = x;
    }
    if (i > 0) {
      const d = n, u = Math.max(
        c,
        n / r.totalWidth * d
      ), f = t / i * (d - u), g = a - h;
      let m = this.theme.colors.scrollbar.thumb;
      o.horizontalDragging ? m = this.theme.colors.scrollbar.thumbActive : o.horizontalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const x = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(f, g, u, h - 2, 4), this.ctx.fill(), this.ctx.globalAlpha = x;
    }
  }
  getScrollbarBounds(t, e, i, s) {
    const o = this.canvas.width / this.dpr, n = this.canvas.height / this.dpr, a = this.layoutManager.getLayoutInfo(), r = a.headerHeight, l = 10, h = 30;
    let c = null, d = null;
    if (s > 0) {
      const u = n - r, f = Math.max(
        h,
        n / a.totalHeight * u
      ), g = r + e / s * (u - f);
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
        o / a.totalWidth * u
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
    const i = this.canvas.width / this.dpr, s = this.canvas.height / this.dpr, o = this.theme.colors.watermark, n = this.watermarkConfig.fontSize ?? o.fontSize, a = this.watermarkConfig.fontFamily ?? o.fontFamily ?? this.theme.font.family, r = this.watermarkConfig.color ?? o.color, l = this.watermarkConfig.rotation ?? -22, h = this.watermarkConfig.gapX ?? 100, c = this.watermarkConfig.gapY ?? 100, d = this.watermarkConfig.opacity ?? o.opacity;
    this.ctx.save(), this.ctx.globalAlpha = d, this.ctx.font = `${n}px ${a}`, this.ctx.fillStyle = r, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const u = l * Math.PI / 180, g = this.ctx.measureText(e).width + h, m = n + c, x = Math.ceil(i / g) + 2, y = Math.ceil(s / m) + 2;
    for (let w = -1; w <= y; w++)
      for (let C = -1; C <= x; C++) {
        const b = C * g + (w % 2 === 0 ? 0 : g / 2), R = w * m;
        this.ctx.save(), this.ctx.translate(b, R), this.ctx.rotate(u), this.ctx.fillText(e, 0, 0), this.ctx.restore();
      }
    this.ctx.restore();
  }
  renderContextMenu(t) {
    const { x: e, y: i, hoveredIndex: s, items: o } = t, n = 140, a = 32, r = o.length * a;
    this.ctx.save(), this.drawMenuPanel(e, i, n, r), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < o.length; l++) {
      const h = o[l], c = i + l * a;
      l === s && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, n, a)), this.ctx.fillStyle = h.danger ? "#f56c6c" : this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + a / 2);
    }
    this.ctx.restore();
  }
  renderHeaderContextMenu(t) {
    const { x: e, y: i, hoveredIndex: s } = t, o = 120, n = 32, a = [{ text: this.locale.contextMenu.hideColumn }], r = a.length * n;
    this.ctx.save(), this.drawMenuPanel(e, i, o, r), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < a.length; l++) {
      const h = a[l], c = i + l * n;
      l === s && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, o, n)), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + n / 2);
    }
    this.ctx.restore();
  }
  renderDateDropdown(t) {
    const { x: e, y: i, width: s, currentYear: o, currentMonth: n, selectedDate: a, hoveredDate: r } = t, l = 40, h = 28, c = 28, d = 8, f = l + h + 6 * c + d * 2;
    this.ctx.save(), St(this.ctx, this.theme, {
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
    const x = 6, y = e + 20, w = e + s - 20, C = i + l / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(y + x, C - x), this.ctx.lineTo(y - x, C), this.ctx.lineTo(y + x, C + x), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(w - x, C - x), this.ctx.lineTo(w + x, C), this.ctx.lineTo(w - x, C + x), this.ctx.closePath(), this.ctx.fill();
    const b = this.locale.calendar.weekdays, R = (s - d * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let H = 0; H < 7; H++) {
      const D = e + d + H * R + R / 2, k = i + l + h / 2;
      this.ctx.fillText(b[H], D, k);
    }
    const M = new Date(o, n, 1).getDay(), E = new Date(o, n + 1, 0).getDate(), T = /* @__PURE__ */ new Date();
    T.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let H = 1; H <= E; H++) {
      const D = M + H - 1, k = Math.floor(D / 7), P = D % 7, B = e + d + P * R, L = i + l + h + k * c, W = new Date(o, n, H), _ = W.getTime() === T.getTime(), A = a && W.getFullYear() === a.getFullYear() && W.getMonth() === a.getMonth() && W.getDate() === a.getDate(), N = r && W.getFullYear() === r.getFullYear() && W.getMonth() === r.getMonth() && W.getDate() === r.getDate();
      A ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        B + R / 2,
        L + c / 2,
        Math.min(R, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : N ? (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.beginPath(), this.ctx.arc(
        B + R / 2,
        L + c / 2,
        Math.min(R, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text) : _ ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        B + R / 2,
        L + c / 2,
        Math.min(R, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(String(H), B + R / 2, L + c / 2);
    }
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e, i, s, f, 6), this.ctx.stroke(), this.ctx.restore();
  }
  drawMenuPanel(t, e, i, s) {
    St(this.ctx, this.theme, {
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
class ct {
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
    const a = n.measureText(t).width;
    switch (o) {
      case "center":
        return e + (i - a) / 2;
      case "right":
        return e + i - s - a;
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
class ne extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "text");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, column: l, row: h, value: c, isSelected: d, isHovered: u } = e, f = this.getPadding(), g = this.getTextAlign(l), m = this.formatValue(c, l, h);
    i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const x = m || (l.placeholder ?? ""), y = m ? this.getTextColor(s, d, u) : s.colors.placeholderText;
    i.fillStyle = y;
    const w = a - f * 2, C = this.truncateText(i, x, w), b = this.calculateTextX(C, o, a, f, g, i), R = n + r / 2;
    return i.fillText(C, b, R), { type: "text" };
  }
  getTextColor(e, i, s) {
    return e.colors.cellText;
  }
  formatValue(e, i, s) {
    return e == null ? "" : i.formatter ? i.formatter(e, s, i) : String(e);
  }
}
class li extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "number");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, column: l, row: h, value: c, isSelected: d, isHovered: u, locale: f } = e, g = 8, m = this.getTextAlign(l), x = this.formatValue(c, l, h);
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(o, n, a, r), i.stroke();
    const y = l.placeholder ?? f.cell.numberPlaceholder, w = x || y;
    i.fillStyle = x ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const C = a - g * 2, b = this.truncateText(i, w, C), R = this.calculateTextX(b, o, a, g, m, i), I = n + r / 2;
    return i.fillText(b, R, I), { type: "number" };
  }
  formatValue(e, i, s) {
    return e == null || e === "" ? "" : i.formatter ? i.formatter(e, s, i) : typeof e == "number" ? e.toLocaleString() : String(e);
  }
}
class hi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "checkbox");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, value: l, isDisabled: h } = e, c = l, d = 16, u = o + (a - d) / 2, f = n + (r - d) / 2, g = h ?? !1;
    return i.fillStyle = g ? s.colors.checkbox.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.checkbox.border, i.lineWidth = 1, i.beginPath(), i.roundRect(u, f, d, d, 3), i.fill(), i.stroke(), c.indeterminate ? (i.strokeStyle = g ? s.colors.checkbox.border : s.colors.checkbox.checkedBg, i.lineWidth = 2, i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d - 4, f + d / 2), i.stroke()) : c.checked && (i.strokeStyle = g ? s.colors.checkbox.border : s.colors.checkbox.checkedBg, i.lineWidth = 2, i.lineCap = "round", i.lineJoin = "round", i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d / 2 - 1, f + d - 5), i.lineTo(u + d - 3, f + 4), i.stroke()), { type: "checkbox", config: c };
  }
}
class ci extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "radio");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, value: l, isDisabled: h } = e, c = l, d = 16, u = 8, f = 4, g = h ?? !1;
    if (i.save(), i.beginPath(), i.rect(o, n, a, r), i.clip(), c.options && c.options.length > 0) {
      i.font = `${s.font.size}px ${s.font.family}`;
      const m = c.options.map((w) => {
        const C = i.measureText(w.label).width;
        return d + f + C + u;
      });
      let x = o + u;
      const y = o + a - u;
      for (let w = 0; w < c.options.length; w++) {
        const C = c.options[w], b = m[w];
        if (x + b - u > y)
          break;
        const R = x, I = n + (r - d) / 2, M = R + d / 2, E = I + d / 2, T = C.disabled || g, H = c.value === C.value;
        i.fillStyle = T ? s.colors.radio.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(M, E, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), H && (i.fillStyle = T ? s.colors.radio.border : s.colors.radio.checkedBg, i.beginPath(), i.arc(M, E, d / 2 - 4, 0, Math.PI * 2), i.fill()), i.fillStyle = T ? s.colors.placeholderText : s.colors.cellText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
        const D = R + d + f;
        i.fillText(C.label, D, E), x += b;
      }
    } else {
      const m = o + (a - d) / 2, x = n + (r - d) / 2, y = m + d / 2, w = x + d / 2;
      i.fillStyle = g ? s.colors.radio.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(y, w, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), c.checked && (i.fillStyle = g ? s.colors.radio.border : s.colors.radio.checkedBg, i.beginPath(), i.arc(y, w, d / 2 - 4, 0, Math.PI * 2), i.fill());
    }
    return i.restore(), { type: "radio", config: c };
  }
}
class di extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "button");
  }
  render(e) {
    const { value: i, buttonHoverState: s } = e, o = i;
    return this.isButtonsConfig(o) ? this.renderButtons(e, o) : this.renderSingleButton(e, o, s == null ? void 0 : s.progress);
  }
  isButtonsConfig(e) {
    return "buttons" in e;
  }
  renderSingleButton(e, i, s) {
    const { ctx: o, theme: n, locale: a, x: r, y: l, width: h, height: c, isDisabled: d } = e, u = 8, f = i.size === "small" ? 24 : i.size === "large" ? 40 : 32, g = l + (c - f) / 2, m = d ?? !1, x = i.text ?? a.cell.buttonText;
    o.font = `${n.font.size}px ${n.font.family}`;
    const y = o.measureText(x).width, C = Math.min(
      Math.max(y + 16 * 2, 60),
      h - u * 2
    ), b = r + (h - C) / 2, R = s ?? 0;
    let I, M, E;
    if (m)
      I = n.colors.button.disabledBg, M = n.colors.button.disabledText, E = n.colors.button.disabledBorder;
    else
      switch (i.variant) {
        case "primary":
          I = n.colors.button.primaryBg, M = n.colors.button.primaryText, E = I;
          break;
        case "danger":
          I = n.colors.button.dangerBg, M = n.colors.button.dangerText, E = I;
          break;
        case "warning":
          I = n.colors.button.warningBg, M = n.colors.button.warningText, E = I;
          break;
        case "link":
          I = "transparent", M = n.colors.button.linkText, E = "transparent";
          break;
        default:
          I = n.colors.button.background, M = n.colors.button.text, E = n.colors.button.border;
      }
    if (!m && R > 0 && i.variant !== "link")
      if (i.variant === "default" || !i.variant) {
        const H = this.hexToRgb(n.colors.button.background);
        if ((H.r * 299 + H.g * 587 + H.b * 114) / 1e3 > 128) {
          const k = Math.round(H.r - R * 0.2 * H.r);
          I = `rgb(${k}, ${k}, ${k})`;
        } else {
          const k = Math.round(H.r + R * 0.2 * (255 - H.r));
          I = `rgb(${k}, ${k}, ${k})`;
        }
      } else
        o.globalAlpha = 1 - R * 0.2;
    o.fillStyle = I, o.strokeStyle = E, o.lineWidth = 1;
    const T = 4;
    return o.beginPath(), o.roundRect(b, g, C, f, T), o.fill(), o.stroke(), !m && R > 0 && i.variant !== "link" && (o.globalAlpha = 1), o.fillStyle = M, o.font = `${n.font.size}px ${n.font.family}`, o.textBaseline = "middle", o.textAlign = "center", o.fillText(x, b + C / 2, g + f / 2), o.textAlign = "left", { type: "button", config: i };
  }
  renderButtons(e, i) {
    const { ctx: s, theme: o, locale: n, x: a, y: r, height: l, isDisabled: h, hoveredButtonIndex: c } = e, d = 8, u = i.gap ?? 4, f = i.maxVisible ?? 3, g = 24, m = r + (l - g) / 2, x = i.buttons.filter((b) => b.visible !== !1), y = x.slice(0, f), w = x.slice(f);
    let C = a + d;
    for (let b = 0; b < y.length; b++) {
      const R = y[b], I = R.text ?? n.cell.buttonText;
      s.font = `${o.font.size}px ${o.font.family}`;
      const M = s.measureText(I).width, E = Math.max(M + 16, 40), T = c === b && !h, H = h ?? !1;
      let D, k, P;
      H ? (D = o.colors.button.disabledBg, k = o.colors.button.disabledText, P = o.colors.button.disabledBorder) : R.variant === "primary" ? (D = o.colors.button.primaryBg, k = o.colors.button.primaryText, P = D) : R.variant === "danger" ? (D = o.colors.button.dangerBg, k = o.colors.button.dangerText, P = D) : R.variant === "warning" ? (D = o.colors.button.warningBg, k = o.colors.button.warningText, P = D) : R.variant === "link" ? (D = "transparent", k = o.colors.button.linkText, P = "transparent") : (D = T ? o.colors.button.hoverBg : o.colors.button.background, k = o.colors.button.text, P = o.colors.button.border), s.fillStyle = D, s.strokeStyle = P, s.lineWidth = 1, s.beginPath(), s.roundRect(C, m, E, g, 4), s.fill(), s.stroke(), s.fillStyle = k, s.font = `${o.font.size}px ${o.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(I, C + E / 2, m + g / 2), C += E + u;
    }
    if (w.length > 0) {
      const b = i.moreButtonText ?? "···", R = s.measureText(b).width, I = Math.max(R + 16, 32), M = h ?? !1, E = c === y.length && !M;
      s.fillStyle = M ? o.colors.button.disabledBg : E ? o.colors.button.hoverBg : o.colors.button.background, s.strokeStyle = M ? o.colors.button.disabledBorder : o.colors.button.border, s.lineWidth = 1, s.beginPath(), s.roundRect(C, m, I, g, 4), s.fill(), s.stroke(), s.fillStyle = M ? o.colors.button.disabledText : o.colors.button.text, s.font = `${o.font.size}px ${o.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(b, C + I / 2, m + g / 2);
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
class ui extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "switch");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, value: l, isDisabled: h, switchAnimation: c } = e, d = l, u = 44, f = 22, g = 18, m = o + (a - u) / 2, x = n + (r - f) / 2, y = f / 2, w = d.checked ?? !1, C = h ?? !1, b = (c == null ? void 0 : c.progress) ?? (w ? 1 : 0), R = u - g - 4, I = m + 2 + b * R, M = x + (f - g) / 2;
    i.save();
    const E = C ? s.colors.switch.disabledOffBg : s.colors.switch.offBg, T = C ? s.colors.switch.disabledOnBg : s.colors.switch.onBg, H = this.hexToRgb(E), D = this.hexToRgb(T), k = Math.round(H.r + (D.r - H.r) * b), P = Math.round(H.g + (D.g - H.g) * b), B = Math.round(H.b + (D.b - H.b) * b);
    return i.fillStyle = `rgb(${k}, ${P}, ${B})`, i.beginPath(), i.roundRect(m, x, u, f, y), i.fill(), i.fillStyle = s.colors.switch.thumb, i.beginPath(), i.arc(I + g / 2, M + g / 2, g / 2, 0, Math.PI * 2), i.fill(), i.shadowColor = s.colors.shadow.color, i.shadowBlur = s.colors.shadow.blur, i.shadowOffsetX = s.colors.shadow.offsetX, i.shadowOffsetY = s.colors.shadow.offsetY, i.restore(), { type: "switch", config: d };
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
const re = 32;
class fi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "progress");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, value: l } = e, h = l, c = h.shape ?? "line";
    return c === "line" ? this.renderLineProgress(i, s, o, n, a, r, h) : c === "circle" ? this.renderCircleProgress(i, s, o, n, a, r, h) : c === "dashboard" && this.renderDashboardProgress(i, s, o, n, a, r, h), { type: "progress", config: h };
  }
  renderLineProgress(e, i, s, o, n, a, r) {
    const h = r.textPosition ?? "right", c = r.showText ?? !0, d = r.size ?? "medium";
    e.save();
    const u = r.height ?? (d === "small" ? 6 : d === "large" ? 16 : 10), f = 8, g = c && h === "right" ? 40 : 0, m = r.width ?? n - 8 * 2 - g, x = s + 8, y = o + (a - u) / 2, w = Math.min(100, Math.max(0, r.value)), C = this.getProgressColor(i, r, w), b = r.trackColor ?? i.colors.progress.track, R = r.borderRadius ?? u / 2;
    e.fillStyle = b, e.beginPath(), e.roundRect(x, y, m, u, R), e.fill();
    const I = w / 100 * m;
    if (I > 0) {
      e.fillStyle = C, e.beginPath();
      const M = Math.max(I, R * 2);
      e.roundRect(x, y, M, u, R), e.fill();
    }
    if (c) {
      const M = r.precision ?? 0, E = r.format ? r.format(w) : `${M === 0 ? Math.round(w) : w.toFixed(M)}%`;
      let T;
      h === "inside" ? T = Math.min(i.font.size, Math.max(10, u - 2)) : T = d === "small" ? 11 : d === "large" ? 14 : i.font.size, e.font = `${T}px ${i.font.family}`, e.textBaseline = "middle", h === "right" ? (e.textAlign = "left", e.fillStyle = r.textColor ?? i.colors.cellText, e.fillText(E, x + m + f, o + a / 2)) : (e.textAlign = "center", e.fillStyle = r.textColor ?? i.colors.cellText, e.fillText(E, x + m / 2, o + a / 2));
    }
    e.restore();
  }
  renderCircleProgress(e, i, s, o, n, a, r) {
    const l = r.size ?? "medium", c = Math.floor(re * (l === "small" ? 0.6 : l === "large" ? 0.9 : 0.75)), d = r.width ?? c, u = r.strokeWidth ?? Math.max(2, Math.round(d * 0.12)), f = s + n / 2, g = o + a / 2, m = (d - u) / 2, x = Math.min(100, Math.max(0, r.value)), y = this.getProgressColor(i, r, x), w = r.trackColor ?? i.colors.progress.track;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.beginPath(), e.arc(f, g, m, 0, Math.PI * 2), e.stroke();
    const C = x / 100, b = -Math.PI / 2, R = b + C * Math.PI * 2;
    if (C > 0 && (e.strokeStyle = y, e.lineCap = r.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, b, R), e.stroke()), r.showText ?? !0) {
      const I = r.precision ?? 0, M = r.format ? r.format(x) : `${I === 0 ? Math.round(x) : x.toFixed(I)}%`;
      e.fillStyle = r.textColor ?? i.colors.cellText;
      const E = Math.max(8, Math.round(d * 0.32));
      e.font = `bold ${E}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(M, f, g);
    }
    e.restore();
  }
  renderDashboardProgress(e, i, s, o, n, a, r) {
    const l = r.size ?? "medium", c = Math.floor(re * (l === "small" ? 0.7 : l === "large" ? 0.95 : 0.85)), d = r.width ?? c, u = r.strokeWidth ?? Math.max(2, Math.round(d * 0.1)), f = s + n / 2, g = o + a / 2 + a * 0.05, m = (d - u) / 2, x = Math.min(100, Math.max(0, r.value)), y = this.getProgressColor(i, r, x), w = r.trackColor ?? i.colors.progress.track, C = Math.PI * 0.75, b = Math.PI * 1.5;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.lineCap = r.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, C, C + b, !1), e.stroke();
    const R = x / 100;
    if (R > 0) {
      const I = C + R * b;
      e.strokeStyle = y, e.beginPath(), e.arc(f, g, m, C, I, !1), e.stroke();
    }
    if (r.showText ?? !0) {
      const I = r.precision ?? 0, M = r.format ? r.format(x) : `${I === 0 ? Math.round(x) : x.toFixed(I)}%`;
      e.fillStyle = r.textColor ?? i.colors.cellText;
      const E = Math.max(8, Math.round(d * 0.28));
      e.font = `bold ${E}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(M, f, g);
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
      const a = [...o].sort((r, l) => r.value - l.value);
      if (s <= a[0].value) return a[0].color;
      if (s >= a[a.length - 1].value) return a[a.length - 1].color;
      for (let r = 0; r < a.length - 1; r++) {
        const l = a[r], h = a[r + 1];
        if (s >= l.value && s <= h.value) {
          const c = (s - l.value) / (h.value - l.value);
          return this.interpolateColor(l.color, h.color, c);
        }
      }
    }
    return e.colors.progress.default;
  }
  interpolateColor(e, i, s) {
    const o = this.hexToRgb(e), n = this.hexToRgb(i), a = Math.round(o.r + (n.r - o.r) * s), r = Math.round(o.g + (n.g - o.g) * s), l = Math.round(o.b + (n.b - o.b) * s);
    return `rgb(${a}, ${r}, ${l})`;
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
const gi = 32;
class mi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "image");
  }
  render(e) {
    const {
      ctx: i,
      theme: s,
      x: o,
      y: n,
      width: a,
      height: r,
      value: l,
      isHovered: h,
      hoveredImageIndex: c,
      rowIndex: d,
      imageRuntime: u
    } = e, f = l;
    if (f.images && f.images.length > 0)
      return this.renderMultipleImages(
        i,
        s,
        o,
        n,
        a,
        r,
        f,
        d,
        h,
        c,
        u
      ), { type: "image", config: f };
    if (!f.src)
      return { type: "image", config: f };
    const m = this.getMaxImageSize(a, r, 4, f), x = f.width ?? 32, y = f.height ?? 32, w = Math.min(x, m), C = Math.min(y, m), b = f.circle ? Math.min(w, C) / 2 : f.borderRadius ?? 0, R = o + (a - w) / 2, I = n + (r - C) / 2;
    i.fillStyle = s.colors.image.placeholderBg, i.beginPath(), b > 0 ? i.roundRect(R, I, w, C, b) : i.rect(R, I, w, C), i.fill();
    const M = f.lazy !== !1, E = f.lazyThreshold ?? 200;
    if (M && d !== void 0 && d >= 0 && u && !u.isInLazyLoadRange(d, E))
      return this.renderImagePlaceholder(
        i,
        s,
        R,
        I,
        w,
        C,
        b,
        f.placeholder,
        u
      ), h && f.hoverable !== !1 && this.renderImageHover(i, s, R, I, w, C, b), { type: "image", config: f };
    if (u != null && u.isFailed(f.src))
      return this.renderImageError(
        i,
        s,
        R,
        I,
        w,
        C,
        b,
        f.errorImage,
        u
      ), { type: "image", config: f };
    const T = (u == null ? void 0 : u.get(f.src, Math.max(w, C))) ?? null;
    return T ? (i.save(), i.beginPath(), b > 0 ? i.roundRect(R, I, w, C, b) : i.rect(R, I, w, C), i.clip(), this.drawImageWithFit(
      i,
      T,
      R,
      I,
      w,
      C,
      f.fit ?? "cover"
    ), i.restore(), u == null || u.collectVisible(f.src)) : u && !u.isLoading(f.src) ? (u.collectVisible(f.src), u.load(f.src, Math.max(w, C)), this.renderImagePlaceholder(
      i,
      s,
      R,
      I,
      w,
      C,
      b,
      f.placeholder,
      u
    )) : (u == null || u.collectVisible(f.src), this.renderImagePlaceholder(
      i,
      s,
      R,
      I,
      w,
      C,
      b,
      f.placeholder,
      u
    )), h && f.hoverable !== !1 && this.renderImageHover(i, s, R, I, w, C, b), { type: "image", config: f };
  }
  renderMultipleImages(e, i, s, o, n, a, r, l, h, c, d) {
    const u = r.images, f = 4, g = this.getMaxImageSize(n, a, f, r), m = r.width ?? 32, x = r.height ?? 32, y = Math.min(m, g), w = Math.min(x, g), C = r.gap ?? 4, b = r.circle ? Math.min(y, w) / 2 : r.borderRadius ?? 0, R = r.showMoreCount !== !1, I = n - f * 2, M = a - f * 2, E = Math.max(1, Math.floor((I + C) / (y + C))), T = Math.max(1, Math.floor((M + C) / (w + C))), H = E * T, D = r.maxVisible ?? H, P = R && u.length > D ? Math.max(0, H - 1) : H, B = Math.min(D, P), L = r.lazy !== !1, W = r.lazyThreshold ?? 200;
    let _ = !0;
    L && l !== void 0 && l >= 0 && d && (_ = d.isInLazyLoadRange(l, W));
    const A = u.length > B, N = A ? B : u.length, V = u.slice(0, N), z = A ? u.length - B : 0, X = N + (A && R ? 1 : 0), $ = Math.max(1, Math.ceil(X / E)), tt = Math.min(X, E), Q = tt * y + Math.max(0, tt - 1) * C, st = $ * w + Math.max(0, $ - 1) * C;
    let it = s + (n - Q) / 2;
    it = Math.max(s + f, it);
    const nt = o + (a - st) / 2;
    for (let U = 0; U < V.length; U++) {
      const et = V[U], rt = Math.floor(U / E), at = U % E, q = it + at * (y + C), lt = nt + rt * (w + C), wt = !!h && r.hoverable !== !1 && c === U;
      if (e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), b > 0 ? e.roundRect(q, lt, y, w, b) : e.rect(q, lt, y, w), e.fill(), !_) {
        this.renderImagePlaceholder(
          e,
          i,
          q,
          lt,
          y,
          w,
          b,
          r.placeholder,
          d
        ), wt && this.renderImageHover(e, i, q, lt, y, w, b);
        continue;
      }
      if (d != null && d.isFailed(et)) {
        this.renderImageError(
          e,
          i,
          q,
          lt,
          y,
          w,
          b,
          r.errorImage,
          d
        ), wt && this.renderImageHover(e, i, q, lt, y, w, b);
        continue;
      }
      const vt = (d == null ? void 0 : d.get(et, Math.max(y, w))) ?? null;
      vt ? (e.save(), e.beginPath(), b > 0 ? e.roundRect(q, lt, y, w, b) : e.rect(q, lt, y, w), e.clip(), this.drawImageWithFit(
        e,
        vt,
        q,
        lt,
        y,
        w,
        r.fit ?? "cover"
      ), e.restore(), d == null || d.collectVisible(et)) : d && !d.isLoading(et) ? (d.collectVisible(et), d.load(et, Math.max(y, w)), this.renderImagePlaceholder(
        e,
        i,
        q,
        lt,
        y,
        w,
        b,
        r.placeholder,
        d
      )) : (d == null || d.collectVisible(et), this.renderImagePlaceholder(
        e,
        i,
        q,
        lt,
        y,
        w,
        b,
        r.placeholder,
        d
      )), wt && this.renderImageHover(e, i, q, lt, y, w, b);
    }
    if (A && R) {
      const U = Math.floor(N / E), et = N % E, rt = it + et * (y + C), at = nt + U * (w + C), q = !!h && r.hoverable !== !1 && c === N;
      this.renderMoreCount(
        e,
        i,
        rt,
        at,
        y,
        w,
        b,
        z,
        q
      );
    }
  }
  getMaxImageSize(e, i, s, o) {
    const n = o.scaleWithRowHeight === !1 ? Math.min(i, gi) : i;
    return Math.max(0, Math.min(e, n) - s * 2);
  }
  renderImagePlaceholder(e, i, s, o, n, a, r, l, h) {
    if (l && h) {
      const m = h.get(l, Math.max(n, a));
      if (m) {
        e.save(), e.beginPath(), r > 0 ? e.roundRect(s, o, n, a, r) : e.rect(s, o, n, a), e.clip(), this.drawImageWithFit(e, m, s, o, n, a, "cover"), e.restore();
        return;
      } else h.isLoading(l) || h.load(l, Math.max(n, a));
    }
    e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), r > 0 ? e.roundRect(s, o, n, a, r) : e.rect(s, o, n, a), e.fill();
    const c = Math.min(n, a) * 0.4, d = s + n / 2, u = o + a / 2, f = e.strokeStyle, g = e.lineWidth;
    e.strokeStyle = i.colors.placeholderText, e.lineWidth = 1.5, e.beginPath(), e.rect(d - c / 2, u - c / 2, c, c), e.stroke(), e.beginPath(), e.moveTo(d - c / 2, u + c / 4), e.lineTo(d - c / 4, u), e.lineTo(d, u + c / 4), e.lineTo(d + c / 4, u - c / 4), e.lineTo(d + c / 2, u + c / 4), e.stroke(), e.strokeStyle = f, e.lineWidth = g;
  }
  renderImageError(e, i, s, o, n, a, r, l, h) {
    if (l && h) {
      const m = h.get(l, Math.max(n, a));
      if (m) {
        e.save(), e.beginPath(), r > 0 ? e.roundRect(s, o, n, a, r) : e.rect(s, o, n, a), e.clip(), this.drawImageWithFit(e, m, s, o, n, a, "cover"), e.restore();
        return;
      } else !h.isLoading(l) && !h.isFailed(l) && h.load(l, Math.max(n, a));
    }
    e.fillStyle = i.colors.image.errorBg, e.beginPath(), r > 0 ? e.roundRect(s, o, n, a, r) : e.rect(s, o, n, a), e.fill();
    const c = Math.min(n, a) * 0.4, d = s + n / 2, u = o + a / 2, f = e.strokeStyle, g = e.lineWidth;
    e.strokeStyle = i.colors.image.errorBorder, e.lineWidth = 1.5, e.beginPath(), e.rect(d - c / 2, u - c / 2, c, c), e.stroke(), e.beginPath(), e.moveTo(d - c / 4, u - c / 4), e.lineTo(d + c / 4, u + c / 4), e.moveTo(d + c / 4, u - c / 4), e.lineTo(d - c / 4, u + c / 4), e.stroke(), e.strokeStyle = f, e.lineWidth = g;
  }
  renderImageHover(e, i, s, o, n, a, r) {
    const l = i.colors.image.hoverBorder, h = e.strokeStyle, c = e.lineWidth;
    e.strokeStyle = l, e.lineWidth = 2, e.beginPath(), r > 0 ? e.roundRect(s, o, n, a, r) : e.rect(s, o, n, a), e.stroke(), e.save(), e.shadowColor = i.colors.image.hoverShadow, e.shadowBlur = 4, e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.strokeStyle = l, e.lineWidth = 1, e.beginPath(), r > 0 ? e.roundRect(s, o, n, a, r) : e.rect(s, o, n, a), e.stroke(), e.restore(), e.strokeStyle = h, e.lineWidth = c;
  }
  renderMoreCount(e, i, s, o, n, a, r, l, h) {
    e.fillStyle = h ? i.colors.image.hoverBorder : i.colors.moreCount.background, e.beginPath(), r > 0 ? e.roundRect(s, o, n, a, r) : e.rect(s, o, n, a), e.fill();
    const c = `+${l}`;
    e.fillStyle = i.colors.moreCount.text, e.font = `bold ${Math.min(n, a) * 0.4}px ${i.font.family}`;
    const d = e.textAlign, u = e.textBaseline;
    e.textAlign = "center", e.textBaseline = "middle", e.fillText(c, s + n / 2, o + a / 2), e.textAlign = d, e.textBaseline = u;
  }
  drawImageWithFit(e, i, s, o, n, a, r) {
    const l = i.width / i.height, h = n / a;
    let c, d, u, f;
    switch (r) {
      case "fill":
        c = n, d = a, u = s, f = o;
        break;
      case "contain":
        l > h ? (c = n, d = n / l) : (d = a, c = a * l), u = s + (n - c) / 2, f = o + (a - d) / 2;
        break;
      case "cover":
        l > h ? (d = a, c = a * l) : (c = n, d = n / l), u = s + (n - c) / 2, f = o + (a - d) / 2;
        break;
      case "none":
      default:
        c = i.width, d = i.height, u = s + (n - c) / 2, f = o + (a - d) / 2;
        break;
    }
    e.drawImage(i, u, f, c, d);
  }
}
class pi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "tag");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, value: l, locale: h } = e, c = l, d = 8;
    if (!c.tags || c.tags.length === 0) {
      const E = c.placeholder ?? h.cell.tagPlaceholder;
      return E && (i.fillStyle = s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle", i.fillText(E, o + d, n + r / 2)), { type: "tag", config: c };
    }
    const u = 4, f = s.font.size + u * 2, g = 4, m = 4, x = 2, y = /* @__PURE__ */ new Map(), w = (E) => {
      let T = y.get(E);
      return T === void 0 && (T = i.measureText(E).width, y.set(E, T)), T;
    }, C = (E) => w(`+${E}`) + u * 2, { lines: b, processedTags: R } = ge(i, c, a, r, s.font.size), I = b.length * f + (b.length - 1) * x, M = n + (r - I) / 2;
    for (let E = 0; E < b.length; E++) {
      const T = b[E], H = M + E * (f + x);
      let D = o + d;
      for (const { tag: k, displayText: P, width: B } of T) {
        let L = k.bgColor ?? (s.colors.tagColors.default || "#f0f0f0"), W = k.color ?? s.colors.cellText;
        i.fillStyle = L, i.beginPath(), i.roundRect(D, H, B, f, g), i.fill(), i.fillStyle = W, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
        const _ = H + f / 2, A = D + (B - w(P)) / 2;
        i.fillText(P, A, _), D += B + m;
      }
      if (E === b.length - 1) {
        const k = c.tags.length - R;
        if (k > 0) {
          const P = `+${k}`, B = C(k);
          i.fillStyle = s.colors.moreCount.background, i.beginPath(), i.roundRect(D, H, B, f, g), i.fill(), i.fillStyle = s.colors.moreCount.text, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
          const L = H + f / 2, W = D + (B - w(P)) / 2;
          i.fillText(P, W, L);
        }
      }
    }
    return { type: "tag", config: c };
  }
}
class xi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "date");
  }
  render(e) {
    const { ctx: i, theme: s, locale: o, x: n, y: a, width: r, height: l, value: h } = e, c = h, d = 8, u = 20;
    i.strokeStyle = s.colors.date.border, i.lineWidth = 1, i.beginPath(), i.rect(n, a, r, l), i.stroke();
    let f = "";
    if (c.value) {
      const R = c.value instanceof Date ? c.value : new Date(c.value);
      if (!isNaN(R.getTime())) {
        const I = c.format ?? "YYYY-MM-DD";
        f = this.formatDate(R, I);
      }
    }
    const g = c.placeholder ?? o.cell.datePlaceholder, m = f || g;
    i.fillStyle = f ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const x = r - d * 2 - u, y = "...";
    let w = m;
    if (i.measureText(m).width > x) {
      let R = m;
      for (; R.length > 0 && i.measureText(R + y).width > x; )
        R = R.slice(0, -1);
      w = R + y;
    }
    i.fillText(w, n + d, a + l / 2), i.strokeStyle = s.colors.date.icon, i.lineWidth = 1.5;
    const C = n + r - d - 10, b = a + l / 2;
    return i.beginPath(), i.moveTo(C - 6, b - 6), i.lineTo(C - 6, b + 6), i.lineTo(C + 6, b + 6), i.lineTo(C + 6, b - 6), i.closePath(), i.stroke(), i.beginPath(), i.moveTo(C - 6, b - 2), i.lineTo(C + 6, b - 2), i.stroke(), i.beginPath(), i.moveTo(C - 3, b - 8), i.lineTo(C - 3, b - 5), i.stroke(), i.beginPath(), i.moveTo(C + 3, b - 8), i.lineTo(C + 3, b - 5), i.stroke(), { type: "date", config: c };
  }
  formatDate(e, i) {
    const s = e.getFullYear(), o = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0"), a = String(e.getHours()).padStart(2, "0"), r = String(e.getMinutes()).padStart(2, "0"), l = String(e.getSeconds()).padStart(2, "0");
    return i.replace("YYYY", String(s)).replace("MM", o).replace("DD", n).replace("HH", a).replace("mm", r).replace("ss", l);
  }
}
class wi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "select");
  }
  render(e) {
    const { ctx: i, theme: s, locale: o, x: n, y: a, width: r, height: l, value: h, multipleSelectSeparator: c } = e, d = h, u = 8, f = 20;
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(n, a, r, l), i.stroke();
    const g = s.font.size, m = g * 1.5;
    if (d.multiple && Array.isArray(d.value) && d.value.length > 0) {
      const w = this.calculateMaxRows(l, m, u), C = r - u * 2 - f, b = d.value.map((T) => {
        const H = d.options.find((D) => D.value === T);
        return (H == null ? void 0 : H.label) ?? String(T);
      }), R = d.separator ?? c ?? ", ", I = this.wrapTextToLines(i, b.join(R), C, w);
      i.fillStyle = s.colors.cellText, i.font = `${g}px ${s.font.family}`, i.textBaseline = "top";
      const M = I.length * m, E = a + (l - M) / 2;
      for (let T = 0; T < I.length; T++) {
        const H = I[T];
        i.fillText(H, n + u, E + T * m + (m - g) / 2);
      }
    } else {
      let w = "";
      if (d.value !== void 0 && d.value !== null) {
        const M = d.options.find((E) => E.value === d.value);
        w = (M == null ? void 0 : M.label) ?? String(d.value);
      }
      const C = d.placeholder ?? o.cell.selectPlaceholder, b = w || C;
      i.fillStyle = w ? s.colors.cellText : s.colors.placeholderText, i.font = `${g}px ${s.font.family}`, i.textBaseline = "middle";
      const R = r - u * 2 - f, I = this.truncateText(i, b, R);
      i.fillText(I, n + u, a + l / 2);
    }
    i.fillStyle = s.colors.date.icon, i.beginPath();
    const x = n + r - u - 8, y = a + l / 2;
    return i.moveTo(x - 4, y - 2), i.lineTo(x, y + 3), i.lineTo(x + 4, y - 2), i.closePath(), i.fill(), { type: "select", config: d };
  }
  calculateMaxRows(e, i, s = 8) {
    return Math.max(1, Math.floor((e - s * 2) / i));
  }
  wrapTextToLines(e, i, s, o) {
    const n = [];
    let a = "";
    for (const r of i) {
      const l = a + r;
      if (e.measureText(l).width > s && a) {
        if (n.push(a), a = r, n.length >= o) {
          const c = n[o - 1], d = "...";
          let u = c;
          for (; e.measureText(u + d).width > s && u.length > 0; )
            u = u.slice(0, -1);
          return n[o - 1] = u + d, n;
        }
      } else
        a = l;
    }
    return a && n.push(a), n.slice(0, o);
  }
}
class yi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "input");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, value: l } = e, h = l, c = 8;
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(o, n, a, r), i.stroke();
    const d = h.value ?? "", u = h.placeholder ?? "", f = d || u;
    i.fillStyle = d ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const g = a - c * 2;
    if (h.multiline) {
      const m = s.font.size * 1.5, x = h.maxRows ?? 5, y = r - c * 2, w = Math.max(1, Math.floor(y / m)), C = Math.min(x, w), b = this.wrapText(i, f, g), R = b.slice(0, C), I = R.length * m;
      let E = n + (r - I) / 2 + m / 2;
      for (let T = 0; T < R.length; T++) {
        let H = R[T];
        const D = T === R.length - 1, k = b.length > R.length;
        D && (H = this.truncateTextWithEllipsis(i, H, g, k)), i.fillText(H, o + c, E), E += m;
      }
    } else {
      const m = this.truncateTextWithEllipsis(i, f, g);
      i.fillText(m, o + c, n + r / 2);
    }
    return { type: "input", config: h };
  }
  wrapText(e, i, s) {
    const o = [], n = i.split(`
`);
    for (const a of n) {
      if (a === "") {
        o.push("");
        continue;
      }
      let r = a;
      for (; r.length > 0; ) {
        const l = this.findLineBreakPoint(e, r, s);
        l === 0 ? (o.push(r[0]), r = r.slice(1)) : (o.push(r.slice(0, l)), r = r.slice(l));
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
    let n = 1, a = o, r = 0;
    for (; n <= a; ) {
      const l = Math.floor((n + a) / 2), h = i.slice(0, l);
      e.measureText(h).width <= s ? (r = l, n = l + 1) : a = l - 1;
    }
    return r;
  }
  truncateTextWithEllipsis(e, i, s, o = !1) {
    const n = "...", a = e.measureText(n).width, r = e.measureText(i).width;
    return r <= s ? o ? r + a <= s ? i + n : this.truncateWithEllipsisBinary(e, i, s, n, a) : i : this.truncateWithEllipsisBinary(e, i, s, n, a);
  }
  /**
   * 二分查找截断文本并添加省略号
   */
  truncateWithEllipsisBinary(e, i, s, o, n) {
    const a = s - n;
    if (a <= 0)
      return o;
    const r = i.length;
    let l = 0, h = r, c = 0;
    for (; l <= h; ) {
      const d = Math.floor((l + h) / 2), u = i.slice(0, d);
      e.measureText(u).width <= a ? (c = d, l = d + 1) : h = d - 1;
    }
    return i.slice(0, c) + o;
  }
}
class Ci extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "rating");
  }
  render(e) {
    const { ctx: i, x: s, y: o, width: n, height: a, value: r, isDisabled: l } = e, h = r, c = h.value ?? 0, d = h.max ?? 5, u = h.starSize ?? 16, f = h.allowHalf ?? !1, g = Math.min(u, Math.floor(n / d)), m = h.color ?? "#FFD700", x = h.inactiveColor ?? "#E0E0E0", y = h.disabledColor ?? "#BDBDBD", w = l ? y : m, C = l ? y : x, b = d * g, R = s + (n - b) / 2, I = o + (a - g) / 2;
    i.save();
    const M = [];
    for (let E = 0; E < d; E++) {
      const T = R + E * g;
      M.push({
        index: E,
        x: T,
        width: g
      });
      const H = c - E;
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
  drawStar(e, i, s, o, n, a, r) {
    const l = i + o / 2, h = s + o / 2, c = o / 2, d = c * 0.4, u = this.getStarPoints(l, h, c, d);
    e.beginPath(), e.moveTo(u[0].x, u[0].y);
    for (let f = 1; f < u.length; f++)
      e.lineTo(u[f].x, u[f].y);
    if (e.closePath(), e.fillStyle = r, e.fill(), n > 0) {
      e.save(), e.beginPath(), e.rect(i, s, o * n, o), e.clip(), e.beginPath(), e.moveTo(u[0].x, u[0].y);
      for (let f = 1; f < u.length; f++)
        e.lineTo(u[f].x, u[f].y);
      e.closePath(), e.fillStyle = a, e.fill(), e.restore();
    }
  }
  /**
   * Calculate star points coordinates
   */
  getStarPoints(e, i, s, o) {
    const n = [], a = Math.PI / 5, r = -Math.PI / 2;
    for (let l = 0; l < 10; l++) {
      const h = r + l * a, c = l % 2 === 0 ? s : o;
      n.push({
        x: e + c * Math.cos(h),
        y: i + c * Math.sin(h)
      });
    }
    return n;
  }
}
const bi = 32;
class vi extends ct {
  constructor() {
    super(...arguments);
    v(this, "type", "color");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: a, height: r, value: l, isDisabled: h } = e, c = l, u = Math.min(bi - 8 * 2, 24), f = o + (a - u) / 2, g = n + (r - u) / 2;
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
    v(this, "enabled", !1);
    v(this, "stats", /* @__PURE__ */ new Map());
    v(this, "currentFrame", null);
    v(this, "frameHistory", []);
    v(this, "maxFrameHistory", 60);
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
let kt = null;
function Ii() {
  return kt || (kt = new Ri()), kt;
}
class Ei {
  constructor(t = ht) {
    v(this, "renderers", /* @__PURE__ */ new Map());
    v(this, "defaultRenderer");
    v(this, "performanceMonitor");
    v(this, "locale");
    this.locale = t, this.register(new ne()), this.register(new li()), this.register(new hi()), this.register(new ci());
    const e = new di();
    this.register(e), this.renderers.set("buttons", e), this.register(new ui()), this.register(new fi()), this.register(new mi()), this.register(new pi()), this.register(new xi()), this.register(new wi()), this.register(new yi()), this.register(new Ci()), this.register(new vi()), this.defaultRenderer = new ne(), this.performanceMonitor = Ii();
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
function us(p, t, ...e) {
  const i = Si(e);
  if (typeof p == "function") {
    const s = { ...t, children: i };
    return p(s);
  }
  return {
    type: p,
    props: t || {},
    children: i
  };
}
function Si(p) {
  return p.filter((t) => t != null && t !== !1).map((t) => typeof t == "string" ? { type: "CTText", props: { text: t }, children: [] } : typeof t == "number" ? { type: "CTText", props: { text: String(t) }, children: [] } : t);
}
class Mi {
  constructor(t) {
    v(this, "measurementEngine");
    v(this, "layoutResults", []);
    /** 当前根元素的父容器尺寸（通常是单元格尺寸），用于解析根元素百分比 */
    v(this, "rootParentSize");
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
    const o = this.measurementEngine.measureElement(t), n = this.clampSize(o, t.props, s), a = t.props.zIndex, r = this.parseMargin(t.props.margin);
    return {
      element: t,
      x: e,
      y: i,
      width: n.width,
      height: n.height,
      zIndex: a,
      margin: r,
      children: []
    };
  }
  layoutElement(t, e, i, s) {
    if (t.type === "CTBox" && t.props.display === "flex")
      return this.layoutGroup(t, e, i, s);
    if (t.type === "CTBox" && t.props.position === "relative")
      return this.layoutPositionedGroup(t, e, i, s);
    const o = this.measurementEngine.measureElement(t), n = this.clampSize(o, t.props, s), a = t.props.zIndex, r = this.parseMargin(t.props.margin), l = { x: e, y: i, width: n.width, height: n.height, zIndex: a, margin: r };
    return this.layoutResults.push(l), l;
  }
  /**
   * 解析容器自身尺寸：优先使用 width/height（支持百分比），否则用 fallback（内容尺寸）
   * 根元素（即 parentSize 来自外部传入时）默认撑满父容器
   */
  resolveContainerSize(t, e, i, s, o) {
    const n = e == null ? void 0 : e.width, a = e == null ? void 0 : e.height;
    let r = this.resolveSize(t.width, n), l = this.resolveSize(t.height, a);
    r === void 0 && (r = o && n !== void 0 ? n : i), l === void 0 && (l = o && a !== void 0 ? a : s);
    const h = this.resolveSize(t.minWidth, n), c = this.resolveSize(t.maxWidth, n), d = this.resolveSize(t.minHeight, a), u = this.resolveSize(t.maxHeight, a);
    return {
      width: this.clampValue(r, h, c),
      height: this.clampValue(l, d, u)
    };
  }
  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  layoutPositionedGroup(t, e, i, s) {
    const o = t.props, n = t.children || [], a = s !== void 0 && s === this.rootParentSize, { width: r, height: l } = this.resolveContainerSize(
      o,
      s,
      100,
      100,
      a
    ), h = [...n].sort((u, f) => {
      const g = u.props.zIndex ?? 0, m = f.props.zIndex ?? 0;
      return g - m;
    }), c = { width: r, height: l };
    for (const u of h) {
      const f = e + (u.props.x ?? 0), g = i + (u.props.y ?? 0);
      this.layoutElement(u, f, g, c);
    }
    const d = { x: e, y: i, width: r, height: l };
    return this.layoutResults.push(d), d;
  }
  layoutPositionedGroupNode(t, e, i, s) {
    const o = t.props, n = t.children || [], a = s !== void 0 && s === this.rootParentSize, { width: r, height: l } = this.resolveContainerSize(
      o,
      s,
      100,
      100,
      a
    ), h = [...n].sort((u, f) => {
      const g = u.props.zIndex ?? 0, m = f.props.zIndex ?? 0;
      return g - m;
    }), c = { width: r, height: l }, d = h.map((u) => {
      const f = e + (u.props.x ?? 0), g = i + (u.props.y ?? 0);
      return this.layoutNode(u, f, g, c);
    });
    return {
      element: t,
      x: e,
      y: i,
      width: r,
      height: l,
      children: d
    };
  }
  layoutGroup(t, e, i, s) {
    const o = t.props, n = t.children || [], a = s !== void 0 && s === this.rootParentSize, r = this.parsePadding(o.padding), l = o.width !== void 0 || a && (s == null ? void 0 : s.width) !== void 0, h = o.height !== void 0 || a && (s == null ? void 0 : s.height) !== void 0;
    let c, d;
    if (l && h) {
      const y = this.resolveContainerSize(o, s, 0, 0, a);
      c = y.width, d = y.height;
    } else {
      const y = n.map((M) => this.measureChildSize(M)), w = this.calculateContentSize(y, o), C = this.calculateContentHeight(y, o), b = w + r.left + r.right, R = C + r.top + r.bottom, I = this.resolveContainerSize(o, s, b, R, a);
      c = I.width, d = I.height;
    }
    const u = {
      width: c - r.left - r.right,
      height: d - r.top - r.bottom
    }, f = n.map(
      (y) => this.measureChildSize(y, u)
    ), g = e + r.left, m = i + r.top;
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
    const x = { x: e, y: i, width: c, height: d };
    return this.layoutResults.push(x), x;
  }
  layoutGroupNode(t, e, i, s) {
    const o = t.props, n = t.children || [], a = s !== void 0 && s === this.rootParentSize, r = this.parsePadding(o.padding), l = o.width !== void 0 || a && (s == null ? void 0 : s.width) !== void 0, h = o.height !== void 0 || a && (s == null ? void 0 : s.height) !== void 0;
    let c, d;
    if (l && h) {
      const D = this.resolveContainerSize(o, s, 0, 0, a);
      c = D.width, d = D.height;
    } else {
      const D = n.map((_) => this.measureChildSize(_)), k = this.calculateContentSize(D, o), P = this.calculateContentHeight(D, o), B = k + r.left + r.right, L = P + r.top + r.bottom, W = this.resolveContainerSize(o, s, B, L, a);
      c = W.width, d = W.height;
    }
    const u = {
      width: c - r.left - r.right,
      height: d - r.top - r.bottom
    }, f = n.map(
      (D) => this.measureChildSize(D, u)
    ), g = e + r.left, m = i + r.top, x = o.flexDirection ?? "row", y = o.justifyContent ?? "flex-start", w = o.alignItems ?? "flex-start";
    let C = o.gap ?? 0;
    const b = u.width, R = u.height, I = this.calculateContentSize(f, o), M = this.calculateContentHeight(f, o);
    let E = 0;
    if (x === "row" || x === "row-reverse") {
      if (E = this.calcMainOffset(
        b,
        I,
        y,
        f,
        n.length,
        C
      ), y === "space-between" && n.length > 1) {
        const D = f.reduce((k, P) => k + P.width, 0);
        C = (b - D) / (n.length - 1);
      } else if (y === "space-around" && n.length > 0) {
        const D = f.reduce((P, B) => P + B.width, 0), k = (b - D) / n.length;
        E = k / 2, C = k;
      } else if (y === "space-evenly" && n.length > 0) {
        const D = f.reduce((P, B) => P + B.width, 0), k = (b - D) / (n.length + 1);
        E = k, C = k;
      }
    } else if (E = this.calcMainOffset(
      R,
      M,
      y,
      f,
      n.length,
      C
    ), y === "space-between" && n.length > 1) {
      const D = f.reduce((k, P) => k + P.height, 0);
      C = (R - D) / (n.length - 1);
    } else if (y === "space-around" && n.length > 0) {
      const D = f.reduce((P, B) => P + B.height, 0), k = (R - D) / n.length;
      E = k / 2, C = k;
    } else if (y === "space-evenly" && n.length > 0) {
      const D = f.reduce((P, B) => P + B.height, 0), k = (R - D) / (n.length + 1);
      E = k, C = k;
    }
    let T = E;
    const H = [];
    for (let D = 0; D < n.length; D++) {
      const k = n[D], P = f[D], B = P.margin ?? { top: 0, right: 0, bottom: 0, left: 0 }, L = P.width - B.left - B.right, W = P.height - B.top - B.bottom, _ = k.props.alignSelf ?? w;
      let A = 0;
      x === "row" || x === "row-reverse" ? A = this.calcCrossOffset(R, W, _) : A = this.calcCrossOffset(b, L, _);
      let N, V;
      x === "row" ? (N = g + T + B.left, V = m + A + B.top) : x === "row-reverse" ? (N = g + b - T - P.width + B.left, V = m + A + B.top) : x === "column" ? (N = g + A + B.left, V = m + T + B.top) : (N = g + A + B.left, V = m + R - T - P.height + B.top), H.push(this.layoutNode(k, N, V, u)), T += (x === "row" || x === "row-reverse" ? P.width : P.height) + C;
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
      const n = t.props, a = e == null ? void 0 : e.width, r = e == null ? void 0 : e.height, l = this.resolveSize(n.width, a) ?? 100, h = this.resolveSize(n.height, r) ?? 100, c = this.resolveSize(n.minWidth, a), d = this.resolveSize(n.maxWidth, a), u = this.resolveSize(n.minHeight, r), f = this.resolveSize(n.maxHeight, r);
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
    const i = t.props, s = t.children || [], o = this.parsePadding(i.padding), n = e == null ? void 0 : e.width, a = e == null ? void 0 : e.height, r = this.resolveSize(i.width, n), l = this.resolveSize(i.height, a);
    let h, c;
    if (r !== void 0 && l !== void 0)
      h = r, c = l;
    else {
      const m = s.map((w) => this.measureChildSize(w)), x = this.calculateContentSize(m, i), y = this.calculateContentHeight(m, i);
      h = r ?? x + o.left + o.right, c = l ?? y + o.top + o.bottom;
    }
    const d = this.resolveSize(i.minWidth, n), u = this.resolveSize(i.maxWidth, n), f = this.resolveSize(i.minHeight, a), g = this.resolveSize(i.maxHeight, a);
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
    const s = i == null ? void 0 : i.width, o = i == null ? void 0 : i.height, n = this.resolveSize(e.minWidth, s), a = this.resolveSize(e.maxWidth, s), r = this.resolveSize(e.minHeight, o), l = this.resolveSize(e.maxHeight, o);
    return {
      x: t.x,
      y: t.y,
      width: this.clampValue(t.width, n, a),
      height: this.clampValue(t.height, r, l)
    };
  }
  calcMainOffset(t, e, i, s, o, n) {
    if (i === "center") return (t - e) / 2;
    if (i === "flex-end") return t - e;
    if (i === "space-between" && o > 1)
      return 0;
    if (i === "space-around" && o > 0) {
      const a = s.reduce((l, h) => l + h.width, 0);
      return (t - a) / o / 2;
    }
    if (i === "space-evenly" && o > 0) {
      const a = s.reduce((l, h) => l + h.width, 0);
      return (t - a) / (o + 1);
    }
    return 0;
  }
  calcCrossOffset(t, e, i) {
    return i === "center" ? (t - e) / 2 : i === "flex-end" ? t - e : 0;
  }
  calculateContentSize(t, e) {
    const i = e.gap ?? 0, s = e.flexDirection ?? "row";
    if (s === "row" || s === "row-reverse") {
      const o = t.reduce((a, r) => a + r.width, 0), n = t.length > 1 ? (t.length - 1) * i : 0;
      return o + n;
    } else
      return Math.max(...t.map((o) => o.width), 0);
  }
  calculateContentHeight(t, e) {
    const i = e.gap ?? 0, s = e.flexDirection ?? "row";
    if (s === "column" || s === "column-reverse") {
      const o = t.reduce((a, r) => a + r.height, 0), n = t.length > 1 ? (t.length - 1) * i : 0;
      return o + n;
    } else
      return Math.max(...t.map((o) => o.height), 0);
  }
  layoutChildren(t, e, i, s, o, n, a, r) {
    const l = o.flexDirection ?? "row", h = o.justifyContent ?? "flex-start", c = o.alignItems ?? "flex-start";
    let d = o.gap ?? 0;
    const u = this.calculateContentSize(e, o), f = this.calculateContentHeight(e, o), g = r.width, m = r.height;
    let x = 0;
    if (l === "row" || l === "row-reverse") {
      if (x = this.calcMainOffset(
        g,
        u,
        h,
        e,
        t.length,
        d
      ), h === "space-between" && t.length > 1) {
        const w = e.reduce((C, b) => C + b.width, 0);
        d = (g - w) / (t.length - 1);
      }
      if (h === "space-around" && t.length > 0) {
        const w = e.reduce((b, R) => b + R.width, 0), C = (g - w) / t.length;
        x = C / 2, d = C;
      }
      if (h === "space-evenly" && t.length > 0) {
        const w = e.reduce((b, R) => b + R.width, 0), C = (g - w) / (t.length + 1);
        x = C, d = C;
      }
    } else {
      if (x = this.calcMainOffset(
        m,
        f,
        h,
        e,
        t.length,
        d
      ), h === "space-between" && t.length > 1) {
        const w = e.reduce((C, b) => C + b.height, 0);
        d = (m - w) / (t.length - 1);
      }
      if (h === "space-around" && t.length > 0) {
        const w = e.reduce((b, R) => b + R.height, 0), C = (m - w) / t.length;
        x = C / 2, d = C;
      }
      if (h === "space-evenly" && t.length > 0) {
        const w = e.reduce((b, R) => b + R.height, 0), C = (m - w) / (t.length + 1);
        x = C, d = C;
      }
    }
    let y = x;
    for (let w = 0; w < t.length; w++) {
      const C = t[w], b = e[w], R = b.margin ?? { top: 0, right: 0, bottom: 0, left: 0 }, I = b.width - R.left - R.right, M = b.height - R.top - R.bottom, E = C.props.alignSelf ?? c;
      let T = 0;
      l === "row" || l === "row-reverse" ? T = this.calcCrossOffset(m, M, E) : T = this.calcCrossOffset(g, I, E);
      let H, D;
      l === "row" ? (H = i + y + R.left, D = s + T + R.top) : l === "row-reverse" ? (H = i + g - y - b.width + R.left, D = s + T + R.top) : l === "column" ? (H = i + T + R.left, D = s + y + R.top) : (H = i + T + R.left, D = s + m - y - b.height + R.top), this.layoutElement(C, H, D, r), y += (l === "row" || l === "row-reverse" ? b.width : b.height) + d;
    }
  }
}
class Ti {
  constructor(t) {
    v(this, "ctx");
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
    const e = t.props, i = e.fontSize ?? 14, s = e.fontFamily ?? "Arial", o = e.lineHeight ?? i, n = e.fontWeight ?? "normal", a = e.fontStyle ?? "normal", r = e.letterSpacing ?? 0;
    let l = this.measureTextWidth(e.text, i, s, n, a);
    return r > 0 && e.text.length > 1 && (l += r * (e.text.length - 1)), e.maxWidth && l > e.maxWidth && (l = e.maxWidth), { x: 0, y: 0, width: l, height: o };
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
    const i = e.points.map((l) => l.x), s = e.points.map((l) => l.y), o = Math.min(...i), n = Math.max(...i), a = Math.min(...s), r = Math.max(...s);
    return { x: o, y: a, width: n - o, height: r - a };
  }
}
class Di {
  constructor(t, e, i) {
    v(this, "ctx");
    v(this, "layoutEngine");
    v(this, "theme");
    v(this, "layouts", []);
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
      const a = (o.angle - 90) * Math.PI / 180, r = t + i / 2, l = e + s / 2, h = Math.max(i, s), c = r - Math.cos(a) * h / 2, d = l - Math.sin(a) * h / 2, u = r + Math.cos(a) * h / 2, f = l + Math.sin(a) * h / 2, g = this.ctx.createLinearGradient(c, d, u, f);
      return o.colors.forEach((m, x) => {
        g.addColorStop(x / (o.colors.length - 1), m);
      }), g;
    } else {
      const n = t + i / 2, a = e + s / 2, r = Math.max(i, s) / 2, l = this.ctx.createRadialGradient(n, a, 0, n, a, r);
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
    const e = t.element, i = t.x, s = t.y, o = e.props, n = t.width, a = t.height, r = o.borderRadius ?? 0, l = this.getBorderRadiusArray(o, r), h = o.opacity !== void 0;
    h && (this.ctx.save(), this.ctx.globalAlpha = o.opacity);
    try {
      const c = !!o.boxShadow;
      if (c) {
        const x = this.normalizeShadow(o.boxShadow);
        this.ctx.save(), this.ctx.shadowColor = x.color, this.ctx.shadowBlur = x.blur, this.ctx.shadowOffsetX = x.offsetX, this.ctx.shadowOffsetY = x.offsetY, o.backgroundColor || o.backgroundGradient || (this.drawRoundedRect(
          i + (x.spread ?? 0),
          s + (x.spread ?? 0),
          n + (x.spread ?? 0) * 2,
          a + (x.spread ?? 0) * 2,
          l
        ), this.ctx.fillStyle = x.color, this.ctx.fill());
      }
      try {
        o.backgroundGradient ? (this.ctx.fillStyle = this.createGradientFill(
          i,
          s,
          n,
          a,
          o.backgroundGradient
        ), this.drawRoundedRect(i, s, n, a, l), this.ctx.fill()) : o.backgroundColor && (this.ctx.fillStyle = o.backgroundColor, this.drawRoundedRect(i, s, n, a, l), this.ctx.fill());
      } finally {
        c && this.ctx.restore();
      }
      o.borderColor && o.borderWidth && (this.ctx.strokeStyle = o.borderColor, this.ctx.lineWidth = o.borderWidth, this.drawRoundedRect(i, s, n, a, l), this.ctx.stroke());
      const d = this.normalizeBorderSide(o.borderTop), u = this.normalizeBorderSide(o.borderRight), f = this.normalizeBorderSide(o.borderBottom), g = this.normalizeBorderSide(o.borderLeft);
      (d || u || f || g) && (d && (this.ctx.strokeStyle = d.color, this.ctx.lineWidth = d.width, this.ctx.beginPath(), this.ctx.moveTo(i, s), this.ctx.lineTo(i + n, s), this.ctx.stroke()), f && (this.ctx.strokeStyle = f.color, this.ctx.lineWidth = f.width, this.ctx.beginPath(), this.ctx.moveTo(i, s + a), this.ctx.lineTo(i + n, s + a), this.ctx.stroke()), g && (this.ctx.strokeStyle = g.color, this.ctx.lineWidth = g.width, this.ctx.beginPath(), this.ctx.moveTo(i, s), this.ctx.lineTo(i, s + a), this.ctx.stroke()), u && (this.ctx.strokeStyle = u.color, this.ctx.lineWidth = u.width, this.ctx.beginPath(), this.ctx.moveTo(i + n, s), this.ctx.lineTo(i + n, s + a), this.ctx.stroke()));
      const m = o.overflow === "hidden" || o.overflow === "clip";
      m && (this.ctx.save(), this.drawRoundedRect(i, s, n, a, l), this.ctx.clip());
      try {
        for (const x of t.children)
          this.renderLayoutNode(x);
      } finally {
        m && this.ctx.restore();
      }
    } finally {
      h && this.ctx.restore();
    }
  }
  normalizeShadow(t) {
    if (typeof t == "string") {
      const e = t.trim().split(/\s+/), i = Number(e[0]) || 0, s = Number(e[1]) || 0, o = Number(e[2]) || 0, n = e.filter((l) => !isNaN(Number(l))), a = n.length > 3 ? Number(e[3]) : 0, r = e.slice(n.length > 3 ? 4 : 3).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX: i, offsetY: s, blur: o, spread: a, color: r };
    }
    return t;
  }
  renderCircle(t, e, i) {
    const s = t.props, o = e + s.radius, n = i + s.radius, a = s.startAngle ?? 0, r = s.endAngle ?? Math.PI * 2;
    this.ctx.beginPath(), this.ctx.arc(o, n, s.radius, a, r, !1), s.backgroundColor && (this.ctx.fillStyle = s.backgroundColor, this.ctx.fill()), s.borderColor && s.borderWidth && (this.ctx.strokeStyle = s.borderColor, this.ctx.lineWidth = s.borderWidth, this.ctx.stroke());
  }
  renderText(t, e, i, s) {
    const o = t.props, n = o.fontSize ?? this.theme.font.size, a = o.fontFamily ?? this.theme.font.family, r = o.fontWeight ?? "normal", l = o.fontStyle ?? "normal", h = o.color ?? this.theme.colors.cellText, c = o.lineHeight ?? n, d = o.textAlign ?? "left", u = o.textDecoration ?? "none", f = o.letterSpacing ?? 0;
    this.ctx.font = `${l} ${r} ${n}px ${a}`, this.ctx.fillStyle = h;
    let g = e;
    d === "center" ? (g = e + s / 2, this.ctx.textAlign = "center") : d === "right" ? (g = e + s, this.ctx.textAlign = "right") : this.ctx.textAlign = "left", this.ctx.textBaseline = "middle";
    const m = i + c / 2;
    if (f > 0) {
      this.ctx.textAlign = "left";
      let x = d === "center" ? e + (s - this.getTextWidthWithSpacing(
        o.text,
        n,
        a,
        r,
        l,
        f
      )) / 2 : d === "right" ? e + s - this.getTextWidthWithSpacing(
        o.text,
        n,
        a,
        r,
        l,
        f
      ) : e;
      for (let y = 0; y < o.text.length; y++) {
        const w = o.text[y];
        o.maxWidth ? this.ctx.fillText(w, x, m, o.maxWidth) : this.ctx.fillText(w, x, m);
        const C = this.measureCharWidth(w, n, a, r, l);
        x += C + f;
      }
    } else
      o.maxWidth ? this.ctx.fillText(o.text, g, m, o.maxWidth) : this.ctx.fillText(o.text, g, m);
    if (u === "underline") {
      const x = f > 0 ? this.getTextWidthWithSpacing(
        o.text,
        n,
        a,
        r,
        l,
        f
      ) : this.ctx.measureText(o.text).width, y = m + n / 2 + 1, w = d === "center" ? g - x / 2 : d === "right" ? g - x : g;
      this.ctx.strokeStyle = h, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(w, y), this.ctx.lineTo(w + x, y), this.ctx.stroke();
    } else if (u === "line-through") {
      const x = f > 0 ? this.getTextWidthWithSpacing(
        o.text,
        n,
        a,
        r,
        l,
        f
      ) : this.ctx.measureText(o.text).width, y = m, w = d === "center" ? g - x / 2 : d === "right" ? g - x : g;
      this.ctx.strokeStyle = h, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(w, y), this.ctx.lineTo(w + x, y), this.ctx.stroke();
    }
    this.ctx.textAlign = "left", this.ctx.textBaseline = "alphabetic";
  }
  measureCharWidth(t, e, i, s, o) {
    return this.ctx.font = `${o} ${s} ${e}px ${i}`, this.ctx.measureText(t).width;
  }
  getTextWidthWithSpacing(t, e, i, s, o, n) {
    this.ctx.font = `${o} ${s} ${e}px ${i}`;
    let a = 0;
    for (let r = 0; r < t.length; r++)
      a += this.ctx.measureText(t[r]).width, r < t.length - 1 && (a += n);
    return a;
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
function Hi(p) {
  return p ? typeof p == "string" ? { borderWidth: 1, borderColor: p } : {
    borderWidth: p.width,
    borderColor: p.color
  } : {};
}
function Rt(p) {
  if (p)
    return typeof p == "string" ? { width: 1, color: p } : p;
}
function ki(p) {
  if (p) {
    if (typeof p == "string") {
      const t = p.trim().split(/\s+/), e = Number(t[0]) || 0, i = Number(t[1]) || 0, s = Number(t[2]) || 0, o = Number(t[3]) || 0, n = t.length > 5 || t[3] && !isNaN(Number(t[3])) ? 4 : 3, a = t.slice(n).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX: e, offsetY: i, blur: s, spread: o, color: a };
    }
    return p;
  }
}
function Oi(p) {
  const t = Hi(p.border), e = Rt(p.borderTop), i = Rt(p.borderRight), s = Rt(p.borderBottom), o = Rt(p.borderLeft), n = ki(p.shadow ?? p.boxShadow);
  return {
    id: p.id,
    styles: p.styles,
    display: p.position === "relative" ? void 0 : "flex",
    position: p.position,
    x: p.x,
    y: p.y,
    zIndex: p.zIndex,
    width: p.width,
    height: p.height,
    minWidth: p.minW ?? p.minWidth,
    maxWidth: p.maxW ?? p.maxWidth,
    minHeight: p.minH ?? p.minHeight,
    maxHeight: p.maxH ?? p.maxHeight,
    padding: p.padding,
    margin: p.mg ?? p.margin,
    gap: p.gap,
    flexDirection: p.direction ?? p.flexDirection ?? "row",
    justifyContent: p.justify ?? p.justifyContent,
    alignItems: p.align ?? p.alignItems,
    alignSelf: p.selfAlign ?? p.alignSelf,
    backgroundColor: p.bgColor ?? p.backgroundColor,
    backgroundGradient: p.gradient ?? p.backgroundGradient,
    borderRadius: p.radius ?? p.borderRadius,
    borderTopLeftRadius: p.borderTLR ?? p.borderTopLeftRadius,
    borderTopRightRadius: p.borderTRR ?? p.borderTopRightRadius,
    borderBottomLeftRadius: p.borderBLR ?? p.borderBottomLeftRadius,
    borderBottomRightRadius: p.borderBRR ?? p.borderBottomRightRadius,
    borderWidth: p.borderWidth ?? t.borderWidth,
    borderColor: p.borderColor ?? t.borderColor,
    borderTop: e,
    borderRight: i,
    borderBottom: s,
    borderLeft: o,
    opacity: p.opacity,
    overflow: p.clip ? "hidden" : p.overflow,
    boxShadow: n
  };
}
function Pi(p) {
  return p.text !== void 0 ? p.text : (p.children ?? []).map((t) => String(t.props.text ?? "")).join("");
}
function Xt(p) {
  return {
    type: "CTBox",
    props: Oi(p),
    children: p.children ?? []
  };
}
function fs(p) {
  return Xt({ ...p, direction: "row" });
}
function gs(p) {
  return Xt({ ...p, direction: "column" });
}
const ms = Xt;
function ps(p) {
  const { children: t, text: e, ...i } = p;
  return {
    type: "CTText",
    props: {
      ...i,
      text: Pi(p)
    },
    children: []
  };
}
function xs(p) {
  const { children: t, bgColor: e, ...i } = p;
  return {
    type: "CTCircle",
    props: {
      ...i,
      backgroundColor: e ?? i.backgroundColor
    },
    children: []
  };
}
function ws(p) {
  const { children: t, ...e } = p;
  return {
    type: "CTImage",
    props: e,
    children: []
  };
}
function ys(p) {
  const { children: t, ...e } = p;
  return {
    type: "CTLine",
    props: e,
    children: []
  };
}
const xt = class xt {
  constructor(t, e, i, s = ht) {
    v(this, "canvas");
    v(this, "ctx");
    v(this, "theme");
    v(this, "layoutManager");
    v(this, "locale");
    v(this, "dpr");
    v(this, "offscreenCanvas");
    v(this, "offscreenCtx");
    v(this, "cellRendererRegistry");
    v(this, "dropdownRenderer");
    v(this, "filterDropdownRenderer");
    v(this, "imageOverlayRenderer");
    v(this, "overlayRenderer");
    v(this, "dirtyRegions", []);
    v(this, "watermarkConfig", null);
    v(this, "expandColumnKey", null);
    v(this, "currentSwitchAnimations");
    v(this, "currentButtonHoverStates");
    v(this, "hoveredPlaceholderColumnIndex", -1);
    v(this, "isDestroyed", !1);
    // 多选列分隔符
    v(this, "multipleSelectSeparator", ", ");
    // 图片加载队列（延迟加载 + 请求取消）
    v(this, "imageLoadQueue");
    // 图片渲染器使用的运行时桥接
    v(this, "imageRuntime");
    // 图片单元格的快路径：缓存渲染器与可复用 context，
    // 避免在滚动热路径上每个单元格都分配 options/context 对象。
    v(this, "imageRenderer");
    v(this, "imageRenderContext");
    /** 当前帧收集的可见图片 URL */
    v(this, "frameVisibleUrls", /* @__PURE__ */ new Set());
    // 文本宽度缓存（用于按钮等需要测量文本宽度的场景）
    v(this, "textWidthCache", /* @__PURE__ */ new Map());
    v(this, "textWidthCacheKey", "");
    // 性能监控
    v(this, "performanceEnabled", !1);
    v(this, "performanceStats", /* @__PURE__ */ new Map());
    v(this, "frameStartTime", 0);
    v(this, "frameCount", 0);
    v(this, "lastReportTime", 0);
    // 当前帧统计
    v(this, "currentFrameStats", /* @__PURE__ */ new Map());
    // 上一帧统计（用于报告）
    v(this, "lastFrameStats", /* @__PURE__ */ new Map());
    // 懒加载相关
    v(this, "currentVisibleRange", null);
    v(this, "currentRows", []);
    v(this, "currentScrollTop", 0);
    v(this, "rowHeight", 0);
    v(this, "currentHoveredCell", null);
    v(this, "currentHoveredImageIndex", -1);
    v(this, "currentHoveredButtonIndex", -1);
    v(this, "currentProgressDragState");
    v(this, "currentRowResizeState");
    v(this, "currentValidationErrors", /* @__PURE__ */ new Map());
    v(this, "currentPendingValidations", /* @__PURE__ */ new Set());
    // 渲染缓存相关
    v(this, "renderCache", null);
    v(this, "rowIdManager", new Ke());
    v(this, "columnIdManager", new je());
    // 图片加载完成后的渲染触发回调
    v(this, "onImageLoaded", null);
    this.canvas = t, this.ctx = this.getContext(t), this.theme = e, this.layoutManager = i, this.locale = s, this.dpr = It(), this.offscreenCanvas = document.createElement("canvas"), this.offscreenCtx = this.getContext(this.offscreenCanvas), this.cellRendererRegistry = new Ei(s), this.dropdownRenderer = new ii(
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
    ), this.imageLoadQueue = new ee(), this.imageRuntime = {
      get: (o, n) => this.imageLoadQueue.get(o, n),
      isLoading: (o) => this.imageLoadQueue.isLoading(o),
      isFailed: (o) => this.imageLoadQueue.isFailed(o),
      load: (o, n) => this.loadImage(o, n),
      collectVisible: (o) => this.collectVisibleImage(o),
      isInLazyLoadRange: (o, n) => this.isInLazyLoadRange(o, n)
    }, this.imageRenderer = this.cellRendererRegistry.get("image"), this.imageRenderContext = {
      ctx: this.ctx,
      theme: this.theme,
      locale: this.locale,
      layoutManager: this.layoutManager,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      column: xt.SHARED_PLACEHOLDER_COLUMN,
      row: xt.SHARED_PLACEHOLDER_ROW,
      rowIndex: -1,
      colIndex: -1,
      value: void 0,
      isDisabled: !1,
      isHovered: !1,
      isSelected: !1,
      dpr: this.dpr,
      hoveredImageIndex: -1,
      imageRuntime: this.imageRuntime
    };
  }
  // 当前字体配置的 key
  // 动态行高支持
  /**
   * 根据单元格高度计算可显示行数
   */
  calculateMaxRows(t, e, i = 8) {
    return Ot(t, e, i);
  }
  /**
   * 多行文本换行
   */
  wrapTextToLines(t, e, i) {
    return Pt(this.ctx, t, e, i).lines;
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
    this.imageLoadQueue = new ee({
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
    const i = It();
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
    var b, R, I;
    this.currentSwitchAnimations = n.switchAnimations, this.currentButtonHoverStates = n.buttonHoverStates, this.currentHoveredCell = n.hoveredCell, this.currentHoveredImageIndex = n.hoveredImageIndex ?? -1, this.currentHoveredButtonIndex = n.hoveredButtonIndex ?? -1, this.currentProgressDragState = n.progressDragState, this.currentRowResizeState = n.rowResizeState, this.currentValidationErrors = n.validationErrors ?? /* @__PURE__ */ new Map(), this.currentPendingValidations = n.pendingValidations ?? /* @__PURE__ */ new Set(), this.beginFrame(), this.currentVisibleRange = i, this.currentRows = e, this.currentScrollTop = o, this.rowHeight = this.theme.row.height;
    const { startRow: a, endRow: r } = i, l = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, l, h);
    const c = this.layoutManager.getLeafColumns(), d = this.layoutManager.getFixedColumnsInfo(t), u = d.leftFixed.columns.length > 0, f = d.rightFixed.columns.length > 0;
    this.hoveredPlaceholderColumnIndex = n.hoveredCell && ((b = c[n.hoveredCell.columnIndex]) != null && b.key.startsWith("__hidden_placeholder__")) ? n.hoveredCell.columnIndex : -1;
    const g = u ? d.leftFixed.width : 0, m = l - (f ? d.rightFixed.width : 0), x = this.layoutManager.getVisibleCenterColumnIndices(), y = [], w = [];
    for (let M = 0; M < c.length; M++) {
      const E = c[M];
      E && (E.fixed === "left" && y.push(M), E.fixed === "right" && w.push(M));
    }
    const C = this.shouldRenderRowBands();
    this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(g, 0, m - g, h), this.ctx.clip(), C ? this.renderRowBands(
      e,
      x,
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
      a,
      r,
      x,
      s,
      o,
      {
        ...n,
        dragColumnIndex: (R = n.columnReorderState) == null ? void 0 : R.dragColumnIndex,
        columnReorderState: n.columnReorderState
      }
    ), this.ctx.restore(), this.renderCenterSelections(n.selectedCells, s, o, x), n.showHeader && this.renderCenterHeader(
      t,
      x,
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
  renderRowBandCells(t, e, i, s, o, n, a, r) {
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
      const x = this.canvas.height / this.dpr;
      if (l + m < 0 || l > x) {
        l += m;
        continue;
      }
      let y = this.theme.colors.rowBackground;
      a.stripeRows && g % 2 === 1 && (y = this.theme.colors.rowAltBackground), f.selected && (y = this.theme.colors.rowSelectedBackground), ((d = a.hoveredCell) == null ? void 0 : d.rowIndex) === g && (y = this.theme.colors.rowHoverBackground);
      for (const w of i) {
        const C = this.layoutManager.getLeafColumn(w);
        if (!C) continue;
        const b = this.layoutManager.getColumnWidthByIndex(w), R = r !== void 0 ? r + this.layoutManager.getColumnOffset(w) - this.layoutManager.getColumnOffset(i[0]) : this.layoutManager.getColumnOffset(w) - s;
        this.ctx.fillStyle = y, this.ctx.fillRect(R, l, b, m), this.renderCellWithPosition(
          C,
          f,
          g,
          w,
          f.data[Y(C)],
          R,
          l,
          b,
          m,
          a
        );
      }
      l += m;
    }
  }
  renderRowBands(t, e, i, s, o, n, a, r, l) {
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
      a,
      l
    ), this.ctx.restore();
    for (const u of c)
      this.renderRowBandCells(
        u,
        t,
        e,
        o,
        n,
        a,
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
        a,
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
          a,
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
        a,
        l,
        u - r.rightFixed.width
      ), this.ctx.restore();
      for (const f of c)
        this.renderRowBandCells(
          f,
          t,
          s,
          o,
          n,
          a,
          l,
          u - r.rightFixed.width
        );
      for (const f of d)
        this.renderSummaryBandCells(
          f,
          s,
          o,
          u - r.rightFixed.width
        );
    }
  }
  renderSummaryBandCells(t, e, i, s) {
    var a, r, l;
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
            this.ctx.fillStyle = ((a = d.renderResult.style) == null ? void 0 : a.backgroundColor) ?? this.theme.colors.headerBackground, this.ctx.fillRect(m, o, y, c), g.start <= d.startColumnIndex && d.startColumnIndex <= g.end && this.renderCellContent(
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
            ), this.ctx.strokeStyle = ((r = d.renderResult.style) == null ? void 0 : r.borderColor) ?? this.theme.colors.cellBorder, this.ctx.lineWidth = ((l = d.renderResult.style) == null ? void 0 : l.borderWidth) ?? this.theme.border.width, this.ctx.strokeRect(m, o, y, c);
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
  renderCenterHeader(t, e, i, s, o, n, a, r, l) {
    const c = this.layoutManager.getLayoutInfo().headerHeight, d = this.layoutManager.getVisibleHeaderCells();
    let u = 0, f = 0;
    for (const g of e) {
      if (!this.layoutManager.getLeafColumn(g)) continue;
      const x = this.layoutManager.getColumnOffset(g), y = this.layoutManager.getColumnWidthByIndex(g);
      f === 0 && (u = x - n), f += y;
    }
    this.ctx.save(), f > 0 && (this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(u, 0, f, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(u, c), this.ctx.lineTo(u + f, c), this.ctx.stroke());
    for (const g of d) {
      if (g.column.fixed === "left" || g.column.fixed === "right")
        continue;
      const x = this.layoutManager.getLeafColumns().findIndex((b) => b === g.column), y = e.indexOf(x);
      let w = g.x - n;
      if (y !== -1) {
        let b = 0;
        for (let I = 0; I < y; I++) {
          const M = e[I];
          M !== void 0 && (b += this.layoutManager.getColumnWidthByIndex(M));
        }
        w = this.layoutManager.getColumnOffset(e[0]) - n + b;
      }
      const C = g.column.key === a;
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
        x
      );
    }
    this.endFrame(), this.ctx.restore();
  }
  renderHeaderCellMultiLevel(t, e, i, s, o, n, a, r, l, h = !1, c = !1, d = -1) {
    var P, B;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const L = this.hoveredPlaceholderColumnIndex === d;
      this.ctx.fillStyle = L ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
      return;
    }
    const u = 8, g = t.reorderable !== !1 && h, m = g ? 10 : 0;
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const x = r.find((L) => L.column === t.key), y = (x == null ? void 0 : x.direction) ?? "none", w = t.sortable !== !1, C = !((P = t.children) != null && P.length) && w && (y !== "none" || h), b = C ? 20 : 0, R = l.some((L) => L.column === t.key), I = !((B = t.children) != null && B.length) && t.filterable && (R || h), M = I ? 20 : 0, E = s - u * 2 - b - M - m - (g ? 4 : 0), T = mt(t.title, Math.floor(E / 7)), H = t.align ?? "center";
    let D = e + u + m + (g ? 4 : 0);
    H === "center" ? (D = e + (s - this.ctx.measureText(T).width - b - M) / 2, g && (D = Math.max(D, e + u + m + 4))) : H === "right" && (D = e + s - u - this.ctx.measureText(T).width - b - M);
    const k = i + o / 2;
    if (this.ctx.fillText(T, D, k), g && this.renderDragHandle(e + u, i + o / 2), I) {
      const L = e + s - u - 10;
      C && this.renderSortIndicator(
        L - 16,
        k,
        y === "none" ? "hover" : y
      ), this.renderFilterIndicator(L, k, R);
    } else C && this.renderSortIndicator(
      e + s - u - 10,
      k,
      y === "none" ? "hover" : y
    );
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
  }
  renderCenterRows(t, e, i, s, o, n, a, r) {
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
        a,
        r,
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
      a,
      r,
      /* @__PURE__ */ new Set()
    );
  }
  renderCenterRow(t, e, i, s, o, n, a, r, l) {
    var x, y;
    const h = this.layoutManager.getRowOffset(s), c = this.getRenderedRowHeight(s), d = h - a, u = this.layoutManager.getLeafColumns();
    let f = this.theme.colors.rowBackground;
    r.stripeRows && s % 2 === 1 && (f = this.theme.colors.rowAltBackground), i.selected && (f = this.theme.colors.rowSelectedBackground), ((x = r.hoveredCell) == null ? void 0 : x.rowIndex) === s && (f = this.theme.colors.rowHoverBackground);
    for (const w of o) {
      if (this.layoutManager.isCellMerged(s, w) || !u[w]) continue;
      const b = o.indexOf(w);
      let R;
      if (b !== -1) {
        let M = 0;
        for (let T = 0; T < b; T++) {
          const H = o[T];
          H !== void 0 && (M += this.layoutManager.getColumnWidthByIndex(H));
        }
        R = this.layoutManager.getColumnOffset(o[0]) - n + M;
      } else
        R = this.layoutManager.getColumnOffset(w) - n;
      const I = this.layoutManager.getColumnWidthByIndex(w);
      this.ctx.fillStyle = f, this.ctx.fillRect(R, d, I, c);
    }
    const m = this.layoutManager.getMergesAffectingRow(s);
    for (const w of m) {
      if (!o.includes(w.columnIndex)) continue;
      const C = `${w.rowIndex}-${w.columnIndex}`;
      if (l.has(C)) continue;
      const b = e[w.rowIndex];
      if (!b) continue;
      const R = this.layoutManager.getMergedCellPosition(w.rowIndex, w.columnIndex);
      if (!R) continue;
      const I = u[w.columnIndex];
      if (!I) continue;
      const M = b.data[Y(I)], T = ((y = r.hoveredCell) == null ? void 0 : y.rowIndex) !== void 0 && r.hoveredCell.rowIndex >= w.rowIndex && r.hoveredCell.rowIndex < w.rowIndex + w.rowspan ? this.theme.colors.rowHoverBackground : f, H = R.x - n, D = R.y - a;
      this.ctx.fillStyle = T, this.ctx.fillRect(H, D, R.width, R.height), this.renderCellWithPosition(
        I,
        b,
        w.rowIndex,
        w.columnIndex,
        M,
        H,
        D,
        R.width,
        R.height,
        r
      ), l.add(C);
    }
    for (const w of o) {
      const C = u[w];
      if (!C || this.layoutManager.isCellMerged(s, w) || this.layoutManager.getCellMerge(s, w))
        continue;
      const R = i.data[Y(C)], I = o.indexOf(w);
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
      const E = this.layoutManager.getColumnWidthByIndex(w), H = this.layoutManager.getRowOffset(s) - a, D = this.getRenderedRowHeight(s);
      this.renderCellWithPosition(
        C,
        i,
        s,
        w,
        R,
        M,
        H,
        E,
        D,
        r
      );
    }
  }
  renderFixedColumnsContent(t, e, i, s, o, n, a) {
    var g, m, x;
    const r = this.canvas.height / this.dpr;
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
      const C = this.layoutManager.getRowOffset(y), b = this.getRenderedRowHeight(y), R = C - o;
      if (C + b < o || C > o + r)
        continue;
      let I = this.theme.colors.rowBackground;
      a.stripeRows && y % 2 === 1 && (I = this.theme.colors.rowAltBackground), w.selected && (I = this.theme.colors.rowSelectedBackground), ((m = a.hoveredCell) == null ? void 0 : m.rowIndex) === y && (I = this.theme.colors.rowHoverBackground);
      for (const D of i) {
        if (this.layoutManager.isCellMerged(y, D))
          continue;
        const k = this.layoutManager.getColumnWidthByIndex(D), P = s + this.layoutManager.getColumnOffset(D) - this.layoutManager.getColumnOffset(i[0]);
        this.ctx.fillStyle = I, this.ctx.fillRect(P, R, k, b);
      }
      const E = this.layoutManager.getMergesAffectingRow(y), T = this.layoutManager.getLeafColumns();
      for (const D of E) {
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
        const W = P.data[Y(L)];
        let _ = 0;
        const A = s + this.layoutManager.getColumnOffset(D.columnIndex) - this.layoutManager.getColumnOffset(i[0]);
        for (let X = 0; X < D.colspan; X++) {
          const $ = D.columnIndex + X;
          i.includes($) && (_ += this.layoutManager.getColumnWidthByIndex($));
        }
        const V = ((x = a.hoveredCell) == null ? void 0 : x.rowIndex) !== void 0 && a.hoveredCell.rowIndex >= D.rowIndex && a.hoveredCell.rowIndex < D.rowIndex + D.rowspan ? this.theme.colors.rowHoverBackground : I, z = B.y - o;
        this.ctx.fillStyle = V, this.ctx.fillRect(A, z, _, B.height), this.renderCellWithPosition(
          L,
          P,
          D.rowIndex,
          D.columnIndex,
          W,
          A,
          z,
          _,
          B.height,
          a
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
        const B = this.layoutManager.getColumnWidthByIndex(D), L = w.data[Y(k)];
        this.renderCellWithPosition(
          k,
          w,
          y,
          D,
          L,
          H,
          R,
          B,
          b,
          a
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
      a
    ), this.ctx.restore();
  }
  renderFixedRowOverlay(t, e, i, s, o, n, a) {
    var g;
    const r = this.layoutManager.getRowOffset(i), l = this.getRenderedRowHeight(i), h = r - n, c = this.canvas.height / this.dpr, d = this.layoutManager.getLeafColumns();
    if (r + l < n || r > n + c)
      return;
    let u = this.theme.colors.rowBackground;
    a.stripeRows && i % 2 === 1 && (u = this.theme.colors.rowAltBackground), e.selected && (u = this.theme.colors.rowSelectedBackground), ((g = a.hoveredCell) == null ? void 0 : g.rowIndex) === i && (u = this.theme.colors.rowHoverBackground);
    let f = o;
    for (const m of s) {
      const x = this.layoutManager.getColumnWidthByIndex(m), y = d[m];
      if (!y) {
        f += x;
        continue;
      }
      if (this.layoutManager.isCellMerged(i, m)) {
        f += x;
        continue;
      }
      const w = this.layoutManager.getCellMerge(i, m);
      if (w && (w.rowIndex !== i || w.columnIndex !== m)) {
        f += x;
        continue;
      }
      this.ctx.fillStyle = u, this.ctx.fillRect(f, h, x, l);
      const C = e.data[Y(y)];
      this.renderCellWithPosition(
        y,
        e,
        i,
        m,
        C,
        f,
        h,
        x,
        l,
        a
      ), f += x;
    }
  }
  renderFixedColumnsHeader(t, e, i, s, o, n, a) {
    var f;
    const r = this.layoutManager.getLayoutInfo(), l = r.headerHeight, h = this.layoutManager.getHeaderCells();
    this.ctx.save();
    let c = 0;
    for (const g of e)
      c += this.layoutManager.getColumnWidthByIndex(g);
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(i, 0, c, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(i, l), this.ctx.lineTo(i + c, l), this.ctx.stroke();
    const u = e.length > 0 && ((f = this.layoutManager.getLeafColumn(e[0])) == null ? void 0 : f.fixed) === "right" ? i - (r.totalWidth - c) : 0;
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
    const a = this.layoutManager.getLayoutInfo(), r = a.headerHeight, l = this.layoutManager.getLeafColumns();
    this.ctx.save(), this.ctx.translate(0, s), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, a.totalWidth, r), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, r), this.ctx.lineTo(a.totalWidth, r), this.ctx.stroke();
    for (let h = e; h <= i; h++) {
      const c = l[h];
      if (!c) continue;
      const { x: d, width: u } = this.layoutManager.getCellPosition(0, h);
      this.renderHeaderCell(c, d, 0, u, r, h, o);
    }
    this.ctx.restore();
  }
  renderHeaderCell(t, e, i, s, o, n, a) {
    if (t.key.startsWith("__hidden_placeholder__")) {
      const x = this.hoveredPlaceholderColumnIndex === n;
      this.ctx.fillStyle = x ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
      return;
    }
    const r = 8, l = 0;
    this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const h = a.find((x) => x.column === t.key), c = (h == null ? void 0 : h.direction) ?? "none", d = c !== "none" ? 20 : 0, u = s - r * 2 - d - l - 0, f = mt(t.title, Math.floor(u / 7)), g = t.align ?? "left";
    let m = e + r + l + 0;
    g === "center" ? m = e + (s - this.ctx.measureText(f).width - d) / 2 : g === "right" && (m = e + s - r - this.ctx.measureText(f).width - d), this.ctx.fillText(f, m, i + o / 2), c !== "none" && this.renderSortIndicator(e + s - r - 10, i + o / 2, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
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
    const a = this.theme.colors.indicator.active, r = this.theme.colors.indicator.inactive;
    this.ctx.beginPath(), this.ctx.moveTo(t - 8 / 2, e - 2), this.ctx.lineTo(t + 8 / 2, e - 2), this.ctx.lineTo(t, e - 2 - 5), this.ctx.closePath(), this.ctx.fillStyle = i === "asc" ? a : r, this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(t - 8 / 2, e + 2), this.ctx.lineTo(t + 8 / 2, e + 2), this.ctx.lineTo(t, e + 2 + 5), this.ctx.closePath(), this.ctx.fillStyle = i === "desc" ? a : r, this.ctx.fill();
  }
  renderFilterIndicator(t, e, i) {
    const o = this.theme.colors.indicator.active, n = this.theme.colors.indicator.inactive;
    this.ctx.fillStyle = i ? o : n, this.ctx.beginPath(), this.ctx.moveTo(t - 10 / 2, e - 10 / 2), this.ctx.lineTo(t + 10 / 2, e - 10 / 2), this.ctx.lineTo(t, e), this.ctx.closePath(), this.ctx.fill(), this.ctx.fillRect(t - 1, e, 2, 10 / 2);
  }
  renderRows(t, e, i, s, o, n, a) {
    for (let r = i; r <= s; r++) {
      const l = e[r];
      l && this.renderRow(t, l, r, o, n, a);
    }
  }
  renderRow(t, e, i, s, o, n) {
    var u;
    const a = this.layoutManager.getLayoutInfo(), { x: r, y: l, height: h } = this.layoutManager.getCellPosition(i, 0), c = a.totalWidth;
    let d = this.theme.colors.rowBackground;
    n.stripeRows && i % 2 === 1 && (d = this.theme.colors.rowAltBackground), e.selected && (d = this.theme.colors.rowSelectedBackground), ((u = n.hoveredCell) == null ? void 0 : u.rowIndex) === i && (d = this.theme.colors.rowHoverBackground), this.ctx.fillStyle = d, this.ctx.fillRect(r, l, c, h);
    for (let f = s; f <= o; f++) {
      const g = t[f];
      if (!g) continue;
      const m = e.data[Y(g)];
      this.renderCell(g, e, i, f, m, n);
    }
  }
  renderCell(t, e, i, s, o, n) {
    const { x: a, y: r, width: l, height: h } = this.layoutManager.getCellPosition(i, s);
    this.renderCellInternal(t, e, i, s, o, a, r, l, h, n);
  }
  renderCellWithPosition(t, e, i, s, o, n, a, r, l, h) {
    this.renderCellInternal(t, e, i, s, o, n, a, r, l, h);
  }
  renderCellInternal(t, e, i, s, o, n, a, r, l, h) {
    var w, C, b, R;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const I = this.hoveredPlaceholderColumnIndex === s;
      this.ctx.fillStyle = I ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.rowBackground, this.ctx.fillRect(n, a, r, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(n + r, a), this.ctx.lineTo(n + r, a + l), this.ctx.stroke();
      return;
    }
    const d = this.resolveDisabled(t.disabled, e, t), u = this.getCacheMode(t);
    let f;
    if (this.renderCache && u !== !1) {
      const I = this.renderCache.get(e, t, o, u);
      I ? f = I : (f = this.executeRender(t, e, i, o), this.renderCache.set(e, t, o, f, u));
    } else
      f = this.executeRender(t, e, i, o);
    const g = this.isCellSelected(i, s, h.selectedCells), m = ((w = h.hoveredCell) == null ? void 0 : w.rowIndex) === i && ((C = h.hoveredCell) == null ? void 0 : C.columnIndex) === s, x = ((b = h.editingCell) == null ? void 0 : b.rowIndex) === i && ((R = h.editingCell) == null ? void 0 : R.columnIndex) === s;
    if (g && !e.selected ? (this.ctx.fillStyle = this.theme.colors.rowSelectedBackground, this.ctx.fillRect(n, a, r, l)) : m && !e.selected && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(n, a, r, l)), !x) {
      const I = this.expandColumnKey === t.key, M = e.children && e.children.length > 0, E = e.level ?? 0;
      if (I && M) {
        this.renderExpandIcon(n, a, r, l, e.expanded ?? !1, E);
        const T = 20, H = E * 16;
        this.renderCellContent(
          f,
          n + T + H,
          a,
          r - T - H,
          l,
          8,
          t.align,
          i,
          s,
          d
        );
      } else {
        const T = I ? E * 16 : 0;
        this.renderCellContent(
          f,
          n + T,
          a,
          r - T,
          l,
          8,
          t.align,
          i,
          s,
          d
        );
      }
    }
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(n, a, r, l);
    const y = this.currentValidationErrors.get(`${i}-${s}`);
    if (y) {
      const I = Math.max(this.theme.border.width, 2), M = I / 2;
      this.ctx.strokeStyle = y.level === "warning" ? this.theme.colors.tagColors.warning ?? "#faad14" : this.theme.colors.tagColors.error ?? "#ff4d4f", this.ctx.lineWidth = I, this.ctx.strokeRect(n + M, a + M, r - I, l - I);
    } else if (this.currentPendingValidations.has(`${i}-${s}`)) {
      const I = Math.max(this.theme.border.width, 2), M = I / 2, E = Date.now() % 1500 / 1500, T = 0.3 + 0.4 * Math.sin(E * Math.PI * 2);
      this.ctx.strokeStyle = `rgba(59, 130, 246, ${T})`, this.ctx.lineWidth = I, this.ctx.strokeRect(n + M, a + M, r - I, l - I);
    }
    if (d) {
      const I = this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
      this.ctx.fillStyle = I, this.ctx.fillRect(n, a, r, l);
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
  renderCellContent(t, e, i, s, o, n, a, r, l, h) {
    try {
      this.renderCellContentInternal(
        t,
        e,
        i,
        s,
        o,
        n,
        a,
        r,
        l,
        h
      );
    } catch (c) {
      console.error(`Error rendering cell content at row ${r}, col ${l}:`, c), this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText("[Render Error]", e + n, i + o / 2);
    }
  }
  renderWithCellRenderer(t, e, i, s, o, n, a = {}) {
    const r = this.cellRendererRegistry.get(t);
    return r ? r.render(
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
        rowIndex: a.rowIndex ?? -1,
        colIndex: a.colIndex ?? -1,
        value: e,
        isDisabled: a.isDisabled ?? !1,
        isHovered: a.isHovered ?? !1,
        isSelected: !1,
        dpr: this.dpr,
        locale: this.locale,
        switchAnimation: a.switchAnimation,
        buttonHoverState: a.buttonHoverState,
        multipleSelectSeparator: a.multipleSelectSeparator,
        hoveredButtonIndex: a.hoveredButtonIndex,
        hoveredImageIndex: a.hoveredImageIndex,
        imageRuntime: a.imageRuntime
      })
    ) : null;
  }
  renderCellContentInternal(t, e, i, s, o, n, a, r, l, h) {
    var c, d, u, f;
    this.ctx.save();
    try {
      const { text: g, type: m, style: x, checkbox: y, radio: w, button: C, input: b, tags: R, link: I } = t, M = (x == null ? void 0 : x.fontSize) ?? this.theme.font.size, E = (x == null ? void 0 : x.fontFamily) ?? this.theme.font.family, T = (x == null ? void 0 : x.fontWeight) ?? "normal", H = (x == null ? void 0 : x.fontStyle) ?? "normal";
      if (this.ctx.font = `${H} ${T} ${M}px ${E}`, m === O.CHECKBOX && y) {
        this.measureRender("checkbox", () => {
          this.renderWithCellRenderer("checkbox", y, e, i, s, o, {
            rowIndex: r,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.RADIO && w) {
        this.measureRender("radio", () => {
          this.renderWithCellRenderer("radio", w, e, i, s, o, {
            rowIndex: r,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.BUTTON && C) {
        let D;
        if (r !== void 0 && l !== void 0 && this.currentButtonHoverStates) {
          const k = `${r}-${l}`, P = this.currentButtonHoverStates.get(k);
          P && (D = P);
        }
        this.measureRender("button", () => {
          this.renderWithCellRenderer("button", C, e, i, s, o, {
            rowIndex: r,
            colIndex: l,
            isDisabled: h,
            buttonHoverState: D
          });
        });
        return;
      }
      if (m === O.BUTTONS && t.buttons) {
        let D = -1;
        r !== void 0 && l !== void 0 && ((c = this.currentHoveredCell) == null ? void 0 : c.rowIndex) === r && ((d = this.currentHoveredCell) == null ? void 0 : d.columnIndex) === l && (D = this.currentHoveredButtonIndex), this.measureRender("buttons", () => {
          this.renderWithCellRenderer("buttons", t.buttons, e, i, s, o, {
            rowIndex: r,
            colIndex: l,
            isDisabled: h,
            hoveredButtonIndex: D
          });
        });
        return;
      }
      if (m === O.SWITCH && t.switch) {
        let D;
        if (r !== void 0 && l !== void 0 && this.currentSwitchAnimations) {
          const k = `${r}-${l}`, P = this.currentSwitchAnimations.get(k);
          P && (D = P);
        }
        this.measureRender("switch", () => {
          this.renderWithCellRenderer("switch", t.switch, e, i, s, o, {
            rowIndex: r,
            colIndex: l,
            isDisabled: h,
            switchAnimation: D
          });
        });
        return;
      }
      if (m === O.INPUT && b) {
        this.measureRender("input", () => {
          this.renderWithCellRenderer("input", b, e, i, s, o, {
            rowIndex: r,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.SELECT && t.select) {
        this.measureRender("select", () => {
          this.renderWithCellRenderer("select", t.select, e, i, s, o, {
            rowIndex: r,
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
            rowIndex: r,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.TAG && R) {
        this.measureRender("tags", () => {
          this.renderWithCellRenderer("tag", R, e, i, s, o, {
            rowIndex: r,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === O.IMAGE && t.image) {
        const D = r !== void 0 && l !== void 0 && ((u = this.currentHoveredCell) == null ? void 0 : u.rowIndex) === r && ((f = this.currentHoveredCell) == null ? void 0 : f.columnIndex) === l, k = this.imageRenderContext;
        if (k.ctx = this.ctx, k.theme = this.theme, k.locale = this.locale, k.layoutManager = this.layoutManager, k.dpr = this.dpr, k.x = e, k.y = i, k.width = s, k.height = o, k.value = t.image, k.rowIndex = r ?? -1, k.colIndex = l ?? -1, k.isDisabled = h ?? !1, k.isHovered = !!D, k.hoveredImageIndex = this.currentHoveredImageIndex, this.performanceEnabled) {
          const P = performance.now();
          this.imageRenderer.render(k);
          const B = performance.now() - P, L = this.currentFrameStats.get("image") || { totalTime: 0, count: 0 };
          L.totalTime += B, L.count++, this.currentFrameStats.set("image", L);
        } else
          this.imageRenderer.render(k);
        return;
      }
      if (m === O.PROGRESS && t.progress) {
        const k = r !== void 0 && l !== void 0 && this.currentProgressDragState && this.currentProgressDragState.cell.rowIndex === r && this.currentProgressDragState.cell.columnIndex === l ? { ...t.progress, value: this.currentProgressDragState.displayValue } : t.progress;
        this.measureRender("progress", () => {
          this.renderWithCellRenderer("progress", k, e, i, s, o, {
            rowIndex: r,
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
              rowIndex: r,
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
            rowIndex: r,
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
            const D = t.jsxRender(), k = new Ti(this.ctx), P = new Mi(k);
            new Di(this.ctx, P, this.theme).render(D, e, i, { width: s, height: o });
          } catch (D) {
            console.error(`[Renderer] JSX render error at row ${r}, col ${l}:`, D);
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
            console.error(`[Renderer] customRender error at row ${r}, col ${l}:`, D);
          }
        });
        return;
      }
      this.measureRender("text", () => {
        let D = g, k = (x == null ? void 0 : x.color) ?? this.theme.colors.cellText;
        if (m === O.LINK && I && (D = I.text || I.link, k = (x == null ? void 0 : x.color) ?? this.theme.colors.linkColor), m === O.NUMBER && !D && (D = t.placeholder ?? this.locale.cell.numberPlaceholder, k = this.theme.colors.placeholderText), !D) return;
        this.ctx.fillStyle = k;
        const P = (x == null ? void 0 : x.horizontalAlign) ?? a ?? "left", B = (x == null ? void 0 : x.verticalAlign) ?? "middle", L = this.theme.font.size, W = L * 1.5, _ = s - n * 2, A = this.calculateMaxRows(o, W, n);
        if (A > 1) {
          const N = this.wrapTextToLines(D, _, A), V = N.length * W;
          let z;
          B === "top" ? z = i + n : B === "bottom" ? z = i + o - n - V : z = i + (o - V) / 2, this.ctx.textBaseline = "top";
          for (let X = 0; X < N.length; X++) {
            const $ = N[X];
            let tt;
            switch (P) {
              case "center":
                tt = e + (s - this.ctx.measureText($).width) / 2;
                break;
              case "right":
                tt = e + s - n - this.ctx.measureText($).width;
                break;
              default:
                tt = e + n;
            }
            this.ctx.fillText($, tt, z + X * W);
          }
        } else {
          const N = "...";
          if (this.ctx.measureText(D).width > _) {
            let $ = D;
            for (; $.length > 0 && this.ctx.measureText($ + N).width > _; )
              $ = $.slice(0, -1);
            D = $ + N;
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
            const $ = this.ctx.measureText(D).width;
            this.ctx.strokeStyle = k, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(z, X + L / 2 + 2), this.ctx.lineTo(z + $, X + L / 2 + 2), this.ctx.stroke();
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
  /**
   * 检查行是否在懒加载范围内
   */
  isInLazyLoadRange(t, e) {
    if (!this.currentVisibleRange) return !0;
    const { startRow: i, endRow: s } = this.currentVisibleRange, o = this.rowHeight || this.theme.row.height, n = Math.ceil(e / o), a = Math.max(0, i - n), r = s + n, l = this.currentRows[t];
    if (!l)
      return t >= a && t <= r;
    if (this.layoutManager.isRowInPinnedBand(l))
      return !0;
    const h = this.layoutManager.getBodyRowIndexByRef(l);
    return h >= 0 ? h >= a && h <= r : t >= a && t <= r;
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
      const o = Array.from(this.lastFrameStats.entries()).map(([a, r]) => ({
        type: a,
        count: r.count,
        totalTime: r.totalTime,
        avgTime: r.count > 0 ? r.totalTime / r.count : 0
      })).sort((a, r) => r.totalTime - a.totalTime);
      for (const a of o)
        t.push(
          `${a.type.padEnd(15)} | calls: ${a.count.toString().padStart(4)} | avg: ${a.avgTime.toFixed(3).padStart(7)}ms | total: ${a.totalTime.toFixed(2).padStart(6)}ms`
        );
      const n = o.reduce((a, r) => a + r.totalTime, 0);
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
    const a = this.ctx.measureText(t).width + 4 * 2, r = s + 4 * 2, l = this.theme.colors.tagColors[t.toLowerCase()] ?? this.theme.colors.tagColors.default;
    this.ctx.fillStyle = l, this.ctx.beginPath();
    const h = 4, c = e - 4, d = i - s / 2 - 4;
    this.ctx.roundRect(c, d, a, r, h), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.fillText(t, e, i);
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
      const o = Math.min(s.start.rowIndex, s.end.rowIndex), n = Math.max(s.start.rowIndex, s.end.rowIndex), a = Math.min(s.start.columnIndex, s.end.columnIndex), r = Math.max(s.start.columnIndex, s.end.columnIndex);
      return t >= o && t <= n && e >= a && e <= r;
    });
  }
  renderCenterSelections(t, e, i, s) {
    const o = this.layoutManager.getLeafColumns();
    for (const n of t) {
      const a = Math.min(n.start.rowIndex, n.end.rowIndex), r = Math.max(n.start.rowIndex, n.end.rowIndex), l = Math.min(n.start.columnIndex, n.end.columnIndex), h = Math.max(n.start.columnIndex, n.end.columnIndex), c = this.layoutManager.getCellMerge(a, l);
      let d = a, u = r, f = l, g = h;
      c && (d = c.rowIndex, u = c.rowIndex + c.rowspan - 1, f = c.columnIndex, g = c.columnIndex + c.colspan - 1);
      const m = Math.max(f, Math.min(...s)), x = Math.min(g, Math.max(...s));
      if (m > x) continue;
      const y = o[m], w = o[x];
      if (!y || !w || y.fixed || w.fixed) continue;
      const C = this.layoutManager.getRowViewportY(d, i);
      if (C === null) continue;
      const b = this.layoutManager.getRowOffset(u) + this.layoutManager.getRowHeightByIndex(u) - this.layoutManager.getRowOffset(d), R = this.layoutManager.getCellPosition(d, m), I = this.layoutManager.getCellPosition(u, x), M = I.x + I.width - R.x, E = R.x - e;
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]), this.ctx.strokeRect(E, C, M, b);
    }
  }
  renderFixedSelections(t, e, i, s) {
    for (const o of t) {
      const n = Math.min(o.start.rowIndex, o.end.rowIndex), a = Math.max(o.start.rowIndex, o.end.rowIndex), r = Math.min(o.start.columnIndex, o.end.columnIndex), l = Math.max(o.start.columnIndex, o.end.columnIndex), h = this.layoutManager.getCellMerge(n, r);
      let c = n, d = a, u = r, f = l;
      h && (c = h.rowIndex, d = h.rowIndex + h.rowspan - 1, u = h.columnIndex, f = h.columnIndex + h.colspan - 1);
      const g = this.layoutManager.getRowViewportY(c, e);
      if (g === null) continue;
      const m = this.layoutManager.getRowOffset(d) + this.layoutManager.getRowHeightByIndex(d) - this.layoutManager.getRowOffset(c);
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]);
      const x = i.filter(
        (w) => w >= u && w <= f
      );
      if (x.length > 0) {
        const w = x[0], C = x[x.length - 1], b = this.layoutManager.getCellPosition(c, w), R = this.layoutManager.getCellPosition(d, C), I = R.x + R.width - b.x;
        this.ctx.strokeRect(b.x, g, I, m);
      }
      const y = s.filter(
        (w) => w >= u && w <= f
      );
      if (y.length > 0) {
        const w = y[0], C = y[y.length - 1], b = this.layoutManager.getCellPosition(c, w), R = this.layoutManager.getCellPosition(d, C), I = R.x + R.width - b.x;
        this.ctx.strokeRect(b.x, g, I, m);
      }
    }
  }
  renderLoadingOverlay() {
    const t = this.canvas.width / this.dpr, e = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)", this.ctx.fillRect(0, 0, t, e), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(this.locale.loadingText, t / 2, e / 2), this.ctx.restore();
  }
  renderEmptyState(t, e = [], i = [], s, o = 0) {
    const n = this.canvas.width / this.dpr, a = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, n, a);
    const l = this.layoutManager.getLayoutInfo().headerHeight, h = this.layoutManager.getLeafColumns();
    if (h.length > 0) {
      const c = this.layoutManager.getFixedColumnsInfo(h), d = c.leftFixed.columns.length > 0, u = c.rightFixed.columns.length > 0, f = d ? c.leftFixed.width : 0, g = u ? c.rightFixed.width : 0;
      this.ctx.save(), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, n, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, l), this.ctx.lineTo(n, l), this.ctx.stroke();
      const m = this.layoutManager.getVisibleHeaderCells();
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(f, 0, n - f - g, l), this.ctx.clip();
      for (const x of m) {
        if (x.column.fixed === "left" || x.column.fixed === "right")
          continue;
        const y = x.x - o;
        this.renderEmptyStateHeaderCell(
          x,
          y,
          e,
          i,
          s
        );
      }
      if (this.ctx.restore(), d)
        for (const x of m)
          x.column.fixed === "left" && this.renderEmptyStateHeaderCell(
            x,
            x.x,
            e,
            i,
            s
          );
      if (u)
        for (const x of m) {
          if (x.column.fixed !== "right") continue;
          const w = n - g - (this.layoutManager.getLayoutInfo().totalWidth - g), C = x.x + w;
          this.renderEmptyStateHeaderCell(
            x,
            C,
            e,
            i,
            s
          );
        }
      this.ctx.restore();
    }
    this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(t, n / 2, l + (a - l) / 2), this.ctx.restore();
  }
  renderEmptyStateHeaderCell(t, e, i, s, o) {
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, t.y, t.width, t.height), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const n = i.find((b) => b.column === t.column.key), a = (n == null ? void 0 : n.direction) ?? "none", r = t.column.sortable !== !1, l = t.column.key === o, h = t.isLeaf && r && (a !== "none" || l), c = h ? 20 : 0, d = s.some((b) => b.column === t.column.key), u = t.isLeaf && t.column.filterable, f = u ? 20 : 0, g = 8, m = t.width - g * 2 - c - f, x = mt(t.column.title, Math.floor(m / 7)), y = t.column.align ?? "center";
    let w = e + g;
    y === "center" ? w = e + (t.width - this.ctx.measureText(x).width - c - f) / 2 : y === "right" && (w = e + t.width - g - this.ctx.measureText(x).width - c - f);
    const C = t.y + t.height / 2;
    if (this.ctx.fillText(x, w, C), t.isLeaf)
      if (u) {
        const b = e + t.width - g - 10;
        h && this.renderSortIndicator(
          b - 16,
          C,
          a === "none" ? "hover" : a
        ), this.renderFilterIndicator(b, C, d);
      } else h && this.renderSortIndicator(
        e + t.width - g - 10,
        C,
        a === "none" ? "hover" : a
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
    const n = this.layoutManager.getLayoutInfo().headerHeight, a = this.canvas.height / this.dpr, r = this.layoutManager.getColumnByKey(t.dragColumnKey), l = r ? this.layoutManager.getColumnWidth(r) : 100, h = t.currentX - l / 2;
    this.ctx.save(), this.ctx.globalAlpha = 0.7, this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(h, 0, l, a), this.ctx.strokeStyle = this.theme.colors.button.primaryBg, this.ctx.lineWidth = 2, this.ctx.setLineDash([5, 5]), this.ctx.strokeRect(h, 0, l, a), this.ctx.setLineDash([]), t.isParentColumn && r && r.children && r.children.length > 0 ? (this.renderParentColumnGhost(r, h, n), this.renderParentColumnRowsGhost(r, h, n, e, i, s)) : r && (this.renderLeafColumnGhost(r, h, 0, n), this.renderLeafColumnRowsGhost(r, h, n, e, i, s)), this.ctx.restore();
  }
  renderParentColumnGhost(t, e, i) {
    const s = t.depth ?? 0, o = this.theme.row.headerHeight, n = s * o, a = o, r = this.layoutManager.getColumnWidth(t);
    this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.fillRect(e, n, r, a), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, n, r, a), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const l = t.title, h = this.ctx.measureText(l).width, c = e + (r - h) / 2;
    this.ctx.fillText(l, c, n + a / 2), this.renderChildColumnsGhost(t, e, s + 1, i);
  }
  renderChildColumnsGhost(t, e, i, s) {
    if (!t.children || t.children.length === 0) return;
    const o = this.theme.row.headerHeight;
    let n = e;
    for (const a of t.children) {
      const r = this.layoutManager.getColumnWidth(a);
      if (a.children && a.children.length > 0) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        const l = i * o, h = o;
        this.ctx.fillRect(n, l, r, h), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(n, l, r, h), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const c = a.title, d = this.ctx.measureText(c).width, u = n + (r - d) / 2;
        this.ctx.fillText(c, u, l + h / 2), this.renderChildColumnsGhost(a, n, i + 1, s);
      } else
        this.renderLeafColumnGhost(a, n, i, s);
      n += r;
    }
  }
  renderLeafColumnGhost(t, e, i, s) {
    const o = this.theme.row.headerHeight, n = this.layoutManager.getColumnWidth(t), a = i * o, r = s - a;
    this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.fillRect(e, a, n, r), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, a, n, r), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const l = t.title, h = this.ctx.measureText(l).width, c = e + (n - h) / 2;
    this.ctx.fillText(l, c, a + r / 2);
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
    const a = this.layoutManager.getColumnWidth(t), { startRow: r, endRow: l } = o;
    for (let h = r; h <= l; h++) {
      const c = s[h];
      if (!c) continue;
      const d = this.layoutManager.getRowOffset(h), u = this.layoutManager.getRowHeightByIndex(h), f = d - n;
      if (f + u < i || f > this.canvas.height / this.dpr)
        continue;
      this.ctx.fillStyle = this.theme.colors.rowBackground, this.ctx.fillRect(e, f, a, u), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(e, f + u), this.ctx.lineTo(e + a, f + u), this.ctx.stroke();
      const g = c.data[Y(t)];
      this.renderGhostCellValue(t, c, h, g, e, f, a, u);
    }
  }
  renderParentColumnRowsGhost(t, e, i, s, o, n) {
    if (!t.children || t.children.length === 0) return;
    let a = e;
    for (const r of t.children) {
      const l = this.layoutManager.getColumnWidth(r);
      r.children && r.children.length > 0 ? this.renderParentColumnRowsGhost(
        r,
        a,
        i,
        s,
        o,
        n
      ) : this.renderLeafColumnRowsGhost(
        r,
        a,
        i,
        s,
        o,
        n
      ), a += l;
    }
  }
  renderGhostCellValue(t, e, i, s, o, n, a, r) {
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
    const c = bt(t.disabled, e, t);
    this.renderCellContent(
      h,
      o,
      n,
      a,
      r,
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
};
v(xt, "SHARED_PLACEHOLDER_COLUMN", {
  key: "image",
  title: "image",
  type: "image"
}), v(xt, "SHARED_PLACEHOLDER_ROW", { id: "", data: {} });
let Wt = xt;
const S = {
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
}, pt = class pt {
  constructor(t, e, i) {
    v(this, "layoutManager");
    v(this, "scrollState");
    v(this, "canvas");
    this.layoutManager = t, this.scrollState = e, this.canvas = i;
  }
  /**
   * Get logical canvas dimensions (CSS pixels, accounting for devicePixelRatio)
   */
  getLogicalCanvasSize() {
    const t = It();
    return {
      width: this.canvas.width / t,
      height: this.canvas.height / t
    };
  }
  /**
   * Calculate initial dropdown position
   */
  calculate(t) {
    const { width: e, height: i, gap: s = pt.DEFAULT_GAP } = t, { width: o, height: n } = this.getLogicalCanvasSize(), a = this.calculateX(t, e, o), { anchorY: r, cellViewportY: l } = this.calculateAnchorY(t), { y: h, showAbove: c } = this.calculateInitialY(r, i, s, n);
    return { x: a, y: h, showAbove: c, anchorViewportY: r, cellViewportY: l };
  }
  /**
   * Update Y position during scroll (preserves or toggles showAbove)
   */
  updateY(t, e, i, s = pt.DEFAULT_GAP) {
    const { height: o } = this.getLogicalCanvasSize(), { anchorY: n, cellViewportY: a } = this.calculateAnchorY(t);
    let r;
    e ? r = n - s - i : r = n + s;
    let l = e;
    return e && r < 0 ? n + s + i <= o && (r = n + s, l = !1) : !e && r + i > o && n - s - i >= 0 && (r = n - s - i, l = !0), { y: r, showAbove: l, cellViewportY: a };
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
    const o = pt.EDGE_PADDING, n = t.column ?? this.getColumn(t), a = (n == null ? void 0 : n.width) ?? 100, l = s + a > o && s < i - o;
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
      const a = t - i - e;
      a >= 0 && (o = a, n = !0);
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
v(pt, "DEFAULT_GAP", 4), v(pt, "EDGE_PADDING", 8);
let At = pt;
class ft {
  constructor(t, e) {
    v(this, "context");
    v(this, "eventEmitter");
    v(this, "dropdownCalculator");
    this.context = t, this.eventEmitter = e, this.dropdownCalculator = new At(
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
class Bi extends ft {
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
    ], this.eventEmitter.emit(S.SELECTION_CHANGE, [...this.state.selectedCells]);
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
    ], this.eventEmitter.emit(S.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Handle toggle selection (ctrl/cmd+click)
   */
  handleToggleSelection(t) {
    const e = this.state.selectedCells.findIndex((i) => {
      const { minRow: s, maxRow: o, minCol: n, maxCol: a } = this.getNormalizedRange(i);
      return t.rowIndex >= s && t.rowIndex <= o && t.columnIndex >= n && t.columnIndex <= a;
    });
    e >= 0 ? this.state.selectedCells.splice(e, 1) : this.state.selectedCells.push({ start: t, end: t }), this.eventEmitter.emit(S.SELECTION_CHANGE, [...this.state.selectedCells]);
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
    ], this.eventEmitter.emit(S.SELECTION_CHANGE, [...this.state.selectedCells]));
  }
  /**
   * Clear selection
   */
  clearSelection() {
    this.state.selectedCells = [], this.eventEmitter.emit(S.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Move selection by delta
   */
  moveSelection(t, e) {
    if (this.state.selectedCells.length === 0) return;
    const i = this.layoutManager.getLeafColumns(), s = this.state.selectedCells[0].start, o = Z(s.rowIndex + t, 0, this.rows.length - 1), n = Z(s.columnIndex + e, 0, i.length - 1), a = { rowIndex: o, columnIndex: n };
    this.handleSingleSelection(a), this.scrollToCell(a);
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
    (e !== this.scrollState.scrollTop || i !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = e, this.eventEmitter.emit(S.SCROLL, i, e));
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
      for (let a = i; a <= s; a++)
        for (let r = o; r <= n; r++)
          t.push({ rowIndex: a, columnIndex: r });
    }
    return t;
  }
}
class Li extends ft {
  constructor(e, i, s, o) {
    super(e, i);
    v(this, "selectionHandler");
    v(this, "editingConfig");
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
      const r = this.state.selectedCells[0];
      s = e.key === "ArrowUp" || e.key === "ArrowLeft" ? r.start : r.end;
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
    const a = { rowIndex: o, columnIndex: n };
    this.selectionHandler.handleSingleSelection(a), this.scrollToCell(a);
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
      const n = this.layoutManager.getLeafColumns()[i.columnIndex], a = this.rows[i.rowIndex];
      if (n && a) {
        const r = ut(n, a, i.rowIndex), l = ["checkbox", "radio", "button", "switch"];
        return r.type && l.includes(r.type) ? r.type === O.SWITCH && r.switch ? (this.editorRegistry.getStrategy(n).canEdit(i, a, n) && this.eventEmitter.emit(
          S.SWITCH_CHANGE,
          this.getCellInfo(i),
          !r.switch.checked
        ), null) : (this.toggleRowExpand(i.rowIndex), null) : !this.editorRegistry.getStrategy(n).canEdit(i, a, n) || (s = r.input) != null && s.readonly ? null : this.getEditingStartConfig(i, n, a, r);
      }
    } else
      this.toggleRowExpand(i.rowIndex);
    return null;
  }
  /**
   * Get editing start configuration for a cell
   */
  getEditingStartConfig(e, i, s, o) {
    const n = s.data[Y(i)];
    if (i.editRender)
      try {
        const a = i.editRender(n, s, e.rowIndex);
        if (a) {
          const l = {
            input: "input",
            select: "select",
            tags: "tags",
            date: "date",
            checkbox: "checkbox",
            radio: "radio",
            switch: "switch"
          }[a.type];
          return { type: a.type, config: l ? a[l] : void 0 };
        }
      } catch (a) {
        console.error("Error in editRender:", a);
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
    (i !== this.scrollState.scrollTop || s !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = s, this.scrollState.scrollTop = i, this.eventEmitter.emit(S.SCROLL, s, i));
  }
  /**
   * Toggle row expand state
   */
  toggleRowExpand(e) {
    const i = this.rows[e];
    i && i.children && i.children.length > 0 && this.eventEmitter.emit(S.EXPAND, i, e, !i.expanded);
  }
  /**
   * Update editing config
   */
  updateEditingConfig(e) {
    this.editingConfig = e;
  }
}
const gt = class gt extends ft {
  constructor(e, i, s) {
    super(e, i);
    v(this, "editingConfig");
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
    const o = i.data[Y(e)];
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
    return this.validateCellForEditing(e) ? (this.state.tooltip = null, this.state.editingCell = e, this.eventEmitter.emit(S.EDIT_START, this.getCellInfo(e), i), !0) : !1;
  }
  /**
   * Start select dropdown editing
   */
  startSelectEditing(e, i) {
    var d;
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = gt.DROPDOWN_ITEM_HEIGHT, n = gt.DROPDOWN_MAX_VISIBLE, a = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(a, n) * o, h = s.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
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
    }, this.eventEmitter.emit(S.DROPDOWN_OPEN), !0;
  }
  /**
   * Start tags editing
   */
  startTagsEditing(e, i) {
    var d;
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = gt.DROPDOWN_ITEM_HEIGHT, n = gt.DROPDOWN_MAX_VISIBLE, a = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(a, n) * o, h = s.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
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
    }, this.eventEmitter.emit(S.DROPDOWN_OPEN), !0;
  }
  /**
   * Start date editing
   */
  startDateEditing(e, i) {
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = Math.max(s.column.width ?? 100, 280), n = 68 + 6 * 28 + 16, a = this.calculateDropdownPosition(e, o, n, "cell", {
      column: s.column
    });
    let r = null;
    i.value && (i.value instanceof Date ? r = i.value : typeof i.value == "string" && (r = new Date(i.value)));
    const l = (r == null ? void 0 : r.getFullYear()) ?? (/* @__PURE__ */ new Date()).getFullYear(), h = (r == null ? void 0 : r.getMonth()) ?? (/* @__PURE__ */ new Date()).getMonth();
    return this.state.dateDropdown = {
      cell: e,
      config: i,
      x: a.x,
      y: a.y,
      width: o,
      currentYear: l,
      currentMonth: h,
      selectedDate: r,
      hoveredDate: null,
      showAbove: a.showAbove
    }, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
  }
  /**
   * Start image editing
   */
  startImageEditing(e, i) {
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = 64, n = 8, a = 8, r = 4, l = 60, h = o + a, c = r * o + (r - 1) * a + n * 2 + 4 + 4, d = 3, u = d * h + n * 2 - a, f = l + u, g = this.calculateDropdownPosition(e, c, f, "cell", {
      column: s.column
    }), m = i.images ?? (i.src ? [i.src] : []), x = !m || m.length <= 1 && !i.multiple;
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
      isSingleImage: x
    }, this.eventEmitter.emit(S.IMAGE_EDITOR_OPEN), !0;
  }
  /**
   * Start color picker editing
   */
  startColorEditing(e, i) {
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = i.presetColors || this.getDefaultPresetColors(), n = 8, a = Math.ceil(o.length / n), r = 24, l = 4, h = 8, c = Math.max(
      s.column.width ?? 100,
      n * (r + l) + h * 2 - l
    ), d = a * (r + l) + h * 2 - l, u = this.calculateDropdownPosition(e, c, d, "cell", {
      column: s.column
    });
    return this.state.colorDropdown = {
      cell: e,
      config: i,
      x: u.x,
      y: u.y,
      width: c,
      hoveredColor: null
    }, this.eventEmitter.emit(S.COLOR_DROPDOWN_OPEN), !0;
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
      S.EDIT_END,
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
v(gt, "DROPDOWN_ITEM_HEIGHT", 32), v(gt, "DROPDOWN_MAX_VISIBLE", 8);
let _t = gt;
const J = class J extends ft {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle dropdown click
   */
  handleDropdownClick(t) {
    var m, x;
    if (!this.state.dropdown) return !1;
    const { x: e, y: i, width: s, scrollTop: o, type: n, tagsConfig: a, config: r } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = J.DROPDOWN_ITEM_HEIGHT, u = J.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && a) {
      const w = Math.min(((m = a.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + s && c >= i && c <= i + w) {
        const C = c - i + o, b = Math.floor(C / d);
        if (b >= 0 && b < (((x = a.options) == null ? void 0 : x.length) ?? 0) && a.options) {
          const R = a.options[b];
          if (!R.disabled)
            if (a.multiple !== !1) {
              const M = [...a.selectedValues ?? []], E = R.value ?? R.text, T = M.indexOf(E);
              T >= 0 ? M.splice(T, 1) : M.push(E), this.eventEmitter.emit(
                S.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                M,
                !0
              ), this.state.dropdown.tagsConfig = {
                ...a,
                selectedValues: M
              }, this.eventEmitter.emit(S.DROPDOWN_HOVER);
            } else {
              const M = R.value ?? R.text;
              this.eventEmitter.emit(
                S.TAGS_CHANGE,
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
    const g = Math.min(r.options.length, u) * d;
    if (h >= e && h <= e + s && c >= i && c <= i + g) {
      const y = c - i + o, w = Math.floor(y / d);
      if (w >= 0 && w < r.options.length) {
        const C = r.options[w];
        if (!C.disabled)
          if (r.multiple) {
            const b = Array.isArray(r.value) ? [...r.value] : [], R = C.value, I = b.indexOf(R);
            I >= 0 ? b.splice(I, 1) : b.push(R), this.eventEmitter.emit(
              S.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              b,
              !0
            ), this.state.dropdown.config = {
              ...r,
              value: b
            }, this.eventEmitter.emit(S.DROPDOWN_HOVER);
          } else
            this.eventEmitter.emit(
              S.SELECT_CHANGE,
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
    var m, x;
    if (!this.state.dropdown) return;
    const { x: e, y: i, width: s, scrollTop: o, type: n, tagsConfig: a, config: r } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = J.DROPDOWN_ITEM_HEIGHT, u = J.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && a) {
      const w = Math.min(((m = a.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + s && c >= i && c <= i + w) {
        const C = c - i + o, b = Math.floor(C / d);
        b >= 0 && b < (((x = a.options) == null ? void 0 : x.length) ?? 0) && (this.state.dropdown.hoveredIndex = b, this.eventEmitter.emit(S.DROPDOWN_HOVER));
      } else
        this.state.dropdown.hoveredIndex = -1;
      return;
    }
    const g = Math.min(r.options.length, u) * d;
    if (h >= e && h <= e + s && c >= i && c <= i + g) {
      const y = c - i + o, w = Math.floor(y / d);
      w >= 0 && w < r.options.length && (this.state.dropdown.hoveredIndex = w, this.eventEmitter.emit(S.DROPDOWN_HOVER));
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
      return this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE), !0;
    const n = this.getViewportCoords(t), a = n.x, r = n.y, l = J.DROPDOWN_ITEM_HEIGHT, h = s.length * l;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let c = 100;
    for (const d of s) {
      const u = d.text ?? this.locale.cell.buttonText, f = this.ctx.measureText(u).width;
      c = Math.max(c, f + 24);
    }
    if (a >= e && a <= e + c && r >= i && r <= i + h) {
      const d = r - i, u = Math.floor(d / l);
      if (u >= 0 && u < s.length) {
        const f = s[u];
        return this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE), this.eventEmitter.emit(S.BUTTON_CLICK, this.getCellInfo(o), f.actionKey), !0;
      }
    }
    return this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE), !0;
  }
  /**
   * Handle buttons dropdown hover
   */
  handleButtonsDropdownHover(t) {
    if (!this.state.buttonsDropdown) return;
    const { x: e, y: i, buttons: s } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(this.state.buttonsDropdown.cell)) {
      this.state.buttonsDropdown.hoveredIndex = -1, this.eventEmitter.emit(S.DROPDOWN_HOVER);
      return;
    }
    const o = this.getViewportCoords(t), n = o.x, a = o.y, r = J.DROPDOWN_ITEM_HEIGHT, l = s.length * r;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let h = 100;
    for (const c of s) {
      const d = c.text ?? this.locale.cell.buttonText, u = this.ctx.measureText(d).width;
      h = Math.max(h, u + 24);
    }
    if (n >= e && n <= e + h && a >= i && a <= i + l) {
      const c = a - i, d = Math.floor(c / r);
      d >= 0 && d < s.length && (this.state.buttonsDropdown.hoveredIndex = d, this.eventEmitter.emit(S.DROPDOWN_HOVER));
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
    const { x: e, y: i, width: s, mode: o } = this.state.filterDropdown, n = this.getViewportCoords(t), a = n.x, r = n.y, l = 8;
    if (o === "dateRange") {
      const g = l + 32 + 4 + 36, m = a >= e && a <= e + s && r >= i && r <= i + g;
      let x = !1;
      if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0) {
        const C = (s - l * 3) / 2, b = e + l, R = e + l + C + 8, I = i + l;
        let T = (this.state.filterDropdown.activeDateField === "startDate" ? b : R) + C / 2 - 240 / 2;
        T < e && (T = e), T + 240 > e + s && (T = e + s - 240);
        const H = I + 32 + 8;
        x = a >= T && a <= T + 240 && r >= H && r <= H + 252;
      }
      return m || x ? (this.handleDateRangeModeClick(t, a, r), !0) : !1;
    }
    const h = this.getFilterDropdownHeight();
    if (a >= e && a <= e + s && r >= i && r <= i + h) {
      switch (o) {
        case "select":
          this.handleSelectModeClick(t, a, r);
          break;
        case "search":
          this.handleSearchModeClick(t, a, r);
          break;
        case "range":
          this.handleRangeModeClick(t, a, r);
          break;
        case "boolean":
          this.handleBooleanModeClick(t, a, r);
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
        const n = J.DROPDOWN_ITEM_HEIGHT, a = J.DROPDOWN_MAX_VISIBLE, r = 32, l = 4, c = Math.min((e == null ? void 0 : e.length) ?? 0, a) * n;
        return i + r + l + c + l + o;
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
    const { x: s, y: o, width: n, options: a, scrollTop: r } = this.state.filterDropdown;
    if (!a) return;
    const l = J.DROPDOWN_ITEM_HEIGHT, h = J.DROPDOWN_MAX_VISIBLE, c = Math.min(a.length, h), d = 36, u = 32, f = c * l, g = 8, m = 4;
    if (a.length > h) {
      const C = a.length * l, b = Math.max(20, f / C * f), R = f - b, I = r / (C - f) * R, M = s + n - 6 - 2, E = o + g + u + m;
      if (e >= M && e <= M + 6 && i >= E + I && i <= E + I + b) {
        this.state.filterDropdown.isScrollbarDragging = !0, this.state.filterDropdown.scrollbarDragStartY = t.clientY, this.state.filterDropdown.scrollbarDragStartScrollTop = r;
        return;
      }
    }
    const x = o + g + u + m + f + m;
    if (i >= x && i <= x + d) {
      this.ctx.font = "14px sans-serif";
      const C = this.locale.filter.reset, b = this.locale.filter.confirm, R = this.ctx.measureText(C).width, I = this.ctx.measureText(b).width, M = s + g, E = s + n - g - I;
      if (e >= M && e <= M + R + 10) {
        this.state.filterDropdown.options && this.state.filterDropdown.options.forEach((T) => T.checked = !1), this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= E - 10 && e <= E + I) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
    const y = o + g + u + m;
    if (i >= y && i <= y + f) {
      const w = i - y + r, C = Math.floor(w / l);
      C >= 0 && C < a.length && (a[C].checked = !a[C].checked, this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE));
    }
  }
  /**
   * 处理 search 模式点击
   */
  handleSearchModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n } = this.state.filterDropdown, a = 8, r = 4, l = 36, h = 36, c = o + a + l + r;
    if (i >= c && i <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = this.locale.filter.reset, f = this.locale.filter.confirm, g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, x = s + a, y = s + n - a - m;
      if (e >= x && e <= x + g + 10) {
        this.state.filterDropdown.searchValue = "", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= y - 10 && e <= y + m) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 range 模式点击
   */
  handleRangeModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n } = this.state.filterDropdown, a = 8, r = 32, l = 4, h = 36, c = o + a + r + l;
    if (i >= c && i <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = this.locale.filter.reset, f = this.locale.filter.confirm, g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, x = s + a, y = s + n - a - m;
      if (e >= x && e <= x + g + 10) {
        this.state.filterDropdown.minValue = "", this.state.filterDropdown.maxValue = "", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= y - 10 && e <= y + m) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 boolean 模式点击
   */
  handleBooleanModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n } = this.state.filterDropdown, a = 8, r = 4, l = 32, h = 36, c = o + a, d = l * 3;
    if (i >= c && i <= c + d) {
      const f = Math.floor((i - c) / l), g = ["all", "true", "false"];
      f >= 0 && f < 3 && (this.state.filterDropdown.boolValue = g[f], this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE));
      return;
    }
    const u = o + a + d + r;
    if (i >= u && i <= u + h) {
      this.ctx.font = "14px sans-serif";
      const g = this.locale.filter.reset, m = this.locale.filter.confirm, x = this.ctx.measureText(g).width, y = this.ctx.measureText(m).width, w = s + a, C = s + n - a - y;
      if (e >= w && e <= w + x + 10) {
        this.state.filterDropdown.boolValue = "all", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= C - 10 && e <= C + y) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 dateRange 模式点击
   */
  handleDateRangeModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: s, y: o, width: n, startDate: a, endDate: r } = this.state.filterDropdown, l = 8, h = 32, c = 8, d = 4, u = 36, f = o + l, g = (n - l * 3) / 2, m = s + l, x = s + l + g + c;
    if (e >= m && e <= m + g && i >= f && i <= f + h) {
      this.state.filterDropdown.activeDateField = "startDate";
      const w = a || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (e >= x && e <= x + g && i >= f && i <= f + h) {
      this.state.filterDropdown.activeDateField = "endDate";
      const w = r || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
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
      const C = this.locale.filter.reset, b = this.locale.filter.confirm, R = this.ctx.measureText(C).width, I = this.ctx.measureText(b).width, M = s + l, E = s + n - l - I;
      if (e >= M && e <= M + R + 10) {
        this.state.filterDropdown.startDate = null, this.state.filterDropdown.endDate = null, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= E - 10 && e <= E + I) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * Handle calendar popover click for date range filter
   */
  handleDateRangeCalendarClick(t, e, i, s, o, n, a, r) {
    if (!this.state.filterDropdown) return !1;
    const { activeDateField: l, currentYear: h, currentMonth: c } = this.state.filterDropdown;
    if (!l || h === void 0 || c === void 0) return !1;
    const d = 40, u = 28, f = 28, g = 8, x = d + u + 6 * f + g * 2, y = 240, w = (o - n * 3) / 2, C = i + n, b = i + n + w + r, R = s + n;
    let E = (l === "startDate" ? C : b) + w / 2 - y / 2;
    E < i && (E = i), E + y > i + o && (E = i + o - y);
    const T = R + a + r;
    if (t < E || t > E + y || e < T || e > T + x)
      return !1;
    if (e >= T && e <= T + d) {
      const W = E + 20, _ = E + y - 20;
      if (t >= W - 6 - 5 && t <= W + 6 + 5)
        return c === 0 ? (this.state.filterDropdown.currentYear = h - 1, this.state.filterDropdown.currentMonth = 11) : this.state.filterDropdown.currentMonth = c - 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN), !0;
      if (t >= _ - 6 - 5 && t <= _ + 6 + 5)
        return c === 11 ? (this.state.filterDropdown.currentYear = h + 1, this.state.filterDropdown.currentMonth = 0) : this.state.filterDropdown.currentMonth = c + 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN), !0;
    }
    const H = (y - g * 2) / 7, k = new Date(h, c, 1).getDay(), P = new Date(h, c + 1, 0).getDate(), B = T + d + u;
    for (let L = 1; L <= P; L++) {
      const W = k + L - 1, _ = Math.floor(W / 7), A = W % 7, N = E + g + A * H, V = B + _ * f;
      if (t >= N && t <= N + H && e >= V && e <= V + f) {
        const z = new Date(h, c, L);
        return l === "startDate" ? this.state.filterDropdown.startDate = z : this.state.filterDropdown.endDate = z, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE), !0;
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
      currentMonth: a,
      hoveredDate: r
    } = this.state.filterDropdown;
    if (!o || n === void 0 || a === void 0)
      return;
    const l = this.getViewportCoords(t), h = l.x, c = l.y, d = 8, u = 32, f = 8, g = 40, m = 28, x = 28, y = 8, C = g + m + 6 * x + y * 2, b = 240, R = (s - d * 3) / 2, I = e + d, M = e + d + R + f, E = i + d;
    let D = (o === "startDate" ? I : M) + R / 2 - b / 2;
    D < e && (D = e), D + b > e + s && (D = e + s - b);
    const k = E + u + f;
    if (h < D || h > D + b || c < k || c > k + C) {
      this.state.filterDropdown.hoveredDate !== null && (this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
      return;
    }
    const P = (b - y * 2) / 7, L = new Date(n, a, 1).getDay(), W = new Date(n, a + 1, 0).getDate(), _ = k + g + m;
    let A = null;
    for (let z = 1; z <= W; z++) {
      const X = L + z - 1, $ = Math.floor(X / 7), tt = X % 7, Q = D + y + tt * P, st = _ + $ * x;
      if (h >= Q && h <= Q + P && c >= st && c <= st + x) {
        A = new Date(n, a, z);
        break;
      }
    }
    const N = r ? r.getTime() : null, V = A ? A.getTime() : null;
    N !== V && (this.state.filterDropdown.hoveredDate = A, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
  }
  /**
   * Handle filter dropdown hover
   */
  handleFilterDropdownHover(t) {
    if (!this.state.filterDropdown) return;
    const { mode: e, x: i, y: s, width: o, options: n, scrollTop: a } = this.state.filterDropdown;
    if (e === "dateRange") {
      this.handleDateRangeCalendarHover(t);
      return;
    }
    if (e !== "select" || !n) return;
    const r = this.getViewportCoords(t), l = r.x, h = r.y, c = J.DROPDOWN_ITEM_HEIGHT, d = J.DROPDOWN_MAX_VISIBLE, u = Math.min(n.length, d), f = 36, g = u * c;
    if (n.length > d) {
      const y = n.length * c, w = Math.max(20, g / y * g), C = g - w, b = a / (y - g) * C, R = i + o - 6 - 2;
      if (l >= R && l <= R + 6 && h >= s + f + b && h <= s + f + b + w) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }
    const m = s + f;
    if (l >= i && l <= i + o && h >= m && h <= m + g) {
      const x = h - m + a, y = Math.floor(x / c);
      y >= 0 && y < n.length && (this.state.filterDropdown.hoveredIndex = y, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
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
    const n = J.DROPDOWN_ITEM_HEIGHT, a = J.DROPDOWN_MAX_VISIBLE;
    let r;
    this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig ? r = ((u = this.state.dropdown.tagsConfig.options) == null ? void 0 : u.length) ?? 0 : r = ((f = this.state.dropdown.config.options) == null ? void 0 : f.length) ?? 0;
    const h = Math.min(r, a) * n, c = this.updateDropdownY(t, i ?? !1, h, { column: o }), d = this.updateDropdownX(t, e, { column: o });
    this.state.dropdown.x = d, this.state.dropdown.y = c.y, this.state.dropdown.showAbove = c.showAbove, this.eventEmitter.emit(S.DROPDOWN_HOVER);
  }
  /**
   * Close all dropdowns
   */
  closeAllDropdowns() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE, null)), this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE)), this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, null)), this.state.buttonsDropdown && (this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE)), this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE, null));
  }
  /**
   * Update filter dropdown position
   */
  updateFilterDropdownPosition() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.layoutManager.getLeafColumns(), i = e.findIndex((r) => r.key === t);
    if (i < 0) return;
    const s = e[i];
    if (!s) return;
    const o = this.layoutManager.getCellPosition(-1, i), n = this.layoutManager.getLayoutInfo().headerHeight;
    let a;
    s.fixed === "left" || s.fixed === "right" ? a = o.x : a = o.x - this.scrollState.scrollLeft, this.state.filterDropdown.x = a, this.state.filterDropdown.y = n, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Update date dropdown position
   */
  updateDateDropdownPosition() {
    if (!this.state.dateDropdown) return;
    const { cell: t, showAbove: e } = this.state.dateDropdown, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) return;
    const o = 68 + 6 * 28 + 16, n = Math.max(s.width ?? 100, 280), a = this.updateDropdownY(t, e ?? !1, o, { column: s }), r = this.updateDropdownX(t, n, { column: s });
    this.state.dateDropdown.x = r, this.state.dateDropdown.y = a.y, this.state.dateDropdown.width = n, this.state.dateDropdown.showAbove = a.showAbove, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN);
  }
  /**
   * Update color dropdown position
   */
  updateColorDropdownPosition() {
    if (!this.state.colorDropdown) return;
    const { cell: t, config: e } = this.state.colorDropdown, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) return;
    const o = e.presetColors || this.getDefaultPresetColors(), n = 8, a = Math.ceil(o.length / n), r = 24, l = 4, h = 8, c = a * (r + l) + h * 2 - l, d = Math.max(
      s.width ?? 100,
      n * (r + l) + h * 2 - l
    ), u = this.updateDropdownY(t, !1, c, { column: s }), f = this.updateDropdownX(t, d, { column: s });
    this.state.colorDropdown.x = f, this.state.colorDropdown.y = u.y, this.state.colorDropdown.width = d, this.eventEmitter.emit(S.COLOR_DROPDOWN_OPEN);
  }
  /**
   * Update buttons dropdown position
   */
  updateButtonsDropdownPosition() {
    if (!this.state.buttonsDropdown) return;
    const { cell: t, buttonRelativeX: e, buttonY: i, buttonHeight: s, buttons: o, showAbove: n } = this.state.buttonsDropdown, r = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!r) {
      this.state.buttonsDropdown = null;
      return;
    }
    const l = J.DROPDOWN_ITEM_HEIGHT, h = o.length * l, c = this.updateDropdownY(t, n, h, {
      column: r,
      anchorType: "button",
      buttonY: i,
      buttonHeight: s
    }), d = this.updateDropdownX(t, 120, {
      column: r,
      anchorType: "button",
      buttonRelativeX: e
    });
    this.state.buttonsDropdown.x = d, this.state.buttonsDropdown.y = c.y, this.state.buttonsDropdown.showAbove = c.showAbove, this.eventEmitter.emit(S.DROPDOWN_HOVER);
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
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, width: a, currentYear: r, currentMonth: l } = this.state.dateDropdown, h = 40, c = 28, d = 28, u = 8, g = h + c + 6 * d + u * 2;
    if (i >= o && i <= o + a && s >= n && s <= n + g) {
      const x = o + 20, y = o + a - 20;
      if (s >= n && s <= n + h) {
        if (i >= x - 6 - 5 && i <= x + 6 + 5)
          return l === 0 ? (this.state.dateDropdown.currentYear = r - 1, this.state.dateDropdown.currentMonth = 11) : this.state.dateDropdown.currentMonth = l - 1, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
        if (i >= y - 6 - 5 && i <= y + 6 + 5)
          return l === 11 ? (this.state.dateDropdown.currentYear = r + 1, this.state.dateDropdown.currentMonth = 0) : this.state.dateDropdown.currentMonth = l + 1, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
      }
      const w = (a - u * 2) / 7, b = new Date(r, l, 1).getDay(), R = new Date(r, l + 1, 0).getDate();
      for (let I = 1; I <= R; I++) {
        const M = b + I - 1, E = Math.floor(M / 7), T = M % 7, H = o + u + T * w, D = n + h + c + E * d;
        if (i >= H && i <= H + w && s >= D && s <= D + d) {
          const k = new Date(r, l, I), P = this.formatDate(k), B = this.state.dateDropdown.cell;
          return this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, null), this.eventEmitter.emit(S.DATE_SELECT, this.getCellInfo(B), P), !0;
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
      width: a,
      currentYear: r,
      currentMonth: l,
      hoveredDate: h
    } = this.state.dateDropdown, c = 40, d = 28, u = 28, f = 8, m = c + d + 6 * u + f * 2;
    let x = null;
    if (i >= o && i <= o + a && s >= n && s <= n + m) {
      const C = (a - f * 2) / 7, R = new Date(r, l, 1).getDay(), I = new Date(r, l + 1, 0).getDate();
      for (let M = 1; M <= I; M++) {
        const E = R + M - 1, T = Math.floor(E / 7), H = E % 7, D = o + f + H * C, k = n + c + d + T * u;
        if (i >= D && i <= D + C && s >= k && s <= k + u) {
          x = new Date(r, l, M);
          break;
        }
      }
    }
    const y = h ? h.getTime() : null, w = x ? x.getTime() : null;
    y !== w && (this.state.dateDropdown.hoveredDate = x, this.eventEmitter.emit(S.DATE_DROPDOWN_HOVER));
  }
  /**
   * Handle color dropdown click
   */
  handleColorDropdownClick(t) {
    if (!this.state.colorDropdown) return !1;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { cell: o, config: n, x: a, y: r, width: l } = this.state.colorDropdown, h = n.presetColors || this.getDefaultPresetColors(), c = 8, d = 24, u = 4, f = 8, m = Math.ceil(h.length / c) * (d + u) + f * 2 - u;
    if (i >= a && i <= a + l && s >= r && s <= r + m) {
      const x = Math.floor((i - a - f) / (d + u)), y = Math.floor((s - r - f) / (d + u));
      if (x >= 0 && x < c && y >= 0) {
        const w = y * c + x;
        if (w >= 0 && w < h.length) {
          const C = h[w];
          return this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE, null), this.eventEmitter.emit(S.COLOR_CHANGE, this.getCellInfo(o), C), !0;
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
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { config: o, x: n, y: a } = this.state.colorDropdown, r = o.presetColors || this.getDefaultPresetColors(), l = 8, h = 24, c = 4, d = 8, u = Math.floor((i - n - d) / (h + c)), f = Math.floor((s - a - d) / (h + c));
    let g = null;
    if (u >= 0 && u < l && f >= 0) {
      const m = f * l + u;
      m >= 0 && m < r.length && (g = r[m]);
    }
    this.state.colorDropdown.hoveredColor !== g && (this.state.colorDropdown.hoveredColor = g, this.eventEmitter.emit(S.COLOR_DROPDOWN_HOVER));
  }
};
v(J, "DROPDOWN_ITEM_HEIGHT", 32), v(J, "DROPDOWN_MAX_VISIBLE", 8);
let Nt = J;
const F = class F extends ft {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle image tooltip hover
   */
  handleImageTooltipHover(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: s, scrollTop: o, maxRows: n } = this.state.imageTooltip, a = this.getViewportCoords(t), r = a.x, l = a.y, h = F.IMAGE_SIZE, c = F.IMAGE_PADDING, d = F.IMAGE_GAP, u = F.IMAGES_PER_ROW, m = u * h + (u - 1) * d + c * 2 + 4 + 4, x = h + d, y = n * x + c * 2 - d, w = this.state.imageTooltip.hoveredIndex;
    if (r >= e && r <= e + m && l >= i && l <= i + y) {
      const C = Math.ceil(s.length / u), b = Math.floor(o / x), R = Math.min(C, b + n + 1);
      for (let I = b; I < R; I++)
        for (let M = 0; M < u; M++) {
          const E = I * u + M;
          if (E >= s.length) break;
          const T = e + c + M * (h + d), H = i + c + I * x - o;
          if (r >= T && r <= T + h && l >= H && l <= H + h)
            return this.state.imageTooltip.hoveredIndex = E, w !== E && this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL), !0;
        }
      return this.state.imageTooltip.hoveredIndex = -1, w !== -1 && this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL), !0;
    }
    return this.state.imageTooltip.hoveredIndex = -1, w !== -1 && this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL), !1;
  }
  /**
   * Handle image tooltip click
   */
  handleImageTooltipClick(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: s, cell: o, scrollTop: n, maxRows: a } = this.state.imageTooltip, r = this.getViewportCoords(t), l = r.x, h = r.y, c = F.IMAGE_SIZE, d = F.IMAGE_PADDING, u = F.IMAGE_GAP, f = F.IMAGES_PER_ROW, x = f * c + (f - 1) * u + d * 2 + 4 + 4, y = c + u, w = a * y + d * 2 - u;
    if (l < e || l > e + x || h < i || h > i + w)
      return !1;
    const C = l - e - d, b = h - i - d + n, R = Math.floor(C / (c + u)), I = Math.floor(b / y);
    if (R >= 0 && R < f && I >= 0) {
      const M = I * f + R;
      if (M >= 0 && M < s.length) {
        const E = s[M];
        E && this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(o), E, t);
      }
    }
    return !0;
  }
  /**
   * Handle image editor hover
   */
  handleImageEditorHover(t) {
    if (!this.state.imageEditor) return !1;
    const { x: e, y: i, images: s, pendingImages: o, scrollTop: n, maxRows: a } = this.state.imageEditor, r = this.getViewportCoords(t), l = r.x, h = r.y, c = F.IMAGE_SIZE, d = F.IMAGE_PADDING, u = F.IMAGE_GAP, f = F.IMAGES_PER_ROW, g = F.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, x = f * c + (f - 1) * u + d * 2 + 4 + 4, y = a * m + d * 2 - u, w = g + y, C = this.state.imageEditor.hoveredIndex;
    if (l < e || l > e + x || h < i || h > i + w)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !1;
    if (h >= i && h <= i + g)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !0;
    const b = i + g, R = s.length + o.length;
    for (let I = 0; I < a + 1; I++)
      for (let M = 0; M < f; M++) {
        const E = I * f + M;
        if (E >= R) break;
        const T = e + d + M * (c + u), H = b + d + I * m - n;
        if (l >= T && l <= T + c && h >= H && h <= H + c)
          return this.state.imageEditor.hoveredIndex = E, C !== E && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !0;
      }
    return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !0;
  }
  /**
   * Handle image editor click
   */
  handleImageEditorClick(t) {
    var R;
    if (!this.state.imageEditor) return "outside";
    const { x: e, y: i, images: s, cell: o, scrollTop: n, maxRows: a } = this.state.imageEditor, r = this.getViewportCoords(t), l = r.x, h = r.y, c = F.IMAGE_SIZE, d = F.IMAGE_PADDING, u = F.IMAGE_GAP, f = F.IMAGES_PER_ROW, g = F.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, x = f * c + (f - 1) * u + d * 2 + 4 + 4, y = a * m + d * 2 - u, w = g + y;
    if (l < e || l > e + x || h < i || h > i + w)
      return "outside";
    if (h >= i && h <= i + g)
      return "upload";
    const C = i + g, b = s.length + (((R = this.state.imageEditor.pendingImages) == null ? void 0 : R.length) ?? 0);
    for (let I = 0; I < a + 1; I++)
      for (let M = 0; M < f; M++) {
        const E = I * f + M;
        if (E >= b) break;
        const T = e + d + M * (c + u), H = C + d + I * m - n;
        if (l >= T && l <= T + c && h >= H && h <= H + c) {
          if (E < s.length) {
            const D = s[E];
            s.splice(E, 1), this.state.imageEditor.images = [...s], this.eventEmitter.emit(
              S.IMAGE_DELETE,
              this.getCellInfo(o),
              D,
              E
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
      s.data[Y(i)],
      s,
      i,
      this.state.imageEditor.cell.rowIndex
    ) : { image: s.data[Y(i)] }).image ?? {}, a = n.onUpload, r = n.maxCount, l = this.state.imageEditor.isSingleImage;
    let h;
    if (l)
      h = 1, this.state.imageEditor.images = [];
    else {
      const u = this.state.imageEditor.images.length + this.state.imageEditor.pendingImages.length;
      h = r !== void 0 ? r - u : t.length;
    }
    const c = t.slice(0, h), d = [];
    for (const u of c) {
      const f = await this.readFileAsDataURL(u);
      d.push({ file: u, preview: f });
    }
    if (this.state.imageEditor.pendingImages = [
      ...this.state.imageEditor.pendingImages,
      ...d
    ], this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), a)
      for (const u of d) {
        try {
          const f = await a(u.file), g = this.state.imageEditor.pendingImages.findIndex(
            (m) => m.preview === u.preview
          );
          g >= 0 && (this.state.imageEditor.pendingImages.splice(g, 1), this.state.imageEditor.images = [...this.state.imageEditor.images, f], this.eventEmitter.emit(
            S.IMAGE_UPLOAD,
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
        this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL);
      }
    else {
      for (const u of d) {
        const f = this.state.imageEditor.pendingImages.findIndex(
          (g) => g.preview === u.preview
        );
        f >= 0 && (this.state.imageEditor.pendingImages.splice(f, 1), this.state.imageEditor.images = [...this.state.imageEditor.images, u.preview], this.eventEmitter.emit(
          S.IMAGE_UPLOAD,
          this.getCellInfo(this.state.imageEditor.cell),
          u.preview
        ));
      }
      this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL);
    }
  }
  /**
   * Commit image editor changes
   */
  commitImageEditorChanges() {
    if (!this.state.imageEditor) return;
    const { cell: t, images: e, isSingleImage: i } = this.state.imageEditor, o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (o && n) {
      const a = n.data[Y(o)];
      let r;
      if (i) {
        const l = e[0] ?? null;
        typeof a == "string" ? r = l : Array.isArray(a) ? r = { src: l } : a && typeof a == "object" ? r = {
          ...a,
          src: l
        } : r = l;
      } else
        Array.isArray(a) ? r = e : a && typeof a == "object" ? r = {
          ...a,
          images: e
        } : r = e;
      this.eventEmitter.emit(S.EDIT_END, this.getCellInfo(t), r);
    }
    this.state.imageEditor = null, this.eventEmitter.emit(S.IMAGE_EDITOR_CLOSE);
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
    const n = F.IMAGE_SIZE, a = F.IMAGE_PADDING, r = F.IMAGE_GAP, l = F.IMAGES_PER_ROW, h = l * n + (l - 1) * r + a * 2, c = n + r, d = i * c + a * 2 - r, u = this.updateDropdownY(t, e, d, { column: o }), f = this.updateDropdownX(t, h, { column: o });
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
    const n = F.IMAGE_SIZE, a = F.IMAGE_PADDING, r = F.IMAGE_GAP, l = F.IMAGES_PER_ROW, h = F.IMAGE_UPLOAD_AREA_HEIGHT, c = n + r, d = l * n + (l - 1) * r + a * 2 + 4 + 4, u = i * c + a * 2 - r, f = h + u, g = this.updateDropdownY(t, e, f, { column: o }), m = this.updateDropdownX(t, d, { column: o });
    this.state.imageEditor.x = m, this.state.imageEditor.y = g.y, this.state.imageEditor.showAbove = g.showAbove;
  }
  /**
   * Handle drag over event for image editor
   */
  handleDragOver(t) {
    if (!this.state.imageEditor) return !1;
    t.preventDefault();
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, maxRows: a } = this.state.imageEditor, r = F.IMAGE_SIZE, l = F.IMAGE_PADDING, h = F.IMAGE_GAP, c = F.IMAGES_PER_ROW, d = F.IMAGE_UPLOAD_AREA_HEIGHT, u = r + h, f = c * r + (c - 1) * h + l * 2 + 4 + 4, g = a * u + l * 2 - h, m = d + g;
    return i >= o && i <= o + f && s >= n && s <= n + m ? (this.state.imageEditor.isDragging = !0, this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), !0) : !1;
  }
  /**
   * Handle drag leave event for image editor
   */
  handleDragLeave(t) {
    if (!this.state.imageEditor) return;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, maxRows: a } = this.state.imageEditor, r = F.IMAGE_SIZE, l = F.IMAGE_PADDING, h = F.IMAGE_GAP, c = F.IMAGES_PER_ROW, d = F.IMAGE_UPLOAD_AREA_HEIGHT, u = r + h, f = c * r + (c - 1) * h + l * 2 + 4 + 4, g = a * u + l * 2 - h, m = d + g;
    (i < o || i > o + f || s < n || s > n + m) && (this.state.imageEditor.isDragging = !1, this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL));
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
    return e.length > 0 && await this.handleFileUpload(e), this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), !0;
  }
};
v(F, "IMAGE_SIZE", 64), v(F, "IMAGE_PADDING", 8), v(F, "IMAGE_GAP", 8), v(F, "IMAGES_PER_ROW", 4), v(F, "IMAGE_UPLOAD_AREA_HEIGHT", 60);
let Ft = F;
const Ct = class Ct extends ft {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle context menu click
   */
  handleContextMenuClick(t) {
    if (!this.state.contextMenu) return !1;
    const { x: e, y: i, row: s, items: o } = this.state.contextMenu, n = this.getViewportCoords(t), a = n.x, r = n.y, l = 140, h = Ct.DROPDOWN_ITEM_HEIGHT, c = o.length * h;
    if (a >= e && a <= e + l && r >= i && r <= i + c) {
      const d = r - i, u = Math.floor(d / h), f = o[u];
      return !f || f.disabled || (f.key === "pin-top" ? this.eventEmitter.emit(S.ROW_PIN_CHANGE, s, "top") : f.key === "pin-bottom" ? this.eventEmitter.emit(S.ROW_PIN_CHANGE, s, "bottom") : f.key === "unpin" ? this.eventEmitter.emit(S.ROW_PIN_CHANGE, s, null) : f.key === "add-above" ? this.eventEmitter.emit(S.ROW_ADD_ABOVE, s) : f.key === "add-below" ? this.eventEmitter.emit(S.ROW_ADD_BELOW, s) : f.key === "delete" && this.eventEmitter.emit(S.ROW_DELETE, s), this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE)), !0;
    }
    return !1;
  }
  /**
   * Handle context menu hover
   */
  handleContextMenuHover(t) {
    if (!this.state.contextMenu) return;
    const { x: e, y: i, items: s, hoveredIndex: o } = this.state.contextMenu, n = this.getViewportCoords(t), a = n.x, r = n.y, l = 140, h = Ct.DROPDOWN_ITEM_HEIGHT, c = s.length * h;
    let d = -1;
    if (a >= e && a <= e + l && r >= i && r <= i + c) {
      const u = r - i;
      d = Math.floor(u / h);
    }
    d !== o && (this.state.contextMenu.hoveredIndex = d, this.eventEmitter.emit(S.CONTEXT_MENU_HOVER));
  }
  /**
   * Handle header context menu click
   */
  handleHeaderContextMenuClick(t) {
    if (!this.state.headerContextMenu) return !1;
    const { x: e, y: i, columnKey: s } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, a = o.y;
    return n >= e && n <= e + 120 && a >= i && a <= i + 32 ? (this.eventEmitter.emit(S.COLUMN_HIDE, s), this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE), !0) : !1;
  }
  /**
   * Handle header context menu hover
   */
  handleHeaderContextMenuHover(t) {
    if (!this.state.headerContextMenu) return;
    const { x: e, y: i, hoveredIndex: s } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, a = o.y, r = 120, l = 32;
    let h = -1;
    n >= e && n <= e + r && a >= i && a <= i + l && (h = 0), h !== s && (this.state.headerContextMenu.hoveredIndex = h, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_HOVER));
  }
  /**
   * Close context menus
   */
  closeContextMenus() {
    this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE));
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
v(Ct, "DROPDOWN_ITEM_HEIGHT", 32);
let Vt = Ct;
class Wi extends ft {
  constructor(e, i, s, o) {
    super(e, i);
    v(this, "sortConfig");
    v(this, "filterConfig");
    this.sortConfig = s, this.filterConfig = o;
  }
  /**
   * Handle header hover
   */
  handleHeaderHover(e, i, s) {
    const o = e.column, n = this.state.hoveredHeaderColumnKey;
    let a;
    if (o.fixed === "left")
      a = e.x;
    else if (o.fixed === "right") {
      const L = this.layoutManager.getRightFixedWidth(), _ = this.layoutManager.getViewportWidth() - L - (this.layoutManager.getLayoutInfo().totalWidth - L);
      a = e.x + _;
    } else
      a = e.x - this.scrollState.scrollLeft;
    const r = e.y, l = e.width, h = e.height, c = 8, d = 10, u = 10, f = a + c, g = r + (h - u) / 2, x = o.reorderable !== !1 && i >= f && i <= f + d && s >= g && s <= g + u;
    this.state.hoveredHeaderColumnKey = o.key;
    const y = (o == null ? void 0 : o.filterable) && e.isLeaf;
    let w, C;
    y ? (w = a + l - c - 10, C = w - 16) : C = a + l - c - 10;
    const b = r + h / 2, R = 8, I = 5, M = 2, E = 4, T = b - M - I - E, H = b + M + I + E, D = C - R / 2 - E, k = C + R / 2 + E, P = e.isLeaf && y && w !== void 0 && Math.abs(i - w) < 12, B = e.isLeaf && o && o.sortable !== !1 && i >= D && i <= k && s >= T && s <= H;
    x ? this.canvas.style.cursor = "grab" : P || B ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", this.state.hoveredCell = null, this.state.tooltip = null, n !== this.state.hoveredHeaderColumnKey && this.eventEmitter.emit(S.HEADER_HOVER, this.state.hoveredHeaderColumnKey);
  }
  /**
   * Handle header mouse down
   */
  handleHeaderMouseDown(e, i) {
    const s = this.getViewportCoords(i), o = s.x, n = s.y, a = this.layoutManager.getHeaderCellAtPosition(o, n);
    if (!a) return !1;
    const r = a.column;
    if (r.reorderable === !1 || this.layoutManager.isResizeHandleAtPosition(
      o + this.scrollState.scrollLeft,
      0
    ) >= 0)
      return !1;
    let h;
    if (r.fixed === "left")
      h = a.x;
    else if (r.fixed === "right") {
      const I = this.layoutManager.getRightFixedWidth(), E = this.layoutManager.getViewportWidth() - I, T = this.layoutManager.getLayoutInfo().totalWidth, H = E - (T - I);
      h = a.x + H;
    } else
      h = a.x - this.scrollState.scrollLeft;
    const c = a.y, d = a.height, u = 8, f = 10, g = 10, m = h + u, x = c + (d - g) / 2, y = o >= m && o <= m + f && n >= x && n <= x + g;
    if (a.isLeaf && !y || !a.isLeaf && !y)
      return !1;
    let w = r.key, C = e;
    if (!a.isLeaf && r.children && r.children.length > 0) {
      const I = this.getFirstLeaf(r);
      I && (w = r.key, C = this.layoutManager.getLeafColumnIndex(I), C < 0 && (C = e));
    }
    const b = this.calculateSiblingColumns(r), R = b.findIndex((I) => I.key === r.key);
    return this.state.columnReorderState = {
      dragColumnIndex: C,
      dragColumnKey: w,
      dragStartX: o,
      currentX: o,
      targetColumnIndex: C,
      isParentColumn: !a.isLeaf,
      isFixedColumn: !!r.fixed,
      siblingColumns: b,
      dragSiblingIndex: R,
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
    this.eventEmitter.emit(S.HEADER_CLICK, s, e, i);
    const o = this.getViewportCoords(i), n = o.x, a = o.y, r = this.layoutManager.getLeafHeaderCellViewportPosition(e);
    if (!r) return;
    const l = r.x, h = r.y, c = r.width, d = r.height, u = s.filterable, f = 8;
    let g, m;
    if (u ? (g = l + c - f - 10, m = g - 16) : m = l + c - f - 10, u && g !== void 0 && Math.abs(n - g) < 12) {
      this.openFilterDropdown(s, e);
      return;
    }
    if (s.sortable === !1)
      return;
    const x = h + d / 2, y = 8, w = 5, C = 2, b = 4, R = x - C - w - b, I = x - C + b, M = x + C - b, E = x + C + w + b, T = m - y / 2 - b, H = m + y / 2 + b;
    if (n >= T && n <= H && a >= R && a <= E) {
      const k = a >= R && a <= I, P = a >= M && a <= E;
      k ? this.setSortDirection(s, "asc", i) : P ? this.setSortDirection(s, "desc", i) : this.toggleSort(s, i);
    }
  }
  /**
   * Set sort direction
   */
  setSortDirection(e, i, s) {
    const o = this.sortConfig.findIndex((a) => a.column === e.key);
    if ((o >= 0 ? this.sortConfig[o].direction : "none") === i) {
      s.shiftKey ? o >= 0 && this.sortConfig.splice(o, 1) : this.sortConfig = [], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
      return;
    }
    s.shiftKey ? o >= 0 ? this.sortConfig[o].direction = i : this.sortConfig.push({ column: e.key, direction: i }) : this.sortConfig = [{ column: e.key, direction: i }], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
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
    i.shiftKey ? s >= 0 ? o === "none" ? this.sortConfig.splice(s, 1) : this.sortConfig[s].direction = o : o !== "none" && this.sortConfig.push({ column: e.key, direction: o }) : o === "none" ? this.sortConfig = [] : this.sortConfig = [{ column: e.key, direction: o }], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Open filter dropdown
   */
  openFilterDropdown(e, i) {
    const s = this.layoutManager.getCellPosition(-1, i), o = this.layoutManager.getLayoutInfo().headerHeight, n = Xe(e);
    if (!n) return;
    let a;
    e.fixed === "left" || e.fixed === "right" ? a = s.x : a = s.x - this.scrollState.scrollLeft;
    const r = this.allRows.length > 0 ? this.allRows : this.rows, l = this.filterConfig.find((h) => h.column === e.key);
    switch (n) {
      case "search": {
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "search",
          x: a,
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
        const h = pe(e, r, 0), c = l ? l.value : [], d = h.length === 0 && r.length > 0;
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "select",
          x: a,
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
          x: a,
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
          x: a,
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
          x: a,
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
    this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
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
    const n = this.layoutManager.getLeftFixedWidth(), a = this.layoutManager.getRightFixedWidth(), r = this.layoutManager.getViewportWidth();
    for (const l of o) {
      const h = this.getChildLeafCount(l), c = this.getFirstLeaf(l), d = c ? this.layoutManager.getLeafColumnIndex(c) : -1;
      if (d < 0) continue;
      const u = this.layoutManager.getColumnWidth(l), f = l.fixed;
      let g = 0;
      if (f === "left")
        for (let m = 0; m < d; m++) {
          const x = this.layoutManager.getLeafColumn(m);
          (x == null ? void 0 : x.fixed) === "left" && (g += this.layoutManager.getColumnWidthByIndex(m));
        }
      else if (f === "right") {
        g = r - a;
        for (let m = 0; m < d; m++) {
          const x = this.layoutManager.getLeafColumn(m);
          (x == null ? void 0 : x.fixed) === "right" && (g += this.layoutManager.getColumnWidthByIndex(m));
        }
      } else {
        g = n;
        for (let m = 0; m < d; m++) {
          const x = this.layoutManager.getLeafColumn(m);
          x != null && x.fixed || (g += this.layoutManager.getColumnWidthByIndex(m));
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
class Ai extends ft {
  constructor(e, i) {
    super(e, i);
    /**
     * Handle expand icon click
     */
    v(this, "handleExpandIconClick", (e, i, s) => {
      const o = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), r = this.layoutManager.getLeafColumns()[e.columnIndex], l = i.clientX - o.left, h = this.getCellViewportX(n, r), c = l - h, d = s.level ?? 0, u = 8, f = 8, g = d * 16, m = u + g, x = m + f + 4;
      return c >= m && c <= x ? (this.eventEmitter.emit(S.EXPAND, s, e.rowIndex, !s.expanded), !0) : !1;
    });
  }
  /**
   * Handle progress bar click
   */
  handleProgressClick(e, i, s, o, n) {
    if (!s.interactive || n && o && !this.editorRegistry.getStrategy(o).canEdit(e, n, o))
      return !1;
    const a = this.canvas.getBoundingClientRect(), r = i.clientX - a.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = s.shape ?? "line";
    if (c === "line") {
      const u = s.size ?? "medium", f = s.height ?? (u === "small" ? 6 : u === "large" ? 16 : 10), g = s.textPosition ?? "right", x = (s.showText ?? !0) && g === "right" ? 40 : 0, y = s.width ?? l.width - 8 * 2 - x, w = h + 8, C = this.getCellViewportY(e.rowIndex) + (l.height - f) / 2, b = i.clientY - a.top, R = r - w, I = b - C;
      if (R >= 0 && R <= y && I >= 0 && I <= f) {
        const M = s.precision ?? 0, E = Math.max(0, Math.min(100, R / y * 100)), T = M === 0 ? Math.round(E) : Number(E.toFixed(M));
        return this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), T), !0;
      }
    } else if (c === "circle" || c === "dashboard") {
      const d = i.clientY - a.top, u = this.getCellViewportY(e.rowIndex), f = s.size ?? "medium";
      let g, m = 0;
      c === "circle" ? g = f === "small" ? 0.6 : f === "large" ? 0.9 : 0.75 : (g = f === "small" ? 0.7 : f === "large" ? 0.95 : 0.85, m = l.height * 0.05);
      const x = Math.floor(l.height * g), y = s.width ?? x, w = s.strokeWidth ?? Math.max(2, Math.round(y * 0.12)), C = (y - w) / 2, b = h + l.width / 2, R = u + l.height / 2 + m, I = r - b, M = d - R, E = Math.sqrt(I * I + M * M);
      if (E >= C - w && E <= C + w) {
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
        return H = D === 0 ? Math.round(H) : Number(H.toFixed(D)), this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), H), !0;
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
    const a = this.canvas.getBoundingClientRect(), r = i.clientX - a.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = r - h, d = s.max ?? 5, u = s.starSize ?? 16, f = s.allowHalf ?? !1, g = s.value ?? 0, m = d * u, x = (l.width - m) / 2, y = (l.height - u) / 2, w = i.clientY - a.top, C = l.y - this.context.scrollState.scrollTop, b = w - C;
    if (b < y || b > y + u) return !1;
    for (let R = 0; R < d; R++) {
      const I = x + R * u;
      if (c >= I && c <= I + u) {
        let M;
        return f ? (c - I < u / 2 ? M = R + 0.5 : M = R + 1, M === g && (M = 0)) : (M = R + 1, M === g && (M = 0)), M = Math.min(M, d), this.eventEmitter.emit(S.RATING_CHANGE, this.getCellInfo(e), M), !0;
      }
    }
    return !1;
  }
  /**
   * Get clicked radio option
   */
  getClickedRadioOption(e, i, s) {
    const o = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), r = this.layoutManager.getLeafColumns()[e.columnIndex], l = i.clientX - o.left, h = i.clientY - o.top, c = this.getCellViewportX(n, r), d = l - c, u = h - this.getCellViewportY(e.rowIndex), f = 8, g = 16, m = 4, x = n.width - f;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let y = f;
    for (let w = 0; w < s.length; w++) {
      const C = s[w], b = this.ctx.measureText(C.label).width, R = g + m + b + f;
      if (y + R - f > x)
        break;
      const I = y, M = (n.height - g) / 2, E = M + g / 2, T = d >= I && d <= I + g && u >= M && u <= M + g, H = I + g + m, D = d >= H && d <= H + b && u >= E - 10 && u <= E + 10;
      if (T || D)
        return C;
      y += R;
    }
    return null;
  }
}
class _i extends ft {
  constructor(e, i) {
    super(e, i);
    v(this, "buttonHoverAnimationRunning", !1);
    v(this, "switchAnimationRunning", !1);
    v(this, "isDestroyed", !1);
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
      const a = i - o.startTime, r = Math.abs(o.targetProgress - o.startProgress);
      if (r === 0) {
        this.state.buttonHoverStates.delete(n);
        return;
      }
      const l = e * r;
      let h = a / l;
      h = Math.max(0, Math.min(1, h));
      const c = o.startProgress + (o.targetProgress - o.startProgress) * h;
      o.progress = c, h >= 1 ? o.targetProgress === 0 && this.state.buttonHoverStates.delete(n) : s = !0;
    }), this.eventEmitter.emit(S.BUTTON_HOVER_ANIMATION_UPDATE), s ? requestAnimationFrame(() => this.runButtonHoverAnimationLoop()) : this.buttonHoverAnimationRunning = !1;
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
      const a = i - o.startTime, r = Math.abs(o.targetProgress - o.startProgress), l = e * r;
      let h = a / l;
      h = Math.max(0, Math.min(1, h));
      const c = o.startProgress + (o.targetProgress - o.startProgress) * h;
      o.progress = c, h >= 1 ? this.state.switchAnimations.delete(n) : s = !0;
    }), this.eventEmitter.emit(S.SWITCH_ANIMATION_UPDATE), s ? requestAnimationFrame(() => this.runSwitchAnimationLoop()) : this.switchAnimationRunning = !1;
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
const ae = 64;
class Ni extends ft {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Get image size constant
   */
  static get IMAGE_SIZE() {
    return ae;
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
    const o = ut(i, s, t.rowIndex), n = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), a = this.getCellViewportX(n, i), r = this.getCellViewportY(t.rowIndex);
    if (o.type === O.TAG && o.tags) {
      this.handleTagsTooltip(t, o.tags, n, a);
      return;
    }
    if (o.type === O.SELECT && o.select) {
      this.handleSelectTooltip(t, o.select, n, a);
      return;
    }
    if (o.type === O.IMAGE && o.image) {
      this.handleImageTooltip(t, o.image, n, a, r);
      return;
    }
    if (o.text) {
      this.handleTextTooltip(t, o.text, n, a);
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
    const n = 8, a = o.width - n * 2, l = this.getFontSize() * 1.5, h = Ot(o.height, l, n);
    if (!(h > 1 ? Pt(this.ctx, s, a, h).isTruncated : this.ctx.measureText(s).width > a)) {
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
    const o = this.layoutManager.getRowBandsForRender(), n = e === "summary-top" ? o.summaryTop : o.summaryBottom, a = n.rows.indexOf(t);
    if (a < 0) return null;
    const r = this.layoutManager.getColumnOffset(i), l = this.layoutManager.getColumnOffset(s) + this.layoutManager.getColumnWidthByIndex(s), h = this.layoutManager.getLeafColumn(i), c = h != null && h.fixed ? r : r - this.scrollState.scrollLeft, d = n.y + n.rows.slice(0, a).reduce((u, f) => u + f.height, 0);
    return {
      x: c,
      y: d,
      width: l - r,
      height: t.height
    };
  }
  /**
   * Handle tags tooltip
   */
  handleTagsTooltip(t, e, i, s) {
    const o = this.getFontSize(), { isTruncated: n } = ge(this.ctx, e, i.width, i.height, o);
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
    const a = i.width - 16 - 20;
    let r = "";
    const l = e.value;
    if (e.multiple && Array.isArray(l))
      l.length > 0 && (r = l.map((c) => {
        const d = e.options.find((u) => u.value === c);
        return (d == null ? void 0 : d.label) ?? String(c);
      }).join(", "));
    else if (l != null) {
      const h = e.options.find((c) => c.value === l);
      r = (h == null ? void 0 : h.label) ?? String(l);
    }
    if (r && this.ctx.measureText(r).width > a) {
      this.state.tooltip = {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        x: s,
        y: this.getCellViewportY(t.rowIndex),
        width: i.width,
        content: { type: "text", text: r }
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
    const a = this.canvas.getBoundingClientRect(), r = ae, l = 8, h = 8, c = 4, d = Math.ceil(n.length / c);
    let u;
    d <= 1 ? u = 1 : d <= 2 ? u = 2 : u = 3;
    const f = c * r + (c - 1) * h + l * 2, g = r + h, m = u * g + l * 2 - h;
    let x = o + i.height, y = !1;
    x + m > a.height && (x = o - m, y = !0);
    let w = s;
    w + f > a.width && (w = a.width - f - 4), w < 0 && (w = 4), this.state.imageTooltip = {
      cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
      x: w,
      y: x,
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
    const n = i.width - 16, r = this.getFontSize() * 1.5, l = Ot(i.height, r, 8);
    if (l > 1 ? Pt(this.ctx, e, n, l).isTruncated : this.ctx.measureText(e).width > n) {
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
const K = class K {
  constructor(t, e, i, s, o, n, a = ht, r) {
    v(this, "state");
    v(this, "scrollState");
    v(this, "scrollbarState");
    v(this, "layoutManager");
    v(this, "eventEmitter");
    v(this, "canvas");
    v(this, "ctx");
    v(this, "editingConfig");
    v(this, "dataManager");
    v(this, "sortConfig", []);
    v(this, "filterConfig", []);
    v(this, "expandColumnKey", null);
    v(this, "isDestroyed", !1);
    // Handler instances
    v(this, "editingHandler");
    v(this, "dropdownHandler");
    v(this, "selectionHandler");
    v(this, "navigationHandler");
    v(this, "contextMenuHandler");
    v(this, "imageHandler");
    v(this, "headerHandler");
    v(this, "controlClickHandler");
    v(this, "buttonAnimationHandler");
    v(this, "tooltipHandler");
    v(this, "resizeColumnIndex", -1);
    v(this, "resizeStartX", 0);
    v(this, "resizeStartWidth", 0);
    // 用于检测双击，防止双击时触发 link 跳转
    v(this, "_lastClickTime", 0);
    v(this, "_lastClickCell", null);
    v(this, "getScrollbarBounds", () => ({ vertical: null, horizontal: null }));
    // 懒加载相关
    v(this, "lazyLoadEnabled", !1);
    v(this, "lazyLoadThreshold", 5);
    v(this, "isLoadingMore", !1);
    v(this, "hasMoreData", !0);
    // 是否还有更多数据
    v(this, "rowHeightResizeEnabled", !1);
    v(this, "rowResizable", !0);
    v(this, "enableRowPinning", !1);
    v(this, "rowPinnable", !0);
    v(this, "locale");
    v(this, "handlerContext", null);
    v(this, "editorRegistry");
    /** 校验失败时阻止下拉关闭的回调（调用实际 validation hook） */
    v(this, "shouldBlockDropdownClose", null);
    /** 校验失败时阻止关闭编辑态的回调（调用实际 commit/validation hook）
     * 接收 mousedown 事件以便在 DOM 编辑器场景下 preventDefault 阻止焦点转移 */
    v(this, "shouldBlockEditingClose", null);
    v(this, "handleMouseDown", async (t) => {
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      if (this.state.contextMenu) {
        if (this.contextMenuHandler.handleContextMenuClick(t)) return;
        this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE);
        return;
      }
      if (this.state.headerContextMenu) {
        if (this.contextMenuHandler.handleHeaderContextMenuClick(t)) return;
        this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE);
        return;
      }
      if (this.state.filterDropdown) {
        if (this.dropdownHandler.handleFilterDropdownClick(t)) return;
        this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE);
        return;
      }
      if (this.state.dateDropdown) {
        if (this.dropdownHandler.handleDateDropdownClick(t) || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const a = this.state.dateDropdown.cell;
        this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, a);
        return;
      }
      if (this.state.colorDropdown) {
        if (this.dropdownHandler.handleColorDropdownClick(t) || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const a = this.state.colorDropdown.cell;
        this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE, a);
        return;
      }
      if (this.state.dropdown) {
        if (this.dropdownHandler.handleDropdownClick(t)) return;
        const a = this.state.dropdown.cell;
        if (this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(a))
          return;
        this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE, a);
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
          const a = n;
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
            t.shiftKey && this.state.selectedCells.length > 0 ? this.selectionHandler.handleRangeSelection(o.cell) : t.ctrlKey || t.metaKey ? this.selectionHandler.handleToggleSelection(o.cell) : (this.selectionHandler.handleSingleSelection(o.cell), a || (this.state.isSelecting = !0, this.state.selectionStart = o.cell));
            const r = this.getCellInfo(o.cell);
            r && this.eventEmitter.emit(S.CELL_CLICK, r, t);
          }
          return;
        case "outside":
          return;
      }
    });
    v(this, "handleDragOver", (t) => {
      this.imageHandler.handleDragOver(t);
    });
    v(this, "handleDragLeave", (t) => {
      this.imageHandler.handleDragLeave(t);
    });
    v(this, "handleDrop", async (t) => {
      await this.imageHandler.handleDrop(t);
    });
    v(this, "handleContextMenu", async (t) => {
      if (t.preventDefault(), this.shouldBlockEditingClose && await this.shouldBlockEditingClose(t))
        return;
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE)), this.closeAllDropdowns();
      const n = this.layoutManager.getLayoutInfo().headerHeight;
      if (s <= n) {
        const m = this.layoutManager.getHeaderCellAtPosition(i, s);
        if (m) {
          const x = m.column;
          if (x.hideable === !1) return;
          const y = this.canvas.getBoundingClientRect(), w = 120, C = 32;
          let b = i, R = s;
          b + w > y.width && (b = y.width - w - 8), b < 0 && (b = 8), R + C > y.height && (R = y.height - C - 8), this.state.headerContextMenu = {
            x: b,
            y: R,
            columnKey: x.key,
            columnIndex: m.colIndex,
            hoveredIndex: -1
          }, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_OPEN);
          return;
        }
        return;
      }
      const a = this.layoutManager.getRowHitAtViewportPosition(
        i,
        s,
        this.scrollState.scrollTop
      );
      if (!a || a.band === "summary-top" || a.band === "summary-bottom") return;
      const r = a.row, l = this.getRowContextMenuItems(r), h = this.canvas.getBoundingClientRect(), c = 140, d = K.DROPDOWN_ITEM_HEIGHT, u = l.length * d;
      let f = i, g = s;
      f + c > h.width && (f = h.width - c - 8), f < 0 && (f = 8), g + u > h.height && (g = h.height - u - 8), g < 0 && (g = 8), this.state.contextMenu = {
        x: f,
        y: g,
        row: r,
        hoveredIndex: -1,
        items: l
      }, this.eventEmitter.emit(S.CONTEXT_MENU_OPEN);
    });
    v(this, "handleDocumentMouseMove", (t) => {
      var e;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { min: i, max: s } = this.layoutManager.getRowHeightBounds(), o = t.clientY - this.state.rowResizeState.startY;
        this.state.rowResizeState.displayHeight = Z(
          this.state.rowResizeState.startHeight + o,
          i,
          s
        ), this.eventEmitter.emit(S.ROW_RESIZE_DRAG);
        return;
      }
      if ((e = this.state.filterDropdown) != null && e.isScrollbarDragging) {
        const { options: i, scrollbarDragStartY: s, scrollbarDragStartScrollTop: o } = this.state.filterDropdown;
        if (!i) return;
        const n = K.DROPDOWN_ITEM_HEIGHT, a = K.DROPDOWN_MAX_VISIBLE, l = Math.min(i.length, a) * n, h = i.length * n, c = Math.max(20, l / h * l), d = l - c, f = (t.clientY - (s ?? 0)) / d, g = h - l, m = (o ?? 0) + f * g;
        this.state.filterDropdown.scrollTop = Z(m, 0, g), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
        return;
      }
      if (this.scrollbarState.verticalDragging) {
        const i = this.layoutManager.getLayoutInfo(), s = i.headerHeight, o = this.canvas.height / (window.devicePixelRatio || 1), n = o - s, a = Math.max(30, o / i.totalHeight * n), r = n - a, h = (t.clientY - this.scrollbarState.dragStartY) / r, c = this.scrollbarState.dragStartScrollTop + h * this.scrollState.maxScrollTop;
        this.scrollState.scrollTop = Z(c, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
          S.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
      if (this.scrollbarState.horizontalDragging) {
        const i = this.layoutManager.getLayoutInfo(), s = this.canvas.width / (window.devicePixelRatio || 1), o = Math.max(30, s / i.totalWidth * s), n = s - o, r = (t.clientX - this.scrollbarState.dragStartX) / n, l = this.scrollbarState.dragStartScrollLeft + r * this.scrollState.maxScrollLeft;
        this.scrollState.scrollLeft = Z(l, 0, this.scrollState.maxScrollLeft), this.eventEmitter.emit(
          S.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
    });
    v(this, "handleDocumentMouseUp", () => {
      var t;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, s = this.rows[e];
        s && this.eventEmitter.emit(S.ROW_HEIGHT_CHANGE, s, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if ((t = this.state.filterDropdown) != null && t.isScrollbarDragging) {
        this.state.filterDropdown.isScrollbarDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) && (this.scrollbarState.verticalDragging = !1, this.scrollbarState.horizontalDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents());
    });
    v(this, "handleMouseMove", (t) => {
      var n, a;
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
        const r = this.layoutManager.getLeafColumn(this.resizeColumnIndex);
        if (r) {
          let l = t.clientX - this.resizeStartX;
          r.fixed === "right" && (l = -l);
          const h = Math.max(50, this.resizeStartWidth + l);
          this.layoutManager.setColumnWidth(r.key, h), this.eventEmitter.emit(S.COLUMN_RESIZE, r, h);
        }
        return;
      }
      if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
        this.handleProgressDragMove(t);
        return;
      }
      if (this.state.columnReorderState && !this.state.isDragging) {
        const r = this.canvas.getBoundingClientRect(), l = t.clientX - r.left;
        Math.abs(l - this.state.columnReorderState.dragStartX) > 5 && (this.state.isDragging = !0, this.state.dragType = "column-reorder", this.bindDocumentEvents());
      }
      if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
        const r = this.canvas.getBoundingClientRect(), l = t.clientX - r.left;
        this.state.columnReorderState.currentX = l;
        const h = this.state.columnReorderState, c = h.siblingColumns, d = h.dragSiblingIndex;
        if (!c || c.length === 0) {
          this.eventEmitter.emit(S.COLUMN_REORDER_DRAG);
          return;
        }
        const u = Date.now();
        if (h.lastSwapTime && u - h.lastSwapTime < 50) {
          this.eventEmitter.emit(S.COLUMN_REORDER_DRAG);
          return;
        }
        let f = -1, g = 0;
        for (let m = 0; m < c.length; m++) {
          const x = c[m];
          if (l >= x.left && l < x.right) {
            f = m, g = x.center;
            break;
          }
        }
        if (f === -1 && (h.lastSwapTargetKey = void 0), f !== -1 && f !== d) {
          const m = c[d], x = c[f];
          if (m && x) {
            if (h.lastSwapTargetKey === x.key) {
              this.eventEmitter.emit(S.COLUMN_REORDER_DRAG);
              return;
            }
            let y = !1;
            if ((f > d ? "right" : "left") === "right" ? y = l >= g : y = l < g, y) {
              this.eventEmitter.emit(S.COLUMN_SWAP, m.key, x.key), h.lastSwapTime = u, h.lastSwapTargetKey = void 0;
              const C = this.layoutManager.getColumnByKey(h.dragColumnKey);
              if (C) {
                const b = this.headerHandler.calculateSiblingColumns(C), R = b.findIndex(
                  (M) => M.key === h.dragColumnKey
                );
                h.siblingColumns = b, h.dragSiblingIndex = R >= 0 ? R : d;
                const I = b[h.dragSiblingIndex];
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
        this.eventEmitter.emit(S.COLUMN_REORDER_DRAG);
        return;
      }
      if (this.state.isSelecting && this.state.selectionStart) {
        const r = this.layoutManager.hitTest(i, s, this.getScrollbarBounds());
        r.region === "cell" && r.cell && r.cell.rowIndex >= 0 && this.selectionHandler.handleRangeSelection(r.cell);
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
        const r = o.cell;
        this.updateButtonHoverState(r, i, s);
        const l = this.layoutManager.getLeafColumns(), h = r.columnIndex >= 0 ? l[r.columnIndex] : void 0, c = r.rowIndex >= 0 ? this.rows[r.rowIndex] : void 0;
        if ((h && c ? !this.editorRegistry.getStrategy(h).canEdit(r, c, h) : !1) ? this.canvas.style.cursor = "not-allowed" : this.isClickableElement(r, i, s) ? this.canvas.style.cursor = "pointer" : h && h.key.startsWith("__hidden_placeholder__") ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", ((n = this.state.hoveredCell) == null ? void 0 : n.rowIndex) !== r.rowIndex || ((a = this.state.hoveredCell) == null ? void 0 : a.columnIndex) !== r.columnIndex) {
          this.state.hoveredCell = r.rowIndex >= 0 ? r : null;
          const u = this.state.hoveredCell ? this.getCellInfo(this.state.hoveredCell) : null;
          this.eventEmitter.emit(S.CELL_HOVER, u, t);
        }
        this.updateImageHoverIndex(r, i, s), this.updateButtonsHoverIndex(r, i, s), this.state.hoveredHeaderColumnKey !== void 0 && (this.state.hoveredHeaderColumnKey = void 0, this.eventEmitter.emit(S.HEADER_HOVER, void 0)), this.checkTooltip(r);
      }
    });
    v(this, "startButtonHoverAnimationLoop", () => {
      this.buttonAnimationHandler.startButtonHoverAnimationLoop();
    });
    v(this, "getButtonHoverStates", () => this.buttonAnimationHandler.getButtonHoverStates());
    v(this, "checkTooltip", (t) => {
      this.tooltipHandler.checkTooltip(t);
    });
    v(this, "handleMouseUp", (t) => {
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, s = this.rows[e];
        s && this.eventEmitter.emit(S.ROW_HEIGHT_CHANGE, s, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
        const { cell: e, displayValue: i } = this.state.progressDragState;
        this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), i), this.state.isDragging = !1, this.state.dragType = null, this.state.progressDragState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
        const { dragColumnIndex: e, targetColumnIndex: i } = this.state.columnReorderState;
        e !== i && i >= 0 && this.eventEmitter.emit(S.COLUMN_REORDER, e, i), this.state.isDragging = !1, this.state.dragType = null, this.state.columnReorderState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents(), this.eventEmitter.emit(S.COLUMN_REORDER_DRAG);
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
    v(this, "handleMouseLeave", () => {
      const t = this.state.hoveredHeaderColumnKey !== void 0;
      this.state.hoveredCell = null, this.state.hoveredHeaderColumnKey = void 0, this.state.hoveredImageIndex = -1, this.state.hoveredButtonIndex = -1, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.columnReorderState = void 0, this.scrollbarState.verticalHovered = !1, this.scrollbarState.horizontalHovered = !1, this.clearAllButtonHoverStates(), t && this.eventEmitter.emit(S.HEADER_HOVER, void 0);
    });
    v(this, "handleDblClick", async (t) => {
      var h;
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose(t))
        return;
      if (this.state.dateDropdown) {
        const { x: c, y: d, width: u } = this.state.dateDropdown, w = 40 + 28 + 6 * 28 + 8 * 2;
        if (i >= c && i <= c + u && s >= d && s <= d + w || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const C = this.state.dateDropdown.cell;
        this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, C);
      }
      if (this.state.dropdown) {
        const { x: c, y: d, width: u, type: f, tagsConfig: g, config: m } = this.state.dropdown, x = K.DROPDOWN_ITEM_HEIGHT, y = K.DROPDOWN_MAX_VISIBLE;
        let w;
        f === "tags" && g ? w = ((h = g.options) == null ? void 0 : h.length) ?? 0 : w = m.options.length;
        const b = Math.min(w, y) * x;
        if (i >= c && i <= c + u && s >= d && s <= d + b)
          return;
        const R = this.state.dropdown.cell;
        if (this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(R))
          return;
        this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE, null);
      }
      if (this.state.filterDropdown) {
        const { x: c, y: d, width: u, mode: f, options: g } = this.state.filterDropdown, m = 8, x = 36, y = K.DROPDOWN_ITEM_HEIGHT, w = K.DROPDOWN_MAX_VISIBLE;
        let C;
        switch (f) {
          case "search": {
            C = 36 + x + m;
            break;
          }
          case "select": {
            C = 36 + Math.min((g == null ? void 0 : g.length) ?? 0, w) * y + x;
            break;
          }
          case "range": {
            C = m + 32 + 8 + x + m;
            break;
          }
          case "boolean": {
            C = 32 * 3 + x;
            break;
          }
          case "dateRange": {
            C = m + 32 + 8 + x + m;
            break;
          }
          default:
            C = 200;
        }
        if (i >= c && i <= c + u && s >= d && s <= d + C)
          return;
        this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE);
      }
      const o = this.layoutManager.getCellAtViewportPosition(
        i,
        s,
        this.scrollState.scrollTop
      );
      if (!o || o.rowIndex < 0) return;
      const a = this.layoutManager.getLeafColumns()[o.columnIndex], r = this.rows[o.rowIndex], l = [
        O.CHECKBOX,
        O.RADIO,
        O.BUTTON,
        O.BUTTONS,
        O.SWITCH,
        O.RATING
      ];
      if (a && r) {
        const c = ut(a, r, o.rowIndex);
        if (c.type && l.includes(c.type))
          return;
        if (c.type === O.PROGRESS && c.progress) {
          if (c.progress.interactive !== !0 || !this.editorRegistry.getStrategy(a).canEdit(o, r, a)) return;
          this.eventEmitter.emit(S.CELL_DBL_CLICK, this.getCellInfo(o), t), this.eventEmitter.emit(S.ROW_DBL_CLICK, r, o.rowIndex, t), this.editingConfig.enabled !== !1 && this.startEditing(o, {
            value: String(c.progress.value),
            type: "number",
            placeholder: "0-100"
          });
          return;
        }
        if (c.type === O.COLOR && c.color) {
          const d = this.layoutManager.getCellPosition(o.rowIndex, o.columnIndex), u = this.getCellViewportX(d, a), f = this.getCellViewportY(o.rowIndex), m = Math.min(d.height - 8 * 2, 24), x = u + (d.width - m) / 2, y = f + (d.height - m) / 2;
          if (!(i >= x && i <= x + m && s >= y && s <= y + m)) return;
        }
        if (!this.editorRegistry.getStrategy(a).canEdit(o, r, a)) return;
        if (this.eventEmitter.emit(S.CELL_DBL_CLICK, this.getCellInfo(o), t), this.eventEmitter.emit(S.ROW_DBL_CLICK, r, o.rowIndex, t), this.editingConfig.enabled !== !1) {
          const d = this.getEditConfig(a, r, o.rowIndex);
          d ? d.type === O.SELECT && d.select ? this.startSelectEditing(o, d.select) : d.type === O.TAG && d.tags ? this.startTagsEditing(o, d.tags) : d.type === O.DATE && d.date ? this.startDateEditing(o, d.date) : d.type === O.COLOR && d.color ? this.startColorEditing(o, d.color) : d.type === O.INPUT || !d.type ? this.startEditing(o, d.input) : this.startEditing(o, d.input) : c.type === O.SELECT && c.select ? this.startSelectEditing(o, c.select) : c.type === O.TAG && c.tags && c.tags.editable ? this.startTagsEditing(o, c.tags) : c.type === O.DATE && c.date ? this.startDateEditing(o, c.date) : c.type === O.COLOR && c.color ? this.startColorEditing(o, c.color) : c.type === O.IMAGE && c.image ? this.startImageEditing(o, c.image) : this.startEditing(o, c.input);
        }
      }
    });
    v(this, "handleControlClick", (t, e) => {
      var r, l;
      const s = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.rows[t.rowIndex];
      if (!s || !o) return !1;
      if (s.key.startsWith("__hidden_placeholder__")) {
        const h = s._hiddenColumnKey;
        if (h)
          return this.eventEmitter.emit(S.COLUMN_SHOW, h), !0;
      }
      if (this.expandColumnKey === s.key && o.children && o.children.length > 0 && this.handleExpandIconClick(t, e, o))
        return !0;
      const n = ut(s, o, t.rowIndex), a = !this.editorRegistry.getStrategy(s).canEdit(t, o, s);
      if (n.type === O.CHECKBOX && n.checkbox) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = 16, x = f + (h.width - m) / 2, y = g + (h.height - m) / 2;
        if (d >= x && d <= x + m && u >= y && u <= y + m && !a) {
          const C = !n.checkbox.checked;
          return this.eventEmitter.emit(S.CHECKBOX_CHANGE, this.getCellInfo(t), C), !0;
        }
        return !1;
      }
      if (n.type === O.RADIO && n.radio) {
        if (a) return !1;
        if (n.radio.options && n.radio.options.length > 0) {
          const h = this.getClickedRadioOption(t, e, n.radio.options);
          return h && !h.disabled ? (this.eventEmitter.emit(
            S.RADIO_CHANGE,
            this.getCellInfo(t),
            h.value
          ), !0) : !1;
        } else
          return this.eventEmitter.emit(
            S.RADIO_CHANGE,
            this.getCellInfo(t),
            n.radio.value
          ), !0;
      }
      if (n.type === O.BUTTON && n.button) {
        if (a) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, x = u - g, y = n.button.size === "small" ? 24 : n.button.size === "large" ? 40 : 32, w = (h.height - y) / 2, C = n.button.text ?? this.locale.cell.buttonText, b = 13;
        this.ctx.font = `${b}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const R = this.ctx.measureText(C).width, E = Math.min(
          Math.max(R + 16 * 2, 60),
          h.width - 8 * 2
        ), T = (h.width - E) / 2;
        return x >= w && x <= w + y && m >= T && m <= T + E ? (this.eventEmitter.emit(
          S.BUTTON_CLICK,
          this.getCellInfo(t),
          n.button.actionKey
        ), !0) : !1;
      }
      if (n.type === O.BUTTONS && n.buttons) {
        if (a) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, x = u - g, y = 8, w = n.buttons.gap ?? 4, C = n.buttons.maxVisible ?? 3, b = 24, R = (h.height - b) / 2, I = n.buttons.buttons.filter((H) => H.visible !== !1), M = I.slice(0, C), E = I.slice(C);
        let T = y;
        for (let H = 0; H < M.length; H++) {
          const D = M[H], k = D.text ?? this.locale.cell.buttonText;
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const P = this.ctx.measureText(k).width, B = Math.max(P + 16, 40);
          if (x >= R && x <= R + b && m >= T && m <= T + B)
            return this.eventEmitter.emit(S.BUTTON_CLICK, this.getCellInfo(t), D.actionKey), !0;
          T += B + w;
        }
        if (E.length > 0) {
          const H = n.buttons.moreButtonText ?? "···";
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const D = this.ctx.measureText(H).width, k = Math.max(D + 16, 32);
          if (x >= R && x <= R + b && m >= T && m <= T + k) {
            const P = f + T, B = K.DROPDOWN_ITEM_HEIGHT, L = E.length * B, W = this.canvas.getBoundingClientRect();
            let _ = g + R + b + 4, A = !1;
            return _ + L > W.height && (_ = g + R - L - 4, A = !0), this.state.buttonsDropdown = {
              cell: t,
              x: P,
              y: _,
              buttons: E,
              hoveredIndex: -1,
              buttonRelativeX: T,
              buttonY: R,
              buttonHeight: b,
              showAbove: A
            }, this.eventEmitter.emit(S.DROPDOWN_OPEN), !0;
          }
        }
        return !1;
      }
      if (n.type === O.SWITCH && n.switch) {
        if (a) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, x = u - g, y = 44, w = 22, C = (h.width - y) / 2, b = (h.height - w) / 2;
        if (!(m >= C && m <= C + y && x >= b && x <= b + w)) return !1;
        const I = `${t.rowIndex}-${t.columnIndex}`, M = this.state.switchAnimations.get(I), E = n.switch.checked ?? !1, T = M ? M.progress : E ? 1 : 0, H = T < 0.5 ? 1 : 0, D = H === 1;
        return E !== D && this.eventEmitter.emit(S.SWITCH_CHANGE, this.getCellInfo(t), D), this.state.switchAnimations.set(I, {
          cell: t,
          progress: T,
          targetProgress: H,
          startTime: Date.now(),
          startProgress: T
        }), this.startSwitchAnimationLoop(), !0;
      }
      if (n.type === O.INPUT && n.input)
        return a || n.input.readonly, !1;
      if (n.type === O.LINK && n.link) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, x = u - g, y = n.link, w = y.link, C = y.text || y.link;
        if (!w || !C) return !1;
        const b = 8, R = 13;
        this.ctx.font = `${R}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const I = h.width - b * 2;
        let M = this.ctx.measureText(C).width, E = C;
        if (M > I) {
          const L = "...";
          for (; E.length > 0 && this.ctx.measureText(E + L).width > I; )
            E = E.slice(0, -1);
          E += L, M = this.ctx.measureText(E).width;
        }
        const T = s.align ?? "left";
        let H;
        switch (T) {
          case "center":
            H = (h.width - M) / 2;
            break;
          case "right":
            H = h.width - b - M;
            break;
          default:
            H = b;
        }
        const D = (h.height - R) / 2;
        if (!(m >= H && m <= H + M && x >= D && x <= D + R)) return !1;
        const P = Date.now(), B = ((r = this._lastClickCell) == null ? void 0 : r.rowIndex) === t.rowIndex && ((l = this._lastClickCell) == null ? void 0 : l.columnIndex) === t.columnIndex && P - this._lastClickTime < 350;
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
        if (a) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, s), d = this.getCellViewportY(t.rowIndex), u = this.canvas.getBoundingClientRect(), f = e.clientX - u.left, g = e.clientY - u.top, x = Math.min(h.height - 8 * 2, 24), y = c + (h.width - x) / 2, w = d + (h.height - x) / 2;
        return f >= y && f <= y + x && g >= w && g <= w + x ? (this.startColorEditing(t, n.color), !0) : !1;
      }
      if (n.type === O.IMAGE && n.image) {
        if (n.image.clickable === !1) return !1;
        const h = n.image, c = h.images, d = this.canvas.getBoundingClientRect(), u = e.clientX - d.left, f = e.clientY - d.top, g = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), m = this.getCellViewportX(g, s), x = this.getCellViewportY(t.rowIndex), y = u - m, w = f - x, C = 4, b = Math.min(g.width, g.height) - C * 2, R = h.width ?? 32, I = h.height ?? 32, M = Math.min(R, b), E = Math.min(I, b), T = h.gap ?? 4;
        if (c && c.length > 1) {
          const B = h.maxVisible ?? 3, L = h.showMoreCount !== !1, W = g.width - C * 2, _ = Math.floor((W + T) / (M + T)), N = Math.max(1, _ - (L ? 1 : 0)), V = Math.min(B, N), z = c.length > V ? V : c.length, X = c.length > V;
          let $;
          X && L ? $ = z * M + z * T + M : $ = z * M + Math.max(0, z - 1) * T;
          let tt = (g.width - $) / 2;
          tt = Math.max(C, tt);
          const Q = (g.height - E) / 2, st = y - tt, it = w - Q;
          if (st < 0 || st > $ || it < 0 || it > E)
            return !1;
          const nt = Math.floor(st / (M + T));
          if (X && L && nt === z)
            return !1;
          if (nt >= 0 && nt < c.length) {
            const U = c[nt];
            if (U)
              return this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(t), U, e), !0;
          }
          return !1;
        }
        const H = (g.width - M) / 2, D = (g.height - E) / 2;
        if (!(y >= H && y <= H + M && w >= D && w <= D + E)) return !1;
        const P = h.src || c && c[0];
        return P ? (this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(t), P, e), !0) : !1;
      }
      return !1;
    });
    v(this, "handleProgressClick", (t, e, i, s, o) => this.controlClickHandler.handleProgressClick(t, e, i, s, o));
    v(this, "handleProgressDragMove", (t) => {
      const e = this.state.progressDragState;
      if (!e) return;
      const { cell: i, config: s, column: o } = e, n = this.canvas.getBoundingClientRect(), a = t.clientX - n.left, r = this.layoutManager.getCellPosition(i.rowIndex, i.columnIndex), l = this.getCellViewportX(r, o), h = s.shape ?? "line";
      if (h === "line") {
        const d = s.textPosition ?? "right", f = (s.showText ?? !0) && d === "right" ? 40 : 0, g = s.width ?? r.width - 8 * 2 - f, m = l + 8, x = a - m, y = s.precision ?? 0, w = Math.max(0, Math.min(100, x / g * 100)), C = y === 0 ? Math.round(w) : Number(w.toFixed(y));
        e.displayValue = C, this.eventEmitter.emit(S.PROGRESS_DRAG);
      } else if (h === "circle" || h === "dashboard") {
        const c = t.clientY - n.top, d = this.getCellViewportY(i.rowIndex);
        let u = 0;
        h === "dashboard" && (u = r.height * 0.05);
        const f = l + r.width / 2, g = d + r.height / 2 + u, m = a - f, x = c - g;
        let y = Math.atan2(x, m), w;
        if (h === "circle")
          y = y + Math.PI / 2, y < 0 && (y += Math.PI * 2), w = y / (Math.PI * 2) * 100;
        else {
          const b = Math.PI * 0.75, R = Math.PI * 1.5;
          y < 0 && (y += Math.PI * 2);
          let I = y - b;
          I < 0 && (I += Math.PI * 2), w = I / R * 100;
        }
        w = Math.max(0, Math.min(100, w));
        const C = s.precision ?? 0;
        w = C === 0 ? Math.round(w) : Number(w.toFixed(C)), e.displayValue = w, this.eventEmitter.emit(S.PROGRESS_DRAG);
      }
    });
    v(this, "handleRatingClick", (t, e, i, s, o) => this.controlClickHandler.handleRatingClick(t, e, i, s, o));
    v(this, "handleExpandIconClick", (t, e, i) => this.controlClickHandler.handleExpandIconClick(t, e, i));
    v(this, "getClickedRadioOption", (t, e, i) => this.controlClickHandler.getClickedRadioOption(t, e, i));
    v(this, "handleWheel", (t) => {
      var a;
      const e = t.target;
      if (e.tagName === "TEXTAREA" || e.tagName === "INPUT") {
        const r = e, l = r.scrollHeight > r.clientHeight, h = r.scrollWidth > r.clientWidth;
        if (l || h)
          return;
      }
      if (this.state.imageTooltip) {
        const r = this.canvas.getBoundingClientRect(), l = t.clientX - r.left, h = t.clientY - r.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g } = this.state.imageTooltip, m = K.IMAGE_SIZE, x = 8, y = 8, w = 4, R = w * m + (w - 1) * y + x * 2 + 4 + 4, I = m + y, M = f * I + x * 2 - y;
        if (l >= c && l <= c + R && h >= d && h <= d + M) {
          const T = Math.ceil(u.length / w), H = Math.max(0, (T - f) * I), D = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (H > 0 && D) {
            const P = g <= 0.5 && t.deltaY < 0, B = g >= H - 0.5 && t.deltaY > 0;
            if (!P && !B) {
              this.state.imageTooltip.scrollTop = Z(g + t.deltaY, 0, H), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageTooltipPosition();
      }
      if (this.state.imageEditor) {
        const r = this.canvas.getBoundingClientRect(), l = t.clientX - r.left, h = t.clientY - r.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g, pendingImages: m } = this.state.imageEditor, x = K.IMAGE_SIZE, y = 8, w = 8, C = 4, b = 60, R = x + w, I = C * x + (C - 1) * w + y * 2 + 4 + 4, M = f * R + y * 2 - w, E = b + M;
        if (l >= c && l <= c + I && h >= d && h <= d + E) {
          const H = u.length + m.length, D = Math.ceil(H / C), k = Math.max(0, (D - f) * R), P = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (k > 0 && P) {
            const L = g <= 0.5 && t.deltaY < 0, W = g >= k - 0.5 && t.deltaY > 0;
            if (!L && !W) {
              this.state.imageEditor.scrollTop = Z(g + t.deltaY, 0, k), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageEditorPosition();
      }
      if (this.state.filterDropdown) {
        const r = this.canvas.getBoundingClientRect(), l = t.clientX - r.left, h = t.clientY - r.top, { x: c, y: d, width: u, mode: f, options: g, scrollTop: m } = this.state.filterDropdown;
        if (f === "select" && g) {
          const y = K.DROPDOWN_ITEM_HEIGHT, w = K.DROPDOWN_MAX_VISIBLE, C = Math.min(g.length, w), b = 32, R = 4, I = C * y, M = 8 + b + R + I + R + 36;
          if (l >= c && l <= c + u && h >= d && h <= d + M) {
            const T = Math.abs(t.deltaY) >= Math.abs(t.deltaX), H = Math.max(0, g.length * y - I);
            if (H > 0 && T) {
              const k = m <= 0.5 && t.deltaY < 0, P = m >= H - 0.5 && t.deltaY > 0;
              if (!k && !P) {
                this.state.filterDropdown.scrollTop = Z(m + t.deltaY, 0, H), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
                return;
              }
            }
          }
        }
        this.dropdownHandler.updateFilterDropdownPosition();
      }
      if (this.state.dropdown) {
        const r = this.canvas.getBoundingClientRect(), l = t.clientX - r.left, h = t.clientY - r.top, { x: c, y: d, width: u, type: f, tagsConfig: g, config: m, scrollTop: x } = this.state.dropdown, y = K.DROPDOWN_ITEM_HEIGHT, w = K.DROPDOWN_MAX_VISIBLE;
        let C;
        f === "tags" && g ? C = ((a = g.options) == null ? void 0 : a.length) ?? 0 : C = m.options.length;
        const R = Math.min(C, w) * y;
        if (l >= c && l <= c + u && h >= d && h <= d + R) {
          const M = Math.abs(t.deltaY) >= Math.abs(t.deltaX), E = Math.max(0, C * y - R);
          if (E > 0 && M) {
            const H = x ?? 0, D = H <= 0.5 && t.deltaY < 0, k = H >= E - 0.5 && t.deltaY > 0;
            if (!D && !k) {
              this.state.dropdown.scrollTop = Z(H + t.deltaY, 0, E), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.DROPDOWN_HOVER);
              return;
            }
          }
        }
        this.dropdownHandler.updateDropdownPosition();
      }
      this.updateAllDropdownPositions(), t.preventDefault();
      const i = t.deltaX, s = t.deltaY, o = Z(
        this.scrollState.scrollLeft + i,
        0,
        this.scrollState.maxScrollLeft
      ), n = Z(
        this.scrollState.scrollTop + s,
        0,
        this.scrollState.maxScrollTop
      );
      (o !== this.scrollState.scrollLeft || n !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = o, this.scrollState.scrollTop = n, this.scrollState.isScrolling = !0, this.eventEmitter.emit(S.SCROLL, o, n), this.checkLazyLoad(n, s), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = !1;
      }, 150));
    });
    v(this, "updateTooltipPosition", () => {
      this.tooltipHandler.updateTooltipPosition();
    });
    v(this, "scrollTimeout", null);
    v(this, "handleKeyDown", async (t) => {
      if (this.state.editingCell) {
        this.handleEditingKeyDown(t);
        return;
      }
      if (this.state.dropdown) {
        if (t.key === "Escape") {
          const e = this.state.dropdown.cell;
          this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE, e);
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
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.eventEmitter.emit(S.UNDO));
          break;
        case "y":
        case "Y":
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.eventEmitter.emit(S.REDO));
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
    v(this, "isDomEditorActive", null);
    v(this, "startSwitchAnimationLoop", () => {
      this.buttonAnimationHandler.startSwitchAnimationLoop();
    });
    v(this, "getSwitchAnimations", () => this.buttonAnimationHandler.getSwitchAnimations());
    this.canvas = t, this.ctx = t.getContext("2d"), this.layoutManager = e, this.dataManager = i, this.eventEmitter = s, this.editingConfig = n, this.locale = a, this.editorRegistry = r, this.state = {
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
    this.handlerContext = t, this.editingHandler = new _t(t, this.eventEmitter, this.editingConfig), this.dropdownHandler = new Nt(t, this.eventEmitter), this.selectionHandler = new Bi(t, this.eventEmitter), this.navigationHandler = new Li(
      t,
      this.eventEmitter,
      this.selectionHandler,
      this.editingConfig
    ), this.contextMenuHandler = new Vt(t, this.eventEmitter), this.imageHandler = new Ft(t, this.eventEmitter), this.headerHandler = new Wi(
      t,
      this.eventEmitter,
      this.sortConfig,
      this.filterConfig
    ), this.controlClickHandler = new Ai(t, this.eventEmitter), this.buttonAnimationHandler = new _i(t, this.eventEmitter), this.tooltipHandler = new Ni(t, this.eventEmitter);
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
      i.data[Y(e)],
      i,
      e,
      this.state.imageEditor.cell.rowIndex
    ) : { image: i.data[Y(e)] }).image ?? {}, n = document.createElement("input");
    n.type = "file", n.accept = o.accept ?? "image/*", n.multiple = !this.state.imageEditor.isSingleImage && o.multiple !== !1, n.onchange = async (a) => {
      const r = a.target.files;
      !r || r.length === 0 || await this.imageHandler.handleFileUpload(Array.from(r));
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
    if (this.state.buttonHoverStates.forEach((E, T) => {
      T !== s && E.progress > 0 && this.state.buttonHoverStates.set(T, {
        ...E,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: E.progress
      });
    }), !t || t.rowIndex < 0) {
      this.state.buttonHoverStates.size > 0 && this.startButtonHoverAnimationLoop();
      return;
    }
    const n = this.layoutManager.getLeafColumns()[t.columnIndex], a = this.rows[t.rowIndex];
    if (!n || !a) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const r = ut(n, a, t.rowIndex);
    if (r.type !== O.BUTTON || !r.button || !this.editorRegistry.getStrategy(n).canEdit(t, a, n)) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const l = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), h = this.getCellViewportX(l, n), c = this.getCellViewportY(t.rowIndex), d = e - h, u = i - c, f = r.button.size === "small" ? 24 : r.button.size === "large" ? 40 : 32, g = (l.height - f) / 2, m = r.button.text ?? this.locale.cell.buttonText, x = 13;
    this.ctx.font = `${x}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const y = this.ctx.measureText(m).width, b = Math.min(
      Math.max(y + 16 * 2, 60),
      l.width - 8 * 2
    ), R = (l.width - b) / 2, I = u >= g && u <= g + f && d >= R && d <= R + b, M = `${t.rowIndex}-${t.columnIndex}`;
    if (I) {
      const E = this.state.buttonHoverStates.get(M);
      if (!E || E.targetProgress !== 1) {
        const T = E ? E.progress : 0;
        this.state.buttonHoverStates.set(M, {
          cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
          progress: T,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: T
        }), this.startButtonHoverAnimationLoop();
      }
    } else {
      const E = this.state.buttonHoverStates.get(M);
      E && E.progress > 0 && (this.state.buttonHoverStates.set(M, {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        progress: E.progress,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: E.progress
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
    const a = ut(o, n, t.rowIndex);
    if (a.type !== O.IMAGE || !a.image) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const r = a.image, l = r.images, h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, o), d = this.getCellViewportY(t.rowIndex), u = e - c, f = i - d, g = 4, x = r.scaleWithRowHeight === !1 ? Math.min(h.height, 32) : h.height, y = Math.max(0, Math.min(h.width, x) - g * 2), w = r.width ?? 32, C = r.height ?? 32, b = Math.min(w, y), R = Math.min(C, y), I = r.gap ?? 4;
    if (!l || l.length <= 1) {
      const U = (h.width - b) / 2, et = (h.height - R) / 2, rt = u >= U && u <= U + b && f >= et && f <= et + R;
      this.state.hoveredImageIndex = rt && r.hoverable !== !1 ? 0 : -1;
      return;
    }
    const M = h.width - g * 2, E = h.height - g * 2, T = r.showMoreCount !== !1, H = r.maxVisible, D = Math.max(1, Math.floor((M + I) / (b + I))), k = Math.max(1, Math.floor((E + I) / (R + I))), P = D * k, B = H ?? P, W = T && l.length > B ? Math.max(0, P - 1) : P, _ = Math.min(B, W), A = l.length > _, N = A ? _ : l.length, V = N + (A && T ? 1 : 0), z = Math.max(1, Math.ceil(V / D)), X = Math.min(V, D), $ = X * b + Math.max(0, X - 1) * I, tt = z * R + Math.max(0, z - 1) * I;
    let Q = (h.width - $) / 2;
    Q = Math.max(g, Q);
    const st = (h.height - tt) / 2, it = u - Q, nt = f - st;
    for (let U = 0; U < N; U++) {
      const et = Math.floor(U / D), at = U % D * (b + I), q = et * (R + I);
      if (it >= at && it < at + b && nt >= q && nt < q + R) {
        this.state.hoveredImageIndex = r.hoverable !== !1 ? U : -1;
        return;
      }
    }
    if (A && T) {
      const U = Math.floor(N / D), rt = N % D * (b + I), at = U * (R + I);
      if (it >= rt && it < rt + b && nt >= at && nt < at + R) {
        this.state.hoveredImageIndex = r.hoverable !== !1 ? N : -1;
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
    const a = ut(o, n, t.rowIndex);
    if (a.type !== O.BUTTONS || !a.buttons) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    if (!this.editorRegistry.getStrategy(o).canEdit(t, n, o)) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const r = a.buttons, l = r.buttons.filter((I) => I.visible !== !1), h = r.maxVisible ?? 3, c = r.gap ?? 4, d = 8, u = 24, f = l.slice(0, h), g = l.slice(h), m = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), x = this.getCellViewportX(m, o), w = this.getCellViewportY(t.rowIndex) + (m.height - u) / 2, C = i - w;
    if (C < 0 || C > u) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    let b = x + d;
    const R = 13;
    this.ctx.font = `${R}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    for (let I = 0; I < f.length; I++) {
      const E = f[I].text ?? this.locale.cell.buttonText, T = this.ctx.measureText(E).width, H = Math.max(T + 16, 40);
      if (e >= b && e < b + H) {
        this.state.hoveredButtonIndex = I;
        return;
      }
      b += H + c;
    }
    if (g.length > 0) {
      const I = r.moreButtonText ?? "···", M = this.ctx.measureText(I).width, E = Math.max(M + 16, 32);
      if (e >= b && e < b + E) {
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
    const a = ut(o, n, t.rowIndex), r = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), l = !this.editorRegistry.getStrategy(o).canEdit(t, n, o), h = this.getCellViewportX(r, o), c = this.getCellViewportY(t.rowIndex), d = e - h, u = i - c;
    if (a.type === O.CHECKBOX && a.checkbox) {
      if (l) return !1;
      const f = 16, g = (r.width - f) / 2, m = (r.height - f) / 2;
      return d >= g && d <= g + f && u >= m && u <= m + f;
    }
    if (a.type === O.RADIO && a.radio) {
      if (l) return !1;
      const f = 16;
      if (a.radio.options && a.radio.options.length > 0) {
        const x = r.width - 8;
        this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        let y = 8;
        for (let w = 0; w < a.radio.options.length; w++) {
          const C = a.radio.options[w];
          if (C.disabled) {
            const k = this.ctx.measureText(C.label).width;
            y += f + 4 + k + 8;
            continue;
          }
          const b = this.ctx.measureText(C.label).width, R = f + 4 + b + 8;
          if (y + R - 8 > x)
            break;
          const I = y, M = (r.height - f) / 2, E = M + f / 2, T = d >= I && d <= I + f && u >= M && u <= M + f, H = I + f + 4, D = d >= H && d <= H + b && u >= E - 10 && u <= E + 10;
          if (T || D)
            return !0;
          y += R;
        }
        return !1;
      } else {
        const g = (r.width - f) / 2, m = (r.height - f) / 2;
        return d >= g && d <= g + f && u >= m && u <= m + f;
      }
    }
    if (a.type === O.BUTTON && a.button) {
      if (l) return !1;
      const f = a.button.size === "small" ? 24 : a.button.size === "large" ? 40 : 32, g = (r.height - f) / 2, m = 8;
      return u >= g && u <= g + f && d >= m && d <= r.width - m;
    }
    if (a.type === O.BUTTONS && a.buttons) {
      if (l) return !1;
      const f = 8, g = a.buttons.gap ?? 4, m = a.buttons.maxVisible ?? 3, x = 24, y = (r.height - x) / 2, w = a.buttons.buttons.filter((R) => R.visible !== !1), C = w.slice(0, m);
      let b = f;
      for (const R of C) {
        const I = R.text ?? this.locale.cell.buttonText;
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const M = this.ctx.measureText(I).width, E = Math.max(M + 16, 40);
        if (u >= y && u <= y + x && d >= b && d <= b + E)
          return !0;
        b += E + g;
      }
      if (w.length > m) {
        const R = a.buttons.moreButtonText ?? "···";
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const I = this.ctx.measureText(R).width, M = Math.max(I + 16, 32);
        if (u >= y && u <= y + x && d >= b && d <= b + M)
          return !0;
      }
      return !1;
    }
    if (a.type === O.SWITCH && a.switch) {
      if (l) return !1;
      const f = 44, g = 22, m = (r.width - f) / 2, x = (r.height - g) / 2;
      return d >= m && d <= m + f && u >= x && u <= x + g;
    }
    if (a.type === O.SELECT && a.select)
      return !l;
    if (a.type === O.TAG && a.tags)
      return !0;
    if (a.type === O.INPUT && a.input)
      return !(l || a.input.readonly);
    if (a.type === O.LINK && a.link) {
      const f = a.link, g = f.text || f.link;
      if (!g) return !1;
      const m = 8, x = 13;
      this.ctx.font = `${x}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      const y = r.width - m * 2;
      let w = this.ctx.measureText(g).width, C = g;
      if (w > y) {
        const M = "...";
        for (; C.length > 0 && this.ctx.measureText(C + M).width > y; )
          C = C.slice(0, -1);
        C += M, w = this.ctx.measureText(C).width;
      }
      const b = o.align ?? "left";
      let R;
      switch (b) {
        case "center":
          R = (r.width - w) / 2;
          break;
        case "right":
          R = r.width - m - w;
          break;
        default:
          R = m;
      }
      const I = (r.height - x) / 2;
      return d >= R && d <= R + w && u >= I && u <= I + x;
    }
    if (a.type === O.IMAGE && a.image) {
      const f = a.image;
      if (f.clickable === !1) return !1;
      const g = f.images;
      if (!g || g.length <= 1)
        return !!(f.src || g && g[0]);
      const m = this.state.hoveredImageIndex ?? -1;
      return m >= 0 && m < g.length;
    }
    if (a.type === O.PROGRESS && a.progress) {
      const f = a.progress;
      if (f.interactive !== !0 || l) return !1;
      const g = f.shape ?? "line";
      if (g === "line") {
        const x = f.size ?? "medium", y = f.height ?? (x === "small" ? 6 : x === "large" ? 16 : 10), w = f.textPosition ?? "right", b = (f.showText ?? !0) && w === "right" ? 40 : 0, R = f.width ?? r.width - 8 * 2 - b, I = 8, M = (r.height - y) / 2;
        return d >= I && d <= I + R && u >= M && u <= M + y;
      }
      if (g === "circle" || g === "dashboard") {
        const m = f.size ?? "medium";
        let x, y = 0;
        g === "circle" ? x = m === "small" ? 0.6 : m === "large" ? 0.9 : 0.75 : (x = m === "small" ? 0.7 : m === "large" ? 0.95 : 0.85, y = r.height * 0.05);
        const w = Math.floor(r.height * x), C = f.width ?? w, b = f.strokeWidth ?? Math.max(2, Math.round(C * 0.12)), R = r.width / 2, I = r.height / 2 + y, M = (C - b) / 2, E = d - R, T = u - I, H = Math.sqrt(E * E + T * T);
        return H >= M - b && H <= M + b;
      }
    }
    if (a.type === O.RATING && a.rating) {
      if (l) return !1;
      const f = a.rating, g = f.max ?? 5, m = f.starSize ?? 16, x = g * m, y = (r.width - x) / 2, w = (r.height - m) / 2;
      return d >= y && d <= y + x && u >= w && u <= w + m;
    }
    if (a.type === O.COLOR && a.color) {
      if (l) return !1;
      const g = Math.min(r.height - 8 * 2, 24), m = (r.width - g) / 2, x = (r.height - g) / 2;
      return d >= m && d <= m + g && u >= x && u <= x + g;
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
    const s = this.layoutManager.getLayoutInfo(), o = s.viewportHeight, n = s.headerHeight, a = s.totalHeight - n, r = t + o - n, l = a - r, h = this.layoutManager.getRowHeightByIndex(i.length - 1);
    Math.ceil(l / h) <= this.lazyLoadThreshold && (this.isLoadingMore = !0, this.eventEmitter.emit(S.LOAD_MORE, {
      startIndex: i.length,
      scrollTop: t,
      direction: "down"
    }));
  }
  handleExternalWheel(t, e) {
    this.state.dropdown && this.dropdownHandler.updateDropdownPosition(), this.state.tooltip && this.updateTooltipPosition();
    const i = Z(
      this.scrollState.scrollLeft + t,
      0,
      this.scrollState.maxScrollLeft
    ), s = Z(
      this.scrollState.scrollTop + e,
      0,
      this.scrollState.maxScrollTop
    );
    (i !== this.scrollState.scrollLeft || s !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = s, this.scrollState.isScrolling = !0, this.eventEmitter.emit(S.SCROLL, i, s), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
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
        const a = ut(o, n, e.rowIndex), r = [
          O.CHECKBOX,
          O.RADIO,
          O.BUTTON,
          O.BUTTONS,
          O.SWITCH,
          O.RATING,
          O.PROGRESS
        ];
        if (a.type && r.includes(a.type)) {
          if (a.type === O.SWITCH && a.switch) {
            this.editorRegistry.getStrategy(o).canEdit(e, n, o) && this.eventEmitter.emit(
              S.SWITCH_CHANGE,
              this.getCellInfo(e),
              !a.switch.checked
            );
            return;
          }
          this.toggleRowExpand(e.rowIndex);
          return;
        }
        if (!this.editorRegistry.getStrategy(o).canEdit(e, n, o) || (i = a.input) != null && i.readonly) return;
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
        if (a.type === O.SELECT && a.select) {
          this.startSelectEditing(e, a.select);
          return;
        }
        if (a.type === O.TAG && a.tags && a.tags.editable) {
          this.startTagsEditing(e, a.tags);
          return;
        }
        if (a.type === O.DATE && a.date) {
          this.startDateEditing(e, a.date);
          return;
        }
        if (a.type === O.COLOR && a.color) {
          this.startColorEditing(e, a.color);
          return;
        }
        if (a.type === O.IMAGE && a.image) {
          this.startImageEditing(e, a.image);
          return;
        }
        this.startEditing(e, a.input);
      }
    } else
      this.toggleRowExpand(e.rowIndex);
  }
  /**
   * 获取编辑配置
   * 优先级：editRender > render 返回的编辑配置 > null（走默认逻辑）
   */
  getEditConfig(t, e, i) {
    const s = e.data[Y(t)];
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
    !e || !e.children || (e.expanded = !e.expanded, this.eventEmitter.emit(S.EXPAND, e, t, e.expanded));
  }
  clearSelection() {
    this.selectionHandler.clearSelection();
  }
  resetState() {
    this.state.selectedCells = [], this.state.editingCell = null, this.state.editingValue = null, this.state.hoveredCell = null, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.state.dragTarget = null, this.state.tooltip = null, this.closeAllDropdowns(), this.sortConfig = [], this.filterConfig = [], this.state.switchAnimations.clear(), this.state.buttonHoverStates.clear(), this.eventEmitter.emit(S.SELECTION_CHANGE, []);
  }
  // ==================== Dropdown 公共方法 ====================
  /** 关闭 select/tags dropdown（公开方法，供 CanvasTable 在校验成功后调用） */
  closeSelectDropdown() {
    this.closeDropdown();
  }
  /** 关闭 select/tags dropdown */
  closeDropdown() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE, null));
  }
  /** 关闭 filter dropdown */
  closeFilterDropdown() {
    this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE));
  }
  /** 关闭 date dropdown（programmatic，非用户取消） */
  closeDateDropdown() {
    this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, null));
  }
  /** 关闭 color dropdown（programmatic，非用户取消） */
  closeColorDropdown() {
    this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE, null));
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
      const { minRow: s, maxRow: o, minCol: n, maxCol: a } = this.getNormalizedRange(i);
      for (let r = s; r <= o; r++) {
        const l = [];
        for (let h = n; h <= a; h++) {
          const c = e[h];
          if (!c) {
            l.push("");
            continue;
          }
          const d = this.rows[r];
          if (!d) {
            l.push("");
            continue;
          }
          const u = me(c, d, r);
          l.push(u);
        }
        t.push(l.join("	"));
      }
    }
    return t.join(`
`);
  }
  setScrollPosition(t, e) {
    this.scrollState.scrollLeft = Z(t, 0, this.scrollState.maxScrollLeft), this.scrollState.scrollTop = Z(e, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
      S.SCROLL,
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
    const { columnKey: t, mode: e } = this.state.filterDropdown, i = this.filterConfig.findIndex((a) => a.column === t);
    i >= 0 && this.filterConfig.splice(i, 1);
    let s = null, o = !1;
    switch (e) {
      case "search": {
        const a = (n = this.state.filterDropdown.searchValue) == null ? void 0 : n.trim();
        a && (s = a, o = !0);
        break;
      }
      case "select": {
        const a = this.state.filterDropdown.options;
        if (a) {
          const r = a.filter((l) => l.checked);
          r.length > 0 && r.length < a.length && (s = r.map((l) => l.value), o = !0);
        }
        break;
      }
      case "range": {
        const a = this.state.filterDropdown.minValue, r = this.state.filterDropdown.maxValue;
        (a !== "" || r !== "") && (s = {
          min: a !== "" ? Number(a) : void 0,
          max: r !== "" ? Number(r) : void 0
        }, o = !0);
        break;
      }
      case "dateRange": {
        const a = this.state.filterDropdown.startDate, r = this.state.filterDropdown.endDate;
        (a || r) && (s = {
          start: a,
          end: r
        }, o = !0);
        break;
      }
      case "boolean": {
        const a = this.state.filterDropdown.boolValue;
        a !== "all" && (s = a, o = !0);
        break;
      }
    }
    o && this.filterConfig.push({
      column: t,
      operator: this.getOperatorByMode(e),
      value: s
    }), this.eventEmitter.emit(S.FILTER_CHANGE, [...this.filterConfig]), this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE);
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
    e >= 0 && this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.eventEmitter.emit(S.FILTER_CHANGE, [...this.filterConfig]), this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE);
  }
  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.filterConfig.findIndex((i) => i.column === t);
    e >= 0 && (this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.dataManager.filter(this.filterConfig), this.eventEmitter.emit(S.FILTER_CHANGE, [...this.filterConfig])), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
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
      const o = this.layoutManager.getLeafColumns().find((a) => a.key === i);
      if (!o) return;
      const n = this.allRows.length > 0 ? this.allRows : this.rows;
      if (t.trim()) {
        const a = Ue(o, n, t);
        this.state.filterDropdown.options = a.map((r) => ({
          label: r.label,
          value: r.value,
          checked: !1
        })), this.state.filterDropdown.isLoading = !1;
      } else {
        const a = pe(o, n, 0);
        a.length === 0 && n.length > 0 ? (this.state.filterDropdown.isLoading = !0, this.state.filterDropdown.options = void 0) : (this.state.filterDropdown.options = a.map((r) => ({
          label: r.label,
          value: r.value,
          checked: !1
        })), this.state.filterDropdown.isLoading = !1);
      }
      this.state.filterDropdown.scrollTop = 0, this.state.filterDropdown.hoveredIndex = -1, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
    } else e === "search" && (this.state.filterDropdown.searchValue = t, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(t, e) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "range" || (this.state.filterDropdown.minValue = t, this.state.filterDropdown.maxValue = e, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(t) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "boolean" || (this.state.filterDropdown.boolValue = t, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(t, e) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "dateRange" || (this.state.filterDropdown.startDate = t, this.state.filterDropdown.endDate = e, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
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
      for (let a = i; a <= s; a++)
        for (let r = o; r <= n; r++)
          t.push({ rowIndex: a, columnIndex: r });
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
    })), this.eventEmitter.emit(S.SELECTION_CHANGE, [...this.state.selectedCells]);
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
v(K, "DROPDOWN_ITEM_HEIGHT", 32), v(K, "DROPDOWN_MAX_VISIBLE", 8), // 图片编辑器常量 (用于 ImageHandler 和其他图片相关操作)
v(K, "IMAGE_SIZE", 64), v(K, "IMAGE_PADDING", 8), v(K, "IMAGE_GAP", 8), v(K, "IMAGES_PER_ROW", 4), v(K, "IMAGE_UPLOAD_AREA_HEIGHT", 60), v(K, "IMAGE_MAX_ROWS", 3);
let zt = K;
class Fi {
  constructor(t, e, i, s, o, n, a) {
    v(this, "wrapper");
    v(this, "layoutManager");
    v(this, "eventEmitter");
    v(this, "theme");
    v(this, "locale");
    v(this, "getRows");
    v(this, "inputElement", null);
    v(this, "editingCell", null);
    v(this, "scrollLeft", 0);
    v(this, "scrollTop", 0);
    v(this, "onScrollCallback", null);
    v(this, "beforeCommitCallback", null);
    v(this, "cancelCallback", null);
    v(this, "wheelHandler", null);
    /** 当 shouldBlockEditingClose 路径已处理提交时，跳过后续的 handleBlur */
    v(this, "skipNextBlur", !1);
    v(this, "placeholderStyle", null);
    v(this, "scrollbarStyle", null);
    v(this, "handleBlur", async () => {
      if (this.skipNextBlur) {
        this.skipNextBlur = !1;
        return;
      }
      await this.endEditing(!0);
    });
    v(this, "handleKeyDown", async (t) => {
      var s;
      const e = t, i = ((s = this.inputElement) == null ? void 0 : s.tagName) === "TEXTAREA";
      e.key === "Enter" && !i ? (e.preventDefault(), await this.endEditing(!0)) : e.key === "Enter" && i && (e.ctrlKey || e.metaKey) ? (e.preventDefault(), await this.endEditing(!0)) : e.key === "Escape" ? (e.preventDefault(), await this.endEditing(!1)) : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && t.stopPropagation();
    });
    v(this, "handleInputWheel", (t) => {
      const e = t;
      e.preventDefault(), this.onScrollCallback && this.onScrollCallback(e.deltaX, e.deltaY);
    });
    this.wrapper = t, this.layoutManager = i, this.eventEmitter = s, this.theme = o, this.locale = n, this.getRows = a;
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
    const a = this.layoutManager.getCellMerge(t.rowIndex, t.columnIndex);
    let r;
    const l = a ? a.rowIndex : t.rowIndex;
    a ? r = this.layoutManager.getMergedCellPosition(a.rowIndex, a.columnIndex) : r = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let h;
    s.fixed === "left" || s.fixed === "right" ? h = r.x : h = r.x - this.scrollLeft;
    const c = this.layoutManager.getCellViewportY(l, this.scrollTop), d = h - 1, u = c - 1, f = r.width + 2, g = 14 * 1.5, m = 8;
    if ((e == null ? void 0 : e.multiline) ?? !1) {
      const y = Math.max(1, Math.floor((r.height - m * 2) / g)), w = Math.min((e == null ? void 0 : e.maxRows) ?? y, y), C = g * w + m * 2, b = Math.min(r.height + 2, C + 2);
      this.inputElement = document.createElement("textarea");
      const R = String(n.data[Y(s)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : R, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = bt(s.disabled, n, s), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${d}px;
        top: ${u}px;
        width: ${f}px;
        height: ${b}px;
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
      const E = () => {
        if (!this.inputElement) return;
        const T = this.inputElement, H = T.scrollTop;
        T.style.height = "auto";
        const D = T.scrollHeight, P = Math.max(b, Math.min(D, C));
        T.style.height = `${P}px`, T.scrollTop = H;
      };
      this.inputElement.addEventListener("input", E), requestAnimationFrame(() => {
        E();
      }), this.wheelHandler = (T) => {
        if (this.inputElement && T.target === this.inputElement) {
          const H = this.inputElement, D = H.scrollTop === 0, k = H.scrollTop + H.clientHeight >= H.scrollHeight - 1, P = T.deltaY < 0, B = T.deltaY > 0;
          (D && P || k && B) && T.preventDefault(), T.stopPropagation();
        }
      }, document.addEventListener("wheel", this.wheelHandler, { capture: !0, passive: !1 }), E();
    } else {
      const y = r.height + 2;
      this.inputElement = document.createElement("input"), this.inputElement.type = (e == null ? void 0 : e.type) ?? "text";
      const w = String(n.data[Y(s)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : w, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = bt(s.disabled, n, s), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
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
        Et(o) && this.setLoadingState(!0);
        const n = Et(o) ? await o : o;
        if (this.setLoadingState(!1), !n)
          return this.applyValidationStyle("error"), requestAnimationFrame(() => {
            var a;
            (a = this.inputElement) == null || a.focus();
          }), !1;
      }
      !t && e && ((s = this.cancelCallback) == null || s.call(this, e)), this.destroyInputElement();
    }
    return t && e && this.eventEmitter.emit(S.EDIT_END, this.getCellInfo(e), i), this.editingCell = null, !0;
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
      const a = this.layoutManager.getCellViewportY(s, this.scrollTop);
      this.inputElement.style.left = `${n - 1}px`, this.inputElement.style.top = `${a - 1}px`;
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
class Vi {
  constructor(t, e, i, s = ht) {
    v(this, "wrapper");
    v(this, "eventEmitter");
    v(this, "theme");
    v(this, "locale");
    // 输入元素
    v(this, "searchInput", null);
    v(this, "minInput", null);
    v(this, "maxInput", null);
    v(this, "currentMode", null);
    v(this, "currentColumnKey", null);
    v(this, "onInputChange", null);
    // 标记是否正在从外部更新，避免触发 input 事件导致循环
    v(this, "isUpdatingFromExternal", !1);
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
        const n = e + o, a = i + o, r = s - o * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${a}px`, this.searchInput.style.width = `${r}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchValue ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "select": {
        const n = e + o, a = i + o, r = s - o * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${a}px`, this.searchInput.style.width = `${r}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchText ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "range": {
        const a = (s - o * 3) / 2, r = i + o;
        if (this.minInput && (this.minInput.style.left = `${e + o}px`, this.minInput.style.top = `${r}px`, this.minInput.style.width = `${a}px`, document.activeElement !== this.minInput)) {
          const l = t.minValue !== void 0 && t.minValue !== "" ? String(t.minValue) : "";
          this.minInput.value !== l && (this.minInput.value = l);
        }
        if (this.maxInput && (this.maxInput.style.left = `${e + o + a + 8}px`, this.maxInput.style.top = `${r}px`, this.maxInput.style.width = `${a}px`, document.activeElement !== this.maxInput)) {
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
    const { x: e, y: i, width: s } = t, o = 8, n = 36, a = e + o, r = i + o, l = s - o * 2;
    this.searchInput = document.createElement("input"), this.searchInput.type = "text", this.searchInput.value = t.searchValue ?? "", this.searchInput.placeholder = this.locale.filter.searchPlaceholder, this.searchInput.style.cssText = `
      position: absolute;
      left: ${a}px;
      top: ${r}px;
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
    const { x: e, y: i, width: s } = t, o = 8, n = 36 - o, a = e + o, r = i + o, l = s - o * 2;
    this.searchInput = document.createElement("input"), this.searchInput.type = "text", this.searchInput.value = t.searchText ?? "", this.searchInput.placeholder = this.locale.filter.selectSearchPlaceholder, this.searchInput.style.cssText = `
      position: absolute;
      left: ${a}px;
      top: ${r}px;
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
    const { x: e, y: i, width: s, minValue: o, maxValue: n } = t, a = 8, r = 32, l = 8, h = (s - a * 3) / 2, c = i + a;
    this.minInput = document.createElement("input"), this.minInput.type = "number", this.minInput.value = o !== void 0 && o !== "" ? String(o) : "", this.minInput.placeholder = this.locale.filter.minPlaceholder, this.minInput.style.cssText = `
      position: absolute;
      left: ${e + a}px;
      top: ${c}px;
      width: ${h}px;
      height: ${r}px;
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
      left: ${e + a + h + l}px;
      top: ${c}px;
      width: ${h}px;
      height: ${r}px;
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
class zi {
  constructor() {
    v(this, "listeners", /* @__PURE__ */ new Map());
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
const G = {
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
}, le = {
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
function Cs(p) {
  var t, e, i, s, o, n, a, r, l, h, c, d, u, f, g, m;
  return p ? {
    ...G,
    ...p,
    colors: {
      ...G.colors,
      ...p.colors,
      tagColors: {
        ...G.colors.tagColors,
        ...(t = p.colors) == null ? void 0 : t.tagColors
      },
      date: {
        ...G.colors.date,
        ...(e = p.colors) == null ? void 0 : e.date
      },
      input: {
        ...G.colors.input,
        ...(i = p.colors) == null ? void 0 : i.input
      },
      checkbox: {
        ...G.colors.checkbox,
        ...(s = p.colors) == null ? void 0 : s.checkbox
      },
      radio: {
        ...G.colors.radio,
        ...(o = p.colors) == null ? void 0 : o.radio
      },
      button: {
        ...G.colors.button,
        ...(n = p.colors) == null ? void 0 : n.button
      },
      dropdown: {
        ...G.colors.dropdown,
        ...(a = p.colors) == null ? void 0 : a.dropdown
      },
      scrollbar: {
        ...G.colors.scrollbar,
        ...(r = p.colors) == null ? void 0 : r.scrollbar
      },
      indicator: {
        ...G.colors.indicator,
        ...(l = p.colors) == null ? void 0 : l.indicator
      },
      tooltip: {
        ...G.colors.tooltip,
        ...(h = p.colors) == null ? void 0 : h.tooltip
      },
      image: {
        ...G.colors.image,
        ...(c = p.colors) == null ? void 0 : c.image
      },
      hiddenPlaceholder: {
        ...G.colors.hiddenPlaceholder,
        ...(d = p.colors) == null ? void 0 : d.hiddenPlaceholder
      },
      moreCount: {
        ...G.colors.moreCount,
        ...(u = p.colors) == null ? void 0 : u.moreCount
      },
      shadow: {
        ...G.colors.shadow,
        ...(f = p.colors) == null ? void 0 : f.shadow
      },
      watermark: {
        ...G.colors.watermark,
        ...(g = p.colors) == null ? void 0 : g.watermark
      },
      loading: (m = p.colors) != null && m.loading ? { ...G.colors.loading, ...p.colors.loading } : G.colors.loading
    },
    font: {
      ...G.font,
      ...p.font
    },
    row: {
      ...G.row,
      ...p.row
    },
    border: {
      ...G.border,
      ...p.border
    }
  } : { ...G };
}
class Xi {
  constructor(t, e, i = {}) {
    v(this, "element");
    v(this, "spinnerElement");
    v(this, "textElement");
    v(this, "theme");
    v(this, "config");
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
    this.textElement.textContent = this.config.text ?? ht.loadingText;
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
class Yi {
  constructor() {
    v(this, "topPinnedRows", /* @__PURE__ */ new Set());
    v(this, "bottomPinnedRows", /* @__PURE__ */ new Set());
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
class $i {
  static buildRows(t, e, i) {
    var l, h;
    const s = (t == null ? void 0 : t.enabled) ?? !!((l = t == null ? void 0 : t.rows) != null && l.length), o = (t == null ? void 0 : t.position) ?? "bottom", n = (t == null ? void 0 : t.scope) ?? "view";
    if (!s || !((h = t == null ? void 0 : t.rows) != null && h.length))
      return { enabled: !1, position: o, scope: n, rows: [] };
    const a = n === "all" ? e.allRows : e.viewRows, r = {
      ...e,
      scopeRows: a
    };
    return {
      enabled: s,
      position: o,
      scope: n,
      rows: t.rows.map((c, d) => {
        var m;
        const u = (m = c.build) == null ? void 0 : m.call(c, r), f = this.normalizeRowResult(u, c.cells ?? []), g = {
          key: c.key,
          height: f.height ?? c.height ?? i,
          cells: [],
          source: c
        };
        return g.cells = this.buildCells(f.cells, g, d, r), g;
      })
    };
  }
  static normalizeRowResult(t, e) {
    return Array.isArray(t) ? { cells: t } : t || { cells: e };
  }
  static buildCells(t, e, i, s) {
    const o = [], n = /* @__PURE__ */ new Set();
    return t.forEach((a, r) => {
      const l = this.resolveColumnRange(a, s.visibleLeafColumns);
      if (!l) return;
      for (let c = l.startColumnIndex; c <= l.endColumnIndex; c++)
        if (n.has(c))
          throw new Error(`Overlapping summary cells in row "${e.key}"`);
      for (let c = l.startColumnIndex; c <= l.endColumnIndex; c++)
        n.add(c);
      const h = s.visibleLeafColumns[l.startColumnIndex];
      o.push({
        key: `${e.key}:${r}`,
        ...l,
        config: a,
        renderResult: this.resolveRenderResult(a, e, i, h, s)
      });
    }), o;
  }
  static resolveColumnRange(t, e) {
    const i = t.startColumnKey ?? t.columnKey, s = t.endColumnKey ?? t.columnKey ?? i;
    if (!i || !s) return;
    const o = e.findIndex((l) => l.key === i), n = e.findIndex((l) => l.key === s);
    if (o < 0 || n < 0) return;
    const a = Math.min(o, n), r = Math.max(o, n);
    return {
      startColumnIndex: a,
      endColumnIndex: r,
      startColumnKey: e[a].key,
      endColumnKey: e[r].key
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
const Gi = {
  isInteractive: !0,
  canEdit(p, t, e) {
    return e.editable === !1 ? !1 : !bt(e.disabled, t, e);
  }
}, Ui = {
  isInteractive: !1,
  canEdit(p, t, e) {
    return e.editable === !1 ? !1 : !bt(e.disabled, t, e);
  },
  shouldBlockFocusLoss(p, t) {
    return t.level === "error";
  }
}, Ki = {
  isInteractive: !0,
  canEdit(p, t, e) {
    return e.editable === !0;
  }
}, ji = /* @__PURE__ */ new Set([
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
]), Qi = /* @__PURE__ */ new Set([O.INPUT, O.TEXT, O.NUMBER]);
class qi {
  constructor() {
    v(this, "strategies", /* @__PURE__ */ new Map());
    for (const t of ji)
      this.strategies.set(t, Gi);
    for (const t of Qi)
      this.strategies.set(t, Ui);
  }
  /** 注册自定义策略 */
  register(t, e) {
    this.strategies.set(t, e);
  }
  /** 获取列对应的编辑器策略 */
  getStrategy(t) {
    const e = t.type ?? O.TEXT, i = this.strategies.get(e);
    return i || Ki;
  }
  /** 检查列是否是交互式编辑器 */
  isInteractive(t) {
    return this.getStrategy(t).isInteractive;
  }
}
class bs {
  constructor(t, e) {
    v(this, "container");
    v(this, "wrapper");
    v(this, "canvas");
    v(this, "props");
    v(this, "dataManager");
    v(this, "layoutManager");
    v(this, "rowPinManager");
    v(this, "renderer");
    v(this, "interactionManager");
    v(this, "editorManager");
    v(this, "editorRegistry");
    v(this, "filterInputManager");
    v(this, "eventEmitter");
    v(this, "loadingOverlay");
    v(this, "theme");
    v(this, "themeMode");
    v(this, "locale");
    v(this, "mediaQuery", null);
    v(this, "isDestroyed", !1);
    v(this, "resizeObserver", null);
    v(this, "renderCache");
    v(this, "rowIdManager");
    v(this, "columnIdManager");
    v(this, "scheduledRender", null);
    v(this, "manualLoading", !1);
    // 用户手动设置的 loading 状态
    v(this, "validationErrorRows", /* @__PURE__ */ new WeakMap());
    v(this, "pendingValidationCells", /* @__PURE__ */ new Set());
    v(this, "pendingAnimationFrame", null);
    v(this, "forcedValidationTooltipCell", null);
    v(this, "warningTooltipTimeout", null);
    v(this, "handleResize", Ne(() => {
      this.resize();
    }, 100));
    v(this, "handleThemeChange", () => {
      this.themeMode === "auto" && (this.theme = this.resolveTheme(), this.applyTheme(), this.render());
    });
    var n, a, r, l, h, c;
    if (typeof t == "string") {
      const d = document.querySelector(t);
      if (!d)
        throw new Error(`Container not found: ${t}`);
      this.container = d;
    } else
      this.container = t;
    this.props = e, this.locale = se(e.locale), this.themeMode = e.themeMode ?? "light", this.theme = this.resolveTheme(), this.themeMode === "auto" && this.setupAutoThemeDetection(), this.wrapper = document.createElement("div"), this.wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `, this.container.appendChild(this.wrapper), this.canvas = document.createElement("canvas"), this.canvas.style.cssText = `
      display: block;
      position: relative;
      z-index: 1;
    `, this.wrapper.appendChild(this.canvas), this.loadingOverlay = new Xi(this.wrapper, this.theme, {
      text: this.props.loadingText ?? this.locale.loadingText
    }), this.eventEmitter = new zi(), this.setupEventHandlers();
    const i = {
      enabled: ((n = e.virtualScroll) == null ? void 0 : n.enabled) ?? !0,
      rowBufferSize: ((a = e.virtualScroll) == null ? void 0 : a.rowBufferSize) ?? e.bufferSize ?? 5,
      columnBufferSize: ((r = e.virtualScroll) == null ? void 0 : r.columnBufferSize) ?? 2
    };
    ((l = e.virtualScroll) == null ? void 0 : l.estimatedRowHeight) !== void 0 && (i.estimatedRowHeight = e.virtualScroll.estimatedRowHeight), ((h = e.virtualScroll) == null ? void 0 : h.estimatedColumnWidth) !== void 0 && (i.estimatedColumnWidth = e.virtualScroll.estimatedColumnWidth);
    const s = e.selection ?? {
      mode: "cell",
      multi: !0
    }, o = e.editing ?? {
      enabled: !0,
      mode: "dblclick"
    };
    this.dataManager = new Ze(e.rowKey), this.layoutManager = new Bt(i, this.theme), this.rowPinManager = new Yi(), this.layoutManager.setRowPinManager(this.rowPinManager), this.layoutManager.setShowRowNumbers(e.showRowNumbers === !0), this.layoutManager.setRowHeightFn(e.rowHeight), this.renderer = new Wt(this.canvas, this.theme, this.layoutManager, this.locale), this.renderer.setMultipleSelectSeparator(e.multipleSelectSeparator ?? ", "), this.rowIdManager = this.renderer.getRowIdManager(), this.columnIdManager = this.renderer.getColumnIdManager(), this.renderCache = new qe(
      this.rowIdManager,
      this.columnIdManager,
      this.dataManager.getRowVersionManager()
    ), this.renderer.setRenderCache(this.renderCache), this.renderer.setOnImageLoaded(() => this.render()), e.watermark && this.renderer.setWatermarkConfig(e.watermark), e.imageLoad && this.renderer.setImageLoadConfig(e.imageLoad), this.editorRegistry = new qi(), this.interactionManager = new zt(
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
      return g && g.type === "tags" && g.tagsConfig ? m = g.tagsConfig.multiple !== !1 ? g.tagsConfig.selectedValues ?? [] : ((y = g.tagsConfig.selectedValues) == null ? void 0 : y[0]) ?? "" : g ? m = g.config.value : m = f.data[Y(u)], !await this.validateEditorCommit(d, m);
    }), this.interactionManager.setShouldBlockEditingClose(async (d) => {
      var x;
      const u = this.editorManager.getEditingCell();
      if (u) {
        if (d && d.preventDefault(), this.editorManager.markSkipNextBlur(), !await this.editorManager.endEditing(!0)) {
          const w = this.layoutManager.getLeafColumn(u.columnIndex);
          if (w) {
            const C = this.editorRegistry.getStrategy(w), b = this.getValidationError(u);
            if (b && !C.shouldBlockFocusLoss(u, b))
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
        return f.type === "tags" && f.tagsConfig ? C = f.tagsConfig.multiple !== !1 ? f.tagsConfig.selectedValues ?? [] : ((x = f.tagsConfig.selectedValues) == null ? void 0 : x[0]) ?? "" : C = f.config.value, !await this.validateEditorCommit(f.cell, C);
      }
      const g = this.interactionManager.getDateDropdown();
      if (g) {
        const y = this.layoutManager.getLeafColumn(g.cell.columnIndex), w = this.dataManager.getRows()[g.cell.rowIndex];
        if (!y || !w) return !1;
        const C = g.selectedDate ?? w.data[Y(y)];
        return !await this.validateEditorCommit(g.cell, C);
      }
      const m = this.interactionManager.getColorDropdown();
      if (m) {
        const y = this.layoutManager.getLeafColumn(m.cell.columnIndex), w = this.dataManager.getRows()[m.cell.rowIndex];
        if (!y || !w) return !1;
        const C = m.config.value ?? w.data[Y(y)];
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
    }), this.editorManager = new Fi(
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
    }), this.filterInputManager = new Vi(
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
    this.eventEmitter.on(S.SCROLL, (t, e) => {
      this.editorManager.setScroll(t, e), this.editorManager.updatePosition();
      const i = this.interactionManager.getFilterDropdown();
      i && this.filterInputManager.updatePosition(i), this.render();
    }), this.eventEmitter.on(S.COLUMN_RESIZE, () => {
      const t = this.dataManager.getColumns();
      this.layoutManager.calculateColumnLayoutOnly(t), this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      ), this.render();
    }), this.eventEmitter.on(S.ROW_RESIZE_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(
      S.ROW_HEIGHT_CHANGE,
      (t, e, i) => {
        const s = t, o = e;
        if (!this.layoutManager.updateRowHeight(s, o)) {
          const a = this.dataManager.getColumns(), r = this.dataManager.getRows();
          this.layoutManager.calculateLayout(a, r);
        }
        this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop()
        ), this.editorManager.updatePosition(), this.render();
      }
    ), this.eventEmitter.on(S.COLUMN_REORDER, (t, e) => {
      const i = t, s = e;
      this.dataManager.reorderColumns(i, s);
      const o = this.dataManager.getColumns();
      if (this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(o), this.props.onColumnReorder) {
        const n = o.map((a) => a.key);
        this.props.onColumnReorder(n);
      }
      this.render();
    }), this.eventEmitter.on(S.COLUMN_REORDER_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(S.COLUMN_SWAP, (t, e) => {
      const i = t, s = e;
      this.dataManager.swapColumnsByKey(i, s);
      const o = this.dataManager.getColumns();
      this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(o), this.render();
    }), this.eventEmitter.on(S.SORT_CHANGE, (t) => {
      const e = t;
      this.dataManager.sort(e), this.interactionManager.setSortConfig(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.FILTER_CHANGE, (t) => {
      const e = t;
      this.dataManager.filter(e), this.interactionManager.setFilterConfig(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.FILTER_DROPDOWN_OPEN, () => {
      const t = this.interactionManager.getFilterDropdown();
      this.filterInputManager.updateFilterDropdown(t), this.render();
    }), this.eventEmitter.on(S.FILTER_DROPDOWN_CLOSE, () => {
      this.filterInputManager.updateFilterDropdown(null), this.render();
    }), this.eventEmitter.on(S.FILTER_DROPDOWN_CONFIRM, () => {
      this.interactionManager.applyFilter(), this.filterInputManager.updateFilterDropdown(null), this.render();
    }), this.eventEmitter.on(S.FILTER_DROPDOWN_RESET, () => {
      this.interactionManager.resetFilterValue(), this.filterInputManager.forceReset(), this.render();
    }), this.eventEmitter.on(S.FILTER_DROPDOWN_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(S.SELECTION_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(S.CELL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const s = this.dataManager.getRows()[t.rowIndex];
        s && this.eventEmitter.emit(S.ROW_CLICK, s, t.rowIndex, e);
      }
    }), this.eventEmitter.on(S.CELL_DBL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const s = this.dataManager.getRows()[t.rowIndex];
        s && this.eventEmitter.emit(S.ROW_DBL_CLICK, s, t.rowIndex, e);
      }
    }), this.eventEmitter.on(S.CELL_HOVER, (t) => {
      this.render();
    }), this.eventEmitter.on(S.HEADER_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.CHECKBOX_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onCheckboxChange
      );
    }), this.eventEmitter.on(S.RADIO_CHANGE, async (t, e) => {
      await this.handleEditorCommit(t, e, this.props.onRadioChange);
    }), this.eventEmitter.on(S.SWITCH_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onSwitchChange
      );
    }), this.eventEmitter.on(S.PROGRESS_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onProgressChange
      );
    }), this.eventEmitter.on(S.PROGRESS_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(S.RATING_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onRatingChange
      );
    }), this.eventEmitter.on(S.COLOR_CHANGE, async (t, e) => {
      await this.handleEditorCommit(
        t,
        e,
        this.props.onColorChange
      );
    }), this.eventEmitter.on(S.COLOR_DROPDOWN_OPEN, () => {
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
    }), this.eventEmitter.on(S.COLOR_DROPDOWN_CLOSE, (t) => {
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
    }), this.eventEmitter.on(S.COLOR_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.SWITCH_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(S.BUTTON_HOVER_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(S.EDIT_START, async (t, e) => {
      const i = t, s = e;
      await this.editorManager.startEditing(i, s);
      const o = this.layoutManager.getLeafColumn(i.columnIndex);
      if (o) {
        const n = this.editorRegistry.getStrategy(o);
        !n.isInteractive && n.onEditStart && n.onEditStart(i, s);
      }
      this.render();
    }), this.eventEmitter.on(
      S.SELECT_CHANGE,
      async (t, e, i) => {
        const s = t, o = i;
        await this.handleEditorCommit(s, e, this.props.onSelectChange) && (o || (this.clearValidationErrorForCell(s), this.interactionManager.closeSelectDropdown()));
      }
    ), this.eventEmitter.on(
      S.TAGS_CHANGE,
      async (t, e, i) => {
        const s = t, o = e, n = i, a = n ? o : o[0] ?? "";
        await this.handleEditorCommit(
          s,
          a,
          this.props.onTagsChange ? (l, h) => this.props.onTagsChange(l, o) : void 0
        ) && !n && (this.clearValidationErrorForCell(s), this.interactionManager.closeSelectDropdown());
      }
    ), this.eventEmitter.on(S.EXPAND, (t, e, i) => {
      const s = t, o = e, n = i;
      this.props.onExpand && this.props.onExpand(s, o, n), this.dataManager.toggleRowExpand(o), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.DROPDOWN_OPEN, () => {
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
    }), this.eventEmitter.on(S.DROPDOWN_CLOSE, (t) => {
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
    }), this.eventEmitter.on(S.DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.BUTTONS_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(S.DATE_DROPDOWN_OPEN, () => {
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
    }), this.eventEmitter.on(S.DATE_DROPDOWN_CLOSE, (t) => {
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
    }), this.eventEmitter.on(S.DATE_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.DATE_SELECT, async (t, e) => {
      await this.handleEditorCommit(t, e, this.props.onEditEnd), this.interactionManager.clearEditingState(), this.render();
    }), this.eventEmitter.on(S.CONTEXT_MENU_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(S.CONTEXT_MENU_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(S.CONTEXT_MENU_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.HEADER_CONTEXT_MENU_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(S.HEADER_CONTEXT_MENU_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(S.HEADER_CONTEXT_MENU_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.COLUMN_HIDE, (t) => {
      const e = t;
      this.hideColumnInternal(e);
    }), this.eventEmitter.on(S.COLUMN_SHOW, (t) => {
      const e = t;
      this.showColumnInternal(e);
    }), this.eventEmitter.on(S.ROW_ADD_ABOVE, (t) => {
      const e = t, i = this.dataManager.getColumns(), s = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, s, "above"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_ADD_BELOW, (t) => {
      const e = t, i = this.dataManager.getColumns(), s = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, s, "below"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_DELETE, (t) => {
      const e = t;
      this.rowPinManager.remove(e), this.dataManager.deleteRowByRef(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_PIN_CHANGE, (t, e) => {
      var a, r;
      const i = t, s = e, o = this.rowPinManager.getPosition(i);
      s ? this.rowPinManager.pin(i, s) : this.rowPinManager.remove(i), this.layoutManager.updateRowPin(i, o, s) ? (this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      ), this.editorManager.updatePosition()) : this.updateLayout(), this.render(), (r = (a = this.props).onRowPinChange) == null || r.call(a, i, s);
    }), this.eventEmitter.on(S.UNDO, () => {
      this.undo();
    }), this.eventEmitter.on(S.REDO, () => {
      this.redo();
    }), this.eventEmitter.on(
      S.IMAGE_CLICK,
      (t, e, i) => {
        const s = t, o = e, n = i;
        this.props.onImageClick && this.props.onImageClick(s, o, n);
      }
    ), this.eventEmitter.on(S.IMAGE_TOOLTIP_SCROLL, () => {
      this.render();
    }), this.eventEmitter.on(S.IMAGE_TOOLTIP_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.IMAGE_EDITOR_SCROLL, () => {
      this.render();
    }), this.eventEmitter.on(S.IMAGE_EDITOR_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.IMAGE_EDITOR_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(S.IMAGE_UPLOAD, (t, e) => {
      const i = t, s = e;
      this.props.onImageUpload && this.props.onImageUpload(i, s);
    }), this.eventEmitter.on(
      S.IMAGE_DELETE,
      (t, e, i) => {
        const s = t, o = e, n = i;
        this.props.onImageDelete && this.props.onImageDelete(s, o, n);
      }
    ), this.eventEmitter.on(S.EDIT_END, async (t, e) => {
      await this.handleEditorCommit(t, e, this.props.onEditEnd), this.interactionManager.clearEditingState(), this.render();
    }), this.eventEmitter.on(S.LOAD_MORE, (t) => {
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
      this.eventEmitter.emit(S.LOAD, s), this.render();
    } catch (t) {
      const e = t instanceof Error ? t : new Error(String(t));
      this.eventEmitter.emit(S.ERROR, e);
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
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows(), i = this.dataManager.getAllRows(), s = $i.buildRows(
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
    var u, f, g, m, x;
    const s = this.editorRegistry.getStrategy(e), o = e.validate ?? ((u = e.editor) == null ? void 0 : u.validate), n = s.validate;
    if (!o && !n) return { valid: !0, issue: null };
    const a = this.dataManager.getRows()[t.rowIndex];
    if (!a) return { valid: !0, issue: null };
    const r = o ? o(i, a, e) : n(t, i, a, e), l = Et(r);
    l && this.addPendingValidation(t);
    const h = l ? await r : r, c = this.normalizeValidationResult(h), d = c.message && (c.level === "warning" || !c.valid) ? {
      cell: t,
      row: a,
      column: e,
      value: i,
      message: c.message,
      level: c.level
    } : null;
    if (l && this.removePendingValidation(t), d) {
      const y = this.validationErrorRows.get(a) ?? /* @__PURE__ */ new Map();
      if (y.set(e.key, d), this.validationErrorRows.set(a, y), this.forcedValidationTooltipCell = d.cell, d.level === "warning") {
        const w = d.cell;
        this.warningTooltipTimeout && clearTimeout(this.warningTooltipTimeout), this.warningTooltipTimeout = setTimeout(() => {
          this.isDestroyed || this.forcedValidationTooltipCell && this.forcedValidationTooltipCell.rowIndex === w.rowIndex && this.forcedValidationTooltipCell.columnIndex === w.columnIndex && (this.forcedValidationTooltipCell = null, this.render());
        }, 3e3);
      }
      (g = (f = this.props).onValidationError) == null || g.call(f, d), d.level === "error" ? (m = s.onReject) == null || m.call(s, t, d) : d.level === "warning" && ((x = s.onWarning) == null || x.call(s, t, d));
    } else
      this.deleteValidationError(a, e.key);
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
    var a;
    const { valid: s } = await this.handleValidation(t, e, i);
    if (!s) return !1;
    const o = this.dataManager.getRows()[t.rowIndex];
    this.dataManager.updateCell(t.rowIndex, e.key, i, Y(e)), this.refreshSummaryRowsAfterDataChange();
    const n = this.editorRegistry.getStrategy(e);
    return (a = n.onCommit) == null || a.call(n, t, i, o, e), !0;
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
      const a = o;
      if (a.beforeInteract) {
        const r = this.dataManager.getRows()[t.rowIndex];
        if (r && !a.beforeInteract(t, r, s))
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
      const a = this.validationErrorRows.get(n);
      if (a)
        for (let r = 0; r < s.length; r++) {
          const l = s[r];
          if (!l) continue;
          const h = a.get(l.key);
          h && t.set(`${o}-${r}`, h);
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
    const a = this.forcedValidationTooltipCell ?? i.hoveredCell, r = this.getValidationTooltip(
      a,
      s.scrollLeft,
      s.scrollTop
    );
    if (r && i.tooltip) {
      const m = i.tooltip.cell, x = r.cell.rowIndex === m.rowIndex && r.cell.columnIndex === m.columnIndex, y = r.content.type === "text" ? r.content.text : "";
      if (x && i.tooltip.content.type === "text") {
        const w = i.tooltip.content.text;
        this.renderer.renderTooltip({
          ...r,
          content: {
            type: "text",
            text: y + `
` + w
          }
        });
      } else
        this.renderer.renderTooltip(r);
    } else r ? this.renderer.renderTooltip(r) : i.tooltip && this.renderer.renderTooltip(i.tooltip);
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
      this.interactionManager.setScrollPosition(0, 0), this.interactionManager.resetState(), this.editorManager.destroy(), this.renderer.clearImageCache(), this.renderer.resetRowIds(), this.renderCache.clear(), this.updateLayout(), this.render();
    }).catch((e) => {
      this.eventEmitter.emit(S.ERROR, e);
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
      this.eventEmitter.emit(S.CHANGE, [l]), this.refreshSummaryRowsAfterDataChange(), this.render();
      return;
    }
    const n = this.dataManager.getRows()[t], a = Y(s), r = {
      type: "update",
      rowIndex: t,
      column: a,
      newValue: n == null ? void 0 : n.data[a]
    };
    this.eventEmitter.emit(S.CHANGE, [r]), this.render();
  }
  async updateRow(t, e) {
    const i = this.layoutManager.getLeafColumns();
    for (let o = 0; o < i.length; o++) {
      const n = i[o];
      if (!n) continue;
      const a = Y(n), r = Object.prototype.hasOwnProperty.call(e, a), l = Object.prototype.hasOwnProperty.call(e, n.key);
      if (!r && !l)
        continue;
      const h = r ? e[a] : e[n.key], c = { rowIndex: t, columnIndex: o };
      if (!(await this.handleValidation(c, n, h)).valid) {
        this.render();
        return;
      }
    }
    const s = this.dataManager.updateRow(t, e);
    this.eventEmitter.emit(S.CHANGE, s), this.refreshSummaryRowsAfterDataChange(), this.render();
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
    ), a = (o == null ? void 0 : o.fixed) === "left" || (o == null ? void 0 : o.fixed) === "right" ? n.x : n.x - e;
    return {
      cell: t,
      x: a,
      y: n.y - i,
      width: n.width,
      content: { type: "text", text: s.message }
    };
  }
  addRow(t, e) {
    const i = this.dataManager.addRow(t, e);
    this.eventEmitter.emit(S.CHANGE, [i]), this.updateLayout(), this.render();
  }
  deleteRow(t) {
    const e = this.dataManager.deleteRow(t);
    this.eventEmitter.emit(S.CHANGE, [e]), this.updateLayout(), this.render();
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
    this.dataManager.sort(t), this.interactionManager.setSortConfig(t), this.eventEmitter.emit(S.SORT, t), this.updateLayout(), this.render();
  }
  filter(t) {
    this.dataManager.filter(t), this.interactionManager.setFilterConfig(t), this.eventEmitter.emit(S.FILTER, t), this.updateLayout(), this.render();
  }
  clearFilters() {
    this.dataManager.clearFilters(), this.interactionManager.setFilterConfig([]), this.eventEmitter.emit(S.FILTER, []), this.updateLayout(), this.render();
  }
  async export(t) {
    var e;
    switch (t.format) {
      case "csv":
        return new Blob(
          [
            Qt(
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
            Qt(
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
    const e = this.dataManager.getColumns(), i = [], s = (a, r = []) => {
      for (const l of a) {
        if (l.key === t) {
          for (const h of r)
            i.push(h.key);
          return !0;
        }
        if (l.children && s(l.children, [...r, l]))
          return !0;
      }
      return !1;
    }, o = (a, r) => {
      let l, h, c = !1;
      const d = (u) => {
        for (const f of u)
          if (c && h === void 0 && !f.hidden && (f.fixed === "left" || f.fixed === "right") && (h = f.fixed), f.key === r && (c = !0), !c && !f.hidden && f.key !== r && (f.fixed === "left" || f.fixed === "right") && (l = f.fixed), f.children && d(f.children), c && h !== void 0)
            return;
      };
      return d(a), { prevFixed: l, nextFixed: h };
    }, n = (a) => {
      for (const r of a) {
        if (r.key === t || i.includes(r.key)) {
          if (r.hidden = !1, r.key === t && r.fixed === void 0) {
            const { prevFixed: h, nextFixed: c } = o(e, t);
            h !== void 0 && h === c && (r.fixed = h);
          }
          const l = (h) => {
            for (const c of h)
              c.hidden = !1, c.children && l(c.children);
          };
          return r.children && l(r.children), !0;
        }
        if (r.children && n(r.children))
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
    this.props = { ...this.props, locale: t }, this.locale = se(t), this.loadingOverlay.setConfig({
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
      const s = Y(i);
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
    var s, o, n, a, r, l, h, c, d, u, f, g, m, x, y;
    let e;
    this.themeMode === "auto" ? e = window.matchMedia("(prefers-color-scheme: dark)").matches ? le : G : this.themeMode === "dark" ? e = le : e = G;
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
          ...(a = i.colors) == null ? void 0 : a.checkbox
        },
        radio: {
          ...e.colors.radio,
          ...(r = i.colors) == null ? void 0 : r.radio
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
          ...(x = i.colors) == null ? void 0 : x.shadow
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
    this.isDestroyed || (this.isDestroyed = !0, this.stopPendingAnimation(), this.warningTooltipTimeout && (clearTimeout(this.warningTooltipTimeout), this.warningTooltipTimeout = null), this.teardownAutoThemeDetection(), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), window.removeEventListener("resize", this.handleResize), this.interactionManager.destroy(), this.renderer.destroy(), this.editorManager.destroy(), this.filterInputManager.destroy(), this.loadingOverlay.destroy(), this.dataManager.destroy(), this.wrapper.parentNode && this.wrapper.parentNode.removeChild(this.wrapper), this.eventEmitter.removeAllListeners());
  }
  on(t, e) {
    this.eventEmitter.on(t, e);
  }
  off(t, e) {
    this.eventEmitter.off(t, e);
  }
}
export {
  Xt as Box,
  Di as CTRenderer,
  bs as CanvasTable,
  O as CellTypes,
  xs as Circle,
  gs as Column,
  je as ColumnIdManager,
  le as DARK_THEME,
  G as DEFAULT_THEME,
  Ze as DataManager,
  zi as EventEmitter,
  Ye as FILTER_SAMPLE_ROWS,
  $e as FILTER_SEARCH_LIMIT,
  ws as Image,
  zt as InteractionManager,
  ds as LRUCache,
  Mi as LayoutEngine,
  Bt as LayoutManager,
  ys as Line,
  Ti as MeasurementEngine,
  qe as RenderCache,
  Wt as Renderer,
  fs as Row,
  Ke as RowIdManager,
  Qe as RowVersionManager,
  ms as Stack,
  ps as Text,
  Qt as arrayToCsv,
  jt as binarySearch,
  We as buildExcelExportModel,
  Ot as calculateMaxTextRows,
  Z as clamp,
  us as createCTElement,
  ls as createCanvas,
  Ji as createXlsxBlob,
  Ae as createXlsxBlobFromModel,
  Ne as debounce,
  Kt as deepClone,
  bs as default,
  cs as downloadBlob,
  ti as enUS,
  is as formatBoolean,
  es as formatDate,
  _e as formatNumber,
  ts as formatPercent,
  ss as generateId,
  me as getCellDisplayText,
  Y as getColumnField,
  pe as getColumnFilterOptions,
  It as getDevicePixelRatio,
  Xe as getFilterModeByColumnType,
  ns as getNestedValue,
  ut as getRenderResult,
  Pi as getTextFromChildren,
  Fe as isEqual,
  Et as isPromise,
  ge as layoutTags,
  Pt as layoutWrappedText,
  as as measureText,
  Cs as mergeTheme,
  Oi as normalizeBoxProps,
  hs as requestAnimationFrameThrottle,
  bt as resolveDisabled,
  se as resolveLocale,
  Ue as searchFilterOptions,
  rs as setNestedValue,
  os as throttle,
  mt as truncateText,
  ht as zhCN
};
//# sourceMappingURL=canvas-table.js.map
