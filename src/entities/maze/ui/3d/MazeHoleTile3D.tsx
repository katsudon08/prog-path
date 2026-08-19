"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MazeHoleTile3DProps {
    position: [number, number, number];
    tileSize: number;
    opacity?: number;
}

/**
 * 穴タイル用3Dコンポーネント
 * ブラックホール風のオレンジ色降着円盤と黒い中心
 */
export function MazeHoleTile3D({
    position,
    tileSize,
    opacity = 1.0
}: MazeHoleTile3DProps) {
    const ringRef = useRef<THREE.Mesh>(null);
    const innerRingRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        // リングの回転アニメーション
        if (ringRef.current) {
            ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
        }
        if (innerRingRef.current) {
            innerRingRef.current.rotation.z = -state.clock.elapsedTime * 0.8;
        }
    });

    return (
        <group>
            {/* 床タイル（暗い） */}
            <mesh
                receiveShadow
                position={position}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[tileSize * 0.98, tileSize * 0.98]} />
                <meshStandardMaterial
                    color="#1a2540"
                    opacity={0.75 * opacity}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* ブラックホールの中心（暗い穴） - 床レベル */}
            <mesh
                position={[position[0], 0.002, position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[tileSize * 0.2, 32]} />
                <meshBasicMaterial
                    color="#000000"
                    opacity={1.0 * opacity}
                    transparent
                />
            </mesh>

            {/* 内側のリング（第1層） */}
            <mesh
                ref={innerRingRef}
                position={[position[0], 0.03, position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <ringGeometry args={[tileSize * 0.12, tileSize * 0.2, 32]} />
                <meshStandardMaterial
                    color="#ea580c"
                    emissive="#ea580c"
                    emissiveIntensity={0.6 * opacity}
                    opacity={0.7 * opacity}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 外側の発光リング（第2層 - 降着円盤） */}
            <mesh
                ref={ringRef}
                position={[position[0], 0.06, position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <ringGeometry args={[tileSize * 0.25, tileSize * 0.38, 32]} />
                <meshStandardMaterial
                    color="#f97316"
                    emissive="#f97316"
                    emissiveIntensity={0.8 * opacity}
                    opacity={0.8 * opacity}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}
