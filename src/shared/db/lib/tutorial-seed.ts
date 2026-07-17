/**
 * チュートリアル迷路のシードデータ（FSD: shared/db/lib）
 *
 * 授業導入用の教材となる迷路群と、それらをまとめる専用「チュートリアル」フォルダを、
 * 予約固定 ID を持つ決定的なデータとして定義する。起動時の存在保証（bootstrap の
 * ensureTutorialContent）が「無ければ作る／欠損 ID だけ補う」形で常に用意する。
 * 未分類フォルダの存在保証と同格の扱い（→ docs/db-design.md 7）。
 *
 * shared/db は Maze/Folder スキーマの単一の正であり、bootstrap は最下層で entities/maze を
 * 参照できないため、タイル構築ヘルパは本ファイルに自己完結で持つ（createInitialMaze は使わない）。
 *
 * 迷路はロボット南向きスタート（south = row+）でクリア可能・PlayableMazeSchema を満たす完全データ。
 * 可解性は features/maze-simulation の tutorial-solvable.test.ts が実行エンジンで実証する。
 */
import { TUTORIAL_FOLDER_ID } from "@/shared/config";

import type { Folder, Maze } from "../model/schema";
import { TILE_KIND } from "../model/tile-kind";
import type { TileKind } from "../model/tile-kind";

/** 専用「チュートリアル」フォルダの固定名（削除・リネーム不可。強制は UI 側で行う）。 */
export const TUTORIAL_FOLDER_NAME = "チュートリアル";

/**
 * 各チュートリアル迷路の予約固定 ID（有効な v4 UUID・互いに一意）。
 * 起動毎の存在保証で「この ID が無ければ挿入」の判定に用いる。
 */
export const TUTORIAL_MAZE_ID = {
  STRAIGHT: "10000000-0000-4000-8000-000000000001",
  TURN: "10000000-0000-4000-8000-000000000002",
  LOOP: "10000000-0000-4000-8000-000000000003",
  IF_HOLE: "10000000-0000-4000-8000-000000000004",
  KEY: "10000000-0000-4000-8000-000000000005",
  TELEPORT: "10000000-0000-4000-8000-000000000006",
} as const;

/** シード迷路の基準作成時刻（epoch ms）。カリキュラム順に +order して昇順に並べる。 */
const SEED_CREATED_AT_BASE = 1_700_000_000_000;

/** size×size を全て床で埋めた 1 階分のタイルを作る。 */
const makeFloor = (size: number): TileKind[][] =>
  Array.from({ length: size }, () => Array.from({ length: size }, (): TileKind => TILE_KIND.FLOOR));

/** 迷路の構造仕様（folderId・日時を付与する前の骨組み）。 */
interface TutorialMazeSpec {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly floors: number;
  readonly tiles: TileKind[][][];
}

/** 1. まっすぐ進もう（forward）: 5×5・START(0,2)→GOAL(4,2) の直線。 */
const straightSpec = (): TutorialMazeSpec => {
  const floor = makeFloor(5);
  floor[0][2] = TILE_KIND.START;
  floor[4][2] = TILE_KIND.GOAL;
  return {
    id: TUTORIAL_MAZE_ID.STRAIGHT,
    name: "まっすぐ進もう",
    size: 5,
    floors: 1,
    tiles: [floor],
  };
};

/** 2. 曲がってみよう（forward + turn）: 5×5・START(0,0)→GOAL(4,4) の L 字。 */
const turnSpec = (): TutorialMazeSpec => {
  const floor = makeFloor(5);
  floor[0][0] = TILE_KIND.START;
  floor[4][4] = TILE_KIND.GOAL;
  return { id: TUTORIAL_MAZE_ID.TURN, name: "曲がってみよう", size: 5, floors: 1, tiles: [floor] };
};

/** 3. くりかえし（loop）: 7×7・START(0,3)→GOAL(6,3) の長い直線。 */
const loopSpec = (): TutorialMazeSpec => {
  const floor = makeFloor(7);
  floor[0][3] = TILE_KIND.START;
  floor[6][3] = TILE_KIND.GOAL;
  return { id: TUTORIAL_MAZE_ID.LOOP, name: "くりかえし", size: 7, floors: 1, tiles: [floor] };
};

/** 4. あなをうめよう（ifHole）: 5×5・START(0,0) の前方(1,0)に穴、GOAL(4,0)。 */
const ifHoleSpec = (): TutorialMazeSpec => {
  const floor = makeFloor(5);
  floor[0][0] = TILE_KIND.START;
  floor[1][0] = TILE_KIND.HOLE;
  floor[4][0] = TILE_KIND.GOAL;
  return {
    id: TUTORIAL_MAZE_ID.IF_HOLE,
    name: "あなをうめよう",
    size: 5,
    floors: 1,
    tiles: [floor],
  };
};

/** 5. カギをとろう（key）: 5×5・START(0,0)→KEY(4,0)→GOAL(4,4)。 */
const keySpec = (): TutorialMazeSpec => {
  const floor = makeFloor(5);
  floor[0][0] = TILE_KIND.START;
  floor[4][0] = TILE_KIND.KEY;
  floor[4][4] = TILE_KIND.GOAL;
  return { id: TUTORIAL_MAZE_ID.KEY, name: "カギをとろう", size: 5, floors: 1, tiles: [floor] };
};

/**
 * 6. 上の階へ（teleport・多階）: 5×5×2。
 * F0: START(0,0)→TELEPORT_UP(4,0)、F1: 着地(4,0)は床のまま→GOAL(4,4)。
 * テレポート先 F1(4,0) は床（壁/穴/テレポートは着地不可）。
 */
const teleportSpec = (): TutorialMazeSpec => {
  const lower = makeFloor(5);
  lower[0][0] = TILE_KIND.START;
  lower[4][0] = TILE_KIND.TELEPORT_UP;
  const upper = makeFloor(5);
  upper[4][4] = TILE_KIND.GOAL;
  return {
    id: TUTORIAL_MAZE_ID.TELEPORT,
    name: "上の階へ",
    size: 5,
    floors: 2,
    tiles: [lower, upper],
  };
};

/** 構造仕様に共通メタ（folderId・作成順の日時）を付与して {@link Maze} を組み立てる。 */
const buildMaze = (spec: TutorialMazeSpec, order: number): Maze => ({
  id: spec.id,
  name: spec.name,
  size: spec.size,
  floors: spec.floors,
  tiles: spec.tiles,
  folderId: TUTORIAL_FOLDER_ID,
  createdAt: SEED_CREATED_AT_BASE + order,
  updatedAt: SEED_CREATED_AT_BASE + order,
});

/** 専用「チュートリアル」フォルダのレコードを生成する（予約 ID・作成順は未分類の次）。 */
export const buildTutorialFolder = (): Folder => ({
  id: TUTORIAL_FOLDER_ID,
  name: TUTORIAL_FOLDER_NAME,
  isDefault: false,
  createdAt: 1,
});

/** チュートリアル迷路 6 件を、易→難のカリキュラム順（createdAt 昇順）で生成する。 */
export const buildTutorialMazes = (): Maze[] =>
  [straightSpec(), turnSpec(), loopSpec(), ifHoleSpec(), keySpec(), teleportSpec()].map(
    (spec, index) => buildMaze(spec, index),
  );
