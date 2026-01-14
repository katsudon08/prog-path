/**
 * エディターページコンポーネント
 */

'use client';

import React from 'react';
import { Navbar } from '@/_src/shared/ui';
import { MazeEditorBoardWidget } from '@/_src/widgets/editor';

export function EditorPage(): React.ReactElement {
  return (
    <div className="flex flex-col min-h-screen bg-space-darker">
      <Navbar />

      <main className="flex-1 pt-16 p-6">
        <MazeEditorBoardWidget />
      </main>
    </div>
  );
}
