/**
 * QRコードテキストからコマンドへのマッピング
 */

import type { Command } from '@entities/robot'

/**
 * QRコードテキストとコマンドのマッピング
 */
const QR_CODE_TO_COMMAND: { [key: string]: Command } = {
    forward: { type: "forward" },
    turnRight: { type: "turnRight" },
    turnLeft: { type: "turnLeft" },
    ifHole: { type: "ifHole" },
    loop: { type: "loop", loopCount: 2, children: [] },
}

/**
 * QRコードテキストがコマンドかどうかを判定
 */
export function isCommandQRCode(text: string): boolean {
    return text in QR_CODE_TO_COMMAND
}

/**
 * QRコードテキストからコマンドを取得
 * @param text QRコードのテキスト
 * @returns コマンド（該当しない場合はnull）
 */
export function qrCodeToCommand(text: string): Command | null {
    return QR_CODE_TO_COMMAND[text] ?? null
}

/**
 * コマンドからQRコードテキストを取得
 */
export function commandToQRCode(command: Command): string {
    return command.type
}

/**
 * 全コマンド一覧を取得
 */
export function getAvailableCommands(): string[] {
    return Object.keys(QR_CODE_TO_COMMAND)
}
