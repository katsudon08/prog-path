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
 * 上階/下階へのテレポートを示すアニメーション付きタイル
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

    const color = isUp ? "#60a5fa" : "#ec4899"; // 青 vs ピンク
    const arrowRotation = isUp ? 0 : Math.PI; // 上向き vs 下向き

    return (
        <group>
            {/* 床タイル */}
            <mesh
                ref={meshRef}
                receiveShadow
                position={position}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[tileSize * 0.98, tileSize * 0.98]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5 * opacity}
                    opacity={0.8 * opacity}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 矢印インジケーター */}
            <group ref={arrowRef} position={[position[0], 0.05, position[2]]}>
                <mesh rotation={[arrowRotation, 0, 0]}>
                    <coneGeometry args={[0.08, 0.15, 3]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#ffffff"
                        emissiveIntensity={1.5 * opacity}
                        opacity={opacity}
                        transparent
                    />
                </mesh>
            </group>
        </group>
    );
}
