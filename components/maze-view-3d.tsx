"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree, RootState } from "@react-three/fiber";
import { useGLTF, Html, useAnimations, Preload } from "@react-three/drei";
import * as THREE from "three";
// Import necessary types (Removed CommandType)
import type { MazeData, RobotState, TileType, Command } from "@/lib/types";

// Assume THREEx is loaded globally via CDN
declare const THREEx: any;

interface MazeView3DProps {
    maze: MazeData;
    robotState: RobotState;
    onMarkerDetected: (command: Command) => void; // Expect Command object
    detectedCommandName: string | null;
    currentCommandIndex: number; // For animation triggering
    flattenedCommands: Command[]; // For animation triggering
}

// --- AR Controller Component ---
// Initializes AR.js, detects markers, and controls the camera
function ARController({ onMarkerDetected }: { onMarkerDetected: (command: Command) => void }) {
    const { camera, gl, scene } = useThree();
    // Refs to manage AR.js objects and marker groups
    const markerRootsRef = useRef<{ [key: string]: THREE.Group }>({});
    const arToolkitContextRef = useRef<any>(null);
    const arToolkitSourceRef = useRef<any>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [arJsReady, setArJsReady] = useState(false); // State to track if THREEx is loaded

    // Marker names mapped to Command objects
    const markers: { name: string; command: Command }[] = [
        { name: "hiro", command: { type: "forward" } },
        { name: "kanji", command: { type: "turnRight" } },
        // --- Add custom markers here ---
        // { name: "letterA", command: { type: "turnLeft" } },
        // { name: "letterB", command: { type: "ifHole", children: [] } },
        // { name: "letterC", command: { type: "loop", loopCount: 2, children: [] } },
    ];

    // Effect to check for THREEx availability
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).THREEx) {
            setArJsReady(true);
        } else {
            const checkInterval = setInterval(() => {
                if (typeof window !== 'undefined' && (window as any).THREEx) {
                    setArJsReady(true);
                    clearInterval(checkInterval);
                }
            }, 100); // Check every 100ms
            return () => clearInterval(checkInterval);
        }
    }, []);

    // Effect for AR.js Initialization (runs only when arJsReady is true)
    useEffect(() => {
        if (!arJsReady || isInitialized) return; // Only run once when ready

        console.log("AR.js is ready, initializing...");
        const THREEx = (window as any).THREEx; // Get THREEx safely

        // --- AR.js Source (Webcam) Initialization ---
        arToolkitSourceRef.current = new THREEx.ArToolkitSource({ sourceType: 'webcam' });
        arToolkitSourceRef.current.init(() => {
            const video = arToolkitSourceRef.current.domElement as HTMLVideoElement; // Cast here
             setTimeout(() => { // Wait for dimensions
                if (!video) return;
                // Style video element
                video.style.position = 'absolute'; video.style.top = '0px'; video.style.left = '0px'; video.style.zIndex = '-1'; video.style.objectFit = 'cover';
                const canvasElement = gl.domElement; video.style.width = canvasElement.clientWidth + 'px'; video.style.height = canvasElement.clientHeight + 'px';
                // video.style.transform = 'scaleX(-1)'; // Optional flip
            }, 500);
        });

        // --- AR.js Context Initialization ---
        arToolkitContextRef.current = new THREEx.ArToolkitContext({
            cameraParametersUrl: '/data/camera_para.dat', // From public/data
            detectionMode: 'mono',
        });
        arToolkitContextRef.current.init(() => {
            camera.projectionMatrix.copy(arToolkitContextRef.current.getProjectionMatrix());
            // Initialization flag set after marker setup
        });

        // --- Marker Controls Setup ---
        markers.forEach(markerInfo => {
            const markerRoot = new THREE.Group();
            scene.add(markerRoot);
            markerRootsRef.current[markerInfo.name] = markerRoot;
            // ArMarkerControls links AR.js context, the marker's Group, and the pattern file
            const markerControls = new THREEx.ArMarkerControls(arToolkitContextRef.current, markerRoot, {
                type: 'pattern', patternUrl: `/data/patt.${markerInfo.name}`, changeMatrixMode: 'cameraTransformMatrix'
            });
            let lastVisible = false;
            markerRoot.userData.command = markerInfo.command; // Store command data
            // Function to check visibility changes and trigger callback
            markerRoot.userData.updateVisibility = (isVisible: boolean) => {
                if (isVisible && !lastVisible) { // Trigger only when newly detected
                    onMarkerDetected(markerRoot.userData.command);
                }
                lastVisible = isVisible;
            };
        });

        setIsInitialized(true); // Mark initialization complete
        console.log("AR.js initialization complete.");

        // --- Window Resize Handler ---
        const handleResize = () => {
             if (arToolkitSourceRef.current?.domElement) {
                arToolkitSourceRef.current.onResize(gl.domElement);
                const video = arToolkitSourceRef.current.domElement as HTMLVideoElement; // Cast
                 if (arToolkitContextRef.current && video?.videoWidth > 0) { // Check video dimensions
                     arToolkitContextRef.current.arController.canvas.width = video.videoWidth;
                     arToolkitContextRef.current.arController.canvas.height = video.videoHeight;
                }
                if (arToolkitContextRef.current) {
                    camera.projectionMatrix.copy(arToolkitContextRef.current.getProjectionMatrix());
                }
                if (video) {
                    const canvasElement = gl.domElement;
                    video.style.width = canvasElement.clientWidth + 'px';
                    video.style.height = canvasElement.clientHeight + 'px';
                 }
             }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Call initially

        // --- Cleanup Function ---
        return () => {
            console.log("Cleaning up AR.js resources...");
            window.removeEventListener('resize', handleResize);
             if (arToolkitSourceRef.current?.domElement) {
                 const video = arToolkitSourceRef.current.domElement as HTMLVideoElement; // Cast
                 const stream = video.srcObject as MediaStream;
                 if (stream) { stream.getTracks().forEach(track => track.stop()); } // Stop camera
                 if (video.parentNode) { video.parentNode.removeChild(video); } // Remove video element
             }
             // Dispose marker controls and context (if available)
             Object.values(markerRootsRef.current).forEach(group => scene.remove(group));
             markerRootsRef.current = {};
             // if (arToolkitContextRef.current?.dispose) { arToolkitContextRef.current.dispose(); }
             arToolkitContextRef.current = null;
             arToolkitSourceRef.current = null;
             setIsInitialized(false);
        };
    }, [arJsReady, camera, gl, scene, onMarkerDetected]); // Rerun effect if arJsReady becomes true

    // --- AR.js Update Loop ---
    useFrame(() => {
        if (!isInitialized || !arToolkitSourceRef.current?.ready || !arToolkitContextRef.current) {
            return; // Don't update if not ready
        }
        try {
            arToolkitContextRef.current.update(arToolkitSourceRef.current.domElement);
            // Update marker visibility status
            Object.values(markerRootsRef.current).forEach(markerRoot => {
                if (markerRoot) { // Check existence
                    markerRoot.userData.updateVisibility?.(markerRoot.visible);
                }
            });
        } catch (error) {
            console.error("Error during AR.js update:", error);
            // Consider adding error handling logic here
        }
    });

    return null; // Controller doesn't render visuals directly
}


