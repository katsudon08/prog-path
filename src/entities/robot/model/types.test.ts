// 同一スライス内なので Public API を介さず相対 import する。
import { describe, expect, it } from "vitest";

import { DIRECTION, isDirection } from "./types";

describe("isDirection", () => {
  it("4 方向の識別子を受理する", () => {
    for (const dir of Object.values(DIRECTION)) {
      expect(isDirection(dir)).toBe(true);
    }
  });

  it("未知の文字列・非文字列を拒否する", () => {
    expect(isDirection("up")).toBe(false);
    expect(isDirection("North")).toBe(false); // 大文字始まりは別物
    expect(isDirection("")).toBe(false);
    expect(isDirection(0)).toBe(false);
    expect(isDirection(null)).toBe(false);
    expect(isDirection(undefined)).toBe(false);
  });
});
