/**
 * アプリダウンロードボタンコンポーネント
 */

import React from 'react';

interface AppDownloadButtonProps {
  downloadUrl: string | null;
  fallbackUrl: string;
  isElectron: boolean;
  loading: boolean;
}

/** ボタン共通スタイル */
const baseButtonStyles =
  'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200';

/** 無効状態のスタイル */
const disabledStyles =
  'bg-muted text-muted-foreground cursor-not-allowed opacity-50';

/** プライマリボタンスタイル */
const primaryStyles =
  'bg-gradient-to-r from-neon-cyan to-neon-purple text-space-dark hover:opacity-90 hover:shadow-lg hover:shadow-neon-cyan/20';

/**
 * ダウンロードボタンを表示するコンポーネント
 * Electron環境では無効化される
 */
export function AppDownloadButton({
  downloadUrl,
  fallbackUrl,
  isElectron,
  loading,
}: AppDownloadButtonProps): React.ReactElement {
  // Electron 環境の場合
  if (isElectron) {
    return (
      <div className="mt-4">
        <button disabled className={`${baseButtonStyles} ${disabledStyles}`}>
          デスクトップ版で実行中です
        </button>
      </div>
    );
  }

  // 読み込み中の場合
  if (loading) {
    return (
      <div className="mt-4">
        <button disabled className={`${baseButtonStyles} ${disabledStyles}`}>
          <span className="animate-pulse">読み込み中...</span>
        </button>
      </div>
    );
  }

  const url = downloadUrl || fallbackUrl;

  return (
    <div className="mt-4">
      <a
        href={url}
        className={`${baseButtonStyles} ${primaryStyles}`}
        download
        target="_blank"
        rel="noopener noreferrer"
      >
        Windows版をダウンロード
      </a>
    </div>
  );
}
