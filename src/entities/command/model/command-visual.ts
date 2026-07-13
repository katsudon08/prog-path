/**
 * コマンド識別子 → 見た目（アイコン・名称・色ユーティリティ）の型付きマッピング
 * （FSD: entities/command/model）。
 *
 * 色は global.css 定義の `bg-cmd-*` / `text-cmd-*-foreground` ユーティリティ（ファミリ単位）、
 * アイコンは lucide-react。色のみに依存させず「色 + アイコン + テキスト」で識別する。
 * 対応表の正は docs/design-tokens.md §4/§5、名称の正は docs/glossary.md §4。
 */
import { ArrowUp, Repeat, Repeat1, RotateCcw, RotateCw, Shovel } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LOOP_COMMAND_KIND } from "./types";
import type { CommandKind } from "./types";

/**
 * 表示対象の識別子。QR トークン 6 種に加え、構築済み木のノード種別 `loop` を含む
 * （command-panel が木を描くとき `loop` ノードを 1 チップで表示できるようにするため）。
 */
export type CommandVisualKey = CommandKind | typeof LOOP_COMMAND_KIND;

/** 1 コマンドの見た目定義。 */
export interface CommandVisual {
  /** 日本語名（docs/glossary.md §4）。 */
  labelJa: string;
  /** lucide アイコンコンポーネント。 */
  Icon: LucideIcon;
  /** 背景色ユーティリティ（例 `bg-cmd-move`）。 */
  fillClass: string;
  /** 前景色ユーティリティ（例 `text-cmd-move-foreground`）。 */
  foregroundClass: string;
}

/**
 * 全識別子の見た目定義。`Record` により追加漏れは型エラーになる。
 *
 * @remarks loop 系のアイコン割当（loop/loopStart=Repeat・loopEnd=Repeat1）は暫定。
 * design-tokens §4 は「Repeat / Repeat1」を併記するのみで 1:1 対応が未確定のため、
 * スタック表示を実装する #188 で確定する。
 */
export const COMMAND_VISUALS: Record<CommandVisualKey, CommandVisual> = {
  forward: {
    labelJa: "前にすすむ",
    Icon: ArrowUp,
    fillClass: "bg-cmd-move",
    foregroundClass: "text-cmd-move-foreground",
  },
  turnRight: {
    labelJa: "右にまがる",
    Icon: RotateCw,
    fillClass: "bg-cmd-turn",
    foregroundClass: "text-cmd-turn-foreground",
  },
  turnLeft: {
    labelJa: "左にまがる",
    Icon: RotateCcw,
    fillClass: "bg-cmd-turn",
    foregroundClass: "text-cmd-turn-foreground",
  },
  ifHole: {
    labelJa: "穴をうめる",
    Icon: Shovel,
    fillClass: "bg-cmd-fill",
    foregroundClass: "text-cmd-fill-foreground",
  },
  [LOOP_COMMAND_KIND]: {
    labelJa: "ループ",
    Icon: Repeat,
    fillClass: "bg-cmd-loop",
    foregroundClass: "text-cmd-loop-foreground",
  },
  loopStart: {
    labelJa: "ループ開始",
    Icon: Repeat,
    fillClass: "bg-cmd-loop",
    foregroundClass: "text-cmd-loop-foreground",
  },
  loopEnd: {
    labelJa: "ループ終了",
    Icon: Repeat1,
    fillClass: "bg-cmd-loop",
    foregroundClass: "text-cmd-loop-foreground",
  },
};
