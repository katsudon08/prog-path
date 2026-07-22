/**
 * Public API — `shared/grid`
 *
 * 描画用グリッド座標と、その「ワールド座標変換」の単一の正。迷路 3D（entities/maze）と
 * ロボット 3D（entities/robot）が同一シーンで噛み合うよう、セル座標 → ワールド座標の変換と
 * 基準寸法（マス間隔・階間隔・スラブ上面オフセット）を集約する。実行時は three 非依存。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */
export type { Coord } from "./model/coord";
export {
  CELL,
  FLOOR_GAP,
  SURFACE_OFFSET,
  gridOffset,
  gridToWorld,
  gridToWorldInto,
} from "./lib/grid-to-world";
