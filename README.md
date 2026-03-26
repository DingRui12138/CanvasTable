# Canvas Table

一个基于 Canvas 的高性能数据表格组件，支持百万级数据流畅渲染。

## 特性

### 核心功能
- **虚拟滚动** - 仅渲染可视区域，支持百万级数据
- **多级表头** - 支持无限层级嵌套的列分组
- **固定列** - 支持左侧、右侧固定列
- **合并单元格** - 支持行合并、列合并
- **层级数据** - 支持树形结构展示，可展开/折叠

### 列类型
- `text` - 文本类型
- `number` - 数字类型
- `date` - 日期类型
- `checkbox` - 复选框
- `radio` - 单选框
- `switch` - 开关
- `button` - 按钮（支持 default、primary、danger、warning、link 变体）
- `tag` - 标签（支持单选、多选）
- `select` - 下拉选择
- `input` - 输入框（支持多行）
- `image` - 图片（支持单图/多图、上传、预览）
- `progress` - 进度条（支持线型、环型、仪表盘，颜色区间）
- `custom` - 自定义渲染

### 交互功能
- **排序** - 单列/多列排序，支持升序、降序
- **筛选** - 列筛选功能
- **选择** - 单元格、行、列选择，支持范围选择和多选
- **编辑** - 双击或 Enter 进入编辑模式
- **右键菜单** - 删除行、上方插入行、下方插入行
- **键盘导航** - 方向键导航，快捷键操作
- **撤销** - Ctrl+Z (Windows/Linux) / Cmd+Z (macOS) 撤销操作
- **重做** - Ctrl+Y (Windows/Linux) / Cmd+Y (macOS) 重做操作

### 其他特性
- **主题** - 支持亮色、暗色、自动三种主题模式，可自定义主题颜色
- **水印** - 支持自定义水印内容、样式
- **导出** - 支持 CSV 格式导出
- **自适应** - 响应式布局，自适应容器大小

## 安装

```bash
npm install canvas-table
```

## 快速开始

```typescript
import { CanvasTable } from 'canvas-table';
import type { Column, Row } from 'canvas-table/types';

const columns: Column[] = [
  { key: 'id', title: 'ID', width: 80, type: 'number' },
  { key: 'name', title: '姓名', width: 120, editable: true },
  { key: 'age', title: '年龄', width: 80, type: 'number', sortable: true },
  { key: 'department', title: '部门', width: 120 }
];

const rows: Row[] = [
  { id: 'row-1', data: { id: 1, name: '张三', age: 28, department: '技术部' } },
  { id: 'row-2', data: { id: 2, name: '李四', age: 32, department: '市场部' } }
];

const container = document.getElementById('table-container')!;

const table = new CanvasTable(container, {
  data: { rows, columns },
  width: '100%',
  height: 600,
  stripeRows: true,
  hoverable: true,
  themeMode: 'auto',
  selection: { mode: 'cell', multi: true },
  editing: { enabled: true, mode: 'dblclick' }
});
```

## 配置选项

### TableOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `{ rows, columns }` | - | 表格数据 |
| `width` | `number \| '100%'` | `'100%'` | 表格宽度 |
| `height` | `number \| '100%'` | `'100%'` | 表格高度 |
| `stripeRows` | `boolean` | `false` | 是否显示斑马纹 |
| `hoverable` | `boolean` | `true` | 是否启用行悬浮效果 |
| `themeMode` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题模式 |
| `theme` | `TableTheme` | - | 自定义主题 |
| `selection` | `SelectionOptions` | - | 选择配置 |
| `editing` | `EditingOptions` | - | 编辑配置 |
| `watermark` | `WatermarkOptions` | - | 水印配置 |
| `createRowData` | `(columns: Column[]) => Record<string, unknown>` | - | 新增行时的数据初始化函数 |

### Column 配置

