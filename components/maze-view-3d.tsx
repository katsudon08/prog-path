"use client";

import React, {
    useEffect,
    useRef,
    useState,
    Suspense,
    useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    useGLTF,
    Html,
    useAnimations,
    Preload,
    OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import type { MazeData, RobotState, TileType, Command } from "@/lib/types";

declare const THREEx: any;

interface MazeView3DProps {
    maze: MazeData;
    robotState: RobotState;
    onMarkerDetected: (command: Command) => void;
    detectedCommandName: string | null;
    currentCommandIndex: number;
    flattenedCommands: Command[];
}

function ARController({
    onMarkerDetected,
    videoRef,
    isStreamReady,
}: {
    onMarkerDetected: (command: Command) => void;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isStreamReady: boolean;
}) {
    const { camera, gl, scene } = useThree();
    const markerRootsRef = useRef<{ [key: string]: THREE.Group }>({});
    const arToolkitContextRef = useRef<any>(null);
    const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
    const arToolkitSourceRef = useRef<any>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [arJsReady, setArJsReady] = useState(false);
    const frameCountRef = useRef(0);

    const markers: { name: string; command: Command }[] = [
        { name: "forward", command: { type: "forward" } },
        { name: "turnRight", command: { type: "turnRight" } },
        { name: "turnLeft", command: { type: "turnLeft" } },
        { name: "ifHole", command: { type: "ifHole" } },
        { name: "loop", command: { type: "loop" } },
    ];

    useEffect(() => {
        let checkInterval: NodeJS.Timeout | null = null;
        const checkForTHREEx = () => {
            if (typeof window !== "undefined" && (window as any).THREEx) {
                console.log("✅ THREEx found!");
                setArJsReady(true);
                if (checkInterval) clearInterval(checkInterval);
            } else {
                if (!checkInterval) {
                    console.log("⏳ Checking for THREEx...");
                    checkInterval = setInterval(checkForTHREEx, 300);
                }
            }
        };
        checkForTHREEx();
        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
    }, []);

    const resizeEverything = useCallback(() => {
        const video = videoRef.current;
        const source = arToolkitSourceRef.current;
        const context = arToolkitContextRef.current;

        if (!video || !source || !context || !gl.domElement) return;

        console.log("📐 Resizing AR components...");
        
        source.copyElementSizeTo(gl.domElement);
        
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            source.copyElementSizeTo(context.arController.canvas);
            
            console.log(
                `📐 AR Context resized to: ${video.videoWidth}x${video.videoHeight}`
            );

            if (context.arController.cameraPara) {
                camera.projectionMatrix.copy(context.getProjectionMatrix());
                console.log("📷 Camera projection matrix updated.");
            } else {
                console.warn(
                    "⚠️ Camera parameters not ready yet for projection matrix update."
                );
            }
        } else {
            console.warn(
                "⚠️ Video dimensions not available for context resize yet."
            );
        }
    }, [gl.domElement, camera, videoRef]);

    // AR.js Initialization Effect
    useEffect(() => {
        if (
            !arJsReady ||
            isInitialized ||
            !videoRef.current ||
            !isStreamReady
        ) {
            if (!arJsReady) console.log("⏳ Waiting for AR.js...");
            if (!videoRef.current) console.log("⏳ Waiting for video element...");
            if (!isStreamReady) console.log("⏳ Waiting for stream ready...");
            return;
        }

        console.log(
            "🚀 AR.js is ready AND video stream is ready, initializing..."
        );
        const THREEx = (window as any).THREEx;
        const video = videoRef.current;

        // ビデオが実際に再生されているか確認
        if (video.readyState < 2) {
            console.log("⏳ Video not ready yet, waiting...");
            return;
        }

        console.log("🎥 Video is playing, creating VideoTexture.");
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        videoTextureRef.current = texture;
        scene.background = texture;

        // --- Source Initialization ---
        arToolkitSourceRef.current = new THREEx.ArToolkitSource({
            sourceType: "webcam",
            sourceWidth: 640,
            sourceHeight: 480,
            displayWidth: 640,
            displayHeight: 480,
        });

        // AR.jsに既存のvideo要素を使わせる
        arToolkitSourceRef.current.domElement = video;
        
        // すでにストリームが設定されているのでreadyフラグを立てる
        arToolkitSourceRef.current.ready = true;
        
        console.log("✅ AR Source Initialized (using existing video element)");
        
        // onResizeイベントハンドラを設定
        arToolkitSourceRef.current.onResize = resizeEverything;
        
        setTimeout(resizeEverything, 100);

        // --- Context Initialization ---
        arToolkitContextRef.current = new THREEx.ArToolkitContext({
            cameraParametersUrl: "/data/camera_para.dat",
            detectionMode: "image",
            maxDetectionRate: 60,
            canvasWidth: 640,
            canvasHeight: 480,
        });
        
        arToolkitContextRef.current.init(() => {
            console.log("✅ AR Context Initialized");
            if (arToolkitContextRef.current) {
                camera.projectionMatrix.copy(
                    arToolkitContextRef.current.getProjectionMatrix()
                );
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
                    patternUrl: `/data/${markerInfo.name}.patt`,
                    changeMatrixMode: "cameraTransformMatrix",
                }
            );
            
            console.log(`🎯 Marker registered: ${markerInfo.name}`);
            
            let lastVisible = false;
            markerRoot.userData.command = markerInfo.command;
            markerRoot.userData.lastDetectionTime = 0;
            markerRoot.userData.updateVisibility = (isVisible: boolean) => {
                const now = Date.now();
                if (isVisible && !lastVisible && now - markerRoot.userData.lastDetectionTime > 500) {
                    console.log(`🎯✅ Marker detected: ${markerInfo.name}`, markerInfo.command);
                    onMarkerDetected(markerRoot.userData.command);
                    markerRoot.userData.lastDetectionTime = now;
                }
                lastVisible = isVisible;
            };
            markerRoot.userData.controls = markerControls;
        });

        setIsInitialized(true);
        console.log("✅ AR.js initialization sequence complete.");
        window.addEventListener("resize", resizeEverything);

        return () => {
            console.log("🧹 Cleaning up AR.js resources...");
            window.removeEventListener("resize", resizeEverything);

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

            arToolkitContextRef.current = null;
            arToolkitSourceRef.current = null;
            setIsInitialized(false);
            setArJsReady(false);
            console.log("✅ AR.js cleanup complete.");
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
        isStreamReady,
    ]);

    useFrame(() => {
        if (
            !isInitialized ||
            !arToolkitSourceRef.current?.ready ||
            !arToolkitContextRef.current ||
            !videoRef.current
        ) {
            console.log("isInitialized:", !isInitialized);
            console.log("arToolkitSourceRef.current?.ready:", !arToolkitSourceRef.current?.ready);
            console.log("arToolkitContextRef.current:", !arToolkitContextRef.current);
            console.log("videoRef.current:", !videoRef.current);
            console.log("⏳ AR.js not fully initialized yet, skipping frame update.");
            return;
        }
        try {
            if (videoTextureRef.current) {
                videoTextureRef.current.needsUpdate = true;
            }

            arToolkitContextRef.current.update(arToolkitSourceRef.current.domElement);

            frameCountRef.current++;
            if (frameCountRef.current % 100 === 0) {
                const visibleMarkers = Object.entries(markerRootsRef.current)
                    .filter(([_, root]) => root.visible)
                    .map(([name]) => name);
                
                if (visibleMarkers.length > 0) {
                    console.log(`👁️ Visible markers:`, visibleMarkers);
                }
            }

            Object.values(markerRootsRef.current).forEach((markerRoot) => {
                if (markerRoot) {
                    markerRoot.userData.updateVisibility?.(markerRoot.visible);
                }
            });
        } catch (error) {
            console.error("❌ Error during AR.js update:", error);
        }
    });

    return null;
}

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
                actionName = "forward";
                break;
            case "turnRight":
                actionName = "TurnRight";
                break;
            case "turnLeft":
                actionName = "TurnLeft";
                break;
            case "ifHole":
                actionName = "ifHole";
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

