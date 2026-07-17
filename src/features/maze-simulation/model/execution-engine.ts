import { COMMAND_KIND, isLoopCommand, type Command, type LeafCommand } from "@/entities/command";
import { findTiles, isWithinBounds, TILE_KIND } from "@/entities/maze";
import {
  DIRECTION_VECTOR,
  turnLeft,
  turnRight,
  createInitialRobot,
  type Direction,
  type Robot,
  type RobotCoord,
} from "@/entities/robot";
import { isBlockedDestination, PlayableMazeSchema } from "@/shared/db";
import type { Maze, MazeTileGrid, TileKind } from "@/shared/db";

import { validateCommandProgram } from "./program-validation";
import {
  EXECUTION_EVENT_TYPE,
  EXECUTION_INPUT_ERROR_CODE,
  FAILURE_REASON,
  type ExecutionEvent,
  type ExecutionFrame,
  type ExecutionPath,
  type ExecutionSessionResult,
  type ExecutionState,
  type ExecutionStepResult,
  type PendingTeleport,
  type RuntimeMaze,
} from "./types";

interface MutableExecutionFrame {
  commands: readonly Command[];
  index: number;
  remainingIterations: number;
  containerPath: ExecutionPath;
}

const cloneCoord = (coord: RobotCoord): RobotCoord => ({ ...coord });

const cloneRobot = (robot: Robot): Robot => ({
  position: cloneCoord(robot.position),
  direction: robot.direction,
  collectedKeys: robot.collectedKeys.map(cloneCoord),
});

const cloneCommand = (command: Command): Command =>
  isLoopCommand(command)
    ? {
        kind: command.kind,
        count: command.count,
        children: command.children.map(cloneCommand),
      }
    : { kind: command.kind };

const cloneCommands = (commands: readonly Command[]): Command[] => commands.map(cloneCommand);

const cloneRuntimeMaze = (maze: MazeTileGrid): RuntimeMaze => ({
  size: maze.size,
  floors: maze.floors,
  tiles: maze.tiles.map((floor) => floor.map((row) => [...row])),
});

const cloneFrames = (frames: readonly ExecutionFrame[]): MutableExecutionFrame[] =>
  frames.map((frame) => ({
    commands: frame.commands,
    index: frame.index,
    remainingIterations: frame.remainingIterations,
    containerPath: [...frame.containerPath],
  }));

/** 作業用の可変フレーム配列から、返却 state 用の独立した不変スナップショットを作る。 */
const freezeFrames = (frames: readonly MutableExecutionFrame[]): ExecutionFrame[] =>
  frames.map((frame) => ({ ...frame, containerPath: [...frame.containerPath] }));

const getTile = (maze: RuntimeMaze, coord: RobotCoord): TileKind | undefined =>
  isWithinBounds(maze, coord) ? maze.tiles[coord.floor][coord.row][coord.col] : undefined;

const coordinatesEqual = (left: RobotCoord, right: RobotCoord): boolean =>
  left.floor === right.floor && left.row === right.row && left.col === right.col;

const getForwardCoord = (robot: Robot): RobotCoord => {
  const vector = DIRECTION_VECTOR[robot.direction];
  return {
    floor: robot.position.floor,
    row: robot.position.row + vector.dRow,
    col: robot.position.col + vector.dCol,
  };
};

const replaceTile = (maze: RuntimeMaze, coord: RobotCoord, tile: TileKind): RuntimeMaze => ({
  ...maze,
  tiles: maze.tiles.map((floor, floorIndex) =>
    floor.map((row, rowIndex) =>
      row.map((currentTile, colIndex) =>
        floorIndex === coord.floor && rowIndex === coord.row && colIndex === coord.col
          ? tile
          : currentTile,
      ),
    ),
  ),
});

const hasCollectedAllKeys = (maze: RuntimeMaze, robot: Robot): boolean => {
  const keys = findTiles(maze, TILE_KIND.KEY);
  return keys.every((key) =>
    robot.collectedKeys.some((collectedKey) => coordinatesEqual(key, collectedKey)),
  );
};

type KeyCollectedEvent = Extract<
  ExecutionEvent,
  { type: typeof EXECUTION_EVENT_TYPE.KEY_COLLECTED }
>;