```typescript
interface Column {
  key: string;                    // 列标识
  title: string;                  // 列标题
  width?: number;                 // 列宽度
  type?: ColumnType;              // 列类型
  align?: 'left' | 'center' | 'right';  // 对齐方式
  fixed?: 'left' | 'right';       // 固定列
  sortable?: boolean;             // 是否可排序
  filterable?: boolean;           // 是否可筛选
  editable?: boolean;             // 是否可编辑
  formatter?: (value: unknown) => string;  // 格式化函数
  render?: (value: unknown, row: Row, rowIndex: number) => CellRenderResult;  // 自定义渲染
  editRender?: (value: unknown, row: Row, rowIndex: number) => EditRenderResult;  // 编辑渲染
  children?: Column[];            // 子列（多级表头）
}
```

### 列类型示例

#### 复选框列

```typescript
{
  key: 'selected',
  title: '选择',
  width: 60,
  type: 'checkbox',
  render: (value, row) => ({
    type: 'checkbox',
    checkbox: {
      checked: Boolean(value)
    }
  })
}
```

#### 单选框列

```typescript
{
  key: 'priority',
  title: '优先级',
  width: 150,
  type: 'radio',
  render: (value, row) => ({
    type: 'radio',
    radio: {
      value: value as string,
      options: [
        { label: '高', value: 'high' },
        { label: '中', value: 'medium' },
        { label: '低', value: 'low' }
      ]
    }
  })
}
```

#### 开关列

```typescript
{
  key: 'enabled',
  title: '启用',
  width: 80,
  type: 'switch',
  render: (value, row) => ({
    type: 'switch',
    switch: {
      checked: Boolean(value)
    }
  })
}
```

#### 按钮列

```typescript
{
  key: 'action',
  title: '操作',
  width: 80,
  type: 'button',
  render: () => ({
    type: 'button',
    button: {
      text: '编辑',
      variant: 'primary',  // default | primary | danger | warning | link
      size: 'small'        // small | medium | large
    }
  })
}
```

#### 标签列

```typescript
{
  key: 'status',
  title: '状态',
  width: 100,
  type: 'tag',
  render: (value) => ({
    type: 'tag',
    tags: {
      tags: [{ text: '在职', value: 'active', bgColor: '#52c41a', color: '#fff' }],
      editable: true,
      multiple: false,  // 单选模式
      options: [
        { text: '在职', value: 'active', bgColor: '#52c41a', color: '#fff' },
        { text: '离职', value: 'inactive', bgColor: '#ff4d4f', color: '#fff' }
      ]
    }
  })
}
```

#### 下拉选择列

```typescript
{
  key: 'level',
  title: '级别',
  width: 120,
  type: 'select',
  render: (value) => ({
    type: 'select',
    select: {
      value: value as string,
      options: [
        { label: '初级', value: 'junior' },
        { label: '中级', value: 'middle' },
        { label: '高级', value: 'senior' }
      ],
      placeholder: '请选择'
    }
  })
}
```

#### 进度条列

```typescript
// 基础线型进度条
{
  key: 'progress',
  title: '进度',
  width: 120,
  render: (value) => ({
    type: 'progress',
    progress: {
      value: value as number,
      shape: 'line',           // 线型
      size: 'medium',          // small | medium | large
      showText: true,
      textPosition: 'right'    // inside | right
    }
  })
}

// 带颜色区间的进度条（根据进度自动变色）
{
  key: 'completion',
  title: '完成度',
  width: 150,
  render: (value) => ({
    type: 'progress',
    progress: {
      value: value as number,
      color: [
        { value: 0, color: '#ff4d4f' },     // 红色
        { value: 50, color: '#faad14' },    // 黄色
        { value: 100, color: '#52c41a' }    // 绿色
      ]
    }
  })
}

// 环型进度条
{
  key: 'score',
  title: '得分',
  width: 80,
  render: (value) => ({
    type: 'progress',
    progress: {
      value: value as number,
      shape: 'circle',         // 圆环
      size: 'small',
      format: (v) => `${v}分`
    }
  })
}

// 仪表盘进度条
{
  key: 'dashboard',
  title: '仪表盘',
  width: 100,
  render: (value) => ({
    type: 'progress',
    progress: {
      value: value as number,
      shape: 'dashboard',      // 仪表盘（半圆）
      size: 'medium',
      status: 'success'        // normal | success | warning | error
    }
  })
}

// 可交互进度条（点击调整）
{
  key: 'volume',
  title: '音量',
  width: 100,
  render: (value) => ({
    type: 'progress',
    progress: {
      value: value as number,
      interactive: true,       // 允许点击调整
      shape: 'line'
    }
  })
}

// 自定义圆角进度条
{
  key: 'custom',
  title: '自定义',
  width: 120,
  render: (value) => ({
    type: 'progress',
    progress: {
      value: value as number,
      shape: 'line',
      borderRadius: 0,         // 直角（默认为高度的一半，胶囊形）
      height: 12               // 自定义高度
    }
  })
}
```

