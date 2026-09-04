import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * classNames ユーティリティ
 * Tailwind CSSのクラス名を結合・マージする
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
