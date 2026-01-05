import { create } from "zustand"
import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { loadMazes, saveMazes } from "@shared/lib"

interface MazeState {
    // 状態
    mazes: MazeData[]
    selectedMaze: MazeData | null
    isLoaded: boolean

    // アクション
    initialize: () => void
    setMazes: (mazes: MazeData[] | ((prev: MazeData[]) => MazeData[])) => void
    selectMaze: (maze: MazeData | null) => void
    deleteMaze: (id: string) => void
    addMaze: (maze: MazeData) => void
    updateMaze: (id: string, updates: Partial<MazeData>) => void
}

/**
 * 迷路データストア
 * 迷路のCRUD操作と選択状態を管理
 */
export const useMazeStore = create<MazeState>((set, get) => ({
    // 初期状態
    mazes: [],
    selectedMaze: null,
    isLoaded: false,

    // 初期化（クライアントサイドでのみ呼び出す）
    initialize: () => {
        const loaded = loadMazes()
        set({
            mazes: loaded,
            selectedMaze: loaded.length > 0 ? loaded[0] : null,
            isLoaded: true,
        })
    },

    // 迷路一覧を設定
    setMazes: (update) => {
        const { mazes } = get()
        const newMazes = typeof update === "function" ? update(mazes) : update
        set({ mazes: newMazes })
        saveMazes(newMazes)
    },

    // 迷路を選択
    selectMaze: (maze) => {
        set({ selectedMaze: maze })
    },

    // 迷路を削除
    deleteMaze: (id) => {
        const { mazes, selectedMaze } = get()
        const updated = mazes.filter((m) => m.id !== id)
        set({
            mazes: updated,
            selectedMaze: selectedMaze?.id === id
                ? (updated.length > 0 ? updated[0] : null)
                : selectedMaze,
        })
        saveMazes(updated)
    },

    // 迷路を追加
    addMaze: (maze) => {
        const { mazes } = get()
        const updated = [...mazes, maze]
        set({ mazes: updated })
        saveMazes(updated)
    },

    // 迷路を更新
    updateMaze: (id, updates) => {
        const { mazes, selectedMaze } = get()
        const updated = mazes.map((m) => (m.id === id ? { ...m, ...updates } : m))
        set({
            mazes: updated,
            selectedMaze: selectedMaze?.id === id ? { ...selectedMaze, ...updates } : selectedMaze,
        })
        saveMazes(updated)
    },
}))
