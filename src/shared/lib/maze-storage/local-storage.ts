import type { MazeData } from "@/src/domains/maze/maze-data/lib/types"
import { getInitialMazes } from "@/src/domains/maze/maze-data/constants/initial-mazes"

const MAZES_KEY = "progpath_mazes"
const CATEGORIES_KEY = "progpath_categories"

/**
 * LocalStorageから迷路データを読み込む
 */
export function loadMazes(): MazeData[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(MAZES_KEY)

    const initializeAndReturn = () => {
        const initials = getInitialMazes()
        saveMazes(initials)
        return initials
    }
    
    if (!stored) {
        return initializeAndReturn()
    }

    try {
        const parsed = JSON.parse(stored)
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return initializeAndReturn()
        }
        return parsed as MazeData[]
    } catch (e) {
        console.error("Failed to parse mazes from localStorage", e)
        return initializeAndReturn()
    }
}

/**
 * 迷路データをLocalStorageに保存
 */
export function saveMazes(mazes: MazeData[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(MAZES_KEY, JSON.stringify(mazes))
}

/**
 * 迷路を追加
 */
export function addMaze(mazes: MazeData[], maze: MazeData): MazeData[] {
    const updated = [...mazes, maze]
    saveMazes(updated)
    return updated
}

/**
 * 迷路を更新
 */
export function updateMaze(mazes: MazeData[], id: string, updates: Partial<MazeData>): MazeData[] {
    const updated = mazes.map(m => m.id === id ? { ...m, ...updates } : m)
    saveMazes(updated)
    return updated
}

/**
 * 迷路を削除
 */
export function deleteMaze(mazes: MazeData[], id: string): MazeData[] {
    const updated = mazes.filter(m => m.id !== id)
    saveMazes(updated)
    return updated
}

/**
 * LocalStorageからカスタムカテゴリを読み込む
 */
export function loadCategories(): string[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(CATEGORIES_KEY)
    if (!stored) return []

    try {
        const parsed = JSON.parse(stored)
        if (!Array.isArray(parsed)) return []
        return parsed
    } catch (e) {
        console.error("Failed to load categories", e)
        return []
    }
}

/**
 * カスタムカテゴリをLocalStorageに保存
 */
export function saveCategories(categories: string[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}
