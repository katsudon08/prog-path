/**
 * CommandNode（FSD: widgets/command-panel/ui・内部）
 *
 * 命令 1 個の行。命令チップ（{@link CommandItem}）＋削除操作を並べ、
 * 実行中（`activePath` 一致）は ring で強調してビューへオートスクロールする。
 * loop ノードは字下げした子 {@link CommandList} を続けて描く（左ボーダーでグルーピング）。
 */
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib";
import { CommandItem, isLoopCommand } from "@/entities/command";
import type { Command } from "@/entities/command";
import type { CommandPath } from "@/features/command-management";

import { isSamePath } from "../lib/command-path";
import { CommandList } from "./command-list";
import type { CommandTreeContext } from "./command-list";
import { DeleteButton } from "./delete-button";

interface CommandNodeProps {
  /** 描画する命令（葉 or loop）。 */
  command: Command;
  /** この命令への root からのパス。 */
  path: CommandPath;
  /** 木全体で共有する表示情報・コールバック。 */
  context: CommandTreeContext;
}

/** 命令 1 個（loop なら子リストを字下げして続ける）を描くノード。 */
export const CommandNode = ({ command, path, context }: CommandNodeProps): React.JSX.Element => {
  const isActive = isSamePath(context.activePath, path);
  const loopCommand = isLoopCommand(command) ? command : null;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 実行が進んだノードを見える位置へ寄せる。中央寄せで上下端の見切れを避ける。
    // jsdom は scrollIntoView 未実装のため optional-call でガード。
    if (isActive) rowRef.current?.scrollIntoView?.({ block: "center" });
  }, [isActive]);

  return (
    <div className="flex flex-col gap-0.5">
      <div
        ref={rowRef}
        aria-current={isActive ? "step" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg p-1 transition-colors",
          isActive && "ring-ring bg-accent ring-2",
        )}
      >
        {/* loop ノードは kind 自体が "loop" なので CommandItem がループチップ（Repeat・×N）を描く。 */}
        <CommandItem kind={command.kind} count={loopCommand?.count} />
        {/* 表示専用（実行フェーズ等）では削除させない。実行中強調・オートスクロールは維持。 */}
        {!context.readOnly && (
          <DeleteButton onDelete={() => context.onDeleteCommand(path)} className="ml-auto" />
        )}
      </div>

      {loopCommand !== null && (
        <div className="border-border ml-2 border-l pl-6">
          <CommandList commands={loopCommand.children} containerPath={path} context={context} />
        </div>
      )}
    </div>
  );
};
