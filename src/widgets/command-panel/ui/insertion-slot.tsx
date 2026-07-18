/**
 * InsertionSlot（FSD: widgets/command-panel/ui・内部）
 *
 * 命令と命令のあいだ・コンテナの先頭/末尾に置く「追加位置」を選ぶボタン 1 個。
 * 選択（ハイライト）状態は上位（controlled）から受け取り、押下で対応する
 * {@link InsertionPoint} を通知するだけの見た目部品。
 */
import { Plus } from "lucide-react";

import { cn } from "@/shared/lib";
import type { InsertionPoint } from "@/features/command-management";

interface InsertionSlotProps {
  /** このスロットが表す挿入位置。 */
  point: InsertionPoint;
  /** 現在ハイライト（選択中）かどうか。 */
  selected: boolean;
  /** コンテナ末尾（既定の追加位置）のスロットか。ラベル・見た目を少し強める。 */
  isTail?: boolean;
  /** 押下時に対応する挿入位置を通知。 */
  onSelect: (point: InsertionPoint) => void;
  /** 既定クラスの上書き・拡張（cn 経由・末尾）。 */
  className?: string;
}

/** 追加位置を選ぶ横並びのラインボタン。選択中は primary で強調する。 */
export const InsertionSlot = ({
  point,
  selected,
  isTail = false,
  onSelect,
  className,
}: InsertionSlotProps): React.JSX.Element => {
  const line = cn(
    "h-0.5 flex-1 rounded-full transition-colors",
    selected ? "bg-primary" : "bg-muted group-hover:bg-border",
  );

  return (
    <button
      type="button"
      aria-label="ここに追加"
      aria-pressed={selected}
      onClick={() => onSelect(point)}
      className={cn(
        "group flex w-full items-center gap-1 rounded-md px-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        isTail ? "min-h-8 py-1" : "min-h-6 py-0.5",
        className,
      )}
    >
      <span aria-hidden className={line} />
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-opacity",
          selected
            ? "bg-primary text-primary-foreground opacity-100"
            : "text-muted-foreground opacity-0 group-hover:opacity-100",
        )}
      >
        <Plus className="size-3 shrink-0" />
        {isTail ? "さいごに" : "ここ"}
      </span>
      <span aria-hidden className={line} />
    </button>
  );
};
