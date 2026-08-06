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

  it("独自の文字サイズトークンが文字色と共存する（片方が消えない）", () => {
    // tailwind-merge は知らない `text-*` を文字色と推測するため、cn.ts の拡張が外れると
    // サイズ側が黙って消える。エラーにならず見た目だけ崩れる種類の事故なのでここで固定する。
    for (const size of ["text-support", "text-body", "text-label", "text-status"]) {
      expect(cn(size, "text-muted-foreground")).toBe(`${size} text-muted-foreground`);
      expect(cn("text-muted-foreground", size)).toBe(`text-muted-foreground ${size}`);
    }
  });

  it("独自の文字サイズトークン同士・既定スケールとの競合も後勝ちで解決する", () => {
    expect(cn("text-body", "text-label")).toBe("text-label");
    expect(cn("text-sm", "text-body")).toBe("text-body");
    expect(cn("text-body", "text-sm")).toBe("text-sm");
  });
});
