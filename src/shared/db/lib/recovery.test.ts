import { describe, expect, it } from "vitest";

import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { FolderSchema } from "../model/schema";
import type { Folder } from "../model/schema";
import {
  UNCATEGORIZED_FOLDER_NAME,
  buildUncategorizedFolder,
  hasUncategorizedFolder,
  partitionValid,
} from "./recovery";

describe("partitionValid", () => {
  it("妥当・不正を振り分ける", () => {
    const rows = [
      { id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301", name: "算数", createdAt: 1 },
      { id: "not-a-uuid", name: "壊れ", createdAt: 1 }, // 不正
      { name: "name欠落" }, // 不正
    ];
    const { valid, invalid } = partitionValid(rows, FolderSchema);
    expect(valid).toHaveLength(1);
    expect(invalid).toHaveLength(2);
  });

  it("空入力では両方空", () => {
    const { valid, invalid } = partitionValid([], FolderSchema);
    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(0);
  });
});

describe("buildUncategorizedFolder", () => {
  it("予約 ID・固定名・固定 createdAt を持ち、スキーマ検証を通る", () => {
    const folder = buildUncategorizedFolder();
    expect(folder.id).toBe(UNCATEGORIZED_FOLDER_ID);
    expect(folder.name).toBe(UNCATEGORIZED_FOLDER_NAME);
    expect(folder.createdAt).toBe(0);
    expect(FolderSchema.safeParse(folder).success).toBe(true);
  });
});

describe("hasUncategorizedFolder", () => {
  const normal: Folder = {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    name: "算数",
    createdAt: 1,
  };

  it("予約 ID があれば true", () => {
    expect(hasUncategorizedFolder([normal, buildUncategorizedFolder()])).toBe(true);
  });

  it("予約 ID が無ければ false（0 件も false）", () => {
    expect(hasUncategorizedFolder([normal])).toBe(false);
    expect(hasUncategorizedFolder([])).toBe(false);
  });
});
