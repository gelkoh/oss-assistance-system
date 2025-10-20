const { app, BrowserWindow } = require("electron")
const path = require("path")

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    const isDev = process.env.VITE_DEV_SERVER === "1"

    if (isDev) {
        win.loadURL("http://localhost:5173")
        win.webContents.openDevTools()
    } else {
        const indexPath = path.join(__dirname, "dist", "index.html")
        win.loadFile(indexPath)
    }
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
