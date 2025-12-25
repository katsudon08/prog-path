/**
 * QRコードスキャン用カスタムフック
 */

import { useCallback, useRef } from 'react'
import type { Command } from '@entities/robot'
import { qrCodeToCommand, isCommandQRCode } from '../lib/qr-to-command'

/**
 * QRコードスキャンフックの戻り値
 */
export interface UseQRCommandScannerReturn {
    /** QRコードからコマンドを処理 */
    handleQRCodeDetected: (qrText: string) => void
    /** 最後に追加したコマンド情報のRef */
    lastAddedCommandRef: React.MutableRefObject<{ type: string; time: number } | null>
}

/**
 * QRコードスキャン用カスタムフック
 * @param onCommandDetected コマンド検出時のコールバック
 * @param isExecuting 実行中フラグ（実行中はスキャンを無視）
 */
export function useQRCommandScanner(
    onCommandDetected: (command: Command) => void,
    isExecuting: boolean
): UseQRCommandScannerReturn {
    const lastAddedCommandRef = useRef<{ type: string; time: number } | null>(null)

    const handleQRCodeDetected = useCallback((qrText: string) => {
        // 実行中はスキャンを無視
        if (isExecuting) return

        // コマンドQRコードかチェック
        if (!isCommandQRCode(qrText)) return

        const command = qrCodeToCommand(qrText)
        if (!command) return

        // 同じコマンドタイプが2秒以内に連続して検出されたら無視
        const now = Date.now()
        const lastAdded = lastAddedCommandRef.current
        if (lastAdded && lastAdded.type === command.type && (now - lastAdded.time) < 2000) {
            return
        }

        // コマンドを記録
        lastAddedCommandRef.current = { type: command.type, time: now }

        // コールバックを呼び出し
        onCommandDetected(command)
    }, [onCommandDetected, isExecuting])

    return {
        handleQRCodeDetected,
        lastAddedCommandRef,
    }
}
