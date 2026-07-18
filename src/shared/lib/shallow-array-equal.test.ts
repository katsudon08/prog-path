import { describe, expect, it } from "vitest";

import { shallowArrayEqual } from "./shallow-array-equal";

// 同一スライス内なので Public API(index.ts) を介さず相対 import で内部実装を直接テストする。
describe("shallowArrayEqual", () => {
  it("空配列同士は true", () => {
    expect(shallowArrayEqual([], [])).toBe(true);
  });

  it("長さも各要素も一致すれば true", () => {
    expect(shallowArrayEqual([1, 0, 2], [1, 0, 2])).toBe(true);
  });

  it("参照が違っても値が一致すれば true", () => {
    const a = [0, 1];
    const b = [0, 1];
    expect(a).not.toBe(b);
    expect(shallowArrayEqual(a, b)).toBe(true);
  });

  it("長さが違えば false", () => {
    expect(shallowArrayEqual([1, 0], [1, 0, 0])).toBe(false);
  });

  it("同じ長さでも要素が違えば false", () => {
    expect(shallowArrayEqual([1, 0], [1, 2])).toBe(false);
  });

  it("number 以外（文字列）でも generic に動く", () => {
    expect(shallowArrayEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(shallowArrayEqual(["a", "b"], ["a", "c"])).toBe(false);
  });
});
