import { describe, expect, it } from "vitest";

import { TILE_KIND } from "../model/schema";

import { TELEPORT_VALIDATION_ERROR_CODE, validateTeleportLinks } from "./validate-teleport-links";

const floor = (): (typeof TILE_KIND)[keyof typeof TILE_KIND][][] =>
  Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => TILE_KIND.FLOOR as (typeof TILE_KIND)[keyof typeof TILE_KIND]),
  );

describe("validateTeleportLinks", () => {
  it("上下階の有効な移動先を受け入れる", () => {
    const lower = floor();
    const upper = floor();
    lower[1][1] = TILE_KIND.TELEPORT_UP;
    upper[3][3] = TILE_KIND.TELEPORT_DOWN;

    expect(validateTeleportLinks({ floors: 2, size: 5, tiles: [lower, upper] })).toEqual([]);
  });

  it("存在しない階へのテレポートを検出する", () => {
    const tiles = [floor()];
    tiles[0][1][1] = TILE_KIND.TELEPORT_UP;

    expect(validateTeleportLinks({ floors: 1, size: 5, tiles })).toMatchObject([
      { code: TELEPORT_VALIDATION_ERROR_CODE.DESTINATION_OUT_OF_BOUNDS },
    ]);
  });

  it("壁・穴・テレポートへの移動を検出する", () => {
    const lower = floor();
    const upper = floor();
    lower[1][1] = TILE_KIND.TELEPORT_UP;
    upper[1][1] = TILE_KIND.WALL;
    upper[2][2] = TILE_KIND.TELEPORT_DOWN;
    lower[2][2] = TILE_KIND.HOLE;

    expect(validateTeleportLinks({ floors: 2, size: 5, tiles: [lower, upper] })).toEqual([
      expect.objectContaining({
        code: TELEPORT_VALIDATION_ERROR_CODE.DESTINATION_BLOCKED,
        destinationKind: TILE_KIND.WALL,
      }),
      expect.objectContaining({
        code: TELEPORT_VALIDATION_ERROR_CODE.DESTINATION_BLOCKED,
        destinationKind: TILE_KIND.HOLE,
      }),
    ]);
  });
});
