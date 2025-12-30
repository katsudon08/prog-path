"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { MazeData } from "@/src/entities/maze"
import { encodeMazeToQR } from "@/src/features/maze-serialization"
import { importMazeFromQRCode } from "./qr-scanner"
import { useCameraQRScanner } from "@/src/features/camera-qr-scanner"

interface UseQROperationsProps {
    mazes: MazeData[]
    setMazes: (mazes: MazeData[]) => void
    selectedMaze: MazeData | null
}

/**
 * QR共有・インポート操作を担当するフック
 * FSD: features層 - 再利用可能なQR操作機能
 */
export function useQROperations({
    mazes,
    setMazes,
    selectedMaze,
}: UseQROperationsProps) {
    // QR共有ダイアログ
    const [showQRDialog, setShowQRDialog] = useState(false)
    const [qrData, setQRData] = useState("")

    // QRインポートダイアログ
    const [showImportDialog, setShowImportDialog] = useState(false)

    // stopCameraをrefで保持
    const stopCameraRef = useRef<() => void>(() => {})

    // QRコード検出コールバック
    const handleQRCodeDetected = useCallback((qrCodeData: string) => {
        const result = importMazeFromQRCode(qrCodeData, mazes)
        if (result.success && result.maze) {
            setMazes(result.mazes)
            alert(`迷路「${result.maze.name}」を読み込みました！`)
            setShowImportDialog(false)
            stopCameraRef.current()
        } else if (result.error && result.error !== "迷路のQRコードではありません") {
            alert(result.error)
            setShowImportDialog(false)
            stopCameraRef.current()
        }
    }, [mazes, setMazes])

    // カメラフック
    const {
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        startCamera,
        stopCamera,
    } = useCameraQRScanner({ onQRCodeDetected: handleQRCodeDetected })

    // refを更新
    useEffect(() => {
        stopCameraRef.current = stopCamera
    }, [stopCamera])

    // カメラダイアログ連動
    useEffect(() => {
        if (showImportDialog) {
            const timer = setTimeout(() => startCamera(), 100)
            return () => clearTimeout(timer)
        } else {
            stopCamera()
        }
    }, [showImportDialog, startCamera, stopCamera])

    // QR共有
    const shareMaze = () => {
        if (!selectedMaze) return
        try {
            const encoded = encodeMazeToQR(selectedMaze)
            setQRData(encoded)
            setShowQRDialog(true)
        } catch {
            alert("QRコードの生成に失敗しました")
        }
    }

    const closeQRDialog = () => setShowQRDialog(false)

    // QRインポート
    const openImportDialog = () => setShowImportDialog(true)
    const closeImportDialog = () => {
        setShowImportDialog(false)
        stopCamera()
    }

    return {
        // QR共有
        showQRDialog,
        qrData,
        shareMaze,
        closeQRDialog,
        // QRインポート
        showImportDialog,
        openImportDialog,
        closeImportDialog,
        // カメラ
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
    }
}
