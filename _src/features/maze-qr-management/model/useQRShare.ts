import { create } from 'zustand'
import type { MazeData } from '../../../entities/maze'
import type { ActionResult } from '../../../shared/model'

// エンコード関数（shared/libからインポートする想定だが、一旦ここに定義）
function encodeMazeToQR(maze: MazeData): string {
    try {
        const json = JSON.stringify(maze)
        const base64 = btoa(unescape(encodeURIComponent(json)))
        return `maze:${base64}`
    } catch (error) {
        console.error("Failed to encode maze:", error)
        throw new Error("迷路のエンコードに失敗しました")
    }
}

/**
 * QR共有ストアの状態
 */
interface QRShareState {
    // State
    isOpen: boolean
    qrData: string
    mazeName: string

    // Actions
    open: (maze: MazeData) => ActionResult
    close: () => void
}

/**
 * QRコード共有機能のストア
 */
export const useQRShare = create<QRShareState>((set) => ({
    // Initial State
    isOpen: false,
    qrData: '',
    mazeName: '',

    // アクション
    open: (maze) => {
        try {
            const encoded = encodeMazeToQR(maze)
            set({ isOpen: true, qrData: encoded, mazeName: maze.name })
            return {
                success: true,
                type: 'info',
                message: `「${maze.name}」のQRコードを生成しました`,
            }
        } catch {
            return {
                success: false,
                type: 'error',
                message: '迷路のエンコードに失敗しました',
            }
        }
    },

    close: () => set({ isOpen: false, qrData: '', mazeName: '' }),
}))
