/**
 * ロボットの型（FSD: entities/robot/model）
 *
 * ロボットは迷路上を動く対象で、位置・向き・階層・取得済みカギを持つ揮発ランタイム状態。
 * 実行時状態は永続化しない（→ docs/db-design.md 1章。DB スキーマ対象外）。
 *
 * FSD の同一レイヤー禁止により `entities/maze` を参照できないため、座標・向きの型は
 * 本 entity で自前定義する（maze の `MazeCoord` と同形だが別物）。maze との突き合わせ・
 * 移動/衝突/落下/カギ/ゴールの判定は features/maze-simulation（#185）の責務で、本 entity は
 * 「状態の型 + 純粋ロジック（向き回転など）+ Robot3d 描画」に限る。
 *
 * 向きの識別子の綴りは docs/glossary.md §3 が正。`TILE_KIND`（shared/db）/ `COMMAND_KIND`
 * （entities/command）と同じ書式（定数オブジェクト + z.enum + 型ガード）で揃える。
 */
import { z } from "zod";

/**
 * ロボットのセル位置。`tiles[floor][row][col]` に対応し、`floor` は 0 始まり（表示階 = floor + 1）。
 * 実行エンジン（#185）と maze の座標系（→ docs/db-design.md 3.4）に一致させること。
 */
export interface RobotCoord {
  floor: number;
  row: number;
  col: number;
}

/**
 * ロボットの向き（4 方向）の名前付き定数。参照側は素の文字列でなく `DIRECTION.NORTH` を使う
 * （→ 可読性・単一定義・タイポの型エラー化）。挿入順は北→東→南→西（時計回り）で、
 * `turnRight`/`turnLeft` の回転順序の正でもある。
 */
export const DIRECTION = {
  NORTH: "north",
  EAST: "east",
  SOUTH: "south",
  WEST: "west",
} as const;

/** 向きの検証に使う enum スキーマ。 */
export const DirectionSchema = z.enum(DIRECTION);

/** ロボットの向き。 */
export type Direction = z.infer<typeof DirectionSchema>;

/** 未知の値を {@link Direction} に絞り込む型ガード。 */
export const isDirection = (value: unknown): value is Direction =>
  DirectionSchema.safeParse(value).success;

/**
 * ロボットの状態（位置・向き・取得済みカギ）。階層は `position.floor` が持つ。
 *
 * `collectedKeys` は取得済みカギの座標配列で保持する（同じカギの再訪による二重取得を避けられる）。
 * 実際の追加・成功判定（全カギ取得）は features/maze-simulation（#185）が担い、本 entity は型のみを与える。
 */
export interface Robot {
  position: RobotCoord;
  direction: Direction;
  collectedKeys: RobotCoord[];
}

/**
 * 位置・向きの差分では表せない一発アニメーションの指示。
 * 前進は `position` 変化、回転は `direction` 変化で表現するため、ここには含めない。
 */
export const ROBOT_ACTION = {
  /** 前方の穴を埋める。 */
  FILL_HOLE: "fillHole",
  /** 埋めていない穴へ進入して落下する（失敗表現）。 */
  FALL: "fall",
} as const;

/** {@link ROBOT_ACTION} の値。Robot3d が受け取り一発アニメを再生する。 */
export type RobotAction = (typeof ROBOT_ACTION)[keyof typeof ROBOT_ACTION];
