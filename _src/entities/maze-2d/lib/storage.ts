import type { MazeData } from '../model/types'

const STORAGE_KEY = 'progpath_mazes'

/**
 * LocalStorageから迷路データを読み込む
 */
export function loadMazesFromStorage(): MazeData[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (!data) {
            return []
        }
        return JSON.parse(data) as MazeData[]
    } catch {
        console.error('Failed to load mazes from storage')
        return []
    }
}

/**
 * LocalStorageに迷路データを保存する
 */
export function saveMazesToStorage(mazes: MazeData[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mazes))
    } catch {
        console.error('Failed to save mazes to storage')
    }
}

/**
 * LocalStorageから迷路データを削除する
 */
export function clearMazesFromStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {
        console.error('Failed to clear mazes from storage')
    }
}