#### 自定义渲染

```typescript
{
  key: 'name',
  title: '姓名',
  width: 140,
  render: (value, row, rowIndex) => ({
    type: 'custom',
    customRender: (context) => {
      const { ctx, x, y, width, height, padding, theme } = context;
      // 使用 Canvas API 自定义绘制
      ctx.fillStyle = theme.colors.cellText;
      ctx.fillText(String(value), x + padding, y + height / 2);
    }
  })
}
```

#### 自定义渲染 + 编辑

当使用 `type: 'custom'` 自定义渲染时，可以通过 `editRender` 指定编辑时使用的控件：

```typescript
{
  key: 'priority',
  title: '优先级',
  width: 100,
  editable: true,
  // 自定义显示：图标 + 文字
  render: (value, row) => {
    const icons: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
    return {
      type: 'custom',
      customRender: (ctx) => {
        const { ctx: c, x, y, width, height, padding } = ctx;
        c.font = '14px sans-serif';
        c.fillText(`${icons[value as string] || ''} ${value}`, x + padding, y + height / 2);
      }
    };
  },
  // 编辑时使用 select 下拉框
  editRender: (value, row, rowIndex) => ({
    type: 'select',
    select: {
      options: [
        { label: '🔴 高', value: 'high' },
        { label: '🟡 中', value: 'medium' },
        { label: '🟢 低', value: 'low' }
      ]
    }
  })
}
```

#### 图片列

```typescript
// 单图模式（头像）
{
  key: 'avatar',
  title: '头像',
  width: 80,
  align: 'center',
  editable: true,
  render: (value, row) => ({
    type: 'image',
    image: {
      src: row.data.avatar as string,
      width: 32,
      height: 32,
      circle: true,           // 圆形
      clickable: true,        // 可点击
      hoverable: true,        // 悬浮效果
      onUpload: async (file) => {
        // 自定义上传处理
        return 'https://example.com/avatar.png';
      }
    }
  })
}

// 多图模式（相册）
{
  key: 'photos',
  title: '相册',
  width: 180,
  align: 'center',
  editable: true,
  render: (value, row) => ({
    type: 'image',
    image: {
      images: row.data.photos as string[],
      width: 32,
      height: 32,
      borderRadius: 4,
      gap: 4,
      maxVisible: 4,          // 最多显示数量
      maxCount: 9,            // 最大上传数量
      clickable: true,
      hoverable: true,
      multiple: true,         // 允许多选
      onUpload: async (file) => {
        // 自定义上传处理
        return 'https://example.com/photo.png';
      }
    }
  })
}
```

### 事件回调

#### CellInfo 类型

所有单元格相关事件的回调参数中都包含 `CellInfo` 对象，提供完整的单元格信息：

```typescript
interface CellInfo {
  rowIndex: number;      // 行索引
  columnIndex: number;   // 列索引
  row: Row;              // 行数据对象（包含 id, data, children 等）
  column: Column;        // 列配置对象（包含 key, title, width 等）
}
```

#### 事件回调示例

