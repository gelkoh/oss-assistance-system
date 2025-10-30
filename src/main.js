import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import fs from "fs"
import { readFile } from "fs/promises"
import { fileURLToPath } from "url"
import settings from "electron-settings"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function buildTree(dirPath) {
    const stats = fs.statSync(dirPath)
    if (!stats.isDirectory()) return null

    let files = fs.readdirSync(dirPath, { withFileTypes: true })

    files = files.filter(entry => {
        if (entry.isDirectory() && entry.name === "node_modules") {
            return false
        }

        return true
    })
 
    return files.map((entry) => {
        const fullPath = path.join(dirPath, entry.name)
        const isDir = entry.isDirectory()

        return {
            name: entry.name,
            path: fullPath,
            type: isDir ? "directory" : "file",
            children: isDir ? buildTree(fullPath) : []
        }
    })
}

function buildRepoTreeWrapper(repoPath) {
    const dirName = path.basename(repoPath)

    const children = buildTree(repoPath)

    return {
        name: "root",
        children: [{
            name: dirName,
            path: repoPath,
            type: "directory",
            children: children || []
        }]
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            sandbox: true,
        }
    })

    const isDev = process.env.VITE_DEV_SERVER === "1"

    if (isDev) {
        win.loadURL("http://localhost:5173")
        win.webContents.openDevTools()
    } else {
        const indexPath = path.join(__dirname, "dist", "index.html")
        win.loadFile(indexPath)
    }

    ipcMain.on("open-directory-dialog", async(event) => {
        const result = await dialog.showOpenDialog(win, {
            properties: ["openDirectory"]
        })

        if (!result.canceled && result.filePaths.length > 0) {
            event.sender.send("selected-directory", result.filePaths[0])

            let recentlyUsedRepositoriesPaths = await settings.get("recentlyUsedRepositoriesPaths")
            console.log("recentlyUsedRepositoriesPaths: " + recentlyUsedRepositoriesPaths)

            if (recentlyUsedRepositoriesPaths === undefined) {
                recentlyUsedRepositoriesPaths = [result.filePaths[0]]
            } else if (!recentlyUsedRepositoriesPaths.includes(result.filePaths[0])) {
                recentlyUsedRepositoriesPaths.push(result.filePaths[0])
            }

            await settings.set("recentlyUsedRepositoriesPaths", recentlyUsedRepositoriesPaths)
        } else {
            event.sender.send("directory-selection-canceled")
        }
    })

    ipcMain.handle("read-directory-tree", (event, repoPath) => {
        console.log("Building tree directory for: ", repoPath)

        try {
            const treeRoot = buildRepoTreeWrapper(repoPath)
            console.log("Tree root:")
            console.log(treeRoot)
            return treeRoot
        } catch(err) {
            console.error("Error building directory tree: " + err)
            throw new Error(err.message)
        }
    })

    ipcMain.handle("read-file-contents", async (event, filePath) => {
        try {
            const data = await readFile(filePath, "utf-8")
            return data
        } catch(err) {
            console.error(`An error occurred reading the file contents for ${filePath}:`, err)
            throw new Error(`Could not read file: ${err.message}`)
        }
    })

    ipcMain.handle("get-recently-used-repositories", async () => {
        try {
            const recentlyUsedRepositoriesPaths = await settings.get("recentlyUsedRepositoriesPaths")
            return recentlyUsedRepositoriesPaths
        } catch(err) {
            console.error("An error occurred getting the recently used repositories", err)
            throw new Error("Could not get the recently used repositories")
        }
    })

    ipcMain.handle("open-path", (event, filePath) => {
        try {
            console.log("File to be opened: " + filePath)
            console.log(filePath)
            console.log(typeof filePath)
            shell.openPath(filePath)
        }  catch(err) {
            console.error("An error occurred opening the file in the default file editor: ", err.message)
            throw new Error("Error opening the file in the default file editor")
        }
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})
