/**
 * Public API — `shared/qr`
 *
 * QR デコーダ抽象。`qr-scanner` を内部実装とし、デコード I/F を提供する
 * （実装は差し替え可能）。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示し、公開シンボルは実装着手時に追加する
 * （→ docs/directory-structure.md 2.2）。
 */
export {};
