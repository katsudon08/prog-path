/**
 * FolderItem（FSD: entities/folder/ui）
 *
 * サイドバーのフォルダ 1 行（アイコン + 名前 + 迷路の件数 + 行末スロット）を描く
 * プレゼンテーショナルなコンポーネント。種別は `folder.id` から自分で導くため、
 * 呼び出し側が「これはチュートリアルか」を気にする必要はない。
 *
 * **できない操作のメニューは渡されても描かない。** グレーアウトで見せない理由は
 * 「子どもは無効表示を読まず連打する」（→ docs/screen-specs.md 4.4）。これは見た目の
 * 好みではなく安全側の規則なので、消費側の良心に任せずこの最下層で構造的に担保する。
 *
 * **持たないもの**（いずれも上位の責務）:
 * - 折りたたみ状態・セクション見出し・セクション間の区切り線（widgets/maze-library #196）
 * - `<li>` ラッパ（リスト構造を決めるのは並べる側）
 * - ドラッグ&ドロップのドロップ状態・ハンドラ（features/folder-management #194）
 * - 削除・リネームのコールバック（同上。ここは「出す/出さない」の判定までを持つ）
 */
import { cn } from "@/shared/lib";

import { canManageFolder } from "../model/folder-capabilities";
import { FOLDER_VISUALS } from "../model/folder-visual";
import { getFolderKind } from "../model/types";
import type { Folder } from "../model/types";

interface FolderItemProps {
  /** 表示するフォルダ。行に出す名前は常に `folder.name`（種別の呼び名ではない）。 */
  folder: Folder;
  /**
   * このフォルダに入っている迷路の件数。
   * FSD の同一レイヤー参照禁止で entities/maze を参照できないため素の数値で受ける
   * （数え上げは widgets/maze-library #196 の責務）。
   */
  mazeCount: number;
  /** 選択中か。選択は色だけでなく「隆起カード + 太字」で表す。 */
  selected?: boolean;
  /** 行が押されたときに呼ぶ（引数は `folder.id`）。 */
  onSelect: (folderId: string) => void;
  /**
   * 行末に置く「…」メニュー。中身は #194 / #196 が組む。
   * **フォルダ操作が 1 つも許されない種別（未分類）では、渡されても描画しない。**
   */
  menu?: React.ReactNode;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** サイドバーのフォルダ 1 行。 */
export const FolderItem = ({
  folder,
  mazeCount,
  selected = false,
  onSelect,
  menu,
  className,
}: FolderItemProps): React.JSX.Element => {
  const { Icon } = FOLDER_VISUALS[getFolderKind(folder.id)];
  // メニューを出すかは呼び出し側の裁量にせず、種別から決まる可否だけで判定する。
  const showMenu = menu != null && canManageFolder(folder.id);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        // 一覧の中の「いまここ」なので aria-pressed（トグル）ではなく aria-current を使う。
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(folder.id)}
        className={cn(
          "flex min-h-tap min-w-0 flex-1 items-center gap-2 rounded-button px-3 text-start outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // 「隆起カード + 太字」で選択を表し、色だけに依存させない（→ app/routing/theme-toggle）。
          // ring を足すのは、この行が何色の面に置かれるか分からないため。bg-card(slate-2) は
          // bg-background(slate-1) の上だとほぼ同色で、囲んでいる 2〜3 人目（50〜80cm）からは
          // 塗りの差が見えない。カードの「縁」があれば面の色に関係なく浮きが読める。
          selected
            ? "bg-card font-bold text-foreground shadow-sm ring-1 ring-border"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon aria-hidden className="size-6 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-body">{folder.name}</span>
        <span className="shrink-0 text-support tabular-nums">
          {mazeCount}
          <span className="sr-only"> けんの めいろ</span>
        </span>
      </button>
      {showMenu ? menu : null}
    </div>
  );
};