```typescript
const table = new CanvasTable(container, {
  // ...其他配置

  onCellClick: (cell, event) => {
    console.log('单元格点击:', cell.rowIndex, cell.columnIndex);
    console.log('行数据:', cell.row.data);
    console.log('列配置:', cell.column.key, cell.column.title);
  },
  onCellDoubleClick: (cell, event) => {
    console.log('单元格双击:', cell);
  },
  onSort: (sortInfo) => {
    console.log('排序变化:', sortInfo);
  },
  onFilter: (filters) => {
    console.log('筛选变化:', filters);
  },
  onEditEnd: (cell, value) => {
    console.log('编辑结束:', cell.column.key, value);
    // 可以直接访问行数据进行业务处理
    const rowData = cell.row.data;
  },
  onCheckboxChange: (cell, checked) => {
    console.log('复选框变化:', cell.row.id, checked);
  },
  onRadioChange: (cell, value) => {
    console.log('单选框变化:', cell.column.key, value);
  },
  onSwitchChange: (cell, checked) => {
    console.log('开关变化:', cell.row.data, checked);
  },
  onButtonClick: (cell, actionKey) => {
    console.log('按钮点击:', actionKey, '行数据:', cell.row.data);
  },
  onImageClick: (cell, imageSrc, event) => {
    console.log('图片点击:', imageSrc);
  },
  onScroll: (scrollLeft, scrollTop) => {
    console.log('滚动:', { scrollLeft, scrollTop });
  }
});
```

#### 可用事件列表

| 事件名 | 回调参数 | 说明 |
|--------|----------|------|
| `onCellClick` | `(cell: CellInfo, event: MouseEvent)` | 单元格点击 |
| `onCellDoubleClick` | `(cell: CellInfo, event: MouseEvent)` | 单元格双击 |
| `onCellHover` | `(cell: CellInfo \| null, event: MouseEvent)` | 单元格悬浮 |
| `onEditStart` | `(cell: CellInfo)` | 开始编辑 |
| `onEditEnd` | `(cell: CellInfo, value: unknown)` | 编辑结束 |
| `onCheckboxChange` | `(cell: CellInfo, checked: boolean)` | 复选框变化 |
| `onRadioChange` | `(cell: CellInfo, value: unknown)` | 单选框变化 |
| `onSwitchChange` | `(cell: CellInfo, checked: boolean)` | 开关变化 |
| `onButtonClick` | `(cell: CellInfo, actionKey?: string)` | 按钮点击 |
| `onImageClick` | `(cell: CellInfo, imageSrc: string, event: MouseEvent)` | 图片点击 |
| `onDateSelect` | `(cell: CellInfo, date: string)` | 日期选择 |
| `onSelectChange` | `(cell: CellInfo, value: unknown)` | 下拉选择变化 |
| `onTagsChange` | `(cell: CellInfo, values: string[], isMultiple: boolean)` | 标签变化 |
| `onProgressChange` | `(cell: CellInfo, value: number)` | 进度条变化（可交互模式） |
| `onSort` | `(sortInfo: SortConfig[])` | 排序变化 |
| `onFilter` | `(filters: FilterConfig[])` | 筛选变化 |
| `onScroll` | `(scrollLeft: number, scrollTop: number)` | 滚动变化 |
| `onRowClick` | `(rowIndex: number, event: MouseEvent)` | 行点击 |
| `onRowDoubleClick` | `(rowIndex: number, event: MouseEvent)` | 行双击 |
| `onHeaderClick` | `(column: Column, columnIndex: number, event: MouseEvent)` | 表头点击 |
| `onColumnResize` | `(columnKey: string, width: number)` | 列宽调整 |
| `onExpand` | `(rowIndex: number, expanded: boolean)` | 展开/折叠 |
```

## API 方法

### 数据操作

```typescript
// 设置数据
table.setData({ rows, columns });

// 获取数据
const data = table.getData();

// 获取指定行数据
const rowData = table.getRowData(rowIndex);

// 更新单元格数据
table.updateCell(rowIndex, columnKey, value);
```

### 排序与筛选

```typescript
// 设置排序
table.sort([
  { key: 'age', order: 'desc' },
  { key: 'name', order: 'asc' }
]);

// 清除排序
table.sort([]);

// 设置筛选
table.setFilter('department', ['技术部', '市场部']);

// 清除所有筛选
table.clearFilters();
```

### 选择操作

```typescript
// 选择单元格
table.selectCell(rowIndex, columnIndex);

// 选择行
table.selectRow(rowIndex);

// 选择列
table.selectColumn(columnIndex);

// 获取选中数据
const selection = table.getSelection();

// 清除选择
table.clearSelection();
```

### 主题

```typescript
// 设置主题模式
table.setThemeMode('dark');

// 获取当前主题模式
const mode = table.getThemeMode();

