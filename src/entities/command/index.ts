/**
 * Public API — `entities/command` スライス
 *
 * コマンド（種別・ループのネスト構造）の型と `CommandItem`（アイコン・名称）。
 * 型・状態・純粋ロジックのみで、他 entity を参照しない。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};
