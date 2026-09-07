import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JsonParseError, StorageError } from "@/shared/lib/error";

import type { Folder, Maze } from "../model/types";
import { loadFolders, loadMazes, saveFolders, saveMazes } from "./storage";

// node 環境には localStorage が無いので手で差す
const createFakeStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
};

const createBrokenStorage = () => {
  const boom = () => {
    throw new DOMException("", "SecurityError");
  };
  return { getItem: boom, setItem: boom, removeItem: boom };
};

const maze: Maze = { id: "m1", name: "ゆうしゃ の めいろ", layers: [], folderId: "uncategorized" };
const folder: Folder = { id: "f1", name: "どうぶつ" };

let fake: ReturnType<typeof createFakeStorage>;

beforeEach(() => {
  fake = createFakeStorage();
  vi.stubGlobal("localStorage", fake);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadMazes", () => {
  it("保存した迷路を読む", () => {
    saveMazes([maze]);

    expect(loadMazes()).toEqual({ ok: true, value: [maze] });
  });

  it("一度も保存していなければ null を返す", () => {
    expect(loadMazes()).toEqual({ ok: true, value: null });
  });

  it("全部消したあとは空の配列を返す", () => {
    saveMazes([]);

    expect(loadMazes()).toEqual({ ok: true, value: [] });
  });

  it("壊れたデータは JsonParseError を返す", () => {
    fake.setItem("progpath.v2.mazes", '[{"id":');

    expect(loadMazes()).toEqual({ ok: false, error: expect.any(JsonParseError) });
  });

  it("読めない端末では storage の失敗をそのまま返す", () => {
    vi.stubGlobal("localStorage", createBrokenStorage());

    expect(loadMazes()).toEqual({ ok: false, error: expect.any(StorageError) });
  });
});

describe("saveMazes", () => {
  it("progpath.v2.mazes に JSON として保存する", () => {
    saveMazes([maze]);

    expect(fake.getItem("progpath.v2.mazes")).toBe(JSON.stringify([maze]));
  });

  it("保存できたら ok を返す", () => {
    expect(saveMazes([maze])).toEqual({ ok: true, value: undefined });
  });

  it("書けない端末では storage の失敗をそのまま返す", () => {
    vi.stubGlobal("localStorage", createBrokenStorage());

    expect(saveMazes([maze])).toEqual({ ok: false, error: expect.any(StorageError) });
  });
});

describe("loadFolders / saveFolders", () => {
  it("保存したフォルダを読む", () => {
    saveFolders([folder]);

    expect(loadFolders()).toEqual({ ok: true, value: [folder] });
  });

  it("一度も保存していなければ null を返す", () => {
    expect(loadFolders()).toEqual({ ok: true, value: null });
  });

  it("progpath.v2.folders に保存する", () => {
    saveFolders([folder]);

    expect(fake.getItem("progpath.v2.folders")).toBe(JSON.stringify([folder]));
  });
});

describe("迷路とフォルダのキー", () => {
  it("迷路を保存してもフォルダ側は未保存のまま", () => {
    saveMazes([maze]);

    expect(loadFolders()).toEqual({ ok: true, value: null });
  });

  it("フォルダを保存しても迷路側は未保存のまま", () => {
    saveFolders([folder]);

    expect(loadMazes()).toEqual({ ok: true, value: null });
  });

  it("両方保存しても互いを壊さない", () => {
    saveMazes([maze]);
    saveFolders([folder]);

    expect(loadMazes()).toEqual({ ok: true, value: [maze] });
    expect(loadFolders()).toEqual({ ok: true, value: [folder] });
  });
});
