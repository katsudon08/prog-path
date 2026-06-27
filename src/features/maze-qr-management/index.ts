/**
 * Public API — `features/maze-qr-management` スライス
 *
 * 迷路の QR 共有（1 迷路 = 1 QR の import/export）。エンコード/デコードと
 * サイズ上限の取り扱いを担う。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};
