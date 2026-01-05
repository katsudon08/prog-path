import { create } from "zustand"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { saveMazes } from "@shared/lib"

interface DndState {
    // 状態
    draggedMazeId: string | null
    dragOverCategory: string | null

    // アクション
    dragStart: (mazeId: string) => void
    dragOver: (e: React.DragEvent, category: string) => void
    dragLeave: () => void
    drop: (
        category: string,
        mazes: MazeData[],
        setMazes: (mazes: MazeData[]) => void,
        addToExpanded: (category: string) => void
    ) => void
    reset: () => void
}

/**
 * ドラッグ&ドロップストア
 * 迷路のD&D操作を管理
 */
export const useDndStore = create<DndState>((set, get) => ({
    // 初期状態
    draggedMazeId: null,
    dragOverCategory: null,

    // ドラッグ開始
    dragStart: (mazeId) => {
        set({ draggedMazeId: mazeId })
    },

    // ドラッグオーバー
    dragOver: (e, category) => {
        e.preventDefault()
        set({ dragOverCategory: category })
    },

    // ドラッグ離脱
    dragLeave: () => {
        set({ dragOverCategory: null })
    },

    // ドロップ
    drop: (category, mazes, setMazes, addToExpanded) => {
        const { draggedMazeId } = get()
        if (!draggedMazeId) return

        const updatedMazes = mazes.map((m) =>
            m.id === draggedMazeId
                ? { ...m, category: category === "未分類" ? undefined : category }
                : m
        )
        setMazes(updatedMazes)
        saveMazes(updatedMazes)
        addToExpanded(category)

        set({ draggedMazeId: null, dragOverCategory: null })
    },

    // リセット
    reset: () => {
        set({ draggedMazeId: null, dragOverCategory: null })
    },
}))
