import type { Meta, StoryObj } from "@storybook/react-vite";

import { CommandItem } from "@/entities/command";

import { DeleteButton } from "./delete-button";

const noop = (): void => {};

const meta = {
  title: "widgets/command-panel/DeleteButton",
  component: DeleteButton,
  args: { onDelete: noop },
  argTypes: {
    onDelete: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="border-border bg-card w-72 rounded-xl border p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DeleteButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 単体の削除ボタン。hover で destructive 色、focus でリングが出る。 */
export const Default: Story = {};

/** 命令行の文脈（命令チップの右端に配置）で確認する。 */
export const InRow: Story = {
  render: (args) => (
    <div className="flex items-center gap-2 rounded-lg p-1">
      <CommandItem kind="forward" />
      <DeleteButton {...args} className="ml-auto" />
    </div>
  ),
};
