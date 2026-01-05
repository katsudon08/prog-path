import { create } from "zustand"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { isMazeQRCode, decodeMazeFromQR } from "@shared/lib"

interface QRImportState {
    // 状態
    showDialog: boolean

    // アクション
    openDialog: () => void
    closeDialog: () => void
    handleQRDetected: (data: string, onMazeImported?: (maze: MazeData) => void) => void
}

/**
 * QRインポートストア
 * QRコードインポートダイアログの状態を管理
 */
export const useQRImportStore = create<QRImportState>((set, get) => ({
    // 初期状態
    showDialog: false,

    // ダイアログを開く
    openDialog: () => {
        set({ showDialog: true })
    },

    // ダイアログを閉じる
    closeDialog: () => {
        set({ showDialog: false })
    },

    // QRコード検出時のハンドラー
    handleQRDetected: (data, onMazeImported) => {
        if (isMazeQRCode(data)) {
            const maze = decodeMazeFromQR(data)
            if (maze) {
                const stored = localStorage.getItem("progpath_mazes")
                const mazes: MazeData[] = stored ? JSON.parse(stored) : []
                if (!mazes.find((m) => m.id === maze.id)) {
                    mazes.push(maze)
                    localStorage.setItem("progpath_mazes", JSON.stringify(mazes))
                    set({ showDialog: false })
                    if (onMazeImported) {
                        onMazeImported(maze)
                    } else {
                        window.location.reload()
                    }
                }
            }
        }
    },
}))
