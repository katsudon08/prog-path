"use client"

import { MazeTile2D, type TileType } from "@/_src/entities/maze"
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
 * スプラトゥーン風のインクが流れるような選択UI
 */
export function TilePalette() {
    const { selectedTile, setSelectedTile } = useTileSelection()

    return (
        <div className="flex flex-col gap-2 p-4 bg-space-darker rounded-lg">
            <h3 className="text-sm font-medium text-neon-cyan mb-2">タイルパレット</h3>
            <div className="grid grid-cols-4 gap-2">
                {TILE_TYPES.map((type) => (
                    <div
                        key={type}
                        className={`
                            relative flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer
                            transition-transform duration-200
                            ${selectedTile === type
                                ? "scale-105"
                                : "bg-space-dark hover:bg-space-dark/80 hover:scale-102"
                            }
                        `}
                        style={{
                            borderRadius: selectedTile === type ? '40% 60% 55% 45% / 50% 40% 60% 50%' : undefined,
                        }}
                        title={getTileName(type)}
                    >
                        {/* スプラトゥーン風インク背景 */}
                        {selectedTile === type && (
                            <>
                                {/* メインインクブロブ */}
                                <div 
                                    className="absolute inset-[-4px] -z-10"
                                    style={{
                                        background: 'linear-gradient(135deg, #00ffea 0%, #a855f7 40%, #c026d3 70%, #00ff88 100%)',
                                        borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%',
                                        animation: 'inkMorph 2s ease-in-out infinite',
                                        filter: 'blur(1px)',
                                    }}
                                />
                                {/* インクの光沢 */}
                                <div 
                                    className="absolute inset-0 -z-5"
                                    style={{
                                        background: 'radial-gradient(ellipse 60% 40% at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                                        borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%',
                                        animation: 'inkShine 2s ease-in-out infinite',
                                    }}
                                />
                                {/* インクの飛び散り（左上） */}
                                <div 
                                    className="absolute -top-1 -left-1 w-3 h-3 -z-10"
                                    style={{
                                        background: '#00ffea',
                                        borderRadius: '60% 40% 50% 50% / 50% 60% 40% 50%',
                                        animation: 'splatDrop 1.5s ease-in-out infinite',
                                    }}
                                />
                                {/* インクの飛び散り（右下） */}
                                <div 
                                    className="absolute -bottom-1 -right-1 w-2 h-2 -z-10"
                                    style={{
                                        background: '#00ff88',
                                        borderRadius: '50% 60% 40% 50% / 40% 50% 60% 50%',
                                        animation: 'splatDrop 1.8s ease-in-out infinite reverse',
                                    }}
                                />
                                {/* インクの波紋 */}
                                <div 
                                    className="absolute inset-[-2px] -z-8"
                                    style={{
                                        border: '2px solid rgba(0, 255, 234, 0.6)',
                                        borderRadius: '45% 55% 50% 50% / 55% 45% 55% 45%',
                                        animation: 'inkRipple 1.2s ease-out infinite',
                                    }}
                                />
                            </>
                        )}
                        <MazeTile2D
                            type={type}
                            size={32}
                            isSelected={selectedTile === type}
                            onClick={() => setSelectedTile(type)}
                        />
                        <span className={`text-xs relative z-10 ${selectedTile === type ? 'text-space-darker font-bold' : 'text-muted-foreground'}`}>
                            {getTileName(type)}
                        </span>
                    </div>
                ))}
            </div>
            {/* スプラトゥーン風アニメーション */}
            <style jsx>{`
                @keyframes inkMorph {
                    0%, 100% {
                        border-radius: 40% 60% 55% 45% / 50% 40% 60% 50%;
                        transform: scale(1) rotate(0deg);
                    }
                    25% {
                        border-radius: 55% 45% 40% 60% / 45% 55% 45% 55%;
                        transform: scale(1.02) rotate(1deg);
                    }
                    50% {
                        border-radius: 45% 55% 60% 40% / 60% 40% 55% 45%;
                        transform: scale(0.98) rotate(-1deg);
                    }
                    75% {
                        border-radius: 60% 40% 45% 55% / 40% 60% 40% 60%;
                        transform: scale(1.01) rotate(0.5deg);
                    }
                }
                @keyframes inkShine {
                    0%, 100% {
                        opacity: 0.4;
                        transform: translate(0, 0);
                    }
                    50% {
                        opacity: 0.6;
                        transform: translate(5%, 5%);
                    }
                }
                @keyframes splatDrop {
                    0%, 100% {
                        transform: scale(1) translate(0, 0);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.3) translate(-2px, -2px);
                        opacity: 1;
                    }
                }
                @keyframes inkRipple {
                    0% {
                        transform: scale(0.95);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.1);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}
