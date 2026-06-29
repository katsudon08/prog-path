import { describe, expect, it } from "vitest";

import { clamp } from "./clamp";

// 配置・命名規約のサンプル: テストは対象と co-location（`clamp.ts` の隣に `clamp.test.ts`）。
// 同一スライス内なので Public API(index.ts) を介さず相対 import で内部実装を直接テストする。
describe("clamp", () => {
  it("範囲内の値はそのまま返す", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("下限未満は min に丸める", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("上限超は max に丸める", () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("境界値(min/max)は含む", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("min > max は RangeError を投げる", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });
});
