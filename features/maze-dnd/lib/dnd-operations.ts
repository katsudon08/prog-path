import type { MazeData } from "@entities/maze"
import { saveMazes } from "@features/maze-storage"

/**
 * ドラッグ開始時の処理
 */
export function handleDragStart(
    e: React.DragEvent,
    mazeId: string,
    setDraggedMazeId: (id: string | null) => void
): void {
    e.dataTransfer.setData("text/plain", mazeId)
    setDraggedMazeId(mazeId)
}

/**
 * ドロップ時の処理：迷路を別のカテゴリに移動
 */
export function moveMazeToCategory(
    mazes: MazeData[],
    mazeId: string,
    targetCategory: string
): MazeData[] {
    const updated = mazes.map(m => {
        if (m.id === mazeId) {
            return { ...m, category: targetCategory }
        }
        return m
    })
    saveMazes(updated)
    return updated
}
