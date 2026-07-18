/**
 * CommandList（FSD: widgets/command-panel/ui・内部）
 *
 * 1 コンテナ（root の命令配列、または loop の children）を描く再帰の境界。
 * 各コンテナで `slot(0) node[0] slot(1) node[1] … node[n-1] slot(n)` と
 * スロット（追加位置）とノード（命令）を交互配置する（スロットは length+1 個）。
 * 空コンテナでも index0 スロットを 1 つ描く（最初の 1 個を追加できる場所）。
 *
 * 再帰は `CommandList → CommandNode(loop) → CommandList` のサイクル。CommandList が唯一の再帰境界。
 */
import { cn } from "@/shared/lib";
import type { Command } from "@/entities/command";
import type { CommandPath, InsertionPoint } from "@/features/command-management";

import { commandPathKey, isSameInsertionPoint, isTailInsertionPoint } from "../lib/command-path";
import { CommandNode } from "./command-node";
import { InsertionSlot } from "./insertion-slot";

/**
 * 再帰描画で全ノードへ引き回す表示情報とコールバックの束。
 *
 * React Context ではなく素の props として明示的に手渡す（controlled・追跡容易のため）。
 * `effectiveSelected` は既定（未指定なら root 末尾）を解決済みの単一の挿入位置。
 */
export interface CommandTreeContext {
  /** ハイライトする追加位置（既定解決済み・単一）。 */
  effectiveSelected: InsertionPoint;
  /** 実行中コマンドへのパス。未指定なら強調・オートスクロールをしない。 */
  activePath?: CommandPath;
  /** 位置選択スロット押下時に対応する挿入位置を通知。 */
  onSelectInsertionPoint: (point: InsertionPoint) => void;
  /** 削除ボタン押下時に対象コマンドパスを上位へ通知（確認は上位で行う）。 */
  onDeleteCommand: (path: CommandPath) => void;
}

interface CommandListProps {
  /** このコンテナ（root または loop の children）の命令配列。 */
  commands: readonly Command[];
  /** このコンテナへのパス。root は `[]`、loop children はその loop 自身のパス。 */
  containerPath: CommandPath;
  /** 木全体で共有する表示情報・コールバック。 */
  context: CommandTreeContext;
  /** 既定クラスの上書き・拡張（cn 経由・末尾）。 */
  className?: string;
}

/** スロットとノードを交互配置した 1 コンテナの縦リスト。 */
export const CommandList = ({
  commands,
  containerPath,
  context,
  className,
}: CommandListProps): React.JSX.Element => {
  const containerKey = commandPathKey(containerPath);
  const items: React.JSX.Element[] = [];

  // index を 0..length まで回し、スロット→（末尾以外は）ノード の順に積む。
  for (let index = 0; index <= commands.length; index += 1) {
    const point: InsertionPoint = { containerPath, index };
    items.push(
      <InsertionSlot
        key={`slot-${containerKey}-${index}`}
        point={point}
        selected={isSameInsertionPoint(context.effectiveSelected, point)}
        isTail={isTailInsertionPoint(point, commands.length)}
        onSelect={context.onSelectInsertionPoint}
      />,
    );

    if (index < commands.length) {
      const childPath: CommandPath = [...containerPath, index];
      items.push(
        <CommandNode
          key={`node-${commandPathKey(childPath)}`}
          command={commands[index]}
          path={childPath}
          context={context}
        />,
      );
    }
  }

  return <div className={cn("flex flex-col gap-0.5", className)}>{items}</div>;
};
