import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import type { Folder } from "../model/schema";

/** 未分類フォルダの固定名（削除・リネーム不可。→ docs/db-design.md 3.1）。 */
export const UNCATEGORIZED_FOLDER_NAME = "未分類";

/**
 * Zod スキーマ相当の検証インターフェース（`safeParse` のみに依存し zod のクラス階層に結合しない）。
 */
export interface Validatable<T> {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false };
}

/**
 * レコード列をスキーマで検証し、妥当なものと不正なものに振り分ける。
 * 不正データの破棄・復旧（→ docs/db-design.md 7）の判定に用いる純粋関数。
 */
export const partitionValid = <T>(
  rows: readonly unknown[],
  schema: Validatable<T>,
): { valid: T[]; invalid: unknown[] } => {
  const valid: T[] = [];
  const invalid: unknown[] = [];
  for (const row of rows) {
    const result = schema.safeParse(row);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push(row);
    }
  }
  return { valid, invalid };
};

/**
 * 未分類フォルダのレコードを生成する。予約 nil UUID と固定名を持ち、
 * `createdAt` は 0（既定順で常に先頭）。起動時の存在保証で挿入する（→ docs/db-design.md 7）。
 */
export const buildUncategorizedFolder = (): Folder => ({
  id: UNCATEGORIZED_FOLDER_ID,
  name: UNCATEGORIZED_FOLDER_NAME,
  createdAt: 0,
});

/** 未分類フォルダ（予約 ID）が既に存在するか。 */
export const hasUncategorizedFolder = (folders: readonly Folder[]): boolean =>
  folders.some((folder) => folder.id === UNCATEGORIZED_FOLDER_ID);
