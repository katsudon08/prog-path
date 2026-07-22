/**
 * Maze3d（FSD: entities/maze/ui）
 *
 * 迷路を 3D で描く R3F コンポーネント。AR ステージ（#187）でカメラ映像に重畳される表示対象。
 * 全階を縦方向（y）に段で積み、各タイルをプリミティブ（箱）で表現する。
 *
 * タイル種別 → 描画コンポーネントの対応は `TILE_3D`（`Record<TileKind, …>`）で表引きする
 * （if 分岐でなくコンポーネントマップ。種別を増やすと Record が実装を型で要求する）。
 *
 * @remarks 仮アセット。本制作（M4/#204）で GLTF モデル・質感に差し替える前提の暫定表現。
 * ロボットは別 entity（#183）で描き、合成は上位（widgets/ar-stage）が行う（本 entity は他 entity を参照しない）。
 * 静的な迷路のため per-frame 更新は持たない。アニメーションを足す場合は useFrame 内で
 * ref を直接操作し setState を避ける（→ CLAUDE.md R3F 規約）。
 */
import { useMemo } from "react";
import { BoxGeometry } from "three";

import { CELL, SURFACE_OFFSET, gridToWorld } from "@/shared/grid";

import { TILE_COLOR_3D } from "../model/tile-visual";
import { TILE_KIND } from "../model/types";
import type { Maze, TileKind } from "../model/types";

/** タイル本体の一辺。間隔よりわずかに小さくし、マス間に隙間（グリッド線）を作って視認性を上げる。 */
const TILE = CELL * 0.92;
/** 床スラブの厚み。 */
const SLAB_HEIGHT = 0.15;
/** 壁の高さ。 */
const WALL_HEIGHT = 0.9;
/** start/goal/teleport/key を示すマーカー立方体の一辺。 */
const MARKER_SIZE = 0.4;

/** セル間で共有するジオメトリ一式（Maze3d が useMemo で生成し、各タイルへ渡す）。 */
interface TileGeometries {
  slab: BoxGeometry;
  wall: BoxGeometry;
  marker: BoxGeometry;
}

interface TileProps {
  /** マス中心・スラブ上面基準のワールド座標。 */
  position: [number, number, number];
  geometries: TileGeometries;
}

/** タイル 1 枚を描くコンポーネントの形。`TILE_3D` の値の型。 */
type TileComponent = (props: TileProps) => React.JSX.Element;

/** 床：薄い板。 */
const FloorTile3d = ({ position, geometries }: TileProps): React.JSX.Element => (
  <mesh geometry={geometries.slab} position={position}>
    <meshStandardMaterial color={TILE_COLOR_3D[TILE_KIND.FLOOR]} roughness={0.85} />
  </mesh>
);

/** 壁：床より高い箱（道を塞ぐ）。 */
const WallTile3d = ({ position, geometries }: TileProps): React.JSX.Element => {
  const [x, y, z] = position;
  return (
    <mesh geometry={geometries.wall} position={[x, y + WALL_HEIGHT / 2, z]}>
      <meshStandardMaterial color={TILE_COLOR_3D[TILE_KIND.WALL]} roughness={0.85} />
    </mesh>
  );
};

/** 穴：床より一段下げた板（落ちる窪み）。 */
const HoleTile3d = ({ position, geometries }: TileProps): React.JSX.Element => {
  const [x, y, z] = position;
  return (
    <mesh geometry={geometries.slab} position={[x, y - SLAB_HEIGHT, z]}>
      <meshStandardMaterial color={TILE_COLOR_3D[TILE_KIND.HOLE]} roughness={0.85} />
    </mesh>
  );
};

/**
 * start/goal/teleport/key は「床＋種別色のマーカー立方体」で描画が共通（色だけ違う）。
 * 種別を捕捉するファクトリで各コンポーネントを一度だけ生成し、マーカー系の実装重複を避ける。
 */
const makeMarkerTile3d = (kind: TileKind): TileComponent => {
  const MarkerTile3d = ({ position, geometries }: TileProps): React.JSX.Element => {
    const [x, y, z] = position;
    const color = TILE_COLOR_3D[kind];
    return (
      <group>
        <mesh geometry={geometries.slab} position={position}>
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh geometry={geometries.marker} position={[x, y + SURFACE_OFFSET + MARKER_SIZE / 2, z]}>
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      </group>
    );
  };
  return MarkerTile3d;
};

/**
 * タイル種別 → 3D 描画コンポーネントの対応表（if 分岐の置き換え）。
 * `Record<TileKind, …>` なので、種別を 1 つ足すとここに実装が無いと型エラーになる（網羅性の強制）。
 */
const TILE_3D: Record<TileKind, TileComponent> = {
  [TILE_KIND.FLOOR]: FloorTile3d,
  [TILE_KIND.WALL]: WallTile3d,
  [TILE_KIND.HOLE]: HoleTile3d,
  [TILE_KIND.START]: makeMarkerTile3d(TILE_KIND.START),
  [TILE_KIND.GOAL]: makeMarkerTile3d(TILE_KIND.GOAL),
  [TILE_KIND.TELEPORT_UP]: makeMarkerTile3d(TILE_KIND.TELEPORT_UP),
  [TILE_KIND.TELEPORT_DOWN]: makeMarkerTile3d(TILE_KIND.TELEPORT_DOWN),
  [TILE_KIND.KEY]: makeMarkerTile3d(TILE_KIND.KEY),
};

interface Maze3dProps {
  /** 描画対象の迷路。 */
  maze: Maze;
}

/** 迷路全階のプリミティブ 3D 表示。 */
export const Maze3d = ({ maze }: Maze3dProps): React.JSX.Element => {
  // ジオメトリはセル間で共有し、マス数ぶんの再生成を避ける（→ CLAUDE.md R3F 規約）。
  const geometries = useMemo<TileGeometries>(
    () => ({
      slab: new BoxGeometry(TILE, SLAB_HEIGHT, TILE),
      wall: new BoxGeometry(TILE, WALL_HEIGHT, TILE),
      marker: new BoxGeometry(MARKER_SIZE, MARKER_SIZE, MARKER_SIZE),
    }),
    [],
  );

  return (
    <group>
      {maze.tiles.flatMap((floorTiles, floor) =>
        floorTiles.flatMap((rowTiles, row) =>
          rowTiles.map((kind, col) => {
            const Tile = TILE_3D[kind];
            return (
              <Tile
                key={`${floor}-${row}-${col}`}
                position={gridToWorld({ floor, row, col }, maze.size)}
                geometries={geometries}
              />
            );
          }),
        ),
      )}
    </group>
  );
};
