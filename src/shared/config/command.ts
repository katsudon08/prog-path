/**
 * コマンド構築の制約。
 * loop 回数は 〔要確認〕 暫定 2〜10。確定時に更新する
 * （→ docs/features.md 5.3, #186）。
 */
export const LOOP_COUNT_MIN = 2;
export const LOOP_COUNT_MAX = 10;

/** QRカードを1回受理してから、次のQRを受け付けるまでの暫定間隔。 */
export const COMMAND_SCAN_COOLDOWN_MS = 2_000;
