"use client";

import React, {
    useEffect,
    useRef,
    useState,
    Suspense,
    useCallback,
} from "react";
// Removed RootState from import, RootState is implicitly typed by useThree
import { Canvas, useFrame, useThree } from "@react-three/fiber";
// Removed OrbitControls from import as it's commented out
import {
    useGLTF,
    Html,
    useAnimations,
    Preload,
    OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import type { MazeData, RobotState, TileType, Command } from "@/lib/types";

// Assume THREEx is loaded globally via CDN
declare const THREEx: any;

interface MazeView3DProps {
    maze: MazeData;
    robotState: RobotState;
    onMarkerDetected: (command: Command) => void;
    detectedCommandName: string | null;
    currentCommandIndex: number;
    flattenedCommands: Command[];
}

// --- AR Controller Component ---
// Updated videoRef prop type to accept null
function ARController({
    onMarkerDetected,
    videoRef, // Ref to the video element managed by MazeView3D
    isStreamReady, // 親からストリーム準備完了フラグを受け取る
}: {
    onMarkerDetected: (command: Command) => void;
    videoRef: React.RefObject<HTMLVideoElement | null>; // Accept null
    isStreamReady: boolean; // 型定義を追加
}) {
    const { camera, gl, scene } = useThree();
    const markerRootsRef = useRef<{ [key: string]: THREE.Group }>({});
    const arToolkitContextRef = useRef<any>(null);
    const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
    const arToolkitSourceRef = useRef<any>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [arJsReady, setArJsReady] = useState(false);

    const markers: { name: string; command: Command }[] = [
        { name: "forward", command: { type: "forward" } }, // public/data/forward.patt
        { name: "turnRight", command: { type: "turnRight" } }, // public/data/turnRight.patt
        { name: "turnLeft", command: { type: "turnLeft" } }, // public/data/turnLeft.patt
        { name: "ifHole", command: { type: "ifHole" } }, // public/data/ifHole.patt
        { name: "loop", command: { type: "loop" } }, // public/data/loop.patt
    ];

    // Check for THREEx availability
    useEffect(() => {
        let checkInterval: NodeJS.Timeout | null = null;
        const checkForTHREEx = () => {
            if (typeof window !== "undefined" && (window as any).THREEx) {
                console.log("THREEx found!");
                setArJsReady(true);
                if (checkInterval) clearInterval(checkInterval);
            } else {
                if (!checkInterval) {
                    console.log("Checking for THREEx...");
                    checkInterval = setInterval(checkForTHREEx, 300);
                }
            }
        };
        checkForTHREEx();
        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
    }, []); // Run only once

    // Resize handler using useCallback
    const resizeEverything = useCallback(() => {
        const video = videoRef.current; // Might be null initially
        const source = arToolkitSourceRef.current;
        const context = arToolkitContextRef.current;

        // Add null check for video
        if (!video || !source || !context || !gl.domElement) return;

        console.log("Resizing AR components...");
        source.onResizeElement?.(gl.domElement);

        if (video.videoWidth > 0 && video.videoHeight > 0) {
            context.arController.canvas.width = video.videoWidth;
            context.arController.canvas.height = video.videoHeight;
            console.log(
                `AR Context resized to: ${video.videoWidth}x${video.videoHeight}`
            );

            if (context.arController.cameraPara) {
                camera.projectionMatrix.copy(context.getProjectionMatrix());
                console.log("Camera projection matrix updated.");
            } else {
                console.warn(
                    "Camera parameters not ready yet for projection matrix update."
                );
            }
        } else {
            console.warn(
                "Video dimensions not available for context resize yet."
            );
        }
    }, [gl.domElement, camera, videoRef]);

    // AR.js Initialization Effect
    useEffect(() => {
        // Wait for ready flag AND video element ref AND isStreamReady flag
        if (
            !arJsReady ||
            isInitialized ||
            !videoRef.current ||
            !isStreamReady // 
        ) {
            return;
        }

        console.log(
            "AR.js is ready AND video stream is ready, initializing..."
        );
        const THREEx = (window as any).THREEx;
        const video = videoRef.current; // videoRef.current is guaranteed non-null here

        // isStreamReady が true のため、ビデオは再生中。
        // レースコンディションなしでテクスチャを即時作成できる。
        console.log("Video is playing, creating VideoTexture.");
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        videoTextureRef.current = texture; // ref に保存
        scene.background = texture; // シーンの背景に設定

        // --- Source Initialization ---
        arToolkitSourceRef.current = new THREEx.ArToolkitSource({
            sourceType: "video",
            sourceElement: video, // Pass the non-null video element
        });

        arToolkitSourceRef.current.init(
            () => {
                console.log("AR Source Initialized");
                setTimeout(resizeEverything, 100);
            },
            (error: any) => {
                console.error("AR Source Init Error:", error);
            }
        );

        // --- Context Initialization ---
        arToolkitContextRef.current = new THREEx.ArToolkitContext({
            cameraParametersUrl: "/data/camera_para.dat",
            detectionMode: "mono",
        });
        arToolkitContextRef.current.init(() => {
            console.log("AR Context Initialized");
            if (arToolkitContextRef.current) {
                resizeEverything();
            }
        });

        // --- Marker Controls Setup ---
        markers.forEach((markerInfo) => {
            const markerRoot = new THREE.Group();
            scene.add(markerRoot);
            markerRootsRef.current[markerInfo.name] = markerRoot;
            const markerControls = new THREEx.ArMarkerControls(
                arToolkitContextRef.current,
                markerRoot,
                {
                    type: "pattern",
                    patternUrl: `/data/${markerInfo.name}.patt`, // 修正: patt.${markerInfo.name} -> ${markerInfo.name}.patt
                    changeMatrixMode: "cameraTransformMatrix",
                }
            );
            let lastVisible = false;
            markerRoot.userData.command = markerInfo.command;
            markerRoot.userData.updateVisibility = (isVisible: boolean) => {
                if (isVisible && !lastVisible) {
                    onMarkerDetected(markerRoot.userData.command);
                }
                lastVisible = isVisible;
            };
            markerRoot.userData.controls = markerControls;
        });

        setIsInitialized(true);
        console.log("AR.js initialization sequence complete.");
        window.addEventListener("resize", resizeEverything);

        // --- Cleanup Function ---
        return () => {
            console.log("Cleaning up AR.js resources...");
            window.removeEventListener("resize", resizeEverything);

            // シーン背景とテクスチャのクリーンアップ ---
            if (scene) {
                scene.background = null;
            }
            if (videoTextureRef.current) {
                videoTextureRef.current.dispose();
                videoTextureRef.current = null;
            }

            Object.values(markerRootsRef.current).forEach((group) => {
                if (group.userData.controls?.dispose) {
                    group.userData.controls.dispose();
                }
                scene.remove(group);
            });
            markerRootsRef.current = {};
            console.log("Marker controls disposed and groups removed.");

            arToolkitContextRef.current = null;
            arToolkitSourceRef.current = null;
            setIsInitialized(false);
            setArJsReady(false);
            console.log("AR.js cleanup complete.");
        };
    }, [
        arJsReady,
        camera,
        gl.domElement,
        scene,
        onMarkerDetected,
        resizeEverything,
        videoRef,
        isInitialized,
        isStreamReady, // 依存配列に追加
    ]);

    // --- AR.js Update Loop ---
    useFrame(() => {
        // Add null check for videoRef.current
        if (
            !isInitialized ||
            !arToolkitSourceRef.current?.ready ||
            !arToolkitContextRef.current ||
            !videoRef.current
        ) {
            return;
        }
        try {
            // テクスチャの更新
            // VideoTexture を使っている場合、毎フレーム更新が必要
            if (videoTextureRef.current) {
                videoTextureRef.current.needsUpdate = true;
            }

            // videoRef.current is guaranteed non-null here
            arToolkitContextRef.current.update(videoRef.current);

            Object.values(markerRootsRef.current).forEach((markerRoot) => {
                if (markerRoot) {
                    markerRoot.userData.updateVisibility?.(markerRoot.visible);
                }
            });
        } catch (error) {
            console.error("Error during AR.js update:", error);
            setIsInitialized(false);
        }
    });

    return null;
}

// --- 3D Maze Map Component --- (No changes)
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
                                    {" "}
                                    <boxGeometry
                                        args={[tileSize, wallHeight, tileSize]}
                                    />{" "}
                                    <meshStandardMaterial
                                        color="#4a90e2"
                                        opacity={0.85}
                                        transparent
                                    />{" "}
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
                                    {" "}
                                    <planeGeometry
                                        args={[tileSize * 0.9, tileSize * 0.9]}
                                    />{" "}
                                    <meshStandardMaterial
                                        color="#8b5cf6"
                                        transparent
                                        opacity={0.6}
                                        side={THREE.DoubleSide}
                                    />{" "}
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
                                    {" "}
                                    <planeGeometry
                                        args={[tileSize, tileSize]}
                                    />{" "}
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
                                    />{" "}
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

// --- Robot Model Component --- (No changes)
function RobotModel({
    robotState,
    mazeSize,
    currentCommandIndex,
    flattenedCommands,
}: {
    robotState: RobotState;
    mazeSize: number;
    currentCommandIndex: number;
    flattenedCommands: Command[];
}) {
    const { scene, animations } = useGLTF("/robot.gltf");
    const { actions, names, mixer } = useAnimations(animations, scene);
    const modelRef = useRef<THREE.Group>(null!);
    const tileSize = 0.5;
    const gridOffset = -(mazeSize * tileSize) / 2 + tileSize / 2;
    const targetPosition = React.useMemo(
        () =>
            new THREE.Vector3(
                robotState.x * tileSize + gridOffset,
                0.05,
                robotState.y * tileSize + gridOffset
            ),
        [robotState.x, robotState.y, tileSize, gridOffset]
    );
    const targetQuaternion = React.useMemo(
        () =>
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    0,
                    Math.atan2(
                        robotState.direction[0],
                        robotState.direction[1]
                    ),
                    0
                )
            ),
        [robotState.direction]
    );

    useEffect(() => {
        if (
            currentCommandIndex < 0 ||
            currentCommandIndex >= flattenedCommands.length
        ) {
            names.forEach((name) => actions[name]?.fadeOut(0.2));
            return;
        }
        const command = flattenedCommands[currentCommandIndex];
        let actionName: string | undefined;
        switch (command.type) {
            case "forward":
                actionName = "Walk";
                break;
            case "turnRight":
                actionName = "TurnRight";
                break;
            case "turnLeft":
                actionName = "TurnLeft";
                break;
            case "ifHole":
                actionName = "Action";
                break;
            default:
                actionName = undefined;
        }
        const activeAction = actionName ? actions[actionName] : null;
        if (activeAction) {
            names.forEach((name) => {
                if (name !== actionName && actions[name]?.isRunning()) {
                    actions[name]?.fadeOut(0.2);
                }
            });
            activeAction.reset().setLoop(THREE.LoopOnce, 1).clampWhenFinished =
                true;
            activeAction.fadeIn(0.2).play();
        } else {
            names.forEach((name) => {
                if (actions[name]?.isRunning()) actions[name]?.fadeOut(0.2);
            });
        }
    }, [currentCommandIndex, flattenedCommands, actions, names]);

    useFrame((_, delta) => {
        if (modelRef.current) {
            modelRef.current.position.lerp(targetPosition, delta * 6);
            modelRef.current.quaternion.slerp(targetQuaternion, delta * 12);
        }
        if (mixer) mixer.update(delta);
    });
    return <primitive ref={modelRef} object={scene} scale={0.12} castShadow />;
}

