/**
 * EditorRegistry - 编辑器策略注册表
 *
 * 根据 column.type 或 render result 的 type 决定使用哪个 EditorStrategy。
 * 所有内置类型默认使用 DefaultInteractiveEditor 或 DefaultDomEditor。
 */

import { CellPosition, Column, Row, ValidationError, CellTypes } from "../../types";
import { resolveDisabled } from "../../utils";
import { EditorStrategy, InteractiveEditorStrategy, DomEditorStrategy } from "./BaseEditor";

// ─── 默认交互式编辑器策略 ───

const defaultInteractiveStrategy: InteractiveEditorStrategy = {
  isInteractive: true,

  canEdit(_cell: CellPosition, row: Row, column: Column): boolean {
    if (column.editable === false) return false;
    return !resolveDisabled(column.disabled, row, column);
  },
};

// ─── 默认 DOM 编辑器策略 ───

const defaultDomStrategy: DomEditorStrategy = {
  isInteractive: false,

  canEdit(_cell: CellPosition, row: Row, column: Column): boolean {
    if (column.editable === false) return false;
    return !resolveDisabled(column.disabled, row, column);
  },

  shouldBlockFocusLoss(_cell: CellPosition, error: ValidationError): boolean {
    return error.level === "error";
  },
};

// ─── 未知类型 fallback 策略 — 安全地默认不可编辑 ───

const unknownTypeStrategy: InteractiveEditorStrategy = {
  isInteractive: true,

  canEdit(_cell: CellPosition, _row: Row, column: Column): boolean {
    // 未知类型默认不可编辑，除非显式设置 editable: true
    return column.editable === true;
  },
};

// ─── 交互式类型列表 ───

const INTERACTIVE_TYPES = new Set([
  CellTypes.CHECKBOX,
  CellTypes.RADIO,
  CellTypes.SWITCH,
  CellTypes.SELECT,
  CellTypes.TAG,
  CellTypes.DATE,
  CellTypes.COLOR,
  CellTypes.RATING,
  CellTypes.PROGRESS,
  CellTypes.BUTTON,
  CellTypes.BUTTONS,
]);

// ─── DOM 类型列表 ───

const DOM_TYPES = new Set([CellTypes.INPUT, CellTypes.TEXT, CellTypes.NUMBER]);

// ─── EditorRegistry ───

export class EditorRegistry {
  private strategies: Map<string, EditorStrategy> = new Map();

  constructor() {
    // 注册交互式类型
    for (const type of INTERACTIVE_TYPES) {
      this.strategies.set(type, defaultInteractiveStrategy);
    }
    // 注册 DOM 类型
    for (const type of DOM_TYPES) {
      this.strategies.set(type, defaultDomStrategy);
    }
  }

  /** 注册自定义策略 */
  register(type: string, strategy: EditorStrategy): void {
    this.strategies.set(type, strategy);
  }

  /** 获取列对应的编辑器策略 */
  getStrategy(column: Column): EditorStrategy {
    const type = column.type ?? CellTypes.TEXT;
    const strategy = this.strategies.get(type);
    if (strategy) return strategy;

    // 未知 type → 安全地默认不可编辑（除非显式 editable: true）
    return unknownTypeStrategy;
  }

  /** 检查列是否是交互式编辑器 */
  isInteractive(column: Column): boolean {
    return this.getStrategy(column).isInteractive;
  }
}
