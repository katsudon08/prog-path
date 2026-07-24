/**
 * Public API — `pages/download` スライス
 *
 * ダウンロード画面。`features/app-download` を直接利用し、画面固有のレイアウトのみを持つ。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export { DownloadPage } from "./ui/download-page";
