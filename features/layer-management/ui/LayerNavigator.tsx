"use client"

import { Button } from "@shared/ui"
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react"

interface LayerNavigatorProps {
    currentLayer: number
    totalLayers: number
    onGoToPrev: () => void
    onGoToNext: () => void
    onAddLayer: () => void
    onRemoveLayer: () => void
    canGoPrev: boolean
    canGoNext: boolean
    canAddLayer: boolean
    canRemoveLayer: boolean
}

/**
 * 階層ナビゲーションUIコンポーネント
 * シンプルな左右ナビゲーション + 階層増減
 */
export function LayerNavigator({
    currentLayer,
    totalLayers,
    onGoToPrev,
    onGoToNext,
    onAddLayer,
    onRemoveLayer,
    canGoPrev,
    canGoNext,
    canAddLayer,
    canRemoveLayer,
}: LayerNavigatorProps) {
    return (
        <div className="flex items-center gap-4">
            {/* 階層削除 */}
            <Button
                onClick={onRemoveLayer}
                variant="outline"
                size="sm"
                className="border-neon-red text-neon-red hover:bg-neon-red/80 h-8 w-8 p-0"
                disabled={!canRemoveLayer}
                title="階層を削除"
            >
                <Minus className="h-4 w-4" />
            </Button>

            {/* 前の階層へ */}
            <Button
                onClick={onGoToPrev}
                variant="outline"
                size="sm"
                className="border-neon-blue text-neon-blue h-8 w-8 p-0"
                disabled={!canGoPrev}
                title="前の階層へ"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* 現在の階層表示 */}
            <div className="px-2 text-neon-cyan text-sm font-medium min-w-[60px] text-center">
                レイヤー: {currentLayer + 1}/{totalLayers}
            </div>

            {/* 次の階層へ */}
            <Button
                onClick={onGoToNext}
                variant="outline"
                size="sm"
                className="border-neon-blue text-neon-blue h-8 w-8 p-0"
                disabled={!canGoNext}
                title="次の階層へ"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {/* 階層追加 */}
            <Button
                onClick={onAddLayer}
                variant="outline"
                size="sm"
                className="border-neon-green text-neon-green hover:bg-neon-green/80 h-8 w-8 p-0"
                disabled={!canAddLayer}
                title="階層を追加"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    )
}
