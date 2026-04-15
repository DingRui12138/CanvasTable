/**
 * Data Worker - 在后台线程生成数据，避免阻塞主线程
 * 注意：Worker 只能传递可序列化的数据，不能传递函数
 */

// 类型定义
interface WorkerRow {
  id: string;
  data: Record<string, unknown>;
  children?: WorkerRow[];
  expanded?: boolean;
}

interface WorkerColumn {
  key: string;
  title: string;
  type?: string;
  width?: number;
  hidden?: boolean;
  fixed?: "left" | "right";
  children?: WorkerColumn[];
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
}

interface WorkerMessage {
  type: "generate" | "generateHierarchical";
  count?: number;
  seed?: number;
}

interface WorkerResponse {
  type: "data" | "error";
  data?: { rows: WorkerRow[]; columns: WorkerColumn[] };
  error?: string;
  workerCreateTime?: number; // Worker 内部生成时间
}

// 伪随机数生成器
function createSeededRandom(seed: number) {
  let state = seed;
  return function () {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

const DATA_SEED = 42;

// 数据生成函数 - 与主线程 generateData 保持一致
function generateData(count: number, seed: number = DATA_SEED): WorkerRow[] {
  const random = createSeededRandom(seed);
  const firstNames = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴"];
  const lastNames = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋"];
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

  const rows: WorkerRow[] = [];
  for (let i = 0; i < count; i++) {
    // 使用种子随机数生成确定性数据
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

    // 生成日期字符串
    const joinYear = 2020 + Math.floor(random() * 4);
    const joinMonth = Math.floor(random() * 12);
    const joinDay = Math.floor(random() * 28) + 1;
    const joinDateStr = `${joinYear}-${String(joinMonth + 1).padStart(2, "0")}-${String(joinDay).padStart(2, "0")}`;

    // 生成随机颜色
    const presetColors = [
      "#ff4d4f", "#ff7a45", "#ffa940", "#ffc53d",
      "#bae637", "#73d13d", "#36cfc9", "#40a9ff",
      "#597ef7", "#9254de", "#f759ab", "#ff85c0",
      "#a0d911", "#13c2c2", "#1890ff", "#722ed1",
      "#eb2f96", "#faad14", "#52c41a", "#2f54eb",
    ];
    const randomColor = presetColors[Math.floor(random() * presetColors.length)]!;

    // 生成 photos 数组
    const photosCount = Math.floor(random() * 5) + 1;
    const photos: string[] = [];
    for (let p = 0; p < photosCount; p++) {
      photos.push(`https://picsum.photos/seed/${i}-${p}/100/100`);
    }

    rows.push({
      id: `row-${i}`,
      data: {
        id: i + 1,
        name:
          firstNames[Math.floor(random() * firstNames.length)] +
          lastNames[Math.floor(random() * lastNames.length)],
        secretCode: `CODE-${Math.floor(random() * 10000)
          .toString()
          .padStart(4, "0")}`,
        age: Math.floor(random() * 40) + 20,
        department: departments[Math.floor(random() * departments.length)],
        salary: Math.floor(random() * 50000) + 10000,
        bonus: Math.floor(random() * 10000),
        joinDate: joinDateStr,
        status: statuses[Math.floor(random() * statuses.length)],
        score: Math.floor(random() * 100),
        priority: ["high", "medium", "low"][Math.floor(random() * 3)]!,
        selected,
        radioValue,
        level,
        roles,
        skills,
        enabled,
        rowIndex: i,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`,
        photos,
        // 进度条数据
        progress: Math.floor(random() * 100),
        taskProgress: Math.floor(random() * 100),
        completionRate: Math.floor(random() * 100),
        // 测试超出范围的进度值
        progressOverflow: i === 0 ? 150 : i === 1 ? -20 : Math.floor(random() * 100),
        dashboard: Math.floor(random() * 100),
        volume: Math.floor(random() * 100),
        // 评分
        rating: Math.floor(random() * 10) / 2 + (random() > 0.5 ? 0.5 : 0),
        // 颜色
        color: randomColor,
        remark: `备注-${i + 1}：这是一段较长的备注信息，用于测试多行输入功能，可以自动换行显示更多内容。第${i + 1}行数据。`,
        // email 和 website
        email: `user${i + 1}@example.com`,
        website: `https://user${i + 1}.example.com`,
      },
    });
  }

  return rows;
}

// 层级数据生成
function generateHierarchicalData(): { rows: WorkerRow[]; columns: WorkerColumn[] } {
  const hierarchicalColumns: WorkerColumn[] = [
    { key: "name", title: "名称", type: "text", width: 200 },
    { key: "type", title: "类型", type: "text", width: 100 },
    { key: "size", title: "大小", type: "text", width: 100 },
    { key: "modified", title: "修改时间", type: "text", width: 150 },
    { key: "status", title: "状态", type: "text", width: 80, fixed: "right" },
  ];

  const rows: WorkerRow[] = [
    {
      id: "folder-1",
      data: { name: "项目文档", type: "文件夹", size: "-", modified: "2024-01-15", status: "正常" },
      expanded: true,
      children: [
        {
          id: "file-1-1",
          data: { name: "需求文档.docx", type: "文档", size: "2.5MB", modified: "2024-01-10", status: "正常" },
        },
        {
          id: "file-1-2",
          data: { name: "设计文档.pdf", type: "文档", size: "5.2MB", modified: "2024-01-12", status: "正常" },
        },
        {
          id: "folder-1-1",
          data: { name: "子文件夹", type: "文件夹", size: "-", modified: "2024-01-14", status: "正常" },
          expanded: false,
          children: [
            {
              id: "file-1-1-1",
              data: { name: "笔记.txt", type: "文本", size: "12KB", modified: "2024-01-14", status: "正常" },
            },
          ],
        },
      ],
    },
    {
      id: "folder-2",
      data: { name: "源代码", type: "文件夹", size: "-", modified: "2024-01-20", status: "正常" },
      expanded: true,
      children: [
        {
          id: "file-2-1",
          data: { name: "index.ts", type: "代码", size: "45KB", modified: "2024-01-18", status: "正常" },
        },
        {
          id: "file-2-2",
          data: { name: "utils.ts", type: "代码", size: "23KB", modified: "2024-01-19", status: "正常" },
        },
      ],
    },
  ];

  return { rows, columns: hierarchicalColumns };
}

// Worker 消息处理
self.onmessage = function (e: MessageEvent<WorkerMessage>) {
  const { type, count, seed } = e.data;
  const startTime = performance.now();

  try {
    let result: { rows: WorkerRow[]; columns: WorkerColumn[] };

    if (type === "generate") {
      const rows = generateData(count ?? 1000, seed ?? DATA_SEED);
      // 返回空 columns，主线程会使用预定义的完整 columns
      result = { rows, columns: [] };
    } else if (type === "generateHierarchical") {
      result = generateHierarchicalData();
    } else {
      throw new Error(`Unknown message type: ${type}`);
    }

    const workerCreateTime = performance.now() - startTime;

    const response: WorkerResponse = {
      type: "data",
      data: result,
      workerCreateTime,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    self.postMessage(response);
  }
};

export {};