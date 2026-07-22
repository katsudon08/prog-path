/**
 * AR シーンの固定カメラ算出（FSD: widgets/ar-stage/lib）
 *
 * 迷路の大きさ（一辺のマス数・階層数）から、迷路全体がフレームに収まる固定カメラの
 * 位置・注視点・視野角を求める純粋関数。マーカートラッキング無しの現行 AR
 * （カメラ映像を背景に 3D を重ねる方式）では視点が固定のため、マウント時に一度だけ計算する。
 *
 * 寸法の正は shared/grid（CELL / FLOOR_GAP）。壁の高さ等の consumer 固有寸法は
 * ここでは概算値（{@link STACK_TOP_MARGIN}）で吸収する。
 */
import { CELL, FLOOR_GAP } from "@/shared/grid";

/** ArScene が Canvas / カメラへ渡す固定カメラ設定。 */
export interface SceneCameraConfig {
  /** カメラのワールド位置 `[x, y, z]`。 */
  readonly position: readonly [number, number, number];
  /** 注視点（迷路スタックの中心）`[x, y, z]`。 */
  readonly target: readonly [number, number, number];
  /** 垂直視野角（度）。 */
  readonly fov: number;
}

/** 垂直視野角（度）。 */
const FOV_DEG = 45;

/**
 * 最上階の構造物の高さ余裕（壁 0.9 + マーカー分の概算）。
 * maze-3d のローカル寸法に依存しないよう、ここでは安全側の概算で持つ。
 */
const STACK_TOP_MARGIN = 1;

/** 高さ / 奥行きの比。約 42 度の見下ろしで、俯瞰しつつ立体感（壁の高さ）も見えるバランス。 */
const ELEVATION_RATIO = 0.9;

/** フレーム端の余白（ワールド単位）。 */
const FRAME_MARGIN = CELL;

/**
 * 迷路全体が収まる固定カメラ設定を計算する。
 *
 * 迷路の外接半径（水平対角 + 階層スタックの高さ）を求め、視野角の半分の tan で割って
 * 必要距離を出す。カメラは -z 手前・上方（{@link ELEVATION_RATIO}）から中心を見下ろす。
 *
 * @param size 迷路の一辺のマス数（`maze.size`）
 * @param floors 階層数（`maze.floors`）
 * @returns 位置・注視点・視野角（{@link SceneCameraConfig}）
 */
export const computeSceneCamera = (size: number, floors: number): SceneCameraConfig => {
  // 水平方向の半径（中心 → 角までの対角距離）。
  const halfExtent = (size * CELL) / 2;
  const horizontalRadius = halfExtent * Math.SQRT2;

  // 階層スタックの高さ（floor 0 の床面 〜 最上階の構造物上端）。
  const stackHeight = (floors - 1) * FLOOR_GAP + STACK_TOP_MARGIN;
  const targetY = stackHeight / 2;

  // 外接半径 + 余白が視野に収まる距離。tan(fov/2) は視距離 1 あたりの見える半径。
  const boundingRadius = Math.hypot(horizontalRadius, stackHeight / 2) + FRAME_MARGIN;
  const distance = boundingRadius / Math.tan(((FOV_DEG / 2) * Math.PI) / 180);

  // 距離 distance を (z, y) = (1, ELEVATION_RATIO) 方向に配分する。
  const z = distance / Math.hypot(1, ELEVATION_RATIO);
  const y = targetY + z * ELEVATION_RATIO;

  return { position: [0, y, z], target: [0, targetY, 0], fov: FOV_DEG };
};
