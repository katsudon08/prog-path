import { useMemo } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { COMMAND_KIND, COMMAND_VISUALS } from "@/entities/command";
import type { CommandKind } from "@/entities/command";
import { createInitialMaze } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import { CAMERA_ERROR_CODE, CameraAccessError } from "@/shared/camera";
import type { CameraErrorCode, CameraSession } from "@/shared/camera";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";
import { Button } from "@/shared/ui";

import { useArStage } from "../model/use-ar-stage";
import type { OpenCameraFn } from "../model/use-camera-stream";
import { ArStage } from "./ar-stage";

// ---- stories 用フェイク -------------------------------------------------------

/** 構造コアへ永続メタを付与して Maze 化する（stories 用の固定値）。 */
const createStoryMaze = (size: number, floors: number): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "ARステージ確認用の迷路",
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 0,
  updatedAt: 0,
  ...createInitialMaze(size, floors),
});

/**
 * canvas に動く模様を描いて captureStream() する、CameraSession 互換のフェイクカメラ。
 * 実カメラ権限に依存せず「maze を渡すだけで動く」体験を再現する。
 */
const fakeOpenCamera: OpenCameraFn = async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  const context = canvas.getContext("2d");
  let frame = 0;
  const draw = (): void => {
    if (!context) return;
    frame += 1;
    // フェイク映像の色は canvas 2D 専用（DOM のトークン運用対象外）。机の上のイメージ。
    context.fillStyle = "#7a6a55";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f5f1e8";
    context.fillRect(120, 80, 720, 380);
    context.strokeStyle = "#c8bfae";
    context.lineWidth = 3;
    for (let i = 0; i < 6; i += 1) {
      context.strokeRect(160 + i * 110, 130, 90, 130);
    }
    context.fillStyle = "#1c2024";
    const x = 480 + Math.cos(frame / 25) * 260;
    const y = 300 + Math.sin(frame / 25) * 120;
    context.beginPath();
    context.arc(x, y, 24, 0, Math.PI * 2);
    context.fill();
  };
  draw();
  const stream = canvas.captureStream(15);
  const timer = setInterval(draw, 66);
  return {
    stream,
    stop: (): void => {
      clearInterval(timer);
      for (const track of stream.getTracks()) {
        track.stop();
      }
    },
  };
};

/** 指定コードの CameraAccessError で失敗するフェイク。 */
const rejectOpenCamera =
  (code: CameraErrorCode): OpenCameraFn =>
  async () => {
    throw new CameraAccessError(code);
  };

/** 永遠に解決しないフェイク（loading 表示の確認用）。 */
const pendingOpenCamera: OpenCameraFn = () => new Promise<CameraSession>(() => {});

// ---- デモラッパ ---------------------------------------------------------------

/** QR カード 6 種（実カードの代わりに controller.handleQr を直接叩く操作パネル）。 */
const QR_KINDS: readonly CommandKind[] = Object.values(COMMAND_KIND);

const QrSimulator = ({
  onScan,
  disabled,
}: {
  onScan: (payload: string) => void;
  disabled: boolean;
}): React.JSX.Element => (
  <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
    <span className="text-muted-foreground me-1 text-sm">
      QR カードのかわり（2 秒に 1 まいまで）:
    </span>
    {QR_KINDS.map((kind) => (
      <Button
        key={kind}
        size="sm"
        variant="outline"
        tone="neutral"
        disabled={disabled}
        onClick={() => onScan(kind)}
      >
        {COMMAND_VISUALS[kind].labelJa}
      </Button>
    ))}
    <Button
      size="sm"
      variant="outline"
      tone="destructive"
      disabled={disabled}
      onClick={() => onScan("not-a-command")}
    >
      でたらめ QR
    </Button>
  </div>
);

interface ArStageDemoProps {
  /** 迷路の一辺のマス数。 */
  size?: number;
  /** 迷路の階層数。 */
  floors?: number;
  /** カメラ取得フェイク。 */
  openCamera?: OpenCameraFn;
  /** QR 操作パネルを出すか。 */
  withQrSimulator?: boolean;
}

/** maze から controller を生成して ArStage を動かす統合デモの内側（maze ごとに再マウント）。 */
const ArStageWithController = ({
  maze,
  openCamera,
  withQrSimulator,
}: {
  maze: Maze;
  openCamera?: OpenCameraFn;
  withQrSimulator: boolean;
}): React.JSX.Element => {
  const controller = useArStage(maze);
  return (
    <div className="flex h-[42rem] w-[64rem] max-w-full flex-col gap-3">
      <div className="border-border relative min-h-0 flex-1 overflow-hidden rounded-xl border">
        <ArStage controller={controller} openCamera={openCamera} />
      </div>
      {withQrSimulator && (
        <QrSimulator onScan={controller.handleQr} disabled={controller.readOnly} />
      )}
    </div>
  );
};

/** 統合デモ。useArStage は maze をマウント時固定するため、size/floors 変更時は key で再マウント。 */
const ArStageDemo = ({
  size = 5,
  floors = 1,
  openCamera = fakeOpenCamera,
  withQrSimulator = true,
}: ArStageDemoProps): React.JSX.Element => {
  const maze = useMemo(() => createStoryMaze(size, floors), [size, floors]);
  return (
    <ArStageWithController
      key={`${size}-${floors}`}
      maze={maze}
      openCamera={openCamera}
      withQrSimulator={withQrSimulator}
    />
  );
};

// ---- meta ---------------------------------------------------------------------

const meta = {
  title: "widgets/ar-stage/ArStage",
  component: ArStageDemo,
  args: {
    size: 5,
    floors: 1,
    openCamera: fakeOpenCamera,
    withQrSimulator: true,
  },
  argTypes: {
    size: { control: { type: "number", min: 5, max: 7 } },
    floors: { control: { type: "number", min: 1, max: 3 } },
    openCamera: { control: false },
    withQrSimulator: { control: false },
  },
} satisfies Meta<typeof ArStageDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * フル体験: フェイクカメラ映像＋3D 重畳。下の QR ボタンで命令を追加（cooldown 2 秒）し、
 * ［じっこう］で実行 → 成功/失敗ダイアログまで一通り確認できる。
 * loopStart を押すと回数ダイアログが開く。操作ボタン以外の領域をドラッグすると視点をオービットできる。
 */
export const Default: Story = {};

/** 3 階建て（階スイッチャ・ミニマップの階表示を確認できる）。 */
export const MultiFloor: Story = {
  args: { floors: 3 },
};

/** カメラ取得待ち（永遠に解決しないフェイク）。 */
export const CameraLoading: Story = {
  args: { openCamera: pendingOpenCamera, withQrSimulator: false },
};

/** カメラ権限拒否（再試行ボタンあり）。 */
export const CameraPermissionDenied: Story = {
  args: {
    openCamera: rejectOpenCamera(CAMERA_ERROR_CODE.PERMISSION_DENIED),
    withQrSimulator: false,
  },
};

/** カメラ非対応（環境要因のため再試行ボタン無し）。 */
export const CameraUnsupported: Story = {
  args: { openCamera: rejectOpenCamera(CAMERA_ERROR_CODE.UNSUPPORTED), withQrSimulator: false },
};
