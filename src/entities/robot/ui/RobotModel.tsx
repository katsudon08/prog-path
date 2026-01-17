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
    /** アイテム回収中（鍵など） */
    isCollecting?: boolean;
    /** 穴埋め中かどうか */
    isFilling?: boolean;
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
    isCollecting = false,
    isFilling = false,
    scanDirection,
}: RobotModelProps) {
    const { scene } = useGLTF("/robot.gltf");
    // シーンをクローンしてマテリアルを独立させる（キャッシュ汚染防止）
    const clonedScene = React.useMemo(() => {
        const clone = scene.clone();
        clone.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                node.material = Array.isArray(node.material)
                    ? node.material.map(m => m.clone())
                    : node.material.clone();
                
                // 元のマテリアル設定を保存（リセット時に復元するため）
                const saveOriginalState = (m: THREE.Material) => {
                    m.userData.originalTransparent = m.transparent;
                    m.userData.originalOpacity = m.opacity;
                };

                if (Array.isArray(node.material)) {
                    node.material.forEach(saveOriginalState);
                } else {
                    saveOriginalState(node.material);
                }
            }
        });
        return clone;
    }, [scene]);
    const modelRef = useRef<THREE.Group>(null!);

    // アニメーション用の状態
    const [fallProgress, setFallProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [teleportPhase, setTeleportPhase] = useState(0);
    const [laserLength, setLaserLength] = useState(0);

    // Refs for optimization (avoid state updates in useFrame)
    const fillingGroupRef = useRef<THREE.Group>(null);
    const fillingOuterMeshRef = useRef<THREE.Mesh>(null);
    const fillingInnerMeshRef = useRef<THREE.Mesh>(null);
    const fillingLightRef = useRef<THREE.PointLight>(null);
    const fillingFloorMeshRef = useRef<THREE.Mesh>(null);

    const animationStartTimeRef = useRef<number>(0);
    const teleportStartTimeRef = useRef<number>(0);
    const fillingStartTimeRef = useRef<number>(0);
    const teleportYOffsetRef = useRef(0);
    const teleportOpacityRef = useRef(1.0);
    const prevIsFallingRef = useRef(false);
    const prevIsTeleportingRef = useRef(false);
    const prevIsFillingRef = useRef(false);

    const tileSize = 0.5;

    // マテリアルとスケールを初期状態に戻す
    const resetVisuals = () => {
        if (modelRef.current) {
            modelRef.current.scale.setScalar(0.12);
            modelRef.current.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    const restoreMaterial = (mat: THREE.Material) => {
                        // 強制的に不透明に戻す
                        mat.transparent = false;
                        mat.opacity = 1.0;
                        mat.depthWrite = true; // 深度書き込みを有効化
                        mat.needsUpdate = true; // 更新フラグを立てる
                    };

                    if (Array.isArray(child.material)) {
                        child.material.forEach(restoreMaterial);
                    } else {
                        restoreMaterial(child.material);
                    }
                }
            });
        }
    };

    // 表示状態がtrueになった時（再マウント時）にビジュアルをリセット
    useEffect(() => {
        if (isVisible) {
            resetVisuals();
        }
    }, [isVisible]);

    // 初期化時およびアイドル状態に戻った時にビジュアルをリセット
    useEffect(() => {
        if (animationState === 'idle') {
            resetVisuals();
        }
    }, [animationState]);
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
            resetVisuals();
        }
        prevIsFallingRef.current = isFalling;
    }, [isFalling]);

    // テレポート開始検出
    useEffect(() => {
        console.log('[RobotModel] isTeleporting changed:', isTeleporting, 'prev:', prevIsTeleportingRef.current);
        if (isTeleporting && !prevIsTeleportingRef.current) {
            console.log('[RobotModel] Starting Teleport Sequence');
            setTeleportPhase(1);
            teleportStartTimeRef.current = performance.now();
            teleportYOffsetRef.current = 0;
            teleportOpacityRef.current = 1.0;
        }
        if (!isTeleporting && prevIsTeleportingRef.current) {
            console.log('[RobotModel] Ending Teleport Sequence (Reset Phase)');
            // テレポート終了
            setTeleportPhase(0);
            teleportYOffsetRef.current = 0;
            teleportOpacityRef.current = 1.0;
            resetVisuals();
        }
        prevIsTeleportingRef.current = isTeleporting;
    }, [isTeleporting]);

    // 穴埋め開始検出
    useEffect(() => {
        if (isFilling && !prevIsFillingRef.current) {
            fillingStartTimeRef.current = performance.now();
        }
        prevIsFillingRef.current = isFilling;
    }, [isFilling]);

    // ... (Scan effect omitted for brevity if unchanged, but I need to match the replacement block)
    // Actually I'll just target the useEffect block.

    // 穴埋め用のターゲット座標（正面のタイル）を計算
    const frontTargetPos = React.useMemo(() => {
        const frontX = robotState.x + robotState.direction[0];
        const frontY = robotState.y + robotState.direction[1];
        const [wx, wz] = gridToWorldPosition(frontX, frontY, mazeSize, tileSize);
        return [wx, 0.2, wz] as [number, number, number];
    }, [robotState, mazeSize, tileSize]);

    // useFrame - アニメーション処理
    useFrame((_, delta) => {
        if (!modelRef.current) return;
        
        // Debug Log (throttled?) - Maybe not every frame, but let's see phases.
        if (isTeleporting) {
             // console.log('[RobotModel] Teleport Phase:', teleportPhase);
        }

        const elapsed = performance.now() - animationStartTimeRef.current;
        // ...

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

            modelRef.current.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = true;
                            mat.opacity = Math.max(0, 1.0 - progress);
                        });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity = Math.max(0, 1.0 - progress);
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

        // 穴埋めアニメーション
        if (isFilling) {
            const fillDuration = 500;
            const fillingProgress = Math.min((performance.now() - fillingStartTimeRef.current) / fillDuration, 1);
            
            // Refを使用して直接更新（再レンダリング防止）
            if (fillingOuterMeshRef.current) {
                fillingOuterMeshRef.current.scale.setScalar(fillingProgress);
                if (fillingOuterMeshRef.current.material instanceof THREE.MeshBasicMaterial) {
                    fillingOuterMeshRef.current.material.opacity = fillingProgress * 0.4;
                }
            }
            if (fillingInnerMeshRef.current) {
                fillingInnerMeshRef.current.scale.setScalar(fillingProgress);
                if (fillingInnerMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
                    fillingInnerMeshRef.current.material.opacity = Math.min(1, fillingProgress * 2.0);
                }
            }
            if (fillingLightRef.current) {
                fillingLightRef.current.intensity = fillingProgress * 5;
            }
            if (fillingFloorMeshRef.current) {
                fillingFloorMeshRef.current.scale.setScalar(fillingProgress);
                if (fillingFloorMeshRef.current.material instanceof THREE.MeshBasicMaterial) {
                    fillingFloorMeshRef.current.material.opacity = fillingProgress * 0.5;
                }
            }
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
                         // アニメーション完了後も、isTeleportingがfalseになるまでこの状態を維持
                         // useEffect側でCleanUpされるのを待つ
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
        const moveSpeed = 1.5; // 500ms内に1タイル(0.5単位)移動できる速度
        const distance = modelRef.current.position.distanceTo(targetPosition);

        // animationStateがidleまたは距離が大きい場合（リセット時など）は瞬間移動
        if (animationState === 'idle' || distance > tileSize * 1.5) {
            modelRef.current.position.copy(targetPosition);
            modelRef.current.quaternion.copy(targetQuaternion);
        } else if (distance > 0.01) {
            const maxMove = moveSpeed * delta;
            const moveAmount = Math.min(distance, maxMove);
            const direction = new THREE.Vector3()
                .subVectors(targetPosition, modelRef.current.position)
                .normalize();
            modelRef.current.position.add(direction.multiplyScalar(moveAmount));
            modelRef.current.quaternion.slerp(targetQuaternion, delta * 8.0);
        } else {
            modelRef.current.position.copy(targetPosition);
            modelRef.current.quaternion.slerp(targetQuaternion, delta * 8.0);
        }
    });

    if (!isVisible) {
        return null;
    }

    const [gridOffset] = gridToWorldPosition(0, 0, mazeSize, tileSize);
    const scanTargetX = scanDirection ? (robotState.x + scanDirection[0]) * tileSize + gridOffset * 2 + tileSize / 2 : 0;
    const scanTargetZ = scanDirection ? (robotState.y + scanDirection[1]) * tileSize + gridOffset * 2 + tileSize / 2 : 0;

    return (
        <group>
            <primitive ref={modelRef} object={clonedScene} scale={0.12} castShadow />

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

             {/* 穴埋めエフェクト（光球：穴の上で徐々に光る） */}
             <group position={frontTargetPos} visible={isFilling} ref={fillingGroupRef}>
                    {/* 光球本体（淡い外側） */}
                    <mesh ref={fillingOuterMeshRef} renderOrder={1}>
                        <sphereGeometry args={[0.25, 32, 32]} />
                        <meshBasicMaterial 
                            color="#00aaff" 
                            transparent 
                            opacity={0} 
                            depthWrite={false}
                        />
                    </mesh>
                    {/* 内側のコア（強烈な光） */}
                    <mesh ref={fillingInnerMeshRef} renderOrder={2}>
                        <sphereGeometry args={[0.11, 32, 32]} />
                        <meshStandardMaterial 
                            color="#94c2ff"
                            emissive="#94c2ff"
                            emissiveIntensity={10.0}
                            toneMapped={false}
                            transparent 
                            opacity={0} 
                            depthWrite={false}
                        />
                    </mesh>
                    {/* 発光エフェクト */}
                    <pointLight 
                        ref={fillingLightRef}
                        color="#0088ff" 
                        intensity={0} 
                        distance={3} 
                    />
                    {/* 床面の輝き */}
                    <mesh 
                        ref={fillingFloorMeshRef}
                        rotation={[-Math.PI / 2, 0, 0]} 
                        position={[0, -0.15, 0]} // 少し下げる
                    >
                        <circleGeometry args={[0.3, 32]} />
                        <meshBasicMaterial 
                            color="#00aaff" 
                            transparent 
                            opacity={0} 
                        />
                    </mesh>
                </group>
        </group>
    );
}
