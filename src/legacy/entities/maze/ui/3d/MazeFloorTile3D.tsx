"use client";

import React from "react";
import * as THREE from "three";

interface MazeFloorTile3DProps {
    position: [number, number, number];
    tileSize: number;
    opacity?: number;
    color?: string;
}

/**
 * 床タイル用3Dコンポーネント
 * 通常の床タイルを表示
 */
export function MazeFloorTile3D({
    position,
    tileSize,
    opacity = 1.0,
    color = "#1a2540"
}: MazeFloorTile3DProps) {
    return (
        <mesh
            receiveShadow
            position={position}
            rotation={[-Math.PI / 2, 0, 0]}
        >
            <planeGeometry args={[tileSize * 0.98, tileSize * 0.98]} />
            <meshStandardMaterial
                color={color}
                opacity={0.75 * opacity}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}
