import type { Meta, StoryObj } from "@storybook/react-vite";

import { createInitialMaze, TILE_KIND } from "@/entities/maze";
import type { Maze, MazeStructure } from "@/entities/maze";
import { DIRECTION } from "@/entities/robot";
import type { Robot } from "@/entities/robot";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { MiniMap } from "./mini-map";

/** 構造コアへ永続メタを付与して Maze 化する（stories 用の固定値）。 */
const toMaze = (structure: MazeStructure, name: string): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name,
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 0,
  updatedAt: 0,
  ...structure,
});

const createTwoFloorMaze = (): Maze => {
  const structure = createInitialMaze(5, 2);
  structure.tiles[0][1][1] = TILE_KIND.WALL;
  structure.tiles[0][1][2] = TILE_KIND.WALL;
  structure.tiles[0][3][1] = TILE_KIND.HOLE;
  structure.tiles[0][2][2] = TILE_KIND.TELEPORT_UP;
  structure.tiles[1][2][2] = TILE_KIND.TELEPORT_DOWN;
  structure.tiles[1][0][4] = TILE_KIND.KEY;
  return toMaze(structure, "2かいだての迷路");
};

const robotAt = (
  floor: number,
  row: number,
  col: number,
  direction: Robot["direction"],
): Robot => ({
  position: { floor, row, col },
  direction,
  collectedKeys: [],
});

const meta = {
  title: "widgets/ar-stage/MiniMap",
  component: MiniMap,
  args: {
    maze: createTwoFloorMaze(),
    visibleFloor: 0,
    robot: robotAt(0, 0, 0, DIRECTION.SOUTH),
    className: "w-48",
  },
  argTypes: {
    maze: { control: false },
    robot: { control: false },
    visibleFloor: { control: { type: "number", min: 0, max: 1 } },
    className: { control: false },
  },
} satisfies Meta<typeof MiniMap>;

export default meta;

type Story = StoryObj<typeof meta>;

/** スタート位置・南向き（初期姿勢相当）。 */
export const AtStart: Story = {};

/** 盤面中央・東向き（マーカーの回転を確認）。 */
export const FacingEast: Story = {
  args: { robot: robotAt(0, 2, 3, DIRECTION.EAST) },
};

/** 北向き（上向き）。 */
export const FacingNorth: Story = {
  args: { robot: robotAt(0, 3, 1, DIRECTION.NORTH) },
};

/** 未実行（robot=null）。マーカー無しの俯瞰のみ。 */
export const NoRobot: Story = {
  args: { robot: null },
};

/** ロボットが別階（floor 0）にいるため、表示階（floor 1）ではマーカーを出さない。 */
export const RobotOnOtherFloor: Story = {
  args: { visibleFloor: 1, robot: robotAt(0, 2, 2, DIRECTION.SOUTH) },
};

/** 2 階を表示（テレポート下り・カギのある階）。 */
export const SecondFloor: Story = {
  args: { visibleFloor: 1, robot: robotAt(1, 2, 2, DIRECTION.WEST) },
};
