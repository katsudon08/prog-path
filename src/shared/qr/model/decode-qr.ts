/**
 * QR 単発デコード（FSD: shared/qr/model）
 *
 * `qr-scanner` を内部実装とし、1 枚のソースから QR をデコードして生の文字列を返す薄いラッパ。
 * デコードはエンジン（jsQR の Web Worker / ネイティブ BarcodeDetector）で実行され、メインスレッド
 * （3D/AR 描画）を塞がない。連続スキャンは `createQrScanLoop`（qr-scan-loop.ts）を使う。
 */
import QrScanner from "qr-scanner";

/**
 * QR デコードの入力ソース。カメラ映像（`HTMLVideoElement`）を主用途とし、静的画像・キャンバス・
 * `ImageBitmap` / `Blob`・データ URL 文字列等も受け付ける（qr-scanner の受理型の実用サブセット）。
 */
export type QrSource =
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageBitmap
  | Blob
  | string;

/**
 * qr-scanner のエンジン（Worker / BarcodeDetector）生成 Promise の型。
 * BarcodeDetector 型は qr-scanner が公開しておらず名前で参照できないため、戻り値から導出する。
 */
type QrEnginePromise = ReturnType<typeof QrScanner.createQrEngine>;

// scanImage の qrEngine には Promise をそのまま渡せる。エンジン生成は高コストなためモジュールで
// 一度だけ生成し、以降の単発デコードで使い回す（theme-store と同じモジュールシングルトン方式）。
// 環境により jsQR の Web Worker かネイティブ BarcodeDetector を返す。いずれもデコードはメイン
// スレッド外で走る。
let sharedEnginePromise: QrEnginePromise | null = null;

const getSharedEngine = (): QrEnginePromise => {
  sharedEnginePromise ??= QrScanner.createQrEngine();
  return sharedEnginePromise;
};

// canvas を使い回して毎回の生成・GC を抑える。DOM が無い環境（node テスト等）では null を渡し、
// qr-scanner 側の既定生成に委ねる。
let sharedCanvas: HTMLCanvasElement | null = null;

const getSharedCanvas = (): HTMLCanvasElement | null => {
  if (typeof document === "undefined") return null;
  sharedCanvas ??= document.createElement("canvas");
  return sharedCanvas;
};

/**
 * QR 未検出（qr-scanner が `NO_QR_CODE_FOUND` を投げる正常系）かを判定する内部ヘルパ。
 * `decodeQr` からのみ使い、Public API では公開しない。
 */
const isNoQrCodeFound = (error: unknown): boolean =>
  error === QrScanner.NO_QR_CODE_FOUND ||
  (error instanceof Error && error.message === QrScanner.NO_QR_CODE_FOUND);

/**
 * 単一のソースから QR を 1 回デコードし、埋め込まれた文字列を返す。
 *
 * デコードは qr-scanner のエンジン（Web Worker / BarcodeDetector）で実行され、メインスレッドを
 * 塞がない。QR が見つからない場合は例外ではなく `null` を返す。
 *
 * 返す文字列は QR の生ペイロードで、**意味解釈・妥当性検証はしない**（透過返却）。命令文字列
 * としての解釈・コマンド化は上位（`features/command-management`, #186）が担う。
 *
 * @param source デコード対象（カメラ映像・画像・キャンバス・`Blob`・データ URL 等）
 * @returns デコードした文字列。QR 未検出時は `null`
 * @throws QR 未検出以外の理由で失敗した場合（デコードエンジンの生成失敗等）
 */
export const decodeQr = async (source: QrSource): Promise<string | null> => {
  try {
    const result = await QrScanner.scanImage(source, {
      qrEngine: getSharedEngine(),
      canvas: getSharedCanvas(),
      returnDetailedScanResult: true,
    });
    return result.data;
  } catch (error) {
    if (isNoQrCodeFound(error)) return null;
    throw error;
  }
};
