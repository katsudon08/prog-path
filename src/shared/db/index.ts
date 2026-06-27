/**
 * Public API — `shared/db`
 *
 * 永続化抽象。TanStack DB のコレクション定義（モジュールレベルのシングルトン）と
 * IndexedDB アクセスを担う（→ docs/db-design.md）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};
