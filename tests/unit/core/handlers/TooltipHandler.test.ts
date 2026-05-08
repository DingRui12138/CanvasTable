import { LayoutManager } from "@/core/LayoutManager";
import { DataManager } from "@/core/DataManager";
import { EventEmitter } from "@/core/EventEmitter";
import { TooltipHandler } from "@/core/handlers/TooltipHandler";
import type { ComputedSummaryRow, InteractionState, ScrollState, Column, Row } from "@/types";
import { zhCN } from "@/locale";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

describe("TooltipHandler", () => {
  it("should not show text tooltip when increased row height makes all text visible", () => {
    const theme = createMockTheme();
    const canvas = createMockCanvas();
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;

    const layoutManager = new LayoutManager(undefined, theme);
    layoutManager.setViewportSize(800, 600);

    const dataManager = new DataManager();
    const columns: Column[] = [{ key: "name", title: "Name", width: 100, type: "text" }];
    const rows: Row[] = [
      {
        id: "row-1",
        data: {
          name: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        },
      },
    ];

    layoutManager.calculateLayout(columns, rows);
    dataManager.setColumns(columns);
    dataManager.setRows(rows);

    const state: InteractionState = {
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
      switchAnimations: new Map(),
      buttonHoverStates: new Map(),
      hoveredImageIndex: -1,
      hoveredButtonIndex: -1,
    };
    const scrollState: ScrollState = {
      scrollLeft: 0,
      scrollTop: 0,
      maxScrollLeft: 0,
      maxScrollTop: 0,
      isScrolling: false,
    };

    const tooltipHandler = new TooltipHandler(
      {
        state,
        scrollState,
        layoutManager,
        dataManager,
        canvas,
        ctx,
        expandColumnKey: null,
        locale: zhCN,
      },
      new EventEmitter(),
    );

    tooltipHandler.checkTooltip({ rowIndex: 0, columnIndex: 0 });
    expect(tooltipHandler.getTooltip()).not.toBeNull();

    layoutManager.setRowHeight(rows[0]!, 80);
    layoutManager.calculateLayout(columns, rows);

    tooltipHandler.checkTooltip({ rowIndex: 0, columnIndex: 0 });
    expect(tooltipHandler.getTooltip()).toBeNull();
  });

  it("should not show tags tooltip when increased row height makes all tags visible", () => {
    const theme = createMockTheme();
    const canvas = createMockCanvas();
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;

    const layoutManager = new LayoutManager(undefined, theme);
    layoutManager.setViewportSize(800, 600);

    const dataManager = new DataManager();
    const columns: Column[] = [
      {
        key: "tags",
        title: "Tags",
        width: 120,
        type: "tag",
        render: () => ({
          type: "tag",
          tags: {
            tags: [
              { text: "Alpha" },
              { text: "Beta" },
              { text: "Gamma" },
              { text: "Delta" },
            ],
          },
        }),
      },
    ];
    const rows: Row[] = [
      {
        id: "row-1",
        data: {
          tags: [],
        },
      },
    ];

    layoutManager.calculateLayout(columns, rows);
    dataManager.setColumns(columns);
    dataManager.setRows(rows);

    const state: InteractionState = {
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
      switchAnimations: new Map(),
      buttonHoverStates: new Map(),
      hoveredImageIndex: -1,
      hoveredButtonIndex: -1,
    };
    const scrollState: ScrollState = {
      scrollLeft: 0,
      scrollTop: 0,
      maxScrollLeft: 0,
      maxScrollTop: 0,
      isScrolling: false,
    };

    const tooltipHandler = new TooltipHandler(
      {
        state,
        scrollState,
        layoutManager,
        dataManager,
        canvas,
        ctx,
        expandColumnKey: null,
        locale: zhCN,
      },
      new EventEmitter(),
    );

    tooltipHandler.checkTooltip({ rowIndex: 0, columnIndex: 0 });
    expect(tooltipHandler.getTooltip()).not.toBeNull();

    layoutManager.setRowHeight(rows[0]!, 80);
    layoutManager.calculateLayout(columns, rows);

    tooltipHandler.checkTooltip({ rowIndex: 0, columnIndex: 0 });
    expect(tooltipHandler.getTooltip()).toBeNull();
  });

  it("should show text tooltip for truncated summary cells", () => {
    const theme = createMockTheme();
    const canvas = createMockCanvas();
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;

    const layoutManager = new LayoutManager(undefined, theme);
    layoutManager.setViewportSize(800, 240);

    const dataManager = new DataManager();
    const columns: Column[] = [
      { key: "name", title: "Name", width: 80, type: "text" },
      { key: "amount", title: "Amount", width: 100, type: "number" },
    ];
    const rows: Row[] = [{ id: "row-1", data: { name: "A", amount: 1 } }];
    const summary: ComputedSummaryRow = {
      key: "total",
      height: 32,
      source: { key: "total", cells: [] },
      cells: [
        {
          key: "total:label",
          startColumnIndex: 0,
          endColumnIndex: 0,
          startColumnKey: "name",
          endColumnKey: "name",
          config: { columnKey: "name", text: "Very long summary label" },
          renderResult: { type: "text", text: "Very long summary label" },
        },
      ],
    };

    layoutManager.setSummaryRows([], [summary]);
    layoutManager.calculateLayout(columns, rows);
    dataManager.setColumns(columns);
    dataManager.setRows(rows);

    const state: InteractionState = {
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
      switchAnimations: new Map(),
      buttonHoverStates: new Map(),
      hoveredImageIndex: -1,
      hoveredButtonIndex: -1,
    };
    const scrollState: ScrollState = {
      scrollLeft: 0,
      scrollTop: 0,
      maxScrollLeft: 0,
      maxScrollTop: 0,
      isScrolling: false,
    };

    const tooltipHandler = new TooltipHandler(
      {
        state,
        scrollState,
        layoutManager,
        dataManager,
        canvas,
        ctx,
        expandColumnKey: null,
        locale: zhCN,
      },
      new EventEmitter(),
    );

    tooltipHandler.checkSummaryTooltip({
      row: summary,
      band: "summary-bottom",
      columnIndex: 0,
    });

    expect(tooltipHandler.getTooltip()).toMatchObject({
      content: { type: "text", text: "Very long summary label" },
      y: 240 - summary.height,
      width: 80,
    });
  });
});
