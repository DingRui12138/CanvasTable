import type { TableTheme } from '../../../src/types';
/**
 * 创建默认主题配置
 */
export declare function createMockTheme(): TableTheme;
/**
 * 创建 Mock Canvas Context
 */
export declare function createMockCanvasContext(): CanvasRenderingContext2D;
/**
 * 创建 Mock HTML Canvas Element
 */
export declare function createMockCanvas(): HTMLCanvasElement;
/**
 * 创建测试用的简单列配置
 */
export declare function createTestColumns(): ({
    key: string;
    title: string;
    width: number;
    type: "number";
    editable?: undefined;
} | {
    key: string;
    title: string;
    width: number;
    type: "text";
    editable: boolean;
} | {
    key: string;
    title: string;
    width: number;
    type: "checkbox";
    editable?: undefined;
} | {
    key: string;
    title: string;
    width: number;
    type: "progress";
    editable?: undefined;
})[];
/**
 * 创建测试用的简单行数据
 */
export declare function createTestRows(count?: number): {
    data: {
        id: number;
        name: string;
        active: boolean;
        progress: number;
    };
}[];
//# sourceMappingURL=mockFactories.d.ts.map