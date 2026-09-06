import { describe, expect, it } from "vitest";

import {
  TUTORIAL_FOLDER_ID,
  TUTORIAL_FOLDER_NAME,
  UNCATEGORIZED_FOLDER_ID,
} from "../model/constants";
import { isReservedFolder } from "./is-reserved-folder";

describe("isReservedFolder", () => {
  it("チュートリアルの ID を予約と判定する", () => {
    expect(isReservedFolder(TUTORIAL_FOLDER_ID)).toBe(true);
  });

  it("マイ迷路の ID を予約と判定する", () => {
    expect(isReservedFolder(UNCATEGORIZED_FOLDER_ID)).toBe(true);
  });

  it("ユーザーが作ったフォルダの ID は予約と判定しない", () => {
    expect(isReservedFolder(crypto.randomUUID())).toBe(false);
  });

  it("予約フォルダと同じ表示名でも ID が違えば予約と判定しない", () => {
    expect(isReservedFolder(TUTORIAL_FOLDER_NAME)).toBe(false);
  });
});
