"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload, OrbitControls, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

import type { MazeData } from "@/src/domains/maze/maze-data/lib/types";
import type { RobotState, Command } from "@/src/domains/ar/robot-logic/lib/types";
import { isMazeQRCode, decodeMazeFromQR } from "@shared/lib";
import { MazeMap } from "@/src/domains/ar/view/ui";
import { RobotModel } from "@/src/domains/ar/view/ui";
import { useCameraQRScanner } from "@domains/ar/qr-command-scanner";

// QRコードの文字列とコマンドのマッピング
const qrCodeToCommand: { [key: string]: Command } = {
    forward: { type: "forward" },
    turnRight: { type: "turnRight" },
    turnLeft: { type: "turnLeft" },
    ifHole: { type: "ifHole" },
    loop: { type: "loop" },
};

interface MazeView3DProps {
    maze: MazeData;
    robotState: RobotState;
    onMarkerDetected: (command: Command) => void;
    detectedCommandName: string | null;
    currentCommandIndex: number;
    flattenedCommands: Command[];
    children?: React.ReactNode;
}

/**
 * MazeView3DWidget
 * 3D迷路表示とQRコードスキャンを統合したウィジェット
 * カメラ/QRスキャンロジックは useCameraQRScanner フックに委譲
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

    // QRコード検出時のコールバック
    const handleQRCodeDetected = useCallback((qrCodeData: string) => {
        // 迷路QRコードの場合はインポート
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
            return;
        }

        // コマンドQRコードの場合
        const command = qrCodeToCommand[qrCodeData];
        if (command) {
            onMarkerDetected(command);
        }
    }, [onMarkerDetected]);

    // カメラ/QRスキャナーフック（自動起動、1.5秒クールダウン）
    const { videoRef, canvasRef } = useCameraQRScanner({
        onQRCodeDetected: handleQRCodeDetected,
        autoStart: true,
        cooldownMs: 2500,
    });

    // 現在のタイルを計算
    const currentLayer = renderingZ >= 0 && renderingZ < maze.layers.length ? maze.layers[renderingZ] : null;
    const robotTile =
        currentLayer && currentLayer[robotState.y] && currentLayer[robotState.y][robotState.x]
            ? currentLayer[robotState.y][robotState.x]
            : "floor";

    return (
        <div className="relative w-full h-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-transparent">
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <video
                id="arjs-video"
                ref={videoRef}
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
                                            font="/fonts/helvetiker_regular.typeface.json"
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



                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    target={new THREE.Vector3(0, 0.7, -1.8)}
                />
            </Canvas>

            {/* Detected Command Name Popup - Centered Overlay */}
            {detectedCommandName && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div
                        className="select-none rounded-lg bg-black/70 px-6 py-3 text-2xl font-bold text-neon-cyan shadow-lg backdrop-blur-sm"
                        style={{
                            textShadow: "0 0 12px #0ff",
                            animation: "subtle-pulse 2s ease-in-out infinite"
                        }}
                    >
                        {detectedCommandName.toUpperCase()}
                    </div>
                </div>
            )}


            {/* Overlay elements passed as children */}
            {children}
        </div>
    );
}

// エクスポートエイリアス
export const MazeView3DWidget = MazeView3D;