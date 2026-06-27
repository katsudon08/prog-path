/**
 * Public API — `entities/folder` スライス
 *
 * フォルダ（分類・未分類を含む）の型と `FolderItem`。
 * 型・状態・純粋ロジックのみで、他 entity を参照しない。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};
