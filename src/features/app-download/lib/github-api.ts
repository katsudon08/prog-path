/**
 * GitHub Releases API との通信ロジック
 * キャッシュ機能付き
 */

const GITHUB_OWNER = 'katsudon08';
const GITHUB_REPO = 'prog-path';
const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

/** キャッシュ設定 */
const CACHE_KEY = 'progpath_github_release_cache';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 60分

/** GitHub Release Asset の型定義 */
interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

/** GitHub Release API レスポンスの型定義 */
interface GitHubReleaseResponse {
  tag_name: string;
  assets: GitHubAsset[];
}

/** アプリが使用するリリース情報の型定義 */
export interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  fileSizeMB: number;
}

/** キャッシュデータの型定義 */
interface CachedReleaseInfo {
  data: ReleaseInfo;
  timestamp: number;
}

/**
 * バイトをMBに変換する
 * @param bytes - バイト数
 * @returns MB単位のサイズ（小数点1桁）
 */
function bytesToMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

/**
 * キャッシュからリリース情報を取得する
 * @returns キャッシュされたリリース情報、無効または期限切れの場合は null
 */
function getCachedRelease(): ReleaseInfo | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedReleaseInfo = JSON.parse(cached);
    const now = Date.now();

    // 有効期限チェック
    if (now - parsed.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * リリース情報をキャッシュに保存する
 * @param data - 保存するリリース情報
 */
function setCachedRelease(data: ReleaseInfo): void {
  try {
    const cached: CachedReleaseInfo = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn('Failed to cache release info:', error);
  }
}

/** fetchLatestRelease の戻り値型 */
export interface FetchReleaseResult {
  releaseInfo: ReleaseInfo | null;
  isFromCache: boolean;
  error: string | null;
}

/**
 * GitHub Releases API から最新リリース情報を取得する
 * キャッシュが有効な場合はキャッシュを返す
 * @returns リリース情報と取得元情報
 */
export async function fetchLatestRelease(): Promise<FetchReleaseResult> {
  // キャッシュを先にチェック
  const cached = getCachedRelease();
  if (cached) {
    return {
      releaseInfo: cached,
      isFromCache: true,
      error: null,
    };
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorMsg =
        response.status === 403
          ? 'APIレート制限に達しました。しばらくお待ちください。'
          : `GitHub APIエラー: ${response.status}`;
      console.error(`GitHub API error: ${response.status}`);
      return {
        releaseInfo: null,
        isFromCache: false,
        error: errorMsg,
      };
    }

    const data: GitHubReleaseResponse = await response.json();

    // .exe ファイルを検索
    const exeAsset = data.assets.find((asset) =>
      asset.name.toLowerCase().endsWith('.exe')
    );

    if (!exeAsset) {
      console.error('No .exe asset found in the latest release');
      return {
        releaseInfo: null,
        isFromCache: false,
        error: 'ダウンロード可能なファイルが見つかりません',
      };
    }

    const releaseInfo: ReleaseInfo = {
      version: data.tag_name,
      downloadUrl: exeAsset.browser_download_url,
      fileSizeMB: bytesToMB(exeAsset.size),
    };

    // キャッシュに保存
    setCachedRelease(releaseInfo);

    return {
      releaseInfo,
      isFromCache: false,
      error: null,
    };
  } catch (error) {
    console.error('Failed to fetch latest release:', error);
    return {
      releaseInfo: null,
      isFromCache: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}
