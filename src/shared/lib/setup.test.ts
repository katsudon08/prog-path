import { describe, expect, it } from "vitest";

// vitest が動くことの確認用。#293 で実際のテストが入ったら消す
describe("テスト環境", () => {
  it("vitest が動く", () => {
    expect(1 + 1).toBe(2);
  });
});
