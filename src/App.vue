<template>
    <div>
        <div v-if="fileTree === undefined || Object.keys(fileTree).length === 0" class="flex justify-center items-center flex-col">
            <h1 class="text-2xl text-white">Open source assistance system</h1>

            <div class="text-6xl text-center font-bold text-white">
                <h2 class="mt-2">
                    Open a code repository<br /> to get started
                </h2>
            </div>

            <button @click="openRepo" :disabled="isLoading" class="mt-8 bg-orange-500 px-4 py-2 rounded-sm">Open Repository</button>
        </div>

        <div v-else>
            <ul class="absolute top-6 left-6 bg-neutral-800/85 max-w-100 rounded-md border border-neutral-500 backdrop-blur-sm py-2">
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

    const isLoading = ref(false)
    const error = ref(null)
    const repoPath = ref("")
    const fileTree = ref({})

    const isCanvasView = ref(true)

    const selectedFilePath = ref("")

    const readRepoContents = async (path) => {
        isLoading.value = true
        error.value = null
        fileTree.value = {}

        try {
            const tree = await window.api.readDirectoryContents(path)
            console.log("TREE: ")
            console.log(tree)
            console.log(typeof tree)

            fileTree.value = tree
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
</script>
