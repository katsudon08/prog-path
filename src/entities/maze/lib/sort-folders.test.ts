import { describe, expect, it } from "vitest";

import {
  TUTORIAL_FOLDER_ID,
  TUTORIAL_FOLDER_NAME,
  UNCATEGORIZED_FOLDER_ID,
  UNCATEGORIZED_FOLDER_NAME,
} from "../model/constants";
import type { Folder } from "../model/types";
import { sortFolders } from "./sort-folders";

const tutorial: Folder = { id: TUTORIAL_FOLDER_ID, name: TUTORIAL_FOLDER_NAME };
const uncategorized: Folder = { id: UNCATEGORIZED_FOLDER_ID, name: UNCATEGORIZED_FOLDER_NAME };

const userFolder = (name: string): Folder => ({ id: crypto.randomUUID(), name });

describe("sortFolders", () => {
  it("チュートリアルを先頭、マイ迷路を末尾に並べる", () => {
    const animals = userFolder("どうぶつ");

    expect(sortFolders([uncategorized, animals, tutorial])).toEqual([
      tutorial,
      animals,
      uncategorized,
    ]);
  });

  it("ユーザーが作ったフォルダは元の順番のまま並べる", () => {
    const animals = userFolder("どうぶつ");
    const vehicles = userFolder("のりもの");
    const foods = userFolder("たべもの");

    expect(sortFolders([animals, vehicles, foods])).toEqual([animals, vehicles, foods]);
  });

  it("チュートリアルが削除済みでも並び順が崩れない", () => {
    const animals = userFolder("どうぶつ");

    expect(sortFolders([uncategorized, animals])).toEqual([animals, uncategorized]);
  });

  it("フォルダが1つも無ければ空の配列を返す", () => {
    expect(sortFolders([])).toEqual([]);
  });

  it("渡された配列を書き換えない", () => {
    const folders = [uncategorized, tutorial];

    sortFolders(folders);

    expect(folders).toEqual([uncategorized, tutorial]);
  });
});
