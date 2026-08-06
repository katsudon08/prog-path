import { describe, expect, it } from "vitest";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { FOLDER_KIND, getFolderKind, isFolderKind } from "./types";
import type { FolderKind } from "./types";

const ALL_KINDS: FolderKind[] = Object.values(FOLDER_KIND);

describe("FOLDER_KIND", () => {
  it("識別子が重複しない", () => {
    expect(new Set(ALL_KINDS).size).toBe(ALL_KINDS.length);
  });

  it("宣言順が表示順（先頭=チュートリアル / 末尾=未分類）", () => {
    // 予約フォルダを先頭と末尾に固定し「これは特別」を位置で伝える（docs/screen-specs.md 4.4）。
    // 並べ替えは画面の変更にあたるため、ここで固定して事故を型ではなくテストで止める。
    expect(ALL_KINDS).toEqual([FOLDER_KIND.TUTORIAL, FOLDER_KIND.USER, FOLDER_KIND.UNCATEGORIZED]);
  });
});

describe("isFolderKind", () => {
  it("正規の識別子を全て受理する", () => {
    for (const kind of ALL_KINDS) {
      expect(isFolderKind(kind)).toBe(true);
    }
  });

  it("未知の値を拒否する", () => {
    for (const value of ["", "TUTORIAL", "folder", null, undefined, 0, {}]) {
      expect(isFolderKind(value)).toBe(false);
    }
  });
});

describe("getFolderKind", () => {
  it("予約 ID を対応する種別へ写す", () => {
    expect(getFolderKind(TUTORIAL_FOLDER_ID)).toBe(FOLDER_KIND.TUTORIAL);
    expect(getFolderKind(UNCATEGORIZED_FOLDER_ID)).toBe(FOLDER_KIND.UNCATEGORIZED);
  });

  it("予約 ID 以外は全てユーザフォルダ扱い（空文字・非 UUID・存在しない ID を含む）", () => {
    const others = [
      "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      "",
      "not-a-uuid",
      // 予約 ID に近いだけの値は完全一致しないのでユーザフォルダ。
      `${TUTORIAL_FOLDER_ID}0`,
      TUTORIAL_FOLDER_ID.slice(0, -1),
      TUTORIAL_FOLDER_ID.replace(/-/g, ""),
    ];
    for (const id of others) {
      expect(getFolderKind(id)).toBe(FOLDER_KIND.USER);
    }
  });

  it("どんな入力でも必ず FolderKind を返す（全域関数）", () => {
    for (const id of ["", " ", "🎓", "null", "undefined", "0"]) {
      expect(isFolderKind(getFolderKind(id))).toBe(true);
    }
  });
});
