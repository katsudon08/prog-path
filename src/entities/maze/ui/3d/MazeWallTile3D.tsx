"use client";

import React from "react";

interface MazeWallTile3DProps {
    position: [number, number, number];
    tileSize: number;
    wallHeight?: number;
    opacity?: number;
    color?: string;
}

/**
 * 壁タイル用3Dコンポーネント
 * 立体的な壁ブロックを表示
 */
export function MazeWallTile3D({
    position,
    tileSize,
    wallHeight = 0.5,
    opacity = 1.0,
    color = "#4a90e2"
}: MazeWallTile3DProps) {
    return (
        <mesh
            castShadow
            receiveShadow
            position={[
                position[0],
                wallHeight / 2,
                position[2],
            ]}
        >
            <boxGeometry args={[tileSize, wallHeight, tileSize]} />
            <meshStandardMaterial
                color={color}
                opacity={0.85 * opacity}
                transparent
            />
        </mesh>
    );
}
