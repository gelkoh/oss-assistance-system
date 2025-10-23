
<template>
    <h1>Hello World!</h1>
    <button @click="openRepo" :disabled="isLoading" class="bg-green-500 px-4 py-2">Open Repository</button>

    <FileTree :files="fileList" v-if="fileList.length > 0" />
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