// --- Main MazeView3D Component ---
export function MazeView3D({
    maze,
    robotState,
    onMarkerDetected,
    detectedCommandName,
    currentCommandIndex,
    flattenedCommands,
}: MazeView3DProps) {
    // Ref type matches useRef initialization (null possible)
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    // ビデオストリームの準備完了状態を管理
    const [isStreamReady, setIsStreamReady] = useState(false);

    // Webカメラの初期化とストリーム管理 ---
    // ARController ではなく、ここで video のストリームを管理する
    useEffect(() => {
        const video = videoElementRef.current;
        if (!video) return;

        let stream: MediaStream | null = null;

        const startWebcam = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: "environment", // 背面カメラを優先
                    },
                });
                video.srcObject = stream;

                // 'playing' イベントを監視
                video.onplaying = () => {
                    console.log("Video stream is now playing.");
                    setIsStreamReady(true); // 準備完了フラグを立てる
                };

                // video.play() は autoPlay 属性に任せる
                console.log("Webcam stream attached. autoPlay will start it.");
            } catch (err) {
                console.error("Failed to get webcam stream:", err);
                // err が Error オブジェクトの場合、message プロパティを使用
                const errorMessage =
                    err instanceof Error ? err.message : String(err);
                alert(`カメラの起動に失敗: ${errorMessage}`);
            }
        };

        startWebcam();

        return () => {
            // --- クリーンアップ: ストリームを停止 ---
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                console.log("Webcam stream stopped.");
            }
            if (video && video.srcObject) {
                video.srcObject = null;
                video.onplaying = null; // イベントハンドラもクリア
            }
            setIsStreamReady(false); // 状態をリセット
        };
    }, []); // マウント時に1回だけ実行

    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-transparent">
            {/* Video element for AR feed */}
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
            {/* R3F Canvas */}
            <Canvas
                gl={{ alpha: true, antialias: true }}
                camera={{ position: [0, 0, 0], fov: 70 }}
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
                {/* Lighting */}
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
                {/* Ground plane for shadows */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -0.02, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[10, 10]} />{" "}
                    <shadowMaterial opacity={0.3} />
                </mesh>

                {/* AR Controller (Pass videoRef) */}
                {/* Type matches RefObject<HTMLVideoElement | null> */}
                <ARController
                    onMarkerDetected={onMarkerDetected}
                    videoRef={videoElementRef}
                    isStreamReady={isStreamReady} // state を渡す
                />

                {/* Parent Group for positioning/rotation */}
                <group
                    position={[0, 0.5, -2.5]} // Position: Slightly higher, Further back
                    rotation={[Math.PI / 4.5, 0, 0]} // Rotation: More tilt down, Slight right rotation
                >
                    <Suspense fallback={null}>
                        {/* Remove rotation from children */}
                        <MazeMap grid={maze.grid} mazeSize={maze.size} />
                        <RobotModel
                            robotState={robotState}
                            mazeSize={maze.size}
                            currentCommandIndex={currentCommandIndex}
                            flattenedCommands={flattenedCommands}
                        />
                        <Preload all />
                    </Suspense>
                </group>

                {/* Detected Command Name Display */}
                {detectedCommandName && (
                    <Html center position={[0, 0.7 + 0.6, -1.5]}>
                        {" "}
                        {/* Adjusted Y */}
                        <div
                            className="select-none rounded bg-black/60 px-3 py-1 text-xl font-bold text-neon-cyan shadow-lg backdrop-blur-sm"
                            style={{ textShadow: "0 0 8px #0ff" }}
                        >
                            {detectedCommandName.toUpperCase()}
                        </div>
                    </Html>
                )}

                {/* Optional OrbitControls (commented out) */}
                <OrbitControls
                    enableZoom={true} // Disable zoom
                    enablePan={true} // Disable panning
                    enableRotate={true} // Enable rotation only
                    target={new THREE.Vector3(0, 0.7, -1.8)}
                />
            </Canvas>
        </div>
    );
}