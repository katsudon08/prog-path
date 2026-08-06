import { describe, expect, it } from "vitest";

import { FOLDER_VISUALS } from "./folder-visual";
import { FOLDER_KIND } from "./types";
import type { FolderKind } from "./types";

const ALL_KINDS: FolderKind[] = Object.values(FOLDER_KIND);

describe("FOLDER_VISUALS", () => {
  it("全種別を過不足なく網羅する", () => {
    expect(Object.keys(FOLDER_VISUALS).sort()).toEqual([...ALL_KINDS].sort());
  });

  it("種別ごとにアイコンが異なる（色に頼らず形で識別できる）", () => {
    const icons = ALL_KINDS.map((kind) => FOLDER_VISUALS[kind].Icon);
    expect(new Set(icons).size).toBe(ALL_KINDS.length);
  });

  it("呼び名が空でなく、重複しない", () => {
    const labels = ALL_KINDS.map((kind) => FOLDER_VISUALS[kind].labelJa);
    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(ALL_KINDS.length);
  });
});
