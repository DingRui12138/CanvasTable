import { CanvasTable } from "@/CanvasTable";
import type { CellType, Column, Row, ValidationError, RadioOption, SelectOption, TagItem } from "@/types";

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const flushRender = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 25));
};

describe("CanvasTable validation", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({ width: 600, height: 300, top: 0, left: 0, right: 600, bottom: 300 }),
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // ─── updateCell / updateRow 校验 ───

  it("blocks updateCell when column validation fails and stores the error", async () => {
    const rows: Row[] = [{ id: "row-1", data: { id: 1, salary: 100 } }];
    const columns: Column[] = [
      { key: "id", title: "ID", width: 80 },
      {
        key: "salary",
        title: "Salary",
        width: 120,
        type: "number",
        validate: (value) => Number(value) >= 0 || "Salary must be ≥ 0",
      },
    ];
    const validationErrors: ValidationError[] = [];
    const table = new CanvasTable(container, {
      rows,
      columns,
      onValidationError: (error) => validationErrors.push(error),
    });
    await flushPromises();

    await table.updateCell(0, "salary", -1);

    expect(table.getRow(0)!.data.salary).toBe(100);
    expect(table.getValidationErrors()).toHaveLength(1);
    expect(table.getValidationError({ rowIndex: 0, columnIndex: 1 })).toMatchObject({
      message: "Salary must be ≥ 0",
      cell: { rowIndex: 0, columnIndex: 1 },
      value: -1,
    });
    expect(validationErrors).toHaveLength(1);

    table.destroy();
  });

  it("renders validation tooltip immediately after validation issues", async () => {
    const rows: Row[] = [{ id: "row-1", data: { id: 1, age: 45 } }];
    const columns: Column[] = [
      { key: "id", title: "ID", width: 80 },
      {
        key: "age",
        title: "Age",
        width: 80,
        type: "number",
        validate: (value) => Number(value) >= 18 || "Age must be at least 18",
      },
    ];
    const table = new CanvasTable(container, { rows, columns });
    await flushPromises();

    const renderer = (table as unknown as { renderer: { renderTooltip: jest.Mock } }).renderer;
    renderer.renderTooltip = jest.fn();

    await table.updateCell(0, "age", 10);
    await flushRender();

    expect(renderer.renderTooltip).toHaveBeenCalledWith(
      expect.objectContaining({
        cell: { rowIndex: 0, columnIndex: 1 },
        content: { type: "text", text: "Age must be at least 18" },
      }),
    );

    table.destroy();
  });

  it("clears the validation error after a valid update", async () => {
    const rows: Row[] = [{ id: "row-1", data: { id: 1, salary: 100 } }];
    const columns: Column[] = [
      { key: "id", title: "ID", width: 80 },
      {
        key: "salary",
        title: "Salary",
        width: 120,
        type: "number",
        validate: (value) => Number(value) >= 0 || "Salary must be ≥ 0",
      },
    ];
    const table = new CanvasTable(container, { rows, columns });
    await flushPromises();

    await table.updateCell(0, "salary", -1);
    await table.updateCell(0, "salary", 250);

    expect(table.getRow(0)!.data.salary).toBe(250);
    expect(table.getValidationErrors()).toHaveLength(0);

    table.destroy();
  });

  it("commits values that return a warning and keeps the warning state", async () => {
    const rows: Row[] = [{ id: "row-1", data: { id: 1, age: 45 } }];
    const columns: Column[] = [
      { key: "id", title: "ID", width: 80 },
      {
        key: "age",
        title: "Age",
        width: 80,
        type: "number",
        validate: (value) => {
          const age = Number(value);
          if (age >= 50 && age <= 60) {
            return { valid: true, level: "warning", message: "Age is close to retirement" };
          }
          return true;
        },
      },
    ];
    const table = new CanvasTable(container, { rows, columns });
    await flushPromises();

    await table.updateCell(0, "age", 55);

    expect(table.getRow(0)!.data.age).toBe(55);
    expect(table.getValidationError({ rowIndex: 0, columnIndex: 1 })).toMatchObject({
      message: "Age is close to retirement",
      level: "warning",
    });

    table.destroy();
  });

  it("blocks updateRow when a changed field fails validation", async () => {
    const rows: Row[] = [{ id: "row-1", data: { id: 1, salary: 100, name: "Alice" } }];
    const columns: Column[] = [
      { key: "name", title: "Name", width: 120 },
      {
        key: "salary",
        title: "Salary",
        width: 120,
        type: "number",
        validate: (value) => Number(value) >= 0 || "Salary must be ≥ 0",
      },
    ];
    const table = new CanvasTable(container, { rows, columns });
    await flushPromises();

    await table.updateRow(0, { name: "Bob", salary: -1 });

    expect(table.getRow(0)!.data).toMatchObject({ name: "Alice", salary: 100 });
    expect(table.getValidationError({ rowIndex: 0, columnIndex: 1 })?.message).toBe("Salary must be ≥ 0");

    table.destroy();
  });

  // ─── DOM 编辑器校验 ───

  it("blocks DOM editor commits when column validation fails", async () => {
    const rows: Row[] = [{ id: "row-1", data: { id: 1, name: "Alice", age: 30 } }];
    const columns: Column[] = [
      { key: "id", title: "ID", width: 80 },
      {
        key: "basic",
        title: "Basic",
        children: [
          { key: "name", title: "Name", width: 120, editable: true },
          {
            key: "age",
            title: "Age",
            width: 80,
            type: "number",
            editable: true,
            validate: (value) => Number(value) >= 18 || "Age must be at least 18",
          },
        ],
      },
    ];
    const validationErrors: ValidationError[] = [];
    const table = new CanvasTable(container, {
      rows,
      columns,
      showRowNumbers: true,
      editing: { enabled: true },
      onValidationError: (error) => validationErrors.push(error),
    });
    await flushPromises();

    const emittedEditEnds: unknown[][] = [];
    table.on("editEnd", (...args: unknown[]) => emittedEditEnds.push(args));

    const editorManager = (
      table as unknown as {
        editorManager: {
          startEditing: (cell: unknown) => Promise<boolean>;
          endEditing: (save: boolean) => Promise<boolean>;
        };
      }
    ).editorManager;
    const ageColumnIndex = (
      table as unknown as { layoutManager: { getLeafColumns: () => Column[] } }
    ).layoutManager.getLeafColumns().findIndex((c) => c.key === "age");
    expect(ageColumnIndex).toBeGreaterThanOrEqual(0);
    await editorManager.startEditing({ rowIndex: 0, columnIndex: ageColumnIndex });
    const input = container.querySelector("input")!;
    input.value = "10";
    await editorManager.endEditing(true);

    expect(emittedEditEnds).toHaveLength(0);
    expect(table.getRow(0)!.data.age).toBe(30);
    expect(validationErrors).toHaveLength(1);
    expect(table.getValidationError({ rowIndex: 0, columnIndex: ageColumnIndex })).toMatchObject({
      message: "Age must be at least 18",
      value: "10",
      level: "error",
    });
    expect(container.querySelector("input")).toBe(input);

    await editorManager.endEditing(false);
    expect(container.querySelector("input")).toBeNull();
    expect(table.getValidationError({ rowIndex: 0, columnIndex: ageColumnIndex })).toBeNull();

    table.destroy();
  });

  it("supports async validate returning Promise", async () => {
    const rows: Row[] = [{ data: { id: 1, email: "test@example.com" } }];
    const columns: Column[] = [
      { key: "id", title: "ID", width: 80 },
      {
        key: "email",
        title: "Email",
        width: 160,
        validate: async (value) => {
          await new Promise((r) => setTimeout(r, 50));
          return typeof value === "string" && value.includes("@") || "Invalid email format";
        },
      },
    ];
    const validationErrors: ValidationError[] = [];
    const table = new CanvasTable(container, {
      rows, columns,
      onValidationError: (error) => validationErrors.push(error),
    });
    await flushPromises();

    // Mock renderTooltip to avoid jsdom roundRect error during async validation animation
    (table as unknown as { renderer: { renderTooltip: jest.Mock } }).renderer.renderTooltip = jest.fn();

    await table.updateCell(0, "email", "noemail");
    expect(table.getRow(0)!.data.email).toBe("test@example.com");
    expect(table.getValidationErrors()).toHaveLength(1);

    await table.updateCell(0, "email", "valid@test.com");
    expect(table.getRow(0)!.data.email).toBe("valid@test.com");
    expect(table.getValidationErrors()).toHaveLength(0);

    table.destroy();
  });

  // ─── 交互式编辑器校验 ───

  describe("interactive editor validation", () => {
    const RADIO_OPTIONS: RadioOption[] = [
      { label: "Draft", value: "draft" },
      { label: "Published", value: "published" },
      { label: "Review", value: "review" },
    ];
    const SELECT_OPTIONS: SelectOption[] = [
      { label: "User", value: "user" },
      { label: "Admin", value: "admin" },
      { label: "Editor", value: "editor" },
    ];

    /** 获取内部 eventEmitter 以模拟交互事件 */
    function getEventEmitter(table: CanvasTable) {
      return (table as any).eventEmitter;
    }

    /** 构建 CellInfo */
    function makeCellInfo(table: CanvasTable, rowIndex: number, columnKey: string) {
      const rows = table.getRows();
      const layoutManager = (table as any).layoutManager;
      const leafColumns = layoutManager.getLeafColumns() as Column[];
      const columnIndex = leafColumns.findIndex((c: Column) => c.key === columnKey);
      return { rowIndex, columnIndex, row: rows[rowIndex], column: leafColumns[columnIndex] };
    }

    // ─── checkbox ───

    it("blocks checkbox change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, active: false } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "active",
          title: "Active",
          width: 80,
          type: "checkbox" as CellType,
          render: (_value, row) => ({
            type: "checkbox" as CellType,
            checkbox: { checked: row.data.active as boolean },
          }),
          validate: (value) => value !== true || "Cannot activate",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("checkboxChange", makeCellInfo(table, 0, "active"), true);
      await flushPromises();

      expect(table.getRow(0)!.data.active).toBe(false);
      expect(table.getValidationErrors()).toHaveLength(1);
      expect(table.getValidationError({ rowIndex: 0, columnIndex: 1 })).toMatchObject({
        message: "Cannot activate", level: "error",
      });

      table.destroy();
    });

    it("commits checkbox change with warning and keeps warning state", async () => {
      const rows: Row[] = [{ data: { id: 1, active: false } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "active",
          title: "Active",
          width: 80,
          type: "checkbox" as CellType,
          render: (_value, row) => ({
            type: "checkbox" as CellType,
            checkbox: { checked: row.data.active as boolean },
          }),
          validate: () => ({ valid: true, level: "warning", message: "Activating with caution" }),
        },
      ];
      const table = new CanvasTable(container, { rows, columns });
      await flushPromises();

      getEventEmitter(table).emit("checkboxChange", makeCellInfo(table, 0, "active"), true);
      await flushPromises();

      expect(table.getRow(0)!.data.active).toBe(true);
      expect(table.getValidationError({ rowIndex: 0, columnIndex: 1 })).toMatchObject({
        message: "Activating with caution", level: "warning",
      });

      table.destroy();
    });

    // ─── radio ───

    it("blocks radio change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, status: "draft" } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "status",
          title: "Status",
          width: 120,
          type: "radio" as CellType,
          render: (_value, row) => ({
            type: "radio" as CellType,
            radio: { value: row.data.status as string, options: RADIO_OPTIONS },
          }),
          validate: (value) => value !== "published" || "Cannot publish",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("radioChange", makeCellInfo(table, 0, "status"), "published");
      await flushPromises();

      expect(table.getRow(0)!.data.status).toBe("draft");
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    it("commits radio change when validation passes", async () => {
      const rows: Row[] = [{ data: { id: 1, status: "draft" } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "status",
          title: "Status",
          width: 120,
          type: "radio" as CellType,
          render: (_value, row) => ({
            type: "radio" as CellType,
            radio: { value: row.data.status as string, options: RADIO_OPTIONS },
          }),
          validate: () => true,
        },
      ];
      const table = new CanvasTable(container, { rows, columns });
      await flushPromises();

      getEventEmitter(table).emit("radioChange", makeCellInfo(table, 0, "status"), "review");
      await flushPromises();

      expect(table.getRow(0)!.data.status).toBe("review");
      expect(table.getValidationErrors()).toHaveLength(0);

      table.destroy();
    });

    // ─── switch ───

    it("blocks switch change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, enabled: false } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "enabled",
          title: "Enabled",
          width: 100,
          type: "switch" as CellType,
          render: (_value, row) => ({
            type: "switch" as CellType,
            switch: { checked: row.data.enabled as boolean },
          }),
          validate: (value) => value !== true || "Cannot enable",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("switchChange", makeCellInfo(table, 0, "enabled"), true);
      await flushPromises();

      expect(table.getRow(0)!.data.enabled).toBe(false);
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    // ─── select ───

    it("blocks select change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, role: "user" } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "role",
          title: "Role",
          width: 120,
          type: "select" as CellType,
          render: (_value, row) => ({
            type: "select" as CellType,
            select: { value: row.data.role as string, options: SELECT_OPTIONS },
          }),
          validate: (value) => value !== "admin" || "Cannot set admin role",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("selectChange", makeCellInfo(table, 0, "role"), "admin");
      await flushPromises();

      expect(table.getRow(0)!.data.role).toBe("user");
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    it("commits select change when validation passes", async () => {
      const rows: Row[] = [{ data: { id: 1, role: "user" } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "role",
          title: "Role",
          width: 120,
          type: "select" as CellType,
          render: (_value, row) => ({
            type: "select" as CellType,
            select: { value: row.data.role as string, options: SELECT_OPTIONS },
          }),
          validate: () => true,
        },
      ];
      const table = new CanvasTable(container, { rows, columns });
      await flushPromises();

      getEventEmitter(table).emit("selectChange", makeCellInfo(table, 0, "role"), "editor");
      await flushPromises();

      expect(table.getRow(0)!.data.role).toBe("editor");
      expect(table.getValidationErrors()).toHaveLength(0);

      table.destroy();
    });

    // ─── tags ───

    it("blocks tags change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, tags: [] as string[] } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "tags",
          title: "Tags",
          width: 160,
          type: "tag" as CellType,
          render: (_value, row) => ({
            type: "tag" as CellType,
            tags: { tags: (row.data.tags as string[]).map((t) => ({ text: t })) },
          }),
          validate: (value) => (Array.isArray(value) && value.length <= 2) || "Max 2 tags",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("tagsChange", makeCellInfo(table, 0, "tags"), ["a", "b", "c"], true);
      await flushPromises();

      expect(table.getRow(0)!.data.tags).toEqual([]);
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    // ─── date ───

    it("blocks date select when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, date: "2024-01-01" } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "date",
          title: "Date",
          width: 140,
          type: "date" as CellType,
          render: (_value, row) => ({
            type: "date" as CellType,
            date: { value: row.data.date as string },
          }),
          validate: (value) => {
            const d = new Date(value as string);
            return d.getFullYear() >= 2025 || "Date must be 2025 or later";
          },
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("dateSelect", makeCellInfo(table, 0, "date"), "2024-06-01");
      await flushPromises();

      expect(table.getRow(0)!.data.date).toBe("2024-01-01");
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    // ─── color ───

    it("blocks color change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, color: "#ff0000" } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "color",
          title: "Color",
          width: 100,
          type: "color" as CellType,
          render: (_value, row) => ({
            type: "color" as CellType,
            color: { value: row.data.color as string },
          }),
          validate: (value) => value !== "#0000ff" || "Blue is not allowed",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("colorChange", makeCellInfo(table, 0, "color"), "#0000ff");
      await flushPromises();

      expect(table.getRow(0)!.data.color).toBe("#ff0000");
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    // ─── rating ───

    it("blocks rating change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, score: 3 } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "score",
          title: "Score",
          width: 120,
          type: "rating" as CellType,
          render: (_value, row) => ({
            type: "rating" as CellType,
            rating: { value: row.data.score as number, max: 5 },
          }),
          validate: (value) => Number(value) >= 1 || "Score must be ≥ 1",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("ratingChange", makeCellInfo(table, 0, "score"), 0);
      await flushPromises();

      expect(table.getRow(0)!.data.score).toBe(3);
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    // ─── progress ───

    it("blocks progress change when validation fails", async () => {
      const rows: Row[] = [{ data: { id: 1, progress: 50 } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "progress",
          title: "Progress",
          width: 160,
          type: "progress" as CellType,
          render: (_value, row) => ({
            type: "progress" as CellType,
            progress: { value: row.data.progress as number, interactive: true },
          }),
          validate: (value) => Number(value) <= 100 || "Progress cannot exceed 100%",
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      getEventEmitter(table).emit("progressChange", makeCellInfo(table, 0, "progress"), 150);
      await flushPromises();

      expect(table.getRow(0)!.data.progress).toBe(50);
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    // ─── 先失败后成功清除 error ───

    it("clears validation error after subsequent valid commit via checkbox", async () => {
      const rows: Row[] = [{ data: { id: 1, active: false } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "active",
          title: "Active",
          width: 80,
          type: "checkbox" as CellType,
          render: (_value, row) => ({
            type: "checkbox" as CellType,
            checkbox: { checked: row.data.active as boolean },
          }),
          validate: (value) => value === true ? "Not allowed" : true,
        },
      ];
      const table = new CanvasTable(container, { rows, columns });
      await flushPromises();

      // 第一次：校验失败
      getEventEmitter(table).emit("checkboxChange", makeCellInfo(table, 0, "active"), true);
      await flushPromises();
      expect(table.getRow(0)!.data.active).toBe(false);
      expect(table.getValidationErrors()).toHaveLength(1);

      // 第二次：校验通过
      getEventEmitter(table).emit("checkboxChange", makeCellInfo(table, 0, "active"), false);
      await flushPromises();
      expect(table.getRow(0)!.data.active).toBe(false);
      expect(table.getValidationErrors()).toHaveLength(0);

      table.destroy();
    });

    // ─── callback 调用时机 ───

    it("calls onCheckboxChange only when validation passes", async () => {
      const onCheckboxChange = jest.fn();
      const rows: Row[] = [{ data: { id: 1, active: false } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "active",
          title: "Active",
          width: 80,
          type: "checkbox" as CellType,
          render: (_value, row) => ({
            type: "checkbox" as CellType,
            checkbox: { checked: row.data.active as boolean },
          }),
          validate: (value) => value !== true || "Cannot activate",
        },
      ];
      const table = new CanvasTable(container, { rows, columns, onCheckboxChange });
      await flushPromises();

      getEventEmitter(table).emit("checkboxChange", makeCellInfo(table, 0, "active"), true);
      await flushPromises();
      expect(onCheckboxChange).not.toHaveBeenCalled();

      getEventEmitter(table).emit("checkboxChange", makeCellInfo(table, 0, "active"), false);
      await flushPromises();
      expect(onCheckboxChange).toHaveBeenCalledTimes(1);
      expect(onCheckboxChange).toHaveBeenCalledWith(
        expect.objectContaining({ rowIndex: 0, columnIndex: 1 }),
        false,
      );

      table.destroy();
    });

    it("calls onSelectChange only when validation passes", async () => {
      const onSelectChange = jest.fn();
      const rows: Row[] = [{ data: { id: 1, role: "user" } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "role",
          title: "Role",
          width: 120,
          type: "select" as CellType,
          render: (_value, row) => ({
            type: "select" as CellType,
            select: { value: row.data.role as string, options: SELECT_OPTIONS },
          }),
          validate: (value) => value !== "admin" || "Cannot set admin",
        },
      ];
      const table = new CanvasTable(container, { rows, columns, onSelectChange });
      await flushPromises();

      getEventEmitter(table).emit("selectChange", makeCellInfo(table, 0, "role"), "admin");
      await flushPromises();
      expect(onSelectChange).not.toHaveBeenCalled();

      getEventEmitter(table).emit("selectChange", makeCellInfo(table, 0, "role"), "user");
      await flushPromises();
      expect(onSelectChange).toHaveBeenCalledTimes(1);

      table.destroy();
    });

    // ─── async 校验 for 交互式编辑器 ───

    it("blocks interactive commit during async validation and resolves after completion", async () => {
      const rows: Row[] = [{ data: { id: 1, active: false } }];
      let resolveValidation: (result: string) => void;
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "active",
          title: "Active",
          width: 80,
          type: "checkbox" as CellType,
          render: (_value, row) => ({
            type: "checkbox" as CellType,
            checkbox: { checked: row.data.active as boolean },
          }),
          validate: async () => {
            return await new Promise<string>((r) => { resolveValidation = r; });
          },
        },
      ];
      const validationErrors: ValidationError[] = [];
      const table = new CanvasTable(container, {
        rows, columns,
        onValidationError: (error) => validationErrors.push(error),
      });
      await flushPromises();

      // 触发 checkbox 事件（async 校验开始）
      getEventEmitter(table).emit("checkboxChange", makeCellInfo(table, 0, "active"), true);
      await flushPromises();

      expect(table.getRow(0)!.data.active).toBe(false);

      // resolve 校验为失败
      resolveValidation!("Cannot activate");
      await flushPromises();

      expect(table.getRow(0)!.data.active).toBe(false);
      expect(table.getValidationErrors()).toHaveLength(1);

      table.destroy();
    });

    // ─── clearValidationErrors ───

    it("clearValidationErrors removes all stored errors", async () => {
      const rows: Row[] = [{ data: { id: 1, salary: 100, age: 30 } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "salary",
          title: "Salary",
          width: 120,
          validate: (value) => Number(value) >= 0 || "Salary must be ≥ 0",
        },
        {
          key: "age",
          title: "Age",
          width: 80,
          validate: (value) => Number(value) >= 18 || "Age must be ≥ 18",
        },
      ];
      const table = new CanvasTable(container, { rows, columns });
      await flushPromises();

      await table.updateCell(0, "salary", -1);
      await table.updateCell(0, "age", 10);

      expect(table.getValidationErrors()).toHaveLength(2);

      table.clearValidationErrors();
      expect(table.getValidationErrors()).toHaveLength(0);

      table.destroy();
    });
  });

  // ─── 进度条拖拽闪回 ───

  describe("progress drag display value", () => {
    const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

    it("keeps the dragged value until the async validation commit resolves", async () => {
      const rows: Row[] = [{ id: "row-1", data: { id: 1, volume: 50 } }];
      const columns: Column[] = [
        { key: "id", title: "ID", width: 80 },
        {
          key: "volume",
          title: "Volume",
          width: 100,
          validate: async () => {
            await sleep(50);
            return true;
          },
          render: (value) => ({
            type: "progress" as CellType,
            progress: { value: Number(value ?? 0), interactive: true, shape: "line" },
          }),
        },
      ];

      const table = new CanvasTable(container, { rows, columns });
      await flushPromises();
      await flushRender();

      const internals = table as unknown as {
        interactionManager: {
          getInteractionState: () => {
            progressDragState?: { displayValue: number; pendingValue?: number };
          };
        };
        layoutManager: {
          getCellPosition: (
            row: number,
            col: number,
          ) => { x: number; y: number; width: number; height: number };
          getCellViewportY: (row: number, scrollTop: number) => number;
        };
      };
      const interactionManager = internals.interactionManager;

      const canvas = container.querySelector("canvas") as HTMLCanvasElement;
      const cellPos = internals.layoutManager.getCellPosition(0, 1);
      const barWidth = cellPos.width - 16 - 40;
      const point = (percent: number) => ({
        clientX: cellPos.x + 8 + (barWidth * percent) / 100,
        clientY: internals.layoutManager.getCellViewportY(0, 0) + cellPos.height / 2,
      });
      const dispatch = (type: string, p: { clientX: number; clientY: number }): boolean =>
        canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...p }));

      // 从 50 拖到 70 后抬起
      dispatch("mousedown", point(50));
      dispatch("mousemove", point(70));
      dispatch("mouseup", point(70));

      // 异步校验尚未完成：临时显示值必须保留，否则期间重渲染会闪回旧值 50
      expect(interactionManager.getInteractionState().progressDragState?.displayValue).toBe(70);

      await sleep(20);
      expect(interactionManager.getInteractionState().progressDragState?.displayValue).toBe(70);

      // 校验提交完成后清除临时显示值，改由数据接管
      await sleep(120);
      expect(interactionManager.getInteractionState().progressDragState).toBeUndefined();
      expect(table.getRow(0)!.data.volume).toBe(70);

      table.destroy();
    });
  });
});