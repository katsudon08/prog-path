/**
 * フォルダ一覧をサイドバーの 3 セクションへ振り分ける（FSD: entities/folder/lib）
 *
 * セクションの種別は {@link FOLDER_KIND} をそのまま使う。別の列挙を作ると「種別」と
 * 「セクション」の二重管理になり、片方だけ増えて画面から消える事故が起きるため。
 *
 * 純粋・決定的（`Date.now()` / `crypto.randomUUID()` を呼ばない）。入力配列は破壊しない。
 */
import { FOLDER_KIND, getFolderKind } from "../model/types";
import type { Folder, FolderKind } from "../model/types";

/** サイドバーの 1 セクション。表示順は {@link FOLDER_KIND} の宣言順に従う。 */
export interface FolderSection {
  kind: FolderKind;
  folders: Folder[];
}

/**
 * 作成順（`createdAt` 昇順）。同時刻は id のコードポイント順で決定的に解決する。
 *
 * `localeCompare` は使わない: 実行環境のロケールで結果が変わり、同じデータでも
 * 端末によって並びがぶれる（教室で PC を替えると順序が変わる、という形で表面化する）。
 */
const compareFolders = (a: Folder, b: Folder): number => {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt - b.createdAt;
  }
  if (a.id === b.id) {
    return 0;
  }
  return a.id < b.id ? -1 : 1;
};

/**
 * フォルダ一覧を種別ごとに束ね、表示順に並べたセクション配列を返す。
 *
 * **戻り値は常に長さ 3・固定順。** 予約フォルダが（起動直後や削除直後で）欠けていても
 * そのセクションが空になるだけで、配列の形は変わらない。呼び出し側が「未分類が無い」
 * ケースを分岐せずに済む。
 *
 * @param folders 全フォルダ（順不同）。この配列は変更しない。
 */
export const buildFolderSections = (folders: readonly Folder[]): FolderSection[] => {
  // Record なので種別が増えたら初期化漏れが型エラーになる。
  const groups: Record<FolderKind, Folder[]> = {
    [FOLDER_KIND.TUTORIAL]: [],
    [FOLDER_KIND.USER]: [],
    [FOLDER_KIND.UNCATEGORIZED]: [],
  };
  for (const folder of folders) {
    groups[getFolderKind(folder.id)].push(folder);
  }
  return Object.values(FOLDER_KIND).map((kind) => ({
    kind,
    // sort は groups の配列（このスコープで作った新規配列）に対して行うため入力は無傷。
    folders: groups[kind].sort(compareFolders),
  }));
};
