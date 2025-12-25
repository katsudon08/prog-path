"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, Preload, OrbitControls, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";
import jsQR from "jsqr";

import type { MazeData } from "@entities/maze";
import type { RobotState, Command } from "@entities/robot";
import { isMazeQRCode, decodeMazeFromQR } from "@features/maze-serialization";
import { MazeMap } from "@entities/maze-3d";
import { RobotModel } from "@entities/robot-3d";

interface MazeView3DProps {
    maze: MazeData;
    robotState: RobotState;
    onMarkerDetected: (command: Command) => void;
    detectedCommandName: string | null;
    currentCommandIndex: number;
    flattenedCommands: Command[];
    children?: React.ReactNode;
}

// QRコードのデコード関数
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

// QRコードの文字列とコマンドのマッピング
const qrCodeToCommand: { [key: string]: Command } = {
    forward: { type: "forward" },
    turnRight: { type: "turnRight" },
    turnLeft: { type: "turnLeft" },
    ifHole: { type: "ifHole" },
    loop: { type: "loop" },
};

/**
 * MazeView3DWidget
 * 3D迷路表示とQRコードスキャンを統合したウィジェット
 */
export function MazeView3D({
    maze,
    robotState,
    onMarkerDetected,
    detectedCommandName,
    currentCommandIndex,
    flattenedCommands,
    children,
}: MazeView3DProps) {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const isCoolingDownRef = useRef<boolean>(false);

    const [isStreamReady, setIsStreamReady] = useState<boolean>(false);
    const [renderingZ, setRenderingZ] = useState(robotState.z);

    // Z座標の遅延更新（テレポート演出用）
    useEffect(() => {
        if (robotState.z === renderingZ) return;

        if (currentCommandIndex === -1) {
            setRenderingZ(robotState.z);
            return;
        }

        const timer = setTimeout(() => {
            setRenderingZ(robotState.z);
        }, 500);

        return () => clearTimeout(timer);
    }, [robotState.z, renderingZ, currentCommandIndex]);

    // カメラ起動ロジック
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
                    video.play()
                        .then(() => console.log("✅ Video playback started."))
                        .catch((err) => console.error("❌ Video play failed:", err));
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
                const errorMessage = err instanceof Error ? err.message : String(err);
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

    // QRコードスキャンループ
    useEffect(() => {
        if (!isStreamReady || !videoElementRef.current || !scanCanvasRef.current) {
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
            scanInterval = window.setTimeout(scanLoop, 300);

            if (video.readyState < 2) return;

            try {
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                if (videoWidth === 0 || videoHeight === 0) return;

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qrCodeData = scanQRCodeWithJsQR(imageData);

                if (qrCodeData) {
                    if (isMazeQRCode(qrCodeData)) {
                        const importedMaze = decodeMazeFromQR(qrCodeData);
                        if (importedMaze) {
                            const stored = localStorage.getItem("progpath_mazes");
                            const mazes: MazeData[] = stored ? JSON.parse(stored) : [];

                            if (!mazes.find(m => m.id === importedMaze.id)) {
                                mazes.push(importedMaze);
                                localStorage.setItem("progpath_mazes", JSON.stringify(mazes));
                                console.log("✅ 迷路をインポート:", importedMaze.name);
                            }
                        }
                    } else {
                        const command = qrCodeToCommand[qrCodeData];

                        if (command && !isCoolingDownRef.current) {
                            console.log(`🎯 QR Code detected: ${qrCodeData}`, command);
                            onMarkerDetected(command);

                            isCoolingDownRef.current = true;
                            setTimeout(() => {
                                isCoolingDownRef.current = false;
                            }, 1500);
                        }
                    }
                }
            } catch (err) {
                console.error("Error in scan loop:", err);
            }
        };

        scanLoop();

        return () => {
            console.log("🛑 Stopping QR scanner loop...");
            if (scanInterval) clearTimeout(scanInterval);
            isCoolingDownRef.current = false;
        };
    }, [isStreamReady, onMarkerDetected]);

    // 現在のタイルを計算
    const currentLayer = renderingZ >= 0 && renderingZ < maze.layers.length ? maze.layers[renderingZ] : null;
    const robotTile =
        currentLayer && currentLayer[robotState.y] && currentLayer[robotState.y][robotState.x]
            ? currentLayer[robotState.y][robotState.x]
            : "floor";

    return (
        <div className="relative w-full h-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-transparent">
            <canvas ref={scanCanvasRef} style={{ display: "none" }} />


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
                camera={{ position: [0, 0, 0], fov: 70, near: 0.1, far: 1000 }}
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
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                    <planeGeometry args={[10, 10]} />
                    <shadowMaterial opacity={0.3} />
                </mesh>

                <group position={[0, 0.5, -2.5]} rotation={[Math.PI / 4.5, 0, 0]}>
                    <Suspense fallback={null}>
                        {/* 複数層の表示 */}
                        {maze.layers.map((layer, layerIndex) => {
                            const currentZ = renderingZ;
                            const layerOpacity = layerIndex !== currentZ ? 0.5 : 1.0;
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
                                    <Center
                                        position={[-(maze.size * 0.5) / 2 - 0.8, 0.5, 0]}
                                        rotation={[0, Math.PI / 4, 0]}
                                    >
                                        <Text3D
                                            font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
                                            size={0.5}
                                            height={0.02}
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

            {/* Overlay elements passed as children */}
            {children}
        </div>
    );
}