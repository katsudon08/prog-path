/**
 * GitHub Releaseの情報
 */
export interface ReleaseInfo {
    version: string
    downloadUrl: string
    fileSize: string
}

const DEFAULT_RELEASE: ReleaseInfo = {
    version: "0.1.0",
    downloadUrl: "https://github.com/katsudon08/prog-path/releases/download/0.1.0/prog-path.Setup.0.1.0.exe",
    fileSize: "約 180 MB",
}

/**
 * GitHub APIから最新リリース情報を取得
 */
export async function fetchLatestRelease(): Promise<ReleaseInfo> {
    try {
        const response = await fetch(
            "https://api.github.com/repos/katsudon08/prog-path/releases/latest"
        )
        if (!response.ok) return DEFAULT_RELEASE

        const data = await response.json()

        // バージョン更新 (v0.1.1 -> 0.1.1)
        const version = data.tag_name.replace(/^v/, "")

        // アセットから.exeを探す
        const asset = data.assets.find((a: any) => a.name.endsWith(".exe"))
        if (!asset) return { ...DEFAULT_RELEASE, version }

        // サイズ計算 (bytes -> MB)
        const sizeMB = (asset.size / (1024 * 1024)).toFixed(1)

        return {
            version,
            downloadUrl: asset.browser_download_url,
            fileSize: `約 ${sizeMB} MB`,
        }
    } catch (err) {
        console.error("Failed to fetch release info", err)
        return DEFAULT_RELEASE
    }
}

/**
 * Electronアプリ内かどうかを判定
 */
export function isElectronApp(): boolean {
    if (typeof window === "undefined") return false

    return (
        typeof (window as any).electron !== "undefined" ||
        typeof (window as any).__TAURI__ !== "undefined" ||
        navigator.userAgent.includes("Electron")
    )
}

/**
 * ダウンロードを開始
 */
export function startDownload(downloadUrl: string): void {
    window.open(downloadUrl, "_blank")
}
