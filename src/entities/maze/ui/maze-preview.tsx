/**
 * MazePreview（FSD: entities/maze/ui）
 *
 * 迷路 1 階分を俯瞰（真上から）で描くプレゼンテーショナルな 2D プレビュー。
 * 既定ではスタートのある階を表示する（ホームの迷路カード＝「スタートのある階の俯瞰」#196）。
 * 各セルは {@link TILE_VISUALS} 由来のトークンユーティリティで塗り、色のみに依存させず
 * アイコンを併記する（→ docs/design-tokens.md §3）。ライト/ダークに追従。
 *
 * 純粋にプレゼンテーショナル。迷路名などのラベル付け（`aria-label` 等）は、名前をテキスト表示する
 * 消費側（迷路カード #196 等）の責務とする。編集グリッド（タイル配置・パレット）も持たない
 * （widgets/maze-editor #197・features/maze-edit #195 の責務）。
 */
import { cn } from "@/shared/lib";

import { findStartFloor } from "../model/tile";
import { TILE_VISUALS } from "../model/tile-visual";
import type { Maze } from "../model/types";

interface MazePreviewProps {
  /** 描画対象の迷路。 */
  maze: Maze;
  /** 表示する階（0 始まり）。省略時はスタートのある階。 */
  floor?: number;
  /** 既定クラスへの上書き・拡張（cn 経由）。 */
  className?: string;
}

/** 迷路 1 階分の俯瞰プレビュー。 */
export const MazePreview = ({ maze, floor, className }: MazePreviewProps): React.JSX.Element => {
  const targetFloor = floor ?? findStartFloor(maze);
  const grid = maze.tiles[targetFloor] ?? [];

  return (
    <div
      className={cn("inline-grid overflow-hidden gap-px rounded-tile bg-tile-wall", className)}
      style={{ gridTemplateColumns: `repeat(${maze.size}, minmax(0, 1fr))` }}
    >
      {grid.flatMap((rowTiles, row) =>
        rowTiles.map((kind, col) => {
          const { labelJa, Icon, fillClass, foregroundClass } = TILE_VISUALS[kind];
          return (
            <div
              key={`${row}-${col}`}
              className={cn(
                "flex aspect-square items-center justify-center",
                fillClass,
                foregroundClass,
              )}
              title={labelJa}
            >
              <Icon aria-hidden className="size-2/3" />
            </div>
          );
        }),
      )}
    </div>
  );
};
