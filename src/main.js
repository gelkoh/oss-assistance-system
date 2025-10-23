import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function readCodeFilesRecursively(dir) {
    let results = []

    if (dir.includes("node_modules")) return results

    const list = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of list) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            results = results.concat(readCodeFilesRecursively(fullPath))
        } else {
            if (/\.(js|ts|vue|json|html|css|scss|md)$/i.test(entry.name)) {
                results.push(fullPath)
            }
        }
    }

    return results
}

function buildTree(dirPath) {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) return null;

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return files.map((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const isDir = entry.isDirectory();

        return {
            name: entry.name,
            path: fullPath,
            type: isDir ? "directory" : "file",
            children: isDir ? buildTree(fullPath) : []
        }
    })
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
        } else {
            event.sender.send("directory-selection-canceled")
        }
    })

    ipcMain.handle("read-directory-tree", (event, repoPath) => {
        console.log("Building tree directory for: ", repoPath)

        try {
            const tree = buildTree(repoPath)
            console.log(tree)
            return tree
        } catch(err) {
            console.error("Error building directory tree: " + err)
            throw new Error(err.message)
        }
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})
