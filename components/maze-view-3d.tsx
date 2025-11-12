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
} from "@react-three/drei";
import * as THREE from "three";
import type { MazeData, RobotState, TileType, Command } from "@/lib/types";
// 1. jsQR をインポート
import jsQR from "jsqr";

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

// MazeMap コンポーネント (変更なし)
function MazeMap({ grid, mazeSize }: { grid: TileType[][]; mazeSize: number }) {
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
                                        opacity={0.85}
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
                                        opacity={0.6}
                                        side={THREE.DoubleSide}
                                    />
                                </mesh>
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
                                        args={[tileSize, tileSize]}
                                    />
                                    <meshStandardMaterial
                                        color={
                                            tile === "start"
                                                ? "#4ade80"
                                                : tile === "goal"
                                                ? "#ef4444"
                                                : "#1a2540"
                                        }
                                        opacity={0.75}
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


    const tileSize = 0.5;
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2;
    
    
    // targetPosition の useMemo (リセット対応済み)
    const targetPosition = React.useMemo(() => {
        
        // 落下状態が確定しているかチェック
        if (isImmobilizedRef.current && immobilizedPositionRef.current) {
            
            // リセット判定ロジック
            const currentTile = maze.grid[robotState.y]?.[robotState.x];
            
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
                nextTile = maze.grid[nextY][nextX];
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
                        actionName = "forward"; // 安全な "forward"
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


    // useFrame (変更なし)
    useFrame((_, delta) => {
        if (modelRef.current) {
            
            modelRef.current.position.lerp(targetPosition, delta * 6);
            modelRef.current.quaternion.slerp(targetQuaternion, delta * 12);
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
    
    const [isStreamReady, setIsStreamReady] = useState(false);
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

                if (qrCodeData) {
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
            } catch (e) {
                console.error("Error in scan loop:", e);
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
    const robotTile =
        maze.grid[robotState.y] && maze.grid[robotState.y][robotState.x]
            ? maze.grid[robotState.y][robotState.x]
            : "floor"; // 範囲外の場合は 'floor' として扱う (安全対策)
    // --- 修正点 終了 ---

    // --- JSX (変更なし) ---
    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-transparent">
            <canvas ref={scanCanvasRef} style={{ display: "none" }} />

            <div className="absolute top-2 left-2 z-10 bg-black/70 px-2 py-1 text-xs text-white rounded">
                {debugInfo} (QR Mode)
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
                        <MazeMap grid={maze.grid} mazeSize={maze.size} />
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