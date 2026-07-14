/**
 * Robot3d（FSD: entities/robot/ui）
 *
 * ロボットを 3D で描く R3F コンポーネント。AR ステージ（#187）でカメラ映像＋迷路（maze-3d）に
 * 重畳される表示対象。Canvas は持たず group を返すだけで、シーン合成は上位が行う（本 entity は
 * 他 entity を参照しない）。
 *
 * アニメーションは props 目標値への補間で駆動する（→ 計画）。`robot` の状態変化がそのままアニメになる:
 *  - 前進 = `robot.position` 変化 → ワールド座標を補間
 *  - 回転 = `robot.direction` 変化 → yaw を最短経路で補間
 *  - `action` = `fillHole`/`fall` の一発アニメ（位置/向きでは表せない演出）
 * 高頻度更新は useFrame 内で ref を直接操作し setState を避ける。一時ベクトルは再利用して GC を抑える
 * （→ CLAUDE.md R3F 規約）。
 *
 * @remarks 仮アセット（プリミティブ）。本制作（M4/#204）で GLTF モデル・質感へ差し替える前提。
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Group } from "three";

import { clamp } from "@/shared/lib";

import { directionToYaw } from "../model/direction";
import { ROBOT_ACTION } from "../model/types";
import type { Robot, RobotAction, RobotCoord } from "../model/types";

/**
 * ワールド変換の定数。⚠️ maze-3d（entities/maze/ui）のローカル定数と値を一致させること
 * （同一シーンで重畳するため。座標系がズレると迷路とロボットが噛み合わない）。
 * 将来 #187 で両者を合成する際に共有先へ hoist する余地がある（→ 計画のフォローアップ）。
 */
const CELL = 1;
const FLOOR_GAP = 1.2;
/** 床スラブ上面までのオフセット（maze-3d の SLAB_HEIGHT/2 に一致）。 */
const SLAB_HALF = 0.075;

/** 本体（胴）の寸法。カプセルの円柱部が正の長さになるよう HEIGHT > 2*RADIUS とする。 */
const BODY_HEIGHT = 0.7;
const BODY_RADIUS = 0.24;
/** 前方を示すノーズ（円錐）の寸法。yaw 0 で world +z を向く。 */
const NOSE_LENGTH = 0.28;
const NOSE_RADIUS = 0.14;

/** マス中心・スラブ上面からの本体中心の高さ。 */
const REST_Y = SLAB_HALF + BODY_HEIGHT / 2;

/** 仮アセット色（hex。R3F material は Tailwind/CSS 変数不可、→ maze-3d と同方針）。 */
const BODY_COLOR = "#3e63dd"; // indigo-9
const NOSE_COLOR = "#ffffff";

/**
 * アニメーション所要時間（ms）。〔要確認〕1 動作あたりの時間は未確定のため仮値
 * （→ docs/features.md 7.3）。表示専管の値のため config には出さず ui ローカルに持つ。
 */
const MOVE_DURATION_MS = 450;
const TURN_DURATION_MS = 350;
const FILL_HOLE_DURATION_MS = 500;
const FALL_DURATION_MS = 700;

/** 落下の沈み込み量と穴埋め時のうつむき量。 */
const FALL_DEPTH = FLOOR_GAP + 1;
const FILL_DIP = 0.18;

/** 緩急（イーズインアウト）。0..1 → 0..1。 */
const easeInOutQuad = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** [-π, π] に畳んだ最短角度差。回転補間で遠回りを避ける。 */
const shortestAngle = (delta: number): number => Math.atan2(Math.sin(delta), Math.cos(delta));

interface Tween<T> {
  from: T;
  to: T;
  elapsed: number;
  duration: number;
}

interface ActionAnim {
  kind: RobotAction;
  elapsed: number;
  duration: number;
}

interface Robot3dProps {
  /** 描画対象のロボット状態。 */
  robot: Robot;
  /** 一発アニメ（穴埋め/落下）。値がセット/変化したときに再生する。 */
  action?: RobotAction;
  /** 迷路の一辺のマス数。ワールド中央寄せの offset 算出に使う（maze の size と一致させる）。 */
  gridSize: number;
}

