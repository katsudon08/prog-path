/**
 * テーマ管理ストア（FSD: shared/theme/model）
 *
 * ライト/ダークの切替を担う最小の外部ストア。追加依存を持たず、React の
 * `useSyncExternalStore`（→ use-theme.ts）から購読できる `subscribe` + `getSnapshot`
 * を公開する。実効テーマは `<html>` の `.dark` クラスで表現し、Radix Colors の
 * `.dark` スケール機構・global.css の `@custom-variant dark` と一致させる。
 *
 * - `mode`: ユーザー選択（"light" | "dark" | "system"）。"system" は OS 設定に追従。
 * - 永続化: localStorage（キー STORAGE_KEY）。初回描画の FOUC は index.html の
 *   インラインスクリプトが同じロジックで先に `.dark` を付与して防ぐ。
 *
 * テーマ値の文字列は下の 3 定数（LIGHT/DARK/SYSTEM）だけに書き、型も配列から導出する。
 * 以降のロジックは必ずこれらの定数を参照する（生の "dark" 等を直書きしない）ことで、
 * タイポ（例 "lihgt"）を型エラーにし、値の重複・ずれを防ぐ。
 */

const LIGHT = "light";
const DARK = "dark";
const SYSTEM = "system";

/** テーマモードの値と表示順（唯一の正）。UI の列挙にも使える。 */
export const THEME_MODES = [LIGHT, DARK, SYSTEM] as const;

/** ユーザーが選ぶテーマモード。"system" は OS 設定に追従する。 */
export type ThemeMode = (typeof THEME_MODES)[number];

/** 実際に適用されるテーマ（"system" を解決した結果）。 */
export type ResolvedTheme = typeof LIGHT | typeof DARK;

/** ストアのスナップショット。 */
export interface ThemeSnapshot {
  /** ユーザー選択。 */
  mode: ThemeMode;
  /** 実際に適用されているテーマ。 */
  resolved: ResolvedTheme;
}

/** localStorage の保存キー。index.html のインラインスクリプトと一致させること。 */
const STORAGE_KEY = "progpath-theme";
/** 実効テーマ dark に対応する CSS クラス（global.css の @custom-variant dark・Radix の .dark と一致）。 */
const DARK_CLASS = DARK;

const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === "string" && (THEME_MODES as readonly string[]).includes(value);

const prefersDark = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const readStoredMode = (): ThemeMode => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isThemeMode(value) ? value : SYSTEM;
  } catch {
    return SYSTEM;
  }
};

const resolveTheme = (mode: ThemeMode): ResolvedTheme =>
  mode === SYSTEM ? (prefersDark() ? DARK : LIGHT) : mode;

let currentMode: ThemeMode = readStoredMode();
// useSyncExternalStore の getSnapshot は変化が無い限り同一参照を返す必要があるため、
// スナップショットはキャッシュし、内容が変わったときだけ作り直す。
let snapshot: ThemeSnapshot = { mode: currentMode, resolved: resolveTheme(currentMode) };
const listeners = new Set<() => void>();

const applyToDocument = (resolved: ResolvedTheme): void => {
  const root = document.documentElement;
  root.classList.toggle(DARK_CLASS, resolved === DARK);
  root.style.colorScheme = resolved;
};

const refresh = (): void => {
  const resolved = resolveTheme(currentMode);
  if (snapshot.mode === currentMode && snapshot.resolved === resolved) return;
  snapshot = { mode: currentMode, resolved };
  applyToDocument(resolved);
  for (const listener of listeners) listener();
};

let initialized = false;

/**
 * アプリ起動時に一度だけ呼ぶ。現在のテーマを DOM に反映し、OS のカラースキーム変更を
 * 監視して "system" モード時に追従させる。二重呼び出しは無視する。
 */
export const initTheme = (): void => {
  if (initialized) return;
  initialized = true;
  applyToDocument(snapshot.resolved);
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", () => {
    if (currentMode === SYSTEM) refresh();
  });
};

/** useSyncExternalStore 用のスナップショット取得（同一内容なら同一参照）。 */
export const getThemeSnapshot = (): ThemeSnapshot => snapshot;

/** useSyncExternalStore 用の購読登録。戻り値は解除関数。 */
export const subscribeTheme = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** テーマモードを変更し、永続化・DOM 反映・購読者通知を行う。 */
export const setThemeMode = (mode: ThemeMode): void => {
  currentMode = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 永続化不可（プライベートモード等）でもメモリ上の切替は継続する。
  }
  refresh();
};
