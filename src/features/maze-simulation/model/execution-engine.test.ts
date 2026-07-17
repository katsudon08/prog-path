import { describe, expect, it } from "vitest";

import { COMMAND_KIND, type Command } from "@/entities/command";
import { createInitialMaze, TILE_KIND } from "@/entities/maze";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";
import type { Maze } from "@/shared/db";

import { createExecutionSession, stepExecution } from "./execution-engine";
import { FAILURE_REASON, type ExecutionEvent, type ExecutionState } from "./types";

const createMaze = (floors = 1): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "実行テスト迷路",
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...createInitialMaze(5, floors),
});

const setGoal = (maze: Maze, floor: number, row: number, col: number): void => {
  const currentGoal = maze.tiles
    .flatMap((floorTiles, floorIndex) =>
      floorTiles.flatMap((rowTiles, rowIndex) =>
        rowTiles.map((tile, colIndex) =>
          tile === TILE_KIND.GOAL ? { floor: floorIndex, row: rowIndex, col: colIndex } : null,
        ),
      ),
    )
    .find((coord) => coord !== null);
  if (currentGoal !== undefined && currentGoal !== null) {
    maze.tiles[currentGoal.floor][currentGoal.row][currentGoal.col] = TILE_KIND.FLOOR;
  }
  maze.tiles[floor][row][col] = TILE_KIND.GOAL;
};

const getState = (maze: Maze, commands: readonly Command[]): ExecutionState => {
  const result = createExecutionSession(maze, commands);
  if (!result.ok) throw new Error(`実行セッションを作成できません: ${result.error.code}`);
  return result.state;
};

const step = (state: ExecutionState): ExecutionState => stepExecution(state).state;

const failureEvent = (events: readonly ExecutionEvent[]): ExecutionEvent | undefined =>
  events.find((event) => event.type === "failure");

const leaf = (kind: Exclude<Command["kind"], "loop">): Command => ({ kind });

const loop = (count: number, children: Command[]): Command => ({
  kind: "loop",
  count,
  children,
});

describe("createExecutionSession", () => {
  it("スタートから南向きで初期化する", () => {
    const state = getState(createMaze(), []);

    expect(state.robot).toEqual({
      position: { floor: 0, row: 0, col: 0 },
      direction: "south",
      collectedKeys: [],
    });
    expect(state.moveCount).toBe(0);
    expect(state.status).toBe("running");
  });

  it("不正な迷路とコマンドを例外ではなくコードで返す", () => {
    const maze = createMaze();
    maze.tiles[0][0][0] = TILE_KIND.FLOOR;
    const invalidMaze = createExecutionSession(maze, []);
    expect(invalidMaze).toMatchObject({ ok: false, error: { code: "invalid-maze" } });

    const invalidCommand = createExecutionSession(createMaze(), [
      { kind: "unknown" },
    ] as unknown as readonly Command[]);
    expect(invalidCommand).toMatchObject({
      ok: false,
      error: { code: "invalid-command", path: [0] },
    });
  });
});

