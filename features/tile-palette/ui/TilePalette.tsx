"use client"

import type { TileType } from "@entities/maze"
import { TILE_TYPES } from "../lib/tile-types"

interface TilePaletteProps {
    selectedTile: TileType
    onSelectTile: (tile: TileType) => void
}

/**
 * タイルパレットコンポーネント
 * 迷路エディタで配置するタイルを選択するUI
 * コンパクトな1列レイアウト
 */
export function TilePalette({ selectedTile, onSelectTile }: TilePaletteProps) {
    return (
        <div className="flex flex-col gap-1.5 h-full">
            {TILE_TYPES.map((tileType) => (
                <button
                    key={tileType.type}
                    onClick={() => onSelectTile(tileType.type)}
                    className={`flex flex-1 w-full items-center gap-2 rounded border-2 px-2 transition-all origin-center hover:scale-[1.05] min-h-0 ${
                        selectedTile === tileType.type
                            ? "border-neon-cyan bg-neon-cyan/10"
                            : "border-neon-blue/30 bg-space-blue/20"
                    }`}
                >
                    <div className={`h-6 w-6 rounded shrink-0 ${tileType.color}`} />
                    <span className="text-foreground text-sm">{tileType.label}</span>
                </button>
            ))}
        </div>
    )
}

