import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function readCodeFilesRecursively(dir) {
    let results = []

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

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
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

    ipcMain.on("read-directory-content", (event, repoPath) => {
        console.log("Reading directory: ", repoPath)

        try {
            const fileList = readCodeFilesRecursively(repoPath)
            console.log("Found " + fileList.length + " files")
            event.sender.send("directory-content-ready", fileList)
        } catch(err) {
            console.error("Error reading directory: " + err)
            event.sender.send("directory-content-error", err.message)
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
