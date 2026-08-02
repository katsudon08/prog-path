/**
 * ArStage（FSD: widgets/ar-stage/ui）
 *
 * AR 描画＋実行ブロックのルート。`useArStage`（controller）を受け取り、
 *  - 最背面: カメラ映像（CameraBackground。取得は内部の useCameraStream）
 *  - 中間: 透過 3D シーン（ArScene = Maze3d + Robot3d。OrbitControls で視点操作できる）
 *  - 最前面: オーバーレイ群（移動回数・実行操作・ミニマップ・階切替）
 * を重畳する。オーバーレイ層は `pointer-events-none` を基本とし、操作要素だけ
 * `pointer-events-auto` で受ける — 操作要素以外の領域ドラッグは下層の ArScene へ届き、視点操作に回る。
 *
 * ダイアログ群（ループ回数・削除確認・未完了ループ警告・結果）とフィードバックトーストは、カメラ状態に
 * 依存させず常に描く。コマンドパネルは ArStage の外（pages/ar-run）に置かれるため、
 * カメラが切断・再取得中でもパネル発の削除要求を確認ダイアログで確定でき、その結果も通知できる。
 *
 * QR スキャンは背景 video を入力に use-qr-scan が連続デコードし、結果を
 * `controller.handleQr` へ渡す。実行中（`controller.readOnly`）はスキャンを停止する。
 * カメラのライフサイクル（取得・解放・再試行）は useCameraStream が担う。
 */
import { useRef } from "react";

import { CAMERA_ERROR_CODE } from "@/shared/camera";
import { cn } from "@/shared/lib";

import { useCameraStream } from "../model/use-camera-stream";
import type { OpenCameraFn } from "../model/use-camera-stream";
import { useQrScan } from "../model/use-qr-scan";
import type { ArStageController } from "../model/types";
import { ArScene } from "./ar-scene";
import { CameraBackground } from "./camera-background";
import { CameraError } from "./camera-error";
import { CameraLoading } from "./camera-loading";
import { CommandFeedbackOverlay } from "./command-feedback-overlay";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { FloorSwitcher } from "./floor-switcher";
import { LoopCountDialog } from "./loop-count-dialog";
import { MiniMap } from "./mini-map";
import { MoveCountBadge } from "./move-count-badge";
import { ResultFailureDialog } from "./result-failure-dialog";
import { ResultSuccessDialog } from "./result-success-dialog";
import { RunControls } from "./run-controls";
import { UnclosedLoopDialog } from "./unclosed-loop-dialog";

export interface ArStageProps {
  /** `useArStage(maze)` が返す view-model（ページ #190 が生成して渡す）。 */
  controller: ArStageController;
  /** カメラ取得関数の注入シーム（stories・テスト用）。省略時は shared/camera の実体。 */
  openCamera?: OpenCameraFn;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** AR ステージ（カメラ背景 + 3D 重畳 + オーバーレイ + ダイアログ）。 */
export const ArStage = ({ controller, openCamera, className }: ArStageProps): React.JSX.Element => {
  const camera = useCameraStream({ openCamera });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // QR スキャンは「カメラ ready かつ編集可能」の間だけ回す（実行中は読み取らない）。
  useQrScan({
    videoRef,
    enabled: camera.status === "ready" && !controller.readOnly,
    onPayload: controller.handleQr,
  });

  return (
    <div className={cn("relative size-full overflow-hidden bg-background", className)}>
      {camera.status === "loading" && <CameraLoading className="absolute inset-0" />}

      {camera.status === "error" && (
        <CameraError
          errorCode={camera.errorCode ?? CAMERA_ERROR_CODE.UNKNOWN}
          onRetry={camera.retry}
          className="absolute inset-0"
        />
      )}

      {camera.status === "ready" && camera.stream !== null && (
        <>
          <CameraBackground stream={camera.stream} videoRef={videoRef} />
          <ArScene
            maze={controller.maze}
            robot={controller.robot}
            robotAction={controller.robotAction}
          />

          {/* オーバーレイ層: 基本はタップを透過し、操作要素だけ pointer-events-auto で受ける。 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <MoveCountBadge moveCount={controller.moveCount} />
              <FloorSwitcher
                floorCount={controller.maze.floors}
                visibleFloor={controller.visibleFloor}
                onSelect={controller.setVisibleFloor}
                className="pointer-events-auto"
              />
            </div>
            <div className="flex items-end justify-between gap-4">
              <MiniMap
                maze={controller.maze}
                visibleFloor={controller.visibleFloor}
                robot={controller.robot}
                className="w-36"
              />
              <RunControls
                status={controller.status}
                canRun={controller.canRun}
                onRun={controller.run}
                onPause={controller.pause}
                onResume={controller.resume}
                onReset={controller.reset}
                className="pointer-events-auto"
              />
            </div>
          </div>
        </>
      )}

      {/*
        カメラ状態に依存しない層。外に置いたコマンドパネル（pages/ar-run）からの削除要求は
        カメラが ready でない間にも届くため、ready ブロックに閉じ込めると確認ダイアログが
        出せず削除が確定できなくなる。トーストも同じ理由で常時マウントし、
        ready → loading の往復で表示中の通知が消えないようにする。
        ダイアログは Radix Portal 経由、トーストは絶対配置のため、JSX 上の位置は自由。
      */}
      <CommandFeedbackOverlay lastOutcome={controller.lastOutcome} />
      <LoopCountDialog
        open={controller.loopDialogOpen}
        onConfirm={controller.confirmLoop}
        onCancel={controller.cancelLoop}
      />
      <DeleteConfirmDialog
        open={controller.deleteDialogOpen}
        targetLabel={controller.deleteTargetLabel}
        onConfirm={controller.confirmDelete}
        onCancel={controller.cancelDelete}
      />
      <UnclosedLoopDialog
        open={controller.unclosedLoopDialogOpen}
        openLoopCount={controller.openLoopPaths.length}
        onClose={controller.dismissUnclosedLoop}
      />
      <ResultSuccessDialog
        open={controller.successOpen}
        moveCount={controller.moveCount}
        onClose={controller.closeResult}
      />
      <ResultFailureDialog
        open={controller.failureOpen}
        failureReason={controller.failureReason}
        onClose={controller.closeResult}
      />
    </div>
  );
};