describe("stepExecution", () => {
  it("前進・回転・移動数を実行する", () => {
    const state = getState(createMaze(), [
      leaf(COMMAND_KIND.FORWARD),
      leaf(COMMAND_KIND.TURN_RIGHT),
      leaf(COMMAND_KIND.FORWARD),
    ]);

    const afterForward = stepExecution(state);
    expect(afterForward.state.robot.position).toEqual({ floor: 0, row: 1, col: 0 });
    expect(afterForward.state.moveCount).toBe(1);
    expect(afterForward.events).toContainEqual(
      expect.objectContaining({ type: "moved", moveCount: 1 }),
    );

    const afterTurn = stepExecution(afterForward.state);
    expect(afterTurn.state.robot.direction).toBe("west");

    const afterSecondForward = stepExecution(afterTurn.state);
    expect(afterSecondForward.state.robot.position).toEqual({ floor: 0, row: 1, col: 0 });
    expect(failureEvent(afterSecondForward.events)).toEqual(
      expect.objectContaining({ reason: FAILURE_REASON.OUT_OF_BOUNDS }),
    );
  });

  it("迷路外・壁・穴を仕様どおりに扱う", () => {
    const outOfBoundsState = getState(createMaze(), [
      leaf(COMMAND_KIND.TURN_LEFT),
      leaf(COMMAND_KIND.TURN_LEFT),
      leaf(COMMAND_KIND.FORWARD),
    ]);
    const outOfBounds = step(step(step(outOfBoundsState)));
    expect(outOfBounds.robot.position).toEqual({ floor: 0, row: 0, col: 0 });
    expect(outOfBounds.moveCount).toBe(0);

    const wallMaze = createMaze();
    wallMaze.tiles[0][1][0] = TILE_KIND.WALL;
    const wall = step(getState(wallMaze, [leaf(COMMAND_KIND.FORWARD)]));
    expect(wall.status).toBe("failure");
    expect(wall.moveCount).toBe(0);
    expect(
      failureEvent(stepExecution(getState(wallMaze, [leaf(COMMAND_KIND.FORWARD)])).events),
    ).toEqual(expect.objectContaining({ reason: FAILURE_REASON.WALL_COLLISION }));

    const holeMaze = createMaze();
    holeMaze.tiles[0][1][0] = TILE_KIND.HOLE;
    const holeResult = stepExecution(getState(holeMaze, [leaf(COMMAND_KIND.FORWARD)]));
    expect(holeResult.state.status).toBe("failure");
    expect(holeResult.state.robot.position).toEqual({ floor: 0, row: 1, col: 0 });
    expect(holeResult.state.moveCount).toBe(1);
    expect(failureEvent(holeResult.events)).toEqual(
      expect.objectContaining({ reason: FAILURE_REASON.HOLE_FALL }),
    );
  });

  it("ifHole は実行用コピーだけを変更し、穴がなければ no-op になる", () => {
    const holeMaze = createMaze();
    holeMaze.tiles[0][1][0] = TILE_KIND.HOLE;
    const holeState = getState(holeMaze, [leaf(COMMAND_KIND.IF_HOLE)]);
    const filled = stepExecution(holeState);
    expect(filled.state.runtimeMaze.tiles[0][1][0]).toBe(TILE_KIND.FLOOR);
    expect(holeMaze.tiles[0][1][0]).toBe(TILE_KIND.HOLE);
    expect(filled.events).toContainEqual(expect.objectContaining({ type: "hole-filled" }));

    const noOpState = getState(createMaze(), [leaf(COMMAND_KIND.IF_HOLE)]);
    const noOp = stepExecution(noOpState);
    expect(noOp.state.runtimeMaze).toEqual(noOpState.runtimeMaze);
    expect(noOp.events).not.toContainEqual(expect.objectContaining({ type: "hole-filled" }));
  });

  it("キーを進入時に一度だけ取得する", () => {
    const maze = createMaze();
    maze.tiles[0][1][0] = TILE_KIND.KEY;
    const commands = [
      leaf(COMMAND_KIND.FORWARD),
      leaf(COMMAND_KIND.TURN_RIGHT),
      leaf(COMMAND_KIND.TURN_RIGHT),
      leaf(COMMAND_KIND.FORWARD),
      leaf(COMMAND_KIND.TURN_RIGHT),
      leaf(COMMAND_KIND.TURN_RIGHT),
      leaf(COMMAND_KIND.FORWARD),
    ];
    let state = getState(maze, commands);
    let keyEvents = 0;
    for (let index = 0; index < commands.length; index += 1) {
      const result = stepExecution(state);
      keyEvents += result.events.filter((event) => event.type === "key-collected").length;
      state = result.state;
    }
    expect(keyEvents).toBe(1);
    expect(state.robot.collectedKeys).toEqual([{ floor: 0, row: 1, col: 0 }]);
  });

  it("キー取得済みのゴールは成功し、未取得のゴールは失敗する", () => {
    const successMaze = createMaze();
    successMaze.tiles[0][1][0] = TILE_KIND.KEY;
    setGoal(successMaze, 0, 2, 0);
    let successState = getState(successMaze, [
      leaf(COMMAND_KIND.FORWARD),
      leaf(COMMAND_KIND.FORWARD),
    ]);
    successState = step(successState);
    successState = step(successState);
    expect(successState.status).toBe("success");

    const failureMaze = createMaze();
    failureMaze.tiles[0][4][0] = TILE_KIND.KEY;
    setGoal(failureMaze, 0, 1, 0);
    const failureResult = stepExecution(getState(failureMaze, [leaf(COMMAND_KIND.FORWARD)]));
    const failureState = failureResult.state;
    expect(failureState.status).toBe("failure");
    expect(failureEvent(failureResult.events)).toEqual(
      expect.objectContaining({ reason: FAILURE_REASON.GOAL_BEFORE_KEYS }),
    );
  });

  it("ネストした loop をフレームで実行し、空 loop は no-op にする", () => {
    const nestedState = getState(createMaze(), [loop(2, [loop(2, [leaf(COMMAND_KIND.FORWARD)])])]);
    let state = nestedState;
    const executedPaths: number[][] = [];
    for (let index = 0; index < 4; index += 1) {
      const result = stepExecution(state);
      const commandEvent = result.events.find((event) => event.type === "command-executed");
      if (commandEvent?.type === "command-executed")
        executedPaths.push([...commandEvent.commandPath]);
      state = result.state;
    }
    expect(executedPaths).toEqual([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    expect(state.robot.position).toEqual({ floor: 0, row: 4, col: 0 });

    const emptyLoop = stepExecution(
      getState(createMaze(), [loop(2, []), leaf(COMMAND_KIND.FORWARD)]),
    );
    expect(emptyLoop.state.robot.position).toEqual({ floor: 0, row: 1, col: 0 });
    expect(emptyLoop.events).toContainEqual(expect.objectContaining({ type: "moved" }));
  });

  it("非空 loop の直後の命令をスキップしない", () => {
    let state = getState(createMaze(), [
      loop(2, [leaf(COMMAND_KIND.FORWARD)]),
      leaf(COMMAND_KIND.TURN_RIGHT),
    ]);
    state = step(step(step(state)));
    expect(state.robot.position).toEqual({ floor: 0, row: 2, col: 0 });
    expect(state.robot.direction).toBe("west");
    expect(state.moveCount).toBe(2);
    expect(state.status).toBe("running");
  });

  it("ネストした非空 loop の直後の命令も実行する", () => {
    let state = getState(createMaze(), [
      loop(2, [loop(2, [leaf(COMMAND_KIND.FORWARD)])]),
      leaf(COMMAND_KIND.TURN_RIGHT),
    ]);
    const executedPaths: number[][] = [];
    for (let index = 0; index < 5; index += 1) {
      const result = stepExecution(state);
      const commandEvent = result.events.find((event) => event.type === "command-executed");
      if (commandEvent?.type === "command-executed")
        executedPaths.push([...commandEvent.commandPath]);
      state = result.state;
    }
    expect(executedPaths).toEqual([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1]]);
    expect(state.robot.position).toEqual({ floor: 0, row: 4, col: 0 });
    expect(state.robot.direction).toBe("west");
    expect(state.status).toBe("running");
  });

  it("loop を挟んだ後続の複数命令をすべて実行する", () => {
    let state = getState(createMaze(), [
      loop(2, [leaf(COMMAND_KIND.FORWARD)]),
      leaf(COMMAND_KIND.TURN_LEFT),
      leaf(COMMAND_KIND.FORWARD),
    ]);
    const executedPaths: number[][] = [];
    for (let index = 0; index < 4; index += 1) {
      const result = stepExecution(state);
      const commandEvent = result.events.find((event) => event.type === "command-executed");
      if (commandEvent?.type === "command-executed")
        executedPaths.push([...commandEvent.commandPath]);
      state = result.state;
    }
    expect(executedPaths).toEqual([[0, 0], [0, 0], [1], [2]]);
    expect(state.robot.position).toEqual({ floor: 0, row: 2, col: 1 });
    expect(state.robot.direction).toBe("east");
    expect(state.moveCount).toBe(3);
    expect(state.status).toBe("running");
  });

  it("コマンドを使い切った次の step で失敗する", () => {
    const state = getState(createMaze(), [leaf(COMMAND_KIND.TURN_RIGHT)]);
    const afterCommand = stepExecution(state);
    expect(afterCommand.state.status).toBe("running");
    const exhausted = stepExecution(afterCommand.state);
    expect(exhausted.state.status).toBe("failure");
    expect(failureEvent(exhausted.events)).toEqual(
      expect.objectContaining({ reason: FAILURE_REASON.COMMAND_EXHAUSTED }),
    );
  });

  it("テレポートを2段階で処理し、移動先で判定する", () => {
    const maze = createMaze(2);
    maze.tiles[0][1][0] = TILE_KIND.TELEPORT_UP;
    const commands = [leaf(COMMAND_KIND.FORWARD), leaf(COMMAND_KIND.FORWARD)];
    const first = stepExecution(getState(maze, commands));
    expect(first.state.robot.position).toEqual({ floor: 0, row: 1, col: 0 });
    expect(first.state.pendingTeleport).toEqual({
      from: { floor: 0, row: 1, col: 0 },
      destination: { floor: 1, row: 1, col: 0 },
      commandPath: [0],
    });
    expect(first.state.moveCount).toBe(1);
    expect(first.events).toContainEqual(expect.objectContaining({ type: "teleport-entered" }));

    const second = stepExecution(first.state);
    expect(second.state.robot.position).toEqual({ floor: 1, row: 1, col: 0 });
    expect(second.state.moveCount).toBe(1);
    expect(second.events).toContainEqual(expect.objectContaining({ type: "teleported" }));

    const third = stepExecution(second.state);
    expect(third.state.robot.position).toEqual({ floor: 1, row: 2, col: 0 });
    expect(third.state.moveCount).toBe(2);
  });

  it("テレポート先のキー取得とゴール判定を行う", () => {
    const keyMaze = createMaze(2);
    keyMaze.tiles[0][1][0] = TILE_KIND.TELEPORT_UP;
    keyMaze.tiles[1][1][0] = TILE_KIND.KEY;
    const keyState = step(step(getState(keyMaze, [leaf(COMMAND_KIND.FORWARD)])));
    expect(keyState.robot.collectedKeys).toEqual([{ floor: 1, row: 1, col: 0 }]);
    expect(keyState.status).toBe("running");

    const goalMaze = createMaze(2);
    goalMaze.tiles[0][1][0] = TILE_KIND.TELEPORT_UP;
    setGoal(goalMaze, 1, 1, 0);
    const goalState = step(step(getState(goalMaze, [leaf(COMMAND_KIND.FORWARD)])));
    expect(goalState.status).toBe("success");
  });

  it("入力迷路・コマンド・直前状態を変更しない", () => {
    const maze = createMaze();
    maze.tiles[0][1][0] = TILE_KIND.FLOOR;
    const commands = [leaf(COMMAND_KIND.FORWARD)];
    const originalMaze = structuredClone(maze);
    const originalCommands = structuredClone(commands);
    const state = getState(maze, commands);
    const originalState = structuredClone(state);
    const next = stepExecution(state).state;

    expect(maze).toEqual(originalMaze);
    expect(commands).toEqual(originalCommands);
    expect(state).toEqual(originalState);
    expect(next).not.toBe(state);
  });
});
