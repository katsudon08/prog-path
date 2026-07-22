import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/shared/ui";

import { ResultSuccessDialog } from "./result-success-dialog";

/** 開閉を持つデモラッパ（成功 → ［とじる］で編集へ戻る流れを模す）。 */
const SuccessDemo = ({ moveCount }: { moveCount: number }): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>ゴールしたことにする</Button>
      <ResultSuccessDialog open={open} moveCount={moveCount} onClose={() => setOpen(false)} />
    </>
  );
};

const meta = {
  title: "widgets/ar-stage/ResultSuccessDialog",
  component: ResultSuccessDialog,
  args: {
    open: true,
    moveCount: 8,
    onClose: () => {},
  },
  argTypes: {
    open: { control: false },
    moveCount: { control: { type: "number", min: 0 } },
    onClose: { control: false },
  },
} satisfies Meta<typeof ResultSuccessDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 開いた状態（success トーン＋アイコン・移動回数付き）。 */
export const Open: Story = {};

/** 大きな移動回数でもレイアウトが崩れない。 */
export const LargeMoveCount: Story = {
  args: { moveCount: 128 },
};

/** ［とじる］で閉じる流れを操作できる Playground。 */
export const Interactive: Story = {
  render: () => <SuccessDemo moveCount={8} />,
};
