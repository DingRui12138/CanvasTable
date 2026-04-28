import type { Row, RowPinPosition } from "../types";
export declare class RowPinManager {
    private topPinnedRows;
    private bottomPinnedRows;
    pin(row: Row, position: RowPinPosition): void;
    remove(row: Row): void;
    clear(): void;
    getPosition(row: Row): RowPinPosition | null;
    isPinned(row: Row): boolean;
    isPinnedTop(row: Row): boolean;
    isPinnedBottom(row: Row): boolean;
    getTopRows(): Row[];
    getBottomRows(): Row[];
}
//# sourceMappingURL=RowPinManager.d.ts.map