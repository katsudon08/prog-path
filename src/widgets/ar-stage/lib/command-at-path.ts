/**
 * コマンド木のパス解決と児童向け表示名（FSD: widgets/ar-stage/lib）
 *
 * 削除確認ダイアログ（#239）が「なにを けすのか」を児童へ見せるための純粋関数群。
 * パスの形（root からの index 列。loop の children へはネストして潜る）は
 * features/command-management の {@link CommandPath} が正。
 */
import { COMMAND_VISUALS, isLoopCommand } from "@/entities/command";
import type { Command } from "@/entities/command";
import type { CommandPath } from "@/features/command-management";

/**
 * loop ノードの児童向け表示名。COMMAND_VISUALS の「ループ」ではなく、
 * トースト文言（lib/outcome-message）の「くりかえし」と揃える。
 */
const LOOP_LABEL = "くりかえし";

/**
 * コマンド木から指定パスの命令を取り出す。
 *
 * loop の children へのネストパス（例 `[1, 0]` = 2 番目の loop の最初の子）に対応する。
 * 空パス・範囲外 index・非整数・葉の下へ潜るパスなど、解決できないパスは `null` を返す。
 *
 * @param commands 構築済みコマンド木
 * @param path root から命令へ辿る index 列
 * @returns 解決した命令。解決できないときは null
 */
export const commandAtPath = (commands: readonly Command[], path: CommandPath): Command | null => {
  if (path.length === 0) {
    return null;
  }
  let siblings: readonly Command[] = commands;
  for (let depth = 0; depth < path.length; depth += 1) {
    const index = path[depth];
    if (!Number.isInteger(index) || index < 0 || index >= siblings.length) {
      return null;
    }
    const command = siblings[index];
    if (depth === path.length - 1) {
      return command;
    }
    if (!isLoopCommand(command)) {
      // 葉の下へは潜れない（パスが木より深い）。
      return null;
    }
    siblings = command.children;
  }
  // ループは最終 depth で必ず return する（到達しない）。
  return null;
};

/**
 * 命令の児童向け表示名を返す（削除確認の「『◯◯』を けす？」等に使う）。
 *
 * 葉は COMMAND_VISUALS の labelJa（例「前にすすむ」）、loop は「くりかえし」
 * （{@link LOOP_LABEL}・トースト文言と同じ呼び方）。
 *
 * @param command 表示名を得たい命令
 * @returns 児童向け表示名
 */
export const getCommandLabel = (command: Command): string =>
  isLoopCommand(command) ? LOOP_LABEL : COMMAND_VISUALS[command.kind].labelJa;
