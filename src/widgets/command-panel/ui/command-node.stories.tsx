import type { Meta, StoryObj } from "@storybook/react-vite";

import { LOOP_COMMAND_KIND } from "@/entities/command";
import type { Command } from "@/entities/command";
import type { CommandPath } from "@/features/command-management";

import type { CommandTreeContext } from "./command-list";
import { CommandNode } from "./command-node";

const noop = (): void => {};

// 木全体で引き回す表示情報・コールバックの束。story ごとに一部だけ差し替える。
const baseContext: CommandTreeContext = {
  selected: undefined,
  activePath: undefined,
  readOnly: false,
  onSelectInsertionPoint: noop,
  onDeleteCommand: noop,
};

const LEAF: Command = { kind: "forward" };
const LEAF_PATH: CommandPath = [0];

const LOOP: Command = {
  kind: LOOP_COMMAND_KIND,
  count: 3,
  children: [{ kind: "forward" }, { kind: "turnRight" }],
};

const meta = {
  title: "widgets/command-panel/CommandNode",
  component: CommandNode,
  args: {
    command: LEAF,
    path: LEAF_PATH,
    context: baseContext,
  },
  argTypes: {
    command: { control: false },
    path: { control: false },
    context: { control: false },
  },
  // 固定幅カードに収め、行や loop の字下げの見え方を確認する。
  decorators: [
    (Story) => (
      <div className="border-border bg-card w-80 rounded-xl border p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommandNode>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 葉ノード 1 個（命令チップ＋削除ボタン）。 */
export const Leaf: Story = {};

/** 実行中ノード（activePath がこのパスと一致 → ring 強調＋オートスクロール）。 */
export const Active: Story = {
  args: { context: { ...baseContext, activePath: [0] } },
};

/** loop ノード（字下げした子リストを続けて描く）。 */
export const Loop: Story = {
  args: { command: LOOP },
};

/** 表示専用（readOnly）。削除ボタンを出さない。 */
export const ReadOnly: Story = {
  args: { context: { ...baseContext, readOnly: true } },
};
