import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { FAILURE_REASON } from "@/features/maze-simulation";
import { Button } from "@/shared/ui";

import { ResultFailureDialog } from "./result-failure-dialog";

/** 開閉を持つデモラッパ（失敗 → ［もういちど］で編集へ戻る流れを模す）。 */
const FailureDemo = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button tone="destructive" onClick={() => setOpen(true)}>
        しっぱいしたことにする
      </Button>
      <ResultFailureDialog
        open={open}
        failureReason={FAILURE_REASON.WALL_COLLISION}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

const meta = {
  title: "widgets/ar-stage/ResultFailureDialog",
  component: ResultFailureDialog,
  args: {
    open: true,
    failureReason: FAILURE_REASON.WALL_COLLISION,
    onClose: () => {},
  },
  argTypes: {
    open: { control: false },
    failureReason: { control: "select", options: Object.values(FAILURE_REASON) },
    onClose: { control: false },
  },
} satisfies Meta<typeof ResultFailureDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 壁に衝突（destructive トーン＋アイコン）。failureReason は control で全種切替可能。 */
export const WallCollision: Story = {};

/** 穴に落下。 */
export const HoleFall: Story = {
  args: { failureReason: FAILURE_REASON.HOLE_FALL },
};

/** カギ不足でゴール。 */
export const GoalBeforeKeys: Story = {
  args: { failureReason: FAILURE_REASON.GOAL_BEFORE_KEYS },
};

/** 命令が尽きた。 */
export const CommandExhausted: Story = {
  args: { failureReason: FAILURE_REASON.COMMAND_EXHAUSTED },
};

/** ［もういちど］で閉じる流れを操作できる Playground。 */
export const Interactive: Story = {
  render: () => <FailureDemo />,
};
