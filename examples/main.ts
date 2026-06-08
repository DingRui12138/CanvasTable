import { CanvasTable } from "../src";
import type {
  Column,
  Row,
  CellType,
  CellMerge,
  TagItem,
  CustomRenderContext,
  LocalePreset,
} from "../src/types";
import { getFPSMonitor } from "./FPSMonitor";

type ExampleWindow = typeof window & {
  table?: CanvasTable;
  lastRowHeightChange?: {
    rowName: string;
    newHeight: number;
    rowIndex: number;
  };
};

// 创建 Web Worker 用于数据生成
const dataWorker = new Worker(new URL("./dataWorker.ts", import.meta.url), {
  type: "module",
});

// 当前活跃的 CanvasTable 实例（用于调用 showLoading/hideLoading）

// 渲染耗时提示工具
const renderToast = {
  element: document.getElementById("renderToast"),
  createTimeSpan: document.getElementById("createTime"),
  renderTimeSpan: document.getElementById("renderTime"),
  timeout: null as number | null,

  show(createTime: number, renderTime: number) {
    if (!this.element || !this.createTimeSpan || !this.renderTimeSpan) return;

    // 清除之前的 timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.createTimeSpan.textContent = `${createTime.toFixed(2)}ms`;
    this.renderTimeSpan.textContent = `${renderTime.toFixed(2)}ms`;

    this.element.classList.add("show");

    // 3秒后隐藏
    this.timeout = window.setTimeout(() => {
      this.hide();
    }, 3000);
  },

  hide() {
    if (!this.element) return;
    this.element.classList.remove("show");
  },
};

// Worker 消息处理
interface WorkerResponse {
  type: "data" | "error";
  data?: { rows: Row[]; columns: Column[] };
  error?: string;
  workerCreateTime?: number; // Worker 内部生成时间
  isHierarchical?: boolean;
}

let pendingWorkerRequest: {
  table: CanvasTable;
  label: string;
  isHierarchical: boolean;
  sendTime: number; // 主线程发送消息的时间
  resolve?: (rows: Row[]) => void;
} | null = null;

dataWorker.onmessage = function (e: MessageEvent<WorkerResponse>) {
  const { type, data, error, workerCreateTime } = e.data;

  if (type === "error") {
    if (pendingWorkerRequest?.table) {
      pendingWorkerRequest.table.hideLoading();
    }
    console.error("Worker error:", error);
    pendingWorkerRequest = null;
    return;
  }

  if (!pendingWorkerRequest || !data) {
    if (pendingWorkerRequest?.table) {
      pendingWorkerRequest.table.hideLoading();
    }
    return;
  }

  const { table, label, isHierarchical, sendTime } = pendingWorkerRequest;

  // 计算完整的"创建数据"时间：从发送消息到收到消息
  // 包含：Worker生成时间 + 序列化时间 + 反序列化时间 + 通信开销
  const totalTime = performance.now() - sendTime;

  // Worker 返回的 columns 不含 formatter，使用主线程定义的完整 columns
  // 对于层级数据，使用 Worker 返回的 columns（不需要特殊 formatter）
  const finalRows = data.rows;
  if (!isHierarchical) {
    // 使用主线程预定义的完整 columns
    table.setColumns(columns);
  } else {
    table.setColumns(data.columns);
  }

  // 测量渲染耗时
  console.time(label);
  const renderStart = performance.now();
  table.setRows(finalRows);
  const renderTime = performance.now() - renderStart;
  console.timeEnd(label);

  table.hideLoading();

  // 显示耗时：totalTime 包含了 Worker 生成 + 序列化/反序列化 + 传输
  renderToast.show(totalTime, renderTime);
  console.log(
    `${label} - 数据准备(含传输): ${totalTime.toFixed(2)}ms, Worker内部: ${(workerCreateTime ?? 0).toFixed(2)}ms, 渲染: ${renderTime.toFixed(2)}ms`,
  );

  // resolve promise
  if (pendingWorkerRequest.resolve) {
    pendingWorkerRequest.resolve(finalRows);
  }

  pendingWorkerRequest = null;
};

// 通过 Worker 生成数据（异步，不阻塞主线程）
function setRowsWithWorker(
  table: CanvasTable,
  messageType: "generate" | "generateHierarchical",
  count?: number,
  label?: string,
): Promise<Row[]> {
  return new Promise((resolve) => {
    const isHierarchical = messageType === "generateHierarchical";
    const sendTime = performance.now(); // 记录发送时间

    pendingWorkerRequest = {
      table,
      label: label ?? `Load ${count ?? "hierarchical"} rows`,
      isHierarchical,
      sendTime,
      resolve,
    };

    table.showLoading(
      `生成 ${count ? `${count.toLocaleString()} 行数据` : "层级数据"}中...`,
    );

    dataWorker.postMessage({
      type: messageType,
      count,
      seed: DATA_SEED,
    });
  });
}

// 同步方式测量创建数据和渲染耗时（用于小数据量）
function setRowsWithMeasure(
  table: CanvasTable,
  rowsFn: () => Row[],
  label: string,
) {
  // 测量创建数据耗时
  const createStart = performance.now();
  const rows = rowsFn();
  const createTime = performance.now() - createStart;

  // 测量渲染耗时
  console.time(label);
  const renderStart = performance.now();
  table.setRows(rows);
  const renderTime = performance.now() - renderStart;
  console.timeEnd(label);

  // 显示两个耗时
  renderToast.show(createTime, renderTime);
  console.log(
    `${label} - 创建: ${createTime.toFixed(2)}ms, 渲染: ${renderTime.toFixed(2)}ms`,
  );
}

const DATA_SEED = 12345;

