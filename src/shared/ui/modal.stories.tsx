import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, CircleCheck, Info, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "./button";
import { Modal } from "./modal";
import type { ModalProps } from "./modal";

type DemoProps = Omit<ModalProps, "open" | "onOpenChange"> & { triggerLabel?: string };

/** トリガー Button で開閉状態を持つデモラッパ（Modal は制御コンポーネント）。 */
const ModalDemo = ({ triggerLabel = "モーダルを開く", ...props }: DemoProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Modal {...props} open={open} onOpenChange={setOpen} />
    </>
  );
};

const meta = {
  title: "shared/ui/Modal",
  component: Modal,
  args: {
    open: false,
    onOpenChange: () => {},
    title: "おしらせ",
    tone: "neutral",
    size: "md",
    dismissible: true,
  },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["neutral", "primary", "success", "destructive", "warning"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    open: { control: false },
    onOpenChange: { control: false },
    icon: { control: false },
    title: { control: false },
    children: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 通知（footer 無し・× で閉じる）。 */
export const Notification: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      tone="primary"
      icon={<Info aria-hidden="true" />}
      title="ミッションをクリアしました！"
      description="つぎのめいろにすすめます。"
    >
      よくできました。ロボットがゴールにとうちゃくしました。
    </ModalDemo>
  ),
};

/** アクション付き（footer に Button×2）。 */
export const WithActions: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      tone="primary"
      icon={<Info aria-hidden="true" />}
      title="へんこうを ほぞんしますか？"
      description="いまの めいろの ないようを ほぞんします。"
      footer={
        <>
          <Button variant="ghost" tone="neutral">
            キャンセル
          </Button>
          <Button tone="primary">ほぞんする</Button>
        </>
      }
    >
      へんしゅうした めいろを ほぞんして よろしいですか？
    </ModalDemo>
  ),
};

/** 成功トーン（色 + アイコンの対で識別。明暗はテーマトグルで両方確認）。 */
export const SuccessTone: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      tone="success"
      icon={<CircleCheck aria-hidden="true" />}
      triggerLabel="成功トーンを開く"
      title="ゴールに とうちゃく！"
      description="すべての ミッションを たっせいしました。"
    >
      色だけでなくアイコン（チェック）でも「成功」を伝える例です。
    </ModalDemo>
  ),
};

/** 破壊的トーン（削除確認・footer に Button×2）。 */
export const DestructiveTone: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      tone="destructive"
      icon={<Trash2 aria-hidden="true" />}
      triggerLabel="破壊的トーンを開く"
      title="めいろを さくじょしますか？"
      description="この そうさは もとに もどせません。"
      footer={
        <>
          <Button variant="ghost" tone="neutral">
            キャンセル
          </Button>
          <Button tone="destructive">さくじょする</Button>
        </>
      }
    >
      「れんしゅう用めいろ」を さくじょします。ほんとうに よろしいですか？
    </ModalDemo>
  ),
};

/** 注意トーン（色 + アイコンの対で識別）。 */
export const WarningTone: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      tone="warning"
      icon={<TriangleAlert aria-hidden="true" />}
      triggerLabel="注意トーンを開く"
      title="ほぞんされていません"
      description="へんこうを ほぞんせずに とじようとしています。"
    >
      色だけでなくアイコン（三角！）でも「注意」を伝える例です。
    </ModalDemo>
  ),
};

/** dismissible=false（× 非表示・Esc / 外側クリックで閉じない。footer のボタンでのみ閉じる）。 */
const NonDismissibleDemo = (args: Partial<ModalProps>) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>必須入力モーダルを開く</Button>
      <Modal
        {...args}
        open={open}
        onOpenChange={setOpen}
        dismissible={false}
        tone="warning"
        icon={<Bell aria-hidden="true" />}
        title="なまえを にゅうりょくしてください"
        description="Esc や 外側クリックでは とじられません。"
        footer={<Button onClick={() => setOpen(false)}>OK</Button>}
      >
        必須の操作が終わるまで閉じられないモーダルの例です。
      </Modal>
    </>
  );
};

export const NonDismissible: Story = {
  render: (args) => <NonDismissibleDemo {...args} />,
};

/** 長い本文（本文だけスクロール・背景はスクロールロック）。 */
export const LongContent: Story = {
  render: (args) => (
    <ModalDemo
      {...args}
      tone="neutral"
      icon={<Info aria-hidden="true" />}
      title="あそびかた"
      description="スクロールして さいごまで よんでください。"
      footer={<Button>とじる（読んだ）</Button>}
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i}>
            {i + 1}. カードを ならべて ロボットを うごかそう。前にすすむ・右にまがる・左にまがるを
            くみあわせて ゴールを めざします。うしろの がめんは スクロールしません。
          </p>
        ))}
      </div>
    </ModalDemo>
  ),
};
