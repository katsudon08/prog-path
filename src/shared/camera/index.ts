/**
 * Public API — `shared/camera`
 *
 * カメラ取得抽象。`getUserMedia` の環境差（Web / Tauri WebView）を吸収し、
 * 上位は環境を意識しない（実装は差し替え可能）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};
