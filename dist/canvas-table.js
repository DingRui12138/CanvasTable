var Ut = Object.defineProperty;
var Kt = (M, t, e) => t in M ? Ut(M, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : M[t] = e;
var v = (M, t, e) => Kt(M, typeof t != "symbol" ? t + "" : t, e);
function X(M) {
  return M.field ?? M.key;
}
function Qt(M, t) {
  const { thousandSeparator: e = !0, decimalPlaces: s, prefix: i = "", suffix: o = "" } = t ?? {};
  if (!isFinite(M))
    return String(M);
  let n = s !== void 0 ? M.toFixed(s) : String(M);
  if (e) {
    const r = n.split(".");
    r[0] = r[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","), n = r.join(".");
  }
  return i + n + o;
}
function qe(M, t = 2) {
  return Qt(M * 100, { decimalPlaces: t, suffix: "%" });
}
function Ze(M, t = "YYYY-MM-DD") {
  const e = M instanceof Date ? M : new Date(M);
  if (isNaN(e.getTime()))
    return String(M);
  const s = e.getFullYear(), i = String(e.getMonth() + 1).padStart(2, "0"), o = String(e.getDate()).padStart(2, "0"), n = String(e.getHours()).padStart(2, "0"), r = String(e.getMinutes()).padStart(2, "0"), a = String(e.getSeconds()).padStart(2, "0");
  return t.replace("YYYY", String(s)).replace("MM", i).replace("DD", o).replace("HH", n).replace("mm", r).replace("ss", a);
}
function Je(M, t = "Yes", e = "No") {
  return M ? t : e;
}
function ct(M, t, e = "...") {
  return M.length <= t ? M : M.slice(0, t - e.length) + e;
}
function Dt() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function jt(M, t) {
  let e = null;
  return function(...s) {
    e !== null && clearTimeout(e), e = setTimeout(() => {
      M.apply(this, s), e = null;
    }, t);
  };
}
function ts(M, t) {
  let e = !1;
  return function(...s) {
    e || (M.apply(this, s), e = !0, setTimeout(() => {
      e = !1;
    }, t));
  };
}
function Z(M, t, e) {
  return Math.min(Math.max(M, t), e);
}
function Ht(M) {
  if (M === null || typeof M != "object")
    return M;
  if (Array.isArray(M))
    return M.map((e) => Ht(e));
  const t = {};
  for (const e in M)
    Object.prototype.hasOwnProperty.call(M, e) && (t[e] = Ht(M[e]));
  return t;
}
function qt(M, t) {
  if (M === t)
    return !0;
  if (typeof M != typeof t)
    return !1;
  if (M === null || t === null || typeof M != "object")
    return M === t;
  if (Array.isArray(M) !== Array.isArray(t))
    return !1;
  const e = M, s = t, i = Object.keys(e), o = Object.keys(s);
  if (i.length !== o.length)
    return !1;
  for (const n of i)
    if (!Object.prototype.hasOwnProperty.call(s, n) || !qt(e[n], s[n]))
      return !1;
  return !0;
}
function es(M, t) {
  const e = t.split(".");
  let s = M;
  for (const i of e) {
    if (s == null)
      return;
    s = s[i];
  }
  return s;
}
function ss(M, t, e) {
  const s = t.split(".");
  let i = M;
  for (let o = 0; o < s.length - 1; o++) {
    const n = s[o];
    (i[n] === void 0 || i[n] === null) && (i[n] = {}), i = i[n];
  }
  i[s[s.length - 1]] = e;
}
function kt(M, t, e) {
  let s = 0, i = M.length - 1;
  for (; s <= i; ) {
    const o = Math.floor((s + i) / 2), n = e(M[o]);
    if (n === t)
      return o;
    n < t ? s = o + 1 : i = o - 1;
  }
  return s;
}
function is(M, t, e, s) {
  return M.font = `${e}px ${s}`, {
    width: M.measureText(t).width,
    height: e
  };
}
function mt() {
  return window.devicePixelRatio || 1;
}
function os(M, t) {
  const e = document.createElement("canvas"), s = mt();
  e.width = M * s, e.height = t * s, e.style.width = `${M}px`, e.style.height = `${t}px`;
  const i = e.getContext("2d");
  if (!i)
    throw new Error("Failed to get 2D context");
  return i.scale(s, s), { canvas: e, ctx: i };
}
function ns(M) {
  let t = null, e = null;
  return function(...s) {
    e = s, t === null && (t = requestAnimationFrame(() => {
      e !== null && M.apply(this, e), t = null, e = null;
    }));
  };
}
function Zt(M) {
  return M !== null && typeof M == "object" && typeof M.then == "function";
}
function rs(M, t) {
  const e = URL.createObjectURL(M), s = document.createElement("a");
  s.href = e, s.download = t, document.body.appendChild(s), s.click(), document.body.removeChild(s), URL.revokeObjectURL(e);
}
function wt(M, t = ",") {
  return M.map((e) => e.map((s) => {
    const i = String(s ?? "");
    return i.includes(t) || i.includes('"') || i.includes(`
`) ? `"${i.replace(/"/g, '""')}"` : i;
  }).join(t)).join(`
`);
}
function et(M, t, e) {
  return M === void 0 ? !1 : typeof M == "function" ? M(t, e) : M;
}
function nt(M, t, e) {
  const s = X(M), i = t.data[s];
  let o = {
    text: String(i ?? ""),
    type: M.type ?? "text"
  };
  if (M.render)
    try {
      const n = M.render(i, t, M, e);
      n && (o = { ...o, ...n });
    } catch (n) {
      console.error(`Error in render function at row ${e}, column ${M.key}:`, n), o = {
        text: "[Error]",
        type: "text"
      };
    }
  return o.type === "checkbox" && !o.checkbox && (o.checkbox = {
    checked: !!i
  }), o.type === "switch" && !o.switch && (o.switch = {
    checked: !!i
  }), o;
}
function Xt(M, t, e) {
  var n, r;
  const s = X(M), i = t.data[s], o = nt(M, t, e);
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
  if (M.formatter)
    return M.formatter(i, t, M);
  if (o.text !== void 0)
    return String(o.text);
  switch (M.type) {
    case "number":
      return typeof i == "number" ? i.toLocaleString() : String(i ?? "");
    case "boolean":
      return i ? "是" : "否";
    case "date":
      return i instanceof Date ? i.toLocaleDateString() : String(i ?? "");
    default:
      return String(i ?? "");
  }
}
class as {
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
      const s = this.cache.keys().next().value;
      s !== void 0 && this.cache.delete(s);
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
function ee(M) {
  var e, s;
  if ((e = M.filter) != null && e.mode)
    return M.filter.mode;
  if ((s = M.filter) != null && s.disabled)
    return null;
  const t = M.type ?? "text";
  return te.includes(t) ? null : Jt[t] ?? "search";
}
const se = 100, ie = 100;
function Vt(M, t, e = 0) {
  var n;
  if ((n = M.filter) != null && n.options && M.filter.options.length > 0)
    return M.filter.options;
  if (!t || t.length === 0)
    return [];
  const s = X(M), i = t.slice(e, e + se), o = /* @__PURE__ */ new Map();
  for (let r = 0; r < i.length; r++) {
    const a = i[r], l = a.data[s], h = nt(M, a, e + r), c = oe(h, l);
    for (const d of c) {
      const u = String(d.value);
      o.has(u) || o.set(u, d);
    }
  }
  return Array.from(o.values());
}
function oe(M, t) {
  var s, i, o, n;
  const e = [];
  if ((s = M.select) != null && s.options && e.push(...M.select.options), (i = M.tags) != null && i.options && e.push(
    ...M.tags.options.map((r) => ({
      label: r.text,
      value: r.value ?? r.text
    }))
  ), (o = M.radio) != null && o.options && e.push(...M.radio.options), (n = M.color) != null && n.presetColors && e.push(
    ...M.color.presetColors.map((r) => ({
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
function ne(M, t, e, s = ie) {
  if (!e || e.trim() === "")
    return [];
  const i = X(M), o = e.toLowerCase(), n = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (n.size >= s)
      break;
    const a = r.data[i];
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
class ae {
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
class le {
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
class he {
  constructor(t, e, s, i = 3e3) {
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
    this.rowIdManager = t, this.columnIdManager = e, this.rowVersionManager = s, this.maxCellCacheSize = i;
  }
  // ==================== Key 生成 ====================
  /**
   * 生成单元格缓存 key
   */
  getCellCacheKey(t, e) {
    const s = this.rowIdManager.getId(t), i = this.columnIdManager.getId(e);
    return `${s}-${i}`;
  }
  /**
   * 生成列值缓存 key
   */
  getValueCacheKey(t, e) {
    const s = this.columnIdManager.getId(t), i = this.stringifyValue(e);
    return `${s}-${i}`;
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
  get(t, e, s, i) {
    if (i === "value") {
      const a = this.getValueCacheKey(e, s);
      return this.valueCache.get(a) ?? null;
    }
    const o = this.getCellCacheKey(t, e), n = this.cellCache.get(o);
    if (!n) return null;
    const r = this.rowVersionManager.getVersion(t);
    return n.value !== s || n.rowVersion !== r ? (this.cellCache.delete(o), null) : n.renderResult;
  }
  /**
   * 设置缓存
   */
  set(t, e, s, i, o) {
    if (o === "value") {
      const n = this.getValueCacheKey(e, s);
      this.valueCache.set(n, i);
    } else {
      const n = this.getCellCacheKey(t, e);
      this.ensureCellCapacity(), this.cellCache.set(n, {
        value: s,
        renderResult: i,
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
    for (const s of this.cellCache.keys()) {
      const i = s.split("-")[0];
      i && !t.has(i) && e.push(s);
    }
    for (const s of e)
      this.cellCache.delete(s);
  }
  /**
   * 清理不可见列的缓存
   * @param visibleColumnIds 可见列的 ID 集合
   */
  cleanupInvisibleColumns(t) {
    const e = [];
    for (const s of this.cellCache.keys()) {
      const o = s.split("-").slice(1).join("-");
      o && !t.has(o) && e.push(s);
    }
    for (const s of e)
      this.cellCache.delete(s);
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
const Ct = 200;
class ce {
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
    v(this, "rowVersionManager", new le());
    this.historyOptions = {
      maxActions: (e == null ? void 0 : e.maxActions) ?? Ct
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
    return t.map((s) => {
      const i = {
        id: s.id ?? Dt(),
        data: s.data,
        level: e,
        expanded: s.expanded ?? !1,
        selected: s.selected ?? !1,
        cellMerges: s.cellMerges
      };
      return s.children && (i.children = this.processRows(s.children, e + 1)), i;
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
    const s = this.findColumnByKey(this.state.columns, t), i = this.findColumnByKey(this.state.columns, e);
    if (!(!s || !i)) {
      if (s.parentKey && i.parentKey) {
        if (s.parentKey === i.parentKey) {
          const o = this.findColumnByKey(this.state.columns, s.parentKey);
          if (o && o.children) {
            const n = o.children.findIndex((a) => a.key === t), r = o.children.findIndex((a) => a.key === e);
            if (n >= 0 && r >= 0) {
              const a = [...o.children];
              [a[n], a[r]] = [a[r], a[n]], o.children = a;
            }
          }
        }
      } else if (!s.parentKey && !i.parentKey) {
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
    const s = this.getLeafColumnInfo(t);
    if (!s) return;
    const i = this.countLeafColumns(this.state.columns);
    let o = e;
    t < e && (o = e - 1), o < 0 && (o = 0), o > i - 1 && (o = i - 1);
    const n = this.getLeafColumnInfo(o);
    if (n)
      if (s.parent && n.parent)
        if (s.parent === n.parent) {
          const r = this.findColumnByKey(this.state.columns, s.parent);
          if (r && r.children) {
            const a = [...r.children], [l] = a.splice(s.indexInParent, 1);
            a.splice(n.indexInParent, 0, l), r.children = a;
          }
        } else
          return;
      else if (!s.parent && !n.parent) {
        const r = [...this.state.columns], [a] = r.splice(s.indexInParent, 1);
        r.splice(n.indexInParent, 0, a), this.state.columns = r;
      } else
        return;
  }
  countLeafColumns(t) {
    let e = 0;
    for (const s of t)
      s.children && s.children.length > 0 ? e += this.countLeafColumns(s.children) : e++;
    return e;
  }
  getLeafColumnInfo(t) {
    let e = 0;
    const s = (i, o) => {
      for (let n = 0; n < i.length; n++) {
        const r = i[n];
        if (r.children && r.children.length > 0) {
          const a = s(r.children, r.key);
          if (a) return a;
        } else {
          if (e === t)
            return { parent: o, indexInParent: n, column: r };
          e++;
        }
      }
      return null;
    };
    return s(this.state.columns, null);
  }
  findColumnByKey(t, e) {
    for (const s of t) {
      if (s.key === e) return s;
      if (s.children) {
        const i = this.findColumnByKey(s.children, e);
        if (i) return i;
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
    for (const s of t)
      e++, s.children && s.expanded && (e += this.countAllRows(s.children));
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
    const s = [];
    for (const i of t)
      if (e && (s.push(i), i.children && i.children.length > 0 && i.expanded)) {
        const o = this.flattenRowsForDisplay(i.children, !0);
        s.push(...o);
      }
    return s;
  }
  applyFilters(t) {
    const e = (s, i) => {
      for (const o of s) {
        if (o.key === i) return o;
        if (o.children) {
          const n = e(o.children, i);
          if (n) return n;
        }
      }
    };
    return t.filter((s) => {
      const i = this.state.filters.every((o) => {
        const n = e(this.state.columns, o.column);
        if (!n) return !0;
        const r = s.data[X(n)];
        return this.matchesFilter(r, o, s, n);
      });
      return i && s.children && this.applyFilters(s.children).length > 0 ? !0 : i;
    });
  }
  matchesFilter(t, e, s, i) {
    var a;
    if ((a = i.filter) != null && a.custom)
      return i.filter.custom(t, e.value, s);
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
    const e = (i, o) => {
      for (const n of i) {
        if (n.key === o) return n;
        if (n.children) {
          const r = e(n.children, o);
          if (r) return r;
        }
      }
    };
    return [...t].sort((i, o) => {
      for (const n of this.state.sort) {
        const r = e(this.state.columns, n.column);
        if (!r) continue;
        const a = X(r), l = i.data[a], h = o.data[a];
        let c = this.compareValues(l, h, r.type);
        if (c !== 0)
          return n.direction === "desc" ? -c : c;
      }
      return 0;
    }).map((i) => {
      const o = { ...i };
      return i.children && (o.children = this.applySort(i.children)), o;
    });
  }
  compareValues(t, e, s) {
    if (t === e) return 0;
    if (t == null) return -1;
    if (e == null) return 1;
    switch (s) {
      case "number":
        return Number(t) - Number(e);
      case "date":
        return new Date(t).getTime() - new Date(e).getTime();
      case "boolean":
        return Number(t) - Number(e);
      default: {
        const i = this.extractNumber(t), o = this.extractNumber(e);
        return i !== null && o !== null ? i - o : String(t).localeCompare(String(e));
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
    const e = t.replace(/^[^\d.-]+/, "").replace(/[^\d.-]+$/, "").replace(/,/g, ""), s = parseFloat(e);
    return isNaN(s) ? null : s;
  }
  updateCell(t, e, s, i) {
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
    }, r = n(this.state.columns, e), a = i ?? (r == null ? void 0 : r.field) ?? e;
    let l = s;
    if (r)
      switch (r.type) {
        case "number":
          l = s !== "" && s !== null && s !== void 0 ? Number(s) : null;
          break;
        case "boolean":
          l = !!s;
          break;
        case "date":
          typeof s == "string" && s && (l = s);
          break;
        default:
          l = s;
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
    const s = this.state.sortedRows[t];
    if (!s)
      throw new Error(`Row at index ${t} not found`);
    const i = [];
    for (const [n, r] of Object.entries(e)) {
      const a = s.data[n];
      a !== r && (s.data[n] = r, i.push({
        type: "update",
        rowIndex: t,
        column: n,
        oldValue: a,
        newValue: r
      }));
    }
    for (const n of i)
      this.recordAction({
        type: "update",
        rowId: s.id,
        column: n.column,
        oldValue: n.oldValue,
        newValue: n.newValue
      });
    i.length > 0 && this.rowVersionManager.incrementVersion(s);
    const o = this.findStateRow(s.id);
    return o && Object.assign(o.data, e), this.applyFiltersAndSort(), i;
  }
  addRow(t, e) {
    const s = {
      id: Dt(),
      data: t,
      expanded: !1,
      selected: !1,
      level: 0
    }, i = e !== void 0 && e >= 0 && e <= this.state.rows.length ? e : this.state.rows.length;
    return e !== void 0 && e >= 0 && e <= this.state.rows.length ? this.state.rows.splice(e, 0, s) : this.state.rows.push(s), this.recordAction({
      type: "add",
      rowId: s.id,
      rowIndex: i,
      rowData: { ...s, data: { ...s.data } }
    }), this.applyFiltersAndSort(), {
      type: "add",
      rowIndex: i,
      row: s
    };
  }
  deleteRow(t) {
    const e = this.state.sortedRows[t];
    if (!e)
      throw new Error(`Row at index ${t} not found`);
    const s = this.state.rows.findIndex((i) => i.id === e.id);
    return s !== -1 && this.state.rows.splice(s, 1), this.recordAction({
      type: "delete",
      rowId: e.id,
      rowIndex: s,
      rowData: { ...e, data: { ...e.data } }
    }), this.applyFiltersAndSort(), {
      type: "delete",
      rowIndex: t,
      row: e
    };
  }
  toggleRowExpand(t) {
    const e = this.state.sortedRows[t];
    if (!e || !e.children) return !1;
    e.expanded = !e.expanded;
    const s = this.findStateRow(e.id);
    return s && (s.expanded = e.expanded), this.applyFiltersAndSort(), e.expanded;
  }
  setRowSelected(t, e) {
    const s = this.state.sortedRows[t];
    if (!s) return;
    s.selected = e;
    const i = this.findStateRow(s.id);
    i && (i.selected = e);
  }
  findStateRow(t) {
    const e = (s) => {
      for (const i of s) {
        if (i.id === t) return i;
        if (i.children) {
          const o = e(i.children);
          if (o) return o;
        }
      }
    };
    return e(this.state.rows);
  }
  getSelectedRows() {
    const t = [];
    return this.state.sortedRows.forEach((e, s) => {
      e.selected && t.push(s);
    }), t;
  }
  selectAll(t) {
    const e = (s) => {
      s.forEach((i) => {
        i.selected = t, i.children && e(i.children);
      });
    };
    e(this.state.sortedRows), e(this.state.rows);
  }
  getVisibleRows(t, e) {
    const s = [], i = (o, n, r) => {
      let a = 0;
      for (const l of o)
        if (a >= n && a <= r && s.push(l), a++, l.children && l.expanded && i(l.children, n - a, r - a), a > r) break;
    };
    return i(this.state.sortedRows, t, e), s;
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
    const e = this.historyOptions.maxActions ?? Ct;
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
        const e = this.state.rows.findIndex((s) => s.id === t.rowId);
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
        const e = this.state.rows.findIndex((s) => s.id === t.rowId);
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
    const e = (s) => {
      for (const i of s) {
        if (i.id === t) return i;
        if (i.children) {
          const o = e(i.children);
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
    const e = this.historyOptions.maxActions ?? Ct;
    for (; this.historyStack.length > e && e > 0; )
      this.historyStack.shift();
  }
  exportData(t) {
    const { includeHeaders: e = !0, selectedOnly: s = !1 } = t, i = s ? this.state.sortedRows.filter((r) => r.selected) : this.state.sortedRows, o = this.getLeafColumnsList(), n = [];
    e && n.push(o.map((r) => r.title));
    for (let r = 0; r < i.length; r++) {
      const a = i[r];
      n.push(o.map((l) => Xt(l, a, r)));
    }
    return n;
  }
  getLeafColumnsList() {
    const t = [], e = (s) => {
      for (const i of s)
        i.children && i.children.length > 0 ? e(i.children) : t.push(i);
    };
    return e(this.state.columns), t;
  }
}
const Ot = 5, Lt = 2, de = 32, yt = 150, Wt = 50, Pt = 500, ot = class ot {
  constructor(t, e) {
    v(this, "layoutInfo");
    v(this, "visibleRange");
    v(this, "config");
    v(this, "theme");
    v(this, "columnWidths", /* @__PURE__ */ new Map());
    v(this, "rowHeights", []);
    v(this, "rowOffsets", []);
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
      rowBufferSize: (t == null ? void 0 : t.rowBufferSize) ?? Ot,
      columnBufferSize: (t == null ? void 0 : t.columnBufferSize) ?? Lt,
      estimatedRowHeight: (t == null ? void 0 : t.estimatedRowHeight) ?? de,
      estimatedColumnWidth: (t == null ? void 0 : t.estimatedColumnWidth) ?? yt
    }, this.theme = e, this.layoutInfo = this.createEmptyLayoutInfo(), this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
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
  setRowHeight(t, e) {
    const s = Z(e, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(t, s), this.hasRowHeightOverrides = !0, this.rowHeightsDirty = !0;
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
      render: (e, s, i, o) => ({
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
    const s = (o) => {
      for (const n of o)
        if (n.fixed === "left" || n.children && s(n.children)) return !0;
      return !1;
    }, i = s(t);
    if (this.showRowNumbers) {
      const o = this.createRowNumberColumn(i);
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
    const e = (i) => {
      for (const o of i)
        if (o.fixed === "left" || o.children && e(o.children)) return !0;
      return !1;
    }, s = e(t);
    if (this.showRowNumbers) {
      const i = this.createRowNumberColumn(s);
      this.columns = [i, ...t];
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
    const s = (o, n, r, a) => {
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
              for (let R = u - 1; R >= 0; R--) {
                const T = o.children[R];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (p = T.fixed);
                  break;
                }
              }
              let x;
              for (let R = u + 1; R < o.children.length; R++) {
                const T = o.children[R];
                if (T && !T.hidden) {
                  (T.fixed === "left" || T.fixed === "right") && (x = T.fixed);
                  break;
                }
              }
              const w = p === x ? p : void 0, C = ot.HIDDEN_PLACEHOLDER_PREFIX + f.key, y = {
                key: C,
                title: "",
                width: ot.HIDDEN_PLACEHOLDER_WIDTH,
                type: "text",
                fixed: w,
                _hiddenColumnKey: f.key
              }, b = ot.HIDDEN_PLACEHOLDER_WIDTH;
              this.columnWidths.set(C, b), this.leafColumns.push(y);
              const I = n + 1, E = this.headerDepth - I;
              this.headerCells.push({
                column: y,
                x: l,
                y: I * this.theme.row.headerHeight,
                width: b,
                height: this.theme.row.headerHeight * E,
                rowIndex: I,
                colIndex: this.leafColumns.length - 1,
                colspan: 1,
                rowspan: E,
                isLeaf: !0
              }), h += b, l += b;
            }
            d = !0;
            continue;
          }
          d = !1;
          const g = s(f, n + 1, l, o.key);
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
    let i = 0;
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
              x: i,
              y: 0,
              width: f,
              height: this.theme.row.headerHeight * this.headerDepth,
              rowIndex: 0,
              colIndex: this.leafColumns.length,
              colspan: 1,
              rowspan: this.headerDepth,
              isLeaf: !0
            }), this.leafColumns.push(u), i += f;
          }
          continue;
        }
        i += s(n, 0, i);
      }
    }
  }
  calculateColumnLayout(t) {
    this.columnOffsets = [];
    const e = [];
    let s = 0;
    for (const i of this.leafColumns) {
      const o = this.columnWidths.get(i.key) ?? this.getColumnWidth(i);
      e.push(o), this.columnOffsets.push(s), s += o;
    }
    this.layoutInfo.columnWidths = e;
  }
  calculateCellMerges(t) {
    this.cellMergeMap.clear(), this.cellMergeByRow.clear(), this.mergedCellSet.clear(), this.cellToMergeMap.clear();
    for (let e = 0; e < t.length; e++) {
      const s = t[e];
      if (!(!s || !s.cellMerges))
        for (const i of s.cellMerges) {
          const o = {
            ...i,
            rowIndex: e
          }, n = `${e}-${i.columnIndex}`;
          this.cellMergeMap.set(n, o), this.cellToMergeMap.set(n, o);
          for (let r = e; r < e + i.rowspan; r++) {
            this.cellMergeByRow.has(r) || this.cellMergeByRow.set(r, []), this.cellMergeByRow.get(r).push(o);
            for (let a = i.columnIndex; a < i.columnIndex + i.colspan; a++)
              (r !== e || a !== i.columnIndex) && (this.mergedCellSet.add(`${r}-${a}`), this.cellToMergeMap.set(`${r}-${a}`, o));
          }
        }
    }
  }
  calculateRowLayout(t) {
    const e = t.length, s = this.theme.row.height;
    if (!(e !== this.cachedRows.length || t.some((n, r) => n !== this.cachedRows[r])) && !this.rowHeightsDirty && this.rowHeights.length === e)
      return;
    this.cachedRows = [...t], this.rowHeightsDirty = !1;
    const o = this.rowHeightFn;
    this.rowHeights = t.map((n, r) => {
      const a = this.rowHeightOverrides.get(n);
      return a !== void 0 ? Z(a, this.theme.row.minHeight, this.theme.row.maxHeight) : o ? o(n, r) : s;
    }), this.rowOffsets = Array.from({ length: e }), this.rowOffsets[0] = this.layoutInfo.headerHeight;
    for (let n = 1; n < e; n++)
      this.rowOffsets[n] = this.rowOffsets[n - 1] + this.rowHeights[n - 1];
    this.layoutInfo.rowOffsets = [...this.rowOffsets];
  }
  getColumnWidth(t) {
    if (this.columnWidths.has(t.key))
      return this.columnWidths.get(t.key);
    if (t.children && t.children.length > 0) {
      let s = 0;
      for (const i of t.children)
        s += this.getColumnWidth(i);
      return s;
    }
    let e = t.width ?? this.config.estimatedColumnWidth ?? yt;
    return e = Z(e, t.minWidth ?? Wt, t.maxWidth ?? Pt), e;
  }
  setColumnWidth(t, e) {
    const s = this.getColumnByKey(t);
    if (s) {
      const i = Z(
        e,
        s.minWidth ?? Wt,
        s.maxWidth ?? Pt
      );
      this.columnWidths.set(t, i), this.recalculateColumnLayout(), this.recalculateHeaderLayout();
    }
  }
  recalculateColumnLayout() {
    this.columnOffsets = [];
    const t = [];
    let e = 0;
    for (const s of this.leafColumns) {
      const i = this.columnWidths.get(s.key) ?? this.getColumnWidth(s);
      t.push(i), this.columnOffsets.push(e), e += i;
    }
    this.layoutInfo.columnWidths = t, this.layoutInfo.totalWidth = this.calculateTotalWidth();
  }
  recalculateHeaderLayout() {
    const t = (e, s) => {
      let i = s;
      for (const o of e) {
        const n = this.headerCells.find((r) => r.column === o);
        n && (n.x = i, o.children && o.children.length > 0 ? n.width = t(o.children, i) : n.width = this.columnWidths.get(o.key) ?? this.getColumnWidth(o), i += n.width);
      }
      return i - s;
    };
    t(this.columns, 0);
  }
  getColumnByKey(t) {
    const e = (s) => {
      for (const i of s) {
        if (i.key === t) return i;
        if (i.children) {
          const o = e(i.children);
          if (o) return o;
        }
      }
    };
    return e(this.columns);
  }
  getLeafColumnIndexByKey(t) {
    var e;
    for (let s = 0; s < this.leafColumns.length; s++)
      if (((e = this.leafColumns[s]) == null ? void 0 : e.key) === t)
        return s;
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
    let e = this.layoutInfo.headerHeight;
    for (let s = 0; s < t && s < this.rowHeights.length; s++)
      e += this.rowHeights[s];
    return e;
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
    const t = this.layoutInfo.headerHeight, e = this.config.rowBufferSize ?? Ot, s = this.config.columnBufferSize ?? Lt, i = this.findRowIndexAtOffset(this.scrollTop - t), o = this.findRowIndexAtOffset(this.scrollTop + this.viewportHeight - t);
    this.visibleRange.startRow = Math.max(0, i - e), this.visibleRange.endRow = Math.min(this.rowHeights.length - 1, o + e);
    const n = this.findColumnIndexAtOffset(this.scrollLeft), r = this.findColumnIndexAtOffset(this.scrollLeft + this.viewportWidth);
    this.visibleRange.startColumn = Math.max(0, n - s), this.visibleRange.endColumn = Math.min(
      this.layoutInfo.columnWidths.length - 1,
      r + s
    );
  }
  findRowIndexAtOffset(t) {
    if (t <= 0 || this.rowOffsets.length === 0) return 0;
    const e = this.rowOffsets[this.rowOffsets.length - 1] ?? 0;
    return t >= e ? this.rowOffsets.length - 1 : kt(this.rowOffsets, t, (s) => s);
  }
  findColumnIndexAtOffset(t) {
    if (t <= 0 || this.columnOffsets.length === 0) return 0;
    const e = this.columnOffsets[this.columnOffsets.length - 1] ?? 0;
    return t >= e ? this.columnOffsets.length - 1 : kt(this.columnOffsets, t, (s) => s);
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
    const s = [];
    for (const n of this.headerCells) {
      let r;
      if (n.column.fixed === "left")
        r = n.x;
      else if (n.column.fixed === "right") {
        const a = this.getRightFixedWidth(), h = this.viewportWidth - a - (this.layoutInfo.totalWidth - a);
        r = n.x + h;
      } else
        r = n.x - this.scrollLeft;
      t >= r && t < r + n.width && e >= n.y && e < n.y + n.height && s.push(n);
    }
    if (s.length === 0) return null;
    if (s.length === 1) return s[0];
    const i = s.find(
      (n) => n.column.fixed === "left" || n.column.fixed === "right"
    );
    if (i) {
      if (i.isLeaf) return i;
      for (const n of this.headerCells) {
        if (!n.isLeaf || n.column.fixed !== i.column.fixed) continue;
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
    const o = s.find((n) => n.isLeaf);
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
    return s.reduce(
      (n, r) => r.rowIndex > n.rowIndex ? r : n
    );
  }
  getLeafHeaderCell(t) {
    const e = this.leafColumns[t];
    return e ? this.headerCells.find((s) => s.column === e && s.isLeaf) ?? null : null;
  }
  getLeafHeaderCellViewportPosition(t) {
    const e = this.getLeafHeaderCell(t);
    if (!e) return null;
    const s = e.column;
    let i = e.x;
    const o = e.y, n = e.width, r = e.height;
    if (s.fixed !== "left") if (s.fixed === "right") {
      const a = this.getRightFixedWidth(), h = this.viewportWidth - a - (this.layoutInfo.totalWidth - a);
      i = e.x + h;
    } else
      i = i - this.scrollLeft;
    return { x: i, y: o, width: n, height: r };
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
    const s = `${t}-${e}`;
    return this.cellMergeMap.has(s);
  }
  getMergesAffectingRow(t) {
    return this.cellMergeByRow.get(t) ?? [];
  }
  getMergedCellPosition(t, e) {
    const s = this.getCellMerge(t, e);
    if (!s) return null;
    const i = this.getColumnOffset(s.columnIndex), o = this.getRowOffset(s.rowIndex);
    let n = 0;
    for (let a = 0; a < s.colspan; a++)
      n += this.getColumnWidthByIndex(s.columnIndex + a);
    let r = 0;
    for (let a = 0; a < s.rowspan; a++)
      r += this.getRowHeightByIndex(s.rowIndex + a);
    return { x: i, y: o, width: n, height: r };
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
    return this.layoutInfo.columnWidths[t] ?? yt;
  }
  getCellPosition(t, e) {
    const s = this.leafColumns[e];
    let i = this.getColumnOffset(e);
    const o = t === -1 ? 0 : this.getRowOffset(t), n = this.getColumnWidthByIndex(e), r = t === -1 ? this.layoutInfo.headerHeight : this.getRowHeightByIndex(t);
    if ((s == null ? void 0 : s.fixed) === "left") {
      let a = 0;
      for (let l = 0; l < this.leafColumns.length; l++) {
        const h = this.leafColumns[l];
        if ((h == null ? void 0 : h.fixed) === "left") {
          if (l === e) {
            i = a;
            break;
          }
          a += this.layoutInfo.columnWidths[l];
        }
      }
    }
    if ((s == null ? void 0 : s.fixed) === "right") {
      const a = this.getRightFixedWidth();
      let l = this.viewportWidth - a;
      for (let h = 0; h < this.leafColumns.length; h++) {
        const c = this.leafColumns[h];
        if ((c == null ? void 0 : c.fixed) === "right") {
          if (h === e) {
            i = l;
            break;
          }
          l += this.layoutInfo.columnWidths[h];
        }
      }
    }
    return { x: i, y: o, width: n, height: r };
  }
  getCellAtPosition(t, e, s) {
    const i = this.layoutInfo.headerHeight, o = s ?? this.scrollTop;
    if (e - o < i) {
      const h = this.findColumnIndexAtPosition(t);
      return h < 0 ? null : { rowIndex: -1, columnIndex: h };
    }
    const r = this.findRowIndexAtPosition(e), a = this.findColumnIndexAtPosition(t);
    if (r < 0 || r >= this.rowHeights.length || a < 0 || a >= this.layoutInfo.columnWidths.length)
      return null;
    const l = this.getCellMerge(r, a);
    return l ? { rowIndex: l.rowIndex, columnIndex: l.columnIndex } : { rowIndex: r, columnIndex: a };
  }
  findRowIndexAtPosition(t) {
    let e = 0, s = this.rowOffsets.length - 1;
    for (; e <= s; ) {
      const i = Math.floor((e + s) / 2), o = this.rowOffsets[i], n = this.rowHeights[i];
      if (t >= o && t < o + n)
        return i;
      t < o ? s = i - 1 : e = i + 1;
    }
    return -1;
  }
  findColumnIndexAtPosition(t) {
    const e = t - this.scrollLeft, s = this.getLeftFixedWidth(), i = this.getRightFixedWidth();
    if (s > 0 && e < s) {
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
    if (i > 0) {
      const o = this.viewportWidth - i;
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
      const s = this.leafColumns[e];
      (s == null ? void 0 : s.fixed) === "right" && (t += this.layoutInfo.columnWidths[e] ?? 0);
    }
    return t;
  }
  getLeftFixedWidth() {
    let t = 0;
    for (let e = 0; e < this.leafColumns.length; e++) {
      const s = this.leafColumns[e];
      (s == null ? void 0 : s.fixed) === "left" && (t += this.layoutInfo.columnWidths[e] ?? 0);
    }
    return t;
  }
  getMaxScrollLeft() {
    return Math.max(0, this.layoutInfo.totalWidth - this.viewportWidth);
  }
  getMaxScrollTop() {
    return Math.max(0, this.layoutInfo.totalHeight - this.viewportHeight);
  }
  getViewportWidth() {
    return this.viewportWidth;
  }
  getScrollOffsetForRow(t) {
    const e = this.getRowOffset(t), s = this.getRowHeightByIndex(t);
    return e < this.scrollTop ? e : e + s > this.scrollTop + this.viewportHeight ? e + s - this.viewportHeight : this.scrollTop;
  }
  getScrollOffsetForColumn(t) {
    const e = this.getColumnOffset(t), s = this.getColumnWidthByIndex(t);
    return e < this.scrollLeft ? e : e + s > this.scrollLeft + this.viewportWidth ? e + s - this.viewportWidth : this.scrollLeft;
  }
  getFixedColumnsInfo(t) {
    const e = [], s = [], i = [];
    for (const a of this.leafColumns.length > 0 ? this.leafColumns : t)
      a.fixed === "left" ? e.push(a) : a.fixed === "right" ? s.push(a) : i.push(a);
    const o = e.reduce((a, l) => a + this.getColumnWidth(l), 0), n = s.reduce((a, l) => a + this.getColumnWidth(l), 0), r = i.reduce((a, l) => a + this.getColumnWidth(l), 0);
    return {
      leftFixed: { columns: e, width: o },
      rightFixed: { columns: s, width: n },
      center: { columns: i, width: r }
    };
  }
  isColumnResizable(t) {
    return !0;
  }
  getResizeHandlePosition(t) {
    let e = 0;
    for (let s = 0; s <= t; s++)
      e += this.layoutInfo.columnWidths[s] ?? 0;
    return e;
  }
  isResizeHandleAtPosition(t, e) {
    if (e > this.layoutInfo.headerHeight)
      return -1;
    const i = t - this.scrollLeft, o = this.getLeftFixedWidth(), n = this.getRightFixedWidth();
    if (o > 0 && i < o) {
      let r = 0;
      for (let a = 0; a < this.leafColumns.length; a++) {
        const l = this.leafColumns[a];
        if ((l == null ? void 0 : l.fixed) === "left") {
          if (r += this.layoutInfo.columnWidths[a], Math.abs(i - r) <= 5)
            return a;
        } else
          break;
      }
      return -1;
    }
    if (n > 0) {
      const r = this.viewportWidth - n;
      if (i >= r) {
        let a = this.viewportWidth;
        if (Math.abs(i - r) <= 5)
          for (let l = 0; l < this.leafColumns.length; l++) {
            const h = this.leafColumns[l];
            if ((h == null ? void 0 : h.fixed) === "right")
              return l;
          }
        for (let l = this.leafColumns.length - 1; l >= 0; l--) {
          const h = this.leafColumns[l];
          if ((h == null ? void 0 : h.fixed) === "right") {
            if (a -= this.layoutInfo.columnWidths[l], Math.abs(i - a) <= 5)
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
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), s = this.scrollLeft + t, i = this.scrollLeft + this.viewportWidth - e, o = [];
    for (let n = 0; n < this.leafColumns.length; n++) {
      const r = this.leafColumns[n];
      if ((r == null ? void 0 : r.fixed) === "left" || (r == null ? void 0 : r.fixed) === "right")
        continue;
      const a = this.columnOffsets[n] ?? 0;
      a + (this.layoutInfo.columnWidths[n] ?? 0) >= s && a <= i && o.push(n);
    }
    return o;
  }
  getVisibleHeaderCells() {
    const t = this.getLeftFixedWidth(), e = this.getRightFixedWidth(), s = this.scrollLeft + t, i = this.scrollLeft + this.viewportWidth - e, o = [], n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
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
      if (h >= s && l <= i && !n.has(u)) {
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
    const e = this.getLeftFixedWidth(), s = this.getRightFixedWidth();
    return e > 0 && t < e ? "left-fixed" : s > 0 && t >= this.viewportWidth - s ? "right-fixed" : "scrollable";
  }
  /**
   * 统一命中测试入口
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param scrollbarBounds 可选的滚动条边界（由 Renderer 计算，确保与渲染一致）
   */
  hitTest(t, e, s) {
    const i = this.hitTestScrollbar(t, e, s);
    return i || (e < this.layoutInfo.headerHeight ? this.hitTestHeader(t, e) : this.hitTestCell(t, e));
  }
  /**
   * 检测滚动条区域
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param externalBounds 可选的外部滚动条边界（优先使用）
   */
  hitTestScrollbar(t, e, s) {
    if (s) {
      if (s.vertical) {
        const { x: h, y: c, width: d, height: u } = s.vertical;
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
      if (s.horizontal) {
        const { x: h, y: c, width: d, height: u } = s.horizontal;
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
    const i = this.layoutInfo, o = this.getMaxScrollTop(), n = this.getMaxScrollLeft(), r = 10, a = 30, l = i.headerHeight;
    if (o > 0) {
      const h = this.viewportHeight - l, c = Math.max(
        a,
        this.viewportHeight / i.totalHeight * h
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
        this.viewportWidth / i.totalWidth * h
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
    const s = this.getMouseRegion(t), i = this.hitTestResizeHandle(t, s);
    if (i >= 0)
      return {
        region: "header",
        regionDetail: s,
        isResizeHandle: !0,
        resizeColumnIndex: i,
        viewport: { x: t, y: e }
      };
    const o = this.getHeaderCellAtPosition(t, e);
    return {
      region: "header",
      regionDetail: s,
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
    let s = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const o = this.leafColumns[i];
      if ((o == null ? void 0 : o.fixed) === "left") {
        if (s += this.layoutInfo.columnWidths[i], Math.abs(t - s) <= e)
          return i;
      } else
        break;
    }
    return -1;
  }
  /**
   * 检测右侧固定列的 resize handle
   */
  hitTestRightFixedResizeHandle(t, e) {
    const s = this.getRightFixedWidth(), i = this.viewportWidth - s;
    if (Math.abs(t - i) <= e)
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
    const s = t + this.scrollLeft;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const o = this.leafColumns[i];
      if ((o == null ? void 0 : o.fixed) === "left" || (o == null ? void 0 : o.fixed) === "right")
        continue;
      const n = this.columnOffsets[i], r = this.layoutInfo.columnWidths[i];
      if (n !== void 0 && Math.abs(s - (n + r)) <= e)
        return i;
    }
    return -1;
  }
  /**
   * 检测单元格区域
   */
  hitTestCell(t, e) {
    const s = this.getMouseRegion(t), i = e + this.scrollTop, o = this.hitTestRowResizeHandle(i), n = this.findRowIndexAtPosition(i);
    if ((n < 0 || n >= this.rowHeights.length) && o < 0)
      return { region: "outside", viewport: { x: t, y: e } };
    let r;
    if (s === "left-fixed")
      r = this.findColumnIndexInLeftFixed(t);
    else if (s === "right-fixed")
      r = this.findColumnIndexInRightFixed(t);
    else {
      const h = t + this.scrollLeft;
      r = this.findColumnIndexInScrollable(h);
    }
    if (r < 0 || r >= this.layoutInfo.columnWidths.length)
      return { region: "outside", regionDetail: s, viewport: { x: t, y: e } };
    const a = o >= 0 ? o : n, l = this.getCellMerge(a, r);
    return l ? {
      region: "cell",
      regionDetail: s,
      cell: { rowIndex: l.rowIndex, columnIndex: l.columnIndex },
      isRowResizeHandle: o >= 0,
      resizeRowIndex: o >= 0 ? o : void 0,
      viewport: { x: t, y: e }
    } : {
      region: "cell",
      regionDetail: s,
      cell: { rowIndex: a, columnIndex: r },
      isRowResizeHandle: o >= 0,
      resizeRowIndex: o >= 0 ? o : void 0,
      viewport: { x: t, y: e }
    };
  }
  hitTestRowResizeHandle(t) {
    for (let s = 0; s < this.rowOffsets.length; s++) {
      const i = (this.rowOffsets[s] ?? 0) + (this.rowHeights[s] ?? 0);
      if (Math.abs(t - i) <= 4)
        return s;
    }
    return -1;
  }
  /**
   * 在左侧固定列中查找列索引
   */
  findColumnIndexInLeftFixed(t) {
    let e = 0;
    for (let s = 0; s < this.leafColumns.length; s++) {
      const i = this.leafColumns[s];
      if ((i == null ? void 0 : i.fixed) === "left") {
        const o = this.layoutInfo.columnWidths[s];
        if (t >= e && t < e + o)
          return s;
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
    let i = this.viewportWidth - e;
    for (let o = 0; o < this.leafColumns.length; o++) {
      const n = this.leafColumns[o];
      if ((n == null ? void 0 : n.fixed) === "right") {
        const r = this.layoutInfo.columnWidths[o];
        if (t >= i && t < i + r)
          return o;
        i += r;
      }
    }
    return -1;
  }
  /**
   * 在滚动区域中查找列索引
   */
  findColumnIndexInScrollable(t) {
    for (let e = 0; e < this.columnOffsets.length; e++) {
      const s = this.leafColumns[e];
      if ((s == null ? void 0 : s.fixed) === "left" || (s == null ? void 0 : s.fixed) === "right")
        continue;
      const i = this.columnOffsets[e], o = this.layoutInfo.columnWidths[e];
      if (i !== void 0 && t >= i && t < i + o)
        return e;
    }
    return -1;
  }
};
// 占位列相关常量
v(ot, "HIDDEN_PLACEHOLDER_WIDTH", 5), v(ot, "HIDDEN_PLACEHOLDER_PREFIX", "__hidden_placeholder__");
let bt = ot;
class At {
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
  request(t, e = 64, s) {
    if (this.destroyed) return;
    const i = this.cache.get(t);
    if (i) {
      if (i.size >= e) {
        s == null || s(!0, i.image);
        return;
      }
      if (i.originalImage) {
        const a = this.scaleImage(i.originalImage, e);
        i.image = a, i.size = e, s == null || s(!0, a);
        return;
      }
    }
    if (this.failed.has(t)) {
      s == null || s(!1, null);
      return;
    }
    const o = this.loading.get(t);
    if (o) {
      o.maxSize = Math.max(o.maxSize, e), s && o.callbacks.push(s);
      return;
    }
    const n = this.pendingQueue.get(t);
    if (n) {
      n.maxSize = Math.max(n.maxSize, e), s && n.callbacks.push(s);
      return;
    }
    const r = {
      src: t,
      callbacks: s ? [s] : [],
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
      const s = this.pendingQueue.get(t);
      s ? (s.maxSize = Math.max(s.maxSize, e.maxSize), s.callbacks.push(...e.callbacks)) : this.pendingQueue.set(t, e);
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
    const s = new Image();
    s.crossOrigin = "anonymous", s.onload = () => {
      if (this.destroyed) return;
      const i = this.scaleImage(s, e.maxSize);
      this.addToCache(t, {
        image: i,
        size: e.maxSize,
        originalImage: s
      }), this.loading.delete(t);
      for (const o of e.callbacks)
        o(!0, i);
      this.processQueue();
    }, s.onerror = () => {
      if (!this.destroyed) {
        this.loading.delete(t), this.failed.add(t);
        for (const i of e.callbacks)
          i(!1, null);
        this.processQueue();
      }
    }, s.src = t;
  }
  /**
   * 缩放图片
   */
  scaleImage(t, e) {
    if (t.width <= e && t.height <= e)
      return t;
    const s = Math.min(e / t.width, e / t.height), i = Math.round(t.width * s), o = Math.round(t.height * s), n = document.createElement("canvas");
    n.width = i, n.height = o;
    const r = n.getContext("2d");
    return r ? (r.imageSmoothingEnabled = !0, r.imageSmoothingQuality = "high", r.drawImage(t, 0, 0, i, o), n) : t;
  }
  /**
   * 获取缓存的图片（如果尺寸不够会返回 null）
   */
  get(t, e) {
    const s = this.cache.get(t);
    return !s || e && s.size < e ? null : s.image;
  }
  /**
   * 检查是否已缓存（且尺寸满足需求）
   */
  has(t, e) {
    const s = this.cache.get(t);
    return !(!s || e && s.size < e);
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
      const s = this.cache.keys().next().value;
      s && this.cache.delete(s);
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
  constructor(t, e, s) {
    v(this, "ctx");
    v(this, "theme");
    v(this, "measureTextWidth");
    this.ctx = t, this.theme = e, this.measureTextWidth = s;
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
    const { config: e, x: s, y: i, width: o, scrollTop: n, hoveredIndex: r } = t, a = 32, l = 8, c = Math.min(e.options.length, l) * a;
    this.ctx.save(), this.drawDropdownPanel(s, i, o, c), this.ctx.beginPath(), this.ctx.rect(s, i, o, c), this.ctx.clip();
    const d = e.multiple && Array.isArray(e.value) ? e.value : e.value !== void 0 ? [e.value] : [];
    for (let u = 0; u < e.options.length; u++) {
      const f = e.options[u], g = i + u * a - n;
      if (g + a < i || g > i + c) continue;
      u === r && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(s, g, o, a));
      const m = d.includes(f.value);
      m && !e.multiple && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(s, g, o, a)), e.multiple ? this.renderMultipleOption(f.label, f.disabled, m, s, g, o) : this.renderSingleOption(f.label, f.disabled, m, s, g, o);
    }
    this.renderDropdownScrollbar(
      e.options.length,
      l,
      s,
      i,
      o,
      c,
      n
    ), this.ctx.restore();
  }
  renderTagsDropdown(t) {
    const { x: e, y: s, width: i, scrollTop: o, hoveredIndex: n, tagsConfig: r } = t;
    if (!r || !r.options) return;
    const { options: a, selectedValues: l = [] } = r, h = 32, c = 8, u = Math.min(a.length, c) * h;
    this.ctx.save(), this.drawDropdownPanel(e, s, i, u), this.ctx.beginPath(), this.ctx.rect(e, s, i, u), this.ctx.clip();
    for (let f = 0; f < a.length; f++) {
      const g = a[f], m = s + f * h - o;
      if (m + h < s || m > s + u) continue;
      const p = l.includes(g.value ?? g.text);
      f === n && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, i, h)), p && (this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg, this.ctx.fillRect(e, m, i, h));
      const x = 14, w = e + 10, C = m + (h - x) / 2;
      this.ctx.fillStyle = p ? this.theme.colors.checkbox.checkedBg : this.theme.colors.button.background, this.ctx.strokeStyle = p ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(w, C, x, x, 2), this.ctx.fill(), this.ctx.stroke(), p && (this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(w + 3, C + 7), this.ctx.lineTo(w + 6, C + 10), this.ctx.lineTo(w + 11, C + 4), this.ctx.stroke()), this.ctx.fillStyle = g.disabled ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
      const y = w + x + 8, b = m + h / 2, I = i - (x + 28), E = ct(
        g.text,
        Math.floor(I / (this.theme.font.size * 0.6))
      );
      this.ctx.fillText(E, y, b);
    }
    this.renderDropdownScrollbar(
      a.length,
      c,
      e,
      s,
      i,
      u,
      o
    ), this.ctx.restore();
  }
  renderMultipleOption(t, e, s, i, o, n) {
    const l = i + 10, h = o + 18 / 2;
    this.ctx.strokeStyle = s ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(l, h, 14, 14, 2), this.ctx.stroke(), s && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(l, h, 14, 14, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.lineCap = "round", this.ctx.lineJoin = "round", this.ctx.beginPath(), this.ctx.moveTo(l + 3, h + 14 / 2), this.ctx.lineTo(l + 14 / 2, h + 14 - 4), this.ctx.lineTo(l + 14 - 3, h + 4), this.ctx.stroke()), this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const c = l + 14 + 8, d = o + 32 / 2, u = n - 42, f = ct(
      t,
      Math.floor(u / (this.theme.font.size * 0.6))
    );
    this.ctx.fillText(f, c, d);
  }
  renderSingleOption(t, e, s, i, o, n) {
    s ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`) : (this.ctx.fillStyle = e ? this.theme.colors.placeholderText : this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`), this.ctx.textBaseline = "middle";
    const a = i + 12, l = o + 32 / 2, h = n - 24, c = ct(
      t,
      Math.floor(h / (this.theme.font.size * 0.6))
    );
    if (this.ctx.fillText(c, a, l), s) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath();
      const d = i + n - 20, u = l;
      this.ctx.moveTo(d - 6, u), this.ctx.lineTo(d - 2, u + 4), this.ctx.lineTo(d + 6, u - 4), this.ctx.strokeStyle = this.theme.colors.checkbox.checkedBg, this.ctx.lineWidth = 2, this.ctx.stroke();
    }
  }
  renderDropdownScrollbar(t, e, s, i, o, n, r) {
    if (t <= e) return;
    const a = 6, l = s + o - a - 2, h = t * 32, c = Math.max(20, n / h * n), d = i + r / h * n, u = this.ctx.globalAlpha;
    this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(l, d, a, c, 3), this.ctx.fill(), this.ctx.globalAlpha = u;
  }
  drawDropdownPanel(t, e, s, i) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(t, e, s, i, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0;
  }
}
class fe {
  constructor(t, e) {
    v(this, "ctx");
    v(this, "theme");
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
    const { x: e, y: s, width: i, searchValue: o } = t, n = 8, r = 4, a = 36, l = 36, h = n + a + r + l;
    this.drawPanelBackground(e, s, i, h);
    const c = s + n;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + n, c, i - n * 2, a, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const d = c + a / 2, u = e + n + 12;
    o ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(o, u, d)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("输入关键字筛选...", u, d)), this.renderFilterButtons(e, s + n + a + r, i, l), this.drawPanelBorder(e, s, i, h);
  }
  renderSelectFilterDropdown(t) {
    const { x: e, y: s, width: i, options: o, scrollTop: n, hoveredIndex: r, isLoading: a } = t;
    if (!o && !a) return;
    const l = 8, h = 4, c = 32, d = 32, u = 8, f = 36, g = (o == null ? void 0 : o.length) ?? 0, m = Math.min(g, u), p = m * d, x = l + c + h + p + h + f;
    this.drawPanelBackground(e, s, i, x);
    const w = s + l;
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = this.theme.colors.input.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e + l, w, i - l * 2, c, 4), this.ctx.fill(), this.ctx.stroke(), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", t.searchText ? (this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(t.searchText, e + l + 12, w + c / 2)) : (this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("搜索...", e + l + 12, w + c / 2));
    const C = s + l + c + h;
    if (a)
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("加载中...", e + l, C + d / 2);
    else if (o && o.length > 0) {
      this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(e, C, i, p), this.ctx.clip();
      const y = 14, b = 8, I = Math.floor(n / d), E = -(n % d);
      for (let R = 0; R <= m + 1; R++) {
        const T = I + R;
        if (T < 0 || T >= o.length) continue;
        const D = o[T];
        if (!D) continue;
        const H = C + R * d + E;
        T === r && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, H, i, d));
        const k = e + l, O = H + (d - y) / 2;
        this.ctx.strokeStyle = D.checked ? this.theme.colors.checkbox.checkedBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(k, O, y, y, 2), this.ctx.stroke(), D.checked && (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.roundRect(k, O, y, y, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark, this.ctx.lineWidth = 2, this.ctx.beginPath(), this.ctx.moveTo(k + 3, O + 7), this.ctx.lineTo(k + 6, O + 10), this.ctx.lineTo(k + 11, O + 4), this.ctx.stroke()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const A = k + y + b, W = i - l * 2 - y - b, P = String(D.value);
        if (/^#[0-9A-Fa-f]{6}$/.test(P)) {
          const F = H + (d - 16) / 2, Y = A;
          this.ctx.fillStyle = P, this.ctx.beginPath(), this.ctx.roundRect(Y, F, 16, 16, 2), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke(), this.ctx.fillStyle = this.theme.colors.dropdown.text;
          const B = Y + 16 + 6, z = W - 16 - 6, U = ct(
            P.toUpperCase(),
            Math.floor(z / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(U, B, H + d / 2);
        } else {
          const _ = ct(
            D.label,
            Math.floor(W / (this.theme.font.size * 0.6))
          );
          this.ctx.fillText(_, A, H + d / 2);
        }
      }
      if (this.ctx.restore(), o.length > u) {
        const T = o.length * d, D = Math.max(20, p / T * p), H = p - D, k = n / (T - p) * H, O = this.ctx.globalAlpha;
        this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = this.theme.colors.scrollbar.thumb, this.ctx.beginPath(), this.ctx.roundRect(
          e + i - 6 - 2,
          C + k + 2,
          6,
          D,
          3
        ), this.ctx.fill(), this.ctx.globalAlpha = O;
      }
    } else
      this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.fillText("暂无数据", e + l, C + d / 2);
    this.renderFilterButtons(
      e,
      s + l + c + h + p + h,
      i,
      f
    ), this.drawPanelBorder(e, s, i, x);
  }
  renderRangeFilterDropdown(t) {
    const { x: e, y: s, width: i, minValue: o, maxValue: n } = t, r = 8, a = 4, l = 32, h = 8, c = 36, d = r + l + a + c;
    this.drawPanelBackground(e, s, i, d), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const u = s + r, f = (i - r * 3) / 2;
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
    ), this.renderFilterButtons(e, s + r + l + a, i, c), this.drawPanelBorder(e, s, i, d);
  }
  renderBooleanFilterDropdown(t) {
    const { x: e, y: s, width: i, boolValue: o } = t, n = 8, r = 4, a = 32, l = 36, h = n + a * 3 + r + l;
    this.drawPanelBackground(e, s, i, h);
    const c = [
      { value: "all", label: "全部" },
      { value: "true", label: "已选" },
      { value: "false", label: "未选" }
    ], d = 14, u = 8;
    for (let f = 0; f < c.length; f++) {
      const g = c[f], m = s + n + f * a, p = o === g.value;
      p && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, m, i, a));
      const x = e + n, w = m + (a - d) / 2;
      this.ctx.strokeStyle = p ? this.theme.colors.button.primaryBg : this.theme.colors.checkbox.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.arc(x + d / 2, w + d / 2, d / 2, 0, Math.PI * 2), this.ctx.stroke(), p && (this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.beginPath(), this.ctx.arc(x + d / 2, w + d / 2, d / 4, 0, Math.PI * 2), this.ctx.fill()), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText(g.label, x + d + u, m + a / 2);
    }
    this.renderFilterButtons(e, s + n + a * 3 + r, i, l), this.drawPanelBorder(e, s, i, h);
  }
  renderDateRangeFilterDropdown(t) {
    const { x: e, y: s, width: i, startDate: o, endDate: n, activeDateField: r } = t, a = 8, l = 4, h = 32, c = 8, d = 36, u = a + h + l + d;
    this.drawPanelBackground(e, s, i, u), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const f = s + a, g = (i - a * 3) / 2, m = e + a, p = r === "startDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = p ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = p ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(m, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const x = o ? this.formatDate(o, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = x ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(x || "开始日期", m + 8, f + h / 2);
    const w = e + a + g + c, C = r === "endDate";
    this.ctx.fillStyle = this.theme.colors.input.background, this.ctx.strokeStyle = C ? this.theme.colors.primary : this.theme.colors.input.border, this.ctx.lineWidth = C ? 2 : 1, this.ctx.beginPath(), this.ctx.roundRect(w, f, g, h, 4), this.ctx.fill(), this.ctx.stroke();
    const y = n ? this.formatDate(n, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = y ? this.theme.colors.dropdown.text : this.theme.colors.placeholderText, this.ctx.fillText(y || "结束日期", w + 8, f + h / 2), this.renderFilterButtons(e, s + a + h + l, i, d), this.drawPanelBorder(e, s, i, u);
  }
  renderDateRangeCalendarPopover(t) {
    const {
      x: e,
      y: s,
      width: i,
      startDate: o,
      endDate: n,
      activeDateField: r,
      currentYear: a,
      currentMonth: l,
      hoveredDate: h
    } = t;
    if (!r || a === void 0 || l === void 0) return;
    const c = 8, d = 32, u = 8, f = 40, g = 28, m = 28, p = 8, w = f + g + 6 * m + p * 2, C = 240, y = (i - c * 3) / 2, b = e + c, I = e + c + y + u, E = s + c;
    let D = (r === "startDate" ? b : I) + y / 2 - C / 2;
    D < e && (D = e), D + C > e + i && (D = e + i - C);
    const H = E + d + u, k = r === "startDate" ? o : n;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(D, H, C, w, 6), this.ctx.fill(), this.ctx.shadowColor = "transparent", this.ctx.shadowBlur = 0, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0, this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.stroke();
    const A = `${a}年 ${[
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
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(A, D + C / 2, H + f / 2);
    const W = 6, P = D + 20, L = D + C - 20, _ = H + f / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(P + W, _ - W), this.ctx.lineTo(P - W, _), this.ctx.lineTo(P + W, _ + W), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(L - W, _ - W), this.ctx.lineTo(L + W, _), this.ctx.lineTo(L - W, _ + W), this.ctx.closePath(), this.ctx.fill();
    const F = ["日", "一", "二", "三", "四", "五", "六"], Y = (C - p * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let $ = 0; $ < 7; $++) {
      const Q = D + p + $ * Y + Y / 2, tt = H + f + g / 2;
      this.ctx.fillText(F[$], Q, tt);
    }
    const z = new Date(a, l, 1).getDay(), U = new Date(a, l + 1, 0).getDate(), G = /* @__PURE__ */ new Date();
    G.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let $ = 1; $ <= U; $++) {
      const Q = z + $ - 1, tt = Math.floor(Q / 7), V = Q % 7, K = D + p + V * Y, lt = H + f + g + tt * m, rt = K + Y / 2, gt = lt + m / 2, xt = new Date(a, l, $), Yt = k && xt.getTime() === k.getTime(), Gt = h && xt.getTime() === h.getTime(), $t = xt.getTime() === G.getTime();
      if (Yt)
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
  renderFilterButtons(t, e, s, i) {
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(t, e, s, i), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(t, e), this.ctx.lineTo(t + s, e), this.ctx.stroke(), this.ctx.font = `14px ${this.theme.font.family}`;
    const r = "重置", a = "确定", l = this.ctx.measureText(a).width, h = t + 8, c = t + s - 8 - l, d = e + i / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.textBaseline = "middle", this.ctx.fillText(r, h, d), this.ctx.fillStyle = this.theme.colors.linkColor, this.ctx.fillText(a, c, d);
  }
  drawPanelBackground(t, e, s, i) {
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(t, e, s, i, 6), this.ctx.fill(), this.ctx.restore();
  }
  drawPanelBorder(t, e, s, i) {
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(t, e, s, i, 6), this.ctx.stroke();
  }
  formatDate(t, e) {
    const s = t.getFullYear(), i = String(t.getMonth() + 1).padStart(2, "0"), o = String(t.getDate()).padStart(2, "0");
    return e.replace("YYYY", String(s)).replace("MM", i).replace("DD", o);
  }
}
function ge(M) {
  M.shadowColor = "transparent", M.shadowBlur = 0, M.shadowOffsetX = 0, M.shadowOffsetY = 0;
}
function me(M, t) {
  M.shadowColor = t.colors.shadow.color, M.shadowBlur = t.colors.shadow.blur, M.shadowOffsetX = t.colors.shadow.offsetX, M.shadowOffsetY = t.colors.shadow.offsetY;
}
function pt(M, t, e) {
  const s = e.radius ?? 6;
  e.shadow && me(M, t), M.fillStyle = e.fillStyle, M.beginPath(), M.roundRect(e.x, e.y, e.width, e.height, s), M.fill(), e.shadow && ge(M), e.clip && (M.beginPath(), M.roundRect(e.x, e.y, e.width, e.height, s), M.clip()), e.strokeStyle && (M.strokeStyle = e.strokeStyle, M.lineWidth = 1, M.beginPath(), M.roundRect(e.x, e.y, e.width, e.height, s), M.stroke());
}
function _t(M, t, e, s, i, o, n, r) {
  const a = M.globalAlpha;
  M.globalAlpha = t.colors.scrollbar.opacity, M.fillStyle = t.colors.scrollbar.track, M.fillRect(e, s, i, o), M.fillStyle = t.colors.scrollbar.thumb, M.fillRect(e, n, i, r), M.globalAlpha = a;
}
class pe {
  constructor(t, e, s) {
    v(this, "ctx");
    v(this, "theme");
    v(this, "loader");
    this.ctx = t, this.theme = e, this.loader = s;
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
        const w = t.x + 8 + m * 72, C = t.y + 8 + g * 72 - t.scrollTop;
        C + 64 < t.y || C > t.y + h || this.renderImageTile(
          x,
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
      _t(
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
    const e = t.images ?? [], s = t.pendingImages ?? [], i = 64, o = 8, n = 8, r = 4, a = 60, l = i + n, h = 4, d = r * i + (r - 1) * n + o * 2 + 4 + h, u = t.maxRows * l + o * 2 - n, f = a + u;
    this.ctx.save(), pt(this.ctx, this.theme, {
      x: t.x,
      y: t.y,
      width: d,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.renderUploadArea(t, d, a, o);
    const g = t.y + a, m = Math.ceil((e.length + s.length) / r), p = m * l - n, x = u - o * 2;
    this.ctx.beginPath(), this.ctx.rect(t.x, g, d, u), this.ctx.clip();
    const w = Math.floor(t.scrollTop / l), C = Math.min(m, w + t.maxRows + 1), y = [...e, ...s.map((b) => b.preview)];
    for (let b = w; b < C; b++)
      for (let I = 0; I < r; I++) {
        const E = b * r + I;
        if (E >= y.length) break;
        const R = y[E];
        if (!R) continue;
        const T = t.x + o + I * (i + n), D = g + o + b * l - t.scrollTop;
        if (D + i < g || D > g + u) continue;
        const H = E === t.hoveredIndex, k = E >= e.length;
        this.renderImageTile(R, T, D, i, H, k, !0);
      }
    if (p > x) {
      const b = x, I = Math.max(
        30,
        x / p * b
      ), E = g + o + t.scrollTop / (p - x + o * 2) * (b - I);
      _t(
        this.ctx,
        this.theme,
        t.x + d - o - h,
        g + o,
        h,
        b,
        E,
        I
      );
    }
    this.ctx.restore();
  }
  renderUploadArea(t, e, s, i) {
    const o = t.y, n = t.isDragging;
    this.ctx.fillStyle = n ? this.theme.colors.dropdown.selectedBg : this.theme.colors.image.placeholderBg, this.ctx.fillRect(
      t.x + i,
      o + i,
      e - i * 2,
      s - i * 2
    ), this.ctx.strokeStyle = n ? this.theme.colors.checkbox.checkedBg : this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.setLineDash([4, 4]), this.ctx.strokeRect(
      t.x + i,
      o + i,
      e - i * 2,
      s - i * 2
    ), this.ctx.setLineDash([]), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const r = n ? "释放以上传图片" : "点击上传或拖拽图片到此处";
    this.ctx.fillText(r, t.x + e / 2, o + s / 2);
  }
  renderImageTile(t, e, s, i, o, n, r) {
    const a = this.loader.get(t, i);
    if (a ? (this.ctx.save(), o && (this.ctx.strokeStyle = this.theme.colors.image.hoverBorder, this.ctx.lineWidth = 2, this.ctx.strokeRect(e - 1, s - 1, i + 2, i + 2)), this.ctx.drawImage(a, e, s, i, i), this.ctx.restore(), this.loader.collectVisible(t)) : (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.fillRect(e, s, i, i), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, s, i, i), this.loader.isLoading(t) || this.loader.load(t, i)), n && (this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)", this.ctx.fillRect(e, s + i - 20, i, 20), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.fillText("上传中...", e + i / 2, s + i - 10)), o && !n && r) {
      const h = e + i - 8 - 2, c = s + 16 / 2 + 2;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)", this.ctx.beginPath(), this.ctx.arc(h, c, 16 / 2, 0, Math.PI * 2), this.ctx.fill(), this.ctx.strokeStyle = "#ffffff", this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.moveTo(h - 3, c - 3), this.ctx.lineTo(h + 3, c + 3), this.ctx.moveTo(h + 3, c - 3), this.ctx.lineTo(h - 3, c + 3), this.ctx.stroke();
    }
  }
}
class xe {
  constructor(t, e, s, i, o) {
    v(this, "ctx");
    v(this, "canvas");
    v(this, "theme");
    v(this, "layoutManager");
    v(this, "dpr");
    v(this, "watermarkConfig", null);
    this.canvas = t, this.ctx = e, this.theme = s, this.layoutManager = i, this.dpr = o;
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
    const { config: e, x: s, y: i, width: o, hoveredColor: n } = t, r = e.presetColors || this.getDefaultPresetColors(), a = 8, l = 24, h = 4, c = 8, d = Math.ceil(r.length / a), u = c * 2 + d * (l + h) - h;
    this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.beginPath(), this.ctx.roundRect(s, i, o, u, 6), this.ctx.fill(), this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(s, i, o, u, 6), this.ctx.stroke();
    for (let f = 0; f < r.length; f++) {
      const g = r[f], m = f % a, p = Math.floor(f / a), x = s + c + m * (l + h), w = i + c + p * (l + h);
      this.ctx.fillStyle = g, this.ctx.fillRect(x, w, l, l), g === n ? (this.ctx.strokeStyle = "#1890ff", this.ctx.lineWidth = 2, this.ctx.strokeRect(x - 1, w - 1, l + 2, l + 2)) : (this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(x, w, l, l));
    }
  }
  renderTooltip(t) {
    const { x: e, y: s, width: i, content: o } = t, n = 8, r = 20, a = 4, l = 4, h = 4;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    let c = n * 2;
    const d = [], u = [], f = 140, g = 300, m = i ?? g;
    let p = 0;
    if (o.type === "text") {
      const b = this.ctx.measureText(o.text).width;
      p = Math.min(b + n * 2, g);
      const I = Math.max(f, Math.min(p, m));
      let E = "";
      for (const R of o.text.split("")) {
        const T = E + R;
        this.ctx.measureText(T).width > I - n * 2 ? (E && d.push(E), E = R) : E = T;
      }
      E && d.push(E), c += d.length * r;
    } else if (o.type === "tags") {
      const b = o.tags;
      let I = [], E = n;
      for (const R of b) {
        const T = this.ctx.measureText(R.text).width + l * 2;
        p = Math.max(p, E + T + n), E + T + a > m - n && I.length > 0 && (u.push(I), I = [], E = n), I.push(R), E += T + a;
      }
      I.length > 0 && u.push(I), c += u.length * (this.theme.font.size + l * 2) + (u.length - 1) * a;
    }
    const x = Math.max(f, Math.min(p, m));
    let w = e + (m - x) / 2;
    const C = this.canvas.width / this.dpr;
    w < 0 ? w = 4 : w + x > C && (w = C - x - 4);
    const y = s - c - this.theme.colors.tooltip.gap;
    if (this.ctx.save(), this.ctx.fillStyle = this.theme.colors.tooltip.background, this.ctx.shadowColor = this.theme.colors.shadow.color, this.ctx.shadowBlur = this.theme.colors.shadow.blur, this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX, this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY, this.ctx.beginPath(), this.ctx.roundRect(w, y, x, c, 6), this.ctx.fill(), this.ctx.restore(), this.ctx.fillStyle = this.theme.colors.tooltip.text, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "top", o.type === "text") {
      let b = y + n;
      for (const I of d)
        this.ctx.fillText(I, w + n, b), b += r;
    } else if (o.type === "tags") {
      let b = y + n;
      const I = this.theme.font.size + l * 2;
      for (const E of u) {
        let R = w + n;
        for (const T of E) {
          const D = this.ctx.measureText(T.text).width + l * 2;
          this.ctx.fillStyle = T.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0"), this.ctx.beginPath(), this.ctx.roundRect(R, b, D, I, h), this.ctx.fill(), this.ctx.fillStyle = T.color ?? this.theme.colors.cellText ?? "#333", this.ctx.textBaseline = "middle";
          const H = R + (D - this.ctx.measureText(T.text).width) / 2;
          this.ctx.fillText(T.text, H, b + I / 2), R += D + a;
        }
        b += I + a;
      }
    }
  }
  renderScrollbars(t, e, s, i, o) {
    const n = this.canvas.width / this.dpr, r = this.canvas.height / this.dpr, a = this.layoutManager.getLayoutInfo(), l = a.headerHeight, h = 10, c = 30;
    if (i > 0) {
      const d = r - l, u = Math.max(
        c,
        r / a.totalHeight * d
      ), f = l + e / i * (d - u), g = n - h;
      let m = this.theme.colors.scrollbar.thumb;
      o.verticalDragging ? m = this.theme.colors.scrollbar.thumbActive : o.verticalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const p = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(g, f, h - 2, u, 4), this.ctx.fill(), this.ctx.globalAlpha = p;
    }
    if (s > 0) {
      const d = n, u = Math.max(
        c,
        n / a.totalWidth * d
      ), f = t / s * (d - u), g = r - h;
      let m = this.theme.colors.scrollbar.thumb;
      o.horizontalDragging ? m = this.theme.colors.scrollbar.thumbActive : o.horizontalHovered && (m = this.theme.colors.scrollbar.thumbHover);
      const p = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity, this.ctx.fillStyle = m, this.ctx.beginPath(), this.ctx.roundRect(f, g, u, h - 2, 4), this.ctx.fill(), this.ctx.globalAlpha = p;
    }
  }
  getScrollbarBounds(t, e, s, i) {
    const o = this.canvas.width / this.dpr, n = this.canvas.height / this.dpr, r = this.layoutManager.getLayoutInfo(), a = r.headerHeight, l = 10, h = 30;
    let c = null, d = null;
    if (i > 0) {
      const u = n - a, f = Math.max(
        h,
        n / r.totalHeight * u
      ), g = a + e / i * (u - f);
      c = {
        x: o - l,
        y: g,
        width: l - 2,
        height: f
      };
    }
    if (s > 0) {
      const u = o, f = Math.max(
        h,
        o / r.totalWidth * u
      ), g = t / s * (u - f), m = n - l;
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
    const s = this.canvas.width / this.dpr, i = this.canvas.height / this.dpr, o = this.theme.colors.watermark, n = this.watermarkConfig.fontSize ?? o.fontSize, r = this.watermarkConfig.fontFamily ?? o.fontFamily ?? this.theme.font.family, a = this.watermarkConfig.color ?? o.color, l = this.watermarkConfig.rotation ?? -22, h = this.watermarkConfig.gapX ?? 100, c = this.watermarkConfig.gapY ?? 100, d = this.watermarkConfig.opacity ?? o.opacity;
    this.ctx.save(), this.ctx.globalAlpha = d, this.ctx.font = `${n}px ${r}`, this.ctx.fillStyle = a, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle";
    const u = l * Math.PI / 180, g = this.ctx.measureText(e).width + h, m = n + c, p = Math.ceil(s / g) + 2, x = Math.ceil(i / m) + 2;
    for (let w = -1; w <= x; w++)
      for (let C = -1; C <= p; C++) {
        const y = C * g + (w % 2 === 0 ? 0 : g / 2), b = w * m;
        this.ctx.save(), this.ctx.translate(y, b), this.ctx.rotate(u), this.ctx.fillText(e, 0, 0), this.ctx.restore();
      }
    this.ctx.restore();
  }
  renderContextMenu(t) {
    const { x: e, y: s, hoveredIndex: i } = t, o = 140, n = 32, r = [{ text: "上方添加行" }, { text: "下方添加行" }, { text: "删除行" }], a = r.length * n;
    this.ctx.save(), this.drawMenuPanel(e, s, o, a), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < r.length; l++) {
      const h = r[l], c = s + l * n;
      l === i && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, o, n)), this.ctx.fillStyle = l === 2 ? "#f56c6c" : this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + n / 2);
    }
    this.ctx.restore();
  }
  renderHeaderContextMenu(t) {
    const { x: e, y: s, hoveredIndex: i } = t, o = 120, n = 32, r = [{ text: "隐藏此列" }], a = r.length * n;
    this.ctx.save(), this.drawMenuPanel(e, s, o, a), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let l = 0; l < r.length; l++) {
      const h = r[l], c = s + l * n;
      l === i && (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.fillRect(e, c, o, n)), this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.textBaseline = "middle", this.ctx.fillText(h.text, e + 12, c + n / 2);
    }
    this.ctx.restore();
  }
  renderDateDropdown(t) {
    const { x: e, y: s, width: i, currentYear: o, currentMonth: n, selectedDate: r, hoveredDate: a } = t, l = 40, h = 28, c = 28, d = 8, f = l + h + 6 * c + d * 2;
    this.ctx.save(), pt(this.ctx, this.theme, {
      x: e,
      y: s,
      width: i,
      height: f,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: !0
    }), this.ctx.fillStyle = this.theme.colors.dropdown.background, this.ctx.fillRect(e, s, i, f);
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
    this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(m, e + i / 2, s + l / 2);
    const p = 6, x = e + 20, w = e + i - 20, C = s + l / 2;
    this.ctx.fillStyle = this.theme.colors.placeholderText, this.ctx.beginPath(), this.ctx.moveTo(x + p, C - p), this.ctx.lineTo(x - p, C), this.ctx.lineTo(x + p, C + p), this.ctx.closePath(), this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(w - p, C - p), this.ctx.lineTo(w + p, C), this.ctx.lineTo(w - p, C + p), this.ctx.closePath(), this.ctx.fill();
    const y = ["日", "一", "二", "三", "四", "五", "六"], b = (i - d * 2) / 7;
    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`, this.ctx.fillStyle = this.theme.colors.placeholderText;
    for (let D = 0; D < 7; D++) {
      const H = e + d + D * b + b / 2, k = s + l + h / 2;
      this.ctx.fillText(y[D], H, k);
    }
    const E = new Date(o, n, 1).getDay(), R = new Date(o, n + 1, 0).getDate(), T = /* @__PURE__ */ new Date();
    T.setHours(0, 0, 0, 0), this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    for (let D = 1; D <= R; D++) {
      const H = E + D - 1, k = Math.floor(H / 7), O = H % 7, A = e + d + O * b, W = s + l + h + k * c, P = new Date(o, n, D), L = P.getTime() === T.getTime(), _ = r && P.getFullYear() === r.getFullYear() && P.getMonth() === r.getMonth() && P.getDate() === r.getDate(), F = a && P.getFullYear() === a.getFullYear() && P.getMonth() === a.getMonth() && P.getDate() === a.getDate();
      _ ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        A + b / 2,
        W + c / 2,
        Math.min(b, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : F ? (this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg, this.ctx.beginPath(), this.ctx.arc(
        A + b / 2,
        W + c / 2,
        Math.min(b, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.dropdown.text) : L ? (this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg, this.ctx.beginPath(), this.ctx.arc(
        A + b / 2,
        W + c / 2,
        Math.min(b, c) / 2 - 2,
        0,
        Math.PI * 2
      ), this.ctx.fill(), this.ctx.fillStyle = "#ffffff") : this.ctx.fillStyle = this.theme.colors.dropdown.text, this.ctx.fillText(String(D), A + b / 2, W + c / 2);
    }
    this.ctx.strokeStyle = this.theme.colors.dropdown.border, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.roundRect(e, s, i, f, 6), this.ctx.stroke(), this.ctx.restore();
  }
  drawMenuPanel(t, e, s, i) {
    pt(this.ctx, this.theme, {
      x: t,
      y: e,
      width: s,
      height: i,
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
class it {
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
  calculateTextX(t, e, s, i, o, n) {
    const r = n.measureText(t).width;
    switch (o) {
      case "center":
        return e + (s - r) / 2;
      case "right":
        return e + s - i - r;
      default:
        return e + i;
    }
  }
  /**
   * Draw a rounded rectangle
   */
  drawRoundedRect(t, e, s, i, o, n) {
    t.beginPath(), t.moveTo(e + n, s), t.lineTo(e + i - n, s), t.quadraticCurveTo(e + i, s, e + i, s + n), t.lineTo(e + i, s + o - n), t.quadraticCurveTo(e + i, s + o, e + i - n, s + o), t.lineTo(e + n, s + o), t.quadraticCurveTo(e, s + o, e, s + o - n), t.lineTo(e, s + n), t.quadraticCurveTo(e, s, e + n, s), t.closePath();
  }
  /**
   * Truncate text to fit within a given width
   */
  truncateText(t, e, s, i = "...") {
    if (t.measureText(e).width <= s)
      return e;
    let o = e;
    for (; o.length > 0 && t.measureText(o + i).width > s; )
      o = o.slice(0, -1);
    return o + i;
  }
}
class Bt extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "text");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u } = e, f = this.getPadding(), g = this.getTextAlign(l), m = this.formatValue(c, l, h);
    s.font = `${i.font.size}px ${i.font.family}`, s.textBaseline = "middle";
    const p = this.getTextColor(i, d, u);
    s.fillStyle = p;
    const x = r - f * 2, w = this.truncateText(s, m, x), C = this.calculateTextX(w, o, r, f, g, s), y = n + a / 2;
    return s.fillText(w, C, y), { type: "text" };
  }
  getTextColor(e, s, i) {
    return e.colors.cellText;
  }
  formatValue(e, s, i) {
    return e == null ? "" : s.formatter ? s.formatter(e, i, s) : String(e);
  }
}
class we extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "number");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, column: l, row: h, value: c, isSelected: d, isHovered: u } = e, f = this.getPadding(), g = this.getTextAlign(l), m = this.formatValue(c, l, h);
    s.font = `${i.font.size}px ${i.font.family}`, s.textBaseline = "middle";
    const p = this.getTextColor(i, d, u);
    s.fillStyle = p;
    const x = r - f * 2, w = this.truncateText(s, m, x), C = this.calculateTextX(w, o, r, f, g, s), y = n + a / 2;
    return s.fillText(w, C, y), { type: "number" };
  }
  getTextColor(e, s, i) {
    return e.colors.cellText;
  }
  formatValue(e, s, i) {
    return e == null ? "" : s.formatter ? s.formatter(e, i, s) : typeof e == "number" ? e.toLocaleString() : String(e);
  }
}
class Ce extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "checkbox");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = o + (r - d) / 2, f = n + (a - d) / 2, g = h ?? !1;
    return s.fillStyle = g ? i.colors.checkbox.disabledBg : i.colors.button.background, s.strokeStyle = i.colors.checkbox.border, s.lineWidth = 1, s.beginPath(), s.roundRect(u, f, d, d, 3), s.fill(), s.stroke(), c.indeterminate ? (s.strokeStyle = g ? i.colors.checkbox.border : i.colors.checkbox.checkedBg, s.lineWidth = 2, s.beginPath(), s.moveTo(u + 4, f + d / 2), s.lineTo(u + d - 4, f + d / 2), s.stroke()) : c.checked && (s.strokeStyle = g ? i.colors.checkbox.border : i.colors.checkbox.checkedBg, s.lineWidth = 2, s.lineCap = "round", s.lineJoin = "round", s.beginPath(), s.moveTo(u + 4, f + d / 2), s.lineTo(u + d / 2 - 1, f + d - 5), s.lineTo(u + d - 3, f + 4), s.stroke()), { type: "checkbox", config: c };
  }
}
class ye extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "radio");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, d = 16, u = 8, f = 4, g = h ?? !1;
    if (s.save(), s.beginPath(), s.rect(o, n, r, a), s.clip(), c.options && c.options.length > 0) {
      s.font = `${i.font.size}px ${i.font.family}`;
      const m = c.options.map((w) => {
        const C = s.measureText(w.label).width;
        return d + f + C + u;
      });
      let p = o + u;
      const x = o + r - u;
      for (let w = 0; w < c.options.length; w++) {
        const C = c.options[w], y = m[w];
        if (p + y - u > x)
          break;
        const b = p, I = n + (a - d) / 2, E = b + d / 2, R = I + d / 2, T = C.disabled || g, D = c.value === C.value;
        s.fillStyle = T ? i.colors.radio.disabledBg : i.colors.button.background, s.strokeStyle = i.colors.radio.border, s.lineWidth = 1, s.beginPath(), s.arc(E, R, d / 2, 0, Math.PI * 2), s.fill(), s.stroke(), D && (s.fillStyle = T ? i.colors.radio.border : i.colors.radio.checkedBg, s.beginPath(), s.arc(E, R, d / 2 - 4, 0, Math.PI * 2), s.fill()), s.fillStyle = T ? i.colors.placeholderText : i.colors.cellText, s.font = `${i.font.size}px ${i.font.family}`, s.textBaseline = "middle";
        const H = b + d + f;
        s.fillText(C.label, H, R), p += y;
      }
    } else {
      const m = o + (r - d) / 2, p = n + (a - d) / 2, x = m + d / 2, w = p + d / 2;
      s.fillStyle = g ? i.colors.radio.disabledBg : i.colors.button.background, s.strokeStyle = i.colors.radio.border, s.lineWidth = 1, s.beginPath(), s.arc(x, w, d / 2, 0, Math.PI * 2), s.fill(), s.stroke(), c.checked && (s.fillStyle = g ? i.colors.radio.border : i.colors.radio.checkedBg, s.beginPath(), s.arc(x, w, d / 2 - 4, 0, Math.PI * 2), s.fill());
    }
    return s.restore(), { type: "radio", config: c };
  }
}
class ve extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "button");
  }
  render(e) {
    const { value: s, buttonHoverState: i } = e, o = s;
    return this.isButtonsConfig(o) ? this.renderButtons(e, o) : this.renderSingleButton(e, o, i == null ? void 0 : i.progress);
  }
  isButtonsConfig(e) {
    return "buttons" in e;
  }
  renderSingleButton(e, s, i) {
    const { ctx: o, theme: n, x: r, y: a, width: l, height: h, isDisabled: c } = e, d = 8, u = s.size === "small" ? 24 : s.size === "large" ? 40 : 32, f = a + (h - u) / 2, g = c ?? !1, m = s.text ?? "Button";
    o.font = `${n.font.size}px ${n.font.family}`;
    const p = o.measureText(m).width, w = Math.min(
      Math.max(p + 16 * 2, 60),
      l - d * 2
    ), C = r + (l - w) / 2, y = i ?? 0;
    let b, I, E;
    if (g)
      b = n.colors.button.disabledBg, I = n.colors.button.disabledText, E = n.colors.button.disabledBorder;
    else
      switch (s.variant) {
        case "primary":
          b = n.colors.button.primaryBg, I = n.colors.button.primaryText, E = b;
          break;
        case "danger":
          b = n.colors.button.dangerBg, I = n.colors.button.dangerText, E = b;
          break;
        case "warning":
          b = n.colors.button.warningBg, I = n.colors.button.warningText, E = b;
          break;
        case "link":
          b = "transparent", I = n.colors.button.linkText, E = "transparent";
          break;
        default:
          b = n.colors.button.background, I = n.colors.button.text, E = n.colors.button.border;
      }
    if (!g && y > 0 && s.variant !== "link")
      if (s.variant === "default" || !s.variant) {
        const T = this.hexToRgb(n.colors.button.background);
        if ((T.r * 299 + T.g * 587 + T.b * 114) / 1e3 > 128) {
          const H = Math.round(T.r - y * 0.2 * T.r);
          b = `rgb(${H}, ${H}, ${H})`;
        } else {
          const H = Math.round(T.r + y * 0.2 * (255 - T.r));
          b = `rgb(${H}, ${H}, ${H})`;
        }
      } else
        o.globalAlpha = 1 - y * 0.2;
    o.fillStyle = b, o.strokeStyle = E, o.lineWidth = 1;
    const R = 4;
    return o.beginPath(), o.roundRect(C, f, w, u, R), o.fill(), o.stroke(), !g && y > 0 && s.variant !== "link" && (o.globalAlpha = 1), o.fillStyle = I, o.font = `${n.font.size}px ${n.font.family}`, o.textBaseline = "middle", o.textAlign = "center", o.fillText(m, C + w / 2, f + u / 2), o.textAlign = "left", { type: "button", config: s };
  }
  renderButtons(e, s) {
    const { ctx: i, theme: o, x: n, y: r, height: a, isDisabled: l, hoveredButtonIndex: h } = e, c = 8, d = s.gap ?? 4, u = s.maxVisible ?? 3, f = 24, g = r + (a - f) / 2, m = s.buttons.filter((C) => C.visible !== !1), p = m.slice(0, u), x = m.slice(u);
    let w = n + c;
    for (let C = 0; C < p.length; C++) {
      const y = p[C], b = y.text ?? "Button";
      i.font = `${o.font.size}px ${o.font.family}`;
      const I = i.measureText(b).width, E = Math.max(I + 16, 40), R = h === C && !l, T = l ?? !1;
      let D, H, k;
      T ? (D = o.colors.button.disabledBg, H = o.colors.button.disabledText, k = o.colors.button.disabledBorder) : y.variant === "primary" ? (D = o.colors.button.primaryBg, H = o.colors.button.primaryText, k = D) : y.variant === "danger" ? (D = o.colors.button.dangerBg, H = o.colors.button.dangerText, k = D) : y.variant === "warning" ? (D = o.colors.button.warningBg, H = o.colors.button.warningText, k = D) : y.variant === "link" ? (D = "transparent", H = o.colors.button.linkText, k = "transparent") : (D = R ? o.colors.button.hoverBg : o.colors.button.background, H = o.colors.button.text, k = o.colors.button.border), i.fillStyle = D, i.strokeStyle = k, i.lineWidth = 1, i.beginPath(), i.roundRect(w, g, E, f, 4), i.fill(), i.stroke(), i.fillStyle = H, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle", i.textAlign = "center", i.fillText(b, w + E / 2, g + f / 2), w += E + d;
    }
    if (x.length > 0) {
      const C = s.moreButtonText ?? "···", y = i.measureText(C).width, b = Math.max(y + 16, 32), I = h === p.length;
      i.fillStyle = I ? o.colors.button.hoverBg : o.colors.button.background, i.strokeStyle = o.colors.button.border, i.lineWidth = 1, i.beginPath(), i.roundRect(w, g, b, f, 4), i.fill(), i.stroke(), i.fillStyle = o.colors.button.text, i.font = `${o.font.size}px ${o.font.family}`, i.textBaseline = "middle", i.textAlign = "center", i.fillText(C, w + b / 2, g + f / 2);
    }
    return i.textAlign = "left", { type: "buttons", config: s };
  }
  hexToRgb(e) {
    const s = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return s ? {
      r: parseInt(s[1], 16),
      g: parseInt(s[2], 16),
      b: parseInt(s[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
class be extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "switch");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l, isDisabled: h, switchAnimation: c } = e, d = l, u = 44, f = 22, g = 18, m = o + (r - u) / 2, p = n + (a - f) / 2, x = f / 2, w = d.checked ?? !1, C = h ?? !1, y = (c == null ? void 0 : c.progress) ?? (w ? 1 : 0), b = u - g - 4, I = m + 2 + y * b, E = p + (f - g) / 2;
    s.save();
    const R = C ? i.colors.switch.disabledOffBg : i.colors.switch.offBg, T = C ? i.colors.switch.disabledOnBg : i.colors.switch.onBg, D = this.hexToRgb(R), H = this.hexToRgb(T), k = Math.round(D.r + (H.r - D.r) * y), O = Math.round(D.g + (H.g - D.g) * y), A = Math.round(D.b + (H.b - D.b) * y);
    return s.fillStyle = `rgb(${k}, ${O}, ${A})`, s.beginPath(), s.roundRect(m, p, u, f, x), s.fill(), s.fillStyle = i.colors.switch.thumb, s.beginPath(), s.arc(I + g / 2, E + g / 2, g / 2, 0, Math.PI * 2), s.fill(), s.shadowColor = i.colors.shadow.color, s.shadowBlur = i.colors.shadow.blur, s.shadowOffsetX = i.colors.shadow.offsetX, s.shadowOffsetY = i.colors.shadow.offsetY, s.restore(), { type: "switch", config: d };
  }
  hexToRgb(e) {
    const s = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return s ? {
      r: parseInt(s[1], 16),
      g: parseInt(s[2], 16),
      b: parseInt(s[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
const Ft = 32;
class Ie extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "progress");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = h.shape ?? "line";
    return c === "line" ? this.renderLineProgress(s, i, o, n, r, a, h) : c === "circle" ? this.renderCircleProgress(s, i, o, n, r, a, h) : c === "dashboard" && this.renderDashboardProgress(s, i, o, n, r, a, h), { type: "progress", config: h };
  }
  renderLineProgress(e, s, i, o, n, r, a) {
    const h = a.textPosition ?? "right", c = a.showText ?? !0, d = a.size ?? "medium";
    e.save();
    const u = a.height ?? (d === "small" ? 6 : d === "large" ? 16 : 10), f = 8, g = c && h === "right" ? 40 : 0, m = a.width ?? n - 8 * 2 - g, p = i + 8, x = o + (r - u) / 2, w = Math.min(100, Math.max(0, a.value)), C = this.getProgressColor(s, a, w), y = a.trackColor ?? s.colors.progress.track, b = a.borderRadius ?? u / 2;
    e.fillStyle = y, e.beginPath(), e.roundRect(p, x, m, u, b), e.fill();
    const I = w / 100 * m;
    if (I > 0) {
      e.fillStyle = C, e.beginPath();
      const E = Math.max(I, b * 2);
      e.roundRect(p, x, E, u, b), e.fill();
    }
    if (c) {
      const E = a.precision ?? 0, R = a.format ? a.format(w) : `${E === 0 ? Math.round(w) : w.toFixed(E)}%`;
      let T;
      h === "inside" ? T = Math.min(s.font.size, Math.max(10, u - 2)) : T = d === "small" ? 11 : d === "large" ? 14 : s.font.size, e.font = `${T}px ${s.font.family}`, e.textBaseline = "middle", h === "right" ? (e.textAlign = "left", e.fillStyle = a.textColor ?? s.colors.cellText, e.fillText(R, p + m + f, o + r / 2)) : (e.textAlign = "center", e.fillStyle = a.textColor ?? s.colors.cellText, e.fillText(R, p + m / 2, o + r / 2));
    }
    e.restore();
  }
  renderCircleProgress(e, s, i, o, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(Ft * (l === "small" ? 0.6 : l === "large" ? 0.9 : 0.75)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.12)), f = i + n / 2, g = o + r / 2, m = (d - u) / 2, p = Math.min(100, Math.max(0, a.value)), x = this.getProgressColor(s, a, p), w = a.trackColor ?? s.colors.progress.track;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.beginPath(), e.arc(f, g, m, 0, Math.PI * 2), e.stroke();
    const C = p / 100, y = -Math.PI / 2, b = y + C * Math.PI * 2;
    if (C > 0 && (e.strokeStyle = x, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, y, b), e.stroke()), a.showText ?? !0) {
      const I = a.precision ?? 0, E = a.format ? a.format(p) : `${I === 0 ? Math.round(p) : p.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? s.colors.cellText;
      const R = Math.max(8, Math.round(d * 0.32));
      e.font = `bold ${R}px ${s.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(E, f, g);
    }
    e.restore();
  }
  renderDashboardProgress(e, s, i, o, n, r, a) {
    const l = a.size ?? "medium", c = Math.floor(Ft * (l === "small" ? 0.7 : l === "large" ? 0.95 : 0.85)), d = a.width ?? c, u = a.strokeWidth ?? Math.max(2, Math.round(d * 0.1)), f = i + n / 2, g = o + r / 2 + r * 0.05, m = (d - u) / 2, p = Math.min(100, Math.max(0, a.value)), x = this.getProgressColor(s, a, p), w = a.trackColor ?? s.colors.progress.track, C = Math.PI * 0.75, y = Math.PI * 1.5;
    e.save(), e.strokeStyle = w, e.lineWidth = u, e.lineCap = a.strokeLinecap ?? "round", e.beginPath(), e.arc(f, g, m, C, C + y, !1), e.stroke();
    const b = p / 100;
    if (b > 0) {
      const I = C + b * y;
      e.strokeStyle = x, e.beginPath(), e.arc(f, g, m, C, I, !1), e.stroke();
    }
    if (a.showText ?? !0) {
      const I = a.precision ?? 0, E = a.format ? a.format(p) : `${I === 0 ? Math.round(p) : p.toFixed(I)}%`;
      e.fillStyle = a.textColor ?? s.colors.cellText;
      const R = Math.max(8, Math.round(d * 0.28));
      e.font = `bold ${R}px ${s.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(E, f, g);
    }
    e.restore();
  }
  getProgressColor(e, s, i) {
    const { color: o, status: n } = s;
    if (n === "success") return e.colors.progress.success;
    if (n === "warning") return e.colors.progress.warning;
    if (n === "error") return e.colors.progress.error;
    if (typeof o == "string") return o;
    if (typeof o == "function") return o(i);
    if (Array.isArray(o) && o.length > 0) {
      const r = [...o].sort((a, l) => a.value - l.value);
      if (i <= r[0].value) return r[0].color;
      if (i >= r[r.length - 1].value) return r[r.length - 1].color;
      for (let a = 0; a < r.length - 1; a++) {
        const l = r[a], h = r[a + 1];
        if (i >= l.value && i <= h.value) {
          const c = (i - l.value) / (h.value - l.value);
          return this.interpolateColor(l.color, h.color, c);
        }
      }
    }
    return e.colors.progress.default;
  }
  interpolateColor(e, s, i) {
    const o = this.hexToRgb(e), n = this.hexToRgb(s), r = Math.round(o.r + (n.r - o.r) * i), a = Math.round(o.g + (n.g - o.g) * i), l = Math.round(o.b + (n.b - o.b) * i);
    return `rgb(${r}, ${a}, ${l})`;
  }
  hexToRgb(e) {
    const s = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return s ? {
      r: parseInt(s[1], 16),
      g: parseInt(s[2], 16),
      b: parseInt(s[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
const Ee = 32, st = class st extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "image");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l, isHovered: h, hoveredImageIndex: c } = e, d = l;
    if (d.images && d.images.length > 0)
      return this.renderMultipleImages(
        s,
        i,
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
    const f = this.getMaxImageSize(r, a, 4, d), g = d.width ?? 32, m = d.height ?? 32, p = Math.min(g, f), x = Math.min(m, f), w = d.circle ? Math.min(p, x) / 2 : d.borderRadius ?? 0, C = o + (r - p) / 2, y = n + (a - x) / 2;
    if (s.fillStyle = i.colors.image.placeholderBg, s.beginPath(), w > 0 ? s.roundRect(C, y, p, x, w) : s.rect(C, y, p, x), s.fill(), st.failedImages.has(d.src))
      return this.renderImageError(
        s,
        i,
        C,
        y,
        p,
        x,
        w,
        d.errorImage
      ), { type: "image", config: d };
    const b = st.imageCache.get(d.src);
    return b ? (s.save(), s.beginPath(), w > 0 ? s.roundRect(C, y, p, x, w) : s.rect(C, y, p, x), s.clip(), this.drawImageWithFit(
      s,
      b,
      C,
      y,
      p,
      x,
      d.fit ?? "cover"
    ), s.restore()) : st.loadingImages.has(d.src) ? this.renderImagePlaceholder(
      s,
      i,
      C,
      y,
      p,
      x,
      w,
      d.placeholder
    ) : this.renderImagePlaceholder(
      s,
      i,
      C,
      y,
      p,
      x,
      w,
      d.placeholder
    ), h && d.hoverable !== !1 && this.renderImageHover(s, i, C, y, p, x, w), { type: "image", config: d };
  }
  renderMultipleImages(e, s, i, o, n, r, a, l, h) {
    const c = a.images, d = 4, u = this.getMaxImageSize(n, r, d, a), f = a.width ?? 32, g = a.height ?? 32, m = Math.min(f, u), p = Math.min(g, u), x = a.gap ?? 4, w = a.circle ? Math.min(m, p) / 2 : a.borderRadius ?? 0, C = a.showMoreCount !== !1, y = n - d * 2, b = r - d * 2, I = Math.max(1, Math.floor((y + x) / (m + x))), E = Math.max(1, Math.floor((b + x) / (p + x))), R = I * E, T = a.maxVisible ?? R, H = C && c.length > T ? Math.max(1, R - 1) : R, k = Math.max(1, Math.min(T, H)), O = c.length > k, A = O ? k : c.length, W = c.slice(0, A), P = O ? c.length - k : 0, L = A + (O && C ? 1 : 0), _ = Math.max(1, Math.ceil(L / I)), F = Math.min(L, I), Y = F * m + Math.max(0, F - 1) * x, B = _ * p + Math.max(0, _ - 1) * x;
    let z = i + (n - Y) / 2;
    z = Math.max(i + d, z);
    const U = o + (r - B) / 2;
    for (let G = 0; G < W.length; G++) {
      const $ = W[G], Q = Math.floor(G / I), tt = G % I, V = z + tt * (m + x), K = U + Q * (p + x), lt = l && a.hoverable !== !1 && h === G;
      if (e.fillStyle = s.colors.image.placeholderBg, e.beginPath(), w > 0 ? e.roundRect(V, K, m, p, w) : e.rect(V, K, m, p), e.fill(), st.failedImages.has($)) {
        this.renderImageError(
          e,
          s,
          V,
          K,
          m,
          p,
          w,
          a.errorImage
        ), lt && this.renderImageHover(e, s, V, K, m, p, w);
        continue;
      }
      const rt = st.imageCache.get($);
      rt ? (e.save(), e.beginPath(), w > 0 ? e.roundRect(V, K, m, p, w) : e.rect(V, K, m, p), e.clip(), this.drawImageWithFit(
        e,
        rt,
        V,
        K,
        m,
        p,
        a.fit ?? "cover"
      ), e.restore()) : this.renderImagePlaceholder(
        e,
        s,
        V,
        K,
        m,
        p,
        w,
        a.placeholder
      ), lt && this.renderImageHover(e, s, V, K, m, p, w);
    }
    if (O && C) {
      const G = Math.floor(A / I), $ = A % I, Q = z + $ * (m + x), tt = U + G * (p + x), V = l && a.hoverable !== !1 && h === A;
      this.renderMoreCount(
        e,
        s,
        Q,
        tt,
        m,
        p,
        w,
        P,
        V
      );
    }
    return { type: "image", config: a };
  }
  renderImagePlaceholder(e, s, i, o, n, r, a, l) {
    e.fillStyle = s.colors.image.placeholderBg, e.beginPath(), a > 0 ? e.roundRect(i, o, n, r, a) : e.rect(i, o, n, r), e.fill(), l && (e.fillStyle = s.colors.placeholderText, e.font = `${Math.min(12, n / 4)}px ${s.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(l, i + n / 2, o + r / 2), e.textAlign = "left");
  }
  getMaxImageSize(e, s, i, o) {
    const n = o.scaleWithRowHeight === !1 ? Math.min(s, Ee) : s;
    return Math.max(0, Math.min(e, n) - i * 2);
  }
  renderImageError(e, s, i, o, n, r, a, l) {
    if (e.fillStyle = s.colors.image.errorBg ?? "#f0f0f0", e.beginPath(), a > 0 ? e.roundRect(i, o, n, r, a) : e.rect(i, o, n, r), e.fill(), l) {
      const h = st.imageCache.get(l);
      if (h) {
        e.save(), e.beginPath(), a > 0 ? e.roundRect(i, o, n, r, a) : e.rect(i, o, n, r), e.clip(), this.drawImageWithFit(e, h, i, o, n, r, "cover"), e.restore();
        return;
      }
    }
    e.fillStyle = s.colors.placeholderText, e.font = `bold ${Math.min(16, n / 2)}px ${s.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText("!", i + n / 2, o + r / 2), e.textAlign = "left";
  }
  renderImageHover(e, s, i, o, n, r, a) {
    e.strokeStyle = s.colors.image.hoverBorder, e.lineWidth = 2, e.beginPath(), a > 0 ? e.roundRect(i, o, n, r, a) : e.rect(i, o, n, r), e.stroke();
  }
  renderMoreCount(e, s, i, o, n, r, a, l, h) {
    e.fillStyle = h ? s.colors.image.hoverBorder : s.colors.moreCount.background, e.beginPath(), a > 0 ? e.roundRect(i, o, n, r, a) : e.rect(i, o, n, r), e.fill();
    const c = `+${l}`;
    e.fillStyle = s.colors.moreCount.text, e.font = `bold ${s.font.size}px ${s.font.family}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(c, i + n / 2, o + r / 2), e.textAlign = "left";
  }
  drawImageWithFit(e, s, i, o, n, r, a) {
    if (a === "none") {
      e.drawImage(s, i, o, n, r);
      return;
    }
    const l = s.width / s.height, h = n / r;
    let c, d, u, f;
    switch (a) {
      case "cover":
        l > h ? (d = r, c = r * l, u = i - (c - n) / 2, f = o) : (c = n, d = n / l, u = i, f = o - (d - r) / 2);
        break;
      case "contain":
        l > h ? (c = n, d = n / l, u = i, f = o + (r - d) / 2) : (d = r, c = r * l, u = i + (n - c) / 2, f = o);
        break;
      case "fill":
      default:
        u = i, f = o, c = n, d = r;
    }
    e.drawImage(s, u, f, c, d);
  }
  /**
   * Clear all static caches to prevent memory leaks
   */
  static clearCache() {
    st.imageCache.clear(), st.loadingImages.clear(), st.failedImages.clear();
  }
};
/**
 * Image cache reference - set by Renderer during initialization
 */
v(st, "imageCache", /* @__PURE__ */ new Map()), v(st, "loadingImages", /* @__PURE__ */ new Set()), v(st, "failedImages", /* @__PURE__ */ new Set());
let ft = st;
class Se extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "tag");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = 8, { tags: d } = h;
    if (!d || d.length === 0)
      return { type: "tag", config: h };
    const u = 4, f = i.font.size + u * 2, g = 4, m = 4, p = 2, x = "...", w = r - c * 2, C = Math.max(1, Math.floor((a - c * 2) / (f + p))), y = Math.min(h.maxRows ?? C, C), b = /* @__PURE__ */ new Map(), I = (P) => {
      let L = b.get(P);
      return L === void 0 && (L = s.measureText(P).width, b.set(P, L)), L;
    }, E = (P) => {
      const L = `+${P}`;
      return I(L) + u * 2;
    }, R = (P) => I(P.text) + u * 2, T = I(x), D = [];
    let H = [], k = 0, O = 0;
    for (let P = 0; P < d.length; P++) {
      const L = d[P], _ = R(L), F = D.length >= y - 1, Y = d.length - P;
      if (F) {
        const B = Y > 1 ? E(Y - 1) + m : 0, z = w - k - B;
        if (_ <= z)
          H.push({ tag: L, displayText: L.text, width: _ }), k += _ + m, O++;
        else {
          const U = w - k - B;
          if (U >= u * 2 + T + 10) {
            const G = U - u * 2 - T;
            let $ = "", Q = 0, tt = L.text.length;
            for (; Q < tt; ) {
              const V = Math.floor((Q + tt + 1) / 2), K = L.text.slice(0, V);
              I(K) <= G ? (Q = V, $ = K) : tt = V - 1;
            }
            if ($.length > 0) {
              const V = $ + x, K = I(V) + u * 2;
              H.push({ tag: L, displayText: V, width: K }), O++;
            }
          }
          break;
        }
      } else if (_ <= w - k)
        H.push({ tag: L, displayText: L.text, width: _ }), k += _ + m, O++;
      else if (H.length > 0 && D.push(H), H = [{ tag: L, displayText: L.text, width: _ }], k = _ + m, O++, D.length >= y)
        break;
    }
    H.length > 0 && D.length < y && D.push(H);
    const A = D.length * f + (D.length - 1) * p, W = n + (a - A) / 2;
    for (let P = 0; P < D.length; P++) {
      const L = D[P], _ = W + P * (f + p);
      let F = o + c;
      for (const { tag: Y, displayText: B, width: z } of L) {
        let U = Y.bgColor ?? (i.colors.tagColors.default || "#f0f0f0"), G = Y.color ?? i.colors.cellText;
        s.fillStyle = U, s.beginPath(), s.roundRect(F, _, z, f, g), s.fill(), s.fillStyle = G, s.font = `${i.font.size}px ${i.font.family}`, s.textBaseline = "middle";
        const $ = _ + f / 2, Q = F + (z - I(B)) / 2;
        s.fillText(B, Q, $), F += z + m;
      }
      if (P === D.length - 1) {
        const Y = d.length - O;
        if (Y > 0) {
          const B = `+${Y}`, z = E(Y);
          s.fillStyle = i.colors.moreCount.background, s.beginPath(), s.roundRect(F, _, z, f, g), s.fill(), s.fillStyle = i.colors.moreCount.text, s.font = `${i.font.size}px ${i.font.family}`, s.textBaseline = "middle";
          const U = _ + f / 2, G = F + (z - I(B)) / 2;
          s.fillText(B, G, U);
        }
      }
    }
    return { type: "tag", config: h };
  }
}
class Re extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "date");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = 8, d = 20;
    s.strokeStyle = i.colors.date.border, s.lineWidth = 1, s.beginPath(), s.rect(o, n, r, a), s.stroke();
    let u = "";
    if (h.value) {
      const y = h.value instanceof Date ? h.value : new Date(h.value);
      if (!isNaN(y.getTime())) {
        const b = h.format ?? "YYYY-MM-DD";
        u = this.formatDate(y, b);
      }
    }
    const f = h.placeholder ?? "选择日期", g = u || f;
    s.fillStyle = u ? i.colors.cellText : i.colors.placeholderText, s.font = `${i.font.size}px ${i.font.family}`, s.textBaseline = "middle";
    const m = r - c * 2 - d, p = "...";
    let x = g;
    if (s.measureText(g).width > m) {
      let y = g;
      for (; y.length > 0 && s.measureText(y + p).width > m; )
        y = y.slice(0, -1);
      x = y + p;
    }
    s.fillText(x, o + c, n + a / 2), s.strokeStyle = i.colors.date.icon, s.lineWidth = 1.5;
    const w = o + r - c - 10, C = n + a / 2;
    return s.beginPath(), s.moveTo(w - 6, C - 6), s.lineTo(w - 6, C + 6), s.lineTo(w + 6, C + 6), s.lineTo(w + 6, C - 6), s.closePath(), s.stroke(), s.beginPath(), s.moveTo(w - 6, C - 2), s.lineTo(w + 6, C - 2), s.stroke(), s.beginPath(), s.moveTo(w - 3, C - 8), s.lineTo(w - 3, C - 5), s.stroke(), s.beginPath(), s.moveTo(w + 3, C - 8), s.lineTo(w + 3, C - 5), s.stroke(), { type: "date", config: h };
  }
  formatDate(e, s) {
    const i = e.getFullYear(), o = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0"), r = String(e.getHours()).padStart(2, "0"), a = String(e.getMinutes()).padStart(2, "0"), l = String(e.getSeconds()).padStart(2, "0");
    return s.replace("YYYY", String(i)).replace("MM", o).replace("DD", n).replace("HH", r).replace("mm", a).replace("ss", l);
  }
}
class Me extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "select");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l, multipleSelectSeparator: h } = e, c = l, d = 8, u = 20;
    s.strokeStyle = i.colors.input.border, s.lineWidth = 1, s.beginPath(), s.rect(o, n, r, a), s.stroke();
    const f = i.font.size, g = f * 1.5;
    if (c.multiple && Array.isArray(c.value) && c.value.length > 0) {
      const x = this.calculateMaxRows(a, g, d), w = r - d * 2 - u, C = c.value.map((R) => {
        const T = c.options.find((D) => D.value === R);
        return (T == null ? void 0 : T.label) ?? String(R);
      }), y = c.separator ?? h ?? ", ", b = this.wrapTextToLines(s, C.join(y), w, x);
      s.fillStyle = i.colors.cellText, s.font = `${f}px ${i.font.family}`, s.textBaseline = "top";
      const I = b.length * g, E = n + (a - I) / 2;
      for (let R = 0; R < b.length; R++) {
        const T = b[R];
        s.fillText(T, o + d, E + R * g + (g - f) / 2);
      }
    } else {
      let x = "";
      if (c.value !== void 0 && c.value !== null) {
        const I = c.options.find((E) => E.value === c.value);
        x = (I == null ? void 0 : I.label) ?? String(c.value);
      }
      const w = c.placeholder ?? "请选择", C = x || w;
      s.fillStyle = x ? i.colors.cellText : i.colors.placeholderText, s.font = `${f}px ${i.font.family}`, s.textBaseline = "middle";
      const y = r - d * 2 - u, b = this.truncateText(s, C, y);
      s.fillText(b, o + d, n + a / 2);
    }
    s.fillStyle = i.colors.date.icon, s.beginPath();
    const m = o + r - d - 8, p = n + a / 2;
    return s.moveTo(m - 4, p - 2), s.lineTo(m, p + 3), s.lineTo(m + 4, p - 2), s.closePath(), s.fill(), { type: "select", config: c };
  }
  calculateMaxRows(e, s, i = 8) {
    return Math.max(1, Math.floor((e - i * 2) / s));
  }
  wrapTextToLines(e, s, i, o) {
    const n = [];
    let r = "";
    for (const a of s) {
      const l = r + a;
      if (e.measureText(l).width > i && r) {
        if (n.push(r), r = a, n.length >= o) {
          const c = n[o - 1], d = "...";
          let u = c;
          for (; e.measureText(u + d).width > i && u.length > 0; )
            u = u.slice(0, -1);
          return n[o - 1] = u + d, n;
        }
      } else
        r = l;
    }
    return r && n.push(r), n.slice(0, o);
  }
}
class Te extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "input");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l } = e, h = l, c = 8;
    s.strokeStyle = i.colors.input.border, s.lineWidth = 1, s.beginPath(), s.rect(o, n, r, a), s.stroke();
    const d = h.value ?? "", u = h.placeholder ?? "", f = d || u;
    s.fillStyle = d ? i.colors.cellText : i.colors.placeholderText, s.font = `${i.font.size}px ${i.font.family}`, s.textBaseline = "middle";
    const g = r - c * 2;
    if (h.multiline) {
      const m = i.font.size * 1.5, p = h.maxRows ?? 5, x = a - c * 2, w = Math.max(1, Math.floor(x / m)), C = Math.min(p, w), y = this.wrapText(s, f, g), b = y.slice(0, C);
      let I = n + c + m / 2;
      for (let E = 0; E < b.length; E++) {
        let R = b[E];
        const T = E === b.length - 1, D = y.length > b.length;
        T && (R = this.truncateTextWithEllipsis(s, R, g, D)), s.fillText(R, o + c, I), I += m;
      }
    } else {
      const m = this.truncateTextWithEllipsis(s, f, g);
      s.fillText(m, o + c, n + a / 2);
    }
    return { type: "input", config: h };
  }
  wrapText(e, s, i) {
    const o = [], n = s.split(`
`);
    for (const r of n) {
      if (r === "") {
        o.push("");
        continue;
      }
      let a = r;
      for (; a.length > 0; ) {
        const l = this.findLineBreakPoint(e, a, i);
        l === 0 ? (o.push(a[0]), a = a.slice(1)) : (o.push(a.slice(0, l)), a = a.slice(l));
      }
    }
    return o;
  }
  /**
   * 二分查找找到能放入 maxWidth 的最大字符数
   */
  findLineBreakPoint(e, s, i) {
    const o = s.length;
    if (o === 0) return 0;
    if (e.measureText(s).width <= i)
      return o;
    let n = 1, r = o, a = 0;
    for (; n <= r; ) {
      const l = Math.floor((n + r) / 2), h = s.slice(0, l);
      e.measureText(h).width <= i ? (a = l, n = l + 1) : r = l - 1;
    }
    return a;
  }
  truncateTextWithEllipsis(e, s, i, o = !1) {
    const n = "...", r = e.measureText(n).width, a = e.measureText(s).width;
    return a <= i ? o ? a + r <= i ? s + n : this.truncateWithEllipsisBinary(e, s, i, n, r) : s : this.truncateWithEllipsisBinary(e, s, i, n, r);
  }
  /**
   * 二分查找截断文本并添加省略号
   */
  truncateWithEllipsisBinary(e, s, i, o, n) {
    const r = i - n;
    if (r <= 0)
      return o;
    const a = s.length;
    let l = 0, h = a, c = 0;
    for (; l <= h; ) {
      const d = Math.floor((l + h) / 2), u = s.slice(0, d);
      e.measureText(u).width <= r ? (c = d, l = d + 1) : h = d - 1;
    }
    return s.slice(0, c) + o;
  }
}
class De extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "rating");
  }
  render(e) {
    const { ctx: s, x: i, y: o, width: n, height: r, value: a, isDisabled: l } = e, h = a, c = h.value ?? 0, d = h.max ?? 5, u = h.starSize ?? 16, f = h.allowHalf ?? !1, g = h.color ?? "#FFD700", m = h.inactiveColor ?? "#E0E0E0", p = h.disabledColor ?? "#BDBDBD", x = l ? p : g, w = l ? p : m, C = d * u, y = i + (n - C) / 2, b = o + (r - u) / 2;
    s.save();
    const I = [];
    for (let E = 0; E < d; E++) {
      const R = y + E * u;
      I.push({
        index: E,
        x: R,
        width: u
      });
      const T = c - E;
      let D = 0;
      T >= 1 ? D = 1 : T > 0 && (D = f ? T : 0), this.drawStar(s, R, b, u, D, x, w);
    }
    return s.restore(), {
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
  drawStar(e, s, i, o, n, r, a) {
    const l = s + o / 2, h = i + o / 2, c = o / 2, d = c * 0.4, u = this.getStarPoints(l, h, c, d);
    e.beginPath(), e.moveTo(u[0].x, u[0].y);
    for (let f = 1; f < u.length; f++)
      e.lineTo(u[f].x, u[f].y);
    if (e.closePath(), e.fillStyle = a, e.fill(), n > 0) {
      e.save(), e.beginPath(), e.rect(s, i, o * n, o), e.clip(), e.beginPath(), e.moveTo(u[0].x, u[0].y);
      for (let f = 1; f < u.length; f++)
        e.lineTo(u[f].x, u[f].y);
      e.closePath(), e.fillStyle = r, e.fill(), e.restore();
    }
  }
  /**
   * Calculate star points coordinates
   */
  getStarPoints(e, s, i, o) {
    const n = [], r = Math.PI / 5, a = -Math.PI / 2;
    for (let l = 0; l < 10; l++) {
      const h = a + l * r, c = l % 2 === 0 ? i : o;
      n.push({
        x: e + c * Math.cos(h),
        y: s + c * Math.sin(h)
      });
    }
    return n;
  }
}
const He = 32;
class ke extends it {
  constructor() {
    super(...arguments);
    v(this, "type", "color");
  }
  render(e) {
    const { ctx: s, theme: i, x: o, y: n, width: r, height: a, value: l, isDisabled: h } = e, c = l, u = Math.min(He - 8 * 2, 24), f = o + (r - u) / 2, g = n + (a - u) / 2;
    return s.fillStyle = c.value || "#ffffff", s.fillRect(f, g, u, u), s.strokeStyle = h ? "#bdbdbd" : "#d9d9d9", s.lineWidth = 1, s.strokeRect(f, g, u, u), c.showText && (s.fillStyle = this.getContrastColor(c.value || "#ffffff"), s.font = `${i.font.size}px ${i.font.family}`, s.textAlign = "center", s.textBaseline = "middle", s.fillText(c.value || "", f + u / 2, g + u / 2)), { type: "color", config: c };
  }
  getContrastColor(e) {
    const s = this.hexToRgb(e);
    return (0.299 * s.r + 0.587 * s.g + 0.114 * s.b) / 255 > 0.5 ? "#000000" : "#ffffff";
  }
  hexToRgb(e) {
    const s = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    return s ? {
      r: parseInt(s[1], 16),
      g: parseInt(s[2], 16),
      b: parseInt(s[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }
}
class Oe {
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
    const s = this.stats.get(t) || {
      totalTime: 0,
      callCount: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: 1 / 0
    };
    if (s.totalTime += e, s.callCount++, s.avgTime = s.totalTime / s.callCount, s.maxTime = Math.max(s.maxTime, e), s.minTime = Math.min(s.minTime, e), this.stats.set(t, s), this.currentFrame) {
      const i = this.currentFrame.rendererTimes.get(t) || [];
      i.push(e), this.currentFrame.rendererTimes.set(t, i), this.currentFrame.cellCount++;
    }
  }
  /**
   * Measure the execution time of a render function
   */
  measure(t, e) {
    if (!this.enabled)
      return e();
    const s = performance.now(), i = e(), o = performance.now() - s;
    return this.recordRender(t, o), i;
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
    return this.frameHistory.length === 0 ? 0 : this.frameHistory.reduce((e, s) => e + s.totalFrameTime, 0) / this.frameHistory.length;
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
    return Array.from(this.stats.entries()).map(([s, i]) => ({ type: s, stats: i })).sort((s, i) => i.stats.avgTime - s.stats.avgTime).slice(0, t);
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
    for (const { type: s, stats: i } of e)
      t.push(
        `${s.padEnd(15)} | calls: ${i.callCount.toString().padStart(6)} | avg: ${i.avgTime.toFixed(3).padStart(8)}ms | max: ${i.maxTime.toFixed(3).padStart(8)}ms | total: ${i.totalTime.toFixed(1).padStart(8)}ms`
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
let vt = null;
function Le() {
  return vt || (vt = new Oe()), vt;
}
class We {
  constructor() {
    v(this, "renderers", /* @__PURE__ */ new Map());
    v(this, "defaultRenderer");
    v(this, "performanceMonitor");
    this.register(new Bt()), this.register(new we()), this.register(new Ce()), this.register(new ye());
    const t = new ve();
    this.register(t), this.renderers.set("buttons", t), this.register(new be()), this.register(new Ie()), this.register(new ft()), this.register(new Se()), this.register(new Re()), this.register(new Me()), this.register(new Te()), this.register(new De()), this.register(new ke()), this.defaultRenderer = new Bt(), this.performanceMonitor = Le();
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
    const e = t.column.type ?? "text", s = this.renderers.get(e) ?? this.defaultRenderer;
    return this.performanceMonitor.measure(e, () => s.render(t));
  }
  /**
   * Create a render context
   */
  createContext(t) {
    return t;
  }
}
class Pe {
  constructor(t) {
    v(this, "measurementEngine");
    v(this, "layoutResults", []);
    this.measurementEngine = t;
  }
  /**
   * 计算元素树布局，返回所有元素的绝对坐标
   */
  layout(t, e, s) {
    return this.layoutResults = [], this.layoutElement(t, e, s), this.layoutResults.sort((i, o) => (i.zIndex ?? 0) - (o.zIndex ?? 0));
  }
  layoutElement(t, e, s) {
    if (t.type === "CTGroup" && t.props.display === "flex")
      return this.layoutGroup(t, e, s);
    if (t.type === "CTGroup" && t.props.position === "relative")
      return this.layoutPositionedGroup(t, e, s);
    const i = this.measurementEngine.measureElement(t), o = t.props.zIndex, n = { x: e, y: s, width: i.width, height: i.height, zIndex: o };
    return this.layoutResults.push(n), n;
  }
  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  layoutPositionedGroup(t, e, s) {
    const i = t.props, o = t.children || [], n = i.width ?? 100, r = i.height ?? 100, a = [...o].sort((l, h) => {
      const c = l.props.zIndex ?? 0, d = h.props.zIndex ?? 0;
      return c - d;
    });
    for (const l of a) {
      const h = e + (l.props.x ?? 0), c = s + (l.props.y ?? 0);
      this.layoutElement(l, h, c);
    }
    return { x: e, y: s, width: n, height: r };
  }
  layoutGroup(t, e, s) {
    const i = t.props, o = t.children || [], n = this.parsePadding(i.padding), r = o.map((f) => {
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
    }), a = this.calculateContentSize(r, i), l = this.calculateContentHeight(r, i), h = i.width ?? a + n.left + n.right, c = i.height ?? l + n.top + n.bottom, d = e + n.left, u = s + n.top;
    return this.layoutChildren(o, r, d, u, i), { x: e, y: s, width: h, height: c };
  }
  /**
   * 测量 group 尺寸，不影响 layoutResults
   */
  measureGroupSize(t) {
    const e = t.props, s = t.children || [], i = this.parsePadding(e.padding), o = s.map((h) => h.type === "CTGroup" && h.props.display === "flex" ? this.measureGroupSize(h) : this.measurementEngine.measureElement(h)), n = this.calculateContentSize(o, e), r = this.calculateContentHeight(o, e), a = e.width ?? n + i.left + i.right, l = e.height ?? r + i.top + i.bottom;
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
    const s = e.gap ?? 0, i = e.flexDirection ?? "row";
    if (i === "row" || i === "row-reverse") {
      const o = t.reduce((r, a) => r + a.width, 0), n = t.length > 1 ? (t.length - 1) * s : 0;
      return o + n;
    } else
      return Math.max(...t.map((o) => o.width), 0);
  }
  calculateContentHeight(t, e) {
    const s = e.gap ?? 0, i = e.flexDirection ?? "row";
    if (i === "column" || i === "column-reverse") {
      const o = t.reduce((r, a) => r + a.height, 0), n = t.length > 1 ? (t.length - 1) * s : 0;
      return o + n;
    } else
      return Math.max(...t.map((o) => o.height), 0);
  }
  layoutChildren(t, e, s, i, o) {
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
      let C, y;
      n === "row" ? (C = s + g, y = i + w) : n === "row-reverse" ? (C = s + d - g - x.width, y = i + w) : n === "column" ? (C = s + w, y = i + g) : (C = s + w, y = i + u - g - x.height), this.layoutElement(p, C, y), g += (n === "row" || n === "row-reverse" ? x.width : x.height) + l;
    }
  }
}
class Ae {
  constructor(t) {
    v(this, "ctx");
    this.ctx = t;
  }
  measureTextWidth(t, e, s) {
    return this.ctx.font = `${e}px ${s}`, this.ctx.measureText(t).width;
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
    const e = t.props, s = e.fontSize ?? 14, i = e.fontFamily ?? "Arial", o = e.lineHeight ?? s;
    let n = this.measureTextWidth(e.text, s, i);
    return e.maxWidth && n > e.maxWidth && (n = e.maxWidth), { x: 0, y: 0, width: n, height: o };
  }
  measureRect(t) {
    const e = t.props;
    return { x: 0, y: 0, width: e.width, height: e.height };
  }
  measureCircle(t) {
    const s = t.props.radius * 2;
    return { x: 0, y: 0, width: s, height: s };
  }
  measureImage(t) {
    const e = t.props;
    return { x: 0, y: 0, width: e.width, height: e.height };
  }
  measureLine(t) {
    const e = t.props;
    if (e.points.length === 0)
      return { x: 0, y: 0, width: 0, height: 0 };
    const s = e.points.map((l) => l.x), i = e.points.map((l) => l.y), o = Math.min(...s), n = Math.max(...s), r = Math.min(...i), a = Math.max(...i);
    return { x: o, y: r, width: n - o, height: a - r };
  }
}
class _e {
  constructor(t, e, s) {
    v(this, "ctx");
    v(this, "layoutEngine");
    v(this, "theme");
    v(this, "layouts", []);
    this.ctx = t, this.layoutEngine = e, this.theme = s;
  }
  /**
   * Render element tree
   */
  render(t, e, s) {
    this.layouts = this.layoutEngine.layout(t, e, s), this.ctx.save(), this.renderElement(t, e, s), this.ctx.restore();
  }
  getLayouts() {
    return this.layouts;
  }
  renderElement(t, e, s) {
    switch (t.type) {
      case "CTGroup":
        this.renderGroup(t, e, s);
        break;
      case "CTRect":
        this.renderRect(t, e, s);
        break;
      case "CTCircle":
        this.renderCircle(t, e, s);
        break;
      case "CTText":
        this.renderText(t, e, s);
        break;
      case "CTImage":
        this.renderImage(t, e, s);
        break;
      case "CTLine":
        this.renderLine(t, e, s);
        break;
    }
  }
  renderGroup(t, e, s) {
    const i = t.props;
    if (i.backgroundColor) {
      const n = this.calculateGroupBounds(
        this.layoutEngine.layout(t, e, s),
        e,
        s,
        i
      );
      this.ctx.fillStyle = i.backgroundColor, i.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(
        e,
        s,
        n.width,
        n.height,
        i.borderRadius
      ), this.ctx.fill()) : this.ctx.fillRect(e, s, n.width, n.height), i.borderColor && i.borderWidth && (this.ctx.strokeStyle = i.borderColor, this.ctx.lineWidth = i.borderWidth, i.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(
        e,
        s,
        n.width,
        n.height,
        i.borderRadius
      ), this.ctx.stroke()) : this.ctx.strokeRect(e, s, n.width, n.height));
    }
    const o = t.children || [];
    if (i.position === "relative") {
      const n = [...o].sort((r, a) => {
        const l = r.props.zIndex ?? 0, h = a.props.zIndex ?? 0;
        return l - h;
      });
      for (const r of n) {
        const a = e + (r.props.x ?? 0), l = s + (r.props.y ?? 0);
        this.renderElement(r, a, l);
      }
    } else if (i.display === "flex") {
      const n = this.layoutEngine.layout(t, e, s);
      for (let r = 0; r < o.length; r++) {
        const a = n[r];
        a && this.renderElement(o[r], a.x, a.y);
      }
    }
  }
  renderRect(t, e, s) {
    const i = t.props;
    this.ctx.save(), i.opacity !== void 0 && (this.ctx.globalAlpha = i.opacity), i.backgroundColor && (this.ctx.fillStyle = i.backgroundColor, i.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(e, s, i.width, i.height, i.borderRadius), this.ctx.fill()) : this.ctx.fillRect(e, s, i.width, i.height)), i.borderColor && i.borderWidth && (this.ctx.strokeStyle = i.borderColor, this.ctx.lineWidth = i.borderWidth, i.borderRadius ? (this.ctx.beginPath(), this.ctx.roundRect(e, s, i.width, i.height, i.borderRadius), this.ctx.stroke()) : this.ctx.strokeRect(e, s, i.width, i.height)), this.ctx.restore();
  }
  renderCircle(t, e, s) {
    const i = t.props, o = e + i.radius, n = s + i.radius, r = i.startAngle ?? 0, a = i.endAngle ?? Math.PI * 2;
    this.ctx.beginPath(), this.ctx.arc(o, n, i.radius, r, a, !1), i.backgroundColor && (this.ctx.fillStyle = i.backgroundColor, this.ctx.fill()), i.borderColor && i.borderWidth && (this.ctx.strokeStyle = i.borderColor, this.ctx.lineWidth = i.borderWidth, this.ctx.stroke());
  }
  renderText(t, e, s) {
    const i = t.props, o = i.fontSize ?? this.theme.font.size, n = i.fontFamily ?? this.theme.font.family, r = i.fontWeight ?? "normal", a = i.fontStyle ?? "normal", l = i.color ?? this.theme.colors.cellText, h = i.lineHeight ?? o;
    this.ctx.font = `${a} ${r} ${o}px ${n}`, this.ctx.fillStyle = l, this.ctx.textAlign = "left", this.ctx.textBaseline = "middle";
    const c = e, d = s + h / 2;
    i.maxWidth ? this.ctx.fillText(i.text, c, d, i.maxWidth) : this.ctx.fillText(i.text, c, d), this.ctx.textAlign = "left", this.ctx.textBaseline = "alphabetic";
  }
  renderImage(t, e, s) {
    const i = t.props;
    this.ctx.strokeStyle = "#d9d9d9", this.ctx.lineWidth = 1, this.ctx.strokeRect(e, s, i.width, i.height);
  }
  renderLine(t, e, s) {
    const i = t.props;
    if (!(i.points.length < 2)) {
      this.ctx.beginPath(), this.ctx.strokeStyle = i.strokeColor ?? "#333333", this.ctx.lineWidth = i.strokeWidth ?? 1, this.ctx.lineCap = i.strokeLinecap ?? "butt", this.ctx.moveTo(e + i.points[0].x, s + i.points[0].y);
      for (let o = 1; o < i.points.length; o++)
        this.ctx.lineTo(e + i.points[o].x, s + i.points[o].y);
      this.ctx.stroke();
    }
  }
  calculateGroupBounds(t, e, s, i) {
    if (i != null && i.width && (i != null && i.height))
      return { x: e, y: s, width: i.width, height: i.height };
    if (t.length === 0)
      return { x: e, y: s, width: 0, height: 0 };
    const o = Math.min(...t.map((l) => l.x)), n = Math.max(...t.map((l) => l.x + l.width)), r = Math.min(...t.map((l) => l.y)), a = Math.max(...t.map((l) => l.y + l.height));
    return { x: o, y: r, width: n - o, height: a - r };
  }
}
const Be = 32;
class Fe {
  constructor(t, e, s) {
    v(this, "canvas");
    v(this, "ctx");
    v(this, "theme");
    v(this, "layoutManager");
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
    v(this, "currentScrollTop", 0);
    v(this, "rowHeight", 0);
    v(this, "currentHoveredCell", null);
    v(this, "currentHoveredImageIndex", -1);
    v(this, "currentHoveredButtonIndex", -1);
    v(this, "currentProgressDragState");
    v(this, "currentRowResizeState");
    // 渲染缓存相关
    v(this, "renderCache", null);
    v(this, "rowIdManager", new re());
    v(this, "columnIdManager", new ae());
    // 图片加载完成后的渲染触发回调
    v(this, "onImageLoaded", null);
    this.canvas = t, this.ctx = this.getContext(t), this.theme = e, this.layoutManager = s, this.dpr = mt(), this.offscreenCanvas = document.createElement("canvas"), this.offscreenCtx = this.getContext(this.offscreenCanvas), this.cellRendererRegistry = new We(), this.dropdownRenderer = new ue(
      this.ctx,
      this.theme,
      (i) => this.measureTextWidth(i)
    ), this.filterDropdownRenderer = new fe(this.ctx, this.theme), this.imageOverlayRenderer = new pe(this.ctx, this.theme, {
      get: (i, o) => this.imageLoadQueue.get(i, o),
      isLoading: (i) => this.imageLoadQueue.isLoading(i),
      load: (i, o) => this.loadImage(i, o),
      collectVisible: (i) => this.collectVisibleImage(i)
    }), this.overlayRenderer = new xe(
      this.canvas,
      this.ctx,
      this.theme,
      this.layoutManager,
      this.dpr
    ), this.imageLoadQueue = new At();
  }
  // 当前字体配置的 key
  // 动态行高支持
  /**
   * 根据单元格高度计算可显示行数
   */
  calculateMaxRows(t, e, s = 8) {
    return Math.max(1, Math.floor((t - s * 2) / e));
  }
  /**
   * 多行文本换行
   */
  wrapTextToLines(t, e, s) {
    const i = [];
    let o = "";
    for (const n of t) {
      const r = o + n;
      if (this.ctx.measureText(r).width > e) {
        if (o && i.push(o), o = n, i.length >= s) break;
      } else
        o = r;
    }
    if (o && i.length < s && i.push(o), i.length === s && t.length > i.join("").length) {
      const n = i[i.length - 1], r = "...";
      let a = n;
      for (; a.length > 0 && this.ctx.measureText(a + r).width > e; )
        a = a.slice(0, -1);
      i[i.length - 1] = a + r;
    }
    return i;
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
    this.imageLoadQueue = new At({
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
    const s = mt();
    s !== this.dpr && (this.dpr = s, this.overlayRenderer.setDpr(s)), this.canvas.width = t * this.dpr, this.canvas.height = e * this.dpr, this.canvas.style.width = `${t}px`, this.canvas.style.height = `${e}px`, this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), this.offscreenCanvas.width = t * this.dpr, this.offscreenCanvas.height = e * this.dpr, this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  updateTheme(t) {
    this.theme = t, this.dropdownRenderer.setTheme(t), this.filterDropdownRenderer.setTheme(t), this.imageOverlayRenderer.setTheme(t), this.overlayRenderer.setTheme(t);
  }
  markDirty(t, e, s, i) {
    this.dirtyRegions.push({ x: t, y: e, width: s, height: i });
  }
  markFullRedraw() {
  }
  render(t, e, s, i, o, n) {
    var C, y, b;
    this.currentSwitchAnimations = n.switchAnimations, this.currentButtonHoverStates = n.buttonHoverStates, this.currentHoveredCell = n.hoveredCell, this.currentHoveredImageIndex = n.hoveredImageIndex ?? -1, this.currentHoveredButtonIndex = n.hoveredButtonIndex ?? -1, this.currentProgressDragState = n.progressDragState, this.currentRowResizeState = n.rowResizeState, this.beginFrame(), this.currentVisibleRange = s, this.currentScrollTop = o, this.rowHeight = this.theme.row.height;
    const { startRow: r, endRow: a } = s, l = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = this.theme.colors.background, this.ctx.fillRect(0, 0, l, h);
    const c = this.layoutManager.getLeafColumns(), d = this.layoutManager.getFixedColumnsInfo(t), u = d.leftFixed.columns.length > 0, f = d.rightFixed.columns.length > 0;
    this.hoveredPlaceholderColumnIndex = n.hoveredCell && ((C = c[n.hoveredCell.columnIndex]) != null && C.key.startsWith("__hidden_placeholder__")) ? n.hoveredCell.columnIndex : -1;
    const g = u ? d.leftFixed.width : 0, m = l - (f ? d.rightFixed.width : 0), p = this.layoutManager.getVisibleCenterColumnIndices(), x = [], w = [];
    for (let I = 0; I < c.length; I++) {
      const E = c[I];
      E && (E.fixed === "left" && x.push(I), E.fixed === "right" && w.push(I));
    }
    this.ctx.save(), this.ctx.beginPath(), this.ctx.rect(g, 0, m - g, h), this.ctx.clip(), this.renderCenterRows(
      c,
      e,
      r,
      a,
      p,
      i,
      o,
      {
        ...n,
        dragColumnIndex: (y = n.columnReorderState) == null ? void 0 : y.dragColumnIndex,
        columnReorderState: n.columnReorderState
      }
    ), this.ctx.restore(), this.renderCenterSelections(n.selectedCells, i, o, p), n.showHeader && this.renderCenterHeader(
      t,
      p,
      o,
      n.sortConfig,
      n.filterConfig,
      i,
      n.hoveredHeaderColumnKey,
      (b = n.columnReorderState) == null ? void 0 : b.dragColumnIndex,
      n.columnReorderState
    ), u && this.renderFixedColumnsContent(c, e, x, 0, o, n), f && this.renderFixedColumnsContent(
      c,
      e,
      w,
      l - d.rightFixed.width,
      o,
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
    )), this.renderRowResizeGuide(l), n.dropdown && this.renderDropdown(n.dropdown), n.headerContextMenu && this.renderHeaderContextMenu(n.headerContextMenu), n.columnReorderState && this.renderColumnReorderIndicator(n.columnReorderState, e, s, o), this.ctx.restore(), this.commitVisibleImages(), this.dirtyRegions = [];
  }
  renderCenterHeader(t, e, s, i, o, n, r, a, l) {
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
      const p = this.layoutManager.getLeafColumns().findIndex((y) => y === g.column), x = e.indexOf(p);
      let w = g.x - n;
      if (x !== -1) {
        let y = 0;
        for (let I = 0; I < x; I++) {
          const E = e[I];
          E !== void 0 && (y += this.layoutManager.getColumnWidthByIndex(E));
        }
        w = this.layoutManager.getColumnOffset(e[0]) - n + y;
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
        i,
        o,
        C,
        !1,
        p
      );
    }
    this.endFrame(), this.ctx.restore();
  }
  renderHeaderCellMultiLevel(t, e, s, i, o, n, r, a, l, h = !1, c = !1, d = -1) {
    var O, A;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const W = this.hoveredPlaceholderColumnIndex === d;
      this.ctx.fillStyle = W ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, s, i, o), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, s, i, o);
      return;
    }
    const u = 8, g = t.reorderable !== !1 && h, m = g ? 10 : 0;
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, s, i, o), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const p = a.find((W) => W.column === t.key), x = (p == null ? void 0 : p.direction) ?? "none", w = t.sortable !== !1, C = !((O = t.children) != null && O.length) && w && (x !== "none" || h), y = C ? 20 : 0, b = l.some((W) => W.column === t.key), I = !((A = t.children) != null && A.length) && t.filterable && (b || h), E = I ? 20 : 0, R = i - u * 2 - y - E - m - (g ? 4 : 0), T = ct(t.title, Math.floor(R / 7)), D = t.align ?? "center";
    let H = e + u + m + (g ? 4 : 0);
    D === "center" ? (H = e + (i - this.ctx.measureText(T).width - y - E) / 2, g && (H = Math.max(H, e + u + m + 4))) : D === "right" && (H = e + i - u - this.ctx.measureText(T).width - y - E);
    const k = s + o / 2;
    if (this.ctx.fillText(T, H, k), g && this.renderDragHandle(e + u, s + o / 2), I) {
      const W = e + i - u - 10;
      C && this.renderSortIndicator(
        W - 16,
        k,
        x === "none" ? "hover" : x
      ), this.renderFilterIndicator(W, k, b);
    } else C && this.renderSortIndicator(
      e + i - u - 10,
      k,
      x === "none" ? "hover" : x
    );
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, s, i, o);
  }
  renderCenterRows(t, e, s, i, o, n, r, a) {
    var d;
    const l = /* @__PURE__ */ new Set(), h = (d = this.currentRowResizeState) == null ? void 0 : d.rowIndex;
    for (let u = s; u <= i; u++) {
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
    const c = h !== void 0 && h >= s && h <= i ? e[h] : void 0;
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
  renderCenterRow(t, e, s, i, o, n, r, a, l) {
    var m, p;
    const h = this.layoutManager.getRowOffset(i), c = this.getRenderedRowHeight(i), d = h - r;
    let u = this.theme.colors.rowBackground;
    a.stripeRows && i % 2 === 1 && (u = this.theme.colors.rowAltBackground), s.selected && (u = this.theme.colors.rowSelectedBackground), ((m = a.hoveredCell) == null ? void 0 : m.rowIndex) === i && (u = this.theme.colors.rowHoverBackground);
    for (const x of o) {
      if (this.layoutManager.isCellMerged(i, x) || !t[x]) continue;
      const C = o.indexOf(x);
      let y;
      if (C !== -1) {
        let I = 0;
        for (let R = 0; R < C; R++) {
          const T = o[R];
          T !== void 0 && (I += this.layoutManager.getColumnWidthByIndex(T));
        }
        y = this.layoutManager.getColumnOffset(o[0]) - n + I;
      } else
        y = this.layoutManager.getColumnOffset(x) - n;
      const b = this.layoutManager.getColumnWidthByIndex(x);
      this.ctx.fillStyle = u, this.ctx.fillRect(y, d, b, c);
    }
    const g = this.layoutManager.getMergesAffectingRow(i);
    for (const x of g) {
      if (!o.includes(x.columnIndex)) continue;
      const w = `${x.rowIndex}-${x.columnIndex}`;
      if (l.has(w)) continue;
      const C = e[x.rowIndex];
      if (!C) continue;
      const y = this.layoutManager.getMergedCellPosition(x.rowIndex, x.columnIndex);
      if (!y) continue;
      const b = t[x.columnIndex];
      if (!b) continue;
      const I = C.data[X(b)], R = ((p = a.hoveredCell) == null ? void 0 : p.rowIndex) !== void 0 && a.hoveredCell.rowIndex >= x.rowIndex && a.hoveredCell.rowIndex < x.rowIndex + x.rowspan ? this.theme.colors.rowHoverBackground : u, T = y.x - n, D = y.y - r;
      this.ctx.fillStyle = R, this.ctx.fillRect(T, D, y.width, y.height), this.renderCellWithPosition(
        b,
        C,
        x.rowIndex,
        x.columnIndex,
        I,
        T,
        D,
        y.width,
        y.height,
        a
      ), l.add(w);
    }
    for (const x of o) {
      const w = t[x];
      if (!w || this.layoutManager.isCellMerged(i, x) || this.layoutManager.getCellMerge(i, x))
        continue;
      const y = s.data[X(w)], b = o.indexOf(x);
      let I;
      if (b !== -1) {
        let H = 0;
        for (let O = 0; O < b; O++) {
          const A = o[O];
          A !== void 0 && (H += this.layoutManager.getColumnWidthByIndex(A));
        }
        I = this.layoutManager.getColumnOffset(o[0]) - n + H;
      } else
        I = this.layoutManager.getColumnOffset(x) - n;
      const E = this.layoutManager.getColumnWidthByIndex(x), T = this.layoutManager.getRowOffset(i) - r, D = this.getRenderedRowHeight(i);
      this.renderCellWithPosition(
        w,
        s,
        i,
        x,
        y,
        I,
        T,
        E,
        D,
        a
      );
    }
  }
  renderFixedColumnsContent(t, e, s, i, o, n) {
    var d, u, f;
    const r = this.canvas.height / this.dpr;
    this.ctx.save();
    let a = 0;
    for (const g of s)
      a += this.layoutManager.getColumnWidthByIndex(g);
    const l = /* @__PURE__ */ new Set(), h = (d = this.currentRowResizeState) == null ? void 0 : d.rowIndex;
    for (let g = 0; g < e.length; g++) {
      if (g === h)
        continue;
      const m = e[g];
      if (!m) continue;
      const p = this.layoutManager.getRowOffset(g), x = this.getRenderedRowHeight(g), w = p - o;
      if (p + x < o || p > o + r)
        continue;
      let C = this.theme.colors.rowBackground;
      n.stripeRows && g % 2 === 1 && (C = this.theme.colors.rowAltBackground), m.selected && (C = this.theme.colors.rowSelectedBackground), ((u = n.hoveredCell) == null ? void 0 : u.rowIndex) === g && (C = this.theme.colors.rowHoverBackground);
      for (const E of s) {
        if (this.layoutManager.isCellMerged(g, E))
          continue;
        const R = this.layoutManager.getColumnWidthByIndex(E), T = i + this.layoutManager.getColumnOffset(E) - this.layoutManager.getColumnOffset(s[0]);
        this.ctx.fillStyle = C, this.ctx.fillRect(T, w, R, x);
      }
      const b = this.layoutManager.getMergesAffectingRow(g);
      for (const E of b) {
        if (!s.includes(E.columnIndex)) continue;
        const R = `${E.rowIndex}-${E.columnIndex}`;
        if (l.has(R)) continue;
        const T = e[E.rowIndex];
        if (!T) continue;
        const D = this.layoutManager.getMergedCellPosition(
          E.rowIndex,
          E.columnIndex
        );
        if (!D) continue;
        const H = t[E.columnIndex];
        if (!H) continue;
        const k = T.data[X(H)];
        let O = 0;
        const A = i + this.layoutManager.getColumnOffset(E.columnIndex) - this.layoutManager.getColumnOffset(s[0]);
        for (let _ = 0; _ < E.colspan; _++) {
          const F = E.columnIndex + _;
          s.includes(F) && (O += this.layoutManager.getColumnWidthByIndex(F));
        }
        const P = ((f = n.hoveredCell) == null ? void 0 : f.rowIndex) !== void 0 && n.hoveredCell.rowIndex >= E.rowIndex && n.hoveredCell.rowIndex < E.rowIndex + E.rowspan ? this.theme.colors.rowHoverBackground : C, L = D.y - o;
        this.ctx.fillStyle = P, this.ctx.fillRect(A, L, O, D.height), this.renderCellWithPosition(
          H,
          T,
          E.rowIndex,
          E.columnIndex,
          k,
          A,
          L,
          O,
          D.height,
          n
        ), l.add(R);
      }
      let I = i;
      for (const E of s) {
        const R = t[E];
        if (!R) {
          I += this.layoutManager.getColumnWidthByIndex(E);
          continue;
        }
        if (this.layoutManager.isCellMerged(g, E)) {
          I += this.layoutManager.getColumnWidthByIndex(E);
          continue;
        }
        if (this.layoutManager.getCellMerge(g, E)) {
          I += this.layoutManager.getColumnWidthByIndex(E);
          continue;
        }
        const D = this.layoutManager.getColumnWidthByIndex(E), H = m.data[X(R)];
        this.renderCellWithPosition(
          R,
          m,
          g,
          E,
          H,
          I,
          w,
          D,
          x,
          n
        ), I += D;
      }
    }
    const c = h !== void 0 ? e[h] : void 0;
    h !== void 0 && c && this.renderFixedRowOverlay(
      t,
      c,
      h,
      s,
      i,
      o,
      n
    ), this.ctx.restore();
  }
  renderFixedRowOverlay(t, e, s, i, o, n, r) {
    var f;
    const a = this.layoutManager.getRowOffset(s), l = this.getRenderedRowHeight(s), h = a - n, c = this.canvas.height / this.dpr;
    if (a + l < n || a > n + c)
      return;
    let d = this.theme.colors.rowBackground;
    r.stripeRows && s % 2 === 1 && (d = this.theme.colors.rowAltBackground), e.selected && (d = this.theme.colors.rowSelectedBackground), ((f = r.hoveredCell) == null ? void 0 : f.rowIndex) === s && (d = this.theme.colors.rowHoverBackground);
    let u = o;
    for (const g of i) {
      const m = this.layoutManager.getColumnWidthByIndex(g), p = t[g];
      if (!p) {
        u += m;
        continue;
      }
      if (this.layoutManager.isCellMerged(s, g)) {
        u += m;
        continue;
      }
      const x = this.layoutManager.getCellMerge(s, g);
      if (x && (x.rowIndex !== s || x.columnIndex !== g)) {
        u += m;
        continue;
      }
      this.ctx.fillStyle = d, this.ctx.fillRect(u, h, m, l);
      const w = e.data[X(p)];
      this.renderCellWithPosition(
        p,
        e,
        s,
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
  renderFixedColumnsHeader(t, e, s, i, o, n, r) {
    var f;
    const a = this.layoutManager.getLayoutInfo(), l = a.headerHeight, h = this.layoutManager.getHeaderCells();
    this.ctx.save();
    let c = 0;
    for (const g of e)
      c += this.layoutManager.getColumnWidthByIndex(g);
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(s, 0, c, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(s, l), this.ctx.lineTo(s + c, l), this.ctx.stroke();
    const u = e.length > 0 && ((f = this.layoutManager.getLeafColumn(e[0])) == null ? void 0 : f.fixed) === "right" ? s - (a.totalWidth - c) : 0;
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
        i,
        o,
        m,
        !1,
        g.colIndex
      );
    }
    this.ctx.restore();
  }
  renderHeader(t, e, s, i, o, n) {
    const r = this.layoutManager.getLayoutInfo(), a = r.headerHeight;
    this.ctx.save(), this.ctx.translate(0, i), this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(0, 0, r.totalWidth, a), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(0, a), this.ctx.lineTo(r.totalWidth, a), this.ctx.stroke();
    for (let l = e; l <= s; l++) {
      const h = t[l];
      if (!h) continue;
      const { x: c, width: d } = this.layoutManager.getCellPosition(0, l);
      this.renderHeaderCell(h, c, 0, d, a, l, o);
    }
    this.ctx.restore();
  }
  renderHeaderCell(t, e, s, i, o, n, r) {
    if (t.key.startsWith("__hidden_placeholder__")) {
      const p = this.hoveredPlaceholderColumnIndex === n;
      this.ctx.fillStyle = p ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.headerBackground, this.ctx.fillRect(e, s, i, o), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, s, i, o);
      return;
    }
    const a = 8, l = 0;
    this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const h = r.find((p) => p.column === t.key), c = (h == null ? void 0 : h.direction) ?? "none", d = c !== "none" ? 20 : 0, u = i - a * 2 - d - l - 0, f = ct(t.title, Math.floor(u / 7)), g = t.align ?? "left";
    let m = e + a + l + 0;
    g === "center" ? m = e + (i - this.ctx.measureText(f).width - d) / 2 : g === "right" && (m = e + i - a - this.ctx.measureText(f).width - d), this.ctx.fillText(f, m, s + o / 2), c !== "none" && this.renderSortIndicator(e + i - a - 10, s + o / 2, c), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, s, i, o);
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
  renderSortIndicator(t, e, s) {
    const r = this.theme.colors.indicator.active, a = this.theme.colors.indicator.inactive;
    this.ctx.beginPath(), this.ctx.moveTo(t - 8 / 2, e - 2), this.ctx.lineTo(t + 8 / 2, e - 2), this.ctx.lineTo(t, e - 2 - 5), this.ctx.closePath(), this.ctx.fillStyle = s === "asc" ? r : a, this.ctx.fill(), this.ctx.beginPath(), this.ctx.moveTo(t - 8 / 2, e + 2), this.ctx.lineTo(t + 8 / 2, e + 2), this.ctx.lineTo(t, e + 2 + 5), this.ctx.closePath(), this.ctx.fillStyle = s === "desc" ? r : a, this.ctx.fill();
  }
  renderFilterIndicator(t, e, s) {
    const o = this.theme.colors.indicator.active, n = this.theme.colors.indicator.inactive;
    this.ctx.fillStyle = s ? o : n, this.ctx.beginPath(), this.ctx.moveTo(t - 10 / 2, e - 10 / 2), this.ctx.lineTo(t + 10 / 2, e - 10 / 2), this.ctx.lineTo(t, e), this.ctx.closePath(), this.ctx.fill(), this.ctx.fillRect(t - 1, e, 2, 10 / 2);
  }
  renderRows(t, e, s, i, o, n, r) {
    for (let a = s; a <= i; a++) {
      const l = e[a];
      l && this.renderRow(t, l, a, o, n, r);
    }
  }
  renderRow(t, e, s, i, o, n) {
    var u;
    const r = this.layoutManager.getLayoutInfo(), { x: a, y: l, height: h } = this.layoutManager.getCellPosition(s, 0), c = r.totalWidth;
    let d = this.theme.colors.rowBackground;
    n.stripeRows && s % 2 === 1 && (d = this.theme.colors.rowAltBackground), e.selected && (d = this.theme.colors.rowSelectedBackground), ((u = n.hoveredCell) == null ? void 0 : u.rowIndex) === s && (d = this.theme.colors.rowHoverBackground), this.ctx.fillStyle = d, this.ctx.fillRect(a, l, c, h);
    for (let f = i; f <= o; f++) {
      const g = t[f];
      if (!g) continue;
      const m = e.data[X(g)];
      this.renderCell(g, e, s, f, m, n);
    }
  }
  renderCell(t, e, s, i, o, n) {
    const { x: r, y: a, width: l, height: h } = this.layoutManager.getCellPosition(s, i);
    this.renderCellInternal(t, e, s, i, o, r, a, l, h, n);
  }
  renderCellWithPosition(t, e, s, i, o, n, r, a, l, h) {
    this.renderCellInternal(t, e, s, i, o, n, r, a, l, h);
  }
  renderCellInternal(t, e, s, i, o, n, r, a, l, h) {
    var x, w, C, y;
    if (t.key.startsWith("__hidden_placeholder__")) {
      const b = this.hoveredPlaceholderColumnIndex === i;
      this.ctx.fillStyle = b ? this.theme.colors.hiddenPlaceholder.hoverBg : this.theme.colors.rowBackground, this.ctx.fillRect(n, r, a, l), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.beginPath(), this.ctx.moveTo(n + a, r), this.ctx.lineTo(n + a, r + l), this.ctx.stroke();
      return;
    }
    const d = this.resolveDisabled(t.disabled, e, t), u = this.getCacheMode(t);
    let f;
    if (this.renderCache && u !== !1) {
      const b = this.renderCache.get(e, t, o, u);
      b ? f = b : (f = this.executeRender(t, e, s, o), this.renderCache.set(e, t, o, f, u));
    } else
      f = this.executeRender(t, e, s, o);
    const g = this.isCellSelected(s, i, h.selectedCells), m = ((x = h.hoveredCell) == null ? void 0 : x.rowIndex) === s && ((w = h.hoveredCell) == null ? void 0 : w.columnIndex) === i, p = ((C = h.editingCell) == null ? void 0 : C.rowIndex) === s && ((y = h.editingCell) == null ? void 0 : y.columnIndex) === i;
    if (g && !e.selected ? (this.ctx.fillStyle = this.theme.colors.rowSelectedBackground, this.ctx.fillRect(n, r, a, l)) : m && !e.selected && (this.ctx.fillStyle = this.theme.colors.rowHoverBackground, this.ctx.fillRect(n, r, a, l)), !p) {
      const b = this.expandColumnKey === t.key, I = e.children && e.children.length > 0, E = e.level ?? 0;
      if (b && I) {
        this.renderExpandIcon(n, r, a, l, e.expanded ?? !1, E);
        const R = 20, T = E * 16;
        this.renderCellContent(
          f,
          n + R + T,
          r,
          a - R - T,
          l,
          8,
          t.align,
          s,
          i,
          d
        );
      } else {
        const R = b ? E * 16 : 0;
        this.renderCellContent(
          f,
          n + R,
          r,
          a - R,
          l,
          8,
          t.align,
          s,
          i,
          d
        );
      }
    }
    if (this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(n, r, a, l), d) {
      const b = this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
      this.ctx.fillStyle = b, this.ctx.fillRect(n, r, a, l);
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
  executeRender(t, e, s, i) {
    let o = {
      text: this.formatValue(i, t, e),
      type: t.type ?? "text"
    };
    if (t.render)
      try {
        const n = t.render(i, e, t, s);
        n && (o = { ...o, ...n });
      } catch (n) {
        console.error(`Error rendering cell at row ${s}, column ${t.key}:`, n), o = {
          text: "[Error]",
          type: "text"
        };
      }
    return o;
  }
  renderCellContent(t, e, s, i, o, n, r, a, l, h) {
    try {
      this.renderCellContentInternal(
        t,
        e,
        s,
        i,
        o,
        n,
        r,
        a,
        l,
        h
      );
    } catch (c) {
      console.error(`Error rendering cell content at row ${a}, col ${l}:`, c), this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle", this.ctx.fillText("[Render Error]", e + n, s + o / 2);
    }
  }
  renderWithCellRenderer(t, e, s, i, o, n, r = {}) {
    const a = this.cellRendererRegistry.get(t);
    return a ? a.render(
      this.cellRendererRegistry.createContext({
        ctx: this.ctx,
        theme: this.theme,
        layoutManager: this.layoutManager,
        x: s,
        y: i,
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
  renderCellContentInternal(t, e, s, i, o, n, r, a, l, h) {
    var c, d, u, f;
    this.ctx.save();
    try {
      const { text: g, type: m, style: p, checkbox: x, radio: w, button: C, input: y, tags: b, link: I } = t, E = (p == null ? void 0 : p.fontSize) ?? this.theme.font.size, R = (p == null ? void 0 : p.fontFamily) ?? this.theme.font.family, T = (p == null ? void 0 : p.fontWeight) ?? "normal", D = (p == null ? void 0 : p.fontStyle) ?? "normal";
      if (this.ctx.font = `${D} ${T} ${E}px ${R}`, m === "checkbox" && x) {
        this.measureRender("checkbox", () => {
          this.renderWithCellRenderer("checkbox", x, e, s, i, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "radio" && w) {
        this.measureRender("radio", () => {
          this.renderWithCellRenderer("radio", w, e, s, i, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "button" && C) {
        let H;
        if (a !== void 0 && l !== void 0 && this.currentButtonHoverStates) {
          const k = `${a}-${l}`, O = this.currentButtonHoverStates.get(k);
          O && (H = O);
        }
        this.measureRender("button", () => {
          this.renderWithCellRenderer("button", C, e, s, i, o, {
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
          this.renderWithCellRenderer("buttons", t.buttons, e, s, i, o, {
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
          this.renderWithCellRenderer("switch", t.switch, e, s, i, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h,
            switchAnimation: H
          });
        });
        return;
      }
      if (m === "input" && y) {
        this.measureRender("input", () => {
          this.renderWithCellRenderer("input", y, e, s, i, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "select" && t.select) {
        this.measureRender("select", () => {
          this.renderWithCellRenderer("select", t.select, e, s, i, o, {
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
          this.renderWithCellRenderer("date", t.date, e, s, i, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "tag" && b) {
        this.measureRender("tags", () => {
          this.renderWithCellRenderer("tag", b, e, s, i, o, {
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
          () => this.renderImage(e, s, i, o, t.image, a, H)
        );
        return;
      }
      if (m === "progress" && t.progress) {
        const k = a !== void 0 && l !== void 0 && this.currentProgressDragState && this.currentProgressDragState.cell.rowIndex === a && this.currentProgressDragState.cell.columnIndex === l ? { ...t.progress, value: this.currentProgressDragState.displayValue } : t.progress;
        this.measureRender("progress", () => {
          this.renderWithCellRenderer("progress", k, e, s, i, o, {
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
            s,
            i,
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
          this.renderWithCellRenderer("color", t.color, e, s, i, o, {
            rowIndex: a,
            colIndex: l,
            isDisabled: h
          });
        });
        return;
      }
      if (m === "custom" && t.jsxRender) {
        this.measureRender("jsx", () => {
          const H = t.jsxRender(), k = new Ae(this.ctx), O = new Pe(k), A = new _e(this.ctx, O, this.theme), W = O.layout(H, 0, 0);
          let P = 0;
          for (const B of W) {
            const z = B.y + B.height;
            z > P && (P = z);
          }
          const L = o - n * 2;
          let _, F, Y;
          P <= L ? (_ = (L - P) / 2, F = e + n, Y = s + n + _) : (_ = (o - P) / 2, F = e + n, Y = s + _), A.render(H, F, Y);
        });
        return;
      }
      if (m === "custom" && t.customRender) {
        this.measureRender("custom", () => {
          t.customRender({
            ctx: this.ctx,
            x: e,
            y: s,
            width: i,
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
        const O = (p == null ? void 0 : p.horizontalAlign) ?? r ?? "left", A = (p == null ? void 0 : p.verticalAlign) ?? "middle", W = this.theme.font.size, P = W * 1.5, L = i - n * 2, _ = this.calculateMaxRows(o, P, n);
        if (_ > 1) {
          const F = this.wrapTextToLines(H, L, _), Y = F.length * P;
          let B;
          A === "top" ? B = s + n : A === "bottom" ? B = s + o - n - Y : B = s + (o - Y) / 2, this.ctx.textBaseline = "top";
          for (let z = 0; z < F.length; z++) {
            const U = F[z];
            let G;
            switch (O) {
              case "center":
                G = e + (i - this.ctx.measureText(U).width) / 2;
                break;
              case "right":
                G = e + i - n - this.ctx.measureText(U).width;
                break;
              default:
                G = e + n;
            }
            this.ctx.fillText(U, G, B + z * P);
          }
        } else {
          const F = "...";
          if (this.ctx.measureText(H).width > L) {
            let U = H;
            for (; U.length > 0 && this.ctx.measureText(U + F).width > L; )
              U = U.slice(0, -1);
            H = U + F;
          }
          let B;
          switch (O) {
            case "center":
              B = e + (i - this.ctx.measureText(H).width) / 2;
              break;
            case "right":
              B = e + i - n - this.ctx.measureText(H).width;
              break;
            default:
              B = e + n;
          }
          let z;
          switch (A) {
            case "top":
              this.ctx.textBaseline = "top", z = s + n;
              break;
            case "bottom":
              this.ctx.textBaseline = "bottom", z = s + o - n;
              break;
            default:
              this.ctx.textBaseline = "middle", z = s + o / 2;
          }
          if (m === "tag")
            this.renderTag(H, B, z, W);
          else if (this.ctx.fillText(H, B, z), m === "link") {
            const U = this.ctx.measureText(H).width;
            this.ctx.strokeStyle = k, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(B, z + W / 2 + 2), this.ctx.lineTo(B + U, z + W / 2 + 2), this.ctx.stroke();
          }
        }
      });
    } finally {
      this.ctx.restore();
    }
  }
  renderExpandIcon(t, e, s, i, o, n) {
    const l = n * 16, h = t + 8 + l + 8 / 2, c = e + i / 2;
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
    const s = this.textWidthCache.get(t);
    if (s !== void 0)
      return s;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const i = this.ctx.measureText(t).width;
    return this.textWidthCache.set(t, i), i;
  }
  renderColorDropdown(t) {
    this.overlayRenderer.renderColorDropdown(t);
  }
  renderImage(t, e, s, i, o, n, r) {
    if (o.images && o.images.length > 0) {
      this.renderMultipleImages(t, e, s, i, o, n, r);
      return;
    }
    if (!o.src)
      return;
    const l = this.getMaxImageSize(s, i, 4, o), h = o.width ?? 32, c = o.height ?? 32, d = Math.min(h, l), u = Math.min(c, l), f = o.circle ? Math.min(d, u) / 2 : o.borderRadius ?? 0, g = t + (s - d) / 2, m = e + (i - u) / 2;
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
      )) : (this.loadImage(o.src, Math.max(d, u)), this.renderImagePlaceholder(
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
  getMaxImageSize(t, e, s, i) {
    const o = i.scaleWithRowHeight === !1 ? Math.min(e, Be) : e;
    return Math.max(0, Math.min(t, o) - s * 2);
  }
  renderMultipleImages(t, e, s, i, o, n, r) {
    const a = o.images, l = 4, h = this.getMaxImageSize(s, i, l, o), c = o.width ?? 32, d = o.height ?? 32, u = Math.min(c, h), f = Math.min(d, h), g = o.gap ?? 4, m = o.circle ? Math.min(u, f) / 2 : o.borderRadius ?? 0, p = o.showMoreCount !== !1, x = s - l * 2, w = i - l * 2, C = Math.max(1, Math.floor((x + g) / (u + g))), y = Math.max(1, Math.floor((w + g) / (f + g))), b = C * y, I = o.maxVisible ?? b, R = p && a.length > I ? Math.max(1, b - 1) : b, T = Math.max(1, Math.min(I, R)), D = o.lazy !== !1, H = o.lazyThreshold ?? 200;
    let k = !0;
    D && n !== void 0 && this.currentVisibleRange && (k = this.isInLazyLoadRange(n, H));
    const O = a.length > T, A = O ? T : a.length, W = a.slice(0, A), P = O ? a.length - T : 0, L = A + (O && p ? 1 : 0), _ = Math.max(1, Math.ceil(L / C)), F = Math.min(L, C), Y = F * u + Math.max(0, F - 1) * g, B = _ * f + Math.max(0, _ - 1) * g;
    let z = t + (s - Y) / 2;
    z = Math.max(t + l, z);
    const U = e + (i - B) / 2;
    for (let G = 0; G < W.length; G++) {
      const $ = W[G], Q = Math.floor(G / C), tt = G % C, V = z + tt * (u + g), K = U + Q * (f + g), lt = r && o.hoverable !== !1 && this.currentHoveredImageIndex === G;
      if (this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.beginPath(), m > 0 ? this.ctx.roundRect(V, K, u, f, m) : this.ctx.rect(V, K, u, f), this.ctx.fill(), !k) {
        this.renderImagePlaceholder(
          V,
          K,
          u,
          f,
          m,
          o.placeholder
        ), lt && this.renderImageHover(V, K, u, f, m);
        continue;
      }
      if (this.imageLoadQueue.isFailed($)) {
        this.renderImageError(V, K, u, f, m, o.errorImage), lt && this.renderImageHover(V, K, u, f, m);
        continue;
      }
      const rt = this.imageLoadQueue.get($, Math.max(u, f));
      rt ? (this.ctx.save(), this.ctx.beginPath(), m > 0 ? this.ctx.roundRect(V, K, u, f, m) : this.ctx.rect(V, K, u, f), this.ctx.clip(), this.drawImageWithFit(rt, V, K, u, f, o.fit ?? "cover"), this.ctx.restore(), this.collectVisibleImage($)) : this.imageLoadQueue.isLoading($) ? (this.collectVisibleImage($), this.renderImagePlaceholder(
        V,
        K,
        u,
        f,
        m,
        o.placeholder
      )) : (this.loadImage($, Math.max(u, f)), this.renderImagePlaceholder(
        V,
        K,
        u,
        f,
        m,
        o.placeholder
      )), lt && this.renderImageHover(V, K, u, f, m);
    }
    if (O && p) {
      const G = Math.floor(A / C), $ = A % C, Q = z + $ * (u + g), tt = U + G * (f + g), V = r && o.hoverable !== !1 && this.currentHoveredImageIndex === A;
      this.renderMoreCount(
        Q,
        tt,
        u,
        f,
        m,
        P,
        V
      );
    }
  }
  renderMoreCount(t, e, s, i, o, n, r) {
    this.ctx.fillStyle = r ? this.theme.colors.image.hoverBorder : this.theme.colors.moreCount.background, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, s, i, o) : this.ctx.rect(t, e, s, i), this.ctx.fill();
    const a = `+${n}`;
    this.ctx.fillStyle = this.theme.colors.moreCount.text, this.ctx.font = `bold ${Math.min(s, i) * 0.4}px ${this.theme.font.family}`;
    const l = this.ctx.textAlign, h = this.ctx.textBaseline;
    this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(a, t + s / 2, e + i / 2), this.ctx.textAlign = l, this.ctx.textBaseline = h;
  }
  renderImageHover(t, e, s, i, o) {
    const n = this.theme.colors.image.hoverBorder, r = this.ctx.strokeStyle, a = this.ctx.lineWidth;
    this.ctx.strokeStyle = n, this.ctx.lineWidth = 2, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, s, i, o) : this.ctx.rect(t, e, s, i), this.ctx.stroke(), this.ctx.save(), this.ctx.shadowColor = this.theme.colors.image.hoverShadow, this.ctx.shadowBlur = 4, this.ctx.shadowOffsetX = 0, this.ctx.shadowOffsetY = 0, this.ctx.strokeStyle = n, this.ctx.lineWidth = 1, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, s, i, o) : this.ctx.rect(t, e, s, i), this.ctx.stroke(), this.ctx.restore(), this.ctx.strokeStyle = r, this.ctx.lineWidth = a;
  }
  renderImagePlaceholder(t, e, s, i, o, n) {
    if (n) {
      const d = this.imageLoadQueue.get(n, Math.max(s, i));
      if (d) {
        this.ctx.save(), this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, s, i, o) : this.ctx.rect(t, e, s, i), this.ctx.clip(), this.drawImageWithFit(d, t, e, s, i, "cover"), this.ctx.restore();
        return;
      } else this.imageLoadQueue.isLoading(n) || this.loadImage(n, Math.max(s, i));
    }
    this.ctx.fillStyle = this.theme.colors.image.placeholderBg, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, s, i, o) : this.ctx.rect(t, e, s, i), this.ctx.fill();
    const r = Math.min(s, i) * 0.4, a = t + s / 2, l = e + i / 2, h = this.ctx.strokeStyle, c = this.ctx.lineWidth;
    this.ctx.strokeStyle = this.theme.colors.placeholderText, this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.rect(a - r / 2, l - r / 2, r, r), this.ctx.stroke(), this.ctx.beginPath(), this.ctx.moveTo(a - r / 2, l + r / 4), this.ctx.lineTo(a - r / 4, l), this.ctx.lineTo(a, l + r / 4), this.ctx.lineTo(a + r / 4, l - r / 4), this.ctx.lineTo(a + r / 2, l + r / 4), this.ctx.stroke(), this.ctx.strokeStyle = h, this.ctx.lineWidth = c;
  }
  renderImageError(t, e, s, i, o, n) {
    if (n) {
      const d = this.imageLoadQueue.get(n, Math.max(s, i));
      if (d) {
        this.ctx.save(), this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, s, i, o) : this.ctx.rect(t, e, s, i), this.ctx.clip(), this.drawImageWithFit(d, t, e, s, i, "cover"), this.ctx.restore();
        return;
      } else !this.imageLoadQueue.isLoading(n) && !this.imageLoadQueue.isFailed(n) && this.loadImage(n, Math.max(s, i));
    }
    this.ctx.fillStyle = this.theme.colors.image.errorBg, this.ctx.beginPath(), o > 0 ? this.ctx.roundRect(t, e, s, i, o) : this.ctx.rect(t, e, s, i), this.ctx.fill();
    const r = Math.min(s, i) * 0.4, a = t + s / 2, l = e + i / 2, h = this.ctx.strokeStyle, c = this.ctx.lineWidth;
    this.ctx.strokeStyle = this.theme.colors.image.errorBorder, this.ctx.lineWidth = 1.5, this.ctx.beginPath(), this.ctx.rect(a - r / 2, l - r / 2, r, r), this.ctx.stroke(), this.ctx.beginPath(), this.ctx.moveTo(a - r / 4, l - r / 4), this.ctx.lineTo(a + r / 4, l + r / 4), this.ctx.moveTo(a + r / 4, l - r / 4), this.ctx.lineTo(a - r / 4, l + r / 4), this.ctx.stroke(), this.ctx.strokeStyle = h, this.ctx.lineWidth = c;
  }
  drawImageWithFit(t, e, s, i, o, n) {
    const r = t.width / t.height, a = i / o;
    let l, h, c, d;
    switch (n) {
      case "fill":
        l = i, h = o, c = e, d = s;
        break;
      case "contain":
        r > a ? (l = i, h = i / r) : (h = o, l = o * r), c = e + (i - l) / 2, d = s + (o - h) / 2;
        break;
      case "cover":
        r > a ? (h = o, l = o * r) : (l = i, h = i / r), c = e + (i - l) / 2, d = s + (o - h) / 2;
        break;
      case "none":
      default:
        l = t.width, h = t.height, c = e + (i - l) / 2, d = s + (o - h) / 2;
        break;
    }
    this.ctx.drawImage(t, c, d, l, h);
  }
  /**
   * 检查行是否在懒加载范围内
   */
  isInLazyLoadRange(t, e) {
    if (!this.currentVisibleRange) return !0;
    const { startRow: s, endRow: i } = this.currentVisibleRange, o = this.rowHeight || this.theme.row.height, n = Math.ceil(e / o), r = Math.max(0, s - n), a = i + n;
    return t >= r && t <= a;
  }
  loadImage(t, e) {
    this.isDestroyed || this.imageLoadQueue.request(t, e, (s) => {
      var i;
      this.isDestroyed || s && (this.markDirty(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr), (i = this.onImageLoaded) == null || i.call(this));
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
        const s = this.performanceStats.get(t) || { totalTime: 0, count: 0, maxTime: 0 };
        s.totalTime += e.totalTime, s.count += e.count;
        const i = e.totalTime / e.count;
        s.maxTime = Math.max(s.maxTime, i), this.performanceStats.set(t, s);
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
    const s = performance.now();
    e();
    const i = performance.now() - s, o = this.currentFrameStats.get(t) || { totalTime: 0, count: 0 };
    o.totalTime += i, o.count++, this.currentFrameStats.set(t, o);
  }
  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const t = /* @__PURE__ */ new Map();
    for (const [e, s] of this.performanceStats)
      t.set(e, {
        ...s,
        avgTime: s.totalTime / s.count
      });
    return t;
  }
  /**
   * 输出性能报告到控制台
   */
  logPerformanceReport() {
    if (!this.performanceEnabled) return;
    const t = Array.from(this.performanceStats.entries()).map(([e, s]) => ({
      type: e,
      avgTime: s.totalTime / s.count,
      ...s
    })).sort((e, s) => s.avgTime - e.avgTime);
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
    const s = Array.from(this.performanceStats.entries()).map(([o, n]) => ({
      type: o,
      count: n.count,
      totalTime: n.totalTime,
      maxTime: n.maxTime,
      avgTime: n.count > 0 ? n.totalTime / n.count : 0,
      callsPerFrame: Math.round(n.count / e),
      avgFrameTime: n.totalTime / e
    })).sort((o, n) => n.avgFrameTime - o.avgFrameTime);
    for (const o of s)
      t.push(
        `${o.type.padEnd(15)} | avg calls/frame: ${o.callsPerFrame.toString().padStart(4)} | avg: ${o.avgTime.toFixed(3).padStart(7)}ms | max: ${o.maxTime.toFixed(3).padStart(7)}ms | frameTotal: ${o.avgFrameTime.toFixed(2).padStart(6)}ms`
      );
    const i = s.reduce((o, n) => o + n.avgFrameTime, 0);
    return t.push(""), t.push(`Average frame render time: ${i.toFixed(2)}ms`), t.join(`
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
  renderTag(t, e, s, i) {
    const r = this.ctx.measureText(t).width + 4 * 2, a = i + 4 * 2, l = this.theme.colors.tagColors[t.toLowerCase()] ?? this.theme.colors.tagColors.default;
    this.ctx.fillStyle = l, this.ctx.beginPath();
    const h = 4, c = e - 4, d = s - i / 2 - 4;
    this.ctx.roundRect(c, d, r, a, h), this.ctx.fill(), this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.fillText(t, e, s);
  }
  resolveDisabled(t, e, s) {
    return t === void 0 ? !1 : typeof t == "function" ? t(e, s) : t;
  }
  formatValue(t, e, s) {
    if (t == null)
      return "";
    if (e.formatter)
      return e.formatter(t, s, e);
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
  isCellSelected(t, e, s) {
    return s.some((i) => {
      const o = Math.min(i.start.rowIndex, i.end.rowIndex), n = Math.max(i.start.rowIndex, i.end.rowIndex), r = Math.min(i.start.columnIndex, i.end.columnIndex), a = Math.max(i.start.columnIndex, i.end.columnIndex);
      return t >= o && t <= n && e >= r && e <= a;
    });
  }
  renderCenterSelections(t, e, s, i) {
    const o = this.layoutManager.getLeafColumns();
    for (const n of t) {
      const r = Math.min(n.start.rowIndex, n.end.rowIndex), a = Math.max(n.start.rowIndex, n.end.rowIndex), l = Math.min(n.start.columnIndex, n.end.columnIndex), h = Math.max(n.start.columnIndex, n.end.columnIndex), c = this.layoutManager.getCellMerge(r, l);
      let d = r, u = a, f = l, g = h;
      c && (d = c.rowIndex, u = c.rowIndex + c.rowspan - 1, f = c.columnIndex, g = c.columnIndex + c.colspan - 1);
      const m = Math.max(f, Math.min(...i)), p = Math.min(g, Math.max(...i));
      if (m > p) continue;
      const x = o[m], w = o[p];
      if (!x || !w || x.fixed || w.fixed) continue;
      const C = this.layoutManager.getRowOffset(d) - s, y = this.layoutManager.getRowOffset(u) + this.layoutManager.getRowHeightByIndex(u) - this.layoutManager.getRowOffset(d), b = this.layoutManager.getCellPosition(d, m), I = this.layoutManager.getCellPosition(u, p), E = I.x + I.width - b.x, R = b.x - e;
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]), this.ctx.strokeRect(R, C, E, y);
    }
  }
  renderFixedSelections(t, e, s, i) {
    for (const o of t) {
      const n = Math.min(o.start.rowIndex, o.end.rowIndex), r = Math.max(o.start.rowIndex, o.end.rowIndex), a = Math.min(o.start.columnIndex, o.end.columnIndex), l = Math.max(o.start.columnIndex, o.end.columnIndex), h = this.layoutManager.getCellMerge(n, a);
      let c = n, d = r, u = a, f = l;
      h && (c = h.rowIndex, d = h.rowIndex + h.rowspan - 1, u = h.columnIndex, f = h.columnIndex + h.colspan - 1);
      const g = this.layoutManager.getRowOffset(c) - e, m = this.layoutManager.getRowOffset(d) + this.layoutManager.getRowHeightByIndex(d) - this.layoutManager.getRowOffset(c);
      this.ctx.strokeStyle = this.theme.colors.selectionBorder, this.ctx.lineWidth = 2, this.ctx.setLineDash([]);
      const p = s.filter(
        (w) => w >= u && w <= f
      );
      if (p.length > 0) {
        const w = p[0], C = p[p.length - 1], y = this.layoutManager.getCellPosition(c, w), b = this.layoutManager.getCellPosition(d, C), I = b.x + b.width - y.x;
        this.ctx.strokeRect(y.x, g, I, m);
      }
      const x = i.filter(
        (w) => w >= u && w <= f
      );
      if (x.length > 0) {
        const w = x[0], C = x[x.length - 1], y = this.layoutManager.getCellPosition(c, w), b = this.layoutManager.getCellPosition(d, C), I = b.x + b.width - y.x;
        this.ctx.strokeRect(y.x, g, I, m);
      }
    }
  }
  renderLoadingOverlay() {
    const t = this.canvas.width / this.dpr, e = this.canvas.height / this.dpr;
    this.ctx.save(), this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)", this.ctx.fillRect(0, 0, t, e), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText("Loading...", t / 2, e / 2), this.ctx.restore();
  }
  renderEmptyState(t, e = [], s = [], i, o = 0) {
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
          s,
          i
        );
      }
      if (this.ctx.restore(), d)
        for (const p of m)
          p.column.fixed === "left" && this.renderEmptyStateHeaderCell(
            p,
            p.x,
            e,
            s,
            i
          );
      if (u)
        for (const p of m) {
          if (p.column.fixed !== "right") continue;
          const w = n - g - (this.layoutManager.getLayoutInfo().totalWidth - g), C = p.x + w;
          this.renderEmptyStateHeaderCell(
            p,
            C,
            e,
            s,
            i
          );
        }
      this.ctx.restore();
    }
    this.ctx.fillStyle = this.theme.colors.cellText, this.ctx.font = `14px ${this.theme.font.family}`, this.ctx.textAlign = "center", this.ctx.textBaseline = "middle", this.ctx.fillText(t, n / 2, l + (r - l) / 2), this.ctx.restore();
  }
  renderEmptyStateHeaderCell(t, e, s, i, o) {
    this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(e, t.y, t.width, t.height), this.ctx.fillStyle = this.theme.colors.headerText, this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const n = s.find((y) => y.column === t.column.key), r = (n == null ? void 0 : n.direction) ?? "none", a = t.column.sortable !== !1, l = t.column.key === o, h = t.isLeaf && a && (r !== "none" || l), c = h ? 20 : 0, d = i.some((y) => y.column === t.column.key), u = t.isLeaf && t.column.filterable, f = u ? 20 : 0, g = 8, m = t.width - g * 2 - c - f, p = ct(t.column.title, Math.floor(m / 7)), x = t.column.align ?? "center";
    let w = e + g;
    x === "center" ? w = e + (t.width - this.ctx.measureText(p).width - c - f) / 2 : x === "right" && (w = e + t.width - g - this.ctx.measureText(p).width - c - f);
    const C = t.y + t.height / 2;
    if (this.ctx.fillText(p, w, C), t.isLeaf)
      if (u) {
        const y = e + t.width - g - 10;
        h && this.renderSortIndicator(
          y - 16,
          C,
          r === "none" ? "hover" : r
        ), this.renderFilterIndicator(y, C, d);
      } else h && this.renderSortIndicator(
        e + t.width - g - 10,
        C,
        r === "none" ? "hover" : r
      );
    this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = this.theme.border.width, this.ctx.strokeRect(e, t.y, t.width, t.height);
  }
  isColumnHovered(t, e) {
    const i = this.layoutManager.getLeafColumns()[e];
    return i ? t.key === i.key : !1;
  }
  renderFixedColumnsShadow(t, e) {
    const s = this.canvas.width / this.dpr, i = this.canvas.height / this.dpr, o = 10;
    this.ctx.save();
    const n = this.ctx.createLinearGradient(
      e === "left" ? t : s - t - o,
      0,
      e === "left" ? t + o : s - t,
      0
    );
    e === "left" ? (n.addColorStop(0, "rgba(0, 0, 0, 0.15)"), n.addColorStop(1, "rgba(0, 0, 0, 0)")) : (n.addColorStop(0, "rgba(0, 0, 0, 0)"), n.addColorStop(1, "rgba(0, 0, 0, 0.15)")), this.ctx.fillStyle = n, this.ctx.fillRect(
      e === "left" ? t : s - t - o,
      0,
      o,
      i
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
  renderScrollbars(t, e, s, i, o) {
    this.overlayRenderer.renderScrollbars(
      t,
      e,
      s,
      i,
      o
    );
  }
  renderWatermark() {
    this.overlayRenderer.renderWatermark();
  }
  getScrollbarBounds(t, e, s, i) {
    return this.overlayRenderer.getScrollbarBounds(
      t,
      e,
      s,
      i
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
    const e = this.layoutManager.getRowOffset(this.currentRowResizeState.rowIndex) + this.currentRowResizeState.displayHeight - this.currentScrollTop;
    this.ctx.save(), this.ctx.strokeStyle = this.theme.row.resizeGuideColor, this.ctx.lineWidth = this.theme.row.resizeGuideWidth, this.ctx.beginPath(), this.ctx.moveTo(0, e), this.ctx.lineTo(t, e), this.ctx.stroke(), this.ctx.restore();
  }
  renderColumnReorderIndicator(t, e, s, i) {
    const n = this.layoutManager.getLayoutInfo().headerHeight, r = this.canvas.height / this.dpr, a = this.layoutManager.getColumnByKey(t.dragColumnKey), l = a ? this.layoutManager.getColumnWidth(a) : 100, h = t.currentX - l / 2;
    this.ctx.save(), this.ctx.globalAlpha = 0.7, this.ctx.fillStyle = this.theme.colors.headerBackground, this.ctx.fillRect(h, 0, l, r), this.ctx.strokeStyle = this.theme.colors.button.primaryBg, this.ctx.lineWidth = 2, this.ctx.setLineDash([5, 5]), this.ctx.strokeRect(h, 0, l, r), this.ctx.setLineDash([]), t.isParentColumn && a && a.children && a.children.length > 0 ? (this.renderParentColumnGhost(a, h, n), this.renderParentColumnRowsGhost(a, h, n, e, s, i)) : a && (this.renderLeafColumnGhost(a, h, 0, n), this.renderLeafColumnRowsGhost(a, h, n, e, s, i)), this.ctx.restore();
  }
  renderParentColumnGhost(t, e, s) {
    const i = t.depth ?? 0, o = this.theme.row.headerHeight, n = i * o, r = o, a = this.layoutManager.getColumnWidth(t);
    this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.fillRect(e, n, a, r), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, n, a, r), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const l = t.title, h = this.ctx.measureText(l).width, c = e + (a - h) / 2;
    this.ctx.fillText(l, c, n + r / 2), this.renderChildColumnsGhost(t, e, i + 1, s);
  }
  renderChildColumnsGhost(t, e, s, i) {
    if (!t.children || t.children.length === 0) return;
    const o = this.theme.row.headerHeight;
    let n = e;
    for (const r of t.children) {
      const a = this.layoutManager.getColumnWidth(r);
      if (r.children && r.children.length > 0) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        const l = s * o, h = o;
        this.ctx.fillRect(n, l, a, h), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(n, l, a, h), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
        const c = r.title, d = this.ctx.measureText(c).width, u = n + (a - d) / 2;
        this.ctx.fillText(c, u, l + h / 2), this.renderChildColumnsGhost(r, n, s + 1, i);
      } else
        this.renderLeafColumnGhost(r, n, s, i);
      n += a;
    }
  }
  renderLeafColumnGhost(t, e, s, i) {
    const o = this.theme.row.headerHeight, n = this.layoutManager.getColumnWidth(t), r = s * o, a = i - r;
    this.ctx.fillStyle = this.theme.colors.button.primaryBg, this.ctx.fillRect(e, r, n, a), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.strokeRect(e, r, n, a), this.ctx.fillStyle = "#ffffff", this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`, this.ctx.textBaseline = "middle";
    const l = t.title, h = this.ctx.measureText(l).width, c = e + (n - h) / 2;
    this.ctx.fillText(l, c, r + a / 2);
  }
  isDescendantOfColumn(t, e) {
    if (t.key === e || t.parentKey === e)
      return !0;
    if (t.parentKey) {
      const s = this.layoutManager.getColumnByKey(t.parentKey);
      if (s)
        return this.isDescendantOfColumn(s, e);
    }
    return !1;
  }
  renderLeafColumnRowsGhost(t, e, s, i, o, n) {
    const r = this.layoutManager.getColumnWidth(t), { startRow: a, endRow: l } = o;
    for (let h = a; h <= l; h++) {
      const c = i[h];
      if (!c) continue;
      const d = this.layoutManager.getRowOffset(h), u = this.layoutManager.getRowHeightByIndex(h), f = d - n;
      if (f + u < s || f > this.canvas.height / this.dpr)
        continue;
      this.ctx.fillStyle = this.theme.colors.rowBackground, this.ctx.fillRect(e, f, r, u), this.ctx.strokeStyle = this.theme.colors.cellBorder, this.ctx.lineWidth = 1, this.ctx.beginPath(), this.ctx.moveTo(e, f + u), this.ctx.lineTo(e + r, f + u), this.ctx.stroke();
      const g = c.data[X(t)];
      this.renderGhostCellValue(t, c, h, g, e, f, r, u);
    }
  }
  renderParentColumnRowsGhost(t, e, s, i, o, n) {
    if (!t.children || t.children.length === 0) return;
    let r = e;
    for (const a of t.children) {
      const l = this.layoutManager.getColumnWidth(a);
      a.children && a.children.length > 0 ? this.renderParentColumnRowsGhost(
        a,
        r,
        s,
        i,
        o,
        n
      ) : this.renderLeafColumnRowsGhost(
        a,
        r,
        s,
        i,
        o,
        n
      ), r += l;
    }
  }
  renderGhostCellValue(t, e, s, i, o, n, r, a) {
    let h = {
      text: this.formatValue(i, t, e),
      type: t.type ?? "text"
    };
    if (t.render)
      try {
        const d = t.render(i, e, t, s);
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
      s,
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
  constructor(t, e, s) {
    v(this, "layoutManager");
    v(this, "scrollState");
    v(this, "canvas");
    this.layoutManager = t, this.scrollState = e, this.canvas = s;
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
    const { width: e, height: s, gap: i = dt.DEFAULT_GAP } = t, { width: o, height: n } = this.getLogicalCanvasSize(), r = this.calculateX(t, e, o), { anchorY: a, cellViewportY: l } = this.calculateAnchorY(t), { y: h, showAbove: c } = this.calculateInitialY(a, s, i, n);
    return { x: r, y: h, showAbove: c, anchorViewportY: a, cellViewportY: l };
  }
  /**
   * Update Y position during scroll (preserves or toggles showAbove)
   */
  updateY(t, e, s, i = dt.DEFAULT_GAP) {
    const { height: o } = this.getLogicalCanvasSize(), { anchorY: n, cellViewportY: r } = this.calculateAnchorY(t);
    let a;
    e ? a = n - i - s : a = n + i;
    let l = e;
    return e && a < 0 ? n + i + s <= o && (a = n + i, l = !1) : !e && a + s > o && n - i - s >= 0 && (a = n - i - s, l = !0), { y: a, showAbove: l, cellViewportY: r };
  }
  /**
   * Update X position during horizontal scroll
   */
  updateX(t, e) {
    const { width: s } = this.getLogicalCanvasSize();
    return this.calculateX(t, e, s);
  }
  /**
   * Calculate X position (handles fixed columns and boundary)
   */
  calculateX(t, e, s) {
    let i;
    t.anchorType === "header" ? i = this.getHeaderCellX(t.columnKey, t.column) : t.anchorType === "button" && t.buttonRelativeX !== void 0 ? i = this.getCellViewportX(t) + t.buttonRelativeX : i = this.getCellViewportX(t);
    const o = dt.EDGE_PADDING, n = t.column ?? this.getColumn(t), r = (n == null ? void 0 : n.width) ?? 100, l = i + r > o && i < s - o;
    let h = i;
    return l && (e <= s - o * 2 ? (h + e > s - o && (h = s - e - o), h < o && (h = o)) : h = (s - e) / 2), h;
  }
  /**
   * Get cell viewport X (handles fixed columns)
   */
  getCellViewportX(t) {
    const e = this.getCellPosition(t), s = t.column ?? this.getColumn(t);
    return s != null && s.fixed ? e.x : e.x - this.scrollState.scrollLeft;
  }
  /**
   * Get cell position from params
   */
  getCellPosition(t) {
    return t.cell ? this.layoutManager.getCellPosition(t.cell.rowIndex, t.cell.columnIndex) : this.layoutManager.getCellPosition(0, t.columnIndex ?? 0);
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
      const s = this.layoutManager.getColumns();
      let i = 0;
      for (const o of s) {
        if (o.key === t)
          return o.fixed ? i : i - this.scrollState.scrollLeft;
        i += o.width ?? 100;
      }
    }
    return 0;
  }
  /**
   * Calculate Y anchor point based on anchor type
   */
  calculateAnchorY(t) {
    const e = this.getCellPosition(t), s = e.y - this.scrollState.scrollTop;
    switch (t.anchorType) {
      case "cell":
        return {
          anchorY: s + e.height,
          // Cell bottom
          cellViewportY: s
        };
      case "cell-top":
        return {
          anchorY: s,
          // Cell top
          cellViewportY: s
        };
      case "button":
        return {
          anchorY: s + t.buttonY + t.buttonHeight,
          // Button bottom
          cellViewportY: s
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
  calculateInitialY(t, e, s, i) {
    let o = t + s, n = !1;
    if (o + e > i) {
      const r = t - s - e;
      r >= 0 && (o = r, n = !0);
    }
    return { y: o, showAbove: n };
  }
  /**
   * Check if cell is still visible in viewport
   */
  isCellInViewport(t) {
    const e = this.getCellPosition(t), s = e.y - this.scrollState.scrollTop, i = this.layoutManager.getLayoutInfo().headerHeight, { height: o } = this.getLogicalCanvasSize();
    return s >= i && s + e.height <= o;
  }
};
// Default configuration
v(dt, "DEFAULT_GAP", 4), v(dt, "EDGE_PADDING", 8);
let It = dt;
class at {
  constructor(t, e) {
    v(this, "context");
    v(this, "eventEmitter");
    v(this, "dropdownCalculator");
    this.context = t, this.eventEmitter = e, this.dropdownCalculator = new It(
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
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], i = this.rows[t.rowIndex];
    return !s || !i ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: i,
      column: s
    };
  }
  /**
   * Calculate cell viewport X position
   */
  getCellViewportX(t, e) {
    return e != null && e.fixed ? t.x : t.x - this.scrollState.scrollLeft;
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
  calculateDropdownPosition(t, e, s, i = "cell", o) {
    return this.dropdownCalculator.calculate({
      cell: t,
      column: (o == null ? void 0 : o.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
      width: e,
      height: s,
      anchorType: i,
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
  updateDropdownY(t, e, s, i) {
    return this.dropdownCalculator.updateY(
      {
        cell: t,
        column: (i == null ? void 0 : i.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
        anchorType: (i == null ? void 0 : i.anchorType) ?? "cell",
        buttonY: i == null ? void 0 : i.buttonY,
        buttonHeight: i == null ? void 0 : i.buttonHeight
      },
      e,
      s,
      i == null ? void 0 : i.gap
    );
  }
  /**
   * Update dropdown X position during horizontal scroll
   */
  updateDropdownX(t, e, s) {
    return this.dropdownCalculator.updateX(
      {
        cell: t,
        column: (s == null ? void 0 : s.column) ?? this.layoutManager.getLeafColumns()[t.columnIndex],
        anchorType: (s == null ? void 0 : s.anchorType) ?? "cell",
        buttonRelativeX: s == null ? void 0 : s.buttonRelativeX
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
class ze extends at {
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
    const e = this.state.selectedCells.findIndex((s) => {
      const { minRow: i, maxRow: o, minCol: n, maxCol: r } = this.getNormalizedRange(s);
      return t.rowIndex >= i && t.rowIndex <= o && t.columnIndex >= n && t.columnIndex <= r;
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
    const s = this.layoutManager.getLeafColumns(), i = this.state.selectedCells[0].start, o = Z(i.rowIndex + t, 0, this.rows.length - 1), n = Z(i.columnIndex + e, 0, s.length - 1), r = { rowIndex: o, columnIndex: n };
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
    const e = this.layoutManager.getScrollOffsetForRow(t.rowIndex), s = this.layoutManager.getScrollOffsetForColumn(t.columnIndex);
    (e !== this.scrollState.scrollTop || s !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = s, this.scrollState.scrollTop = e, this.eventEmitter.emit(S.SCROLL, s, e));
  }
  /**
   * Check if a cell is selected
   */
  isCellSelected(t) {
    return this.state.selectedCells.some((e) => {
      const { minRow: s, maxRow: i, minCol: o, maxCol: n } = this.getNormalizedRange(e);
      return t.rowIndex >= s && t.rowIndex <= i && t.columnIndex >= o && t.columnIndex <= n;
    });
  }
  /**
   * Get selected cells as flat array
   */
  getSelectedCells() {
    const t = [];
    for (const e of this.state.selectedCells) {
      const { minRow: s, maxRow: i, minCol: o, maxCol: n } = this.getNormalizedRange(e);
      for (let r = s; r <= i; r++)
        for (let a = o; a <= n; a++)
          t.push({ rowIndex: r, columnIndex: a });
    }
    return t;
  }
}
class Ne extends at {
  constructor(e, s, i, o) {
    super(e, s);
    v(this, "selectionHandler");
    v(this, "editingConfig");
    this.selectionHandler = i, this.editingConfig = o;
  }
  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e) {
    e.preventDefault();
    const s = this.layoutManager.getLeafColumns();
    let i;
    if (this.state.selectedCells.length > 0) {
      const a = this.state.selectedCells[0];
      i = e.key === "ArrowUp" || e.key === "ArrowLeft" ? a.start : a.end;
    } else
      i = { rowIndex: 0, columnIndex: 0 };
    let o = i.rowIndex, n = i.columnIndex;
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
        n = Math.min(s.length - 1, n + 1);
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
    var i;
    if (this.state.selectedCells.length === 0) return null;
    e.preventDefault(), e.stopPropagation();
    const s = this.state.selectedCells[0].start;
    if (this.editingConfig.enabled !== !1) {
      const n = this.layoutManager.getLeafColumns()[s.columnIndex], r = this.rows[s.rowIndex];
      if (n && r) {
        const a = nt(n, r, s.rowIndex), l = ["checkbox", "radio", "button", "switch"];
        return a.type && l.includes(a.type) ? a.type === "switch" && a.switch ? (et(n.disabled, r, n) || (r.data[X(n)] = !a.switch.checked, this.eventEmitter.emit(
          S.SWITCH_CHANGE,
          this.getCellInfo(s),
          !a.switch.checked
        )), null) : (this.toggleRowExpand(s.rowIndex), null) : n.editable === !1 || et(n.disabled, r, n) || (i = a.input) != null && i.readonly ? null : this.getEditingStartConfig(s, n, r, a);
      }
    } else
      this.toggleRowExpand(s.rowIndex);
    return null;
  }
  /**
   * Get editing start configuration for a cell
   */
  getEditingStartConfig(e, s, i, o) {
    const n = i.data[X(s)];
    if (s.editRender)
      try {
        const r = s.editRender(n, i, e.rowIndex);
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
    const s = this.layoutManager.getScrollOffsetForRow(e.rowIndex), i = this.layoutManager.getScrollOffsetForColumn(e.columnIndex);
    (s !== this.scrollState.scrollTop || i !== this.scrollState.scrollLeft) && (this.scrollState.scrollLeft = i, this.scrollState.scrollTop = s, this.eventEmitter.emit(S.SCROLL, i, s));
  }
  /**
   * Toggle row expand state
   */
  toggleRowExpand(e) {
    const s = this.rows[e];
    s && s.children && s.children.length > 0 && this.eventEmitter.emit(S.EXPAND, s, e, !s.expanded);
  }
  /**
   * Update editing config
   */
  updateEditingConfig(e) {
    this.editingConfig = e;
  }
}
const ht = class ht extends at {
  constructor(e, s, i) {
    super(e, s);
    v(this, "editingConfig");
    this.editingConfig = i;
  }
  /**
   * Validate if a cell can be edited
   */
  validateCellForEditing(e) {
    const i = this.layoutManager.getLeafColumns()[e.columnIndex];
    if (!i || i.editable === !1) return null;
    const o = this.rows[e.rowIndex];
    return !o || et(i.disabled, o, i) ? null : { column: i, row: o };
  }
  /**
   * Get edit configuration for a cell
   * Priority: editRender > render result > null (default logic)
   */
  getEditConfig(e, s, i) {
    const o = s.data[X(e)];
    if (e.editRender)
      try {
        const n = e.editRender(o, s, i);
        if (n) return n;
      } catch (n) {
        console.error("Error in editRender:", n);
      }
    if (e.render)
      try {
        const n = e.render(o, s, e, i);
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
  startEditing(e, s) {
    return this.validateCellForEditing(e) ? (this.state.tooltip = null, this.state.editingCell = e, this.eventEmitter.emit(S.EDIT_START, this.getCellInfo(e), s), !0) : !1;
  }
  /**
   * Start select dropdown editing
   */
  startSelectEditing(e, s) {
    var d;
    const i = this.validateCellForEditing(e);
    if (!i || !s) return !1;
    this.state.tooltip = null;
    const o = ht.DROPDOWN_ITEM_HEIGHT, n = ht.DROPDOWN_MAX_VISIBLE, r = ((d = s.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * o, h = i.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
      column: i.column
    });
    return this.state.dropdown = {
      cell: e,
      config: s,
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
  startTagsEditing(e, s) {
    var d;
    const i = this.validateCellForEditing(e);
    if (!i || !s) return !1;
    this.state.tooltip = null;
    const o = ht.DROPDOWN_ITEM_HEIGHT, n = ht.DROPDOWN_MAX_VISIBLE, r = ((d = s.options) == null ? void 0 : d.length) ?? 0, l = Math.min(r, n) * o, h = i.column.width ?? 100, c = this.calculateDropdownPosition(e, h, l, "cell", {
      column: i.column
    });
    return this.state.dropdown = {
      cell: e,
      config: {
        value: s.selectedValues,
        options: (s.options ?? []).map((u) => ({
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
      tagsConfig: s,
      showAbove: c.showAbove
    }, this.eventEmitter.emit(S.DROPDOWN_OPEN), !0;
  }
  /**
   * Start date editing
   */
  startDateEditing(e, s) {
    const i = this.validateCellForEditing(e);
    if (!i || !s) return !1;
    this.state.tooltip = null;
    const o = Math.max(i.column.width ?? 100, 280), n = 68 + 6 * 28 + 16, r = this.calculateDropdownPosition(e, o, n, "cell", {
      column: i.column
    });
    let a = null;
    s.value && (s.value instanceof Date ? a = s.value : typeof s.value == "string" && (a = new Date(s.value)));
    const l = (a == null ? void 0 : a.getFullYear()) ?? (/* @__PURE__ */ new Date()).getFullYear(), h = (a == null ? void 0 : a.getMonth()) ?? (/* @__PURE__ */ new Date()).getMonth();
    return this.state.dateDropdown = {
      cell: e,
      config: s,
      x: r.x,
      y: r.y,
      width: o,
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
  startImageEditing(e, s) {
    const i = this.validateCellForEditing(e);
    if (!i || !s) return !1;
    this.state.tooltip = null;
    const o = 64, n = 8, r = 8, a = 4, l = 60, h = o + r, c = a * o + (a - 1) * r + n * 2 + 4 + 4, d = 3, u = d * h + n * 2 - r, f = l + u, g = this.calculateDropdownPosition(e, c, f, "cell", {
      column: i.column
    }), m = s.images ?? (s.src ? [s.src] : []), p = !m || m.length <= 1 && !s.multiple;
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
    }, this.eventEmitter.emit(S.IMAGE_EDITOR_OPEN), !0;
  }
  /**
   * Start color picker editing
   */
  startColorEditing(e, s) {
    const i = this.validateCellForEditing(e);
    if (!i || !s) return !1;
    this.state.tooltip = null;
    const o = s.presetColors || this.getDefaultPresetColors(), n = 8, r = Math.ceil(o.length / n), a = 24, l = 4, h = 8, c = Math.max(
      i.column.width ?? 100,
      n * (a + l) + h * 2 - l
    ), d = r * (a + l) + h * 2 - l, u = this.calculateDropdownPosition(e, c, d, "cell", {
      column: i.column
    });
    return this.state.colorDropdown = {
      cell: e,
      config: s,
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
    const s = this.state.editingCell;
    this.state.editingCell = null, e && this.eventEmitter.emit(
      S.EDIT_END,
      this.getCellInfo(s),
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
v(ht, "DROPDOWN_ITEM_HEIGHT", 32), v(ht, "DROPDOWN_MAX_VISIBLE", 8);
let Et = ht;
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
    const { x: e, y: s, width: i, scrollTop: o, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = J.DROPDOWN_ITEM_HEIGHT, u = J.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const w = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + i && c >= s && c <= s + w) {
        const C = c - s + o, y = Math.floor(C / d);
        if (y >= 0 && y < (((p = r.options) == null ? void 0 : p.length) ?? 0) && r.options) {
          const b = r.options[y];
          if (!b.disabled)
            if (r.multiple !== !1) {
              const E = [...r.selectedValues ?? []], R = b.value ?? b.text, T = E.indexOf(R);
              T >= 0 ? E.splice(T, 1) : E.push(R);
              const D = this.state.dropdown.cell, k = this.layoutManager.getLeafColumns()[D.columnIndex], O = this.rows[D.rowIndex];
              k && O && (O.data[X(k)] = E), this.eventEmitter.emit(
                S.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                E,
                !0
              ), this.state.dropdown.tagsConfig = {
                ...r,
                selectedValues: E
              }, this.eventEmitter.emit(S.DROPDOWN_HOVER);
            } else {
              const E = b.value ?? b.text, R = this.state.dropdown.cell, D = this.layoutManager.getLeafColumns()[R.columnIndex], H = this.rows[R.rowIndex];
              D && H && (H.data[X(D)] = E), this.eventEmitter.emit(
                S.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell),
                [E],
                !1
              ), this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE);
            }
        }
        return !0;
      }
      return !1;
    }
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + i && c >= s && c <= s + g) {
      const x = c - s + o, w = Math.floor(x / d);
      if (w >= 0 && w < a.options.length) {
        const C = a.options[w];
        if (!C.disabled)
          if (a.multiple) {
            const y = Array.isArray(a.value) ? [...a.value] : [], b = C.value, I = y.indexOf(b);
            I >= 0 ? y.splice(I, 1) : y.push(b);
            const E = this.state.dropdown.cell, T = this.layoutManager.getLeafColumns()[E.columnIndex], D = this.rows[E.rowIndex];
            T && D && (D.data[X(T)] = y), this.eventEmitter.emit(
              S.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              y
            ), this.state.dropdown.config = {
              ...a,
              value: y
            }, this.eventEmitter.emit(S.DROPDOWN_HOVER);
          } else {
            const y = this.state.dropdown.cell, I = this.layoutManager.getLeafColumns()[y.columnIndex], E = this.rows[y.rowIndex];
            I && E && (E.data[X(I)] = C.value), this.eventEmitter.emit(
              S.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell),
              C.value
            ), this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE);
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
    const { x: e, y: s, width: i, scrollTop: o, type: n, tagsConfig: r, config: a } = this.state.dropdown, l = this.getViewportCoords(t), h = l.x, c = l.y, d = J.DROPDOWN_ITEM_HEIGHT, u = J.DROPDOWN_MAX_VISIBLE;
    if (n === "tags" && r) {
      const w = Math.min(((m = r.options) == null ? void 0 : m.length) ?? 0, u) * d;
      if (h >= e && h <= e + i && c >= s && c <= s + w) {
        const C = c - s + o, y = Math.floor(C / d);
        y >= 0 && y < (((p = r.options) == null ? void 0 : p.length) ?? 0) && (this.state.dropdown.hoveredIndex = y, this.eventEmitter.emit(S.DROPDOWN_HOVER));
      } else
        this.state.dropdown.hoveredIndex = -1;
      return;
    }
    const g = Math.min(a.options.length, u) * d;
    if (h >= e && h <= e + i && c >= s && c <= s + g) {
      const x = c - s + o, w = Math.floor(x / d);
      w >= 0 && w < a.options.length && (this.state.dropdown.hoveredIndex = w, this.eventEmitter.emit(S.DROPDOWN_HOVER));
    } else
      this.state.dropdown.hoveredIndex = -1;
  }
  /**
   * Handle buttons dropdown click
   */
  handleButtonsDropdownClick(t) {
    if (!this.state.buttonsDropdown) return !1;
    const { x: e, y: s, buttons: i, cell: o } = this.state.buttonsDropdown, n = this.getViewportCoords(t), r = n.x, a = n.y, l = J.DROPDOWN_ITEM_HEIGHT, h = i.length * l;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let c = 100;
    for (const d of i) {
      const u = d.text ?? "Button", f = this.ctx.measureText(u).width;
      c = Math.max(c, f + 24);
    }
    if (r >= e && r <= e + c && a >= s && a <= s + h) {
      const d = a - s, u = Math.floor(d / l);
      if (u >= 0 && u < i.length) {
        const f = i[u];
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
    const { x: e, y: s, buttons: i } = this.state.buttonsDropdown, o = this.getViewportCoords(t), n = o.x, r = o.y, a = J.DROPDOWN_ITEM_HEIGHT, l = i.length * a;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let h = 100;
    for (const c of i) {
      const d = c.text ?? "Button", u = this.ctx.measureText(d).width;
      h = Math.max(h, u + 24);
    }
    if (n >= e && n <= e + h && r >= s && r <= s + l) {
      const c = r - s, d = Math.floor(c / a);
      d >= 0 && d < i.length && (this.state.buttonsDropdown.hoveredIndex = d, this.eventEmitter.emit(S.DROPDOWN_HOVER));
    } else
      this.state.buttonsDropdown.hoveredIndex = -1;
  }
  /**
   * Handle filter dropdown click
   */
  handleFilterDropdownClick(t) {
    if (!this.state.filterDropdown) return !1;
    const { x: e, y: s, width: i, mode: o } = this.state.filterDropdown, n = this.getViewportCoords(t), r = n.x, a = n.y, l = 8;
    if (o === "dateRange") {
      const g = l + 32 + 4 + 36, m = r >= e && r <= e + i && a >= s && a <= s + g;
      let p = !1;
      if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0) {
        const C = (i - l * 3) / 2, y = e + l, b = e + l + C + 8, I = s + l;
        let T = (this.state.filterDropdown.activeDateField === "startDate" ? y : b) + C / 2 - 240 / 2;
        T < e && (T = e), T + 240 > e + i && (T = e + i - 240);
        const D = I + 32 + 8;
        p = r >= T && r <= T + 240 && a >= D && a <= D + 252;
      }
      return m || p ? (this.handleDateRangeModeClick(t, r, a), !0) : !1;
    }
    const h = this.getFilterDropdownHeight();
    if (r >= e && r <= e + i && a >= s && a <= s + h) {
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
    const { mode: t, options: e } = this.state.filterDropdown, s = 8, i = 4, o = 36;
    switch (t) {
      case "search":
        return s + 36 + i + o;
      case "select": {
        const n = J.DROPDOWN_ITEM_HEIGHT, r = J.DROPDOWN_MAX_VISIBLE, a = 32, l = 4, c = Math.min((e == null ? void 0 : e.length) ?? 0, r) * n;
        return s + a + l + c + l + o;
      }
      case "range":
        return s + 32 + i + o;
      case "boolean":
        return s + 32 * 3 + i + o;
      case "dateRange":
        return s + 32 + i + o;
      default:
        return 0;
    }
  }
  /**
   * 处理 select 模式点击
   */
  handleSelectModeClick(t, e, s) {
    if (!this.state.filterDropdown) return;
    const { x: i, y: o, width: n, options: r, scrollTop: a } = this.state.filterDropdown;
    if (!r) return;
    const l = J.DROPDOWN_ITEM_HEIGHT, h = J.DROPDOWN_MAX_VISIBLE, c = Math.min(r.length, h), d = 36, u = 32, f = c * l, g = 8, m = 4;
    if (r.length > h) {
      const C = r.length * l, y = Math.max(20, f / C * f), b = f - y, I = a / (C - f) * b, E = i + n - 6 - 2, R = o + g + u + m;
      if (e >= E && e <= E + 6 && s >= R + I && s <= R + I + y) {
        this.state.filterDropdown.isScrollbarDragging = !0, this.state.filterDropdown.scrollbarDragStartY = t.clientY, this.state.filterDropdown.scrollbarDragStartScrollTop = a;
        return;
      }
    }
    const p = o + g + u + m + f + m;
    if (s >= p && s <= p + d) {
      this.ctx.font = "14px sans-serif";
      const C = "重置", y = "确定", b = this.ctx.measureText(C).width, I = this.ctx.measureText(y).width, E = i + g, R = i + n - g - I;
      if (e >= E && e <= E + b + 10) {
        this.state.filterDropdown.options && this.state.filterDropdown.options.forEach((T) => T.checked = !1), this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= R - 10 && e <= R + I) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
    const x = o + g + u + m;
    if (s >= x && s <= x + f) {
      const w = s - x + a, C = Math.floor(w / l);
      C >= 0 && C < r.length && (r[C].checked = !r[C].checked, this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE));
    }
  }
  /**
   * 处理 search 模式点击
   */
  handleSearchModeClick(t, e, s) {
    if (!this.state.filterDropdown) return;
    const { x: i, y: o, width: n } = this.state.filterDropdown, r = 8, a = 4, l = 36, h = 36, c = o + r + l + a;
    if (s >= c && s <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = "重置", f = "确定", g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, p = i + r, x = i + n - r - m;
      if (e >= p && e <= p + g + 10) {
        this.state.filterDropdown.searchValue = "", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= x - 10 && e <= x + m) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 range 模式点击
   */
  handleRangeModeClick(t, e, s) {
    if (!this.state.filterDropdown) return;
    const { x: i, y: o, width: n } = this.state.filterDropdown, r = 8, a = 32, l = 4, h = 36, c = o + r + a + l;
    if (s >= c && s <= c + h) {
      this.ctx.font = "14px sans-serif";
      const u = "重置", f = "确定", g = this.ctx.measureText(u).width, m = this.ctx.measureText(f).width, p = i + r, x = i + n - r - m;
      if (e >= p && e <= p + g + 10) {
        this.state.filterDropdown.minValue = "", this.state.filterDropdown.maxValue = "", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= x - 10 && e <= x + m) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 boolean 模式点击
   */
  handleBooleanModeClick(t, e, s) {
    if (!this.state.filterDropdown) return;
    const { x: i, y: o, width: n } = this.state.filterDropdown, r = 8, a = 4, l = 32, h = 36, c = o + r, d = l * 3;
    if (s >= c && s <= c + d) {
      const f = Math.floor((s - c) / l), g = ["all", "true", "false"];
      f >= 0 && f < 3 && (this.state.filterDropdown.boolValue = g[f], this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE));
      return;
    }
    const u = o + r + d + a;
    if (s >= u && s <= u + h) {
      this.ctx.font = "14px sans-serif";
      const g = "重置", m = "确定", p = this.ctx.measureText(g).width, x = this.ctx.measureText(m).width, w = i + r, C = i + n - r - x;
      if (e >= w && e <= w + p + 10) {
        this.state.filterDropdown.boolValue = "all", this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= C - 10 && e <= C + x) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * 处理 dateRange 模式点击
   */
  handleDateRangeModeClick(t, e, s) {
    if (!this.state.filterDropdown) return;
    const { x: i, y: o, width: n, startDate: r, endDate: a } = this.state.filterDropdown, l = 8, h = 32, c = 8, d = 4, u = 36, f = o + l, g = (n - l * 3) / 2, m = i + l, p = i + l + g + c;
    if (e >= m && e <= m + g && s >= f && s <= f + h) {
      this.state.filterDropdown.activeDateField = "startDate";
      const w = r || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (e >= p && e <= p + g && s >= f && s <= f + h) {
      this.state.filterDropdown.activeDateField = "endDate";
      const w = a || /* @__PURE__ */ new Date();
      this.state.filterDropdown.currentYear = w.getFullYear(), this.state.filterDropdown.currentMonth = w.getMonth(), this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
      return;
    }
    if (this.state.filterDropdown.activeDateField && this.state.filterDropdown.currentYear !== void 0 && this.state.filterDropdown.currentMonth !== void 0 && this.handleDateRangeCalendarClick(
      e,
      s,
      i,
      o,
      n,
      l,
      h,
      c
    ))
      return;
    const x = o + l + h + d;
    if (s >= x && s <= x + u) {
      this.ctx.font = "14px sans-serif";
      const C = "重置", y = "确定", b = this.ctx.measureText(C).width, I = this.ctx.measureText(y).width, E = i + l, R = i + n - l - I;
      if (e >= E && e <= E + b + 10) {
        this.state.filterDropdown.startDate = null, this.state.filterDropdown.endDate = null, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_RESET);
        return;
      }
      if (e >= R - 10 && e <= R + I) {
        this.eventEmitter.emit(S.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }
  /**
   * Handle calendar popover click for date range filter
   */
  handleDateRangeCalendarClick(t, e, s, i, o, n, r, a) {
    if (!this.state.filterDropdown) return !1;
    const { activeDateField: l, currentYear: h, currentMonth: c } = this.state.filterDropdown;
    if (!l || h === void 0 || c === void 0) return !1;
    const d = 40, u = 28, f = 28, g = 8, p = d + u + 6 * f + g * 2, x = 240, w = (o - n * 3) / 2, C = s + n, y = s + n + w + a, b = i + n;
    let R = (l === "startDate" ? C : y) + w / 2 - x / 2;
    R < s && (R = s), R + x > s + o && (R = s + o - x);
    const T = b + r + a;
    if (t < R || t > R + x || e < T || e > T + p)
      return !1;
    if (e >= T && e <= T + d) {
      const P = R + 20, L = R + x - 20;
      if (t >= P - 6 - 5 && t <= P + 6 + 5)
        return c === 0 ? (this.state.filterDropdown.currentYear = h - 1, this.state.filterDropdown.currentMonth = 11) : this.state.filterDropdown.currentMonth = c - 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN), !0;
      if (t >= L - 6 - 5 && t <= L + 6 + 5)
        return c === 11 ? (this.state.filterDropdown.currentYear = h + 1, this.state.filterDropdown.currentMonth = 0) : this.state.filterDropdown.currentMonth = c + 1, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN), !0;
    }
    const D = (x - g * 2) / 7, k = new Date(h, c, 1).getDay(), O = new Date(h, c + 1, 0).getDate(), A = T + d + u;
    for (let W = 1; W <= O; W++) {
      const P = k + W - 1, L = Math.floor(P / 7), _ = P % 7, F = R + g + _ * D, Y = A + L * f;
      if (t >= F && t <= F + D && e >= Y && e <= Y + f) {
        const B = new Date(h, c, W);
        return l === "startDate" ? this.state.filterDropdown.startDate = B : this.state.filterDropdown.endDate = B, this.state.filterDropdown.activeDateField = void 0, this.state.filterDropdown.currentYear = void 0, this.state.filterDropdown.currentMonth = void 0, this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CHANGE), !0;
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
      y: s,
      width: i,
      activeDateField: o,
      currentYear: n,
      currentMonth: r,
      hoveredDate: a
    } = this.state.filterDropdown;
    if (!o || n === void 0 || r === void 0)
      return;
    const l = this.getViewportCoords(t), h = l.x, c = l.y, d = 8, u = 32, f = 8, g = 40, m = 28, p = 28, x = 8, C = g + m + 6 * p + x * 2, y = 240, b = (i - d * 3) / 2, I = e + d, E = e + d + b + f, R = s + d;
    let H = (o === "startDate" ? I : E) + b / 2 - y / 2;
    H < e && (H = e), H + y > e + i && (H = e + i - y);
    const k = R + u + f;
    if (h < H || h > H + y || c < k || c > k + C) {
      this.state.filterDropdown.hoveredDate !== null && (this.state.filterDropdown.hoveredDate = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
      return;
    }
    const O = (y - x * 2) / 7, W = new Date(n, r, 1).getDay(), P = new Date(n, r + 1, 0).getDate(), L = k + g + m;
    let _ = null;
    for (let B = 1; B <= P; B++) {
      const z = W + B - 1, U = Math.floor(z / 7), G = z % 7, $ = H + x + G * O, Q = L + U * p;
      if (h >= $ && h <= $ + O && c >= Q && c <= Q + p) {
        _ = new Date(n, r, B);
        break;
      }
    }
    const F = a ? a.getTime() : null, Y = _ ? _.getTime() : null;
    F !== Y && (this.state.filterDropdown.hoveredDate = _, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
  }
  /**
   * Handle filter dropdown hover
   */
  handleFilterDropdownHover(t) {
    if (!this.state.filterDropdown) return;
    const { mode: e, x: s, y: i, width: o, options: n, scrollTop: r } = this.state.filterDropdown;
    if (e === "dateRange") {
      this.handleDateRangeCalendarHover(t);
      return;
    }
    if (e !== "select" || !n) return;
    const a = this.getViewportCoords(t), l = a.x, h = a.y, c = J.DROPDOWN_ITEM_HEIGHT, d = J.DROPDOWN_MAX_VISIBLE, u = Math.min(n.length, d), f = 36, g = u * c;
    if (n.length > d) {
      const x = n.length * c, w = Math.max(20, g / x * g), C = g - w, y = r / (x - g) * C, b = s + o - 6 - 2;
      if (l >= b && l <= b + 6 && h >= i + f + y && h <= i + f + y + w) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }
    const m = i + f;
    if (l >= s && l <= s + o && h >= m && h <= m + g) {
      const p = h - m + r, x = Math.floor(p / c);
      x >= 0 && x < n.length && (this.state.filterDropdown.hoveredIndex = x, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN));
    } else
      this.state.filterDropdown.hoveredIndex = -1;
  }
  /**
   * Update dropdown position after scroll
   */
  updateDropdownPosition() {
    var u, f;
    if (!this.state.dropdown) return;
    const { cell: t, width: e, showAbove: s } = this.state.dropdown, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) return;
    const n = J.DROPDOWN_ITEM_HEIGHT, r = J.DROPDOWN_MAX_VISIBLE;
    let a;
    this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig ? a = ((u = this.state.dropdown.tagsConfig.options) == null ? void 0 : u.length) ?? 0 : a = ((f = this.state.dropdown.config.options) == null ? void 0 : f.length) ?? 0;
    const h = Math.min(a, r) * n, c = this.updateDropdownY(t, s ?? !1, h, { column: o }), d = this.updateDropdownX(t, e, { column: o });
    this.state.dropdown.x = d, this.state.dropdown.y = c.y, this.state.dropdown.showAbove = c.showAbove, this.eventEmitter.emit(S.DROPDOWN_HOVER);
  }
  /**
   * Close all dropdowns
   */
  closeAllDropdowns() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE)), this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE)), this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE)), this.state.buttonsDropdown && (this.state.buttonsDropdown = null, this.eventEmitter.emit(S.BUTTONS_DROPDOWN_CLOSE)), this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE));
  }
  /**
   * Update filter dropdown position
   */
  updateFilterDropdownPosition() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.layoutManager.getLeafColumns(), s = e.findIndex((a) => a.key === t);
    if (s < 0) return;
    const i = e[s];
    if (!i) return;
    const o = this.layoutManager.getCellPosition(-1, s), n = this.layoutManager.getLayoutInfo().headerHeight;
    let r;
    i.fixed === "left" || i.fixed === "right" ? r = o.x : r = o.x - this.scrollState.scrollLeft, this.state.filterDropdown.x = r, this.state.filterDropdown.y = n, this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
  }
  /**
   * Update date dropdown position
   */
  updateDateDropdownPosition() {
    if (!this.state.dateDropdown) return;
    const { cell: t, showAbove: e } = this.state.dateDropdown, i = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!i) return;
    const o = 68 + 6 * 28 + 16, n = Math.max(i.width ?? 100, 280), r = this.updateDropdownY(t, e ?? !1, o, { column: i }), a = this.updateDropdownX(t, n, { column: i });
    this.state.dateDropdown.x = a, this.state.dateDropdown.y = r.y, this.state.dateDropdown.width = n, this.state.dateDropdown.showAbove = r.showAbove, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN);
  }
  /**
   * Update color dropdown position
   */
  updateColorDropdownPosition() {
    if (!this.state.colorDropdown) return;
    const { cell: t, config: e } = this.state.colorDropdown, i = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!i) return;
    const o = e.presetColors || this.getDefaultPresetColors(), n = 8, r = Math.ceil(o.length / n), a = 24, l = 4, h = 8, c = r * (a + l) + h * 2 - l, d = Math.max(
      i.width ?? 100,
      n * (a + l) + h * 2 - l
    ), u = this.updateDropdownY(t, !1, c, { column: i }), f = this.updateDropdownX(t, d, { column: i });
    this.state.colorDropdown.x = f, this.state.colorDropdown.y = u.y, this.state.colorDropdown.width = d, this.eventEmitter.emit(S.COLOR_DROPDOWN_OPEN);
  }
  /**
   * Update buttons dropdown position
   */
  updateButtonsDropdownPosition() {
    if (!this.state.buttonsDropdown) return;
    const { cell: t, buttonRelativeX: e, buttonY: s, buttonHeight: i, buttons: o, showAbove: n } = this.state.buttonsDropdown, a = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!a) {
      this.state.buttonsDropdown = null;
      return;
    }
    const l = J.DROPDOWN_ITEM_HEIGHT, h = o.length * l, c = this.updateDropdownY(t, n, h, {
      column: a,
      anchorType: "button",
      buttonY: s,
      buttonHeight: i
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
    const e = t.getFullYear(), s = String(t.getMonth() + 1).padStart(2, "0"), i = String(t.getDate()).padStart(2, "0");
    return `${e}-${s}-${i}`;
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
    const e = this.getViewportCoords(t), s = e.x, i = e.y, { x: o, y: n, width: r, currentYear: a, currentMonth: l } = this.state.dateDropdown, h = 40, c = 28, d = 28, u = 8, g = h + c + 6 * d + u * 2;
    if (s >= o && s <= o + r && i >= n && i <= n + g) {
      const p = o + 20, x = o + r - 20;
      if (i >= n && i <= n + h) {
        if (s >= p - 6 - 5 && s <= p + 6 + 5)
          return l === 0 ? (this.state.dateDropdown.currentYear = a - 1, this.state.dateDropdown.currentMonth = 11) : this.state.dateDropdown.currentMonth = l - 1, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
        if (s >= x - 6 - 5 && s <= x + 6 + 5)
          return l === 11 ? (this.state.dateDropdown.currentYear = a + 1, this.state.dateDropdown.currentMonth = 0) : this.state.dateDropdown.currentMonth = l + 1, this.eventEmitter.emit(S.DATE_DROPDOWN_OPEN), !0;
      }
      const w = (r - u * 2) / 7, y = new Date(a, l, 1).getDay(), b = new Date(a, l + 1, 0).getDate();
      for (let I = 1; I <= b; I++) {
        const E = y + I - 1, R = Math.floor(E / 7), T = E % 7, D = o + u + T * w, H = n + h + c + R * d;
        if (s >= D && s <= D + w && i >= H && i <= H + d) {
          const k = new Date(a, l, I), O = this.formatDate(k), A = this.state.dateDropdown.cell, P = this.layoutManager.getLeafColumns()[A.columnIndex], L = this.rows[A.rowIndex];
          return P && L && (L.data[X(P)] = O), this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE), this.eventEmitter.emit(S.DATE_SELECT, this.getCellInfo(A), O), !0;
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
    const e = this.getViewportCoords(t), s = e.x, i = e.y, {
      x: o,
      y: n,
      width: r,
      currentYear: a,
      currentMonth: l,
      hoveredDate: h
    } = this.state.dateDropdown, c = 40, d = 28, u = 28, f = 8, m = c + d + 6 * u + f * 2;
    let p = null;
    if (s >= o && s <= o + r && i >= n && i <= n + m) {
      const C = (r - f * 2) / 7, b = new Date(a, l, 1).getDay(), I = new Date(a, l + 1, 0).getDate();
      for (let E = 1; E <= I; E++) {
        const R = b + E - 1, T = Math.floor(R / 7), D = R % 7, H = o + f + D * C, k = n + c + d + T * u;
        if (s >= H && s <= H + C && i >= k && i <= k + u) {
          p = new Date(a, l, E);
          break;
        }
      }
    }
    const x = h ? h.getTime() : null, w = p ? p.getTime() : null;
    x !== w && (this.state.dateDropdown.hoveredDate = p, this.eventEmitter.emit(S.DATE_DROPDOWN_HOVER));
  }
  /**
   * Handle color dropdown click
   */
  handleColorDropdownClick(t) {
    if (!this.state.colorDropdown) return !1;
    const e = this.getViewportCoords(t), s = e.x, i = e.y, { cell: o, config: n, x: r, y: a, width: l } = this.state.colorDropdown, h = n.presetColors || this.getDefaultPresetColors(), c = 8, d = 24, u = 4, f = 8, m = Math.ceil(h.length / c) * (d + u) + f * 2 - u;
    if (s >= r && s <= r + l && i >= a && i <= a + m) {
      const p = Math.floor((s - r - f) / (d + u)), x = Math.floor((i - a - f) / (d + u));
      if (p >= 0 && p < c && x >= 0) {
        const w = x * c + p;
        if (w >= 0 && w < h.length) {
          const C = h[w], b = this.layoutManager.getLeafColumns()[o.columnIndex], I = this.rows[o.rowIndex];
          return b && I && (I.data[X(b)] = C), this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE), this.eventEmitter.emit(S.COLOR_CHANGE, this.getCellInfo(o), C), !0;
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
    const e = this.getViewportCoords(t), s = e.x, i = e.y, { config: o, x: n, y: r } = this.state.colorDropdown, a = o.presetColors || this.getDefaultPresetColors(), l = 8, h = 24, c = 4, d = 8, u = Math.floor((s - n - d) / (h + c)), f = Math.floor((i - r - d) / (h + c));
    let g = null;
    if (u >= 0 && u < l && f >= 0) {
      const m = f * l + u;
      m >= 0 && m < a.length && (g = a[m]);
    }
    this.state.colorDropdown.hoveredColor !== g && (this.state.colorDropdown.hoveredColor = g, this.eventEmitter.emit(S.COLOR_DROPDOWN_HOVER));
  }
};
v(J, "DROPDOWN_ITEM_HEIGHT", 32), v(J, "DROPDOWN_MAX_VISIBLE", 8);
let St = J;
const N = class N extends at {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle image tooltip hover
   */
  handleImageTooltipHover(t) {
    if (!this.state.imageTooltip) return !1;
    const { x: e, y: s, images: i, scrollTop: o, maxRows: n } = this.state.imageTooltip, r = this.getViewportCoords(t), a = r.x, l = r.y, h = N.IMAGE_SIZE, c = N.IMAGE_PADDING, d = N.IMAGE_GAP, u = N.IMAGES_PER_ROW, m = u * h + (u - 1) * d + c * 2 + 4 + 4, p = h + d, x = n * p + c * 2 - d, w = this.state.imageTooltip.hoveredIndex;
    if (a >= e && a <= e + m && l >= s && l <= s + x) {
      const C = Math.ceil(i.length / u), y = Math.floor(o / p), b = Math.min(C, y + n + 1);
      for (let I = y; I < b; I++)
        for (let E = 0; E < u; E++) {
          const R = I * u + E;
          if (R >= i.length) break;
          const T = e + c + E * (h + d), D = s + c + I * p - o;
          if (a >= T && a <= T + h && l >= D && l <= D + h)
            return this.state.imageTooltip.hoveredIndex = R, w !== R && this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL), !0;
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
    const { x: e, y: s, images: i, cell: o, scrollTop: n, maxRows: r } = this.state.imageTooltip, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, p = f * c + (f - 1) * u + d * 2 + 4 + 4, x = c + u, w = r * x + d * 2 - u;
    if (l < e || l > e + p || h < s || h > s + w)
      return !1;
    const C = l - e - d, y = h - s - d + n, b = Math.floor(C / (c + u)), I = Math.floor(y / x);
    if (b >= 0 && b < f && I >= 0) {
      const E = I * f + b;
      if (E >= 0 && E < i.length) {
        const R = i[E];
        R && this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(o), R, t);
      }
    }
    return !0;
  }
  /**
   * Handle image editor hover
   */
  handleImageEditorHover(t) {
    if (!this.state.imageEditor) return !1;
    const { x: e, y: s, images: i, pendingImages: o, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, g = N.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, p = f * c + (f - 1) * u + d * 2 + 4 + 4, x = r * m + d * 2 - u, w = g + x, C = this.state.imageEditor.hoveredIndex;
    if (l < e || l > e + p || h < s || h > s + w)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !1;
    if (h >= s && h <= s + g)
      return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !0;
    const y = s + g, b = i.length + o.length;
    for (let I = 0; I < r + 1; I++)
      for (let E = 0; E < f; E++) {
        const R = I * f + E;
        if (R >= b) break;
        const T = e + d + E * (c + u), D = y + d + I * m - n;
        if (l >= T && l <= T + c && h >= D && h <= D + c)
          return this.state.imageEditor.hoveredIndex = R, C !== R && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !0;
      }
    return this.state.imageEditor.hoveredIndex = -1, C !== -1 && this.eventEmitter.emit(S.IMAGE_EDITOR_HOVER), !0;
  }
  /**
   * Handle image editor click
   */
  handleImageEditorClick(t) {
    var b;
    if (!this.state.imageEditor) return "outside";
    const { x: e, y: s, images: i, cell: o, scrollTop: n, maxRows: r } = this.state.imageEditor, a = this.getViewportCoords(t), l = a.x, h = a.y, c = N.IMAGE_SIZE, d = N.IMAGE_PADDING, u = N.IMAGE_GAP, f = N.IMAGES_PER_ROW, g = N.IMAGE_UPLOAD_AREA_HEIGHT, m = c + u, p = f * c + (f - 1) * u + d * 2 + 4 + 4, x = r * m + d * 2 - u, w = g + x;
    if (l < e || l > e + p || h < s || h > s + w)
      return "outside";
    if (h >= s && h <= s + g)
      return "upload";
    const C = s + g, y = i.length + (((b = this.state.imageEditor.pendingImages) == null ? void 0 : b.length) ?? 0);
    for (let I = 0; I < r + 1; I++)
      for (let E = 0; E < f; E++) {
        const R = I * f + E;
        if (R >= y) break;
        const T = e + d + E * (c + u), D = C + d + I * m - n;
        if (l >= T && l <= T + c && h >= D && h <= D + c) {
          if (R < i.length) {
            const H = i[R];
            i.splice(R, 1), this.state.imageEditor.images = [...i], this.eventEmitter.emit(
              S.IMAGE_DELETE,
              this.getCellInfo(o),
              H,
              R
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
    const s = this.layoutManager.getLeafColumns()[this.state.imageEditor.cell.columnIndex];
    if (!s) return;
    const i = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!i) return;
    const n = (s.render ? s.render(
      i.data[X(s)],
      i,
      s,
      this.state.imageEditor.cell.rowIndex
    ) : { image: i.data[X(s)] }).image ?? {}, r = n.onUpload, a = n.maxCount, l = this.state.imageEditor.isSingleImage;
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
    const { cell: t, images: e, isSingleImage: s } = this.state.imageEditor, o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (o && n) {
      const r = n.data[X(o)];
      let a;
      if (s) {
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
    return new Promise((e, s) => {
      const i = new FileReader();
      i.onload = () => e(i.result), i.onerror = s, i.readAsDataURL(t);
    });
  }
  /**
   * Update image tooltip position after scroll
   */
  updateImageTooltipPosition() {
    if (!this.state.imageTooltip) return;
    const { cell: t, showAbove: e, maxRows: s } = this.state.imageTooltip, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) {
      this.state.imageTooltip = null;
      return;
    }
    const n = N.IMAGE_SIZE, r = N.IMAGE_PADDING, a = N.IMAGE_GAP, l = N.IMAGES_PER_ROW, h = l * n + (l - 1) * a + r * 2, c = n + a, d = s * c + r * 2 - a, u = this.updateDropdownY(t, e, d, { column: o }), f = this.updateDropdownX(t, h, { column: o });
    this.state.imageTooltip.x = f, this.state.imageTooltip.y = u.y, this.state.imageTooltip.showAbove = u.showAbove;
  }
  /**
   * Update image editor position after scroll
   */
  updateImageEditorPosition() {
    if (!this.state.imageEditor) return;
    const { cell: t, showAbove: e, maxRows: s } = this.state.imageEditor, o = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!o) {
      this.commitImageEditorChanges();
      return;
    }
    const n = N.IMAGE_SIZE, r = N.IMAGE_PADDING, a = N.IMAGE_GAP, l = N.IMAGES_PER_ROW, h = N.IMAGE_UPLOAD_AREA_HEIGHT, c = n + a, d = l * n + (l - 1) * a + r * 2 + 4 + 4, u = s * c + r * 2 - a, f = h + u, g = this.updateDropdownY(t, e, f, { column: o }), m = this.updateDropdownX(t, d, { column: o });
    this.state.imageEditor.x = m, this.state.imageEditor.y = g.y, this.state.imageEditor.showAbove = g.showAbove;
  }
  /**
   * Handle drag over event for image editor
   */
  handleDragOver(t) {
    if (!this.state.imageEditor) return !1;
    t.preventDefault();
    const e = this.getViewportCoords(t), s = e.x, i = e.y, { x: o, y: n, maxRows: r } = this.state.imageEditor, a = N.IMAGE_SIZE, l = N.IMAGE_PADDING, h = N.IMAGE_GAP, c = N.IMAGES_PER_ROW, d = N.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    return s >= o && s <= o + f && i >= n && i <= n + m ? (this.state.imageEditor.isDragging = !0, this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), !0) : !1;
  }
  /**
   * Handle drag leave event for image editor
   */
  handleDragLeave(t) {
    if (!this.state.imageEditor) return;
    const e = this.getViewportCoords(t), s = e.x, i = e.y, { x: o, y: n, maxRows: r } = this.state.imageEditor, a = N.IMAGE_SIZE, l = N.IMAGE_PADDING, h = N.IMAGE_GAP, c = N.IMAGES_PER_ROW, d = N.IMAGE_UPLOAD_AREA_HEIGHT, u = a + h, f = c * a + (c - 1) * h + l * 2 + 4 + 4, g = r * u + l * 2 - h, m = d + g;
    (s < o || s > o + f || i < n || i > n + m) && (this.state.imageEditor.isDragging = !1, this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL));
  }
  /**
   * Handle drop event for image editor
   */
  async handleDrop(t) {
    var s;
    if (!this.state.imageEditor) return !1;
    t.preventDefault(), this.state.imageEditor.isDragging = !1;
    const e = Array.from(((s = t.dataTransfer) == null ? void 0 : s.files) ?? []).filter(
      (i) => i.type.startsWith("image/")
    );
    return e.length > 0 && await this.handleFileUpload(e), this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL), !0;
  }
};
v(N, "IMAGE_SIZE", 64), v(N, "IMAGE_PADDING", 8), v(N, "IMAGE_GAP", 8), v(N, "IMAGES_PER_ROW", 4), v(N, "IMAGE_UPLOAD_AREA_HEIGHT", 60);
let Rt = N;
const ut = class ut extends at {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Handle context menu click
   */
  handleContextMenuClick(t) {
    if (!this.state.contextMenu) return !1;
    const { x: e, y: s, rowIndex: i } = this.state.contextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y, a = 140, l = ut.DROPDOWN_ITEM_HEIGHT, c = 3 * l;
    if (n >= e && n <= e + a && r >= s && r <= s + c) {
      const d = r - s, u = Math.floor(d / l);
      return u === 0 ? this.eventEmitter.emit(S.ROW_ADD_ABOVE, i) : u === 1 ? this.eventEmitter.emit(S.ROW_ADD_BELOW, i) : u === 2 && this.eventEmitter.emit(S.ROW_DELETE, i), this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE), !0;
    }
    return !1;
  }
  /**
   * Handle context menu hover
   */
  handleContextMenuHover(t) {
    if (!this.state.contextMenu) return;
    const { x: e, y: s, hoveredIndex: i } = this.state.contextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y, a = 140, l = ut.DROPDOWN_ITEM_HEIGHT, c = 3 * l;
    let d = -1;
    if (n >= e && n <= e + a && r >= s && r <= s + c) {
      const u = r - s;
      d = Math.floor(u / l);
    }
    d !== i && (this.state.contextMenu.hoveredIndex = d, this.eventEmitter.emit(S.CONTEXT_MENU_HOVER));
  }
  /**
   * Handle header context menu click
   */
  handleHeaderContextMenuClick(t) {
    if (!this.state.headerContextMenu) return !1;
    const { x: e, y: s, columnKey: i } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y;
    return n >= e && n <= e + 120 && r >= s && r <= s + 32 ? (this.eventEmitter.emit(S.COLUMN_HIDE, i), this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE), !0) : !1;
  }
  /**
   * Handle header context menu hover
   */
  handleHeaderContextMenuHover(t) {
    if (!this.state.headerContextMenu) return;
    const { x: e, y: s, hoveredIndex: i } = this.state.headerContextMenu, o = this.getViewportCoords(t), n = o.x, r = o.y, a = 120, l = 32;
    let h = -1;
    n >= e && n <= e + a && r >= s && r <= s + l && (h = 0), h !== i && (this.state.headerContextMenu.hoveredIndex = h, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_HOVER));
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
v(ut, "DROPDOWN_ITEM_HEIGHT", 32);
let Mt = ut;
class Xe extends at {
  constructor(e, s, i, o) {
    super(e, s);
    v(this, "sortConfig");
    v(this, "filterConfig");
    this.sortConfig = i, this.filterConfig = o;
  }
  /**
   * Handle header hover
   */
  handleHeaderHover(e, s, i) {
    const o = e.column, n = this.state.hoveredHeaderColumnKey;
    let r;
    if (o.fixed === "left")
      r = e.x;
    else if (o.fixed === "right") {
      const W = this.layoutManager.getRightFixedWidth(), L = this.layoutManager.getViewportWidth() - W - (this.layoutManager.getLayoutInfo().totalWidth - W);
      r = e.x + L;
    } else
      r = e.x - this.scrollState.scrollLeft;
    const a = e.y, l = e.width, h = e.height, c = 8, d = 10, u = 10, f = r + c, g = a + (h - u) / 2, p = o.reorderable !== !1 && s >= f && s <= f + d && i >= g && i <= g + u;
    this.state.hoveredHeaderColumnKey = o.key;
    const x = (o == null ? void 0 : o.filterable) && e.isLeaf;
    let w, C;
    x ? (w = r + l - c - 10, C = w - 16) : C = r + l - c - 10;
    const y = a + h / 2, b = 8, I = 5, E = 2, R = 4, T = y - E - I - R, D = y + E + I + R, H = C - b / 2 - R, k = C + b / 2 + R, O = e.isLeaf && x && w !== void 0 && Math.abs(s - w) < 12, A = e.isLeaf && o && o.sortable !== !1 && s >= H && s <= k && i >= T && i <= D;
    p ? this.canvas.style.cursor = "grab" : O || A ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", this.state.hoveredCell = null, this.state.tooltip = null, n !== this.state.hoveredHeaderColumnKey && this.eventEmitter.emit(S.HEADER_HOVER, this.state.hoveredHeaderColumnKey);
  }
  /**
   * Handle header mouse down
   */
  handleHeaderMouseDown(e, s) {
    const i = this.getViewportCoords(s), o = i.x, n = i.y, r = this.layoutManager.getHeaderCellAtPosition(o, n);
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
      const I = this.layoutManager.getRightFixedWidth(), R = this.layoutManager.getViewportWidth() - I, T = this.layoutManager.getLayoutInfo().totalWidth, D = R - (T - I);
      h = r.x + D;
    } else
      h = r.x - this.scrollState.scrollLeft;
    const c = r.y, d = r.height, u = 8, f = 10, g = 10, m = h + u, p = c + (d - g) / 2, x = o >= m && o <= m + f && n >= p && n <= p + g;
    if (r.isLeaf && !x || !r.isLeaf && !x)
      return !1;
    let w = a.key, C = e;
    if (!r.isLeaf && a.children && a.children.length > 0) {
      const I = this.getFirstLeaf(a);
      I && (w = a.key, C = this.layoutManager.getLeafColumnIndex(I), C < 0 && (C = e));
    }
    const y = this.calculateSiblingColumns(a), b = y.findIndex((I) => I.key === a.key);
    return this.state.columnReorderState = {
      dragColumnIndex: C,
      dragColumnKey: w,
      dragStartX: o,
      currentX: o,
      targetColumnIndex: C,
      isParentColumn: !r.isLeaf,
      isFixedColumn: !!a.fixed,
      siblingColumns: y,
      dragSiblingIndex: b,
      lastSwapTime: void 0,
      lastSwapTargetKey: void 0
    }, !0;
  }
  /**
   * Handle header click (sort/filter)
   */
  handleHeaderClick(e, s) {
    const i = this.layoutManager.getLeafColumn(e);
    if (!i) return;
    this.eventEmitter.emit(S.HEADER_CLICK, i, e, s);
    const o = this.getViewportCoords(s), n = o.x, r = o.y, a = this.layoutManager.getLeafHeaderCellViewportPosition(e);
    if (!a) return;
    const l = a.x, h = a.y, c = a.width, d = a.height, u = i.filterable, f = 8;
    let g, m;
    if (u ? (g = l + c - f - 10, m = g - 16) : m = l + c - f - 10, u && g !== void 0 && Math.abs(n - g) < 12) {
      this.openFilterDropdown(i, e);
      return;
    }
    if (i.sortable === !1)
      return;
    const p = h + d / 2, x = 8, w = 5, C = 2, y = 4, b = p - C - w - y, I = p - C + y, E = p + C - y, R = p + C + w + y, T = m - x / 2 - y, D = m + x / 2 + y;
    if (n >= T && n <= D && r >= b && r <= R) {
      const k = r >= b && r <= I, O = r >= E && r <= R;
      k ? this.setSortDirection(i, "asc", s) : O ? this.setSortDirection(i, "desc", s) : this.toggleSort(i, s);
    }
  }
  /**
   * Set sort direction
   */
  setSortDirection(e, s, i) {
    const o = this.sortConfig.findIndex((r) => r.column === e.key);
    if ((o >= 0 ? this.sortConfig[o].direction : "none") === s) {
      i.shiftKey ? o >= 0 && this.sortConfig.splice(o, 1) : this.sortConfig = [], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
      return;
    }
    i.shiftKey ? o >= 0 ? this.sortConfig[o].direction = s : this.sortConfig.push({ column: e.key, direction: s }) : this.sortConfig = [{ column: e.key, direction: s }], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Toggle sort
   */
  toggleSort(e, s) {
    const i = this.sortConfig.findIndex((n) => n.column === e.key);
    let o = "asc";
    if (i >= 0) {
      const n = this.sortConfig[i].direction;
      n === "asc" ? o = "desc" : n === "desc" && (o = "none");
    }
    s.shiftKey ? i >= 0 ? o === "none" ? this.sortConfig.splice(i, 1) : this.sortConfig[i].direction = o : o !== "none" && this.sortConfig.push({ column: e.key, direction: o }) : o === "none" ? this.sortConfig = [] : this.sortConfig = [{ column: e.key, direction: o }], this.eventEmitter.emit(S.SORT_CHANGE, [...this.sortConfig]);
  }
  /**
   * Open filter dropdown
   */
  openFilterDropdown(e, s) {
    const i = this.layoutManager.getCellPosition(-1, s), o = this.layoutManager.getLayoutInfo().headerHeight, n = ee(e);
    if (!n) return;
    let r;
    e.fixed === "left" || e.fixed === "right" ? r = i.x : r = i.x - this.scrollState.scrollLeft;
    const a = this.allRows.length > 0 ? this.allRows : this.rows, l = this.filterConfig.find((h) => h.column === e.key);
    switch (n) {
      case "search": {
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "search",
          x: r,
          y: o,
          width: Math.max(i.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          searchValue: (l == null ? void 0 : l.value) ?? ""
        };
        break;
      }
      case "select": {
        const h = Vt(e, a, 0), c = l ? l.value : [], d = h.length === 0 && a.length > 0;
        this.state.filterDropdown = {
          columnKey: e.key,
          mode: "select",
          x: r,
          y: o,
          width: Math.max(i.width, 200),
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
          width: Math.max(i.width, 200),
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
          width: Math.max(i.width, 240),
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
          width: Math.max(i.width, 160),
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
    const s = [], i = this.scrollState.scrollLeft;
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
        g -= i;
      }
      s.push({
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
    return s;
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
    let s = 0;
    for (const i of e.children)
      s += this.getChildLeafCount(i);
    return s;
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
class Ve extends at {
  constructor(e, s) {
    super(e, s);
    /**
     * Handle expand icon click
     */
    v(this, "handleExpandIconClick", (e, s, i) => {
      const o = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), a = this.layoutManager.getLeafColumns()[e.columnIndex], l = s.clientX - o.left, h = this.getCellViewportX(n, a), c = l - h, d = i.level ?? 0, u = 8, f = 8, g = d * 16, m = u + g, p = m + f + 4;
      return c >= m && c <= p ? (this.eventEmitter.emit(S.EXPAND, i, e.rowIndex, !i.expanded), !0) : !1;
    });
  }
  /**
   * Handle progress bar click
   */
  handleProgressClick(e, s, i, o, n) {
    if (!i.interactive || n && o && et(o.disabled, n, o)) return !1;
    const r = this.canvas.getBoundingClientRect(), a = s.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = i.shape ?? "line";
    if (c === "line") {
      const u = i.size ?? "medium", f = i.height ?? (u === "small" ? 6 : u === "large" ? 16 : 10), g = i.textPosition ?? "right", p = (i.showText ?? !0) && g === "right" ? 40 : 0, x = i.width ?? l.width - 8 * 2 - p, w = h + 8, C = l.y - this.scrollState.scrollTop + (l.height - f) / 2, y = s.clientY - r.top, b = a - w, I = y - C;
      if (b >= 0 && b <= x && I >= 0 && I <= f) {
        const E = i.precision ?? 0, R = Math.max(0, Math.min(100, b / x * 100)), T = E === 0 ? Math.round(R) : Number(R.toFixed(E));
        return o && n && (n.data[X(o)] = T), this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), T), !0;
      }
    } else if (c === "circle" || c === "dashboard") {
      const d = s.clientY - r.top, u = l.y - this.scrollState.scrollTop, f = i.size ?? "medium";
      let g, m = 0;
      c === "circle" ? g = f === "small" ? 0.6 : f === "large" ? 0.9 : 0.75 : (g = f === "small" ? 0.7 : f === "large" ? 0.95 : 0.85, m = l.height * 0.05);
      const p = Math.floor(l.height * g), x = i.width ?? p, w = i.strokeWidth ?? Math.max(2, Math.round(x * 0.12)), C = (x - w) / 2, y = h + l.width / 2, b = u + l.height / 2 + m, I = a - y, E = d - b, R = Math.sqrt(I * I + E * E);
      if (R >= C - w && R <= C + w) {
        let T = Math.atan2(E, I), D;
        if (c === "circle")
          T = T + Math.PI / 2, T < 0 && (T += Math.PI * 2), D = T / (Math.PI * 2) * 100;
        else {
          const k = Math.PI * 0.75, O = Math.PI * 1.5;
          T < 0 && (T += Math.PI * 2);
          let A = T - k;
          if (A < 0 && (A += Math.PI * 2), A > O) return !1;
          D = A / O * 100;
        }
        D = Math.max(0, Math.min(100, D));
        const H = i.precision ?? 0;
        return D = H === 0 ? Math.round(D) : Number(D.toFixed(H)), o && n && (n.data[X(o)] = D), this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), D), !0;
      }
    }
    return !1;
  }
  /**
   * Handle rating click
   */
  handleRatingClick(e, s, i, o, n) {
    if (n && o && et(o.disabled, n, o)) return !1;
    const r = this.canvas.getBoundingClientRect(), a = s.clientX - r.left, l = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), h = this.getCellViewportX(l, o), c = a - h, d = i.max ?? 5, u = i.starSize ?? 16, f = i.allowHalf ?? !1, g = i.value ?? 0, m = d * u, p = (l.width - m) / 2;
    for (let x = 0; x < d; x++) {
      const w = p + x * u;
      if (c >= w && c <= w + u) {
        let C;
        return f ? (c - w < u / 2 ? C = x + 0.5 : C = x + 1, C === g && (C = 0)) : (C = x + 1, C === g && (C = 0)), C = Math.min(C, d), o && n && (n.data[X(o)] = C), this.eventEmitter.emit(S.RATING_CHANGE, this.getCellInfo(e), C), !0;
      }
    }
    return !1;
  }
  /**
   * Get clicked radio option
   */
  getClickedRadioOption(e, s, i) {
    const o = this.canvas.getBoundingClientRect(), n = this.layoutManager.getCellPosition(e.rowIndex, e.columnIndex), a = this.layoutManager.getLeafColumns()[e.columnIndex], l = s.clientX - o.left, h = s.clientY - o.top, c = this.getCellViewportX(n, a), d = l - c, u = h - (n.y - this.scrollState.scrollTop), f = 8, g = 16, m = 4, p = n.width - f;
    this.ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let x = f;
    for (let w = 0; w < i.length; w++) {
      const C = i[w], y = this.ctx.measureText(C.label).width, b = g + m + y + f;
      if (x + b - f > p)
        break;
      const I = x, E = (n.height - g) / 2, R = E + g / 2, T = d >= I && d <= I + g && u >= E && u <= E + g, D = I + g + m, H = d >= D && d <= D + y && u >= R - 10 && u <= R + 10;
      if (T || H)
        return C;
      x += b;
    }
    return null;
  }
}
class Ye extends at {
  constructor(e, s) {
    super(e, s);
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
    const e = 150, s = Date.now();
    let i = !1;
    this.state.buttonHoverStates.forEach((o, n) => {
      const r = s - o.startTime, a = Math.abs(o.targetProgress - o.startProgress);
      if (a === 0) {
        this.state.buttonHoverStates.delete(n);
        return;
      }
      const l = e * a;
      let h = r / l;
      h = Math.max(0, Math.min(1, h));
      const c = o.startProgress + (o.targetProgress - o.startProgress) * h;
      o.progress = c, h >= 1 ? o.targetProgress === 0 && this.state.buttonHoverStates.delete(n) : i = !0;
    }), this.eventEmitter.emit(S.BUTTON_HOVER_ANIMATION_UPDATE), i ? requestAnimationFrame(() => this.runButtonHoverAnimationLoop()) : this.buttonHoverAnimationRunning = !1;
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
    const e = 200, s = Date.now();
    let i = !1;
    this.state.switchAnimations.forEach((o, n) => {
      const r = s - o.startTime, a = Math.abs(o.targetProgress - o.startProgress), l = e * a;
      let h = r / l;
      h = Math.max(0, Math.min(1, h));
      const c = o.startProgress + (o.targetProgress - o.startProgress) * h;
      o.progress = c, h >= 1 ? this.state.switchAnimations.delete(n) : i = !0;
    }), this.eventEmitter.emit(S.SWITCH_ANIMATION_UPDATE), i ? requestAnimationFrame(() => this.runSwitchAnimationLoop()) : this.switchAnimationRunning = !1;
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
const zt = 64;
class Ge extends at {
  constructor(t, e) {
    super(t, e);
  }
  /**
   * Get image size constant
   */
  static get IMAGE_SIZE() {
    return zt;
  }
  /**
   * Check and show tooltip for cell content
   */
  checkTooltip(t) {
    if (!t || t.rowIndex < 0) {
      this.state.tooltip = null;
      return;
    }
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], i = this.rows[t.rowIndex];
    if (!s || !i) {
      this.state.tooltip = null;
      return;
    }
    const o = nt(s, i, t.rowIndex), n = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), r = this.getCellViewportX(n, s), a = n.y - this.scrollState.scrollTop;
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
  handleTagsTooltip(t, e, s, i) {
    const a = s.width - 16;
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
      x: i,
      y: s.y - this.scrollState.scrollTop,
      width: s.width,
      content: { type: "tags", tags: e }
    };
  }
  /**
   * Handle select tooltip
   */
  handleSelectTooltip(t, e, s, i) {
    const r = s.width - 16 - 20;
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
        x: i,
        y: s.y - this.scrollState.scrollTop,
        width: s.width,
        content: { type: "text", text: a }
      };
      return;
    }
    this.state.tooltip = null;
  }
  /**
   * Handle image tooltip (preview dropdown)
   */
  handleImageTooltip(t, e, s, i, o) {
    const n = e.images;
    if (!n || n.length <= 1) {
      this.state.tooltip = null;
      return;
    }
    const r = this.canvas.getBoundingClientRect(), a = zt, l = 8, h = 8, c = 4, d = Math.ceil(n.length / c);
    let u;
    d <= 1 ? u = 1 : d <= 2 ? u = 2 : u = 3;
    const f = c * a + (c - 1) * h + l * 2, g = a + h, m = u * g + l * 2 - h;
    let p = o + s.height, x = !1;
    p + m > r.height && (p = o - m, x = !0);
    let w = i;
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
  handleTextTooltip(t, e, s, i) {
    const n = s.width - 16;
    if (this.ctx.measureText(e).width > n) {
      this.state.tooltip = {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        x: i,
        y: s.y - this.scrollState.scrollTop,
        width: s.width,
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
    const { cell: t } = this.state.tooltip, s = this.layoutManager.getLeafColumns()[t.columnIndex];
    if (!s) return;
    const i = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let o;
    s.fixed === "left" || s.fixed === "right" ? o = i.x : o = i.x - this.scrollState.scrollLeft;
    const n = i.y - this.scrollState.scrollTop;
    this.state.tooltip.x = o, this.state.tooltip.y = n, this.state.tooltip.width = i.width;
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
  constructor(t, e, s, i, o, n) {
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
    v(this, "handleMouseDown", (t) => {
      const e = this.canvas.getBoundingClientRect(), s = t.clientX - e.left, i = t.clientY - e.top;
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
        if (this.dropdownHandler.handleDateDropdownClick(t)) return;
        this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE);
        return;
      }
      if (this.state.colorDropdown) {
        if (this.dropdownHandler.handleColorDropdownClick(t)) return;
        this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE);
        return;
      }
      if (this.state.dropdown) {
        if (this.dropdownHandler.handleDropdownClick(t)) return;
        this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE);
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
      const o = this.layoutManager.hitTest(s, i, this.getScrollbarBounds());
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
    v(this, "handleDragOver", (t) => {
      this.imageHandler.handleDragOver(t);
    });
    v(this, "handleDragLeave", (t) => {
      this.imageHandler.handleDragLeave(t);
    });
    v(this, "handleDrop", async (t) => {
      await this.imageHandler.handleDrop(t);
    });
    v(this, "handleContextMenu", (t) => {
      t.preventDefault();
      const e = this.canvas.getBoundingClientRect(), s = t.clientX - e.left, i = t.clientY - e.top;
      this.state.contextMenu && (this.state.contextMenu = null, this.eventEmitter.emit(S.CONTEXT_MENU_CLOSE)), this.state.headerContextMenu && (this.state.headerContextMenu = null, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_CLOSE)), this.closeAllDropdowns();
      const n = this.layoutManager.getLayoutInfo().headerHeight;
      if (i <= n) {
        const p = this.layoutManager.getHeaderCellAtPosition(s, i);
        if (p) {
          const x = p.column;
          if (x.hideable === !1) return;
          const w = this.canvas.getBoundingClientRect(), C = 120, y = 32;
          let b = s, I = i;
          b + C > w.width && (b = w.width - C - 8), b < 0 && (b = 8), I + y > w.height && (I = w.height - y - 8), this.state.headerContextMenu = {
            x: b,
            y: I,
            columnKey: x.key,
            columnIndex: p.colIndex,
            hoveredIndex: -1
          }, this.eventEmitter.emit(S.HEADER_CONTEXT_MENU_OPEN);
          return;
        }
        return;
      }
      const r = s + this.scrollState.scrollLeft, a = i + this.scrollState.scrollTop, l = this.layoutManager.getCellAtPosition(r, a, this.scrollState.scrollTop);
      if (!l || l.rowIndex < 0) return;
      const h = this.canvas.getBoundingClientRect(), c = 140, f = 3 * q.DROPDOWN_ITEM_HEIGHT;
      let g = s, m = i;
      g + c > h.width && (g = h.width - c - 8), g < 0 && (g = 8), m + f > h.height && (m = h.height - f - 8), m < 0 && (m = 8), this.state.contextMenu = {
        x: g,
        y: m,
        rowIndex: l.rowIndex,
        hoveredIndex: -1
      }, this.eventEmitter.emit(S.CONTEXT_MENU_OPEN);
    });
    v(this, "handleDocumentMouseMove", (t) => {
      var e;
      if (this.state.isDragging && this.state.dragType === "row-resize" && this.state.rowResizeState) {
        const { min: s, max: i } = this.layoutManager.getRowHeightBounds(), o = t.clientY - this.state.rowResizeState.startY;
        this.state.rowResizeState.displayHeight = Z(
          this.state.rowResizeState.startHeight + o,
          s,
          i
        ), this.eventEmitter.emit(S.ROW_RESIZE_DRAG);
        return;
      }
      if ((e = this.state.filterDropdown) != null && e.isScrollbarDragging) {
        const { options: s, scrollbarDragStartY: i, scrollbarDragStartScrollTop: o } = this.state.filterDropdown;
        if (!s) return;
        const n = q.DROPDOWN_ITEM_HEIGHT, r = q.DROPDOWN_MAX_VISIBLE, l = Math.min(s.length, r) * n, h = s.length * n, c = Math.max(20, l / h * l), d = l - c, f = (t.clientY - (i ?? 0)) / d, g = h - l, m = (o ?? 0) + f * g;
        this.state.filterDropdown.scrollTop = Z(m, 0, g), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
        return;
      }
      if (this.scrollbarState.verticalDragging) {
        const s = this.layoutManager.getLayoutInfo(), i = s.headerHeight, o = this.canvas.height / (window.devicePixelRatio || 1), n = o - i, r = Math.max(30, o / s.totalHeight * n), a = n - r, h = (t.clientY - this.scrollbarState.dragStartY) / a, c = this.scrollbarState.dragStartScrollTop + h * this.scrollState.maxScrollTop;
        this.scrollState.scrollTop = Z(c, 0, this.scrollState.maxScrollTop), this.eventEmitter.emit(
          S.SCROLL,
          this.scrollState.scrollLeft,
          this.scrollState.scrollTop
        );
        return;
      }
      if (this.scrollbarState.horizontalDragging) {
        const s = this.layoutManager.getLayoutInfo(), i = this.canvas.width / (window.devicePixelRatio || 1), o = Math.max(30, i / s.totalWidth * i), n = i - o, a = (t.clientX - this.scrollbarState.dragStartX) / n, l = this.scrollbarState.dragStartScrollLeft + a * this.scrollState.maxScrollLeft;
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
        const { rowIndex: e, displayHeight: s } = this.state.rowResizeState, i = this.rows[e];
        i && this.eventEmitter.emit(S.ROW_HEIGHT_CHANGE, i, s, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if ((t = this.state.filterDropdown) != null && t.isScrollbarDragging) {
        this.state.filterDropdown.isScrollbarDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) && (this.scrollbarState.verticalDragging = !1, this.scrollbarState.horizontalDragging = !1, this.canvas.style.cursor = "default", this.unbindDocumentEvents());
    });
    v(this, "handleMouseMove", (t) => {
      var n, r;
      const e = this.canvas.getBoundingClientRect(), s = t.clientX - e.left, i = t.clientY - e.top;
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
              this.eventEmitter.emit(S.COLUMN_REORDER_DRAG);
              return;
            }
            let x = !1;
            if ((f > d ? "right" : "left") === "right" ? x = l >= g : x = l < g, x) {
              this.eventEmitter.emit(S.COLUMN_SWAP, m.key, p.key), h.lastSwapTime = u, h.lastSwapTargetKey = void 0;
              const C = this.layoutManager.getColumnByKey(h.dragColumnKey);
              if (C) {
                const y = this.headerHandler.calculateSiblingColumns(C), b = y.findIndex(
                  (E) => E.key === h.dragColumnKey
                );
                h.siblingColumns = y, h.dragSiblingIndex = b >= 0 ? b : d;
                const I = y[h.dragSiblingIndex];
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
        const a = this.layoutManager.hitTest(s, i, this.getScrollbarBounds());
        a.region === "cell" && a.cell && a.cell.rowIndex >= 0 && this.selectionHandler.handleRangeSelection(a.cell);
        return;
      }
      const o = this.layoutManager.hitTest(s, i, this.getScrollbarBounds());
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
        o.headerCell && this.headerHandler.handleHeaderHover(o.headerCell, s, i);
        return;
      }
      if (o.region === "cell" && o.cell) {
        if (this.rowHeightResizeEnabled && o.isRowResizeHandle && o.resizeRowIndex !== void 0 && this.isRowResizable(o.resizeRowIndex)) {
          this.canvas.style.cursor = "ns-resize", this.state.tooltip = null;
          return;
        }
        const a = o.cell;
        this.updateButtonHoverState(a, s, i);
        const l = this.layoutManager.getLeafColumns(), h = a.columnIndex >= 0 ? l[a.columnIndex] : void 0, c = a.rowIndex >= 0 ? this.rows[a.rowIndex] : void 0;
        if ((h && c ? et(h.disabled, c, h) : !1) ? this.canvas.style.cursor = "not-allowed" : this.isClickableElement(a, s, i) ? this.canvas.style.cursor = "pointer" : h && h.key.startsWith("__hidden_placeholder__") ? this.canvas.style.cursor = "pointer" : this.canvas.style.cursor = "default", ((n = this.state.hoveredCell) == null ? void 0 : n.rowIndex) !== a.rowIndex || ((r = this.state.hoveredCell) == null ? void 0 : r.columnIndex) !== a.columnIndex) {
          this.state.hoveredCell = a.rowIndex >= 0 ? a : null;
          const u = this.state.hoveredCell ? this.getCellInfo(this.state.hoveredCell) : null;
          this.eventEmitter.emit(S.CELL_HOVER, u, t);
        }
        this.updateImageHoverIndex(a, s, i), this.updateButtonsHoverIndex(a, s, i), this.state.hoveredHeaderColumnKey !== void 0 && (this.state.hoveredHeaderColumnKey = void 0, this.eventEmitter.emit(S.HEADER_HOVER, void 0)), this.checkTooltip(a);
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
        const { rowIndex: e, displayHeight: s } = this.state.rowResizeState, i = this.rows[e];
        i && this.eventEmitter.emit(S.ROW_HEIGHT_CHANGE, i, s, e), this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "progress-drag" && this.state.progressDragState) {
        const { cell: e, column: s, row: i, displayValue: o } = this.state.progressDragState;
        s && i && (i.data[X(s)] = o), this.eventEmitter.emit(S.PROGRESS_CHANGE, this.getCellInfo(e), o), this.state.isDragging = !1, this.state.dragType = null, this.state.progressDragState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents();
        return;
      }
      if (this.state.isDragging && this.state.dragType === "column-reorder" && this.state.columnReorderState) {
        const { dragColumnIndex: e, targetColumnIndex: s } = this.state.columnReorderState;
        e !== s && s >= 0 && this.eventEmitter.emit(S.COLUMN_REORDER, e, s), this.state.isDragging = !1, this.state.dragType = null, this.state.columnReorderState = void 0, this.canvas.style.cursor = "default", this.unbindDocumentEvents(), this.eventEmitter.emit(S.COLUMN_REORDER_DRAG);
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
    v(this, "handleDblClick", (t) => {
      var d;
      const e = this.canvas.getBoundingClientRect(), s = t.clientX - e.left, i = t.clientY - e.top;
      if (this.state.dateDropdown) {
        const { x: u, y: f, width: g } = this.state.dateDropdown, y = 40 + 28 + 6 * 28 + 8 * 2;
        if (s >= u && s <= u + g && i >= f && i <= f + y)
          return;
        this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE);
      }
      if (this.state.dropdown) {
        const { x: u, y: f, width: g, type: m, tagsConfig: p, config: x } = this.state.dropdown, w = q.DROPDOWN_ITEM_HEIGHT, C = q.DROPDOWN_MAX_VISIBLE;
        let y;
        m === "tags" && p ? y = ((d = p.options) == null ? void 0 : d.length) ?? 0 : y = x.options.length;
        const I = Math.min(y, C) * w;
        if (s >= u && s <= u + g && i >= f && i <= f + I)
          return;
        this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE);
      }
      if (this.state.filterDropdown) {
        const { x: u, y: f, width: g, mode: m, options: p } = this.state.filterDropdown, x = 8, w = 36, C = q.DROPDOWN_ITEM_HEIGHT, y = q.DROPDOWN_MAX_VISIBLE;
        let b;
        switch (m) {
          case "search": {
            b = 36 + w + x;
            break;
          }
          case "select": {
            b = 36 + Math.min((p == null ? void 0 : p.length) ?? 0, y) * C + w;
            break;
          }
          case "range": {
            b = x + 32 + 8 + w + x;
            break;
          }
          case "boolean": {
            b = 32 * 3 + w;
            break;
          }
          case "dateRange": {
            b = x + 32 + 8 + w + x;
            break;
          }
          default:
            b = 200;
        }
        if (s >= u && s <= u + g && i >= f && i <= f + b)
          return;
        this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE);
      }
      const o = s + this.scrollState.scrollLeft, n = i + this.scrollState.scrollTop, r = this.layoutManager.getCellAtPosition(o, n, this.scrollState.scrollTop);
      if (!r || r.rowIndex < 0) return;
      const l = this.layoutManager.getLeafColumns()[r.columnIndex], h = this.rows[r.rowIndex], c = ["checkbox", "radio", "button", "buttons", "switch", "rating"];
      if (l && h) {
        const u = nt(l, h, r.rowIndex);
        if (u.type && c.includes(u.type))
          return;
        if (u.type === "progress" && u.progress) {
          if (u.progress.interactive !== !0 || l.editable === !1 || et(l.disabled, h, l)) return;
          this.eventEmitter.emit(S.CELL_DBL_CLICK, this.getCellInfo(r), t), this.eventEmitter.emit(S.ROW_DBL_CLICK, h, r.rowIndex, t), this.editingConfig.enabled !== !1 && this.startEditing(r, {
            value: String(u.progress.value),
            type: "number",
            placeholder: "0-100"
          });
          return;
        }
        if (u.type === "color" && u.color) {
          const f = this.layoutManager.getCellPosition(r.rowIndex, r.columnIndex), g = this.getCellViewportX(f, l), m = f.y - this.scrollState.scrollTop, x = Math.min(f.height - 8 * 2, 24), w = g + (f.width - x) / 2, C = m + (f.height - x) / 2;
          if (!(s >= w && s <= w + x && i >= C && i <= C + x)) return;
        }
        if (l.editable === !1 || et(l.disabled, h, l)) return;
        if (this.eventEmitter.emit(S.CELL_DBL_CLICK, this.getCellInfo(r), t), this.eventEmitter.emit(S.ROW_DBL_CLICK, h, r.rowIndex, t), this.editingConfig.enabled !== !1) {
          const f = this.getEditConfig(l, h, r.rowIndex);
          f ? f.type === "select" && f.select ? this.startSelectEditing(r, f.select) : f.type === "tag" && f.tags ? this.startTagsEditing(r, f.tags) : f.type === "date" && f.date ? this.startDateEditing(r, f.date) : f.type === "color" && f.color ? this.startColorEditing(r, f.color) : f.type === "input" || !f.type ? this.startEditing(r, f.input) : this.startEditing(r, f.input) : u.type === "select" && u.select ? this.startSelectEditing(r, u.select) : u.type === "tag" && u.tags && u.tags.editable ? this.startTagsEditing(r, u.tags) : u.type === "date" && u.date ? this.startDateEditing(r, u.date) : u.type === "color" && u.color ? this.startColorEditing(r, u.color) : u.type === "image" && u.image ? this.startImageEditing(r, u.image) : this.startEditing(r, u.input);
        }
      }
    });
    v(this, "handleControlClick", (t, e) => {
      var a, l;
      const i = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.rows[t.rowIndex];
      if (!i || !o) return !1;
      if (i.key.startsWith("__hidden_placeholder__")) {
        const h = i._hiddenColumnKey;
        if (h)
          return this.eventEmitter.emit(S.COLUMN_SHOW, h), !0;
      }
      if (this.expandColumnKey === i.key && o.children && o.children.length > 0 && this.handleExpandIconClick(t, e, o))
        return !0;
      const n = nt(i, o, t.rowIndex), r = et(i.disabled, o, i);
      if (n.type === "checkbox" && n.checkbox) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, i), g = h.y - this.scrollState.scrollTop, m = 16, p = f + (h.width - m) / 2, x = g + (h.height - m) / 2;
        if (d >= p && d <= p + m && u >= x && u <= x + m && !r) {
          const C = !n.checkbox.checked;
          return o.data[X(i)] = C, this.eventEmitter.emit(S.CHECKBOX_CHANGE, this.getCellInfo(t), C), !0;
        }
        return !1;
      }
      if (n.type === "radio" && n.radio) {
        if (r) return !1;
        if (n.radio.options && n.radio.options.length > 0) {
          const h = this.getClickedRadioOption(t, e, n.radio.options);
          return h && !h.disabled ? (o.data[X(i)] = h.value, this.eventEmitter.emit(
            S.RADIO_CHANGE,
            this.getCellInfo(t),
            h.value
          ), !0) : !1;
        } else
          return o.data[X(i)] = n.radio.value, this.eventEmitter.emit(
            S.RADIO_CHANGE,
            this.getCellInfo(t),
            n.radio.value
          ), !0;
      }
      if (n.type === "button" && n.button) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, i), g = h.y - this.scrollState.scrollTop, m = d - f, p = u - g, x = n.button.size === "small" ? 24 : n.button.size === "large" ? 40 : 32, w = (h.height - x) / 2, C = n.button.text ?? "Button", y = 13;
        this.ctx.font = `${y}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const b = this.ctx.measureText(C).width, R = Math.min(
          Math.max(b + 16 * 2, 60),
          h.width - 8 * 2
        ), T = (h.width - R) / 2;
        return p >= w && p <= w + x && m >= T && m <= T + R ? (this.eventEmitter.emit(
          S.BUTTON_CLICK,
          this.getCellInfo(t),
          n.button.actionKey
        ), !0) : !1;
      }
      if (n.type === "buttons" && n.buttons) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, i), g = h.y - this.scrollState.scrollTop, m = d - f, p = u - g, x = 8, w = n.buttons.gap ?? 4, C = n.buttons.maxVisible ?? 3, y = 24, b = (h.height - y) / 2, I = n.buttons.buttons.filter((D) => D.visible !== !1), E = I.slice(0, C), R = I.slice(C);
        let T = x;
        for (let D = 0; D < E.length; D++) {
          const H = E[D], k = H.text ?? "Button";
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const O = this.ctx.measureText(k).width, A = Math.max(O + 16, 40);
          if (p >= b && p <= b + y && m >= T && m <= T + A)
            return this.eventEmitter.emit(S.BUTTON_CLICK, this.getCellInfo(t), H.actionKey), !0;
          T += A + w;
        }
        if (R.length > 0) {
          const D = n.buttons.moreButtonText ?? "···";
          this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const H = this.ctx.measureText(D).width, k = Math.max(H + 16, 32);
          if (p >= b && p <= b + y && m >= T && m <= T + k) {
            const O = f + T, A = q.DROPDOWN_ITEM_HEIGHT, W = R.length * A, P = this.canvas.getBoundingClientRect();
            let L = g + b + y + 4, _ = !1;
            return L + W > P.height && (L = g + b - W - 4, _ = !0), this.state.buttonsDropdown = {
              cell: t,
              x: O,
              y: L,
              buttons: R,
              hoveredIndex: -1,
              buttonRelativeX: T,
              buttonY: b,
              buttonHeight: y,
              showAbove: _
            }, this.eventEmitter.emit(S.DROPDOWN_OPEN), !0;
          }
        }
        return !1;
      }
      if (n.type === "switch" && n.switch) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, i), g = h.y - this.scrollState.scrollTop, m = d - f, p = u - g, x = 44, w = 22, C = (h.width - x) / 2, y = (h.height - w) / 2;
        if (!(m >= C && m <= C + x && p >= y && p <= y + w)) return !1;
        const I = `${t.rowIndex}-${t.columnIndex}`, E = this.state.switchAnimations.get(I), R = n.switch.checked ?? !1, T = E ? E.progress : R ? 1 : 0, D = T < 0.5 ? 1 : 0, H = D === 1;
        return R !== H && (o.data[X(i)] = H, this.eventEmitter.emit(S.SWITCH_CHANGE, this.getCellInfo(t), H)), this.state.switchAnimations.set(I, {
          cell: t,
          progress: T,
          targetProgress: D,
          startTime: Date.now(),
          startProgress: T
        }), this.startSwitchAnimationLoop(), !0;
      }
      if (n.type === "input" && n.input)
        return r || n.input.readonly, !1;
      if (n.type === "link" && n.link) {
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.canvas.getBoundingClientRect(), d = e.clientX - c.left, u = e.clientY - c.top, f = this.getCellViewportX(h, i), g = h.y - this.scrollState.scrollTop, m = d - f, p = u - g, x = n.link, w = x.link, C = x.text || x.link;
        if (!w || !C) return !1;
        const y = 8, b = 13;
        this.ctx.font = `${b}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const I = h.width - y * 2;
        let E = this.ctx.measureText(C).width, R = C;
        if (E > I) {
          const W = "...";
          for (; R.length > 0 && this.ctx.measureText(R + W).width > I; )
            R = R.slice(0, -1);
          R += W, E = this.ctx.measureText(R).width;
        }
        const T = i.align ?? "left";
        let D;
        switch (T) {
          case "center":
            D = (h.width - E) / 2;
            break;
          case "right":
            D = h.width - y - E;
            break;
          default:
            D = y;
        }
        const H = (h.height - b) / 2;
        if (!(m >= D && m <= D + E && p >= H && p <= H + b)) return !1;
        const O = Date.now(), A = ((a = this._lastClickCell) == null ? void 0 : a.rowIndex) === t.rowIndex && ((l = this._lastClickCell) == null ? void 0 : l.columnIndex) === t.columnIndex && O - this._lastClickTime < 350;
        return this._lastClickTime = O, this._lastClickCell = { rowIndex: t.rowIndex, columnIndex: t.columnIndex }, A ? !1 : (window.open(w, "_blank", "noopener,noreferrer"), !0);
      }
      if (n.type === "progress" && n.progress) {
        const h = this.handleProgressClick(t, e, n.progress, i, o);
        if (h) {
          const c = n.progress.precision ?? 0, d = c === 0 ? Math.round(n.progress.value) : Number(n.progress.value.toFixed(c));
          this.state.isDragging = !0, this.state.dragType = "progress-drag", this.state.progressDragState = {
            cell: t,
            config: n.progress,
            column: i,
            row: o,
            startX: e.clientX,
            startValue: n.progress.value,
            displayValue: d
          }, this.canvas.style.cursor = "grabbing", this.bindDocumentEvents();
        }
        return h;
      }
      if (n.type === "rating" && n.rating)
        return this.handleRatingClick(t, e, n.rating, i, o);
      if (n.type === "color" && n.color) {
        if (r) return !1;
        const h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, i), d = h.y - this.scrollState.scrollTop, u = this.canvas.getBoundingClientRect(), f = e.clientX - u.left, g = e.clientY - u.top, p = Math.min(h.height - 8 * 2, 24), x = c + (h.width - p) / 2, w = d + (h.height - p) / 2;
        return f >= x && f <= x + p && g >= w && g <= w + p ? (this.startColorEditing(t, n.color), !0) : !1;
      }
      if (n.type === "image" && n.image) {
        if (n.image.clickable === !1) return !1;
        const h = n.image, c = h.images, d = this.canvas.getBoundingClientRect(), u = e.clientX - d.left, f = e.clientY - d.top, g = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), m = this.getCellViewportX(g, i), p = g.y - this.scrollState.scrollTop, x = u - m, w = f - p, C = 4, y = Math.min(g.width, g.height) - C * 2, b = h.width ?? 32, I = h.height ?? 32, E = Math.min(b, y), R = Math.min(I, y), T = h.gap ?? 4;
        if (c && c.length > 1) {
          const A = h.maxVisible ?? 3, W = h.showMoreCount !== !1, P = g.width - C * 2, L = Math.floor((P + T) / (E + T)), F = Math.max(1, L - (W ? 1 : 0)), Y = Math.min(A, F), B = c.length > Y ? Y : c.length, z = c.length > Y;
          let U;
          z && W ? U = B * E + B * T + E : U = B * E + Math.max(0, B - 1) * T;
          let G = (g.width - U) / 2;
          G = Math.max(C, G);
          const $ = (g.height - R) / 2, Q = x - G, tt = w - $;
          if (Q < 0 || Q > U || tt < 0 || tt > R)
            return !1;
          const V = Math.floor(Q / (E + T));
          if (z && W && V === B)
            return !1;
          if (V >= 0 && V < c.length) {
            const K = c[V];
            if (K)
              return this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(t), K, e), !0;
          }
          return !1;
        }
        const D = (g.width - E) / 2, H = (g.height - R) / 2;
        if (!(x >= D && x <= D + E && w >= H && w <= H + R)) return !1;
        const O = h.src || c && c[0];
        return O ? (this.eventEmitter.emit(S.IMAGE_CLICK, this.getCellInfo(t), O, e), !0) : !1;
      }
      return !1;
    });
    v(this, "handleProgressClick", (t, e, s, i, o) => this.controlClickHandler.handleProgressClick(t, e, s, i, o));
    v(this, "handleProgressDragMove", (t) => {
      const e = this.state.progressDragState;
      if (!e) return;
      const { cell: s, config: i, column: o } = e, n = this.canvas.getBoundingClientRect(), r = t.clientX - n.left, a = this.layoutManager.getCellPosition(s.rowIndex, s.columnIndex), l = this.getCellViewportX(a, o), h = i.shape ?? "line";
      if (h === "line") {
        const d = i.textPosition ?? "right", f = (i.showText ?? !0) && d === "right" ? 40 : 0, g = i.width ?? a.width - 8 * 2 - f, m = l + 8, p = r - m, x = i.precision ?? 0, w = Math.max(0, Math.min(100, p / g * 100)), C = x === 0 ? Math.round(w) : Number(w.toFixed(x));
        e.displayValue = C, this.eventEmitter.emit(S.PROGRESS_DRAG);
      } else if (h === "circle" || h === "dashboard") {
        const c = t.clientY - n.top, d = a.y - this.scrollState.scrollTop;
        let u = 0;
        h === "dashboard" && (u = a.height * 0.05);
        const f = l + a.width / 2, g = d + a.height / 2 + u, m = r - f, p = c - g;
        let x = Math.atan2(p, m), w;
        if (h === "circle")
          x = x + Math.PI / 2, x < 0 && (x += Math.PI * 2), w = x / (Math.PI * 2) * 100;
        else {
          const y = Math.PI * 0.75, b = Math.PI * 1.5;
          x < 0 && (x += Math.PI * 2);
          let I = x - y;
          I < 0 && (I += Math.PI * 2), w = I / b * 100;
        }
        w = Math.max(0, Math.min(100, w));
        const C = i.precision ?? 0;
        w = C === 0 ? Math.round(w) : Number(w.toFixed(C)), e.displayValue = w, this.eventEmitter.emit(S.PROGRESS_DRAG);
      }
    });
    v(this, "handleRatingClick", (t, e, s, i, o) => this.controlClickHandler.handleRatingClick(t, e, s, i, o));
    v(this, "handleExpandIconClick", (t, e, s) => this.controlClickHandler.handleExpandIconClick(t, e, s));
    v(this, "getClickedRadioOption", (t, e, s) => this.controlClickHandler.getClickedRadioOption(t, e, s));
    v(this, "handleWheel", (t) => {
      var r;
      const e = t.target;
      if (e.tagName === "TEXTAREA" || e.tagName === "INPUT") {
        const a = e, l = a.scrollHeight > a.clientHeight, h = a.scrollWidth > a.clientWidth;
        if (l || h)
          return;
      }
      if (this.state.imageTooltip) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g } = this.state.imageTooltip, m = q.IMAGE_SIZE, p = 8, x = 8, w = 4, b = w * m + (w - 1) * x + p * 2 + 4 + 4, I = m + x, E = f * I + p * 2 - x;
        if (l >= c && l <= c + b && h >= d && h <= d + E) {
          const T = Math.ceil(u.length / w), D = Math.max(0, (T - f) * I), H = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (D > 0 && H) {
            const O = g <= 0.5 && t.deltaY < 0, A = g >= D - 0.5 && t.deltaY > 0;
            if (!O && !A) {
              this.state.imageTooltip.scrollTop = Z(g + t.deltaY, 0, D), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.IMAGE_TOOLTIP_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageTooltipPosition();
      }
      if (this.state.imageEditor) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, images: u, maxRows: f, scrollTop: g, pendingImages: m } = this.state.imageEditor, p = q.IMAGE_SIZE, x = 8, w = 8, C = 4, y = 60, b = p + w, I = C * p + (C - 1) * w + x * 2 + 4 + 4, E = f * b + x * 2 - w, R = y + E;
        if (l >= c && l <= c + I && h >= d && h <= d + R) {
          const D = u.length + m.length, H = Math.ceil(D / C), k = Math.max(0, (H - f) * b), O = Math.abs(t.deltaY) >= Math.abs(t.deltaX);
          if (k > 0 && O) {
            const W = g <= 0.5 && t.deltaY < 0, P = g >= k - 0.5 && t.deltaY > 0;
            if (!W && !P) {
              this.state.imageEditor.scrollTop = Z(g + t.deltaY, 0, k), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.IMAGE_EDITOR_SCROLL);
              return;
            }
          }
        }
        this.imageHandler.updateImageEditorPosition();
      }
      if (this.state.filterDropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, mode: f, options: g, scrollTop: m } = this.state.filterDropdown;
        if (f === "select" && g) {
          const x = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE, C = Math.min(g.length, w), y = 32, b = 4, I = C * x, E = 8 + y + b + I + b + 36;
          if (l >= c && l <= c + u && h >= d && h <= d + E) {
            const T = Math.abs(t.deltaY) >= Math.abs(t.deltaX), D = Math.max(0, g.length * x - I);
            if (D > 0 && T) {
              const k = m <= 0.5 && t.deltaY < 0, O = m >= D - 0.5 && t.deltaY > 0;
              if (!k && !O) {
                this.state.filterDropdown.scrollTop = Z(m + t.deltaY, 0, D), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
                return;
              }
            }
          }
        }
        this.dropdownHandler.updateFilterDropdownPosition();
      }
      if (this.state.dropdown) {
        const a = this.canvas.getBoundingClientRect(), l = t.clientX - a.left, h = t.clientY - a.top, { x: c, y: d, width: u, type: f, tagsConfig: g, config: m, scrollTop: p } = this.state.dropdown, x = q.DROPDOWN_ITEM_HEIGHT, w = q.DROPDOWN_MAX_VISIBLE;
        let C;
        f === "tags" && g ? C = ((r = g.options) == null ? void 0 : r.length) ?? 0 : C = m.options.length;
        const b = Math.min(C, w) * x;
        if (l >= c && l <= c + u && h >= d && h <= d + b) {
          const E = Math.abs(t.deltaY) >= Math.abs(t.deltaX), R = Math.max(0, C * x - b);
          if (R > 0 && E) {
            const D = p ?? 0, H = D <= 0.5 && t.deltaY < 0, k = D >= R - 0.5 && t.deltaY > 0;
            if (!H && !k) {
              this.state.dropdown.scrollTop = Z(D + t.deltaY, 0, R), t.preventDefault(), t.stopPropagation(), this.eventEmitter.emit(S.DROPDOWN_HOVER);
              return;
            }
          }
        }
        this.dropdownHandler.updateDropdownPosition();
      }
      this.updateAllDropdownPositions(), t.preventDefault();
      const s = t.deltaX, i = t.deltaY, o = Z(
        this.scrollState.scrollLeft + s,
        0,
        this.scrollState.maxScrollLeft
      ), n = Z(
        this.scrollState.scrollTop + i,
        0,
        this.scrollState.maxScrollTop
      );
      (o !== this.scrollState.scrollLeft || n !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = o, this.scrollState.scrollTop = n, this.scrollState.isScrolling = !0, this.eventEmitter.emit(S.SCROLL, o, n), this.checkLazyLoad(n, i), clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = !1;
      }, 150));
    });
    v(this, "updateTooltipPosition", () => {
      this.tooltipHandler.updateTooltipPosition();
    });
    v(this, "scrollTimeout", setTimeout(() => {
    }, 0));
    v(this, "handleKeyDown", (t) => {
      if (this.state.editingCell) {
        this.handleEditingKeyDown(t);
        return;
      }
      if (this.state.dropdown) {
        t.key === "Escape" && (this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE));
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
    v(this, "startSwitchAnimationLoop", () => {
      this.buttonAnimationHandler.startSwitchAnimationLoop();
    });
    v(this, "getSwitchAnimations", () => this.buttonAnimationHandler.getSwitchAnimations());
    this.canvas = t, this.ctx = t.getContext("2d"), this.layoutManager = e, this.dataManager = s, this.eventEmitter = i, this.editingConfig = n, this.state = {
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
    this.editingHandler = new Et(t, this.eventEmitter, this.editingConfig), this.dropdownHandler = new St(t, this.eventEmitter), this.selectionHandler = new ze(t, this.eventEmitter), this.navigationHandler = new Ne(
      t,
      this.eventEmitter,
      this.selectionHandler,
      this.editingConfig
    ), this.contextMenuHandler = new Mt(t, this.eventEmitter), this.imageHandler = new Rt(t, this.eventEmitter), this.headerHandler = new Xe(
      t,
      this.eventEmitter,
      this.sortConfig,
      this.filterConfig
    ), this.controlClickHandler = new Ve(t, this.eventEmitter), this.buttonAnimationHandler = new Ye(t, this.eventEmitter), this.tooltipHandler = new Ge(t, this.eventEmitter);
  }
  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  getCellInfo(t) {
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], i = this.rows[t.rowIndex];
    return !s || !i ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: i,
      column: s
    };
  }
  /**
   * 计算单元格在视口中的 X 坐标
   */
  getCellViewportX(t, e) {
    return e != null && e.fixed ? t.x : t.x - this.scrollState.scrollLeft;
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
    const s = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!s) return;
    const o = (e.render ? e.render(
      s.data[X(e)],
      s,
      e,
      this.state.imageEditor.cell.rowIndex
    ) : { image: s.data[X(e)] }).image ?? {}, n = document.createElement("input");
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
  updateButtonHoverState(t, e, s) {
    const i = t && t.rowIndex >= 0 ? `${t.rowIndex}-${t.columnIndex}` : null;
    if (this.state.buttonHoverStates.forEach((R, T) => {
      T !== i && R.progress > 0 && this.state.buttonHoverStates.set(T, {
        ...R,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: R.progress
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
    const l = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), h = this.getCellViewportX(l, n), c = l.y - this.scrollState.scrollTop, d = e - h, u = s - c, f = a.button.size === "small" ? 24 : a.button.size === "large" ? 40 : 32, g = (l.height - f) / 2, m = a.button.text ?? "Button", p = 13;
    this.ctx.font = `${p}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const x = this.ctx.measureText(m).width, y = Math.min(
      Math.max(x + 16 * 2, 60),
      l.width - 8 * 2
    ), b = (l.width - y) / 2, I = u >= g && u <= g + f && d >= b && d <= b + y, E = `${t.rowIndex}-${t.columnIndex}`;
    if (I) {
      const R = this.state.buttonHoverStates.get(E);
      if (!R || R.targetProgress !== 1) {
        const T = R ? R.progress : 0;
        this.state.buttonHoverStates.set(E, {
          cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
          progress: T,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: T
        }), this.startButtonHoverAnimationLoop();
      }
    } else {
      const R = this.state.buttonHoverStates.get(E);
      R && R.progress > 0 && (this.state.buttonHoverStates.set(E, {
        cell: { rowIndex: t.rowIndex, columnIndex: t.columnIndex },
        progress: R.progress,
        targetProgress: 0,
        startTime: Date.now(),
        startProgress: R.progress
      }), this.startButtonHoverAnimationLoop());
    }
  }
  clearAllButtonHoverStates() {
    let t = !1;
    this.state.buttonHoverStates.forEach((e, s) => {
      (e.progress > 0 || e.targetProgress !== 0) && (this.state.buttonHoverStates.set(s, {
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
  updateImageHoverIndex(t, e, s) {
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
    const a = r.image, l = a.images, h = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), c = this.getCellViewportX(h, o), d = h.y - this.scrollState.scrollTop, u = e - c, f = s - d, g = 4, m = Math.min(h.width, h.height) - g * 2, p = a.width ?? 32, x = a.height ?? 32, w = Math.min(p, m), C = Math.min(x, m), y = a.gap ?? 4;
    if (!l || l.length <= 1) {
      const L = (h.width - w) / 2, _ = (h.height - C) / 2, F = u >= L && u <= L + w && f >= _ && f <= _ + C;
      this.state.hoveredImageIndex = F && a.hoverable !== !1 ? 0 : -1;
      return;
    }
    const b = h.width - g * 2, I = a.showMoreCount !== !1, E = a.maxVisible;
    let R;
    if (l.length === 1)
      R = 1;
    else {
      const L = Math.floor((b + y) / (w + y));
      R = Math.max(1, L - (I ? 1 : 0));
    }
    const T = E !== void 0 ? Math.min(E, R) : R, D = l.length > T, H = D ? T : l.length;
    let k;
    D && I ? k = H * w + H * y + w : k = H * w + Math.max(0, H - 1) * y;
    let O = c + (h.width - k) / 2;
    O = Math.max(c + g, O);
    const A = d + (h.height - C) / 2, W = e - O, P = s - A;
    if (P < 0 || P > C) {
      this.state.hoveredImageIndex = -1;
      return;
    }
    for (let L = 0; L < H; L++) {
      const _ = L * (w + y), F = _ + w;
      if (W >= _ && W < F) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? L : -1;
        return;
      }
    }
    if (D && I) {
      const L = H * (w + y), _ = L + w;
      if (W >= L && W < _) {
        this.state.hoveredImageIndex = a.hoverable !== !1 ? H : -1;
        return;
      }
    }
    this.state.hoveredImageIndex = -1;
  }
  updateButtonsHoverIndex(t, e, s) {
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
    const a = r.buttons, l = a.buttons.filter((I) => I.visible !== !1), h = a.maxVisible ?? 3, c = a.gap ?? 4, d = 8, u = 24, f = l.slice(0, h), g = l.slice(h), m = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), p = this.getCellViewportX(m, o), w = m.y - this.scrollState.scrollTop + (m.height - u) / 2, C = s - w;
    if (C < 0 || C > u) {
      this.state.hoveredButtonIndex = -1;
      return;
    }
    let y = p + d;
    const b = 13;
    this.ctx.font = `${b}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    for (let I = 0; I < f.length; I++) {
      const R = f[I].text ?? "Button", T = this.ctx.measureText(R).width, D = Math.max(T + 16, 40);
      if (e >= y && e < y + D) {
        this.state.hoveredButtonIndex = I;
        return;
      }
      y += D + c;
    }
    if (g.length > 0) {
      const I = a.moreButtonText ?? "···", E = this.ctx.measureText(I).width, R = Math.max(E + 16, 32);
      if (e >= y && e < y + R) {
        this.state.hoveredButtonIndex = h;
        return;
      }
    }
    this.state.hoveredButtonIndex = -1;
  }
  isClickableElement(t, e, s) {
    if (!t) return !1;
    if (t.rowIndex === -1)
      return !0;
    const o = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.rows[t.rowIndex];
    if (!o || !n) return !1;
    const r = nt(o, n, t.rowIndex), a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex), l = et(o.disabled, n, o), h = this.getCellViewportX(a, o), c = a.y - this.scrollState.scrollTop, d = e - h, u = s - c;
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
          const C = r.radio.options[w];
          if (C.disabled) {
            const k = this.ctx.measureText(C.label).width;
            x += f + 4 + k + 8;
            continue;
          }
          const y = this.ctx.measureText(C.label).width, b = f + 4 + y + 8;
          if (x + b - 8 > p)
            break;
          const I = x, E = (a.height - f) / 2, R = E + f / 2, T = d >= I && d <= I + f && u >= E && u <= E + f, D = I + f + 4, H = d >= D && d <= D + y && u >= R - 10 && u <= R + 10;
          if (T || H)
            return !0;
          x += b;
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
      const g = r.buttons.gap ?? 4, m = r.buttons.maxVisible ?? 3, p = 24, x = (a.height - p) / 2, w = r.buttons.buttons.filter((b) => b.visible !== !1), C = w.slice(0, m);
      let y = 8;
      for (const b of C) {
        const I = b.text ?? "Button";
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const E = this.ctx.measureText(I).width, R = Math.max(E + 16, 40);
        if (u >= x && u <= x + p && d >= y && d <= y + R)
          return !0;
        y += R + g;
      }
      if (w.length > m) {
        const b = r.buttons.moreButtonText ?? "···";
        this.ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const I = this.ctx.measureText(b).width, E = Math.max(I + 16, 32);
        if (u >= x && u <= x + p && d >= y && d <= y + E)
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
      let w = this.ctx.measureText(g).width, C = g;
      if (w > x) {
        const E = "...";
        for (; C.length > 0 && this.ctx.measureText(C + E).width > x; )
          C = C.slice(0, -1);
        C += E, w = this.ctx.measureText(C).width;
      }
      const y = o.align ?? "left";
      let b;
      switch (y) {
        case "center":
          b = (a.width - w) / 2;
          break;
        case "right":
          b = a.width - m - w;
          break;
        default:
          b = m;
      }
      const I = (a.height - p) / 2;
      return d >= b && d <= b + w && u >= I && u <= I + p;
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
        const p = f.size ?? "medium", x = f.height ?? (p === "small" ? 6 : p === "large" ? 16 : 10), w = f.textPosition ?? "right", y = (f.showText ?? !0) && w === "right" ? 40 : 0, b = f.width ?? a.width - 8 * 2 - y, I = 8, E = (a.height - x) / 2;
        return d >= I && d <= I + b && u >= E && u <= E + x;
      }
      if (g === "circle" || g === "dashboard") {
        const m = f.size ?? "medium";
        let p, x = 0;
        g === "circle" ? p = m === "small" ? 0.6 : m === "large" ? 0.9 : 0.75 : (p = m === "small" ? 0.7 : m === "large" ? 0.95 : 0.85, x = a.height * 0.05);
        const w = Math.floor(a.height * p), C = f.width ?? w, y = f.strokeWidth ?? Math.max(2, Math.round(C * 0.12)), b = a.width / 2, I = a.height / 2 + x, E = (C - y) / 2, R = d - b, T = u - I, D = Math.sqrt(R * R + T * T);
        return D >= E - y && D <= E + y;
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
    const s = this.rows;
    if (s.length === 0) return;
    const i = this.layoutManager.getLayoutInfo(), o = i.viewportHeight, n = i.headerHeight, r = i.totalHeight - n, a = t + o - n, l = r - a, h = this.layoutManager.getRowHeightByIndex(s.length - 1);
    Math.ceil(l / h) <= this.lazyLoadThreshold && (this.isLoadingMore = !0, this.eventEmitter.emit(S.LOAD_MORE, {
      startIndex: s.length,
      scrollTop: t,
      direction: "down"
    }));
  }
  handleExternalWheel(t, e) {
    this.state.dropdown && this.dropdownHandler.updateDropdownPosition(), this.state.tooltip && this.updateTooltipPosition();
    const s = Z(
      this.scrollState.scrollLeft + t,
      0,
      this.scrollState.maxScrollLeft
    ), i = Z(
      this.scrollState.scrollTop + e,
      0,
      this.scrollState.maxScrollTop
    );
    (s !== this.scrollState.scrollLeft || i !== this.scrollState.scrollTop) && (this.scrollState.scrollLeft = s, this.scrollState.scrollTop = i, this.scrollState.isScrolling = !0, this.eventEmitter.emit(S.SCROLL, s, i), clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
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
    var s;
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
            et(o.disabled, n, o) || (n.data[X(o)] = !r.switch.checked, this.eventEmitter.emit(
              S.SWITCH_CHANGE,
              this.getCellInfo(e),
              !r.switch.checked
            ));
            return;
          }
          this.toggleRowExpand(e.rowIndex);
          return;
        }
        if (o.editable === !1 || et(o.disabled, n, o) || (s = r.input) != null && s.readonly) return;
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
  getEditConfig(t, e, s) {
    const i = e.data[X(t)];
    if (t.editRender)
      try {
        const o = t.editRender(i, e, s);
        if (o) return o;
      } catch (o) {
        console.error("Error in editRender:", o);
      }
    if (t.render)
      try {
        const o = t.render(i, e, t, s);
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
    !e || !e.children || (e.expanded = !e.expanded, this.eventEmitter.emit(S.EXPAND, e, t, e.expanded));
  }
  clearSelection() {
    this.selectionHandler.clearSelection();
  }
  resetState() {
    this.state.selectedCells = [], this.state.editingCell = null, this.state.editingValue = null, this.state.hoveredCell = null, this.state.isSelecting = !1, this.state.selectionStart = null, this.state.isDragging = !1, this.state.dragType = null, this.state.rowResizeState = void 0, this.state.dragTarget = null, this.state.tooltip = null, this.closeAllDropdowns(), this.sortConfig = [], this.filterConfig = [], this.state.switchAnimations.clear(), this.state.buttonHoverStates.clear(), this.eventEmitter.emit(S.SELECTION_CHANGE, []);
  }
  // ==================== Dropdown 公共方法 ====================
  /** 关闭 select/tags dropdown */
  closeDropdown() {
    this.state.dropdown && (this.state.dropdown = null, this.eventEmitter.emit(S.DROPDOWN_CLOSE));
  }
  /** 关闭 filter dropdown */
  closeFilterDropdown() {
    this.state.filterDropdown && (this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE));
  }
  /** 关闭 date dropdown */
  closeDateDropdown() {
    this.state.dateDropdown && (this.state.dateDropdown = null, this.eventEmitter.emit(S.DATE_DROPDOWN_CLOSE));
  }
  /** 关闭 color dropdown */
  closeColorDropdown() {
    this.state.colorDropdown && (this.state.colorDropdown = null, this.eventEmitter.emit(S.COLOR_DROPDOWN_CLOSE));
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
    for (const s of this.state.selectedCells) {
      const { minRow: i, maxRow: o, minCol: n, maxCol: r } = this.getNormalizedRange(s);
      for (let a = i; a <= o; a++) {
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
          const u = Xt(c, d, a);
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
    const { columnKey: t, mode: e } = this.state.filterDropdown, s = this.filterConfig.findIndex((r) => r.column === t);
    s >= 0 && this.filterConfig.splice(s, 1);
    let i = null, o = !1;
    switch (e) {
      case "search": {
        const r = (n = this.state.filterDropdown.searchValue) == null ? void 0 : n.trim();
        r && (i = r, o = !0);
        break;
      }
      case "select": {
        const r = this.state.filterDropdown.options;
        if (r) {
          const a = r.filter((l) => l.checked);
          a.length > 0 && a.length < r.length && (i = a.map((l) => l.value), o = !0);
        }
        break;
      }
      case "range": {
        const r = this.state.filterDropdown.minValue, a = this.state.filterDropdown.maxValue;
        (r !== "" || a !== "") && (i = {
          min: r !== "" ? Number(r) : void 0,
          max: a !== "" ? Number(a) : void 0
        }, o = !0);
        break;
      }
      case "dateRange": {
        const r = this.state.filterDropdown.startDate, a = this.state.filterDropdown.endDate;
        (r || a) && (i = {
          start: r,
          end: a
        }, o = !0);
        break;
      }
      case "boolean": {
        const r = this.state.filterDropdown.boolValue;
        r !== "all" && (i = r, o = !0);
        break;
      }
    }
    o && this.filterConfig.push({
      column: t,
      operator: this.getOperatorByMode(e),
      value: i
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
    const { columnKey: t } = this.state.filterDropdown, e = this.filterConfig.findIndex((s) => s.column === t);
    e >= 0 && this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.eventEmitter.emit(S.FILTER_CHANGE, [...this.filterConfig]), this.state.filterDropdown = null, this.eventEmitter.emit(S.FILTER_DROPDOWN_CLOSE);
  }
  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue() {
    if (!this.state.filterDropdown) return;
    const { columnKey: t } = this.state.filterDropdown, e = this.filterConfig.findIndex((s) => s.column === t);
    e >= 0 && (this.filterConfig.splice(e, 1), this.headerHandler.updateFilterConfig(this.filterConfig), this.dataManager.filter(this.filterConfig), this.eventEmitter.emit(S.FILTER_CHANGE, [...this.filterConfig])), this.eventEmitter.emit(S.FILTER_DROPDOWN_OPEN);
  }
  /**
   * 处理筛选下拉框的搜索输入
   * 用于延迟加载模式下的选项搜索
   */
  handleFilterDropdownSearch(t) {
    if (!this.state.filterDropdown) return;
    const { mode: e, columnKey: s } = this.state.filterDropdown;
    if (e === "select") {
      this.state.filterDropdown.searchText = t;
      const o = this.layoutManager.getLeafColumns().find((r) => r.key === s);
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
        const r = Vt(o, n, 0);
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
      const { minRow: s, maxRow: i, minCol: o, maxCol: n } = this.getNormalizedRange(e);
      for (let r = s; r <= i; r++)
        for (let a = o; a <= n; a++)
          t.push({ rowIndex: r, columnIndex: a });
    }
    return t;
  }
  getSelectedRows() {
    const t = /* @__PURE__ */ new Set();
    for (const e of this.state.selectedCells) {
      const { minRow: s, maxRow: i } = this.getNormalizedRange(e);
      for (let o = s; o <= i; o++)
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
  setRowResizable(t) {
    this.rowResizable = t ?? !0;
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
v(q, "DROPDOWN_ITEM_HEIGHT", 32), v(q, "DROPDOWN_MAX_VISIBLE", 8), // 图片编辑器常量 (用于 ImageHandler 和其他图片相关操作)
v(q, "IMAGE_SIZE", 64), v(q, "IMAGE_PADDING", 8), v(q, "IMAGE_GAP", 8), v(q, "IMAGES_PER_ROW", 4), v(q, "IMAGE_UPLOAD_AREA_HEIGHT", 60), v(q, "IMAGE_MAX_ROWS", 3);
let Tt = q;
class $e {
  constructor(t, e, s, i, o, n) {
    v(this, "wrapper");
    v(this, "layoutManager");
    v(this, "eventEmitter");
    v(this, "theme");
    v(this, "getRows");
    v(this, "inputElement", null);
    v(this, "editingCell", null);
    v(this, "scrollLeft", 0);
    v(this, "scrollTop", 0);
    v(this, "onScrollCallback", null);
    v(this, "wheelHandler", null);
    v(this, "placeholderStyle", null);
    v(this, "scrollbarStyle", null);
    v(this, "handleBlur", () => {
      this.endEditing(!0);
    });
    v(this, "handleKeyDown", (t) => {
      var i;
      const e = t, s = ((i = this.inputElement) == null ? void 0 : i.tagName) === "TEXTAREA";
      e.key === "Enter" && !s ? (e.preventDefault(), this.endEditing(!0)) : e.key === "Enter" && s && (e.ctrlKey || e.metaKey) ? (e.preventDefault(), this.endEditing(!0)) : e.key === "Escape" ? (e.preventDefault(), this.endEditing(!1)) : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && t.stopPropagation();
    });
    v(this, "handleInputWheel", (t) => {
      const e = t;
      e.preventDefault(), this.onScrollCallback && this.onScrollCallback(e.deltaX, e.deltaY);
    });
    this.wrapper = t, this.layoutManager = s, this.eventEmitter = i, this.theme = o, this.getRows = n;
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
    const s = this.layoutManager.getLeafColumns()[t.columnIndex], o = this.getRows()[t.rowIndex];
    return !s || !o ? null : {
      rowIndex: t.rowIndex,
      columnIndex: t.columnIndex,
      row: o,
      column: s
    };
  }
  startEditing(t, e) {
    this.inputElement && this.endEditing(!0);
    const i = this.layoutManager.getLeafColumns()[t.columnIndex], n = this.getRows()[t.rowIndex];
    if (!i || !n) return;
    this.editingCell = t;
    const r = this.layoutManager.getCellMerge(t.rowIndex, t.columnIndex);
    let a;
    r ? a = this.layoutManager.getMergedCellPosition(r.rowIndex, r.columnIndex) : a = this.layoutManager.getCellPosition(t.rowIndex, t.columnIndex);
    let l;
    i.fixed === "left" || i.fixed === "right" ? l = a.x : l = a.x - this.scrollLeft;
    const h = a.y - this.scrollTop, c = l - 1, d = h - 1, u = a.width + 2, f = 14 * 1.5, g = 8;
    if ((e == null ? void 0 : e.multiline) ?? !1) {
      const p = Math.max(1, Math.floor((a.height - g * 2) / f)), x = Math.min((e == null ? void 0 : e.maxRows) ?? p, p), w = f * x + g * 2, C = Math.min(a.height + 2, w + 2);
      this.inputElement = document.createElement("textarea");
      const y = String(n.data[X(i)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : y, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = et(i.disabled, n, i), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${c}px;
        top: ${d}px;
        width: ${u}px;
        height: ${C}px;
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
        max-height: ${w}px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      const b = document.createElement("style");
      b.textContent = `
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
      `, document.head.appendChild(b), this.inputElement.className = "canvas-table-editor-textarea", this.scrollbarStyle = b;
      const I = document.createElement("style");
      I.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `, document.head.appendChild(I), this.placeholderStyle = I, this.wrapper.appendChild(this.inputElement);
      const E = () => {
        if (!this.inputElement) return;
        const R = this.inputElement, T = R.scrollTop;
        R.style.height = "auto";
        const D = R.scrollHeight, k = Math.max(C, Math.min(D, w));
        R.style.height = `${k}px`, R.scrollTop = T;
      };
      this.inputElement.addEventListener("input", E), requestAnimationFrame(() => {
        E();
      }), this.wheelHandler = (R) => {
        if (this.inputElement && R.target === this.inputElement) {
          const T = this.inputElement, D = T.scrollTop === 0, H = T.scrollTop + T.clientHeight >= T.scrollHeight - 1, k = R.deltaY < 0, O = R.deltaY > 0;
          (D && k || H && O) && R.preventDefault(), R.stopPropagation();
        }
      }, document.addEventListener("wheel", this.wheelHandler, { capture: !0, passive: !1 }), E();
    } else {
      const p = a.height + 2;
      this.inputElement = document.createElement("input"), this.inputElement.type = (e == null ? void 0 : e.type) ?? "text";
      const x = String(n.data[X(i)] ?? "");
      this.inputElement.value = (e == null ? void 0 : e.value) !== void 0 ? e.value : x, this.inputElement.placeholder = (e == null ? void 0 : e.placeholder) ?? "", this.inputElement.disabled = et(i.disabled, n, i), this.inputElement.readOnly = (e == null ? void 0 : e.readonly) ?? !1, this.inputElement.style.cssText = `
        position: absolute;
        left: ${c}px;
        top: ${d}px;
        width: ${u}px;
        height: ${p}px;
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
      const w = document.createElement("style");
      w.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `, document.head.appendChild(w), this.placeholderStyle = w, this.wrapper.appendChild(this.inputElement);
    }
    this.inputElement.addEventListener("blur", this.handleBlur), this.inputElement.addEventListener("keydown", this.handleKeyDown), this.inputElement.addEventListener("wheel", this.handleInputWheel, { passive: !1 }), requestAnimationFrame(() => {
      this.inputElement && (this.inputElement.focus(), this.inputElement.select());
    });
  }
  endEditing(t) {
    const e = this.editingCell;
    let s = null;
    this.inputElement && (s = this.inputElement.value, this.destroyInputElement()), t && e && this.eventEmitter.emit("editEnd", this.getCellInfo(e), s), this.editingCell = null;
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
      const s = this.layoutManager.getCellPosition(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex
      );
      let i;
      e.fixed === "left" || e.fixed === "right" ? i = s.x : i = s.x - this.scrollLeft;
      const o = s.y - this.scrollTop;
      this.inputElement.style.left = `${i - 1}px`, this.inputElement.style.top = `${o - 1}px`;
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
  constructor(t, e, s) {
    v(this, "wrapper");
    v(this, "eventEmitter");
    v(this, "theme");
    // 输入元素
    v(this, "searchInput", null);
    v(this, "minInput", null);
    v(this, "maxInput", null);
    v(this, "currentMode", null);
    v(this, "currentColumnKey", null);
    v(this, "onInputChange", null);
    // 标记是否正在从外部更新，避免触发 input 事件导致循环
    v(this, "isUpdatingFromExternal", !1);
    this.wrapper = t, this.eventEmitter = e, this.theme = s;
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
    const { mode: e, columnKey: s } = t;
    if (this.currentMode !== e || this.currentColumnKey !== s)
      switch (this.removeInputs(), this.currentMode = e, this.currentColumnKey = s, e) {
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
    const { x: e, y: s, width: i } = t, o = 8;
    switch (this.isUpdatingFromExternal = !0, t.mode) {
      case "search": {
        const n = e + o, r = s + o, a = i - o * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${r}px`, this.searchInput.style.width = `${a}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchValue ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "select": {
        const n = e + o, r = s + o, a = i - o * 2;
        if (this.searchInput && (this.searchInput.style.left = `${n}px`, this.searchInput.style.top = `${r}px`, this.searchInput.style.width = `${a}px`, document.activeElement !== this.searchInput)) {
          const l = t.searchText ?? "";
          this.searchInput.value !== l && (this.searchInput.value = l);
        }
        break;
      }
      case "range": {
        const r = (i - o * 3) / 2, a = s + o;
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
    const { x: e, y: s, width: i } = t, o = 8, n = 36, r = e + o, a = s + o, l = i - o * 2;
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
    const { x: e, y: s, width: i } = t, o = 8, n = 36 - o, r = e + o, a = s + o, l = i - o * 2;
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
    const { x: e, y: s, width: i, minValue: o, maxValue: n } = t, r = 8, a = 32, l = 8, h = (i - r * 3) / 2, c = s + r;
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
    v(this, "listeners", /* @__PURE__ */ new Map());
  }
  on(t, e) {
    const s = t;
    this.listeners.has(s) || this.listeners.set(s, /* @__PURE__ */ new Set()), this.listeners.get(s).add(e);
  }
  off(t, e) {
    const s = this.listeners.get(t);
    s && s.delete(e);
  }
  emit(t, ...e) {
    const s = this.listeners.get(t);
    s && s.forEach((i) => {
      try {
        i(...e);
      } catch (o) {
        console.error(`Error in event handler for "${String(t)}":`, o);
      }
    });
  }
  once(t, e) {
    const s = (...i) => {
      this.off(t, s), e(...i);
    };
    this.on(t, s);
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
}, Nt = {
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
function ls(M) {
  var t, e, s, i, o, n, r, a, l, h, c, d, u, f, g, m;
  return M ? {
    ...j,
    ...M,
    colors: {
      ...j.colors,
      ...M.colors,
      tagColors: {
        ...j.colors.tagColors,
        ...(t = M.colors) == null ? void 0 : t.tagColors
      },
      date: {
        ...j.colors.date,
        ...(e = M.colors) == null ? void 0 : e.date
      },
      input: {
        ...j.colors.input,
        ...(s = M.colors) == null ? void 0 : s.input
      },
      checkbox: {
        ...j.colors.checkbox,
        ...(i = M.colors) == null ? void 0 : i.checkbox
      },
      radio: {
        ...j.colors.radio,
        ...(o = M.colors) == null ? void 0 : o.radio
      },
      button: {
        ...j.colors.button,
        ...(n = M.colors) == null ? void 0 : n.button
      },
      dropdown: {
        ...j.colors.dropdown,
        ...(r = M.colors) == null ? void 0 : r.dropdown
      },
      scrollbar: {
        ...j.colors.scrollbar,
        ...(a = M.colors) == null ? void 0 : a.scrollbar
      },
      indicator: {
        ...j.colors.indicator,
        ...(l = M.colors) == null ? void 0 : l.indicator
      },
      tooltip: {
        ...j.colors.tooltip,
        ...(h = M.colors) == null ? void 0 : h.tooltip
      },
      image: {
        ...j.colors.image,
        ...(c = M.colors) == null ? void 0 : c.image
      },
      hiddenPlaceholder: {
        ...j.colors.hiddenPlaceholder,
        ...(d = M.colors) == null ? void 0 : d.hiddenPlaceholder
      },
      moreCount: {
        ...j.colors.moreCount,
        ...(u = M.colors) == null ? void 0 : u.moreCount
      },
      shadow: {
        ...j.colors.shadow,
        ...(f = M.colors) == null ? void 0 : f.shadow
      },
      watermark: {
        ...j.colors.watermark,
        ...(g = M.colors) == null ? void 0 : g.watermark
      },
      loading: (m = M.colors) != null && m.loading ? { ...j.colors.loading, ...M.colors.loading } : j.colors.loading
    },
    font: {
      ...j.font,
      ...M.font
    },
    row: {
      ...j.row,
      ...M.row
    },
    border: {
      ...j.border,
      ...M.border
    }
  } : { ...j };
}
class Qe {
  constructor(t, e, s = {}) {
    v(this, "element");
    v(this, "spinnerElement");
    v(this, "textElement");
    v(this, "theme");
    v(this, "config");
    this.theme = e, this.config = s, this.element = document.createElement("div"), this.element.style.cssText = `
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
    const i = "canvas-table-loading-animation";
    if (!document.getElementById(i)) {
      const o = document.createElement("style");
      o.id = i, o.textContent = `
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
class hs {
  // 用户手动设置的 loading 状态
  constructor(t, e) {
    v(this, "container");
    v(this, "wrapper");
    v(this, "canvas");
    v(this, "props");
    v(this, "dataManager");
    v(this, "layoutManager");
    v(this, "renderer");
    v(this, "interactionManager");
    v(this, "editorManager");
    v(this, "filterInputManager");
    v(this, "eventEmitter");
    v(this, "loadingOverlay");
    v(this, "theme");
    v(this, "themeMode");
    v(this, "mediaQuery", null);
    v(this, "isDestroyed", !1);
    v(this, "resizeObserver", null);
    v(this, "renderCache");
    v(this, "rowIdManager");
    v(this, "columnIdManager");
    v(this, "scheduledRender", null);
    v(this, "manualLoading", !1);
    v(this, "handleResize", jt(() => {
      this.resize();
    }, 100));
    v(this, "handleThemeChange", () => {
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
    const s = {
      enabled: ((n = e.virtualScroll) == null ? void 0 : n.enabled) ?? !0,
      rowBufferSize: ((r = e.virtualScroll) == null ? void 0 : r.rowBufferSize) ?? e.bufferSize ?? 5,
      columnBufferSize: ((a = e.virtualScroll) == null ? void 0 : a.columnBufferSize) ?? 2
    };
    ((l = e.virtualScroll) == null ? void 0 : l.estimatedRowHeight) !== void 0 && (s.estimatedRowHeight = e.virtualScroll.estimatedRowHeight), ((h = e.virtualScroll) == null ? void 0 : h.estimatedColumnWidth) !== void 0 && (s.estimatedColumnWidth = e.virtualScroll.estimatedColumnWidth);
    const i = e.selection ?? {
      mode: "cell",
      multi: !0
    }, o = e.editing ?? {
      enabled: !0,
      mode: "dblclick"
    };
    this.dataManager = new ce(e.rowKey), this.layoutManager = new bt(s, this.theme), this.layoutManager.setShowRowNumbers(e.showRowNumbers === !0), this.layoutManager.setRowHeightFn(e.rowHeight), this.renderer = new Fe(this.canvas, this.theme, this.layoutManager), this.renderer.setMultipleSelectSeparator(e.multipleSelectSeparator ?? ", "), this.rowIdManager = this.renderer.getRowIdManager(), this.columnIdManager = this.renderer.getColumnIdManager(), this.renderCache = new he(
      this.rowIdManager,
      this.columnIdManager,
      this.dataManager.getRowVersionManager()
    ), this.renderer.setRenderCache(this.renderCache), this.renderer.setOnImageLoaded(() => this.render()), e.watermark && this.renderer.setWatermarkConfig(e.watermark), e.imageLoad && this.renderer.setImageLoadConfig(e.imageLoad), this.interactionManager = new Tt(
      this.canvas,
      this.layoutManager,
      this.dataManager,
      this.eventEmitter,
      i,
      o
    ), this.interactionManager.setRowHeightResizeEnabled(e.enableRowHeightResize === !0), this.interactionManager.setRowResizable(e.rowResizable), this.interactionManager.setGetScrollbarBounds(() => {
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
    this.eventEmitter.on(S.SCROLL, (t, e) => {
      this.editorManager.setScroll(t, e), this.editorManager.updatePosition();
      const s = this.interactionManager.getFilterDropdown();
      s && this.filterInputManager.updatePosition(s), this.render();
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
      (t, e, s) => {
        const i = t, o = e;
        this.layoutManager.setRowHeight(i, o);
        const n = this.dataManager.getColumns(), r = this.dataManager.getRows();
        this.layoutManager.calculateLayout(n, r), this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop()
        ), this.editorManager.updatePosition(), this.render();
      }
    ), this.eventEmitter.on(S.COLUMN_REORDER, (t, e) => {
      const s = t, i = e;
      this.dataManager.reorderColumns(s, i);
      const o = this.dataManager.getColumns();
      if (this.layoutManager.calculateColumnLayoutOnly(o), this.props.onColumnReorder) {
        const n = o.map((r) => r.key);
        this.props.onColumnReorder(n);
      }
      this.render();
    }), this.eventEmitter.on(S.COLUMN_REORDER_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(S.COLUMN_SWAP, (t, e) => {
      const s = t, i = e;
      this.dataManager.swapColumnsByKey(s, i);
      const o = this.dataManager.getColumns();
      this.layoutManager.calculateColumnLayoutOnly(o), this.render();
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
        const i = this.dataManager.getRows()[t.rowIndex];
        i && this.eventEmitter.emit(S.ROW_CLICK, i, t.rowIndex, e);
      }
    }), this.eventEmitter.on(S.CELL_DBL_CLICK, (t, e) => {
      if (t.rowIndex >= 0) {
        const i = this.dataManager.getRows()[t.rowIndex];
        i && this.eventEmitter.emit(S.ROW_DBL_CLICK, i, t.rowIndex, e);
      }
    }), this.eventEmitter.on(S.CELL_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.HEADER_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.CHECKBOX_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(S.RADIO_CHANGE, () => {
      this.render();
    }), this.eventEmitter.on(S.SWITCH_CHANGE, (t, e) => {
      const s = t, i = e;
      this.props.onSwitchChange && this.props.onSwitchChange(s, i), this.render();
    }), this.eventEmitter.on(S.PROGRESS_CHANGE, (t, e) => {
      const s = t, i = e;
      this.props.onProgressChange && this.props.onProgressChange(s, i), this.render();
    }), this.eventEmitter.on(S.PROGRESS_DRAG, () => {
      this.render();
    }), this.eventEmitter.on(S.RATING_CHANGE, (t, e) => {
      const s = t, i = e;
      this.props.onRatingChange && this.props.onRatingChange(s, i), this.render();
    }), this.eventEmitter.on(S.COLOR_CHANGE, (t, e) => {
      const s = t, i = e;
      this.props.onColorChange && this.props.onColorChange(s, i), this.render();
    }), this.eventEmitter.on(S.COLOR_DROPDOWN_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(S.COLOR_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(S.COLOR_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.SWITCH_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(S.BUTTON_HOVER_ANIMATION_UPDATE, () => {
      this.render();
    }), this.eventEmitter.on(S.EDIT_START, (t, e) => {
      const s = t, i = e;
      this.editorManager.startEditing(s, i), this.render();
    }), this.eventEmitter.on(S.SELECT_CHANGE, (t, e) => {
      const s = t, i = e, n = this.layoutManager.getLeafColumns()[s.columnIndex];
      n && this.dataManager.updateCell(s.rowIndex, n.key, i, X(n)), this.props.onSelectChange && this.props.onSelectChange(s, i), this.render();
    }), this.eventEmitter.on(
      S.TAGS_CHANGE,
      (t, e, s) => {
        const i = t, o = e, n = s, a = this.layoutManager.getLeafColumns()[i.columnIndex];
        if (a) {
          const l = n ? o : o[0] ?? "";
          this.dataManager.updateCell(
            i.rowIndex,
            a.key,
            l,
            X(a)
          );
        }
        this.props.onTagsChange && this.props.onTagsChange(i, o), this.render();
      }
    ), this.eventEmitter.on(S.EXPAND, (t, e, s) => {
      const i = t, o = e, n = s;
      this.props.onExpand && this.props.onExpand(i, o, n), this.dataManager.toggleRowExpand(o), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.DROPDOWN_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(S.DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(S.DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.BUTTONS_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(S.DATE_DROPDOWN_OPEN, () => {
      this.render();
    }), this.eventEmitter.on(S.DATE_DROPDOWN_CLOSE, () => {
      this.render();
    }), this.eventEmitter.on(S.DATE_DROPDOWN_HOVER, () => {
      this.render();
    }), this.eventEmitter.on(S.DATE_SELECT, (t, e) => {
      const s = t, i = e, n = this.layoutManager.getLeafColumns()[s.columnIndex];
      n && this.dataManager.updateCell(s.rowIndex, n.key, i, X(n)), this.interactionManager.clearEditingState(), this.render();
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
      const e = t, s = this.dataManager.getColumns(), i = this.props.createRowData ? this.props.createRowData(s) : this.createDefaultRowData(s);
      this.dataManager.addRow(i, e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_ADD_BELOW, (t) => {
      const e = t, s = this.dataManager.getColumns(), i = this.props.createRowData ? this.props.createRowData(s) : this.createDefaultRowData(s);
      this.dataManager.addRow(i, e + 1), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.ROW_DELETE, (t) => {
      const e = t;
      this.dataManager.deleteRow(e), this.updateLayout(), this.render();
    }), this.eventEmitter.on(S.UNDO, () => {
      this.undo();
    }), this.eventEmitter.on(S.REDO, () => {
      this.redo();
    }), this.eventEmitter.on(
      S.IMAGE_CLICK,
      (t, e, s) => {
        const i = t, o = e, n = s;
        this.props.onImageClick && this.props.onImageClick(i, o, n);
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
      const s = t, i = e;
      this.props.onImageUpload && this.props.onImageUpload(s, i);
    }), this.eventEmitter.on(
      S.IMAGE_DELETE,
      (t, e, s) => {
        const i = t, o = e, n = s;
        this.props.onImageDelete && this.props.onImageDelete(i, o, n);
      }
    ), this.eventEmitter.on(S.EDIT_END, (t, e) => {
      const s = t, i = e, n = this.layoutManager.getLeafColumns()[s.columnIndex];
      n && this.dataManager.updateCell(s.rowIndex, n.key, i, X(n)), this.interactionManager.clearEditingState(), this.render();
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
      onEditEnd: this.props.onEditEnd,
      onExpand: this.props.onExpand,
      onCheckboxChange: this.props.onCheckboxChange,
      onRadioChange: this.props.onRadioChange,
      onButtonClick: this.props.onButtonClick,
      onColumnHide: this.props.onColumnHide,
      onColumnShow: this.props.onColumnShow
    };
    for (const [e, s] of Object.entries(t))
      if (s) {
        const i = e.replace("on", "").replace(/^./, (o) => o.toLowerCase());
        this.eventEmitter.on(i, s);
      }
  }
  setupResizeObserver() {
    typeof ResizeObserver < "u" && (this.resizeObserver = new ResizeObserver(this.handleResize), this.resizeObserver.observe(this.container)), window.addEventListener("resize", this.handleResize);
  }
  async initialize() {
    try {
      const t = this.container.getBoundingClientRect(), e = t.width || this.props.width || 800, s = t.height || this.props.height || 400;
      this.renderer.resize(e, s), this.layoutManager.setViewportSize(e, s), await this.dataManager.loadRows(this.props.rows), this.dataManager.setColumns(this.props.columns), this.props.expandColumnKey && (this.renderer.setExpandColumnKey(this.props.expandColumnKey), this.interactionManager.setExpandColumnKey(this.props.expandColumnKey)), this.updateLayout();
      const i = {
        rows: this.dataManager.getRows(),
        columns: this.dataManager.getColumns()
      };
      this.eventEmitter.emit(S.LOAD, i), this.render();
    } catch (t) {
      const e = t instanceof Error ? t : new Error(String(t));
      this.eventEmitter.emit(S.ERROR, e);
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
    const t = this.dataManager.getColumns(), e = this.dataManager.getRows(), s = this.interactionManager.getInteractionState(), i = this.interactionManager.getScrollState();
    if (this.layoutManager.setScrollPosition(i.scrollLeft, i.scrollTop), e.length === 0) {
      this.loadingOverlay.hide(), this.renderer.renderEmptyState(
        this.props.emptyText ?? "No data",
        this.dataManager.getSort(),
        this.dataManager.getFilters(),
        s.hoveredHeaderColumnKey,
        i.scrollLeft
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
      i.scrollLeft,
      i.scrollTop,
      {
        hoveredCell: s.hoveredCell,
        selectedCells: s.selectedCells,
        editingCell: s.editingCell,
        sortConfig: this.dataManager.getSort(),
        filterConfig: this.dataManager.getFilters(),
        showHeader: this.props.showHeader !== !1,
        stripeRows: this.props.stripeRows !== !1,
        dropdown: s.dropdown,
        hoveredHeaderColumnKey: s.hoveredHeaderColumnKey,
        switchAnimations: s.switchAnimations,
        buttonHoverStates: s.buttonHoverStates,
        columnReorderState: s.columnReorderState,
        headerContextMenu: s.headerContextMenu,
        hoveredImageIndex: this.interactionManager.getHoveredImageIndex(),
        hoveredButtonIndex: this.interactionManager.getHoveredButtonIndex(),
        progressDragState: s.progressDragState,
        rowResizeState: s.rowResizeState
      }
    );
    const n = this.interactionManager.getScrollbarState();
    this.renderer.renderScrollbars(
      i.scrollLeft,
      i.scrollTop,
      i.maxScrollLeft,
      i.maxScrollTop,
      n
    ), s.tooltip && this.renderer.renderTooltip(s.tooltip);
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
    const t = this.container.getBoundingClientRect(), e = t.width || this.props.width || 800, s = t.height || this.props.height || 400;
    this.renderer.resize(e, s), this.layoutManager.setViewportSize(e, s), this.updateLayout(), this.render();
  }
  setRows(t) {
    this.dataManager.loadRows(t).then(() => {
      this.interactionManager.setScrollPosition(0, 0), this.interactionManager.resetState(), this.editorManager.destroy(), this.renderer.clearImageCache(), ft.clearCache(), this.renderer.resetRowIds(), this.renderCache.clear(), this.updateLayout(), this.render();
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
    const s = this.layoutManager.getScrollOffsetForRow(t);
    let i = this.interactionManager.getScrollState().scrollLeft;
    e !== void 0 && (i = this.layoutManager.getScrollOffsetForColumn(e)), this.interactionManager.setScrollPosition(i, s), this.render();
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
  updateCell(t, e, s) {
    const i = this.dataManager.updateCell(t, e, s);
    this.eventEmitter.emit(S.CHANGE, [i]), this.render();
  }
  updateRow(t, e) {
    const s = this.dataManager.updateRow(t, e);
    this.eventEmitter.emit(S.CHANGE, s), this.render();
  }
  addRow(t, e) {
    const s = this.dataManager.addRow(t, e);
    this.eventEmitter.emit(S.CHANGE, [s]), this.updateLayout(), this.render();
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
    this.manualLoading = !0, this.loadingOverlay.show(t), this.render();
  }
  /**
   * 隐藏 loading overlay
   */
  hideLoading() {
    this.manualLoading = !1, this.loadingOverlay.hide(), this.render();
  }
  sort(t) {
    this.dataManager.sort(t), this.interactionManager.setSortConfig(t), this.eventEmitter.emit(S.SORT, t), this.render();
  }
  filter(t) {
    this.dataManager.filter(t), this.interactionManager.setFilterConfig(t), this.eventEmitter.emit(S.FILTER, t), this.updateLayout(), this.render();
  }
  clearFilters() {
    this.dataManager.clearFilters(), this.interactionManager.setFilterConfig([]), this.eventEmitter.emit(S.FILTER, []), this.updateLayout(), this.render();
  }
  async export(t) {
    const e = this.dataManager.exportData({
      includeHeaders: t.includeHeaders ?? !0,
      includeHidden: t.includeHidden ?? !1,
      selectedOnly: t.selectedOnly ?? !1
    });
    let s, i;
    switch (t.format) {
      case "csv":
        s = wt(e), i = "text/csv";
        break;
      case "json":
        s = JSON.stringify(e, null, 2), i = "application/json";
        break;
      case "excel":
        s = wt(e, "	"), i = "application/vnd.ms-excel";
        break;
      default:
        s = wt(e), i = "text/csv";
    }
    return new Blob([s], { type: i });
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
    const e = this.dataManager.getColumns(), s = [], i = (r, a = []) => {
      for (const l of r) {
        if (l.key === t) {
          for (const h of a)
            s.push(h.key);
          return !0;
        }
        if (l.children && i(l.children, [...a, l]))
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
        if (a.key === t || s.includes(a.key)) {
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
    i(e), n(e) && (this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    ), this.render(), this.props.onColumnShow && this.props.onColumnShow(t));
  }
  hideColumnInternal(t) {
    const e = this.dataManager.getColumns(), s = (o) => {
      if (o.hidden = !0, o.children)
        for (const n of o.children)
          s(n);
    }, i = (o) => {
      for (const n of o) {
        if (n.key === t)
          return s(n), !0;
        if (n.children && i(n.children))
          return !0;
      }
      return !1;
    };
    i(e) && (this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns()), this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop()
    ), this.render(), this.props.onColumnHide && this.props.onColumnHide(t));
  }
  getViewConfig() {
    const t = this.dataManager.getColumns(), e = {};
    t.forEach((i, o) => {
      e[i.key] = this.layoutManager.getColumnWidthByIndex(o);
    });
    const s = (i) => {
      const o = [];
      for (const n of i)
        n.hidden && o.push(n.key), n.children && o.push(...s(n.children));
      return o;
    };
    return {
      columnWidths: e,
      columnOrder: t.map((i) => i.key),
      hiddenColumns: s(t),
      fixedColumns: { left: [], right: [] },
      sort: this.dataManager.getSort(),
      filters: this.dataManager.getFilters()
    };
  }
  setViewConfig(t) {
    if (t.sort && this.dataManager.sort(t.sort), t.filters && this.dataManager.filter(t.filters), t.hiddenColumns) {
      const e = this.dataManager.getColumns(), s = (i, o) => {
        for (const n of i)
          n.hidden = o.includes(n.key), n.children && s(n.children, o);
      };
      s(e, t.hiddenColumns);
    }
    this.updateLayout(), this.render();
  }
  refresh() {
    this.updateLayout(), this.render();
  }
  createDefaultRowData(t) {
    const e = {};
    for (const s of t) {
      const i = X(s);
      switch (s.type) {
        case "number":
          e[i] = 0;
          break;
        case "checkbox":
        case "switch":
          e[i] = !1;
          break;
        case "date":
          e[i] = "";
          break;
        default:
          e[i] = "";
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
    const e = this.themeMode === "auto", s = t === "auto";
    this.themeMode = t, e && !s ? this.teardownAutoThemeDetection() : !e && s && this.setupAutoThemeDetection(), this.theme = this.resolveTheme(), this.applyTheme(), this.render();
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
    var i, o, n, r, a, l, h, c, d, u, f, g, m, p, x;
    let e;
    this.themeMode === "auto" ? e = window.matchMedia("(prefers-color-scheme: dark)").matches ? Nt : j : this.themeMode === "dark" ? e = Nt : e = j;
    const s = t ?? this.props.theme;
    return s ? {
      ...e,
      ...s,
      colors: {
        ...e.colors,
        ...s.colors,
        tagColors: {
          ...e.colors.tagColors,
          ...(i = s.colors) == null ? void 0 : i.tagColors
        },
        date: {
          ...e.colors.date,
          ...(o = s.colors) == null ? void 0 : o.date
        },
        input: {
          ...e.colors.input,
          ...(n = s.colors) == null ? void 0 : n.input
        },
        checkbox: {
          ...e.colors.checkbox,
          ...(r = s.colors) == null ? void 0 : r.checkbox
        },
        radio: {
          ...e.colors.radio,
          ...(a = s.colors) == null ? void 0 : a.radio
        },
        button: {
          ...e.colors.button,
          ...(l = s.colors) == null ? void 0 : l.button
        },
        dropdown: {
          ...e.colors.dropdown,
          ...(h = s.colors) == null ? void 0 : h.dropdown
        },
        scrollbar: {
          ...e.colors.scrollbar,
          ...(c = s.colors) == null ? void 0 : c.scrollbar
        },
        indicator: {
          ...e.colors.indicator,
          ...(d = s.colors) == null ? void 0 : d.indicator
        },
        tooltip: {
          ...e.colors.tooltip,
          ...(u = s.colors) == null ? void 0 : u.tooltip
        },
        image: {
          ...e.colors.image,
          ...(f = s.colors) == null ? void 0 : f.image
        },
        hiddenPlaceholder: {
          ...e.colors.hiddenPlaceholder,
          ...(g = s.colors) == null ? void 0 : g.hiddenPlaceholder
        },
        moreCount: {
          ...e.colors.moreCount,
          ...(m = s.colors) == null ? void 0 : m.moreCount
        },
        shadow: {
          ...e.colors.shadow,
          ...(p = s.colors) == null ? void 0 : p.shadow
        },
        watermark: {
          ...e.colors.watermark,
          ...(x = s.colors) == null ? void 0 : x.watermark
        }
      },
      font: {
        ...e.font,
        ...s.font
      },
      row: {
        ...e.row,
        ...s.row
      },
      border: {
        ...e.border,
        ...s.border
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
  hs as CanvasTable,
  ae as ColumnIdManager,
  Nt as DARK_THEME,
  j as DEFAULT_THEME,
  ce as DataManager,
  Ke as EventEmitter,
  se as FILTER_SAMPLE_ROWS,
  ie as FILTER_SEARCH_LIMIT,
  Tt as InteractionManager,
  as as LRUCache,
  bt as LayoutManager,
  he as RenderCache,
  Fe as Renderer,
  re as RowIdManager,
  le as RowVersionManager,
  wt as arrayToCsv,
  kt as binarySearch,
  Z as clamp,
  os as createCanvas,
  jt as debounce,
  Ht as deepClone,
  hs as default,
  rs as downloadBlob,
  Je as formatBoolean,
  Ze as formatDate,
  Qt as formatNumber,
  qe as formatPercent,
  Dt as generateId,
  Xt as getCellDisplayText,
  X as getColumnField,
  Vt as getColumnFilterOptions,
  mt as getDevicePixelRatio,
  ee as getFilterModeByColumnType,
  es as getNestedValue,
  nt as getRenderResult,
  qt as isEqual,
  Zt as isPromise,
  is as measureText,
  ls as mergeTheme,
  ns as requestAnimationFrameThrottle,
  et as resolveDisabled,
  ne as searchFilterOptions,
  ss as setNestedValue,
  ts as throttle,
  ct as truncateText
};
//# sourceMappingURL=canvas-table.js.map
