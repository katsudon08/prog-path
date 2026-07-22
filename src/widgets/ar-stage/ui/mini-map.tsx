/**
 * MiniMap（FSD: widgets/ar-stage/ui）
 *
 * 表示階（visibleFloor）の俯瞰プレビュー（entities/maze の `MazePreview`）に、
 * ロボットの現在位置マーカーを相対配置（%）で重畳するオーバーレイ。位置・回転の算出は
 * lib/mini-map-position の純粋関数が担う。ロボットが表示階と別の階にいるときは
 * マーカーを出さない（別階の位置を誤読させない）。
 */
import { Navigation2 } from "lucide-react";

import { MazePreview } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import type { Robot } from "@/entities/robot";
import { cn } from "@/shared/lib";

import { directionToMapRotation, miniMapPosition } from "../lib/mini-map-position";

interface MiniMapProps {
  /** 描画対象の迷路。 */
  maze: Maze;
  /** 表示する階（0 始まり）。 */
  visibleFloor: number;
  /** ロボット状態。null（未実行）はマーカー非表示。 */
  robot: Robot | null;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 俯瞰ミニマップ（ロボットマーカー付き）。 */
export const MiniMap = ({
  maze,
  visibleFloor,
  robot,
  className,
}: MiniMapProps): React.JSX.Element => {
  const marker =
    robot !== null && robot.position.floor === visibleFloor
      ? {
          ...miniMapPosition(robot.position, maze.size),
          rotationDeg: directionToMapRotation(robot.direction),
        }
      : null;

  return (
    <div className={cn("relative inline-block", className)}>
      <MazePreview maze={maze} floor={visibleFloor} className="w-full" />
      {marker && (
        <MiniMapMarker
          leftPct={marker.leftPct}
          topPct={marker.topPct}
          rotationDeg={marker.rotationDeg}
        />
      )}
    </div>
  );
};

interface MiniMapMarkerProps {
  leftPct: number;
  topPct: number;
  rotationDeg: number;
}

/** タイル位置に % で重畳するロボットマーカー（上向き素材を向きへ回転）。 */
const MiniMapMarker = ({ leftPct, topPct, rotationDeg }: MiniMapMarkerProps): React.JSX.Element => (
  // MazePreview のタイルと同じく title で名前を補足する（視覚補助のためのオーバーレイ）。
  <span
    title="ロボットの いち"
    className="absolute text-primary drop-shadow-md"
    style={{
      left: `${leftPct}%`,
      top: `${topPct}%`,
      // 中央寄せ → 向きへ回転（Tailwind の translate と競合しないよう transform は inline に集約）。
      transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
    }}
  >
    <Navigation2 aria-hidden="true" className="size-6 fill-current stroke-background" />
  </span>
);
