const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("api", {
    openDirectoryDialog: () => ipcRenderer.send("open-directory-dialog"),
    onDirectorySelectionCanceled: (callback) => ipcRenderer.on("directory-selection-canceled", () => callback()),
    onSelectedDirectory: (callback) => ipcRenderer.on("selected-directory", (event, path) => callback(path)),
    readDirectoryContents: (repoPath) => ipcRenderer.invoke("read-directory-tree", repoPath),
    readFileContents: (filePath) => ipcRenderer.invoke("read-file-contents", filePath),
    openPath: (filePath) => ipcRenderer.invoke("open-path", filePath),
    getRecentlyUsedRepositories: () => ipcRenderer.invoke("get-recently-used-repositories"),
    fetchRepoIssues: (owner, repo) => ipcRenderer.invoke("fetch-repo-issues", { owner, repo }),
    saveIssuesCache: (repoPath, issues) => ipcRenderer.invoke("save-issues-cache", { repoPath, issues }),
    loadIssuesCache: (repoPath) => ipcRenderer.invoke("load-issues-cache", repoPath)
})
