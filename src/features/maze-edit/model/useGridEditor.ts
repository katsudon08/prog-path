import { useCallback } from 'react'
import { validateTeleportPlacement, MIN_GRID_SIZE, MAX_GRID_SIZE, type TileType } from '@/src/entities/maze'
import type { ActionResult } from '@/src/shared/model'

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
     * サイズ縮小時に重要タイルが削除される場合も処理を中断せず、通知のみ行う
     */
    const resizeGrid = useCallback((newSize: number): ActionResult => {
        if (newSize < MIN_GRID_SIZE || newSize > MAX_GRID_SIZE) {
            return {
                success: false,
                type: 'error',
                message: `グリッドサイズは${MIN_GRID_SIZE}〜${MAX_GRID_SIZE}の範囲で設定してください`,
            }
        }

        const currentSize = layers[0]?.length || 0
        const deletedTiles: Set<string> = new Set()

        // サイズ縮小時に削除されるタイルをチェック
        if (newSize < currentSize) {
            layers.forEach((layer, layerIdx) => {
                for (let row = 0; row < layer.length; row++) {
                    for (let col = 0; col < layer[row].length; col++) {
                        // 新サイズの範囲外にあるタイルをチェック
                        if (row >= newSize || col >= newSize) {
                            const tile = layer[row][col]
                            if (tile === 'start') {
                                deletedTiles.add("スタートタイル")
                            }
                            if (tile === 'goal') {
                                deletedTiles.add("ゴールタイル")
                            }
                        }
                    }
                }
            })
        }

        // リサイズ実行（中断しない）
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

        // 削除されたタイルがある場合は警告メッセージを含める
        if (deletedTiles.size > 0) {
            const deletedTilesStr = Array.from(deletedTiles).join('と')
            return {
                success: true,
                type: 'info',
                message: `グリッドサイズを${newSize}x${newSize}に変更しました。\n範囲外にあった${deletedTilesStr}が削除されました。`,
            }
        }

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
