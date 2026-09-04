/**
 * ダウンロードページコンポーネント (Hero Layout)
 */

'use client';

import React from 'react';
import { AppDownloadPanel } from '@/legacy/features/app-download';

export function DownloadPage(): React.ReactElement {
  return (
    <div className="flex flex-col min-h-screen bg-space-darker overflow-hidden relative selection:bg-neon-cyan/30 selection:text-neon-cyan font-sans">
      {/* Hero Background - Deep & Clean */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(20, 20, 30, 0) 0%, rgba(0, 0, 0, 0.8) 100%),
            linear-gradient(to bottom, rgba(34, 211, 238, 0.05), rgba(0,0,0,0))
          `,
        }}
      />
      
      {/* Subtle Grid - Less intrusive */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '8rem 8rem',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)'
        }}
      />

      {/* Main Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 pt-16 pb-12">
        <AppDownloadPanel />
      </main>
    </div>
  );
}
