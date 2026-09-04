"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MazeKeyTile3DProps {
    position: [number, number, number];
    tileSize: number;
    opacity?: number;
    isCollected?: boolean;
}

/**
 * 鍵タイル用3Dコンポーネント
 * 洗練された発光する鍵オブジェクト（傾き回転・浮遊アニメーション付き）
 */
export function MazeKeyTile3D({
    position,
    opacity = 1.0,
    isCollected = false
}: MazeKeyTile3DProps) {
    const groupRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const sparkle1Ref = useRef<THREE.Mesh>(null);
    const sparkle2Ref = useRef<THREE.Mesh>(null);
    const sparkle3Ref = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
        if (groupRef.current && !isCollected) {
            // Y軸回転アニメーション
            groupRef.current.rotation.y = state.clock.elapsedTime * 1.5;
            // 浮遊アニメーション
            groupRef.current.position.y = 0.25 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
        }
        
        // 床の光の脈動
        if (glowRef.current) {
            const glowOpacity = 0.25 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
            const material = glowRef.current.material as THREE.MeshBasicMaterial;
            material.opacity = glowOpacity * opacity;
        }

        // キラキラエフェクト
        const time = state.clock.elapsedTime;
        if (sparkle1Ref.current) {
            sparkle1Ref.current.position.y = 0.15 + Math.sin(time * 4) * 0.1;
            sparkle1Ref.current.position.x = Math.cos(time * 2) * 0.12;
            const mat = sparkle1Ref.current.material as THREE.MeshBasicMaterial;
            mat.opacity = (0.5 + Math.sin(time * 5) * 0.5) * opacity;
        }
        if (sparkle2Ref.current) {
            sparkle2Ref.current.position.y = 0.1 + Math.sin(time * 3 + 1) * 0.08;
            sparkle2Ref.current.position.x = Math.cos(time * 2.5 + 2) * 0.1;
            const mat = sparkle2Ref.current.material as THREE.MeshBasicMaterial;
            mat.opacity = (0.5 + Math.sin(time * 4 + 1) * 0.5) * opacity;
        }
        if (sparkle3Ref.current) {
            sparkle3Ref.current.position.y = 0.2 + Math.sin(time * 3.5 + 2) * 0.06;
            sparkle3Ref.current.position.z = Math.sin(time * 2 + 1) * 0.1;
            const mat = sparkle3Ref.current.material as THREE.MeshBasicMaterial;
            mat.opacity = (0.5 + Math.sin(time * 6 + 2) * 0.5) * opacity;
        }
    });
    
    if (isCollected) return null;

    const keyColor = "#fbbf24"; // amber-400
    const keyEmissive = "#f59e0b"; // amber-500

    return (
        <group position={[position[0], 0, position[2]]}>
            {/* 床の発光エフェクト */}
            <mesh
                ref={glowRef}
                position={[0, 0.001, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[0.18, 32]} />
                <meshBasicMaterial
                    color={keyColor}
                    opacity={0.3 * opacity}
                    transparent
                />
            </mesh>

            {/* 鍵本体（回転グループ） */}
            <group ref={groupRef} position={[0, 0.25, 0]}>
                {/* 傾きグループ（X軸で傾ける） */}
                <group rotation={[Math.PI / 6, 0, 0]}>
                    {/* 持ち手部分 - トーラス（穴あきリング） */}
                    <mesh position={[0, 0.1, 0]}>
                        <torusGeometry args={[0.05, 0.018, 16, 24]} />
                        <meshStandardMaterial
                            color={keyColor}
                            emissive={keyEmissive}
                            emissiveIntensity={0.8 * opacity}
                            metalness={0.95}
                            roughness={0.05}
                            opacity={opacity}
                            transparent={opacity < 1}
                        />
                    </mesh>

                    {/* 鍵の軸 (メインシャフト) - 持ち手の下部から開始 */}
                    <mesh position={[0, -0.04, 0]}>
                        <boxGeometry args={[0.028, 0.2, 0.018]} />
                        <meshStandardMaterial
                            color={keyColor}
                            emissive={keyEmissive}
                            emissiveIntensity={0.6 * opacity}
                            metalness={0.95}
                            roughness={0.05}
                            opacity={opacity}
                            transparent={opacity < 1}
                        />
                    </mesh>

                    {/* 鍵の歯 - 軸の右側に接着 */}
                    <group position={[0.014, -0.1, 0]}>
                        {/* 歯1（上） */}
                        <mesh position={[0.022, 0.03, 0]}>
                            <boxGeometry args={[0.044, 0.022, 0.018]} />
                            <meshStandardMaterial
                                color={keyColor}
                                emissive={keyEmissive}
                                emissiveIntensity={0.6 * opacity}
                                metalness={0.95}
                                roughness={0.05}
                                opacity={opacity}
                                transparent={opacity < 1}
                            />
                        </mesh>
                        {/* 歯2（中） */}
                        <mesh position={[0.028, 0, 0]}>
                            <boxGeometry args={[0.056, 0.018, 0.018]} />
                            <meshStandardMaterial
                                color={keyColor}
                                emissive={keyEmissive}
                                emissiveIntensity={0.6 * opacity}
                                metalness={0.95}
                                roughness={0.05}
                                opacity={opacity}
                                transparent={opacity < 1}
                            />
                        </mesh>
                        {/* 歯3（下） */}
                        <mesh position={[0.02, -0.028, 0]}>
                            <boxGeometry args={[0.04, 0.016, 0.018]} />
                            <meshStandardMaterial
                                color={keyColor}
                                emissive={keyEmissive}
                                emissiveIntensity={0.6 * opacity}
                                metalness={0.95}
                                roughness={0.05}
                                opacity={opacity}
                                transparent={opacity < 1}
                            />
                        </mesh>
                    </group>
                </group>

                {/* キラキラパーティクル */}
                <mesh ref={sparkle1Ref} position={[0.1, 0.15, 0]}>
                    <sphereGeometry args={[0.012, 8, 8]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        opacity={0.8 * opacity}
                        transparent
                    />
                </mesh>
                <mesh ref={sparkle2Ref} position={[-0.08, 0.1, 0.05]}>
                    <sphereGeometry args={[0.01, 8, 8]} />
                    <meshBasicMaterial
                        color="#fef3c7"
                        opacity={0.6 * opacity}
                        transparent
                    />
                </mesh>
                <mesh ref={sparkle3Ref} position={[0.05, 0.2, -0.08]}>
                    <sphereGeometry args={[0.008, 8, 8]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        opacity={0.7 * opacity}
                        transparent
                    />
                </mesh>
            </group>
        </group>
    );
}
