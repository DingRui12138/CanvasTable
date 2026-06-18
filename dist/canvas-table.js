var xe = Object.defineProperty;
var we = (p, t, e) => t in p ? xe(p, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : p[t] = e;
var b = (p, t, e) => we(p, typeof t != "symbol" ? t + "" : t, e);
const B = {
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
  const e = (i = t == null ? void 0 : t.formats) == null ? void 0 : i.find((o) => o.key === p.key);
  if (e != null && e.type && e.formatCode)
    return { type: e.type, formatCode: e.formatCode };
  if (p.type === B.DATE)
    return { type: "date", formatCode: "yyyy-mm-dd" };
  if (p.type === B.NUMBER)
    return { type: "number", formatCode: "General" };
}
function be() {
  const p = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map(), e = [], i = [{}];
  return {
    styles: i,
    numFmts: e,
    getStyleId(o) {
      if (!o || o === "General")
        return 0;
      let s = p.get(o);
      s || (s = 164 + e.length, p.set(o, s), e.push({ id: s, formatCode: o }));
      const n = `numFmt:${s}`;
      let r = t.get(n);
      return r === void 0 && (r = i.length, i.push({ numFmtId: s }), t.set(n, r)), r;
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
    cells: i.cells.map((o) => {
      const s = Ce(o.column, t);
      if ((s == null ? void 0 : s.type) === "date") {
        const n = ve(o.rawValue);
        if (n !== null)
          return {
            value: n,
            type: "number",
            styleId: e.getStyleId(s.formatCode)
          };
      }
      if (typeof o.rawValue == "number" && Number.isFinite(o.rawValue)) {
        const n = e.getStyleId(s == null ? void 0 : s.formatCode);
        return {
          value: o.rawValue,
          type: "number",
          ...n > 0 ? { styleId: n } : {}
        };
      }
      return typeof o.rawValue == "boolean" ? { value: o.rawValue, type: "boolean" } : { value: o.displayValue, type: "string" };
    })
  }));
}
function Yt(p, t) {
  const e = [], i = [];
  for (const o of p ?? []) {
    const s = Array.from({ length: t }, () => ({
      value: "",
      type: "blank"
    }));
    for (const n of o.cells) {
      if (n.startColumnIndex < 0 || n.startColumnIndex >= t || n.endColumnIndex < n.startColumnIndex)
        continue;
      const r = n.config.value ?? n.renderResult.text ?? "", a = typeof r == "number" ? "number" : typeof r == "boolean" ? "boolean" : "string";
      s[n.startColumnIndex] = {
        value: r,
        type: a
      }, n.endColumnIndex > n.startColumnIndex && i.push({
        startRow: e.length,
        startCol: n.startColumnIndex,
        endRow: e.length,
        endCol: Math.min(n.endColumnIndex, t - 1)
      });
    }
    e.push({ kind: "summary", cells: s });
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
      const i = p[t], o = p[e];
      if (i.startRow <= o.endRow && i.endRow >= o.startRow && i.startCol <= o.endCol && i.endCol >= o.startCol)
        throw new Error(`Overlapping merge ranges: ${JSON.stringify(i)} and ${JSON.stringify(o)}`);
    }
}
function Me(p, t, e) {
  var s, n, r, a;
  const i = ((s = t == null ? void 0 : t.freeze) == null ? void 0 : s.xSplit) ?? (((n = t == null ? void 0 : t.freeze) == null ? void 0 : n.leftFixedColumns) === !1 ? 0 : p.leftFixedLeafColumnCount), o = ((r = t == null ? void 0 : t.freeze) == null ? void 0 : r.ySplit) ?? (((a = t == null ? void 0 : t.freeze) == null ? void 0 : a.header) === !1 ? 0 : e);
  if (!(i === 0 && o === 0))
    return {
      xSplit: i,
      ySplit: o,
      topLeftCell: `${ce(i + 1)}${o + 1}`
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
    const o = i + 1, s = e.cells.map((n, r) => {
      const a = `${de(r)}${o}`, l = n.styleId !== void 0 ? ` s="${n.styleId}"` : "";
      return n.type === "blank" ? `<c r="${a}"${l}/>` : n.type === "number" ? `<c r="${a}"${l}><v>${n.value}</v></c>` : n.type === "boolean" ? `<c r="${a}" t="b"${l}><v>${n.value ? 1 : 0}</v></c>` : `<c r="${a}" t="inlineStr"${l}><is><t>${Mt(n.value)}</t></is></c>`;
    }).join("");
    return `<row r="${o}">${s}</row>`;
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
function Z(p, t, e) {
  p[t] = e & 255, p[t + 1] = e >>> 8 & 255;
}
function dt(p, t, e) {
  p[t] = e & 255, p[t + 1] = e >>> 8 & 255, p[t + 2] = e >>> 16 & 255, p[t + 3] = e >>> 24 & 255;
}
function Gt(p) {
  const t = p.reduce((o, s) => o + s.length, 0), e = new Uint8Array(t);
  let i = 0;
  for (const o of p)
    e.set(o, i), i += o.length;
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
    const o = i + 1, s = e.map((n, r) => `<c r="${`${de(r)}${o}`}" t="inlineStr"><is><t>${Mt(n)}</t></is></c>`).join("");
    return `<row r="${o}">${s}</row>`;
  }).join("")}</sheetData></worksheet>`;
}
function fe(p) {
  const t = [], e = [];
  let i = 0;
  for (const n of p) {
    const r = Ut(n.name), a = Ut(n.content), l = Pe(a), h = new Uint8Array(30 + r.length);
    dt(h, 0, 67324752), Z(h, 4, 20), Z(h, 6, 0), Z(h, 8, 0), Z(h, 10, 0), Z(h, 12, 0), dt(h, 14, l), dt(h, 18, a.length), dt(h, 22, a.length), Z(h, 26, r.length), Z(h, 28, 0), h.set(r, 30), t.push(h, a);
    const c = new Uint8Array(46 + r.length);
    dt(c, 0, 33639248), Z(c, 4, 20), Z(c, 6, 20), Z(c, 8, 0), Z(c, 10, 0), Z(c, 12, 0), Z(c, 14, 0), dt(c, 16, l), dt(c, 20, a.length), dt(c, 24, a.length), Z(c, 28, r.length), Z(c, 30, 0), Z(c, 32, 0), Z(c, 34, 0), Z(c, 36, 0), dt(c, 38, 0), dt(c, 42, i), c.set(r, 46), e.push(c), i += h.length + a.length;
  }
  const o = Gt(e), s = new Uint8Array(22);
  return dt(s, 0, 101010256), Z(s, 4, 0), Z(s, 6, 0), Z(s, 8, p.length), Z(s, 10, p.length), dt(s, 12, o.length), dt(s, 16, i), Z(s, 20, 0), Gt([...t, o, s]);
}
function Le(p, t) {
  const e = Array.from({ length: t }, () => []), i = [], o = (n, r, a) => {
    if (n.children && n.children.length > 0) {
      e[r][a] = { value: n.title, type: "string" };
      let l = a;
      for (const h of n.children)
        l = o(h, r + 1, l);
      return l - 1 > a && i.push({ startRow: r, startCol: a, endRow: r, endCol: l - 1 }), l;
    }
    return e[r][a] = { value: n.title, type: "string" }, r < t - 1 && i.push({ startRow: r, startCol: a, endRow: t - 1, endCol: a }), a + 1;
  };
  let s = 0;
  for (const n of p)
    s = o(n, 0, s);
  return {
    rows: e.map((n) => ({
      kind: "header",
      cells: Array.from(
        { length: s },
        (r, a) => n[a] ?? { value: "", type: "blank" }
      )
    })),
    merges: i
  };
}
function We(p, t, e) {
  const o = (t == null ? void 0 : t.hierarchicalHeaders) !== !1 && p.headerDepth > 0 ? Le(p.columnTree, p.headerDepth) : {
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
  }, s = be(), n = Yt(p.summaryTopRows, p.leafColumns.length), r = Re(p, t, s), a = Yt(
    p.summaryBottomRows,
    p.leafColumns.length
  ), l = o.rows.length + n.rows.length, h = l + r.length, c = Tt((t == null ? void 0 : t.merges) ?? p.bodyMerges, l), d = Tt(n.merges, o.rows.length), u = Tt(a.merges, h), f = [
    ...o.merges,
    ...d,
    ...c,
    ...u
  ];
  Se(f);
  const g = Me(p, t, o.rows.length);
  return {
    sheetName: e,
    columns: p.leafColumns.map((m) => ({
      key: m.key,
      width: Ie(m, t == null ? void 0 : t.columnWidths)
    })),
    rows: [
      ...o.rows,
      ...n.rows,
      ...r,
      ...a.rows
    ],
    merges: f,
    freeze: g,
    styles: s.styles,
    numFmts: s.numFmts
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
  ], i = fe(e), o = new ArrayBuffer(i.byteLength);
  return new Uint8Array(o).set(i), new Blob([o], { type: he });
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
  ], o = fe(i), s = new ArrayBuffer(o.byteLength);
  return new Uint8Array(s).set(o), new Blob([s], { type: he });
}
function $(p) {
  return p.field ?? p.key;
}
function _e(p, t) {
  const { thousandSeparator: e = !0, decimalPlaces: i, prefix: o = "", suffix: s = "" } = t ?? {};
  if (!isFinite(p))
    return String(p);
  let n = i !== void 0 ? p.toFixed(i) : String(p);
  if (e) {
    const r = n.split(".");
    r[0] = r[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","), n = r.join(".");
  }
  return o + n + s;
}
function ts(p, t = 2) {
  return _e(p * 100, { decimalPlaces: t, suffix: "%" });
}
function es(p, t = "YYYY-MM-DD") {
  const e = p instanceof Date ? p : new Date(p);
  if (isNaN(e.getTime()))
    return String(p);
  const i = e.getFullYear(), o = String(e.getMonth() + 1).padStart(2, "0"), s = String(e.getDate()).padStart(2, "0"), n = String(e.getHours()).padStart(2, "0"), r = String(e.getMinutes()).padStart(2, "0"), a = String(e.getSeconds()).padStart(2, "0");
  return t.replace("YYYY", String(i)).replace("MM", o).replace("DD", s).replace("HH", n).replace("mm", r).replace("ss", a);
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
function Fe(p, t) {
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
function tt(p, t, e) {
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
function Ne(p, t) {
  if (p === t)
    return !0;
  if (typeof p != typeof t)
    return !1;
  if (p === null || t === null || typeof p != "object")
    return p === t;
  if (Array.isArray(p) !== Array.isArray(t))
    return !1;
  const e = p, i = t, o = Object.keys(e), s = Object.keys(i);
  if (o.length !== s.length)
    return !1;
  for (const n of o)
    if (!Object.prototype.hasOwnProperty.call(i, n) || !Ne(e[n], i[n]))
      return !1;
  return !0;
}
function ns(p, t) {
  const e = t.split(".");
  let i = p;
  for (const o of e) {
    if (i == null)
      return;
    i = i[o];
  }
  return i;
}
function rs(p, t, e) {
  const i = t.split(".");
  let o = p;
  for (let s = 0; s < i.length - 1; s++) {
    const n = i[s];
    (o[n] === void 0 || o[n] === null) && (o[n] = {}), o = o[n];
  }
  o[i[i.length - 1]] = e;
}
function jt(p, t, e) {
  let i = 0, o = p.length - 1;
  for (; i <= o; ) {
    const s = Math.floor((i + o) / 2), n = e(p[s]);
    if (n === t)
      return s;
    n < t ? i = s + 1 : o = s - 1;
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
  const o = [];
  let s = "";
  for (const a of t) {
    const l = s + a;
    if (p.measureText(l).width > e) {
      if (s && o.push(s), s = a, o.length >= i)
        break;
    } else
      s = l;
  }
  s && o.length < i && o.push(s);
  const n = o.join(""), r = t.length > n.length;
  if (r && o.length === i) {
    const a = "...";
    let l = o[o.length - 1] ?? "";
    for (; l.length > 0 && p.measureText(l + a).width > e; )
      l = l.slice(0, -1);
    o[o.length - 1] = l + a;
  }
  return { lines: o, isTruncated: r };
}
function ge(p, t, e, i, o) {
  const l = "...", h = o + 8, c = e - 8 * 2, d = Math.max(1, Math.floor((i - 8 * 2) / (h + 2))), u = Math.min(t.maxRows ?? d, d), f = t.tags ?? [], g = /* @__PURE__ */ new Map(), m = (M) => {
    let E = g.get(M);
    return E === void 0 && (E = p.measureText(M).width, g.set(M, E)), E;
  }, x = (M) => {
    const E = `+${M}`;
    return m(E) + 4 * 2;
  }, w = (M) => m(M.text) + 4 * 2, y = m(l), C = [];
  let v = [], R = 0, I = 0;
  for (let M = 0; M < f.length; M++) {
    const E = f[M], T = w(E), D = C.length >= u - 1, H = f.length - M;
    if (D) {
      const O = H > 1 ? x(H - 1) + 4 : 0, k = c - R - O;
      if (T <= k)
        v.push({ tag: E, displayText: E.text, width: T }), R += T + 4, I++;
      else {
        const P = c - R - O;
        if (P >= 4 * 2 + y + 10) {
          const L = P - 8 - y;
          let W = "", A = 0, _ = E.text.length;
          for (; A < _; ) {
            const F = Math.floor((A + _ + 1) / 2), V = E.text.slice(0, F);
            m(V) <= L ? (A = F, W = V) : _ = F - 1;
          }
          if (W.length > 0) {
            const F = W + l, V = m(F) + 4 * 2;
            v.push({ tag: E, displayText: F, width: V }), I++;
          }
        }
        break;
      }
    } else if (T <= c - R)
      v.push({ tag: E, displayText: E.text, width: T }), R += T + 4, I++;
    else if (v.length > 0 && C.push(v), v = [{ tag: E, displayText: E.text, width: T }], R = T + 4, I++, C.length >= u)
      break;
  }
  return v.length > 0 && C.length < u && C.push(v), {
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
  const o = e.getContext("2d");
  if (!o)
    throw new Error("Failed to get 2D context");
  return o.scale(i, i), { canvas: e, ctx: o };
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
    const o = String(i ?? "");
    return o.includes(t) || o.includes('"') || o.includes(`
`) ? `"${o.replace(/"/g, '""')}"` : o;
  }).join(t)).join(`
`);
}
function bt(p, t, e) {
  return p === void 0 ? !1 : typeof p == "function" ? p(t, e) : p;
}
function ut(p, t, e) {
  const i = $(p), o = t.data[i];
  let s = {
    text: String(o ?? ""),
    type: p.type ?? "text"
  };
  if (p.render)
    try {
      const n = p.render(o, t, p, e);
      n && (s = { ...s, ...n });
    } catch (n) {
      console.error(`Error in render function at row ${e}, column ${p.key}:`, n), s = {
        text: "[Error]",
        type: "text"
      };
    }
  return s.type === B.CHECKBOX && !s.checkbox && (s.checkbox = {
    checked: !!o
  }), s.type === B.SWITCH && !s.switch && (s.switch = {
    checked: !!o
  }), s;
}
function me(p, t, e) {
  var n, r;
  const i = $(p), o = t.data[i], s = ut(p, t, e);
  if (s.type === B.SWITCH && s.switch)
    return s.switch.checked ? "是" : "否";
  if (s.type === B.CHECKBOX && s.checkbox)
    return s.checkbox.indeterminate ? "部分选中" : s.checkbox.checked ? "是" : "否";
  if (s.type === B.RADIO && s.radio) {
    const a = (n = s.radio.options) == null ? void 0 : n.find(
      (l) => {
        var h;
        return l.value === ((h = s.radio) == null ? void 0 : h.value);
      }
    );
    return (a == null ? void 0 : a.label) || String(s.radio.value ?? "");
  }
  if (s.type === B.BUTTON && s.button) {
    const a = s.button;
    return Array.isArray(a) ? a.map((l) => l.text ?? "").join(", ") : a.text || "";
  }
  if (s.tags)
    return s.tags.tags.map((a) => a.text).join(", ");
  if (s.type === B.SELECT && s.select) {
    const a = s.select.value;
    if (Array.isArray(a))
      return a.map(
        (c) => {
          var d, u, f;
          return ((f = (u = (d = s.select) == null ? void 0 : d.options) == null ? void 0 : u.find((g) => g.value === c)) == null ? void 0 : f.label) || String(c);
        }
      ).filter(Boolean).join(", ");
    const l = (r = s.select.options) == null ? void 0 : r.find((h) => h.value === a);
    return (l == null ? void 0 : l.label) || String(a ?? "");
  }
  if (s.type === B.DATE && s.date) {
    if (s.date.value) {
      const a = s.date.value;
      return a instanceof Date ? a.toLocaleDateString() : String(a);
    }
    return "";
  }
  if (s.type === B.INPUT && s.input)
    return String(s.input.value ?? "");
  if (p.formatter)
    return p.formatter(o, t, p);
  if (s.text !== void 0)
    return String(s.text);
  switch (p.type) {
    case "number":
      return typeof o == "number" ? o.toLocaleString() : String(o ?? "");
    case "boolean":
      return o ? "是" : "否";
    case "date":
      return o instanceof Date ? o.toLocaleDateString() : String(o ?? "");
    default:
      return String(o ?? "");
  }
}
class ds {
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
}, ze = ["button", "image"];
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
  const i = $(p), o = t.slice(e, e + Ye), s = /* @__PURE__ */ new Map();
  for (let r = 0; r < o.length; r++) {
    const a = o[r], l = a.data[i], h = ut(p, a, e + r), c = Ge(h, l);
    for (const d of c) {
      const u = String(d.value);
      s.has(u) || s.set(u, d);
    }
  }
  return Array.from(s.values());
}
function Ge(p, t) {
  var i, o, s, n;
  const e = [];
  if ((i = p.select) != null && i.options && e.push(...p.select.options), (o = p.tags) != null && o.options && e.push(
    ...p.tags.options.map((r) => ({
      label: r.text,
      value: r.value ?? r.text
    }))
  ), (s = p.radio) != null && s.options && e.push(...p.radio.options), (n = p.color) != null && n.presetColors && e.push(
    ...p.color.presetColors.map((r) => ({
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
function Ue(p, t, e, i = $e) {
  if (!e || e.trim() === "")
    return [];
  const o = $(p), s = e.toLowerCase(), n = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (n.size >= i)
      break;
    const a = r.data[o];
    if (String(a ?? "").toLowerCase().includes(s)) {
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
  constructor(t, e, i, o = 3e3) {
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
    this.rowIdManager = t, this.columnIdManager = e, this.rowVersionManager = i, this.maxCellCacheSize = o;
  }
  // ==================== Key 生成 ====================
  /**
   * 生成单元格缓存 key
   */
  getCellCacheKey(t, e) {
    const i = this.rowIdManager.getId(t), o = this.columnIdManager.getId(e);
    return `${i}-${o}`;
  }
  /**
   * 生成列值缓存 key
   */
  getValueCacheKey(t, e) {
    const i = this.columnIdManager.getId(t), o = this.stringifyValue(e);
    return `${i}-${o}`;
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
  get(t, e, i, o) {
    if (o === "value") {
      const a = this.getValueCacheKey(e, i);
      return this.valueCache.get(a) ?? null;
    }
    const s = this.getCellCacheKey(t, e), n = this.cellCache.get(s);
    if (!n) return null;
    const r = this.rowVersionManager.getVersion(t);
    return n.value !== i || n.rowVersion !== r ? (this.cellCache.delete(s), null) : n.renderResult;
  }
  /**
   * 设置缓存
   */
  set(t, e, i, o, s) {
    if (s === "value") {
      const n = this.getValueCacheKey(e, i);
      this.valueCache.set(n, o);
    } else {
      const n = this.getCellCacheKey(t, e);
      this.ensureCellCapacity(), this.cellCache.set(n, {
        value: i,
        renderResult: o,
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
      const o = i.split("-")[0];
      o && !t.has(o) && e.push(i);
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
      const s = i.split("-").slice(1).join("-");
      s && !t.has(s) && e.push(i);
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
      const o = {
        ...i,
        level: e,
        expanded: i.expanded ?? !1,
        selected: i.selected ?? !1
      };
      return i.children && (o.children = this.processRows(i.children, e + 1)), o;
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
    const i = this.findColumnByKey(this.state.columns, t), o = this.findColumnByKey(this.state.columns, e);
    if (!(!i || !o)) {
      if (i.parentKey && o.parentKey) {
        if (i.parentKey === o.parentKey) {
          const s = this.findColumnByKey(this.state.columns, i.parentKey);
          if (s && s.children) {
            const n = s.children.findIndex((a) => a.key === t), r = s.children.findIndex((a) => a.key === e);
            if (n >= 0 && r >= 0) {
              const a = [...s.children];
              [a[n], a[r]] = [a[r], a[n]], s.children = a;
            }
          }
        }
      } else if (!i.parentKey && !o.parentKey) {
        const s = this.state.columns.findIndex((r) => r.key === t), n = this.state.columns.findIndex((r) => r.key === e);
        if (s >= 0 && n >= 0) {
          const r = [...this.state.columns];
          [r[s], r[n]] = [r[n], r[s]], this.state.columns = r;
        }
      }
    }
  }
  reorderColumns(t, e) {
    if (t === e) return;
    const i = this.getLeafColumnInfo(t);
    if (!i) return;
    const o = this.countLeafColumns(this.state.columns);
    let s = e;
    t < e && (s = e - 1), s < 0 && (s = 0), s > o - 1 && (s = o - 1);
    const n = this.getLeafColumnInfo(s);
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
    const i = (o, s) => {
      for (let n = 0; n < o.length; n++) {
        const r = o[n];
        if (r.children && r.children.length > 0) {
          const a = i(r.children, r.key);
          if (a) return a;
        } else {
          if (e === t)
            return { parent: s, indexInParent: n, column: r };
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
        const o = this.findColumnByKey(i.children, e);
        if (o) return o;
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
    for (const o of t)
      if (e && (i.push(o), o.children && o.children.length > 0 && o.expanded)) {
        const s = this.flattenRowsForDisplay(o.children, !0);
        i.push(...s);
      }
    return i;
  }
  applyFilters(t) {
    const e = (i, o) => {
      for (const s of i) {
        if (s.key === o) return s;
        if (s.children) {
          const n = e(s.children, o);
          if (n) return n;
        }
      }
    };
    return t.filter((i) => {
      const o = this.state.filters.every((s) => {
        const n = e(this.state.columns, s.column);
        if (!n) return !0;
        const r = i.data[$(n)];
        return this.matchesFilter(r, s, i, n);
      });
      return o && i.children && this.applyFilters(i.children).length > 0 ? !0 : o;
    });
  }
  matchesFilter(t, e, i, o) {
    var a;
    if ((a = o.filter) != null && a.custom)
      return o.filter.custom(t, e.value, i);
    const s = e.value, n = String(t ?? "").toLowerCase(), r = String(s ?? "").toLowerCase();
    if (e.operator === "in")
      return Array.isArray(s) ? Array.isArray(t) ? t.some((l) => typeof l == "object" && l !== null && "text" in l ? s.some((h) => String(h) === String(l.text)) : s.some((h) => String(h) === String(l))) : s.some((l) => String(l) === String(t)) : !1;
    if (e.operator === "between" && typeof s == "object" && s !== null) {
      const l = s, h = Number(t);
      if (isNaN(h)) return !1;
      const { min: c, max: d } = l;
      return c !== void 0 && d !== void 0 ? h >= c && h <= d : c !== void 0 ? h >= c : d !== void 0 ? h <= d : !0;
    }
    if (e.operator === "dateRange" && typeof s == "object" && s !== null) {
      const l = s, h = t instanceof Date ? t : new Date(String(t));
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
        return Number(t) > Number(s);
      case "gte":
      case ">=":
        return Number(t) >= Number(s);
      case "lt":
      case "<":
        return Number(t) < Number(s);
      case "lte":
      case "<=":
        return Number(t) <= Number(s);
      case "notIn":
        return Array.isArray(s) ? !s.some((l) => String(l) === String(t)) : !1;
      case "isEmpty":
        return t == null || t === "";
      case "isNotEmpty":
        return t != null && t !== "";
      case "regex":
        try {
          return new RegExp(String(s), "i").test(n);
        } catch {
          return !1;
        }
      default:
        return !0;
    }
  }
  applySort(t) {
    const e = (o, s) => {
      for (const n of o) {
        if (n.key === s) return n;
        if (n.children) {
          const r = e(n.children, s);
          if (r) return r;
        }
      }
    }, i = [...t].sort((o, s) => {
      for (const n of this.state.sort) {
        const r = e(this.state.columns, n.column);
        if (!r) continue;
        const a = $(r), l = o.data[a], h = s.data[a];
        let c = this.compareValues(l, h, r.type);
        if (c !== 0)
          return n.direction === "desc" ? -c : c;
      }
      return 0;
    });
    for (const o of i)
      o.children && this.applySort(o.children);
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
        const o = this.extractNumber(t), s = this.extractNumber(e);
        return o !== null && s !== null ? o - s : String(t).localeCompare(String(e));
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
  updateCell(t, e, i, o) {
    const s = this.state.sortedRows[t];
    if (!s)
      throw new Error(`Row at index ${t} not found`);
    const n = (d, u) => {
      for (const f of d) {
        if (f.key === u) return f;
        if (f.children) {
          const g = n(f.children, u);
          if (g) return g;
        }
      }
    }, r = n(this.state.columns, e), a = o ?? (r == null ? void 0 : r.field) ?? e;
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
    const h = s.data[a];
    s.data[a] = l, this.rowVersionManager.incrementVersion(s), this.recordAction({
      type: "update",
      row: s,
      column: a,
      oldValue: h,
      newValue: l
    });
    const c = this.findStateRow(s);
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
    const o = [];
    for (const [n, r] of Object.entries(e)) {
      const a = i.data[n];
      a !== r && (i.data[n] = r, o.push({
        type: "update",
        rowIndex: t,
        column: n,
        oldValue: a,
        newValue: r
      }));
    }
    for (const n of o)
      this.recordAction({
        type: "update",
        row: i,
        column: n.column,
        oldValue: n.oldValue,
        newValue: n.newValue
      });
    o.length > 0 && this.rowVersionManager.incrementVersion(i);
    const s = this.findStateRow(i);
    return s && Object.assign(s.data, e), this.applyFiltersAndSort(), o;
  }
  addRow(t, e) {
    const i = {
      data: t,
      expanded: !1,
      selected: !1,
      level: 0
    }, o = e !== void 0 && e >= 0 && e <= this.state.rows.length ? e : this.state.rows.length;
    return e !== void 0 && e >= 0 && e <= this.state.rows.length ? this.state.rows.splice(e, 0, i) : this.state.rows.push(i), this.recordAction({
      type: "add",
      row: i,
      rowIndex: o,
      rowData: { ...i, data: { ...i.data } }
    }), this.applyFiltersAndSort(), {
      type: "add",
      rowIndex: o,
      row: i
    };
  }
  findRootRowIndexByRef(t) {
    return this.state.rows.findIndex((e) => e === t);
  }
  addRowRelativeTo(t, e, i) {
    if ((t.level ?? 0) > 0)
      throw new Error("Adding rows relative to child rows is not supported");
    const o = this.findRootRowIndexByRef(t);
    if (o < 0)
      throw new Error("Target row not found");
    const s = i === "above" ? o : o + 1;
    return this.addRow(e, s);
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
    const o = this.findStateRow(i);
    o && (o.selected = e);
  }
  findStateRow(t) {
    const e = (i) => {
      for (const o of i) {
        if (o === t) return o;
        if (o.children) {
          const s = e(o.children);
          if (s) return s;
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
      i.forEach((o) => {
        o.selected = t, o.children && e(o.children);
      });
    };
    e(this.state.sortedRows), e(this.state.rows);
  }
  getVisibleRows(t, e) {
    const i = [], o = (s, n, r) => {
      let a = 0;
      for (const l of s)
        if (a >= n && a <= r && i.push(l), a++, l.children && l.expanded && o(l.children, n - a, r - a), a > r) break;
    };
    return o(this.state.sortedRows, t, e), i;
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
    const { includeHeaders: e = !0 } = t, i = this.getExportContext(t), o = [];
    e && o.push(i.leafColumns.map((s) => s.title));
    for (const s of i.rows)
      o.push(s.cells.map((n) => n.displayValue));
    return o;
  }
  getExportContext(t) {
    const { includeHidden: e = !1, selectedOnly: i = !1, showRowNumbers: o = !1 } = t, s = i ? this.state.sortedRows.filter((h) => h.selected) : this.state.sortedRows, n = this.getExportColumnTree(e), r = this.getLeafColumnsList(e), a = this.getHeaderDepth(n), l = r.filter((h) => h.fixed === "left").length;
    return {
      columnTree: n,
      leafColumns: r,
      rows: s.map((h, c) => ({
        row: h,
        rowIndex: c,
        cells: r.map((d) => {
          const u = h.data[$(d)];
          return {
            column: d,
            rawValue: u,
            displayValue: me(d, h, c)
          };
        })
      })),
      bodyMerges: s.flatMap(
        (h, c) => (h.cellMerges ?? []).map((d) => ({
          startRow: c,
          startCol: Math.max(0, d.columnIndex - (o ? 1 : 0)),
          endRow: c + d.rowspan - 1,
          endCol: Math.max(0, d.columnIndex - (o ? 1 : 0)) + d.colspan - 1
        }))
      ),
      headerDepth: a,
      leftFixedLeafColumnCount: l
    };
  }
  getLeafColumnsList(t = !1) {
    const e = [], i = (o, s = !1) => {
      for (const n of o) {
        const r = s || n.hidden === !0;
        n.children && n.children.length > 0 ? i(n.children, r) : (t || !r) && e.push(n);
      }
    };
    return i(this.state.columns), e;
  }
  getExportColumnTree(t = !1) {
    const e = (i, o = !1) => {
      const s = [];
      for (const n of i) {
        const r = o || n.hidden === !0, a = n.children ? e(n.children, r) : void 0;
        if (a && a.length > 0) {
          s.push({
            ...n,
            children: a
          });
          continue;
        }
        (t || !r) && s.push({
          ...n,
          children: void 0
        });
      }
      return s;
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
const qt = 5, Zt = 2, Je = 32, Ht = 150, Jt = 50, te = 500, nt = class nt {
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
      (t) => (t == null ? void 0 : t.fixed) === "left" && !t._isRowNumber && !t.key.startsWith(nt.HIDDEN_PLACEHOLDER_PREFIX)
    );
  }
  isHiddenPlaceholderColumn(t) {
    return t.key.startsWith(nt.HIDDEN_PLACEHOLDER_PREFIX);
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
    const i = tt(e, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(t, i), this.hasRowHeightOverrides = !0, this.rowHeightsDirty = !0;
  }
  updateRowHeight(t, e) {
    const i = tt(e, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(t, i), this.hasRowHeightOverrides = !0;
    const o = this.rowIndexByRow.get(t);
    if (o === void 0 || o < 0 || o >= this.rowHeights.length)
      return this.rowHeightsDirty = !0, !1;
    const s = this.rowHeights[o] ?? this.theme.row.height, n = i - s;
    if (n === 0)
      return !0;
    this.rowHeights[o] = i, this.rowHeightByRow.set(t, i);
    for (let a = o + 1; a < this.rowOffsets.length; a++)
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
    const o = this.rowIndexByRow.get(t);
    if (o === void 0 || o < 0 || o >= this.rowHeights.length)
      return !1;
    if (e === i)
      return !0;
    const s = this.getResolvedRowHeight(t);
    return !this.removeRowFromPinSource(t, e, s) || !this.addRowToPinTarget(t, i, o, s) ? !1 : (this.updatePinnedBandOffsets(this.rowBands.pinnedTop.rows), this.updatePinnedBandOffsets(this.rowBands.pinnedBottom.rows), this.updateRowBandGeometry(), this.layoutInfo.totalHeight = this.calculateTotalHeight(this.rowHeights.length), this.updateVisibleRange(), !0);
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
      render: (e, i, o, s) => ({
        text: String(s + 1),
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
      key: nt.HIDDEN_PLACEHOLDER_PREFIX + n.key,
      title: "",
      width: nt.HIDDEN_PLACEHOLDER_WIDTH,
      type: "text",
      fixed: r,
      _hiddenColumnKey: n.key
    }), o = (n, r, a) => {
      for (let l = r; l >= 0 && l < n.length; l += a) {
        const h = n[l];
        if (h && !h.hidden)
          return h.fixed === "left" || h.fixed === "right" ? h.fixed : void 0;
      }
    }, s = (n, r) => {
      let a = 0, l = !1;
      for (let h = 0; h < n.length; h++) {
        const c = n[h];
        if (c) {
          if (c.hidden) {
            const d = n.slice(0, h).some((g) => g && !g.hidden), u = n.slice(h + 1).some((g) => g && !g.hidden);
            if (r ? d && u : (l === !1 || a > 0) && (u || a > 0)) {
              const g = o(n, h - 1, -1), m = o(n, h + 1, 1), w = i(c, g === m ? g : void 0);
              e.push(w), a += nt.HIDDEN_PLACEHOLDER_WIDTH;
            }
            l = !0;
            continue;
          }
          if (l = !1, c.children && c.children.length > 0) {
            const d = e.length;
            s(c.children, !1), e.length > d && (a += e.slice(d).reduce((u, f) => u + this.getColumnWidth(f), 0));
          } else
            e.push(c), a += this.getColumnWidth(c);
        }
      }
    };
    return s(this.buildLayoutColumns(t), !0), e;
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
    const e = (s, n) => {
      if (s.hidden) return n;
      if (s.children && s.children.length > 0) {
        let r = n;
        for (const a of s.children)
          a.hidden || (r = Math.max(
            r,
            e(a, n + 1)
          ));
        return r;
      }
      return n;
    };
    for (const s of t)
      s.hidden || (this.headerDepth = Math.max(this.headerDepth, e(s, 0) + 1));
    const i = (s, n, r, a) => {
      if (s.depth = n, s.parentKey = a, s.hidden)
        return 0;
      if (s.children && s.children.length > 0) {
        let l = r, h = 0, c = 0, d = !1;
        for (let u = 0; u < s.children.length; u++) {
          const f = s.children[u];
          if (!f) continue;
          if (f.hidden) {
            const m = s.children.slice(u + 1).some((x) => x && !x.hidden);
            if ((d === !1 || h > 0) && (m || h > 0)) {
              let x;
              for (let E = u - 1; E >= 0; E--) {
                const T = s.children[E];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (x = T.fixed);
                  break;
                }
              }
              let w;
              for (let E = u + 1; E < s.children.length; E++) {
                const T = s.children[E];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (w = T.fixed);
                  break;
                }
              }
              const y = x === w ? x : void 0, C = nt.HIDDEN_PLACEHOLDER_PREFIX + f.key, v = {
                key: C,
                title: "",
                width: nt.HIDDEN_PLACEHOLDER_WIDTH,
                type: "text",
                fixed: y,
                _hiddenColumnKey: f.key
              }, R = nt.HIDDEN_PLACEHOLDER_WIDTH;
              this.columnWidths.set(C, R), this.leafColumns.push(v);
              const I = n + 1, M = this.headerDepth - I;
              this.headerCells.push({
                column: v,
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
          const g = i(f, n + 1, l, s.key);
          l += g, h += g, c++;
        }
        return c === 0 ? 0 : (this.headerCells.push({
          column: s,
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
        const l = this.getColumnWidth(s);
        this.columnWidths.set(s.key, l);
        const h = this.headerDepth - n;
        return this.headerCells.push({
          column: s,
          x: r,
          y: n * this.theme.row.headerHeight,
          width: l,
          height: this.theme.row.headerHeight * h,
          rowIndex: n,
          colIndex: this.leafColumns.length,
          colspan: 1,
          rowspan: h,
          isLeaf: !0
        }), this.leafColumns.push(s), l;
      }
    };
    let o = 0;
    for (let s = 0; s < t.length; s++) {
      const n = t[s];
      if (n) {
        if (n.hidden) {
          const r = t.slice(s + 1).some((l) => l && !l.hidden);
          if (t.slice(0, s).some((l) => l && !l.hidden) && r) {
            let l;
            for (let g = s - 1; g >= 0; g--) {
              const m = t[g];
              if (m && !m.hidden) {
                (m.fixed === "left" || m.fixed === "right") && (l = m.fixed);
                break;
              }
            }
            let h;
            for (let g = s + 1; g < t.length; g++) {
              const m = t[g];
              if (m && !m.hidden) {
                (m.fixed === "left" || m.fixed === "right") && (h = m.fixed);
                break;
              }
            }
            const c = l === h ? l : void 0, d = nt.HIDDEN_PLACEHOLDER_PREFIX + n.key, u = {
              key: d,
              title: "",
              width: nt.HIDDEN_PLACEHOLDER_WIDTH,
              type: "text",
              fixed: c,
              _hiddenColumnKey: n.key
            }, f = nt.HIDDEN_PLACEHOLDER_WIDTH;
            this.columnWidths.set(d, f), this.headerCells.push({
              column: u,
              x: o,
              y: 0,
              width: f,
              height: this.theme.row.headerHeight * this.headerDepth,
              rowIndex: 0,
              colIndex: this.leafColumns.length,
              colspan: 1,
              rowspan: this.headerDepth,
              isLeaf: !0
            }), this.leafColumns.push(u), o += f;
          }
          continue;
        }
        o += i(n, 0, o);
      }
    }
  }
  calculateColumnLayout(t) {
    this.columnOffsets = [];
    const e = [];
    let i = 0;
    for (const o of this.leafColumns) {
      const s = this.columnWidths.get(o.key) ?? this.getColumnWidth(o);
      e.push(s), this.columnOffsets.push(i), i += s;
    }
    this.layoutInfo.columnWidths = e;
  }
  calculateCellMerges(t) {
    this.cellMergeMap.clear(), this.cellMergeByRow.clear(), this.mergedCellSet.clear(), this.cellToMergeMap.clear();
    for (let e = 0; e < t.length; e++) {
      const i = t[e];
      if (!(!i || !i.cellMerges))
        for (const o of i.cellMerges) {
          const s = {
            ...o,
            rowIndex: e
          }, n = `${e}-${o.columnIndex}`;
          this.cellMergeMap.set(n, s), this.cellToMergeMap.set(n, s);
          for (let r = e; r < e + o.rowspan; r++) {
            this.cellMergeByRow.has(r) || this.cellMergeByRow.set(r, []), this.cellMergeByRow.get(r).push(s);
            for (let a = o.columnIndex; a < o.columnIndex + o.colspan; a++)
              (r !== e || a !== o.columnIndex) && (this.mergedCellSet.add(`${r}-${a}`), this.cellToMergeMap.set(`${r}-${a}`, s));
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
    const s = this.rowHeightFn;
    this.rowHeights = t.map((n, r) => {
      const a = this.rowHeightOverrides.get(n);
      return a !== void 0 ? tt(a, this.theme.row.minHeight, this.theme.row.maxHeight) : s ? s(n, r) : i;
    }), t.forEach((n, r) => {
      this.rowHeightByRow.set(n, this.rowHeights[r] ?? i), this.rowIndexByRow.set(n, r);
    }), this.rowOffsets = Array.from({ length: e }), this.rowOffsets[0] = this.layoutInfo.headerHeight;
    for (let n = 1; n < e; n++)
      this.rowOffsets[n] = this.rowOffsets[n - 1] + this.rowHeights[n - 1];
    this.layoutInfo.rowOffsets = [...this.rowOffsets], this.calculateRowBands(t);
  }
  calculateRowBands(t) {
    this.bodyRowIndexByRow = /* @__PURE__ */ new WeakMap(), this.rowBandOffsetByRow = /* @__PURE__ */ new WeakMap(), this.pinnedRowByRow = /* @__PURE__ */ new WeakMap();
    const e = new Set(t), i = this.rowPinManager ? this.rowPinManager.getTopRows().filter((u) => e.has(u)) : [], o = this.rowPinManager ? this.rowPinManager.getBottomRows().filter((u) => e.has(u)) : [], s = this.rowPinManager ? t.filter((u) => !this.rowPinManager.isPinned(u)) : t;
    this.pinnedTopHeight = this.calculateRowsHeight(i), this.pinnedBottomHeight = this.calculateRowsHeight(o), this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight - this.layoutInfo.headerHeight - this.summaryTopHeight - this.pinnedTopHeight - this.pinnedBottomHeight - this.summaryBottomHeight
    );
    const n = this.layoutInfo.headerHeight, r = n + this.summaryTopHeight, a = r + this.pinnedTopHeight, l = this.viewportHeight > 0 ? Math.max(a, this.viewportHeight - this.summaryBottomHeight) : a + this.calculateRowsHeight(s) + this.pinnedBottomHeight, h = this.viewportHeight > 0 ? Math.max(a, l - this.pinnedBottomHeight) : a + this.calculateRowsHeight(s);
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
        rows: s,
        height: this.calculateRowsHeight(s),
        y: a
      },
      pinnedBottom: {
        type: "pinned-bottom",
        rows: o,
        height: this.pinnedBottomHeight,
        y: h
      },
      summaryBottom: {
        type: "summary-bottom",
        rows: this.rowBands.summaryBottom.rows,
        height: this.summaryBottomHeight,
        y: l
      }
    }, this.bodyRowHeights = s.map((u) => this.getResolvedRowHeight(u)), this.bodyRowOffsets = Array.from({ length: s.length }), s.length > 0) {
      this.bodyRowOffsets[0] = 0;
      for (let u = 1; u < s.length; u++)
        this.bodyRowOffsets[u] = this.bodyRowOffsets[u - 1] + this.bodyRowHeights[u - 1];
    }
    let c = 0;
    for (const u of i)
      this.pinnedRowByRow.set(u, !0), this.rowBandOffsetByRow.set(u, c), c += this.getResolvedRowHeight(u);
    for (let u = 0; u < s.length; u++) {
      const f = s[u];
      this.bodyRowIndexByRow.set(f, u), this.rowBandOffsetByRow.set(f, this.bodyRowOffsets[u] ?? 0);
    }
    let d = 0;
    for (const u of o)
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
  addRowToPinTarget(t, e, i, o) {
    return e === "top" ? (this.rowBands.pinnedTop.rows.push(t), this.pinnedTopHeight += o, this.rowBands.pinnedTop.height = this.pinnedTopHeight, this.pinnedRowByRow.set(t, !0), !0) : e === "bottom" ? (this.rowBands.pinnedBottom.rows.push(t), this.pinnedBottomHeight += o, this.rowBands.pinnedBottom.height = this.pinnedBottomHeight, this.pinnedRowByRow.set(t, !0), !0) : (this.insertBodyRow(t, i, o), this.pinnedRowByRow.delete(t), !0);
  }
  removePinnedRow(t, e, i) {
    const o = t.indexOf(e);
    return o < 0 ? !1 : (t.splice(o, 1), this.pinnedRowByRow.delete(e), this.rowBandOffsetByRow.delete(e), i(), !0);
  }
  removeBodyRow(t, e) {
    const i = this.bodyRowIndexByRow.get(t);
    return i === void 0 || i < 0 ? !1 : (this.rowBands.body.rows.splice(i, 1), this.bodyRowHeights.splice(i, 1), this.bodyRowOffsets.splice(i, 1), this.rowBands.body.height -= e, this.bodyRowIndexByRow.delete(t), this.rowBandOffsetByRow.delete(t), this.rebuildBodyBandFrom(i), !0);
  }
  insertBodyRow(t, e, i) {
    const o = this.findBodyInsertionIndex(e);
    this.rowBands.body.rows.splice(o, 0, t), this.bodyRowHeights.splice(o, 0, i), this.bodyRowOffsets.splice(o, 0, 0), this.rowBands.body.height += i, this.rebuildBodyBandFrom(o);
  }
  findBodyInsertionIndex(t) {
    let e = 0, i = this.rowBands.body.rows.length;
    for (; e < i; ) {
      const o = Math.floor((e + i) / 2), s = this.rowBands.body.rows[o];
      (s ? this.getRowIndexByRef(s) : -1) < t ? e = o + 1 : i = o;
    }
    return e;
  }
  rebuildBodyBandFrom(t) {
    const e = Math.max(0, t);
    for (let i = e; i < this.rowBands.body.rows.length; i++) {
      this.bodyRowOffsets[i] = i === 0 ? 0 : (this.bodyRowOffsets[i - 1] ?? 0) + (this.bodyRowHeights[i - 1] ?? 0);
      const o = this.rowBands.body.rows[i];
      this.bodyRowIndexByRow.set(o, i), this.rowBandOffsetByRow.set(o, this.bodyRowOffsets[i] ?? 0);
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
    const t = this.layoutInfo.headerHeight, e = t + this.summaryTopHeight, i = e + this.pinnedTopHeight, o = this.viewportHeight > 0 ? Math.max(i, this.viewportHeight - this.summaryBottomHeight) : i + this.rowBands.body.height + this.pinnedBottomHeight;
    this.rowBands.summaryTop.y = t, this.rowBands.pinnedTop.y = e, this.rowBands.body.y = i, this.rowBands.pinnedBottom.y = this.viewportHeight > 0 ? Math.max(i, o - this.pinnedBottomHeight) : i + this.rowBands.body.height, this.rowBands.summaryBottom.y = o;
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
      for (const o of t.children)
        i += this.getColumnWidth(o);
      return i;
    }
    let e = t.width ?? this.config.estimatedColumnWidth ?? Ht;
    return e = tt(e, t.minWidth ?? Jt, t.maxWidth ?? te), e;
  }
  setColumnWidth(t, e) {
    const i = this.getColumnByKey(t);
    if (i) {
      const o = tt(
        e,
        i.minWidth ?? Jt,
        i.maxWidth ?? te
      );
      this.columnWidths.set(t, o), this.recalculateColumnLayout(), this.recalculateHeaderLayout();
    }
  }
  recalculateColumnLayout() {
    this.columnOffsets = [];
    const t = [];
    let e = 0;
    for (const i of this.leafColumns) {
      const o = this.columnWidths.get(i.key) ?? this.getColumnWidth(i);
      t.push(o), this.columnOffsets.push(e), e += o;
    }
    this.layoutInfo.columnWidths = t, this.layoutInfo.totalWidth = this.calculateTotalWidth();
  }
  recalculateHeaderLayout() {
    const t = (e, i) => {
      let o = i;
      for (const s of e) {
        const n = this.headerCells.find((r) => r.column === s);
        n && (n.x = o, s.children && s.children.length > 0 ? n.width = t(s.children, o) : n.width = this.columnWidths.get(s.key) ?? this.getColumnWidth(s), o += n.width);
      }
      return o - i;
    };
    t(this.columns, 0);
  }
  getColumnByKey(t) {
    const e = (i) => {
      for (const o of i) {
        if (o.key === t) return o;
        if (o.children) {
          const s = e(o.children);
          if (s) return s;
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
    const t = this.layoutInfo.headerHeight, e = this.config.rowBufferSize ?? qt, i = this.config.columnBufferSize ?? Zt, o = this.bodyViewportHeight > 0 ? this.bodyViewportHeight : Math.max(0, this.viewportHeight - t), s = this.findBodyRowIndexAtOffset(this.scrollTop), n = this.findBodyRowIndexAtOffset(this.scrollTop + o);
    this.visibleRange.startRow = Math.max(0, s - e), this.visibleRange.endRow = Math.min(this.bodyRowHeights.length - 1, n + e);
    const r = this.findColumnIndexAtOffset(this.scrollLeft), a = this.findColumnIndexAtOffset(this.scrollLeft + this.viewportWidth);
    this.visibleRange.startColumn = Math.max(0, r - i), this.visibleRange.endColumn = Math.min(
      this.layoutInfo.columnWidths.length - 1,
      a + i
    );
  }
  findRowIndexAtOffset(t) {
    if (t <= 0 || this.rowOffsets.length === 0) return 0;
    const e = this.rowOffsets[this.rowOffsets.length - 1] ?? 0;
    return t >= e ? this.rowOffsets.length - 1 : jt(this.rowOffsets, t, (i) => i);
  }
  findBodyRowIndexAtOffset(t) {
    if (t <= 0 || this.bodyRowOffsets.length === 0) return 0;
    const e = this.bodyRowOffsets.length - 1, i = this.bodyRowOffsets[e] ?? 0, o = this.bodyRowHeights[e] ?? 0;
    if (t >= i + o)
      return e;
    let s = 0, n = e;
    for (; s <= n; ) {
      const r = Math.floor((s + n) / 2), a = this.bodyRowOffsets[r], l = this.bodyRowHeights[r];
      if (t >= a && t < a + l)
        return r;
      t < a ? n = r - 1 : s = r + 1;
    }
    return Math.max(0, Math.min(e, s));
  }
  findRowInBandAtOffset(t, e) {
    if (e < 0)
      return null;
    let i = 0;
    for (const o of t) {
      const s = this.getResolvedRowHeight(o);
      if (e >= i && e < i + s)
        return o;
      i += s;
    }
    return null;
  }
  findSummaryRowInBandAtOffset(t, e) {
    if (e < 0)
      return null;
    let i = 0;
    for (const o of t) {
      if (e >= i && e < i + o.height)
        return o;
      i += o.height;
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
    const o = i.find(
      (n) => n.column.fixed === "left" || n.column.fixed === "right"
    );
    if (o) {
      if (o.isLeaf) return o;
      for (const n of this.headerCells) {
        if (!n.isLeaf || n.column.fixed !== o.column.fixed) continue;
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
    const s = i.find((n) => n.isLeaf);
    if (s) return s;
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
    let o = e.x;
    const s = e.y, n = e.width, r = e.height;
    if (i.fixed !== "left") if (i.fixed === "right") {
      const a = this.getRightFixedWidth(), h = this.viewportWidth - a - (this.layoutInfo.totalWidth - a);
      o = e.x + h;
    } else
      o = o - this.scrollLeft;
    return { x: o, y: s, width: n, height: r };
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
    const o = this.getColumnOffset(i.columnIndex), s = this.getRowOffset(i.rowIndex);
    let n = 0;
    for (let a = 0; a < i.colspan; a++)
      n += this.getColumnWidthByIndex(i.columnIndex + a);
    let r = 0;
    for (let a = 0; a < i.rowspan; a++)
      r += this.getRowHeightByIndex(i.rowIndex + a);
    return { x: o, y: s, width: n, height: r };
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
    let o = this.getColumnOffset(e);
    const s = t === -1 ? 0 : this.getRowOffset(t), n = this.getColumnWidthByIndex(e), r = t === -1 ? this.layoutInfo.headerHeight : this.getRowHeightByIndex(t);
    if ((i == null ? void 0 : i.fixed) === "left") {
      let a = 0;
      for (let l = 0; l < this.leafColumns.length; l++) {
        const h = this.leafColumns[l];
        if ((h == null ? void 0 : h.fixed) === "left") {
          if (l === e) {
            o = a;
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
            o = l;
            break;
          }
          l += this.layoutInfo.columnWidths[h];
        }
      }
    }
    return { x: o, y: s, width: n, height: r };
  }
  getCellAtPosition(t, e, i) {
    const o = this.layoutInfo.headerHeight, s = i ?? this.scrollTop;
    if (e - s < o) {
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
    const o = (() => {
      const a = this.getMouseRegion(t);
      return a === "left-fixed" ? this.findColumnIndexInLeftFixed(t) : a === "right-fixed" ? this.findColumnIndexInRightFixed(t) : this.findColumnIndexInScrollable(t + this.scrollLeft);
    })();
    if (o < 0 || o >= this.layoutInfo.columnWidths.length || e < this.layoutInfo.headerHeight)
      return null;
    if (this.summaryTopHeight > 0 && e < this.rowBands.summaryTop.y + this.summaryTopHeight) {
      const a = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryTop.rows,
        e - this.rowBands.summaryTop.y
      );
      return a ? { row: a, band: "summary-top", columnIndex: o } : null;
    }
    if (e < this.rowBands.pinnedTop.y + this.pinnedTopHeight) {
      const a = this.findRowInBandAtOffset(
        this.rowBands.pinnedTop.rows,
        e - this.rowBands.pinnedTop.y
      );
      return a ? { row: a, band: "pinned-top", columnIndex: o } : null;
    }
    if (this.summaryBottomHeight > 0 && e >= this.rowBands.summaryBottom.y && e < this.rowBands.summaryBottom.y + this.summaryBottomHeight) {
      const a = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryBottom.rows,
        e - this.rowBands.summaryBottom.y
      );
      return a ? { row: a, band: "summary-bottom", columnIndex: o } : null;
    }
    if (this.pinnedBottomHeight > 0 && e >= this.rowBands.pinnedBottom.y && e < this.rowBands.pinnedBottom.y + this.pinnedBottomHeight) {
      const a = this.findRowInBandAtOffset(
        this.rowBands.pinnedBottom.rows,
        e - this.rowBands.pinnedBottom.y
      );
      return a ? { row: a, band: "pinned-bottom", columnIndex: o } : null;
    }
    const s = i + (e - this.rowBands.body.y), n = this.findBodyRowIndexAtOffset(s), r = this.rowBands.body.rows[n];
    return r ? { row: r, band: "body", columnIndex: o } : null;
  }
  getCellAtViewportPosition(t, e, i = this.scrollTop) {
    if (e < this.layoutInfo.headerHeight) {
      const r = this.findColumnIndexAtPosition(t + this.scrollLeft);
      return r < 0 ? null : { rowIndex: -1, columnIndex: r };
    }
    const o = this.getRowHitAtViewportPosition(t, e, i);
    if (!o || o.band === "summary-top" || o.band === "summary-bottom")
      return null;
    const s = this.getRowIndexByRef(o.row);
    if (s < 0)
      return null;
    const n = this.getCellMerge(s, o.columnIndex);
    return n ? { rowIndex: n.rowIndex, columnIndex: n.columnIndex } : { rowIndex: s, columnIndex: o.columnIndex };
  }
  findRowIndexAtPosition(t) {
    let e = 0, i = this.rowOffsets.length - 1;
    for (; e <= i; ) {
      const o = Math.floor((e + i) / 2), s = this.rowOffsets[o], n = this.rowHeights[o];
      if (t >= s && t < s + n)
        return o;
      t < s ? i = o - 1 : e = o + 1;
    }
    return -1;
  }
  findColumnIndexAtPosition(t) {
    const e = t - this.scrollLeft, i = this.getLeftFixedWidth(), o = this.getRightFixedWidth();
    if (i > 0 && e < i) {
      let s = 0;
      for (let n = 0; n < this.leafColumns.length; n++) {
        const r = this.leafColumns[n];
        if ((r == null ? void 0 : r.fixed) === "left") {
          const a = this.layoutInfo.columnWidths[n];
          if (e >= s && e < s + a)
            return n;
          s += a;
        }
      }
      return -1;
    }
    if (o > 0) {
      const s = this.viewportWidth - o;
      if (e >= s && e < this.viewportWidth) {
        let n = s;
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
    for (let s = 0; s < this.columnOffsets.length; s++) {
      const n = this.leafColumns[s];
      if ((n == null ? void 0 : n.fixed) === "left" || (n == null ? void 0 : n.fixed) === "right")
        continue;
      const r = this.columnOffsets[s], a = this.layoutInfo.columnWidths[s];
      if (t >= r && t < r + a)
        return s;
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
    const e = [], i = [], o = [];
    for (const a of this.leafColumns.length > 0 ? this.leafColumns : t)
      a.fixed === "left" ? e.push(a) : a.fixed === "right" ? i.push(a) : o.push(a);
    const s = e.reduce((a, l) => a + this.getColumnWidth(l), 0), n = i.reduce((a, l) => a + this.getColumnWidth(l), 0), r = o.reduce((a, l) => a + this.getColumnWidth(l), 0);
    return {
      leftFixed: { columns: e, width: s },
      rightFixed: { columns: i, width: n },
      center: { columns: o, width: r }
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
    const o = t - this.scrollLeft, s = this.getLeftFixedWidth(), n = this.getRightFixedWidth();
    if (s > 0 && o < s) {
      let r = 0;
      for (let a = 0; a < this.leafColumns.length; a++) {
        const l = this.leafColumns[a];
        if ((l == null ? void 0 : l.fixed) === "left") {
          if (r += this.layoutInfo.columnWidths[a], Math.abs(o - r) <= 5)
            return a;
        } else
          break;
      }
      return -1;
    }
    if (n > 0) {
      const r = this.viewportWidth - n;
      if (o >= r) {
        let a = this.viewportWidth;
        if (Math.abs(o - r) <= 5)
          for (let l = 0; l < this.leafColumns.length; l++) {
            const h = this.leafColumns[l];
            if ((h == null ? void 0 : h.fixed) === "right")
              return l;
          }
        for (let l = this.leafColumns.length - 1; l >= 0; l--) {
          const h = this.leafColumns[l];
          if ((h == null ? void 0 : h.fixed) === "right") {
            if (a -= this.layoutInfo.columnWidths[l], Math.abs(o - a) <= 5)
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
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), i = this.scrollLeft + t, o = this.scrollLeft + this.viewportWidth - e, s = [];
    for (let n = 0; n < this.leafColumns.length; n++) {
      const r = this.leafColumns[n];
      if ((r == null ? void 0 : r.fixed) === "left" || (r == null ? void 0 : r.fixed) === "right")
        continue;
      const a = this.columnOffsets[n] ?? 0;
      a + (this.layoutInfo.columnWidths[n] ?? 0) >= i && a <= o && s.push(n);
    }
    return s;
  }
  getVisibleHeaderCells() {
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), i = this.scrollLeft + t, o = this.scrollLeft + this.viewportWidth - e, s = [], n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
    for (const a of this.headerCells) {
      const l = a.x, h = a.x + a.width, c = a.column.fixed === "left", d = a.column.fixed === "right", u = a.column.key;
      if (c || d) {
        if (!n.has(u)) {
          s.push(a), n.add(u);
          let f = a.column.parentKey;
          for (; f; ) {
            r.add(f);
            const g = this.getColumnByKey(f);
            f = g == null ? void 0 : g.parentKey;
          }
        }
        continue;
      }
      if (h >= i && l <= o && !n.has(u)) {
        s.push(a), n.add(u);
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
      r.has(a.column.key) && !n.has(l) && (s.push(a), n.add(l));
    }
    return s;
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
    const o = this.hitTestScrollbar(t, e, i);
    return o || (e < this.layoutInfo.headerHeight ? this.hitTestHeader(t, e) : this.hitTestCell(t, e));
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
    const o = this.layoutInfo, s = this.getMaxScrollTop(), n = this.getMaxScrollLeft(), r = 10, a = 30, l = o.headerHeight;
    if (s > 0) {
      const h = this.viewportHeight - l, c = Math.max(
        a,
        this.viewportHeight / o.totalHeight * h
      ), d = l + this.scrollTop / s * (h - c), u = this.viewportWidth - r, f = r - 2;
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
      const h = this.viewportWidth - (s > 0 ? r : 0), c = Math.max(
        a,
        this.viewportWidth / o.totalWidth * h
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
    const i = this.getMouseRegion(t), o = this.hitTestResizeHandle(t, i);
    if (o >= 0)
      return {
        region: "header",
        regionDetail: i,
        isResizeHandle: !0,
        resizeColumnIndex: o,
        viewport: { x: t, y: e }
      };
    const s = this.getHeaderCellAtPosition(t, e);
    return {
      region: "header",
      regionDetail: i,
      headerCell: s ?? void 0,
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
    for (let o = 0; o < this.leafColumns.length; o++) {
      const s = this.leafColumns[o];
      if ((s == null ? void 0 : s.fixed) === "left") {
        if (i += this.layoutInfo.columnWidths[o], Math.abs(t - i) <= e)
          return o;
      } else
        break;
    }
    return -1;
  }
  /**
   * 检测右侧固定列的 resize handle
   */
  hitTestRightFixedResizeHandle(t, e) {
    const i = this.getRightFixedWidth(), o = this.viewportWidth - i;
    if (Math.abs(t - o) <= e)
      for (let n = 0; n < this.leafColumns.length; n++) {
        const r = this.leafColumns[n];
        if ((r == null ? void 0 : r.fixed) === "right")
          return n;
      }
    let s = this.viewportWidth;
    for (let n = this.leafColumns.length - 1; n >= 0; n--) {
      const r = this.leafColumns[n];
      if ((r == null ? void 0 : r.fixed) === "right") {
        if (s -= this.layoutInfo.columnWidths[n], Math.abs(t - s) <= e)
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
    for (let o = 0; o < this.leafColumns.length; o++) {
      const s = this.leafColumns[o];
      if ((s == null ? void 0 : s.fixed) === "left" || (s == null ? void 0 : s.fixed) === "right")
        continue;
      const n = this.columnOffsets[o], r = this.layoutInfo.columnWidths[o];
      if (n !== void 0 && Math.abs(i - (n + r)) <= e)
        return o;
    }
    return -1;
  }
  /**
   * 检测单元格区域
   */
  hitTestCell(t, e) {
    const i = this.getMouseRegion(t), o = this.hitTestRowResizeHandleAtViewportPosition(e);
    let s;
    if (i === "left-fixed")
      s = this.findColumnIndexInLeftFixed(t);
    else if (i === "right-fixed")
      s = this.findColumnIndexInRightFixed(t);
    else {
      const h = t + this.scrollLeft;
      s = this.findColumnIndexInScrollable(h);
    }
    if (s < 0 || s >= this.layoutInfo.columnWidths.length)
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
    if (!r && o < 0)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const a = o >= 0 ? o : (r == null ? void 0 : r.rowIndex) ?? -1;
    if (a < 0 || a >= this.rowHeights.length)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const l = this.getCellMerge(a, s);
    return l ? {
      region: "cell",
      regionDetail: i,
      cell: { rowIndex: l.rowIndex, columnIndex: l.columnIndex },
      rowHit: n ?? void 0,
      isRowResizeHandle: o >= 0,
      resizeRowIndex: o >= 0 ? o : void 0,
      viewport: { x: t, y: e }
    } : {
      region: "cell",
      regionDetail: i,
      cell: { rowIndex: a, columnIndex: s },
      rowHit: n ?? void 0,
      isRowResizeHandle: o >= 0,
      resizeRowIndex: o >= 0 ? o : void 0,
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
    const o = this.findBodyResizeHandleAtViewportY(t, 4);
    if (o >= 0)
      return o;
    const s = this.findResizeHandleInPinnedRows(
      this.rowBands.pinnedBottom.rows,
      this.rowBands.pinnedBottom.y,
      t,
      4
    );
    return s >= 0 ? s : -1;
  }
  findBodyResizeHandleAtViewportY(t, e) {
    if (this.rowBands.body.rows.length === 0)
      return -1;
    const i = this.rowBands.body.y, o = i + this.bodyViewportHeight;
    if (t < i - e || t > o + e)
      return -1;
    const s = this.scrollTop + (t - i), n = this.findBodyRowIndexAtOffset(Math.max(0, s - e)), r = [n, n + 1];
    for (const a of r) {
      const l = this.rowBands.body.rows[a];
      if (!l) continue;
      const h = i + (this.bodyRowOffsets[a] ?? 0) + this.getResolvedRowHeight(l) - this.scrollTop;
      if (Math.abs(t - h) <= e)
        return this.getRowIndexByRef(l);
    }
    return -1;
  }
  findResizeHandleInPinnedRows(t, e, i, o) {
    for (const s of t) {
      const n = e + (this.getRowBandOffsetByRef(s) ?? 0) + this.getResolvedRowHeight(s);
      if (Math.abs(i - n) <= o)
        return this.getRowIndexByRef(s);
    }
    return -1;
  }
  /**
   * 在左侧固定列中查找列索引
   */
  findColumnIndexInLeftFixed(t) {
    let e = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const o = this.leafColumns[i];
      if ((o == null ? void 0 : o.fixed) === "left") {
        const s = this.layoutInfo.columnWidths[i];
        if (t >= e && t < e + s)
          return i;
        e += s;
      }
    }
    return -1;
  }
  /**
   * 在右侧固定列中查找列索引
   */
  findColumnIndexInRightFixed(t) {
    const e = this.getRightFixedWidth();
    let o = this.viewportWidth - e;
    for (let s = 0; s < this.leafColumns.length; s++) {
      const n = this.leafColumns[s];
      if ((n == null ? void 0 : n.fixed) === "right") {
        const r = this.layoutInfo.columnWidths[s];
        if (t >= o && t < o + r)
          return s;
        o += r;
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
      const o = this.columnOffsets[e], s = this.layoutInfo.columnWidths[e];
      if (o !== void 0 && t >= o && t < o + s)
        return e;
    }
    return -1;
  }
};
// 占位列相关常量
b(nt, "HIDDEN_PLACEHOLDER_WIDTH", 5), b(nt, "HIDDEN_PLACEHOLDER_PREFIX", "__hidden_placeholder__");
let Bt = nt;
class ee {
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
    const o = this.cache.get(t);
    if (o) {
      if (o.size >= e) {
        i == null || i(!0, o.image);
        return;
      }
      if (o.originalImage) {
        const a = this.scaleImage(o.originalImage, e);
        o.image = a, o.size = e, i == null || i(!0, a);
        return;
      }
    }
    if (this.failed.has(t)) {
      i == null || i(!1, null);
      return;
    }
    const s = this.loading.get(t);
    if (s) {
      s.maxSize = Math.max(s.maxSize, e), i && s.callbacks.push(i);
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
      const o = this.scaleImage(i, e.maxSize);
      this.addToCache(t, {
        image: o,
        size: e.maxSize,
        originalImage: i
      }), this.loading.delete(t);
      for (const s of e.callbacks)
        s(!0, o);
      this.processQueue();
    }, i.onerror = () => {
      if (!this.destroyed) {
        this.loading.delete(t), this.failed.add(t);
        for (const o of e.callbacks)
          o(!1, null);
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
    const i = Math.min(e / t.width, e / t.height), o = Math.round(t.width * i), s = Math.round(t.height * i), n = document.createElement("canvas");
    n.width = o, n.height = s;
    const r = n.getContext("2d");
    return r ? (r.imageSmoothingEnabled = !0, r.imageSmoothingQuality = "high", r.drawImage(t, 0, 0, o, s), n) : t;
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
  for (const [i, o] of Object.entries(t))
    o && typeof o == "object" && !Array.isArray(o) && e[i] && typeof e[i] == "object" && !Array.isArray(e[i]) ? e[i] = yt(e[i], o) : o !== void 0 && (e[i] = o);
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
  constructor(t, e, i, o = ht) {
    b(this, "ctx");
    b(this, "theme");
    b(this, "locale");
    b(this, "measureTextWidth");
    this.ctx = t, this.theme = e, this.measureTextWidth = i, this.locale = o;
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
    let s = 100;
    for (const r of t.buttons) {
      const a = r.text ?? this.locale.cell.buttonText, l = this.measureTextWidth(a);
      s = Math.max(s, l + 8 * 2 + 16);
    }
    const n = t.buttons.length * 32;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, s, n, 4), this.ctx.fill(), this.ctx.stroke();
    for (let r = 0; r < t.buttons.length; r++) {
      const a = t.buttons[r], l = t.y + r * 32;
      r === t.hoveredIndex && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(t.x, l, s, 32));
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
    const { config: e, x: i, y: o, width: s, scrollTop: n, hoveredIndex: r } = t, a = 32, l = 8, c = Math.min(e.options.length, l) * a;
    this.ctx.save(), this.drawDropdownPanel(i, o, s, c), this.ctx.beginPath(), this.ctx.rect(i, o, s, c), this.ctx.clip();
    const d = e.multiple && Array.isArray(e.value) ? e.value : e.value !== void 0 ? [e.value] : [];
    for (let u = 0; u < e.options.length; u++) {
      const f = e.options[u], g = o + u * a - n;
      if (g + a < o || g > o + c) continue;
      u === r && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(i, g, s, a));
      const m = d.includes(f.value);
      m && !e.multiple && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(i, g, s, a)), e.multiple ? this.renderMultipleOption(f.label, f.disabled, m, i, g, s) : this.renderSingleOption(f.label, f.disabled, m, i, g, s);
    }
    this.renderDropdownScrollbar(
      e.options.length,
      l,
      i,
      o,
      s,
      c,
      n
    ), this.ctx.restore();
  }
  renderTagsDropdown(t) {
    const { x: e, y: i, width: o, scrollTop: s, hoveredIndex: n, tagsConfig: r } = t;
    if (!r || !r.options) return;
    const { options: a, selectedValues: l = [] } = r, h = 32, c = 8, u = Math.min(a.length, c) * h;
    this.ctx.save(), this.drawDropdownPanel(e, i, o, u), this.ctx.beginPath(), this.ctx.rect(e, i, o, u), this.ctx.clip();
    for (let f = 0; f < a.length; f++) {
      const g = a[f], m = i + f * h - s;
      if (m + h < i || m > i + u) continue;
      const x = l.includes(g.value ?? g.text);
      f === n && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, o, h)), x && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(e, m, o, h));
      const w = 14, y = e + 10, C = m + (h - w) / 2;
      this.ctx.fillStyle = x ? this.theme.colors.checkbox.checkedBg : this.theme.colors.button.background, this.ctx.strokeStyle = x ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(y, C, w, w, 2), this.ctx.fill(), this.ctx.stroke(), x && (this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(y + 3, C + 7), this.ctx.lineTo(y + 6, C + 10), this.ctx.lineTo(y + 11, C + 4), this.ctx.stroke()), this.ctx.fillStyle = g.disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
      const v = y + w + 8, R = m + h / 2, I = o - (w + 28), M = mt(
        g.text,
        Math.floor(I / (this.theme.font.size * 0.6))
      );
      this.ctx.fillText(M, v, R);
    }
    this.renderDropdownScrollbar(
      a.length,
      c,
      e,
      i,
      o,
      u,
      s
    ), this.ctx.restore();
  }
  renderMultipleOption(t, e, i, o, s, n) {
    const l = o + 10, h = s + 18 / 2;
    this.ctx.strokeStyle = i ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(l, h, 14, 14, 2), this.ctx.stroke(), i && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(l, h, 14, 14, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.lineCap = "round", this.ctx.lineJoin = "round", this.ctx.beginPath(), this.ctx.moveTo(l + 3, h + 14 / 2), this.ctx.lineTo(l + 14 / 2, h + 14 - 4), this.ctx.lineTo(l + 14 - 3, h + 4), this.ctx.stroke()), this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const c = l + 14 + 8, d = s + 32 / 2, u = n - 42, f = mt(
      t,
      Math.floor(u / (this.theme.font.size * 0.6))
    );
    this.ctx.fillText(f, c, d);
  }
  renderSingleOption(t, e, i, o, s, n) {
    i ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`) : (this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`), this.ctx.textBaseline = "middle";
    const a = o + 12, l = s + 32 / 2, h = n - 24, c = mt(
      t,
      Math.floor(h / (this.theme.font.size * 0.6))
    );
    if (this.ctx.fillText(c, a, l), i) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath();
      const d = o + n - 20, u = l;
      this.ctx.moveTo(d - 6, u), this.ctx.lineTo(d - 2, u + 4), this.ctx.lineTo(d + 6, u - 4), this.ctx.strokeStyle = this.theme.colors.checkbox.checkedBg, this.ctx.lineWidth = 2, this.ctx.stroke();
    }
  }
  renderDropdownScrollbar(t, e, i, o, s, n, r) {
    if (t <= e) return;
    const a = 6, l = i + s - a - 2, h = t * 32, c = Math.max(20, n / h * n), d = o + r / h * n, u = this.ctx.globalAlpha;
    this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(l, d, a, c, 3), this.ctx.fill(), this.ctx.globalAlpha = u;
  }
  drawDropdownPanel(t, e, i, o) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(t, e, i, o, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0;
  }
}
class si {
  constructor(t, e, i = ht) {
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
    const { x: e, y: i, width: o, searchValue: s } = t, n = 8, r = 4, a = 36, l = 36, h = n + a + r + l;
    this.drawPanelBackground(e, i, o, h);
    const c = i + n;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + n, c, o - n * 2, a, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const d = c + a / 2, u = e + n + 12;
    s ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(s, u, d)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.searchPlaceholder, u, d)), this.renderFilterButtons(e, i + n + a + r, o, l), this.drawPanelBorder(e, i, o, h);
  }
  renderSelectFilterDropdown(t) {
    const { x: e, y: i, width: o, options: s, scrollTop: n, hoveredIndex: r, isLoading: a } = t;
    if (!s && !a) return;
    const l = 8, h = 4, c = 32, d = 32, u = 8, f = 36, g = (s == null ? void 0 : s.length) ?? 0, m = Math.min(g, u), x = m * d, w = l + c + h + x + h + f;
    this.drawPanelBackground(e, i, o, w);
    const y = i + l;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + l, y, o - l * 2, c, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", t.searchText ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(t.searchText, e + l + 12, y + c / 2)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(
      this.locale.filter.selectSearchPlaceholder,
      e + l + 12,
      y + c / 2
    ));
    const C = i + l + c + h;
    if (a)
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.loading, e + l, C + d / 2);
    else if (s && s.length > 0) {
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(e, C, o, x), this.ctx.clip();
      const v = 14, R = 8, I = Math.floor(n / d), M = -(n % d);
      for (let E = 0; E <= m + 1; E++) {
        const T = I + E;
        if (T < 0 || T >= s.length) continue;
        const D = s[T];
        if (!D) continue;
        const H = C + E * d + M;
        T === r && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, H, o, d));
        const O = e + l, k = H + (d - v) / 2;
        this.ctx.strokeStyle = D.checked ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(O, k, v, v, 2), this.ctx.stroke(), D.checked && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(O, k, v, v, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(O + 3, k + 7), this.ctx.lineTo(O + 6, k + 10), this.ctx.lineTo(O + 11, k + 4), this.ctx.stroke()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const P = O + v + R, L = o - l * 2 - v - R, W = String(D.value);
        if (/^#[0-9A-Fa-f]{6}$/.test(W)) {
          const F = H + (d - 16) / 2, V = P;
          this.ctx.fillStyle = W, this.ctx.beginPath(), this.ctx.roundRect(V, F, 16, 16, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
          const z = V + 16 + 6, G = L - 16 - 6, Y = mt(
            W.toUpperCase(),
            Math.floor(G / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(Y, z, H + d / 2);
        } else {
          const _ = mt(
            D.label,
            Math.floor(L / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(_, P, H + d / 2);
        }
      }
      if (this.ctx.restore(), s.length > u) {
        const T = s.length * d, D = Math.max(20, x / T * x), H = x - D, O = n / (T - x) * H, k = this.ctx.globalAlpha;
        this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(
          e + o - 6 - 2,
          C + O + 2,
          6,
          D,
          3
        ), this.ctx.fill(), this.ctx.globalAlpha = k;
      }
    } else
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText(this.locale.filter.noData, e + l, C + d / 2);
    this.renderFilterButtons(
      e,
      i + l + c + h + x + h,
      o,
      f
    ), this.drawPanelBorder(e, i, o, w);
  }
  renderRangeFilterDropdown(t) {
    const { x: e, y: i, width: o, minValue: s, maxValue: n } = t, r = 8, a = 4, l = 32, h = 8, c = 36, d = r + l + a + c;
    this.drawPanelBackground(e, i, o, d), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const u = i + r, f = (o - r * 3) / 2;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + r, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = s ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(
      s ? String(s) : this.locale.filter.minPlaceholder,
      e + r + 8,
      u + l / 2
    );
    const g = e + r + f + h;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.beginPath(), this.ctx.roundRect(g, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = n ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(
      n ? String(n) : this.locale.filter.maxPlaceholder,
      g + 8,
      u + l / 2
    ), this.renderFilterButtons(e, i + r + l + a, o, c), this.drawPanelBorder(e, i, o, d);
  }
  renderBooleanFilterDropdown(t) {
    const { x: e, y: i, width: o, boolValue: s } = t, n = 8, r = 4, a = 32, l = 36, h = n + a * 3 + r + l;
    this.drawPanelBackground(e, i, o, h);
    const c = [
      { value: "all", label: this.locale.filter.all },
      { value: "true", label: this.locale.filter.selected },
      { value: "false", label: this.locale.filter.unselected }
    ], d = 14, u = 8;
    for (let f = 0; f < c.length; f++) {
      const g = c[f], m = i + n + f * a, x = s === g.value;
      x && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, o, a));
      const w = e + n, y = m + (a - d) / 2;
      this.ctx.strokeStyle = x ? this.theme.colors.button.primaryBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.arc(w + d / 2, y + d / 2, d / 2, 0, Math.PI * 2), this.ctx.stroke(), x && (this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.beginPath(), this.ctx.arc(w + d / 2, y + d / 2, d / 4, 0, Math.PI * 2), this.ctx.fill()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText(g.label, w + d + u, m + a / 2);
    }
    this.renderFilterButtons(e, i + n + a * 3 + r, o, l), this.drawPanelBorder(e, i, o, h);
  }
  renderDateRangeFilterDropdown(t) {
    const { x: e, y: i, width: o, startDate: s, endDate: n, activeDateField: r } = t, a = 8, l = 4, h = 32, c = 8, d = 36, u = a + h + l + d;
    this.drawPanelBackground(e, i, o, u), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const f = i + a, g = (o - a * 3) / 2, m = e + a, x = r === "startDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = x ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = x ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(m, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const w = s ? this.formatDate(s, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = w ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(
      w || this.locale.filter.startDatePlaceholder,
      m + 8,
      f + h / 2
    );
    const y = e + a + g + c, C = r === "endDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = C ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = C ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(y, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const v = n ? this.formatDate(n, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = v ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(
      v || this.locale.filter.endDatePlaceholder,
      y + 8,
      f + h / 2
    ), this.renderFilterButtons(e, i + a + h + l, o, d), this.drawPanelBorder(e, i, o, u);
  }
  renderDateRangeCalendarPopover(t) {
    const {
      x: e,
      y: i,
      width: o,
      startDate: s,
      endDate: n,
      activeDateField: r,
      currentYear: a,
      currentMonth: l,
      hoveredDate: h
    } = t;
    if (!r || a === void 0 || l === void 0) return;
    const c = 8, d = 32, u = 8, f = 40, g = 28, m = 28, x = 8, y = f + g + 6 * m + x * 2, C = 240, v = (o - c * 3) / 2, R = e + c, I = e + c + v + u, M = i + c;
    let D = (r === "startDate" ? R : I) + v / 2 - C / 2;
    D < e && (D = e), D + C > e + o && (D = e + o - C);
    const H = M + d + u, O = r === "startDate" ? s : n;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(D, H, C, y, 6), this.ctx.fill(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke();
    const k = this.locale.calendar.months[l] ?? String(l + 1), P = this.locale.calendar.yearMonthFormat.replace("{year}", String(a)).replace("{month}", k);
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(P, D + C / 2, H + f / 2);
    const L = 6, W = D + 20, A = D + C - 20, _ = H + f / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(W + L, _ - L), this.ctx.lineTo(W - L, _), this.ctx.lineTo(W + L, _ + L), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(A - L, _ - L), this.ctx.lineTo(A + L, _), this.ctx.lineTo(A - L, _ + L), this.ctx.closePath(), this.ctx.fill();
    const F = this.locale.calendar.weekdays, V = (C - x * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let X = 0; X < 7; X++) {
      const j = D + x + X * V + V / 2, it = H + f + g / 2;
      this.ctx.fillText(F[X], j, it);
    }
    const G = new Date(a, l, 1).getDay(), Y = new Date(a, l + 1, 0).getDate(), U = /* @__PURE__ */ new Date();
    U.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let X = 1; X <= Y; X++) {
      const j = G + X - 1, it = Math.floor(j / 7), ot = j % 7, K = D + x + ot * V, et = H + f + g + it * m, rt = K + V / 2, at = et + m / 2, J = new Date(a, l, X), lt = O && J.getTime() === O.getTime(), wt = h && J.getTime() === h.getTime(), vt = J.getTime() === U.getTime();
      if (lt)
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.beginPath(), this.ctx.arc(rt, at, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = "#ffffff";
      else if (wt)
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.beginPath(), this.ctx.arc(rt, at, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
      else if (vt) {
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.fillText(String(X), rt, at), this.ctx.fillStyle = this.theme.colors.dropdown.text;
        continue;
      } else
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.textAlign = "center", this.ctx.fillText(String(X), rt, at);
    }
    this.ctx.restore();
  }
  renderFilterButtons(t, e, i, o) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(t, e, i, o), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.lineTo(t + i, e), this.ctx.stroke(), this.ctx.font = `14px ${this.theme.font.family}`;
    const r = this.locale.filter.reset, a = this.locale.filter.confirm, l = this.ctx.measureText(a).width, h = t + 8, c = t + i - 8 - l, d = e + o / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(r, h, d), this.ctx.fillStyle = this.theme.colors.linkColor, this.ctx.fillText(a, c, d);
  }
  drawPanelBackground(t, e, i, o) {
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(t, e, i, o, 6), this.ctx.fill(), this.ctx.restore();
  }
  drawPanelBorder(t, e, i, o) {
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(t, e, i, o, 6), this.ctx.stroke();
  }
  formatDate(t, e) {
    const i = t.getFullYear(), o = String(t.getMonth() + 1).padStart(2, "0"), s = String(t.getDate()).padStart(2, "0");
    return e.replace("YYYY", String(i)).replace("MM", o).replace("DD", s);
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
function oe(p, t, e, i, o, s, n, r) {
  const a = p.globalAlpha;
  p.globalAlpha = t.colors.scrollbar.opacity, p.fillStyle = t.colors.scrollbar.track, p.fillRect(e, i, o, s), p.fillStyle = t.colors.scrollbar.thumb, p.fillRect(e, n, o, r), p.globalAlpha = a;
}
class ri {
  constructor(t, e, i, o = ht) {
    b(this, "ctx");
    b(this, "theme");
    b(this, "loader");
    b(this, "locale");
    this.ctx = t, this.theme = e, this.loader = i, this.locale = o;
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
        const w = t.images[x];
        if (!w) continue;
        const y = t.x + 8 + m * 72, C = t.y + 8 + g * 72 - t.scrollTop;
        C + 64 < t.y || C > t.y + h || this.renderImageTile(
          w,
          y,
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
    const e = t.images ?? [], i = t.pendingImages ?? [], o = 64, s = 8, n = 8, r = 4, a = 60, l = o + n, h = 4, d = r * o + (r - 1) * n + s * 2 + 4 + h, u = t.maxRows * l + s * 2 - n, f = a + u;
    this.ctx.save(), St(this.ctx, this.theme, {
      x: t.x,
      y: t.y,
      width: d,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.renderUploadArea(t, d, a, s);
    const g = t.y + a, m = Math.ceil((e.length + i.length) / r), x = m * l - n, w = u - s * 2;
    this.ctx.beginPath(), this.ctx.rect(t.x, g, d, u), this.ctx.clip();
    const y = Math.floor(t.scrollTop / l), C = Math.min(m, y + t.maxRows + 1), v = [...e, ...i.map((R) => R.preview)];
    for (let R = y; R < C; R++)
      for (let I = 0; I < r; I++) {
        const M = R * r + I;
        if (M >= v.length) break;
        const E = v[M];
        if (!E) continue;
        const T = t.x + s + I * (o + n), D = g + s + R * l - t.scrollTop;
        if (D + o < g || D > g + u) continue;
        const H = M === t.hoveredIndex, O = M >= e.length;
        this.renderImageTile(E, T, D, o, H, O, !0);
      }
    if (x > w) {
      const R = w, I = Math.max(
        30,
        w / x * R
      ), M = g + s + t.scrollTop / (x - w + s * 2) * (R - I);
      oe(
        this.ctx,
        this.theme,
        t.x + d - s - h,
        g + s,
        h,
        R,
        M,
        I
      );
    }
    this.ctx.restore();
  }
  renderUploadArea(t, e, i, o) {
    const s = t.y, n = t.isDragging;
    this.ctx.fillStyle = n ? this.theme.colors.dropdown.selectedBg : this.theme.colors.image.placeholderBg, this.ctx.fillRect(
      t.x + o,
      s + o,
      e - o * 2,
      i - o * 2
    ), this.ctx.strokeStyle = n ? this.theme.colors.checkbox.checkedBg : this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.setLineDash([4, 4]), this.ctx.strokeRect(
      t.x + o,
      s + o,
      e - o * 2,
      i - o * 2
    ), this.ctx.setLineDash([]), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const r = n ? this.locale.image.uploadDragging : this.locale.image.uploadIdle;
    this.ctx.fillText(r, t.x + e / 2, s + i / 2);
  }
  renderImageTile(t, e, i, o, s, n, r) {
    const a = this.loader.get(t, o);
    if (a ? (this.ctx.save(), s && (this.ctx.strokeStyle = this.theme.colors.image.hoverBorder, this.ctx.lineWidth = 2, this.ctx.strokeRect(e - 1, i - 1, o + 2, o + 2)), this.ctx.drawImage(a, e, i, o, o), this.ctx.restore(), this.loader.collectVisible(t)) : (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.fillRect(e, i, o, o), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, i, o, o), this.loader.isLoading(t) || this.loader.load(t, o)), n && (this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)", this.ctx.fillRect(e, i + o - 20, o, 20), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.fillText(this.locale.image.uploading, e + o / 2, i + o - 10)), s && !n && r) {
      const h = e + o - 8 - 2, c = i + 16 / 2 + 2;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)", this.ctx.beginPath(), this.ctx.arc(h, c, 16 / 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.strokeStyle = "#ffffff", this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.moveTo(h - 3, c - 3), this.ctx.lineTo(h + 3, c + 3), this.ctx.moveTo(h + 3, c - 3), this.ctx.lineTo(h - 3, c + 3), this.ctx.stroke();
    }
  }
}
class ai {
  constructor(t, e, i, o, s, n = ht) {
    b(this, "ctx");
    b(this, "canvas");
    b(this, "theme");
    b(this, "layoutManager");
    b(this, "locale");
    b(this, "dpr");
    b(this, "watermarkConfig", null);
    this.canvas = t, this.ctx = e, this.theme = i, this.layoutManager = o, this.locale = n, this.dpr = s;
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
    const { config: e, x: i, y: o, width: s, hoveredColor: n } = t, r = e.presetColors || this.getDefaultPresetColors(), a = 8, l = 24, h = 4, c = 8, d = Math.ceil(r.length / a), u = c * 2 + d * (l + h) - h;
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.beginPath(), this.ctx.roundRect(i, o, s, u, 6), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(i, o, s, u, 6), this.ctx.stroke();
    for (let f = 0; f < r.length; f++) {
      const g = r[f], m = f % a, x = Math.floor(f / a), w = i + c + m * (l + h), y = o + c + x * (l + h);
      this.ctx.fillStyle = g, this.ctx.fillRect(w, y, l, l), g === n ? (this.ctx.strokeStyle = "#1890ff", this.ctx.lineWidth = 2, this.ctx.strokeRect(w - 1, y - 1, l + 2, l + 2)) : (this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(w, y, l, l));
    }
  }
  renderTooltip(t) {
    const { x: e, y: i, width: o, content: s } = t, n = 8, r = 20, a = 4, l = 4, h = 4;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    let c = n * 2;
    const d = [], u = [], f = 140, g = 300, m = o ?? g;
    let x = 0;
    if (s.type === "text") {
      const R = this.ctx.measureText(s.text).width;
      x = Math.min(R + n * 2, g);
      const I = Math.max(f, Math.min(x, m));
      let M = "";
      for (const E of s.text.split("")) {
        const T = M + E;
        this.ctx.measureText(T).width > I - n * 2 ? (M && d.push(M), M = E) : M = T;
      }
      M && d.push(M), c += d.length * r;
    } else if (s.type === "tags") {
      const R = s.tags;
      let I = [], M = n;
      for (const E of R) {
        const T = this.ctx.measureText(E.text).width + l * 2;
        x = Math.max(x, M + T + n), M + T + a > m - n && I.length > 0 && (u.push(I), I = [], M = n), I.push(E), M += T + a;
      }
      I.length > 0 && u.push(I), c += u.length * (this.theme.font.size + l * 2) + (u.length - 1) * a;
    }
    const w = Math.max(f, Math.min(x, m));
    let y = e + (m - w) / 2;
    const C = this.canvas.width / this.dpr;
    y < 0 ? y = 4 : y + w > C && (y = C - w - 4);
    const v = i - c - this.theme.colors.tooltip.gap;
    if (this.ctx.save(), this.ctx.fillStyle = this.theme.colors.tooltip.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(y, v, w, c, 6), this.ctx.fill(), this.ctx.restore(), this.ctx.fillStyle = this.theme.colors.tooltip.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "top", s.type === "text") {
      let R = v + n;
      for (const I of d)
        this.ctx.fillText(I, y + n, R), R += r;
    } else if (s.type === "tags") {
      let R = v + n;
      const I = this.theme.font.size + l * 2;
      for (const M of u) {
        let E = y + n;
        for (const T of M) {
          const D = this.ctx.measureText(T.text).width + l * 2;
          this.ctx.fillStyle = T.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0"), this.ctx.beginPath(), this.ctx.roundRect(E, R, D, I, h), this.ctx.fill(), this.ctx.fillStyle = T.color ?? this.theme.colors.cellText ?? "#333", this.ctx.textBaseline = "middle";
          const H = E + (D - this.ctx.measureText(T.text).width) / 2;
          this.ctx.fillText(T.text, H, R + I / 2), E += D + a;
        }
        R += I + a;
      }
    }
  }
  renderScrollbars(t, e, i, o, s) {
    const n = this.canvas.width / this.dpr, r = this.canvas.height / this.dpr, a = this.layoutManager.getLayoutInfo(), l = a.headerHeight, h = 10, c = 30;
    if (o > 0) {
      const d = r - l, u = Math.max(
        c,
        r / a.totalHeight * d
      ), f = l + e / o * (d - u), g = n - h;
      let m = this.theme.colors.scrollbar.thumb;
      s.verticalDragging ? m = this.theme.colors.scrollbar.thumbActive : s.verticalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const x = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(g, f, h - 2, u, 4), this.ctx.fill(), this.ctx.globalAlpha = x;
    }
    if (i > 0) {
      const d = n, u = Math.max(
        c,
        n / a.totalWidth * d
      ), f = t / i * (d - u), g = r - h;
      let m = this.theme.colors.scrollbar.thumb;
      s.horizontalDragging ? m = this.theme.colors.scrollbar.thumbActive : s.horizontalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const x = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(f, g, u, h - 2, 4), this.ctx.fill(), this.ctx.globalAlpha = x;
    }
  }
  getScrollbarBounds(t, e, i, o) {
    const s = this.canvas.width / this.dpr, n = this.canvas.height / this.dpr, r = this.layoutManager.getLayoutInfo(), a = r.headerHeight, l = 10, h = 30;
    let c = null, d = null;
    if (o > 0) {
      const u = n - a, f = Math.max(
        h,
        n / r.totalHeight * u
      ), g = a + e / o * (u - f);
      c = {
        x: s - l,
        y: g,
        width: l - 2,
        height: f
      };
    }
    if (i > 0) {
      const u = s, f = Math.max(
        h,
        s / r.totalWidth * u
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
    const i = this.canvas.width / this.dpr, o = this.canvas.height / this.dpr, s = this.theme.colors.watermark, n = this.watermarkConfig.fontSize ?? s.fontSize, r = this.watermarkConfig.fontFamily ?? s.fontFamily ?? this.theme.font.family, a = this.watermarkConfig.color ?? s.color, l = this.watermarkConfig.rotation ?? -22, h = this.watermarkConfig.gapX ?? 100, c = this.watermarkConfig.gapY ?? 100, d = this.watermarkConfig.opacity ?? s.opacity;
    this.ctx.save(), this.ctx.globalAlpha = d, this.ctx.font = `${n}px ${r}`, this.ctx.fillStyle = a, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const u = l * Math.PI / 180, g = this.ctx.measureText(e).width + h, m = n + c, x = Math.ceil(i / g) + 2, w = Math.ceil(o / m) + 2;
    for (let y = -1; y <= w; y++)
      for (let C = -1; C <= x; C++) {
        const v = C * g + (y % 2 === 0 ? 0 : g / 2), R = y * m;
        this.ctx.save(), this.ctx.translate(v, R), this.ctx.rotate(u), this.ctx.fillText(e, 0, 0), this.ctx.restore();
      }
    this.ctx.restore();
  }
  renderContextMenu(t) {
    const { x: e, y: i, hoveredIndex: o, items: s } = t, n = 140, r = 32, a = s.length * r;
    this.ctx.save(), this.drawMenuPanel(e, i, n, a), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < s.length; l++) {
      const h = s[l], c = i + l * r;
      l === o && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, n, r)), this.ctx.fillStyle = h.danger ? "#f56c6c" : this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + r / 2);
    }
    this.ctx.restore();
  }
  renderHeaderContextMenu(t) {
    const { x: e, y: i, hoveredIndex: o } = t, s = 120, n = 32, r = [{ text: this.locale.contextMenu.hideColumn }], a = r.length * n;
    this.ctx.save(), this.drawMenuPanel(e, i, s, a), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < r.length; l++) {
      const h = r[l], c = i + l * n;
      l === o && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, s, n)), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + n / 2);
    }
    this.ctx.restore();
  }
  renderDateDropdown(t) {
    const { x: e, y: i, width: o, currentYear: s, currentMonth: n, selectedDate: r, hoveredDate: a } = t, l = 40, h = 28, c = 28, d = 8, f = l + h + 6 * c + d * 2;
    this.ctx.save(), St(this.ctx, this.theme, {
      x: e,
      y: i,
      width: o,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(e, i, o, f);
    const g = this.locale.calendar.months[n] ?? String(n + 1), m = this.locale.calendar.yearMonthFormat.replace("{year}", String(s)).replace("{month}", g);
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(m, e + o / 2, i + l / 2);
    const x = 6, w = e + 20, y = e + o - 20, C = i + l / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(w + x, C - x), this.ctx.lineTo(w - x, C), this.ctx.lineTo(w + x, C + x), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(y - x, C - x), this.ctx.lineTo(y + x, C), this.ctx.lineTo(y - x, C + x), this.ctx.closePath(), this.ctx.fill();
    const v = this.locale.calendar.weekdays, R = (o - d * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let D = 0; D < 7; D++) {
      const H = e + d + D * R + R / 2, O = i + l + h / 2;
      this.ctx.fillText(v[D], H, O);
    }
    const M = new Date(s, n, 1).getDay(), E = new Date(s, n + 1, 0).getDate(), T = /* @__PURE__ */ new Date();
    T.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let D = 1; D <= E; D++) {
      const H = M + D - 1, O = Math.floor(H / 7), k = H % 7, P = e + d + k * R, L = i + l + h + O * c, W = new Date(s, n, D), A = W.getTime() === T.getTime(), _ = r && W.getFullYear() === r.getFullYear() && W.getMonth() === r.getMonth() && W.getDate() === r.getDate(), F = a && W.getFullYear() === a.getFullYear() && W.getMonth() === a.getMonth() && W.getDate() === a.getDate();
      _ ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        P + R / 2,
        L + c / 2,
        Math.min(R, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : F ? (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.beginPath(), this.ctx.arc(
        P + R / 2,
        L + c / 2,
        Math.min(R, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text) : A ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        P + R / 2,
        L + c / 2,
        Math.min(R, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(String(D), P + R / 2, L + c / 2);
    }
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e, i, o, f, 6), this.ctx.stroke(), this.ctx.restore();
  }
  drawMenuPanel(t, e, i, o) {
    St(this.ctx, this.theme, {
      x: t,
      y: e,
      width: i,
      height: o,
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
  calculateTextX(t, e, i, o, s, n) {
    const r = n.measureText(t).width;
    switch (s) {
      case "center":
        return e + (i - r) / 2;
      case "right":
        return e + i - o - r;
      default:
        return e + o;
    }
  }
  /**
   * Draw a rounded rectangle
   */
  drawRoundedRect(t, e, i, o, s, n) {
    t.beginPath(), t.moveTo(e + n, i), t.lineTo(e + o - n, i), t.quadraticCurveTo(e + o, i, e + o, i + n), t.lineTo(e + o, i + s - n), t.quadraticCurveTo(e + o, i + s, e + o - n, i + s), t.lineTo(e + n, i + s), t.quadraticCurveTo(e, i + s, e, i + s - n), t.lineTo(e, i + n), t.quadraticCurveTo(e, i, e + n, i), t.closePath();
  }
  /**
   * Truncate text to fit within a given width
   */
  truncateText(t, e, i, o = "...") {
    if (t.measureText(e).width <= i)
      return e;
    let s = e;
    for (; s.length > 0 && t.measureText(s + o).width > i; )
      s = s.slice(0, -1);
    return s + o;
  }
}
class ne extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "text");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u } = e, f = this.getPadding(), g = this.getTextAlign(l), m = this.formatValue(c, l, h);
    i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle";
    const x = m || (l.placeholder ?? ""), w = m ? this.getTextColor(o, d, u) : o.colors.placeholderText;
    i.fillStyle = w;
    const y = r - f * 2, C = this.truncateText(i, x, y), v = this.calculateTextX(C, s, r, f, g, i), R = n + a / 2;
    return i.fillText(C, v, R), { type: "text" };
  }
  getTextColor(e, i, o) {
    return e.colors.cellText;
  }
  formatValue(e, i, o) {
    return e == null ? "" : i.formatter ? i.formatter(e, o, i) : String(e);
  }
}
class li extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "number");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u, locale: f } = e, g = 8, m = this.getTextAlign(l), x = this.formatValue(c, l, h);
    i.strokeStyle = o.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(s, n, r, a), i.stroke();
    const w = l.placeholder ?? f.cell.numberPlaceholder, y = x || w;
    i.fillStyle = x ? o.colors.cellText : o.colors.placeholderText, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle";
    const C = r - g * 2, v = this.truncateText(i, y, C), R = this.calculateTextX(v, s, r, g, m, i), I = n + a / 2;
    return i.fillText(v, R, I), { type: "number" };
  }
  formatValue(e, i, o) {
    return e == null || e === "" ? "" : i.formatter ? i.formatter(e, o, i) : typeof e == "number" ? e.toLocaleString() : String(e);
  }
}
class hi extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "checkbox");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = s + (r - d) / 2, f = n + (a - d) / 2, g = h ?? !1;
    return i.fillStyle = g ? o.colors.checkbox.disabledBg : o.colors.button.background, i.strokeStyle = o.colors.checkbox.border, i.lineWidth = 1, i.beginPath(), i.roundRect(u, f, d, d, 3), i.fill(), i.stroke(), c.indeterminate ? (i.strokeStyle = g ? o.colors.checkbox.border : o.colors.checkbox.checkedBg, i.lineWidth = 2, i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d - 4, f + d / 2), i.stroke()) : c.checked && (i.strokeStyle = g ? o.colors.checkbox.border : o.colors.checkbox.checkedBg, i.lineWidth = 2, i.lineCap = "round", i.lineJoin = "round", i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d / 2 - 1, f + d - 5), i.lineTo(u + d - 3, f + 4), i.stroke()), { type: "checkbox", config: c };
  }
}
class ci extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "radio");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = 8, f = 4, g = h ?? !1;
    if (i.save(), i.beginPath(), i.rect(s, n, r, a), i.clip(), c.options && c.options.length > 0) {
      i.font = `${o.font.size}px ${o.font.family}`;
      const m = c.options.map((y) => {
        const C = i.measureText(y.label).width;
        return d + f + C + u;
      });
      let x = s + u;
      const w = s + r - u;
      for (let y = 0; y < c.options.length; y++) {
        const C = c.options[y], v = m[y];
        if (x + v - u > w)
          break;
        const R = x, I = n + (a - d) / 2, M = R + d / 2, E = I + d / 2, T = C.disabled || g, D = c.value === C.value;
        i.fillStyle = T ? o.colors.radio.disabledBg : o.colors.button.background, i.strokeStyle = o.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(M, E, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), D && (i.fillStyle = T ? o.colors.radio.border : o.colors.radio.checkedBg, i.beginPath(), i.arc(M, E, d / 2 - 4, 0, Math.PI * 2), i.fill()), i.fillStyle = T ? o.colors.placeholderText : o.colors.cellText, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle";
        const H = R + d + f;
        i.fillText(C.label, H, E), x += v;
      }
    } else {
      const m = s + (r - d) / 2, x = n + (a - d) / 2, w = m + d / 2, y = x + d / 2;
      i.fillStyle = g ? o.colors.radio.disabledBg : o.colors.button.background, i.strokeStyle = o.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(w, y, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), c.checked && (i.fillStyle = g ? o.colors.radio.border : o.colors.radio.checkedBg, i.beginPath(), i.arc(w, y, d / 2 - 4, 0, Math.PI * 2), i.fill());
    }
    return i.restore(), { type: "radio", config: c };
  }
}
class di extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "button");
  }
  render(e) {
    const { value: i, buttonHoverState: o, buttonOptions: s } = e, n = i;
    return Array.isArray(n) ? this.renderButtons(e, n, s ?? {}) : this.renderSingleButton(e, n, o == null ? void 0 : o.progress);
  }
  renderSingleButton(e, i, o) {
    const { ctx: s, theme: n, locale: r, x: a, y: l, width: h, height: c, isDisabled: d } = e, u = 8, f = i.size === "small" ? 24 : i.size === "large" ? 40 : 32, g = l + (c - f) / 2, m = d ?? !1, x = i.text ?? r.cell.buttonText;
    s.font = `${n.font.size}px ${n.font.family}`;
    const w = s.measureText(x).width, C = Math.min(
      Math.max(w + 16 * 2, 60),
      h - u * 2
    ), v = a + (h - C) / 2, R = o ?? 0;
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
        const D = this.hexToRgb(n.colors.button.background);
        if ((D.r * 299 + D.g * 587 + D.b * 114) / 1e3 > 128) {
          const O = Math.round(D.r - R * 0.2 * D.r);
          I = `rgb(${O}, ${O}, ${O})`;
        } else {
          const O = Math.round(D.r + R * 0.2 * (255 - D.r));
          I = `rgb(${O}, ${O}, ${O})`;
        }
      } else
        s.globalAlpha = 1 - R * 0.2;
    s.fillStyle = I, s.strokeStyle = E, s.lineWidth = 1;
    const T = 4;
    return s.beginPath(), s.roundRect(v, g, C, f, T), s.fill(), s.stroke(), !m && R > 0 && i.variant !== "link" && (s.globalAlpha = 1), s.fillStyle = M, s.font = `${n.font.size}px ${n.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(x, v + C / 2, g + f / 2), s.textAlign = "left", { type: "button", config: i };
  }
  renderButtons(e, i, o) {
    const { ctx: s, theme: n, locale: r, x: a, y: l, height: h, isDisabled: c, hoveredButtonIndex: d } = e, u = 8, f = o.gap ?? 4, g = o.maxVisible ?? 3, m = 24, x = l + (h - m) / 2, w = i.filter((R) => R.visible !== !1), y = w.slice(0, g), C = w.slice(g);
    let v = a + u;
    for (let R = 0; R < y.length; R++) {
      const I = y[R], M = I.text ?? r.cell.buttonText;
      s.font = `${n.font.size}px ${n.font.family}`;
      const E = s.measureText(M).width, T = Math.max(E + 16, 40), D = d === R && !c, H = c ?? !1;
      let O, k, P;
      H ? (O = n.colors.button.disabledBg, k = n.colors.button.disabledText, P = n.colors.button.disabledBorder) : I.variant === "primary" ? (O = n.colors.button.primaryBg, k = n.colors.button.primaryText, P = O) : I.variant === "danger" ? (O = n.colors.button.dangerBg, k = n.colors.button.dangerText, P = O) : I.variant === "warning" ? (O = n.colors.button.warningBg, k = n.colors.button.warningText, P = O) : I.variant === "link" ? (O = "transparent", k = n.colors.button.linkText, P = "transparent") : (O = D ? n.colors.button.hoverBg : n.colors.button.background, k = n.colors.button.text, P = n.colors.button.border), s.fillStyle = O, s.strokeStyle = P, s.lineWidth = 1, s.beginPath(), s.roundRect(v, x, T, m, 4), s.fill(), s.stroke(), s.fillStyle = k, s.font = `${n.font.size}px ${n.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(M, v + T / 2, x + m / 2), v += T + f;
    }
    if (C.length > 0) {
      const R = o.moreButtonText ?? "···", I = s.measureText(R).width, M = Math.max(I + 16, 32), E = c ?? !1, T = d === y.length && !E;
      s.fillStyle = E ? n.colors.button.disabledBg : T ? n.colors.button.hoverBg : n.colors.button.background, s.strokeStyle = E ? n.colors.button.disabledBorder : n.colors.button.border, s.lineWidth = 1, s.beginPath(), s.roundRect(v, x, M, m, 4), s.fill(), s.stroke(), s.fillStyle = E ? n.colors.button.disabledText : n.colors.button.text, s.font = `${n.font.size}px ${n.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(R, v + M / 2, x + m / 2);
    }
    return s.textAlign = "left", { type: "button", config: i };
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
    b(this, "type", "switch");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, value: l, isDisabled: h, switchAnimation: c } = e, d = l, u = 44, f = 22, g = 18, m = s + (r - u) / 2, x = n + (a - f) / 2, w = f / 2, y = d.checked ?? !1, C = h ?? !1, v = (c == null ? void 0 : c.progress) ?? (y ? 1 : 0), R = u - g - 4, I = m + 2 + v * R, M = x + (f - g) / 2;
    i.save();
    const E = C ? o.colors.switch.disabledOffBg : o.colors.switch.offBg, T = C ? o.colors.switch.disabledOnBg : o.colors.switch.onBg, D = this.hexToRgb(E), H = this.hexToRgb(T), O = Math.round(D.r + (H.r - D.r) * v), k = Math.round(D.g + (H.g - D.g) * v), P = Math.round(D.b + (H.b - D.b) * v);
    return i.fillStyle = `rgb(${O}, ${k}, ${P})`, i.beginPath(), i.roundRect(m, x, u, f, w), i.fill(), i.fillStyle = o.colors.switch.thumb, i.beginPath(), i.arc(I + g / 2, M + g / 2, g / 2, 0, Math.PI * 2), i.fill(), i.shadowColor = o.colors.shadow.color, i.shadowBlur = o.colors.shadow.blur, i.shadowOffsetX = o.colors.shadow.offsetX, i.shadowOffsetY = o.colors.shadow.offsetY, i.restore(), { type: "switch", config: d };
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
    b(this, "type", "progress");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, value: l } = e, h = l, c = h.shape ?? "line";
    return c === "line" ? this.renderLineProgress(i, o, s, n, r, a, h) : c === "circle" ? this.renderCircleProgress(i, o, s, n, r, a, h) : c === "dashboard" && this.renderDashboardProgress(i, o, s, n, r, a, h), { type: "progress", config: h };
  }
  renderLineProgress(e, i, o, s, n, r, a) {
    const h = a.textPosition ?? "right", c = a.showText ?? !0, d = a.size ?? "medium";
    e.save();
    const u = a.height ?? (d === "small" ? 6 : d === "large" ? 16 : 10), f = 8, g = c && h === "right" ? 40 : 0, m = a.width ?? n - 8 * 2 - g, x = o + 8, w = s + (r - u) / 2, y = Math.min(100, Math.max(0, a.value)), C = this.getProgressColor(i, a, y), v = a.trackColor ?? i.colors.progress.track, R = a.borderRadius ?? u / 2;
    e.fillStyle = v, e.beginPath(), e.roundRect(x, w, m, u, R), e.fill();
    const I = y / 100 * m;
    if (I > 0) {
      e.fillStyle = C, e.beginPath();
      const M = Math.max(I, R * 2);
      e.roundRect(x, w, M, u, R), e.fill();
    }
    if (c) {
      const M = a.precision ?? 0, E = a.format ? a.format(y) : `${M === 0 ? Math.round(y) : y.toFixed(M)}%`;
      let T;
      h === "inside" ? T = Math.min(i.font.size, Math.max(10, u - 2)) : T = d === "small" ? 11 : d === "large" ? 14 : i.font.size, e.font = `${T}px ${i.font.family}`, e.textBaseline = "middle", h === "right" ? (e.textAlign = "left", e.fillStyle = a.textColor ?? i.colors.cellText, e.fillText(E, x + m + f, s + r / 2)) : (e.textAlign = "center", e.fillStyle = a.textColor ?? i.colors.cellText, e.fillText(E, x + m / 2, s + r / 2));
    }
    e.restore();
  }
  renderCircleProgress(e, i, o, s, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(re * (l === "small" ? 0.6 : l === "large" ? 0.9 : 0.75)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.12)), f = o + n / 2, g = s + r / 2, m = (d - u) / 2, x = Math.min(100, Math.max(0, a.value)), w = this.getProgressColor(i, a, x), y = a.trackColor ?? i.colors.progress.track;
    e.save(), e.strokeStyle = y, e.lineWidth = u, e.beginPath(), e.arc(f, g, m, 0, Math.PI * 2), e.stroke();
    const C = x / 100, v = -Math.PI / 2, R = v + C * Math.PI * 2;
    if (C > 0 && (e.strokeStyle = w, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, v, R), e.stroke()), a.showText ?? !0) {
      const I = a.precision ?? 0, M = a.format ? a.format(x) : `${I === 0 ? Math.round(x) : x.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? i.colors.cellText;
      const E = Math.max(8, Math.round(d * 0.32));
      e.font = `bold ${E}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(M, f, g);
    }
    e.restore();
  }
  renderDashboardProgress(e, i, o, s, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(re * (l === "small" ? 0.7 : l === "large" ? 0.95 : 0.85)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.1)), f = o + n / 2, g = s + r / 2 + r * 0.05, m = (d - u) / 2, x = Math.min(100, Math.max(0, a.value)), w = this.getProgressColor(i, a, x), y = a.trackColor ?? i.colors.progress.track, C = Math.PI * 0.75, v = Math.PI * 1.5;
    e.save(), e.strokeStyle = y, e.lineWidth = u, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, C, C + v, !1), e.stroke();
    const R = x / 100;
    if (R > 0) {
      const I = C + R * v;
      e.strokeStyle = w, e.beginPath(), e.arc(f, g, m, C, I, !1), e.stroke();
    }
    if (a.showText ?? !0) {
      const I = a.precision ?? 0, M = a.format ? a.format(x) : `${I === 0 ? Math.round(x) : x.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? i.colors.cellText;
      const E = Math.max(8, Math.round(d * 0.28));
      e.font = `bold ${E}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(M, f, g);
    }
    e.restore();
  }
  getProgressColor(e, i, o) {
    const { color: s, status: n } = i;
    if (n === "success") return e.colors.progress.success;
    if (n === "warning") return e.colors.progress.warning;
    if (n === "error") return e.colors.progress.error;
    if (typeof s == "string") return s;
    if (typeof s == "function") return s(o);
    if (Array.isArray(s) && s.length > 0) {
      const r = [...s].sort((a, l) => a.value - l.value);
      if (o <= r[0].value) return r[0].color;
      if (o >= r[r.length - 1].value) return r[r.length - 1].color;
      for (let a = 0; a < r.length - 1; a++) {
        const l = r[a], h = r[a + 1];
        if (o >= l.value && o <= h.value) {
          const c = (o - l.value) / (h.value - l.value);
          return this.interpolateColor(l.color, h.color, c);
        }
      }
    }
    return e.colors.progress.default;
  }
  interpolateColor(e, i, o) {
    const s = this.hexToRgb(e), n = this.hexToRgb(i), r = Math.round(s.r + (n.r - s.r) * o), a = Math.round(s.g + (n.g - s.g) * o), l = Math.round(s.b + (n.b - s.b) * o);
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
const gi = 32;
class mi extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "image");
  }
  render(e) {
    const {
      ctx: i,
      theme: o,
      x: s,
      y: n,
      width: r,
      height: a,
      value: l,
      isHovered: h,
      hoveredImageIndex: c,
      rowIndex: d,
      imageRuntime: u
    } = e, f = l;
    if (f.images && f.images.length > 0)
      return this.renderMultipleImages(
        i,
        o,
        s,
        n,
        r,
        a,
        f,
        d,
        h,
        c,
        u
      ), { type: "image", config: f };
    if (!f.src)
      return { type: "image", config: f };
    const m = this.getMaxImageSize(r, a, 4, f), x = f.width ?? 32, w = f.height ?? 32, y = Math.min(x, m), C = Math.min(w, m), v = f.circle ? Math.min(y, C) / 2 : f.borderRadius ?? 0, R = s + (r - y) / 2, I = n + (a - C) / 2;
    i.fillStyle = o.colors.image.placeholderBg, i.beginPath(), v > 0 ? i.roundRect(R, I, y, C, v) : i.rect(R, I, y, C), i.fill();
    const M = f.lazy !== !1, E = f.lazyThreshold ?? 200;
    if (M && d !== void 0 && d >= 0 && u && !u.isInLazyLoadRange(d, E))
      return this.renderImagePlaceholder(
        i,
        o,
        R,
        I,
        y,
        C,
        v,
        f.placeholder,
        u
      ), h && f.hoverable !== !1 && this.renderImageHover(i, o, R, I, y, C, v), { type: "image", config: f };
    if (u != null && u.isFailed(f.src))
      return this.renderImageError(
        i,
        o,
        R,
        I,
        y,
        C,
        v,
        f.errorImage,
        u
      ), { type: "image", config: f };
    const T = (u == null ? void 0 : u.get(f.src, Math.max(y, C))) ?? null;
    return T ? (i.save(), i.beginPath(), v > 0 ? i.roundRect(R, I, y, C, v) : i.rect(R, I, y, C), i.clip(), this.drawImageWithFit(
      i,
      T,
      R,
      I,
      y,
      C,
      f.fit ?? "cover"
    ), i.restore(), u == null || u.collectVisible(f.src)) : u && !u.isLoading(f.src) ? (u.collectVisible(f.src), u.load(f.src, Math.max(y, C)), this.renderImagePlaceholder(
      i,
      o,
      R,
      I,
      y,
      C,
      v,
      f.placeholder,
      u
    )) : (u == null || u.collectVisible(f.src), this.renderImagePlaceholder(
      i,
      o,
      R,
      I,
      y,
      C,
      v,
      f.placeholder,
      u
    )), h && f.hoverable !== !1 && this.renderImageHover(i, o, R, I, y, C, v), { type: "image", config: f };
  }
  renderMultipleImages(e, i, o, s, n, r, a, l, h, c, d) {
    const u = a.images, f = 4, g = this.getMaxImageSize(n, r, f, a), m = a.width ?? 32, x = a.height ?? 32, w = Math.min(m, g), y = Math.min(x, g), C = a.gap ?? 4, v = a.circle ? Math.min(w, y) / 2 : a.borderRadius ?? 0, R = a.showMoreCount !== !1, I = n - f * 2, M = r - f * 2, E = Math.max(1, Math.floor((I + C) / (w + C))), T = Math.max(1, Math.floor((M + C) / (y + C))), D = E * T, H = a.maxVisible ?? D, k = R && u.length > H ? Math.max(0, D - 1) : D, P = Math.min(H, k), L = a.lazy !== !1, W = a.lazyThreshold ?? 200;
    let A = !0;
    L && l !== void 0 && l >= 0 && d && (A = d.isInLazyLoadRange(l, W));
    const _ = u.length > P, F = _ ? P : u.length, V = u.slice(0, F), z = _ ? u.length - P : 0, G = F + (_ && R ? 1 : 0), Y = Math.max(1, Math.ceil(G / E)), U = Math.min(G, E), X = U * w + Math.max(0, U - 1) * C, j = Y * y + Math.max(0, Y - 1) * C;
    let it = o + (n - X) / 2;
    it = Math.max(o + f, it);
    const ot = s + (r - j) / 2;
    for (let K = 0; K < V.length; K++) {
      const et = V[K], rt = Math.floor(K / E), at = K % E, J = it + at * (w + C), lt = ot + rt * (y + C), wt = !!h && a.hoverable !== !1 && c === K;
      if (e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), v > 0 ? e.roundRect(J, lt, w, y, v) : e.rect(J, lt, w, y), e.fill(), !A) {
        this.renderImagePlaceholder(
          e,
          i,
          J,
          lt,
          w,
          y,
          v,
          a.placeholder,
          d
        ), wt && this.renderImageHover(e, i, J, lt, w, y, v);
        continue;
      }
      if (d != null && d.isFailed(et)) {
        this.renderImageError(
          e,
          i,
          J,
          lt,
          w,
          y,
          v,
          a.errorImage,
          d
        ), wt && this.renderImageHover(e, i, J, lt, w, y, v);
        continue;
      }
      const vt = (d == null ? void 0 : d.get(et, Math.max(w, y))) ?? null;
      vt ? (e.save(), e.beginPath(), v > 0 ? e.roundRect(J, lt, w, y, v) : e.rect(J, lt, w, y), e.clip(), this.drawImageWithFit(
        e,
        vt,
        J,
        lt,
        w,
        y,
        a.fit ?? "cover"
      ), e.restore(), d == null || d.collectVisible(et)) : d && !d.isLoading(et) ? (d.collectVisible(et), d.load(et, Math.max(w, y)), this.renderImagePlaceholder(
        e,
        i,
        J,
        lt,
        w,
        y,
        v,
        a.placeholder,
        d
      )) : (d == null || d.collectVisible(et), this.renderImagePlaceholder(
        e,
        i,
        J,
        lt,
        w,
        y,
        v,
        a.placeholder,
        d
      )), wt && this.renderImageHover(e, i, J, lt, w, y, v);
    }
    if (_ && R) {
      const K = Math.floor(F / E), et = F % E, rt = it + et * (w + C), at = ot + K * (y + C), J = !!h && a.hoverable !== !1 && c === F;
      this.renderMoreCount(
        e,
        i,
        rt,
        at,
        w,
        y,
        v,
        z,
        J
      );
    }
  }
  getMaxImageSize(e, i, o, s) {
    const n = s.scaleWithRowHeight === !1 ? Math.min(i, gi) : i;
    return Math.max(0, Math.min(e, n) - o * 2);
  }
  renderImagePlaceholder(e, i, o, s, n, r, a, l, h) {
    if (l && h) {
      const m = h.get(l, Math.max(n, r));
      if (m) {
        e.save(), e.beginPath(), a > 0 ? e.roundRect(o, s, n, r, a) : e.rect(o, s, n, r), e.clip(), this.drawImageWithFit(e, m, o, s, n, r, "cover"), e.restore();
        return;
      } else h.isLoading(l) || h.load(l, Math.max(n, r));
    }
    e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), a > 0 ? e.roundRect(o, s, n, r, a) : e.rect(o, s, n, r), e.fill();
    const c = Math.min(n, r) * 0.4, d = o + n / 2, u = s + r / 2, f = e.strokeStyle, g = e.lineWidth;
    e.strokeStyle = i.colors.placeholderText, e.lineWidth = 1.5, e.beginPath(), e.rect(d - c / 2, u - c / 2, c, c), e.stroke(), e.beginPath(), e.moveTo(d - c / 2, u + c / 4), e.lineTo(d - c / 4, u), e.lineTo(d, u + c / 4), e.lineTo(d + c / 4, u - c / 4), e.lineTo(d + c / 2, u + c / 4), e.stroke(), e.strokeStyle = f, e.lineWidth = g;
  }
  renderImageError(e, i, o, s, n, r, a, l, h) {
    if (l && h) {
      const m = h.get(l, Math.max(n, r));
      if (m) {
        e.save(), e.beginPath(), a > 0 ? e.roundRect(o, s, n, r, a) : e.rect(o, s, n, r), e.clip(), this.drawImageWithFit(e, m, o, s, n, r, "cover"), e.restore();
        return;
      } else !h.isLoading(l) && !h.isFailed(l) && h.load(l, Math.max(n, r));
    }
    e.fillStyle = i.colors.image.errorBg, e.beginPath(), a > 0 ? e.roundRect(o, s, n, r, a) : e.rect(o, s, n, r), e.fill();
    const c = Math.min(n, r) * 0.4, d = o + n / 2, u = s + r / 2, f = e.strokeStyle, g = e.lineWidth;
    e.strokeStyle = i.colors.image.errorBorder, e.lineWidth = 1.5, e.beginPath(), e.rect(d - c / 2, u - c / 2, c, c), e.stroke(), e.beginPath(), e.moveTo(d - c / 4, u - c / 4), e.lineTo(d + c / 4, u + c / 4), e.moveTo(d + c / 4, u - c / 4), e.lineTo(d - c / 4, u + c / 4), e.stroke(), e.strokeStyle = f, e.lineWidth = g;
  }
  renderImageHover(e, i, o, s, n, r, a) {
    const l = i.colors.image.hoverBorder, h = e.strokeStyle, c = e.lineWidth;
    e.strokeStyle = l, e.lineWidth = 2, e.beginPath(), a > 0 ? e.roundRect(o, s, n, r, a) : e.rect(o, s, n, r), e.stroke(), e.save(), e.shadowColor = i.colors.image.hoverShadow, e.shadowBlur = 4, e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.strokeStyle = l, e.lineWidth = 1, e.beginPath(), a > 0 ? e.roundRect(o, s, n, r, a) : e.rect(o, s, n, r), e.stroke(), e.restore(), e.strokeStyle = h, e.lineWidth = c;
  }
  renderMoreCount(e, i, o, s, n, r, a, l, h) {
    e.fillStyle = h ? i.colors.image.hoverBorder : i.colors.moreCount.background, e.beginPath(), a > 0 ? e.roundRect(o, s, n, r, a) : e.rect(o, s, n, r), e.fill();
    const c = `+${l}`;
    e.fillStyle = i.colors.moreCount.text, e.font = `bold ${Math.min(n, r) * 0.4}px ${i.font.family}`;
    const d = e.textAlign, u = e.textBaseline;
    e.textAlign = "center", e.textBaseline = "middle", e.fillText(c, o + n / 2, s + r / 2), e.textAlign = d, e.textBaseline = u;
  }
  drawImageWithFit(e, i, o, s, n, r, a) {
    const l = i.width / i.height, h = n / r;
    let c, d, u, f;
    switch (a) {
      case "fill":
        c = n, d = r, u = o, f = s;
        break;
      case "contain":
        l > h ? (c = n, d = n / l) : (d = r, c = r * l), u = o + (n - c) / 2, f = s + (r - d) / 2;
        break;
      case "cover":
        l > h ? (d = r, c = r * l) : (c = n, d = n / l), u = o + (n - c) / 2, f = s + (r - d) / 2;
        break;
      case "none":
      default:
        c = i.width, d = i.height, u = o + (n - c) / 2, f = s + (r - d) / 2;
        break;
    }
    e.drawImage(i, u, f, c, d);
  }
}
class pi extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "tag");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, value: l, locale: h } = e, c = l, d = 8;
    if (!c.tags || c.tags.length === 0) {
      const E = c.placeholder ?? h.cell.tagPlaceholder;
      return E && (i.fillStyle = o.colors.placeholderText, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle", i.fillText(E, s + d, n + a / 2)), { type: "tag", config: c };
    }
    const u = 4, f = o.font.size + u * 2, g = 4, m = 4, x = 2, w = /* @__PURE__ */ new Map(), y = (E) => {
      let T = w.get(E);
      return T === void 0 && (T = i.measureText(E).width, w.set(E, T)), T;
    }, C = (E) => y(`+${E}`) + u * 2, { lines: v, processedTags: R } = ge(i, c, r, a, o.font.size), I = v.length * f + (v.length - 1) * x, M = n + (a - I) / 2;
    for (let E = 0; E < v.length; E++) {
      const T = v[E], D = M + E * (f + x);
      let H = s + d;
      for (const { tag: O, displayText: k, width: P } of T) {
        let L = O.bgColor ?? (o.colors.tagColors.default || "#f0f0f0"), W = O.color ?? o.colors.cellText;
        i.fillStyle = L, i.beginPath(), i.roundRect(H, D, P, f, g), i.fill(), i.fillStyle = W, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle";
        const A = D + f / 2, _ = H + (P - y(k)) / 2;
        i.fillText(k, _, A), H += P + m;
      }
      if (E === v.length - 1) {
        const O = c.tags.length - R;
        if (O > 0) {
          const k = `+${O}`, P = C(O);
          i.fillStyle = o.colors.moreCount.background, i.beginPath(), i.roundRect(H, D, P, f, g), i.fill(), i.fillStyle = o.colors.moreCount.text, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle";
          const L = D + f / 2, W = H + (P - y(k)) / 2;
          i.fillText(k, W, L);
        }
      }
    }
    return { type: "tag", config: c };
  }
}
class xi extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "date");
  }
  render(e) {
    const { ctx: i, theme: o, locale: s, x: n, y: r, width: a, height: l, value: h } = e, c = h, d = 8, u = 20;
    i.strokeStyle = o.colors.date.border, i.lineWidth = 1, i.beginPath(), i.rect(n, r, a, l), i.stroke();
    let f = "";
    if (c.value) {
      const R = c.value instanceof Date ? c.value : new Date(c.value);
      if (!isNaN(R.getTime())) {
        const I = c.format ?? "YYYY-MM-DD";
        f = this.formatDate(R, I);
      }
    }
    const g = c.placeholder ?? s.cell.datePlaceholder, m = f || g;
    i.fillStyle = f ? o.colors.cellText : o.colors.placeholderText, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle";
    const x = a - d * 2 - u, w = "...";
    let y = m;
    if (i.measureText(m).width > x) {
      let R = m;
      for (; R.length > 0 && i.measureText(R + w).width > x; )
        R = R.slice(0, -1);
      y = R + w;
    }
    i.fillText(y, n + d, r + l / 2), i.strokeStyle = o.colors.date.icon, i.lineWidth = 1.5;
    const C = n + a - d - 10, v = r + l / 2;
    return i.beginPath(), i.moveTo(C - 6, v - 6), i.lineTo(C - 6, v + 6), i.lineTo(C + 6, v + 6), i.lineTo(C + 6, v - 6), i.closePath(), i.stroke(), i.beginPath(), i.moveTo(C - 6, v - 2), i.lineTo(C + 6, v - 2), i.stroke(), i.beginPath(), i.moveTo(C - 3, v - 8), i.lineTo(C - 3, v - 5), i.stroke(), i.beginPath(), i.moveTo(C + 3, v - 8), i.lineTo(C + 3, v - 5), i.stroke(), { type: "date", config: c };
  }
  formatDate(e, i) {
    const o = e.getFullYear(), s = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0"), r = String(e.getHours()).padStart(2, "0"), a = String(e.getMinutes()).padStart(2, "0"), l = String(e.getSeconds()).padStart(2, "0");
    return i.replace("YYYY", String(o)).replace("MM", s).replace("DD", n).replace("HH", r).replace("mm", a).replace("ss", l);
  }
}
class wi extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "select");
  }
  render(e) {
    const { ctx: i, theme: o, locale: s, x: n, y: r, width: a, height: l, value: h, multipleSelectSeparator: c } = e, d = h, u = 8, f = 20;
    i.strokeStyle = o.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(n, r, a, l), i.stroke();
    const g = o.font.size, m = g * 1.5;
    if (d.multiple && Array.isArray(d.value) && d.value.length > 0) {
      const y = this.calculateMaxRows(l, m, u), C = a - u * 2 - f, v = d.value.map((T) => {
        const D = d.options.find((H) => H.value === T);
        return (D == null ? void 0 : D.label) ?? String(T);
      }), R = d.separator ?? c ?? ", ", I = this.wrapTextToLines(i, v.join(R), C, y);
      i.fillStyle = o.colors.cellText, i.font = `${g}px ${o.font.family}`, i.textBaseline = "top";
      const M = I.length * m, E = r + (l - M) / 2;
      for (let T = 0; T < I.length; T++) {
        const D = I[T];
        i.fillText(D, n + u, E + T * m + (m - g) / 2);
      }
    } else {
      let y = "";
      if (d.value !== void 0 && d.value !== null) {
        const M = d.options.find((E) => E.value === d.value);
        y = (M == null ? void 0 : M.label) ?? String(d.value);
      }
      const C = d.placeholder ?? s.cell.selectPlaceholder, v = y || C;
      i.fillStyle = y ? o.colors.cellText : o.colors.placeholderText, i.font = `${g}px ${o.font.family}`, i.textBaseline = "middle";
      const R = a - u * 2 - f, I = this.truncateText(i, v, R);
      i.fillText(I, n + u, r + l / 2);
    }
    i.fillStyle = o.colors.date.icon, i.beginPath();
    const x = n + a - u - 8, w = r + l / 2;
    return i.moveTo(x - 4, w - 2), i.lineTo(x, w + 3), i.lineTo(x + 4, w - 2), i.closePath(), i.fill(), { type: "select", config: d };
  }
  calculateMaxRows(e, i, o = 8) {
    return Math.max(1, Math.floor((e - o * 2) / i));
  }
  wrapTextToLines(e, i, o, s) {
    const n = [];
    let r = "";
    for (const a of i) {
      const l = r + a;
      if (e.measureText(l).width > o && r) {
        if (n.push(r), r = a, n.length >= s) {
          const c = n[s - 1], d = "...";
          let u = c;
          for (; e.measureText(u + d).width > o && u.length > 0; )
            u = u.slice(0, -1);
          return n[s - 1] = u + d, n;
        }
      } else
        r = l;
    }
    return r && n.push(r), n.slice(0, s);
  }
}
class yi extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "input");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, value: l } = e, h = l, c = 8;
    i.strokeStyle = o.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(s, n, r, a), i.stroke();
    const d = h.value ?? "", u = h.placeholder ?? "", f = d || u;
    i.fillStyle = d ? o.colors.cellText : o.colors.placeholderText, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle";
    const g = r - c * 2;
    if (h.multiline) {
      const m = o.font.size * 1.5, x = h.maxRows ?? 5, w = a - c * 2, y = Math.max(1, Math.floor(w / m)), C = Math.min(x, y), v = this.wrapText(i, f, g), R = v.slice(0, C), I = R.length * m;
      let E = n + (a - I) / 2 + m / 2;
      for (let T = 0; T < R.length; T++) {
        let D = R[T];
        const H = T === R.length - 1, O = v.length > R.length;
        H && (D = this.truncateTextWithEllipsis(i, D, g, O)), i.fillText(D, s + c, E), E += m;
      }
    } else {
      const m = this.truncateTextWithEllipsis(i, f, g);
      i.fillText(m, s + c, n + a / 2);
    }
    return { type: "input", config: h };
  }
  wrapText(e, i, o) {
    const s = [], n = i.split(`
`);
    for (const r of n) {
      if (r === "") {
        s.push("");
        continue;
      }
      let a = r;
      for (; a.length > 0; ) {
        const l = this.findLineBreakPoint(e, a, o);
        l === 0 ? (s.push(a[0]), a = a.slice(1)) : (s.push(a.slice(0, l)), a = a.slice(l));
      }
    }
    return s;
  }
  /**
   * 二分查找找到能放入 maxWidth 的最大字符数
   */
  findLineBreakPoint(e, i, o) {
    const s = i.length;
    if (s === 0) return 0;
    if (e.measureText(i).width <= o)
      return s;
    let n = 1, r = s, a = 0;
    for (; n <= r; ) {
      const l = Math.floor((n + r) / 2), h = i.slice(0, l);
      e.measureText(h).width <= o ? (a = l, n = l + 1) : r = l - 1;
    }
    return a;
  }
  truncateTextWithEllipsis(e, i, o, s = !1) {
    const n = "...", r = e.measureText(n).width, a = e.measureText(i).width;
    return a <= o ? s ? a + r <= o ? i + n : this.truncateWithEllipsisBinary(e, i, o, n, r) : i : this.truncateWithEllipsisBinary(e, i, o, n, r);
  }
  /**
   * 二分查找截断文本并添加省略号
   */
  truncateWithEllipsisBinary(e, i, o, s, n) {
    const r = o - n;
    if (r <= 0)
      return s;
    const a = i.length;
    let l = 0, h = a, c = 0;
    for (; l <= h; ) {
      const d = Math.floor((l + h) / 2), u = i.slice(0, d);
      e.measureText(u).width <= r ? (c = d, l = d + 1) : h = d - 1;
    }
    return i.slice(0, c) + s;
  }
}
class Ci extends ct {
  constructor() {
    super(...arguments);
    b(this, "type", "rating");
  }
  render(e) {
    const { ctx: i, x: o, y: s, width: n, height: r, value: a, isDisabled: l } = e, h = a, c = h.value ?? 0, d = h.max ?? 5, u = h.starSize ?? 16, f = h.allowHalf ?? !1, g = Math.min(u, Math.floor(n / d)), m = h.color ?? "#FFD700", x = h.inactiveColor ?? "#E0E0E0", w = h.disabledColor ?? "#BDBDBD", y = l ? w : m, C = l ? w : x, v = d * g, R = o + (n - v) / 2, I = s + (r - g) / 2;
    i.save();
    const M = [];
    for (let E = 0; E < d; E++) {
      const T = R + E * g;
      M.push({
        index: E,
        x: T,
        width: g
      });
      const D = c - E;
      let H = 0;
      D >= 1 ? H = 1 : D > 0 && (H = f ? D : 0), this.drawStar(i, T, I, g, H, y, C);
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
  drawStar(e, i, o, s, n, r, a) {
    const l = i + s / 2, h = o + s / 2, c = s / 2, d = c * 0.4, u = this.getStarPoints(l, h, c, d);
    e.beginPath(), e.moveTo(u[0].x, u[0].y);
    for (let f = 1; f < u.length; f++)
      e.lineTo(u[f].x, u[f].y);
    if (e.closePath(), e.fillStyle = a, e.fill(), n > 0) {
      e.save(), e.beginPath(), e.rect(i, o, s * n, s), e.clip(), e.beginPath(), e.moveTo(u[0].x, u[0].y);
      for (let f = 1; f < u.length; f++)
        e.lineTo(u[f].x, u[f].y);
      e.closePath(), e.fillStyle = r, e.fill(), e.restore();
    }
  }
  /**
   * Calculate star points coordinates
   */
  getStarPoints(e, i, o, s) {
    const n = [], r = Math.PI / 5, a = -Math.PI / 2;
    for (let l = 0; l < 10; l++) {
      const h = a + l * r, c = l % 2 === 0 ? o : s;
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
    b(this, "type", "color");
  }
  render(e) {
    const { ctx: i, theme: o, x: s, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, u = Math.min(bi - 8 * 2, 24), f = s + (r - u) / 2, g = n + (a - u) / 2;
    return i.fillStyle = c.value || "#ffffff", i.fillRect(f, g, u, u), i.strokeStyle = h ? "#bdbdbd" : "#d9d9d9", i.lineWidth = 1, i.strokeRect(f, g, u, u), c.showText && (i.fillStyle = this.getContrastColor(c.value || "#ffffff"), i.font = `${o.font.size}px ${o.font.family}`, i.textAlign = "center", i.textBaseline = "middle", i.fillText(c.value || "", f + u / 2, g + u / 2)), { type: "color", config: c };
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
      const o = this.currentFrame.rendererTimes.get(t) || [];
      o.push(e), this.currentFrame.rendererTimes.set(t, o), this.currentFrame.cellCount++;
    }
  }
  /**
   * Measure the execution time of a render function
   */
  measure(t, e) {
    if (!this.enabled)
      return e();
    const i = performance.now(), o = e(), s = performance.now() - i;
    return this.recordRender(t, s), o;
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
    return Array.from(this.stats.entries()).map(([i, o]) => ({ type: i, stats: o })).sort((i, o) => o.stats.avgTime - i.stats.avgTime).slice(0, t);
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
    for (const { type: i, stats: o } of e)
      t.push(
        `${i.padEnd(15)} | calls: ${o.callCount.toString().padStart(6)} | avg: ${o.avgTime.toFixed(3).padStart(8)}ms | max: ${o.maxTime.toFixed(3).padStart(8)}ms | total: ${o.totalTime.toFixed(1).padStart(8)}ms`
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
    b(this, "renderers", /* @__PURE__ */ new Map());
    b(this, "defaultRenderer");
    b(this, "performanceMonitor");
    b(this, "locale");
    this.locale = t, this.register(new ne()), this.register(new li()), this.register(new hi()), this.register(new ci()), this.register(new di()), this.register(new ui()), this.register(new fi()), this.register(new mi()), this.register(new pi()), this.register(new xi()), this.register(new wi()), this.register(new yi()), this.register(new Ci()), this.register(new vi()), this.defaultRenderer = new ne(), this.performanceMonitor = Ii();
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
    return this.performanceMonitor.measure(
      e,
      () => i.render(t)
    );
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
    const o = { ...t, children: i };
    return p(o);
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
  layout(t, e, i, o) {
    return this.layoutResults = [], this.rootParentSize = o, this.layoutElement(t, e, i, o), this.rootParentSize = void 0, this.layoutResults.sort((s, n) => (s.zIndex ?? 0) - (n.zIndex ?? 0));
  }
  /**
   * 计算元素树布局，返回树形结构（用于渲染时直接定位子元素）
   * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
   */
  layoutTree(t, e, i, o) {
    this.rootParentSize = o;
    const s = this.layoutNode(t, e, i, o);
    return this.rootParentSize = void 0, s;
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
  layoutNode(t, e, i, o) {
    if (t.type === "CTBox" && t.props.display === "flex")
      return this.layoutGroupNode(t, e, i, o);
    if (t.type === "CTBox" && t.props.position === "relative")
      return this.layoutPositionedGroupNode(t, e, i, o);
    const s = this.measurementEngine.measureElement(t), n = this.clampSize(s, t.props, o), r = t.props.zIndex, a = this.parseMargin(t.props.margin);
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
  layoutElement(t, e, i, o) {
    if (t.type === "CTBox" && t.props.display === "flex")
      return this.layoutGroup(t, e, i, o);
    if (t.type === "CTBox" && t.props.position === "relative")
      return this.layoutPositionedGroup(t, e, i, o);
    const s = this.measurementEngine.measureElement(t), n = this.clampSize(s, t.props, o), r = t.props.zIndex, a = this.parseMargin(t.props.margin), l = { x: e, y: i, width: n.width, height: n.height, zIndex: r, margin: a };
    return this.layoutResults.push(l), l;
  }
  /**
   * 解析容器自身尺寸：优先使用 width/height（支持百分比），否则用 fallback（内容尺寸）
   * 根元素（即 parentSize 来自外部传入时）默认撑满父容器
   */
  resolveContainerSize(t, e, i, o, s) {
    const n = e == null ? void 0 : e.width, r = e == null ? void 0 : e.height;
    let a = this.resolveSize(t.width, n), l = this.resolveSize(t.height, r);
    a === void 0 && (a = s && n !== void 0 ? n : i), l === void 0 && (l = s && r !== void 0 ? r : o);
    const h = this.resolveSize(t.minWidth, n), c = this.resolveSize(t.maxWidth, n), d = this.resolveSize(t.minHeight, r), u = this.resolveSize(t.maxHeight, r);
    return {
      width: this.clampValue(a, h, c),
      height: this.clampValue(l, d, u)
    };
  }
  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  layoutPositionedGroup(t, e, i, o) {
    const s = t.props, n = t.children || [], r = o !== void 0 && o === this.rootParentSize, { width: a, height: l } = this.resolveContainerSize(
      s,
      o,
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
  layoutPositionedGroupNode(t, e, i, o) {
    const s = t.props, n = t.children || [], r = o !== void 0 && o === this.rootParentSize, { width: a, height: l } = this.resolveContainerSize(
      s,
      o,
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
  layoutGroup(t, e, i, o) {
    const s = t.props, n = t.children || [], r = o !== void 0 && o === this.rootParentSize, a = this.parsePadding(s.padding), l = s.width !== void 0 || r && (o == null ? void 0 : o.width) !== void 0, h = s.height !== void 0 || r && (o == null ? void 0 : o.height) !== void 0;
    let c, d;
    if (l && h) {
      const w = this.resolveContainerSize(s, o, 0, 0, r);
      c = w.width, d = w.height;
    } else {
      const w = n.map((M) => this.measureChildSize(M)), y = this.calculateContentSize(w, s), C = this.calculateContentHeight(w, s), v = y + a.left + a.right, R = C + a.top + a.bottom, I = this.resolveContainerSize(s, o, v, R, r);
      c = I.width, d = I.height;
    }
    const u = {
      width: c - a.left - a.right,
      height: d - a.top - a.bottom
    }, f = n.map(
      (w) => this.measureChildSize(w, u)
    ), g = e + a.left, m = i + a.top;
    this.layoutChildren(
      n,
      f,
      g,
      m,
      s,
      c,
      d,
      u
    );
    const x = { x: e, y: i, width: c, height: d };
    return this.layoutResults.push(x), x;
  }
  layoutGroupNode(t, e, i, o) {
    const s = t.props, n = t.children || [], r = o !== void 0 && o === this.rootParentSize, a = this.parsePadding(s.padding), l = s.width !== void 0 || r && (o == null ? void 0 : o.width) !== void 0, h = s.height !== void 0 || r && (o == null ? void 0 : o.height) !== void 0;
    let c, d;
    if (l && h) {
      const H = this.resolveContainerSize(s, o, 0, 0, r);
      c = H.width, d = H.height;
    } else {
      const H = n.map((A) => this.measureChildSize(A)), O = this.calculateContentSize(H, s), k = this.calculateContentHeight(H, s), P = O + a.left + a.right, L = k + a.top + a.bottom, W = this.resolveContainerSize(s, o, P, L, r);
      c = W.width, d = W.height;
    }
    const u = {
      width: c - a.left - a.right,
      height: d - a.top - a.bottom
    }, f = n.map(
      (H) => this.measureChildSize(H, u)
    ), g = e + a.left, m = i + a.top, x = s.flexDirection ?? "row", w = s.justifyContent ?? "flex-start", y = s.alignItems ?? "flex-start";
    let C = s.gap ?? 0;
    const v = u.width, R = u.height, I = this.calculateContentSize(f, s), M = this.calculateContentHeight(f, s);
    let E = 0;
    if (x === "row" || x === "row-reverse") {
      if (E = this.calcMainOffset(
        v,
        I,
        w,
        f,
        n.length,
        C
      ), w === "space-between" && n.length > 1) {
        const H = f.reduce((O, k) => O + k.width, 0);
        C = (v - H) / (n.length - 1);
      } else if (w === "space-around" && n.length > 0) {
        const H = f.reduce((k, P) => k + P.width, 0), O = (v - H) / n.length;
        E = O / 2, C = O;
      } else if (w === "space-evenly" && n.length > 0) {
        const H = f.reduce((k, P) => k + P.width, 0), O = (v - H) / (n.length + 1);
        E = O, C = O;
      }
    } else if (E = this.calcMainOffset(
      R,
      M,
      w,
      f,
      n.length,
      C
    ), w === "space-between" && n.length > 1) {
      const H = f.reduce((O, k) => O + k.height, 0);
      C = (R - H) / (n.length - 1);
    } else if (w === "space-around" && n.length > 0) {
      const H = f.reduce((k, P) => k + P.height, 0), O = (R - H) / n.length;
      E = O / 2, C = O;
    } else if (w === "space-evenly" && n.length > 0) {
      const H = f.reduce((k, P) => k + P.height, 0), O = (R - H) / (n.length + 1);
      E = O, C = O;
    }
    let T = E;
    const D = [];
    for (let H = 0; H < n.length; H++) {
      const O = n[H], k = f[H], P = k.margin ?? { top: 0, right: 0, bottom: 0, left: 0 }, L = k.width - P.left - P.right, W = k.height - P.top - P.bottom, A = O.props.alignSelf ?? y;
      let _ = 0;
      x === "row" || x === "row-reverse" ? _ = this.calcCrossOffset(R, W, A) : _ = this.calcCrossOffset(v, L, A);
      let F, V;
      x === "row" ? (F = g + T + P.left, V = m + _ + P.top) : x === "row-reverse" ? (F = g + v - T - k.width + P.left, V = m + _ + P.top) : x === "column" ? (F = g + _ + P.left, V = m + T + P.top) : (F = g + _ + P.left, V = m + R - T - k.height + P.top), D.push(this.layoutNode(O, F, V, u)), T += (x === "row" || x === "row-reverse" ? k.width : k.height) + C;
    }
    return {
      element: t,
      x: e,
      y: i,
      width: c,
      height: d,
      children: D
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
    const o = this.measurementEngine.measureElement(t), s = this.clampSize(o, t.props, e);
    return {
      x: 0,
      y: 0,
      width: s.width + i.left + i.right,
      height: s.height + i.top + i.bottom,
      margin: i
    };
  }
  /**
   * 测量 group 尺寸，不影响 layoutResults
   */
  measureGroupSize(t, e) {
    const i = t.props, o = t.children || [], s = this.parsePadding(i.padding), n = e == null ? void 0 : e.width, r = e == null ? void 0 : e.height, a = this.resolveSize(i.width, n), l = this.resolveSize(i.height, r);
    let h, c;
    if (a !== void 0 && l !== void 0)
      h = a, c = l;
    else {
      const m = o.map((y) => this.measureChildSize(y)), x = this.calculateContentSize(m, i), w = this.calculateContentHeight(m, i);
      h = a ?? x + s.left + s.right, c = l ?? w + s.top + s.bottom;
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
    const o = i == null ? void 0 : i.width, s = i == null ? void 0 : i.height, n = this.resolveSize(e.minWidth, o), r = this.resolveSize(e.maxWidth, o), a = this.resolveSize(e.minHeight, s), l = this.resolveSize(e.maxHeight, s);
    return {
      x: t.x,
      y: t.y,
      width: this.clampValue(t.width, n, r),
      height: this.clampValue(t.height, a, l)
    };
  }
  calcMainOffset(t, e, i, o, s, n) {
    if (i === "center") return (t - e) / 2;
    if (i === "flex-end") return t - e;
    if (i === "space-between" && s > 1)
      return 0;
    if (i === "space-around" && s > 0) {
      const r = o.reduce((l, h) => l + h.width, 0);
      return (t - r) / s / 2;
    }
    if (i === "space-evenly" && s > 0) {
      const r = o.reduce((l, h) => l + h.width, 0);
      return (t - r) / (s + 1);
    }
    return 0;
  }
  calcCrossOffset(t, e, i) {
    return i === "center" ? (t - e) / 2 : i === "flex-end" ? t - e : 0;
  }
  calculateContentSize(t, e) {
    const i = e.gap ?? 0, o = e.flexDirection ?? "row";
    if (o === "row" || o === "row-reverse") {
      const s = t.reduce((r, a) => r + a.width, 0), n = t.length > 1 ? (t.length - 1) * i : 0;
      return s + n;
    } else
      return Math.max(...t.map((s) => s.width), 0);
  }
  calculateContentHeight(t, e) {
    const i = e.gap ?? 0, o = e.flexDirection ?? "row";
    if (o === "column" || o === "column-reverse") {
      const s = t.reduce((r, a) => r + a.height, 0), n = t.length > 1 ? (t.length - 1) * i : 0;
      return s + n;
    } else
      return Math.max(...t.map((s) => s.height), 0);
  }
  layoutChildren(t, e, i, o, s, n, r, a) {
    const l = s.flexDirection ?? "row", h = s.justifyContent ?? "flex-start", c = s.alignItems ?? "flex-start";
    let d = s.gap ?? 0;
    const u = this.calculateContentSize(e, s), f = this.calculateContentHeight(e, s), g = a.width, m = a.height;
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
        const y = e.reduce((C, v) => C + v.width, 0);
        d = (g - y) / (t.length - 1);
      }
      if (h === "space-around" && t.length > 0) {
        const y = e.reduce((v, R) => v + R.width, 0), C = (g - y) / t.length;
        x = C / 2, d = C;
      }
      if (h === "space-evenly" && t.length > 0) {
        const y = e.reduce((v, R) => v + R.width, 0), C = (g - y) / (t.length + 1);
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
        const y = e.reduce((C, v) => C + v.height, 0);
        d = (m - y) / (t.length - 1);
      }
      if (h === "space-around" && t.length > 0) {
        const y = e.reduce((v, R) => v + R.height, 0), C = (m - y) / t.length;
        x = C / 2, d = C;
      }
      if (h === "space-evenly" && t.length > 0) {
        const y = e.reduce((v, R) => v + R.height, 0), C = (m - y) / (t.length + 1);
        x = C, d = C;
      }
    }
    let w = x;
    for (let y = 0; y < t.length; y++) {
      const C = t[y], v = e[y], R = v.margin ?? { top: 0, right: 0, bottom: 0, left: 0 }, I = v.width - R.left - R.right, M = v.height - R.top - R.bottom, E = C.props.alignSelf ?? c;
      let T = 0;
      l === "row" || l === "row-reverse" ? T = this.calcCrossOffset(m, M, E) : T = this.calcCrossOffset(g, I, E);
      let D, H;
      l === "row" ? (D = i + w + R.left, H = o + T + R.top) : l === "row-reverse" ? (D = i + g - w - v.width + R.left, H = o + T + R.top) : l === "column" ? (D = i + T + R.left, H = o + w + R.top) : (D = i + T + R.left, H = o + m - w - v.height + R.top), this.layoutElement(C, D, H, a), w += (l === "row" || l === "row-reverse" ? v.width : v.height) + d;
    }
  }
}
class Ti {
  constructor(t) {
    b(this, "ctx");
    this.ctx = t;
  }
  measureTextWidth(t, e, i, o, s) {
    return this.ctx.font = `${s ?? "normal"} ${o ?? "normal"} ${e}px ${i}`, this.ctx.measureText(t).width;
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
    const e = t.props, i = e.fontSize ?? 14, o = e.fontFamily ?? "Arial", s = e.lineHeight ?? i, n = e.fontWeight ?? "normal", r = e.fontStyle ?? "normal", a = e.letterSpacing ?? 0;
    let l = this.measureTextWidth(e.text, i, o, n, r);
    return a > 0 && e.text.length > 1 && (l += a * (e.text.length - 1)), e.maxWidth && l > e.maxWidth && (l = e.maxWidth), { x: 0, y: 0, width: l, height: s };
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
    const i = e.points.map((l) => l.x), o = e.points.map((l) => l.y), s = Math.min(...i), n = Math.max(...i), r = Math.min(...o), a = Math.max(...o);
    return { x: s, y: r, width: n - s, height: a - r };
  }
}
class Di {
  constructor(t, e, i) {
    b(this, "ctx");
    b(this, "layoutEngine");
    b(this, "theme");
    b(this, "layouts", []);
    this.ctx = t, this.layoutEngine = e, this.theme = i;
  }
  render(t, e, i, o) {
    const s = this.layoutEngine.layoutTree(t, e, i, o);
    this.layouts = this.flattenLayoutTree(s), this.ctx.save();
    try {
      this.renderLayoutNode(s);
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
    const i = t.borderTopLeftRadius ?? e, o = t.borderTopRightRadius ?? e, s = t.borderBottomRightRadius ?? e, n = t.borderBottomLeftRadius ?? e;
    return i === o && o === s && s === n ? i : [i, o, s, n];
  }
  drawRoundedRect(t, e, i, o, s) {
    this.ctx.beginPath(), typeof s == "number" && s === 0 ? this.ctx.rect(t, e, i, o) : this.ctx.roundRect(t, e, i, o, s);
  }
  createGradientFill(t, e, i, o, s) {
    if (s.type === "linear") {
      const r = (s.angle - 90) * Math.PI / 180, a = t + i / 2, l = e + o / 2, h = Math.max(i, o), c = a - Math.cos(r) * h / 2, d = l - Math.sin(r) * h / 2, u = a + Math.cos(r) * h / 2, f = l + Math.sin(r) * h / 2, g = this.ctx.createLinearGradient(c, d, u, f);
      return s.colors.forEach((m, x) => {
        g.addColorStop(x / (s.colors.length - 1), m);
      }), g;
    } else {
      const n = t + i / 2, r = e + o / 2, a = Math.max(i, o) / 2, l = this.ctx.createRadialGradient(n, r, 0, n, r, a);
      return s.colors.forEach((h, c) => {
        l.addColorStop(c / (s.colors.length - 1), h);
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
    const e = t.element, i = t.x, o = t.y, s = e.props, n = t.width, r = t.height, a = s.borderRadius ?? 0, l = this.getBorderRadiusArray(s, a), h = s.opacity !== void 0;
    h && (this.ctx.save(), this.ctx.globalAlpha = s.opacity);
    try {
      const c = !!s.boxShadow;
      if (c) {
        const x = this.normalizeShadow(s.boxShadow);
        this.ctx.save(), this.ctx.shadowColor = x.color, this.ctx.shadowBlur = x.blur, this.ctx.shadowOffsetX = x.offsetX, this.ctx.shadowOffsetY = x.offsetY, s.backgroundColor || s.backgroundGradient || (this.drawRoundedRect(
          i + (x.spread ?? 0),
          o + (x.spread ?? 0),
          n + (x.spread ?? 0) * 2,
          r + (x.spread ?? 0) * 2,
          l
        ), this.ctx.fillStyle = x.color, this.ctx.fill());
      }
      try {
        s.backgroundGradient ? (this.ctx.fillStyle = this.createGradientFill(
          i,
          o,
          n,
          r,
          s.backgroundGradient
        ), this.drawRoundedRect(i, o, n, r, l), this.ctx.fill()) : s.backgroundColor && (this.ctx.fillStyle = s.backgroundColor, this.drawRoundedRect(i, o, n, r, l), this.ctx.fill());
      } finally {
        c && this.ctx.restore();
      }
      s.borderColor && s.borderWidth && (this.ctx.strokeStyle = s.borderColor, this.ctx.lineWidth = s.borderWidth, this.drawRoundedRect(i, o, n, r, l), this.ctx.stroke());
      const d = this.normalizeBorderSide(s.borderTop), u = this.normalizeBorderSide(s.borderRight), f = this.normalizeBorderSide(s.borderBottom), g = this.normalizeBorderSide(s.borderLeft);
      (d || u || f || g) && (d && (this.ctx.strokeStyle = d.color, this.ctx.lineWidth = d.width, this.ctx.beginPath(), this.ctx.moveTo(i, o), this.ctx.lineTo(i + n, o), this.ctx.stroke()), f && (this.ctx.strokeStyle = f.color, this.ctx.lineWidth = f.width, this.ctx.beginPath(), this.ctx.moveTo(i, o + r), this.ctx.lineTo(i + n, o + r), this.ctx.stroke()), g && (this.ctx.strokeStyle = g.color, this.ctx.lineWidth = g.width, this.ctx.beginPath(), this.ctx.moveTo(i, o), this.ctx.lineTo(i, o + r), this.ctx.stroke()), u && (this.ctx.strokeStyle = u.color, this.ctx.lineWidth = u.width, this.ctx.beginPath(), this.ctx.moveTo(i + n, o), this.ctx.lineTo(i + n, o + r), this.ctx.stroke()));
      const m = s.overflow === "hidden" || s.overflow === "clip";
      m && (this.ctx.save(), this.drawRoundedRect(i, o, n, r, l), this.ctx.clip());
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
      const e = t.trim().split(/\s+/), i = Number(e[0]) || 0, o = Number(e[1]) || 0, s = Number(e[2]) || 0, n = e.filter((l) => !isNaN(Number(l))), r = n.length > 3 ? Number(e[3]) : 0, a = e.slice(n.length > 3 ? 4 : 3).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX: i, offsetY: o, blur: s, spread: r, color: a };
    }
    return t;
  }
  renderCircle(t, e, i) {
    const o = t.props, s = e + o.radius, n = i + o.radius, r = o.startAngle ?? 0, a = o.endAngle ?? Math.PI * 2;
    this.ctx.beginPath(), this.ctx.arc(s, n, o.radius, r, a, !1), o.backgroundColor && (this.ctx.fillStyle = o.backgroundColor, this.ctx.fill()), o.borderColor && o.borderWidth && (this.ctx.strokeStyle = o.borderColor, this.ctx.lineWidth = o.borderWidth, this.ctx.stroke());
  }
  renderText(t, e, i, o) {
    const s = t.props, n = s.fontSize ?? this.theme.font.size, r = s.fontFamily ?? this.theme.font.family, a = s.fontWeight ?? "normal", l = s.fontStyle ?? "normal", h = s.color ?? this.theme.colors.cellText, c = s.lineHeight ?? n, d = s.textAlign ?? "left", u = s.textDecoration ?? "none", f = s.letterSpacing ?? 0;
    this.ctx.font = `${l} ${a} ${n}px ${r}`, this.ctx.fillStyle = h;
    let g = e;
    d === "center" ? (g = e + o / 2, this.ctx.textAlign = "center") : d === "right" ? (g = e + o, this.ctx.textAlign = "right") : this.ctx.textAlign = "left", this.ctx.textBaseline = "middle";
    const m = i + c / 2;
    if (f > 0) {
      this.ctx.textAlign = "left";
      let x = d === "center" ? e + (o - this.getTextWidthWithSpacing(
        s.text,
        n,
        r,
        a,
        l,
        f
      )) / 2 : d === "right" ? e + o - this.getTextWidthWithSpacing(
        s.text,
        n,
        r,
        a,
        l,
        f
      ) : e;
      for (let w = 0; w < s.text.length; w++) {
        const y = s.text[w];
        s.maxWidth ? this.ctx.fillText(y, x, m, s.maxWidth) : this.ctx.fillText(y, x, m);
        const C = this.measureCharWidth(y, n, r, a, l);
        x += C + f;
      }
    } else
      s.maxWidth ? this.ctx.fillText(s.text, g, m, s.maxWidth) : this.ctx.fillText(s.text, g, m);
    if (u === "underline") {
      const x = f > 0 ? this.getTextWidthWithSpacing(
        s.text,
        n,
        r,
        a,
        l,
        f
      ) : this.ctx.measureText(s.text).width, w = m + n / 2 + 1, y = d === "center" ? g - x / 2 : d === "right" ? g - x : g;
      this.ctx.strokeStyle = h, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(y, w), this.ctx.lineTo(y + x, w), this.ctx.stroke();
    } else if (u === "line-through") {
      const x = f > 0 ? this.getTextWidthWithSpacing(
        s.text,
        n,
        r,
        a,
        l,
        f
      ) : this.ctx.measureText(s.text).width, w = m, y = d === "center" ? g - x / 2 : d === "right" ? g - x : g;
      this.ctx.strokeStyle = h, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(y, w), this.ctx.lineTo(y + x, w), this.ctx.stroke();
    }
    this.ctx.textAlign = "left", this.ctx.textBaseline = "alphabetic";
  }
  measureCharWidth(t, e, i, o, s) {
    return this.ctx.font = `${s} ${o} ${e}px ${i}`, this.ctx.measureText(t).width;
  }
  getTextWidthWithSpacing(t, e, i, o, s, n) {
    this.ctx.font = `${s} ${o} ${e}px ${i}`;
    let r = 0;
    for (let a = 0; a < t.length; a++)
      r += this.ctx.measureText(t[a]).width, a < t.length - 1 && (r += n);
    return r;
  }
  renderImage(t, e, i) {
    const o = t.props;
    this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(e, i, o.width, o.height);
  }
  renderLine(t, e, i) {
    const o = t.props;
    if (!(o.points.length < 2)) {
      this.ctx.beginPath(), this.ctx.strokeStyle = o.strokeColor ?? "#333333", this.ctx.lineWidth = o.strokeWidth ?? 1, this.ctx.lineCap = o.strokeLinecap ?? "butt", this.ctx.moveTo(e + o.points[0].x, i + o.points[0].y);
      for (let s = 1; s < o.points.length; s++)
        this.ctx.lineTo(e + o.points[s].x, i + o.points[s].y);
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
      const t = p.trim().split(/\s+/), e = Number(t[0]) || 0, i = Number(t[1]) || 0, o = Number(t[2]) || 0, s = Number(t[3]) || 0, n = t.length > 5 || t[3] && !isNaN(Number(t[3])) ? 4 : 3, r = t.slice(n).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX: e, offsetY: i, blur: o, spread: s, color: r };
    }
    return p;
  }
}
function Oi(p) {
  const t = Hi(p.border), e = Rt(p.borderTop), i = Rt(p.borderRight), o = Rt(p.borderBottom), s = Rt(p.borderLeft), n = ki(p.shadow ?? p.boxShadow);
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
    borderBottom: o,
    borderLeft: s,
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
  constructor(t, e, i, o = ht) {
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
    // 图片渲染器使用的运行时桥接
    b(this, "imageRuntime");
    // 图片单元格的快路径：缓存渲染器与可复用 context，
    // 避免在滚动热路径上每个单元格都分配 options/context 对象。
    b(this, "imageRenderer");
    b(this, "imageRenderContext");
    /** 当前帧收集的可见图片 URL */
    b(this, "frameVisibleUrls", /* @__PURE__ */ new Set());
    // 文本宽度缓存（用于按钮等需要测量文本宽度的场景）
    b(this, "textWidthCache", /* @__PURE__ */ new Map());
    b(this, "textWidthCacheKey", "");
    // 性能监控
    b(this, "performanceEnabled", !1);
    // type -> columnKey -> stats
    b(this, "performanceStats", /* @__PURE__ */ new Map());
    b(this, "frameStartTime", 0);
    b(this, "frameCount", 0);
    b(this, "lastReportTime", 0);
    // 当前帧统计 (type -> columnKey -> stats)
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
    this.canvas = t, this.ctx = this.getContext(t), this.theme = e, this.layoutManager = i, this.locale = o, this.dpr = It(), this.offscreenCanvas = document.createElement("canvas"), this.offscreenCtx = this.getContext(this.offscreenCanvas), this.cellRendererRegistry = new Ei(o), this.dropdownRenderer = new ii(
      this.ctx,
      this.theme,
      (s) => this.measureTextWidth(s),
      o
    ), this.filterDropdownRenderer = new si(this.ctx, this.theme, o), this.imageOverlayRenderer = new ri(
      this.ctx,
      this.theme,
      {
        get: (s, n) => this.imageLoadQueue.get(s, n),
        isLoading: (s) => this.imageLoadQueue.isLoading(s),
        load: (s, n) => this.loadImage(s, n),
        collectVisible: (s) => this.collectVisibleImage(s)
      },
      o
    ), this.overlayRenderer = new ai(
      this.canvas,
      this.ctx,
      this.theme,
      this.layoutManager,
      this.dpr,
      o
    ), this.imageLoadQueue = new ee(), this.imageRuntime = {
      get: (s, n) => this.imageLoadQueue.get(s, n),
      isLoading: (s) => this.imageLoadQueue.isLoading(s),
      isFailed: (s) => this.imageLoadQueue.isFailed(s),
      load: (s, n) => this.loadImage(s, n),
      collectVisible: (s) => this.collectVisibleImage(s),
      isInLazyLoadRange: (s, n) => this.isInLazyLoadRange(s, n)
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
  markDirty(t, e, i, o) {
    this.dirtyRegions.push({ x: t, y: e, width: i, height: o });
  }
  markFullRedraw() {
  }
  render(t, e, i, o, s, n) {
    var v, R, I;
    this.currentSwitchAnimations = n.switchAnimations, this.currentButtonHoverStates = n.buttonHoverStates, this.currentHoveredCell = n.hoveredCell, this.currentHoveredImageIndex = n.hoveredImageIndex ?? -1, this.currentHoveredButtonIndex = n.hoveredButtonIndex ?? -1, this.currentProgressDragState = n.progressDragState, this.currentRowResizeState = n.rowResizeState, this.currentValidationErrors = n.validationErrors ?? /* @__PURE__ */ new Map(), this.currentPendingValidations = n.pendingValidations ?? /* @__PURE__ */ new Set(), this.beginFrame(), this.currentVisibleRange = i, this.currentRows = e, this.currentScrollTop = s, this.rowHeight = this.theme.row.height;
    const { startRow: r, endRow: a } = i, l = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, l, h);
    const c = this.layoutManager.getLeafColumns(), d = this.layoutManager.getFixedColumnsInfo(t), u = d.leftFixed.columns.length > 0, f = d.rightFixed.columns.length > 0;
    this.hoveredPlaceholderColumnIndex = n.hoveredCell && ((v = c[n.hoveredCell.columnIndex]) != null && v.key.startsWith("__hidden_placeholder__")) ? n.hoveredCell.columnIndex : -1;
    const g = u ? d.leftFixed.width : 0, m = l - (f ? d.rightFixed.width : 0), x = this.layoutManager.getVisibleCenterColumnIndices(), w = [], y = [];
    for (let M = 0; M < c.length; M++) {
      const E = c[M];
      E && (E.fixed === "left" && w.push(M), E.fixed === "right" && y.push(M));
    }
    const C = this.shouldRenderRowBands();
    this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(g, 0, m - g, h), this.ctx.clip(), C ? this.renderRowBands(
      e,
      x,
      [],
      [],
      o,
      s,
      i,
      d,
      n
    ) : this.renderCenterRows(
      c,
      e,
      r,
      a,
      x,
      o,
      s,
      {
        ...n,
        dragColumnIndex: (R = n.columnReorderState) == null ? void 0 : R.dragColumnIndex,
        columnReorderState: n.columnReorderState
      }
    ), this.ctx.restore(), this.renderCenterSelections(n.selectedCells, o, s, x), n.showHeader && this.renderCenterHeader(
      t,
      x,
      s,
      n.sortConfig,
      n.filterConfig,
      o,
      n.hoveredHeaderColumnKey,
      (I = n.columnReorderState) == null ? void 0 : I.dragColumnIndex,
      n.columnReorderState
    ), u && !C && this.renderFixedColumnsContent(
      c,
      e,
      w,
      0,
      s,
      i,
      n
    ), f && !C && this.renderFixedColumnsContent(
      c,
      e,
      y,
      l - d.rightFixed.width,
      s,
      i,
      n
    ), C && (u || f) && this.renderRowBands(
      e,
      [],
      w,
      y,
      o,
      s,
      i,
      d,
      n
    ), this.renderFixedSelections(
      n.selectedCells,
      s,
      w,
      y
    ), n.showHeader && (u && this.renderFixedColumnsHeader(
      c,
      w,
      0,
      n.sortConfig,
      n.filterConfig,
      n.hoveredHeaderColumnKey,
      n.columnReorderState
    ), f && this.renderFixedColumnsHeader(
      c,
      y,
      l - d.rightFixed.width,
      n.sortConfig,
      n.filterConfig,
      n.hoveredHeaderColumnKey,
      n.columnReorderState
    )), this.renderRowResizeGuide(l), n.dropdown && this.renderDropdown(n.dropdown), n.headerContextMenu && this.renderHeaderContextMenu(n.headerContextMenu), n.columnReorderState && this.renderColumnReorderIndicator(n.columnReorderState, e, i, s), this.ctx.restore(), this.commitVisibleImages(), this.dirtyRegions = [];
  }
  shouldRenderRowBands() {
    const t = this.layoutManager.getRowBandsForRender();
    return this.layoutManager.hasPinnedRows() || t.summaryTop.rows.length > 0 || t.summaryBottom.rows.length > 0;
  }
  renderRowBandCells(t, e, i, o, s, n, r, a) {
    var d;
    let l = t.y;
    t.type === "body" && (l -= s);
    const h = t.type === "body" ? n.startRow : 0, c = t.type === "body" ? Math.min(n.endRow, t.rows.length - 1) : t.rows.length - 1;
    for (let u = h; u <= c; u++) {
      const f = t.rows[u];
      if (!f)
        continue;
      const g = this.layoutManager.getRowIndexByRef(f);
      if (g < 0)
        continue;
      const m = this.layoutManager.getRowHeightByIndex(g);
      t.type === "body" && (l = t.y - s + (this.layoutManager.getRowBandOffsetByRef(f) ?? 0));
      const x = this.canvas.height / this.dpr;
      if (l + m < 0 || l > x) {
        l += m;
        continue;
      }
      let w = this.theme.colors.rowBackground;
      r.stripeRows && g % 2 === 1 && (w = this.theme.colors.rowAltBackground), f.selected && (w = this.theme.colors.rowSelectedBackground), ((d = r.hoveredCell) == null ? void 0 : d.rowIndex) === g && (w = this.theme.colors.rowHoverBackground);
      for (const y of i) {
        const C = this.layoutManager.getLeafColumn(y);
        if (!C) continue;
        const v = this.layoutManager.getColumnWidthByIndex(y), R = a !== void 0 ? a + this.layoutManager.getColumnOffset(y) - this.layoutManager.getColumnOffset(i[0]) : this.layoutManager.getColumnOffset(y) - o;
        this.ctx.fillStyle = w, this.ctx.fillRect(R, l, v, m), this.renderCellWithPosition(
          C,
          f,
          g,
          y,
          f.data[$(C)],
          R,
          l,
          v,
          m,
          r
        );
      }
      l += m;
    }
  }
  renderRowBands(t, e, i, o, s, n, r, a, l) {
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
      s,
      n,
      r,
      l
    ), this.ctx.restore();
    for (const u of c)
      this.renderRowBandCells(
        u,
        t,
        e,
        s,
        n,
        r,
        l
      );
    for (const u of d)
      this.renderSummaryBandCells(u, e, s);
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
        s,
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
          s,
          n,
          r,
          l,
          0
        );
      for (const u of d)
        this.renderSummaryBandCells(u, i, s, 0);
    }
    if (o.length > 0) {
      const u = this.canvas.width / this.dpr;
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(
        0,
        h.body.y,
        this.canvas.width / this.dpr,
        this.layoutManager.getBodyViewportHeight()
      ), this.ctx.clip(), this.renderRowBandCells(
        h.body,
        t,
        o,
        s,
        n,
        r,
        l,
        u - a.rightFixed.width
      ), this.ctx.restore();
      for (const f of c)
        this.renderRowBandCells(
          f,
          t,
          o,
          s,
          n,
          r,
          l,
          u - a.rightFixed.width
        );
      for (const f of d)
        this.renderSummaryBandCells(
          f,
          o,
          s,
          u - a.rightFixed.width
        );
    }
  }
  renderSummaryBandCells(t, e, i, o) {
    var r, a, l;
    if (t.rows.length === 0 || e.length === 0) return;
    let s = t.y;
    const n = new Set(e);
    for (const h of t.rows) {
      const c = h.height;
      for (const d of e) {
        const u = this.getSummaryColumnX(d, e, i, o), f = this.layoutManager.getColumnWidthByIndex(d);
        this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(u, s, f, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(u, s, f, c);
      }
      for (const d of h.cells) {
        const u = this.getSummaryCellSegments(d, n);
        if (u.length === 0)
          continue;
        const f = this.layoutManager.getLeafColumn(d.startColumnIndex);
        if (f)
          for (const g of u) {
            const m = this.getSummaryColumnX(g.start, e, i, o), w = this.layoutManager.getColumnOffset(g.end) + this.layoutManager.getColumnWidthByIndex(g.end) - this.layoutManager.getColumnOffset(g.start);
            this.ctx.fillStyle = ((r = d.renderResult.style) == null ? void 0 : r.backgroundColor) ?? this.theme.colors.headerBackground, this.ctx.fillRect(m, s, w, c), g.start <= d.startColumnIndex && d.startColumnIndex <= g.end && this.renderCellContent(
              d.renderResult,
              m,
              s,
              w,
              c,
              8,
              f.align,
              -1,
              d.startColumnIndex,
              !1,
              f.key
            ), this.ctx.strokeStyle = ((a = d.renderResult.style) == null ? void 0 : a.borderColor) ?? this.theme.colors.cellBorder, this.ctx.lineWidth = ((l = d.renderResult.style) == null ? void 0 : l.borderWidth) ?? this.theme.border.width, this.ctx.strokeRect(m, s, w, c);
          }
      }
      s += c;
    }
  }
  getSummaryColumnX(t, e, i, o) {
    const s = this.layoutManager.getColumnOffset(t);
    return o !== void 0 ? o + s - this.layoutManager.getColumnOffset(e[0]) : s - i;
  }
  getSummaryCellSegments(t, e) {
    const i = [];
    let o = null, s = null;
    for (let n = t.startColumnIndex; n <= t.endColumnIndex; n++) {
      if (!e.has(n)) {
        o !== null && s !== null && (i.push({ start: o, end: s }), o = null, s = null);
        continue;
      }
      o === null ? o = n : s !== null && n !== s + 1 && (i.push({ start: o, end: s }), o = n), s = n;
    }
    return o !== null && s !== null && i.push({ start: o, end: s }), i;
  }
  renderCenterHeader(t, e, i, o, s, n, r, a, l) {
    const c = this.layoutManager.getLayoutInfo().headerHeight, d = this.layoutManager.getVisibleHeaderCells();
    let u = 0, f = 0;
    for (const g of e) {
      if (!this.layoutManager.getLeafColumn(g)) continue;
      const x = this.layoutManager.getColumnOffset(g), w = this.layoutManager.getColumnWidthByIndex(g);
      f === 0 && (u = x - n), f += w;
    }
    this.ctx.save(), f > 0 && (this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(u, 0, f, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(u, c), this.ctx.lineTo(u + f, c), this.ctx.stroke());
    for (const g of d) {
      if (g.column.fixed === "left" || g.column.fixed === "right")
        continue;
      const x = this.layoutManager.getLeafColumns().findIndex((v) => v === g.column), w = e.indexOf(x);
      let y = g.x - n;
      if (w !== -1) {
        let v = 0;
        for (let I = 0; I < w; I++) {
          const M = e[I];
          M !== void 0 && (v += this.layoutManager.getColumnWidthByIndex(M));
        }
        y = this.layoutManager.getColumnOffset(e[0]) - n + v;
      }
      const C = g.column.key === r;
      this.renderHeaderCellMultiLevel(
        g.column,
        y,
        g.y,
        g.width,
        g.height,
        g.colspan,
        g.rowspan,
        o,
        s,
        C,
        !1,
        x
      );
    }
    this.endFrame(), this.ctx.restore();
  }
  renderHeaderCellMultiLevel(t, e, i, o, s, n, r, a, l, h = !1, c = !1, d = -1) {
    var k, P;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const L = this.hoveredPlaceholderColumnIndex === d;
      this.ctx.fillStyle = L ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, i, o, s), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, o, s);
      return;
    }
    const u = 8, g = t.reorderable !== !1 && h, m = g ? 10 : 0;
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, i, o, s), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const x = a.find((L) => L.column === t.key), w = (x == null ? void 0 : x.direction) ?? "none", y = t.sortable !== !1, C = !((k = t.children) != null && k.length) && y && (w !== "none" || h), v = C ? 20 : 0, R = l.some((L) => L.column === t.key), I = !((P = t.children) != null && P.length) && t.filterable && (R || h), M = I ? 20 : 0, E = o - u * 2 - v - M - m - (g ? 4 : 0), T = mt(t.title, Math.floor(E / 7)), D = t.align ?? "center";
    let H = e + u + m + (g ? 4 : 0);
    D === "center" ? (H = e + (o - this.ctx.measureText(T).width - v - M) / 2, g && (H = Math.max(H, e + u + m + 4))) : D === "right" && (H = e + o - u - this.ctx.measureText(T).width - v - M);
    const O = i + s / 2;
    if (this.ctx.fillText(T, H, O), g && this.renderDragHandle(e + u, i + s / 2), I) {
      const L = e + o - u - 10;
      C && this.renderSortIndicator(
        L - 16,
        O,
        w === "none" ? "hover" : w
      ), this.renderFilterIndicator(L, O, R);
    } else C && this.renderSortIndicator(
      e + o - u - 10,
      O,
      w === "none" ? "hover" : w
    );
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, o, s);
  }
  renderCenterRows(t, e, i, o, s, n, r, a) {
    var d;
    const l = /* @__PURE__ */ new Set(), h = (d = this.currentRowResizeState) == null ? void 0 : d.rowIndex;
    for (let u = i; u <= o; u++) {
      if (u === h)
        continue;
      const f = e[u];
      f && this.renderCenterRow(
        t,
        e,
        f,
        u,
        s,
        n,
        r,
        a,
        l
      );
    }
    const c = h !== void 0 && h >= i && h <= o ? e[h] : void 0;
    h !== void 0 && c && this.renderCenterRow(
      t,
      e,
      c,
      h,
      s,
      n,
      r,
      a,
      /* @__PURE__ */ new Set()
    );
  }
  renderCenterRow(t, e, i, o, s, n, r, a, l) {
    var x, w;
    const h = this.layoutManager.getRowOffset(o), c = this.getRenderedRowHeight(o), d = h - r, u = this.layoutManager.getLeafColumns();
    let f = this.theme.colors.rowBackground;
    a.stripeRows && o % 2 === 1 && (f = this.theme.colors.rowAltBackground), i.selected && (f = this.theme.colors.rowSelectedBackground), ((x = a.hoveredCell) == null ? void 0 : x.rowIndex) === o && (f = this.theme.colors.rowHoverBackground);
    for (const y of s) {
      if (this.layoutManager.isCellMerged(o, y) || !u[y]) continue;
      const v = s.indexOf(y);
      let R;
      if (v !== -1) {
        let M = 0;
        for (let T = 0; T < v; T++) {
          const D = s[T];
          D !== void 0 && (M += this.layoutManager.getColumnWidthByIndex(D));
        }
        R = this.layoutManager.getColumnOffset(s[0]) - n + M;
      } else
        R = this.layoutManager.getColumnOffset(y) - n;
      const I = this.layoutManager.getColumnWidthByIndex(y);
      this.ctx.fillStyle = f, this.ctx.fillRect(R, d, I, c);
    }
    const m = this.layoutManager.getMergesAffectingRow(o);
    for (const y of m) {
      if (!s.includes(y.columnIndex)) continue;
      const C = `${y.rowIndex}-${y.columnIndex}`;
      if (l.has(C)) continue;
      const v = e[y.rowIndex];
      if (!v) continue;
      const R = this.layoutManager.getMergedCellPosition(y.rowIndex, y.columnIndex);
      if (!R) continue;
      const I = u[y.columnIndex];
      if (!I) continue;
      const M = v.data[$(I)], T = ((w = a.hoveredCell) == null ? void 0 : w.rowIndex) !== void 0 && a.hoveredCell.rowIndex >= y.rowIndex && a.hoveredCell.rowIndex < y.rowIndex + y.rowspan ? this.theme.colors.rowHoverBackground : f, D = R.x - n, H = R.y - r;
      this.ctx.fillStyle = T, this.ctx.fillRect(D, H, R.width, R.height), this.renderCellWithPosition(
        I,
        v,
        y.rowIndex,
        y.columnIndex,
        M,
        D,
        H,
        R.width,
        R.height,
        a
      ), l.add(C);
    }
    for (const y of s) {
      const C = u[y];
      if (!C || this.layoutManager.isCellMerged(o, y) || this.layoutManager.getCellMerge(o, y))
        continue;
      const R = i.data[$(C)], I = s.indexOf(y);
      let M;
      if (I !== -1) {
        let O = 0;
        for (let P = 0; P < I; P++) {
          const L = s[P];
          L !== void 0 && (O += this.layoutManager.getColumnWidthByIndex(L));
        }
        M = this.layoutManager.getColumnOffset(s[0]) - n + O;
      } else
        M = this.layoutManager.getColumnOffset(y) - n;
      const E = this.layoutManager.getColumnWidthByIndex(y), D = this.layoutManager.getRowOffset(o) - r, H = this.getRenderedRowHeight(o);
      this.renderCellWithPosition(
        C,
        i,
        o,
        y,
        R,
        M,
        D,
        E,
        H,
        a
      );
    }
  }
  renderFixedColumnsContent(t, e, i, o, s, n, r) {
    var g, m, x;
    const a = this.canvas.height / this.dpr;
    this.ctx.save();
    let l = 0;
    for (const w of i)
      l += this.layoutManager.getColumnWidthByIndex(w);
    const h = /* @__PURE__ */ new Set(), c = (g = this.currentRowResizeState) == null ? void 0 : g.rowIndex, d = Math.max(0, n.startRow), u = Math.min(e.length - 1, n.endRow);
    for (let w = d; w <= u; w++) {
      if (w === c)
        continue;
      const y = e[w];
      if (!y) continue;
      const C = this.layoutManager.getRowOffset(w), v = this.getRenderedRowHeight(w), R = C - s;
      if (C + v < s || C > s + a)
        continue;
      let I = this.theme.colors.rowBackground;
      r.stripeRows && w % 2 === 1 && (I = this.theme.colors.rowAltBackground), y.selected && (I = this.theme.colors.rowSelectedBackground), ((m = r.hoveredCell) == null ? void 0 : m.rowIndex) === w && (I = this.theme.colors.rowHoverBackground);
      for (const H of i) {
        if (this.layoutManager.isCellMerged(w, H))
          continue;
        const O = this.layoutManager.getColumnWidthByIndex(H), k = o + this.layoutManager.getColumnOffset(H) - this.layoutManager.getColumnOffset(i[0]);
        this.ctx.fillStyle = I, this.ctx.fillRect(k, R, O, v);
      }
      const E = this.layoutManager.getMergesAffectingRow(w), T = this.layoutManager.getLeafColumns();
      for (const H of E) {
        if (!i.includes(H.columnIndex)) continue;
        const O = `${H.rowIndex}-${H.columnIndex}`;
        if (h.has(O)) continue;
        const k = e[H.rowIndex];
        if (!k) continue;
        const P = this.layoutManager.getMergedCellPosition(
          H.rowIndex,
          H.columnIndex
        );
        if (!P) continue;
        const L = T[H.columnIndex];
        if (!L) continue;
        const W = k.data[$(L)];
        let A = 0;
        const _ = o + this.layoutManager.getColumnOffset(H.columnIndex) - this.layoutManager.getColumnOffset(i[0]);
        for (let G = 0; G < H.colspan; G++) {
          const Y = H.columnIndex + G;
          i.includes(Y) && (A += this.layoutManager.getColumnWidthByIndex(Y));
        }
        const V = ((x = r.hoveredCell) == null ? void 0 : x.rowIndex) !== void 0 && r.hoveredCell.rowIndex >= H.rowIndex && r.hoveredCell.rowIndex < H.rowIndex + H.rowspan ? this.theme.colors.rowHoverBackground : I, z = P.y - s;
        this.ctx.fillStyle = V, this.ctx.fillRect(_, z, A, P.height), this.renderCellWithPosition(
          L,
          k,
          H.rowIndex,
          H.columnIndex,
          W,
          _,
          z,
          A,
          P.height,
          r
        ), h.add(O);
      }
      let D = o;
      for (const H of i) {
        const O = T[H];
        if (!O) {
          D += this.layoutManager.getColumnWidthByIndex(H);
          continue;
        }
        if (this.layoutManager.isCellMerged(w, H)) {
          D += this.layoutManager.getColumnWidthByIndex(H);
          continue;
        }
        if (this.layoutManager.getCellMerge(w, H)) {
          D += this.layoutManager.getColumnWidthByIndex(H);
          continue;
        }
        const P = this.layoutManager.getColumnWidthByIndex(H), L = y.data[$(O)];
        this.renderCellWithPosition(
          O,
          y,
          w,
          H,
          L,
          D,
          R,
          P,
          v,
          r
        ), D += P;
      }
    }
    const f = c !== void 0 ? e[c] : void 0;
    c !== void 0 && f && this.renderFixedRowOverlay(
      t,
      f,
      c,
      i,
      o,
      s,
      r
    ), this.ctx.restore();
  }
  renderFixedRowOverlay(t, e, i, o, s, n, r) {
    var g;
    const a = this.layoutManager.getRowOffset(i), l = this.getRenderedRowHeight(i), h = a - n, c = this.canvas.height / this.dpr, d = this.layoutManager.getLeafColumns();
    if (a + l < n || a > n + c)
      return;
    let u = this.theme.colors.rowBackground;
    r.stripeRows && i % 2 === 1 && (u = this.theme.colors.rowAltBackground), e.selected && (u = this.theme.colors.rowSelectedBackground), ((g = r.hoveredCell) == null ? void 0 : g.rowIndex) === i && (u = this.theme.colors.rowHoverBackground);
    let f = s;
    for (const m of o) {
      const x = this.layoutManager.getColumnWidthByIndex(m), w = d[m];
      if (!w) {
        f += x;
        continue;
      }
      if (this.layoutManager.isCellMerged(i, m)) {
        f += x;
        continue;
      }
      const y = this.layoutManager.getCellMerge(i, m);
      if (y && (y.rowIndex !== i || y.columnIndex !== m)) {
        f += x;
        continue;
      }
      this.ctx.fillStyle = u, this.ctx.fillRect(f, h, x, l);
      const C = e.data[$(w)];
      this.renderCellWithPosition(
        w,
        e,
        i,
        m,
        C,
        f,
        h,
        x,
        l,
        r
      ), f += x;
    }
  }
  renderFixedColumnsHeader(t, e, i, o, s, n, r) {
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
        o,
        s,
        m,
        !1,
        g.colIndex
      );
    }
    this.ctx.restore();
  }
  renderHeader(t, e, i, o, s, n) {
    const r = this.layoutManager.getLayoutInfo(), a = r.headerHeight, l = this.layoutManager.getLeafColumns();
    this.ctx.save(), this.ctx.translate(0, o), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, r.totalWidth, a), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, a), this.ctx.lineTo(r.totalWidth, a), this.ctx.stroke();
    for (let h = e; h <= i; h++) {
      const c = l[h];
      if (!c) continue;
      const { x: d, width: u } = this.layoutManager.getCellPosition(0, h);
      this.renderHeaderCell(c, d, 0, u, a, h, s);
    }
    this.ctx.restore();
  }
  renderHeaderCell(t, e, i, o, s, n, r) {
    if (t.key.startsWith("__hidden_placeholder__")) {
      const x = this.hoveredPlaceholderColumnIndex === n;
      this.ctx.fillStyle = x ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, i, o, s), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, o, s);
      return;
    }
    const a = 8, l = 0;
    this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const h = r.find((x) => x.column === t.key), c = (h == null ? void 0 : h.direction) ?? "none", d = c !== "none" ? 20 : 0, u = o - a * 2 - d - l - 0, f = mt(t.title, Math.floor(u / 7)), g = t.align ?? "left";
    let m = e + a + l + 0;
    g === "center" ? m = e + (o - this.ctx.measureText(f).width - d) / 2 : g === "right" && (m = e + o - a - this.ctx.measureText(f).width - d), this.ctx.fillText(f, m, i + s / 2), c !== "none" && this.renderSortIndicator(e + o - a - 10, i + s / 2, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, o, s);
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
    const s = this.theme.colors.indicator.active, n = this.theme.colors.indicator.inactive;
    this.ctx.fillStyle = i ? s : n, this.ctx.beginPath(), this.ctx.moveTo(t - 10 / 2, e - 10 / 2), this.ctx.lineTo(t + 10 / 2, e - 10 / 2), this.ctx.lineTo(t, e), this.ctx.closePath(), this.ctx.fill(), this.ctx.fillRect(t - 1, e, 2, 10 / 2);
  }
  renderRows(t, e, i, o, s, n, r) {
    for (let a = i; a <= o; a++) {
      const l = e[a];
      l && this.renderRow(t, l, a, s, n, r);
    }
  }
  renderRow(t, e, i, o, s, n) {
    var u;
    const r = this.layoutManager.getLayoutInfo(), { x: a, y: l, height: h } = this.layoutManager.getCellPosition(i, 0), c = r.totalWidth;
    let d = this.theme.colors.rowBackground;
    n.stripeRows && i % 2 === 1 && (d = this.theme.colors.rowAltBackground), e.selected && (d = this.theme.colors.rowSelectedBackground), ((u = n.hoveredCell) == null ? void 0 : u.rowIndex) === i && (d = this.theme.colors.rowHoverBackground), this.ctx.fillStyle = d, this.ctx.fillRect(a, l, c, h);
    for (let f = o; f <= s; f++) {
      const g = t[f];
      if (!g) continue;
      const m = e.data[$(g)];
      this.renderCell(g, e, i, f, m, n);
    }
  }
  renderCell(t, e, i, o, s, n) {
    const { x: r, y: a, width: l, height: h } = this.layoutManager.getCellPosition(i, o);
    this.renderCellInternal(t, e, i, o, s, r, a, l, h, n);
  }
  renderCellWithPosition(t, e, i, o, s, n, r, a, l, h) {
    this.renderCellInternal(t, e, i, o, s, n, r, a, l, h);
  }
  renderCellInternal(t, e, i, o, s, n, r, a, l, h) {
    var y, C, v, R;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const I = this.hoveredPlaceholderColumnIndex === o;
      this.ctx.fillStyle = I ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.rowBackground, this.ctx.fillRect(n, r, a, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(n + a, r), this.ctx.lineTo(n + a, r + l), this.ctx.stroke();
      return;
    }
    const d = this.resolveDisabled(t.disabled, e, t), u = this.getCacheMode(t);
    let f;
    if (this.renderCache && u !== !1) {
      const I = this.renderCache.get(e, t, s, u);
      I ? f = I : (f = this.executeRender(t, e, i, s), this.renderCache.set(e, t, s, f, u));
    } else
      f = this.executeRender(t, e, i, s);
    const g = this.isCellSelected(i, o, h.selectedCells), m = ((y = h.hoveredCell) == null ? void 0 : y.rowIndex) === i && ((C = h.hoveredCell) == null ? void 0 : C.columnIndex) === o, x = ((v = h.editingCell) == null ? void 0 : v.rowIndex) === i && ((R = h.editingCell) == null ? void 0 : R.columnIndex) === o;
    if (g && !e.selected ? (this.ctx.fillStyle = this.theme.colors.rowSelectedBackground, this.ctx.fillRect(n, r, a, l)) : m && !e.selected && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(n, r, a, l)), !x) {
      const I = this.expandColumnKey === t.key, M = e.children && e.children.length > 0, E = e.level ?? 0;
      if (I && M) {
        this.renderExpandIcon(n, r, a, l, e.expanded ?? !1, E);
        const T = 20, D = E * 16;
        this.renderCellContent(
          f,
          n + T + D,
          r,
          a - T - D,
          l,
          8,
          t.align,
          i,
          o,
          d,
          t.key
        );
      } else {
        const T = I ? E * 16 : 0;
        this.renderCellContent(
          f,
          n + T,
          r,
          a - T,
          l,
          8,
          t.align,
          i,
          o,
          d,
          t.key
        );
      }
    }
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(n, r, a, l);
    const w = this.currentValidationErrors.get(`${i}-${o}`);
    if (w) {
      const I = Math.max(this.theme.border.width, 2), M = I / 2;
      this.ctx.strokeStyle = w.level === "warning" ? this.theme.colors.tagColors.warning ?? "#faad14" : this.theme.colors.tagColors.error ?? "#ff4d4f", this.ctx.lineWidth = I, this.ctx.strokeRect(n + M, r + M, a - I, l - I);
    } else if (this.currentPendingValidations.has(`${i}-${o}`)) {
      const I = Math.max(this.theme.border.width, 2), M = I / 2, E = Date.now() % 1500 / 1500, T = 0.3 + 0.4 * Math.sin(E * Math.PI * 2);
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
  executeRender(t, e, i, o) {
    let s = {
      text: this.formatValue(o, t, e),
      type: t.type ?? "text"
    };
    if (t.type === "number" && (s.placeholder = t.placeholder ?? this.locale.cell.numberPlaceholder), t.render)
      try {
        const n = t.render(o, e, t, i);
        n && (s = { ...s, ...n });
      } catch (n) {
        console.error(`Error rendering cell at row ${i}, column ${t.key}:`, n), s = {
          text: "[Error]",
          type: "text"
        };
      }
    return s;
  }
  renderCellContent(t, e, i, o, s, n, r, a, l, h, c) {
    try {
      this.renderCellContentInternal(
        t,
        e,
        i,
        o,
        s,
        n,
        r,
        a,
        l,
        h,
        c
      );
    } catch (d) {
      console.error(`Error rendering cell content at row ${a}, col ${l}:`, d), this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText("[Render Error]", e + n, i + s / 2);
    }
  }
  renderWithCellRenderer(t, e, i, o, s, n, r = {}) {
    const a = this.cellRendererRegistry.get(t);
    return a ? a.render(
      this.cellRendererRegistry.createContext({
        ctx: this.ctx,
        theme: this.theme,
        layoutManager: this.layoutManager,
        x: i,
        y: o,
        width: s,
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
        hoveredButtonIndex: r.hoveredButtonIndex,
        hoveredImageIndex: r.hoveredImageIndex,
        buttonOptions: r.buttonOptions,
        imageRuntime: r.imageRuntime
      })
    ) : null;
  }
  renderCellContentInternal(t, e, i, o, s, n, r, a, l, h, c) {
    var d, u, f, g;
    this.ctx.save();
    try {
      const { text: m, type: x, style: w, checkbox: y, radio: C, button: v, input: R, tags: I, link: M } = t, E = c ?? "(unknown)", T = (w == null ? void 0 : w.fontSize) ?? this.theme.font.size, D = (w == null ? void 0 : w.fontFamily) ?? this.theme.font.family, H = (w == null ? void 0 : w.fontWeight) ?? "normal", O = (w == null ? void 0 : w.fontStyle) ?? "normal";
      if (this.ctx.font = `${O} ${H} ${T}px ${D}`, x === B.CHECKBOX && y) {
        this.measureRender("checkbox", E, () => {
          this.renderWithCellRenderer("checkbox", y, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (x === B.RADIO && C) {
        this.measureRender("radio", E, () => {
          this.renderWithCellRenderer("radio", C, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (x === B.BUTTON && v) {
        if (Array.isArray(v)) {
          let P = -1;
          a !== void 0 && l !== void 0 && ((d = this.currentHoveredCell) == null ? void 0 : d.rowIndex) === a && ((u = this.currentHoveredCell) == null ? void 0 : u.columnIndex) === l && (P = this.currentHoveredButtonIndex), this.measureRender("button", E, () => {
            this.renderWithCellRenderer("button", v, e, i, o, s, {
              rowIndex: a,
              colIndex: l,
              isDisabled: h,
              hoveredButtonIndex: P,
              buttonOptions: t.buttonOptions
            });
          });
          return;
        }
        let k;
        if (a !== void 0 && l !== void 0 && this.currentButtonHoverStates) {
          const P = `${a}-${l}`, L = this.currentButtonHoverStates.get(P);
          L && (k = L);
        }
        this.measureRender("button", E, () => {
          this.renderWithCellRenderer("button", v, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            buttonHoverState: k
          });
        });
        return;
      }
      if (x === B.SWITCH && t.switch) {
        let k;
        if (a !== void 0 && l !== void 0 && this.currentSwitchAnimations) {
          const P = `${a}-${l}`, L = this.currentSwitchAnimations.get(P);
          L && (k = L);
        }
        this.measureRender("switch", E, () => {
          this.renderWithCellRenderer("switch", t.switch, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            switchAnimation: k
          });
        });
        return;
      }
      if (x === B.INPUT && R) {
        this.measureRender("input", E, () => {
          this.renderWithCellRenderer("input", R, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (x === B.SELECT && t.select) {
        this.measureRender("select", E, () => {
          this.renderWithCellRenderer("select", t.select, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            multipleSelectSeparator: this.multipleSelectSeparator
          });
        });
        return;
      }
      if (x === B.DATE && t.date) {
        this.measureRender("date", E, () => {
          this.renderWithCellRenderer("date", t.date, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (x === B.TAG && I) {
        this.measureRender("tags", E, () => {
          this.renderWithCellRenderer("tag", I, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (x === B.IMAGE && t.image) {
        const k = a !== void 0 && l !== void 0 && ((f = this.currentHoveredCell) == null ? void 0 : f.rowIndex) === a && ((g = this.currentHoveredCell) == null ? void 0 : g.columnIndex) === l, P = this.imageRenderContext;
        if (P.ctx = this.ctx, P.theme = this.theme, P.locale = this.locale, P.layoutManager = this.layoutManager, P.dpr = this.dpr, P.x = e, P.y = i, P.width = o, P.height = s, P.value = t.image, P.rowIndex = a ?? -1, P.colIndex = l ?? -1, P.isDisabled = h ?? !1, P.isHovered = !!k, P.hoveredImageIndex = this.currentHoveredImageIndex, this.performanceEnabled) {
          const L = performance.now();
          this.imageRenderer.render(P);
          const W = performance.now() - L;
          this.recordRenderTiming("image", E, W);
        } else
          this.imageRenderer.render(P);
        return;
      }
      if (x === B.PROGRESS && t.progress) {
        const P = a !== void 0 && l !== void 0 && this.currentProgressDragState && this.currentProgressDragState.cell.rowIndex === a && this.currentProgressDragState.cell.columnIndex === l ? { ...t.progress, value: this.currentProgressDragState.displayValue } : t.progress;
        this.measureRender("progress", E, () => {
          this.renderWithCellRenderer("progress", P, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (x === B.RATING && t.rating) {
        let k;
        this.measureRender("rating", E, () => {
          var P;
          k = (P = this.renderWithCellRenderer(
            "rating",
            t.rating,
            e,
            i,
            o,
            s,
            {
              rowIndex: a,
              colIndex: l,
              isDisabled: h
            }
          )) == null ? void 0 : P.starBounds;
        }), k && (t.starBounds = k);
        return;
      }
      if (x === B.COLOR && t.color) {
        this.measureRender("color", E, () => {
          this.renderWithCellRenderer("color", t.color, e, i, o, s, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (t.type === "custom" && t.jsxRender) {
        this.measureRender("jsx", E, () => {
          this.ctx.save();
          try {
            const k = t.jsxRender(), P = new Ti(this.ctx), L = new Mi(P);
            new Di(this.ctx, L, this.theme).render(k, e, i, { width: o, height: s });
          } catch (k) {
            console.error(`[Renderer] JSX render error at row ${a}, col ${l}:`, k);
          } finally {
            this.ctx.restore();
          }
        });
        return;
      }
      if (t.type === "custom" && t.customRender) {
        this.measureRender("custom", E, () => {
          try {
            t.customRender({
              ctx: this.ctx,
              x: e,
              y: i,
              width: o,
              height: s,
              padding: n,
              theme: this.theme,
              dpr: this.dpr
            });
          } catch (k) {
            console.error(`[Renderer] customRender error at row ${a}, col ${l}:`, k);
          }
        });
        return;
      }
      this.measureRender("text", E, () => {
        let k = m, P = (w == null ? void 0 : w.color) ?? this.theme.colors.cellText;
        if (x === B.LINK && M && (k = M.text || M.link, P = (w == null ? void 0 : w.color) ?? this.theme.colors.linkColor), x === B.NUMBER && !k && (k = t.placeholder ?? this.locale.cell.numberPlaceholder, P = this.theme.colors.placeholderText), !k) return;
        this.ctx.fillStyle = P;
        const L = (w == null ? void 0 : w.horizontalAlign) ?? r ?? "left", W = (w == null ? void 0 : w.verticalAlign) ?? "middle", A = this.theme.font.size, _ = A * 1.5, F = o - n * 2, V = this.calculateMaxRows(s, _, n);
        if (V > 1) {
          const z = this.wrapTextToLines(k, F, V), G = z.length * _;
          let Y;
          W === "top" ? Y = i + n : W === "bottom" ? Y = i + s - n - G : Y = i + (s - G) / 2, this.ctx.textBaseline = "top";
          for (let U = 0; U < z.length; U++) {
            const X = z[U];
            let j;
            switch (L) {
              case "center":
                j = e + (o - this.ctx.measureText(X).width) / 2;
                break;
              case "right":
                j = e + o - n - this.ctx.measureText(X).width;
                break;
              default:
                j = e + n;
            }
            this.ctx.fillText(X, j, Y + U * _);
          }
        } else {
          const z = "...";
          if (this.ctx.measureText(k).width > F) {
            let X = k;
            for (; X.length > 0 && this.ctx.measureText(X + z).width > F; )
              X = X.slice(0, -1);
            k = X + z;
          }
          let Y;
          switch (L) {
            case "center":
              Y = e + (o - this.ctx.measureText(k).width) / 2;
              break;
            case "right":
              Y = e + o - n - this.ctx.measureText(k).width;
              break;
            default:
              Y = e + n;
          }
          let U;
          switch (W) {
            case "top":
              this.ctx.textBaseline = "top", U = i + n;
              break;
            case "bottom":
              this.ctx.textBaseline = "bottom", U = i + s - n;
              break;
            default:
              this.ctx.textBaseline = "middle", U = i + s / 2;
          }
          if (x === B.TAG)
            this.renderTag(k, Y, U, A);
          else if (this.ctx.fillText(k, Y, U), x === B.LINK) {
            const X = this.ctx.measureText(k).width;
            this.ctx.strokeStyle = P, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(Y, U + A / 2 + 2), this.ctx.lineTo(Y + X, U + A / 2 + 2), this.ctx.stroke();
          }
        }
      });
    } finally {
      this.ctx.restore();
    }
  }
  renderExpandIcon(t, e, i, o, s, n) {
    const l = n * 16, h = t + 8 + l + 8 / 2, c = e + o / 2;
    this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.beginPath(), s ? (this.ctx.moveTo(h - 8 / 2, c - 8 / 2), this.ctx.lineTo(h + 8 / 2, c - 8 / 2), this.ctx.lineTo(h, c + 8 / 2)) : (this.ctx.moveTo(h - 8 / 2, c - 8 / 2), this.ctx.lineTo(h + 8 / 2, c), this.ctx.lineTo(h - 8 / 2, c + 8 / 2)), this.ctx.closePath(), this.ctx.fill();
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
    const o = this.ctx.measureText(t).width;
    return this.textWidthCache.set(t, o), o;
  }
  renderColorDropdown(t) {
    this.overlayRenderer.renderColorDropdown(t);
  }
  /**
   * 检查行是否在懒加载范围内
   */
  isInLazyLoadRange(t, e) {
    if (!this.currentVisibleRange) return !0;
    const { startRow: i, endRow: o } = this.currentVisibleRange, s = this.rowHeight || this.theme.row.height, n = Math.ceil(e / s), r = Math.max(0, i - n), a = o + n, l = this.currentRows[t];
    if (!l)
      return t >= r && t <= a;
    if (this.layoutManager.isRowInPinnedBand(l))
      return !0;
    const h = this.layoutManager.getBodyRowIndexByRef(l);
    return h >= 0 ? h >= r && h <= a : t >= r && t <= a;
  }
  loadImage(t, e) {
    this.isDestroyed || this.imageLoadQueue.request(t, e, (i) => {
      var o;
      this.isDestroyed || i && (this.markDirty(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr), (o = this.onImageLoaded) == null || o.call(this));
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
      this.frameCount++, this.lastFrameStats = /* @__PURE__ */ new Map();
      for (const [t, e] of this.currentFrameStats)
        this.lastFrameStats.set(t, new Map(e));
      for (const [t, e] of this.currentFrameStats) {
        let i = this.performanceStats.get(t);
        i || (i = /* @__PURE__ */ new Map(), this.performanceStats.set(t, i));
        for (const [o, s] of e) {
          const n = i.get(o) || { totalTime: 0, count: 0, maxTime: 0 };
          n.totalTime += s.totalTime, n.count += s.count;
          const r = s.count > 0 ? s.totalTime / s.count : 0;
          n.maxTime = Math.max(n.maxTime, r), i.set(o, n);
        }
      }
    }
  }
  /**
   * 测量渲染类型的时间
   */
  measureRender(t, e, i) {
    if (!this.performanceEnabled) {
      i();
      return;
    }
    const o = performance.now();
    i();
    const s = performance.now() - o;
    this.recordRenderTiming(t, e, s);
  }
  /**
   * 记录单次渲染耗时（用于内联性能采样的场景，如 image 热路径）
   */
  recordRenderTiming(t, e, i) {
    let o = this.currentFrameStats.get(t);
    o || (o = /* @__PURE__ */ new Map(), this.currentFrameStats.set(t, o));
    const s = o.get(e) || { totalTime: 0, count: 0 };
    s.totalTime += i, s.count++, o.set(e, s);
  }
  /**
   * 获取性能统计（按类型聚合，丢失列粒度，仅供向后兼容）
   */
  getPerformanceStats() {
    const t = /* @__PURE__ */ new Map();
    for (const [e, i] of this.performanceStats) {
      let o = 0, s = 0, n = 0;
      for (const r of i.values())
        o += r.totalTime, s += r.count, n = Math.max(n, r.maxTime);
      t.set(e, {
        totalTime: o,
        count: s,
        maxTime: n,
        avgTime: s > 0 ? o / s : 0
      });
    }
    return t;
  }
  /**
   * 输出性能报告到控制台
   */
  logPerformanceReport() {
    if (!this.performanceEnabled) return;
    const t = [];
    for (const [e, i] of this.performanceStats) {
      const o = Array.from(i.entries()).map(([s, n]) => ({
        columnKey: s,
        ...n,
        avgTime: n.count > 0 ? n.totalTime / n.count : 0
      })).sort((s, n) => n.avgTime - s.avgTime);
      for (const s of o)
        t.push({
          Type: e,
          Key: s.columnKey,
          Calls: s.count,
          "Avg(ms)": s.avgTime.toFixed(3),
          "Max(ms)": s.maxTime.toFixed(3),
          "Total(ms)": s.totalTime.toFixed(1)
        });
    }
    console.group(`🎯 Renderer Performance (Frame ${this.frameCount})`), console.table(t), console.groupEnd();
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
      const s = Array.from(this.lastFrameStats.entries()).map(([r, a]) => {
        const l = Array.from(a.entries()).map(([d, u]) => ({
          columnKey: d,
          count: u.count,
          totalTime: u.totalTime,
          avgTime: u.count > 0 ? u.totalTime / u.count : 0
        })).sort((d, u) => u.totalTime - d.totalTime), h = l.reduce((d, u) => d + u.totalTime, 0), c = l.reduce((d, u) => d + u.count, 0);
        return { type: r, totalTime: h, totalCount: c, keyEntries: l };
      }).sort((r, a) => a.totalTime - r.totalTime);
      for (const r of s) {
        t.push(`[${r.type}]`);
        for (const l of r.keyEntries)
          t.push(
            `  ${l.columnKey.padEnd(20)} | calls: ${l.count.toString().padStart(4)} | avg: ${l.avgTime.toFixed(3).padStart(7)}ms | total: ${l.totalTime.toFixed(2).padStart(6)}ms`
          );
        const a = r.totalCount > 0 ? r.totalTime / r.totalCount : 0;
        t.push(
          `  ${"total".padEnd(20)} | calls: ${r.totalCount.toString().padStart(4)} | avg: ${a.toFixed(3).padStart(7)}ms | total: ${r.totalTime.toFixed(2).padStart(6)}ms`
        );
      }
      const n = s.reduce((r, a) => r + a.totalTime, 0);
      t.push(""), t.push(`Last frame total render time: ${n.toFixed(2)}ms`);
    }
    t.push(""), t.push("=== TOTAL STATS (all frames average) ==="), t.push("-".repeat(70));
    const i = Array.from(this.performanceStats.entries()).map(([s, n]) => {
      const r = Array.from(n.entries()).map(([c, d]) => ({
        columnKey: c,
        count: d.count,
        totalTime: d.totalTime,
        maxTime: d.maxTime,
        avgTime: d.count > 0 ? d.totalTime / d.count : 0,
        callsPerFrame: Math.round(d.count / e),
        avgFrameTime: d.totalTime / e
      })).sort((c, d) => d.avgFrameTime - c.avgFrameTime), a = r.reduce((c, d) => c + d.count, 0), l = r.reduce((c, d) => c + d.totalTime, 0), h = r.reduce((c, d) => Math.max(c, d.maxTime), 0);
      return { type: s, totalCount: a, totalTime: l, maxTime: h, keyEntries: r };
    }).sort((s, n) => n.totalTime - s.totalTime);
    for (const s of i) {
      t.push(`[${s.type}]`);
      for (const l of s.keyEntries)
        t.push(
          `  ${l.columnKey.padEnd(20)} | avg calls/frame: ${l.callsPerFrame.toString().padStart(4)} | avg: ${l.avgTime.toFixed(3).padStart(7)}ms | max: ${l.maxTime.toFixed(3).padStart(7)}ms | frameTotal: ${l.avgFrameTime.toFixed(2).padStart(6)}ms`
        );
      const n = s.totalCount > 0 ? s.totalTime / s.totalCount : 0, r = s.totalTime / e, a = Math.round(s.totalCount / e);
      t.push(
        `  ${"total".padEnd(20)} | avg calls/frame: ${a.toString().padStart(4)} | avg: ${n.toFixed(3).padStart(7)}ms | max: ${s.maxTime.toFixed(3).padStart(7)}ms | frameTotal: ${r.toFixed(2).padStart(6)}ms`
      );
    }
    const o = i.reduce((s, n) => s + n.totalTime / e, 0);
    return t.push(""), t.push(`Average frame render time: ${o.toFixed(2)}ms`), t.join(`
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
  renderTag(t, e, i, o) {
    const r = this.ctx.measureText(t).width + 4 * 2, a = o + 4 * 2, l = this.theme.colors.tagColors[t.toLowerCase()] ?? this.theme.colors.tagColors.default;
    this.ctx.fillStyle = l, this.ctx.beginPath();
    const h = 4, c = e - 4, d = i - o / 2 - 4;
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
    return i.some((o) => {
      const s = Math.min(o.start.rowIndex, o.end.rowIndex), n = Math.max(o.start.rowIndex, o.end.rowIndex), r = Math.min(o.start.columnIndex, o.end.columnIndex), a = Math.max(o.start.columnIndex, o.end.columnIndex);
      return t >= s && t <= n && e >= r && e <= a;
    });
  }
  renderCenterSelections(t, e, i, o) {
    const s = this.layoutManager.getLeafColumns();
    for (const n of t) {
      const r = Math.min(n.start.rowIndex, n.end.rowIndex), a = Math.max(n.start.rowIndex, n.end.rowIndex), l = Math.min(n.start.columnIndex, n.end.columnIndex), h = Math.max(n.start.columnIndex, n.end.columnIndex), c = this.layoutManager.getCellMerge(r, l);
      let d = r, u = a, f = l, g = h;
      c && (d = c.rowIndex, u = c.rowIndex + c.rowspan - 1, f = c.columnIndex, g = c.columnIndex + c.colspan - 1);
      const m = Math.max(f, Math.min(...o)), x = Math.min(g, Math.max(...o));
      if (m > x) continue;
      const w = s[m], y = s[x];
      if (!w || !y || w.fixed || y.fixed) continue;
      const C = this.layoutManager.getRowViewportY(d, i);
      if (C === null) continue;
      const v = this.layoutManager.getRowOffset(u) + this.layoutManager.getRowHeightByIndex(u) - this.layoutManager.getRowOffset(d), R = this.layoutManager.getCellPosition(d, m), I = this.layoutManager.getCellPosition(u, x), M = I.x + I.width - R.x, E = R.x - e;
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]), this.ctx.strokeRect(E, C, M, v);
    }
  }
  renderFixedSelections(t, e, i, o) {
    for (const s of t) {
      const n = Math.min(s.start.rowIndex, s.end.rowIndex), r = Math.max(s.start.rowIndex, s.end.rowIndex), a = Math.min(s.start.columnIndex, s.end.columnIndex), l = Math.max(s.start.columnIndex, s.end.columnIndex), h = this.layoutManager.getCellMerge(n, a);
      let c = n, d = r, u = a, f = l;
      h && (c = h.rowIndex, d = h.rowIndex + h.rowspan - 1, u = h.columnIndex, f = h.columnIndex + h.colspan - 1);
      const g = this.layoutManager.getRowViewportY(c, e);
      if (g === null) continue;
      const m = this.layoutManager.getRowOffset(d) + this.layoutManager.getRowHeightByIndex(d) - this.layoutManager.getRowOffset(c);
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]);
      const x = i.filter(
        (y) => y >= u && y <= f
      );
      if (x.length > 0) {
        const y = x[0], C = x[x.length - 1], v = this.layoutManager.getCellPosition(c, y), R = this.layoutManager.getCellPosition(d, C), I = R.x + R.width - v.x;
        this.ctx.strokeRect(v.x, g, I, m);
      }
      const w = o.filter(
        (y) => y >= u && y <= f
      );
      if (w.length > 0) {
        const y = w[0], C = w[w.length - 1], v = this.layoutManager.getCellPosition(c, y), R = this.layoutManager.getCellPosition(d, C), I = R.x + R.width - v.x;
        this.ctx.strokeRect(v.x, g, I, m);
      }
    }
  }
  renderLoadingOverlay() {
    const t = this.canvas.width / this.dpr, e = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)", this.ctx.fillRect(0, 0, t, e), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(this.locale.loadingText, t / 2, e / 2), this.ctx.restore();
  }
  renderEmptyState(t, e = [], i = [], o, s = 0) {
    const n = this.canvas.width / this.dpr, r = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, n, r);
    const l = this.layoutManager.getLayoutInfo().headerHeight, h = this.layoutManager.getLeafColumns();
    if (h.length > 0) {
      const c = this.layoutManager.getFixedColumnsInfo(h), d = c.leftFixed.columns.length > 0, u = c.rightFixed.columns.length > 0, f = d ? c.leftFixed.width : 0, g = u ? c.rightFixed.width : 0;
      this.ctx.save(), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, n, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, l), this.ctx.lineTo(n, l), this.ctx.stroke();
      const m = this.layoutManager.getVisibleHeaderCells();
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(f, 0, n - f - g, l), this.ctx.clip();
      for (const x of m) {
        if (x.column.fixed === "left" || x.column.fixed === "right")
          continue;
        const w = x.x - s;
        this.renderEmptyStateHeaderCell(
          x,
          w,
          e,
          i,
          o
        );
      }
      if (this.ctx.restore(), d)
        for (const x of m)
          x.column.fixed === "left" && this.renderEmptyStateHeaderCell(
            x,
            x.x,
            e,
            i,
            o
          );
      if (u)
        for (const x of m) {
          if (x.column.fixed !== "right") continue;
          const y = n - g - (this.layoutManager.getLayoutInfo().totalWidth - g), C = x.x + y;
          this.renderEmptyStateHeaderCell(
            x,
            C,
            e,
            i,
            o
          );
        }
      this.ctx.restore();
    }
    this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(t, n / 2, l + (r - l) / 2), this.ctx.restore();
  }
  renderEmptyStateHeaderCell(t, e, i, o, s) {
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, t.y, t.width, t.height), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const n = i.find((v) => v.column === t.column.key), r = (n == null ? void 0 : n.direction) ?? "none", a = t.column.sortable !== !1, l = t.column.key === s, h = t.isLeaf && a && (r !== "none" || l), c = h ? 20 : 0, d = o.some((v) => v.column === t.column.key), u = t.isLeaf && t.column.filterable, f = u ? 20 : 0, g = 8, m = t.width - g * 2 - c - f, x = mt(t.column.title, Math.floor(m / 7)), w = t.column.align ?? "center";
    let y = e + g;
    w === "center" ? y = e + (t.width - this.ctx.measureText(x).width - c - f) / 2 : w === "right" && (y = e + t.width - g - this.ctx.measureText(x).width - c - f);
    const C = t.y + t.height / 2;
    if (this.ctx.fillText(x, y, C), t.isLeaf)
      if (u) {
        const v = e + t.width - g - 10;
        h && this.renderSortIndicator(
          v - 16,
          C,
          r === "none" ? "hover" : r
        ), this.renderFilterIndicator(v, C, d);
      } else h && this.renderSortIndicator(
        e + t.width - g - 10,
        C,
        r === "none" ? "hover" : r
      );
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, t.y, t.width, t.height);
  }
  isColumnHovered(t, e) {
    const o = this.layoutManager.getLeafColumns()[e];
    return o ? t.key === o.key : !1;
  }
  renderFixedColumnsShadow(t, e) {
    const i = this.canvas.width / this.dpr, o = this.canvas.height / this.dpr, s = 10;
    this.ctx.save();
    const n = this.ctx.createLinearGradient(
      e === "left" ? t : i - t - s,
      0,
      e === "left" ? t + s : i - t,
      0
    );
    e === "left" ? (n.addColorStop(0, "rgba(0, 0, 0, 0.15)"), n.addColorStop(1, "rgba(0, 0, 0, 0)")) : (n.addColorStop(0, "rgba(0, 0, 0, 0)"), n.addColorStop(1, "rgba(0, 0, 0, 0.15)")), this.ctx.fillStyle = n, this.ctx.fillRect(
      e === "left" ? t : i - t - s,
      0,
      s,
      o
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
  renderScrollbars(t, e, i, o, s) {
    this.overlayRenderer.renderScrollbars(
      t,
      e,
      i,
      o,
      s
    );
  }
  renderWatermark() {
    this.overlayRenderer.renderWatermark();
  }
  getScrollbarBounds(t, e, i, o) {
    return this.overlayRenderer.getScrollbarBounds(
      t,
      e,
      i,
      o
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
  renderColumnReorderIndicator(t, e, i, o) {
    const n = this.layoutManager.getLayoutInfo().headerHeight, r = this.canvas.height / this.dpr, a = this.layoutManager.getColumnByKey(t.dragColumnKey), l = a ? this.layoutManager.getColumnWidth(a) : 100, h = t.currentX - l / 2;
    this.ctx.save(), this.ctx.globalAlpha = 0.7, this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(h, 0, l, r), this.ctx.strokeStyle = this.theme.colors.button.primaryBg, this.ctx.lineWidth = 2, this.ctx.setLineDash([5, 5]), this.ctx.strokeRect(h, 0, l, r), this.ctx.setLineDash([]), t.isParentColumn && a && a.children && a.children.length > 0 ? (this.renderParentColumnGhost(a, h, n), this.renderParentColumnRowsGhost(a, h, n, e, i, o)) : a && (this.renderLeafColumnGhost(a, h, 0, n), this.renderLeafColumnRowsGhost(a, h, n, e, i, o)), this.ctx.restore();
  }
  renderParentColumnGhost(t, e, i) {
    const o = t.depth ?? 0, s = this.theme.row.headerHeight, n = o * s, r = s, a = this.layoutManager.getColumnWidth(t);
    this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.fillRect(e, n, a, r), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, n, a, r), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const l = t.title, h = this.ctx.measureText(l).width, c = e + (a - h) / 2;
    this.ctx.fillText(l, c, n + r / 2), this.renderChildColumnsGhost(t, e, o + 1, i);
  }
  renderChildColumnsGhost(t, e, i, o) {
    if (!t.children || t.children.length === 0) return;
    const s = this.theme.row.headerHeight;
    let n = e;
    for (const r of t.children) {
      const a = this.layoutManager.getColumnWidth(r);
      if (r.children && r.children.length > 0) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        const l = i * s, h = s;
        this.ctx.fillRect(n, l, a, h), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(n, l, a, h), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const c = r.title, d = this.ctx.measureText(c).width, u = n + (a - d) / 2;
        this.ctx.fillText(c, u, l + h / 2), this.renderChildColumnsGhost(r, n, i + 1, o);
      } else
        this.renderLeafColumnGhost(r, n, i, o);
      n += a;
    }
  }
  renderLeafColumnGhost(t, e, i, o) {
    const s = this.theme.row.headerHeight, n = this.layoutManager.getColumnWidth(t), r = i * s, a = o - r;
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
  renderLeafColumnRowsGhost(t, e, i, o, s, n) {
    const r = this.layoutManager.getColumnWidth(t), { startRow: a, endRow: l } = s;
    for (let h = a; h <= l; h++) {
      const c = o[h];
      if (!c) continue;
      const d = this.layoutManager.getRowOffset(h), u = this.layoutManager.getRowHeightByIndex(h), f = d - n;
      if (f + u < i || f > this.canvas.height / this.dpr)
        continue;
      this.ctx.fillStyle = this.theme.colors.rowBackground, this.ctx.fillRect(e, f, r, u), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(e, f + u), this.ctx.lineTo(e + r, f + u), this.ctx.stroke();
      const g = c.data[$(t)];
      this.renderGhostCellValue(t, c, h, g, e, f, r, u);
    }
  }
  renderParentColumnRowsGhost(t, e, i, o, s, n) {
    if (!t.children || t.children.length === 0) return;
    let r = e;
    for (const a of t.children) {
      const l = this.layoutManager.getColumnWidth(a);
      a.children && a.children.length > 0 ? this.renderParentColumnRowsGhost(
        a,
        r,
        i,
        o,
        s,
        n
      ) : this.renderLeafColumnRowsGhost(
        a,
        r,
        i,
        o,
        s,
        n
      ), r += l;
    }
  }
  renderGhostCellValue(t, e, i, o, s, n, r, a) {
    let h = {
      text: this.formatValue(o, t, e),
      type: t.type ?? "text"
    };
    if (t.render)
      try {
        const d = t.render(o, e, t, i);
        d && (h = { ...h, ...d });
      } catch (d) {
        console.error("Error rendering ghost cell:", d), h = { text: "[Error]", type: "text" };
      }
    const c = bt(t.disabled, e, t);
    this.renderCellContent(
      h,
      s,
      n,
      r,
      a,
      8,
      t.align,
      i,
      void 0,
      c,
      t.key
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
b(xt, "SHARED_PLACEHOLDER_COLUMN", {
  key: "image",
  title: "image",
  type: "image"
}), b(xt, "SHARED_PLACEHOLDER_ROW", { id: "", data: {} });
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
    b(this, "layoutManager");
    b(this, "scrollState");
    b(this, "canvas");
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
    const { width: e, height: i, gap: o = pt.DEFAULT_GAP } = t, { width: s, height: n } = this.getLogicalCanvasSize(), r = this.calculateX(t, e, s), { anchorY: a, cellViewportY: l } = this.calculateAnchorY(t), { y: h, showAbove: c } = this.calculateInitialY(a, i, o, n);
    return { x: r, y: h, showAbove: c, anchorViewportY: a, cellViewportY: l };
  }
  /**
   * Update Y position during scroll (preserves or toggles showAbove)
   */
  updateY(t, e, i, o = pt.DEFAULT_GAP) {
    const { height: s } = this.getLogicalCanvasSize(), { anchorY: n, cellViewportY: r } = this.calculateAnchorY(t);
    let a;
    e ? a = n - o - i : a = n + o;
    let l = e;
    return e && a < 0 ? n + o + i <= s && (a = n + o, l = !1) : !e && a + i > s && n - o - i >= 0 && (a = n - o - i, l = !0), { y: a, showAbove: l, cellViewportY: r };
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
    let o;
    t.anchorType === "header" ? o = this.getHeaderCellX(t.columnKey, t.column) : t.anchorType === "button" && t.buttonRelativeX !== void 0 ? o = this.getCellViewportX(t) + t.buttonRelativeX : o = this.getCellViewportX(t);
    const s = pt.EDGE_PADDING, n = t.column ?? this.getColumn(t), r = (n == null ? void 0 : n.width) ?? 100, l = o + r > s && o < i - s;
    let h = o;
    return l && (e <= i - s * 2 ? (h + e > i - s && (h = i - e - s), h < s && (h = s)) : h = (i - e) / 2), h;
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
      let o = 0;
      for (const s of i) {
        if (s.key === t)
          return s.fixed ? o : o - this.scrollState.scrollLeft;
        o += s.width ?? 100;
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
  calculateInitialY(t, e, i, o) {
    let s = t + i, n = !1;
    if (s + e > o) {
      const r = t - i - e;
      r >= 0 && (s = r, n = !0);
    }
    return { y: s, showAbove: n };
  }
  /**
   * Check if cell is still visible in viewport
   */
  isCellInViewport(t) {
    const e = this.getCellPosition(t), i = this.getCellViewportY(t), o = this.layoutManager.getLayoutInfo().headerHeight, { height: s } = this.getLogicalCanvasSize();
    return i >= o && i + e.height <= s;
  }
};
// Default configuration
b(pt, "DEFAULT_GAP", 4), b(pt, "EDGE_PADDING", 8);
let At = pt;
class ft {
  constructor(t, e) {
    b(this, "context");
    b(this, "eventEmitter");
    b(this, "dropdownCalculator");
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
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.rows[t.rowIndex];
    return !i || !o ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: o,
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
  calculateDropdownPosition(t, e, i, o = "cell", s) {
    return this.dropdownCalculator.calculate({
      cell: t,
      column: (s == null ? void 0 : s.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
      width: e,
      height: i,
      anchorType: o,
      gap: s == null ? void 0 : s.gap,
      buttonRelativeX: s == null ? void 0 : s.buttonRelativeX,
      buttonY: s == null ? void 0 : s.buttonY,
      buttonHeight: s == null ? void 0 : s.buttonHeight,
      columnKey: s == null ? void 0 : s.columnKey,
      customAnchorY: s == null ? void 0 : s.customAnchorY
    });
  }
  /**
   * Update dropdown Y position during scroll
   */
  updateDropdownY(t, e, i, o) {
    return this.dropdownCalculator.updateY(
      {
        cell: t,
        column: (o == null ? void 0 : o.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
        anchorType: (o == null ? void 0 : o.anchorType) ?? "cell",
        buttonY: o == null ? void 0 : o.buttonY,
        buttonHeight: o == null ? void 0 : o.buttonHeight
      },
      e,
      i,
      o == null ? void 0 : o.gap
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
      const { minRow: o, maxRow: s, minCol: n, maxCol: r } = this.getNormalizedRange(i);
      return t.rowIndex >= o && t.rowIndex <= s && t.columnIndex >= n && t.columnIndex <= r;
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
    const i = this.layoutManager.getLeafColumns(), o = this.state.selectedCells[0].start, s = tt(o.rowIndex + t, 0, this.rows.length - 1), n = tt(o.columnIndex + e, 0, i.length - 1), r = { rowIndex: s, columnIndex: n };
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
    (e !== this.scrollState.scrollTop || i !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = e, this.eventEmitter.emit(S.SCROLL, i, e));
  }
  /**
   * Check if a cell is selected
   */
  isCellSelected(t) {
    return this.state.selectedCells.some((e) => {
      const { minRow: i, maxRow: o, minCol: s, maxCol: n } = this.getNormalizedRange(e);
      return t.rowIndex >= i && t.rowIndex <= o && t.columnIndex >= s && t.columnIndex <= n;
    });
  }
  /**
   * Get selected cells as flat array
   */
  getSelectedCells() {
    const t = [];
    for (const e of this.state.selectedCells) {
      const { minRow: i, maxRow: o, minCol: s, maxCol: n } = this.getNormalizedRange(e);
      for (let r = i; r <= o; r++)
        for (let a = s; a <= n; a++)
          t.push({ rowIndex: r, columnIndex: a });
    }
    return t;
  }
}
class Li extends ft {
  constructor(e, i, o, s) {
    super(e, i);
    b(this, "selectionHandler");
    b(this, "editingConfig");
    this.selectionHandler = o, this.editingConfig = s;
  }
  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e) {
    e.preventDefault();
    const i = this.layoutManager.getLeafColumns();
    let o;
    if (this.state.selectedCells.length > 0) {
      const a = this.state.selectedCells[0];
      o = e.key === "ArrowUp" || e.key === "ArrowLeft" ? a.start : a.end;
    } else
      o = { rowIndex: 0, columnIndex: 0 };
    let s = o.rowIndex, n = o.columnIndex;
    switch (e.key) {
      case "ArrowUp":
        s = Math.max(0, s - 1);
        break;
      case "ArrowDown":
        s = Math.min(this.rows.length - 1, s + 1);
        break;
      case "ArrowLeft":
        n = Math.max(0, n - 1);
        break;
      case "ArrowRight":
        n = Math.min(i.length - 1, n + 1);
        break;
    }
    const r = { rowIndex: s, columnIndex: n };
    this.selectionHandler.handleSingleSelection(r), this.scrollToCell(r);
  }
  /**
   * Handle Enter key
   * @returns Editing configuration if editing should start, null otherwise
   */
  handleEnterKey(e) {
    var o;
    if (this.state.selectedCells.length === 0) return null;
    e.preventDefault(), e.stopPropagation();
    const i = this.state.selectedCells[0].start;
    if (this.editingConfig.enabled !== !1) {
      const n = this.layoutManager.getLeafColumns()[i.columnIndex], r = this.rows[i.rowIndex];
      if (n && r) {
        const a = ut(n, r, i.rowIndex), l = ["checkbox", "radio", "button", "switch"];
        return a.type && l.includes(a.type) ? a.type === B.SWITCH && a.switch ? (this.editorRegistry.getStrategy(n).canEdit(i, r, n) && this.eventEmitter.emit(
          S.SWITCH_CHANGE,
          this.getCellInfo(i),
          !a.switch.checked
        ), null) : (this.toggleRowExpand(i.rowIndex), null) : !this.editorRegistry.getStrategy(n).canEdit(i, r, n) || (o = a.input) != null && o.readonly ? null : this.getEditingStartConfig(i, n, r, a);
      }
    } else
      this.toggleRowExpand(i.rowIndex);
    return null;
  }
  /**
   * Get editing start configuration for a cell
   */
  getEditingStartConfig(e, i, o, s) {
    const n = o.data[$(i)];
    if (i.editRender)
      try {
        const r = i.editRender(n, o, e.rowIndex);
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
    return s.type === B.SELECT && s.select ? { type: "select", config: s.select } : s.type === B.TAG && s.tags && s.tags.editable ? { type: "tags", config: s.tags } : s.type === B.DATE && s.date ? { type: "date", config: s.date } : s.type === B.IMAGE && s.image ? { type: "image", config: s.image } : { type: "input", config: s.input };
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
    const i = this.layoutManager.getScrollOffsetForRow(e.rowIndex), o = this.layoutManager.getScrollOffsetForColumn(e.columnIndex);
    (i !== this.scrollState.scrollTop || o !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = o, this.scrollState.scrollTop = i, this.eventEmitter.emit(S.SCROLL, o, i));
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
  constructor(e, i, o) {
    super(e, i);
    b(this, "editingConfig");
    this.editingConfig = o;
  }
  /**
   * Validate if a cell can be edited
   */
  validateCellForEditing(e) {
    const o = this.layoutManager.getLeafColumns()[e.columnIndex];
    if (!o) return null;
    const s = this.rows[e.rowIndex];
    return !s || !this.editorRegistry.getStrategy(o).canEdit(e, s, o) ? null : { column: o, row: s };
  }
  /**
   * Get edit configuration for a cell
   * Priority: editRender > render result > null (default logic)
   */
  getEditConfig(e, i, o) {
    const s = i.data[$(e)];
    if (e.editRender)
      try {
        const n = e.editRender(s, i, o);
        if (n) return n;
      } catch (n) {
        console.error("Error in editRender:", n);
      }
    if (e.render)
      try {
        const n = e.render(s, i, e, o);
        if (n && n.type && n.type !== B.CUSTOM && n.type !== B.BUTTON && n.type !== B.IMAGE && n.type !== B.PROGRESS && n.type !== B.LINK)
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
    const o = this.validateCellForEditing(e);
    if (!o || !i) return !1;
    this.state.tooltip = null;
    const s = gt.DROPDOWN_ITEM_HEIGHT, n = gt.DROPDOWN_MAX_VISIBLE, r = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * s, h = o.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
      column: o.column
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
    const o = this.validateCellForEditing(e);
    if (!o || !i) return !1;
    this.state.tooltip = null;
    const s = gt.DROPDOWN_ITEM_HEIGHT, n = gt.DROPDOWN_MAX_VISIBLE, r = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * s, h = o.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
      column: o.column
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
    const o = this.validateCellForEditing(e);
    if (!o || !i) return !1;
    this.state.tooltip = null;
    const s = Math.max(o.column.width ?? 100, 280), n = 68 + 6 * 28 + 16, r = this.calculateDropdownPosition(e, s, n, "cell", {
      column: o.column
    });
    let a = null;
    i.value && (i.value instanceof Date ? a = i.value : typeof i.value == "string" && (a = new Date(i.value)));
    const l = (a == null ? void 0 : a.getFullYear()) ?? (/* @__PURE__ */ new Date()).getFullYear(), h = (a == null ? void 0 : a.getMonth()) ?? (/* @__PURE__ */ new Date()).getMonth();
    return this.state.dateDropdown = {
      cell: e,
      config: i,
      x: r.x,
      y: r.y,
      width: s,
      currentYear: l,
      currentMonth: h,
      selectedDate: a,
      hoveredDate: null,
      showAbove: r.showAbove
    }, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
  }
  /**
   * Start image editing
   */
  startImageEditing(e, i) {
    const o = this.validateCellForEditing(e);
    if (!o || !i) return !1;
    this.state.tooltip = null;
    const s = 64, n = 8, r = 8, a = 4, l = 60, h = s + r, c = a * s + (a - 1) * r + n * 2 + 4 + 4, d = 3, u = d * h + n * 2 - r, f = l + u, g = this.calculateDropdownPosition(e, c, f, "cell", {
      column: o.column
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
    const o = this.validateCellForEditing(e);
    if (!o || !i) return !1;
    this.state.tooltip = null;
    const s = i.presetColors || this.getDefaultPresetColors(), n = 8, r = Math.ceil(s.length / n), a = 24, l = 4, h = 8, c = Math.max(
      o.column.width ?? 100,
      n * (a + l) + h * 2 - l
    ), d = r * (a + l) + h * 2 - l, u = this.calculateDropdownPosition(e, c, d, "cell", {
      column: o.column
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
b(gt, "DROPDOWN_ITEM_HEIGHT", 32), b(gt, "DROPDOWN_MAX_VISIBLE", 8);
let _t = gt;
const st = class st extends ft {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle dropdown click
   */
  handleDropdownClick(t) {
    var m, x;
    if (!this.state.dropdown) return !1;
    const { x: e, y: i, width: o, scrollTop: s, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = st.DROPDOWN_ITEM_HEIGHT, u = st.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const y = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + o && c >= i && c <= i + y) {
        const C = c - i + s, v = Math.floor(C / d);
        if (v >= 0 && v < (((x = r.options) == null ? void 0 : x.length) ?? 0) && r.options) {
          const R = r.options[v];
          if (!R.disabled)
            if (r.multiple !== !1) {
              const M = [...r.selectedValues ?? []], E = R.value ?? R.text, T = M.indexOf(E);
              T >= 0 ? M.splice(T, 1) : M.push(E), this.eventEmitter.emit(
                S.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                M,
                !0
              ), this.state.dropdown.tagsConfig = {
                ...r,
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
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + o && c >= i && c <= i + g) {
      const w = c - i + s, y = Math.floor(w / d);
      if (y >= 0 && y < a.options.length) {
        const C = a.options[y];
        if (!C.disabled)
          if (a.multiple) {
            const v = Array.isArray(a.value) ? [...a.value] : [], R = C.value, I = v.indexOf(R);
            I >= 0 ? v.splice(I, 1) : v.push(R), this.eventEmitter.emit(
              S.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              v,
              !0
            ), this.state.dropdown.config = {
              ...a,
              value: v
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
    const { x: e, y: i, width: o, scrollTop: s, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = st.DROPDOWN_ITEM_HEIGHT, u = st.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const y = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + o && c >= i && c <= i + y) {
        const C = c - i + s, v = Math.floor(C / d);
        v >= 0 && v < (((x = r.options) == null ? void 0 : x.length) ?? 0) && (this.state.dropdown.hoveredIndex = v, this.eventEmitter.emit(S.DROPDOWN_HOVER));
      } else
        this.state.dropdown.hoveredIndex = -1;
      return;
    }
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + o && c >= i && c <= i + g) {
      const w = c - i + s, y = Math.floor(w / d);
      y >= 0 && y < a.options.length && (this.state.dropdown.hoveredIndex = y, this.eventEmitter.emit(S.DROPDOWN_HOVER));
    } else
      this.state.dropdown.hoveredIndex = -1;
  }
  /**
   * Handle buttons dropdown click
   */
  handleButtonsDropdownClick(t) {
    if (!this.state.buttonsDropdown) return !1;
    const { x: e, y: i, buttons: o, cell: s } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(s))
      return this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE), !0;
    const n = this.getViewportCoords(t), r = n.x, a = n.y, l = st.DROPDOWN_ITEM_HEIGHT, h = o.length * l;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let c = 100;
    for (const d of o) {
      const u = d.text ?? this.locale.cell.buttonText, f = this.ctx.measureText(u).width;
      c = Math.max(c, f + 24);
    }
    if (r >= e && r <= e + c && a >= i && a <= i + h) {
      const d = a - i, u = Math.floor(d / l);
      if (u >= 0 && u < o.length) {
        const f = o[u];
        return this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE), this.eventEmitter.emit(S.BUTTON_CLICK, this.getCellInfo(s), f.actionKey), !0;
      }
    }
    return this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE), !0;
  }
  /**
   * Handle buttons dropdown hover
   */
  handleButtonsDropdownHover(t) {
    if (!this.state.buttonsDropdown) return;
    const { x: e, y: i, buttons: o } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(this.state.buttonsDropdown.cell)) {
      this.state.buttonsDropdown.hoveredIndex = -1, this.eventEmitter.emit(S.DROPDOWN_HOVER);
      return;
    }
    const s = this.getViewportCoords(t), n = s.x, r = s.y, a = st.DROPDOWN_ITEM_HEIGHT, l = o.length * a;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let h = 100;
    for (const c of o) {
      const d = c.text ?? this.locale.cell.buttonText, u = this.ctx.measureText(d).width;
      h = Math.max(h, u + 24);
    }
    if (n >= e && n <= e + h && r >= i && r <= i + l) {
      const c = r - i, d = Math.floor(c / a);
      d >= 0 && d < o.length && (this.state.buttonsDropdown.hoveredIndex = d, this.eventEmitter.emit(S.DROPDOWN_HOVER));
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
    const { x: e, y: i, width: o, mode: s } = this.state.filterDropdown, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 8;
    if (s === "dateRange") {
      const g = l + 32 + 4 + 36, m = r >= e && r <= e + o && a >= i && a <= i + g;
      let x = !1;
      if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0) {
        const C = (o - l * 3) / 2, v = e + l, R = e + l + C + 8, I = i + l;
        let T = (this.state.filterDropdown.activeDateField === "startDate" ? v : R) + C / 2 - 240 / 2;
        T < e && (T = e), T + 240 > e + o && (T = e + o - 240);
        const D = I + 32 + 8;
        x = r >= T && r <= T + 240 && a >= D && a <= D + 252;
      }
      return m || x ? (this.handleDateRangeModeClick(t, r, a), !0) : !1;
    }
    const h = this.getFilterDropdownHeight();
    if (r >= e && r <= e + o && a >= i && a <= i + h) {
      switch (s) {
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
    const { mode: t, options: e } = this.state.filterDropdown, i = 8, o = 4, s = 36;
    switch (t) {
      case "search":
        return i + 36 + o + s;
      case "select": {
        const n = st.DROPDOWN_ITEM_HEIGHT, r = st.DROPDOWN_MAX_VISIBLE, a = 32, l = 4, c = Math.min((e == null ? void 0 : e.length) ?? 0, r) * n;
        return i + a + l + c + l + s;
      }
      case "range":
        return i + 32 + o + s;
      case "boolean":
        return i + 32 * 3 + o + s;
      case "dateRange":
        return i + 32 + o + s;
      default:
        return 0;
    }
  }
  /**
   * 处理 select 模式点击
   */
  handleSelectModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: o, y: s, width: n, options: r, scrollTop: a } = this.state.filterDropdown;
    if (!r) return;
    const l = st.DROPDOWN_ITEM_HEIGHT, h = st.DROPDOWN_MAX_VISIBLE, c = Math.min(r.length, h), d = 36, u = 32, f = c * l, g = 8, m = 4;
    if (r.length > h) {
      const C = r.length * l, v = Math.max(20, f / C * f), R = f - v, I = a / (C - f) * R, M = o + n - 6 - 2, E = s + g + u + m;
      if (e >= M && e <= M + 6 && i >= E + I && i <= E + I + v) {
        this.state.filterDropdown.isScrollbarDragging = !0, this.state.filterDropdown.scrollbarDragStartY = t.clientY, this.state.filterDropdown.scrollbarDragStartScrollTop = a;
        return;
      }
    }
    const x = s + g + u + m + f + m;
    if (i >= x && i <= x + d) {
      this.ctx.font = "14px sans-serif";
      const C = this.locale.filter.reset, v = this.locale.filter.confirm, R = this.ctx.measureText(C).width, I = this.ctx.measureText(v).width, M = o + g, E = o + n - g - I;
      if (e >= M && e <= M + R + 10) {
        this.state.filterDropdown.options && this.state.filterDropdown.options.forEach((T) => T.checked = !1), this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= E - 10 && e <= E + I) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
    const w = s + g + u + m;
    if (i >= w && i <= w + f) {
      const y = i - w + a, C = Math.floor(y / l);
      C >= 0 && C < r.length && (r[C].checked = !r[C].checked, this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE));
    }
  }
  /**
   * 处理 search 模式点击
   */
  handleSearchModeClick(t, e, i) {
    if (!this.state.filterDropdown) return;
    const { x: o, y: s, width: n } = this.state.filterDropdown, r = 8, a = 4, l = 36, h = 36, c = s + r + l + a;
    if (i >= c && i <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = this.locale.filter.reset, f = this.locale.filter.confirm, g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, x = o + r, w = o + n - r - m;
      if (e >= x && e <= x + g + 10) {
        this.state.filterDropdown.searchValue = "", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= w - 10 && e <= w + m) {
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
    const { x: o, y: s, width: n } = this.state.filterDropdown, r = 8, a = 32, l = 4, h = 36, c = s + r + a + l;
    if (i >= c && i <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = this.locale.filter.reset, f = this.locale.filter.confirm, g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, x = o + r, w = o + n - r - m;
      if (e >= x && e <= x + g + 10) {
        this.state.filterDropdown.minValue = "", this.state.filterDropdown.maxValue = "", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= w - 10 && e <= w + m) {
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
    const { x: o, y: s, width: n } = this.state.filterDropdown, r = 8, a = 4, l = 32, h = 36, c = s + r, d = l * 3;
    if (i >= c && i <= c + d) {
      const f = Math.floor((i - c) / l), g = ["all", "true", "false"];
      f >= 0 && f < 3 && (this.state.filterDropdown.boolValue = g[f], this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE));
      return;
    }
    const u = s + r + d + a;
    if (i >= u && i <= u + h) {
      this.ctx.font = "14px sans-serif";
      const g = this.locale.filter.reset, m = this.locale.filter.confirm, x = this.ctx.measureText(g).width, w = this.ctx.measureText(m).width, y = o + r, C = o + n - r - w;
      if (e >= y && e <= y + x + 10) {
        this.state.filterDropdown.boolValue = "all", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= C - 10 && e <= C + w) {
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
    const { x: o, y: s, width: n, startDate: r, endDate: a } = this.state.filterDropdown, l = 8, h = 32, c = 8, d = 4, u = 36, f = s + l, g = (n - l * 3) / 2, m = o + l, x = o + l + g + c;
    if (e >= m && e <= m + g && i >= f && i <= f + h) {
      this.state.filterDropdown.activeDateField = "startDate";
      const y = r || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = y.getFullYear(), this.state.filterDropdown.currentMonth = y.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (e >= x && e <= x + g && i >= f && i <= f + h) {
      this.state.filterDropdown.activeDateField = "endDate";
      const y = a || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = y.getFullYear(), this.state.filterDropdown.currentMonth = y.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0 && this.handleDateRangeCalendarClick(
      e,
      i,
      o,
      s,
      n,
      l,
      h,
      c
    ))
      return;
    const w = s + l + h + d;
    if (i >= w && i <= w + u) {
      this.ctx.font = "14px sans-serif";
      const C = this.locale.filter.reset, v = this.locale.filter.confirm, R = this.ctx.measureText(C).width, I = this.ctx.measureText(v).width, M = o + l, E = o + n - l - I;
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
  handleDateRangeCalendarClick(t, e, i, o, s, n, r, a) {
    if (!this.state.filterDropdown) return !1;
    const { activeDateField: l, currentYear: h, currentMonth: c } = this.state.filterDropdown;
    if (!l || h === void 0 || c === void 0) return !1;
    const d = 40, u = 28, f = 28, g = 8, x = d + u + 6 * f + g * 2, w = 240, y = (s - n * 3) / 2, C = i + n, v = i + n + y + a, R = o + n;
    let E = (l === "startDate" ? C : v) + y / 2 - w / 2;
    E < i && (E = i), E + w > i + s && (E = i + s - w);
    const T = R + r + a;
    if (t < E || t > E + w || e < T || e > T + x)
      return !1;
    if (e >= T && e <= T + d) {
      const W = E + 20, A = E + w - 20;
      if (t >= W - 6 - 5 && t <= W + 6 + 5)
        return c === 0 ? (this.state.filterDropdown.currentYear = h - 1, this.state.filterDropdown.currentMonth = 11) : this.state.filterDropdown.currentMonth = c - 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN), !0;
      if (t >= A - 6 - 5 && t <= A + 6 + 5)
        return c === 11 ? (this.state.filterDropdown.currentYear = h + 1, this.state.filterDropdown.currentMonth = 0) : this.state.filterDropdown.currentMonth = c + 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN), !0;
    }
    const D = (w - g * 2) / 7, O = new Date(h, c, 1).getDay(), k = new Date(h, c + 1, 0).getDate(), P = T + d + u;
    for (let L = 1; L <= k; L++) {
      const W = O + L - 1, A = Math.floor(W / 7), _ = W % 7, F = E + g + _ * D, V = P + A * f;
      if (t >= F && t <= F + D && e >= V && e <= V + f) {
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
      width: o,
      activeDateField: s,
      currentYear: n,
      currentMonth: r,
      hoveredDate: a
    } = this.state.filterDropdown;
    if (!s || n === void 0 || r === void 0)
      return;
    const l = this.getViewportCoords(t), h = l.x, c = l.y, d = 8, u = 32, f = 8, g = 40, m = 28, x = 28, w = 8, C = g + m + 6 * x + w * 2, v = 240, R = (o - d * 3) / 2, I = e + d, M = e + d + R + f, E = i + d;
    let H = (s === "startDate" ? I : M) + R / 2 - v / 2;
    H < e && (H = e), H + v > e + o && (H = e + o - v);
    const O = E + u + f;
    if (h < H || h > H + v || c < O || c > O + C) {
      this.state.filterDropdown.hoveredDate !== null && (this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
      return;
    }
    const k = (v - w * 2) / 7, L = new Date(n, r, 1).getDay(), W = new Date(n, r + 1, 0).getDate(), A = O + g + m;
    let _ = null;
    for (let z = 1; z <= W; z++) {
      const G = L + z - 1, Y = Math.floor(G / 7), U = G % 7, X = H + w + U * k, j = A + Y * x;
      if (h >= X && h <= X + k && c >= j && c <= j + x) {
        _ = new Date(n, r, z);
        break;
      }
    }
    const F = a ? a.getTime() : null, V = _ ? _.getTime() : null;
    F !== V && (this.state.filterDropdown.hoveredDate = _, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
  }
  /**
   * Handle filter dropdown hover
   */
  handleFilterDropdownHover(t) {
    if (!this.state.filterDropdown) return;
    const { mode: e, x: i, y: o, width: s, options: n, scrollTop: r } = this.state.filterDropdown;
    if (e === "dateRange") {
      this.handleDateRangeCalendarHover(t);
      return;
    }
    if (e !== "select" || !n) return;
    const a = this.getViewportCoords(t), l = a.x, h = a.y, c = st.DROPDOWN_ITEM_HEIGHT, d = st.DROPDOWN_MAX_VISIBLE, u = Math.min(n.length, d), f = 36, g = u * c;
    if (n.length > d) {
      const w = n.length * c, y = Math.max(20, g / w * g), C = g - y, v = r / (w - g) * C, R = i + s - 6 - 2;
      if (l >= R && l <= R + 6 && h >= o + f + v && h <= o + f + v + y) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }
    const m = o + f;
    if (l >= i && l <= i + s && h >= m && h <= m + g) {
      const x = h - m + r, w = Math.floor(x / c);
      w >= 0 && w < n.length && (this.state.filterDropdown.hoveredIndex = w, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
    } else
      this.state.filterDropdown.hoveredIndex = -1;
  }
  /**
   * Update dropdown position after scroll
   */
  updateDropdownPosition() {
    var u, f;
    if (!this.state.dropdown) return;
    const { cell: t, width: e, showAbove: i } = this.state.dropdown, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) return;
    const n = st.DROPDOWN_ITEM_HEIGHT, r = st.DROPDOWN_MAX_VISIBLE;
    let a;
    this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig ? a = ((u = this.state.dropdown.tagsConfig.options) == null ? void 0 : u.length) ?? 0 : a = ((f = this.state.dropdown.config.options) == null ? void 0 : f.length) ?? 0;
    const h = Math.min(a, r) * n, c = this.updateDropdownY(t, i ?? !1, h, { column: s }), d = this.updateDropdownX(t, e, { column: s });
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
    const { columnKey: t } = this.state.filterDropdown, e = this.layoutManager.getLeafColumns(), i = e.findIndex((a) => a.key === t);
    if (i < 0) return;
    const o = e[i];
    if (!o) return;
    const s = this.layoutManager.getCellPosition(-1, i), n = this.layoutManager.getLayoutInfo().headerHeight;
    let r;
    o.fixed === "left" || o.fixed === "right" ? r = s.x : r = s.x - this.scrollState.scrollLeft, this.state.filterDropdown.x = r, this.state.filterDropdown.y = n, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Update date dropdown position
   */
  updateDateDropdownPosition() {
    if (!this.state.dateDropdown) return;
    const { cell: t, showAbove: e } = this.state.dateDropdown, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) return;
    const s = 68 + 6 * 28 + 16, n = Math.max(o.width ?? 100, 280), r = this.updateDropdownY(t, e ?? !1, s, { column: o }), a = this.updateDropdownX(t, n, { column: o });
    this.state.dateDropdown.x = a, this.state.dateDropdown.y = r.y, this.state.dateDropdown.width = n, this.state.dateDropdown.showAbove = r.showAbove, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN);
  }
  /**
   * Update color dropdown position
   */
  updateColorDropdownPosition() {
    if (!this.state.colorDropdown) return;
    const { cell: t, config: e } = this.state.colorDropdown, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) return;
    const s = e.presetColors || this.getDefaultPresetColors(), n = 8, r = Math.ceil(s.length / n), a = 24, l = 4, h = 8, c = r * (a + l) + h * 2 - l, d = Math.max(
      o.width ?? 100,
      n * (a + l) + h * 2 - l
    ), u = this.updateDropdownY(t, !1, c, { column: o }), f = this.updateDropdownX(t, d, { column: o });
    this.state.colorDropdown.x = f, this.state.colorDropdown.y = u.y, this.state.colorDropdown.width = d, this.eventEmitter.emit(S.COLOR_DROPDOWN_OPEN);
  }
  /**
   * Update buttons dropdown position
   */
  updateButtonsDropdownPosition() {
    if (!this.state.buttonsDropdown) return;
    const { cell: t, buttonRelativeX: e, buttonY: i, buttonHeight: o, buttons: s, showAbove: n } = this.state.buttonsDropdown, a = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!a) {
      this.state.buttonsDropdown = null;
      return;
    }
    const l = st.DROPDOWN_ITEM_HEIGHT, h = s.length * l, c = this.updateDropdownY(t, n, h, {
      column: a,
      anchorType: "button",
      buttonY: i,
      buttonHeight: o
    }), d = this.updateDropdownX(t, 120, {
      column: a,
      anchorType: "button",
      buttonRelativeX: e
    });
    this.state.buttonsDropdown.x = d, this.state.buttonsDropdown.y = c.y, this.state.buttonsDropdown.showAbove = c.showAbove, this.eventEmitter.emit(S.DROPDOWN_HOVER);
  }
  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(t) {
    const e = t.getFullYear(), i = String(t.getMonth() + 1).padStart(2, "0"), o = String(t.getDate()).padStart(2, "0");
    return `${e}-${i}-${o}`;
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
    const e = this.getViewportCoords(t), i = e.x, o = e.y, { x: s, y: n, width: r, currentYear: a, currentMonth: l } = this.state.dateDropdown, h = 40, c = 28, d = 28, u = 8, g = h + c + 6 * d + u * 2;
    if (i >= s && i <= s + r && o >= n && o <= n + g) {
      const x = s + 20, w = s + r - 20;
      if (o >= n && o <= n + h) {
        if (i >= x - 6 - 5 && i <= x + 6 + 5)
          return l === 0 ? (this.state.dateDropdown.currentYear = a - 1, this.state.dateDropdown.currentMonth = 11) : this.state.dateDropdown.currentMonth = l - 1, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
        if (i >= w - 6 - 5 && i <= w + 6 + 5)
          return l === 11 ? (this.state.dateDropdown.currentYear = a + 1, this.state.dateDropdown.currentMonth = 0) : this.state.dateDropdown.currentMonth = l + 1, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
      }
      const y = (r - u * 2) / 7, v = new Date(a, l, 1).getDay(), R = new Date(a, l + 1, 0).getDate();
      for (let I = 1; I <= R; I++) {
        const M = v + I - 1, E = Math.floor(M / 7), T = M % 7, D = s + u + T * y, H = n + h + c + E * d;
        if (i >= D && i <= D + y && o >= H && o <= H + d) {
          const O = new Date(a, l, I), k = this.formatDate(O), P = this.state.dateDropdown.cell;
          return this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, null), this.eventEmitter.emit(S.DATE_SELECT, this.getCellInfo(P), k), !0;
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
    const e = this.getViewportCoords(t), i = e.x, o = e.y, {
      x: s,
      y: n,
      width: r,
      currentYear: a,
      currentMonth: l,
      hoveredDate: h
    } = this.state.dateDropdown, c = 40, d = 28, u = 28, f = 8, m = c + d + 6 * u + f * 2;
    let x = null;
    if (i >= s && i <= s + r && o >= n && o <= n + m) {
      const C = (r - f * 2) / 7, R = new Date(a, l, 1).getDay(), I = new Date(a, l + 1, 0).getDate();
      for (let M = 1; M <= I; M++) {
        const E = R + M - 1, T = Math.floor(E / 7), D = E % 7, H = s + f + D * C, O = n + c + d + T * u;
        if (i >= H && i <= H + C && o >= O && o <= O + u) {
          x = new Date(a, l, M);
          break;
        }
      }
    }
    const w = h ? h.getTime() : null, y = x ? x.getTime() : null;
    w !== y && (this.state.dateDropdown.hoveredDate = x, this.eventEmitter.emit(S.DATE_DROPDOWN_HOVER));
  }
  /**
   * Handle color dropdown click
   */
  handleColorDropdownClick(t) {
    if (!this.state.colorDropdown) return !1;
    const e = this.getViewportCoords(t), i = e.x, o = e.y, { cell: s, config: n, x: r, y: a, width: l } = this.state.colorDropdown, h = n.presetColors || this.getDefaultPresetColors(), c = 8, d = 24, u = 4, f = 8, m = Math.ceil(h.length / c) * (d + u) + f * 2 - u;
    if (i >= r && i <= r + l && o >= a && o <= a + m) {
      const x = Math.floor((i - r - f) / (d + u)), w = Math.floor((o - a - f) / (d + u));
      if (x >= 0 && x < c && w >= 0) {
        const y = w * c + x;
        if (y >= 0 && y < h.length) {
          const C = h[y];
          return this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE, null), this.eventEmitter.emit(S.COLOR_CHANGE, this.getCellInfo(s), C), !0;
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
    const e = this.getViewportCoords(t), i = e.x, o = e.y, { config: s, x: n, y: r } = this.state.colorDropdown, a = s.presetColors || this.getDefaultPresetColors(), l = 8, h = 24, c = 4, d = 8, u = Math.floor((i - n - d) / (h + c)), f = Math.floor((o - r - d) / (h + c));
    let g = null;
    if (u >= 0 && u < l && f >= 0) {
      const m = f * l + u;
      m >= 0 && m < a.length && (g = a[m]);
    }
    this.state.colorDropdown.hoveredColor !== g && (this.state.colorDropdown.hoveredColor = g, this.eventEmitter.emit(S.COLOR_DROPDOWN_HOVER));
  }
};
b(st, "DROPDOWN_ITEM_HEIGHT", 32), b(st, "DROPDOWN_MAX_VISIBLE", 8);
let Ft = st;
const N = class N extends ft {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle image tooltip hover
   */
  handleImageTooltipHover(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: o, scrollTop: s, maxRows: n } = this.state.imageTooltip, r = this.getViewportCoords(t), a = r.x, l = r.y, h = N.IMAGE_SIZE, c = N.IMAGE_PADDING, d = N.IMAGE_GAP, u = N.IMAGES_PER_ROW, m = u * h + (u - 1) * d + c * 2 + 4 + 4, x = h + d, w = n * x + c * 2 - d, y = this.state.imageTooltip.hoveredIndex;
    if (a >= e && a <= e + m && l >= i && l <= i + w) {
      const C = Math.ceil(o.length / u), v = Math.floor(s / x), R = Math.min(C, v + n + 1);
      for (let I = v; I < R; I++)
        for (let M = 0; M < u; M++) {
          const E = I * u + M;
          if (E >= o.length) break;
          const T = e + c + M * (h + d), D = i + c + I * x - s;
          if (a >= T && a <= T + h && l >= D && l <= D + h)
            return this.state.imageTooltip.hoveredIndex = E, y !== E && this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL), !0;
        }
      return this.state.imageTooltip.hoveredIndex = -1, y !== -1 && this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL), !0;
    }
    return this.state.imageTooltip.hoveredIndex = -1, y !== -1 && this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL), !1;
  }
  /**
   * Handle image tooltip click
   */
  handleImageTooltipClick(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: o, cell: s, scrollTop: n, maxRows: r } = this.state.imageTooltip, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, x = f * c + (f - 1) * u + d * 2 + 4 + 4, w = c + u, y = r * w + d * 2 - u;
    if (l < e || l > e + x || h < i || h > i + y)
      return !1;
    const C = l - e - d, v = h - i - d + n, R = Math.floor(C / (c + u)), I = Math.floor(v / w);
    if (R >= 0 && R < f && I >= 0) {
      const M = I * f + R;
      if (M >= 0 && M < o.length) {
        const E = o[M];
        E && this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(s), E, t);
      }
    }
    return !0;
  }
  /**
   * Handle image editor hover
   */
  handleImageEditorHover(t) {
    if (!this.state.imageEditor) return !1;
    const { x: e, y: i, images: o, pendingImages: s, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, g = N.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, x = f * c + (f - 1) * u + d * 2 + 4 + 4, w = r * m + d * 2 - u, y = g + w, C = this.state.imageEditor.hoveredIndex;
    if (l < e || l > e + x || h < i || h > i + y)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !1;
    if (h >= i && h <= i + g)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !0;
    const v = i + g, R = o.length + s.length;
    for (let I = 0; I < r + 1; I++)
      for (let M = 0; M < f; M++) {
        const E = I * f + M;
        if (E >= R) break;
        const T = e + d + M * (c + u), D = v + d + I * m - n;
        if (l >= T && l <= T + c && h >= D && h <= D + c)
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
    const { x: e, y: i, images: o, cell: s, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, g = N.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, x = f * c + (f - 1) * u + d * 2 + 4 + 4, w = r * m + d * 2 - u, y = g + w;
    if (l < e || l > e + x || h < i || h > i + y)
      return "outside";
    if (h >= i && h <= i + g)
      return "upload";
    const C = i + g, v = o.length + (((R = this.state.imageEditor.pendingImages) == null ? void 0 : R.length) ?? 0);
    for (let I = 0; I < r + 1; I++)
      for (let M = 0; M < f; M++) {
        const E = I * f + M;
        if (E >= v) break;
        const T = e + d + M * (c + u), D = C + d + I * m - n;
        if (l >= T && l <= T + c && h >= D && h <= D + c) {
          if (E < o.length) {
            const H = o[E];
            o.splice(E, 1), this.state.imageEditor.images = [...o], this.eventEmitter.emit(
              S.IMAGE_DELETE,
              this.getCellInfo(s),
              H,
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
    const o = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!o) return;
    const n = (i.render ? i.render(
      o.data[$(i)],
      o,
      i,
      this.state.imageEditor.cell.rowIndex
    ) : { image: o.data[$(i)] }).image ?? {}, r = n.onUpload, a = n.maxCount, l = this.state.imageEditor.isSingleImage;
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
    ], this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), r)
      for (const u of d) {
        try {
          const f = await r(u.file), g = this.state.imageEditor.pendingImages.findIndex(
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
    const { cell: t, images: e, isSingleImage: i } = this.state.imageEditor, s = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (s && n) {
      const r = n.data[$(s)];
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
      this.eventEmitter.emit(S.EDIT_END, this.getCellInfo(t), a);
    }
    this.state.imageEditor = null, this.eventEmitter.emit(S.IMAGE_EDITOR_CLOSE);
  }
  /**
   * Read file as data URL
   */
  readFileAsDataURL(t) {
    return new Promise((e, i) => {
      const o = new FileReader();
      o.onload = () => e(o.result), o.onerror = i, o.readAsDataURL(t);
    });
  }
  /**
   * Update image tooltip position after scroll
   */
  updateImageTooltipPosition() {
    if (!this.state.imageTooltip) return;
    const { cell: t, showAbove: e, maxRows: i } = this.state.imageTooltip, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) {
      this.state.imageTooltip = null;
      return;
    }
    const n = N.IMAGE_SIZE, r = N.IMAGE_PADDING, a = N.IMAGE_GAP, l = N.IMAGES_PER_ROW, h = l * n + (l - 1) * a + r * 2, c = n + a, d = i * c + r * 2 - a, u = this.updateDropdownY(t, e, d, { column: s }), f = this.updateDropdownX(t, h, { column: s });
    this.state.imageTooltip.x = f, this.state.imageTooltip.y = u.y, this.state.imageTooltip.showAbove = u.showAbove;
  }
  /**
   * Update image editor position after scroll
   */
  updateImageEditorPosition() {
    if (!this.state.imageEditor) return;
    const { cell: t, showAbove: e, maxRows: i } = this.state.imageEditor, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) {
      this.commitImageEditorChanges();
      return;
    }
    const n = N.IMAGE_SIZE, r = N.IMAGE_PADDING, a = N.IMAGE_GAP, l = N.IMAGES_PER_ROW, h = N.IMAGE_UPLOAD_AREA_HEIGHT, c = n + a, d = l * n + (l - 1) * a + r * 2 + 4 + 4, u = i * c + r * 2 - a, f = h + u, g = this.updateDropdownY(t, e, f, { column: s }), m = this.updateDropdownX(t, d, { column: s });
    this.state.imageEditor.x = m, this.state.imageEditor.y = g.y, this.state.imageEditor.showAbove = g.showAbove;
  }
  /**
   * Handle drag over event for image editor
   */
  handleDragOver(t) {
    if (!this.state.imageEditor) return !1;
    t.preventDefault();
    const e = this.getViewportCoords(t), i = e.x, o = e.y, { x: s, y: n, maxRows: r } = this.state.imageEditor, a = N.IMAGE_SIZE, l = N.IMAGE_PADDING, h = N.IMAGE_GAP, c = N.IMAGES_PER_ROW, d = N.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    return i >= s && i <= s + f && o >= n && o <= n + m ? (this.state.imageEditor.isDragging = !0, this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), !0) : !1;
  }
  /**
   * Handle drag leave event for image editor
   */
  handleDragLeave(t) {
    if (!this.state.imageEditor) return;
    const e = this.getViewportCoords(t), i = e.x, o = e.y, { x: s, y: n, maxRows: r } = this.state.imageEditor, a = N.IMAGE_SIZE, l = N.IMAGE_PADDING, h = N.IMAGE_GAP, c = N.IMAGES_PER_ROW, d = N.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    (i < s || i > s + f || o < n || o > n + m) && (this.state.imageEditor.isDragging = !1, this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL));
  }
  /**
   * Handle drop event for image editor
   */
  async handleDrop(t) {
    var i;
    if (!this.state.imageEditor) return !1;
    t.preventDefault(), this.state.imageEditor.isDragging = !1;
    const e = Array.from(((i = t.dataTransfer) == null ? void 0 : i.files) ?? []).filter(
      (o) => o.type.startsWith("image/")
    );
    return e.length > 0 && await this.handleFileUpload(e), this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), !0;
  }
};
b(N, "IMAGE_SIZE", 64), b(N, "IMAGE_PADDING", 8), b(N, "IMAGE_GAP", 8), b(N, "IMAGES_PER_ROW", 4), b(N, "IMAGE_UPLOAD_AREA_HEIGHT", 60);
let Nt = N;
const Ct = class Ct extends ft {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle context menu click
   */
  handleContextMenuClick(t) {
    if (!this.state.contextMenu) return !1;
    const { x: e, y: i, row: o, items: s } = this.state.contextMenu, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 140, h = Ct.DROPDOWN_ITEM_HEIGHT, c = s.length * h;
    if (r >= e && r <= e + l && a >= i && a <= i + c) {
      const d = a - i, u = Math.floor(d / h), f = s[u];
      return !f || f.disabled || (f.key === "pin-top" ? this.eventEmitter.emit(S.ROW_PIN_CHANGE, o, "top") : f.key === "pin-bottom" ? this.eventEmitter.emit(S.ROW_PIN_CHANGE, o, "bottom") : f.key === "unpin" ? this.eventEmitter.emit(S.ROW_PIN_CHANGE, o, null) : f.key === "add-above" ? this.eventEmitter.emit(S.ROW_ADD_ABOVE, o) : f.key === "add-below" ? this.eventEmitter.emit(S.ROW_ADD_BELOW, o) : f.key === "delete" && this.eventEmitter.emit(S.ROW_DELETE, o), this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE)), !0;
    }
    return !1;
  }
  /**
   * Handle context menu hover
   */
  handleContextMenuHover(t) {
    if (!this.state.contextMenu) return;
    const { x: e, y: i, items: o, hoveredIndex: s } = this.state.contextMenu, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 140, h = Ct.DROPDOWN_ITEM_HEIGHT, c = o.length * h;
    let d = -1;
    if (r >= e && r <= e + l && a >= i && a <= i + c) {
      const u = a - i;
      d = Math.floor(u / h);
    }
    d !== s && (this.state.contextMenu.hoveredIndex = d, this.eventEmitter.emit(S.CONTEXT_MENU_HOVER));
  }
  /**
   * Handle header context menu click
   */
  handleHeaderContextMenuClick(t) {
    if (!this.state.headerContextMenu) return !1;
    const { x: e, y: i, columnKey: o } = this.state.headerContextMenu, s = this.getViewportCoords(t), n = s.x, r = s.y;
    return n >= e && n <= e + 120 && r >= i && r <= i + 32 ? (this.eventEmitter.emit(S.COLUMN_HIDE, o), this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE), !0) : !1;
  }
  /**
   * Handle header context menu hover
   */
  handleHeaderContextMenuHover(t) {
    if (!this.state.headerContextMenu) return;
    const { x: e, y: i, hoveredIndex: o } = this.state.headerContextMenu, s = this.getViewportCoords(t), n = s.x, r = s.y, a = 120, l = 32;
    let h = -1;
    n >= e && n <= e + a && r >= i && r <= i + l && (h = 0), h !== o && (this.state.headerContextMenu.hoveredIndex = h, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_HOVER));
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
b(Ct, "DROPDOWN_ITEM_HEIGHT", 32);
let Vt = Ct;
class Wi extends ft {
  constructor(e, i, o, s) {
    super(e, i);
    b(this, "sortConfig");
    b(this, "filterConfig");
    this.sortConfig = o, this.filterConfig = s;
  }
  /**
   * Handle header hover
   */
  handleHeaderHover(e, i, o) {
    const s = e.column, n = this.state.hoveredHeaderColumnKey;
    let r;
    if (s.fixed === "left")
      r = e.x;
    else if (s.fixed === "right") {
      const L = this.layoutManager.getRightFixedWidth(), A = this.layoutManager.getViewportWidth() - L - (this.layoutManager.getLayoutInfo().totalWidth - L);
      r = e.x + A;
    } else
      r = e.x - this.scrollState.scrollLeft;
    const a = e.y, l = e.width, h = e.height, c = 8, d = 10, u = 10, f = r + c, g = a + (h - u) / 2, x = s.reorderable !== !1 && i >= f && i <= f + d && o >= g && o <= g + u;
    this.state.hoveredHeaderColumnKey = s.key;
    const w = (s == null ? void 0 : s.filterable) && e.isLeaf;
    let y, C;
    w ? (y = r + l - c - 10, C = y - 16) : C = r + l - c - 10;
    const v = a + h / 2, R = 8, I = 5, M = 2, E = 4, T = v - M - I - E, D = v + M + I + E, H = C - R / 2 - E, O = C + R / 2 + E, k = e.isLeaf && w && y !== void 0 && Math.abs(i - y) < 12, P = e.isLeaf && s && s.sortable !== !1 && i >= H && i <= O && o >= T && o <= D;
    x ? this.canvas.style.cursor = "grab" : k || P ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", this.state.hoveredCell = null, this.state.tooltip = null, n !== this.state.hoveredHeaderColumnKey && this.eventEmitter.emit(S.HEADER_HOVER, this.state.hoveredHeaderColumnKey);
  }
  /**
   * Handle header mouse down
   */
  handleHeaderMouseDown(e, i) {
    const o = this.getViewportCoords(i), s = o.x, n = o.y, r = this.layoutManager.getHeaderCellAtPosition(s, n);
    if (!r) return !1;
    const a = r.column;
    if (a.reorderable === !1 || this.layoutManager.isResizeHandleAtPosition(
      s + this.scrollState.scrollLeft,
      0
    ) >= 0)
      return !1;
    let h;
    if (a.fixed === "left")
      h = r.x;
    else if (a.fixed === "right") {
      const I = this.layoutManager.getRightFixedWidth(), E = this.layoutManager.getViewportWidth() - I, T = this.layoutManager.getLayoutInfo().totalWidth, D = E - (T - I);
      h = r.x + D;
    } else
      h = r.x - this.scrollState.scrollLeft;
    const c = r.y, d = r.height, u = 8, f = 10, g = 10, m = h + u, x = c + (d - g) / 2, w = s >= m && s <= m + f && n >= x && n <= x + g;
    if (r.isLeaf && !w || !r.isLeaf && !w)
      return !1;
    let y = a.key, C = e;
    if (!r.isLeaf && a.children && a.children.length > 0) {
      const I = this.getFirstLeaf(a);
      I && (y = a.key, C = this.layoutManager.getLeafColumnIndex(I), C < 0 && (C = e));
    }
    const v = this.calculateSiblingColumns(a), R = v.findIndex((I) => I.key === a.key);
    return this.state.columnReorderState = {
      dragColumnIndex: C,
      dragColumnKey: y,
      dragStartX: s,
      currentX: s,
      targetColumnIndex: C,
      isParentColumn: !r.isLeaf,
      isFixedColumn: !!a.fixed,
      siblingColumns: v,
      dragSiblingIndex: R,
      lastSwapTime: void 0,
      lastSwapTargetKey: void 0
    }, !0;
  }
  /**
   * Handle header click (sort/filter)
   */
  handleHeaderClick(e, i) {
    const o = this.layoutManager.getLeafColumn(e);
    if (!o) return;
    this.eventEmitter.emit(S.HEADER_CLICK, o, e, i);
    const s = this.getViewportCoords(i), n = s.x, r = s.y, a = this.layoutManager.getLeafHeaderCellViewportPosition(e);
    if (!a) return;
    const l = a.x, h = a.y, c = a.width, d = a.height, u = o.filterable, f = 8;
    let g, m;
    if (u ? (g = l + c - f - 10, m = g - 16) : m = l + c - f - 10, u && g !== void 0 && Math.abs(n - g) < 12) {
      this.openFilterDropdown(o, e);
      return;
    }
    if (o.sortable === !1)
      return;
    const x = h + d / 2, w = 8, y = 5, C = 2, v = 4, R = x - C - y - v, I = x - C + v, M = x + C - v, E = x + C + y + v, T = m - w / 2 - v, D = m + w / 2 + v;
    if (n >= T && n <= D && r >= R && r <= E) {
      const O = r >= R && r <= I, k = r >= M && r <= E;
      O ? this.setSortDirection(o, "asc", i) : k ? this.setSortDirection(o, "desc", i) : this.toggleSort(o, i);
    }
  }
  /**
   * Set sort direction
   */
  setSortDirection(e, i, o) {
    const s = this.sortConfig.findIndex((r) => r.column === e.key);
    if ((s >= 0 ? this.sortConfig[s].direction : "none") === i) {
      o.shiftKey ? s >= 0 && this.sortConfig.splice(s, 1) : this.sortConfig = [], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
      return;
    }
    o.shiftKey ? s >= 0 ? this.sortConfig[s].direction = i : this.sortConfig.push({ column: e.key, direction: i }) : this.sortConfig = [{ column: e.key, direction: i }], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Toggle sort
   */
  toggleSort(e, i) {
    const o = this.sortConfig.findIndex((n) => n.column === e.key);
    let s = "asc";
    if (o >= 0) {
      const n = this.sortConfig[o].direction;
      n === "asc" ? s = "desc" : n === "desc" && (s = "none");
    }
    i.shiftKey ? o >= 0 ? s === "none" ? this.sortConfig.splice(o, 1) : this.sortConfig[o].direction = s : s !== "none" && this.sortConfig.push({ column: e.key, direction: s }) : s === "none" ? this.sortConfig = [] : this.sortConfig = [{ column: e.key, direction: s }], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Open filter dropdown
   */
  openFilterDropdown(e, i) {
    const o = this.layoutManager.getCellPosition(-1, i), s = this.layoutManager.getLayoutInfo().headerHeight, n = Xe(e);
    if (!n) return;
    let r;
    e.fixed === "left" || e.fixed === "right" ? r = o.x : r = o.x - this.scrollState.scrollLeft;
    const a = this.allRows.length > 0 ? this.allRows : this.rows, l = this.filterConfig.find((h) => h.column === e.key);
    switch (n) {
      case "search": {
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "search",
          x: r,
          y: s,
          width: Math.max(o.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          searchValue: (l == null ? void 0 : l.value) ?? ""
        };
        break;
      }
      case "select": {
        const h = pe(e, a, 0), c = l ? l.value : [], d = h.length === 0 && a.length > 0;
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "select",
          x: r,
          y: s,
          width: Math.max(o.width, 200),
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
          y: s,
          width: Math.max(o.width, 200),
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
          y: s,
          width: Math.max(o.width, 240),
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
          y: s,
          width: Math.max(o.width, 160),
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
    const i = [], o = this.scrollState.scrollLeft;
    let s = [];
    if (e.parentKey) {
      const l = this.layoutManager.getColumnByKey(e.parentKey);
      l && l.children && (s = l.children);
    } else
      s = this.layoutManager.getColumns().filter((h) => h.reorderable === !1 ? !1 : h.fixed === e.fixed);
    const n = this.layoutManager.getLeftFixedWidth(), r = this.layoutManager.getRightFixedWidth(), a = this.layoutManager.getViewportWidth();
    for (const l of s) {
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
        g = a - r;
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
        g -= o;
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
    for (const o of e.children)
      i += this.getChildLeafCount(o);
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
    b(this, "handleExpandIconClick", (e, i, o) => {
      const s = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), a = this.layoutManager.getLeafColumns()[e.columnIndex], l = i.clientX - s.left, h = this.getCellViewportX(n, a), c = l - h, d = o.level ?? 0, u = 8, f = 8, g = d * 16, m = u + g, x = m + f + 4;
      return c >= m && c <= x ? (this.eventEmitter.emit(S.EXPAND, o, e.rowIndex, !o.expanded), !0) : !1;
    });
  }
  /**
   * Handle progress bar click
   */
  handleProgressClick(e, i, o, s, n) {
    if (!o.interactive || n && s && !this.editorRegistry.getStrategy(s).canEdit(e, n, s))
      return !1;
    const r = this.canvas.getBoundingClientRect(), a = i.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, s), c = o.shape ?? "line";
    if (c === "line") {
      const u = o.size ?? "medium", f = o.height ?? (u === "small" ? 6 : u === "large" ? 16 : 10), g = o.textPosition ?? "right", x = (o.showText ?? !0) && g === "right" ? 40 : 0, w = o.width ?? l.width - 8 * 2 - x, y = h + 8, C = this.getCellViewportY(e.rowIndex) + (l.height - f) / 2, v = i.clientY - r.top, R = a - y, I = v - C;
      if (R >= 0 && R <= w && I >= 0 && I <= f) {
        const M = o.precision ?? 0, E = Math.max(0, Math.min(100, R / w * 100)), T = M === 0 ? Math.round(E) : Number(E.toFixed(M));
        return this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), T), !0;
      }
    } else if (c === "circle" || c === "dashboard") {
      const d = i.clientY - r.top, u = this.getCellViewportY(e.rowIndex), f = o.size ?? "medium";
      let g, m = 0;
      c === "circle" ? g = f === "small" ? 0.6 : f === "large" ? 0.9 : 0.75 : (g = f === "small" ? 0.7 : f === "large" ? 0.95 : 0.85, m = l.height * 0.05);
      const x = Math.floor(l.height * g), w = o.width ?? x, y = o.strokeWidth ?? Math.max(2, Math.round(w * 0.12)), C = (w - y) / 2, v = h + l.width / 2, R = u + l.height / 2 + m, I = a - v, M = d - R, E = Math.sqrt(I * I + M * M);
      if (E >= C - y && E <= C + y) {
        let T = Math.atan2(M, I), D;
        if (c === "circle")
          T = T + Math.PI / 2, T < 0 && (T += Math.PI * 2), D = T / (Math.PI * 2) * 100;
        else {
          const O = Math.PI * 0.75, k = Math.PI * 1.5;
          T < 0 && (T += Math.PI * 2);
          let P = T - O;
          if (P < 0 && (P += Math.PI * 2), P > k) return !1;
          D = P / k * 100;
        }
        D = Math.max(0, Math.min(100, D));
        const H = o.precision ?? 0;
        return D = H === 0 ? Math.round(D) : Number(D.toFixed(H)), this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), D), !0;
      }
    }
    return !1;
  }
  /**
   * Handle rating click
   */
  handleRatingClick(e, i, o, s, n) {
    if (n && s && !this.editorRegistry.getStrategy(s).canEdit(e, n, s))
      return !1;
    const r = this.canvas.getBoundingClientRect(), a = i.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, s), c = a - h, d = o.max ?? 5, u = o.starSize ?? 16, f = o.allowHalf ?? !1, g = o.value ?? 0, m = d * u, x = (l.width - m) / 2, w = (l.height - u) / 2, y = i.clientY - r.top, C = l.y - this.context.scrollState.scrollTop, v = y - C;
    if (v < w || v > w + u) return !1;
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
  getClickedRadioOption(e, i, o) {
    const s = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), a = this.layoutManager.getLeafColumns()[e.columnIndex], l = i.clientX - s.left, h = i.clientY - s.top, c = this.getCellViewportX(n, a), d = l - c, u = h - this.getCellViewportY(e.rowIndex), f = 8, g = 16, m = 4, x = n.width - f;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let w = f;
    for (let y = 0; y < o.length; y++) {
      const C = o[y], v = this.ctx.measureText(C.label).width, R = g + m + v + f;
      if (w + R - f > x)
        break;
      const I = w, M = (n.height - g) / 2, E = M + g / 2, T = d >= I && d <= I + g && u >= M && u <= M + g, D = I + g + m, H = d >= D && d <= D + v && u >= E - 10 && u <= E + 10;
      if (T || H)
        return C;
      w += R;
    }
    return null;
  }
}
class _i extends ft {
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
    let o = !1;
    this.state.buttonHoverStates.forEach((s, n) => {
      const r = i - s.startTime, a = Math.abs(s.targetProgress - s.startProgress);
      if (a === 0) {
        this.state.buttonHoverStates.delete(n);
        return;
      }
      const l = e * a;
      let h = r / l;
      h = Math.max(0, Math.min(1, h));
      const c = s.startProgress + (s.targetProgress - s.startProgress) * h;
      s.progress = c, h >= 1 ? s.targetProgress === 0 && this.state.buttonHoverStates.delete(n) : o = !0;
    }), this.eventEmitter.emit(S.BUTTON_HOVER_ANIMATION_UPDATE), o ? requestAnimationFrame(() => this.runButtonHoverAnimationLoop()) : this.buttonHoverAnimationRunning = !1;
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
    let o = !1;
    this.state.switchAnimations.forEach((s, n) => {
      const r = i - s.startTime, a = Math.abs(s.targetProgress - s.startProgress), l = e * a;
      let h = r / l;
      h = Math.max(0, Math.min(1, h));
      const c = s.startProgress + (s.targetProgress - s.startProgress) * h;
      s.progress = c, h >= 1 ? this.state.switchAnimations.delete(n) : o = !0;
    }), this.eventEmitter.emit(S.SWITCH_ANIMATION_UPDATE), o ? requestAnimationFrame(() => this.runSwitchAnimationLoop()) : this.switchAnimationRunning = !1;
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
class Fi extends ft {
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
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.rows[t.rowIndex];
    if (!i || !o) {
      this.state.tooltip = null;
      return;
    }
    const s = ut(i, o, t.rowIndex), n = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), r = this.getCellViewportX(n, i), a = this.getCellViewportY(t.rowIndex);
    if (s.type === B.TAG && s.tags) {
      this.handleTagsTooltip(t, s.tags, n, r);
      return;
    }
    if (s.type === B.SELECT && s.select) {
      this.handleSelectTooltip(t, s.select, n, r);
      return;
    }
    if (s.type === B.IMAGE && s.image) {
      this.handleImageTooltip(t, s.image, n, r, a);
      return;
    }
    if (s.text) {
      this.handleTextTooltip(t, s.text, n, r);
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
    const o = i.renderResult.text;
    if (!o) {
      this.state.tooltip = null;
      return;
    }
    const s = this.getSummaryCellRect(
      e,
      t.band,
      i.startColumnIndex,
      i.endColumnIndex
    );
    if (!s) {
      this.state.tooltip = null;
      return;
    }
    const n = 8, r = s.width - n * 2, l = this.getFontSize() * 1.5, h = Ot(s.height, l, n);
    if (!(h > 1 ? Pt(this.ctx, o, r, h).isTruncated : this.ctx.measureText(o).width > r)) {
      this.state.tooltip = null;
      return;
    }
    this.state.tooltip = {
      cell: { rowIndex: -1, columnIndex: i.startColumnIndex },
      x: s.x,
      y: s.y,
      width: s.width,
      content: { type: "text", text: o }
    };
  }
  getSummaryCellRect(t, e, i, o) {
    const s = this.layoutManager.getRowBandsForRender(), n = e === "summary-top" ? s.summaryTop : s.summaryBottom, r = n.rows.indexOf(t);
    if (r < 0) return null;
    const a = this.layoutManager.getColumnOffset(i), l = this.layoutManager.getColumnOffset(o) + this.layoutManager.getColumnWidthByIndex(o), h = this.layoutManager.getLeafColumn(i), c = h != null && h.fixed ? a : a - this.scrollState.scrollLeft, d = n.y + n.rows.slice(0, r).reduce((u, f) => u + f.height, 0);
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
  handleTagsTooltip(t, e, i, o) {
    const s = this.getFontSize(), { isTruncated: n } = ge(this.ctx, e, i.width, i.height, s);
    if (!n) {
      this.state.tooltip = null;
      return;
    }
    this.state.tooltip = {
      cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
      x: o,
      y: this.getCellViewportY(t.rowIndex),
      width: i.width,
      content: { type: "tags", tags: e.tags }
    };
  }
  /**
   * Handle select tooltip
   */
  handleSelectTooltip(t, e, i, o) {
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
        x: o,
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
  handleImageTooltip(t, e, i, o, s) {
    const n = e.images;
    if (!n || n.length <= 1) {
      this.state.tooltip = null;
      return;
    }
    const r = this.canvas.getBoundingClientRect(), a = ae, l = 8, h = 8, c = 4, d = Math.ceil(n.length / c);
    let u;
    d <= 1 ? u = 1 : d <= 2 ? u = 2 : u = 3;
    const f = c * a + (c - 1) * h + l * 2, g = a + h, m = u * g + l * 2 - h;
    let x = s + i.height, w = !1;
    x + m > r.height && (x = s - m, w = !0);
    let y = o;
    y + f > r.width && (y = r.width - f - 4), y < 0 && (y = 4), this.state.imageTooltip = {
      cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
      x: y,
      y: x,
      images: n,
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows: u,
      showAbove: w
    };
  }
  /**
   * Handle text tooltip
   */
  handleTextTooltip(t, e, i, o) {
    const n = i.width - 16, a = this.getFontSize() * 1.5, l = Ot(i.height, a, 8);
    if (l > 1 ? Pt(this.ctx, e, n, l).isTruncated : this.ctx.measureText(e).width > n) {
      this.state.tooltip = {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        x: o,
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
    const o = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let s;
    i.fixed === "left" || i.fixed === "right" ? s = o.x : s = o.x - this.scrollState.scrollLeft;
    const n = this.getCellViewportY(t.rowIndex);
    this.state.tooltip.x = s, this.state.tooltip.y = n, this.state.tooltip.width = o.width;
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
  constructor(t, e, i, o, s, n, r = ht, a) {
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
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, o = t.clientY - e.top;
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
        const r = this.state.dateDropdown.cell;
        this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, r);
        return;
      }
      if (this.state.colorDropdown) {
        if (this.dropdownHandler.handleColorDropdownClick(t) || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const r = this.state.colorDropdown.cell;
        this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE, r);
        return;
      }
      if (this.state.dropdown) {
        if (this.dropdownHandler.handleDropdownClick(t)) return;
        const r = this.state.dropdown.cell;
        if (this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(r))
          return;
        this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE, r);
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
      const s = this.layoutManager.hitTest(i, o, this.getScrollbarBounds());
      switch (s.region) {
        case "scrollbar-vertical":
          this.scrollbarState.verticalDragging = !0, this.scrollbarState.dragStartY = t.clientY, this.scrollbarState.dragStartScrollTop = this.scrollState.scrollTop, this.canvas.style.cursor = "grabbing", this.bindDocumentEvents();
          return;
        case "scrollbar-horizontal":
          this.scrollbarState.horizontalDragging = !0, this.scrollbarState.dragStartX = t.clientX, this.scrollbarState.dragStartScrollLeft = this.scrollState.scrollLeft, this.canvas.style.cursor = "grabbing", this.bindDocumentEvents();
          return;
        case "header":
          if (s.isResizeHandle && s.resizeColumnIndex !== void 0) {
            this.state.isDragging = !0, this.state.dragType = "column-resize", this.resizeColumnIndex = s.resizeColumnIndex, this.resizeStartX = t.clientX, this.resizeStartWidth = this.layoutManager.getColumnWidthByIndex(
              s.resizeColumnIndex
            ), this.canvas.style.cursor = "col-resize";
            return;
          }
          s.headerCell && (this.headerHandler.handleHeaderMouseDown(
            s.headerCell.colIndex ?? -1,
            t
          ) || this.headerHandler.handleHeaderClick(s.headerCell.colIndex ?? -1, t));
          return;
        case "cell":
          const n = !!this.state.editingCell;
          if (n && this.shouldBlockEditingClose && await this.shouldBlockEditingClose(t))
            return;
          const r = n;
          if (this.rowHeightResizeEnabled && s.isRowResizeHandle && s.resizeRowIndex !== void 0 && this.isRowResizable(s.resizeRowIndex)) {
            if (!this.rows[s.resizeRowIndex]) return;
            const l = this.layoutManager.getRowHeightByIndex(s.resizeRowIndex);
            this.state.isDragging = !0, this.state.dragType = "row-resize", this.state.rowResizeState = {
              rowIndex: s.resizeRowIndex,
              startY: t.clientY,
              startHeight: l,
              displayHeight: l
            }, this.canvas.style.cursor = "ns-resize", this.bindDocumentEvents();
            return;
          }
          if (s.cell && this.handleControlClick(s.cell, t))
            return;
          if (s.cell) {
            t.shiftKey && this.state.selectedCells.length > 0 ? this.selectionHandler.handleRangeSelection(s.cell) : t.ctrlKey || t.metaKey ? this.selectionHandler.handleToggleSelection(s.cell) : (this.selectionHandler.handleSingleSelection(s.cell), r || (this.state.isSelecting = !0, this.state.selectionStart = s.cell));
            const a = this.getCellInfo(s.cell);
            a && this.eventEmitter.emit(S.CELL_CLICK, a, t);
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
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, o = t.clientY - e.top;
      this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE)), this.closeAllDropdowns();
      const n = this.layoutManager.getLayoutInfo().headerHeight;
      if (o <= n) {
        const m = this.layoutManager.getHeaderCellAtPosition(i, o);
        if (m) {
          const x = m.column;
          if (x.hideable === !1) return;
          const w = this.canvas.getBoundingClientRect(), y = 120, C = 32;
          let v = i, R = o;
          v + y > w.width && (v = w.width - y - 8), v < 0 && (v = 8), R + C > w.height && (R = w.height - C - 8), this.state.headerContextMenu = {
            x: v,
            y: R,
            columnKey: x.key,
            columnIndex: m.colIndex,
            hoveredIndex: -1
          }, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_OPEN);
          return;
        }
        return;
      }
      const r = this.layoutManager.getRowHitAtViewportPosition(
        i,
        o,
        this.scrollState.scrollTop
      );
      if (!r || r.band === "summary-top" || r.band === "summary-bottom") return;
      const a = r.row, l = this.getRowContextMenuItems(a), h = this.canvas.getBoundingClientRect(), c = 140, d = q.DROPDOWN_ITEM_HEIGHT, u = l.length * d;
      let f = i, g = o;
      f + c > h.width && (f = h.width - c - 8), f < 0 && (f = 8), g + u > h.height && (g = h.height - u - 8), g < 0 && (g = 8), this.state.contextMenu = {
        x: f,
        y: g,
        row: a,
        hoveredIndex: -1,
        items: l
      }, this.eventEmitter.emit(S.CONTEXT_MENU_OPEN);
    });
    b(this, "handleDocumentMouseMove", (t) => {
      var e;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { min: i, max: o } = this.layoutManager.getRowHeightBounds(), s = t.clientY - this.state.rowResizeState.startY;
        this.state.rowResizeState.displayHeight = tt(
          this.state.rowResizeState.startHeight + s,
          i,
          o
        ), this.eventEmitter.emit(S.ROW_RESIZE_DRAG);
        return;
      }
      if ((e = this.state.filterDropdown) != null && e.isScrollbarDragging) {
        const { options: i, scrollbarDragStartY: o, scrollbarDragStartScrollTop: s } = this.state.filterDropdown;
        if (!i) return;
        const n = q.DROPDOWN_ITEM_HEIGHT, r = q.DROPDOWN_MAX_VISIBLE, l = Math.min(i.length, r) * n, h = i.length * n, c = Math.max(20, l / h * l), d = l - c, f = (t.clientY - (o ?? 0)) / d, g = h - l, m = (s ?? 0) + f * g;
        this.state.filterDropdown.scrollTop = tt(m, 0, g), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
        return;
      }
      if (this.scrollbarState.verticalDragging) {
        const i = this.layoutManager.getLayoutInfo(), o = i.headerHeight, s = this.canvas.height / (window.devicePixelRatio || 1), n = s - o, r = Math.max(30, s / i.totalHeight * n), a = n - r, h = (t.clientY - this.scrollbarState.dragStartY) / a, c = this.scrollbarState.dragStartScrollTop + h * this.scrollState.maxScrollTop;
        this.scrollState.scrollTop = tt(c, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
          S.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
      if (this.scrollbarState.horizontalDragging) {
        const i = this.layoutManager.getLayoutInfo(), o = this.canvas.width / (window.devicePixelRatio || 1), s = Math.max(30, o / i.totalWidth * o), n = o - s, a = (t.clientX - this.scrollbarState.dragStartX) / n, l = this.scrollbarState.dragStartScrollLeft + a * this.scrollState.maxScrollLeft;
        this.scrollState.scrollLeft = tt(l, 0, this.scrollState.maxScrollLeft), this.eventEmitter.emit(
          S.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
    });
    b(this, "handleDocumentMouseUp", () => {
      var t;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, o = this.rows[e];
        o && this.eventEmitter.emit(S.ROW_HEIGHT_CHANGE, o, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
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
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, o = t.clientY - e.top;
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
          this.layoutManager.setColumnWidth(a.key, h), this.eventEmitter.emit(S.COLUMN_RESIZE, a, h);
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
            let w = !1;
            if ((f > d ? "right" : "left") === "right" ? w = l >= g : w = l < g, w) {
              this.eventEmitter.emit(S.COLUMN_SWAP, m.key, x.key), h.lastSwapTime = u, h.lastSwapTargetKey = void 0;
              const C = this.layoutManager.getColumnByKey(h.dragColumnKey);
              if (C) {
                const v = this.headerHandler.calculateSiblingColumns(C), R = v.findIndex(
                  (M) => M.key === h.dragColumnKey
                );
                h.siblingColumns = v, h.dragSiblingIndex = R >= 0 ? R : d;
                const I = v[h.dragSiblingIndex];
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
        const a = this.layoutManager.hitTest(i, o, this.getScrollbarBounds());
        a.region === "cell" && a.cell && a.cell.rowIndex >= 0 && this.selectionHandler.handleRangeSelection(a.cell);
        return;
      }
      const s = this.layoutManager.hitTest(i, o, this.getScrollbarBounds());
      switch (s.region) {
        case "scrollbar-vertical":
          this.scrollbarState.verticalHovered = !0, this.scrollbarState.horizontalHovered = !1, this.canvas.style.cursor = "grab", this.state.tooltip = null;
          return;
        case "scrollbar-horizontal":
          this.scrollbarState.horizontalHovered = !0, this.scrollbarState.verticalHovered = !1, this.canvas.style.cursor = "grab", this.state.tooltip = null;
          return;
      }
      if (this.scrollbarState.verticalHovered = !1, this.scrollbarState.horizontalHovered = !1, s.region === "header") {
        if (s.isResizeHandle) {
          this.canvas.style.cursor = "col-resize", this.state.tooltip = null, this.state.hoveredHeaderColumnKey = void 0;
          return;
        }
        s.headerCell && this.headerHandler.handleHeaderHover(s.headerCell, i, o);
        return;
      }
      if (s.region === "cell" && s.rowHit && (s.rowHit.band === "summary-top" || s.rowHit.band === "summary-bottom")) {
        this.canvas.style.cursor = "default", this.state.hoveredCell = null, this.tooltipHandler.checkSummaryTooltip(s.rowHit);
        return;
      }
      if (s.region === "cell" && s.cell) {
        if (this.rowHeightResizeEnabled && s.isRowResizeHandle && s.resizeRowIndex !== void 0 && this.isRowResizable(s.resizeRowIndex)) {
          this.canvas.style.cursor = "ns-resize", this.state.tooltip = null;
          return;
        }
        const a = s.cell;
        this.updateButtonHoverState(a, i, o);
        const l = this.layoutManager.getLeafColumns(), h = a.columnIndex >= 0 ? l[a.columnIndex] : void 0, c = a.rowIndex >= 0 ? this.rows[a.rowIndex] : void 0;
        if ((h && c ? !this.editorRegistry.getStrategy(h).canEdit(a, c, h) : !1) ? this.canvas.style.cursor = "not-allowed" : this.isClickableElement(a, i, o) ? this.canvas.style.cursor = "pointer" : h && h.key.startsWith("__hidden_placeholder__") ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", ((n = this.state.hoveredCell) == null ? void 0 : n.rowIndex) !== a.rowIndex || ((r = this.state.hoveredCell) == null ? void 0 : r.columnIndex) !== a.columnIndex) {
          this.state.hoveredCell = a.rowIndex >= 0 ? a : null;
          const u = this.state.hoveredCell ? this.getCellInfo(this.state.hoveredCell) : null;
          this.eventEmitter.emit(S.CELL_HOVER, u, t);
        }
        this.updateImageHoverIndex(a, i, o), this.updateButtonsHoverIndex(a, i, o), this.state.hoveredHeaderColumnKey !== void 0 && (this.state.hoveredHeaderColumnKey = void 0, this.eventEmitter.emit(S.HEADER_HOVER, void 0)), this.checkTooltip(a);
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
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, o = this.rows[e];
        o && this.eventEmitter.emit(S.ROW_HEIGHT_CHANGE, o, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
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
    b(this, "handleMouseLeave", () => {
      const t = this.state.hoveredHeaderColumnKey !== void 0;
      this.state.hoveredCell = null, this.state.hoveredHeaderColumnKey = void 0, this.state.hoveredImageIndex = -1, this.state.hoveredButtonIndex = -1, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.columnReorderState = void 0, this.scrollbarState.verticalHovered = !1, this.scrollbarState.horizontalHovered = !1, this.clearAllButtonHoverStates(), t && this.eventEmitter.emit(S.HEADER_HOVER, void 0);
    });
    b(this, "handleDblClick", async (t) => {
      var h;
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, o = t.clientY - e.top;
      if (this.shouldBlockEditingClose && await this.shouldBlockEditingClose(t))
        return;
      if (this.state.dateDropdown) {
        const { x: c, y: d, width: u } = this.state.dateDropdown, y = 40 + 28 + 6 * 28 + 8 * 2;
        if (i >= c && i <= c + u && o >= d && o <= d + y || this.shouldBlockEditingClose && await this.shouldBlockEditingClose())
          return;
        const C = this.state.dateDropdown.cell;
        this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE, C);
      }
      if (this.state.dropdown) {
        const { x: c, y: d, width: u, type: f, tagsConfig: g, config: m } = this.state.dropdown, x = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE;
        let y;
        f === "tags" && g ? y = ((h = g.options) == null ? void 0 : h.length) ?? 0 : y = m.options.length;
        const v = Math.min(y, w) * x;
        if (i >= c && i <= c + u && o >= d && o <= d + v)
          return;
        const R = this.state.dropdown.cell;
        if (this.shouldBlockDropdownClose && await this.shouldBlockDropdownClose(R))
          return;
        this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE, null);
      }
      if (this.state.filterDropdown) {
        const { x: c, y: d, width: u, mode: f, options: g } = this.state.filterDropdown, m = 8, x = 36, w = q.DROPDOWN_ITEM_HEIGHT, y = q.DROPDOWN_MAX_VISIBLE;
        let C;
        switch (f) {
          case "search": {
            C = 36 + x + m;
            break;
          }
          case "select": {
            C = 36 + Math.min((g == null ? void 0 : g.length) ?? 0, y) * w + x;
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
        if (i >= c && i <= c + u && o >= d && o <= d + C)
          return;
        this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE);
      }
      const s = this.layoutManager.getCellAtViewportPosition(
        i,
        o,
        this.scrollState.scrollTop
      );
      if (!s || s.rowIndex < 0) return;
      const r = this.layoutManager.getLeafColumns()[s.columnIndex], a = this.rows[s.rowIndex], l = [
        B.CHECKBOX,
        B.RADIO,
        B.BUTTON,
        B.SWITCH,
        B.RATING
      ];
      if (r && a) {
        const c = ut(r, a, s.rowIndex);
        if (c.type && l.includes(c.type))
          return;
        if (c.type === B.PROGRESS && c.progress) {
          if (c.progress.interactive !== !0 || !this.editorRegistry.getStrategy(r).canEdit(s, a, r)) return;
          this.eventEmitter.emit(S.CELL_DBL_CLICK, this.getCellInfo(s), t), this.eventEmitter.emit(S.ROW_DBL_CLICK, a, s.rowIndex, t), this.editingConfig.enabled !== !1 && this.startEditing(s, {
            value: String(c.progress.value),
            type: "number",
            placeholder: "0-100"
          });
          return;
        }
        if (c.type === B.COLOR && c.color) {
          const d = this.layoutManager.getCellPosition(s.rowIndex, s.columnIndex), u = this.getCellViewportX(d, r), f = this.getCellViewportY(s.rowIndex), m = Math.min(d.height - 8 * 2, 24), x = u + (d.width - m) / 2, w = f + (d.height - m) / 2;
          if (!(i >= x && i <= x + m && o >= w && o <= w + m)) return;
        }
        if (!this.editorRegistry.getStrategy(r).canEdit(s, a, r)) return;
        if (this.eventEmitter.emit(S.CELL_DBL_CLICK, this.getCellInfo(s), t), this.eventEmitter.emit(S.ROW_DBL_CLICK, a, s.rowIndex, t), this.editingConfig.enabled !== !1) {
          const d = this.getEditConfig(r, a, s.rowIndex);
          d ? d.type === B.SELECT && d.select ? this.startSelectEditing(s, d.select) : d.type === B.TAG && d.tags ? this.startTagsEditing(s, d.tags) : d.type === B.DATE && d.date ? this.startDateEditing(s, d.date) : d.type === B.COLOR && d.color ? this.startColorEditing(s, d.color) : d.type === B.INPUT || !d.type ? this.startEditing(s, d.input) : this.startEditing(s, d.input) : c.type === B.SELECT && c.select ? this.startSelectEditing(s, c.select) : c.type === B.TAG && c.tags && c.tags.editable ? this.startTagsEditing(s, c.tags) : c.type === B.DATE && c.date ? this.startDateEditing(s, c.date) : c.type === B.COLOR && c.color ? this.startColorEditing(s, c.color) : c.type === B.IMAGE && c.image ? this.startImageEditing(s, c.image) : this.startEditing(s, c.input);
        }
      }
    });
    b(this, "handleControlClick", (t, e) => {
      var a, l;
      const o = this.layoutManager.getLeafColumns()[t.columnIndex], s = this.rows[t.rowIndex];
      if (!o || !s) return !1;
      if (o.key.startsWith("__hidden_placeholder__")) {
        const h = o._hiddenColumnKey;
        if (h)
          return this.eventEmitter.emit(S.COLUMN_SHOW, h), !0;
      }
      if (this.expandColumnKey === o.key && s.children && s.children.length > 0 && this.handleExpandIconClick(t, e, s))
        return !0;
      const n = ut(o, s, t.rowIndex), r = !this.editorRegistry.getStrategy(o).canEdit(t, s, o);
      if (n.type === B.CHECKBOX && n.checkbox) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, o), g = this.getCellViewportY(t.rowIndex), m = 16, x = f + (h.width - m) / 2, w = g + (h.height - m) / 2;
        if (d >= x && d <= x + m && u >= w && u <= w + m && !r) {
          const C = !n.checkbox.checked;
          return this.eventEmitter.emit(S.CHECKBOX_CHANGE, this.getCellInfo(t), C), !0;
        }
        return !1;
      }
      if (n.type === B.RADIO && n.radio) {
        if (r) return !1;
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
      if (n.type === B.BUTTON && n.button) {
        if (r) return !1;
        const h = n.button, c = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), d = this.canvas.getBoundingClientRect(), u = e.clientX - d.left, f = e.clientY - d.top, g = this.getCellViewportX(c, o), m = this.getCellViewportY(t.rowIndex), x = u - g, w = f - m;
        if (Array.isArray(h)) {
          const O = n.buttonOptions ?? {}, k = 8, P = O.gap ?? 4, L = O.maxVisible ?? 3, W = 24, A = (c.height - W) / 2, _ = h.filter((G) => G.visible !== !1), F = _.slice(0, L), V = _.slice(L);
          let z = k;
          for (let G = 0; G < F.length; G++) {
            const Y = F[G], U = Y.text ?? this.locale.cell.buttonText;
            this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            const X = this.ctx.measureText(U).width, j = Math.max(X + 16, 40);
            if (w >= A && w <= A + W && x >= z && x <= z + j)
              return this.eventEmitter.emit(
                S.BUTTON_CLICK,
                this.getCellInfo(t),
                Y.actionKey
              ), !0;
            z += j + P;
          }
          if (V.length > 0) {
            const G = O.moreButtonText ?? "···";
            this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            const Y = this.ctx.measureText(G).width, U = Math.max(Y + 16, 32);
            if (w >= A && w <= A + W && x >= z && x <= z + U) {
              const X = g + z, j = q.DROPDOWN_ITEM_HEIGHT, it = V.length * j, ot = this.canvas.getBoundingClientRect();
              let K = m + A + W + 4, et = !1;
              return K + it > ot.height && (K = m + A - it - 4, et = !0), this.state.buttonsDropdown = {
                cell: t,
                x: X,
                y: K,
                buttons: V,
                hoveredIndex: -1,
                buttonRelativeX: z,
                buttonY: A,
                buttonHeight: W,
                showAbove: et
              }, this.eventEmitter.emit(S.DROPDOWN_OPEN), !0;
            }
          }
          return !1;
        }
        const y = h.size === "small" ? 24 : h.size === "large" ? 40 : 32, C = (c.height - y) / 2, v = h.text ?? this.locale.cell.buttonText, R = 13;
        this.ctx.font = `${R}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const I = this.ctx.measureText(v).width, T = Math.min(
          Math.max(I + 16 * 2, 60),
          c.width - 8 * 2
        ), D = (c.width - T) / 2;
        return w >= C && w <= C + y && x >= D && x <= D + T ? (this.eventEmitter.emit(
          S.BUTTON_CLICK,
          this.getCellInfo(t),
          h.actionKey
        ), !0) : !1;
      }
      if (n.type === B.SWITCH && n.switch) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, o), g = this.getCellViewportY(t.rowIndex), m = d - f, x = u - g, w = 44, y = 22, C = (h.width - w) / 2, v = (h.height - y) / 2;
        if (!(m >= C && m <= C + w && x >= v && x <= v + y)) return !1;
        const I = `${t.rowIndex}-${t.columnIndex}`, M = this.state.switchAnimations.get(I), E = n.switch.checked ?? !1, T = M ? M.progress : E ? 1 : 0, D = T < 0.5 ? 1 : 0, H = D === 1;
        return E !== H && this.eventEmitter.emit(S.SWITCH_CHANGE, this.getCellInfo(t), H), this.state.switchAnimations.set(I, {
          cell: t,
          progress: T,
          targetProgress: D,
          startTime: Date.now(),
          startProgress: T
        }), this.startSwitchAnimationLoop(), !0;
      }
      if (n.type === B.INPUT && n.input)
        return r || n.input.readonly, !1;
      if (n.type === B.LINK && n.link) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, o), g = this.getCellViewportY(t.rowIndex), m = d - f, x = u - g, w = n.link, y = w.link, C = w.text || w.link;
        if (!y || !C) return !1;
        const v = 8, R = 13;
        this.ctx.font = `${R}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const I = h.width - v * 2;
        let M = this.ctx.measureText(C).width, E = C;
        if (M > I) {
          const L = "...";
          for (; E.length > 0 && this.ctx.measureText(E + L).width > I; )
            E = E.slice(0, -1);
          E += L, M = this.ctx.measureText(E).width;
        }
        const T = o.align ?? "left";
        let D;
        switch (T) {
          case "center":
            D = (h.width - M) / 2;
            break;
          case "right":
            D = h.width - v - M;
            break;
          default:
            D = v;
        }
        const H = (h.height - R) / 2;
        if (!(m >= D && m <= D + M && x >= H && x <= H + R)) return !1;
        const k = Date.now(), P = ((a = this._lastClickCell) == null ? void 0 : a.rowIndex) === t.rowIndex && ((l = this._lastClickCell) == null ? void 0 : l.columnIndex) === t.columnIndex && k - this._lastClickTime < 350;
        return this._lastClickTime = k, this._lastClickCell = { rowIndex: t.rowIndex, columnIndex: t.columnIndex }, P ? !1 : (window.open(y, "_blank", "noopener,noreferrer"), !0);
      }
      if (n.type === B.PROGRESS && n.progress) {
        const h = this.handleProgressClick(t, e, n.progress, o, s);
        if (h) {
          const c = n.progress.precision ?? 0, d = c === 0 ? Math.round(n.progress.value) : Number(n.progress.value.toFixed(c));
          this.state.isDragging = !0, this.state.dragType = "progress-drag", this.state.progressDragState = {
            cell: t,
            config: n.progress,
            column: o,
            row: s,
            startX: e.clientX,
            startValue: n.progress.value,
            displayValue: d
          }, this.canvas.style.cursor = "grabbing", this.bindDocumentEvents();
        }
        return h;
      }
      if (n.type === B.RATING && n.rating)
        return this.handleRatingClick(t, e, n.rating, o, s);
      if (n.type === B.COLOR && n.color) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, o), d = this.getCellViewportY(t.rowIndex), u = this.canvas.getBoundingClientRect(), f = e.clientX - u.left, g = e.clientY - u.top, x = Math.min(h.height - 8 * 2, 24), w = c + (h.width - x) / 2, y = d + (h.height - x) / 2;
        return f >= w && f <= w + x && g >= y && g <= y + x ? (this.startColorEditing(t, n.color), !0) : !1;
      }
      if (n.type === B.IMAGE && n.image) {
        if (n.image.clickable === !1) return !1;
        const h = n.image, c = h.images, d = this.canvas.getBoundingClientRect(), u = e.clientX - d.left, f = e.clientY - d.top, g = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), m = this.getCellViewportX(g, o), x = this.getCellViewportY(t.rowIndex), w = u - m, y = f - x, C = 4, v = Math.min(g.width, g.height) - C * 2, R = h.width ?? 32, I = h.height ?? 32, M = Math.min(R, v), E = Math.min(I, v), T = h.gap ?? 4;
        if (c && c.length > 1) {
          const P = h.maxVisible ?? 3, L = h.showMoreCount !== !1, W = g.width - C * 2, A = Math.floor((W + T) / (M + T)), F = Math.max(1, A - (L ? 1 : 0)), V = Math.min(P, F), z = c.length > V ? V : c.length, G = c.length > V;
          let Y;
          G && L ? Y = z * M + z * T + M : Y = z * M + Math.max(0, z - 1) * T;
          let U = (g.width - Y) / 2;
          U = Math.max(C, U);
          const X = (g.height - E) / 2, j = w - U, it = y - X;
          if (j < 0 || j > Y || it < 0 || it > E)
            return !1;
          const ot = Math.floor(j / (M + T));
          if (G && L && ot === z)
            return !1;
          if (ot >= 0 && ot < c.length) {
            const K = c[ot];
            if (K)
              return this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(t), K, e), !0;
          }
          return !1;
        }
        const D = (g.width - M) / 2, H = (g.height - E) / 2;
        if (!(w >= D && w <= D + M && y >= H && y <= H + E)) return !1;
        const k = h.src || c && c[0];
        return k ? (this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(t), k, e), !0) : !1;
      }
      return !1;
    });
    b(this, "handleProgressClick", (t, e, i, o, s) => this.controlClickHandler.handleProgressClick(t, e, i, o, s));
    b(this, "handleProgressDragMove", (t) => {
      const e = this.state.progressDragState;
      if (!e) return;
      const { cell: i, config: o, column: s } = e, n = this.canvas.getBoundingClientRect(), r = t.clientX - n.left, a = this.layoutManager.getCellPosition(i.rowIndex, i.columnIndex), l = this.getCellViewportX(a, s), h = o.shape ?? "line";
      if (h === "line") {
        const d = o.textPosition ?? "right", f = (o.showText ?? !0) && d === "right" ? 40 : 0, g = o.width ?? a.width - 8 * 2 - f, m = l + 8, x = r - m, w = o.precision ?? 0, y = Math.max(0, Math.min(100, x / g * 100)), C = w === 0 ? Math.round(y) : Number(y.toFixed(w));
        e.displayValue = C, this.eventEmitter.emit(S.PROGRESS_DRAG);
      } else if (h === "circle" || h === "dashboard") {
        const c = t.clientY - n.top, d = this.getCellViewportY(i.rowIndex);
        let u = 0;
        h === "dashboard" && (u = a.height * 0.05);
        const f = l + a.width / 2, g = d + a.height / 2 + u, m = r - f, x = c - g;
        let w = Math.atan2(x, m), y;
        if (h === "circle")
          w = w + Math.PI / 2, w < 0 && (w += Math.PI * 2), y = w / (Math.PI * 2) * 100;
        else {
          const v = Math.PI * 0.75, R = Math.PI * 1.5;
          w < 0 && (w += Math.PI * 2);
          let I = w - v;
          I < 0 && (I += Math.PI * 2), y = I / R * 100;
        }
        y = Math.max(0, Math.min(100, y));
        const C = o.precision ?? 0;
        y = C === 0 ? Math.round(y) : Number(y.toFixed(C)), e.displayValue = y, this.eventEmitter.emit(S.PROGRESS_DRAG);
      }
    });
    b(this, "handleRatingClick", (t, e, i, o, s) => this.controlClickHandler.handleRatingClick(t, e, i, o, s));
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
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g } = this.state.imageTooltip, m = q.IMAGE_SIZE, x = 8, w = 8, y = 4, R = y * m + (y - 1) * w + x * 2 + 4 + 4, I = m + w, M = f * I + x * 2 - w;
        if (l >= c && l <= c + R && h >= d && h <= d + M) {
          const T = Math.ceil(u.length / y), D = Math.max(0, (T - f) * I), H = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (D > 0 && H) {
            const k = g <= 0.5 && t.deltaY < 0, P = g >= D - 0.5 && t.deltaY > 0;
            if (!k && !P) {
              this.state.imageTooltip.scrollTop = tt(g + t.deltaY, 0, D), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageTooltipPosition();
      }
      if (this.state.imageEditor) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g, pendingImages: m } = this.state.imageEditor, x = q.IMAGE_SIZE, w = 8, y = 8, C = 4, v = 60, R = x + y, I = C * x + (C - 1) * y + w * 2 + 4 + 4, M = f * R + w * 2 - y, E = v + M;
        if (l >= c && l <= c + I && h >= d && h <= d + E) {
          const D = u.length + m.length, H = Math.ceil(D / C), O = Math.max(0, (H - f) * R), k = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (O > 0 && k) {
            const L = g <= 0.5 && t.deltaY < 0, W = g >= O - 0.5 && t.deltaY > 0;
            if (!L && !W) {
              this.state.imageEditor.scrollTop = tt(g + t.deltaY, 0, O), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageEditorPosition();
      }
      if (this.state.filterDropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, mode: f, options: g, scrollTop: m } = this.state.filterDropdown;
        if (f === "select" && g) {
          const w = q.DROPDOWN_ITEM_HEIGHT, y = q.DROPDOWN_MAX_VISIBLE, C = Math.min(g.length, y), v = 32, R = 4, I = C * w, M = 8 + v + R + I + R + 36;
          if (l >= c && l <= c + u && h >= d && h <= d + M) {
            const T = Math.abs(t.deltaY) >= Math.abs(t.deltaX), D = Math.max(0, g.length * w - I);
            if (D > 0 && T) {
              const O = m <= 0.5 && t.deltaY < 0, k = m >= D - 0.5 && t.deltaY > 0;
              if (!O && !k) {
                this.state.filterDropdown.scrollTop = tt(m + t.deltaY, 0, D), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
                return;
              }
            }
          }
        }
        this.dropdownHandler.updateFilterDropdownPosition();
      }
      if (this.state.dropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, type: f, tagsConfig: g, config: m, scrollTop: x } = this.state.dropdown, w = q.DROPDOWN_ITEM_HEIGHT, y = q.DROPDOWN_MAX_VISIBLE;
        let C;
        f === "tags" && g ? C = ((r = g.options) == null ? void 0 : r.length) ?? 0 : C = m.options.length;
        const R = Math.min(C, y) * w;
        if (l >= c && l <= c + u && h >= d && h <= d + R) {
          const M = Math.abs(t.deltaY) >= Math.abs(t.deltaX), E = Math.max(0, C * w - R);
          if (E > 0 && M) {
            const D = x ?? 0, H = D <= 0.5 && t.deltaY < 0, O = D >= E - 0.5 && t.deltaY > 0;
            if (!H && !O) {
              this.state.dropdown.scrollTop = tt(D + t.deltaY, 0, E), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.DROPDOWN_HOVER);
              return;
            }
          }
        }
        this.dropdownHandler.updateDropdownPosition();
      }
      this.updateAllDropdownPositions(), t.preventDefault();
      const i = t.deltaX, o = t.deltaY, s = tt(
        this.scrollState.scrollLeft + i,
        0,
        this.scrollState.maxScrollLeft
      ), n = tt(
        this.scrollState.scrollTop + o,
        0,
        this.scrollState.maxScrollTop
      );
      (s !== this.scrollState.scrollLeft || n !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = s, this.scrollState.scrollTop = n, this.scrollState.isScrolling = !0, this.eventEmitter.emit(S.SCROLL, s, n), this.checkLazyLoad(n, o), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
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
    b(this, "isDomEditorActive", null);
    b(this, "startSwitchAnimationLoop", () => {
      this.buttonAnimationHandler.startSwitchAnimationLoop();
    });
    b(this, "getSwitchAnimations", () => this.buttonAnimationHandler.getSwitchAnimations());
    this.canvas = t, this.ctx = t.getContext("2d"), this.layoutManager = e, this.dataManager = i, this.eventEmitter = o, this.editingConfig = n, this.locale = r, this.editorRegistry = a, this.state = {
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
    this.handlerContext = t, this.editingHandler = new _t(t, this.eventEmitter, this.editingConfig), this.dropdownHandler = new Ft(t, this.eventEmitter), this.selectionHandler = new Bi(t, this.eventEmitter), this.navigationHandler = new Li(
      t,
      this.eventEmitter,
      this.selectionHandler,
      this.editingConfig
    ), this.contextMenuHandler = new Vt(t, this.eventEmitter), this.imageHandler = new Nt(t, this.eventEmitter), this.headerHandler = new Wi(
      t,
      this.eventEmitter,
      this.sortConfig,
      this.filterConfig
    ), this.controlClickHandler = new Ai(t, this.eventEmitter), this.buttonAnimationHandler = new _i(t, this.eventEmitter), this.tooltipHandler = new Fi(t, this.eventEmitter);
  }
  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  getCellInfo(t) {
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.rows[t.rowIndex];
    return !i || !o ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: o,
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
    const s = (e.render ? e.render(
      i.data[$(e)],
      i,
      e,
      this.state.imageEditor.cell.rowIndex
    ) : { image: i.data[$(e)] }).image ?? {}, n = document.createElement("input");
    n.type = "file", n.accept = s.accept ?? "image/*", n.multiple = !this.state.imageEditor.isSingleImage && s.multiple !== !1, n.onchange = async (r) => {
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
    const o = t && t.rowIndex >= 0 ? `${t.rowIndex}-${t.columnIndex}` : null;
    if (this.state.buttonHoverStates.forEach((T, D) => {
      D !== o && T.progress > 0 && this.state.buttonHoverStates.set(D, {
        ...T,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: T.progress
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
    const a = ut(n, r, t.rowIndex);
    if (a.type !== B.BUTTON || !a.button || Array.isArray(a.button) || !this.editorRegistry.getStrategy(n).canEdit(t, r, n)) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const l = a.button, h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, n), d = this.getCellViewportY(t.rowIndex), u = e - c, f = i - d, g = l.size === "small" ? 24 : l.size === "large" ? 40 : 32, m = (h.height - g) / 2, x = l.text ?? this.locale.cell.buttonText, w = 13;
    this.ctx.font = `${w}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const y = this.ctx.measureText(x).width, R = Math.min(
      Math.max(y + 16 * 2, 60),
      h.width - 8 * 2
    ), I = (h.width - R) / 2, M = f >= m && f <= m + g && u >= I && u <= I + R, E = `${t.rowIndex}-${t.columnIndex}`;
    if (M) {
      const T = this.state.buttonHoverStates.get(E);
      if (!T || T.targetProgress !== 1) {
        const D = T ? T.progress : 0;
        this.state.buttonHoverStates.set(E, {
          cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
          progress: D,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: D
        }), this.startButtonHoverAnimationLoop();
      }
    } else {
      const T = this.state.buttonHoverStates.get(E);
      T && T.progress > 0 && (this.state.buttonHoverStates.set(E, {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        progress: T.progress,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: T.progress
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
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (!s || !n) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const r = ut(s, n, t.rowIndex);
    if (r.type !== B.IMAGE || !r.image) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const a = r.image, l = a.images, h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, s), d = this.getCellViewportY(t.rowIndex), u = e - c, f = i - d, g = 4, x = a.scaleWithRowHeight === !1 ? Math.min(h.height, 32) : h.height, w = Math.max(0, Math.min(h.width, x) - g * 2), y = a.width ?? 32, C = a.height ?? 32, v = Math.min(y, w), R = Math.min(C, w), I = a.gap ?? 4;
    if (!l || l.length <= 1) {
      const K = (h.width - v) / 2, et = (h.height - R) / 2, rt = u >= K && u <= K + v && f >= et && f <= et + R;
      this.state.hoveredImageIndex = rt && a.hoverable !== !1 ? 0 : -1;
      return;
    }
    const M = h.width - g * 2, E = h.height - g * 2, T = a.showMoreCount !== !1, D = a.maxVisible, H = Math.max(1, Math.floor((M + I) / (v + I))), O = Math.max(1, Math.floor((E + I) / (R + I))), k = H * O, P = D ?? k, W = T && l.length > P ? Math.max(0, k - 1) : k, A = Math.min(P, W), _ = l.length > A, F = _ ? A : l.length, V = F + (_ && T ? 1 : 0), z = Math.max(1, Math.ceil(V / H)), G = Math.min(V, H), Y = G * v + Math.max(0, G - 1) * I, U = z * R + Math.max(0, z - 1) * I;
    let X = (h.width - Y) / 2;
    X = Math.max(g, X);
    const j = (h.height - U) / 2, it = u - X, ot = f - j;
    for (let K = 0; K < F; K++) {
      const et = Math.floor(K / H), at = K % H * (v + I), J = et * (R + I);
      if (it >= at && it < at + v && ot >= J && ot < J + R) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? K : -1;
        return;
      }
    }
    if (_ && T) {
      const K = Math.floor(F / H), rt = F % H * (v + I), at = K * (R + I);
      if (it >= rt && it < rt + v && ot >= at && ot < at + R) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? F : -1;
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
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (!s || !n) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const r = ut(s, n, t.rowIndex);
    if (r.type !== B.BUTTON || !r.button || !Array.isArray(r.button)) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    if (!this.editorRegistry.getStrategy(s).canEdit(t, n, s)) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const a = r.button, l = r.buttonOptions ?? {}, h = a.filter((M) => M.visible !== !1), c = l.maxVisible ?? 3, d = l.gap ?? 4, u = 8, f = 24, g = h.slice(0, c), m = h.slice(c), x = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), w = this.getCellViewportX(x, s), C = this.getCellViewportY(t.rowIndex) + (x.height - f) / 2, v = i - C;
    if (v < 0 || v > f) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    let R = w + u;
    const I = 13;
    this.ctx.font = `${I}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    for (let M = 0; M < g.length; M++) {
      const T = g[M].text ?? this.locale.cell.buttonText, D = this.ctx.measureText(T).width, H = Math.max(D + 16, 40);
      if (e >= R && e < R + H) {
        this.state.hoveredButtonIndex = M;
        return;
      }
      R += H + d;
    }
    if (m.length > 0) {
      const M = l.moreButtonText ?? "···", E = this.ctx.measureText(M).width, T = Math.max(E + 16, 32);
      if (e >= R && e < R + T) {
        this.state.hoveredButtonIndex = c;
        return;
      }
    }
    this.state.hoveredButtonIndex = -1;
  }
  isClickableElement(t, e, i) {
    if (!t) return !1;
    if (t.rowIndex === -1)
      return !0;
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (!s || !n) return !1;
    const r = ut(s, n, t.rowIndex), a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), l = !this.editorRegistry.getStrategy(s).canEdit(t, n, s), h = this.getCellViewportX(a, s), c = this.getCellViewportY(t.rowIndex), d = e - h, u = i - c;
    if (r.type === B.CHECKBOX && r.checkbox) {
      if (l) return !1;
      const f = 16, g = (a.width - f) / 2, m = (a.height - f) / 2;
      return d >= g && d <= g + f && u >= m && u <= m + f;
    }
    if (r.type === B.RADIO && r.radio) {
      if (l) return !1;
      const f = 16;
      if (r.radio.options && r.radio.options.length > 0) {
        const x = a.width - 8;
        this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        let w = 8;
        for (let y = 0; y < r.radio.options.length; y++) {
          const C = r.radio.options[y];
          if (C.disabled) {
            const O = this.ctx.measureText(C.label).width;
            w += f + 4 + O + 8;
            continue;
          }
          const v = this.ctx.measureText(C.label).width, R = f + 4 + v + 8;
          if (w + R - 8 > x)
            break;
          const I = w, M = (a.height - f) / 2, E = M + f / 2, T = d >= I && d <= I + f && u >= M && u <= M + f, D = I + f + 4, H = d >= D && d <= D + v && u >= E - 10 && u <= E + 10;
          if (T || H)
            return !0;
          w += R;
        }
        return !1;
      } else {
        const g = (a.width - f) / 2, m = (a.height - f) / 2;
        return d >= g && d <= g + f && u >= m && u <= m + f;
      }
    }
    if (r.type === B.BUTTON && r.button) {
      if (l) return !1;
      const f = r.button;
      if (Array.isArray(f)) {
        const w = r.buttonOptions ?? {}, y = 8, C = w.gap ?? 4, v = w.maxVisible ?? 3, R = 24, I = (a.height - R) / 2, M = f.filter((D) => D.visible !== !1), E = M.slice(0, v);
        let T = y;
        for (const D of E) {
          const H = D.text ?? this.locale.cell.buttonText;
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const O = this.ctx.measureText(H).width, k = Math.max(O + 16, 40);
          if (u >= I && u <= I + R && d >= T && d <= T + k)
            return !0;
          T += k + C;
        }
        if (M.length > v) {
          const D = w.moreButtonText ?? "···";
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const H = this.ctx.measureText(D).width, O = Math.max(H + 16, 32);
          if (u >= I && u <= I + R && d >= T && d <= T + O)
            return !0;
        }
        return !1;
      }
      const g = f.size === "small" ? 24 : f.size === "large" ? 40 : 32, m = (a.height - g) / 2, x = 8;
      return u >= m && u <= m + g && d >= x && d <= a.width - x;
    }
    if (r.type === B.SWITCH && r.switch) {
      if (l) return !1;
      const f = 44, g = 22, m = (a.width - f) / 2, x = (a.height - g) / 2;
      return d >= m && d <= m + f && u >= x && u <= x + g;
    }
    if (r.type === B.SELECT && r.select)
      return !l;
    if (r.type === B.TAG && r.tags)
      return !0;
    if (r.type === B.INPUT && r.input)
      return !(l || r.input.readonly);
    if (r.type === B.LINK && r.link) {
      const f = r.link, g = f.text || f.link;
      if (!g) return !1;
      const m = 8, x = 13;
      this.ctx.font = `${x}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      const w = a.width - m * 2;
      let y = this.ctx.measureText(g).width, C = g;
      if (y > w) {
        const M = "...";
        for (; C.length > 0 && this.ctx.measureText(C + M).width > w; )
          C = C.slice(0, -1);
        C += M, y = this.ctx.measureText(C).width;
      }
      const v = s.align ?? "left";
      let R;
      switch (v) {
        case "center":
          R = (a.width - y) / 2;
          break;
        case "right":
          R = a.width - m - y;
          break;
        default:
          R = m;
      }
      const I = (a.height - x) / 2;
      return d >= R && d <= R + y && u >= I && u <= I + x;
    }
    if (r.type === B.IMAGE && r.image) {
      const f = r.image;
      if (f.clickable === !1) return !1;
      const g = f.images;
      if (!g || g.length <= 1)
        return !!(f.src || g && g[0]);
      const m = this.state.hoveredImageIndex ?? -1;
      return m >= 0 && m < g.length;
    }
    if (r.type === B.PROGRESS && r.progress) {
      const f = r.progress;
      if (f.interactive !== !0 || l) return !1;
      const g = f.shape ?? "line";
      if (g === "line") {
        const x = f.size ?? "medium", w = f.height ?? (x === "small" ? 6 : x === "large" ? 16 : 10), y = f.textPosition ?? "right", v = (f.showText ?? !0) && y === "right" ? 40 : 0, R = f.width ?? a.width - 8 * 2 - v, I = 8, M = (a.height - w) / 2;
        return d >= I && d <= I + R && u >= M && u <= M + w;
      }
      if (g === "circle" || g === "dashboard") {
        const m = f.size ?? "medium";
        let x, w = 0;
        g === "circle" ? x = m === "small" ? 0.6 : m === "large" ? 0.9 : 0.75 : (x = m === "small" ? 0.7 : m === "large" ? 0.95 : 0.85, w = a.height * 0.05);
        const y = Math.floor(a.height * x), C = f.width ?? y, v = f.strokeWidth ?? Math.max(2, Math.round(C * 0.12)), R = a.width / 2, I = a.height / 2 + w, M = (C - v) / 2, E = d - R, T = u - I, D = Math.sqrt(E * E + T * T);
        return D >= M - v && D <= M + v;
      }
    }
    if (r.type === B.RATING && r.rating) {
      if (l) return !1;
      const f = r.rating, g = f.max ?? 5, m = f.starSize ?? 16, x = g * m, w = (a.width - x) / 2, y = (a.height - m) / 2;
      return d >= w && d <= w + x && u >= y && u <= y + m;
    }
    if (r.type === B.COLOR && r.color) {
      if (l) return !1;
      const g = Math.min(a.height - 8 * 2, 24), m = (a.width - g) / 2, x = (a.height - g) / 2;
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
    const o = this.layoutManager.getLayoutInfo(), s = o.viewportHeight, n = o.headerHeight, r = o.totalHeight - n, a = t + s - n, l = r - a, h = this.layoutManager.getRowHeightByIndex(i.length - 1);
    Math.ceil(l / h) <= this.lazyLoadThreshold && (this.isLoadingMore = !0, this.eventEmitter.emit(S.LOAD_MORE, {
      startIndex: i.length,
      scrollTop: t,
      direction: "down"
    }));
  }
  handleExternalWheel(t, e) {
    this.state.dropdown && this.dropdownHandler.updateDropdownPosition(), this.state.tooltip && this.updateTooltipPosition();
    const i = tt(
      this.scrollState.scrollLeft + t,
      0,
      this.scrollState.maxScrollLeft
    ), o = tt(
      this.scrollState.scrollTop + e,
      0,
      this.scrollState.maxScrollTop
    );
    (i !== this.scrollState.scrollLeft || o !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = o, this.scrollState.isScrolling = !0, this.eventEmitter.emit(S.SCROLL, i, o), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
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
      const s = this.layoutManager.getLeafColumns()[e.columnIndex], n = this.rows[e.rowIndex];
      if (s && n) {
        const r = ut(s, n, e.rowIndex), a = [
          B.CHECKBOX,
          B.RADIO,
          B.BUTTON,
          B.SWITCH,
          B.RATING,
          B.PROGRESS
        ];
        if (r.type && a.includes(r.type)) {
          if (r.type === B.SWITCH && r.switch) {
            this.editorRegistry.getStrategy(s).canEdit(e, n, s) && this.eventEmitter.emit(
              S.SWITCH_CHANGE,
              this.getCellInfo(e),
              !r.switch.checked
            );
            return;
          }
          this.toggleRowExpand(e.rowIndex);
          return;
        }
        if (!this.editorRegistry.getStrategy(s).canEdit(e, n, s) || (i = r.input) != null && i.readonly) return;
        const l = this.getEditConfig(s, n, e.rowIndex);
        if (l) {
          if (l.type === B.SELECT && l.select) {
            this.startSelectEditing(e, l.select);
            return;
          }
          if (l.type === B.TAG && l.tags) {
            this.startTagsEditing(e, l.tags);
            return;
          }
          if (l.type === B.DATE && l.date) {
            this.startDateEditing(e, l.date);
            return;
          }
          if (l.type === B.COLOR && l.color) {
            this.startColorEditing(e, l.color);
            return;
          }
          this.startEditing(e, l.input);
          return;
        }
        if (r.type === B.SELECT && r.select) {
          this.startSelectEditing(e, r.select);
          return;
        }
        if (r.type === B.TAG && r.tags && r.tags.editable) {
          this.startTagsEditing(e, r.tags);
          return;
        }
        if (r.type === B.DATE && r.date) {
          this.startDateEditing(e, r.date);
          return;
        }
        if (r.type === B.COLOR && r.color) {
          this.startColorEditing(e, r.color);
          return;
        }
        if (r.type === B.IMAGE && r.image) {
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
    const o = e.data[$(t)];
    if (t.editRender)
      try {
        const s = t.editRender(o, e, i);
        if (s) return s;
      } catch (s) {
        console.error("Error in editRender:", s);
      }
    if (t.render)
      try {
        const s = t.render(o, e, t, i);
        if (s && s.type && s.type !== B.CUSTOM && s.type !== B.BUTTON && s.type !== B.IMAGE && s.type !== B.PROGRESS && s.type !== B.LINK)
          return {
            type: s.type,
            input: s.input,
            select: s.select,
            tags: s.tags,
            date: s.date,
            checkbox: s.checkbox,
            radio: s.radio,
            switch: s.switch
          };
      } catch (s) {
        console.error("Error in render:", s);
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
      const { minRow: o, maxRow: s, minCol: n, maxCol: r } = this.getNormalizedRange(i);
      for (let a = o; a <= s; a++) {
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
          const u = me(c, d, a);
          l.push(u);
        }
        t.push(l.join("	"));
      }
    }
    return t.join(`
`);
  }
  setScrollPosition(t, e) {
    this.scrollState.scrollLeft = tt(t, 0, this.scrollState.maxScrollLeft), this.scrollState.scrollTop = tt(e, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
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
    const { columnKey: t, mode: e } = this.state.filterDropdown, i = this.filterConfig.findIndex((r) => r.column === t);
    i >= 0 && this.filterConfig.splice(i, 1);
    let o = null, s = !1;
    switch (e) {
      case "search": {
        const r = (n = this.state.filterDropdown.searchValue) == null ? void 0 : n.trim();
        r && (o = r, s = !0);
        break;
      }
      case "select": {
        const r = this.state.filterDropdown.options;
        if (r) {
          const a = r.filter((l) => l.checked);
          a.length > 0 && a.length < r.length && (o = a.map((l) => l.value), s = !0);
        }
        break;
      }
      case "range": {
        const r = this.state.filterDropdown.minValue, a = this.state.filterDropdown.maxValue;
        (r !== "" || a !== "") && (o = {
          min: r !== "" ? Number(r) : void 0,
          max: a !== "" ? Number(a) : void 0
        }, s = !0);
        break;
      }
      case "dateRange": {
        const r = this.state.filterDropdown.startDate, a = this.state.filterDropdown.endDate;
        (r || a) && (o = {
          start: r,
          end: a
        }, s = !0);
        break;
      }
      case "boolean": {
        const r = this.state.filterDropdown.boolValue;
        r !== "all" && (o = r, s = !0);
        break;
      }
    }
    s && this.filterConfig.push({
      column: t,
      operator: this.getOperatorByMode(e),
      value: o
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
      const s = this.layoutManager.getLeafColumns().find((r) => r.key === i);
      if (!s) return;
      const n = this.allRows.length > 0 ? this.allRows : this.rows;
      if (t.trim()) {
        const r = Ue(s, n, t);
        this.state.filterDropdown.options = r.map((a) => ({
          label: a.label,
          value: a.value,
          checked: !1
        })), this.state.filterDropdown.isLoading = !1;
      } else {
        const r = pe(s, n, 0);
        r.length === 0 && n.length > 0 ? (this.state.filterDropdown.isLoading = !0, this.state.filterDropdown.options = void 0) : (this.state.filterDropdown.options = r.map((a) => ({
          label: a.label,
          value: a.value,
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
      const { minRow: i, maxRow: o, minCol: s, maxCol: n } = this.getNormalizedRange(e);
      for (let r = i; r <= o; r++)
        for (let a = s; a <= n; a++)
          t.push({ rowIndex: r, columnIndex: a });
    }
    return t;
  }
  getSelectedRows() {
    const t = /* @__PURE__ */ new Set();
    for (const e of this.state.selectedCells) {
      const { minRow: i, maxRow: o } = this.getNormalizedRange(e);
      for (let s = i; s <= o; s++)
        t.add(s);
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
b(q, "DROPDOWN_ITEM_HEIGHT", 32), b(q, "DROPDOWN_MAX_VISIBLE", 8), // 图片编辑器常量 (用于 ImageHandler 和其他图片相关操作)
b(q, "IMAGE_SIZE", 64), b(q, "IMAGE_PADDING", 8), b(q, "IMAGE_GAP", 8), b(q, "IMAGES_PER_ROW", 4), b(q, "IMAGE_UPLOAD_AREA_HEIGHT", 60), b(q, "IMAGE_MAX_ROWS", 3);
let zt = q;
class Ni {
  constructor(t, e, i, o, s, n, r) {
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
      var o;
      const e = t, i = ((o = this.inputElement) == null ? void 0 : o.tagName) === "TEXTAREA";
      e.key === "Enter" && !i ? (e.preventDefault(), await this.endEditing(!0)) : e.key === "Enter" && i && (e.ctrlKey || e.metaKey) ? (e.preventDefault(), await this.endEditing(!0)) : e.key === "Escape" ? (e.preventDefault(), await this.endEditing(!1)) : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && t.stopPropagation();
    });
    b(this, "handleInputWheel", (t) => {
      const e = t;
      e.preventDefault(), this.onScrollCallback && this.onScrollCallback(e.deltaX, e.deltaY);
    });
    this.wrapper = t, this.layoutManager = i, this.eventEmitter = o, this.theme = s, this.locale = n, this.getRows = r;
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
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], s = this.getRows()[t.rowIndex];
    return !i || !s ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: s,
      column: i
    };
  }
  async startEditing(t, e) {
    if (this.inputElement && !await this.endEditing(!0) && this.inputElement)
      return !1;
    const o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.getRows()[t.rowIndex];
    if (!o || !n) return !1;
    this.editingCell = t;
    const r = this.layoutManager.getCellMerge(t.rowIndex, t.columnIndex);
    let a;
    const l = r ? r.rowIndex : t.rowIndex;
    r ? a = this.layoutManager.getMergedCellPosition(r.rowIndex, r.columnIndex) : a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let h;
    o.fixed === "left" || o.fixed === "right" ? h = a.x : h = a.x - this.scrollLeft;
    const c = this.layoutManager.getCellViewportY(l, this.scrollTop), d = h - 1, u = c - 1, f = a.width + 2, g = 14 * 1.5, m = 8;
    if ((e == null ? void 0 : e.multiline) ?? !1) {
      const w = Math.max(1, Math.floor((a.height - m * 2) / g)), y = Math.min((e == null ? void 0 : e.maxRows) ?? w, w), C = g * y + m * 2, v = Math.min(a.height + 2, C + 2);
      this.inputElement = document.createElement("textarea");
      const R = String(n.data[$(o)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : R, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = bt(o.disabled, n, o), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${d}px;
        top: ${u}px;
        width: ${f}px;
        height: ${v}px;
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
        const T = this.inputElement, D = T.scrollTop;
        T.style.height = "auto";
        const H = T.scrollHeight, k = Math.max(v, Math.min(H, C));
        T.style.height = `${k}px`, T.scrollTop = D;
      };
      this.inputElement.addEventListener("input", E), requestAnimationFrame(() => {
        E();
      }), this.wheelHandler = (T) => {
        if (this.inputElement && T.target === this.inputElement) {
          const D = this.inputElement, H = D.scrollTop === 0, O = D.scrollTop + D.clientHeight >= D.scrollHeight - 1, k = T.deltaY < 0, P = T.deltaY > 0;
          (H && k || O && P) && T.preventDefault(), T.stopPropagation();
        }
      }, document.addEventListener("wheel", this.wheelHandler, { capture: !0, passive: !1 }), E();
    } else {
      const w = a.height + 2;
      this.inputElement = document.createElement("input"), this.inputElement.type = (e == null ? void 0 : e.type) ?? "text";
      const y = String(n.data[$(o)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : y, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = bt(o.disabled, n, o), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${d}px;
        top: ${u}px;
        width: ${f}px;
        height: ${w}px;
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
    var o;
    const e = this.editingCell;
    let i = null;
    if (this.inputElement) {
      if (i = this.inputElement.value, t && e && this.beforeCommitCallback) {
        const s = this.beforeCommitCallback(e, i);
        Et(s) && this.setLoadingState(!0);
        const n = Et(s) ? await s : s;
        if (this.setLoadingState(!1), !n)
          return this.applyValidationStyle("error"), requestAnimationFrame(() => {
            var r;
            (r = this.inputElement) == null || r.focus();
          }), !1;
      }
      !t && e && ((o = this.cancelCallback) == null || o.call(this, e)), this.destroyInputElement();
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
      ), o = i ? i.rowIndex : this.editingCell.rowIndex, s = i ? this.layoutManager.getMergedCellPosition(i.rowIndex, i.columnIndex) : this.layoutManager.getCellPosition(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex
      );
      let n;
      e.fixed === "left" || e.fixed === "right" ? n = s.x : n = s.x - this.scrollLeft;
      const r = this.layoutManager.getCellViewportY(o, this.scrollTop);
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
class Vi {
  constructor(t, e, i, o = ht) {
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
    this.wrapper = t, this.eventEmitter = e, this.theme = i, this.locale = o;
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
    const { x: e, y: i, width: o } = t, s = 8;
    switch (this.isUpdatingFromExternal = !0, t.mode) {
      case "search": {
        const n = e + s, r = i + s, a = o - s * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${r}px`, this.searchInput.style.width = `${a}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchValue ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "select": {
        const n = e + s, r = i + s, a = o - s * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${r}px`, this.searchInput.style.width = `${a}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchText ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "range": {
        const r = (o - s * 3) / 2, a = i + s;
        if (this.minInput && (this.minInput.style.left = `${e + s}px`, this.minInput.style.top = `${a}px`, this.minInput.style.width = `${r}px`, document.activeElement !== this.minInput)) {
          const l = t.minValue !== void 0 && t.minValue !== "" ? String(t.minValue) : "";
          this.minInput.value !== l && (this.minInput.value = l);
        }
        if (this.maxInput && (this.maxInput.style.left = `${e + s + r + 8}px`, this.maxInput.style.top = `${a}px`, this.maxInput.style.width = `${r}px`, document.activeElement !== this.maxInput)) {
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
    const { x: e, y: i, width: o } = t, s = 8, n = 36, r = e + s, a = i + s, l = o - s * 2;
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
    const { x: e, y: i, width: o } = t, s = 8, n = 36 - s, r = e + s, a = i + s, l = o - s * 2;
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
    const { x: e, y: i, width: o, minValue: s, maxValue: n } = t, r = 8, a = 32, l = 8, h = (o - r * 3) / 2, c = i + r;
    this.minInput = document.createElement("input"), this.minInput.type = "number", this.minInput.value = s !== void 0 && s !== "" ? String(s) : "", this.minInput.placeholder = this.locale.filter.minPlaceholder, this.minInput.style.cssText = `
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
class zi {
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
    i && i.forEach((o) => {
      try {
        o(...e);
      } catch (s) {
        console.error(`Error in event handler for "${String(t)}":`, s);
      }
    });
  }
  once(t, e) {
    const i = (...o) => {
      this.off(t, i), e(...o);
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
  var t, e, i, o, s, n, r, a, l, h, c, d, u, f, g, m;
  return p ? {
    ...Q,
    ...p,
    colors: {
      ...Q.colors,
      ...p.colors,
      tagColors: {
        ...Q.colors.tagColors,
        ...(t = p.colors) == null ? void 0 : t.tagColors
      },
      date: {
        ...Q.colors.date,
        ...(e = p.colors) == null ? void 0 : e.date
      },
      input: {
        ...Q.colors.input,
        ...(i = p.colors) == null ? void 0 : i.input
      },
      checkbox: {
        ...Q.colors.checkbox,
        ...(o = p.colors) == null ? void 0 : o.checkbox
      },
      radio: {
        ...Q.colors.radio,
        ...(s = p.colors) == null ? void 0 : s.radio
      },
      button: {
        ...Q.colors.button,
        ...(n = p.colors) == null ? void 0 : n.button
      },
      dropdown: {
        ...Q.colors.dropdown,
        ...(r = p.colors) == null ? void 0 : r.dropdown
      },
      scrollbar: {
        ...Q.colors.scrollbar,
        ...(a = p.colors) == null ? void 0 : a.scrollbar
      },
      indicator: {
        ...Q.colors.indicator,
        ...(l = p.colors) == null ? void 0 : l.indicator
      },
      tooltip: {
        ...Q.colors.tooltip,
        ...(h = p.colors) == null ? void 0 : h.tooltip
      },
      image: {
        ...Q.colors.image,
        ...(c = p.colors) == null ? void 0 : c.image
      },
      hiddenPlaceholder: {
        ...Q.colors.hiddenPlaceholder,
        ...(d = p.colors) == null ? void 0 : d.hiddenPlaceholder
      },
      moreCount: {
        ...Q.colors.moreCount,
        ...(u = p.colors) == null ? void 0 : u.moreCount
      },
      shadow: {
        ...Q.colors.shadow,
        ...(f = p.colors) == null ? void 0 : f.shadow
      },
      watermark: {
        ...Q.colors.watermark,
        ...(g = p.colors) == null ? void 0 : g.watermark
      },
      loading: (m = p.colors) != null && m.loading ? { ...Q.colors.loading, ...p.colors.loading } : Q.colors.loading
    },
    font: {
      ...Q.font,
      ...p.font
    },
    row: {
      ...Q.row,
      ...p.row
    },
    border: {
      ...Q.border,
      ...p.border
    }
  } : { ...Q };
}
class Xi {
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
    const o = "canvas-table-loading-animation";
    if (!document.getElementById(o)) {
      const s = document.createElement("style");
      s.id = o, s.textContent = `
        @keyframes canvas-table-spin {
          to { transform: rotate(360deg); }
        }
      `, document.head.appendChild(s);
    }
    this.element.addEventListener("mousedown", (s) => s.stopPropagation(), !0), this.element.addEventListener("mouseup", (s) => s.stopPropagation(), !0), this.element.addEventListener("click", (s) => s.stopPropagation(), !0), this.element.addEventListener("dblclick", (s) => s.stopPropagation(), !0), this.element.addEventListener(
      "wheel",
      (s) => {
        s.stopPropagation(), s.preventDefault();
      },
      { passive: !1 }
    ), this.element.addEventListener("touchstart", (s) => s.stopPropagation(), !0), this.element.addEventListener(
      "touchmove",
      (s) => {
        s.stopPropagation(), s.preventDefault();
      },
      { passive: !1 }
    ), this.element.addEventListener("touchend", (s) => s.stopPropagation(), !0), this.element.addEventListener("keydown", (s) => s.stopPropagation(), !0), this.element.addEventListener("keyup", (s) => s.stopPropagation(), !0), this.element.addEventListener("contextmenu", (s) => {
      s.stopPropagation(), s.preventDefault();
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
class $i {
  static buildRows(t, e, i) {
    var l, h;
    const o = (t == null ? void 0 : t.enabled) ?? !!((l = t == null ? void 0 : t.rows) != null && l.length), s = (t == null ? void 0 : t.position) ?? "bottom", n = (t == null ? void 0 : t.scope) ?? "view";
    if (!o || !((h = t == null ? void 0 : t.rows) != null && h.length))
      return { enabled: !1, position: s, scope: n, rows: [] };
    const r = n === "all" ? e.allRows : e.viewRows, a = {
      ...e,
      scopeRows: r
    };
    return {
      enabled: o,
      position: s,
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
  static buildCells(t, e, i, o) {
    const s = [], n = /* @__PURE__ */ new Set();
    return t.forEach((r, a) => {
      const l = this.resolveColumnRange(r, o.visibleLeafColumns);
      if (!l) return;
      for (let c = l.startColumnIndex; c <= l.endColumnIndex; c++)
        if (n.has(c))
          throw new Error(`Overlapping summary cells in row "${e.key}"`);
      for (let c = l.startColumnIndex; c <= l.endColumnIndex; c++)
        n.add(c);
      const h = o.visibleLeafColumns[l.startColumnIndex];
      s.push({
        key: `${e.key}:${a}`,
        ...l,
        config: r,
        renderResult: this.resolveRenderResult(r, e, i, h, o)
      });
    }), s;
  }
  static resolveColumnRange(t, e) {
    const i = t.startColumnKey ?? t.columnKey, o = t.endColumnKey ?? t.columnKey ?? i;
    if (!i || !o) return;
    const s = e.findIndex((l) => l.key === i), n = e.findIndex((l) => l.key === o);
    if (s < 0 || n < 0) return;
    const r = Math.min(s, n), a = Math.max(s, n);
    return {
      startColumnIndex: r,
      endColumnIndex: a,
      startColumnKey: e[r].key,
      endColumnKey: e[a].key
    };
  }
  static resolveRenderResult(t, e, i, o, s) {
    return t.render ? t.render({
      cell: t,
      row: e,
      rowIndex: i,
      column: o,
      columnIndex: s.visibleLeafColumns.indexOf(o),
      context: s
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
  B.CHECKBOX,
  B.RADIO,
  B.SWITCH,
  B.SELECT,
  B.TAG,
  B.DATE,
  B.COLOR,
  B.RATING,
  B.PROGRESS,
  B.BUTTON
]), Qi = /* @__PURE__ */ new Set([B.INPUT, B.TEXT, B.NUMBER]);
class qi {
  constructor() {
    b(this, "strategies", /* @__PURE__ */ new Map());
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
    const e = t.type ?? B.TEXT, i = this.strategies.get(e);
    return i || Ki;
  }
  /** 检查列是否是交互式编辑器 */
  isInteractive(t) {
    return this.getStrategy(t).isInteractive;
  }
}
class bs {
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
    b(this, "handleResize", Fe(() => {
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
      rowBufferSize: ((r = e.virtualScroll) == null ? void 0 : r.rowBufferSize) ?? e.bufferSize ?? 5,
      columnBufferSize: ((a = e.virtualScroll) == null ? void 0 : a.columnBufferSize) ?? 2
    };
    ((l = e.virtualScroll) == null ? void 0 : l.estimatedRowHeight) !== void 0 && (i.estimatedRowHeight = e.virtualScroll.estimatedRowHeight), ((h = e.virtualScroll) == null ? void 0 : h.estimatedColumnWidth) !== void 0 && (i.estimatedColumnWidth = e.virtualScroll.estimatedColumnWidth);
    const o = e.selection ?? {
      mode: "cell",
      multi: !0
    }, s = e.editing ?? {
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
      o,
      s,
      this.locale,
      this.editorRegistry
    ), this.interactionManager.setRowHeightResizeEnabled(e.enableRowHeightResize === !0), this.interactionManager.setRowResizable(e.rowResizable), this.interactionManager.setShouldBlockDropdownClose(async (d) => {
      var w;
      const u = this.layoutManager.getLeafColumn(d.columnIndex), f = this.dataManager.getRows()[d.rowIndex];
      if (!u || !f) return !1;
      const g = this.interactionManager.getDropdown();
      let m;
      return g && g.type === "tags" && g.tagsConfig ? m = g.tagsConfig.multiple !== !1 ? g.tagsConfig.selectedValues ?? [] : ((w = g.tagsConfig.selectedValues) == null ? void 0 : w[0]) ?? "" : g ? m = g.config.value : m = f.data[$(u)], !await this.validateEditorCommit(d, m);
    }), this.interactionManager.setShouldBlockEditingClose(async (d) => {
      var x;
      const u = this.editorManager.getEditingCell();
      if (u) {
        if (d && d.preventDefault(), this.editorManager.markSkipNextBlur(), !await this.editorManager.endEditing(!0)) {
          const y = this.layoutManager.getLeafColumn(u.columnIndex);
          if (y) {
            const C = this.editorRegistry.getStrategy(y), v = this.getValidationError(u);
            if (v && !C.shouldBlockFocusLoss(u, v))
              return await this.editorManager.endEditing(!1), !1;
          }
          return !0;
        }
        return !1;
      }
      const f = this.interactionManager.getDropdown();
      if (f) {
        const w = this.layoutManager.getLeafColumn(f.cell.columnIndex), y = this.dataManager.getRows()[f.cell.rowIndex];
        if (!w || !y) return !1;
        let C;
        return f.type === "tags" && f.tagsConfig ? C = f.tagsConfig.multiple !== !1 ? f.tagsConfig.selectedValues ?? [] : ((x = f.tagsConfig.selectedValues) == null ? void 0 : x[0]) ?? "" : C = f.config.value, !await this.validateEditorCommit(f.cell, C);
      }
      const g = this.interactionManager.getDateDropdown();
      if (g) {
        const w = this.layoutManager.getLeafColumn(g.cell.columnIndex), y = this.dataManager.getRows()[g.cell.rowIndex];
        if (!w || !y) return !1;
        const C = g.selectedDate ?? y.data[$(w)];
        return !await this.validateEditorCommit(g.cell, C);
      }
      const m = this.interactionManager.getColorDropdown();
      if (m) {
        const w = this.layoutManager.getLeafColumn(m.cell.columnIndex), y = this.dataManager.getRows()[m.cell.rowIndex];
        if (!w || !y) return !1;
        const C = m.config.value ?? y.data[$(w)];
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
    }), this.editorManager = new Ni(
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
        const o = t, s = e;
        if (!this.layoutManager.updateRowHeight(o, s)) {
          const r = this.dataManager.getColumns(), a = this.dataManager.getRows();
          this.layoutManager.calculateLayout(r, a);
        }
        this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop()
        ), this.editorManager.updatePosition(), this.render();
      }
    ), this.eventEmitter.on(S.COLUMN_REORDER, (t, e) => {
      const i = t, o = e;
      this.dataManager.reorderColumns(i, o);
      const s = this.dataManager.getColumns();
      if (this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(s), this.props.onColumnReorder) {
        const n = s.map((r) => r.key);
        this.props.onColumnReorder(n);
      }
      this.render();
    }), this.eventEmitter.on(S.COLUMN_REORDER_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(S.COLUMN_SWAP, (t, e) => {
      const i = t, o = e;
      this.dataManager.swapColumnsByKey(i, o);
      const s = this.dataManager.getColumns();
      this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(s), this.render();
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
        const o = this.dataManager.getRows()[t.rowIndex];
        o && this.eventEmitter.emit(S.ROW_CLICK, o, t.rowIndex, e);
      }
    }), this.eventEmitter.on(S.CELL_DBL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const o = this.dataManager.getRows()[t.rowIndex];
        o && this.eventEmitter.emit(S.ROW_DBL_CLICK, o, t.rowIndex, e);
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
        const i = this.layoutManager.getLeafColumn(t.cell.columnIndex), o = this.dataManager.getRows()[t.cell.rowIndex];
        if (i && o) {
          const s = this.editorRegistry.getStrategy(i);
          (e = s.onDropdownOpen) == null || e.call(s, t.cell, o, i);
        }
      }
      this.render();
    }), this.eventEmitter.on(S.COLOR_DROPDOWN_CLOSE, (t) => {
      var i;
      const e = t;
      if (e) {
        const o = this.layoutManager.getLeafColumn(e.columnIndex);
        if (o) {
          const s = this.editorRegistry.getStrategy(o);
          (i = s.onDropdownCancel) == null || i.call(s, e);
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
      const i = t, o = e;
      await this.editorManager.startEditing(i, o);
      const s = this.layoutManager.getLeafColumn(i.columnIndex);
      if (s) {
        const n = this.editorRegistry.getStrategy(s);
        !n.isInteractive && n.onEditStart && n.onEditStart(i, o);
      }
      this.render();
    }), this.eventEmitter.on(
      S.SELECT_CHANGE,
      async (t, e, i) => {
        const o = t, s = i;
        await this.handleEditorCommit(o, e, this.props.onSelectChange) && (s || (this.clearValidationErrorForCell(o), this.interactionManager.closeSelectDropdown()));
      }
    ), this.eventEmitter.on(
      S.TAGS_CHANGE,
      async (t, e, i) => {
        const o = t, s = e, n = i, r = n ? s : s[0] ?? "";
        await this.handleEditorCommit(
          o,
          r,
          this.props.onTagsChange ? (l, h) => this.props.onTagsChange(l, s) : void 0
        ) && !n && (this.clearValidationErrorForCell(o), this.interactionManager.closeSelectDropdown());
      }
    ), this.eventEmitter.on(S.EXPAND, (t, e, i) => {
      const o = t, s = e, n = i;
      this.props.onExpand && this.props.onExpand(o, s, n), this.dataManager.toggleRowExpand(s), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.DROPDOWN_OPEN, () => {
      var e;
      const t = this.interactionManager.getDropdown();
      if (t) {
        const i = this.layoutManager.getLeafColumn(t.cell.columnIndex), o = this.dataManager.getRows()[t.cell.rowIndex];
        if (i && o) {
          const s = this.editorRegistry.getStrategy(i);
          (e = s.onDropdownOpen) == null || e.call(s, t.cell, o, i);
        }
      }
      this.render();
    }), this.eventEmitter.on(S.DROPDOWN_CLOSE, (t) => {
      var i;
      const e = t;
      if (e) {
        this.clearValidationErrorForCell(e);
        const o = this.layoutManager.getLeafColumn(e.columnIndex);
        if (o) {
          const s = this.editorRegistry.getStrategy(o);
          (i = s.onDropdownCancel) == null || i.call(s, e);
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
        const i = this.layoutManager.getLeafColumn(t.cell.columnIndex), o = this.dataManager.getRows()[t.cell.rowIndex];
        if (i && o) {
          const s = this.editorRegistry.getStrategy(i);
          (e = s.onDropdownOpen) == null || e.call(s, t.cell, o, i);
        }
      }
      this.render();
    }), this.eventEmitter.on(S.DATE_DROPDOWN_CLOSE, (t) => {
      var i;
      const e = t;
      if (e) {
        const o = this.layoutManager.getLeafColumn(e.columnIndex);
        if (o) {
          const s = this.editorRegistry.getStrategy(o);
          (i = s.onDropdownCancel) == null || i.call(s, e);
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
      const e = t, i = this.dataManager.getColumns(), o = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, o, "above"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_ADD_BELOW, (t) => {
      const e = t, i = this.dataManager.getColumns(), o = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, o, "below"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_DELETE, (t) => {
      const e = t;
      this.rowPinManager.remove(e), this.dataManager.deleteRowByRef(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_PIN_CHANGE, (t, e) => {
      var r, a;
      const i = t, o = e, s = this.rowPinManager.getPosition(i);
      o ? this.rowPinManager.pin(i, o) : this.rowPinManager.remove(i), this.layoutManager.updateRowPin(i, s, o) ? (this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      ), this.editorManager.updatePosition()) : this.updateLayout(), this.render(), (a = (r = this.props).onRowPinChange) == null || a.call(r, i, o);
    }), this.eventEmitter.on(S.UNDO, () => {
      this.undo();
    }), this.eventEmitter.on(S.REDO, () => {
      this.redo();
    }), this.eventEmitter.on(
      S.IMAGE_CLICK,
      (t, e, i) => {
        const o = t, s = e, n = i;
        this.props.onImageClick && this.props.onImageClick(o, s, n);
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
      const i = t, o = e;
      this.props.onImageUpload && this.props.onImageUpload(i, o);
    }), this.eventEmitter.on(
      S.IMAGE_DELETE,
      (t, e, i) => {
        const o = t, s = e, n = i;
        this.props.onImageDelete && this.props.onImageDelete(o, s, n);
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
        const o = e.replace("on", "").replace(/^./, (s) => s.toLowerCase());
        this.eventEmitter.on(o, i);
      }
  }
  setupResizeObserver() {
    typeof ResizeObserver < "u" && (this.resizeObserver = new ResizeObserver(this.handleResize), this.resizeObserver.observe(this.container)), window.addEventListener("resize", this.handleResize);
  }
  async initialize() {
    try {
      const t = this.container.getBoundingClientRect(), e = t.width || this.props.width || 800, i = t.height || this.props.height || 400;
      this.renderer.resize(e, i), this.layoutManager.setViewportSize(e, i), await this.dataManager.loadRows(this.props.rows), this.dataManager.setColumns(this.props.columns), this.props.expandColumnKey && (this.renderer.setExpandColumnKey(this.props.expandColumnKey), this.interactionManager.setExpandColumnKey(this.props.expandColumnKey)), this.updateLayout();
      const o = {
        rows: this.dataManager.getRows(),
        columns: this.dataManager.getColumns()
      };
      this.eventEmitter.emit(S.LOAD, o), this.render();
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
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows(), i = this.dataManager.getAllRows(), o = $i.buildRows(
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
      o.position === "top" ? o.rows : [],
      o.position === "bottom" ? o.rows : []
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
    const o = this.editorRegistry.getStrategy(e), s = e.validate ?? ((u = e.editor) == null ? void 0 : u.validate), n = o.validate;
    if (!s && !n) return { valid: !0, issue: null };
    const r = this.dataManager.getRows()[t.rowIndex];
    if (!r) return { valid: !0, issue: null };
    const a = s ? s(i, r, e) : n(t, i, r, e), l = Et(a);
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
      const w = this.validationErrorRows.get(r) ?? /* @__PURE__ */ new Map();
      if (w.set(e.key, d), this.validationErrorRows.set(r, w), this.forcedValidationTooltipCell = d.cell, d.level === "warning") {
        const y = d.cell;
        this.warningTooltipTimeout && clearTimeout(this.warningTooltipTimeout), this.warningTooltipTimeout = setTimeout(() => {
          this.isDestroyed || this.forcedValidationTooltipCell && this.forcedValidationTooltipCell.rowIndex === y.rowIndex && this.forcedValidationTooltipCell.columnIndex === y.columnIndex && (this.forcedValidationTooltipCell = null, this.render());
        }, 3e3);
      }
      (g = (f = this.props).onValidationError) == null || g.call(f, d), d.level === "error" ? (m = o.onReject) == null || m.call(o, t, d) : d.level === "warning" && ((x = o.onWarning) == null || x.call(o, t, d));
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
      const i = this.dataManager.getRows()[this.forcedValidationTooltipCell.rowIndex], o = this.layoutManager.getLeafColumn(
        this.forcedValidationTooltipCell.columnIndex
      );
      i === t && (o == null ? void 0 : o.key) === e && (this.forcedValidationTooltipCell = null);
    }
  }
  async commitCellValue(t, e, i) {
    var r;
    const { valid: o } = await this.handleValidation(t, e, i);
    if (!o) return !1;
    const s = this.dataManager.getRows()[t.rowIndex];
    this.dataManager.updateCell(t.rowIndex, e.key, i, $(e)), this.refreshSummaryRowsAfterDataChange();
    const n = this.editorRegistry.getStrategy(e);
    return (r = n.onCommit) == null || r.call(n, t, i, s, e), !0;
  }
  /**
   * 统一的编辑器提交流程 — 交互式和 DOM 编辑器共用
   *
   * get column → await commitCellValue → if committed call callback → render
   */
  async handleEditorCommit(t, e, i) {
    const o = this.layoutManager.getLeafColumn(t.columnIndex);
    if (!o)
      return this.render(), !1;
    const s = this.editorRegistry.getStrategy(o);
    if (s.isInteractive) {
      const r = s;
      if (r.beforeInteract) {
        const a = this.dataManager.getRows()[t.rowIndex];
        if (a && !r.beforeInteract(t, a, o))
          return this.render(), !1;
      }
    }
    const n = await this.commitCellValue(t, o, e);
    return n && (i == null || i(t, e)), this.performRender(), this.scheduledRender = null, n;
  }
  async validateEditorCommit(t, e) {
    const i = this.layoutManager.getLeafColumn(t.columnIndex);
    if (!i) return !0;
    const { valid: o } = await this.handleValidation(t, i, e);
    return o ? (this.clearValidationErrorForCell(t), !0) : (this.render(), !1);
  }
  clearValidationErrorForCell(t) {
    const e = this.dataManager.getRows()[t.rowIndex], i = this.layoutManager.getLeafColumn(t.columnIndex);
    e && i && this.deleteValidationError(e, i.key), this.render();
  }
  buildVisibleValidationErrorIndex() {
    const t = /* @__PURE__ */ new Map(), e = this.dataManager.getRows(), i = this.layoutManager.getVisibleRange(), o = this.layoutManager.getLeafColumns();
    for (let s = i.startRow; s <= i.endRow; s++) {
      const n = e[s];
      if (!n) continue;
      const r = this.validationErrorRows.get(n);
      if (r)
        for (let a = 0; a < o.length; a++) {
          const l = o[a];
          if (!l) continue;
          const h = r.get(l.key);
          h && t.set(`${s}-${a}`, h);
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
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows(), i = this.interactionManager.getInteractionState(), o = this.interactionManager.getScrollState();
    if (this.layoutManager.setScrollPosition(o.scrollLeft, o.scrollTop), e.length === 0) {
      this.loadingOverlay.hide(), this.renderer.renderEmptyState(
        this.props.emptyText ?? this.locale.emptyText,
        this.dataManager.getSort(),
        this.dataManager.getFilters(),
        i.hoveredHeaderColumnKey,
        o.scrollLeft
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
    const s = this.layoutManager.getVisibleRange();
    this.renderer.render(
      t,
      e,
      s,
      o.scrollLeft,
      o.scrollTop,
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
      o.scrollLeft,
      o.scrollTop,
      o.maxScrollLeft,
      o.maxScrollTop,
      n
    );
    const r = this.forcedValidationTooltipCell ?? i.hoveredCell, a = this.getValidationTooltip(
      r,
      o.scrollLeft,
      o.scrollTop
    );
    if (a && i.tooltip) {
      const m = i.tooltip.cell, x = a.cell.rowIndex === m.rowIndex && a.cell.columnIndex === m.columnIndex, w = a.content.type === "text" ? a.content.text : "";
      if (x && i.tooltip.content.type === "text") {
        const y = i.tooltip.content.text;
        this.renderer.renderTooltip({
          ...a,
          content: {
            type: "text",
            text: w + `
` + y
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
    let o = this.interactionManager.getScrollState().scrollLeft;
    e !== void 0 && (o = this.layoutManager.getScrollOffsetForColumn(e)), this.interactionManager.setScrollPosition(o, i), this.render();
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
    const o = this.layoutManager.getColumnByKey(e), s = this.layoutManager.getLeafColumnIndexByKey(e);
    if (o && s !== null) {
      if (!await this.commitCellValue({ rowIndex: t, columnIndex: s }, o, i)) {
        this.render();
        return;
      }
    } else {
      const l = this.dataManager.updateCell(t, e, i);
      this.eventEmitter.emit(S.CHANGE, [l]), this.refreshSummaryRowsAfterDataChange(), this.render();
      return;
    }
    const n = this.dataManager.getRows()[t], r = $(o), a = {
      type: "update",
      rowIndex: t,
      column: r,
      newValue: n == null ? void 0 : n.data[r]
    };
    this.eventEmitter.emit(S.CHANGE, [a]), this.render();
  }
  async updateRow(t, e) {
    const i = this.layoutManager.getLeafColumns();
    for (let s = 0; s < i.length; s++) {
      const n = i[s];
      if (!n) continue;
      const r = $(n), a = Object.prototype.hasOwnProperty.call(e, r), l = Object.prototype.hasOwnProperty.call(e, n.key);
      if (!a && !l)
        continue;
      const h = a ? e[r] : e[n.key], c = { rowIndex: t, columnIndex: s };
      if (!(await this.handleValidation(c, n, h)).valid) {
        this.render();
        return;
      }
    }
    const o = this.dataManager.updateRow(t, e);
    this.eventEmitter.emit(S.CHANGE, o), this.refreshSummaryRowsAfterDataChange(), this.render();
  }
  getValidationErrors() {
    const t = [], e = this.dataManager.getRows();
    for (const i of e) {
      const o = this.validationErrorRows.get(i);
      if (o)
        for (const s of o.values())
          t.push(s);
    }
    return t;
  }
  getValidationError(t) {
    var o;
    const e = this.dataManager.getRows()[t.rowIndex], i = this.layoutManager.getLeafColumn(t.columnIndex);
    return !e || !i ? null : ((o = this.validationErrorRows.get(e)) == null ? void 0 : o.get(i.key)) ?? null;
  }
  clearValidationErrors() {
    this.validationErrorRows = /* @__PURE__ */ new WeakMap(), this.forcedValidationTooltipCell = null, this.render();
  }
  getValidationTooltip(t, e, i) {
    if (!t)
      return null;
    const o = this.getValidationError(t);
    if (!o)
      return null;
    const s = this.layoutManager.getLeafColumn(t.columnIndex), n = this.layoutManager.getCellPosition(
      t.rowIndex,
      t.columnIndex
    ), r = (s == null ? void 0 : s.fixed) === "left" || (s == null ? void 0 : s.fixed) === "right" ? n.x : n.x - e;
    return {
      cell: t,
      x: r,
      y: n.y - i,
      width: n.width,
      content: { type: "text", text: o.message }
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
        const i = this.layoutManager.getRowBandsForRender(), o = this.dataManager.getExportContext({
          includeHeaders: t.includeHeaders ?? !0,
          includeHidden: t.includeHidden ?? !1,
          selectedOnly: t.selectedOnly ?? !1,
          showRowNumbers: this.props.showRowNumbers === !0
        }), s = We(
          {
            ...o,
            summaryTopRows: i.summaryTop.rows,
            summaryBottomRows: i.summaryBottom.rows
          },
          t.excel,
          ((e = t.filename) == null ? void 0 : e.replace(/\.[^.]+$/, "")) ?? "Sheet1"
        );
        return Ae(s);
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
    const e = this.dataManager.getColumns(), i = [], o = (r, a = []) => {
      for (const l of r) {
        if (l.key === t) {
          for (const h of a)
            i.push(h.key);
          return !0;
        }
        if (l.children && o(l.children, [...a, l]))
          return !0;
      }
      return !1;
    }, s = (r, a) => {
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
            const { prevFixed: h, nextFixed: c } = s(e, t);
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
    o(e), n(e) && (this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.updateSummaryRows(), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    ), this.render(), this.props.onColumnShow && this.props.onColumnShow(t));
  }
  hideColumnInternal(t) {
    const e = this.dataManager.getColumns(), i = (s) => {
      if (s.hidden = !0, s.children)
        for (const n of s.children)
          i(n);
    }, o = (s) => {
      for (const n of s) {
        if (n.key === t)
          return i(n), !0;
        if (n.children && o(n.children))
          return !0;
      }
      return !1;
    };
    o(e) && (this.updateSummaryRows(), this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    ), this.render(), this.props.onColumnHide && this.props.onColumnHide(t));
  }
  getViewConfig() {
    const t = this.dataManager.getColumns(), e = {};
    t.forEach((o, s) => {
      e[o.key] = this.layoutManager.getColumnWidthByIndex(s);
    });
    const i = (o) => {
      const s = [];
      for (const n of o)
        n.hidden && s.push(n.key), n.children && s.push(...i(n.children));
      return s;
    };
    return {
      columnWidths: e,
      columnOrder: t.map((o) => o.key),
      hiddenColumns: i(t),
      fixedColumns: { left: [], right: [] },
      sort: this.dataManager.getSort(),
      filters: this.dataManager.getFilters()
    };
  }
  setViewConfig(t) {
    if (t.sort && this.dataManager.sort(t.sort), t.filters && this.dataManager.filter(t.filters), t.hiddenColumns) {
      const e = this.dataManager.getColumns(), i = (o, s) => {
        for (const n of o)
          n.hidden = s.includes(n.key), n.children && i(n.children, s);
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
      const o = $(i);
      switch (i.type) {
        case "number":
          e[o] = 0;
          break;
        case "checkbox":
        case "switch":
          e[o] = !1;
          break;
        case "date":
          e[o] = "";
          break;
        default:
          e[o] = "";
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
    var o, s, n, r, a, l, h, c, d, u, f, g, m, x, w;
    let e;
    this.themeMode === "auto" ? e = window.matchMedia("(prefers-color-scheme: dark)").matches ? le : Q : this.themeMode === "dark" ? e = le : e = Q;
    const i = t ?? this.props.theme;
    return i ? {
      ...e,
      ...i,
      colors: {
        ...e.colors,
        ...i.colors,
        tagColors: {
          ...e.colors.tagColors,
          ...(o = i.colors) == null ? void 0 : o.tagColors
        },
        date: {
          ...e.colors.date,
          ...(s = i.colors) == null ? void 0 : s.date
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
          ...(x = i.colors) == null ? void 0 : x.shadow
        },
        watermark: {
          ...e.colors.watermark,
          ...(w = i.colors) == null ? void 0 : w.watermark
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
  B as CellTypes,
  xs as Circle,
  gs as Column,
  je as ColumnIdManager,
  le as DARK_THEME,
  Q as DEFAULT_THEME,
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
  tt as clamp,
  us as createCTElement,
  ls as createCanvas,
  Ji as createXlsxBlob,
  Ae as createXlsxBlobFromModel,
  Fe as debounce,
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
  $ as getColumnField,
  pe as getColumnFilterOptions,
  It as getDevicePixelRatio,
  Xe as getFilterModeByColumnType,
  ns as getNestedValue,
  ut as getRenderResult,
  Pi as getTextFromChildren,
  Ne as isEqual,
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
