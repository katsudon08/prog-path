/**
 * MoveCountBadge（FSD: widgets/ar-stage/ui）
 *
 * 実行中の移動回数を大きく表示するオーバーレイバッジ。表示専用で操作を持たないため
 * `pointer-events-none`（下のレイヤーへタップを透過）。2〜3 人で 1 台を囲む距離から
 * 読めるよう数字を大きくし、アイコン＋ラベルを対にする（色覚配慮）。
 */
import { Footprints } from "lucide-react";

import { cn } from "@/shared/lib";

interface MoveCountBadgeProps {
  /** 実行中の移動回数（未実行時は 0）。 */
  moveCount: number;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 移動回数バッジ。 */
export const MoveCountBadge = ({
  moveCount,
  className,
}: MoveCountBadgeProps): React.JSX.Element => {
  return (
    <div
      className={cn(
        "pointer-events-none inline-flex items-center gap-3 rounded-card border border-border bg-background/85 px-5 py-3 text-foreground shadow-lg",
        className,
      )}
    >
      <Footprints aria-hidden="true" className="size-8 text-primary" />
      <div className="flex flex-col leading-none">
        <span className="text-sm text-muted-foreground">うごいた かず</span>
        <span aria-live="polite" className="text-4xl font-bold tabular-nums">
          {moveCount}
        </span>
      </div>
    </div>
  );
};
