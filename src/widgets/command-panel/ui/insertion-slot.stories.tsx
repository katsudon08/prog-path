import type { Meta, StoryObj } from "@storybook/react-vite";

import type { InsertionPoint } from "@/features/command-management";

import { InsertionSlot } from "./insertion-slot";

// 位置選択の通知先・対象位置は見た目に無関係なので固定値／noop にする。
const POINT: InsertionPoint = { containerPath: [], index: 0 };
const noop = (): void => {};

const meta = {
  title: "widgets/command-panel/InsertionSlot",
  component: InsertionSlot,
  args: {
    point: POINT,
    selected: false,
    isTail: false,
    onSelect: noop,
  },
  argTypes: {
    point: { control: false },
    onSelect: { control: false },
  },
  // w-full のラインボタンなので、幅を持つ箱に収めて見た目を確認する。
  decorators: [
    (Story) => (
      <div className="border-border bg-card w-72 rounded-xl border p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InsertionSlot>;

export default meta;

type Story = StoryObj<typeof meta>;

/** selected / isTail を control で切り替えて確認する。 */
export const Playground: Story = {};

/** 既定（未選択・非末尾）。細いラインで、ラベルは hover で現れる。 */
export const Default: Story = { args: { selected: false, isTail: false } };

/** 選択中（primary で強調・ラベル「ここ」を常時表示）。 */
export const Selected: Story = { args: { selected: true } };

/** 末尾スロット（「さいごに」・少し背を高く）。 */
export const Tail: Story = { args: { isTail: true } };

/** 末尾かつ選択中。 */
export const SelectedTail: Story = { args: { selected: true, isTail: true } };

/** 4 状態を縦に並べて識別性を確認する。 */
export const AllStates: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <InsertionSlot {...args} selected={false} isTail={false} />
      <InsertionSlot {...args} selected isTail={false} />
      <InsertionSlot {...args} selected={false} isTail />
      <InsertionSlot {...args} selected isTail />
    </div>
  ),
};
