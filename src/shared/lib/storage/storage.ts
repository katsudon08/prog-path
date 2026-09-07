import { StorageError } from "../error";
import { err, ok, type Result } from "../result";

// 旧キー (progpath_mazes) とは前方一致しない
const PREFIX = "progpath.v2.";

// 前後の空白は 3 本とも同じ位置で落とす。ここがずれると
// set と get で別のキーを見にいく
const withPrefix = (key: string) => `${PREFIX}${key.trim()}`;

// 未保存は null で返す。保存していないのは異常ではない
export function get(key: string): Result<string | null, StorageError> {
  try {
    return ok(localStorage.getItem(withPrefix(key)));
  } catch (e) {
    return err(new StorageError("localStorage を読めない", { cause: e }));
  }
}

export function set(key: string, value: string): Result<void, StorageError> {
  try {
    localStorage.setItem(withPrefix(key), value.trim());
    return ok(undefined);
  } catch (e) {
    return err(new StorageError("localStorage に書けない", { cause: e }));
  }
}

export function remove(key: string): Result<void, StorageError> {
  try {
    localStorage.removeItem(withPrefix(key));
    return ok(undefined);
  } catch (e) {
    return err(new StorageError("localStorage から消せない", { cause: e }));
  }
}
