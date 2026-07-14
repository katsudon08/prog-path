import { useEffect, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DIRECTION, ROBOT_ACTION } from "../model/types";
import type { Direction, Robot, RobotAction } from "../model/types";
import { Robot3d } from "./robot-3d";

const GRID = 5;

/** 中央マス（offset 基準）に指定の向きで立つロボット。 */
const robotAt = (row: number, col: number, direction: Direction): Robot => ({
  position: { floor: 0, row, col },
  direction,
  collectedKeys: [],
});

const meta = {
  title: "entities/robot/Robot3d",
  component: Robot3d,
  args: { robot: robotAt(2, 2, DIRECTION.NORTH), gridSize: GRID },
  argTypes: {
    robot: { control: false },
    action: { control: false },
    gridSize: { control: { type: "number", min: 1 } },
  },
  // Robot3d は Canvas 内でのみ描画できるため R3F シーンで包む。グリッドで向き・位置を把握しやすくする。
  decorators: [
    (Story) => (
      <div className="border-border bg-card size-105 overflow-hidden rounded-xl border">
        <Canvas camera={{ position: [4, 5, 5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[6, 8, 4]} intensity={1.1} />
          <gridHelper args={[GRID, GRID, "#8b8d98", "#d0d0d5"]} />
          <Story />
          <OrbitControls />
        </Canvas>
      </div>
    ),
  ],
} satisfies Meta<typeof Robot3d>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 北向き（グリッド奥＝-z 方向へノーズ）。 */
export const FacingNorth: Story = {};

/** 東向き（+x 方向へノーズ）。 */
export const FacingEast: Story = {
  args: { robot: robotAt(2, 2, DIRECTION.EAST) },
};

/** 南向き（+z 方向へノーズ）。 */
export const FacingSouth: Story = {
  args: { robot: robotAt(2, 2, DIRECTION.SOUTH) },
};

/** 西向き（-x 方向へノーズ）。 */
export const FacingWest: Story = {
  args: { robot: robotAt(2, 2, DIRECTION.WEST) },
};

// 各ステップ = ロボット状態 + 任意の一発アニメ。約 1.1 秒ごとに次へ進み、末尾でループする。
const PLAYTHROUGH_STEPS: { robot: Robot; action?: RobotAction }[] = [
  { robot: robotAt(2, 2, DIRECTION.NORTH) }, // 初期
  { robot: robotAt(1, 2, DIRECTION.NORTH) }, // 前進（北へ 1 マス）
  { robot: robotAt(1, 2, DIRECTION.EAST) }, // 右回転
  { robot: robotAt(1, 3, DIRECTION.EAST) }, // 前進（東へ 1 マス）
  { robot: robotAt(1, 3, DIRECTION.EAST), action: ROBOT_ACTION.FILL_HOLE }, // 穴埋め
  { robot: robotAt(1, 3, DIRECTION.EAST), action: ROBOT_ACTION.FALL }, // 落下
];

/** 前進・回転・穴埋め・落下 を順に再生するシーケンス（props を時間駆動で切替え）。 */
const PlaythroughDemo = (): React.JSX.Element => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % PLAYTHROUGH_STEPS.length);
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  const current = PLAYTHROUGH_STEPS[index];
  return <Robot3d robot={current.robot} action={current.action} gridSize={GRID} />;
};

/** 一連の動作（前進→回転→前進→穴埋め→落下→リセット）を自動再生する。 */
export const Playthrough: Story = {
  render: () => <PlaythroughDemo />,
};
