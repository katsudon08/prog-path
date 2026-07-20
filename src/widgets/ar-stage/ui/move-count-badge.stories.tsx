import type { Meta, StoryObj } from "@storybook/react-vite";

import { MoveCountBadge } from "./move-count-badge";

const meta = {
  title: "widgets/ar-stage/MoveCountBadge",
  component: MoveCountBadge,
  args: { moveCount: 0 },
  argTypes: {
    moveCount: { control: { type: "number", min: 0 } },
    className: { control: false },
  },
} satisfies Meta<typeof MoveCountBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 未実行（0 かい）。 */
export const Zero: Story = {};

/** 実行中の途中経過。 */
export const Counting: Story = {
  args: { moveCount: 12 },
};

/** 大きな数（3 桁でもレイアウトが崩れない）。 */
export const LargeCount: Story = {
  args: { moveCount: 128 },
};
