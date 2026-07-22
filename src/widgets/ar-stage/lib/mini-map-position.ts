/**
 * ミニマップ上のロボットマーカー配置（FSD: widgets/ar-stage/lib）
 *
 * 迷路 1 階分の俯瞰（MazePreview）へロボットマーカーを重畳するための、
 * グリッド座標 → コンテナ相対位置（%）と、向き → CSS 回転角（度）の純粋変換。
 *
 * 座標系: MazePreview は `tiles[row][col]` を row=上→下 / col=左→右 に敷くため、
 * col がコンテナの left、row が top に対応する。北 = row が減る向き = 画面上方向。
 */
import { directionToYaw } from "@/entities/robot";
import type { Direction } from "@/entities/robot";

/** ミニマップコンテナに対するマーカー中心の相対位置（%）。 */
export interface MiniMapPosition {
  /** 左端からの位置（0〜100%）。 */
  leftPct: number;
  /** 上端からの位置（0〜100%）。 */
  topPct: number;
}

/**
 * グリッド座標をミニマップコンテナ相対のマス中心位置（%）へ変換する。
 *
 * マス幅は `100 / gridSize` % で、`+ 0.5` によりマスの中心を指す。
 *
 * @param coord マス位置（row/col。floor はミニマップ側で表示階と突き合わせる）
 * @param gridSize 迷路の一辺のマス数
 * @returns left/top の相対位置（{@link MiniMapPosition}）
 */
export const miniMapPosition = (
  coord: { row: number; col: number },
  gridSize: number,
): MiniMapPosition => ({
  leftPct: ((coord.col + 0.5) / gridSize) * 100,
  topPct: ((coord.row + 0.5) / gridSize) * 100,
});

/**
 * 向きを「上向き素材を時計回りに回す」CSS 回転角（度）へ変換する。
 *
 * 3D 用 yaw（{@link directionToYaw}: 前方 (dCol, dRow) へ θ = atan2(dCol, dRow)）を正とし、
 * 2D 俯瞰（上 = 北 = dRow -1、CSS は時計回り正）へは θ_css = 180° - deg(yaw) で写る
 * （北: 180-180=0 / 東: 180-90=90 / 南: 180-0=180 / 西: 180-(-90)=270）。
 *
 * @param direction ロボットの向き
 * @returns 0〜360 未満に正規化した時計回りの回転角（度）
 */
export const directionToMapRotation = (direction: Direction): number => {
  const yawDeg = (directionToYaw(direction) * 180) / Math.PI;
  return (((180 - yawDeg) % 360) + 360) % 360;
};
