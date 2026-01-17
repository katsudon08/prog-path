/**
 * ダウンロードページコンポーネント
 */

'use client';

import React from 'react';
import { Navbar } from '@/src/shared/ui';
import { AppDownloadPanel } from '@/src/features/app-download';

export function DownloadPage(): React.ReactElement {
  return (
    <div className="flex flex-col min-h-screen bg-space-darker">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-16 p-6">
        <div className="max-w-md w-full">
          <AppDownloadPanel />
        </div>
      </main>
    </div>
  );
}
