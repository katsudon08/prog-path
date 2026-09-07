// JSON として読めない
export class JsonParseError extends Error {
  override readonly name = "JsonParseError";
}

// JSON に変換できない
export class JsonStringifyError extends Error {
  override readonly name = "JsonStringifyError";
}
