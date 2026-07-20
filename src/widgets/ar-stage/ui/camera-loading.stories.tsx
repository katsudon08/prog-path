import type { Meta, StoryObj } from "@storybook/react-vite";

import { CameraLoading } from "./camera-loading";

const meta = {
  title: "widgets/ar-stage/CameraLoading",
  component: CameraLoading,
  argTypes: { className: { control: false } },
  // AR ステージ全面を占める表示のため、実寸感のある箱に収める。
  decorators: [
    (Story) => (
      <div className="border-border h-96 w-[36rem] max-w-full overflow-hidden rounded-xl border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CameraLoading>;

export default meta;

type Story = StoryObj<typeof meta>;

/** カメラ取得待ち（スピナー＋児童向け文言）。明暗はテーマトグルで両方確認。 */
export const Default: Story = {};
