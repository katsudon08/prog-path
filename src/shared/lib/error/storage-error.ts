// 端末設定やプライベートモードで localStorage を触れない
export class StorageUnavailableError extends Error {
  override readonly name = "StorageUnavailableError";
}

// 保存領域の容量オーバー
export class StorageQuotaExceededError extends Error {
  override readonly name = "StorageQuotaExceededError";
}

// storage の get / set の戻り値をこの1語で書けるようにする
export type StorageError = StorageUnavailableError | StorageQuotaExceededError;
