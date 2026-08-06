import { describe, expect, it } from "vitest";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { FOLDER_CAPABILITIES, canManageFolder, getFolderCapabilities } from "./folder-capabilities";
import { FOLDER_KIND } from "./types";
import type { FolderKind } from "./types";

const USER_FOLDER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const ALL_KINDS: FolderKind[] = Object.values(FOLDER_KIND);

describe("FOLDER_CAPABILITIES", () => {
  it("全種別を過不足なく網羅する", () => {
    expect(Object.keys(FOLDER_CAPABILITIES).sort()).toEqual([...ALL_KINDS].sort());
  });

  it("チュートリアルは「箱は消せるが中身は読み取り専用」", () => {
    expect(FOLDER_CAPABILITIES[FOLDER_KIND.TUTORIAL]).toEqual({
      canDeleteFolder: true,
      canRenameFolder: false,
      canMoveMazesInOut: false,
      canEditMazes: false,
      canDeleteMazes: true,
    });
  });

  it("未分類は「出入り自由だが箱は消せない」", () => {
    expect(FOLDER_CAPABILITIES[FOLDER_KIND.UNCATEGORIZED]).toEqual({
      canDeleteFolder: false,
      canRenameFolder: false,
      canMoveMazesInOut: true,
      canEditMazes: true,
      canDeleteMazes: true,
    });
  });

  it("ユーザフォルダは全て許可", () => {
    const capabilities = FOLDER_CAPABILITIES[FOLDER_KIND.USER];
    expect(Object.values(capabilities).every(Boolean)).toBe(true);
  });
});

describe("権限マトリクスの横断不変条件", () => {
  it("リネームできるのはユーザフォルダだけ（予約フォルダの名前は固定）", () => {
    const renamable = ALL_KINDS.filter((kind) => FOLDER_CAPABILITIES[kind].canRenameFolder);
    expect(renamable).toEqual([FOLDER_KIND.USER]);
  });

  it("中身の出入りが禁止なのはチュートリアルだけ", () => {
    // 出入りを両方向とも禁じることで「中身は教材迷路 6 件の部分集合」が不変になる。
    const locked = ALL_KINDS.filter((kind) => !FOLDER_CAPABILITIES[kind].canMoveMazesInOut);
    expect(locked).toEqual([FOLDER_KIND.TUTORIAL]);
  });

  it("迷路 1 件の削除はどの種別でもできる（消す自由は常に残す）", () => {
    expect(ALL_KINDS.every((kind) => FOLDER_CAPABILITIES[kind].canDeleteMazes)).toBe(true);
  });

  it("リネームできるならフォルダ削除もできる（管理操作が片方だけ許される種別は無い）", () => {
    for (const kind of ALL_KINDS) {
      const { canRenameFolder, canDeleteFolder } = FOLDER_CAPABILITIES[kind];
      if (canRenameFolder) {
        expect(canDeleteFolder).toBe(true);
      }
    }
  });
});

describe("getFolderCapabilities", () => {
  it("予約 ID から対応する行を引く", () => {
    expect(getFolderCapabilities(TUTORIAL_FOLDER_ID)).toBe(
      FOLDER_CAPABILITIES[FOLDER_KIND.TUTORIAL],
    );
    expect(getFolderCapabilities(UNCATEGORIZED_FOLDER_ID)).toBe(
      FOLDER_CAPABILITIES[FOLDER_KIND.UNCATEGORIZED],
    );
  });

  it("予約 ID 以外（存在しない ID を含む）はユーザフォルダの行を返す", () => {
    expect(getFolderCapabilities(USER_FOLDER_ID)).toBe(FOLDER_CAPABILITIES[FOLDER_KIND.USER]);
    expect(getFolderCapabilities("")).toBe(FOLDER_CAPABILITIES[FOLDER_KIND.USER]);
  });
});

describe("canManageFolder", () => {
  it("未分類だけ false（＝「…」メニューを出さない唯一のフォルダ）", () => {
    expect(canManageFolder(UNCATEGORIZED_FOLDER_ID)).toBe(false);
    expect(canManageFolder(TUTORIAL_FOLDER_ID)).toBe(true);
    expect(canManageFolder(USER_FOLDER_ID)).toBe(true);
  });

  it("削除かリネームのどちらかが可能な種別と一致する", () => {
    for (const kind of ALL_KINDS) {
      const { canDeleteFolder, canRenameFolder } = FOLDER_CAPABILITIES[kind];
      const id =
        kind === FOLDER_KIND.TUTORIAL
          ? TUTORIAL_FOLDER_ID
          : kind === FOLDER_KIND.UNCATEGORIZED
            ? UNCATEGORIZED_FOLDER_ID
            : USER_FOLDER_ID;
      expect(canManageFolder(id)).toBe(canDeleteFolder || canRenameFolder);
    }
  });
});
