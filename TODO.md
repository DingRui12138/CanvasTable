# Canvas Table 功能清单

## 已完成功能

### 核心功能

- [x] 虚拟滚动 - 支持百万级数据渲染
- [x] 多级表头 - 无限层级嵌套列分组
- [x] 固定列 - 左侧/右侧固定
- [x] 固定行 - 支持顶部/底部固定，固定区支持编辑、hover、选择、图片加载和固定列交互
- [x] 合计行 - 支持顶部/底部合计、当前视图/全量数据范围、跨列合计单元格、固定列/隐藏列占位对齐和 Excel 导出
- [x] 合并单元格 - 行合并/列合并
- [x] 层级数据 - 树形结构展示，展开/折叠
- [x] 列宽调整 - 拖拽调整列宽
- [x] 行高调整 - 支持动态行高、拖拽调整行高、按行配置是否可调整
- [x] 列拖拽重排 - 拖拽调整列顺序
- [x] 列隐藏/显示 - 支持动态隐藏/显示列
- [x] 行号列 - 显示行号
- [x] 复制 - Ctrl+C 复制单元格数据

### 列类型

- [x] text - 文本
- [x] number - 数字
- [x] date - 日期选择
- [x] checkbox - 复选框
- [x] radio - 单选框
- [x] switch - 开关
- [x] button - 按钮
- [x] buttons - 多按钮
- [x] tag - 标签（单选/多选）
- [x] select - 下拉选择
- [x] input - 输入框（支持多行）
- [x] link - 超链接
- [x] image - 图片（单图/多图、上传、预览，支持动态行高下多行排布和固定图片尺寸配置）
- [x] progress - 进度条（线型/环型/仪表盘、颜色区间、可交互、圆角）
- [x] custom - 自定义渲染

### 交互功能

- [x] 排序 - 单列/多列排序
- [x] 筛选 - 列筛选
- [x] 选择 - 单元格/行/列/范围选择
- [x] 编辑 - 双击/键盘进入编辑模式
- [x] 编辑校验提示 - 支持列级同步校验、异步校验（Promise）、错误边框、错误 tooltip、warning 级别、蓝色脉冲 pending 动画、错误查询/清理 API
- [x] 右键菜单 - 增删行操作、固定/取消固定行
- [x] 键盘导航 - 方向键导航
- [x] Tooltip - 文本溢出提示
- [x] 撤销/重做 - Ctrl+Z/Ctrl+Y (Windows/Linux)、Cmd+Z/Cmd+Y (macOS)

### 主题与样式

- [x] 主题 - 亮色/暗色/自动模式
- [x] 多语言 - 内置中文/英文文案，支持运行时切换和自定义文案覆盖
- [x] 滚动条主题 - 统一滚动条颜色配置，支持透明度
- [x] 水印 - 自定义水印
- [x] 斑马纹
- [x] 行悬浮效果

### 事件系统

- [x] 丰富的事件回调 - 单元格点击、双击、悬浮等
- [x] CellInfo 增强 - 事件参数包含完整 row 和 column 数据
- [x] 控件事件 - checkbox、radio、switch、button 等变化事件
- [x] 图片事件 - 点击、上传、删除等

### JSX 自定义渲染系统

- [x] **JSX 元素树** - CTElement 树形结构（CTBox / CTCircle / CTText / CTImage / CTLine）
- [x] **Flex 布局引擎** - flexDirection、justifyContent、alignItems、gap、padding、margin
- [x] **尺寸约束** - minWidth/maxWidth/minHeight/maxHeight、百分比 width/height（"100%"）
- [x] **alignSelf 覆盖** - 子元素交叉轴对齐覆盖父级 alignItems
- [x] **定位模式** - position="relative" 子元素 x/y/zIndex 绝对定位
- [x] **Canvas2D 渲染器** - 背景色、渐变、圆角、边框（统一 + 单侧）、阴影、裁剪、透明度
- [x] **文本增强** - textAlign、textDecoration（underline/line-through）、letterSpacing
- [x] **公共组件** - Box、Row、Column、Stack、Text、Circle、Image、Line + createCTElement
- [x] **属性别名** - bgColor、radius、direction、align、justify、mg、shadow、gradient、clip 等 CSS 风格简写
- [x] **根元素撑满单元格** - 无内置 padding/居中，根元素默认 width/height "100%"

### 其他特性

- [x] 导出 CSV
- [x] 自适应布局
- [x] 撤销/重做 - Ctrl+Z/Ctrl+Y (Windows/Linux)、Cmd+Z/Cmd+Y (macOS)，支持单元格编辑、新增行、删除行操作
- [x] 编辑历史 - 按操作顺序记录，可配置最大保存数量（默认 200）

---

## 待开发功能

### 核心功能

#### 高优先级

- [x] **Excel 导出第一版** - `ExportOptions.format: 'excel'` 已生成真实 `.xlsx` 单 Sheet 文本工作簿

#### 中优先级

