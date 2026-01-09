import { create } from 'zustand'
import { useMazeStore, saveMazesToStorage, validateMaze, type MazeData } from '../../../entities/maze'
import type { ActionResult } from '../../../shared/model'

function isMazeQRCode(qrData: string): boolean {
    return qrData.startsWith("maze:")
}

// デコード関数
function decodeMazeFromQR(qrData: string): MazeData | null {
    try {
        if (!isMazeQRCode(qrData)) {
            return null
        }
        const base64 = qrData.substring(5)
        const json = decodeURIComponent(escape(atob(base64)))
        const maze: MazeData = JSON.parse(json)

        if (!maze.id || !maze.name || !maze.layers || !maze.size) {
            return null
        }
        return maze
    } catch (error) {
        console.error("Failed to decode maze:", error)
        return null
    }
}

/**
 * QRインポートストアの状態
 */
interface QRImportState {
    // State
    isOpen: boolean

    // Actions
    open: () => void
    close: () => void
    handleQRDetected: (data: string) => ActionResult
}

/**
 * QRコードインポート機能のストア
 */
export const useQRImport = create<QRImportState>((set, get) => ({
    // Initial State
    isOpen: false,

    // アクション
    open: () => set({ isOpen: true }),

    close: () => set({ isOpen: false }),

    handleQRDetected: (data) => {
        // 迷路QRコードかチェック
        if (!isMazeQRCode(data)) {
            return {
                success: false,
                type: 'error',
                message: '迷路のQRコードではありません',
            }
        }

        // デコード
        const maze = decodeMazeFromQR(data)
        if (!maze) {
            return {
                success: false,
                type: 'error',
                message: 'QRコードの解析に失敗しました',
            }
        }

        // バリデーション
        const validation = validateMaze(maze)
        if (!validation.success) {
            return validation
        }

        // 重複チェック
        const mazeStore = useMazeStore.getState()
        if (mazeStore.mazes.find(m => m.id === maze.id)) {
            return {
                success: false,
                type: 'error',
                message: `「${maze.name}」は既にインポート済みです`,
            }
        }

        // ストアに追加
        mazeStore.addMaze(maze)
        saveMazesToStorage(mazeStore.mazes)

        // ダイアログを閉じる
        set({ isOpen: false })

        return {
            success: true,
            type: 'success',
            message: `「${maze.name}」をインポートしました`,
        }
    },
}))
