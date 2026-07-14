/**
 * Public API — `shared/config`
 *
 * 定数・設定値（サイズ上限・loop 回数範囲・未分類 ID 等）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {
  MAZE_SIZE_MIN,
  MAZE_SIZE_MAX,
  MAZE_FLOOR_COUNT_MIN,
  MAZE_FLOOR_COUNT_MAX,
  MAZE_DEFAULT_SIZE,
} from "./maze";
export { LOOP_COUNT_MIN, LOOP_COUNT_MAX } from "./command";
export { UNCATEGORIZED_FOLDER_ID } from "./folder";
