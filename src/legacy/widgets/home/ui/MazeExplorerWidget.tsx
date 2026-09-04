/**
 * 迷路エクスプローラーウィジェット
 * 迷路リスト表示
 */

'use client';

import React from 'react';
import { MazeCard, MazePreview2D, useMazeStore, type MazeData } from '@/legacy/entities/maze';

interface MazeExplorerWidgetProps {
  /** 表示する迷路リスト（外部から渡す場合） */
  mazes?: MazeData[];
  /** 削除時のコールバック */
  onDelete?: (mazeId: string) => void;
  className?: string;
}

/**
 * 迷路サイズラベルを生成
 */
function getMazeSizeLabel(maze: MazeData): string {
  const layer = maze.layers?.[0];
  if (!layer || layer.length === 0) return '0x0';
  const rows = layer.length;
  const cols = layer[0]?.length || 0;
  const layerCount = maze.layers?.length || 1;
  if (layerCount > 1) {
    return `${cols}x${rows} (${layerCount}階)`;
  }
  return `${cols}x${rows}`;
}

export function MazeExplorerWidget({
  mazes: externalMazes,
  onDelete,
  className = '',
}: MazeExplorerWidgetProps): React.ReactElement {
  const { mazes: storeMazes, selectedMaze, selectMaze } = useMazeStore();

  // 外部から渡されれば使用、なければストアから取得
  const mazes = externalMazes ?? storeMazes;

  const handleMazeClick = (maze: MazeData) => {
    selectMaze(maze);
  };

  return (
    <div className={`flex flex-col gap-2 p-4 ${className}`}>
      {/* 迷路一覧 */}
      {mazes.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">迷路がありません</p>
          <p className="text-xs mt-1">右下の + ボタンから新しい迷路を作成するかQRコードでインポート</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mazes.map((maze) => (
            <MazeCard
              key={maze.id}
              id={maze.id}
              name={maze.name}
              sizeLabel={getMazeSizeLabel(maze)}
              isSelected={selectedMaze?.id === maze.id}
              onSelect={() => handleMazeClick(maze)}
              onDelete={onDelete ? () => onDelete(maze.id) : undefined}
              preview={
                <MazePreview2D
                  layers={maze.layers}
                  cellSize={8}
                  showNavigation={false}
                  compact={true}
                  maxWidth={56}
                  maxHeight={56}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
