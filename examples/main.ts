import { CanvasTable } from "../src";
import type {
  Column,
  Row,
  CellType,
  CellMerge,
  TagItem,
  CustomRenderContext,
} from "../src/types";

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
  for (let i = 0; i < count; i++) {
    const cellMerges: CellMerge[] = [];

    if (i % 5 === 0 && i + 1 < count) {
      cellMerges.push({
        rowIndex: i,
        columnIndex: 2,
        rowspan: 2,
        colspan: 1,
      });
    }

    // 直接计算各项值
    const selected = i % 3 === 0;
    const radioValue = ["high", "medium", "low"][i % 3]!;
    const level = levelOptions[i % 4]!;
    const enabled = i % 2 === 0;

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

    rows.push({
      id: `row-${i}`,
      data: {
        id: i + 1,
        name:
          firstNames[Math.floor(random() * firstNames.length)] +
          lastNames[Math.floor(random() * lastNames.length)],
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
        // 测试超出范围的进度值
        progressOverflow: i === 0 ? 150 : i === 1 ? -20 : Math.floor(random() * 100), // 第一行150，第二行-20
        dashboard: Math.floor(random() * 100),
        volume: Math.floor(random() * 100),
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
        borderRadius: 4,
        gap: 4,
        maxVisible: 4,
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
        align: "center",
        disabled: isRowDisabled,
      },
      {
        key: "department",
        title: "部门",
        width: 100,
        sortable: true,
        filterable: true,
        editable: true,
        disabled: isRowDisabled,
      },
    ],
  },
  {
    key: "joinDate",
    title: "入职日期",
    width: 120,
    type: "date",
    sortable: true,
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
    disabled: isRowDisabled,
    render: (_value, row) => {
      const name = row.data.name as string;
      const email = `${name.toLowerCase()}@example.com`;
      return {
        type: "link" as CellType,
        link: {
          text: email,
          link: `mailto:${email}`,
        },
      };
    },
  },
  {
    key: "website",
    title: "个人主页",
    width: 150,
    type: "link",
    disabled: isRowDisabled,
    render: (_value, row) => ({
      type: "link" as CellType,
      link: {
        link: `https://example.com/users/${row.data.id}`,
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
        disabled: isRowDisabled,
        formatter: (value) => "¥" + (value as number).toLocaleString(),
      },
      {
        key: "bonus",
        title: "奖金",
        width: 80,
        type: "number",
        sortable: true,
        disabled: isRowDisabled,
        formatter: (value) => "¥" + (value as number).toLocaleString(),
      },
    ],
  },
  {
    key: "status",
    title: "状态",
    width: 100,
    type: "tag",
    sortable: true,
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
    disabled: isRowDisabled,
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
    disabled: isRowDisabled,
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
    render: (value) => ({
      type: "progress",
      progress: {
        value: (value ?? 0) as number,
        interactive: true, // 允许点击调整
        shape: "line",
      },
    }),
  },
  {
    key: "skills",
    title: "技能标签",
    width: 200,
    type: "tag",
    sortable: false,
    disabled: isRowDisabled,
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
      const rowIndex = parseInt(row.id.replace("row-", ""));
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

  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    const name =
      ["张", "李", "王", "刘", "陈"][i % 5]! +
      ["伟", "芳", "娜", "敏", "静"][i % 5]!;
    rows.push({
      id: `row-${i}`,
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
      id: `row-${i}`,
      data,
    });
  }
  return rows;
}

const container = document.getElementById("table-container")!;

const table = new CanvasTable(container, {
  data: { rows: generateData(100), columns },
  columns,
  width: "100%",
  height: "100%",
  stripeRows: true,
  hoverable: true,
  showRowNumbers: true,
  themeMode: "auto",
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
    const rowIndex = cell.rowIndex;
    const leafColumns = [
      "selected",
      "id",
      "name",
      "age",
      "department",
      "salary",
      "bonus",
      "joinDate",
      "status",
      "skills",
      "radioValue",
      "remark",
      "level",
      "actions",
      "score",
    ];
    const columnKey = leafColumns[cell.columnIndex];
    if (columnKey === "level") {
      const row = table.getRow(cell.rowIndex);
      if (row) {
        row.data.level = value as string;
      }
    }
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

document.getElementById("load1k")!.addEventListener("click", () => {
  console.time("Load 1K rows");
  table.setData({ rows: generateData(1000), columns });
  console.timeEnd("Load 1K rows");
});

document.getElementById("load10k")!.addEventListener("click", () => {
  console.time("Load 10K rows");
  table.setData({ rows: generateData(10000), columns });
  console.timeEnd("Load 10K rows");
});

document.getElementById("load100k")!.addEventListener("click", () => {
  console.time("Load 100K rows");
  table.setData({ rows: generateData(100_000), columns });
  console.timeEnd("Load 100K rows");
});

document.getElementById("load1m")!.addEventListener("click", () => {
  console.time("Load 1M rows");
  table.setData({ rows: generateData(1_000_000), columns });
  console.timeEnd("Load 1M rows");
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

let currentThemeMode: "light" | "dark" | "auto" = "auto";
const themeDisplay = document.getElementById("currentTheme")!;

document.getElementById("toggleTheme")!.addEventListener("click", () => {
  const modes: ("light" | "dark" | "auto")[] = ["light", "dark", "auto"];
  const currentIndex = modes.indexOf(currentThemeMode);
  currentThemeMode = modes[(currentIndex + 1) % modes.length]!;
  table.setThemeMode(currentThemeMode);
  themeDisplay.textContent = `(current:${currentThemeMode})`;
  console.log("Theme mode changed to:", currentThemeMode);
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

document.getElementById("loadComplex")!.addEventListener("click", () => {
  console.time("Load complex columns");
  const complexColumns = generateComplexColumns();
  table.setData({ rows: generateComplexData(1000), columns: complexColumns });
  console.timeEnd("Load complex columns");
});

document.getElementById("load1000Cols")!.addEventListener("click", () => {
  console.time("Load 1000 columns");
  const cols1000 = generate1000Columns();
  table.setData({ rows: generate1000ColumnsData(1000), columns: cols1000 });
  console.timeEnd("Load 1000 columns");
});

document.getElementById("loadMerged")!.addEventListener("click", () => {
  console.time("Load merged cells");
  const mergedData = generateMergedCellsData();
  table.setData({ rows: mergedData.rows, columns: mergedData.columns });
  console.timeEnd("Load merged cells");
});

document.getElementById("loadHierarchical")!.addEventListener("click", () => {
  console.time("Load hierarchical data");
  const hierarchicalData = generateHierarchicalData();
  table.setData({
    rows: hierarchicalData.rows,
    columns: hierarchicalData.columns,
  });
  (
    table as unknown as { setExpandColumnKey: (key: string) => void }
  ).setExpandColumnKey("name");
  console.timeEnd("Load hierarchical data");
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
            id: `row-${id}`,
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

function generateHierarchicalData(): { rows: Row[]; columns: Column[] } {
  const columns: Column[] = [
    { key: "name", title: "名称", width: 200, fixed: "left" },
    { key: "type", title: "类型", width: 100 },
    { key: "size", title: "大小", width: 100 },
    { key: "modified", title: "修改时间", width: 150 },
    { key: "status", title: "状态", width: 80, fixed: "right" },
  ];

  const rows: Row[] = [
    {
      id: "folder-1",
      data: {
        name: "项目文档",
        type: "文件夹",
        size: "-",
        modified: "2024-01-15",
        status: "正常",
      },
      expanded: false,
      children: [
        {
          id: "folder-1-1",
          data: {
            name: "需求文档",
            type: "文件夹",
            size: "-",
            modified: "2024-01-15",
            status: "正常",
          },
          expanded: false,
          children: [
            {
              id: "file-1-1-1",
              data: {
                name: "需求说明书.docx",
                type: "文档",
                size: "2.5MB",
                modified: "2024-01-15",
                status: "正常",
              },
            },
            {
              id: "file-1-1-2",
              data: {
                name: "需求变更记录.xlsx",
                type: "表格",
                size: "1.2MB",
                modified: "2024-01-14",
                status: "正常",
              },
            },
          ],
        },
        {
          id: "folder-1-2",
          data: {
            name: "设计文档",
            type: "文件夹",
            size: "-",
            modified: "2024-01-13",
            status: "正常",
          },
          expanded: false,
          children: [
            {
              id: "file-1-2-1",
              data: {
                name: "架构设计.pdf",
                type: "文档",
                size: "5.8MB",
                modified: "2024-01-13",
                status: "正常",
              },
            },
            {
              id: "file-1-2-2",
              data: {
                name: "UI设计稿.sketch",
                type: "设计",
                size: "15.2MB",
                modified: "2024-01-12",
                status: "正常",
              },
            },
          ],
        },
        {
          id: "file-1-3",
          data: {
            name: "项目计划.xlsx",
            type: "表格",
            size: "0.8MB",
            modified: "2024-01-10",
            status: "正常",
          },
        },
      ],
    },
    {
      id: "folder-2",
      data: {
        name: "源代码",
        type: "文件夹",
        size: "-",
        modified: "2024-01-16",
        status: "正常",
      },
      expanded: false,
      children: [
        {
          id: "folder-2-1",
          data: {
            name: "src",
            type: "文件夹",
            size: "-",
            modified: "2024-01-16",
            status: "正常",
          },
          expanded: false,
          children: [
            {
              id: "folder-2-1-1",
              data: {
                name: "components",
                type: "文件夹",
                size: "-",
                modified: "2024-01-16",
                status: "正常",
              },
              children: [
                {
                  id: "file-2-1-1-1",
                  data: {
                    name: "Table.tsx",
                    type: "代码",
                    size: "25KB",
                    modified: "2024-01-16",
                    status: "正常",
                  },
                },
                {
                  id: "file-2-1-1-2",
                  data: {
                    name: "Button.tsx",
                    type: "代码",
                    size: "8KB",
                    modified: "2024-01-15",
                    status: "正常",
                  },
                },
              ],
            },
            {
              id: "file-2-1-2",
              data: {
                name: "index.ts",
                type: "代码",
                size: "2KB",
                modified: "2024-01-16",
                status: "正常",
              },
            },
          ],
        },
        {
          id: "file-2-2",
          data: {
            name: "package.json",
            type: "配置",
            size: "1KB",
            modified: "2024-01-14",
            status: "正常",
          },
        },
      ],
    },
    {
      id: "folder-3",
      data: {
        name: "测试报告",
        type: "文件夹",
        size: "-",
        modified: "2024-01-11",
        status: "正常",
      },
      expanded: false,
      children: [
        {
          id: "file-3-1",
          data: {
            name: "单元测试报告.pdf",
            type: "文档",
            size: "3.2MB",
            modified: "2024-01-11",
            status: "正常",
          },
        },
        {
          id: "file-3-2",
          data: {
            name: "集成测试报告.pdf",
            type: "文档",
            size: "4.5MB",
            modified: "2024-01-10",
            status: "正常",
          },
        },
      ],
    },
  ];

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
