import { useCallback } from "react"
import type { TileType } from "@/src/domains/maze/maze-data/lib/types"
import { validateTeleportPlacement, validateNotTeleportDestination } from "./tile-validation"

interface UseMazeGridEditorProps {
    layers: TileType[][][]
    setLayers: React.Dispatch<React.SetStateAction<TileType[][][]>>
    currentLayer: number
    selectedTile: TileType
}

/**
 * 迷路グリッド編集ロジックを提供するカスタムフック
 */
export function useMazeGridEditor({
    layers,
    setLayers,
    currentLayer,
    selectedTile,
}: UseMazeGridEditorProps) {
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
    const handleTileClick = useCallback((row: number, col: number): boolean => {
        // テレポート配置検証
        const teleportValidation = validateTeleportPlacement(
            selectedTile, row, col, currentLayer, layers
        )
        if (!teleportValidation.valid) {
            alert(teleportValidation.errorMessage)
            return false
        }

        // テレポート先検証
        const destinationValidation = validateNotTeleportDestination(
            selectedTile, row, col, currentLayer, layers
        )
        if (!destinationValidation.valid) {
            alert(destinationValidation.errorMessage)
            return false
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
        return true
    }, [layers, setLayers, currentLayer, selectedTile])

    return {
        initializeGrid,
        handleTileClick,
    }
}
