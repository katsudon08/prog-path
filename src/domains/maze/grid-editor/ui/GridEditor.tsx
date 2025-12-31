"use client"

import { useState, useCallback, useMemo } from "react"
import type { TileType } from "@/src/domains/maze/maze-data/lib/types"
import { getTileEditorColor, getTileIcon } from "@domains/maze/tile-palette"

interface GridEditorProps {
    grid: TileType[][]
    onTileClick: (row: number, col: number) => void
    maxWidth?: number  // 最大幅（px）
    maxHeight?: number // 最大高さ（px）
}

const DEFAULT_CELL_SIZE = 48 // デフォルトのセルサイズ
const MIN_CELL_SIZE = 24    // 最小セルサイズ
const GAP = 4               // セル間のギャップ
const PADDING = 16          // コンテナのパディング

/**
 * グリッドエディタUIコンポーネント
 * マウスドラッグによる連続配置に対応
 * maxWidth/maxHeightに応じて自動スケーリング
 */
export function GridEditor({ grid, onTileClick, maxWidth, maxHeight }: GridEditorProps) {
    const [isDrawing, setIsDrawing] = useState(false)

    // グリッドサイズに応じてセルサイズを計算
    const cellSize = useMemo(() => {
        const rows = grid?.length || 0
        const cols = grid?.[0]?.length || 0

        if (rows === 0 || cols === 0) return DEFAULT_CELL_SIZE

        let size = DEFAULT_CELL_SIZE

        if (maxWidth) {
            const availableWidth = maxWidth - PADDING * 2
            const maxCellWidth = (availableWidth - (cols - 1) * GAP) / cols
            size = Math.min(size, maxCellWidth)
        }

        if (maxHeight) {
            const availableHeight = maxHeight - PADDING * 2
            const maxCellHeight = (availableHeight - (rows - 1) * GAP) / rows
            size = Math.min(size, maxCellHeight)
        }

        return Math.max(MIN_CELL_SIZE, Math.floor(size))
    }, [grid, maxWidth, maxHeight])

    // アイコンサイズ（セルサイズに応じて調整）
    const iconSize = Math.max(12, Math.floor(cellSize * 0.6))

    const handleMouseDown = useCallback((row: number, col: number) => {
        setIsDrawing(true)
        onTileClick(row, col)
    }, [onTileClick])

    const handleMouseUp = useCallback(() => {
        setIsDrawing(false)
    }, [])

    const handleMouseEnter = useCallback((row: number, col: number) => {
        if (isDrawing) {
            onTileClick(row, col)
        }
    }, [isDrawing, onTileClick])

    const handleMouseLeave = useCallback(() => {
        setIsDrawing(false)
    }, [])

    const cellStyle = {
        width: `${cellSize}px`,
        height: `${cellSize}px`,
    }

    return (
        <div
            className="inline-flex flex-col gap-1 rounded-lg border-2 border-neon-cyan/30 bg-space-dark p-4"
            onMouseLeave={handleMouseLeave}
        >
            {grid?.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                    {row.map((tile, colIndex) => {
                        const icon = getTileIcon(tile, iconSize)
                        return (
                            <button
                                key={`${rowIndex}-${colIndex}`}
                                style={cellStyle}
                                className={`rounded border-2 border-neon-blue/20 transition-all hover:border-neon-cyan hover:scale-105 flex items-center justify-center ${getTileEditorColor(tile)}`}
                                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                                onMouseUp={handleMouseUp}
                                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                            >
                                {icon}
                            </button>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
