import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/shared/ui";

import { UnclosedLoopDialog } from "./unclosed-loop-dialog";

/** ［じっこう］押下 → 警告 → ［わかった］で閉じる、実機と同じ流れを模したデモ。 */
const UnclosedLoopDemo = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>じっこう</Button>
      <UnclosedLoopDialog open={open} openLoopCount={1} onClose={() => setOpen(false)} />
    </>
  );
};

const meta = {
  title: "widgets/ar-stage/UnclosedLoopDialog",
  component: UnclosedLoopDialog,
  args: {
    open: true,
    openLoopCount: 1,
    onClose: () => {},
  },
  argTypes: {
    open: { control: false },
    onClose: { control: false },
  },
} satisfies Meta<typeof UnclosedLoopDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 未完了ループ 1 個での警告。閉じる手段は［わかった］だけ（`dismissible=false`）で、
 * 次にとる行動（「くりかえし おわり」を読む）を本文で示す。明暗はテーマトグルで両方確認する。
 */
export const Single: Story = {};

/** ネストして 2 個残っている場合。数を出して「あと何個閉じるか」を伝える。 */
export const Nested: Story = {
  args: { openLoopCount: 2 },
};

/** ［じっこう］→ 警告 → ［わかった］の流れを操作できる Playground。 */
export const Interactive: Story = {
  render: () => <UnclosedLoopDemo />,
};
