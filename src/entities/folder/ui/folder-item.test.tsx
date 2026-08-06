// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import type { Folder } from "../model/types";
import { FolderItem } from "./folder-item";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const USER_FOLDER: Folder = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "じっけん",
  createdAt: 100,
};
const TUTORIAL_FOLDER: Folder = { id: TUTORIAL_FOLDER_ID, name: "チュートリアル", createdAt: 1 };
const UNCATEGORIZED_FOLDER: Folder = { id: UNCATEGORIZED_FOLDER_ID, name: "未分類", createdAt: 0 };

const noop = (): void => {};
const MENU_LABEL = "もっと";
const menuNode = <button type="button">{MENU_LABEL}</button>;

const renderItem = (overrides: Partial<React.ComponentProps<typeof FolderItem>> = {}): void => {
  render(<FolderItem folder={USER_FOLDER} mazeCount={5} onSelect={noop} {...overrides} />);
};

/** 行本体（メニューではないほう）のボタン。 */
const getRow = (name: string): HTMLElement =>
  screen.getByRole("button", { name: new RegExp(name) });

describe("FolderItem", () => {
  it("フォルダ名と件数を表示する", () => {
    renderItem();
    const row = getRow("じっけん");
    expect(row.textContent).toContain("じっけん");
    expect(row.textContent).toContain("5");
  });

  it("件数には単位を読み上げ用に添える（数字だけを読ませない）", () => {
    renderItem({ mazeCount: 12 });
    expect(getRow("じっけん").textContent).toContain("12 けんの めいろ");
  });

  it("種別ごとに異なるアイコンを描く（folder.id → アイコンの結線を固定する）", () => {
    // アイコンは aria-hidden なのでアクセシブル名に現れず、他のどのテストにも影響しない。
    // そのため `FOLDER_VISUALS[getFolderKind(folder.id)]` を特定種別へ書き換えても
    // 全テストが通ってしまう（#192 レビューで実証済み）。ここで結線そのものを固定する。
    //
    // lucide のクラス名（`lucide-graduation-cap` 等）ではなく path を比べるのは、
    // 命名規則の変更でテストが壊れないようにするため。
    const iconPathOf = (folder: Folder): string => {
      const { container } = render(<FolderItem folder={folder} mazeCount={0} onSelect={noop} />);
      const paths = container.querySelector("svg")?.innerHTML ?? "";
      cleanup();
      return paths;
    };

    const paths = [TUTORIAL_FOLDER, USER_FOLDER, UNCATEGORIZED_FOLDER].map(iconPathOf);
    expect(paths.every((path) => path.length > 0)).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("押すと onSelect に folder.id を渡す", () => {
    const onSelect = vi.fn();
    renderItem({ onSelect });
    fireEvent.click(getRow("じっけん"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(USER_FOLDER.id);
  });

  it("選択中のときだけ aria-current が付く", () => {
    renderItem({ selected: true });
    expect(getRow("じっけん").getAttribute("aria-current")).toBe("true");
    cleanup();

    renderItem({ selected: false });
    expect(getRow("じっけん").getAttribute("aria-current")).toBeNull();
  });

  it("未分類フォルダでは menu を渡しても DOM に出さない", () => {
    // グレーアウトではなく非表示にする（子どもは無効表示を読まず連打するため）。
    // 消費側が誤って渡しても効かない、という構造上の担保をここで固定する。
    renderItem({ folder: UNCATEGORIZED_FOLDER, menu: menuNode });
    expect(screen.queryByRole("button", { name: MENU_LABEL })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("チュートリアル・ユーザフォルダでは menu を描く", () => {
    renderItem({ folder: TUTORIAL_FOLDER, menu: menuNode });
    expect(screen.getByRole("button", { name: MENU_LABEL })).toBeTruthy();
    cleanup();

    renderItem({ folder: USER_FOLDER, menu: menuNode });
    expect(screen.getByRole("button", { name: MENU_LABEL })).toBeTruthy();
  });

  it("menu の押下では onSelect を呼ばない（メニューは行の中に入れ子にしない）", () => {
    const onSelect = vi.fn();
    renderItem({ menu: menuNode, onSelect });
    fireEvent.click(screen.getByRole("button", { name: MENU_LABEL }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("menu を渡さなければ行のボタンだけを描く", () => {
    renderItem({ folder: USER_FOLDER });
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
