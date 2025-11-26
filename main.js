const { app, BrowserWindow } = require("electron");
const path = require("path");
const serveLib = require('electron-serve');
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

app.on("ready", () => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
