import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import fs from "fs"
import { readFile } from "fs/promises"
import { fileURLToPath } from "url"
import settings from "electron-settings"
import { Octokit } from "@octokit/core"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let currentRepoInfo = { ownerName: null, repoName: null }

const octokit = new Octokit({})

const readFileContents = async (filePath) => {
    try {
        const data = await readFile(filePath, "utf-8")
        return data
    } catch(err) {
        console.error(`An error occurred reading the file contents for ${filePath}:`, err)
        throw new Error(`Could not read file: ${err.message}`)
    }
}

function buildTree(dirPath) {
    const stats = fs.statSync(dirPath)
    if (!stats.isDirectory()) return null

    let files = fs.readdirSync(dirPath, { withFileTypes: true })

    files = files.filter(entry => {
        if (entry.isDirectory() && entry.name === "node_modules") {
            return false
        }

        if (entry.isDirectory() && entry.name === ".git") {
            const gitDirPath = path.join(dirPath, entry.name)

            try {
                const gitFiles = fs.readdirSync(gitDirPath, { withFileTypes: true })
                console.log("This is a git repository")

                for (const gitFile of gitFiles) {
                    if (gitFile.name === "config" && gitFile.isFile()) {
                        const configPath = path.join(gitDirPath, gitFile.name)

                        const fileContents = fs.readFileSync(configPath, "utf-8")

                        console.log("Git config file found")

                        const gitConfigLines = fileContents.split("\n")

                        let ownerName
                        let repoName

                        for (const line of gitConfigLines) {
                            if (line.includes("github.com")) {
                                if (line.includes("https://github.com/")) {
                                    ownerName = line.split("/").at(-2)
                                } else if (line.includes("git@github.com:")) {
                                    ownerName = line.split(":").at(1).split("/")[0]
                                }

                                repoName = line.split("/").at(-1)

                                if (ownerName && repoName) {
                                    currentRepoInfo.ownerName = ownerName
                                    currentRepoInfo.repoName = repoName.replace(/\.git$/,"")
                                }

                                break
                            }
                        }

                        break
                    }
                }
            } catch(err) {
                console.error("Error reading the .git repository:", err)
            }

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

        currentRepoInfo = { ownerName: null, repoName: null }

        try {
            const treeRoot = buildRepoTreeWrapper(repoPath)
            console.log("Tree root:")
            console.log(treeRoot)

            return {
                fileTree: treeRoot,
                repoInfo: currentRepoInfo
            }
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

    ipcMain.handle("fetch-repo-issues", async (event, { owner, repo }) => {
        try {
            const response = await octokit.request("GET /repos/{owner}/{repo}/issues", {
                owner: owner,
                repo: repo,
                state: "open",
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            })

            const issues = response.data.filter(item => !item.pull_request)

            return issues
        } catch(err) {
            console.error("GitHub API Error:", err)
            throw new Error(`Failed to fetch issues: ${err.message}`)
        }
    })

    ipcMain.handle("save-issues-cache", async (event, { repoPath, issues }) => {
        try {
            await settings.set(`issues-cache.${repoPath}`, issues)
            console.log(`Successfully cached issues for: ${repoPath}`)
            return true
        } catch(err) {
            console.error("Error saving issues cache:", err)
            throw new Error("Could not save issues cache")
        }
    })

    ipcMain.handle("load-issues-cache", async (event, repoPath) => {
        try {
            const issues = await settings.get(`issues-cache.${repoPath}`)

            if (issues === undefined) {
                return []
            }

            console.log("Successfully loaded issues from cache")

            return issues
        } catch(err) {
            console.error("Error loading cached issues:", err)
            return []
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
