import { z } from "zod";

import {
  MAZE_FLOOR_COUNT_MAX,
  MAZE_FLOOR_COUNT_MIN,
  MAZE_SIZE_MAX,
  MAZE_SIZE_MIN,
  UNCATEGORIZED_FOLDER_ID,
} from "@/shared/config";

import { countTileKind } from "../lib/count-tile-kind";
import { validateTeleportLinks } from "../lib/validate-teleport-links";
import { TILE_KIND, TileKindSchema } from "./tile-kind";

export { TILE_KIND, TileKindSchema } from "./tile-kind";
export type { TileKind } from "./tile-kind";

/**
 * エンティティ ID フィールド。
 *
 * 生成 ID は UUID v4（`crypto.randomUUID()`）だが、未分類フォルダのみ予約 nil UUID
 * （`UNCATEGORIZED_FOLDER_ID`）を用いる。Zod の `z.uuid()` は版数（version nibble）を
 * 検査し nil（全 0）を弾くため、nil を明示的に許容する union で「v4 または予約 nil」を通す。
 * （→ docs/db-design.md 4 / #179）
 */
const uuidField = z.union([z.uuid(), z.literal(UNCATEGORIZED_FOLDER_ID)]);

/**
 * フォルダ。未分類・チュートリアルは予約 ID（`UNCATEGORIZED_FOLDER_ID` /
 * `TUTORIAL_FOLDER_ID`）を持ち、起動時に存在保証される（→ docs/db-design.md 3.1）。
 *
 * 予約フォルダかどうかを表す永続フィールドは持たない。**判別は予約 ID の一致のみ**で行い、
 * 種別ごとの可否（削除・リネーム・出入り）は entities/folder が決める（→ #192）。
 * 永続フラグを併置すると ID と食い違う余地が生まれるため、単一の判別根拠に寄せている。
 */
export const FolderSchema = z.object({
  id: uuidField,
  name: z.string().min(1),
  createdAt: z.number().int(),
});

/**
 * 迷路。サイズは全階共通（5〜7）、階層は 1〜3。日時は epoch ms（number）で持つ
 * （JSON/QR 境界に強く作成順ソートも数値比較で自明。→ docs/db-design.md 3）。
 *
 * 構造検証（`refine`）のみを行い、永続化の復旧ゲート（起動時 purge）を兼ねる:
 * - 階層数と `tiles` の一致、各階が `size × size` であること
 * - スタート/ゴールは各 1 つ
 *
 * テレポート整合（移動先の存在・種別）はここでは検証しない。破壊的な purge で
 * 迷路を丸ごと削除しないためであり、テレポート整合は {@link PlayableMazeSchema} が
 * 担う（実行前チェックと保存フロー #195 で使用。→ docs/features.md 4.6 / #179）。
 */
export const MazeSchema = z
  .object({
    id: uuidField,
    name: z.string().min(1),
    size: z.number().int().min(MAZE_SIZE_MIN).max(MAZE_SIZE_MAX),
    floors: z.number().int().min(MAZE_FLOOR_COUNT_MIN).max(MAZE_FLOOR_COUNT_MAX),
    tiles: z.array(z.array(z.array(TileKindSchema))),
    folderId: uuidField,
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .refine((m) => m.tiles.length === m.floors, "階層数が tiles と不一致")
  .refine(
    (m) =>
      m.tiles.every(
        (floor) => floor.length === m.size && floor.every((row) => row.length === m.size),
      ),
    "各階の寸法が size と不一致",
  )
  .refine((m) => countTileKind(m.tiles, TILE_KIND.START) === 1, "スタートは 1 つ")
  .refine((m) => countTileKind(m.tiles, TILE_KIND.GOAL) === 1, "ゴールは 1 つ");

/**
 * 実行・保存に耐える「プレイ可能な迷路」スキーマ。
 *
 * {@link MazeSchema} の構造検証に加え、テレポートの同位置移動先が存在し、
 * 壁・穴・テレポートでないことを検証する。実行前チェック（maze-simulation）と
 * 迷路エディタの保存フロー（#195）で使い、不正な場合は「拒否するだけ」で
 * 既存データは削除しない（→ docs/features.md 4.6）。
 */
export const PlayableMazeSchema = MazeSchema.superRefine((maze, context) => {
  for (const issue of validateTeleportLinks(maze)) {
    const destination = `floor=${issue.destination.floor}, row=${issue.destination.row}, col=${issue.destination.col}`;
    context.addIssue({
      code: "custom",
      path: ["tiles", issue.source.floor, issue.source.row, issue.source.col],
      message:
        issue.code === "destination-out-of-bounds"
          ? `テレポート先が迷路の範囲外です（${destination}）`
          : `テレポート先に移動できないタイルがあります（${destination}）`,
    });
  }
});

export type Folder = z.infer<typeof FolderSchema>;
export type Maze = z.infer<typeof MazeSchema>;
