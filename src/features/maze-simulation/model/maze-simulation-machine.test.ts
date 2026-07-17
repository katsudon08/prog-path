import { createActor } from "xstate";
import { describe, expect, it } from "vitest";

import { COMMAND_KIND, type Command } from "@/entities/command";
import { createInitialMaze, TILE_KIND } from "@/entities/maze";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";
import type { Maze } from "@/shared/db";

import { createMazeSimulationMachine } from "./maze-simulation-machine";

const createMaze = (): Maze => {
  const structure = createInitialMaze(5, 1);
  structure.tiles[0][4][4] = TILE_KIND.FLOOR;
  structure.tiles[0][1][0] = TILE_KIND.GOAL;
  return {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    name: "マシンテスト迷路",
    folderId: UNCATEGORIZED_FOLDER_ID,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...structure,
  };
};

const forward: Command = { kind: COMMAND_KIND.FORWARD };
const turnRight: Command = { kind: COMMAND_KIND.TURN_RIGHT };

describe("createMazeSimulationMachine", () => {
  it("Idle → Building → Running → Success のライフサイクルを進める", () => {
    const actor = createActor(createMazeSimulationMachine({ maze: createMaze() }));
    actor.start();
    expect(actor.getSnapshot().value).toBe("idle");

    actor.send({ type: "COMMANDS_CHANGED", commands: [forward] });
    expect(actor.getSnapshot().value).toBe("building");
    expect(actor.getSnapshot().context.program).toEqual([forward]);

    actor.send({ type: "START_RUN", commands: [forward] });
    expect(actor.getSnapshot().value).toBe("running");
    expect(actor.getSnapshot().context.execution?.robot.position).toEqual({
      floor: 0,
      row: 0,
      col: 0,
    });

    actor.send({ type: "STEP" });
    expect(actor.getSnapshot().value).toBe("success");
    expect(actor.getSnapshot().context.execution?.status).toBe("success");

    actor.stop();
  });

  it("Running 中のコマンド変更を無視し、Reset で開始状態へ戻す", () => {
    const actor = createActor(createMazeSimulationMachine({ maze: createMaze() }));
    actor.start();
    actor.send({ type: "START_RUN", commands: [turnRight] });
    expect(actor.getSnapshot().value).toBe("running");

    actor.send({ type: "COMMANDS_CHANGED", commands: [forward] });
    expect(actor.getSnapshot().context.program).toEqual([turnRight]);
    actor.send({ type: "STEP" });
    expect(actor.getSnapshot().context.execution?.robot.direction).toBe("west");

    actor.send({ type: "RESET_RUN" });
    expect(actor.getSnapshot().value).toBe("running");
    expect(actor.getSnapshot().context.execution?.robot.direction).toBe("south");
    expect(actor.getSnapshot().context.execution?.robot.position).toEqual({
      floor: 0,
      row: 0,
      col: 0,
    });

    actor.stop();
  });

  it("Failure 後も Retry / Reset / Close でコマンド木を保持する", () => {
    const actor = createActor(createMazeSimulationMachine({ maze: createMaze() }));
    actor.start();
    actor.send({ type: "START_RUN", commands: [turnRight] });
    actor.send({ type: "STEP" });
    actor.send({ type: "STEP" });
    expect(actor.getSnapshot().value).toBe("failure");

    actor.send({ type: "RETRY" });
    expect(actor.getSnapshot().value).toBe("running");
    expect(actor.getSnapshot().context.program).toEqual([turnRight]);

    actor.send({ type: "STEP" });
    actor.send({ type: "STEP" });
    expect(actor.getSnapshot().value).toBe("failure");
    actor.send({ type: "RESET_RUN" });
    expect(actor.getSnapshot().value).toBe("running");
    actor.send({ type: "STEP" });
    actor.send({ type: "STEP" });
    expect(actor.getSnapshot().value).toBe("failure");

    actor.send({ type: "CLOSE_RESULT" });
    expect(actor.getSnapshot().value).toBe("building");
    expect(actor.getSnapshot().context.program).toEqual([turnRight]);
    expect(actor.getSnapshot().context.execution).toBeNull();

    actor.stop();
  });

  it("不正なコマンドで Resetting から Failure へ遷移する", () => {
    const actor = createActor(createMazeSimulationMachine({ maze: createMaze() }));
    actor.start();
    actor.send({
      type: "START_RUN",
      commands: [{ kind: "unknown" }] as unknown as readonly Command[],
    });

    expect(actor.getSnapshot().value).toBe("failure");
    expect(actor.getSnapshot().context.inputError?.code).toBe("invalid-command");
    expect(actor.getSnapshot().context.lastEvents).toContainEqual(
      expect.objectContaining({ type: "failure", reason: "invalid-command" }),
    );

    actor.stop();
  });
});
