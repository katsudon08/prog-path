/**
 * ホームページコンポーネント
 * _src/pages に配置する FSD準拠のページ
 */

'use client';

import React, { useMemo } from 'react';
import { FolderPlus, Plus, QrCode } from 'lucide-react';
import { Navbar, FloatingActionButton, type FloatingAction } from '@/_src/shared/ui';
import { FolderNavigationWidget, MazeExplorerWidget } from '@/_src/widgets/home';
import { useFolderStore } from '@/_src/entities/folder';
import { useFolderCreate } from '@/_src/features/folder-management/model/useFolderCreate';
import { CreateFolderDialog } from '@/_src/features/folder-management/ui/CreateFolderDialog';
import { useQRImport } from '@/_src/features/maze-qr-management/model/useQRImport';
import { QRImportDialog } from '@/_src/features/maze-qr-management/ui/QRImportDialog';
import { useRouter } from 'next/navigation';

export function HomePage(): React.ReactElement {
  const router = useRouter();
  const { folders } = useFolderStore();
  const { open: openFolderCreate } = useFolderCreate();
  const { open: openQRImport } = useQRImport();

  // フォルダごとのアイテム数（現時点では簡易実装）
  const folderItemCounts: Record<string, number> = {};
  for (const folder of folders) {
    folderItemCounts[folder] = 0;
  }

  const handleMazeClick = (mazeId: string) => {
    router.push(`/editor?id=${mazeId}`);
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
      onClick: () => router.push('/editor'),
    },
    {
      icon: <QrCode className="w-5 h-5" />,
      label: 'QRインポート',
      variant: 'default' as const,
      onClick: openQRImport,
    },
  ], [openFolderCreate, openQRImport, router]);

  return (
    <div className="flex flex-col min-h-screen bg-space-darker">
      <Navbar />

      <main className="flex-1 flex pt-16">
        {/* サイドバー */}
        <aside className="w-64 border-r border-neon-blue/20 bg-space-dark">
          <FolderNavigationWidget folderItemCounts={folderItemCounts} />
        </aside>

        {/* メインエリア */}
        <div className="flex-1 p-6">
          <MazeExplorerWidget
            onMazeClick={handleMazeClick}
          />
        </div>
      </main>

      {/* フローティングアクションボタン */}
      <FloatingActionButton actions={fabActions} />

      {/* ダイアログ */}
      <CreateFolderDialog />
      <QRImportDialog />
    </div>
  );
}
