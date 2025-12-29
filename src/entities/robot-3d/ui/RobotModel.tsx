"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { RobotState, Command } from "@/src/entities/robot";
import type { MazeData } from "@/src/entities/maze";

interface RobotModelProps {
    robotState: RobotState;
    mazeSize: number;
    currentCommandIndex: number;
    flattenedCommands: Command[];
    robotTile: string;
    maze: MazeData;
}

// アニメーションの種類
type AnimationType = 'idle' | 'turnRight' | 'turnLeft' | 'fall' | 'ifHole';

/**
 * ロボット3Dモデルコンポーネント
 * コードベースのアニメーション（移動、回転、テレポート、落下、レーザー）を実装
 */
export function RobotModel({
    robotState,
    mazeSize,
    currentCommandIndex,
    flattenedCommands,
    robotTile,
    maze,
}: RobotModelProps) {
    const { scene } = useGLTF("/robot.gltf");
    const modelRef = useRef<THREE.Group>(null!);

    // 落下状態（=移動不能）かどうか
    const isImmobilizedRef = useRef<boolean>(false);
    // 落下（移動不能）になった瞬間の座標を保持
    const immobilizedPositionRef = useRef<THREE.Vector3 | null>(null);

    // テレポートアニメーション用の状態管理
    const [isTeleporting, setIsTeleporting] = useState(false);
    const [teleportPhase, setTeleportPhase] = useState(0);

    // テレポートアニメーション用のタイマーとオフセット
    const teleportStartTimeRef = useRef<number>(0);
    const prevZRef = useRef(robotState.z);
    const teleportYOffsetRef = useRef(0);
    const teleportOpacityRef = useRef(1.0);
    const teleportPositionSnapshotRef = useRef<THREE.Vector3 | null>(null);
    const justFinishedTeleportRef = useRef(false);
    const teleportFinishTimeRef = useRef(0);

    // コードベースアニメーション用の状態
    const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('idle');
    const animationStartTimeRef = useRef<number>(0);

    // 落下アニメーション用
    const [fallProgress, setFallProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const fallStartedRef = useRef(false); // 落下アニメーション開始フラグ

    // ifHoleレーザーアニメーション用
    const [laserActive, setLaserActive] = useState(false);
    const [laserLength, setLaserLength] = useState(0);
    const laserTargetRef = useRef<THREE.Vector3 | null>(null);
    const ifHoleStartedRef = useRef(false); // ifHoleアニメーション開始フラグ

    // 前回のコマンドインデックスを追跡
    const prevCommandIndexRef = useRef(-1);

    const tileSize = 0.5;
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2;

    // targetPosition の useMemo (リセット対応済み)
    const targetPosition = React.useMemo(() => {
        // リセット時（currentCommandIndex === -1）は落下状態をクリア
        if (currentCommandIndex === -1) {
            isImmobilizedRef.current = false;
            immobilizedPositionRef.current = null;
            setFallProgress(0);
            setIsVisible(true);
        }

        // 落下状態が確定しているかチェック
        if (isImmobilizedRef.current && immobilizedPositionRef.current) {
            const currentLayer = robotState.z >= 0 && robotState.z < maze.layers.length ? maze.layers[robotState.z] : null;
            const currentTile = currentLayer?.[robotState.y]?.[robotState.x];

            if (currentTile === "start" || currentCommandIndex === -1) {
                isImmobilizedRef.current = false;
                immobilizedPositionRef.current = null;
                setFallProgress(0);
                setIsVisible(true);
            } else {
                return immobilizedPositionRef.current;
            }
        }

        return new THREE.Vector3(
            robotState.x * tileSize + gridOffset,
            0.05,
            robotState.y * tileSize + gridOffset
        );
    }, [robotState.x, robotState.y, tileSize, gridOffset, maze, currentCommandIndex, robotState.z]);

    // targetQuaternion の計算
    const targetQuaternion = React.useMemo(
        () =>
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    0,
                    Math.atan2(
                        robotState.direction[0],
                        robotState.direction[1]
                    ) - Math.PI / 2,
                    0
                )
            ),
        [robotState.direction]
    );

    // テレポート検出用のuseEffect
    useEffect(() => {
        if (
            robotState.z !== prevZRef.current &&
            !isTeleporting &&
            currentCommandIndex !== -1
        ) {
            setIsTeleporting(true);
            setTeleportPhase(1);
            teleportStartTimeRef.current = performance.now();
            teleportPositionSnapshotRef.current = targetPosition.clone();
        }
        prevZRef.current = robotState.z;
    }, [robotState.z, isTeleporting, currentCommandIndex, targetPosition]);

    // アニメーション状態管理のuseEffect
    useEffect(() => {
        // リセット判定 - コマンドが実行されていない時のみ
        // 注意: robotTile === "start" でもコマンド実行中はアニメーションを続行する必要がある
        if (currentCommandIndex === -1) {
            isImmobilizedRef.current = false;
            immobilizedPositionRef.current = null;
            setCurrentAnimation('idle');
            setFallProgress(0);
            setIsVisible(true);
            setLaserActive(false);
            fallStartedRef.current = false;
            ifHoleStartedRef.current = false;
            prevCommandIndexRef.current = -1; // 次の実行のためにリセット
            return;
        }

        // 穴の上にいる場合 - 穴待機状態に設定（実際の落下はuseFrameで移動完了後に開始）
        if (robotTile === "hole") {
            if (!isImmobilizedRef.current) {
                isImmobilizedRef.current = true;
                immobilizedPositionRef.current = new THREE.Vector3(
                    robotState.x * tileSize + gridOffset,
                    0.05,
                    robotState.y * tileSize + gridOffset
                );
                // 落下開始フラグは立てるが、アニメーション開始はuseFrameで移動完了後
                setCurrentAnimation('fall');
                // animationStartTimeRefはuseFrameで設定する
            }
            return;
        }

        // コマンドが変わった時のみアニメーション開始
        if (currentCommandIndex !== prevCommandIndexRef.current &&
            currentCommandIndex >= 0 &&
            currentCommandIndex < flattenedCommands.length) {

            prevCommandIndexRef.current = currentCommandIndex;
            const command = flattenedCommands[currentCommandIndex];

            if (command.type === "turnRight") {
                setCurrentAnimation('turnRight');
                animationStartTimeRef.current = performance.now();
            } else if (command.type === "turnLeft") {
                setCurrentAnimation('turnLeft');
                animationStartTimeRef.current = performance.now();
            } else if (command.type === "ifHole") {
                setCurrentAnimation('ifHole');
                animationStartTimeRef.current = performance.now();
                setLaserActive(true);
                setLaserLength(0);
                ifHoleStartedRef.current = true;
                // レーザーのターゲット位置を計算（ロボットの前方）
                const targetX = robotState.x + robotState.direction[0];
                const targetY = robotState.y + robotState.direction[1];
                laserTargetRef.current = new THREE.Vector3(
                    targetX * tileSize + gridOffset,
                    0.02,
                    targetY * tileSize + gridOffset
                );
            } else {
                setCurrentAnimation('idle');
                setLaserActive(false);
            }
        }
    }, [
        currentCommandIndex,
        flattenedCommands,
        robotTile,
        robotState,
        tileSize,
        gridOffset
    ]);

    // useFrame - 移動・アニメーション処理
    useFrame((_, delta) => {
        if (!modelRef.current) return;

        const elapsed = performance.now() - animationStartTimeRef.current;

        // 落下アニメーション（ブラックホールに吸収される）
        if (currentAnimation === 'fall') {
            // まず穴の位置まで移動を完了させる
            if (!fallStartedRef.current && immobilizedPositionRef.current) {
                const distance = modelRef.current.position.distanceTo(immobilizedPositionRef.current);

                if (distance > 0.02) {
                    // まだ移動中 - 穴の位置へ移動
                    const moveSpeed = 0.8;
                    const maxMove = moveSpeed * delta;
                    const moveAmount = Math.min(distance, maxMove);
                    const direction = new THREE.Vector3()
                        .subVectors(immobilizedPositionRef.current, modelRef.current.position)
                        .normalize();
                    modelRef.current.position.add(direction.multiplyScalar(moveAmount));
                    modelRef.current.quaternion.slerp(targetQuaternion, delta * 8.0);
                    return;
                } else {
                    // 移動完了 - 落下アニメーション開始
                    modelRef.current.position.copy(immobilizedPositionRef.current);
                    fallStartedRef.current = true;
                    animationStartTimeRef.current = performance.now();
                    setFallProgress(0);
                    return;
                }
            }

            // 落下アニメーション実行
            if (fallStartedRef.current) {
                const fallDuration = 1000; // 1秒
                const progress = Math.min(elapsed / fallDuration, 1);
                setFallProgress(progress);

                // 縮小しながら下に落ちる
                const scale = Math.max(0.01, 1.0 - progress * 0.95);
                modelRef.current.scale.setScalar(0.12 * scale);

                // Y座標を下げる
                const yOffset = -progress * 0.2;
                modelRef.current.position.y = 0.05 + yOffset;

                // 回転させる（渦巻きのように）
                modelRef.current.rotation.y += delta * 24 * progress;

                // 透明度を下げる
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

                // 完全に消滅
                if (progress >= 1) {
                    setIsVisible(false);
                }
            }
            return;
        }

        // ifHoleレーザーアニメーション
        if (ifHoleStartedRef.current && laserActive) {
            const laserDuration = 1200; // 1.2秒
            const progress = Math.min(elapsed / laserDuration, 1);

            // レーザーの長さを伸ばす
            setLaserLength(progress);

            if (progress >= 1) {
                setLaserActive(false);
                setCurrentAnimation('idle');
                ifHoleStartedRef.current = false;
            }
        }

        // テレポートアニメーション
        if (isTeleporting) {
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
                    }
                    break;
                }
                case 3: {
                    const snapPosition = teleportPositionSnapshotRef.current || targetPosition;
                    modelRef.current.position.copy(snapPosition);
                    modelRef.current.position.y = snapPosition.y + teleportYOffsetRef.current;
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
                        setIsTeleporting(false);
                        setTeleportPhase(0);
                        teleportYOffsetRef.current = 0;
                        teleportOpacityRef.current = 1.0;
                        teleportPositionSnapshotRef.current = null;

                        const finalX = robotState.x * tileSize + gridOffset;
                        const finalY = 0.05;
                        const finalZ = robotState.y * tileSize + gridOffset;
                        modelRef.current.position.set(finalX, finalY, finalZ);

                        justFinishedTeleportRef.current = true;
                        teleportFinishTimeRef.current = performance.now();

                        modelRef.current.traverse((child) => {
                            if (child instanceof THREE.Mesh && child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        mat.opacity = 1.0;
                                        mat.transparent = false;
                                    });
                                } else {
                                    child.material.opacity = 1.0;
                                    child.material.transparent = false;
                                }
                            }
                        });
                    }
                    break;
                }
            }

            // y座標オフセットを適用
            const basePosition = teleportPositionSnapshotRef.current || targetPosition;
            if (teleportPhase !== 3) {
                modelRef.current.position.copy(basePosition);
                modelRef.current.position.y = basePosition.y + teleportYOffsetRef.current;
            }

            // 不透明度を適用
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

        } else if (!isImmobilizedRef.current) {
            // 通常の移動処理（落下中でない場合）
            const moveSpeed = 0.8;
            const distance = modelRef.current.position.distanceTo(targetPosition);

            if (justFinishedTeleportRef.current) {
                const timeSinceTeleport = performance.now() - teleportFinishTimeRef.current;
                if (timeSinceTeleport > 1500) {
                    justFinishedTeleportRef.current = false;
                }
            }

            const shouldInstantMove =
                currentCommandIndex === -1 ||
                ((distance > 0.75) && !justFinishedTeleportRef.current);

            if (shouldInstantMove) {
                modelRef.current.position.copy(targetPosition);
                modelRef.current.quaternion.copy(targetQuaternion);
                // リセット時はスケールと透明度も戻す
                if (currentCommandIndex === -1) {
                    modelRef.current.scale.setScalar(0.12);
                    setIsVisible(true);
                    setFallProgress(0);
                    modelRef.current.traverse((child) => {
                        if (child instanceof THREE.Mesh && child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    mat.opacity = 1.0;
                                    mat.transparent = false;
                                });
                            } else {
                                child.material.opacity = 1.0;
                                child.material.transparent = false;
                            }
                        }
                    });
                }
            } else {
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
            }
        }
    });

    if (!isVisible) {
        // 完全に消滅した場合はロボットを非表示
        return null;
    }

    return (
        <group>
            <primitive ref={modelRef} object={scene} scale={0.12} castShadow />

            {/* 前方マスの発光効果（ifHoleアニメーション中） */}
            {laserActive && laserLength > 0 && (
                <>
                    {/* 前方マスを照らすメインライト */}
                    <pointLight
                        position={[
                            (robotState.x + robotState.direction[0]) * tileSize + gridOffset,
                            0.3 + laserLength * 0.2,
                            (robotState.y + robotState.direction[1]) * tileSize + gridOffset
                        ]}
                        color="#00aaff"
                        intensity={laserLength * 30}
                        distance={3.0}
                    />
                    {/* 発光エフェクト（前方マスの上に球 - 大きく目立つ） */}
                    <mesh
                        position={[
                            (robotState.x + robotState.direction[0]) * tileSize + gridOffset,
                            0.1 + laserLength * 0.15,
                            (robotState.y + robotState.direction[1]) * tileSize + gridOffset
                        ]}
                    >
                        <sphereGeometry args={[0.05 + laserLength * 0.12, 24, 24]} />
                        <meshBasicMaterial
                            color="#00ccff"
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                    {/* 球のグロー効果 */}
                    <mesh
                        position={[
                            (robotState.x + robotState.direction[0]) * tileSize + gridOffset,
                            0.1 + laserLength * 0.15,
                            (robotState.y + robotState.direction[1]) * tileSize + gridOffset
                        ]}
                    >
                        <sphereGeometry args={[0.08 + laserLength * 0.18, 24, 24]} />
                        <meshBasicMaterial
                            color="#0088ff"
                            transparent
                            opacity={laserLength * 0.5}
                        />
                    </mesh>
                    {/* 地面に広がる円形の発光 */}
                    <mesh
                        position={[
                            (robotState.x + robotState.direction[0]) * tileSize + gridOffset,
                            0.015,
                            (robotState.y + robotState.direction[1]) * tileSize + gridOffset
                        ]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <circleGeometry args={[0.1 + laserLength * 0.15, 32]} />
                        <meshBasicMaterial
                            color="#00aaff"
                            transparent
                            opacity={laserLength * 0.8}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
}
