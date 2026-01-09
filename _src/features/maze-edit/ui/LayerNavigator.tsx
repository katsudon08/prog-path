"use client"

import { ChevronUp, ChevronDown, Plus, Minus } from "lucide-react"
import { Button } from "../../../../src/shared/ui/button"
import { useToast } from "../../../shared/ui/toast"
import type { ActionResult } from "../../../shared/model"

interface LayerNavigatorProps {
    currentLayer: number
    totalLayers: number
    canAddLayer: boolean
    canRemoveLayer: boolean
    canGoPrev: boolean
    canGoNext: boolean
    onPrevLayer: () => void
    onNextLayer: () => void
    onAddLayer: () => ActionResult
    onRemoveLayer: () => ActionResult
}

/**
 * 階層ナビゲーターコンポーネント
 * 迷路エディタで使用する階層操作UI
 */
export function LayerNavigator({
    currentLayer,
    totalLayers,
    canAddLayer,
    canRemoveLayer,
    canGoPrev,
    canGoNext,
    onPrevLayer,
    onNextLayer,
    onAddLayer,
    onRemoveLayer,
}: LayerNavigatorProps) {
    const { addToast } = useToast()

    const handleAddLayer = () => {
        const result = onAddLayer()
        if (result.message) {
            addToast(result)
        }
    }

    const handleRemoveLayer = () => {
        const result = onRemoveLayer()
        if (result.message) {
            addToast(result)
        }
    }

    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-space-darker rounded-lg border border-neon-blue/20">
            <h3 className="text-sm font-medium text-neon-cyan">階層</h3>
            
            {/* 上へ移動 */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onNextLayer}
                disabled={!canGoNext}
                className="w-full"
            >
                <ChevronUp className="h-4 w-4" />
            </Button>
            
            {/* 現在の階層表示 */}
            <div className="flex items-center justify-center w-full py-2 px-4 bg-space-dark rounded-md">
                <span className="text-lg font-bold text-neon-green">
                    {currentLayer + 1}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                    / {totalLayers}
                </span>
            </div>
            
            {/* 下へ移動 */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onPrevLayer}
                disabled={!canGoPrev}
                className="w-full"
            >
                <ChevronDown className="h-4 w-4" />
            </Button>
            
            {/* 階層操作 */}
            <div className="flex gap-2 w-full mt-2 pt-2 border-t border-neon-blue/10">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddLayer}
                    disabled={!canAddLayer}
                    className="flex-1"
                    title="階層を追加"
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLayer}
                    disabled={!canRemoveLayer}
                    className="flex-1"
                    title="階層を削除"
                >
                    <Minus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