- [x] **固定行** - 类似固定列，支持顶部/底部固定
- [ ] **列分组折叠** - 多级表头可折叠展开
- [x] **JSON 导出** - 已实现二维导出数据 JSON 输出

#### 低优先级

- [ ] **打印功能**

### 列类型

#### 中优先级

- [x] **评分列** - 星级评分组件
- [x] **颜色选择器列**
- [ ] **图标列** - 显示图标

#### 低优先级

- [ ] **文件列** - 文件上传/下载
- [ ] **富文本列** - 简单的富文本显示

### JSX 组件增强

- [ ] **更多内置组件** - 增加 JSX 内置组件种类（如 Badge、Avatar、ProgressBar、Icon 等）
- [ ] **hover/active 样式状态** - CTStyles 支持 hover/active 视觉反馈
- [ ] **图片实际渲染** - CTImage src 加载真实图片
- [ ] **交互事件** - JSX 元素点击、hover 等交互回调

#### JSX 内置组件设计规范

- [ ] **组件分层** - 基础绘制组件继续由 `CTRenderer` 直接绘制；数据展示组件优先复用基础组件或现有 renderer；交互浮层组件只在 cell 内绘制 trigger，浮层交给 overlay/handler 处理。
- [ ] **统一 props 风格** - 内置组件统一支持 `width`、`height`、`margin`、`padding`、`color`、`bgColor`、`radius`、`borderColor`、`borderWidth`、`disabled`、`opacity` 等通用属性，并在 `props.ts` 内归一化别名。
- [ ] **展示型组件优先降级为基础组件树** - `CTDate`、`CTBadge`、`CTTag` 等优先在组件函数内组合 `CTBox` / `CTText` / `CTCircle`，减少 `CTRenderer` 分支。
- [ ] **资源型组件复用现有运行时** - `CTImage` 不重新实现图片加载，应复用现有 `ImageRenderer`、图片缓存、加载队列、失败态、懒加载和可视区收集逻辑。
- [ ] **交互型组件登记命中区域** - `CTTooltip`、`CTDropdown` 等通过 layout 结果派生 `CTInteractiveRegion`，由 `InteractionManager` / 对应 handler 处理 hover、click、outside click、滚动关闭和 overlay 绘制。
- [ ] **统一渲染上下文** - 为 JSX 渲染引入 `CTRenderContext`，集中提供 `ctx`、`theme`、`trace`、`imageRuntime`、当前行列信息、cell rect 和交互区域收集回调。
- [ ] **绘制边界清晰** - cell 内内容由 `CTRenderer` 绘制；cell 外 tooltip、dropdown、图片预览等浮层由 renderer overlay 或现有 handler 绘制，避免普通 cell render 流程直接画浮层。
- [ ] **缓存安全规则** - layout cache 只接受 primitive、plain object、array 等可稳定序列化 props；包含 function、symbol、bigint、Date 实例、DOM 对象或 class instance 的 JSX 树应绕过跨 cell layout cache。
- [ ] **推荐实现顺序** - 先补 `CTRenderContext` / `CTInteractiveRegion` 基础设施，再实现 `CTDate`，随后接入真实 `CTImage`，最后实现 `CTTooltip` 和 `CTDropdown`。

### 编辑功能

- [x] **编辑校验提示** - 显示校验错误信息，校验失败不写入数据，支持同步和异步校验
- [ ] **批量编辑** - 选中多个单元格批量修改

### 筛选功能

- [x] **高级筛选** - 多条件组合筛选
- [ ] **筛选保存/加载** - 保存常用筛选条件
- [ ] **筛选高亮** - 高亮显示筛选匹配内容

### 其他功能

#### 高优先级

- [x] **Loading 状态** - 支持 `loading`、`loadingText`、`showLoading()` / `hideLoading()`，并接入多语言默认文案
- [x] **空数据状态** - 支持 `emptyText`，并接入多语言默认文案
- [ ] **查找功能** - Ctrl+F 查找数据

#### 中优先级

- [ ] **视图保存/加载** - 保存/加载列配置、筛选等视图状态
- [ ] **分组统计** - 按列分组后的聚合统计
- [ ] **注释/批注** - 单元格添加批注

#### 低优先级

- [x] **数据懒加载** - 滚动时动态加载数据
- [ ] **数据透视表** - 简单的数据透视功能

---

## 功能增强

### 现有功能优化

- [ ] **筛选增强** - 支持更多筛选操作符（包含、正则等）
- [ ] **排序增强** - 支持自定义排序函数
- [ ] **选择增强** - 支持跨页选择
- [x] **编辑增强** - 支持自定义列编辑渲染 (editRender)
- [ ] **主题增强** - 支持更多预设主题
- [x] **性能优化** - 优化固定行、行高调整、图片可视区检测和 mousemove 热路径，减少大数据量下不必要的重绘与遍历

### 文档完善

- [x] API 文档完善
- [ ] 更多使用示例
- [ ] 最佳实践指南
- [ ] 性能优化指南

---

## 已修复 Bug

