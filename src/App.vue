
<template>
    <div>
        <div v-if="fileList.length === 0" class="min-h-screen flex justify-center items-center flex-col">
            <h1 class="text-2xl text-white">Open source assistance system</h1>

            <div class="text-6xl text-center font-bold text-white">
                <h2 class="mt-2">
                    Open a code repository<br /> to get started
                </h2>
            </div>

            <button @click="openRepo" :disabled="isLoading" class="mt-8 bg-orange-500 px-4 py-2 rounded-sm">Open Repository</button>
        </div>

        <ul v-else class="bg-neutral-900 max-w-100">
            <li v-for="file in fileList">
                <FileTree :file />
            </li>
        </ul>
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import path from "path"
    import FileTree from "./components/FileTree.vue"

    const isLoading = ref(false)
    const error = ref(null)
    const repoPath = ref("")
    const fileList = ref([])

    const readRepoContent = async (path) => {
        isLoading.value = true
        error.value = null
        fileList.value = []

        try {
            const tree = await window.api.readDirectoryContent(path)

            fileList.value = tree
            console.log("Directory tree loaded:", tree)
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
            readRepoContent(repoPath.value)
        })
    })

    const openRepo = () => {
        isLoading.value = true
        error.value = null
        window.api.openDirectoryDialog()
    }
</script>
