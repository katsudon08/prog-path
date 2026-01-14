/**
 * 迷路エディターボードウィジェット
 * GridEditor, TilePalette, LayerNavigator を統合
 */

'use client';

import React, { useState } from 'react';
import { GridEditor } from '@/_src/features/maze-edit/ui/GridEditor';
import { TilePalette } from '@/_src/features/maze-edit/ui/TilePalette';
import { LayerNavigator } from '@/_src/features/maze-edit/ui/LayerNavigator';
import { EditorControls } from '@/_src/features/maze-edit/ui/EditorControls';
import { useMazeStore, type TileType, type MazeData } from '@/_src/entities/maze';
import { useTileSelection } from '@/_src/features/maze-edit/model/useTileSelection';
import { createSuccessResult, createErrorResult } from '@/_src/shared/model';

interface MazeEditorBoardWidgetProps {
  /** 編集対象の迷路（省略時はストアから取得） */
  maze?: MazeData;
  /** 迷路変更時のコールバック */
  onMazeChange?: (maze: MazeData) => void;
  className?: string;
}

export function MazeEditorBoardWidget({
  maze: externalMaze,
  onMazeChange,
  className = '',
}: MazeEditorBoardWidgetProps): React.ReactElement {
  const { selectedMaze, updateMaze } = useMazeStore();
  const maze = externalMaze ?? selectedMaze;
  const { selectedTile } = useTileSelection();

  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);

  if (!maze) {
    return (
      <div className={`text-center text-muted-foreground py-12 ${className}`}>
        <p className="text-sm">迷路を選択してください</p>
      </div>
    );
  }

  const currentLayer = maze.layers?.[currentLayerIndex];
  const layerCount = maze.layers?.length || 1;
  const size = currentLayer?.[0]?.length || 5;

  const handleTileClick = (row: number, col: number) => {
    if (!maze.layers) return;

    const newLayers = maze.layers.map((layer, li) =>
      li === currentLayerIndex
        ? layer.map((r, ri) =>
            ri === row
              ? r.map((c, ci) => (ci === col ? selectedTile : c))
              : r
          )
        : layer
    );

    updateMaze(maze.id, { layers: newLayers });
    onMazeChange?.({ ...maze, layers: newLayers });
  };

  const handleSizeChange = (newSize: number) => {
    const newLayers = maze.layers?.map((layer) => {
      const newLayer: TileType[][] = [];
      for (let y = 0; y < newSize; y++) {
        const row: TileType[] = [];
        for (let x = 0; x < newSize; x++) {
          row.push(layer[y]?.[x] ?? 'floor');
        }
        newLayer.push(row);
      }
      return newLayer;
    }) || [];

    updateMaze(maze.id, { layers: newLayers });
    onMazeChange?.({ ...maze, layers: newLayers });
  };

  const handleLayerCountChange = (newCount: number) => {
    if (!maze.layers) return;

    let newLayers = [...maze.layers];
    const currentSize = maze.layers[0]?.[0]?.length || 5;

    if (newCount > newLayers.length) {
      for (let i = newLayers.length; i < newCount; i++) {
        const emptyLayer: TileType[][] = Array.from({ length: currentSize }, () =>
          Array(currentSize).fill('floor')
        );
        newLayers.push(emptyLayer);
      }
    } else {
      newLayers = newLayers.slice(0, newCount);
    }

    updateMaze(maze.id, { layers: newLayers });
    onMazeChange?.({ ...maze, layers: newLayers });

    if (currentLayerIndex >= newCount) {
      setCurrentLayerIndex(newCount - 1);
    }
  };

  const canGoPrev = currentLayerIndex > 0;
  const canGoNext = currentLayerIndex < layerCount - 1;
  const canAddLayer = layerCount < 5;
  const canRemoveLayer = layerCount > 1;

  const handlePrevLayer = () => setCurrentLayerIndex((i) => Math.max(0, i - 1));
  const handleNextLayer = () => setCurrentLayerIndex((i) => Math.min(layerCount - 1, i + 1));

  const handleAddLayer = () => {
    if (!canAddLayer) return createErrorResult('最大5階層です');
    handleLayerCountChange(layerCount + 1);
    return createSuccessResult('階層を追加しました');
  };

  const handleRemoveLayer = () => {
    if (!canRemoveLayer) return createErrorResult('最低1階層必要です');
    handleLayerCountChange(layerCount - 1);
    return createSuccessResult('階層を削除しました');
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* コントロール */}
      <EditorControls
        size={size}
        layerCount={layerCount}
        onSizeChange={handleSizeChange}
        onLayerCountChange={handleLayerCountChange}
      />

      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        {/* タイルパレット (props不要、内部でuseTileSelection使用) */}
        <div className="shrink-0">
          <TilePalette />
        </div>

        {/* グリッドエディター */}
        <div className="flex-1 flex justify-center">
          {currentLayer && (
            <GridEditor
              grid={currentLayer}
              onTileClick={handleTileClick}
              maxWidth={500}
              maxHeight={500}
            />
          )}
        </div>

        {/* レイヤーナビゲーター */}
        {layerCount > 1 && (
          <div className="shrink-0">
            <LayerNavigator
              currentLayer={currentLayerIndex}
              totalLayers={layerCount}
              canAddLayer={canAddLayer}
              canRemoveLayer={canRemoveLayer}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrevLayer={handlePrevLayer}
              onNextLayer={handleNextLayer}
              onAddLayer={handleAddLayer}
              onRemoveLayer={handleRemoveLayer}
            />
          </div>
        )}
      </div>
    </div>
  );
}
