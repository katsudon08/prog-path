"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { RobotState, RobotAnimationState, DirectionVector } from "../model/types";
import { directionToRotation, gridToWorldPosition } from "../lib/position";

interface RobotModelProps {
    /** ロボットの状態 */
    robotState: RobotState;
    /** 迷路のサイズ */
    mazeSize: number;
    /** 現在のタイルタイプ（Features層から渡される） */
    currentTileType?: string;
    /** 落下中かどうか（Features層から渡される） */
    isFalling?: boolean;
    /** テレポート中かどうか（Features層から渡される） */
    isTeleporting?: boolean;
    /** アニメーション状態（Features層から渡される） */
    animationState?: RobotAnimationState;
    /** レーザースキャン中かどうか */
    isScanning?: boolean;
    /** スキャン先の方向 */
    scanDirection?: DirectionVector;
}

/**
 * ロボット3Dモデルコンポーネント
 * Features層から渡されるプリミティブなpropsに基づいてアニメーションを行う
 * 
 * 注意: このコンポーネントはMazeDataに依存しません。
 * 衝突判定や状態管理はFeatures層（ar-execution等）で行ってください。
 */
export function RobotModel({
    robotState,
    mazeSize,
    currentTileType = "floor",
    isFalling = false,
    isTeleporting = false,
    animationState = "idle",
    isScanning = false,
    scanDirection,
}: RobotModelProps) {
    const { scene } = useGLTF("/robot.gltf");
    const modelRef = useRef<THREE.Group>(null!);

    // アニメーション用の状態
    const [fallProgress, setFallProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [teleportPhase, setTeleportPhase] = useState(0);
    const [laserLength, setLaserLength] = useState(0);

    const animationStartTimeRef = useRef<number>(0);
    const teleportStartTimeRef = useRef<number>(0);
    const teleportYOffsetRef = useRef(0);
    const teleportOpacityRef = useRef(1.0);
    const prevIsFallingRef = useRef(false);
    const prevIsTeleportingRef = useRef(false);
    const prevIsScanningRef = useRef(false);

    const tileSize = 0.5;

    // 目標位置を計算
    const targetPosition = React.useMemo(() => {
        const [worldX, worldZ] = gridToWorldPosition(robotState.x, robotState.y, mazeSize, tileSize);
        return new THREE.Vector3(worldX, 0.05, worldZ);
    }, [robotState.x, robotState.y, mazeSize, tileSize]);

    // 目標回転を計算
    const targetQuaternion = React.useMemo(
        () =>
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    0,
                    directionToRotation(robotState.direction) - Math.PI / 2,
                    0
                )
            ),
        [robotState.direction]
    );

    // 落下開始検出
    useEffect(() => {
        if (isFalling && !prevIsFallingRef.current) {
            animationStartTimeRef.current = performance.now();
            setFallProgress(0);
            setIsVisible(true);
        }
        if (!isFalling && prevIsFallingRef.current) {
            // 落下終了 - リセット
            setFallProgress(0);
            setIsVisible(true);
            if (modelRef.current) {
                modelRef.current.scale.setScalar(0.12);
            }
        }
        prevIsFallingRef.current = isFalling;
    }, [isFalling]);

    // テレポート開始検出
    useEffect(() => {
        if (isTeleporting && !prevIsTeleportingRef.current) {
            setTeleportPhase(1);
            teleportStartTimeRef.current = performance.now();
            teleportYOffsetRef.current = 0;
            teleportOpacityRef.current = 1.0;
        }
        if (!isTeleporting && prevIsTeleportingRef.current) {
            // テレポート終了
            setTeleportPhase(0);
            teleportYOffsetRef.current = 0;
            teleportOpacityRef.current = 1.0;
        }
        prevIsTeleportingRef.current = isTeleporting;
    }, [isTeleporting]);

    // スキャン開始検出
    useEffect(() => {
        if (isScanning && !prevIsScanningRef.current) {
            animationStartTimeRef.current = performance.now();
            setLaserLength(0);
        }
        if (!isScanning && prevIsScanningRef.current) {
            setLaserLength(0);
        }
        prevIsScanningRef.current = isScanning;
    }, [isScanning]);

    // useFrame - アニメーション処理
    useFrame((_, delta) => {
        if (!modelRef.current) return;

        const elapsed = performance.now() - animationStartTimeRef.current;

        // 落下アニメーション
        if (isFalling) {
            const fallDuration = 1000;
            const progress = Math.min(elapsed / fallDuration, 1);
            setFallProgress(progress);

            const scale = Math.max(0.01, 1.0 - progress * 0.95);
            modelRef.current.scale.setScalar(0.12 * scale);

            const yOffset = -progress * 0.2;
            modelRef.current.position.y = 0.05 + yOffset;
            modelRef.current.rotation.y += delta * 24 * progress;

            const opacity = Math.max(0, 1.0 - progress);
            modelRef.current.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = true;
                            mat.opacity = opacity;
                        });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity = opacity;
                    }
                }
            });

            if (progress >= 1) {
                setIsVisible(false);
            }
            return;
        }

        // スキャンアニメーション
        if (isScanning) {
            const scanDuration = 1200;
            const progress = Math.min(elapsed / scanDuration, 1);
            setLaserLength(progress);
        }

        // テレポートアニメーション
        if (isTeleporting && teleportPhase > 0) {
            const teleportElapsed = performance.now() - teleportStartTimeRef.current;

            switch (teleportPhase) {
                case 1: {
                    const phase1Duration = 300;
                    const phase1Progress = Math.min(teleportElapsed / phase1Duration, 1);
                    teleportYOffsetRef.current = 0.3 * phase1Progress;
                    if (phase1Progress >= 1) {
                        setTeleportPhase(2);
                        teleportStartTimeRef.current = performance.now();
                    }
                    break;
                }
                case 2: {
                    const phase2Duration = 200;
                    const phase2Progress = Math.min(teleportElapsed / phase2Duration, 1);
                    teleportOpacityRef.current = 1.0 - phase2Progress;
                    if (phase2Progress >= 1) {
                        setTeleportPhase(3);
                        teleportStartTimeRef.current = performance.now();
                    }
                    break;
                }
                case 3: {
                    modelRef.current.position.copy(targetPosition);
                    modelRef.current.position.y += teleportYOffsetRef.current;
                    setTeleportPhase(4);
                    teleportStartTimeRef.current = performance.now();
                    break;
                }
                case 4: {
                    const phase4Duration = 200;
                    const phase4Progress = Math.min(teleportElapsed / phase4Duration, 1);
                    teleportOpacityRef.current = phase4Progress;
                    if (phase4Progress >= 1) {
                        setTeleportPhase(5);
                        teleportStartTimeRef.current = performance.now();
                    }
                    break;
                }
                case 5: {
                    const phase5Duration = 300;
                    const phase5Progress = Math.min(teleportElapsed / phase5Duration, 1);
                    teleportYOffsetRef.current = 0.3 * (1 - phase5Progress);
                    if (phase5Progress >= 1) {
                        setTeleportPhase(0);
                        teleportYOffsetRef.current = 0;
                        teleportOpacityRef.current = 1.0;
                    }
                    break;
                }
            }

            modelRef.current.position.copy(targetPosition);
            modelRef.current.position.y += teleportYOffsetRef.current;

            modelRef.current.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = true;
                            mat.opacity = teleportOpacityRef.current;
                        });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity = teleportOpacityRef.current;
                    }
                }
            });

            modelRef.current.quaternion.slerp(targetQuaternion, delta * 8.0);
            return;
        }

        // 通常の移動処理
        const moveSpeed = 0.8;
        const distance = modelRef.current.position.distanceTo(targetPosition);

        if (distance > 0.01) {
            const maxMove = moveSpeed * delta;
            const moveAmount = Math.min(distance, maxMove);
            const direction = new THREE.Vector3()
                .subVectors(targetPosition, modelRef.current.position)
                .normalize();
            modelRef.current.position.add(direction.multiplyScalar(moveAmount));
        } else {
            modelRef.current.position.copy(targetPosition);
        }
        modelRef.current.quaternion.slerp(targetQuaternion, delta * 8.0);
    });

    if (!isVisible) {
        return null;
    }

    const [gridOffset] = gridToWorldPosition(0, 0, mazeSize, tileSize);
    const scanTargetX = scanDirection ? (robotState.x + scanDirection[0]) * tileSize + gridOffset * 2 + tileSize / 2 : 0;
    const scanTargetZ = scanDirection ? (robotState.y + scanDirection[1]) * tileSize + gridOffset * 2 + tileSize / 2 : 0;

    return (
        <group>
            <primitive ref={modelRef} object={scene} scale={0.12} castShadow />

            {/* スキャンエフェクト */}
            {isScanning && laserLength > 0 && scanDirection && (
                <>
                    <pointLight
                        position={[scanTargetX, 0.3 + laserLength * 0.2, scanTargetZ]}
                        color="#00aaff"
                        intensity={laserLength * 30}
                        distance={3.0}
                    />
                    <mesh position={[scanTargetX, 0.1 + laserLength * 0.15, scanTargetZ]}>
                        <sphereGeometry args={[0.05 + laserLength * 0.12, 24, 24]} />
                        <meshBasicMaterial color="#00ccff" transparent opacity={0.9} />
                    </mesh>
                    <mesh
                        position={[scanTargetX, 0.015, scanTargetZ]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <circleGeometry args={[0.1 + laserLength * 0.15, 32]} />
                        <meshBasicMaterial color="#00aaff" transparent opacity={laserLength * 0.8} />
                    </mesh>
                </>
            )}
        </group>
    );
}
