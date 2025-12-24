"use client";

import React, {
    useEffect,
    useRef,
    useState,
    Suspense,
    // useCallback を削除
} from "react";
import { Canvas, useFrame /* useThree を削除 */ } from "@react-three/fiber";
import {
    useGLTF,
    Html,
    useAnimations,
    Preload,
    OrbitControls,
    Text3D,
    Center,
} from "@react-three/drei";
import * as THREE from "three";
import type { MazeData, TileType } from "@entities/maze";
import type { RobotState, Command } from "@entities/robot";
// 1. jsQR をインポート
import jsQR from "jsqr";
import { isMazeQRCode, decodeMazeFromQR } from "@features/maze-serialization";

// 2. AR.js 関連の型定義を削除

interface MazeView3DProps {
    maze: MazeData;
    robotState: RobotState;
    onMarkerDetected: (command: Command) => void;
    detectedCommandName: string | null;
    currentCommandIndex: number;
    flattenedCommands: Command[];
}

// 3. ARController コンポーネント をすべて削除

// 4. QRコードのデコード関数 (デモコードから流用)
// コンポーネントの外に定義
const scanQRCodeWithJsQR = (imageData: ImageData): string | null => {
    if (!jsQR) {
        console.warn("jsQR library not available");
        return null;
    }
    try {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        if (code && code.data) {
            return code.data;
        }
    } catch (error) {
        console.error("QR code scan error:", error);
    }
    return null;
};

// 5. QRコードの文字列とコマンドのマッピングを定義
// コンポーネントの外に定義
const qrCodeToCommand: { [key: string]: Command } = {
    forward: { type: "forward" },
    turnRight: { type: "turnRight" },
    turnLeft: { type: "turnLeft" },
    ifHole: { type: "ifHole" },
    loop: { type: "loop" },
};

