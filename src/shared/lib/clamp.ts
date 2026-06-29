/**
 * 値を [min, max] の範囲に収める。
 *
 * loop 回数やグリッドサイズなど「範囲を持つ整数・数値」を扱う箇所で用いる
 * フレームワーク非依存の純粋関数。
 *
 * @param value 対象の値
 * @param min 下限（含む）
 * @param max 上限（含む）
 * @returns min 未満なら min、max 超なら max、範囲内ならそのまま
 * @throws min > max の場合（呼び出し側のバグを早期に検出する）
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (min > max) {
    throw new RangeError(`clamp: min(${min}) は max(${max}) 以下である必要があります`);
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};
