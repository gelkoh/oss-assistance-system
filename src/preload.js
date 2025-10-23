const { contextBridge, ipcRenderer, shell } = require("electron")

contextBridge.exposeInMainWorld("api", {
    openDirectoryDialog: () => ipcRenderer.send("open-directory-dialog"),
    onDirectorySelectionCanceled: (callback) => ipcRenderer.on("directory-selection-canceled", () => callback()),
    onSelectedDirectory: (callback) => ipcRenderer.on("selected-directory", (event, path) => callback(path)),
    readDirectoryContent: (repoPath) => ipcRenderer.send("read-directory-content", repoPath),
    onDirectoryContentReady: (callback) => ipcRenderer.on("directory-content-ready", (event, fileList) => callback(fileList)),
    onDirectoryContentError: (callback) => ipcRenderer.on("directory-content-error", (event, error) => callback(error)),
    openPath: (filePath) => ipcRenderer.invoke("open-path", filePath)
})
