/**
 * フォルダ種別 → 可否の型付きマッピング（FSD: entities/folder/model）
 *
 * 「未分類は消せない」「チュートリアルの中身はいじれない」といった規則を、条件分岐として
 * 散らさず 1 枚の表に集約する。`Record<FolderKind, ...>` なので種別が増えたら型エラーになる
 * （`TILE_VISUALS` / `COMMAND_VISUALS` と同じ書式）。
 *
 * **「予約フォルダ」でひとくくりにはできない。** 未分類は「出入り自由だが箱を消せない」、
 * チュートリアルは「箱は消せるが中身は読み取り専用」で、可否がほぼ真逆になる。
 * だからこそフラグ 1 個ではなく表で持つ（→ #192 / docs/features.md 3.4）。
 */
import { FOLDER_KIND, getFolderKind } from "./types";
import type { FolderKind } from "./types";

/** 1 種別に許される操作。 */
export interface FolderCapabilities {
  /** フォルダ自体を削除できるか。削除するとフォルダも中の迷路も消える（移動はしない）。 */
  canDeleteFolder: boolean;
  /** フォルダ名を変更できるか。 */
  canRenameFolder: boolean;
  /** 迷路をこのフォルダへ入れる／から出せるか（新規作成・移動・DnD の出入りをまとめて表す）。 */
  canMoveMazesInOut: boolean;
  /** このフォルダに入っている迷路を編集できるか（迷路 1 件への適用は entities/maze の責務）。 */
  canEditMazes: boolean;
  /** このフォルダに入っている迷路を 1 件ずつ削除できるか。 */
  canDeleteMazes: boolean;
}

/**
 * 全種別の可否定義。docs/features.md 3.4 の権限マトリクスがこの表と 1 対 1 で対応する。
 *
 * @remarks チュートリアルの `canDeleteFolder: true` は一見ちぐはぐだが、削除しても起動時
 * （および再生成操作）の存在保証で戻るため復旧不能にならない。「消せない」と説明するより
 * 「消しても戻る」ほうが授業中の事故に強い（→ shared/db の `ensureInitialData`）。
 * `canMoveMazesInOut: false` と併せて、中身は常に教材迷路 6 件の部分集合に保たれる。
 */
export const FOLDER_CAPABILITIES: Record<FolderKind, FolderCapabilities> = {
  [FOLDER_KIND.TUTORIAL]: {
    canDeleteFolder: true,
    canRenameFolder: false,
    canMoveMazesInOut: false,
    canEditMazes: false,
    canDeleteMazes: true,
  },
  [FOLDER_KIND.USER]: {
    canDeleteFolder: true,
    canRenameFolder: true,
    canMoveMazesInOut: true,
    canEditMazes: true,
    canDeleteMazes: true,
  },
  [FOLDER_KIND.UNCATEGORIZED]: {
    canDeleteFolder: false,
    canRenameFolder: false,
    canMoveMazesInOut: true,
    canEditMazes: true,
    canDeleteMazes: true,
  },
};

/**
 * フォルダ ID から可否を引く。種別と同じく予約 ID の一致だけで決まる。
 * 存在しない ID にも `USER` の可否を返す（→ {@link getFolderKind} の全域性）。
 */
export const getFolderCapabilities = (folderId: string): FolderCapabilities =>
  FOLDER_CAPABILITIES[getFolderKind(folderId)];

/**
 * このフォルダに対する「…」メニューを出すべきか（＝削除かリネームのどちらかができるか）。
 *
 * 子どもは無効表示を読まず連打するため、できない操作はグレーアウトせず **DOM から消す**
 * のが本アプリの方針（→ docs/screen-specs.md 4.4）。その唯一の判定条件をここに置く。
 */
export const canManageFolder = (folderId: string): boolean => {
  const { canDeleteFolder, canRenameFolder } = getFolderCapabilities(folderId);
  return canDeleteFolder || canRenameFolder;
};
