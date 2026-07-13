// 同一スライス内なので相対 import で内部実装を直接テストする。
import { describe, expect, it } from "vitest";

import { COMMAND_VISUALS } from "./command-visual";
import type { CommandVisualKey } from "./command-visual";
import { COMMAND_KIND, LOOP_COMMAND_KIND } from "./types";

// 表示対象キーの網羅を検証するための唯一の正（`loop` は構築済み木のノード種別）。
const VISUAL_KEYS: readonly CommandVisualKey[] = [
  ...Object.values(COMMAND_KIND),
  LOOP_COMMAND_KIND,
];

describe("COMMAND_VISUALS", () => {
  it("全ての表示対象識別子にエントリが存在する", () => {
    for (const key of VISUAL_KEYS) {
      expect(COMMAND_VISUALS[key]).toBeDefined();
    }
    // 想定外のキーが増えていない（過不足なし）ことも確認する。
    expect(Object.keys(COMMAND_VISUALS).sort()).toEqual([...VISUAL_KEYS].sort());
  });

  it("各エントリは名称・色ユーティリティが非空でアイコンを持つ", () => {
    for (const key of VISUAL_KEYS) {
      const visual = COMMAND_VISUALS[key];
      expect(visual.labelJa.length).toBeGreaterThan(0);
      expect(visual.fillClass.length).toBeGreaterThan(0);
      expect(visual.foregroundClass.length).toBeGreaterThan(0);
      expect(visual.Icon).toBeTypeOf("object");
    }
  });
});
