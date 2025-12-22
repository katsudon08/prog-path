"use client"

import { useState } from "react"
import type { TileType } from "../model/types"
import { getTileColor } from "../lib/tile-colors"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MazePreviewProps {
    grid?: TileType[][] // 単一階層のグリッド（後方互換性のため残す）
    layers?: TileType[][][] // 複数階層対応
    layerIndex?: number // オプション：階層番号を表示用
}

/**
 * 迷路プレビューコンポーネント
 * 迷路の2D表示と階層ナビゲーションを提供
 */
export function MazePreview({ grid, layers, layerIndex }: MazePreviewProps) {
    // 複数階層がある場合は layers を使用、なければ grid を配列化
    const allLayers = layers || (grid ? [grid] : [])
    const [currentLayerIndex, setCurrentLayerIndex] = useState(layerIndex || 0)
    
    // 表示する階層を決定
    const displayLayer = allLayers[currentLayerIndex] || []
    const hasMultipleLayers = allLayers.length > 1

    const handlePrevLayer = () => {
        setCurrentLayerIndex((prev) => Math.max(0, prev - 1))
    }

    const handleNextLayer = () => {
        setCurrentLayerIndex((prev) => Math.min(allLayers.length - 1, prev + 1))
    }

    return (
        <div className="flex flex-col gap-2 items-center">
            {/* 階層ナビゲーション */}
            {hasMultipleLayers && (
                <div className="flex items-center justify-between bg-space-dark/50 rounded-lg p-2 border border-neon-blue/30">
                    <button
                        onClick={handlePrevLayer}
                        disabled={currentLayerIndex === 0}
                        className="p-2 rounded hover:bg-neon-blue/10 disabled:opacity-30 disabled:cursor-not-allowed text-neon-cyan"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="text-neon-cyan font-semibold">
                        Layer {currentLayerIndex + 1} / {allLayers.length}
                    </div>
                    <button
                        onClick={handleNextLayer}
                        disabled={currentLayerIndex === allLayers.length - 1}
                        className="p-2 rounded hover:bg-neon-blue/10 disabled:opacity-30 disabled:cursor-not-allowed text-neon-cyan"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}
            
            {/* グリッド表示 */}
            <div className="inline-flex flex-col gap-0.5 rounded-lg border border-neon-blue bg-space-dark p-2">
                {displayLayer.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-0.5">
                        {row.map((tile, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`h-6 w-6 rounded-sm ${getTileColor(tile)}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
