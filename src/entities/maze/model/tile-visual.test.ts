import { describe, expect, it } from "vitest";

import { TILE_COLOR_3D, TILE_VISUALS } from "./tile-visual";
import { TILE_KIND } from "./types";

const ALL_KINDS = Object.values(TILE_KIND).sort();

describe("TILE_VISUALS", () => {
  it("全タイル種別を過不足なく網羅する", () => {
    expect(Object.keys(TILE_VISUALS).sort()).toEqual(ALL_KINDS);
  });

  it("各定義が名称・アイコン・色クラスを持つ", () => {
    for (const visual of Object.values(TILE_VISUALS)) {
      expect(visual.labelJa.length).toBeGreaterThan(0);
      // lucide アイコンは forwardRef 済みのオブジェクト。
      expect(visual.Icon).toBeTypeOf("object");
      expect(visual.fillClass).toMatch(/^bg-tile-/);
      expect(visual.foregroundClass).toMatch(/^text-tile-.*-foreground$/);
    }
  });
});

describe("TILE_COLOR_3D", () => {
  it("全タイル種別を過不足なく網羅する", () => {
    expect(Object.keys(TILE_COLOR_3D).sort()).toEqual(ALL_KINDS);
  });

  it("各色が hex リテラル", () => {
    for (const color of Object.values(TILE_COLOR_3D)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
