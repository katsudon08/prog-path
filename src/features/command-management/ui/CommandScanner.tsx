"use client"

import { useEffect } from 'react'
import { useCameraQRScanner } from '@/src/shared/lib/useCameraQRScanner'
import { useToast } from '@/src/shared/ui/toast/useToast'
import { useCommandBuilder } from '../model/useCommandBuilder'

interface CommandScannerProps {
    /** 自動起動するか（デフォルト: true） */
    autoStart?: boolean
    /** カスタムスタイルクラス */
    className?: string
}

/**
 * コマンドQRスキャナーコンポーネント
 * カメラでQRコードをスキャンし、コマンドをスタックに追加する
 */
export function CommandScanner({
    autoStart = true,
    className = ''
}: CommandScannerProps) {
    const { addCommandFromQR } = useCommandBuilder()
    const { addToast } = useToast()

    const {
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        startCamera,
        stopCamera
    } = useCameraQRScanner({
        autoStart,
        cooldownMs: 1500,
        onQRCodeDetected: (data) => {
            const result = addCommandFromQR(data)
            addToast(result)
        }
    })

    // アンマウント時にカメラを確実に停止
    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [stopCamera])

    return (
        <div className={`relative ${className}`}>
            {/* カメラ映像 */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg"
            />

            {/* スキャン用キャンバス（非表示） */}
            <canvas
                ref={canvasRef}
                className="hidden"
            />

            {/* ステータス表示 */}
            {!isStreamReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-space-dark/80 rounded-lg">
                    <p className="text-neon-cyan animate-pulse">
                        カメラを起動中...
                    </p>
                </div>
            )}

            {/* エラー表示 */}
            {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-dark/90 rounded-lg gap-4">
                    <p className="text-neon-red text-sm text-center px-4">
                        {cameraError}
                    </p>
                    <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-neon-blue/20 border border-neon-blue rounded-lg text-neon-blue hover:bg-neon-blue/30 transition-colors"
                    >
                        再試行
                    </button>
                </div>
            )}

            {/* スキャン準備完了インジケータ */}
            {isStreamReady && (
                <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
                </div>
            )}
        </div>
    )
}
