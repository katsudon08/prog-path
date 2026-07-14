/**
 * 向きの純粋ロジック（FSD: entities/robot/model）
 *
 * 向き（{@link Direction}）に対する方位ベクトル・90 度回転・描画用 yaw を提供する純粋関数群。
 * ゲームルール（衝突・落下・カギ・ゴール判定）は持たない ── それは features/maze-simulation（#185）。
 *
 * 座標系: `dRow`/`dCol` は maze の `tiles[floor][row][col]` の増減。北 = row が減る向き（標準グリッド規約）。
 * ワールド変換（→ maze-3d）では col 軸 = world x、row 軸 = world z に対応する。
 */
import { DIRECTION } from "./types";
import type { Direction } from "./types";

/** 前方 1 マスの座標差（row/col の増減）。 */
export interface DirectionVector {
  dRow: number;
  dCol: number;
}

/**
 * 向き → 前方 1 マスの座標差。#185 の前方セル算出に使える純粋データ。
 * 北 = row-1 / 東 = col+1 / 南 = row+1 / 西 = col-1。
 */
export const DIRECTION_VECTOR: Record<Direction, DirectionVector> = {
  [DIRECTION.NORTH]: { dRow: -1, dCol: 0 },
  [DIRECTION.EAST]: { dRow: 0, dCol: 1 },
  [DIRECTION.SOUTH]: { dRow: 1, dCol: 0 },
  [DIRECTION.WEST]: { dRow: 0, dCol: -1 },
};

/** 時計回りの回転順序（北→東→南→西）。回転はこの配列の index を mod 4 で進める。 */
const CLOCKWISE: readonly Direction[] = [
  DIRECTION.NORTH,
  DIRECTION.EAST,
  DIRECTION.SOUTH,
  DIRECTION.WEST,
];

/** 右に 90 度回転した向きを返す（純粋）。 */
export const turnRight = (direction: Direction): Direction => {
  const index = CLOCKWISE.indexOf(direction);
  return CLOCKWISE[(index + 1) % CLOCKWISE.length];
};

/** 左に 90 度回転した向きを返す（純粋）。 */
export const turnLeft = (direction: Direction): Direction => {
  const index = CLOCKWISE.indexOf(direction);
  // +3 は -1 と同値（負の剰余を避ける）。
  return CLOCKWISE[(index + CLOCKWISE.length - 1) % CLOCKWISE.length];
};

/**
 * 向き → Robot3d の group.rotation.y（ラジアン、Y 軸まわり yaw）。
 *
 * モデルのノーズは yaw 0 で world +z（南）を向く前提。Three.js で +z の点は
 * rotation.y=θ により (sinθ, 0, cosθ) へ写るため、world 前方 (dCol, dRow) に向けるには
 * θ = atan2(dCol, dRow) とすればよい（col 軸 = world x, row 軸 = world z）。
 */
export const directionToYaw = (direction: Direction): number => {
  const { dRow, dCol } = DIRECTION_VECTOR[direction];
  return Math.atan2(dCol, dRow);
};
