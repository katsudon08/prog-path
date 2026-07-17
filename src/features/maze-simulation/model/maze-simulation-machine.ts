import { assign, setup } from "xstate";

import { stepExecution, createExecutionSession } from "./execution-engine";
import {
  EXECUTION_EVENT_TYPE,
  EXECUTION_INPUT_ERROR_CODE,
  FAILURE_REASON,
  type ExecutionEvent,
  type MazeSimulationContext,
  type MazeSimulationEvent,
} from "./types";
import type { Maze } from "@/shared/db";

interface MazeSimulationMachineInput {
  readonly maze: Maze;
}

const createInputFailureEvent = (context: MazeSimulationContext): ExecutionEvent => ({
  type: EXECUTION_EVENT_TYPE.FAILURE,
  reason:
    context.inputError?.code === EXECUTION_INPUT_ERROR_CODE.INVALID_COMMAND
      ? FAILURE_REASON.INVALID_COMMAND
      : FAILURE_REASON.INVALID_MAZE,
});

const resetExecution = (context: MazeSimulationContext): Partial<MazeSimulationContext> => {
  const result = createExecutionSession(context.maze, context.program);
  if (!result.ok) {
    const nextContext: MazeSimulationContext = {
      ...context,
      execution: null,
      lastEvents: [],
      inputError: result.error,
    };
    return {
      execution: nextContext.execution,
      lastEvents: [createInputFailureEvent(nextContext)],
      inputError: nextContext.inputError,
    };
  }

  return {
    execution: result.state,
    lastEvents: [],
    inputError: null,
  };
};

const clearResult = (): Partial<MazeSimulationContext> => ({
  execution: null,
  lastEvents: [],
  inputError: null,
});

const machineSetup = setup({
  types: {
    context: {} as MazeSimulationContext,
    events: {} as MazeSimulationEvent,
  },
});

/**
 * 迷路実行ライフサイクルを管理する XState マシンを生成する。
 *
 * コマンド木の構築やアニメーションは担当せず、外部から受け取った `STEP` ごとに純粋な
 * `stepExecution` を呼び出す。これにより表示側が端末性能・アニメーション時間を制御できる。
 *
 * 戻り値の XState マシン型は巨大で明示的な記述が難しいため、戻り値型は推論に委ね、末尾の
 * `satisfies (input) => unknown` で入力型のみを保証する（CLAUDE.md「戻り値型を明示」の意図的な例外）。
 */
export const createMazeSimulationMachine = ((input: MazeSimulationMachineInput) =>
  machineSetup.createMachine({
    id: "mazeSimulation",
    initial: "idle",
    context: {
      maze: input.maze,
      program: [],
      execution: null,
      lastEvents: [],
      inputError: null,
    },
    states: {
      idle: {
        on: {
          COMMANDS_CHANGED: {
            target: "building",
            actions: assign(({ event }) => ({
              program: event.commands,
              inputError: null,
              lastEvents: [],
            })),
          },
          START_RUN: {
            target: "resetting",
            actions: assign(({ event }) => ({
              program: event.commands,
              inputError: null,
              lastEvents: [],
            })),
          },
        },
      },
      building: {
        on: {
          COMMANDS_CHANGED: {
            actions: assign(({ event }) => ({
              program: event.commands,
              inputError: null,
              lastEvents: [],
            })),
          },
          START_RUN: {
            target: "resetting",
            actions: assign(({ event }) => ({
              program: event.commands,
              inputError: null,
              lastEvents: [],
            })),
          },
        },
      },
      resetting: {
        entry: assign(({ context }) => resetExecution(context)),
        always: [
          {
            target: "running",
            guard: ({ context }) => context.execution !== null,
          },
          { target: "failure" },
        ],
      },
      running: {
        on: {
          STEP: {
            actions: assign(({ context }) => {
              if (context.execution === null) {
                return { lastEvents: [] };
              }
              const result = stepExecution(context.execution);
              return {
                execution: result.state,
                lastEvents: result.events,
              };
            }),
          },
          RESET_RUN: "resetting",
        },
        always: [
          {
            target: "success",
            guard: ({ context }) => context.execution?.status === "success",
          },
          {
            target: "failure",
            guard: ({ context }) => context.execution?.status === "failure",
          },
        ],
      },
      success: {
        on: {
          RETRY: "resetting",
          RESET_RUN: "resetting",
          CLOSE_RESULT: {
            target: "building",
            actions: assign(clearResult),
          },
        },
      },
      failure: {
        on: {
          RETRY: "resetting",
          RESET_RUN: "resetting",
          CLOSE_RESULT: {
            target: "building",
            actions: assign(clearResult),
          },
        },
      },
    },
  })) satisfies (input: MazeSimulationMachineInput) => unknown;
