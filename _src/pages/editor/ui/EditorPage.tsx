/**
 * エディターページコンポーネント
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { Navbar, ToastContainer, FloatingActionButton, type FloatingAction } from '@/_src/shared/ui';
import { MazeEditorBoardWidget } from '@/_src/widgets/editor';
import { useMazeStore, saveMazesToStorage, validateMaze, type MazeData, type TileType } from '@/_src/entities/maze';
import { useToast } from '@/_src/shared/ui/toast';

/**
 * デフォルト迷路を作成
 * 左上がスタート、右下がゴール
 */
function createDefaultMaze(): MazeData {
  const size = 5;
  const defaultLayer: TileType[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      // 左上（0,0）がスタート
      if (y === 0 && x === 0) return 'start';
      // 右下（4,4）がゴール
      if (y === size - 1 && x === size - 1) return 'goal';
      return 'floor';
    })
  );
  
  return {
    id: `maze_${Date.now()}`,
    name: '新しい迷路',
    size,
    layers: [defaultLayer],
    currentLayer: 0,
  };
}

export function EditorPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mazeId = searchParams?.get('id');
  const { addToast } = useToast();
  
  const { selectedMaze, getMazeById, selectMaze, addAndSelectMaze, deleteMaze } = useMazeStore();

  useEffect(() => {
    if (mazeId) {
      // 既存迷路を選択
      const maze = getMazeById(mazeId);
      if (maze) {
        selectMaze(maze);
      }
    } else if (!selectedMaze) {
      // 新規迷路を作成・選択
      const newMaze = createDefaultMaze();
      addAndSelectMaze(newMaze);
    }
  }, [mazeId, getMazeById, selectMaze, addAndSelectMaze, selectedMaze]);

  // FABアクション
  const fabActions: FloatingAction[] = useMemo(() => [
    // 保存アクション
    {
      icon: <Save className="w-5 h-5" />,
      label: '保存',
      variant: 'success' as const,
      onClick: () => {
        const currentMaze = useMazeStore.getState().selectedMaze;
        if (!currentMaze) {
          addToast({
            success: false,
            type: 'error',
            message: '迷路が選択されていません',
          });
          return;
        }

        // スタート/ゴールバリデーション
        const validationResult = validateMaze(currentMaze);
        if (!validationResult.success) {
          addToast({
            success: false,
            type: 'error',
            message: validationResult.message,
          });
          return;
        }

        const currentMazes = useMazeStore.getState().mazes;
        saveMazesToStorage(currentMazes);
        addToast({
          success: true,
          type: 'success',
          message: '迷路を保存しました',
        });
        router.push('/');
      },
    },
    // 削除アクション
    {
      icon: <Trash2 className="w-5 h-5" />,
      label: '削除',
      variant: 'danger' as const,
      onClick: () => {
        const currentMaze = useMazeStore.getState().selectedMaze;
        if (!currentMaze) {
          addToast({
            success: false,
            type: 'error',
            message: '迷路が選択されていません',
          });
          return;
        }

        // 迷路を削除
        deleteMaze(currentMaze.id);
        
        // 削除後に保存
        const currentMazes = useMazeStore.getState().mazes;
        saveMazesToStorage(currentMazes);
        
        addToast({
          success: true,
          type: 'info',
          message: '迷路を削除しました',
        });
        router.push('/');
      },
    },
  ], [addToast, router, deleteMaze]);

  return (
    <div className="flex flex-col min-h-screen bg-space-darker">
      <Navbar />

      <main className="flex-1 pt-16 p-6 flex flex-col">
        <MazeEditorBoardWidget className="flex-1" />
      </main>

      {/* フローティングアクションボタン */}
      <FloatingActionButton actions={fabActions} />

      {/* トースト通知 */}
      <ToastContainer />
    </div>
  );
}
