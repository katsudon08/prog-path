/**
 * ArScene（FSD: widgets/ar-stage/ui）
 *
 * カメラ映像へ重畳する 3D シーン。透過 Canvas（`gl.alpha`）に `Maze3d`（全階を積んで描画）と
 * `Robot3d` を合成する表示専用コンポーネント。`OrbitControls` による視点操作（オービット）で
 * 3D を全方位から確認できる — 背景のカメラ映像は固定のまま、3D シーンのみ回転する。初期フレーミングは
 * lib/scene-camera の純粋関数で迷路全体が収まるよう計算する（マーカートラッキングは将来拡張）。
 *
 * `robot` が null（未実行・結果クローズ後）の間は、スタート位置の初期姿勢
 * （`createInitialRobot`）を表示する — 実行前から「どこから動くか」を見せるため。
 */
import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { findTiles, Maze3d, TILE_KIND } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import { createInitialRobot, Robot3d } from "@/entities/robot";
import type { Robot, RobotAction } from "@/entities/robot";
import { cn } from "@/shared/lib";

import { computeSceneCamera } from "../lib/scene-camera";

interface ArSceneProps {
  /** 描画対象の迷路（マウント時点で固定）。 */
  maze: Maze;
  /** 実行中ロボットの状態。null の間はスタート位置の初期姿勢を表示する。 */
  robot: Robot | null;
  /** 位置・向き差分で表せない一発アニメ指示（穴埋め・落下）。無ければ null。 */
  robotAction: RobotAction | null;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 迷路＋ロボットの透過 3D シーン。 */
export const ArScene = ({
  maze,
  robot,
  robotAction,
  className,
}: ArSceneProps): React.JSX.Element => {
  // 固定カメラ設定（迷路はマウント時点で固定のため一度だけ計算する）。
  const camera = useMemo(
    () => computeSceneCamera(maze.size, maze.floors),
    [maze.size, maze.floors],
  );

  // 未実行時に表示する初期姿勢（スタート位置・既定向き）。スタートは MazeSchema で 1 つを保証。
  const initialRobot = useMemo(() => {
    const start = findTiles(maze, TILE_KIND.START)[0] ?? { floor: 0, row: 0, col: 0 };
    return createInitialRobot(start);
  }, [maze]);

  const displayRobot = robot ?? initialRobot;

  return (
    <Canvas
      // OrbitControls のドラッグを受けるため Canvas はポインタを取る（オーバーレイの操作要素は
      // pointer-events-auto で個別に受け、それ以外の領域ドラッグは 3D の視点操作に回る）。
      className={cn("pointer-events-auto absolute inset-0", className)}
      gl={{ alpha: true }}
      camera={{ position: [...camera.position], fov: camera.fov }}
      onCreated={({ gl, camera: threeCamera }) => {
        // 背景のカメラ映像を透過させる（alpha: true の既定を明示）。
        gl.setClearAlpha(0);
        threeCamera.lookAt(camera.target[0], camera.target[1], camera.target[2]);
      }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} />
      <Maze3d maze={maze} />
      <Robot3d robot={displayRobot} action={robotAction ?? undefined} gridSize={maze.size} />
      {/* 視点オービット。target を初期フレーミングの注視点に合わせ、初期視点は固定カメラと一致させる。 */}
      <OrbitControls target={[...camera.target]} />
    </Canvas>
  );
};
