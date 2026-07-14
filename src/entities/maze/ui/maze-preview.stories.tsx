import type { Meta, StoryObj } from "@storybook/react-vite";

import { createInitialMaze } from "../lib/create-initial-maze";
import { TILE_KIND } from "../model/types";
import type { Maze, MazeStructure } from "../model/types";
import { MazePreview } from "./maze-preview";

/** 構造コアにダミーの永続メタを足して完全な Maze にする（表示確認用）。 */
const toMaze = (structure: MazeStructure, name = "サンプル迷路"): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name,
  folderId: "00000000-0000-0000-0000-000000000000",
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...structure,
});

/** 全タイル種別を 1 階に散りばめたサンプル（5×5）。 */
const allTilesMaze = (): Maze => {
  const structure = createInitialMaze(5, 1);
  const tiles = structure.tiles.map((floor) => floor.map((row) => [...row]));
  tiles[0][0][2] = TILE_KIND.WALL;
  tiles[0][1][1] = TILE_KIND.HOLE;
  tiles[0][2][3] = TILE_KIND.KEY;
  tiles[0][3][0] = TILE_KIND.TELEPORT_UP;
  tiles[0][3][4] = TILE_KIND.TELEPORT_DOWN;
  return toMaze({ ...structure, tiles }, "全タイル");
};

/** 2 階建て。1 階に start と上りテレポート、2 階に下りテレポート・カギ・goal。 */
const twoFloorMaze = (): Maze => {
  const structure = createInitialMaze(5, 2);
  const tiles = structure.tiles.map((floor) => floor.map((row) => [...row]));
  // 既定の start[0][0][0] / goal[0][4][4] を作り直す。
  tiles[0][4][4] = TILE_KIND.FLOOR;
  tiles[0][2][2] = TILE_KIND.TELEPORT_UP;
  tiles[1][2][2] = TILE_KIND.TELEPORT_DOWN;
  tiles[1][1][3] = TILE_KIND.KEY;
  tiles[1][4][4] = TILE_KIND.GOAL;
  return toMaze({ ...structure, tiles }, "2 階建て");
};

const meta = {
  title: "entities/maze/MazePreview",
  component: MazePreview,
  args: { maze: allTilesMaze() },
  argTypes: {
    maze: { control: false },
    floor: { control: { type: "number", min: 0 } },
    className: { control: false },
  },
} satisfies Meta<typeof MazePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 全タイル種別（既定はスタートのある階＝1 階）。 */
export const AllTiles: Story = {};

/** 作成直後の初期迷路（全床 + 左上 start / 右下 goal）。 */
export const InitialMaze: Story = {
  args: { maze: toMaze(createInitialMaze(), "新しい迷路") },
};

/** 2 階建ての各階を並べて表示（floor 指定）。 */
export const MultiFloor: Story = {
  args: { maze: twoFloorMaze() },
  render: (args) => (
    <div className="flex items-start gap-6">
      {args.maze.tiles.map((_, floor) => (
        <div key={floor} className="flex flex-col items-center gap-2">
          <span className="text-foreground text-sm">{floor + 1} 階</span>
          <MazePreview maze={args.maze} floor={floor} className="w-40" />
        </div>
      ))}
    </div>
  ),
};

/** サイズ 5・6・7 の比較。 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      {[5, 6, 7].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <span className="text-foreground text-sm">{`${size}×${size}`}</span>
          <MazePreview maze={toMaze(createInitialMaze(size))} className="w-40" />
        </div>
      ))}
    </div>
  ),
};
