// localStorage の読み書きができない
export class StorageError extends Error {
  override readonly name = "StorageError";
}
