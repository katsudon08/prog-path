import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind のクラス名を条件付きで結合し、競合するユーティリティを後勝ちでマージする。
 *
 * `clsx` で文字列・配列・条件オブジェクト形式のクラスを 1 つにまとめ、
 * `tailwind-merge` で `p-2 p-4` のような競合を解決する（後者が勝つ）。
 * shared/ui の共通部品で、既定のクラスを呼び出し側の `className` で安全に
 * 上書き・拡張するために用いる。
 *
 * @param inputs クラス名（文字列 / 配列 / 条件オブジェクト / falsy 値）
 * @returns 重複・競合を解決したクラス文字列
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
