/**
 * 実行イベント → 表示情報の導出（FSD: widgets/ar-stage/lib）
 *
 * features/maze-simulation の `context.lastEvents`（直近 1 STEP のドメインイベント列）から、
 * AR ステージの表示に必要な値を導出する純粋関数。マシンは失敗理由や実行中コマンド位置を
 * 専用フィールドに持たず `lastEvents` にのみ含めるため、ここで一元的に読み解く。
 */
import { ROBOT_ACTION } from "@/entities/robot";
import type { RobotAction } from "@/entities/robot";
import type { CommandPath } from "@/features/command-management";
import { EXECUTION_EVENT_TYPE, FAILURE_REASON } from "@/features/maze-simulation";
import type { ExecutionEvent, FailureReason } from "@/features/maze-simulation";

/** `lastEvents` から導出した、AR ステージ表示用のスナップショット。 */
export interface ExecutionView {
  /** 直近に実行されたコマンドへのパス（CommandPanel の実行中強調に使う）。無ければ null。 */
  readonly activePath: CommandPath | null;
  /** Robot3d へ渡す一発アニメ指示（穴埋め・落下）。無ければ null。 */
  readonly robotAction: RobotAction | null;
  /** 移動・テレポートの到達階（表示階の自動追従に使う）。移動が無ければ null。 */
  readonly visibleFloorFromEvents: number | null;
  /** 失敗イベントの理由。失敗していなければ null。 */
  readonly failureReason: FailureReason | null;
}

/**
 * 直近 STEP のイベント列から表示用スナップショットを導出する。
 *
 * イベントは発生順に並ぶため、同種イベントが複数あれば後勝ちで反映する。
 * - `command-executed` → activePath
 * - `hole-filled` → 穴埋めアニメ、`failure(reason=hole-fall)` → 落下アニメ
 * - `moved` / `teleported` → 到達先の階
 * - `failure` → 失敗理由
 *
 * @param events マシン `context.lastEvents`（直近 1 STEP のイベント列）
 * @returns 表示用スナップショット
 */
export const deriveExecutionView = (events: readonly ExecutionEvent[]): ExecutionView => {
  let activePath: CommandPath | null = null;
  let robotAction: RobotAction | null = null;
  let visibleFloorFromEvents: number | null = null;
  let failureReason: FailureReason | null = null;

  for (const event of events) {
    switch (event.type) {
      case EXECUTION_EVENT_TYPE.COMMAND_EXECUTED:
        activePath = event.commandPath;
        break;
      case EXECUTION_EVENT_TYPE.HOLE_FILLED:
        robotAction = ROBOT_ACTION.FILL_HOLE;
        break;
      case EXECUTION_EVENT_TYPE.MOVED:
      case EXECUTION_EVENT_TYPE.TELEPORTED:
        visibleFloorFromEvents = event.to.floor;
        break;
      case EXECUTION_EVENT_TYPE.FAILURE:
        failureReason = event.reason;
        if (event.reason === FAILURE_REASON.HOLE_FALL) {
          robotAction = ROBOT_ACTION.FALL;
        }
        break;
      default:
        break;
    }
  }

  return { activePath, robotAction, visibleFloorFromEvents, failureReason };
};
