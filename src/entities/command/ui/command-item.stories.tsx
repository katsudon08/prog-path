import type { Meta, StoryObj } from "@storybook/react-vite";

import { COMMAND_VISUALS } from "../model/command-visual";
import type { CommandVisualKey } from "../model/command-visual";
import { CommandItem } from "./command-item";

const KEYS = Object.keys(COMMAND_VISUALS) as CommandVisualKey[];

const meta = {
  title: "entities/command/CommandItem",
  component: CommandItem,
  args: { kind: "forward" },
  argTypes: {
    kind: { control: "select", options: KEYS },
    count: { control: { type: "number", min: 2, max: 10 } },
    className: { control: false },
  },
} satisfies Meta<typeof CommandItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** コントロールで kind / count を切り替えて確認する。 */
export const Playground: Story = {};

/** ループノード（回数 ×N 付き）。 */
export const Loop: Story = { args: { kind: "loop", count: 3 } };

/** 全識別子を一覧表示（色 + アイコン + 名称の識別性を確認）。 */
export const AllKinds: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {KEYS.map((kind) => (
        <CommandItem key={kind} kind={kind} />
      ))}
    </div>
  ),
};
