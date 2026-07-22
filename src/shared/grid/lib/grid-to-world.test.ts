import type { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { CELL, FLOOR_GAP, gridOffset, gridToWorld, gridToWorldInto } from "./grid-to-world";

// 同一スライス内なので Public API(index.ts) を介さず相対 import で内部実装を直接テストする。
// 環境は既定 node（three への実行時依存を避けるため Vector3 は最小スタブで代用する）。

/**
 * gridToWorldInto の contract 検証用の最小 Vector3 スタブ。
 * 使うのは `set(x, y, z): this` のみ。three を node テストへ持ち込まずに
 * 「成分一致」と「同一参照を返す」を確認する。
 */
class FakeVector3 {
  x = 0;
  y = 0;
  z = 0;
  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

const makeOut = (): Vector3 => new FakeVector3() as unknown as Vector3;

describe("gridOffset", () => {
  it("奇数サイズは整数の中央値を返す", () => {
    expect(gridOffset(5)).toBe(2);
  });

  it("偶数サイズは .5 の中央値を返す", () => {
    expect(gridOffset(6)).toBe(2.5);
  });
});

describe("gridToWorld", () => {
  it("奇数サイズの中央マスは x=z=0（中央寄せ）", () => {
    // size 5 → offset 2。中央 (row=2, col=2) は原点。
    expect(gridToWorld({ floor: 0, row: 2, col: 2 }, 5)).toEqual([0, 0, 0]);
  });

  it("col → x / row → z を割り当て、符号も一致する", () => {
    // size 5 → offset 2, CELL=1。
    // col=3 → x=+1, row=1 → z=-1。
    expect(gridToWorld({ floor: 0, row: 1, col: 3 }, 5)).toEqual([1 * CELL, 0, -1 * CELL]);
    // col=0 → x=-2, row=4 → z=+2。
    expect(gridToWorld({ floor: 0, row: 4, col: 0 }, 5)).toEqual([-2 * CELL, 0, 2 * CELL]);
  });

  it("floor → y は FLOOR_GAP 刻み", () => {
    const base = gridToWorld({ floor: 0, row: 2, col: 2 }, 5);
    const up1 = gridToWorld({ floor: 1, row: 2, col: 2 }, 5);
    const up2 = gridToWorld({ floor: 2, row: 2, col: 2 }, 5);
    expect(base[1]).toBe(0);
    expect(up1[1]).toBe(FLOOR_GAP);
    expect(up2[1]).toBe(2 * FLOOR_GAP);
  });

  it("偶数サイズは半マスずれる（offset=2.5）", () => {
    // size 6 → offset 2.5。col=3 → x=+0.5, row=2 → z=-0.5。
    expect(gridToWorld({ floor: 0, row: 2, col: 3 }, 6)).toEqual([0.5 * CELL, 0, -0.5 * CELL]);
  });
});

describe("gridToWorldInto", () => {
  it("タプル版と成分が一致する", () => {
    const coord = { floor: 2, row: 1, col: 3 };
    const [x, y, z] = gridToWorld(coord, 5);
    const out = makeOut();
    const result = gridToWorldInto(coord, 5, out);
    expect(result.x).toBe(x);
    expect(result.y).toBe(y);
    expect(result.z).toBe(z);
  });

  it("引数の out と同一参照を返す（GC 抑制のため上書き）", () => {
    const out = makeOut();
    const result = gridToWorldInto({ floor: 0, row: 0, col: 0 }, 5, out);
    expect(result).toBe(out);
  });
});
