"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text3D, Center } from "@react-three/drei";

interface MazeGoalTile3DProps {
    position: [number, number, number];
    tileSize: number;
    opacity?: number;
}

/**
 * ゴールタイル用3Dコンポーネント
 * 発光する赤色の「G」マーク（回転アニメーション付き）
 */
export function MazeGoalTile3D({
    position,
    tileSize,
    opacity = 1.0
}: MazeGoalTile3DProps) {
    const textRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const textGroupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (textRef.current) {
            // 発光の脈動アニメーション
            const intensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
            const material = textRef.current.material as THREE.MeshStandardMaterial;
            if (material.emissiveIntensity !== undefined) {
                material.emissiveIntensity = intensity;
            }
        }
        if (glowRef.current) {
            // 床の光の脈動
            const glowOpacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
            const material = glowRef.current.material as THREE.MeshBasicMaterial;
            material.opacity = glowOpacity * opacity;
        }
        if (textGroupRef.current) {
            // 文字の回転アニメーション
            textGroupRef.current.rotation.y = state.clock.elapsedTime * 1.5;
        }
    });

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
                ref={glowRef}
                position={[position[0], 0.001, position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[tileSize * 0.4, 32]} />
                <meshBasicMaterial
                    color="#ef4444"
                    opacity={0.3 * opacity}
                    transparent
                />
            </mesh>

            {/* 発光する「G」文字（回転アニメーション付き） */}
            <group ref={textGroupRef} position={[position[0], tileSize * 0.35, position[2]]}>
                <Center>
                    <Text3D
                        ref={textRef}
                        font="/fonts/helvetiker_regular.typeface.json"
                        size={tileSize * 0.4}
                        height={0.02}
                        curveSegments={8}
                    >
                        G
                        <meshStandardMaterial
                            color="#ef4444"
                            emissive="#ef4444"
                            emissiveIntensity={0.6 * opacity}
                            transparent
                            opacity={opacity}
                            side={THREE.DoubleSide}
                        />
                    </Text3D>
                </Center>
            </group>
        </group>
    );
}
