"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import type { RobotState, Command } from "@entities/robot";
import type { MazeData, TileType } from "@entities/maze";

interface RobotModelProps {
    robotState: RobotState;
    mazeSize: number;
    currentCommandIndex: number;
    flattenedCommands: Command[];
    robotTile: TileType;
    maze: MazeData;
}

/**
 * ロボット3Dモデルコンポーネント
 * アニメーション（移動、回転、テレポート、落下）を含む
 */
export function RobotModel({
    robotState,
    mazeSize,
    currentCommandIndex,
    flattenedCommands,
    robotTile,
    maze,
}: RobotModelProps) {
    const { scene, animations } = useGLTF("/robot.gltf");
    const { actions, names, mixer } = useAnimations(animations, scene);
    const modelRef = useRef<THREE.Group>(null!);



    // 落下状態（=移動不能）かどうか
    const isImmobilizedRef = useRef<boolean>(false);
    // 落下（移動不能）になった瞬間の座標を保持
    const immobilizedPositionRef = useRef<THREE.Vector3 | null>(null);

    // テレポートアニメーション用の状態管理
    const [isTeleporting, setIsTeleporting] = useState(false);
    const [teleportPhase, setTeleportPhase] = useState(0); // 0-5


    // テレポートアニメーション用のタイマーとオフセット
    const teleportStartTimeRef = useRef<number>(0);
    const prevZRef = useRef(robotState.z);
    const teleportYOffsetRef = useRef(0);
    const teleportOpacityRef = useRef(1.0);
    // テレポート開始時の位置を保存（アニメーション中の位置固定用）
    const teleportPositionSnapshotRef = useRef<THREE.Vector3 | null>(null);
    // テレポート完了直後フラグ（瞬間移動を防ぐ）
    const justFinishedTeleportRef = useRef(false);
    const teleportFinishTimeRef = useRef(0);

    const tileSize = 0.5;
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2;

    // targetPosition の useMemo (リセット対応済み)
    const targetPosition = React.useMemo(() => {
        // 落下状態が確定しているかチェック
        if (isImmobilizedRef.current && immobilizedPositionRef.current) {
            // リセット判定ロジック
            const currentLayer = robotState.z >= 0 && robotState.z < maze.layers.length ? maze.layers[robotState.z] : null;
            const currentTile = currentLayer?.[robotState.y]?.[robotState.x];

            if (currentTile === "start") {
                // リセット操作が検知された
                isImmobilizedRef.current = false;
                immobilizedPositionRef.current = null;
            } else {
                // リセットではない - 落下した位置を維持する
                return immobilizedPositionRef.current;
            }
        }

        // 落下していない、またはリセットされた場合
        return new THREE.Vector3(
            robotState.x * tileSize + gridOffset,
            0.05,
            robotState.y * tileSize + gridOffset
        );
    }, [robotState.x, robotState.y, tileSize, gridOffset, maze]);

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

    // アニメーション制御useEffect
    useEffect(() => {
        const fallActionName = names.find(name => name.toLowerCase() === "fall");

        // リセット判定 (最優先)
        if (robotTile === "start") {
            isImmobilizedRef.current = false;
            immobilizedPositionRef.current = null;
        }

        let actionName: string | undefined = undefined;

        // コマンド予測: "forward" で穴に向かうか？
        if (
            currentCommandIndex >= 0 &&
            currentCommandIndex < flattenedCommands.length &&
            flattenedCommands[currentCommandIndex].type === "forward" &&
            !isImmobilizedRef.current
        ) {
            const nextX = robotState.x + robotState.direction[0];
            const nextY = robotState.y + robotState.direction[1];
            let nextTile: TileType = "floor";
            if (nextY >= 0 && nextY < maze.size && nextX >= 0 && nextX < maze.size) {
                const nextLayer = robotState.z >= 0 && robotState.z < maze.layers.length ? maze.layers[robotState.z] : null;
                nextTile = nextLayer?.[nextY]?.[nextX] || "floor";
            }

            if (nextTile === "hole") {
                isImmobilizedRef.current = true;
                immobilizedPositionRef.current = new THREE.Vector3(
                    robotState.x * tileSize + gridOffset,
                    0.05,
                    robotState.y * tileSize + gridOffset
                );
                actionName = fallActionName;
            }
        }

        // 現状確認: 今穴の上にいるか？
        if (robotTile === "hole") {
            if (!isImmobilizedRef.current) {
                isImmobilizedRef.current = true;
                immobilizedPositionRef.current = new THREE.Vector3(
                    robotState.x * tileSize + gridOffset,
                    0.05,
                    robotState.y * tileSize + gridOffset
                );
            }
            actionName = fallActionName;
        }

        // 落下も穴の上でもない場合
        if (!isImmobilizedRef.current) {
            if (currentCommandIndex < 0) {
                actionName = undefined;
            } else if (currentCommandIndex < flattenedCommands.length) {
                const command = flattenedCommands[currentCommandIndex];
                if (command.type === "forward") {
                    actionName = undefined;
                } else if (command.type === "turnRight") {
                    actionName = "TurnRight";
                } else if (command.type === "turnLeft") {
                    actionName = "TurnLeft";
                } else if (command.type === "ifHole") {
                    actionName = "ifHole";
                } else {
                    actionName = undefined;
                }
            }
        }

        // アニメーションを再生
        const activeAction = actionName ? actions[actionName] : null;

        if (activeAction) {
            names.forEach((name) => {
                if (name !== actionName && actions[name]?.isRunning()) {
                    actions[name]?.fadeOut(0.2);
                }
            });
            if (!activeAction.isRunning()) {
                activeAction.reset().setLoop(THREE.LoopOnce, 1).clampWhenFinished = true;
                activeAction.fadeIn(0.2).play();
            }
        } else {
            names.forEach((name) => {
                actions[name]?.fadeOut(0.2);
            });
        }
    }, [
        currentCommandIndex,
        flattenedCommands,
        actions,
        names,
        robotTile,
        maze,
        robotState,
        tileSize,
        gridOffset
    ]);

    // useFrame - 移動・テレポートアニメーション
    useFrame((_, delta) => {
        if (modelRef.current) {
            if (isTeleporting) {
                const elapsed = performance.now() - teleportStartTimeRef.current;

                switch (teleportPhase) {
                    case 1: {
                        const phase1Duration = 300;
                        const phase1Progress = Math.min(elapsed / phase1Duration, 1);
                        teleportYOffsetRef.current = 0.3 * phase1Progress;
                        if (phase1Progress >= 1) {
                            setTeleportPhase(2);
                            teleportStartTimeRef.current = performance.now();
                        }
                        break;
                    }
                    case 2: {
                        const phase2Duration = 200;
                        const phase2Progress = Math.min(elapsed / phase2Duration, 1);
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
                        const phase4Progress = Math.min(elapsed / phase4Duration, 1);
                        teleportOpacityRef.current = phase4Progress;
                        if (phase4Progress >= 1) {
                            setTeleportPhase(5);
                            teleportStartTimeRef.current = performance.now();
                        }
                        break;
                    }
                    case 5: {
                        const phase5Duration = 300;
                        const phase5Progress = Math.min(elapsed / phase5Duration, 1);
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

            } else {
                // 通常の移動処理
                const moveSpeed = 0.8;
                const distance = modelRef.current.position.distanceTo(targetPosition);

                if (justFinishedTeleportRef.current) {
                    const timeSinceTeleport = performance.now() - teleportFinishTimeRef.current;
                    if (timeSinceTeleport > 1500) {
                        justFinishedTeleportRef.current = false;
                    }
                }

                // リセット時（currentCommandIndex === -1）または大きな距離の移動は瞬間移動
                const shouldInstantMove = 
                    currentCommandIndex === -1 || 
                    ((distance > 0.75) && !justFinishedTeleportRef.current);

                if (shouldInstantMove) {
                    modelRef.current.position.copy(targetPosition);
                    modelRef.current.quaternion.copy(targetQuaternion);
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
        }
        if (mixer) mixer.update(delta);
    });

    return <primitive ref={modelRef} object={scene} scale={0.12} castShadow />;
}
