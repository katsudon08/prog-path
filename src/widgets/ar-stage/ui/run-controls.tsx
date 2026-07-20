/**
 * RunControls（FSD: widgets/ar-stage/ui）
 *
 * 実行状態（RunStatus）に応じた操作ボタン群。
 *  - idle: ［じっこう］（canRun でないときは disabled）
 *  - running: ［いちじていし］［リセット］
 *  - paused: ［さいかい］［リセット］
 *  - succeeded / failed: ［リセット］
 *
 * shared/ui の Button（タップ領域 48px+）を使い、意味はアイコン＋文言の対で伝える。
 * 状態→ボタン構成の対応は `Record<RunStatus, …>` で網羅し、状態が増えたら型エラーになる。
 */
import { Pause, Play, RotateCcw } from "lucide-react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

import type { RunStatus } from "../model/types";

interface RunControlsProps {
  /** UI 向けの実行状態。 */
  status: RunStatus;
  /** 実行を開始できるか（idle のときのみ意味を持つ）。 */
  canRun: boolean;
  /** 実行開始。 */
  onRun: () => void;
  /** 一時停止。 */
  onPause: () => void;
  /** 再開。 */
  onResume: () => void;
  /** やりなおし（開始位置へ戻して再実行）。 */
  onReset: () => void;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 状態ごとに表示するボタンの種類。 */
type RunControlKind = "run" | "pause" | "resume" | "reset";

/** 実行状態 → 表示するボタン列（左から順に描画）。全 RunStatus を網羅する。 */
const CONTROLS_BY_STATUS: Record<RunStatus, readonly RunControlKind[]> = {
  idle: ["run"],
  running: ["pause", "reset"],
  paused: ["resume", "reset"],
  succeeded: ["reset"],
  failed: ["reset"],
};

/** 実行操作ボタン群。 */
export const RunControls = ({
  status,
  canRun,
  onRun,
  onPause,
  onResume,
  onReset,
  className,
}: RunControlsProps): React.JSX.Element => {
  // ボタン種別 → 実描画。ハンドラ・disabled は props に依存するためコンポーネント内で表を組む。
  const renderControl = (kind: RunControlKind): React.JSX.Element => {
    switch (kind) {
      case "run":
        return (
          <Button key={kind} size="lg" onClick={onRun} disabled={!canRun}>
            <Play aria-hidden="true" />
            じっこう
          </Button>
        );
      case "pause":
        return (
          <Button key={kind} size="lg" onClick={onPause}>
            <Pause aria-hidden="true" />
            いちじていし
          </Button>
        );
      case "resume":
        return (
          <Button key={kind} size="lg" onClick={onResume}>
            <Play aria-hidden="true" />
            さいかい
          </Button>
        );
      case "reset":
        return (
          <Button key={kind} size="lg" variant="outline" tone="neutral" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            リセット
          </Button>
        );
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {CONTROLS_BY_STATUS[status].map(renderControl)}
    </div>
  );
};
