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
    /**
     * タイルをクリックして配置
     * @returns { success: boolean, errorMessage?: string }
     */
    const handleTileClick = useCallback((row: number, col: number): { success: boolean, errorMessage?: string } => {
        // テレポート配置検証
        const teleportValidation = validateTeleportPlacement(
            selectedTile, row, col, currentLayer, layers
        )
        if (!teleportValidation.valid) {
            return { success: false, errorMessage: teleportValidation.errorMessage }
        }

        // テレポート先検証
        const destinationValidation = validateNotTeleportDestination(
            selectedTile, row, col, currentLayer, layers
        )
        if (!destinationValidation.valid) {
            return { success: false, errorMessage: destinationValidation.errorMessage }
        }

        let newLayers = [...layers]

        // スタートまたはゴールタイルを配置する場合、既存の同種タイルを削除（フロアに置換）
        if (selectedTile === "start" || selectedTile === "goal") {
            newLayers = newLayers.map(layer =>
                layer.map(r =>
                    r.map(tile => tile === selectedTile ? "floor" : tile)
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
        return { success: true }
    }, [layers, setLayers, currentLayer, selectedTile])

    return {
        initializeGrid,
        handleTileClick,
    }
}
