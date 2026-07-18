/**
 * CommandPanel（FSD: widgets/command-panel/ui・公開）
 *
 * つくったプログラム（コマンドスタック）を描くプレゼンテーショナル widget。
 * ドメイン状態（命令木・選択中の追加位置・実行中位置）は上位ページ（#190）が保持し、
 * ここは props で受け取る（controlled）。位置選択・個別削除は上位へ通知するだけで、
 * `features/command-management` の純粋関数は呼ばない（型のみ利用）。
 *
 * 見た目状態を持たない（既定選択位置の解決を除き実質 stateless）。削除の確認は上位で行う。
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
  /** ハイライトする追加位置。未指定なら root 末尾を既定選択として描く。 */
  selected?: InsertionPoint;
  /** 実行中コマンドへのパス。未指定なら強調・オートスクロールをしない。 */
  activePath?: CommandPath;
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
  onSelectInsertionPoint,
  onDeleteCommand,
  className,
}: CommandPanelProps): React.JSX.Element => {
  // 既定の選択位置は root 末尾。state に写さず描画時に解決する（controlled を維持）。
  const effectiveSelected: InsertionPoint = selected ?? {
    containerPath: [],
    index: commands.length,
  };

  const context: CommandTreeContext = {
    effectiveSelected,
    activePath,
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