const collectKey = (
  maze: RuntimeMaze,
  robot: Robot,
): { robot: Robot; event: KeyCollectedEvent | null } => {
  if (getTile(maze, robot.position) !== TILE_KIND.KEY) {
    return { robot, event: null };
  }

  const alreadyCollected = robot.collectedKeys.some((key) => coordinatesEqual(key, robot.position));
  if (alreadyCollected) {
    return { robot, event: null };
  }

  const position = cloneCoord(robot.position);
  return {
    robot: {
      ...robot,
      collectedKeys: [...robot.collectedKeys.map(cloneCoord), position],
    },
    event: {
      type: EXECUTION_EVENT_TYPE.KEY_COLLECTED,
      commandPath: [],
      at: position,
    },
  };
};

const getTeleportDestination = (maze: RuntimeMaze, coord: RobotCoord): RobotCoord | null => {
  const tile = getTile(maze, coord);
  if (tile !== TILE_KIND.TELEPORT_UP && tile !== TILE_KIND.TELEPORT_DOWN) return null;

  return {
    floor: coord.floor + (tile === TILE_KIND.TELEPORT_UP ? 1 : -1),
    row: coord.row,
    col: coord.col,
  };
};

const createFailureEvent = (
  reason: (typeof FAILURE_REASON)[keyof typeof FAILURE_REASON],
  position: RobotCoord | undefined,
  commandPath: ExecutionPath | undefined,
): ExecutionEvent => ({
  type: EXECUTION_EVENT_TYPE.FAILURE,
  reason,
  ...(position === undefined ? {} : { at: cloneCoord(position) }),
  ...(commandPath === undefined ? {} : { commandPath: [...commandPath] }),
});

const createFailureState = (
  state: ExecutionState,
  runtimeMaze: RuntimeMaze,
  robot: Robot,
  frames: readonly MutableExecutionFrame[],
  reason: (typeof FAILURE_REASON)[keyof typeof FAILURE_REASON],
  position: RobotCoord | undefined,
  commandPath: ExecutionPath | undefined,
): ExecutionStepResult => ({
  state: {
    ...state,
    runtimeMaze,
    robot: cloneRobot(robot),
    frames: freezeFrames(frames),
    pendingTeleport: null,
    status: "failure",
  },
  events: [createFailureEvent(reason, position, commandPath)],
});

interface NextCommand {
  readonly command: LeafCommand;
  readonly path: ExecutionPath;
}

/**
 * 実行フレームを次の葉コマンドまで進める。
 *
 * ループの反復回数はフレームに残し、ループ自体を平坦化しない。これにより同じ葉の実行でも
 * 親ループの位置を失わず、UI の実行中ハイライトへ commandPath を渡せる。
 *
 * index の前進はこの関数が命令を取り出す時だけ行い、各命令につきちょうど 1 回進める
 * （葉は return 直前、ループは遭遇時）。フレームを pop したときに親を再前進させてはいけない
 * ——遭遇時に既に進めているため、二重に進めると次の命令をスキップしてしまう。
 */
const nextCommand = (frames: MutableExecutionFrame[]): NextCommand | null => {
  while (frames.length > 0) {
    const frame = frames.at(-1);
    if (frame === undefined) return null;

    if (frame.index >= frame.commands.length) {
      if (frame.remainingIterations > 1) {
        frame.index = 0;
        frame.remainingIterations -= 1;
        continue;
      }

      frames.pop();
      continue;
    }

    const command = frame.commands[frame.index];
    if (isLoopCommand(command)) {
      const loopPath = [...frame.containerPath, frame.index];
      frame.index += 1;
      if (command.children.length === 0) continue;

      frames.push({
        commands: command.children,
        index: 0,
        remainingIterations: command.count,
        containerPath: loopPath,
      });
      continue;
    }

    const path = [...frame.containerPath, frame.index];
    frame.index += 1;
    return { command, path };
  }

  return null;
};

const createExecutionState = (maze: Maze, commands: readonly Command[]): ExecutionState => {
  const start = findTiles(maze, TILE_KIND.START)[0];
  if (start === undefined) {
    throw new Error("MazeSchema がスタートの存在を保証できていません");
  }

  return {
    runtimeMaze: cloneRuntimeMaze(maze),
    commands: cloneCommands(commands),
    robot: createInitialRobot(start),
    frames: [
      {
        commands: cloneCommands(commands),
        index: 0,
        remainingIterations: 1,
        containerPath: [],
      },
    ],
    pendingTeleport: null,
    moveCount: 0,
    status: "running",
  };
};