function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateData(count: number, seed: number = DATA_SEED): Row[] {
  const random = createSeededRandom(seed);
  const firstNames = [
    "张",
    "李",
    "王",
    "刘",
    "陈",
    "杨",
    "赵",
    "黄",
    "周",
    "吴",
  ];
  const lastNames = [
    "伟",
    "芳",
    "娜",
    "敏",
    "静",
    "丽",
    "强",
    "磊",
    "军",
    "洋",
  ];
  const departments = ["技术部", "市场部", "销售部", "人事部", "财务部"];
  const statuses = ["active", "inactive", "pending"];
  const skillOptions = [
    "JavaScript",
    "TypeScript",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "Python",
    "Java",
    "Go",
    "Rust",
    "Docker",
    "Kubernetes",
  ];
  const levelOptions = ["junior", "middle", "senior", "expert"];

  const rows: Row[] = [];
  let mergeBlockedUntil = -1;
  for (let i = 0; i < count; i++) {
    const cellMerges: CellMerge[] = [];

    // 使用种子随机数决定是否合并单元格。
    // 一旦当前行启动了 2 行合并，下一行就不能再次启动同列合并，否则会产生重叠 merge。
    if (i > mergeBlockedUntil && random() > 0.8 && i + 1 < count) {
      cellMerges.push({
        rowIndex: i,
        columnIndex: 2,
        rowspan: 2,
        colspan: 1,
      });
      mergeBlockedUntil = i + 1;
    }

    // 直接计算各项值（使用种子随机数）
    const selected = random() > 0.67;
    const radioValue = ["high", "medium", "low"][Math.floor(random() * 3)]!;
    const level = levelOptions[Math.floor(random() * levelOptions.length)]!;
    const enabled = random() > 0.5;

    const roleOptions = ["admin", "editor", "viewer", "developer"];
    const numRoles = Math.floor(random() * 3) + 1;
    const roles: string[] = [];
    for (let r = 0; r < numRoles; r++) {
      const role = roleOptions[Math.floor(random() * roleOptions.length)]!;
      if (!roles.includes(role)) {
        roles.push(role);
      }
    }

    const numSkills = Math.floor(random() * 10) + 1;
    const skills: string[] = [];
    for (let j = 0; j < numSkills; j++) {
      const skill = skillOptions[Math.floor(random() * skillOptions.length)]!;
      if (!skills.includes(skill)) {
        skills.push(skill);
      }
    }

    // 生成姓名，用于生成邮箱
    const name =
      firstNames[Math.floor(random() * firstNames.length)] +
      lastNames[Math.floor(random() * lastNames.length)];
    const email = `${name.toLowerCase()}@example.com`;
    const website = `https://example.com/users/${i + 1}`;

    rows.push({
      data: {
        id: i + 1,
        name,
        email,
        website,
        secretCode: `CODE-${Math.floor(random() * 10000)
          .toString()
          .padStart(4, "0")}`, // 隐藏列数据
        age: Math.floor(random() * 40) + 20,
        department: departments[Math.floor(random() * departments.length)],
        salary: Math.floor(random() * 50000) + 10000,
        bonus: Math.floor(random() * 10000),
        joinDate: new Date(
          2020 + Math.floor(random() * 4),
          Math.floor(random() * 12),
          Math.floor(random() * 28) + 1,
        )
          .toISOString()
          .split("T")[0],
        status: statuses[Math.floor(random() * statuses.length)],
        score: Math.floor(random() * 100),
        priority: ["high", "medium", "low"][Math.floor(random() * 3)]!,
        selected,
        radioValue,
        level,
        roles,
        skills,
        enabled,
        rowIndex: i, // 用于测试 disabled
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`,
        photos: Array.from({ length: Math.floor(random() * 5) + 1 }).map(
          (_, idx) => {
            return `https://picsum.photos/seed/${i}-${idx}/100/100`;
          },
        ),
        // 进度条数据
        progress: Math.floor(random() * 100),
        taskProgress: Math.floor(random() * 100),
        completionRate: Math.floor(random() * 100),
        // 测试超出范围的进度值（使用种子随机数，但第一行强制150，第二行强制-20）
        progressOverflow: Math.floor(random() * 100),
        dashboard: Math.floor(random() * 100),
        volume: Math.floor(random() * 100),
        // 评分数据
        rating: Math.floor(random() * 10) / 2, // 0-5，支持半星
        // 颜色数据
        color: [
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
        ][Math.floor(random() * 20)],
        // [
        //   `https://picsum.photos/seed/${i}-1/100/100`,
        //   `https://picsum.photos/seed/${i}-2/100/100`,
        //   `https://picsum.photos/seed/${i}-3/100/100`,
        //   `https://picsum.photos/seed/${i}-4/100/100`,
        //   `https://picsum.photos/seed/${i}-5/100/100`,
        //
        // ].slice(0, Math.floor(random() * 50) + 1),
        remark: `备注-${
          i + 1
        }：这是一段较长的备注信息，用于测试多行输入功能，可以自动换行显示更多内容。第${
          i + 1
        }行数据。`,
      },
      cellMerges: cellMerges.length > 0 ? cellMerges : undefined,
    });
  }

  return rows;
}

const avatarColors = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#ff4d4f",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
  "#a0d911",
  "#2f54eb",
];

