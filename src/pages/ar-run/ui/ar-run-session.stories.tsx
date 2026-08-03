import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { buildTutorialMazes } from "@/shared/db";
import { Button } from "@/shared/ui";
import type { OpenCameraFn } from "@/widgets/ar-stage";

import { ArRunSession } from "./ar-run-session";

// ---- stories 用フェイク -------------------------------------------------------

/** チュートリアル迷路 6 件（易→難のカリキュラム順）。 */
const TUTORIAL_MAZES = buildTutorialMazes();

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

// ---- デモラッパ ---------------------------------------------------------------

/**
 * 迷路を切り替えて `key={maze.id}` による再マウントを目視するデモ。
 *
 * `useArStage` は maze をマウント時に固定するため、key を外すと 3D・ミニマップが
 * 前の迷路のまま残る（この story はその回帰確認用）。切替のたびにカメラを取り直すため
 * 一瞬 loading が挟まるのも仕様どおり。
 */
const MazeSwitchDemo = (): React.JSX.Element => {
  const [selectedId, setSelectedId] = useState(TUTORIAL_MAZES[0].id);
  const maze = TUTORIAL_MAZES.find((candidate) => candidate.id === selectedId) ?? TUTORIAL_MAZES[0];

  return (
    <>
      <div className="border-border bg-card m-3 mb-0 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border p-3">
        <span className="text-muted-foreground me-1 text-sm">めいろ:</span>
        {TUTORIAL_MAZES.map((candidate) => (
          <Button
            key={candidate.id}
            size="sm"
            variant={candidate.id === selectedId ? "solid" : "outline"}
            tone={candidate.id === selectedId ? "primary" : "neutral"}
            onClick={() => setSelectedId(candidate.id)}
          >
            {candidate.name}
          </Button>
        ))}
      </div>
      <ArRunSession key={maze.id} maze={maze} openCamera={fakeOpenCamera} />
    </>
  );
};

// ---- meta ---------------------------------------------------------------------

const meta = {
  title: "pages/ar-run/ArRunSession",
  component: ArRunSession,
  args: {
    maze: TUTORIAL_MAZES[0],
    openCamera: fakeOpenCamera,
  },
  argTypes: {
    // maze は controller のマウント時固定値。control で差し替えても再マウントしないため出さない。
    maze: { control: false },
    openCamera: { control: false },
    className: { control: false },
  },
  // AppShell の `<main className="flex min-h-0 flex-1 flex-col">` を模した固定サイズ箱。
  decorators: [
    (Story) => (
      <div className="flex h-[44rem] w-[76rem] max-w-full flex-col overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArRunSession>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * チュートリアル迷路 1 件でのセッション。`useArStage` の生成とレイアウト接続だけを見る
 * （QR 読み取り〜実行の通し操作は ArRunWorkspace の Interactive が担当）。
 */
export const Default: Story = {};

/** 迷路を切り替えて `key={maze.id}` の再マウント（3D・ミニマップの切替）を確認する。 */
export const MazeSwitch: Story = {
  render: () => <MazeSwitchDemo />,
};
