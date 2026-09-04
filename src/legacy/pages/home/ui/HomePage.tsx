/**
 * ホームページコンポーネント
 * _src/pages に配置する FSD準拠のページ
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FolderPlus, Plus, QrCode, Edit, Play } from 'lucide-react';
import { FloatingActionButton, type FloatingAction } from '@/legacy/shared/ui';
import { FolderCard, useFolderStore, loadFoldersFromStorage, saveFoldersToStorage, loadExpandedFoldersFromStorage, saveExpandedFoldersToStorage, DEFAULT_FOLDER_NAME } from '@/legacy/entities/folder';
import { MazeCard, MazePreview2D, useMazeStore, saveMazesToStorage, type MazeData } from '@/legacy/entities/maze';
import { useFolderCreate } from '@/legacy/features/folder-management/model/useFolderCreate';
import { CreateFolderDialog } from '@/legacy/features/folder-management/ui/CreateFolderDialog';
import { DeleteFolderDialog } from '@/legacy/features/folder-management/ui/DeleteFolderDialog';
import { useFolderDelete } from '@/legacy/features/folder-management/model/useFolderDelete';
import { useQRImport } from '@/legacy/features/maze-qr-management/model/useQRImport';
import { QRImportDialog } from '@/legacy/features/maze-qr-management/ui/QRImportDialog';
import { useQRShare } from '@/legacy/features/maze-qr-management/model/useQRShare';
import { QRShareDialog } from '@/legacy/features/maze-qr-management/ui/QRShareDialog';
import { useNavigate } from '@tanstack/react-router';

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

export function HomePage(): React.ReactElement {
  const navigate = useNavigate();

  // ストアの初期化
  const initialize = useMazeStore((s) => s.initialize);
  const isLoaded = useMazeStore((s) => s.isLoaded);
  const mazes = useMazeStore((s) => s.mazes);
  const selectedMaze = useMazeStore((s) => s.selectedMaze);
  const selectMaze = useMazeStore((s) => s.selectMaze);
  const updateMaze = useMazeStore((s) => s.updateMaze);

  const { folders, expandedFolders, setFolders, setExpandedFolders, toggleFolderExpanded } = useFolderStore();
  const { open: openFolderCreate } = useFolderCreate();
  const { open: openFolderDelete } = useFolderDelete();

  const { open: openQRImport } = useQRImport();
  const { open: openQRShare } = useQRShare();

  // selectedMazeがmazesリストに含まれているか確認（保存されていない新規迷路は除外）
  const validatedSelectedMaze = useMemo(() => {
    if (!selectedMaze) return null;
    const existsInMazes = mazes.some((maze) => maze.id === selectedMaze.id);
    return existsInMazes ? selectedMaze : null;
  }, [selectedMaze, mazes]);

  // ドラッグ中のアイテム
  const [draggingMazeId, setDraggingMazeId] = useState<string | null>(null);
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);

  // マウント時に初期化
  useEffect(() => {
    initialize();

    // フォルダも初期化（「未分類」は常に含める）
    const loadedFolders = loadFoldersFromStorage();
    // 「未分類」が含まれていない場合は先頭に追加
    const foldersWithDefault = loadedFolders.includes(DEFAULT_FOLDER_NAME)
      ? loadedFolders
      : [DEFAULT_FOLDER_NAME, ...loadedFolders];
    setFolders(foldersWithDefault);

    // 展開状態の復元
    const loadedExpandedFolders = loadExpandedFoldersFromStorage();
    setExpandedFolders(loadedExpandedFolders);
  }, [initialize, setFolders, setExpandedFolders]);

  // 展開状態の保存
  useEffect(() => {
    saveExpandedFoldersToStorage(expandedFolders);
  }, [expandedFolders]);

  // フォルダごとの迷路を取得
  const getMazesForFolder = useCallback((folder: string): MazeData[] => {
    return mazes.filter((maze) => {
      const mazeFolder = maze.folder || DEFAULT_FOLDER_NAME;
      return mazeFolder === folder;
    });
  }, [mazes]);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, mazeId: string) => {
    e.dataTransfer.setData('text/plain', mazeId);
    setDraggingMazeId(mazeId);
  }, []);

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent, folder: string) => {
    e.preventDefault();
    setDropTargetFolder(folder);
  }, []);

  // ドラッグリーブ
  const handleDragLeave = useCallback(() => {
    setDropTargetFolder(null);
  }, []);

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    const mazeId = e.dataTransfer.getData('text/plain');

    if (mazeId && draggingMazeId) {
      // 迷路のフォルダを更新
      updateMaze(mazeId, { folder: targetFolder });

      // LocalStorageに保存
      const updatedMazes = useMazeStore.getState().mazes;
      saveMazesToStorage(updatedMazes);
    }

    setDraggingMazeId(null);
    setDropTargetFolder(null);
  }, [draggingMazeId, updateMaze]);

  // 編集ボタンのハンドラー
  const handleEditClick = () => {
    if (validatedSelectedMaze) {
      navigate({ to: '/editor', search: { id: validatedSelectedMaze.id } });
    }
  };

  // FABアクション
  const fabActions: FloatingAction[] = useMemo(() => [
    {
      icon: <FolderPlus className="w-5 h-5" />,
      label: '新規フォルダ',
      variant: 'success' as const,
      onClick: openFolderCreate,
    },
    {
      icon: <Plus className="w-5 h-5" />,
      label: '新規迷路',
      variant: 'info' as const,
      onClick: () => navigate({ to: '/editor', search: {} }),
    },
    {
      icon: <QrCode className="w-5 h-5" />,
      label: 'QRインポート',
      variant: 'default' as const,
      onClick: openQRImport,
    },
  ], [openFolderCreate, openQRImport, navigate]);

  // ローディング中
  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-space-darker">
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-neon-cyan">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-space-darker">
      <main className="flex-1 flex pt-16">
        {/* 左側：フォルダ＋迷路リスト（スクロール可能） */}
        <aside className="w-[25%] h-[calc(100vh-4rem)] border-r border-neon-blue/20 bg-space-dark overflow-y-auto">
          {folders.map((folder) => {
            const folderMazes = getMazesForFolder(folder);
            const isDropTarget = dropTargetFolder === folder;

            return (
              <FolderCard
                key={folder}
                folder={folder}
                isExpanded={expandedFolders.has(folder)}
                isFolderCategory={folder !== DEFAULT_FOLDER_NAME}
                itemCount={folderMazes.length}
                onToggle={() => toggleFolderExpanded(folder)}
                onDelete={folder !== DEFAULT_FOLDER_NAME ? () => openFolderDelete(folder) : undefined}
                onDragOver={(e) => handleDragOver(e, folder)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder)}
                className={isDropTarget ? 'bg-neon-cyan/10' : ''}
              >
                {/* フォルダ内の迷路 */}
                {folderMazes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-2 text-xs">
                    迷路がありません
                  </div>
                ) : (
                  folderMazes.map((maze) => (
                    <MazeCard
                      key={maze.id}
                      id={maze.id}
                      name={maze.name}
                      sizeLabel={getMazeSizeLabel(maze)}
                      isSelected={validatedSelectedMaze?.id === maze.id}
                      onSelect={() => selectMaze(maze)}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, maze.id)}
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
                  ))
                )}
              </FolderCard>
            );
          })}
        </aside>

        {/* 右側：選択中の迷路プレビュー（固定） */}
        <div className="w-[65%] h-[calc(100vh-4rem)] p-6 flex items-center justify-center overflow-hidden">
          {validatedSelectedMaze ? (
            <div className="flex flex-col items-center gap-6">
              {/* 迷路名 */}
              <h2 className="text-2xl font-bold text-neon-cyan">
                {validatedSelectedMaze.name}
              </h2>

              {/* プレビュー（階層ナビゲーション付き）- 5x5サイズ基準で自動スケーリング */}
              <MazePreview2D
                layers={validatedSelectedMaze.layers}
                cellSize={48}
                showNavigation={true}
                maxWidth={260}
                maxHeight={260}
              />

              {/* アクションボタン */}
              <div className="flex items-center gap-4">
                {/* 編集ボタン */}
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-6 py-3 bg-neon-cyan/20 border border-neon-cyan rounded-lg text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  編集
                </button>

                {/* QR共有ボタン */}
                <button
                  type="button"
                  onClick={() => openQRShare(validatedSelectedMaze)}
                  className="flex items-center gap-2 px-6 py-3 bg-neon-purple/20 border border-neon-purple rounded-lg text-neon-purple hover:bg-neon-purple/30 transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  共有
                </button>

                {/* 実行ボタン */}
                <button
                  type="button"
                  onClick={() => navigate({ to: '/ar', search: { id: validatedSelectedMaze.id } })}
                  className="flex items-center gap-2 px-6 py-3 bg-neon-green/20 border border-neon-green rounded-lg text-neon-green hover:bg-neon-green/30 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  実行
                </button>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-center">
              <p className="text-lg">迷路を選択してください</p>
              <p className="text-sm mt-2">左のリストから迷路を選択するか、右下の + から新規作成できます</p>
            </div>
          )}
        </div>
      </main>

      {/* フローティングアクションボタン */}
      <FloatingActionButton actions={fabActions} />

      {/* ダイアログ */}
      <CreateFolderDialog />
      <DeleteFolderDialog />
      <QRImportDialog />
      <QRShareDialog />
    </div>
  );
}
