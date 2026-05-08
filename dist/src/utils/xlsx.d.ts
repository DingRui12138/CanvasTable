import type { ExcelExportOptions, ExportContext, ExportMerge } from "../types";
export interface ExcelSheetModel {
    sheetName: string;
    columns: Array<{
        key: string;
        width?: number;
    }>;
    rows: Array<{
        kind: "header" | "body" | "summary";
        cells: Array<{
            value: string | number | boolean | Date | null;
            type: "string" | "number" | "boolean" | "date" | "blank";
            styleId?: number;
        }>;
    }>;
    merges: ExportMerge[];
    freeze?: {
        xSplit: number;
        ySplit: number;
        topLeftCell: string;
    };
    styles: Array<{
        numFmtId?: number;
    }>;
    numFmts: Array<{
        id: number;
        formatCode: string;
    }>;
}
export declare function buildExcelExportModel(context: ExportContext, options: ExcelExportOptions | undefined, sheetName: string): ExcelSheetModel;
export declare function createXlsxBlobFromModel(model: ExcelSheetModel): Blob;
export declare function createXlsxBlob(data: unknown[][], sheetName?: string): Blob;
//# sourceMappingURL=xlsx.d.ts.map