/**
 * フォルダの型と種別（FSD: entities/folder/model）
 *
 * `Folder` の「単一の正」は shared/db（#179）にあり、本 entity は再定義せず再エクスポートする
 * （→ docs/db-design.md 5.1）。ここでは entity 固有の概念である「フォルダ種別」を定義する。
 * 他 entity（maze / robot / command）は参照しない。
 *
 * 種別は永続フィールドではなく **予約 ID との一致だけ** から導く（→ #192）。フラグを併置すると
 * ID と食い違う余地が生まれ、さらに `maze.folderId` しか持たない呼び出し側が判定できなくなる。
 */
import { z } from "zod";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

export type { Folder } from "@/shared/db";

/**
 * フォルダ種別の名前付き定数。参照側は素の文字列でなく `FOLDER_KIND.TUTORIAL` を使う
 * （→ 単一定義・タイポの型エラー化）。`COMMAND_KIND`・`TILE_KIND` と同じ書式で揃える。
 *
 * **宣言順がサイドバーの表示順を兼ねる**（チュートリアル → ユーザフォルダ → 未分類）。
 * 予約フォルダを先頭と末尾に固定し、間をユーザフォルダにすることで「これは特別」を位置で
 * 伝える（→ docs/screen-specs.md 4.3 / 4.4）。順序を変えると画面が変わるため、並びは
 * types.test.ts と build-folder-sections.test.ts で固定している。
 */
export const FOLDER_KIND = {
  TUTORIAL: "tutorial",
  USER: "user",
  UNCATEGORIZED: "uncategorized",
} as const;

/**
 * 種別識別子の検証に使う enum スキーマ。
 * 種別は通常 {@link getFolderKind} で ID から導くため、これが要るのは外から来た文字列
 * （URL クエリ・保存した表示設定など）を種別として解釈する場面に限られる。
 */
export const FolderKindSchema = z.enum(FOLDER_KIND);

/** フォルダ種別。 */
export type FolderKind = z.infer<typeof FolderKindSchema>;

/** 未知の値を {@link FolderKind} に絞り込む型ガード。 */
export const isFolderKind = (value: unknown): value is FolderKind =>
  FolderKindSchema.safeParse(value).success;

/**
 * フォルダ ID から種別を導く。予約 ID に一致しないものは全てユーザフォルダ。
 *
 * `Folder` ではなく ID を受けるのは、`maze.folderId` しか持たない呼び出し側が
 * フォルダレコードを引かずに判定できるようにするため。
 *
 * **全域関数であり、存在しないフォルダ ID でも `USER` を返す。** 「そのフォルダが実在するか」の
 * 確認は呼び出し側の責務で、本関数は担保しない。
 */
export const getFolderKind = (folderId: string): FolderKind => {
  switch (folderId) {
    case TUTORIAL_FOLDER_ID:
      return FOLDER_KIND.TUTORIAL;
    case UNCATEGORIZED_FOLDER_ID:
      return FOLDER_KIND.UNCATEGORIZED;
    default:
      // 入力は任意の文字列（閉じたユニオンではない）ため網羅チェックの対象外。
      // 予約 ID 以外は全てユーザフォルダ、という全域の既定値をここで与える。
      return FOLDER_KIND.USER;
  }
};
