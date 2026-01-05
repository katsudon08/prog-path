"use client"

import { useRouter } from "next/navigation"
import { useCameraQRScanner } from "@domains/ar/qr-command-scanner"

// Zustand ストア
import { useMazeStore } from "@domains/home/maze-list/store"
import { useQRImportStore } from "@domains/home/qr-import/store"
import { useFolderCreateDialogStore } from "@domains/home/folder-create-dialog/store"

/**
 * サイドヘッダーのロジックフック
 * - 迷路作成画面へ遷移
 * - folder-create-dialogを表示
 * - qr-importを表示
 */
export function useSideHeader() {
    const router = useRouter()

    // ストアからアクション取得
    const addMaze = useMazeStore((s) => s.addMaze)
    const qrImportStore = useQRImportStore()
    const folderCreateDialogStore = useFolderCreateDialogStore()

    // カメラQRスキャナー
    const { videoRef, canvasRef, isStreamReady, cameraError, startCamera, stopCamera } = useCameraQRScanner({
        onQRCodeDetected: (data) => qrImportStore.handleQRDetected(data, addMaze),
        autoStart: false,
    })

    // 迷路作成画面へ遷移
    const createMaze = () => router.push("/editor")

    // folder-create-dialogを表示
    const openFolderCreateDialog = folderCreateDialogStore.openDialog

    // qr-importを表示
    const openQrImportDialog = qrImportStore.openDialog

    return {
        // アクション
        createMaze,
        openFolderCreateDialog,
        openQrImportDialog,
        // QRインポートダイアログ用
        qrImportDialog: {
            open: qrImportStore.showDialog,
            onOpenChange: (open: boolean) => !open && qrImportStore.closeDialog(),
            camera: {
                videoRef,
                canvasRef,
                isStreamReady,
                cameraError,
                startCamera,
                stopCamera,
            },
        },
    }
}
