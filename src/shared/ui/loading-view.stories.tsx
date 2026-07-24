import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoadingView } from "./loading-view";

const meta = {
  title: "shared/ui/LoadingView",
  component: LoadingView,
  args: { label: "よみこみ中…", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    className: { control: false },
  },
} satisfies Meta<typeof LoadingView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** コントロールで size / label を切り替えて確認する。明暗はツールバーで両方確認する。 */
export const Playground: Story = {};

/** 大きさ 3 種（sm / md / lg）。 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-10">
      <LoadingView size="sm" label="小" />
      <LoadingView size="md" label="中" />
      <LoadingView size="lg" label="大" />
    </div>
  ),
};
