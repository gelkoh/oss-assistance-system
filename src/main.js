import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "path"
import fs from "fs"
import { readFile } from "fs/promises"
import { fileURLToPath } from "url"
import settings from "electron-settings"
import { Octokit } from "@octokit/core"
import { exec } from "child_process"
import { Ollama } from "ollama"
import Parser from "tree-sitter"
import JavaScript from "tree-sitter-javascript"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let currentRepoInfo = { ownerName: null, repoName: null }

const octokit = new Octokit({})
const ollama = new Ollama({})

const parser = new Parser()
parser.setLanguage(JavaScript)

const MAX_CHUNK_SIZE = 1000

const readFileContents = async (filePath) => {
    try {
        const data = await readFile(filePath, "utf-8")
        return data
    } catch(err) {
        console.error(`An error occurred reading the file contents for ${filePath}:`, err)
        throw new Error(`Could not read file: ${err.message}`)
    }
}

const shouldAnalyzeFile = (fileName) => {
    // Only analyze JS files for testing
    return fileName.split(".").at(-1) === "js"
}

const detectLanguage = (filePath) => {
    if (filePath.split("/").at(-1)[0] === ".") return "dotfile"

    return filePath.split(".").at(-1)
}

const getGrammar = (language) => {
    switch(language) {
        case "js":
            return JavaScript
        default:
            return null
    }
}

const performChunking = (tree, codeContent) => {
    const chunks = []
    let currentChunk = []
    const lines = codeContent.split("\n")

    const lastLineNumber = tree.rootNode.child(tree.rootNode.childCount - 1)?.endPosition.row || lines.length
    let totalTokenCount = 0

    for (let i = 0; i < lastLineNumber; i++) {
        totalTokenCount += lines[i].length
    }

    if (totalTokenCount <= MAX_CHUNK_SIZE) {
          for (let i = 0; i < lastLineNumber; i++) {
            currentChunk.push(lines[i])
        }

        const chunkString = currentChunk.join("\n")
        const sanitizedChunkString = chunkString.replace(/[\t ]+/g, " ")

        chunks.push(sanitizedChunkString)

        return chunks;
    }

    let currentTokenCount = 0

    const childCount = tree.rootNode.childCount || 0

    for (let i = 0; i < childCount; i++) {
        const childNode = tree.rootNode.child(i)
        if (!childNode) continue

        const startLine = childNode.startPosition.row
        const endLine = childNode.endPosition.row

        let nextBlockTokens = 0
        let nextBlockLines = []

        for (let j = startLine; j < endLine; j++) {
            if (lines[j] !== undefined) {
                 nextBlockTokens += lines[j].length;
                 nextBlockLines.push(lines[j]);
            }
        }

        if (currentTokenCount + nextBlockTokens > MAX_CHUNK_SIZE && currentChunk.length > 0) {
            const chunkString = currentChunk.join("\n")
            const sanitizedChunkString = chunkString.replace(/[\t ]+/g, " ")
            chunks.push(sanitizedChunkString)

            currentChunk = []
            currentTokenCount = 0
        }

        currentTokenCount += nextBlockTokens
        currentChunk.push(...nextBlockLines)
    }

    if (currentChunk.length > 0) {
        const chunkString = currentChunk.join("\n")
        const sanitizedChunkString = chunkString.replace(/[\t ]+/g, " ")
        chunks.push(sanitizedChunkString)
    }

    return chunks
}

