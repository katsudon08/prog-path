import { z } from "zod";

/** 永続化されるタイル種別の名前付き定数。 */
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

/** タイル種別の検証スキーマ。 */
export const TileKindSchema = z.enum(TILE_KIND);

/** 永続化されるタイル種別。 */
export type TileKind = z.infer<typeof TileKindSchema>;
