import { useCallback } from 'react'
import { validateTeleportPlacement, type TileType } from '../../../entities/maze'
import type { ActionResult } from '../../../shared/model'

const MIN_GRID_SIZE = 5
const MAX_GRID_SIZE = 10

interface UseGridEditorProps {
    layers: TileType[][][]
    setLayers: React.Dispatch<React.SetStateAction<TileType[][][]>>
    currentLayer: number
    selectedTile: TileType
}

/**
 * 迷路グリッド編集ロジックを提供するカスタムフック
 */
export function useGridEditor({
    layers,
    setLayers,
    currentLayer,
    selectedTile,
}: UseGridEditorProps) {
    /**
     * 新しいグリッドを初期化
     */
    const initializeGrid = useCallback((size: number): TileType[][][] => {
        const newGrid: TileType[][] = Array(size)
            .fill(null)
            .map(() => Array(size).fill("floor"))
        newGrid[0][0] = "start"
        newGrid[size - 1][size - 1] = "goal"
        return [newGrid]
    }, [])

    /**
     * タイルをクリックして配置
     */
    const handleTileClick = useCallback((row: number, col: number): ActionResult => {
        // テレポート配置検証（entities/mazeのバリデータを使用）
        const teleportValidation = validateTeleportPlacement(
            layers, currentLayer, row, col, selectedTile
        )
        if (!teleportValidation.success) {
            return teleportValidation
        }

        let newLayers = [...layers]

        // スタートタイルを配置する場合、既存のスタートタイルを削除
        if (selectedTile === "start") {
            newLayers = newLayers.map(layer =>
                layer.map(r =>
                    r.map(tile => tile === "start" ? "floor" : tile)
                )
            )
        }

        // ゴールタイルを配置する場合、既存のゴールタイルを削除
        if (selectedTile === "goal") {
            newLayers = newLayers.map(layer =>
                layer.map(r =>
                    r.map(tile => tile === "goal" ? "floor" : tile)
                )
            )
        }

        // 新しいタイルを配置
        newLayers = newLayers.map((layer, idx) =>
            idx === currentLayer
                ? layer.map((r, rIdx) =>
                    rIdx === row
                        ? r.map((c, cIdx) => cIdx === col ? selectedTile : c)
                        : r
                )
                : layer
        )

        setLayers(newLayers)

        return {
            success: true,
            type: 'info',
            message: '', // タイル配置は毎回通知しない
        }
    }, [layers, setLayers, currentLayer, selectedTile])

    /**
     * グリッドサイズを変更
     */
    const resizeGrid = useCallback((newSize: number): ActionResult => {
        if (newSize < MIN_GRID_SIZE || newSize > MAX_GRID_SIZE) {
            return {
                success: false,
                type: 'error',
                message: `グリッドサイズは${MIN_GRID_SIZE}〜${MAX_GRID_SIZE}の範囲で設定してください`,
            }
        }

        const newLayers = layers.map(layer => {
            const newGrid: TileType[][] = Array(newSize)
                .fill(null)
                .map((_, rIdx) =>
                    Array(newSize)
                        .fill(null)
                        .map((_, cIdx) =>
                            rIdx < layer.length && cIdx < layer[rIdx].length
                                ? layer[rIdx][cIdx]
                                : "floor"
                        )
                )
            return newGrid
        })

        setLayers(newLayers)

        return {
            success: true,
            type: 'success',
            message: `グリッドサイズを${newSize}x${newSize}に変更しました`,
        }
    }, [layers, setLayers])

    return {
        initializeGrid,
        handleTileClick,
        resizeGrid,
    }
}
