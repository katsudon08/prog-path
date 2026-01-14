"use client"

import { useEffect, useCallback } from "react"
import { AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/_src/shared/ui"
import { useQRImport } from "../model/useQRImport"
import { useToast } from "@/_src/shared/ui/toast"
import { useCameraQRScanner } from "@/_src/shared/lib"

/**
 * QRコードインポートダイアログ（カメラスキャナー）
 * 
 * 責務の分離:
 * - UI: カメラ映像の表示、エラー状態の表示、ダイアログの開閉
 * - ロジック: QRコード検出処理、迷路のバリデーション・保存（useQRImportに委譲）
 * - 通知: トースト表示（addToast経由）
 */
export function QRImportDialog() {
    const { isOpen, close, handleQRDetected } = useQRImport()
    const { addToast } = useToast()

    /**
     * QRコード検出時のハンドラー
     * ロジック層（useQRImport）に処理を委譲し、結果をトーストで通知
     * useCallbackをし忘れると、レンダリングのたびにスキャンループが発生してしまうため注意
     */
    const onQRCodeDetected = useCallback((data: string) => {
        const result = handleQRDetected(data)

        // 結果をトーストで通知（メッセージがある場合のみ）
        if (result.message) {
            addToast(result)
        }
        // 成功時はhandleQRDetected内でダイアログが自動的に閉じられる
    }, [handleQRDetected, addToast])

    // カメラQRスキャナーフックを使用
    const {
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        startCamera,
        stopCamera,
    } = useCameraQRScanner({
        onQRCodeDetected,
        scanInterval: 300,
        autoStart: false, // ダイアログが開いたら手動で開始
        cooldownMs: 1000, // 連続検出を防ぐ
    })

    // ダイアログが開いたらカメラを開始、閉じたら停止
    useEffect(() => {
        if (isOpen) {
            startCamera()
        } else {
            stopCamera()
        }
        // クリーンアップ：コンポーネントアンマウント時にカメラリソースを解放
        return () => {
            stopCamera()
        }
    }, [isOpen, startCamera, stopCamera])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-lg border-neon-purple/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">
                        迷路を読み込む
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 p-4">
                    {cameraError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-300 w-full">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm">{cameraError}</span>
                        </div>
                    )}
                    <div className="relative w-full aspect-video bg-space-darker rounded-lg overflow-hidden flex items-center justify-center">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            style={{ transform: "scaleX(-1)" }}
                            playsInline
                            muted
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        {!isStreamReady && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-space-darker/80">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">
                                        カメラを起動中...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        迷路のQRコードをカメラに映すと自動的に読み込まれます
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}