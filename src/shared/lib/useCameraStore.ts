import { create } from 'zustand'

/**
 * カメラの状態を管理するストア
 */
interface CameraState {
    /** カメラストリームが準備できているか */
    isStreamReady: boolean
    /** カメラエラーメッセージ */
    cameraError: string
    /** MediaStreamオブジェクト（リソース管理用） */
    stream: MediaStream | null

    // Actions
    setStreamReady: (ready: boolean) => void
    setCameraError: (error: string) => void
    setStream: (stream: MediaStream | null) => void
    reset: () => void
}

/**
 * カメラ状態管理ストア
 * shared層で定義し、feature層のダイアログで使用
 */
export const useCameraStore = create<CameraState>((set, get) => ({
    // Initial State
    isStreamReady: false,
    cameraError: '',
    stream: null,

    // Actions
    setStreamReady: (ready) => set({ isStreamReady: ready }),

    setCameraError: (error) => set({ cameraError: error }),

    setStream: (stream) => {
        // 既存のストリームがあれば解放
        const currentStream = get().stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop())
        }
        set({ stream })
    },

    reset: () => {
        // ストリームを解放してリセット
        const currentStream = get().stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop())
        }
        set({
            isStreamReady: false,
            cameraError: '',
            stream: null,
        })
    },
}))
