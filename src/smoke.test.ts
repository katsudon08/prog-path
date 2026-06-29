import { describe, expect, it } from "vitest";

// ツールチェーン（vp test / Vitest）疎通確認用のスモークテスト。
// テストの配置・命名規約と代表サンプルは shared/lib/clamp.test.ts を参照（→ CLAUDE.md「テスト」）。
describe("toolchain smoke", () => {
  it("Vitest(vp test)が実行できる", () => {
    expect(1 + 1).toBe(2);
  });
});
