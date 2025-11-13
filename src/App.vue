<template>
    <div class="mt-40">
        <div v-if="isHomeView" class="flex justify-center items-center flex-col">
            <h1 class="text-2xl text-white">Open source assistance system</h1>

            <div class="text-6xl text-center font-bold text-white">
                <h2 class="mt-2">
                    Open a code repository<br /> to get started
                </h2>
            </div>

            <div class="flex gap-x-12 mt-20 max-w-[1000px] w-full">
                <RecentlyUsedRepositories @open-recent-repository="handleOpenRecentRepository" class="grow" />
                <GetStarted @open-repo="openRepo" @show-clone-repository-popup="isCloneRepositoryPopupVisible = true" :isLoading />
            </div>

            <CloneRepositoryPopup v-if="isCloneRepositoryPopupVisible" @hide-clone-repository-popup="isCloneRepositoryPopupVisible = false"  @cloning-successful="readRepoContents" />
        </div>

        <div v-else>
            <div class="flex p-2 flex-col gap-2 absolute top-0 h-screen left-0 bg-neutral-800">
                <button @click="isHomeView = true" class="transition cursor-pointer flex items-center justify-center w-11 h-11 bg-neutral-800 rounded-md hover:bg-neutral-700">
                    <Home />
                </button>

                <div class="relative group/button">
                    <button
                        @click="toggleFileTree"
                        ref="fileTreeButton"
                        :class="{ 'bg-white! text-black': activePopover === 'fileTree' }"
                        class="transition w-11 h-11 cursor-pointer flex justify-center items-center bg-neutral-800 rounded-md hover:bg-neutral-700"
                    >
                        <Folder />
                    </button>

                    <div class="opacity-0 group-hover/button:opacity-1 absolute left-14 top-[50%] -translate-y-[50%] bg-neutral-800 whitespace-nowrap rounded-md px-2 py-1 pointer-events-none">
                        File Explorer
                    </div>
                </div>

                <button
                    @click="toggleChatbot"
                    ref="chatbotButton"
                    :class="{ 'bg-white! text-black': activePopover === 'chatbot' }"
                    class="transition w-11 h-11 cursor-pointer flex justify-center items-center bg-neutral-800 hover:bg-neutral-700 rounded-md"
                >
                    <BotMessageSquare />
                </button>

                <button
                    @click="toggleIssues"
                    ref="issuesButton"
                    :class="{ 'bg-white! text-black': activePopover === 'issues' }"
                    class="transition w-11 h-11 cursor-pointer flex justify-center items-center bg-neutral-800 rounded-md hover:bg-neutral-700"
                >
                    <CircleDot />
                </button>

                <button
                    :class="{ 'bg-white! text-black': activePopover === 'help' }"
                    class="transition mt-auto w-11 h-11 cursor-pointer flex justify-center items-center bg-neutral-800 rounded-md hover:bg-neutral-700"
                >
                    <CircleQuestionMark />
                </button>

                <button
                    :class="{ 'bg-white! text-black': activePopover === 'settings' }"
                    class="transition w-11 h-11 cursor-pointer flex justify-center items-center bg-neutral-800 rounded-md hover:bg-neutral-700"
                >
                    <Settings />
                </button>
            </div>

                     <!--<div class="absolute flex gap-2 top-4 left-[50%] -translate-x-[50%]">
                <button :class="{ 'bg-orange-500': isCanvasView }" class="px-4 py-2 bg-neutral-700" @click="isCanvasView = true">Canvas View</button>
                <button :class="{ 'bg-orange-500': !isCanvasView }" class="px-4 py-2 bg-neutral-700" @click="isCanvasView = false">File View</button>
            </div>-->

            <Canvas :fileTree />

            <!--<FileContents v-else :filePath="selectedFilePath" />-->

            <Panel
                v-if="activePopover === 'fileTree'"
                :icon="Folder"
                title="File Explorer"
                panelId="fileTree"
                @close-panel="closePanel"
            >
                <FileExplorer :fileTree />
            </Panel>

            <Panel
                v-if="activePopover === 'chatbot'" 
                :icon="BotMessageSquare"
                title="Chatbot"
                panelId="chatbot"
                @close-panel="closePanel"
                width="w-240"
            >
                <template v-slot:panelHeader>
                    <button
                        @click="repoStore.clearHistory()"
                        class="cursor-pointer h-11 px-3 flex items-center justify-center hover:bg-neutral-700 rounded-sm active:bg-neutral-600 gap-x-2"
                    >
                        <Trash :size="18" /> Clear Chat
                    </button>
                </template>

                <Chatbot />
            </Panel>

            <Panel
                v-if="activePopover === 'issues'"
                :icon="CircleDot"
                title="Issues"
                panelId="issues"
                @close-panel="closePanel"
                width="w-240"
            >
                <Issues
                    :issues
                    :ownerName
                    :repoName
                    @load-repo-issues="loadRepoIssues"
                />
            </Panel>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import path from "path"
    import FileTree from "./components/FileTree.vue"
    import FileContents from "./components/FileContents.vue"
    import Canvas from "./components/Canvas.vue"
    import RecentlyUsedRepositories from "./components/RecentlyUsedRepositories.vue"
    import Issues from "./components/Issues.vue"
    import GetStarted from "./components/GetStarted.vue"
    import CloneRepositoryPopup from "./components/CloneRepositoryPopup.vue"
    import { Home, CircleDot, Folder, BotMessageSquare, CircleQuestionMark, Settings, Trash } from "lucide-vue-next"
    import Chatbot from "./components/Chatbot.vue"
    import Panel from "./components/Panel.vue"
    import FileExplorer from "./components/FileExplorer.vue"
    import { useRepoStateStore } from "./stores/repoState.js"

    const repoStore = useRepoStateStore()

    const isLoading = ref(false)
    const error = ref(null)
    const repoPath = ref("")
    const fileTree = ref({})
 
    const isHomeView = ref(true)

    const isCanvasView = ref(true)

    const selectedFilePath = ref("")

    const issues = ref([])

    const ownerName = ref(null)
    const repoName = ref(null)

    const isCloneRepositoryPopupVisible = ref(false)

    const fileTreeButton = ref(null)
    const chatbotButton = ref(null)
    const issuesButton = ref(null)

    const fileTreeVisible = ref(false)
    const chatbotVisible = ref(false)
    const issuesVisible = ref(false)

    const activePopover = ref(null)

    const readRepoContents = async (path) => {
        console.log("readRepoContents path: " + path)
        console.log("typeof path: " + (typeof path))
        await window.api.saveRepository(path)

        isLoading.value = true
        error.value = null
        fileTree.value = {}

        ownerName.value = null
        repoName.value = null

        try {
            const { fileTree: tree, repoInfo } = await window.api.readDirectoryContents(path)

            fileTree.value = tree
            console.log("Filetree:", fileTree.value)

            console.log("Repo info", repoInfo)

            isHomeView.value = false

            await repoStore.loadRepoState(path)

            if (repoInfo && repoInfo.ownerName && repoInfo.repoName) {
                console.log("Inside readRepoContents: repoInfo.ownerName: " + repoInfo.ownerName + ", repoInfo.repoName: " + repoInfo.repoName)
                ownerName.value = repoInfo.ownerName
                repoName.value = repoInfo.repoName

                const cachedIssues = await window.api.loadIssuesCache(path)
                console.log("Cached issues:", cachedIssues)
                issues.value = cachedIssues
                console.log(`Loaded ${cachedIssues.length} issues from cache`)

                if (cachedIssues.length === 0) {
                    await fetchAndCacheIssues(repoInfo.ownerName, repoInfo.repoName, path)
                }
            } else {
                issues.value = []
            }
        } catch(err) {
            error.value = `File access error: ${err.message || err}`
            console.error(error.value, err)
        } finally {
            isLoading.value = false
        }
    }

    onMounted(() => {
        if (typeof window.api === "undefined")  {
            error.value = "window.api is not available"
            console.log(error.value)
            return
        }

        window.api.onDirectorySelectionCanceled(() => {
            isLoading.value = false
            error.value = "Selection canceled"
            console.log(error.value)
        })

        window.api.onSelectedDirectory((path) => {
            repoPath.value = path
            error.value = null
            console.log(repoPath.value)
            readRepoContents(repoPath.value)
        })
    })

    const openRepo = () => {
        isLoading.value = true
        error.value = null
        window.api.openDirectoryDialog()
    }

    const handleOpenRecentRepository = (path) => {
        console.log(`Open recent directory under path: ${path}`)
        repoPath.value = path
        readRepoContents(repoPath.value)
    }

    const fetchAndCacheIssues = async (owner, repo, repoPath) => {
        console.log("Fetching fresh issues from GitHub...")

        try {
            const freshIssues = await window.api.fetchRepoIssues(owner, repo)
            issues.value = freshIssues

            issues.value.forEach(issue => {
                issue["is_targeted"] = false
            })

            await window.api.saveIssuesCache(repoPath, freshIssues)

            console.log(`Successfully fetched and cached ${freshIssues.length} fresh open issues`)
        } catch(err) {
            console.error("Error fetching fresh issues:", err.message)
        }
    }

    const loadRepoIssues = async () => {
        if (ownerName.value && repoName.value) {
            await fetchAndCacheIssues(ownerName.value, repoName.value, repoPath.value)
        } else {
            console.warn("Cannot refresh issues: No GitHub repository detected")
        }
    }

    const togglePopover = (popoverName) => {
        if (activePopover.value === popoverName) {
            activePopover.value = null
        } else {
            activePopover.value = popoverName
        }
    }

    const toggleFileTree = () => togglePopover("fileTree")
    const toggleChatbot = () => togglePopover("chatbot")
    const toggleIssues = () => togglePopover("issues")
    const toggleHelp = () => togglePopover("help")
    const toggleSettings = () => togglePopover("settings")

    const closePanel = (panelId) => {
        togglePopover(panelId)
    }
</script>
