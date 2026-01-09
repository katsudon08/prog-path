"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import jsQR from "jsqr"

export interface UseCameraQRScannerOptions {
    /** スキャン間隔（ミリ秒） */
    scanInterval?: number
    /** QRコード検出時のコールバック */
    onQRCodeDetected: (data: string) => void
    /** マウント時に自動起動するか（デフォルト: false） */
    autoStart?: boolean
    /** 検出後のクールダウン時間（ミリ秒、デフォルト: 0 = 無効） */
    cooldownMs?: number
}

export interface UseCameraQRScannerResult {
    /** ビデオ要素のref */
    videoRef: React.RefObject<HTMLVideoElement | null>
    /** スキャン用キャンバスのref */
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    /** カメラストリームが準備できているか */
    isStreamReady: boolean
    /** カメラエラーメッセージ */
    cameraError: string
    /** カメラを開始 */
    startCamera: () => void
    /** カメラを停止 */
    stopCamera: () => void
}

/**
 * カメラを使ったQRコードスキャナーのカスタムフック
 * 
 * ホーム画面（迷路インポート）とAR実行画面（コマンドスキャン）の両方で使用可能
 * 副作用（カメラストリーム、スキャンループ）のクリーンアップを自動で行う
 */
export function useCameraQRScanner(
    options: UseCameraQRScannerOptions
): UseCameraQRScannerResult {
    const { 
        scanInterval = 300, 
        onQRCodeDetected, 
        autoStart = false,
        cooldownMs = 0 
    } = options

    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const scanIntervalRef = useRef<number | null>(null)
    const isCoolingDownRef = useRef<boolean>(false)

    const [isStreamReady, setIsStreamReady] = useState(false)
    const [cameraError, setCameraError] = useState("")

    // カメラを停止
    const stopCamera = useCallback(() => {
        if (scanIntervalRef.current) {
            clearTimeout(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        const video = videoRef.current
        if (video && video.srcObject) {
            video.srcObject = null
            video.onplaying = null
            video.oncanplay = null
        }
        setIsStreamReady(false)
        isCoolingDownRef.current = false
    }, [])

    // カメラを開始
    const startCamera = useCallback(async () => {
        const video = videoRef.current
        if (!video) {
            console.warn("Video element not found")
            return
        }

        try {
            setCameraError("")
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: "environment",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            })
            streamRef.current = stream
            video.srcObject = stream

            video.onloadedmetadata = () => {
                video.play().catch(err => {
                    console.error("Video play failed:", err)
                })
            }

            video.onplaying = () => {
                if (video.readyState >= 2) {
                    setIsStreamReady(true)
                }
            }

            video.oncanplay = () => {
                setIsStreamReady(true)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            setCameraError(errorMessage)
            console.error("Failed to get webcam stream:", err)
        }
    }, [])

    // 自動起動
    useEffect(() => {
        if (autoStart) {
            startCamera()
        }
        return () => {
            stopCamera()
        }
    }, [autoStart, startCamera, stopCamera])

    // QRコードスキャンループ
    useEffect(() => {
        if (!isStreamReady || !videoRef.current || !canvasRef.current) {
            return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (!ctx) {
            console.error("Failed to get 2D context for scanning")
            return
        }

        const scanLoop = () => {
            scanIntervalRef.current = window.setTimeout(scanLoop, scanInterval)

            if (video.readyState < 2) return

            const videoWidth = video.videoWidth
            const videoHeight = video.videoHeight
            if (videoWidth === 0 || videoHeight === 0) return

            canvas.width = videoWidth
            canvas.height = videoHeight

            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                })

                if (code && code.data) {
                    // クールダウン中はスキップ
                    if (cooldownMs > 0 && isCoolingDownRef.current) {
                        return
                    }

                    onQRCodeDetected(code.data)

                    // クールダウン開始
                    if (cooldownMs > 0) {
                        isCoolingDownRef.current = true
                        setTimeout(() => {
                            isCoolingDownRef.current = false
                        }, cooldownMs)
                    }
                }
            } catch (err) {
                console.error("Error scanning QR code:", err)
            }
        }

        scanLoop()

        return () => {
            if (scanIntervalRef.current) {
                clearTimeout(scanIntervalRef.current)
            }
        }
    }, [isStreamReady, scanInterval, onQRCodeDetected, cooldownMs])

    return {
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        startCamera,
        stopCamera,
    }
}
