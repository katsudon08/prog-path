import { describe, expect, it } from "vitest";

import { cn } from "./cn";

// 同一スライス内なので Public API(index.ts) を介さず相対 import で内部実装を直接テストする。
describe("cn", () => {
  it("クラス名を空白区切りで結合する", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("falsy な値は無視する", () => {
    expect(cn("px-2", false, null, undefined, "")).toBe("px-2");
  });

  it("条件オブジェクトの true なキーだけを反映する", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("競合する Tailwind ユーティリティは後勝ちでマージする", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });
});
