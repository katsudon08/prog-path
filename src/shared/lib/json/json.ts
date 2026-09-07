import { JsonParseError, JsonStringifyError } from "../error";
import { err, ok, type Result } from "../result";

// 戻り値が unknown なのが肝。形を検証しないと使えない
export function parse(raw: string): Result<unknown, JsonParseError> {
  try {
    return ok<unknown>(JSON.parse(raw));
  } catch (e) {
    return err(new JsonParseError("JSON として読み込めない", { cause: e }));
  }
}

export function stringify(value: unknown): Result<string, JsonStringifyError> {
  try {
    const text = JSON.stringify(value);
    // undefined・関数・Symbol は throw せず undefined が返る
    if (text === undefined) {
      return err(new JsonStringifyError("JSON に変換できない値"));
    }
    return ok(text);
  } catch (e) {
    return err(new JsonStringifyError("JSON に変換できない", { cause: e }));
  }
}
