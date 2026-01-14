import { getItem, setItem, removeItem } from '@/_src/shared/lib/storage'
import type { MazeData } from '../model/types'

const STORAGE_KEY = 'progpath_mazes'

/**
 * LocalStorageから迷路データを読み込む
 */
export function loadMazesFromStorage(): MazeData[] {
    const data = getItem<MazeData[]>(STORAGE_KEY)
    return data ?? []
}

/**
 * LocalStorageに迷路データを保存する
 */
export function saveMazesToStorage(mazes: MazeData[]): void {
    setItem(STORAGE_KEY, mazes)
}

/**
 * LocalStorageから迷路データを削除する
 */
export function clearMazesFromStorage(): void {
    removeItem(STORAGE_KEY)
}
