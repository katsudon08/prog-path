import { create } from 'zustand'
import type { MazeData } from './types'

/**
 * 迷路状態管理ストアのインターフェース
 * 迷路データの純粋なCRUD操作のみを担当
 * カテゴリ（フォルダ）管理は entities/folder に委譲
 */
interface MazeStore {
    // State
    mazes: MazeData[]
    selectedMaze: MazeData | null

    // Maze Actions
    setMazes: (mazes: MazeData[]) => void
    selectMaze: (maze: MazeData | null) => void
    updateMaze: (id: string, updates: Partial<MazeData>) => void
    addMaze: (maze: MazeData) => void
    deleteMaze: (id: string) => void

    // Utility
    getMazeById: (id: string) => MazeData | undefined
}

/**
 * 迷路状態管理Zustandストア
 */
export const useMazeStore = create<MazeStore>((set, get) => ({
    // Initial State
    mazes: [],
    selectedMaze: null,

    // Maze Actions
    setMazes: (mazes) => set({ mazes }),

    selectMaze: (maze) => set({ selectedMaze: maze }),

    updateMaze: (id, updates) => set((state) => ({
        mazes: state.mazes.map(m => m.id === id ? { ...m, ...updates } : m),
        selectedMaze: state.selectedMaze?.id === id
            ? { ...state.selectedMaze, ...updates }
            : state.selectedMaze
    })),

    addMaze: (maze) => set((state) => ({
        mazes: [...state.mazes, maze]
    })),

    deleteMaze: (id) => set((state) => ({
        mazes: state.mazes.filter(m => m.id !== id),
        selectedMaze: state.selectedMaze?.id === id ? null : state.selectedMaze
    })),

    // Utility
    getMazeById: (id) => get().mazes.find(m => m.id === id)
}))
