/**
 * Public API — `shared/theme`
 *
 * ライト/ダークのテーマ管理。`.dark` クラス方式で Radix Colors / global.css の
 * `@custom-variant dark` と一致する。他スライスからの import はこの index.ts 経由のみ。
 *
 * - `initTheme()`: アプリ起動時に一度呼び、DOM 反映と OS 変更監視を開始する。
 * - `useTheme()`: React から現在のテーマを購読し、切替する（`setMode` を返す）。
 *
 * ストアの購読プリミティブ（getThemeSnapshot / subscribeTheme）と setThemeMode は
 * スライス内部専用（use-theme.ts が相対 import で使用）。外部から必要になった時点で公開する。
 */
export { initTheme, THEME_MODES } from "./model/theme-store";
export type { ResolvedTheme, ThemeMode } from "./model/theme-store";
export { useTheme } from "./model/use-theme";
export type { UseThemeResult } from "./model/use-theme";
