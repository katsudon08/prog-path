import {
  type JsonParseError,
  type JsonStringifyError,
  type StorageError,
} from "@/shared/lib/error";
import { parseJson, stringifyJson } from "@/shared/lib/json";
import { ok, type Result } from "@/shared/lib/result";
import { getStorageItem, setStorageItem } from "@/shared/lib/storage";

import { FOLDERS_KEY, MAZES_KEY } from "../model/storage-keys";
import type { Folder, Maze } from "../model/types";

// 戻り値の null は「一度も保存していない」を意味する。
// 空の配列 ([]) は「児童が全部消した」で別物
function load(key: string): Result<unknown, StorageError | JsonParseError> {
  const raw = getStorageItem(key);
  if (!raw.ok) return raw;
  if (raw.value === null) return ok(null);
  return parseJson(raw.value);
}

function save(key: string, value: unknown): Result<void, StorageError | JsonStringifyError> {
  const text = stringifyJson(value);
  if (!text.ok) return text;
  return setStorageItem(key, text.value);
}

// 形が Maze[] かどうかの検証はまだ行わない
export const loadMazes = () => load(MAZES_KEY);

export const saveMazes = (mazes: Maze[]) => save(MAZES_KEY, mazes);

export const loadFolders = () => load(FOLDERS_KEY);

export const saveFolders = (folders: Folder[]) => save(FOLDERS_KEY, folders);
