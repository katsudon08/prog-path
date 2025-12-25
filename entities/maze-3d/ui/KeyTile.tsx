"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface KeyTileProps {
    position: [number, number, number];
    tileSize: number;
    opacity?: number;
    isCollected?: boolean;
}

/**
 * 鍵タイル用3Dコンポーネント
 * 回転・浮遊アニメーション付きの鍵オブジェクト
 */
export function KeyTile({
    position,
    tileSize,
    opacity = 1.0,
    isCollected = false
}: KeyTileProps) {
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (groupRef.current && !isCollected) {
            // 回転アニメーション
            groupRef.current.rotation.y = state.clock.elapsedTime * 2;
            // 浮遊アニメーション
            groupRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        }
    });
    
    if (isCollected) return null;

    return (
        <group ref={groupRef} position={[position[0], 0.3, position[2]]}>
            {/* 内部グループで傾き（45度）を与える */}
            <group rotation={[0, 0, Math.PI / 4]}>
                {/* 鍵の持ち手 (リング) */}
                <mesh position={[0, 0.18, 0]}>
                    <torusGeometry args={[0.07, 0.035, 16, 32]} />
                    <meshStandardMaterial
                        color="#ffd700"
                        emissive="#ffd700"
                        emissiveIntensity={0.6 * opacity}
                        metalness={0.9}
                        roughness={0.1}
                        opacity={opacity}
                        transparent={opacity < 1}
                    />
                </mesh>

                {/* 鍵の軸 (シリンダー) */}
                <mesh position={[0, -0.05, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.45, 12]} />
                    <meshStandardMaterial
                        color="#ffd700"
                        emissive="#ffd700"
                        emissiveIntensity={0.6 * opacity}
                        metalness={0.9}
                        roughness={0.1}
                        opacity={opacity}
                        transparent={opacity < 1}
                    />
                </mesh>

                {/* 鍵の歯 (ボックス) */}
                <group position={[0.05, -0.2, 0]}>
                    <mesh position={[0, 0.025, 0]}>
                        <boxGeometry args={[0.08, 0.04, 0.03]} />
                        <meshStandardMaterial
                            color="#ffd700"
                            emissive="#ffd700"
                            emissiveIntensity={0.6 * opacity}
                            metalness={0.9}
                            roughness={0.1}
                            opacity={opacity}
                            transparent={opacity < 1}
                        />
                    </mesh>
                    <mesh position={[0, -0.045, 0]}>
                        <boxGeometry args={[0.08, 0.03, 0.03]} />
                        <meshStandardMaterial
                            color="#ffd700"
                            emissive="#ffd700"
                            emissiveIntensity={0.6 * opacity}
                            metalness={0.9}
                            roughness={0.1}
                            opacity={opacity}
                            transparent={opacity < 1}
                        />
                    </mesh>
                </group>
            </group>

            {/* 床の光 */}
            <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.2, 32]} />
                <meshBasicMaterial
                    color="#ffd700"
                    opacity={0.3 * opacity}
                    transparent
                />
            </mesh>
        </group>
    );
}
