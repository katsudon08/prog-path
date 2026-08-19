/**
 * app-download フィーチャの Public API
 */

// UI Components
export { AppDownloadPanel } from './ui/AppDownloadPanel';
export { AppDownloadButton } from './ui/AppDownloadButton';
export { ReleaseVersionInfo } from './ui/ReleaseVersionInfo';

// Hooks
export { useDownloadInfo } from './model/useDownloadInfo';

// Types
export type { ReleaseInfo, FetchReleaseResult } from './lib/github-api';
export type { DownloadInfoState } from './model/useDownloadInfo';