// --- 3D Maze Map Component --- (No changes from previous version)
function MazeMap({ grid, mazeSize }: { grid: TileType[][], mazeSize: number }) {
    const tileSize = 0.5;
    const wallHeight = 0.5;
    const gridOffset = - (mazeSize * tileSize) / 2 + tileSize / 2;

    return (
        <group>
            {grid.map((row, y) =>
                row.map((tile, x) => {
                    const position: [number, number, number] = [ x * tileSize + gridOffset, 0, y * tileSize + gridOffset ];
                    switch (tile) {
                        case "wall":
                            return ( <mesh key={`${x}-${y}`} position={[position[0], wallHeight / 2, position[2]]}> <boxGeometry args={[tileSize, wallHeight, tileSize]} /> <meshStandardMaterial color="#4a90e2" opacity={0.8} transparent /> </mesh> );
                        case "hole":
                            return ( <mesh key={`${x}-${y}`} position={[position[0], -0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}> <planeGeometry args={[tileSize * 0.9, tileSize * 0.9]} /> <meshStandardMaterial color="#8b5cf6" transparent opacity={0.5} side={THREE.DoubleSide}/> </mesh> );
                        case "start": case "goal": case "floor":
                            return ( <mesh key={`${x}-${y}`} position={position} rotation={[-Math.PI / 2, 0, 0]}> <planeGeometry args={[tileSize, tileSize]} /> <meshStandardMaterial color={ tile === 'start' ? '#4ade80' : tile === 'goal' ? '#ef4444' : '#1a2540'} opacity={0.7} transparent side={THREE.DoubleSide} /> </mesh> );
                        default: return null;
                    }
                })
            )}
        </group>
    );
}

// --- Robot Model Component --- (Removed unused 'state' from useFrame)
function RobotModel({ robotState, mazeSize, currentCommandIndex, flattenedCommands }: {
    robotState: RobotState;
    mazeSize: number;
    currentCommandIndex: number;
    flattenedCommands: Command[];
}) {
    const { scene, animations } = useGLTF("/robot.gltf");
    const { actions, names, mixer } = useAnimations(animations, scene);
    const modelRef = useRef<THREE.Group>(null!);

    const tileSize = 0.5;
    const gridOffset = - (mazeSize * tileSize) / 2 + tileSize / 2;

    const targetPosition = React.useMemo(() => new THREE.Vector3(
        robotState.x * tileSize + gridOffset, 0.1, robotState.y * tileSize + gridOffset
    ), [robotState.x, robotState.y, tileSize, gridOffset]);

    const targetQuaternion = React.useMemo(() => new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, Math.atan2(robotState.direction[0], robotState.direction[1]), 0)
    ), [robotState.direction]);

    useEffect(() => {
        // Animation logic based on currentCommandIndex (no changes needed here for the reported errors)
        if (currentCommandIndex < 0 || currentCommandIndex >= flattenedCommands.length) {
             names.forEach(name => actions[name]?.fadeOut(0.2));
            return;
        }
        const command = flattenedCommands[currentCommandIndex];
        let actionName: string | undefined = undefined;
        switch (command.type) {
            case "forward": actionName = "Walk"; break;
            case "turnRight": actionName = "TurnRight"; break;
            case "turnLeft": actionName = "TurnLeft"; break;
            case "ifHole": actionName = "Action"; break;
        }
        const activeAction = actionName ? actions[actionName] : null;
        if (activeAction) {
            names.forEach(name => { if (name !== actionName && actions[name]?.isRunning()) { actions[name]?.fadeOut(0.2); } });
            activeAction.reset().fadeIn(0.2).play();
        } else {
             names.forEach(name => { if(actions[name]?.isRunning()) actions[name]?.fadeOut(0.2) });
        }
    }, [currentCommandIndex, flattenedCommands, actions, names, mixer]);

    // Update position and rotation smoothly in the render loop
    useFrame((_, delta) => { // Removed unused 'state' parameter
        if (modelRef.current) {
            modelRef.current.position.lerp(targetPosition, delta * 5);
            modelRef.current.quaternion.slerp(targetQuaternion, delta * 10);
        }
        mixer.update(delta); // Update animation mixer
    });

    return ( <primitive ref={modelRef} object={scene} scale={0.15} /> );
}