export function MazeView3D({
    maze,
    robotState,
    onMarkerDetected,
    detectedCommandName,
    currentCommandIndex,
    flattenedCommands,
}: MazeView3DProps) {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const [isStreamReady, setIsStreamReady] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>("");

    useEffect(() => {
        const interval = setInterval(() => {
            const video = videoElementRef.current;
            if (video && video.videoWidth > 0) {
                setDebugInfo(`Video: ${video.videoWidth}x${video.videoHeight} | Ready: ${isStreamReady} | ReadyState: ${video.readyState}`);
            } else {
                setDebugInfo(`Video: Not ready | Ready: ${isStreamReady}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isStreamReady]);

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
                    video.play().then(() => {
                        console.log("✅ Video playback started.");
                    }).catch(err => {
                        console.error("❌ Video play failed:", err);
                    });
                };

                video.onplaying = () => {
                    console.log("✅ Video stream is now playing.");
                    // readyStateが十分であることを確認してから設定
                    if (video.readyState >= 2) {
                        setIsStreamReady(true);
                    }
                };

                // readyStateの変化を監視
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

    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-transparent">
            <div className="absolute top-2 left-2 z-10 bg-black/70 px-2 py-1 text-xs text-white rounded">
                {debugInfo}
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

                <ARController
                    onMarkerDetected={onMarkerDetected}
                    videoRef={videoElementRef}
                    isStreamReady={isStreamReady}
                />

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