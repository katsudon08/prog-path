import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorView } from "./error-view";

const meta = {
  title: "shared/ui/ErrorView",
  component: ErrorView,
  args: {
    title: "エラーが おきました",
    error: new Error("データの よみこみに しっぱいしました"),
    retryLabel: "もういちど",
  },
  argTypes: {
    className: { control: false },
    error: { control: false },
    onRetry: { control: false },
  },
} satisfies Meta<typeof ErrorView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** リトライボタンあり。明暗はツールバーで両方確認する。 */
export const WithRetry: Story = {
  args: { onRetry: () => undefined },
};

/** リトライなし（`onRetry` 未指定）。 */
export const WithoutRetry: Story = {};
