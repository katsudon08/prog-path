/**
 * フォルダナビゲーションウィジェット
 * フォルダ一覧表示と操作
 */

'use client';

import React from 'react';
import { FolderCard } from '@/legacy/entities/folder';
import { DeleteFolderDialog } from '@/legacy/features/folder-management/ui/DeleteFolderDialog';
import { useFolderStore } from '@/legacy/entities/folder';
import { useFolderDelete } from '@/legacy/features/folder-management/model/useFolderDelete';

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
  const { open: openDelete } = useFolderDelete();

  return (
    <div className={`flex flex-col ${className}`}>
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

      {/* 削除ダイアログ */}
      <DeleteFolderDialog />
    </div>
  );
}
