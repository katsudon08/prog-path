/**
 * AR ステージの view-model 型（FSD: widgets/ar-stage/model）
 *
 * ページ（#190）と ArStage UI が参照する公開契約。実行状態は features/maze-simulation の
 * XState マシン値を UI 向けの {@link RunStatus} に写像し、コマンド構築は
 * features/command-management の純粋モデルをフックで包んだ結果を公開する。
 */
import type { Command } from "@/entities/command";
import type { Maze } from "@/entities/maze";
import type { Robot, RobotAction } from "@/entities/robot";
import type {
  CommandBuilderOutcome,
  CommandPath,
  InsertionPoint,
} from "@/features/command-management";
import type { FailureReason } from "@/features/maze-simulation";

/**
 * UI が表示に使う実行状態。
 *
 * マシンの `idle` / `building` / `resetting` は、UI にとってはどれも「編集できる待機中」
 * なので `"idle"` に写像する。`"paused"` はマシンには無い概念で、STEP 送信タイマーを
 * 止めているだけのフック層フラグと `"running"` の合成で表す。
 */
export type RunStatus = "idle" | "running" | "paused" | "succeeded" | "failed";

/**
 * トースト等の一度きり表示のための、連番付きコマンド構築 outcome。
 *
 * 同じ内容の outcome が連続しても `seq` が単調増加するため、UI は `seq` を key に
 * 「同一 outcome の再レンダで再発火しない」通知を実装できる。
 */
export interface CommandStackOutcome {
  /** 操作ごとに 1 ずつ増える連番。 */
  readonly seq: number;
  /** features/command-management が返した outcome そのもの。 */
  readonly outcome: CommandBuilderOutcome;
}

/**
 * `useArStage` が返す AR ステージの controller。
 *
 * ページ（#190）が生成し、ArStage UI（後続実装）へ渡す契約。カメラ（use-camera-stream）は
 * 含めない — カメラのライフサイクルは ArStage UI が内部で管理する分担のため。
 */
export interface ArStageController {
  /** 実行対象の迷路（マウント時点で固定。切り替えは呼び出し側の再マウントで行う）。 */
  readonly maze: Maze;

  // --- 実行状態 ---
  /** UI 向けの実行状態。 */
  readonly status: RunStatus;
  /** 編集（QR 追加・削除・位置選択）を受け付けるか。`status === "idle"` と等価。 */
  readonly isEditable: boolean;
  /** 実行中か（paused を含む）。 */
  readonly isRunning: boolean;
  /** 実行を開始できるか（編集中・命令が空でない・loop 回数入力待ちが無い）。 */
  readonly canRun: boolean;
  /** 実行中ロボットの状態。未実行・結果クローズ後は null。 */
  readonly robot: Robot | null;
  /** 実行中の移動回数。未実行時は 0。 */
  readonly moveCount: number;
  /** 位置・向き差分で表せない一発アニメ指示（穴埋め・落下）。無ければ null。 */
  readonly robotAction: RobotAction | null;
  /** 3D 表示する階（0 始まり）。実行中はロボットの到達階へ自動追従する。 */
  readonly visibleFloor: number;
  /** 表示階を手動で切り替える（編集時のみ有効。実行中はイベント追従が正）。 */
  setVisibleFloor: (floor: number) => void;

  // --- 実行操作 ---
  /** 現在のコマンド木で実行を開始する。`canRun` でないときは何もしない。 */
  run: () => void;
  /** STEP 送信を一時停止する（実行中のみ有効）。 */
  pause: () => void;
  /** pause 中の STEP 送信を再開する。 */
  resume: () => void;
  /** 実行をやりなおす（ロボットを開始位置へ戻し、同じ命令で再実行する）。 */
  reset: () => void;
  /** 結果ダイアログを閉じ、編集可能状態へ戻る。 */
  closeResult: () => void;

  // --- 結果ダイアログ ---
  /** 成功ダイアログを開くか。`status === "succeeded"` と等価。 */
  readonly successOpen: boolean;
  /** 失敗ダイアログを開くか。`status === "failed"` と等価。 */
  readonly failureOpen: boolean;
  /** 失敗理由（失敗時のみ）。表示文言化は lib/failure-message が担う。 */
  readonly failureReason: FailureReason | null;

  // --- CommandPanel 契約（widgets/command-panel の props に対応） ---
  /** 構築済みコマンド木。 */
  readonly commands: readonly Command[];
  /** ハイライトする追加位置。features 側の outcome で常に再同期済み。 */
  readonly selected: InsertionPoint;
  /** 実行中コマンドへのパス。実行フェーズ以外は null。 */
  readonly activePath: CommandPath | null;
  /** 実行中は true（追加スロット・削除ボタンを描かせない）。`!isEditable` と等価。 */
  readonly readOnly: boolean;
  /** 追加位置の選択を受け付ける（編集時のみ有効）。 */
  selectInsertionPoint: (point: InsertionPoint) => void;
  /** 指定パスの命令を削除する（編集時のみ有効。確認なし即時 — #239 で確認フローへ差し替え予定）。 */
  deleteCommand: (path: CommandPath) => void;

  // --- QR / ループ回数ダイアログ ---
  /** QR ペイロードを命令構築へ適用する（編集時のみ有効。実行中は無視）。 */
  handleQr: (payload: string) => void;
  /** 直近のコマンド構築 outcome（トースト表示用・連番付き）。未操作時は null。 */
  readonly lastOutcome: CommandStackOutcome | null;
  /** loop 回数入力ダイアログを開くか（loopStart 読み取り後、回数確定まで true）。 */
  readonly loopDialogOpen: boolean;
  /** 保留中 loopStart へ回数を確定する。 */
  confirmLoop: (count: number) => void;
  /** 保留中 loopStart を破棄する。 */
  cancelLoop: () => void;
}
