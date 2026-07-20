import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/shared/ui";

import { DeleteConfirmDialog } from "./delete-confirm-dialog";

/** 開閉を持つデモラッパ（削除要求 → ［けす］/［やめる］で閉じる流れを模す）。 */
const DeleteConfirmDemo = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button tone="destructive" onClick={() => setOpen(true)}>
        「前にすすむ」を けす
      </Button>
      <DeleteConfirmDialog
        open={open}
        targetLabel="前にすすむ"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

const meta = {
  title: "widgets/ar-stage/DeleteConfirmDialog",
  component: DeleteConfirmDialog,
  args: {
    open: true,
    targetLabel: "前にすすむ",
    onConfirm: () => {},
    onCancel: () => {},
  },
  argTypes: {
    open: { control: false },
    onConfirm: { control: false },
    onCancel: { control: false },
  },
} satisfies Meta<typeof DeleteConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 葉コマンドの削除確認（初期フォーカスは［やめる］・外側クリックでは閉じない・Esc は
 * キャンセル扱い）。明暗はツールバーのテーマトグルで両方確認する。
 */
export const LeafCommand: Story = {};

/** loop の削除確認（表示名は「くりかえし」）。 */
export const LoopCommand: Story = {
  args: { targetLabel: "くりかえし" },
};

/** 削除要求 → 確定/キャンセルの流れを操作できる Playground。 */
export const Interactive: Story = {
  render: () => <DeleteConfirmDemo />,
};
