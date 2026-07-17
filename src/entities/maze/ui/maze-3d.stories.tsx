import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { createInitialMaze } from "../lib/create-initial-maze";
import { TILE_KIND } from "../model/types";
import type { Maze, MazeStructure } from "../model/types";
import { Maze3d } from "./maze-3d";

const toMaze = (structure: MazeStructure): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "サンプル迷路",
  folderId: "00000000-0000-0000-0000-000000000000",
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...structure,
});

/** 全タイル種別を 2 階に散りばめたサンプル（5×5）。 */
const allTilesMaze = (): Maze => {
  const structure = createInitialMaze(5, 2);
  const tiles = structure.tiles.map((floor) => floor.map((row) => [...row]));
  tiles[0][0][2] = TILE_KIND.WALL;
  tiles[0][1][1] = TILE_KIND.HOLE;
  tiles[0][2][3] = TILE_KIND.KEY;
  tiles[0][3][0] = TILE_KIND.TELEPORT_UP;
  tiles[1][3][4] = TILE_KIND.TELEPORT_DOWN;
  return toMaze({ ...structure, tiles });
};

const meta = {
  title: "entities/maze/Maze3d",
  component: Maze3d,
  args: { maze: allTilesMaze() },
  argTypes: { maze: { control: false } },
  // Maze3d は Canvas 内でのみ描画できるため、R3F シーン（カメラ・ライト・操作）で包む。
  decorators: [
    (Story) => (
      <div className="border-border bg-card size-105 overflow-hidden rounded-xl border">
        <Canvas camera={{ position: [5, 6, 5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[6, 8, 4]} intensity={1.1} />
          <Story />
          <OrbitControls />
        </Canvas>
      </div>
    ),
  ],
} satisfies Meta<typeof Maze3d>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 全タイル種別（1 階）。ドラッグで回転できる。 */
export const AllTiles: Story = {};

/** 作成直後の初期迷路（全床 + start/goal）。 */
export const InitialMaze: Story = {
  args: { maze: toMaze(createInitialMaze()) },
};

/** 3 階建て（階が y 方向に段で積まれる）。 */
export const MultiFloor: Story = {
  args: { maze: toMaze(createInitialMaze(5, 3)) },
};