/** 実行開始前に迷路とコマンド木を検証し、初期実行状態を生成する。 */
export const createExecutionSession = (
  maze: Maze,
  commands: readonly Command[],
): ExecutionSessionResult => {
  const mazeResult = PlayableMazeSchema.safeParse(maze);
  if (!mazeResult.success) {
    return {
      ok: false,
      error: {
        code: EXECUTION_INPUT_ERROR_CODE.INVALID_MAZE,
        issuePaths: mazeResult.error.issues.map((issue) =>
          issue.path.map((segment) => (typeof segment === "symbol" ? segment.toString() : segment)),
        ),
      },
    };
  }

  const commandIssue = validateCommandProgram(commands);
  if (commandIssue !== null) {
    return {
      ok: false,
      error: {
        code: EXECUTION_INPUT_ERROR_CODE.INVALID_COMMAND,
        path: [...commandIssue.path],
      },
    };
  }

  return { ok: true, state: createExecutionState(mazeResult.data, commands) };
};

const resolvePendingTeleport = (
  state: ExecutionState,
  runtimeMaze: RuntimeMaze,
  robot: Robot,
  frames: MutableExecutionFrame[],
): ExecutionStepResult => {
  const pendingTeleport = state.pendingTeleport;
  if (pendingTeleport === null) {
    return { state, events: [] };
  }

  const destinationTile = getTile(runtimeMaze, pendingTeleport.destination);
  if (destinationTile === undefined || isBlockedDestination(destinationTile)) {
    return createFailureState(
      state,
      runtimeMaze,
      robot,
      frames,
      FAILURE_REASON.INVALID_MAZE,
      robot.position,
      pendingTeleport.commandPath,
    );
  }

  const nextRobot: Robot = {
    ...robot,
    position: cloneCoord(pendingTeleport.destination),
  };
  const events: ExecutionEvent[] = [
    {
      type: EXECUTION_EVENT_TYPE.TELEPORTED,
      commandPath: [...pendingTeleport.commandPath],
      from: cloneCoord(pendingTeleport.from),
      to: cloneCoord(pendingTeleport.destination),
    },
  ];

  const collection = collectKey(runtimeMaze, nextRobot);
  const collectedRobot = collection.robot;
  if (collection.event !== null) {
    events.push({ ...collection.event, commandPath: [...pendingTeleport.commandPath] });
  }

  const status =
    getTile(runtimeMaze, collectedRobot.position) === TILE_KIND.GOAL
      ? hasCollectedAllKeys(runtimeMaze, collectedRobot)
        ? "success"
        : "failure"
      : "running";

  if (status === "success") {
    events.push({
      type: EXECUTION_EVENT_TYPE.SUCCESS,
      reason: "goal-reached",
      at: cloneCoord(collectedRobot.position),
    });
  } else if (status === "failure") {
    events.push(
      createFailureEvent(
        FAILURE_REASON.GOAL_BEFORE_KEYS,
        collectedRobot.position,
        pendingTeleport.commandPath,
      ),
    );
  }

  return {
    state: {
      ...state,
      runtimeMaze,
      robot: cloneRobot(collectedRobot),
      frames: freezeFrames(frames),
      pendingTeleport: null,
      status,
    },
    events,
  };
};

