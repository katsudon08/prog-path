"use client"

import { useState } from "react"
import { useMazeContext } from "@domains/home/maze-list"
import { useQROperations } from "@domains/home/qr-import"

/**
 * ダイアログの状態を管理するフック
 */
export function useDialogState() {
    const { selectedMaze } = useMazeContext()

    const qr = useQROperations()

    const [mazeToDelete, setMazeToDelete] = useState<string | null>(null)

    // 削除確認ダイアログを開く
    const openDeleteDialog = (id: string) => {
        setMazeToDelete(id)
    }

    // 削除確認ダイアログを閉じる
    const closeDeleteDialog = () => {
        setMazeToDelete(null)
    }

    return {
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
        startCamera: qr.startCamera,
        stopCamera: qr.stopCamera,
        // 削除
        mazeToDelete,
        openDeleteDialog,
        closeDeleteDialog,
    }
}
