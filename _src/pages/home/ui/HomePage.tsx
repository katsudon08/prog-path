/**
 * ホームページコンポーネント
 * _src/pages に配置する FSD準拠のページ
 */

'use client';

import React from 'react';
import { Navbar } from '@/_src/shared/ui';
import { FolderNavigationWidget, MazeExplorerWidget } from '@/_src/widgets/home';
import { useFolderStore } from '@/_src/entities/folder';
import { useRouter } from 'next/navigation';

export function HomePage(): React.ReactElement {
  const router = useRouter();
  const { folders } = useFolderStore();

  // フォルダごとのアイテム数（現時点では簡易実装）
  const folderItemCounts: Record<string, number> = {};
  for (const folder of folders) {
    folderItemCounts[folder] = 0; // 実際のカウントはMazeDataにcategoryがあれば計算
  }

  const handleCreateNew = () => {
    router.push('/editor');
  };

  const handleMazeClick = (mazeId: string) => {
    router.push(`/editor?id=${mazeId}`);
  };

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
            onCreateNew={handleCreateNew}
            onMazeClick={handleMazeClick}
          />
        </div>
      </main>
    </div>
  );
}
