/**
 * アプリダウンロードパネル（メインコンポーネント）
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
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-neon-cyan">
          ProgPath デスクトップ版
        </h2>
        <p className="text-sm text-muted-foreground">
          Windows向けデスクトップアプリをダウンロードできます
        </p>
      </div>

      <div>
        <ReleaseVersionInfo
          version={releaseInfo?.version ?? null}
          fileSizeMB={releaseInfo?.fileSizeMB ?? null}
          loading={loading}
          error={error}
          fallbackUrl={fallbackUrl}
        />

        <AppDownloadButton
          downloadUrl={releaseInfo?.downloadUrl ?? null}
          fallbackUrl={fallbackUrl}
          isElectron={isElectron}
          loading={loading}
        />
      </div>
    </div>
  );
}
