import { useEffect, useMemo, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  COMMAND_KIND,
  COMMAND_VISUALS,
  isLoopCommand,
  LOOP_COMMAND_KIND,
} from "@/entities/command";
import type { Command, CommandKind } from "@/entities/command";
import type { CommandPath } from "@/features/command-management";
import { CAMERA_ERROR_CODE, CameraAccessError } from "@/shared/camera";
import type { CameraErrorCode } from "@/shared/camera";
import { buildTutorialMazes } from "@/shared/db";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { useArStage } from "@/widgets/ar-stage";
import type { ArStageController, OpenCameraFn } from "@/widgets/ar-stage";

import { ArRunWorkspace } from "./ar-run-workspace";

// ---- stories 用フェイク -------------------------------------------------------

/** 「くりかえし」（7×7 の直線）。長めのプログラムを組んでも成功させやすい教材迷路。 */
const DEMO_MAZE = buildTutorialMazes()[2];

/**
 * canvas に動く模様を描いて captureStream() する、CameraSession 互換のフェイクカメラ。
 * 実カメラ権限に依存せず「maze を渡すだけで動く」体験を再現する
 * （widgets/ar-stage の stories と同じ実装。stories 間 import はしない方針のためコピー）。
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

// ---- サンプルの命令木 ---------------------------------------------------------

const SIMPLE: Command[] = [
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "ifHole" },
];

const TALL: Command[] = [
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "forward" },
  { kind: "turnLeft" },
  {
    kind: LOOP_COMMAND_KIND,
    count: 4,
    children: [{ kind: "forward" }, { kind: "turnRight" }, { kind: "ifHole" }],
  },
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "ifHole" },
];

/** 木を pre-order で辿り、全ノードのパスを集める（実行中ハイライト再生用）。 */
const collectPaths = (commands: readonly Command[], base: number[] = []): CommandPath[] => {
  const out: CommandPath[] = [];
  commands.forEach((command, index) => {
    const path = [...base, index];
    out.push(path);
    if (isLoopCommand(command)) out.push(...collectPaths(command.children, path));
  });
  return out;
};

const noop = (): void => {};

/** 状態を固定した偽 controller（実フックを使わずレイアウトだけを確認するための土台）。 */
const createFixedController = (overrides: Partial<ArStageController> = {}): ArStageController => ({
  maze: DEMO_MAZE,

  status: "idle",
  isEditable: true,
  isRunning: false,
  canRun: true,
  robot: null,
  moveCount: 0,
  robotAction: null,
  visibleFloor: 0,
  setVisibleFloor: noop,

  run: noop,
  pause: noop,
  resume: noop,
  reset: noop,
  closeResult: noop,

  successOpen: false,
  failureOpen: false,
  failureReason: null,

  commands: SIMPLE,
  selected: { containerPath: [], index: SIMPLE.length },
  openLoopPaths: [],
  activePath: null,
  readOnly: false,
  selectInsertionPoint: noop,
  deleteCommand: noop,

  deleteDialogOpen: false,
  deleteTargetLabel: null,
  confirmDelete: noop,
  cancelDelete: noop,

  unclosedLoopDialogOpen: false,
  dismissUnclosedLoop: noop,

  handleQr: noop,
  lastOutcome: null,
  loopDialogOpen: false,
  confirmLoop: noop,
  cancelLoop: noop,

  ...overrides,
});

// ---- デモラッパ ---------------------------------------------------------------

/** QR カード 6 種（実カードの代わりに controller.handleQr を直接叩く操作パネル）。 */
const QR_KINDS: readonly CommandKind[] = Object.values(COMMAND_KIND);

const QrSimulator = ({
  onScan,
  disabled,
  className,
}: {
  onScan: (payload: string) => void;
  disabled: boolean;
  className?: string;
}): React.JSX.Element => (
  <div
    className={cn(
      "border-border bg-card flex shrink-0 flex-wrap items-center gap-2 rounded-xl border p-3",
      className,
    )}
  >
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

/** 本物の `useArStage` を使う通し確認デモ（命令作成 → 実行 → 強調 → 成功/失敗まで）。 */
const InteractiveDemo = (): React.JSX.Element => {
  const controller = useArStage(DEMO_MAZE);
  return (
    <>
      <ArRunWorkspace controller={controller} openCamera={fakeOpenCamera} />
      <QrSimulator
        onScan={controller.handleQr}
        disabled={controller.readOnly}
        className="mx-3 mb-3"
      />
    </>
  );
};

/** 実行中の強調位置だけを一定間隔で進め、右パネルのオートスクロールを再生する。 */
const RunningDemo = (): React.JSX.Element => {
  const paths = useMemo(() => collectPaths(TALL), []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % paths.length);
    }, 900);
    return () => clearInterval(timer);
  }, [paths.length]);

  const controller = createFixedController({
    status: "running",
    isEditable: false,
    isRunning: true,
    canRun: false,
    readOnly: true,
    moveCount: index,
    commands: TALL,
    activePath: paths[index],
  });

  return <ArRunWorkspace controller={controller} openCamera={fakeOpenCamera} />;
};

