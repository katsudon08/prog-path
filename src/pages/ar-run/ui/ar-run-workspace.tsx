/**
 * ArRunWorkspace（FSD: pages/ar-run/ui）
 *
 * AR 実行画面の横分割レイアウト（左: `ArStage` / 右: `CommandPanel`）と、controller から
 * CommandPanel への配線だけを担う純プレゼンテーション層。フックを持たず（`useId` を除く）、
 * すべての状態は props の controller 経由で受け取る。
 *
 * widgets 同士は直接参照できない（FSD）ため、`ar-stage` の controller が公開する
 * `activePath` を `command-panel` へ橋渡しするのは pages の責務。これが「実行中コマンドの
 * 強調・オートスクロール連動」（#187 から #190 へ移管）の実体。`openLoopPaths`（まだ
 * 閉じていない loop）も同じ理由でここを経由する。
 *
 * 右パネルを `<section aria-labelledby>` + 可視見出しにしている理由: `CommandPanel` の
 * `aria-label` は role を持たない `div` に付いており支援技術へ露出しない可能性が高い。
 * ここで名前付きランドマークにして「つくったプログラム」を確実に読み上げさせる。
 * 迷路名の置き場所もここしかない（ArStage の四隅はオーバーレイで埋まっている）。
 */
import { useId } from "react";

import { cn } from "@/shared/lib";
import { ArStage } from "@/widgets/ar-stage";
import type { ArStageController, OpenCameraFn } from "@/widgets/ar-stage";
import { CommandPanel } from "@/widgets/command-panel";

/** {@link ArRunWorkspace} の props。 */
export interface ArRunWorkspaceProps {
  /** `useArStage(maze)` が返す view-model（生成は ArRunSession の責務）。 */
  controller: ArStageController;
  /** カメラ取得関数の注入シーム（stories・テスト用）。省略時は shared/camera の実体。 */
  openCamera?: OpenCameraFn;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** AR ステージ（左）とコマンドパネル（右）の横分割レイアウト。 */
export const ArRunWorkspace = ({
  controller,
  openCamera,
  className,
}: ArRunWorkspaceProps): React.JSX.Element => {
  const headingId = useId();

  return (
    // min-h-0 は AppShell の main → この root → 右 section → CommandPanel の全段に必要。
    // 1 段でも欠けると flex の暗黙 min-height:auto でパネルが伸び、CommandPanel の
    // scrollIntoView がページ全体をスクロールさせる。
    // 前提として AppShell の外殻が h-dvh で高さを確定していること。min-height だけでは高さが
    // 決まらず、min-h-0 を全段に置いてもパネルは内側スクロールにならずページごと伸びる。
    <div className={cn("flex min-h-0 flex-1 gap-3 p-3", className)}>
      <h1 className="sr-only">AR でうごかす</h1>

      {/* min-w-0: R3F Canvas の min-content 幅で右パネルが押し出されるのを防ぐ。 */}
      <div className="border-border rounded-card relative min-h-0 min-w-0 flex-1 overflow-hidden border">
        <ArStage controller={controller} openCamera={openCamera} />
      </div>

      <section
        aria-labelledby={headingId}
        className="border-border bg-card rounded-card flex min-h-0 w-80 shrink-0 flex-col overflow-hidden border 2xl:w-96"
      >
        <div className="border-border shrink-0 border-b px-3 py-2">
          <p className="text-muted-foreground truncate text-xs">{controller.maze.name}</p>
          <h2 id={headingId} className="text-card-foreground text-sm font-bold">
            つくったプログラム
          </h2>
        </div>
        <CommandPanel
          commands={controller.commands}
          selected={controller.selected}
          // CommandPath | null → CommandPath | undefined（CommandPanel は optional 契約）。
          activePath={controller.activePath ?? undefined}
          openLoopPaths={controller.openLoopPaths}
          readOnly={controller.readOnly}
          onSelectInsertionPoint={controller.selectInsertionPoint}
          onDeleteCommand={controller.deleteCommand}
          className="min-h-0 flex-1"
        />
      </section>
    </div>
  );
};
