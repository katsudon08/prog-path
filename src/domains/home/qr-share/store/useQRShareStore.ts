import { create } from "zustand"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { encodeMazeToQR } from "@shared/lib"

interface QRShareState {
    // 状態
    showDialog: boolean
    qrData: string

    // アクション
    openDialog: (maze: MazeData) => void
    closeDialog: () => void
}

/**
 * QR共有ストア
 * QRコード共有ダイアログの状態を管理
 */
export const useQRShareStore = create<QRShareState>((set) => ({
    // 初期状態
    showDialog: false,
    qrData: "",

    // ダイアログを開く（迷路をQRコードに変換）
    openDialog: (maze) => {
        const encoded = encodeMazeToQR(maze)
        set({ showDialog: true, qrData: encoded })
    },

    // ダイアログを閉じる
    closeDialog: () => {
        set({ showDialog: false, qrData: "" })
    },
}))
