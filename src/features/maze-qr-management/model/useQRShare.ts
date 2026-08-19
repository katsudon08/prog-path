import { create } from 'zustand'
import type { MazeData } from '@/src/entities/maze'
import type { ActionResult } from '@/src/shared/model'
import { encodeMazeToQR } from '@/src/shared/lib'

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
 * ロジックのみを担当し、UIへの通知はActionResultを通じて行う
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