// --- Main MazeView3D Component --- (No changes needed here for the reported errors)
export function MazeView3D({ maze, robotState, onMarkerDetected, detectedCommandName, currentCommandIndex, flattenedCommands }: MazeView3DProps) {
    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-transparent">
            <Canvas
                gl={{ alpha: true }}
                camera={{ position: [0, 1.5, 0], fov: 70 }}
                style={{ background: 'transparent' }}
                onCreated={(state: RootState) => {
                    // Try to style the video element on creation
                    const video = document.querySelector('video'); // More generic selector might be needed
                    if (video) {
                        video.style.position = 'absolute'; video.style.top = '0'; video.style.left = '0';
                        video.style.width = '100%'; video.style.height = '100%'; video.style.objectFit = 'cover'; video.style.zIndex = '-1';
                    } else {
                        console.warn("AR.js video not found onCreated.");
                    }
                }}
            >
                {/* Lighting */}
                <ambientLight intensity={1.0} />
                <directionalLight position={[3, 5, 2]} intensity={1.5} castShadow />

                {/* AR Controller */}
                <ARController onMarkerDetected={onMarkerDetected} />

                {/* 3D Content */}
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

                {/* Detected Command Name Display */}
                {detectedCommandName && (
                    <Html center position={[0, 0.5, 0]}>
                        <div className="select-none rounded bg-black/60 px-3 py-1 text-xl font-bold text-neon-cyan shadow-lg backdrop-blur-sm" style={{ textShadow: "0 0 8px #0ff" }} >
                            {detectedCommandName.toUpperCase()}
                        </div>
                    </Html>
                )}
            </Canvas>
        </div>
    );
}

