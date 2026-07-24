import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "app/routing/ThemeToggle",
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ライト / ダーク / じどう の 3 択。押すと実際にテーマが切り替わる（明暗を確認）。 */
export const Default: Story = {};
