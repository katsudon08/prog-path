"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/legacy/shared/ui"

interface LayerNavigatorProps {
    currentLayer: number
    totalLayers: number
    canGoPrev: boolean
    canGoNext: boolean
    onPrevLayer: () => void
    onNextLayer: () => void
}

/**
 * 階層ナビゲーターコンポーネント
 * 迷路エディタで使用する階層操作UI（横向き）
 */
export function LayerNavigator({
    currentLayer,
    totalLayers,
    canGoPrev,
    canGoNext,
    onPrevLayer,
    onNextLayer,
}: LayerNavigatorProps) {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-space-darker rounded-lg">
            <span className="text-sm text-neon-cyan">階層:</span>

            {/* 前へ移動 */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onPrevLayer}
                disabled={!canGoPrev}
                className="h-8 w-8 p-0"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* 現在の階層表示 */}
            <div className="flex items-center justify-center px-3 py-1 bg-space-dark rounded-md min-w-[60px]">
                <span className="text-lg font-bold text-neon-green">
                    {currentLayer + 1}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                    / {totalLayers}
                </span>
            </div>

            {/* 次へ移動 */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onNextLayer}
                disabled={!canGoNext}
                className="h-8 w-8 p-0"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
