import { create } from 'zustand'
import type { TileType } from '@/src/entities/maze'

/**
 * 選択可能なタイル一覧
 */
export const TILE_TYPES: TileType[] = [
    'floor',
    'wall',
    'start',
    'goal',
    'hole',
    'key',
    'teleportUp',
    'teleportDown',
]

/**
 * タイル選択ストアの状態
 */
interface TileSelectionState {
    selectedTile: TileType
    setSelectedTile: (tile: TileType) => void
}

/**
 * タイル選択ストア
 */
export const useTileSelection = create<TileSelectionState>((set) => ({
    selectedTile: 'floor',
    setSelectedTile: (tile) => set({ selectedTile: tile }),
}))
