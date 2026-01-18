"use client"

import { useEffect, useRef, useCallback, useState } from "react"
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
    videoRef: React.Ref<HTMLVideoElement>
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
    const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
    const videoRef = useCallback((node: HTMLVideoElement | null) => {
        console.log("🎥 Video element ref updated:", node ? "Mounted" : "Unmounted")
        setVideoEl(node)
    }, [])

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
        const video = videoEl
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
        // useCameraStore.getState()を使用して、依存配列にstreamを含めないようにする
        if (useCameraStore.getState().stream) {
            return
        }

        // ビデオ要素の存在チェックを削除（ストリーム取得後にアタッチするため）

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

            console.log("🎥 Got media stream:", newStream.id)
            // ストアにストリームを保存（ビデオへのセットはuseEffectに委譲）
            setStream(newStream)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            console.error("❌ Failed to get webcam stream:", errorMessage)
            setCameraError(errorMessage)
        }
    }, [setCameraError, setStream])

    // ストアのstreamをリアクティブに監視し、video要素にセット
    useEffect(() => {
        const video = videoEl
        if (!video) return

        if (stream) {
            console.log("🎥 Attaching stream to video element")
            // streamがセットされた → video要素に反映
            video.srcObject = stream
            
            // onloadedmetadataで再生を開始（autoPlayが効かない場合の保険）
            video.onloadedmetadata = () => {
                console.log("🎥 onloadedmetadata")
                video.play().catch(err => {
                    if (err.name === 'AbortError') {
                        // 読み込み中断やコンポーネントアンマウント時のAbortErrorは無視
                        console.log("ℹ️ Video play aborted (expected):", err.message)
                    } else {
                        console.error("❌ Video play failed (onloadedmetadata):", err)
                    }
                })
            }

            video.onplaying = () => {
                console.log("🎥 onplaying, readyState:", video.readyState)
                if (video.readyState >= 2) {
                    setStreamReady(true)
                }
            }

            video.oncanplay = () => {
                console.log("🎥 oncanplay")
                setStreamReady(true)
            }

            // Fallback: ポーリングでreadyStateを確認（イベントが発火しない場合や発火済みのケースへの対策）
            const checkReadyInterval = setInterval(() => {
                if (video.readyState >= 2) {
                    console.log("🎥 Polling check: Video is ready")
                    setStreamReady(true)
                    clearInterval(checkReadyInterval)
                }
            }, 500)

            // Force ready after 2 seconds (safety net)
            const forceReadyTimeout = setTimeout(() => {
                console.log("⚠️ Force ready timeout triggered")
                setStreamReady(true)
            }, 2000)

            return () => {
                clearTimeout(checkReadyInterval)
                clearTimeout(forceReadyTimeout)
                // Cleanup: do NOT nullify srcObject here to prevent flickering or accidental clearing
                // stopCamera() handles the real cleanup of tracks
                if (video) {
                    video.onplaying = null
                    video.oncanplay = null
                    video.onloadedmetadata = null
                }
            }
        } else {
            // streamがnull → クリア
            video.srcObject = null
            video.onplaying = null
            video.oncanplay = null
            video.onloadedmetadata = null
            setStreamReady(false)
        }

        // クリーンアップ
        return () => {
            if (video) {
                video.srcObject = null
                video.onplaying = null
                video.oncanplay = null
                video.onloadedmetadata = null
            }
        }
    }, [stream, setStreamReady, videoEl])

    // 自動起動（マウント後に遅延実行）
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null
        
        if (autoStart) {
            // 少し待ってからカメラを起動（DOM要素がマウントされるのを待つ）
            timer = setTimeout(() => {
                startCamera()
            }, 100)
        }
        
        return () => {
            if (timer) clearTimeout(timer)
            stopCamera()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart])

    // QRコードスキャンループ
    useEffect(() => {
        if (!isStreamReady || !videoEl || !canvasRef.current) {
            return
        }

        const video = videoEl
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
    }, [isStreamReady, scanInterval, onQRCodeDetected, cooldownMs, videoEl])

    return {
        videoRef,
        canvasRef,
        isStreamReady,
        cameraError,
        startCamera,
        stopCamera,
    }
}