// 设置自定义主题
table.setTheme({
  colors: {
    background: '#1f1f1f',
    headerBackground: '#2d2d2d',
    cellText: '#e0e0e0',
    // ...更多颜色配置
  }
});
```

### 导出

```typescript
// 导出 CSV
const blob = await table.export({ format: 'csv', filename: 'data.csv' });

// 下载文件
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'data.csv';
a.click();
URL.revokeObjectURL(url);
```

### 其他

```typescript
// 滚动到指定位置
table.scrollTo(scrollLeft, scrollTop);

// 滚动到指定行
table.scrollToRow(rowIndex);

// 刷新表格
table.refresh();

// 销毁表格
table.destroy();
```

### 撤销/重做

Canvas Table 支持撤销和重做编辑、新增行、删除行操作：

**快捷键：**
- 撤销：Ctrl+Z (Windows/Linux) / Cmd+Z (macOS)
- 重做：Ctrl+Y (Windows/Linux) / Cmd+Y (macOS)

```typescript
// 撤销上一步操作
table.undo();

// 检查是否可以撤销
if (table.canUndo()) {
  table.undo();
}

// 重做上一步撤销的操作
table.redo();

// 检查是否可以重做
if (table.canRedo()) {
  table.redo();
}

// 获取历史记录数量
const count = table.getHistoryLength();

// 清空历史记录
table.clearHistory();

// 设置历史记录配置（最大保存操作数）
table.setHistoryOptions({ maxActions: 100 }); // 默认 200，设为 0 禁用
```

## 主题定制

### 颜色配置

```typescript
const customTheme: TableTheme = {
  name: 'custom',
  colors: {
    background: '#ffffff',
    headerBackground: '#fafafa',
    headerText: '#333333',
    rowBackground: '#ffffff',
    rowAltBackground: '#fafafa',
    rowHoverBackground: '#e6f4ff',
    rowSelectedBackground: '#1890ff',
    cellText: '#333333',
    cellBorder: '#e8e8e8',
    linkColor: '#1890ff',
    placeholderText: '#bfbfbf',
    
    checkbox: {
      border: '#d9d9d9',
      checkedBg: '#1890ff',
      checkmark: '#ffffff',
      disabledBg: '#f5f5f5'
    },
    
    radio: {
      border: '#d9d9d9',
      checkedBg: '#1890ff',
      dot: '#ffffff',
      disabledBg: '#f5f5f5'
    },
    
    switch: {
      onBg: '#1890ff',
      offBg: '#bfbfbf',
      thumb: '#ffffff',
      disabledOnBg: '#a0cfff',
      disabledOffBg: '#d9d9d9'
    },
    
    button: {
      background: '#ffffff',
      text: '#333333',
      border: '#d9d9d9',
      hoverBg: '#e6e6e6',
      primaryBg: '#1890ff',
      primaryText: '#ffffff',
      dangerBg: '#ff4d4f',
      dangerText: '#ffffff',
      warningBg: '#faad14',
      warningText: '#ffffff',
      linkText: '#1890ff',
      disabledBg: '#f5f5f5',
      disabledText: '#bfbfbf',
      disabledBorder: '#d9d9d9'
    },
    
    tagColors: {
      default: '#f0f0f0',
      primary: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    }
  },
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    size: 13,
    headerSize: 13
  },
  row: {
    height: 32,
    headerHeight: 36
  }
};

table.setTheme(customTheme);
```

## 性能优化

Canvas Table 采用多种优化策略实现大数据量的流畅渲染：

### 虚拟滚动
只渲染可视区域内的单元格，支持百万级数据：
- **1000 行** - 加载时间 < 50ms
- **10000 行** - 加载时间 < 100ms
- **100000 行** - 加载时间 < 500ms
- **1000000 行** - 加载时间 < 2s

### 内存优化
- **历史记录栈**：撤销/重做使用操作记录栈，仅存储变更值，避免深拷贝整个数据集
- **图片懒加载**：仅加载可视区域内的图片，支持大图预览
- **可配置历史记录**：默认保存 200 条操作记录，可根据内存情况调整

## 浏览器支持

- Chrome >= 60
- Firefox >= 55
- Safari >= 12
- Edge >= 79

## License

MIT