// テレポートタイル用コンポーネント
function TeleportTile({
    position,
    isUp,
    tileSize,
    opacity = 1.0
}: {
    position: [number, number, number];
    isUp: boolean;
    tileSize: number;
    opacity?: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const arrowRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // 発光の脈動アニメーション（より強調）
            const intensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.4;
            const material = meshRef.current.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = intensity;
        }

        if (arrowRef.current) {
            // 矢印の上下アニメーション（振幅を増やす）
            const bounceAmount = Math.sin(state.clock.elapsedTime * 3) * 0.05;
            arrowRef.current.position.y = 0.08 + bounceAmount;

            // 矢印の回転アニメーション（立体的な動き）
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
                <mesh
                    rotation={[arrowRotation, 0, 0]}
                >
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

// 鍵タイル用コンポーネント
function KeyTile({
    position,
    tileSize,
    opacity = 1.0,
    isCollected = false
}: {
    position: [number, number, number];
    tileSize: number;
    opacity?: number;
    isCollected?: boolean;
}) {
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
                {/* 鍵の持ち手 (リング) - 太くする */}
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

                {/* 鍵の軸 (シリンダー) - 太くする */}
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

                {/* 鍵の歯 (ボックス) - 太く大きくする */}
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

// MazeMap コンポーネント
function MazeMap({
    grid,
    mazeSize,
    opacity = 1.0,
    layerOffset = 0
}: {
    grid: TileType[][];
    mazeSize: number;
    opacity?: number;
    layerOffset?: number;
}) {
    const tileSize = 0.5;
    const wallHeight = 0.5;
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2;
    return (
        <group>
            {grid.map((row, y) =>
                row.map((tile, x) => {
                    const position: [number, number, number] = [
                        x * tileSize + gridOffset,
                        0,
                        y * tileSize + gridOffset,
                    ];
                    switch (tile) {
                        case "wall":
                            return (
                                <mesh
                                    key={`${x}-${y}`}
                                    castShadow
                                    receiveShadow
                                    position={[
                                        position[0],
                                        wallHeight / 2,
                                        position[2],
                                    ]}
                                >
                                    <boxGeometry
                                        args={[tileSize, wallHeight, tileSize]}
                                    />
                                    <meshStandardMaterial
                                        color="#4a90e2"
                                        opacity={0.85 * opacity}
                                        transparent
                                    />
                                </mesh>
                            );
                        case "hole":
                            return (
                                <mesh
                                    key={`${x}-${y}`}
                                    receiveShadow
                                    position={[position[0], -0.01, position[2]]}
                                    rotation={[-Math.PI / 2, 0, 0]}
                                >
                                    <planeGeometry
                                        args={[tileSize * 0.9, tileSize * 0.9]}
                                    />
                                    <meshStandardMaterial
                                        color="#8b5cf6"
                                        transparent
                                        opacity={0.6 * opacity}
                                        side={THREE.DoubleSide}
                                    />
                                </mesh>
                            );
                        case "teleportUp":
                        case "teleportDown":
                            return (
                                <TeleportTile
                                    key={`${x}-${y}`}
                                    position={position}
                                    isUp={tile === "teleportUp"}
                                    tileSize={tileSize}
                                    opacity={opacity}
                                />
                            );
                        case "key":
                            return (
                                <group key={`${x}-${y}`}>
                                    {/* 下に床を敷く */}
                                    <mesh
                                        receiveShadow
                                        position={position}
                                        rotation={[-Math.PI / 2, 0, 0]}
                                    >
                                        <planeGeometry
                                            args={[tileSize * 0.98, tileSize * 0.98]}
                                        />
                                        <meshStandardMaterial
                                            color="#1a2540"
                                            opacity={0.75 * opacity}
                                            transparent
                                            side={THREE.DoubleSide}
                                        />
                                    </mesh>
                                    <KeyTile
                                        position={position}
                                        tileSize={tileSize}
                                        opacity={opacity}
                                    />
                                </group>
                            );
                        case "start":
                        case "goal":
                        case "floor":
                            return (
                                <mesh
                                    key={`${x}-${y}`}
                                    receiveShadow
                                    position={position}
                                    rotation={[-Math.PI / 2, 0, 0]}
                                >
                                    <planeGeometry
                                        args={[tileSize * 0.98, tileSize * 0.98]}
                                    />
                                    <meshStandardMaterial
                                        color={
                                            tile === "start"
                                                ? "#4ade80"
                                                : tile === "goal"
                                                    ? "#ef4444"
                                                    : "#1a2540"
                                        }
                                        opacity={0.75 * opacity}
                                        transparent
                                        side={THREE.DoubleSide}
                                    />
                                </mesh>
                            );
                        default:
                            return null;
                    }
                })
            )}
        </group>
    );
}

// RobotModel コンポーネント
function RobotModel({
    robotState,
    mazeSize,
    currentCommandIndex,
    flattenedCommands,
    robotTile, // 現在のタイル
    maze,
}: {
    robotState: RobotState;
    mazeSize: number;
    currentCommandIndex: number;
    flattenedCommands: Command[];
    robotTile: TileType;
    maze: MazeData;
}) {
    const { scene, animations } = useGLTF("/robot.gltf");
    const { actions, names, mixer } = useAnimations(animations, scene);
    const modelRef = useRef<THREE.Group>(null!);

    // 現在再生中のアニメーション名を保持する Ref
    const currentActionRef = useRef<string | null>(null);

    // 落下状態（=移動不能）かどうか
    const isImmobilizedRef = useRef<boolean>(false);
    // 落下（移動不能）になった瞬間の座標を保持
    const immobilizedPositionRef = useRef<THREE.Vector3 | null>(null);

    // ★ テレポートアニメーション用の状態管理
    const [isTeleporting, setIsTeleporting] = useState(false);
    const [teleportPhase, setTeleportPhase] = useState(0); // 0-5
    const [teleportDirection, setTeleportDirection] = useState<'up' | 'down'>('up');

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
                isImmobilizedRef.current = false; // 落下状態を解除
                immobilizedPositionRef.current = null;
            } else {
                // リセットではない
                // 落下した位置を維持する
                return immobilizedPositionRef.current;
            }
        }

        // 落下していない、またはリセットされた場合：
        // 親の robotState に追従する
        return new THREE.Vector3(
            robotState.x * tileSize + gridOffset,
            0.05,
            robotState.y * tileSize + gridOffset
        );

    }, [robotState.x, robotState.y, tileSize, gridOffset, maze]);

    // targetQuaternion の計算 (変更なし)
    const targetQuaternion = React.useMemo(
        () =>
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    0,
                    Math.atan2(
                        robotState.direction[0], // x
                        robotState.direction[1]  // z
                    ) - Math.PI / 2, // 90度のオフセット補正
                    0
                )
            ),
        [robotState.direction]
    );

    // ★ テレポート検出用のuseEffect
    useEffect(() => {
        // z座標の変化を検出
        // 以下の場合はテレポートアニメーションをスキップ:
        // 1. リセット時（currentCommandIndex === -1）
        // 2. スタート位置への移動（robotState.z === 0）
        if (
            robotState.z !== prevZRef.current &&
            !isTeleporting &&
            currentCommandIndex !== -1  // リセット時はスキップ
        ) {
            // テレポート開始
            const direction = robotState.z > prevZRef.current ? 'up' : 'down';
            setIsTeleporting(true);
            setTeleportPhase(1);
            setTeleportDirection(direction);
            teleportStartTimeRef.current = performance.now();
            // テレポート開始時の位置をスナップショットとして保存
            teleportPositionSnapshotRef.current = targetPosition.clone();
        }
        prevZRef.current = robotState.z;
    }, [robotState.z, isTeleporting, currentCommandIndex, targetPosition]);


    // useEffect のロジック
    useEffect(() => {

        const fallActionName = names.find(name => name.toLowerCase() === "fall");

        // --- 0. リセット判定 (最優先) ---
        if (robotTile === "start") {
            isImmobilizedRef.current = false;
            immobilizedPositionRef.current = null;
        }

        let actionName: string | undefined = undefined;

        // --- 1a. (コマンド予測) "forward" で穴に向かうか？ ---
        if (
            currentCommandIndex >= 0 &&
            // ★ TypeError 修正
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

            // 穴に向かう場合
            if (nextTile === "hole") {
                isImmobilizedRef.current = true; // 落下状態にする
                // 落下開始時の座標 (移動 *前* の座標) を保存
                immobilizedPositionRef.current = new THREE.Vector3(
                    robotState.x * tileSize + gridOffset,
                    0.05,
                    robotState.y * tileSize + gridOffset
                );

                actionName = fallActionName;
            }
        }

        // --- 1b. (現状確認) *今* 穴の上にいるか？ ---
        if (robotTile === "hole") {
            if (!isImmobilizedRef.current) { // 穴の上でスタート/リセットされた場合
                isImmobilizedRef.current = true;
                // 穴の座標を保存
                immobilizedPositionRef.current = new THREE.Vector3(
                    robotState.x * tileSize + gridOffset,
                    0.05,
                    robotState.y * tileSize + gridOffset
                );
            }

            actionName = fallActionName; // 穴の上にいる限り fall
        }

        // --- 2. 落下も穴の上でもない場合の処理 ---
        if (!isImmobilizedRef.current) {

            // 2a. コマンドインデックスが無効 (実行終了/停止/リセット)
            if (currentCommandIndex < 0) {
                actionName = undefined; // アニメーション停止
            }
            // 2b. コマンドインデックスが有効
            else {
                // ★ TypeError 修正
                if (currentCommandIndex < flattenedCommands.length) {
                    const command = flattenedCommands[currentCommandIndex];

                    if (command.type === "forward") {
                        actionName = undefined; // アニメーションを無効化し、コードで移動制御
                    } else if (command.type === "turnRight") {
                        actionName = "TurnRight";
                    } else if (command.type === "turnLeft") {
                        actionName = "TurnLeft";
                    } else if (command.type === "ifHole") {
                        actionName = "ifHole";
                    } else {
                        actionName = undefined; // loop など
                    }
                } else {
                    actionName = undefined;
                }
            }
        }

        // --- 3. 決定されたアニメーションを再生 ---
        currentActionRef.current = actionName || null;
        const activeAction = actionName ? actions[actionName] : null;

        if (activeAction) {
            names.forEach((name) => {
                if (name !== actionName && actions[name]?.isRunning()) {
                    actions[name]?.fadeOut(0.2);
                }
            });
            // 既に再生中でなければリセットして再生
            if (!activeAction.isRunning()) {
                activeAction.reset().setLoop(THREE.LoopOnce, 1).clampWhenFinished =
                    true;
                activeAction.fadeIn(0.2).play();
            }
        } else {
            // --- ★ 修正点: アニメーション停止ロジック ---
            // 対応するアクションがない場合 (リセット時など)
            names.forEach((name) => {
                // isRunning() のチェックを外す
                // (clampWhenFinished=true で停止中の "fall" も fadeOut させるため)
                actions[name]?.fadeOut(0.2);
            });
            // --- ★ 修正点 終了 ---
        }

        // (依存配列は前回の修正のまま)
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


    // useFrame
    useFrame((_, delta) => {
        if (modelRef.current) {
            // ★ テレポートアニメーション処理
            if (isTeleporting) {
                const elapsed = performance.now() - teleportStartTimeRef.current;

                switch (teleportPhase) {
                    case 1: // 上昇（共通）
                        const phase1Duration = 300;
                        const phase1Progress = Math.min(elapsed / phase1Duration, 1);

                        // 方向に関わらず上昇させる
                        teleportYOffsetRef.current = 0.3 * phase1Progress;

                        if (phase1Progress >= 1) {
                            setTeleportPhase(2);
                            teleportStartTimeRef.current = performance.now();
                        }
                        break;

                    case 2: // フェードアウト
                        const phase2Duration = 200;
                        const phase2Progress = Math.min(elapsed / phase2Duration, 1);

                        teleportOpacityRef.current = 1.0 - phase2Progress;

                        if (phase2Progress >= 1) {
                            setTeleportPhase(3);
                        }
                        break;

                    case 3: // 層移動（瞬間）
                        // スナップショット位置を使用（次のコマンドによるtargetPosition更新を回避）
                        const snapPosition = teleportPositionSnapshotRef.current || targetPosition;
                        modelRef.current.position.copy(snapPosition);
                        modelRef.current.position.y = snapPosition.y + teleportYOffsetRef.current;

                        setTeleportPhase(4);
                        teleportStartTimeRef.current = performance.now();
                        break;

                    case 4: // フェードイン
                        const phase4Duration = 200;
                        const phase4Progress = Math.min(elapsed / phase4Duration, 1);

                        teleportOpacityRef.current = phase4Progress;

                        if (phase4Progress >= 1) {
                            setTeleportPhase(5);
                            teleportStartTimeRef.current = performance.now();
                        }
                        break;

                    case 5: // 降下（元の高さに戻る）（共通）
                        const phase5Duration = 300;
                        const phase5Progress = Math.min(elapsed / phase5Duration, 1);

                        // 方向に関わらず降下させる
                        teleportYOffsetRef.current = 0.3 * (1 - phase5Progress);

                        if (phase5Progress >= 1) {
                            setIsTeleporting(false);
                            setTeleportPhase(0);
                            teleportYOffsetRef.current = 0;
                            teleportOpacityRef.current = 1.0;
                            teleportPositionSnapshotRef.current = null; // スナップショットをクリア

                            // 位置をrobotStateから直接計算して設定
                            const finalX = robotState.x * tileSize + gridOffset;
                            const finalY = 0.05;
                            const finalZ = robotState.y * tileSize + gridOffset;
                            modelRef.current.position.set(finalX, finalY, finalZ);

                            // テレポート完了直後フラグを設定
                            justFinishedTeleportRef.current = true;
                            teleportFinishTimeRef.current = performance.now();

                            // マテリアルの不透明度をリセット
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

                // y座標オフセットを適用
                // アニメーション中はスナップショット位置を使用
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

                // 回転は常に適用
                modelRef.current.quaternion.slerp(targetQuaternion, delta * 8.0);

            } else {
                // ★ 通常の移動処理（既存のロジック）
                // ★ 修正: 一定速度で移動（アニメーション非依存）
                const moveSpeed = 0.8;
                const rotateSpeed = 4.0;

                // 目標位置との距離を計算
                const distance = modelRef.current.position.distanceTo(targetPosition);

                // テレポート完了直後（1500ms以内）は瞬間移動をスキップ
                if (justFinishedTeleportRef.current) {
                    const timeSinceTeleport = performance.now() - teleportFinishTimeRef.current;
                    if (timeSinceTeleport > 1500) {
                        justFinishedTeleportRef.current = false;
                    }
                }

                // ★ リセット検出: 距離が1マス（0.75）以上離れている場合のみ瞬間移動
                // currentCommandIndex === -1 (停止中) でも、距離が近ければ滑らかに移動させる
                if ((distance > 0.75) && !justFinishedTeleportRef.current) {
                    // リセットなど大きな移動 → 瞬間移動
                    modelRef.current.position.copy(targetPosition);
                    modelRef.current.quaternion.copy(targetQuaternion);
                } else {
                    // ★ 位置の移動（距離がある場合のみ）
                    if (distance > 0.01) {
                        // 通常の移動: 一定速度で移動
                        const maxMove = moveSpeed * delta;
                        const moveAmount = Math.min(distance, maxMove);

                        // 目標位置に向かって移動
                        const direction = new THREE.Vector3()
                            .subVectors(targetPosition, modelRef.current.position)
                            .normalize();
                        modelRef.current.position.add(direction.multiplyScalar(moveAmount));
                    } else {
                        // 到達したら正確に目標位置に設定
                        modelRef.current.position.copy(targetPosition);
                    }

                    // ★ 回転処理（位置の移動とは独立）
                    // 常に目標の回転に向かって補間
                    modelRef.current.quaternion.slerp(targetQuaternion, delta * 8.0);
                }
            }
        }
        if (mixer) mixer.update(delta);
    });

    return <primitive ref={modelRef} object={scene} scale={0.12} castShadow />;
}

export function MazeView3D({
    maze,
    robotState,
    onMarkerDetected,
    detectedCommandName,
    currentCommandIndex,
    flattenedCommands,
}: MazeView3DProps) {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // デバウンス（クールダウン）中かどうかを示すフラグRef
    const isCoolingDownRef = useRef<boolean>(false);

    const [isStreamReady, setIsStreamReady] = useState<boolean>(false);
    
    // ★ 表示用のZ座標 (テレポート演出用に遅延させる)
    const [renderingZ, setRenderingZ] = useState(robotState.z);

    useEffect(() => {
        if (robotState.z === renderingZ) return;

        // リセット時や初期化時は即時更新
        if (currentCommandIndex === -1) {
            setRenderingZ(robotState.z);
            return;
        }

        // テレポート時は遅延更新 (アニメーションのフェーズ3に合わせて500ms)
        const timer = setTimeout(() => {
            setRenderingZ(robotState.z);
        }, 500);

        return () => clearTimeout(timer);
    }, [robotState.z, renderingZ, currentCommandIndex]);
    const [debugInfo, setDebugInfo] = useState<string>("");

    // デバッグ情報表示 (変更なし)
    useEffect(() => {
        const interval = setInterval(() => {
            const video = videoElementRef.current;
            if (video && video.videoWidth > 0) {
                setDebugInfo(
                    `Video: ${video.videoWidth}x${video.videoHeight} | Ready: ${isStreamReady} | ReadyState: ${video.readyState}`
                );
            } else {
                setDebugInfo(`Video: Not ready | Ready: ${isStreamReady}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isStreamReady]);

    // カメラ起動ロジック (変更なし)
    useEffect(() => {
        const video = videoElementRef.current;
        if (!video) return;

        let stream: MediaStream | null = null;

        const startWebcam = async () => {
            try {
                console.log("📹 Starting webcam...");
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: "environment",
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                    },
                });
                video.srcObject = stream;
                console.log("✅ Webcam stream attached.");

                video.onloadedmetadata = () => {
                    console.log("✅ Video metadata loaded.");
                    video
                        .play()
                        .then(() => {
                            console.log("✅ Video playback started.");
                        })
                        .catch((err) => {
                            console.error("❌ Video play failed:", err);
                        });
                };

                video.onplaying = () => {
                    console.log("✅ Video stream is now playing.");
                    if (video.readyState >= 2) {
                        setIsStreamReady(true);
                    }
                };

                video.oncanplay = () => {
                    console.log("✅ Video can play (readyState >= 2).");
                    setIsStreamReady(true);
                };
            } catch (err) {
                console.error("❌ Failed to get webcam stream:", err);
                const errorMessage =
                    err instanceof Error ? err.message : String(err);
                alert(`カメラの起動に失敗: ${errorMessage}`);
            }
        };

        startWebcam();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                console.log("🛑 Webcam stream stopped.");
            }
            if (video && video.srcObject) {
                video.srcObject = null;
                video.onplaying = null;
                video.oncanplay = null;
            }
            setIsStreamReady(false);
        };
    }, []);

    // QRコードスキャン用の新しい useEffect
    useEffect(() => {
        if (
            !isStreamReady ||
            !videoElementRef.current ||
            !scanCanvasRef.current
        ) {
            return;
        }

        let scanInterval: number | null = null;

        const video = videoElementRef.current;
        const canvas = scanCanvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("Failed to get 2D context for scanning");
            return;
        }

        console.log("🚀 Starting QR scanner loop...");

        const scanLoop = () => {
            // スキャンループのタイミングを調整 (200ms -> 300ms)
            scanInterval = window.setTimeout(scanLoop, 300);

            if (video.readyState < 2) {
                return;
            }

            try {
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                if (videoWidth === 0 || videoHeight === 0) {
                    return;
                }

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const qrCodeData = scanQRCodeWithJsQR(imageData);

                try {
                    if (qrCodeData) {
                        // ★ 迷路QRコードのチェック
                        if (isMazeQRCode(qrCodeData)) {
                            const maze = decodeMazeFromQR(qrCodeData);
                            if (maze) {
                                const stored = localStorage.getItem("progpath_mazes");
                                const mazes: MazeData[] = stored ? JSON.parse(stored) : [];

                                if (!mazes.find(m => m.id === maze.id)) {
                                    mazes.push(maze);
                                    localStorage.setItem("progpath_mazes", JSON.stringify(mazes));
                                    console.log("✅ 迷路をインポート:", maze.name);
                                }
                            }
                        } else {
                            // コマンドQRコード
                            const command = qrCodeToCommand[qrCodeData];

                            // クールダウン中でない場合のみコマンドを処理
                            if (command && !isCoolingDownRef.current) {

                                // 検出を処理
                                console.log(
                                    `🎯 QR Code detected: ${qrCodeData}`,
                                    command
                                );
                                onMarkerDetected(command);

                                // クールダウンを開始
                                isCoolingDownRef.current = true;

                                // 1.5秒後にクールダウンを解除
                                setTimeout(() => {
                                    isCoolingDownRef.current = false;
                                }, 1500);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error in scan loop:", e);
                }
            } catch (err) {
                console.error("Error drawing video to canvas:", err);
            }
        };

        scanLoop();

        return () => {
            console.log("🛑 Stopping QR scanner loop...");
            if (scanInterval) {
                clearTimeout(scanInterval);
            }
            // コンポーネントがアンマウントされてもタイマーが残らないように
            isCoolingDownRef.current = false;
        };
    }, [isStreamReady, onMarkerDetected]);

    // --- 現在のタイルを計算 ---
    const currentLayer = renderingZ >= 0 && renderingZ < maze.layers.length ? maze.layers[renderingZ] : null;
    const robotTile =
        currentLayer && currentLayer[robotState.y] && currentLayer[robotState.y][robotState.x]
            ? currentLayer[robotState.y][robotState.x]
            : "floor"; // 範囲外の場合は 'floor' として扱う (安全対策)
    // --- 修正点 終了 ---

    // --- JSX (変更なし) ---
    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-transparent">
            <canvas ref={scanCanvasRef} style={{ display: "none" }} />

            <div className="absolute top-2 left-2 z-10 bg-black/70 px-2 py-1 text-xs text-white rounded">
                {debugInfo} (QR Mode)
            </div>

            {/* 層番号表示 */}
            <div className="absolute top-10 left-2 z-10 bg-black/70 px-3 py-2 rounded border border-neon-cyan/50">
                <div className="text-sm font-bold text-neon-cyan">
                    Layer {renderingZ + 1} / {maze.layers.length}
                </div>
            </div>

            <video
                id="arjs-video"
                ref={videoElementRef}
                autoPlay
                playsInline
                webkit-playsinline="true"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                }}
                muted
            />
            <Canvas
                gl={{ alpha: true, antialias: true }}
                camera={{
                    position: [0, 0, 0],
                    fov: 70,
                    near: 0.1,
                    far: 1000,
                }}
                style={{
                    background: "transparent",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
                shadows
            >
                <ambientLight intensity={1.0} />
                <directionalLight
                    position={[2, 8, 4]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    shadow-camera-far={20}
                    shadow-camera-left={-5}
                    shadow-camera-right={5}
                    shadow-camera-top={5}
                    shadow-camera-bottom={-5}
                />
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -0.02, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[10, 10]} />
                    <shadowMaterial opacity={0.3} />
                </mesh>

                <group
                    position={[0, 0.5, -2.5]}
                    rotation={[Math.PI / 4.5, 0, 0]}
                >
                    <Suspense fallback={null}>
                        {/* 複数層の表示 */}
                        {maze.layers.map((layer, layerIndex) => {
                            // ロボットの現在の層
                            const currentZ = renderingZ;

                            // 透明度を計算（すべての層を表示）
                            let layerOpacity = 1.0;
                            if (layerIndex !== currentZ) {
                                layerOpacity = 0.5; // 現在の層以外は薄く
                            }

                            // 層の高さオフセット（各層を0.8単位で縦に配置）
                            const layerYOffset = (layerIndex - currentZ) * 0.8;

                            return (
                                <group key={`layer-${layerIndex}`} position={[0, layerYOffset, 0]}>
                                    <MazeMap
                                        grid={layer}
                                        mazeSize={maze.size}
                                        opacity={layerOpacity}
                                        layerOffset={0}
                                    />

                                    {/* 層番号の3Dテキスト表示 */}
                                    {/* 層番号の3Dテキスト表示（Text3Dで厚みを追加） */}
                                    <Center
                                        position={[-(maze.size * 0.5) / 2 - 0.8, 0.5, 0]}
                                        rotation={[0, Math.PI / 4, 0]}
                                    >
                                        <Text3D
                                            font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
                                            size={0.5}
                                            height={0.02} // 薄く
                                            curveSegments={12}
                                            bevelEnabled
                                            bevelThickness={0.01}
                                            bevelSize={0.01}
                                            bevelOffset={0}
                                            bevelSegments={5}
                                        >
                                            {layerIndex + 1}F
                                            <meshStandardMaterial color="#E0FFFF" emissive="#E0FFFF" emissiveIntensity={2.0} toneMapped={false} />
                                            <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={1.5} toneMapped={false} />
                                        </Text3D>
                                    </Center>

                                </group>
                            );
                        })}

                        <RobotModel
                            robotState={robotState}
                            mazeSize={maze.size}
                            currentCommandIndex={currentCommandIndex}
                            flattenedCommands={flattenedCommands}
                            robotTile={robotTile}
                            maze={maze}
                        />
                        <Preload all />
                    </Suspense>
                </group>

                {detectedCommandName && (
                    <Html center position={[0, 0.7 + 0.6, -1.5]}>
                        <div
                            className="select-none rounded bg-black/60 px-3 py-1 text-xl font-bold text-neon-cyan shadow-lg backdrop-blur-sm"
                            style={{ textShadow: "0 0 8px #0ff" }}
                        >
                            {detectedCommandName.toUpperCase()}
                        </div>
                    </Html>
                )}

                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    target={new THREE.Vector3(0, 0.7, -1.8)}
                />
            </Canvas>
        </div>
    );
}