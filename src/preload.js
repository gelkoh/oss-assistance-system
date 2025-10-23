const { contextBridge, ipcRenderer, shell } = require("electron")

contextBridge.exposeInMainWorld("api", {
    openDirectoryDialog: () => ipcRenderer.send("open-directory-dialog"),
    onDirectorySelectionCanceled: (callback) => ipcRenderer.on("directory-selection-canceled", () => callback()),
    onSelectedDirectory: (callback) => ipcRenderer.on("selected-directory", (event, path) => callback(path)),
    readDirectoryContent: (repoPath) => ipcRenderer.invoke("read-directory-tree", repoPath),
    openPath: (filePath) => ipcRenderer.invoke("open-path", filePath)
})