/**
 * カメラ取得に失敗した状態で［けす］を押せるデモ。
 * カメラ未取得でも削除確認ダイアログが出ること（ダイアログを `camera.status === "ready"` の
 * 外へ出した修正）の目視確認を兼ねる。
 */
const CameraErrorDemo = (): React.JSX.Element => {
  const [pendingPath, setPendingPath] = useState<CommandPath | null>(null);

  const controller = createFixedController({
    deleteCommand: setPendingPath,
    deleteDialogOpen: pendingPath !== null,
    deleteTargetLabel:
      pendingPath === null ? null : COMMAND_VISUALS[SIMPLE[pendingPath[0]].kind].labelJa,
    confirmDelete: () => setPendingPath(null),
    cancelDelete: () => setPendingPath(null),
  });

  return (
    <ArRunWorkspace
      controller={controller}
      openCamera={rejectOpenCamera(CAMERA_ERROR_CODE.PERMISSION_DENIED)}
    />
  );
};

// ---- meta ---------------------------------------------------------------------

const meta = {
  title: "pages/ar-run/ArRunWorkspace",
  component: ArRunWorkspace,
  args: {
    controller: createFixedController(),
    openCamera: fakeOpenCamera,
  },
  argTypes: {
    controller: { control: false },
    openCamera: { control: false },
    className: { control: false },
  },
  // AppShell の `<main className="flex min-h-0 flex-1 flex-col">` を模した固定サイズ箱。
  // 高さを固定しないと min-h-0 の連鎖切れ（パネルが伸びてページごとスクロールする）を
  // 見逃すため、ここで実画面と同じ「高さの上限がある flex 列」を再現する。
  decorators: [
    (Story) => (
      <div className="flex h-[44rem] w-[76rem] max-w-full flex-col overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArRunWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 通し確認（本命）。下の QR ボタンで命令を積み（cooldown 2 秒）、［じっこう］で実行すると
 * 右パネルの強調が下へ移動しオートスクロールし、成功/失敗ダイアログまで到達する。
 * ［けす］→ 確認ダイアログ → 実削除（#239）もここで確認できる。
 *
 * ループまわりも本物のフックで通せる:
 *  - 「くりかえし はじめ」→ 回数確定 → 破線＋「まだ とじてないよ」が右パネルに出る
 *  - そのまま［じっこう］→ 警告ダイアログが出て実行されない
 *  - 「くりかえし おわり」→ 中央に「とじたよ！」・破線が実線に戻り、実行できるようになる
 *  - 同じボタンを連打しても cooldown の警告文言で通知が潰れない（同一カードは無視される）
 */
export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

/** 実行中（readOnly）。背の高いプログラムで強調の移動とオートスクロールを自動再生する。 */
export const Running: Story = {
  render: () => <RunningDemo />,
};

/** 一時停止中など編集不可の状態。追加スロット・削除ボタンが消える。 */
export const ReadOnly: Story = {
  args: {
    controller: createFixedController({
      status: "paused",
      isEditable: false,
      isRunning: true,
      canRun: false,
      readOnly: true,
      moveCount: 2,
      activePath: [1],
    }),
  },
};

/**
 * 未完了ループ（loopEnd を読む前）。右パネルの loop が破線＋「まだ とじてないよ」になり、
 * ［じっこう］は押せるまま。押すと警告ダイアログが出て実行されない（features.md 5.3）。
 * 実際の抑止判定は `useArStage` が持つため、この story は見た目のみを固定して確認する。
 */
export const UnclosedLoop: Story = {
  args: {
    controller: createFixedController({
      commands: [
        { kind: "forward" },
        { kind: LOOP_COMMAND_KIND, count: 3, children: [{ kind: "turnRight" }] },
      ],
      openLoopPaths: [[1]],
      selected: { containerPath: [1], index: 1 },
    }),
  },
};

/** 未完了ループのまま［じっこう］を押した直後（警告ダイアログが開いた状態）。 */
export const UnclosedLoopWarning: Story = {
  args: {
    controller: createFixedController({
      commands: [
        { kind: "forward" },
        { kind: LOOP_COMMAND_KIND, count: 3, children: [{ kind: "turnRight" }] },
      ],
      openLoopPaths: [[1]],
      selected: { containerPath: [1], index: 1 },
      unclosedLoopDialogOpen: true,
    }),
  },
};

/** 命令ゼロ（画面を開いた直後）。右パネルは案内文だけを表示する。 */
export const Empty: Story = {
  args: {
    controller: createFixedController({
      commands: [],
      canRun: false,
      selected: { containerPath: [], index: 0 },
    }),
  },
};

/** カメラ権限拒否。左は再試行導線、右のコマンドパネルは操作可能なまま残る。 */
export const CameraError: Story = {
  render: () => <CameraErrorDemo />,
};
