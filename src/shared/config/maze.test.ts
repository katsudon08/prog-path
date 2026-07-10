import { describe, expect, it } from "vitest";

import { MAZE_FLOOR_COUNT_MAX, MAZE_FLOOR_COUNT_MIN, MAZE_SIZE_MAX, MAZE_SIZE_MIN } from "./maze";

// 値のエコー（`toBe(5)` 等）ではなく不変条件を検証する。MIN/MAX を取り違えると
// clamp() は RangeError、Zod .min().max() は「どの値も通らない」静かな不具合になるが
// 型では防げないため、編集事故をテストで検出する。
describe("maze config", () => {
  it("サイズは MIN <= MAX", () => {
    expect(MAZE_SIZE_MIN).toBeLessThanOrEqual(MAZE_SIZE_MAX);
  });

  it("階層数は MIN <= MAX", () => {
    expect(MAZE_FLOOR_COUNT_MIN).toBeLessThanOrEqual(MAZE_FLOOR_COUNT_MAX);
  });

  it("各値は正の整数", () => {
    for (const v of [MAZE_SIZE_MIN, MAZE_SIZE_MAX, MAZE_FLOOR_COUNT_MIN, MAZE_FLOOR_COUNT_MAX]) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
});
