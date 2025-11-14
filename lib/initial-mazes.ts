import type { MazeData } from "./types"

export function getInitialMazes(): MazeData[] {
    return [
        {
            id: "maze1",
            name: "順次処理1",
            size: 5,
            grid: [
                ["start", "floor", "floor", "wall", "wall"],
                ["floor", "wall", "floor", "wall", "wall"],
                ["floor", "floor", "floor", "goal", "wall"],
                ["wall", "wall", "wall", "wall", "wall"],
                ["floor", "floor", "floor", "floor", "floor"],
            ],
        },
        {
            id: "maze2",
            name: "順次処理2",
            size: 5,
            grid: [
                ["start", "wall", "wall", "wall", "floor"],
                ["floor", "floor", "floor", "wall", "floor"],
                ["wall", "wall", "floor", "wall", "floor"],
                ["goal", "floor", "floor", "wall", "floor"],
                ["wall", "wall", "wall", "wall", "floor"],
            ],
        },
        {
            id: "maze3",
            name: "順次処理+繰り返し1",
            size: 5,
            grid: [
                ["start", "floor", "floor", "floor", "floor"],
                ["floor", "wall", "wall", "wall", "floor"],
                ["floor", "wall", "floor", "wall", "floor"],
                ["floor", "wall", "wall", "wall", "floor"],
                ["floor", "floor", "floor", "floor", "goal"],
            ],
        },
        {
            id: "maze4",
            name: "順次処理+繰り返し2",
            size: 5,
            grid: [
                ["start", "wall", "goal", "floor", "wall"],
                ["floor", "wall", "wall", "floor", "wall"],
                ["floor", "wall", "wall", "floor", "wall"],
                ["floor", "floor", "floor", "floor", "wall"],
                ["wall", "wall", "wall", "wall", "wall"],
            ],
        },
        {
            id: "maze5",
            name: "順次処理+条件1",
            size: 5,
            grid: [
                ["start", "wall", "floor", "floor", "floor"],
                ["hole", "wall", "floor", "floor", "floor"],
                ["goal", "wall", "floor", "floor", "floor"],
                ["floor", "floor", "floor", "floor", "floor"],
                ["floor", "floor", "floor", "floor", "floor"],
            ],
        },
        {
            id: "maze6",
            name: "順次処理+条件2",
            size: 5,
            grid: [
                ["start", "wall", "wall", "wall", "wall"],
                ["hole", "floor", "hole", "goal", "wall"],
                ["wall", "wall", "wall", "wall", "wall"],
                ["floor", "floor", "floor", "floor", "floor"],
                ["floor", "floor", "floor", "floor", "floor"],
            ],
        },
        {
            id: "maze7",
            name: "順次処理+繰り返し+条件1",
            size: 5,
            grid: [
                ["start", "floor", "floor", "floor", "floor"],
                ["floor", "wall", "floor", "wall", "floor"],
                ["floor", "floor", "floor", "floor", "floor"],
                ["floor", "wall", "floor", "wall", "floor"],
                ["floor", "floor", "floor", "floor", "goal"],
            ],
        },
        {
            id: "maze8",
            name: "順次処理+繰り返し+条件2",
            size: 5,
            grid: [
                ["start", "wall", "floor", "floor", "floor"],
                ["floor", "wall", "floor", "wall", "floor"],
                ["hole", "floor", "hole", "wall", "floor"],
                ["wall", "wall", "wall", "wall", "floor"],
                ["goal", "floor", "floor", "floor", "floor"],
            ],
        },
        {
            id: "maze9",
            name: "順次処理+繰り返し+条件3",
            size: 5,
            grid: [
                ["start", "wall", "goal", "hole", "wall"],
                ["hole", "wall", "wall", "hole", "wall"],
                ["hole", "wall", "wall", "hole", "wall"],
                ["hole", "hole", "hole", "hole", "wall"],
                ["wall", "wall", "wall", "wall", "wall"],
            ],
        },
        {
            id: "maze10",
            name: "順次処理+繰り返し+条件4",
            size: 5,
            grid: [
                ["start", "wall", "floor", "floor", "floor"],
                ["floor", "wall", "floor", "floor", "floor"],
                ["hole", "wall", "floor", "floor", "floor"],
                ["floor", "wall", "wall", "wall", "wall"],
                ["hole", "hole", "floor", "hole", "goal"],
            ],
        },
    ]
}
