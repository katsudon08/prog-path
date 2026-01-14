"use client"

import { MazeTile2D, getTileColor, type TileType } from "@/_src/entities/maze"
import { useTileSelection, TILE_TYPES } from "../model/useTileSelection"

/**
 * タイル名を日本語で取得
 */
function getTileName(type: TileType): string {
    const names: Record<TileType, string> = {
        floor: "ミチ",
        wall: "カベ",
        start: "スタート",
        goal: "ゴール",
        hole: "ブラックホール",
        key: "カギ",
        teleportUp: "上へのテレポート",
        teleportDown: "下へのテレポート",
    }
    return names[type] || type
}

/**
 * タイルパレットコンポーネント
 * エディタで使用するタイル選択UI
 */
export function TilePalette() {
    const { selectedTile, setSelectedTile } = useTileSelection()

    return (
        <div className="flex flex-col gap-2 p-4 bg-space-darker rounded-lg border border-neon-blue/20">
            <h3 className="text-sm font-medium text-neon-cyan mb-2">タイルパレット</h3>
            <div className="grid grid-cols-4 gap-2">
                {TILE_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedTile(type)}
                        className={`
                            flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                            ${selectedTile === type
                                ? "bg-neon-cyan/20 ring-2 ring-neon-cyan"
                                : "bg-space-dark hover:bg-space-dark/80"
                            }
                        `}
                        title={getTileName(type)}
                    >
                        <MazeTile2D type={type} size={32} />
                        <span className="text-xs text-muted-foreground">
                            {getTileName(type)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
