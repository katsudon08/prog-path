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
 * アイコンの動きをスムーズにアニメーション化
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

    // ロボットが現在の階層にいるかどうか
    const isRobotOnCurrentLayer = layerIndex === robotState.z;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
            {/* 階層表示 */}
            {maze.layers.length > 1 && (
                <div className="text-xs text-neon-cyan mb-1 font-semibold">
                    {layerIndex + 1}F / {maze.layers.length}F
                </div>
            )}

            {/* グリッドコンテナ */}
            <div className="relative inline-flex flex-col gap-px rounded border border-neon-blue/50 bg-space-dark p-1">
                {/* タイルグリッド */}
                {displayLayer.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-px">
                        {row.map((tile, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`rounded-sm ${getTileColor(tile)}`}
                                style={{ width: cellSize, height: cellSize }}
                            />
                        ))}
                    </div>
                ))}

                {/* ロボットマーカー（絶対配置でアニメーション） */}
                {isRobotOnCurrentLayer && (
                    <RobotMarker
                        direction={robotState.direction}
                        x={robotState.x}
                        y={robotState.y}
                        cellSize={cellSize}
                        padding={4} // p-1 = 4px
                        gap={1} // gap-px = 1px
                    />
                )}
            </div>
        </div>
    );
}

/**
 * ロボットマーカー（方向を示す矢印）
 * CSS transitionでスムーズに移動・回転
 */
function RobotMarker({ 
    direction, 
    x,
    y,
    cellSize,
    padding,
    gap
}: { 
    direction: [number, number]; 
    x: number;
    y: number;
    cellSize: number;
    padding: number;
    gap: number;
}) {
    // 方向から回転角度を計算 (画像の上方向を基準に合わせる)
    // direction: [0, 1] (North/Up) -> 0 deg (assuming image points up)
    // 座標系: xは右、yは下(Gridなので)。direction=[dx, dy]
    // 北(Up): [0, -1] -> 0 deg
    // 東(Right): [1, 0] -> 90 deg
    // 南(Down): [0, 1] -> 180 deg
    // 西(Left): [-1, 0] -> 270 deg / -90 deg
    
    // Math.atan2(y, x) なので atan2(dy, dx)
    // 北を0度とするため、少し調整が必要だが、
    // ここでは単純に座標変換を行う。
    // 北 [0, -1] => -90度 (atan2) => +90度して0度？
    // シンプルにマッピングする方が確実かも。
    
    let rotation = 0;
    if (direction[0] === 0 && direction[1] === -1) rotation = 0;      // North
    else if (direction[0] === 1 && direction[1] === 0) rotation = 90; // East
    else if (direction[0] === 0 && direction[1] === 1) rotation = 180;// South
    else if (direction[0] === -1 && direction[1] === 0) rotation = -90;// West

    // 座標計算
    // offset = padding + (index * (cellSize + gap))
    const left = padding + (x * (cellSize + gap));
    const top = padding + (y * (cellSize + gap));
    const size = cellSize * 0.7; // セルサイズの70%
    
    // 中央配置のためのオフセット
    // (cellSize - size) / 2
    const centerOffset = (cellSize - size) / 2;

    return (
        <div
            className="absolute flex items-center justify-center pointer-events-none transition-all duration-500 ease-in-out"
            style={{
                width: size,
                height: size,
                left: left + centerOffset,
                top: top + centerOffset,
                transform: `rotate(${rotation}deg)`,
            }}
        >
            <img 
                src="/assets/minimap-arrow.svg" 
                alt="Robot" 
                className="w-full h-full object-contain"
                style={{ filter: "drop-shadow(0 0 4px rgba(0, 255, 255, 0.5))" }}
            />
        </div>
    );
}

// エクスポート用エイリアス
export const MinimapViewWidget = MinimapView;
