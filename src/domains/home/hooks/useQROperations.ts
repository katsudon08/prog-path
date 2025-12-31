"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import type { MazeData } from "@/src/entities/maze"
import { isMazeQRCode, decodeMazeFromQR, encodeMazeToQR } from "@shared/lib"
import { useCameraQRScanner } from "@domains/ar/qr-command-scanner"

/**
 * QR関連操作フック
 * QRコード表示とインポート機能を提供
 */
export function useQROperations() {
    const [showQRDialog, setShowQRDialog] = useState(false)
    const [showImportDialog, setShowImportDialog] = useState(false)
    const [qrData, setQrData] = useState("")

    // QRコードスキャン時のハンドラー
    const handleQRDetected = useCallback((data: string) => {
        if (isMazeQRCode(data)) {
            const maze = decodeMazeFromQR(data)
            if (maze) {
                const stored = localStorage.getItem("progpath_mazes")
                const mazes: MazeData[] = stored ? JSON.parse(stored) : []
                if (!mazes.find(m => m.id === maze.id)) {
                    mazes.push(maze)
                    localStorage.setItem("progpath_mazes", JSON.stringify(mazes))
                    setShowImportDialog(false)
                    window.location.reload()
                }
            }
        }
    }, [])

    // カメラQRスキャナー
    const { videoRef, canvasRef, isStreamReady, cameraError } = useCameraQRScanner({
        onQRCodeDetected: handleQRDetected,
        autoStart: false,
    })

    // インポートダイアログ開閉時にカメラ制御
    useEffect(() => {
        // ダイアログを閉じたらカメラを停止
        if (!showImportDialog && videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
            videoRef.current.srcObject = null
        }
    }, [showImportDialog, videoRef])

    // QRダイアログを開く（共有用）
    const openQRDialog = useCallback((maze: MazeData) => {
        const encoded = encodeMazeToQR(maze)
        setQrData(encoded)
        setShowQRDialog(true)
    }, [])

    // QRダイアログを閉じる
    const closeQRDialog = useCallback(() => {
        setShowQRDialog(false)
        setQrData("")
    }, [])

    // インポートダイアログを開く
    const openImportDialog = useCallback(() => {
        setShowImportDialog(true)
    }, [])

    // インポートダイアログを閉じる
    const closeImportDialog = useCallback(() => {
        setShowImportDialog(false)
    }, [])

    // 迷路共有
    const shareMaze = useCallback((maze: MazeData) => {
        openQRDialog(maze)
    }, [openQRDialog])

    return {
        showQRDialog,
        showImportDialog,
        qrData,
        openQRDialog,
        closeQRDialog,
        openImportDialog,
        closeImportDialog,
        shareMaze,
        // カメラ関連
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
    }
}
