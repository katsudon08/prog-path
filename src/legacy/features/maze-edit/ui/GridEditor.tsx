/**
 * グリッドエディタ
 * 迷路のタイルをクリック/ドラッグで編集
 */

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TileType } from '@/legacy/entities/maze';
import { getTileColor, getTileIcon } from '@/legacy/entities/maze';

interface GridEditorProps {
  grid: TileType[][];
  onTileClick: (row: number, col: number) => void;
  /** コンテナ幅に対するグリッドの割合（デフォルト: 0.7 = 70%） */
  containerWidthPercent?: number;
}

const DEFAULT_CELL_SIZE = 48;
const MIN_CELL_SIZE = 24;
const GAP = 4;
const PADDING = 16;

/**
 * グリッドエディタUIコンポーネント
 * マウスドラッグによる連続配置に対応
 * 親コンテナの幅に対して指定割合でスケーリング
 */
export function GridEditor({
  grid,
  onTileClick,
  containerWidthPercent = 0.7,
}: GridEditorProps): React.ReactElement {
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // 親コンテナの幅を監視
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current?.parentElement) {
        setContainerWidth(containerRef.current.parentElement.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // グリッドサイズに応じてセルサイズを計算（コンテナの70%に収める）
  const { cellSize, gridContainerSize } = useMemo(() => {
    const rows = grid?.length || 0;
    const cols = grid?.[0]?.length || 0;

    if (rows === 0 || cols === 0 || containerWidth === 0) {
      return { cellSize: DEFAULT_CELL_SIZE, gridContainerSize: 280 };
    }

    // ターゲットサイズ = 親コンテナ幅の指定割合
    const targetSize = containerWidth * containerWidthPercent;
    const maxDimension = Math.max(rows, cols);

    // ターゲットサイズに収まるようセルサイズを計算
    const availableSize = targetSize - PADDING * 2;
    const cellSizeForDimension = (availableSize - (maxDimension - 1) * GAP) / maxDimension;
    const calculatedCellSize = Math.max(MIN_CELL_SIZE, Math.floor(cellSizeForDimension));

    // 実際のグリッドコンテナサイズを計算
    const actualGridSize = maxDimension * calculatedCellSize + (maxDimension - 1) * GAP + PADDING * 2;

    return { cellSize: calculatedCellSize, gridContainerSize: actualGridSize };
  }, [grid, containerWidth, containerWidthPercent]);

  const iconSize = Math.max(12, Math.floor(cellSize * 0.6));

  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      setIsDrawing(true);
      onTileClick(row, col);
    },
    [onTileClick]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (isDrawing) {
        onTileClick(row, col);
      }
    },
    [isDrawing, onTileClick]
  );

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const cellStyle = {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
  };

  const containerStyle = {
    width: `${gridContainerSize}px`,
    height: `${gridContainerSize}px`,
  };

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center">
      <div
        className="inline-flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-neon-cyan/30 bg-space-dark p-4"
        style={containerStyle}
        onMouseLeave={handleMouseLeave}
      >
        {grid?.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((tile, colIndex) => {
              const icon = getTileIcon(tile, iconSize);
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  style={cellStyle}
                  className={`rounded border-2 border-neon-blue/20 transition-all hover:border-neon-cyan hover:scale-105 flex items-center justify-center ${getTileColor(tile)}`}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseUp={handleMouseUp}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
