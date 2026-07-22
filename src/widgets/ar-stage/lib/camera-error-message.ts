/**
 * カメラ取得エラー → 児童向け文言（FSD: widgets/ar-stage/lib）
 *
 * shared/camera の {@link CameraErrorCode}（安定したエラーコード）を、小学校高学年向けの
 * やさしい日本語文言と「再試行できるか」のフラグへ変換する。網羅性は
 * `satisfies Record<CameraErrorCode, …>` で型担保し、コードが増えたらここが型エラーになる。
 *
 * `retryable: false` のコード（insecure-context / unsupported）はユーザー操作では回復できない
 * 環境要因のため、UI は再試行ボタンを出さず案内のみ表示する。
 *
 * 文言は 〔要確認〕 暫定。授業での読みやすさ（分かち書き・先生への相談導線）を優先しており、
 * 実際の児童・先生のフィードバックを受けて後で調整してよい。
 */
import type { CameraErrorCode } from "@/shared/camera";

/** カメラエラー 1 件分の表示内容。 */
export interface CameraErrorMessage {
  /** 見出し（何が起きたか）。 */
  title: string;
  /** 対処案内（どうすればよいか）。 */
  description: string;
  /** ユーザー操作（再試行）で回復し得るか。false なら再試行ボタンを出さない。 */
  retryable: boolean;
}

/** エラーコードごとの表示内容。キーは {@link CameraErrorCode} の全値を網羅する。 */
export const CAMERA_ERROR_MESSAGES = {
  "insecure-context": {
    title: "この ひらきかたでは カメラが つかえないよ",
    description: "せんせいに つたえて、アプリを ただしい ほうほうで ひらいてもらってね。",
    retryable: false,
  },
  unsupported: {
    title: "この コンピュータでは カメラが つかえないみたい",
    description: "せんせいに つたえて、べつの コンピュータで ためしてみてね。",
    retryable: false,
  },
  "permission-denied": {
    title: "カメラの りようが きょかされていないよ",
    description: "せんせいと いっしょに カメラの きょかを オンにしてから、もういちど ためしてね。",
    retryable: true,
  },
  "device-not-found": {
    title: "カメラが みつからないよ",
    description: "カメラが コンピュータに つながっているか たしかめてから、ためしてね。",
    retryable: true,
  },
  "device-unavailable": {
    title: "カメラが ほかで つかわれているみたい",
    description: "カメラを つかっている ほかの アプリを とじてから、もういちど ためしてね。",
    retryable: true,
  },
  "constraints-unsatisfied": {
    title: "この カメラでは うまく うつせなかったよ",
    description: "べつの カメラを つないでから、もういちど ためしてね。",
    retryable: true,
  },
  "invalid-state": {
    title: "カメラを うまく はじめられなかったよ",
    description: "すこし まってから、もういちど ためしてね。",
    retryable: true,
  },
  timeout: {
    title: "カメラの じゅんびに じかんが かかりすぎたよ",
    description: "カメラの きょかの メッセージが でていないか たしかめて、もういちど ためしてね。",
    retryable: true,
  },
  aborted: {
    title: "カメラの じゅんびを とちゅうで やめたよ",
    description: "もういちど ためしてね。",
    retryable: true,
  },
  unknown: {
    title: "カメラで なにか うまくいかなかったよ",
    description: "もういちど ためして、なおらなかったら せんせいに つたえてね。",
    retryable: true,
  },
} as const satisfies Record<CameraErrorCode, CameraErrorMessage>;

/**
 * カメラ取得エラーコードを児童向けの表示内容へ変換する。
 *
 * @param code shared/camera が返す正規化済みエラーコード
 * @returns 見出し・対処案内・再試行可否（{@link CameraErrorMessage}）
 */
export const getCameraErrorMessage = (code: CameraErrorCode): CameraErrorMessage =>
  CAMERA_ERROR_MESSAGES[code];