/** ロボットのプリミティブ 3D 表示（位置・向きのアニメーション付き）。 */
export const Robot3d = ({ robot, action, gridSize }: Robot3dProps): React.JSX.Element => {
  const groupRef = useRef<Group>(null);

  // マス中心をグリッド中央に合わせる offset（maze-3d と同式）。
  const offset = (gridSize - 1) / 2;

  // 座標 → ワールド位置。scratch 再利用のため out に書き込む（GC 抑制）。
  const toWorld = useMemo(() => {
    return (coord: RobotCoord, out: Vector3): Vector3 =>
      out.set(
        (coord.col - offset) * CELL,
        coord.floor * FLOOR_GAP + REST_Y,
        (coord.row - offset) * CELL,
      );
  }, [offset]);

  // 位置は primitive で扱い、effect が正確に「変化時のみ」発火するようにする。
  const { floor, row, col } = robot.position;
  const { direction } = robot;

  // tween 状態は ref に保持（初期は原点スナップ。初回 effect が正しい姿勢へ即時反映する）。
  const posTween = useRef<Tween<Vector3>>({
    from: new Vector3(),
    to: new Vector3(),
    elapsed: 0,
    duration: 0,
  });
  const yawTween = useRef<Tween<number>>({ from: 0, to: 0, elapsed: 0, duration: 0 });
  const actionAnim = useRef<ActionAnim | null>(null);
  const isFirstPos = useRef(true);
  const isFirstYaw = useRef(true);

  // 位置が変わったら新しい tween を開始（初回はスナップ）。
  useEffect(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    const to = toWorld({ floor, row, col }, new Vector3());
    posTween.current = {
      from: group.position.clone(),
      to,
      elapsed: 0,
      duration: isFirstPos.current ? 0 : MOVE_DURATION_MS,
    };
    isFirstPos.current = false;
  }, [floor, row, col, toWorld]);

  // 向きが変わったら yaw tween を開始（初回はスナップ）。
  useEffect(() => {
    const yaw = directionToYaw(direction);
    yawTween.current = {
      from: yawTween.current.to,
      to: yaw,
      elapsed: 0,
      duration: isFirstYaw.current ? 0 : TURN_DURATION_MS,
    };
    isFirstYaw.current = false;
  }, [direction]);

  // action がセット/変化したら一発アニメを開始。
  useEffect(() => {
    if (!action) {
      actionAnim.current = null;
      return;
    }
    actionAnim.current = {
      kind: action,
      elapsed: 0,
      duration: action === ROBOT_ACTION.FALL ? FALL_DURATION_MS : FILL_HOLE_DURATION_MS,
    };
  }, [action]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    const ms = delta * 1000;

    // 位置補間（scratch は group.position 自身。lerpVectors が毎フレーム上書きする）。
    const pt = posTween.current;
    pt.elapsed = Math.min(pt.elapsed + ms, pt.duration);
    const tp = pt.duration === 0 ? 1 : clamp(pt.elapsed / pt.duration, 0, 1);
    group.position.lerpVectors(pt.from, pt.to, easeInOutQuad(tp));

    // 向き補間（最短経路）。
    const yt = yawTween.current;
    yt.elapsed = Math.min(yt.elapsed + ms, yt.duration);
    const ty = yt.duration === 0 ? 1 : clamp(yt.elapsed / yt.duration, 0, 1);
    group.rotation.y = yt.from + shortestAngle(yt.to - yt.from) * easeInOutQuad(ty);

    // 一発アニメ（位置・スケールへの上乗せ）。
    let extraY = 0;
    let scale = 1;
    const act = actionAnim.current;
    if (act) {
      act.elapsed += ms;
      const ta = clamp(act.elapsed / act.duration, 0, 1);
      if (act.kind === ROBOT_ACTION.FALL) {
        // 落下: 沈み込みながら縮小（消えていく失敗表現）。終わっても沈んだまま保持。
        extraY = -FALL_DEPTH * easeInOutQuad(ta);
        scale = 1 - ta;
      } else {
        // 穴埋め: 前方へ 1 度うつむいて戻る（sin で往復）。
        extraY = -FILL_DIP * Math.sin(Math.PI * ta);
        if (ta >= 1) {
          actionAnim.current = null;
        }
      }
    }
    group.position.y += extraY;
    group.scale.setScalar(Math.max(scale, 0.0001));
  });

  // 初期姿勢は初回 effect（duration 0）が即時に反映する。ここでは原点に置く。
  return (
    <group ref={groupRef}>
      {/* 胴 */}
      <mesh>
        <capsuleGeometry args={[BODY_RADIUS, BODY_HEIGHT - 2 * BODY_RADIUS, 4, 12]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.6} />
      </mesh>
      {/* ノーズ（前方 = +z）。円錐は既定で +y を向くので x 軸 +90 度で +z へ倒す。 */}
      <mesh position={[0, 0, BODY_RADIUS + NOSE_LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[NOSE_RADIUS, NOSE_LENGTH, 12]} />
        <meshStandardMaterial color={NOSE_COLOR} roughness={0.6} />
      </mesh>
    </group>
  );
};
