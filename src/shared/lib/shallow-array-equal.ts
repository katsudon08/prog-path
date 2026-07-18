/**
 * 2 つの配列が同一（同じ長さ・各要素が `===` で一致）かを浅く判定する。
 *
 * コマンドパス（index 列）の一致判定など「順序を保った要素比較」を行う箇所で用いる
 * フレームワーク非依存の純粋関数。ネストした要素は浅く（参照/プリミティブ）比較する。
 *
 * @param a 比較する配列
 * @param b 比較する配列
 * @returns 長さが等しく全要素が順に一致すれば `true`
 */
export const shallowArrayEqual = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);
