/**
 * FloorSwitcher（FSD: widgets/ar-stage/ui）
 *
 * 複数階の迷路で表示階（visibleFloor）を手動切替するオーバーレイ。1 階建てでは何も描かない。
 * 上の階ほど上に並べ（3D の積み上がりと一致）、現在階は solid で強調 + `aria-pressed`。
 * 「編集時のみ有効」の担保は controller（setVisibleFloor の no-op 化）側にある。
 */
import { Layers } from "lucide-react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

interface FloorSwitcherProps {
  /** 迷路の階層数（`maze.floors`）。1 以下では何も表示しない。 */
  floorCount: number;
  /** 表示中の階（0 始まり）。 */
  visibleFloor: number;
  /** 表示階の切替（controller.setVisibleFloor）。 */
  onSelect: (floor: number) => void;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 表示階スイッチャ（複数階のときのみ）。 */
export const FloorSwitcher = ({
  floorCount,
  visibleFloor,
  onSelect,
  className,
}: FloorSwitcherProps): React.JSX.Element | null => {
  if (floorCount <= 1) {
    return null;
  }

  // 上の階が上に来るよう降順（floorCount-1 → 0）で並べる。
  const floors = Array.from({ length: floorCount }, (_, index) => floorCount - 1 - index);

  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-2 rounded-card border border-border bg-background/85 p-2 shadow-lg",
        className,
      )}
    >
      <span className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground">
        <Layers aria-hidden="true" className="size-4" />
        かい
      </span>
      {floors.map((floor) => {
        const isCurrent = floor === visibleFloor;
        return (
          <Button
            key={floor}
            variant={isCurrent ? "solid" : "outline"}
            tone={isCurrent ? "primary" : "neutral"}
            aria-pressed={isCurrent}
            onClick={() => onSelect(floor)}
          >
            {floor + 1}かい
          </Button>
        );
      })}
    </div>
  );
};
