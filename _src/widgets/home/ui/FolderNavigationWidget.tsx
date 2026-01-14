/**
 * フォルダナビゲーションウィジェット
 * フォルダ一覧、作成、削除を統合
 */

'use client';

import React from 'react';
import { FolderPlus } from 'lucide-react';
import { FolderCard } from '@/_src/entities/folder';
import { CreateFolderDialog } from '@/_src/features/folder-management/ui/CreateFolderDialog';
import { DeleteFolderDialog } from '@/_src/features/folder-management/ui/DeleteFolderDialog';
import { useFolderStore } from '@/_src/entities/folder';
import { useFolderCreate } from '@/_src/features/folder-management/model/useFolderCreate';
import { useFolderDelete } from '@/_src/features/folder-management/model/useFolderDelete';

interface FolderNavigationWidgetProps {
  /** フォルダのアイテム数マップ */
  folderItemCounts?: Record<string, number>;
  /** フォルダクリック時のコールバック */
  onFolderClick?: (folder: string) => void;
  /** フォルダごとの子コンテンツ */
  renderFolderContent?: (folder: string) => React.ReactNode;
  className?: string;
}

export function FolderNavigationWidget({
  folderItemCounts = {},
  onFolderClick,
  renderFolderContent,
  className = '',
}: FolderNavigationWidgetProps): React.ReactElement {
  const { folders, expandedFolders, toggleFolderExpanded } = useFolderStore();
  const { open: openCreate } = useFolderCreate();
  const { open: openDelete } = useFolderDelete();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* フォルダ作成ボタン */}
      <div className="p-2 border-b border-neon-blue/20">
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="text-sm">新規フォルダ</span>
        </button>
      </div>

      {/* フォルダ一覧 */}
      <div className="flex-1 overflow-y-auto">
        {folders.map((folder) => (
          <FolderCard
            key={folder}
            folder={folder}
            isExpanded={expandedFolders.has(folder)}
            isFolderCategory={folder !== '未分類'}
            itemCount={folderItemCounts[folder] || 0}
            onToggle={() => {
              toggleFolderExpanded(folder);
              onFolderClick?.(folder);
            }}
            onDelete={() => openDelete(folder)}
          >
            {renderFolderContent?.(folder)}
          </FolderCard>
        ))}
      </div>

      {/* ダイアログ */}
      <CreateFolderDialog />
      <DeleteFolderDialog />
    </div>
  );
}