const executeLeafCommand = (
  state: ExecutionState,
  runtimeMaze: RuntimeMaze,
  robot: Robot,
  frames: MutableExecutionFrame[],
  command: LeafCommand,
  commandPath: ExecutionPath,
): ExecutionStepResult => {
  const events: ExecutionEvent[] = [
    {
      type: EXECUTION_EVENT_TYPE.COMMAND_EXECUTED,
      commandPath: [...commandPath],
      kind: command.kind,
    },
  ];

  if (command.kind === COMMAND_KIND.TURN_RIGHT || command.kind === COMMAND_KIND.TURN_LEFT) {
    const nextDirection: Direction =
      command.kind === COMMAND_KIND.TURN_RIGHT
        ? turnRight(robot.direction)
        : turnLeft(robot.direction);
    events.push({
      type: EXECUTION_EVENT_TYPE.TURNED,
      commandPath: [...commandPath],
      from: robot.direction,
      to: nextDirection,
    });
    return {
      state: {
        ...state,
        runtimeMaze,
        robot: { ...cloneRobot(robot), direction: nextDirection },
        frames: freezeFrames(frames),
      },
      events,
    };
  }

  if (command.kind === COMMAND_KIND.IF_HOLE) {
    const front = getForwardCoord(robot);
    if (getTile(runtimeMaze, front) !== TILE_KIND.HOLE) {
      return {
        state: {
          ...state,
          runtimeMaze,
          robot: cloneRobot(robot),
          frames: freezeFrames(frames),
        },
        events,
      };
    }

    const filledMaze = replaceTile(runtimeMaze, front, TILE_KIND.FLOOR);
    events.push({
      type: EXECUTION_EVENT_TYPE.HOLE_FILLED,
      commandPath: [...commandPath],
      at: cloneCoord(front),
    });
    return {
      state: {
        ...state,
        runtimeMaze: filledMaze,
        robot: cloneRobot(robot),
        frames: freezeFrames(frames),
      },
      events,
    };
  }

  const front = getForwardCoord(robot);
  if (!isWithinBounds(runtimeMaze, front)) {
    return {
      ...createFailureState(
        state,
        runtimeMaze,
        robot,
        frames,
        FAILURE_REASON.OUT_OF_BOUNDS,
        front,
        commandPath,
      ),
      events: [...events, createFailureEvent(FAILURE_REASON.OUT_OF_BOUNDS, front, commandPath)],
    };
  }

  const frontTile = getTile(runtimeMaze, front);
  if (frontTile === TILE_KIND.WALL) {
    return {
      ...createFailureState(
        state,
        runtimeMaze,
        robot,
        frames,
        FAILURE_REASON.WALL_COLLISION,
        front,
        commandPath,
      ),
      events: [...events, createFailureEvent(FAILURE_REASON.WALL_COLLISION, front, commandPath)],
    };
  }

  const nextRobot: Robot = {
    ...robot,
    position: cloneCoord(front),
  };
  const nextMoveCount = state.moveCount + 1;
  events.push({
    type: EXECUTION_EVENT_TYPE.MOVED,
    commandPath: [...commandPath],
    from: cloneCoord(robot.position),
    to: cloneCoord(front),
    moveCount: nextMoveCount,
  });

  if (frontTile === TILE_KIND.HOLE) {
    return {
      state: {
        ...state,
        runtimeMaze,
        robot: cloneRobot(nextRobot),
        frames: freezeFrames(frames),
        moveCount: nextMoveCount,
        status: "failure",
      },
      events: [...events, createFailureEvent(FAILURE_REASON.HOLE_FALL, front, commandPath)],
    };
  }

  const collection = collectKey(runtimeMaze, nextRobot);
  const collectedRobot = collection.robot;
  if (collection.event !== null) {
    events.push({ ...collection.event, commandPath: [...commandPath] });
  }

  const destination = getTeleportDestination(runtimeMaze, front);
  if (destination !== null) {
    events.push({
      type: EXECUTION_EVENT_TYPE.TELEPORT_ENTERED,
      commandPath: [...commandPath],
      from: cloneCoord(front),
      destination: cloneCoord(destination),
    });
    const pendingTeleport: PendingTeleport = {
      from: cloneCoord(front),
      destination: cloneCoord(destination),
      commandPath: [...commandPath],
    };
    return {
      state: {
        ...state,
        runtimeMaze,
        robot: cloneRobot(collectedRobot),
        frames: freezeFrames(frames),
        pendingTeleport,
        moveCount: nextMoveCount,
      },
      events,
    };
  }

  const status =
    frontTile === TILE_KIND.GOAL
      ? hasCollectedAllKeys(runtimeMaze, collectedRobot)
        ? "success"
        : "failure"
      : "running";
  if (status === "success") {
    events.push({
      type: EXECUTION_EVENT_TYPE.SUCCESS,
      reason: "goal-reached",
      at: cloneCoord(front),
    });
  } else if (status === "failure") {
    events.push(createFailureEvent(FAILURE_REASON.GOAL_BEFORE_KEYS, front, commandPath));
  }

  return {
    state: {
      ...state,
      runtimeMaze,
      robot: cloneRobot(collectedRobot),
      frames: freezeFrames(frames),
      moveCount: nextMoveCount,
      status,
    },
    events,
  };
};

/**
 * 実行状態を1内部ステップだけ進める。
 *
 * 入力状態のネストしたオブジェクトを変更せず、次の状態とそのステップで発生したイベントを返す。
 */
export const stepExecution = (state: ExecutionState): ExecutionStepResult => {
  if (state.status !== "running") return { state, events: [] };

  const runtimeMaze = cloneRuntimeMaze(state.runtimeMaze);
  const robot = cloneRobot(state.robot);
  const frames = cloneFrames(state.frames);

  if (state.pendingTeleport !== null) {
    return resolvePendingTeleport(state, runtimeMaze, robot, frames);
  }

  const next = nextCommand(frames);
  if (next === null) {
    return createFailureState(
      state,
      runtimeMaze,
      robot,
      frames,
      FAILURE_REASON.COMMAND_EXHAUSTED,
      robot.position,
      undefined,
    );
  }

  return executeLeafCommand(state, runtimeMaze, robot, frames, next.command, next.path);
};
