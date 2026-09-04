import { useCallback } from 'react'
import { useMazeStore, saveMazesToStorage, validateMaze, type MazeData, type TileType } from '@/legacy/entities/maze'
import type { ActionResult } from '@/legacy/shared/model'

interface UseMazePersistenceProps {
    mazeId: string | null
    mazeName: string
    gridSize: number
    layers: TileType[][][]
    currentLayer: number
    folder?: string
    onSaveSuccess?: () => void
}

/**
 * 迷路の保存（新規作成・更新）ロジックを提供するカスタムフック
 */
export function useMazePersistence({
    mazeId,
    mazeName,
    gridSize,
    layers,
    currentLayer,
    folder,
    onSaveSuccess,
}: UseMazePersistenceProps) {
    /**
     * 迷路を保存
     */
    const save = useCallback((): ActionResult => {
        // バリデーション用の仮MazeDataを作成
        const tempMaze: MazeData = {
            id: mazeId || `maze_${Date.now()}`,
            name: mazeName,
            size: gridSize,
            layers,
            currentLayer,
            folder,
        }

        const validation = validateMaze(tempMaze)
        if (!validation.success) {
            return validation
        }

        const mazeStore = useMazeStore.getState()

        if (mazeId) {
            // 既存の迷路を更新
            mazeStore.updateMaze(mazeId, {
                name: mazeName,
                size: gridSize,
                layers,
                currentLayer,
                folder,
            })
        } else {
            // 新規迷路を作成
            const newMaze: MazeData = {
                id: `maze_${Date.now()}`,
                name: mazeName,
                size: gridSize,
                layers,
                currentLayer,
                folder,
            }
            mazeStore.addMaze(newMaze)
        }

        // LocalStorageに永続化
        saveMazesToStorage(mazeStore.mazes)
        onSaveSuccess?.()

        return {
            success: true,
            type: 'success',
            message: mazeId ? `迷路「${mazeName}」を保存しました` : `迷路「${mazeName}」を作成しました`,
        }
    }, [mazeId, mazeName, gridSize, layers, currentLayer, folder, onSaveSuccess])

    return {
        save,
    }
}
