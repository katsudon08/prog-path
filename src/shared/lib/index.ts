/**
 * Public API — `shared/lib`
 *
 * フレームワーク非依存の汎用ユーティリティ。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export { clamp } from "./clamp";
export { cn } from "./cn";
export { shallowArrayEqual } from "./shallow-array-equal";
