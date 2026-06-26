import { describe, expect, it } from "vitest";

// ツールチェーン疎通確認用のスモークテスト。テスト規約・本格的なテストは #172 で整備する。
describe("toolchain smoke", () => {
  it("Vitest(vp test)が実行できる", () => {
    expect(1 + 1).toBe(2);
  });
});
