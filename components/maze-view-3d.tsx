"use client";

import { useEffect, useRef } from "react";
import type { MazeData } from "@/lib/types";

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
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Clear canvas
        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate cell size for isometric view
        const cellSize = Math.min(
            canvas.width / (maze.size + 2),
            canvas.height / (maze.size + 2)
        );
        const offsetX = canvas.width / 2;
        const offsetY = canvas.height / 4;

        // Draw isometric grid
        for (let y = 0; y < maze.grid.length; y++) {
            for (let x = 0; x < maze.grid[y].length; x++) {
                const tile = maze.grid[y][x];

                // Convert to isometric coordinates
                const isoX = (x - y) * cellSize * 0.5 + offsetX;
                const isoY = (x + y) * cellSize * 0.25 + offsetY;

                // Draw tile based on type
                if (tile === "wall") {
                    // Draw wall as 3D block
                    ctx.fillStyle = "#4a90e2";
                    ctx.strokeStyle = "#60d5ff";
                    ctx.lineWidth = 2;

                    // Top face
                    ctx.beginPath();
                    ctx.moveTo(isoX, isoY - cellSize * 0.5);
                    ctx.lineTo(isoX + cellSize * 0.5, isoY - cellSize * 0.25);
                    ctx.lineTo(isoX, isoY);
                    ctx.lineTo(isoX - cellSize * 0.5, isoY - cellSize * 0.25);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Right face
                    ctx.fillStyle = "#3a70c2";
                    ctx.beginPath();
                    ctx.moveTo(isoX + cellSize * 0.5, isoY - cellSize * 0.25);
                    ctx.lineTo(isoX + cellSize * 0.5, isoY + cellSize * 0.25);
                    ctx.lineTo(isoX, isoY + cellSize * 0.5);
                    ctx.lineTo(isoX, isoY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Left face
                    ctx.fillStyle = "#2a60b2";
                    ctx.beginPath();
                    ctx.moveTo(isoX - cellSize * 0.5, isoY - cellSize * 0.25);
                    ctx.lineTo(isoX - cellSize * 0.5, isoY + cellSize * 0.25);
                    ctx.lineTo(isoX, isoY + cellSize * 0.5);
                    ctx.lineTo(isoX, isoY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                } else {
                    // Draw floor tile
                    ctx.fillStyle = tile === "hole" ? "#000000" : "#1a2540";
                    ctx.strokeStyle = tile === "hole" ? "#8b5cf6" : "#4a90e2";
                    ctx.lineWidth = 1;

                    ctx.beginPath();
                    ctx.moveTo(isoX, isoY);
                    ctx.lineTo(isoX + cellSize * 0.5, isoY + cellSize * 0.25);
                    ctx.lineTo(isoX, isoY + cellSize * 0.5);
                    ctx.lineTo(isoX - cellSize * 0.5, isoY + cellSize * 0.25);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Draw special markers
                    if (tile === "start") {
                        ctx.fillStyle = "#4ade80";
                        ctx.font = "bold 16px Arial";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText("S", isoX, isoY + cellSize * 0.25);
                    } else if (tile === "goal") {
                        ctx.fillStyle = "#ef4444";
                        ctx.font = "bold 16px Arial";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText("G", isoX, isoY + cellSize * 0.25);
                    }
                }
            }
        }

        // Draw robot
        const robotIsoX =
            (robotState.x - robotState.y) * cellSize * 0.5 + offsetX;
        const robotIsoY =
            (robotState.x + robotState.y) * cellSize * 0.25 + offsetY;

        // Robot body
        ctx.fillStyle = "#60d5ff";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(
            robotIsoX,
            robotIsoY + cellSize * 0.25,
            cellSize * 0.2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();

        // Robot direction indicator
        const directionAngles = {
            north: -Math.PI / 2,
            east: 0,
            south: Math.PI / 2,
            west: Math.PI,
        };
        const angle = directionAngles[robotState.direction];

        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(robotIsoX, robotIsoY + cellSize * 0.25);
        ctx.lineTo(
            robotIsoX + Math.cos(angle) * cellSize * 0.25,
            robotIsoY + cellSize * 0.25 + Math.sin(angle) * cellSize * 0.25
        );
        ctx.stroke();
    }, [maze, robotState]);

    return (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-neon-cyan/30 bg-space-dark">
            <canvas ref={canvasRef} className="h-full w-full" />
        </div>
    );
}
