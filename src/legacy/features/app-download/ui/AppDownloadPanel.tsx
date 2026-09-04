/**
 * アプリダウンロードパネル（ヒーローセクション）
 */

import React from 'react';
import { useDownloadInfo } from '../model/useDownloadInfo';
import { ReleaseVersionInfo } from './ReleaseVersionInfo';
import { AppDownloadButton } from './AppDownloadButton';

/**
 * ProgPath デスクトップ版ダウンロード用パネル
 */
export function AppDownloadPanel(): React.ReactElement {
  const { releaseInfo, loading, error, isElectron, fallbackUrl } =
    useDownloadInfo();

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-fade-in-up">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-2">
          ProgPath Desktop
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
          迷路を、もっと自由に
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <AppDownloadButton
          downloadUrl={releaseInfo?.downloadUrl ?? null}
          fallbackUrl={fallbackUrl}
          isElectron={isElectron}
          loading={loading}
        />
        
        <ReleaseVersionInfo
          version={releaseInfo?.version ?? null}
          fileSizeMB={releaseInfo?.fileSizeMB ?? null}
          loading={loading}
          error={error}
          fallbackUrl={fallbackUrl}
        />
      </div>
    </div>
  );
}
