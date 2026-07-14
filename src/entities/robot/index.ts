/**
 * Public API — `entities/robot` スライス
 *
 * ロボット（位置・向き・階層・取得カギ）の揮発ランタイム状態と型、向きの純粋ロジック、
 * `Robot3d`（3D・アニメーション）。型・状態・純粋ロジックのみで、他 entity を参照しない。
 * 移動/衝突/落下/カギ/ゴールの判定は features/maze-simulation（#185）の責務。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */

// 型（座標・向き・状態・一発アニメ）
export type { Robot, RobotCoord, Direction, RobotAction } from "./model/types";
export { DIRECTION, ROBOT_ACTION, isDirection } from "./model/types";

// 向きの純粋ロジック（前方ベクトル・回転・描画用 yaw）
export { DIRECTION_VECTOR, turnRight, turnLeft, directionToYaw } from "./model/direction";
export type { DirectionVector } from "./model/direction";

// 初期ロボット生成
export { createInitialRobot, DEFAULT_DIRECTION } from "./lib/create-initial-robot";

// 表示コンポーネント
export { Robot3d } from "./ui/robot-3d";
