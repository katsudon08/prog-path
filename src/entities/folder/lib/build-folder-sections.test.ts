import { describe, expect, it } from "vitest";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { FOLDER_KIND } from "../model/types";
import type { Folder } from "../model/types";
import { buildFolderSections } from "./build-folder-sections";

const folder = (id: string, name: string, createdAt: number): Folder => ({ id, name, createdAt });

const TUTORIAL = folder(TUTORIAL_FOLDER_ID, "チュートリアル", 1);
const UNCATEGORIZED = folder(UNCATEGORIZED_FOLDER_ID, "未分類", 0);
const SCIENCE = folder("3f2504e0-4f89-41d3-9a0c-0305e82c3301", "じっけん", 100);
const RACE = folder("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", "きょうそう", 200);

const ALL = [SCIENCE, UNCATEGORIZED, RACE, TUTORIAL];

describe("buildFolderSections", () => {
  it("空入力でも 3 セクションを固定順で返す", () => {
    const sections = buildFolderSections([]);
    expect(sections.map((section) => section.kind)).toEqual([
      FOLDER_KIND.TUTORIAL,
      FOLDER_KIND.USER,
      FOLDER_KIND.UNCATEGORIZED,
    ]);
    expect(sections.every((section) => section.folders.length === 0)).toBe(true);
  });

  it("種別ごとに振り分ける", () => {
    const [tutorial, user, uncategorized] = buildFolderSections(ALL);
    expect(tutorial.folders).toEqual([TUTORIAL]);
    expect(user.folders).toEqual([SCIENCE, RACE]);
    expect(uncategorized.folders).toEqual([UNCATEGORIZED]);
  });

  it("セクション内は createdAt 昇順に並ぶ", () => {
    const older = folder("a0000000-0000-4000-8000-000000000001", "あと", 300);
    const newer = folder("b0000000-0000-4000-8000-000000000002", "さき", 50);
    const [, user] = buildFolderSections([older, newer]);
    expect(user.folders.map((f) => f.name)).toEqual(["さき", "あと"]);
  });

  it("createdAt が同値なら id のコードポイント順で決定的に並ぶ", () => {
    const b = folder("b0000000-0000-4000-8000-000000000000", "びー", 42);
    const a = folder("a0000000-0000-4000-8000-000000000000", "えー", 42);
    const [, user] = buildFolderSections([b, a]);
    expect(user.folders.map((f) => f.id)).toEqual([a.id, b.id]);
  });

  it("入力の順序を変えても結果が同一（並びが入力順に依存しない）", () => {
    const forward = buildFolderSections(ALL);
    const reversed = buildFolderSections([...ALL].reverse());
    expect(reversed).toEqual(forward);
  });

  it("入力配列を破壊しない", () => {
    const input = [...ALL];
    buildFolderSections(input);
    expect(input).toEqual(ALL);
  });

  it("予約フォルダが欠けていても落ちず、そのセクションだけ空になる", () => {
    const sections = buildFolderSections([SCIENCE]);
    expect(sections).toHaveLength(3);
    expect(sections[0].folders).toEqual([]);
    expect(sections[1].folders).toEqual([SCIENCE]);
    expect(sections[2].folders).toEqual([]);
  });

  it("全フォルダが過不足なくどれか 1 セクションにだけ現れる", () => {
    const sections = buildFolderSections(ALL);
    const flattened = sections.flatMap((section) => section.folders);
    expect(flattened).toHaveLength(ALL.length);
    expect(new Set(flattened.map((f) => f.id)).size).toBe(ALL.length);
  });
});
