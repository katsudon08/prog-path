import type { Meta, StoryObj } from "@storybook/react-vite";
import { use } from "react";

import { AsyncBoundary } from "./async-boundary";

// 解決しない Promise（pending fallback を見せるための固定インスタンス）。
const NEVER_SETTLE: Promise<void> = new Promise<void>(() => undefined);

const Pending = (): React.JSX.Element => {
  use(NEVER_SETTLE);
  return <p>ここは表示されない</p>;
};

const Boom = (): React.JSX.Element => {
  throw new Error("わざと エラーを おこしました");
};

const meta = {
  title: "shared/ui/AsyncBoundary",
  component: AsyncBoundary,
  // children は各 story の render で与えるためダミー（型を満たすためだけの既定値）。
  args: { children: null },
} satisfies Meta<typeof AsyncBoundary>;

export default meta;

type Story = StoryObj<typeof meta>;

/** サスペンド中は pending fallback（既定 `LoadingView`）を表示する。 */
export const Suspended: Story = {
  render: () => (
    <AsyncBoundary>
      <Pending />
    </AsyncBoundary>
  ),
};

/** 子が throw するとエラー fallback（既定 `ErrorView` ＋リトライ）を表示する。 */
export const Errored: Story = {
  render: () => (
    <AsyncBoundary>
      <Boom />
    </AsyncBoundary>
  ),
};
