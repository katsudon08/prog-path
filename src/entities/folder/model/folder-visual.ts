/**
 * フォルダ種別 → 見た目（アイコン・呼び名）の型付きマッピング（FSD: entities/folder/model）
 *
 * 種別を **色ではなくアイコンと位置** で区別する。サイドバーは選択状態にも色を使うため、
 * ここで色を足すと「選択されているのか特別なフォルダなのか」が読めなくなる
 * （→ docs/design-tokens.md §4 の「色のみに依存させない」）。
 */
// lucide の `Folder` はドメイン型 `Folder`（shared/db）と同名。同一ファイルで両方を扱う
// 可能性があるため、アイコン側を必ず `FolderIcon` にエイリアスして取り違えを防ぐ。
import { Folder as FolderIcon, GraduationCap, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FOLDER_KIND } from "./types";
import type { FolderKind } from "./types";

/** 1 種別の見た目定義。 */
export interface FolderVisual {
  /**
   * 種別そのものの呼び名。**フォルダ行に表示する名前ではない**（行は必ず `folder.name` を出す）。
   * 見出しを持たないセクションの読み上げ名・凡例に使う。表記は docs/screen-specs.md 4.1 の
   * モックに合わせている。
   */
  labelJa: string;
  /** lucide アイコンコンポーネント。 */
  Icon: LucideIcon;
}

/**
 * 全種別の見た目定義。`Record` により追加漏れは型エラーになる。
 *
 * @remarks 未分類の `labelJa`（みぶんるい）と DB の固定名（未分類）が食い違っている。
 * モックはひらがな、シードは漢字で、どちらに寄せるかは未決（→ #196）。行に出るのは
 * `folder.name` なので画面上は漢字が正となる。
 */
export const FOLDER_VISUALS: Record<FolderKind, FolderVisual> = {
  [FOLDER_KIND.TUTORIAL]: { labelJa: "チュートリアル", Icon: GraduationCap },
  [FOLDER_KIND.USER]: { labelJa: "フォルダ", Icon: FolderIcon },
  [FOLDER_KIND.UNCATEGORIZED]: { labelJa: "みぶんるい", Icon: Inbox },
};
