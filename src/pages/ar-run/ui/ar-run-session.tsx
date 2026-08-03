/**
 * ArRunSession（FSD: pages/ar-run/ui）
 *
 * 「1 迷路 = 1 セッション」の単位。`useArStage(maze)` で controller を生成し、
 * レイアウト（ArRunWorkspace）へ渡すだけの薄い層。
 *
 * レイアウトと分けている理由:
 *  1. ArRunWorkspace に偽 controller を差し込む単体テストが書ける
 *     （＝「実行中コマンドの強調」の連動を自動で担保できる）
 *  2. `key` の付与単位が自明になる（下記の再マウント要件）
 *  3. ページ側の分岐（switch）の中で `useArStage` を呼ぶ rules-of-hooks 違反を避けられる
 */
import type { Maze } from "@/entities/maze";
import { useArStage } from "@/widgets/ar-stage";
import type { OpenCameraFn } from "@/widgets/ar-stage";

import { ArRunWorkspace } from "./ar-run-workspace";

/** {@link ArRunSession} の props。 */
export interface ArRunSessionProps {
  /** 実行対象の迷路（マウント時点で固定。切り替えは呼び出し側の `key` 再マウントで行う）。 */
  maze: Maze;
  /** カメラ取得関数の注入シーム（stories・テスト用）。省略時は shared/camera の実体。 */
  openCamera?: OpenCameraFn;
  /** 既定クラスへの上書き・拡張（ArRunWorkspace へそのまま渡す）。 */
  className?: string;
}

/**
 * 1 つの迷路に対する AR 実行セッション（controller の生成とレイアウトの接続）。
 *
 * **呼び出し側は必ず `key={maze.id}` を付けること。** `useArStage` → `useMazeSimulation` が
 * `useState(() => createMazeSimulationMachine({ maze }))` で XState actor を生成するため、
 * `maze` はマウント時に固定される。再マウントしないと「前の迷路のまま実行」になる。
 * 副作用としてカメラを取り直す（約 1 秒の loading）が、授業中の迷路切替は稀なので許容する。
 *
 * @param props 実行対象の迷路とカメラ注入シーム（{@link ArRunSessionProps}）
 */
export const ArRunSession = ({
  maze,
  openCamera,
  className,
}: ArRunSessionProps): React.JSX.Element => {
  const controller = useArStage(maze);

  return <ArRunWorkspace controller={controller} openCamera={openCamera} className={className} />;
};
