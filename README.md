# Canvas Table

一个基于 Canvas 的高性能数据表格组件，支持百万级数据流畅渲染。

**[在线 Demo](https://your-username.github.io/canvas-table/)**

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
  rows,
  columns,
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
| `rows` | `Row[]` | - | 表格行数据 |
| `columns` | `Column[]` | - | 表格列定义 |
| `width` | `number \| '100%'` | `'100%'` | 表格宽度 |
| `height` | `number \| '100%'` | `'100%'` | 表格高度 |
| `stripeRows` | `boolean` | `false` | 是否显示斑马纹 |
| `hoverable` | `boolean` | `true` | 是否启用行悬浮效果 |
| `themeMode` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题模式 |
| `theme` | `TableTheme` | - | 自定义主题 |
| `selection` | `SelectionOptions` | - | 选择配置 |
| `editing` | `EditingOptions` | - | 编辑配置 |
| `watermark` | `WatermarkOptions` | - | 水印配置 |
| `loadingText` | `string` | `'Loading...'` | Loading overlay 文本 |
| `lazyLoad` | `LazyLoadConfig` | - | 懒加载配置 |
| `imageLoad` | `ImageLoadConfig` | - | 图片加载配置 |
| `rowHeight` | `(row: Row, rowIndex: number) => number` | - | 动态行高计算函数，不指定则使用主题默认行高 |
| `enableRowHeightResize` | `boolean` | `false` | 是否启用拖拽调整行高 |
| `rowResizable` | `boolean \| ((row: Row, rowIndex: number) => boolean)` | `true` | 是否允许调整行高，可按行控制 |
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
      scaleWithRowHeight: false, // 行高变化时保持头像尺寸不变
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
      // maxVisible 不指定时会根据单元格宽高自动计算可显示数量
      scaleWithRowHeight: false, // 行高变大时多排几行，但单张图片仍保持 32px 配置尺寸
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

`ImageConfig` 中和动态行高相关的配置：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | `number` | `32` | 图片目标宽度 |
| `height` | `number` | `32` | 图片目标高度 |
| `scaleWithRowHeight` | `boolean` | `true` | 是否允许图片尺寸随行高放大。设为 `false` 时按标准行高限制单张图片尺寸，行高变大只会让多图有更多可排布行 |
| `maxVisible` | `number` | 自动计算 | 多图最多显示数量。不指定时根据单元格宽高和图片尺寸自动计算 |

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
| `onRowClick` | `(row: Row, rowIndex: number, event: MouseEvent)` | 行点击 |
| `onRowDoubleClick` | `(row: Row, rowIndex: number, event: MouseEvent)` | 行双击 |
| `onRowHeightChange` | `(row: Row, newHeight: number, rowIndex: number)` | 行高拖拽调整完成 |
| `onHeaderClick` | `(column: Column, columnIndex: number, event: MouseEvent)` | 表头点击 |
| `onColumnResize` | `(column: Column, width: number)` | 列宽调整 |
| `onExpand` | `(row: Row, rowIndex: number, expanded: boolean)` | 展开/折叠 |
| `onLoadMore` | `(params: LoadMoreParams)` | 懒加载触发 |
```

## API 方法

### 数据操作

```typescript
// 设置行数据
table.setRows(rows);

// 设置列定义
table.setColumns(columns);

// 获取行数据
const rows = table.getRows();

// 获取列定义
const columns = table.getColumns();

// 获取指定行数据
const rowData = table.getRow(rowIndex);

// 更新单元格数据
table.updateCell(rowIndex, columnKey, value);

// 更新整行数据
table.updateRow(rowIndex, { name: '新名字', age: 30 });

// 新增行
table.addRow({ id: 999, name: '新用户' }, 2);  // 在索引 2 处插入

// 删除行
table.deleteRow(rowIndex);
```

### 排序与筛选

```typescript
// 设置排序
table.sort([
  { key: 'age', order: 'desc' },
  { key: 'name', order: 'asc' }
]);

// 获取当前排序配置
const sortConfig = table.getSortConfig();

// 清除排序
table.sort([]);

// 设置筛选
table.filter([
  { field: 'department', mode: 'select', value: ['技术部', '市场部'] }
]);

// 获取当前筛选配置
const filterConfig = table.getFilterConfig();

// 清除所有筛选
table.clearFilters();

// 调试：打印当前筛选和排序状态
table.debugState();
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
    },

    // 水印配置
    watermark: {
      color: 'rgba(0, 0, 0, 0.15)',  // 水印颜色
      fontSize: 16,                   // 字体大小
      opacity: 1                      // 不透明度
    },

    // Loading overlay 配置
    loading: {
      background: 'rgba(255, 255, 255, 0.85)',  // 背景
      spinnerBorder: '#d9d9d9',                  // Spinner 边框颜色
      spinnerActive: '#1890ff',                  // Spinner 活动颜色
      text: '#333333'                            // 文字颜色
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

### 水印配置

水印样式可通过 `theme.colors.watermark` 统一配置，也支持运行时通过 `setWatermark` 方法覆盖：

```typescript
// 方式一：通过 theme 配置（推荐，跟随主题切换）
const table = new CanvasTable(container, {
  rows,
  columns,
  theme: {
    colors: {
      watermark: {
        color: 'rgba(0, 0, 0, 0.1)',
        fontSize: 14,
        opacity: 0.8
      }
    }
  },
  watermark: {
    enabled: true,
    content: '机密文档'
  }
});

// 方式二：运行时设置（可覆盖 theme 配置）
table.setWatermark({
  enabled: true,
  content: '内部文档',
  color: 'rgba(255, 0, 0, 0.1)',  // 覆盖 theme 中的颜色
  fontSize: 20,                    // 覆盖 theme 中的大小
  rotation: -30,
  gapX: 150,
  gapY: 100
});
```

**WatermarkConfig 配置项：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用水印 |
| `content` | `string` | `'Watermark'` | 水印内容 |
| `fontSize` | `number` | `16` | 字体大小（默认取自 theme） |
| `fontFamily` | `string` | - | 字体（默认取自 theme.font.family） |
| `color` | `string` | - | 颜色（默认取自 theme.colors.watermark.color） |
| `opacity` | `number` | `1` | 不透明度（默认取自 theme） |
| `rotation` | `number` | `-22` | 旋转角度（度） |
| `gapX` | `number` | `100` | 水平间距 |
| `gapY` | `number` | `100` | 垂直间距 |

## 动态行高与行高调整

可以通过 `rowHeight` 按行返回不同高度，也可以开启拖拽调整行高：

```typescript
const table = new CanvasTable(container, {
  rows,
  columns,
  rowHeight: (row, rowIndex) => {
    if (rowIndex % 10 === 0) return 100;
    if (rowIndex % 5 === 0) return 64;
    return 32;
  },
  enableRowHeightResize: true,
  rowResizable: (row) => row.data.locked !== true,
  onRowHeightChange: (row, newHeight, rowIndex) => {
    console.log('行高已调整:', row, newHeight, rowIndex);
  }
});
```

行高拖拽会写入内部覆盖值，优先级高于 `rowHeight` 返回值；数据行对象本身会作为覆盖值的 key，避免和业务数据里的 `id` 字段耦合。

图片列在行高变大后会根据单元格高度自动排布更多图片。如果只想增加可排布行数，不希望单张图片跟着放大，可以在图片配置里设置 `scaleWithRowHeight: false`。

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

## 懒加载

Canvas Table 支持懒加载功能，当用户滚动到表格底部时自动触发加载更多数据，适用于大数据量的分批加载场景。

### 基本用法

```typescript
const table = new CanvasTable(container, {
  rows: initialRows,
  columns,
  lazyLoad: {
    enabled: true,
    threshold: 10  // 距离底部 10 行时触发加载
  },
  onLoadMore: (params) => {
    console.log('触发加载更多:', params);
    // params: { startIndex, scrollTop, direction }

    // 异步加载数据
    fetchData(params.startIndex).then(newRows => {
      if (newRows.length > 0) {
        table.appendRows(newRows);
      } else {
        // 没有更多数据了
        table.setHasMore(false);
      }
    });
  }
});
```

### 配置选项

```typescript
interface LazyLoadConfig {
  enabled: boolean;   // 是否启用懒加载
  threshold?: number; // 触发加载的阈值（距离底部的行数），默认 5
}
```

### API 方法

```typescript
// 追加数据行
table.appendRows(newRows);

// 设置加载状态（防止重复触发）
table.setLoadingMore(true);  // 开始加载
table.setLoadingMore(false); // 加载完成

// 显示/隐藏 loading overlay（阻止所有事件，防止滚动穿透）
table.showLoading('加载中...');  // 显示 loading
table.hideLoading();            // 隐藏 loading

// 设置是否还有更多数据
table.setHasMore(false);  // 没有更多数据，停止加载
table.setHasMore(true);   // 重置，允许继续加载
```

### 完整示例

```typescript
const BATCH_SIZE = 100;
let currentPage = 0;

const table = new CanvasTable(container, {
  rows: [],
  columns,
  loadingText: '加载中...',  // loading overlay 文本
  lazyLoad: {
    enabled: true,
    threshold: 15
  },
  onLoadMore: async (params) => {
    console.log(`加载第 ${currentPage + 1} 页数据`);

    // 显示 loading overlay（阻止事件，防止滚动穿透到 body）
    table.showLoading('加载更多数据...');
    table.setLoadingMore(true);

    try {
      const response = await fetch(`/api/data?page=${currentPage}&size=${BATCH_SIZE}`);
      const data = await response.json();

      if (data.rows.length === 0) {
        // 没有更多数据
        table.setHasMore(false);
        table.hideLoading();
        console.log('已加载全部数据');
      } else {
        // 追加数据
        table.appendRows(data.rows);
        currentPage++;
        table.hideLoading();

        // 如果返回数据少于请求数量，说明没有更多了
        if (data.rows.length < BATCH_SIZE) {
          table.setHasMore(false);
        }
      }
    } catch (error) {
      console.error('加载失败:', error);
      // 加载失败，隐藏 loading 并重置状态
      table.hideLoading();
      table.setLoadingMore(false);
    }
  }
});
```

### 注意事项

1. **防重复触发**：在 `onLoadMore` 回调中，表格会自动设置 `isLoadingMore` 状态，防止滚动过程中重复触发。加载完成后调用 `appendRows` 会自动重置该状态。

2. **防止滚动穿透**：使用 `showLoading()` 显示 loading overlay 时，会阻止所有事件（包括滚动事件），防止用户滚动触发加载更多时，滚动事件传递到 body 导致页面滚动。

3. **加载完成**：当没有更多数据时，必须调用 `setHasMore(false)` 告知表格加载已完成，否则用户继续滚动时会不断触发 `onLoadMore`。

4. **错误处理**：如果加载失败，需要调用 `hideLoading()` 和 `setLoadingMore(false)` 重置状态，允许用户重试。

5. **性能建议**：每次加载的数据量不宜过大，建议 50-200 条，以保证追加时的渲染性能。

## 图片加载配置

Canvas Table 内置图片加载队列，支持并发限制、缓存管理和延迟加载。

### 配置选项

```typescript
interface ImageLoadConfig {
  /** 最大并发加载数，默认 6 */
  maxConcurrent?: number;
  /** 缓存最大数量，默认 200 */
  maxCacheSize?: number;
  /** 是否启用图片加载队列，默认 true */
  enabled?: boolean;
}
```

### 基本用法

```typescript
const table = new CanvasTable(container, {
  rows,
  columns,
  imageLoad: {
    enabled: true,
    maxConcurrent: 6,   // 同时最多加载 6 张图片
    maxCacheSize: 200   // 最多缓存 200 张图片
  }
});

// 运行时修改配置
table.setImageLoadConfig({
  maxConcurrent: 3
});

// 获取加载统计信息
const stats = table.getImageLoadStats();
// { pending: 5, loading: 2, cached: 50, failed: 1 }
```

### 加载策略

- **立即加载**：图片请求进入队列后立即开始加载（如果并发有空位）
- **加载完成后继续**：一张图片加载完成后自动继续加载队列中的下一张
- **并发限制**：同时最多加载 `maxConcurrent` 张图片，避免过多请求阻塞网络
- **LRU 缓存**：缓存最多 `maxCacheSize` 张图片，超出时自动淘汰最早加载的图片

## 浏览器支持

- Chrome >= 60
- Firefox >= 55
- Safari >= 12
- Edge >= 79

## License

MIT
