/**
 * 迷路エディターボードウィジェット
 * GridEditor, TilePalette, LayerNavigator を統合
 * ローカル状態で編集し、保存ボタン押下時のみストアを更新
 */

'use client';

import React, { useState, useEffect } from 'react';
import { GridEditor } from '@/_src/features/maze-edit/ui/GridEditor';
import { TilePalette } from '@/_src/features/maze-edit';
import { LayerNavigator } from '@/_src/features/maze-edit/ui/LayerNavigator';
import { EditorControls } from '@/_src/features/maze-edit/ui/EditorControls';
import { 
  useMazeStore, 
  validateTeleportPlacement,
  type TileType, 
  type MazeData 
} from '@/_src/entities/maze';
import { useTileSelection } from '@/_src/features/maze-edit/model/useTileSelection';
import { useToast } from '@/_src/shared/ui/toast';

interface MazeEditorBoardWidgetProps {
  /** 編集対象の迷路（省略時はストアから取得） */
  maze?: MazeData;
  /** 迷路変更時のコールバック（ローカル編集時に呼ばれる） */
  onMazeChange?: (maze: MazeData) => void;
  className?: string;
}

export function MazeEditorBoardWidget({
  maze: externalMaze,
  onMazeChange,
  className = '',
}: MazeEditorBoardWidgetProps): React.ReactElement {
  const { selectedMaze, setEditingMaze, clearEditingMaze } = useMazeStore();
  const sourceMaze = externalMaze ?? selectedMaze;
  const { selectedTile } = useTileSelection();
  const { addToast } = useToast();

  // ローカル編集用の状態
  const [editingMaze, setLocalEditingMaze] = useState<MazeData | null>(null);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);

  // 初回マウント時とsourceMazeが変わった時にローカル状態を初期化
  useEffect(() => {
    if (sourceMaze) {
      const mazeCopy = JSON.parse(JSON.stringify(sourceMaze)) as MazeData;
      setLocalEditingMaze(mazeCopy);
      // ストアにも編集中の迷路を設定（保存ボタンで使用）
      setEditingMaze(mazeCopy);
    }
    return () => {
      clearEditingMaze();
    };
  }, [sourceMaze?.id]); // IDが変わった時のみ再初期化

  const maze = editingMaze;

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

  // ローカル状態を更新するヘルパー関数
  const updateLocalMaze = (updates: Partial<MazeData>) => {
    const updatedMaze = { ...maze, ...updates };
    setLocalEditingMaze(updatedMaze);
    setEditingMaze(updatedMaze); // ストアの編集中迷路も更新
    onMazeChange?.(updatedMaze);
  };

  const handleTileClick = (row: number, col: number) => {
    if (!maze.layers) return;

    // テレポートタイルのバリデーション
    if (selectedTile === 'teleportUp' || selectedTile === 'teleportDown' || 
        selectedTile === 'wall' || selectedTile === 'hole') {
      const validationResult = validateTeleportPlacement(
        maze.layers,
        currentLayerIndex,
        row,
        col,
        selectedTile
      );
      
      if (!validationResult.success) {
        addToast({
          success: false,
          type: 'error',
          message: validationResult.message,
        });
        return;
      }
    }

    // スタート/ゴールの自動置換（2個目以降は古いものをミチに変換）
    let layersToUpdate = maze.layers;
    if (selectedTile === 'start' || selectedTile === 'goal') {
      layersToUpdate = maze.layers.map((layer) =>
        layer.map((r) =>
          r.map((c) => (c === selectedTile ? 'floor' : c))
        )
      );
    }

    const newLayers = layersToUpdate.map((layer, li) =>
      li === currentLayerIndex
        ? layer.map((r, ri) =>
            ri === row
              ? r.map((c, ci) => (ci === col ? selectedTile : c))
              : r
          )
        : layer
    );

    updateLocalMaze({ layers: newLayers });
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

    updateLocalMaze({ layers: newLayers });
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

    updateLocalMaze({ layers: newLayers });

    if (currentLayerIndex >= newCount) {
      setCurrentLayerIndex(newCount - 1);
    }
  };

  const handleNameChange = (newName: string) => {
    updateLocalMaze({ name: newName });
  };

  const canGoPrev = currentLayerIndex > 0;
  const canGoNext = currentLayerIndex < layerCount - 1;

  const handlePrevLayer = () => setCurrentLayerIndex((i) => Math.max(0, i - 1));
  const handleNextLayer = () => setCurrentLayerIndex((i) => Math.min(layerCount - 1, i + 1));

  return (
    <div className={`flex gap-6 h-full ${className}`}>
      {/* 左側: MazePreview (GridEditor) - 1:1比率、上下中央 */}
      <div className="flex-1 flex items-center justify-center">
        {currentLayer && (
          <GridEditor
            grid={currentLayer}
            onTileClick={handleTileClick}
          />
        )}
      </div>

      {/* 右側 - 1:1比率、上下中央 */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* 迷路名編集 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neon-cyan/70">名前</label>
          <input
            type="text"
            value={maze.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="bg-space-dark border border-neon-blue/30 rounded px-3 py-2 text-neon-cyan focus:border-neon-cyan focus:outline-none"
            placeholder="迷路の名前"
          />
        </div>

        {/* 右上: コントロール（一段目）+ 階層切り替え（二段目） */}
        <div className="flex flex-col gap-3">
          <EditorControls
            size={size}
            layerCount={layerCount}
            onSizeChange={handleSizeChange}
            onLayerCountChange={handleLayerCountChange}
          />
          <LayerNavigator
            currentLayer={currentLayerIndex}
            totalLayers={layerCount}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrevLayer={handlePrevLayer}
            onNextLayer={handleNextLayer}
          />
        </div>

        {/* 右下: タイルパレット */}
        <div>
          <TilePalette />
        </div>
      </div>
    </div>
  );
}
