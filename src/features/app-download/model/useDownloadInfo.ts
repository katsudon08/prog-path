/**
 * ダウンロード情報の状態管理とElectron環境検知フック
 */

import { useEffect, useState } from 'react';
import { fetchLatestRelease, ReleaseInfo } from '../lib/github-api';

/** フォールバック用のデフォルトダウンロードURL */
const FALLBACK_DOWNLOAD_URL = `https://github.com/katsudon08/prog-path/releases/latest`;

/** useDownloadInfo の戻り値の型定義 */
export interface DownloadInfoState {
  releaseInfo: ReleaseInfo | null;
  loading: boolean;
  error: string | null;
  isElectron: boolean;
  isFromCache: boolean;
  fallbackUrl: string;
}

/**
 * Electron 環境かどうかを判定する
 * @returns Electron 環境の場合 true
 */
function detectElectron(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('electron');
}

/**
 * ダウンロード情報を管理するカスタムフック
 * @returns ダウンロード情報の状態
 */
export function useDownloadInfo(): DownloadInfoState {
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isElectron] = useState(() => detectElectron());

  useEffect(() => {
    let isMounted = true;

    async function loadReleaseInfo() {
      setLoading(true);
      setError(null);

      const result = await fetchLatestRelease();

      if (!isMounted) return;

      if (result.releaseInfo) {
        setReleaseInfo(result.releaseInfo);
        setIsFromCache(result.isFromCache);
      } else {
        setError(result.error ?? 'リリース情報の取得に失敗しました');
      }

      setLoading(false);
    }

    loadReleaseInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    releaseInfo,
    loading,
    error,
    isElectron,
    isFromCache,
    fallbackUrl: FALLBACK_DOWNLOAD_URL,
  };
}
