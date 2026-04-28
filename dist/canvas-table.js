var Ut = Object.defineProperty;
var Kt = (D, t, e) => t in D ? Ut(D, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : D[t] = e;
var C = (D, t, e) => Kt(D, typeof t != "symbol" ? t + "" : t, e);
function N(D) {
  return D.field ?? D.key;
}
function Qt(D, t) {
  const { thousandSeparator: e = !0, decimalPlaces: i, prefix: s = "", suffix: o = "" } = t ?? {};
  if (!isFinite(D))
    return String(D);
  let n = i !== void 0 ? D.toFixed(i) : String(D);
  if (e) {
    const r = n.split(".");
    r[0] = r[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","), n = r.join(".");
  }
  return s + n + o;
}
function Ze(D, t = 2) {
  return Qt(D * 100, { decimalPlaces: t, suffix: "%" });
}
function Je(D, t = "YYYY-MM-DD") {
  const e = D instanceof Date ? D : new Date(D);
  if (isNaN(e.getTime()))
    return String(D);
  const i = e.getFullYear(), s = String(e.getMonth() + 1).padStart(2, "0"), o = String(e.getDate()).padStart(2, "0"), n = String(e.getHours()).padStart(2, "0"), r = String(e.getMinutes()).padStart(2, "0"), a = String(e.getSeconds()).padStart(2, "0");
  return t.replace("YYYY", String(i)).replace("MM", s).replace("DD", o).replace("HH", n).replace("mm", r).replace("ss", a);
}
function ti(D, t = "Yes", e = "No") {
  return D ? t : e;
}
function ct(D, t, e = "...") {
  return D.length <= t ? D : D.slice(0, t - e.length) + e;
}
function Dt() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function jt(D, t) {
  let e = null;
  return function(...i) {
    e !== null && clearTimeout(e), e = setTimeout(() => {
      D.apply(this, i), e = null;
    }, t);
  };
}
function ei(D, t) {
  let e = !1;
  return function(...i) {
    e || (D.apply(this, i), e = !0, setTimeout(() => {
      e = !1;
    }, t));
  };
}
function Z(D, t, e) {
  return Math.min(Math.max(D, t), e);
}
function Ht(D) {
  if (D === null || typeof D != "object")
    return D;
  if (Array.isArray(D))
    return D.map((e) => Ht(e));
  const t = {};
  for (const e in D)
    Object.prototype.hasOwnProperty.call(D, e) && (t[e] = Ht(D[e]));
  return t;
}
function qt(D, t) {
  if (D === t)
    return !0;
  if (typeof D != typeof t)
    return !1;
  if (D === null || t === null || typeof D != "object")
    return D === t;
  if (Array.isArray(D) !== Array.isArray(t))
    return !1;
  const e = D, i = t, s = Object.keys(e), o = Object.keys(i);
  if (s.length !== o.length)
    return !1;
  for (const n of s)
    if (!Object.prototype.hasOwnProperty.call(i, n) || !qt(e[n], i[n]))
      return !1;
  return !0;
}
function ii(D, t) {
  const e = t.split(".");
  let i = D;
  for (const s of e) {
    if (i == null)
      return;
    i = i[s];
  }
  return i;
}
function si(D, t, e) {
  const i = t.split(".");
  let s = D;
  for (let o = 0; o < i.length - 1; o++) {
    const n = i[o];
    (s[n] === void 0 || s[n] === null) && (s[n] = {}), s = s[n];
  }
  s[i[i.length - 1]] = e;
}
function kt(D, t, e) {
  let i = 0, s = D.length - 1;
  for (; i <= s; ) {
    const o = Math.floor((i + s) / 2), n = e(D[o]);
    if (n === t)
      return o;
    n < t ? i = o + 1 : s = o - 1;
  }
  return i;
}
function oi(D, t, e, i) {
  return D.font = `${e}px ${i}`, {
    width: D.measureText(t).width,
    height: e
  };
}
function mt() {
  return window.devicePixelRatio || 1;
}
function ni(D, t) {
  const e = document.createElement("canvas"), i = mt();
  e.width = D * i, e.height = t * i, e.style.width = `${D}px`, e.style.height = `${t}px`;
  const s = e.getContext("2d");
  if (!s)
    throw new Error("Failed to get 2D context");
  return s.scale(i, i), { canvas: e, ctx: s };
}
function ri(D) {
  let t = null, e = null;
  return function(...i) {
    e = i, t === null && (t = requestAnimationFrame(() => {
      e !== null && D.apply(this, e), t = null, e = null;
    }));
  };
}
function Zt(D) {
  return D !== null && typeof D == "object" && typeof D.then == "function";
}
function ai(D, t) {
  const e = URL.createObjectURL(D), i = document.createElement("a");
  i.href = e, i.download = t, document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(e);
}
function wt(D, t = ",") {
  return D.map((e) => e.map((i) => {
    const s = String(i ?? "");
    return s.includes(t) || s.includes('"') || s.includes(`
`) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(t)).join(`
`);
}
function et(D, t, e) {
  return D === void 0 ? !1 : typeof D == "function" ? D(t, e) : D;
}
function nt(D, t, e) {
  const i = N(D), s = t.data[i];
  let o = {
    text: String(s ?? ""),
    type: D.type ?? "text"
  };
  if (D.render)
    try {
      const n = D.render(s, t, D, e);
      n && (o = { ...o, ...n });
    } catch (n) {
      console.error(`Error in render function at row ${e}, column ${D.key}:`, n), o = {
        text: "[Error]",
        type: "text"
      };
    }
  return o.type === "checkbox" && !o.checkbox && (o.checkbox = {
    checked: !!s
  }), o.type === "switch" && !o.switch && (o.switch = {
    checked: !!s
  }), o;
}
function Vt(D, t, e) {
  var n, r;
  const i = N(D), s = t.data[i], o = nt(D, t, e);
  if (o.type === "switch" && o.switch)
    return o.switch.checked ? "是" : "否";
  if (o.type === "checkbox" && o.checkbox)
    return o.checkbox.indeterminate ? "部分选中" : o.checkbox.checked ? "是" : "否";
  if (o.type === "radio" && o.radio) {
    const a = (n = o.radio.options) == null ? void 0 : n.find(
      (l) => {
        var h;
        return l.value === ((h = o.radio) == null ? void 0 : h.value);
      }
    );
    return (a == null ? void 0 : a.label) || String(o.radio.value ?? "");
  }
  if (o.type === "button" && o.button)
    return o.button.text || "";
  if (o.tags)
    return o.tags.tags.map((a) => a.text).join(", ");
  if (o.type === "select" && o.select) {
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
  if (o.type === "date" && o.date) {
    if (o.date.value) {
      const a = o.date.value;
      return a instanceof Date ? a.toLocaleDateString() : String(a);
    }
    return "";
  }
  if (o.type === "input" && o.input)
    return String(o.input.value ?? "");
  if (D.formatter)
    return D.formatter(s, t, D);
  if (o.text !== void 0)
    return String(o.text);
  switch (D.type) {
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
class li {
  constructor(t = 100) {
    C(this, "cache");
    C(this, "maxSize");
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
const Jt = {
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
}, te = ["button", "buttons", "image"];
function ee(D) {
  var e, i;
  if ((e = D.filter) != null && e.mode)
    return D.filter.mode;
  if ((i = D.filter) != null && i.disabled)
    return null;
  const t = D.type ?? "text";
  return te.includes(t) ? null : Jt[t] ?? "search";
}
const ie = 100, se = 100;
function Yt(D, t, e = 0) {
  var n;
  if ((n = D.filter) != null && n.options && D.filter.options.length > 0)
    return D.filter.options;
  if (!t || t.length === 0)
    return [];
  const i = N(D), s = t.slice(e, e + ie), o = /* @__PURE__ */ new Map();
  for (let r = 0; r < s.length; r++) {
    const a = s[r], l = a.data[i], h = nt(D, a, e + r), c = oe(h, l);
    for (const d of c) {
      const u = String(d.value);
      o.has(u) || o.set(u, d);
    }
  }
  return Array.from(o.values());
}
function oe(D, t) {
  var i, s, o, n;
  const e = [];
  if ((i = D.select) != null && i.options && e.push(...D.select.options), (s = D.tags) != null && s.options && e.push(
    ...D.tags.options.map((r) => ({
      label: r.text,
      value: r.value ?? r.text
    }))
  ), (o = D.radio) != null && o.options && e.push(...D.radio.options), (n = D.color) != null && n.presetColors && e.push(
    ...D.color.presetColors.map((r) => ({
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
function ne(D, t, e, i = se) {
  if (!e || e.trim() === "")
    return [];
  const s = N(D), o = e.toLowerCase(), n = /* @__PURE__ */ new Map();
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
class re {
  constructor() {
    C(this, "map", /* @__PURE__ */ new WeakMap());
    C(this, "counter", 0);
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
class ae {
  constructor() {
    C(this, "map", /* @__PURE__ */ new WeakMap());
    C(this, "counter", 0);
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
class le {
  constructor() {
    C(this, "map", /* @__PURE__ */ new WeakMap());
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
class he {
  constructor(t, e, i, s = 3e3) {
    /** 单元格缓存：key = rowId-columnId */
    C(this, "cellCache", /* @__PURE__ */ new Map());
    /** 列值缓存：key = columnId-value */
    C(this, "valueCache", /* @__PURE__ */ new Map());
    /** 行 ID 管理器 */
    C(this, "rowIdManager");
    /** 列 ID 管理器 */
    C(this, "columnIdManager");
    /** 行版本管理器 */
    C(this, "rowVersionManager");
    /** 单元格缓存最大数量 */
    C(this, "maxCellCacheSize");
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
const yt = 200;
class ce {
  constructor(t, e) {
    C(this, "state", {
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
    C(this, "historyStack", []);
    /** 重做记录栈 */
    C(this, "redoStack", []);
    /** 历史记录配置 */
    C(this, "historyOptions");
    /** 行版本管理器（用于渲染缓存） */
    C(this, "rowVersionManager", new le());
    this.historyOptions = {
      maxActions: (e == null ? void 0 : e.maxActions) ?? yt
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
      typeof t == "function" ? e = await t() : Zt(t) ? e = await t : e = t, this.state.rows = this.processRows(e), this.historyStack = [], this.redoStack = [], this.applyFiltersAndSort();
    } catch (e) {
      throw this.state.error = e instanceof Error ? e : new Error(String(e)), e;
    } finally {
      this.state.loading = !1;
    }
  }
  processRows(t, e = 0) {
    return t.map((i) => {
      const s = {
        id: i.id ?? Dt(),
        data: i.data,
        level: e,
        expanded: i.expanded ?? !1,
        selected: i.selected ?? !1,
        cellMerges: i.cellMerges
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
        const r = i.data[N(n)];
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
    };
    return [...t].sort((s, o) => {
      for (const n of this.state.sort) {
        const r = e(this.state.columns, n.column);
        if (!r) continue;
        const a = N(r), l = s.data[a], h = o.data[a];
        let c = this.compareValues(l, h, r.type);
        if (c !== 0)
          return n.direction === "desc" ? -c : c;
      }
      return 0;
    }).map((s) => {
      const o = { ...s };
      return s.children && (o.children = this.applySort(s.children)), o;
    });
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
      rowId: o.id,
      column: a,
      oldValue: h,
      newValue: l
    });
    const c = this.findStateRow(o.id);
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
        rowId: i.id,
        column: n.column,
        oldValue: n.oldValue,
        newValue: n.newValue
      });
    s.length > 0 && this.rowVersionManager.incrementVersion(i);
    const o = this.findStateRow(i.id);
    return o && Object.assign(o.data, e), this.applyFiltersAndSort(), s;
  }
  addRow(t, e) {
    const i = {
      id: Dt(),
      data: t,
      expanded: !1,
      selected: !1,
      level: 0
    }, s = e !== void 0 && e >= 0 && e <= this.state.rows.length ? e : this.state.rows.length;
    return e !== void 0 && e >= 0 && e <= this.state.rows.length ? this.state.rows.splice(e, 0, i) : this.state.rows.push(i), this.recordAction({
      type: "add",
      rowId: i.id,
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
    const i = this.state.rows.findIndex((s) => s.id === e.id);
    return i !== -1 && this.state.rows.splice(i, 1), this.recordAction({
      type: "delete",
      rowId: e.id,
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
      rowId: t.id,
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
    const i = this.findStateRow(e.id);
    return i && (i.expanded = e.expanded), this.applyFiltersAndSort(), e.expanded;
  }
  setRowSelected(t, e) {
    const i = this.state.sortedRows[t];
    if (!i) return;
    i.selected = e;
    const s = this.findStateRow(i.id);
    s && (s.selected = e);
  }
  findStateRow(t) {
    const e = (i) => {
      for (const s of i) {
        if (s.id === t) return s;
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
    const e = this.historyOptions.maxActions ?? yt;
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
        const e = this.findRowById(t.rowId);
        e && (e.data[t.column] = t.oldValue);
        break;
      }
      case "add": {
        const e = this.state.rows.findIndex((i) => i.id === t.rowId);
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
        const e = this.findRowById(t.rowId);
        e && (e.data[t.column] = t.newValue);
        break;
      }
      case "add": {
        t.rowIndex >= 0 && t.rowIndex <= this.state.rows.length ? this.state.rows.splice(t.rowIndex, 0, t.rowData) : this.state.rows.push(t.rowData);
        break;
      }
      case "delete": {
        const e = this.state.rows.findIndex((i) => i.id === t.rowId);
        e !== -1 && this.state.rows.splice(e, 1);
        break;
      }
    }
    this.applyFiltersAndSort();
  }
  /**
   * 根据ID查找行
   */
  findRowById(t) {
    const e = (i) => {
      for (const s of i) {
        if (s.id === t) return s;
        if (s.children) {
          const o = e(s.children);
          if (o) return o;
        }
      }
    };
    return e(this.state.rows);
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
    const e = this.historyOptions.maxActions ?? yt;
    for (; this.historyStack.length > e && e > 0; )
      this.historyStack.shift();
  }
  exportData(t) {
    const { includeHeaders: e = !0, selectedOnly: i = !1 } = t, s = i ? this.state.sortedRows.filter((r) => r.selected) : this.state.sortedRows, o = this.getLeafColumnsList(), n = [];
    e && n.push(o.map((r) => r.title));
    for (let r = 0; r < s.length; r++) {
      const a = s[r];
      n.push(o.map((l) => Vt(l, a, r)));
    }
    return n;
  }
  getLeafColumnsList() {
    const t = [], e = (i) => {
      for (const s of i)
        s.children && s.children.length > 0 ? e(s.children) : t.push(s);
    };
    return e(this.state.columns), t;
  }
}
const Ot = 5, Pt = 2, de = 32, Ct = 150, Lt = 50, Wt = 500, ot = class ot {
  constructor(t, e) {
    C(this, "layoutInfo");
    C(this, "visibleRange");
    C(this, "config");
    C(this, "theme");
    C(this, "columnWidths", /* @__PURE__ */ new Map());
    C(this, "rowHeights", []);
    C(this, "rowOffsets", []);
    C(this, "rowBands");
    C(this, "rowPinManager");
    C(this, "rowHeightByRow", /* @__PURE__ */ new WeakMap());
    C(this, "rowIndexByRow", /* @__PURE__ */ new WeakMap());
    C(this, "bodyRowIndexByRow", /* @__PURE__ */ new WeakMap());
    C(this, "rowBandOffsetByRow", /* @__PURE__ */ new WeakMap());
    C(this, "pinnedRowByRow", /* @__PURE__ */ new WeakMap());
    C(this, "bodyRowHeights", []);
    C(this, "bodyRowOffsets", []);
    C(this, "pinnedTopHeight", 0);
    C(this, "pinnedBottomHeight", 0);
    C(this, "bodyViewportHeight", 0);
    C(this, "columnOffsets", []);
    C(this, "columns", []);
    C(this, "headerDepth", 1);
    C(this, "headerCells", []);
    C(this, "leafColumns", []);
    C(this, "cellMergeMap", /* @__PURE__ */ new Map());
    C(this, "cellMergeByRow", /* @__PURE__ */ new Map());
    C(this, "mergedCellSet", /* @__PURE__ */ new Set());
    C(this, "cellToMergeMap", /* @__PURE__ */ new Map());
    // 动态行高支持
    C(this, "rowHeightOverrides", /* @__PURE__ */ new WeakMap());
    C(this, "hasRowHeightOverrides", !1);
    C(this, "rowHeightFn");
    C(this, "cachedRows", []);
    // 缓存行引用，用于检测数据变化
    C(this, "rowHeightsDirty", !0);
    // 标记行高度是否需要重新计算
    C(this, "viewportWidth", 0);
    C(this, "viewportHeight", 0);
    C(this, "scrollLeft", 0);
    C(this, "scrollTop", 0);
    C(this, "showRowNumbers", !1);
    C(this, "rowNumberColumnWidth", 50);
    this.config = {
      enabled: (t == null ? void 0 : t.enabled) ?? !0,
      rowBufferSize: (t == null ? void 0 : t.rowBufferSize) ?? Ot,
      columnBufferSize: (t == null ? void 0 : t.columnBufferSize) ?? Pt,
      estimatedRowHeight: (t == null ? void 0 : t.estimatedRowHeight) ?? de,
      estimatedColumnWidth: (t == null ? void 0 : t.estimatedColumnWidth) ?? Ct
    }, this.theme = e, this.layoutInfo = this.createEmptyLayoutInfo(), this.rowBands = this.createEmptyRowBands(), this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
  }
  createEmptyRowBands() {
    return {
      pinnedTop: { type: "pinned-top", rows: [], height: 0, y: this.theme.row.headerHeight },
      body: { type: "body", rows: [], height: 0, y: this.theme.row.headerHeight },
      pinnedBottom: { type: "pinned-bottom", rows: [], height: 0, y: this.viewportHeight }
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
  getRowBands() {
    return {
      pinnedTop: { ...this.rowBands.pinnedTop, rows: [...this.rowBands.pinnedTop.rows] },
      body: { ...this.rowBands.body, rows: [...this.rowBands.body.rows] },
      pinnedBottom: {
        ...this.rowBands.pinnedBottom,
        rows: [...this.rowBands.pinnedBottom.rows]
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
  calculateLayout(t, e) {
    const i = (o) => {
      for (const n of o)
        if (n.fixed === "left" || n.children && i(n.children)) return !0;
      return !1;
    }, s = i(t);
    if (this.showRowNumbers) {
      const o = this.createRowNumberColumn(s);
      this.columns = [o, ...t];
    } else
      this.columns = t;
    return this.calculateHeaderLayout(this.columns), this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth, this.calculateColumnLayout(this.columns), this.calculateRowLayout(e), this.calculateCellMerges(e), this.layoutInfo.totalWidth = this.calculateTotalWidth(), this.layoutInfo.totalHeight = this.calculateTotalHeight(e.length), { ...this.layoutInfo };
  }
  /**
   * 只更新列相关的布局（用于列重排、列交换等操作）
   * 避免遍历所有行，提升大数据量时的性能
   */
  calculateColumnLayoutOnly(t) {
    const e = (s) => {
      for (const o of s)
        if (o.fixed === "left" || o.children && e(o.children)) return !0;
      return !1;
    }, i = e(t);
    if (this.showRowNumbers) {
      const s = this.createRowNumberColumn(i);
      this.columns = [s, ...t];
    } else
      this.columns = t;
    return this.calculateHeaderLayout(this.columns), this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth, this.calculateColumnLayout(this.columns), this.layoutInfo.totalWidth = this.calculateTotalWidth(), { ...this.layoutInfo };
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
              for (let M = u - 1; M >= 0; M--) {
                const T = o.children[M];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (p = T.fixed);
                  break;
                }
              }
              let x;
              for (let M = u + 1; M < o.children.length; M++) {
                const T = o.children[M];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (x = T.fixed);
                  break;
                }
              }
              const w = p === x ? p : void 0, y = ot.HIDDEN_PLACEHOLDER_PREFIX + f.key, b = {
                key: y,
                title: "",
                width: ot.HIDDEN_PLACEHOLDER_WIDTH,
                type: "text",
                fixed: w,
                _hiddenColumnKey: f.key
              }, v = ot.HIDDEN_PLACEHOLDER_WIDTH;
              this.columnWidths.set(y, v), this.leafColumns.push(b);
              const I = n + 1, E = this.headerDepth - I;
              this.headerCells.push({
                column: b,
                x: l,
                y: I * this.theme.row.headerHeight,
                width: v,
                height: this.theme.row.headerHeight * E,
                rowIndex: I,
                colIndex: this.leafColumns.length - 1,
                colspan: 1,
                rowspan: E,
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
      return a !== void 0 ? Z(a, this.theme.row.minHeight, this.theme.row.maxHeight) : o ? o(n, r) : i;
    }), t.forEach((n, r) => {
      this.rowHeightByRow.set(n, this.rowHeights[r] ?? i), this.rowIndexByRow.set(n, r);
    }), this.rowOffsets = Array.from({ length: e }), this.rowOffsets[0] = this.layoutInfo.headerHeight;
    for (let n = 1; n < e; n++)
      this.rowOffsets[n] = this.rowOffsets[n - 1] + this.rowHeights[n - 1];
    this.layoutInfo.rowOffsets = [...this.rowOffsets], this.calculateRowBands(t);
  }
  calculateRowBands(t) {
    this.bodyRowIndexByRow = /* @__PURE__ */ new WeakMap(), this.rowBandOffsetByRow = /* @__PURE__ */ new WeakMap(), this.pinnedRowByRow = /* @__PURE__ */ new WeakMap();
    const e = new Set(t), i = this.rowPinManager ? this.rowPinManager.getTopRows().filter((c) => e.has(c)) : [], s = this.rowPinManager ? this.rowPinManager.getBottomRows().filter((c) => e.has(c)) : [], o = this.rowPinManager ? t.filter((c) => !this.rowPinManager.isPinned(c)) : t;
    this.pinnedTopHeight = this.calculateRowsHeight(i), this.pinnedBottomHeight = this.calculateRowsHeight(s), this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight - this.layoutInfo.headerHeight - this.pinnedTopHeight - this.pinnedBottomHeight
    );
    const n = this.layoutInfo.headerHeight, r = n + this.pinnedTopHeight, a = this.viewportHeight > 0 ? Math.max(r, this.viewportHeight - this.pinnedBottomHeight) : r + this.calculateRowsHeight(o);
    if (this.rowBands = {
      pinnedTop: {
        type: "pinned-top",
        rows: i,
        height: this.pinnedTopHeight,
        y: n
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
        y: a
      }
    }, this.bodyRowHeights = o.map((c) => this.getResolvedRowHeight(c)), this.bodyRowOffsets = Array.from({ length: o.length }), o.length > 0) {
      this.bodyRowOffsets[0] = 0;
      for (let c = 1; c < o.length; c++)
        this.bodyRowOffsets[c] = this.bodyRowOffsets[c - 1] + this.bodyRowHeights[c - 1];
    }
    let l = 0;
    for (const c of i)
      this.pinnedRowByRow.set(c, !0), this.rowBandOffsetByRow.set(c, l), l += this.getResolvedRowHeight(c);
    for (let c = 0; c < o.length; c++) {
      const d = o[c];
      this.bodyRowIndexByRow.set(d, c), this.rowBandOffsetByRow.set(d, this.bodyRowOffsets[c] ?? 0);
    }
    let h = 0;
    for (const c of s)
      this.pinnedRowByRow.set(c, !0), this.rowBandOffsetByRow.set(c, h), h += this.getResolvedRowHeight(c);
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
      this.viewportHeight - this.layoutInfo.headerHeight - this.pinnedTopHeight - this.pinnedBottomHeight
    );
    const t = this.layoutInfo.headerHeight + this.pinnedTopHeight;
    this.rowBands.pinnedTop.y = this.layoutInfo.headerHeight, this.rowBands.body.y = t, this.rowBands.pinnedBottom.y = this.viewportHeight > 0 ? Math.max(t, this.viewportHeight - this.pinnedBottomHeight) : t + this.rowBands.body.height;
  }
  calculateRowsHeight(t) {
    return t.reduce((e, i) => e + this.getResolvedRowHeight(i), 0);
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
    let e = t.width ?? this.config.estimatedColumnWidth ?? Ct;
    return e = Z(e, t.minWidth ?? Lt, t.maxWidth ?? Wt), e;
  }
  setColumnWidth(t, e) {
    const i = this.getColumnByKey(t);
    if (i) {
      const s = Z(
        e,
        i.minWidth ?? Lt,
        i.maxWidth ?? Wt
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
    const t = this.layoutInfo.headerHeight, e = this.config.rowBufferSize ?? Ot, i = this.config.columnBufferSize ?? Pt, s = this.bodyViewportHeight > 0 ? this.bodyViewportHeight : Math.max(0, this.viewportHeight - t), o = this.findBodyRowIndexAtOffset(this.scrollTop), n = this.findBodyRowIndexAtOffset(this.scrollTop + s);
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
    return t >= e ? this.rowOffsets.length - 1 : kt(this.rowOffsets, t, (i) => i);
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
    return t >= e ? this.columnOffsets.length - 1 : kt(this.columnOffsets, t, (i) => i);
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
    return this.layoutInfo.columnWidths[t] ?? Ct;
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
    if (e < this.layoutInfo.headerHeight + this.pinnedTopHeight) {
      const a = this.findRowInBandAtOffset(
        this.rowBands.pinnedTop.rows,
        e - this.rowBands.pinnedTop.y
      );
      return a ? { row: a, band: "pinned-top", columnIndex: s } : null;
    }
    if (this.pinnedBottomHeight > 0 && e >= this.viewportHeight - this.pinnedBottomHeight) {
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
    if (!s)
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
      const l = t + this.scrollLeft;
      o = this.findColumnIndexInScrollable(l);
    }
    if (o < 0 || o >= this.layoutInfo.columnWidths.length)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const n = this.getCellAtViewportPosition(t, e, this.scrollTop);
    if (!n && s < 0)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const r = s >= 0 ? s : (n == null ? void 0 : n.rowIndex) ?? -1;
    if (r < 0 || r >= this.rowHeights.length)
      return { region: "outside", regionDetail: i, viewport: { x: t, y: e } };
    const a = this.getCellMerge(r, o);
    return a ? {
      region: "cell",
      regionDetail: i,
      cell: { rowIndex: a.rowIndex, columnIndex: a.columnIndex },
      isRowResizeHandle: s >= 0,
      resizeRowIndex: s >= 0 ? s : void 0,
      viewport: { x: t, y: e }
    } : {
      region: "cell",
      regionDetail: i,
      cell: { rowIndex: r, columnIndex: o },
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
C(ot, "HIDDEN_PLACEHOLDER_WIDTH", 5), C(ot, "HIDDEN_PLACEHOLDER_PREFIX", "__hidden_placeholder__");
let vt = ot;
class Bt {
  constructor(t = {}) {
    C(this, "maxConcurrent");
    C(this, "maxCacheSize");
    /** 已加载缓存（包含尺寸信息） */
    C(this, "cache", /* @__PURE__ */ new Map());
    /** 加载失败 */
    C(this, "failed", /* @__PURE__ */ new Set());
    /** 正在加载中 */
    C(this, "loading", /* @__PURE__ */ new Map());
    /** 等待加载队列 */
    C(this, "pendingQueue", /* @__PURE__ */ new Map());
    /** 当前帧收集的请求 */
    C(this, "frameRequests", /* @__PURE__ */ new Map());
    /** 是否已销毁 */
    C(this, "destroyed", !1);
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
class ue {
  constructor(t, e, i) {
    C(this, "ctx");
    C(this, "theme");
    C(this, "measureTextWidth");
    this.ctx = t, this.theme = e, this.measureTextWidth = i;
  }
  setContext(t) {
    this.ctx = t;
  }
  setTheme(t) {
    this.theme = t;
  }
  renderButtonsDropdown(t) {
    let o = 100;
    for (const r of t.buttons) {
      const a = r.text ?? "Button", l = this.measureTextWidth(a);
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
      this.ctx.fillStyle = c, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText(a.text ?? "Button", t.x + 8, l + 32 / 2);
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
      const x = 14, w = e + 10, y = m + (h - x) / 2;
      this.ctx.fillStyle = p ? this.theme.colors.checkbox.checkedBg : this.theme.colors.button.background, this.ctx.strokeStyle = p ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(w, y, x, x, 2), this.ctx.fill(), this.ctx.stroke(), p && (this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(w + 3, y + 7), this.ctx.lineTo(w + 6, y + 10), this.ctx.lineTo(w + 11, y + 4), this.ctx.stroke()), this.ctx.fillStyle = g.disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
      const b = w + x + 8, v = m + h / 2, I = s - (x + 28), E = ct(
        g.text,
        Math.floor(I / (this.theme.font.size * 0.6))
      );
      this.ctx.fillText(E, b, v);
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
    const c = l + 14 + 8, d = o + 32 / 2, u = n - 42, f = ct(
      t,
      Math.floor(u / (this.theme.font.size * 0.6))
    );
    this.ctx.fillText(f, c, d);
  }
  renderSingleOption(t, e, i, s, o, n) {
    i ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`) : (this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`), this.ctx.textBaseline = "middle";
    const a = s + 12, l = o + 32 / 2, h = n - 24, c = ct(
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
class fe {
  constructor(t, e) {
    C(this, "ctx");
    C(this, "theme");
    this.ctx = t, this.theme = e;
  }
  setContext(t) {
    this.ctx = t;
  }
  setTheme(t) {
    this.theme = t;
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
    o ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(o, u, d)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("输入关键字筛选...", u, d)), this.renderFilterButtons(e, i + n + a + r, s, l), this.drawPanelBorder(e, i, s, h);
  }
  renderSelectFilterDropdown(t) {
    const { x: e, y: i, width: s, options: o, scrollTop: n, hoveredIndex: r, isLoading: a } = t;
    if (!o && !a) return;
    const l = 8, h = 4, c = 32, d = 32, u = 8, f = 36, g = (o == null ? void 0 : o.length) ?? 0, m = Math.min(g, u), p = m * d, x = l + c + h + p + h + f;
    this.drawPanelBackground(e, i, s, x);
    const w = i + l;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + l, w, s - l * 2, c, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", t.searchText ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(t.searchText, e + l + 12, w + c / 2)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("搜索...", e + l + 12, w + c / 2));
    const y = i + l + c + h;
    if (a)
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("加载中...", e + l, y + d / 2);
    else if (o && o.length > 0) {
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(e, y, s, p), this.ctx.clip();
      const b = 14, v = 8, I = Math.floor(n / d), E = -(n % d);
      for (let M = 0; M <= m + 1; M++) {
        const T = I + M;
        if (T < 0 || T >= o.length) continue;
        const S = o[T];
        if (!S) continue;
        const H = y + M * d + E;
        T === r && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, H, s, d));
        const k = e + l, O = H + (d - b) / 2;
        this.ctx.strokeStyle = S.checked ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(k, O, b, b, 2), this.ctx.stroke(), S.checked && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(k, O, b, b, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(k + 3, O + 7), this.ctx.lineTo(k + 6, O + 10), this.ctx.lineTo(k + 11, O + 4), this.ctx.stroke()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const P = k + b + v, L = s - l * 2 - b - v, W = String(S.value);
        if (/^#[0-9A-Fa-f]{6}$/.test(W)) {
          const V = H + (d - 16) / 2, Y = P;
          this.ctx.fillStyle = W, this.ctx.beginPath(), this.ctx.roundRect(Y, V, 16, 16, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
          const _ = Y + 16 + 6, F = L - 16 - 6, U = ct(
            W.toUpperCase(),
            Math.floor(F / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(U, _, H + d / 2);
        } else {
          const A = ct(
            S.label,
            Math.floor(L / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(A, P, H + d / 2);
        }
      }
      if (this.ctx.restore(), o.length > u) {
        const T = o.length * d, S = Math.max(20, p / T * p), H = p - S, k = n / (T - p) * H, O = this.ctx.globalAlpha;
        this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(
          e + s - 6 - 2,
          y + k + 2,
          6,
          S,
          3
        ), this.ctx.fill(), this.ctx.globalAlpha = O;
      }
    } else
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("暂无数据", e + l, y + d / 2);
    this.renderFilterButtons(
      e,
      i + l + c + h + p + h,
      s,
      f
    ), this.drawPanelBorder(e, i, s, x);
  }
  renderRangeFilterDropdown(t) {
    const { x: e, y: i, width: s, minValue: o, maxValue: n } = t, r = 8, a = 4, l = 32, h = 8, c = 36, d = r + l + a + c;
    this.drawPanelBackground(e, i, s, d), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const u = i + r, f = (s - r * 3) / 2;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + r, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = o ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(
      o ? String(o) : "最小值",
      e + r + 8,
      u + l / 2
    );
    const g = e + r + f + h;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.beginPath(), this.ctx.roundRect(g, u, f, l, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.fillStyle = n ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(
      n ? String(n) : "最大值",
      g + 8,
      u + l / 2
    ), this.renderFilterButtons(e, i + r + l + a, s, c), this.drawPanelBorder(e, i, s, d);
  }
  renderBooleanFilterDropdown(t) {
    const { x: e, y: i, width: s, boolValue: o } = t, n = 8, r = 4, a = 32, l = 36, h = n + a * 3 + r + l;
    this.drawPanelBackground(e, i, s, h);
    const c = [
      { value: "all", label: "全部" },
      { value: "true", label: "已选" },
      { value: "false", label: "未选" }
    ], d = 14, u = 8;
    for (let f = 0; f < c.length; f++) {
      const g = c[f], m = i + n + f * a, p = o === g.value;
      p && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, s, a));
      const x = e + n, w = m + (a - d) / 2;
      this.ctx.strokeStyle = p ? this.theme.colors.button.primaryBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.arc(x + d / 2, w + d / 2, d / 2, 0, Math.PI * 2), this.ctx.stroke(), p && (this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.beginPath(), this.ctx.arc(x + d / 2, w + d / 2, d / 4, 0, Math.PI * 2), this.ctx.fill()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText(g.label, x + d + u, m + a / 2);
    }
    this.renderFilterButtons(e, i + n + a * 3 + r, s, l), this.drawPanelBorder(e, i, s, h);
  }
  renderDateRangeFilterDropdown(t) {
    const { x: e, y: i, width: s, startDate: o, endDate: n, activeDateField: r } = t, a = 8, l = 4, h = 32, c = 8, d = 36, u = a + h + l + d;
    this.drawPanelBackground(e, i, s, u), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const f = i + a, g = (s - a * 3) / 2, m = e + a, p = r === "startDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = p ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = p ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(m, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const x = o ? this.formatDate(o, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = x ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(x || "开始日期", m + 8, f + h / 2);
    const w = e + a + g + c, y = r === "endDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = y ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = y ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(w, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const b = n ? this.formatDate(n, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = b ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(b || "结束日期", w + 8, f + h / 2), this.renderFilterButtons(e, i + a + h + l, s, d), this.drawPanelBorder(e, i, s, u);
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
    const c = 8, d = 32, u = 8, f = 40, g = 28, m = 28, p = 8, w = f + g + 6 * m + p * 2, y = 240, b = (s - c * 3) / 2, v = e + c, I = e + c + b + u, E = i + c;
    let S = (r === "startDate" ? v : I) + b / 2 - y / 2;
    S < e && (S = e), S + y > e + s && (S = e + s - y);
    const H = E + d + u, k = r === "startDate" ? o : n;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(S, H, y, w, 6), this.ctx.fill(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke();
    const P = `${a}年 ${[
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月"
    ][l]}`;
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(P, S + y / 2, H + f / 2);
    const L = 6, W = S + 20, B = S + y - 20, A = H + f / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(W + L, A - L), this.ctx.lineTo(W - L, A), this.ctx.lineTo(W + L, A + L), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(B - L, A - L), this.ctx.lineTo(B + L, A), this.ctx.lineTo(B - L, A + L), this.ctx.closePath(), this.ctx.fill();
    const V = ["日", "一", "二", "三", "四", "五", "六"], Y = (y - p * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let $ = 0; $ < 7; $++) {
      const Q = S + p + $ * Y + Y / 2, tt = H + f + g / 2;
      this.ctx.fillText(V[$], Q, tt);
    }
    const F = new Date(a, l, 1).getDay(), U = new Date(a, l + 1, 0).getDate(), G = /* @__PURE__ */ new Date();
    G.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let $ = 1; $ <= U; $++) {
      const Q = F + $ - 1, tt = Math.floor(Q / 7), X = Q % 7, K = S + p + X * Y, lt = H + f + g + tt * m, rt = K + Y / 2, gt = lt + m / 2, xt = new Date(a, l, $), Xt = k && xt.getTime() === k.getTime(), Gt = h && xt.getTime() === h.getTime(), $t = xt.getTime() === G.getTime();
      if (Xt)
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.beginPath(), this.ctx.arc(rt, gt, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = "#ffffff";
      else if (Gt)
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.beginPath(), this.ctx.arc(rt, gt, m / 2 - 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
      else if ($t) {
        this.ctx.fillStyle = this.theme.colors.primary, this.ctx.fillText(String($), rt, gt), this.ctx.fillStyle = this.theme.colors.dropdown.text;
        continue;
      } else
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.textAlign = "center", this.ctx.fillText(String($), rt, gt);
    }
    this.ctx.restore();
  }
  renderFilterButtons(t, e, i, s) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(t, e, i, s), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.lineTo(t + i, e), this.ctx.stroke(), this.ctx.font = `14px ${this.theme.font.family}`;
    const r = "重置", a = "确定", l = this.ctx.measureText(a).width, h = t + 8, c = t + i - 8 - l, d = e + s / 2;
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
function ge(D) {
  D.shadowColor = "transparent", D.shadowBlur = 0, D.shadowOffsetX = 0, D.shadowOffsetY = 0;
}
function me(D, t) {
  D.shadowColor = t.colors.shadow.color, D.shadowBlur = t.colors.shadow.blur, D.shadowOffsetX = t.colors.shadow.offsetX, D.shadowOffsetY = t.colors.shadow.offsetY;
}
function pt(D, t, e) {
  const i = e.radius ?? 6;
  e.shadow && me(D, t), D.fillStyle = e.fillStyle, D.beginPath(), D.roundRect(e.x, e.y, e.width, e.height, i), D.fill(), e.shadow && ge(D), e.clip && (D.beginPath(), D.roundRect(e.x, e.y, e.width, e.height, i), D.clip()), e.strokeStyle && (D.strokeStyle = e.strokeStyle, D.lineWidth = 1, D.beginPath(), D.roundRect(e.x, e.y, e.width, e.height, i), D.stroke());
}
function At(D, t, e, i, s, o, n, r) {
  const a = D.globalAlpha;
  D.globalAlpha = t.colors.scrollbar.opacity, D.fillStyle = t.colors.scrollbar.track, D.fillRect(e, i, s, o), D.fillStyle = t.colors.scrollbar.thumb, D.fillRect(e, n, s, r), D.globalAlpha = a;
}
class pe {
  constructor(t, e, i) {
    C(this, "ctx");
    C(this, "theme");
    C(this, "loader");
    this.ctx = t, this.theme = e, this.loader = i;
  }
  setContext(t) {
    this.ctx = t;
  }
  setTheme(t) {
    this.theme = t;
  }
  renderImageTooltip(t) {
    const h = t.maxRows * 72 + 16 - 8, c = Math.ceil(t.images.length / 4), d = c * 72 - 8;
    this.ctx.save(), pt(this.ctx, this.theme, {
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
        const x = t.images[p];
        if (!x) continue;
        const w = t.x + 8 + m * 72, y = t.y + 8 + g * 72 - t.scrollTop;
        y + 64 < t.y || y > t.y + h || this.renderImageTile(
          x,
          w,
          y,
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
      At(
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
    this.ctx.save(), pt(this.ctx, this.theme, {
      x: t.x,
      y: t.y,
      width: d,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.renderUploadArea(t, d, a, o);
    const g = t.y + a, m = Math.ceil((e.length + i.length) / r), p = m * l - n, x = u - o * 2;
    this.ctx.beginPath(), this.ctx.rect(t.x, g, d, u), this.ctx.clip();
    const w = Math.floor(t.scrollTop / l), y = Math.min(m, w + t.maxRows + 1), b = [...e, ...i.map((v) => v.preview)];
    for (let v = w; v < y; v++)
      for (let I = 0; I < r; I++) {
        const E = v * r + I;
        if (E >= b.length) break;
        const M = b[E];
        if (!M) continue;
        const T = t.x + o + I * (s + n), S = g + o + v * l - t.scrollTop;
        if (S + s < g || S > g + u) continue;
        const H = E === t.hoveredIndex, k = E >= e.length;
        this.renderImageTile(M, T, S, s, H, k, !0);
      }
    if (p > x) {
      const v = x, I = Math.max(
        30,
        x / p * v
      ), E = g + o + t.scrollTop / (p - x + o * 2) * (v - I);
      At(
        this.ctx,
        this.theme,
        t.x + d - o - h,
        g + o,
        h,
        v,
        E,
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
    const r = n ? "释放以上传图片" : "点击上传或拖拽图片到此处";
    this.ctx.fillText(r, t.x + e / 2, o + i / 2);
  }
  renderImageTile(t, e, i, s, o, n, r) {
    const a = this.loader.get(t, s);
    if (a ? (this.ctx.save(), o && (this.ctx.strokeStyle = this.theme.colors.image.hoverBorder, this.ctx.lineWidth = 2, this.ctx.strokeRect(e - 1, i - 1, s + 2, s + 2)), this.ctx.drawImage(a, e, i, s, s), this.ctx.restore(), this.loader.collectVisible(t)) : (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.fillRect(e, i, s, s), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, i, s, s), this.loader.isLoading(t) || this.loader.load(t, s)), n && (this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)", this.ctx.fillRect(e, i + s - 20, s, 20), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.fillText("上传中...", e + s / 2, i + s - 10)), o && !n && r) {
      const h = e + s - 8 - 2, c = i + 16 / 2 + 2;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)", this.ctx.beginPath(), this.ctx.arc(h, c, 16 / 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.strokeStyle = "#ffffff", this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.moveTo(h - 3, c - 3), this.ctx.lineTo(h + 3, c + 3), this.ctx.moveTo(h + 3, c - 3), this.ctx.lineTo(h - 3, c + 3), this.ctx.stroke();
    }
  }
}
class xe {
  constructor(t, e, i, s, o) {
    C(this, "ctx");
    C(this, "canvas");
    C(this, "theme");
    C(this, "layoutManager");
    C(this, "dpr");
    C(this, "watermarkConfig", null);
    this.canvas = t, this.ctx = e, this.theme = i, this.layoutManager = s, this.dpr = o;
  }
  setCanvas(t, e) {
    this.canvas = t, this.ctx = e;
  }
  setTheme(t) {
    this.theme = t;
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
      const g = r[f], m = f % a, p = Math.floor(f / a), x = i + c + m * (l + h), w = s + c + p * (l + h);
      this.ctx.fillStyle = g, this.ctx.fillRect(x, w, l, l), g === n ? (this.ctx.strokeStyle = "#1890ff", this.ctx.lineWidth = 2, this.ctx.strokeRect(x - 1, w - 1, l + 2, l + 2)) : (this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(x, w, l, l));
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
      let E = "";
      for (const M of o.text.split("")) {
        const T = E + M;
        this.ctx.measureText(T).width > I - n * 2 ? (E && d.push(E), E = M) : E = T;
      }
      E && d.push(E), c += d.length * r;
    } else if (o.type === "tags") {
      const v = o.tags;
      let I = [], E = n;
      for (const M of v) {
        const T = this.ctx.measureText(M.text).width + l * 2;
        p = Math.max(p, E + T + n), E + T + a > m - n && I.length > 0 && (u.push(I), I = [], E = n), I.push(M), E += T + a;
      }
      I.length > 0 && u.push(I), c += u.length * (this.theme.font.size + l * 2) + (u.length - 1) * a;
    }
    const x = Math.max(f, Math.min(p, m));
    let w = e + (m - x) / 2;
    const y = this.canvas.width / this.dpr;
    w < 0 ? w = 4 : w + x > y && (w = y - x - 4);
    const b = i - c - this.theme.colors.tooltip.gap;
    if (this.ctx.save(), this.ctx.fillStyle = this.theme.colors.tooltip.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(w, b, x, c, 6), this.ctx.fill(), this.ctx.restore(), this.ctx.fillStyle = this.theme.colors.tooltip.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "top", o.type === "text") {
      let v = b + n;
      for (const I of d)
        this.ctx.fillText(I, w + n, v), v += r;
    } else if (o.type === "tags") {
      let v = b + n;
      const I = this.theme.font.size + l * 2;
      for (const E of u) {
        let M = w + n;
        for (const T of E) {
          const S = this.ctx.measureText(T.text).width + l * 2;
          this.ctx.fillStyle = T.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0"), this.ctx.beginPath(), this.ctx.roundRect(M, v, S, I, h), this.ctx.fill(), this.ctx.fillStyle = T.color ?? this.theme.colors.cellText ?? "#333", this.ctx.textBaseline = "middle";
          const H = M + (S - this.ctx.measureText(T.text).width) / 2;
          this.ctx.fillText(T.text, H, v + I / 2), M += S + a;
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
    const u = l * Math.PI / 180, g = this.ctx.measureText(e).width + h, m = n + c, p = Math.ceil(i / g) + 2, x = Math.ceil(s / m) + 2;
    for (let w = -1; w <= x; w++)
      for (let y = -1; y <= p; y++) {
        const b = y * g + (w % 2 === 0 ? 0 : g / 2), v = w * m;
        this.ctx.save(), this.ctx.translate(b, v), this.ctx.rotate(u), this.ctx.fillText(e, 0, 0), this.ctx.restore();
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
    const { x: e, y: i, hoveredIndex: s } = t, o = 120, n = 32, r = [{ text: "隐藏此列" }], a = r.length * n;
    this.ctx.save(), this.drawMenuPanel(e, i, o, a), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < r.length; l++) {
      const h = r[l], c = i + l * n;
      l === s && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, o, n)), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + n / 2);
    }
    this.ctx.restore();
  }
  renderDateDropdown(t) {
    const { x: e, y: i, width: s, currentYear: o, currentMonth: n, selectedDate: r, hoveredDate: a } = t, l = 40, h = 28, c = 28, d = 8, f = l + h + 6 * c + d * 2;
    this.ctx.save(), pt(this.ctx, this.theme, {
      x: e,
      y: i,
      width: s,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(e, i, s, f);
    const m = `${o}年 ${[
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月"
    ][n]}`;
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(m, e + s / 2, i + l / 2);
    const p = 6, x = e + 20, w = e + s - 20, y = i + l / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(x + p, y - p), this.ctx.lineTo(x - p, y), this.ctx.lineTo(x + p, y + p), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(w - p, y - p), this.ctx.lineTo(w + p, y), this.ctx.lineTo(w - p, y + p), this.ctx.closePath(), this.ctx.fill();
    const b = ["日", "一", "二", "三", "四", "五", "六"], v = (s - d * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let S = 0; S < 7; S++) {
      const H = e + d + S * v + v / 2, k = i + l + h / 2;
      this.ctx.fillText(b[S], H, k);
    }
    const E = new Date(o, n, 1).getDay(), M = new Date(o, n + 1, 0).getDate(), T = /* @__PURE__ */ new Date();
    T.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let S = 1; S <= M; S++) {
      const H = E + S - 1, k = Math.floor(H / 7), O = H % 7, P = e + d + O * v, L = i + l + h + k * c, W = new Date(o, n, S), B = W.getTime() === T.getTime(), A = r && W.getFullYear() === r.getFullYear() && W.getMonth() === r.getMonth() && W.getDate() === r.getDate(), V = a && W.getFullYear() === a.getFullYear() && W.getMonth() === a.getMonth() && W.getDate() === a.getDate();
      A ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        P + v / 2,
        L + c / 2,
        Math.min(v, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : V ? (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.beginPath(), this.ctx.arc(
        P + v / 2,
        L + c / 2,
        Math.min(v, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text) : B ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        P + v / 2,
        L + c / 2,
        Math.min(v, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(String(S), P + v / 2, L + c / 2);
    }
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e, i, s, f, 6), this.ctx.stroke(), this.ctx.restore();
  }
  drawMenuPanel(t, e, i, s) {
    pt(this.ctx, this.theme, {
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
class st {
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
class _t extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "text");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u } = e, f = this.getPadding(), g = this.getTextAlign(l), m = this.formatValue(c, l, h);
    i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const p = this.getTextColor(s, d, u);
    i.fillStyle = p;
    const x = r - f * 2, w = this.truncateText(i, m, x), y = this.calculateTextX(w, o, r, f, g, i), b = n + a / 2;
    return i.fillText(w, y, b), { type: "text" };
  }
  getTextColor(e, i, s) {
    return e.colors.cellText;
  }
  formatValue(e, i, s) {
    return e == null ? "" : i.formatter ? i.formatter(e, s, i) : String(e);
  }
}
class we extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "number");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u } = e, f = this.getPadding(), g = this.getTextAlign(l), m = this.formatValue(c, l, h);
    i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const p = this.getTextColor(s, d, u);
    i.fillStyle = p;
    const x = r - f * 2, w = this.truncateText(i, m, x), y = this.calculateTextX(w, o, r, f, g, i), b = n + a / 2;
    return i.fillText(w, y, b), { type: "number" };
  }
  getTextColor(e, i, s) {
    return e.colors.cellText;
  }
  formatValue(e, i, s) {
    return e == null ? "" : i.formatter ? i.formatter(e, s, i) : typeof e == "number" ? e.toLocaleString() : String(e);
  }
}
class ye extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "checkbox");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = o + (r - d) / 2, f = n + (a - d) / 2, g = h ?? !1;
    return i.fillStyle = g ? s.colors.checkbox.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.checkbox.border, i.lineWidth = 1, i.beginPath(), i.roundRect(u, f, d, d, 3), i.fill(), i.stroke(), c.indeterminate ? (i.strokeStyle = g ? s.colors.checkbox.border : s.colors.checkbox.checkedBg, i.lineWidth = 2, i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d - 4, f + d / 2), i.stroke()) : c.checked && (i.strokeStyle = g ? s.colors.checkbox.border : s.colors.checkbox.checkedBg, i.lineWidth = 2, i.lineCap = "round", i.lineJoin = "round", i.beginPath(), i.moveTo(u + 4, f + d / 2), i.lineTo(u + d / 2 - 1, f + d - 5), i.lineTo(u + d - 3, f + 4), i.stroke()), { type: "checkbox", config: c };
  }
}
class Ce extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "radio");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = 8, f = 4, g = h ?? !1;
    if (i.save(), i.beginPath(), i.rect(o, n, r, a), i.clip(), c.options && c.options.length > 0) {
      i.font = `${s.font.size}px ${s.font.family}`;
      const m = c.options.map((w) => {
        const y = i.measureText(w.label).width;
        return d + f + y + u;
      });
      let p = o + u;
      const x = o + r - u;
      for (let w = 0; w < c.options.length; w++) {
        const y = c.options[w], b = m[w];
        if (p + b - u > x)
          break;
        const v = p, I = n + (a - d) / 2, E = v + d / 2, M = I + d / 2, T = y.disabled || g, S = c.value === y.value;
        i.fillStyle = T ? s.colors.radio.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(E, M, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), S && (i.fillStyle = T ? s.colors.radio.border : s.colors.radio.checkedBg, i.beginPath(), i.arc(E, M, d / 2 - 4, 0, Math.PI * 2), i.fill()), i.fillStyle = T ? s.colors.placeholderText : s.colors.cellText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
        const H = v + d + f;
        i.fillText(y.label, H, M), p += b;
      }
    } else {
      const m = o + (r - d) / 2, p = n + (a - d) / 2, x = m + d / 2, w = p + d / 2;
      i.fillStyle = g ? s.colors.radio.disabledBg : s.colors.button.background, i.strokeStyle = s.colors.radio.border, i.lineWidth = 1, i.beginPath(), i.arc(x, w, d / 2, 0, Math.PI * 2), i.fill(), i.stroke(), c.checked && (i.fillStyle = g ? s.colors.radio.border : s.colors.radio.checkedBg, i.beginPath(), i.arc(x, w, d / 2 - 4, 0, Math.PI * 2), i.fill());
    }
    return i.restore(), { type: "radio", config: c };
  }
}
class be extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "button");
  }
  render(e) {
    const { value: i, buttonHoverState: s } = e, o = i;
    return this.isButtonsConfig(o) ? this.renderButtons(e, o) : this.renderSingleButton(e, o, s == null ? void 0 : s.progress);
  }
  isButtonsConfig(e) {
    return "buttons" in e;
  }
  renderSingleButton(e, i, s) {
    const { ctx: o, theme: n, x: r, y: a, width: l, height: h, isDisabled: c } = e, d = 8, u = i.size === "small" ? 24 : i.size === "large" ? 40 : 32, f = a + (h - u) / 2, g = c ?? !1, m = i.text ?? "Button";
    o.font = `${n.font.size}px ${n.font.family}`;
    const p = o.measureText(m).width, w = Math.min(
      Math.max(p + 16 * 2, 60),
      l - d * 2
    ), y = r + (l - w) / 2, b = s ?? 0;
    let v, I, E;
    if (g)
      v = n.colors.button.disabledBg, I = n.colors.button.disabledText, E = n.colors.button.disabledBorder;
    else
      switch (i.variant) {
        case "primary":
          v = n.colors.button.primaryBg, I = n.colors.button.primaryText, E = v;
          break;
        case "danger":
          v = n.colors.button.dangerBg, I = n.colors.button.dangerText, E = v;
          break;
        case "warning":
          v = n.colors.button.warningBg, I = n.colors.button.warningText, E = v;
          break;
        case "link":
          v = "transparent", I = n.colors.button.linkText, E = "transparent";
          break;
        default:
          v = n.colors.button.background, I = n.colors.button.text, E = n.colors.button.border;
      }
    if (!g && b > 0 && i.variant !== "link")
      if (i.variant === "default" || !i.variant) {
        const T = this.hexToRgb(n.colors.button.background);
        if ((T.r * 299 + T.g * 587 + T.b * 114) / 1e3 > 128) {
          const H = Math.round(T.r - b * 0.2 * T.r);
          v = `rgb(${H}, ${H}, ${H})`;
        } else {
          const H = Math.round(T.r + b * 0.2 * (255 - T.r));
          v = `rgb(${H}, ${H}, ${H})`;
        }
      } else
        o.globalAlpha = 1 - b * 0.2;
    o.fillStyle = v, o.strokeStyle = E, o.lineWidth = 1;
    const M = 4;
    return o.beginPath(), o.roundRect(y, f, w, u, M), o.fill(), o.stroke(), !g && b > 0 && i.variant !== "link" && (o.globalAlpha = 1), o.fillStyle = I, o.font = `${n.font.size}px ${n.font.family}`, o.textBaseline = "middle", o.textAlign = "center", o.fillText(m, y + w / 2, f + u / 2), o.textAlign = "left", { type: "button", config: i };
  }
  renderButtons(e, i) {
    const { ctx: s, theme: o, x: n, y: r, height: a, isDisabled: l, hoveredButtonIndex: h } = e, c = 8, d = i.gap ?? 4, u = i.maxVisible ?? 3, f = 24, g = r + (a - f) / 2, m = i.buttons.filter((y) => y.visible !== !1), p = m.slice(0, u), x = m.slice(u);
    let w = n + c;
    for (let y = 0; y < p.length; y++) {
      const b = p[y], v = b.text ?? "Button";
      s.font = `${o.font.size}px ${o.font.family}`;
      const I = s.measureText(v).width, E = Math.max(I + 16, 40), M = h === y && !l, T = l ?? !1;
      let S, H, k;
      T ? (S = o.colors.button.disabledBg, H = o.colors.button.disabledText, k = o.colors.button.disabledBorder) : b.variant === "primary" ? (S = o.colors.button.primaryBg, H = o.colors.button.primaryText, k = S) : b.variant === "danger" ? (S = o.colors.button.dangerBg, H = o.colors.button.dangerText, k = S) : b.variant === "warning" ? (S = o.colors.button.warningBg, H = o.colors.button.warningText, k = S) : b.variant === "link" ? (S = "transparent", H = o.colors.button.linkText, k = "transparent") : (S = M ? o.colors.button.hoverBg : o.colors.button.background, H = o.colors.button.text, k = o.colors.button.border), s.fillStyle = S, s.strokeStyle = k, s.lineWidth = 1, s.beginPath(), s.roundRect(w, g, E, f, 4), s.fill(), s.stroke(), s.fillStyle = H, s.font = `${o.font.size}px ${o.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(v, w + E / 2, g + f / 2), w += E + d;
    }
    if (x.length > 0) {
      const y = i.moreButtonText ?? "···", b = s.measureText(y).width, v = Math.max(b + 16, 32), I = h === p.length;
      s.fillStyle = I ? o.colors.button.hoverBg : o.colors.button.background, s.strokeStyle = o.colors.button.border, s.lineWidth = 1, s.beginPath(), s.roundRect(w, g, v, f, 4), s.fill(), s.stroke(), s.fillStyle = o.colors.button.text, s.font = `${o.font.size}px ${o.font.family}`, s.textBaseline = "middle", s.textAlign = "center", s.fillText(y, w + v / 2, g + f / 2);
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
class ve extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "switch");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h, switchAnimation: c } = e, d = l, u = 44, f = 22, g = 18, m = o + (r - u) / 2, p = n + (a - f) / 2, x = f / 2, w = d.checked ?? !1, y = h ?? !1, b = (c == null ? void 0 : c.progress) ?? (w ? 1 : 0), v = u - g - 4, I = m + 2 + b * v, E = p + (f - g) / 2;
    i.save();
    const M = y ? s.colors.switch.disabledOffBg : s.colors.switch.offBg, T = y ? s.colors.switch.disabledOnBg : s.colors.switch.onBg, S = this.hexToRgb(M), H = this.hexToRgb(T), k = Math.round(S.r + (H.r - S.r) * b), O = Math.round(S.g + (H.g - S.g) * b), P = Math.round(S.b + (H.b - S.b) * b);
    return i.fillStyle = `rgb(${k}, ${O}, ${P})`, i.beginPath(), i.roundRect(m, p, u, f, x), i.fill(), i.fillStyle = s.colors.switch.thumb, i.beginPath(), i.arc(I + g / 2, E + g / 2, g / 2, 0, Math.PI * 2), i.fill(), i.shadowColor = s.colors.shadow.color, i.shadowBlur = s.colors.shadow.blur, i.shadowOffsetX = s.colors.shadow.offsetX, i.shadowOffsetY = s.colors.shadow.offsetY, i.restore(), { type: "switch", config: d };
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
const Ft = 32;
class Re extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "progress");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = h.shape ?? "line";
    return c === "line" ? this.renderLineProgress(i, s, o, n, r, a, h) : c === "circle" ? this.renderCircleProgress(i, s, o, n, r, a, h) : c === "dashboard" && this.renderDashboardProgress(i, s, o, n, r, a, h), { type: "progress", config: h };
  }
  renderLineProgress(e, i, s, o, n, r, a) {
    const h = a.textPosition ?? "right", c = a.showText ?? !0, d = a.size ?? "medium";
    e.save();
    const u = a.height ?? (d === "small" ? 6 : d === "large" ? 16 : 10), f = 8, g = c && h === "right" ? 40 : 0, m = a.width ?? n - 8 * 2 - g, p = s + 8, x = o + (r - u) / 2, w = Math.min(100, Math.max(0, a.value)), y = this.getProgressColor(i, a, w), b = a.trackColor ?? i.colors.progress.track, v = a.borderRadius ?? u / 2;
    e.fillStyle = b, e.beginPath(), e.roundRect(p, x, m, u, v), e.fill();
    const I = w / 100 * m;
    if (I > 0) {
      e.fillStyle = y, e.beginPath();
      const E = Math.max(I, v * 2);
      e.roundRect(p, x, E, u, v), e.fill();
    }
    if (c) {
      const E = a.precision ?? 0, M = a.format ? a.format(w) : `${E === 0 ? Math.round(w) : w.toFixed(E)}%`;
      let T;
      h === "inside" ? T = Math.min(i.font.size, Math.max(10, u - 2)) : T = d === "small" ? 11 : d === "large" ? 14 : i.font.size, e.font = `${T}px ${i.font.family}`, e.textBaseline = "middle", h === "right" ? (e.textAlign = "left", e.fillStyle = a.textColor ?? i.colors.cellText, e.fillText(M, p + m + f, o + r / 2)) : (e.textAlign = "center", e.fillStyle = a.textColor ?? i.colors.cellText, e.fillText(M, p + m / 2, o + r / 2));
    }
    e.restore();
  }
  renderCircleProgress(e, i, s, o, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(Ft * (l === "small" ? 0.6 : l === "large" ? 0.9 : 0.75)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.12)), f = s + n / 2, g = o + r / 2, m = (d - u) / 2, p = Math.min(100, Math.max(0, a.value)), x = this.getProgressColor(i, a, p), w = a.trackColor ?? i.colors.progress.track;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.beginPath(), e.arc(f, g, m, 0, Math.PI * 2), e.stroke();
    const y = p / 100, b = -Math.PI / 2, v = b + y * Math.PI * 2;
    if (y > 0 && (e.strokeStyle = x, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, b, v), e.stroke()), a.showText ?? !0) {
      const I = a.precision ?? 0, E = a.format ? a.format(p) : `${I === 0 ? Math.round(p) : p.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? i.colors.cellText;
      const M = Math.max(8, Math.round(d * 0.32));
      e.font = `bold ${M}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(E, f, g);
    }
    e.restore();
  }
  renderDashboardProgress(e, i, s, o, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(Ft * (l === "small" ? 0.7 : l === "large" ? 0.95 : 0.85)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.1)), f = s + n / 2, g = o + r / 2 + r * 0.05, m = (d - u) / 2, p = Math.min(100, Math.max(0, a.value)), x = this.getProgressColor(i, a, p), w = a.trackColor ?? i.colors.progress.track, y = Math.PI * 0.75, b = Math.PI * 1.5;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, y, y + b, !1), e.stroke();
    const v = p / 100;
    if (v > 0) {
      const I = y + v * b;
      e.strokeStyle = x, e.beginPath(), e.arc(f, g, m, y, I, !1), e.stroke();
    }
    if (a.showText ?? !0) {
      const I = a.precision ?? 0, E = a.format ? a.format(p) : `${I === 0 ? Math.round(p) : p.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? i.colors.cellText;
      const M = Math.max(8, Math.round(d * 0.28));
      e.font = `bold ${M}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(E, f, g);
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
const Ie = 32, it = class it extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "image");
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
    const f = this.getMaxImageSize(r, a, 4, d), g = d.width ?? 32, m = d.height ?? 32, p = Math.min(g, f), x = Math.min(m, f), w = d.circle ? Math.min(p, x) / 2 : d.borderRadius ?? 0, y = o + (r - p) / 2, b = n + (a - x) / 2;
    if (i.fillStyle = s.colors.image.placeholderBg, i.beginPath(), w > 0 ? i.roundRect(y, b, p, x, w) : i.rect(y, b, p, x), i.fill(), it.failedImages.has(d.src))
      return this.renderImageError(
        i,
        s,
        y,
        b,
        p,
        x,
        w,
        d.errorImage
      ), { type: "image", config: d };
    const v = it.imageCache.get(d.src);
    return v ? (i.save(), i.beginPath(), w > 0 ? i.roundRect(y, b, p, x, w) : i.rect(y, b, p, x), i.clip(), this.drawImageWithFit(
      i,
      v,
      y,
      b,
      p,
      x,
      d.fit ?? "cover"
    ), i.restore()) : it.loadingImages.has(d.src) ? this.renderImagePlaceholder(
      i,
      s,
      y,
      b,
      p,
      x,
      w,
      d.placeholder
    ) : this.renderImagePlaceholder(
      i,
      s,
      y,
      b,
      p,
      x,
      w,
      d.placeholder
    ), h && d.hoverable !== !1 && this.renderImageHover(i, s, y, b, p, x, w), { type: "image", config: d };
  }
  renderMultipleImages(e, i, s, o, n, r, a, l, h) {
    const c = a.images, d = 4, u = this.getMaxImageSize(n, r, d, a), f = a.width ?? 32, g = a.height ?? 32, m = Math.min(f, u), p = Math.min(g, u), x = a.gap ?? 4, w = a.circle ? Math.min(m, p) / 2 : a.borderRadius ?? 0, y = a.showMoreCount !== !1, b = n - d * 2, v = r - d * 2, I = Math.max(1, Math.floor((b + x) / (m + x))), E = Math.max(1, Math.floor((v + x) / (p + x))), M = I * E, T = a.maxVisible ?? M, H = y && c.length > T ? Math.max(1, M - 1) : M, k = Math.max(1, Math.min(T, H)), O = c.length > k, P = O ? k : c.length, L = c.slice(0, P), W = O ? c.length - k : 0, B = P + (O && y ? 1 : 0), A = Math.max(1, Math.ceil(B / I)), V = Math.min(B, I), Y = V * m + Math.max(0, V - 1) * x, _ = A * p + Math.max(0, A - 1) * x;
    let F = s + (n - Y) / 2;
    F = Math.max(s + d, F);
    const U = o + (r - _) / 2;
    for (let G = 0; G < L.length; G++) {
      const $ = L[G], Q = Math.floor(G / I), tt = G % I, X = F + tt * (m + x), K = U + Q * (p + x), lt = l && a.hoverable !== !1 && h === G;
      if (e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), w > 0 ? e.roundRect(X, K, m, p, w) : e.rect(X, K, m, p), e.fill(), it.failedImages.has($)) {
        this.renderImageError(
          e,
          i,
          X,
          K,
          m,
          p,
          w,
          a.errorImage
        ), lt && this.renderImageHover(e, i, X, K, m, p, w);
        continue;
      }
      const rt = it.imageCache.get($);
      rt ? (e.save(), e.beginPath(), w > 0 ? e.roundRect(X, K, m, p, w) : e.rect(X, K, m, p), e.clip(), this.drawImageWithFit(
        e,
        rt,
        X,
        K,
        m,
        p,
        a.fit ?? "cover"
      ), e.restore()) : this.renderImagePlaceholder(
        e,
        i,
        X,
        K,
        m,
        p,
        w,
        a.placeholder
      ), lt && this.renderImageHover(e, i, X, K, m, p, w);
    }
    if (O && y) {
      const G = Math.floor(P / I), $ = P % I, Q = F + $ * (m + x), tt = U + G * (p + x), X = l && a.hoverable !== !1 && h === P;
      this.renderMoreCount(
        e,
        i,
        Q,
        tt,
        m,
        p,
        w,
        W,
        X
      );
    }
    return { type: "image", config: a };
  }
  renderImagePlaceholder(e, i, s, o, n, r, a, l) {
    e.fillStyle = i.colors.image.placeholderBg, e.beginPath(), a > 0 ? e.roundRect(s, o, n, r, a) : e.rect(s, o, n, r), e.fill(), l && (e.fillStyle = i.colors.placeholderText, e.font = `${Math.min(12, n / 4)}px ${i.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(l, s + n / 2, o + r / 2), e.textAlign = "left");
  }
  getMaxImageSize(e, i, s, o) {
    const n = o.scaleWithRowHeight === !1 ? Math.min(i, Ie) : i;
    return Math.max(0, Math.min(e, n) - s * 2);
  }
  renderImageError(e, i, s, o, n, r, a, l) {
    if (e.fillStyle = i.colors.image.errorBg ?? "#f0f0f0", e.beginPath(), a > 0 ? e.roundRect(s, o, n, r, a) : e.rect(s, o, n, r), e.fill(), l) {
      const h = it.imageCache.get(l);
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
    it.imageCache.clear(), it.loadingImages.clear(), it.failedImages.clear();
  }
};
/**
 * Image cache reference - set by Renderer during initialization
 */
C(it, "imageCache", /* @__PURE__ */ new Map()), C(it, "loadingImages", /* @__PURE__ */ new Set()), C(it, "failedImages", /* @__PURE__ */ new Set());
let ft = it;
class Ee extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "tag");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = 8, { tags: d } = h;
    if (!d || d.length === 0)
      return { type: "tag", config: h };
    const u = 4, f = s.font.size + u * 2, g = 4, m = 4, p = 2, x = "...", w = r - c * 2, y = Math.max(1, Math.floor((a - c * 2) / (f + p))), b = Math.min(h.maxRows ?? y, y), v = /* @__PURE__ */ new Map(), I = (W) => {
      let B = v.get(W);
      return B === void 0 && (B = i.measureText(W).width, v.set(W, B)), B;
    }, E = (W) => {
      const B = `+${W}`;
      return I(B) + u * 2;
    }, M = (W) => I(W.text) + u * 2, T = I(x), S = [];
    let H = [], k = 0, O = 0;
    for (let W = 0; W < d.length; W++) {
      const B = d[W], A = M(B), V = S.length >= b - 1, Y = d.length - W;
      if (V) {
        const _ = Y > 1 ? E(Y - 1) + m : 0, F = w - k - _;
        if (A <= F)
          H.push({ tag: B, displayText: B.text, width: A }), k += A + m, O++;
        else {
          const U = w - k - _;
          if (U >= u * 2 + T + 10) {
            const G = U - u * 2 - T;
            let $ = "", Q = 0, tt = B.text.length;
            for (; Q < tt; ) {
              const X = Math.floor((Q + tt + 1) / 2), K = B.text.slice(0, X);
              I(K) <= G ? (Q = X, $ = K) : tt = X - 1;
            }
            if ($.length > 0) {
              const X = $ + x, K = I(X) + u * 2;
              H.push({ tag: B, displayText: X, width: K }), O++;
            }
          }
          break;
        }
      } else if (A <= w - k)
        H.push({ tag: B, displayText: B.text, width: A }), k += A + m, O++;
      else if (H.length > 0 && S.push(H), H = [{ tag: B, displayText: B.text, width: A }], k = A + m, O++, S.length >= b)
        break;
    }
    H.length > 0 && S.length < b && S.push(H);
    const P = S.length * f + (S.length - 1) * p, L = n + (a - P) / 2;
    for (let W = 0; W < S.length; W++) {
      const B = S[W], A = L + W * (f + p);
      let V = o + c;
      for (const { tag: Y, displayText: _, width: F } of B) {
        let U = Y.bgColor ?? (s.colors.tagColors.default || "#f0f0f0"), G = Y.color ?? s.colors.cellText;
        i.fillStyle = U, i.beginPath(), i.roundRect(V, A, F, f, g), i.fill(), i.fillStyle = G, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
        const $ = A + f / 2, Q = V + (F - I(_)) / 2;
        i.fillText(_, Q, $), V += F + m;
      }
      if (W === S.length - 1) {
        const Y = d.length - O;
        if (Y > 0) {
          const _ = `+${Y}`, F = E(Y);
          i.fillStyle = s.colors.moreCount.background, i.beginPath(), i.roundRect(V, A, F, f, g), i.fill(), i.fillStyle = s.colors.moreCount.text, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
          const U = A + f / 2, G = V + (F - I(_)) / 2;
          i.fillText(_, G, U);
        }
      }
    }
    return { type: "tag", config: h };
  }
}
class Me extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "date");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = 8, d = 20;
    i.strokeStyle = s.colors.date.border, i.lineWidth = 1, i.beginPath(), i.rect(o, n, r, a), i.stroke();
    let u = "";
    if (h.value) {
      const b = h.value instanceof Date ? h.value : new Date(h.value);
      if (!isNaN(b.getTime())) {
        const v = h.format ?? "YYYY-MM-DD";
        u = this.formatDate(b, v);
      }
    }
    const f = h.placeholder ?? "选择日期", g = u || f;
    i.fillStyle = u ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const m = r - c * 2 - d, p = "...";
    let x = g;
    if (i.measureText(g).width > m) {
      let b = g;
      for (; b.length > 0 && i.measureText(b + p).width > m; )
        b = b.slice(0, -1);
      x = b + p;
    }
    i.fillText(x, o + c, n + a / 2), i.strokeStyle = s.colors.date.icon, i.lineWidth = 1.5;
    const w = o + r - c - 10, y = n + a / 2;
    return i.beginPath(), i.moveTo(w - 6, y - 6), i.lineTo(w - 6, y + 6), i.lineTo(w + 6, y + 6), i.lineTo(w + 6, y - 6), i.closePath(), i.stroke(), i.beginPath(), i.moveTo(w - 6, y - 2), i.lineTo(w + 6, y - 2), i.stroke(), i.beginPath(), i.moveTo(w - 3, y - 8), i.lineTo(w - 3, y - 5), i.stroke(), i.beginPath(), i.moveTo(w + 3, y - 8), i.lineTo(w + 3, y - 5), i.stroke(), { type: "date", config: h };
  }
  formatDate(e, i) {
    const s = e.getFullYear(), o = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0"), r = String(e.getHours()).padStart(2, "0"), a = String(e.getMinutes()).padStart(2, "0"), l = String(e.getSeconds()).padStart(2, "0");
    return i.replace("YYYY", String(s)).replace("MM", o).replace("DD", n).replace("HH", r).replace("mm", a).replace("ss", l);
  }
}
class Se extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "select");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, multipleSelectSeparator: h } = e, c = l, d = 8, u = 20;
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(o, n, r, a), i.stroke();
    const f = s.font.size, g = f * 1.5;
    if (c.multiple && Array.isArray(c.value) && c.value.length > 0) {
      const x = this.calculateMaxRows(a, g, d), w = r - d * 2 - u, y = c.value.map((M) => {
        const T = c.options.find((S) => S.value === M);
        return (T == null ? void 0 : T.label) ?? String(M);
      }), b = c.separator ?? h ?? ", ", v = this.wrapTextToLines(i, y.join(b), w, x);
      i.fillStyle = s.colors.cellText, i.font = `${f}px ${s.font.family}`, i.textBaseline = "top";
      const I = v.length * g, E = n + (a - I) / 2;
      for (let M = 0; M < v.length; M++) {
        const T = v[M];
        i.fillText(T, o + d, E + M * g + (g - f) / 2);
      }
    } else {
      let x = "";
      if (c.value !== void 0 && c.value !== null) {
        const I = c.options.find((E) => E.value === c.value);
        x = (I == null ? void 0 : I.label) ?? String(c.value);
      }
      const w = c.placeholder ?? "请选择", y = x || w;
      i.fillStyle = x ? s.colors.cellText : s.colors.placeholderText, i.font = `${f}px ${s.font.family}`, i.textBaseline = "middle";
      const b = r - d * 2 - u, v = this.truncateText(i, y, b);
      i.fillText(v, o + d, n + a / 2);
    }
    i.fillStyle = s.colors.date.icon, i.beginPath();
    const m = o + r - d - 8, p = n + a / 2;
    return i.moveTo(m - 4, p - 2), i.lineTo(m, p + 3), i.lineTo(m + 4, p - 2), i.closePath(), i.fill(), { type: "select", config: c };
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
class Te extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "input");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = 8;
    i.strokeStyle = s.colors.input.border, i.lineWidth = 1, i.beginPath(), i.rect(o, n, r, a), i.stroke();
    const d = h.value ?? "", u = h.placeholder ?? "", f = d || u;
    i.fillStyle = d ? s.colors.cellText : s.colors.placeholderText, i.font = `${s.font.size}px ${s.font.family}`, i.textBaseline = "middle";
    const g = r - c * 2;
    if (h.multiline) {
      const m = s.font.size * 1.5, p = h.maxRows ?? 5, x = a - c * 2, w = Math.max(1, Math.floor(x / m)), y = Math.min(p, w), b = this.wrapText(i, f, g), v = b.slice(0, y), I = v.length * m;
      let M = n + (a - I) / 2 + m / 2;
      for (let T = 0; T < v.length; T++) {
        let S = v[T];
        const H = T === v.length - 1, k = b.length > v.length;
        H && (S = this.truncateTextWithEllipsis(i, S, g, k)), i.fillText(S, o + c, M), M += m;
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
class De extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "rating");
  }
  render(e) {
    const { ctx: i, x: s, y: o, width: n, height: r, value: a, isDisabled: l } = e, h = a, c = h.value ?? 0, d = h.max ?? 5, u = h.starSize ?? 16, f = h.allowHalf ?? !1, g = h.color ?? "#FFD700", m = h.inactiveColor ?? "#E0E0E0", p = h.disabledColor ?? "#BDBDBD", x = l ? p : g, w = l ? p : m, y = d * u, b = s + (n - y) / 2, v = o + (r - u) / 2;
    i.save();
    const I = [];
    for (let E = 0; E < d; E++) {
      const M = b + E * u;
      I.push({
        index: E,
        x: M,
        width: u
      });
      const T = c - E;
      let S = 0;
      T >= 1 ? S = 1 : T > 0 && (S = f ? T : 0), this.drawStar(i, M, v, u, S, x, w);
    }
    return i.restore(), {
      type: "rating",
      config: { ...h, value: c },
      starBounds: I
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
const He = 32;
class ke extends st {
  constructor() {
    super(...arguments);
    C(this, "type", "color");
  }
  render(e) {
    const { ctx: i, theme: s, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, u = Math.min(He - 8 * 2, 24), f = o + (r - u) / 2, g = n + (a - u) / 2;
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
class Oe {
  constructor() {
    C(this, "enabled", !1);
    C(this, "stats", /* @__PURE__ */ new Map());
    C(this, "currentFrame", null);
    C(this, "frameHistory", []);
    C(this, "maxFrameHistory", 60);
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
let bt = null;
function Pe() {
  return bt || (bt = new Oe()), bt;
}
class Le {
  constructor() {
    C(this, "renderers", /* @__PURE__ */ new Map());
    C(this, "defaultRenderer");
    C(this, "performanceMonitor");
    this.register(new _t()), this.register(new we()), this.register(new ye()), this.register(new Ce());
    const t = new be();
    this.register(t), this.renderers.set("buttons", t), this.register(new ve()), this.register(new Re()), this.register(new ft()), this.register(new Ee()), this.register(new Me()), this.register(new Se()), this.register(new Te()), this.register(new De()), this.register(new ke()), this.defaultRenderer = new _t(), this.performanceMonitor = Pe();
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
    return t;
  }
}
class We {
  constructor(t) {
    C(this, "measurementEngine");
    C(this, "layoutResults", []);
    this.measurementEngine = t;
  }
  /**
   * 计算元素树布局，返回所有元素的绝对坐标
   */
  layout(t, e, i) {
    return this.layoutResults = [], this.layoutElement(t, e, i), this.layoutResults.sort((s, o) => (s.zIndex ?? 0) - (o.zIndex ?? 0));
  }
  layoutElement(t, e, i) {
    if (t.type === "CTGroup" && t.props.display === "flex")
      return this.layoutGroup(t, e, i);
    if (t.type === "CTGroup" && t.props.position === "relative")
      return this.layoutPositionedGroup(t, e, i);
    const s = this.measurementEngine.measureElement(t), o = t.props.zIndex, n = { x: e, y: i, width: s.width, height: s.height, zIndex: o };
    return this.layoutResults.push(n), n;
  }
  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  layoutPositionedGroup(t, e, i) {
    const s = t.props, o = t.children || [], n = s.width ?? 100, r = s.height ?? 100, a = [...o].sort((l, h) => {
      const c = l.props.zIndex ?? 0, d = h.props.zIndex ?? 0;
      return c - d;
    });
    for (const l of a) {
      const h = e + (l.props.x ?? 0), c = i + (l.props.y ?? 0);
      this.layoutElement(l, h, c);
    }
    return { x: e, y: i, width: n, height: r };
  }
  layoutGroup(t, e, i) {
    const s = t.props, o = t.children || [], n = this.parsePadding(s.padding), r = o.map((f) => {
      if (f.type === "CTGroup" && f.props.display === "flex")
        return this.measureGroupSize(f);
      if (f.type === "CTGroup" && f.props.position === "relative") {
        const g = f.props;
        return {
          x: 0,
          y: 0,
          width: g.width ?? 100,
          height: g.height ?? 100
        };
      }
      return this.measurementEngine.measureElement(f);
    }), a = this.calculateContentSize(r, s), l = this.calculateContentHeight(r, s), h = s.width ?? a + n.left + n.right, c = s.height ?? l + n.top + n.bottom, d = e + n.left, u = i + n.top;
    return this.layoutChildren(o, r, d, u, s), { x: e, y: i, width: h, height: c };
  }
  /**
   * 测量 group 尺寸，不影响 layoutResults
   */
  measureGroupSize(t) {
    const e = t.props, i = t.children || [], s = this.parsePadding(e.padding), o = i.map((h) => h.type === "CTGroup" && h.props.display === "flex" ? this.measureGroupSize(h) : this.measurementEngine.measureElement(h)), n = this.calculateContentSize(o, e), r = this.calculateContentHeight(o, e), a = e.width ?? n + s.left + s.right, l = e.height ?? r + s.top + s.bottom;
    return { x: 0, y: 0, width: a, height: l };
  }
  parsePadding(t) {
    return t === void 0 ? { top: 0, right: 0, bottom: 0, left: 0 } : typeof t == "number" ? { top: t, right: t, bottom: t, left: t } : {
      top: t.top ?? 0,
      right: t.right ?? 0,
      bottom: t.bottom ?? 0,
      left: t.left ?? 0
    };
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
  layoutChildren(t, e, i, s, o) {
    const n = o.flexDirection ?? "row", r = o.justifyContent ?? "flex-start", a = o.alignItems ?? "flex-start";
    let l = o.gap ?? 0;
    const h = this.calculateContentSize(e, o), c = this.calculateContentHeight(e, o), d = (o.width ?? h) - (o.padding ? this.parsePadding(o.padding).left + this.parsePadding(o.padding).right : 0), u = (o.height ?? c) - (o.padding ? this.parsePadding(o.padding).top + this.parsePadding(o.padding).bottom : 0);
    let f = 0;
    n === "row" || n === "row-reverse" ? r === "center" ? f = (d - h) / 2 : r === "flex-end" ? f = d - h : r === "space-between" && t.length > 1 && (l = (d - e.reduce((p, x) => p + x.width, 0)) / (t.length - 1)) : r === "center" ? f = (u - c) / 2 : r === "flex-end" ? f = u - c : r === "space-between" && t.length > 1 && (l = (u - e.reduce((p, x) => p + x.height, 0)) / (t.length - 1));
    let g = f;
    for (let m = 0; m < t.length; m++) {
      const p = t[m], x = e[m];
      let w = 0;
      n === "row" || n === "row-reverse" ? a === "center" ? w = (u - x.height) / 2 : a === "flex-end" && (w = u - x.height) : a === "center" ? w = (d - x.width) / 2 : a === "flex-end" && (w = d - x.width);
      let y, b;
      n === "row" ? (y = i + g, b = s + w) : n === "row-reverse" ? (y = i + d - g - x.width, b = s + w) : n === "column" ? (y = i + w, b = s + g) : (y = i + w, b = s + u - g - x.height), this.layoutElement(p, y, b), g += (n === "row" || n === "row-reverse" ? x.width : x.height) + l;
    }
  }
}
class Be {
  constructor(t) {
    C(this, "ctx");
    this.ctx = t;
  }
  measureTextWidth(t, e, i) {
    return this.ctx.font = `${e}px ${i}`, this.ctx.measureText(t).width;
  }
  measureElement(t) {
    switch (t.type) {
      case "CTText":
        return this.measureText(t);
      case "CTRect":
        return this.measureRect(t);
      case "CTCircle":
        return this.measureCircle(t);
      case "CTImage":
        return this.measureImage(t);
      case "CTLine":
        return this.measureLine(t);
      case "CTGroup":
        return { x: 0, y: 0, width: 0, height: 0 };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }
  measureText(t) {
    const e = t.props, i = e.fontSize ?? 14, s = e.fontFamily ?? "Arial", o = e.lineHeight ?? i;
    let n = this.measureTextWidth(e.text, i, s);
    return e.maxWidth && n > e.maxWidth && (n = e.maxWidth), { x: 0, y: 0, width: n, height: o };
  }
  measureRect(t) {
    const e = t.props;
    return { x: 0, y: 0, width: e.width, height: e.height };
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
class Ae {
  constructor(t, e, i) {
    C(this, "ctx");
    C(this, "layoutEngine");
    C(this, "theme");
    C(this, "layouts", []);
    this.ctx = t, this.layoutEngine = e, this.theme = i;
  }
  /**
   * Render element tree
   */
  render(t, e, i) {
    this.layouts = this.layoutEngine.layout(t, e, i), this.ctx.save(), this.renderElement(t, e, i), this.ctx.restore();
  }
  getLayouts() {
    return this.layouts;
  }
  renderElement(t, e, i) {
    switch (t.type) {
      case "CTGroup":
        this.renderGroup(t, e, i);
        break;
      case "CTRect":
        this.renderRect(t, e, i);
        break;
      case "CTCircle":
        this.renderCircle(t, e, i);
        break;
      case "CTText":
        this.renderText(t, e, i);
        break;
      case "CTImage":
        this.renderImage(t, e, i);
        break;
      case "CTLine":
        this.renderLine(t, e, i);
        break;
    }
  }
  renderGroup(t, e, i) {
    const s = t.props;
    if (s.backgroundColor) {
      const n = this.calculateGroupBounds(
        this.layoutEngine.layout(t, e, i),
        e,
        i,
        s
      );
      this.ctx.fillStyle = s.backgroundColor, s.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(
        e,
        i,
        n.width,
        n.height,
        s.borderRadius
      ), this.ctx.fill()) : this.ctx.fillRect(e, i, n.width, n.height), s.borderColor && s.borderWidth && (this.ctx.strokeStyle = s.borderColor, this.ctx.lineWidth = s.borderWidth, s.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(
        e,
        i,
        n.width,
        n.height,
        s.borderRadius
      ), this.ctx.stroke()) : this.ctx.strokeRect(e, i, n.width, n.height));
    }
    const o = t.children || [];
    if (s.position === "relative") {
      const n = [...o].sort((r, a) => {
        const l = r.props.zIndex ?? 0, h = a.props.zIndex ?? 0;
        return l - h;
      });
      for (const r of n) {
        const a = e + (r.props.x ?? 0), l = i + (r.props.y ?? 0);
        this.renderElement(r, a, l);
      }
    } else if (s.display === "flex") {
      const n = this.layoutEngine.layout(t, e, i);
      for (let r = 0; r < o.length; r++) {
        const a = n[r];
        a && this.renderElement(o[r], a.x, a.y);
      }
    }
  }
  renderRect(t, e, i) {
    const s = t.props;
    this.ctx.save(), s.opacity !== void 0 && (this.ctx.globalAlpha = s.opacity), s.backgroundColor && (this.ctx.fillStyle = s.backgroundColor, s.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(e, i, s.width, s.height, s.borderRadius), this.ctx.fill()) : this.ctx.fillRect(e, i, s.width, s.height)), s.borderColor && s.borderWidth && (this.ctx.strokeStyle = s.borderColor, this.ctx.lineWidth = s.borderWidth, s.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(e, i, s.width, s.height, s.borderRadius), this.ctx.stroke()) : this.ctx.strokeRect(e, i, s.width, s.height)), this.ctx.restore();
  }
  renderCircle(t, e, i) {
    const s = t.props, o = e + s.radius, n = i + s.radius, r = s.startAngle ?? 0, a = s.endAngle ?? Math.PI * 2;
    this.ctx.beginPath(), this.ctx.arc(o, n, s.radius, r, a, !1), s.backgroundColor && (this.ctx.fillStyle = s.backgroundColor, this.ctx.fill()), s.borderColor && s.borderWidth && (this.ctx.strokeStyle = s.borderColor, this.ctx.lineWidth = s.borderWidth, this.ctx.stroke());
  }
  renderText(t, e, i) {
    const s = t.props, o = s.fontSize ?? this.theme.font.size, n = s.fontFamily ?? this.theme.font.family, r = s.fontWeight ?? "normal", a = s.fontStyle ?? "normal", l = s.color ?? this.theme.colors.cellText, h = s.lineHeight ?? o;
    this.ctx.font = `${a} ${r} ${o}px ${n}`, this.ctx.fillStyle = l, this.ctx.textAlign = "left", this.ctx.textBaseline = "middle";
    const c = e, d = i + h / 2;
    s.maxWidth ? this.ctx.fillText(s.text, c, d, s.maxWidth) : this.ctx.fillText(s.text, c, d), this.ctx.textAlign = "left", this.ctx.textBaseline = "alphabetic";
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
  calculateGroupBounds(t, e, i, s) {
    if (s != null && s.width && (s != null && s.height))
      return { x: e, y: i, width: s.width, height: s.height };
    if (t.length === 0)
      return { x: e, y: i, width: 0, height: 0 };
    const o = Math.min(...t.map((l) => l.x)), n = Math.max(...t.map((l) => l.x + l.width)), r = Math.min(...t.map((l) => l.y)), a = Math.max(...t.map((l) => l.y + l.height));
    return { x: o, y: r, width: n - o, height: a - r };
  }
}
const _e = 32;
class Fe {
  constructor(t, e, i) {
    C(this, "canvas");
    C(this, "ctx");
    C(this, "theme");
    C(this, "layoutManager");
    C(this, "dpr");
    C(this, "offscreenCanvas");
    C(this, "offscreenCtx");
    C(this, "cellRendererRegistry");
    C(this, "dropdownRenderer");
    C(this, "filterDropdownRenderer");
    C(this, "imageOverlayRenderer");
    C(this, "overlayRenderer");
    C(this, "dirtyRegions", []);
    C(this, "watermarkConfig", null);
    C(this, "expandColumnKey", null);
    C(this, "currentSwitchAnimations");
    C(this, "currentButtonHoverStates");
    C(this, "hoveredPlaceholderColumnIndex", -1);
    C(this, "isDestroyed", !1);
    // 多选列分隔符
    C(this, "multipleSelectSeparator", ", ");
    // 图片加载队列（延迟加载 + 请求取消）
    C(this, "imageLoadQueue");
    /** 当前帧收集的可见图片 URL */
    C(this, "frameVisibleUrls", /* @__PURE__ */ new Set());
    // 文本宽度缓存（用于按钮等需要测量文本宽度的场景）
    C(this, "textWidthCache", /* @__PURE__ */ new Map());
    C(this, "textWidthCacheKey", "");
    // 性能监控
    C(this, "performanceEnabled", !1);
    C(this, "performanceStats", /* @__PURE__ */ new Map());
    C(this, "frameStartTime", 0);
    C(this, "frameCount", 0);
    C(this, "lastReportTime", 0);
    // 当前帧统计
    C(this, "currentFrameStats", /* @__PURE__ */ new Map());
    // 上一帧统计（用于报告）
    C(this, "lastFrameStats", /* @__PURE__ */ new Map());
    // 懒加载相关
    C(this, "currentVisibleRange", null);
    C(this, "currentRows", []);
    C(this, "currentScrollTop", 0);
    C(this, "rowHeight", 0);
    C(this, "currentHoveredCell", null);
    C(this, "currentHoveredImageIndex", -1);
    C(this, "currentHoveredButtonIndex", -1);
    C(this, "currentProgressDragState");
    C(this, "currentRowResizeState");
    // 渲染缓存相关
    C(this, "renderCache", null);
    C(this, "rowIdManager", new re());
    C(this, "columnIdManager", new ae());
    // 图片加载完成后的渲染触发回调
    C(this, "onImageLoaded", null);
    this.canvas = t, this.ctx = this.getContext(t), this.theme = e, this.layoutManager = i, this.dpr = mt(), this.offscreenCanvas = document.createElement("canvas"), this.offscreenCtx = this.getContext(this.offscreenCanvas), this.cellRendererRegistry = new Le(), this.dropdownRenderer = new ue(
      this.ctx,
      this.theme,
      (s) => this.measureTextWidth(s)
    ), this.filterDropdownRenderer = new fe(this.ctx, this.theme), this.imageOverlayRenderer = new pe(this.ctx, this.theme, {
      get: (s, o) => this.imageLoadQueue.get(s, o),
      isLoading: (s) => this.imageLoadQueue.isLoading(s),
      load: (s, o) => this.loadImage(s, o),
      collectVisible: (s) => this.collectVisibleImage(s)
    }), this.overlayRenderer = new xe(
      this.canvas,
      this.ctx,
      this.theme,
      this.layoutManager,
      this.dpr
    ), this.imageLoadQueue = new Bt();
  }
  // 当前字体配置的 key
  // 动态行高支持
  /**
   * 根据单元格高度计算可显示行数
   */
  calculateMaxRows(t, e, i = 8) {
    return Math.max(1, Math.floor((t - i * 2) / e));
  }
  /**
   * 多行文本换行
   */
  wrapTextToLines(t, e, i) {
    const s = [];
    let o = "";
    for (const n of t) {
      const r = o + n;
      if (this.ctx.measureText(r).width > e) {
        if (o && s.push(o), o = n, s.length >= i) break;
      } else
        o = r;
    }
    if (o && s.length < i && s.push(o), s.length === i && t.length > s.join("").length) {
      const n = s[s.length - 1], r = "...";
      let a = n;
      for (; a.length > 0 && this.ctx.measureText(a + r).width > e; )
        a = a.slice(0, -1);
      s[s.length - 1] = a + r;
    }
    return s;
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
  setMultipleSelectSeparator(t) {
    this.multipleSelectSeparator = t;
  }
  /**
   * 设置图片加载配置
   */
  setImageLoadConfig(t) {
    this.imageLoadQueue = new Bt({
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
    const i = mt();
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
    var b, v, I;
    this.currentSwitchAnimations = n.switchAnimations, this.currentButtonHoverStates = n.buttonHoverStates, this.currentHoveredCell = n.hoveredCell, this.currentHoveredImageIndex = n.hoveredImageIndex ?? -1, this.currentHoveredButtonIndex = n.hoveredButtonIndex ?? -1, this.currentProgressDragState = n.progressDragState, this.currentRowResizeState = n.rowResizeState, this.beginFrame(), this.currentVisibleRange = i, this.currentRows = e, this.currentScrollTop = o, this.rowHeight = this.theme.row.height;
    const { startRow: r, endRow: a } = i, l = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, l, h);
    const c = this.layoutManager.getLeafColumns(), d = this.layoutManager.getFixedColumnsInfo(t), u = d.leftFixed.columns.length > 0, f = d.rightFixed.columns.length > 0;
    this.hoveredPlaceholderColumnIndex = n.hoveredCell && ((b = c[n.hoveredCell.columnIndex]) != null && b.key.startsWith("__hidden_placeholder__")) ? n.hoveredCell.columnIndex : -1;
    const g = u ? d.leftFixed.width : 0, m = l - (f ? d.rightFixed.width : 0), p = this.layoutManager.getVisibleCenterColumnIndices(), x = [], w = [];
    for (let E = 0; E < c.length; E++) {
      const M = c[E];
      M && (M.fixed === "left" && x.push(E), M.fixed === "right" && w.push(E));
    }
    const y = this.shouldRenderRowBands();
    this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(g, 0, m - g, h), this.ctx.clip(), y ? this.renderRowBands(
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
    ), u && !y && this.renderFixedColumnsContent(
      c,
      e,
      x,
      0,
      o,
      i,
      n
    ), f && !y && this.renderFixedColumnsContent(
      c,
      e,
      w,
      l - d.rightFixed.width,
      o,
      i,
      n
    ), y && (u || f) && this.renderRowBands(
      e,
      [],
      x,
      w,
      s,
      o,
      i,
      d,
      n
    ), this.renderFixedSelections(
      n.selectedCells,
      o,
      x,
      w
    ), n.showHeader && (u && this.renderFixedColumnsHeader(
      c,
      x,
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
    return this.layoutManager.hasPinnedRows();
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
      let x = this.theme.colors.rowBackground;
      r.stripeRows && g % 2 === 1 && (x = this.theme.colors.rowAltBackground), f.selected && (x = this.theme.colors.rowSelectedBackground), ((d = r.hoveredCell) == null ? void 0 : d.rowIndex) === g && (x = this.theme.colors.rowHoverBackground);
      for (const w of i) {
        const y = this.layoutManager.getLeafColumn(w);
        if (!y) continue;
        const b = this.layoutManager.getColumnWidthByIndex(w), v = a !== void 0 ? a + this.layoutManager.getColumnOffset(w) - this.layoutManager.getColumnOffset(i[0]) : this.layoutManager.getColumnOffset(w) - s;
        this.ctx.fillStyle = x, this.ctx.fillRect(v, l, b, m), this.renderCellWithPosition(
          y,
          f,
          g,
          w,
          f.data[N(y)],
          v,
          l,
          b,
          m,
          r
        );
      }
      l += m;
    }
  }
  renderRowBands(t, e, i, s, o, n, r, a, l) {
    const h = this.layoutManager.getRowBandsForRender(), c = [h.pinnedTop, h.pinnedBottom];
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
    for (const d of c)
      this.renderRowBandCells(
        d,
        t,
        e,
        o,
        n,
        r,
        l
      );
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
      for (const d of c)
        this.renderRowBandCells(
          d,
          t,
          i,
          o,
          n,
          r,
          l,
          0
        );
    }
    if (s.length > 0) {
      const d = this.canvas.width / this.dpr;
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
        d - a.rightFixed.width
      ), this.ctx.restore();
      for (const u of c)
        this.renderRowBandCells(
          u,
          t,
          s,
          o,
          n,
          r,
          l,
          d - a.rightFixed.width
        );
    }
  }
  renderCenterHeader(t, e, i, s, o, n, r, a, l) {
    const c = this.layoutManager.getLayoutInfo().headerHeight, d = this.layoutManager.getVisibleHeaderCells();
    let u = 0, f = 0;
    for (const g of e) {
      if (!this.layoutManager.getLeafColumn(g)) continue;
      const p = this.layoutManager.getColumnOffset(g), x = this.layoutManager.getColumnWidthByIndex(g);
      f === 0 && (u = p - n), f += x;
    }
    this.ctx.save(), f > 0 && (this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(u, 0, f, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(u, c), this.ctx.lineTo(u + f, c), this.ctx.stroke());
    for (const g of d) {
      if (g.column.fixed === "left" || g.column.fixed === "right")
        continue;
      const p = this.layoutManager.getLeafColumns().findIndex((b) => b === g.column), x = e.indexOf(p);
      let w = g.x - n;
      if (x !== -1) {
        let b = 0;
        for (let I = 0; I < x; I++) {
          const E = e[I];
          E !== void 0 && (b += this.layoutManager.getColumnWidthByIndex(E));
        }
        w = this.layoutManager.getColumnOffset(e[0]) - n + b;
      }
      const y = g.column.key === r;
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
        y,
        !1,
        p
      );
    }
    this.endFrame(), this.ctx.restore();
  }
  renderHeaderCellMultiLevel(t, e, i, s, o, n, r, a, l, h = !1, c = !1, d = -1) {
    var O, P;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const L = this.hoveredPlaceholderColumnIndex === d;
      this.ctx.fillStyle = L ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, i, s, o);
      return;
    }
    const u = 8, g = t.reorderable !== !1 && h, m = g ? 10 : 0;
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, i, s, o), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const p = a.find((L) => L.column === t.key), x = (p == null ? void 0 : p.direction) ?? "none", w = t.sortable !== !1, y = !((O = t.children) != null && O.length) && w && (x !== "none" || h), b = y ? 20 : 0, v = l.some((L) => L.column === t.key), I = !((P = t.children) != null && P.length) && t.filterable && (v || h), E = I ? 20 : 0, M = s - u * 2 - b - E - m - (g ? 4 : 0), T = ct(t.title, Math.floor(M / 7)), S = t.align ?? "center";
    let H = e + u + m + (g ? 4 : 0);
    S === "center" ? (H = e + (s - this.ctx.measureText(T).width - b - E) / 2, g && (H = Math.max(H, e + u + m + 4))) : S === "right" && (H = e + s - u - this.ctx.measureText(T).width - b - E);
    const k = i + o / 2;
    if (this.ctx.fillText(T, H, k), g && this.renderDragHandle(e + u, i + o / 2), I) {
      const L = e + s - u - 10;
      y && this.renderSortIndicator(
        L - 16,
        k,
        x === "none" ? "hover" : x
      ), this.renderFilterIndicator(L, k, v);
    } else y && this.renderSortIndicator(
      e + s - u - 10,
      k,
      x === "none" ? "hover" : x
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
    var m, p;
    const h = this.layoutManager.getRowOffset(s), c = this.getRenderedRowHeight(s), d = h - r;
    let u = this.theme.colors.rowBackground;
    a.stripeRows && s % 2 === 1 && (u = this.theme.colors.rowAltBackground), i.selected && (u = this.theme.colors.rowSelectedBackground), ((m = a.hoveredCell) == null ? void 0 : m.rowIndex) === s && (u = this.theme.colors.rowHoverBackground);
    for (const x of o) {
      if (this.layoutManager.isCellMerged(s, x) || !t[x]) continue;
      const y = o.indexOf(x);
      let b;
      if (y !== -1) {
        let I = 0;
        for (let M = 0; M < y; M++) {
          const T = o[M];
          T !== void 0 && (I += this.layoutManager.getColumnWidthByIndex(T));
        }
        b = this.layoutManager.getColumnOffset(o[0]) - n + I;
      } else
        b = this.layoutManager.getColumnOffset(x) - n;
      const v = this.layoutManager.getColumnWidthByIndex(x);
      this.ctx.fillStyle = u, this.ctx.fillRect(b, d, v, c);
    }
    const g = this.layoutManager.getMergesAffectingRow(s);
    for (const x of g) {
      if (!o.includes(x.columnIndex)) continue;
      const w = `${x.rowIndex}-${x.columnIndex}`;
      if (l.has(w)) continue;
      const y = e[x.rowIndex];
      if (!y) continue;
      const b = this.layoutManager.getMergedCellPosition(x.rowIndex, x.columnIndex);
      if (!b) continue;
      const v = t[x.columnIndex];
      if (!v) continue;
      const I = y.data[N(v)], M = ((p = a.hoveredCell) == null ? void 0 : p.rowIndex) !== void 0 && a.hoveredCell.rowIndex >= x.rowIndex && a.hoveredCell.rowIndex < x.rowIndex + x.rowspan ? this.theme.colors.rowHoverBackground : u, T = b.x - n, S = b.y - r;
      this.ctx.fillStyle = M, this.ctx.fillRect(T, S, b.width, b.height), this.renderCellWithPosition(
        v,
        y,
        x.rowIndex,
        x.columnIndex,
        I,
        T,
        S,
        b.width,
        b.height,
        a
      ), l.add(w);
    }
    for (const x of o) {
      const w = t[x];
      if (!w || this.layoutManager.isCellMerged(s, x) || this.layoutManager.getCellMerge(s, x))
        continue;
      const b = i.data[N(w)], v = o.indexOf(x);
      let I;
      if (v !== -1) {
        let H = 0;
        for (let O = 0; O < v; O++) {
          const P = o[O];
          P !== void 0 && (H += this.layoutManager.getColumnWidthByIndex(P));
        }
        I = this.layoutManager.getColumnOffset(o[0]) - n + H;
      } else
        I = this.layoutManager.getColumnOffset(x) - n;
      const E = this.layoutManager.getColumnWidthByIndex(x), T = this.layoutManager.getRowOffset(s) - r, S = this.getRenderedRowHeight(s);
      this.renderCellWithPosition(
        w,
        i,
        s,
        x,
        b,
        I,
        T,
        E,
        S,
        a
      );
    }
  }
  renderFixedColumnsContent(t, e, i, s, o, n, r) {
    var g, m, p;
    const a = this.canvas.height / this.dpr;
    this.ctx.save();
    let l = 0;
    for (const x of i)
      l += this.layoutManager.getColumnWidthByIndex(x);
    const h = /* @__PURE__ */ new Set(), c = (g = this.currentRowResizeState) == null ? void 0 : g.rowIndex, d = Math.max(0, n.startRow), u = Math.min(e.length - 1, n.endRow);
    for (let x = d; x <= u; x++) {
      if (x === c)
        continue;
      const w = e[x];
      if (!w) continue;
      const y = this.layoutManager.getRowOffset(x), b = this.getRenderedRowHeight(x), v = y - o;
      if (y + b < o || y > o + a)
        continue;
      let I = this.theme.colors.rowBackground;
      r.stripeRows && x % 2 === 1 && (I = this.theme.colors.rowAltBackground), w.selected && (I = this.theme.colors.rowSelectedBackground), ((m = r.hoveredCell) == null ? void 0 : m.rowIndex) === x && (I = this.theme.colors.rowHoverBackground);
      for (const S of i) {
        if (this.layoutManager.isCellMerged(x, S))
          continue;
        const H = this.layoutManager.getColumnWidthByIndex(S), k = s + this.layoutManager.getColumnOffset(S) - this.layoutManager.getColumnOffset(i[0]);
        this.ctx.fillStyle = I, this.ctx.fillRect(k, v, H, b);
      }
      const M = this.layoutManager.getMergesAffectingRow(x);
      for (const S of M) {
        if (!i.includes(S.columnIndex)) continue;
        const H = `${S.rowIndex}-${S.columnIndex}`;
        if (h.has(H)) continue;
        const k = e[S.rowIndex];
        if (!k) continue;
        const O = this.layoutManager.getMergedCellPosition(
          S.rowIndex,
          S.columnIndex
        );
        if (!O) continue;
        const P = t[S.columnIndex];
        if (!P) continue;
        const L = k.data[N(P)];
        let W = 0;
        const B = s + this.layoutManager.getColumnOffset(S.columnIndex) - this.layoutManager.getColumnOffset(i[0]);
        for (let _ = 0; _ < S.colspan; _++) {
          const F = S.columnIndex + _;
          i.includes(F) && (W += this.layoutManager.getColumnWidthByIndex(F));
        }
        const V = ((p = r.hoveredCell) == null ? void 0 : p.rowIndex) !== void 0 && r.hoveredCell.rowIndex >= S.rowIndex && r.hoveredCell.rowIndex < S.rowIndex + S.rowspan ? this.theme.colors.rowHoverBackground : I, Y = O.y - o;
        this.ctx.fillStyle = V, this.ctx.fillRect(B, Y, W, O.height), this.renderCellWithPosition(
          P,
          k,
          S.rowIndex,
          S.columnIndex,
          L,
          B,
          Y,
          W,
          O.height,
          r
        ), h.add(H);
      }
      let T = s;
      for (const S of i) {
        const H = t[S];
        if (!H) {
          T += this.layoutManager.getColumnWidthByIndex(S);
          continue;
        }
        if (this.layoutManager.isCellMerged(x, S)) {
          T += this.layoutManager.getColumnWidthByIndex(S);
          continue;
        }
        if (this.layoutManager.getCellMerge(x, S)) {
          T += this.layoutManager.getColumnWidthByIndex(S);
          continue;
        }
        const O = this.layoutManager.getColumnWidthByIndex(S), P = w.data[N(H)];
        this.renderCellWithPosition(
          H,
          w,
          x,
          S,
          P,
          T,
          v,
          O,
          b,
          r
        ), T += O;
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
    var f;
    const a = this.layoutManager.getRowOffset(i), l = this.getRenderedRowHeight(i), h = a - n, c = this.canvas.height / this.dpr;
    if (a + l < n || a > n + c)
      return;
    let d = this.theme.colors.rowBackground;
    r.stripeRows && i % 2 === 1 && (d = this.theme.colors.rowAltBackground), e.selected && (d = this.theme.colors.rowSelectedBackground), ((f = r.hoveredCell) == null ? void 0 : f.rowIndex) === i && (d = this.theme.colors.rowHoverBackground);
    let u = o;
    for (const g of s) {
      const m = this.layoutManager.getColumnWidthByIndex(g), p = t[g];
      if (!p) {
        u += m;
        continue;
      }
      if (this.layoutManager.isCellMerged(i, g)) {
        u += m;
        continue;
      }
      const x = this.layoutManager.getCellMerge(i, g);
      if (x && (x.rowIndex !== i || x.columnIndex !== g)) {
        u += m;
        continue;
      }
      this.ctx.fillStyle = d, this.ctx.fillRect(u, h, m, l);
      const w = e.data[N(p)];
      this.renderCellWithPosition(
        p,
        e,
        i,
        g,
        w,
        u,
        h,
        m,
        l,
        r
      ), u += m;
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
    const r = this.layoutManager.getLayoutInfo(), a = r.headerHeight;
    this.ctx.save(), this.ctx.translate(0, s), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, r.totalWidth, a), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, a), this.ctx.lineTo(r.totalWidth, a), this.ctx.stroke();
    for (let l = e; l <= i; l++) {
      const h = t[l];
      if (!h) continue;
      const { x: c, width: d } = this.layoutManager.getCellPosition(0, l);
      this.renderHeaderCell(h, c, 0, d, a, l, o);
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
    const h = r.find((p) => p.column === t.key), c = (h == null ? void 0 : h.direction) ?? "none", d = c !== "none" ? 20 : 0, u = s - a * 2 - d - l - 0, f = ct(t.title, Math.floor(u / 7)), g = t.align ?? "left";
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
      const m = e.data[N(g)];
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
    var x, w, y, b;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const v = this.hoveredPlaceholderColumnIndex === s;
      this.ctx.fillStyle = v ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.rowBackground, this.ctx.fillRect(n, r, a, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(n + a, r), this.ctx.lineTo(n + a, r + l), this.ctx.stroke();
      return;
    }
    const d = this.resolveDisabled(t.disabled, e, t), u = this.getCacheMode(t);
    let f;
    if (this.renderCache && u !== !1) {
      const v = this.renderCache.get(e, t, o, u);
      v ? f = v : (f = this.executeRender(t, e, i, o), this.renderCache.set(e, t, o, f, u));
    } else
      f = this.executeRender(t, e, i, o);
    const g = this.isCellSelected(i, s, h.selectedCells), m = ((x = h.hoveredCell) == null ? void 0 : x.rowIndex) === i && ((w = h.hoveredCell) == null ? void 0 : w.columnIndex) === s, p = ((y = h.editingCell) == null ? void 0 : y.rowIndex) === i && ((b = h.editingCell) == null ? void 0 : b.columnIndex) === s;
    if (g && !e.selected ? (this.ctx.fillStyle = this.theme.colors.rowSelectedBackground, this.ctx.fillRect(n, r, a, l)) : m && !e.selected && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(n, r, a, l)), !p) {
      const v = this.expandColumnKey === t.key, I = e.children && e.children.length > 0, E = e.level ?? 0;
      if (v && I) {
        this.renderExpandIcon(n, r, a, l, e.expanded ?? !1, E);
        const M = 20, T = E * 16;
        this.renderCellContent(
          f,
          n + M + T,
          r,
          a - M - T,
          l,
          8,
          t.align,
          i,
          s,
          d
        );
      } else {
        const M = v ? E * 16 : 0;
        this.renderCellContent(
          f,
          n + M,
          r,
          a - M,
          l,
          8,
          t.align,
          i,
          s,
          d
        );
      }
    }
    if (this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(n, r, a, l), d) {
      const v = this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
      this.ctx.fillStyle = v, this.ctx.fillRect(n, r, a, l);
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
    if (t.render)
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
      const { text: g, type: m, style: p, checkbox: x, radio: w, button: y, input: b, tags: v, link: I } = t, E = (p == null ? void 0 : p.fontSize) ?? this.theme.font.size, M = (p == null ? void 0 : p.fontFamily) ?? this.theme.font.family, T = (p == null ? void 0 : p.fontWeight) ?? "normal", S = (p == null ? void 0 : p.fontStyle) ?? "normal";
      if (this.ctx.font = `${S} ${T} ${E}px ${M}`, m === "checkbox" && x) {
        this.measureRender("checkbox", () => {
          this.renderWithCellRenderer("checkbox", x, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "radio" && w) {
        this.measureRender("radio", () => {
          this.renderWithCellRenderer("radio", w, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "button" && y) {
        let H;
        if (a !== void 0 && l !== void 0 && this.currentButtonHoverStates) {
          const k = `${a}-${l}`, O = this.currentButtonHoverStates.get(k);
          O && (H = O);
        }
        this.measureRender("button", () => {
          this.renderWithCellRenderer("button", y, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            buttonHoverState: H
          });
        });
        return;
      }
      if (m === "buttons" && t.buttons) {
        let H = -1;
        a !== void 0 && l !== void 0 && ((c = this.currentHoveredCell) == null ? void 0 : c.rowIndex) === a && ((d = this.currentHoveredCell) == null ? void 0 : d.columnIndex) === l && (H = this.currentHoveredButtonIndex), this.measureRender("buttons", () => {
          this.renderWithCellRenderer("buttons", t.buttons, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            hoveredButtonIndex: H
          });
        });
        return;
      }
      if (m === "switch" && t.switch) {
        let H;
        if (a !== void 0 && l !== void 0 && this.currentSwitchAnimations) {
          const k = `${a}-${l}`, O = this.currentSwitchAnimations.get(k);
          O && (H = O);
        }
        this.measureRender("switch", () => {
          this.renderWithCellRenderer("switch", t.switch, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            switchAnimation: H
          });
        });
        return;
      }
      if (m === "input" && b) {
        this.measureRender("input", () => {
          this.renderWithCellRenderer("input", b, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "select" && t.select) {
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
      if (m === "date" && t.date) {
        this.measureRender("date", () => {
          this.renderWithCellRenderer("date", t.date, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "tag" && v) {
        this.measureRender("tags", () => {
          this.renderWithCellRenderer("tag", v, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "image" && t.image) {
        const H = a !== void 0 && l !== void 0 && ((u = this.currentHoveredCell) == null ? void 0 : u.rowIndex) === a && ((f = this.currentHoveredCell) == null ? void 0 : f.columnIndex) === l;
        this.measureRender(
          "image",
          () => this.renderImage(e, i, s, o, t.image, a, H)
        );
        return;
      }
      if (m === "progress" && t.progress) {
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
      if (m === "rating" && t.rating) {
        let H;
        this.measureRender("rating", () => {
          var k;
          H = (k = this.renderWithCellRenderer(
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
        }), H && (t.starBounds = H);
        return;
      }
      if (m === "color" && t.color) {
        this.measureRender("color", () => {
          this.renderWithCellRenderer("color", t.color, e, i, s, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "custom" && t.jsxRender) {
        this.measureRender("jsx", () => {
          const H = t.jsxRender(), k = new Be(this.ctx), O = new We(k), P = new Ae(this.ctx, O, this.theme), L = O.layout(H, 0, 0);
          let W = 0;
          for (const _ of L) {
            const F = _.y + _.height;
            F > W && (W = F);
          }
          const B = o - n * 2;
          let A, V, Y;
          W <= B ? (A = (B - W) / 2, V = e + n, Y = i + n + A) : (A = (o - W) / 2, V = e + n, Y = i + A), P.render(H, V, Y);
        });
        return;
      }
      if (m === "custom" && t.customRender) {
        this.measureRender("custom", () => {
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
        });
        return;
      }
      this.measureRender("text", () => {
        let H = g, k = (p == null ? void 0 : p.color) ?? this.theme.colors.cellText;
        if (m === "link" && I && (H = I.text || I.link, k = (p == null ? void 0 : p.color) ?? this.theme.colors.linkColor), !H) return;
        this.ctx.fillStyle = k;
        const O = (p == null ? void 0 : p.horizontalAlign) ?? r ?? "left", P = (p == null ? void 0 : p.verticalAlign) ?? "middle", L = this.theme.font.size, W = L * 1.5, B = s - n * 2, A = this.calculateMaxRows(o, W, n);
        if (A > 1) {
          const V = this.wrapTextToLines(H, B, A), Y = V.length * W;
          let _;
          P === "top" ? _ = i + n : P === "bottom" ? _ = i + o - n - Y : _ = i + (o - Y) / 2, this.ctx.textBaseline = "top";
          for (let F = 0; F < V.length; F++) {
            const U = V[F];
            let G;
            switch (O) {
              case "center":
                G = e + (s - this.ctx.measureText(U).width) / 2;
                break;
              case "right":
                G = e + s - n - this.ctx.measureText(U).width;
                break;
              default:
                G = e + n;
            }
            this.ctx.fillText(U, G, _ + F * W);
          }
        } else {
          const V = "...";
          if (this.ctx.measureText(H).width > B) {
            let U = H;
            for (; U.length > 0 && this.ctx.measureText(U + V).width > B; )
              U = U.slice(0, -1);
            H = U + V;
          }
          let _;
          switch (O) {
            case "center":
              _ = e + (s - this.ctx.measureText(H).width) / 2;
              break;
            case "right":
              _ = e + s - n - this.ctx.measureText(H).width;
              break;
            default:
              _ = e + n;
          }
          let F;
          switch (P) {
            case "top":
              this.ctx.textBaseline = "top", F = i + n;
              break;
            case "bottom":
              this.ctx.textBaseline = "bottom", F = i + o - n;
              break;
            default:
              this.ctx.textBaseline = "middle", F = i + o / 2;
          }
          if (m === "tag")
            this.renderTag(H, _, F, L);
          else if (this.ctx.fillText(H, _, F), m === "link") {
            const U = this.ctx.measureText(H).width;
            this.ctx.strokeStyle = k, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(_, F + L / 2 + 2), this.ctx.lineTo(_ + U, F + L / 2 + 2), this.ctx.stroke();
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
      const p = o.lazy !== !1, x = o.lazyThreshold ?? 200;
      if (p && n !== void 0 && this.currentVisibleRange && !this.isInLazyLoadRange(n, x)) {
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
    const o = s.scaleWithRowHeight === !1 ? Math.min(e, _e) : e;
    return Math.max(0, Math.min(t, o) - i * 2);
  }
  renderMultipleImages(t, e, i, s, o, n, r) {
    const a = o.images, l = 4, h = this.getMaxImageSize(i, s, l, o), c = o.width ?? 32, d = o.height ?? 32, u = Math.min(c, h), f = Math.min(d, h), g = o.gap ?? 4, m = o.circle ? Math.min(u, f) / 2 : o.borderRadius ?? 0, p = o.showMoreCount !== !1, x = i - l * 2, w = s - l * 2, y = Math.max(1, Math.floor((x + g) / (u + g))), b = Math.max(1, Math.floor((w + g) / (f + g))), v = y * b, I = o.maxVisible ?? v, M = p && a.length > I ? Math.max(1, v - 1) : v, T = Math.max(1, Math.min(I, M)), S = o.lazy !== !1, H = o.lazyThreshold ?? 200;
    let k = !0;
    S && n !== void 0 && this.currentVisibleRange && (k = this.isInLazyLoadRange(n, H));
    const O = a.length > T, P = O ? T : a.length, L = a.slice(0, P), W = O ? a.length - T : 0, B = P + (O && p ? 1 : 0), A = Math.max(1, Math.ceil(B / y)), V = Math.min(B, y), Y = V * u + Math.max(0, V - 1) * g, _ = A * f + Math.max(0, A - 1) * g;
    let F = t + (i - Y) / 2;
    F = Math.max(t + l, F);
    const U = e + (s - _) / 2;
    for (let G = 0; G < L.length; G++) {
      const $ = L[G], Q = Math.floor(G / y), tt = G % y, X = F + tt * (u + g), K = U + Q * (f + g), lt = r && o.hoverable !== !1 && this.currentHoveredImageIndex === G;
      if (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.beginPath(), m > 0 ? this.ctx.roundRect(X, K, u, f, m) : this.ctx.rect(X, K, u, f), this.ctx.fill(), !k) {
        this.renderImagePlaceholder(
          X,
          K,
          u,
          f,
          m,
          o.placeholder
        ), lt && this.renderImageHover(X, K, u, f, m);
        continue;
      }
      if (this.imageLoadQueue.isFailed($)) {
        this.renderImageError(X, K, u, f, m, o.errorImage), lt && this.renderImageHover(X, K, u, f, m);
        continue;
      }
      const rt = this.imageLoadQueue.get($, Math.max(u, f));
      rt ? (this.ctx.save(), this.ctx.beginPath(), m > 0 ? this.ctx.roundRect(X, K, u, f, m) : this.ctx.rect(X, K, u, f), this.ctx.clip(), this.drawImageWithFit(rt, X, K, u, f, o.fit ?? "cover"), this.ctx.restore(), this.collectVisibleImage($)) : this.imageLoadQueue.isLoading($) ? (this.collectVisibleImage($), this.renderImagePlaceholder(
        X,
        K,
        u,
        f,
        m,
        o.placeholder
      )) : (this.collectVisibleImage($), this.loadImage($, Math.max(u, f)), this.renderImagePlaceholder(
        X,
        K,
        u,
        f,
        m,
        o.placeholder
      )), lt && this.renderImageHover(X, K, u, f, m);
    }
    if (O && p) {
      const G = Math.floor(P / y), $ = P % y, Q = F + $ * (u + g), tt = U + G * (f + g), X = r && o.hoverable !== !1 && this.currentHoveredImageIndex === P;
      this.renderMoreCount(
        Q,
        tt,
        u,
        f,
        m,
        W,
        X
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
      const x = o[m], w = o[p];
      if (!x || !w || x.fixed || w.fixed) continue;
      const y = this.layoutManager.getRowViewportY(d, i);
      if (y === null) continue;
      const b = this.layoutManager.getRowOffset(u) + this.layoutManager.getRowHeightByIndex(u) - this.layoutManager.getRowOffset(d), v = this.layoutManager.getCellPosition(d, m), I = this.layoutManager.getCellPosition(u, p), E = I.x + I.width - v.x, M = v.x - e;
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]), this.ctx.strokeRect(M, y, E, b);
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
        const w = p[0], y = p[p.length - 1], b = this.layoutManager.getCellPosition(c, w), v = this.layoutManager.getCellPosition(d, y), I = v.x + v.width - b.x;
        this.ctx.strokeRect(b.x, g, I, m);
      }
      const x = s.filter(
        (w) => w >= u && w <= f
      );
      if (x.length > 0) {
        const w = x[0], y = x[x.length - 1], b = this.layoutManager.getCellPosition(c, w), v = this.layoutManager.getCellPosition(d, y), I = v.x + v.width - b.x;
        this.ctx.strokeRect(b.x, g, I, m);
      }
    }
  }
  renderLoadingOverlay() {
    const t = this.canvas.width / this.dpr, e = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)", this.ctx.fillRect(0, 0, t, e), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText("Loading...", t / 2, e / 2), this.ctx.restore();
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
        const x = p.x - o;
        this.renderEmptyStateHeaderCell(
          p,
          x,
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
          const w = n - g - (this.layoutManager.getLayoutInfo().totalWidth - g), y = p.x + w;
          this.renderEmptyStateHeaderCell(
            p,
            y,
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
    const n = i.find((b) => b.column === t.column.key), r = (n == null ? void 0 : n.direction) ?? "none", a = t.column.sortable !== !1, l = t.column.key === o, h = t.isLeaf && a && (r !== "none" || l), c = h ? 20 : 0, d = s.some((b) => b.column === t.column.key), u = t.isLeaf && t.column.filterable, f = u ? 20 : 0, g = 8, m = t.width - g * 2 - c - f, p = ct(t.column.title, Math.floor(m / 7)), x = t.column.align ?? "center";
    let w = e + g;
    x === "center" ? w = e + (t.width - this.ctx.measureText(p).width - c - f) / 2 : x === "right" && (w = e + t.width - g - this.ctx.measureText(p).width - c - f);
    const y = t.y + t.height / 2;
    if (this.ctx.fillText(p, w, y), t.isLeaf)
      if (u) {
        const b = e + t.width - g - 10;
        h && this.renderSortIndicator(
          b - 16,
          y,
          r === "none" ? "hover" : r
        ), this.renderFilterIndicator(b, y, d);
      } else h && this.renderSortIndicator(
        e + t.width - g - 10,
        y,
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
      const g = c.data[N(t)];
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
    const c = et(t.disabled, e, t);
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
const R = {
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
}, dt = class dt {
  constructor(t, e, i) {
    C(this, "layoutManager");
    C(this, "scrollState");
    C(this, "canvas");
    this.layoutManager = t, this.scrollState = e, this.canvas = i;
  }
  /**
   * Get logical canvas dimensions (CSS pixels, accounting for devicePixelRatio)
   */
  getLogicalCanvasSize() {
    const t = mt();
    return {
      width: this.canvas.width / t,
      height: this.canvas.height / t
    };
  }
  /**
   * Calculate initial dropdown position
   */
  calculate(t) {
    const { width: e, height: i, gap: s = dt.DEFAULT_GAP } = t, { width: o, height: n } = this.getLogicalCanvasSize(), r = this.calculateX(t, e, o), { anchorY: a, cellViewportY: l } = this.calculateAnchorY(t), { y: h, showAbove: c } = this.calculateInitialY(a, i, s, n);
    return { x: r, y: h, showAbove: c, anchorViewportY: a, cellViewportY: l };
  }
  /**
   * Update Y position during scroll (preserves or toggles showAbove)
   */
  updateY(t, e, i, s = dt.DEFAULT_GAP) {
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
    const o = dt.EDGE_PADDING, n = t.column ?? this.getColumn(t), r = (n == null ? void 0 : n.width) ?? 100, l = s + r > o && s < i - o;
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
C(dt, "DEFAULT_GAP", 4), C(dt, "EDGE_PADDING", 8);
let Rt = dt;
class at {
  constructor(t, e) {
    C(this, "context");
    C(this, "eventEmitter");
    C(this, "dropdownCalculator");
    this.context = t, this.eventEmitter = e, this.dropdownCalculator = new Rt(
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
  get rows() {
    return this.dataManager.getRows();
  }
  get allRows() {
    return this.dataManager.getAllRows();
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
class Ne extends at {
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
    ], this.eventEmitter.emit(R.SELECTION_CHANGE, [...this.state.selectedCells]);
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
    ], this.eventEmitter.emit(R.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Handle toggle selection (ctrl/cmd+click)
   */
  handleToggleSelection(t) {
    const e = this.state.selectedCells.findIndex((i) => {
      const { minRow: s, maxRow: o, minCol: n, maxCol: r } = this.getNormalizedRange(i);
      return t.rowIndex >= s && t.rowIndex <= o && t.columnIndex >= n && t.columnIndex <= r;
    });
    e >= 0 ? this.state.selectedCells.splice(e, 1) : this.state.selectedCells.push({ start: t, end: t }), this.eventEmitter.emit(R.SELECTION_CHANGE, [...this.state.selectedCells]);
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
    ], this.eventEmitter.emit(R.SELECTION_CHANGE, [...this.state.selectedCells]));
  }
  /**
   * Clear selection
   */
  clearSelection() {
    this.state.selectedCells = [], this.eventEmitter.emit(R.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  /**
   * Move selection by delta
   */
  moveSelection(t, e) {
    if (this.state.selectedCells.length === 0) return;
    const i = this.layoutManager.getLeafColumns(), s = this.state.selectedCells[0].start, o = Z(s.rowIndex + t, 0, this.rows.length - 1), n = Z(s.columnIndex + e, 0, i.length - 1), r = { rowIndex: o, columnIndex: n };
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
    (e !== this.scrollState.scrollTop || i !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = e, this.eventEmitter.emit(R.SCROLL, i, e));
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
class ze extends at {
  constructor(e, i, s, o) {
    super(e, i);
    C(this, "selectionHandler");
    C(this, "editingConfig");
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
        const a = nt(n, r, i.rowIndex), l = ["checkbox", "radio", "button", "switch"];
        return a.type && l.includes(a.type) ? a.type === "switch" && a.switch ? (et(n.disabled, r, n) || (r.data[N(n)] = !a.switch.checked, this.eventEmitter.emit(
          R.SWITCH_CHANGE,
          this.getCellInfo(i),
          !a.switch.checked
        )), null) : (this.toggleRowExpand(i.rowIndex), null) : n.editable === !1 || et(n.disabled, r, n) || (s = a.input) != null && s.readonly ? null : this.getEditingStartConfig(i, n, r, a);
      }
    } else
      this.toggleRowExpand(i.rowIndex);
    return null;
  }
  /**
   * Get editing start configuration for a cell
   */
  getEditingStartConfig(e, i, s, o) {
    const n = s.data[N(i)];
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
    return o.type === "select" && o.select ? { type: "select", config: o.select } : o.type === "tag" && o.tags && o.tags.editable ? { type: "tags", config: o.tags } : o.type === "date" && o.date ? { type: "date", config: o.date } : o.type === "image" && o.image ? { type: "image", config: o.image } : { type: "input", config: o.input };
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
    (i !== this.scrollState.scrollTop || s !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = s, this.scrollState.scrollTop = i, this.eventEmitter.emit(R.SCROLL, s, i));
  }
  /**
   * Toggle row expand state
   */
  toggleRowExpand(e) {
    const i = this.rows[e];
    i && i.children && i.children.length > 0 && this.eventEmitter.emit(R.EXPAND, i, e, !i.expanded);
  }
  /**
   * Update editing config
   */
  updateEditingConfig(e) {
    this.editingConfig = e;
  }
}
const ht = class ht extends at {
  constructor(e, i, s) {
    super(e, i);
    C(this, "editingConfig");
    this.editingConfig = s;
  }
  /**
   * Validate if a cell can be edited
   */
  validateCellForEditing(e) {
    const s = this.layoutManager.getLeafColumns()[e.columnIndex];
    if (!s || s.editable === !1) return null;
    const o = this.rows[e.rowIndex];
    return !o || et(s.disabled, o, s) ? null : { column: s, row: o };
  }
  /**
   * Get edit configuration for a cell
   * Priority: editRender > render result > null (default logic)
   */
  getEditConfig(e, i, s) {
    const o = i.data[N(e)];
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
        if (n && n.type && n.type !== "custom" && n.type !== "button" && n.type !== "buttons" && n.type !== "image" && n.type !== "progress" && n.type !== "link")
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
    return this.validateCellForEditing(e) ? (this.state.tooltip = null, this.state.editingCell = e, this.eventEmitter.emit(R.EDIT_START, this.getCellInfo(e), i), !0) : !1;
  }
  /**
   * Start select dropdown editing
   */
  startSelectEditing(e, i) {
    var d;
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = ht.DROPDOWN_ITEM_HEIGHT, n = ht.DROPDOWN_MAX_VISIBLE, r = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * o, h = s.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
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
    }, this.eventEmitter.emit(R.DROPDOWN_OPEN), !0;
  }
  /**
   * Start tags editing
   */
  startTagsEditing(e, i) {
    var d;
    const s = this.validateCellForEditing(e);
    if (!s || !i) return !1;
    this.state.tooltip = null;
    const o = ht.DROPDOWN_ITEM_HEIGHT, n = ht.DROPDOWN_MAX_VISIBLE, r = ((d = i.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * o, h = s.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
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
    }, this.eventEmitter.emit(R.DROPDOWN_OPEN), !0;
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
    }, this.eventEmitter.emit(R.DATE_DROPDOWN_OPEN), !0;
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
    }, this.eventEmitter.emit(R.IMAGE_EDITOR_OPEN), !0;
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
    }, this.eventEmitter.emit(R.COLOR_DROPDOWN_OPEN), !0;
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
      R.EDIT_END,
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
C(ht, "DROPDOWN_ITEM_HEIGHT", 32), C(ht, "DROPDOWN_MAX_VISIBLE", 8);
let It = ht;
const J = class J extends at {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle dropdown click
   */
  handleDropdownClick(t) {
    var m, p;
    if (!this.state.dropdown) return !1;
    const { x: e, y: i, width: s, scrollTop: o, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = J.DROPDOWN_ITEM_HEIGHT, u = J.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const w = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + s && c >= i && c <= i + w) {
        const y = c - i + o, b = Math.floor(y / d);
        if (b >= 0 && b < (((p = r.options) == null ? void 0 : p.length) ?? 0) && r.options) {
          const v = r.options[b];
          if (!v.disabled)
            if (r.multiple !== !1) {
              const E = [...r.selectedValues ?? []], M = v.value ?? v.text, T = E.indexOf(M);
              T >= 0 ? E.splice(T, 1) : E.push(M);
              const S = this.state.dropdown.cell, k = this.layoutManager.getLeafColumns()[S.columnIndex], O = this.rows[S.rowIndex];
              k && O && (O.data[N(k)] = E), this.eventEmitter.emit(
                R.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                E,
                !0
              ), this.state.dropdown.tagsConfig = {
                ...r,
                selectedValues: E
              }, this.eventEmitter.emit(R.DROPDOWN_HOVER);
            } else {
              const E = v.value ?? v.text, M = this.state.dropdown.cell, S = this.layoutManager.getLeafColumns()[M.columnIndex], H = this.rows[M.rowIndex];
              S && H && (H.data[N(S)] = E), this.eventEmitter.emit(
                R.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                [E],
                !1
              ), this.state.dropdown = null, this.eventEmitter.emit(R.DROPDOWN_CLOSE);
            }
        }
        return !0;
      }
      return !1;
    }
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + s && c >= i && c <= i + g) {
      const x = c - i + o, w = Math.floor(x / d);
      if (w >= 0 && w < a.options.length) {
        const y = a.options[w];
        if (!y.disabled)
          if (a.multiple) {
            const b = Array.isArray(a.value) ? [...a.value] : [], v = y.value, I = b.indexOf(v);
            I >= 0 ? b.splice(I, 1) : b.push(v);
            const E = this.state.dropdown.cell, T = this.layoutManager.getLeafColumns()[E.columnIndex], S = this.rows[E.rowIndex];
            T && S && (S.data[N(T)] = b), this.eventEmitter.emit(
              R.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              b
            ), this.state.dropdown.config = {
              ...a,
              value: b
            }, this.eventEmitter.emit(R.DROPDOWN_HOVER);
          } else {
            const b = this.state.dropdown.cell, I = this.layoutManager.getLeafColumns()[b.columnIndex], E = this.rows[b.rowIndex];
            I && E && (E.data[N(I)] = y.value), this.eventEmitter.emit(
              R.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              y.value
            ), this.state.dropdown = null, this.eventEmitter.emit(R.DROPDOWN_CLOSE);
          }
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
    const { x: e, y: i, width: s, scrollTop: o, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = J.DROPDOWN_ITEM_HEIGHT, u = J.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const w = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + s && c >= i && c <= i + w) {
        const y = c - i + o, b = Math.floor(y / d);
        b >= 0 && b < (((p = r.options) == null ? void 0 : p.length) ?? 0) && (this.state.dropdown.hoveredIndex = b, this.eventEmitter.emit(R.DROPDOWN_HOVER));
      } else
        this.state.dropdown.hoveredIndex = -1;
      return;
    }
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + s && c >= i && c <= i + g) {
      const x = c - i + o, w = Math.floor(x / d);
      w >= 0 && w < a.options.length && (this.state.dropdown.hoveredIndex = w, this.eventEmitter.emit(R.DROPDOWN_HOVER));
    } else
      this.state.dropdown.hoveredIndex = -1;
  }
  /**
   * Handle buttons dropdown click
   */
  handleButtonsDropdownClick(t) {
    if (!this.state.buttonsDropdown) return !1;
    const { x: e, y: i, buttons: s, cell: o } = this.state.buttonsDropdown, n = this.getViewportCoords(t), r = n.x, a = n.y, l = J.DROPDOWN_ITEM_HEIGHT, h = s.length * l;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let c = 100;
    for (const d of s) {
      const u = d.text ?? "Button", f = this.ctx.measureText(u).width;
      c = Math.max(c, f + 24);
    }
    if (r >= e && r <= e + c && a >= i && a <= i + h) {
      const d = a - i, u = Math.floor(d / l);
      if (u >= 0 && u < s.length) {
        const f = s[u];
        return this.state.buttonsDropdown = null, this.eventEmitter.emit(R.BUTTONS_DROPDOWN_CLOSE), this.eventEmitter.emit(R.BUTTON_CLICK, this.getCellInfo(o), f.actionKey), !0;
      }
    }
    return this.state.buttonsDropdown = null, this.eventEmitter.emit(R.BUTTONS_DROPDOWN_CLOSE), !0;
  }
  /**
   * Handle buttons dropdown hover
   */
  handleButtonsDropdownHover(t) {
    if (!this.state.buttonsDropdown) return;
    const { x: e, y: i, buttons: s } = this.state.buttonsDropdown, o = this.getViewportCoords(t), n = o.x, r = o.y, a = J.DROPDOWN_ITEM_HEIGHT, l = s.length * a;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let h = 100;
    for (const c of s) {
      const d = c.text ?? "Button", u = this.ctx.measureText(d).width;
      h = Math.max(h, u + 24);
    }
    if (n >= e && n <= e + h && r >= i && r <= i + l) {
      const c = r - i, d = Math.floor(c / a);
      d >= 0 && d < s.length && (this.state.buttonsDropdown.hoveredIndex = d, this.eventEmitter.emit(R.DROPDOWN_HOVER));
    } else
      this.state.buttonsDropdown.hoveredIndex = -1;
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
        const y = (s - l * 3) / 2, b = e + l, v = e + l + y + 8, I = i + l;
        let T = (this.state.filterDropdown.activeDateField === "startDate" ? b : v) + y / 2 - 240 / 2;
        T < e && (T = e), T + 240 > e + s && (T = e + s - 240);
        const S = I + 32 + 8;
        p = r >= T && r <= T + 240 && a >= S && a <= S + 252;
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
        const n = J.DROPDOWN_ITEM_HEIGHT, r = J.DROPDOWN_MAX_VISIBLE, a = 32, l = 4, c = Math.min((e == null ? void 0 : e.length) ?? 0, r) * n;
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
    const l = J.DROPDOWN_ITEM_HEIGHT, h = J.DROPDOWN_MAX_VISIBLE, c = Math.min(r.length, h), d = 36, u = 32, f = c * l, g = 8, m = 4;
    if (r.length > h) {
      const y = r.length * l, b = Math.max(20, f / y * f), v = f - b, I = a / (y - f) * v, E = s + n - 6 - 2, M = o + g + u + m;
      if (e >= E && e <= E + 6 && i >= M + I && i <= M + I + b) {
        this.state.filterDropdown.isScrollbarDragging = !0, this.state.filterDropdown.scrollbarDragStartY = t.clientY, this.state.filterDropdown.scrollbarDragStartScrollTop = a;
        return;
      }
    }
    const p = o + g + u + m + f + m;
    if (i >= p && i <= p + d) {
      this.ctx.font = "14px sans-serif";
      const y = "重置", b = "确定", v = this.ctx.measureText(y).width, I = this.ctx.measureText(b).width, E = s + g, M = s + n - g - I;
      if (e >= E && e <= E + v + 10) {
        this.state.filterDropdown.options && this.state.filterDropdown.options.forEach((T) => T.checked = !1), this.eventEmitter.emit(R.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= M - 10 && e <= M + I) {
        this.eventEmitter.emit(R.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
    const x = o + g + u + m;
    if (i >= x && i <= x + f) {
      const w = i - x + a, y = Math.floor(w / l);
      y >= 0 && y < r.length && (r[y].checked = !r[y].checked, this.eventEmitter.emit(R.FILTER_DROPDOWN_CHANGE));
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
      const u = "重置", f = "确定", g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, p = s + r, x = s + n - r - m;
      if (e >= p && e <= p + g + 10) {
        this.state.filterDropdown.searchValue = "", this.eventEmitter.emit(R.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= x - 10 && e <= x + m) {
        this.eventEmitter.emit(R.FILTER_DROPDOWN_CONFIRM);
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
      const u = "重置", f = "确定", g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, p = s + r, x = s + n - r - m;
      if (e >= p && e <= p + g + 10) {
        this.state.filterDropdown.minValue = "", this.state.filterDropdown.maxValue = "", this.eventEmitter.emit(R.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= x - 10 && e <= x + m) {
        this.eventEmitter.emit(R.FILTER_DROPDOWN_CONFIRM);
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
      f >= 0 && f < 3 && (this.state.filterDropdown.boolValue = g[f], this.eventEmitter.emit(R.FILTER_DROPDOWN_CHANGE));
      return;
    }
    const u = o + r + d + a;
    if (i >= u && i <= u + h) {
      this.ctx.font = "14px sans-serif";
      const g = "重置", m = "确定", p = this.ctx.measureText(g).width, x = this.ctx.measureText(m).width, w = s + r, y = s + n - r - x;
      if (e >= w && e <= w + p + 10) {
        this.state.filterDropdown.boolValue = "all", this.eventEmitter.emit(R.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= y - 10 && e <= y + x) {
        this.eventEmitter.emit(R.FILTER_DROPDOWN_CONFIRM);
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
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (e >= p && e <= p + g && i >= f && i <= f + h) {
      this.state.filterDropdown.activeDateField = "endDate";
      const w = a || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
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
    const x = o + l + h + d;
    if (i >= x && i <= x + u) {
      this.ctx.font = "14px sans-serif";
      const y = "重置", b = "确定", v = this.ctx.measureText(y).width, I = this.ctx.measureText(b).width, E = s + l, M = s + n - l - I;
      if (e >= E && e <= E + v + 10) {
        this.state.filterDropdown.startDate = null, this.state.filterDropdown.endDate = null, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= M - 10 && e <= M + I) {
        this.eventEmitter.emit(R.FILTER_DROPDOWN_CONFIRM);
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
    const d = 40, u = 28, f = 28, g = 8, p = d + u + 6 * f + g * 2, x = 240, w = (o - n * 3) / 2, y = i + n, b = i + n + w + a, v = s + n;
    let M = (l === "startDate" ? y : b) + w / 2 - x / 2;
    M < i && (M = i), M + x > i + o && (M = i + o - x);
    const T = v + r + a;
    if (t < M || t > M + x || e < T || e > T + p)
      return !1;
    if (e >= T && e <= T + d) {
      const W = M + 20, B = M + x - 20;
      if (t >= W - 6 - 5 && t <= W + 6 + 5)
        return c === 0 ? (this.state.filterDropdown.currentYear = h - 1, this.state.filterDropdown.currentMonth = 11) : this.state.filterDropdown.currentMonth = c - 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN), !0;
      if (t >= B - 6 - 5 && t <= B + 6 + 5)
        return c === 11 ? (this.state.filterDropdown.currentYear = h + 1, this.state.filterDropdown.currentMonth = 0) : this.state.filterDropdown.currentMonth = c + 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN), !0;
    }
    const S = (x - g * 2) / 7, k = new Date(h, c, 1).getDay(), O = new Date(h, c + 1, 0).getDate(), P = T + d + u;
    for (let L = 1; L <= O; L++) {
      const W = k + L - 1, B = Math.floor(W / 7), A = W % 7, V = M + g + A * S, Y = P + B * f;
      if (t >= V && t <= V + S && e >= Y && e <= Y + f) {
        const _ = new Date(h, c, L);
        return l === "startDate" ? this.state.filterDropdown.startDate = _ : this.state.filterDropdown.endDate = _, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_CHANGE), !0;
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
    const l = this.getViewportCoords(t), h = l.x, c = l.y, d = 8, u = 32, f = 8, g = 40, m = 28, p = 28, x = 8, y = g + m + 6 * p + x * 2, b = 240, v = (s - d * 3) / 2, I = e + d, E = e + d + v + f, M = i + d;
    let H = (o === "startDate" ? I : E) + v / 2 - b / 2;
    H < e && (H = e), H + b > e + s && (H = e + s - b);
    const k = M + u + f;
    if (h < H || h > H + b || c < k || c > k + y) {
      this.state.filterDropdown.hoveredDate !== null && (this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN));
      return;
    }
    const O = (b - x * 2) / 7, L = new Date(n, r, 1).getDay(), W = new Date(n, r + 1, 0).getDate(), B = k + g + m;
    let A = null;
    for (let _ = 1; _ <= W; _++) {
      const F = L + _ - 1, U = Math.floor(F / 7), G = F % 7, $ = H + x + G * O, Q = B + U * p;
      if (h >= $ && h <= $ + O && c >= Q && c <= Q + p) {
        A = new Date(n, r, _);
        break;
      }
    }
    const V = a ? a.getTime() : null, Y = A ? A.getTime() : null;
    V !== Y && (this.state.filterDropdown.hoveredDate = A, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN));
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
    const a = this.getViewportCoords(t), l = a.x, h = a.y, c = J.DROPDOWN_ITEM_HEIGHT, d = J.DROPDOWN_MAX_VISIBLE, u = Math.min(n.length, d), f = 36, g = u * c;
    if (n.length > d) {
      const x = n.length * c, w = Math.max(20, g / x * g), y = g - w, b = r / (x - g) * y, v = i + o - 6 - 2;
      if (l >= v && l <= v + 6 && h >= s + f + b && h <= s + f + b + w) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }
    const m = s + f;
    if (l >= i && l <= i + o && h >= m && h <= m + g) {
      const p = h - m + r, x = Math.floor(p / c);
      x >= 0 && x < n.length && (this.state.filterDropdown.hoveredIndex = x, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN));
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
    const n = J.DROPDOWN_ITEM_HEIGHT, r = J.DROPDOWN_MAX_VISIBLE;
    let a;
    this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig ? a = ((u = this.state.dropdown.tagsConfig.options) == null ? void 0 : u.length) ?? 0 : a = ((f = this.state.dropdown.config.options) == null ? void 0 : f.length) ?? 0;
    const h = Math.min(a, r) * n, c = this.updateDropdownY(t, i ?? !1, h, { column: o }), d = this.updateDropdownX(t, e, { column: o });
    this.state.dropdown.x = d, this.state.dropdown.y = c.y, this.state.dropdown.showAbove = c.showAbove, this.eventEmitter.emit(R.DROPDOWN_HOVER);
  }
  /**
   * Close all dropdowns
   */
  closeAllDropdowns() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(R.DROPDOWN_CLOSE)), this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_CLOSE)), this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(R.DATE_DROPDOWN_CLOSE)), this.state.buttonsDropdown && (this.state.buttonsDropdown = null, this.eventEmitter.emit(R.BUTTONS_DROPDOWN_CLOSE)), this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(R.COLOR_DROPDOWN_CLOSE));
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
    s.fixed === "left" || s.fixed === "right" ? r = o.x : r = o.x - this.scrollState.scrollLeft, this.state.filterDropdown.x = r, this.state.filterDropdown.y = n, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Update date dropdown position
   */
  updateDateDropdownPosition() {
    if (!this.state.dateDropdown) return;
    const { cell: t, showAbove: e } = this.state.dateDropdown, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) return;
    const o = 68 + 6 * 28 + 16, n = Math.max(s.width ?? 100, 280), r = this.updateDropdownY(t, e ?? !1, o, { column: s }), a = this.updateDropdownX(t, n, { column: s });
    this.state.dateDropdown.x = a, this.state.dateDropdown.y = r.y, this.state.dateDropdown.width = n, this.state.dateDropdown.showAbove = r.showAbove, this.eventEmitter.emit(R.DATE_DROPDOWN_OPEN);
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
    this.state.colorDropdown.x = f, this.state.colorDropdown.y = u.y, this.state.colorDropdown.width = d, this.eventEmitter.emit(R.COLOR_DROPDOWN_OPEN);
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
    const l = J.DROPDOWN_ITEM_HEIGHT, h = o.length * l, c = this.updateDropdownY(t, n, h, {
      column: a,
      anchorType: "button",
      buttonY: i,
      buttonHeight: s
    }), d = this.updateDropdownX(t, 120, {
      column: a,
      anchorType: "button",
      buttonRelativeX: e
    });
    this.state.buttonsDropdown.x = d, this.state.buttonsDropdown.y = c.y, this.state.buttonsDropdown.showAbove = c.showAbove, this.eventEmitter.emit(R.DROPDOWN_HOVER);
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
      const p = o + 20, x = o + r - 20;
      if (s >= n && s <= n + h) {
        if (i >= p - 6 - 5 && i <= p + 6 + 5)
          return l === 0 ? (this.state.dateDropdown.currentYear = a - 1, this.state.dateDropdown.currentMonth = 11) : this.state.dateDropdown.currentMonth = l - 1, this.eventEmitter.emit(R.DATE_DROPDOWN_OPEN), !0;
        if (i >= x - 6 - 5 && i <= x + 6 + 5)
          return l === 11 ? (this.state.dateDropdown.currentYear = a + 1, this.state.dateDropdown.currentMonth = 0) : this.state.dateDropdown.currentMonth = l + 1, this.eventEmitter.emit(R.DATE_DROPDOWN_OPEN), !0;
      }
      const w = (r - u * 2) / 7, b = new Date(a, l, 1).getDay(), v = new Date(a, l + 1, 0).getDate();
      for (let I = 1; I <= v; I++) {
        const E = b + I - 1, M = Math.floor(E / 7), T = E % 7, S = o + u + T * w, H = n + h + c + M * d;
        if (i >= S && i <= S + w && s >= H && s <= H + d) {
          const k = new Date(a, l, I), O = this.formatDate(k), P = this.state.dateDropdown.cell, W = this.layoutManager.getLeafColumns()[P.columnIndex], B = this.rows[P.rowIndex];
          return W && B && (B.data[N(W)] = O), this.state.dateDropdown = null, this.eventEmitter.emit(R.DATE_DROPDOWN_CLOSE), this.eventEmitter.emit(R.DATE_SELECT, this.getCellInfo(P), O), !0;
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
      const y = (r - f * 2) / 7, v = new Date(a, l, 1).getDay(), I = new Date(a, l + 1, 0).getDate();
      for (let E = 1; E <= I; E++) {
        const M = v + E - 1, T = Math.floor(M / 7), S = M % 7, H = o + f + S * y, k = n + c + d + T * u;
        if (i >= H && i <= H + y && s >= k && s <= k + u) {
          p = new Date(a, l, E);
          break;
        }
      }
    }
    const x = h ? h.getTime() : null, w = p ? p.getTime() : null;
    x !== w && (this.state.dateDropdown.hoveredDate = p, this.eventEmitter.emit(R.DATE_DROPDOWN_HOVER));
  }
  /**
   * Handle color dropdown click
   */
  handleColorDropdownClick(t) {
    if (!this.state.colorDropdown) return !1;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { cell: o, config: n, x: r, y: a, width: l } = this.state.colorDropdown, h = n.presetColors || this.getDefaultPresetColors(), c = 8, d = 24, u = 4, f = 8, m = Math.ceil(h.length / c) * (d + u) + f * 2 - u;
    if (i >= r && i <= r + l && s >= a && s <= a + m) {
      const p = Math.floor((i - r - f) / (d + u)), x = Math.floor((s - a - f) / (d + u));
      if (p >= 0 && p < c && x >= 0) {
        const w = x * c + p;
        if (w >= 0 && w < h.length) {
          const y = h[w], v = this.layoutManager.getLeafColumns()[o.columnIndex], I = this.rows[o.rowIndex];
          return v && I && (I.data[N(v)] = y), this.state.colorDropdown = null, this.eventEmitter.emit(R.COLOR_DROPDOWN_CLOSE), this.eventEmitter.emit(R.COLOR_CHANGE, this.getCellInfo(o), y), !0;
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
    this.state.colorDropdown.hoveredColor !== g && (this.state.colorDropdown.hoveredColor = g, this.eventEmitter.emit(R.COLOR_DROPDOWN_HOVER));
  }
};
C(J, "DROPDOWN_ITEM_HEIGHT", 32), C(J, "DROPDOWN_MAX_VISIBLE", 8);
let Et = J;
const z = class z extends at {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle image tooltip hover
   */
  handleImageTooltipHover(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: s, scrollTop: o, maxRows: n } = this.state.imageTooltip, r = this.getViewportCoords(t), a = r.x, l = r.y, h = z.IMAGE_SIZE, c = z.IMAGE_PADDING, d = z.IMAGE_GAP, u = z.IMAGES_PER_ROW, m = u * h + (u - 1) * d + c * 2 + 4 + 4, p = h + d, x = n * p + c * 2 - d, w = this.state.imageTooltip.hoveredIndex;
    if (a >= e && a <= e + m && l >= i && l <= i + x) {
      const y = Math.ceil(s.length / u), b = Math.floor(o / p), v = Math.min(y, b + n + 1);
      for (let I = b; I < v; I++)
        for (let E = 0; E < u; E++) {
          const M = I * u + E;
          if (M >= s.length) break;
          const T = e + c + E * (h + d), S = i + c + I * p - o;
          if (a >= T && a <= T + h && l >= S && l <= S + h)
            return this.state.imageTooltip.hoveredIndex = M, w !== M && this.eventEmitter.emit(R.IMAGE_TOOLTIP_SCROLL), !0;
        }
      return this.state.imageTooltip.hoveredIndex = -1, w !== -1 && this.eventEmitter.emit(R.IMAGE_TOOLTIP_SCROLL), !0;
    }
    return this.state.imageTooltip.hoveredIndex = -1, w !== -1 && this.eventEmitter.emit(R.IMAGE_TOOLTIP_SCROLL), !1;
  }
  /**
   * Handle image tooltip click
   */
  handleImageTooltipClick(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: i, images: s, cell: o, scrollTop: n, maxRows: r } = this.state.imageTooltip, a = this.getViewportCoords(t), l = a.x, h = a.y, c = z.IMAGE_SIZE, d = z.IMAGE_PADDING, u = z.IMAGE_GAP, f = z.IMAGES_PER_ROW, p = f * c + (f - 1) * u + d * 2 + 4 + 4, x = c + u, w = r * x + d * 2 - u;
    if (l < e || l > e + p || h < i || h > i + w)
      return !1;
    const y = l - e - d, b = h - i - d + n, v = Math.floor(y / (c + u)), I = Math.floor(b / x);
    if (v >= 0 && v < f && I >= 0) {
      const E = I * f + v;
      if (E >= 0 && E < s.length) {
        const M = s[E];
        M && this.eventEmitter.emit(R.IMAGE_CLICK, this.getCellInfo(o), M, t);
      }
    }
    return !0;
  }
  /**
   * Handle image editor hover
   */
  handleImageEditorHover(t) {
    if (!this.state.imageEditor) return !1;
    const { x: e, y: i, images: s, pendingImages: o, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = z.IMAGE_SIZE, d = z.IMAGE_PADDING, u = z.IMAGE_GAP, f = z.IMAGES_PER_ROW, g = z.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, p = f * c + (f - 1) * u + d * 2 + 4 + 4, x = r * m + d * 2 - u, w = g + x, y = this.state.imageEditor.hoveredIndex;
    if (l < e || l > e + p || h < i || h > i + w)
      return this.state.imageEditor.hoveredIndex = -1, y !== -1 && this.eventEmitter.emit(R.IMAGE_EDITOR_HOVER), !1;
    if (h >= i && h <= i + g)
      return this.state.imageEditor.hoveredIndex = -1, y !== -1 && this.eventEmitter.emit(R.IMAGE_EDITOR_HOVER), !0;
    const b = i + g, v = s.length + o.length;
    for (let I = 0; I < r + 1; I++)
      for (let E = 0; E < f; E++) {
        const M = I * f + E;
        if (M >= v) break;
        const T = e + d + E * (c + u), S = b + d + I * m - n;
        if (l >= T && l <= T + c && h >= S && h <= S + c)
          return this.state.imageEditor.hoveredIndex = M, y !== M && this.eventEmitter.emit(R.IMAGE_EDITOR_HOVER), !0;
      }
    return this.state.imageEditor.hoveredIndex = -1, y !== -1 && this.eventEmitter.emit(R.IMAGE_EDITOR_HOVER), !0;
  }
  /**
   * Handle image editor click
   */
  handleImageEditorClick(t) {
    var v;
    if (!this.state.imageEditor) return "outside";
    const { x: e, y: i, images: s, cell: o, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = z.IMAGE_SIZE, d = z.IMAGE_PADDING, u = z.IMAGE_GAP, f = z.IMAGES_PER_ROW, g = z.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, p = f * c + (f - 1) * u + d * 2 + 4 + 4, x = r * m + d * 2 - u, w = g + x;
    if (l < e || l > e + p || h < i || h > i + w)
      return "outside";
    if (h >= i && h <= i + g)
      return "upload";
    const y = i + g, b = s.length + (((v = this.state.imageEditor.pendingImages) == null ? void 0 : v.length) ?? 0);
    for (let I = 0; I < r + 1; I++)
      for (let E = 0; E < f; E++) {
        const M = I * f + E;
        if (M >= b) break;
        const T = e + d + E * (c + u), S = y + d + I * m - n;
        if (l >= T && l <= T + c && h >= S && h <= S + c) {
          if (M < s.length) {
            const H = s[M];
            s.splice(M, 1), this.state.imageEditor.images = [...s], this.eventEmitter.emit(
              R.IMAGE_DELETE,
              this.getCellInfo(o),
              H,
              M
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
      s.data[N(i)],
      s,
      i,
      this.state.imageEditor.cell.rowIndex
    ) : { image: s.data[N(i)] }).image ?? {}, r = n.onUpload, a = n.maxCount, l = this.state.imageEditor.isSingleImage;
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
    ], this.eventEmitter.emit(R.IMAGE_EDITOR_SCROLL), r)
      for (const u of d) {
        try {
          const f = await r(u.file), g = this.state.imageEditor.pendingImages.findIndex(
            (m) => m.preview === u.preview
          );
          g >= 0 && (this.state.imageEditor.pendingImages.splice(g, 1), this.state.imageEditor.images = [...this.state.imageEditor.images, f], this.eventEmitter.emit(
            R.IMAGE_UPLOAD,
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
        this.eventEmitter.emit(R.IMAGE_EDITOR_SCROLL);
      }
    else {
      for (const u of d) {
        const f = this.state.imageEditor.pendingImages.findIndex(
          (g) => g.preview === u.preview
        );
        f >= 0 && (this.state.imageEditor.pendingImages.splice(f, 1), this.state.imageEditor.images = [...this.state.imageEditor.images, u.preview], this.eventEmitter.emit(
          R.IMAGE_UPLOAD,
          this.getCellInfo(this.state.imageEditor.cell),
          u.preview
        ));
      }
      this.eventEmitter.emit(R.IMAGE_EDITOR_SCROLL);
    }
  }
  /**
   * Commit image editor changes
   */
  commitImageEditorChanges() {
    if (!this.state.imageEditor) return;
    const { cell: t, images: e, isSingleImage: i } = this.state.imageEditor, o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (o && n) {
      const r = n.data[N(o)];
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
      this.eventEmitter.emit(R.EDIT_END, this.getCellInfo(t), a);
    }
    this.state.imageEditor = null, this.eventEmitter.emit(R.IMAGE_EDITOR_CLOSE);
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
    const n = z.IMAGE_SIZE, r = z.IMAGE_PADDING, a = z.IMAGE_GAP, l = z.IMAGES_PER_ROW, h = l * n + (l - 1) * a + r * 2, c = n + a, d = i * c + r * 2 - a, u = this.updateDropdownY(t, e, d, { column: o }), f = this.updateDropdownX(t, h, { column: o });
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
    const n = z.IMAGE_SIZE, r = z.IMAGE_PADDING, a = z.IMAGE_GAP, l = z.IMAGES_PER_ROW, h = z.IMAGE_UPLOAD_AREA_HEIGHT, c = n + a, d = l * n + (l - 1) * a + r * 2 + 4 + 4, u = i * c + r * 2 - a, f = h + u, g = this.updateDropdownY(t, e, f, { column: o }), m = this.updateDropdownX(t, d, { column: o });
    this.state.imageEditor.x = m, this.state.imageEditor.y = g.y, this.state.imageEditor.showAbove = g.showAbove;
  }
  /**
   * Handle drag over event for image editor
   */
  handleDragOver(t) {
    if (!this.state.imageEditor) return !1;
    t.preventDefault();
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, maxRows: r } = this.state.imageEditor, a = z.IMAGE_SIZE, l = z.IMAGE_PADDING, h = z.IMAGE_GAP, c = z.IMAGES_PER_ROW, d = z.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    return i >= o && i <= o + f && s >= n && s <= n + m ? (this.state.imageEditor.isDragging = !0, this.eventEmitter.emit(R.IMAGE_EDITOR_SCROLL), !0) : !1;
  }
  /**
   * Handle drag leave event for image editor
   */
  handleDragLeave(t) {
    if (!this.state.imageEditor) return;
    const e = this.getViewportCoords(t), i = e.x, s = e.y, { x: o, y: n, maxRows: r } = this.state.imageEditor, a = z.IMAGE_SIZE, l = z.IMAGE_PADDING, h = z.IMAGE_GAP, c = z.IMAGES_PER_ROW, d = z.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    (i < o || i > o + f || s < n || s > n + m) && (this.state.imageEditor.isDragging = !1, this.eventEmitter.emit(R.IMAGE_EDITOR_SCROLL));
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
    return e.length > 0 && await this.handleFileUpload(e), this.eventEmitter.emit(R.IMAGE_EDITOR_SCROLL), !0;
  }
};
C(z, "IMAGE_SIZE", 64), C(z, "IMAGE_PADDING", 8), C(z, "IMAGE_GAP", 8), C(z, "IMAGES_PER_ROW", 4), C(z, "IMAGE_UPLOAD_AREA_HEIGHT", 60);
let Mt = z;
const ut = class ut extends at {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle context menu click
   */
  handleContextMenuClick(t) {
    if (!this.state.contextMenu) return !1;
    const { x: e, y: i, row: s, items: o } = this.state.contextMenu, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 140, h = ut.DROPDOWN_ITEM_HEIGHT, c = o.length * h;
    if (r >= e && r <= e + l && a >= i && a <= i + c) {
      const d = a - i, u = Math.floor(d / h), f = o[u];
      return !f || f.disabled || (f.key === "pin-top" ? this.eventEmitter.emit(R.ROW_PIN_CHANGE, s, "top") : f.key === "pin-bottom" ? this.eventEmitter.emit(R.ROW_PIN_CHANGE, s, "bottom") : f.key === "unpin" ? this.eventEmitter.emit(R.ROW_PIN_CHANGE, s, null) : f.key === "add-above" ? this.eventEmitter.emit(R.ROW_ADD_ABOVE, s) : f.key === "add-below" ? this.eventEmitter.emit(R.ROW_ADD_BELOW, s) : f.key === "delete" && this.eventEmitter.emit(R.ROW_DELETE, s), this.state.contextMenu = null, this.eventEmitter.emit(R.CONTEXT_MENU_CLOSE)), !0;
    }
    return !1;
  }
  /**
   * Handle context menu hover
   */
  handleContextMenuHover(t) {
    if (!this.state.contextMenu) return;
    const { x: e, y: i, items: s, hoveredIndex: o } = this.state.contextMenu, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 140, h = ut.DROPDOWN_ITEM_HEIGHT, c = s.length * h;
    let d = -1;
    if (r >= e && r <= e + l && a >= i && a <= i + c) {
      const u = a - i;
      d = Math.floor(u / h);
    }
    d !== o && (this.state.contextMenu.hoveredIndex = d, this.eventEmitter.emit(R.CONTEXT_MENU_HOVER));
  }
  /**
   * Handle header context menu click
   */
  handleHeaderContextMenuClick(t) {
    if (!this.state.headerContextMenu) return !1;
    const { x: e, y: i, columnKey: s } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y;
    return n >= e && n <= e + 120 && r >= i && r <= i + 32 ? (this.eventEmitter.emit(R.COLUMN_HIDE, s), this.state.headerContextMenu = null, this.eventEmitter.emit(R.HEADER_CONTEXT_MENU_CLOSE), !0) : !1;
  }
  /**
   * Handle header context menu hover
   */
  handleHeaderContextMenuHover(t) {
    if (!this.state.headerContextMenu) return;
    const { x: e, y: i, hoveredIndex: s } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y, a = 120, l = 32;
    let h = -1;
    n >= e && n <= e + a && r >= i && r <= i + l && (h = 0), h !== s && (this.state.headerContextMenu.hoveredIndex = h, this.eventEmitter.emit(R.HEADER_CONTEXT_MENU_HOVER));
  }
  /**
   * Close context menus
   */
  closeContextMenus() {
    this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(R.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(R.HEADER_CONTEXT_MENU_CLOSE));
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
C(ut, "DROPDOWN_ITEM_HEIGHT", 32);
let St = ut;
class Ve extends at {
  constructor(e, i, s, o) {
    super(e, i);
    C(this, "sortConfig");
    C(this, "filterConfig");
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
      const L = this.layoutManager.getRightFixedWidth(), B = this.layoutManager.getViewportWidth() - L - (this.layoutManager.getLayoutInfo().totalWidth - L);
      r = e.x + B;
    } else
      r = e.x - this.scrollState.scrollLeft;
    const a = e.y, l = e.width, h = e.height, c = 8, d = 10, u = 10, f = r + c, g = a + (h - u) / 2, p = o.reorderable !== !1 && i >= f && i <= f + d && s >= g && s <= g + u;
    this.state.hoveredHeaderColumnKey = o.key;
    const x = (o == null ? void 0 : o.filterable) && e.isLeaf;
    let w, y;
    x ? (w = r + l - c - 10, y = w - 16) : y = r + l - c - 10;
    const b = a + h / 2, v = 8, I = 5, E = 2, M = 4, T = b - E - I - M, S = b + E + I + M, H = y - v / 2 - M, k = y + v / 2 + M, O = e.isLeaf && x && w !== void 0 && Math.abs(i - w) < 12, P = e.isLeaf && o && o.sortable !== !1 && i >= H && i <= k && s >= T && s <= S;
    p ? this.canvas.style.cursor = "grab" : O || P ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", this.state.hoveredCell = null, this.state.tooltip = null, n !== this.state.hoveredHeaderColumnKey && this.eventEmitter.emit(R.HEADER_HOVER, this.state.hoveredHeaderColumnKey);
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
      const I = this.layoutManager.getRightFixedWidth(), M = this.layoutManager.getViewportWidth() - I, T = this.layoutManager.getLayoutInfo().totalWidth, S = M - (T - I);
      h = r.x + S;
    } else
      h = r.x - this.scrollState.scrollLeft;
    const c = r.y, d = r.height, u = 8, f = 10, g = 10, m = h + u, p = c + (d - g) / 2, x = o >= m && o <= m + f && n >= p && n <= p + g;
    if (r.isLeaf && !x || !r.isLeaf && !x)
      return !1;
    let w = a.key, y = e;
    if (!r.isLeaf && a.children && a.children.length > 0) {
      const I = this.getFirstLeaf(a);
      I && (w = a.key, y = this.layoutManager.getLeafColumnIndex(I), y < 0 && (y = e));
    }
    const b = this.calculateSiblingColumns(a), v = b.findIndex((I) => I.key === a.key);
    return this.state.columnReorderState = {
      dragColumnIndex: y,
      dragColumnKey: w,
      dragStartX: o,
      currentX: o,
      targetColumnIndex: y,
      isParentColumn: !r.isLeaf,
      isFixedColumn: !!a.fixed,
      siblingColumns: b,
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
    this.eventEmitter.emit(R.HEADER_CLICK, s, e, i);
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
    const p = h + d / 2, x = 8, w = 5, y = 2, b = 4, v = p - y - w - b, I = p - y + b, E = p + y - b, M = p + y + w + b, T = m - x / 2 - b, S = m + x / 2 + b;
    if (n >= T && n <= S && r >= v && r <= M) {
      const k = r >= v && r <= I, O = r >= E && r <= M;
      k ? this.setSortDirection(s, "asc", i) : O ? this.setSortDirection(s, "desc", i) : this.toggleSort(s, i);
    }
  }
  /**
   * Set sort direction
   */
  setSortDirection(e, i, s) {
    const o = this.sortConfig.findIndex((r) => r.column === e.key);
    if ((o >= 0 ? this.sortConfig[o].direction : "none") === i) {
      s.shiftKey ? o >= 0 && this.sortConfig.splice(o, 1) : this.sortConfig = [], this.eventEmitter.emit(R.SORT_CHANGE, [...this.sortConfig]);
      return;
    }
    s.shiftKey ? o >= 0 ? this.sortConfig[o].direction = i : this.sortConfig.push({ column: e.key, direction: i }) : this.sortConfig = [{ column: e.key, direction: i }], this.eventEmitter.emit(R.SORT_CHANGE, [...this.sortConfig]);
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
    i.shiftKey ? s >= 0 ? o === "none" ? this.sortConfig.splice(s, 1) : this.sortConfig[s].direction = o : o !== "none" && this.sortConfig.push({ column: e.key, direction: o }) : o === "none" ? this.sortConfig = [] : this.sortConfig = [{ column: e.key, direction: o }], this.eventEmitter.emit(R.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Open filter dropdown
   */
  openFilterDropdown(e, i) {
    const s = this.layoutManager.getCellPosition(-1, i), o = this.layoutManager.getLayoutInfo().headerHeight, n = ee(e);
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
        const h = Yt(e, a, 0), c = l ? l.value : [], d = h.length === 0 && a.length > 0;
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
    this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
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
class Ye extends at {
  constructor(e, i) {
    super(e, i);
    /**
     * Handle expand icon click
     */
    C(this, "handleExpandIconClick", (e, i, s) => {
      const o = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), a = this.layoutManager.getLeafColumns()[e.columnIndex], l = i.clientX - o.left, h = this.getCellViewportX(n, a), c = l - h, d = s.level ?? 0, u = 8, f = 8, g = d * 16, m = u + g, p = m + f + 4;
      return c >= m && c <= p ? (this.eventEmitter.emit(R.EXPAND, s, e.rowIndex, !s.expanded), !0) : !1;
    });
  }
  /**
   * Handle progress bar click
   */
  handleProgressClick(e, i, s, o, n) {
    if (!s.interactive || n && o && et(o.disabled, n, o)) return !1;
    const r = this.canvas.getBoundingClientRect(), a = i.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = s.shape ?? "line";
    if (c === "line") {
      const u = s.size ?? "medium", f = s.height ?? (u === "small" ? 6 : u === "large" ? 16 : 10), g = s.textPosition ?? "right", p = (s.showText ?? !0) && g === "right" ? 40 : 0, x = s.width ?? l.width - 8 * 2 - p, w = h + 8, y = this.getCellViewportY(e.rowIndex) + (l.height - f) / 2, b = i.clientY - r.top, v = a - w, I = b - y;
      if (v >= 0 && v <= x && I >= 0 && I <= f) {
        const E = s.precision ?? 0, M = Math.max(0, Math.min(100, v / x * 100)), T = E === 0 ? Math.round(M) : Number(M.toFixed(E));
        return o && n && (n.data[N(o)] = T), this.eventEmitter.emit(R.PROGRESS_CHANGE, this.getCellInfo(e), T), !0;
      }
    } else if (c === "circle" || c === "dashboard") {
      const d = i.clientY - r.top, u = this.getCellViewportY(e.rowIndex), f = s.size ?? "medium";
      let g, m = 0;
      c === "circle" ? g = f === "small" ? 0.6 : f === "large" ? 0.9 : 0.75 : (g = f === "small" ? 0.7 : f === "large" ? 0.95 : 0.85, m = l.height * 0.05);
      const p = Math.floor(l.height * g), x = s.width ?? p, w = s.strokeWidth ?? Math.max(2, Math.round(x * 0.12)), y = (x - w) / 2, b = h + l.width / 2, v = u + l.height / 2 + m, I = a - b, E = d - v, M = Math.sqrt(I * I + E * E);
      if (M >= y - w && M <= y + w) {
        let T = Math.atan2(E, I), S;
        if (c === "circle")
          T = T + Math.PI / 2, T < 0 && (T += Math.PI * 2), S = T / (Math.PI * 2) * 100;
        else {
          const k = Math.PI * 0.75, O = Math.PI * 1.5;
          T < 0 && (T += Math.PI * 2);
          let P = T - k;
          if (P < 0 && (P += Math.PI * 2), P > O) return !1;
          S = P / O * 100;
        }
        S = Math.max(0, Math.min(100, S));
        const H = s.precision ?? 0;
        return S = H === 0 ? Math.round(S) : Number(S.toFixed(H)), o && n && (n.data[N(o)] = S), this.eventEmitter.emit(R.PROGRESS_CHANGE, this.getCellInfo(e), S), !0;
      }
    }
    return !1;
  }
  /**
   * Handle rating click
   */
  handleRatingClick(e, i, s, o, n) {
    if (n && o && et(o.disabled, n, o)) return !1;
    const r = this.canvas.getBoundingClientRect(), a = i.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = a - h, d = s.max ?? 5, u = s.starSize ?? 16, f = s.allowHalf ?? !1, g = s.value ?? 0, m = d * u, p = (l.width - m) / 2;
    for (let x = 0; x < d; x++) {
      const w = p + x * u;
      if (c >= w && c <= w + u) {
        let y;
        return f ? (c - w < u / 2 ? y = x + 0.5 : y = x + 1, y === g && (y = 0)) : (y = x + 1, y === g && (y = 0)), y = Math.min(y, d), o && n && (n.data[N(o)] = y), this.eventEmitter.emit(R.RATING_CHANGE, this.getCellInfo(e), y), !0;
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
    let x = f;
    for (let w = 0; w < s.length; w++) {
      const y = s[w], b = this.ctx.measureText(y.label).width, v = g + m + b + f;
      if (x + v - f > p)
        break;
      const I = x, E = (n.height - g) / 2, M = E + g / 2, T = d >= I && d <= I + g && u >= E && u <= E + g, S = I + g + m, H = d >= S && d <= S + b && u >= M - 10 && u <= M + 10;
      if (T || H)
        return y;
      x += v;
    }
    return null;
  }
}
class Xe extends at {
  constructor(e, i) {
    super(e, i);
    C(this, "buttonHoverAnimationRunning", !1);
    C(this, "switchAnimationRunning", !1);
    C(this, "isDestroyed", !1);
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
    }), this.eventEmitter.emit(R.BUTTON_HOVER_ANIMATION_UPDATE), s ? requestAnimationFrame(() => this.runButtonHoverAnimationLoop()) : this.buttonHoverAnimationRunning = !1;
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
    }), this.eventEmitter.emit(R.SWITCH_ANIMATION_UPDATE), s ? requestAnimationFrame(() => this.runSwitchAnimationLoop()) : this.switchAnimationRunning = !1;
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
const Nt = 64;
class Ge extends at {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Get image size constant
   */
  static get IMAGE_SIZE() {
    return Nt;
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
    const o = nt(i, s, t.rowIndex), n = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), r = this.getCellViewportX(n, i), a = this.getCellViewportY(t.rowIndex);
    if (o.type === "tag" && o.tags) {
      this.handleTagsTooltip(t, o.tags.tags, n, r);
      return;
    }
    if (o.type === "select" && o.select) {
      this.handleSelectTooltip(t, o.select, n, r);
      return;
    }
    if (o.type === "image" && o.image) {
      this.handleImageTooltip(t, o.image, n, r, a);
      return;
    }
    if (o.text) {
      this.handleTextTooltip(t, o.text, n, r);
      return;
    }
    this.state.tooltip = null;
  }
  /**
   * Handle tags tooltip
   */
  handleTagsTooltip(t, e, i, s) {
    const a = i.width - 16;
    let l = 0, h = 0, c = !1;
    for (let d = 0; d < e.length; d++) {
      const u = e[d], f = this.ctx.measureText(u.text).width + 4 * 2, g = e.length - l, p = g > 1 ? this.ctx.measureText(`+${g - 1}`).width + 4 * 2 + 4 : 0, x = a - h - p;
      if (f <= x)
        l++, h += f + 4;
      else {
        c = !0;
        break;
      }
    }
    if (l < e.length && (c = !0), !c) {
      this.state.tooltip = null;
      return;
    }
    this.state.tooltip = {
      cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
      x: s,
      y: this.getCellViewportY(t.rowIndex),
      width: i.width,
      content: { type: "tags", tags: e }
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
    const r = this.canvas.getBoundingClientRect(), a = Nt, l = 8, h = 8, c = 4, d = Math.ceil(n.length / c);
    let u;
    d <= 1 ? u = 1 : d <= 2 ? u = 2 : u = 3;
    const f = c * a + (c - 1) * h + l * 2, g = a + h, m = u * g + l * 2 - h;
    let p = o + i.height, x = !1;
    p + m > r.height && (p = o - m, x = !0);
    let w = s;
    w + f > r.width && (w = r.width - f - 4), w < 0 && (w = 4), this.state.imageTooltip = {
      cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
      x: w,
      y: p,
      images: n,
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows: u,
      showAbove: x
    };
  }
  /**
   * Handle text tooltip
   */
  handleTextTooltip(t, e, i, s) {
    const n = i.width - 16;
    if (this.ctx.measureText(e).width > n) {
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
  constructor(t, e, i, s, o, n) {
    C(this, "state");
    C(this, "scrollState");
    C(this, "scrollbarState");
    C(this, "layoutManager");
    C(this, "eventEmitter");
    C(this, "canvas");
    C(this, "ctx");
    C(this, "editingConfig");
    C(this, "dataManager");
    C(this, "sortConfig", []);
    C(this, "filterConfig", []);
    C(this, "expandColumnKey", null);
    C(this, "isDestroyed", !1);
    // Handler instances
    C(this, "editingHandler");
    C(this, "dropdownHandler");
    C(this, "selectionHandler");
    C(this, "navigationHandler");
    C(this, "contextMenuHandler");
    C(this, "imageHandler");
    C(this, "headerHandler");
    C(this, "controlClickHandler");
    C(this, "buttonAnimationHandler");
    C(this, "tooltipHandler");
    C(this, "resizeColumnIndex", -1);
    C(this, "resizeStartX", 0);
    C(this, "resizeStartWidth", 0);
    // 用于检测双击，防止双击时触发 link 跳转
    C(this, "_lastClickTime", 0);
    C(this, "_lastClickCell", null);
    C(this, "getScrollbarBounds", () => ({ vertical: null, horizontal: null }));
    // 懒加载相关
    C(this, "lazyLoadEnabled", !1);
    C(this, "lazyLoadThreshold", 5);
    C(this, "isLoadingMore", !1);
    C(this, "hasMoreData", !0);
    // 是否还有更多数据
    C(this, "rowHeightResizeEnabled", !1);
    C(this, "rowResizable", !0);
    C(this, "enableRowPinning", !1);
    C(this, "rowPinnable", !0);
    C(this, "handleMouseDown", (t) => {
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      if (this.state.contextMenu) {
        if (this.contextMenuHandler.handleContextMenuClick(t)) return;
        this.state.contextMenu = null, this.eventEmitter.emit(R.CONTEXT_MENU_CLOSE);
        return;
      }
      if (this.state.headerContextMenu) {
        if (this.contextMenuHandler.handleHeaderContextMenuClick(t)) return;
        this.state.headerContextMenu = null, this.eventEmitter.emit(R.HEADER_CONTEXT_MENU_CLOSE);
        return;
      }
      if (this.state.filterDropdown) {
        if (this.dropdownHandler.handleFilterDropdownClick(t)) return;
        this.state.filterDropdown = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_CLOSE);
        return;
      }
      if (this.state.dateDropdown) {
        if (this.dropdownHandler.handleDateDropdownClick(t)) return;
        this.state.dateDropdown = null, this.eventEmitter.emit(R.DATE_DROPDOWN_CLOSE);
        return;
      }
      if (this.state.colorDropdown) {
        if (this.dropdownHandler.handleColorDropdownClick(t)) return;
        this.state.colorDropdown = null, this.eventEmitter.emit(R.COLOR_DROPDOWN_CLOSE);
        return;
      }
      if (this.state.dropdown) {
        if (this.dropdownHandler.handleDropdownClick(t)) return;
        this.state.dropdown = null, this.eventEmitter.emit(R.DROPDOWN_CLOSE);
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
          if (this.rowHeightResizeEnabled && o.isRowResizeHandle && o.resizeRowIndex !== void 0 && this.isRowResizable(o.resizeRowIndex)) {
            if (!this.rows[o.resizeRowIndex]) return;
            const r = this.layoutManager.getRowHeightByIndex(o.resizeRowIndex);
            this.state.isDragging = !0, this.state.dragType = "row-resize", this.state.rowResizeState = {
              rowIndex: o.resizeRowIndex,
              startY: t.clientY,
              startHeight: r,
              displayHeight: r
            }, this.canvas.style.cursor = "ns-resize", this.bindDocumentEvents();
            return;
          }
          if (o.cell && this.handleControlClick(o.cell, t))
            return;
          o.cell && (t.shiftKey && this.state.selectedCells.length > 0 ? this.selectionHandler.handleRangeSelection(o.cell) : t.ctrlKey || t.metaKey ? this.selectionHandler.handleToggleSelection(o.cell) : (this.selectionHandler.handleSingleSelection(o.cell), this.state.isSelecting = !0, this.state.selectionStart = o.cell));
          return;
        case "outside":
          return;
      }
    });
    C(this, "handleDragOver", (t) => {
      this.imageHandler.handleDragOver(t);
    });
    C(this, "handleDragLeave", (t) => {
      this.imageHandler.handleDragLeave(t);
    });
    C(this, "handleDrop", async (t) => {
      await this.imageHandler.handleDrop(t);
    });
    C(this, "handleContextMenu", (t) => {
      t.preventDefault();
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(R.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(R.HEADER_CONTEXT_MENU_CLOSE)), this.closeAllDropdowns();
      const n = this.layoutManager.getLayoutInfo().headerHeight;
      if (s <= n) {
        const m = this.layoutManager.getHeaderCellAtPosition(i, s);
        if (m) {
          const p = m.column;
          if (p.hideable === !1) return;
          const x = this.canvas.getBoundingClientRect(), w = 120, y = 32;
          let b = i, v = s;
          b + w > x.width && (b = x.width - w - 8), b < 0 && (b = 8), v + y > x.height && (v = x.height - y - 8), this.state.headerContextMenu = {
            x: b,
            y: v,
            columnKey: p.key,
            columnIndex: m.colIndex,
            hoveredIndex: -1
          }, this.eventEmitter.emit(R.HEADER_CONTEXT_MENU_OPEN);
          return;
        }
        return;
      }
      const r = this.layoutManager.getRowHitAtViewportPosition(
        i,
        s,
        this.scrollState.scrollTop
      );
      if (!r) return;
      const a = r.row, l = this.getRowContextMenuItems(a), h = this.canvas.getBoundingClientRect(), c = 140, d = q.DROPDOWN_ITEM_HEIGHT, u = l.length * d;
      let f = i, g = s;
      f + c > h.width && (f = h.width - c - 8), f < 0 && (f = 8), g + u > h.height && (g = h.height - u - 8), g < 0 && (g = 8), this.state.contextMenu = {
        x: f,
        y: g,
        row: a,
        hoveredIndex: -1,
        items: l
      }, this.eventEmitter.emit(R.CONTEXT_MENU_OPEN);
    });
    C(this, "handleDocumentMouseMove", (t) => {
      var e;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { min: i, max: s } = this.layoutManager.getRowHeightBounds(), o = t.clientY - this.state.rowResizeState.startY;
        this.state.rowResizeState.displayHeight = Z(
          this.state.rowResizeState.startHeight + o,
          i,
          s
        ), this.eventEmitter.emit(R.ROW_RESIZE_DRAG);
        return;
      }
      if ((e = this.state.filterDropdown) != null && e.isScrollbarDragging) {
        const { options: i, scrollbarDragStartY: s, scrollbarDragStartScrollTop: o } = this.state.filterDropdown;
        if (!i) return;
        const n = q.DROPDOWN_ITEM_HEIGHT, r = q.DROPDOWN_MAX_VISIBLE, l = Math.min(i.length, r) * n, h = i.length * n, c = Math.max(20, l / h * l), d = l - c, f = (t.clientY - (s ?? 0)) / d, g = h - l, m = (o ?? 0) + f * g;
        this.state.filterDropdown.scrollTop = Z(m, 0, g), this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
        return;
      }
      if (this.scrollbarState.verticalDragging) {
        const i = this.layoutManager.getLayoutInfo(), s = i.headerHeight, o = this.canvas.height / (window.devicePixelRatio || 1), n = o - s, r = Math.max(30, o / i.totalHeight * n), a = n - r, h = (t.clientY - this.scrollbarState.dragStartY) / a, c = this.scrollbarState.dragStartScrollTop + h * this.scrollState.maxScrollTop;
        this.scrollState.scrollTop = Z(c, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
          R.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
      if (this.scrollbarState.horizontalDragging) {
        const i = this.layoutManager.getLayoutInfo(), s = this.canvas.width / (window.devicePixelRatio || 1), o = Math.max(30, s / i.totalWidth * s), n = s - o, a = (t.clientX - this.scrollbarState.dragStartX) / n, l = this.scrollbarState.dragStartScrollLeft + a * this.scrollState.maxScrollLeft;
        this.scrollState.scrollLeft = Z(l, 0, this.scrollState.maxScrollLeft), this.eventEmitter.emit(
          R.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
    });
    C(this, "handleDocumentMouseUp", () => {
      var t;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, s = this.rows[e];
        s && this.eventEmitter.emit(R.ROW_HEIGHT_CHANGE, s, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if ((t = this.state.filterDropdown) != null && t.isScrollbarDragging) {
        this.state.filterDropdown.isScrollbarDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) && (this.scrollbarState.verticalDragging = !1, this.scrollbarState.horizontalDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents());
    });
    C(this, "handleMouseMove", (t) => {
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
          this.layoutManager.setColumnWidth(a.key, h), this.eventEmitter.emit(R.COLUMN_RESIZE, a, h);
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
          this.eventEmitter.emit(R.COLUMN_REORDER_DRAG);
          return;
        }
        const u = Date.now();
        if (h.lastSwapTime && u - h.lastSwapTime < 50) {
          this.eventEmitter.emit(R.COLUMN_REORDER_DRAG);
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
              this.eventEmitter.emit(R.COLUMN_REORDER_DRAG);
              return;
            }
            let x = !1;
            if ((f > d ? "right" : "left") === "right" ? x = l >= g : x = l < g, x) {
              this.eventEmitter.emit(R.COLUMN_SWAP, m.key, p.key), h.lastSwapTime = u, h.lastSwapTargetKey = void 0;
              const y = this.layoutManager.getColumnByKey(h.dragColumnKey);
              if (y) {
                const b = this.headerHandler.calculateSiblingColumns(y), v = b.findIndex(
                  (E) => E.key === h.dragColumnKey
                );
                h.siblingColumns = b, h.dragSiblingIndex = v >= 0 ? v : d;
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
        this.eventEmitter.emit(R.COLUMN_REORDER_DRAG);
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
      if (o.region === "cell" && o.cell) {
        if (this.rowHeightResizeEnabled && o.isRowResizeHandle && o.resizeRowIndex !== void 0 && this.isRowResizable(o.resizeRowIndex)) {
          this.canvas.style.cursor = "ns-resize", this.state.tooltip = null;
          return;
        }
        const a = o.cell;
        this.updateButtonHoverState(a, i, s);
        const l = this.layoutManager.getLeafColumns(), h = a.columnIndex >= 0 ? l[a.columnIndex] : void 0, c = a.rowIndex >= 0 ? this.rows[a.rowIndex] : void 0;
        if ((h && c ? et(h.disabled, c, h) : !1) ? this.canvas.style.cursor = "not-allowed" : this.isClickableElement(a, i, s) ? this.canvas.style.cursor = "pointer" : h && h.key.startsWith("__hidden_placeholder__") ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", ((n = this.state.hoveredCell) == null ? void 0 : n.rowIndex) !== a.rowIndex || ((r = this.state.hoveredCell) == null ? void 0 : r.columnIndex) !== a.columnIndex) {
          this.state.hoveredCell = a.rowIndex >= 0 ? a : null;
          const u = this.state.hoveredCell ? this.getCellInfo(this.state.hoveredCell) : null;
          this.eventEmitter.emit(R.CELL_HOVER, u, t);
        }
        this.updateImageHoverIndex(a, i, s), this.updateButtonsHoverIndex(a, i, s), this.state.hoveredHeaderColumnKey !== void 0 && (this.state.hoveredHeaderColumnKey = void 0, this.eventEmitter.emit(R.HEADER_HOVER, void 0)), this.checkTooltip(a);
      }
    });
    C(this, "startButtonHoverAnimationLoop", () => {
      this.buttonAnimationHandler.startButtonHoverAnimationLoop();
    });
    C(this, "getButtonHoverStates", () => this.buttonAnimationHandler.getButtonHoverStates());
    C(this, "checkTooltip", (t) => {
      this.tooltipHandler.checkTooltip(t);
    });
    C(this, "handleMouseUp", (t) => {
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { rowIndex: e, displayHeight: i } = this.state.rowResizeState, s = this.rows[e];
        s && this.eventEmitter.emit(R.ROW_HEIGHT_CHANGE, s, i, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
        const { cell: e, column: i, row: s, displayValue: o } = this.state.progressDragState;
        i && s && (s.data[N(i)] = o), this.eventEmitter.emit(R.PROGRESS_CHANGE, this.getCellInfo(e), o), this.state.isDragging = !1, this.state.dragType = null, this.state.progressDragState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
        const { dragColumnIndex: e, targetColumnIndex: i } = this.state.columnReorderState;
        e !== i && i >= 0 && this.eventEmitter.emit(R.COLUMN_REORDER, e, i), this.state.isDragging = !1, this.state.dragType = null, this.state.columnReorderState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents(), this.eventEmitter.emit(R.COLUMN_REORDER_DRAG);
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
    C(this, "handleMouseLeave", () => {
      const t = this.state.hoveredHeaderColumnKey !== void 0;
      this.state.hoveredCell = null, this.state.hoveredHeaderColumnKey = void 0, this.state.hoveredImageIndex = -1, this.state.hoveredButtonIndex = -1, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.columnReorderState = void 0, this.scrollbarState.verticalHovered = !1, this.scrollbarState.horizontalHovered = !1, this.clearAllButtonHoverStates(), t && this.eventEmitter.emit(R.HEADER_HOVER, void 0);
    });
    C(this, "handleDblClick", (t) => {
      var h;
      const e = this.canvas.getBoundingClientRect(), i = t.clientX - e.left, s = t.clientY - e.top;
      if (this.state.dateDropdown) {
        const { x: c, y: d, width: u } = this.state.dateDropdown, w = 40 + 28 + 6 * 28 + 8 * 2;
        if (i >= c && i <= c + u && s >= d && s <= d + w)
          return;
        this.state.dateDropdown = null, this.eventEmitter.emit(R.DATE_DROPDOWN_CLOSE);
      }
      if (this.state.dropdown) {
        const { x: c, y: d, width: u, type: f, tagsConfig: g, config: m } = this.state.dropdown, p = q.DROPDOWN_ITEM_HEIGHT, x = q.DROPDOWN_MAX_VISIBLE;
        let w;
        f === "tags" && g ? w = ((h = g.options) == null ? void 0 : h.length) ?? 0 : w = m.options.length;
        const b = Math.min(w, x) * p;
        if (i >= c && i <= c + u && s >= d && s <= d + b)
          return;
        this.state.dropdown = null, this.eventEmitter.emit(R.DROPDOWN_CLOSE);
      }
      if (this.state.filterDropdown) {
        const { x: c, y: d, width: u, mode: f, options: g } = this.state.filterDropdown, m = 8, p = 36, x = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE;
        let y;
        switch (f) {
          case "search": {
            y = 36 + p + m;
            break;
          }
          case "select": {
            y = 36 + Math.min((g == null ? void 0 : g.length) ?? 0, w) * x + p;
            break;
          }
          case "range": {
            y = m + 32 + 8 + p + m;
            break;
          }
          case "boolean": {
            y = 32 * 3 + p;
            break;
          }
          case "dateRange": {
            y = m + 32 + 8 + p + m;
            break;
          }
          default:
            y = 200;
        }
        if (i >= c && i <= c + u && s >= d && s <= d + y)
          return;
        this.state.filterDropdown = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_CLOSE);
      }
      const o = this.layoutManager.getCellAtViewportPosition(
        i,
        s,
        this.scrollState.scrollTop
      );
      if (!o || o.rowIndex < 0) return;
      const r = this.layoutManager.getLeafColumns()[o.columnIndex], a = this.rows[o.rowIndex], l = ["checkbox", "radio", "button", "buttons", "switch", "rating"];
      if (r && a) {
        const c = nt(r, a, o.rowIndex);
        if (c.type && l.includes(c.type))
          return;
        if (c.type === "progress" && c.progress) {
          if (c.progress.interactive !== !0 || r.editable === !1 || et(r.disabled, a, r)) return;
          this.eventEmitter.emit(R.CELL_DBL_CLICK, this.getCellInfo(o), t), this.eventEmitter.emit(R.ROW_DBL_CLICK, a, o.rowIndex, t), this.editingConfig.enabled !== !1 && this.startEditing(o, {
            value: String(c.progress.value),
            type: "number",
            placeholder: "0-100"
          });
          return;
        }
        if (c.type === "color" && c.color) {
          const d = this.layoutManager.getCellPosition(o.rowIndex, o.columnIndex), u = this.getCellViewportX(d, r), f = this.getCellViewportY(o.rowIndex), m = Math.min(d.height - 8 * 2, 24), p = u + (d.width - m) / 2, x = f + (d.height - m) / 2;
          if (!(i >= p && i <= p + m && s >= x && s <= x + m)) return;
        }
        if (r.editable === !1 || et(r.disabled, a, r)) return;
        if (this.eventEmitter.emit(R.CELL_DBL_CLICK, this.getCellInfo(o), t), this.eventEmitter.emit(R.ROW_DBL_CLICK, a, o.rowIndex, t), this.editingConfig.enabled !== !1) {
          const d = this.getEditConfig(r, a, o.rowIndex);
          d ? d.type === "select" && d.select ? this.startSelectEditing(o, d.select) : d.type === "tag" && d.tags ? this.startTagsEditing(o, d.tags) : d.type === "date" && d.date ? this.startDateEditing(o, d.date) : d.type === "color" && d.color ? this.startColorEditing(o, d.color) : d.type === "input" || !d.type ? this.startEditing(o, d.input) : this.startEditing(o, d.input) : c.type === "select" && c.select ? this.startSelectEditing(o, c.select) : c.type === "tag" && c.tags && c.tags.editable ? this.startTagsEditing(o, c.tags) : c.type === "date" && c.date ? this.startDateEditing(o, c.date) : c.type === "color" && c.color ? this.startColorEditing(o, c.color) : c.type === "image" && c.image ? this.startImageEditing(o, c.image) : this.startEditing(o, c.input);
        }
      }
    });
    C(this, "handleControlClick", (t, e) => {
      var a, l;
      const s = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.rows[t.rowIndex];
      if (!s || !o) return !1;
      if (s.key.startsWith("__hidden_placeholder__")) {
        const h = s._hiddenColumnKey;
        if (h)
          return this.eventEmitter.emit(R.COLUMN_SHOW, h), !0;
      }
      if (this.expandColumnKey === s.key && o.children && o.children.length > 0 && this.handleExpandIconClick(t, e, o))
        return !0;
      const n = nt(s, o, t.rowIndex), r = et(s.disabled, o, s);
      if (n.type === "checkbox" && n.checkbox) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = 16, p = f + (h.width - m) / 2, x = g + (h.height - m) / 2;
        if (d >= p && d <= p + m && u >= x && u <= x + m && !r) {
          const y = !n.checkbox.checked;
          return o.data[N(s)] = y, this.eventEmitter.emit(R.CHECKBOX_CHANGE, this.getCellInfo(t), y), !0;
        }
        return !1;
      }
      if (n.type === "radio" && n.radio) {
        if (r) return !1;
        if (n.radio.options && n.radio.options.length > 0) {
          const h = this.getClickedRadioOption(t, e, n.radio.options);
          return h && !h.disabled ? (o.data[N(s)] = h.value, this.eventEmitter.emit(
            R.RADIO_CHANGE,
            this.getCellInfo(t),
            h.value
          ), !0) : !1;
        } else
          return o.data[N(s)] = n.radio.value, this.eventEmitter.emit(
            R.RADIO_CHANGE,
            this.getCellInfo(t),
            n.radio.value
          ), !0;
      }
      if (n.type === "button" && n.button) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, x = n.button.size === "small" ? 24 : n.button.size === "large" ? 40 : 32, w = (h.height - x) / 2, y = n.button.text ?? "Button", b = 13;
        this.ctx.font = `${b}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const v = this.ctx.measureText(y).width, M = Math.min(
          Math.max(v + 16 * 2, 60),
          h.width - 8 * 2
        ), T = (h.width - M) / 2;
        return p >= w && p <= w + x && m >= T && m <= T + M ? (this.eventEmitter.emit(
          R.BUTTON_CLICK,
          this.getCellInfo(t),
          n.button.actionKey
        ), !0) : !1;
      }
      if (n.type === "buttons" && n.buttons) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, x = 8, w = n.buttons.gap ?? 4, y = n.buttons.maxVisible ?? 3, b = 24, v = (h.height - b) / 2, I = n.buttons.buttons.filter((S) => S.visible !== !1), E = I.slice(0, y), M = I.slice(y);
        let T = x;
        for (let S = 0; S < E.length; S++) {
          const H = E[S], k = H.text ?? "Button";
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const O = this.ctx.measureText(k).width, P = Math.max(O + 16, 40);
          if (p >= v && p <= v + b && m >= T && m <= T + P)
            return this.eventEmitter.emit(R.BUTTON_CLICK, this.getCellInfo(t), H.actionKey), !0;
          T += P + w;
        }
        if (M.length > 0) {
          const S = n.buttons.moreButtonText ?? "···";
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const H = this.ctx.measureText(S).width, k = Math.max(H + 16, 32);
          if (p >= v && p <= v + b && m >= T && m <= T + k) {
            const O = f + T, P = q.DROPDOWN_ITEM_HEIGHT, L = M.length * P, W = this.canvas.getBoundingClientRect();
            let B = g + v + b + 4, A = !1;
            return B + L > W.height && (B = g + v - L - 4, A = !0), this.state.buttonsDropdown = {
              cell: t,
              x: O,
              y: B,
              buttons: M,
              hoveredIndex: -1,
              buttonRelativeX: T,
              buttonY: v,
              buttonHeight: b,
              showAbove: A
            }, this.eventEmitter.emit(R.DROPDOWN_OPEN), !0;
          }
        }
        return !1;
      }
      if (n.type === "switch" && n.switch) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, x = 44, w = 22, y = (h.width - x) / 2, b = (h.height - w) / 2;
        if (!(m >= y && m <= y + x && p >= b && p <= b + w)) return !1;
        const I = `${t.rowIndex}-${t.columnIndex}`, E = this.state.switchAnimations.get(I), M = n.switch.checked ?? !1, T = E ? E.progress : M ? 1 : 0, S = T < 0.5 ? 1 : 0, H = S === 1;
        return M !== H && (o.data[N(s)] = H, this.eventEmitter.emit(R.SWITCH_CHANGE, this.getCellInfo(t), H)), this.state.switchAnimations.set(I, {
          cell: t,
          progress: T,
          targetProgress: S,
          startTime: Date.now(),
          startProgress: T
        }), this.startSwitchAnimationLoop(), !0;
      }
      if (n.type === "input" && n.input)
        return r || n.input.readonly, !1;
      if (n.type === "link" && n.link) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, s), g = this.getCellViewportY(t.rowIndex), m = d - f, p = u - g, x = n.link, w = x.link, y = x.text || x.link;
        if (!w || !y) return !1;
        const b = 8, v = 13;
        this.ctx.font = `${v}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const I = h.width - b * 2;
        let E = this.ctx.measureText(y).width, M = y;
        if (E > I) {
          const L = "...";
          for (; M.length > 0 && this.ctx.measureText(M + L).width > I; )
            M = M.slice(0, -1);
          M += L, E = this.ctx.measureText(M).width;
        }
        const T = s.align ?? "left";
        let S;
        switch (T) {
          case "center":
            S = (h.width - E) / 2;
            break;
          case "right":
            S = h.width - b - E;
            break;
          default:
            S = b;
        }
        const H = (h.height - v) / 2;
        if (!(m >= S && m <= S + E && p >= H && p <= H + v)) return !1;
        const O = Date.now(), P = ((a = this._lastClickCell) == null ? void 0 : a.rowIndex) === t.rowIndex && ((l = this._lastClickCell) == null ? void 0 : l.columnIndex) === t.columnIndex && O - this._lastClickTime < 350;
        return this._lastClickTime = O, this._lastClickCell = { rowIndex: t.rowIndex, columnIndex: t.columnIndex }, P ? !1 : (window.open(w, "_blank", "noopener,noreferrer"), !0);
      }
      if (n.type === "progress" && n.progress) {
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
      if (n.type === "rating" && n.rating)
        return this.handleRatingClick(t, e, n.rating, s, o);
      if (n.type === "color" && n.color) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, s), d = this.getCellViewportY(t.rowIndex), u = this.canvas.getBoundingClientRect(), f = e.clientX - u.left, g = e.clientY - u.top, p = Math.min(h.height - 8 * 2, 24), x = c + (h.width - p) / 2, w = d + (h.height - p) / 2;
        return f >= x && f <= x + p && g >= w && g <= w + p ? (this.startColorEditing(t, n.color), !0) : !1;
      }
      if (n.type === "image" && n.image) {
        if (n.image.clickable === !1) return !1;
        const h = n.image, c = h.images, d = this.canvas.getBoundingClientRect(), u = e.clientX - d.left, f = e.clientY - d.top, g = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), m = this.getCellViewportX(g, s), p = this.getCellViewportY(t.rowIndex), x = u - m, w = f - p, y = 4, b = Math.min(g.width, g.height) - y * 2, v = h.width ?? 32, I = h.height ?? 32, E = Math.min(v, b), M = Math.min(I, b), T = h.gap ?? 4;
        if (c && c.length > 1) {
          const P = h.maxVisible ?? 3, L = h.showMoreCount !== !1, W = g.width - y * 2, B = Math.floor((W + T) / (E + T)), V = Math.max(1, B - (L ? 1 : 0)), Y = Math.min(P, V), _ = c.length > Y ? Y : c.length, F = c.length > Y;
          let U;
          F && L ? U = _ * E + _ * T + E : U = _ * E + Math.max(0, _ - 1) * T;
          let G = (g.width - U) / 2;
          G = Math.max(y, G);
          const $ = (g.height - M) / 2, Q = x - G, tt = w - $;
          if (Q < 0 || Q > U || tt < 0 || tt > M)
            return !1;
          const X = Math.floor(Q / (E + T));
          if (F && L && X === _)
            return !1;
          if (X >= 0 && X < c.length) {
            const K = c[X];
            if (K)
              return this.eventEmitter.emit(R.IMAGE_CLICK, this.getCellInfo(t), K, e), !0;
          }
          return !1;
        }
        const S = (g.width - E) / 2, H = (g.height - M) / 2;
        if (!(x >= S && x <= S + E && w >= H && w <= H + M)) return !1;
        const O = h.src || c && c[0];
        return O ? (this.eventEmitter.emit(R.IMAGE_CLICK, this.getCellInfo(t), O, e), !0) : !1;
      }
      return !1;
    });
    C(this, "handleProgressClick", (t, e, i, s, o) => this.controlClickHandler.handleProgressClick(t, e, i, s, o));
    C(this, "handleProgressDragMove", (t) => {
      const e = this.state.progressDragState;
      if (!e) return;
      const { cell: i, config: s, column: o } = e, n = this.canvas.getBoundingClientRect(), r = t.clientX - n.left, a = this.layoutManager.getCellPosition(i.rowIndex, i.columnIndex), l = this.getCellViewportX(a, o), h = s.shape ?? "line";
      if (h === "line") {
        const d = s.textPosition ?? "right", f = (s.showText ?? !0) && d === "right" ? 40 : 0, g = s.width ?? a.width - 8 * 2 - f, m = l + 8, p = r - m, x = s.precision ?? 0, w = Math.max(0, Math.min(100, p / g * 100)), y = x === 0 ? Math.round(w) : Number(w.toFixed(x));
        e.displayValue = y, this.eventEmitter.emit(R.PROGRESS_DRAG);
      } else if (h === "circle" || h === "dashboard") {
        const c = t.clientY - n.top, d = this.getCellViewportY(i.rowIndex);
        let u = 0;
        h === "dashboard" && (u = a.height * 0.05);
        const f = l + a.width / 2, g = d + a.height / 2 + u, m = r - f, p = c - g;
        let x = Math.atan2(p, m), w;
        if (h === "circle")
          x = x + Math.PI / 2, x < 0 && (x += Math.PI * 2), w = x / (Math.PI * 2) * 100;
        else {
          const b = Math.PI * 0.75, v = Math.PI * 1.5;
          x < 0 && (x += Math.PI * 2);
          let I = x - b;
          I < 0 && (I += Math.PI * 2), w = I / v * 100;
        }
        w = Math.max(0, Math.min(100, w));
        const y = s.precision ?? 0;
        w = y === 0 ? Math.round(w) : Number(w.toFixed(y)), e.displayValue = w, this.eventEmitter.emit(R.PROGRESS_DRAG);
      }
    });
    C(this, "handleRatingClick", (t, e, i, s, o) => this.controlClickHandler.handleRatingClick(t, e, i, s, o));
    C(this, "handleExpandIconClick", (t, e, i) => this.controlClickHandler.handleExpandIconClick(t, e, i));
    C(this, "getClickedRadioOption", (t, e, i) => this.controlClickHandler.getClickedRadioOption(t, e, i));
    C(this, "handleWheel", (t) => {
      var r;
      const e = t.target;
      if (e.tagName === "TEXTAREA" || e.tagName === "INPUT") {
        const a = e, l = a.scrollHeight > a.clientHeight, h = a.scrollWidth > a.clientWidth;
        if (l || h)
          return;
      }
      if (this.state.imageTooltip) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g } = this.state.imageTooltip, m = q.IMAGE_SIZE, p = 8, x = 8, w = 4, v = w * m + (w - 1) * x + p * 2 + 4 + 4, I = m + x, E = f * I + p * 2 - x;
        if (l >= c && l <= c + v && h >= d && h <= d + E) {
          const T = Math.ceil(u.length / w), S = Math.max(0, (T - f) * I), H = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (S > 0 && H) {
            const O = g <= 0.5 && t.deltaY < 0, P = g >= S - 0.5 && t.deltaY > 0;
            if (!O && !P) {
              this.state.imageTooltip.scrollTop = Z(g + t.deltaY, 0, S), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(R.IMAGE_TOOLTIP_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageTooltipPosition();
      }
      if (this.state.imageEditor) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g, pendingImages: m } = this.state.imageEditor, p = q.IMAGE_SIZE, x = 8, w = 8, y = 4, b = 60, v = p + w, I = y * p + (y - 1) * w + x * 2 + 4 + 4, E = f * v + x * 2 - w, M = b + E;
        if (l >= c && l <= c + I && h >= d && h <= d + M) {
          const S = u.length + m.length, H = Math.ceil(S / y), k = Math.max(0, (H - f) * v), O = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (k > 0 && O) {
            const L = g <= 0.5 && t.deltaY < 0, W = g >= k - 0.5 && t.deltaY > 0;
            if (!L && !W) {
              this.state.imageEditor.scrollTop = Z(g + t.deltaY, 0, k), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(R.IMAGE_EDITOR_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageEditorPosition();
      }
      if (this.state.filterDropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, mode: f, options: g, scrollTop: m } = this.state.filterDropdown;
        if (f === "select" && g) {
          const x = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE, y = Math.min(g.length, w), b = 32, v = 4, I = y * x, E = 8 + b + v + I + v + 36;
          if (l >= c && l <= c + u && h >= d && h <= d + E) {
            const T = Math.abs(t.deltaY) >= Math.abs(t.deltaX), S = Math.max(0, g.length * x - I);
            if (S > 0 && T) {
              const k = m <= 0.5 && t.deltaY < 0, O = m >= S - 0.5 && t.deltaY > 0;
              if (!k && !O) {
                this.state.filterDropdown.scrollTop = Z(m + t.deltaY, 0, S), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
                return;
              }
            }
          }
        }
        this.dropdownHandler.updateFilterDropdownPosition();
      }
      if (this.state.dropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, type: f, tagsConfig: g, config: m, scrollTop: p } = this.state.dropdown, x = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE;
        let y;
        f === "tags" && g ? y = ((r = g.options) == null ? void 0 : r.length) ?? 0 : y = m.options.length;
        const v = Math.min(y, w) * x;
        if (l >= c && l <= c + u && h >= d && h <= d + v) {
          const E = Math.abs(t.deltaY) >= Math.abs(t.deltaX), M = Math.max(0, y * x - v);
          if (M > 0 && E) {
            const S = p ?? 0, H = S <= 0.5 && t.deltaY < 0, k = S >= M - 0.5 && t.deltaY > 0;
            if (!H && !k) {
              this.state.dropdown.scrollTop = Z(S + t.deltaY, 0, M), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(R.DROPDOWN_HOVER);
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
      (o !== this.scrollState.scrollLeft || n !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = o, this.scrollState.scrollTop = n, this.scrollState.isScrolling = !0, this.eventEmitter.emit(R.SCROLL, o, n), this.checkLazyLoad(n, s), clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = !1;
      }, 150));
    });
    C(this, "updateTooltipPosition", () => {
      this.tooltipHandler.updateTooltipPosition();
    });
    C(this, "scrollTimeout", setTimeout(() => {
    }, 0));
    C(this, "handleKeyDown", (t) => {
      if (this.state.editingCell) {
        this.handleEditingKeyDown(t);
        return;
      }
      if (this.state.dropdown) {
        t.key === "Escape" && (this.state.dropdown = null, this.eventEmitter.emit(R.DROPDOWN_CLOSE));
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
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.eventEmitter.emit(R.UNDO));
          break;
        case "y":
        case "Y":
          (t.ctrlKey || t.metaKey) && (t.preventDefault(), this.eventEmitter.emit(R.REDO));
          break;
        case " ":
          if (this.state.selectedCells.length > 0) {
            const e = this.state.selectedCells[0].start;
            this.toggleRowExpand(e.rowIndex);
          }
          break;
      }
    });
    C(this, "startSwitchAnimationLoop", () => {
      this.buttonAnimationHandler.startSwitchAnimationLoop();
    });
    C(this, "getSwitchAnimations", () => this.buttonAnimationHandler.getSwitchAnimations());
    this.canvas = t, this.ctx = t.getContext("2d"), this.layoutManager = e, this.dataManager = i, this.eventEmitter = s, this.editingConfig = n, this.state = {
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
      expandColumnKey: this.expandColumnKey
    };
    this.editingHandler = new It(t, this.eventEmitter, this.editingConfig), this.dropdownHandler = new Et(t, this.eventEmitter), this.selectionHandler = new Ne(t, this.eventEmitter), this.navigationHandler = new ze(
      t,
      this.eventEmitter,
      this.selectionHandler,
      this.editingConfig
    ), this.contextMenuHandler = new St(t, this.eventEmitter), this.imageHandler = new Mt(t, this.eventEmitter), this.headerHandler = new Ve(
      t,
      this.eventEmitter,
      this.sortConfig,
      this.filterConfig
    ), this.controlClickHandler = new Ye(t, this.eventEmitter), this.buttonAnimationHandler = new Xe(t, this.eventEmitter), this.tooltipHandler = new Ge(t, this.eventEmitter);
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
      i.data[N(e)],
      i,
      e,
      this.state.imageEditor.cell.rowIndex
    ) : { image: i.data[N(e)] }).image ?? {}, n = document.createElement("input");
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
    if (this.state.buttonHoverStates.forEach((M, T) => {
      T !== s && M.progress > 0 && this.state.buttonHoverStates.set(T, {
        ...M,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: M.progress
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
    const a = nt(n, r, t.rowIndex);
    if (a.type !== "button" || !a.button || et(n.disabled, r, n)) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const l = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), h = this.getCellViewportX(l, n), c = this.getCellViewportY(t.rowIndex), d = e - h, u = i - c, f = a.button.size === "small" ? 24 : a.button.size === "large" ? 40 : 32, g = (l.height - f) / 2, m = a.button.text ?? "Button", p = 13;
    this.ctx.font = `${p}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const x = this.ctx.measureText(m).width, b = Math.min(
      Math.max(x + 16 * 2, 60),
      l.width - 8 * 2
    ), v = (l.width - b) / 2, I = u >= g && u <= g + f && d >= v && d <= v + b, E = `${t.rowIndex}-${t.columnIndex}`;
    if (I) {
      const M = this.state.buttonHoverStates.get(E);
      if (!M || M.targetProgress !== 1) {
        const T = M ? M.progress : 0;
        this.state.buttonHoverStates.set(E, {
          cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
          progress: T,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: T
        }), this.startButtonHoverAnimationLoop();
      }
    } else {
      const M = this.state.buttonHoverStates.get(E);
      M && M.progress > 0 && (this.state.buttonHoverStates.set(E, {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        progress: M.progress,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: M.progress
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
    const r = nt(o, n, t.rowIndex);
    if (r.type !== "image" || !r.image) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    const a = r.image, l = a.images, h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, o), d = this.getCellViewportY(t.rowIndex), u = e - c, f = i - d, g = 4, m = Math.min(h.width, h.height) - g * 2, p = a.width ?? 32, x = a.height ?? 32, w = Math.min(p, m), y = Math.min(x, m), b = a.gap ?? 4;
    if (!l || l.length <= 1) {
      const B = (h.width - w) / 2, A = (h.height - y) / 2, V = u >= B && u <= B + w && f >= A && f <= A + y;
      this.state.hoveredImageIndex = V && a.hoverable !== !1 ? 0 : -1;
      return;
    }
    const v = h.width - g * 2, I = a.showMoreCount !== !1, E = a.maxVisible;
    let M;
    if (l.length === 1)
      M = 1;
    else {
      const B = Math.floor((v + b) / (w + b));
      M = Math.max(1, B - (I ? 1 : 0));
    }
    const T = E !== void 0 ? Math.min(E, M) : M, S = l.length > T, H = S ? T : l.length;
    let k;
    S && I ? k = H * w + H * b + w : k = H * w + Math.max(0, H - 1) * b;
    let O = c + (h.width - k) / 2;
    O = Math.max(c + g, O);
    const P = d + (h.height - y) / 2, L = e - O, W = i - P;
    if (W < 0 || W > y) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    for (let B = 0; B < H; B++) {
      const A = B * (w + b), V = A + w;
      if (L >= A && L < V) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? B : -1;
        return;
      }
    }
    if (S && I) {
      const B = H * (w + b), A = B + w;
      if (L >= B && L < A) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? H : -1;
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
    const r = nt(o, n, t.rowIndex);
    if (r.type !== "buttons" || !r.buttons) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    const a = r.buttons, l = a.buttons.filter((I) => I.visible !== !1), h = a.maxVisible ?? 3, c = a.gap ?? 4, d = 8, u = 24, f = l.slice(0, h), g = l.slice(h), m = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), p = this.getCellViewportX(m, o), w = this.getCellViewportY(t.rowIndex) + (m.height - u) / 2, y = i - w;
    if (y < 0 || y > u) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    let b = p + d;
    const v = 13;
    this.ctx.font = `${v}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    for (let I = 0; I < f.length; I++) {
      const M = f[I].text ?? "Button", T = this.ctx.measureText(M).width, S = Math.max(T + 16, 40);
      if (e >= b && e < b + S) {
        this.state.hoveredButtonIndex = I;
        return;
      }
      b += S + c;
    }
    if (g.length > 0) {
      const I = a.moreButtonText ?? "···", E = this.ctx.measureText(I).width, M = Math.max(E + 16, 32);
      if (e >= b && e < b + M) {
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
    const r = nt(o, n, t.rowIndex), a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), l = et(o.disabled, n, o), h = this.getCellViewportX(a, o), c = this.getCellViewportY(t.rowIndex), d = e - h, u = i - c;
    if (r.type === "checkbox" && r.checkbox) {
      if (l) return !1;
      const f = 16, g = (a.width - f) / 2, m = (a.height - f) / 2;
      return d >= g && d <= g + f && u >= m && u <= m + f;
    }
    if (r.type === "radio" && r.radio) {
      if (l) return !1;
      const f = 16;
      if (r.radio.options && r.radio.options.length > 0) {
        const p = a.width - 8;
        this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        let x = 8;
        for (let w = 0; w < r.radio.options.length; w++) {
          const y = r.radio.options[w];
          if (y.disabled) {
            const k = this.ctx.measureText(y.label).width;
            x += f + 4 + k + 8;
            continue;
          }
          const b = this.ctx.measureText(y.label).width, v = f + 4 + b + 8;
          if (x + v - 8 > p)
            break;
          const I = x, E = (a.height - f) / 2, M = E + f / 2, T = d >= I && d <= I + f && u >= E && u <= E + f, S = I + f + 4, H = d >= S && d <= S + b && u >= M - 10 && u <= M + 10;
          if (T || H)
            return !0;
          x += v;
        }
        return !1;
      } else {
        const g = (a.width - f) / 2, m = (a.height - f) / 2;
        return d >= g && d <= g + f && u >= m && u <= m + f;
      }
    }
    if (r.type === "button" && r.button) {
      if (l) return !1;
      const f = r.button.size === "small" ? 24 : r.button.size === "large" ? 40 : 32, g = (a.height - f) / 2, m = 8;
      return u >= g && u <= g + f && d >= m && d <= a.width - m;
    }
    if (r.type === "buttons" && r.buttons) {
      const g = r.buttons.gap ?? 4, m = r.buttons.maxVisible ?? 3, p = 24, x = (a.height - p) / 2, w = r.buttons.buttons.filter((v) => v.visible !== !1), y = w.slice(0, m);
      let b = 8;
      for (const v of y) {
        const I = v.text ?? "Button";
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const E = this.ctx.measureText(I).width, M = Math.max(E + 16, 40);
        if (u >= x && u <= x + p && d >= b && d <= b + M)
          return !0;
        b += M + g;
      }
      if (w.length > m) {
        const v = r.buttons.moreButtonText ?? "···";
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const I = this.ctx.measureText(v).width, E = Math.max(I + 16, 32);
        if (u >= x && u <= x + p && d >= b && d <= b + E)
          return !0;
      }
      return !1;
    }
    if (r.type === "switch" && r.switch) {
      if (l) return !1;
      const f = 44, g = 22, m = (a.width - f) / 2, p = (a.height - g) / 2;
      return d >= m && d <= m + f && u >= p && u <= p + g;
    }
    if (r.type === "select" && r.select)
      return !l;
    if (r.type === "tag" && r.tags)
      return !0;
    if (r.type === "input" && r.input)
      return !(l || r.input.readonly);
    if (r.type === "link" && r.link) {
      const f = r.link, g = f.text || f.link;
      if (!g) return !1;
      const m = 8, p = 13;
      this.ctx.font = `${p}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      const x = a.width - m * 2;
      let w = this.ctx.measureText(g).width, y = g;
      if (w > x) {
        const E = "...";
        for (; y.length > 0 && this.ctx.measureText(y + E).width > x; )
          y = y.slice(0, -1);
        y += E, w = this.ctx.measureText(y).width;
      }
      const b = o.align ?? "left";
      let v;
      switch (b) {
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
    if (r.type === "image" && r.image) {
      const f = r.image;
      if (f.clickable === !1) return !1;
      const g = f.images;
      if (!g || g.length <= 1)
        return !!(f.src || g && g[0]);
      const m = this.state.hoveredImageIndex ?? -1;
      return m >= 0 && m < g.length;
    }
    if (r.type === "progress" && r.progress) {
      const f = r.progress;
      if (f.interactive !== !0 || l) return !1;
      const g = f.shape ?? "line";
      if (g === "line") {
        const p = f.size ?? "medium", x = f.height ?? (p === "small" ? 6 : p === "large" ? 16 : 10), w = f.textPosition ?? "right", b = (f.showText ?? !0) && w === "right" ? 40 : 0, v = f.width ?? a.width - 8 * 2 - b, I = 8, E = (a.height - x) / 2;
        return d >= I && d <= I + v && u >= E && u <= E + x;
      }
      if (g === "circle" || g === "dashboard") {
        const m = f.size ?? "medium";
        let p, x = 0;
        g === "circle" ? p = m === "small" ? 0.6 : m === "large" ? 0.9 : 0.75 : (p = m === "small" ? 0.7 : m === "large" ? 0.95 : 0.85, x = a.height * 0.05);
        const w = Math.floor(a.height * p), y = f.width ?? w, b = f.strokeWidth ?? Math.max(2, Math.round(y * 0.12)), v = a.width / 2, I = a.height / 2 + x, E = (y - b) / 2, M = d - v, T = u - I, S = Math.sqrt(M * M + T * T);
        return S >= E - b && S <= E + b;
      }
    }
    if (r.type === "rating" && r.rating) {
      if (l) return !1;
      const f = r.rating, g = f.max ?? 5, m = f.starSize ?? 16, p = g * m, x = (a.width - p) / 2, w = (a.height - m) / 2;
      return d >= x && d <= x + p && u >= w && u <= w + m;
    }
    if (r.type === "color" && r.color) {
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
    Math.ceil(l / h) <= this.lazyLoadThreshold && (this.isLoadingMore = !0, this.eventEmitter.emit(R.LOAD_MORE, {
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
    (i !== this.scrollState.scrollLeft || s !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = s, this.scrollState.isScrolling = !0, this.eventEmitter.emit(R.SCROLL, i, s), clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrollState.isScrolling = !1;
    }, 150));
  }
  handleEditingKeyDown(t) {
    if (this.state.editingCell)
      switch (t.key) {
        case "Enter":
          this.endEditing(!0);
          break;
        case "Escape":
          this.endEditing(!1);
          break;
        case "Tab":
          t.preventDefault(), this.endEditing(!0);
          const e = t.shiftKey ? -1 : 1;
          this.selectionHandler.moveSelection(0, e);
          break;
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
        const r = nt(o, n, e.rowIndex), a = [
          "checkbox",
          "radio",
          "button",
          "buttons",
          "switch",
          "rating",
          "progress"
        ];
        if (r.type && a.includes(r.type)) {
          if (r.type === "switch" && r.switch) {
            et(o.disabled, n, o) || (n.data[N(o)] = !r.switch.checked, this.eventEmitter.emit(
              R.SWITCH_CHANGE,
              this.getCellInfo(e),
              !r.switch.checked
            ));
            return;
          }
          this.toggleRowExpand(e.rowIndex);
          return;
        }
        if (o.editable === !1 || et(o.disabled, n, o) || (i = r.input) != null && i.readonly) return;
        const l = this.getEditConfig(o, n, e.rowIndex);
        if (l) {
          if (l.type === "select" && l.select) {
            this.startSelectEditing(e, l.select);
            return;
          }
          if (l.type === "tag" && l.tags) {
            this.startTagsEditing(e, l.tags);
            return;
          }
          if (l.type === "date" && l.date) {
            this.startDateEditing(e, l.date);
            return;
          }
          if (l.type === "color" && l.color) {
            this.startColorEditing(e, l.color);
            return;
          }
          this.startEditing(e, l.input);
          return;
        }
        if (r.type === "select" && r.select) {
          this.startSelectEditing(e, r.select);
          return;
        }
        if (r.type === "tag" && r.tags && r.tags.editable) {
          this.startTagsEditing(e, r.tags);
          return;
        }
        if (r.type === "date" && r.date) {
          this.startDateEditing(e, r.date);
          return;
        }
        if (r.type === "color" && r.color) {
          this.startColorEditing(e, r.color);
          return;
        }
        if (r.type === "image" && r.image) {
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
    const s = e.data[N(t)];
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
        if (o && o.type && o.type !== "custom" && o.type !== "button" && o.type !== "buttons" && o.type !== "image" && o.type !== "progress" && o.type !== "link")
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
    !e || !e.children || (e.expanded = !e.expanded, this.eventEmitter.emit(R.EXPAND, e, t, e.expanded));
  }
  clearSelection() {
    this.selectionHandler.clearSelection();
  }
  resetState() {
    this.state.selectedCells = [], this.state.editingCell = null, this.state.editingValue = null, this.state.hoveredCell = null, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.state.dragTarget = null, this.state.tooltip = null, this.closeAllDropdowns(), this.sortConfig = [], this.filterConfig = [], this.state.switchAnimations.clear(), this.state.buttonHoverStates.clear(), this.eventEmitter.emit(R.SELECTION_CHANGE, []);
  }
  // ==================== Dropdown 公共方法 ====================
  /** 关闭 select/tags dropdown */
  closeDropdown() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(R.DROPDOWN_CLOSE));
  }
  /** 关闭 filter dropdown */
  closeFilterDropdown() {
    this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_CLOSE));
  }
  /** 关闭 date dropdown */
  closeDateDropdown() {
    this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(R.DATE_DROPDOWN_CLOSE));
  }
  /** 关闭 color dropdown */
  closeColorDropdown() {
    this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(R.COLOR_DROPDOWN_CLOSE));
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
          const u = Vt(c, d, a);
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
      R.SCROLL,
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
    }), this.eventEmitter.emit(R.FILTER_CHANGE, [...this.filterConfig]), this.state.filterDropdown = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_CLOSE);
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
    e >= 0 && this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.eventEmitter.emit(R.FILTER_CHANGE, [...this.filterConfig]), this.state.filterDropdown = null, this.eventEmitter.emit(R.FILTER_DROPDOWN_CLOSE);
  }
  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.filterConfig.findIndex((i) => i.column === t);
    e >= 0 && (this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.dataManager.filter(this.filterConfig), this.eventEmitter.emit(R.FILTER_CHANGE, [...this.filterConfig])), this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
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
        const r = ne(o, n, t);
        this.state.filterDropdown.options = r.map((a) => ({
          label: a.label,
          value: a.value,
          checked: !1
        })), this.state.filterDropdown.isLoading = !1;
      } else {
        const r = Yt(o, n, 0);
        r.length === 0 && n.length > 0 ? (this.state.filterDropdown.isLoading = !0, this.state.filterDropdown.options = void 0) : (this.state.filterDropdown.options = r.map((a) => ({
          label: a.label,
          value: a.value,
          checked: !1
        })), this.state.filterDropdown.isLoading = !1);
      }
      this.state.filterDropdown.scrollTop = 0, this.state.filterDropdown.hoveredIndex = -1, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN);
    } else e === "search" && (this.state.filterDropdown.searchValue = t, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(t, e) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "range" || (this.state.filterDropdown.minValue = t, this.state.filterDropdown.maxValue = e, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(t) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "boolean" || (this.state.filterDropdown.boolValue = t, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN));
  }
  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(t, e) {
    !this.state.filterDropdown || this.state.filterDropdown.mode !== "dateRange" || (this.state.filterDropdown.startDate = t, this.state.filterDropdown.endDate = e, this.eventEmitter.emit(R.FILTER_DROPDOWN_OPEN));
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
    })), this.eventEmitter.emit(R.SELECTION_CHANGE, [...this.state.selectedCells]);
  }
  updateConfig(t, e) {
    this.editingConfig = e;
  }
  setRowHeightResizeEnabled(t) {
    this.rowHeightResizeEnabled = t;
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
  isRowPinnable(t) {
    return typeof this.rowPinnable == "function" ? this.rowPinnable(t) : this.rowPinnable;
  }
  getRowContextMenuItems(t) {
    const e = [], i = this.layoutManager.getRowPinPosition(t);
    return this.enableRowPinning && this.isRowPinnable(t) && (i !== "top" && e.push({ key: "pin-top", text: "固定到顶部" }), i !== "bottom" && e.push({ key: "pin-bottom", text: "固定到底部" }), i && e.push({ key: "unpin", text: "取消固定" })), e.push(
      { key: "add-above", text: "上方添加行" },
      { key: "add-below", text: "下方添加行" },
      { key: "delete", text: "删除行", danger: !0 }
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
    this.isDestroyed = !0, this.unbindEvents(), this.unbindDocumentEvents(), this.buttonAnimationHandler.setDestroyed(!0), this.buttonAnimationHandler.clearAllAnimations();
  }
};
// 下拉菜单常量
C(q, "DROPDOWN_ITEM_HEIGHT", 32), C(q, "DROPDOWN_MAX_VISIBLE", 8), // 图片编辑器常量 (用于 ImageHandler 和其他图片相关操作)
C(q, "IMAGE_SIZE", 64), C(q, "IMAGE_PADDING", 8), C(q, "IMAGE_GAP", 8), C(q, "IMAGES_PER_ROW", 4), C(q, "IMAGE_UPLOAD_AREA_HEIGHT", 60), C(q, "IMAGE_MAX_ROWS", 3);
let Tt = q;
class $e {
  constructor(t, e, i, s, o, n) {
    C(this, "wrapper");
    C(this, "layoutManager");
    C(this, "eventEmitter");
    C(this, "theme");
    C(this, "getRows");
    C(this, "inputElement", null);
    C(this, "editingCell", null);
    C(this, "scrollLeft", 0);
    C(this, "scrollTop", 0);
    C(this, "onScrollCallback", null);
    C(this, "wheelHandler", null);
    C(this, "placeholderStyle", null);
    C(this, "scrollbarStyle", null);
    C(this, "handleBlur", () => {
      this.endEditing(!0);
    });
    C(this, "handleKeyDown", (t) => {
      var s;
      const e = t, i = ((s = this.inputElement) == null ? void 0 : s.tagName) === "TEXTAREA";
      e.key === "Enter" && !i ? (e.preventDefault(), this.endEditing(!0)) : e.key === "Enter" && i && (e.ctrlKey || e.metaKey) ? (e.preventDefault(), this.endEditing(!0)) : e.key === "Escape" ? (e.preventDefault(), this.endEditing(!1)) : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && t.stopPropagation();
    });
    C(this, "handleInputWheel", (t) => {
      const e = t;
      e.preventDefault(), this.onScrollCallback && this.onScrollCallback(e.deltaX, e.deltaY);
    });
    this.wrapper = t, this.layoutManager = i, this.eventEmitter = s, this.theme = o, this.getRows = n;
  }
  setOnScrollCallback(t) {
    this.onScrollCallback = t;
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
  startEditing(t, e) {
    this.inputElement && this.endEditing(!0);
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.getRows()[t.rowIndex];
    if (!s || !n) return;
    this.editingCell = t;
    const r = this.layoutManager.getCellMerge(t.rowIndex, t.columnIndex);
    let a;
    const l = r ? r.rowIndex : t.rowIndex;
    r ? a = this.layoutManager.getMergedCellPosition(r.rowIndex, r.columnIndex) : a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let h;
    s.fixed === "left" || s.fixed === "right" ? h = a.x : h = a.x - this.scrollLeft;
    const c = this.layoutManager.getCellViewportY(l, this.scrollTop), d = h - 1, u = c - 1, f = a.width + 2, g = 14 * 1.5, m = 8;
    if ((e == null ? void 0 : e.multiline) ?? !1) {
      const x = Math.max(1, Math.floor((a.height - m * 2) / g)), w = Math.min((e == null ? void 0 : e.maxRows) ?? x, x), y = g * w + m * 2, b = Math.min(a.height + 2, y + 2);
      this.inputElement = document.createElement("textarea");
      const v = String(n.data[N(s)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : v, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = et(s.disabled, n, s), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
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
        max-height: ${y}px;
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
      const E = document.createElement("style");
      E.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `, document.head.appendChild(E), this.placeholderStyle = E, this.wrapper.appendChild(this.inputElement);
      const M = () => {
        if (!this.inputElement) return;
        const T = this.inputElement, S = T.scrollTop;
        T.style.height = "auto";
        const H = T.scrollHeight, O = Math.max(b, Math.min(H, y));
        T.style.height = `${O}px`, T.scrollTop = S;
      };
      this.inputElement.addEventListener("input", M), requestAnimationFrame(() => {
        M();
      }), this.wheelHandler = (T) => {
        if (this.inputElement && T.target === this.inputElement) {
          const S = this.inputElement, H = S.scrollTop === 0, k = S.scrollTop + S.clientHeight >= S.scrollHeight - 1, O = T.deltaY < 0, P = T.deltaY > 0;
          (H && O || k && P) && T.preventDefault(), T.stopPropagation();
        }
      }, document.addEventListener("wheel", this.wheelHandler, { capture: !0, passive: !1 }), M();
    } else {
      const x = a.height + 2;
      this.inputElement = document.createElement("input"), this.inputElement.type = (e == null ? void 0 : e.type) ?? "text";
      const w = String(n.data[N(s)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : w, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = et(s.disabled, n, s), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${d}px;
        top: ${u}px;
        width: ${f}px;
        height: ${x}px;
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
      const y = document.createElement("style");
      y.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `, document.head.appendChild(y), this.placeholderStyle = y, this.wrapper.appendChild(this.inputElement);
    }
    this.inputElement.addEventListener("blur", this.handleBlur), this.inputElement.addEventListener("keydown", this.handleKeyDown), this.inputElement.addEventListener("wheel", this.handleInputWheel, { passive: !1 }), requestAnimationFrame(() => {
      this.inputElement && (this.inputElement.focus(), this.inputElement.select());
    });
  }
  endEditing(t) {
    const e = this.editingCell;
    let i = null;
    this.inputElement && (i = this.inputElement.value, this.destroyInputElement()), t && e && this.eventEmitter.emit("editEnd", this.getCellInfo(e), i), this.editingCell = null;
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
      ), s = i ? i.rowIndex : this.editingCell.rowIndex, o = i ? this.layoutManager.getMergedCellPosition(i.rowIndex, i.columnIndex) : this.layoutManager.getCellPosition(this.editingCell.rowIndex, this.editingCell.columnIndex);
      let n;
      e.fixed === "left" || e.fixed === "right" ? n = o.x : n = o.x - this.scrollLeft;
      const r = this.layoutManager.getCellViewportY(s, this.scrollTop);
      this.inputElement.style.left = `${n - 1}px`, this.inputElement.style.top = `${r - 1}px`;
    }
  }
  destroyInputElement() {
    this.inputElement && (this.inputElement.removeEventListener("blur", this.handleBlur), this.inputElement.removeEventListener("keydown", this.handleKeyDown), this.inputElement.removeEventListener("wheel", this.handleInputWheel), this.inputElement.remove(), this.inputElement = null), this.wheelHandler && (document.removeEventListener("wheel", this.wheelHandler, { capture: !0 }), this.wheelHandler = null), this.placeholderStyle && (this.placeholderStyle.remove(), this.placeholderStyle = null), this.scrollbarStyle && (this.scrollbarStyle.remove(), this.scrollbarStyle = null);
  }
  destroy() {
    this.destroyInputElement(), this.editingCell = null;
  }
}
class Ue {
  constructor(t, e, i) {
    C(this, "wrapper");
    C(this, "eventEmitter");
    C(this, "theme");
    // 输入元素
    C(this, "searchInput", null);
    C(this, "minInput", null);
    C(this, "maxInput", null);
    C(this, "currentMode", null);
    C(this, "currentColumnKey", null);
    C(this, "onInputChange", null);
    // 标记是否正在从外部更新，避免触发 input 事件导致循环
    C(this, "isUpdatingFromExternal", !1);
    this.wrapper = t, this.eventEmitter = e, this.theme = i;
  }
  setTheme(t) {
    this.theme = t;
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
    this.searchInput = document.createElement("input"), this.searchInput.type = "text", this.searchInput.value = t.searchValue ?? "", this.searchInput.placeholder = "输入关键字筛选...", this.searchInput.style.cssText = `
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
    this.searchInput = document.createElement("input"), this.searchInput.type = "text", this.searchInput.value = t.searchText ?? "", this.searchInput.placeholder = "搜索...", this.searchInput.style.cssText = `
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
    this.minInput = document.createElement("input"), this.minInput.type = "number", this.minInput.value = o !== void 0 && o !== "" ? String(o) : "", this.minInput.placeholder = "最小值", this.minInput.style.cssText = `
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
    }), this.maxInput = document.createElement("input"), this.maxInput.type = "number", this.maxInput.value = n !== void 0 && n !== "" ? String(n) : "", this.maxInput.placeholder = "最大值", this.maxInput.style.cssText = `
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
class Ke {
  constructor() {
    C(this, "listeners", /* @__PURE__ */ new Map());
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
const j = {
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
}, zt = {
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
function hi(D) {
  var t, e, i, s, o, n, r, a, l, h, c, d, u, f, g, m;
  return D ? {
    ...j,
    ...D,
    colors: {
      ...j.colors,
      ...D.colors,
      tagColors: {
        ...j.colors.tagColors,
        ...(t = D.colors) == null ? void 0 : t.tagColors
      },
      date: {
        ...j.colors.date,
        ...(e = D.colors) == null ? void 0 : e.date
      },
      input: {
        ...j.colors.input,
        ...(i = D.colors) == null ? void 0 : i.input
      },
      checkbox: {
        ...j.colors.checkbox,
        ...(s = D.colors) == null ? void 0 : s.checkbox
      },
      radio: {
        ...j.colors.radio,
        ...(o = D.colors) == null ? void 0 : o.radio
      },
      button: {
        ...j.colors.button,
        ...(n = D.colors) == null ? void 0 : n.button
      },
      dropdown: {
        ...j.colors.dropdown,
        ...(r = D.colors) == null ? void 0 : r.dropdown
      },
      scrollbar: {
        ...j.colors.scrollbar,
        ...(a = D.colors) == null ? void 0 : a.scrollbar
      },
      indicator: {
        ...j.colors.indicator,
        ...(l = D.colors) == null ? void 0 : l.indicator
      },
      tooltip: {
        ...j.colors.tooltip,
        ...(h = D.colors) == null ? void 0 : h.tooltip
      },
      image: {
        ...j.colors.image,
        ...(c = D.colors) == null ? void 0 : c.image
      },
      hiddenPlaceholder: {
        ...j.colors.hiddenPlaceholder,
        ...(d = D.colors) == null ? void 0 : d.hiddenPlaceholder
      },
      moreCount: {
        ...j.colors.moreCount,
        ...(u = D.colors) == null ? void 0 : u.moreCount
      },
      shadow: {
        ...j.colors.shadow,
        ...(f = D.colors) == null ? void 0 : f.shadow
      },
      watermark: {
        ...j.colors.watermark,
        ...(g = D.colors) == null ? void 0 : g.watermark
      },
      loading: (m = D.colors) != null && m.loading ? { ...j.colors.loading, ...D.colors.loading } : j.colors.loading
    },
    font: {
      ...j.font,
      ...D.font
    },
    row: {
      ...j.row,
      ...D.row
    },
    border: {
      ...j.border,
      ...D.border
    }
  } : { ...j };
}
class Qe {
  constructor(t, e, i = {}) {
    C(this, "element");
    C(this, "spinnerElement");
    C(this, "textElement");
    C(this, "theme");
    C(this, "config");
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
    this.textElement.textContent = this.config.text ?? "Loading...";
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
class je {
  constructor() {
    C(this, "topPinnedRows", /* @__PURE__ */ new Set());
    C(this, "bottomPinnedRows", /* @__PURE__ */ new Set());
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
class ci {
  // 用户手动设置的 loading 状态
  constructor(t, e) {
    C(this, "container");
    C(this, "wrapper");
    C(this, "canvas");
    C(this, "props");
    C(this, "dataManager");
    C(this, "layoutManager");
    C(this, "rowPinManager");
    C(this, "renderer");
    C(this, "interactionManager");
    C(this, "editorManager");
    C(this, "filterInputManager");
    C(this, "eventEmitter");
    C(this, "loadingOverlay");
    C(this, "theme");
    C(this, "themeMode");
    C(this, "mediaQuery", null);
    C(this, "isDestroyed", !1);
    C(this, "resizeObserver", null);
    C(this, "renderCache");
    C(this, "rowIdManager");
    C(this, "columnIdManager");
    C(this, "scheduledRender", null);
    C(this, "manualLoading", !1);
    C(this, "handleResize", jt(() => {
      this.resize();
    }, 100));
    C(this, "handleThemeChange", () => {
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
    this.props = e, this.themeMode = e.themeMode ?? "light", this.theme = this.resolveTheme(), this.themeMode === "auto" && this.setupAutoThemeDetection(), this.wrapper = document.createElement("div"), this.wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `, this.container.appendChild(this.wrapper), this.canvas = document.createElement("canvas"), this.canvas.style.cssText = `
      display: block;
      position: relative;
      z-index: 1;
    `, this.wrapper.appendChild(this.canvas), this.loadingOverlay = new Qe(this.wrapper, this.theme, {
      text: this.props.loadingText
    }), this.eventEmitter = new Ke(), this.setupEventHandlers();
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
    this.dataManager = new ce(e.rowKey), this.layoutManager = new vt(i, this.theme), this.rowPinManager = new je(), this.layoutManager.setRowPinManager(this.rowPinManager), this.layoutManager.setShowRowNumbers(e.showRowNumbers === !0), this.layoutManager.setRowHeightFn(e.rowHeight), this.renderer = new Fe(this.canvas, this.theme, this.layoutManager), this.renderer.setMultipleSelectSeparator(e.multipleSelectSeparator ?? ", "), this.rowIdManager = this.renderer.getRowIdManager(), this.columnIdManager = this.renderer.getColumnIdManager(), this.renderCache = new he(
      this.rowIdManager,
      this.columnIdManager,
      this.dataManager.getRowVersionManager()
    ), this.renderer.setRenderCache(this.renderCache), this.renderer.setOnImageLoaded(() => this.render()), e.watermark && this.renderer.setWatermarkConfig(e.watermark), e.imageLoad && this.renderer.setImageLoadConfig(e.imageLoad), this.interactionManager = new Tt(
      this.canvas,
      this.layoutManager,
      this.dataManager,
      this.eventEmitter,
      s,
      o
    ), this.interactionManager.setRowHeightResizeEnabled(e.enableRowHeightResize === !0), this.interactionManager.setRowResizable(e.rowResizable), this.interactionManager.setRowPinningEnabled(e.enableRowPinning === !0), this.interactionManager.setRowPinnable(e.rowPinnable), this.interactionManager.setGetScrollbarBounds(() => {
      const d = this.interactionManager.getScrollState();
      return this.renderer.getScrollbarBounds(
        d.scrollLeft,
        d.scrollTop,
        d.maxScrollLeft,
        d.maxScrollTop
      );
    }), this.editorManager = new $e(
      this.wrapper,
      this.canvas,
      this.layoutManager,
      this.eventEmitter,
      this.theme,
      () => this.dataManager.getRows()
    ), this.editorManager.setOnScrollCallback((d, u) => {
      this.interactionManager.handleExternalWheel(d, u);
    }), this.filterInputManager = new Ue(
      this.wrapper,
      this.eventEmitter,
      this.theme
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
    this.eventEmitter.on(R.SCROLL, (t, e) => {
      this.editorManager.setScroll(t, e), this.editorManager.updatePosition();
      const i = this.interactionManager.getFilterDropdown();
      i && this.filterInputManager.updatePosition(i), this.render();
    }), this.eventEmitter.on(R.COLUMN_RESIZE, () => {
      const t = this.dataManager.getColumns();
      this.layoutManager.calculateColumnLayoutOnly(t), this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      ), this.render();
    }), this.eventEmitter.on(R.ROW_RESIZE_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(
      R.ROW_HEIGHT_CHANGE,
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
    ), this.eventEmitter.on(R.COLUMN_REORDER, (t, e) => {
      const i = t, s = e;
      this.dataManager.reorderColumns(i, s);
      const o = this.dataManager.getColumns();
      if (this.layoutManager.calculateColumnLayoutOnly(o), this.props.onColumnReorder) {
        const n = o.map((r) => r.key);
        this.props.onColumnReorder(n);
      }
      this.render();
    }), this.eventEmitter.on(R.COLUMN_REORDER_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(R.COLUMN_SWAP, (t, e) => {
      const i = t, s = e;
      this.dataManager.swapColumnsByKey(i, s);
      const o = this.dataManager.getColumns();
      this.layoutManager.calculateColumnLayoutOnly(o), this.render();
    }), this.eventEmitter.on(R.SORT_CHANGE, (t) => {
      const e = t;
      this.dataManager.sort(e), this.interactionManager.setSortConfig(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(R.FILTER_CHANGE, (t) => {
      const e = t;
      this.dataManager.filter(e), this.interactionManager.setFilterConfig(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(R.FILTER_DROPDOWN_OPEN, () => {
      const t = this.interactionManager.getFilterDropdown();
      this.filterInputManager.updateFilterDropdown(t), this.render();
    }), this.eventEmitter.on(R.FILTER_DROPDOWN_CLOSE, () => {
      this.filterInputManager.updateFilterDropdown(null), this.render();
    }), this.eventEmitter.on(R.FILTER_DROPDOWN_CONFIRM, () => {
      this.interactionManager.applyFilter(), this.filterInputManager.updateFilterDropdown(null), this.render();
    }), this.eventEmitter.on(R.FILTER_DROPDOWN_RESET, () => {
      this.interactionManager.resetFilterValue(), this.filterInputManager.forceReset(), this.render();
    }), this.eventEmitter.on(R.FILTER_DROPDOWN_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(R.SELECTION_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(R.CELL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const s = this.dataManager.getRows()[t.rowIndex];
        s && this.eventEmitter.emit(R.ROW_CLICK, s, t.rowIndex, e);
      }
    }), this.eventEmitter.on(R.CELL_DBL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const s = this.dataManager.getRows()[t.rowIndex];
        s && this.eventEmitter.emit(R.ROW_DBL_CLICK, s, t.rowIndex, e);
      }
    }), this.eventEmitter.on(R.CELL_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.HEADER_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.CHECKBOX_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(R.RADIO_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(R.SWITCH_CHANGE, (t, e) => {
      const i = t, s = e;
      this.props.onSwitchChange && this.props.onSwitchChange(i, s), this.render();
    }), this.eventEmitter.on(R.PROGRESS_CHANGE, (t, e) => {
      const i = t, s = e;
      this.props.onProgressChange && this.props.onProgressChange(i, s), this.render();
    }), this.eventEmitter.on(R.PROGRESS_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(R.RATING_CHANGE, (t, e) => {
      const i = t, s = e;
      this.props.onRatingChange && this.props.onRatingChange(i, s), this.render();
    }), this.eventEmitter.on(R.COLOR_CHANGE, (t, e) => {
      const i = t, s = e;
      this.props.onColorChange && this.props.onColorChange(i, s), this.render();
    }), this.eventEmitter.on(R.COLOR_DROPDOWN_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(R.COLOR_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(R.COLOR_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.SWITCH_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(R.BUTTON_HOVER_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(R.EDIT_START, (t, e) => {
      const i = t, s = e;
      this.editorManager.startEditing(i, s), this.render();
    }), this.eventEmitter.on(R.SELECT_CHANGE, (t, e) => {
      const i = t, s = e, n = this.layoutManager.getLeafColumns()[i.columnIndex];
      n && this.dataManager.updateCell(i.rowIndex, n.key, s, N(n)), this.props.onSelectChange && this.props.onSelectChange(i, s), this.render();
    }), this.eventEmitter.on(
      R.TAGS_CHANGE,
      (t, e, i) => {
        const s = t, o = e, n = i, a = this.layoutManager.getLeafColumns()[s.columnIndex];
        if (a) {
          const l = n ? o : o[0] ?? "";
          this.dataManager.updateCell(
            s.rowIndex,
            a.key,
            l,
            N(a)
          );
        }
        this.props.onTagsChange && this.props.onTagsChange(s, o), this.render();
      }
    ), this.eventEmitter.on(R.EXPAND, (t, e, i) => {
      const s = t, o = e, n = i;
      this.props.onExpand && this.props.onExpand(s, o, n), this.dataManager.toggleRowExpand(o), this.updateLayout(), this.render();
    }), this.eventEmitter.on(R.DROPDOWN_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(R.DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(R.DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.BUTTONS_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(R.DATE_DROPDOWN_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(R.DATE_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(R.DATE_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.DATE_SELECT, (t, e) => {
      const i = t, s = e, n = this.layoutManager.getLeafColumns()[i.columnIndex];
      n && this.dataManager.updateCell(i.rowIndex, n.key, s, N(n)), this.interactionManager.clearEditingState(), this.render();
    }), this.eventEmitter.on(R.CONTEXT_MENU_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(R.CONTEXT_MENU_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(R.CONTEXT_MENU_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.HEADER_CONTEXT_MENU_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(R.HEADER_CONTEXT_MENU_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(R.HEADER_CONTEXT_MENU_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.COLUMN_HIDE, (t) => {
      const e = t;
      this.hideColumnInternal(e);
    }), this.eventEmitter.on(R.COLUMN_SHOW, (t) => {
      const e = t;
      this.showColumnInternal(e);
    }), this.eventEmitter.on(R.ROW_ADD_ABOVE, (t) => {
      const e = t, i = this.dataManager.getColumns(), s = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, s, "above"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(R.ROW_ADD_BELOW, (t) => {
      const e = t, i = this.dataManager.getColumns(), s = this.props.createRowData ? this.props.createRowData(i) : this.createDefaultRowData(i);
      this.dataManager.addRowRelativeTo(e, s, "below"), this.updateLayout(), this.render();
    }), this.eventEmitter.on(R.ROW_DELETE, (t) => {
      const e = t;
      this.rowPinManager.remove(e), this.dataManager.deleteRowByRef(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(R.ROW_PIN_CHANGE, (t, e) => {
      var r, a;
      const i = t, s = e, o = this.rowPinManager.getPosition(i);
      s ? this.rowPinManager.pin(i, s) : this.rowPinManager.remove(i), this.layoutManager.updateRowPin(i, o, s) ? (this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop()
      ), this.editorManager.updatePosition()) : this.updateLayout(), this.render(), (a = (r = this.props).onRowPinChange) == null || a.call(r, i, s);
    }), this.eventEmitter.on(R.UNDO, () => {
      this.undo();
    }), this.eventEmitter.on(R.REDO, () => {
      this.redo();
    }), this.eventEmitter.on(
      R.IMAGE_CLICK,
      (t, e, i) => {
        const s = t, o = e, n = i;
        this.props.onImageClick && this.props.onImageClick(s, o, n);
      }
    ), this.eventEmitter.on(R.IMAGE_TOOLTIP_SCROLL, () => {
      this.render();
    }), this.eventEmitter.on(R.IMAGE_TOOLTIP_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.IMAGE_EDITOR_SCROLL, () => {
      this.render();
    }), this.eventEmitter.on(R.IMAGE_EDITOR_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(R.IMAGE_EDITOR_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(R.IMAGE_UPLOAD, (t, e) => {
      const i = t, s = e;
      this.props.onImageUpload && this.props.onImageUpload(i, s);
    }), this.eventEmitter.on(
      R.IMAGE_DELETE,
      (t, e, i) => {
        const s = t, o = e, n = i;
        this.props.onImageDelete && this.props.onImageDelete(s, o, n);
      }
    ), this.eventEmitter.on(R.EDIT_END, (t, e) => {
      const i = t, s = e, n = this.layoutManager.getLeafColumns()[i.columnIndex];
      n && this.dataManager.updateCell(i.rowIndex, n.key, s, N(n)), this.interactionManager.clearEditingState(), this.render();
    }), this.eventEmitter.on(R.LOAD_MORE, (t) => {
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
      onEditEnd: this.props.onEditEnd,
      onExpand: this.props.onExpand,
      onCheckboxChange: this.props.onCheckboxChange,
      onRadioChange: this.props.onRadioChange,
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
      this.eventEmitter.emit(R.LOAD, s), this.render();
    } catch (t) {
      const e = t instanceof Error ? t : new Error(String(t));
      this.eventEmitter.emit(R.ERROR, e);
    }
  }
  updateLayout() {
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows();
    this.layoutManager.calculateLayout(t, e), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    );
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
        this.props.emptyText ?? "No data",
        this.dataManager.getSort(),
        this.dataManager.getFilters(),
        i.hoveredHeaderColumnKey,
        s.scrollLeft
      );
      const f = this.interactionManager.getFilterDropdown();
      f && this.renderer.renderFilterDropdown(f), this.renderer.renderWatermark();
      return;
    }
    if (this.dataManager.isLoading() || this.manualLoading) {
      this.loadingOverlay.show(this.props.loadingText), this.renderer.renderWatermark();
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
        rowResizeState: i.rowResizeState
      }
    );
    const n = this.interactionManager.getScrollbarState();
    this.renderer.renderScrollbars(
      s.scrollLeft,
      s.scrollTop,
      s.maxScrollLeft,
      s.maxScrollTop,
      n
    ), i.tooltip && this.renderer.renderTooltip(i.tooltip);
    const r = this.interactionManager.getFilterDropdown();
    r && this.renderer.renderFilterDropdown(r);
    const a = this.interactionManager.getDateDropdown();
    a && this.renderer.renderDateDropdown(a);
    const l = this.interactionManager.getColorDropdown();
    l && this.renderer.renderColorDropdown(l);
    const h = this.interactionManager.getButtonsDropdown();
    h && this.renderer.renderButtonsDropdown(h);
    const c = this.interactionManager.getImageTooltip();
    c && this.renderer.renderImageTooltip(c);
    const d = this.interactionManager.getImageEditor();
    d && this.renderer.renderImageEditor(d);
    const u = this.interactionManager.getContextMenu();
    u && this.renderer.renderContextMenu(u), this.renderer.renderWatermark();
  }
  resize() {
    if (this.isDestroyed) return;
    const t = this.container.getBoundingClientRect(), e = t.width || this.props.width || 800, i = t.height || this.props.height || 400;
    this.renderer.resize(e, i), this.layoutManager.setViewportSize(e, i), this.updateLayout(), this.render();
  }
  setRows(t) {
    this.dataManager.loadRows(t).then(() => {
      this.interactionManager.setScrollPosition(0, 0), this.interactionManager.resetState(), this.editorManager.destroy(), this.renderer.clearImageCache(), ft.clearCache(), this.renderer.resetRowIds(), this.renderCache.clear(), this.updateLayout(), this.render();
    }).catch((e) => {
      this.eventEmitter.emit(R.ERROR, e);
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
  updateCell(t, e, i) {
    const s = this.dataManager.updateCell(t, e, i);
    this.eventEmitter.emit(R.CHANGE, [s]), this.render();
  }
  updateRow(t, e) {
    const i = this.dataManager.updateRow(t, e);
    this.eventEmitter.emit(R.CHANGE, i), this.render();
  }
  addRow(t, e) {
    const i = this.dataManager.addRow(t, e);
    this.eventEmitter.emit(R.CHANGE, [i]), this.updateLayout(), this.render();
  }
  deleteRow(t) {
    const e = this.dataManager.deleteRow(t);
    this.eventEmitter.emit(R.CHANGE, [e]), this.updateLayout(), this.render();
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
    this.manualLoading = !0, this.loadingOverlay.show(t), this.render();
  }
  /**
   * 隐藏 loading overlay
   */
  hideLoading() {
    this.manualLoading = !1, this.loadingOverlay.hide(), this.render();
  }
  sort(t) {
    this.dataManager.sort(t), this.interactionManager.setSortConfig(t), this.eventEmitter.emit(R.SORT, t), this.render();
  }
  filter(t) {
    this.dataManager.filter(t), this.interactionManager.setFilterConfig(t), this.eventEmitter.emit(R.FILTER, t), this.updateLayout(), this.render();
  }
  clearFilters() {
    this.dataManager.clearFilters(), this.interactionManager.setFilterConfig([]), this.eventEmitter.emit(R.FILTER, []), this.updateLayout(), this.render();
  }
  async export(t) {
    const e = this.dataManager.exportData({
      includeHeaders: t.includeHeaders ?? !0,
      includeHidden: t.includeHidden ?? !1,
      selectedOnly: t.selectedOnly ?? !1
    });
    let i, s;
    switch (t.format) {
      case "csv":
        i = wt(e), s = "text/csv";
        break;
      case "json":
        i = JSON.stringify(e, null, 2), s = "application/json";
        break;
      case "excel":
        i = wt(e, "	"), s = "application/vnd.ms-excel";
        break;
      default:
        i = wt(e), s = "text/csv";
    }
    return new Blob([i], { type: s });
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
    s(e), n(e) && (this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.interactionManager.updateMaxScroll(
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
    s(e) && (this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.interactionManager.updateMaxScroll(
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
  refresh() {
    this.updateLayout(), this.render();
  }
  createDefaultRowData(t) {
    const e = {};
    for (const i of t) {
      const s = N(i);
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
    var s, o, n, r, a, l, h, c, d, u, f, g, m, p, x;
    let e;
    this.themeMode === "auto" ? e = window.matchMedia("(prefers-color-scheme: dark)").matches ? zt : j : this.themeMode === "dark" ? e = zt : e = j;
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
          ...(x = i.colors) == null ? void 0 : x.watermark
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
    this.isDestroyed || (this.isDestroyed = !0, this.teardownAutoThemeDetection(), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), window.removeEventListener("resize", this.handleResize), this.interactionManager.destroy(), this.renderer.destroy(), this.editorManager.destroy(), this.filterInputManager.destroy(), this.loadingOverlay.destroy(), this.dataManager.destroy(), ft.clearCache(), this.wrapper.parentNode && this.wrapper.parentNode.removeChild(this.wrapper), this.eventEmitter.removeAllListeners());
  }
  on(t, e) {
    this.eventEmitter.on(t, e);
  }
  off(t, e) {
    this.eventEmitter.off(t, e);
  }
}
export {
  ci as CanvasTable,
  ae as ColumnIdManager,
  zt as DARK_THEME,
  j as DEFAULT_THEME,
  ce as DataManager,
  Ke as EventEmitter,
  ie as FILTER_SAMPLE_ROWS,
  se as FILTER_SEARCH_LIMIT,
  Tt as InteractionManager,
  li as LRUCache,
  vt as LayoutManager,
  he as RenderCache,
  Fe as Renderer,
  re as RowIdManager,
  le as RowVersionManager,
  wt as arrayToCsv,
  kt as binarySearch,
  Z as clamp,
  ni as createCanvas,
  jt as debounce,
  Ht as deepClone,
  ci as default,
  ai as downloadBlob,
  ti as formatBoolean,
  Je as formatDate,
  Qt as formatNumber,
  Ze as formatPercent,
  Dt as generateId,
  Vt as getCellDisplayText,
  N as getColumnField,
  Yt as getColumnFilterOptions,
  mt as getDevicePixelRatio,
  ee as getFilterModeByColumnType,
  ii as getNestedValue,
  nt as getRenderResult,
  qt as isEqual,
  Zt as isPromise,
  oi as measureText,
  hi as mergeTheme,
  ri as requestAnimationFrameThrottle,
  et as resolveDisabled,
  ne as searchFilterOptions,
  si as setNestedValue,
  ei as throttle,
  ct as truncateText
};
//# sourceMappingURL=canvas-table.js.map
