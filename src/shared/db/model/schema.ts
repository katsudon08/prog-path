import { z } from "zod";

import {
  MAZE_FLOOR_COUNT_MAX,
  MAZE_FLOOR_COUNT_MIN,
  MAZE_SIZE_MAX,
  MAZE_SIZE_MIN,
  UNCATEGORIZED_FOLDER_ID,
} from "@/shared/config";

import { countTileKind } from "../lib/count-tile-kind";

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
 * タイル種別の名前付き定数。値は永続・QR に保存される文字列そのもの（リネーム不可）。
 * 参照側は `"start"` のような素の文字列でなく `TILE_KIND.START` を使う（→ 可読性・単一定義）。
 * UI パレット（#197）等でも `Object.values(TILE_KIND)` で列挙できる。
 * テレポートは上下を別種別として構造を単純化する（→ docs/db-design.md 3.3）。
 */
export const TILE_KIND = {
  FLOOR: "floor",
  WALL: "wall",
  HOLE: "hole",
  START: "start",
  GOAL: "goal",
  TELEPORT_UP: "teleportUp",
  TELEPORT_DOWN: "teleportDown",
  KEY: "key",
} as const;

/** タイル種別スキーマ。`z.enum` に enum-like オブジェクトを渡し、値のユニオンとして検証する。 */
export const TileKindSchema = z.enum(TILE_KIND);

/**
 * フォルダ。未分類は `isDefault: true` かつ予約 nil UUID で常に 1 つ存在する
 * （→ docs/db-design.md 3.1）。
 */
export const FolderSchema = z.object({
  id: uuidField,
  name: z.string().min(1),
  isDefault: z.boolean(),
  createdAt: z.number().int(),
});

/**
 * 迷路。サイズは全階共通（5〜7）、階層は 1〜3。日時は epoch ms（number）で持つ
 * （JSON/QR 境界に強く作成順ソートも数値比較で自明。→ docs/db-design.md 3）。
 *
 * 構造検証（`refine`）は永続化の復旧ゲートを兼ねる:
 * - 階層数と `tiles` の一致、各階が `size × size` であること
 * - スタート/ゴールは各 1 つ
 *
 * テレポート整合（移動先の存在・種別）は編集時に検証する（→ docs/features.md 4.6）。
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

export type TileKind = z.infer<typeof TileKindSchema>;
export type Folder = z.infer<typeof FolderSchema>;
export type Maze = z.infer<typeof MazeSchema>;
