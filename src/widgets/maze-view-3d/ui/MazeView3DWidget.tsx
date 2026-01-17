"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload, OrbitControls, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

import type { MazeData, TileType } from "@/src/entities/maze";
import type { RobotState, RobotAnimationState } from "@/src/entities/robot";
import type { Command } from "@/src/entities/command";
import { isMazeQRCode, decodeMazeFromQR, useCameraQRScanner } from "@/src/shared/lib";
import { MazeMap3D } from "@/src/entities/maze";
import { RobotModel } from "@/src/entities/robot";

// QRコードの文字列とコマンドのマッピング
const qrCodeToCommand: { [key: string]: Command } = {
    forward: { type: "forward" },
    turnRight: { type: "turnRight" },
    turnLeft: { type: "turnLeft" },
    ifHole: { type: "ifHole" },
    loop: { type: "loop" },
};

interface MazeView3DWidgetProps {
    maze: MazeData;
    robotState: RobotState;
    animationState: RobotAnimationState;
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
export function MazeView3DWidget({
    maze,
    robotState,
    animationState,
    onMarkerDetected,
    detectedCommandName,
    currentCommandIndex,
    flattenedCommands,
    children,
}: MazeView3DWidgetProps) {
    const [renderingZ, setRenderingZ] = useState(robotState.layer);

    // Z座標の遅延更新（テレポート演出用）
    useEffect(() => {
        if (robotState.layer === renderingZ) return;

        if (currentCommandIndex === -1) {
            setRenderingZ(robotState.layer);
            return;
        }

        const timer = setTimeout(() => {
            setRenderingZ(robotState.layer);
        }, 500);

        return () => clearTimeout(timer);
    }, [robotState.layer, renderingZ, currentCommandIndex]);

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

    // カメラ/QRスキャナーフック（自動起動、2.5秒クールダウン）
    const { videoRef, canvasRef } = useCameraQRScanner({
        onQRCodeDetected: handleQRCodeDetected,
        autoStart: true,
        cooldownMs: 2500,
    });

    // 現在のタイルを計算
    const currentLayer = renderingZ >= 0 && renderingZ < maze.layers.length ? maze.layers[renderingZ] : null;
    const robotTile: TileType =
        currentLayer && currentLayer[robotState.y] && currentLayer[robotState.y][robotState.x]
            ? currentLayer[robotState.y][robotState.x]
            : "floor";

    return (
        <div className="relative w-full h-full overflow-hidden rounded-lg bg-transparent">
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <video
                id="arjs-video"
                ref={videoRef}
                autoPlay
                playsInline
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
                                    <MazeMap3D
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
                                            <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={1.5} toneMapped={false} />
                                        </Text3D>
                                    </Center>
                                </group>
                            );
                        })}

                        <RobotModel
                            robotState={robotState}
                            mazeSize={maze.size}
                            currentTileType={robotTile}
                            animationState={animationState}
                            isTeleporting={animationState === 'teleporting'}
                            isFalling={animationState === 'falling'}
                            isScanning={animationState === 'scanning'}
                            isFilling={animationState === 'filling'}
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
