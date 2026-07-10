import { describe, expect, it } from "vitest";

import { LOOP_COUNT_MAX, LOOP_COUNT_MIN } from "./command";

// 値のエコーではなく不変条件を検証する（意図は maze.test.ts のコメント参照）。
describe("command config", () => {
  it("loop 回数は MIN <= MAX", () => {
    expect(LOOP_COUNT_MIN).toBeLessThanOrEqual(LOOP_COUNT_MAX);
  });

  it("各値は正の整数", () => {
    for (const v of [LOOP_COUNT_MIN, LOOP_COUNT_MAX]) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
});
