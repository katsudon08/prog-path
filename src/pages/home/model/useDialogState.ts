"use client"

import { useMazeContext } from "@domains/home/maze-list"
import { useQROperations } from "@domains/home/hooks"

/**
 * ダイアログの状態を管理するフック
 * FSD: pages層 - features層のフックを統合
 */
export function useDialogState() {
    const { selectedMaze } = useMazeContext()

    const qr = useQROperations()

    return {
        // QR共有
        showQRDialog: qr.showQRDialog,
        qrData: qr.qrData,
        shareMaze: qr.shareMaze,
        closeQRDialog: qr.closeQRDialog,
        // QRインポート
        showImportDialog: qr.showImportDialog,
        openImportDialog: qr.openImportDialog,
        closeImportDialog: qr.closeImportDialog,
        // カメラ
        videoRef: qr.videoRef,
        canvasRef: qr.canvasRef,
        isStreamReady: qr.isStreamReady,
        cameraError: qr.cameraError,
    }
}