function renderAvatarName(name: string, context: CustomRenderContext): void {
  const { ctx, x, y, width, height, padding, theme } = context;

  const avatarSize = 20;
  const avatarX = x + padding;
  const avatarY = y + (height - avatarSize) / 2;

  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex]!;

  ctx.beginPath();
  ctx.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = avatarColor;
  ctx.fill();

  const firstChar = name.charAt(0);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${avatarSize * 0.5}px ${theme.font.family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(firstChar, avatarX + avatarSize / 2, avatarY + avatarSize / 2);

  const textX = avatarX + avatarSize + 8;
  const textMaxWidth = width - avatarSize - padding * 2 - 8;

  ctx.fillStyle = theme.colors.cellText;
  ctx.font = `${theme.font.size}px ${theme.font.family}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  let displayName = name;
  if (ctx.measureText(name).width > textMaxWidth) {
    while (
      ctx.measureText(displayName + "...").width > textMaxWidth &&
      displayName.length > 0
    ) {
      displayName = displayName.slice(0, -1);
    }
    displayName += "...";
  }

  ctx.fillText(displayName, textX, y + height / 2);
}

const isRowDisabled = (row: Row) => row.data.id === 1 || row.data.id === 2;

const columns: Column[] = [
  {
    key: "selected",
    title: "选择",
    width: 60,
    type: "checkbox",
    align: "center",
    fixed: "left",
    sortable: false,
    filterable: true,
    disabled: isRowDisabled,
    render: (_value, row) => ({
      type: "checkbox" as CellType,
      checkbox: {
        checked: row.data.selected as boolean,
      },
    }),
  },
  {
    key: "id",
    title: "ID",
    width: 60,
    type: "number",
    sortable: true,
    filterable: true,
    fixed: "left",
    disabled: isRowDisabled,
  },
  {
    key: "name",
    title: "姓名",
    width: 140,
    sortable: true,
    filterable: true,
    editable: true,
    fixed: "left",
    disabled: isRowDisabled,
    validate: (value) => {
      const name = String(value).trim();
      if (!name) return "姓名不能为空";
      if (name.length > 20) return "姓名不能超过 20 个字符";
      return true;
    },
    render: (value) => ({
      type: "custom" as CellType,
      customRender: (context: CustomRenderContext) => {
        renderAvatarName(String(value), context);
      },
    }),
  },
  {
    key: "secretCode",
    title: "暗号",
    width: 100,
    sortable: true,
    editable: true,
    hidden: true, // 默认隐藏
  },
  {
    key: "avatar",
    title: "头像",
    width: 80,
    align: "center",
    fixed: "left",
    editable: true,
    disabled: isRowDisabled,
    render: (_value, row) => ({
      type: "image" as CellType,
      image: {
        src: row.data.avatar as string,
        width: 24,
        height: 24,
        circle: true,
        clickable: true,
        hoverable: true,
        accept: "image/*",
        multiple: false,
        onUpload: async (file: File) => {
          console.log("上传头像:", file.name);
          await new Promise((resolve) => setTimeout(resolve, 500));
          const randomId = Math.random().toString(36).substring(7);
          return `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}`;
        },
      },
    }),
  },
  {
    key: "photos",
    title: "相册",
    width: 180,
    align: "center",
    editable: true,
    disabled: isRowDisabled,
    render: (_value, row) => ({
      type: "image" as CellType,
      image: {
        images: row.data.photos as string[],
        width: 32,
        height: 32,
        scaleWithRowHeight: false,
        borderRadius: 4,
        gap: 4,
        maxCount: 9,
        clickable: true,
        hoverable: true,
        accept: "image/*",
        multiple: true,
        // 自定义上传处理函数
        // 返回 Promise<string>，其中 string 是上传后的图片 URL
        onUpload: async (file: File) => {
          console.log("上传文件:", file.name, file.type, file.size);

          // 模拟上传延迟
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 实际项目中，这里应该是真实的上传逻辑，例如：
          // const formData = new FormData();
          // formData.append('file', file);
          // const response = await fetch('/api/upload', {
          //   method: 'POST',
          //   body: formData,
          // });
          // const data = await response.json();
          // return data.url;

          // 这里使用随机图片 URL 模拟上传结果
          const randomId = Math.random().toString(36).substring(7);
          return `https://picsum.photos/seed/${randomId}/100/100`;
        },
      },
    }),
  },
  {
    key: "basicInfo",
    title: "基本信息",
    children: [
      {
        key: "age",
        title: "年龄",
        width: 60,
        type: "number",
        sortable: true,
        filterable: true,
        editable: true,
        align: "center",
        disabled: isRowDisabled,
        validate: (value) => {
          const age = Number(value);
          if (!Number.isFinite(age)) return "年龄必须是数字";
          if (age < 18) return "年龄不能小于 18";
          if (age > 60) return "年龄不能大于 60";
          if (age >= 50) {
            return {
              valid: true,
              level: "warning",
              message: "年龄在 50-60 之间，请确认是否符合入库要求",
            };
          }
          return true;
        },
      },
      {
        key: "department",
        title: "部门",
        width: 100,
        sortable: true,
        filterable: true,
        editable: true,
        disabled: isRowDisabled,
        editRender: () => ({
          type: "select",
          select: {
            options: [
              { label: "技术部", value: "技术部" },
              { label: "市场部", value: "市场部" },
              { label: "销售部", value: "销售部" },
              { label: "人事部", value: "人事部" },
              { label: "财务部", value: "财务部" },
            ],
          },
        }),
        validate: (value) => {
          const validDepartments = [
            "技术部",
            "市场部",
            "销售部",
            "人事部",
            "财务部",
          ];
          if (!validDepartments.includes(String(value)))
            return "部门必须是预选选项之一";
          return true;
        },
      },
    ],
  },
  {
    key: "joinDate",
    title: "入职日期",
    width: 120,
    type: "date",
    sortable: true,
    filterable: true,
    disabled: isRowDisabled,
    render: (value) => ({
      type: "date" as CellType,
      date: {
        value: value as string,
        format: "YYYY-MM-DD",
      },
    }),
  },
  {
    key: "email",
    title: "邮箱",
    width: 180,
    type: "link",
    filterable: true,
    editable: true,
    disabled: isRowDisabled,
    validate: async (value) => {
      const email = String(value);
      if (!email.includes("@")) return "邮箱格式不正确，必须包含 @";
      // 模拟异步远程校验：检查邮箱是否已被注册
      await new Promise((r) => setTimeout(r, 300));
      if (email.endsWith("@example.com")) return "该邮箱后缀已被占用";
      return true;
    },
    render: (value) => ({
      type: "link" as CellType,
      link: {
        text: value as string,
        link: `mailto:${value}`,
      },
    }),
  },
  {
    key: "website",
    title: "个人主页",
    width: 150,
    type: "link",
    filterable: true,
    disabled: isRowDisabled,
    render: (value) => ({
      type: "link" as CellType,
      link: {
        text: value as string,
        link: value as string,
      },
    }),
  },

  {
    key: "income",
    title: "收入信息",
    children: [
      {
        key: "salary",
        title: "基本薪资",
        width: 100,
        type: "number",
        sortable: true,
        filterable: true,
        editable: true,
        disabled: isRowDisabled,
        formatter: (value) => "¥" + (value as number).toLocaleString(),
        validate: (value) => {
          const salary = Number(value);
          if (!Number.isFinite(salary)) return "薪资必须是数字";
          if (salary < 0) return "薪资不能小于 0";
          if (salary > 1000000) return "薪资不能超过 100 万";
          return true;
        },
      },
      {
        key: "bonus",
        title: "奖金",
        width: 80,
        type: "number",
        sortable: true,
        filterable: true,
        editable: true,
        disabled: isRowDisabled,
        formatter: (value) => "¥" + (value as number).toLocaleString(),
        validate: async (value) => {
          const bonus = Number(value);
          if (!Number.isFinite(bonus)) return "奖金必须是数字";
          if (bonus < 0) return "奖金不能小于 0";
          // 模拟异步远程校验：检查奖金是否超过公司上限
          await new Promise((r) => setTimeout(r, 500));
          if (bonus > 50000) {
            return {
              valid: false,
              level: "warning",
              message: `奖金 ¥${bonus.toLocaleString()} 超过公司上限 ¥50,000，请确认`,
            };
          }
          return true;
        },
      },
    ],
  },
  {
    key: "status",
    title: "状态",
    width: 100,
    type: "tag",
    sortable: true,
    filterable: true,
    disabled: isRowDisabled,
    render: (value) => {
      const statusOptions = [
        { text: "在职", value: "active", bgColor: "#52c41a", color: "#fff" },
        { text: "离职", value: "inactive", bgColor: "#ff4d4f", color: "#fff" },
        { text: "待定", value: "pending", bgColor: "#faad14", color: "#fff" },
      ];
      const currentValue = value as string;
      const currentOption = statusOptions.find(
        (opt) => opt.value === currentValue,
      );

      return {
        type: "tag" as CellType,
        tags: {
          tags: currentOption
            ? [currentOption]
            : [{ text: String(value), value: currentValue }],
          editable: true,
          options: statusOptions,
          selectedValues: [currentValue],
          multiple: false,
        },
      };
    },
  },

  {
    key: "priority-radio",
    field: "priority",
    title: "优先级(单选)",
    width: 200,
    type: "radio",
    align: "left",
    filterable: true,
    disabled: isRowDisabled,
    validate: (value) => {
      if (!value) return "请选择优先级";
      return true;
    },
    render: (_value, row) => ({
      type: "radio" as CellType,
      radio: {
        value: row.data.priority as string,
        options: [
          { label: "高", value: "high" },
          { label: "中", value: "medium" },
          { label: "低", value: "low" },
        ],
      },
    }),
  },

  {
    key: "priority-display",
    field: "priority",
    title: "优先级(展示)",
    width: 100,
    align: "center",
    editable: true,
    disabled: isRowDisabled,
    validate: (value) => {
      const validValues = ["high", "medium", "low"];
      if (!validValues.includes(String(value))) return "优先级必须是高/中/低";
      return true;
    },
    // 自定义渲染：显示图标 + 文字
    render: (value) => {
      const priorityConfig: Record<
        string,
        { icon: string; color: string; text: string }
      > = {
        high: { icon: "🔴", color: "#ff4d4f", text: "高" },
        medium: { icon: "🟡", color: "#faad14", text: "中" },
        low: { icon: "🟢", color: "#52c41a", text: "低" },
      };
      const config = priorityConfig[value as string] || priorityConfig.medium!;
      return {
        type: "custom" as CellType,
        customRender: (context) => {
          const { ctx, x, y, width, height, theme } = context;
          ctx.fillStyle = theme.colors.cellText;
          ctx.font = `${theme.font.size}px ${theme.font.family}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            `${config.icon} ${config.text}`,
            x + width / 2,
            y + height / 2,
          );
        },
      };
    },
    // 编辑时使用 select 下拉框
    editRender: () => ({
      type: "select",
      select: {
        options: [
          { label: "🔴 高", value: "high" },
          { label: "🟡 中", value: "medium" },
          { label: "🟢 低", value: "low" },
        ],
      },
    }),
  },

  {
    key: "progress",
    type: "progress" as CellType,
    title: "进度",
    width: 120,
    align: "center",
    filterable: true,
    editable: true,
    disabled: isRowDisabled,
    validate: (value) => {
      const v = Number(value);
      if (!Number.isFinite(v)) return "进度必须是数字";
      if (v < 0) return "进度不能小于 0";
      if (v > 100) return "进度不能超过 100";
      return true;
    },
    render: (value) => ({
      type: "progress" as CellType,
      progress: {
        value: value as number,
        shape: "line",
        size: "large",
        showText: true,
        textPosition: "right",
        color: "#ff4d4f",
      },
    }),
  },
  {
    key: "taskProgress",
    type: "progress" as CellType,
    title: "任务进度",
    width: 150,
    align: "center",
    disabled: isRowDisabled,
    render: (value) => ({
      type: "progress" as CellType,
      progress: {
        value: value as number,
        shape: "line",
        size: "large",
        showText: true,
        textPosition: "inside",
        color: [
          { value: 0, color: "#ff4d4f" },
          { value: 30, color: "#ff4d4f" },
          { value: 50, color: "#faad14" },
          { value: 80, color: "#1890ff" },
          { value: 100, color: "#52c41a" },
        ],
      },
    }),
  },
  {
    key: "completionRate",
    type: "progress" as CellType,
    title: "完成率",
    width: 80,
    align: "center",
    disabled: isRowDisabled,
    render: (value) => ({
      type: "progress" as CellType,
      progress: {
        value: value as number,
        shape: "circle",
        size: "small",
        showText: true,
        format: (v) => `${Math.round(v)}%`,
        color: (v) => (v < 30 ? "#ff4d4f" : v < 70 ? "#faad14" : "#52c41a"),
      },
    }),
  },
  {
    key: "dashboard",
    title: "仪表盘",
    width: 100,
    disabled: isRowDisabled,
    render: (value) => ({
      type: "progress",
      progress: {
        value: (value ?? 0) as number,
        shape: "dashboard", // 仪表盘（半圆）
        size: "medium",
        status: "success", // normal | success | warning | error
      },
    }),
  },
  {
    key: "dashboardInteractive",
    title: "仪表盘(可调)",
    width: 100,
    disabled: isRowDisabled,
    validate: async (value) => {
      const v = Number(value ?? 0);
      // 模拟异步远程校验：仪表盘值超过 80 触发 warning
      await new Promise((r) => setTimeout(r, 200));
      if (v > 80) {
        return {
          valid: true,
          level: "warning",
          message: "仪表盘值超过 80%，请注意负载风险",
        };
      }
      return true;
    },
    render: (value) => ({
      type: "progress",
      progress: {
        value: (value ?? 0) as number,
        shape: "dashboard",
        interactive: true, // 可点击调整
      },
    }),
  },
  {
    key: "circleInteractive",
    title: "圆环(可调)",
    width: 80,
    disabled: isRowDisabled,
    validate: (value) => {
      const v = Number(value ?? 0);
      if (v < 0) return "圆环值不能小于 0";
      if (v > 100) return "圆环值不能超过 100";
      return true;
    },
    render: (value) => ({
      type: "progress",
      progress: {
        value: (value ?? 0) as number,
        shape: "circle",
        interactive: true, // 可点击调整
      },
    }),
  },
  {
    key: "progressOverflow",
    title: "溢出测试",
    width: 120,
    disabled: isRowDisabled,
    render: (value) => ({
      type: "progress",
      progress: {
        value: (value ?? 0) as number,
        shape: "line",
        showText: true,
      },
    }),
  },

  // 可交互进度条（点击调整）
  {
    key: "volume",
    title: "音量",
    width: 100,
    disabled: isRowDisabled,
    validate: async (value) => {
      const v = Number(value ?? 0);
      // 模拟异步远程校验：音量超过 80 时发出 warning
      await new Promise((r) => setTimeout(r, 150));
      if (v > 80) {
        return {
          valid: true,
          level: "warning",
          message: "音量超过 80%，长时间可能影响听力",
        };
      }
      return true;
    },
    render: (value) => ({
      type: "progress",
      progress: {
        value: (value ?? 0) as number,
        interactive: true, // 允许点击调整
        shape: "line",
      },
    }),
  },
  // 评分列
  {
    key: "rating",
    title: "评分",
    width: 120,
    type: "rating",
    align: "center",
    disabled: isRowDisabled,
    validate: (value) => {
      const v = Number(value ?? 0);
      if (v < 0) return "评分不能小于 0";
      if (v > 5) return "评分不能超过 5";
      if (v <= 1) {
        return {
          valid: true,
          level: "warning",
          message: "评分过低（≤1），请确认是否准确",
        };
      }
      return true;
    },
    render: (value) => ({
      type: "rating",
      rating: {
        value: (value ?? 0) as number,
        max: 5,
        starSize: 16,
        allowHalf: true,
        color: "#FFD700",
        inactiveColor: "#E0E0E0",
      },
    }),
  },
  // 颜色选择器列
  {
    key: "color",
    title: "颜色",
    width: 80,
    type: "color",
    align: "center",
    editable: true,
    filterable: true,
    disabled: isRowDisabled,
    render: (value) => ({
      type: "color",
      color: {
        value: (value as string) || "#1890ff",
      },
    }),
  },
  {
    key: "skills",
    title: "技能标签",
    width: 200,
    type: "tag",
    sortable: false,
    filterable: true,
    disabled: isRowDisabled,
    validate: (value) => {
      const skills = Array.isArray(value) ? value : [];
      if (skills.length > 10) return "技能标签最多选择 10 个";
      return true;
    },
    render: (value, row, column, rowIndex) => {
      if (!Array.isArray(value) && rowIndex === 0) {
        console.log("value is not an array:", value);
      }
      const skills = Array.isArray(value) ? value : [];
      const skillOptions = [
        "JavaScript",
        "TypeScript",
        "React",
        "Vue",
        "Angular",
        "Node.js",
        "Python",
        "Java",
        "Go",
        "Rust",
        "Docker",
        "Kubernetes",
      ];
      const tagColors: Record<string, { bgColor: string; color: string }> = {
        JavaScript: { bgColor: "#f7df1e", color: "#000" },
        TypeScript: { bgColor: "#3178c6", color: "#fff" },
        React: { bgColor: "#61dafb", color: "#000" },
        Vue: { bgColor: "#42b883", color: "#fff" },
        Angular: { bgColor: "#dd0031", color: "#fff" },
        "Node.js": { bgColor: "#68a063", color: "#fff" },
        Python: { bgColor: "#3776ab", color: "#ffd43b" },
        Java: { bgColor: "#007396", color: "#fff" },
        Go: { bgColor: "#00add8", color: "#fff" },
        Rust: { bgColor: "#dea584", color: "#000" },
        Docker: { bgColor: "#2496ed", color: "#fff" },
        Kubernetes: { bgColor: "#326ce5", color: "#fff" },
      };

      const tags: TagItem[] = skills.map((skill) => ({
        text: skill,
        value: skill,
        bgColor: tagColors[skill]?.bgColor ?? "#f0f0f0",
        color: tagColors[skill]?.color ?? "#333",
      }));

      const options: TagItem[] = skillOptions.map((skill) => ({
        text: skill,
        value: skill,
        bgColor: tagColors[skill]?.bgColor ?? "#f0f0f0",
        color: tagColors[skill]?.color ?? "#333",
      }));

      return {
        type: "tag" as CellType,
        tags: {
          tags,
          editable: true,
          options,
          selectedValues: skills,
          multiple: true,
          placeholder: "请选择技能标签",
        },
      };
    },
  },
  {
    key: "remark",
    title: "备注",
    width: 200,
    type: "input",
    align: "left",
    editable: true,
    disabled: isRowDisabled,
    render: (value) => ({
      type: "input" as CellType,
      input: {
        value: value as string,
        placeholder: "请输入备注",
        multiline: true,
        maxRows: 5,
      },
    }),
  },
  {
    key: "level",
    title: "级别(单选)",
    width: 120,
    type: "select",
    align: "left",
    filterable: true,
    disabled: isRowDisabled,
    render: (value) => ({
      type: "select" as CellType,
      select: {
        value: value as string,
        options: [
          { label: "初级", value: "junior" },
          { label: "中级", value: "middle" },
          { label: "高级", value: "senior" },
          { label: "专家", value: "expert" },
        ],
        placeholder: "请选择级别",
      },
    }),
  },
  {
    key: "roles",
    title: "角色(多选)",
    width: 160,
    type: "select",
    align: "left",
    filterable: true,
    disabled: isRowDisabled,
    render: (_value, row) => ({
      type: "select" as CellType,
      select: {
        value: row.data.roles as string[],
        multiple: true,
        options: [
          { label: "管理员", value: "admin" },
          { label: "编辑者", value: "editor" },
          { label: "查看者", value: "viewer" },
          { label: "开发者", value: "developer" },
        ],
        placeholder: "请选择角色",
      },
    }),
  },
  {
    key: "enabled",
    title: "启用",
    width: 80,
    type: "switch",
    align: "center",
    filterable: true,
    disabled: isRowDisabled,
    render: (_value, row) => ({
      type: "switch" as CellType,
      switch: {
        checked: row.data.enabled as boolean,
      },
    }),
  },
  {
    key: "actions",
    title: "操作",
    width: 200,
    type: "buttons",
    align: "center",
    fixed: "right",
    disabled: isRowDisabled,
    render: (_value, row) => {
      const rowIndex = (row.data.id as number) - 1;
      const isEven = rowIndex % 2 === 0;
      const isAdmin = (row.data as { role?: string }).role === "admin";

      const buttons = [
        {
          text: "查看",
          variant: "default" as const,
          actionKey: "view",
          visible: true,
        },
        {
          text: "编辑",
          variant: "primary" as const,
          actionKey: "edit",
          visible: true,
        },
        {
          text: "删除",
          variant: "danger" as const,
          actionKey: "delete",
          visible: isEven,
        },
        {
          text: "审核",
          variant: "warning" as const,
          actionKey: "audit",
          visible: isAdmin,
        },
        {
          text: "导出",
          variant: "link" as const,
          actionKey: "export",
          visible: rowIndex < 15,
        },
      ];

      return {
        type: "buttons" as CellType,
        buttons: {
          buttons,
          maxVisible: 2,
          moreButtonText: "更多",
          gap: 4,
        },
      };
    },
  },
  {
    key: "score",
    title: "评分",
    width: 60,
    type: "number",
    sortable: true,
    align: "center",
    fixed: "right",
    render: (value) => {
      let color = "#52c41a";
      const numValue = value as number;
      if (numValue < 60) color = "#ff4d4f";
      else if (numValue < 80) color = "#faad14";

      return {
        text: String(value),
        style: { color },
      };
    },
  },
];

function generateComplexColumns(): Column[] {
  return [
    { key: "id", title: "ID", width: 60, type: "number", fixed: "left" },
    {
      key: "personal",
      title: "个人信息",
      children: [
        {
          key: "name",
          title: "姓名",
          width: 100,
          children: [
            { key: "firstName", title: "姓", width: 50 },
            { key: "lastName", title: "名", width: 50 },
          ],
        },
        {
          key: "contact",
          title: "联系方式",
          children: [
            { key: "phone", title: "电话", width: 120 },
            { key: "email", title: "邮箱", width: 180 },
            {
              key: "address",
              title: "地址",
              children: [
                { key: "province", title: "省", width: 80 },
                { key: "city", title: "市", width: 80 },
                { key: "district", title: "区", width: 80 },
                { key: "street", title: "街道", width: 150 },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "employment",
      title: "就业信息",
      children: [
        {
          key: "job",
          title: "工作",
          children: [
            { key: "department", title: "部门", width: 100 },
            { key: "position", title: "职位", width: 100 },
            { key: "level", title: "级别", width: 80 },
          ],
        },
        {
          key: "compensation",
          title: "薪酬",
          children: [
            { key: "baseSalary", title: "基本工资", width: 100 },
            { key: "bonus", title: "奖金", width: 80 },
            { key: "stock", title: "股票", width: 80 },
            {
              key: "deductions",
              title: "扣款",
              children: [
                { key: "tax", title: "税", width: 80 },
                { key: "insurance", title: "社保", width: 80 },
                { key: "housing", title: "公积金", width: 80 },
              ],
            },
          ],
        },
        {
          key: "dates",
          title: "日期",
          children: [
            { key: "joinDate", title: "入职日期", width: 100 },
            { key: "probationEnd", title: "转正日期", width: 100 },
            { key: "contractEnd", title: "合同到期", width: 100 },
          ],
        },
      ],
    },
    {
      key: "performance",
      title: "绩效信息",
      children: [
        {
          key: "quarterly",
          title: "季度绩效",
          children: [
            { key: "q1", title: "Q1", width: 60 },
            { key: "q2", title: "Q2", width: 60 },
            { key: "q3", title: "Q3", width: 60 },
            { key: "q4", title: "Q4", width: 60 },
          ],
        },
        {
          key: "skills",
          title: "技能评估",
          children: [
            { key: "technical", title: "技术能力", width: 80 },
            { key: "communication", title: "沟通能力", width: 80 },
            { key: "leadership", title: "领导力", width: 80 },
            { key: "innovation", title: "创新力", width: 80 },
          ],
        },
      ],
    },
    {
      key: "sales",
      title: "销售情况",
      children: [
        {
          key: "sales-phone",
          title: "手机",
          children: [
            {
              key: "sales-phone-name",
              field: "name",
              title: "名称",
              width: 100,
            },
            {
              key: "sales-phone-sold",
              field: "soldQuantity",
              title: "售出数量",
              width: 90,
              type: "number",
            },
            {
              key: "sales-phone-amount",
              field: "amount",
              title: "金额",
              width: 100,
              type: "number",
            },
            {
              key: "sales-phone-stock",
              field: "stockQuantity",
              title: "库存数量",
              width: 90,
              type: "number",
            },
          ],
        },
        {
          key: "sales-laptop",
          title: "电脑",
          children: [
            {
              key: "sales-laptop-name",
              field: "name",
              title: "名称",
              width: 100,
            },
            {
              key: "sales-laptop-sold",
              field: "soldQuantity",
              title: "售出数量",
              width: 90,
              type: "number",
            },
            {
              key: "sales-laptop-amount",
              field: "amount",
              title: "金额",
              width: 100,
              type: "number",
            },
            {
              key: "sales-laptop-stock",
              field: "stockQuantity",
              title: "库存数量",
              width: 90,
              type: "number",
            },
          ],
        },
        {
          key: "sales-accessory",
          title: "配件",
          children: [
            {
              key: "sales-accessory-name",
              field: "name",
              title: "名称",
              width: 100,
            },
            {
              key: "sales-accessory-sold",
              field: "soldQuantity",
              title: "售出数量",
              width: 90,
              type: "number",
            },
            {
              key: "sales-accessory-amount",
              field: "amount",
              title: "金额",
              width: 100,
              type: "number",
            },
            {
              key: "sales-accessory-stock",
              field: "stockQuantity",
              title: "库存数量",
              width: 90,
              type: "number",
            },
          ],
        },
      ],
    },
    {
      key: "status",
      title: "状态",
      width: 80,
      fixed: "right",
    },
  ];
}

function generateComplexData(count: number, seed: number = DATA_SEED): Row[] {
  const random = createSeededRandom(seed);
  const provinces = [
    "北京",
    "上海",
    "广东",
    "江苏",
    "浙江",
    "四川",
    "湖北",
    "山东",
  ];
  const cities = [
    "北京",
    "上海",
    "广州",
    "深圳",
    "杭州",
    "成都",
    "武汉",
    "青岛",
  ];
  const departments = [
    "技术部",
    "产品部",
    "运营部",
    "市场部",
    "财务部",
    "人事部",
  ];
  const positions = ["工程师", "高级工程师", "经理", "总监", "副总裁"];
  const levels = ["P5", "P6", "P7", "P8", "P9"];
  const grades = ["A", "B", "C", "D"];
  const productNames = ["标准款", "旗舰款", "企业版", "轻量版", "套装"];

  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    const name =
      ["张", "李", "王", "刘", "陈"][i % 5]! +
      ["伟", "芳", "娜", "敏", "静"][i % 5]!;
    rows.push({
      data: {
        id: i + 1,
        firstName: name.charAt(0),
        lastName: name.charAt(1),
        phone: `1${Math.floor(random() * 9 + 1)}${Math.floor(
          random() * 1000000000,
        )
          .toString()
          .padStart(9, "0")}`,
        email: `user${i}@example.com`,
        province: provinces[i % provinces.length],
        city: cities[i % cities.length],
        district: `区${(i % 10) + 1}`,
        street: `街道${(i % 20) + 1}号`,
        department: departments[i % departments.length],
        position: positions[i % positions.length],
        level: levels[i % levels.length],
        baseSalary: Math.floor(random() * 50000) + 10000,
        bonus: Math.floor(random() * 10000),
        stock: Math.floor(random() * 5000),
        tax: Math.floor(random() * 3000),
        insurance: Math.floor(random() * 2000),
        housing: Math.floor(random() * 1500),
        joinDate: `2020-0${(i % 9) + 1}-01`,
        probationEnd: `2020-1${(i % 2) + 1}-01`,
        contractEnd: `2023-0${(i % 9) + 1}-01`,
        q1: grades[i % 4],
        q2: grades[(i + 1) % 4],
        q3: grades[(i + 2) % 4],
        q4: grades[(i + 3) % 4],
        technical: Math.floor(random() * 40) + 60,
        communication: Math.floor(random() * 40) + 60,
        leadership: Math.floor(random() * 40) + 60,
        innovation: Math.floor(random() * 40) + 60,
        name: productNames[i % productNames.length],
        soldQuantity: Math.floor(random() * 900) + 100,
        amount: Math.floor(random() * 900000) + 100000,
        stockQuantity: Math.floor(random() * 3000) + 200,
        status: i % 3 === 0 ? "在职" : i % 3 === 1 ? "离职" : "休假",
      },
    });
  }
  return rows;
}

function generate1000Columns(): Column[] {
  const columns: Column[] = [
    { key: "id", title: "ID", width: 60, type: "number", fixed: "left" },
  ];

  for (let i = 0; i < 998; i++) {
    columns.push({
      key: `col_${i}`,
      title: `列${i + 1}`,
      width: 80,
      sortable: true,
      filterable: i < 100,
    });
  }

  columns.push({ key: "status", title: "状态", width: 80, fixed: "right" });

  return columns;
}

function generate1000ColumnsData(count: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    const data: Record<string, unknown> = { id: i + 1 };
    for (let j = 0; j < 998; j++) {
      data[`col_${j}`] = `数据${i}-${j}`;
    }
    data.status = i % 3 === 0 ? "正常" : "异常";
    rows.push({
      data,
    });
  }
  return rows;
}

const container = document.getElementById("table-container")!;
const exampleWindow = window as ExampleWindow;
const table = new CanvasTable(container, {
  rows: generateData(100),
  columns,
  width: "100%",
  height: "100%",
  stripeRows: true,
  hoverable: true,
  showRowNumbers: true,
  themeMode: "auto",
  enableRowHeightResize: true,
  enableRowPinning: true,
  summary: {
    position: "bottom",
    scope: "view",
    rows: [
      {
        key: "total",
        build: ({ scopeRows }) => {
          let salaryTotal = 0;
          let bonusTotal = 0;
          for (const row of scopeRows) {
            salaryTotal += Number(row.data.salary ?? 0);
            bonusTotal += Number(row.data.bonus ?? 0);
          }

          return [
            {
              startColumnKey: "name",
              endColumnKey: "department",
              text: `合计 ${scopeRows.length} 行`,
              style: { fontWeight: "bold" },
            },
            {
              columnKey: "salary",
              value: salaryTotal,
              type: "number",
              style: { fontWeight: "bold", horizontalAlign: "right" },
            },
            {
              columnKey: "bonus",
              value: bonusTotal,
              type: "number",
              style: { fontWeight: "bold", horizontalAlign: "right" },
            },
          ];
        },
      },
    ],
  },
  // 动态行高示例：每10行有100px高度，每5行有64px高度，其他为默认32px
  rowHeight: (_row, rowIndex) => {
    if (rowIndex % 10 === 0) return 100;
    if (rowIndex % 5 === 0) return 64;
    return 32;
  },
  onRowHeightChange: (row, newHeight, rowIndex) => {
    exampleWindow.lastRowHeightChange = {
      rowName: String(row.data.name ?? ""),
      newHeight,
      rowIndex,
    };
  },
  watermark: {
    enabled: true,
    content: "Canvas Table",
    fontSize: 18,
    color: "rgba(0, 0, 0, 0.12)",
    rotation: -22,
    gapX: 120,
    gapY: 80,
  },
  selection: { mode: "cell", multi: true },
  editing: { enabled: true, mode: "dblclick" },
  createRowData: (cols) => {
    const newData: Record<string, unknown> = {};
    const rows = table.getRows();
    const newRowIndex = rows.length;

    for (const col of cols) {
      switch (col.key) {
        case "id":
          newData.id = newRowIndex + 1;
          break;
        case "name":
          newData.name = "新员工";
          break;
        case "age":
          newData.age = 25;
          break;
        case "department":
          newData.department = "技术部";
          break;
        case "salary":
          newData.salary = 15000;
          break;
        case "bonus":
          newData.bonus = 2000;
          break;
        case "joinDate":
          newData.joinDate = new Date().toISOString().split("T")[0];
          break;
        case "status":
          newData.status = "active";
          break;
        case "skills":
          newData.skills = [];
          break;
        case "selected":
          newData.selected = false;
          break;
        case "radioValue":
          newData.radioValue = "medium";
          break;
        case "level":
          newData.level = "junior";
          break;
        case "roles":
          newData.roles = [];
          break;
        case "remark":
          newData.remark = "";
          break;
        case "score":
          newData.score = 0;
          break;
        case "enabled":
          newData.enabled = false;
          break;
        case "rating":
          newData.rating = 0;
          break;
        default:
          newData[col.key] = "";
      }
    }

    return newData;
  },
  onCellClick: (cell, _event) => {
    console.log("Cell clicked:", cell);
  },
  onSort: (sort) => {
    console.log("Sort changed:", sort);
  },
  onFilter: (filters) => {
    console.log("Filter changed:", filters);
  },
  onScroll: (scrollLeft, scrollTop) => {
    // console.log('Scroll:', { scrollLeft, scrollTop });
  },
  onEditEnd: (cell, value) => {
    console.log("Edit ended:", cell, value);
  },
  onValidationError: (error) => {
    const title = error.level === "warning" ? "校验警告" : "校验失败";
    console[error.level === "warning" ? "warn" : "error"](title, error);
  },
  onCheckboxChange: (cell, checked) => {
    console.log("Checkbox changed:", cell, checked);
    // const row = table.getRow(cell.rowIndex);
    // if (row) {
    //   row.data.selected = checked;
    // }
  },
  onRadioChange: (cell, value) => {
    console.log("Radio changed:", cell, value);
    // const row = table.getRow(cell.rowIndex);
    // if (row) {
    //   row.data.radioValue = value as string;
    // }
  },
  onButtonClick: (cell, actionKey) => {
    console.log("Button clicked:", cell, "actionKey:", actionKey);
    const row = table.getRow(cell.rowIndex);
    console.log("Row data:", row);
    alert(
      `点击了第 ${cell.rowIndex} 行的按钮，actionKey: ${actionKey || "未设置"}`,
    );
  },
  onSwitchChange: (cell, checked) => {
    console.log("Switch changed:", cell, checked);
    // const row = table.getRow(cell.rowIndex);
    // if (row) {
    //   row.data.enabled = checked;
    // }
  },
  onSelectChange: (cell, value) => {
    console.log("Select changed:", cell, value);
    // const row = table.getRow(cell.rowIndex);
    // if (row) {
    //   if (Array.isArray(value)) {
    //     row.data.roles = value;
    //   } else {
    //     row.data.level = value as string;
    //   }
    // }
  },
  onTagsChange: (cell, values) => {
    console.log("Tags changed:", cell, values);
  },
  onRatingChange: (cell, value) => {
    console.log("Rating changed:", cell, value);
  },
  onColumnHide: (columnKey) => {
    console.log("Column hidden:", columnKey);
  },
  onColumnShow: (columnKey) => {
    console.log("Column shown:", columnKey);
  },
  onImageClick: (cell, imageSrc, event) => {
    console.log("Image clicked:", cell, imageSrc);
    console.log(`点击了第 ${cell.rowIndex} 行的图片\n图片地址: ${imageSrc}`);
  },
  onImageUpload: (cell, url) => {
    console.log("Image uploaded:", cell, url);
    // 上传成功后更新数据
    const row = table.getRow(cell.rowIndex);
    if (row) {
      const photos = (row.data.photos as string[]) || [];
      // 将新上传的图片 URL 添加到数组中
      // 注意：这里不需要手动更新，因为 imageEditor 已经处理了
      // 如果需要持久化到后端，可以在这里调用 API
      console.log("当前图片列表:", [...photos, url]);
    }
  },
  onImageDelete: (cell, deletedImage, index) => {
    console.log("Image deleted:", cell, deletedImage, index);
    // 删除图片后可以在这里调用后端 API 进行持久化
  },
  onColumnReorder: (columnKeys) => {
    console.log("Columns reordered:", columnKeys);
  },
});

exampleWindow.table = table;

// 小数据量使用同步方式（可以对比 Worker 和主线程的差异）
// 大数据量也使用同步方式，因为 postMessage 的结构化克隆开销太大
document.getElementById("load1k")!.addEventListener("click", () => {
  setRowsWithMeasure(table, () => generateData(1000), "Load 1K rows");
});

document.getElementById("load10k")!.addEventListener("click", () => {
  setRowsWithMeasure(table, () => generateData(10000), "Load 10K rows");
});

document.getElementById("load100k")!.addEventListener("click", () => {
  setRowsWithMeasure(table, () => generateData(100_000), "Load 100K rows");
});

document.getElementById("load1m")!.addEventListener("click", () => {
  setRowsWithMeasure(table, () => generateData(1_000_000), "Load 1M rows");
});

document.getElementById("clearSort")!.addEventListener("click", () => {
  table.sort([]);
});

document.getElementById("clearFilter")!.addEventListener("click", () => {
  table.clearFilters();
});

document.getElementById("exportCsv")!.addEventListener("click", async () => {
  const blob = await table.export({ format: "csv", filename: "data.csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.csv";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("exportExcel")!.addEventListener("click", async () => {
  const blob = await table.export({
    format: "excel",
    filename: "canvas-table-export-v2.xlsx",
    excel: {
      hierarchicalHeaders: true,
      columnWidths: "view",
      freeze: {
        header: true,
        leftFixedColumns: true,
      },
      formats: [
        { key: "salary", type: "number", formatCode: "#,##0" },
        { key: "bonus", type: "number", formatCode: "#,##0" },
        { key: "score", type: "number", formatCode: "0" },
        { key: "progress", type: "number", formatCode: "0" },
        { key: "taskProgress", type: "number", formatCode: "0" },
        { key: "completionRate", type: "number", formatCode: "0" },
        { key: "q1", type: "number", formatCode: "#,##0" },
        { key: "q2", type: "number", formatCode: "#,##0" },
        { key: "q3", type: "number", formatCode: "#,##0" },
        { key: "q4", type: "number", formatCode: "#,##0" },
        { key: "halfYear", type: "number", formatCode: "#,##0" },
        { key: "total", type: "number", formatCode: "#,##0" },
        { key: "joinDate", type: "date", formatCode: "yyyy-mm-dd" },
        { key: "probationEnd", type: "date", formatCode: "yyyy-mm-dd" },
      ],
    },
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "canvas-table-export-v2.xlsx";
  a.click();
  URL.revokeObjectURL(url);
  console.log(
    "Excel v2 exported. Try it after switching between Complex, Merged, and Hierarchical views.",
  );
});

let currentThemeMode: "light" | "dark" | "auto" = "auto";
const themeDisplay = document.getElementById("currentTheme")!;
themeDisplay.textContent = `(auto)`;

document.getElementById("toggleTheme")!.addEventListener("click", () => {
  const modes: ("light" | "dark" | "auto")[] = ["light", "dark", "auto"];
  const currentIndex = modes.indexOf(currentThemeMode);
  currentThemeMode = modes[(currentIndex + 1) % modes.length]!;
  table.setThemeMode(currentThemeMode);
  themeDisplay.textContent = `(${currentThemeMode})`;
  console.log("Theme mode changed to:", currentThemeMode);
});

let currentLocale: LocalePreset = "zh-CN";
const localeDisplay = document.getElementById("currentLocale")!;
localeDisplay.textContent = `(中文)`;

document.getElementById("toggleLocale")!.addEventListener("click", () => {
  currentLocale = currentLocale === "zh-CN" ? "en-US" : "zh-CN";
  table.setLocale(currentLocale);
  localeDisplay.textContent =
    currentLocale === "zh-CN" ? `(中文)` : `(English)`;
  console.log("Locale changed to:", currentLocale);
});

// 显示隐藏的"暗号"列
document.getElementById("showHiddenColumn")!.addEventListener("click", () => {
  table.showColumn("secretCode");
  console.log("Show secretCode column");
});

// 隐藏年龄列
document.getElementById("hideAgeColumn")!.addEventListener("click", () => {
  table.hideColumn("age");
  console.log("Hide age column");
});

// 性能检测按钮
let perfMonitoringEnabled = false;
const perfButton = document.getElementById("perfMonitor")!;
perfButton.addEventListener("click", () => {
  if (!perfMonitoringEnabled) {
    // 开始检测
    perfMonitoringEnabled = true;
    table.setPerformanceMonitoring(true);
    table.resetPerformanceStats();
    perfButton.textContent = "结束性能检测";
    perfButton.style.background = "#fff1f0";
    perfButton.style.borderColor = "#ff4d4f";
    perfButton.style.color = "#ff4d4f";
    console.log("性能检测已开始，滚动表格数据进行测试...");
  } else {
    // 先打印报告，再禁用监控
    perfMonitoringEnabled = false;
    console.log("\n========== 性能检测报告 ==========\n");
    table.printPerformanceReport();
    console.log("\n==================================\n");
    // 打印完报告后再禁用
    table.setPerformanceMonitoring(false);
    perfButton.textContent = "开始性能检测";
    perfButton.style.background = "#e6f7ff";
    perfButton.style.borderColor = "#1890ff";
    perfButton.style.color = "#1890ff";
  }
});

// 缓存开关按钮
let cacheEnabled = false;
const cacheButton = document.getElementById("cacheToggle")!;
cacheButton.addEventListener("click", () => {
  cacheEnabled = !cacheEnabled;

  // 更新所有列的 cacheMode
  const currentColumns = table.getColumns();
  const cacheModeValue: "cell" | false = cacheEnabled ? "cell" : false;
  const updatedColumns = currentColumns.map((col) => ({
    ...col,
    cacheMode: cacheModeValue,
  }));

  // 应用更新
  table.setColumns(updatedColumns);

  // 更新按钮状态
  if (cacheEnabled) {
    cacheButton.textContent = "Cache: ON";
    cacheButton.style.background =
      "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)";
    cacheButton.style.borderColor = "transparent";
    cacheButton.style.color = "#fff";

    // 显示缓存统计
    const stats = table.getRenderCacheStats();
    console.log("Cache enabled. Stats:", stats);
  } else {
    cacheButton.textContent = "Cache: OFF";
    cacheButton.style.background = "";
    cacheButton.style.borderColor = "";
    cacheButton.style.color = "";

    // 清空缓存
    table.clearRenderCache();
    console.log("Cache disabled and cleared.");
  }
});

// 图片加载队列开关按钮 -暂时隐藏，有 bug
// let imageLoadEnabled = false;
// const imageLoadButton = document.getElementById("imageLoadToggle")!;
// if (imageLoadButton) {
//   imageLoadButton.addEventListener("click", () => {
//     imageLoadEnabled = !imageLoadEnabled;
//
//     // 更新图片加载配置
//     table.setImageLoadConfig({
//       enabled: imageLoadEnabled,
//       delay: 100,
//       maxConcurrent: 6,
//       maxCacheSize: 200,
//     });
//
//     // 更新按钮状态
//     if (imageLoadEnabled) {
//       imageLoadButton.textContent = "Image Queue: ON";
//       imageLoadButton.style.background = "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)";
//       imageLoadButton.style.borderColor = "transparent";
//       imageLoadButton.style.color = "#fff";
//
//       console.log("Image load queue enabled. Config: { delay: 100, maxConcurrent: 6 }");
//     } else {
//       imageLoadButton.textContent = "Image Queue: OFF";
//       imageLoadButton.style.background = "";
//       imageLoadButton.style.borderColor = "";
//       imageLoadButton.style.color = "";
//
//       console.log("Image load queue disabled (immediate loading).");
//     }
//   });
// }

document.getElementById("loadComplex")!.addEventListener("click", () => {
  const complexColumns = generateComplexColumns();
  table.setColumns(complexColumns);
  setRowsWithMeasure(
    table,
    () => generateComplexData(1000),
    "Load complex columns",
  );
});

document.getElementById("load1000Cols")!.addEventListener("click", () => {
  const cols1000 = generate1000Columns();
  table.setColumns(cols1000);
  setRowsWithMeasure(
    table,
    () => generate1000ColumnsData(1000),
    "Load 1000 columns",
  );
});

document.getElementById("loadMerged")!.addEventListener("click", () => {
  const mergedData = generateMergedCellsData();
  table.setColumns(mergedData.columns);
  setRowsWithMeasure(table, () => mergedData.rows, "Load merged cells");
});

document
  .getElementById("loadHierarchical")!
  .addEventListener("click", async () => {
    await setRowsWithWorker(
      table,
      "generateHierarchical",
      undefined,
      "Load hierarchical rows (worker)",
    );
    (
      table as unknown as { setExpandColumnKey: (key: string) => void }
    ).setExpandColumnKey("name");
  });

// 懒加载 demo
let lazyLoadSeed = 10000;
const BATCH_SIZE = 100;

document.getElementById("loadLazy")!.addEventListener("click", () => {
  // 重置状态
  lazyLoadSeed = 10000;
  const initialRows = generateData(100, 1000);

  // 销毁原表格
  table.destroy();

  // 创建新的支持懒加载的表格
  const lazyTable = new CanvasTable(container, {
    rows: initialRows,
    columns,
    width: "100%",
    height: "100%",
    stripeRows: true,
    hoverable: true,
    showRowNumbers: true,
    themeMode: "auto",
    lazyLoad: {
      enabled: true,
      threshold: 10, // 距离底部 10 行时触发
    },
    onLoadMore: (params) => {
      console.log("Load more triggered:", params);
      const currentCount = lazyTable.getRows().length;

      // 显示加载提示
      lazyTable.showLoading(`加载更多数据... (当前 ${currentCount} 行)`);

      // 模拟异步加载
      setTimeout(() => {
        // 生成新的数据批次
        const newRows = generateData(BATCH_SIZE, lazyLoadSeed);
        lazyLoadSeed += BATCH_SIZE;

        // 追加数据
        lazyTable.appendRows(newRows);

        lazyTable.hideLoading();
        console.log(
          `Loaded ${BATCH_SIZE} rows, total: ${lazyTable.getRows().length}`,
        );

        // 模拟最多加载 10000 行
        if (lazyTable.getRows().length >= 10000) {
          lazyTable.setHasMore(false); // 没有更多数据了
          console.log("Reached max rows (10000), stopped lazy loading");
        }
      }, 1000); // 模拟网络延迟
    },
  });

  // 更新全局引用
  (window as unknown as { table: CanvasTable }).table = lazyTable;

  // 添加提示
  const infoEl = document.createElement("div");
  infoEl.style.cssText =
    "position: absolute; top: 10px; right: 10px; background: rgba(0,212,170,0.9); color: #0f1419; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-family: 'JetBrains Mono', monospace; z-index: 100;";
  infoEl.textContent = "滚动到底部加载更多 (最多 10000 行)";
  container.appendChild(infoEl);

  // 3秒后移除提示
  setTimeout(() => {
    infoEl.remove();
  }, 3000);

  console.log("Lazy load demo enabled. Scroll to bottom to trigger load more.");
});

function generateMergedCellsData(seed: number = DATA_SEED): {
  rows: Row[];
  columns: Column[];
} {
  const random = createSeededRandom(seed);
  const columns: Column[] = [
    { key: "id", title: "ID", width: 60, type: "number", fixed: "left" },
    { key: "region", title: "区域", width: 80, fixed: "left" },
    { key: "department", title: "部门", width: 100 },
    { key: "team", title: "小组", width: 100 },
    { key: "name", title: "姓名", width: 100 },
    { key: "q1", title: "Q1", width: 80 },
    { key: "q2", title: "Q2", width: 80 },
    { key: "q3", title: "Q3", width: 80 },
    { key: "q4", title: "Q4", width: 80 },
    { key: "halfYear", title: "上半年", width: 160 },
    { key: "total", title: "年度总计", width: 100 },
    { key: "status", title: "状态", width: 80, fixed: "right" },
  ];

  const rows: Row[] = [];
  const regions = ["华东", "华北", "华南", "西部"];
  const departments = ["技术部", "产品部", "运营部"];
  const teams = ["A组", "B组", "C组"];
  const names = [
    "张三",
    "李四",
    "王五",
    "赵六",
    "钱七",
    "孙八",
    "周九",
    "吴十",
  ];

  let id = 1;
  let rowIndex = 0;

  const regionMergeStarts: number[] = [];
  const deptMergeStarts: number[] = [];
  const teamMergeStarts: number[] = [];

  for (let r = 0; r < regions.length; r++) {
    regionMergeStarts.push(rowIndex);
    for (let d = 0; d < departments.length; d++) {
      deptMergeStarts.push(rowIndex);
      for (let t = 0; t < teams.length; t++) {
        teamMergeStarts.push(rowIndex);
        for (let n = 0; n < 2; n++) {
          const q1 = Math.floor(random() * 50) + 50;
          const q2 = Math.floor(random() * 50) + 50;
          const q3 = Math.floor(random() * 50) + 50;
          const q4 = Math.floor(random() * 50) + 50;

          rows.push({
            data: {
              id: id,
              region: regions[r],
              department: departments[d],
              team: teams[t],
              name: names[(id - 1) % names.length],
              q1,
              q2,
              q3,
              q4,
              halfYear: q1 + q2,
              total: q1 + q2 + q3 + q4,
              status: id % 3 === 0 ? "优秀" : id % 3 === 1 ? "良好" : "合格",
            },
            cellMerges: undefined,
          });

          id++;
          rowIndex++;
        }
      }
    }
  }

  for (let i = 0; i < regionMergeStarts.length; i++) {
    const startRow = regionMergeStarts[i]!;
    const endRow =
      i + 1 < regionMergeStarts.length
        ? regionMergeStarts[i + 1]!
        : rows.length;
    const rowspan = endRow - startRow;

    if (rowspan > 1 && rows[startRow]) {
      if (!rows[startRow]!.cellMerges) {
        rows[startRow]!.cellMerges = [];
      }
      rows[startRow]!.cellMerges!.push({
        rowIndex: startRow,
        columnIndex: 0,
        rowspan,
        colspan: 1,
      });
    }
  }

  for (let i = 0; i < deptMergeStarts.length; i++) {
    const startRow = deptMergeStarts[i]!;
    const nextStart = deptMergeStarts.find((s) => s > startRow);
    const endRow = nextStart ?? rows.length;
    const rowspan = endRow - startRow;

    if (rowspan > 1 && rows[startRow]) {
      if (!rows[startRow]!.cellMerges) {
        rows[startRow]!.cellMerges = [];
      }
      rows[startRow]!.cellMerges!.push({
        rowIndex: startRow,
        columnIndex: 1,
        rowspan,
        colspan: 1,
      });
    }
  }

  for (let i = 0; i < teamMergeStarts.length; i++) {
    const startRow = teamMergeStarts[i]!;
    const nextStart = teamMergeStarts.find((s) => s > startRow);
    const endRow = nextStart ?? rows.length;
    const rowspan = endRow - startRow;

    if (rowspan > 1 && rows[startRow]) {
      if (!rows[startRow]!.cellMerges) {
        rows[startRow]!.cellMerges = [];
      }
      rows[startRow]!.cellMerges!.push({
        rowIndex: startRow,
        columnIndex: 2,
        rowspan,
        colspan: 1,
      });
    }
  }

  for (let i = 0; i < rows.length; i += 2) {
    if (rows[i]) {
      if (!rows[i]!.cellMerges) {
        rows[i]!.cellMerges = [];
      }
      rows[i]!.cellMerges!.push({
        rowIndex: i,
        columnIndex: 3,
        rowspan: 2,
        colspan: 1,
      });
    }
  }

  for (let i = 0; i < rows.length; i += 4) {
    if (rows[i]) {
      if (!rows[i]!.cellMerges) {
        rows[i]!.cellMerges = [];
      }
      rows[i]!.cellMerges!.push({
        rowIndex: i,
        columnIndex: 5,
        rowspan: 1,
        colspan: 2,
      });

      rows[i]!.cellMerges!.push({
        rowIndex: i,
        columnIndex: 7,
        rowspan: 1,
        colspan: 2,
      });
    }
  }

  return { rows, columns };
}

// 处理 Vite 热更新，防止内存泄漏
const hot = (import.meta as { hot?: { accept: (cb: () => void) => void } }).hot;
if (hot) {
  hot.accept(() => {
    // 热更新时销毁旧实例
    table.destroy();
    // 页面会自动刷新，所以这里不需要重新创建
  });
}

(window as unknown as { table: CanvasTable }).table = table;

// Start FPS Monitor
getFPSMonitor().start();
