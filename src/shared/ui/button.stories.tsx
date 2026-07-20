import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";

import { Button } from "./button";
import type { ButtonTone, ButtonVariant } from "./button";

const VARIANTS: ButtonVariant[] = ["solid", "outline", "ghost"];
const TONES: ButtonTone[] = ["neutral", "primary", "destructive"];

const meta = {
  title: "shared/ui/Button",
  component: Button,
  args: { children: "ボタン", variant: "solid", tone: "primary", size: "md" },
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
    tone: { control: "inline-radio", options: TONES },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    className: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/** コントロールで variant / tone / size を切り替えて確認する。 */
export const Playground: Story = {};

/** variant（行）× tone（列）のマトリクス。明暗はツールバーのテーマトグルで両方確認する。 */
export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground w-16 text-sm">{variant}</span>
          {TONES.map((tone) => (
            <Button key={tone} variant={variant} tone={tone}>
              {tone}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** サイズ（sm=44px / md=48px / lg=56px のタップ領域）。 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">小</Button>
      <Button size="md">中</Button>
      <Button size="lg">大</Button>
    </div>
  ),
};

/** アイコン付き（`[&_svg]:size-5` で自動整形）。 */
export const WithIcon: Story = {
  args: { tone: "destructive", children: undefined },
  render: (args) => (
    <Button {...args}>
      <Trash2 aria-hidden="true" />
      削除する
    </Button>
  ),
};

/** 無効状態（`disabled`）。 */
export const Disabled: Story = {
  args: { disabled: true, children: "無効" },
};
