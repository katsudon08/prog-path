import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/shared/ui";

import { LoopCountDialog } from "./loop-count-dialog";

/** 開閉と確定結果を持つデモラッパ（loopStart 読み取り → 回数確定の流れを模す）。 */
const LoopCountDialogDemo = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string>("まだ えらんでいないよ");

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)}>ループカードを よんだことにする</Button>
      <p className="text-foreground text-base">{result}</p>
      <LoopCountDialog
        open={open}
        onConfirm={(count) => {
          setResult(`${count} かい くりかえすことに きめたよ`);
          setOpen(false);
        }}
        onCancel={() => {
          setResult("ループを やめたよ");
          setOpen(false);
        }}
      />
    </div>
  );
};

const meta = {
  title: "widgets/ar-stage/LoopCountDialog",
  component: LoopCountDialog,
  args: {
    open: false,
    onConfirm: () => {},
    onCancel: () => {},
  },
  argTypes: {
    open: { control: false },
    onConfirm: { control: false },
    onCancel: { control: false },
  },
} satisfies Meta<typeof LoopCountDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** −/＋で回数を選び［けってい］/［やめる］する流れ（Esc・外側クリックでは閉じない）。 */
export const Interactive: Story = {
  render: () => <LoopCountDialogDemo />,
};

/** 開いた状態（既定は最小値の 2）。 */
export const Open: Story = {
  args: { open: true },
};
