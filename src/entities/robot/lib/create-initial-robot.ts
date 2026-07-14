/**
 * 初期ロボット生成（FSD: entities/robot/lib）
 *
 * スタート座標から実行開始時のロボット状態を組み立てる純粋・決定的な関数。
 * 初期向きは固定（迷路ごとに指定しない、→ docs/features.md 1.3）。
 * 実行前リセット（→ #185 の Resetting）でもこの初期状態へ戻す用途を想定する。
 */
import { DIRECTION } from "../model/types";
import type { Direction, Robot, RobotCoord } from "../model/types";

/** ロボットの固定初期向き（南）。迷路ごとには指定しない（→ docs/features.md 1.3）。 */
export const DEFAULT_DIRECTION: Direction = DIRECTION.SOUTH;

/**
 * 実行開始時のロボット状態を生成する。
 *
 * @param start スタートタイルの座標（floor/row/col）。
 * @returns `position=start`・`direction={@link DEFAULT_DIRECTION}`・`collectedKeys=[]` の {@link Robot}。
 */
export const createInitialRobot = (start: RobotCoord): Robot => ({
  position: { ...start },
  direction: DEFAULT_DIRECTION,
  collectedKeys: [],
});
