"use client";

import React from "react";
import * as THREE from "three";
import type { TileType } from "../model/types";
import { TeleportTile } from "./TeleportTile";
import { KeyTile } from "./KeyTile";
import { StartTile } from "./StartTile";
import { GoalTile } from "./GoalTile";
import { HoleTile } from "./HoleTile";

interface MazeMapProps {
    grid: TileType[][];
    mazeSize: number;
    opacity?: number;
    layerOffset?: number;
}

/**
 * 迷路グリッドの3D表示コンポーネント
 * 各タイルタイプに応じた3Dオブジェクトを配置
 */
export function MazeMap({
    grid,
    mazeSize,
    opacity = 1.0,
    layerOffset = 0
}: MazeMapProps) {
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
                    switch (tile) {
                        case "wall":
                            return (
                                <mesh
                                    key={`${x}-${y}`}
                                    castShadow
                                    receiveShadow
                                    position={[
                                        position[0],
                                        wallHeight / 2,
                                        position[2],
                                    ]}
                                >
                                    <boxGeometry
                                        args={[tileSize, wallHeight, tileSize]}
                                    />
                                    <meshStandardMaterial
                                        color="#4a90e2"
                                        opacity={0.85 * opacity}
                                        transparent
                                    />
                                </mesh>
                            );
                        case "hole":
                            return (
                                <HoleTile
                                    key={`${x}-${y}`}
                                    position={position}
                                    tileSize={tileSize}
                                    opacity={opacity}
                                />
                            );
                        case "teleportUp":
                        case "teleportDown":
                            return (
                                <TeleportTile
                                    key={`${x}-${y}`}
                                    position={position}
                                    isUp={tile === "teleportUp"}
                                    tileSize={tileSize}
                                    opacity={opacity}
                                />
                            );
                        case "key":
                            return (
                                <group key={`${x}-${y}`}>
                                    {/* 下に床を敷く */}
                                    <mesh
                                        receiveShadow
                                        position={position}
                                        rotation={[-Math.PI / 2, 0, 0]}
                                    >
                                        <planeGeometry
                                            args={[tileSize * 0.98, tileSize * 0.98]}
                                        />
                                        <meshStandardMaterial
                                            color="#1a2540"
                                            opacity={0.75 * opacity}
                                            transparent
                                            side={THREE.DoubleSide}
                                        />
                                    </mesh>
                                    <KeyTile
                                        position={position}
                                        tileSize={tileSize}
                                        opacity={opacity}
                                    />
                                </group>
                            );
                        case "start":
                            return (
                                <StartTile
                                    key={`${x}-${y}`}
                                    position={position}
                                    tileSize={tileSize}
                                    opacity={opacity}
                                />
                            );
                        case "goal":
                            return (
                                <GoalTile
                                    key={`${x}-${y}`}
                                    position={position}
                                    tileSize={tileSize}
                                    opacity={opacity}
                                />
                            );
                        case "floor":
                            return (
                                <mesh
                                    key={`${x}-${y}`}
                                    receiveShadow
                                    position={position}
                                    rotation={[-Math.PI / 2, 0, 0]}
                                >
                                    <planeGeometry
                                        args={[tileSize * 0.98, tileSize * 0.98]}
                                    />
                                    <meshStandardMaterial
                                        color="#1a2540"
                                        opacity={0.75 * opacity}
                                        transparent
                                        side={THREE.DoubleSide}
                                    />
                                </mesh>
                            );
                        default:
                            return null;
                    }
                })
            )}
        </group>
    );
}
