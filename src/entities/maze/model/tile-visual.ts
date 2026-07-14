/**
 * タイル種別 → 見た目（アイコン・名称・色ユーティリティ・3D 色）の型付きマッピング
 * （FSD: entities/maze/model）。
 *
 * 2D は global.css 定義の `bg-tile-*` / `text-tile-*-foreground` ユーティリティ（ライト/ダーク追従）、
 * アイコンは lucide-react。色のみに依存させず「色 + アイコン」で識別する。
 * 対応表の正は docs/design-tokens.md §3、名称の正は docs/glossary.md §2。
 * `entities/command` の command-visual.ts と同じ書式で揃える。
 */
import {
  BrickWall,
  CircleArrowDown,
  CircleArrowUp,
  CircleDashed,
  Flag,
  Key,
  Square,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { TILE_KIND } from "./types";
import type { TileKind } from "./types";

/** 1 タイルの見た目定義（2D）。 */
export interface TileVisual {
  /** 日本語名（docs/glossary.md §2）。 */
  labelJa: string;
  /** lucide アイコンコンポーネント。 */
  Icon: LucideIcon;
  /** 背景色ユーティリティ（例 `bg-tile-floor`）。 */
  fillClass: string;
  /** 前景色ユーティリティ（例 `text-tile-floor-foreground`）。 */
  foregroundClass: string;
}

/**
 * 全タイル種別の見た目定義。`Record` により追加漏れは型エラーになる。
 * fill は Radix step 9（モード非依存）。前景は `text-tile-<name>-foreground`（→ docs/design-tokens.md §3）。
 */
export const TILE_VISUALS: Record<TileKind, TileVisual> = {
  [TILE_KIND.FLOOR]: {
    labelJa: "床",
    Icon: Square,
    fillClass: "bg-tile-floor",
    foregroundClass: "text-tile-floor-foreground",
  },
  [TILE_KIND.WALL]: {
    labelJa: "壁",
    Icon: BrickWall,
    fillClass: "bg-tile-wall",
    foregroundClass: "text-tile-wall-foreground",
  },
  [TILE_KIND.HOLE]: {
    labelJa: "穴",
    Icon: CircleDashed,
    fillClass: "bg-tile-hole",
    foregroundClass: "text-tile-hole-foreground",
  },
  [TILE_KIND.START]: {
    labelJa: "スタート",
    Icon: Flag,
    fillClass: "bg-tile-start",
    foregroundClass: "text-tile-start-foreground",
  },
  [TILE_KIND.GOAL]: {
    labelJa: "ゴール",
    Icon: Trophy,
    fillClass: "bg-tile-goal",
    foregroundClass: "text-tile-goal-foreground",
  },
  [TILE_KIND.TELEPORT_UP]: {
    labelJa: "テレポート（上へ）",
    Icon: CircleArrowUp,
    fillClass: "bg-tile-teleport-up",
    foregroundClass: "text-tile-teleport-up-foreground",
  },
  [TILE_KIND.TELEPORT_DOWN]: {
    labelJa: "テレポート（下へ）",
    Icon: CircleArrowDown,
    fillClass: "bg-tile-teleport-down",
    foregroundClass: "text-tile-teleport-down-foreground",
  },
  [TILE_KIND.KEY]: {
    labelJa: "カギ",
    Icon: Key,
    fillClass: "bg-tile-key",
    foregroundClass: "text-tile-key-foreground",
  },
};

/**
 * タイル種別 → 3D マテリアル色（hex）。R3F の material は CSS 変数/Tailwind クラスを受け取れないため、
 * design-tokens.md §3 の色（Radix step 9 相当）を hex リテラルで持つ。
 *
 * @remarks 仮アセット。本制作（M4/#204）で質感・陰影・モデルに差し替える前提の暫定色。
 */
export const TILE_COLOR_3D: Record<TileKind, string> = {
  [TILE_KIND.FLOOR]: "#f0f0f3", // slate-3（床は淡色）
  [TILE_KIND.WALL]: "#8b8d98", // slate-9
  [TILE_KIND.HOLE]: "#1c2024", // 固定暗色
  [TILE_KIND.START]: "#46a758", // grass-9
  [TILE_KIND.GOAL]: "#ffc53d", // amber-9
  [TILE_KIND.TELEPORT_UP]: "#6e56cf", // violet-9
  [TILE_KIND.TELEPORT_DOWN]: "#3e63dd", // indigo-9
  [TILE_KIND.KEY]: "#ffe629", // yellow-9
};