function buildTree(dirPath, currentDepth, allFilePathsCollector) {
    console.log("CALLED BUILD TREE")
    const stats = fs.statSync(dirPath)
    if (!stats.isDirectory()) return []

    let dirEntries

    try {
        dirEntries = fs.readdirSync(dirPath, { withFileTypes: true })
    } catch(err) {
        console.error("readdir failed for", dirPath, err)
        return []
    }

    const entryDepth = currentDepth + 1

    const filtered = dirEntries.filter(entry => {
        if (entry.name === "node_modules") return false

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

    return filtered.map((entry) => {
        const fullPath = path.join(dirPath, entry.name)
        const isDir = entry.isDirectory()

        const node = {
            name: entry.name,
            path: fullPath,
            type: isDir ? "directory" : "file",
            depth: entryDepth,
            children: []
        }

        if (isDir) {
            node.children = buildTree(fullPath, entryDepth, allFilePathsCollector) || []
        } else {
            if (shouldAnalyzeFile(entry.name)) {
                allFilePathsCollector.push(fullPath)
            }
        }

        return node
    })
}

function buildRepoTreeWrapper(repoPath) {
    const dirName = path.basename(repoPath)

    const allFilePaths = []

    const children = buildTree(repoPath, 0, allFilePaths) || []
    console.log("CHILDREN: ", children)
    console.log("CHILDREN LENGTH: ", children.length)

    return {
        name: "root",
        children: [{
            name: dirName,
            path: repoPath,
            type: "directory",
            depth: 0,
            children: children
        }],
        allFilePaths: allFilePaths
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
        } else {
            event.sender.send("directory-selection-canceled")
        }
    })

    ipcMain.handle("save-repository", async (event, repoPath) => {
        let recentlyUsedRepositoriesPaths = await settings.get("recentlyUsedRepositoriesPaths")
        console.log("recentlyUsedRepositoriesPaths: " + recentlyUsedRepositoriesPaths)
        console.log("repoPath: " + repoPath)
        console.log("typeof repoPath: " + (typeof repoPath))

        if (recentlyUsedRepositoriesPaths === undefined) {
            recentlyUsedRepositoriesPaths = [repoPath]
        } else if (!recentlyUsedRepositoriesPaths.includes(repoPath)) {
            recentlyUsedRepositoriesPaths.push(repoPath)
        }

        await settings.set("recentlyUsedRepositoriesPaths", recentlyUsedRepositoriesPaths)
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
            console.log("recentlyUsedRepositoriesPaths: " + recentlyUsedRepositoriesPaths)
            return recentlyUsedRepositoriesPaths
        } catch(err) {
            console.error("An error occurred getting the recently used repositories", err)
            throw new Error("Could not get the recently used repositories")
        }
    })

    ipcMain.handle("remove-recently-used-repository", async (event, repoPath) => {
        try {
            let recentlyUsedRepositoriesPaths = await settings.get("recentlyUsedRepositoriesPaths")

            recentlyUsedRepositoriesPaths = recentlyUsedRepositoriesPaths.filter(path => {
                if (path === repoPath) {
                    return false
                }

                return true
            })

            await settings.set("recentlyUsedRepositoriesPaths", recentlyUsedRepositoriesPaths)
            await settings.unset(`issues-cache.${repoPath}`)
        } catch(err) {
            console.error(`An error occurred removing the repository under: ${repoPath} from the recently used repositories`)
        }
    })

    ipcMain.handle("open-path", (event, filePath) => {
        try {
            console.log("File to be opened: " + filePath)
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

    ipcMain.handle("clone-repository", (event, { url, localPath }) => {
        let repoName

        try {
            const urlParts = url.split("/")

            repoName = urlParts.pop()

            if (repoName.endsWith(".git")) {
                repoName = repoName.slice(0, -4)
            }

            if (!repoName) {
                throw new Error("Couldn't extract repository name from the URL")
            }
        } catch(err) {
            return Promise.reject(new Error(`Invalid repository URL: ${url}`))
        }

        const finalTargetPath = path.join(localPath, repoName)

        const command = `git clone ${url} "${finalTargetPath}"`

        console.log(`Executing clone command: ${command}`)

        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Git Clone Error (Code ${error.code}): ${stderr}`)

                    const errorMessage = stderr || stdout || "Unknown Git-Error."

                    if (error.code === 127) {
                        reject(new Error("The 'git'-command wasn't found. Please make sure that Git is installed and available in your PATH"))
                    } else {
                        reject(new Error(`Cloning failed: ${errorMessage.trim()}`))
                    }

                    return
                }

                console.log(`Repository cloned successfully to ${finalTargetPath}`)
                resolve({ success: true, path: finalTargetPath })
            })
        })
    })

    ipcMain.handle("open-target-directory-dialog", async (event) => {
        const senderWindow = BrowserWindow.fromWebContents(event.sender)

        const result = await dialog.showOpenDialog(senderWindow, {
            properties: ["openDirectory"]
        })

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0]
        } else {
            return null
        }
    })

    ipcMain.handle("send-chatbot-message", async (event, { model, chatHistory }) => {
        const messages = [...chatHistory]

        try {
            console.log(`Sending prompt to Ollama model ${model}...`)

            const response = await ollama.chat({
                model: model,
                messages: messages
            })

            return response.message.content.trim()
        } catch(err) {
            console.error("Error communicating with Ollama: ", err)

            if (err.message && err.message.includes("connect ECONNREFUSED")) {
                throw new Error("Ollama server not reachable. Please start Ollama.")
            }

            if (err.message && err.message.includes("pull") || err.message.includes("not found")) {
                throw new Error(`Model: '${model}' not found. Please run 'ollama pull ${model}'.`)
            }

            throw new Error(`Chatbot error: ${err.message}`)
        }
    })

    ipcMain.handle("loadRepoState", async (event, repoPath) => {
        const state = await settings.get(`repo-state.${repoPath}`)
        return state || {}
    })

    ipcMain.handle("saveRepoState", async (event, repoPath, state) => {
        await settings.set(`repo-state.${repoPath}`, state)
    })

    ipcMain.handle("analyze-chunk", async (event, { model, messages }) => {
        try {
            console.log(`Sending prompt to Ollama model ${model}...`)

            const response = await ollama.chat({
                model: model,
                messages: messages
            })

            return response.message.content.trim()
        } catch(err) {
            console.error("Error communicating with Ollama: ", err)

            if (err.message && err.message.includes("connect ECONNREFUSED")) {
                throw new Error("Ollama server not reachable. Please start Ollama.")
            }
            if (err.message && err.message.includes("pull") || err.message.includes("not found")) {
                throw new Error(`Model: '${model}' not found. Please run 'ollama pull ${model}'.`)
            }

            throw new Error(`Code analysis error: ${err.message}`)
        }
    })

    ipcMain.handle("process-repo-files", async (event, filePaths) => {
        const analysisResults = []

        const promises = filePaths.map(async (filePath) => {
            try {
                const language = detectLanguage(filePath)

                const codeContent = await fs.promises.readFile(filePath, "utf-8")

                parser.setLanguage(getGrammar(language))

                const tree = parser.parse(codeContent)

                console.log("FILEPATH:", filePath)
                let chunks = performChunking(tree, codeContent)
                //console.log("CHUNKS:", chunks)
                console.log("    ")
                console.log("    ")
                console.log("    ")

                analysisResults.push({ filePath, status: "success", language: language, chunks: chunks })
            } catch(err) {
                analysisResults.push({ filePath, status: "error", message: err.message })
            }
        })

        await Promise.allSettled(promises)

        return { success: true, analysisResults: analysisResults, processedCount: analysisResults.length }
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
