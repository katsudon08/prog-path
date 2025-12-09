"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { MazeData, RobotState, TileType } from '@/lib/types';

// タイルの色を取得
function getTileColor(tile: TileType): string {
    switch (tile) {
        case 'start':
            return '#00ff00'; // 緑
        case 'goal':
            return '#ff0000'; // 赤
        case 'wall':
            return '#333333'; // 黒
        case 'hole':
            return '#000000'; // 完全な黒
        case 'teleportUp':
            return '#60a5fa'; // 青
        case 'teleportDown':
            return '#a78bfa'; // 紫
        default:
            return '#888888'; // グレー（通常のタイル）
    }
}

// ミニマップタイル
function MinimapTile({
    position,
    tile,
    tileSize,
}: {
    position: [number, number, number];
    tile: TileType;
    tileSize: number;
}) {
    const color = getTileColor(tile);
    
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[tileSize * 0.95, tileSize * 0.95]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

// ミニマップロボット
function MinimapRobot({
    position,
    direction,
}: {
    position: [number, number, number];
    direction: [number, number];
}) {
    // 方向から回転角度を計算
    // direction[0] = x方向、direction[1] = z方向
    const rotation = Math.atan2(direction[0], direction[1]);
    
    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* 矢印型のアイコン */}
            {/* 矢印の軸（長方形） */}
            <mesh position={[0, 0, -0.05]}>
                <boxGeometry args={[0.04, 0.04, 0.15]} />
                <meshStandardMaterial 
                    color="#ffffff" 
                    emissive="#ffffff" 
                    emissiveIntensity={0.8} 
                />
            </mesh>
            {/* 矢印の先端（円錐） */}
            <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.08, 0.15, 8]} />
                <meshStandardMaterial 
                    color="#ffffff" 
                    emissive="#ffffff" 
                    emissiveIntensity={0.8} 
                />
            </mesh>
        </group>
    );
}

// ミニマップ迷路
function MinimapMaze({
    layer,
    robotState,
    mazeSize,
}: {
    layer: TileType[][];
    robotState: RobotState;
    mazeSize: number;
}) {
    const tileSize = 0.5;
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2;
    
    return (
        <group>
            {/* タイルを描画 */}
            {layer.map((row, y) =>
                row.map((tile, x) => (
                    <MinimapTile
                        key={`${x}-${y}`}
                        position={[
                            x * tileSize + gridOffset,
                            0,
                            y * tileSize + gridOffset,
                        ]}
                        tile={tile}
                        tileSize={tileSize}
                    />
                ))
            )}
            
            {/* ロボットを表示 */}
            <MinimapRobot
                position={[
                    robotState.x * tileSize + gridOffset,
                    0.1,
                    robotState.y * tileSize + gridOffset,
                ]}
                direction={robotState.direction}
            />
        </group>
    );
}

// メインミニマップビュー
export function MinimapView({
    maze,
    robotState,
}: {
    maze: MazeData;
    robotState: RobotState;
}) {
    // 現在の層のみを表示
    const currentLayer = maze.layers[robotState.z];
    const mazeSize = currentLayer.length;
    
    return (
        <Canvas
            camera={{
                position: [0, 5, 0], // 上から見下ろす
                rotation: [-Math.PI / 2, 0, 0],
                fov: 50,
            }}
            style={{
                width: '100%',
                height: '100%',
            }}
        >
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 5, 2]} intensity={1} />
            
            {/* 現在の層のみを描画 */}
            <MinimapMaze
                layer={currentLayer}
                robotState={robotState}
                mazeSize={mazeSize}
            />
        </Canvas>
    );
}
