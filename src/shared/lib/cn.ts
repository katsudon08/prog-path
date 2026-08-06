import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge にプロジェクト独自の文字サイズトークンを教える。
 *
 * **これが無いと `cn("text-body", "text-muted-foreground")` が `text-muted-foreground` だけを
 * 返し、文字サイズが黙って消える。** tailwind-merge は `text-*` を既定スケール（text-sm 等）
 * でしか文字サイズと認識できず、知らない `text-body` は「文字色」と推測して同じ
 * グループに入れてしまうため（→ docs/design-tokens.md §7.1 / global.css の `--text-*`）。
 * エラーにならず見た目だけが崩れるので、トークンを増やしたらここにも必ず追加する。
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["support", "body", "label", "status"] }],
    },
  },
});

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
