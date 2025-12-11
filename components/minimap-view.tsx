"use client";

import React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
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
            return '#4a90e2'; // ネオンブルー (壁)
        case 'hole':
            return '#a855f7'; // ネオンパープル (穴)
        case 'teleportUp':
            return '#3b82f6'; // 青 (上へ)
        case 'teleportDown':
            return '#ec4899'; // ピンク (下へ)
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
        <group position={position}>
            {/* ベースのタイル */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[tileSize * 0.95, tileSize * 0.95]} />
                <meshStandardMaterial color={color} />
            </mesh>
            
            {/* 鍵アイコン */}
            {tile === 'key' && (
                <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.12, 0.04, 8, 16]} />
                    <meshStandardMaterial 
                        color="#ffd700" 
                        emissive="#ffd700"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            )}
        </group>
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

// カメラ調整コンポーネント
function CameraAdjuster({ mazeSize }: { mazeSize: number }) {
    const { camera, size } = useThree();

    React.useEffect(() => {
        if (!(camera instanceof THREE.PerspectiveCamera)) return;

        const tileSize = 0.5;
        const totalSize = mazeSize * tileSize;
        const padding = 1.3; // 30% 余白

        // 必要な表示範囲 (高さ) = totalSize * padding
        // 2 * dist * tan(fov / 2) >= requiredHeight
        const fovRad = (camera.fov * Math.PI) / 180;
        
        const aspect = size.width / size.height;

        // 縦方向に収めるための距離
        const distVertical = (totalSize * padding) / (2 * Math.tan(fovRad / 2));
        
        // 横方向に収めるための距離 (width = height * aspect)
        const distHorizontal = (totalSize * padding) / (2 * Math.tan(fovRad / 2) * aspect);

        // 両方を満たす最大距離を採用
        // ただし、最小値は 5.0 (既存のデフォルト) とする
        const dist = Math.max(5.0, distVertical, distHorizontal);

        camera.position.y = dist;
        camera.updateProjectionMatrix();

    }, [camera, size, mazeSize]);

    return null;
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
            
            {/* カメラ位置調整 */}
            <CameraAdjuster mazeSize={mazeSize} />

            {/* 現在の層のみを描画 */}
            <MinimapMaze
                layer={currentLayer}
                robotState={robotState}
                mazeSize={mazeSize}
            />
        </Canvas>
    );
}
