/**
 * リリースバージョン情報表示コンポーネント
 */

import React from 'react';

interface ReleaseVersionInfoProps {
  version: string | null;
  fileSizeMB: number | null;
  loading: boolean;
  error: string | null;
  fallbackUrl: string;
}

/**
 * スケルトンプレースホルダーコンポーネント
 */
function SkeletonLine({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={`h-4 bg-white/10 rounded animate-pulse ${className ?? ''}`}
    />
  );
}

/**
 * 最新バージョンとファイルサイズを表示するコンポーネント
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">最新バージョン:</span>
          <SkeletonLine className="w-20" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">ファイル容量:</span>
          <SkeletonLine className="w-16" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-red-400">{error}</p>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-neon-cyan hover:text-neon-cyan/80 transition-colors underline underline-offset-2"
        >
          GitHubリリースページを開く →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {version && (
        <p className="text-muted-foreground">
          最新バージョン: <strong className="text-neon-cyan">{version}</strong>
        </p>
      )}
      {fileSizeMB !== null && (
        <p className="text-muted-foreground">
          ファイル容量: <strong className="text-foreground">{fileSizeMB} MB</strong>
        </p>
      )}
    </div>
  );
}
