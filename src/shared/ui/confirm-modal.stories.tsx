import type { Meta, StoryObj } from "@storybook/react-vite";
import { DoorOpen, Play, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "./button";
import { ConfirmModal } from "./confirm-modal";
import type { ConfirmModalProps } from "./confirm-modal";

type DemoProps = Omit<ConfirmModalProps, "open" | "onConfirm" | "onCancel"> & {
  triggerLabel?: string;
};

/** トリガー Button で開閉状態を持つデモラッパ（ConfirmModal は制御コンポーネント）。 */
const ConfirmModalDemo = ({
  triggerLabel = "確認ダイアログを開く",
  ...props
}: DemoProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <ConfirmModal
        {...props}
        open={open}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

const meta = {
  title: "shared/ui/ConfirmModal",
  component: ConfirmModal,
  args: {
    open: false,
    title: "けす？",
    confirmLabel: "けす",
    cancelLabel: "やめる",
    tone: "destructive",
    size: "sm",
    onConfirm: () => {},
    onCancel: () => {},
  },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["neutral", "primary", "success", "destructive", "warning"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    open: { control: false },
    onConfirm: { control: false },
    onCancel: { control: false },
    icon: { control: false },
    title: { control: false },
    description: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 命令削除の確認（#239 の実例）。初期フォーカスは［やめる］、外側クリックでは閉じず、
 * Esc はキャンセル扱い。明暗はツールバーのテーマトグルで両方確認する。
 */
export const DeleteCommand: Story = {
  render: (args) => (
    <ConfirmModalDemo
      {...args}
      triggerLabel="めいれいを けす"
      icon={<Trash2 aria-hidden="true" />}
      title="「まえに すすむ」を けす？"
      description="けした めいれいは もとに もどせないよ"
      confirmLabel="けす"
    />
  ),
};

/** primary トーン（前向きな確定。確定ボタンも primary になる）。 */
export const PrimaryTone: Story = {
  render: (args) => (
    <ConfirmModalDemo
      {...args}
      tone="primary"
      triggerLabel="primary トーンを開く"
      icon={<Play aria-hidden="true" />}
      title="じっこうを はじめる？"
      description="いまの めいれいで ロボットが うごきだすよ"
      confirmLabel="はじめる"
    />
  ),
};

/** warning トーン（注意が要る確定。確定ボタンは destructive 寄りの写像）。 */
export const WarningTone: Story = {
  render: (args) => (
    <ConfirmModalDemo
      {...args}
      tone="warning"
      triggerLabel="warning トーンを開く"
      icon={<DoorOpen aria-hidden="true" />}
      title="ほぞんせずに とじる？"
      description="いま つくった ないようは きえてしまうよ"
      confirmLabel="とじる"
    />
  ),
};

/** 長い説明文（見出し・ボタンは崩れず、本文が折り返される）。 */
export const LongDescription: Story = {
  render: (args) => (
    <ConfirmModalDemo
      {...args}
      triggerLabel="長文の確認を開く"
      icon={<Trash2 aria-hidden="true" />}
      title="「くりかえし」を けす？"
      description={
        "「くりかえし」を けすと、なかに いれた めいれいも ぜんぶ いっしょに きえるよ。" +
        "もういちど つかいたいときは、QR カードを よみとって さいしょから つくりなおしてね。" +
        "ほんとうに けしても いいかな？"
      }
      confirmLabel="けす"
    />
  ),
};
