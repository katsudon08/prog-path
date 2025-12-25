"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { MazeData, TileType } from '@entities/maze';
import type { RobotState } from '@entities/robot';
import { getTileColor } from '@entities/maze';

interface MinimapViewProps {
    maze: MazeData;
    robotState: RobotState;
}

/**
 * ミニマップビューコンポーネント
 * ホーム画面の迷路プレビューと同じ2Dスタイル
 */
export function MinimapView({ maze, robotState }: MinimapViewProps) {
    // ロボットの現在の階層を表示
    const currentLayer = maze.layers[robotState.z] || maze.layers[0];
    const [layerIndex, setLayerIndex] = useState(robotState.z);

    // ロボットの階層が変わったら追従
    useEffect(() => {
        setLayerIndex(robotState.z);
    }, [robotState.z]);

    const displayLayer = maze.layers[layerIndex] || currentLayer;
    const rows = displayLayer.length;
    const cols = displayLayer[0]?.length || 0;

    // セルサイズを計算（コンテナに収まるように自動スケーリング）
    const cellSize = useMemo(() => {
        // ミニマップコンテナのサイズ（w-44 h-44 = 176px、パディングと階層表示を考慮）
        const containerSize = 176;
        const padding = 16; // p-2 = 8px * 2
        const layerIndicatorHeight = maze.layers.length > 1 ? 24 : 0;
        const gridBorder = 4; // border + padding
        
        const availableWidth = containerSize - padding - gridBorder;
        const availableHeight = containerSize - padding - gridBorder - layerIndicatorHeight;
        
        // gap-px（1px）を考慮
        const gapTotal = Math.max(rows, cols) - 1;
        
        const maxCellWidth = (availableWidth - gapTotal) / cols;
        const maxCellHeight = (availableHeight - gapTotal) / rows;
        
        // 両方に収まる最小サイズを採用、最小8px、最大32px
        const size = Math.floor(Math.min(maxCellWidth, maxCellHeight));
        return Math.max(8, Math.min(size, 32));
    }, [rows, cols, maze.layers.length]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
            {/* 階層表示 */}
            {maze.layers.length > 1 && (
                <div className="text-xs text-neon-cyan mb-1 font-semibold">
                    {layerIndex + 1}F / {maze.layers.length}F
                </div>
            )}

            {/* グリッド表示 */}
            <div className="inline-flex flex-col gap-px rounded border border-neon-blue/50 bg-space-dark p-1">
                {displayLayer.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-px">
                        {row.map((tile, colIndex) => {
                            const isRobotHere = 
                                colIndex === robotState.x && 
                                rowIndex === robotState.y && 
                                layerIndex === robotState.z;

                            return (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`relative rounded-sm ${getTileColor(tile)}`}
                                    style={{ width: cellSize, height: cellSize }}
                                >
                                    {/* ロボット表示 */}
                                    {isRobotHere && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <RobotMarker 
                                                direction={robotState.direction} 
                                                size={cellSize * 0.7}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * ロボットマーカー（方向を示す矢印）
 */
function RobotMarker({ 
    direction, 
    size 
}: { 
    direction: [number, number]; 
    size: number;
}) {
    // 方向から回転角度を計算
    const rotation = Math.atan2(direction[0], -direction[1]) * (180 / Math.PI);

    return (
        <div
            className="relative"
            style={{
                width: size,
                height: size,
                transform: `rotate(${rotation}deg)`,
            }}
        >
            {/* 矢印形状 (SVG) */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-full h-full"
            >
                {/* 矢印の本体 */}
                <path
                    d="M12 4 L18 16 L12 13 L6 16 Z"
                    fill="white"
                    stroke="#0ff"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
}

// エクスポート用エイリアス
export const MinimapViewWidget = MinimapView;
