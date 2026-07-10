import { describe, expect, it } from "vitest";

import { UNCATEGORIZED_FOLDER_ID } from "./folder";

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// 予約 ID は通常フォルダ ID(UUID) と同じ形式で持つ。空文字・書式崩れの編集事故を検出する。
describe("folder config", () => {
  it("未分類フォルダの予約 ID は非空文字列", () => {
    expect(typeof UNCATEGORIZED_FOLDER_ID).toBe("string");
    expect(UNCATEGORIZED_FOLDER_ID.length).toBeGreaterThan(0);
  });

  it("予約 ID は UUID 形式", () => {
    expect(UNCATEGORIZED_FOLDER_ID).toMatch(UUID_PATTERN);
  });
});
