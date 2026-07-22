import type { Meta, StoryObj } from "@storybook/react-vite";

import { RunControls } from "./run-controls";

const meta = {
  title: "widgets/ar-stage/RunControls",
  component: RunControls,
  args: {
    status: "idle",
    canRun: true,
    onRun: () => {},
    onPause: () => {},
    onResume: () => {},
    onReset: () => {},
  },
  argTypes: {
    status: {
      control: "inline-radio",
      options: ["idle", "running", "paused", "succeeded", "failed"],
    },
    onRun: { control: false },
    onPause: { control: false },
    onResume: { control: false },
    onReset: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof RunControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 編集中（実行可能）。［じっこう］のみ。 */
export const Idle: Story = {};

/** 編集中（命令が空などで実行不可）。［じっこう］が disabled。 */
export const IdleCannotRun: Story = {
  args: { canRun: false },
};

/** 実行中。［いちじていし］［リセット］。 */
export const Running: Story = {
  args: { status: "running" },
};

/** 一時停止中。［さいかい］［リセット］。 */
export const Paused: Story = {
  args: { status: "paused" },
};

/** 成功後。［リセット］のみ。 */
export const Succeeded: Story = {
  args: { status: "succeeded" },
};

/** 失敗後。［リセット］のみ。 */
export const Failed: Story = {
  args: { status: "failed" },
};
