"use client"

import { useState, useMemo } from "react"
import type { TileType } from "../model/types"
import { getTileColor } from "../lib/tile-colors"
import { getTileIcon } from "@domains/maze/tile-palette"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MazePreviewProps {
    grid?: TileType[][] // 単一階層のグリッド（後方互換性のため残す）
    layers?: TileType[][][] // 複数階層対応
    layerIndex?: number // オプション：初期階層
    cellSize?: number // セルサイズ（ピクセル）デフォルト: 24
    showNavigation?: boolean // レイヤーナビゲーション表示 デフォルト: true
    compact?: boolean // コンパクトモード（ミニマップ用） デフォルト: false
    maxWidth?: number // 最大幅（ピクセル）- 超える場合は自動縮小
    maxHeight?: number // 最大高さ（ピクセル）- 超える場合は自動縮小
}

/**
 * 迷路プレビューコンポーネント
 * 迷路の2D表示と階層ナビゲーションを提供
 */
export function MazePreview({
    grid,
    layers,
    layerIndex,
    cellSize = 24,
    showNavigation = true,
    compact = false,
    maxWidth,
    maxHeight,
}: MazePreviewProps) {
    // 複数階層がある場合は layers を使用、なければ grid を配列化
    const allLayers = layers || (grid ? [grid] : [])
    const [currentLayerIndex, setCurrentLayerIndex] = useState(layerIndex ?? 0)

    // 表示する階層を決定
    const displayLayer = allLayers[currentLayerIndex] || []
    const hasMultipleLayers = allLayers.length > 1

    // グリッドサイズを取得
    const rows = displayLayer.length
    const cols = displayLayer[0]?.length || 0

    // 適切なセルサイズを計算（maxWidth/maxHeightを考慮）
    const effectiveCellSize = useMemo(() => {
        let size = cellSize
        const gap = compact ? 1 : 2 // gap-px = 1px, gap-0.5 = 2px
        const gridPadding = compact ? 8 : 16 // p-1 = 8px, p-2 = 16px
        const containerPadding = 24 // 外側のパディング（上下左右各12px）

        if (maxWidth && cols > 0) {
            const availableWidth = maxWidth - containerPadding
            const maxCellWidth = (availableWidth - gridPadding - (cols - 1) * gap) / cols
            size = Math.min(size, maxCellWidth)
        }

        if (maxHeight && rows > 0) {
            // ナビゲーションの高さ + gap を考慮
            const navHeight = showNavigation && hasMultipleLayers ? 60 : 0
            const availableHeight = maxHeight - navHeight - containerPadding
            const maxCellHeight = (availableHeight - gridPadding - (rows - 1) * gap) / rows
            size = Math.min(size, maxCellHeight)
        }

        // 最小1pxを保証
        return Math.max(1, Math.floor(size))
    }, [cellSize, maxWidth, maxHeight, rows, cols, compact, showNavigation, hasMultipleLayers])

    // アイコンサイズ（セルサイズに応じて調整）
    const iconSize = Math.max(8, Math.floor(effectiveCellSize * 0.65))

    const handlePrevLayer = () => {
        setCurrentLayerIndex((prev) => Math.max(0, prev - 1))
    }

    const handleNextLayer = () => {
        setCurrentLayerIndex((prev) => Math.min(allLayers.length - 1, prev + 1))
    }

    // コンパクトモード用のスタイル
    const cellStyle = {
        width: `${effectiveCellSize}px`,
        height: `${effectiveCellSize}px`
    }

    const gapClass = compact ? "gap-px" : "gap-0.5"
    const paddingClass = compact ? "p-1" : "p-2"

    return (
        <div className="flex flex-col gap-2 items-center">
            {/* 階層ナビゲーション */}
            {showNavigation && hasMultipleLayers && (
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
            <div className={`inline-flex flex-col ${gapClass} rounded-lg border border-neon-blue bg-space-dark ${paddingClass}`}>
                {displayLayer.map((row, rowIndex) => (
                    <div key={rowIndex} className={`flex ${gapClass}`}>
                        {row.map((tile, colIndex) => {
                            const icon = getTileIcon(tile, iconSize)
                            return (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`rounded-sm flex items-center justify-center ${getTileColor(tile)}`}
                                    style={cellStyle}
                                >
                                    {icon}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
