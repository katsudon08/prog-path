/**
 * Public API — `shared/camera`
 *
 * カメラ取得抽象。`getUserMedia` の環境差（Web / Tauri WebView）を吸収し、
 * 上位は環境を意識しない。取得失敗は理由別の `CameraAccessError` に正規化し、
 * 成功時は明示的に解放できる `CameraSession` を返す。
 *
 * 他スライスからの import はこの index.ts 経由のみ。`export * from` は使わず
 * 公開対象を個別に明示する（→ docs/directory-structure.md 2.2）。
 */
export { CAMERA_ERROR_CODE, CameraAccessError, openCamera } from "./model/camera";
export type { CameraErrorCode, CameraSession, OpenCameraOptions } from "./model/camera";
