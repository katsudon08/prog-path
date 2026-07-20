import { describe, expect, it } from "vitest";

import { DIRECTION } from "@/entities/robot";

import { directionToMapRotation, miniMapPosition } from "./mini-map-position";

describe("miniMapPosition", () => {
  it("マスの中心を % で返す（5x5 の左上マス = 10%, 10%）", () => {
    expect(miniMapPosition({ row: 0, col: 0 }, 5)).toEqual({ leftPct: 10, topPct: 10 });
  });

  it("右下マスは 100% から半マス内側", () => {
    expect(miniMapPosition({ row: 4, col: 4 }, 5)).toEqual({ leftPct: 90, topPct: 90 });
  });

  it("中央マスは 50%, 50%", () => {
    expect(miniMapPosition({ row: 2, col: 2 }, 5)).toEqual({ leftPct: 50, topPct: 50 });
  });

  it("col が left・row が top に対応する", () => {
    const position = miniMapPosition({ row: 1, col: 3 }, 5);
    expect(position.leftPct).toBe(70);
    expect(position.topPct).toBe(30);
  });
});

describe("directionToMapRotation", () => {
  it("北=0 / 東=90 / 南=180 / 西=270（上向き素材の時計回り）", () => {
    expect(directionToMapRotation(DIRECTION.NORTH)).toBeCloseTo(0);
    expect(directionToMapRotation(DIRECTION.EAST)).toBeCloseTo(90);
    expect(directionToMapRotation(DIRECTION.SOUTH)).toBeCloseTo(180);
    expect(directionToMapRotation(DIRECTION.WEST)).toBeCloseTo(270);
  });
});
