"use client"

import { useMazeContext } from "@widgets/maze-list"
import { useQROperations } from "@/src/features/maze-qr-management"

/**
 * ダイアログの状態を管理するフック
 * FSD: pages層 - features層のフックを統合
 */
export function useDialogState() {
    const { mazes, setMazes, selectedMaze } = useMazeContext()

    const qr = useQROperations({ mazes, setMazes, selectedMaze })

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
