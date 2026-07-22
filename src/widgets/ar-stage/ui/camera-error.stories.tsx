import type { Meta, StoryObj } from "@storybook/react-vite";

import { CAMERA_ERROR_CODE } from "@/shared/camera";

import { CameraError } from "./camera-error";

const meta = {
  title: "widgets/ar-stage/CameraError",
  component: CameraError,
  args: {
    errorCode: CAMERA_ERROR_CODE.PERMISSION_DENIED,
    onRetry: () => {},
  },
  argTypes: {
    errorCode: { control: "select", options: Object.values(CAMERA_ERROR_CODE) },
    onRetry: { control: false },
    className: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="border-border h-96 w-[36rem] max-w-full overflow-hidden rounded-xl border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CameraError>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 権限拒否（再試行ボタンあり）。 */
export const PermissionDenied: Story = {};

/** カメラ未接続（再試行ボタンあり）。 */
export const DeviceNotFound: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.DEVICE_NOT_FOUND },
};

/** 他アプリ使用中（再試行ボタンあり）。 */
export const DeviceUnavailable: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.DEVICE_UNAVAILABLE },
};

/** 制約不一致（再試行ボタンあり）。 */
export const ConstraintsUnsatisfied: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.CONSTRAINTS_UNSATISFIED },
};

/** 不正状態（再試行ボタンあり）。 */
export const InvalidState: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.INVALID_STATE },
};

/** タイムアウト（再試行ボタンあり）。 */
export const Timeout: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.TIMEOUT },
};

/** 中断（再試行ボタンあり）。 */
export const Aborted: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.ABORTED },
};

/** 原因不明（再試行ボタンあり）。 */
export const Unknown: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.UNKNOWN },
};

/** 非セキュアコンテキスト（環境要因のため再試行ボタン無し・案内のみ）。 */
export const InsecureContext: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.INSECURE_CONTEXT },
};

/** カメラ API 非対応（環境要因のため再試行ボタン無し・案内のみ）。 */
export const Unsupported: Story = {
  args: { errorCode: CAMERA_ERROR_CODE.UNSUPPORTED },
};
