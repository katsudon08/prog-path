/**
 * Public API — `app` レイヤー
 *
 * アプリ全体の初期化を担う合成ルート。プロバイダ（`AsyncBoundary` ＋ DB 起動ゲート）・
 * ルーティング（react-router declarative・history）・グローバル設定を配置し、
 * ビジネスロジックは持たない。
 *
 * `export * from` は使わず公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */
export { App } from "./app";
