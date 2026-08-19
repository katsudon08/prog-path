const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const serveLib = require("electron-serve");
const serve = serveLib.default || serveLib;

const appServe = app.isPackaged
    ? serve({ directory: path.join(__dirname, "out") })
    : null;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // セキュリティのためfalse推奨
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    if (app.isPackaged) {
        // 本番（パッケージ後）：ビルドされたNext.jsアプリ(outフォルダ)を読み込む
        appServe(win).then(() => {
            win.loadURL("app://-");
        });
    } else {
        // 開発中：localhost:3000 を読み込む
        win.loadURL("http://localhost:3000");
        win.webContents.openDevTools(); // 開発ツールを開く
        win.webContents.on("did-fail-load", (e, code, desc) => {
            win.webContents.reloadIgnoringCache();
        });
    }
};

// アプリのダウンロード処理
ipcMain.handle("download-app", async () => {
    try {
        const sourceFile = path.join(
            __dirname,
            "dist",
            "prog-path Setup 0.1.0.exe"
        );

        // ソースファイルが存在するか確認
        if (!fs.existsSync(sourceFile)) {
            throw new Error("インストーラーファイルが見つかりません");
        }

        // ダウンロード先を選択
        const result = await dialog.showSaveDialog({
            defaultPath: path.join(
                app.getPath("downloads"),
                "prog-path Setup 0.1.0.exe"
            ),
            filters: [{ name: "Executable", extensions: ["exe"] }],
        });

        if (result.canceled) {
            return { success: false, message: "キャンセルされました" };
        }

        // ファイルをコピー
        fs.copyFileSync(sourceFile, result.filePath);
        return { success: true, filePath: result.filePath };
    } catch (err) {
        console.error("ダウンロードエラー:", err);
        return { success: false, message: err.message };
    }
});

app.on("ready", () => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
