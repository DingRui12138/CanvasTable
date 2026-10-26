/**
 * EditorRegistry - 编辑器策略注册表
 *
 * 根据 column.type 或 render result 的 type 决定使用哪个 EditorStrategy。
 * 所有内置类型默认使用 DefaultInteractiveEditor 或 DefaultDomEditor。
 */
import { Column } from "../../types";
import { EditorStrategy } from "./BaseEditor";
export declare class EditorRegistry {
    private strategies;
    constructor();
    /** 注册自定义策略 */
    register(type: string, strategy: EditorStrategy): void;
    /** 获取列对应的编辑器策略 */
    getStrategy(column: Column): EditorStrategy;
    /** 检查列是否是交互式编辑器 */
    isInteractive(column: Column): boolean;
}
//# sourceMappingURL=EditorRegistry.d.ts.map