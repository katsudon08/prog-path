import type { Meta, StoryObj } from "@storybook/react-vite";

import { createInitialMaze, TILE_KIND } from "@/entities/maze";
import type { Maze, MazeStructure } from "@/entities/maze";
import { DIRECTION, ROBOT_ACTION } from "@/entities/robot";
import type { Robot } from "@/entities/robot";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { ArScene } from "./ar-scene";

/** 構造コアへ永続メタを付与して Maze 化する（stories 用の固定値）。 */
const toMaze = (structure: MazeStructure, name: string): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name,
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 0,
  updatedAt: 0,
  ...structure,
});

/** 壁・穴・カギ入りの 1 階建て 5x5。 */
const createSingleFloorMaze = (): Maze => {
  const structure = createInitialMaze(5, 1);
  structure.tiles[0][1][1] = TILE_KIND.WALL;
  structure.tiles[0][1][2] = TILE_KIND.WALL;
  structure.tiles[0][3][1] = TILE_KIND.HOLE;
  structure.tiles[0][2][3] = TILE_KIND.KEY;
  return toMaze(structure, "1かいだての迷路");
};

/** テレポート付きの 3 階建て 5x5。 */
const createMultiFloorMaze = (): Maze => {
  const structure = createInitialMaze(5, 3);
  structure.tiles[0][2][2] = TILE_KIND.TELEPORT_UP;
  structure.tiles[1][2][2] = TILE_KIND.TELEPORT_DOWN;
  structure.tiles[1][4][0] = TILE_KIND.TELEPORT_UP;
  structure.tiles[2][4][0] = TILE_KIND.TELEPORT_DOWN;
  structure.tiles[2][0][4] = TILE_KIND.KEY;
  return toMaze(structure, "3かいだての迷路");
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
  title: "widgets/ar-stage/ArScene",
  component: ArScene,
  args: {
    maze: createSingleFloorMaze(),
    robot: null,
    robotAction: null,
  },
  argTypes: {
    maze: { control: false },
    robot: { control: false },
    robotAction: { control: false },
    className: { control: false },
  },
  // Canvas は透過（gl.alpha）のため、背景にトークンの縞模様を敷いて透けを確認できるようにする。
  decorators: [
    (Story) => (
      <div
        className="border-border relative h-[28rem] w-[40rem] max-w-full overflow-hidden rounded-xl border"
        style={{
          background:
            "repeating-linear-gradient(45deg, var(--color-muted) 0 24px, var(--color-accent) 24px 48px)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArScene>;

export default meta;

type Story = StoryObj<typeof meta>;

/** robot=null（未実行）。スタート位置の初期姿勢（南向き）を表示する。 */
export const Idle: Story = {};

/** 実行中相当（ロボットが盤面中央・東向き）。 */
export const RobotMoved: Story = {
  args: { robot: robotAt(0, 2, 2, DIRECTION.EAST) },
};

/** 落下アニメ（穴へ進入した失敗表現）。 */
export const RobotFalling: Story = {
  args: { robot: robotAt(0, 3, 1, DIRECTION.SOUTH), robotAction: ROBOT_ACTION.FALL },
};

/** 3 階建て（全階が縦に積まれ、フレーミングが全体を収める）。 */
export const MultiFloor: Story = {
  args: { maze: createMultiFloorMaze(), robot: robotAt(1, 2, 2, DIRECTION.NORTH) },
};
