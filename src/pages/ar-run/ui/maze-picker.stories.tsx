import type { Meta, StoryObj } from "@storybook/react-vite";

import { buildTutorialMazes } from "@/shared/db";

import { MazePicker } from "./maze-picker";

/** チュートリアル迷路 6 件（易→難のカリキュラム順）。 */
const TUTORIAL_MAZES = buildTutorialMazes();

const meta = {
  title: "pages/ar-run/MazePicker",
  component: MazePicker,
  args: {
    mazes: TUTORIAL_MAZES,
    onSelect: () => {},
  },
  argTypes: {
    mazes: { control: false },
    onSelect: { control: false },
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
} satisfies Meta<typeof MazePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初回起動時の状態（チュートリアル 6 件）。明暗はツールバーで両方確認する。 */
export const Default: Story = {};

/** 迷路が 1 件も無いとき（作り方の案内だけを出す）。 */
export const Empty: Story = {
  args: { mazes: [] },
};
