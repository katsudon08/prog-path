import type { TileType } from "@/lib/types";

interface MazePreviewProps {
    grid: TileType[][];
}

export function MazePreview({ grid }: MazePreviewProps) {
    const getTileColor = (tile: TileType) => {
        switch (tile) {
            case "wall":
                return "bg-neon-blue/50";
            case "floor":
                return "bg-space-blue/30";
            case "hole":
                return "bg-neon-purple border border-purple-900";
            case "start":
                return "bg-neon-green";
            case "goal":
                return "bg-neon-red";
            default:
                return "bg-space-blue/30";
        }
    };

    return (
        <div className="inline-flex flex-col gap-0.5 rounded-lg border border-neon-blue bg-space-dark p-2">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-0.5">
                    {row.map((tile, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`h-6 w-6 rounded-sm ${getTileColor(
                                tile
                            )}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
