const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    downloadApp: () => ipcRenderer.invoke("download-app"),
});
