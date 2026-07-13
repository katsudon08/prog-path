/**
 * CommandItem（FSD: entities/command/ui）
 *
 * 単一コマンドの見た目（アイコン + 名称）を描くプレゼンテーショナルなチップ。
 * 配色は {@link COMMAND_VISUALS} 由来のトークンユーティリティで与え、ライト/ダークに追従する。
 * 色のみに依存させず「色 + アイコン + テキスト」で識別する（→ docs/design-tokens.md §4）。
 *
 * スタックのネストインデント・実行中ハイライト・位置選択ボタンは持たない
 * （それぞれ widgets/command-panel #188・features/command-management #186 の責務）。
 */
import { cn } from "@/shared/lib";

import { COMMAND_VISUALS } from "../model/command-visual";
import type { CommandVisualKey } from "../model/command-visual";

interface CommandItemProps {
  /** 表示するコマンド識別子。 */
  kind: CommandVisualKey;
  /** ループの繰り返し回数。指定時に名称の後ろへ「×N」を添える。 */
  count?: number;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** アイコン + 日本語名のコマンドチップ。 */
export const CommandItem = ({ kind, count, className }: CommandItemProps): React.JSX.Element => {
  const { labelJa, Icon, fillClass, foregroundClass } = COMMAND_VISUALS[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm",
        fillClass,
        foregroundClass,
        className,
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span>
        {labelJa}
        {count == null ? "" : ` ×${count}`}
      </span>
    </span>
  );
};
