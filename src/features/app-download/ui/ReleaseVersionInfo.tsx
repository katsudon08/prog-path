/**
 * リリースバージョン情報表示コンポーネント
 */

import React from 'react';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

interface ReleaseVersionInfoProps {
  version: string | null;
  fileSizeMB: number | null;
  loading: boolean;
  error: string | null;
  fallbackUrl: string;
}

/**
 * 最新バージョンとファイルサイズを表示するコンポーネント (ミニマル版)
 */
export function ReleaseVersionInfo({
  version,
  fileSizeMB,
  loading,
  error,
  fallbackUrl,
}: ReleaseVersionInfoProps): React.ReactElement {
  if (loading) {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground animate-pulse">
        <div className="h-4 w-24 bg-white/5 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span>情報の取得に失敗しました</span>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-red-300 ml-1"
        >
          GitHubで確認
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-sm text-muted-foreground/60 font-medium">
      {version && (
        <span>バージョン {version}</span>
      )}
      {fileSizeMB && (
        <>
          <span className="hidden md:inline w-1 h-1 rounded-full bg-white/10" />
          <span>{fileSizeMB} MB</span>
        </>
      )}
      <span className="hidden md:inline w-1 h-1 rounded-full bg-white/10" />
      
      <a 
        href={fallbackUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:text-neon-cyan transition-colors ml-2 md:ml-4"
      >
        リリースノート
        <ArrowUpRight className="w-3 h-3" />
      </a>
    </div>
  );
}
