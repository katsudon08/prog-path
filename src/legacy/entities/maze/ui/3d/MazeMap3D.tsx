"use client";

import React from "react";
import type { TileType } from "../../model/types";
import { MazeTeleportTile3D } from "./MazeTeleportTile3D";
import { MazeKeyTile3D } from "./MazeKeyTile3D";
import { MazeStartTile3D } from "./MazeStartTile3D";
import { MazeGoalTile3D } from "./MazeGoalTile3D";
import { MazeHoleTile3D } from "./MazeHoleTile3D";
import { MazeFloorTile3D } from "./MazeFloorTile3D";
import { MazeWallTile3D } from "./MazeWallTile3D";

/**
 * タイルレンダラーの共通Props
 */
interface TileRendererProps {
    position: [number, number, number];
    tileSize: number;
    wallHeight: number;
    opacity: number;
    tileType: TileType;
}

/**
 * タイルレンダラー関数の型定義
 */
type TileRenderer = (props: TileRendererProps, key: string) => React.ReactNode;

/**
 * タイルタイプごとのレンダラーマップ
 * 新しいタイルタイプを追加する場合は、ここにエントリを追加するだけで拡張可能
 */
const TILE_RENDERER_MAP: Record<TileType, TileRenderer> = {
    wall: ({ position, tileSize, wallHeight, opacity }, key) => (
        <MazeWallTile3D
            key={key}
            position={position}
            tileSize={tileSize}
            wallHeight={wallHeight}
            opacity={opacity}
        />
    ),

    floor: ({ position, tileSize, opacity }, key) => (
        <MazeFloorTile3D
            key={key}
            position={position}
            tileSize={tileSize}
            opacity={opacity}
        />
    ),

    hole: ({ position, tileSize, opacity }, key) => (
        <MazeHoleTile3D
            key={key}
            position={position}
            tileSize={tileSize}
            opacity={opacity}
        />
    ),

    start: ({ position, tileSize, opacity }, key) => (
        <MazeStartTile3D
            key={key}
            position={position}
            tileSize={tileSize}
            opacity={opacity}
        />
    ),

    goal: ({ position, tileSize, opacity }, key) => (
        <MazeGoalTile3D
            key={key}
            position={position}
            tileSize={tileSize}
            opacity={opacity}
        />
    ),

    teleportUp: ({ position, tileSize, opacity }, key) => (
        <MazeTeleportTile3D
            key={key}
            position={position}
            isUp={true}
            tileSize={tileSize}
            opacity={opacity}
        />
    ),

    teleportDown: ({ position, tileSize, opacity }, key) => (
        <MazeTeleportTile3D
            key={key}
            position={position}
            isUp={false}
            tileSize={tileSize}
            opacity={opacity}
        />
    ),

    key: ({ position, tileSize, opacity }, key) => (
        <group key={key}>
            {/* 下に床を敷く */}
            <MazeFloorTile3D
                position={position}
                tileSize={tileSize}
                opacity={opacity}
            />
            <MazeKeyTile3D
                position={position}
                tileSize={tileSize}
                opacity={opacity}
            />
        </group>
    ),
};

interface MazeMap3DProps {
    grid: TileType[][];
    mazeSize: number;
    opacity?: number;
    layerOffset?: number;
}

/**
 * 迷路グリッドの3D表示コンポーネント
 * 各タイルタイプに応じた3Dオブジェクトを配置
 * マッピングオブジェクトを使用した宣言的な構造により、タイル種別追加時の拡張が容易
 */
export function MazeMap3D({
    grid,
    mazeSize,
    opacity = 1.0,
    layerOffset = 0
}: MazeMap3DProps) {
    const tileSize = 0.5;
    const wallHeight = 0.5;
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2;

    return (
        <group>
            {grid.map((row, y) =>
                row.map((tile, x) => {
                    const position: [number, number, number] = [
                        x * tileSize + gridOffset,
                        0,
                        y * tileSize + gridOffset,
                    ];
                    const key = `${x}-${y}`;
                    
                    const renderer = TILE_RENDERER_MAP[tile];
                    if (!renderer) return null;
                    
                    return renderer(
                        { position, tileSize, wallHeight, opacity, tileType: tile },
                        key
                    );
                })
            )}
        </group>
    );
}
