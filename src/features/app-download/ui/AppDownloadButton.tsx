/**
 * アプリダウンロードボタンコンポーネント
 */

import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface AppDownloadButtonProps {
  downloadUrl: string | null;
  fallbackUrl: string;
  isElectron: boolean;
  loading: boolean;
}

/** ボタン共通スタイル */
const baseButtonStyles =
  'inline-flex items-center justify-center px-10 py-5 rounded-full font-semibold transition-all duration-300 gap-3 text-lg tracking-wide hover:scale-105 active:scale-95';

/** 無効状態のスタイル */
const disabledStyles =
  'bg-white/10 text-muted-foreground cursor-not-allowed';

/** プライマリボタンスタイル */
const primaryStyles =
  'bg-neon-cyan text-space-dark shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:bg-white';

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
      <button disabled className={`${baseButtonStyles} ${disabledStyles}`}>
        <Download className="w-5 h-5 opacity-50" />
        <span>インストール済み</span>
      </button>
    );
  }

  // 読み込み中の場合
  if (loading) {
    return (
      <button disabled className={`${baseButtonStyles} ${disabledStyles}`}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>確認中...</span>
      </button>
    );
  }

  const url = downloadUrl || fallbackUrl;

  return (
    <a
      href={url}
      className={`${baseButtonStyles} ${primaryStyles}`}
      download
      target="_blank"
      rel="noopener noreferrer"
    >
      <Download className="w-6 h-6" />
      Windows版をダウンロード
    </a>
  );
}