- [x] ~~handleResize 和 handleWindowResize 合并~~
- [x] ~~link 列类型渲染问题~~
- [x] ~~图片列上传点击触发 Image Click 问题~~
- [x] ~~图片列点击图片无法触发 imageClick~~
- [x] ~~图片列 editable/disabled 未生效~~
- [x] ~~头像列编辑取消后数据错误~~
- [x] ~~图片 tooltip hover 边框显示问题~~
- [x] ~~滚动条覆盖图片 hover 边框~~
- [x] ~~Select/Tags dropdown 滚动条未使用主题颜色~~
- [x] ~~事件回调参数仅包含 CellPosition，缺少 row/column 数据~~
- [x] ~~图片列配置冗余 - 移除 column.image 属性，统一使用 render 函数配置~~
- [x] ~~动态行高下图片列只渲染一行 - 多图按单元格高度自动排布，并支持 `scaleWithRowHeight: false` 固定图片尺寸~~
- [x] ~~各控件配置 disabled 冗余 - disabled 为列通用属性，已从 CheckboxConfig、RadioConfig、ButtonConfig、SwitchConfig、InputConfig、SelectConfig、TagsConfig、DateConfig、ProgressConfig 中移除，统一使用 column.disabled~~
- [x] ~~内存优化 - 移除 originalRows 深拷贝，改用历史记录栈存储操作，大幅降低内存占用~~
- [x] ~~大数据量崩溃 - 优化示例数据生成，减少图片数组数量~~
- [x] ~~自定义列 customRender 导致错位 - 统一在 renderCellContentInternal 中使用 ctx.save/restore 保护所有单元格渲染~~
- [x] ~~number 列编辑后不显示内容 - 编辑结束渲染时 editingCell 状态未清除导致跳过单元格渲染；空值不显示 placeholder~~

---

## 优化重构计划

> 基于 2024-03 深度代码分析

### 代码统计

| 模块               | 行数       | 方法数 | 备注         |
| ------------------ | ---------- | ------ | ------------ |
| InteractionManager | 5,551      | 117    | ⚠️ God Class |
| Renderer           | 2,859      | 58     | 较大         |
| LayoutManager      | 1,498      | 39     | 正常         |
| DataManager        | 1,325      | 34     | 正常         |
| EditorManager      | 733        | 22     | 正常         |
| **总计**           | **17,069** | -      | src/ 目录    |

### 阶段一：紧急修复（Phase 1）

- [x] ~~**修复内存泄漏** - `destroy()` 已添加 `editorManager.destroy()` 调用~~
- [x] ~~**图片缓存优化** - 已实现 LRU 缓存（最大 200 张图片），防止大量图片导致内存溢出~~
- [x] ~~**统一 editable/disabled 检查** - 已通过 `validateCellForEditing` 方法统一检查 `column.editable` 和 `column.disabled`，所有 `start*Editing` 方法均已调用此方法。`disabled` 已从各类型配置中移除，统一使用 `column.disabled`。~~

### 阶段二：核心重构（Phase 2）

- [x] **InteractionManager 拆分** - 拆分为 5-6 个子模块
  - SelectionHandler - 处理选择逻辑
  - EditingHandler - 处理编辑逻辑
  - NavigationHandler - 处理键盘导航
  - DragHandler - 处理拖拽逻辑
  - EventHandler - 处理事件分发
  - ClipboardHandler - 处理复制粘贴

- [x] **Renderer 策略模式重构** - 使用策略模式处理不同列类型渲染
  - TextRenderer
  - NumberRenderer
  - DateRenderer
  - CheckboxRenderer
  - SelectRenderer
  - TagsRenderer
  - ImageRenderer
  - ProgressRenderer
  - CustomRenderer

### 阶段三：架构改进（Phase 3）

- [ ] **依赖注入** - 引入 DI 容器，解耦模块依赖
- [ ] **类型系统增强** - 减少 any 使用，增强类型推导
- [ ] **测试覆盖率提升** - 目标 80% 覆盖率
- [ ] **事件系统重构** - 使用 TypedEventEmitter 替代 EventEmitter

### 阶段四：性能优化（Phase 4）

- [ ] **渲染批处理** - 合并多次 render 调用
- [ ] **Web Worker 支持** - 大数据量计算移至 Worker
- [ ] **虚拟化增强** - 优化虚拟滚动算法
- [ ] **内存优化** - 对象池、缓存策略

### 代码质量改进

- [ ] **移除魔法数字** - 提取为常量 (src/constants/)
- [ ] **统一错误处理** - 创建自定义错误类
- [ ] **日志系统** - 添加可配置的日志级别
- [ ] **文档注释** - 补充 JSDoc 注释

### 技术债务

| 问题                          | 严重程度 | 状态   |
| ----------------------------- | -------- | ------ |
| InteractionManager 代码量过大 | 高       | 待处理 |
| Renderer 缺少单元测试         | 高       | 待处理 |
| 类型定义分散                  | 中       | 待处理 |
| 部分函数过长                  | 中       | 待处理 |
| 缺少性能监控                  | 低       | 待处理 |
