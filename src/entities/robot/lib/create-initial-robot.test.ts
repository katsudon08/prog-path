// 同一スライス内なので Public API を介さず相対 import する。
import { describe, expect, it } from "vitest";

import { DIRECTION } from "../model/types";
import type { RobotCoord } from "../model/types";
import { DEFAULT_DIRECTION, createInitialRobot } from "./create-initial-robot";

describe("createInitialRobot", () => {
  const start: RobotCoord = { floor: 0, row: 0, col: 0 };

  it("start 位置・固定初期向き（南）・空のカギで初期化する", () => {
    const robot = createInitialRobot(start);
    expect(robot.position).toEqual(start);
    expect(robot.direction).toBe(DEFAULT_DIRECTION);
    expect(DEFAULT_DIRECTION).toBe(DIRECTION.SOUTH);
    expect(robot.collectedKeys).toEqual([]);
  });

  it("純粋・決定的（同じ入力で同値）", () => {
    expect(createInitialRobot(start)).toEqual(createInitialRobot(start));
  });

  it("start をコピーして保持する（入力への参照を共有しない）", () => {
    const robot = createInitialRobot(start);
    expect(robot.position).not.toBe(start);
  });

  it("floor が 0 でない start も扱える", () => {
    const robot = createInitialRobot({ floor: 2, row: 3, col: 1 });
    expect(robot.position).toEqual({ floor: 2, row: 3, col: 1 });
  });
});
