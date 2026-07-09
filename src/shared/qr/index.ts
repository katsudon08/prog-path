/**
 * Public API — `shared/qr`
 *
 * QR デコーダ抽象。`qr-scanner`（jsQR を Web Worker でラップ／対応環境ではネイティブ
 * BarcodeDetector）を内部実装とし、デコード I/F を提供する（実装は差し替え可能）。
 * デコードはメインスレッド外で走り、3D/AR の描画スレッドを塞がない。
 *
 * 返すのは QR の生ペイロード文字列で、命令としての意味解釈・妥当性検証はしない（透過返却）。
 * コマンド化・スタック管理は上位（`features/command-management`, #186）が担う。迷路共有 QR の
 * 解凍（#201）も別スライスの責務。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず公開対象を明示する
 * （→ docs/directory-structure.md 2.2）。
 */
export { decodeQr } from "./model/decode-qr";
export type { QrSource } from "./model/decode-qr";

export { createQrScanLoop } from "./model/qr-scan-loop";
export type { QrScanLoop, QrScanLoopOptions, QrResultHandler } from "./model/qr-scan-loop";
