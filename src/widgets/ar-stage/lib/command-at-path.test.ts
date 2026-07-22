import { describe, expect, it } from "vitest";

import { COMMAND_KIND, COMMAND_VISUALS, LOOP_COMMAND_KIND } from "@/entities/command";
import type { Command } from "@/entities/command";

import { commandAtPath, getCommandLabel } from "./command-at-path";

/**
 * テスト用の木:
 *  [0] forward
 *  [1] loop(2)
 *      [1,0] turnRight
 *      [1,1] loop(3)
 *            [1,1,0] ifHole
 *  [2] turnLeft
 */
const tree: readonly Command[] = [
  { kind: COMMAND_KIND.FORWARD },
  {
    kind: LOOP_COMMAND_KIND,
    count: 2,
    children: [
      { kind: COMMAND_KIND.TURN_RIGHT },
      { kind: LOOP_COMMAND_KIND, count: 3, children: [{ kind: COMMAND_KIND.IF_HOLE }] },
    ],
  },
  { kind: COMMAND_KIND.TURN_LEFT },
];

describe("commandAtPath", () => {
  it("root 直下の葉を解決する", () => {
    expect(commandAtPath(tree, [0])).toEqual({ kind: COMMAND_KIND.FORWARD });
    expect(commandAtPath(tree, [2])).toEqual({ kind: COMMAND_KIND.TURN_LEFT });
  });

  it("loop ノード自身を解決する", () => {
    const loop = commandAtPath(tree, [1]);
    expect(loop).not.toBeNull();
    expect(loop?.kind).toBe(LOOP_COMMAND_KIND);
  });

  it("loop の子・孫（ネストパス）を解決する", () => {
    expect(commandAtPath(tree, [1, 0])).toEqual({ kind: COMMAND_KIND.TURN_RIGHT });
    expect(commandAtPath(tree, [1, 1, 0])).toEqual({ kind: COMMAND_KIND.IF_HOLE });
  });

  it("空パスは null（root 配列自体は命令ではない）", () => {
    expect(commandAtPath(tree, [])).toBeNull();
  });

  it("範囲外 index は null", () => {
    expect(commandAtPath(tree, [3])).toBeNull();
    expect(commandAtPath(tree, [1, 2])).toBeNull();
    expect(commandAtPath(tree, [-1])).toBeNull();
  });

  it("葉の下へ潜るパスは null", () => {
    expect(commandAtPath(tree, [0, 0])).toBeNull();
    expect(commandAtPath(tree, [1, 0, 0])).toBeNull();
  });

  it("非整数 index は null", () => {
    expect(commandAtPath(tree, [0.5])).toBeNull();
  });
});

describe("getCommandLabel", () => {
  it("葉は COMMAND_VISUALS の labelJa を返す", () => {
    expect(getCommandLabel({ kind: COMMAND_KIND.FORWARD })).toBe(COMMAND_VISUALS.forward.labelJa);
    expect(getCommandLabel({ kind: COMMAND_KIND.TURN_LEFT })).toBe("左にまがる");
  });

  it("loop はトースト文言と同じ「くりかえし」を返す", () => {
    expect(getCommandLabel({ kind: LOOP_COMMAND_KIND, count: 2, children: [] })).toBe("くりかえし");
  });
});
