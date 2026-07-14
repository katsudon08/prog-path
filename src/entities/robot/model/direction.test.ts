// 同一スライス内なので Public API を介さず相対 import する。
import { describe, expect, it } from "vitest";

import { DIRECTION_VECTOR, directionToYaw, turnLeft, turnRight } from "./direction";
import { DIRECTION } from "./types";
import type { Direction } from "./types";

const ALL_DIRECTIONS = Object.values(DIRECTION);

describe("turnRight", () => {
  it("北→東→南→西→北 の順に時計回りする", () => {
    expect(turnRight(DIRECTION.NORTH)).toBe(DIRECTION.EAST);
    expect(turnRight(DIRECTION.EAST)).toBe(DIRECTION.SOUTH);
    expect(turnRight(DIRECTION.SOUTH)).toBe(DIRECTION.WEST);
    expect(turnRight(DIRECTION.WEST)).toBe(DIRECTION.NORTH);
  });

  it("4 回の右回転で元の向きへ戻る", () => {
    for (const dir of ALL_DIRECTIONS) {
      expect(turnRight(turnRight(turnRight(turnRight(dir))))).toBe(dir);
    }
  });
});

describe("turnLeft", () => {
  it("北→西→南→東→北 の順に反時計回りする", () => {
    expect(turnLeft(DIRECTION.NORTH)).toBe(DIRECTION.WEST);
    expect(turnLeft(DIRECTION.WEST)).toBe(DIRECTION.SOUTH);
    expect(turnLeft(DIRECTION.SOUTH)).toBe(DIRECTION.EAST);
    expect(turnLeft(DIRECTION.EAST)).toBe(DIRECTION.NORTH);
  });

  it("turnLeft は turnRight の逆操作", () => {
    for (const dir of ALL_DIRECTIONS) {
      expect(turnLeft(turnRight(dir))).toBe(dir);
      expect(turnRight(turnLeft(dir))).toBe(dir);
    }
  });
});

describe("DIRECTION_VECTOR", () => {
  it("北=row-1 / 東=col+1 / 南=row+1 / 西=col-1 の座標差を持つ", () => {
    expect(DIRECTION_VECTOR[DIRECTION.NORTH]).toEqual({ dRow: -1, dCol: 0 });
    expect(DIRECTION_VECTOR[DIRECTION.EAST]).toEqual({ dRow: 0, dCol: 1 });
    expect(DIRECTION_VECTOR[DIRECTION.SOUTH]).toEqual({ dRow: 1, dCol: 0 });
    expect(DIRECTION_VECTOR[DIRECTION.WEST]).toEqual({ dRow: 0, dCol: -1 });
  });

  it("全方向を網羅する（追加漏れ検出）", () => {
    expect(Object.keys(DIRECTION_VECTOR).sort()).toEqual([...ALL_DIRECTIONS].sort());
  });

  it("右回転は座標差の 90 度回転に一致する（dRow,dCol → dCol,-dRow）", () => {
    for (const dir of ALL_DIRECTIONS) {
      const before = DIRECTION_VECTOR[dir];
      const after = DIRECTION_VECTOR[turnRight(dir)];
      // `|| 0` は -0 を +0 に正規化する（toEqual は -0 と +0 を区別するため）。
      expect(after).toEqual({ dRow: before.dCol || 0, dCol: -before.dRow || 0 });
    }
  });
});

describe("directionToYaw", () => {
  it("南（world +z）が yaw 0", () => {
    expect(directionToYaw(DIRECTION.SOUTH)).toBeCloseTo(0);
  });

  it("各向きの yaw で +z ベクトルが world 前方（dCol, dRow）へ回る", () => {
    for (const dir of ALL_DIRECTIONS) {
      const yaw = directionToYaw(dir);
      // yaw で回した +z の写り先 (sinθ, cosθ) が (dCol, dRow) に一致する。
      const { dRow, dCol } = DIRECTION_VECTOR[dir];
      expect(Math.sin(yaw)).toBeCloseTo(dCol);
      expect(Math.cos(yaw)).toBeCloseTo(dRow);
    }
  });
});

// 型として Direction が Object.values で列挙できることの確認（コンパイル兼ドキュメント）。
const _exhaustive: Direction[] = ALL_DIRECTIONS;
void _exhaustive;
