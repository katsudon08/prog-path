"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TeleportTileProps {
    position: [number, number, number];
    isUp: boolean;
    tileSize: number;
    opacity?: number;
}

/**
 * テレポートタイル用3Dコンポーネント
 * 上へ: 発光する水色（シアン）の矢印
 * 下へ: 発光する紫色の矢印
 */
export function TeleportTile({
    position,
    isUp,
    tileSize,
    opacity = 1.0
}: TeleportTileProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const arrowRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // 発光の脈動アニメーション
            const intensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.4;
            const material = meshRef.current.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = intensity;
        }

        if (arrowRef.current) {
            // 矢印の上下アニメーション
            const bounceAmount = Math.sin(state.clock.elapsedTime * 3) * 0.05;
            arrowRef.current.position.y = 0.08 + bounceAmount;

            // 矢印の回転アニメーション
            arrowRef.current.rotation.y = state.clock.elapsedTime * 0.8;
        }
    });

    // 2Dアイコンに合わせた色: 水色(上へ) vs 紫(下へ)
    const color = isUp ? "#22d3ee" : "#a855f7"; // シアン vs 紫
    const arrowRotation = isUp ? 0 : Math.PI; // 上向き vs 下向き

    return (
        <group>
            {/* 床タイル */}
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

            {/* 発光する床の光 */}
            <mesh
                ref={meshRef}
                position={[position[0], 0.001, position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[tileSize * 0.35, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5 * opacity}
                    opacity={0.4 * opacity}
                    transparent
                />
            </mesh>

            {/* 矢印インジケーター */}
            <group ref={arrowRef} position={[position[0], 0.05, position[2]]}>
                <mesh rotation={[arrowRotation, 0, 0]}>
                    <coneGeometry args={[0.08, 0.15, 3]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={1.5 * opacity}
                        opacity={opacity}
                        transparent
                    />
                </mesh>
            </group>
        </group>
    );
}
