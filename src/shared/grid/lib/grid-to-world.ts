/**
 * グリッド → ワールド座標変換（FSD: shared/grid/lib）
 *
 * 迷路 3D（entities/maze）とロボット 3D（entities/robot）が同一シーンで噛み合うよう、
 * セル座標をワールド座標へ写す変換と、その基準となる寸法定数を単一の正として集約する。
 * 以前は maze-3d / robot-3d それぞれにローカル定数を重複定義していたため、値のズレが
 * 座標系の不整合を招く恐れがあった（→ #187 でここへ集約）。
 *
 * 実行時は three に依存しない（`gridToWorldInto` の `Vector3` は `import type` のみ）。
 * 各 consumer 固有の上下オフセット（robot の休止高さ、maze の壁/穴/マーカー）は本スライスに
 * 含めず consumer 側に残す。本スライスが返すのは「タイル中心・スラブ中央」の基準位置のみ。
 */
import type { Vector3 } from "three";

import type { Coord } from "../model/coord";

/** 1 マスの間隔（3D ワールド単位）。 */
export const CELL = 1;

/** 階と階の垂直間隔（ワールド単位）。floor 1 つあたりの y 方向オフセット。 */
export const FLOOR_GAP = 1.2;

/**
 * 床スラブ中央から上面までの高さ（スラブ厚の半分）。
 * maze-3d のスラブ厚 `SLAB_HEIGHT`(0.15) の半分であり、robot-3d が本体を床上面へ載せる
 * 際の基準（旧 `SLAB_HALF`）と一致する。consumer が基準位置へ加算して上面に載せる。
 */
export const SURFACE_OFFSET = 0.075;

/**
 * マス中心をグリッド中央へ寄せるためのオフセット。
 *
 * インデックス 0..gridSize-1 の中央が原点に来るよう、各軸のインデックスから引く量。
 *
 * @param gridSize 迷路の一辺のマス数
 * @returns 中央寄せオフセット（= (gridSize - 1) / 2）
 */
export const gridOffset = (gridSize: number): number => (gridSize - 1) / 2;

/**
 * グリッド座標をワールド座標の基準位置（タイル中心・スラブ中央）へ写す。
 *
 * 割当は col → x / floor → y / row → z。x・z は中央寄せオフセットを引き、CELL 倍する。
 * y は floor に FLOOR_GAP を掛ける。consumer 固有の上下オフセット（休止高さ・壁/穴/マーカー）は
 * 含めない（呼び出し側で加算する）。
 *
 * @param coord 描画用グリッド座標
 * @param gridSize 迷路の一辺のマス数
 * @returns ワールド座標のタプル `[x, y, z]`
 */
export const gridToWorld = (coord: Coord, gridSize: number): [number, number, number] => {
  const offset = gridOffset(gridSize);
  return [(coord.col - offset) * CELL, coord.floor * FLOOR_GAP, (coord.row - offset) * CELL];
};

/**
 * {@link gridToWorld} と同じ変換を、既存の `Vector3` へ書き込む形で行う（GC 抑制）。
 *
 * useFrame など高頻度パスで scratch ベクトルを再利用するため、新規確保せず `out` を上書きする。
 *
 * @param coord 描画用グリッド座標
 * @param gridSize 迷路の一辺のマス数
 * @param out 書き込み先ベクトル（再利用対象）
 * @returns 書き込んだ `out`（同一参照）
 */
export const gridToWorldInto = (coord: Coord, gridSize: number, out: Vector3): Vector3 => {
  const offset = gridOffset(gridSize);
  return out.set((coord.col - offset) * CELL, coord.floor * FLOOR_GAP, (coord.row - offset) * CELL);
};
