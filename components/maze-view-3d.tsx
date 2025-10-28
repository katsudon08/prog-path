"use client";

import { useEffect, useRef } from "react";
import type { MazeData } from "@/lib/types";
import { Canvas } from "@react-three/fiber";

interface RobotState {
    x: number;
    y: number;
    direction: "north" | "east" | "south" | "west";
}

interface MazeView3DProps {
    maze: MazeData;
    robotState: RobotState;
}

export function MazeView3D({ maze, robotState }: MazeView3DProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Webカメラへのアクセスを要求
        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }, // バックカメラを優先
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("カメラの起動に失敗しました:", err);
            }
        }

        setupCamera();

        // クリーンアップ関数
        return () => {
            const video = videoRef.current;
            if (video && video.srcObject) {
                const stream = video.srcObject as MediaStream;
                const tracks = stream.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div
            id="camera"
            className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-space-dark"
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
            />
        </div>
    );
}
