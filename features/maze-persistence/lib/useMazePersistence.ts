import { useCallback } from "react"
import type { MazeData, TileType } from "@entities/maze"
import { validateMazeForSave } from "./maze-validator"

interface UseMazePersistenceProps {
    mazeId: string | null
    mazeName: string
    gridSize: number
    layers: TileType[][][]
    currentLayer: number
    onSaveSuccess: () => void
    onDeleteSuccess?: () => void
}

const STORAGE_KEY = "progpath_mazes"

/**
 * 迷路の保存・削除ロジックを提供するカスタムフック
 */
export function useMazePersistence({
    mazeId,
    mazeName,
    gridSize,
    layers,
    currentLayer,
    onSaveSuccess,
    onDeleteSuccess,
}: UseMazePersistenceProps) {
    /**
     * 迷路を保存
     */
    const handleSave = useCallback(() => {
        // バリデーション
        const validation = validateMazeForSave(layers)
        if (!validation.valid) {
            alert(validation.errorMessage)
            return false
        }

        const stored = localStorage.getItem(STORAGE_KEY)
        const mazes: MazeData[] = stored ? JSON.parse(stored) : []

        if (mazeId) {
            // Update existing maze
            const index = mazes.findIndex((m) => m.id === mazeId)
            if (index !== -1) {
                mazes[index] = {
                    ...mazes[index],
                    id: mazeId,
                    name: mazeName,
                    size: gridSize,
                    layers,
                    currentLayer,
                }
            }
        } else {
            // Create new maze
            const newMaze: MazeData = {
                id: `maze_${Date.now()}`,
                name: mazeName,
                size: gridSize,
                layers,
                currentLayer,
            }
            mazes.push(newMaze)
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mazes))
        onSaveSuccess()
        return true
    }, [mazeId, mazeName, gridSize, layers, currentLayer, onSaveSuccess])

    /**
     * 迷路を削除
     */
    const handleDelete = useCallback(() => {
        if (!mazeId) return false
        
        if (!confirm("この迷路を削除しますか？")) {
            return false
        }

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const mazes: MazeData[] = JSON.parse(stored)
            const filtered = mazes.filter((m) => m.id !== mazeId)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        }
        
        onDeleteSuccess?.()
        return true
    }, [mazeId, onDeleteSuccess])

    return {
        handleSave,
        handleDelete,
    }
}
