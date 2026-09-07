// 成功と失敗を戻り値で表す。ok を確認しないと中身に触れない
export type Result<T, E extends Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E extends Error>(error: E): Result<never, E> => ({ ok: false, error });
