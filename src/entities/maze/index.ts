/**
 * Public API — `entities/maze` スライス
 *
 * 迷路（構造・タイル）のドメインオブジェクト。`Maze` / `TileKind` 型、初期迷路生成、
 * タイル判定、2D/3D 表示を持つ。型・状態・純粋ロジックのみで、他 entity を参照しない。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};
