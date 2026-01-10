"use client"

import { useEffect, useRef, useCallback } from "react"
import jsQR from "jsqr"
import { useCameraStore } from "./useCameraStore"

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
 * streamはuseCameraStoreで一元管理し、useEffectでリアクティブに監視
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

    // DOM参照（このフック内に閉じ込める）
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const scanIntervalRef = useRef<number | null>(null)
    const isCoolingDownRef = useRef<boolean>(false)

    // Zustandストアから状態を取得
    const { 
        isStreamReady, 
        cameraError, 
        stream,
        setStreamReady, 
        setCameraError, 
        setStream,
        reset 
    } = useCameraStore()

    // カメラを停止
    const stopCamera = useCallback(() => {
        // スキャンループを停止
        if (scanIntervalRef.current) {
            clearTimeout(scanIntervalRef.current)
            scanIntervalRef.current = null
        }

        // ビデオ要素をクリーンアップ
        const video = videoRef.current
        if (video) {
            video.srcObject = null
            video.onplaying = null
            video.oncanplay = null
            video.onloadedmetadata = null
        }

        // ストアをリセット（ストリームも解放される）
        reset()
        isCoolingDownRef.current = false
    }, [reset])

    // カメラを開始（ストアにstreamを保存するだけ）
    const startCamera = useCallback(async () => {
        // すでに有効なストリームが存在する場合は二重起動しない
        if (stream) {
            return
        }

        const video = videoRef.current
        if (!video) {
            console.warn("Video element not found")
            return
        }

        try {
            setCameraError("")
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: "environment",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            })

            // ストアにストリームを保存（ビデオへのセットはuseEffectに委譲）
            setStream(newStream)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            setCameraError(errorMessage)
            console.error("Failed to get webcam stream:", err)
        }
    }, [stream, setCameraError, setStream])

    // ストアのstreamをリアクティブに監視し、video要素にセット
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (stream) {
            // streamがセットされた → video要素に反映
            video.srcObject = stream

            video.onloadedmetadata = () => {
                video.play().catch(err => {
                    console.error("Video play failed:", err)
                })
            }

            video.onplaying = () => {
                if (video.readyState >= 2) {
                    setStreamReady(true)
                }
            }

            video.oncanplay = () => {
                setStreamReady(true)
            }
        } else {
            // streamがnull → クリア
            video.srcObject = null
            video.onplaying = null
            video.oncanplay = null
            video.onloadedmetadata = null
            setStreamReady(false)
        }
    }, [stream, setStreamReady])

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
