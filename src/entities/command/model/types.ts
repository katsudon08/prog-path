/**
 * コマンドの型（FSD: entities/command/model）
 *
 * 2 つのステージの語彙を扱う。混同しないこと。
 *  1. QR トークン（{@link CommandKind}）: QR カード 1 枚 = 1 トークン。読み取り直後の入力語彙。
 *     開始/終了は `loopStart` / `loopEnd` の対で表す。
 *  2. 構築済みコマンド木（{@link Command}）: QR トークン列を command-management（#186）が
 *     スタックで組み立てた結果。ループは `loop`（回数 + 子コマンド列）1 ノードで表す。
 *
 * 識別子の綴り（大小文字）は docs/glossary.md §4 が正。他 entity（maze/robot）は参照しない。
 */
import { z } from "zod";

/**
 * QR カードの識別子（1 枚 = 1 トークン）の名前付き定数。値は QR 文字列そのもの（リネーム不可）。
 * 参照側は `"forward"` のような素の文字列でなく `COMMAND_KIND.FORWARD` を使う（→ 可読性・単一定義・タイポの型エラー化）。
 * UI の列挙等でも `Object.values(COMMAND_KIND)` で扱える。挿入順が表示・列挙の順。
 * `TILE_KIND`（shared/db）と同じ書式で揃える。識別子の綴りの正は docs/glossary.md §4。
 */
export const COMMAND_KIND = {
  FORWARD: "forward",
  TURN_RIGHT: "turnRight",
  TURN_LEFT: "turnLeft",
  IF_HOLE: "ifHole",
  LOOP_START: "loopStart",
  LOOP_END: "loopEnd",
} as const;

/** QR デコード文字列の検証に使う enum スキーマ（QR 文字列の解釈は #186 が担う）。 */
export const CommandKindSchema = z.enum(COMMAND_KIND);

/** QR トークンの識別子。 */
export type CommandKind = z.infer<typeof CommandKindSchema>;

/** 未知の値を {@link CommandKind} に絞り込む型ガード。 */
export const isCommandKind = (value: unknown): value is CommandKind =>
  CommandKindSchema.safeParse(value).success;

/**
 * 構築済み木の葉コマンド（子を持たない単発命令）。
 * ループ以外の 4 種 = QR トークンからループ開始/終了を除いたもの。
 */
export interface LeafCommand {
  kind: Exclude<CommandKind, typeof COMMAND_KIND.LOOP_START | typeof COMMAND_KIND.LOOP_END>;
}

/**
 * 構築済み木のループノードの種別。QR トークン（`COMMAND_KIND.LOOP_START`/`LOOP_END` の 2 枚組）を
 * 畳んだ「1 ノード」を表す別語彙のため `COMMAND_KIND` には含めず、ここで一度だけ定義する。
 */
export const LOOP_COMMAND_KIND = "loop";

/**
 * 構築済み木のループ（繰り返し回数 + 子コマンド列）。
 * `count` の妥当範囲は shared/config の LOOP_COUNT_MIN〜LOOP_COUNT_MAX（2〜10）が正。
 * 範囲検証・スタック構築は command-management（#186）の責務で、本 entity では型のみを与える。
 */
export interface LoopCommand {
  kind: typeof LOOP_COMMAND_KIND;
  count: number;
  children: Command[];
}

/** 構築済みコマンド木のノード。実行（#185）はこの木を先頭から評価する。 */
export type Command = LeafCommand | LoopCommand;

/** {@link Command} が {@link LoopCommand} かを判定する型ガード。 */
export const isLoopCommand = (command: Command): command is LoopCommand =>
  command.kind === LOOP_COMMAND_KIND;
