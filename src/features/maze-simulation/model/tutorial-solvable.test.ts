import { describe, expect, it } from "vitest";

import { COMMAND_KIND, type Command } from "@/entities/command";
import { buildTutorialMazes, TUTORIAL_MAZE_ID, type Maze } from "@/shared/db";

import { createExecutionSession, stepExecution } from "./execution-engine";

const fwd = (): Command => ({ kind: COMMAND_KIND.FORWARD });
const turnLeft = (): Command => ({ kind: COMMAND_KIND.TURN_LEFT });
const ifHole = (): Command => ({ kind: COMMAND_KIND.IF_HOLE });
const loop = (count: number, children: Command[]): Command => ({ kind: "loop", count, children });

const MAX_STEPS = 200;

/** 迷路と想定解プログラムを実行し、terminal になった最終ステータスを返す。 */
const runToEnd = (maze: Maze, program: Command[]): string => {
  const session = createExecutionSession(maze, program);
  if (!session.ok) throw new Error(`セッション生成に失敗: ${session.error.code}`);
  let state = session.state;
  for (let step = 0; step < MAX_STEPS && state.status === "running"; step += 1) {
    state = stepExecution(state).state;
  }
  return state.status;
};

const mazes = buildTutorialMazes();
const byId = (id: string): Maze => {
  const maze = mazes.find((candidate) => candidate.id === id);
  if (maze === undefined) throw new Error(`チュートリアル迷路が見つからない: ${id}`);
  return maze;
};

/** 各迷路の想定解（新規オブジェクトを都度生成し、木の共有参照を避ける）。 */
const CASES: ReadonlyArray<{ name: string; id: string; program: () => Command[] }> = [
  {
    name: "まっすぐ進もう",
    id: TUTORIAL_MAZE_ID.STRAIGHT,
    program: () => [fwd(), fwd(), fwd(), fwd()],
  },
  {
    name: "曲がってみよう",
    id: TUTORIAL_MAZE_ID.TURN,
    program: () => [fwd(), fwd(), fwd(), fwd(), turnLeft(), fwd(), fwd(), fwd(), fwd()],
  },
  { name: "くりかえし", id: TUTORIAL_MAZE_ID.LOOP, program: () => [loop(6, [fwd()])] },
  {
    name: "あなをうめよう",
    id: TUTORIAL_MAZE_ID.IF_HOLE,
    program: () => [ifHole(), fwd(), fwd(), fwd(), fwd()],
  },
  {
    name: "カギをとろう",
    id: TUTORIAL_MAZE_ID.KEY,
    program: () => [fwd(), fwd(), fwd(), fwd(), turnLeft(), fwd(), fwd(), fwd(), fwd()],
  },
  {
    name: "上の階へ",
    id: TUTORIAL_MAZE_ID.TELEPORT,
    program: () => [fwd(), fwd(), fwd(), fwd(), turnLeft(), fwd(), fwd(), fwd(), fwd()],
  },
];

describe("チュートリアル迷路の可解性", () => {
  it.each(CASES)("$name は想定解でクリアできる", ({ id, program }) => {
    expect(runToEnd(byId(id), program())).toBe("success");
  });
});
