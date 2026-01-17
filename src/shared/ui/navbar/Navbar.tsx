/**
 * ナビゲーションバー
 * 全ページ共通のヘッダー
 */

'use client';

import React from 'react';
import { Home, Monitor } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** ページパスとタイトルのマッピング */
const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/editor': 'Maze Editor',
  '/download': 'Download',
};

/**
 * パスからページタイトルを取得
 */
function getPageTitle(pathname: string | null): string {
  if (!pathname) return 'ProgPath';
  
  // 完全一致チェック
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  
  // プレフィックスチェック
  if (pathname.startsWith('/ar')) return 'AR';
  if (pathname.startsWith('/editor')) return 'Maze Editor';
  
  return 'ProgPath';
}

export function Navbar(): React.ReactElement {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neon-blue/30 bg-space-dark/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Home link & Logo */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-neon-cyan transition-colors hover:text-neon-cyan/80"
          >
            <Home className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold text-neon-blue">ProgPath</span>
        </div>

        {/* Center: Page Title */}
        <div className="text-lg font-semibold text-foreground">{pageTitle}</div>

        {/* Right: Download link */}
        <div className="flex items-center">
          <Link
            href="/download"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-neon-blue/10 hover:text-neon-cyan"
            title="デスクトップ版をダウンロード"
          >
            <Monitor className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
