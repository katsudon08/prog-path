import { useEffect, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { CameraBackground } from "./camera-background";

/**
 * canvas に動く模様を描いて captureStream() で MediaStream 化する
 * （Storybook では実カメラ権限に依存しないフェイク映像を使う）。
 */
const useFakeStream = (): MediaStream | null => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const context = canvas.getContext("2d");
    let frame = 0;
    const draw = (): void => {
      if (!context) return;
      frame += 1;
      // フェイク映像の色は canvas 2D 専用（DOM のトークン運用対象外）。机と紙のイメージ。
      context.fillStyle = "#7a6a55";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f5f1e8";
      context.fillRect(140, 90, 680, 360);
      context.fillStyle = "#1c2024";
      const x = 480 + Math.cos(frame / 20) * 220;
      const y = 270 + Math.sin(frame / 20) * 120;
      context.beginPath();
      context.arc(x, y, 28, 0, Math.PI * 2);
      context.fill();
    };
    draw();
    const captured = canvas.captureStream(15);
    const timer = setInterval(draw, 66);
    setStream(captured);
    return () => {
      clearInterval(timer);
      for (const track of captured.getTracks()) {
        track.stop();
      }
    };
  }, []);

  return stream;
};

const CameraBackgroundDemo = (): React.JSX.Element => {
  const stream = useFakeStream();
  return (
    <div className="border-border relative h-80 w-[36rem] max-w-full overflow-hidden rounded-xl border">
      {stream !== null && <CameraBackground stream={stream} />}
    </div>
  );
};

// stream（MediaStream）は Storybook の args で表現できないため、デモラッパを component にする。
const meta = {
  title: "widgets/ar-stage/CameraBackground",
  component: CameraBackgroundDemo,
} satisfies Meta<typeof CameraBackgroundDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** フェイク映像（canvas captureStream）を全面 object-cover で敷く。 */
export const Default: Story = {};
