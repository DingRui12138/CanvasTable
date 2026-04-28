import type { Row, RowPinPosition } from "../types";

export class RowPinManager {
  private topPinnedRows = new Set<Row>();
  private bottomPinnedRows = new Set<Row>();

  pin(row: Row, position: RowPinPosition): void {
    if (position === "top") {
      this.bottomPinnedRows.delete(row);
      this.topPinnedRows.add(row);
    } else {
      this.topPinnedRows.delete(row);
      this.bottomPinnedRows.add(row);
    }
  }

  remove(row: Row): void {
    this.topPinnedRows.delete(row);
    this.bottomPinnedRows.delete(row);
  }

  clear(): void {
    this.topPinnedRows.clear();
    this.bottomPinnedRows.clear();
  }

  getPosition(row: Row): RowPinPosition | null {
    if (this.topPinnedRows.has(row)) return "top";
    if (this.bottomPinnedRows.has(row)) return "bottom";
    return null;
  }

  isPinned(row: Row): boolean {
    return this.getPosition(row) !== null;
  }

  isPinnedTop(row: Row): boolean {
    return this.topPinnedRows.has(row);
  }

  isPinnedBottom(row: Row): boolean {
    return this.bottomPinnedRows.has(row);
  }

  getTopRows(): Row[] {
    return [...this.topPinnedRows];
  }

  getBottomRows(): Row[] {
    return [...this.bottomPinnedRows];
  }
}
