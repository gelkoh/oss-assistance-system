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
            <button @click="isHomeView = true" class="absolute top-6 left-6 flex items-center justify-center w-12 h-12 bg-neutral-800 border border-neutral-500 rounded-md hover:bg-neutral-700">
                <Home :size="18" />
            </button>

            <ul class="absolute top-24 left-6 bg-neutral-800/85 max-w-100 rounded-md border border-neutral-500 backdrop-blur-sm py-2">
                <li v-for="file in fileTree.children">
                    <FileTree :file class="min-w-xs border-none before:hidden after:hidden py-1" @file-selected="updateSelectedFilePath"/>
                </li>
            </ul>

            <!--<div class="absolute flex gap-2 top-4 left-[50%] -translate-x-[50%]">
                <button :class="{ 'bg-orange-500': isCanvasView }" class="px-4 py-2 bg-neutral-700" @click="isCanvasView = true">Canvas View</button>
                <button :class="{ 'bg-orange-500': !isCanvasView }" class="px-4 py-2 bg-neutral-700" @click="isCanvasView = false">File View</button>
            </div>-->

            <div>
                <Canvas v-if="isCanvasView" :fileTree />

                <FileContents v-else :filePath="selectedFilePath" />
                <Issues :issues :ownerName :repoName @load-repo-issues="loadRepoIssues" />
            </div>
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
    import { Home } from "lucide-vue-next"

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

            console.log("Repo info", repoInfo)

            isHomeView.value = false

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

    const updateSelectedFilePath  = (filePath) => {
        selectedFilePath.value = filePath
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
</script>
