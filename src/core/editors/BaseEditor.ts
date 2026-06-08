/**
 * EditorStrategy - 编辑器策略模式接口
 *
 * 统一交互式编辑器（checkbox/radio/switch 等）和 DOM 编辑器（input/textarea）
 * 的生命周期钩子，消除分散的 canEdit/validate/commit 逻辑。
 */

import {
  CellPosition,
  Column,
  Row,
  ValidateResult,
  ValidationError,
  InputConfig,
} from "../../types";

/**
 * 编辑器生命周期钩子 — 两种模式共有
 */
export interface EditorLifecycle {
  /** 编辑前检查：是否允许编辑（editable + disabled） */
  canEdit(cell: CellPosition, row: Row, column: Column): boolean;

  /** 值校验（支持 async），返回 ValidateResult */
  validate?(
    cell: CellPosition,
    value: unknown,
    row: Row,
    column: Column,
  ): ValidateResult | Promise<ValidateResult>;

  /** 校验通过，值已写入数据 */
  onCommit?(cell: CellPosition, value: unknown, row: Row, column: Column): void;

  /** 校验失败（error），值未写入 */
  onReject?(cell: CellPosition, error: ValidationError): void;

  /** 值写入但带警告状态 */
  onWarning?(cell: CellPosition, warning: ValidationError): void;
}

/**
 * 交互式编辑器策略 — 点击即生效的类型
 *
 * 适用：checkbox, radio, switch, select, tags, date, color, rating, progress
 */
export interface InteractiveEditorStrategy extends EditorLifecycle {
  readonly isInteractive: true;

  /** 交互动作前拦截（点击/选择前） */
  beforeInteract?(cell: CellPosition, row: Row, column: Column): boolean;

  /** 下拉/弹出层打开时（select/tags/date/color） */
  onDropdownOpen?(cell: CellPosition, row: Row, column: Column): void;

  /** 下拉/弹出层关闭时未选择（相当于 DOM 编辑器的 onCancel） */
  onDropdownCancel?(cell: CellPosition): void;
}

/**
 * DOM 编辑器策略 — 双击/Enter 进入编辑模式的类型
 *
 * 适用：input, textarea
 */
export interface DomEditorStrategy extends EditorLifecycle {
  readonly isInteractive: false;

  /** 进入编辑模式 */
  onEditStart?(cell: CellPosition, config?: InputConfig): void;

  /** error 时是否阻止焦点丢失（input 保持打开） */
  shouldBlockFocusLoss(cell: CellPosition, error: ValidationError): boolean;

  /** Escape 取消编辑 */
  onCancel?(cell: CellPosition): void;
}

export type EditorStrategy = InteractiveEditorStrategy | DomEditorStrategy;
