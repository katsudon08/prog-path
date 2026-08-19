import { useCallback } from 'react'
import { MIN_LAYERS, MAX_LAYERS, type TileType } from '@/src/entities/maze'
import type { ActionResult } from '@/src/shared/model'

interface UseLayerManagementProps {
    layers: TileType[][][]
    setLayers: React.Dispatch<React.SetStateAction<TileType[][][]>>
    currentLayer: number
    setCurrentLayer: React.Dispatch<React.SetStateAction<number>>
    gridSize: number
}

/**
 * 階層管理ロジックを提供するカスタムフック
 */
export function useLayerManagement({
    layers,
    setLayers,
    currentLayer,
    setCurrentLayer,
    gridSize,
}: UseLayerManagementProps) {
    /**
     * 階層を追加
     */
    const addLayer = useCallback((): ActionResult => {
        if (layers.length >= MAX_LAYERS) {
            return {
                success: false,
                type: 'error',
                message: `最大${MAX_LAYERS}階層まで作成できます`,
            }
        }

        const newGrid: TileType[][] = Array(gridSize)
            .fill(null)
            .map(() => Array(gridSize).fill("floor"))
        setLayers([...layers, newGrid])

        return {
            success: true,
            type: 'success',
            message: `${layers.length + 1}階層目を追加しました`,
        }
    }, [layers, setLayers, gridSize])

    /**
     * 階層を削除（最後の階層のみ）
     */
    const removeLayer = useCallback((): ActionResult => {
        if (layers.length <= MIN_LAYERS) {
            return {
                success: false,
                type: 'error',
                message: `最低${MIN_LAYERS}階層は必要です`,
            }
        }

        if (currentLayer >= layers.length - 1) {
            setCurrentLayer(layers.length - 2)
        }
        setLayers(layers.slice(0, -1))

        return {
            success: true,
            type: 'success',
            message: `${layers.length}階層目を削除しました`,
        }
    }, [layers, setLayers, currentLayer, setCurrentLayer])

    /**
     * 前の階層へ移動
     */
    const goToPrevLayer = useCallback(() => {
        setCurrentLayer(Math.max(0, currentLayer - 1))
    }, [currentLayer, setCurrentLayer])

    /**
     * 次の階層へ移動
     */
    const goToNextLayer = useCallback(() => {
        setCurrentLayer(Math.min(layers.length - 1, currentLayer + 1))
    }, [currentLayer, setCurrentLayer, layers.length])

    /**
     * 指定の階層に移動
     */
    const goToLayer = useCallback((index: number) => {
        if (index >= 0 && index < layers.length) {
            setCurrentLayer(index)
        }
    }, [layers.length, setCurrentLayer])

    return {
        addLayer,
        removeLayer,
        goToPrevLayer,
        goToNextLayer,
        goToLayer,
        canAddLayer: layers.length < MAX_LAYERS,
        canRemoveLayer: layers.length > MIN_LAYERS,
        canGoPrev: currentLayer > 0,
        canGoNext: currentLayer < layers.length - 1,
        maxLayers: MAX_LAYERS,
        minLayers: MIN_LAYERS,
    }
}
