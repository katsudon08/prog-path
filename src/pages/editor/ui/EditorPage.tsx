/**
 * エディターページコンポーネント
 */

'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { Navbar, ToastContainer, FloatingActionButton, type FloatingAction } from '@/src/shared/ui';
import { MazeEditorBoardWidget } from '@/src/widgets/editor';
import { useMazeStore, saveMazesToStorage, validateMaze, type MazeData, type TileType } from '@/src/entities/maze';
import { useToast } from '@/src/shared/ui/toast';

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

  // 初期化フラグ（Strict Modeでの重複実行防止）
  const isInitialized = useRef(false);
  // 新規作成かどうかのフラグ
  const isNewMaze = useRef(false);

  const { getMazeById, selectMaze, addMaze, updateMaze, deleteMaze, initialize, isLoaded } = useMazeStore();

  // マウント時に初期化＆迷路選択
  useEffect(() => {
    // 既に初期化済みの場合はスキップ
    if (isInitialized.current) return;

    // ストアを初期化
    initialize();

    if (mazeId) {
      // 既存迷路を選択
      const maze = getMazeById(mazeId);
      if (maze) {
        selectMaze(maze);
        isNewMaze.current = false;
      }
    } else {
      // 新規迷路を作成・選択（保存時にストアに追加される）
      const newMaze = createDefaultMaze();
      selectMaze(newMaze);
      isNewMaze.current = true;
    }

    isInitialized.current = true;
  }, [mazeId, getMazeById, selectMaze, initialize]);

  // FABアクション
  const fabActions: FloatingAction[] = useMemo(() => [
    // 保存アクション
    {
      icon: <Save className="w-5 h-5" />,
      label: '保存',
      variant: 'success' as const,
      onClick: () => {
        // 編集中の迷路を取得（ローカル編集状態）
        const editingMaze = useMazeStore.getState().editingMaze;
        if (!editingMaze) {
          addToast({
            success: false,
            type: 'error',
            message: '迷路が選択されていません',
          });
          return;
        }

        // スタート/ゴールバリデーション
        const validationResult = validateMaze(editingMaze);
        if (!validationResult.success) {
          addToast({
            success: false,
            type: 'error',
            message: validationResult.message,
          });
          return;
        }

        // 新規作成の場合はストアに追加、既存の場合は更新
        if (isNewMaze.current) {
          addMaze(editingMaze);
        } else {
          updateMaze(editingMaze.id, editingMaze);
        }

        // selectedMazeも最新状態に更新
        selectMaze(editingMaze);

        // LocalStorageに保存
        const currentMazes = useMazeStore.getState().mazes;
        saveMazesToStorage(currentMazes);

        addToast({
          success: true,
          type: 'success',
          message: '迷路を保存しました',
        });
        // トーストを見せてから遷移
        setTimeout(() => router.push('/'), 1000);
      },
    },
    // 削除アクション
    {
      icon: <Trash2 className="w-5 h-5" />,
      label: '削除',
      variant: 'danger' as const,
      onClick: () => {
        const editingMaze = useMazeStore.getState().editingMaze;
        if (!editingMaze) {
          addToast({
            success: false,
            type: 'error',
            message: '迷路が選択されていません',
          });
          return;
        }

        // 新規作成中の場合は単にホームに戻る
        if (isNewMaze.current) {
          addToast({
            success: true,
            type: 'info',
            message: '編集をキャンセルしました',
          });
          // トーストを見せてから遷移
          setTimeout(() => router.push('/'), 1000);
          return;
        }

        // 迷路を削除
        deleteMaze(editingMaze.id);

        // 削除後に保存
        const currentMazes = useMazeStore.getState().mazes;
        saveMazesToStorage(currentMazes);

        addToast({
          success: true,
          type: 'info',
          message: '迷路を削除しました',
        });
        // トーストを見せてから遷移
        setTimeout(() => router.push('/'), 1000);
      },
    },
  ], [addToast, router, deleteMaze, addMaze, updateMaze]);

  // ローディング中
  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-space-darker">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-neon-cyan">Loading...</div>
        </main>
      </div>
    );
  }

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
