import type { Meta, StoryObj } from "@storybook/react-vite";

import { MazeUnavailable } from "./maze-unavailable";

const meta = {
  title: "pages/ar-run/MazeUnavailable",
  component: MazeUnavailable,
  args: {
    reason: "not-found",
    onBackToPicker: () => {},
  },
  argTypes: {
    reason: { control: "inline-radio", options: ["not-found", "unplayable"] },
    onBackToPicker: { control: false },
    className: { control: false },
  },
  // AppShell の `<main className="flex min-h-0 flex-1 flex-col">` を模した固定サイズ箱。
  decorators: [
    (Story) => (
      <div className="flex h-[44rem] w-[76rem] max-w-full flex-col overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MazeUnavailable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** `?mazeId` の迷路が無い（消された・古いリンク・行が壊れている）。 */
export const NotFound: Story = {};

/** 構造は正しいがテレポートの行き先が不正で実行できない（迷路名を添えて伝える）。 */
export const Unplayable: Story = {
  args: { reason: "unplayable", mazeName: "上の階へ" },
};
