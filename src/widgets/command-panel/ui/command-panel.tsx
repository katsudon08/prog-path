/**
 * CommandPanel（FSD: widgets/command-panel/ui・公開）
 *
 * つくったプログラム（コマンドスタック）を描くプレゼンテーショナル widget。
 * ドメイン状態（命令木・選択中の追加位置・実行中位置）は上位ページ（#190）が保持し、
 * ここは props で受け取る（controlled）。位置選択・個別削除は上位へ通知するだけで、
 * `features/command-management` の純粋関数は呼ばない（型のみ利用）。
 *
 * 見た目状態を持たない（既定選択位置の解決を除き実質 stateless）。削除の確認は上位で行う。
 *
 * ## フェーズ（編集 / 実行）
 * 同じ widget を2フェーズで使う。編集フェーズは追加スロット・削除ボタンで命令木を組み立て、
 * `selected` で次の追加位置を示す。実行フェーズは `activePath` で実行中命令を強調しオートスクロール
 * する。`readOnly` を `true` にすると追加スロット・削除ボタンを描かず「実行中は編集不可」を担保する
 * （`readOnly` は「実行」語彙を持たない最小プリミティブ。`activePath` と組み合わせて実行ビューを表現）。
 *
 * ## `selected` の正しさ＝親の責務（忠実な鏡）
 * widget は与えられた `selected` を忠実に描くだけで、自己修復はしない。木に存在しない位置を渡されれば
 * どのスロットにも一致せず何も強調しない。`selected` 未指定でも末尾等を推測せず、どのスロットも強調しない
 * （真の追加位置は `openLoopPaths` 依存で features 側しか知らないため）。削除で命令木が変わったら、親は
 * `deleteCommandAt` の `outcome.nextInsertionPoint` を使って `selected` を再同期すること（stale を残さない）。
 */
import { cn } from "@/shared/lib";
import type { Command } from "@/entities/command";
import type { CommandPath, InsertionPoint } from "@/features/command-management";

import { CommandList } from "./command-list";
import type { CommandTreeContext } from "./command-list";

/** {@link CommandPanel} の props。 */
export interface CommandPanelProps {
  /** 表示するコマンド木（root の命令配列）。controlled。 */
  commands: readonly Command[];
  /** ハイライトする追加位置。未指定ならどのスロットも既定ハイライトしない（正しい追加位置は親が渡す）。 */
  selected?: InsertionPoint;
  /** 実行中コマンドへのパス。未指定なら強調・オートスクロールをしない。 */
  activePath?: CommandPath;
  /**
   * 表示専用フラグ。実行フェーズなど編集させたくないとき `true`。
   * `true` のあいだ追加スロット・削除ボタンを描かない（実行中は編集不可を担保）。
   */
  readOnly?: boolean;
  /** 位置選択ボタン押下時に対応する {@link InsertionPoint} を通知。 */
  onSelectInsertionPoint: (point: InsertionPoint) => void;
  /** 個別削除時に対象 {@link CommandPath} を通知（確認は上位で行う）。 */
  onDeleteCommand: (path: CommandPath) => void;
  /** 既定クラスの上書き・拡張（cn 経由・末尾）。 */
  className?: string;
}

/** コマンドスタック表示・位置選択・個別削除をまとめる widget。 */
export const CommandPanel = ({
  commands,
  selected,
  activePath,
  readOnly = false,
  onSelectInsertionPoint,
  onDeleteCommand,
  className,
}: CommandPanelProps): React.JSX.Element => {
  const context: CommandTreeContext = {
    selected,
    activePath,
    readOnly,
    onSelectInsertionPoint,
    onDeleteCommand,
  };

  return (
    <div
      aria-label="つくったプログラム"
      // overflow-y-auto は overflow-x も実質 auto 化するため、左右パディングで実行中強調(ring-2)の
      // 見切れを防ぐ。下パディングで最下部行の見切れも防ぐ。
      className={cn("flex min-h-0 flex-col gap-1 overflow-y-auto px-1.5 py-1", className)}
    >
      {commands.length === 0 && (
        <p className="text-muted-foreground px-2 py-1 text-sm">
          まだ命令がありません。カードをよみとってついかしよう。
        </p>
      )}
      <CommandList commands={commands} containerPath={[]} context={context} />
    </div>
  );
};
