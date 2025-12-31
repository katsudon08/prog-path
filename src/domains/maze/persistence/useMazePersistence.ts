import { useCallback } from "react"
import type { TileType, MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { validateMazeForSave } from "./maze-validator"
import { loadMazes } from "@/src/shared/lib"

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

        const mazes = loadMazes()

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

        const mazes = loadMazes()
        const filtered = mazes.filter((m) => m.id !== mazeId)
        
        // Check if we actually removed something to avoid unnecessary writes? 
        // Logic: keep simple.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

        onDeleteSuccess?.()
        return true
    }, [mazeId, onDeleteSuccess])

    return {
        handleSave,
        handleDelete,
    }
}
