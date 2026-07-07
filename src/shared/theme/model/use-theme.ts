/**
 * useTheme フック（FSD: shared/theme/model）
 *
 * theme-store を React から購読する薄いラッパ。`useSyncExternalStore` で
 * ストアのスナップショットに同期し、現在の `mode` / `resolved` と切替関数を返す。
 */
import { useSyncExternalStore } from "react";

import {
  getThemeSnapshot,
  setThemeMode,
  subscribeTheme,
  type ThemeMode,
  type ThemeSnapshot,
} from "./theme-store";

/** useTheme の戻り値。スナップショット＋モード変更関数。 */
export interface UseThemeResult extends ThemeSnapshot {
  /** テーマモードを変更する。 */
  setMode: (mode: ThemeMode) => void;
}

/**
 * 現在のテーマ（mode / resolved）を購読し、変更関数とあわせて返す。
 * ストア変更時に再描画される。
 */
export const useTheme = (): UseThemeResult => {
  const snapshot = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeSnapshot);
  return { mode: snapshot.mode, resolved: snapshot.resolved, setMode: setThemeMode };
};
