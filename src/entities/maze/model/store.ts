import { create } from 'zustand'
import type { MazeData } from './types'
import { loadMazesFromStorage, saveMazesToStorage } from '../lib/storage'
import { getInitialMazes } from '../lib/initial-mazes'
import { isMazeDataArray } from '../lib/validator'

/**
 * 迷路状態管理ストアのインターフェース
 * 迷路データの純粋なCRUD操作のみを担当
 * カテゴリ（フォルダ）管理は entities/folder に委譲
 */
interface MazeStore {
    // State
    mazes: MazeData[]
    selectedMaze: MazeData | null
    editingMaze: MazeData | null  // 編集中の迷路（ローカル編集用）
    isLoaded: boolean

    // Initialization
    initialize: () => void

    // Maze Actions
    setMazes: (mazes: MazeData[]) => void
    selectMaze: (maze: MazeData | null) => void
    updateMaze: (id: string, updates: Partial<MazeData>) => void
    addMaze: (maze: MazeData) => void
    addAndSelectMaze: (maze: MazeData) => void
    deleteMaze: (id: string) => void

    // Editing Actions
    setEditingMaze: (maze: MazeData) => void
    clearEditingMaze: () => void

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
    editingMaze: null,
    isLoaded: false,

    // Initialization - LocalStorageから迷路を読み込む
    initialize: () => {
        // 既にロード済みの場合はスキップ
        if (get().isLoaded) return

        let mazes = loadMazesFromStorage()
        
        // データがない、空配列、または不正な形式の場合は初期データをロード
        if (!mazes || mazes.length === 0 || !isMazeDataArray(mazes)) {
            mazes = getInitialMazes()
            saveMazesToStorage(mazes)
        }
        
        set({ mazes, isLoaded: true })
    },

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

    addAndSelectMaze: (maze) => set((state) => ({
        mazes: [...state.mazes, maze],
        selectedMaze: maze
    })),

    deleteMaze: (id) => set((state) => ({
        mazes: state.mazes.filter(m => m.id !== id),
        selectedMaze: state.selectedMaze?.id === id ? null : state.selectedMaze
    })),

    // Editing Actions
    setEditingMaze: (maze) => set({ editingMaze: maze }),
    clearEditingMaze: () => set({ editingMaze: null }),

    // Utility
    getMazeById: (id) => get().mazes.find(m => m.id === id)
}))
